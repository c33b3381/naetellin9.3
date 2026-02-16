import { useEffect, useRef, useState, useCallback } from 'react';
import { X, MapPin } from 'lucide-react';

// Zone definitions for labels
const WORLD_ZONES = {
  starter_village: { name: 'Oakvale Village', bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 }, level: '1-5' },
  darkwood_forest: { name: 'Darkwood Forest', bounds: { minX: 100, maxX: 300, minZ: -100, maxZ: 100 }, level: '5-10' },
  crystal_caves: { name: 'Crystal Caves', bounds: { minX: -100, maxX: 100, minZ: 100, maxZ: 300 }, level: '10-15' },
  scorched_plains: { name: 'Scorched Plains', bounds: { minX: -300, maxX: -100, minZ: -100, maxZ: 100 }, level: '15-20' },
  frozen_peaks: { name: 'Frozen Peaks', bounds: { minX: -100, maxX: 100, minZ: -300, maxZ: -100 }, level: '8-12' }
};

const WorldMap = ({ 
  isOpen, 
  onClose, 
  playerPosition = { x: 0, z: 0 },
  currentZone = 'starter_village',
  scene,
  terrainMesh
}) => {
  const canvasRef = useRef(null);
  const [mapGenerated, setMapGenerated] = useState(false);
  const [terrainImageData, setTerrainImageData] = useState(null);
  
  const mapWidth = 500;
  const mapHeight = 500;
  
  // World bounds
  const worldMinX = -150;
  const worldMaxX = 150;
  const worldMinZ = -150;
  const worldMaxZ = 150;
  
  // Convert world coordinates to map coordinates
  const worldToMap = useCallback((worldX, worldZ) => {
    const x = ((worldX - worldMinX) / (worldMaxX - worldMinX)) * mapWidth;
    const y = ((worldZ - worldMinZ) / (worldMaxZ - worldMinZ)) * mapHeight;
    return { x, y };
  }, [mapWidth, mapHeight]);
  
  // Generate terrain map image from scene
  const generateTerrainMap = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Fill with base grass color
    ctx.fillStyle = '#2d5a1d';
    ctx.fillRect(0, 0, mapWidth, mapHeight);
    
    // Try to sample terrain colors if terrainMesh is available
    if (terrainMesh && terrainMesh.geometry) {
      const geometry = terrainMesh.geometry;
      const positionAttr = geometry.attributes.position;
      const colorAttr = geometry.attributes.color;
      
      if (positionAttr && colorAttr) {
        // Sample terrain vertices and draw them on the map
        for (let i = 0; i < positionAttr.count; i += 10) { // Sample every 10th vertex for performance
          const x = positionAttr.getX(i);
          const z = positionAttr.getZ(i);
          const y = positionAttr.getY(i); // Height
          
          const r = Math.floor(colorAttr.getX(i) * 255);
          const g = Math.floor(colorAttr.getY(i) * 255);
          const b = Math.floor(colorAttr.getZ(i) * 255);
          
          const mapPos = worldToMap(x, z);
          
          // Draw a small rectangle for each terrain sample
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(mapPos.x - 2, mapPos.y - 2, 4, 4);
        }
      }
    }
    
    // Draw zone boundaries
    Object.entries(WORLD_ZONES).forEach(([key, zone]) => {
      const topLeft = worldToMap(Math.max(worldMinX, zone.bounds.minX), Math.max(worldMinZ, zone.bounds.minZ));
      const bottomRight = worldToMap(Math.min(worldMaxX, zone.bounds.maxX), Math.min(worldMaxZ, zone.bounds.maxZ));
      
      // Only draw if zone is within visible bounds
      if (topLeft.x < mapWidth && bottomRight.x > 0 && topLeft.y < mapHeight && bottomRight.y > 0) {
        ctx.strokeStyle = key === currentZone ? '#fbbf24' : 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = key === currentZone ? 3 : 1;
        ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
      }
    });
    
    // Draw some visual features
    // Village center area
    const villageCenter = worldToMap(0, 0);
    ctx.fillStyle = 'rgba(139, 90, 43, 0.6)';
    ctx.beginPath();
    ctx.arc(villageCenter.x, villageCenter.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Paths (brown lines)
    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(worldToMap(0, -100).x, worldToMap(0, -100).y);
    ctx.lineTo(worldToMap(0, 100).x, worldToMap(0, 100).y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(worldToMap(-100, 0).x, worldToMap(-100, 0).y);
    ctx.lineTo(worldToMap(100, 0).x, worldToMap(100, 0).y);
    ctx.stroke();
    
    // Graveyard
    const graveyard = worldToMap(-40, -40);
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(graveyard.x, graveyard.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.fillText('⚰', graveyard.x - 7, graveyard.y + 5);
    
    // Lake area (if within bounds)
    const lake = worldToMap(50, 50);
    if (lake.x < mapWidth && lake.y < mapHeight) {
      ctx.fillStyle = 'rgba(30, 80, 120, 0.8)';
      ctx.beginPath();
      ctx.ellipse(lake.x, lake.y, 25, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Mining area
    const mining = worldToMap(-60, 30);
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.arc(mining.x, mining.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Store the generated image
    setTerrainImageData(canvas.toDataURL());
    setMapGenerated(true);
  }, [terrainMesh, currentZone, worldToMap, mapWidth, mapHeight]);
  
  // Generate map when opened
  useEffect(() => {
    if (isOpen && !mapGenerated) {
      // Small delay to ensure canvas is rendered
      setTimeout(generateTerrainMap, 100);
    }
  }, [isOpen, mapGenerated, generateTerrainMap]);
  
  // Regenerate if zone changes
  useEffect(() => {
    if (isOpen) {
      setMapGenerated(false);
    }
  }, [currentZone, isOpen]);
  
  if (!isOpen) return null;
  
  const playerMapPos = worldToMap(playerPosition.x || 0, playerPosition.z || 0);
  
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
        <div className="p-4 relative">
          {/* Hidden canvas for terrain generation */}
          <canvas 
            ref={canvasRef}
            width={mapWidth}
            height={mapHeight}
            className="hidden"
          />
          
          {/* Displayed map */}
          <div 
            className="relative rounded border-2 border-[#44403c] overflow-hidden"
            style={{ width: mapWidth, height: mapHeight }}
          >
            {/* Terrain background */}
            {terrainImageData ? (
              <img 
                src={terrainImageData} 
                alt="World Map"
                className="w-full h-full"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="w-full h-full bg-[#2d5a1d] flex items-center justify-center">
                <span className="text-white/50">Generating map...</span>
              </div>
            )}
            
            {/* Zone labels overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {Object.entries(WORLD_ZONES).map(([key, zone]) => {
                const centerX = (zone.bounds.minX + zone.bounds.maxX) / 2;
                const centerZ = (zone.bounds.minZ + zone.bounds.maxZ) / 2;
                const pos = worldToMap(centerX, centerZ);
                
                // Only show label if within visible area
                if (pos.x < 0 || pos.x > mapWidth || pos.y < 0 || pos.y > mapHeight) return null;
                
                return (
                  <g key={key}>
                    <text
                      x={pos.x}
                      y={pos.y - 8}
                      textAnchor="middle"
                      fill={key === currentZone ? '#fbbf24' : '#ffffff'}
                      fontSize="12"
                      fontFamily="Cinzel, serif"
                      fontWeight={key === currentZone ? 'bold' : 'normal'}
                      className="drop-shadow-lg"
                    >
                      {zone.name}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 8}
                      textAnchor="middle"
                      fill="#a0a0a0"
                      fontSize="10"
                    >
                      Lv. {zone.level}
                    </text>
                  </g>
                );
              })}
            </svg>
            
            {/* Player marker */}
            <div 
              className="absolute pointer-events-none transition-all duration-200"
              style={{ 
                left: playerMapPos.x, 
                top: playerMapPos.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Glow effect */}
              <div className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-yellow-400/30 rounded-full animate-pulse" />
              {/* Direction arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-yellow-400" />
              {/* Player dot */}
              <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg" />
            </div>
            
            {/* Compass */}
            <div className="absolute top-3 right-3 w-12 h-12 bg-black/60 rounded-full border border-[#44403c] flex items-center justify-center">
              <span className="text-yellow-400 font-bold text-sm absolute -top-0">N</span>
              <span className="text-gray-500 text-xs absolute -bottom-0">S</span>
              <span className="text-gray-500 text-xs absolute -left-0">W</span>
              <span className="text-gray-500 text-xs absolute -right-0">E</span>
              <div className="w-px h-4 bg-yellow-400" />
              <div className="w-4 h-px bg-gray-500 absolute" />
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="px-4 pb-3 flex flex-wrap gap-4 text-sm text-[#a8a29e]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-600" />
            <span>You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#44403c] flex items-center justify-center text-[8px]">⚰</div>
            <span>Graveyard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#1e5078]" />
            <span>Water</span>
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
