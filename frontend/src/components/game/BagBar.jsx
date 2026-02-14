import { Backpack, Package } from 'lucide-react';
import BagPanel from './BagPanel';
import { useGameStore } from '../../store/gameStore';

// Bag icons component - WoW style bottom-right
const BagBar = ({ bags, backpackItems, openBagIndex, setOpenBagIndex }) => {
  const equipBag = useGameStore(state => state.equipBag);
  
  const handleBagClick = (index) => {
    if (openBagIndex === index) {
      setOpenBagIndex(null);
    } else {
      setOpenBagIndex(index);
    }
  };
  
  // Handle drag over
  const handleDragOver = (e, slotIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop on bag slot
  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { item, bagIndex, itemIndex } = data;
      
      // Only allow bag items
      if (item.type === 'bag') {
        equipBag(item, slotIndex, bagIndex, itemIndex);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };
  
  return (
    <>
      {/* Bag Bar - Bottom Right */}
      <div className="absolute bottom-24 right-4 flex flex-col-reverse gap-1 z-20 pointer-events-auto">
        {/* Main Backpack (always present, 16 slots) */}
        <button
          onClick={() => handleBagClick(0)}
          className={`w-10 h-10 rounded border-2 transition-all ${
            openBagIndex === 0 
              ? 'bg-[#fbbf24]/30 border-[#fbbf24] shadow-lg' 
              : 'bg-[#1c1917]/90 border-[#44403c] hover:border-[#fbbf24] hover:bg-[#fbbf24]/10'
          }`}
          title="Backpack (16 slots)"
          data-testid="backpack-button"
        >
          <Backpack className="w-5 h-5 mx-auto text-[#fbbf24]" />
        </button>
        
        {/* Bag Slots 1-4 */}
        {[1, 2, 3, 4].map((slot) => {
          const bag = bags[slot - 1];
          const hasBag = bag && bag.bagItem;
          
          return (
            <button
              key={slot}
              onClick={() => hasBag && handleBagClick(slot)}
              onDragOver={(e) => handleDragOver(e, slot - 1)}
              onDrop={(e) => handleDrop(e, slot - 1)}
              className={`w-10 h-10 rounded border-2 transition-all ${
                openBagIndex === slot
                  ? 'bg-[#fbbf24]/30 border-[#fbbf24] shadow-lg'
                  : hasBag
                    ? 'bg-[#1c1917]/90 border-[#44403c] hover:border-[#fbbf24] hover:bg-[#fbbf24]/10'
                    : 'bg-[#1c1917]/40 border-[#292524] opacity-60 hover:border-[#44403c]'
              }`}
              title={hasBag ? `${bag.bagItem.name} (${bag.bagItem.slots} slots)` : `Bag Slot ${slot} (Empty - Drag bag here)`}
              data-testid={`bag-slot-${slot}`}
            >
              {hasBag ? (
                <span className="text-xl pointer-events-none">{bag.bagItem.icon}</span>
              ) : (
                <Package className="w-4 h-4 mx-auto text-[#44403c] pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Bag Panels */}
      {openBagIndex !== null && (
        <BagPanel
          bagIndex={openBagIndex}
          items={openBagIndex === 0 ? backpackItems : bags[openBagIndex - 1]?.items || []}
          bagName={openBagIndex === 0 ? 'Backpack' : bags[openBagIndex - 1]?.bagItem?.name || 'Empty Bag'}
          maxSlots={openBagIndex === 0 ? 16 : bags[openBagIndex - 1]?.bagItem?.slots || 0}
          onClose={() => setOpenBagIndex(null)}
        />
      )}
    </>
  );
};

export default BagBar;
