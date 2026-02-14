import { useState } from 'react';
import { Package, Coins, X, Skull } from 'lucide-react';
import { formatCurrency } from '../../store/gameStore';

// Loot Items Database - 5 Tier Rarity System
export const LOOT_ITEMS = {
  // ==================== JUNK (Gray) - 40-50% drop rate ====================
  // Vendor trash, lowest value
  ruined_leather_scraps: {
    id: 'ruined_leather_scraps',
    name: 'Ruined Leather Scraps',
    icon: '🧻',
    description: 'Worthless scraps of ruined leather.',
    vendorPrice: 50, // 50 copper
    rarity: 'junk',
    dropChance: 0.5
  },
  broken_arrow_shaft: {
    id: 'broken_arrow_shaft',
    name: 'Broken Arrow Shaft',
    icon: '🪵',
    description: 'A snapped arrow shaft. Utterly useless.',
    vendorPrice: 30,
    rarity: 'junk',
    dropChance: 0.45
  },
  chipped_bone: {
    id: 'chipped_bone',
    name: 'Chipped Bone',
    icon: '🦴',
    description: 'A damaged bone fragment. No one wants this.',
    vendorPrice: 40,
    rarity: 'junk',
    dropChance: 0.48
  },
  dirty_fur: {
    id: 'dirty_fur',
    name: 'Dirty Fur',
    icon: '🧶',
    description: 'Matted, filthy fur. Barely worth carrying.',
    vendorPrice: 35,
    rarity: 'junk',
    dropChance: 0.42
  },
  cracked_fang: {
    id: 'cracked_fang',
    name: 'Cracked Fang',
    icon: '🦷',
    description: 'A broken fang. Maybe a vendor will take it.',
    vendorPrice: 45,
    rarity: 'junk',
    dropChance: 0.40
  },

  // ==================== COMMON (White) - 30-35% drop rate ====================
  bone_fragment: {
    id: 'bone_fragment',
    name: 'Bone Fragment',
    icon: '🦴',
    description: 'A small piece of bone. Useful for crafting.',
    vendorPrice: 100, // 1 silver
    rarity: 'common',
    dropChance: 0.35
  },
  torn_cloth: {
    id: 'torn_cloth',
    name: 'Torn Cloth',
    icon: '🧵',
    description: 'Ragged cloth. Can be woven together.',
    vendorPrice: 80,
    rarity: 'common',
    dropChance: 0.32
  },
  leather_scraps: {
    id: 'leather_scraps',
    name: 'Leather Scraps',
    icon: '🟫',
    description: 'Small pieces of leather. Good condition.',
    vendorPrice: 120,
    rarity: 'common',
    dropChance: 0.30
  },
  sharp_claw: {
    id: 'sharp_claw',
    name: 'Sharp Claw',
    icon: '🪝',
    description: 'A pointed claw from a beast.',
    vendorPrice: 110,
    rarity: 'common',
    dropChance: 0.28
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    icon: '⛰️',
    description: 'Raw iron ore. Can be smelted.',
    vendorPrice: 150,
    rarity: 'common',
    dropChance: 0.25
  },

  // ==================== UNCOMMON (Green) - 15-20% drop rate ====================
  wolf_pelt: {
    id: 'wolf_pelt',
    name: 'Wolf Pelt',
    icon: '🐺',
    description: 'Thick fur from a wolf. Excellent quality.',
    vendorPrice: 500, // 5 silver
    rarity: 'uncommon',
    dropChance: 0.18
  },
  spider_silk: {
    id: 'spider_silk',
    name: 'Spider Silk',
    icon: '🕸️',
    description: 'Strong, flexible silk. Highly sought after.',
    vendorPrice: 600,
    rarity: 'uncommon',
    dropChance: 0.15
  },
  goblin_ear: {
    id: 'goblin_ear',
    name: 'Goblin Ear',
    icon: '👂',
    description: 'Trophy from a defeated goblin.',
    vendorPrice: 400,
    rarity: 'uncommon',
    dropChance: 0.17
  },
  enchanted_dust: {
    id: 'enchanted_dust',
    name: 'Enchanted Dust',
    icon: '✨',
    description: 'Magical dust with faint glow.',
    vendorPrice: 700,
    rarity: 'uncommon',
    dropChance: 0.12
  },
  sturdy_leather: {
    id: 'sturdy_leather',
    name: 'Sturdy Leather',
    icon: '🟤',
    description: 'Thick, durable leather. Perfect for armor.',
    vendorPrice: 550,
    rarity: 'uncommon',
    dropChance: 0.16
  },
  bat_wing: {
    id: 'bat_wing',
    name: 'Bat Wing',
    icon: '🦇',
    description: 'Leathery wing membrane. Used in alchemy.',
    vendorPrice: 450,
    rarity: 'uncommon',
    dropChance: 0.14
  },

  // ==================== RARE (Blue) - 5-8% drop rate ====================
  pristine_fang: {
    id: 'pristine_fang',
    name: 'Pristine Fang',
    icon: '💎',
    description: 'Flawless fang from an alpha predator.',
    vendorPrice: 2000, // 20 silver
    rarity: 'rare',
    dropChance: 0.07
  },
  ancient_coin: {
    id: 'ancient_coin',
    name: 'Ancient Coin',
    icon: '🪙',
    description: 'Gold coin from a lost civilization.',
    vendorPrice: 2500,
    rarity: 'rare',
    dropChance: 0.05
  },
  monster_essence: {
    id: 'monster_essence',
    name: 'Monster Essence',
    icon: '⚡',
    description: 'Pure magical essence. Radiates power.',
    vendorPrice: 3000,
    rarity: 'rare',
    dropChance: 0.06
  },
  dragon_scale: {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    icon: '🐉',
    description: 'A scale from a dragon. Incredibly rare.',
    vendorPrice: 5000, // 50 silver
    rarity: 'rare',
    dropChance: 0.04
  },
  mystic_crystal: {
    id: 'mystic_crystal',
    name: 'Mystic Crystal',
    icon: '💠',
    description: 'A glowing crystal pulsing with energy.',
    vendorPrice: 4000,
    rarity: 'rare',
    dropChance: 0.05
  },

  // ==================== EPIC (Purple) - 1-2% drop rate ====================
  legendary_gem: {
    id: 'legendary_gem',
    name: 'Legendary Gem',
    icon: '💜',
    description: 'An impossibly rare gemstone of immense power.',
    vendorPrice: 15000, // 1.5 gold
    rarity: 'epic',
    dropChance: 0.015
  },
  phoenix_feather: {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    icon: '🔥',
    description: 'A feather from the legendary phoenix. Burns eternally.',
    vendorPrice: 20000, // 2 gold
    rarity: 'epic',
    dropChance: 0.01
  },
  void_crystal: {
    id: 'void_crystal',
    name: 'Void Crystal',
    icon: '🌑',
    description: 'A crystal from the void itself. Darker than darkness.',
    vendorPrice: 18000,
    rarity: 'epic',
    dropChance: 0.012
  },
  titans_heart: {
    id: 'titans_heart',
    name: "Titan's Heart",
    icon: '❤️',
    description: 'The crystallized heart of an ancient titan.',
    vendorPrice: 25000, // 2.5 gold
    rarity: 'epic',
    dropChance: 0.008
  },
  
  // ==================== EQUIPMENT - JUNK (Gray) ====================
  // Weapons
  rusty_dagger: {
    id: 'rusty_dagger',
    name: 'Rusty Dagger',
    icon: '🗡️',
    description: 'A corroded dagger. Barely sharp.',
    type: 'equipment',
    equipSlot: 'mainHand',
    vendorPrice: 100,
    rarity: 'junk',
    dropChance: 0.25,
    statRanges: { attack: [1, 2] }
  },
  cracked_shield: {
    id: 'cracked_shield',
    name: 'Cracked Shield',
    icon: '🛡️',
    description: 'A broken shield with a large crack.',
    type: 'equipment',
    equipSlot: 'offHand',
    vendorPrice: 120,
    rarity: 'junk',
    dropChance: 0.22,
    statRanges: { defense: [1, 2] }
  },
  worn_leather_cap: {
    id: 'worn_leather_cap',
    name: 'Worn Leather Cap',
    icon: '⛑️',
    description: 'A tattered leather cap.',
    type: 'equipment',
    equipSlot: 'head',
    vendorPrice: 80,
    rarity: 'junk',
    dropChance: 0.20,
    statRanges: { defense: [1, 2] }
  },
  
  // ==================== EQUIPMENT - COMMON (White) ====================
  // Weapons
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    icon: '⚔️',
    description: 'A basic iron sword. Reliable.',
    type: 'equipment',
    equipSlot: 'mainHand',
    vendorPrice: 500,
    rarity: 'common',
    dropChance: 0.18,
    statRanges: { attack: [2, 4], strength: [1, 2] }
  },
  wooden_shield: {
    id: 'wooden_shield',
    name: 'Wooden Shield',
    icon: '🛡️',
    description: 'A sturdy wooden shield.',
    type: 'equipment',
    equipSlot: 'offHand',
    vendorPrice: 450,
    rarity: 'common',
    dropChance: 0.16,
    statRanges: { defense: [2, 4] }
  },
  leather_helm: {
    id: 'leather_helm',
    name: 'Leather Helm',
    icon: '⛑️',
    description: 'Basic leather headgear.',
    type: 'equipment',
    equipSlot: 'head',
    vendorPrice: 400,
    rarity: 'common',
    dropChance: 0.15,
    statRanges: { defense: [1, 3] }
  },
  leather_chest: {
    id: 'leather_chest',
    name: 'Leather Chestpiece',
    icon: '🎽',
    description: 'Standard leather armor for the chest.',
    type: 'equipment',
    equipSlot: 'chest',
    vendorPrice: 600,
    rarity: 'common',
    dropChance: 0.14,
    statRanges: { defense: [2, 4] }
  },
  leather_gloves: {
    id: 'leather_gloves',
    name: 'Leather Gloves',
    icon: '🧤',
    description: 'Simple leather gloves.',
    type: 'equipment',
    equipSlot: 'hands',
    vendorPrice: 350,
    rarity: 'common',
    dropChance: 0.15,
    statRanges: { attack: [1, 2], defense: [1, 2] }
  },
  leather_boots: {
    id: 'leather_boots',
    name: 'Leather Boots',
    icon: '👢',
    description: 'Basic leather footwear.',
    type: 'equipment',
    equipSlot: 'feet',
    vendorPrice: 400,
    rarity: 'common',
    dropChance: 0.14,
    statRanges: { defense: [1, 3] }
  },
  
  // ==================== EQUIPMENT - UNCOMMON (Green) ====================
  // Weapons
  steel_longsword: {
    id: 'steel_longsword',
    name: 'Steel Longsword',
    icon: '⚔️',
    description: 'A well-crafted steel blade.',
    type: 'equipment',
    equipSlot: 'mainHand',
    vendorPrice: 2000,
    rarity: 'uncommon',
    dropChance: 0.10,
    statRanges: { attack: [3, 5], strength: [2, 4] }
  },
  reinforced_shield: {
    id: 'reinforced_shield',
    name: 'Reinforced Shield',
    icon: '🛡️',
    description: 'A shield reinforced with iron bands.',
    type: 'equipment',
    equipSlot: 'offHand',
    vendorPrice: 1800,
    rarity: 'uncommon',
    dropChance: 0.09,
    statRanges: { defense: [3, 5], strength: [1, 2] }
  },
  chainmail_coif: {
    id: 'chainmail_coif',
    name: 'Chainmail Coif',
    icon: '⛑️',
    description: 'Linked metal rings protect the head.',
    type: 'equipment',
    equipSlot: 'head',
    vendorPrice: 1500,
    rarity: 'uncommon',
    dropChance: 0.08,
    statRanges: { defense: [2, 4], strength: [1, 2] }
  },
  chainmail_chest: {
    id: 'chainmail_chest',
    name: 'Chainmail Hauberk',
    icon: '🎽',
    description: 'Heavy chainmail armor.',
    type: 'equipment',
    equipSlot: 'chest',
    vendorPrice: 2200,
    rarity: 'uncommon',
    dropChance: 0.07,
    statRanges: { defense: [3, 5], strength: [2, 3] }
  },
  chainmail_gloves: {
    id: 'chainmail_gloves',
    name: 'Chainmail Gauntlets',
    icon: '🧤',
    description: 'Metal gloves for protection.',
    type: 'equipment',
    equipSlot: 'hands',
    vendorPrice: 1400,
    rarity: 'uncommon',
    dropChance: 0.08,
    statRanges: { attack: [2, 3], defense: [2, 4] }
  },
  chainmail_boots: {
    id: 'chainmail_boots',
    name: 'Chainmail Boots',
    icon: '👢',
    description: 'Metal-plated boots.',
    type: 'equipment',
    equipSlot: 'feet',
    vendorPrice: 1600,
    rarity: 'uncommon',
    dropChance: 0.07,
    statRanges: { defense: [2, 4] }
  },
  battle_axe: {
    id: 'battle_axe',
    name: 'Battle Axe',
    icon: '🪓',
    description: 'A heavy axe for crushing blows.',
    type: 'equipment',
    equipSlot: 'mainHand',
    vendorPrice: 2500,
    rarity: 'uncommon',
    dropChance: 0.08,
    statRanges: { attack: [4, 5], strength: [3, 4] }
  },
  
  // ==================== EQUIPMENT - RARE (Blue) ====================
  // Weapons
  knights_blade: {
    id: 'knights_blade',
    name: "Knight's Blade",
    icon: '⚔️',
    description: 'A noble sword wielded by knights.',
    type: 'equipment',
    equipSlot: 'mainHand',
    vendorPrice: 8000,
    rarity: 'rare',
    dropChance: 0.04,
    statRanges: { attack: [4, 5], strength: [3, 5], defense: [1, 3] }
  },
  tower_shield: {
    id: 'tower_shield',
    name: 'Tower Shield',
    icon: '🛡️',
    description: 'A massive shield offering great protection.',
    type: 'equipment',
    equipSlot: 'offHand',
    vendorPrice: 7500,
    rarity: 'rare',
    dropChance: 0.04,
    statRanges: { defense: [4, 5], strength: [2, 4] }
  },
  plate_helm: {
    id: 'plate_helm',
    name: 'Plate Helm',
    icon: '⛑️',
    description: 'Full plate helmet with excellent protection.',
    type: 'equipment',
    equipSlot: 'head',
    vendorPrice: 6000,
    rarity: 'rare',
    dropChance: 0.03,
    statRanges: { defense: [3, 5], strength: [2, 3] }
  },
  plate_chestplate: {
    id: 'plate_chestplate',
    name: 'Plate Chestplate',
    icon: '🎽',
    description: 'Heavy plate armor for maximum defense.',
    type: 'equipment',
    equipSlot: 'chest',
    vendorPrice: 9000,
    rarity: 'rare',
    dropChance: 0.03,
    statRanges: { defense: [4, 5], strength: [3, 4] }
  },
  plate_gauntlets: {
    id: 'plate_gauntlets',
    name: 'Plate Gauntlets',
    icon: '🧤',
    description: 'Heavy plated gloves.',
    type: 'equipment',
    equipSlot: 'hands',
    vendorPrice: 5500,
    rarity: 'rare',
    dropChance: 0.03,
    statRanges: { attack: [3, 4], defense: [3, 5], strength: [2, 3] }
  },
  plate_boots: {
    id: 'plate_boots',
    name: 'Plate Greaves',
    icon: '👢',
    description: 'Heavy plate leg armor.',
    type: 'equipment',
    equipSlot: 'feet',
    vendorPrice: 6500,
    rarity: 'rare',
    dropChance: 0.03,
    statRanges: { defense: [3, 5], strength: [2, 3] }
  },
  
  // ==================== EQUIPMENT - EPIC (Purple) ====================
  // Weapons
  dragonslayer_sword: {
    id: 'dragonslayer_sword',
    name: 'Dragonslayer Sword',
    icon: '⚔️',
    description: 'Forged to slay dragons. Radiates power.',
    type: 'equipment',
    equipSlot: 'mainHand',
    vendorPrice: 30000,
    rarity: 'epic',
    dropChance: 0.008,
    statRanges: { attack: [5, 5], strength: [4, 5], defense: [2, 4] }
  },
  aegis_shield: {
    id: 'aegis_shield',
    name: 'Aegis of the Ancients',
    icon: '🛡️',
    description: 'Legendary shield said to be unbreakable.',
    type: 'equipment',
    equipSlot: 'offHand',
    vendorPrice: 28000,
    rarity: 'epic',
    dropChance: 0.007,
    statRanges: { defense: [5, 5], strength: [3, 5], attack: [1, 2] }
  },
  mythril_helm: {
    id: 'mythril_helm',
    name: 'Mythril Helm',
    icon: '⛑️',
    description: 'Crafted from mythril, lighter and stronger than steel.',
    type: 'equipment',
    equipSlot: 'head',
    vendorPrice: 22000,
    rarity: 'epic',
    dropChance: 0.006,
    statRanges: { defense: [4, 5], strength: [3, 4], attack: [1, 3] }
  },
  mythril_chestplate: {
    id: 'mythril_chestplate',
    name: 'Mythril Chestplate',
    icon: '🎽',
    description: 'Legendary armor of ancient heroes.',
    type: 'equipment',
    equipSlot: 'chest',
    vendorPrice: 35000,
    rarity: 'epic',
    dropChance: 0.005,
    statRanges: { defense: [5, 5], strength: [4, 5], attack: [2, 3] }
  },
  mythril_gauntlets: {
    id: 'mythril_gauntlets',
    name: 'Mythril Gauntlets',
    icon: '🧤',
    description: 'Gloves forged in dragonfire.',
    type: 'equipment',
    equipSlot: 'hands',
    vendorPrice: 20000,
    rarity: 'epic',
    dropChance: 0.006,
    statRanges: { attack: [4, 5], defense: [4, 5], strength: [3, 4] }
  },
  mythril_boots: {
    id: 'mythril_boots',
    name: 'Mythril Greaves',
    icon: '👢',
    description: 'Boots worn by legendary warriors.',
    type: 'equipment',
    equipSlot: 'feet',
    vendorPrice: 24000,
    rarity: 'epic',
    dropChance: 0.005,
    statRanges: { defense: [4, 5], strength: [3, 5] }
  },
  
  // ==================== BAGS (Containers) ====================
  small_bag: {
    id: 'small_bag',
    name: 'Small Bag',
    icon: '🎒',
    description: 'A small bag. Holds 6 items.',
    type: 'bag',
    slots: 6,
    vendorPrice: 500,
    rarity: 'common',
    dropChance: 0.12
  },
  medium_bag: {
    id: 'medium_bag',
    name: 'Medium Bag',
    icon: '🎒',
    description: 'A decent-sized bag. Holds 8 items.',
    type: 'bag',
    slots: 8,
    vendorPrice: 1500,
    rarity: 'uncommon',
    dropChance: 0.06
  },
  large_bag: {
    id: 'large_bag',
    name: 'Large Bag',
    icon: '🎒',
    description: 'A large bag. Holds 10 items.',
    type: 'bag',
    slots: 10,
    vendorPrice: 3000,
    rarity: 'rare',
    dropChance: 0.03
  },
  travelers_backpack: {
    id: 'travelers_backpack',
    name: "Traveler's Backpack",
    icon: '🎒',
    description: 'A well-made backpack. Holds 12 items.',
    type: 'bag',
    slots: 12,
    vendorPrice: 6000,
    rarity: 'epic',
    dropChance: 0.01
  }
};

