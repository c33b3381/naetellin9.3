import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Backpack, Coins } from 'lucide-react';
import { X } from 'lucide-react';

const ITEM_ICONS = {
  weapon: '⚔️',
  shield: '🛡️',
  food: '🍖',
  currency: '💰',
  resource: '📦',
  tool: '⛏️',
  armor: '🎽',
};

const InventoryPanel = () => {
  const { inventory, equipment, gold, equipItem, closePanel } = useGameStore();

  const handleEquip = async (itemId) => {
    try {
      await equipItem(itemId);
    } catch (err) {
      console.error('Equip failed:', err);
    }
  };

  return (
    <div className="game-panel w-96" data-testid="inventory-panel">
      {/* Header */}
      <div className="game-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Backpack className="w-5 h-5" />
          <span>Inventory</span>
        </div>
        <button 
          onClick={closePanel}
          className="text-[#78716c] hover:text-[#dc2626] transition-colors"
          data-testid="close-inventory"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4">
        {/* Gold display */}
        <div className="flex items-center gap-2 mb-4 p-2 bg-[#0c0a09] rounded border border-[#44403c]">
          <Coins className="w-5 h-5 text-[#fbbf24]" />
          <span className="font-rajdhani font-semibold text-[#fbbf24]">{gold} Gold</span>
        </div>

        {/* Equipment slots */}
        <div className="mb-4">
          <p className="font-rajdhani text-xs text-[#78716c] uppercase tracking-wider mb-2">Equipped</p>
          <div className="grid grid-cols-4 gap-2">
            {['weapon', 'shield', 'armor', 'tool'].map((slot) => (
              <div
                key={slot}
                className={`inventory-slot ${equipment?.[slot] ? 'equipped' : ''}`}
                title={equipment?.[slot]?.name || `Empty ${slot}`}
              >
                {equipment?.[slot] ? (
                  <span className="text-lg">{ITEM_ICONS[slot]}</span>
                ) : (
                  <span className="text-xs text-[#78716c]">{slot}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Inventory grid */}
        <p className="font-rajdhani text-xs text-[#78716c] uppercase tracking-wider mb-2">Backpack</p>
        <ScrollArea className="h-48">
          <div className="grid grid-cols-4 gap-2">
            {inventory.map((item, i) => (
              <div
                key={`${item.item_id}-${i}`}
                className="inventory-slot group cursor-pointer"
                onClick={() => ['weapon', 'shield', 'armor', 'tool'].includes(item.type) && handleEquip(item.item_id)}
                title={`${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`}
              >
                <span className="text-lg">{ITEM_ICONS[item.type] || '❓'}</span>
                {item.quantity > 1 && (
                  <span className="absolute bottom-0 right-0.5 text-[10px] font-rajdhani font-bold text-[#f5f5f4]">
                    {item.quantity}
                  </span>
                )}
                
                {/* Tooltip */}
                <div className="absolute z-50 hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1">
                  <div className="tooltip-medieval min-w-24">
                    <p className="font-rajdhani font-semibold text-[#f5f5f4]">{item.name}</p>
                    <p className="text-[10px] text-[#78716c] capitalize">{item.type}</p>
                    {item.stats && Object.keys(item.stats).length > 0 && (
                      <div className="mt-1 pt-1 border-t border-[#44403c]">
                        {Object.entries(item.stats).map(([stat, val]) => (
                          <p key={stat} className="text-[10px] text-[#059669]">
                            +{val} {stat}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {[...Array(Math.max(0, 20 - inventory.length))].map((_, i) => (
              <div key={`empty-${i}`} className="inventory-slot opacity-50" />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default InventoryPanel;
