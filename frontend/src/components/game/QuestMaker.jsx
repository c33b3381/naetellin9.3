import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Target, Gift, Scroll, User, Check } from 'lucide-react';

const QuestMaker = ({ 
  isOpen, 
  onClose, 
  onSaveQuest,
  onAssignQuest,
  onRemoveQuest,
  existingQuests = [],
  selectedNPC = null
}) => {
  const [questName, setQuestName] = useState('');
  const [questDescription, setQuestDescription] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [objectives, setObjectives] = useState([]);
  const [rewards, setRewards] = useState({
    gold: 0,
    xp: 0,
    items: []
  });
  const [selectedQuestForAssignment, setSelectedQuestForAssignment] = useState(null);
  const [justCreatedQuest, setJustCreatedQuest] = useState(null);
  
  // Reset selection when NPC changes
  useEffect(() => {
    setSelectedQuestForAssignment(null);
  }, [selectedNPC]);
  
  // Objective types
  const objectiveTypes = [
    { id: 'kill', label: 'Kill Enemies', icon: '⚔️' },
    { id: 'collect', label: 'Collect Items', icon: '📦' },
    { id: 'talk', label: 'Talk to NPC', icon: '💬' },
    { id: 'explore', label: 'Visit Location', icon: '🗺️' }
  ];
  
  const addObjective = () => {
    setObjectives([...objectives, {
      id: `obj_${Date.now()}`,
      type: 'kill',
      description: '',
      target: '',
      required: 1,
      current: 0
    }]);
  };
  
  const removeObjective = (id) => {
    setObjectives(objectives.filter(obj => obj.id !== id));
  };
  
  const updateObjective = (id, field, value) => {
    setObjectives(objectives.map(obj => 
      obj.id === id ? { ...obj, [field]: value } : obj
    ));
  };
  
  const handleSave = () => {
    if (!questName.trim()) {
      alert('Please enter a quest name');
      return;
    }
    
    if (objectives.length === 0) {
      alert('Please add at least one objective');
      return;
    }
    
    const quest = {
      quest_id: `custom_${Date.now()}`,
      name: questName,
      description: questDescription,
      difficulty: difficulty,
      objectives: objectives.map(obj => ({
        id: obj.id,
        type: obj.type,
        description: obj.description,
        target: obj.target,
        required: obj.required
      })),
      rewards: {
        gold: rewards.gold,
        xp: rewards.xp,
        items: rewards.items
      },
      custom: true,
      npc_id: null // Will be assigned when attached to NPC
    };
    
    onSaveQuest(quest);
    
    // Store the just-created quest for assignment
    setJustCreatedQuest(quest);
    
    // Reset form
    setQuestName('');
    setQuestDescription('');
    setDifficulty('easy');
    setObjectives([]);
    setRewards({ gold: 0, xp: 0, items: [] });
  };
  
  const handleAssignJustCreated = () => {
    if (justCreatedQuest && selectedNPC && onAssignQuest) {
      onAssignQuest(justCreatedQuest.quest_id, selectedNPC);
      setJustCreatedQuest(null);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Quest Maker Panel */}
      <div className="relative bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg shadow-2xl w-[700px] max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scroll className="w-6 h-6 text-[#c4b5fd]" />
            <h2 className="font-cinzel text-xl text-white">Quest Maker</h2>
          </div>
          <button onClick={onClose} className="text-[#c4b5fd] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Selected NPC Info */}
          {selectedNPC && (
            <div className="bg-[#0c0a09] border-2 border-[#22c55e] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#22c55e]" />
                  <span className="text-white font-bold">Selected NPC</span>
                </div>
                {selectedNPC.quest_id && (
                  <span className="text-xs bg-[#3b82f6] text-white px-2 py-1 rounded">Has Quest</span>
                )}
              </div>
              <div className="text-[#a8a29e] text-sm">
                <p><span className="text-[#22c55e]">Name:</span> {selectedNPC.name}</p>
                <p><span className="text-[#22c55e]">Type:</span> {selectedNPC.type}</p>
                <p><span className="text-[#22c55e]">Position:</span> ({selectedNPC.position?.x?.toFixed(1)}, {selectedNPC.position?.z?.toFixed(1)})</p>
                {selectedNPC.quest_id && (
                  <p><span className="text-[#22c55e]">Current Quest:</span> {selectedNPC.quest_name || 'Unknown Quest'}</p>
                )}
              </div>
            </div>
          )}
          
          {!selectedNPC && (
            <div className="bg-[#422006] border border-[#fbbf24] rounded-lg p-3 text-center">
              <p className="text-[#fbbf24] text-sm">
                No NPC selected. Use F1 to spawn an NPC, then click on it to select it.
              </p>
            </div>
          )}
          
          {/* Quest Name */}
          <div>
            <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Quest Name *</label>
            <input
              type="text"
              value={questName}
              onChange={(e) => setQuestName(e.target.value)}
              placeholder="Enter quest name..."
              className="w-full p-2 bg-[#0c0a09] border border-[#44403c] rounded text-white focus:border-[#8b5cf6] outline-none"
            />
          </div>
          
          {/* Quest Description */}
          <div>
            <label className="text-xs text-[#a8a29e] font-rajdhani block mb-1">Description</label>
            <textarea
              value={questDescription}
              onChange={(e) => setQuestDescription(e.target.value)}
              placeholder="Enter quest description..."
              rows={3}
              className="w-full p-2 bg-[#0c0a09] border border-[#44403c] rounded text-white focus:border-[#8b5cf6] outline-none resize-none"
            />
          </div>
          
          {/* Difficulty */}
          <div>
            <label className="text-xs text-[#a8a29e] font-rajdhani block mb-2">Difficulty</label>
            <div className="flex gap-2">
              {['easy', 'medium', 'hard', 'epic'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 py-2 rounded border transition-all ${
                    difficulty === diff
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-[#c4b5fd]'
                      : 'border-[#44403c] text-[#78716c] hover:border-[#8b5cf6]'
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Objectives */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#a8a29e] font-rajdhani">Objectives *</label>
              <button
                onClick={addObjective}
                className="flex items-center gap-1 px-3 py-1 bg-[#8b5cf6] text-white rounded text-xs hover:bg-[#7c3aed] transition-all"
              >
                <Plus className="w-3 h-3" />
                Add Objective
              </button>
            </div>
            
            <div className="space-y-3">
              {objectives.length === 0 ? (
                <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c] text-center text-[#78716c] text-sm">
                  No objectives yet. Click "Add Objective" to start.
                </div>
              ) : (
                objectives.map((obj, index) => (
                  <div key={obj.id} className="bg-[#0c0a09] rounded-lg p-3 border border-[#44403c]">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[#8b5cf6] text-xs font-bold">Objective {index + 1}</span>
                      <button
                        onClick={() => removeObjective(obj.id)}
                        className="text-[#dc2626] hover:text-[#ef4444] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Objective Type */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {objectiveTypes.map(type => (
                        <button
                          key={type.id}
                          onClick={() => updateObjective(obj.id, 'type', type.id)}
                          className={`p-2 rounded border text-xs transition-all ${
                            obj.type === type.id
                              ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-white'
                              : 'border-[#44403c] text-[#78716c] hover:border-[#8b5cf6]'
                          }`}
                        >
                          <div>{type.icon}</div>
                          <div className="text-[10px]">{type.label}</div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Description */}
                    <input
                      type="text"
                      value={obj.description}
                      onChange={(e) => updateObjective(obj.id, 'description', e.target.value)}
                      placeholder="Objective description..."
                      className="w-full p-2 mb-2 bg-[#1a1a1a] border border-[#44403c] rounded text-white text-sm focus:border-[#8b5cf6] outline-none"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Target */}
                      <input
                        type="text"
                        value={obj.target}
                        onChange={(e) => updateObjective(obj.id, 'target', e.target.value)}
                        placeholder={obj.type === 'kill' ? 'Enemy name' : obj.type === 'collect' ? 'Item name' : obj.type === 'talk' ? 'NPC name' : 'Location name'}
                        className="p-2 bg-[#1a1a1a] border border-[#44403c] rounded text-white text-sm focus:border-[#8b5cf6] outline-none"
                      />
                      
                      {/* Required */}
                      <input
                        type="number"
                        value={obj.required}
                        onChange={(e) => updateObjective(obj.id, 'required', parseInt(e.target.value) || 1)}
                        min="1"
                        placeholder="Required"
                        className="p-2 bg-[#1a1a1a] border border-[#44403c] rounded text-white text-sm focus:border-[#8b5cf6] outline-none"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Rewards */}
          <div>
            <label className="text-xs text-[#a8a29e] font-rajdhani block mb-2 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Rewards
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Gold Reward */}
              <div>
                <label className="text-xs text-[#78716c] block mb-1">Gold</label>
                <input
                  type="number"
                  value={rewards.gold}
                  onChange={(e) => setRewards({ ...rewards, gold: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full p-2 bg-[#0c0a09] border border-[#44403c] rounded text-white text-sm focus:border-[#8b5cf6] outline-none"
                />
              </div>
              
              {/* XP Reward */}
              <div>
                <label className="text-xs text-[#78716c] block mb-1">Experience</label>
                <input
                  type="number"
                  value={rewards.xp}
                  onChange={(e) => setRewards({ ...rewards, xp: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full p-2 bg-[#0c0a09] border border-[#44403c] rounded text-white text-sm focus:border-[#8b5cf6] outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Existing Quests & Assignment */}
          {existingQuests.length > 0 && (
            <div>
              <label className="text-xs text-[#a8a29e] font-rajdhani block mb-2">
                Your Created Quests ({existingQuests.length})
                {selectedNPC && <span className="text-[#22c55e]"> - Click to assign to selected NPC</span>}
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {existingQuests.map(quest => (
                  <div 
                    key={quest.quest_id} 
                    className={`bg-[#0c0a09] rounded p-3 border transition-all ${
                      selectedQuestForAssignment === quest.quest_id
                        ? 'border-[#8b5cf6] bg-[#8b5cf6]/10'
                        : quest.npc_id
                        ? 'border-[#22c55e]'
                        : 'border-[#44403c] hover:border-[#8b5cf6] cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!quest.npc_id && selectedNPC) {
                        setSelectedQuestForAssignment(quest.quest_id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-white text-sm font-bold">{quest.name}</div>
                        <div className="text-[#78716c] text-xs mt-1">
                          {quest.objectives?.length || 0} objectives • {quest.difficulty}
                        </div>
                        {quest.npc_id && (
                          <div className="text-[#22c55e] text-xs mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Assigned to: {quest.npc_name || 'NPC'}
                          </div>
                        )}
                      </div>
                      {quest.npc_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRemoveQuest) {
                              onRemoveQuest(quest.quest_id, quest.npc_id);
                            }
                          }}
                          className="ml-2 p-1 text-[#dc2626] hover:text-[#ef4444] transition-colors"
                          title="Remove quest from NPC"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Assign Button */}
              {selectedNPC && selectedQuestForAssignment && (
                <button
                  onClick={() => {
                    const quest = existingQuests.find(q => q.quest_id === selectedQuestForAssignment);
                    if (quest && onAssignQuest) {
                      onAssignQuest(selectedQuestForAssignment, selectedNPC);
                      setSelectedQuestForAssignment(null);
                    }
                  }}
                  className="w-full mt-3 py-2 bg-[#22c55e] text-white rounded hover:bg-[#16a34a] transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Assign Selected Quest to {selectedNPC.name}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-[#0c0a09] px-6 py-4 border-t border-[#44403c]">
          {/* Assign Just Created Quest Button */}
          {justCreatedQuest && selectedNPC && (
            <div className="mb-4 p-3 bg-[#22c55e]/10 border border-[#22c55e] rounded-lg">
              <div className="text-[#22c55e] text-sm font-bold mb-2">
                Quest "{justCreatedQuest.name}" created successfully!
              </div>
              <button
                onClick={handleAssignJustCreated}
                className="w-full py-2 bg-[#22c55e] text-white rounded hover:bg-[#16a34a] transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Assign to {selectedNPC.name}
              </button>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#44403c] text-white rounded hover:bg-[#57534e] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#8b5cf6] text-white rounded hover:bg-[#7c3aed] transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Quest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestMaker;
