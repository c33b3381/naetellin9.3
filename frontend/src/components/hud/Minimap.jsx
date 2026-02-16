import { useMemo, useCallback } from 'react';

// Zone definitions matching GameWorld.jsx
const WORLD_ZONES = {
  starter_village: {
    name: 'Oakvale Village',
    color: '#228B22',
    bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 }
  },
  darkwood_forest: {
    name: 'Darkwood Forest',
    color: '#1a4d1a',
    bounds: { minX: 100, maxX: 300, minZ: -100, maxZ: 100 }
  },
  crystal_caves: {
    name: 'Crystal Caves',
    color: '#4a4a6a',
    bounds: { minX: -100, maxX: 100, minZ: 100, maxZ: 300 }
  },
  scorched_plains: {
    name: 'Scorched Plains',
    color: '#8b6914',
    bounds: { minX: -300, maxX: -100, minZ: -100, maxZ: 100 }
  },
  frozen_peaks: {
    name: 'Frozen Peaks',
    color: '#a8c8e8',
    bounds: { minX: -100, maxX: 100, minZ: -300, maxZ: -100 }
  }
};

// Minimap shows a 100x100 unit area around the player
const MINIMAP_RANGE = 50; // 50 units in each direction from player

const Minimap = ({ 
  playerPosition = { x: 0, z: 0 },
  playerRotation = 0,
  currentZone = 'starter_village',
  enemies = [],
  npcs = [],
  onClick
}) => {
  const size = 150;
  const center = size / 2;
  
  // Convert world coordinates to minimap coordinates (relative to player)
  const worldToMinimap = useCallback((worldX, worldZ) => {
    const playerX = playerPosition.x || 0;
    const playerZ = playerPosition.z || 0;
    
    // Calculate relative position
    const relX = worldX - playerX;
    const relZ = worldZ - playerZ;
    
    // Scale to minimap
    const scale = center / MINIMAP_RANGE;
    const mapX = center + (relX * scale);
    const mapY = center + (relZ * scale);
    
    return { 
      x: Math.max(5, Math.min(size - 5, mapX)), 
      y: Math.max(5, Math.min(size - 5, mapY)),
      inRange: Math.abs(relX) <= MINIMAP_RANGE && Math.abs(relZ) <= MINIMAP_RANGE
    };
  }, [playerPosition, center]);
  
  // Get zone color at a position
  const getZoneAtPosition = useCallback((worldX, worldZ) => {
    for (const [, zone] of Object.entries(WORLD_ZONES)) {
      const b = zone.bounds;
      if (worldX >= b.minX && worldX <= b.maxX && worldZ >= b.minZ && worldZ <= b.maxZ) {
        return zone.color;
      }
    }
    return '#1a3d0d'; // Default grass
  }, []);
  
  // Generate zone background tiles
  const zoneTiles = useMemo(() => {
    const tiles = [];
    const playerX = playerPosition.x || 0;
    const playerZ = playerPosition.z || 0;
    const tileSize = 15;
    const tilesPerSide = Math.ceil(size / tileSize);
    
    for (let i = 0; i < tilesPerSide; i++) {
      for (let j = 0; j < tilesPerSide; j++) {
        // World position of this tile center
        const tileWorldX = playerX + ((i - tilesPerSide/2) * (MINIMAP_RANGE * 2 / tilesPerSide));
        const tileWorldZ = playerZ + ((j - tilesPerSide/2) * (MINIMAP_RANGE * 2 / tilesPerSide));
        const color = getZoneAtPosition(tileWorldX, tileWorldZ);
        
        tiles.push(
          <rect
            key={`tile-${i}-${j}`}
            x={i * tileSize}
            y={j * tileSize}
            width={tileSize + 1}
            height={tileSize + 1}
            fill={color}
            opacity="0.8"
          />
        );
      }
    }
    return tiles;
  }, [playerPosition, getZoneAtPosition]);
  
  // Filter enemies in range
  const visibleEnemies = useMemo(() => {
    return enemies
      .filter(e => e.isAlive !== false)
      .map(enemy => {
        const pos = worldToMinimap(
          enemy.position?.x || enemy.spawnPosition?.x || 0,
          enemy.position?.z || enemy.spawnPosition?.z || 0
        );
        return { ...enemy, mapPos: pos };
      })
      .filter(e => e.mapPos.inRange);
  }, [enemies, worldToMinimap]);
  
  // Filter NPCs in range
  const visibleNPCs = useMemo(() => {
    return npcs
      .map(npc => {
        const pos = worldToMinimap(npc.position?.x || 0, npc.position?.z || 0);
        return { ...npc, mapPos: pos };
      })
      .filter(n => n.mapPos.inRange);
  }, [npcs, worldToMinimap]);
  
  return (
    <div 
      className="minimap cursor-pointer relative group" 
      data-testid="minimap"
      onClick={onClick}
      title="Click to open World Map (M)"
    >
      <svg width={size} height={size} style={{ borderRadius: '8px' }} className="border-2 border-[#44403c] shadow-lg">
        {/* Clip path for rounded corners */}
        <defs>
          <clipPath id="minimapClip">
            <rect x="0" y="0" width={size} height={size} rx="6" />
          </clipPath>
          {/* Player direction glow */}
          <radialGradient id="playerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <g clipPath="url(#minimapClip)">
          {/* Zone tiles background */}
          {zoneTiles}
          
          {/* Grid overlay */}
          <g opacity="0.2">
            {[...Array(6)].map((_, i) => (
              <g key={`grid-${i}`}>
                <line x1={i * 30} y1="0" x2={i * 30} y2={size} stroke="#000" strokeWidth="0.5" />
                <line x1="0" y1={i * 30} x2={size} y2={i * 30} stroke="#000" strokeWidth="0.5" />
              </g>
            ))}
          </g>
          
          {/* Enemies (red dots) */}
          {visibleEnemies.map((enemy, idx) => (
            <circle
              key={`enemy-${idx}`}
              cx={enemy.mapPos.x}
              cy={enemy.mapPos.y}
              r="3"
              fill="#ef4444"
              opacity="0.8"
            />
          ))}
          
          {/* NPCs */}
          {visibleNPCs.map((npc, idx) => (
            <circle
              key={`npc-${idx}`}
              cx={npc.mapPos.x}
              cy={npc.mapPos.y}
              r={npc.isVendor || npc.hasQuest ? 4 : 3}
              fill={npc.isVendor ? '#fbbf24' : npc.hasQuest ? '#fbbf24' : '#22c55e'}
              stroke={npc.isVendor || npc.hasQuest ? '#78350f' : '#166534'}
              strokeWidth="1"
            />
          ))}
          
          {/* Player glow */}
          <circle cx={center} cy={center} r="12" fill="url(#playerGlow)" />
          
          {/* Player dot (always centered) */}
          <circle
            cx={center}
            cy={center}
            r="5"
            fill="#fbbf24"
            stroke="#78350f"
            strokeWidth="2"
          />
          
          {/* Player direction indicator */}
          <polygon
            points={`${center},${center - 10} ${center + 4},${center - 4} ${center - 4},${center - 4}`}
            fill="#fbbf24"
            stroke="#78350f"
            strokeWidth="1"
            transform={`rotate(${playerRotation * (180/Math.PI)}, ${center}, ${center})`}
          />
        </g>
        
        {/* Border glow on hover */}
        <rect 
          x="1" y="1" 
          width={size - 2} height={size - 2} 
          rx="6" 
          fill="none" 
          stroke="#fbbf24" 
          strokeWidth="2"
          opacity="0"
          className="group-hover:opacity-50 transition-opacity"
        />
        
        {/* Cardinal directions */}
        <text x={center} y="12" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">N</text>
        <text x={center} y={size - 4} textAnchor="middle" fill="#78716c" fontSize="8">S</text>
        <text x="8" y={center + 3} textAnchor="middle" fill="#78716c" fontSize="8">W</text>
        <text x={size - 8} y={center + 3} textAnchor="middle" fill="#78716c" fontSize="8">E</text>
      </svg>
      
      {/* Coordinates display */}
      <div className="absolute -bottom-5 left-0 right-0 text-center">
        <span className="text-[10px] text-[#78716c] bg-[#0c0a09]/80 px-1 rounded">
          {Math.round(playerPosition.x || 0)}, {Math.round(playerPosition.z || 0)}
        </span>
      </div>
      
      {/* Hover hint */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[9px] text-[#fbbf24] whitespace-nowrap">Click for Map</span>
      </div>
    </div>
  );
};

export default Minimap;
