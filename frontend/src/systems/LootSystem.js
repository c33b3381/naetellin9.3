/**
 * LootSystem.js
 * Handles loot generation, corpse visual transformation, loot pickup, and item/gold distribution
 * Extracted from GameWorld.jsx for better code organization
 * 
 * Loot Flow:
 * 1. Enemy dies → generateLoot() → loot data { gold, items }
 * 2. transformToLootableCorpse() → visual changes (rotate, darken, add sparkles)
 * 3. Player clicks corpse → opens LootPanel
 * 4. handleLootItem() or handleLootAll() → distribute to inventory
 * 5. Corpse cleanup on empty or timer
 */

import * as THREE from 'three';
import { generateLoot as dataGenerateLoot } from '../data/items';

// ==================== CONSTANTS ====================

export const CORPSE_DESPAWN_TIME = 15000; // 15 seconds
export const LOOT_SPARKLE_COUNT = 8;
export const LOOT_SPARKLE_COLOR = 0xffd700; // Gold
export const CORPSE_DARKEN_FACTOR = 0.5;

// ==================== LOOT GENERATION ====================

/**
 * Generate loot for an enemy (re-export from items.js for consistency)
 * 
 * @param {string} enemyType - Enemy type identifier
 * @param {number} level - Enemy level
 * @returns {Object} Loot data {gold, items[]}
 */
export const generateLoot = (enemyType, level) => {
  return dataGenerateLoot(enemyType, level);
};

// ==================== CORPSE VISUAL TRANSFORMATION ====================

/**
 * Transform enemy mesh into a lootable corpse
 * Rotates mesh, darkens colors, hides health bar
 * 
 * @param {THREE.Object3D} enemyMesh - Enemy mesh to transform
 * @param {Function} getTerrainHeight - Function to get terrain Y
 * @param {Object} loot - Loot data to attach
 * @returns {Object} Updated userData for corpse
 */
export const transformToLootableCorpse = (enemyMesh, getTerrainHeight, loot) => {
  if (!enemyMesh) return null;
  
  // Mark as corpse
  enemyMesh.userData.isCorpse = true;
  enemyMesh.userData.hostile = false;
  enemyMesh.userData.lootData = loot;
  enemyMesh.userData.deathTime = Date.now();
  enemyMesh.userData.interactable = true;
  
  // Rotate to side (fallen over)
  enemyMesh.rotation.z = Math.PI / 2;
  
  // Position at terrain height (prevent clipping)
  const terrainY = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
  enemyMesh.position.y = terrainY + 0.2;
  
  // Darken materials
  enemyMesh.traverse(child => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => {
          mat.color.multiplyScalar(CORPSE_DARKEN_FACTOR);
        });
      } else {
        child.material.color.multiplyScalar(CORPSE_DARKEN_FACTOR);
      }
    }
  });
  
  // Hide health bar
  const healthBarBg = enemyMesh.getObjectByName('healthBarBg');
  const healthBarFill = enemyMesh.getObjectByName('healthBarFill');
  if (healthBarBg) healthBarBg.visible = false;
  if (healthBarFill) healthBarFill.visible = false;
  
  return enemyMesh.userData;
};

/**
 * Create loot sparkle visual effect (gold particles)
 * 
 * @returns {THREE.Group} Sparkle particle group
 */
export const createLootSparkles = () => {
  const group = new THREE.Group();
  
  // Create multiple sparkle particles in circle
  const particles = [];
  for (let i = 0; i < LOOT_SPARKLE_COUNT; i++) {
    const geometry = new THREE.SphereGeometry(0.08, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: LOOT_SPARKLE_COLOR,
      transparent: true,
      opacity: 0.8,
      emissive: LOOT_SPARKLE_COLOR,
      emissiveIntensity: 1
    });
    
    const particle = new THREE.Mesh(geometry, material);
    
    // Position in circle
    const angle = (i / LOOT_SPARKLE_COUNT) * Math.PI * 2;
    const radius = 0.4;
    particle.position.x = Math.cos(angle) * radius;
    particle.position.z = Math.sin(angle) * radius;
    particle.position.y = Math.sin(i * 0.5) * 0.2;
    
    // Store initial data for animation
    particle.userData.angle = angle;
    particle.userData.yOffset = i * 0.1;
    
    particles.push(particle);
    group.add(particle);
  }
  
  // Add central glow
  const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.6,
    emissive: 0xffff00,
    emissiveIntensity: 2
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);
  
  group.userData.particles = particles;
  group.userData.glow = glow;
  group.userData.time = 0;
  
  return group;
};

// ==================== LOOT PICKUP HELPERS ====================

/**
 * Apply a single loot item pickup (gold or item)
 * 
 * @param {Object} lootItem - Loot item to pickup
 * @param {Object} lootItem.type - 'gold' or 'item'
 * @param {number} lootItem.amount - Amount if gold
 * @param {Object} lootItem.item - Item object if item type
 * @param {Object} currentLootData - Current loot data to update
 * @param {Object} inventory - Current inventory state
 * @param {Function} addItemToBag - Function to add item to bags
 * @param {Function} updateCopper - Function to update copper in backend
 * @param {number} currentCopper - Current copper amount
 * @returns {Object} Result {newLootData, copperAdded, itemAdded, isEmpty, notification}
 */
