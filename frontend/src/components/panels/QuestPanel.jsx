import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Scroll, Check } from 'lucide-react';
import { X, Circle, CheckCircle } from 'lucide-react';

const QuestPanel = () => {
  const { quests, fetchQuests, acceptQuest, closePanel } = useGameStore();

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleAccept = async (questId) => {
    try {
      await acceptQuest(questId);
    } catch (err) {
      console.error('Accept quest failed:', err);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#059669';
      case 'medium': return '#f97316';
      case 'hard': return '#dc2626';
      default: return '#78716c';
    }
  };

  return (
    <div className="game-panel w-[450px]" data-testid="quest-panel">
      {/* Header */}
      <div className="game-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scroll className="w-5 h-5" />
          <span>Quest Log</span>
        </div>
        <button 
          onClick={closePanel}
          className="text-[#78716c] hover:text-[#dc2626] transition-colors"
          data-testid="close-quests"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4">
        {/* Active Quests */}
        <div className="mb-4">
          <p className="font-rajdhani text-xs text-[#78716c] uppercase tracking-wider mb-2">
            Active Quests ({quests?.active?.length || 0})
          </p>
          
          {quests?.active?.length === 0 ? (
            <p className="text-sm text-[#78716c] py-2">No active quests</p>
          ) : (
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {quests?.active?.map((quest) => (
                  <div 
                    key={quest.quest_id}
                    className="p-3 bg-[#0c0a09]/50 rounded border border-[#44403c]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-cinzel text-sm text-[#f5f5f4]">{quest.name}</p>
                        <span 
                          className="text-[10px] font-rajdhani uppercase"
                          style={{ color: getDifficultyColor(quest.difficulty) }}
                        >
                          {quest.difficulty}
                        </span>
                      </div>
                    </div>
                    
                    {/* Objectives */}
                    <div className="space-y-1">
                      {quest.objectives?.map((obj) => {
                        const progress = quest.progress?.[obj.id] || 0;
                        const complete = progress >= obj.required;
                        
                        return (
                          <div 
                            key={obj.id}
                            className={`quest-objective ${complete ? 'complete' : ''}`}
                          >
                            {complete ? (
                              <CheckCircle size={12} className="text-[#059669]" />
                            ) : (
                              <Circle size={12} className="text-[#78716c]" />
                            )}
                            <span className={`text-xs ${complete ? 'line-through' : ''}`}>
                              {obj.description}
                            </span>
                            <span className="ml-auto text-[10px] font-rajdhani">
                              {progress}/{obj.required}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Available Quests */}
        <div className="mb-4">
          <p className="font-rajdhani text-xs text-[#78716c] uppercase tracking-wider mb-2">
            Available Quests ({quests?.available?.length || 0})
          </p>
          
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {quests?.available?.map((quest) => (
                <div 
                  key={quest.quest_id}
                  className="p-3 bg-[#0c0a09]/50 rounded border border-[#44403c] hover:border-[#fbbf24] transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-cinzel text-sm text-[#fbbf24]">{quest.name}</p>
                      <span 
                        className="text-[10px] font-rajdhani uppercase"
                        style={{ color: getDifficultyColor(quest.difficulty) }}
                      >
                        {quest.difficulty}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="btn-medieval h-6 px-3 text-xs"
                      onClick={() => handleAccept(quest.quest_id)}
                      data-testid={`accept-quest-${quest.quest_id}`}
                    >
                      Accept
                    </Button>
                  </div>
                  <p className="text-xs text-[#a8a29e] mb-2">{quest.description}</p>
                  
                  {/* Rewards preview */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-[#78716c]">Rewards:</span>
                    {quest.rewards?.xp && Object.entries(quest.rewards.xp).map(([skill, xp]) => (
                      <span key={skill} className="text-[#9333ea]">+{xp} {skill} XP</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Completed Quests */}
        <div>
          <p className="font-rajdhani text-xs text-[#78716c] uppercase tracking-wider mb-2">
            Completed ({quests?.completed?.length || 0})
          </p>
          
          <ScrollArea className="h-20">
            <div className="space-y-1">
              {quests?.completed?.map((quest) => (
                <div 
                  key={quest.quest_id}
                  className="flex items-center gap-2 p-2 bg-[#059669]/10 rounded"
                >
                  <Check className="w-4 h-4 text-[#059669]" />
                  <span className="text-xs text-[#059669]">{quest.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default QuestPanel;
