/**
 * Enemy AI System
 * Handles all enemy AI logic including:
 * - Patrol patterns and movement
 * - Aggro detection and targeting
 * - Chase behavior
 * - Leash/reset behavior
 * - Return to spawn
 * 
 * Note: Combat damage resolution remains in GameWorld.jsx
 * This system only handles AI behavior and movement
 * 
 * Extracted from GameWorld.jsx for modularity
 */

// AI Constants
export const AI_CONSTANTS = {
  AGGRO_RANGE: 8,        // Distance at which enemies aggro
  LEASH_RANGE: 40,       // Distance at which enemies reset
  MELEE_RANGE: 5,        // Melee attack range
  PATROL_SPEED: 2,       // Units per second while patrolling
  CHASE_SPEED: 4,        // Units per second while chasing
  RETURN_SPEED: 6,       // Units per second returning to spawn
  SPREAD_DISTANCE: 2,    // Distance enemies spread around player
  NUM_SPREAD_SLOTS: 8    // Number of positions around player
};

// Available patrol patterns
export const PATROL_PATTERNS = ['circle', 'figure8', 'triangle', 'line', 'diamond', 'zigzag', 'square'];

/**
 * Generate patrol waypoints based on pattern type
 * @param {string} patternType - Type of patrol pattern
 * @param {number} radius - Patrol radius
 * @returns {Array<{x: number, z: number}>} Array of patrol points
 */
export const getPatrolPattern = (patternType, radius) => {
  switch (patternType) {
    case 'circle': // Circular patrol - 8 points around a circle
      return Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
      });
    case 'figure8': // Figure-8 pattern
      return Array.from({ length: 16 }, (_, i) => {
        const t = (i / 16) * Math.PI * 2;
        return { x: Math.sin(t) * radius, z: Math.sin(t * 2) * radius * 0.5 };
      });
    case 'triangle': // Triangle patrol
      return [
        { x: 0, z: radius },
        { x: radius * 0.866, z: -radius * 0.5 },
        { x: -radius * 0.866, z: -radius * 0.5 }
      ];
    case 'line': // Back and forth line patrol
      return [
        { x: radius, z: 0 },
        { x: -radius, z: 0 }
      ];
    case 'diamond': // Diamond/rhombus patrol
      return [
        { x: 0, z: radius },
        { x: radius, z: 0 },
        { x: 0, z: -radius },
        { x: -radius, z: 0 }
      ];
    case 'zigzag': // Zigzag patrol pattern
      return [
        { x: radius, z: radius },
        { x: -radius * 0.5, z: radius * 0.3 },
        { x: radius * 0.5, z: -radius * 0.3 },
        { x: -radius, z: -radius }
      ];
    case 'square': // Original square pattern
    default:
      return [
        { x: radius, z: 0 },
        { x: radius, z: radius },
        { x: 0, z: radius },
        { x: -radius, z: radius },
        { x: -radius, z: 0 },
        { x: -radius, z: -radius },
        { x: 0, z: -radius },
        { x: radius, z: -radius }
      ];
  }
};

/**
 * Create initial patrol data for an enemy
 * @param {number} timestamp - Current timestamp
 * @returns {Object} Patrol state object
 */
export const createPatrolData = (timestamp = Date.now()) => {
  const randomPatternIndex = Math.floor(Math.random() * PATROL_PATTERNS.length);
  return {
    patrolState: 0,
    lastStateChange: timestamp,
    patrolWaitTime: 2000 + Math.random() * 2000,
    patternType: PATROL_PATTERNS[randomPatternIndex],
    patternOffset: Math.random() * Math.PI * 2
  };
};

/**
 * Create initial combat state for an enemy
 * @param {Object} enemyMesh - The enemy mesh
 * @returns {Object} Combat state object
 */
export const createCombatState = (enemyMesh) => ({
  inCombat: false,
  aggroTarget: null,
  lastAttack: 0,
  notifiedAggro: false,
  notifiedReset: false,
  spawnPos: {
    x: enemyMesh.userData.spawnX || enemyMesh.position.x,
    z: enemyMesh.userData.spawnZ || enemyMesh.position.z
  }
});