// Enemy type to loot table mapping - Updated with equipment drops
export const ENEMY_LOOT_TABLES = {
  goblin: [
    // Junk items & equipment
    'ruined_leather_scraps', 'broken_arrow_shaft', 'chipped_bone', 'rusty_dagger', 'cracked_shield', 'worn_leather_cap',
    // Common items & equipment
    'bone_fragment', 'torn_cloth', 'leather_scraps', 'iron_sword', 'wooden_shield', 'leather_helm', 'leather_gloves',
    // Uncommon items & equipment
    'goblin_ear', 'enchanted_dust', 'steel_longsword', 'chainmail_coif', 'chainmail_gloves',
    // Rare items & equipment
    'ancient_coin', 'mystic_crystal', 'knights_blade', 'plate_helm',
    // Epic equipment
    'legendary_gem', 'dragonslayer_sword',
    // Bags
    'small_bag', 'medium_bag'
  ],
  wolf: [
    // Junk items & equipment
    'dirty_fur', 'chipped_bone', 'cracked_fang', 'rusty_dagger', 'worn_leather_cap',
    // Common items & equipment
    'bone_fragment', 'sharp_claw', 'leather_scraps', 'iron_sword', 'leather_helm', 'leather_chest', 'leather_boots',
    // Uncommon items & equipment
    'wolf_pelt', 'sturdy_leather', 'steel_longsword', 'battle_axe', 'chainmail_chest', 'chainmail_boots',
    // Rare items & equipment
    'pristine_fang', 'dragon_scale', 'knights_blade', 'plate_chestplate', 'plate_boots',
    // Epic equipment
    'phoenix_feather', 'dragonslayer_sword', 'mythril_chestplate',
    // Bags
    'small_bag', 'medium_bag', 'large_bag'
  ],
  spider: [
    // Junk items
    'broken_arrow_shaft', 'ruined_leather_scraps', 'worn_leather_cap',
    // Common items & equipment
    'torn_cloth', 'iron_ore', 'leather_gloves', 'leather_boots',
    // Uncommon items & equipment
    'spider_silk', 'enchanted_dust', 'chainmail_gloves', 'chainmail_boots',
    // Rare items & equipment
    'monster_essence', 'void_crystal', 'plate_gauntlets',
    // Epic equipment
    'mythril_gauntlets', 'mythril_boots',
    // Bags
    'small_bag'
  ],
  skeleton: [
    // Junk items & equipment
    'chipped_bone', 'broken_arrow_shaft', 'rusty_dagger', 'cracked_shield',
    // Common items & equipment
    'bone_fragment', 'iron_ore', 'iron_sword', 'wooden_shield', 'leather_helm',
    // Uncommon items & equipment
    'enchanted_dust', 'sturdy_leather', 'steel_longsword', 'reinforced_shield', 'chainmail_coif', 'chainmail_chest',
    // Rare items & equipment
    'ancient_coin', 'monster_essence', 'mystic_crystal', 'knights_blade', 'tower_shield', 'plate_helm', 'plate_chestplate',
    // Epic equipment
    'titans_heart', 'legendary_gem', 'dragonslayer_sword', 'aegis_shield', 'mythril_helm', 'mythril_chestplate',
    // Bags
    'medium_bag', 'large_bag', 'travelers_backpack'
  ],
  troll: [
    // Junk items & equipment
    'dirty_fur', 'cracked_fang', 'rusty_dagger', 'cracked_shield',
    // Common items & equipment
    'bone_fragment', 'leather_scraps', 'iron_ore', 'iron_sword', 'wooden_shield', 'leather_chest', 'leather_boots',
    // Uncommon items & equipment
    'wolf_pelt', 'sturdy_leather', 'bat_wing', 'steel_longsword', 'battle_axe', 'reinforced_shield', 'chainmail_chest', 'chainmail_boots',
    // Rare items & equipment
    'pristine_fang', 'dragon_scale', 'monster_essence', 'knights_blade', 'tower_shield', 'plate_chestplate', 'plate_gauntlets', 'plate_boots',
    // Epic equipment
    'titans_heart', 'phoenix_feather', 'dragonslayer_sword', 'aegis_shield', 'mythril_chestplate', 'mythril_gauntlets', 'mythril_boots',
    // Bags
    'large_bag', 'travelers_backpack'
  ],
  bat: [
    // Junk items & equipment
    'cracked_fang', 'chipped_bone', 'rusty_dagger',
    // Common items & equipment
    'torn_cloth', 'sharp_claw', 'leather_gloves', 'leather_boots',
    // Uncommon items & equipment
    'bat_wing', 'sturdy_leather', 'chainmail_gloves', 'chainmail_boots',
    // Rare items & equipment
    'pristine_fang', 'plate_gauntlets',
    // Bags
    'small_bag'
  ],
  slime: [
    // Junk items
    'dirty_fur', 'ruined_leather_scraps',
    // Common items
    'bone_fragment',
    // Uncommon items
    'enchanted_dust',
    // Rare items
    'monster_essence', 'mystic_crystal', 'void_crystal'
  ],
  // Default for any enemy type
  default: [
    'ruined_leather_scraps', 'chipped_bone', 'rusty_dagger',
    'bone_fragment', 'torn_cloth', 'iron_sword', 'leather_helm',
    'leather_scraps', 'enchanted_dust', 'steel_longsword',
    'ancient_coin', 'monster_essence', 'knights_blade',
    'legendary_gem', 'dragonslayer_sword',
    'small_bag'
  ]
};

