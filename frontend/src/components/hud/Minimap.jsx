import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';

const Minimap = () => {
  const { position = { x: 0, z: 0 }, onlinePlayers = [] } = useGameStore();
  
  // Safely get player position with defaults
  const playerX = position?.x || 0;
  const playerZ = position?.z || 0;
  
  // Scale world coordinates to minimap
  const playerDot = useMemo(() => {
    const scale = 0.7;
    return {
      x: 75 + (playerX * scale),
      y: 75 + (playerZ * scale)
    };
  }, [playerX, playerZ]);

  return (
    <div className="minimap" data-testid="minimap">
      <svg width="150" height="150" style={{ borderRadius: '50%' }}>
        {/* Grass background */}
        <circle cx="75" cy="75" r="70" fill="#1a3d0d" />
        
        {/* Village area */}
        <circle cx="75" cy="75" r="15" fill="#2d5a1d" />
        
        {/* Lake */}
        <circle cx="105" cy="100" r="12" fill="#1e3a5f" opacity="0.8" />
        
        {/* Mining area */}
        <circle cx="30" cy="50" r="10" fill="#44403c" />
        
        {/* Forest area */}
        <circle cx="35" cy="110" r="12" fill="#0f2d0f" />
        
        {/* Paths */}
        <line x1="75" y1="75" x2="75" y2="10" stroke="#5c4033" strokeWidth="3" />
        <line x1="75" y1="75" x2="75" y2="140" stroke="#5c4033" strokeWidth="3" />
        <line x1="10" y1="75" x2="140" y2="75" stroke="#5c4033" strokeWidth="3" />
        
        {/* Player dot */}
        <circle 
          cx={Math.max(10, Math.min(140, playerDot.x))} 
          cy={Math.max(10, Math.min(140, playerDot.y))} 
          r="5" 
          fill="#fbbf24"
        />
        
        {/* Cardinal directions */}
        <text x="75" y="12" textAnchor="middle" fill="#78716c" fontSize="8">N</text>
        <text x="75" y="145" textAnchor="middle" fill="#78716c" fontSize="8">S</text>
        <text x="8" y="78" textAnchor="middle" fill="#78716c" fontSize="8">W</text>
        <text x="142" y="78" textAnchor="middle" fill="#78716c" fontSize="8">E</text>
      </svg>
    </div>
  );
};

export default Minimap;
