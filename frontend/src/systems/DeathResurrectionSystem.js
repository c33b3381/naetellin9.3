/**
 * DeathResurrectionSystem.js
 * Handles player death, ghost state, corpse creation, and resurrection mechanics
 * Extracted from GameWorld.jsx for better code organization
 * 
 * Death Flow:
 * 1. Player HP reaches 0 → handlePlayerDeath()
 * 2. Show release dialog
 * 3. Player releases corpse → createPlayerCorpse() → become ghost at graveyard
 * 4. Ghost travels to corpse location
 * 5. Within CORPSE_REVIVE_RADIUS → show revive dialog
 * 6. Player revives → restore to 50% HP/Mana → remove corpse
 */

import * as THREE from 'three';

// ==================== CONSTANTS ====================

export const CORPSE_REVIVE_RADIUS = 5; // Units - must be within this distance to revive
export const GRAVEYARD_POSITION = { x: -40, z: -40 }; // Graveyard spawn point
export const GHOST_OPACITY = 0.4; // Ghost transparency
export const REVIVE_HEALTH_PERCENT = 0.5; // 50% HP on revive
export const REVIVE_MANA_PERCENT = 0.5; // 50% Mana on revive

// ==================== CORPSE CREATION ====================

/**
 * Create a visual player corpse mesh (lying down)
 * 
 * @param {Object} corpsePosition - Position where player died {x, z}
 * @param {Function} getTerrainHeight - Function to get terrain Y at (x, z)
 * @param {Object} playerAppearance - Player visual data
 * @param {number} playerAppearance.skinColor - Hex color for skin
 * @param {number} playerAppearance.armorColor - Hex color for armor
 * @returns {THREE.Group} Corpse mesh group
 */
export const createPlayerCorpse = (corpsePosition, getTerrainHeight, playerAppearance = {}) => {
  const corpseGroup = new THREE.Group();
  corpseGroup.name = 'playerCorpse';
  
  const playerColor = playerAppearance.skinColor || 0xffdbac;
  const armorColor = playerAppearance.armorColor || 0x8B4513;
  
  // Create body (lying down - rotated)
  const bodyGeom = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: armorColor });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.rotation.z = Math.PI / 2; // Lay on side
  body.position.y = 0.3;
  corpseGroup.add(body);
  
  // Create head
  const headGeom = new THREE.SphereGeometry(0.25, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: playerColor });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.set(0.7, 0.3, 0);
  corpseGroup.add(head);
  
  // Create legs
  const legGeom = new THREE.CapsuleGeometry(0.12, 0.5, 4, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
  const leg1 = new THREE.Mesh(legGeom, legMat);
  leg1.rotation.z = Math.PI / 2;
  leg1.position.set(-0.6, 0.15, 0.15);
  corpseGroup.add(leg1);
  const leg2 = new THREE.Mesh(legGeom, legMat);
  leg2.rotation.z = Math.PI / 2;
  leg2.position.set(-0.6, 0.15, -0.15);
  corpseGroup.add(leg2);
  
  // Create arms
  const armGeom = new THREE.CapsuleGeometry(0.08, 0.4, 4, 8);
  const armMat = new THREE.MeshStandardMaterial({ color: playerColor });
  const arm1 = new THREE.Mesh(armGeom, armMat);
  arm1.rotation.z = Math.PI / 2;
  arm1.position.set(0.2, 0.3, 0.4);
  corpseGroup.add(arm1);
  const arm2 = new THREE.Mesh(armGeom, armMat);
  arm2.rotation.z = Math.PI / 2;
  arm2.position.set(0.2, 0.3, -0.4);
  corpseGroup.add(arm2);
  
  // Add a subtle glow/highlight to make corpse visible
  const glowGeom = new THREE.CircleGeometry(1.5, 32);
  const glowMat = new THREE.MeshBasicMaterial({ 
    color: 0xffff00, 
    transparent: true, 
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.05;
  corpseGroup.add(glow);
  
  // Position corpse at death location
  const terrainY = getTerrainHeight(corpsePosition.x, corpsePosition.z);
  corpseGroup.position.set(corpsePosition.x, terrainY, corpsePosition.z);
  
  return corpseGroup;
};

// ==================== GHOST EFFECTS ====================

/**
 * Apply ghost visual effect to player (transparency)
 * 
 * @param {THREE.Object3D} playerMesh - Player mesh to make transparent
 * @param {number} opacity - Ghost opacity (default: GHOST_OPACITY)
 */
export const applyGhostEffect = (playerMesh, opacity = GHOST_OPACITY) => {
  if (!playerMesh) return;
  
  playerMesh.traverse((child) => {
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => {
          m.transparent = true;
          m.opacity = opacity;
        });
      } else {
        child.material.transparent = true;
        child.material.opacity = opacity;
      }
    }
  });
};

