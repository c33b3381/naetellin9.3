# 🎮 Quest Of Honor - Codebase Index

> **Purpose**: This document serves as a map to help you quickly understand the RPG codebase architecture, find where systems live, and safely make common changes. Focus is on developer workflow and practical guidance.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Gameplay Loop](#core-gameplay-loop)
3. [System Overviews](#system-overviews)
4. [Data Flow & State Management](#data-flow--state-management)
5. [File Ownership Map](#file-ownership-map)
6. [How-To Guides](#how-to-guides)
7. [Known Issues & Risk Areas](#known-issues--risk-areas)

---

## Project Overview

**Type**: Single-player 3D MMORPG (WoW-style)  
**Tech Stack**: 
- **Frontend**: React 18, Three.js, @react-three/fiber, Zustand, TailwindCSS, Lucide Icons
- **Backend**: FastAPI (Python), MongoDB (Motor for async), JWT auth
- **Architecture**: Monolithic frontend component (`GameWorld.jsx`) + RESTful API backend

**Current State**: Fully functional RPG with:
- Custom animated player character (procedural humanoid)
- Detailed "Oakvale Village" starting zone
- Castle with enemies and boss
- Combat system with leveling (1-20)
- Quest system (predefined + custom)
- Loot system with 5 rarity tiers
- Death/resurrection mechanics
- World/terrain/enemy editors (F1/F2/F3 keys)

---

## Core Gameplay Loop

### Primary Flow
```
Player Login
  ↓
Character Selection/Creation
  ↓
Spawn in Oakvale Village (x:0, z:0)
  ↓
WASD Movement + Camera Control (Right-click drag)
  ↓
Click to Select Target (NPCs, Enemies, Objects)
  ↓
Double-click to Interact (Quests, Training, Vendors)
  ↓
Combat: Cast Spells (1-6 keys) → Enemy AI Engages → XP/Loot on Kill
  ↓
Level Up (1-20) → Learn New Spells → Better Gear
  ↓
Death → Release Spirit → Run to Corpse → Revive
```

### Game Loop (60 FPS)
Located in: **`GameWorld.jsx`** lines ~5000-6400

**Every Frame:**
1. Update player movement (PlayerMovementSystem)
2. Update camera position (CameraSystem)
3. Update player animations (walk, idle, jump, attack)
4. Update enemy AI (patrol/chase/combat per enemy)
5. Update floating damage text sprites
6. Update health bars (face camera)
7. Process auto-attack timers
8. Process global cooldowns
9. Update loot corpse timers
10. Handle terrain editing (if active)
11. Update brush indicator (if terrain editor open)
12. Render scene

---

## System Overviews

### ⚔️ Combat System
**File**: `frontend/src/systems/CombatSystem.js`  
**Responsibility**: Combat calculations, damage text, XP/leveling, mob difficulty

**Key Functions**:
- `calculateAutoAttackDamage()` - Player melee damage
- `calculateNpcAttackDamage(baseDamage)` - Enemy damage
- `calculateXPGain(mobLevel, playerLevel)` - XP rewards
- `getMobDifficultyColor(mobLevel, playerLevel)` - WoW-style color coding
- `createDamageText(scene, position, damage, isPlayerDamage)` - Floating combat text
- `updateEnemyHealthBar(enemyMesh, newHp)` - Health bar visual update

**Constants**:
- `COMBAT_CONSTANTS` - Attack speeds, GCD, combat timeout
- `XP_THRESHOLDS` - Cumulative XP per level (1-20)
- `MAX_LEVEL` = 20

**Combat State** (managed in GameWorld.jsx):
- Player: `currentHealth`, `currentMana`, `isInCombat`, `isAutoAttacking`
- Enemies: `npcCombatStateRef` (Map of combat states per enemy ID)

---

### 🤖 Enemy AI System
**File**: `frontend/src/systems/EnemyAISystem.js`  
**Responsibility**: Enemy behavior, patrol, aggro, chase, leash, reset

**Key Functions**:
- `createPatrolData(timestamp)` - Initialize patrol state
- `createCombatState(enemyMesh)` - Initialize combat state
- `updatePatrol(enemyMesh, patrolData, delta, ...)` - Move enemy on patrol path
- `shouldAggro(enemyMesh, player, combatState, ...)` - Check aggro range
- `shouldLeash(enemyMesh, player, combatState)` - Check if too far from spawn
- `chasePlayer(enemyMesh, player, enemyId, delta, ...)` - Pursue player
- `maintainSpreadPosition(...)` - Position around player (prevent stacking)
- `moveToSpawn(enemyMesh, combatState, delta, ...)` - Return to spawn on reset
- `resetEnemyHealth(enemyMesh)` - Full HP restore

**AI States**:
- **Patrol** - Follow waypoint pattern
- **Combat** - Chase player, maintain spread position, attack in range
- **Reset/Leash** - Return to spawn, restore HP

**Patrol Patterns**: Circle, Figure-8, Triangle, Line, Diamond, Zigzag, Square

**Constants**:
- `AGGRO_RANGE` = 8 units
- `LEASH_RANGE` = 40 units
- `MELEE_RANGE` = 5 units
- `PATROL_SPEED` = 2 units/sec
- `CHASE_SPEED` = 4 units/sec
- `RETURN_SPEED` = 6 units/sec

---

### 🏃 Player Movement System
**File**: `frontend/src/systems/PlayerMovementSystem.js`  
**Responsibility**: WASD movement, jump, gravity, terrain following, world bounds

**Key Functions**:
- `createMovementState()` - Initialize movement state
- `handleMovementKeyDown(e, movementState)` - Process WASD/Arrow/Space input
- `handleMovementKeyUp(e, movementState)` - Release keys
- `updatePlayerMovement(player, movementState, cameraState, scene, delta, lastPlayerPos, options)` - Main update
- `calculateMovementDirection(movement, cameraState)` - Direction vector from input
- `getTerrainHeightAtPosition(scene, x, z, fallback)` - Raycast for height

**Movement Features**:
- Camera-relative movement (WASD rotated by camera yaw)
- Jump physics with gravity
- Smooth terrain following (not jumping)
- Water slowdown (30% speed reduction)
- Auto-run toggle (NumLock)
- Both mouse buttons = move forward
- World bounds clamping (±290 units)
- Teleport detection & revert (prevents >50 unit jumps)

---

### 📷 Camera System
**File**: `frontend/src/systems/CameraSystem.js`  
**Responsibility**: WoW-style third-person camera, zoom, rotation

**Key Functions**:
- `createCameraState()` - Initialize camera state
- `handleCameraMouseDown/Up/Move/Wheel(e, cameraState, ...)` - Input handling
- `updateCamera(camera, player, cameraState, isMapEditorMode, ...)` - Position camera each frame

**Camera Modes**:
1. **Normal Mode**: Follow player, right-click drag to rotate, scroll to zoom
2. **Map Editor Mode (F5)**: Detach from player, top-down view, pan with WASD/Ctrl+RMB

**Camera Constraints**:
- Distance: 5-30 units from player
- Pitch: 0.2 to 1.5 radians
- Smooth movement with lerp

---

### 🌍 Terrain System
**File**: `frontend/src/systems/TerrainSystem.js`  
**Responsibility**: Procedural terrain generation, height/color queries, water detection

**Key Functions**:
- `getTerrainHeight(x, z)` - Get Y height at world position
- `isInWater(x, z)` - Check if position is in water
- `getWaterDepth(x, z)` - Calculate water depth
- `getTerrainColor(x, z)` - Get terrain color (for visual consistency)

**Terrain Generation** (in GameWorld.jsx):
- 600×600 world size, 200×200 segments
- Multi-octave Perlin noise
- Height-based coloring (water, grass, rock, snow)
- Editable via Terrain Editor (F2)

---

### 🎨 World Asset Factory
**File**: `frontend/src/systems/WorldAssetFactory.js`  
**Responsibility**: Create 3D meshes for NPCs, enemies, objects, decorations, player

**Key Functions**:
- `createWorldAsset(data, getTerrainHeight)` - Universal mesh creator
- `createEnemyMesh(enemyData, x, z, enemyId, getTerrainHeight)` - Enemy mesh factory
- `createPlayerMesh(characterData)` - Player character factory (extracted in refactor!)
- `createNPCMesh(config, x, z, getTerrainHeight)` - Generic NPC factory (extracted in refactor!)
- `createTrainerMesh(trainerClass, name, x, z, getTerrainHeight)` - Trainer factory (extracted in refactor!)
- `createVendorMesh(name, vendorType, x, z, getTerrainHeight)` - Vendor factory (extracted in refactor!)
- `createQuestGiverMesh(name, npcId, x, z, getTerrainHeight)` - Quest giver factory (extracted in refactor!)

**Supported Types**:
- NPCs: Guard, Trainer, Vendor, Quest Giver
- Buildings: Houses, Towers, Castles
- Nature: Trees, Rocks, Fountains
- Decorations: Benches, Market Stalls, Signs
- Enemies: Visual representation (cube with icon + health bar)
- Player: Procedural humanoid with animation pivots

---

### 💀 Death & Resurrection System
**File**: `frontend/src/systems/DeathResurrectionSystem.js`  
**Responsibility**: Player death mechanics, ghost mode, corpse revival

**Key Functions**:
- `handlePlayerDeath()` - Player dies, drops combat, shows dialog
- `handleReleaseCorpse()` - Become ghost, teleport to graveyard
- `handlePlayerRevive()` - Revive at corpse with 50% HP/mana
- `isNearCorpse()` - Check proximity for revival

**Constants**:
- `GRAVEYARD_POSITION` - Ghost spawn location
- `CORPSE_REVIVE_RADIUS` - Distance to allow revival

**Death Flow**:
1. Player HP reaches 0 → `handlePlayerDeath()`
2. Show release dialog → Player clicks "Release Corpse"
3. `handleReleaseCorpse()` → Ghost mode, teleport to graveyard
4. Player runs back to corpse → Show revive dialog when close
5. `handlePlayerRevive()` → Full revival with 50% HP/mana

---

### 🎁 Loot System
**File**: `frontend/src/systems/LootSystem.js`  
**Responsibility**: Loot generation, corpse management, item pickup

**Key Functions**:
- `transformToLootableCorpse()` - Convert enemy to lootable corpse
- `createLootSparkles()` - Animated sparkle effect for corpses
- `applyLootItemPickup()` - Pick up single item from corpse
- `applyLootAllPickup()` - Pick up all items from corpse
- `cleanupCorpse()` - Remove corpse from scene

**Constants**:
- `CORPSE_DESPAWN_TIME` - Time before corpse despawns (2 minutes)
- `RESPAWN_TIME` - Time before enemy respawns (2 minutes)

**Loot Flow**:
1. Enemy dies → `transformToLootableCorpse()`
2. Corpse created with sparkles → 2-minute timer starts
3. Player loots items → `applyLootItemPickup()` or `applyLootAllPickup()`
4. Corpse despawns → Enemy respawns at original position

---

### 📜 Quest Progress System
**File**: `frontend/src/systems/QuestProgressSystem.js`  
**Responsibility**: Track quest objectives, kill counts, completion detection

**Key Functions**:
- `updateQuestListForEnemyKill()` - Update kill objectives when enemy dies
- `checkKillObjective()` - Check if kill matches quest objective
- `updateKillObjective()` - Increment kill count
- `checkQuestCompletion()` - Check if all objectives complete

**Quest Types Supported**:
- Kill objectives (kill X enemies of type Y)
- Custom enemies (by name or type)
- NPC-assigned quests (require quest giver)

**Integration**:
- Called from `handleEnemyDeath()` in GameWorld
- Updates both active quests and custom quests
- Shows notifications on objective progress

---

### ⏱️ Spell Cooldown System
**File**: `frontend/src/systems/SpellCooldownSystem.js`  
**Responsibility**: Manage spell and global cooldowns

**Key Functions**:
- `startSpellCooldown()` - Start individual spell cooldown
- `startGlobalCooldown()` - Start global cooldown (GCD)
- `updateSpellCooldowns()` - Tick down all cooldowns
- `isSpellOnCooldown()` - Check if spell is on cooldown

**Constants**:
- `COOLDOWN_TICK_INTERVAL` - Update frequency (100ms)
- `COOLDOWN_TICK_AMOUNT` - Amount to reduce per tick (0.1s)

**WoW-Style Cooldowns**:
- Individual spell cooldowns (e.g., 5s, 10s, 30s)
- Global cooldown (GCD) - 1.5s after most spells
- Both cooldowns run simultaneously

---

### 🛠️ World Setup
**File**: `frontend/src/systems/WorldSetup.js`  
**Responsibility**: Pure Three.js scene/camera/renderer/lighting setup

**Key Functions**:
- `createGameScene()` - Scene with background and fog
- `createGameCamera()` - Perspective camera configuration
- `createGameRenderer(container)` - WebGL renderer with tone mapping
- `setupWorldLighting(scene)` - All lighting (ambient, directional, fill, hemisphere)

**Lighting Configuration**:
- Ambient light (soft base illumination)
- Directional light (sun, with shadows)
- Fill lights (reduce harsh shadows)
- Hemisphere light (sky/ground color gradient)

**Extracted in Refactor**:
- Pure setup functions with no state dependencies
- Deterministic, side-effect-free
- Easy to test and reuse

---

### ⌨️ Editor Input Handler
**File**: `frontend/src/systems/EditorInputHandler.js`  
**Responsibility**: Editor-specific keyboard shortcuts

**Key Functions**:
- Handles F1-F7 editor toggles
- Handles Ctrl+S world save
- Integrates with main InputSystem

**Editor Shortcuts**:
- F1: World Editor (object placement)
- F2: Terrain Editor (sculpting)
- F3: Enemy Editor (spawning)
- F4: Item Database Editor
- F5: Map Editor Mode (top-down camera)
- F6: Flight Mode (in map editor)
- F7: Quest Maker
- Ctrl+S: Save World

---

### 🛠️ World Setup
**File**: `frontend/src/systems/WorldSetup.js`  
**Responsibility**: Pure Three.js scene/camera/renderer/lighting setup

**Key Functions**:
- `createGameScene()` - Scene with background and fog
- `createGameCamera()` - Perspective camera configuration
- `createGameRenderer(container)` - WebGL renderer with tone mapping
- `setupWorldLighting(scene)` - All lighting (ambient, directional, fill, hemisphere)

---

### 🎮 Input System
**File**: `frontend/src/systems/InputSystem.js`  
**Responsibility**: Centralized keyboard event handling, key handler registration

**Key Functions**:
- `createKeyDownHandler(refs)` - Create main keydown handler
- `createKeyUpHandler(refs)` - Create main keyup handler
- `registerKeyboardHandlers(keyDown, keyUp)` - Attach to window
- `unregisterKeyboardHandlers(keyDown, keyUp)` - Cleanup

**Keyboard Layout**:
- **WASD** - Movement
- **Space** - Jump
- **NumLock** - Auto-run toggle
- **Tab** - Target nearest enemy
- **1-6** - Cast spells from action bar
- **P** - Open spell book
- **M** - World map
- **C** - Character panel
- **L** - Quest log
- **Escape** - Close panels/deselect
- **F1** - World Editor
- **F2** - Terrain Editor
- **F3** - Enemy Editor
- **F4** - Item Database Editor
- **F5** - Map Editor Mode
- **F6** - Flight Mode (in map editor)
- **F7** - Quest Maker
- **Ctrl+S** - Save world

---

### 🗺️ World Object System
**File**: `frontend/src/systems/WorldObjectSystem.js`  
**Responsibility**: Normalize world data for save/load, mesh disposal

**Key Functions**:
- `normalizeObjectForSave(obj, zone)` - Prepare object for DB save
- `normalizeEnemyForSave(enemy)` - Prepare enemy for DB save
- `extractTerrainData(geometryRef)` - Extract heightmap + colors
- `processLoadedWorldObject(obj, getTerrainHeight)` - Reconstruct from DB
- `disposeMeshTree(mesh)` - Clean up Three.js memory

---

## Data Flow & State Management

### State Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store                             │
│                 (gameStore.js - 800 lines)                   │
│                                                              │
│  - Auth State (token, playerId, isAuthenticated)            │
│  - Player Data (character, skills, inventory, equipment)    │
│  - Game State (position, copper, learned_spells, etc.)      │
│  - UI State (activePanel, notifications, error)             │
│  - Bag System (backpack, bags[4])                           │
│  - Quest State (active, completed, available)               │
│                                                              │
│  Actions: register, login, fetchPlayer, updatePosition,     │
│           learnSpell, saveActionBar, addItemToBag, etc.     │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│               GameWorld.jsx (7165 lines)                     │
│                  React Component State                       │
│                                                              │
│  Local UI State:                                            │
│  - selectedTarget (current target)                          │
│  - isEditorOpen, isTerrainEditorOpen, etc. (20+ panels)    │
│  - placedObjects, placedEnemies (editor state)             │
│  - combatLog, spellCooldowns, currentHealth/Mana           │
│  - playerLevel, currentXP (synced to store)                │
│  - isDead, isGhost, corpsePosition (death system)          │
│                                                              │
│  Refs (for game loop/event handlers):                       │
│  - sceneRef, cameraRef, rendererRef, playerRef             │
│  - cameraState, movementState (from systems)               │
│  - npcCombatStateRef, enemyPatrolDataRef                   │
│  - 50+ closure-fix refs (isXxxOpenRef)                     │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│                 (server.py - 1235 lines)                     │
│                                                              │
│  MongoDB Collections:                                        │
│  - players: User accounts, character data, inventory        │
│  - terrain: Heightmap and color data                        │
│  - world_objects: NPCs, buildings, decorations              │
│  - placed_enemies: Enemy spawns                             │
│  - paths: Path node data                                    │
│  - custom_quests: Player-created quests                     │
│  - global_quests: Shared quest database                     │
│                                                              │
│  Endpoints: /api/auth/*, /api/player/*, /api/world/*,       │
│             /api/quests/*, /api/combat/*, /api/terrain/*    │
└─────────────────────────────────────────────────────────────┘
```

### Save Flow

**Player Position** (auto-save every movement):
```
PlayerMovementSystem.updatePlayerMovement()
  → GameWorld animation loop
  → Debounced call to gameStore.updatePosition()
  → PUT /api/player/position
  → MongoDB players.position update
```

**World State** (manual save via Ctrl+S):
```
User presses Ctrl+S
  → GameWorld.handleSaveWorld()
  → Collect: terrain, world_objects, placed_enemies, paths, player data
  → POST /api/player/save-all (comprehensive save)
  → MongoDB: Update terrain, world_objects, placed_enemies, paths, players
```

**Spell Learning**:
```
TrainerPanel.onTrainSpell(spellId, cost)
  → GameWorld.handleTrainSpell()
  → gameStore.learnSpell(spellId, cost)
  → POST /api/player/learn-spell
  → MongoDB: $push learned_spells, $inc copper
  → Update Zustand store
```

### Load Flow

**Initial Load**:
```
User logs in
  → gameStore.login()
  → POST /api/auth/login (get token)
  → gameStore.fetchPlayer()
  → GET /api/player/me (full player data)
  → Update Zustand store
  → GameWorld renders
  → useEffect: Load terrain, world objects, enemies
  → GET /api/terrain, /api/world/objects, /api/world/enemies
  → Reconstruct scene with loaded data
```

---

## File Ownership Map

### 🗂️ Frontend Structure

```
/app/frontend/src/
├── pages/
│   └── GameWorld.jsx              ✅ COORDINATOR (6303 lines, -862 from refactor)
│       Owns: Game loop, system coordination, state management
│
├── systems/                        ✅ Well-separated logic (Refactored!)
│   ├── CombatSystem.js            Combat calculations, XP, damage text
│   ├── EnemyAISystem.js           AI behavior, patrol, aggro, chase
│   ├── PlayerMovementSystem.js    WASD, jump, terrain following
│   ├── CameraSystem.js            Third-person camera, zoom, rotation
│   ├── InputSystem.js             Keyboard handler factory
│   ├── EditorInputHandler.js      🆕 Editor-specific keyboard shortcuts
│   ├── TerrainSystem.js           Height queries, water detection
│   ├── WorldAssetFactory.js       NPC/enemy/player mesh creation (expanded!)
│   ├── WorldObjectSystem.js       Save/load normalization
│   ├── WorldSetup.js              🆕 Scene/camera/renderer/lighting setup
│   ├── DeathResurrectionSystem.js 🆕 Player death, ghost mode, revival
│   ├── LootSystem.js              🆕 Loot generation, corpses, pickup
│   ├── QuestProgressSystem.js     🆕 Quest kill tracking, objectives
│   └── SpellCooldownSystem.js     🆕 Spell & GCD cooldown management
│
├── components/
│   ├── hud/                        HUD overlays
│   │   ├── HUD.jsx                Player HP/MP, XP bar, menu buttons
│   │   ├── Minimap.jsx            Top-down minimap
│   │   ├── WorldMap.jsx           Full-screen map (M key)
│   │   └── ChatBox.jsx            Chat UI (not implemented)
│   │
│   ├── panels/                     Main panels (I, C, K, etc.)
│   │   ├── CharacterPanel.jsx     Stats, equipment slots
│   │   ├── InventoryPanel.jsx     Bag contents
│   │   ├── SkillsPanel.jsx        Skill levels
│   │   └── QuestPanel.jsx         Quest list
│   │
│   ├── game/                       Game-specific UI
│   │   ├── ActionBar.jsx          Spell bar (1-6)
│   │   ├── SpellBook.jsx          Spell browser (P key)
│   │   ├── TrainerPanel.jsx       Spell trainer dialog
│   │   ├── QuestDialog.jsx        Quest giver interaction
│   │   ├── QuestLog.jsx           Quest tracker (L key)
│   │   ├── LootPanel.jsx          Corpse loot window
│   │   ├── VendorPanel.jsx        NPC vendor shop
│   │   ├── BagBar.jsx             Bag slots UI
│   │   ├── WorldEditor.jsx        Object placement (F1)
│   │   ├── TerrainEditor.jsx      Terrain sculpting (F2)
│   │   ├── EnemyEditor.jsx        Enemy spawner (F3)
│   │   ├── ItemDatabaseEditor.jsx Item browser (F4)
│   │   └── QuestMaker.jsx         Custom quest creator (F7)
│   │
│   └── ui/                         shadcn/ui components
│       └── *.jsx                   Button, Dialog, Input, etc.
│
├── data/                           Static game data
│   ├── enemies.js                 Enemy database (types, stats, icons)
│   ├── items.js                   Loot items (5 rarity tiers)
│   ├── spells.js                  Warrior spells (10 abilities)
│   └── objects.js                 World object definitions
│
└── store/
    └── gameStore.js               🌐 Global state (Zustand)
```

### 🗂️ Backend Structure

```
/app/backend/
├── server.py                       ⚠️ MONOLITH (1235 lines)
│   All routes: Auth, Player, Combat, Quests, World, Terrain
│
├── tests/
│   ├── test_api.py                API endpoint tests
│   ├── test_rotation_persistence.py  Object rotation tests
│   └── test_world_object_system.py   World object tests
│
└── requirements.txt               Python dependencies
```

### 🗃️ MongoDB Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `players` | User accounts, character data | `id`, `username`, `email`, `password_hash`, `character`, `skills`, `inventory`, `equipment`, `position`, `copper`, `learned_spells`, `action_bar`, `combat_level`, `experience` |
| `terrain` | Terrain heightmap | `terrain_id`, `heightmap[]`, `colors[]`, `world_size`, `segments`, `seed` |
| `world_objects` | NPCs, buildings, decorations | `id`, `type`, `subType`, `name`, `position`, `rotation`, `scale`, `zone`, `quest_giver`, `global_quest_id` |
| `placed_enemies` | Enemy spawns | `id`, `type`, `level`, `position`, `hostile`, `maxHealth`, `damage`, `patrolRadius` |
| `paths` | Path nodes | `zone`, `nodes[]`, `width` |
| `custom_quests` | Player-created quests | `quest_id`, `creator_id`, `npc_id`, `objectives`, `rewards` |
| `global_quests` | Shared quest pool | `quest_id`, `is_global`, `assigned_npc_id`, `objectives`, `rewards` |

---

## How-To Guides

### 🎯 How to Add a New Enemy Type

**1. Define enemy in data file:**
```javascript
// File: frontend/src/data/enemies.js

export const ENEMY_DATABASE = {
  tier1: {
    enemies: {
      // ADD YOUR ENEMY HERE
      my_new_enemy: {
        label: 'My New Enemy',
        icon: Skull,              // From lucide-react
        color: '#ff0000',
        baseLevel: 3,
        baseHealth: 100,
        baseDamage: 8,
        xpReward: 30,
        goldDrop: [5, 15],
        description: 'A fearsome new foe'
      }
    }
  }
};
```

**2. Add loot table (optional):**
```javascript
// File: frontend/src/data/items.js

const ENEMY_LOOT_TABLES = {
  my_new_enemy: ['bone_fragment', 'leather_scraps', 'minor_health_potion']
};
```

**3. Spawn enemy in world:**
- Open game, press **F3** (Enemy Editor)
- Select your enemy from the tier dropdown
- Adjust level, patrol radius
- Click "Place Enemy Mode"
- Click terrain to spawn
- Press **Ctrl+S** to save

**4. Test:**
- Enemy should patrol and aggro when player approaches
- Killing it should grant XP and loot

**Files Modified**: `enemies.js`, `items.js` (optional)  
**No Code Changes Needed** - Enemy AI is handled automatically

---

### 🎁 How to Add a New Loot Item

**1. Define item in data file:**
```javascript
// File: frontend/src/data/items.js

export const LOOT_ITEMS = {
  my_epic_sword: {
    id: 'my_epic_sword',
    name: 'Legendary Blade',
    icon: '⚔️',
    description: 'A sword of immense power',
    vendorPrice: 15000,        // 1g 50s (in copper)
    rarity: 'epic',            // junk, common, uncommon, rare, epic
    dropChance: 0.01,          // 1%
    equipment: true,           // Is this equipment?
    slot: 'weapon',            // weapon, chest, head, etc.
    stats: { damage: 30, crit: 5 }
  }
};
```

**2. Add to loot table:**
```javascript
const ENEMY_LOOT_TABLES = {
  dragon: ['dragon_scale', 'my_epic_sword', 'ancient_relic']
};
```

**3. Test:**
- Kill enemies that drop from that loot table
- Item should appear in loot window
- Stats should show correctly

**Files Modified**: `items.js`

---

### ✨ How to Add a New Spell/Ability

**1. Define spell in data file:**
```javascript
// File: frontend/src/data/spells.js

export const WARRIOR_SPELLS = {
  'warrior_my_spell': {
    id: 'warrior_my_spell',
    name: 'My Awesome Ability',
    icon: Flame,               // From lucide-react
    description: 'Does something cool',
    damage: { min: 25, max: 40 },
    manaCost: 20,
    cooldown: 10,              // Seconds
    range: 5,                  // Units
    type: 'physical',          // physical, fire, frost, etc.
    cost: 5000,                // Training cost (50 silver)
    tier: 2,                   // 1-4
    requiredLevel: 6
  }
};
```

**2. Implement spell effect (if unique):**
```javascript
// File: frontend/src/pages/GameWorld.jsx
// Search for: handleCastSpell function

// Add your custom logic in the spell effect switch:
case 'warrior_my_spell':
  // Custom spell behavior here
  const spellDamage = calculateSpellDamage(spell);
  // Deal damage, apply effects, etc.
  break;
```

**3. Test:**
- Login, find a trainer (double-click)
- Train the spell if you meet level requirement
- Drag to action bar
- Use on enemies

**Files Modified**: `spells.js`, `GameWorld.jsx` (if custom effect)

---

### 🗺️ How to Add a New Quest

**Option A: Using Quest Maker (In-Game)**

1. Press **F7** in-game → Opens Quest Maker
2. Fill in quest details:
   - Name, description, difficulty
   - Objectives (kill X enemies, collect Y items)
   - Rewards (XP, gold, items)
3. Click "Save Quest to Database"
4. Click "Assign to NPC" → Select an NPC
5. Quest now available from that NPC

**Option B: Hardcoded Quest (Backend)**

```python
# File: backend/server.py
# Search for: AVAILABLE_QUESTS

AVAILABLE_QUESTS = [
  {
    "quest_id": "my_new_quest",
    "name": "My Quest Name",
    "description": "Quest description here",
    "objectives": [
      {
        "id": "kill_goblins",
        "description": "Kill Goblins",
        "required": 10,
        "type": "kill",
        "target": "goblin"
      }
    ],
    "rewards": {
      "xp": {"attack": 200},
      "items": [{"item_id": "steel_sword", "name": "Steel Sword", "type": "weapon", "quantity": 1}]
    },
    "difficulty": "medium"
  }
]
```

**Files Modified**: `server.py` (Option B only)  
**Testing**: Talk to quest giver, accept quest, complete objectives, turn in

---

### 🏗️ How to Add a New NPC Type

**1. Define NPC visual in WorldAssetFactory:**
```javascript
// File: frontend/src/systems/WorldAssetFactory.js

case 'npc_my_type':
  // Create geometry for your NPC
  const body = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
  const bodyMesh = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ color: 0x123456 }));
  // Add to group, position parts, etc.
  break;
```

**2. Add selection handling:**
```javascript
// File: frontend/src/pages/GameWorld.jsx
// Search for: handleDoubleClick function

if (selected.userData.type === 'my_type') {
  // Handle interaction
  setMyCustomPanelOpen(true);
}
```

**3. Place in world:**
- Press **F1** (World Editor)
- Select NPC category, choose your type
- Place in world
- **Ctrl+S** to save

**Files Modified**: `WorldAssetFactory.js`, `GameWorld.jsx`

---

### 🎨 How to Modify Terrain

**In-Game Terrain Editor (F2):**

1. Press **F2** → Opens Terrain Editor
2. Select tool:
   - **Raise** - Sculpt hills
   - **Lower** - Carve valleys
   - **Smooth** - Blend heights
   - **Paint** - Change colors
   - **Path** - Create roads (click to add nodes)
3. Adjust brush size & strength
4. Click/drag on terrain to edit
5. **Ctrl+S** to save terrain

**Programmatic Terrain:**
```javascript
// File: frontend/src/pages/GameWorld.jsx
// Search for: createTerrain function

// Modify the Perlin noise parameters:
const terrainHeight = getTerrainHeight(worldX, worldZ);
// Apply your own height formula here
```

**Files Modified**: `GameWorld.jsx` (for procedural changes)

---

### 🔧 How to Debug Common Issues

#### Issue: "Player is stuck in terrain"
**Cause**: Terrain height mismatch  
**Fix**:
1. Check `TerrainSystem.getTerrainHeight(x, z)` is returning correct value
2. Verify `PlayerMovementSystem.updatePlayerMovement()` is calling terrain height
3. Add debug log: `console.log('Terrain Y:', terrainY, 'Player Y:', player.position.y)`

#### Issue: "Enemies not attacking"
**Cause**: Combat state not syncing  
**Fix**:
1. Check `npcCombatStateRef.current.get(enemyId)` exists
2. Verify `AI_CONSTANTS.MELEE_RANGE` is appropriate
3. Check enemy `userData.hostile === true`
4. Add log in game loop: `console.log('Enemy combat state:', combatState)`

#### Issue: "Spells not casting"
**Cause**: Usually cooldown or mana  
**Fix**:
1. Check `spellCooldowns[spellId] === 0`
2. Verify `currentMana >= spell.manaCost`
3. Check `selectedTarget !== null` (if target required)
4. Check `globalCooldownRef.current === 0`

#### Issue: "World objects not saving"
**Cause**: Auth token expired or save endpoint error  
**Fix**:
1. Check browser console for 401 errors
2. Verify `token` in Zustand store is valid
3. Check backend logs: `tail -n 100 /var/log/supervisor/backend.err.log`
4. Ensure objects are in `placedObjectsRef.current` before save

---

## Known Issues & Risk Areas

### ⚠️ Critical Risk Areas

#### 1. **GameWorld.jsx Coordinator (6303 lines)**
**Risk Level**: 🟡 **MEDIUM** (Improved from HIGH)

**Progress**:
- ✅ Reduced from 7165 to 6303 lines (-862 lines, 12%)
- ✅ Complex logic extracted to systems
- ✅ Now acts as coordinator, not owner of logic

**Remaining Complexity**:
- Still large due to coordinator responsibilities
- ~500 lines of UI rendering (JSX)
- ~2000 lines of hardcoded world content (starter village)
- ~1100 lines for main animation loop
- ~150 lines of state sync (React pattern)

**Current State**: Much more maintainable - changes to game logic now happen in specialized systems

**Mitigation**:
- ✅ Systems are independently testable
- ✅ Clear section comments mark responsibility zones
- ✅ See `/app/REMAINING_COORDINATION_ZONES.md` for full breakdown
- Always test with frontend testing agent after changes
- Keep changes small and focused
- Use Find (Ctrl+F) extensively to locate code sections

---

#### 2. **Closure Stale State Issues**
**Risk Level**: 🟡 **MEDIUM**

**Problem**: 
- React event handlers capture stale state/props
- Solution: 50+ `useRef` variables kept in sync with state
- Pattern: `isXxxOpen` (state) + `isXxxOpenRef` (ref)

**Example**:
```javascript
const [isTrainerOpen, setIsTrainerOpen] = useState(false);
const isTrainerOpenRef = useRef(false);

useEffect(() => {
  isTrainerOpenRef.current = isTrainerOpen;
}, [isTrainerOpen]);

// Event handler uses ref instead of state
const handleKeyDown = (e) => {
  if (isTrainerOpenRef.current) { /* ... */ }
};
```

**If you add new state**: Always create a matching ref and sync it!

---

#### 3. **Position Teleport Bug**
**Risk Level**: 🟡 **MEDIUM**

**Problem**: Player can randomly teleport if position updates incorrectly

**Prevention** (already implemented):
```javascript
// PlayerMovementSystem detects large position jumps
const posDiff = player.position.distanceTo(lastPlayerPos);
if (posDiff > 50 && !justTeleportedRef.current) {
  player.position.copy(lastPlayerPos); // REVERT
  return { reverted: true };
}
```

**If modifying movement**: Never directly set `player.position` without setting `justTeleportedRef.current = true`

---

#### 4. **Memory Leaks (Three.js)**
**Risk Level**: 🟡 **MEDIUM**

**Problem**: Three.js geometries/materials/textures not disposed

**Current Mitigation**:
- `WorldObjectSystem.disposeMeshTree(mesh)` - Recursive cleanup
- Called on: Scene cleanup, object deletion, enemy death

**When adding new meshes**: Always dispose on removal!
```javascript
mesh.geometry.dispose();
mesh.material.dispose();
scene.remove(mesh);
```

---

#### 5. **Zustand Store Overwrites**
**Risk Level**: 🟢 **LOW** (but critical when it happens)

**Problem**: Store partialize config only persists auth tokens, not game state

**What's Persisted**: `token`, `playerId`, `username`, `isAuthenticated`  
**What's NOT Persisted**: Character data, position, inventory (loaded from backend)

**If adding new persistent data**: Add to `partialize` in `gameStore.js`

---

### 🐛 Known Bugs (Low Priority)

1. **Enemy health bars sometimes don't face camera on spawn**
   - **Workaround**: Trigger by moving camera
   - **File**: `EnemyAISystem.js` - `updateHealthBarFacing()`

2. **Terrain brush indicator disappears at steep angles**
   - **Cause**: Raycaster miss at extreme angles
   - **File**: `GameWorld.jsx` - Animation loop terrain editing section

3. **Loot corpses can stack if killed in same spot**
   - **Workaround**: Corpses despawn after 2 minutes
   - **File**: `GameWorld.jsx` - Loot system

4. **Map editor camera can clip through terrain**
   - **Cause**: No collision in map editor mode
   - **File**: `CameraSystem.js` - Map editor update path

---

### 📝 Code Quality Notes

**Strengths**:
- ✅ Excellent system extraction (Combat, AI, Movement, Camera, Death, Loot, Quests, Cooldowns)
- ✅ Clear data file separation (enemies, items, spells)
- ✅ Comprehensive component library (panels, HUD, editors)
- ✅ Zustand store is well-organized
- ✅ Backend API is RESTful and clear
- ✅ **NEW**: GameWorld transitioned to coordinator pattern

**Improvements from Refactoring**:
- ✅ 862 lines extracted from GameWorld (-12%)
- ✅ 7 new system files created
- ✅ Clear responsibility separation
- ✅ Systems are independently testable

**Weaknesses**:
- ⚠️ GameWorld.jsx still large (but now as coordinator, not monolith)
- ⚠️ Many closure-fix refs (symptom of React patterns, not bad architecture)
- ⚠️ Hardcoded world content in GameWorld (~2000 lines)
- ⚠️ Backend server.py is monolithic (low priority)

---

### 🔮 Future Refactoring Recommendations

**See `/app/REMAINING_COORDINATION_ZONES.md` for detailed analysis**

**Safe to Extract (Low Risk, Medium Value)**:
1. Player animation logic → `PlayerAnimationSystem.js` (~70 lines)
2. Auto-attack logic → Expand `CombatSystem.js` (~85 lines)
3. Damage text & sparkle animations → Animation helpers (~50 lines)

**Medium Risk (Consider Carefully)**:
4. Hardcoded world content → `StarterVillageBuilder.js` (~1950 lines)
   - High effort, medium value
   - Only do if world content grows significantly

**High Risk (Do Not Refactor Casually)**:
5. Spell casting logic (~240 lines)
   - Complex with many spell interactions
   - Only refactor if building proper spell effect framework
6. World initialization bootstrap (terrain, DB loading)
   - Attempted in "Pass 2" and deferred due to high coupling
7. Main animation loop (~1100 lines)
   - Inherently monolithic - must access all game state
   - Can extract individual update functions, but loop must stay

**Completed Extractions** ✅:
- ✅ P1: NPC/Enemy Mesh Creation → WorldAssetFactory
- ✅ P1: Player Mesh Creation → WorldAssetFactory  
- ✅ P0 (Pass 1): Scene/Lighting Setup → WorldSetup
- ✅ Editor Input Handling → EditorInputHandler
- ✅ Death/Resurrection → DeathResurrectionSystem
- ✅ Loot Generation/Pickup → LootSystem
- ✅ Quest Kill Tracking → QuestProgressSystem
- ✅ Spell Cooldowns → SpellCooldownSystem

---

## 📚 Additional Resources

- **Three.js Docs**: https://threejs.org/docs/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber/
- **Zustand**: https://github.com/pmndrs/zustand
- **FastAPI**: https://fastapi.tiangulo.com/
- **MongoDB Motor**: https://motor.readthedocs.io/

---

**Last Updated**: December 2025  
**Maintainer**: Solo Developer  
**Version**: 1.0.0

---

## Quick Reference Card

| Task | Keyboard Shortcut | File to Edit |
|------|-------------------|--------------|
| Add enemy | F3 in-game | `enemies.js` |
| Add item | - | `items.js` |
| Add spell | - | `spells.js` |
| Add NPC type | F1 in-game | `WorldAssetFactory.js` |
| Create quest | F7 in-game | - |
| Edit terrain | F2 in-game | - |
| Debug combat | - | `CombatSystem.js` |
| Debug AI | - | `EnemyAISystem.js` |
| Debug movement | - | `PlayerMovementSystem.js` |
| Modify UI | - | `components/` |
| Backend API | - | `server.py` |
