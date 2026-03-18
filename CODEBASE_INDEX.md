# Quest of Honor - Codebase Index & Architecture

## Overview
A WoW-inspired RPG game built with React/Three.js frontend and FastAPI/MongoDB backend.

---

## 📊 File Size Analysis

| File | Lines | Status |
|------|-------|--------|
| `GameWorld.jsx` | 9,456 | ⚠️ CRITICAL - Needs splitting |
| `WorldEditor.jsx` | 1,279 | ⚠️ Large but focused |
| `LootPanel.jsx` | 949 | Contains LOOT_ITEMS database |
| `QuestMaker.jsx` | 743 | Quest creation UI |
| `EnemyEditor.jsx` | 723 | Contains ENEMY_DATABASE |
| `QuestDialog.jsx` | 549 | Quest interaction UI |
| `ItemDatabaseEditor.jsx` | 529 | Item editing UI |
| `TrainerPanel.jsx` | 505 | Contains WARRIOR_SPELLS |
| `SpellBook.jsx` | 427 | Spell system |
| `VendorPanel.jsx` | 365 | Vendor buy/sell UI |
| `server.py` | 1,234 | Backend API |

---

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py              # Main FastAPI server (ALL routes)
│   ├── .env                   # MongoDB URL, JWT secret
│   └── tests/
│       └── test_api.py        # API tests
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── GameWorld.jsx      # ⚠️ MONOLITHIC - Main game (9,456 lines)
│   │   │   ├── CharacterCreation.jsx
│   │   │   └── LandingPage.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── game/              # Game-specific components
│   │   │   │   ├── ActionBar.jsx      # Spell action bar
│   │   │   │   ├── BagBar.jsx         # Inventory bag bar
│   │   │   │   ├── BagPanel.jsx       # Individual bag contents
│   │   │   │   ├── Buildings.jsx      # Building meshes (UNUSED?)
│   │   │   │   ├── EnemyEditor.jsx    # F3 Enemy editor + ENEMY_DATABASE
│   │   │   │   ├── GameScene.jsx      # Basic scene setup (UNUSED?)
│   │   │   │   ├── ItemDatabaseEditor.jsx  # Item editor
│   │   │   │   ├── LootPanel.jsx      # Loot window + LOOT_ITEMS database
│   │   │   │   ├── Monsters.jsx       # Monster spawns (UNUSED?)
│   │   │   │   ├── NPCs.jsx           # NPC definitions (UNUSED?)
│   │   │   │   ├── Player.jsx         # Player mesh (UNUSED?)
│   │   │   │   ├── QuestDialog.jsx    # Quest accept/turn-in UI
│   │   │   │   ├── QuestLog.jsx       # Quest tracking (L key)
│   │   │   │   ├── QuestMaker.jsx     # F7 Quest creation tool
│   │   │   │   ├── Resources.jsx      # Resource nodes (UNUSED?)
│   │   │   │   ├── SpellBook.jsx      # Spell definitions + UI
│   │   │   │   ├── Terrain.jsx        # Terrain generation (UNUSED?)
│   │   │   │   ├── TerrainEditor.jsx  # F2 Terrain tools
│   │   │   │   ├── TrainerPanel.jsx   # Skill trainer + WARRIOR_SPELLS
│   │   │   │   ├── VendorPanel.jsx    # Buy/sell interface
│   │   │   │   └── WorldEditor.jsx    # F1 Object placement tool
│   │   │   │
│   │   │   ├── hud/               # Heads-up display
│   │   │   │   ├── HUD.jsx            # Main HUD container
│   │   │   │   ├── Minimap.jsx        # Corner minimap
│   │   │   │   ├── WorldMap.jsx       # Full world map (M key)
│   │   │   │   └── ChatBox.jsx        # Chat interface
│   │   │   │
│   │   │   ├── panels/            # Character panels
│   │   │   │   ├── CharacterPanel.jsx # Stats/equipment (C key)
│   │   │   │   ├── InventoryPanel.jsx # Inventory view
│   │   │   │   ├── QuestPanel.jsx     # Quest list panel
│   │   │   │   └── SkillsPanel.jsx    # Skills view
│   │   │   │
│   │   │   └── ui/                # Shadcn UI components
│   │   │       └── [40+ UI components]
│   │   │
│   │   ├── store/
│   │   │   └── gameStore.js       # Zustand state management
│   │   │
│   │   ├── hooks/
│   │   │   └── use-toast.js       # Toast notifications
│   │   │
│   │   └── lib/
│   │       └── utils.js           # Utility functions
│   │
│   └── .env                   # Backend URL
│
└── memory/
    └── PRD.md                 # Product requirements
