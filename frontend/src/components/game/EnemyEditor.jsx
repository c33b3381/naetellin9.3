import { useState } from 'react';
import { 
  Skull, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  Sword, Shield, Flame, Snowflake, Wind, Mountain, Bug, Bird,
  Cat, Crown, Bone, Droplets, TreePine, Ghost, Zap
} from 'lucide-react';

// Enemy NPC Database with stats
const ENEMY_DATABASE = {
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
        baseHealth: 250,
        baseDamage: 15,
        xpReward: 100,
        goldDrop: [10, 25],
        description: 'Ancient tree spirit, slow but tough'
      },
      spider_queen: { 
        label: 'Spider Queen', 
        icon: Crown, 
        color: '#1a1a1a',
        baseLevel: 15,
        baseHealth: 180,
        baseDamage: 25,
        xpReward: 120,
        goldDrop: [15, 30],
        description: 'Mother of all spiders, highly venomous'
      },
    }
  },
  // Tier 3 - Undead (Level 10-25)
  tier3: {
    label: 'Undead (Lv 10-25)',
    enemies: {
      skeleton: { 
        label: 'Skeleton', 
        icon: Bone, 
        color: '#d4d4d4',
        baseLevel: 10,
        baseHealth: 80,
        baseDamage: 12,
        xpReward: 45,
        goldDrop: [3, 10],
        description: 'Reanimated bones of the fallen'
      },
      skeleton_warrior: { 
        label: 'Skeleton Warrior', 
        icon: Sword, 
        color: '#c0c0c0',
        baseLevel: 15,
        baseHealth: 120,
        baseDamage: 18,
        xpReward: 70,
        goldDrop: [8, 18],
        description: 'Armed skeleton with combat training'
      },
      skeleton_mage: { 
        label: 'Skeleton Mage', 
        icon: Zap, 
        color: '#a0a0d0',
        baseLevel: 18,
        baseHealth: 90,
        baseDamage: 25,
        xpReward: 90,
        goldDrop: [10, 25],
        description: 'Undead spellcaster, dangerous at range'
      },
      zombie: { 
        label: 'Zombie', 
        icon: Skull, 
        color: '#556b2f',
        baseLevel: 12,
        baseHealth: 150,
        baseDamage: 14,
        xpReward: 55,
        goldDrop: [2, 8],
        description: 'Shambling undead, slow but resilient'
      },
      ghost: { 
        label: 'Ghost', 
        icon: Ghost, 
        color: '#e0e0ff',
        baseLevel: 20,
        baseHealth: 100,
        baseDamage: 20,
        xpReward: 100,
        goldDrop: [0, 5],
        description: 'Ethereal spirit, hard to hit'
      },
    }
  },
  // Tier 4 - Humanoids (Level 15-30)
  tier4: {
    label: 'Humanoids (Lv 15-30)',
    enemies: {
      goblin_chief: { 
        label: 'Goblin Chief', 
        icon: Crown, 
        color: '#2d4a15',
        baseLevel: 15,
        baseHealth: 180,
        baseDamage: 20,
        xpReward: 100,
        goldDrop: [15, 40],
        description: 'Leader of goblin tribes'
      },
      orc: { 
        label: 'Orc', 
        icon: Skull, 
        color: '#556b2f',
        baseLevel: 18,
        baseHealth: 200,
        baseDamage: 25,
        xpReward: 110,
        goldDrop: [12, 30],
        description: 'Brutal green-skinned warrior'
      },
      orc_chief: { 
        label: 'Orc Chieftain', 
        icon: Crown, 
        color: '#3d4a2f',
        baseLevel: 25,
        baseHealth: 350,
        baseDamage: 35,
        xpReward: 200,
        goldDrop: [25, 60],
        description: 'Fearsome leader of orc clans'
      },
      troll: { 
        label: 'Troll', 
        icon: Skull, 
        color: '#556b2f',
        baseLevel: 22,
        baseHealth: 300,
        baseDamage: 28,
        xpReward: 150,
        goldDrop: [15, 40],
        description: 'Regenerating brute, weak to fire'
      },
      ogre: { 
        label: 'Ogre', 
        icon: Skull, 
        color: '#8b7355',
        baseLevel: 20,
        baseHealth: 280,
        baseDamage: 30,
        xpReward: 140,
        goldDrop: [18, 45],
        description: 'Massive, dim-witted giant'
      },
    }
  },
  // Tier 5 - Elementals (Level 20-35)
  tier5: {
    label: 'Elementals (Lv 20-35)',
    enemies: {
      elemental_fire: { 
        label: 'Fire Elemental', 
        icon: Flame, 
        color: '#ff6600',
        baseLevel: 25,
        baseHealth: 200,
        baseDamage: 35,
        xpReward: 180,
        goldDrop: [0, 10],
        description: 'Living flame, immune to fire'
      },
      elemental_ice: { 
        label: 'Ice Elemental', 
        icon: Snowflake, 
        color: '#87ceeb',
        baseLevel: 25,
        baseHealth: 220,
        baseDamage: 30,
        xpReward: 180,
        goldDrop: [0, 10],
        description: 'Frozen entity, immune to frost'
      },
      elemental_earth: { 
        label: 'Earth Elemental', 
        icon: Mountain, 
        color: '#8b4513',
        baseLevel: 28,
        baseHealth: 350,
        baseDamage: 25,
        xpReward: 200,
        goldDrop: [5, 20],
        description: 'Living rock, extremely tough'
      },
      elemental_wind: { 
        label: 'Wind Elemental', 
        icon: Wind, 
        color: '#c0c0c0',
        baseLevel: 23,
        baseHealth: 150,
        baseDamage: 28,
        xpReward: 160,
        goldDrop: [0, 8],
        description: 'Swift air spirit, hard to catch'
      },
      golem: { 
        label: 'Stone Golem', 
        icon: Shield, 
        color: '#696969',
        baseLevel: 30,
        baseHealth: 400,
        baseDamage: 30,
        xpReward: 250,
        goldDrop: [10, 30],
        description: 'Animated stone guardian'
      },
    }
  },
  // Tier 6 - Demons & Dragons (Level 30+)
  tier6: {
    label: 'Bosses (Lv 30+)',
    enemies: {
      imp: { 
        label: 'Imp', 
        icon: Flame, 
        color: '#dc2626',
        baseLevel: 30,
        baseHealth: 150,
        baseDamage: 35,
        xpReward: 200,
        goldDrop: [20, 50],
        description: 'Small demon, mischievous and fiery'
      },
      demon: { 
        label: 'Demon', 
        icon: Skull, 
        color: '#8b0000',
        baseLevel: 40,
        baseHealth: 500,
        baseDamage: 50,
        xpReward: 500,
        goldDrop: [50, 150],
        description: 'Powerful creature from the abyss'
      },
      wyvern: { 
        label: 'Wyvern', 
        icon: Bird, 
        color: '#6b5b4f',
        baseLevel: 35,
        baseHealth: 400,
        baseDamage: 40,
        xpReward: 350,
        goldDrop: [30, 80],
        description: 'Flying reptile with venomous tail'
      },
      dragon: { 
        label: 'Dragon', 
        icon: Flame, 
        color: '#dc2626',
        baseLevel: 50,
        baseHealth: 1000,
        baseDamage: 75,
        xpReward: 1000,
        goldDrop: [100, 500],
        description: 'Ancient wyrm, master of fire'
      },
    }
  },
};

