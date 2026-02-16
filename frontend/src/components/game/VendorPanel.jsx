import { useState } from 'react';
import { X, Coins, Store, Package, Axe, Utensils, Gem, Sword, Shield, Droplets, Sparkles } from 'lucide-react';

// Vendor type configurations
const VENDOR_TYPES = {
  vendor_blacksmith: {
    name: 'Blacksmith',
    icon: Axe,
    color: '#6b7280',
    buyMultiplier: 0.5, // Pays 50% of item value
    acceptsTypes: ['weapon', 'armor', 'metal', 'ore'],
    greeting: "Need something repaired or want to sell some metal goods?"
  },
  vendor_general: {
    name: 'General Goods',
    icon: Store,
    color: '#22c55e',
    buyMultiplier: 0.4, // Pays 40% of item value
    acceptsTypes: ['misc', 'junk', 'cloth', 'leather', 'food', 'potion'],
    greeting: "I buy and sell a little bit of everything!"
  },
  vendor_trade: {
    name: 'Trade Goods',
    icon: Gem,
    color: '#fbbf24',
    buyMultiplier: 0.6, // Pays 60% of item value
    acceptsTypes: ['gem', 'ore', 'rare', 'trade', 'crafting'],
    greeting: "Looking to trade some valuable goods?"
  },
  vendor_food: {
    name: 'Food & Water',
    icon: Utensils,
    color: '#f97316',
    buyMultiplier: 0.3, // Pays 30% of item value
    acceptsTypes: ['food', 'drink', 'fish', 'meat', 'ingredient'],
    greeting: "Fresh supplies! I'll buy any food you've gathered."
  },
  vendor_weapons: {
    name: 'Weapons Dealer',
    icon: Sword,
    color: '#dc2626',
    buyMultiplier: 0.55,
    acceptsTypes: ['weapon', 'ammo'],
    greeting: "Looking to sell some weapons, adventurer?"
  },
  vendor_armor: {
    name: 'Armor Merchant',
    icon: Shield,
    color: '#3b82f6',
    buyMultiplier: 0.55,
    acceptsTypes: ['armor', 'shield', 'helmet', 'boots', 'gloves'],
    greeting: "I deal in protective gear of all kinds."
  },
  vendor_potions: {
    name: 'Alchemist',
    icon: Droplets,
    color: '#a855f7',
    buyMultiplier: 0.45,
    acceptsTypes: ['potion', 'herb', 'reagent', 'ingredient'],
    greeting: "Potions, herbs, reagents - I buy them all!"
  },
  vendor_magic: {
    name: 'Magic Supplies',
    icon: Sparkles,
    color: '#8b5cf6',
    buyMultiplier: 0.5,
    acceptsTypes: ['magic', 'scroll', 'wand', 'rune', 'enchanted'],
    greeting: "Arcane items and magical curiosities interest me."
  }
};

// Default item values by type
const ITEM_BASE_VALUES = {
  // Junk items from monsters
  'Broken Sword': 5,
  'Torn Cloth': 2,
  'Monster Tooth': 8,
  'Wolf Pelt': 15,
  'Goblin Ear': 3,
  'Skeleton Bone': 4,
  'Spider Silk': 12,
  'Troll Hide': 25,
  // Default for unknown items
  default: 5
};

