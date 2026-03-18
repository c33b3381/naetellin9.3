import { useState, useEffect } from 'react';
import { 
  Save, Trash2, Move, Plus, Eye, EyeOff,
  ChevronDown, ChevronUp, Download, Upload
} from 'lucide-react';
// Import object categories from centralized data file
import { OBJECT_CATEGORIES } from '../../data/objects';

// Re-export for backwards compatibility
export { OBJECT_CATEGORIES };


const WorldEditor = ({ 
  isOpen, 
  onClose, 
  onPlaceObject, 
  onDeleteObject,
  onSaveWorld,
  onLoadWorld,
  placedObjects = [],
  selectedEditObject,
  onSelectEditObject,
  currentZone,
  onUpdatePreview // Callback to update preview in real-time
}) => {
  const [selectedCategory, setSelectedCategory] = useState('nature');
  const [selectedType, setSelectedType] = useState('tree_pine');
  const [objectName, setObjectName] = useState('');
  const [objectLevel, setObjectLevel] = useState(1);
  const [objectScale, setObjectScale] = useState(1);
  const [objectRotation, setObjectRotation] = useState(0); // Rotation in degrees (0-360)
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [showObjectList, setShowObjectList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Set default type when category changes
    const category = OBJECT_CATEGORIES[selectedCategory];
    if (category) {
      const firstType = Object.keys(category.types)[0];
      setSelectedType(firstType);
    }
  }, [selectedCategory]);
  
  // Notify parent of scale/rotation changes for real-time preview
  useEffect(() => {
    if (onUpdatePreview && isPlacingMode) {
      onUpdatePreview({ scale: objectScale, rotation: objectRotation });
    }
  }, [objectScale, objectRotation, isPlacingMode, onUpdatePreview]);

  const handlePlace = () => {
    setIsPlacingMode(true);
    const category = OBJECT_CATEGORIES[selectedCategory];
    const typeInfo = category?.types[selectedType];
    
    // Determine the base type for the placement system
    let baseType = 'prop';
    let subType = selectedType;
    
    if (selectedCategory === 'nature') {
      if (selectedType.startsWith('tree')) baseType = 'tree';
      else baseType = 'plant';
    } else if (selectedCategory === 'rocks') {
      if (selectedType.startsWith('ore')) baseType = 'rock';
      else baseType = 'rock';
    } else if (selectedCategory === 'buildings') {
      baseType = 'building';
    } else if (selectedCategory === 'props') {
      baseType = 'prop';
    } else if (selectedCategory === 'npcs') {
      baseType = 'npc';
      subType = selectedType.replace('npc_', '');
    } else if (selectedCategory === 'vendors') {
      baseType = 'vendor';
      subType = selectedType.replace('vendor_', '');
    } else if (selectedCategory === 'monsters') {
      baseType = 'monster';
      subType = selectedType.replace('monster_', '');
    } else if (selectedCategory === 'animals') {
      baseType = 'animal';
    } else if (selectedCategory === 'special') {
      baseType = 'special';
    }
    
    onPlaceObject({
      type: baseType,
      subType: subType,
      fullType: selectedType,
      category: selectedCategory,
      name: objectName || typeInfo?.label || selectedType,
      level: objectLevel,
      scale: objectScale,
      rotation: objectRotation // Add rotation to placement data
    });
  };

  const handleExport = () => {
    const worldData = {
      zone: currentZone,
      objects: placedObjects,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(worldData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world_${currentZone}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const worldData = JSON.parse(event.target.result);
          onLoadWorld(worldData);
        } catch (err) {
          console.error('Failed to parse world file:', err);
          alert('Invalid world file format');
        }
      };
      reader.readAsText(file);
    }
  };

  // Filter types based on search
  const getFilteredTypes = () => {
    const category = OBJECT_CATEGORIES[selectedCategory];
    if (!category) return {};
    
    if (!searchQuery) return category.types;
    
    const filtered = {};
    Object.entries(category.types).forEach(([key, value]) => {
      if (value.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        filtered[key] = value;
      }
    });
    return filtered;
  };

  if (!isOpen) return null;

  const currentCategory = OBJECT_CATEGORIES[selectedCategory];
  const filteredTypes = getFilteredTypes();

  return (
    <div className="fixed top-20 left-4 z-50 pointer-events-auto" data-testid="world-editor">
      <div className="bg-[#1a1a1a]/95 border-2 border-[#fbbf24] rounded-lg shadow-2xl w-96 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#fbbf24] px-4 py-2 rounded-t-lg flex items-center justify-between flex-shrink-0">
          <h2 className="font-cinzel font-bold text-[#1a1a1a]">World Builder</h2>
          <button 
            onClick={onClose}
            className="text-[#1a1a1a] hover:text-[#dc2626] font-bold"
          >
            ✕
          </button>
        </div>

        {/* Quick Action Toolbar - Always Visible */}
        <div className="bg-[#2a2a2a] px-4 py-2 border-b border-[#44403c] flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handlePlace}
              className="flex-1 py-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-bold rounded flex items-center justify-center gap-1 text-sm hover:shadow-lg transition-all"
              data-testid="quick-place-btn"
            >
              <Plus className="w-4 h-4" />
              Place
            </button>
            <button
              onClick={() => setShowObjectList(true)}
              className={`flex-1 py-2 font-bold rounded flex items-center justify-center gap-1 text-sm transition-all ${
                placedObjects.length > 0 
                  ? 'bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white hover:shadow-lg'
                  : 'bg-[#44403c] text-[#6b6b6b] cursor-not-allowed'
              }`}
              disabled={placedObjects.length === 0}
              data-testid="quick-delete-btn"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({placedObjects.length})
            </button>
          </div>
          
          {/* Selected Object Quick Delete */}
          {selectedEditObject && (
            <div className="mt-2 p-2 bg-[#dc2626]/20 border border-[#dc2626] rounded">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#fca5a5]">Selected: <span className="text-white font-semibold">{selectedEditObject.name || selectedEditObject.fullType || selectedEditObject.type}</span></span>
                <button
                  onClick={() => onDeleteObject(selectedEditObject.id)}
                  className="px-3 py-1 bg-[#dc2626] text-white text-xs font-bold rounded hover:bg-[#ef4444] transition-all flex items-center gap-1"
                  data-testid="quick-delete-selected-btn"
                >
                  <Trash2 className="w-3 h-3" />
                  DELETE
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Current Zone */}
          <div className="text-xs text-[#a8a29e] font-rajdhani">
            Editing: <span className="text-[#fbbf24]">{currentZone}</span>
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-xs text-[#a8a29e] font-rajdhani block mb-2">Category</label>
            <div className="grid grid-cols-4 gap-1">
              {Object.entries(OBJECT_CATEGORIES).map(([key, { icon: Icon, color, label }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`p-2 rounded border transition-all flex flex-col items-center ${
                    selectedCategory === key 
                      ? 'border-[#fbbf24] bg-[#fbbf24]/20' 
                      : 'border-[#44403c] hover:border-[#57534e]'
                  }`}
                  title={label}
                  data-testid={`category-${key}`}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-[9px] mt-1 text-[#a8a29e] truncate w-full text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search objects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-3 py-2 text-[#f5f5f4] text-sm placeholder-[#57534e]"
            />
          </div>

          {/* Object Type Selection */}
          <div>
            <label className="text-xs text-[#a8a29e] font-rajdhani block mb-2">
              {currentCategory?.label} Objects ({Object.keys(filteredTypes).length})
            </label>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto bg-[#0c0a09] p-2 rounded border border-[#44403c]">
              {Object.entries(filteredTypes).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={`p-2 rounded border text-left transition-all flex items-center gap-2 ${
                    selectedType === key 
                      ? 'border-[#fbbf24] bg-[#fbbf24]/20' 
                      : 'border-[#44403c] hover:border-[#57534e] hover:bg-[#1a1a1a]'
                  }`}
                  data-testid={`object-${key}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: currentCategory?.color }} />
                  <span className="text-xs text-[#e7e5e4] truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Object Settings */}
          <div className="grid grid-cols-2 gap-3">
            {/* Object Name */}
            <div>
              <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Name</label>
              <input
                type="text"
                placeholder="Custom name..."
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-2 py-1 text-[#f5f5f4] text-sm"
              />
            </div>

            {/* Level (for monsters/NPCs) */}
            {(selectedCategory === 'monsters' || selectedCategory === 'npcs') && (
              <div>
                <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Level</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={objectLevel}
                  onChange={(e) => setObjectLevel(Number(e.target.value))}
                  className="w-full bg-[#0c0a09] border border-[#44403c] rounded px-2 py-1 text-[#f5f5f4] text-sm"
                />
              </div>
            )}

            {/* Scale */}
            <div>
              <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Scale</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={objectScale}
                onChange={(e) => setObjectScale(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-[#fbbf24]">{objectScale.toFixed(1)}x</span>
            </div>
            
            {/* Rotation */}
            <div>
              <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={objectRotation}
                onChange={(e) => setObjectRotation(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-[#fbbf24]">{objectRotation}°</span>
            </div>
          </div>
          
          {/* Quick Rotation Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setObjectRotation((prev) => (prev - 45 + 360) % 360)}
              className="flex-1 py-2 bg-[#1a1a1a] border border-[#44403c] text-[#fbbf24] rounded hover:bg-[#252525] transition-all"
              title="Rotate -45°"
            >
              ↺ -45°
            </button>
            <button
              onClick={() => setObjectRotation(0)}
              className="flex-1 py-2 bg-[#1a1a1a] border border-[#44403c] text-[#fbbf24] rounded hover:bg-[#252525] transition-all"
              title="Reset Rotation"
            >
              ⟲ Reset
            </button>
            <button
              onClick={() => setObjectRotation((prev) => (prev + 45) % 360)}
              className="flex-1 py-2 bg-[#1a1a1a] border border-[#44403c] text-[#fbbf24] rounded hover:bg-[#252525] transition-all"
              title="Rotate +45°"
            >
              ↻ +45°
            </button>
          </div>

          {/* Place Button */}
          <button
            onClick={handlePlace}
            className="w-full py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-cinzel font-bold rounded-lg hover:shadow-lg hover:shadow-[#22c55e]/30 transition-all flex items-center justify-center gap-2"
            data-testid="place-object-btn"
          >
            <Plus className="w-5 h-5" />
            Place {currentCategory?.types[selectedType]?.label || 'Object'}
          </button>

          {/* Delete Selected Object Button */}
          {selectedEditObject && (
            <button
              onClick={() => onDeleteObject(selectedEditObject.id)}
              className="w-full py-3 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white font-cinzel font-bold rounded-lg hover:shadow-lg hover:shadow-[#dc2626]/30 transition-all flex items-center justify-center gap-2 animate-pulse"
              data-testid="delete-selected-btn"
            >
              <Trash2 className="w-5 h-5" />
              Delete: {selectedEditObject.name || selectedEditObject.type}
            </button>
          )}

          {/* Selected Object Info */}
          {selectedEditObject && (
            <div className="bg-[#dc2626]/10 border border-[#dc2626]/50 rounded-lg p-3">
              <p className="text-xs text-[#fbbf24] font-semibold mb-1">Selected Object:</p>
              <p className="text-sm text-[#e7e5e4]">{selectedEditObject.name || selectedEditObject.type}</p>
              <p className="text-xs text-[#a8a29e]">
                Position: ({Math.round(selectedEditObject.position?.x || 0)}, {Math.round(selectedEditObject.position?.z || 0)})
              </p>
              <p className="text-xs text-[#57534e] mt-1">Press Delete key or click button above to remove</p>
            </div>
          )}

          {/* Object List Toggle */}
          <button
            onClick={() => setShowObjectList(!showObjectList)}
            className="w-full py-2 bg-[#44403c] text-[#e7e5e4] rounded flex items-center justify-center gap-2 hover:bg-[#57534e] transition-all"
            data-testid="toggle-object-list"
          >
            {showObjectList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Placed Objects ({placedObjects.length})
          </button>

          {/* Object List */}
          {showObjectList && (
            <div className="bg-[#0c0a09] border border-[#44403c] rounded p-2 max-h-40 overflow-y-auto space-y-1">
              {placedObjects.length === 0 ? (
                <p className="text-xs text-[#57534e] text-center py-2">No objects placed yet</p>
              ) : (
                placedObjects.map((obj, index) => (
                  <div 
                    key={obj.id || index}
                    className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all ${
                      selectedEditObject?.id === obj.id 
                        ? 'bg-[#fbbf24]/20 border border-[#fbbf24]' 
                        : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => onSelectEditObject(obj)}
                    data-testid={`placed-object-${obj.id || index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[#e7e5e4] truncate block">{obj.name || obj.fullType || obj.type}</span>
                      <span className="text-[#57534e]">({Math.round(obj.position?.x || 0)}, {Math.round(obj.position?.z || 0)})</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteObject(obj.id); }}
                      className="text-[#dc2626] hover:text-[#ef4444] p-1 ml-2 flex-shrink-0"
                      title="Delete this object"
                      data-testid={`delete-object-${obj.id || index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Clear All Button */}
          {placedObjects.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`Delete all ${placedObjects.length} placed objects?`)) {
                  placedObjects.forEach(obj => onDeleteObject(obj.id));
                }
              }}
              className="w-full py-2 bg-[#7f1d1d] text-[#fca5a5] rounded flex items-center justify-center gap-2 hover:bg-[#991b1b] transition-all text-sm"
              data-testid="clear-all-btn"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Objects ({placedObjects.length})
            </button>
          )}

          {/* Import/Export */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 py-2 bg-[#3b82f6] text-white rounded flex items-center justify-center gap-2 hover:bg-[#2563eb] transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <label className="flex-1 py-2 bg-[#8b5cf6] text-white rounded flex items-center justify-center gap-2 hover:bg-[#7c3aed] transition-all cursor-pointer text-sm">
              <Upload className="w-4 h-4" />
              Import
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Instructions */}
          <div className="text-[9px] text-[#57534e] space-y-0.5 border-t border-[#44403c] pt-2">
            <p>• Click <span className="text-[#22c55e]">Place</span> then click in the world</p>
            <p>• <span className="text-[#dc2626]">Delete/Backspace</span> removes selected object</p>
            <p>• Press <span className="text-[#fbbf24]">F1</span> to toggle editor</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldEditor;
