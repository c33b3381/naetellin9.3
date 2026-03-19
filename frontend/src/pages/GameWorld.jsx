import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Save } from 'lucide-react';
import axios from 'axios';

// Systems
import { 
  updatePlayerMovement, 
  handleMovementKeyDown, 
  handleMovementKeyUp,
  createMovementState 
} from '../systems/PlayerMovementSystem';
import {
  createCameraState,
  handleCameraMouseDown,
  handleCameraMouseUp,
  handleCameraMouseMove,
  handleCameraWheel,
  updateCamera
} from '../systems/CameraSystem';
import {
  AI_CONSTANTS,
  createPatrolData,
  createCombatState,
  updatePatrol,
  updateCombatFacing,
  shouldAggro,
  shouldLeash,
  moveToSpawn,
  chasePlayer,
  maintainSpreadPosition,
  resetEnemyHealth,
  activateAggro
} from '../systems/EnemyAISystem';
import {
  COMBAT_CONSTANTS,
  MAX_LEVEL,
  XP_THRESHOLDS,
  createDamageText,
  updateEnemyHealthBar,
  getMobDifficultyColor,
  calculateXPGain,
  calculateAutoAttackDamage,
  calculateNpcAttackDamage
} from '../systems/CombatSystem';
import { 
  createWorldAsset, 
  createEnemyMesh as createEnemyMeshFactory, 
  createPlayerMesh,
  createNPCMesh,
  createTrainerMesh,
  createVendorMesh,
  createQuestGiverMesh
} from '../systems/WorldAssetFactory';
import { createGameScene, createGameCamera, createGameRenderer, setupWorldLighting } from '../systems/WorldSetup';
import {
  CORPSE_REVIVE_RADIUS,
  GRAVEYARD_POSITION,
  handlePlayerDeath as deathSystemHandlePlayerDeath,
  handleReleaseCorpse as deathSystemHandleReleaseCorpse,
  handlePlayerRevive as deathSystemHandlePlayerRevive,
  isNearCorpse
} from '../systems/DeathResurrectionSystem';
import { updateQuestListForEnemyKill } from '../systems/QuestProgressSystem';
import {
  startSpellCooldown,
  updateSpellCooldowns,
  startGlobalCooldown,
  isSpellOnCooldown,
  COOLDOWN_TICK_INTERVAL,
  COOLDOWN_TICK_AMOUNT
} from '../systems/SpellCooldownSystem';
import {
  SELECTABLE_TYPES,
  normalizeObjectForSave,
  normalizeEnemyForSave,
  extractTerrainData,
  disposeMeshTree,
  processLoadedWorldObject
} from '../systems/WorldObjectSystem';
import {
  createKeyDownHandler,
  createKeyUpHandler,
  registerKeyboardHandlers,
  unregisterKeyboardHandlers
} from '../systems/InputSystem';
import {
  getTerrainHeight,
  isInWater,
  getWaterDepth,
  getTerrainColor
} from '../systems/TerrainSystem';

