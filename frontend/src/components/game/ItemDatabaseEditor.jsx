import { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, Search, Edit } from 'lucide-react';
import { LOOT_ITEMS } from './LootPanel';

// Item Database Editor - F4 Admin Tool
const ItemDatabaseEditor = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state for editing/creating
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    icon: '',
    description: '',
    type: 'material', // material, equipment, bag, consumable
    rarity: 'common',
    vendorPrice: 0,
    dropChance: 0.1,
    equipSlot: '',
    slots: 0,
    statRanges: {}
  });
  
  useEffect(() => {
    // Load items from LOOT_ITEMS
    const itemsList = Object.entries(LOOT_ITEMS).map(([id, item]) => ({
      id,
      ...item
    }));
    setItems(itemsList);
  }, []);
  
  if (!isOpen) return null;
  
  // Filter items by search
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group items by type
  const groupedItems = {
    equipment: filteredItems.filter(i => i.type === 'equipment'),
    bag: filteredItems.filter(i => i.type === 'bag'),
    material: filteredItems.filter(i => !i.type || i.type === 'material')
  };
  
  // Handle edit item
  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      icon: item.icon,
      description: item.description || '',
      type: item.type || 'material',
      rarity: item.rarity,
      vendorPrice: item.vendorPrice,
      dropChance: item.dropChance,
      equipSlot: item.equipSlot || '',
      slots: item.slots || 0,
      statRanges: item.statRanges || {}
    });
    setIsEditing(true);
    setIsCreating(false);
  };
  
  // Handle create new item
  const handleCreateNew = () => {
    setSelectedItem(null);
    setFormData({
      id: '',
      name: '',
      icon: '❓',
      description: '',
      type: 'material',
      rarity: 'common',
      vendorPrice: 100,
      dropChance: 0.1,
      equipSlot: '',
      slots: 0,
      statRanges: {}
    });
    setIsEditing(true);
    setIsCreating(true);
  };
  
  // Handle save item
  const handleSave = () => {
    console.log('Saving item:', formData);
    // TODO: Save to database via API
    alert('Item saved! (Backend integration needed)');
    setIsEditing(false);
    setIsCreating(false);
  };
  
  // Handle stat change
  const handleStatChange = (stat, field, value) => {
    const newStatRanges = { ...formData.statRanges };
    if (!newStatRanges[stat]) {
      newStatRanges[stat] = [0, 5];
    }
    newStatRanges[stat][field === 'min' ? 0 : 1] = parseInt(value) || 0;
    setFormData({ ...formData, statRanges: newStatRanges });
  };
  
  // Add new stat
  const handleAddStat = () => {
    const newStat = prompt('Enter stat name (attack, defense, strength, magic):');
    if (newStat) {
      const newStatRanges = { ...formData.statRanges };
      newStatRanges[newStat] = [1, 5];
      setFormData({ ...formData, statRanges: newStatRanges });
    }
  };
  
  // Remove stat
  const handleRemoveStat = (stat) => {
    const newStatRanges = { ...formData.statRanges };
    delete newStatRanges[stat];
    setFormData({ ...formData, statRanges: newStatRanges });
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
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Editor Panel */}
      <div className="relative bg-[#1c1917]/98 border-2 border-[#44403c] rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm w-[90vw] h-[90vh] flex">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#7c2d12] to-[#9a3412] px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Edit className="w-6 h-6 text-[#fbbf24]" />
            <div>
              <h2 className="font-cinzel text-lg text-[#fbbf24]">Item Database Editor</h2>
              <p className="text-xs text-[#d4a574]">Admin Tool - F4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#fbbf24] hover:text-white transition-colors"
            data-testid="close-item-editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex w-full h-full pt-16">
          
          {/* Left Side - Item List */}
          <div className="w-1/2 border-r border-[#44403c] flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b border-[#44403c]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716c]" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-10 py-2 text-sm text-white focus:border-[#fbbf24] outline-none"
                />
              </div>
              <button
                onClick={handleCreateNew}
                className="mt-2 w-full bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Item
              </button>
            </div>
            
            {/* Item List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Equipment */}
              {groupedItems.equipment.length > 0 && (
                <div>
                  <h3 className="text-sm font-cinzel text-[#fbbf24] mb-2">⚔️ Equipment ({groupedItems.equipment.length})</h3>
                  <div className="space-y-1">
                    {groupedItems.equipment.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleEditItem(item)}
                        className={`w-full text-left p-2 rounded border transition-all ${
                          selectedItem?.id === item.id
                            ? 'bg-[#fbbf24]/20 border-[#fbbf24]'
                            : 'bg-[#0c0a09]/50 border-[#292524] hover:border-[#44403c]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-rajdhani" style={{ color: RARITY_COLORS[item.rarity] }}>
                              {item.name}
                            </p>
                            <p className="text-xs text-[#78716c]">{item.equipSlot || 'Unknown slot'}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Bags */}
              {groupedItems.bag.length > 0 && (
                <div>
                  <h3 className="text-sm font-cinzel text-[#fbbf24] mb-2">🎒 Bags ({groupedItems.bag.length})</h3>
                  <div className="space-y-1">
                    {groupedItems.bag.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleEditItem(item)}
                        className={`w-full text-left p-2 rounded border transition-all ${
                          selectedItem?.id === item.id
                            ? 'bg-[#fbbf24]/20 border-[#fbbf24]'
                            : 'bg-[#0c0a09]/50 border-[#292524] hover:border-[#44403c]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-rajdhani" style={{ color: RARITY_COLORS[item.rarity] }}>
                              {item.name}
                            </p>
                            <p className="text-xs text-[#78716c]">{item.slots} slots</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Materials */}
              {groupedItems.material.length > 0 && (
                <div>
                  <h3 className="text-sm font-cinzel text-[#fbbf24] mb-2">📦 Materials ({groupedItems.material.length})</h3>
                  <div className="space-y-1">
                    {groupedItems.material.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleEditItem(item)}
                        className={`w-full text-left p-2 rounded border transition-all ${
                          selectedItem?.id === item.id
                            ? 'bg-[#fbbf24]/20 border-[#fbbf24]'
                            : 'bg-[#0c0a09]/50 border-[#292524] hover:border-[#44403c]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-rajdhani" style={{ color: RARITY_COLORS[item.rarity] }}>
                              {item.name}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side - Item Editor */}
          <div className="w-1/2 flex flex-col">
            {isEditing ? (
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-lg font-cinzel text-[#fbbf24] mb-4">
                  {isCreating ? 'Create New Item' : 'Edit Item'}
                </h3>
                
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[#78716c] block mb-1">Item ID</label>
                      <input
                        type="text"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        disabled={!isCreating}
                        className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-sm text-white disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-[#78716c] block mb-1">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-sm text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-[#78716c] block mb-1">Icon (Emoji)</label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-2xl text-white text-center"
                        maxLength={2}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-[#78716c] block mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-sm text-white h-20"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#78716c] block mb-1">Type</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-sm text-white"
                        >
                          <option value="material">Material</option>
                          <option value="equipment">Equipment</option>
                          <option value="bag">Bag</option>
                          <option value="consumable">Consumable</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs text-[#78716c] block mb-1">Rarity</label>
                        <select
                          value={formData.rarity}
                          onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                          className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-sm text-white"
                        >
                          <option value="junk">Junk (Gray)</option>
                          <option value="common">Common (White)</option>
                          <option value="uncommon">Uncommon (Green)</option>
                          <option value="rare">Rare (Blue)</option>
                          <option value="epic">Epic (Purple)</option>
                          <option value="legendary">Legendary (Orange)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#78716c] block mb-1">Vendor Price (copper)</label>
                        <input
                          type="number"
                          value={formData.vendorPrice}
                          onChange={(e) => setFormData({ ...formData, vendorPrice: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-sm text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-[#78716c] block mb-1">Drop Chance (0-1)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.dropChance}
                          onChange={(e) => setFormData({ ...formData, dropChance: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Equipment-specific fields */}
                  {formData.type === 'equipment' && (
                    <div className="border-t border-[#44403c] pt-4 mt-4">
                      <h4 className="text-sm font-cinzel text-[#fbbf24] mb-3">Equipment Settings</h4>
                      
                      <div>
                        <label className="text-xs text-[#78716c] block mb-1">Equipment Slot</label>
                        <select
                          value={formData.equipSlot}
                          onChange={(e) => setFormData({ ...formData, equipSlot: e.target.value })}
                          className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-sm text-white"
                        >
                          <option value="">Select slot...</option>
                          <option value="head">Head</option>
                          <option value="neck">Neck</option>
                          <option value="shoulders">Shoulders</option>
                          <option value="back">Back</option>
                          <option value="chest">Chest</option>
                          <option value="shirt">Shirt</option>
                          <option value="tabard">Tabard</option>
                          <option value="wrist">Wrist</option>
                          <option value="hands">Hands</option>
                          <option value="waist">Waist</option>
                          <option value="legs">Legs</option>
                          <option value="feet">Feet</option>
                          <option value="finger1">Finger 1</option>
                          <option value="finger2">Finger 2</option>
                          <option value="trinket1">Trinket 1</option>
                          <option value="trinket2">Trinket 2</option>
                          <option value="mainHand">Main Hand</option>
                          <option value="offHand">Off Hand</option>
                          <option value="ranged">Ranged</option>
                        </select>
                      </div>
                      
                      {/* Stats Editor */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-[#78716c]">Stat Ranges</label>
                          <button
                            onClick={handleAddStat}
                            className="text-xs bg-[#22c55e] hover:bg-[#16a34a] text-white px-2 py-1 rounded"
                          >
                            <Plus className="w-3 h-3 inline mr-1" />
                            Add Stat
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {Object.entries(formData.statRanges).map(([stat, range]) => (
                            <div key={stat} className="flex items-center gap-2 bg-[#0c0a09] border border-[#44403c] rounded p-2">
                              <span className="text-sm text-white capitalize flex-1">{stat}</span>
                              <input
                                type="number"
                                value={range[0]}
                                onChange={(e) => handleStatChange(stat, 'min', e.target.value)}
                                className="w-16 bg-[#1c1917] border border-[#44403c] rounded px-2 py-1 text-xs text-white"
                                placeholder="Min"
                              />
                              <span className="text-[#78716c]">-</span>
                              <input
                                type="number"
                                value={range[1]}
                                onChange={(e) => handleStatChange(stat, 'max', e.target.value)}
                                className="w-16 bg-[#1c1917] border border-[#44403c] rounded px-2 py-1 text-xs text-white"
                                placeholder="Max"
                              />
                              <button
                                onClick={() => handleRemoveStat(stat)}
                                className="text-[#dc2626] hover:text-[#ef4444]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          
                          {Object.keys(formData.statRanges).length === 0 && (
                            <p className="text-xs text-[#78716c] text-center py-2">No stats added yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Bag-specific fields */}
                  {formData.type === 'bag' && (
                    <div className="border-t border-[#44403c] pt-4 mt-4">
                      <h4 className="text-sm font-cinzel text-[#fbbf24] mb-3">Bag Settings</h4>
                      
                      <div>
                        <label className="text-xs text-[#78716c] block mb-1">Bag Slots</label>
                        <input
                          type="number"
                          value={formData.slots}
                          onChange={(e) => setFormData({ ...formData, slots: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Save Button */}
                  <div className="flex gap-2 pt-4 border-t border-[#44403c]">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Item
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                      }}
                      className="px-4 py-2 bg-[#44403c] hover:bg-[#57534e] text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <Edit className="w-16 h-16 text-[#44403c] mx-auto mb-4" />
                  <p className="text-[#78716c]">Select an item to edit</p>
                  <p className="text-xs text-[#57534e] mt-2">or create a new item</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDatabaseEditor;
