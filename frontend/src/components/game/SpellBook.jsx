import { useState } from 'react';
import { 
  Sword, Zap, Shield, Heart, Flame, Snowflake, 
  Wind, Skull, Star, BookOpen, X, Lock, Axe, Target
} from 'lucide-react';
import { WARRIOR_SPELLS } from './TrainerPanel';

// Convert warrior spells to spell book format
const convertWarriorSpells = () => {
  const converted = {};
  Object.values(WARRIOR_SPELLS).forEach(spell => {
    converted[spell.id] = {
      ...spell,
      class: 'warrior',
      level: 1 // All spells available at level 1
    };
  });
  return converted;
};

// Spell definitions - now includes warrior spells from trainer
const SPELLS = {
  // Basic abilities (available to all classes)
  autoAttack: {
    id: 'autoAttack',
    name: 'Auto Attack',
    icon: Sword,
    description: 'Toggle automatic melee attacks on your target. Attacks every 3 seconds when in range.',
    damage: { min: 10, max: 15 },
    manaCost: 0,
    cooldown: 0,
    range: 5,
    type: 'physical',
    class: 'all',
    level: 1,
    isToggle: true // Special flag for toggle abilities
  },
  
  // Import all warrior spells from trainer
  ...convertWarriorSpells(),
  
  // Mage spells
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    icon: Flame,
    description: 'Hurl a ball of fire at your enemy',
    damage: { min: 20, max: 35 },
    manaCost: 20,
    cooldown: 4,
    range: 15,
    type: 'fire',
    class: 'mage',
    level: 1
  },
  frostbolt: {
    id: 'frostbolt',
    name: 'Frostbolt',
    icon: Snowflake,
    description: 'Launch an icy bolt that slows the enemy',
    damage: { min: 15, max: 25 },
    manaCost: 15,
    cooldown: 3,
    range: 15,
    type: 'frost',
    class: 'mage',
    level: 5
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning Bolt',
    icon: Zap,
    description: 'Strike enemy with lightning',
    damage: { min: 25, max: 45 },
    manaCost: 30,
    cooldown: 6,
    range: 20,
    type: 'lightning',
    class: 'mage',
    level: 15
  },
  
  // Ranger spells
  quickShot: {
    id: 'quickShot',
    name: 'Quick Shot',
    icon: Wind,
    description: 'Rapid arrow shot',
    damage: { min: 8, max: 15 },
    manaCost: 5,
    cooldown: 2,
    range: 20,
    type: 'physical',
    class: 'ranger',
    level: 1
  },
  poisonArrow: {
    id: 'poisonArrow',
    name: 'Poison Arrow',
    icon: Skull,
    description: 'Arrow coated in deadly poison',
    damage: { min: 12, max: 20 },
    manaCost: 15,
    cooldown: 8,
    range: 20,
    type: 'poison',
    class: 'ranger',
    level: 10
  },
  
  // Paladin spells
  holyStrike: {
    id: 'holyStrike',
    name: 'Holy Strike',
    icon: Star,
    description: 'Strike with holy power',
    damage: { min: 12, max: 22 },
    manaCost: 12,
    cooldown: 4,
    range: 3,
    type: 'holy',
    class: 'paladin',
    level: 1
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    icon: Heart,
    description: 'Restore health to yourself',
    damage: { min: -20, max: -35 }, // Negative = healing
    manaCost: 25,
    cooldown: 10,
    range: 0,
    type: 'holy',
    class: 'paladin',
    level: 5,
    selfTarget: true
  }
};

// Get spells available for a class
export const getClassSpells = (classType, playerLevel = 1) => {
  return Object.values(SPELLS).filter(spell => {
    const classMatch = spell.class === 'all' || spell.class === classType;
    const levelMatch = spell.level <= playerLevel;
    return classMatch && levelMatch;
  });
};

// Get all spells for display
export const getAllSpells = () => SPELLS;

// Spell type colors
const SPELL_COLORS = {
  physical: '#a8a29e',
  fire: '#ef4444',
  frost: '#3b82f6',
  lightning: '#fbbf24',
  poison: '#22c55e',
  holy: '#f5f5f4',
  buff: '#22c55e'
};

