/**
 * Enemy Database - All enemy types with stats and visual info
 * Used by: EnemyEditor (F3), QuestMaker (F7), Combat system
 */

import { 
  Skull, Shield, Flame, Snowflake, Wind, Mountain, Bug, Bird,
  Cat, Crown, Bone, Droplets, TreePine, Ghost, Zap
} from 'lucide-react';

// Enemy NPC Database with stats
export const ENEMY_DATABASE = {
  // Tier 1 - Starter Enemies (Level 1-5)
  tier1: {
    label: 'Starter (Lv 1-5)',
    enemies: {
      goblin: { 
        label: 'Goblin', 
        icon: Skull, 
        color: '#4a7c23',
        baseLevel: 1,
        baseHealth: 50,
        baseDamage: 3,
        xpReward: 15,
        goldDrop: [1, 5],
        description: 'Small green creature, weak but numerous'
      },
      wolf: { 
        label: 'Wolf', 
        icon: Cat, 
        color: '#808080',
        baseLevel: 2,
        baseHealth: 80,
        baseDamage: 5,
        xpReward: 20,
        goldDrop: [2, 6],
        description: 'Fast and aggressive predator'
      },
      spider: { 
        label: 'Giant Spider', 
        icon: Bug, 
        color: '#2d2d2d',
        baseLevel: 3,
        baseHealth: 70,
        baseDamage: 6,
        xpReward: 25,
        goldDrop: [1, 4],
        description: 'Venomous arachnid lurking in shadows'
      },
      bat: { 
        label: 'Giant Bat', 
        icon: Bird, 
        color: '#4a4a4a',
        baseLevel: 2,
        baseHealth: 50,
        baseDamage: 4,
        xpReward: 15,
        goldDrop: [1, 3],
        description: 'Flying creature of the night'
      },
      slime: { 
        label: 'Slime', 
        icon: Droplets, 
        color: '#22c55e',
        baseLevel: 1,
        baseHealth: 60,
        baseDamage: 2,
        xpReward: 10,
        goldDrop: [0, 2],
        description: 'Gelatinous blob, slow but persistent'
      },
    }
  },
  // Tier 2 - Forest Enemies (Level 5-15)
  tier2: {
    label: 'Forest (Lv 5-15)',
    enemies: {
      wolf_alpha: { 
        label: 'Alpha Wolf', 
        icon: Cat, 
        color: '#404040',
        baseLevel: 8,
        baseHealth: 150,
        baseDamage: 18,
        xpReward: 60,
        goldDrop: [5, 15],
        description: 'Pack leader, stronger than regular wolves'
      },
      bear: { 
        label: 'Bear', 
        icon: Cat, 
        color: '#8b4513',
        baseLevel: 10,
        baseHealth: 200,
        baseDamage: 22,
        xpReward: 80,
        goldDrop: [8, 20],
        description: 'Powerful beast protecting its territory'
      },
      treant: { 
        label: 'Treant', 
        icon: TreePine, 
        color: '#228b22',
        baseLevel: 12,
        baseHealth: 350,
        baseDamage: 25,
        xpReward: 100,
        goldDrop: [10, 25],
        description: 'Animated tree guardian of the forest'
      },
      forest_troll: { 
        label: 'Forest Troll', 
        icon: Skull, 
        color: '#556b2f',
        baseLevel: 14,
        baseHealth: 300,
        baseDamage: 30,
        xpReward: 120,
        goldDrop: [15, 30],
        description: 'Regenerating brute dwelling in swamps'
      },
      harpy: { 
        label: 'Harpy', 
        icon: Bird, 
        color: '#9370db',
        baseLevel: 11,
        baseHealth: 120,
        baseDamage: 20,
        xpReward: 70,
        goldDrop: [8, 18],
        description: 'Winged creature with razor talons'
      },
    }
  },
  // Tier 3 - Mountain/Cave Enemies (Level 15-25)
  tier3: {
    label: 'Mountain (Lv 15-25)',
    enemies: {
      rock_golem: { 
        label: 'Rock Golem', 
        icon: Mountain, 
        color: '#696969',
        baseLevel: 18,
        baseHealth: 500,
        baseDamage: 35,
        xpReward: 150,
        goldDrop: [20, 40],
        description: 'Living stone, extremely durable'
      },
      ice_elemental: { 
        label: 'Ice Elemental', 
        icon: Snowflake, 
        color: '#87ceeb',
        baseLevel: 20,
        baseHealth: 280,
        baseDamage: 40,
        xpReward: 180,
        goldDrop: [25, 45],
        description: 'Freezing spirit of eternal winter'
      },
      wyvern: { 
        label: 'Wyvern', 
        icon: Bird, 
        color: '#8b0000',
        baseLevel: 22,
        baseHealth: 400,
        baseDamage: 50,
        xpReward: 220,
        goldDrop: [30, 60],
        description: 'Lesser dragon, still deadly'
      },
      ogre: { 
        label: 'Ogre', 
        icon: Skull, 
        color: '#cd853f',
        baseLevel: 16,
        baseHealth: 450,
        baseDamage: 40,
        xpReward: 140,
        goldDrop: [18, 35],
        description: 'Massive brute with a club'
      },
      yeti: { 
        label: 'Yeti', 
        icon: Ghost, 
        color: '#f0f8ff',
        baseLevel: 24,
        baseHealth: 550,
        baseDamage: 55,
        xpReward: 250,
        goldDrop: [35, 70],
        description: 'Legendary creature of the frozen peaks'
      },
    }
  },
  // Tier 4 - Dark/Undead Enemies (Level 25-35)
  tier4: {
    label: 'Undead (Lv 25-35)',
    enemies: {
      skeleton_warrior: { 
        label: 'Skeleton Warrior', 
        icon: Bone, 
        color: '#f5f5dc',
        baseLevel: 26,
        baseHealth: 320,
        baseDamage: 45,
        xpReward: 200,
        goldDrop: [25, 50],
        description: 'Animated bones of fallen soldiers'
      },
      zombie: { 
        label: 'Zombie', 
        icon: Skull, 
        color: '#556b2f',
        baseLevel: 25,
        baseHealth: 400,
        baseDamage: 35,
        xpReward: 180,
        goldDrop: [20, 40],
        description: 'Shambling corpse hungering for flesh'
      },
      ghost: { 
        label: 'Wraith', 
        icon: Ghost, 
        color: '#4682b4',
        baseLevel: 30,
        baseHealth: 250,
        baseDamage: 60,
        xpReward: 280,
        goldDrop: [30, 60],
        description: 'Ethereal spirit, partially immune to physical'
      },
      vampire: { 
        label: 'Vampire', 
        icon: Crown, 
        color: '#8b0000',
        baseLevel: 32,
        baseHealth: 450,
        baseDamage: 65,
        xpReward: 350,
        goldDrop: [50, 100],
        description: 'Undead lord that drains life'
      },
      lich: { 
        label: 'Lich', 
        icon: Crown, 
        color: '#4b0082',
        baseLevel: 35,
        baseHealth: 380,
        baseDamage: 80,
        xpReward: 500,
        goldDrop: [80, 150],
        description: 'Undead sorcerer of immense power'
      },
    }
  },
  // Tier 5 - Elite/Boss Enemies (Level 35-50)
  tier5: {
    label: 'Elite (Lv 35-50)',
    enemies: {
      fire_elemental: { 
        label: 'Fire Elemental', 
        icon: Flame, 
        color: '#ff4500',
        baseLevel: 38,
        baseHealth: 600,
        baseDamage: 70,
        xpReward: 450,
        goldDrop: [60, 120],
        description: 'Living flame from the elemental plane'
      },
      storm_giant: { 
        label: 'Storm Giant', 
        icon: Zap, 
        color: '#1e90ff',
        baseLevel: 42,
        baseHealth: 1000,
        baseDamage: 90,
        xpReward: 600,
        goldDrop: [100, 200],
        description: 'Towering giant commanding lightning'
      },
      dragon: { 
        label: 'Dragon', 
        icon: Flame, 
        color: '#dc143c',
        baseLevel: 50,
        baseHealth: 2000,
        baseDamage: 150,
        xpReward: 1500,
        goldDrop: [500, 1000],
        description: 'Ancient wyrm, ultimate challenge'
      },
      demon_lord: { 
        label: 'Demon Lord', 
        icon: Crown, 
        color: '#8b0000',
        baseLevel: 45,
        baseHealth: 1200,
        baseDamage: 100,
        xpReward: 800,
        goldDrop: [150, 300],
        description: 'Commander of the infernal legions'
      },
      ancient_dragon: { 
        label: 'Ancient Dragon', 
        icon: Crown, 
        color: '#ffd700',
        baseLevel: 60,
        baseHealth: 5000,
        baseDamage: 250,
        xpReward: 5000,
        goldDrop: [1000, 2000],
        description: 'Elder wyrm of legendary power'
      },
    }
  },
  // Special/Unique Enemies
  special: {
    label: 'Special',
    enemies: {
      mimic: { 
        label: 'Mimic', 
        icon: Shield, 
        color: '#8b4513',
        baseLevel: 15,
        baseHealth: 200,
        baseDamage: 35,
        xpReward: 100,
        goldDrop: [50, 100],
        description: 'Treasure chest that bites back'
      },
      will_o_wisp: { 
        label: "Will-o'-Wisp", 
        icon: Ghost, 
        color: '#7fffd4',
        baseLevel: 10,
        baseHealth: 50,
        baseDamage: 15,
        xpReward: 40,
        goldDrop: [5, 10],
        description: 'Mysterious floating light, lures travelers'
      },
      bandit: { 
        label: 'Bandit', 
        icon: Skull, 
        color: '#8b4513',
        baseLevel: 5,
        baseHealth: 100,
        baseDamage: 12,
        xpReward: 35,
        goldDrop: [10, 25],
        description: 'Outlaw preying on travelers'
      },
      cultist: { 
        label: 'Cultist', 
        icon: Ghost, 
        color: '#4b0082',
        baseLevel: 20,
        baseHealth: 180,
        baseDamage: 40,
        xpReward: 150,
        goldDrop: [20, 45],
        description: 'Dark magic practitioner'
      },
      dire_wolf: { 
        label: 'Dire Wolf', 
        icon: Cat, 
        color: '#2f4f4f',
        baseLevel: 12,
        baseHealth: 180,
        baseDamage: 25,
        xpReward: 85,
        goldDrop: [12, 25],
        description: 'Massive wolf, rare and dangerous'
      },
    }
  }
};

// Helper function to get enemy by type
export const getEnemyByType = (type) => {
  for (const tier of Object.values(ENEMY_DATABASE)) {
    if (tier.enemies && tier.enemies[type]) {
      return tier.enemies[type];
    }
  }
  return null;
};

// Helper to get all enemy types as flat array
export const getAllEnemyTypes = () => {
  const types = [];
  for (const tier of Object.values(ENEMY_DATABASE)) {
    if (tier.enemies) {
      for (const [key, enemy] of Object.entries(tier.enemies)) {
        types.push({ type: key, ...enemy, tier: tier.label });
      }
    }
  }
  return types;
};

export default ENEMY_DATABASE;