/**
 * Calculate 2D distance between two points (ignoring Y)
 * @param {Object} pos1 - First position {x, z} or {position: {x, z}}
 * @param {Object} pos2 - Second position {x, z} or {position: {x, z}}
 * @returns {number} Distance
 */
export const getDistance2D = (pos1, pos2) => {
  const x1 = pos1.position ? pos1.position.x : pos1.x;
  const z1 = pos1.position ? pos1.position.z : pos1.z;
  const x2 = pos2.position ? pos2.position.x : pos2.x;
  const z2 = pos2.position ? pos2.position.z : pos2.z;
  
  const dx = x1 - x2;
  const dz = z1 - z2;
  return Math.sqrt(dx * dx + dz * dz);
};

/**
 * Calculate spread position around player for an enemy
 * @param {string} enemyId - Enemy ID for consistent slot assignment
 * @param {Object} playerPos - Player position
 * @param {number} spreadDistance - Distance from player (default: 2)
 * @returns {Object} Target position {x, z}
 */
export const calculateSpreadPosition = (enemyId, playerPos, spreadDistance = AI_CONSTANTS.SPREAD_DISTANCE) => {
  const enemyIdHash = enemyId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const slotAngle = (enemyIdHash % AI_CONSTANTS.NUM_SPREAD_SLOTS) * (Math.PI * 2 / AI_CONSTANTS.NUM_SPREAD_SLOTS);
  
  return {
    x: playerPos.x + Math.cos(slotAngle) * spreadDistance,
    z: playerPos.z + Math.sin(slotAngle) * spreadDistance
  };
};

/**
 * Update enemy patrol behavior
 * @param {Object} enemyMesh - The enemy mesh
 * @param {Object} patrolData - Patrol data for this enemy
 * @param {number} delta - Time delta in seconds
 * @param {number} timestamp - Current timestamp
 * @param {Function} getTerrainHeight - Function to get terrain height
 * @param {Object} camera - Camera for health bar facing (optional)
 * @returns {boolean} True if enemy moved
 */
export const updatePatrol = (enemyMesh, patrolData, delta, timestamp, getTerrainHeight, camera = null) => {
  const patrolSpeed = AI_CONSTANTS.PATROL_SPEED * delta;
  const patrolRadius = enemyMesh.userData.patrolRadius || 5;
  const spawnX = enemyMesh.userData.spawnX;
  const spawnZ = enemyMesh.userData.spawnZ;
  
  // If no patrol radius, stay stationary
  if (patrolRadius <= 0) {
    updateHealthBarFacing(enemyMesh, camera);
    return false;
  }
  
  // Check spawn position is valid
  if (spawnX === undefined || spawnZ === undefined) {
    return false;
  }
  
  // Get patrol points based on enemy's assigned pattern
  const patrolOffsets = getPatrolPattern(patrolData.patternType, patrolRadius);
  
  const currentPatrolState = patrolData.patrolState % patrolOffsets.length;
  const targetX = spawnX + patrolOffsets[currentPatrolState].x;
  const targetZ = spawnZ + patrolOffsets[currentPatrolState].z;
  
  // Calculate distance to target
  const dx = targetX - enemyMesh.position.x;
  const dz = targetZ - enemyMesh.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  let moved = false;
  
  if (distance > 0.3) {
    // Move towards target
    const moveX = (dx / distance) * patrolSpeed;
    const moveZ = (dz / distance) * patrolSpeed;
    
    enemyMesh.position.x += moveX;
    enemyMesh.position.z += moveZ;
    
    // Update Y position based on terrain
    const terrainY = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
    enemyMesh.position.y = terrainY;
    
    // Face movement direction
    const angle = Math.atan2(dx, dz);
    enemyMesh.rotation.y = angle;
    moved = true;
  } else {
    // Reached target, wait then move to next patrol point
    if (timestamp - patrolData.lastStateChange > patrolData.patrolWaitTime) {
      patrolData.patrolState = (patrolData.patrolState + 1) % patrolOffsets.length;
      patrolData.lastStateChange = timestamp;
      patrolData.patrolWaitTime = 2000 + Math.random() * 2000;
    }
  }
  
  // Make health bar face camera
  updateHealthBarFacing(enemyMesh, camera);
  
  return moved;
};

