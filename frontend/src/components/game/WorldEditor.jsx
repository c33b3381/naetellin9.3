import { useState, useEffect } from 'react';
import { 
  TreePine, Home, User, Skull, Mountain, 
  Save, Trash2, Move, Plus, Eye, EyeOff,
  ChevronDown, ChevronUp, Download, Upload,
  Flower2, Fence, Lamp, Castle, Store, Church,
  Tent, Warehouse, Anchor, Axe, Sword, Shield,
  Crown, Gem, Bone, Bug, Bird, Fish, Cat,
  Flame, Droplets, Wind, Snowflake, Leaf,
  Hammer, Sparkles, Utensils, Lock, Bed,
  Flag, BookOpen, Music, Wand2, Zap, Moon,
  Sun, Star, Heart, Scroll, MapPin, Compass,
  Shovel, Pickaxe, Key, DoorOpen, Target
} from 'lucide-react';

// Expanded object categories and types for Fantasy MMO
const OBJECT_CATEGORIES = {
  nature: {
    label: 'Nature',
    icon: TreePine,
    color: '#22c55e',
    types: {
      tree_pine: { label: 'Pine Tree', icon: TreePine },
      tree_oak: { label: 'Oak Tree', icon: TreePine },
      tree_dead: { label: 'Dead Tree', icon: TreePine },
      tree_palm: { label: 'Palm Tree', icon: TreePine },
      tree_willow: { label: 'Willow Tree', icon: TreePine },
      tree_cherry: { label: 'Cherry Blossom', icon: Flower2 },
      tree_birch: { label: 'Birch Tree', icon: TreePine },
      tree_maple: { label: 'Maple Tree', icon: TreePine },
      tree_ancient: { label: 'Ancient Tree', icon: TreePine },
      bush: { label: 'Bush', icon: Leaf },
      bush_berry: { label: 'Berry Bush', icon: Flower2 },
      bush_thorny: { label: 'Thorny Bush', icon: Leaf },
      flower_patch: { label: 'Flowers', icon: Flower2 },
      flower_roses: { label: 'Rose Bush', icon: Flower2 },
      flower_sunflower: { label: 'Sunflowers', icon: Sun },
      flower_moonflower: { label: 'Moonflowers', icon: Moon },
      tall_grass: { label: 'Tall Grass', icon: Leaf },
      reeds: { label: 'Reeds', icon: Leaf },
      ferns: { label: 'Ferns', icon: Leaf },
      vines: { label: 'Hanging Vines', icon: Leaf },
      ivy: { label: 'Ivy Wall', icon: Leaf },
      moss_patch: { label: 'Moss Patch', icon: Leaf },
      mushroom: { label: 'Mushroom', icon: Bug },
      mushroom_cluster: { label: 'Mushroom Cluster', icon: Bug },
      mushroom_glowing: { label: 'Glowing Mushroom', icon: Sparkles },
      mushroom_giant: { label: 'Giant Mushroom', icon: Bug },
      log: { label: 'Fallen Log', icon: TreePine },
      stump: { label: 'Tree Stump', icon: TreePine },
      roots_exposed: { label: 'Exposed Roots', icon: TreePine },
      lily_pad: { label: 'Lily Pads', icon: Flower2 },
      cattails: { label: 'Cattails', icon: Leaf },
    }
  },
  rocks: {
    label: 'Rocks & Minerals',
    icon: Mountain,
    color: '#6b7280',
    types: {
      rock_small: { label: 'Small Rock', icon: Mountain },
      rock_medium: { label: 'Medium Rock', icon: Mountain },
      rock_large: { label: 'Large Boulder', icon: Mountain },
      rock_flat: { label: 'Flat Rock', icon: Mountain },
      rock_cluster: { label: 'Rock Cluster', icon: Mountain },
      rock_pillar: { label: 'Rock Pillar', icon: Mountain },
      rock_arch: { label: 'Rock Arch', icon: Mountain },
      cliff_face: { label: 'Cliff Face', icon: Mountain },
      ore_copper: { label: 'Copper Ore', icon: Gem },
      ore_iron: { label: 'Iron Ore', icon: Gem },
      ore_gold: { label: 'Gold Ore', icon: Gem },
      ore_silver: { label: 'Silver Ore', icon: Gem },
      ore_crystal: { label: 'Crystal Node', icon: Gem },
      ore_mithril: { label: 'Mithril Ore', icon: Gem },
      ore_adamantite: { label: 'Adamantite Ore', icon: Gem },
      ore_darkstone: { label: 'Dark Stone', icon: Skull },
      stalagmite: { label: 'Stalagmite', icon: Mountain },
      stalactite: { label: 'Stalactite', icon: Mountain },
      crystal_large: { label: 'Large Crystal', icon: Gem },
      crystal_cluster: { label: 'Crystal Cluster', icon: Gem },
      crystal_pillar: { label: 'Crystal Pillar', icon: Gem },
      geode: { label: 'Geode', icon: Gem },
      meteor_crater: { label: 'Meteor Crater', icon: Star },
      lava_rock: { label: 'Lava Rock', icon: Flame },
      ice_chunk: { label: 'Ice Chunk', icon: Snowflake },
    }
  },
  buildings: {
    label: 'Buildings',
    icon: Home,
    color: '#d97706',
    types: {
      house_small: { label: 'Small House', icon: Home },
      house_medium: { label: 'Medium House', icon: Home },
      house_large: { label: 'Large House', icon: Home },
      house_noble: { label: 'Noble House', icon: Crown },
      cottage: { label: 'Cottage', icon: Home },
      hut: { label: 'Wooden Hut', icon: Home },
      cabin: { label: 'Cabin', icon: Home },
      shop: { label: 'Shop', icon: Store },
      inn: { label: 'Inn/Tavern', icon: Home },
      blacksmith: { label: 'Blacksmith', icon: Axe },
      armory: { label: 'Armory', icon: Shield },
      bank: { label: 'Bank', icon: Crown },
      guild_hall: { label: 'Guild Hall', icon: Flag },
      library: { label: 'Library', icon: BookOpen },
      academy: { label: 'Academy', icon: BookOpen },
      barracks: { label: 'Barracks', icon: Sword },
      tower: { label: 'Watch Tower', icon: Castle },
      tower_mage: { label: 'Mage Tower', icon: Wand2 },
      tower_bell: { label: 'Bell Tower', icon: Music },
      lighthouse: { label: 'Lighthouse', icon: Lamp },
      observatory: { label: 'Observatory', icon: Star },
      castle_wall: { label: 'Castle Wall', icon: Castle },
      castle_wall_corner: { label: 'Wall Corner', icon: Castle },
      castle_gate: { label: 'Castle Gate', icon: DoorOpen },
      castle_tower: { label: 'Castle Tower', icon: Castle },
      castle_keep: { label: 'Castle Keep', icon: Castle },
      fortress: { label: 'Fortress', icon: Castle },
      palace: { label: 'Palace', icon: Crown },
      church: { label: 'Church/Chapel', icon: Church },
      cathedral: { label: 'Cathedral', icon: Church },
      temple: { label: 'Temple', icon: Star },
      monastery: { label: 'Monastery', icon: Church },
      crypt: { label: 'Crypt', icon: Skull },
      mausoleum: { label: 'Mausoleum', icon: Skull },
      barn: { label: 'Barn', icon: Warehouse },
      granary: { label: 'Granary', icon: Warehouse },
      warehouse: { label: 'Warehouse', icon: Warehouse },
      windmill: { label: 'Windmill', icon: Wind },
      watermill: { label: 'Watermill', icon: Droplets },
      well: { label: 'Well', icon: Droplets },
      fountain: { label: 'Fountain', icon: Droplets },
      ruins: { label: 'Ruins', icon: Home },
      ruins_tower: { label: 'Ruined Tower', icon: Castle },
      ruins_temple: { label: 'Ruined Temple', icon: Star },
      tent: { label: 'Tent', icon: Tent },
      tent_large: { label: 'Large Tent', icon: Tent },
      tent_commander: { label: 'Commander Tent', icon: Flag },
      campfire: { label: 'Campfire', icon: Flame },
      bonfire: { label: 'Bonfire', icon: Flame },
      bridge_wood: { label: 'Wooden Bridge', icon: Home },
      bridge_stone: { label: 'Stone Bridge', icon: Mountain },
      bridge_rope: { label: 'Rope Bridge', icon: Home },
      dock: { label: 'Dock/Pier', icon: Anchor },
      shipyard: { label: 'Shipyard', icon: Anchor },
      mine_entrance: { label: 'Mine Entrance', icon: Mountain },
      cave_entrance: { label: 'Cave Entrance', icon: Mountain },
      sewer_grate: { label: 'Sewer Grate', icon: Lock },
    }
  },
  walls_fences: {
    label: 'Walls & Fences',
    icon: Fence,
    color: '#78716c',
    types: {
      fence_wood: { label: 'Wood Fence', icon: Fence },
      fence_wood_gate: { label: 'Wood Gate', icon: DoorOpen },
      fence_stone: { label: 'Stone Wall', icon: Fence },
      fence_stone_low: { label: 'Low Stone Wall', icon: Fence },
      fence_iron: { label: 'Iron Fence', icon: Fence },
      fence_iron_gate: { label: 'Iron Gate', icon: DoorOpen },
      palisade: { label: 'Palisade', icon: Fence },
      palisade_gate: { label: 'Palisade Gate', icon: DoorOpen },
      hedge: { label: 'Hedge', icon: Leaf },
      hedge_archway: { label: 'Hedge Archway', icon: DoorOpen },
      city_wall: { label: 'City Wall', icon: Castle },
      city_gate: { label: 'City Gate', icon: DoorOpen },
      battlement: { label: 'Battlement', icon: Castle },
      rampart: { label: 'Rampart', icon: Castle },
      barricade: { label: 'Barricade', icon: Fence },
      sandbags: { label: 'Sandbags', icon: Mountain },
    }
  },
  props: {
    label: 'Props & Decor',
    icon: Lamp,
    color: '#f59e0b',
    types: {
      barrel: { label: 'Barrel', icon: Home },
      barrel_stack: { label: 'Barrel Stack', icon: Home },
      barrel_explosive: { label: 'Explosive Barrel', icon: Flame },
      crate: { label: 'Crate', icon: Home },
      crate_stack: { label: 'Crate Stack', icon: Home },
      crate_open: { label: 'Open Crate', icon: Home },
      cart: { label: 'Cart', icon: Home },
      cart_hay: { label: 'Hay Cart', icon: Leaf },
      wagon: { label: 'Wagon', icon: Home },
      wagon_covered: { label: 'Covered Wagon', icon: Home },
      wheelbarrow: { label: 'Wheelbarrow', icon: Home },
      ladder: { label: 'Ladder', icon: Home },
      scaffolding: { label: 'Scaffolding', icon: Home },
      lamp_post: { label: 'Lamp Post', icon: Lamp },
      lamp_hanging: { label: 'Hanging Lamp', icon: Lamp },
      lantern: { label: 'Lantern', icon: Lamp },
      torch: { label: 'Torch', icon: Flame },
      torch_wall: { label: 'Wall Torch', icon: Flame },
      brazier: { label: 'Brazier', icon: Flame },
      candelabra: { label: 'Candelabra', icon: Flame },
      candles: { label: 'Candles', icon: Flame },
      banner: { label: 'Banner', icon: Flag },
      banner_wall: { label: 'Wall Banner', icon: Flag },
      flag: { label: 'Flag', icon: Flag },
      flag_pole: { label: 'Flag Pole', icon: Flag },
      tapestry: { label: 'Tapestry', icon: Home },
      sign_post: { label: 'Sign Post', icon: Home },
      sign_hanging: { label: 'Hanging Sign', icon: Home },
      milestone: { label: 'Milestone', icon: MapPin },
      grave: { label: 'Gravestone', icon: Mountain },
      grave_cross: { label: 'Grave Cross', icon: Plus },
      grave_ornate: { label: 'Ornate Grave', icon: Crown },
      coffin: { label: 'Coffin', icon: Home },
      sarcophagus: { label: 'Sarcophagus', icon: Crown },
      statue: { label: 'Statue', icon: User },
      statue_hero: { label: 'Hero Statue', icon: Sword },
      statue_angel: { label: 'Angel Statue', icon: Bird },
      statue_gargoyle: { label: 'Gargoyle', icon: Skull },
      statue_lion: { label: 'Lion Statue', icon: Cat },
      bust: { label: 'Bust', icon: User },
      pillar: { label: 'Stone Pillar', icon: Home },
      pillar_broken: { label: 'Broken Pillar', icon: Home },
      column: { label: 'Column', icon: Home },
      archway: { label: 'Stone Archway', icon: DoorOpen },
      bench: { label: 'Bench', icon: Home },
      table: { label: 'Table', icon: Home },
      chair: { label: 'Chair', icon: Home },
      hay_pile: { label: 'Hay Pile', icon: Leaf },
      hay_bale: { label: 'Hay Bale', icon: Leaf },
      sack: { label: 'Sack', icon: Home },
      sack_pile: { label: 'Sack Pile', icon: Home },
      rope_coil: { label: 'Coiled Rope', icon: Home },
      chain_pile: { label: 'Chain Pile', icon: Lock },
      bucket: { label: 'Bucket', icon: Droplets },
      well_bucket: { label: 'Well Bucket', icon: Droplets },
      pot: { label: 'Pot', icon: Home },
      vase: { label: 'Vase', icon: Home },
      urn: { label: 'Urn', icon: Home },
      basket: { label: 'Basket', icon: Home },
      anvil: { label: 'Anvil', icon: Axe },
      weapon_rack: { label: 'Weapon Rack', icon: Sword },
      armor_stand: { label: 'Armor Stand', icon: Shield },
      training_dummy: { label: 'Training Dummy', icon: Target },
      target_archery: { label: 'Archery Target', icon: Target },
      boat_small: { label: 'Small Boat', icon: Anchor },
      boat_rowboat: { label: 'Rowboat', icon: Anchor },
      canoe: { label: 'Canoe', icon: Anchor },
      fishing_rod: { label: 'Fishing Rod', icon: Fish },
      fishing_net: { label: 'Fishing Net', icon: Fish },
      fish_rack: { label: 'Fish Drying Rack', icon: Fish },
      bird_cage: { label: 'Bird Cage', icon: Bird },
      skull_pile: { label: 'Skull Pile', icon: Skull },
      bones_pile: { label: 'Bone Pile', icon: Bone },
      web_corner: { label: 'Spider Web', icon: Bug },
    }
  },
  lighting: {
    label: 'Lighting',
    icon: Lamp,
    color: '#fbbf24',
    types: {
      torch_standing: { label: 'Standing Torch', icon: Flame },
      torch_wall: { label: 'Wall Torch', icon: Flame },
      brazier_standing: { label: 'Standing Brazier', icon: Flame },
      brazier_hanging: { label: 'Hanging Brazier', icon: Flame },
      lamp_post_single: { label: 'Single Lamp Post', icon: Lamp },
      lamp_post_double: { label: 'Double Lamp Post', icon: Lamp },
      lamp_post_ornate: { label: 'Ornate Lamp Post', icon: Lamp },
      lantern_hanging: { label: 'Hanging Lantern', icon: Lamp },
      lantern_ground: { label: 'Ground Lantern', icon: Lamp },
      candle_single: { label: 'Single Candle', icon: Flame },
      candle_group: { label: 'Candle Group', icon: Flame },
      candelabra_floor: { label: 'Floor Candelabra', icon: Flame },
      candelabra_wall: { label: 'Wall Sconce', icon: Flame },
      chandelier_small: { label: 'Small Chandelier', icon: Lamp },
      chandelier_large: { label: 'Large Chandelier', icon: Lamp },
      chandelier_crystal: { label: 'Crystal Chandelier', icon: Gem },
      fire_pit: { label: 'Fire Pit', icon: Flame },
      bonfire_large: { label: 'Large Bonfire', icon: Flame },
      magical_orb: { label: 'Magical Light Orb', icon: Sparkles },
      fairy_lights: { label: 'Fairy Lights', icon: Star },
      glowing_crystal: { label: 'Glowing Crystal', icon: Gem },
    }
  },
  npcs: {
    label: 'NPCs',
    icon: User,
    color: '#3b82f6',
    types: {
      npc_villager_male: { label: 'Male Villager', icon: User },
      npc_villager_female: { label: 'Female Villager', icon: User },
      npc_elder: { label: 'Village Elder', icon: User },
      npc_mayor: { label: 'Mayor', icon: Crown },
      npc_guard: { label: 'Guard', icon: Shield },
      npc_guard_captain: { label: 'Guard Captain', icon: Crown },
      npc_knight: { label: 'Knight', icon: Sword },
      npc_soldier: { label: 'Soldier', icon: Sword },
      npc_archer: { label: 'Archer', icon: Target },
      npc_innkeeper: { label: 'Innkeeper', icon: Home },
      npc_barmaid: { label: 'Barmaid', icon: Utensils },
      npc_cook: { label: 'Cook', icon: Utensils },
      npc_questgiver: { label: 'Quest Giver', icon: Scroll },
      npc_trainer_warrior: { label: 'Warrior Trainer', icon: Sword },
      npc_trainer_mage: { label: 'Mage Trainer', icon: Wand2 },
      npc_trainer_ranger: { label: 'Ranger Trainer', icon: Target },
      npc_trainer_paladin: { label: 'Paladin Trainer', icon: Shield },
      npc_trainer_rogue: { label: 'Rogue Trainer', icon: User },
      npc_priest: { label: 'Priest/Healer', icon: Heart },
      npc_monk: { label: 'Monk', icon: Church },
      npc_nun: { label: 'Nun', icon: Church },
      npc_king: { label: 'King', icon: Crown },
      npc_queen: { label: 'Queen', icon: Crown },
      npc_prince: { label: 'Prince', icon: Crown },
      npc_princess: { label: 'Princess', icon: Crown },
      npc_noble_male: { label: 'Nobleman', icon: Crown },
      npc_noble_female: { label: 'Noblewoman', icon: Crown },
      npc_wizard: { label: 'Wizard', icon: Wand2 },
      npc_witch: { label: 'Witch', icon: Wand2 },
      npc_scholar: { label: 'Scholar', icon: BookOpen },
      npc_scribe: { label: 'Scribe', icon: Scroll },
      npc_farmer: { label: 'Farmer', icon: Leaf },
      npc_fisherman: { label: 'Fisherman', icon: Fish },
      npc_miner: { label: 'Miner', icon: Pickaxe },
      npc_lumberjack: { label: 'Lumberjack', icon: Axe },
      npc_hunter: { label: 'Hunter', icon: Target },
      npc_stable_master: { label: 'Stable Master', icon: Cat },
      npc_sailor: { label: 'Sailor', icon: Anchor },
      npc_pirate: { label: 'Pirate', icon: Skull },
      npc_beggar: { label: 'Beggar', icon: User },
      npc_thief: { label: 'Thief', icon: Lock },
      npc_assassin: { label: 'Assassin', icon: Skull },
      npc_bard: { label: 'Bard', icon: Music },
      npc_jester: { label: 'Jester', icon: Star },
      npc_dancer: { label: 'Dancer', icon: Music },
      npc_child: { label: 'Child', icon: User },
      npc_spirit: { label: 'Spirit/Ghost', icon: Wind },
    }
  },
  vendors: {
    label: 'Vendor NPCs',
    icon: Store,
    color: '#22c55e',
    types: {
      vendor_blacksmith: { label: 'Blacksmith', icon: Axe },
      vendor_general: { label: 'General Goods', icon: Store },
      vendor_trade: { label: 'Trade Goods', icon: Gem },
      vendor_food: { label: 'Food Vendor', icon: Utensils },
      vendor_drinks: { label: 'Drinks Vendor', icon: Droplets },
      vendor_weapons: { label: 'Weapons', icon: Sword },
      vendor_armor: { label: 'Armor', icon: Shield },
      vendor_potions: { label: 'Potions', icon: Droplets },
      vendor_magic: { label: 'Magic Supplies', icon: Wand2 },
      vendor_scrolls: { label: 'Scrolls', icon: Scroll },
      vendor_books: { label: 'Books', icon: BookOpen },
      vendor_jewelry: { label: 'Jewelry', icon: Gem },
      vendor_cloth: { label: 'Cloth/Tailor', icon: Home },
      vendor_leather: { label: 'Leatherworker', icon: Home },
      vendor_herbs: { label: 'Herbalist', icon: Leaf },
      vendor_pets: { label: 'Pet Vendor', icon: Cat },
      vendor_mounts: { label: 'Mount Vendor', icon: Cat },
      vendor_fishing: { label: 'Fishing Supplies', icon: Fish },
      vendor_mining: { label: 'Mining Supplies', icon: Pickaxe },
      vendor_engineering: { label: 'Engineering', icon: Hammer },
      vendor_exotic: { label: 'Exotic Goods', icon: Star },
      vendor_black_market: { label: 'Black Market', icon: Skull },
    }
  },
  monsters: {
    label: 'Monsters',
    icon: Skull,
    color: '#dc2626',
    types: {
      monster_goblin: { label: 'Goblin', icon: Skull },
      monster_goblin_chief: { label: 'Goblin Chief', icon: Crown },
      monster_goblin_shaman: { label: 'Goblin Shaman', icon: Wand2 },
      monster_wolf: { label: 'Wolf', icon: Cat },
      monster_wolf_alpha: { label: 'Alpha Wolf', icon: Cat },
      monster_wolf_dire: { label: 'Dire Wolf', icon: Skull },
      monster_bear: { label: 'Bear', icon: Cat },
      monster_bear_dire: { label: 'Dire Bear', icon: Skull },
      monster_boar: { label: 'Wild Boar', icon: Cat },
      monster_rat_giant: { label: 'Giant Rat', icon: Bug },
      monster_skeleton: { label: 'Skeleton', icon: Bone },
      monster_skeleton_warrior: { label: 'Skeleton Warrior', icon: Sword },
      monster_skeleton_mage: { label: 'Skeleton Mage', icon: Wand2 },
      monster_skeleton_archer: { label: 'Skeleton Archer', icon: Target },
      monster_zombie: { label: 'Zombie', icon: Skull },
      monster_zombie_hulk: { label: 'Zombie Hulk', icon: Skull },
      monster_ghoul: { label: 'Ghoul', icon: Skull },
      monster_ghost: { label: 'Ghost/Spirit', icon: Wind },
      monster_wraith: { label: 'Wraith', icon: Wind },
      monster_banshee: { label: 'Banshee', icon: Music },
      monster_vampire: { label: 'Vampire', icon: Skull },
      monster_lich: { label: 'Lich', icon: Crown },
      monster_spider: { label: 'Giant Spider', icon: Bug },
      monster_spider_queen: { label: 'Spider Queen', icon: Crown },
      monster_scorpion: { label: 'Giant Scorpion', icon: Bug },
      monster_centipede: { label: 'Giant Centipede', icon: Bug },
      monster_troll: { label: 'Troll', icon: Skull },
      monster_troll_cave: { label: 'Cave Troll', icon: Mountain },
      monster_troll_ice: { label: 'Ice Troll', icon: Snowflake },
      monster_ogre: { label: 'Ogre', icon: Skull },
      monster_ogre_mage: { label: 'Ogre Mage', icon: Wand2 },
      monster_orc: { label: 'Orc', icon: Skull },
      monster_orc_chief: { label: 'Orc Chieftain', icon: Crown },
      monster_orc_shaman: { label: 'Orc Shaman', icon: Wand2 },
      monster_orc_berserker: { label: 'Orc Berserker', icon: Axe },
      monster_bat: { label: 'Giant Bat', icon: Bird },
      monster_bat_vampire: { label: 'Vampire Bat', icon: Skull },
      monster_slime: { label: 'Slime', icon: Droplets },
      monster_slime_large: { label: 'Large Slime', icon: Droplets },
      monster_slime_toxic: { label: 'Toxic Slime', icon: Skull },
      monster_elemental_fire: { label: 'Fire Elemental', icon: Flame },
      monster_elemental_ice: { label: 'Ice Elemental', icon: Snowflake },
      monster_elemental_earth: { label: 'Earth Elemental', icon: Mountain },
      monster_elemental_water: { label: 'Water Elemental', icon: Droplets },
      monster_elemental_air: { label: 'Air Elemental', icon: Wind },
      monster_dragon: { label: 'Dragon', icon: Flame },
      monster_dragon_young: { label: 'Young Dragon', icon: Flame },
      monster_dragon_ice: { label: 'Ice Dragon', icon: Snowflake },
      monster_wyvern: { label: 'Wyvern', icon: Bird },
      monster_drake: { label: 'Drake', icon: Flame },
      monster_demon: { label: 'Demon', icon: Flame },
      monster_demon_lord: { label: 'Demon Lord', icon: Crown },
      monster_imp: { label: 'Imp', icon: Flame },
      monster_succubus: { label: 'Succubus', icon: Heart },
      monster_golem: { label: 'Golem', icon: Mountain },
      monster_golem_iron: { label: 'Iron Golem', icon: Shield },
      monster_golem_crystal: { label: 'Crystal Golem', icon: Gem },
      monster_treant: { label: 'Treant', icon: TreePine },
      monster_ent: { label: 'Ent', icon: TreePine },
      monster_harpy: { label: 'Harpy', icon: Bird },
      monster_siren: { label: 'Siren', icon: Music },
      monster_minotaur: { label: 'Minotaur', icon: Skull },
      monster_centaur: { label: 'Centaur', icon: Cat },
      monster_naga: { label: 'Naga', icon: Fish },
      monster_medusa: { label: 'Medusa', icon: Skull },
      monster_cyclops: { label: 'Cyclops', icon: Eye },
      monster_giant: { label: 'Giant', icon: Mountain },
      monster_ettin: { label: 'Ettin', icon: Skull },
      monster_hydra: { label: 'Hydra', icon: Skull },
      monster_basilisk: { label: 'Basilisk', icon: Bug },
      monster_chimera: { label: 'Chimera', icon: Flame },
      monster_manticore: { label: 'Manticore', icon: Cat },
      monster_griffin: { label: 'Griffin', icon: Bird },
      monster_phoenix: { label: 'Phoenix', icon: Flame },
      monster_unicorn_dark: { label: 'Dark Unicorn', icon: Cat },
    }
  },
  animals: {
    label: 'Animals',
    icon: Bird,
    color: '#84cc16',
    types: {
      animal_chicken: { label: 'Chicken', icon: Bird },
      animal_rooster: { label: 'Rooster', icon: Bird },
      animal_pig: { label: 'Pig', icon: Cat },
      animal_cow: { label: 'Cow', icon: Cat },
      animal_bull: { label: 'Bull', icon: Cat },
      animal_sheep: { label: 'Sheep', icon: Cat },
      animal_goat: { label: 'Goat', icon: Cat },
      animal_horse: { label: 'Horse', icon: Cat },
      animal_horse_war: { label: 'War Horse', icon: Sword },
      animal_donkey: { label: 'Donkey', icon: Cat },
      animal_mule: { label: 'Mule', icon: Cat },
      animal_deer: { label: 'Deer', icon: Cat },
      animal_stag: { label: 'Stag', icon: Crown },
      animal_elk: { label: 'Elk', icon: Cat },
      animal_rabbit: { label: 'Rabbit', icon: Cat },
      animal_fox: { label: 'Fox', icon: Cat },
      animal_wolf_tame: { label: 'Tame Wolf', icon: Cat },
      animal_crow: { label: 'Crow', icon: Bird },
      animal_raven: { label: 'Raven', icon: Bird },
      animal_owl: { label: 'Owl', icon: Bird },
      animal_eagle: { label: 'Eagle', icon: Bird },
      animal_hawk: { label: 'Hawk', icon: Bird },
      animal_parrot: { label: 'Parrot', icon: Bird },
      animal_peacock: { label: 'Peacock', icon: Bird },
      animal_swan: { label: 'Swan', icon: Bird },
      animal_duck: { label: 'Duck', icon: Bird },
      animal_fish: { label: 'Fish', icon: Fish },
      animal_fish_large: { label: 'Large Fish', icon: Fish },
      animal_frog: { label: 'Frog', icon: Bug },
      animal_turtle: { label: 'Turtle', icon: Bug },
      animal_snake: { label: 'Snake', icon: Bug },
      animal_cat: { label: 'Cat', icon: Cat },
      animal_dog: { label: 'Dog', icon: Cat },
      animal_hound: { label: 'Hound', icon: Cat },
      animal_bear_tame: { label: 'Tame Bear', icon: Cat },
      animal_boar_tame: { label: 'Tame Boar', icon: Cat },
    }
  },
  magical: {
    label: 'Magical Items',
    icon: Sparkles,
    color: '#a855f7',
    types: {
      portal: { label: 'Portal', icon: Zap },
      portal_dungeon: { label: 'Dungeon Portal', icon: Skull },
      portal_teleport: { label: 'Teleport Portal', icon: Sparkles },
      portal_dimension: { label: 'Dimension Rift', icon: Star },
      magic_circle: { label: 'Magic Circle', icon: Sparkles },
      magic_rune_floor: { label: 'Floor Rune', icon: Sparkles },
      magic_rune_wall: { label: 'Wall Rune', icon: Sparkles },
      magic_barrier: { label: 'Magic Barrier', icon: Shield },
      crystal_ball: { label: 'Crystal Ball', icon: Gem },
      crystal_floating: { label: 'Floating Crystal', icon: Gem },
      crystal_power: { label: 'Power Crystal', icon: Zap },
      orb_light: { label: 'Light Orb', icon: Sun },
      orb_dark: { label: 'Dark Orb', icon: Moon },
      orb_elemental: { label: 'Elemental Orb', icon: Flame },
      wand_display: { label: 'Display Wand', icon: Wand2 },
      staff_display: { label: 'Display Staff', icon: Wand2 },
      tome_floating: { label: 'Floating Tome', icon: BookOpen },
      tome_ancient: { label: 'Ancient Tome', icon: BookOpen },
      scroll_floating: { label: 'Floating Scroll', icon: Scroll },
      cauldron: { label: 'Cauldron', icon: Flame },
      cauldron_bubbling: { label: 'Bubbling Cauldron', icon: Droplets },
      altar: { label: 'Altar', icon: Star },
      altar_sacrifice: { label: 'Sacrifice Altar', icon: Skull },
      altar_blessing: { label: 'Blessing Altar', icon: Heart },
      shrine: { label: 'Shrine', icon: Star },
      shrine_healing: { label: 'Healing Shrine', icon: Heart },
      shrine_mana: { label: 'Mana Shrine', icon: Droplets },
      obelisk: { label: 'Obelisk', icon: Mountain },
      obelisk_power: { label: 'Power Obelisk', icon: Zap },
      totem: { label: 'Totem Pole', icon: TreePine },
      totem_spirit: { label: 'Spirit Totem', icon: Wind },
      runestone: { label: 'Runestone', icon: Mountain },
      runestone_glowing: { label: 'Glowing Runestone', icon: Sparkles },
      mystical_tree: { label: 'Mystical Tree', icon: TreePine },
      ley_line_node: { label: 'Ley Line Node', icon: Zap },
      soul_well: { label: 'Soul Well', icon: Skull },
      mana_font: { label: 'Mana Font', icon: Droplets },
      enchanted_mirror: { label: 'Enchanted Mirror', icon: Gem },
      summoning_circle: { label: 'Summoning Circle', icon: Skull },
      pentagram: { label: 'Pentagram', icon: Star },
    }
  },
  treasure: {
    label: 'Treasure & Loot',
    icon: Crown,
    color: '#eab308',
    types: {
      treasure_chest: { label: 'Treasure Chest', icon: Crown },
      treasure_chest_large: { label: 'Large Chest', icon: Crown },
      treasure_chest_ornate: { label: 'Ornate Chest', icon: Crown },
      treasure_chest_locked: { label: 'Locked Chest', icon: Lock },
      treasure_chest_mimic: { label: 'Mimic Chest', icon: Skull },
      treasure_pile: { label: 'Gold Pile', icon: Crown },
      treasure_pile_large: { label: 'Large Gold Pile', icon: Crown },
      coin_stack: { label: 'Coin Stack', icon: Crown },
      gem_pile: { label: 'Gem Pile', icon: Gem },
      jewelry_box: { label: 'Jewelry Box', icon: Gem },
      crown_display: { label: 'Crown Display', icon: Crown },
      chalice: { label: 'Golden Chalice', icon: Crown },
      goblet: { label: 'Goblet', icon: Crown },
      scepter: { label: 'Scepter', icon: Crown },
      artifact_ancient: { label: 'Ancient Artifact', icon: Star },
      relic: { label: 'Holy Relic', icon: Church },
      idol: { label: 'Golden Idol', icon: Crown },
    }
  },
  crafting: {
    label: 'Crafting Stations',
    icon: Hammer,
    color: '#f97316',
    types: {
      alchemy_table: { label: 'Alchemy Table', icon: Droplets },
      enchanting_table: { label: 'Enchanting Table', icon: Sparkles },
      cooking_station: { label: 'Cooking Station', icon: Utensils },
      cooking_pot: { label: 'Cooking Pot', icon: Flame },
      cooking_spit: { label: 'Cooking Spit', icon: Flame },
      forge: { label: 'Forge', icon: Flame },
      forge_large: { label: 'Large Forge', icon: Flame },
      smelter: { label: 'Smelter', icon: Flame },
      anvil_work: { label: 'Work Anvil', icon: Hammer },
      tanning_rack: { label: 'Tanning Rack', icon: Leaf },
      loom: { label: 'Loom', icon: Home },
      spinning_wheel: { label: 'Spinning Wheel', icon: Home },
      carpenter_bench: { label: 'Carpenter Bench', icon: Axe },
      jeweler_bench: { label: 'Jeweler Bench', icon: Gem },
      inscription_desk: { label: 'Inscription Desk', icon: Scroll },
      potion_brewing: { label: 'Brewing Stand', icon: Droplets },
      grindstone: { label: 'Grindstone', icon: Mountain },
      bellows: { label: 'Bellows', icon: Wind },
      workbench: { label: 'Workbench', icon: Hammer },
      tool_rack: { label: 'Tool Rack', icon: Hammer },
      kiln: { label: 'Kiln', icon: Flame },
      pottery_wheel: { label: 'Pottery Wheel', icon: Home },
      dye_vat: { label: 'Dye Vat', icon: Droplets },
    }
  },
  furniture: {
    label: 'Furniture',
    icon: Bed,
    color: '#8b5cf6',
    types: {
      bed_single: { label: 'Single Bed', icon: Bed },
      bed_double: { label: 'Double Bed', icon: Bed },
      bed_royal: { label: 'Royal Bed', icon: Crown },
      bed_bunk: { label: 'Bunk Bed', icon: Bed },
      bed_hammock: { label: 'Hammock', icon: Bed },
      bed_roll: { label: 'Bedroll', icon: Bed },
      wardrobe: { label: 'Wardrobe', icon: Home },
      wardrobe_ornate: { label: 'Ornate Wardrobe', icon: Crown },
      dresser: { label: 'Dresser', icon: Home },
      vanity: { label: 'Vanity Table', icon: Home },
      mirror: { label: 'Mirror', icon: Home },
      desk: { label: 'Desk', icon: Home },
      writing_desk: { label: 'Writing Desk', icon: Scroll },
      throne: { label: 'Throne', icon: Crown },
      throne_evil: { label: 'Dark Throne', icon: Skull },
      armchair: { label: 'Armchair', icon: Home },
      armchair_ornate: { label: 'Ornate Armchair', icon: Crown },
      stool: { label: 'Stool', icon: Home },
      stool_bar: { label: 'Bar Stool', icon: Home },
      dining_table: { label: 'Dining Table', icon: Utensils },
      dining_table_long: { label: 'Long Dining Table', icon: Utensils },
      round_table: { label: 'Round Table', icon: Home },
      coffee_table: { label: 'Coffee Table', icon: Home },
      end_table: { label: 'End Table', icon: Home },
      bookcase: { label: 'Bookcase', icon: BookOpen },
      bookcase_tall: { label: 'Tall Bookcase', icon: BookOpen },
      bookshelf_wall: { label: 'Wall Bookshelf', icon: BookOpen },
      cabinet: { label: 'Cabinet', icon: Home },
      cabinet_display: { label: 'Display Cabinet', icon: Gem },
      chest_storage: { label: 'Storage Chest', icon: Home },
      trunk: { label: 'Trunk', icon: Home },
      rug: { label: 'Rug', icon: Home },
      rug_ornate: { label: 'Ornate Rug', icon: Crown },
      rug_bear: { label: 'Bear Rug', icon: Cat },
      curtains: { label: 'Curtains', icon: Home },
      curtains_heavy: { label: 'Heavy Curtains', icon: Home },
      chandelier: { label: 'Chandelier', icon: Lamp },
      fireplace: { label: 'Fireplace', icon: Flame },
      fireplace_ornate: { label: 'Ornate Fireplace', icon: Crown },
      mantle: { label: 'Fireplace Mantle', icon: Home },
      piano: { label: 'Piano', icon: Music },
      harp: { label: 'Harp', icon: Music },
      grandfather_clock: { label: 'Grandfather Clock', icon: Home },
      globe: { label: 'Globe', icon: Compass },
      painting: { label: 'Painting', icon: Home },
      painting_portrait: { label: 'Portrait', icon: User },
      painting_landscape: { label: 'Landscape Painting', icon: TreePine },
      weapon_mount: { label: 'Weapon Mount', icon: Sword },
      trophy_mount: { label: 'Trophy Mount', icon: Skull },
    }
  },
  market: {
    label: 'Market & Trade',
    icon: Store,
    color: '#eab308',
    types: {
      market_stall_food: { label: 'Food Stall', icon: Utensils },
      market_stall_fruit: { label: 'Fruit Stall', icon: Leaf },
      market_stall_meat: { label: 'Meat Stall', icon: Utensils },
      market_stall_fish: { label: 'Fish Stall', icon: Fish },
      market_stall_bread: { label: 'Bread Stall', icon: Utensils },
      market_stall_cloth: { label: 'Cloth Stall', icon: Store },
      market_stall_weapons: { label: 'Weapon Stall', icon: Sword },
      market_stall_armor: { label: 'Armor Stall', icon: Shield },
      market_stall_potions: { label: 'Potion Stall', icon: Droplets },
      market_stall_jewelry: { label: 'Jewelry Stall', icon: Gem },
      market_stall_books: { label: 'Book Stall', icon: BookOpen },
      market_stall_flowers: { label: 'Flower Stall', icon: Flower2 },
      market_stall_general: { label: 'General Stall', icon: Store },
      market_stall_exotic: { label: 'Exotic Goods', icon: Star },
      auction_podium: { label: 'Auction Podium', icon: Crown },
      trading_post: { label: 'Trading Post', icon: Store },
      bank_counter: { label: 'Bank Counter', icon: Crown },
      bank_vault: { label: 'Bank Vault', icon: Lock },
      notice_board: { label: 'Notice Board', icon: Scroll },
      quest_board: { label: 'Quest Board', icon: Scroll },
      wanted_poster: { label: 'Wanted Poster', icon: Skull },
      merchant_tent: { label: 'Merchant Tent', icon: Tent },
      scales: { label: 'Weighing Scales', icon: Crown },
      cash_register: { label: 'Cash Box', icon: Crown },
      safe: { label: 'Safe', icon: Lock },
      display_case: { label: 'Display Case', icon: Gem },
      display_pedestal: { label: 'Display Pedestal', icon: Crown },
    }
  },
  dungeon: {
    label: 'Dungeon & Prison',
    icon: Lock,
    color: '#64748b',
    types: {
      prison_cell: { label: 'Prison Cell', icon: Lock },
      prison_door: { label: 'Prison Door', icon: DoorOpen },
      cage_hanging: { label: 'Hanging Cage', icon: Lock },
      cage_floor: { label: 'Floor Cage', icon: Lock },
      cage_large: { label: 'Large Cage', icon: Lock },
      chains_wall: { label: 'Wall Chains', icon: Lock },
      chains_floor: { label: 'Floor Chains', icon: Lock },
      chains_hanging: { label: 'Hanging Chains', icon: Lock },
      shackles: { label: 'Shackles', icon: Lock },
      torture_rack: { label: 'Torture Rack', icon: Skull },
      iron_maiden: { label: 'Iron Maiden', icon: Skull },
      stocks: { label: 'Stocks', icon: Lock },
      pillory: { label: 'Pillory', icon: Lock },
      gallows: { label: 'Gallows', icon: Skull },
      guillotine: { label: 'Guillotine', icon: Skull },
      dungeon_door: { label: 'Dungeon Door', icon: DoorOpen },
      dungeon_gate: { label: 'Dungeon Gate', icon: DoorOpen },
      spike_trap: { label: 'Spike Trap', icon: Skull },
      spike_wall: { label: 'Spike Wall', icon: Skull },
      pressure_plate: { label: 'Pressure Plate', icon: Mountain },
      trap_door: { label: 'Trap Door', icon: DoorOpen },
      secret_passage: { label: 'Secret Passage', icon: DoorOpen },
      cobweb_large: { label: 'Large Cobweb', icon: Bug },
      moss_wall: { label: 'Wall Moss', icon: Leaf },
      dripping_water: { label: 'Dripping Water', icon: Droplets },
      blood_splatter: { label: 'Blood Splatter', icon: Skull },
      rat_hole: { label: 'Rat Hole', icon: Bug },
    }
  },
  military: {
    label: 'Military & Siege',
    icon: Sword,
    color: '#dc2626',
    types: {
      catapult: { label: 'Catapult', icon: Target },
      trebuchet: { label: 'Trebuchet', icon: Target },
      ballista: { label: 'Ballista', icon: Target },
      battering_ram: { label: 'Battering Ram', icon: DoorOpen },
      siege_tower: { label: 'Siege Tower', icon: Castle },
      cannon: { label: 'Cannon', icon: Flame },
      war_tent: { label: 'War Tent', icon: Tent },
      command_table: { label: 'Command Table', icon: MapPin },
      war_banner: { label: 'War Banner', icon: Flag },
      shield_wall: { label: 'Shield Wall', icon: Shield },
      pike_wall: { label: 'Pike Wall', icon: Sword },
      arrow_stack: { label: 'Arrow Stack', icon: Target },
      weapon_crate: { label: 'Weapon Crate', icon: Sword },
      armor_crate: { label: 'Armor Crate', icon: Shield },
      supply_wagon: { label: 'Supply Wagon', icon: Home },
      medical_tent: { label: 'Medical Tent', icon: Heart },
      watchtower_siege: { label: 'Siege Watchtower', icon: Eye },
      fortification: { label: 'Field Fortification', icon: Shield },
    }
  },
  agriculture: {
    label: 'Agriculture',
    icon: Leaf,
    color: '#65a30d',
    types: {
      farm_plot_empty: { label: 'Empty Farm Plot', icon: Mountain },
      farm_plot_wheat: { label: 'Wheat Field', icon: Leaf },
      farm_plot_corn: { label: 'Corn Field', icon: Leaf },
      farm_plot_vegetables: { label: 'Vegetable Garden', icon: Flower2 },
      farm_plot_herbs: { label: 'Herb Garden', icon: Leaf },
      farm_plot_grapes: { label: 'Vineyard', icon: Leaf },
      farm_plot_pumpkin: { label: 'Pumpkin Patch', icon: Flower2 },
      orchard_tree: { label: 'Orchard Tree', icon: TreePine },
      scarecrow: { label: 'Scarecrow', icon: User },
      plow: { label: 'Plow', icon: Axe },
      hoe: { label: 'Hoe', icon: Shovel },
      water_trough: { label: 'Water Trough', icon: Droplets },
      feed_trough: { label: 'Feed Trough', icon: Home },
      chicken_coop: { label: 'Chicken Coop', icon: Bird },
      pig_pen: { label: 'Pig Pen', icon: Cat },
      sheep_pen: { label: 'Sheep Pen', icon: Cat },
      stable: { label: 'Stable', icon: Cat },
      stable_large: { label: 'Large Stable', icon: Home },
      silo: { label: 'Silo', icon: Warehouse },
      grain_mill: { label: 'Grain Mill', icon: Home },
      wine_press: { label: 'Wine Press', icon: Droplets },
      beehive: { label: 'Beehive', icon: Bug },
      compost_heap: { label: 'Compost Heap', icon: Leaf },
      well_farm: { label: 'Farm Well', icon: Droplets },
      irrigation_channel: { label: 'Irrigation', icon: Droplets },
    }
  },
  maritime: {
    label: 'Maritime & Ships',
    icon: Anchor,
    color: '#0ea5e9',
    types: {
      ship_small: { label: 'Small Ship', icon: Anchor },
      ship_medium: { label: 'Medium Ship', icon: Anchor },
      ship_large: { label: 'Large Ship', icon: Anchor },
      ship_pirate: { label: 'Pirate Ship', icon: Skull },
      ship_warship: { label: 'Warship', icon: Sword },
      rowboat: { label: 'Rowboat', icon: Anchor },
      canoe: { label: 'Canoe', icon: Anchor },
      raft: { label: 'Raft', icon: Anchor },
      dock_small: { label: 'Small Dock', icon: Anchor },
      dock_large: { label: 'Large Dock', icon: Anchor },
      pier: { label: 'Pier', icon: Anchor },
      boardwalk: { label: 'Boardwalk', icon: Home },
      lighthouse_small: { label: 'Small Lighthouse', icon: Lamp },
      buoy: { label: 'Buoy', icon: Anchor },
      anchor_display: { label: 'Anchor Display', icon: Anchor },
      ship_wheel: { label: 'Ship Wheel', icon: Compass },
      mast: { label: 'Ship Mast', icon: Anchor },
      sail: { label: 'Sail', icon: Wind },
      cargo_crane: { label: 'Cargo Crane', icon: Anchor },
      fishing_net_drying: { label: 'Drying Net', icon: Fish },
      lobster_trap: { label: 'Lobster Trap', icon: Fish },
      barrel_fish: { label: 'Fish Barrel', icon: Fish },
      crate_shipping: { label: 'Shipping Crate', icon: Home },
    }
  }
};

