/**
 * World Asset Factory
 * Procedural mesh generation for all world objects (trees, buildings, NPCs, etc.)
 * 
 * This is a pure factory - it creates and returns THREE.Group objects
 * without adding them to the scene or modifying any external state.
 * The caller is responsible for:
 * - Positioning the group (group.position.set)
 * - Adding to scene (scene.add)
 * - Adding to selectableObjects if needed
 * 
 * Extracted from GameWorld.jsx for modularity
 */

import * as THREE from 'three';

/**
 * Create a procedural world asset mesh
 * @param {string} fullType - Asset type identifier (e.g., 'tree_pine', 'npc_guard')
 * @param {number} scale - Scale multiplier (default 1)
 * @param {string} name - Display name for the asset
 * @param {number} level - Level for NPCs/monsters
 * @returns {THREE.Group} The constructed asset group (not positioned, not added to scene)
 */
export const createWorldAsset = (fullType, scale = 1, name = '', level = 1) => {
  let group = new THREE.Group();
  group.name = name || fullType;
  
  // Get material helpers
  const wood = () => new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  const stone = () => new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.95 });
  const metal = () => new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.6, roughness: 0.4 });
  const gold = () => new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
  const leaf = () => new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
  const darkLeaf = () => new THREE.MeshStandardMaterial({ color: 0x1a4d1a, roughness: 0.8 });
  
  switch (fullType) {
    // ========== TREES ==========
    case 'tree_pine':
    case 'tree': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 2 * scale, 8), wood());
      trunk.position.y = scale;
      trunk.castShadow = true;
      group.add(trunk);
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry((1.5 - i * 0.3) * scale, (1.5 - i * 0.2) * scale, 8),
          leaf()
        );
        cone.position.y = (2 + i * 1) * scale;
        cone.castShadow = true;
        group.add(cone);
      }
      group.userData = { type: 'tree', interactable: true, resource: 'wood' };
      break;
    }
    case 'tree_oak': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 2.5 * scale, 8), wood());
      trunk.position.y = 1.25 * scale;
      trunk.castShadow = true;
      group.add(trunk);
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(2 * scale, 8, 8), leaf());
      foliage.position.y = 3.5 * scale;
      foliage.castShadow = true;
      group.add(foliage);
      group.userData = { type: 'tree', interactable: true, resource: 'wood' };
      break;
    }
    case 'tree_dead': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.35 * scale, 3 * scale, 6), 
        new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 1 }));
      trunk.position.y = 1.5 * scale;
      group.add(trunk);
      // Dead branches
      for (let i = 0; i < 3; i++) {
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.1 * scale, 1 * scale, 4),
          new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
        branch.position.set(0.3 * Math.cos(i * 2) * scale, (2 + i * 0.3) * scale, 0.3 * Math.sin(i * 2) * scale);
        branch.rotation.z = Math.PI / 4;
        group.add(branch);
      }
      group.userData = { type: 'tree', interactable: true, resource: 'deadwood' };
      break;
    }
    case 'tree_palm': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 4 * scale, 8), 
        new THREE.MeshStandardMaterial({ color: 0x8B7355 }));
      trunk.position.y = 2 * scale;
      group.add(trunk);
      for (let i = 0; i < 6; i++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.3 * scale, 2 * scale, 4), leaf());
        frond.position.y = 4 * scale;
        frond.rotation.x = Math.PI / 3;
        frond.rotation.y = (i / 6) * Math.PI * 2;
        group.add(frond);
      }
      group.userData = { type: 'tree', interactable: true };
      break;
    }
    case 'tree_willow': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 8), wood());
      trunk.position.y = 1.5 * scale;
      group.add(trunk);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.5 * scale, 8, 8), darkLeaf());
      canopy.position.y = 3.5 * scale;
      canopy.scale.y = 0.6;
      group.add(canopy);
      group.userData = { type: 'tree', interactable: true, resource: 'wood' };
      break;
    }
    
    // ========== PLANTS ==========
    case 'bush': {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.6 * scale, 8, 8), leaf());
      bush.position.y = 0.4 * scale;
      bush.scale.y = 0.7;
      group.add(bush);
      group.userData = { type: 'plant' };
      break;
    }
    case 'bush_berry': {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.6 * scale, 8, 8), leaf());
      bush.position.y = 0.4 * scale;
      bush.scale.y = 0.7;
      group.add(bush);
      // Berries
      for (let i = 0; i < 8; i++) {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.06 * scale, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
        berry.position.set(
          (Math.random() - 0.5) * 0.8 * scale,
          0.3 * scale + Math.random() * 0.3 * scale,
          (Math.random() - 0.5) * 0.8 * scale
        );
        group.add(berry);
      }
      group.userData = { type: 'plant', interactable: true, resource: 'berries' };
      break;
    }
    case 'flower_patch': {
      for (let i = 0; i < 6; i++) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4),
          new THREE.MeshStandardMaterial({ color: 0x228B22 }));
        stem.position.set((Math.random() - 0.5) * scale, 0.15, (Math.random() - 0.5) * scale);
        group.add(stem);
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6),
          new THREE.MeshStandardMaterial({ color: [0xff69b4, 0xffff00, 0xff6347, 0x9370db][i % 4] }));
        flower.position.set(stem.position.x, 0.35, stem.position.z);
        group.add(flower);
      }
      group.userData = { type: 'plant' };
      break;
    }
    case 'mushroom': {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.1 * scale, 0.2 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0xf5f5dc }));
      stem.position.y = 0.1 * scale;
      group.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      cap.position.y = 0.25 * scale;
      cap.scale.y = 0.5;
      group.add(cap);
      group.userData = { type: 'plant', interactable: true, resource: 'mushroom' };
      break;
    }
    case 'mushroom_cluster': {
      for (let i = 0; i < 4; i++) {
        const mScale = (0.5 + Math.random() * 0.5) * scale;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * mScale, 0.08 * mScale, 0.15 * mScale, 6),
          new THREE.MeshStandardMaterial({ color: 0xf5f5dc }));
        stem.position.set((Math.random() - 0.5) * 0.5, 0.075 * mScale, (Math.random() - 0.5) * 0.5);
        group.add(stem);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15 * mScale, 6, 6),
          new THREE.MeshStandardMaterial({ color: [0xdc2626, 0x8b4513, 0xf5f5dc][i % 3] }));
        cap.position.set(stem.position.x, 0.2 * mScale, stem.position.z);
        cap.scale.y = 0.5;
        group.add(cap);
      }
      group.userData = { type: 'plant', interactable: true, resource: 'mushroom' };
      break;
    }
    case 'log':
    case 'stump': {
      const log = new THREE.Mesh(
        fullType === 'log' 
          ? new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 2 * scale, 8)
          : new THREE.CylinderGeometry(0.4 * scale, 0.5 * scale, 0.5 * scale, 8),
        wood()
      );
      if (fullType === 'log') {
        log.rotation.z = Math.PI / 2;
        log.position.y = 0.3 * scale;
      } else {
        log.position.y = 0.25 * scale;
      }
      group.add(log);
      group.userData = { type: 'prop' };
      break;
    }
    case 'tall_grass': {
      for (let i = 0; i < 12; i++) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.4 * scale, 4),
          new THREE.MeshStandardMaterial({ color: 0x90EE90 }));
        blade.position.set((Math.random() - 0.5) * scale, 0.2 * scale, (Math.random() - 0.5) * scale);
        blade.rotation.x = (Math.random() - 0.5) * 0.3;
        group.add(blade);
      }
      group.userData = { type: 'plant' };
      break;
    }
    
    // ========== ROCKS ==========
    case 'rock_small': {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 * scale, 0), stone());
      rock.position.y = 0.2 * scale;
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rock);
      group.userData = { type: 'prop' };
      break;
    }
    case 'rock_medium': {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 * scale, 0), stone());
      rock.position.y = 0.4 * scale;
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rock);
      group.userData = { type: 'prop' };
      break;
    }
    case 'rock_large': {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5 * scale, 1), stone());
      rock.position.y = 0.75 * scale;
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      group.add(rock);
      group.userData = { type: 'prop' };
      break;
    }
    case 'rock_flat': {
      const rock = new THREE.Mesh(new THREE.CylinderGeometry(1 * scale, 1.2 * scale, 0.3 * scale, 8), stone());
      rock.position.y = 0.15 * scale;
      group.add(rock);
      group.userData = { type: 'prop' };
      break;
    }
    case 'rock_cluster': {
      for (let i = 0; i < 4; i++) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry((0.3 + Math.random() * 0.4) * scale, 0), stone());
        rock.position.set((Math.random() - 0.5) * scale, 0.2 * scale, (Math.random() - 0.5) * scale);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        group.add(rock);
      }
      group.userData = { type: 'prop' };
      break;
    }
    case 'ore_copper':
    case 'ore_iron':
    case 'ore_gold':
    case 'ore_crystal':
    case 'ore_mithril': {
      const oreColors = { ore_copper: 0xb87333, ore_iron: 0x434343, ore_gold: 0xffd700, ore_crystal: 0x87ceeb, ore_mithril: 0xc0c0ff };
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 * scale, 0), stone());
      rock.position.y = 0.4 * scale;
      group.add(rock);
      // Ore veins
      for (let i = 0; i < 3; i++) {
        const vein = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 * scale, 0),
          new THREE.MeshStandardMaterial({ color: oreColors[fullType], metalness: 0.7, roughness: 0.3 }));
        vein.position.set((Math.random() - 0.5) * 0.5 * scale, 0.3 + Math.random() * 0.3, (Math.random() - 0.5) * 0.5 * scale);
        group.add(vein);
      }
      group.userData = { type: 'resource', resource: fullType.replace('ore_', ''), interactable: true };
      break;
    }
    case 'crystal_large':
    case 'stalagmite': {
      const mat = fullType === 'crystal_large' 
        ? new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.8, metalness: 0.3 })
        : stone();
      for (let i = 0; i < 3; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.3 * scale, (1 + Math.random()) * scale, 6), mat);
        spike.position.set((Math.random() - 0.5) * 0.5, 0.5 * scale, (Math.random() - 0.5) * 0.5);
        group.add(spike);
      }
      group.userData = { type: 'prop' };
      break;
    }
    
    // ========== BUILDINGS ==========
    case 'house_small':
    case 'house_medium':
    case 'house_large': {
      const sizes = { house_small: 1, house_medium: 1.5, house_large: 2 };
      const s = sizes[fullType] * scale;
      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(3 * s, 2 * s, 3 * s), 
        new THREE.MeshStandardMaterial({ color: 0xd4a574 }));
      base.position.y = s;
      base.castShadow = true;
      group.add(base);
      // Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5 * s, 1.5 * s, 4), 
        new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      roof.position.y = 2.75 * s;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);
      // Door
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 1.2 * s, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x4a3728 }));
      door.position.set(0, 0.6 * s, 1.51 * s);
      group.add(door);
      group.userData = { type: 'building' };
      break;
    }
    case 'shop':
    case 'inn': {
      const s = scale;
      const base = new THREE.Mesh(new THREE.BoxGeometry(4 * s, 2.5 * s, 4 * s),
        new THREE.MeshStandardMaterial({ color: fullType === 'shop' ? 0xc9aa71 : 0xb8860b }));
      base.position.y = 1.25 * s;
      base.castShadow = true;
      group.add(base);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.5 * s, 0.3 * s, 4.5 * s),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      roof.position.y = 2.65 * s;
      group.add(roof);
      // Sign
      const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 1.5 * s, 6), wood());
      signPost.position.set(2.2 * s, 1.5 * s, 0);
      group.add(signPost);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.4 * s, 0.05 * s), wood());
      sign.position.set(2.2 * s, 2.2 * s, 0);
      group.add(sign);
      group.userData = { type: 'building', buildingType: fullType };
      break;
    }
    case 'tower':
    case 'tower_mage': {
      const s = scale;
      const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5 * s, 2 * s, 6 * s, 8), stone());
      towerBase.position.y = 3 * s;
      towerBase.castShadow = true;
      group.add(towerBase);
      const towerTop = new THREE.Mesh(new THREE.ConeGeometry(2 * s, 2 * s, 8),
        new THREE.MeshStandardMaterial({ color: fullType === 'tower_mage' ? 0x4a148c : 0x8B4513 }));
      towerTop.position.y = 7 * s;
      group.add(towerTop);
      group.userData = { type: 'building', buildingType: fullType };
      break;
    }
    case 'castle_wall': {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(6 * scale, 4 * scale, 1 * scale), stone());
      wall.position.y = 2 * scale;
      wall.castShadow = true;
      group.add(wall);
      // Battlements
      for (let i = 0; i < 4; i++) {
        const battlement = new THREE.Mesh(new THREE.BoxGeometry(1 * scale, 0.8 * scale, 1.2 * scale), stone());
        battlement.position.set((i - 1.5) * 1.5 * scale, 4.4 * scale, 0);
        group.add(battlement);
      }
      group.userData = { type: 'building', buildingType: 'wall' };
      break;
    }
    case 'castle_gate': {
      const s = scale;
      // Gate posts
      for (let side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 5 * s, 1.5 * s), stone());
        post.position.set(side * 2 * s, 2.5 * s, 0);
        group.add(post);
      }
      // Top
      const top = new THREE.Mesh(new THREE.BoxGeometry(5.5 * s, 1 * s, 1.5 * s), stone());
      top.position.y = 5 * s;
      group.add(top);
      // Gate
      const gate = new THREE.Mesh(new THREE.BoxGeometry(2.5 * s, 4 * s, 0.3 * s), wood());
      gate.position.y = 2 * s;
      group.add(gate);
      group.userData = { type: 'building', buildingType: 'gate' };
      break;
    }
    case 'church': {
      const s = scale;
      const base = new THREE.Mesh(new THREE.BoxGeometry(4 * s, 3 * s, 6 * s),
        new THREE.MeshStandardMaterial({ color: 0xe8e8e8 }));
      base.position.y = 1.5 * s;
      group.add(base);
      const steeple = new THREE.Mesh(new THREE.ConeGeometry(1 * s, 4 * s, 4),
        new THREE.MeshStandardMaterial({ color: 0x696969 }));
      steeple.position.set(0, 5 * s, -2 * s);
      group.add(steeple);
      group.userData = { type: 'building', buildingType: 'church' };
      break;
    }
    case 'windmill': {
      const s = scale;
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1 * s, 1.5 * s, 4 * s, 8),
        new THREE.MeshStandardMaterial({ color: 0xd4a574 }));
      tower.position.y = 2 * s;
      group.add(tower);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5 * s, 1 * s, 8),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      roof.position.y = 4.5 * s;
      group.add(roof);
      // Blades
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 2.5 * s, 0.05 * s), wood());
        blade.position.set(0, 3.5 * s, 1.1 * s);
        blade.rotation.z = (i / 4) * Math.PI * 2;
        group.add(blade);
      }
      group.userData = { type: 'building', buildingType: 'windmill' };
      break;
    }
    case 'barn': {
      const s = scale;
      const base = new THREE.Mesh(new THREE.BoxGeometry(5 * s, 3 * s, 4 * s),
        new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      base.position.y = 1.5 * s;
      group.add(base);
      // Barn roof
      const roofGeo = new THREE.BufferGeometry();
      const roofVerts = new Float32Array([
        -2.6*s, 3*s, -2.1*s, 2.6*s, 3*s, -2.1*s, 0, 4.5*s, -2.1*s,
        -2.6*s, 3*s, 2.1*s, 2.6*s, 3*s, 2.1*s, 0, 4.5*s, 2.1*s
      ]);
      roofGeo.setAttribute('position', new THREE.BufferAttribute(roofVerts, 3));
      roofGeo.setIndex([0,1,2, 3,5,4, 0,3,1, 1,3,4, 1,4,2, 2,4,5, 0,2,5, 0,5,3]);
      roofGeo.computeVertexNormals();
      const roofMesh = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0x8B4513, side: THREE.DoubleSide }));
      group.add(roofMesh);
      group.userData = { type: 'building', buildingType: 'barn' };
      break;
    }
    case 'well': {
      const s = scale;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * s, 1 * s, 0.8 * s, 12), stone());
      base.position.y = 0.4 * s;
      group.add(base);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.6 * s, 0.6 * s, 0.3 * s, 12),
        new THREE.MeshStandardMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.7 }));
      water.position.y = 0.15 * s;
      group.add(water);
      // Posts and roof
      for (let side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 1.5 * s, 6), wood());
        post.position.set(side * 0.7 * s, 1.15 * s, 0);
        group.add(post);
      }
      const roofTop = new THREE.Mesh(new THREE.ConeGeometry(1 * s, 0.5 * s, 4), wood());
      roofTop.position.y = 2.15 * s;
      roofTop.rotation.y = Math.PI / 4;
      group.add(roofTop);
      group.userData = { type: 'prop', interactable: true };
      break;
    }
    case 'fountain': {
      const s = scale;
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.5 * s, 1.8 * s, 0.5 * s, 16), stone());
      basin.position.y = 0.25 * s;
      group.add(basin);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(1.3 * s, 1.3 * s, 0.3 * s, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.7 }));
      water.position.y = 0.35 * s;
      group.add(water);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 1.5 * s, 8), stone());
      pillar.position.y = 1 * s;
      group.add(pillar);
      group.userData = { type: 'prop' };
      break;
    }
    case 'tent':
    case 'tent_large': {
      const s = (fullType === 'tent_large' ? 1.5 : 1) * scale;
      const tent = new THREE.Mesh(new THREE.ConeGeometry(1.5 * s, 2 * s, 4),
        new THREE.MeshStandardMaterial({ color: 0xd4a574 }));
      tent.position.y = 1 * s;
      tent.rotation.y = Math.PI / 4;
      group.add(tent);
      group.userData = { type: 'building', buildingType: 'tent' };
      break;
    }
    case 'campfire': {
      const s = scale;
      // Logs
      for (let i = 0; i < 4; i++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 0.6 * s, 6), wood());
        log.position.set(Math.cos(i * Math.PI / 2) * 0.2 * s, 0.1 * s, Math.sin(i * Math.PI / 2) * 0.2 * s);
        log.rotation.z = Math.PI / 2;
        log.rotation.y = i * Math.PI / 2;
        group.add(log);
      }
      // Fire
      const fire = new THREE.Mesh(new THREE.ConeGeometry(0.3 * s, 0.6 * s, 8),
        new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1 }));
      fire.position.y = 0.4 * s;
      group.add(fire);
      // Light
      const fireLight = new THREE.PointLight(0xff6600, 1, 5 * s);
      fireLight.position.y = 0.5 * s;
      group.add(fireLight);
      group.userData = { type: 'prop', hasLight: true };
      break;
    }
    case 'ruins': {
      const s = scale;
      // Broken walls
      for (let i = 0; i < 3; i++) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry((1 + Math.random()) * s, (1 + Math.random() * 2) * s, 0.4 * s), stone());
        wall.position.set((Math.random() - 0.5) * 3 * s, wall.geometry.parameters.height / 2, (Math.random() - 0.5) * 3 * s);
        wall.rotation.y = Math.random() * Math.PI;
        group.add(wall);
      }
      // Rubble
      for (let i = 0; i < 5; i++) {
        const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 * s, 0), stone());
        rubble.position.set((Math.random() - 0.5) * 3 * s, 0.1 * s, (Math.random() - 0.5) * 3 * s);
        group.add(rubble);
      }
      group.userData = { type: 'building', buildingType: 'ruins' };
      break;
    }
    case 'bridge_wood':
    case 'bridge_stone': {
      const s = scale;
      const mat = fullType === 'bridge_wood' ? wood() : stone();
      // Deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(2 * s, 0.2 * s, 6 * s), mat);
      deck.position.y = 0.5 * s;
      group.add(deck);
      // Rails
      for (let side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.5 * s, 6 * s), mat);
        rail.position.set(side * 0.95 * s, 0.85 * s, 0);
        group.add(rail);
      }
      group.userData = { type: 'prop' };
      break;
    }
    case 'dock': {
      const s = scale;
      // Planks
      const planks = new THREE.Mesh(new THREE.BoxGeometry(3 * s, 0.15 * s, 8 * s), wood());
      planks.position.y = 0.3 * s;
      group.add(planks);
      // Posts
      for (let i = 0; i < 4; i++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 1.5 * s, 6), wood());
        post.position.set((i % 2 === 0 ? -1 : 1) * 1.3 * s, -0.45 * s, (Math.floor(i / 2) - 0.5) * 5 * s);
        group.add(post);
      }
      group.userData = { type: 'prop' };
      break;
    }
    case 'blacksmith': {
      const s = scale;
      // Building
      const building = new THREE.Mesh(new THREE.BoxGeometry(4 * s, 2.5 * s, 4 * s),
        new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
      building.position.y = 1.25 * s;
      group.add(building);
      // Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.5 * s, 0.3 * s, 4.5 * s),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a }));
      roof.position.y = 2.65 * s;
      group.add(roof);
      // Chimney with smoke effect
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 1.5 * s, 0.6 * s), stone());
      chimney.position.set(1.5 * s, 3.25 * s, 1.5 * s);
      group.add(chimney);
      group.userData = { type: 'building', buildingType: 'blacksmith' };
      break;
    }
    
    // ========== PROPS ==========
    case 'barrel':
    case 'barrel_stack': {
      const s = scale;
      const createBarrel = (px, py, pz) => {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * s, 0.35 * s, 0.7 * s, 12), wood());
        barrel.position.set(px, py + 0.35 * s, pz);
        return barrel;
      };
      group.add(createBarrel(0, 0, 0));
      if (fullType === 'barrel_stack') {
        group.add(createBarrel(0.6 * s, 0, 0));
        group.add(createBarrel(0.3 * s, 0.7 * s, 0));
      }
      group.userData = { type: 'prop', interactable: true };
      break;
    }
    case 'crate':
    case 'crate_stack': {
      const s = scale;
      const createCrate = (px, py, pz) => {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.6 * s, 0.6 * s), wood());
        crate.position.set(px, py + 0.3 * s, pz);
        return crate;
      };
      group.add(createCrate(0, 0, 0));
      if (fullType === 'crate_stack') {
        group.add(createCrate(0.5 * s, 0, 0.3 * s));
        group.add(createCrate(0.25 * s, 0.6 * s, 0.15 * s));
      }
      group.userData = { type: 'prop', interactable: true };
      break;
    }
    case 'cart':
    case 'wagon': {
      const s = scale;
      const isWagon = fullType === 'wagon';
      const bed = new THREE.Mesh(new THREE.BoxGeometry((isWagon ? 2.5 : 1.5) * s, 0.3 * s, 1.2 * s), wood());
      bed.position.y = 0.5 * s;
      group.add(bed);
      // Wheels
      for (let i = 0; i < (isWagon ? 4 : 2); i++) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.3 * s, 0.1 * s, 12), wood());
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(
          (i % 2 === 0 ? -1 : 1) * (isWagon ? 0.8 : 0.5) * s,
          0.3 * s,
          (isWagon ? (Math.floor(i / 2) - 0.5) * 0.8 : 0) * s
        );
        group.add(wheel);
      }
      group.userData = { type: 'prop' };
      break;
    }
    case 'fence_wood':
    case 'fence_stone':
    case 'fence_iron': {
      const s = scale;
      const mats = { fence_wood: wood(), fence_stone: stone(), fence_iron: metal() };
      const mat = mats[fullType];
      // Posts
      for (let i = 0; i < 3; i++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 1 * s, 0.15 * s), mat);
        post.position.set((i - 1) * 1.5 * s, 0.5 * s, 0);
        group.add(post);
      }
      // Rails
      for (let h of [0.3, 0.7]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(3 * s, 0.1 * s, 0.08 * s), mat);
        rail.position.y = h * s;
        group.add(rail);
      }
      group.userData = { type: 'prop' };
      break;
    }
    case 'lamp_post': {
      const s = scale;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 3 * s, 8), metal());
      post.position.y = 1.5 * s;
      group.add(post);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffff99, emissive: 0xffff00, emissiveIntensity: 0.5 }));
      lamp.position.y = 3.1 * s;
      group.add(lamp);
      const light = new THREE.PointLight(0xffff99, 0.5, 8 * s);
      light.position.y = 3.1 * s;
      group.add(light);
      group.userData = { type: 'prop', hasLight: true };
      break;
    }
    case 'torch':
    case 'torch_wall': {
      const s = scale;
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.05 * s, 0.6 * s, 6), wood());
      stick.position.y = 0.3 * s;
      if (fullType === 'torch_wall') stick.rotation.x = -Math.PI / 6;
      group.add(stick);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08 * s, 0.2 * s, 6),
        new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1 }));
      flame.position.y = 0.7 * s;
      if (fullType === 'torch_wall') flame.position.z = -0.1 * s;
      group.add(flame);
      const light = new THREE.PointLight(0xff6600, 0.3, 4 * s);
      light.position.copy(flame.position);
      group.add(light);
      group.userData = { type: 'prop', hasLight: true };
      break;
    }
    case 'banner': {
      const s = scale;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 3 * s, 6), wood());
      pole.position.y = 1.5 * s;
      group.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * s, 1.2 * s),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, side: THREE.DoubleSide }));
      flag.position.set(0.45 * s, 2.4 * s, 0);
      group.add(flag);
      group.userData = { type: 'prop' };
      break;
    }
    case 'sign_post': {
      const s = scale;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 2 * s, 6), wood());
      post.position.y = 1 * s;
      group.add(post);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(1 * s, 0.5 * s, 0.08 * s), wood());
      sign.position.set(0.3 * s, 1.7 * s, 0);
      group.add(sign);
      group.userData = { type: 'prop' };
      break;
    }
    case 'grave':
    case 'grave_cross': {
      const s = scale;
      if (fullType === 'grave') {
        const stone_grave = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.8 * s, 0.15 * s), stone());
        stone_grave.position.y = 0.4 * s;
        stone_grave.rotation.x = -0.1;
        group.add(stone_grave);
      } else {
        const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 1.2 * s, 0.1 * s), wood());
        vertical.position.y = 0.6 * s;
        group.add(vertical);
        const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.15 * s, 0.1 * s), wood());
        horizontal.position.y = 0.9 * s;
        group.add(horizontal);
      }
      group.userData = { type: 'prop' };
      break;
    }
    case 'statue':
    case 'statue_hero': {
      const s = scale;
      // Pedestal
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1 * s, 0.5 * s, 1 * s), stone());
      pedestal.position.y = 0.25 * s;
      group.add(pedestal);
      // Figure
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25 * s, 0.8 * s, 8, 16), stone());
      body.position.y = 1.15 * s;
      group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 8, 8), stone());
      head.position.y = 1.75 * s;
      group.add(head);
      if (fullType === 'statue_hero') {
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 1 * s, 0.02 * s), metal());
        sword.position.set(0.4 * s, 1.3 * s, 0);
        sword.rotation.z = -Math.PI / 6;
        group.add(sword);
      }
      group.userData = { type: 'prop' };
      break;
    }
    case 'bench':
    case 'table':
    case 'chair': {
      const s = scale;
      if (fullType === 'bench') {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.1 * s, 0.4 * s), wood());
        seat.position.y = 0.45 * s;
        group.add(seat);
        for (let i = 0; i < 4; i++) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.4 * s, 0.1 * s), wood());
          leg.position.set((i < 2 ? -0.6 : 0.6) * s, 0.2 * s, (i % 2 === 0 ? -0.12 : 0.12) * s);
          group.add(leg);
        }
      } else if (fullType === 'table') {
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 0.1 * s, 0.8 * s), wood());
        top.position.y = 0.75 * s;
        group.add(top);
        for (let i = 0; i < 4; i++) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.7 * s, 0.08 * s), wood());
          leg.position.set((i < 2 ? -0.5 : 0.5) * s, 0.35 * s, (i % 2 === 0 ? -0.3 : 0.3) * s);
          group.add(leg);
        }
      } else {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.08 * s, 0.4 * s), wood());
        seat.position.y = 0.45 * s;
        group.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.5 * s, 0.08 * s), wood());
        back.position.set(0, 0.7 * s, -0.16 * s);
        group.add(back);
        for (let i = 0; i < 4; i++) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06 * s, 0.4 * s, 0.06 * s), wood());
          leg.position.set((i < 2 ? -0.15 : 0.15) * s, 0.2 * s, (i % 2 === 0 ? -0.15 : 0.15) * s);
          group.add(leg);
        }
      }
      group.userData = { type: 'prop' };
      break;
    }
    case 'anvil': {
      const s = scale;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.3 * s, 0.6 * s), metal());
      base.position.y = 0.15 * s;
      group.add(base);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.2 * s, 0.8 * s), metal());
      top.position.y = 0.4 * s;
      group.add(top);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1 * s, 0.4 * s, 8), metal());
      horn.position.set(0, 0.4 * s, 0.5 * s);
      horn.rotation.x = Math.PI / 2;
      group.add(horn);
      group.userData = { type: 'prop', interactable: true };
      break;
    }
    case 'hay_pile': {
      const s = scale;
      const hay = new THREE.Mesh(new THREE.ConeGeometry(1 * s, 1 * s, 8),
        new THREE.MeshStandardMaterial({ color: 0xdaa520 }));
      hay.position.y = 0.5 * s;
      group.add(hay);
      group.userData = { type: 'prop' };
      break;
    }
    case 'sack': {
      const s = scale;
      const sack = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xd2b48c }));
      sack.position.y = 0.25 * s;
      sack.scale.y = 1.3;
      group.add(sack);
      group.userData = { type: 'prop' };
      break;
    }
    case 'weapon_rack': {
      const s = scale;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 1.5 * s, 0.2 * s), wood());
      frame.position.y = 0.9 * s;
      group.add(frame);
      for (let i = 0; i < 3; i++) {
        const sword_rack = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.8 * s, 0.02 * s), metal());
        sword_rack.position.set((i - 1) * 0.4 * s, 0.9 * s, 0.15 * s);
        group.add(sword_rack);
      }
      group.userData = { type: 'prop' };
      break;
    }
    case 'armor_stand': {
      const s = scale;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.08 * s, 1.8 * s, 6), wood());
      pole.position.y = 0.9 * s;
      group.add(pole);
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.5 * s, 0.3 * s), metal());
      chest.position.y = 1.3 * s;
      group.add(chest);
      const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.15 * s, 0.3 * s), metal());
      shoulders.position.y = 1.6 * s;
      group.add(shoulders);
      group.userData = { type: 'prop' };
      break;
    }
    case 'boat_small': {
      const s = scale;
      const hull = new THREE.Mesh(new THREE.BoxGeometry(1 * s, 0.3 * s, 2 * s), wood());
      hull.position.y = 0.15 * s;
      group.add(hull);
      group.userData = { type: 'prop' };
      break;
    }
    
    // ========== SPECIAL ==========
    case 'portal':
    case 'portal_dungeon': {
      const s = scale;
      const portalColor = fullType === 'portal_dungeon' ? 0x8b0000 : 0x8b5cf6;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1 * s, 0.15 * s, 8, 24),
        new THREE.MeshStandardMaterial({ color: portalColor, emissive: portalColor, emissiveIntensity: 0.5 }));
      ring.position.y = 1.2 * s;
      group.add(ring);
      const center = new THREE.Mesh(new THREE.CircleGeometry(0.85 * s, 24),
        new THREE.MeshStandardMaterial({ color: portalColor, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      center.position.y = 1.2 * s;
      group.add(center);
      const light = new THREE.PointLight(portalColor, 1, 5 * s);
      light.position.y = 1.2 * s;
      group.add(light);
      group.userData = { type: 'portal', interactable: true };
      break;
    }
    case 'treasure_chest': {
      const s = scale;
      const chest_box = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.5 * s, 0.5 * s), wood());
      chest_box.position.y = 0.25 * s;
      group.add(chest_box);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.85 * s, 0.15 * s, 0.55 * s), wood());
      lid.position.y = 0.58 * s;
      group.add(lid);
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.15 * s, 0.1 * s), gold());
      lock.position.set(0, 0.3 * s, 0.3 * s);
      group.add(lock);
      group.userData = { type: 'special', interactable: true, loot: true };
      break;
    }
    case 'treasure_pile': {
      const s = scale;
      for (let i = 0; i < 20; i++) {
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 0.02 * s, 8), gold());
        coin.position.set(
          (Math.random() - 0.5) * 0.8 * s,
          Math.random() * 0.3 * s,
          (Math.random() - 0.5) * 0.8 * s
        );
        coin.rotation.x = Math.random() * Math.PI;
        group.add(coin);
      }
      group.userData = { type: 'special', interactable: true, loot: true };
      break;
    }
    case 'magic_circle': {
      const s = scale;
      const circle = new THREE.Mesh(new THREE.RingGeometry(1.5 * s, 1.8 * s, 32),
        new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x8b5cf6, emissiveIntensity: 0.3, side: THREE.DoubleSide }));
      circle.rotation.x = -Math.PI / 2;
      circle.position.y = 0.02;
      group.add(circle);
      group.userData = { type: 'special' };
      break;
    }
    case 'altar': {
      const s = scale;
      const base_altar = new THREE.Mesh(new THREE.BoxGeometry(2 * s, 0.5 * s, 1 * s), stone());
      base_altar.position.y = 0.25 * s;
      group.add(base_altar);
      const top_altar = new THREE.Mesh(new THREE.BoxGeometry(2.2 * s, 0.2 * s, 1.2 * s), stone());
      top_altar.position.y = 0.6 * s;
      group.add(top_altar);
      group.userData = { type: 'special', interactable: true };
      break;
    }
    case 'shrine': {
      const s = scale;
      const base_shrine = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * s, 1 * s, 0.5 * s, 8), stone());
      base_shrine.position.y = 0.25 * s;
      group.add(base_shrine);
      const statue_shrine = new THREE.Mesh(new THREE.ConeGeometry(0.4 * s, 1.2 * s, 4),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 }));
      statue_shrine.position.y = 1.1 * s;
      group.add(statue_shrine);
      group.userData = { type: 'special', interactable: true };
      break;
    }
    case 'obelisk': {
      const s = scale;
      const obelisk_body = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 4 * s, 0.8 * s), stone());
      obelisk_body.position.y = 2 * s;
      group.add(obelisk_body);
      const pyramid = new THREE.Mesh(new THREE.ConeGeometry(0.6 * s, 0.8 * s, 4), stone());
      pyramid.position.y = 4.4 * s;
      pyramid.rotation.y = Math.PI / 4;
      group.add(pyramid);
      group.userData = { type: 'special' };
      break;
    }
    case 'totem': {
      const s = scale;
      const pole_totem = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.4 * s, 3 * s, 8), wood());
      pole_totem.position.y = 1.5 * s;
      group.add(pole_totem);
      for (let i = 0; i < 3; i++) {
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.5 * s, 0.4 * s),
          new THREE.MeshStandardMaterial({ color: [0xdc2626, 0x22c55e, 0x3b82f6][i] }));
        face.position.y = (0.5 + i * 0.8) * s;
        face.position.z = 0.15 * s;
        group.add(face);
      }
      group.userData = { type: 'special' };
      break;
    }
    case 'cauldron': {
      const s = scale;
      const pot = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 12, 12), metal());
      pot.position.y = 0.4 * s;
      pot.scale.y = 0.8;
      group.add(pot);
      const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.4 * s, 12),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.3 }));
      liquid.rotation.x = -Math.PI / 2;
      liquid.position.y = 0.55 * s;
      group.add(liquid);
      group.userData = { type: 'special', interactable: true };
      break;
    }
    case 'spawn_point': {
      const s = scale;
      const marker = new THREE.Mesh(new THREE.RingGeometry(0.8 * s, 1 * s, 16),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.5, side: THREE.DoubleSide }));
      marker.rotation.x = -Math.PI / 2;
      marker.position.y = 0.02;
      group.add(marker);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.3 * s, 0.8 * s, 4),
        new THREE.MeshStandardMaterial({ color: 0x22c55e }));
      arrow.position.y = 0.6 * s;
      group.add(arrow);
      group.userData = { type: 'special', spawnPoint: true };
      break;
    }
    
    // ========== CRAFTING STATIONS ==========
    case 'alchemy_table':
    case 'enchanting_table':
    case 'jeweler_bench':
    case 'inscription_desk': {
      const table = new THREE.Mesh(new THREE.BoxGeometry(1.5 * scale, 0.2 * scale, 1 * scale), wood());
      table.position.y = 0.8 * scale;
      group.add(table);
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.8 * scale, 0.1 * scale), wood());
      leg1.position.set(-0.6 * scale, 0.4 * scale, -0.4 * scale);
      group.add(leg1);
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.8 * scale, 0.1 * scale), wood());
      leg2.position.set(0.6 * scale, 0.4 * scale, -0.4 * scale);
      group.add(leg2);
      // Add colored orb on top for identification
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 8, 8),
        new THREE.MeshStandardMaterial({ color: fullType === 'alchemy_table' ? 0x00ff00 : 0x9933ff, emissive: fullType === 'alchemy_table' ? 0x00ff00 : 0x9933ff, emissiveIntensity: 0.3 }));
      orb.position.y = 1.1 * scale;
      group.add(orb);
      group.userData = { type: 'crafting', interactable: true };
      break;
    }
    case 'cooking_station':
    case 'forge': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.2 * scale, 0.8 * scale, 1.2 * scale), stone());
      base.position.y = 0.4 * scale;
      group.add(base);
      const fire = new THREE.Mesh(new THREE.ConeGeometry(0.3 * scale, 0.5 * scale, 6),
        new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 0.5 }));
      fire.position.y = 1 * scale;
      group.add(fire);
      group.userData = { type: 'crafting', interactable: true };
      break;
    }
    case 'anvil': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.6 * scale, 0.3 * scale, 0.4 * scale), metal());
      base.position.y = 0.15 * scale;
      group.add(base);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.2 * scale, 0.5 * scale), metal());
      top.position.y = 0.4 * scale;
      group.add(top);
      group.userData = { type: 'crafting', interactable: true };
      break;
    }
    case 'grindstone':
    case 'loom':
    case 'spinning_wheel':
    case 'carpenter_bench':
    case 'tanning_rack': {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1 * scale, 1.5 * scale, 0.5 * scale), wood());
      frame.position.y = 0.75 * scale;
      group.add(frame);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * scale, 0.4 * scale, 0.1 * scale, 16),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0.75 * scale, 0);
      group.add(wheel);
      group.userData = { type: 'crafting', interactable: true };
      break;
    }
    case 'potion_brewing': {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 1 * scale, 8), metal());
      stand.position.y = 0.5 * scale;
      group.add(stand);
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 0.6 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 }));
      bottle.position.y = 1.2 * scale;
      group.add(bottle);
      group.userData = { type: 'crafting', interactable: true };
      break;
    }
    
    // ========== FURNITURE ==========
    case 'bed_single':
    case 'bed_double':
    case 'bed_royal': {
      const w = fullType === 'bed_double' || fullType === 'bed_royal' ? 1.5 : 1;
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(w * scale, 0.3 * scale, 2 * scale),
        new THREE.MeshStandardMaterial({ color: fullType === 'bed_royal' ? 0xff0000 : 0xffffff }));
      mattress.position.y = 0.5 * scale;
      group.add(mattress);
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(w * scale, 0.8 * scale, 0.1 * scale), wood());
      headboard.position.set(0, 0.8 * scale, -1 * scale);
      group.add(headboard);
      group.userData = { type: 'furniture' };
      break;
    }
    case 'table':
    case 'dining_table':
    case 'round_table':
    case 'desk':
    case 'writing_desk': {
      const w = fullType.includes('round') ? 1.2 : 1.5;
      const top = new THREE.Mesh(
        fullType.includes('round') ? new THREE.CylinderGeometry(0.8 * scale, 0.8 * scale, 0.1 * scale, 16) : new THREE.BoxGeometry(w * scale, 0.1 * scale, 0.8 * scale),
        wood()
      );
      top.position.y = 0.75 * scale;
      group.add(top);
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.7 * scale, 8), wood());
        const angle = (i * Math.PI) / 2;
        leg.position.set(Math.cos(angle) * 0.5 * w * scale, 0.35 * scale, Math.sin(angle) * 0.3 * scale);
        group.add(leg);
      }
      group.userData = { type: 'furniture' };
      break;
    }
    case 'chair':
    case 'armchair':
    case 'stool':
    case 'bench': {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.1 * scale, 0.5 * scale), wood());
      seat.position.y = 0.5 * scale;
      group.add(seat);
      if (fullType !== 'stool') {
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.6 * scale, 0.1 * scale), wood());
        back.position.set(0, 0.8 * scale, -0.2 * scale);
        group.add(back);
      }
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.5 * scale, 6), wood());
        leg.position.set(i < 2 ? -0.2 * scale : 0.2 * scale, 0.25 * scale, i % 2 === 0 ? -0.2 * scale : 0.2 * scale);
        group.add(leg);
      }
      group.userData = { type: 'furniture' };
      break;
    }
    case 'wardrobe':
    case 'cabinet':
    case 'bookcase':
    case 'dresser': {
      const h = fullType === 'wardrobe' ? 2 : 1.5;
      const box = new THREE.Mesh(new THREE.BoxGeometry(1 * scale, h * scale, 0.5 * scale), wood());
      box.position.y = h * scale / 2;
      group.add(box);
      group.userData = { type: 'furniture', interactable: true };
      break;
    }
    case 'throne': {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.2 * scale, 0.8 * scale), gold());
      seat.position.y = 0.6 * scale;
      group.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 1.5 * scale, 0.2 * scale), gold());
      back.position.set(0, 1.3 * scale, -0.3 * scale);
      group.add(back);
      group.userData = { type: 'furniture', special: true };
      break;
    }
    case 'chest_storage': {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.5 * scale, 0.5 * scale), wood());
      box.position.y = 0.25 * scale;
      group.add(box);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.1 * scale, 0.5 * scale), wood());
      lid.position.y = 0.55 * scale;
      group.add(lid);
      group.userData = { type: 'furniture', interactable: true };
      break;
    }
    case 'fireplace': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.5 * scale, 1 * scale, 0.5 * scale), stone());
      base.position.y = 0.5 * scale;
      group.add(base);
      const fire = new THREE.Mesh(new THREE.ConeGeometry(0.3 * scale, 0.5 * scale, 6),
        new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 0.5 }));
      fire.position.y = 0.7 * scale;
      group.add(fire);
      group.userData = { type: 'furniture' };
      break;
    }
    case 'chandelier': {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 1 * scale, 8), metal());
      chain.position.y = 2 * scale;
      group.add(chain);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5 * scale, 0.05 * scale, 8, 16), gold());
      ring.position.y = 1.5 * scale;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      for (let i = 0; i < 6; i++) {
        const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.3 * scale, 8),
          new THREE.MeshStandardMaterial({ color: 0xffffe0 }));
        const angle = (i * Math.PI * 2) / 6;
        candle.position.set(Math.cos(angle) * 0.5 * scale, 1.3 * scale, Math.sin(angle) * 0.5 * scale);
        group.add(candle);
      }
      group.userData = { type: 'furniture' };
      break;
    }
    
    // ========== MARKET & TRADE ==========
    case 'market_stall_food':
    case 'market_stall_cloth':
    case 'market_stall_weapons':
    case 'market_stall_general': {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2 * scale, 0.1 * scale, 1.5 * scale),
        new THREE.MeshStandardMaterial({ color: fullType === 'market_stall_food' ? 0xff6347 : fullType === 'market_stall_cloth' ? 0x4169e1 : 0x8b4513 }));
      roof.position.y = 2 * scale;
      group.add(roof);
      const counter = new THREE.Mesh(new THREE.BoxGeometry(1.8 * scale, 0.8 * scale, 0.5 * scale), wood());
      counter.position.y = 0.8 * scale;
      group.add(counter);
      for (let i = 0; i < 4; i++) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 2 * scale, 8), wood());
        pole.position.set(i < 2 ? -0.8 * scale : 0.8 * scale, 1 * scale, i % 2 === 0 ? -0.6 * scale : 0.6 * scale);
        group.add(pole);
      }
      group.userData = { type: 'market', interactable: true };
      break;
    }
    case 'trading_post':
    case 'bank_counter': {
      const counter = new THREE.Mesh(new THREE.BoxGeometry(2 * scale, 1 * scale, 0.6 * scale), wood());
      counter.position.y = 0.5 * scale;
      group.add(counter);
      group.userData = { type: 'market', interactable: true };
      break;
    }
    case 'auction_podium': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * scale, 1 * scale, 0.5 * scale, 8), stone());
      base.position.y = 0.25 * scale;
      group.add(base);
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 1.5 * scale, 0.6 * scale), wood());
      stand.position.y = 1.25 * scale;
      group.add(stand);
      group.userData = { type: 'market', special: true };
      break;
    }
    case 'notice_board': {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 2 * scale, 8), wood());
      post.position.y = 1 * scale;
      group.add(post);
      const board = new THREE.Mesh(new THREE.BoxGeometry(1 * scale, 1.2 * scale, 0.1 * scale), wood());
      board.position.y = 1.8 * scale;
      group.add(board);
      group.userData = { type: 'market', interactable: true };
      break;
    }
    case 'scales':
    case 'cash_register':
    case 'display_case': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.3 * scale, 0.5 * scale), wood());
      base.position.y = 0.8 * scale;
      group.add(base);
      group.userData = { type: 'market', interactable: true };
      break;
    }
    
    // ========== DUNGEON & PRISON ==========
    case 'prison_cell':
    case 'cage_floor': {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 2 * scale, 8), metal());
          bar.position.set((i - 1.5) * 0.5 * scale, 1 * scale, (j - 1.5) * 0.5 * scale);
          group.add(bar);
        }
      }
      group.userData = { type: 'dungeon' };
      break;
    }
    case 'cage_hanging': {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 2 * scale, 8), metal());
      chain.position.y = 3 * scale;
      group.add(chain);
      const cage = new THREE.Mesh(new THREE.SphereGeometry(0.5 * scale, 8, 8, 0, Math.PI * 2, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a, wireframe: true }));
      cage.position.y = 2 * scale;
      group.add(cage);
      group.userData = { type: 'dungeon' };
      break;
    }
    case 'chains_wall':
    case 'chains_floor': {
      for (let i = 0; i < 3; i++) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(0.15 * scale, 0.05 * scale, 8, 16), metal());
        link.position.y = i * 0.3 * scale;
        link.rotation.x = Math.PI / 2;
        group.add(link);
      }
      group.userData = { type: 'dungeon' };
      break;
    }
    case 'stocks':
    case 'pillory': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 1 * scale, 0.3 * scale), wood());
      base.position.y = 0.5 * scale;
      group.add(base);
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.5 * scale, 0.3 * scale, 0.3 * scale), wood());
      top.position.y = 1.2 * scale;
      group.add(top);
      group.userData = { type: 'dungeon' };
      break;
    }
    case 'torture_rack':
    case 'iron_maiden': {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 2 * scale, 0.5 * scale), metal());
      box.position.y = 1 * scale;
      group.add(box);
      group.userData = { type: 'dungeon' };
      break;
    }
    case 'spike_trap': {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1 * scale, 0.1 * scale, 1 * scale), metal());
      plate.position.y = 0.05 * scale;
      group.add(plate);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05 * scale, 0.3 * scale, 6), metal());
          spike.position.set((i - 1.5) * 0.25 * scale, 0.25 * scale, (j - 1.5) * 0.25 * scale);
          group.add(spike);
        }
      }
      group.userData = { type: 'dungeon', trap: true };
      break;
    }
    case 'pressure_plate':
    case 'dungeon_door': {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.2 * scale, 0.1 * scale, 1.2 * scale), stone());
      plate.position.y = 0.05 * scale;
      group.add(plate);
      group.userData = { type: 'dungeon' };
      break;
    }
    
    // ========== AGRICULTURE ==========
    case 'farm_plot_empty':
    case 'farm_plot_wheat':
    case 'farm_plot_corn':
    case 'farm_plot_vegetables': {
      const plot = new THREE.Mesh(new THREE.BoxGeometry(2 * scale, 0.1 * scale, 2 * scale),
        new THREE.MeshStandardMaterial({ color: 0x654321 }));
      plot.position.y = 0.05 * scale;
      group.add(plot);
      if (fullType !== 'farm_plot_empty') {
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            const crop = new THREE.Mesh(new THREE.ConeGeometry(0.05 * scale, 0.3 * scale, 6),
              new THREE.MeshStandardMaterial({ color: fullType === 'farm_plot_wheat' ? 0xffd700 : 0x228B22 }));
            crop.position.set((i - 3.5) * 0.25 * scale, 0.2 * scale, (j - 3.5) * 0.25 * scale);
            group.add(crop);
          }
        }
      }
      group.userData = { type: 'agriculture', interactable: true };
      break;
    }
    case 'scarecrow': {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 2 * scale, 8), wood());
      post.position.y = 1 * scale;
      group.add(post);
      const arms = new THREE.Mesh(new THREE.BoxGeometry(1.5 * scale, 0.1 * scale, 0.1 * scale), wood());
      arms.position.y = 1.5 * scale;
      group.add(arms);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffa500 }));
      head.position.y = 2.2 * scale;
      group.add(head);
      group.userData = { type: 'agriculture' };
      break;
    }
    case 'plow':
    case 'water_trough':
    case 'feed_trough': {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1 * scale, 0.5 * scale, 0.5 * scale), wood());
      box.position.y = 0.25 * scale;
      group.add(box);
      group.userData = { type: 'agriculture' };
      break;
    }
    case 'chicken_coop':
    case 'stable':
    case 'silo': {
      const h = fullType === 'silo' ? 3 : 2;
      const building = new THREE.Mesh(new THREE.CylinderGeometry(1 * scale, 1 * scale, h * scale, 8), wood());
      building.position.y = h * scale / 2;
      group.add(building);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2 * scale, 0.8 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b0000 }));
      roof.position.y = h * scale + 0.4 * scale;
      group.add(roof);
      group.userData = { type: 'agriculture' };
      break;
    }
    case 'beehive': {
      const hive = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * scale, 0.5 * scale, 0.8 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700 }));
      hive.position.y = 0.4 * scale;
      group.add(hive);
      group.userData = { type: 'agriculture', interactable: true };
      break;
    }
    case 'compost_heap': {
      const heap = new THREE.Mesh(new THREE.ConeGeometry(0.8 * scale, 1 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x654321 }));
      heap.position.y = 0.5 * scale;
      group.add(heap);
      group.userData = { type: 'agriculture' };
      break;
    }
    
    // ========== SPECIAL (new items) ==========
    case 'runestone': {
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 1.5 * scale, 0.3 * scale),
        new THREE.MeshStandardMaterial({ color: 0x696969, emissive: 0x4444ff, emissiveIntensity: 0.3 }));
      stone.position.y = 0.75 * scale;
      group.add(stone);
      group.userData = { type: 'special', interactable: true };
      break;
    }
    case 'mystical_tree': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 3 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x4b0082 }));
      trunk.position.y = 1.5 * scale;
      group.add(trunk);
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(2 * scale, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x9400d3, emissive: 0x9400d3, emissiveIntensity: 0.3 }));
      foliage.position.y = 4 * scale;
      group.add(foliage);
      group.userData = { type: 'special', interactable: true };
      break;
    }
    case 'ley_line_node': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * scale, 0.7 * scale, 0.3 * scale, 8), stone());
      base.position.y = 0.15 * scale;
      group.add(base);
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.6 * scale),
        new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5, transparent: true, opacity: 0.8 }));
      crystal.position.y = 1 * scale;
      group.add(crystal);
      group.userData = { type: 'special', magical: true };
      break;
    }
    
    // ========== MONSTERS (simplified) ==========
    default:
      console.log('[createWorldAsset] Default case, fullType:', fullType);
      if (fullType.startsWith('monster_') || fullType.startsWith('npc_') || fullType.startsWith('animal_') || fullType.startsWith('vendor_')) {
        console.log('[createWorldAsset] Creating NPC/Monster/Animal/Vendor');
        // Use existing createMonster/createNPC with appropriate colors
        const monsterColors = {
          monster_goblin: 0x4a7c23, monster_goblin_chief: 0x2d4a15,
          monster_wolf: 0x808080, monster_wolf_alpha: 0x404040,
          monster_bear: 0x8b4513, monster_skeleton: 0xd4d4d4,
          monster_skeleton_warrior: 0xc0c0c0, monster_skeleton_mage: 0xa0a0d0,
          monster_zombie: 0x556b2f, monster_ghost: 0xe0e0ff,
          monster_spider: 0x2d2d2d, monster_spider_queen: 0x1a1a1a,
          monster_troll: 0x556b2f, monster_ogre: 0x8b7355,
          monster_orc: 0x556b2f, monster_orc_chief: 0x3d4a2f,
          monster_bat: 0x2d2d2d, monster_slime: 0x22c55e,
          monster_elemental_fire: 0xff6600, monster_elemental_ice: 0x87ceeb,
          monster_elemental_earth: 0x8b4513, monster_dragon: 0xdc2626,
          monster_wyvern: 0x6b5b4f, monster_demon: 0x8b0000,
          monster_imp: 0xdc2626, monster_golem: 0x696969,
          monster_treant: 0x228b22,
          npc_villager_male: 0xd2b48c, npc_villager_female: 0xdeb887,
          npc_guard: 0x4682b4, npc_guard_captain: 0x2f4f4f,
          npc_merchant: 0xdaa520, npc_blacksmith: 0x696969,
          npc_innkeeper: 0xcd853f, npc_questgiver: 0xffd700,
          npc_trainer_warrior: 0xdc2626, npc_trainer_mage: 0x8b5cf6,
          npc_trainer_ranger: 0x228b22, npc_trainer_paladin: 0xffd700,
          npc_priest: 0xf5f5f5, npc_king: 0xffd700,
          npc_wizard: 0x4b0082, npc_farmer: 0x8b4513,
          npc_fisherman: 0x4682b4, npc_miner: 0x696969, npc_child: 0xffb6c1,
          // Vendor NPCs
          vendor_blacksmith: 0x6b7280, vendor_general: 0x22c55e, vendor_trade: 0xfbbf24,
          vendor_food: 0xf97316, vendor_weapons: 0xdc2626, vendor_armor: 0x3b82f6,
          vendor_potions: 0xa855f7, vendor_magic: 0x8b5cf6,
          animal_chicken: 0xf5f5f5, animal_pig: 0xffb6c1, animal_cow: 0x8b4513,
          animal_sheep: 0xf5f5f5, animal_horse: 0x8b4513, animal_deer: 0xd2691e,
          animal_rabbit: 0xd2b48c, animal_fox: 0xff8c00, animal_crow: 0x1a1a1a,
          animal_owl: 0x8b4513, animal_fish: 0x4682b4, animal_frog: 0x228b22,
          animal_cat: 0x808080, animal_dog: 0xd2691e
        };
        const color = monsterColors[fullType] || 0x808080;
        const isMonster = fullType.startsWith('monster_');
        const isAnimal = fullType.startsWith('animal_');
        const isVendor = fullType.startsWith('vendor_');
        
        // Create simple creature
        const bodyMat = new THREE.MeshStandardMaterial({ color });
        const creatureBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.3 * scale, 0.5 * scale, 8, 16), bodyMat);
        creatureBody.position.y = 0.6 * scale;
        creatureBody.castShadow = true;
        group.add(creatureBody);
        
        const headMat = new THREE.MeshStandardMaterial({ color });
        const creatureHead = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 12, 12), headMat);
        creatureHead.position.y = 1.1 * scale;
        creatureHead.castShadow = true;
        group.add(creatureHead);
        
        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: isMonster ? 0xff0000 : 0x000000 });
        for (let side of [-1, 1]) {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 6, 6), eyeMat);
          eye.position.set(side * 0.08 * scale, 1.15 * scale, 0.15 * scale);
          group.add(eye);
        }
        
        // Determine NPC subtype for trainers
        let trainerClass = null;
        if (fullType.includes('trainer_warrior')) trainerClass = 'warrior';
        else if (fullType.includes('trainer_mage')) trainerClass = 'mage';
        else if (fullType.includes('trainer_ranger')) trainerClass = 'ranger';
        else if (fullType.includes('trainer_paladin')) trainerClass = 'paladin';
        
        // Determine vendor type
        let vendorType = null;
        if (isVendor) {
          vendorType = fullType; // e.g., 'vendor_blacksmith', 'vendor_general', etc.
          // Add vendor indicator (coin icon above head)
          const coinMat = new THREE.MeshStandardMaterial({ 
            color: 0xfbbf24, 
            emissive: 0xfbbf24, 
            emissiveIntensity: 0.6 
          });
          const coinIndicator = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * scale, 0.15 * scale, 0.05 * scale, 16), coinMat);
          coinIndicator.position.y = 1.8 * scale;
          coinIndicator.rotation.x = Math.PI / 2;
          coinIndicator.userData.vendorIndicator = true;
          group.add(coinIndicator);
        }
        
        // Note: Quest markers are added separately when quests are assigned via Quest Maker
        
        group.userData = { 
          type: isMonster ? 'monster' : (isAnimal ? 'animal' : (isVendor ? 'vendor' : (trainerClass ? 'trainer' : 'npc'))),
          hostile: isMonster,
          level: level,
          interactable: true,
          monsterType: fullType.replace('monster_', '').replace('npc_', '').replace('animal_', '').replace('vendor_', ''),
          trainerClass: trainerClass,
          vendorType: vendorType
        };
        console.log('[createWorldAsset] Created creature, group children:', group.children.length);
      } else {
        console.log('[createWorldAsset] Fallback case for:', fullType);
        // Generic fallback renderer - create reasonable defaults based on object type
        const createGenericObject = () => {
          const s = scale;
          
          // Furniture
          if (fullType.startsWith('bed_')) {
            const bed = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.4 * s, 2 * s), wood());
            bed.position.y = 0.2 * s;
            group.add(bed);
            group.userData = { type: 'furniture' };
            return;
          }
          if (fullType.includes('chair') || fullType.includes('stool') || fullType.includes('throne')) {
            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.1 * s, 0.5 * s), wood());
            seat.position.y = 0.5 * s;
            group.add(seat);
            const back = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.7 * s, 0.1 * s), wood());
            back.position.set(0, 0.85 * s, -0.2 * s);
            group.add(back);
            group.userData = { type: 'furniture' };
            return;
          }
          if (fullType.includes('table') || fullType.includes('desk')) {
            const top = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.1 * s, 1 * s), wood());
            top.position.y = 0.8 * s;
            group.add(top);
            for (let corner of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
              const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.8 * s, 0.1 * s), wood());
              leg.position.set(corner[0] * 0.65 * s, 0.4 * s, corner[1] * 0.4 * s);
              group.add(leg);
            }
            group.userData = { type: 'furniture' };
            return;
          }
          if (fullType.includes('wardrobe') || fullType.includes('cabinet') || fullType.includes('bookcase')) {
            const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 2 * s, 0.6 * s), wood());
            cabinet.position.y = 1 * s;
            group.add(cabinet);
            group.userData = { type: 'furniture' };
            return;
          }
          
          // Crafting stations
          if (fullType.includes('_table') || fullType.includes('_bench') || fullType.includes('_station') || fullType.includes('_desk')) {
            const base = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 0.1 * s, 0.8 * s), wood());
            base.position.y = 0.9 * s;
            group.add(base);
            const tool = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.5 * s, 0.3 * s), metal());
            tool.position.set(0.3 * s, 1.2 * s, 0);
            group.add(tool);
            for (let corner of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
              const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.9 * s, 0.1 * s), wood());
              leg.position.set(corner[0] * 0.5 * s, 0.45 * s, corner[1] * 0.3 * s);
              group.add(leg);
            }
            group.userData = { type: 'crafting', interactable: true };
            return;
          }
          
          // Market stalls
          if (fullType.includes('market_stall')) {
            const roof = new THREE.Mesh(new THREE.BoxGeometry(2 * s, 0.1 * s, 1.5 * s), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
            roof.position.y = 2 * s;
            group.add(roof);
            const counter = new THREE.Mesh(new THREE.BoxGeometry(1.8 * s, 0.8 * s, 0.6 * s), wood());
            counter.position.y = 0.8 * s;
            group.add(counter);
            for (let i = 0; i < 4; i++) {
              const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 2 * s, 6), wood());
              post.position.set((i % 2 === 0 ? -0.9 : 0.9) * s, 1 * s, (Math.floor(i / 2) - 0.5) * 0.6 * s);
              group.add(post);
            }
            group.userData = { type: 'building', interactable: true };
            return;
          }
          
          // Agriculture
          if (fullType.includes('farm_plot')) {
            const plot = new THREE.Mesh(new THREE.BoxGeometry(3 * s, 0.1 * s, 3 * s), new THREE.MeshStandardMaterial({ color: 0x4a3f35 }));
            plot.position.y = 0.05 * s;
            group.add(plot);
            if (fullType.includes('wheat') || fullType.includes('corn') || fullType.includes('vegetables')) {
              for (let i = 0; i < 12; i++) {
                const plant = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.4 * s, 0.1 * s), new THREE.MeshStandardMaterial({ color: 0x4a7c23 }));
                plant.position.set((Math.random() - 0.5) * 2.5 * s, 0.3 * s, (Math.random() - 0.5) * 2.5 * s);
                group.add(plant);
              }
            }
            group.userData = { type: 'agriculture' };
            return;
          }
          if (fullType.includes('scarecrow')) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.1 * s, 2 * s, 6), wood());
            post.position.y = 1 * s;
            group.add(post);
            const body = new THREE.Mesh(new THREE.BoxGeometry(1 * s, 0.8 * s, 0.3 * s), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
            body.position.y = 1.3 * s;
            group.add(body);
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.4 * s, 0.4 * s), new THREE.MeshStandardMaterial({ color: 0xdaa520 }));
            head.position.y = 1.9 * s;
            group.add(head);
            group.userData = { type: 'agriculture' };
            return;
          }
          
          // Dungeon items
          if (fullType.includes('cage') || fullType.includes('prison') || fullType.includes('cell')) {
            for (let i = 0; i < 8; i++) {
              const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 2 * s, 6), metal());
              bar.position.set((i - 3.5) * 0.3 * s, 1 * s, 0);
              group.add(bar);
            }
            const top = new THREE.Mesh(new THREE.BoxGeometry(2.5 * s, 0.1 * s, 1 * s), metal());
            top.position.y = 2 * s;
            group.add(top);
            group.userData = { type: 'dungeon' };
            return;
          }
          if (fullType.includes('chains')) {
            for (let i = 0; i < 3; i++) {
              const link = new THREE.Mesh(new THREE.TorusGeometry(0.15 * s, 0.05 * s, 8, 6), metal());
              link.position.y = 1.5 * s - i * 0.4 * s;
              group.add(link);
            }
            group.userData = { type: 'dungeon' };
            return;
          }
          
          // Simple prop fallback based on keywords
          if (fullType.includes('lamp') || fullType.includes('torch') || fullType.includes('light')) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.1 * s, 2 * s, 6), metal());
            post.position.y = 1 * s;
            group.add(post);
            const light = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 8, 8),
              new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xffa500, emissiveIntensity: 0.5 }));
            light.position.y = 2.2 * s;
            group.add(light);
            group.userData = { type: 'prop' };
            return;
          }
          
          if (fullType.includes('statue') || fullType.includes('monument') || fullType.includes('obelisk')) {
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6 * s, 0.8 * s, 0.3 * s, 8), stone());
            base.position.y = 0.15 * s;
            group.add(base);
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * s, 0.4 * s, 2.5 * s, 8), stone());
            pillar.position.y = 1.4 * s;
            group.add(pillar);
            group.userData = { type: 'prop' };
            return;
          }
          
          if (fullType.includes('chest') || fullType.includes('treasure')) {
            const chest = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.6 * s, 0.6 * s), wood());
            chest.position.y = 0.3 * s;
            group.add(chest);
            const lid = new THREE.Mesh(new THREE.BoxGeometry(0.82 * s, 0.15 * s, 0.62 * s), wood());
            lid.position.set(0, 0.675 * s, -0.1 * s);
            lid.rotation.x = -0.5;
            group.add(lid);
            group.userData = { type: 'special', interactable: true };
            return;
          }
          
          // ========== EXPANDED GENERIC FALLBACKS ==========
          
          // Trees (additional types)
          if (fullType.includes('tree_') || fullType === 'tree') {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 2.5 * s, 8), wood());
            trunk.position.y = 1.25 * s;
            group.add(trunk);
            const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.5 * s, 8, 8), leaf());
            foliage.position.y = 3 * s;
            group.add(foliage);
            group.userData = { type: 'tree', interactable: true, resource: 'wood' };
            return;
          }
          
          // Plants (bush variants, ferns, grass, etc.)
          if (fullType.includes('bush') || fullType.includes('fern') || fullType.includes('grass') || fullType.includes('reed') || fullType.includes('ivy') || fullType.includes('vine') || fullType.includes('moss')) {
            const plant = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 8, 8), leaf());
            plant.position.y = 0.3 * s;
            plant.scale.y = 0.7;
            group.add(plant);
            group.userData = { type: 'plant' };
            return;
          }
          
          // Flowers
          if (fullType.includes('flower') || fullType.includes('rose') || fullType.includes('sunflower') || fullType.includes('moonflower') || fullType.includes('lily')) {
            for (let i = 0; i < 5; i++) {
              const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x228B22 }));
              stem.position.set((Math.random() - 0.5) * 0.6 * s, 0.2, (Math.random() - 0.5) * 0.6 * s);
              group.add(stem);
              const flowerHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: [0xff69b4, 0xffff00, 0xff6347, 0x9370db, 0xffffff][i % 5] }));
              flowerHead.position.set(stem.position.x, 0.45, stem.position.z);
              group.add(flowerHead);
            }
            group.userData = { type: 'plant' };
            return;
          }
          
          // Rocks (additional types)  
          if (fullType.includes('rock') || fullType.includes('boulder') || fullType.includes('stone') || fullType.includes('cliff')) {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 * s, 0), stone());
            rock.position.y = 0.4 * s;
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            group.add(rock);
            group.userData = { type: 'rock' };
            return;
          }
          
          // Stalagmite/Stalactite
          if (fullType.includes('stalag')) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.3 * s, 1.5 * s, 6), stone());
            spike.position.y = 0.75 * s;
            group.add(spike);
            group.userData = { type: 'rock' };
            return;
          }
          
          // Crystal variants
          if (fullType.includes('crystal') || fullType.includes('gem') || fullType.includes('geode')) {
            const crystal = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.5 * s, 0),
              new THREE.MeshStandardMaterial({ color: 0x9933ff, transparent: true, opacity: 0.8, emissive: 0x9933ff, emissiveIntensity: 0.3 })
            );
            crystal.position.y = 0.6 * s;
            group.add(crystal);
            group.userData = { type: 'resource', resource: 'crystal', interactable: true };
            return;
          }
          
          // Ore nodes
          if (fullType.includes('ore_')) {
            const oreColors = { ore_copper: 0xb87333, ore_iron: 0x434343, ore_gold: 0xffd700, ore_silver: 0xc0c0c0, ore_mithril: 0x4169e1, ore_adamantite: 0x2f4f4f, ore_darkstone: 0x1a1a1a };
            const color = oreColors[fullType] || 0x808080;
            const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 * s, 0), new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.4 }));
            ore.position.y = 0.4 * s;
            group.add(ore);
            group.userData = { type: 'resource', resource: fullType.replace('ore_', ''), interactable: true };
            return;
          }
          
          // Fences and walls
          if (fullType.includes('fence') || fullType.includes('palisade') || fullType.includes('hedge') || fullType.includes('wall')) {
            const isMetal = fullType.includes('iron');
            const isHedge = fullType.includes('hedge');
            const mat = isHedge ? leaf() : (isMetal ? metal() : wood());
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2 * s, 1.2 * s, 0.15 * s), mat);
            wall.position.y = 0.6 * s;
            group.add(wall);
            group.userData = { type: 'structure' };
            return;
          }
          
          // Gates and doors
          if (fullType.includes('gate') || fullType.includes('door')) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 2.5 * s, 0.3 * s), wood());
            frame.position.y = 1.25 * s;
            group.add(frame);
            group.userData = { type: 'structure', interactable: true };
            return;
          }
          
          // Pillars and columns
          if (fullType.includes('pillar') || fullType.includes('column')) {
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.35 * s, 3 * s, 8), stone());
            pillar.position.y = 1.5 * s;
            group.add(pillar);
            group.userData = { type: 'structure' };
            return;
          }
          
          // Archways
          if (fullType.includes('arch')) {
            const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 3 * s, 0.4 * s), stone());
            leftPillar.position.set(-0.8 * s, 1.5 * s, 0);
            group.add(leftPillar);
            const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 3 * s, 0.4 * s), stone());
            rightPillar.position.set(0.8 * s, 1.5 * s, 0);
            group.add(rightPillar);
            const top = new THREE.Mesh(new THREE.BoxGeometry(2 * s, 0.4 * s, 0.4 * s), stone());
            top.position.y = 3.2 * s;
            group.add(top);
            group.userData = { type: 'structure' };
            return;
          }
          
          // Barrels
          if (fullType.includes('barrel')) {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * s, 0.3 * s, 0.8 * s, 12), wood());
            barrel.position.y = 0.4 * s;
            group.add(barrel);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Crates and boxes
          if (fullType.includes('crate') || fullType.includes('box')) {
            const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 0.7 * s, 0.7 * s), wood());
            crate.position.y = 0.35 * s;
            group.add(crate);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Sacks and bags
          if (fullType.includes('sack') || fullType.includes('bag')) {
            const sack = new THREE.Mesh(new THREE.SphereGeometry(0.35 * s, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd2b48c }));
            sack.position.y = 0.25 * s;
            sack.scale.y = 0.7;
            group.add(sack);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Wagon and cart
          if (fullType.includes('wagon') || fullType.includes('cart') || fullType.includes('wheelbarrow')) {
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.6 * s, 0.8 * s), wood());
            body.position.y = 0.6 * s;
            group.add(body);
            for (let i = 0; i < 2; i++) {
              const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.3 * s, 0.1 * s, 12), wood());
              wheel.rotation.z = Math.PI / 2;
              wheel.position.set((i === 0 ? -0.8 : 0.8) * s, 0.3 * s, 0);
              group.add(wheel);
            }
            group.userData = { type: 'prop' };
            return;
          }
          
          // Banners, flags, tapestries
          if (fullType.includes('banner') || fullType.includes('flag') || fullType.includes('tapestry')) {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 3 * s, 6), wood());
            pole.position.y = 1.5 * s;
            group.add(pole);
            const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * s, 1.2 * s), new THREE.MeshStandardMaterial({ color: 0xdc2626, side: 2 }));
            cloth.position.set(0.4 * s, 2.2 * s, 0);
            group.add(cloth);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Signs
          if (fullType.includes('sign')) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 1.5 * s, 6), wood());
            post.position.y = 0.75 * s;
            group.add(post);
            const board = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.5 * s, 0.1 * s), wood());
            board.position.y = 1.6 * s;
            group.add(board);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Graves and tombstones
          if (fullType.includes('grave') || fullType.includes('tomb')) {
            const stone_grave = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 1 * s, 0.15 * s), stone());
            stone_grave.position.y = 0.5 * s;
            group.add(stone_grave);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Coffin and sarcophagus
          if (fullType.includes('coffin') || fullType.includes('sarcophagus')) {
            const coffin = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.4 * s, 2 * s), wood());
            coffin.position.y = 0.2 * s;
            group.add(coffin);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Pots, vases, urns, baskets
          if (fullType.includes('pot') || fullType.includes('vase') || fullType.includes('urn') || fullType.includes('basket') || fullType.includes('bucket')) {
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.15 * s, 0.4 * s, 8), new THREE.MeshStandardMaterial({ color: 0xcd853f }));
            pot.position.y = 0.2 * s;
            group.add(pot);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Anvil
          if (fullType.includes('anvil')) {
            const base = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.3 * s, 0.4 * s), metal());
            base.position.y = 0.15 * s;
            group.add(base);
            const top = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.2 * s, 0.3 * s), metal());
            top.position.y = 0.4 * s;
            group.add(top);
            group.userData = { type: 'crafting', interactable: true };
            return;
          }
          
          // Forge, kiln, smelter, furnace
          if (fullType.includes('forge') || fullType.includes('kiln') || fullType.includes('smelter') || fullType.includes('furnace')) {
            const forge = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 1 * s, 1 * s), stone());
            forge.position.y = 0.5 * s;
            group.add(forge);
            const fire = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 0.8 }));
            fire.position.y = 0.7 * s;
            group.add(fire);
            group.userData = { type: 'crafting', interactable: true };
            return;
          }
          
          // Cauldron
          if (fullType.includes('cauldron')) {
            const pot = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 12, 12), metal());
            pot.position.y = 0.4 * s;
            pot.scale.y = 0.7;
            group.add(pot);
            group.userData = { type: 'crafting', interactable: true };
            return;
          }
          
          // Brazier
          if (fullType.includes('brazier')) {
            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * s, 0.3 * s, 0.3 * s, 8), metal());
            bowl.position.y = 0.8 * s;
            group.add(bowl);
            const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 0.8 * s, 8), metal());
            stand.position.y = 0.4 * s;
            group.add(stand);
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.25 * s, 0.5 * s, 8), new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 0.8 }));
            flame.position.y = 1.2 * s;
            group.add(flame);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Candle, candelabra
          if (fullType.includes('candle')) {
            const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.3 * s, 8), new THREE.MeshStandardMaterial({ color: 0xf5f5dc }));
            candle.position.y = 0.15 * s;
            group.add(candle);
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.03 * s, 0.1 * s, 6), new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xffa500, emissiveIntensity: 1 }));
            flame.position.y = 0.35 * s;
            group.add(flame);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Chandelier
          if (fullType.includes('chandelier')) {
            const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 1 * s, 6), metal());
            chain.position.y = 2.5 * s;
            group.add(chain);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5 * s, 0.05 * s, 8, 16), gold());
            ring.position.y = 2 * s;
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Fireplace
          if (fullType.includes('fireplace')) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 1.2 * s, 0.5 * s), stone());
            frame.position.y = 0.6 * s;
            group.add(frame);
            const fire = new THREE.Mesh(new THREE.ConeGeometry(0.3 * s, 0.5 * s, 8), new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 0.8 }));
            fire.position.set(0, 0.3 * s, 0.1 * s);
            group.add(fire);
            group.userData = { type: 'furniture' };
            return;
          }
          
          // Rug and carpet
          if (fullType.includes('rug') || fullType.includes('carpet')) {
            const rug = new THREE.Mesh(new THREE.BoxGeometry(2 * s, 0.05 * s, 1.5 * s), new THREE.MeshStandardMaterial({ color: 0x8b0000 }));
            rug.position.y = 0.025 * s;
            group.add(rug);
            group.userData = { type: 'furniture' };
            return;
          }
          
          // Mirror
          if (fullType.includes('mirror')) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 1.2 * s, 0.1 * s), gold());
            frame.position.y = 1.2 * s;
            group.add(frame);
            const glass = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 1 * s, 0.05 * s), new THREE.MeshStandardMaterial({ color: 0xadd8e6, metalness: 1, roughness: 0 }));
            glass.position.set(0, 1.2 * s, 0.03 * s);
            group.add(glass);
            group.userData = { type: 'furniture' };
            return;
          }
          
          // Paintings
          if (fullType.includes('painting') || fullType.includes('portrait')) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1 * s, 0.8 * s, 0.1 * s), gold());
            frame.position.y = 1.5 * s;
            group.add(frame);
            group.userData = { type: 'furniture' };
            return;
          }
          
          // Bookshelf
          if (fullType.includes('bookshelf') || fullType.includes('book')) {
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 2 * s, 0.4 * s), wood());
            shelf.position.y = 1 * s;
            group.add(shelf);
            group.userData = { type: 'furniture' };
            return;
          }
          
          // Weapon/armor racks and stands
          if (fullType.includes('rack') || fullType.includes('stand') || fullType.includes('mount')) {
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * s, 0.5 * s, 0.1 * s, 8), wood());
            base.position.y = 0.05 * s;
            group.add(base);
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 1.5 * s, 6), wood());
            pole.position.y = 0.8 * s;
            group.add(pole);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Training dummy
          if (fullType.includes('dummy') || fullType.includes('target')) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.1 * s, 1.5 * s, 6), wood());
            post.position.y = 0.75 * s;
            group.add(post);
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.3 * s, 0.8 * s, 8), new THREE.MeshStandardMaterial({ color: 0xdeb887 }));
            body.position.y = 1.5 * s;
            group.add(body);
            group.userData = { type: 'prop', interactable: true };
            return;
          }
          
          // Boats
          if (fullType.includes('boat') || fullType.includes('canoe') || fullType.includes('raft') || fullType.includes('ship')) {
            const hull = new THREE.Mesh(new THREE.BoxGeometry(1 * s, 0.3 * s, 2.5 * s), wood());
            hull.position.y = 0.15 * s;
            group.add(hull);
            group.userData = { type: 'vehicle' };
            return;
          }
          
          // Dock, pier
          if (fullType.includes('dock') || fullType.includes('pier') || fullType.includes('boardwalk')) {
            const platform = new THREE.Mesh(new THREE.BoxGeometry(2 * s, 0.2 * s, 4 * s), wood());
            platform.position.y = 0.5 * s;
            group.add(platform);
            group.userData = { type: 'structure' };
            return;
          }
          
          // Portals
          if (fullType.includes('portal') || fullType.includes('rift')) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1 * s, 0.15 * s, 16, 32), new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x8b5cf6, emissiveIntensity: 0.5 }));
            ring.position.y = 1.5 * s;
            group.add(ring);
            const glow = new THREE.Mesh(new THREE.CircleGeometry(0.9 * s, 32), new THREE.MeshStandardMaterial({ color: 0x9933ff, transparent: true, opacity: 0.5, side: 2 }));
            glow.position.y = 1.5 * s;
            group.add(glow);
            group.userData = { type: 'portal', interactable: true };
            return;
          }
          
          // Magic circles and runes
          if (fullType.includes('magic_circle') || fullType.includes('rune') || fullType.includes('pentagram') || fullType.includes('summoning')) {
            const circle = new THREE.Mesh(new THREE.RingGeometry(0.8 * s, 1 * s, 32), new THREE.MeshStandardMaterial({ color: 0x9933ff, emissive: 0x9933ff, emissiveIntensity: 0.5, side: 2 }));
            circle.position.y = 0.01;
            circle.rotation.x = -Math.PI / 2;
            group.add(circle);
            group.userData = { type: 'magical' };
            return;
          }
          
          // Altars and shrines
          if (fullType.includes('altar') || fullType.includes('shrine')) {
            const base = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.8 * s, 0.8 * s), stone());
            base.position.y = 0.4 * s;
            group.add(base);
            group.userData = { type: 'magical', interactable: true };
            return;
          }
          
          // Totems
          if (fullType.includes('totem')) {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.35 * s, 2.5 * s, 8), wood());
            pole.position.y = 1.25 * s;
            group.add(pole);
            group.userData = { type: 'magical' };
            return;
          }
          
          // Runestones
          if (fullType.includes('runestone')) {
            const stone_rune = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 1.5 * s, 0.3 * s), stone());
            stone_rune.position.y = 0.75 * s;
            group.add(stone_rune);
            group.userData = { type: 'magical', interactable: true };
            return;
          }
          
          // Siege weapons
          if (fullType.includes('catapult') || fullType.includes('trebuchet') || fullType.includes('ballista') || fullType.includes('cannon')) {
            const base = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.5 * s, 2 * s), wood());
            base.position.y = 0.25 * s;
            group.add(base);
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.2 * s, 2 * s), wood());
            arm.position.set(0, 0.8 * s, 0);
            arm.rotation.x = -0.3;
            group.add(arm);
            group.userData = { type: 'siege' };
            return;
          }
          
          // Battering ram
          if (fullType.includes('battering')) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1 * s, 1.5 * s, 3 * s), wood());
            frame.position.y = 0.75 * s;
            group.add(frame);
            const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.25 * s, 2.5 * s, 8), wood());
            ram.position.y = 0.5 * s;
            ram.rotation.x = Math.PI / 2;
            group.add(ram);
            group.userData = { type: 'siege' };
            return;
          }
          
          // Traps
          if (fullType.includes('trap') || fullType.includes('spike')) {
            for (let i = 0; i < 5; i++) {
              const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1 * s, 0.5 * s, 6), metal());
              spike.position.set((Math.random() - 0.5) * s, 0.25 * s, (Math.random() - 0.5) * s);
              group.add(spike);
            }
            group.userData = { type: 'trap' };
            return;
          }
          
          // Animal pens (chicken coop, pig pen, etc.)
          if (fullType.includes('_pen') || fullType.includes('coop') || fullType.includes('stable')) {
            const walls = new THREE.Mesh(new THREE.BoxGeometry(3 * s, 1 * s, 3 * s), wood());
            walls.position.y = 0.5 * s;
            group.add(walls);
            group.userData = { type: 'agriculture' };
            return;
          }
          
          // Trough
          if (fullType.includes('trough')) {
            const trough = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.4 * s, 0.5 * s), wood());
            trough.position.y = 0.2 * s;
            group.add(trough);
            group.userData = { type: 'agriculture' };
            return;
          }
          
          // Silo, granary
          if (fullType.includes('silo') || fullType.includes('granary')) {
            const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(1 * s, 1 * s, 3 * s, 12), wood());
            cylinder.position.y = 1.5 * s;
            group.add(cylinder);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1 * s, 1 * s, 12), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
            roof.position.y = 3.5 * s;
            group.add(roof);
            group.userData = { type: 'building' };
            return;
          }
          
          // Mill (windmill, watermill, grain mill)
          if (fullType.includes('mill')) {
            const building = new THREE.Mesh(new THREE.CylinderGeometry(1.2 * s, 1.5 * s, 3 * s, 8), stone());
            building.position.y = 1.5 * s;
            group.add(building);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6 * s, 1.2 * s, 8), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
            roof.position.y = 3.6 * s;
            group.add(roof);
            group.userData = { type: 'building' };
            return;
          }
          
          // Beehive
          if (fullType.includes('beehive')) {
            const hive = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.35 * s, 0.5 * s, 8), new THREE.MeshStandardMaterial({ color: 0xdaa520 }));
            hive.position.y = 0.25 * s;
            group.add(hive);
            group.userData = { type: 'agriculture', interactable: true };
            return;
          }
          
          // Guillotine, gallows
          if (fullType.includes('guillotine') || fullType.includes('gallows')) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 3 * s, 0.2 * s), wood());
            frame.position.y = 1.5 * s;
            group.add(frame);
            group.userData = { type: 'dungeon' };
            return;
          }
          
          // Stocks, pillory
          if (fullType.includes('stocks') || fullType.includes('pillory')) {
            const posts = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 1.5 * s, 0.2 * s), wood());
            posts.position.y = 0.75 * s;
            group.add(posts);
            const board = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.3 * s, 0.15 * s), wood());
            board.position.y = 1.2 * s;
            group.add(board);
            group.userData = { type: 'dungeon' };
            return;
          }
          
          // Shackles
          if (fullType.includes('shackle')) {
            const chain1 = new THREE.Mesh(new THREE.TorusGeometry(0.1 * s, 0.02 * s, 8, 8), metal());
            chain1.position.set(-0.3 * s, 1 * s, 0);
            group.add(chain1);
            const chain2 = new THREE.Mesh(new THREE.TorusGeometry(0.1 * s, 0.02 * s, 8, 8), metal());
            chain2.position.set(0.3 * s, 1 * s, 0);
            group.add(chain2);
            group.userData = { type: 'dungeon' };
            return;
          }
          
          // Cobweb
          if (fullType.includes('cobweb') || fullType.includes('web')) {
            const web = new THREE.Mesh(new THREE.CircleGeometry(1 * s, 8), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, transparent: true, opacity: 0.5, side: 2 }));
            web.position.y = 1.5 * s;
            web.rotation.x = Math.PI / 6;
            group.add(web);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Blood splatter (aesthetic)
          if (fullType.includes('blood')) {
            const splat = new THREE.Mesh(new THREE.CircleGeometry(0.5 * s, 8), new THREE.MeshStandardMaterial({ color: 0x8b0000, side: 2 }));
            splat.position.y = 0.01;
            splat.rotation.x = -Math.PI / 2;
            group.add(splat);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Coins/gold pile
          if (fullType.includes('coin') || fullType.includes('gold_pile')) {
            for (let i = 0; i < 8; i++) {
              const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.1 * s, 0.02 * s, 12), gold());
              coin.position.set((Math.random() - 0.5) * 0.5 * s, i * 0.02 * s + 0.01, (Math.random() - 0.5) * 0.5 * s);
              coin.rotation.x = Math.random() * 0.3;
              group.add(coin);
            }
            group.userData = { type: 'treasure', interactable: true };
            return;
          }
          
          // Chalice, goblet, cup
          if (fullType.includes('chalice') || fullType.includes('goblet') || fullType.includes('cup')) {
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.08 * s, 0.25 * s, 8), gold());
            cup.position.y = 0.125 * s;
            group.add(cup);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Idol, relic, artifact
          if (fullType.includes('idol') || fullType.includes('relic') || fullType.includes('artifact')) {
            const idol = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 0.5 * s, 6), gold());
            idol.position.y = 0.25 * s;
            group.add(idol);
            group.userData = { type: 'treasure', interactable: true };
            return;
          }
          
          // Scepter, crown
          if (fullType.includes('scepter') || fullType.includes('crown')) {
            const item = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.8 * s, 8), gold());
            item.position.y = 0.4 * s;
            group.add(item);
            const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1 * s, 0), new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 }));
            gem.position.y = 0.85 * s;
            group.add(gem);
            group.userData = { type: 'treasure', interactable: true };
            return;
          }
          
          // Display case/pedestal
          if (fullType.includes('display') || fullType.includes('pedestal')) {
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * s, 0.5 * s, 1 * s, 8), stone());
            base.position.y = 0.5 * s;
            group.add(base);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Scales (weighing)
          if (fullType.includes('scale')) {
            const base = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.05 * s, 0.3 * s), metal());
            base.position.y = 0.5 * s;
            group.add(base);
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 0.5 * s, 6), metal());
            pole.position.y = 0.75 * s;
            group.add(pole);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Safe, vault
          if (fullType.includes('safe') || fullType.includes('vault')) {
            const safe = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 1 * s, 0.6 * s), metal());
            safe.position.y = 0.5 * s;
            group.add(safe);
            group.userData = { type: 'prop', interactable: true };
            return;
          }
          
          // Notice/quest board
          if (fullType.includes('notice') || fullType.includes('quest_board') || fullType.includes('wanted')) {
            const posts_notice = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 2 * s, 0.1 * s), wood());
            posts_notice.position.y = 1 * s;
            group.add(posts_notice);
            const board_notice = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 1 * s, 0.1 * s), wood());
            board_notice.position.y = 1.5 * s;
            group.add(board_notice);
            group.userData = { type: 'prop', interactable: true };
            return;
          }
          
          // Lighthouse
          if (fullType.includes('lighthouse')) {
            const tower_light = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * s, 1.2 * s, 5 * s, 8), stone());
            tower_light.position.y = 2.5 * s;
            group.add(tower_light);
            const light_light = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1 }));
            light_light.position.y = 5.5 * s;
            group.add(light_light);
            group.userData = { type: 'building' };
            return;
          }
          
          // Buoy
          if (fullType.includes('buoy')) {
            const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.4 * s, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
            buoy.position.y = 0.2 * s;
            group.add(buoy);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Anchor
          if (fullType.includes('anchor')) {
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.1 * s, 1.5 * s, 8), metal());
            shaft.position.y = 0.75 * s;
            group.add(shaft);
            const cross = new THREE.Mesh(new THREE.BoxGeometry(1 * s, 0.15 * s, 0.15 * s), metal());
            cross.position.y = 0.2 * s;
            group.add(cross);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Ship wheel
          if (fullType.includes('ship_wheel') || fullType.includes('helm')) {
            const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.4 * s, 0.05 * s, 8, 16), wood());
            wheel.position.y = 1 * s;
            group.add(wheel);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Mast, sail
          if (fullType.includes('mast') || fullType.includes('sail')) {
            const mast_pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 5 * s, 8), wood());
            mast_pole.position.y = 2.5 * s;
            group.add(mast_pole);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Fishing net, lobster trap
          if (fullType.includes('net') || fullType.includes('lobster')) {
            const net = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.5 * s, 0.8 * s), new THREE.MeshStandardMaterial({ color: 0x8b7355, wireframe: true }));
            net.position.y = 0.25 * s;
            group.add(net);
            group.userData = { type: 'prop' };
            return;
          }
          
          // Generic box for anything else - with category-based coloring
          let boxColor = 0x888888; // Default gray
          if (fullType.includes('nature') || fullType.includes('plant')) boxColor = 0x228B22;
          else if (fullType.includes('rock') || fullType.includes('stone')) boxColor = 0x696969;
          else if (fullType.includes('building') || fullType.includes('house')) boxColor = 0x8B4513;
          else if (fullType.includes('magic') || fullType.includes('mystic')) boxColor = 0x9933ff;
          else if (fullType.includes('treasure') || fullType.includes('gold')) boxColor = 0xffd700;
          else if (fullType.includes('dungeon') || fullType.includes('prison')) boxColor = 0x4a4a4a;
          else if (fullType.includes('military') || fullType.includes('siege')) boxColor = 0x8b0000;
          else if (fullType.includes('farm') || fullType.includes('agriculture')) boxColor = 0x4a7c23;
          else if (fullType.includes('maritime') || fullType.includes('ship') || fullType.includes('boat')) boxColor = 0x4682b4;
          
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(s, s, s),
            new THREE.MeshStandardMaterial({ color: boxColor })
          );
          box.position.y = s / 2;
          group.add(box);
          group.userData = { type: 'prop' };
        };
        
        createGenericObject();
      }
      break;
  }

  return group;
};
