import { useState, useEffect } from 'react';
import { X, Scroll, Coins, Star, Sword, Check, Gift, CheckCircle, Trophy } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

// Empty hardcoded quests - all quests come from database now
const HARDCODED_QUESTS = {};

const QuestDialog = ({ 
  isOpen, 
  onClose, 
  npcName = 'Quest Giver',
  npcType = 'questgiver',
  npcId = null, // NPC's unique ID for quest assignment
  playerQuests = [],
  onAcceptQuest,
  onTurnInQuest,
  customQuest = null  // Custom quest assigned to this NPC via Quest Maker
}) => {
  const { fetchGlobalQuests } = useGameStore();
  
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [dialogState, setDialogState] = useState('greeting'); // greeting, quests, questDetail, turnIn, turnedIn
  const [databaseQuests, setDatabaseQuests] = useState([]);
  
  // Load global quests from database when dialog opens
  useEffect(() => {
    if (isOpen && npcType === 'questgiver') {
      fetchGlobalQuests().then(quests => {
        setDatabaseQuests(quests || []);
      });
    }
  }, [isOpen, npcType, fetchGlobalQuests]);
  
  // Reset state when dialog opens/closes or NPC changes
  useEffect(() => {
    if (isOpen) {
      setDialogState('greeting');
      setSelectedQuest(null);
    }
  }, [isOpen, npcName]);
  
  // Find quests ready to turn in (completed quests from this NPC)
  const questsToTurnIn = playerQuests.filter(quest => {
    // Check if quest is complete
    const isComplete = quest.isComplete || (quest.objectives && quest.objectives.every(obj => (obj.current || 0) >= obj.required));
    
    // Check if this NPC is the quest giver
    const isFromThisNPC = quest.giver === npcName || 
                          quest.npc_name === npcName ||
                          (customQuest && quest.quest_id === customQuest.quest_id);
    
    return isComplete && isFromThisNPC;
  });
  
  // Build the list of available quests from database
  // Only show quests that are assigned to THIS specific NPC
  console.log('QuestDialog Debug:', { npcId, npcName, databaseQuests: databaseQuests.map(q => ({ name: q.name, assigned_npc_id: q.assigned_npc_id })) });
  
  const formattedDatabaseQuests = databaseQuests
    .filter(quest => {
      const matches = quest.assigned_npc_id === npcId;
      console.log(`Quest "${quest.name}" assigned_npc_id: ${quest.assigned_npc_id}, npcId: ${npcId}, matches: ${matches}`);
      return matches;
    })
    .map(quest => ({
      id: quest.quest_id,
      quest_id: quest.quest_id,
      name: quest.name,
      giver: npcName, // Use this NPC's name
      description: quest.description,
      objectives: (quest.objectives || []).map(obj => ({
        id: obj.id,
        type: obj.type,
        description: obj.description,
        target: obj.target,
        targetId: obj.targetId,
        current: 0,
        required: obj.required || 1
      })),
      rewards: quest.rewards || { xp: 50, gold: 10 },
      difficulty: quest.difficulty || 'medium',
      level: quest.level || 1,
      isGlobal: true,
      assigned_npc_id: quest.assigned_npc_id
    }));
  
  // Combine hardcoded quests with assigned database quests
  const allStandardQuests = [
    ...Object.values(HARDCODED_QUESTS),
    ...formattedDatabaseQuests
  ].filter(quest => 
    // Filter out quests the player already has
    !playerQuests.some(pq => pq.id === quest.id || pq.quest_id === quest.id || pq.id === quest.quest_id)
  );
  
  // Convert custom quest to standard format if present and not already accepted
  const formattedCustomQuest = customQuest && !playerQuests.some(pq => 
    pq.id === customQuest.quest_id || pq.quest_id === customQuest.quest_id
  ) ? {
    id: customQuest.quest_id,
    quest_id: customQuest.quest_id,
    name: customQuest.name,
    giver: npcName,
    description: customQuest.description || 'A custom quest from this NPC.',
    objectives: (customQuest.objectives || []).map(obj => ({
      id: obj.id,
      type: obj.type,
      description: obj.description || `${obj.type}: ${obj.target}`,
      target: obj.target,
      targetId: obj.targetId,
      current: 0,
      required: obj.required || 1
    })),
    rewards: customQuest.rewards || { xp: 50, gold: 10 },
    difficulty: customQuest.difficulty || 'medium',
    level: 1,
    custom: true
  } : null;
  
  // Determine what quests are available for this NPC
  // If NPC has a specific custom quest, show only that
  // Otherwise show all standard quests from database
  const availableQuests = customQuest 
    ? (formattedCustomQuest ? [formattedCustomQuest] : [])
    : allStandardQuests;
  
  const handleAccept = () => {
    if (selectedQuest && onAcceptQuest) {
      onAcceptQuest(selectedQuest);
      setDialogState('accepted');
      setTimeout(() => {
        onClose();
        setDialogState('greeting');
        setSelectedQuest(null);
      }, 1500);
    }
  };
  
  const handleTurnIn = () => {
    if (selectedQuest && onTurnInQuest) {
      onTurnInQuest(selectedQuest);
      setDialogState('turnedIn');
      setTimeout(() => {
        onClose();
        setDialogState('greeting');
        setSelectedQuest(null);
      }, 2000);
    }
  };
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#dc2626';
      case 'epic': return '#a855f7';
      default: return '#78716c';
    }
  };
  
  if (!isOpen) return null;
  
  // Determine NPC role text
  const npcRoleText = customQuest ? 'Quest Giver' : (npcType === 'questgiver' ? 'Quest Giver' : 'NPC');
  
  // Custom greeting based on whether NPC has custom quest or quests to turn in
  const greetingText = questsToTurnIn.length > 0
    ? `"Ah, you're back! Have you completed the task I gave you?"`
    : customQuest 
      ? `"Greetings, adventurer! I have a task for you. Are you interested in helping me?"`
      : `"Greetings, adventurer! I have tasks that need completing. Are you brave enough to help our village?"`;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto" data-testid="quest-dialog">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Dialog Panel */}
      <div className="relative bg-[#1a1a1a] border-2 border-[#fbbf24] rounded-lg shadow-2xl w-[500px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#78350f] to-[#92400e] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fbbf24]/20 border-2 border-[#fbbf24] flex items-center justify-center">
              <Scroll className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg text-[#fbbf24]">{npcName}</h2>
              <p className="text-xs text-[#fcd34d]">{npcRoleText}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#fbbf24] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {dialogState === 'greeting' && (
            <div className="space-y-4">
              {/* NPC Speech */}
              <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c]">
                <p className="text-[#f5f5f4] italic">
                  {greetingText}
                </p>
              </div>
              
              {/* Dialog Options */}
              <div className="space-y-2">
                {/* Turn In Quest Option - Show first if there are completed quests */}
                {questsToTurnIn.length > 0 && (
                  <button
                    onClick={() => setDialogState('turnIn')}
                    className="w-full text-left px-4 py-3 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e] hover:border-[#22c55e] rounded transition-all flex items-center gap-3 animate-pulse"
                    data-testid="turn-in-quest-btn"
                  >
                    <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                    <span className="text-[#22c55e] font-semibold">I've completed your task!</span>
                    <span className="ml-auto bg-[#22c55e] text-[#1a1a1a] text-xs font-bold px-2 py-0.5 rounded">
                      {questsToTurnIn.length}
                    </span>
                  </button>
                )}
                
                <button
                  onClick={() => setDialogState('quests')}
                  className="w-full text-left px-4 py-3 bg-[#0c0a09] hover:bg-[#fbbf24]/10 border border-[#44403c] hover:border-[#fbbf24] rounded transition-all flex items-center gap-3"
                  data-testid="show-quests-btn"
                >
                  <Scroll className="w-5 h-5 text-[#fbbf24]" />
                  <span className="text-[#f5f5f4]">What quests do you have?</span>
                  {availableQuests.length > 0 && (
                    <span className="ml-auto bg-[#fbbf24] text-[#1a1a1a] text-xs font-bold px-2 py-0.5 rounded">
                      {availableQuests.length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full text-left px-4 py-3 bg-[#0c0a09] hover:bg-[#44403c]/50 border border-[#44403c] rounded transition-all"
                >
                  <span className="text-[#a8a29e]">Goodbye.</span>
                </button>
              </div>
            </div>
          )}
          
          {dialogState === 'quests' && (
            <div className="space-y-4">
              <button 
                onClick={() => setDialogState('greeting')}
                className="text-xs text-[#fbbf24] hover:underline flex items-center gap-1"
              >
                ← Back
              </button>
              
              {availableQuests.length === 0 ? (
                <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c] text-center">
                  <p className="text-[#78716c]">No quests available right now. Check back later!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableQuests.map(quest => (
                    <button
                      key={quest.id || quest.quest_id}
                      onClick={() => {
                        setSelectedQuest(quest);
                        setDialogState('questDetail');
                      }}
                      className="w-full text-left p-3 bg-[#0c0a09] hover:bg-[#fbbf24]/10 border border-[#44403c] hover:border-[#fbbf24] rounded transition-all"
                      data-testid={`quest-option-${quest.id || quest.quest_id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-cinzel text-[#fbbf24]">{quest.name}</p>
                          <p className="text-xs text-[#a8a29e] mt-1 line-clamp-2">{quest.description}</p>
                          {/* Show rewards preview */}
                          <div className="flex items-center gap-3 mt-2">
                            {quest.rewards?.xp > 0 && (
                              <span className="text-xs text-[#a855f7]">+{quest.rewards.xp} XP</span>
                            )}
                            {quest.rewards?.gold > 0 && (
                              <span className="text-xs text-[#fbbf24]">+{quest.rewards.gold} Gold</span>
                            )}
                          </div>
                        </div>
                        <span 
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded ml-2"
                          style={{ 
                            backgroundColor: `${getDifficultyColor(quest.difficulty)}20`,
                            color: getDifficultyColor(quest.difficulty)
                          }}
                        >
                          {quest.difficulty || 'medium'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {dialogState === 'questDetail' && selectedQuest && (
            <div className="space-y-4">
              <button 
                onClick={() => setDialogState('quests')}
                className="text-xs text-[#fbbf24] hover:underline flex items-center gap-1"
              >
                ← Back to quests
              </button>
              
              {/* Quest Header */}
              <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-cinzel text-xl text-[#fbbf24]">{selectedQuest.name}</h3>
                  <span 
                    className="text-xs font-bold uppercase px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: `${getDifficultyColor(selectedQuest.difficulty)}20`,
                      color: getDifficultyColor(selectedQuest.difficulty)
                    }}
                  >
                    {selectedQuest.difficulty}
                  </span>
                </div>
                <p className="text-sm text-[#a8a29e] italic">"{selectedQuest.description}"</p>
              </div>
              
              {/* Objectives */}
              <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c]">
                <h4 className="text-xs text-[#78716c] uppercase tracking-wider mb-2">Objectives</h4>
                <div className="space-y-2">
                  {selectedQuest.objectives.map(obj => (
                    <div key={obj.id} className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded border border-[#44403c] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-sm bg-[#44403c]" />
                      </div>
                      <span className="text-[#f5f5f4]">{obj.description}</span>
                      <span className="text-[#78716c] ml-auto">0/{obj.required}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Rewards */}
              <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c]">
                <h4 className="text-xs text-[#78716c] uppercase tracking-wider mb-2">Rewards</h4>
                <div className="flex items-center gap-4">
                  {selectedQuest.rewards?.xp > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#a855f7]" />
                      <span className="text-sm text-[#a855f7]">+{selectedQuest.rewards.xp} XP</span>
                    </div>
                  )}
                  {selectedQuest.rewards?.gold > 0 && (
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-[#fbbf24]" />
                      <span className="text-sm text-[#fbbf24]">+{selectedQuest.rewards.gold} Gold</span>
                    </div>
                  )}
                  {(!selectedQuest.rewards?.xp && !selectedQuest.rewards?.gold) && (
                    <span className="text-sm text-[#78716c]">No rewards specified</span>
                  )}
                </div>
              </div>
              
              {/* Accept Button */}
              <button
                onClick={handleAccept}
                className="w-full py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1a1a1a] font-bold rounded flex items-center justify-center gap-2 transition-all"
                data-testid="accept-quest-btn"
              >
                <Sword className="w-5 h-5" />
                Accept Quest
              </button>
            </div>
          )}
          
          {dialogState === 'accepted' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#22c55e]/20 border-2 border-[#22c55e] flex items-center justify-center">
                <Check className="w-8 h-8 text-[#22c55e]" />
              </div>
              <h3 className="font-cinzel text-xl text-[#22c55e] mb-2">Quest Accepted!</h3>
              <p className="text-sm text-[#a8a29e]">Good luck, adventurer!</p>
            </div>
          )}
          
          {/* Turn In Quest Selection */}
          {dialogState === 'turnIn' && (
            <div className="space-y-4">
              <button 
                onClick={() => setDialogState('greeting')}
                className="text-xs text-[#fbbf24] hover:underline flex items-center gap-1"
              >
                ← Back
              </button>
              
              <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c]">
                <p className="text-[#f5f5f4] italic">
                  "Excellent work! Which task have you completed?"
                </p>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {questsToTurnIn.map(quest => (
                  <button
                    key={quest.id || quest.quest_id}
                    onClick={() => {
                      setSelectedQuest(quest);
                      setDialogState('turnInDetail');
                    }}
                    className="w-full text-left p-3 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/50 hover:border-[#22c55e] rounded transition-all"
                    data-testid={`turnin-quest-${quest.id || quest.quest_id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                        <div>
                          <p className="font-cinzel text-[#22c55e]">{quest.name}</p>
                          <p className="text-xs text-[#a8a29e] mt-1">Ready to turn in!</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(quest.rewards?.xp > 0 || quest.xp > 0) && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#a855f7]" />
                            <span className="text-xs text-[#a855f7]">+{quest.rewards?.xp || quest.xp}</span>
                          </div>
                        )}
                        {(quest.rewards?.gold > 0 || quest.gold > 0) && (
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-[#fbbf24]" />
                            <span className="text-xs text-[#fbbf24]">+{quest.rewards?.gold || quest.gold}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Turn In Quest Detail */}
          {dialogState === 'turnInDetail' && selectedQuest && (
            <div className="space-y-4">
              <button 
                onClick={() => setDialogState('turnIn')}
                className="text-xs text-[#fbbf24] hover:underline flex items-center gap-1"
              >
                ← Back
              </button>
              
              {/* Quest Complete Header */}
              <div className="bg-[#22c55e]/10 rounded-lg p-4 border border-[#22c55e]/50">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-6 h-6 text-[#22c55e]" />
                  <h3 className="font-cinzel text-xl text-[#22c55e]">{selectedQuest.name}</h3>
                </div>
                <p className="text-sm text-[#a8a29e]">Quest Complete!</p>
              </div>
              
              {/* NPC Thank You Message */}
              <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c]">
                <p className="text-[#f5f5f4] italic">
                  "Wonderful work, adventurer! You've exceeded my expectations. Please accept these rewards for your efforts."
                </p>
              </div>
              
              {/* Completed Objectives */}
              <div className="bg-[#0c0a09] rounded-lg p-4 border border-[#44403c]">
                <h4 className="text-xs text-[#78716c] uppercase tracking-wider mb-2">Completed Objectives</h4>
                <div className="space-y-2">
                  {selectedQuest.objectives?.map(obj => (
                    <div key={obj.id} className="flex items-center gap-2 text-sm text-[#22c55e]">
                      <CheckCircle className="w-4 h-4" />
                      <span className="line-through">{obj.description}</span>
                      <span className="ml-auto">{obj.current || obj.required}/{obj.required}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Rewards to Receive */}
              <div className="bg-[#fbbf24]/10 rounded-lg p-4 border border-[#fbbf24]/50">
                <h4 className="text-xs text-[#fbbf24] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Rewards
                </h4>
                <div className="flex items-center gap-6">
                  {(selectedQuest.rewards?.xp > 0 || selectedQuest.xp > 0) && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-[#a855f7]" />
                      <span className="text-lg font-bold text-[#a855f7]">+{selectedQuest.rewards?.xp || selectedQuest.xp} XP</span>
                    </div>
                  )}
                  {(selectedQuest.rewards?.gold > 0 || selectedQuest.gold > 0) && (
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-[#fbbf24]" />
                      <span className="text-lg font-bold text-[#fbbf24]">+{selectedQuest.rewards?.gold || selectedQuest.gold} Gold</span>
                    </div>
                  )}
                  {(!selectedQuest.rewards?.xp && !selectedQuest.xp && !selectedQuest.rewards?.gold && !selectedQuest.gold) && (
                    <span className="text-[#78716c]">No rewards specified</span>
                  )}
                </div>
              </div>
              
              {/* Turn In Button */}
              <button
                onClick={handleTurnIn}
                className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded flex items-center justify-center gap-2 transition-all"
                data-testid="complete-quest-btn"
              >
                <Trophy className="w-5 h-5" />
                Complete Quest
              </button>
            </div>
          )}
          
          {/* Quest Turned In Success */}
          {dialogState === 'turnedIn' && selectedQuest && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#fbbf24]/20 border-2 border-[#fbbf24] flex items-center justify-center animate-bounce">
                <Trophy className="w-10 h-10 text-[#fbbf24]" />
              </div>
              <h3 className="font-cinzel text-2xl text-[#fbbf24] mb-2">Quest Complete!</h3>
              <div className="space-y-2 mt-4">
                {(selectedQuest.rewards?.xp > 0 || selectedQuest.xp > 0) && (
                  <p className="text-[#a855f7] text-lg">+{selectedQuest.rewards?.xp || selectedQuest.xp} Experience</p>
                )}
                {(selectedQuest.rewards?.gold > 0 || selectedQuest.gold > 0) && (
                  <p className="text-[#fbbf24] text-lg">+{selectedQuest.rewards?.gold || selectedQuest.gold} Gold</p>
                )}
              </div>
              <p className="text-sm text-[#a8a29e] mt-4">Thank you for your service, hero!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestDialog;
export { HARDCODED_QUESTS as AVAILABLE_QUESTS };
