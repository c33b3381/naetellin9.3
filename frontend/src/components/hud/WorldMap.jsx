import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, MapPin } from 'lucide-react';

const WorldMap = ({ 
  isOpen, 
  onClose, 
  playerPosition = { x: 0, z: 0 },
  currentZone = 'starter_village',
  scene,
  playerRef
}) => {
  const canvasRef = useRef(null);
  const mapCameraRef = useRef(null);
  const mapRendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);
  
  const mapWidth = 600;
  const mapHeight = 500;
  const viewHeight = 200; // Height of camera above ground
  const viewRange = 180; // How much terrain to show (units from center) - zoomed out more than minimap
  
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !scene) return;
    
    // Create orthographic camera for top-down view
    mapCameraRef.current = new THREE.OrthographicCamera(
      -viewRange * (mapWidth / mapHeight), viewRange * (mapWidth / mapHeight),
      viewRange, -viewRange,
      1, 500
    );
    mapCameraRef.current.rotation.x = -Math.PI / 2; // Look straight down
    
    // Create dedicated renderer for world map
    mapRendererRef.current = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    mapRendererRef.current.setSize(mapWidth, mapHeight);
    mapRendererRef.current.setPixelRatio(1);
    
    setIsRendering(true);
    
    // Render loop
    const renderMap = () => {
      if (!scene || !mapCameraRef.current || !mapRendererRef.current || !isOpen) return;
      
      // Position camera above player (or center of world)
      const targetX = playerRef?.current?.position.x || 0;
      const targetZ = playerRef?.current?.position.z || 0;
      mapCameraRef.current.position.set(targetX, viewHeight, targetZ);
      mapCameraRef.current.lookAt(targetX, 0, targetZ);
      
      // Store original fog
      const originalFog = scene.fog;
      scene.fog = null;
      
      // Render
      mapRendererRef.current.render(scene, mapCameraRef.current);
      
      // Restore fog
      scene.fog = originalFog;
      
      animationFrameRef.current = requestAnimationFrame(renderMap);
    };
    
    renderMap();
    
    return () => {
      setIsRendering(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mapRendererRef.current) {
        mapRendererRef.current.dispose();
        mapRendererRef.current = null;
      }
      mapCameraRef.current = null;
    };
  }, [isOpen, scene, playerRef, viewHeight, viewRange]);
  
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
        <div className="p-4 relative">
          <div 
            className="relative rounded-lg overflow-hidden border-2 border-[#44403c]"
            style={{ width: mapWidth, height: mapHeight }}
          >
            {/* 3D Rendered Map Canvas */}
            <canvas 
              ref={canvasRef}
              width={mapWidth}
              height={mapHeight}
              className="block"
              style={{ width: mapWidth, height: mapHeight }}
            />
            
            {/* Loading indicator */}
            {!isRendering && (
              <div className="absolute inset-0 bg-[#0a0a1a] flex items-center justify-center">
                <span className="text-white/50">Loading map...</span>
              </div>
            )}
            
            {/* Player marker overlay (center) */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              {/* Outer glow */}
              <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-yellow-400/20 rounded-full animate-pulse" />
              {/* Inner glow */}
              <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-yellow-400/40 rounded-full" />
              {/* Direction arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-yellow-400 drop-shadow-lg" />
              {/* Player dot */}
              <div className="w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg" />
            </div>
            
            {/* Compass */}
            <div className="absolute top-4 right-4 w-14 h-14 bg-black/70 rounded-full border-2 border-[#44403c] flex items-center justify-center">
              <span className="text-yellow-400 font-bold text-sm absolute -top-0.5">N</span>
              <span className="text-gray-500 text-xs absolute bottom-0.5">S</span>
              <span className="text-gray-500 text-xs absolute left-1">W</span>
              <span className="text-gray-500 text-xs absolute right-1">E</span>
              <div className="w-0.5 h-5 bg-yellow-400" />
              <div className="w-5 h-0.5 bg-gray-600 absolute" />
            </div>
            
            {/* Zone name overlay */}
            <div className="absolute top-4 left-4 bg-black/70 px-3 py-1.5 rounded border border-[#44403c]">
              <span className="text-yellow-400 font-cinzel text-sm">
                {currentZone === 'starter_village' ? 'Oakvale Village' :
                 currentZone === 'darkwood_forest' ? 'Darkwood Forest' :
                 currentZone === 'crystal_caves' ? 'Crystal Caves' :
                 currentZone === 'scorched_plains' ? 'Scorched Plains' :
                 currentZone === 'frozen_peaks' ? 'Frozen Peaks' : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-[#a8a29e]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-600" />
              <span>You</span>
            </div>
            <span className="text-[#57534e]">
              ({Math.round(playerPosition.x || 0)}, {Math.round(playerPosition.z || 0)})
            </span>
          </div>
          
          <div className="text-[#57534e] text-xs">
            Press <kbd className="px-1.5 py-0.5 bg-[#27272a] rounded border border-[#3f3f46]">M</kbd> or <kbd className="px-1.5 py-0.5 bg-[#27272a] rounded border border-[#3f3f46]">ESC</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
