import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Save } from 'lucide-react';
import axios from 'axios';

// HUD Components
import HUD from '../components/hud/HUD';
import InventoryPanel from '../components/panels/InventoryPanel';
import SkillsPanel from '../components/panels/SkillsPanel';
import QuestPanel from '../components/panels/QuestPanel';
import CharacterPanel from '../components/panels/CharacterPanel';
import Minimap from '../components/hud/Minimap';
import WorldEditor from '../components/game/WorldEditor';
import SpellBook, { SPELLS } from '../components/game/SpellBook';
import ActionBar from '../components/game/ActionBar';
import TrainerPanel, { WARRIOR_SPELLS } from '../components/game/TrainerPanel';
import QuestDialog, { AVAILABLE_QUESTS } from '../components/game/QuestDialog';
import QuestLog from '../components/game/QuestLog';
import TerrainEditor from '../components/game/TerrainEditor';
import EnemyEditor from '../components/game/EnemyEditor';
import LootPanel, { generateLoot } from '../components/game/LootPanel';
import BagBar from '../components/game/BagBar';
import ItemDatabaseEditor from '../components/game/ItemDatabaseEditor';

// ==================== TERRAIN NOISE FUNCTIONS ====================
// Simplex-like noise for terrain generation
class SimplexNoise {
  constructor(seed = Math.random() * 10000) {
    this.p = new Uint8Array(512);
    this.perm = new Uint8Array(512);
    
    // Initialize permutation table with seed
    const random = this.seededRandom(seed);
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }
  
  seededRandom(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }
  
  noise2D(x, y) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; }
    else { i1 = 0; j1 = 1; }
    
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;
    
    const ii = i & 255;
    const jj = j & 255;
    
    let n0 = 0, n1 = 0, n2 = 0;
    
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this.grad(this.perm[ii + this.perm[jj]], x0, y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this.grad(this.perm[ii + i1 + this.perm[jj + j1]], x1, y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this.grad(this.perm[ii + 1 + this.perm[jj + 1]], x2, y2);
    }
    
    return 70.0 * (n0 + n1 + n2);
  }
  
  // Fractal Brownian Motion for more natural terrain
  fbm(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }
    
    return value / maxValue;
  }
}

// Global terrain instance for consistent height queries
const terrainNoise = new SimplexNoise(42); // Fixed seed for consistent terrain

// Get terrain height at any world position
const getTerrainHeight = (x, z) => {
  // Scale for terrain features
  const scale = 0.015;
  const hillScale = 0.008;
  const detailScale = 0.05;
  
  // Base terrain with gentle rolling hills
  let height = terrainNoise.fbm(x * scale, z * scale, 4, 2.0, 0.5) * 8;
  
  // Add larger hills
  height += terrainNoise.fbm(x * hillScale + 100, z * hillScale + 100, 3, 2.0, 0.6) * 12;
  
  // Add small detail bumps
  height += terrainNoise.noise2D(x * detailScale, z * detailScale) * 0.5;
  
  // Flatten areas around village center (radius 30 units)
  const distFromCenter = Math.sqrt(x * x + z * z);
  if (distFromCenter < 40) {
    const flatten = Math.max(0, 1 - distFromCenter / 40);
    height *= (1 - flatten * flatten);
  }
  
  // Flatten paths
  if (Math.abs(x) < 3 || Math.abs(z) < 3) {
    height *= 0.3;
  }
  
  // Zone-specific terrain modifications
  // Frozen peaks - more mountainous
  if (z < -100) {
    height += terrainNoise.fbm(x * 0.02, z * 0.02, 3, 2.0, 0.7) * 15;
  }
  
  // Scorched plains - flatter with some dunes
  if (x < -100) {
    height = height * 0.5 + terrainNoise.noise2D(x * 0.03, z * 0.03) * 3;
  }
  
  // Crystal caves - rolling with some plateaus
  if (z > 100) {
    height = Math.floor(height / 3) * 3 + (height % 3) * 0.5;
  }
  
  return Math.max(0, height);
};

// Check if position is in water
const isInWater = (x, z) => {
  // Main lake near village (southeast)
  const lakeX = 45, lakeZ = 45;
  const lakeRadius = 25;
  const distToLake = Math.sqrt((x - lakeX) ** 2 + (z - lakeZ) ** 2);
  if (distToLake < lakeRadius) return true;
  
  // River running through darkwood forest
  if (x > 100 && x < 280) {
    const riverZ = 20 + Math.sin(x * 0.05) * 15;
    if (Math.abs(z - riverZ) < 8) return true;
  }
  
  // Pond in frozen peaks
  const pondX = -20, pondZ = -180;
  const pondRadius = 15;
  const distToPond = Math.sqrt((x - pondX) ** 2 + (z - pondZ) ** 2);
  if (distToPond < pondRadius) return true;
  
  // Small pond in scorched plains (oasis)
  const oasisX = -180, oasisZ = 30;
  const oasisRadius = 12;
  const distToOasis = Math.sqrt((x - oasisX) ** 2 + (z - oasisZ) ** 2);
  if (distToOasis < oasisRadius) return true;
  
  return false;
};

// Get water depth at position
const getWaterDepth = (x, z) => {
  // Main lake
  const lakeX = 45, lakeZ = 45, lakeRadius = 25;
  let distToLake = Math.sqrt((x - lakeX) ** 2 + (z - lakeZ) ** 2);
  if (distToLake < lakeRadius) {
    return Math.max(0, (1 - distToLake / lakeRadius) * 3);
  }
  
  // River
  if (x > 100 && x < 280) {
    const riverZ = 20 + Math.sin(x * 0.05) * 15;
    const distToRiver = Math.abs(z - riverZ);
    if (distToRiver < 8) {
      return Math.max(0, (1 - distToRiver / 8) * 1.5);
    }
  }
  
  // Frozen pond
  const pondX = -20, pondZ = -180, pondRadius = 15;
  let distToPond = Math.sqrt((x - pondX) ** 2 + (z - pondZ) ** 2);
  if (distToPond < pondRadius) {
    return Math.max(0, (1 - distToPond / pondRadius) * 2);
  }
  
  // Oasis
  const oasisX = -180, oasisZ = 30, oasisRadius = 12;
  let distToOasis = Math.sqrt((x - oasisX) ** 2 + (z - oasisZ) ** 2);
  if (distToOasis < oasisRadius) {
    return Math.max(0, (1 - distToOasis / oasisRadius) * 2);
  }
  
  return 0;
};

// World Zone Definitions
const WORLD_ZONES = {
  starter_village: {
    name: 'Oakvale Village',
    groundColor: 0x228B22,
    fogColor: 0x87CEEB,
    bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
    spawnPoint: { x: 0, y: 0, z: 0 }
  },
  darkwood_forest: {
    name: 'Darkwood Forest',
    groundColor: 0x1a4d1a,
    fogColor: 0x3d5c3d,
    bounds: { minX: 100, maxX: 300, minZ: -100, maxZ: 100 },
    spawnPoint: { x: 110, y: 0, z: 0 }
  },
  crystal_caves: {
    name: 'Crystal Caves',
    groundColor: 0x4a4a6a,
    fogColor: 0x2a2a4a,
    bounds: { minX: -100, maxX: 100, minZ: 100, maxZ: 300 },
    spawnPoint: { x: 0, y: 0, z: 110 }
  },
  scorched_plains: {
    name: 'Scorched Plains',
    groundColor: 0x8b6914,
    fogColor: 0xd4a574,
    bounds: { minX: -300, maxX: -100, minZ: -100, maxZ: 100 },
    spawnPoint: { x: -110, y: 0, z: 0 }
  },
  frozen_peaks: {
    name: 'Frozen Peaks',
    groundColor: 0xe8e8e8,
    fogColor: 0xc8d8e8,
    bounds: { minX: -100, maxX: 100, minZ: -300, maxZ: -100 },
    spawnPoint: { x: 0, y: 0, z: -110 }
  }
};

// Loading spinner
const LoadingSpinner = () => (
  <div className="h-screen w-screen bg-[#0c0a09] flex items-center justify-center">
    <div className="text-center">
      <div className="loading-spinner mx-auto mb-4"></div>
      <p className="font-cinzel text-[#fbbf24] text-xl">Loading World...</p>
    </div>
  </div>
);

// Floating damage text component data
const createDamageText = (scene, position, damage, isPlayerDamage = false, isHealing = false) => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  
  // Color based on type: healing (green), player damage (red), monster damage (yellow)
  if (isHealing) {
    ctx.fillStyle = '#44ff44'; // Green for healing
  } else if (isPlayerDamage) {
    ctx.fillStyle = '#ff4444'; // Red for damage to player
  } else {
    ctx.fillStyle = '#ffff00'; // Yellow for damage to enemies
  }
  
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  const prefix = isHealing ? '+' : '-';
  ctx.strokeText(`${prefix}${damage}`, 64, 48);
  ctx.fillText(`${prefix}${damage}`, 64, 48);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.position.y += 2;
  sprite.scale.set(1.5, 0.75, 1);
  sprite.userData = { 
    type: 'damageText', 
    velocity: 0.03, 
    opacity: 1, 
    createdAt: Date.now() 
  };
  scene.add(sprite);
  return sprite;
};

