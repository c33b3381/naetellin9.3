/**
 * Player Movement System
 * Handles all player movement logic including:
 * - WASD movement
 * - Jump and gravity
 * - Terrain following
 * - Water slowdown
 * - World bounds clamping
 * 
 * Extracted from GameWorld.jsx for modularity
 */

import * as THREE from 'three';

// Movement state structure (for reference)
// {
//   forward: false,
//   backward: false,
//   left: false,
//   right: false,
//   jump: false,
//   isJumping: false,
//   velocityY: 0,
//   autoRun: false
// }

// Constants
const MOVE_SPEED = 8; // units per second
const JUMP_VELOCITY = 0.2;
const GRAVITY = 0.01;
const WATER_SLOWDOWN = 0.3; // 30% slower in water
const WORLD_BOUND = 290;
const TERRAIN_FOLLOW_SPEED = 10;

/**
 * Create initial movement state
 * @returns {Object} Initial movement state object
 */
export const createMovementState = () => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  isJumping: false,
  velocityY: 0,
  autoRun: false
});

/**
 * Handle keydown for movement
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} movementState - Movement state ref.current
 * @returns {boolean} Whether the key was handled
 */
export const handleMovementKeyDown = (e, movementState) => {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      movementState.forward = true;
      return true;
    case 'KeyS':
    case 'ArrowDown':
      movementState.backward = true;
      return true;
    case 'KeyA':
    case 'ArrowLeft':
      movementState.left = true;
      return true;
    case 'KeyD':
    case 'ArrowRight':
      movementState.right = true;
      return true;
    case 'Space':
      if (!movementState.isJumping) {
        movementState.jump = true;
        movementState.isJumping = true;
        movementState.velocityY = JUMP_VELOCITY;
      }
      return true;
    case 'NumLock':
      movementState.autoRun = !movementState.autoRun;
      return true;
    default:
      return false;
  }
};

/**
 * Handle keyup for movement
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} movementState - Movement state ref.current
 * @returns {boolean} Whether the key was handled
 */
export const handleMovementKeyUp = (e, movementState) => {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      movementState.forward = false;
      return true;
    case 'KeyS':
    case 'ArrowDown':
      movementState.backward = false;
      return true;
    case 'KeyA':
    case 'ArrowLeft':
      movementState.left = false;
      return true;
    case 'KeyD':
    case 'ArrowRight':
      movementState.right = false;
      return true;
    default:
      return false;
  }
};

/**
 * Calculate movement direction based on input state
 * @param {Object} movement - Movement state
 * @param {Object} cameraState - Camera state with rotation and mouse buttons
 * @returns {THREE.Vector3} Normalized direction vector
 */
export const calculateMovementDirection = (movement, cameraState) => {
  const direction = new THREE.Vector3();
  
  // Both mouse buttons = move forward
  if (cameraState.isLeftMouseDown && cameraState.isRightMouseDown) {
    direction.z = -1;
  } else {
    if (movement.forward || movement.autoRun) direction.z -= 1;
    if (movement.backward) direction.z += 1;
  }
  
  if (movement.left) direction.x -= 1;
  if (movement.right) direction.x += 1;
  
  if (direction.length() > 0) {
    direction.normalize();
  }
  
  return direction;
};

/**
 * Get terrain height using raycasting
 * @param {THREE.Scene} scene - The scene containing terrain
 * @param {number} x - X position
 * @param {number} z - Z position
 * @param {Function} fallbackGetHeight - Fallback height function
 * @returns {number} Terrain height at position
 */
export const getTerrainHeightAtPosition = (scene, x, z, fallbackGetHeight) => {
  const terrainMesh = scene?.getObjectByName('terrain');
  
  if (terrainMesh) {
    const rayOrigin = new THREE.Vector3(x, 100, z);
    const rayDirection = new THREE.Vector3(0, -1, 0);
    const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);
    
    const intersects = raycaster.intersectObject(terrainMesh);
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }
  }
  
  // Fallback to function if raycast fails
  return fallbackGetHeight(x, z);
};

/**
 * Check for collision with buildings/obstacles in a specific direction
 * Uses raycasting to detect nearby obstacles
 * OPTIMIZED: Single height check, early exit on collision
 * 
 * @param {THREE.Object3D} player - Player mesh/group
 * @param {THREE.Scene} scene - The scene
 * @param {THREE.Vector3} direction - Direction to check (not normalized, will be used as-is)
 * @param {number} checkRadius - Radius to check for collisions (default 1.0, increased for less sticky feel)
 * @returns {boolean} True if collision detected in that direction
 */
