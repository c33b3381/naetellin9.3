import { useGameStore } from '../../store/gameStore';
import { Progress } from '../ui/progress';
import { 
  Sword, Shield, Dumbbell, Heart,
  Mountain, Axe, Fish, Flame, Hammer, Sparkles
} from 'lucide-react';
import { X } from 'lucide-react';

const SKILL_CONFIG = {
  attack: { icon: Sword, color: '#dc2626', name: 'Attack' },
  defense: { icon: Shield, color: '#3b82f6', name: 'Defense' },
  strength: { icon: Dumbbell, color: '#f97316', name: 'Strength' },
  hitpoints: { icon: Heart, color: '#dc2626', name: 'Hitpoints' },
  mining: { icon: Mountain, color: '#78716c', name: 'Mining' },
  woodcutting: { icon: Axe, color: '#059669', name: 'Woodcutting' },
  fishing: { icon: Fish, color: '#06b6d4', name: 'Fishing' },
  cooking: { icon: Flame, color: '#f97316', name: 'Cooking' },
  crafting: { icon: Hammer, color: '#a8a29e', name: 'Crafting' },
  magic: { icon: Sparkles, color: '#9333ea', name: 'Magic' },
};

// Calculate XP needed for next level (RuneScape-style)
const getXpForLevel = (level) => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(i + 300 * Math.pow(2, i / 7)) / 4;
  }
  return Math.floor(total);
};

const SkillsPanel = () => {
  const { skills, closePanel } = useGameStore();

  const totalLevel = Object.values(skills || {}).reduce((sum, s) => sum + (s?.level || 1), 0);

  return (
    <div className="game-panel w-96" data-testid="skills-panel">
      {/* Header */}
      <div className="game-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span>Skills</span>
        </div>
        <button 
          onClick={closePanel}
          className="text-[#78716c] hover:text-[#dc2626] transition-colors"
          data-testid="close-skills"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4">
        {/* Total Level */}
        <div className="mb-4 p-3 bg-[#0c0a09] rounded border border-[#44403c] text-center">
          <p className="font-rajdhani text-xs text-[#78716c] uppercase tracking-wider">Total Level</p>
          <p className="font-cinzel text-2xl text-[#fbbf24]">{totalLevel}</p>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(SKILL_CONFIG).map(([skillId, config]) => {
            const skill = skills?.[skillId] || { level: 1, xp: 0 };
            const currentLevelXp = getXpForLevel(skill.level);
            const nextLevelXp = getXpForLevel(skill.level + 1);
            const xpProgress = skill.level >= 99 ? 100 : 
              ((skill.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

            return (
              <div 
                key={skillId}
                className="p-2 bg-[#0c0a09]/50 rounded border border-[#44403c] hover:border-[#57534e] transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <config.icon className="w-4 h-4" style={{ color: config.color }} />
                  <span className="font-rajdhani text-sm text-[#f5f5f4]">{config.name}</span>
                  <span className="ml-auto font-rajdhani font-bold text-[#fbbf24]">
                    {skill.level}
                  </span>
                </div>
                
                {/* XP Progress */}
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, xpProgress))}%`,
                      backgroundColor: config.color 
                    }}
                  />
                </div>
                
                <p className="text-[9px] text-[#78716c] mt-1 font-rajdhani">
                  {skill.xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SkillsPanel;
