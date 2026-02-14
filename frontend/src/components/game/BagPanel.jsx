import { X } from 'lucide-react';
import { useGameStore, copperToGold, formatCurrency } from '../../store/gameStore';
import { useState } from 'react';

// Item icons mapping
const ITEM_ICONS = {
  weapon: '⚔️',
  shield: '🛡️',
  armor: '🎽',
  food: '🍖',
  potion: '🧪',
  junk: '📦',
  bag: '🎒',
  quest: '📜',
  material: '⚙️',
  tool: '⛏️'
};

// Rarity colors - 5 Tier System
const RARITY_COLORS = {
  junk: '#6b7280',       // Gray
  common: '#f3f4f6',     // White
  uncommon: '#22c55e',   // Green
  rare: '#3b82f6',       // Blue
  epic: '#a855f7',       // Purple
  legendary: '#f59e0b'   // Orange (future use)
};

const BagPanel = ({ bagIndex, items, bagName, maxSlots, onClose }) => {
  const copper = useGameStore(state => state.copper);
  const equipItem = useGameStore(state => state.equipItem);
  const equipBag = useGameStore(state => state.equipBag);
  const removeItemFromBag = useGameStore(state => state.removeItemFromBag);
  const [draggedItem, setDraggedItem] = useState(null);
  const currency = copperToGold(copper || 0);
  
  // Handle drag start
  const handleDragStart = (e, item, itemIndex) => {
    setDraggedItem({ item, bagIndex, itemIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ item, bagIndex, itemIndex }));
  };
  
  // Handle right-click to equip
  const handleRightClick = (e, item, itemIndex) => {
    e.preventDefault();
    
    if (item.type === 'equipment') {
      // Equip to character panel
      equipItem(item, bagIndex, itemIndex);
    } else if (item.type === 'bag') {
      // Find first empty bag slot
      const bags = useGameStore.getState().bags;
      const emptySlotIndex = bags.findIndex(bag => !bag.bagItem);
      if (emptySlotIndex !== -1) {
        equipBag(item, emptySlotIndex, bagIndex, itemIndex);
      }
    }
  };
  
  return (
    <div 
      className="fixed bottom-24 right-16 z-30 pointer-events-auto"
      data-testid={`bag-panel-${bagIndex}`}
    >
      {/* Bag Window */}
      <div className="bg-[#1c1917]/95 border-2 border-[#44403c] rounded-lg shadow-2xl w-72 backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7c2d12] to-[#9a3412] px-3 py-2">
          <div className="flex items-center justify-between">
            <h3 className="font-cinzel text-sm text-[#fbbf24]">{bagName}</h3>
            <button 
              onClick={onClose}
              className="text-[#fbbf24] hover:text-white transition-colors"
              data-testid="close-bag"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Currency Display - Only show on backpack */}
          {bagIndex === 0 && (
            <div className="flex items-center gap-3 mt-1.5 text-sm font-rajdhani font-bold">
              {currency.gold > 0 && (
                <span className="flex items-center gap-0.5">
                  <span className="text-[#ffd700]">{currency.gold}</span>
                  <span className="text-[#ffd700]">g</span>
                </span>
              )}
              {currency.silver > 0 && (
                <span className="flex items-center gap-0.5">
                  <span className="text-[#c0c0c0]">{currency.silver}</span>
                  <span className="text-[#c0c0c0]">s</span>
                </span>
              )}
              {(currency.copper > 0 || (currency.gold === 0 && currency.silver === 0)) && (
                <span className="flex items-center gap-0.5">
                  <span className="text-[#cd7f32]">{currency.copper}</span>
                  <span className="text-[#cd7f32]">c</span>
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Bag Grid */}
        <div className="p-3">
          <div className="grid grid-cols-4 gap-1.5">
            {/* Filled slots */}
            {items.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="relative w-14 h-14 rounded border-2 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-[#fbbf24]/10 transition-all group"
                style={{
                  borderColor: RARITY_COLORS[item.rarity] || RARITY_COLORS.common,
                  backgroundColor: `${RARITY_COLORS[item.rarity] || RARITY_COLORS.common}10`
                }}
                title={item.name}
                data-testid={`bag-item-${item.id}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, item, index)}
                onContextMenu={(e) => handleRightClick(e, item, index)}
              >
                {/* Item icon */}
                <span className="text-2xl pointer-events-none">{item.icon || ITEM_ICONS[item.type] || '❓'}</span>
                
                {/* Quantity badge */}
                {item.quantity > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 text-[10px] font-rajdhani font-bold text-white bg-black/70 px-1 rounded pointer-events-none">
                    {item.quantity}
                  </span>
                )}
                
                {/* Tooltip */}
                <div className="absolute z-[100] hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none">
                  <div className="bg-[#0c0a09] border-2 rounded px-2 py-1.5 min-w-32" style={{ borderColor: RARITY_COLORS[item.rarity] || RARITY_COLORS.common }}>
                    <p className="font-rajdhani font-semibold text-xs" style={{ color: RARITY_COLORS[item.rarity] || RARITY_COLORS.common }}>
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
                    {item.type === 'bag' && item.slots && (
                      <p className="text-[10px] text-[#3b82f6] mt-1">{item.slots} slots</p>
                    )}
                    {item.vendorPrice && (
                      <p className="text-[10px] text-[#fbbf24] mt-1">
                        Sell: {formatCurrency(item.vendorPrice)}
                      </p>
                    )}
                    <p className="text-[9px] text-[#44403c] mt-1 italic">
                      Right-click to equip
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {[...Array(Math.max(0, maxSlots - items.length))].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-14 h-14 rounded border border-[#292524] bg-[#0c0a09]/30"
                data-testid={`empty-slot-${i}`}
              />
            ))}
          </div>
          
          {/* Bag stats */}
          <div className="mt-2 pt-2 border-t border-[#44403c]">
            <p className="text-xs text-[#78716c] font-rajdhani text-center">
              {items.length} / {maxSlots} slots used
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BagPanel;
