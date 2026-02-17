# Quest of Honor - Product Requirements Document

## Original Problem Statement
Build a World of Warcraft-inspired RPG game called "Quest of Honor" - a browser-based MMORPG with features including combat, quests, skills, world building, and character progression.

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

### Quest System ✅ (Updated Dec 2025)
- **Predefined Quests**: "Goblins in the Land!" - Kill 3 Goblins for 300 XP + 1 Gold
- Quest acceptance from Quest Giver NPCs
- Real-time kill tracking with notifications
- Quest turn-in system with rewards (XP, Gold)
- Quest Log (L key) showing active/completed quests
- Custom quest creation via Quest Maker (F7)

### World Building
- World Builder (F1) with extensive object categories:
  - Nature, Rocks & Minerals, Buildings, Walls & Fences
  - Props & Decor, Lighting, NPCs, Vendor NPCs
  - Monsters, Animals, Magical Items, Treasure & Loot
  - Crafting Stations, Furniture, Market & Trade
  - Dungeon & Prison, Military & Siege, Agriculture, Maritime
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
│   │   │   ├── game/     # QuestDialog, QuestLog, WorldEditor, etc.
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

### P0 - High Priority
- None currently

### P1 - Medium Priority
- **Vendor Buy System**: Implement purchasing items from vendors

### P2 - Lower Priority
- **GameWorld.jsx Refactoring**: Break down into smaller components
- **Spirit Healer NPC**: Instant revive at graveyard
- **Weapon Swing Effects**: Visual attack animations
- **Mouse Wheel Zoom**: Fix reliability in map editor

## Known Issues
- Custom quests created via Quest Maker don't persist across user accounts (use predefined quests instead)
- Objects placed before rotation fix need manual replacement

## Completed This Session (Dec 2025)
- ✅ Fixed World Builder Door icon error
- ✅ Created permanent "Goblins in the Land!" quest
- ✅ Implemented quest turn-in system with rewards
- ✅ Added progress tracking for kill quests
- ✅ **Global Quest Database** - Quests saved are available to ALL players
- ✅ **Updated Quest Maker (F7)** - Two tabs: Create Quest + Quest Database
- ✅ **"Save to Database" feature** - Saves quests globally for all accounts

## Database Collections
- `players`: Character data, position, level, XP
- `world_objects`: Placed items, NPCs, props (with rotation)
- `custom_quests`: Player-created quests (per-user)
- `global_quests`: **NEW** - Quests available to ALL players
- `placed_enemies`: Spawned monsters for respawning