const EnemyEditor = ({ 
  isOpen, 
  onClose, 
  onPlaceEnemy,
  onDeleteEnemy,
  placedEnemies = [],
  selectedEnemy,
  onSelectEnemy,
  currentZone
}) => {
  const [selectedTier, setSelectedTier] = useState('tier1');
  const [selectedEnemyType, setSelectedEnemyType] = useState('goblin');
  const [enemyLevel, setEnemyLevel] = useState(1);
  const [patrolRadius, setPatrolRadius] = useState(5);
  const [showEnemyList, setShowEnemyList] = useState(false);
  const [respawnTime, setRespawnTime] = useState(60);
  const [customName, setCustomName] = useState(''); // NEW: Custom name field

  const currentTier = ENEMY_DATABASE[selectedTier];
  const currentEnemy = currentTier?.enemies[selectedEnemyType];

  const handlePlace = () => {
    if (!currentEnemy) return;
    
    // Calculate scaled stats based on level
    const levelMultiplier = 1 + (enemyLevel - currentEnemy.baseLevel) * 0.1;
    
    // BALANCED STATS: Reduced by 65% to make enemies killable
    const balanceMultiplier = 0.35; // Only 35% of original stats
    
    onPlaceEnemy({
      enemyType: selectedEnemyType,
      name: customName || currentEnemy.label, // Use custom name if provided
      level: enemyLevel,
      maxHealth: Math.round(currentEnemy.baseHealth * levelMultiplier * balanceMultiplier),
      currentHealth: Math.round(currentEnemy.baseHealth * levelMultiplier * balanceMultiplier),
      damage: Math.round(currentEnemy.baseDamage * levelMultiplier * balanceMultiplier),
      xpReward: Math.round(currentEnemy.xpReward * levelMultiplier),
      goldDrop: currentEnemy.goldDrop,
      color: currentEnemy.color,
      patrolRadius: patrolRadius,
      respawnTime: respawnTime,
      tier: selectedTier
    });
    
    // Clear custom name after placing
    setCustomName('');
  };
  
  // NEW: Duplicate selected enemy
  const handleDuplicate = () => {
    if (!selectedEnemy) return;
    
    // Create a copy with slightly offset position
    const offsetX = (Math.random() - 0.5) * 10; // Random offset ±5 units
    const offsetZ = (Math.random() - 0.5) * 10;
    
    onPlaceEnemy({
      ...selectedEnemy,
      name: selectedEnemy.name + ' (Copy)',
      position: {
        x: (selectedEnemy.position?.x || 0) + offsetX,
        y: 0,
        z: (selectedEnemy.position?.z || 0) + offsetZ
      },
      // Reset health to full
      currentHealth: selectedEnemy.maxHealth
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 left-4 z-50 pointer-events-auto" data-testid="enemy-editor">
      <div className="bg-[#1a0a0a]/95 border-2 border-[#dc2626] rounded-lg shadow-2xl w-96 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#dc2626] px-4 py-2 rounded-t-lg flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-white" />
            <h2 className="font-cinzel font-bold text-white">Enemy Database</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-[#fca5a5] font-bold"
          >
            ✕
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="bg-[#2a1a1a] px-4 py-2 border-b border-[#dc2626]/50 flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handlePlace}
              className="flex-1 py-2 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white font-bold rounded flex items-center justify-center gap-1 text-sm hover:shadow-lg transition-all"
              data-testid="place-enemy-btn"
            >
              <Plus className="w-4 h-4" />
              Spawn Enemy
            </button>
            <button
              onClick={() => setShowEnemyList(true)}
              className={`flex-1 py-2 font-bold rounded flex items-center justify-center gap-1 text-sm transition-all ${
                placedEnemies.length > 0 
                  ? 'bg-[#7f1d1d] text-white hover:bg-[#991b1b]'
                  : 'bg-[#44403c] text-[#6b6b6b] cursor-not-allowed'
              }`}
              disabled={placedEnemies.length === 0}
              data-testid="show-enemies-btn"
            >
              <Eye className="w-4 h-4" />
              Active ({placedEnemies.length})
            </button>
          </div>
          
          {/* Selected Enemy Quick Actions */}
          {selectedEnemy && (
            <div className="mt-2 p-2 bg-[#7f1d1d]/50 border border-[#dc2626] rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#fca5a5]">Selected: <span className="text-white font-semibold">{selectedEnemy.name} Lv.{selectedEnemy.level}</span></span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDuplicate}
                  className="flex-1 px-3 py-1 bg-[#059669] text-white text-xs font-bold rounded hover:bg-[#10b981] transition-all flex items-center justify-center gap-1"
                  data-testid="duplicate-enemy-btn"
                  title="Duplicate this enemy nearby"
                >
                  <Plus className="w-3 h-3" />
                  COPY
                </button>
                <button
                  onClick={() => onDeleteEnemy(selectedEnemy.id)}
                  className="flex-1 px-3 py-1 bg-[#dc2626] text-white text-xs font-bold rounded hover:bg-[#ef4444] transition-all flex items-center justify-center gap-1"
                  data-testid="delete-enemy-btn"
                >
                  <Trash2 className="w-3 h-3" />
                  REMOVE
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Current Zone */}
          <div className="text-xs text-[#fca5a5] font-rajdhani">
            Zone: <span className="text-[#dc2626]">{currentZone}</span>
          </div>

          {/* Tier Selection */}
          <div>
            <label className="text-xs text-[#fca5a5] font-rajdhani block mb-2">Enemy Tier</label>
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(ENEMY_DATABASE).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTier(key);
                    setSelectedEnemyType(Object.keys(ENEMY_DATABASE[key].enemies)[0]);
                  }}
                  className={`p-2 rounded border transition-all text-xs ${
                    selectedTier === key 
                      ? 'border-[#dc2626] bg-[#dc2626]/20 text-white' 
                      : 'border-[#7f1d1d] hover:border-[#dc2626] text-[#fca5a5]'
                  }`}
                  data-testid={`tier-${key}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Enemy Type Selection */}
          <div>
            <label className="text-xs text-[#fca5a5] font-rajdhani block mb-2">
              Select Enemy ({Object.keys(currentTier?.enemies || {}).length})
            </label>
            <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto bg-[#0c0606] p-2 rounded border border-[#7f1d1d]">
              {Object.entries(currentTier?.enemies || {}).map(([key, enemy]) => {
                const Icon = enemy.icon;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedEnemyType(key);
                      setEnemyLevel(enemy.baseLevel);
                      setCustomName(''); // Clear custom name when switching enemy types
                    }}
                    className={`p-2 rounded border text-left transition-all flex items-center gap-2 ${
                      selectedEnemyType === key 
                        ? 'border-[#dc2626] bg-[#dc2626]/20' 
                        : 'border-[#7f1d1d] hover:border-[#dc2626] hover:bg-[#1a0a0a]'
                    }`}
                    data-testid={`enemy-${key}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: enemy.color }} />
                    <span className="text-xs text-[#fca5a5] truncate">{enemy.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enemy Preview */}
          {currentEnemy && (
            <div className="bg-[#0c0606] border border-[#7f1d1d] rounded-lg p-3">
              <div className="flex items-center gap-3 mb-2">
                {(() => { const Icon = currentEnemy.icon; return <Icon className="w-8 h-8" style={{ color: currentEnemy.color }} />; })()}
                <div>
                  <h3 className="text-white font-bold">{currentEnemy.label}</h3>
                  <p className="text-xs text-[#fca5a5]">Base Level: {currentEnemy.baseLevel}</p>
                </div>
              </div>
              <p className="text-xs text-[#a8a29e] mb-2">{currentEnemy.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-[#fca5a5]">❤️ HP: <span className="text-white">{currentEnemy.baseHealth}</span></div>
                <div className="text-[#fca5a5]">⚔️ DMG: <span className="text-white">{currentEnemy.baseDamage}</span></div>
                <div className="text-[#fca5a5]">✨ XP: <span className="text-white">{currentEnemy.xpReward}</span></div>
                <div className="text-[#fca5a5]">💰 Gold: <span className="text-white">{currentEnemy.goldDrop[0]}-{currentEnemy.goldDrop[1]}</span></div>
              </div>
            </div>
          )}

          {/* Enemy Settings */}
          <div className="space-y-3">
            {/* Custom Name Input */}
            <div>
              <label className="text-xs text-[#fca5a5] block mb-1">Custom Name (Optional)</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={currentEnemy?.label || 'Enemy Name'}
                className="w-full px-3 py-2 bg-[#0c0606] border border-[#7f1d1d] rounded text-white text-sm focus:border-[#dc2626] focus:outline-none"
                data-testid="custom-name-input"
                maxLength={30}
              />
              <p className="text-[9px] text-[#6b6b6b] mt-1">Leave empty to use default name</p>
            </div>
            
            {/* Level */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-[#fca5a5]">Enemy Level</label>
                <span className="text-sm text-[#dc2626] font-bold">{enemyLevel}</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={enemyLevel}
                onChange={(e) => setEnemyLevel(Number(e.target.value))}
                className="w-full accent-[#dc2626]"
                data-testid="enemy-level-slider"
              />
            </div>

            {/* Patrol Radius */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-[#fca5a5]">Patrol Radius</label>
                <span className="text-sm text-[#dc2626] font-bold">{patrolRadius}m</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={patrolRadius}
                onChange={(e) => setPatrolRadius(Number(e.target.value))}
                className="w-full accent-[#dc2626]"
                data-testid="patrol-radius-slider"
              />
              <p className="text-[9px] text-[#6b6b6b]">0 = stationary, higher = larger patrol area</p>
            </div>

            {/* Respawn Time */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-[#fca5a5]">Respawn Time</label>
                <span className="text-sm text-[#dc2626] font-bold">{respawnTime}s</span>
              </div>
              <input
                type="range"
                min="30"
                max="300"
                step="30"
                value={respawnTime}
                onChange={(e) => setRespawnTime(Number(e.target.value))}
                className="w-full accent-[#dc2626]"
                data-testid="respawn-time-slider"
              />
            </div>
          </div>

          {/* Placed Enemies List */}
          <button
            onClick={() => setShowEnemyList(!showEnemyList)}
            className="w-full py-2 bg-[#7f1d1d] text-[#fca5a5] rounded flex items-center justify-center gap-2 hover:bg-[#991b1b] transition-all"
            data-testid="toggle-enemy-list"
          >
            {showEnemyList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Spawned Enemies ({placedEnemies.length})
          </button>

          {showEnemyList && (
            <div className="bg-[#0c0606] border border-[#7f1d1d] rounded p-2 max-h-40 overflow-y-auto space-y-1">
              {placedEnemies.length === 0 ? (
                <p className="text-xs text-[#6b6b6b] text-center py-2">No enemies spawned</p>
              ) : (
                placedEnemies.map((enemy, index) => (
                  <div 
                    key={enemy.id || index}
                    className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all ${
                      selectedEnemy?.id === enemy.id 
                        ? 'bg-[#dc2626]/20 border border-[#dc2626]' 
                        : 'bg-[#1a0a0a] hover:bg-[#2a1a1a]'
                    }`}
                    onClick={() => onSelectEnemy(enemy)}
                    data-testid={`spawned-enemy-${enemy.id || index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-white truncate block">{enemy.name} <span className="text-[#dc2626]">Lv.{enemy.level}</span></span>
                      <span className="text-[#6b6b6b]">({Math.round(enemy.position?.x || 0)}, {Math.round(enemy.position?.z || 0)})</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteEnemy(enemy.id); }}
                      className="text-[#dc2626] hover:text-[#ef4444] p-1 ml-2 flex-shrink-0"
                      title="Remove enemy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-[9px] text-[#6b6b6b] space-y-0.5 border-t border-[#7f1d1d] pt-2">
            <p>• Click <span className="text-[#dc2626]">Spawn Enemy</span> then click terrain to place</p>
            <p>• Select enemy → Click <span className="text-[#059669]">COPY</span> or press <span className="text-[#059669]">Ctrl+C</span> to duplicate</p>
            <p>• Enemies patrol in a square pattern from spawn</p>
            <p>• Combat stops patrol, enemy faces player</p>
            <p>• Press <span className="text-[#dc2626]">F3</span> to toggle this menu</p>
            <p>• Press <span className="text-[#dc2626]">Delete</span> to remove selected enemy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { EnemyEditor, ENEMY_DATABASE };
export default EnemyEditor;
