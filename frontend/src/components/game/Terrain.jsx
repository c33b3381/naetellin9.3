import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Terrain = () => {
  // Create grass patches
  const grassPatches = useMemo(() => {
    const patches = [];
    for (let i = 0; i < 200; i++) {
      patches.push({
        position: [
          (Math.random() - 0.5) * 150,
          0.05,
          (Math.random() - 0.5) * 150
        ],
        scale: 0.3 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2
      });
    }
    return patches;
  }, []);

  // Create trees
  const trees = useMemo(() => {
    const treeList = [];
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 140;
      const z = (Math.random() - 0.5) * 140;
      // Avoid center area
      if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
      treeList.push({
        position: [x, 0, z],
        scale: 0.8 + Math.random() * 0.6,
        type: Math.random() > 0.5 ? 'pine' : 'oak'
      });
    }
    return treeList;
  }, []);

  // Create rocks
  const rocks = useMemo(() => {
    const rockList = [];
    for (let i = 0; i < 30; i++) {
      rockList.push({
        position: [
          (Math.random() - 0.5) * 140,
          0.2 + Math.random() * 0.3,
          (Math.random() - 0.5) * 140
        ],
        scale: [
          0.3 + Math.random() * 0.8,
          0.3 + Math.random() * 0.5,
          0.3 + Math.random() * 0.8
        ],
        rotation: Math.random() * Math.PI
      });
    }
    return rockList;
  }, []);

  // Create water (lake)
  const waterRef = useRef();
  
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = -0.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group>
      {/* Main Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200, 50, 50]} />
        <meshStandardMaterial 
          color="#2d5016"
          roughness={0.9}
        />
      </mesh>

      {/* Dirt paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[4, 80]} />
        <meshStandardMaterial color="#5c4033" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, Math.PI / 2, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[4, 80]} />
        <meshStandardMaterial color="#5c4033" roughness={1} />
      </mesh>

      {/* Village area - lighter grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[20, 32]} />
        <meshStandardMaterial color="#3d6b1e" roughness={0.85} />
      </mesh>

      {/* Grass patches */}
      {grassPatches.map((patch, i) => (
        <mesh
          key={`grass-${i}`}
          position={patch.position}
          rotation={[0, patch.rotation, 0]}
          scale={patch.scale}
        >
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#4a7c23" />
        </mesh>
      ))}

      {/* Trees */}
      {trees.map((tree, i) => (
        <group key={`tree-${i}`} position={tree.position} scale={tree.scale}>
          {/* Trunk */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 3, 8]} />
            <meshStandardMaterial color="#4a3728" />
          </mesh>
          
          {/* Foliage */}
          {tree.type === 'pine' ? (
            <>
              <mesh position={[0, 4, 0]} castShadow>
                <coneGeometry args={[1.5, 3, 8]} />
                <meshStandardMaterial color="#1a4d1a" />
              </mesh>
              <mesh position={[0, 5.5, 0]} castShadow>
                <coneGeometry args={[1, 2, 8]} />
                <meshStandardMaterial color="#236b23" />
              </mesh>
            </>
          ) : (
            <mesh position={[0, 4, 0]} castShadow>
              <dodecahedronGeometry args={[2, 1]} />
              <meshStandardMaterial color="#2d5a1d" />
            </mesh>
          )}
        </group>
      ))}

      {/* Rocks */}
      {rocks.map((rock, i) => (
        <mesh
          key={`rock-${i}`}
          position={rock.position}
          scale={rock.scale}
          rotation={[0, rock.rotation, 0]}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      ))}

      {/* Lake / Water area */}
      <group position={[40, 0, 30]}>
        <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <circleGeometry args={[15, 32]} />
          <meshStandardMaterial 
            color="#1e3a5f"
            transparent
            opacity={0.8}
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>
        {/* Lake bed */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <circleGeometry args={[15, 32]} />
          <meshStandardMaterial color="#2d3d4d" />
        </mesh>
      </group>

      {/* Mining area rocks */}
      <group position={[-50, 0, -30]}>
        {[...Array(8)].map((_, i) => (
          <mesh
            key={`mine-rock-${i}`}
            position={[
              Math.cos(i * 0.8) * 8,
              1 + Math.random(),
              Math.sin(i * 0.8) * 8
            ]}
            castShadow
          >
            <dodecahedronGeometry args={[2 + Math.random(), 0]} />
            <meshStandardMaterial color="#44403c" roughness={0.9} />
          </mesh>
        ))}
        {/* Copper veins */}
        {[...Array(4)].map((_, i) => (
          <mesh
            key={`copper-${i}`}
            position={[
              Math.cos(i * 1.5) * 6,
              0.5,
              Math.sin(i * 1.5) * 6
            ]}
          >
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#b87333" metalness={0.5} />
          </mesh>
        ))}
      </group>

      {/* World boundaries (invisible walls visualized as faint fog) */}
      {[-90, 90].map((pos, i) => (
        <group key={`boundary-${i}`}>
          <mesh position={[pos, 10, 0]}>
            <boxGeometry args={[1, 20, 200]} />
            <meshBasicMaterial color="#1c1917" transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, 10, pos]}>
            <boxGeometry args={[200, 20, 1]} />
            <meshBasicMaterial color="#1c1917" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default Terrain;