export const checkBuildingCollisionInDirection = (player, scene, direction, checkRadius = 1.0) => {
  if (!player || !scene) return false;
  
  const raycaster = new THREE.Raycaster();
  
  // Single height check at chest level (waist check removed for performance)
  const playerPos = player.position.clone();
  playerPos.y += 1.0; // Chest height
  
  raycaster.set(playerPos, direction);
  
  // Raycast against all scene children recursively
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  for (const intersect of intersects) {
    const obj = intersect.object;
    
    // Early exit if beyond check radius
    if (intersect.distance >= checkRadius) {
      break; // Intersects are sorted by distance
    }
    
    // Skip terrain, player, water, and other non-solid objects
    if (obj.name === 'terrain' || 
        obj.name === 'brushIndicator' ||
        obj.name?.includes('water') ||
        obj.name?.includes('player') ||
        obj.parent === player) {
      continue;
    }
    
    // Skip decorative/non-blocking child meshes
    if (obj.name === 'door' ||
        obj.name?.includes('window') ||
        obj.name?.includes('roof') ||
        obj.name?.includes('banner') ||
        obj.name?.includes('torch') ||
        obj.name?.includes('flame') ||
        obj.name?.includes('courtyard')) {
      continue;
    }
    
    // Check if this object or its parent is marked as collidable/building
    let currentObj = obj;
    let isCollidable = false;
    
    while (currentObj && !isCollidable) {
      const userData = currentObj.userData || {};
      
      // Check for collision markers
      if (userData.hasCollision || 
          userData.type === 'building' || 
          userData.type === 'castle' ||
          currentObj.name === 'collider') {
        isCollidable = true;
        break;
      }
      
      currentObj = currentObj.parent;
    }
    
    // If collidable and within check radius, collision detected
    if (isCollidable) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check for collision with buildings/obstacles (legacy function)
 * Uses raycasting in 8 directions to detect nearby obstacles
 * 
 * @param {THREE.Object3D} player - Player mesh/group
 * @param {THREE.Scene} scene - The scene
 * @param {number} checkRadius - Radius to check for collisions (default 1.0)
 * @returns {boolean} True if collision detected
 */
export const checkBuildingCollision = (player, scene, checkRadius = 1.0) => {
  if (!player || !scene) return false;
  
  // Check 8 directions around player
  const directions = [
    new THREE.Vector3(1, 0, 0),    // East
    new THREE.Vector3(-1, 0, 0),   // West
    new THREE.Vector3(0, 0, 1),    // North
    new THREE.Vector3(0, 0, -1),   // South
    new THREE.Vector3(0.707, 0, 0.707),   // NE
    new THREE.Vector3(-0.707, 0, 0.707),  // NW
    new THREE.Vector3(0.707, 0, -0.707),  // SE
    new THREE.Vector3(-0.707, 0, -0.707), // SW
  ];
  
  for (const direction of directions) {
    if (checkBuildingCollisionInDirection(player, scene, direction, checkRadius)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Update player movement
 * Main function to be called every frame
 * 
 * @param {THREE.Object3D} player - Player mesh/group
 * @param {Object} movementState - Movement state ref.current
 * @param {Object} cameraState - Camera state ref.current
 * @param {THREE.Scene} scene - The scene
 * @param {number} delta - Time delta in seconds
 * @param {THREE.Vector3} lastPlayerPos - Last known good position (mutated)
 * @param {Object} options - Additional options
 * @param {Function} options.getTerrainHeight - Function to get terrain height
 * @param {Function} options.isInWater - Function to check if in water
 * @param {Function} options.getWaterDepth - Function to get water depth
 * @param {boolean} options.justTeleported - Whether player just teleported
 * @returns {Object} Result with rotatedDirection for other systems
 */
export const updatePlayerMovement = (
  player,
  movementState,
  cameraState,
  scene,
  delta,
  lastPlayerPos,
  options = {}
) => {
  const {
    getTerrainHeight,
    isInWater,
    getWaterDepth,
    justTeleported = false
  } = options;
  
  if (!player) {
    return { moved: false, rotatedDirection: new THREE.Vector3() };
  }
  
  // Check for sudden position change (teleportation detection)
  // If player moved more than 50 units in one frame, it's a bug - REVERT
  const posDiff = player.position.distanceTo(lastPlayerPos);
  if (posDiff > 50 && (lastPlayerPos.x !== 0 || lastPlayerPos.z !== 0) && !justTeleported) {
    player.position.x = lastPlayerPos.x;
    player.position.z = lastPlayerPos.z;
    return { moved: false, rotatedDirection: new THREE.Vector3(), reverted: true };
  }
  
  // Update last known position BEFORE any movement
  lastPlayerPos.copy(player.position);
  
  // Calculate movement
  const moveSpeed = MOVE_SPEED * delta;
  const direction = calculateMovementDirection(movementState, cameraState);
  
  let rotatedDirection = new THREE.Vector3();
  let moved = false;
  
  if (direction.length() > 0) {
    moved = true;
    
    // Rotate direction based on camera yaw
    rotatedDirection = direction.clone();
    rotatedDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraState.rotationY);
    
    // ==================== AXIS-SEPARATED COLLISION FOR WALL SLIDING ====================
    // Instead of moving both axes and reverting both on collision,
    // we test X and Z separately to allow sliding along walls
    
    const deltaX = rotatedDirection.x * moveSpeed;
    const deltaZ = rotatedDirection.z * moveSpeed;
    
    // Test X-axis movement
    if (Math.abs(deltaX) > 0.001) {
      player.position.x += deltaX;
      
      // Check collision in X direction (1.0 unit radius for less sticky feel)
      const xDirection = new THREE.Vector3(Math.sign(deltaX), 0, 0);
      if (checkBuildingCollisionInDirection(player, scene, xDirection, 1.0)) {
        // X-axis collision - revert X only
        player.position.x = lastPlayerPos.x;
      }
    }
    
    // Test Z-axis movement
    if (Math.abs(deltaZ) > 0.001) {
      player.position.z += deltaZ;
      
      // Check collision in Z direction (1.0 unit radius for less sticky feel)
      const zDirection = new THREE.Vector3(0, 0, Math.sign(deltaZ));
      if (checkBuildingCollisionInDirection(player, scene, zDirection, 1.0)) {
        // Z-axis collision - revert Z only
        player.position.z = lastPlayerPos.z;
      }
    }
    
    // Check if we actually moved (at least one axis succeeded)
    const actuallyMoved = (player.position.x !== lastPlayerPos.x) || (player.position.z !== lastPlayerPos.z);
    
    if (actuallyMoved) {
      // Rotate player to face movement direction (only if we moved)
      const targetRotation = Math.atan2(rotatedDirection.x, rotatedDirection.z);
      player.rotation.y = targetRotation;
    } else {
      // Both axes blocked - no movement
      moved = false;
      rotatedDirection.set(0, 0, 0);
    }
  }
  
  // Get terrain height
  const terrainHeight = getTerrainHeightAtPosition(scene, player.position.x, player.position.z, getTerrainHeight);
  
  // Check water
  const inWater = isInWater ? isInWater(player.position.x, player.position.z) : false;
  const waterDepth = inWater && getWaterDepth ? getWaterDepth(player.position.x, player.position.z) : 0;
  
  // Target height (terrain minus water if in water)
  const targetY = inWater ? Math.max(terrainHeight, 0.3 - waterDepth * 0.5) : terrainHeight;
  
  // Jump physics
  if (movementState.isJumping) {
    movementState.velocityY -= GRAVITY;
    player.position.y += movementState.velocityY;
    
    if (player.position.y <= targetY) {
      player.position.y = targetY;
      movementState.isJumping = false;
      movementState.velocityY = 0;
    }
  } else {
    // Smooth terrain following when not jumping
    const heightDiff = targetY - player.position.y;
    if (Math.abs(heightDiff) > 0.01) {
      player.position.y += heightDiff * Math.min(1, delta * TERRAIN_FOLLOW_SPEED);
    } else {
      player.position.y = targetY;
    }
  }
  
  // Slow down in water
  if (inWater && rotatedDirection.length() > 0) {
    player.position.x -= rotatedDirection.x * moveSpeed * WATER_SLOWDOWN;
    player.position.z -= rotatedDirection.z * moveSpeed * WATER_SLOWDOWN;
  }
  
  // Clamp position to world bounds
  if (player.position.x > WORLD_BOUND) player.position.x = WORLD_BOUND;
  if (player.position.x < -WORLD_BOUND) player.position.x = -WORLD_BOUND;
  if (player.position.z > WORLD_BOUND) player.position.z = WORLD_BOUND;
  if (player.position.z < -WORLD_BOUND) player.position.z = -WORLD_BOUND;
  
  return {
    moved,
    rotatedDirection,
    inWater,
    terrainHeight: targetY
  };
};

export default {
  createMovementState,
  handleMovementKeyDown,
  handleMovementKeyUp,
  updatePlayerMovement,
  calculateMovementDirection,
  getTerrainHeightAtPosition,
  checkBuildingCollision,
  checkBuildingCollisionInDirection
};