const GameWorld = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  
  // Multiplayer - other players
  const otherPlayersRef = useRef({});
  const damageTextsRef = useRef([]);
  const monsterHealthBarsRef = useRef({});
  const editorObjectsRef = useRef([]);
  
  // WoW-style camera controls
  const cameraState = useRef({
    distance: 12,
    minDistance: 3,
    maxDistance: 30,
    rotationY: 0, // Horizontal rotation (yaw)
    rotationX: 0.3, // Vertical rotation (pitch)
    minPitch: -0.5,
    maxPitch: 1.2,
    isRightMouseDown: false,
    isLeftMouseDown: false,
    lastMouseX: 0,
    lastMouseY: 0
  });
  
  // Movement state
  const movementState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    isJumping: false,
    velocityY: 0,
    autoRun: false
  });
  
  // Selection state
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targetHealthUpdate, setTargetHealthUpdate] = useState(0); // Force re-render on target HP change
  const selectedTargetRef = useRef(null); // Ref to track selected target for event handlers
  const selectableObjects = useRef([]);
  const targetIndicatorRef = useRef(null);
  
  // World Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [placedObjects, setPlacedObjects] = useState([]);
  const [selectedEditObject, setSelectedEditObject] = useState(null);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [currentZone, setCurrentZone] = useState('starter_village');
  
  // Refs to track editor state for event handlers (closure fix)
  const isEditorOpenRef = useRef(false);
  const pendingPlacementRef = useRef(null);
  const currentZoneRef = useRef('starter_village');
  const placedObjectsRef = useRef([]);
  
  // Combat state for monster HP
  const [monsterHealth, setMonsterHealth] = useState({});
  const [combatLog, setCombatLog] = useState([]);
  
  // Spell Book and Combat System state
  const [isSpellBookOpen, setIsSpellBookOpen] = useState(false);
  const [spellCooldowns, setSpellCooldowns] = useState({});
  const [currentMana, setCurrentMana] = useState(50);
  const [maxMana, setMaxMana] = useState(50);
  const [currentHealth, setCurrentHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  
  // Regeneration rates (per second)
  const [healthRegenRate] = useState(2); // 2 HP per second
  const [manaRegenRate] = useState(3); // 3 MP per second
  const [isInCombat, setIsInCombat] = useState(false);
  const combatTimerRef = useRef(null);
  
  // WoW-Style Combat System
  const [isAutoAttacking, setIsAutoAttacking] = useState(false);
  const isAutoAttackingRef = useRef(false); // Ref for animation loop closure
  const autoAttackTimerRef = useRef(null);
  const lastAutoAttackRef = useRef(0);
  const autoAttackSpeedRef = useRef(3.0); // 3.0 second swing timer
  const globalCooldownRef = useRef(0); // GCD in seconds
  const npcCombatStateRef = useRef(new Map()); // Track combat state per NPC: {enemyId: {inCombat, aggroTarget, lastAttack, spawnPos}}
  const meleeRange = 5; // 5 yards for melee
  const aggroRange = 15; // 15 yards aggro range (WoW-style)
  const leashRange = 40; // 40 yards leash range
  
  // Refs for functions used in animation loop (to avoid stale closures)
  const addNotificationRef = useRef(null);
  const enterCombatRef = useRef(null);
  
  // Trainer state
  const [isTrainerOpen, setIsTrainerOpen] = useState(false);
  
  // Character Panel state
  const [isCharacterPanelOpen, setIsCharacterPanelOpen] = useState(false);
  
  // Quest state
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [trackedQuestId, setTrackedQuestId] = useState(null);
  const [questGiverName, setQuestGiverName] = useState('Quest Giver');
  
  // Terrain Editor state
  const [isTerrainEditorOpen, setIsTerrainEditorOpen] = useState(false);
  const [terrainTool, setTerrainTool] = useState('raise');
  const terrainToolRef = useRef('raise'); // Ref for animation loop access
  
  // Wrapper to update both state and ref
  const updateTerrainTool = (tool) => {
    setTerrainTool(tool);
    terrainToolRef.current = tool;
  };
  
  // Map Editor Mode state (F5 - Warcraft 3 style sky-view camera)
  const [isMapEditorMode, setIsMapEditorMode] = useState(false);
  const [isFlightMode, setIsFlightMode] = useState(false); // F6 - Fast flight mode in map editor
  const isMapEditorModeRef = useRef(false); // Ref for closure fix in event handlers
  const isFlightModeRef = useRef(false); // Ref for closure fix in event handlers
  const mapEditorCameraState = useRef({
    x: 0,
    z: 0,
    height: 80,
    minHeight: 20,
    maxHeight: 200,
    rotationY: 0,
    tilt: 1.0, // Camera tilt angle (radians, 0.5=angled, 1.5=top-down)
    minTilt: 0.5,
    maxTilt: 1.5,
    moveSpeed: 20, // units per second (40 in flight mode)
    isPanning: false,
    lastMouseX: 0,
    lastMouseY: 0
  });
  
  // Path system state
  const [pathNodes, setPathNodes] = useState([]); // Array of {x, y, z} positions
  const [pathWidth, setPathWidth] = useState(2); // Width of path in units
  const pathMeshRef = useRef(null); // Reference to path mesh
  const pathNodesRef = useRef([]); // Ref for current path nodes
  const updatePathMeshRef = useRef(null); // Ref to updatePathMesh function
  
  // Path management functions
  const clearPath = () => {
    pathNodesRef.current = [];
    setPathNodes([]);
    if (pathMeshRef.current) {
      const scene = sceneRef.current;
      if (scene) {
        scene.remove(pathMeshRef.current);
        pathMeshRef.current.geometry.dispose();
        pathMeshRef.current.material.dispose();
        pathMeshRef.current = null;
      }
    }
  };
  
  const undoPathNode = () => {
    if (pathNodesRef.current.length > 0) {
      pathNodesRef.current = pathNodesRef.current.slice(0, -1);
      setPathNodes([...pathNodesRef.current]);
      // Recreate mesh with remaining nodes in next render
      if (pathNodesRef.current.length >= 2) {
        setTimeout(() => {
          if (updatePathMeshRef.current) {
            updatePathMeshRef.current();
          }
        }, 0);
      } else {
        clearPath();
      }
    }
  };
  
  // World Save state
  const [isSavingWorld, setIsSavingWorld] = useState(false);
  const [brushSize, setBrushSize] = useState(15);
  const brushSizeRef = useRef(15);
  const [brushStrength, setBrushStrength] = useState(0.5);
  const brushStrengthRef = useRef(0.5);
  
  // Wrappers to update both state and ref
  const updateBrushSize = (size) => {
    setBrushSize(size);
    brushSizeRef.current = size;
  };
  const updateBrushStrength = (strength) => {
    setBrushStrength(strength);
    brushStrengthRef.current = strength;
  };
  const [isTerrainSaving, setIsTerrainSaving] = useState(false);
  const terrainEditorActiveRef = useRef(false);
  const isTerrainEditingRef = useRef(false);
  const terrainGeometryRef = useRef(null);
  const terrainMeshRef = useRef(null);
  const brushIndicatorRef = useRef(null);
  
  // Enemy Editor state
  const [isEnemyEditorOpen, setIsEnemyEditorOpen] = useState(false);
  const [placedEnemies, setPlacedEnemies] = useState([]);
  const [selectedEditEnemy, setSelectedEditEnemy] = useState(null);
  const [pendingEnemyPlacement, setPendingEnemyPlacement] = useState(null);
  const enemyEditorActiveRef = useRef(false);
  const pendingEnemyPlacementRef = useRef(null); // CRITICAL: Ref for closure fix
  const enemyMeshesRef = useRef([]); // Store enemy mesh references
  const enemyPatrolDataRef = useRef({}); // Store patrol state for each enemy
  const combatEngagedEnemiesRef = useRef(new Set()); // Enemies currently in combat
  
  // Item Database Editor state
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  
  // Loot system state
  const [isLootPanelOpen, setIsLootPanelOpen] = useState(false);
  const [currentLootData, setCurrentLootData] = useState(null);
  const [currentLootCorpse, setCurrentLootCorpse] = useState(null);
  const corpseTimersRef = useRef(new Map()); // Track corpse despawn timers
  const lootableCorpsesRef = useRef(new Map()); // Track lootable corpses: enemyId -> { mesh, loot }
  
  // Bag system state
  const [openBagIndex, setOpenBagIndex] = useState(null);
  
  const { 
    activePanel, 
    fetchPlayer, 
    fetchQuests, 
    player,
    character,
    attackMonster,
    addNotification,
    updatePosition,
    learnSpell,
    saveActionBar,
    fetchGameState,
    learned_spells,
    action_bar,
    copper,
    position,
    fetchWorldObjects,
    saveWorldObject,
    deleteWorldObject,
    fetchTerrain,
    saveTerrain,
    token,
    backpack,
    bags,
    addItemToBag,
    equipBag,
    updateCopper,
    logout,
    equipment,
    skills
  } = useGameStore();
  
  // Use store values for spells and copper
  const learnedSpells = learned_spells || ['autoAttack', 'warrior_attack'];
  const actionBarSpells = action_bar || ['autoAttack', 'warrior_attack', null, null, null, null];
  const playerCopper = copper || 2500;
  const savedPosition = position || { x: 0, y: 0, z: 0 };
  
  // Keep terrain editor ref in sync
  useEffect(() => {
    terrainEditorActiveRef.current = isTerrainEditorOpen;
  }, [isTerrainEditorOpen]);
  
  // Keep enemy editor ref in sync
  useEffect(() => {
    enemyEditorActiveRef.current = isEnemyEditorOpen;
  }, [isEnemyEditorOpen]);
  
  // Keep map editor mode refs in sync (CRITICAL for F5/F6 key handler closures)
  useEffect(() => {
    isMapEditorModeRef.current = isMapEditorMode;
  }, [isMapEditorMode]);
  
  useEffect(() => {
    isFlightModeRef.current = isFlightMode;
  }, [isFlightMode]);
  
  // Keep pendingEnemyPlacement ref in sync (CRITICAL for closure fix)
  useEffect(() => {
    pendingEnemyPlacementRef.current = pendingEnemyPlacement;
  }, [pendingEnemyPlacement]);
  
  const [ready, setReady] = useState(false);
  
  // Keep selectedTargetRef in sync with selectedTarget state
  useEffect(() => {
    selectedTargetRef.current = selectedTarget;
  }, [selectedTarget]);
  
  // Keep auto-attacking ref in sync with state (CRITICAL for animation loop closure)
  useEffect(() => {
    isAutoAttackingRef.current = isAutoAttacking;
  }, [isAutoAttacking]);
  
  // Keep addNotification ref updated
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);
  
  // Keep editor refs in sync with state (for event handler closures)
  useEffect(() => {
    isEditorOpenRef.current = isEditorOpen;
  }, [isEditorOpen]);
  
  useEffect(() => {
    pendingPlacementRef.current = pendingPlacement;
  }, [pendingPlacement]);
  
  useEffect(() => {
    currentZoneRef.current = currentZone;
  }, [currentZone]);
  
  useEffect(() => {
    placedObjectsRef.current = placedObjects;
  }, [placedObjects]);
  
  // Cooldown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSpellCooldowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        Object.keys(updated).forEach(spellId => {
          if (updated[spellId] > 0) {
            updated[spellId] = Math.max(0, updated[spellId] - 0.1);
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  // Health and Mana Regeneration
  useEffect(() => {
    const regenInterval = setInterval(() => {
      // Regenerate health (slower in combat)
      setCurrentHealth(prev => {
        if (prev >= maxHealth) return maxHealth;
        const regenAmount = isInCombat ? healthRegenRate * 0.25 : healthRegenRate;
        return Math.min(maxHealth, prev + regenAmount * 0.5); // 0.5 because interval is 500ms
      });
      
      // Regenerate mana (slower in combat)
      setCurrentMana(prev => {
        if (prev >= maxMana) return maxMana;
        const regenAmount = isInCombat ? manaRegenRate * 0.5 : manaRegenRate;
        return Math.min(maxMana, prev + regenAmount * 0.5); // 0.5 because interval is 500ms
      });
    }, 500); // Regen tick every 500ms
    
    return () => clearInterval(regenInterval);
  }, [maxHealth, maxMana, healthRegenRate, manaRegenRate, isInCombat]);
  
  // Combat state management - exit combat after 5 seconds of no combat actions
  const enterCombat = useCallback(() => {
    setIsInCombat(true);
    
    // Clear existing timer
    if (combatTimerRef.current) {
      clearTimeout(combatTimerRef.current);
    }
    
    // Set timer to exit combat after 5 seconds
    combatTimerRef.current = setTimeout(() => {
      setIsInCombat(false);
      setIsAutoAttacking(false); // Stop auto-attacking when leaving combat
    }, 5000);
  }, []);
  
  // Keep enterCombat ref updated (for animation loop)
  useEffect(() => {
    enterCombatRef.current = enterCombat;
  }, [enterCombat]);
  
  // Handle enemy death - create lootable corpse
  const handleEnemyDeath = useCallback((enemy, enemyId) => {
    const xpGained = enemy.userData.level * 10;
    addNotification(`Defeated ${enemy.userData.name}! +${xpGained} XP`, 'success');
    
    // Remove from combat tracking
    if (enemyId) {
      combatEngagedEnemiesRef.current.delete(enemyId);
      npcCombatStateRef.current.delete(enemyId);
    }
    
    // Generate loot for this enemy
    const enemyType = enemy.userData.enemyType || enemy.userData.name?.toLowerCase() || 'default';
    const loot = generateLoot(enemyType, enemy.userData.level || 1);
    
    // Mark enemy as corpse (lootable, not hostile)
    enemy.userData.isCorpse = true;
    enemy.userData.hostile = false;
    enemy.userData.lootData = loot;
    enemy.userData.deathTime = Date.now();
    enemy.userData.interactable = true; // Keep interactable for looting
    
    // Change appearance to show it's a corpse (rotate to side, darken)
    enemy.rotation.z = Math.PI / 2; // Fall over
    // Position corpse at terrain height (not below ground)
    const terrainY = getTerrainHeight(enemy.position.x, enemy.position.z);
    enemy.position.y = terrainY + 0.2; // Slightly above terrain to prevent clipping
    
    // Darken the corpse material
    enemy.traverse(child => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.color.multiplyScalar(0.5);
          });
        } else {
          child.material.color.multiplyScalar(0.5);
        }
      }
    });
    
    // Hide health bar
    const healthBarBg = enemy.getObjectByName('healthBarBg');
    const healthBarFill = enemy.getObjectByName('healthBarFill');
    if (healthBarBg) healthBarBg.visible = false;
    if (healthBarFill) healthBarFill.visible = false;
    
    // Store in lootable corpses
    lootableCorpsesRef.current.set(enemyId, { mesh: enemy, loot });
    
    // Add sparkle effect to corpse
    const sparkles = createLootSparkles();
    sparkles.position.set(0, 1.5, 0); // Above corpse
    enemy.add(sparkles);
    enemy.userData.sparkles = sparkles;
    
    // Clear target if this was the selected target
    if (selectedTargetRef.current === enemy) {
      setSelectedTarget(null);
      setIsAutoAttacking(false);
      if (targetIndicatorRef.current) {
        targetIndicatorRef.current.visible = false;
      }
    }
    
    // Set 30-second corpse despawn timer
    const despawnTimer = setTimeout(() => {
      // Remove corpse from scene
      if (sceneRef.current && enemy.parent) {
        sceneRef.current.remove(enemy);
        selectableObjects.current = selectableObjects.current.filter(obj => obj !== enemy);
      }
      
      // Clean up tracking
      if (enemyId) {
        enemyMeshesRef.current = enemyMeshesRef.current.filter(e => e.userData.enemyId !== enemyId);
        delete enemyPatrolDataRef.current[enemyId];
        lootableCorpsesRef.current.delete(enemyId);
        corpseTimersRef.current.delete(enemyId);
        setPlacedEnemies(prev => prev.filter(e => e.id !== enemyId));
      }
      
      // Close loot panel if this corpse was being looted
      if (currentLootCorpse === enemyId) {
        setIsLootPanelOpen(false);
        setCurrentLootData(null);
        setCurrentLootCorpse(null);
      }
    }, 30000); // 30 seconds
    
    corpseTimersRef.current.set(enemyId, despawnTimer);
  }, [addNotification, currentLootCorpse]);
  
  // Handle looting a corpse
  const handleOpenLoot = useCallback((corpseId) => {
    const corpseData = lootableCorpsesRef.current.get(corpseId);
    if (!corpseData) return;
    
    setCurrentLootData(corpseData.loot);
    setCurrentLootCorpse(corpseId);
    setIsLootPanelOpen(true);
  }, []);
  
  // Handle looting an individual item
  const handleLootItem = useCallback((lootItem) => {
    if (lootItem.type === 'gold') {
      // Add copper to player
      const currentCopper = copper || 0;
      const copperToAdd = lootItem.amount; // Amount is already in copper
      useGameStore.setState({ copper: currentCopper + copperToAdd });
      
      // Update backend
      updateCopper(copperToAdd).catch(err => console.error('Failed to save copper:', err));
      
      // Remove gold from loot
      setCurrentLootData(prev => ({
        ...prev,
        gold: 0
      }));
    } else if (lootItem.type === 'item') {
      // Add item to bag system
      const item = lootItem.item;
      const added = addItemToBag(item);
      
      if (added) {
        // Remove from loot
        setCurrentLootData(prev => ({
          ...prev,
          items: prev.items.filter(i => i.id !== item.id)
        }));
      }
    }
    
    // Check if loot is empty
    setCurrentLootData(prev => {
      const isEmpty = (!prev.gold || prev.gold <= 0) && (!prev.items || prev.items.length === 0);
      if (isEmpty) {
        // Close panel and remove corpse
        setTimeout(() => {
          setIsLootPanelOpen(false);
          
          // Remove the corpse since it's been looted
          const corpseData = lootableCorpsesRef.current.get(currentLootCorpse);
          if (corpseData && corpseData.mesh && sceneRef.current) {
            sceneRef.current.remove(corpseData.mesh);
            selectableObjects.current = selectableObjects.current.filter(obj => obj !== corpseData.mesh);
            enemyMeshesRef.current = enemyMeshesRef.current.filter(e => e.userData.enemyId !== currentLootCorpse);
          }
          
          // Clear timer and tracking
          const timer = corpseTimersRef.current.get(currentLootCorpse);
          if (timer) clearTimeout(timer);
          corpseTimersRef.current.delete(currentLootCorpse);
          lootableCorpsesRef.current.delete(currentLootCorpse);
          setPlacedEnemies(p => p.filter(e => e.id !== currentLootCorpse));
          
          setCurrentLootCorpse(null);
          setCurrentLootData(null);
        }, 100);
      }
      return prev;
    });
  }, [addNotification, currentLootCorpse, addItemToBag, copper, updateCopper]);
  
  // Handle loot all button
  const handleLootAll = useCallback(() => {
    if (!currentLootData) return;
    
    // Loot gold (stored as copper) first
    if (currentLootData.gold > 0) {
      const currentCopper = copper || 0;
      const copperToAdd = currentLootData.gold; // Already in copper
      useGameStore.setState({ copper: currentCopper + copperToAdd });
      updateCopper(copperToAdd).catch(err => console.error('Failed to save copper:', err));
    }
    
    // Loot all items
    if (currentLootData.items && currentLootData.items.length > 0) {
      currentLootData.items.forEach(item => {
        addItemToBag(item);
      });
    }
    
    // Close panel and remove corpse
    setIsLootPanelOpen(false);
    
    const corpseData = lootableCorpsesRef.current.get(currentLootCorpse);
    if (corpseData && corpseData.mesh && sceneRef.current) {
      sceneRef.current.remove(corpseData.mesh);
      selectableObjects.current = selectableObjects.current.filter(obj => obj !== corpseData.mesh);
      enemyMeshesRef.current = enemyMeshesRef.current.filter(e => e.userData.enemyId !== currentLootCorpse);
    }
    
    // Clear timer and tracking
    const timer = corpseTimersRef.current.get(currentLootCorpse);
    if (timer) clearTimeout(timer);
    corpseTimersRef.current.delete(currentLootCorpse);
    lootableCorpsesRef.current.delete(currentLootCorpse);
    setPlacedEnemies(p => p.filter(e => e.id !== currentLootCorpse));
    
    setCurrentLootCorpse(null);
    setCurrentLootData(null);
  }, [currentLootData, currentLootCorpse, addNotification]);
  
  // WoW-Style Auto-Attack System
  const performAutoAttack = useCallback(() => {
    const target = selectedTargetRef.current;
    
    // Early exit if no valid target
    if (!target || !target.userData || !target.userData.hostile) {
      return;
    }
    
    if (!playerRef.current) return;
    
    // Check if target is in melee range (2D distance - ignore Y/height)
    const dx = playerRef.current.position.x - target.position.x;
    const dz = playerRef.current.position.z - target.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance > meleeRange) {
      return; // Too far, silently wait
    }
    
    // Check GCD
    if (globalCooldownRef.current > 0) return;
    
    // CRITICAL: Check swing timer using refs only
    const now = Date.now();
    const timeSinceLastAttack = now - lastAutoAttackRef.current;
    if (timeSinceLastAttack < autoAttackSpeedRef.current * 1000) {
      return; // Still on swing timer cooldown
    }
    
    // Update last attack time IMMEDIATELY to prevent double attacks
    lastAutoAttackRef.current = now;
    
    // Enter combat
    if (enterCombatRef.current) {
      enterCombatRef.current();
    }
    
    // Calculate auto-attack damage (10-15 base damage)
    const damage = Math.floor(Math.random() * 6) + 10;
    
    // Apply damage to target (use currentHealth, fallback to maxHealth)
    const currentHp = target.userData.currentHealth ?? target.userData.maxHealth;
    const newHp = Math.max(0, currentHp - damage);
    target.userData.currentHealth = newHp; // Update currentHealth consistently
    
    // Show damage text
    if (sceneRef.current) {
      const damageSprite = createDamageText(sceneRef.current, target.position.clone(), damage, false);
      damageTextsRef.current.push(damageSprite);
    }
    
    // Update NPC health bar
    const enemyId = target.userData.enemyId;
    const healthBarFill = target.getObjectByName('healthBarFill');
    if (healthBarFill && target.userData.healthBarWidth) {
      const hpPercent = Math.max(0, newHp / target.userData.maxHealth);
      healthBarFill.scale.x = Math.max(0.01, hpPercent); // Min 0.01 to avoid disappearing
      const offset = (target.userData.healthBarWidth * (1 - hpPercent)) / 2;
      healthBarFill.position.x = -offset;
    }
    
    // Force UI update for target health bar
    setTargetHealthUpdate(prev => prev + 1);
    
    // Combat log only (no notifications for auto-attacks)
    setCombatLog(prev => [...prev.slice(-9), {
      time: Date.now(),
      text: `Auto-attack hits ${target.userData.name} for ${damage} damage!`
    }]);
    
    // Aggro the NPC
    if (enemyId) {
      let combatState = npcCombatStateRef.current.get(enemyId);
      if (!combatState) {
        combatState = {
          inCombat: false,
          aggroTarget: null,
          lastAttack: 0,
          spawnPos: {
            x: target.userData.spawnX,
            z: target.userData.spawnZ
          }
        };
      }
      combatState.inCombat = true;
      combatState.aggroTarget = playerRef.current;
      npcCombatStateRef.current.set(enemyId, combatState);
      combatEngagedEnemiesRef.current.add(enemyId);
    }
    
    // Check if enemy defeated
    if (newHp <= 0) {
      handleEnemyDeath(target, enemyId);
    }
  }, [handleEnemyDeath]);
  
  // Handle enemy death
  // World Editor handlers
  const handlePlaceObject = useCallback((objectData) => {
    setPendingPlacement(objectData);
    addNotification('Click in the world to place object', 'info');
  }, [addNotification]);

  const handleDeleteObject = useCallback(async (objectId) => {
    console.log('Deleting object:', objectId);
    console.log('Editor objects:', editorObjectsRef.current.map(o => ({ id: o.userData.editorId, name: o.name })));
    
    // Remove from scene
    const obj = editorObjectsRef.current.find(o => o.userData.editorId === objectId);
    if (obj && sceneRef.current) {
      console.log('Found object to remove:', obj.name, obj.userData);
      
      // Properly dispose of geometry and materials
      obj.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      sceneRef.current.remove(obj);
      editorObjectsRef.current = editorObjectsRef.current.filter(o => o.userData.editorId !== objectId);
      selectableObjects.current = selectableObjects.current.filter(o => o.userData.editorId !== objectId);
      console.log('Object removed from scene');
    } else {
      console.warn('Object not found in editorObjectsRef or scene not available');
    }
    
    setPlacedObjects(prev => prev.filter(o => o.id !== objectId));
    setSelectedEditObject(null);
    
    // Delete from database
    try {
      await deleteWorldObject(objectId);
      addNotification('Object deleted', 'success');
    } catch (err) {
      console.error('Failed to delete from database:', err);
      addNotification('Object removed locally (save failed)', 'warning');
    }
  }, [addNotification, deleteWorldObject]);

  // Handle logout with comprehensive world save
  const handleLogout = useCallback(async () => {
    addNotification('Saving all game data...', 'info');
    
    // Note: Terrain is NOT auto-saved on logout to prevent corruption.
    // Use F2 -> Save button in Terrain Editor to manually save terrain changes.
    
    // Use ref to get latest placed objects (handles closure issues)
    const currentPlacedObjects = placedObjectsRef.current;
    
    // Gather world objects with proper position object
    const worldObjects = currentPlacedObjects.map(obj => {
      const position = obj.position || { x: obj.x || 0, y: obj.y || 0, z: obj.z || 0 };
      return {
        id: obj.id,
        type: obj.type,
        fullType: obj.fullType || obj.subType || obj.type,
        position: position,
        rotation: obj.rotation || 0,
        scale: obj.scale || 1,
        name: obj.name
      };
    });
    
    // Gather placed enemies
    const enemies = placedEnemies.map(enemy => ({
      id: enemy.id,
      enemyType: enemy.enemyType,
      name: enemy.name,
      level: enemy.level,
      x: enemy.x,
      y: enemy.y,
      z: enemy.z,
      maxHealth: enemy.maxHealth
    }));
    
    // Build world data object (no terrain - use F2 Save for terrain)
    const worldData = {
      world_objects: worldObjects,
      zone: currentZone,
      placed_enemies: enemies
    };
    
    // Call logout with world data
    await logout(worldData);
    
    addNotification('Game saved! Logging out...', 'success');
  }, [addNotification, logout, placedEnemies, currentZone]);

  const handleLoadWorld = useCallback(async (worldData) => {
    if (!sceneRef.current) return;
    
    // Clear existing editor objects from scene
    editorObjectsRef.current.forEach(obj => {
      sceneRef.current.remove(obj);
    });
    editorObjectsRef.current = [];
    
    // Save imported objects to database (bulk save)
    try {
      const { saveWorldObjectsBulk } = useGameStore.getState();
      await saveWorldObjectsBulk(worldData.objects || [], currentZone);
      addNotification(`Imported ${worldData.objects?.length || 0} objects to ${currentZone}`, 'success');
    } catch (err) {
      addNotification('Import saved locally only', 'warning');
    }
    
    setPlacedObjects(worldData.objects || []);
  }, [addNotification, currentZone]);
  
  // Function to create loot sparkle effect
  const createLootSparkles = useCallback(() => {
    const group = new THREE.Group();
    
    // Create multiple sparkle particles
    const particleCount = 8;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffd700, // Gold color
        transparent: true,
        opacity: 0.8,
        emissive: 0xffd700,
        emissiveIntensity: 1
      });
      
      const particle = new THREE.Mesh(geometry, material);
      
      // Position in a circle
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.4;
      particle.position.x = Math.cos(angle) * radius;
      particle.position.z = Math.sin(angle) * radius;
      particle.position.y = Math.sin(i * 0.5) * 0.2;
      
      // Store initial position for animation
      particle.userData.angle = angle;
      particle.userData.yOffset = i * 0.1;
      
      particles.push(particle);
      group.add(particle);
    }
    
    // Add central glow
    const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.6,
      emissive: 0xffff00,
      emissiveIntensity: 2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    group.userData.particles = particles;
    group.userData.glow = glow;
    group.userData.time = 0;
    
    return group;
  }, []);
  
  // Function to create an enemy mesh (must be defined BEFORE handlePlaceEnemy)
  const createEnemyMesh = useCallback((x, z, enemyData, enemyId) => {
    const terrainY = getTerrainHeight(x, z);
    const group = new THREE.Group();
    
    const scale = 1 + (enemyData.level / 50); // Scale based on level
    const color = new THREE.Color(enemyData.color || 0xff0000);
    
    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35 * scale, 0.6 * scale, 8, 16),
      bodyMat
    );
    body.position.y = 0.7 * scale;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: color });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25 * scale, 12, 12), headMat);
    head.position.y = 1.3 * scale;
    head.castShadow = true;
    group.add(head);
    
    // Glowing red eyes
    const eyeMat = new THREE.MeshStandardMaterial({ 
      color: 0xff0000, 
      emissive: 0xff0000, 
      emissiveIntensity: 0.8 
    });
    for (let side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 6, 6), eyeMat);
      eye.position.set(side * 0.1 * scale, 1.35 * scale, 0.2 * scale);
      group.add(eye);
    }
    
    // Health bar background
    const healthBarWidth = 1 * scale;
    const healthBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(healthBarWidth, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
    );
    healthBarBg.position.y = 1.8 * scale;
    healthBarBg.name = 'healthBarBg';
    group.add(healthBarBg);
    
    // Health bar fill
    const healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(healthBarWidth - 0.04, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
    );
    healthBarFill.position.y = 1.8 * scale;
    healthBarFill.name = 'healthBarFill';
    group.add(healthBarFill);
    
    // Level indicator
    const levelPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    levelPlate.position.y = 1.95 * scale;
    group.add(levelPlate);
    
    // Store enemy data
    group.userData = {
      type: 'monster',
      enemyId: enemyId,
      enemyType: enemyData.enemyType,
      name: enemyData.name,
      level: enemyData.level,
      maxHealth: enemyData.maxHealth,
      currentHealth: enemyData.currentHealth,
      damage: enemyData.damage,
      xpReward: enemyData.xpReward,
      goldDrop: enemyData.goldDrop,
      hostile: true,
      interactable: true,
      spawnX: x,
      spawnZ: z,
      patrolRadius: enemyData.patrolRadius,
      healthBarWidth: healthBarWidth - 0.04
    };
    
    group.position.set(x, terrainY, z);
    group.name = `enemy_${enemyData.name}_${enemyId}`;
    
    return group;
  }, []);
  
  // Enemy placement handler
  const handlePlaceEnemy = useCallback((enemyData) => {
    // Check if enemyData has a position (direct placement for duplicates)
    if (enemyData.position) {
      // Direct placement - create enemy immediately at specified position
      const enemyId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const enemyMesh = createEnemyMesh(
        enemyData.position.x,
        enemyData.position.z,
        enemyData,
        enemyId
      );
      
      if (enemyMesh) {
        sceneRef.current.add(enemyMesh);
        enemyMeshesRef.current.push(enemyMesh);
        selectableObjects.current.push(enemyMesh);
        
        const newEnemy = {
          id: enemyId,
          ...enemyData,
          position: { x: enemyData.position.x, y: 0, z: enemyData.position.z },
          zone: currentZone
        };
        
        setPlacedEnemies(prev => [...prev, newEnemy]);
        addNotification(`Duplicated ${enemyData.name}!`, 'success');
      }
    } else {
      // Pending placement - wait for user click
      setPendingEnemyPlacement(enemyData);
      addNotification(`Click terrain to spawn ${enemyData.name}`, 'info');
    }
  }, [addNotification, currentZone, createEnemyMesh]);
  
  // Enemy delete handler
  const handleDeleteEnemy = useCallback((enemyId) => {
    console.log('Deleting enemy:', enemyId);
    
    // Remove from scene
    const enemyMesh = enemyMeshesRef.current.find(e => e.userData.enemyId === enemyId);
    if (enemyMesh && sceneRef.current) {
      // Dispose geometry and materials
      enemyMesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      sceneRef.current.remove(enemyMesh);
      enemyMeshesRef.current = enemyMeshesRef.current.filter(e => e.userData.enemyId !== enemyId);
      selectableObjects.current = selectableObjects.current.filter(o => o.userData.enemyId !== enemyId);
      
      // Remove patrol data
      delete enemyPatrolDataRef.current[enemyId];
      combatEngagedEnemiesRef.current.delete(enemyId);
      
      console.log('Enemy removed from scene');
    }
    
    setPlacedEnemies(prev => prev.filter(e => e.id !== enemyId));
    setSelectedEditEnemy(null);
    addNotification('Enemy removed', 'success');
  }, [addNotification]);
  
  // Spell Book handlers - now saves to server
  const handleLearnSpell = useCallback((spellId) => {
    if (!learnedSpells.includes(spellId)) {
      // Note: This is for spells learned from spell book directly (free spells)
      // Trainer uses handleTrainSpell instead
      addNotification(`Learned: ${SPELLS[spellId]?.name}!`, 'success');
    }
  }, [learnedSpells, addNotification]);
  
  const handleAssignToActionBar = useCallback((spellId, slotIndex) => {
    const updated = [...actionBarSpells];
    // Remove spell from any existing slot
    const existingIndex = updated.indexOf(spellId);
    if (existingIndex !== -1) {
      updated[existingIndex] = null;
    }
    updated[slotIndex] = spellId;
    
    // Save to server
    saveActionBar(updated);
    addNotification(`Assigned ${SPELLS[spellId]?.name || WARRIOR_SPELLS[spellId]?.name} to slot ${slotIndex + 1}`, 'info');
  }, [actionBarSpells, saveActionBar, addNotification]);
  
  // Handle drag & drop from spell book to action bar
  const handleDropSpell = useCallback((spellId, slotIndex) => {
    handleAssignToActionBar(spellId, slotIndex);
  }, [handleAssignToActionBar]);
  
  // Trainer spell training handler - saves to server
  const handleTrainSpell = useCallback(async (spellId, cost) => {
    try {
      await learnSpell(spellId, cost);
      addNotification(`Trained: ${WARRIOR_SPELLS[spellId]?.name}! (-${cost} gold)`, 'success');
    } catch (err) {
      addNotification(err.response?.data?.detail || 'Failed to learn spell', 'error');
    }
  }, [learnSpell, addNotification]);
  
  // Quest handlers
  const handleAcceptQuest = useCallback((quest) => {
    // Add quest to active quests
    setActiveQuests(prev => [...prev, { ...quest, acceptedAt: Date.now() }]);
    addNotification(`Quest accepted: ${quest.name}`, 'success');
    setIsQuestDialogOpen(false);
  }, [addNotification]);
  
  const handleAbandonQuest = useCallback((questId) => {
    setActiveQuests(prev => prev.filter(q => q.id !== questId));
    if (trackedQuestId === questId) {
      setTrackedQuestId(null);
    }
    addNotification('Quest abandoned', 'info');
  }, [trackedQuestId, addNotification]);
  
  const handleTrackQuest = useCallback((questId) => {
    setTrackedQuestId(prev => prev === questId ? null : questId);
  }, []);
  
  // Cast spell function - updated to use WARRIOR_SPELLS as well
  const handleCastSpell = useCallback((spellId) => {
    const spell = SPELLS[spellId] || WARRIOR_SPELLS[spellId];
    if (!spell) return;
    
    // Handle auto-attack toggle
    if (spellId === 'autoAttack') {
      if (!selectedTarget || !selectedTarget.userData.hostile) {
        addNotification('You need a hostile target to auto-attack!', 'error');
        return;
      }
      
      // Toggle auto-attack on/off (no spam notifications)
      setIsAutoAttacking(prev => {
        const newState = !prev;
        if (newState) {
          enterCombat();
          // Reset swing timer so first attack happens after 1 second
          lastAutoAttackRef.current = Date.now() - 2000;
        }
        return newState;
      });
      return;
    }
    
    // Check cooldown
    if (spellCooldowns[spellId] > 0) {
      addNotification('Spell is on cooldown!', 'error');
      return;
    }
    
    // Check mana
    if (currentMana < spell.manaCost) {
      addNotification('Not enough mana!', 'error');
      return;
    }
    
    // Check target for non-self spells
    if (!spell.selfTarget && spell.range > 0 && !selectedTarget) {
      addNotification('No target selected!', 'error');
      return;
    }
    
    // Check if target is hostile for damage spells
    if (!spell.selfTarget && selectedTarget && spell.damage.min > 0) {
      if (!selectedTarget.userData.hostile) {
        addNotification('Cannot attack friendly targets!', 'error');
        return;
      }
    }
    
    // Consume mana
    setCurrentMana(prev => Math.max(0, prev - spell.manaCost));
    
    // Start cooldown
    setSpellCooldowns(prev => ({ ...prev, [spellId]: spell.cooldown }));
    
    // Set global cooldown (1.5s for most spells)
    globalCooldownRef.current = 1.5;
    
    // Enter combat
    enterCombat();
    
    // Calculate damage
    const baseDamage = Math.floor(Math.random() * (spell.damage.max - spell.damage.min + 1)) + spell.damage.min;
    
    // Self-target spells (healing)
    if (spell.selfTarget || spell.damage.min < 0) {
      const healAmount = Math.abs(baseDamage);
      setCurrentHealth(prev => Math.min(maxHealth, prev + healAmount));
      addNotification(`Healed for ${healAmount} HP!`, 'success');
      
      // Show healing text on player
      if (playerRef.current && sceneRef.current) {
        const healSprite = createDamageText(sceneRef.current, playerRef.current.position.clone(), healAmount, false, true);
        damageTextsRef.current.push(healSprite);
      }
      return;
    }
    
    // Attack target
    if (selectedTarget && selectedTarget.userData.hostile) {
      const monsterId = selectedTarget.userData.monsterId;
      const enemyId = selectedTarget.userData.enemyId; // For placed enemies
      const targetPosition = selectedTarget.position.clone();
      const monsterType = selectedTarget.userData.monsterType || 'goblin';
      
      // Mark enemy as in combat and aggro them (WoW-style combat)
      if (enemyId) {
        const combatState = npcCombatStateRef.current.get(enemyId) || {
          inCombat: false,
          aggroTarget: null,
          lastAttack: 0,
          spawnPos: {
            x: selectedTarget.userData.spawnX,
            z: selectedTarget.userData.spawnZ
          }
        };
        combatState.inCombat = true;
        combatState.aggroTarget = playerRef.current;
        npcCombatStateRef.current.set(enemyId, combatState);
        combatEngagedEnemiesRef.current.add(enemyId);
      }
      
      // Show damage text
      const damageSprite = createDamageText(sceneRef.current, targetPosition, baseDamage, false);
      damageTextsRef.current.push(damageSprite);
      
      // Update monster HP (use currentHealth consistently)
      const currentHp = selectedTarget.userData.currentHealth ?? selectedTarget.userData.maxHealth;
      const newHp = Math.max(0, currentHp - baseDamage);
      selectedTarget.userData.currentHealth = newHp;
      
      // Simulate monster retaliation damage (10-20% chance to hit back)
      if (Math.random() < 0.3) {
        const monsterDamage = Math.floor(Math.random() * 8) + 3; // 3-10 damage
        setCurrentHealth(prev => Math.max(0, prev - monsterDamage));
        
        if (playerRef.current && sceneRef.current) {
          const playerDmgSprite = createDamageText(sceneRef.current, playerRef.current.position.clone(), monsterDamage, true);
          damageTextsRef.current.push(playerDmgSprite);
        }
        
        setCombatLog(prev => [...prev.slice(-9), {
          time: Date.now(),
          text: `${selectedTarget.name} hits you for ${monsterDamage} damage!`
        }]);
      }
      
      // Update health bar above enemy
      const healthBarFill = selectedTarget.getObjectByName('healthBarFill');
      if (healthBarFill && selectedTarget.userData.healthBarWidth) {
        const hpPercent = Math.max(0, newHp / selectedTarget.userData.maxHealth);
        healthBarFill.scale.x = Math.max(0.01, hpPercent);
        const offset = (selectedTarget.userData.healthBarWidth * (1 - hpPercent)) / 2;
        healthBarFill.position.x = -offset;
      }
      
      // Force UI update for target health bar
      setTargetHealthUpdate(prev => prev + 1);
      
      // Combat log
      setCombatLog(prev => [...prev.slice(-9), {
        time: Date.now(),
        text: `${spell.name} hits ${selectedTarget.name} for ${baseDamage} damage!`
      }]);
      
      // Check if monster defeated
      if (newHp <= 0) {
        const xpGained = selectedTarget.userData.level * 10;
        addNotification(`Defeated ${selectedTarget.name}! +${xpGained} XP`, 'success');
        
        // Remove from combat engaged list
        if (enemyId) {
          combatEngagedEnemiesRef.current.delete(enemyId);
        }
        
        // Remove monster
        setTimeout(() => {
          sceneRef.current?.remove(selectedTarget);
          selectableObjects.current = selectableObjects.current.filter(obj => obj !== selectedTarget);
          delete monsterHealthBarsRef.current[monsterId];
          // Also remove from enemy meshes ref if it's a placed enemy
          if (enemyId) {
            enemyMeshesRef.current = enemyMeshesRef.current.filter(e => e.userData.enemyId !== enemyId);
            delete enemyPatrolDataRef.current[enemyId];
            setPlacedEnemies(prev => prev.filter(e => e.id !== enemyId));
          }
          setSelectedTarget(null);
          targetIndicatorRef.current.visible = false;
        }, 500);
      } else {
        // Monster counter-attack (simplified)
        const monsterDamage = Math.floor(Math.random() * 5) + 2;
        setTimeout(() => {
          if (playerRef.current) {
            const playerDamageSprite = createDamageText(sceneRef.current, playerRef.current.position.clone(), monsterDamage, true);
            damageTextsRef.current.push(playerDamageSprite);
            setCombatLog(prev => [...prev.slice(-9), {
              time: Date.now(),
              text: `${selectedTarget?.name} hits you for ${monsterDamage} damage!`
            }]);
          }
        }, 300);
      }
    }
  }, [spellCooldowns, currentMana, selectedTarget, addNotification]);

  // Fetch player data and initial game state
  useEffect(() => {
    const init = async () => {
      try {
        await fetchPlayer();
        await fetchGameState(); // Fetch game state including position BEFORE setting ready
        await fetchQuests();
      } catch (err) {
        console.error('Init error:', err);
      }
      setReady(true);
    };
    init();
  }, []);
  
  // Update player position when position changes in store (after game state loads)
  useEffect(() => {
    if (playerRef.current && savedPosition && ready) {
      const currentPos = playerRef.current.position;
      // Only update if significantly different (to avoid fighting with movement)
      const distance = Math.sqrt(
        Math.pow(currentPos.x - (savedPosition.x || 0), 2) + 
        Math.pow(currentPos.z - (savedPosition.z || 0), 2)
      );
      // If player is at origin and saved position is different, restore it
      if (currentPos.x === 0 && currentPos.z === 0 && distance > 1) {
        playerRef.current.position.set(savedPosition.x || 0, 0, savedPosition.z || 0);
      }
    }
  }, [savedPosition, ready]);

  // Sync player position to server periodically
  useEffect(() => {
    if (!playerRef.current || !ready) return;
    
    const syncInterval = setInterval(() => {
      const pos = playerRef.current?.position;
      if (pos) {
        updatePosition({
          x: pos.x,
          y: pos.y,
          z: pos.z,
          zone: 'starter_village'
        });
      }
    }, 500); // Sync every 500ms
    
    return () => clearInterval(syncInterval);
  }, [ready, updatePosition]);

  // Setup Three.js scene with WoW controls
  useEffect(() => {
    if (!containerRef.current || !ready) return;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 60, 150);
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(30, 50, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 150;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.4);
    scene.add(hemisphereLight);
    
    // ==================== TERRAIN WITH HILLS AND WATER ====================
    
    const worldSize = 600;
    const terrainSegments = 200; // Higher resolution for smoother hills
    
    // Create terrain geometry
    const terrainGeometry = new THREE.PlaneGeometry(worldSize, worldSize, terrainSegments, terrainSegments);
    const positionAttribute = terrainGeometry.getAttribute('position');
    const colorAttribute = new THREE.BufferAttribute(new Float32Array(positionAttribute.count * 3), 3);
    
    // Function to apply terrain data (either from DB or generated)
    const applyTerrainData = (heightmap, colors) => {
      for (let i = 0; i < positionAttribute.count; i++) {
        // Set height
        positionAttribute.setZ(i, heightmap[i] || 0);
        // Set color
        colorAttribute.setXYZ(i, colors[i * 3] || 0.13, colors[i * 3 + 1] || 0.55, colors[i * 3 + 2] || 0.13);
      }
      
      // CRITICAL: Mark attributes as needing GPU update
      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;
      
      terrainGeometry.setAttribute('color', colorAttribute);
      terrainGeometry.computeVertexNormals();
      
      // Also update the bounding box for raycasting
      terrainGeometry.computeBoundingBox();
      terrainGeometry.computeBoundingSphere();
    };
    
    // Function to generate terrain procedurally
    const generateTerrainData = () => {
      const heightmap = [];
      const colors = [];
      
      for (let i = 0; i < positionAttribute.count; i++) {
        const geoX = positionAttribute.getX(i);
        const geoY = positionAttribute.getY(i);
        
        // Convert to world coordinates
        const worldX = geoX;
        const worldZ = -geoY;
        
        // Get terrain height
        const height = getTerrainHeight(worldX, worldZ);
        heightmap.push(height);
        
        // Determine color
        let color = new THREE.Color(0x228B22);
        
        if (worldX > 100) {
          color = new THREE.Color(0x1a4d1a);
        } else if (worldX < -100) {
          color = new THREE.Color(0x8b6914);
        } else if (worldZ > 100) {
          color = new THREE.Color(0x4a4a6a);
        } else if (worldZ < -100) {
          color = new THREE.Color(0xe8e8e8);
        }
        
        if (height > 10) {
          color.lerp(new THREE.Color(0x808080), Math.min(1, (height - 10) / 15));
        } else if (height < 1) {
          color.lerp(new THREE.Color(0x1a3d1a), 0.3);
        }
        
        if (isInWater(worldX, worldZ)) {
          color = new THREE.Color(0x3d5c3d);
        }
        
        colors.push(color.r, color.g, color.b);
      }
      
      return { heightmap, colors };
    };
    
    // Load terrain from database or generate new
    const loadOrGenerateTerrain = async () => {
      try {
        const result = await fetchTerrain();
        
        console.log('Terrain fetch result:', {
          exists: result.exists,
          has_heightmap: result.terrain?.heightmap?.length > 0,
          has_colors: result.terrain?.colors?.length > 0,
          heightmap_length: result.terrain?.heightmap?.length,
          colors_length: result.terrain?.colors?.length
        });
        
        if (result.exists && result.terrain && result.terrain.heightmap && result.terrain.heightmap.length > 0) {
          console.log('Loading saved terrain from database...');
          applyTerrainData(result.terrain.heightmap, result.terrain.colors);
          console.log('Terrain loaded successfully!');
        } else {
          console.log('Generating new terrain...');
          const { heightmap, colors } = generateTerrainData();
          applyTerrainData(heightmap, colors);
          
          // Save to database for future loads
          if (token) {
            console.log('Saving terrain to database...');
            try {
              await saveTerrain({
                terrain_id: 'main_terrain',
                world_size: worldSize,
                segments: terrainSegments,
                seed: 42,
                heightmap,
                colors,
                version: 1
              });
              console.log('Terrain saved to database!');
            } catch (saveErr) {
              console.error('Failed to save terrain:', saveErr);
            }
          }
        }
      } catch (err) {
        console.error('Error loading terrain, generating procedurally:', err);
        const { heightmap, colors } = generateTerrainData();
        applyTerrainData(heightmap, colors);
      }
    };
    
    // Start terrain loading (async)
    loadOrGenerateTerrain();
    
    const terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      flatShading: false
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    terrain.castShadow = false;
    terrain.name = 'terrain';
    scene.add(terrain);
    
    // Store terrain references for editing
    terrainGeometryRef.current = terrainGeometry;
    terrainMeshRef.current = terrain;
    
    // Create brush indicator for terrain editor
    const brushGeometry = new THREE.RingGeometry(1, 1.2, 32);
    const brushMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xfbbf24, 
      transparent: true, 
      opacity: 0.6,
      side: THREE.DoubleSide 
    });
    const brushIndicator = new THREE.Mesh(brushGeometry, brushMaterial);
    brushIndicator.rotation.x = -Math.PI / 2;
    brushIndicator.visible = false;
    brushIndicator.name = 'brushIndicator';
    scene.add(brushIndicator);
    brushIndicatorRef.current = brushIndicator;
    
    // Store terrain reference for raycasting
    const terrainRef = terrain;
    
    // ==================== WATER BODIES ====================
    
    // Water material with animated shader effect
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.3,
      side: THREE.DoubleSide
    });
    
    // Main lake near village
    const createWaterBody = (centerX, centerZ, radius, depth = 2, isRiver = false, riverLength = 0) => {
      let waterGeometry;
      if (isRiver) {
        // River is a long curved shape
        const riverPath = new THREE.CurvePath();
        const points = [];
        for (let i = 0; i <= 20; i++) {
          const x = centerX + (i / 20) * riverLength;
          const z = centerZ + Math.sin(x * 0.05) * 15;
          points.push(new THREE.Vector3(x, 0, z));
        }
        
        // Create river as a series of planes
        const riverGroup = new THREE.Group();
        for (let i = 0; i < points.length - 1; i++) {
          const segmentGeometry = new THREE.PlaneGeometry(12, 18);
          const segment = new THREE.Mesh(segmentGeometry, waterMaterial.clone());
          segment.rotation.x = -Math.PI / 2;
          const midX = (points[i].x + points[i + 1].x) / 2;
          const midZ = (points[i].z + points[i + 1].z) / 2;
          segment.position.set(midX, 0.3, midZ);
          
          // Rotate to follow river direction
          const angle = Math.atan2(points[i + 1].z - points[i].z, points[i + 1].x - points[i].x);
          segment.rotation.z = angle;
          riverGroup.add(segment);
        }
        riverGroup.name = 'river';
        scene.add(riverGroup);
        return riverGroup;
      } else {
        // Circular water body
        waterGeometry = new THREE.CircleGeometry(radius, 48);
        const water = new THREE.Mesh(waterGeometry, waterMaterial.clone());
        water.rotation.x = -Math.PI / 2;
        water.position.set(centerX, 0.3, centerZ);
        water.name = `water_${centerX}_${centerZ}`;
        scene.add(water);
        
        // Add subtle wave rings
        const ringGeometry = new THREE.RingGeometry(radius * 0.3, radius * 0.35, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0x87ceeb,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(centerX, 0.35, centerZ);
        ring.userData.isWaveRing = true;
        ring.userData.baseScale = 0.3;
        scene.add(ring);
        
        return water;
      }
    };
    
    // Create water bodies
    const mainLake = createWaterBody(45, 45, 25); // Lake near village
    const frozenPond = createWaterBody(-20, -180, 15); // Frozen pond (will look icy)
    const oasis = createWaterBody(-180, 30, 12); // Oasis in scorched plains
    const river = createWaterBody(100, 20, 8, 1.5, true, 180); // River through darkwood
    
    // Frozen pond gets ice overlay
    const iceGeometry = new THREE.CircleGeometry(14, 32);
    const iceMaterial = new THREE.MeshStandardMaterial({
      color: 0xb0e0e6,
      transparent: true,
      opacity: 0.6,
      roughness: 0.05,
      metalness: 0.8
    });
    const ice = new THREE.Mesh(iceGeometry, iceMaterial);
    ice.rotation.x = -Math.PI / 2;
    ice.position.set(-20, 0.4, -180);
    ice.name = 'frozen_pond_ice';
    scene.add(ice);
    
    // Water animation references
    const waterBodies = [mainLake, frozenPond, oasis];
    
    // ==================== TERRAIN DECORATIONS ====================
    
    // Add some rocks on hillsides
    const createHillRock = (x, z, scale = 1) => {
      const height = getTerrainHeight(x, z);
      if (height < 3) return null; // Only on hills
      
      const rockGeometry = new THREE.DodecahedronGeometry(0.5 * scale, 0);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 0.9
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, height + 0.3 * scale, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      scene.add(rock);
      return rock;
    };
    
    // Scatter decorative rocks on hills
    for (let i = 0; i < 100; i++) {
      const x = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      if (!isInWater(x, z)) {
        createHillRock(x, z, 0.5 + Math.random() * 1.5);
      }
    }
    
    // Beach/shore decoration around water
    const createShoreline = (centerX, centerZ, radius) => {
      const shoreGeometry = new THREE.RingGeometry(radius, radius + 5, 48);
      const shoreMaterial = new THREE.MeshStandardMaterial({
        color: 0xc2b280, // Sandy color
        roughness: 0.95
      });
      const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
      shore.rotation.x = -Math.PI / 2;
      shore.position.set(centerX, 0.05, centerZ);
      scene.add(shore);
    };
    
    createShoreline(45, 45, 25); // Lake shore
    createShoreline(-180, 30, 12); // Oasis shore
    
    // Zone transition portals/markers
    const createZonePortal = (x, z, targetZone, label) => {
      const portalGroup = new THREE.Group();
      portalGroup.name = `portal_${targetZone}`;
      portalGroup.userData = { type: 'portal', targetZone, label };
      
      // Portal ring
      const ringGeometry = new THREE.TorusGeometry(2, 0.3, 16, 32);
      const ringMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8b5cf6, 
        emissive: 0x8b5cf6, 
        emissiveIntensity: 0.5 
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 2;
      portalGroup.add(ring);
      
      // Portal glow
      const glowGeometry = new THREE.CircleGeometry(1.8, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xc4b5fd, 
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.y = 2;
      glow.rotation.x = Math.PI / 2;
      portalGroup.add(glow);
      
      // Base
      const baseGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 32);
      const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x4c1d95 });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.15;
      portalGroup.add(base);
      
      portalGroup.position.set(x, 0, z);
      scene.add(portalGroup);
      selectableObjects.current.push(portalGroup);
      return portalGroup;
    };
    
    // Create portals to adjacent zones
    createZonePortal(95, 0, 'darkwood_forest', 'Darkwood Forest');
    createZonePortal(-95, 0, 'scorched_plains', 'Scorched Plains');
    createZonePortal(0, 95, 'crystal_caves', 'Crystal Caves');
    createZonePortal(0, -95, 'frozen_peaks', 'Frozen Peaks');
    
    // Village center
    const centerGeometry = new THREE.CircleGeometry(15, 32);
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0x32CD32 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = -Math.PI / 2;
    center.position.y = 0.02;
    scene.add(center);
    
    // Cobblestone paths - extended
    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    
    // Main north-south path
    const path1 = new THREE.Mesh(new THREE.PlaneGeometry(3, 180), pathMaterial);
    path1.rotation.x = -Math.PI / 2;
    path1.position.y = 0.03;
    scene.add(path1);
    
    // Main east-west path
    const path2 = new THREE.Mesh(new THREE.PlaneGeometry(180, 3), pathMaterial);
    path2.rotation.x = -Math.PI / 2;
    path2.position.y = 0.03;
    scene.add(path2);
    
    // Create Player Character (more detailed)
    const createPlayer = () => {
      const skinColor = character?.skin_tone || '#D2B48C';
      const hairColor = character?.hair_color || '#4a3728';
      const playerGroup = new THREE.Group();
      playerGroup.name = 'player';
      
      // Legs
      const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
      const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8), legMaterial);
      leftLeg.position.set(-0.15, 0.35, 0);
      leftLeg.castShadow = true;
      playerGroup.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8), legMaterial);
      rightLeg.position.set(0.15, 0.35, 0);
      rightLeg.castShadow = true;
      playerGroup.add(rightLeg);
      
      // Torso
      const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), torsoMaterial);
      torso.position.y = 1;
      torso.castShadow = true;
      playerGroup.add(torso);
      
      // Arms
      const armMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
      const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), armMaterial);
      leftArm.position.set(-0.35, 1, 0);
      leftArm.castShadow = true;
      playerGroup.add(leftArm);
      
      const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), armMaterial);
      rightArm.position.set(0.35, 1, 0);
      rightArm.castShadow = true;
      playerGroup.add(rightArm);
      
      // Head
      const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), headMaterial);
      head.position.y = 1.52;
      head.castShadow = true;
      playerGroup.add(head);
      
      // Hair
      const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor });
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        hairMaterial
      );
      hair.position.y = 1.65;
      playerGroup.add(hair);
      
      // Eyes
      const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMaterial);
      leftEye.position.set(-0.07, 1.55, 0.18);
      playerGroup.add(leftEye);
      
      const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMaterial);
      rightEye.position.set(0.07, 1.55, 0.18);
      playerGroup.add(rightEye);
      
      // Weapon (Sword on back)
      const swordGroup = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.8, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.8, roughness: 0.2 })
      );
      swordGroup.add(blade);
      
      const hilt = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.08, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      hilt.position.y = -0.44;
      swordGroup.add(hilt);
      
      swordGroup.position.set(0.25, 1.1, -0.15);
      swordGroup.rotation.set(0.2, 0, 0.15);
      playerGroup.add(swordGroup);
      
      // Selection circle under player
      const selectionCircle = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.55, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
      );
      selectionCircle.rotation.x = -Math.PI / 2;
      selectionCircle.position.y = 0.02;
      playerGroup.add(selectionCircle);
      
      return playerGroup;
    };
    
    const player = createPlayer();
    scene.add(player);
    playerRef.current = player;
    
    // Restore player position from saved game state
    player.position.set(savedPosition.x || 0, 0, savedPosition.z || 0);
    
    // Create target selection indicator
    const targetIndicator = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.7, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    targetIndicator.rotation.x = -Math.PI / 2;
    targetIndicator.visible = false;
    scene.add(targetIndicator);
    targetIndicatorRef.current = targetIndicator;
    
    // Buildings with more detail
    const createBuilding = (x, z, width, height, depth, roofColor, name, type = 'building') => {
      const buildingGroup = new THREE.Group();
      buildingGroup.name = name;
      buildingGroup.userData = { type, name, interactable: true };
      
      // Walls with texture
      const wallsMaterial = new THREE.MeshStandardMaterial({ color: 0xD2691E, roughness: 0.9 });
      const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallsMaterial);
      walls.position.y = height / 2;
      walls.castShadow = true;
      walls.receiveShadow = true;
      buildingGroup.add(walls);
      
      // Roof
      const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 });
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.7, 2.5, 4), roofMaterial);
      roof.position.y = height + 1.25;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      buildingGroup.add(roof);
      
      // Door
      const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2314 });
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), doorMaterial);
      door.position.set(0, 1.1, depth / 2 + 0.01);
      buildingGroup.add(door);
      
      // Windows
      const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xfffacd, 
        emissive: 0xfffacd, 
        emissiveIntensity: 0.2 
      });
      if (width > 4) {
        const leftWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), windowMaterial);
        leftWindow.position.set(-width/3, height * 0.6, depth / 2 + 0.01);
        buildingGroup.add(leftWindow);
        
        const rightWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), windowMaterial);
        rightWindow.position.set(width/3, height * 0.6, depth / 2 + 0.01);
        buildingGroup.add(rightWindow);
      }
      
      // Place building at terrain height
      const terrainY = getTerrainHeight(x, z);
      buildingGroup.position.set(x, terrainY, z);
      scene.add(buildingGroup);
      return buildingGroup;
    };
    
    createBuilding(0, -12, 8, 6, 7, 0x8B0000, 'Town Hall', 'building');
    createBuilding(-10, 5, 5, 4, 5, 0x654321, 'Blacksmith', 'shop');
    createBuilding(10, 5, 5, 4, 5, 0x654321, 'General Store', 'shop');
    createBuilding(-15, -8, 6, 5, 5, 0x4a4a4a, 'Armory', 'shop');
    createBuilding(15, -8, 5, 4, 5, 0x8B4513, 'Inn', 'building');
    
    // Trees
    const createTree = (x, z, scale = 1) => {
      // Skip if in water
      if (isInWater(x, z)) return null;
      
      const treeGroup = new THREE.Group();
      treeGroup.userData = { type: 'tree', interactable: true, resource: 'wood' };
      
      const trunkGeometry = new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 2.5 * scale, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1.25 * scale;
      trunk.castShadow = true;
      treeGroup.add(trunk);
      
      const foliageGeometry = new THREE.ConeGeometry(1.8 * scale, 3 * scale, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 3.5 * scale;
      foliage.castShadow = true;
      treeGroup.add(foliage);
      
      const foliage2 = new THREE.Mesh(
        new THREE.ConeGeometry(1.3 * scale, 2 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x2E8B2E })
      );
      foliage2.position.y = 5 * scale;
      foliage2.castShadow = true;
      treeGroup.add(foliage2);
      
      // Place tree at terrain height
      const terrainY = getTerrainHeight(x, z);
      treeGroup.position.set(x, terrainY, z);
      scene.add(treeGroup);
      selectableObjects.current.push(treeGroup);
      return treeGroup;
    };
    
    // Forest areas
    [[-20, -12], [-25, 0], [-22, 12], [-18, 20], [20, -12], [25, 0], [22, 12], [18, 20],
     [-30, -20], [-35, 5], [30, -20], [35, 5], [0, 28], [-8, 25], [8, 25]].forEach(([x, z]) => {
      createTree(x, z, 0.8 + Math.random() * 0.4);
    });
    
    // NPCs
    const createNPC = (x, z, color, name, type = 'npc') => {
      const npcGroup = new THREE.Group();
      npcGroup.name = name;
      npcGroup.userData = { type, name, interactable: true, color };
      
      // Invisible hitbox for easier clicking
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.5, 1.2),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.y = 1.2;
      npcGroup.add(hitbox);
      
      // Body
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.5, 8, 16), bodyMaterial);
      body.position.y = 0.8;
      body.castShadow = true;
      npcGroup.add(body);
      
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bodyMaterial);
      head.position.y = 1.45;
      head.castShadow = true;
      npcGroup.add(head);
      
      // Role indicator
      const indicatorMaterial = new THREE.MeshStandardMaterial({ 
        color: color, 
        emissive: color, 
        emissiveIntensity: 0.6 
      });
      const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), indicatorMaterial);
      indicator.position.y = 1.85;
      npcGroup.add(indicator);
      
      // Quest marker for quest givers
      if (type === 'questgiver') {
        const exclamation = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.8 })
        );
        exclamation.position.y = 2.1;
        npcGroup.add(exclamation);
      }
      
      // Place NPC at terrain height
      const terrainY = getTerrainHeight(x, z);
      npcGroup.position.set(x, terrainY, z);
      scene.add(npcGroup);
      selectableObjects.current.push(npcGroup);
      return npcGroup;
    };
    
    createNPC(4, 2, 0xfbbf24, 'Quest Giver', 'questgiver');
    createNPC(-8, 6, 0xdc2626, 'Blacksmith NPC', 'vendor');
    createNPC(8, 6, 0x22c55e, 'Merchant', 'vendor');
    createNPC(-3, -5, 0x3b82f6, 'Guard', 'npc');
    createNPC(3, -5, 0x3b82f6, 'Guard', 'npc');
    
    // Warrior Trainer NPC - special trainer for warriors
    const createTrainer = (x, z, trainerClass) => {
      const trainerGroup = new THREE.Group();
      trainerGroup.name = `${trainerClass.charAt(0).toUpperCase() + trainerClass.slice(1)} Trainer`;
      trainerGroup.userData = { 
        type: 'trainer', 
        trainerClass: trainerClass,
        name: trainerGroup.name, 
        interactable: true 
      };
      
      // Invisible hitbox
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 3, 1.5),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.y = 1.5;
      trainerGroup.add(hitbox);
      
      // Body - armored appearance
      const armorMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.6, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 8, 16), armorMaterial);
      body.position.y = 0.9;
      body.castShadow = true;
      trainerGroup.add(body);
      
      // Head
      const headMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), headMaterial);
      head.position.y = 1.55;
      head.castShadow = true;
      trainerGroup.add(head);
      
      // Helmet
      const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x718096, metalness: 0.7, roughness: 0.3 });
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), helmetMaterial);
      helmet.position.y = 1.65;
      trainerGroup.add(helmet);
      
      // Sword on back
      const swordMaterial = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.8 });
      const sword = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.05), swordMaterial);
      sword.position.set(-0.25, 1.2, -0.15);
      sword.rotation.z = -0.3;
      trainerGroup.add(sword);
      
      // Trainer indicator (book icon - yellow glow)
      const indicatorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xf59e0b, 
        emissive: 0xf59e0b, 
        emissiveIntensity: 0.8 
      });
      const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.1), indicatorMaterial);
      indicator.position.y = 2.2;
      trainerGroup.add(indicator);
      
      // "TRAINER" text marker
      const markerGeometry = new THREE.PlaneGeometry(0.8, 0.2);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.y = 2.5;
      trainerGroup.add(marker);
      
      trainerGroup.position.set(x, 0, z);
      scene.add(trainerGroup);
      selectableObjects.current.push(trainerGroup);
      return trainerGroup;
    };
    
    // Place Warrior Trainer near the town hall
    createTrainer(-12, -8, 'warrior');
    
    // Monsters with health bars
    const createMonster = (x, z, color, name, type = 'goblin', level = 1) => {
      const monsterGroup = new THREE.Group();
      monsterGroup.name = name;
      
      // Get max HP based on monster type
      const maxHp = type === 'troll' ? 100 : type === 'wolf' ? 35 : 20;
      monsterGroup.userData = { 
        type: 'monster', 
        monsterType: type, 
        name, 
        level, 
        interactable: true, 
        hostile: true,
        maxHp: maxHp,
        currentHp: maxHp,
        monsterId: `${type}_${x}_${z}`
      };
      
      const size = type === 'troll' ? 1.5 : type === 'wolf' ? 0.8 : 0.7;
      
      // Invisible hitbox for easier clicking
      const hitboxSize = type === 'troll' ? 2.5 : type === 'wolf' ? 1.5 : 1.5;
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(hitboxSize, hitboxSize, hitboxSize),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.y = hitboxSize / 2;
      monsterGroup.add(hitbox);
      
      // Body
      const bodyGeometry = type === 'wolf' 
        ? new THREE.BoxGeometry(0.6, 0.4, 0.9)
        : new THREE.CapsuleGeometry(0.2 * size, 0.4 * size, 8, 16);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = type === 'wolf' ? 0.4 : 0.5 * size;
      body.castShadow = true;
      monsterGroup.add(body);
      
      // Head
      const headSize = type === 'wolf' ? 0.2 : 0.18 * size;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(headSize, 16, 16),
        bodyMaterial
      );
      head.position.y = type === 'wolf' ? 0.5 : 1 * size;
      head.position.z = type === 'wolf' ? 0.4 : 0;
      head.castShadow = true;
      monsterGroup.add(head);
      
      // Eyes
      const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000, 
        emissive: 0xff0000, 
        emissiveIntensity: 0.8 
      });
      const eyeSize = 0.04 * size;
      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(eyeSize, 8, 8), eyeMaterial);
      leftEye.position.set(-0.06 * size, type === 'wolf' ? 0.55 : 1.05 * size, type === 'wolf' ? 0.55 : 0.12 * size);
      monsterGroup.add(leftEye);
      
      const rightEye = new THREE.Mesh(new THREE.SphereGeometry(eyeSize, 8, 8), eyeMaterial);
      rightEye.position.set(0.06 * size, type === 'wolf' ? 0.55 : 1.05 * size, type === 'wolf' ? 0.55 : 0.12 * size);
      monsterGroup.add(rightEye);
      
      // Health bar background
      const healthBarWidth = 1.0;
      const healthBarBg = new THREE.Mesh(
        new THREE.PlaneGeometry(healthBarWidth, 0.12),
        new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
      );
      healthBarBg.position.y = type === 'wolf' ? 1.0 : 1.6 * size;
      healthBarBg.name = 'healthBarBg';
      monsterGroup.add(healthBarBg);
      
      // Health bar fill (red)
      const healthBarFill = new THREE.Mesh(
        new THREE.PlaneGeometry(healthBarWidth - 0.04, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide })
      );
      healthBarFill.position.y = type === 'wolf' ? 1.0 : 1.6 * size;
      healthBarFill.position.z = 0.01;
      healthBarFill.name = 'healthBarFill';
      monsterGroup.add(healthBarFill);
      
      // Level text
      const levelPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.2),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
      );
      levelPlate.position.y = type === 'wolf' ? 1.2 : 1.8 * size;
      levelPlate.rotation.x = 0;
      monsterGroup.add(levelPlate);
      
      // Place monster at terrain height
      const terrainY = getTerrainHeight(x, z);
      monsterGroup.position.set(x, terrainY, z);
      scene.add(monsterGroup);
      selectableObjects.current.push(monsterGroup);
      
      // Store reference to health bar
      monsterHealthBarsRef.current[monsterGroup.userData.monsterId] = {
        group: monsterGroup,
        healthBar: healthBarFill,
        maxWidth: healthBarWidth - 0.04
      };
      
      return monsterGroup;
    };
    
    // Goblin camp
    createMonster(-30, 25, 0x4a7c23, 'Goblin Scout', 'goblin', 2);
    createMonster(-35, 28, 0x4a7c23, 'Goblin', 'goblin', 1);
    createMonster(-28, 30, 0x4a7c23, 'Goblin Warrior', 'goblin', 3);
    createMonster(-33, 22, 0x3d6b1a, 'Goblin Shaman', 'goblin', 5);
    
    // Wolf pack
    createMonster(30, 25, 0x808080, 'Gray Wolf', 'wolf', 4);
    createMonster(35, 22, 0x696969, 'Timber Wolf', 'wolf', 5);
    createMonster(28, 28, 0x808080, 'Young Wolf', 'wolf', 2);
    
    // Troll near ruins
    createMonster(40, -35, 0x556B2F, 'Forest Troll', 'troll', 10);
    
    // Mining rocks
    const createRock = (x, z, color, ore = 'copper') => {
      const rockGroup = new THREE.Group();
      rockGroup.userData = { type: 'resource', resource: ore, interactable: true };
      
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8, 0),
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
      );
      rock.position.y = 0.5;
      rock.castShadow = true;
      rockGroup.add(rock);
      
      // Ore vein highlights
      const vein = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.3, 0),
        new THREE.MeshStandardMaterial({ color: ore === 'copper' ? 0xb87333 : ore === 'iron' ? 0x434343 : 0xffd700, metalness: 0.6 })
      );
      vein.position.set(0.3, 0.6, 0.2);
      rockGroup.add(vein);
      
      rockGroup.position.set(x, 0, z);
      scene.add(rockGroup);
      selectableObjects.current.push(rockGroup);
      return rockGroup;
    };
    
    // Mining area
    createRock(-40, -30, 0x696969, 'copper');
    createRock(-43, -28, 0x696969, 'copper');
    createRock(-38, -33, 0x505050, 'iron');
    createRock(-45, -32, 0x696969, 'copper');
    
    // ==================== COMPREHENSIVE ASSET CREATION ====================
    // Universal function to create any world asset based on fullType
    const createWorldAsset = (x, z, fullType, scale = 1, name = '', level = 1) => {
      console.log('[createWorldAsset] Creating asset:', { x, z, fullType, scale, name, level });
      const terrainY = getTerrainHeight(x, z);
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
          if (fullType.startsWith('monster_') || fullType.startsWith('npc_') || fullType.startsWith('animal_')) {
            console.log('[createWorldAsset] Creating NPC/Monster/Animal');
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
              animal_chicken: 0xf5f5f5, animal_pig: 0xffb6c1, animal_cow: 0x8b4513,
              animal_sheep: 0xf5f5f5, animal_horse: 0x8b4513, animal_deer: 0xd2691e,
              animal_rabbit: 0xd2b48c, animal_fox: 0xff8c00, animal_crow: 0x1a1a1a,
              animal_owl: 0x8b4513, animal_fish: 0x4682b4, animal_frog: 0x228b22,
              animal_cat: 0x808080, animal_dog: 0xd2691e
            };
            const color = monsterColors[fullType] || 0x808080;
            const isMonster = fullType.startsWith('monster_');
            const isAnimal = fullType.startsWith('animal_');
            
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
            
            group.userData = { 
              type: isMonster ? 'monster' : (isAnimal ? 'animal' : 'npc'),
              hostile: isMonster,
              level: level,
              interactable: true,
              monsterType: fullType.replace('monster_', '').replace('npc_', '').replace('animal_', '')
            };
            console.log('[createWorldAsset] Created creature, group children:', group.children.length);
          } else {
            console.log('[createWorldAsset] Fallback case for:', fullType);
            // Fallback - simple cube placeholder
            const placeholder = new THREE.Mesh(
              new THREE.BoxGeometry(scale, scale, scale),
              new THREE.MeshStandardMaterial({ color: 0xff00ff })
            );
            placeholder.position.y = scale / 2;
            group.add(placeholder);
            group.userData = { type: 'unknown' };
          }
          break;
      }
      
      // Position at terrain height
      group.position.set(x, terrainY, z);
      scene.add(group);
      
      if (group.userData.interactable || group.userData.type === 'monster' || group.userData.type === 'npc') {
        selectableObjects.current.push(group);
      }
      
      console.log('[createWorldAsset] Returning group with', group.children.length, 'children, position:', group.position);
      return group;
    };
    
    // Well
    const wellGroup = new THREE.Group();
    const wellBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x696969 })
    );
    wellBase.position.y = 0.4;
    wellGroup.add(wellBase);
    
    const wellWater = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.8 })
    );
    wellWater.position.y = 0.25;
    wellGroup.add(wellWater);
    
    wellGroup.position.set(6, 0, 3);
    scene.add(wellGroup);
    
    // ==================== LOAD SAVED WORLD OBJECTS ====================
    
    const loadSavedWorldObjects = async () => {
      try {
        console.log('Fetching saved world objects...');
        const savedObjects = await fetchWorldObjects();
        console.log('Fetched world objects:', savedObjects?.length || 0, savedObjects);
        
        if (savedObjects && savedObjects.length > 0) {
          console.log(`Loading ${savedObjects.length} saved world objects...`);
          
          savedObjects.forEach(obj => {
            let mesh;
            const pos = obj.position || { x: 0, y: 0, z: 0 };
            const scale = obj.scale || 1;
            
            console.log('RAW OBJECT DATA:', JSON.stringify(obj, null, 2));
            console.log('EXTRACTED POSITION:', pos);
            
            // Use fullType if available, otherwise construct from type/subType
            const fullType = obj.fullType || obj.subType || obj.type;
            
            console.log('Creating world object:', fullType, 'at position:', pos, 'x:', pos.x, 'z:', pos.z);
            
            // Use createWorldAsset for all object types
            mesh = createWorldAsset(
              pos.x,
              pos.z,
              fullType,
              scale,
              obj.name,
              obj.level || 1
            );
            
            if (mesh) {
              mesh.userData.editorId = obj.id;
              editorObjectsRef.current.push(mesh);
              console.log('World object created successfully:', obj.name, 'at mesh position:', mesh.position);
            } else {
              console.warn('Failed to create mesh for object:', obj);
            }
          });
          
          setPlacedObjects(savedObjects);
          console.log('World objects loaded successfully');
        } else {
          console.log('No saved world objects found');
        }
      } catch (err) {
        console.error('Failed to load world objects:', err);
      }
    };
    
    // Load saved enemies from database
    const loadSavedEnemies = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/world/enemies`);
        const data = await response.json();
        if (data.enemies && data.enemies.length > 0) {
          console.log(`Loading ${data.enemies.length} saved enemies...`);
          
          data.enemies.forEach(enemy => {
            createMonster(
              enemy.x,
              enemy.z,
              enemy.enemyType === 'goblin' ? 0x2d5016 :
              enemy.enemyType === 'wolf' ? 0x4a4a4a :
              enemy.enemyType === 'skeleton' ? 0xd4d4d4 :
              enemy.enemyType === 'troll' ? 0x3d5c3d : 0x6b7280,
              enemy.name,
              enemy.enemyType,
              enemy.level,
              enemy.id
            );
          });
          
          setPlacedEnemies(data.enemies);
          console.log('Saved enemies loaded successfully');
        }
      } catch (err) {
        console.error('Failed to load saved enemies:', err);
      }
    };
    
    // Load saved objects and enemies
    loadSavedWorldObjects();
    loadSavedEnemies();
    
    // ==================== EXPANDED ZONE CONTENT ====================
    
    // Darkwood Forest Zone (East) - Dense dark forest with wolves
    const darkwoodTrees = [];
    for (let i = 0; i < 50; i++) {
      const x = 120 + Math.random() * 160;
      const z = -80 + Math.random() * 160;
      const tree = createTree(x, z, 1.0 + Math.random() * 0.5);
      // Make forest trees darker
      if (tree) {
        tree.children.forEach(child => {
          if (child.material && child.material.color) {
            child.material = child.material.clone();
            child.material.color.multiplyScalar(0.6);
          }
        });
        darkwoodTrees.push(tree);
      }
    }
    
    // More wolves in the forest
    createMonster(150, 20, 0x4a4a4a, 'Dark Wolf', 'wolf', 8);
    createMonster(180, -30, 0x3a3a3a, 'Shadow Wolf', 'wolf', 10);
    createMonster(200, 50, 0x4a4a4a, 'Alpha Wolf', 'wolf', 15);
    createMonster(220, -10, 0x5a5a5a, 'Gray Wolf', 'wolf', 6);
    
    // Crystal Caves Zone (North) - Mining area with crystals
    for (let i = 0; i < 20; i++) {
      const x = -60 + Math.random() * 120;
      const z = 120 + Math.random() * 160;
      const oreType = Math.random() > 0.7 ? 'gold' : Math.random() > 0.5 ? 'iron' : 'copper';
      createRock(x, z, oreType === 'gold' ? 0x7a6a4a : 0x5a5a5a, oreType);
    }
    
    // Crystal formations
    const createCrystal = (x, z, color, scale = 1) => {
      const crystalGroup = new THREE.Group();
      crystalGroup.userData = { type: 'crystal', interactable: true };
      
      for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        const height = (1 + Math.random() * 2) * scale;
        const crystal = new THREE.Mesh(
          new THREE.ConeGeometry(0.3 * scale, height, 6),
          new THREE.MeshStandardMaterial({ 
            color: color, 
            emissive: color, 
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
          })
        );
        crystal.position.set(
          (Math.random() - 0.5) * scale,
          height / 2,
          (Math.random() - 0.5) * scale
        );
        crystal.rotation.set(
          (Math.random() - 0.5) * 0.3,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.3
        );
        crystalGroup.add(crystal);
      }
      
      crystalGroup.position.set(x, 0, z);
      scene.add(crystalGroup);
      selectableObjects.current.push(crystalGroup);
      return crystalGroup;
    };
    
    // Purple and blue crystals in caves
    for (let i = 0; i < 15; i++) {
      const x = -50 + Math.random() * 100;
      const z = 130 + Math.random() * 140;
      const color = Math.random() > 0.5 ? 0x8b5cf6 : 0x3b82f6;
      createCrystal(x, z, color, 0.8 + Math.random() * 0.5);
    }
    
    // Cave skeletons
    createMonster(20, 150, 0xd4d4d4, 'Cave Skeleton', 'skeleton', 12);
    createMonster(-30, 180, 0xc4c4c4, 'Ancient Skeleton', 'skeleton', 15);
    createMonster(50, 200, 0xe4e4e4, 'Skeleton Warrior', 'skeleton', 18);
    
    // Scorched Plains Zone (West) - Desert with trolls
    // Cacti/dead trees
    const createDeadTree = (x, z) => {
      const treeGroup = new THREE.Group();
      treeGroup.userData = { type: 'deadtree', interactable: false };
      
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 3, 6),
        new THREE.MeshStandardMaterial({ color: 0x3d3d3d })
      );
      trunk.position.y = 1.5;
      treeGroup.add(trunk);
      
      // Dead branches
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 1.5, 4),
        new THREE.MeshStandardMaterial({ color: 0x3d3d3d })
      );
      branch.position.set(0.4, 2, 0);
      branch.rotation.z = Math.PI / 4;
      treeGroup.add(branch);
      
      treeGroup.position.set(x, 0, z);
      scene.add(treeGroup);
    };
    
    for (let i = 0; i < 20; i++) {
      createDeadTree(-120 - Math.random() * 160, -60 + Math.random() * 120);
    }
    
    // Fire pits in scorched plains
    const createFirePit = (x, z) => {
      const pitGroup = new THREE.Group();
      
      const rocks = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
      );
      rocks.rotation.x = Math.PI / 2;
      rocks.position.y = 0.1;
      pitGroup.add(rocks);
      
      // Fire glow
      const fire = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff6600 })
      );
      fire.position.y = 0.5;
      pitGroup.add(fire);
      
      pitGroup.position.set(x, 0, z);
      scene.add(pitGroup);
    };
    
    createFirePit(-180, 0);
    createFirePit(-220, 40);
    createFirePit(-200, -50);
    
    // Trolls and fire elementals
    createMonster(-160, 30, 0x556B2F, 'Desert Troll', 'troll', 20);
    createMonster(-200, -20, 0x4a6b2f, 'Sand Troll', 'troll', 18);
    createMonster(-240, 60, 0x667b3f, 'Elder Troll', 'troll', 25);
    
    // Frozen Peaks Zone (South) - Snowy mountains
    // Snow mounds and ice
    const createSnowMound = (x, z, scale = 1) => {
      const mound = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 * scale, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
      );
      mound.position.set(x, 0, z);
      scene.add(mound);
    };
    
    for (let i = 0; i < 30; i++) {
      createSnowMound(
        -60 + Math.random() * 120,
        -130 - Math.random() * 150,
        0.5 + Math.random() * 1.5
      );
    }
    
    // Ice formations
    const createIceSpike = (x, z) => {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.4, 2 + Math.random() * 2, 4),
        new THREE.MeshStandardMaterial({ 
          color: 0xadd8e6, 
          transparent: true, 
          opacity: 0.7,
          roughness: 0.1
        })
      );
      spike.position.set(x, 1, z);
      scene.add(spike);
    };
    
    for (let i = 0; i < 25; i++) {
      createIceSpike(-50 + Math.random() * 100, -140 - Math.random() * 140);
    }
    
    // Ice wolves and yetis
    createMonster(0, -150, 0xffffff, 'Frost Wolf', 'wolf', 12);
    createMonster(-40, -200, 0xe8e8e8, 'Ice Wolf', 'wolf', 14);
    createMonster(30, -180, 0xf0f0f0, 'Snow Wolf', 'wolf', 10);
    
    // Yeti (use troll model with white color)
    createMonster(0, -250, 0xffffff, 'Yeti', 'troll', 30);
    
    // ==================== WOW-STYLE CONTROLS ====================
    
    // ==================== TERRAIN EDITING FUNCTIONS ====================
    
    // Update path mesh based on current nodes
    const updatePathMesh = () => {
      const scene = sceneRef.current;
      if (!scene) return;
      
      // Store function in ref for external access
      updatePathMeshRef.current = updatePathMesh;
      
      // Remove old path mesh
      if (pathMeshRef.current) {
        scene.remove(pathMeshRef.current);
        pathMeshRef.current.geometry.dispose();
        pathMeshRef.current.material.dispose();
        pathMeshRef.current = null;
      }
      
      const nodes = pathNodesRef.current;
      if (nodes.length < 2) return; // Need at least 2 nodes to make a path
      
      // Create path geometry
      const pathGeometry = new THREE.BufferGeometry();
      const vertices = [];
      const indices = [];
      const colors = [];
      
      const width = pathWidth / 2; // Half width for each side
      const pathColor = new THREE.Color(0xd4a574); // Sandy path color
      
      for (let i = 0; i < nodes.length - 1; i++) {
        const p1 = nodes[i];
        const p2 = nodes[i + 1];
        
        // Direction vector
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        
        if (len === 0) continue;
        
        // Perpendicular vector (for width)
        const px = -dz / len * width;
        const pz = dx / len * width;
        
        // Create quad for this segment (slightly above terrain)
        const offset = 0.15; // Height above terrain
        const baseIndex = vertices.length / 3;
        
        // 4 vertices for quad
        vertices.push(
          p1.x + px, p1.y + offset, p1.z + pz,  // Left front
          p1.x - px, p1.y + offset, p1.z - pz,  // Right front
          p2.x + px, p2.y + offset, p2.z + pz,  // Left back
          p2.x - px, p2.y + offset, p2.z - pz   // Right back
        );
        
        // Colors (all same)
        for (let j = 0; j < 4; j++) {
          colors.push(pathColor.r, pathColor.g, pathColor.b);
        }
        
        // 2 triangles to form quad
        indices.push(
          baseIndex, baseIndex + 1, baseIndex + 2,
          baseIndex + 1, baseIndex + 3, baseIndex + 2
        );
      }
      
      pathGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      pathGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      pathGeometry.setIndex(indices);
      pathGeometry.computeVertexNormals();
      
      const pathMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1
      });
      
      const pathMesh = new THREE.Mesh(pathGeometry, pathMaterial);
      pathMesh.receiveShadow = true;
      scene.add(pathMesh);
      pathMeshRef.current = pathMesh;
    };
    
    const editTerrainAtPoint = (point) => {
      if (!terrainGeometryRef.current || !terrainMeshRef.current) return;
      
      const tool = terrainToolRef.current;
      
      // Path tool - add node instead of editing terrain
      if (tool === 'path') {
        const newNode = { x: point.x, y: point.y, z: point.z };
        pathNodesRef.current = [...pathNodesRef.current, newNode];
        setPathNodes([...pathNodesRef.current]);
        updatePathMesh();
        return;
      }
      
      const geometry = terrainGeometryRef.current;
      const positionAttr = geometry.getAttribute('position');
      const colorAttr = geometry.getAttribute('color');
      const worldSize = 600;
      const segments = 200;
      const vertexSpacing = worldSize / segments;
      
      // Get current brush settings from refs (for closure)
      const radius = brushSizeRef.current;
      const strength = brushStrengthRef.current;
      
      // Convert world point to local geometry coordinates
      // The terrain mesh is rotated -90 degrees around X
      // So world X = geo X, world Z = -geo Y
      const geoX = point.x;
      const geoY = -point.z;
      
      let targetHeight = 0;
      let verticesInBrush = 0;
      
      // First pass for flatten - calculate average height
      if (tool === 'flatten' || tool === 'smooth') {
        for (let i = 0; i < positionAttr.count; i++) {
          const vx = positionAttr.getX(i);
          const vy = positionAttr.getY(i);
          const dist = Math.sqrt((vx - geoX) ** 2 + (vy - geoY) ** 2);
          
          if (dist < radius) {
            targetHeight += positionAttr.getZ(i);
            verticesInBrush++;
          }
        }
        if (verticesInBrush > 0) {
          targetHeight /= verticesInBrush;
        }
      }
      
      // Second pass - modify vertices
      for (let i = 0; i < positionAttr.count; i++) {
        const vx = positionAttr.getX(i);
        const vy = positionAttr.getY(i);
        const dist = Math.sqrt((vx - geoX) ** 2 + (vy - geoY) ** 2);
        
        if (dist < radius) {
          // Falloff - stronger in center, weaker at edges
          const falloff = 1 - (dist / radius);
          const currentHeight = positionAttr.getZ(i);
          let newHeight = currentHeight;
          
          switch (tool) {
            case 'raise':
              newHeight = currentHeight + strength * falloff * 0.3;
              break;
            case 'lower':
              newHeight = Math.max(0, currentHeight - strength * falloff * 0.3);
              break;
            case 'flatten':
              newHeight = currentHeight + (targetHeight - currentHeight) * falloff * strength * 0.2;
              break;
            case 'smooth':
              newHeight = currentHeight + (targetHeight - currentHeight) * falloff * strength * 0.1;
              break;
            case 'road':
              // Flatten and paint brown
              newHeight = currentHeight + (0.1 - currentHeight) * falloff * strength * 0.3;
              // Paint road color (brown/gray)
              const roadColor = new THREE.Color(0x6b5b4f);
              colorAttr.setXYZ(i, 
                colorAttr.getX(i) + (roadColor.r - colorAttr.getX(i)) * falloff * strength * 0.3,
                colorAttr.getY(i) + (roadColor.g - colorAttr.getY(i)) * falloff * strength * 0.3,
                colorAttr.getZ(i) + (roadColor.b - colorAttr.getZ(i)) * falloff * strength * 0.3
              );
              break;
            case 'water':
              // Flatten to low height and paint blue/cyan water color
              const waterHeight = -0.5; // Slightly below ground level
              newHeight = currentHeight + (waterHeight - currentHeight) * falloff * strength * 0.5;
              // Paint water color (cyan/blue)
              const waterColor = new THREE.Color(0x4a9eff); // Nice water blue
              colorAttr.setXYZ(i, 
                colorAttr.getX(i) + (waterColor.r - colorAttr.getX(i)) * falloff * strength * 0.4,
                colorAttr.getY(i) + (waterColor.g - colorAttr.getY(i)) * falloff * strength * 0.4,
                colorAttr.getZ(i) + (waterColor.b - colorAttr.getZ(i)) * falloff * strength * 0.4
              );
              break;
          }
          
          positionAttr.setZ(i, newHeight);
        }
      }
      
      // Mark for GPU update
      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      geometry.computeVertexNormals();
    };
    
    // Prevent context menu on right-click
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    renderer.domElement.addEventListener('contextmenu', preventContextMenu);
    
    // Track if right-click selected something (to prevent camera rotation)
    let rightClickSelectedTarget = false;
    
    // Mouse controls - Right-click to select targets (WoW style)
    const handleMouseDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      if (e.button === 2) { // Right click - TARGET SELECTION
        e.preventDefault();
        e.stopPropagation();
        rightClickSelectedTarget = false;
        
        // Check for target selection
        const intersects = raycasterRef.current.intersectObjects(selectableObjects.current, true);
        
        if (intersects.length > 0) {
          // Find the root group with interactable flag
          let targetObject = intersects[0].object;
          
          // Walk up the parent chain to find the selectable group
          while (targetObject) {
            if (targetObject.userData && (
              targetObject.userData.interactable || 
              targetObject.userData.hostile ||  // Added: hostile enemies are selectable
              targetObject.userData.isCorpse ||  // Added: corpses are selectable for looting
              targetObject.userData.type === 'monster' || 
              targetObject.userData.type === 'npc' ||
              targetObject.userData.type === 'portal' ||
              targetObject.userData.type === 'questgiver' ||
              targetObject.userData.type === 'vendor' ||
              targetObject.userData.type === 'trainer'
            )) {
              rightClickSelectedTarget = true;
              
              // CORPSE LOOTING - Check if this is a lootable corpse
              if (targetObject.userData.isCorpse && targetObject.userData.enemyId) {
                const corpseId = targetObject.userData.enemyId;
                const corpseData = lootableCorpsesRef.current.get(corpseId);
                
                // Check distance to corpse (must be within 8 yards - more lenient)
                const dx = playerRef.current.position.x - targetObject.position.x;
                const dz = playerRef.current.position.z - targetObject.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance <= 8) {
                  if (corpseData) {
                    handleOpenLoot(corpseId);
                  } else {
                    addNotification('This corpse has no loot', 'info');
                  }
                } else {
                  addNotification('You are too far away to loot', 'error');
                }
                return;
              }
              
              // Portal handling
              if (targetObject.userData.type === 'portal') {
                setSelectedTarget(targetObject);
                targetIndicatorRef.current.visible = true;
                targetIndicatorRef.current.position.copy(targetObject.position);
                targetIndicatorRef.current.position.y = 0.05;
                targetIndicatorRef.current.material.color.setHex(0x8b5cf6);
                addNotification(`Portal to ${WORLD_ZONES[targetObject.userData.targetZone]?.name || 'Unknown'}`, 'info');
                return;
              }
              
              // Select target and show indicator
              setSelectedTarget(targetObject);
              targetIndicatorRef.current.visible = true;
              targetIndicatorRef.current.position.copy(targetObject.position);
              targetIndicatorRef.current.position.y = 0.05;
              
              // Set color and show notification based on target type
              if (targetObject.userData.hostile) {
                targetIndicatorRef.current.material.color.setHex(0xff0000); // Red for hostile
                addNotification(`Target: ${targetObject.name || 'Enemy'} (Level ${targetObject.userData.level || '?'})`, 'info');
              } else if (targetObject.userData.type === 'trainer') {
                targetIndicatorRef.current.material.color.setHex(0xf59e0b); // Orange for trainers
                addNotification(`${targetObject.name || 'Trainer'} - Double-click to train`, 'info');
              } else if (targetObject.userData.type === 'questgiver') {
                targetIndicatorRef.current.material.color.setHex(0xfbbf24); // Yellow for quest givers
                addNotification(`${targetObject.name || 'Quest Giver'} selected`, 'info');
              } else if (targetObject.userData.type === 'vendor') {
                targetIndicatorRef.current.material.color.setHex(0x22c55e); // Green for vendors
                addNotification(`${targetObject.name || 'Vendor'} selected`, 'info');
              } else if (targetObject.userData.type === 'npc' || targetObject.userData.type === 'guard') {
                targetIndicatorRef.current.material.color.setHex(0x3b82f6); // Blue for NPCs
                addNotification(`${targetObject.name || 'NPC'} selected`, 'info');
              } else {
                targetIndicatorRef.current.material.color.setHex(0xffff00); // Default yellow
                addNotification(`Selected: ${targetObject.name || targetObject.userData.type || 'Object'}`, 'info');
              }
              return;
            }
            targetObject = targetObject.parent;
          }
        }
        
        // No target found - start camera rotation mode
        cameraState.current.isRightMouseDown = true;
        cameraState.current.lastMouseX = e.clientX;
        cameraState.current.lastMouseY = e.clientY;
        
      } else if (e.button === 0) { // Left click - Editor placement or deselect
        cameraState.current.isLeftMouseDown = true;
        
        // TERRAIN EDITOR - Handle terrain editing
        if (terrainEditorActiveRef.current && terrainMeshRef.current) {
          const terrainIntersects = raycasterRef.current.intersectObject(terrainMeshRef.current);
          if (terrainIntersects.length > 0) {
            isTerrainEditingRef.current = true;
            editTerrainAtPoint(terrainIntersects[0].point);
            return; // Don't process other clicks
          }
        }
        
        // If in editor mode and have pending placement, place object on ground
        // Use refs to get current values (closure fix)
        const editorOpen = isEditorOpenRef.current;
        const placement = pendingPlacementRef.current;
        const zone = currentZoneRef.current;
        
        // ENEMY EDITOR - Place enemy on click
        if (enemyEditorActiveRef.current && pendingEnemyPlacementRef.current) {
          console.log('[Enemy Placement] Spawning enemy:', pendingEnemyPlacementRef.current);
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const intersectPoint = new THREE.Vector3();
          raycasterRef.current.ray.intersectPlane(groundPlane, intersectPoint);
          
          if (intersectPoint) {
            const enemyId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create enemy mesh
            const enemyMesh = createEnemyMesh(
              intersectPoint.x,
              intersectPoint.z,
              pendingEnemyPlacementRef.current,
              enemyId
            );
            
            console.log('[Enemy Placement] Created enemy mesh:', enemyMesh);
            
            if (enemyMesh) {
              sceneRef.current.add(enemyMesh);
              enemyMeshesRef.current.push(enemyMesh);
              selectableObjects.current.push(enemyMesh);
              
              const newEnemy = {
                id: enemyId,
                ...pendingEnemyPlacementRef.current,
                position: { x: intersectPoint.x, y: 0, z: intersectPoint.z },
                zone: zone
              };
              
              setPlacedEnemies(prev => [...prev, newEnemy]);
              addNotification(`Spawned ${pendingEnemyPlacementRef.current.name} Lv.${pendingEnemyPlacementRef.current.level}`, 'success');
            } else {
              console.error('[Enemy Placement] Failed to create enemy mesh');
              addNotification(`Failed to spawn ${pendingEnemyPlacementRef.current.name}`, 'error');
            }
            
            setPendingEnemyPlacement(null);
          }
          return;
        }
        
        if (editorOpen && placement) {
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const intersectPoint = new THREE.Vector3();
          raycasterRef.current.ray.intersectPlane(groundPlane, intersectPoint);
          
          if (intersectPoint) {
            console.log('[NPC Placement] Placing object:', placement);
            const objId = `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newObj = {
              id: objId,
              type: placement.type,
              subType: placement.subType,
              fullType: placement.fullType,
              category: placement.category,
              name: placement.name,
              level: placement.level,
              scale: placement.scale,
              position: { x: intersectPoint.x, y: 0, z: intersectPoint.z },
              zone: zone
            };
            
            // Create visual object using comprehensive asset creator
            let mesh;
            const fullType = placement.fullType || placement.subType || placement.type;
            console.log('[NPC Placement] FullType for creation:', fullType);
            
            // Use the new createWorldAsset function for all object types
            mesh = createWorldAsset(
              intersectPoint.x,
              intersectPoint.z,
              fullType,
              placement.scale,
              placement.name,
              placement.level
            );
            
            console.log('[NPC Placement] Created mesh:', mesh);
            
            if (mesh) {
              mesh.userData.editorId = objId;
              editorObjectsRef.current.push(mesh);
              setPlacedObjects(prev => [...prev, newObj]);
              
              // Save to database
              saveWorldObject(newObj).then(() => {
                addNotification(`Placed ${placement.name || fullType}`, 'success');
              }).catch(() => {
                addNotification(`Placed locally (save pending)`, 'warning');
              });
            } else {
              console.error('[NPC Placement] Failed to create mesh for:', fullType);
              addNotification(`Failed to place ${placement.name || fullType}`, 'error');
            }
            
            setPendingPlacement(null);
          }
          return;
        }
        
        // Left click - check for target selection (same as right-click)
        const intersects = raycasterRef.current.intersectObjects(selectableObjects.current, true);
        
        if (intersects.length > 0) {
          // Find the root group with interactable flag
          let targetObject = intersects[0].object;
          
          // Walk up the parent chain to find the selectable group
          while (targetObject) {
            if (targetObject.userData && (
              targetObject.userData.interactable || 
              targetObject.userData.type === 'monster' || 
              targetObject.userData.type === 'npc' ||
              targetObject.userData.type === 'portal' ||
              targetObject.userData.type === 'questgiver' ||
              targetObject.userData.type === 'vendor' ||
              targetObject.userData.type === 'trainer'
            )) {
              // Portal handling
              if (targetObject.userData.type === 'portal') {
                setSelectedTarget(targetObject);
                targetIndicatorRef.current.visible = true;
                targetIndicatorRef.current.position.copy(targetObject.position);
                targetIndicatorRef.current.position.y = 0.05;
                targetIndicatorRef.current.material.color.setHex(0x8b5cf6);
                addNotification(`Portal to ${WORLD_ZONES[targetObject.userData.targetZone]?.name || 'Unknown'}`, 'info');
                return;
              }
              
              // Select target and show indicator
              setSelectedTarget(targetObject);
              targetIndicatorRef.current.visible = true;
              targetIndicatorRef.current.position.copy(targetObject.position);
              targetIndicatorRef.current.position.y = 0.05;
              
              // Set color and notification based on target type
              if (targetObject.userData.hostile) {
                targetIndicatorRef.current.material.color.setHex(0xff0000);
                addNotification(`Target: ${targetObject.name || 'Enemy'} (Level ${targetObject.userData.level || '?'})`, 'info');
                // Start auto-attacking hostile targets
                setIsAutoAttacking(true);
                enterCombat();
              } else if (targetObject.userData.type === 'trainer') {
                targetIndicatorRef.current.material.color.setHex(0xf59e0b); // Orange for trainers
                addNotification(`${targetObject.name || 'Trainer'} - Double-click to train`, 'info');
              } else if (targetObject.userData.type === 'questgiver') {
                targetIndicatorRef.current.material.color.setHex(0xfbbf24);
                addNotification(`${targetObject.name || 'Quest Giver'} selected`, 'info');
              } else if (targetObject.userData.type === 'vendor') {
                targetIndicatorRef.current.material.color.setHex(0x22c55e);
                addNotification(`${targetObject.name || 'Vendor'} selected`, 'info');
              } else if (targetObject.userData.type === 'npc' || targetObject.userData.type === 'guard') {
                targetIndicatorRef.current.material.color.setHex(0x3b82f6);
                addNotification(`${targetObject.name || 'NPC'} selected`, 'info');
              } else {
                targetIndicatorRef.current.material.color.setHex(0xffff00);
                addNotification(`Selected: ${targetObject.name || targetObject.userData.type || 'Object'}`, 'info');
              }
              return;
            }
            targetObject = targetObject.parent;
          }
        }
        
        // Left click on empty space deselects target
        setSelectedTarget(null);
        setIsAutoAttacking(false);
        targetIndicatorRef.current.visible = false;
      }
    };
    
    const handleMouseUp = (e) => {
      if (e.button === 2) {
        cameraState.current.isRightMouseDown = false;
      } else if (e.button === 0) {
        cameraState.current.isLeftMouseDown = false;
        isTerrainEditingRef.current = false;
      }
    };
    
    const handleMouseMove = (e) => {
      // Update mouse position for raycasting
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      // Check for lootable corpse hover (change cursor)
      const hoverIntersects = raycasterRef.current.intersectObjects(selectableObjects.current, true);
      let foundCorpse = false;
      
      for (let i = 0; i < hoverIntersects.length; i++) {
        let obj = hoverIntersects[i].object;
        while (obj) {
          if (obj.userData && obj.userData.isCorpse) {
            foundCorpse = true;
            break;
          }
          obj = obj.parent;
        }
        if (foundCorpse) break;
      }
      
      // Update cursor based on hover
      if (foundCorpse) {
        renderer.domElement.style.cursor = 'pointer';
      } else if (!cameraState.current.isRightMouseDown) {
        renderer.domElement.style.cursor = 'default';
      }
      
      // Update brush indicator when terrain editor is open
      if (terrainEditorActiveRef.current && terrainMeshRef.current && brushIndicatorRef.current) {
        const terrainIntersects = raycasterRef.current.intersectObject(terrainMeshRef.current);
        if (terrainIntersects.length > 0) {
          const point = terrainIntersects[0].point;
          brushIndicatorRef.current.position.set(point.x, point.y + 0.2, point.z);
          brushIndicatorRef.current.scale.setScalar(brushSizeRef.current);
          brushIndicatorRef.current.visible = true;
          
          // Continue editing while dragging
          if (isTerrainEditingRef.current && cameraState.current.isLeftMouseDown) {
            editTerrainAtPoint(point);
          }
        } else {
          brushIndicatorRef.current.visible = false;
        }
      } else if (brushIndicatorRef.current) {
        brushIndicatorRef.current.visible = false;
      }
      
      if (cameraState.current.isRightMouseDown) {
        const deltaX = e.clientX - cameraState.current.lastMouseX;
        const deltaY = e.clientY - cameraState.current.lastMouseY;
        
        if (isMapEditorMode && e.ctrlKey) {
          // Map Editor Mode: Ctrl+RMB Drag to pan camera
          const panSpeed = 0.5;
          mapEditorCameraState.current.x -= deltaX * panSpeed;
          mapEditorCameraState.current.z -= deltaY * panSpeed;
          
          // Clamp to world bounds
          mapEditorCameraState.current.x = Math.max(-280, Math.min(280, mapEditorCameraState.current.x));
          mapEditorCameraState.current.z = Math.max(-280, Math.min(280, mapEditorCameraState.current.z));
        } else if (!isMapEditorMode) {
          // Game Mode: Rotate camera horizontally
          cameraState.current.rotationY -= deltaX * 0.005;
          
          // Rotate camera vertically (with limits)
          cameraState.current.rotationX += deltaY * 0.005;
          cameraState.current.rotationX = Math.max(
            cameraState.current.minPitch,
            Math.min(cameraState.current.maxPitch, cameraState.current.rotationX)
          );
        }
        
        cameraState.current.lastMouseX = e.clientX;
        cameraState.current.lastMouseY = e.clientY;
      }
    };
    
    const handleWheel = (e) => {
      if (isMapEditorModeRef.current && !isFlightModeRef.current) {
        // Map Editor Mode (not in flight): Adjust camera height
        mapEditorCameraState.current.height -= e.deltaY * 0.1;
        mapEditorCameraState.current.height = Math.max(
          mapEditorCameraState.current.minHeight,
          Math.min(mapEditorCameraState.current.maxHeight, mapEditorCameraState.current.height)
        );
      } else if (!isMapEditorModeRef.current) {
        // Game Mode: Zoom in/out
        cameraState.current.distance += e.deltaY * 0.01;
        cameraState.current.distance = Math.max(
          cameraState.current.minDistance,
          Math.min(cameraState.current.maxDistance, cameraState.current.distance)
        );
      }
      // In flight mode, mouse wheel is disabled (height auto-follows terrain)
    };
    
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    
    // Double click to interact/attack with visual feedback
    const handleDoubleClick = (e) => {
      const target = selectedTargetRef.current; // Use ref to get current selected target
      
      if (target && target.userData.hostile) {
        // Attack the monster
        const monsterType = target.userData.monsterType || 'goblin';
        const monsterId = target.userData.monsterId;
        const targetPosition = target.position.clone();
        
        attackMonster(monsterType).then(result => {
          // Show damage dealt to monster
          if (result.damage_dealt > 0) {
            const damageSprite = createDamageText(scene, targetPosition, result.damage_dealt, false);
            damageTextsRef.current.push(damageSprite);
          }
          
          // Show damage taken by player
          if (result.damage_taken > 0 && playerRef.current) {
            const playerDamageSprite = createDamageText(scene, playerRef.current.position.clone(), result.damage_taken, true);
            damageTextsRef.current.push(playerDamageSprite);
          }
          
          // Update monster health bar
          const healthBarData = monsterHealthBarsRef.current[monsterId];
          if (healthBarData && healthBarData.healthBar) {
            const hpPercent = Math.max(0, result.monster_hp / target.userData.maxHealth);
            healthBarData.healthBar.scale.x = hpPercent;
            healthBarData.healthBar.position.x = -(healthBarData.maxWidth * (1 - hpPercent)) / 2;
            
            // Update stored HP
            target.userData.currentHealth = result.monster_hp;
          }
          
          // Add to combat log
          setCombatLog(prev => [...prev.slice(-9), {
            time: Date.now(),
            text: `You hit ${target.name} for ${result.damage_dealt} damage!`
          }]);
          
          if (result.damage_taken > 0) {
            setCombatLog(prev => [...prev.slice(-9), {
              time: Date.now(),
              text: `${target.name} hits you for ${result.damage_taken} damage!`
            }]);
          }
          
          if (result.monster_defeated) {
            addNotification(`Defeated ${target.name}! +${result.xp_gained} XP`, 'success');
            
            // Remove monster from scene after defeat
            setTimeout(() => {
              scene.remove(target);
              selectableObjects.current = selectableObjects.current.filter(obj => obj !== target);
              delete monsterHealthBarsRef.current[monsterId];
              setSelectedTarget(null);
              targetIndicatorRef.current.visible = false;
            }, 500);
            
            if (result.drop) {
              setCombatLog(prev => [...prev.slice(-9), {
                time: Date.now(),
                text: `Loot: ${result.drop}`
              }]);
            }
          }
        }).catch(err => {
          console.error('Attack failed:', err);
          addNotification('Attack failed!', 'error');
        });
      } else if (target && target.userData.type === 'trainer') {
        // Open trainer panel
        if (target.userData.trainerClass === 'warrior') {
          setIsTrainerOpen(true);
          addNotification(`Training with ${target.name}`, 'info');
        }
      } else if (target && target.userData.type === 'portal') {
        // Use portal on double-click
        const targetZone = target.userData.targetZone;
        const zoneData = WORLD_ZONES[targetZone];
        if (zoneData && playerRef.current) {
          playerRef.current.position.set(zoneData.spawnPoint.x, 0, zoneData.spawnPoint.z);
          addNotification(`Traveling to ${zoneData.name}...`, 'info');
        }
      } else if (target && target.userData.type === 'questgiver') {
        // Open quest dialog for quest givers
        setQuestGiverName(target.name || 'Quest Giver');
        setIsQuestDialogOpen(true);
      } else if (target && target.userData.type === 'npc') {
        addNotification(`${target.name}: "Hello, adventurer!"`, 'info');
      } else if (target && target.userData.type === 'vendor') {
        addNotification(`${target.name}: "Take a look at my wares!"`, 'info');
      }
    };
    
    // Keyboard controls
    const handleKeyDown = (e) => {
      // Ctrl+S to save world
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault();
        handleSaveWorld();
        return;
      }
      
      // Don't process keys if a dialog is open
      if (isQuestDialogOpen || isQuestLogOpen || isTrainerOpen || isSpellBookOpen || isCharacterPanelOpen || isItemEditorOpen) {
        if (e.code === 'Escape') {
          setIsQuestDialogOpen(false);
          setIsQuestLogOpen(false);
          setIsTrainerOpen(false);
          setIsSpellBookOpen(false);
          setIsCharacterPanelOpen(false);
          setIsItemEditorOpen(false);
        }
        return;
      }
      
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': movementState.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': movementState.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': movementState.current.left = true; break;
        case 'KeyD': case 'ArrowRight': movementState.current.right = true; break;
        case 'KeyL':
          // Toggle Quest Log
          setIsQuestLogOpen(prev => !prev);
          break;
        case 'Space': 
          if (!movementState.current.isJumping) {
            movementState.current.jump = true;
            movementState.current.isJumping = true;
            movementState.current.velocityY = 0.2;
          }
          break;
        case 'KeyR':
          if (isMapEditorMode) {
            // Map Editor: Increase tilt (more top-down)
            mapEditorCameraState.current.tilt = Math.min(
              mapEditorCameraState.current.maxTilt,
              mapEditorCameraState.current.tilt + 0.1
            );
          } else {
            // Game Mode: Toggle auto-run
            movementState.current.autoRun = !movementState.current.autoRun;
          }
          break;
        case 'KeyF':
          if (isMapEditorMode) {
            // Map Editor: Decrease tilt (more angled)
            mapEditorCameraState.current.tilt = Math.max(
              mapEditorCameraState.current.minTilt,
              mapEditorCameraState.current.tilt - 0.1
            );
          }
          break;
        case 'KeyQ':
          if (isMapEditorMode) {
            // Map Editor: Rotate camera left
            mapEditorCameraState.current.rotationY += 0.1;
          }
          break;
        case 'KeyE':
          if (isMapEditorMode) {
            // Map Editor: Rotate camera right
            mapEditorCameraState.current.rotationY -= 0.1;
          }
          break;
        case 'Tab':
          e.preventDefault();
          // Target nearest enemy
          let nearestEnemy = null;
          let nearestDist = Infinity;
          selectableObjects.current.forEach(obj => {
            if (obj.userData.hostile) {
              const dist = playerRef.current.position.distanceTo(obj.position);
              if (dist < nearestDist) {
                nearestDist = dist;
                nearestEnemy = obj;
              }
            }
          });
          if (nearestEnemy) {
            setSelectedTarget(nearestEnemy);
            targetIndicatorRef.current.visible = true;
            targetIndicatorRef.current.position.copy(nearestEnemy.position);
            targetIndicatorRef.current.position.y = 0.05;
            targetIndicatorRef.current.material.color.setHex(0xff0000);
          }
          break;
        case 'Digit1':
        case 'Numpad1':
          // Attack hotkey - press 1 to attack selected target
          const attackTarget = selectedTargetRef.current;
          if (attackTarget && attackTarget.userData.hostile) {
            const monsterType = attackTarget.userData.monsterType || 'goblin';
            const monsterId = attackTarget.userData.monsterId;
            const targetPosition = attackTarget.position.clone();
            
            attackMonster(monsterType).then(result => {
              if (result.damage_dealt > 0) {
                const damageSprite = createDamageText(scene, targetPosition, result.damage_dealt, false);
                damageTextsRef.current.push(damageSprite);
              }
              if (result.damage_taken > 0 && playerRef.current) {
                const playerDamageSprite = createDamageText(scene, playerRef.current.position.clone(), result.damage_taken, true);
                damageTextsRef.current.push(playerDamageSprite);
              }
              const healthBarData = monsterHealthBarsRef.current[monsterId];
              if (healthBarData && healthBarData.healthBar) {
                const hpPercent = Math.max(0, result.monster_hp / attackTarget.userData.maxHealth);
                healthBarData.healthBar.scale.x = hpPercent;
                healthBarData.healthBar.position.x = -(healthBarData.maxWidth * (1 - hpPercent)) / 2;
                attackTarget.userData.currentHealth = result.monster_hp;
              }
              setCombatLog(prev => [...prev.slice(-9), {
                time: Date.now(),
                text: `You hit ${attackTarget.name} for ${result.damage_dealt} damage!`
              }]);
              if (result.damage_taken > 0) {
                setCombatLog(prev => [...prev.slice(-9), {
                  time: Date.now(),
                  text: `${attackTarget.name} hits you for ${result.damage_taken} damage!`
                }]);
              }
              if (result.monster_defeated) {
                addNotification(`Defeated ${attackTarget.name}! +${result.xp_gained} XP`, 'success');
                setTimeout(() => {
                  scene.remove(attackTarget);
                  selectableObjects.current = selectableObjects.current.filter(obj => obj !== attackTarget);
                  delete monsterHealthBarsRef.current[monsterId];
                  setSelectedTarget(null);
                  targetIndicatorRef.current.visible = false;
                }, 500);
                if (result.drop) {
                  setCombatLog(prev => [...prev.slice(-9), { time: Date.now(), text: `Loot: ${result.drop}` }]);
                }
              }
            }).catch(err => {
              console.error('Attack failed:', err);
              addNotification('Attack failed!', 'error');
            });
          } else {
            // Use spell from action bar slot 1
            handleCastSpell(actionBarSpells[0]);
          }
          break;
        case 'Digit2':
        case 'Numpad2':
          handleCastSpell(actionBarSpells[1]);
          break;
        case 'Digit3':
        case 'Numpad3':
          handleCastSpell(actionBarSpells[2]);
          break;
        case 'Digit4':
        case 'Numpad4':
          handleCastSpell(actionBarSpells[3]);
          break;
        case 'Digit5':
        case 'Numpad5':
          handleCastSpell(actionBarSpells[4]);
          break;
        case 'Digit6':
        case 'Numpad6':
          handleCastSpell(actionBarSpells[5]);
          break;
        case 'KeyP':
          e.preventDefault();
          setIsSpellBookOpen(prev => !prev);
          break;
        case 'KeyB':
          e.preventDefault();
          // Toggle backpack (bag 0)
          setOpenBagIndex(prev => prev === 0 ? null : 0);
          break;
        case 'KeyC':
          e.preventDefault();
          // Toggle character panel
          setIsCharacterPanelOpen(prev => !prev);
          break;
        case 'Escape':
          setSelectedTarget(null);
          setIsAutoAttacking(false);
          targetIndicatorRef.current.visible = false;
          // Also close panels if open
          if (isEditorOpen) setIsEditorOpen(false);
          if (isSpellBookOpen) setIsSpellBookOpen(false);
          if (isTerrainEditorOpen) setIsTerrainEditorOpen(false);
          if (isEnemyEditorOpen) setIsEnemyEditorOpen(false);
          if (openBagIndex !== null) setOpenBagIndex(null);
          if (isCharacterPanelOpen) setIsCharacterPanelOpen(false);
          if (isItemEditorOpen) setIsItemEditorOpen(false);
          break;
        case 'F1':
          e.preventDefault();
          setIsEditorOpen(prev => !prev);
          if (isTerrainEditorOpen) setIsTerrainEditorOpen(false);
          if (isEnemyEditorOpen) setIsEnemyEditorOpen(false);
          break;
        case 'F2':
          e.preventDefault();
          setIsTerrainEditorOpen(prev => !prev);
          if (isEditorOpen) setIsEditorOpen(false);
          if (isEnemyEditorOpen) setIsEnemyEditorOpen(false);
          break;
        case 'F3':
          e.preventDefault();
          setIsEnemyEditorOpen(prev => !prev);
          if (isEditorOpen) setIsEditorOpen(false);
          if (isTerrainEditorOpen) setIsTerrainEditorOpen(false);
          break;
        case 'F4':
          e.preventDefault();
          setIsItemEditorOpen(prev => !prev);
          break;
        case 'F5':
          e.preventDefault();
          setIsMapEditorMode(prev => {
            const newMode = !prev;
            if (newMode && playerRef.current) {
              // Store player position when entering map editor mode
              mapEditorCameraState.current.x = playerRef.current.position.x;
              mapEditorCameraState.current.z = playerRef.current.position.z;
            }
            // Exit flight mode when leaving map editor mode (use ref for current value)
            if (!newMode && isFlightModeRef.current) {
              setIsFlightMode(false);
            }
            return newMode;
          });
          break;
        case 'F6':
          e.preventDefault();
          e.stopPropagation();
          console.log('F6 pressed - isMapEditorMode:', isMapEditorModeRef.current, 'isFlightMode:', isFlightModeRef.current);
          // F6 only works in map editor mode (use ref for current value)
          if (isMapEditorModeRef.current) {
            setIsFlightMode(prev => {
              const newFlightMode = !prev;
              console.log('Toggling flight mode to:', newFlightMode);
              if (newFlightMode) {
                // Entering flight mode - set to player height * 4
                if (playerRef.current) {
                  const terrainHeight = getTerrainHeight(
                    mapEditorCameraState.current.x,
                    mapEditorCameraState.current.z
                  );
                  mapEditorCameraState.current.height = terrainHeight + 8; // ~4x player height (player is ~2 units tall)
                  console.log('Flight mode activated - height set to:', mapEditorCameraState.current.height);
                }
              }
              return newFlightMode;
            });
          } else {
            console.log('F6 pressed but not in map editor mode');
          }
          break;
        case 'Delete':
        case 'Backspace':
          // Delete selected edit object
          if (selectedEditObject && isEditorOpen) {
            e.preventDefault();
            handleDeleteObject(selectedEditObject.id);
          }
          // Delete selected enemy
          if (selectedEditEnemy && isEnemyEditorOpen) {
            e.preventDefault();
            handleDeleteEnemy(selectedEditEnemy.id);
          }
          break;
        case 'KeyC':
          // Ctrl+C to copy selected enemy
          if (e.ctrlKey && selectedEditEnemy && isEnemyEditorOpen) {
            e.preventDefault();
            // Duplicate the enemy with offset
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetZ = (Math.random() - 0.5) * 10;
            handlePlaceEnemy({
              ...selectedEditEnemy,
              name: selectedEditEnemy.name + ' (Copy)',
              position: {
                x: (selectedEditEnemy.position?.x || 0) + offsetX,
                y: 0,
                z: (selectedEditEnemy.position?.z || 0) + offsetZ
              },
              currentHealth: selectedEditEnemy.maxHealth
            });
          }
          break;
        default: break;
      }
    };
    
    const handleKeyUp = (e) => {
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': movementState.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': movementState.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': movementState.current.left = false; break;
        case 'KeyD': case 'ArrowRight': movementState.current.right = false; break;
        default: break;
      }
    };
    
    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('wheel', handleWheel);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    renderer.domElement.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Animation loop
    const clock = new THREE.Clock();
    let lastPlayerPos = new THREE.Vector3(0, 0, 0);
    let skipNextFrame = false;
    
    // Handle visibility change - skip frames when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - reset clock and skip next frame
        clock.getDelta(); // Consume any accumulated delta
        skipNextFrame = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle window focus/blur
    const handleWindowFocus = () => {
      clock.getDelta(); // Consume accumulated delta
      skipNextFrame = true;
    };
    window.addEventListener('focus', handleWindowFocus);
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Skip frame after tab switch to prevent speed spikes
      if (skipNextFrame) {
        skipNextFrame = false;
        clock.getDelta(); // Consume delta
        return;
      }
      
      // Clamp delta to prevent speed spikes - strict limit
      const rawDelta = clock.getDelta();
      
      // If delta is too large (more than 100ms), skip this frame entirely
      if (rawDelta > 0.1) {
        return;
      }
      
      const delta = Math.min(rawDelta, 0.033); // Max 33ms per frame (30 FPS minimum)
      
      const player = playerRef.current;
      const cam = cameraState.current;
      const movement = movementState.current;
      
      if (player) {
        // Check for sudden position change (teleportation detection)
        // If player moved more than 50 units in one frame, it's a bug - REVERT to last known position
        const posDiff = player.position.distanceTo(lastPlayerPos);
        if (posDiff > 50 && (lastPlayerPos.x !== 0 || lastPlayerPos.z !== 0)) {
          // Large position change detected - REVERT player to last known good position
          player.position.x = lastPlayerPos.x;
          player.position.z = lastPlayerPos.z;
          return;
        }
        
        // Update last known position BEFORE any movement
        lastPlayerPos.copy(player.position);
        
        // Calculate movement direction based on camera orientation
        // Fixed speed of 8 units per second
        const moveSpeed = 8 * delta;
        const direction = new THREE.Vector3();
        
        // Both mouse buttons = move forward
        if (cam.isLeftMouseDown && cam.isRightMouseDown) {
          direction.z = -1;
        } else {
          if (movement.forward || movement.autoRun) direction.z -= 1;
          if (movement.backward) direction.z += 1;
        }
        if (movement.left) direction.x -= 1;
        if (movement.right) direction.x += 1;
        
        let rotatedDirection = new THREE.Vector3();
        if (direction.length() > 0) {
          direction.normalize();
          
          // Rotate direction based on camera yaw
          rotatedDirection = direction.clone();
          rotatedDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), cam.rotationY);
          
          // Move player
          player.position.x += rotatedDirection.x * moveSpeed;
          player.position.z += rotatedDirection.z * moveSpeed;
          
          // Rotate player to face movement direction
          const targetRotation = Math.atan2(rotatedDirection.x, rotatedDirection.z);
          player.rotation.y = targetRotation;
        }
        
        // Get terrain height using RAYCASTING to the actual mesh
        // This ensures player walks exactly on the mesh surface
        const terrainMesh = sceneRef.current?.getObjectByName('terrain');
        let terrainHeight = 0;
        
        if (terrainMesh) {
          // Create raycast from above player down to terrain
          const rayOrigin = new THREE.Vector3(player.position.x, 100, player.position.z);
          const rayDirection = new THREE.Vector3(0, -1, 0);
          const terrainRaycaster = new THREE.Raycaster(rayOrigin, rayDirection);
          
          const intersects = terrainRaycaster.intersectObject(terrainMesh);
          if (intersects.length > 0) {
            terrainHeight = intersects[0].point.y;
          } else {
            // Fallback to function if raycast fails
            terrainHeight = getTerrainHeight(player.position.x, player.position.z);
          }
        } else {
          terrainHeight = getTerrainHeight(player.position.x, player.position.z);
        }
        
        const inWater = isInWater(player.position.x, player.position.z);
        const waterDepth = inWater ? getWaterDepth(player.position.x, player.position.z) : 0;
        
        // Target height (terrain minus water if in water)
        const targetY = inWater ? Math.max(terrainHeight, 0.3 - waterDepth * 0.5) : terrainHeight;
        
        // Jump physics - relative to terrain
        if (movement.isJumping) {
          movement.velocityY -= 0.01; // Gravity
          player.position.y += movement.velocityY;
          
          if (player.position.y <= targetY) {
            player.position.y = targetY;
            movement.isJumping = false;
            movement.velocityY = 0;
          }
        } else {
          // Smooth terrain following when not jumping
          const heightDiff = targetY - player.position.y;
          if (Math.abs(heightDiff) > 0.01) {
            // Smooth interpolation for going up/down hills
            player.position.y += heightDiff * Math.min(1, delta * 10);
          } else {
            player.position.y = targetY;
          }
        }
        
        // Slow down in water
        if (inWater && rotatedDirection.length() > 0) {
          player.position.x -= rotatedDirection.x * moveSpeed * 0.3; // 30% slower in water
          player.position.z -= rotatedDirection.z * moveSpeed * 0.3;
        }
        
        // Clamp position to expanded world bounds (600x600 world)
        // Use soft clamping - just prevent going further, don't teleport
        const maxBound = 290;
        if (player.position.x > maxBound) player.position.x = maxBound;
        if (player.position.x < -maxBound) player.position.x = -maxBound;
        if (player.position.z > maxBound) player.position.z = maxBound;
        if (player.position.z < -maxBound) player.position.z = -maxBound;
        
        // Detect current zone based on player position
        const px = player.position.x;
        const pz = player.position.z;
        let detectedZone = 'starter_village';
        
        for (const [zoneName, zoneData] of Object.entries(WORLD_ZONES)) {
          const b = zoneData.bounds;
          if (px >= b.minX && px <= b.maxX && pz >= b.minZ && pz <= b.maxZ) {
            detectedZone = zoneName;
            break;
          }
        }
        
        if (detectedZone !== currentZone) {
          setCurrentZone(detectedZone);
          addNotification(`Entering ${WORLD_ZONES[detectedZone].name}`, 'info');
        }
        
        // Update camera position - different modes (use refs to avoid stale closures)
        if (isMapEditorModeRef.current) {
          // Map Editor Mode - Sky-view camera (Warcraft 3 style)
          const mapCam = mapEditorCameraState.current;
          
          // Handle WASD movement for map editor camera
          // 2x speed in flight mode (use ref)
          const speedMultiplier = isFlightModeRef.current ? 2 : 1;
          const moveSpeed = mapCam.moveSpeed * speedMultiplier * delta;
          if (movementState.current.forward) {
            mapCam.x += Math.sin(mapCam.rotationY) * moveSpeed;
            mapCam.z += Math.cos(mapCam.rotationY) * moveSpeed;
          }
          if (movementState.current.backward) {
            mapCam.x -= Math.sin(mapCam.rotationY) * moveSpeed;
            mapCam.z -= Math.cos(mapCam.rotationY) * moveSpeed;
          }
          if (movementState.current.left) {
            mapCam.x -= Math.cos(mapCam.rotationY) * moveSpeed;
            mapCam.z += Math.sin(mapCam.rotationY) * moveSpeed;
          }
          if (movementState.current.right) {
            mapCam.x += Math.cos(mapCam.rotationY) * moveSpeed;
            mapCam.z -= Math.sin(mapCam.rotationY) * moveSpeed;
          }
          
          // Clamp to world bounds
          mapCam.x = Math.max(-280, Math.min(280, mapCam.x));
          mapCam.z = Math.max(-280, Math.min(280, mapCam.z));
          
          // Flight Mode: Auto-adjust height to follow terrain + 8 units (4x player height)
          if (isFlightModeRef.current) {
            const terrainHeight = getTerrainHeight(mapCam.x, mapCam.z);
            const targetHeight = terrainHeight + 8;
            // Smooth height transition
            mapCam.height += (targetHeight - mapCam.height) * 5 * delta;
          }
          
          // Position camera above the map
          const camX = mapCam.x + Math.sin(mapCam.rotationY) * Math.cos(mapCam.tilt) * 10;
          const camY = mapCam.height;
          const camZ = mapCam.z + Math.cos(mapCam.rotationY) * Math.cos(mapCam.tilt) * 10;
          
          camera.position.set(camX, camY, camZ);
          camera.lookAt(mapCam.x, 0, mapCam.z);
          
          // Hide player in map editor mode
          player.visible = false;
        } else {
          // Normal Game Mode - WoW-style orbit camera
          const camX = player.position.x + Math.sin(cam.rotationY) * Math.cos(cam.rotationX) * cam.distance;
          const camY = player.position.y + 2 + Math.sin(cam.rotationX) * cam.distance;
          const camZ = player.position.z + Math.cos(cam.rotationY) * Math.cos(cam.rotationX) * cam.distance;
          
          camera.position.set(camX, Math.max(1, camY), camZ);
          camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
          
          // Show player in game mode
          player.visible = true;
        }
        
        // Update target indicator position if target selected
        const currentTarget = selectedTargetRef.current;
        if (currentTarget && targetIndicatorRef.current.visible) {
          targetIndicatorRef.current.position.x = currentTarget.position.x;
          targetIndicatorRef.current.position.z = currentTarget.position.z;
          // Rotate indicator
          targetIndicatorRef.current.rotation.z += delta * 2;
        }
        
        // Animate damage texts (float up and fade out)
        const now = Date.now();
        damageTextsRef.current = damageTextsRef.current.filter(sprite => {
          const age = now - sprite.userData.createdAt;
          if (age > 1500) {
            scene.remove(sprite);
            sprite.material.dispose();
            sprite.material.map?.dispose();
            return false;
          }
          sprite.position.y += sprite.userData.velocity;
          sprite.material.opacity = 1 - (age / 1500);
          return true;
        });
        
        // Make health bars face camera
        Object.values(monsterHealthBarsRef.current).forEach(({ group }) => {
          if (group) {
            const healthBarBg = group.getObjectByName('healthBarBg');
            const healthBarFill = group.getObjectByName('healthBarFill');
            if (healthBarBg && camera) {
              healthBarBg.lookAt(camera.position);
              healthBarFill.lookAt(camera.position);
            }
          }
        });
        
        // ==================== ENEMY PATROL SYSTEM ====================
        const patrolSpeed = 2 * delta; // Movement speed for patrolling
        const patrolNow = Date.now();
        
        enemyMeshesRef.current.forEach(enemyMesh => {
          if (!enemyMesh || !enemyMesh.userData) return;
          
          // SKIP CORPSES - dead enemies don't patrol
          if (enemyMesh.userData.isCorpse) return;
          
          const enemyId = enemyMesh.userData.enemyId;
          const isInCombat = combatEngagedEnemiesRef.current.has(enemyId);
          const patrolRadius = enemyMesh.userData.patrolRadius || 0;
          const spawnX = enemyMesh.userData.spawnX;
          const spawnZ = enemyMesh.userData.spawnZ;
          
          // Initialize patrol data if not exists
          if (!enemyPatrolDataRef.current[enemyId]) {
            enemyPatrolDataRef.current[enemyId] = {
              patrolState: 0, // 0-3 for square corners
              lastStateChange: patrolNow,
              patrolWaitTime: 2000 + Math.random() * 2000 // Wait 2-4 seconds at each corner
            };
          }
          
          const patrolData = enemyPatrolDataRef.current[enemyId];
          
          // If in combat - face player and stop patrol
          if (isInCombat && player) {
            const dx = player.position.x - enemyMesh.position.x;
            const dz = player.position.z - enemyMesh.position.z;
            const angle = Math.atan2(dx, dz);
            enemyMesh.rotation.y = angle;
            
            // Make health bar face camera
            const healthBarBg = enemyMesh.getObjectByName('healthBarBg');
            const healthBarFill = enemyMesh.getObjectByName('healthBarFill');
            if (healthBarBg && camera) {
              healthBarBg.lookAt(camera.position);
              healthBarFill.lookAt(camera.position);
            }
            return;
          }
          
          // If no patrol radius, stay stationary
          if (patrolRadius <= 0) {
            // Make health bar face camera even when stationary
            const healthBarBg = enemyMesh.getObjectByName('healthBarBg');
            const healthBarFill = enemyMesh.getObjectByName('healthBarFill');
            if (healthBarBg && camera) {
              healthBarBg.lookAt(camera.position);
              healthBarFill.lookAt(camera.position);
            }
            return;
          }
          
          // Patrol in a square pattern
          // Calculate target position based on patrol state
          const patrolOffsets = [
            { x: patrolRadius, z: 0 },      // East
            { x: patrolRadius, z: patrolRadius },  // Southeast
            { x: 0, z: patrolRadius },      // South
            { x: -patrolRadius, z: patrolRadius }, // Southwest
            { x: -patrolRadius, z: 0 },     // West
            { x: -patrolRadius, z: -patrolRadius }, // Northwest
            { x: 0, z: -patrolRadius },     // North
            { x: patrolRadius, z: -patrolRadius }, // Northeast
          ];
          
          const currentPatrolState = patrolData.patrolState % patrolOffsets.length;
          const targetX = spawnX + patrolOffsets[currentPatrolState].x;
          const targetZ = spawnZ + patrolOffsets[currentPatrolState].z;
          
          // Calculate distance to target
          const dx = targetX - enemyMesh.position.x;
          const dz = targetZ - enemyMesh.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance > 0.3) {
            // Move towards target
            const moveX = (dx / distance) * patrolSpeed;
            const moveZ = (dz / distance) * patrolSpeed;
            
            enemyMesh.position.x += moveX;
            enemyMesh.position.z += moveZ;
            
            // Update Y position based on terrain
            const terrainY = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
            enemyMesh.position.y = terrainY;
            
            // Face movement direction
            const angle = Math.atan2(dx, dz);
            enemyMesh.rotation.y = angle;
          } else {
            // Reached target, wait then move to next patrol point
            if (patrolNow - patrolData.lastStateChange > patrolData.patrolWaitTime) {
              patrolData.patrolState = (patrolData.patrolState + 1) % patrolOffsets.length;
              patrolData.lastStateChange = patrolNow;
              patrolData.patrolWaitTime = 2000 + Math.random() * 2000;
            }
          }
          
          // Make health bar face camera
          const healthBarBg = enemyMesh.getObjectByName('healthBarBg');
          const healthBarFill = enemyMesh.getObjectByName('healthBarFill');
          if (healthBarBg && camera) {
            healthBarBg.lookAt(camera.position);
            healthBarFill.lookAt(camera.position);
          }
        });
        
        // Update target indicator position to follow selected target
        if (selectedTargetRef.current && targetIndicatorRef.current && targetIndicatorRef.current.visible) {
          targetIndicatorRef.current.position.x = selectedTargetRef.current.position.x;
          targetIndicatorRef.current.position.z = selectedTargetRef.current.position.z;
          targetIndicatorRef.current.position.y = 0.1; // Slightly above ground
        }
        
        // ==================== WOW-STYLE COMBAT AI ====================
        // Handle auto-attack (use ref to avoid stale closure)
        if (isAutoAttackingRef.current && selectedTargetRef.current && playerRef.current) {
          performAutoAttack();
        }
        
        // Update GCD
        if (globalCooldownRef.current > 0) {
          globalCooldownRef.current = Math.max(0, globalCooldownRef.current - delta);
        }
        
        // NPC Combat AI - Process each enemy
        const combatNow = Date.now() / 1000;
        enemyMeshesRef.current.forEach(enemyMesh => {
          if (!enemyMesh || !enemyMesh.userData) return;
          if (!playerRef.current) return;
          
          // SKIP CORPSES - dead enemies don't fight
          if (enemyMesh.userData.isCorpse) return;
          
          const enemyId = enemyMesh.userData.enemyId;
          
          // Use 2D distance (X/Z only) to ignore terrain height differences
          const dx = enemyMesh.position.x - playerRef.current.position.x;
          const dz = enemyMesh.position.z - playerRef.current.position.z;
          const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
          
          // Get or initialize combat state
          let combatState = npcCombatStateRef.current.get(enemyId);
          if (!combatState) {
            combatState = {
              inCombat: false,
              aggroTarget: null,
              lastAttack: 0,
              spawnPos: {
                x: enemyMesh.userData.spawnX || enemyMesh.position.x,
                z: enemyMesh.userData.spawnZ || enemyMesh.position.z
              }
            };
            npcCombatStateRef.current.set(enemyId, combatState);
          }
          
          // PROXIMITY AGGRO: If enemy is hostile and player is within aggro range, engage!
          if (!combatState.inCombat && enemyMesh.userData.hostile && distanceToPlayer <= aggroRange) {
            combatState.inCombat = true;
            combatState.aggroTarget = playerRef.current;
            combatState.lastAttack = combatNow - 2; // Allow attack after 0.5s
            combatState.notifiedAggro = true; // Track that we showed notification
            combatEngagedEnemiesRef.current.add(enemyId);
            
            // Notification ONCE when enemy first aggros
            if (addNotificationRef.current) {
              addNotificationRef.current(`${enemyMesh.userData.name} attacks you!`, 'warning');
            }
            if (enterCombatRef.current) {
              enterCombatRef.current();
            }
          }
          
          // Skip further processing if not in combat
          if (!combatState.inCombat || !combatState.aggroTarget) return;
          
          // Check leash range (2D distance to spawn)
          const distanceToSpawn = Math.sqrt(
            Math.pow(enemyMesh.position.x - combatState.spawnPos.x, 2) +
            Math.pow(enemyMesh.position.z - combatState.spawnPos.z, 2)
          );
          
          if (distanceToPlayer > leashRange || distanceToSpawn > leashRange) {
            // Player left leash range - reset enemy (only notify once)
            if (combatState.inCombat && !combatState.notifiedReset) {
              combatState.notifiedReset = true;
              // Only notify if this was player's target
              if (selectedTargetRef.current === enemyMesh && addNotificationRef.current) {
                addNotificationRef.current(`${enemyMesh.userData.name} has reset!`, 'info');
              }
            }
            
            combatState.inCombat = false;
            combatState.aggroTarget = null;
            combatEngagedEnemiesRef.current.delete(enemyId);
            
            // Restore full health
            enemyMesh.userData.currentHealth = enemyMesh.userData.maxHealth;
            const healthBarFill = enemyMesh.getObjectByName('healthBarFill');
            if (healthBarFill) {
              healthBarFill.scale.x = 1;
              healthBarFill.position.x = 0;
            }
            
            // Move back to spawn
            const dxSpawn = combatState.spawnPos.x - enemyMesh.position.x;
            const dzSpawn = combatState.spawnPos.z - enemyMesh.position.z;
            const returnDist = Math.sqrt(dxSpawn * dxSpawn + dzSpawn * dzSpawn);
            
            if (returnDist > 0.5) {
              const returnSpeed = 6 * delta; // Fast return speed
              enemyMesh.position.x += (dxSpawn / returnDist) * returnSpeed;
              enemyMesh.position.z += (dzSpawn / returnDist) * returnSpeed;
              enemyMesh.position.y = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
              
              const angle = Math.atan2(dxSpawn, dzSpawn);
              enemyMesh.rotation.y = angle;
            } else {
              // Reached spawn, snap to exact position and reset notification flag
              enemyMesh.position.x = combatState.spawnPos.x;
              enemyMesh.position.z = combatState.spawnPos.z;
              enemyMesh.position.y = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
              combatState.notifiedReset = false; // Reset so it can notify again next time
              combatState.notifiedAggro = false; // Reset aggro notification
            }
            
            return;
          }
          
          // Chase player if outside melee range
          if (distanceToPlayer > meleeRange) {
            const dx = playerRef.current.position.x - enemyMesh.position.x;
            const dz = playerRef.current.position.z - enemyMesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist > 0.1) {
              const chaseSpeed = 4 * delta; // NPC chase speed
              enemyMesh.position.x += (dx / dist) * chaseSpeed;
              enemyMesh.position.z += (dz / dist) * chaseSpeed;
              enemyMesh.position.y = getTerrainHeight(enemyMesh.position.x, enemyMesh.position.z);
              
              const angle = Math.atan2(dx, dz);
              enemyMesh.rotation.y = angle;
            }
          } else {
            // In melee range - attack player
            const npcAttackSpeed = 2.5; // NPC attack every 2.5 seconds
            
            if (combatNow - combatState.lastAttack >= npcAttackSpeed) {
              combatState.lastAttack = combatNow;
              
              // NPC attacks player
              const damage = Math.floor(Math.random() * (enemyMesh.userData.damage || 10)) + 5;
              setCurrentHealth(prev => Math.max(0, prev - damage));
              
              // Show damage text on player
              if (playerRef.current && sceneRef.current) {
                const dmgSprite = createDamageText(sceneRef.current, playerRef.current.position.clone(), damage, true);
                damageTextsRef.current.push(dmgSprite);
              }
              
              // Combat log
              setCombatLog(prev => [...prev.slice(-9), {
                time: Date.now(),
                text: `${enemyMesh.userData.name} hits you for ${damage} damage!`
              }]);
              
              // Keep player in combat
              enterCombat();
            }
            
            // Face player
            const dx = playerRef.current.position.x - enemyMesh.position.x;
            const dz = playerRef.current.position.z - enemyMesh.position.z;
            const angle = Math.atan2(dx, dz);
            enemyMesh.rotation.y = angle;
          }
        });
        // ==================== END COMBAT AI ====================
        
      }
      
      // Animate loot sparkles on corpses
      lootableCorpsesRef.current.forEach((corpseData) => {
        if (corpseData.mesh && corpseData.mesh.userData.sparkles) {
          const sparkles = corpseData.mesh.userData.sparkles;
          sparkles.userData.time += delta;
          const time = sparkles.userData.time;
          
          // Rotate the entire sparkle group
          sparkles.rotation.y += delta * 2;
          
          // Animate individual particles
          sparkles.userData.particles.forEach((particle, i) => {
            const angle = particle.userData.angle + time * 2;
            const radius = 0.4 + Math.sin(time * 3 + i) * 0.1;
            particle.position.x = Math.cos(angle) * radius;
            particle.position.z = Math.sin(angle) * radius;
            particle.position.y = Math.sin(time * 2 + particle.userData.yOffset) * 0.3;
            
            // Pulse opacity
            particle.material.opacity = 0.6 + Math.sin(time * 4 + i) * 0.3;
          });
          
          // Pulse central glow
          if (sparkles.userData.glow) {
            const scale = 1 + Math.sin(time * 3) * 0.3;
            sparkles.userData.glow.scale.set(scale, scale, scale);
            sparkles.userData.glow.material.opacity = 0.4 + Math.sin(time * 3) * 0.2;
          }
        }
      });
      
      renderer.render(scene, camera);
    };
    animate();
    
    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      renderer.domElement.removeEventListener('contextmenu', preventContextMenu);
      renderer.domElement.removeEventListener('dblclick', handleDoubleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [ready, character]); // REMOVED selectedTarget - it was causing scene recreation on every click!

  if (!player && !ready) {
    return <LoadingSpinner />;
  }

  // Get target display color based on type
  const getTargetColor = () => {
    if (!selectedTarget) return '#fbbf24';
    if (selectedTarget.userData.hostile) return '#dc2626';
    if (selectedTarget.userData.type === 'trainer') return '#f59e0b';
    if (selectedTarget.userData.type === 'questgiver') return '#fbbf24';
    if (selectedTarget.userData.type === 'vendor') return '#22c55e';
    if (selectedTarget.userData.type === 'guard') return '#3b82f6';
    if (selectedTarget.userData.type === 'npc') return '#3b82f6';
    if (selectedTarget.userData.type === 'portal') return '#8b5cf6';
    return '#a8a29e';
  };
  
  // Get target type label
  const getTargetTypeLabel = () => {
    if (!selectedTarget) return '';
    if (selectedTarget.userData.hostile) return 'Enemy';
    if (selectedTarget.userData.type === 'trainer') return `${selectedTarget.userData.trainerClass?.charAt(0).toUpperCase() + selectedTarget.userData.trainerClass?.slice(1) || ''} Trainer`;
    if (selectedTarget.userData.type === 'questgiver') return 'Quest Giver';
    if (selectedTarget.userData.type === 'vendor') return 'Vendor';
    if (selectedTarget.userData.type === 'guard') return 'Guard';
    if (selectedTarget.userData.type === 'npc') return 'NPC';
    if (selectedTarget.userData.type === 'portal') return 'Portal';
    return selectedTarget.userData.type || 'Object';
  };

  // Save terrain to database
  const handleSaveTerrain = async () => {
    if (!terrainGeometryRef.current) {
      addNotification('No terrain to save!', 'error');
      return;
    }
    
    setIsTerrainSaving(true);
    try {
      const geometry = terrainGeometryRef.current;
      const positionAttr = geometry.getAttribute('position');
      const colorAttr = geometry.getAttribute('color');
      
      // Extract heightmap and colors
      const heightmap = [];
      const colors = [];
      
      for (let i = 0; i < positionAttr.count; i++) {
        heightmap.push(positionAttr.getZ(i));
        colors.push(colorAttr.getX(i), colorAttr.getY(i), colorAttr.getZ(i));
      }
      
      await saveTerrain({
        terrain_id: 'main_terrain',
        world_size: 600,
        segments: 200,
        seed: 42,
        heightmap,
        colors,
        version: 1
      });
      
      addNotification('Terrain saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to save terrain:', err);
      addNotification('Failed to save terrain!', 'error');
    }
    setIsTerrainSaving(false);
  };
  
  // Comprehensive world save function
  const handleSaveWorld = async () => {
    setIsSavingWorld(true);
    try {
      console.log('Starting world save...');
      
      // Prepare terrain data
      let terrainData = null;
      if (terrainGeometryRef.current) {
        const geometry = terrainGeometryRef.current;
        const positionAttr = geometry.getAttribute('position');
        const colorAttr = geometry.getAttribute('color');
        
        const heightmap = [];
        const colors = [];
        
        for (let i = 0; i < positionAttr.count; i++) {
          heightmap.push(positionAttr.getZ(i));
          colors.push(colorAttr.getX(i), colorAttr.getY(i), colorAttr.getZ(i));
        }
        
        terrainData = {
          terrain_id: 'main_terrain',
          world_size: 600,
          segments: 200,
          seed: 42,
          heightmap,
          colors,
          version: 1
        };
        
        console.log('Terrain data prepared:', {
          heightmap_length: heightmap.length,
          colors_length: colors.length,
          has_colors: colors.length > 0
        });
      }
      
      // Prepare placed objects (buildings, NPCs, decorations)
      // Use placedObjectsRef.current to get the latest state (fixes closure issue with Ctrl+S)
      const currentPlacedObjects = placedObjectsRef.current;
      console.log('[SAVE] Using placedObjectsRef.current, count:', currentPlacedObjects.length);
      
      const worldObjects = currentPlacedObjects.map(obj => {
        // Ensure position is properly formatted
        const position = obj.position || { x: obj.x || 0, y: obj.y || 0, z: obj.z || 0 };
        
        console.log('[SAVE] Processing object:', obj.name, 'Original obj:', obj, 'Extracted position:', position);
        
        return {
          id: obj.id,
          type: obj.type,
          fullType: obj.fullType || obj.subType || obj.type,
          position: position,
          name: obj.name,
          scale: obj.scale || 1,
          color: obj.color,
          category: obj.category,
          zone: obj.zone || currentZone
        };
      });
      
      console.log('Saving world objects:', worldObjects.length, 'Full data:', JSON.stringify(worldObjects, null, 2));
      
      // Prepare placed enemies
      const placedEnemiesData = placedEnemies.map(enemy => ({
        id: enemy.id,
        type: enemy.type,
        position: enemy.position,
        name: enemy.name,
        level: enemy.level,
        health: enemy.health,
        max_health: enemy.maxHealth
      }));
      
      // Prepare path nodes
      const pathData = {
        nodes: pathNodes,
        width: pathWidth
      };
      
      // Get player data
      const player = playerRef.current;
      const playerData = {
        position: player ? { x: player.position.x, y: player.position.y, z: player.position.z } : { x: 0, y: 0, z: 0 },
        copper,
        backpack: backpack,
        equipment,
        bags,
        skills,
        learned_spells: learnedSpells,
        action_bar: actionBarSpells,
        combat_level: character?.level || 1,
        experience: character?.experience || 0
      };
      
      // Save everything
      console.log('Sending save request with terrain data...');
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/player/save-all`, {
        ...playerData,
        terrain: terrainData,
        world_objects: worldObjects,
        placed_enemies: placedEnemiesData,
        paths: pathData,
        zone: currentZone || 'starter_village'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('World saved successfully!');
      addNotification('World saved successfully! Changes visible to all players.', 'success');
    } catch (err) {
      console.error('Failed to save world:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Full error:', err);
      
      // Handle token expiration
      if (err.response?.status === 401 || err.response?.data?.detail === 'Invalid token') {
        addNotification('Session expired. Please login again.', 'error');
        setTimeout(() => {
          logout();
        }, 2000);
        return;
      }
      
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      addNotification(`Failed to save world: ${errorMsg}`, 'error');
    }
    setIsSavingWorld(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative select-none" data-testid="game-world">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Target info panel - shows for ALL selected targets */}
      {selectedTarget && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 mt-12 z-20 pointer-events-none">
          <div className="bg-[#0c0a09]/90 border-2 px-4 py-3 rounded min-w-64" style={{ borderColor: getTargetColor() }}>
            {/* Target Name */}
            <p className="font-cinzel text-center text-lg" style={{ color: getTargetColor() }}>
              {selectedTarget.name || 'Unknown'}
            </p>
            {/* Type Label */}
            <p className="text-xs text-center text-[#a8a29e]">{getTargetTypeLabel()}</p>
            
            {/* Level - for enemies and NPCs */}
            {selectedTarget.userData.level && (
              <p className="text-xs text-center text-[#a8a29e]">Level {selectedTarget.userData.level}</p>
            )}
            
            {/* Monster HP Bar - only for hostile targets */}
            {selectedTarget.userData.hostile && selectedTarget.userData.maxHealth && (
              <div className="mt-2">
                <div className="h-4 bg-[#1a1a1a] rounded overflow-hidden border border-[#44403c]">
                  <div 
                    className="h-full bg-gradient-to-r from-[#dc2626] to-[#ef4444] transition-all duration-200"
                    style={{ 
                      width: `${((selectedTarget.userData.currentHealth ?? selectedTarget.userData.maxHealth) / selectedTarget.userData.maxHealth) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-center text-[#a8a29e] mt-1">
                  {selectedTarget.userData.currentHealth ?? selectedTarget.userData.maxHealth}
                  {' / '}
                  {selectedTarget.userData.maxHealth} HP
                </p>
              </div>
            )}
            
            {/* Action hint based on type */}
            {selectedTarget.userData.hostile && (
              <p className="text-xs text-center text-[#fbbf24] mt-2">Press 1-6 to attack</p>
            )}
            {selectedTarget.userData.type === 'questgiver' && (
              <p className="text-xs text-center text-[#fbbf24] mt-2">Double-click to talk</p>
            )}
            {selectedTarget.userData.type === 'vendor' && (
              <p className="text-xs text-center text-[#22c55e] mt-2">Double-click to trade</p>
            )}
            {selectedTarget.userData.type === 'portal' && (
              <p className="text-xs text-center text-[#8b5cf6] mt-2">Double-click to travel</p>
            )}
            {selectedTarget.userData.type === 'trainer' && (
              <p className="text-xs text-center text-[#f59e0b] mt-2">Double-click to train abilities</p>
            )}
            {(selectedTarget.userData.type === 'npc' || selectedTarget.userData.type === 'guard') && (
              <p className="text-xs text-center text-[#3b82f6] mt-2">Double-click to interact</p>
            )}
          </div>
        </div>
      )}

      {/* Trainer Panel */}
      <TrainerPanel
        isOpen={isTrainerOpen}
        onClose={() => setIsTrainerOpen(false)}
        playerClass={character?.class || 'warrior'}
        playerLevel={character?.combatLevel || 1}
        playerGold={playerCopper}
        learnedSpells={learnedSpells}
        onTrainSpell={handleTrainSpell}
        trainerName={selectedTarget?.name || 'Warrior Trainer'}
      />

      {/* Quest Dialog */}
      <QuestDialog
        isOpen={isQuestDialogOpen}
        onClose={() => setIsQuestDialogOpen(false)}
        npcName={questGiverName}
        playerQuests={activeQuests}
        onAcceptQuest={handleAcceptQuest}
      />
      
      {/* Quest Log */}
      <QuestLog
        isOpen={isQuestLogOpen}
        onClose={() => setIsQuestLogOpen(false)}
        activeQuests={activeQuests}
        completedQuests={completedQuests}
        onAbandonQuest={handleAbandonQuest}
        onTrackQuest={handleTrackQuest}
        trackedQuestId={trackedQuestId}
      />
      
      {/* Loot Panel */}
      <LootPanel
        isOpen={isLootPanelOpen}
        onClose={() => {
          setIsLootPanelOpen(false);
          setCurrentLootData(null);
          setCurrentLootCorpse(null);
        }}
        lootData={currentLootData}
        enemyName={lootableCorpsesRef.current.get(currentLootCorpse)?.mesh?.userData?.name || 'Corpse'}
        onLootItem={handleLootItem}
        onLootAll={handleLootAll}
      />

      {/* Spell Book */}
      <SpellBook
        isOpen={isSpellBookOpen}
        onClose={() => setIsSpellBookOpen(false)}
        playerClass={character?.class || 'warrior'}
        playerLevel={character?.combatLevel || 1}
        onLearnSpell={handleLearnSpell}
        learnedSpells={learnedSpells}
        actionBarSpells={actionBarSpells}
        onAssignToActionBar={handleAssignToActionBar}
      />
      
      {/* Action Bar */}
      <ActionBar
        actionBarSpells={actionBarSpells}
        cooldowns={spellCooldowns}
        currentMana={currentMana}
        maxMana={maxMana}
        onCastSpell={handleCastSpell}
        selectedTarget={selectedTarget}
        onDropSpell={handleDropSpell}
        isAutoAttacking={isAutoAttacking}
      />

      {/* HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <HUD 
          currentHealth={currentHealth}
          maxHealth={maxHealth}
          currentMana={currentMana}
          maxMana={maxMana}
          isInCombat={isInCombat}
          onOpenSpellBook={() => setIsSpellBookOpen(true)}
          onOpenCharacter={() => setIsCharacterPanelOpen(true)}
          onLogout={handleLogout}
        />
        
        {/* Minimap - Top Right */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Minimap />
        </div>

        {/* Bag Bar - Bottom Right (WoW-style) */}
        <BagBar 
          bags={bags}
          backpackItems={backpack}
          openBagIndex={openBagIndex}
          setOpenBagIndex={setOpenBagIndex}
        />

        {/* Panels */}
        {activePanel === 'inventory' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <InventoryPanel />
          </div>
        )}
        
        {activePanel === 'skills' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <SkillsPanel />
          </div>
        )}
        
        {activePanel === 'quests' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <QuestPanel />
          </div>
        )}
        
        {/* Character Panel */}
        <CharacterPanel
          isOpen={isCharacterPanelOpen}
          onClose={() => setIsCharacterPanelOpen(false)}
        />
      </div>

      {/* Zone Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="bg-[#0c0a09]/80 border border-[#44403c] px-6 py-3 rounded">
          <p className="font-cinzel text-[#fbbf24] text-lg tracking-wider text-center">
            {WORLD_ZONES[currentZone]?.name || 'Unknown Zone'}
          </p>
        </div>
      </div>
      
      {/* Save World Button (floating) - Show when any editor is open */}
      {(isEditorOpen || isTerrainEditorOpen || isEnemyEditorOpen) && (
        <div className="absolute bottom-24 right-4 z-30 pointer-events-auto">
          <button
            onClick={handleSaveWorld}
            disabled={isSavingWorld}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-cinzel font-bold text-lg shadow-2xl transition-all ${
              isSavingWorld 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] hover:from-[#7c3aed] hover:to-[#4f46e5] hover:scale-105 hover:shadow-purple-500/50'
            }`}
            data-testid="save-world-button"
          >
            <Save className="w-5 h-5" />
            {isSavingWorld ? 'Saving World...' : 'Save World (Ctrl+S)'}
          </button>
          <p className="text-xs text-center text-[#a78bfa] mt-2">
            Saves terrain, objects, NPCs & enemies for all players
          </p>
        </div>
      )}
      
      {/* World Editor (Dev Mode) */}
      <WorldEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onPlaceObject={handlePlaceObject}
        onDeleteObject={handleDeleteObject}
        onSaveWorld={() => {}}
        onLoadWorld={handleLoadWorld}
        placedObjects={placedObjects}
        selectedEditObject={selectedEditObject}
        onSelectEditObject={setSelectedEditObject}
        currentZone={currentZone}
      />
      
      {/* Terrain Editor */}
      <TerrainEditor
        isOpen={isTerrainEditorOpen}
        onClose={() => setIsTerrainEditorOpen(false)}
        activeTool={terrainTool}
        setActiveTool={updateTerrainTool}
        brushSize={brushSize}
        setBrushSize={updateBrushSize}
        brushStrength={brushStrength}
        setBrushStrength={updateBrushStrength}
        onSaveTerrain={handleSaveTerrain}
        isSaving={isTerrainSaving}
        pathNodes={pathNodes}
        onClearPath={clearPath}
        onUndoPathNode={undoPathNode}
      />
      
      {/* Editor Mode Indicator */}
      {isEditorOpen && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-[#8b5cf6]/90 px-3 py-1 rounded text-white text-sm font-bold animate-pulse">
            EDITOR MODE (F1 to close)
          </div>
        </div>
      )}
      
      {/* Terrain Editor Mode Indicator */}
      {isTerrainEditorOpen && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-[#fbbf24]/90 px-3 py-1 rounded text-[#1a1614] text-sm font-bold animate-pulse">
            TERRAIN EDITOR (F2 to close)
          </div>
        </div>
      )}
      
      {/* Enemy Editor */}
      <EnemyEditor
        isOpen={isEnemyEditorOpen}
        onClose={() => setIsEnemyEditorOpen(false)}
        onPlaceEnemy={handlePlaceEnemy}
        onDeleteEnemy={handleDeleteEnemy}
        placedEnemies={placedEnemies}
        selectedEnemy={selectedEditEnemy}
        onSelectEnemy={setSelectedEditEnemy}
        currentZone={currentZone}
      />
      
      {/* Item Database Editor (F4) */}
      <ItemDatabaseEditor
        isOpen={isItemEditorOpen}
        onClose={() => setIsItemEditorOpen(false)}
      />
      
      {/* Enemy Editor Mode Indicator */}
      {isEnemyEditorOpen && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-[#dc2626]/90 px-3 py-1 rounded text-white text-sm font-bold animate-pulse">
            ENEMY EDITOR (F3 to close)
          </div>
        </div>
      )}
      
      {/* Pending Placement Indicator */}
      {pendingPlacement && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-[#22c55e]/90 px-4 py-2 rounded text-white text-sm">
            Click in the world to place: <span className="font-bold">{pendingPlacement.name || pendingPlacement.type}</span>
            <button 
              onClick={() => setPendingPlacement(null)}
              className="ml-3 text-xs bg-[#dc2626] px-2 py-0.5 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Pending Enemy Placement Indicator */}
      {pendingEnemyPlacement && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-[#dc2626]/90 px-4 py-2 rounded text-white text-sm">
            Click terrain to spawn: <span className="font-bold">{pendingEnemyPlacement.name} Lv.{pendingEnemyPlacement.level}</span>
            <button 
              onClick={() => setPendingEnemyPlacement(null)}
              className="ml-3 text-xs bg-[#7f1d1d] px-2 py-0.5 rounded hover:bg-[#991b1b]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Combat Log */}
      {combatLog.length > 0 && (
        <div className="absolute top-32 right-4 z-20 pointer-events-none" data-testid="combat-log">
          <div className="bg-[#0c0a09]/80 border border-[#44403c] px-3 py-2 rounded w-64">
            <p className="text-[#dc2626] font-semibold text-xs font-rajdhani mb-1">Combat Log</p>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {combatLog.slice(-5).map((log, i) => (
                <p key={log.time + i} className="text-[10px] text-[#a8a29e] font-rajdhani">
                  {log.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Map Editor Mode Indicator */}
      {isMapEditorMode && (
        <div className="absolute top-4 left-4 z-30">
          <div className={`${isFlightMode ? 'bg-[#22c55e]/90 border-[#4ade80]' : 'bg-[#3b82f6]/90 border-[#60a5fa]'} border-2 px-4 py-3 rounded-lg shadow-lg animate-pulse`}>
            <p className="text-white font-bold text-sm font-rajdhani mb-2">
              {isFlightMode ? '✈️ FLIGHT MODE (2x Speed)' : '🗺️ MAP EDITOR MODE'} - Press F5 to exit
            </p>
            <div className="text-xs text-[#e0f2fe] font-rajdhani space-y-0.5">
              <p><span className="font-semibold text-[#fbbf24]">F6</span> - Toggle Flight Mode {isFlightMode ? '(ON - Auto-terrain follow)' : '(OFF)'}</p>
              <p><span className="font-semibold text-[#fbbf24]">WASD</span> - Pan Camera {isFlightMode ? '(2x Speed)' : ''}</p>
              <p><span className="font-semibold text-[#fbbf24]">Ctrl+RMB Drag</span> - Pan (Alternative)</p>
              <p><span className="font-semibold text-[#fbbf24]">Mouse Wheel</span> - Adjust Height {isFlightMode ? '(Disabled)' : ''}</p>
              <p><span className="font-semibold text-[#fbbf24]">Q/E</span> - Rotate Left/Right</p>
              <p><span className="font-semibold text-[#fbbf24]">R/F</span> - Tilt (Top-Down/Angled)</p>
              <p className="mt-1 text-[#bae6fd]">F1-F4: Use editors in map editor mode</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Controls hint */}
      <div className="absolute bottom-24 left-4 z-20 pointer-events-none">
        <div className="bg-[#0c0a09]/80 border border-[#44403c] px-3 py-2 rounded text-xs text-[#a8a29e] font-rajdhani space-y-0.5">
          <p className="text-[#fbbf24] font-semibold">Controls:</p>
          <p>WASD - Move</p>
          <p><span className="text-[#22c55e]">Click</span> - Select Target</p>
          <p>Right-click + Drag - Rotate Camera</p>
          <p>Scroll - Zoom</p>
          <p>Tab - Target Nearest</p>
          <p><span className="text-[#fbbf24]">1-6</span> - Cast Spells</p>
          <p><span className="text-[#8b5cf6]">P</span> - Spell Book</p>
          <p>Space - Jump | R - Auto-run</p>
          <p><span className="text-[#8b5cf6]">F1</span> - World Editor</p>
          <p><span className="text-[#fbbf24]">F2</span> - Terrain Editor</p>
          <p><span className="text-[#dc2626]">F3</span> - Enemy Editor</p>
          <p><span className="text-[#3b82f6]">F5</span> - Map Editor Mode</p>
        </div>
      </div>
    </div>
  );
};

export default GameWorld;