```

---

## 🎮 GameWorld.jsx Breakdown (9,456 lines)

This file is the main bottleneck. Here's what's inside:

### Section Map

| Lines | Section | Description | Refactor To |
|-------|---------|-------------|-------------|
| 29-333 | Terrain Noise Functions | Perlin noise, terrain generation | `hooks/useTerrain.js` |
| 335-410 | Core Refs & State | ~75 useRef, ~50 useState | Keep in GameWorld |
| 410-554 | XP/Leveling System | Level calculations, XP gain | `hooks/useExperience.js` |
| 566-600 | Combat State | Auto-attack, regen, cooldowns | `hooks/useCombat.js` |
| 618-670 | Panel States | UI panel open/close state | Keep in GameWorld |
| 677-962 | Notification System | Toast/damage numbers | `hooks/useNotifications.js` |
| 963-1173 | Death/Resurrection | Ghost mode, corpse run | `hooks/useDeathSystem.js` |
| 1175-1282 | Quest Kill Tracking | Kill objective updates | `hooks/useQuestTracking.js` |
| 1622-1694 | Attack Animations | Arm swing animations | `hooks/useAttackAnimation.js` |
| 2681-3588 | Terrain & Graveyard | Scene geometry creation | `components/game/SceneSetup.jsx` |
| 3920-6350 | Asset Creation | createWorldAsset (2400+ lines) | `utils/assetFactory.js` |
| 6360-6520 | World Object Loading | Load from database | `hooks/useWorldObjects.js` |
| 6530-6720 | Zone Content | Static zone NPCs/objects | `data/zoneContent.js` |
| 6720-8200 | Controls & Input | Keyboard/mouse handling | `hooks/useControls.js` |
| 8226-8606 | Enemy AI | Patrol, aggro, combat | `hooks/useEnemyAI.js` |
| 8607-9456 | Render & JSX | Main render function | Keep in GameWorld |

---

## 🔌 Backend API Endpoints (server.py)

### Auth Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |

### Player Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/player/me` | Get player data |
| POST | `/api/player/character` | Create character |
| PUT | `/api/player/position` | Update position |
| POST | `/api/player/save-all` | Save all game state |
| GET | `/api/player/game-state` | Load game state |

### Quest Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quests/available` | List available quests |
| POST | `/api/quests/accept/{id}` | Accept quest |
| POST | `/api/quests/progress` | Update quest progress |
| POST | `/api/quests/abandon/{id}` | Abandon quest |
| GET | `/api/quests/global` | List global quests |
| POST | `/api/quests/global` | Create global quest |
| PUT | `/api/quests/global/assign/{id}` | Assign to NPC |

### World Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/world/objects` | Get placed objects |
| POST | `/api/world/objects` | Place object |
| DELETE | `/api/world/objects/{id}` | Remove object |
| GET | `/api/world/enemies` | Get placed enemies |
| GET | `/api/terrain` | Get terrain data |
| POST | `/api/terrain` | Save terrain |

### Inventory/Skills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get inventory |
| POST | `/api/inventory/add` | Add item |
| POST | `/api/skills/train` | Train skill |

---

## 🗃️ Database Collections

| Collection | Purpose |
|------------|---------|
| `players` | User accounts & characters |
| `world_objects` | Placed buildings, NPCs, props |
| `placed_enemies` | Enemy spawns |
| `global_quests` | Quest database |
| `custom_quests` | Per-user quests (legacy) |
| `terrain` | Terrain heightmap |
| `paths` | Road/path data |

---

## 🎹 Keyboard Controls