// Generate loot for an enemy - Updated with equipment stats generation
export const generateLoot = (enemyType, enemyLevel = 1) => {
  const lootTable = ENEMY_LOOT_TABLES[enemyType?.toLowerCase()] || ENEMY_LOOT_TABLES.default;
  const loot = [];
  
  // Roll for each possible item
  lootTable.forEach(itemId => {
    const item = LOOT_ITEMS[itemId];
    if (item && Math.random() < item.dropChance) {
      // Quantity based on rarity (5-tier system)
      let quantity = 1;
      
      switch(item.rarity) {
        case 'junk':
          quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
          break;
        case 'common':
          quantity = Math.floor(Math.random() * 2) + 1; // 1-2 items
          break;
        case 'uncommon':
          quantity = 1; // Always 1
          break;
        case 'rare':
          quantity = 1; // Always 1
          break;
        case 'epic':
          quantity = 1; // Always 1
          break;
        default:
          quantity = 1;
      }
      
      // Generate random stats for equipment
      const itemWithStats = { ...item, quantity };
      
      if (item.type === 'equipment' && item.statRanges) {
        const randomStats = {};
        
        // Roll random values within the stat ranges
        Object.entries(item.statRanges).forEach(([stat, range]) => {
          const [min, max] = range;
          randomStats[stat] = Math.floor(Math.random() * (max - min + 1)) + min;
        });
        
        itemWithStats.stats = randomStats;
      }
      
      loot.push(itemWithStats);
    }
  });
  
  // Gold drop (converted to copper: level-based)
  // Adjusted for new economy: 
  // Level 1: 50-150 copper (0.5-1.5 silver)
  // Level 5: 250-750 copper (2.5-7.5 silver)
  // Level 10: 500-1500 copper (5-15 silver)
  const baseCopper = enemyLevel * 50;
  const variableCopper = Math.floor(Math.random() * (enemyLevel * 100));
  const copperAmount = baseCopper + variableCopper;
  
  return {
    items: loot,
    gold: copperAmount // Stored as copper
  };
};

