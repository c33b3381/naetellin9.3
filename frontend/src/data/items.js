/**
 * Loot Items Database - All lootable items with rarity and stats
 * Used by: LootPanel, VendorPanel, Combat system
 * 
 * Rarity Tiers:
 * - Junk (Gray): 40-50% drop, vendor trash
 * - Common (White): 30-35% drop, basic materials
 * - Uncommon (Green): 15-20% drop, useful items
 * - Rare (Blue): 5-8% drop, valuable items
 * - Epic (Purple): 1-3% drop, powerful items
 */

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
  small_fang: {
    id: 'small_fang',
    name: 'Small Fang',
    icon: '🦷',
    description: 'A sharp little fang. Used in alchemy.',
    vendorPrice: 150,
    rarity: 'common',
    dropChance: 0.28
  },
  spider_silk: {
    id: 'spider_silk',
    name: 'Spider Silk',
    icon: '🕸️',
    description: 'Thin but incredibly strong silk threads.',
    vendorPrice: 200,
    rarity: 'common',
    dropChance: 0.25
  },
  wolf_pelt: {
    id: 'wolf_pelt',
    name: 'Wolf Pelt',
    icon: '🐺',
    description: 'A gray wolf pelt in decent condition.',
    vendorPrice: 180,
    rarity: 'common',
    dropChance: 0.30
  },
  bat_wing: {
    id: 'bat_wing',
    name: 'Bat Wing',
    icon: '🦇',
    description: 'A leathery bat wing. Alchemists use these.',
    vendorPrice: 90,
    rarity: 'common',
    dropChance: 0.33
  },

  // ==================== UNCOMMON (Green) - 15-20% drop rate ====================
  sharp_claw: {
    id: 'sharp_claw',
    name: 'Sharp Claw',
    icon: '🐾',
    description: 'A razor-sharp claw from a predator.',
    vendorPrice: 500, // 5 silver
    rarity: 'uncommon',
    dropChance: 0.18
  },
  pristine_fur: {
    id: 'pristine_fur',
    name: 'Pristine Fur',
    icon: '🧥',
    description: 'Soft, undamaged fur. High quality.',
    vendorPrice: 600,
    rarity: 'uncommon',
    dropChance: 0.15
  },
  venom_sac: {
    id: 'venom_sac',
    name: 'Venom Sac',
    icon: '🧪',
    description: 'A intact venom sac. Potent poison inside.',
    vendorPrice: 750,
    rarity: 'uncommon',
    dropChance: 0.12
  },
  thick_leather: {
    id: 'thick_leather',
    name: 'Thick Leather',
    icon: '🛡️',
    description: 'Tough hide suitable for armor crafting.',
    vendorPrice: 550,
    rarity: 'uncommon',
    dropChance: 0.16
  },
  worg_fang: {
    id: 'worg_fang',
    name: 'Worg Fang',
    icon: '🐕',
    description: 'Large fang from a dire wolf. Valuable.',
    vendorPrice: 800,
    rarity: 'uncommon',
    dropChance: 0.14
  },
  elemental_core: {
    id: 'elemental_core',
    name: 'Elemental Core',
    icon: '💎',
    description: 'Pulsing core from an elemental being.',
    vendorPrice: 900,
    rarity: 'uncommon',
    dropChance: 0.10
  },
  mystical_dust: {
    id: 'mystical_dust',
    name: 'Mystical Dust',
    icon: '✨',
    description: 'Shimmering magical residue.',
    vendorPrice: 650,
    rarity: 'uncommon',
    dropChance: 0.18
  },

  // ==================== RARE (Blue) - 5-8% drop rate ====================
  large_fang: {
    id: 'large_fang',
    name: 'Large Fang',
    icon: '🐲',
    description: 'An impressive fang. Sought by collectors.',
    vendorPrice: 2000, // 20 silver
    rarity: 'rare',
    dropChance: 0.08
  },
  thick_hide: {
    id: 'thick_hide',
    name: 'Thick Hide',
    icon: '🦏',
    description: 'Extremely durable hide. Armor-grade.',
    vendorPrice: 2500,
    rarity: 'rare',
    dropChance: 0.06
  },
  enchanted_dust: {
    id: 'enchanted_dust',
    name: 'Enchanted Dust',
    icon: '⭐',
    description: 'Magical dust for enchanting items.',
    vendorPrice: 3000,
    rarity: 'rare',
    dropChance: 0.05
  },
  heart_of_flame: {
    id: 'heart_of_flame',
    name: 'Heart of Flame',
    icon: '🔥',
    description: 'A burning core from a fire elemental.',
    vendorPrice: 3500,
    rarity: 'rare',
    dropChance: 0.05
  },
  frozen_essence: {
    id: 'frozen_essence',
    name: 'Frozen Essence',
    icon: '❄️',
    description: 'Pure essence of frost. Never melts.',
    vendorPrice: 3500,
    rarity: 'rare',
    dropChance: 0.05
  },
  spirit_shard: {
    id: 'spirit_shard',
    name: 'Spirit Shard',
    icon: '👻',
    description: 'Fragment of a trapped spirit. Eerie.',
    vendorPrice: 4000,
    rarity: 'rare',
    dropChance: 0.04
  },

  // ==================== EPIC (Purple) - 1-3% drop rate ====================
  dragon_scale: {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    icon: '🐉',
    description: 'A scale from a mighty dragon. Extremely rare.',
    vendorPrice: 10000, // 1 gold
    rarity: 'epic',
    dropChance: 0.02
  },
  demon_heart: {
    id: 'demon_heart',
    name: 'Demon Heart',
    icon: '💀',
    description: 'The corrupted heart of a demon.',
    vendorPrice: 12000,
    rarity: 'epic',
    dropChance: 0.015
  },
  soul_gem: {
    id: 'soul_gem',
    name: 'Soul Gem',
    icon: '💜',
    description: 'A gem containing trapped soul energy.',
    vendorPrice: 15000,
    rarity: 'epic',
    dropChance: 0.01
  },
  ancient_relic: {
    id: 'ancient_relic',
    name: 'Ancient Relic',
    icon: '🏺',
    description: 'An artifact from a forgotten age.',
    vendorPrice: 20000,
    rarity: 'epic',
    dropChance: 0.008
  },
  void_crystal: {
    id: 'void_crystal',
    name: 'Void Crystal',
    icon: '🔮',
    description: 'Crystal from the void between worlds.',
    vendorPrice: 25000,
    rarity: 'epic',
    dropChance: 0.005
  },

  // ==================== CONSUMABLES (Various Rarities) ====================
  minor_health_potion: {
    id: 'minor_health_potion',
    name: 'Minor Health Potion',
    icon: '🧪',
    description: 'Restores 50 health.',
    vendorPrice: 200,
    rarity: 'common',
    dropChance: 0.20,
    consumable: true,
    effect: { type: 'heal', amount: 50 }
  },
  health_potion: {
    id: 'health_potion',
    name: 'Health Potion',
    icon: '🧪',
    description: 'Restores 100 health.',
    vendorPrice: 500,
    rarity: 'uncommon',
    dropChance: 0.10,
    consumable: true,
    effect: { type: 'heal', amount: 100 }
  },
  greater_health_potion: {
    id: 'greater_health_potion',
    name: 'Greater Health Potion',
    icon: '🧪',
    description: 'Restores 200 health.',
    vendorPrice: 1500,
    rarity: 'rare',
    dropChance: 0.04,
    consumable: true,
    effect: { type: 'heal', amount: 200 }
  },
  minor_mana_potion: {
    id: 'minor_mana_potion',
    name: 'Minor Mana Potion',
    icon: '💧',
    description: 'Restores 30 mana.',
    vendorPrice: 250,
    rarity: 'common',
    dropChance: 0.18,
    consumable: true,
    effect: { type: 'mana', amount: 30 }
  },
  mana_potion: {
    id: 'mana_potion',
    name: 'Mana Potion',
    icon: '💧',
    description: 'Restores 60 mana.',
    vendorPrice: 600,
    rarity: 'uncommon',
    dropChance: 0.08,
    consumable: true,
    effect: { type: 'mana', amount: 60 }
  },

  // ==================== EQUIPMENT (Weapons) ====================
  rusty_sword: {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    icon: '⚔️',
    description: 'An old, rusted blade. Better than nothing.',
    vendorPrice: 300,
    rarity: 'common',
    dropChance: 0.12,
    equipment: true,
    slot: 'weapon',
    equipSlot: 'mainHand',
    type: 'equipment',
    weaponModel: 'sword_basic',
    stats: { 
      damage: 3,
      attackSpeed: 2.2  // Slower than base (2.0)
    }
  },
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    icon: '🗡️',
    description: 'A reliable iron blade.',
    vendorPrice: 1500,
    rarity: 'uncommon',
    dropChance: 0.06,
    equipment: true,
    slot: 'weapon',
    equipSlot: 'mainHand',
    type: 'equipment',
    weaponModel: 'sword_iron',
    stats: { 
      damage: 8,
      attackSpeed: 1.9  // Faster than base
    }
  },
  steel_longsword: {
    id: 'steel_longsword',
    name: 'Steel Longsword',
    icon: '⚔️',
    description: 'A well-crafted steel sword.',
    vendorPrice: 5000,
    rarity: 'rare',
    dropChance: 0.025,
    equipment: true,
    slot: 'weapon',
    equipSlot: 'mainHand',
    type: 'equipment',
    weaponModel: 'sword_iron',
    stats: { 
      damage: 15,
      attackSpeed: 1.7  // Fast
    }
  },
  enchanted_blade: {
    id: 'enchanted_blade',
    name: 'Enchanted Blade',
    icon: '✨',
    description: 'A sword imbued with magical power.',
    vendorPrice: 15000,
    rarity: 'epic',
    dropChance: 0.008,
    equipment: true,
    slot: 'weapon',
    equipSlot: 'mainHand',
    type: 'equipment',
    weaponModel: 'sword_iron',
    stats: { 
      damage: 25, 
      magic: 10,
      attackSpeed: 1.5  // Very fast
    }
  },

  // ==================== EQUIPMENT (Armor) ====================
  leather_vest: {
    id: 'leather_vest',
    name: 'Leather Vest',
    icon: '🦺',
    description: 'Basic leather protection.',
    vendorPrice: 400,
    rarity: 'common',
    dropChance: 0.10,
    equipment: true,
    slot: 'chest',
    stats: { armor: 5 }
  },
  chainmail_shirt: {
    id: 'chainmail_shirt',
    name: 'Chainmail Shirt',
    icon: '🛡️',
    description: 'Interlocked metal rings for protection.',
    vendorPrice: 2000,
    rarity: 'uncommon',
    dropChance: 0.05,
    equipment: true,
    slot: 'chest',
    stats: { armor: 12 }
  },
  plate_armor: {
    id: 'plate_armor',
    name: 'Plate Armor',
    icon: '🛡️',
    description: 'Heavy metal plate protection.',
    vendorPrice: 8000,
    rarity: 'rare',
    dropChance: 0.02,
    equipment: true,
    slot: 'chest',
    stats: { armor: 25 }
  },

  // ==================== QUEST ITEMS (Cannot be sold) ====================
  mysterious_letter: {
    id: 'mysterious_letter',
    name: 'Mysterious Letter',
    icon: '📜',
    description: 'A sealed letter with unknown contents.',
    vendorPrice: 0,
    rarity: 'uncommon',
    dropChance: 0.05,
    questItem: true
  },
  ancient_key: {
    id: 'ancient_key',
    name: 'Ancient Key',
    icon: '🗝️',
    description: 'An old key that might unlock something.',
    vendorPrice: 0,
    rarity: 'rare',
    dropChance: 0.02,
    questItem: true
  },
  goblin_ear: {
    id: 'goblin_ear',
    name: 'Goblin Ear',
    icon: '👂',
    description: 'Proof of goblin slaying. Worth a bounty.',
    vendorPrice: 50,
    rarity: 'common',
    dropChance: 0.40,
    questItem: true
  },
  wolf_heart: {
    id: 'wolf_heart',
    name: 'Wolf Heart',
    icon: '❤️',
    description: 'The heart of a wolf. Used in rituals.',
    vendorPrice: 100,
    rarity: 'uncommon',
    dropChance: 0.15,
    questItem: true
  }
};

