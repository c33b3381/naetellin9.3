# Quest of Honor - Product Requirements Document

## Original Problem Statement
A browser-based RPG game called "Quest of Honor" built with React, Three.js, FastAPI, and MongoDB. Features include a 3D game world, character management, quest system, world building tools, and combat.

## Core Features

### Implemented Features
- **Game World**: 3D world with multiple zones (Oakvale Village, Darkwood Forest, etc.)
- **Character System**: Player stats, inventory, equipment, skills
- **Combat System**: Auto-attack, abilities, monster battles
  - **Aggro Range**: 8 units (enemies engage when player is within 8 yards)
  - **Melee Range**: 5 units
  - **Leash Range**: 40 units (enemies return to spawn if player is too far)
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
- **Vendor System**:
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
- `/app/frontend/src/pages/GameWorld.jsx` - Main game component (~8000 lines)
- `/app/frontend/src/components/game/` - Game UI components
- `/app/frontend/src/store/gameStore.js` - Zustand state management

### Backend (FastAPI)
- `/app/backend/server.py` - All API endpoints
- MongoDB collections: players, world_objects, custom_quests, terrain, placed_enemies

### Key API Endpoints
- `POST /api/quests/custom/create` - Create custom quest
- `GET /api/quests/custom/list` - List player's custom quests
- `PUT /api/quests/custom/assign/{quest_id}` - Assign quest to NPC
- `DELETE /api/quests/custom/remove/{quest_id}` - Remove quest from NPC
- `GET /api/quests/custom/by-npc/{npc_id}` - Get quest assigned to NPC
- `GET/POST /api/world/enemies` - Bulk save/load placed enemies
- `POST /api/world/enemy/save` - Save/update a single enemy
- `DELETE /api/world/enemy/delete/{enemy_id}` - Delete a single enemy

## Recent Changes (December 2025)
- **Aggro Range Reduced**: Changed from 15 to 8 units for better gameplay balance
- **Mouse Wheel Zoom Fix**: Added `e.preventDefault()` and `{ passive: false }` to wheel event handler for reliable zoom in map editor
- **Randomized Patrol Patterns**: Enemies now have 7 different patrol patterns (circle, figure-8, triangle, line, diamond, zigzag, square) randomly assigned on spawn
- **Combat Spread Positioning**: Enemies no longer stack - they position around the player in 8 slots at 2 units distance (close combat)
- **Fixed Notification Spam**: Target selection notifications only show when selecting a NEW target (not re-clicking same target)
- **Fixed Aggro Notification**: Combat aggro notifications now properly check flag BEFORE showing to prevent spam
- **Fixed Enemy Duplication Bug**: Respawned enemies now DELETE old DB entry before creating new one
- **Loot Performance Optimization**: Batched state updates and stable notification refs to eliminate lag
- **Fixed Enemy Respawn During Gameplay**: Looting a corpse no longer cancels the respawn timer - enemies now properly respawn after being killed and looted
- **Player Death & Resurrection System**: 
  - Player dies when health reaches 0
  - "Release Corpse" dialog appears on death
  - Ghost mode teleports player to spawn (0,0)
  - Red corpse marker shows death location
  - "Revive" dialog appears when within 5 units of corpse
  - Revival restores 50% HP and Mana
  - Enemies ignore ghost players (no aggro)

## Known Issues
- None currently active

## Future Improvements
- Refactor GameWorld.jsx into smaller components
- Quest completion tracking and rewards
- More quest objective types
- Vendor buy system (players can buy items from vendors)