export const applyLootItemPickup = async (lootItem, currentLootData, inventory, addItemToBag, updateCopper, currentCopper) => {
  let newLootData = { ...currentLootData };
  let copperAdded = 0;
  let itemAdded = null;
  let notification = '';
  
  if (lootItem.type === 'gold') {
    // Add copper
    copperAdded = lootItem.amount;
    try {
      await updateCopper(copperAdded);
    } catch (err) {
      console.error('Failed to save copper:', err);
    }
    newLootData.gold = 0;
    notification = `Looted: ${copperAdded} copper`;
  } else if (lootItem.type === 'item') {
    const item = lootItem.item;
    const added = addItemToBag(item);
    if (added) {
      newLootData.items = newLootData.items.filter(i => i.id !== item.id);
      itemAdded = item;
    }
  }
  
  // Check if loot is empty
  const isEmpty = (!newLootData.gold || newLootData.gold <= 0) && 
                  (!newLootData.items || newLootData.items.length === 0);
  
  return {
    newLootData,
    copperAdded,
    itemAdded,
    isEmpty,
    notification
  };
};

/**
 * Apply loot all pickup (batch operation)
 * 
 * @param {Object} lootData - Current loot data {gold, items[]}
 * @param {Object} inventory - Inventory state {backpack, bags}
 * @param {Function} updateCopper - Function to update copper
 * @param {number} currentCopper - Current copper amount
 * @returns {Object} Result {backpackCopy, bagsCopy, lootedItems[], goldLooted, notification}
 */
export const applyLootAllPickup = async (lootData, inventory, updateCopper, currentCopper) => {
  const lootedItems = [];
  let goldLooted = 0;
  
  // Loot gold first
  if (lootData.gold > 0) {
    goldLooted = lootData.gold;
    try {
      await updateCopper(goldLooted);
    } catch (err) {
      console.error('Failed to save copper:', err);
    }
  }
  
  // Create copies for batch update
  let backpackCopy = [...inventory.backpack];
  let bagsCopy = inventory.bags.map(b => ({ ...b, items: [...b.items] }));
  
  // Loot all items
  if (lootData.items && lootData.items.length > 0) {
    lootData.items.forEach(item => {
      let added = false;
      
      // Try to stack in backpack
      for (let i = 0; i < backpackCopy.length; i++) {
        if (backpackCopy[i].id === item.id && item.type !== 'bag') {
          backpackCopy[i] = { 
            ...backpackCopy[i], 
            quantity: backpackCopy[i].quantity + (item.quantity || 1) 
          };
          added = true;
          lootedItems.push(item.name);
          break;
        }
      }
      
      // Add to backpack if space
      if (!added && backpackCopy.length < 16) {
        backpackCopy.push({ ...item, quantity: item.quantity || 1 });
        added = true;
        lootedItems.push(item.name);
      }
      
      // Try other bags if backpack full
      if (!added) {
        for (let bagIndex = 0; bagIndex < bagsCopy.length; bagIndex++) {
          const bag = bagsCopy[bagIndex];
          if (!bag.bagItem) continue;
          
          // Try to stack in bag
          for (let i = 0; i < bag.items.length; i++) {
            if (bag.items[i].id === item.id && item.type !== 'bag') {
              bag.items[i] = { 
                ...bag.items[i], 
                quantity: bag.items[i].quantity + (item.quantity || 1) 
              };
              added = true;
              lootedItems.push(item.name);
              break;
            }
          }
          
          // Add to bag if space
          if (!added && bag.items.length < bag.bagItem.slots) {
            bag.items.push({ ...item, quantity: item.quantity || 1 });
            added = true;
            lootedItems.push(item.name);
            break;
          }
        }
      }
    });
  }
  
  // Build notification
  let notification = '';
  if (lootedItems.length > 0 || goldLooted > 0) {
    const lootSummary = [];
    if (goldLooted > 0) lootSummary.push(`${goldLooted} copper`);
    if (lootedItems.length > 0) {
      lootSummary.push(`${lootedItems.length} item${lootedItems.length > 1 ? 's' : ''}`);
    }
    notification = `Looted: ${lootSummary.join(', ')}`;
  }
  
  return {
    backpackCopy,
    bagsCopy,
    lootedItems,
    goldLooted,
    notification
  };
};

// ==================== CORPSE CLEANUP ====================

/**
 * Clean up corpse from scene and tracking
 * 
 * @param {THREE.Object3D} corpseMesh - Corpse mesh to remove
 * @param {Object} scene - Scene reference
 * @param {Array} selectableObjects - Selectable objects array
 * @param {Array} enemyMeshes - Enemy meshes array
 * @param {string} corpseId - Corpse/enemy ID
 * @returns {Object} Updated arrays {selectableObjects, enemyMeshes}
 */
export const cleanupCorpse = (corpseMesh, scene, selectableObjects, enemyMeshes, corpseId) => {
  if (!corpseMesh || !scene) return { selectableObjects, enemyMeshes };
  
  // Remove from scene
  scene.remove(corpseMesh);
  
  // Remove from tracking arrays
  const newSelectableObjects = selectableObjects.filter(obj => obj !== corpseMesh);
  const newEnemyMeshes = enemyMeshes.filter(e => e.userData.enemyId !== corpseId);
  
  return {
    selectableObjects: newSelectableObjects,
    enemyMeshes: newEnemyMeshes
  };
};

// ==================== EXPORTS ====================

export default {
  // Constants
  CORPSE_DESPAWN_TIME,
  LOOT_SPARKLE_COUNT,
  LOOT_SPARKLE_COLOR,
  CORPSE_DARKEN_FACTOR,
  
  // Loot generation
  generateLoot,
  
  // Corpse transformation
  transformToLootableCorpse,
  createLootSparkles,
  
  // Loot pickup
  applyLootItemPickup,
  applyLootAllPickup,
  
  // Cleanup
  cleanupCorpse
};
