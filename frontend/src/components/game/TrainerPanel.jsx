import { useState } from 'react';
import { 
  Sword, Shield, Axe, Target, Flame,
  X, Coins, BookOpen, GraduationCap, Check
} from 'lucide-react';
import { formatCurrency } from '../../store/gameStore';

// Warrior Spell Definitions - Costs in copper (100 copper = 1 silver, 10000 copper = 1 gold)
export const WARRIOR_SPELLS = {
  // Tier 1 - Basic
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
    tier: 1
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
    cost: 5000, // 50 silver
    tier: 1
  },
  
  // Tier 2 - Intermediate
  'warrior_power_strike': {
    id: 'warrior_power_strike',
    name: 'Power Strike',
    icon: Sword,
    description: 'A devastating blow that deals massive damage',
    damage: { min: 18, max: 28 },
    manaCost: 15,
    cooldown: 8,
    range: 3,
    type: 'physical',
    cost: 5000, // 50 silver
    tier: 2
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
    cost: 5000, // 50 silver
    tier: 2
  },
  
  // Tier 3 - Advanced
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
    cost: 5000, // 50 silver
    tier: 3
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
    cost: 5000, // 50 silver
    tier: 3
  },
  
  // Tier 4 - Master
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
    cost: 5000, // 50 silver
    tier: 4,
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
    cost: 5000, // 50 silver
    tier: 4
  }
};

// Spell type colors
const SPELL_COLORS = {
  physical: '#a8a29e',
  buff: '#22c55e',
  fire: '#ef4444'
};

