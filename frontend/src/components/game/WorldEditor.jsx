import { useState, useEffect } from 'react';
import { 
  TreePine, Home, User, Skull, Mountain, 
  Save, Trash2, Move, Plus, Eye, EyeOff,
  ChevronDown, ChevronUp, Download, Upload,
  Flower2, Fence, Lamp, Castle, Store, Church,
  Tent, Warehouse, Anchor, Axe, Sword, Shield,
  Crown, Gem, Bone, Bug, Bird, Fish, Cat,
  Flame, Droplets, Wind, Snowflake, Leaf,
  Hammer, Sparkles, Utensils, Lock, Bed
} from 'lucide-react';

// Expanded object categories and types
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
      bush: { label: 'Bush', icon: Leaf },
      bush_berry: { label: 'Berry Bush', icon: Flower2 },
      flower_patch: { label: 'Flowers', icon: Flower2 },
      tall_grass: { label: 'Tall Grass', icon: Leaf },
      mushroom: { label: 'Mushroom', icon: Bug },
      mushroom_cluster: { label: 'Mushroom Cluster', icon: Bug },
      log: { label: 'Fallen Log', icon: TreePine },
      stump: { label: 'Tree Stump', icon: TreePine },
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
      ore_copper: { label: 'Copper Ore', icon: Gem },
      ore_iron: { label: 'Iron Ore', icon: Gem },
      ore_gold: { label: 'Gold Ore', icon: Gem },
      ore_crystal: { label: 'Crystal Node', icon: Gem },
      ore_mithril: { label: 'Mithril Ore', icon: Gem },
      stalagmite: { label: 'Stalagmite', icon: Mountain },
      crystal_large: { label: 'Large Crystal', icon: Gem },
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
      shop: { label: 'Shop', icon: Store },
      inn: { label: 'Inn/Tavern', icon: Home },
      blacksmith: { label: 'Blacksmith', icon: Axe },
      tower: { label: 'Watch Tower', icon: Castle },
      tower_mage: { label: 'Mage Tower', icon: Castle },
      castle_wall: { label: 'Castle Wall', icon: Castle },
      castle_gate: { label: 'Castle Gate', icon: Castle },
      castle_tower: { label: 'Castle Tower', icon: Castle },
      church: { label: 'Church/Chapel', icon: Church },
      barn: { label: 'Barn', icon: Warehouse },
      windmill: { label: 'Windmill', icon: Wind },
      well: { label: 'Well', icon: Droplets },
      fountain: { label: 'Fountain', icon: Droplets },
      ruins: { label: 'Ruins', icon: Home },
      tent: { label: 'Tent', icon: Tent },
      tent_large: { label: 'Large Tent', icon: Tent },
      campfire: { label: 'Campfire', icon: Flame },
      bridge_wood: { label: 'Wooden Bridge', icon: Home },
      bridge_stone: { label: 'Stone Bridge', icon: Mountain },
      dock: { label: 'Dock/Pier', icon: Anchor },
    }
  },
  props: {
    label: 'Props & Decor',
    icon: Lamp,
    color: '#f59e0b',
    types: {
      barrel: { label: 'Barrel', icon: Home },
      barrel_stack: { label: 'Barrel Stack', icon: Home },
      crate: { label: 'Crate', icon: Home },
      crate_stack: { label: 'Crate Stack', icon: Home },
      cart: { label: 'Cart', icon: Home },
      wagon: { label: 'Wagon', icon: Home },
      fence_wood: { label: 'Wood Fence', icon: Fence },
      fence_stone: { label: 'Stone Wall', icon: Fence },
      fence_iron: { label: 'Iron Fence', icon: Fence },
      lamp_post: { label: 'Lamp Post', icon: Lamp },
      torch: { label: 'Torch', icon: Flame },
      torch_wall: { label: 'Wall Torch', icon: Flame },
      banner: { label: 'Banner', icon: Crown },
      sign_post: { label: 'Sign Post', icon: Home },
      grave: { label: 'Gravestone', icon: Mountain },
      grave_cross: { label: 'Grave Cross', icon: Plus },
      statue: { label: 'Statue', icon: User },
      statue_hero: { label: 'Hero Statue', icon: Sword },
      bench: { label: 'Bench', icon: Home },
      table: { label: 'Table', icon: Home },
      chair: { label: 'Chair', icon: Home },
      hay_pile: { label: 'Hay Pile', icon: Leaf },
      sack: { label: 'Sack', icon: Home },
      anvil: { label: 'Anvil', icon: Axe },
      weapon_rack: { label: 'Weapon Rack', icon: Sword },
      armor_stand: { label: 'Armor Stand', icon: Shield },
      boat_small: { label: 'Small Boat', icon: Anchor },
      fishing_rod: { label: 'Fishing Rod', icon: Fish },
    }
  },
  npcs: {
    label: 'NPCs',
    icon: User,
    color: '#3b82f6',
    types: {
      npc_villager_male: { label: 'Male Villager', icon: User },
      npc_villager_female: { label: 'Female Villager', icon: User },
      npc_guard: { label: 'Guard', icon: Shield },
      npc_guard_captain: { label: 'Guard Captain', icon: Crown },
      npc_innkeeper: { label: 'Innkeeper', icon: Home },
      npc_questgiver: { label: 'Quest Giver', icon: Crown },
      npc_trainer_warrior: { label: 'Warrior Trainer', icon: Sword },
      npc_trainer_mage: { label: 'Mage Trainer', icon: Gem },
      npc_trainer_ranger: { label: 'Ranger Trainer', icon: TreePine },
      npc_trainer_paladin: { label: 'Paladin Trainer', icon: Shield },
      npc_priest: { label: 'Priest/Healer', icon: Church },
      npc_king: { label: 'King/Noble', icon: Crown },
      npc_wizard: { label: 'Wizard', icon: Gem },
      npc_farmer: { label: 'Farmer', icon: Leaf },
      npc_fisherman: { label: 'Fisherman', icon: Fish },
      npc_miner: { label: 'Miner', icon: Mountain },
      npc_child: { label: 'Child', icon: User },
    }
  },
  vendors: {
    label: 'Vendor NPCs',
    icon: Store,
    color: '#22c55e',
    types: {
      vendor_blacksmith: { label: 'Blacksmith Vendor', icon: Axe },
      vendor_general: { label: 'General Goods', icon: Store },
      vendor_trade: { label: 'Trade Goods', icon: Gem },
      vendor_food: { label: 'Food & Water', icon: Utensils },
      vendor_weapons: { label: 'Weapons Vendor', icon: Sword },
      vendor_armor: { label: 'Armor Vendor', icon: Shield },
      vendor_potions: { label: 'Potions Vendor', icon: Droplets },
      vendor_magic: { label: 'Magic Supplies', icon: Sparkles },
    }
  },
  monsters: {
    label: 'Monsters',
    icon: Skull,
    color: '#dc2626',
    types: {
      monster_goblin: { label: 'Goblin', icon: Skull },
      monster_goblin_chief: { label: 'Goblin Chief', icon: Crown },
      monster_wolf: { label: 'Wolf', icon: Cat },
      monster_wolf_alpha: { label: 'Alpha Wolf', icon: Cat },
      monster_bear: { label: 'Bear', icon: Cat },
      monster_skeleton: { label: 'Skeleton', icon: Bone },
      monster_skeleton_warrior: { label: 'Skeleton Warrior', icon: Sword },
      monster_skeleton_mage: { label: 'Skeleton Mage', icon: Gem },
      monster_zombie: { label: 'Zombie', icon: Skull },
      monster_ghost: { label: 'Ghost/Spirit', icon: Wind },
      monster_spider: { label: 'Giant Spider', icon: Bug },
      monster_spider_queen: { label: 'Spider Queen', icon: Crown },
      monster_troll: { label: 'Troll', icon: Skull },
      monster_ogre: { label: 'Ogre', icon: Skull },
      monster_orc: { label: 'Orc', icon: Skull },
      monster_orc_chief: { label: 'Orc Chieftain', icon: Crown },
      monster_bat: { label: 'Giant Bat', icon: Bird },
      monster_slime: { label: 'Slime', icon: Droplets },
      monster_elemental_fire: { label: 'Fire Elemental', icon: Flame },
      monster_elemental_ice: { label: 'Ice Elemental', icon: Snowflake },
      monster_elemental_earth: { label: 'Earth Elemental', icon: Mountain },
      monster_dragon: { label: 'Dragon', icon: Flame },
      monster_wyvern: { label: 'Wyvern', icon: Bird },
      monster_demon: { label: 'Demon', icon: Flame },
      monster_imp: { label: 'Imp', icon: Flame },
      monster_golem: { label: 'Golem', icon: Mountain },
      monster_treant: { label: 'Treant', icon: TreePine },
    }
  },
  animals: {
    label: 'Animals',
    icon: Bird,
    color: '#84cc16',
    types: {
      animal_chicken: { label: 'Chicken', icon: Bird },
      animal_pig: { label: 'Pig', icon: Cat },
      animal_cow: { label: 'Cow', icon: Cat },
      animal_sheep: { label: 'Sheep', icon: Cat },
      animal_horse: { label: 'Horse', icon: Cat },
      animal_deer: { label: 'Deer', icon: Cat },
      animal_rabbit: { label: 'Rabbit', icon: Cat },
      animal_fox: { label: 'Fox', icon: Cat },
      animal_crow: { label: 'Crow', icon: Bird },
      animal_owl: { label: 'Owl', icon: Bird },
      animal_fish: { label: 'Fish', icon: Fish },
      animal_frog: { label: 'Frog', icon: Bug },
      animal_cat: { label: 'Cat', icon: Cat },
      animal_dog: { label: 'Dog', icon: Cat },
    }
  },
  special: {
    label: 'Special',
    icon: Gem,
    color: '#a855f7',
    types: {
      portal: { label: 'Portal', icon: Gem },
      portal_dungeon: { label: 'Dungeon Portal', icon: Skull },
      treasure_chest: { label: 'Treasure Chest', icon: Crown },
      treasure_pile: { label: 'Gold Pile', icon: Crown },
      magic_circle: { label: 'Magic Circle', icon: Gem },
      altar: { label: 'Altar', icon: Church },
      shrine: { label: 'Shrine', icon: Gem },
      obelisk: { label: 'Obelisk', icon: Mountain },
      totem: { label: 'Totem Pole', icon: TreePine },
      crystal_ball: { label: 'Crystal Ball', icon: Gem },
      cauldron: { label: 'Cauldron', icon: Flame },
      bookshelf: { label: 'Bookshelf', icon: Home },
      spawn_point: { label: 'Spawn Point', icon: Plus },
      runestone: { label: 'Runestone', icon: Mountain },
      mystical_tree: { label: 'Mystical Tree', icon: TreePine },
      ley_line_node: { label: 'Ley Line Node', icon: Sparkles },
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
      forge: { label: 'Forge', icon: Flame },
      tanning_rack: { label: 'Tanning Rack', icon: Leaf },
      loom: { label: 'Loom', icon: Home },
      spinning_wheel: { label: 'Spinning Wheel', icon: Home },
      carpenter_bench: { label: 'Carpenter Bench', icon: Axe },
      jeweler_bench: { label: 'Jeweler Bench', icon: Gem },
      inscription_desk: { label: 'Inscription Desk', icon: Home },
      potion_brewing: { label: 'Brewing Stand', icon: Droplets },
      grindstone: { label: 'Grindstone', icon: Mountain },
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
      wardrobe: { label: 'Wardrobe', icon: Home },
      dresser: { label: 'Dresser', icon: Home },
      desk: { label: 'Desk', icon: Home },
      writing_desk: { label: 'Writing Desk', icon: Home },
      throne: { label: 'Throne', icon: Crown },
      armchair: { label: 'Armchair', icon: Home },
      stool: { label: 'Stool', icon: Home },
      dining_table: { label: 'Dining Table', icon: Home },
      round_table: { label: 'Round Table', icon: Home },
      bookcase: { label: 'Bookcase', icon: Home },
      cabinet: { label: 'Cabinet', icon: Home },
      chest_storage: { label: 'Storage Chest', icon: Home },
      rug: { label: 'Rug', icon: Home },
      curtains: { label: 'Curtains', icon: Home },
      chandelier: { label: 'Chandelier', icon: Lamp },
      fireplace: { label: 'Fireplace', icon: Flame },
    }
  },
  market: {
    label: 'Market & Trade',
    icon: Store,
    color: '#eab308',
    types: {
      market_stall_food: { label: 'Food Stall', icon: Utensils },
      market_stall_cloth: { label: 'Cloth Stall', icon: Store },
      market_stall_weapons: { label: 'Weapon Stall', icon: Sword },
      market_stall_general: { label: 'General Stall', icon: Store },
      auction_podium: { label: 'Auction Podium', icon: Crown },
      trading_post: { label: 'Trading Post', icon: Store },
      bank_counter: { label: 'Bank Counter', icon: Crown },
      notice_board: { label: 'Notice Board', icon: Home },
      merchant_tent: { label: 'Merchant Tent', icon: Tent },
      scales: { label: 'Weighing Scales', icon: Crown },
      cash_register: { label: 'Cash Box', icon: Crown },
      display_case: { label: 'Display Case', icon: Gem },
    }
  },
  dungeon: {
    label: 'Dungeon & Prison',
    icon: Lock,
    color: '#64748b',
    types: {
      prison_cell: { label: 'Prison Cell', icon: Lock },
      cage_hanging: { label: 'Hanging Cage', icon: Lock },
      cage_floor: { label: 'Floor Cage', icon: Lock },
      chains_wall: { label: 'Wall Chains', icon: Lock },
      chains_floor: { label: 'Floor Chains', icon: Lock },
      torture_rack: { label: 'Torture Rack', icon: Skull },
      iron_maiden: { label: 'Iron Maiden', icon: Skull },
      stocks: { label: 'Stocks', icon: Lock },
      pillory: { label: 'Pillory', icon: Lock },
      dungeon_door: { label: 'Dungeon Door', icon: Lock },
      spike_trap: { label: 'Spike Trap', icon: Skull },
      pressure_plate: { label: 'Pressure Plate', icon: Mountain },
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
      scarecrow: { label: 'Scarecrow', icon: User },
      plow: { label: 'Plow', icon: Axe },
      water_trough: { label: 'Water Trough', icon: Droplets },
      feed_trough: { label: 'Feed Trough', icon: Home },
      chicken_coop: { label: 'Chicken Coop', icon: Home },
      stable: { label: 'Stable', icon: Home },
      silo: { label: 'Silo', icon: Warehouse },
      beehive: { label: 'Beehive', icon: Bug },
      compost_heap: { label: 'Compost Heap', icon: Leaf },
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
  currentZone
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