/**
 * Update enemy facing toward player (when in combat)
 * @param {Object} enemyMesh - The enemy mesh
 * @param {Object} player - Player mesh
 * @param {Object} camera - Camera for health bar facing
 */
export const updateCombatFacing = (enemyMesh, player, camera = null) => {
  if (!player) return;
  
  const dx = player.position.x - enemyMesh.position.x;
  const dz = player.position.z - enemyMesh.position.z;
  const angle = Math.atan2(dx, dz);
  enemyMesh.rotation.y = angle;
  
  updateHealthBarFacing(enemyMesh, camera);
};

/**
 * Make health bar face camera
 * @param {Object} enemyMesh - The enemy mesh
 * @param {Object} camera - Camera to face
 */
export const updateHealthBarFacing = (enemyMesh, camera) => {
  if (!camera) return;
  
  const healthBarBg = enemyMesh.getObjectByName('healthBarBg');
  const healthBarFill = enemyMesh.getObjectByName('healthBarFill');
  if (healthBarBg) {
    healthBarBg.lookAt(camera.position);
  }
  if (healthBarFill) {
    healthBarFill.lookAt(camera.position);
  }
};

/**
 * Check if enemy should aggro on player
 * @param {Object} enemyMesh - The enemy mesh
 * @param {Object} player - Player mesh
 * @param {Object} combatState - Enemy combat state
 * @param {boolean} playerIsDead - Whether player is dead
 * @param {boolean} playerIsGhost - Whether player is a ghost
 * @returns {boolean} True if enemy should aggro
 */
export const shouldAggro = (enemyMesh, player, combatState, playerIsDead, playerIsGhost) => {
  if (!player || !enemyMesh.userData.hostile) return false;
  if (playerIsDead || playerIsGhost) return false;
  if (combatState.inCombat) return false;
  
  const distance = getDistance2D(enemyMesh, player);
  return distance <= AI_CONSTANTS.AGGRO_RANGE;
};

/**
 * Check if enemy should reset (leash)
 * @param {Object} enemyMesh - The enemy mesh
 * @param {Object} player - Player mesh
 * @param {Object} combatState - Enemy combat state
 * @returns {boolean} True if enemy should reset
 */
export const shouldLeash = (enemyMesh, player, combatState) => {
  const distanceToPlayer = getDistance2D(enemyMesh, player);
  const distanceToSpawn = getDistance2D(enemyMesh.position, combatState.spawnPos);
  
  return distanceToPlayer > AI_CONSTANTS.LEASH_RANGE || distanceToSpawn > AI_CONSTANTS.LEASH_RANGE;
};

/**
 * Move enemy back to spawn position
 * @param {Object} enemyMesh - The enemy mesh
 * @param {Object} combatState - Enemy combat state
 * @param {number} delta - Time delta
 * @param {Function} getTerrainHeight - Function to get terrain height
 * @returns {boolean} True if reached spawn
 */
export const moveToSpawn = (enemyMesh, combatState, delta, getTerrainHeight) => {
  const dxSpawn = combatState.spawnPos.x - enemyMesh.position.x;
  const dzSpawn = combatState.spawnPos.z - enemyMesh.position.z;
  const returnDist = Math.sqrt(dxSpawn * dxSpawn + dzSpawn * dzSpawn);
  
  if (returnDist > 0.5) {
    const returnSpeed = AI_CONSTANTS.RETURN_SPEED * delta;
    enemyMesh.position.x += (dxSpawn / returnDist) * returnSpeed;
    enemyMesh.position.z += (dzSpawn / returnDist) * returnSpeed;
    enemyMesh.position.y = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
    
    const angle = Math.atan2(dxSpawn, dzSpawn);
    enemyMesh.rotation.y = angle;
    return false;
  } else {
    // Reached spawn, snap to exact position
    enemyMesh.position.x = combatState.spawnPos.x;
    enemyMesh.position.z = combatState.spawnPos.z;
    enemyMesh.position.y = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
    return true;
  }
};