const TrainerPanel = ({ 
  isOpen, 
  onClose, 
  playerClass = 'warrior',
  playerLevel = 1,
  playerGold = 0,
  learnedSpells = [],
  onTrainSpell,
  trainerName = 'Warrior Trainer'
}) => {
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [trainingResult, setTrainingResult] = useState(null);
  
  // Get available spells for this trainer (warrior spells)
  const availableSpells = Object.values(WARRIOR_SPELLS);
  
  // Group spells by tier
  const spellsByTier = availableSpells.reduce((acc, spell) => {
    if (!acc[spell.tier]) acc[spell.tier] = [];
    acc[spell.tier].push(spell);
    return acc;
  }, {});
  
  const handleTrain = () => {
    if (!selectedSpell) return;
    
    const spell = selectedSpell;
    const isLearned = learnedSpells.includes(spell.id);
    const canAfford = playerGold >= spell.cost;
    
    if (isLearned) {
      setTrainingResult({ success: false, message: 'You already know this spell!' });
      return;
    }
    
    if (!canAfford && spell.cost > 0) {
      setTrainingResult({ success: false, message: 'Not enough gold!' });
      return;
    }
    
    // Train the spell
    onTrainSpell(spell.id, spell.cost);
    setTrainingResult({ success: true, message: `You learned ${spell.name}!` });
    
    // Clear result after 3 seconds
    setTimeout(() => setTrainingResult(null), 3000);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto" data-testid="trainer-panel">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Trainer Panel */}
      <div className="relative bg-[#1a1a1a] border-2 border-[#fbbf24] rounded-lg shadow-2xl w-[700px] max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7c2d12] to-[#9a3412] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-[#fbbf24]" />
            <div>
              <h2 className="font-cinzel text-xl text-[#fbbf24]">{trainerName}</h2>
              <p className="text-xs text-[#d4a574]">Train new combat abilities (50 silver each)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-[#0c0a09]/50 px-3 py-1 rounded">
              <Coins className="w-4 h-4 text-[#fbbf24]" />
              <span className="text-[#fbbf24] font-bold text-sm">{formatCurrency(playerGold)}</span>
            </div>
            <button onClick={onClose} className="text-[#fbbf24] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {/* Spell List by Tier */}
          <div className="space-y-4">
            <h3 className="font-rajdhani text-sm text-[#a8a29e] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Available Training
            </h3>
            
            {Object.entries(spellsByTier).map(([tier, spells]) => (
              <div key={tier} className="space-y-1">
                <p className="text-xs text-[#78716c] font-semibold">Tier {tier}</p>
                {spells.map(spell => {
                  const isLearned = learnedSpells.includes(spell.id);
                  const canAfford = playerGold >= spell.cost;
                  const isSelected = selectedSpell?.id === spell.id;
                  
                  return (
                    <button
                      key={spell.id}
                      onClick={() => setSelectedSpell(spell)}
                      className={`w-full flex items-center gap-3 p-2 rounded border transition-all ${
                        isSelected 
                          ? 'border-[#fbbf24] bg-[#fbbf24]/20' 
                          : isLearned
                            ? 'border-[#22c55e]/50 bg-[#22c55e]/10'
                            : 'border-[#44403c] hover:border-[#57534e] bg-[#0c0a09]'
                      }`}
                      data-testid={`trainer-spell-${spell.id}`}
                    >
                      <div 
                        className="w-10 h-10 rounded border-2 flex items-center justify-center"
                        style={{ 
                          borderColor: isLearned ? '#22c55e' : SPELL_COLORS[spell.type],
                          backgroundColor: `${isLearned ? '#22c55e' : SPELL_COLORS[spell.type]}20`
                        }}
                      >
                        {isLearned ? (
                          <Check className="w-5 h-5 text-[#22c55e]" />
                        ) : (
                          <spell.icon 
                            className="w-5 h-5" 
                            style={{ color: SPELL_COLORS[spell.type] }}
                          />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-rajdhani font-semibold text-[#f5f5f4] text-sm">
                          {spell.name}
                        </p>
                        <p className="text-[10px] text-[#78716c]">
                          {spell.manaCost} MP • {spell.cooldown}s CD
                        </p>
                      </div>
                      <div className="text-right">
                        {isLearned ? (
                          <span className="text-[10px] text-[#22c55e] font-bold">LEARNED</span>
                        ) : spell.cost === 0 ? (
                          <span className="text-[10px] text-[#22c55e]">FREE</span>
                        ) : (
                          <span className={`text-xs flex items-center gap-1 ${canAfford ? 'text-[#fbbf24]' : 'text-[#dc2626]'}`}>
                            <Coins className="w-3 h-3" />
                            {spell.cost}g
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
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
                      borderColor: SPELL_COLORS[selectedSpell.type],
                      backgroundColor: `${SPELL_COLORS[selectedSpell.type]}20`
                    }}
                  >
                    <selectedSpell.icon 
                      className="w-8 h-8" 
                      style={{ color: SPELL_COLORS[selectedSpell.type] }}
                    />
                  </div>
                  <div>
                    <h4 className="font-cinzel text-lg text-[#fbbf24]">{selectedSpell.name}</h4>
                    <p className="text-xs text-[#a8a29e] capitalize">{selectedSpell.type} Ability</p>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm text-[#a8a29e] italic border-l-2 border-[#fbbf24] pl-3">
                  "{selectedSpell.description}"
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedSpell.damage.max > 0 && (
                    <div className="bg-[#1a1a1a] p-2 rounded">
                      <span className="text-[#78716c]">Damage:</span>
                      <span className="text-[#dc2626] ml-2">{selectedSpell.damage.min}-{selectedSpell.damage.max}</span>
                    </div>
                  )}
                  <div className="bg-[#1a1a1a] p-2 rounded">
                    <span className="text-[#78716c]">Mana:</span>
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
                </div>
                
                {/* Training Cost */}
                <div className="border-t border-[#44403c] pt-3 space-y-2">
                  <p className="text-xs text-[#78716c]">Training Cost:</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#a8a29e]">Cost:</span>
                    <span className={`flex items-center gap-1 ${playerGold >= selectedSpell.cost ? 'text-[#fbbf24]' : 'text-[#dc2626]'}`}>
                      <Coins className="w-4 h-4" />
                      {selectedSpell.cost === 0 ? 'Free' : formatCurrency(selectedSpell.cost)}
                    </span>
                  </div>
                </div>
                
                {/* Training Result */}
                {trainingResult && (
                  <div className={`p-2 rounded text-center text-sm ${
                    trainingResult.success ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#dc2626]/20 text-[#dc2626]'
                  }`}>
                    {trainingResult.message}
                  </div>
                )}
                
                {/* Train Button */}
                {!learnedSpells.includes(selectedSpell.id) ? (
                  <button
                    onClick={handleTrain}
                    disabled={playerGold < selectedSpell.cost && selectedSpell.cost > 0}
                    className={`w-full py-3 rounded font-bold flex items-center justify-center gap-2 transition-all ${
                      playerGold >= selectedSpell.cost || selectedSpell.cost === 0
                        ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1a1a1a]'
                        : 'bg-[#44403c] text-[#78716c] cursor-not-allowed'
                    }`}
                    data-testid="train-spell-btn"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Train Spell ({selectedSpell.cost === 0 ? 'Free' : formatCurrency(selectedSpell.cost)})
                  </button>
                ) : (
                  <div className="w-full py-3 rounded bg-[#22c55e]/20 text-[#22c55e] text-center font-bold flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Already Learned - Check Spell Book (P)
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#78716c] text-sm">
                <Sword className="w-12 h-12 mb-3 opacity-30" />
                <p>Select a spell to view details</p>
                <p className="text-xs mt-1">Spells cost 50 silver each</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-[#0c0a09] px-4 py-2 border-t border-[#44403c] text-xs text-[#78716c]">
          <p>Learned spells appear in your Spell Book (P) • Drag them to Action Bar</p>
        </div>
      </div>
    </div>
  );
};

export default TrainerPanel;
