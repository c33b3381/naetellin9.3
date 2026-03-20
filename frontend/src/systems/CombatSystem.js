/**
 * Combat System
 * Handles combat-related constants, calculations, and utility functions:
 * - Damage text rendering (floating combat text)
 * - Health bar updates
 * - XP/Leveling calculations
 * - Mob difficulty color system
 * - Damage calculations
 * 
 * Note: Combat state management (enterCombat, handleEnemyDeath, etc.)
 * remains in GameWorld.jsx as it depends on React state
 * 
 * Extracted from GameWorld.jsx for modularity
 */

import * as THREE from 'three';

// ==================== COMBAT CONSTANTS ====================

export const COMBAT_CONSTANTS = {
  NPC_ATTACK_SPEED: 2.5,           // Seconds between NPC attacks
  PLAYER_AUTO_ATTACK_SPEED: 2.0,   // Seconds between player auto-attacks
  GCD_DURATION: 1.5,               // Global cooldown in seconds
  COMBAT_EXIT_DELAY: 5000,         // ms before leaving combat
  AUTO_ATTACK_DAMAGE_MIN: 10,
  AUTO_ATTACK_DAMAGE_MAX: 15,
  NPC_BASE_DAMAGE_BONUS: 5,        // Added to NPC random damage
};

// ==================== XP & LEVELING CONSTANTS ====================

export const MAX_LEVEL = 20;

export const XP_THRESHOLDS = [
  0,      // Level 1 (starting)
  250,    // Level 2
  655,    // Level 3
  1265,   // Level 4
  2085,   // Level 5
  3240,   // Level 6
  4125,   // Level 7
  4785,   // Level 8
  5865,   // Level 9
  7275,   // Level 10
  8205,   // Level 11
  9365,   // Level 12
  10715,  // Level 13
  12085,  // Level 14
  13455,  // Level 15
  14810,  // Level 16
  16135,  // Level 17
  17415,  // Level 18
  18635,  // Level 19
  19775,  // Level 20
  20825   // Level 20 cap (max XP)
];

// ==================== FLOATING COMBAT TEXT ====================

/**
 * Create floating damage/healing text sprite
 * @param {THREE.Scene} scene - The scene to add the sprite to
 * @param {THREE.Vector3} position - World position to show text at
 * @param {number} damage - Damage/healing amount
 * @param {boolean} isPlayerDamage - True if damage TO player (red), false if TO enemy (yellow)
 * @param {boolean} isHealing - True for healing text (green)
 * @returns {THREE.Sprite} The damage text sprite
 */
export const createDamageText = (scene, position, damage, isPlayerDamage = false, isHealing = false) => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  
  // Color based on type: healing (green), player damage (red), monster damage (yellow)
  if (isHealing) {
    ctx.fillStyle = '#44ff44';
  } else if (isPlayerDamage) {
    ctx.fillStyle = '#ff4444';
  } else {
    ctx.fillStyle = '#ffff00';
  }
  
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  const prefix = isHealing ? '+' : '-';
  ctx.strokeText(`${prefix}${damage}`, 64, 48);
  ctx.fillText(`${prefix}${damage}`, 64, 48);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.position.y += 2;
  sprite.scale.set(1.5, 0.75, 1);
  sprite.userData = { 
    type: 'damageText', 
    velocity: 0.03, 
    opacity: 1, 
    createdAt: Date.now() 
  };
  scene.add(sprite);
  return sprite;
};

// ==================== HEALTH BAR ====================

/**
 * Update an enemy's health bar visual
 * @param {THREE.Object3D} enemyMesh - The enemy mesh with health bar children
 * @param {number} newHp - New HP value
 */
export const updateEnemyHealthBar = (enemyMesh, newHp) => {
  const healthBarFill = enemyMesh.getObjectByName('healthBarFill');
  if (healthBarFill && enemyMesh.userData.healthBarWidth) {
    const hpPercent = Math.max(0, newHp / enemyMesh.userData.maxHealth);
    healthBarFill.scale.x = Math.max(0.01, hpPercent);
    const offset = (enemyMesh.userData.healthBarWidth * (1 - hpPercent)) / 2;
    healthBarFill.position.x = -offset;
  }
};

// ==================== MOB DIFFICULTY & XP ====================

/**
 * Get mob difficulty color based on level difference (WoW-style)
 * @param {number} mobLevel - The mob's level
 * @param {number} playerLvl - The player's level
 * @returns {Object} { color, name, xpMultiplier, textColor }
 */
export const getMobDifficultyColor = (mobLevel, playerLvl) => {
  const levelDiff = mobLevel - playerLvl;
  
  if (levelDiff >= 5) {
    return { color: 0xff0000, name: 'Skull', xpMultiplier: 1.2, textColor: '#ff0000' };
  } else if (levelDiff >= 3) {
    return { color: 0xff3333, name: 'Red', xpMultiplier: 1.15, textColor: '#ff3333' };
  } else if (levelDiff >= 1) {
    return { color: 0xff8c00, name: 'Orange', xpMultiplier: 1.1, textColor: '#ff8c00' };
  } else if (levelDiff >= -2) {
    return { color: 0xffff00, name: 'Yellow', xpMultiplier: 1.0, textColor: '#ffff00' };
  } else if (levelDiff >= -5) {
    return { color: 0x00ff00, name: 'Green', xpMultiplier: 0.8, textColor: '#00ff00' };
  } else if (levelDiff >= -8) {
    return { color: 0x808080, name: 'Grey', xpMultiplier: 0.1, textColor: '#808080' };
  } else {
    return { color: 0x505050, name: 'Trivial', xpMultiplier: 0, textColor: '#505050' };
  }
};

/**
 * Calculate XP gained from killing a mob
 * @param {number} mobLevel - The mob's level
 * @param {number} playerLvl - The player's level
 * @returns {number} XP amount
 */
export const calculateXPGain = (mobLevel, playerLvl) => {
  const difficulty = getMobDifficultyColor(mobLevel, playerLvl);
  const baseXP = mobLevel * 5 + 45;
  return Math.floor(baseXP * difficulty.xpMultiplier);
};

// ==================== DAMAGE CALCULATIONS ====================

/**
 * Calculate player auto-attack damage
 * @returns {number} Damage amount
 */
/**
 * Calculate player auto-attack damage
 * @param {number} weaponDamageBonus - Bonus damage from equipped weapon (default 0)
 * @returns {number} Damage amount
 */
export const calculateAutoAttackDamage = (weaponDamageBonus = 0) => {
  const range = COMBAT_CONSTANTS.AUTO_ATTACK_DAMAGE_MAX - COMBAT_CONSTANTS.AUTO_ATTACK_DAMAGE_MIN + 1;
  const baseDamage = Math.floor(Math.random() * range) + COMBAT_CONSTANTS.AUTO_ATTACK_DAMAGE_MIN;
  return baseDamage + weaponDamageBonus;
};

/**
 * Calculate NPC auto-attack damage
 * @param {number} baseDamage - Enemy's base damage stat (from userData.damage)
 * @returns {number} Damage amount
 */
export const calculateNpcAttackDamage = (baseDamage = 10) => {
  return Math.floor(Math.random() * baseDamage) + COMBAT_CONSTANTS.NPC_BASE_DAMAGE_BONUS;
};

export default {
  COMBAT_CONSTANTS,
  MAX_LEVEL,
  XP_THRESHOLDS,
  createDamageText,
  updateEnemyHealthBar,
  getMobDifficultyColor,
  calculateXPGain,
  calculateAutoAttackDamage,
  calculateNpcAttackDamage
};
