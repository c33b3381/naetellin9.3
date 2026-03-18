import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

const Player = () => {
  const meshRef = useRef();
  const { position, updatePosition, character, equipment } = useGameStore();
  
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  });
  
  const playerPosRef = useRef(new THREE.Vector3(position.x || 0, 0.5, position.z || 0));
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  
  const SPEED = 8;
  const SPRINT_MULTIPLIER = 1.8;

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(k => ({ ...k, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys(k => ({ ...k, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(k => ({ ...k, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys(k => ({ ...k, right: true }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys(k => ({ ...k, sprint: true }));
          break;
      }
    };
    
    const handleKeyUp = (e) => {
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(k => ({ ...k, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys(k => ({ ...k, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(k => ({ ...k, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys(k => ({ ...k, right: false }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys(k => ({ ...k, sprint: false }));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Calculate direction
    direction.current.set(0, 0, 0);
    
    if (keys.forward) direction.current.z -= 1;
    if (keys.backward) direction.current.z += 1;
    if (keys.left) direction.current.x -= 1;
    if (keys.right) direction.current.x += 1;
    
    // Normalize and apply speed
    if (direction.current.length() > 0) {
      direction.current.normalize();
      const speed = keys.sprint ? SPEED * SPRINT_MULTIPLIER : SPEED;
      
      velocity.current.x = direction.current.x * speed * delta;
      velocity.current.z = direction.current.z * speed * delta;
      
      // Update position
      playerPosRef.current.x += velocity.current.x;
      playerPosRef.current.z += velocity.current.z;
      
      // Clamp to world bounds
      playerPosRef.current.x = THREE.MathUtils.clamp(playerPosRef.current.x, -80, 80);
      playerPosRef.current.z = THREE.MathUtils.clamp(playerPosRef.current.z, -80, 80);
      
      // Rotate player to face movement direction
      const angle = Math.atan2(direction.current.x, direction.current.z);
      meshRef.current.rotation.y = angle;
    }
    
    // Apply position
    meshRef.current.position.copy(playerPosRef.current);
    
    // Camera follow
    state.camera.position.x = playerPosRef.current.x;
    state.camera.position.z = playerPosRef.current.z + 20;
    state.camera.lookAt(playerPosRef.current.x, 2, playerPosRef.current.z);
  });

  // Sync position to server periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (meshRef.current) {
        updatePosition({
          x: playerPosRef.current.x,
          y: playerPosRef.current.y,
          z: playerPosRef.current.z,
          zone: 'starter_village'
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [updatePosition]);

  // Get class color
  const getClassColor = () => {
    switch(character?.class_type) {
      case 'warrior': return '#dc2626';
      case 'mage': return '#3b82f6';
      case 'ranger': return '#059669';
      case 'paladin': return '#fbbf24';
      default: return '#fbbf24';
    }
  };

  return (
    <group ref={meshRef} position={[position.x || 0, 0.5, position.z || 0]}>
      {/* Body */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.4, 1, 8, 16]} />
        <meshStandardMaterial color={character?.skin_tone || '#D2B48C'} />
      </mesh>
      
      {/* Head */}
      <mesh castShadow position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={character?.skin_tone || '#D2B48C'} />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={character?.hair_color || '#8B4513'} />
      </mesh>
      
      {/* Class Indicator */}
      <mesh position={[0, 2.5, 0]}>
        <ringGeometry args={[0.15, 0.2, 6]} />
        <meshBasicMaterial color={getClassColor()} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default Player;