// Rarity colors - 5 Tier System
const RARITY_COLORS = {
  junk: '#6b7280',     // Gray
  common: '#f3f4f6',   // White
  uncommon: '#22c55e', // Green
  rare: '#3b82f6',     // Blue
  epic: '#a855f7'      // Purple
};

const LootPanel = ({ 
  isOpen, 
  onClose, 
  lootData,
  enemyName,
  onLootItem,
  onLootAll
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  
  if (!isOpen || !lootData) return null;
  
  const hasItems = lootData.items && lootData.items.length > 0;
  const hasGold = lootData.gold && lootData.gold > 0;
  const isEmpty = !hasItems && !hasGold;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto" data-testid="loot-panel">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      
      {/* Loot Window */}
      <div className="relative bg-[#1a1a1a] border-2 border-[#fbbf24] rounded-lg shadow-2xl w-80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7c2d12] to-[#9a3412] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-[#fbbf24]" />
            <h2 className="font-cinzel text-lg text-[#fbbf24]">{enemyName || 'Corpse'}</h2>
          </div>
          <button onClick={onClose} className="text-[#fbbf24] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Loot Content */}
        <div className="p-3 max-h-64 overflow-y-auto">
          {isEmpty ? (
            <div className="text-center py-4 text-[#78716c]">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No loot</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Copper/Silver/Gold */}
              {hasGold && (
                <button
                  onClick={() => onLootItem({ type: 'gold', amount: lootData.gold })}
                  className="w-full flex items-center gap-3 p-2 rounded border border-[#44403c] hover:border-[#fbbf24] hover:bg-[#fbbf24]/10 transition-all"
                  data-testid="loot-gold"
                >
                  <div className="w-10 h-10 rounded bg-[#fbbf24]/20 border border-[#fbbf24] flex items-center justify-center">
                    <Coins className="w-5 h-5 text-[#fbbf24]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-rajdhani font-semibold text-[#fbbf24]">
                      {formatCurrency(lootData.gold)}
                    </p>
                  </div>
                </button>
              )}
              
              {/* Items */}
              {hasItems && lootData.items.map((item, index) => (
                <button
                  key={`${item.id}-${index}`}
                  onClick={() => onLootItem({ type: 'item', item })}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="w-full flex items-center gap-3 p-2 rounded border border-[#44403c] hover:border-[#fbbf24] hover:bg-[#fbbf24]/10 transition-all relative"
                  data-testid={`loot-item-${item.id}`}
                >
                  <div 
                    className="w-10 h-10 rounded border-2 flex items-center justify-center text-xl"
                    style={{ 
                      borderColor: RARITY_COLORS[item.rarity],
                      backgroundColor: `${RARITY_COLORS[item.rarity]}20`
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p 
                      className="font-rajdhani font-semibold"
                      style={{ color: RARITY_COLORS[item.rarity] }}
                    >
                      {item.name} {item.quantity > 1 && `x${item.quantity}`}
                    </p>
                    <p className="text-xs text-[#78716c]">
                      Sell: {item.vendorPrice * item.quantity}g
                    </p>
                  </div>
                  
                  {/* Tooltip */}
                  {hoveredItem?.id === item.id && (
                    <div className="absolute left-full ml-2 top-0 w-48 bg-[#0c0a09] border border-[#44403c] rounded p-2 z-10 pointer-events-none">
                      <p 
                        className="font-semibold text-sm"
                        style={{ color: RARITY_COLORS[item.rarity] }}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs text-[#a8a29e] mt-1">{item.description}</p>
                      <p className="text-xs text-[#fbbf24] mt-1">Vendor Price: {item.vendorPrice}g</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-[#44403c] p-2">
            <button
              onClick={onLootAll}
              className="w-full py-2 px-4 bg-gradient-to-r from-[#7c2d12] to-[#9a3412] hover:from-[#9a3412] hover:to-[#b45309] text-[#fbbf24] font-rajdhani font-semibold rounded transition-all"
              data-testid="loot-all-btn"
            >
              Loot All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LootPanel;
