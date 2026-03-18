# Quest of Honor - Product Requirements Document

## Original Problem Statement
Build a World of Warcraft-inspired RPG game called "Quest of Honor" - a browser-based MMORPG with features including combat, quests, skills, world building, and character progression.

## Codebase Organization (Updated Feb 2026)

### Directory Structure
```
/app/
├── CODEBASE_INDEX.md          # Comprehensive codebase documentation
├── backend/
│   └── server.py              # FastAPI backend (~1,235 lines)
├── frontend/src/
│   ├── data/                  # Centralized data files
│   │   ├── enemies.js         # ENEMY_DATABASE
│   │   ├── items.js           # LOOT_ITEMS + generateLoot
│   │   ├── spells.js          # WARRIOR_SPELLS
│   │   └── objects.js         # OBJECT_CATEGORIES
│   ├── systems/               # Extracted game systems
│   │   ├── PlayerMovementSystem.js  # WASD movement, jump, terrain follow
│   │   ├── CameraSystem.js          # WoW-style orbit camera
│   │   ├── EnemyAISystem.js         # Patrol, aggro, chase, leash, spread
│   │   └── CombatSystem.js          # Damage text, XP, health bars, constants
│   ├── hooks/game/            # (planned) Game-specific hooks
│   ├── pages/
│   │   └── GameWorld.jsx      # Main game (~8,987 lines, actively being refactored)
│   ├── components/
│   │   ├── game/              # Game UI components
│   │   │   └── _unused/       # Archived unused components
│   │   ├── hud/               # HUD components
│   │   ├── panels/            # Character panels
│   │   └── ui/                # Shadcn components
│   └── store/
│       └── gameStore.js       # Zustand state
└── memory/
    └── PRD.md                 # This file
```

### Refactoring Progress
- Data extraction: enemies.js, items.js, spells.js, objects.js
- System extraction: PlayerMovementSystem, CameraSystem, EnemyAISystem, CombatSystem
- 7 unused components archived to _unused/
- CODEBASE_INDEX.md created

## Core Features Implemented

### Character System
- Class selection (Warrior, Mage, Ranger, Paladin), customization
- Level progression (1-20) with XP bar
- Health, Mana, XP stats, death/resurrection

### Combat System (CombatSystem.js + GameWorld.jsx)
- Click-to-target, auto-attack toggle, spell casting with cooldowns
- Enemy AI (EnemyAISystem.js): patrol, aggro, chase, leash, spread positioning
- Floating damage text, health bars, loot drops
- XP/leveling calculations extracted to CombatSystem.js

### Quest System
- Global Quest Database (F7 Quest Maker)
- NPC quest assignment with yellow markers
- Kill tracking, quest turn-in, rewards
- Quest Log (L key)

### World Building
- World Builder (F1), Terrain Editor (F2), Enemy Editor (F3)
- Object rotation persistence (fixed Feb 2026)

### Map & Economy
- 3D Minimap, World Map (M key), zone system
- Copper/Gold currency, vendor selling

## Pending Tasks

### P0 - Deferred
- Custom hooks extraction (useQuesting, useExperience, usePlayerState)

### P1 - Medium Priority
- Vendor Buy System

### P2 - Lower Priority
- Spirit Healer NPC
- Weapon Swing Effects
- Quest Persistence to database
- Backend refactoring (split server.py)

## Database Collections
- `players`: Character data, position, level, XP
- `world_objects`: Placed items, NPCs, props (with rotation, global_quest_id)
- `global_quests`: Quests available to ALL players (with assigned_npc_id)
- `custom_quests`: Player-created quests (per-user, legacy)
- `placed_enemies`: Spawned monsters for respawning

## API Endpoints

### Auth & Player
- POST /api/auth/register, /api/auth/login
- GET /api/player, POST /api/player/save-all

### Quest System
- GET /api/quests/global, POST /api/quests/global
- PUT /api/quests/global/{id}/assign, /api/quests/global/{id}/unassign

### World
- GET /api/world/objects, POST /api/world/objects
- POST /api/world/objects/bulk
- GET /api/terrain, POST /api/terrain

## Bug Fixes Applied (Feb 2026)
- Object rotation persistence: Added rotation, level, subType, quest fields to handleSaveWorld object mapping
- Quest Dialog NPC filtering: Fixed trainer path missing setQuestGiverId; tightened fallback filter to not show all quests when npcId is null
- Mouse wheel zoom: P2, pending user verification
