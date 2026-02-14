import { useState, useEffect } from 'react';
import { SPELLS, SPELL_COLORS } from './SpellBook';

const ActionBar = ({ 
  actionBarSpells = ['autoAttack', 'warrior_attack', null, null, null, null],
  cooldowns = {},
  currentMana = 50,
  maxMana = 50,
  onCastSpell,
  selectedTarget,
  onDropSpell,
  isAutoAttacking = false
}) => {
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  
  const handleSlotClick = (index) => {
    const spellId = actionBarSpells[index];
    if (spellId && SPELLS[spellId]) {
      const spell = SPELLS[spellId];
      const isOnCooldown = cooldowns[spellId] > 0;
      const hasMana = currentMana >= spell.manaCost;
      const needsTarget = !spell.selfTarget && spell.range > 0;
      
      if (!isOnCooldown && hasMana) {
        if (needsTarget && !selectedTarget) {
          console.log('No target selected');
          return;
        }
        onCastSpell(spellId);
      }
    }
  };
  
  // Drag and drop handlers
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(index);
  };
  
  const handleDragLeave = () => {
    setDragOverSlot(null);
  };
  
  const handleDrop = (e, index) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    const spellId = e.dataTransfer.getData('spellId');
    if (spellId && onDropSpell) {
      onDropSpell(spellId, index);
    }
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key;
      if (key >= '1' && key <= '6') {
        const index = parseInt(key) - 1;
        handleSlotClick(index);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [actionBarSpells, cooldowns, currentMana, selectedTarget]);
  
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30" data-testid="action-bar">
      <div className="bg-[#0c0a09]/90 border-2 border-[#44403c] rounded-lg p-2 flex gap-1">
        {actionBarSpells.map((spellId, index) => {
          const spell = spellId ? SPELLS[spellId] : null;
          const cooldown = cooldowns[spellId] || 0;
          const isOnCooldown = cooldown > 0;
          const hasMana = spell ? currentMana >= spell.manaCost : true;
          const isHovered = hoveredSlot === index;
          const isDragOver = dragOverSlot === index;
          
          return (
            <div key={index} className="relative">
              <div
                onClick={() => handleSlotClick(index)}
                onMouseEnter={() => setHoveredSlot(index)}
                onMouseLeave={() => setHoveredSlot(null)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`w-12 h-12 rounded border-2 flex items-center justify-center transition-all relative overflow-hidden cursor-pointer ${
                  isDragOver
                    ? 'border-[#fbbf24] bg-[#fbbf24]/30 scale-110'
                    : spell 
                      ? isOnCooldown || !hasMana
                        ? 'border-[#44403c] opacity-50'
                        : 'border-[#57534e] hover:border-[#fbbf24]'
                      : 'border-[#44403c] border-dashed bg-[#1a1a1a] hover:border-[#57534e]'
                }`}
                style={spell && !isDragOver ? { 
                  borderColor: isOnCooldown ? '#44403c' : (SPELL_COLORS[spell.type] || '#a8a29e'),
                  backgroundColor: `${SPELL_COLORS[spell.type] || '#a8a29e'}15`
                } : {}}
                data-testid={`action-slot-${index + 1}`}
              >
                {spell ? (
                  <>
                    <spell.icon 
                      className="w-6 h-6" 
                      style={{ color: SPELL_COLORS[spell.type] || '#a8a29e' }}
                    />
                    
                    {/* Auto-attack active indicator */}
                    {spell.isToggle && isAutoAttacking && spellId === 'autoAttack' && (
                      <div className="absolute inset-0 border-2 border-[#10b981] animate-pulse pointer-events-none rounded">
                        <div className="absolute top-0 right-0 w-2 h-2 bg-[#10b981] rounded-full"></div>
                      </div>
                    )}
                    
                    {/* Cooldown overlay */}
                    {isOnCooldown && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {cooldown.toFixed(1)}
                        </span>
                      </div>
                    )}
                    
                    {/* No mana indicator */}
                    {!hasMana && !isOnCooldown && (
                      <div className="absolute inset-0 bg-blue-900/50 flex items-center justify-center">
                        <span className="text-[#3b82f6] text-[10px] font-bold">OOM</span>
                      </div>
                    )}
                  </>
                ) : (
                  isDragOver ? (
                    <span className="text-[#fbbf24] text-xl">+</span>
                  ) : (
                    <span className="text-[#44403c] text-xl">+</span>
                  )
                )}
                
                {/* Hotkey number */}
                <span className="absolute bottom-0 right-0 text-[10px] text-[#78716c] font-bold px-1">
                  {index + 1}
                </span>
              </div>
              
              {/* Tooltip */}
              {isHovered && spell && !isDragOver && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#1a1a1a] border border-[#44403c] rounded p-2 pointer-events-none z-50">
                  <p className="font-semibold text-sm" style={{ color: SPELL_COLORS[spell.type] || '#a8a29e' }}>
                    {spell.name}
                  </p>
                  <p className="text-[10px] text-[#a8a29e] mb-1">{spell.description}</p>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#dc2626]">
                      {spell.damage.min < 0 
                        ? `Heals ${Math.abs(spell.damage.min)}-${Math.abs(spell.damage.max)}`
                        : `${spell.damage.min}-${spell.damage.max} dmg`
                      }
                    </span>
                    <span className="text-[#3b82f6]">{spell.manaCost} MP</span>
                    <span className="text-[#fbbf24]">{spell.cooldown}s</span>
                  </div>
                  {!hasMana && (
                    <p className="text-[10px] text-[#dc2626] mt-1">Not enough mana!</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-[10px] text-[#78716c] mt-2">Drag spells from Spell Book (P)</p>
    </div>
  );
};

export default ActionBar;