const SpellBook = ({ 
  isOpen, 
  onClose, 
  playerClass = 'warrior',
  playerLevel = 1,
  onLearnSpell,
  learnedSpells = ['warrior_attack'],
  actionBarSpells = [],
  onAssignToActionBar,
  onStartDrag,
  onEndDrag
}) => {
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [draggingSpell, setDraggingSpell] = useState(null);
  
  // Only show learned spells for this class
  const learnedClassSpells = Object.values(SPELLS).filter(
    s => (s.class === 'all' || s.class === playerClass) && learnedSpells.includes(s.id)
  );
  
  // Handle drag start
  const handleDragStart = (e, spell) => {
    if (!learnedSpells.includes(spell.id)) return;
    
    setDraggingSpell(spell.id);
    e.dataTransfer.setData('spellId', spell.id);
    e.dataTransfer.setData('source', 'spellbook');
    e.dataTransfer.effectAllowed = 'move';
    
    // Create drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'w-10 h-10 rounded-full bg-[#1a1a1a] border-2 border-[#fbbf24] flex items-center justify-center';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    if (onStartDrag) onStartDrag(spell.id);
  };
  
  const handleDragEnd = () => {
    setDraggingSpell(null);
    if (onEndDrag) onEndDrag();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto" data-testid="spellbook">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Spell Book Panel */}
      <div className="relative bg-[#1a1a1a] border-2 border-[#fbbf24] rounded-lg shadow-2xl w-[600px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7c2d12] to-[#9a3412] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#fbbf24]" />
            <h2 className="font-cinzel text-xl text-[#fbbf24]">Spell Book</h2>
            <span className="text-xs text-[#d4a574]">({learnedClassSpells.length} spells)</span>
          </div>
          <button onClick={onClose} className="text-[#fbbf24] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {/* Spell List - Only Learned Spells */}
          <div className="space-y-2">
            <h3 className="font-rajdhani text-sm text-[#a8a29e] uppercase tracking-wider">
              Your Spells
            </h3>
            <p className="text-[10px] text-[#78716c] mb-2">Drag spells to the Action Bar below</p>
            
            {learnedClassSpells.length === 0 ? (
              <div className="bg-[#0c0a09] rounded-lg p-6 border border-[#44403c] text-center">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-[#44403c]" />
                <p className="text-[#78716c] text-sm">No spells learned yet</p>
                <p className="text-xs text-[#57534e] mt-1">Visit a trainer to learn spells</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
                {learnedClassSpells.map(spell => {
                  const isSelected = selectedSpell?.id === spell.id;
                  const isDragging = draggingSpell === spell.id;
                  const isOnActionBar = actionBarSpells.includes(spell.id);
                  
                  return (
                    <div
                      key={spell.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, spell)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedSpell(spell)}
                      className={`w-full flex items-center gap-3 p-2 rounded border transition-all cursor-grab active:cursor-grabbing ${
                        isSelected 
                          ? 'border-[#fbbf24] bg-[#fbbf24]/20' 
                          : isDragging
                            ? 'border-[#fbbf24] bg-[#fbbf24]/30 opacity-50'
                            : 'border-[#44403c] hover:border-[#57534e] bg-[#0c0a09]'
                      }`}
                      data-testid={`spell-${spell.id}`}
                    >
                      <div 
                        className="w-10 h-10 rounded border-2 flex items-center justify-center"
                        style={{ 
                          borderColor: SPELL_COLORS[spell.type] || '#a8a29e',
                          backgroundColor: `${SPELL_COLORS[spell.type] || '#a8a29e'}20`
                        }}
                      >
                        <spell.icon 
                          className="w-5 h-5" 
                          style={{ color: SPELL_COLORS[spell.type] || '#a8a29e' }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-rajdhani font-semibold text-[#f5f5f4] text-sm">
                          {spell.name}
                          {spell.isToggle && <span className="ml-2 text-[10px] text-[#10b981] font-bold">TOGGLE</span>}
                        </p>
                        <p className="text-[10px] text-[#78716c]">
                          {spell.isToggle 
                            ? `${spell.damage.min}-${spell.damage.max} DMG • No Cost` 
                            : `${spell.manaCost} MP • ${spell.cooldown}s CD`
                          }
                        </p>
                      </div>
                      {isOnActionBar && (
                        <span className="text-[10px] text-[#fbbf24] font-bold">ON BAR</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Spell Details */}
          <div className="bg-[#0c0a09] rounded border border-[#44403c] p-4">
            {selectedSpell ? (
              <div className="space-y-4">
                {/* Spell Header */}
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-lg border-2 flex items-center justify-center"
                    style={{ 
                      borderColor: SPELL_COLORS[selectedSpell.type] || '#a8a29e',
                      backgroundColor: `${SPELL_COLORS[selectedSpell.type] || '#a8a29e'}20`
                    }}
                  >
                    <selectedSpell.icon 
                      className="w-8 h-8" 
                      style={{ color: SPELL_COLORS[selectedSpell.type] || '#a8a29e' }}
                    />
                  </div>
                  <div>
                    <h4 className="font-cinzel text-lg text-[#fbbf24]">{selectedSpell.name}</h4>
                    <p className="text-xs text-[#a8a29e] capitalize">{selectedSpell.type} Spell</p>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm text-[#a8a29e] italic">"{selectedSpell.description}"</p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedSpell.isToggle ? (
                    <>
                      <div className="bg-[#1a1a1a] p-2 rounded col-span-2">
                        <span className="text-[#78716c]">Type:</span>
                        <span className="text-[#10b981] ml-2 font-bold">TOGGLE ABILITY</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-2 rounded">
                        <span className="text-[#78716c]">Damage:</span>
                        <span className="text-[#dc2626] ml-2">{selectedSpell.damage.min}-{selectedSpell.damage.max}</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-2 rounded">
                        <span className="text-[#78716c]">Attack Speed:</span>
                        <span className="text-[#fbbf24] ml-2">3.0s</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-2 rounded">
                        <span className="text-[#78716c]">Mana Cost:</span>
                        <span className="text-[#10b981] ml-2">FREE</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-2 rounded">
                        <span className="text-[#78716c]">Range:</span>
                        <span className="text-[#22c55e] ml-2">{selectedSpell.range}m (Melee)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-[#1a1a1a] p-2 rounded">
                        <span className="text-[#78716c]">Damage:</span>
                        <span className="text-[#dc2626] ml-2">
                          {selectedSpell.damage.min < 0 
                            ? `Heals ${Math.abs(selectedSpell.damage.min)}-${Math.abs(selectedSpell.damage.max)}`
                            : `${selectedSpell.damage.min}-${selectedSpell.damage.max}`
                          }
                        </span>
                      </div>
                      <div className="bg-[#1a1a1a] p-2 rounded">
                        <span className="text-[#78716c]">Mana Cost:</span>
                        <span className="text-[#3b82f6] ml-2">{selectedSpell.manaCost}</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-2 rounded">
                        <span className="text-[#78716c]">Cooldown:</span>
                        <span className="text-[#fbbf24] ml-2">{selectedSpell.cooldown}s</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-2 rounded">
                        <span className="text-[#78716c]">Range:</span>
                        <span className="text-[#22c55e] ml-2">{selectedSpell.range}m</span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Action Bar Assignment */}
                <div className="border-t border-[#44403c] pt-3">
                  <p className="text-xs text-[#a8a29e] mb-2">Quick assign to slot (or drag to action bar):</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6].map(slot => {
                      const isAssigned = actionBarSpells[slot - 1] === selectedSpell.id;
                      return (
                        <button
                          key={slot}
                          onClick={() => onAssignToActionBar(selectedSpell.id, slot - 1)}
                          className={`w-8 h-8 rounded border-2 text-sm font-bold transition-all ${
                            isAssigned 
                              ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-[#fbbf24]' 
                              : 'border-[#44403c] hover:border-[#57534e] text-[#78716c]'
                          }`}
                          data-testid={`assign-slot-${slot}`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#78716c] text-sm">
                <BookOpen className="w-12 h-12 mb-3 opacity-30" />
                <p>Select a spell to view details</p>
                <p className="text-xs mt-1">or drag it to the Action Bar</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-[#0c0a09] px-4 py-2 border-t border-[#44403c] text-xs text-[#78716c]">
          Press <span className="text-[#fbbf24]">P</span> to open/close Spell Book • 
          Drag spells to Action Bar or click slot numbers
        </div>
      </div>
    </div>
  );
};

export default SpellBook;
export { SPELLS, SPELL_COLORS };