const WorldEditor = ({ 
  isOpen, 
  onClose, 
  onPlaceObject, 
  onDeleteObject,
  onSaveWorld,
  onLoadWorld,
  placedObjects = [],
  selectedEditObject,
  onSelectEditObject,
  currentZone,
  onUpdatePreview // Callback to update preview in real-time
}) => {
  const [selectedCategory, setSelectedCategory] = useState('nature');
  const [selectedType, setSelectedType] = useState('tree_pine');
  const [objectName, setObjectName] = useState('');
  const [objectLevel, setObjectLevel] = useState(1);
  const [objectScale, setObjectScale] = useState(1);
  const [objectRotation, setObjectRotation] = useState(0); // Rotation in degrees (0-360)
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [showObjectList, setShowObjectList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Set default type when category changes
    const category = OBJECT_CATEGORIES[selectedCategory];
    if (category) {
      const firstType = Object.keys(category.types)[0];
      setSelectedType(firstType);
    }
  }, [selectedCategory]);
  
  // Notify parent of scale/rotation changes for real-time preview
  useEffect(() => {
    if (onUpdatePreview && isPlacingMode) {
      onUpdatePreview({ scale: objectScale, rotation: objectRotation });
    }
  }, [objectScale, objectRotation, isPlacingMode, onUpdatePreview]);

  const handlePlace = () => {
    setIsPlacingMode(true);
    const category = OBJECT_CATEGORIES[selectedCategory];
    const typeInfo = category?.types[selectedType];
    
    // Determine the base type for the placement system
    let baseType = 'prop';
    let subType = selectedType;
    
    if (selectedCategory === 'nature') {
      if (selectedType.startsWith('tree')) baseType = 'tree';
      else baseType = 'plant';
    } else if (selectedCategory === 'rocks') {
      if (selectedType.startsWith('ore')) baseType = 'rock';
      else baseType = 'rock';
    } else if (selectedCategory === 'buildings') {
      baseType = 'building';
    } else if (selectedCategory === 'props') {
      baseType = 'prop';
    } else if (selectedCategory === 'npcs') {
      baseType = 'npc';
      subType = selectedType.replace('npc_', '');
    } else if (selectedCategory === 'vendors') {
      baseType = 'vendor';
      subType = selectedType.replace('vendor_', '');
    } else if (selectedCategory === 'monsters') {
      baseType = 'monster';
      subType = selectedType.replace('monster_', '');
    } else if (selectedCategory === 'animals') {
      baseType = 'animal';
    } else if (selectedCategory === 'special') {
      baseType = 'special';
    }
    
    onPlaceObject({
      type: baseType,
      subType: subType,
      fullType: selectedType,
      category: selectedCategory,
      name: objectName || typeInfo?.label || selectedType,
      level: objectLevel,
      scale: objectScale,
      rotation: objectRotation // Add rotation to placement data
    });
  };

  const handleExport = () => {
    const worldData = {
      zone: currentZone,
      objects: placedObjects,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(worldData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world_${currentZone}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const worldData = JSON.parse(event.target.result);
          onLoadWorld(worldData);
        } catch (err) {
          console.error('Failed to parse world file:', err);
          alert('Invalid world file format');
        }
      };
      reader.readAsText(file);
    }
  };

  // Filter types based on search
  const getFilteredTypes = () => {
    const category = OBJECT_CATEGORIES[selectedCategory];
    if (!category) return {};
    
    if (!searchQuery) return category.types;
    
    const filtered = {};
    Object.entries(category.types).forEach(([key, value]) => {
      if (value.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        filtered[key] = value;
      }
    });
    return filtered;
  };

  if (!isOpen) return null;

  const currentCategory = OBJECT_CATEGORIES[selectedCategory];
  const filteredTypes = getFilteredTypes();

  return (
    <div className="fixed top-20 left-4 z-50 pointer-events-auto" data-testid="world-editor">
      <div className="bg-[#1a1a1a]/95 border-2 border-[#fbbf24] rounded-lg shadow-2xl w-96 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#fbbf24] px-4 py-2 rounded-t-lg flex items-center justify-between flex-shrink-0">
          <h2 className="font-cinzel font-bold text-[#1a1a1a]">World Builder</h2>
          <button 
            onClick={onClose}
            className="text-[#1a1a1a] hover:text-[#dc2626] font-bold"
          >
            ✕
          </button>
        </div>

        {/* Quick Action Toolbar - Always Visible */}
        <div className="bg-[#2a2a2a] px-4 py-2 border-b border-[#44403c] flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handlePlace}
              className="flex-1 py-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-bold rounded flex items-center justify-center gap-1 text-sm hover:shadow-lg transition-all"
              data-testid="quick-place-btn"
            >
              <Plus className="w-4 h-4" />
              Place
            </button>
            <button
              onClick={() => setShowObjectList(true)}
              className={`flex-1 py-2 font-bold rounded flex items-center justify-center gap-1 text-sm transition-all ${
                placedObjects.length > 0 
                  ? 'bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white hover:shadow-lg'
                  : 'bg-[#44403c] text-[#6b6b6b] cursor-not-allowed'
              }`}
              disabled={placedObjects.length === 0}
              data-testid="quick-delete-btn"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({placedObjects.length})
            </button>
          </div>
          
          {/* Selected Object Quick Delete */}
          {selectedEditObject && (
            <div className="mt-2 p-2 bg-[#dc2626]/20 border border-[#dc2626] rounded">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#fca5a5]">Selected: <span className="text-white font-semibold">{selectedEditObject.name || selectedEditObject.fullType || selectedEditObject.type}</span></span>
                <button
                  onClick={() => onDeleteObject(selectedEditObject.id)}
                  className="px-3 py-1 bg-[#dc2626] text-white text-xs font-bold rounded hover:bg-[#ef4444] transition-all flex items-center gap-1"
                  data-testid="quick-delete-selected-btn"
                >
                  <Trash2 className="w-3 h-3" />
                  DELETE
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Current Zone */}
          <div className="text-xs text-[#a8a29e] font-rajdhani">
            Editing: <span className="text-[#fbbf24]">{currentZone}</span>
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-xs text-[#a8a29e] font-rajdhani block mb-2">Category</label>
            <div className="grid grid-cols-4 gap-1">
              {Object.entries(OBJECT_CATEGORIES).map(([key, { icon: Icon, color, label }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`p-2 rounded border transition-all flex flex-col items-center ${
                    selectedCategory === key 
                      ? 'border-[#fbbf24] bg-[#fbbf24]/20' 
                      : 'border-[#44403c] hover:border-[#57534e]'
                  }`}
                  title={label}
                  data-testid={`category-${key}`}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-[9px] mt-1 text-[#a8a29e] truncate w-full text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search objects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-[#f5f5f4] text-sm placeholder-[#57534e]"
            />
          </div>

          {/* Object Type Selection */}
          <div>
            <label className="text-xs text-[#a8a29e] font-rajdhani block mb-2">
              {currentCategory?.label} Objects ({Object.keys(filteredTypes).length})
            </label>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto bg-[#0c0a09] p-2 rounded border border-[#44403c]">
              {Object.entries(filteredTypes).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={`p-2 rounded border text-left transition-all flex items-center gap-2 ${
                    selectedType === key 
                      ? 'border-[#fbbf24] bg-[#fbbf24]/20' 
                      : 'border-[#44403c] hover:border-[#57534e] hover:bg-[#1a1a1a]'
                  }`}
                  data-testid={`object-${key}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: currentCategory?.color }} />
                  <span className="text-xs text-[#e7e5e4] truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Object Settings */}
          <div className="grid grid-cols-2 gap-3">
            {/* Object Name */}
            <div>
              <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Name</label>
              <input
                type="text"
                placeholder="Custom name..."
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-2 py-1 text-[#f5f5f4] text-sm"
              />
            </div>

            {/* Level (for monsters/NPCs) */}
            {(selectedCategory === 'monsters' || selectedCategory === 'npcs') && (
              <div>
                <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Level</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={objectLevel}
                  onChange={(e) => setObjectLevel(Number(e.target.value))}
                  className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-2 py-1 text-[#f5f5f4] text-sm"
                />
              </div>
            )}

            {/* Scale */}
            <div>
              <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Scale</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={objectScale}
                onChange={(e) => setObjectScale(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-[#fbbf24]">{objectScale.toFixed(1)}x</span>
            </div>
            
            {/* Rotation */}
            <div>
              <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={objectRotation}
                onChange={(e) => setObjectRotation(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-[#fbbf24]">{objectRotation}°</span>
            </div>
          </div>
          
          {/* Quick Rotation Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setObjectRotation((prev) => (prev - 45 + 360) % 360)}
              className="flex-1 py-2 bg-[#1a1a1a] border border-[#44403c] text-[#fbbf24] rounded hover:bg-[#252525] transition-all"
              title="Rotate -45°"
            >
              ↺ -45°
            </button>
            <button
              onClick={() => setObjectRotation(0)}
              className="flex-1 py-2 bg-[#1a1a1a] border border-[#44403c] text-[#fbbf24] rounded hover:bg-[#252525] transition-all"
              title="Reset Rotation"
            >
              ⟲ Reset
            </button>
            <button
              onClick={() => setObjectRotation((prev) => (prev + 45) % 360)}
              className="flex-1 py-2 bg-[#1a1a1a] border border-[#44403c] text-[#fbbf24] rounded hover:bg-[#252525] transition-all"
              title="Rotate +45°"
            >
              ↻ +45°
            </button>
          </div>

          {/* Place Button */}
          <button
            onClick={handlePlace}
            className="w-full py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-cinzel font-bold rounded-lg hover:shadow-lg hover:shadow-[#22c55e]/30 transition-all flex items-center justify-center gap-2"
            data-testid="place-object-btn"
          >
            <Plus className="w-5 h-5" />
            Place {currentCategory?.types[selectedType]?.label || 'Object'}
          </button>

          {/* Delete Selected Object Button */}
          {selectedEditObject && (
            <button
              onClick={() => onDeleteObject(selectedEditObject.id)}
              className="w-full py-3 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white font-cinzel font-bold rounded-lg hover:shadow-lg hover:shadow-[#dc2626]/30 transition-all flex items-center justify-center gap-2 animate-pulse"
              data-testid="delete-selected-btn"
            >
              <Trash2 className="w-5 h-5" />
              Delete: {selectedEditObject.name || selectedEditObject.type}
            </button>
          )}

          {/* Selected Object Info */}
          {selectedEditObject && (
            <div className="bg-[#dc2626]/10 border border-[#dc2626]/50 rounded-lg p-3">
              <p className="text-xs text-[#fbbf24] font-semibold mb-1">Selected Object:</p>
              <p className="text-sm text-[#e7e5e4]">{selectedEditObject.name || selectedEditObject.type}</p>
              <p className="text-xs text-[#a8a29e]">
                Position: ({Math.round(selectedEditObject.position?.x || 0)}, {Math.round(selectedEditObject.position?.z || 0)})
              </p>
              <p className="text-xs text-[#57534e] mt-1">Press Delete key or click button above to remove</p>
            </div>
          )}

          {/* Object List Toggle */}
          <button
            onClick={() => setShowObjectList(!showObjectList)}
            className="w-full py-2 bg-[#44403c] text-[#e7e5e4] rounded flex items-center justify-center gap-2 hover:bg-[#57534e] transition-all"
            data-testid="toggle-object-list"
          >
            {showObjectList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Placed Objects ({placedObjects.length})
          </button>

          {/* Object List */}
          {showObjectList && (
            <div className="bg-[#0c0a09] border border-[#44403c] rounded p-2 max-h-40 overflow-y-auto space-y-1">
              {placedObjects.length === 0 ? (
                <p className="text-xs text-[#57534e] text-center py-2">No objects placed yet</p>
              ) : (
                placedObjects.map((obj, index) => (
                  <div 
                    key={obj.id || index}
                    className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all ${
                      selectedEditObject?.id === obj.id 
                        ? 'bg-[#fbbf24]/20 border border-[#fbbf24]' 
                        : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => onSelectEditObject(obj)}
                    data-testid={`placed-object-${obj.id || index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[#e7e5e4] truncate block">{obj.name || obj.fullType || obj.type}</span>
                      <span className="text-[#57534e]">({Math.round(obj.position?.x || 0)}, {Math.round(obj.position?.z || 0)})</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteObject(obj.id); }}
                      className="text-[#dc2626] hover:text-[#ef4444] p-1 ml-2 flex-shrink-0"
                      title="Delete this object"
                      data-testid={`delete-object-${obj.id || index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Clear All Button */}
          {placedObjects.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`Delete all ${placedObjects.length} placed objects?`)) {
                  placedObjects.forEach(obj => onDeleteObject(obj.id));
                }
              }}
              className="w-full py-2 bg-[#7f1d1d] text-[#fca5a5] rounded flex items-center justify-center gap-2 hover:bg-[#991b1b] transition-all text-sm"
              data-testid="clear-all-btn"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Objects ({placedObjects.length})
            </button>
          )}

          {/* Import/Export */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 py-2 bg-[#3b82f6] text-white rounded flex items-center justify-center gap-2 hover:bg-[#2563eb] transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <label className="flex-1 py-2 bg-[#8b5cf6] text-white rounded flex items-center justify-center gap-2 hover:bg-[#7c3aed] transition-all cursor-pointer text-sm">
              <Upload className="w-4 h-4" />
              Import
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Instructions */}
          <div className="text-[9px] text-[#57534e] space-y-0.5 border-t border-[#44403c] pt-2">
            <p>• Click <span className="text-[#22c55e]">Place</span> then click in the world</p>
            <p>• <span className="text-[#dc2626]">Delete/Backspace</span> removes selected object</p>
            <p>• Press <span className="text-[#fbbf24]">F1</span> to toggle editor</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldEditor;
