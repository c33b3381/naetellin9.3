# Quest of Honor - Product Requirements Document

## Original Problem Statement
A browser-based RPG game called "Quest of Honor" built with React, Three.js, FastAPI, and MongoDB. Features include a 3D game world, character management, quest system, world building tools, and combat.

## Core Features

### Implemented Features
- **Game World**: 3D world with multiple zones (Oakvale Village, Darkwood Forest, etc.)
- **Character System**: Player stats, inventory, equipment, skills
- **Combat System**: Auto-attack, abilities, monster battles
- **Editor Tools**:
  - F1: World Builder - Place NPCs, objects, furniture, **Vendor NPCs**
  - F2: Terrain Editor - Modify terrain height/color
  - F3: Enemy Editor - Spawn and customize enemies
  - F5: Map Editor Mode - Top-down world editing
  - F6: Flight Mode - Free camera movement
  - F7: Quest Maker - Create and assign custom quests
- **Quest System**:
  - Built-in quests from standard Quest Giver NPC
  - Custom Quest Maker (F7) for creating player-defined quests
  - Quest assignment to NPCs with visual "!" markers
  - Quest dialog integration for custom quests
  - Quest removal from NPCs
- **Vendor System** (NEW):
  - 8 vendor types: Blacksmith, General Goods, Trade Goods, Food/Water, Weapons, Armor, Potions, Magic
  - Visual gold coin indicator above vendor heads
  - VendorPanel UI for selling items from inventory
  - Different buy rates per vendor type (30-60%)
  - Right-click or double-click to interact
- **Player Persistence**: Position, inventory, and world state saved to database

### Quest Maker Workflow
1. Spawn NPC via F1 World Builder
2. Left-click NPC to select it (shows notification)
3. Press F7 to open Quest Maker
4. Create quest with name, description, objectives, rewards
5. Save quest → "Assign to NPC" button appears
6. Click assign to attach quest to selected NPC
7. Yellow "!" marker appears above NPC
8. Double-click NPC to open quest dialog and accept quest

## Technical Architecture

### Frontend (React + Three.js)
- `/app/frontend/src/pages/GameWorld.jsx` - Main game component (~7000 lines)
- `/app/frontend/src/components/game/` - Game UI components
- `/app/frontend/src/store/gameStore.js` - Zustand state management

### Backend (FastAPI)
- `/app/backend/server.py` - All API endpoints
- MongoDB collections: players, world_objects, custom_quests, terrain

### Key API Endpoints
- `POST /api/quests/custom/create` - Create custom quest
- `GET /api/quests/custom/list` - List player's custom quests
- `PUT /api/quests/custom/assign/{quest_id}` - Assign quest to NPC
- `DELETE /api/quests/custom/remove/{quest_id}` - Remove quest from NPC
- `GET /api/quests/custom/by-npc/{npc_id}` - Get quest assigned to NPC

## Known Issues
1. Mouse wheel zoom can become unreliable after toggling F5/F6 modes (P1)

## Future Improvements
- Refactor GameWorld.jsx into smaller components
- Quest completion tracking and rewards
- More quest objective types
