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
│   ├── systems/               # Extracted game systems (3,813 lines total)
│   │   ├── PlayerMovementSystem.js  # WASD movement, jump, terrain follow (300 lines)
│   │   ├── CameraSystem.js          # WoW-style orbit camera (226 lines)
│   │   ├── EnemyAISystem.js         # Patrol, aggro, chase, leash, spread (443 lines)
│   │   ├── CombatSystem.js          # Damage text, XP, health bars, constants (195 lines)
│   │   ├── WorldAssetFactory.js     # Procedural mesh generator (2,444 lines)
│   │   └── WorldObjectSystem.js     # Object persistence: load/save/normalize (205 lines)
│   ├── pages/
│   │   └── GameWorld.jsx      # Main game (~6,391 lines, down from 9,208)
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

### Refactoring Progress Summary
| Extraction | Lines Saved | Status |
|------------|-------------|--------|
| Data files (enemies, items, spells, objects) | ~2,000 | Done |
| PlayerMovementSystem.js | ~300 | Done |
| CameraSystem.js | ~225 | Done |
| EnemyAISystem.js | ~117 | Done |
| CombatSystem.js | ~100 | Done |
| WorldAssetFactory.js | ~2,425 | Done |
| WorldObjectSystem.js | ~172 | Done |
| **Total saved from GameWorld.jsx** | **~5,339** | |

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
- Procedural mesh generation via WorldAssetFactory.js
- Object persistence via WorldObjectSystem.js (rotation, quest fields preserved)

### Map & Economy
- 3D Minimap, World Map (M key), zone system
- Copper/Gold currency, vendor selling

## Bug Fixes Applied (Feb 2026)
- Object rotation persistence: Added rotation, level, subType, quest fields to save path
- Quest Dialog NPC filtering: Fixed trainer path + tightened fallback filter
- Preview parameter order: Fixed swapped name/level params
- Logout save enrichment: normalizeObjectForSave now sends full field set including subType, category, color, quest_id

## Pending Tasks

### P1 - Next Up
- Custom hooks extraction (useQuesting, useExperience, usePlayerState)
- Vendor Buy System

### P2 - Lower Priority
- Spirit Healer NPC
- Weapon Swing Effects
- Quest Persistence to database
- Backend refactoring (split server.py)
- Mouse wheel zoom verification (pending user check)

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
- POST /api/world/objects/bulk, DELETE /api/world/objects/{id}
- GET /api/terrain, POST /api/terrain
