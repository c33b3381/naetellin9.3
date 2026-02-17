import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Save, Target, Gift, Scroll, User, Check, ChevronDown, Database, Globe, Edit, UserPlus, UserMinus } from 'lucide-react';
import { ENEMY_DATABASE } from './EnemyEditor';
import { useGameStore } from '../../store/gameStore';

const QuestMaker = ({ 
  isOpen, 
  onClose, 
  onSaveQuest,
  onAssignQuest,
  onRemoveQuest,
  existingQuests = [],
  selectedNPC = null,
  placedEnemies = [],
  placedNPCs = [] // List of all NPCs in the world for assignment
}) => {
  const { createGlobalQuest, fetchGlobalQuests, deleteGlobalQuest, assignGlobalQuestToNPC, unassignGlobalQuest } = useGameStore();
  
  const [questName, setQuestName] = useState('');
  const [questDescription, setQuestDescription] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [objectives, setObjectives] = useState([]);
  const [rewards, setRewards] = useState({ gold: 0, xp: 0, items: [] });
  const [selectedQuestForAssignment, setSelectedQuestForAssignment] = useState(null);
  const [justCreatedQuest, setJustCreatedQuest] = useState(null);
  
  // Global quest database state
  const [globalQuests, setGlobalQuests] = useState([]);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'database'
  const [editingQuest, setEditingQuest] = useState(null);
  const [assigningQuest, setAssigningQuest] = useState(null); // Quest being assigned to NPC
  
  // Load global quests on mount
  useEffect(() => {
    if (isOpen) {
      fetchGlobalQuests().then(quests => {
        setGlobalQuests(quests || []);
      });
    }
  }, [isOpen, fetchGlobalQuests]);
  
  // Build enemy types list
  const availableEnemyTypes = useMemo(() => {
    const placedTypes = {};
    placedEnemies.forEach(enemy => {
      const key = enemy.customName || enemy.name || enemy.type;
      if (!placedTypes[key]) {
        placedTypes[key] = {
          id: enemy.type,
          customName: enemy.customName,
          name: enemy.customName || enemy.name || enemy.type,
          count: 1,
          isPlaced: true
        };
      } else {
        placedTypes[key].count++;
      }
    });
    
    const databaseTypes = [];
    Object.entries(ENEMY_DATABASE).forEach(([tierKey, tier]) => {
      Object.entries(tier.enemies).forEach(([enemyKey, enemy]) => {
        databaseTypes.push({
          id: enemyKey,
          name: enemy.label,
          tier: tier.label,
          isDatabase: true
        });
      });
    });
    
    return { placed: Object.values(placedTypes), database: databaseTypes };
  }, [placedEnemies]);
  
  useEffect(() => {
    setSelectedQuestForAssignment(null);
  }, [selectedNPC]);
  
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
      targetId: '',
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
  
  const handleEnemySelect = (objId, enemyName, enemyId) => {
    updateObjective(objId, 'target', enemyName);
    updateObjective(objId, 'targetId', enemyId);
  };
  
  // Save to Global Quest Database
  const handleSaveToDatabase = async () => {
    if (!questName.trim()) {
      alert('Please enter a quest name');
      return;
    }
    if (objectives.length === 0) {
      alert('Please add at least one objective');
      return;
    }
    
    const quest = {
      name: questName,
      description: questDescription,
      difficulty: difficulty,
      giver: 'Quest Giver',
      objectives: objectives.map(obj => ({
        id: obj.id,
        type: obj.type,
        description: obj.description || `${obj.type === 'kill' ? 'Kill' : obj.type} ${obj.target}`,
        target: obj.target,
        targetId: obj.targetId,
        required: obj.required,
        current: 0
      })),
      rewards: { gold: rewards.gold, xp: rewards.xp, items: rewards.items },
      level: 1
    };
    
    try {
      const savedQuest = await createGlobalQuest(quest);
      setGlobalQuests(prev => [...prev, savedQuest]);
      
      // Reset form
      setQuestName('');
      setQuestDescription('');
      setDifficulty('easy');
      setObjectives([]);
      setRewards({ gold: 0, xp: 0, items: [] });
      
      // Switch to database tab to show the saved quest
      setActiveTab('database');
    } catch (err) {
      console.error('Failed to save quest:', err);
    }
  };
  
  // Load quest into editor for editing
  const handleEditQuest = (quest) => {
    setQuestName(quest.name);
    setQuestDescription(quest.description || '');
    setDifficulty(quest.difficulty || 'easy');
    setObjectives(quest.objectives || []);
    setRewards(quest.rewards || { gold: 0, xp: 0, items: [] });
    setEditingQuest(quest);
    setActiveTab('create');
  };
  
  // Assign quest to NPC
  const handleAssignToNPC = async (quest, npc) => {
    try {
      await assignGlobalQuestToNPC(quest.quest_id, npc.id, npc.name || npc.customName || 'Quest Giver');
      // Update local state
      setGlobalQuests(prev => prev.map(q => 
        q.quest_id === quest.quest_id 
          ? { ...q, assigned_npc_id: npc.id, assigned_npc_name: npc.name || npc.customName || 'Quest Giver' }
          : q
      ));
      setAssigningQuest(null);
    } catch (err) {
      console.error('Failed to assign quest:', err);
    }
  };
  
  // Unassign quest from NPC
  const handleUnassignQuest = async (quest) => {
    try {
      await unassignGlobalQuest(quest.quest_id);
      // Update local state
      setGlobalQuests(prev => prev.map(q => 
        q.quest_id === quest.quest_id 
          ? { ...q, assigned_npc_id: null, assigned_npc_name: null }
          : q
      ));
    } catch (err) {
      console.error('Failed to unassign quest:', err);
    }
  };
  
  // Delete quest from database
  const handleDeleteQuest = async (questId) => {
    if (confirm('Are you sure you want to delete this quest from the database?')) {
      try {
        await deleteGlobalQuest(questId);
        setGlobalQuests(prev => prev.filter(q => q.quest_id !== questId));
      } catch (err) {
        console.error('Failed to delete quest:', err);
      }
    }
  };
  
  // Save to personal quests (old behavior)
  const handleSavePersonal = () => {
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
        targetId: obj.targetId,
        required: obj.required
      })),
      rewards: { gold: rewards.gold, xp: rewards.xp, items: rewards.items },
      custom: true,
      npc_id: null
    };
    
    onSaveQuest(quest);
    setJustCreatedQuest(quest);
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div className="relative bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg shadow-2xl w-[800px] max-h-[90vh] overflow-hidden">
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
        
        {/* Tabs */}
        <div className="flex border-b border-[#44403c]">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-[#8b5cf6]/20 text-[#c4b5fd] border-b-2 border-[#8b5cf6]'
                : 'text-[#78716c] hover:text-white hover:bg-[#44403c]/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create Quest
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'database'
                ? 'bg-[#8b5cf6]/20 text-[#c4b5fd] border-b-2 border-[#8b5cf6]'
                : 'text-[#78716c] hover:text-white hover:bg-[#44403c]/30'
            }`}
          >
            <Database className="w-4 h-4" />
            Quest Database ({globalQuests.length})
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* Editing indicator */}
              {editingQuest && (
                <div className="bg-[#fbbf24]/10 border border-[#fbbf24] rounded-lg p-3 flex items-center justify-between">
                  <span className="text-[#fbbf24] text-sm">Editing: {editingQuest.name}</span>
                  <button
                    onClick={() => {
                      setEditingQuest(null);
                      setQuestName('');
                      setQuestDescription('');
                      setDifficulty('easy');
                      setObjectives([]);
                      setRewards({ gold: 0, xp: 0, items: [] });
                    }}
                    className="text-[#fbbf24] hover:text-white text-xs"
                  >
                    Cancel Edit
                  </button>
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
                          <button onClick={() => removeObjective(obj.id)} className="text-[#dc2626] hover:text-[#ef4444]">
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
                        
                        {/* Kill Enemy Selector */}
                        {obj.type === 'kill' && (
                          <div className="mb-2">
                            <label className="text-xs text-[#78716c] block mb-1">Select Enemy Type</label>
                            
                            {availableEnemyTypes.placed.length > 0 && (
                              <div className="mb-2">
                                <div className="text-[10px] text-[#22c55e] mb-1 flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Spawned in World
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {availableEnemyTypes.placed.map((enemy, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleEnemySelect(obj.id, enemy.name, enemy.id)}
                                      className={`px-2 py-1 rounded text-xs border transition-all ${
                                        obj.target === enemy.name
                                          ? 'border-[#22c55e] bg-[#22c55e]/20 text-[#22c55e]'
                                          : 'border-[#44403c] text-[#a8a29e] hover:border-[#22c55e]'
                                      }`}
                                    >
                                      {enemy.name} ({enemy.count})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <details className="group">
                              <summary className="text-[10px] text-[#78716c] cursor-pointer hover:text-white flex items-center gap-1 mb-1">
                                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                                All Enemy Types
                              </summary>
                              <div className="ml-2 mt-1 space-y-2 max-h-32 overflow-y-auto">
                                {Object.entries(ENEMY_DATABASE).map(([tierKey, tier]) => (
                                  <div key={tierKey}>
                                    <div className="text-[9px] text-[#57534e] mb-1">{tier.label}</div>
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(tier.enemies).map(([enemyKey, enemy]) => (
                                        <button
                                          key={enemyKey}
                                          onClick={() => handleEnemySelect(obj.id, enemy.label, enemyKey)}
                                          className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                                            obj.target === enemy.label
                                              ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-[#c4b5fd]'
                                              : 'border-[#44403c] text-[#78716c] hover:border-[#8b5cf6]'
                                          }`}
                                        >
                                          {enemy.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                            
                            <div className="mt-2">
                              <input
                                type="text"
                                value={obj.target}
                                onChange={(e) => updateObjective(obj.id, 'target', e.target.value)}
                                placeholder="Or type custom enemy name..."
                                className="w-full p-2 bg-[#1a1a1a] border border-[#44403c] rounded text-white text-sm focus:border-[#8b5cf6] outline-none"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Description */}
                        <input
                          type="text"
                          value={obj.description}
                          onChange={(e) => updateObjective(obj.id, 'description', e.target.value)}
                          placeholder={obj.type === 'kill' ? `e.g., Slay the ${obj.target || 'enemies'}` : "Objective description..."}
                          className="w-full p-2 mb-2 bg-[#1a1a1a] border border-[#44403c] rounded text-white text-sm focus:border-[#8b5cf6] outline-none"
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          {obj.type !== 'kill' && (
                            <input
                              type="text"
                              value={obj.target}
                              onChange={(e) => updateObjective(obj.id, 'target', e.target.value)}
                              placeholder={obj.type === 'collect' ? 'Item name' : obj.type === 'talk' ? 'NPC name' : 'Location'}
                              className="p-2 bg-[#1a1a1a] border border-[#44403c] rounded text-white text-sm focus:border-[#8b5cf6] outline-none"
                            />
                          )}
                          <div className={obj.type === 'kill' ? 'col-span-2' : ''}>
                            <label className="text-[10px] text-[#78716c] block mb-1">
                              {obj.type === 'kill' ? 'Kill Count' : 'Required'}
                            </label>
                            <input
                              type="number"
                              value={obj.required}
                              onChange={(e) => updateObjective(obj.id, 'required', parseInt(e.target.value) || 1)}
                              min="1"
                              className="w-full p-2 bg-[#1a1a1a] border border-[#44403c] rounded text-white text-sm focus:border-[#8b5cf6] outline-none"
                            />
                          </div>
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
                  <div>
                    <label className="text-xs text-[#78716c] block mb-1">Experience (XP)</label>
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
            </div>
          )}
          
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c]">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-[#22c55e]" />
                  <span className="text-white font-bold">Global Quest Database</span>
                </div>
                <p className="text-[#78716c] text-sm">
                  Quests saved here can be assigned to any Quest Giver NPC. All players will see the quest!
                </p>
              </div>
              
              {globalQuests.length === 0 ? (
                <div className="bg-[#0c0a09] rounded-lg p-8 border border-[#44403c] text-center">
                  <Database className="w-12 h-12 mx-auto mb-3 text-[#44403c]" />
                  <p className="text-[#78716c]">No quests in database yet.</p>
                  <p className="text-[#57534e] text-sm mt-1">Create a quest and save it to the database!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {globalQuests.map(quest => (
                    <div key={quest.quest_id} className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c] hover:border-[#8b5cf6] transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white font-bold">{quest.name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded ${
                              quest.difficulty === 'easy' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                              quest.difficulty === 'medium' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                              quest.difficulty === 'hard' ? 'bg-[#dc2626]/20 text-[#dc2626]' :
                              'bg-[#a855f7]/20 text-[#a855f7]'
                            }`}>
                              {quest.difficulty}
                            </span>
                            {quest.assigned_npc_id ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {quest.assigned_npc_name || 'Assigned'}
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#dc2626]/20 text-[#dc2626]">
                                Not Assigned
                              </span>
                            )}
                          </div>
                          <p className="text-[#78716c] text-sm mt-1">{quest.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-[#a8a29e]">
                              {quest.objectives?.length || 0} objective(s)
                            </span>
                            {quest.rewards?.xp > 0 && (
                              <span className="text-[#a855f7]">+{quest.rewards.xp} XP</span>
                            )}
                            {quest.rewards?.gold > 0 && (
                              <span className="text-[#fbbf24]">+{quest.rewards.gold} Gold</span>
                            )}
                          </div>
                          
                          {/* NPC Assignment UI */}
                          {assigningQuest?.quest_id === quest.quest_id && (
                            <div className="mt-3 p-3 bg-[#1a1a1a] rounded border border-[#8b5cf6]">
                              <div className="text-xs text-[#c4b5fd] mb-2 flex items-center gap-1">
                                <UserPlus className="w-3 h-3" />
                                Select an NPC to assign this quest:
                              </div>
                              {placedNPCs.length === 0 ? (
                                <p className="text-[#78716c] text-xs">No NPCs placed in the world. Use F1 World Builder to place NPCs first.</p>
                              ) : (
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                  {placedNPCs.map((npc, idx) => (
                                    <button
                                      key={npc.id || idx}
                                      onClick={() => handleAssignToNPC(quest, npc)}
                                      className="px-3 py-1.5 bg-[#0c0a09] border border-[#44403c] hover:border-[#22c55e] hover:bg-[#22c55e]/10 rounded text-xs text-white transition-all"
                                    >
                                      {npc.customName || npc.name || 'NPC'}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => setAssigningQuest(null)}
                                className="mt-2 text-xs text-[#78716c] hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {quest.assigned_npc_id ? (
                            <button
                              onClick={() => handleUnassignQuest(quest)}
                              className="p-2 text-[#78716c] hover:text-[#f59e0b] transition-colors"
                              title="Unassign from NPC"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setAssigningQuest(quest)}
                              className="p-2 text-[#78716c] hover:text-[#22c55e] transition-colors"
                              title="Assign to NPC"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditQuest(quest)}
                            className="p-2 text-[#78716c] hover:text-[#8b5cf6] transition-colors"
                            title="Edit Quest"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuest(quest.quest_id)}
                            className="p-2 text-[#78716c] hover:text-[#dc2626] transition-colors"
                            title="Delete Quest"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-[#0c0a09] px-6 py-4 border-t border-[#44403c]">
          {activeTab === 'create' && (
            <div className="flex justify-between gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#44403c] text-white rounded hover:bg-[#57534e] transition-all"
              >
                Close
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveToDatabase}
                  className="px-4 py-2 bg-[#22c55e] text-white rounded hover:bg-[#16a34a] transition-all flex items-center gap-2"
                  title="Save to global database - available to all players"
                >
                  <Database className="w-4 h-4" />
                  Save to Database
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'database' && (
            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#44403c] text-white rounded hover:bg-[#57534e] transition-all"
              >
                Close
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-[#8b5cf6] text-white rounded hover:bg-[#7c3aed] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Quest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestMaker;
