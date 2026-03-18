# Quest of Honor - Product Requirements Document

## Original Problem Statement
Build a World of Warcraft-inspired RPG game called "Quest of Honor" - a browser-based MMORPG with features including combat, quests, skills, world building, and character progression.

## Codebase Organization (Updated Feb 2026)

### Directory Structure
```
/app/
├── CODEBASE_INDEX.md          # Comprehensive codebase documentation
├── backend/
│   └── server.py              # FastAPI backend (1,234 lines)
├── frontend/src/
│   ├── data/                  # 🆕 Centralized data files
│   │   └── enemies.js         # ENEMY_DATABASE (extracted)
│   ├── hooks/game/            # 🆕 Game-specific hooks (planned)
│   ├── utils/                 # 🆕 Utility functions (planned)
│   ├── pages/
│   │   └── GameWorld.jsx      # Main game (9,456 lines - needs splitting)
│   ├── components/
│   │   ├── game/              # Game components
│   │   │   └── _unused/       # 🆕 Archived unused components
│   │   ├── hud/               # HUD components
│   │   ├── panels/            # Character panels
│   │   └── ui/                # Shadcn components
│   └── store/
│       └── gameStore.js       # Zustand state
└── memory/
    └── PRD.md                 # This file
```

### Refactoring Progress
- ✅ Created `/data/enemies.js` - Extracted ENEMY_DATABASE (344 lines saved from EnemyEditor)
- ✅ Created `/data/items.js` - Extracted LOOT_ITEMS + generateLoot (812 lines saved from LootPanel)
- ✅ Created `/data/spells.js` - Extracted WARRIOR_SPELLS (173 lines saved from TrainerPanel)
- ✅ Moved 7 unused components to `_unused/` folder
- ✅ Created `CODEBASE_INDEX.md` - Full documentation
- ✅ Updated all imports to use new data files
- 🔄 Pending: Extract OBJECT_CATEGORIES from WorldEditor.jsx
- 🔄 Pending: Split GameWorld.jsx into hooks

## Core Features Implemented

### Character System
- Character creation with class selection (Warrior, Mage, Ranger, Paladin)
- Gender, hair color, and skin tone customization
- Level progression (1-50) with XP bar
- Health, Mana, and XP stats
- Death/resurrection system with ghost mode

### Combat System
- Click-to-target enemy selection
- Auto-attack toggle
- Spell casting with cooldowns
- Enemy AI with patrol patterns
- Loot drops from defeated enemies

### Quest System ✅ (COMPLETE - Dec 2025)
- **Global Quest Database** - Create quests via F7 Quest Maker, save to database
- **NPC Quest Assignment** - Assign quests to any NPC, visible to ALL players
- **Yellow Quest Markers** - NPCs with quests show yellow "!" indicator
- **Quest Acceptance** - Click NPC, view quest details, accept
- **Kill Tracking** - Real-time progress updates when killing target enemies
- **Quest Turn-in** - Return to NPC, "I've completed your task!", receive rewards
- **Quest Log (L)** - View active/completed quests, track progress, abandon quests
- **Rewards System** - XP and Gold awarded on quest completion

### World Building
- World Builder (F1) with extensive object categories
- Terrain Editor (F2) for landscape modification
- Enemy Editor (F3) for placing monsters
- Real-time preview of object scale/rotation

### Map System
- 3D Minimap in corner (real-time top-down view)
- World Map (M key) for navigation
- Zone system with different areas

### Economy
- Copper/Gold currency
- Vendor selling (buy system pending)
- Loot collection

## Technical Architecture

```
/app/
├── backend/
│   └── server.py       # FastAPI with MongoDB
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/     # QuestDialog, QuestMaker, QuestLog, WorldEditor
│   │   │   ├── hud/      # HUD, Minimap, WorldMap
│   │   │   └── panels/   # Inventory, Skills, Character panels
│   │   ├── pages/
│   │   │   └── GameWorld.jsx  # Main game component (8000+ lines)
│   │   └── store/
│   │       └── gameStore.js   # Zustand state management
└── memory/
    └── PRD.md
```

## Pending Tasks

### P1 - Medium Priority
- **Vendor Buy System**: Implement purchasing items from vendors

### P2 - Lower Priority
- **GameWorld.jsx Refactoring**: Break down into smaller components
- **Spirit Healer NPC**: Instant revive at graveyard
- **Weapon Swing Effects**: Visual attack animations
- **Quest Persistence**: Save player's active quests to database

## Database Collections
- `players`: Character data, position, level, XP
- `world_objects`: Placed items, NPCs, props (with rotation, global_quest_id)
- `global_quests`: Quests available to ALL players (with assigned_npc_id)
- `custom_quests`: Player-created quests (per-user, legacy)
- `placed_enemies`: Spawned monsters for respawning

## API Endpoints

### Quest System
- `GET /api/quests/global` - List all global quests
- `POST /api/quests/global` - Create global quest
- `PUT /api/quests/global/{id}/assign` - Assign quest to NPC
- `PUT /api/quests/global/{id}/unassign` - Remove NPC assignment
- `DELETE /api/quests/global/{id}` - Delete quest

## Completed This Session (Dec 2025)
- ✅ Global Quest Database system
- ✅ Quest Maker F7 UI with database tab
- ✅ NPC quest assignment with yellow markers
- ✅ Quest acceptance from NPCs
- ✅ Kill tracking with notifications
- ✅ Quest turn-in with XP/Gold rewards
- ✅ Quest Log with abandon functionality
- ✅ Cross-account quest visibility
