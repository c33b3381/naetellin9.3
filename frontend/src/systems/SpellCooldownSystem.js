/**
 * SpellCooldownSystem.js
 * Handles spell cooldown tracking, updates, and availability checks
 * Extracted from GameWorld.jsx for better code organization
 * 
 * Cooldown Flow:
 * 1. Cast spell → startSpellCooldown() → set cooldown duration
 * 2. Every frame → updateGlobalCooldown() → tick down GCD
 * 3. Every 100ms interval → updateSpellCooldowns() → tick down all spell cooldowns
 * 4. Before cast → canCastSpell() → check cooldown + GCD
 */

import { COMBAT_CONSTANTS } from './CombatSystem';

// ==================== CONSTANTS ====================

export const COOLDOWN_TICK_INTERVAL = 100; // milliseconds - how often cooldowns tick
export const COOLDOWN_TICK_AMOUNT = 0.1; // seconds - amount to decrease per tick

// ==================== SPELL COOLDOWN MANAGEMENT ====================

/**
 * Start a spell cooldown
 * 
 * @param {Object} currentCooldowns - Current cooldown state object
 * @param {string} spellId - Spell identifier
 * @param {number} cooldownDuration - Cooldown duration in seconds
 * @returns {Object} Updated cooldowns object
 */
export const startSpellCooldown = (currentCooldowns, spellId, cooldownDuration) => {
  return {
    ...currentCooldowns,
    [spellId]: cooldownDuration
  };
};

/**
 * Update all spell cooldowns (tick down by delta)
 * Called periodically to count down cooldowns
 * 
 * @param {Object} currentCooldowns - Current cooldown state
 * @param {number} delta - Time delta in seconds (default: COOLDOWN_TICK_AMOUNT)
 * @returns {Object} Result {updated cooldowns, hasChanges}
 */
export const updateSpellCooldowns = (currentCooldowns, delta = COOLDOWN_TICK_AMOUNT) => {
  const updated = { ...currentCooldowns };
  let hasChanges = false;
  
  Object.keys(updated).forEach(spellId => {
    if (updated[spellId] > 0) {
      updated[spellId] = Math.max(0, updated[spellId] - delta);
      hasChanges = true;
    }
  });
  
  return {
    cooldowns: hasChanges ? updated : currentCooldowns,
    hasChanges
  };
};

/**
 * Update global cooldown (GCD) - tick down by delta
 * 
 * @param {number} currentGCD - Current GCD value in seconds
 * @param {number} delta - Time delta in seconds
 * @returns {number} Updated GCD value
 */
export const updateGlobalCooldown = (currentGCD, delta) => {
  if (currentGCD <= 0) return 0;
  return Math.max(0, currentGCD - delta);
};

/**
 * Start global cooldown
 * 
 * @param {number} duration - GCD duration (default: COMBAT_CONSTANTS.GCD_DURATION)
 * @returns {number} GCD duration
 */
export const startGlobalCooldown = (duration = COMBAT_CONSTANTS.GCD_DURATION) => {
  return duration;
};

// ==================== COOLDOWN CHECKS ====================

/**
 * Check if a spell is on cooldown
 * 
 * @param {Object} currentCooldowns - Current cooldown state
 * @param {string} spellId - Spell to check
 * @returns {boolean} true if on cooldown
 */
export const isSpellOnCooldown = (currentCooldowns, spellId) => {
  return (currentCooldowns[spellId] || 0) > 0;
};

/**
 * Check if global cooldown is active
 * 
 * @param {number} currentGCD - Current GCD value
 * @returns {boolean} true if GCD active
 */
export const isGlobalCooldownActive = (currentGCD) => {
  return currentGCD > 0;
};

/**
 * Get remaining cooldown for a spell
 * 
 * @param {Object} currentCooldowns - Current cooldown state
 * @param {string} spellId - Spell to check
 * @returns {number} Remaining cooldown in seconds (0 if not on cooldown)
 */
export const getRemainingCooldown = (currentCooldowns, spellId) => {
  return currentCooldowns[spellId] || 0;
};

/**
 * Check if a spell can be cast (cooldown + GCD check)
 * Returns detailed result for error messaging
 * 
 * @param {Object} params - Check parameters
 * @param {Object} params.currentCooldowns - Current cooldown state
 * @param {number} params.currentGCD - Current GCD value
 * @param {string} params.spellId - Spell to check
 * @returns {Object} Result {canCast, reason}
 */
export const canCastSpellCooldown = ({ currentCooldowns, currentGCD, spellId }) => {
  // Check GCD first (higher priority)
  if (isGlobalCooldownActive(currentGCD)) {
    return {
      canCast: false,
      reason: 'gcd_active',
      message: 'Global cooldown active!'
    };
  }
  
  // Check spell cooldown
  if (isSpellOnCooldown(currentCooldowns, spellId)) {
    return {
      canCast: false,
      reason: 'spell_cooldown',
      message: 'Spell is on cooldown!'
    };
  }
  
  return {
    canCast: true,
    reason: null,
    message: null
  };
};

// ==================== COOLDOWN FORMATTING ====================

/**
 * Format cooldown time for display
 * 
 * @param {number} seconds - Cooldown time in seconds
 * @param {number} precision - Decimal places (default: 1)
 * @returns {string} Formatted time (e.g., "3.5s")
 */
export const formatCooldown = (seconds, precision = 1) => {
  if (seconds <= 0) return '';
  return `${seconds.toFixed(precision)}s`;
};

/**
 * Get cooldown percentage (for circular progress indicators)
 * 
 * @param {number} remaining - Remaining cooldown
 * @param {number} total - Total cooldown duration
 * @returns {number} Percentage (0-100)
 */
export const getCooldownPercentage = (remaining, total) => {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (remaining / total) * 100));
};

// ==================== COOLDOWN RESET ====================

/**
 * Reset a specific spell cooldown
 * 
 * @param {Object} currentCooldowns - Current cooldown state
 * @param {string} spellId - Spell to reset
 * @returns {Object} Updated cooldowns object
 */
export const resetSpellCooldown = (currentCooldowns, spellId) => {
  const updated = { ...currentCooldowns };
  updated[spellId] = 0;
  return updated;
};

/**
 * Reset all spell cooldowns
 * 
 * @returns {Object} Empty cooldowns object
 */
export const resetAllCooldowns = () => {
  return {};
};

/**
 * Reset global cooldown
 * 
 * @returns {number} 0
 */
export const resetGlobalCooldown = () => {
  return 0;
};

// ==================== EXPORTS ====================

export default {
  // Constants
  COOLDOWN_TICK_INTERVAL,
  COOLDOWN_TICK_AMOUNT,
  
  // Cooldown management
  startSpellCooldown,
  updateSpellCooldowns,
  updateGlobalCooldown,
  startGlobalCooldown,
  
  // Cooldown checks
  isSpellOnCooldown,
  isGlobalCooldownActive,
  getRemainingCooldown,
  canCastSpellCooldown,
  
  // Formatting
  formatCooldown,
  getCooldownPercentage,
  
  // Reset
  resetSpellCooldown,
  resetAllCooldowns,
  resetGlobalCooldown
};
