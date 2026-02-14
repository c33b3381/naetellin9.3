import { X, User } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

// Equipment slot definitions (WoW-style)
const EQUIPMENT_SLOTS = {
  // Left column (top to bottom)
  head: { name: 'Head', icon: '⛑️', position: 'left' },
  neck: { name: 'Neck', icon: '📿', position: 'left' },
  shoulders: { name: 'Shoulders', icon: '🎖️', position: 'left' },
  back: { name: 'Back', icon: '🧥', position: 'left' },
  chest: { name: 'Chest', icon: '🎽', position: 'left' },
  shirt: { name: 'Shirt', icon: '👕', position: 'left' },
  tabard: { name: 'Tabard', icon: '🛡️', position: 'left' },
  wrist: { name: 'Wrist', icon: '⌚', position: 'left' },
  
  // Right column (top to bottom)
  hands: { name: 'Hands', icon: '🧤', position: 'right' },
  waist: { name: 'Waist', icon: '🔗', position: 'right' },
  legs: { name: 'Legs', icon: '👖', position: 'right' },
  feet: { name: 'Feet', icon: '👢', position: 'right' },
  finger1: { name: 'Finger', icon: '💍', position: 'right' },
  finger2: { name: 'Finger', icon: '💍', position: 'right' },
  trinket1: { name: 'Trinket', icon: '🔮', position: 'right' },
  trinket2: { name: 'Trinket', icon: '🔮', position: 'right' },
  
  // Bottom (weapons)
  mainHand: { name: 'Main Hand', icon: '⚔️', position: 'bottom' },
  offHand: { name: 'Off Hand', icon: '🛡️', position: 'bottom' },
  ranged: { name: 'Ranged', icon: '🏹', position: 'bottom' }
};

// Rarity colors
const RARITY_COLORS = {
  junk: '#6b7280',
  common: '#f3f4f6',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b'
};

