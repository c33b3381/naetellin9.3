import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

const RESOURCE_SPAWNS = [
  // Mining area rocks
  { type: 'copper_ore', skill: 'mining', position: [-52, 0, -25], xp: 17 },
  { type: 'copper_ore', skill: 'mining', position: [-48, 0, -32], xp: 17 },
  { type: 'copper_ore', skill: 'mining', position: [-55, 0, -30], xp: 17 },
  { type: 'iron_ore', skill: 'mining', position: [-58, 0, -28], xp: 35 },
  { type: 'iron_ore', skill: 'mining', position: [-45, 0, -35], xp: 35 },
  
  // Trees for woodcutting
  { type: 'oak_tree', skill: 'woodcutting', position: [20, 0, 40], xp: 25 },
  { type: 'oak_tree', skill: 'woodcutting', position: [25, 0, 45], xp: 25 },
  { type: 'willow_tree', skill: 'woodcutting', position: [30, 0, 35], xp: 67 },
  { type: 'oak_tree', skill: 'woodcutting', position: [-25, 0, 35], xp: 25 },
  
  // Fishing spots
  { type: 'fishing_spot', skill: 'fishing', position: [35, 0, 32], xp: 40 },
  { type: 'fishing_spot', skill: 'fishing', position: [42, 0, 28], xp: 40 },
  { type: 'fishing_spot', skill: 'fishing', position: [38, 0, 25], xp: 40 },
];

const RESOURCE_VISUALS = {
  copper_ore: { color: '#b87333', shape: 'rock', size: 0.8 },
  iron_ore: { color: '#4a4a4a', shape: 'rock', size: 0.9 },
  gold_ore: { color: '#ffd700', shape: 'rock', size: 0.7 },
  oak_tree: { color: '#2d5a1d', shape: 'tree', size: 1 },
  willow_tree: { color: '#3d7a2d', shape: 'tree', size: 1.2 },
  fishing_spot: { color: '#1e3a5f', shape: 'water', size: 1 },
};

const Resource = ({ spawn, index }) => {
  const meshRef = useRef();
  const [isGathering, setIsGathering] = useState(false);
  const [isDepleted, setIsDepleted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { trainSkill, addItem, skills } = useGameStore();
  
  const visual = RESOURCE_VISUALS[spawn.type];
  
  // Animation for fishing spots
  useFrame((state) => {
    if (meshRef.current && spawn.type === 'fishing_spot') {
      meshRef.current.position.y = -0.05 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05;
    }
  });

  const handleGather = async () => {
    if (isGathering || isDepleted) return;
    
    const requiredLevel = spawn.type.includes('iron') ? 15 : 
                          spawn.type.includes('willow') ? 30 : 1;
    
    const skillLevel = skills[spawn.skill]?.level || 1;
    if (skillLevel < requiredLevel) {
      return;
    }
    
    setIsGathering(true);
    
    // Simulate gathering time
    setTimeout(async () => {
      try {
        await trainSkill(spawn.skill, spawn.xp);
        
        // Add resource to inventory
        const itemName = spawn.type.replace('_', ' ').replace('spot', '').trim();
        await addItem({
          item_id: spawn.type,
          name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
          type: 'resource',
          quantity: 1,
          stats: {}
        });
        
        setIsDepleted(true);
        
        // Respawn after delay
        setTimeout(() => {
          setIsDepleted(false);
        }, 10000 + Math.random() * 5000);
        
      } catch (err) {
        console.error('Gathering failed:', err);
      }
      setIsGathering(false);
    }, 2000 + Math.random() * 1000);
  };

  if (isDepleted && visual.shape !== 'water') return null;

  return (
    <group position={spawn.position}>
      <group 
        ref={meshRef}
        onClick={handleGather}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {visual.shape === 'rock' && (
          <mesh castShadow>
            <dodecahedronGeometry args={[visual.size, 0]} />
            <meshStandardMaterial 
              color={isDepleted ? '#44403c' : (hovered ? '#fbbf24' : visual.color)}
              metalness={spawn.type.includes('ore') ? 0.4 : 0}
              roughness={0.8}
            />
          </mesh>
        )}
        
        {visual.shape === 'tree' && (
          <>
            {/* Trunk */}
            <mesh position={[0, 1.5 * visual.size, 0]} castShadow>
              <cylinderGeometry args={[0.3 * visual.size, 0.4 * visual.size, 3 * visual.size, 8]} />
              <meshStandardMaterial color="#4a3728" />
            </mesh>
            {/* Foliage */}
            <mesh position={[0, 4 * visual.size, 0]} castShadow>
              <dodecahedronGeometry args={[2 * visual.size, 1]} />
              <meshStandardMaterial 
                color={hovered ? '#4a9c2d' : visual.color} 
              />
            </mesh>
          </>
        )}
        
        {visual.shape === 'water' && (
          <>
            {/* Fishing spot indicator */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.8, 1.2, 16]} />
              <meshStandardMaterial 
                color={hovered ? '#3b82f6' : visual.color}
                transparent
                opacity={isDepleted ? 0.3 : 0.7}
              />
            </mesh>
            {/* Bubbles */}
            {!isDepleted && (
              <>
                <mesh position={[0.3, 0.1, 0.2]}>
                  <sphereGeometry args={[0.1, 8, 8]} />
                  <meshStandardMaterial color="white" transparent opacity={0.6} />
                </mesh>
                <mesh position={[-0.2, 0.15, -0.1]}>
                  <sphereGeometry args={[0.08, 8, 8]} />
                  <meshStandardMaterial color="white" transparent opacity={0.5} />
                </mesh>
              </>
            )}
          </>
        )}
        
        {/* Gathering progress indicator - 3D bar */}
        {isGathering && (
          <group position={[0, visual.shape === 'tree' ? 6 : 2, 0]}>
            <mesh>
              <planeGeometry args={[1.5, 0.2]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.7} />
            </mesh>
            <mesh position={[-0.3, 0, 0.01]}>
              <planeGeometry args={[0.6, 0.15]} />
              <meshBasicMaterial color="#fbbf24" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

const Resources = () => {
  return (
    <group>
      {RESOURCE_SPAWNS.map((spawn, index) => (
        <Resource key={`resource-${index}`} spawn={spawn} index={index} />
      ))}
    </group>
  );
};

export default Resources;
