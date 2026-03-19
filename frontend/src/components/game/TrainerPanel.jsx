import { useState } from 'react';
import { GraduationCap, Coins, X, Lock, Check, Sparkles, BookOpen } from 'lucide-react';
import { formatCurrency } from '../../store/gameStore';
// Import spell data from centralized data file
import { WARRIOR_SPELLS, SPELL_COLORS } from '../../data/spells';

// Re-export for backwards compatibility
export { WARRIOR_SPELLS };

// Tier display names
const TIER_NAMES = {
  1: 'Apprentice',
  2: 'Journeyman',
  3: 'Expert',
  4: 'Master'
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
    const meetsLevelReq = playerLevel >= (spell.requiredLevel || 1);
    
    if (isLearned) {
      setTrainingResult({ success: false, message: 'You already know this ability!' });
      return;
    }
    
    if (!meetsLevelReq) {
      setTrainingResult({ success: false, message: `Requires level ${spell.requiredLevel}!` });
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
                <p className="text-xs text-[#78716c] font-semibold">
                  {TIER_NAMES[tier] || `Tier ${tier}`}
                </p>
                {spells.map(spell => {
                  const isLearned = learnedSpells.includes(spell.id);
                  const canAfford = playerGold >= spell.cost;
                  const meetsLevelReq = playerLevel >= (spell.requiredLevel || 1);
                  const isSelected = selectedSpell?.id === spell.id;
                  const isLocked = !meetsLevelReq && !isLearned;
                  
                  return (
                    <button
                      key={spell.id}
                      onClick={() => setSelectedSpell(spell)}
                      className={`w-full flex items-center gap-3 p-2 rounded border transition-all ${
                        isSelected 
                          ? 'border-[#fbbf24] bg-[#fbbf24]/20' 
                          : isLearned
                            ? 'border-[#22c55e]/50 bg-[#22c55e]/10'
                            : isLocked
                              ? 'border-[#44403c] bg-[#0c0a09] opacity-60'
                              : 'border-[#44403c] hover:border-[#57534e] bg-[#0c0a09]'
                      }`}
                      data-testid={`trainer-spell-${spell.id}`}
                    >
                      <div 
                        className="w-10 h-10 rounded border-2 flex items-center justify-center relative"
                        style={{ 
                          borderColor: isLearned ? '#22c55e' : isLocked ? '#44403c' : SPELL_COLORS[spell.type],
                          backgroundColor: `${isLearned ? '#22c55e' : isLocked ? '#44403c' : SPELL_COLORS[spell.type]}20`
                        }}
                      >
                        {isLearned ? (
                          <Check className="w-5 h-5 text-[#22c55e]" />
                        ) : isLocked ? (
                          <Lock className="w-5 h-5 text-[#78716c]" />
                        ) : (
                          <spell.icon 
                            className="w-5 h-5" 
                            style={{ color: SPELL_COLORS[spell.type] }}
                          />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-rajdhani font-semibold text-sm ${isLocked ? 'text-[#78716c]' : 'text-[#f5f5f4]'}`}>
                          {spell.name}
                        </p>
                        <p className="text-[10px] text-[#78716c]">
                          {isLocked ? (
                            <span className="text-[#dc2626]">Requires Level {spell.requiredLevel}</span>
                          ) : (
                            <>{spell.manaCost} MP • {spell.cooldown}s CD</>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        {isLearned ? (
                          <span className="text-[10px] text-[#22c55e] font-bold">LEARNED</span>
                        ) : isLocked ? (
                          <span className="text-[10px] text-[#dc2626]">Lv.{spell.requiredLevel}</span>
                        ) : spell.cost === 0 ? (
                          <span className="text-[10px] text-[#22c55e]">FREE</span>
                        ) : (
                          <span className={`text-xs flex items-center gap-1 ${canAfford ? 'text-[#fbbf24]' : 'text-[#dc2626]'}`}>
                            <Coins className="w-3 h-3" />
                            {formatCurrency(spell.cost)}
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
                
                {/* Level Requirement */}
                <div className="border-t border-[#44403c] pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#78716c]">Required Level:</span>
                    <span className={`font-bold ${playerLevel >= (selectedSpell.requiredLevel || 1) ? 'text-[#22c55e]' : 'text-[#dc2626]'}`}>
                      {selectedSpell.requiredLevel || 1}
                      {playerLevel >= (selectedSpell.requiredLevel || 1) ? (
                        <Check className="w-4 h-4 inline ml-1" />
                      ) : (
                        <Lock className="w-4 h-4 inline ml-1" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#78716c]">Training Cost:</span>
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
                  (() => {
                    const meetsLevelReq = playerLevel >= (selectedSpell.requiredLevel || 1);
                    const canAfford = playerGold >= selectedSpell.cost || selectedSpell.cost === 0;
                    const canTrain = meetsLevelReq && canAfford;
                    
                    return (
                      <button
                        onClick={handleTrain}
                        disabled={!canTrain}
                        className={`w-full py-3 rounded font-bold flex items-center justify-center gap-2 transition-all ${
                          canTrain
                            ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1a1a1a]'
                            : 'bg-[#44403c] text-[#78716c] cursor-not-allowed'
                        }`}
                        data-testid="train-spell-btn"
                      >
                        {!meetsLevelReq ? (
                          <>
                            <Lock className="w-5 h-5" />
                            Requires Level {selectedSpell.requiredLevel}
                          </>
                        ) : !canAfford ? (
                          <>
                            <Coins className="w-5 h-5" />
                            Not Enough Gold
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-5 h-5" />
                            Train Ability ({selectedSpell.cost === 0 ? 'Free' : formatCurrency(selectedSpell.cost)})
                          </>
                        )}
                      </button>
                    );
                  })()
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