/**
 * Remove ghost visual effect from player (restore opacity)
 * 
 * @param {THREE.Object3D} playerMesh - Player mesh to restore
 */
export const removeGhostEffect = (playerMesh) => {
  if (!playerMesh) return;
  
  playerMesh.traverse((child) => {
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => {
          m.transparent = false;
          m.opacity = 1.0;
        });
      } else {
        child.material.transparent = false;
        child.material.opacity = 1.0;
      }
    }
  });
};

// ==================== POSITION & DISTANCE ====================

/**
 * Check if player is near corpse (within revive radius)
 * 
 * @param {THREE.Vector3|Object} playerPosition - Player position {x, z}
 * @param {Object} corpsePosition - Corpse position {x, z}
 * @param {number} radius - Revive radius (default: CORPSE_REVIVE_RADIUS)
 * @returns {boolean} true if within radius
 */
export const isNearCorpse = (playerPosition, corpsePosition, radius = CORPSE_REVIVE_RADIUS) => {
  if (!playerPosition || !corpsePosition) return false;
  
  const dx = playerPosition.x - corpsePosition.x;
  const dz = playerPosition.z - corpsePosition.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  return distance <= radius;
};

/**
 * Teleport player to position with teleport flag
 * 
 * @param {THREE.Object3D} playerMesh - Player mesh to teleport
 * @param {Object} position - Target position {x, z}
 * @param {Function} getTerrainHeight - Function to get terrain Y
 * @param {Object} justTeleportedRef - Ref to set teleport flag
 */
export const teleportPlayer = (playerMesh, position, getTerrainHeight, justTeleportedRef) => {
  if (!playerMesh) return;
  
  justTeleportedRef.current = true; // Prevent position override
  const terrainY = getTerrainHeight(position.x, position.z);
  playerMesh.position.set(position.x, terrainY, position.z);
  
  // Clear teleport flag after a delay
  setTimeout(() => {
    justTeleportedRef.current = false;
  }, 1000);
};

// ==================== DEATH/RESURRECTION HANDLERS ====================

/**
 * Handle player death
 * Sets death state, clears combat, stores corpse position
 * 
 * @param {Object} config - Configuration object
 * @param {Object} config.playerRef - Player mesh ref
 * @param {Object} config.combatEngagedEnemiesRef - Engaged enemies ref to clear
 * @param {Object} config.npcCombatStateRef - NPC combat state ref to clear
 * @param {Object} config.setters - State setter functions
 * @param {Function} config.addNotification - Notification function
 * @returns {Object} Death state data {corpsePosition}
 */
export const handlePlayerDeath = (config) => {
  const { 
    playerRef, 
    combatEngagedEnemiesRef, 
    npcCombatStateRef, 
    setters,
    addNotification 
  } = config;
  
  const corpsePos = playerRef.current ? {
    x: playerRef.current.position.x,
    z: playerRef.current.position.z
  } : null;
  
  // Set death state
  setters.setIsDead(true);
  setters.setShowReleaseDialog(true);
  setters.setIsAutoAttacking(false);
  setters.setIsInCombat(false);
  setters.setCorpsePosition(corpsePos);
  setters.setSelectedTarget(null);
  
  // Clear all combat states
  combatEngagedEnemiesRef.current.clear();
  npcCombatStateRef.current.clear();
  
  addNotification('You have died!', 'error');
  
  return { corpsePosition: corpsePos };
};

/**
 * Handle releasing corpse and becoming a ghost
 * Creates corpse, teleports player to graveyard, applies ghost effect
 * 
 * @param {Object} config - Configuration object
 * @param {Object} config.corpsePosition - Where player died {x, z}
 * @param {Object} config.playerRef - Player mesh ref
 * @param {Object} config.sceneRef - Scene ref
 * @param {Object} config.playerCorpseRef - Corpse ref to store
 * @param {Object} config.justTeleportedRef - Teleport flag ref
 * @param {Function} config.getTerrainHeight - Terrain height function
 * @param {Object} config.setters - State setter functions
 * @param {Function} config.addNotification - Notification function
 * @returns {THREE.Group|null} Created corpse mesh
 */
