import { useState } from 'react';
import { Package, Coins, X, Skull } from 'lucide-react';
import { formatCurrency } from '../../store/gameStore';
// Import loot data from centralized data file
import { LOOT_ITEMS, RARITY_COLORS, generateLoot } from '../../data/items';

// Re-export for backwards compatibility
export { LOOT_ITEMS, generateLoot };

const LootPanel = ({ 
  isOpen, 
  onClose, 
  lootData,
  enemyName,
  onLootItem,
  onLootAll
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  
  if (!isOpen || !lootData) return null;
  
  const hasItems = lootData.items && lootData.items.length > 0;
  const hasGold = lootData.gold && lootData.gold > 0;
  const isEmpty = !hasItems && !hasGold;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto" data-testid="loot-panel">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      
      {/* Loot Window */}
      <div className="relative bg-[#1a1a1a] border-2 border-[#fbbf24] rounded-lg shadow-2xl w-80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7c2d12] to-[#9a3412] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-[#fbbf24]" />
            <h2 className="font-cinzel text-lg text-[#fbbf24]">{enemyName || 'Corpse'}</h2>
          </div>
          <button onClick={onClose} className="text-[#fbbf24] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Loot Content */}
        <div className="p-3 max-h-64 overflow-y-auto">
          {isEmpty ? (
            <div className="text-center py-4 text-[#78716c]">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No loot</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Copper/Silver/Gold */}
              {hasGold && (
                <button
                  onClick={() => onLootItem({ type: 'gold', amount: lootData.gold })}
                  className="w-full flex items-center gap-3 p-2 rounded border border-[#44403c] hover:border-[#fbbf24] hover:bg-[#fbbf24]/10 transition-all"
                  data-testid="loot-gold"
                >
                  <div className="w-10 h-10 rounded bg-[#fbbf24]/20 border border-[#fbbf24] flex items-center justify-center">
                    <Coins className="w-5 h-5 text-[#fbbf24]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-rajdhani font-semibold text-[#fbbf24]">
                      {formatCurrency(lootData.gold)}
                    </p>
                  </div>
                </button>
              )}
              
              {/* Items */}
              {hasItems && lootData.items.map((item, index) => (
                <button
                  key={`${item.id}-${index}`}
                  onClick={() => onLootItem({ type: 'item', item })}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="w-full flex items-center gap-3 p-2 rounded border border-[#44403c] hover:border-[#fbbf24] hover:bg-[#fbbf24]/10 transition-all relative"
                  data-testid={`loot-item-${item.id}`}
                >
                  <div 
                    className="w-10 h-10 rounded border-2 flex items-center justify-center text-xl"
                    style={{ 
                      borderColor: RARITY_COLORS[item.rarity],
                      backgroundColor: `${RARITY_COLORS[item.rarity]}20`
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p 
                      className="font-rajdhani font-semibold"
                      style={{ color: RARITY_COLORS[item.rarity] }}
                    >
                      {item.name} {item.quantity > 1 && `x${item.quantity}`}
                    </p>
                    <p className="text-xs text-[#78716c]">
                      Sell: {item.vendorPrice * item.quantity}g
                    </p>
                  </div>
                  
                  {/* Tooltip */}
                  {hoveredItem?.id === item.id && (
                    <div className="absolute left-full ml-2 top-0 w-48 bg-[#0c0a09] border border-[#44403c] rounded p-2 z-10 pointer-events-none">
                      <p 
                        className="font-semibold text-sm"
                        style={{ color: RARITY_COLORS[item.rarity] }}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs text-[#a8a29e] mt-1">{item.description}</p>
                      <p className="text-xs text-[#fbbf24] mt-1">Vendor Price: {item.vendorPrice}g</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-[#44403c] p-2">
            <button
              onClick={onLootAll}
              className="w-full py-2 px-4 bg-gradient-to-r from-[#7c2d12] to-[#9a3412] hover:from-[#9a3412] hover:to-[#b45309] text-[#fbbf24] font-rajdhani font-semibold rounded transition-all"
              data-testid="loot-all-btn"
            >
              Loot All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LootPanel;
