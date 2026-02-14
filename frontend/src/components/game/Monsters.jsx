import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

const MONSTER_SPAWNS = [
  // Goblin Forest area
  { type: 'goblin', position: [-35, 0, 40], respawnTime: 30000 },
  { type: 'goblin', position: [-40, 0, 35], respawnTime: 30000 },
  { type: 'goblin', position: [-30, 0, 45], respawnTime: 30000 },
  { type: 'goblin', position: [-45, 0, 40], respawnTime: 30000 },
  { type: 'wolf', position: [-50, 0, 50], respawnTime: 45000 },
  { type: 'wolf', position: [-55, 0, 45], respawnTime: 45000 },
  // Castle ruins area
  { type: 'skeleton', position: [60, 0, -50], respawnTime: 60000 },
  { type: 'skeleton', position: [65, 0, -55], respawnTime: 60000 },
  { type: 'skeleton', position: [55, 0, -60], respawnTime: 60000 },
  { type: 'troll', position: [70, 0, -60], respawnTime: 120000 },
];

const MONSTER_VISUALS = {
  goblin: { color: '#4a7c23', size: 0.6, hp: 20 },
  wolf: { color: '#6b7280', size: 0.8, hp: 35 },
  skeleton: { color: '#e7e5e4', size: 0.9, hp: 50 },
  troll: { color: '#57534e', size: 1.5, hp: 100 },
};

const Monster = ({ spawn, index }) => {
  const meshRef = useRef();
  const [hp, setHp] = useState(MONSTER_VISUALS[spawn.type].hp);
  const [isAlive, setIsAlive] = useState(true);
  const [hovered, setHovered] = useState(false);
  const { attackMonster, stats } = useGameStore();
  
  const visual = MONSTER_VISUALS[spawn.type];
  
  // Idle animation
  useFrame((state) => {
    if (meshRef.current && isAlive) {
      meshRef.current.position.y = visual.size * 0.5 + Math.sin(state.clock.elapsedTime * 3 + index) * 0.1;
      meshRef.current.rotation.y += 0.005;
    }
  });

  const handleClick = async () => {
    if (!isAlive || stats.hp <= 0) return;
    
    try {
      const result = await attackMonster(spawn.type);
      setHp(result.monster_hp);
      
      if (result.monster_defeated) {
        setIsAlive(false);
        // Respawn after delay
        setTimeout(() => {
          setHp(visual.hp);
          setIsAlive(true);
        }, spawn.respawnTime);
      }
    } catch (err) {
      console.error('Attack failed:', err);
    }
  };

  if (!isAlive) return null;

  return (
    <group position={spawn.position}>
      <group 
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Body */}
        <mesh castShadow>
          {spawn.type === 'wolf' ? (
            <boxGeometry args={[visual.size * 1.5, visual.size * 0.8, visual.size * 0.8]} />
          ) : spawn.type === 'troll' ? (
            <capsuleGeometry args={[visual.size * 0.6, visual.size, 8, 16]} />
          ) : (
            <capsuleGeometry args={[visual.size * 0.4, visual.size * 0.8, 8, 16]} />
          )}
          <meshStandardMaterial 
            color={hovered ? '#dc2626' : visual.color} 
          />
        </mesh>

        {/* Eyes */}
        <mesh position={[visual.size * 0.15, visual.size * 0.3, visual.size * 0.35]}>
          <sphereGeometry args={[0.08 * visual.size, 8, 8]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[-visual.size * 0.15, visual.size * 0.3, visual.size * 0.35]}>
          <sphereGeometry args={[0.08 * visual.size, 8, 8]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.8} />
        </mesh>
        
        {/* HP Bar - 3D version */}
        {hovered && (
          <group position={[0, visual.size * 1.5, 0]}>
            {/* Background */}
            <mesh>
              <planeGeometry args={[1, 0.15]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.7} />
            </mesh>
            {/* HP Fill */}
            <mesh position={[(hp / visual.hp - 1) * 0.45, 0, 0.01]}>
              <planeGeometry args={[(hp / visual.hp) * 0.9, 0.1]} />
              <meshBasicMaterial color="#dc2626" />
            </mesh>
          </group>
        )}
      </group>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[visual.size * 0.5, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>

      {/* Aggro range indicator when hovered */}
      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[5, 5.2, 32]} />
          <meshBasicMaterial color="#dc2626" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
};

const Monsters = () => {
  return (
    <group>
      {MONSTER_SPAWNS.map((spawn, index) => (
        <Monster key={`monster-${index}`} spawn={spawn} index={index} />
      ))}
    </group>
  );
};

export default Monsters;
