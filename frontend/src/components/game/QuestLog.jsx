import { X, Scroll, Coins, Star, CheckCircle, Circle, MapPin, Trash2 } from 'lucide-react';

const QuestLog = ({ 
  isOpen, 
  onClose, 
  activeQuests = [],
  completedQuests = [],
  onAbandonQuest,
  onTrackQuest,
  trackedQuestId
}) => {
  
  // Get quest ID (handles both id and quest_id)
  const getQuestId = (quest) => quest.id || quest.quest_id;
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#dc2626';
      case 'epic': return '#a855f7';
      default: return '#78716c';
    }
  };
  
  const getProgressPercent = (quest) => {
    if (!quest.objectives || quest.objectives.length === 0) return 0;
    const total = quest.objectives.reduce((sum, obj) => sum + obj.required, 0);
    const current = quest.objectives.reduce((sum, obj) => sum + (obj.current || 0), 0);
    return Math.round((current / total) * 100);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto" data-testid="quest-log">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Quest Log Panel */}
      <div className="relative bg-[#1a1a1a] border-2 border-[#fbbf24] rounded-lg shadow-2xl w-[550px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#78350f] to-[#92400e] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scroll className="w-6 h-6 text-[#fbbf24]" />
            <h2 className="font-cinzel text-xl text-[#fbbf24]">Quest Log</h2>
          </div>
          <button onClick={onClose} className="text-[#fbbf24] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Active Quests */}
          <div className="mb-6">
            <h3 className="text-xs text-[#78716c] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Circle className="w-3 h-3 text-[#fbbf24]" />
              Active Quests ({activeQuests.length})
            </h3>
            
            {activeQuests.length === 0 ? (
              <div className="bg-[#0c0a09] rounded-lg p-6 border border-[#44403c] text-center">
                <Scroll className="w-10 h-10 mx-auto mb-2 text-[#44403c]" />
                <p className="text-[#78716c]">No active quests</p>
                <p className="text-xs text-[#57534e] mt-1">Talk to NPCs with a yellow ! to find quests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeQuests.map(quest => {
                  const questId = getQuestId(quest);
                  return (
                  <div 
                    key={questId}
                    className={`bg-[#0c0a09] rounded-lg p-4 border transition-all ${
                      trackedQuestId === questId 
                        ? 'border-[#fbbf24] shadow-lg shadow-[#fbbf24]/10' 
                        : 'border-[#44403c]'
                    }`}
                  >
                    {/* Quest Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-cinzel text-[#fbbf24]">{quest.name}</h4>
                          {quest.difficulty && (
                            <span 
                              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                              style={{ 
                                backgroundColor: `${getDifficultyColor(quest.difficulty)}20`,
                                color: getDifficultyColor(quest.difficulty)
                              }}
                            >
                              {quest.difficulty}
                            </span>
                          )}
                          {quest.isComplete && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e]">
                              Ready to Turn In
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#78716c] mt-1">From: {quest.giver || 'Unknown'}</p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onTrackQuest && onTrackQuest(questId)}
                          className={`p-1.5 rounded transition-all ${
                            trackedQuestId === questId
                              ? 'bg-[#fbbf24] text-[#1a1a1a]'
                              : 'bg-[#44403c] text-[#a8a29e] hover:bg-[#57534e]'
                          }`}
                          title="Track Quest"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAbandonQuest && onAbandonQuest(questId)}
                          className="p-1.5 bg-[#44403c] text-[#a8a29e] hover:bg-[#dc2626] hover:text-white rounded transition-all"
                          title="Abandon Quest"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] text-[#78716c] mb-1">
                        <span>Progress</span>
                        <span>{getProgressPercent(quest)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#44403c] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] transition-all duration-300"
                          style={{ width: `${getProgressPercent(quest)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Objectives */}
                    {quest.objectives && quest.objectives.length > 0 && (
                      <div className="space-y-1.5">
                        {quest.objectives.map(obj => {
                          const isComplete = (obj.current || 0) >= obj.required;
                          return (
                            <div 
                              key={obj.id}
                              className={`flex items-center gap-2 text-sm ${isComplete ? 'text-[#22c55e]' : 'text-[#a8a29e]'}`}
                            >
                              {isComplete ? (
                                <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                              ) : (
                                <Circle className="w-4 h-4 text-[#44403c]" />
                              )}
                              <span className={isComplete ? 'line-through' : ''}>
                                {obj.description || `${obj.type}: ${obj.target}`}
                              </span>
                              <span className="ml-auto text-xs font-mono">
                                {obj.current || 0}/{obj.required}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Rewards Preview */}
                    {quest.rewards && (quest.rewards.xp || quest.rewards.gold) && (
                      <div className="mt-3 pt-3 border-t border-[#44403c] flex items-center gap-4">
                        <span className="text-[10px] text-[#78716c] uppercase">Rewards:</span>
                        {quest.rewards.xp > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#a855f7]" />
                            <span className="text-xs text-[#a855f7]">+{quest.rewards.xp} XP</span>
                          </div>
                        )}
                        {quest.rewards.gold > 0 && (
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-[#fbbf24]" />
                            <span className="text-xs text-[#fbbf24]">+{quest.rewards.gold} Gold</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <div>
              <h3 className="text-xs text-[#78716c] uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-[#22c55e]" />
                Completed ({completedQuests.length})
              </h3>
              
              <div className="space-y-2">
                {completedQuests.map(quest => (
                  <div 
                    key={quest.id}
                    className="bg-[#22c55e]/10 rounded-lg px-4 py-2 border border-[#22c55e]/30 flex items-center gap-3"
                  >
                    <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                    <span className="text-sm text-[#22c55e]">{quest.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-[#0c0a09] px-4 py-2 border-t border-[#44403c] text-xs text-[#78716c]">
          Press <span className="text-[#fbbf24]">L</span> to toggle Quest Log
        </div>
      </div>
    </div>
  );
};

export default QuestLog;