// Rarity color mapping
export const RARITY_COLORS = {
  junk: '#9d9d9d',      // Gray
  common: '#ffffff',     // White
  uncommon: '#1eff00',   // Green
  rare: '#0070dd',       // Blue
  epic: '#a335ee',       // Purple
  legendary: '#ff8000'   // Orange (for future use)
};

// Rarity order for sorting
export const RARITY_ORDER = ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

// Loot tables for different enemy types
const ENEMY_LOOT_TABLES = {
  goblin: ['goblin_ear', 'ruined_leather_scraps', 'dirty_fur', 'torn_cloth', 'minor_health_potion', 'rusty_sword', 'iron_sword'],
  wolf: ['wolf_pelt', 'wolf_heart', 'pristine_fur', 'sharp_claw', 'worg_fang'],
  spider: ['spider_silk', 'venom_sac', 'cracked_fang', 'bat_wing'],
  bat: ['bat_wing', 'small_fang', 'minor_mana_potion'],
  slime: ['mystical_dust', 'elemental_core'],
  skeleton: ['bone_fragment', 'chipped_bone', 'rusty_sword', 'ancient_relic'],
  default: ['torn_cloth', 'leather_scraps', 'bone_fragment', 'minor_health_potion']
};

/**
 * Generate loot drops for a killed enemy
 * @param {string} enemyType - Type of enemy killed
 * @param {number} enemyLevel - Level of enemy
 * @returns {Array} Array of loot item objects
 */
