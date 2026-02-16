import { useMemo, useCallback } from 'react';
import { X, MapPin, Skull, User, Store, Scroll } from 'lucide-react';

// Zone definitions matching GameWorld.jsx
const WORLD_ZONES = {
  starter_village: {
    name: 'Oakvale Village',
    color: '#228B22',
    bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
    icon: '🏘️'
  },
  darkwood_forest: {
    name: 'Darkwood Forest',
    color: '#1a4d1a',
    bounds: { minX: 100, maxX: 300, minZ: -100, maxZ: 100 },
    icon: '🌲'
  },
  crystal_caves: {
    name: 'Crystal Caves',
    color: '#4a4a6a',
    bounds: { minX: -100, maxX: 100, minZ: 100, maxZ: 300 },
    icon: '💎'
  },
  scorched_plains: {
    name: 'Scorched Plains',
    color: '#8b6914',
    bounds: { minX: -300, maxX: -100, minZ: -100, maxZ: 100 },
    icon: '🔥'
  },
  frozen_peaks: {
    name: 'Frozen Peaks',
    color: '#a8c8e8',
    bounds: { minX: -100, maxX: 100, minZ: -300, maxZ: -100 },
    icon: '❄️'
  }
};

// World bounds for the full map
const WORLD_BOUNDS = {
  minX: -300,
  maxX: 300,
  minZ: -300,
  maxZ: 300
};

