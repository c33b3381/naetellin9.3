import { useGameStore } from '../../store/gameStore';
import { 
  Backpack, BookOpen, Scroll, Settings, 
  Sword, LogOut, Swords, Shield, Sparkles, User, Star
} from 'lucide-react';

const HUD = ({ 
  currentHealth, 
  maxHealth, 
  currentMana, 
  maxMana, 
  isInCombat = false,
  onOpenSpellBook,
  onOpenCharacter,
  onOpenQuestLog,
  onLogout,
  playerLevel = 1,
  currentXP = 0,
  xpProgress = 0,
  xpToNextLevel = 250
}) => {
  const { 
    character, 
    stats, 
    skills, 
    activePanel,
    setActivePanel,
    logout
  } = useGameStore();

  // Handle logout with world data save
  const handleLogout = () => {
    if (onLogout) {
      onLogout(); // This will call the GameWorld logout handler that includes world data
    } else {
      logout(); // Fallback to basic logout
    }
  };

  // Use props if provided, otherwise fall back to store values
  const hp = currentHealth ?? stats?.hp ?? 100;
  const maxHp = maxHealth ?? stats?.max_hp ?? 100;
  const mana = currentMana ?? stats?.mana ?? 50;
  const maxMp = maxMana ?? stats?.max_mana ?? 50;

  return (
    <>
      {/* Top Left - Character Info */}
      <div className="absolute top-4 left-4 pointer-events-auto" data-testid="hud-character-info">
        <div className="game-panel p-3 w-64">
          {/* Character header */}
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded border-2 border-[#44403c] flex items-center justify-center relative"
              style={{ backgroundColor: character?.skin_tone || '#D2B48C' }}
            >
              <Sword className="w-6 h-6 text-[#dc2626]" />
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 bg-[#1a1513] border border-[#fbbf24] rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#fbbf24]">{playerLevel}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-cinzel text-[#f5f5f4] font-bold">{character?.name || 'Hero'}</p>
              <p className="font-rajdhani text-xs text-[#a8a29e]">
                Level {playerLevel} • {character?.class_type || 'Warrior'}
              </p>
            </div>
            {/* Combat indicator */}
            {isInCombat && (
              <div className="flex items-center gap-1 bg-[#dc2626]/20 px-2 py-1 rounded animate-pulse">
                <Swords className="w-3 h-3 text-[#dc2626]" />
                <span className="text-[10px] text-[#dc2626] font-bold">COMBAT</span>
              </div>
            )}
          </div>

          {/* HP Bar */}
          <div className="space-y-2">
            <div className="stat-bar">
              <div 
                className="stat-bar-fill bg-gradient-to-r from-[#dc2626] to-[#ef4444] transition-all duration-300"
                style={{ width: `${(hp / maxHp) * 100}%` }}
              />
              <span className="stat-bar-text text-[#f5f5f4]">
                HP: {Math.floor(hp)}/{maxHp}
              </span>
            </div>

            {/* Mana Bar */}
            <div className="stat-bar">
              <div 
                className="stat-bar-fill bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] transition-all duration-300"
                style={{ width: `${(mana / maxMp) * 100}%` }}
              />
              <span className="stat-bar-text text-[#f5f5f4]">
                MP: {Math.floor(mana)}/{maxMp}
              </span>
            </div>
            
            {/* XP Bar */}
            <div className="stat-bar h-3">
              <div 
                className="stat-bar-fill bg-gradient-to-r from-[#7c3aed] to-[#a855f7] transition-all duration-500"
                style={{ width: `${xpProgress * 100}%` }}
              />
              <span className="stat-bar-text text-[#f5f5f4] text-[9px]">
                {playerLevel >= 20 ? 'MAX LEVEL' : `XP: ${Math.floor(xpProgress * 100)}%`}
              </span>
            </div>
            
            {/* Regen indicator when not in combat and not full */}
            {!isInCombat && (hp < maxHp || mana < maxMp) && (
              <div className="flex items-center gap-1 text-[10px] text-[#22c55e]">
                <Shield className="w-3 h-3" />
                <span>Regenerating...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Center - Action Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto" data-testid="hud-action-bar">
        <div className="action-bar">
          {[
            { id: 'character', icon: User, label: 'Character', shortcut: 'C', special: true },
            { id: 'inventory', icon: Backpack, label: 'Inventory', shortcut: 'I' },
            { id: 'spellbook', icon: Sparkles, label: 'Spell Book', shortcut: 'P', special: true },
            { id: 'skills', icon: BookOpen, label: 'Skills', shortcut: 'K' },
            { id: 'quests', icon: Scroll, label: 'Quests', shortcut: 'L' },
            { id: 'settings', icon: Settings, label: 'Settings', shortcut: 'O' },
          ].map((action) => (
            <button
              key={action.id}
              data-testid={`action-${action.id}`}
              className={`action-button ${activePanel === action.id ? 'border-gold bg-gold/10' : ''}`}
              onClick={() => {
                if (action.id === 'spellbook' && onOpenSpellBook) {
                  onOpenSpellBook();
                } else if (action.id === 'character' && onOpenCharacter) {
                  onOpenCharacter();
                } else if (action.id === 'quests' && onOpenQuestLog) {
                  onOpenQuestLog();
                } else if (!action.special) {
                  setActivePanel(action.id);
                }
              }}
              title={`${action.label} (${action.shortcut})`}
            >
              <action.icon className={`w-6 h-6 ${
                activePanel === action.id ? 'text-gold' : 
                action.id === 'spellbook' ? 'text-[#a855f7]' : 
                action.id === 'character' ? 'text-[#fbbf24]' :
                'text-[#a8a29e]'
              }`} />
            </button>
          ))}
          
          {/* Logout */}
          <button
            data-testid="logout-btn"
            className="action-button hover:border-[#dc2626]"
            onClick={handleLogout}
            title="Logout (Saves All Progress)"
          >
            <LogOut className="w-6 h-6 text-[#dc2626]" />
          </button>
        </div>
      </div>

      {/* Quick Stats - Bottom Right */}
      <div className="absolute bottom-4 right-4 pointer-events-auto" data-testid="hud-quick-stats">
        <div className="game-panel p-2">
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'ATK', level: skills?.attack?.level || 1, color: '#dc2626' },
              { name: 'DEF', level: skills?.defense?.level || 1, color: '#3b82f6' },
              { name: 'STR', level: skills?.strength?.level || 1, color: '#f97316' },
            ].map((skill) => (
              <div key={skill.name} className="skill-icon">
                <span className="font-rajdhani text-xs font-bold" style={{ color: skill.color }}>
                  {skill.name}
                </span>
                <span className="skill-level">{skill.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Help */}
      <div className="absolute bottom-20 left-4 pointer-events-none">
        <div className="text-[10px] text-[#78716c] font-rajdhani space-y-0.5">
          <p>WASD / Arrows - Move</p>
          <p>SHIFT - Sprint</p>
          <p>Click - Interact</p>
        </div>
      </div>
    </>
  );
};

export default HUD;
