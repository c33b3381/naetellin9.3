import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NPC_DATA = [
  { id: 'tutorial_guide', name: 'Tutorial Guide', position: [3, 0, 0], color: '#fbbf24', role: 'guide' },
  { id: 'blacksmith', name: 'Grorn the Smith', position: [-12, 0, 7], color: '#dc2626', role: 'shop' },
  { id: 'shopkeeper', name: 'Merchant Tilda', position: [12, 0, 7], color: '#059669', role: 'shop' },
  { id: 'innkeeper', name: 'Barkeep Milo', position: [8, 0, -18], color: '#9333ea', role: 'inn' },
  { id: 'guard', name: 'Guard Captain', position: [-28, 0, 18], color: '#3b82f6', role: 'quest' },
  { id: 'mining_master', name: 'Dwarven Miner', position: [-48, 0, -28], color: '#f97316', role: 'skill' },
  { id: 'fishing_master', name: 'Old Fisherman', position: [38, 0, 28], color: '#06b6d4', role: 'skill' },
];

const NPC = ({ npc }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Idle animation - slight bob
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group position={npc.position}>
      <group ref={meshRef}>
        {/* Body */}
        <mesh 
          castShadow
          position={[0, 0.8, 0]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <capsuleGeometry args={[0.4, 1, 8, 16]} />
          <meshStandardMaterial 
            color={hovered ? npc.color : '#d2b48c'} 
          />
        </mesh>
        
        {/* Head */}
        <mesh castShadow position={[0, 1.8, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        
        {/* Role indicator above head */}
        <mesh position={[0, 2.4, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial 
            color={npc.color} 
            emissive={npc.color} 
            emissiveIntensity={hovered ? 1 : 0.5} 
          />
        </mesh>
        
        {/* Exclamation mark for quest givers */}
        {npc.role === 'quest' && (
          <mesh position={[0, 2.8, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.4]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
          </mesh>
        )}
      </group>
      
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

const NPCs = () => {
  return (
    <group>
      {NPC_DATA.map((npc) => (
        <NPC key={npc.id} npc={npc} />
      ))}
    </group>
  );
};

export default NPCs;
