/**
 * Spells Database - All spell/ability definitions
 * Used by: SpellBook, TrainerPanel, ActionBar, Combat system
 * 
 * Spell Tiers:
 * - Tier 1: Basic (Levels 1-4)
 * - Tier 2: Intermediate (Levels 4-8)
 * - Tier 3: Advanced (Levels 10-14)
 * - Tier 4: Master (Levels 16-20)
 * 
 * Costs are in copper (100 copper = 1 silver, 10000 copper = 1 gold)
 */

import { Sword, Shield, Axe, Target, Flame } from 'lucide-react';

// Warrior Spell Definitions
export const WARRIOR_SPELLS = {
  // Tier 1 - Basic (Levels 1-4)
  'warrior_attack': {
    id: 'warrior_attack',
    name: 'Attack',
    icon: Sword,
    description: 'Basic melee attack',
    damage: { min: 5, max: 12 },
    manaCost: 0,
    cooldown: 1.5,
    range: 3,
    type: 'physical',
    cost: 0, // Free - default spell
    tier: 1,
    requiredLevel: 1
  },
  'warrior_heroic_strike': {
    id: 'warrior_heroic_strike',
    name: 'Heroic Strike',
    icon: Sword,
    description: 'A powerful strike that deals extra damage',
    damage: { min: 12, max: 20 },
    manaCost: 10,
    cooldown: 6,
    range: 3,
    type: 'physical',
    cost: 1000, // 10 silver
    tier: 1,
    requiredLevel: 2
  },
  
  // Tier 2 - Intermediate (Levels 4-8)
  'warrior_rend': {
    id: 'warrior_rend',
    name: 'Rend',
    icon: Sword,
    description: 'Wounds the target causing them to bleed',
    damage: { min: 8, max: 14 },
    manaCost: 10,
    cooldown: 8,
    range: 3,
    type: 'physical',
    cost: 2000, // 20 silver
    tier: 2,
    requiredLevel: 4
  },
  'warrior_thunder_clap': {
    id: 'warrior_thunder_clap',
    name: 'Thunder Clap',
    icon: Target,
    description: 'Blasts nearby enemies with a thunderous clap',
    damage: { min: 10, max: 16 },
    manaCost: 15,
    cooldown: 6,
    range: 4,
    type: 'physical',
    cost: 2500, // 25 silver
    tier: 2,
    requiredLevel: 6
  },
  'warrior_shield_bash': {
    id: 'warrior_shield_bash',
    name: 'Shield Bash',
    icon: Shield,
    description: 'Bash enemy with your shield, dealing damage',
    damage: { min: 8, max: 15 },
    manaCost: 12,
    cooldown: 10,
    range: 2,
    type: 'physical',
    cost: 3000, // 30 silver
    tier: 2,
    requiredLevel: 8
  },
  
  // Tier 3 - Advanced (Levels 10-14)
  'warrior_overpower': {
    id: 'warrior_overpower',
    name: 'Overpower',
    icon: Sword,
    description: 'A powerful counterattack that cannot be blocked',
    damage: { min: 20, max: 30 },
    manaCost: 15,
    cooldown: 5,
    range: 3,
    type: 'physical',
    cost: 5000, // 50 silver
    tier: 3,
    requiredLevel: 10
  },
  'warrior_whirlwind': {
    id: 'warrior_whirlwind',
    name: 'Whirlwind',
    icon: Target,
    description: 'Spin and strike all nearby enemies',
    damage: { min: 15, max: 22 },
    manaCost: 20,
    cooldown: 12,
    range: 4,
    type: 'physical',
    cost: 6000, // 60 silver
    tier: 3,
    requiredLevel: 12
  },
  'warrior_execute': {
    id: 'warrior_execute',
    name: 'Execute',
    icon: Axe,
    description: 'Powerful finishing blow against wounded enemies',
    damage: { min: 25, max: 40 },
    manaCost: 25,
    cooldown: 15,
    range: 3,
    type: 'physical',
    cost: 7000, // 70 silver
    tier: 3,
    requiredLevel: 14
  },
  
  // Tier 4 - Master (Levels 16-20)
  'warrior_battle_shout': {
    id: 'warrior_battle_shout',
    name: 'Battle Shout',
    icon: Flame,
    description: 'Increase your damage for the next attack',
    damage: { min: 0, max: 0 },
    manaCost: 15,
    cooldown: 30,
    range: 0,
    type: 'buff',
    cost: 10000, // 1 gold
    tier: 4,
    requiredLevel: 16,
    selfTarget: true
  },
  'warrior_mortal_strike': {
    id: 'warrior_mortal_strike',
    name: 'Mortal Strike',
    icon: Sword,
    description: 'A vicious strike that deals heavy damage',
    damage: { min: 30, max: 50 },
    manaCost: 30,
    cooldown: 12,
    range: 3,
    type: 'physical',
    cost: 15000, // 1g 50s
    tier: 4,
    requiredLevel: 18
  },
  'warrior_bladestorm': {
    id: 'warrior_bladestorm',
    name: 'Bladestorm',
    icon: Target,
    description: 'Become a whirlwind of steel, striking all nearby foes',
    damage: { min: 35, max: 55 },
    manaCost: 35,
    cooldown: 20,
    range: 5,
    type: 'physical',
    cost: 20000, // 2 gold
    tier: 4,
    requiredLevel: 20
  }
};

// Spell type colors for UI display
export const SPELL_COLORS = {
  physical: '#a8a29e',  // Gray - physical attacks
  buff: '#22c55e',      // Green - buffs/enhancements
  fire: '#ef4444',      // Red - fire damage
  frost: '#3b82f6',     // Blue - frost damage
  nature: '#10b981',    // Emerald - nature damage
  shadow: '#8b5cf6',    // Purple - shadow damage
  holy: '#fbbf24'       // Gold - holy damage
};

// Get all spells for a class
export const getClassSpells = (className) => {
  switch (className?.toLowerCase()) {
    case 'warrior':
      return WARRIOR_SPELLS;
    // Future classes can be added here
    // case 'mage':
    //   return MAGE_SPELLS;
    // case 'ranger':
    //   return RANGER_SPELLS;
    default:
      return WARRIOR_SPELLS;
  }
};

// Get spells available at a specific level
export const getAvailableSpells = (className, level) => {
  const classSpells = getClassSpells(className);
  return Object.values(classSpells).filter(spell => spell.requiredLevel <= level);
};

// Get spells by tier
export const getSpellsByTier = (className, tier) => {
  const classSpells = getClassSpells(className);
  return Object.values(classSpells).filter(spell => spell.tier === tier);
};

// Calculate spell damage
export const calculateSpellDamage = (spell, bonusDamage = 0) => {
  const { min, max } = spell.damage;
  const baseDamage = Math.floor(Math.random() * (max - min + 1)) + min;
  return baseDamage + bonusDamage;
};

export default WARRIOR_SPELLS;
