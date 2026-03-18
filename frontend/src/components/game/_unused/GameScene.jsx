import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

// Player Character
const Player = () => {
  const groupRef = useRef();
  const character = useGameStore(state => state.character);
  
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  });
  
  const positionRef = useRef({ x: 0, z: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keysRef.current.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keysRef.current.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.right = true;
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keysRef.current.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keysRef.current.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.right = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const speed = 8 * delta;
    const keys = keysRef.current;
    
    if (keys.forward) positionRef.current.z -= speed;
    if (keys.backward) positionRef.current.z += speed;
    if (keys.left) positionRef.current.x -= speed;
    if (keys.right) positionRef.current.x += speed;
    
    positionRef.current.x = Math.max(-40, Math.min(40, positionRef.current.x));
    positionRef.current.z = Math.max(-40, Math.min(40, positionRef.current.z));
    
    groupRef.current.position.x = positionRef.current.x;
    groupRef.current.position.z = positionRef.current.z;
    
    // Camera follow
    state.camera.position.set(
      positionRef.current.x,
      10,
      positionRef.current.z + 12
    );
    state.camera.lookAt(positionRef.current.x, 1, positionRef.current.z);
  });

  const skinColor = character?.skin_tone || '#D2B48C';
  const hairColor = character?.hair_color || '#4a3728';

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>
      
      {/* Sword on back */}
      <mesh position={[0.3, 1.2, -0.2]} rotation={[0.3, 0, 0.2]}>
        <boxGeometry args={[0.06, 0.9, 0.02]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.7} />
      </mesh>
    </group>
  );
};

// Main Game Scene
const GameScene = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <hemisphereLight args={['#87CEEB', '#228B22', 0.4]} />
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      
      {/* Village center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[12, 32]} />
        <meshStandardMaterial color="#32CD32" />
      </mesh>
      
      {/* Dirt paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[2.5, 30]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[30, 2.5]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Player */}
      <Player />
      
      {/* Main Building (Town Hall) */}
      <group position={[0, 0, -10]}>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[8, 6, 6]} />
          <meshStandardMaterial color="#D2691E" />
        </mesh>
        <mesh position={[0, 7.5, 0]} castShadow>
          <coneGeometry args={[6, 3, 4]} />
          <meshStandardMaterial color="#8B0000" />
        </mesh>
        <mesh position={[0, 1.2, 3.01]}>
          <planeGeometry args={[1.5, 2.4]} />
          <meshStandardMaterial color="#4a2c2a" />
        </mesh>
      </group>
      
      {/* Side buildings */}
      <group position={[-10, 0, 4]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[5, 4, 4]} />
          <meshStandardMaterial color="#CD853F" />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow>
          <coneGeometry args={[4, 2.5, 4]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      </group>
      
      <group position={[10, 0, 4]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[5, 4, 4]} />
          <meshStandardMaterial color="#CD853F" />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow>
          <coneGeometry args={[4, 2.5, 4]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      </group>
      
      {/* Trees */}
      {[[-18, 0, -10], [-20, 0, 5], [-15, 0, 18], [18, 0, -10], [20, 0, 5], [15, 0, 18], [0, 0, 25]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 3, 8]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow>
            <coneGeometry args={[1.8, 3, 8]} />
            <meshStandardMaterial color="#006400" />
          </mesh>
          <mesh position={[0, 5.5, 0]} castShadow>
            <coneGeometry args={[1.3, 2, 8]} />
            <meshStandardMaterial color="#228B22" />
          </mesh>
        </group>
      ))}
      
      {/* NPCs */}
      <group position={[3, 0, 1]}>
        <mesh position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
          <meshStandardMaterial color="#D2B48C" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#D2B48C" />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
        </mesh>
      </group>
      
      <group position={[-8, 0, 5]}>
        <mesh position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
          <meshStandardMaterial color="#D2B48C" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#D2B48C" />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} />
        </mesh>
      </group>
      
      {/* Monsters (Goblins) in the distance */}
      {[[-28, 0, 20], [-32, 0, 18], [28, 0, 18]].map(([x, y, z], i) => (
        <group key={`monster-${i}`} position={[x, y, z]}>
          <mesh position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.2, 0.3, 8, 16]} />
            <meshStandardMaterial color="#4a7c23" />
          </mesh>
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#4a7c23" />
          </mesh>
          <mesh position={[-0.06, 1.05, 0.12]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0.06, 1.05, 0.12]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
      
      {/* Mining rocks */}
      {[[-30, 0.4, -25], [-33, 0.5, -23], [-28, 0.3, -27]].map(([x, y, z], i) => (
        <mesh key={`rock-${i}`} position={[x, y, z]}>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color={i === 0 ? "#b87333" : "#808080"} roughness={0.9} />
        </mesh>
      ))}
      
      {/* Well in village */}
      <group position={[5, 0, 2]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 0.8, 16]} />
          <meshStandardMaterial color="#696969" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.5, 16]} />
          <meshStandardMaterial color="#1e90ff" />
        </mesh>
      </group>
    </>
  );
};

export default GameScene;