const WorldMap = ({ 
  isOpen, 
  onClose, 
  playerPosition = { x: 0, z: 0 },
  currentZone = 'starter_village',
  enemies = [],
  npcs = [],
  worldObjects = []
}) => {
  // Map dimensions
  const mapWidth = 600;
  const mapHeight = 600;
  
  // Convert world coordinates to map coordinates
  const worldToMap = useCallback((worldX, worldZ) => {
    const x = ((worldX - WORLD_BOUNDS.minX) / (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX)) * mapWidth;
    const y = ((worldZ - WORLD_BOUNDS.minZ) / (WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ)) * mapHeight;
    return { x, y };
  }, []);
  
  // Player position on map
  const playerMapPos = useMemo(() => {
    return worldToMap(playerPosition.x || 0, playerPosition.z || 0);
  }, [playerPosition, worldToMap]);
  
  // Filter visible NPCs (vendors, quest givers)
  const visibleNPCs = useMemo(() => {
    return worldObjects.filter(obj => 
      obj.type === 'npc' || obj.type === 'vendor' || obj.isVendor || obj.hasQuest
    ).map(npc => ({
      ...npc,
      mapPos: worldToMap(npc.position?.x || 0, npc.position?.z || 0),
      isVendor: npc.type === 'vendor' || npc.isVendor,
      hasQuest: npc.hasQuest
    }));
  }, [worldObjects, worldToMap]);
  
  // Filter enemies for map display
  const visibleEnemies = useMemo(() => {
    return enemies.filter(e => e.isAlive !== false).map(enemy => ({
      ...enemy,
      mapPos: worldToMap(enemy.spawnPosition?.x || enemy.position?.x || 0, enemy.spawnPosition?.z || enemy.position?.z || 0)
    }));
  }, [enemies, worldToMap]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      data-testid="world-map-overlay"
    >
      <div 
        className="relative bg-[#1a1a2e] border-4 border-[#44403c] rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
        data-testid="world-map-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#44403c] bg-[#0c0a09]">
          <h2 className="font-cinzel text-[#fbbf24] text-xl tracking-wider flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            World Map
          </h2>
          <button 
            onClick={onClose}
            className="text-[#78716c] hover:text-[#fbbf24] transition-colors"
            data-testid="close-map-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Map Content */}
        <div className="p-4">
          <svg 
            width={mapWidth} 
            height={mapHeight} 
            className="rounded border border-[#44403c]"
            data-testid="world-map-svg"
          >
            {/* Background - ocean/unexplored */}
            <rect x="0" y="0" width={mapWidth} height={mapHeight} fill="#0a0a1a" />
            
            {/* DEBUG: Test rectangle - should show in center */}
            <rect x="200" y="200" width="200" height="200" fill="#228B22" opacity="0.8" stroke="#fbbf24" strokeWidth="2" />
            
            {/* Zones - rendered first as base layer */}
            {Object.entries(WORLD_ZONES).map(([zoneKey, zone]) => {
              const topLeft = worldToMap(zone.bounds.minX, zone.bounds.minZ);
              const bottomRight = worldToMap(zone.bounds.maxX, zone.bounds.maxZ);
              const width = bottomRight.x - topLeft.x;
              const height = bottomRight.y - topLeft.y;
              const isCurrentZone = zoneKey === currentZone;
              
              return (
                <g key={zoneKey}>
                  {/* Zone fill */}
                  <rect
                    x={topLeft.x}
                    y={topLeft.y}
                    width={width}
                    height={height}
                    fill={zone.color}
                    opacity={isCurrentZone ? 0.9 : 0.6}
                    stroke={isCurrentZone ? '#fbbf24' : '#666666'}
                    strokeWidth={isCurrentZone ? 3 : 2}
                    rx="4"
                  />
                  {/* Zone label */}
                  <text
                    x={topLeft.x + width / 2}
                    y={topLeft.y + height / 2 - 10}
                    textAnchor="middle"
                    fill={isCurrentZone ? '#fbbf24' : '#e0e0e0'}
                    fontSize="13"
                    fontFamily="Cinzel, serif"
                    fontWeight={isCurrentZone ? 'bold' : 'normal'}
                  >
                    {zone.icon} {zone.name}
                  </text>
                  {/* Level range */}
                  <text
                    x={topLeft.x + width / 2}
                    y={topLeft.y + height / 2 + 10}
                    textAnchor="middle"
                    fill="#a0a0a0"
                    fontSize="11"
                  >
                    {zoneKey === 'starter_village' ? 'Lv. 1-5' : 
                     zoneKey === 'darkwood_forest' ? 'Lv. 5-10' :
                     zoneKey === 'crystal_caves' ? 'Lv. 10-15' :
                     zoneKey === 'scorched_plains' ? 'Lv. 15-20' :
                     'Lv. 8-12'}
                  </text>
                </g>
              );
            })}
            
            {/* Grid lines - on top of zones */}
            {[...Array(7)].map((_, i) => (
              <g key={`grid-${i}`}>
                <line 
                  x1={i * 100} y1="0" 
                  x2={i * 100} y2={mapHeight} 
                  stroke="#2a2a3a" strokeWidth="1" 
                  opacity="0.5"
                />
                <line 
                  x1="0" y1={i * 100} 
                  x2={mapWidth} y2={i * 100} 
                  stroke="#2a2a3a" strokeWidth="1" 
                  opacity="0.5"
                />
              </g>
            ))}
            
            {/* Graveyard marker */}
            <g transform={`translate(${worldToMap(-40, -40).x}, ${worldToMap(-40, -40).y})`}>
              <circle r="8" fill="#1e1e2e" stroke="#6b7280" strokeWidth="2" />
              <text textAnchor="middle" y="4" fill="#9ca3af" fontSize="10">⚰️</text>
            </g>
            
            {/* NPCs */}
            {visibleNPCs.map((npc, idx) => (
              <g key={`npc-${idx}`} transform={`translate(${npc.mapPos.x}, ${npc.mapPos.y})`}>
                {npc.isVendor ? (
                  <>
                    <circle r="6" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
                    <text textAnchor="middle" y="3" fill="#78350f" fontSize="8" fontWeight="bold">$</text>
                  </>
                ) : npc.hasQuest ? (
                  <>
                    <circle r="6" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
                    <text textAnchor="middle" y="4" fill="#78350f" fontSize="10" fontWeight="bold">!</text>
                  </>
                ) : (
                  <circle r="4" fill="#22c55e" stroke="#166534" strokeWidth="1" />
                )}
              </g>
            ))}
            
            {/* Enemies (skull markers for groups) */}
            {visibleEnemies.slice(0, 50).map((enemy, idx) => (
              <g key={`enemy-${idx}`} transform={`translate(${enemy.mapPos.x}, ${enemy.mapPos.y})`}>
                <circle r="3" fill="#ef4444" opacity="0.7" />
              </g>
            ))}
            
            {/* Player marker (always on top) */}
            <g transform={`translate(${playerMapPos.x}, ${playerMapPos.y})`}>
              {/* Glow effect */}
              <circle r="12" fill="#fbbf24" opacity="0.3" />
              <circle r="8" fill="#fbbf24" opacity="0.5" />
              {/* Player dot */}
              <circle r="6" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
              {/* Direction indicator (arrow pointing up = north) */}
              <polygon 
                points="0,-12 4,-6 -4,-6" 
                fill="#fbbf24" 
                stroke="#78350f" 
                strokeWidth="1"
              />
            </g>
            
            {/* Compass */}
            <g transform="translate(560, 40)">
              <circle r="30" fill="#0c0a09" stroke="#44403c" strokeWidth="2" />
              <text textAnchor="middle" y="-15" fill="#fbbf24" fontSize="14" fontWeight="bold">N</text>
              <text textAnchor="middle" y="20" fill="#78716c" fontSize="10">S</text>
              <text x="-20" textAnchor="middle" y="4" fill="#78716c" fontSize="10">W</text>
              <text x="20" textAnchor="middle" y="4" fill="#78716c" fontSize="10">E</text>
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#fbbf24" strokeWidth="2" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#78716c" strokeWidth="1" />
            </g>
          </svg>
        </div>
        
        {/* Legend */}
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-4 text-sm text-[#a8a29e]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#fbbf24] border-2 border-[#78350f]" />
              <span>You</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#fbbf24] border border-[#78350f] flex items-center justify-center text-[8px] text-[#78350f] font-bold">$</div>
              <span>Vendor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#fbbf24] border border-[#78350f] flex items-center justify-center text-[10px] text-[#78350f] font-bold">!</div>
              <span>Quest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span>NPC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span>Enemy</span>
            </div>
          </div>
        </div>
        
        {/* Current location */}
        <div className="px-4 pb-4 border-t border-[#44403c] pt-3">
          <p className="text-[#78716c] text-sm">
            Current Location: <span className="text-[#fbbf24] font-cinzel">{WORLD_ZONES[currentZone]?.name || 'Unknown'}</span>
            <span className="text-[#57534e] ml-2">
              ({Math.round(playerPosition.x || 0)}, {Math.round(playerPosition.z || 0)})
            </span>
          </p>
        </div>
        
        {/* Keyboard hint */}
        <div className="absolute bottom-4 right-4 text-[#57534e] text-xs">
          Press <kbd className="px-1.5 py-0.5 bg-[#27272a] rounded border border-[#3f3f46]">M</kbd> or <kbd className="px-1.5 py-0.5 bg-[#27272a] rounded border border-[#3f3f46]">ESC</kbd> to close
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