export const handleReleaseCorpse = (config) => {
  const {
    corpsePosition,
    playerRef,
    sceneRef,
    playerCorpseRef,
    justTeleportedRef,
    getTerrainHeight,
    setters,
    addNotification
  } = config;
  
  setters.setShowReleaseDialog(false);
  setters.setIsGhost(true);
  
  let corpseMesh = null;
  
  // Create player corpse at death location
  if (sceneRef.current && corpsePosition && playerRef.current) {
    const playerAppearance = {
      skinColor: playerRef.current.userData?.skinColor || 0xffdbac,
      armorColor: playerRef.current.userData?.armorColor || 0x8B4513
    };
    
    corpseMesh = createPlayerCorpse(corpsePosition, getTerrainHeight, playerAppearance);
    sceneRef.current.add(corpseMesh);
    playerCorpseRef.current = corpseMesh;
  }
  
  // Teleport player to graveyard
  teleportPlayer(
    playerRef.current,
    GRAVEYARD_POSITION,
    getTerrainHeight,
    justTeleportedRef
  );
  
  // Apply ghost effect
  applyGhostEffect(playerRef.current);
  
  addNotification('You are now a ghost. Return to your corpse to revive.', 'info');
  
  return corpseMesh;
};

/**
 * Handle player resurrection at corpse
 * Restores health/mana, teleports to corpse, removes ghost effect and corpse
 * 
 * @param {Object} config - Configuration object
 * @param {Object} config.corpsePosition - Corpse location {x, z}
 * @param {Object} config.playerRef - Player mesh ref
 * @param {Object} config.sceneRef - Scene ref
 * @param {Object} config.corpseMarkerRef - Legacy corpse marker ref (for cleanup)
 * @param {Object} config.playerCorpseRef - Corpse mesh ref
 * @param {Function} config.getTerrainHeight - Terrain height function
 * @param {number} config.maxHealth - Max HP
 * @param {number} config.maxMana - Max mana
 * @param {Object} config.setters - State setter functions
 * @param {Function} config.addNotification - Notification function
 */
export const handlePlayerRevive = (config) => {
  const {
    corpsePosition,
    playerRef,
    sceneRef,
    corpseMarkerRef,
    playerCorpseRef,
    getTerrainHeight,
    maxHealth,
    maxMana,
    setters,
    addNotification
  } = config;
  
  setters.setShowReviveDialog(false);
  setters.setIsGhost(false);
  setters.setIsDead(false);
  
  // Restore to 50% HP and Mana
  setters.setCurrentHealth(Math.floor(maxHealth * REVIVE_HEALTH_PERCENT));
  setters.setCurrentMana(Math.floor(maxMana * REVIVE_MANA_PERCENT));
  
  // Teleport to corpse position
  if (playerRef.current && corpsePosition) {
    playerRef.current.position.x = corpsePosition.x;
    playerRef.current.position.z = corpsePosition.z;
    playerRef.current.position.y = getTerrainHeight(corpsePosition.x, corpsePosition.z);
    
    // Restore player opacity (remove ghost effect)
    removeGhostEffect(playerRef.current);
  }
  
  // Remove corpse marker (legacy)
  if (corpseMarkerRef.current && sceneRef.current) {
    sceneRef.current.remove(corpseMarkerRef.current);
    corpseMarkerRef.current = null;
  }
  
  // Remove player corpse model
  if (playerCorpseRef.current && sceneRef.current) {
    sceneRef.current.remove(playerCorpseRef.current);
    playerCorpseRef.current = null;
  }
  
  setters.setCorpsePosition(null);
  addNotification('You have been resurrected!', 'success');
};

// ==================== EXPORTS ====================

export default {
  // Constants
  CORPSE_REVIVE_RADIUS,
  GRAVEYARD_POSITION,
  GHOST_OPACITY,
  REVIVE_HEALTH_PERCENT,
  REVIVE_MANA_PERCENT,
  
  // Corpse creation
  createPlayerCorpse,
  
  // Ghost effects
  applyGhostEffect,
  removeGhostEffect,
  
  // Utilities
  isNearCorpse,
  teleportPlayer,
  
  // Main handlers
  handlePlayerDeath,
  handleReleaseCorpse,
  handlePlayerRevive
};