export const generateLoot = (enemyType, enemyLevel = 1) => {
  console.log(`[LOOT DEBUG] Starting loot generation for enemyType="${enemyType}", level=${enemyLevel}`);
  
  const loot = [];
  const lootTable = ENEMY_LOOT_TABLES[enemyType] || ENEMY_LOOT_TABLES.default;
  console.log(`[LOOT DEBUG] Loot table for "${enemyType}":`, lootTable);
  
  // Base number of drops scales with level
  const maxDrops = Math.min(1 + Math.floor(enemyLevel / 5), 4);
  console.log(`[LOOT DEBUG] Max drops for level ${enemyLevel}: ${maxDrops}`);
  
  // Try to generate loot for each potential drop
  for (let i = 0; i < maxDrops; i++) {
    // Pick a random item from the loot table
    const itemId = lootTable[Math.floor(Math.random() * lootTable.length)];
    const item = LOOT_ITEMS[itemId];
    console.log(`[LOOT DEBUG] Roll ${i+1}/${maxDrops}: Selected itemId="${itemId}"`, item ? `(${item.name}, ${item.dropChance * 100}% chance)` : '(NOT FOUND)');
    
    if (item) {
      // Roll against drop chance (modified by level)
      const levelBonus = 1 + (enemyLevel * 0.02); // 2% per level
      const modifiedChance = Math.min(item.dropChance * levelBonus, 0.95);
      const roll = Math.random();
      
      console.log(`[LOOT DEBUG] Roll ${i+1}: ${itemId} - chance=${(modifiedChance * 100).toFixed(1)}%, rolled=${(roll * 100).toFixed(1)}% - ${roll < modifiedChance ? 'SUCCESS' : 'FAILED'}`);
      
      if (roll < modifiedChance) {
        // Add the item with a unique instance ID
        loot.push({
          ...item,
          instanceId: `${item.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
      }
    }
  }
  
  // FIX: Guarantee at least 1 item drops (makes combat rewarding)
  // If all RNG rolls failed, force one random item from the loot table to drop
  if (loot.length === 0) {
    console.log(`[LOOT DEBUG] No loot rolled! Forcing guaranteed drop...`);
    const guaranteedItemId = lootTable[Math.floor(Math.random() * lootTable.length)];
    const guaranteedItem = LOOT_ITEMS[guaranteedItemId];
    if (guaranteedItem) {
      loot.push({
        ...guaranteedItem,
        instanceId: `${guaranteedItem.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      console.log(`[LOOT DEBUG] Forced guaranteed drop: ${guaranteedItem.name}`);
    }
  }
  
  // Small chance for bonus rare/epic drop at higher levels
  if (enemyLevel >= 10 && Math.random() < 0.05) {
    const rareItems = Object.values(LOOT_ITEMS).filter(i => i.rarity === 'rare' || i.rarity === 'epic');
    const bonusItem = rareItems[Math.floor(Math.random() * rareItems.length)];
    if (bonusItem && Math.random() < bonusItem.dropChance * 2) {
      loot.push({
        ...bonusItem,
        instanceId: `${bonusItem.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    }
  }
  
  console.log(`[LOOT DEBUG] Final loot array (${loot.length} items):`, loot.map(i => i.name));
  return loot;
};

// Helper to get item by ID
export const getItemById = (id) => LOOT_ITEMS[id] || null;

// Helper to get items by rarity
export const getItemsByRarity = (rarity) => 
  Object.values(LOOT_ITEMS).filter(item => item.rarity === rarity);

// Helper to get all equipment items
export const getEquipmentItems = () =>
  Object.values(LOOT_ITEMS).filter(item => item.equipment);

// Helper to get all consumable items
export const getConsumableItems = () =>
  Object.values(LOOT_ITEMS).filter(item => item.consumable);

export default LOOT_ITEMS;
