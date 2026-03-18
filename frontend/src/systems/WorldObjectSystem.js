/**
 * World Object System
 * Handles world object persistence logic: loading, saving, normalization,
 * and mesh lifecycle management.
 *
 * Pure functions only - no React state, no scene.add, no refs.
 * The caller (GameWorld.jsx) handles React state and scene integration.
 *
 * Extracted from GameWorld.jsx for modularity.
 */

import * as THREE from 'three';

// ==================== CONSTANTS ====================

/** Types that should be added to selectableObjects for click targeting */
export const SELECTABLE_TYPES = ['monster', 'npc', 'trainer', 'questgiver', 'vendor', 'guard'];

// ==================== TYPE RESOLUTION ====================

/**
 * Resolve the fullType identifier from a saved world object.
 * Handles backward compatibility where fullType may not exist.
 * @param {Object} obj - Saved world object from database
 * @returns {string} The resolved fullType string
 */
export const resolveFullType = (obj) => {
  if (obj.fullType) return obj.fullType;

  if (obj.subType) {
    // Construct fullType from type + subType for backward compatibility
    if (obj.type === 'npc' || obj.type === 'monster' || obj.type === 'animal') {
      return `${obj.type}_${obj.subType}`;
    }
    return obj.subType;
  }

  return obj.type;
};

// ==================== QUEST MARKER ====================

/**
 * Create a yellow cone mesh used as a quest indicator above NPCs.
 * @returns {THREE.Mesh} The quest marker mesh
 */
export const createQuestMarker = () => {
  const markerGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0.8
  });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.y = 2.5;
  marker.userData.questMarker = true;
  return marker;
};

// ==================== OBJECT NORMALIZATION (SAVE) ====================

/**
 * Normalize a placed world object into the format required for database persistence.
 * Preserves ALL fields including rotation, level, subType, quest fields, and editor metadata.
 * @param {Object} obj - A placed world object from state
 * @param {string} currentZone - The current zone name
 * @returns {Object} Normalized object ready for saving
 */
export const normalizeObjectForSave = (obj, currentZone) => {
  const position = obj.position || { x: obj.x || 0, y: obj.y || 0, z: obj.z || 0 };
  return {
    id: obj.id,
    type: obj.type,
    subType: obj.subType,
    fullType: obj.fullType || obj.subType || obj.type,
    position: position,
    name: obj.name,
    level: obj.level || 1,
    scale: obj.scale || 1,
    rotation: obj.rotation || 0,
    color: obj.color,
    category: obj.category,
    zone: obj.zone || currentZone,
    quest_id: obj.quest_id,
    quest_giver: obj.quest_giver,
    global_quest_id: obj.global_quest_id,
    isVendor: obj.isVendor,
    hasQuest: obj.hasQuest
  };
};

/**
 * Normalize a placed enemy into the format required for database persistence.
 * @param {Object} enemy - A placed enemy from state
 * @returns {Object} Normalized enemy ready for saving
 */
export const normalizeEnemyForSave = (enemy) => {
  return {
    id: enemy.id,
    enemyType: enemy.enemyType,
    name: enemy.name,
    level: enemy.level,
    x: enemy.position?.x || enemy.x || 0,
    y: enemy.position?.y || enemy.y || 0,
    z: enemy.position?.z || enemy.z || 0,
    maxHealth: enemy.maxHealth,
    currentHealth: enemy.currentHealth,
    damage: enemy.damage,
    color: enemy.color,
    patrolRadius: enemy.patrolRadius || 5,
    respawnTime: enemy.respawnTime || 60,
    tier: enemy.tier,
    xpReward: enemy.xpReward,
    goldDrop: enemy.goldDrop
  };
};

// ==================== TERRAIN EXTRACTION ====================

/**
 * Extract terrain heightmap and color data from a BufferGeometry.
 * @param {THREE.BufferGeometry} geometry - The terrain geometry
 * @returns {Object|null} Terrain data object or null if no geometry
 */
export const extractTerrainData = (geometry) => {
  if (!geometry) return null;

  const positionAttr = geometry.getAttribute('position');
  const colorAttr = geometry.getAttribute('color');

  const heightmap = [];
  const colors = [];

  for (let i = 0; i < positionAttr.count; i++) {
    heightmap.push(positionAttr.getZ(i));
    colors.push(colorAttr.getX(i), colorAttr.getY(i), colorAttr.getZ(i));
  }

  return {
    terrain_id: 'main_terrain',
    world_size: 600,
    segments: 200,
    seed: 42,
    heightmap,
    colors,
    version: 1
  };
};

// ==================== MESH LIFECYCLE ====================

/**
 * Recursively dispose all geometry and materials from a mesh tree.
 * Call this before removing an object from the scene to prevent memory leaks.
 * @param {THREE.Object3D} obj - The root object to dispose
 */
export const disposeMeshTree = (obj) => {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
};

// ==================== OBJECT LOADING ====================

/**
 * Process a single loaded world object: resolve type, create mesh via factory,
 * apply editor metadata, rotation, and quest marker.
 *
 * @param {Object} obj - Raw world object from database
 * @param {Function} createAssetFn - Asset creation function (createAndPlaceWorldAsset)
 *   Signature: (x, z, fullType, scale, name, level) => THREE.Group|null
 * @returns {THREE.Group|null} The created mesh with metadata applied, or null on failure
 */
export const processLoadedWorldObject = (obj, createAssetFn) => {
  const pos = obj.position || { x: 0, y: 0, z: 0 };
  const scale = obj.scale || 1;
  const fullType = resolveFullType(obj);

  const mesh = createAssetFn(pos.x, pos.z, fullType, scale, obj.name, obj.level || 1);

  if (!mesh) return null;

  // Apply editor metadata
  mesh.userData.editorId = obj.id;
  mesh.userData.objectData = obj;

  // Apply rotation (stored in degrees, converted to radians)
  if (obj.rotation !== undefined && obj.rotation !== 0) {
    mesh.rotation.y = (obj.rotation * Math.PI) / 180;
  }

  // Add quest marker if NPC has a quest assigned
  if (obj.quest_id || obj.quest_giver || obj.global_quest_id) {
    mesh.add(createQuestMarker());
  }

  return mesh;
};
