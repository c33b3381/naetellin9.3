import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Minimap = ({ 
  scene,
  playerRef,
  cameraRef,
  rendererRef,
  onClick
}) => {
  const canvasRef = useRef(null);
  const minimapCameraRef = useRef(null);
  const minimapRendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const size = 150;
  const viewHeight = 80; // Height of minimap camera above player
  const viewRange = 60; // How much terrain to show (units from center)
  
  useEffect(() => {
    if (!canvasRef.current || !scene) return;
    
    // Create orthographic camera for top-down view
    minimapCameraRef.current = new THREE.OrthographicCamera(
      -viewRange, viewRange,
      viewRange, -viewRange,
      1, 200
    );
    minimapCameraRef.current.rotation.x = -Math.PI / 2; // Look straight down
    
    // Create dedicated renderer for minimap
    minimapRendererRef.current = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      alpha: true
    });
    minimapRendererRef.current.setSize(size, size);
    minimapRendererRef.current.setPixelRatio(1);
    
    // Render loop
    const renderMinimap = () => {
      if (!scene || !minimapCameraRef.current || !minimapRendererRef.current) return;
      
      // Position camera above player
      if (playerRef?.current) {
        const playerPos = playerRef.current.position;
        minimapCameraRef.current.position.set(playerPos.x, playerPos.y + viewHeight, playerPos.z);
        minimapCameraRef.current.lookAt(playerPos.x, playerPos.y, playerPos.z);
      }
      
      // Store original fog and background
      const originalFog = scene.fog;
      const originalBackground = scene.background;
      
      // Temporarily modify scene for minimap (no fog, clear background)
      scene.fog = null;
      
      // Render
      minimapRendererRef.current.render(scene, minimapCameraRef.current);
      
      // Restore scene
      scene.fog = originalFog;
      scene.background = originalBackground;
      
      animationFrameRef.current = requestAnimationFrame(renderMinimap);
    };
    
    renderMinimap();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (minimapRendererRef.current) {
        minimapRendererRef.current.dispose();
      }
    };
  }, [scene, playerRef, viewHeight, viewRange]);
  
  return (
    <div 
      className="minimap-container relative cursor-pointer group"
      data-testid="minimap"
      onClick={onClick}
      title="Click to open World Map (M)"
    >
      {/* Minimap canvas with border styling */}
      <div className="relative rounded-lg overflow-hidden border-2 border-[#44403c] shadow-lg">
        <canvas 
          ref={canvasRef}
          width={size}
          height={size}
          className="block"
          style={{ width: size, height: size }}
        />
        
        {/* Player indicator overlay (center dot) */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          {/* Glow */}
          <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 bg-yellow-400/30 rounded-full animate-pulse" />
          {/* Arrow pointing north (player facing direction) */}
          <div className="absolute w-0 h-0 -translate-x-1/2 -translate-y-[150%] border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-yellow-400" />
          {/* Center dot */}
          <div className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg" />
        </div>
        
        {/* Cardinal direction */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-xs">N</div>
        
        {/* Border glow on hover */}
        <div className="absolute inset-0 border-2 border-yellow-400/0 group-hover:border-yellow-400/50 rounded-lg transition-colors pointer-events-none" />
      </div>
      
      {/* Coordinates */}
      <div className="absolute -bottom-5 left-0 right-0 text-center">
        <span className="text-[10px] text-[#78716c] bg-[#0c0a09]/80 px-1 rounded">
          {playerRef?.current ? `${Math.round(playerRef.current.position.x)}, ${Math.round(playerRef.current.position.z)}` : '0, 0'}
        </span>
      </div>
    </div>
  );
};

export default Minimap;