const VendorPanel = ({
  isOpen,
  onClose,
  vendorType = 'vendor_general',
  vendorName = 'Merchant',
  playerInventory = [],
  playerCopper = 0,
  onSellItem,
  onUpdateCopper
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [recentlySold, setRecentlySold] = useState([]);

  const vendor = VENDOR_TYPES[vendorType] || VENDOR_TYPES.vendor_general;
  const VendorIcon = vendor.icon;

  // Calculate sell price for an item
  const getSellPrice = (item) => {
    const baseValue = item.value || ITEM_BASE_VALUES[item.name] || ITEM_BASE_VALUES.default;
    return Math.floor(baseValue * vendor.buyMultiplier);
  };

  // Check if vendor accepts this item type
  const canSellItem = (item) => {
    // For now, vendors accept all items (we can make this more restrictive later)
    return true;
  };

  // Handle selling an item
  const handleSellItem = (item, slotIndex) => {
    if (!canSellItem(item)) return;
    
    const sellPrice = getSellPrice(item);
    
    // Add to recently sold for feedback
    setRecentlySold(prev => [...prev.slice(-4), { name: item.name, price: sellPrice, time: Date.now() }]);
    
    // Call the sell handler
    if (onSellItem) {
      onSellItem(item, slotIndex, sellPrice);
    }
    
    // Update player copper
    if (onUpdateCopper) {
      onUpdateCopper(playerCopper + sellPrice);
    }
  };

  // Format copper to gold/silver/copper display
  const formatMoney = (copper) => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const cop = copper % 100;
    
    let parts = [];
    if (gold > 0) parts.push(`${gold}g`);
    if (silver > 0) parts.push(`${silver}s`);
    parts.push(`${cop}c`);
    
    return parts.join(' ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto" data-testid="vendor-panel">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Vendor Panel */}
      <div className="relative bg-[#1a1a1a] border-2 rounded-lg shadow-2xl w-[600px] max-h-[85vh] overflow-hidden"
           style={{ borderColor: vendor.color }}>
        {/* Header */}
        <div className="px-6 py-3 flex items-center justify-between"
             style={{ background: `linear-gradient(to right, ${vendor.color}40, ${vendor.color}20)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                 style={{ backgroundColor: `${vendor.color}30`, border: `2px solid ${vendor.color}` }}>
              <VendorIcon className="w-5 h-5" style={{ color: vendor.color }} />
            </div>
            <div>
              <h2 className="font-cinzel text-lg text-white">{vendorName}</h2>
              <p className="text-xs" style={{ color: vendor.color }}>{vendor.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#a8a29e] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Vendor Greeting */}
          <div className="bg-[#0c0a09] rounded-lg p-3 border border-[#44403c]">
            <p className="text-[#f5f5f4] italic text-sm">"{vendor.greeting}"</p>
          </div>

          {/* Player Money */}
          <div className="flex items-center justify-between bg-[#0c0a09] rounded-lg p-3 border border-[#44403c]">
            <span className="text-[#a8a29e] text-sm">Your Money:</span>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#fbbf24]" />
              <span className="text-[#fbbf24] font-bold">{formatMoney(playerCopper)}</span>
            </div>
          </div>

          {/* Sell Items Section */}
          <div>
            <h3 className="text-xs text-[#a8a29e] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Sell Items (Click to sell)
            </h3>
            
            {playerInventory.length === 0 ? (
              <div className="bg-[#0c0a09] rounded-lg p-6 border border-[#44403c] text-center">
                <p className="text-[#78716c]">Your inventory is empty.</p>
                <p className="text-[#57534e] text-xs mt-1">Defeat monsters to collect items to sell!</p>
              </div>
            ) : (
              <div className="bg-[#0c0a09] rounded-lg p-3 border border-[#44403c]">
                <div className="grid grid-cols-8 gap-1">
                  {playerInventory.map((item, index) => (
                    <div
                      key={index}
                      className={`relative w-12 h-12 rounded border transition-all cursor-pointer ${
                        item 
                          ? 'border-[#44403c] hover:border-[#22c55e] bg-[#1a1a1a]' 
                          : 'border-[#292524] bg-[#0c0a09]'
                      }`}
                      onClick={() => {
                        if (item) handleSellItem(item, index);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (item) handleSellItem(item, index);
                      }}
                      onMouseEnter={() => item && setHoveredItem({ item, index })}
                      onMouseLeave={() => setHoveredItem(null)}
                      data-testid={`inventory-slot-${index}`}
                    >
                      {item && (
                        <>
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl">{item.icon || '📦'}</span>
                          </div>
                          {item.quantity > 1 && (
                            <span className="absolute bottom-0 right-0 text-[10px] text-white bg-black/70 px-1 rounded">
                              {item.quantity}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Item Tooltip */}
                {hoveredItem && (
                  <div className="mt-3 p-3 bg-[#1a1a1a] rounded border border-[#44403c]">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-bold">{hoveredItem.item.name}</p>
                        <p className="text-[#78716c] text-xs mt-1">{hoveredItem.item.description || 'An item from your adventures.'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#22c55e] text-sm font-bold">
                          Sell: {formatMoney(getSellPrice(hoveredItem.item))}
                        </p>
                        <p className="text-[#78716c] text-xs">Click to sell</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recently Sold */}
          {recentlySold.length > 0 && (
            <div>
              <h3 className="text-xs text-[#a8a29e] uppercase tracking-wider mb-2">Recently Sold</h3>
              <div className="space-y-1">
                {recentlySold.slice(-5).reverse().map((sale, index) => (
                  <div key={index} className="flex items-center justify-between text-xs px-2 py-1 bg-[#0c0a09] rounded">
                    <span className="text-[#78716c]">{sale.name}</span>
                    <span className="text-[#22c55e]">+{formatMoney(sale.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Shop (Placeholder for future) */}
          <div className="border-t border-[#44403c] pt-4">
            <h3 className="text-xs text-[#a8a29e] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Store className="w-4 h-4" />
              Vendor Stock (Coming Soon)
            </h3>
            <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c] text-center">
              <p className="text-[#57534e] text-sm">This vendor doesn't have items for sale yet.</p>
              <p className="text-[#44403c] text-xs mt-1">Check back later!</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0c0a09] px-6 py-3 border-t border-[#44403c] flex justify-between items-center">
          <p className="text-[#78716c] text-xs">
            This vendor pays <span style={{ color: vendor.color }}>{Math.round(vendor.buyMultiplier * 100)}%</span> of item value
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#44403c] text-white rounded hover:bg-[#57534e] transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorPanel;