| Key | Action |
|-----|--------|
| WASD | Movement |
| Space | Jump |
| Tab | Target nearest enemy |
| 1-0 | Action bar spells |
| F1 | World Editor |
| F2 | Terrain Editor |
| F3 | Enemy Editor |
| F5 | Map Editor Mode |
| F6 | Flight Mode |
| F7 | Quest Maker |
| L | Quest Log |
| M | World Map |
| C | Character Panel |
| B | Bags |
| P | Spellbook |

---

## 🚨 Issues & Technical Debt

### Critical
1. **GameWorld.jsx is 9,456 lines** - Single file contains:
   - All game logic
   - All 3D rendering
   - All UI state
   - All event handlers
   
### High Priority
2. **Unused Components** - These files exist but aren't used:
   - `Buildings.jsx` - Rendering done in GameWorld
   - `Monsters.jsx` - Spawning done in GameWorld
   - `NPCs.jsx` - NPCs created in GameWorld
   - `Player.jsx` - Player mesh in GameWorld
   - `Resources.jsx` - Resources in GameWorld
   - `Terrain.jsx` - Terrain in GameWorld
   - `GameScene.jsx` - Scene setup in GameWorld

3. **Data scattered across files**:
   - `ENEMY_DATABASE` in EnemyEditor.jsx
   - `LOOT_ITEMS` in LootPanel.jsx
   - `WARRIOR_SPELLS` in TrainerPanel.jsx
   - `OBJECT_CATEGORIES` in WorldEditor.jsx

### Medium Priority
4. **Quest system workaround** - QuestDialog shows all quests instead of NPC-specific
5. **Wall rotation bug** - Rotation lost on save/load
6. **Vendor buy not implemented** - Only sell works

---

## 📋 Recommended Refactoring Plan

### Phase 1: Extract Hooks (Priority: High)
Create custom hooks to extract logic from GameWorld.jsx:

```
/frontend/src/hooks/
├── useExperience.js      # XP, leveling
├── useCombat.js          # Auto-attack, damage, cooldowns
├── useDeathSystem.js     # Ghost, corpse, resurrection
├── useQuestTracking.js   # Kill tracking, objectives
├── useControls.js        # Keyboard/mouse input
├── useEnemyAI.js         # Enemy patrol, aggro, combat
├── useWorldObjects.js    # Load/save placed objects
├── useNotifications.js   # Toast, damage numbers
└── useTerrain.js         # Terrain generation
```

### Phase 2: Extract Utils (Priority: Medium)
Move pure functions to utilities:

```
/frontend/src/utils/
├── assetFactory.js       # createWorldAsset function
├── terrainNoise.js       # Perlin noise functions
└── mathHelpers.js        # Vector calculations
```

### Phase 3: Consolidate Data (Priority: Medium)
Create centralized data files:

```
/frontend/src/data/
├── enemies.js            # ENEMY_DATABASE
├── items.js              # LOOT_ITEMS
├── spells.js             # All spell definitions
├── objects.js            # OBJECT_CATEGORIES
└── zones.js              # Zone content definitions
```

### Phase 4: Backend Organization (Priority: Low)
Split server.py into route modules:

```
/backend/
├── server.py             # Main app, middleware
├── routes/
│   ├── auth.py           # Auth routes
│   ├── player.py         # Player routes
│   ├── quests.py         # Quest routes
│   ├── world.py          # World object routes
│   └── inventory.py      # Inventory routes
├── models/
│   └── schemas.py        # Pydantic models
└── utils/
    └── auth.py           # JWT helpers
```

---

## 🔧 Quick Reference

### Adding a New Object Type
1. Add to `OBJECT_CATEGORIES` in `WorldEditor.jsx`
2. Add case in `createWorldAsset` in `GameWorld.jsx` (line ~3920)
3. Test with F1 World Builder

### Adding a New Enemy
1. Add to `ENEMY_DATABASE` in `EnemyEditor.jsx`
2. Place with F3 Enemy Editor

### Adding a New Spell
1. Add to `WARRIOR_SPELLS` in `TrainerPanel.jsx`
2. Add to `SPELLS` in `SpellBook.jsx`

### Adding a New Quest
1. Use F7 Quest Maker in-game
2. Assign to NPC from Quest Maker UI

---

*Last Updated: February 2026*