// HUD Components
import HUD from '../components/hud/HUD';
import InventoryPanel from '../components/panels/InventoryPanel';
import SkillsPanel from '../components/panels/SkillsPanel';
import QuestPanel from '../components/panels/QuestPanel';
import CharacterPanel from '../components/panels/CharacterPanel';
import Minimap from '../components/hud/Minimap';
import WorldMap from '../components/hud/WorldMap';
import WorldEditor from '../components/game/WorldEditor';
import SpellBook, { SPELLS } from '../components/game/SpellBook';
import ActionBar from '../components/game/ActionBar';
import TrainerPanel from '../components/game/TrainerPanel';
import { WARRIOR_SPELLS } from '../data/spells';
import QuestDialog, { AVAILABLE_QUESTS } from '../components/game/QuestDialog';
import QuestLog from '../components/game/QuestLog';
import TerrainEditor from '../components/game/TerrainEditor';
import EnemyEditor from '../components/game/EnemyEditor';
import QuestMaker from '../components/game/QuestMaker';
import LootPanel from '../components/game/LootPanel';
import { generateLoot } from '../data/items';
import {
  transformToLootableCorpse,
  createLootSparkles as lootSystemCreateSparkles,
  applyLootItemPickup,
  applyLootAllPickup,
  cleanupCorpse as lootSystemCleanupCorpse,
  CORPSE_DESPAWN_TIME
} from '../systems/LootSystem';
import BagBar from '../components/game/BagBar';
import ItemDatabaseEditor from '../components/game/ItemDatabaseEditor';
import VendorPanel from '../components/game/VendorPanel';

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
  const castleEnemiesRef = useRef([]);
  
  // Player animation state
  const playerModelRef = useRef(null); // Reference to the player model parts
  const playerAnimationState = useRef({
    isMoving: false,
    animationTime: 0
  });
  
  // WoW-style camera controls - using centralized system
  const cameraState = useRef(createCameraState());
  
  // Movement state - using centralized system
  const movementState = useRef(createMovementState());
  
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
  const placementInProgressRef = useRef(false); // Prevent double-placement
  const currentZoneRef = useRef('starter_village');
  const placedObjectsRef = useRef([]);
  const previewMeshRef = useRef(null); // Preview mesh for object placement
  
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
  
  // ==================== EXPERIENCE & LEVELING SYSTEM ====================
  const [playerLevel, setPlayerLevel] = useState(1);
  const [currentXP, setCurrentXP] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(250);
  
  // Refs for stable access in event handlers (avoids stale closure issues)
  const playerLevelRef = useRef(1);
  const currentXPRef = useRef(0);
  
  // XP thresholds for each level (cumulative XP needed to reach that level)
  // Handle gaining XP (uses addNotificationRef to avoid initialization order issues)
  const gainXP = useCallback((amount) => {
    if (playerLevel >= MAX_LEVEL) return; // Already max level
    
    setCurrentXP(prevXP => {
      const newXP = prevXP + amount;
      
      // Check for level up
      let newLevel = playerLevel;
      while (newLevel < MAX_LEVEL && newXP >= XP_THRESHOLDS[newLevel]) {
        newLevel++;
      }
      
      // If leveled up
      if (newLevel > playerLevel) {
        // Schedule level up effects (using setTimeout to avoid state conflicts)
        setTimeout(() => {
          setPlayerLevel(newLevel);
          
          // Calculate new max health/mana based on level
          const newMaxHealth = 100 + (newLevel - 1) * 15; // +15 HP per level
          const newMaxMana = 50 + (newLevel - 1) * 10; // +10 mana per level
          
          setMaxHealth(newMaxHealth);
          setMaxMana(newMaxMana);
          
          // Restore health and mana to full on level up
          setCurrentHealth(newMaxHealth);
          setCurrentMana(newMaxMana);
          
          // Update XP to next level
          if (newLevel < MAX_LEVEL) {
            setXpToNextLevel(XP_THRESHOLDS[newLevel] - XP_THRESHOLDS[newLevel - 1]);
          } else {
            setXpToNextLevel(0);
          }
          
          // Show level up notification using ref
          if (addNotificationRef.current) {
            addNotificationRef.current(`LEVEL UP! You are now level ${newLevel}!`, 'success');
          }
          
          // Combat log
          setCombatLog(prev => [...prev.slice(-9), {
            time: Date.now(),
            text: `*** LEVEL ${newLevel} ***`
          }]);
        }, 0);
      }
      
      return newXP;
    });
  }, [playerLevel]);
  
  // Get current level progress (0-1)
  const getLevelProgress = useCallback(() => {
    if (playerLevel >= MAX_LEVEL) return 1;
    
    const currentLevelXP = XP_THRESHOLDS[playerLevel - 1] || 0;
    const nextLevelXP = XP_THRESHOLDS[playerLevel] || 0;
    const xpIntoLevel = currentXP - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    
    return Math.min(1, Math.max(0, xpIntoLevel / xpNeededForLevel));
  }, [currentXP, playerLevel]);
  
  // ==================== END EXPERIENCE & LEVELING SYSTEM ====================
  
  // Keep refs in sync with state for stable access in event handlers
  useEffect(() => {
    playerLevelRef.current = playerLevel;
  }, [playerLevel]);
  
  useEffect(() => {
    currentXPRef.current = currentXP;
  }, [currentXP]);
  
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
  const autoAttackSpeedRef = useRef(COMBAT_CONSTANTS.PLAYER_AUTO_ATTACK_SPEED);
  const globalCooldownRef = useRef(0); // GCD in seconds
  const npcCombatStateRef = useRef(new Map()); // Track combat state per NPC
  
  // Attack animation state
  const attackHandRef = useRef('right'); // Alternates between 'right' and 'left'
  const attackAnimationRef = useRef(null); // Current animation frame
  const isAttackingRef = useRef(false); // Is currently in attack animation
  const playerArmsRef = useRef({ left: null, right: null }); // References to arm meshes
  
  // Refs for functions used in animation loop (to avoid stale closures)
  const addNotificationRef = useRef(null);
  const enterCombatRef = useRef(null);
  
  // Death and Resurrection System
  const [isDead, setIsDead] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showReviveDialog, setShowReviveDialog] = useState(false);
  const [corpsePosition, setCorpsePosition] = useState(null);
  const corpseMarkerRef = useRef(null);
  const playerCorpseRef = useRef(null); // Visual corpse of the player
  const isDeadRef = useRef(false); // Ref for game loop access
  const isGhostRef = useRef(false); // Ref for game loop access
  const justTeleportedRef = useRef(false); // Prevent position override after teleport
  // Death/resurrection constants imported from DeathResurrectionSystem
  const GRAVEYARD_X = GRAVEYARD_POSITION.x;
  const GRAVEYARD_Z = GRAVEYARD_POSITION.z;
  
  // Keep death refs updated
  useEffect(() => {
    isDeadRef.current = isDead;
  }, [isDead]);
  
  useEffect(() => {
    isGhostRef.current = isGhost;
  }, [isGhost]);
  
  // Trainer state
  const [isTrainerOpen, setIsTrainerOpen] = useState(false);
  const isTrainerOpenRef = useRef(false);
  
  // Character Panel state
  const [isCharacterPanelOpen, setIsCharacterPanelOpen] = useState(false);
  const isCharacterPanelOpenRef = useRef(false);
  
  // Quest state
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false);
  const isQuestDialogOpenRef = useRef(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const isQuestLogOpenRef = useRef(false);
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [trackedQuestId, setTrackedQuestId] = useState(null);
  const [questGiverName, setQuestGiverName] = useState('Quest Giver');
  const [questGiverType, setQuestGiverType] = useState('questgiver');
  const [questGiverId, setQuestGiverId] = useState(null); // NPC's unique ID for quest assignment
  const [currentNPCQuest, setCurrentNPCQuest] = useState(null); // Custom quest from NPC via Quest Maker
  
  // Terrain Editor state
  const [isTerrainEditorOpen, setIsTerrainEditorOpen] = useState(false);
  const isTerrainEditorOpenRef = useRef(false);
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
  const isEnemyEditorOpenRef = useRef(false);
  const [placedEnemies, setPlacedEnemies] = useState([]);
  const [selectedEditEnemy, setSelectedEditEnemy] = useState(null);
  const selectedEditEnemyRef = useRef(null);
  const [pendingEnemyPlacement, setPendingEnemyPlacement] = useState(null);
  const enemyEditorActiveRef = useRef(false);
  const pendingEnemyPlacementRef = useRef(null); // CRITICAL: Ref for closure fix
  const enemyMeshesRef = useRef([]); // Store enemy mesh references
  const enemyPatrolDataRef = useRef({}); // Store patrol state for each enemy
  const combatEngagedEnemiesRef = useRef(new Set()); // Enemies currently in combat
  
  // Item Database Editor state
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  const isItemEditorOpenRef = useRef(false);
  const [isQuestMakerOpen, setIsQuestMakerOpen] = useState(false);
  const [customQuests, setCustomQuests] = useState([]);
  const [selectedNPCForQuest, setSelectedNPCForQuest] = useState(null);
  
  // World Map state
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const isWorldMapOpenRef = useRef(false);
  
  // Loot system state
  const [isLootPanelOpen, setIsLootPanelOpen] = useState(false);
  const [currentLootData, setCurrentLootData] = useState(null);
  const [currentLootCorpse, setCurrentLootCorpse] = useState(null);
  const corpseTimersRef = useRef(new Map()); // Track corpse despawn timers
  const lootableCorpsesRef = useRef(new Map()); // Track lootable corpses: enemyId -> { mesh, loot }
  const enemySpawnDataRef = useRef(new Map()); // Track original spawn data for respawning
  const createEnemyMeshRef = useRef(null); // Ref to createEnemyMesh for respawn callback
  
  // Vendor system state
  const [isVendorPanelOpen, setIsVendorPanelOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState({ type: 'vendor_general', name: 'Merchant' });
  
  // Bag system state
  const [openBagIndex, setOpenBagIndex] = useState(null);
  const openBagIndexRef = useRef(null);
  
  // Spell book state ref (already have isSpellBookOpen state)
  const isSpellBookOpenRef = useRef(false);
  
  // Selected edit object ref
  const selectedEditObjectRef = useRef(null);
  
  // Action bar spells ref
  const actionBarSpellsRef = useRef([]);
  
  const { 
    activePanel, 
    fetchPlayer, 
    fetchQuests, 
    player,
    character,
    attackMonster,
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
    skills,
    createCustomQuest,
    fetchCustomQuests,
    assignQuestToNPC,
    removeQuestFromNPC,
    getQuestByNPC,
    removeItemFromBag
  } = useGameStore();
  
  // Get experience and level from store
  const storeExperience = useGameStore(state => state.experience);
  const storeCombatLevel = useGameStore(state => state.combat_level);
  
  // Use stable reference for addNotification to avoid re-renders
  const addNotification = useCallback((message, type = 'info') => {
    useGameStore.getState().addNotification(message, type);
  }, []);
  
  // Use store values for spells and copper
  const learnedSpells = learned_spells || ['autoAttack', 'warrior_attack'];
  const actionBarSpells = action_bar || ['autoAttack', 'warrior_attack', null, null, null, null];
  const playerCopper = copper || 2500;
  const savedPosition = position || { x: 0, y: 0, z: 0 };
  
  // Initialize player level and XP from store on mount
  useEffect(() => {
    if (storeExperience !== undefined && storeExperience > 0) {
      setCurrentXP(storeExperience);
    }
    if (storeCombatLevel !== undefined && storeCombatLevel > 1) {
      setPlayerLevel(storeCombatLevel);
      // Update max health/mana based on loaded level
      const loadedMaxHealth = 100 + (storeCombatLevel - 1) * 15;
      const loadedMaxMana = 50 + (storeCombatLevel - 1) * 10;
      setMaxHealth(loadedMaxHealth);
      setMaxMana(loadedMaxMana);
      setCurrentHealth(loadedMaxHealth);
      setCurrentMana(loadedMaxMana);
      // Update XP to next level
      if (storeCombatLevel < MAX_LEVEL) {
        setXpToNextLevel(XP_THRESHOLDS[storeCombatLevel] - XP_THRESHOLDS[storeCombatLevel - 1]);
      }
    }
  }, [storeExperience, storeCombatLevel]);
  
  // Sync level and XP to store when they change
  useEffect(() => {
    useGameStore.setState({ 
      experience: currentXP,
      combat_level: playerLevel 
    });
  }, [currentXP, playerLevel]);
  
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
  
  // Keep InputSystem state refs in sync (CRITICAL for keyboard handler closures)
  useEffect(() => {
    isTrainerOpenRef.current = isTrainerOpen;
  }, [isTrainerOpen]);
  
  useEffect(() => {
    isCharacterPanelOpenRef.current = isCharacterPanelOpen;
  }, [isCharacterPanelOpen]);
  
  useEffect(() => {
    isQuestDialogOpenRef.current = isQuestDialogOpen;
  }, [isQuestDialogOpen]);
  
  useEffect(() => {
    isQuestLogOpenRef.current = isQuestLogOpen;
  }, [isQuestLogOpen]);
  
  useEffect(() => {
    isTerrainEditorOpenRef.current = isTerrainEditorOpen;
  }, [isTerrainEditorOpen]);
  
  useEffect(() => {
    isEnemyEditorOpenRef.current = isEnemyEditorOpen;
  }, [isEnemyEditorOpen]);
  
  useEffect(() => {
    selectedEditEnemyRef.current = selectedEditEnemy;
  }, [selectedEditEnemy]);
  
  useEffect(() => {
    isItemEditorOpenRef.current = isItemEditorOpen;
  }, [isItemEditorOpen]);
  
  useEffect(() => {
    isWorldMapOpenRef.current = isWorldMapOpen;
  }, [isWorldMapOpen]);
  
  useEffect(() => {
    openBagIndexRef.current = openBagIndex;
  }, [openBagIndex]);
  
  useEffect(() => {
    isSpellBookOpenRef.current = isSpellBookOpen;
  }, [isSpellBookOpen]);
  
  useEffect(() => {
    selectedEditObjectRef.current = selectedEditObject;
  }, [selectedEditObject]);
  
  useEffect(() => {
    actionBarSpellsRef.current = actionBarSpells;
  }, [actionBarSpells]);
  
  // Cooldown timer effect - using SpellCooldownSystem
  useEffect(() => {
    const interval = setInterval(() => {
      setSpellCooldowns(prev => {
        const result = updateSpellCooldowns(prev, COOLDOWN_TICK_AMOUNT);
        return result.cooldowns;
      });
    }, COOLDOWN_TICK_INTERVAL);
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
    }, COMBAT_CONSTANTS.COMBAT_EXIT_DELAY);
  }, []);
  
  // Keep enterCombat ref updated (for animation loop)
  useEffect(() => {
    enterCombatRef.current = enterCombat;
  }, [enterCombat]);
  
  // ==================== PLAYER DEATH & RESURRECTION SYSTEM ====================
  
  // Handle player death
  // ==================== DEATH & RESURRECTION SYSTEM ====================
  // Using DeathResurrectionSystem for all death/resurrection logic
  
  const handlePlayerDeath = useCallback(() => {
    if (isDead) return; // Already dead
    
    deathSystemHandlePlayerDeath({
      playerRef,
      combatEngagedEnemiesRef,
      npcCombatStateRef,
      setters: {
        setIsDead,
        setShowReleaseDialog,
        setIsAutoAttacking,
        setIsInCombat,
        setCorpsePosition,
        setSelectedTarget
      },
      addNotification
    });
  }, [isDead, addNotification]);
  
  // Handle releasing corpse (become ghost at graveyard)
  const handleReleaseCorpse = useCallback(() => {
    deathSystemHandleReleaseCorpse({
      corpsePosition,
      playerRef,
      sceneRef,
      playerCorpseRef,
      justTeleportedRef,
      getTerrainHeight,
      setters: {
        setShowReleaseDialog,
        setIsGhost
      },
      addNotification
    });
  }, [corpsePosition, addNotification]);
  
  // Handle reviving at corpse
  const handleRevive = useCallback(() => {
    deathSystemHandlePlayerRevive({
      corpsePosition,
      playerRef,
      sceneRef,
      corpseMarkerRef,
      playerCorpseRef,
      getTerrainHeight,
      maxHealth,
      maxMana,
      setters: {
        setShowReviveDialog,
        setIsGhost,
        setIsDead,
        setCurrentHealth,
        setCurrentMana,
        setCorpsePosition
      },
      addNotification
    });
  }, [corpsePosition, maxHealth, maxMana, addNotification]);
  
  // Check if player is near corpse (for revive dialog)
  useEffect(() => {
    if (!isGhost || !corpsePosition || !playerRef.current) return;
    
    const checkDistance = setInterval(() => {
      if (!playerRef.current || !corpsePosition) return;
      
      const playerPos = playerRef.current.position;
      const nearCorpse = isNearCorpse(playerPos, corpsePosition, CORPSE_REVIVE_RADIUS);
      
      if (nearCorpse) {
        setShowReviveDialog(true);
      } else {
        setShowReviveDialog(false);
      }
    }, 200);
    
    return () => clearInterval(checkDistance);
  }, [isGhost, corpsePosition]);
  
  // Check for player death when health changes
  useEffect(() => {
    if (currentHealth <= 0 && !isDead) {
      handlePlayerDeath();
    }
  }, [currentHealth, isDead, handlePlayerDeath]);
  
  // ==================== END DEATH & RESURRECTION SYSTEM ====================
  
  // ==================== QUEST KILL TRACKING ====================
  // Update quest progress when an enemy is killed - using QuestProgressSystem
  const updateQuestKillProgress = useCallback((enemyName, enemyType, customName) => {
    // Update active quests (predefined quests)
    const activeResult = updateQuestListForEnemyKill(
      activeQuests,
      enemyName,
      enemyType,
      customName,
      addNotification,
      false // No NPC requirement for active quests
    );
    
    if (activeResult.anyUpdated) {
      setActiveQuests(activeResult.updatedQuests);
    }
    
    // Update custom quests (player-created quests - require NPC assignment)
    const customResult = updateQuestListForEnemyKill(
      customQuests,
      enemyName,
      enemyType,
      customName,
      addNotification,
      true // Require npc_id for custom quests
    );
    
    if (customResult.anyUpdated) {
      setCustomQuests(customResult.updatedQuests);
    }
    
    return activeResult.anyUpdated || customResult.anyUpdated;
  }, [activeQuests, customQuests, addNotification]);
  // ==================== END QUEST KILL TRACKING ====================

  // Handle enemy death - create lootable corpse
  const handleEnemyDeath = useCallback((enemy, enemyId) => {
    // Calculate XP based on level difference using mob difficulty system
    const mobLevel = enemy.userData.level || 1;
    const xpGained = calculateXPGain(mobLevel, playerLevel);
    
    // Award XP
    if (xpGained > 0) {
      gainXP(xpGained);
      addNotification(`Defeated ${enemy.userData.name}! +${xpGained} XP`, 'success');
    } else {
      addNotification(`Defeated ${enemy.userData.name}! (No XP - trivial)`, 'info');
    }
    
    // Update quest kill progress
    const killedEnemyName = enemy.userData.name || '';
    const killedEnemyType = enemy.userData.enemyType || enemy.userData.type || '';
    const killedEnemyCustomName = enemy.userData.customName || '';
    updateQuestKillProgress(killedEnemyName, killedEnemyType, killedEnemyCustomName);
    
    // Remove from combat tracking
    if (enemyId) {
      combatEngagedEnemiesRef.current.delete(enemyId);
      npcCombatStateRef.current.delete(enemyId);
    }
    
    // Generate loot for this enemy
    const enemyType = enemy.userData.enemyType || enemy.userData.name?.toLowerCase() || 'default';
    const loot = generateLoot(enemyType, enemy.userData.level || 1);
    
    // Transform enemy into lootable corpse (using LootSystem)
    transformToLootableCorpse(enemy, getTerrainHeight, loot);
    
    // Store in lootable corpses
    lootableCorpsesRef.current.set(enemyId, { mesh: enemy, loot });
    
    // Add sparkle effect to corpse (using LootSystem)
    const sparkles = lootSystemCreateSparkles();
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
    
    // Set corpse despawn timer, then RESPAWN the enemy
    const despawnTimer = setTimeout(() => {
      console.log('[RESPAWN] Timer fired for enemy:', enemyId);
      
      // Remove corpse from scene
      if (sceneRef.current && enemy.parent) {
        sceneRef.current.remove(enemy);
        selectableObjects.current = selectableObjects.current.filter(obj => obj !== enemy);
        console.log('[RESPAWN] Corpse removed from scene');
      }
      
      // Clean up tracking
      if (enemyId) {
        enemyMeshesRef.current = enemyMeshesRef.current.filter(e => e.userData.enemyId !== enemyId);
        delete enemyPatrolDataRef.current[enemyId];
        lootableCorpsesRef.current.delete(enemyId);
        corpseTimersRef.current.delete(enemyId);
      }
      
      // Close loot panel if this corpse was being looted
      setIsLootPanelOpen(prev => {
        // Check via closure if this was the looted corpse
        return prev;
      });
      setCurrentLootData(null);
      setCurrentLootCorpse(null);
      
      // RESPAWN: Check if this enemy has spawn data saved (placed enemies respawn)
      const spawnData = enemySpawnDataRef.current.get(enemyId);
      console.log('[RESPAWN] Checking respawn for enemy:', enemyId);
      console.log('[RESPAWN] Spawn data found:', spawnData);
      console.log('[RESPAWN] createEnemyMeshRef.current exists:', !!createEnemyMeshRef.current);
      console.log('[RESPAWN] sceneRef.current exists:', !!sceneRef.current);
      
      if (spawnData && sceneRef.current && createEnemyMeshRef.current) {
        // Generate new ID for respawned enemy
        const newEnemyId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('[RESPAWN] Creating new enemy with ID:', newEnemyId, 'at position:', spawnData.x, spawnData.z);
        
        // Create new enemy mesh at original spawn position using the ref
        const newEnemy = createEnemyMeshRef.current(
          spawnData.x,
          spawnData.z,
          {
            ...spawnData,
            currentHealth: spawnData.maxHealth // Full health on respawn
          },
          newEnemyId
        );
        
        console.log('[RESPAWN] New enemy mesh created:', newEnemy);
        
        if (newEnemy) {
          sceneRef.current.add(newEnemy);
          enemyMeshesRef.current.push(newEnemy);
          selectableObjects.current.push(newEnemy);
          
          // Update placedEnemies with new enemy ID
          setPlacedEnemies(prev => prev.map(e => 
            e.id === enemyId 
              ? { ...e, id: newEnemyId, currentHealth: e.maxHealth }
              : e
          ));
          
          // Update spawn data reference with new ID
          enemySpawnDataRef.current.delete(enemyId);
          enemySpawnDataRef.current.set(newEnemyId, spawnData);
          
          // DELETE old enemy from database FIRST, then add new one
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/world/enemies/${enemyId}`, {
            method: 'DELETE'
          }).then(() => {
            // Now save the respawned enemy with new ID
            return fetch(`${process.env.REACT_APP_BACKEND_URL}/api/world/enemies`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...spawnData,
                id: newEnemyId,
                currentHealth: spawnData.maxHealth
              })
            });
          }).catch(err => console.error('[RESPAWN] Failed to update database:', err));
          
          // Use ref for notification to avoid stale closure
          if (addNotificationRef.current) {
            addNotificationRef.current(`${spawnData.name} has respawned!`, 'info');
          }
          console.log(`[RESPAWN] SUCCESS: Enemy respawned: ${spawnData.name} at (${spawnData.x}, ${spawnData.z})`);
        } else {
          console.error('[RESPAWN] Failed to create enemy mesh');
        }
      } else {
        console.log('[RESPAWN] No respawn - missing data. spawnData:', !!spawnData, 'scene:', !!sceneRef.current, 'createFn:', !!createEnemyMeshRef.current);
        // No spawn data = temporary enemy, just remove from placedEnemies
        setPlacedEnemies(prev => prev.filter(e => e.id !== enemyId));
      }
    }, RESPAWN_TIME);
    
    corpseTimersRef.current.set(enemyId, despawnTimer);
  }, [addNotification, gainXP, playerLevel, updateQuestKillProgress]);
  
  // Handle looting a corpse
  const handleOpenLoot = useCallback((corpseId) => {
    const corpseData = lootableCorpsesRef.current.get(corpseId);
    if (!corpseData) return;
    
    setCurrentLootData(corpseData.loot);
    setCurrentLootCorpse(corpseId);
    setIsLootPanelOpen(true);
  }, []);
  
  // Handle looting an individual item - using LootSystem
  const handleLootItem = useCallback(async (lootItem) => {
    const result = await applyLootItemPickup(
      lootItem,
      currentLootData,
      { backpack, bags },
      addItemToBag,
      updateCopper,
      copper || 0
    );
    
    // Update copper in state if needed
    if (result.copperAdded > 0) {
      useGameStore.setState({ copper: (copper || 0) + result.copperAdded });
    }
    
    // Show notification
    if (result.notification) {
      addNotification(result.notification, 'success');
    }
    
    // Check if loot is empty and handle cleanup
    if (result.isEmpty) {
      // Close panel and remove corpse immediately
      setIsLootPanelOpen(false);
      setCurrentLootData(null);
      
      const corpseData = lootableCorpsesRef.current.get(currentLootCorpse);
      if (corpseData && corpseData.mesh && sceneRef.current) {
        const { selectableObjects: newSelectableObjects, enemyMeshes: newEnemyMeshes } = 
          lootSystemCleanupCorpse(
            corpseData.mesh,
            sceneRef.current,
            selectableObjects.current,
            enemyMeshesRef.current,
            currentLootCorpse
          );
        selectableObjects.current = newSelectableObjects;
        enemyMeshesRef.current = newEnemyMeshes;
      }
      
      // Don't clear the respawn timer - it needs to run
      lootableCorpsesRef.current.delete(currentLootCorpse);
      setCurrentLootCorpse(null);
    } else {
      setCurrentLootData(result.newLootData);
    }
  }, [addNotification, currentLootCorpse, currentLootData, addItemToBag, copper, updateCopper, backpack, bags]);
  
  // Handle loot all button - using LootSystem for batch operations
  const handleLootAll = useCallback(async () => {
    if (!currentLootData) return;
    
    const result = await applyLootAllPickup(
      currentLootData,
      { backpack, bags },
      updateCopper,
      copper || 0
    );
    
    // Update copper in state
    if (result.goldLooted > 0) {
      useGameStore.setState({ copper: (copper || 0) + result.goldLooted });
    }
    
    // Single state update for all items
    useGameStore.setState({ 
      backpack: result.backpackCopy, 
      bags: result.bagsCopy 
    });
    
    // Single notification for all loot
    if (result.notification) {
      addNotification(result.notification, 'success');
    }
    
    // Close panel and remove corpse
    setIsLootPanelOpen(false);
    
    const corpseData = lootableCorpsesRef.current.get(currentLootCorpse);
    if (corpseData && corpseData.mesh && sceneRef.current) {
      const { selectableObjects: newSelectableObjects, enemyMeshes: newEnemyMeshes } = 
        lootSystemCleanupCorpse(
          corpseData.mesh,
          sceneRef.current,
          selectableObjects.current,
          enemyMeshesRef.current,
          currentLootCorpse
        );
      selectableObjects.current = newSelectableObjects;
      enemyMeshesRef.current = newEnemyMeshes;
    }
    
    // Don't clear the respawn timer - it needs to run
    lootableCorpsesRef.current.delete(currentLootCorpse);
    
    setCurrentLootCorpse(null);
    setCurrentLootData(null);
  }, [currentLootData, currentLootCorpse, addNotification, backpack, bags, copper, updateCopper]);
  
  // ==================== ATTACK ANIMATION SYSTEM ====================
  
  // Play attack animation - swing the appropriate arm
  const playAttackAnimation = useCallback((hand = 'right') => {
    if (!playerRef.current || isAttackingRef.current) return;
    
    isAttackingRef.current = true;
    
    // Get the arm pivot
    const armPivotName = hand === 'right' ? 'rightArmPivot' : 'leftArmPivot';
    const armPivot = playerRef.current.getObjectByName(armPivotName);
    
    if (!armPivot) {
      isAttackingRef.current = false;
      return;
    }
    
    // Store original rotation
    const originalRotX = armPivot.rotation.x;
    const originalRotZ = armPivot.rotation.z;
    
    // Animation phases
    const windUpDuration = 150; // ms - pull back
    const swingDuration = 100; // ms - swing forward
    const returnDuration = 200; // ms - return to rest
    
    // Direction multiplier for left vs right arm
    const sideMultiplier = hand === 'right' ? 1 : -1;
    
    // Phase 1: Wind up (pull arm back)
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < windUpDuration) {
        // Wind up phase - pull arm back and up
        const progress = elapsed / windUpDuration;
        const easeProgress = Math.sin(progress * Math.PI / 2); // Ease out
        armPivot.rotation.x = originalRotX - easeProgress * 1.2; // Pull back
        armPivot.rotation.z = originalRotZ + sideMultiplier * easeProgress * 0.3; // Slight outward
        attackAnimationRef.current = requestAnimationFrame(animate);
      } else if (elapsed < windUpDuration + swingDuration) {
        // Swing phase - fast forward swing
        const swingElapsed = elapsed - windUpDuration;
        const progress = swingElapsed / swingDuration;
        const easeProgress = Math.sin(progress * Math.PI / 2); // Ease out
        armPivot.rotation.x = (originalRotX - 1.2) + easeProgress * 2.5; // Swing forward
        armPivot.rotation.z = (originalRotZ + sideMultiplier * 0.3) - sideMultiplier * easeProgress * 0.5; // Swing inward
        attackAnimationRef.current = requestAnimationFrame(animate);
      } else if (elapsed < windUpDuration + swingDuration + returnDuration) {
        // Return phase - ease back to rest
        const returnElapsed = elapsed - windUpDuration - swingDuration;
        const progress = returnElapsed / returnDuration;
        const easeProgress = 1 - Math.cos(progress * Math.PI / 2); // Ease in-out
        const swingEndX = originalRotX + 1.3;
        const swingEndZ = originalRotZ - sideMultiplier * 0.2;
        armPivot.rotation.x = swingEndX + (originalRotX - swingEndX) * easeProgress;
        armPivot.rotation.z = swingEndZ + (originalRotZ - swingEndZ) * easeProgress;
        attackAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - reset to original
        armPivot.rotation.x = originalRotX;
        armPivot.rotation.z = originalRotZ;
        isAttackingRef.current = false;
        attackAnimationRef.current = null;
      }
    };
    
    attackAnimationRef.current = requestAnimationFrame(animate);
  }, []);
  
  // ==================== END ATTACK ANIMATION SYSTEM ====================
  
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
    if (distance > AI_CONSTANTS.MELEE_RANGE) {
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
    
    // Play attack animation with alternating hands
    const currentHand = attackHandRef.current;
    playAttackAnimation(currentHand);
    
    // Alternate hands for next attack
    attackHandRef.current = currentHand === 'right' ? 'left' : 'right';
    
    // Enter combat
    if (enterCombatRef.current) {
      enterCombatRef.current();
    }
    
    // Calculate auto-attack damage (using CombatSystem)
    const damage = calculateAutoAttackDamage();
    
    // Apply damage to target (use currentHealth, fallback to maxHealth)
    const currentHp = target.userData.currentHealth ?? target.userData.maxHealth;
    const newHp = Math.max(0, currentHp - damage);
    target.userData.currentHealth = newHp; // Update currentHealth consistently
    
    // Show damage text
    if (sceneRef.current) {
      const damageSprite = createDamageText(sceneRef.current, target.position.clone(), damage, false);
      damageTextsRef.current.push(damageSprite);
    }
    
    // Update NPC health bar (using CombatSystem)
    const enemyId = target.userData.enemyId;
    updateEnemyHealthBar(target, newHp);
    
    // Force UI update for target health bar
    setTargetHealthUpdate(prev => prev + 1);
    
    // Combat log only (no notifications for auto-attacks)
    setCombatLog(prev => [...prev.slice(-9), {
      time: Date.now(),
      text: `Auto-attack hits ${target.userData.name} for ${damage} damage!`
    }]);
    
    // Aggro the NPC (using EnemyAISystem)
    if (enemyId) {
      let combatState = npcCombatStateRef.current.get(enemyId);
      if (!combatState) {
        combatState = createCombatState(target);
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
  }, [handleEnemyDeath, playAttackAnimation]);
  
  // Handle enemy death
  // World Editor handlers
  const handlePlaceObject = useCallback((objectData) => {
    setPendingPlacement(objectData);
    addNotification('Click in the world to place object', 'info');
  }, [addNotification]);

  const handleDeleteObject = useCallback(async (objectId) => {
    // Remove from scene
    const obj = editorObjectsRef.current.find(o => o.userData.editorId === objectId);
    if (obj && sceneRef.current) {
      disposeMeshTree(obj);
      sceneRef.current.remove(obj);
      editorObjectsRef.current = editorObjectsRef.current.filter(o => o.userData.editorId !== objectId);
      selectableObjects.current = selectableObjects.current.filter(o => o.userData.editorId !== objectId);
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

  // Quest Maker handlers
  const handleSaveQuest = useCallback(async (quest) => {
    try {
      const savedQuest = await createCustomQuest(quest);
      setCustomQuests(prev => [...prev, savedQuest]);
      // Don't close the Quest Maker - let user assign the quest to an NPC if one is selected
      addNotification(`Quest "${quest.name}" saved!`, 'success');
    } catch (err) {
      console.error('Failed to save quest:', err);
      addNotification('Failed to save quest', 'error');
    }
  }, [createCustomQuest, addNotification]);
  
  const handleAssignQuestToNPC = useCallback(async (questId, npcData) => {
    try {
      await assignQuestToNPC(questId, {
        npc_id: npcData.id,
        npc_name: npcData.name,
        npc_position: npcData.position
      });
      
      // Update local NPC data to show quest assignment
      setPlacedObjects(prev => prev.map(obj => 
        obj.id === npcData.id 
          ? { ...obj, quest_id: questId, quest_giver: true }
          : obj
      ));
      
      // Update quest in custom quests list
      setCustomQuests(prev => prev.map(q =>
        q.quest_id === questId
          ? { ...q, npc_id: npcData.id, npc_name: npcData.name }
          : q
      ));
      
      // Add visual quest marker to NPC
      const npcMesh = editorObjectsRef.current.find(obj => obj.userData.editorId === npcData.id);
      if (npcMesh) {
        // Remove old marker if exists
        const oldMarker = npcMesh.children.find(child => child.userData.questMarker);
        if (oldMarker) {
          npcMesh.remove(oldMarker);
        }
        
        // Add yellow "!" marker above NPC
        const markerGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
        const markerMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffff00,
          emissive: 0xffff00,
          emissiveIntensity: 0.8
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.y = 2.5;
        marker.userData.questMarker = true;
        npcMesh.add(marker);
      }
      
      addNotification(`Quest assigned to ${npcData.name}!`, 'success');
    } catch (err) {
      console.error('Failed to assign quest:', err);
    }
  }, [assignQuestToNPC, addNotification]);
  
  const handleRemoveQuestFromNPC = useCallback(async (questId, npcId) => {
    try {
      // Call backend to remove quest using the dedicated endpoint
      await removeQuestFromNPC(questId);
      
      // Update local NPC data
      setPlacedObjects(prev => prev.map(obj => 
        obj.quest_id === questId
          ? { ...obj, quest_id: null, quest_giver: false }
          : obj
      ));
      
      // Update quest in custom quests list
      setCustomQuests(prev => prev.map(q =>
        q.quest_id === questId
          ? { ...q, npc_id: null, npc_name: null }
          : q
      ));
      
      // Remove visual quest marker from NPC
      const npcMesh = editorObjectsRef.current.find(obj => obj.userData.editorId === npcId);
      if (npcMesh) {
        const marker = npcMesh.children.find(child => child.userData.questMarker);
        if (marker) {
          npcMesh.remove(marker);
        }
      }
      
    } catch (err) {
      console.error('Failed to remove quest:', err);
    }
  }, [removeQuestFromNPC]);
  
  // Handle selling items to vendor
  const handleSellItem = useCallback((item, slotIndex, sellPrice) => {
    // Remove item from backpack (bag 0)
    removeItemFromBag(0, slotIndex);
    addNotification(`Sold ${item.name} for ${sellPrice} copper`, 'success');
  }, [removeItemFromBag, addNotification]);
  
  // Load custom quests on mount
  useEffect(() => {
    fetchCustomQuests().then(quests => {
      setCustomQuests(quests || []);
    });
  }, [fetchCustomQuests]);

  // Handle logout with comprehensive world save
  const handleLogout = useCallback(async () => {
    addNotification('Saving all game data...', 'info');
    
    // Get current player position from ref (most up-to-date)
    const currentPlayerPosition = playerRef.current ? {
      x: playerRef.current.position.x,
      y: playerRef.current.position.y,
      z: playerRef.current.position.z,
      zone: currentZoneRef.current || 'starter_village'
    } : null;
    
    // Update position in store immediately before logout
    if (currentPlayerPosition) {
      await updatePosition(currentPlayerPosition);
    }
    
    // Note: Terrain is NOT auto-saved on logout to prevent corruption.
    // Use F2 -> Save button in Terrain Editor to manually save terrain changes.
    
    // Use ref to get latest placed objects (handles closure issues)
    const currentPlacedObjects = placedObjectsRef.current;
    
    // Gather world objects (using WorldObjectSystem normalization)
    const worldObjects = currentPlacedObjects.map(obj => normalizeObjectForSave(obj, currentZone));
    
    // Gather placed enemies (using WorldObjectSystem normalization)
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
  }, [addNotification, logout, placedEnemies, currentZone, updatePosition]);

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
  
  
  // Function to create an enemy mesh - now using WorldAssetFactory
  // Wrapper to maintain compatibility with existing code
  const createEnemyMesh = useCallback((x, z, enemyData, enemyId) => {
    return createEnemyMeshFactory(enemyData, x, z, enemyId, getTerrainHeight);
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
          x: enemyData.position.x,
          z: enemyData.position.z,
          position: { x: enemyData.position.x, y: 0, z: enemyData.position.z },
          zone: currentZone
        };
        
        // Store spawn data for respawning
        enemySpawnDataRef.current.set(enemyId, {
          ...enemyData,
          x: enemyData.position.x,
          z: enemyData.position.z
        });
        
        setPlacedEnemies(prev => [...prev, newEnemy]);
        addNotification(`Duplicated ${enemyData.name}!`, 'success');
      }
    } else {
      // Pending placement - wait for user click
      setPendingEnemyPlacement(enemyData);
      addNotification(`Click terrain to spawn ${enemyData.name}`, 'info');
    }
  }, [addNotification, currentZone, createEnemyMesh]);
  
  // Store createEnemyMesh in ref for respawn callback
  useEffect(() => {
    createEnemyMeshRef.current = createEnemyMesh;
  }, [createEnemyMesh]);
  
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
      
      // Remove spawn data (prevents respawn)
      enemySpawnDataRef.current.delete(enemyId);
      
      console.log('Enemy removed from scene');
    }
    
    // Delete from database
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/world/enemies/${enemyId}`, {
      method: 'DELETE'
    }).then(res => {
      if (res.ok) {
        console.log('Enemy deleted from database:', enemyId);
      }
    }).catch(err => {
      console.error('Failed to delete enemy from database:', err);
    });
    
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
  
  const handleTurnInQuest = useCallback((quest) => {
    // Get rewards from quest
    const rewards = quest.rewards || {};
    const xpReward = rewards.xp || 0;
    const goldReward = rewards.gold || 0;
    
    // Award XP
    if (xpReward > 0) {
      gainXP(xpReward);
      addNotification(`+${xpReward} Experience!`, 'success');
    }
    
    // Award gold (copper)
    if (goldReward > 0) {
      const currentCopper = copper || 0;
      useGameStore.setState({ copper: currentCopper + goldReward });
      updateCopper(goldReward).catch(err => console.error('Failed to save copper:', err));
      addNotification(`+${goldReward} Gold!`, 'success');
    }
    
    // Remove from active quests and add to completed
    const questId = quest.id || quest.quest_id;
    setActiveQuests(prev => prev.filter(q => (q.id || q.quest_id) !== questId));
    setCustomQuests(prev => prev.filter(q => (q.id || q.quest_id) !== questId));
    setCompletedQuests(prev => [...prev, { ...quest, completedAt: Date.now() }]);
    
    // Clear tracking if this quest was tracked
    if (trackedQuestId === questId) {
      setTrackedQuestId(null);
    }
    
    addNotification(`Quest completed: ${quest.name}!`, 'success');
  }, [addNotification, gainXP, trackedQuestId, copper, updateCopper]);
  
  const handleAbandonQuest = useCallback((questId) => {
    // Remove from activeQuests (handles both id and quest_id)
    setActiveQuests(prev => prev.filter(q => q.id !== questId && q.quest_id !== questId));
    // Also remove from customQuests if it was a custom quest
    setCustomQuests(prev => prev.filter(q => q.id !== questId && q.quest_id !== questId));
    
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
    
    // Check cooldown - using SpellCooldownSystem
    if (isSpellOnCooldown(spellCooldowns, spellId)) {
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
    
    // Start cooldown - using SpellCooldownSystem
    setSpellCooldowns(prev => startSpellCooldown(prev, spellId, spell.cooldown));
    
    // Set global cooldown - using SpellCooldownSystem
    globalCooldownRef.current = startGlobalCooldown();
    
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
      
      // Mark enemy as in combat and aggro them (using EnemyAISystem)
      if (enemyId) {
        const combatState = npcCombatStateRef.current.get(enemyId) || createCombatState(selectedTarget);
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
      
      // Update health bar above enemy (using CombatSystem)
      updateEnemyHealthBar(selectedTarget, newHp);
      
      // Force UI update for target health bar
      setTargetHealthUpdate(prev => prev + 1);
      
      // Combat log
      setCombatLog(prev => [...prev.slice(-9), {
        time: Date.now(),
        text: `${spell.name} hits ${selectedTarget.name} for ${baseDamage} damage!`
      }]);
      
      // Check if monster defeated
      if (newHp <= 0) {
        // Call the proper death handler to create lootable corpse and handle respawn
        handleEnemyDeath(selectedTarget, enemyId);
        
        // Clear target selection
        setSelectedTarget(null);
        if (targetIndicatorRef.current) {
          targetIndicatorRef.current.visible = false;
        }
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
  }, [spellCooldowns, currentMana, selectedTarget, addNotification, handleEnemyDeath]);

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
  const positionRestoredRef = useRef(false);
  useEffect(() => {
    // Don't override position if player just teleported (death/respawn) or is ghost
    if (justTeleportedRef.current || isGhostRef.current || isDeadRef.current) return;
    
    if (playerRef.current && savedPosition && ready && !positionRestoredRef.current) {
      // Check if savedPosition has meaningful data (not default origin)
      const hasSavedPosition = savedPosition.x !== 0 || savedPosition.z !== 0;
      
      if (hasSavedPosition) {
        const terrainY = getTerrainHeight(savedPosition.x, savedPosition.z);
        playerRef.current.position.set(savedPosition.x, terrainY, savedPosition.z);
        positionRestoredRef.current = true;
        console.log('[POSITION] Restored player to saved position:', savedPosition.x, savedPosition.z);
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
          zone: currentZoneRef.current || 'starter_village'
        });
      }
    }, 500); // Sync every 500ms
    
    // Also save on window close/refresh using sendBeacon (modern, reliable API)
    const handleBeforeUnload = () => {
      const pos = playerRef.current?.position;
      if (pos && navigator.sendBeacon) {
        // Use sendBeacon for reliable saving on page close
        // Token is sent in body since sendBeacon can't set custom headers
        const data = JSON.stringify({
          token: token,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          zone: currentZoneRef.current || 'starter_village',
          combat_level: playerLevelRef.current,
          experience: currentXPRef.current
        });
        navigator.sendBeacon(
          `${process.env.REACT_APP_BACKEND_URL}/api/player/position-beacon`,
          new Blob([data], { type: 'application/json' })
        );
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [ready, updatePosition, playerLevel, currentXP, token]);

  // Setup Three.js scene with WoW controls
  useEffect(() => {
    if (!containerRef.current || !ready) return;
    
    // Scene setup using helper functions
    const scene = createGameScene();
    sceneRef.current = scene;
    
    // Camera setup
    const camera = createGameCamera();
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = createGameRenderer(containerRef.current);
    rendererRef.current = renderer;
    
    // Lighting setup
    setupWorldLighting(scene);
    
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
        
        // Get terrain color using the new coloring system
        const color = getTerrainColor(worldX, worldZ, height);
        colors.push(color.r, color.g, color.b);
      }
      
      return { heightmap, colors };
    };
    
    // Load terrain from database or generate new
    const TERRAIN_VERSION = 2; // Increment when terrain generation changes
    const loadOrGenerateTerrain = async () => {
      try {
        const result = await fetchTerrain();
        
        console.log('Terrain fetch result:', {
          exists: result.exists,
          has_heightmap: result.terrain?.heightmap?.length > 0,
          has_colors: result.terrain?.colors?.length > 0,
          heightmap_length: result.terrain?.heightmap?.length,
          colors_length: result.terrain?.colors?.length,
          saved_version: result.terrain?.version
        });
        
        // Check if terrain exists AND version matches (regenerate if version outdated)
        const savedVersion = result.terrain?.version || 1;
        const needsRegeneration = savedVersion < TERRAIN_VERSION;
        
        if (result.exists && result.terrain && result.terrain.heightmap && result.terrain.heightmap.length > 0 && !needsRegeneration) {
          console.log('Loading saved terrain from database...');
          applyTerrainData(result.terrain.heightmap, result.terrain.colors);
          console.log('Terrain loaded successfully!');
        } else {
          if (needsRegeneration) {
            console.log(`Terrain version outdated (v${savedVersion} -> v${TERRAIN_VERSION}), regenerating with new coloring...`);
          } else {
            console.log('Generating new terrain...');
          }
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
                version: TERRAIN_VERSION
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
      rock.receiveShadow = true;
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
      shore.receiveShadow = true;
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
    
    // ==================== OAKVALE TOWN CENTER ====================
    // A lively starter town with central square, market, and functional NPCs
    
    // === GROUND & TOWN SQUARE ===
    // Town square ground - cobblestone
    const townSquareGeometry = new THREE.CircleGeometry(18, 32);
    const townSquareMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
    const townSquare = new THREE.Mesh(townSquareGeometry, townSquareMaterial);
    townSquare.rotation.x = -Math.PI / 2;
    townSquare.position.y = 0.015;
    scene.add(townSquare);
    
    // Grass areas around the square
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x32CD32 });
    const grassPatches = [
      { x: -22, z: 0, r: 8 },
      { x: 22, z: 0, r: 8 },
      { x: 0, z: -22, r: 8 },
      { x: 0, z: 22, r: 8 },
    ];
    grassPatches.forEach(patch => {
      const grass = new THREE.Mesh(new THREE.CircleGeometry(patch.r, 16), grassMaterial);
      grass.rotation.x = -Math.PI / 2;
      grass.position.set(patch.x, 0.01, patch.z);
      scene.add(grass);
    });
    
    // === PATHS ===
    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
    
    // Main north-south path
    const path1 = new THREE.Mesh(new THREE.PlaneGeometry(4, 180), pathMaterial);
    path1.rotation.x = -Math.PI / 2;
    path1.position.y = 0.025;
    scene.add(path1);
    
    // Main east-west path
    const path2 = new THREE.Mesh(new THREE.PlaneGeometry(180, 4), pathMaterial);
    path2.rotation.x = -Math.PI / 2;
    path2.position.y = 0.025;
    scene.add(path2);
    
    // Diagonal paths for natural feel
    const createDiagonalPath = (x1, z1, x2, z2, width = 2.5) => {
      const length = Math.sqrt((x2-x1)**2 + (z2-z1)**2);
      const angle = Math.atan2(z2-z1, x2-x1);
      const path = new THREE.Mesh(new THREE.PlaneGeometry(length, width), pathMaterial);
      path.rotation.x = -Math.PI / 2;
      path.rotation.z = -angle;
      path.position.set((x1+x2)/2, 0.022, (z1+z2)/2);
      scene.add(path);
    };
    
    // Connect market areas with diagonal paths
    createDiagonalPath(0, 0, 15, 12);
    createDiagonalPath(0, 0, -15, -12);
    createDiagonalPath(0, 0, -18, 8);
    createDiagonalPath(0, 0, 18, -8);
    
    // === CENTRAL FOUNTAIN (Focal Point) ===
    const createFountain = (x, z) => {
      const fountainGroup = new THREE.Group();
      
      // Base pool (smaller, no circle)
      const poolMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.7 });
      const poolBase = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 5), poolMaterial);
      poolBase.position.y = 0.25;
      poolBase.castShadow = true;
      fountainGroup.add(poolBase);
      
      // Water surface
      const waterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4169E1, 
        transparent: true, 
        opacity: 0.7,
        roughness: 0.1
      });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), waterMaterial);
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.48;
      fountainGroup.add(water);
      
      // Center pillar
      const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x708090, roughness: 0.5 });
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2.5, 16), pillarMaterial);
      pillar.position.y = 1.5;
      pillar.castShadow = true;
      fountainGroup.add(pillar);
      
      // Top basin
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.3, 16), pillarMaterial);
      basin.position.y = 2.8;
      basin.castShadow = true;
      fountainGroup.add(basin);
      
      // Decorative spout
      const spoutMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x87CEEB, 
        emissive: 0x4169E1,
        emissiveIntensity: 0.3
      });
      const spout = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), spoutMaterial);
      spout.position.y = 3.1;
      fountainGroup.add(spout);
      
      fountainGroup.position.set(x, 0, z);
      scene.add(fountainGroup);
      return fountainGroup;
    };
    
    createFountain(0, 8); // Central fountain (moved north so player doesn't spawn inside)
    
    // === MARKET STALLS ===
    const createMarketStall = (x, z, rotation = 0, canopyColor = 0xDC143C, goods = true) => {
      const stallGroup = new THREE.Group();
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
      
      // Counter
      const counter = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 1.4), woodMaterial);
      counter.position.y = 1;
      counter.castShadow = true;
      stallGroup.add(counter);
      
      // Legs
      const legGeometry = new THREE.BoxGeometry(0.12, 1, 0.12);
      [[-1.2, 0.55], [1.2, 0.55], [-1.2, -0.55], [1.2, -0.55]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeometry, woodMaterial);
        leg.position.set(lx, 0.5, lz);
        stallGroup.add(leg);
      });
      
      // Back panel
      const backPanel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.5, 0.08), woodMaterial);
      backPanel.position.set(0, 1.75, -0.65);
      stallGroup.add(backPanel);
      
      // Canopy
      const canopyMaterial = new THREE.MeshStandardMaterial({ 
        color: canopyColor, 
        roughness: 0.8,
        side: THREE.DoubleSide 
      });
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 2.2), canopyMaterial);
      canopy.position.set(0, 2.5, 0.3);
      canopy.rotation.x = 0.12;
      canopy.castShadow = true;
      stallGroup.add(canopy);
      
      // Support poles
      const poleGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
      [[-1.3, -0.55], [1.3, -0.55]].forEach(([px, pz]) => {
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(px, 1.8, pz);
        stallGroup.add(pole);
      });
      
      // Goods on display
      if (goods) {
        const itemColors = [0xFFD700, 0xFF6347, 0x32CD32, 0x9370DB, 0xFFA500];
        for (let i = 0; i < 5; i++) {
          const item = new THREE.Mesh(
            new THREE.BoxGeometry(0.35 + Math.random() * 0.15, 0.3 + Math.random() * 0.2, 0.35),
            new THREE.MeshStandardMaterial({ color: itemColors[i % itemColors.length] })
          );
          item.position.set(-1 + i * 0.5 + (Math.random() - 0.5) * 0.2, 1.25, 0.3);
          item.rotation.y = Math.random() * 0.3;
          item.castShadow = true;
          stallGroup.add(item);
        }
      }
      
      stallGroup.position.set(x, 0, z);
      stallGroup.rotation.y = rotation;
      scene.add(stallGroup);
      return stallGroup;
    };
    
    // === PROPS (Crates, Barrels, Sacks) ===
    const createCrate = (x, z, scale = 1, rotation = 0) => {
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.7 * scale, 0.8 * scale), woodMaterial);
      crate.position.set(x, 0.35 * scale, z);
      crate.rotation.y = rotation;
      crate.castShadow = true;
      scene.add(crate);
      return crate;
    };
    
    const createBarrel = (x, z, scale = 1) => {
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 });
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * scale, 0.4 * scale, 1 * scale, 12), woodMaterial);
      barrel.position.set(x, 0.5 * scale, z);
      barrel.castShadow = true;
      scene.add(barrel);
      
      // Metal bands
      const bandMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.6 });
      [0.3, 0.7].forEach(h => {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.38 * scale, 0.03, 8, 16), bandMaterial);
        band.rotation.x = Math.PI / 2;
        band.position.set(x, h * scale, z);
        scene.add(band);
      });
      return barrel;
    };
    
    const createSack = (x, z, scale = 1) => {
      const sackMaterial = new THREE.MeshStandardMaterial({ color: 0xDAA520, roughness: 0.95 });
      const sack = new THREE.Mesh(new THREE.SphereGeometry(0.35 * scale, 8, 8), sackMaterial);
      sack.scale.set(1, 0.8, 1);
      sack.position.set(x, 0.28 * scale, z);
      sack.castShadow = true;
      scene.add(sack);
      return sack;
    };
    
    const createCart = (x, z, rotation = 0) => {
      const cartGroup = new THREE.Group();
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
      
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.2), woodMaterial);
      body.position.y = 0.85;
      body.castShadow = true;
      cartGroup.add(body);
      
      // Wheels
      const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
      const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.12, 16);
      [[-0.9, 0.65], [-0.9, -0.65], [0.9, 0.65], [0.9, -0.65]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.35, wz);
        cartGroup.add(wheel);
      });
      
      // Handle
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), woodMaterial);
      handle.rotation.z = Math.PI / 4;
      handle.position.set(-1.4, 1, 0);
      cartGroup.add(handle);
      
      // Goods
      const hay = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.5, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xDAA520 })
      );
      hay.position.y = 1.35;
      cartGroup.add(hay);
      
      cartGroup.position.set(x, 0, z);
      cartGroup.rotation.y = rotation;
      scene.add(cartGroup);
      return cartGroup;
    };
    
    // === TRAINING AREA ===
    const createTrainingDummy = (x, z, rotation = 0) => {
      const dummyGroup = new THREE.Group();
      
      // Post
      const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 8), postMaterial);
      post.position.y = 1.1;
      post.castShadow = true;
      dummyGroup.add(post);
      
      // Body (straw)
      const strawMaterial = new THREE.MeshStandardMaterial({ color: 0xDAA520 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.9, 8), strawMaterial);
      body.position.y = 1.55;
      body.castShadow = true;
      dummyGroup.add(body);
      
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), strawMaterial);
      head.position.y = 2.2;
      head.castShadow = true;
      dummyGroup.add(head);
      
      // Arms
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), strawMaterial);
      arm.rotation.z = Math.PI / 2;
      arm.position.y = 1.6;
      dummyGroup.add(arm);
      
      // Target (red circle on chest)
      const targetMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
      const target = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), targetMaterial);
      target.position.set(0, 1.5, 0.31);
      dummyGroup.add(target);
      
      dummyGroup.position.set(x, 0, z);
      dummyGroup.rotation.y = rotation;
      scene.add(dummyGroup);
      return dummyGroup;
    };
    
    const createWeaponRack = (x, z, rotation = 0) => {
      const rackGroup = new THREE.Group();
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
      
      // Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.3), woodMaterial);
      frame.position.y = 1.5;
      rackGroup.add(frame);
      
      // Posts
      const postGeometry = new THREE.BoxGeometry(0.1, 1.8, 0.1);
      [[-0.9, 0], [0.9, 0]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(postGeometry, woodMaterial);
        post.position.set(px, 0.9, pz);
        rackGroup.add(post);
      });
      
      // Weapons (swords)
      const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 0.8 });
      for (let i = 0; i < 3; i++) {
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.03), metalMaterial);
        sword.position.set(-0.5 + i * 0.5, 1.2, 0.1);
        sword.rotation.z = 0.1 - i * 0.1;
        rackGroup.add(sword);
      }
      
      rackGroup.position.set(x, 0, z);
      rackGroup.rotation.y = rotation;
      scene.add(rackGroup);
      return rackGroup;
    };
    
    // === SMALL HOUSES/HUTS ===
    const createSmallHouse = (x, z, rotation = 0, color = 0x8B4513) => {
      const houseGroup = new THREE.Group();
      
      // Walls
      const wallMaterial = new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 });
      const walls = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 3.5), wallMaterial);
      walls.position.y = 1.25;
      walls.castShadow = true;
      houseGroup.add(walls);
      
      // Roof
      const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
      const roofGeometry = new THREE.ConeGeometry(3.5, 1.5, 4);
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 3.25;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      houseGroup.add(roof);
      
      // Door
      const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.1), doorMaterial);
      door.position.set(0, 0.9, 1.76);
      houseGroup.add(door);
      
      // Window
      const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x87CEEB, emissive: 0x4169E1, emissiveIntensity: 0.2 });
      const window1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.1), windowMaterial);
      window1.position.set(1.2, 1.5, 1.76);
      houseGroup.add(window1);
      
      houseGroup.position.set(x, 0, z);
      houseGroup.rotation.y = rotation;
      scene.add(houseGroup);
      return houseGroup;
    };
    
    // === AMBIENT NPC (Non-interactive villagers) ===
    const createAmbientNPC = (x, z, color = 0x8B4513, name = 'Villager') => {
      const npcGroup = new THREE.Group();
      npcGroup.name = name;
      npcGroup.userData = { type: 'ambient', name, interactable: false };
      
      // Body
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 8, 16), bodyMaterial);
      body.position.y = 0.75;
      body.castShadow = true;
      npcGroup.add(body);
      
      // Head
      const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xDEB887 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMaterial);
      head.position.y = 1.35;
      head.castShadow = true;
      npcGroup.add(head);
      
      // Hair
      const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2314 });
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        hairMaterial
      );
      hair.position.y = 1.45;
      npcGroup.add(hair);
      
      const terrainY = getTerrainHeight(x, z);
      npcGroup.position.set(x, terrainY, z);
      npcGroup.rotation.y = Math.random() * Math.PI * 2;
      scene.add(npcGroup);
      return npcGroup;
    };
    
    // === PLACE ALL TOWN ELEMENTS ===
    
    // Market stalls (8 stalls in market area - east side)
    createMarketStall(12, 8, Math.PI * 0.5, 0xDC143C);      // Red canopy
    createMarketStall(12, 4, Math.PI * 0.5, 0x228B22);      // Green canopy
    createMarketStall(12, 0, Math.PI * 0.5, 0x4169E1);      // Blue canopy
    createMarketStall(12, -4, Math.PI * 0.5, 0xFFD700);     // Gold canopy
    createMarketStall(-12, 6, -Math.PI * 0.5, 0x9370DB);    // Purple canopy (west)
    createMarketStall(-12, 2, -Math.PI * 0.5, 0xFF8C00);    // Orange canopy
    createMarketStall(6, 14, Math.PI, 0xDC143C);            // North market
    createMarketStall(-6, 14, Math.PI, 0x228B22);           // North market
    
    // Props scattered around market
    // East market props
    createCrate(14, 10, 1, 0.2);
    createCrate(14.5, 9.5, 0.8, -0.3);
    createBarrel(15, 8);
    createBarrel(14, 6, 0.9);
    createSack(13.5, 5);
    createSack(14, 4.5, 0.8);
    createCrate(14, 2, 1.1, 0.4);
    createBarrel(15, 0);
    createSack(14.5, -2);
    createCrate(14, -3, 0.9, -0.2);
    createBarrel(15, -4);
    
    // West market props  
    createBarrel(-14, 7);
    createCrate(-15, 6, 1, 0.3);
    createSack(-14, 4);
    createCrate(-14.5, 3, 0.8, -0.1);
    createBarrel(-15, 1);
    
    // North market props
    createCrate(8, 16, 1, 0.2);
    createBarrel(5, 16);
    createSack(-5, 15.5);
    createCrate(-8, 16, 0.9, -0.2);
    
    // Carts around town
    createCart(8, -6, 0.3);
    createCart(-10, 10, -0.4);
    createCart(16, 12, Math.PI * 0.25);
    createCart(-8, -8, Math.PI * 0.7);
    
    // Training area (southwest)
    createTrainingDummy(-18, -10, 0.2);
    createTrainingDummy(-20, -12, -0.1);
    createTrainingDummy(-16, -12, 0.3);
    createTrainingDummy(-18, -14, 0);
    createWeaponRack(-22, -10, Math.PI * 0.5);
    createWeaponRack(-22, -14, Math.PI * 0.5);
    
    // Training area ground (dirt)
    const trainingGround = new THREE.Mesh(
      new THREE.CircleGeometry(8, 16),
      new THREE.MeshStandardMaterial({ color: 0x9B7653, roughness: 0.95 })
    );
    trainingGround.rotation.x = -Math.PI / 2;
    trainingGround.position.set(-18, 0.01, -12);
    scene.add(trainingGround);
    
    // Small houses/huts around the town (moved away from market areas)
    createSmallHouse(-28, 20, Math.PI * 0.1, 0x8B4513);
    createSmallHouse(-30, 6, Math.PI * 0.15, 0x9B7653);
    createSmallHouse(28, 20, -Math.PI * 0.1, 0x8B4513);
    createSmallHouse(30, 6, -Math.PI * 0.2, 0xA0522D);
    createSmallHouse(28, -10, Math.PI * 0.9, 0x9B7653);
    createSmallHouse(-28, -10, -Math.PI * 0.8, 0x8B4513);
    
    // Benches around fountain
    const createBench = (x, z, rotation = 0) => {
      const benchGroup = new THREE.Group();
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
      
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.5), woodMaterial);
      seat.position.y = 0.5;
      benchGroup.add(seat);
      
      const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.4);
      [[-0.6, 0], [0.6, 0]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeometry, woodMaterial);
        leg.position.set(lx, 0.25, lz);
        benchGroup.add(leg);
      });
      
      benchGroup.position.set(x, 0, z);
      benchGroup.rotation.y = rotation;
      scene.add(benchGroup);
      return benchGroup;
    };
    
    createBench(5, 5, Math.PI * 0.25);
    createBench(-5, 5, -Math.PI * 0.25);
    createBench(5, -5, -Math.PI * 0.25);
    createBench(-5, -5, Math.PI * 0.25);
    
    // Ambient NPCs (non-interactive villagers for atmosphere)
    createAmbientNPC(6, 10, 0x4169E1, 'Farmer');
    createAmbientNPC(-4, 8, 0x8B0000, 'Townsperson');
    createAmbientNPC(10, -2, 0x228B22, 'Merchant Helper');
    createAmbientNPC(-8, 12, 0x9370DB, 'Elder');
    createAmbientNPC(15, 14, 0xDAA520, 'Worker');
    createAmbientNPC(-15, -6, 0x4a5568, 'Guard');
    
    // ==================== DARK CASTLE (Enemy Area) ====================
    // A castle far from the village with enemies inside
    
    const CASTLE_X = 80;
    const CASTLE_Z = -60;
    
    const createCastle = (x, z) => {
      const castleGroup = new THREE.Group();
      
      // Castle materials
      const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });
      const darkStoneMaterial = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.85 });
      const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7 });
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 });
      
      // Castle ground/foundation
      const foundation = new THREE.Mesh(
        new THREE.CylinderGeometry(25, 28, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.95 })
      );
      foundation.position.y = 0.5;
      castleGroup.add(foundation);
      
      // Main keep (central tower)
      const mainKeep = new THREE.Mesh(new THREE.BoxGeometry(12, 18, 12), stoneMaterial);
      mainKeep.position.y = 9;
      mainKeep.castShadow = true;
      castleGroup.add(mainKeep);
      
      // Main keep roof
      const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(9, 6, 4), roofMaterial);
      mainRoof.position.y = 21;
      mainRoof.rotation.y = Math.PI / 4;
      mainRoof.castShadow = true;
      castleGroup.add(mainRoof);
      
      // Corner towers (4)
      const towerPositions = [
        [-18, -18], [18, -18], [-18, 18], [18, 18]
      ];
      
      towerPositions.forEach(([tx, tz]) => {
        // Tower base
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.5, 15, 8), stoneMaterial);
        tower.position.set(tx, 7.5, tz);
        tower.castShadow = true;
        castleGroup.add(tower);
        
        // Tower roof
        const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(5, 4, 8), roofMaterial);
        towerRoof.position.set(tx, 17, tz);
        towerRoof.castShadow = true;
        castleGroup.add(towerRoof);
        
        // Tower battlements
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const battlement = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2, 0.8),
            darkStoneMaterial
          );
          battlement.position.set(
            tx + Math.cos(angle) * 4,
            15.5,
            tz + Math.sin(angle) * 4
          );
          battlement.rotation.y = angle;
          castleGroup.add(battlement);
        }
      });
      
      // Walls connecting towers
      const wallPositions = [
        { x: 0, z: -18, rx: 0, length: 32 },
        { x: 0, z: 18, rx: 0, length: 32 },
        { x: -18, z: 0, rx: Math.PI / 2, length: 32 },
        { x: 18, z: 0, rx: Math.PI / 2, length: 32 },
      ];
      
      wallPositions.forEach(({ x: wx, z: wz, rx, length }) => {
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(length, 8, 2),
          stoneMaterial
        );
        wall.position.set(wx, 4, wz);
        wall.rotation.y = rx;
        wall.castShadow = true;
        castleGroup.add(wall);
        
        // Wall top walkway
        const walkway = new THREE.Mesh(
          new THREE.BoxGeometry(length, 0.5, 3),
          darkStoneMaterial
        );
        walkway.position.set(wx, 8.25, wz);
        walkway.rotation.y = rx;
        castleGroup.add(walkway);
      });
      
      // Castle gate
      const gateFrame = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 3), darkStoneMaterial);
      gateFrame.position.set(0, 4, -19);
      castleGroup.add(gateFrame);
      
      // Gate opening (dark)
      const gateOpening = new THREE.Mesh(
        new THREE.BoxGeometry(4, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
      );
      gateOpening.position.set(0, 3, -19);
      castleGroup.add(gateOpening);
      
      // Gate arch
      const gateArch = new THREE.Mesh(
        new THREE.TorusGeometry(2, 0.5, 8, 16, Math.PI),
        darkStoneMaterial
      );
      gateArch.position.set(0, 6, -18);
      gateArch.rotation.x = Math.PI / 2;
      castleGroup.add(gateArch);
      
      // Torches at gate
      const torchMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFF4500, 
        emissive: 0xFF4500, 
        emissiveIntensity: 0.8 
      });
      [[-3.5, -17], [3.5, -17]].forEach(([ttx, ttz]) => {
        const torchHolder = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8),
          woodMaterial
        );
        torchHolder.position.set(ttx, 5, ttz);
        castleGroup.add(torchHolder);
        
        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 8),
          torchMaterial
        );
        flame.position.set(ttx, 6, ttz);
        castleGroup.add(flame);
      });
      
      // Inner courtyard (darker ground)
      const courtyard = new THREE.Mesh(
        new THREE.CircleGeometry(15, 16),
        new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.95 })
      );
      courtyard.rotation.x = -Math.PI / 2;
      courtyard.position.y = 1.02;
      castleGroup.add(courtyard);
      
      // Banners on main keep
      const bannerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B0000, 
        side: THREE.DoubleSide 
      });
      [[6.1, 12, 0], [-6.1, 12, 0], [0, 12, 6.1], [0, 12, -6.1]].forEach(([bx, by, bz]) => {
        const banner = new THREE.Mesh(new THREE.PlaneGeometry(2, 4), bannerMaterial);
        banner.position.set(bx, by, bz);
        if (bx !== 0) banner.rotation.y = Math.PI / 2;
        castleGroup.add(banner);
      });
      
      castleGroup.position.set(x, 0, z);
      scene.add(castleGroup);
      return castleGroup;
    };
    
    // Create the castle
    createCastle(CASTLE_X, CASTLE_Z);
    
    // Path to castle
    const castlePathMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.95 });
    const castlePath = new THREE.Mesh(new THREE.PlaneGeometry(5, 100), castlePathMaterial);
    castlePath.rotation.x = -Math.PI / 2;
    castlePath.rotation.z = Math.atan2(CASTLE_Z, CASTLE_X);
    castlePath.position.set(CASTLE_X / 2 + 10, 0.02, CASTLE_Z / 2 - 5);
    scene.add(castlePath);
    
    // Spawn enemies inside the castle
    const castleEnemyPositions = [
      // Courtyard guards
      { x: CASTLE_X - 8, z: CASTLE_Z, type: 'skeleton', level: 3 },
      { x: CASTLE_X + 8, z: CASTLE_Z, type: 'skeleton', level: 3 },
      { x: CASTLE_X, z: CASTLE_Z - 8, type: 'skeleton', level: 4 },
      { x: CASTLE_X, z: CASTLE_Z + 8, type: 'skeleton', level: 4 },
      // Inner castle
      { x: CASTLE_X - 5, z: CASTLE_Z - 5, type: 'skeleton', level: 5 },
      { x: CASTLE_X + 5, z: CASTLE_Z - 5, type: 'skeleton', level: 5 },
      { x: CASTLE_X + 5, z: CASTLE_Z + 5, type: 'skeleton', level: 5 },
      { x: CASTLE_X - 5, z: CASTLE_Z + 5, type: 'skeleton', level: 5 },
      // Boss area (near main keep)
      { x: CASTLE_X, z: CASTLE_Z, type: 'demon', level: 8 },
    ];
    
    // Store castle enemies for later spawning
    castleEnemiesRef.current = castleEnemyPositions;
    
    // ==================== END DARK CASTLE ====================
    
    // ==================== END TOWN CENTER ====================
    
    // Create Player Character (more detailed)
    // Create player group container (model will be loaded into this)
    const playerGroup = new THREE.Group();
    playerGroup.name = 'player';
    
    // Selection circle under player (added immediately)
    const selectionCircle = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.55, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    selectionCircle.rotation.x = -Math.PI / 2;
    selectionCircle.position.y = 0.02;
    playerGroup.add(selectionCircle);
    
    // Add placeholder arm pivots for attack animation compatibility
    const leftArmPivot = new THREE.Group();
    leftArmPivot.name = 'leftArmPivot';
    leftArmPivot.position.set(-0.35, 1.2, 0);
    playerGroup.add(leftArmPivot);
    
    const rightArmPivot = new THREE.Group();
    rightArmPivot.name = 'rightArmPivot';
    rightArmPivot.position.set(0.35, 1.2, 0);
    playerGroup.add(rightArmPivot);
    
    scene.add(playerGroup);
    playerRef.current = playerGroup;
    
    // Create and add the animated humanoid using factory
    const humanoid = createPlayerMesh(character);
    playerGroup.add(humanoid);
    playerModelRef.current = humanoid;
    
    console.log('Custom animated humanoid created');
    
    // Restore player position from saved game state
    const startX = savedPosition.x || 0;
    const startZ = savedPosition.z || 0;
    const startY = getTerrainHeight(startX, startZ);
    playerGroup.position.set(startX, startY, startZ);
    
    // Mark if we started at a non-origin position
    if (startX !== 0 || startZ !== 0) {
      positionRestoredRef.current = true;
    }
    
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
      roof.receiveShadow = true;
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
    
    createBuilding(0, -25, 8, 6, 7, 0x8B0000, 'Town Hall', 'building');
    createBuilding(-25, 0, 5, 4, 5, 0x654321, 'Blacksmith', 'shop');
    createBuilding(25, 0, 5, 4, 5, 0x654321, 'General Store', 'shop');
    createBuilding(-22, -15, 6, 5, 5, 0x4a4a4a, 'Armory', 'shop');
    createBuilding(22, -15, 5, 4, 5, 0x8B4513, 'Inn', 'building');
    
    // ==================== GRAVEYARD AREA ====================
    const GRAVEYARD_CENTER = { x: -40, z: -40 };
    
    // Helper function to get actual terrain mesh height using raycasting
    const getActualTerrainHeight = (x, z) => {
      const terrainMesh = scene.getObjectByName('terrain');
      if (terrainMesh) {
        const rayOrigin = new THREE.Vector3(x, 100, z);
        const rayDirection = new THREE.Vector3(0, -1, 0);
        const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);
        const intersects = raycaster.intersectObject(terrainMesh);
        if (intersects.length > 0) {
          return intersects[0].point.y;
        }
      }
      // Fallback to formula-based height
      return getTerrainHeight(x, z);
    };
    
    // Create gravestone
    const createGravestone = (x, z, scale = 1, variant = 0) => {
      const stoneGroup = new THREE.Group();
      stoneGroup.userData = { type: 'gravestone', interactable: false };
      
      const stoneColor = 0x6b7280; // Gray stone
      const mossColor = 0x4a5d23;
      
      if (variant === 0) {
        // Classic rounded gravestone
        const baseGeom = new THREE.BoxGeometry(0.8 * scale, 0.15 * scale, 0.3 * scale);
        const baseMat = new THREE.MeshStandardMaterial({ color: stoneColor });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.075 * scale;
        stoneGroup.add(base);
        
        const stoneGeom = new THREE.BoxGeometry(0.6 * scale, 1.2 * scale, 0.15 * scale);
        const stone = new THREE.Mesh(stoneGeom, baseMat);
        stone.position.y = 0.75 * scale;
        stoneGroup.add(stone);
        
        // Rounded top
        const topGeom = new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 0.15 * scale, 16, 1, false, 0, Math.PI);
        const top = new THREE.Mesh(topGeom, baseMat);
        top.rotation.x = Math.PI / 2;
        top.rotation.z = Math.PI / 2;
        top.position.y = 1.35 * scale;
        stoneGroup.add(top);
      } else if (variant === 1) {
        // Cross gravestone
        const vertGeom = new THREE.BoxGeometry(0.15 * scale, 1.5 * scale, 0.1 * scale);
        const vertMat = new THREE.MeshStandardMaterial({ color: stoneColor });
        const vert = new THREE.Mesh(vertGeom, vertMat);
        vert.position.y = 0.75 * scale;
        stoneGroup.add(vert);
        
        const horizGeom = new THREE.BoxGeometry(0.8 * scale, 0.15 * scale, 0.1 * scale);
        const horiz = new THREE.Mesh(horizGeom, vertMat);
        horiz.position.y = 1.1 * scale;
        stoneGroup.add(horiz);
      } else {
        // Simple slab
        const slabGeom = new THREE.BoxGeometry(0.5 * scale, 0.8 * scale, 0.12 * scale);
        const slabMat = new THREE.MeshStandardMaterial({ color: stoneColor });
        const slab = new THREE.Mesh(slabGeom, slabMat);
        slab.position.y = 0.4 * scale;
        slab.rotation.x = -0.1; // Slight lean
        stoneGroup.add(slab);
      }
      
      // Add moss patches randomly
      if (Math.random() > 0.5) {
        const mossGeom = new THREE.SphereGeometry(0.08 * scale, 8, 8);
        const mossMat = new THREE.MeshStandardMaterial({ color: mossColor });
        const moss = new THREE.Mesh(mossGeom, mossMat);
        moss.position.set(0.15 * scale, 0.3 * scale, 0.08 * scale);
        moss.scale.y = 0.5;
        stoneGroup.add(moss);
      }
      
      const terrainY = getActualTerrainHeight(x, z);
      stoneGroup.position.set(x, terrainY, z);
      stoneGroup.rotation.y = Math.random() * 0.3 - 0.15; // Slight random rotation
      scene.add(stoneGroup);
      return stoneGroup;
    };
    
    // Create tomb/crypt
    const createTomb = (x, z, scale = 1) => {
      const tombGroup = new THREE.Group();
      tombGroup.userData = { type: 'tomb', interactable: false };
      
      const stoneColor = 0x4b5563;
      
      // Main sarcophagus
      const baseGeom = new THREE.BoxGeometry(3 * scale, 0.8 * scale, 1.5 * scale);
      const baseMat = new THREE.MeshStandardMaterial({ color: stoneColor });
      const base = new THREE.Mesh(baseGeom, baseMat);
      base.position.y = 0.4 * scale;
      base.castShadow = true;
      tombGroup.add(base);
      
      // Lid (slightly raised)
      const lidGeom = new THREE.BoxGeometry(3.1 * scale, 0.3 * scale, 1.6 * scale);
      const lidMat = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
      const lid = new THREE.Mesh(lidGeom, lidMat);
      lid.position.y = 0.95 * scale;
      lid.castShadow = true;
      tombGroup.add(lid);
      
      // Decorative trim
      const trimGeom = new THREE.BoxGeometry(3.2 * scale, 0.1 * scale, 1.7 * scale);
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x374151 });
      const trim = new THREE.Mesh(trimGeom, trimMat);
      trim.position.y = 0.8 * scale;
      tombGroup.add(trim);
      
      const terrainY = getActualTerrainHeight(x, z);
      tombGroup.position.set(x, terrainY, z);
      scene.add(tombGroup);
      return tombGroup;
    };
    
    // Create angel statue
    const createAngelStatue = (x, z, scale = 1) => {
      const statueGroup = new THREE.Group();
      statueGroup.userData = { type: 'statue', interactable: false, name: 'Spirit Healer' };
      
      const stoneColor = 0xd1d5db; // Light gray marble
      const wingColor = 0xe5e7eb;
      
      // Pedestal
      const pedestalGeom = new THREE.BoxGeometry(2 * scale, 1.5 * scale, 2 * scale);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
      const pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
      pedestal.position.y = 0.75 * scale;
      pedestal.castShadow = true;
      statueGroup.add(pedestal);
      
      // Body/robe
      const robeGeom = new THREE.ConeGeometry(0.6 * scale, 2 * scale, 8);
      const robeMat = new THREE.MeshStandardMaterial({ color: stoneColor });
      const robe = new THREE.Mesh(robeGeom, robeMat);
      robe.position.y = 2.5 * scale;
      robe.castShadow = true;
      statueGroup.add(robe);
      
      // Head
      const headGeom = new THREE.SphereGeometry(0.3 * scale, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({ color: stoneColor });
      const head = new THREE.Mesh(headGeom, headMat);
      head.position.y = 3.8 * scale;
      head.castShadow = true;
      statueGroup.add(head);
      
      // Halo
      const haloGeom = new THREE.TorusGeometry(0.4 * scale, 0.05 * scale, 8, 32);
      const haloMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.5 });
      const halo = new THREE.Mesh(haloGeom, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 4.3 * scale;
      statueGroup.add(halo);
      
      // Wings (left)
      const wingGeom = new THREE.BoxGeometry(0.1 * scale, 1.5 * scale, 1 * scale);
      const wingMat = new THREE.MeshStandardMaterial({ color: wingColor });
      const wingL = new THREE.Mesh(wingGeom, wingMat);
      wingL.position.set(-0.5 * scale, 3 * scale, 0);
      wingL.rotation.z = 0.3;
      wingL.rotation.y = -0.5;
      statueGroup.add(wingL);
      
      // Wings (right)
      const wingR = new THREE.Mesh(wingGeom, wingMat);
      wingR.position.set(0.5 * scale, 3 * scale, 0);
      wingR.rotation.z = -0.3;
      wingR.rotation.y = 0.5;
      statueGroup.add(wingR);
      
      // Glow effect at base
      const glowGeom = new THREE.CircleGeometry(3 * scale, 32);
      const glowMat = new THREE.MeshBasicMaterial({ 
        color: 0x60a5fa, 
        transparent: true, 
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(glowGeom, glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.05;
      statueGroup.add(glow);
      
      const terrainY = getActualTerrainHeight(x, z);
      statueGroup.position.set(x, terrainY, z);
      scene.add(statueGroup);
      return statueGroup;
    };
    
    // Create iron fence section
    const createFence = (x, z, rotation = 0, length = 4) => {
      const fenceGroup = new THREE.Group();
      const ironColor = 0x1f2937;
      
      // Horizontal bars
      const barGeom = new THREE.BoxGeometry(length, 0.08, 0.08);
      const barMat = new THREE.MeshStandardMaterial({ color: ironColor });
      const topBar = new THREE.Mesh(barGeom, barMat);
      topBar.position.y = 1.2;
      fenceGroup.add(topBar);
      const bottomBar = new THREE.Mesh(barGeom, barMat);
      bottomBar.position.y = 0.3;
      fenceGroup.add(bottomBar);
      
      // Vertical posts
      const numPosts = Math.floor(length / 0.5);
      for (let i = 0; i <= numPosts; i++) {
        const postGeom = new THREE.BoxGeometry(0.06, 1.4, 0.06);
        const post = new THREE.Mesh(postGeom, barMat);
        post.position.set(-length/2 + i * (length/numPosts), 0.7, 0);
        fenceGroup.add(post);
        
        // Pointed top
        if (i % 2 === 0) {
          const pointGeom = new THREE.ConeGeometry(0.05, 0.15, 4);
          const point = new THREE.Mesh(pointGeom, barMat);
          point.position.set(-length/2 + i * (length/numPosts), 1.45, 0);
          fenceGroup.add(point);
        }
      }
      
      const terrainY = getActualTerrainHeight(x, z);
      fenceGroup.position.set(x, terrainY, z);
      fenceGroup.rotation.y = rotation;
      scene.add(fenceGroup);
      return fenceGroup;
    };
    
    // Build the graveyard
    // Central angel statue (spirit healer location)
    createAngelStatue(GRAVEYARD_CENTER.x, GRAVEYARD_CENTER.z, 1.2);
    
    // Tombs
    createTomb(GRAVEYARD_CENTER.x - 8, GRAVEYARD_CENTER.z + 5, 0.8);
    createTomb(GRAVEYARD_CENTER.x + 8, GRAVEYARD_CENTER.z + 5, 0.8);
    createTomb(GRAVEYARD_CENTER.x, GRAVEYARD_CENTER.z - 10, 1);
    
    // Gravestones in rows
    const gravestonePositions = [
      [-6, -3], [-4, -3], [-2, -3], [2, -3], [4, -3], [6, -3],
      [-6, -6], [-4, -6], [-2, -6], [2, -6], [4, -6], [6, -6],
      [-5, 8], [-3, 8], [3, 8], [5, 8],
      [-7, 10], [-5, 10], [-3, 10], [3, 10], [5, 10], [7, 10],
    ];
    gravestonePositions.forEach(([offsetX, offsetZ], i) => {
      createGravestone(
        GRAVEYARD_CENTER.x + offsetX, 
        GRAVEYARD_CENTER.z + offsetZ, 
        0.7 + Math.random() * 0.4,
        i % 3
      );
    });
    
    // Iron fencing around graveyard
    createFence(GRAVEYARD_CENTER.x, GRAVEYARD_CENTER.z + 15, 0, 20); // North
    createFence(GRAVEYARD_CENTER.x, GRAVEYARD_CENTER.z - 15, 0, 20); // South
    createFence(GRAVEYARD_CENTER.x + 10, GRAVEYARD_CENTER.z, Math.PI/2, 30); // East
    createFence(GRAVEYARD_CENTER.x - 10, GRAVEYARD_CENTER.z, Math.PI/2, 30); // West
    
    // Barren trees for graveyard atmosphere
    const createGraveyardTree = (x, z, scale = 1) => {
      const treeGroup = new THREE.Group();
      const woodColor = 0x3d3d3d;
      
      // Trunk
      const trunkGeom = new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 3 * scale, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: woodColor });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 1.5 * scale;
      treeGroup.add(trunk);
      
      // Branches
      const branchGeom = new THREE.CylinderGeometry(0.03 * scale, 0.08 * scale, 1.5 * scale, 5);
      const branch1 = new THREE.Mesh(branchGeom, trunkMat);
      branch1.position.set(0.3 * scale, 2.5 * scale, 0);
      branch1.rotation.z = -0.8;
      treeGroup.add(branch1);
      
      const branch2 = new THREE.Mesh(branchGeom, trunkMat);
      branch2.position.set(-0.3 * scale, 2.2 * scale, 0.2 * scale);
      branch2.rotation.z = 0.6;
      branch2.rotation.x = 0.3;
      treeGroup.add(branch2);
      
      const terrainY = getActualTerrainHeight(x, z);
      treeGroup.position.set(x, terrainY, z);
      scene.add(treeGroup);
      return treeGroup;
    };
    
    // Dead trees around graveyard
    const graveyardTrees = [
      createGraveyardTree(GRAVEYARD_CENTER.x - 12, GRAVEYARD_CENTER.z - 8, 1.2),
      createGraveyardTree(GRAVEYARD_CENTER.x + 12, GRAVEYARD_CENTER.z - 8, 1),
      createGraveyardTree(GRAVEYARD_CENTER.x - 8, GRAVEYARD_CENTER.z + 12, 0.9),
      createGraveyardTree(GRAVEYARD_CENTER.x + 8, GRAVEYARD_CENTER.z + 12, 1.1)
    ];
    
    // Reposition all graveyard objects after terrain loads (async terrain fetch)
    setTimeout(() => {
      const repositionToTerrain = (obj) => {
        if (!obj) return;
        const y = getActualTerrainHeight(obj.position.x, obj.position.z);
        obj.position.y = y;
      };
      
      // Find and reposition all graveyard objects
      scene.traverse((child) => {
        if (child.userData && (
          child.userData.type === 'gravestone' || 
          child.userData.type === 'tomb' || 
          child.userData.type === 'statue'
        )) {
          repositionToTerrain(child);
        }
      });
      
      // Reposition fences and trees (they don't have userData.type)
      graveyardTrees.forEach(tree => repositionToTerrain(tree));
      
      // Find fences by checking if they're in graveyard area
      scene.children.forEach(child => {
        if (child.isGroup && 
            child.position.x >= GRAVEYARD_CENTER.x - 15 && 
            child.position.x <= GRAVEYARD_CENTER.x + 15 &&
            child.position.z >= GRAVEYARD_CENTER.z - 20 && 
            child.position.z <= GRAVEYARD_CENTER.z + 20) {
          // Check if it looks like a fence (has many children but no userData.type)
          if (child.children.length > 5 && !child.userData.type) {
            repositionToTerrain(child);
          }
        }
      });
    }, 1000); // Wait for terrain to load
    
    // ==================== END GRAVEYARD AREA ====================
    
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
      trunk.receiveShadow = true;
      treeGroup.add(trunk);
      
      const foliageGeometry = new THREE.ConeGeometry(1.8 * scale, 3 * scale, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 3.5 * scale;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      treeGroup.add(foliage);
      
      const foliage2 = new THREE.Mesh(
        new THREE.ConeGeometry(1.3 * scale, 2 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x2E8B2E })
      );
      foliage2.position.y = 5 * scale;
      foliage2.castShadow = true;
      foliage2.receiveShadow = true;
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
    
    // NPCs - Using factory functions from WorldAssetFactory
    const createNPC = (x, z, color, name, type = 'npc') => {
      const npcGroup = createNPCMesh({ name, type, color }, x, z, getTerrainHeight);
      scene.add(npcGroup);
      selectableObjects.current.push(npcGroup);
      return npcGroup;
    };
    
    // NOTE: Legacy hardcoded NPCs removed - use F1 World Builder to place NPCs
    // createNPC(4, 2, 0xfbbf24, 'Quest Giver', 'questgiver');
    // createNPC(-8, 6, 0xdc2626, 'Blacksmith NPC', 'vendor');
    // createNPC(8, 6, 0x22c55e, 'Merchant', 'vendor');
    // createNPC(-3, -5, 0x3b82f6, 'Guard', 'npc');
    // createNPC(3, -5, 0x3b82f6, 'Guard', 'npc');
    
    // Warrior Trainer NPC - Using factory function
    const createTrainer = (x, z, trainerClass) => {
      const name = `${trainerClass.charAt(0).toUpperCase() + trainerClass.slice(1)} Trainer`;
      const trainerGroup = createTrainerMesh(trainerClass, name, x, z, getTerrainHeight);
      scene.add(trainerGroup);
      selectableObjects.current.push(trainerGroup);
      return trainerGroup;
    };
    
    // NOTE: Legacy hardcoded Warrior Trainer removed - use F1 World Builder to place trainers
    // createTrainer(-8, -12, 'warrior');
    
    // ==================== MARKET NPCs CREATION ====================
    
    // VENDOR NPC Creator - Using factory function
    const createVendorNPC = (x, z, name = 'Merchant') => {
      const npcGroup = createVendorMesh(name, 'general', x, z, getTerrainHeight);
      scene.add(npcGroup);
      selectableObjects.current.push(npcGroup);
      return npcGroup;
    };
    
    // QUEST GIVER NPC Creator - Using factory function
    const createQuestGiverNPC = (x, z, name = 'Quest Giver', npcId = null) => {
      const npcGroup = createQuestGiverMesh(name, npcId, x, z, getTerrainHeight);
      scene.add(npcGroup);
      selectableObjects.current.push(npcGroup);
      return npcGroup;
    };
    
    // Place Market NPCs
    // 1. WARRIOR TRAINER - Using existing createTrainer function
    // Note: Trainer placement moved to use getTerrainHeight
    const trainerX = -18;
    const trainerZ = -8;
    const trainerTerrainY = getTerrainHeight(trainerX, trainerZ);
    const warriorTrainerNPC = createTrainer(trainerX, trainerZ, 'warrior');
    warriorTrainerNPC.position.y = trainerTerrainY;
    
    // 2. VENDOR NPC - At the main market stall area (east side)
    createVendorNPC(10, 6, 'Marcus the Merchant');
    
    // 3. QUEST GIVER NPC - Central location near fountain (easy to find)
    createQuestGiverNPC(4, 2, 'Elder Theron', 'elder_theron_1');
    
    // ==================== END MARKET NPCs ====================
    
    // Monsters with health bars
    const createMonster = (x, z, color, name, type = 'goblin', level = 1, id = null, maxHealth = null, damage = null) => {
      const monsterGroup = new THREE.Group();
      monsterGroup.name = name;
      
      // Get max HP based on monster type or use provided value
      const defaultMaxHp = type === 'troll' ? 100 : type === 'wolf' ? 35 : 20;
      const maxHp = maxHealth || defaultMaxHp;
      const monsterId = id || `${type}_${x}_${z}_${Date.now()}`;
      
      monsterGroup.userData = { 
        type: 'monster', 
        monsterType: type, 
        name, 
        level, 
        interactable: true, 
        hostile: true,
        maxHp: maxHp,
        currentHp: maxHp,
        damage: damage || (type === 'troll' ? 15 : type === 'wolf' ? 8 : 5),
        monsterId: monsterId,
        enemyId: monsterId // For placed enemies reference
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
    
    // NOTE: Legacy hardcoded monsters removed - use F3 Enemy Editor to place enemies
    // Goblin camp
    // createMonster(-30, 25, 0x4a7c23, 'Goblin Scout', 'goblin', 2);
    // createMonster(-35, 28, 0x4a7c23, 'Goblin', 'goblin', 1);
    // createMonster(-28, 30, 0x4a7c23, 'Goblin Warrior', 'goblin', 3);
    // createMonster(-33, 22, 0x3d6b1a, 'Goblin Shaman', 'goblin', 5);
    
    // ==================== CASTLE ENEMIES ====================
    // Spawn enemies inside the dark castle (uses CASTLE_X and CASTLE_Z from castle creation)
    
    // Courtyard skeleton guards
    createMonster(CASTLE_X - 10, CASTLE_Z, 0xd4d4d4, 'Castle Guard', 'skeleton', 3);
    createMonster(CASTLE_X + 10, CASTLE_Z, 0xd4d4d4, 'Castle Guard', 'skeleton', 3);
    createMonster(CASTLE_X, CASTLE_Z - 10, 0xc4c4c4, 'Skeleton Warrior', 'skeleton', 4);
    createMonster(CASTLE_X, CASTLE_Z + 10, 0xc4c4c4, 'Skeleton Warrior', 'skeleton', 4);
    
    // Inner castle elite guards
    createMonster(CASTLE_X - 6, CASTLE_Z - 6, 0xb4b4b4, 'Elite Skeleton', 'skeleton', 5);
    createMonster(CASTLE_X + 6, CASTLE_Z - 6, 0xb4b4b4, 'Elite Skeleton', 'skeleton', 5);
    createMonster(CASTLE_X + 6, CASTLE_Z + 6, 0xb4b4b4, 'Elite Skeleton', 'skeleton', 5);
    createMonster(CASTLE_X - 6, CASTLE_Z + 6, 0xb4b4b4, 'Elite Skeleton', 'skeleton', 5);
    
    // Castle boss - near main keep
    createMonster(CASTLE_X, CASTLE_Z, 0x8B0000, 'Castle Lord', 'demon', 10);
    
    // Additional enemies patrolling near castle entrance
    createMonster(CASTLE_X - 5, CASTLE_Z - 22, 0xa4a4a4, 'Gate Warden', 'skeleton', 6);
    createMonster(CASTLE_X + 5, CASTLE_Z - 22, 0xa4a4a4, 'Gate Warden', 'skeleton', 6);
    // ==================== END CASTLE ENEMIES ====================
    
    // Wolf pack
    // createMonster(30, 25, 0x808080, 'Gray Wolf', 'wolf', 4);
    // createMonster(35, 22, 0x696969, 'Timber Wolf', 'wolf', 5);
    // createMonster(28, 28, 0x808080, 'Young Wolf', 'wolf', 2);
    
    // Troll near ruins
    // createMonster(40, -35, 0x556B2F, 'Forest Troll', 'troll', 10);
    
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
    
    // ==================== ASSET CREATION (uses WorldAssetFactory) ====================
    // Wrapper that creates an asset, positions it, adds to scene and selectableObjects
    const createAndPlaceWorldAsset = (x, z, fullType, scale = 1, name = '', level = 1) => {
      const group = createWorldAsset(fullType, scale, name, level);
      if (!group) return null;
      
      const terrainY = getTerrainHeight(x, z);
      group.position.set(x, terrainY, z);
      scene.add(group);
      
      if (group.userData.interactable || SELECTABLE_TYPES.includes(group.userData.type)) {
        selectableObjects.current.push(group);
      }
      
      return group;
    };
    
    // NOTE: Legacy hardcoded well removed - use F1 World Builder to place wells
    // wellGroup was at position (6, 0, 3)
    
    // ==================== LOAD SAVED WORLD OBJECTS ====================
    
    const loadSavedWorldObjects = async () => {
      try {
        const savedObjects = await fetchWorldObjects();
        
        if (savedObjects && savedObjects.length > 0) {
          savedObjects.forEach(obj => {
            const mesh = processLoadedWorldObject(obj, createAndPlaceWorldAsset);
            if (mesh) {
              editorObjectsRef.current.push(mesh);
            }
          });
          
          setPlacedObjects(savedObjects);
          placedObjectsRef.current = savedObjects;
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
          
          // Wait for createEnemyMeshRef to be available
          const waitForCreateEnemyMesh = () => {
            return new Promise((resolve) => {
              const check = () => {
                if (createEnemyMeshRef.current) {
                  resolve();
                } else {
                  setTimeout(check, 100);
                }
              };
              check();
            });
          };
          
          await waitForCreateEnemyMesh();
          
          data.enemies.forEach(enemy => {
            // Use saved color or derive from enemy type
            const color = enemy.color ? 
              (typeof enemy.color === 'string' ? parseInt(enemy.color.replace('#', ''), 16) : enemy.color) :
              (enemy.enemyType === 'goblin' ? 0x2d5016 :
               enemy.enemyType === 'wolf' ? 0x4a4a4a :
               enemy.enemyType === 'skeleton' ? 0xd4d4d4 :
               enemy.enemyType === 'troll' ? 0x3d5c3d : 0x6b7280);
            
            console.log('[Enemy Load] Loading enemy with patrolRadius:', enemy.patrolRadius, enemy);
            
            // Use createEnemyMesh for proper tracking and respawn support
            const enemyMesh = createEnemyMeshRef.current(
              enemy.x,
              enemy.z,
              {
                ...enemy,
                color: color,
                currentHealth: enemy.currentHealth || enemy.maxHealth,
                patrolRadius: enemy.patrolRadius || 5 // Ensure patrolRadius is set
              },
              enemy.id
            );
            
            if (enemyMesh && sceneRef.current) {
              sceneRef.current.add(enemyMesh);
              enemyMeshesRef.current.push(enemyMesh);
              selectableObjects.current.push(enemyMesh);
            }
            
            // Store spawn data for respawning
            enemySpawnDataRef.current.set(enemy.id, {
              ...enemy,
              color: color
            });
          });
          
          // Store full enemy data including all properties
          setPlacedEnemies(data.enemies.map(enemy => ({
            ...enemy,
            position: { x: enemy.x, y: enemy.y || 0, z: enemy.z }
          })));
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
    
    // NOTE: Legacy wolves in forest removed - use F3 Enemy Editor
    // createMonster(150, 20, 0x4a4a4a, 'Dark Wolf', 'wolf', 8);
    // createMonster(180, -30, 0x3a3a3a, 'Shadow Wolf', 'wolf', 10);
    // createMonster(200, 50, 0x4a4a4a, 'Alpha Wolf', 'wolf', 15);
    // createMonster(220, -10, 0x5a5a5a, 'Gray Wolf', 'wolf', 6);
    
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
    
    // NOTE: Legacy cave skeletons removed - use F3 Enemy Editor
    // createMonster(20, 150, 0xd4d4d4, 'Cave Skeleton', 'skeleton', 12);
    // createMonster(-30, 180, 0xc4c4c4, 'Ancient Skeleton', 'skeleton', 15);
    // createMonster(50, 200, 0xe4e4e4, 'Skeleton Warrior', 'skeleton', 18);
    
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
    
    // NOTE: Legacy trolls removed - use F3 Enemy Editor
    // createMonster(-160, 30, 0x556B2F, 'Desert Troll', 'troll', 20);
    // createMonster(-200, -20, 0x4a6b2f, 'Sand Troll', 'troll', 18);
    // createMonster(-240, 60, 0x667b3f, 'Elder Troll', 'troll', 25);
    
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
    
    // NOTE: Legacy ice wolves and yetis removed - use F3 Enemy Editor
    // createMonster(0, -150, 0xffffff, 'Frost Wolf', 'wolf', 12);
    // createMonster(-40, -200, 0xe8e8e8, 'Ice Wolf', 'wolf', 14);
    // createMonster(30, -180, 0xf0f0f0, 'Snow Wolf', 'wolf', 10);
    // createMonster(0, -250, 0xffffff, 'Yeti', 'troll', 30);
    
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
              
              // VENDOR INTERACTION - Right-click to open vendor panel
              if (targetObject.userData.type === 'vendor') {
                // Check distance to vendor (must be within 5 units)
                const dx = playerRef.current.position.x - targetObject.position.x;
                const dz = playerRef.current.position.z - targetObject.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance <= 5) {
                  // Get vendor type from userData or placedObjects
                  const editorId = targetObject.userData.editorId;
                  let vendorType = targetObject.userData.vendorType || 'vendor_general';
                  let vendorName = targetObject.name || 'Merchant';
                  
                  // Try to get more info from placedObjects
                  if (editorId) {
                    const vendorData = placedObjectsRef.current.find(obj => obj.id === editorId);
                    if (vendorData) {
                      vendorType = vendorData.fullType || vendorData.type || vendorType;
                      vendorName = vendorData.name || vendorName;
                    }
                  }
                  
                  setCurrentVendor({ type: vendorType, name: vendorName });
                  setIsVendorPanelOpen(true);
                  addNotification(`Trading with ${vendorName}`, 'info');
                } else {
                  addNotification('You are too far away to trade', 'error');
                }
                return;
              }
              
              // Select target and show indicator
              const isNewTarget = selectedTargetRef.current !== targetObject;
              setSelectedTarget(targetObject);
              targetIndicatorRef.current.visible = true;
              targetIndicatorRef.current.position.copy(targetObject.position);
              targetIndicatorRef.current.position.y = 0.05;
              
              // Set color and show notification based on target type (only for NEW targets)
              if (targetObject.userData.hostile) {
                targetIndicatorRef.current.material.color.setHex(0xff0000); // Red for hostile
                if (isNewTarget) addNotification(`Target: ${targetObject.userData?.name || targetObject.name || 'Enemy'} (Level ${targetObject.userData.level || '?'})`, 'info');
              } else if (targetObject.userData.type === 'trainer') {
                targetIndicatorRef.current.material.color.setHex(0xf59e0b); // Orange for trainers
                if (isNewTarget) addNotification(`${targetObject.name || 'Trainer'} - Double-click to train`, 'info');
              } else if (targetObject.userData.type === 'questgiver') {
                targetIndicatorRef.current.material.color.setHex(0xfbbf24); // Yellow for quest givers
                if (isNewTarget) addNotification(`${targetObject.name || 'Quest Giver'} selected`, 'info');
              } else if (targetObject.userData.type === 'vendor') {
                targetIndicatorRef.current.material.color.setHex(0x22c55e); // Green for vendors
                if (isNewTarget) addNotification(`${targetObject.name || 'Vendor'} selected`, 'info');
              } else if (targetObject.userData.type === 'npc' || targetObject.userData.type === 'guard') {
                targetIndicatorRef.current.material.color.setHex(0x3b82f6); // Blue for NPCs
                if (isNewTarget) addNotification(`${targetObject.name || 'NPC'} selected`, 'info');
              } else {
                targetIndicatorRef.current.material.color.setHex(0xffff00); // Default yellow
                if (isNewTarget) addNotification(`Selected: ${targetObject.name || targetObject.userData.type || 'Object'}`, 'info');
              }
              return;
            }
            targetObject = targetObject.parent;
          }
        }
        
        // No target found - start camera rotation mode (using CameraSystem)
        handleCameraMouseDown(e, cameraState.current);
        
      } else if (e.button === 0) { // Left click - Editor placement or deselect
        handleCameraMouseDown(e, cameraState.current);
        
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
                x: intersectPoint.x,
                y: 0,
                z: intersectPoint.z,
                position: { x: intersectPoint.x, y: 0, z: intersectPoint.z },
                zone: zone
              };
              
              // Store spawn data for respawning (IMPORTANT for enemy respawn system)
              const spawnData = {
                ...pendingEnemyPlacementRef.current,
                x: intersectPoint.x,
                y: 0,
                z: intersectPoint.z
              };
              enemySpawnDataRef.current.set(enemyId, spawnData);
              console.log('[Enemy Placement] Stored spawn data:', enemyId, spawnData);
              
              // AUTO-SAVE enemy to database immediately
              fetch(`${process.env.REACT_APP_BACKEND_URL}/api/world/enemies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEnemy)
              }).then(res => {
                if (res.ok) {
                  console.log('[Enemy Placement] Enemy saved to database:', enemyId);
                } else {
                  console.error('[Enemy Placement] Failed to save enemy to database');
                }
              }).catch(err => {
                console.error('[Enemy Placement] Error saving enemy:', err);
              });
              
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
          // Prevent double-placement from rapid clicks
          if (placementInProgressRef.current) {
            console.log('[NPC Placement] Placement already in progress, ignoring click');
            return;
          }
          placementInProgressRef.current = true;
          
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
              rotation: placement.rotation || 0, // Save rotation in degrees as simple number
              position: { x: intersectPoint.x, y: 0, z: intersectPoint.z },
              zone: zone
            };
            
            // Create visual object using comprehensive asset creator
            let mesh;
            const fullType = placement.fullType || placement.subType || placement.type;
            console.log('[NPC Placement] FullType for creation:', fullType);
            
            // Use createAndPlaceWorldAsset for all object types
            mesh = createAndPlaceWorldAsset(
              intersectPoint.x,
              intersectPoint.z,
              fullType,
              placement.scale,
              placement.name,
              placement.level
            );
            
            // Apply rotation to the mesh
            if (mesh && placement.rotation) {
              mesh.rotation.y = (placement.rotation * Math.PI) / 180; // Convert degrees to radians
            }
            
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
            // Reset placement guard after a short delay
            setTimeout(() => {
              placementInProgressRef.current = false;
            }, 100);
          } else {
            placementInProgressRef.current = false;
          }
          return;
        }
        
        // NPC SELECTION - Select NPC for quest assignment (works anytime, not just when Quest Maker is open)
        // Check if clicking on an NPC in editorObjectsRef
        const editorIntersects = raycasterRef.current.intersectObjects(editorObjectsRef.current, true);
        
        if (editorIntersects.length > 0) {
          let targetObject = editorIntersects[0].object;
          
          // Walk up to find the root group with editorId
          while (targetObject.parent && !targetObject.userData.editorId) {
            targetObject = targetObject.parent;
          }
          
          // Check if it's an NPC type (npc, trainer, questgiver, vendor, guard)
          const npcTypes = ['npc', 'trainer', 'questgiver', 'vendor', 'guard'];
          if (targetObject.userData && npcTypes.includes(targetObject.userData.type)) {
            const editorId = targetObject.userData.editorId;
            // Use ref to avoid stale closure issues
            const npcData = placedObjectsRef.current.find(obj => obj.id === editorId);
            
            if (npcData) {
              setSelectedNPCForQuest({
                id: npcData.id,
                name: npcData.name || 'Unknown NPC',
                type: npcData.fullType || npcData.type,
                position: npcData.position,
                quest_id: npcData.quest_id,
                quest_name: npcData.quest_name
              });
              addNotification(`Selected NPC: ${npcData.name || 'Unknown NPC'} (Press F7 for Quest Maker)`, 'info');
              return;
            }
          }
        }
        
        // Left click - check for target selection (same as right-click)
        const selectableIntersects = raycasterRef.current.intersectObjects(selectableObjects.current, true);
        
        if (selectableIntersects.length > 0) {
          // Find the root group with interactable flag
          let targetObject = selectableIntersects[0].object;
          
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
              const isNewTarget = selectedTargetRef.current !== targetObject;
              setSelectedTarget(targetObject);
              targetIndicatorRef.current.visible = true;
              targetIndicatorRef.current.position.copy(targetObject.position);
              targetIndicatorRef.current.position.y = 0.05;
              
              // Set color and notification based on target type (only for NEW targets)
              if (targetObject.userData.hostile) {
                targetIndicatorRef.current.material.color.setHex(0xff0000);
                if (isNewTarget) addNotification(`Target: ${targetObject.userData?.name || targetObject.name || 'Enemy'} (Level ${targetObject.userData.level || '?'})`, 'info');
                // Start auto-attacking hostile targets
                setIsAutoAttacking(true);
                enterCombat();
              } else if (targetObject.userData.type === 'trainer') {
                targetIndicatorRef.current.material.color.setHex(0xf59e0b); // Orange for trainers
                if (isNewTarget) addNotification(`${targetObject.name || 'Trainer'} - Double-click to train`, 'info');
              } else if (targetObject.userData.type === 'questgiver') {
                targetIndicatorRef.current.material.color.setHex(0xfbbf24);
                if (isNewTarget) addNotification(`${targetObject.name || 'Quest Giver'} selected`, 'info');
              } else if (targetObject.userData.type === 'vendor') {
                targetIndicatorRef.current.material.color.setHex(0x22c55e);
                if (isNewTarget) addNotification(`${targetObject.name || 'Vendor'} selected`, 'info');
              } else if (targetObject.userData.type === 'npc' || targetObject.userData.type === 'guard') {
                targetIndicatorRef.current.material.color.setHex(0x3b82f6);
                if (isNewTarget) addNotification(`${targetObject.name || 'NPC'} selected`, 'info');
              } else {
                targetIndicatorRef.current.material.color.setHex(0xffff00);
                if (isNewTarget) addNotification(`Selected: ${targetObject.name || targetObject.userData.type || 'Object'}`, 'info');
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
      // Camera mouse button handling (using CameraSystem)
      handleCameraMouseUp(e, cameraState.current);
      
      // Terrain editing state
      if (e.button === 0) {
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
      
      // Update preview mesh position when in placement mode
      if (previewMeshRef.current && pendingPlacementRef.current && terrainMeshRef.current) {
        const terrainIntersects = raycasterRef.current.intersectObject(terrainMeshRef.current);
        if (terrainIntersects.length > 0) {
          const point = terrainIntersects[0].point;
          const terrainHeight = getTerrainHeight(point.x, point.z);
          previewMeshRef.current.position.set(point.x, terrainHeight, point.z);
          previewMeshRef.current.visible = true;
        } else {
          previewMeshRef.current.visible = false;
        }
      }
      
      if (cameraState.current.isRightMouseDown) {
        // Camera rotation (using CameraSystem)
        handleCameraMouseMove(
          e, 
          cameraState.current, 
          isMapEditorModeRef.current, 
          mapEditorCameraState.current
        );
      }
    };
    
    const handleWheel = (e) => {
      // Camera zoom (using CameraSystem)
      handleCameraWheel(
        e,
        cameraState.current,
        isMapEditorModeRef.current,
        isFlightModeRef.current,
        mapEditorCameraState.current
      );
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
        // Check if trainer has a custom quest first
        const npcId = target.userData.editorId;
        if (npcId) {
          const npcData = placedObjectsRef.current.find(obj => obj.id === npcId);
          if (npcData && npcData.quest_id) {
            // Fetch and show the custom quest
            getQuestByNPC(npcId).then(quest => {
              setQuestGiverName(target.name || 'Trainer');
              setQuestGiverType('trainer');
              setQuestGiverId(npcId);
              setCurrentNPCQuest(quest);
              setIsQuestDialogOpen(true);
            }).catch(() => {
              // Fallback to trainer panel
              if (target.userData.trainerClass === 'warrior') {
                setIsTrainerOpen(true);
                addNotification(`Training with ${target.name}`, 'info');
              }
            });
            return;
          }
        }
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
        const npcId = target.userData.editorId || target.userData.id;
        setQuestGiverName(target.name || 'Quest Giver');
        setQuestGiverType('questgiver');
        setQuestGiverId(npcId || null);
        setCurrentNPCQuest(null); // Standard questgiver uses database quests
        setIsQuestDialogOpen(true);
      } else if (target && (target.userData.type === 'npc' || target.userData.type === 'guard' || target.userData.type === 'vendor')) {
        // Check if this NPC has a custom quest assigned
        const npcId = target.userData.editorId || target.userData.id;
        const objectData = target.userData.objectData;
        
        if (npcId) {
          // First check userData.objectData (set during loading), then fall back to ref
          const npcData = objectData || placedObjectsRef.current.find(obj => obj.id === npcId);
          
          if (npcData && (npcData.quest_id || npcData.global_quest_id)) {
            // This NPC has a quest assigned - open dialog
            setQuestGiverName(target.name || npcData.name || npcData.customName || 'NPC');
            setQuestGiverType(target.userData.type);
            setQuestGiverId(npcId);
            // Check for custom quest if quest_id is set
            if (npcData.quest_id) {
              getQuestByNPC(npcId).then(quest => {
                setCurrentNPCQuest(quest);
                setIsQuestDialogOpen(true);
              }).catch(() => {
                setCurrentNPCQuest(null);
                setIsQuestDialogOpen(true);
              });
            } else {
              setCurrentNPCQuest(null);
              setIsQuestDialogOpen(true);
            }
            return;
          }
        }
        // No custom quest - handle by type
        if (target.userData.type === 'vendor') {
          // Open vendor panel on double-click
          const vendorType = target.userData.vendorType || 'vendor_general';
          const vendorName = target.name || 'Merchant';
          setCurrentVendor({ type: vendorType, name: vendorName });
          setIsVendorPanelOpen(true);
          addNotification(`Trading with ${vendorName}`, 'info');
        } else {
          addNotification(`${target.name}: "Hello, adventurer!"`, 'info');
        }
      }
    };
    
    // Keyboard controls - using InputSystem
    const handleKeyDown = createKeyDownHandler({
      refs: {
        playerRef,
        targetIndicatorRef,
        selectableObjects,
        selectedTargetRef,
        movementState,
        isMapEditorModeRef,
        isFlightModeRef,
        mapEditorCameraState,
        damageTextsRef,
        monsterHealthBarsRef,
        scene,
      },
      stateRefs: {
        // Panel state refs for InputSystem to read current values
        isQuestDialogOpenRef,
        isQuestLogOpenRef,
        isTrainerOpenRef,
        isSpellBookOpenRef,
        isCharacterPanelOpenRef,
        isItemEditorOpenRef,
        isWorldMapOpenRef,
        isEditorOpenRef,
        isTerrainEditorOpenRef,
        isEnemyEditorOpenRef,
        openBagIndexRef,
        selectedEditObjectRef,
        selectedEditEnemyRef,
        actionBarSpellsRef,
        selectedTargetRef,
      },
      callbacks: {
        onSaveWorld: handleSaveWorld,
        setIsQuestDialogOpen,
        setIsQuestLogOpen,
        setIsTrainerOpen,
        setIsSpellBookOpen,
        setIsCharacterPanelOpen,
        setIsItemEditorOpen,
        setIsWorldMapOpen,
        setIsEditorOpen,
        setIsTerrainEditorOpen,
        setIsEnemyEditorOpen,
        setIsMapEditorMode,
        setIsFlightMode,
        setIsQuestMakerOpen,
        setOpenBagIndex,
        setSelectedTarget,
        setIsAutoAttacking,
        handleCastSpell,
        handleDeleteObject,
        handleDeleteEnemy,
        handlePlaceEnemy,
        attackMonster,
        createDamageText,
        setCombatLog,
        addNotification,
        targetIndicatorRef,
        selectableObjects,
      },
      systems: {
        handleMovementKeyDown,
        handleMovementKeyUp,
      },
      helpers: {
        getTerrainHeight,
      },
    });
    
    const handleKeyUp = createKeyUpHandler({
      refs: {
        movementState,
      },
      systems: {
        handleMovementKeyUp,
      },
    });
    
    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
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
      
      // Use centralized movement system
      let rotatedDirection = new THREE.Vector3();
      if (player) {
        const movementResult = updatePlayerMovement(
          player,
          movement,
          cam,
          sceneRef.current,
          delta,
          lastPlayerPos,
          {
            getTerrainHeight,
            isInWater,
            getWaterDepth,
            justTeleported: justTeleportedRef.current
          }
        );
        
        rotatedDirection = movementResult.rotatedDirection;
        
        // If position was reverted due to teleport detection, skip this frame
        if (movementResult.reverted) {
          return;
        }
        
        // ==================== PLAYER ANIMATION ====================
        // Update player animation based on movement state
        const animState = playerAnimationState.current;
        const playerModel = playerModelRef.current;
        
        if (animState && playerModel && playerModel.userData) {
          const isMoving = movementResult.moved;
          const isJumping = movement.isJumping || false;
          const { leftLegPivot, rightLegPivot, leftKneePivot, rightKneePivot, leftArmPivot, rightArmPivot, bodyGroup } = playerModel.userData;
          
          // Update animation time
          animState.animationTime += delta;
          
          if (isJumping) {
            // JUMP ANIMATION - legs tucked up with bent knees
            const targetThighAngle = -0.8; // Thighs rotate up (tucked)
            const targetKneeAngle = 1.8; // Knees bend sharply
            const targetArmAngle = -1.2; // Arms slightly raised
            const jumpBlend = 0.25;
            
            // Thighs tuck up
            if (leftLegPivot) leftLegPivot.rotation.x += (targetThighAngle - leftLegPivot.rotation.x) * jumpBlend;
            if (rightLegPivot) rightLegPivot.rotation.x += (targetThighAngle - rightLegPivot.rotation.x) * jumpBlend;
            
            // Knees bend sharply (like crouching in air)
            if (leftKneePivot) leftKneePivot.rotation.x += (targetKneeAngle - leftKneePivot.rotation.x) * jumpBlend;
            if (rightKneePivot) rightKneePivot.rotation.x += (targetKneeAngle - rightKneePivot.rotation.x) * jumpBlend;
            
            // Arms go out slightly
            if (leftArmPivot) leftArmPivot.rotation.x += (targetArmAngle - leftArmPivot.rotation.x) * jumpBlend;
            if (rightArmPivot) rightArmPivot.rotation.x += (targetArmAngle - rightArmPivot.rotation.x) * jumpBlend;
            
          } else if (isMoving) {
            // WALK ANIMATION
            const walkSpeed = 8; // Animation cycles per second
            const walkPhase = animState.animationTime * walkSpeed;
            
            // Leg swing amplitude (radians)
            const legSwing = 0.5;
            const kneeSwing = 0.7;
            const armSwing = 0.4;
            
            // Calculate phase for each leg (opposite phases)
            const leftPhase = Math.sin(walkPhase);
            const rightPhase = Math.sin(walkPhase + Math.PI);
            
            // Animate leg pivots (hip rotation)
            if (leftLegPivot) {
              leftLegPivot.rotation.x = leftPhase * legSwing;
            }
            if (rightLegPivot) {
              rightLegPivot.rotation.x = rightPhase * legSwing;
            }
            
            // Animate knee pivots (bend when leg swings back)
            if (leftKneePivot) {
              // Knee bends more when leg is swinging back
              const leftKneeBend = Math.max(0, -leftPhase) * kneeSwing;
              leftKneePivot.rotation.x = leftKneeBend;
            }
            if (rightKneePivot) {
              const rightKneeBend = Math.max(0, -rightPhase) * kneeSwing;
              rightKneePivot.rotation.x = rightKneeBend;
            }
            
            // Animate arms (opposite to legs for natural walk)
            if (leftArmPivot) {
              leftArmPivot.rotation.x = rightPhase * armSwing;
            }
            if (rightArmPivot) {
              rightArmPivot.rotation.x = leftPhase * armSwing;
            }
            
            // Subtle body bob
            playerModel.position.y = Math.abs(Math.sin(walkPhase * 2)) * 0.03;
            
          } else {
            // IDLE - smoothly return to standing position
            const returnSpeed = 0.15;
            
            if (leftLegPivot) leftLegPivot.rotation.x *= (1 - returnSpeed);
            if (rightLegPivot) rightLegPivot.rotation.x *= (1 - returnSpeed);
            if (leftKneePivot) leftKneePivot.rotation.x *= (1 - returnSpeed);
            if (rightKneePivot) rightKneePivot.rotation.x *= (1 - returnSpeed);
            if (leftArmPivot) leftArmPivot.rotation.x *= (1 - returnSpeed);
            if (rightArmPivot) rightArmPivot.rotation.x *= (1 - returnSpeed);
            
            // Subtle idle breathing
            const breathPhase = animState.animationTime * 1.5;
            playerModel.position.y = Math.sin(breathPhase) * 0.01;
          }
        }
        // ==================== END PLAYER ANIMATION ====================
      }
      
      if (player) {
        
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
            // Forward = W key - move in negative direction of camera rotation
            mapCam.x -= Math.sin(mapCam.rotationY) * moveSpeed;
            mapCam.z -= Math.cos(mapCam.rotationY) * moveSpeed;
          }
          if (movementState.current.backward) {
            // Backward = S key - move in positive direction of camera rotation
            mapCam.x += Math.sin(mapCam.rotationY) * moveSpeed;
            mapCam.z += Math.cos(mapCam.rotationY) * moveSpeed;
          }
          if (movementState.current.left) {
            // Left = A key - strafe left (perpendicular to forward)
            mapCam.x += Math.cos(mapCam.rotationY) * moveSpeed;
            mapCam.z -= Math.sin(mapCam.rotationY) * moveSpeed;
          }
          if (movementState.current.right) {
            // Right = D key - strafe right (perpendicular to forward)
            mapCam.x -= Math.cos(mapCam.rotationY) * moveSpeed;
            mapCam.z += Math.sin(mapCam.rotationY) * moveSpeed;
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
          // Normal Game Mode - WoW-style orbit camera (using CameraSystem)
          updateCamera(camera, player, cam);
          
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
        
        // ==================== ENEMY PATROL SYSTEM (using EnemyAISystem) ====================
        const patrolNow = Date.now();
        
        enemyMeshesRef.current.forEach(enemyMesh => {
          if (!enemyMesh || !enemyMesh.userData) return;
          
          // SKIP CORPSES - dead enemies don't patrol
          if (enemyMesh.userData.isCorpse) return;
          
          const enemyId = enemyMesh.userData.enemyId;
          const isInCombat = combatEngagedEnemiesRef.current.has(enemyId);
          
          // Initialize patrol data if not exists (using EnemyAISystem)
          if (!enemyPatrolDataRef.current[enemyId]) {
            enemyPatrolDataRef.current[enemyId] = createPatrolData(patrolNow);
          }
          
          const patrolData = enemyPatrolDataRef.current[enemyId];
          
          // If in combat - face player and stop patrol (using EnemyAISystem)
          if (isInCombat && player) {
            updateCombatFacing(enemyMesh, player, camera);
            return;
          }
          
          // Update patrol movement (using EnemyAISystem)
          updatePatrol(enemyMesh, patrolData, delta, patrolNow, getTerrainHeight, camera);
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
        
        // NPC Combat AI - Process each enemy (using EnemyAISystem)
        const combatNow = Date.now() / 1000;
        enemyMeshesRef.current.forEach(enemyMesh => {
          if (!enemyMesh || !enemyMesh.userData) return;
          if (!playerRef.current) return;
          if (enemyMesh.userData.isCorpse) return;
          
          const enemyId = enemyMesh.userData.enemyId;
          const player = playerRef.current;
          
          // Get or initialize combat state (using EnemyAISystem)
          let combatState = npcCombatStateRef.current.get(enemyId);
          if (!combatState) {
            combatState = createCombatState(enemyMesh);
            npcCombatStateRef.current.set(enemyId, combatState);
          }
          
          // PROXIMITY AGGRO (using EnemyAISystem)
          if (shouldAggro(enemyMesh, player, combatState, isDeadRef.current, isGhostRef.current)) {
            activateAggro(combatState, player, combatNow);
            combatEngagedEnemiesRef.current.add(enemyId);
            
            if (!combatState.notifiedAggro && addNotificationRef.current) {
              combatState.notifiedAggro = true;
              addNotificationRef.current(`${enemyMesh.userData.name} attacks you!`, 'warning');
            }
            if (enterCombatRef.current) {
              enterCombatRef.current();
            }
          }
          
          // If player dies or becomes ghost, drop aggro
          if (isDeadRef.current || isGhostRef.current) {
            if (combatState.inCombat) {
              combatState.inCombat = false;
              combatState.aggroTarget = null;
              combatState.notifiedAggro = false;
              combatEngagedEnemiesRef.current.delete(enemyId);
            }
          }
          
          // Skip further processing if not in combat
          if (!combatState.inCombat || !combatState.aggroTarget) return;
          
          // Check leash range (using EnemyAISystem)
          if (shouldLeash(enemyMesh, player, combatState)) {
            if (combatState.inCombat && !combatState.notifiedReset) {
              combatState.notifiedReset = true;
              if (selectedTargetRef.current === enemyMesh && addNotificationRef.current) {
                addNotificationRef.current(`${enemyMesh.userData.name} has reset!`, 'info');
              }
            }
            
            combatState.inCombat = false;
            combatState.aggroTarget = null;
            combatEngagedEnemiesRef.current.delete(enemyId);
            resetEnemyHealth(enemyMesh);
            
            // Move back to spawn (using EnemyAISystem)
            const reachedSpawn = moveToSpawn(enemyMesh, combatState, delta, getTerrainHeight);
            if (reachedSpawn) {
              combatState.notifiedReset = false;
              combatState.notifiedAggro = false;
            }
            
            return;
          }
          
          // Chase player / check melee range (using EnemyAISystem)
          const inMeleeRange = chasePlayer(enemyMesh, player, enemyId, delta, getTerrainHeight);
          
          if (inMeleeRange) {
            // In melee range - NPC attacks player (damage resolution stays in GameWorld)
            if (combatNow - combatState.lastAttack >= COMBAT_CONSTANTS.NPC_ATTACK_SPEED) {
              combatState.lastAttack = combatNow;
              
              const damage = calculateNpcAttackDamage(enemyMesh.userData.damage);
              setCurrentHealth(prev => Math.max(0, prev - damage));
              
              if (playerRef.current && sceneRef.current) {
                const dmgSprite = createDamageText(sceneRef.current, playerRef.current.position.clone(), damage, true);
                damageTextsRef.current.push(dmgSprite);
              }
              
              setCombatLog(prev => [...prev.slice(-9), {
                time: Date.now(),
                text: `${enemyMesh.userData.name} hits you for ${damage} damage!`
              }]);
              
              enterCombat();
            }
            
            // Maintain spread position while in melee (using EnemyAISystem)
            maintainSpreadPosition(enemyMesh, player, enemyId, delta, getTerrainHeight);
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
      
      // Update preview mesh for object placement
      const placement = pendingPlacementRef.current;
      if (placement) {
        // Check if we need to recreate preview (scale changed or doesn't exist)
        const needsRecreate = !previewMeshRef.current || 
          (previewMeshRef.current.userData.previewScale !== placement.scale);
        
        if (needsRecreate) {
          // Remove old preview if exists
          if (previewMeshRef.current) {
            scene.remove(previewMeshRef.current);
            previewMeshRef.current = null;
          }
          
          const fullType = placement.fullType || placement.type;
          const previewGroup = createWorldAsset(
            fullType,
            placement.scale || 1,
            placement.name,
            placement.level || 1
          );
          
          if (previewGroup) {
            // Store scale for comparison
            previewGroup.userData.previewScale = placement.scale || 1;
            
            // Make preview semi-transparent with green glow
            previewGroup.traverse((child) => {
              if (child.material) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.5;
                child.material.emissive = new THREE.Color(0x00ff00);
                child.material.emissiveIntensity = 0.3;
              }
            });
            
            previewGroup.position.y = -1000; // Start off screen
            scene.add(previewGroup);
            previewMeshRef.current = previewGroup;
          }
        }
        
        // Update rotation every frame (in case user adjusts slider)
        if (previewMeshRef.current && placement.rotation !== undefined) {
          previewMeshRef.current.rotation.y = (placement.rotation * Math.PI) / 180;
        }
      } else if (previewMeshRef.current) {
        // Remove preview mesh when placement is done
        scene.remove(previewMeshRef.current);
        previewMeshRef.current = null;
      }
      
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

  // Get target display color based on type (with mob difficulty for hostiles)
  const getTargetColor = () => {
    if (!selectedTarget) return '#fbbf24';
    if (selectedTarget.userData.hostile) {
      // Use mob difficulty color for hostile targets
      const mobLevel = selectedTarget.userData.level || 1;
      const difficulty = getMobDifficultyColor(mobLevel, playerLevel);
      return difficulty.textColor;
    }
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
      // Prepare terrain data (using WorldObjectSystem)
      const terrainData = extractTerrainData(terrainGeometryRef.current);
      
      // Prepare placed objects (using WorldObjectSystem normalization)
      const currentPlacedObjects = placedObjectsRef.current;
      const worldObjects = currentPlacedObjects.map(obj => normalizeObjectForSave(obj, currentZone));
      
      // Prepare placed enemies (using WorldObjectSystem normalization)
      const placedEnemiesData = placedEnemies.map(enemy => normalizeEnemyForSave(enemy));
      
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
      
      addNotification('World saved successfully! Changes visible to all players.', 'success');
    } catch (err) {
      console.error('Failed to save world:', err);
      
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
    <div 
      className="h-screen w-screen overflow-hidden relative select-none" 
      data-testid="game-world"
      style={{
        filter: isGhost ? 'grayscale(0.85) brightness(0.7)' : 'none',
        transition: 'filter 0.5s ease-in-out'
      }}
    >
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
        playerLevel={playerLevel}
        playerGold={playerCopper}
        learnedSpells={learnedSpells}
        onTrainSpell={handleTrainSpell}
        trainerName={selectedTarget?.name || 'Warrior Trainer'}
      />

      {/* Quest Dialog */}
      <QuestDialog
        isOpen={isQuestDialogOpen}
        onClose={() => {
          setIsQuestDialogOpen(false);
          setCurrentNPCQuest(null);
          setQuestGiverId(null);
        }}
        npcName={questGiverName}
        npcType={questGiverType}
        npcId={questGiverId}
        playerQuests={[...activeQuests, ...customQuests.filter(q => q.npc_id)]}
        onAcceptQuest={handleAcceptQuest}
        onTurnInQuest={handleTurnInQuest}
        customQuest={currentNPCQuest}
      />
      
      {/* Death Dialog - Release Corpse */}
      {showReleaseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1513] border-2 border-[#dc2626] rounded-lg p-8 max-w-md text-center shadow-2xl">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="font-cinzel text-3xl text-[#dc2626] mb-4">You Died</h2>
            <p className="text-[#a8a29e] mb-6">
              Release your spirit to return as a ghost at the graveyard. 
              You must run back to your corpse to revive.
            </p>
            <button
              onClick={handleReleaseCorpse}
              className="bg-[#dc2626] hover:bg-[#ef4444] text-white font-cinzel px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              data-testid="release-corpse-btn"
            >
              Release Corpse
            </button>
          </div>
        </div>
      )}
      
      {/* Revive Dialog - Near Corpse */}
      {showReviveDialog && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#1a1513]/95 border-2 border-[#22c55e] rounded-lg p-6 text-center shadow-2xl animate-pulse">
            <p className="text-[#22c55e] font-cinzel text-lg mb-4">Your corpse is nearby</p>
            <button
              onClick={handleRevive}
              className="bg-[#22c55e] hover:bg-[#4ade80] text-black font-cinzel px-6 py-2 rounded-lg transition-all duration-200"
              data-testid="revive-btn"
            >
              Revive (50% HP/Mana)
            </button>
          </div>
        </div>
      )}
      
      {/* Ghost Mode Indicator */}
      {isGhost && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-[#1a1513]/80 border border-[#6b7280] rounded-lg px-6 py-2">
            <p className="text-[#9ca3af] font-cinzel text-sm">
              👻 Ghost Mode - Return to your corpse to revive
            </p>
          </div>
        </div>
      )}
      
      {/* Quest Log */}
      <QuestLog
        isOpen={isQuestLogOpen}
        onClose={() => setIsQuestLogOpen(false)}
        activeQuests={[
          ...activeQuests,
          ...customQuests.filter(q => q.npc_id).map(q => ({
            ...q,
            id: q.quest_id,
            giver: q.npc_name || 'Quest Giver'
          }))
        ]}
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

      {/* Vendor Panel */}
      <VendorPanel
        isOpen={isVendorPanelOpen}
        onClose={() => setIsVendorPanelOpen(false)}
        vendorType={currentVendor.type}
        vendorName={currentVendor.name}
        playerInventory={backpack || []}
        playerCopper={copper || 0}
        onSellItem={handleSellItem}
        onUpdateCopper={updateCopper}
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
          playerLevel={playerLevel}
          currentXP={currentXP}
          xpProgress={getLevelProgress()}
          xpToNextLevel={xpToNextLevel}
        />
        
        {/* Minimap - Top Right */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Minimap 
            scene={sceneRef.current}
            playerRef={playerRef}
            cameraRef={cameraRef}
            rendererRef={rendererRef}
            onClick={() => setIsWorldMapOpen(true)}
          />
        </div>
        
        {/* World Map (M key) */}
        <WorldMap
          isOpen={isWorldMapOpen}
          onClose={() => setIsWorldMapOpen(false)}
          playerPosition={position}
          currentZone={currentZone}
          scene={sceneRef.current}
          playerRef={playerRef}
        />

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
        onUpdatePreview={(updates) => {
          // Update pending placement with new scale/rotation
          setPendingPlacement(prev => {
            if (!prev) return prev;
            return { ...prev, ...updates };
          });
        }}
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
          <p><span className="text-[#8b5cf6]">F7</span> - Quest Maker</p>
        </div>
      </div>
      
      {/* Quest Maker */}
      <QuestMaker
        isOpen={isQuestMakerOpen}
        onClose={() => setIsQuestMakerOpen(false)}
        onSaveQuest={handleSaveQuest}
        onAssignQuest={handleAssignQuestToNPC}
        onRemoveQuest={handleRemoveQuestFromNPC}
        existingQuests={customQuests}
        selectedNPC={selectedNPCForQuest}
        placedEnemies={placedEnemies}
        placedNPCs={placedObjects.filter(obj => obj.type === 'npc' || obj.type === 'questgiver' || obj.type === 'vendor' || obj.type === 'guard')}
        onRefreshWorldObjects={async () => {
          // Reload world objects from server to get updated quest assignments
          const savedObjects = await fetchWorldObjects();
          if (savedObjects && savedObjects.length > 0) {
            setPlacedObjects(savedObjects);
            // Update ref as well
            placedObjectsRef.current = savedObjects;
          }
        }}
      />
    </div>
  );
};

export default GameWorld;