/**
 * Move enemy to chase player
 * @param {Object} enemyMesh - The enemy mesh
 * @param {Object} player - Player mesh
 * @param {string} enemyId - Enemy ID for spread calculation
 * @param {number} delta - Time delta
 * @param {Function} getTerrainHeight - Function to get terrain height
 * @returns {boolean} True if in melee range
 */
export const chasePlayer = (enemyMesh, player, enemyId, delta, getTerrainHeight) => {
  const distanceToPlayer = getDistance2D(enemyMesh, player);
  
  if (distanceToPlayer > AI_CONSTANTS.MELEE_RANGE) {
    // Calculate spread position
    const targetPos = calculateSpreadPosition(enemyId, player.position);
    
    const dxTarget = targetPos.x - enemyMesh.position.x;
    const dzTarget = targetPos.z - enemyMesh.position.z;
    const distToTarget = Math.sqrt(dxTarget * dxTarget + dzTarget * dzTarget);
    
    if (distToTarget > 0.3) {
      const chaseSpeed = AI_CONSTANTS.CHASE_SPEED * delta;
      enemyMesh.position.x += (dxTarget / distToTarget) * chaseSpeed;
      enemyMesh.position.z += (dzTarget / distToTarget) * chaseSpeed;
      enemyMesh.position.y = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
    }
    
    // Face player
    const dx = player.position.x - enemyMesh.position.x;
    const dz = player.position.z - enemyMesh.position.z;
    const angle = Math.atan2(dx, dz);
    enemyMesh.rotation.y = angle;
    
    return false;
  }
  
  return true; // In melee range
};

/**
 * Drift enemy toward ideal spread position while in melee range
 * @param {Object} enemyMesh - The enemy mesh
 * @param {Object} player - Player mesh
 * @param {string} enemyId - Enemy ID for spread calculation
 * @param {number} delta - Time delta
 * @param {Function} getTerrainHeight - Function to get terrain height
 */
export const maintainSpreadPosition = (enemyMesh, player, enemyId, delta, getTerrainHeight) => {
  const targetPos = calculateSpreadPosition(enemyId, player.position);
  const driftSpeed = 1.5 * delta;
  
  enemyMesh.position.x += (targetPos.x - enemyMesh.position.x) * driftSpeed;
  enemyMesh.position.z += (targetPos.z - enemyMesh.position.z) * driftSpeed;
  enemyMesh.position.y = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
  
  // Face player
  const dx = player.position.x - enemyMesh.position.x;
  const dz = player.position.z - enemyMesh.position.z;
  const angle = Math.atan2(dx, dz);
  enemyMesh.rotation.y = angle;
};

/**
 * Reset enemy to full health
 * @param {Object} enemyMesh - The enemy mesh
 */
export const resetEnemyHealth = (enemyMesh) => {
  enemyMesh.userData.currentHealth = enemyMesh.userData.maxHealth;
  const healthBarFill = enemyMesh.getObjectByName('healthBarFill');
  if (healthBarFill) {
    healthBarFill.scale.x = 1;
    healthBarFill.position.x = 0;
  }
};

/**
 * Reset combat state for an enemy
 * @param {Object} combatState - Combat state to reset
 */
export const resetCombatState = (combatState) => {
  combatState.inCombat = false;
  combatState.aggroTarget = null;
  combatState.notifiedReset = false;
  combatState.notifiedAggro = false;
};

/**
 * Activate aggro on an enemy
 * @param {Object} combatState - Combat state
 * @param {Object} player - Player to aggro on
 * @param {number} timestamp - Current timestamp (seconds)
 */
export const activateAggro = (combatState, player, timestamp) => {
  combatState.inCombat = true;
  combatState.aggroTarget = player;
  combatState.lastAttack = timestamp - 2; // Allow attack after 0.5s
};

export default {
  AI_CONSTANTS,
  PATROL_PATTERNS,
  getPatrolPattern,
  createPatrolData,
  createCombatState,
  getDistance2D,
  calculateSpreadPosition,
  updatePatrol,
  updateCombatFacing,
  updateHealthBarFacing,
  shouldAggro,
  shouldLeash,
  moveToSpawn,
  chasePlayer,
  maintainSpreadPosition,
  resetEnemyHealth,
  resetCombatState,
  activateAggro
};