const CharacterPanel = ({ isOpen, onClose }) => {
  const character = useGameStore(state => state.character);
  const equipment = useGameStore(state => state.equipment);
  const equipItem = useGameStore(state => state.equipItem);
  
  if (!isOpen) return null;
  
  // Get equipped item for a slot
  const getEquippedItem = (slot) => {
    return equipment?.[slot] || null;
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop on equipment slot
  const handleDrop = (e, slotKey) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { item, bagIndex, itemIndex } = data;
      
      // Validate item type matches slot
      if (item.type === 'equipment' && item.equipSlot === slotKey) {
        equipItem(item, bagIndex, itemIndex);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };
  
  // Render equipment slot
  const renderSlot = (slotKey, slot) => {
    const item = getEquippedItem(slotKey);
    const isEmpty = !item;
    const isWeaponSlot = slot.position === 'bottom';
    const slotSize = isWeaponSlot ? 'w-16 h-16' : 'w-12 h-12';
    const iconSize = isWeaponSlot ? 'text-3xl' : 'text-2xl';
    const emptyIconSize = isWeaponSlot ? 'text-2xl' : 'text-xl';
    
    return (
      <div
        key={slotKey}
        className="relative group"
        data-testid={`equipment-slot-${slotKey}`}
      >
        {/* Slot container */}
        <div
          className={`${slotSize} rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
            isEmpty
              ? 'bg-[#0c0a09]/50 border-[#292524] hover:border-[#44403c]'
              : 'border-[#44403c] hover:border-[#fbbf24]'
          }`}
          style={{
            backgroundColor: item ? `${RARITY_COLORS[item.rarity] || RARITY_COLORS.common}15` : undefined,
            borderColor: item ? RARITY_COLORS[item.rarity] || RARITY_COLORS.common : undefined
          }}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, slotKey)}
        >
          {/* Item or empty slot icon */}
          {isEmpty ? (
            <span className={`${emptyIconSize} opacity-30 pointer-events-none`}>{slot.icon}</span>
          ) : (
            <span className={`${iconSize} pointer-events-none`}>{item.icon || slot.icon}</span>
          )}
        </div>
        
        {/* Slot label */}
        <p className={`${isWeaponSlot ? 'text-[10px]' : 'text-[9px]'} text-center text-[#78716c] mt-0.5 font-rajdhani`}>
          {slot.name}
        </p>
        
        {/* Tooltip on hover */}
        {item && (
          <div className="absolute z-50 hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
            <div 
              className="bg-[#0c0a09] border-2 rounded px-2 py-1.5 min-w-40"
              style={{ borderColor: RARITY_COLORS[item.rarity] || RARITY_COLORS.common }}
            >
              <p 
                className="font-rajdhani font-semibold text-xs"
                style={{ color: RARITY_COLORS[item.rarity] || RARITY_COLORS.common }}
              >
                {item.name}
              </p>
              {item.description && (
                <p className="text-[10px] text-[#78716c] mt-0.5">{item.description}</p>
              )}
              {item.stats && Object.keys(item.stats).length > 0 && (
                <div className="mt-1 text-[10px] text-[#22c55e]">
                  {Object.entries(item.stats).map(([stat, value]) => (
                    <p key={stat}>+{value} {stat}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Get slots by position
  const leftSlots = Object.entries(EQUIPMENT_SLOTS).filter(([_, slot]) => slot.position === 'left');
  const rightSlots = Object.entries(EQUIPMENT_SLOTS).filter(([_, slot]) => slot.position === 'right');
  const bottomSlots = Object.entries(EQUIPMENT_SLOTS).filter(([_, slot]) => slot.position === 'bottom');
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Character Panel */}
      <div className="relative bg-[#1c1917]/98 border-2 border-[#44403c] rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7c2d12] to-[#9a3412] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-[#fbbf24]" />
            <div>
              <h2 className="font-cinzel text-lg text-[#fbbf24]">{character?.name || 'Character'}</h2>
              <p className="text-xs text-[#d4a574]">Level {character?.level || 1} {character?.class_type || 'Warrior'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#fbbf24] hover:text-white transition-colors"
            data-testid="close-character-panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Character Equipment Display */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Left Equipment Column */}
            <div className="space-y-2">
              {leftSlots.map(([key, slot]) => renderSlot(key, slot))}
            </div>
            
            {/* Center - Character Model Placeholder */}
            <div className="flex flex-col items-center justify-center px-4">
              <div 
                className="w-48 h-64 rounded-lg border-2 border-[#44403c] flex items-center justify-center"
                style={{ backgroundColor: character?.skin_tone || '#D2B48C' }}
              >
                <div className="text-center">
                  <User className="w-24 h-24 mx-auto text-[#44403c] mb-2" />
                  <p className="font-cinzel text-[#1c1917] font-bold text-lg">
                    {character?.name || 'Hero'}
                  </p>
                  <p className="text-sm text-[#44403c]">
                    {character?.class_type || 'Warrior'}
                  </p>
                </div>
              </div>
              
              {/* Character Stats */}
              <div className="mt-4 w-48 bg-[#0c0a09]/50 rounded border border-[#44403c] p-2">
                <div className="grid grid-cols-2 gap-2 text-xs font-rajdhani">
                  <div className="text-center">
                    <p className="text-[#78716c]">Attack</p>
                    <p className="text-[#dc2626] font-bold">{character?.attack || 10}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#78716c]">Defense</p>
                    <p className="text-[#3b82f6] font-bold">{character?.defense || 10}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#78716c]">Strength</p>
                    <p className="text-[#f97316] font-bold">{character?.strength || 10}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#78716c]">Magic</p>
                    <p className="text-[#a855f7] font-bold">{character?.magic || 10}</p>
                  </div>
                </div>
              </div>
              
              {/* Weapon Slots - CENTER POSITION */}
              <div className="mt-4 w-full">
                <h3 className="text-xs font-cinzel text-[#fbbf24] text-center mb-2">Weapons</h3>
                <div className="flex justify-center gap-3">
                  {bottomSlots.map(([key, slot]) => renderSlot(key, slot))}
                </div>
              </div>
            </div>
            
            {/* Right Equipment Column */}
            <div className="space-y-2">
              {rightSlots.map(([key, slot]) => renderSlot(key, slot))}
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="bg-[#0c0a09]/50 px-4 py-2 border-t border-[#44403c]">
          <p className="text-xs text-center text-[#78716c] font-rajdhani">
            Right-click items to equip • Drag items to move • Shift-click to link in chat
          </p>
        </div>
      </div>
    </div>
  );
};

export default CharacterPanel;
