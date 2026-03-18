import { useMemo } from 'react';
import * as THREE from 'three';

const Buildings = () => {
  const buildings = useMemo(() => [
    // Village Center - Main Hall
    {
      position: [0, 0, -10],
      size: [12, 8, 10],
      roofHeight: 4,
      color: '#5c4033',
      roofColor: '#8B4513',
      type: 'hall',
      name: 'Town Hall'
    },
    // Blacksmith
    {
      position: [-15, 0, 5],
      size: [8, 5, 6],
      roofHeight: 2.5,
      color: '#4a3728',
      roofColor: '#2d2d2d',
      type: 'shop',
      name: 'Blacksmith'
    },
    // General Store
    {
      position: [15, 0, 5],
      size: [7, 5, 6],
      roofHeight: 2.5,
      color: '#5c4033',
      roofColor: '#654321',
      type: 'shop',
      name: 'General Store'
    },
    // Inn/Tavern
    {
      position: [10, 0, -20],
      size: [10, 6, 8],
      roofHeight: 3,
      color: '#6b5344',
      roofColor: '#8B4513',
      type: 'inn',
      name: 'The Rusty Anchor'
    },
    // Small houses
    {
      position: [-20, 0, -15],
      size: [5, 4, 5],
      roofHeight: 2,
      color: '#5c4033',
      roofColor: '#4a3728',
      type: 'house'
    },
    {
      position: [-25, 0, 0],
      size: [5, 4, 5],
      roofHeight: 2,
      color: '#4a3728',
      roofColor: '#5c4033',
      type: 'house'
    },
    {
      position: [25, 0, -10],
      size: [5, 4, 5],
      roofHeight: 2,
      color: '#5c4033',
      roofColor: '#6b5344',
      type: 'house'
    },
    // Guard Tower
    {
      position: [-30, 0, 20],
      size: [4, 12, 4],
      roofHeight: 2,
      color: '#57534e',
      roofColor: '#44403c',
      type: 'tower'
    },
    // Church/Temple
    {
      position: [30, 0, -25],
      size: [8, 10, 12],
      roofHeight: 6,
      color: '#e7e5e4',
      roofColor: '#57534e',
      type: 'temple'
    }
  ], []);

  return (
    <group>
      {buildings.map((building, index) => (
        <group key={index} position={building.position}>
          {/* Main structure */}
          <mesh position={[0, building.size[1] / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={building.size} />
            <meshStandardMaterial color={building.color} />
          </mesh>

          {/* Roof */}
          {building.type !== 'tower' ? (
            <mesh 
              position={[0, building.size[1] + building.roofHeight / 2, 0]} 
              castShadow
            >
              <coneGeometry args={[
                Math.max(building.size[0], building.size[2]) * 0.75,
                building.roofHeight,
                4
              ]} />
              <meshStandardMaterial color={building.roofColor} />
            </mesh>
          ) : (
            // Tower roof - pointed
            <mesh 
              position={[0, building.size[1] + building.roofHeight, 0]} 
              castShadow
            >
              <coneGeometry args={[building.size[0] * 0.7, building.roofHeight * 2, 8]} />
              <meshStandardMaterial color={building.roofColor} />
            </mesh>
          )}

          {/* Door */}
          <mesh position={[0, 1.2, building.size[2] / 2 + 0.01]}>
            <boxGeometry args={[1.5, 2.4, 0.1]} />
            <meshStandardMaterial color="#2d2d2d" />
          </mesh>

          {/* Windows */}
          {building.size[1] > 4 && (
            <>
              <mesh position={[building.size[0] / 4, building.size[1] * 0.6, building.size[2] / 2 + 0.01]}>
                <boxGeometry args={[1, 1.2, 0.1]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
              </mesh>
              <mesh position={[-building.size[0] / 4, building.size[1] * 0.6, building.size[2] / 2 + 0.01]}>
                <boxGeometry args={[1, 1.2, 0.1]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
              </mesh>
            </>
          )}

          {/* Chimney for houses and inn */}
          {(building.type === 'house' || building.type === 'inn') && (
            <mesh position={[building.size[0] / 3, building.size[1] + building.roofHeight, -building.size[2] / 4]} castShadow>
              <boxGeometry args={[0.8, 2, 0.8]} />
              <meshStandardMaterial color="#57534e" />
            </mesh>
          )}

          {/* Sign for shops/inn */}
          {building.name && building.type !== 'house' && (
            <group position={[0, building.size[1] * 0.7, building.size[2] / 2 + 1]}>
              {/* Sign post */}
              <mesh position={[2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 3]} />
                <meshStandardMaterial color="#4a3728" />
              </mesh>
              {/* Sign board */}
              <mesh position={[2, 1, 0.3]}>
                <boxGeometry args={[2.5, 0.8, 0.1]} />
                <meshStandardMaterial color="#5c4033" />
              </mesh>
            </group>
          )}

          {/* Special elements */}
          {building.type === 'temple' && (
            // Cross/Symbol on top
            <mesh position={[0, building.size[1] + building.roofHeight + 1, 0]}>
              <boxGeometry args={[0.3, 2, 0.3]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.5} />
            </mesh>
          )}

          {building.type === 'shop' && building.name === 'Blacksmith' && (
            // Anvil
            <group position={[building.size[0] / 2 + 2, 0.4, 0]}>
              <mesh>
                <boxGeometry args={[1, 0.8, 0.6]} />
                <meshStandardMaterial color="#44403c" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* Forge fire glow */}
              <pointLight position={[-3, 1, 0]} intensity={0.8} color="#ff6600" distance={5} />
            </group>
          )}
        </group>
      ))}

      {/* Well in village center */}
      <group position={[5, 0, 5]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 1, 16]} />
          <meshStandardMaterial color="#57534e" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[1, 1, 0.8, 16]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        {/* Well roof supports */}
        <mesh position={[-1, 2, 0]}>
          <boxGeometry args={[0.2, 3, 0.2]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
        <mesh position={[1, 2, 0]}>
          <boxGeometry args={[0.2, 3, 0.2]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
        {/* Well roof */}
        <mesh position={[0, 3.8, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[1.5, 1.2, 4]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </group>

      {/* Torch lights around village */}
      {[
        [-8, 8], [8, 8], [-8, -8], [8, -8],
        [-18, 0], [18, 0], [0, 15], [0, -18]
      ].map(([x, z], i) => (
        <group key={`torch-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.1, 0.15, 3]} />
            <meshStandardMaterial color="#4a3728" />
          </mesh>
          <pointLight
            position={[0, 3, 0]}
            intensity={0.5}
            color="#ff9933"
            distance={10}
            decay={2}
          />
          {/* Flame */}
          <mesh position={[0, 3.2, 0]}>
            <coneGeometry args={[0.15, 0.4, 8]} />
            <meshStandardMaterial 
              color="#ff6600" 
              emissive="#ff6600" 
              emissiveIntensity={1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default Buildings;
