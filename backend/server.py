from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
import json
import asyncio
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'quest_of_honor_secret_key_2025_change_in_production')
JWT_ALGORITHM = 'HS256'

# Create the main app
app = FastAPI(title="Quest Of Honor API - Single Player Edition")
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ==================== MODELS ====================

class PlayerCreate(BaseModel):
    username: str
    password: str
    email: str

class PlayerLogin(BaseModel):
    username: str
    password: str

class CharacterCreate(BaseModel):
    name: str
    gender: str = "male"
    hair_color: str = "#8B4513"
    skin_tone: str = "#D2B48C"
    class_type: str = "warrior"

class SkillUpdate(BaseModel):
    skill_name: str
    xp_gained: int

class InventoryItem(BaseModel):
    item_id: str
    name: str
    type: str
    quantity: int = 1
    stats: Dict[str, Any] = {}

class QuestProgress(BaseModel):
    quest_id: str
    progress: Dict[str, Any]

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(player_id: str, username: str) -> str:
    payload = {
        'player_id': player_id,
        'username': username,
        'exp': datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== DEFAULT DATA ====================

DEFAULT_SKILLS = {
    "attack": {"level": 1, "xp": 0},
    "defense": {"level": 1, "xp": 0},
    "strength": {"level": 1, "xp": 0},
    "hitpoints": {"level": 10, "xp": 1154},
    "mining": {"level": 1, "xp": 0},
    "woodcutting": {"level": 1, "xp": 0},
    "fishing": {"level": 1, "xp": 0},
    "cooking": {"level": 1, "xp": 0},
    "crafting": {"level": 1, "xp": 0},
    "magic": {"level": 1, "xp": 0}
}

STARTER_INVENTORY = [
    {"item_id": "bronze_sword", "name": "Bronze Sword", "type": "weapon", "quantity": 1, "stats": {"attack": 4}},
    {"item_id": "wooden_shield", "name": "Wooden Shield", "type": "shield", "quantity": 1, "stats": {"defense": 2}},
    {"item_id": "bread", "name": "Bread", "type": "food", "quantity": 5, "stats": {"heal": 5}},
    {"item_id": "gold_coins", "name": "Gold Coins", "type": "currency", "quantity": 25, "stats": {}}
]

AVAILABLE_QUESTS = [
    {
        "quest_id": "tutorial_quest",
        "name": "The Beginning",
        "description": "Learn the basics of Quest Of Honor. Speak to the Tutorial Guide.",
        "objectives": [
            {"id": "speak_guide", "description": "Speak to Tutorial Guide", "required": 1},
            {"id": "kill_goblin", "description": "Kill a Goblin", "required": 1},
            {"id": "mine_copper", "description": "Mine Copper Ore", "required": 3}
        ],
        "rewards": {"xp": {"attack": 50, "mining": 30}, "items": [{"item_id": "iron_pickaxe", "name": "Iron Pickaxe", "type": "tool", "quantity": 1}]},
        "difficulty": "easy"
    },
    {
        "quest_id": "goblin_slayer",
        "name": "Goblin Menace",
        "description": "The village is under threat from goblins. Eliminate them!",
        "objectives": [
            {"id": "kill_goblins", "description": "Kill Goblins", "required": 10}
        ],
        "rewards": {"xp": {"attack": 200, "defense": 100}, "items": [{"item_id": "steel_sword", "name": "Steel Sword", "type": "weapon", "quantity": 1, "stats": {"attack": 12}}]},
        "difficulty": "medium"
    },
    {
        "quest_id": "master_miner",
        "name": "The Master Miner",
        "description": "Prove your mining prowess to the Mining Guild.",
        "objectives": [
            {"id": "mine_copper", "description": "Mine Copper Ore", "required": 20},
            {"id": "mine_iron", "description": "Mine Iron Ore", "required": 10},
            {"id": "mine_gold", "description": "Mine Gold Ore", "required": 5}
        ],
        "rewards": {"xp": {"mining": 500}, "items": [{"item_id": "mithril_pickaxe", "name": "Mithril Pickaxe", "type": "tool", "quantity": 1}]},
        "difficulty": "hard"
    }
]

# Game world zones
WORLD_ZONES = [
    {"zone_id": "starter_village", "name": "Oakvale Village", "type": "safe", "level_range": [1, 10]},
    {"zone_id": "goblin_forest", "name": "Darkwood Forest", "type": "combat", "level_range": [5, 15]},
    {"zone_id": "mining_caves", "name": "Ironstone Mines", "type": "skill", "level_range": [1, 50]},
    {"zone_id": "lake_district", "name": "Silver Lake", "type": "skill", "level_range": [1, 40]},
    {"zone_id": "castle_ruins", "name": "Fallen Keep", "type": "combat", "level_range": [20, 40]}
]

# Monsters
MONSTERS = {
    "goblin": {"name": "Goblin", "hp": 20, "attack": 3, "defense": 2, "xp": 15, "drops": ["goblin_ear", "gold_coins"]},
    "wolf": {"name": "Wolf", "hp": 35, "attack": 6, "defense": 4, "xp": 25, "drops": ["wolf_pelt", "raw_meat"]},
    "skeleton": {"name": "Skeleton", "hp": 50, "attack": 10, "defense": 8, "xp": 50, "drops": ["bones", "ancient_coin"]},
    "troll": {"name": "Troll", "hp": 100, "attack": 15, "defense": 12, "xp": 100, "drops": ["troll_hide", "gold_coins"]}
}

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(player: PlayerCreate):
    # Check if username exists (only fetch _id for efficiency)
    existing = await db.players.find_one({"username": player.username}, {"_id": 1})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_email = await db.players.find_one({"email": player.email}, {"_id": 1})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    player_id = str(uuid.uuid4())
    player_doc = {
        "id": player_id,
        "username": player.username,
        "email": player.email,
        "password_hash": hash_password(player.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "character": None,
        "skills": DEFAULT_SKILLS,
        "inventory": STARTER_INVENTORY,
        "equipment": {},
        "quests": {"active": [], "completed": []},
        "position": {"x": 0, "y": 0, "z": 0, "zone": "starter_village"},
        "stats": {"hp": 100, "max_hp": 100, "mana": 50, "max_mana": 50},
        "copper": 2500,  # Starting currency (25 gold = 2500 copper)
        "learned_spells": ["warrior_attack"],
        "action_bar": ["warrior_attack", None, None, None, None, None],
        "combat_level": 1,
        "experience": 0
    }
    
    await db.players.insert_one(player_doc)
    
    token = create_token(player_id, player.username)
    return {"token": token, "player_id": player_id, "username": player.username}

@api_router.post("/auth/login")
async def login(credentials: PlayerLogin):
    player = await db.players.find_one({"username": credentials.username}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, player['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(player['id'], player['username'])
    return {
        "token": token,
        "player_id": player['id'],
        "username": player['username'],
        "has_character": player.get('character') is not None
    }

# ==================== PLAYER ROUTES ====================

@api_router.get("/player/me")
async def get_player(auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']}, {"_id": 0, "password_hash": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api_router.post("/player/character")
async def create_character(character: CharacterCreate, auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']})
    if player.get('character'):
        raise HTTPException(status_code=400, detail="Character already exists")
    
    char_data = character.model_dump()
    char_data['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {"character": char_data}}
    )
    
    return {"message": "Character created", "character": char_data}

@api_router.put("/player/position")
async def update_position(position: Dict[str, Any], auth: dict = Depends(verify_token)):
    # Build update data
    update_data = {"position": {k: v for k, v in position.items() if k in ['x', 'y', 'z', 'zone']}}
    
    # Also save experience and level if provided
    if 'combat_level' in position:
        update_data['combat_level'] = position['combat_level']
    if 'experience' in position:
        update_data['experience'] = position['experience']
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": update_data}
    )
    return {"message": "Position updated"}

@api_router.post("/player/position-beacon")
async def update_position_beacon(data: Dict[str, Any]):
    """
    Beacon endpoint for saving position on page unload.
    Uses token in body since sendBeacon can't set custom headers.
    """
    token = data.get('token')
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        player_id = payload['player_id']
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Build update data
    update_data = {}
    if 'x' in data and 'y' in data and 'z' in data:
        update_data['position'] = {
            'x': data['x'],
            'y': data['y'],
            'z': data['z'],
            'zone': data.get('zone', 'starter_village')
        }
    
    # Also save experience and level if provided
    if 'combat_level' in data:
        update_data['combat_level'] = data['combat_level']
    if 'experience' in data:
        update_data['experience'] = data['experience']
    
    if update_data:
        await db.players.update_one(
            {"id": player_id},
            {"$set": update_data}
        )
    
    return {"message": "Position saved via beacon"}

# ==================== GAME STATE ROUTES ====================

@api_router.post("/player/learn-spell")
async def learn_spell(data: Dict[str, Any], auth: dict = Depends(verify_token)):
    """Learn a new spell and deduct copper"""
    spell_id = data.get('spell_id')
    cost = data.get('cost', 0)  # Cost in copper
    
    if not spell_id:
        raise HTTPException(status_code=400, detail="Spell ID required")
    
    player = await db.players.find_one({"id": auth['player_id']}, {"_id": 0, "copper": 1, "learned_spells": 1})
    
    current_copper = player.get('copper', 0)
    learned = player.get('learned_spells', ['warrior_attack'])
    
    if spell_id in learned:
        raise HTTPException(status_code=400, detail="Spell already learned")
    
    if current_copper < cost:
        raise HTTPException(status_code=400, detail="Not enough gold")
    
    # Add spell and deduct copper
    await db.players.update_one(
        {"id": auth['player_id']},
        {
            "$push": {"learned_spells": spell_id},
            "$inc": {"copper": -cost}
        }
    )
    
    return {"message": "Spell learned", "spell_id": spell_id, "new_copper": current_copper - cost}

@api_router.put("/player/action-bar")
async def update_action_bar(data: Dict[str, Any], auth: dict = Depends(verify_token)):
    """Save action bar configuration"""
    action_bar = data.get('action_bar', [])
    
    if not isinstance(action_bar, list) or len(action_bar) != 6:
        raise HTTPException(status_code=400, detail="Action bar must be a list of 6 items")
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {"action_bar": action_bar}}
    )
    
    return {"message": "Action bar saved"}

@api_router.put("/player/copper")
async def update_copper(data: Dict[str, Any], auth: dict = Depends(verify_token)):
    """Update player copper (for purchases, rewards, looting, etc.)"""
    copper_change = data.get('amount', 0)
    
    result = await db.players.find_one_and_update(
        {"id": auth['player_id']},
        {"$inc": {"copper": copper_change}},
        return_document=True,
        projection={"_id": 0, "copper": 1}
    )
    
    return {"copper": result.get('copper', 0)}

@api_router.get("/player/game-state")
async def get_game_state(auth: dict = Depends(verify_token)):
    """Get all game state data for a player"""
    player = await db.players.find_one(
        {"id": auth['player_id']},
        {"_id": 0, "learned_spells": 1, "action_bar": 1, "copper": 1, "experience": 1, "combat_level": 1, "position": 1}
    )
    
    return {
        "learned_spells": player.get('learned_spells', ['warrior_attack']),
        "action_bar": player.get('action_bar', ['warrior_attack', None, None, None, None, None]),
        "copper": player.get('copper', 2500),
        "experience": player.get('experience', 0),
        "combat_level": player.get('combat_level', 1),
        "position": player.get('position', {"x": 0, "y": 0, "z": 0, "zone": "starter_village"})
    }

# World objects and enemies endpoints moved to line 858+ with improved implementations

@api_router.get("/world/paths")
async def get_paths(zone: str = "starter_village"):
    """Get paths for a zone"""
    paths = await db.paths.find_one({"zone": zone}, {"_id": 0})
    return {"paths": paths}

@api_router.post("/player/save-all")
async def save_all_game_data(data: Dict[str, Any], auth: dict = Depends(verify_token)):
    """
    Comprehensive save endpoint - saves all player data and world state on logout.
    This includes: position, copper, inventory, equipment, bags, skills, 
    terrain modifications, and placed world objects.
    """
    player_id = auth['player_id']
    
    # Build player update dict
    player_update = {}
    
    # Save position
    if 'position' in data:
        player_update['position'] = data['position']
    
    # Save currency
    if 'copper' in data:
        player_update['copper'] = data['copper']
    
    # Save inventory (backpack items)
    if 'backpack' in data:
        player_update['backpack'] = data['backpack']
    
    # Save equipment (worn items)
    if 'equipment' in data:
        player_update['equipment'] = data['equipment']
    
    # Save bags (4 extra bag slots with their contents)
    if 'bags' in data:
        player_update['bags'] = data['bags']
    
    # Save skills
    if 'skills' in data:
        player_update['skills'] = data['skills']
    
    # Save learned spells
    if 'learned_spells' in data:
        player_update['learned_spells'] = data['learned_spells']
    
    # Save action bar
    if 'action_bar' in data:
        player_update['action_bar'] = data['action_bar']
    
    # Save combat stats
    if 'combat_level' in data:
        player_update['combat_level'] = data['combat_level']
    if 'experience' in data:
        player_update['experience'] = data['experience']
    
    # Update player document
    if player_update:
        await db.players.update_one(
            {"id": player_id},
            {"$set": player_update}
        )
    
    # Save terrain if provided
    if 'terrain' in data and data['terrain']:
        terrain_data = data['terrain']
        terrain_data["modified_at"] = datetime.now(timezone.utc).isoformat()
        terrain_data["modified_by"] = player_id
        
        await db.terrain.update_one(
            {"terrain_id": terrain_data.get("terrain_id", "main_terrain")},
            {"$set": terrain_data},
            upsert=True
        )
    
    # Save world objects (NPCs, buildings, decorations) if provided
    if 'world_objects' in data and data['world_objects']:
        objects = data['world_objects']
        zone = data.get('zone', 'starter_village')
        
        # Clear existing objects in zone and save new ones
        await db.world_objects.delete_many({"zone": zone})
        
        if objects:
            for obj in objects:
                obj['zone'] = zone
                obj['saved_by'] = player_id
                obj['saved_at'] = datetime.now(timezone.utc).isoformat()
            await db.world_objects.insert_many(objects)
    
    # Save placed enemies if provided
    if 'placed_enemies' in data and data['placed_enemies']:
        enemies = data['placed_enemies']
        
        # Clear existing enemies and save new ones
        await db.placed_enemies.delete_many({})
        
        if enemies:
            for enemy in enemies:
                enemy['saved_by'] = player_id
                enemy['saved_at'] = datetime.now(timezone.utc).isoformat()
            await db.placed_enemies.insert_many(enemies)
    
    # Save paths if provided
    if 'paths' in data and data['paths']:
        paths_data = data['paths']
        paths_data['saved_by'] = player_id
        paths_data['saved_at'] = datetime.now(timezone.utc).isoformat()
        paths_data['zone'] = data.get('zone', 'starter_village')
        
        # Upsert paths
        await db.paths.update_one(
            {"zone": paths_data['zone']},
            {"$set": paths_data},
            upsert=True
        )
    
    return {"message": "All game data saved successfully", "saved_at": datetime.now(timezone.utc).isoformat()}

# ==================== SKILLS ROUTES ====================

@api_router.get("/skills")
async def get_skills(auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']}, {"_id": 0, "skills": 1})
    return player.get('skills', DEFAULT_SKILLS)

@api_router.post("/skills/train")
async def train_skill(skill_update: SkillUpdate, auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']})
    skills = player.get('skills', DEFAULT_SKILLS)
    
    if skill_update.skill_name not in skills:
        raise HTTPException(status_code=400, detail="Invalid skill")
    
    skill = skills[skill_update.skill_name]
    skill['xp'] += skill_update.xp_gained
    
    # Level up calculation (RuneScape-style XP curve)
    new_level = calculate_level(skill['xp'])
    level_up = new_level > skill['level']
    skill['level'] = new_level
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {f"skills.{skill_update.skill_name}": skill}}
    )
    
    return {"skill": skill_update.skill_name, "level": new_level, "xp": skill['xp'], "level_up": level_up}

def calculate_level(xp: int) -> int:
    """Calculate level from XP using RuneScape-style formula"""
    level = 1
    total_xp = 0
    while level < 99:
        xp_for_level = int(level + 300 * (2 ** (level / 7))) // 4
        total_xp += xp_for_level
        if total_xp > xp:
            break
        level += 1
    return level

# ==================== INVENTORY ROUTES ====================

@api_router.get("/inventory")
async def get_inventory(auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']}, {"_id": 0, "inventory": 1, "gold": 1})
    return {"inventory": player.get('inventory', []), "gold": player.get('gold', 0)}

@api_router.post("/inventory/add")
async def add_item(item: InventoryItem, auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']})
    inventory = player.get('inventory', [])
    
    # Check if item exists and is stackable
    existing = next((i for i in inventory if i['item_id'] == item.item_id), None)
    if existing and item.type in ['currency', 'resource', 'food']:
        existing['quantity'] += item.quantity
    else:
        inventory.append(item.model_dump())
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {"inventory": inventory}}
    )
    
    return {"message": "Item added", "inventory": inventory}

@api_router.post("/inventory/equip/{item_id}")
async def equip_item(item_id: str, auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']})
    inventory = player.get('inventory', [])
    equipment = player.get('equipment', {})
    
    item = next((i for i in inventory if i['item_id'] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    slot = item['type']
    if slot in equipment:
        # Unequip current item
        inventory.append(equipment[slot])
    
    equipment[slot] = item
    inventory = [i for i in inventory if i['item_id'] != item_id]
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {"inventory": inventory, "equipment": equipment}}
    )
    
    return {"message": "Item equipped", "equipment": equipment}

# ==================== QUESTS ROUTES ====================

@api_router.get("/quests/available")
async def get_available_quests(auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']}, {"_id": 0, "quests": 1})
    completed_ids = [q['quest_id'] for q in player.get('quests', {}).get('completed', [])]
    active_ids = [q['quest_id'] for q in player.get('quests', {}).get('active', [])]
    
    available = [q for q in AVAILABLE_QUESTS if q['quest_id'] not in completed_ids and q['quest_id'] not in active_ids]
    return {"available": available, "active": player.get('quests', {}).get('active', []), "completed": player.get('quests', {}).get('completed', [])}

@api_router.post("/quests/accept/{quest_id}")
async def accept_quest(quest_id: str, auth: dict = Depends(verify_token)):
    quest = next((q for q in AVAILABLE_QUESTS if q['quest_id'] == quest_id), None)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    player = await db.players.find_one({"id": auth['player_id']})
    active_quests = player.get('quests', {}).get('active', [])
    
    if any(q['quest_id'] == quest_id for q in active_quests):
        raise HTTPException(status_code=400, detail="Quest already active")
    
    quest_progress = {
        **quest,
        "progress": {obj['id']: 0 for obj in quest['objectives']},
        "accepted_at": datetime.now(timezone.utc).isoformat()
    }
    
    active_quests.append(quest_progress)
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {"quests.active": active_quests}}
    )
    
    return {"message": "Quest accepted", "quest": quest_progress}

@api_router.post("/quests/progress")
async def update_quest_progress(progress: QuestProgress, auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']})
    active_quests = player.get('quests', {}).get('active', [])
    
    quest_idx = next((i for i, q in enumerate(active_quests) if q['quest_id'] == progress.quest_id), None)
    if quest_idx is None:
        raise HTTPException(status_code=404, detail="Quest not active")
    
    quest = active_quests[quest_idx]
    for key, value in progress.progress.items():
        if key in quest['progress']:
            quest['progress'][key] = min(value, next(o['required'] for o in quest['objectives'] if o['id'] == key))
    
    # Check if quest is complete
    complete = all(
        quest['progress'][obj['id']] >= obj['required']
        for obj in quest['objectives']
    )
    
    if complete:
        quest['completed_at'] = datetime.now(timezone.utc).isoformat()
        completed_quests = player.get('quests', {}).get('completed', [])
        completed_quests.append(quest)
        active_quests.pop(quest_idx)
        
        # Award rewards
        rewards = quest.get('rewards', {})
        skills = player.get('skills', DEFAULT_SKILLS)
        for skill_name, xp in rewards.get('xp', {}).items():
            if skill_name in skills:
                skills[skill_name]['xp'] += xp
                skills[skill_name]['level'] = calculate_level(skills[skill_name]['xp'])
        
        inventory = player.get('inventory', [])
        for item in rewards.get('items', []):
            inventory.append(item)
        
        await db.players.update_one(
            {"id": auth['player_id']},
            {"$set": {"quests.active": active_quests, "quests.completed": completed_quests, "skills": skills, "inventory": inventory}}
        )
        
        return {"message": "Quest completed!", "complete": True, "rewards": rewards}
    
    active_quests[quest_idx] = quest
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {"quests.active": active_quests}}
    )
    
    return {"message": "Progress updated", "complete": False, "quest": quest}

@api_router.post("/quests/abandon/{quest_id}")
async def abandon_quest(quest_id: str, auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']})
    active_quests = player.get('quests', {}).get('active', [])
    
    active_quests = [q for q in active_quests if q['quest_id'] != quest_id]
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {"quests.active": active_quests}}
    )
    
    return {"message": "Quest abandoned"}

# Custom quest creation
@api_router.post("/quests/custom/create")
async def create_custom_quest(quest: Dict[str, Any], auth: dict = Depends(verify_token)):
    """Create a custom quest"""
    # Add creator info
    quest['creator_id'] = auth['player_id']
    quest['created_at'] = datetime.now(timezone.utc).isoformat()
    
    # Save to custom_quests collection
    result = await db.custom_quests.insert_one(quest)
    quest['_id'] = str(result.inserted_id)
    
    return {"message": "Custom quest created", "quest": quest}

@api_router.get("/quests/custom/list")
async def list_custom_quests(auth: dict = Depends(verify_token)):
    """Get all custom quests created by player"""
    quests = await db.custom_quests.find({"creator_id": auth['player_id']}, {"_id": 0}).to_list(100)
    return {"quests": quests}

@api_router.put("/quests/custom/assign/{quest_id}")
async def assign_quest_to_npc(quest_id: str, npc_data: Dict[str, Any], auth: dict = Depends(verify_token)):
    """Assign a custom quest to an NPC"""
    # Update the quest with NPC ID
    await db.custom_quests.update_one(
        {"quest_id": quest_id, "creator_id": auth['player_id']},
        {"$set": {
            "npc_id": npc_data.get("npc_id"),
            "npc_name": npc_data.get("npc_name"),
            "npc_position": npc_data.get("npc_position")
        }}
    )
    
    # Update the NPC world object to mark it as quest giver
    await db.world_objects.update_one(
        {"id": npc_data.get("npc_id")},
        {"$set": {
            "quest_giver": True,
            "quest_id": quest_id
        }}
    )
    
    return {"message": "Quest assigned to NPC"}

@api_router.delete("/quests/custom/remove/{quest_id}")
async def remove_quest_from_npc(quest_id: str, auth: dict = Depends(verify_token)):
    """Remove a quest from its assigned NPC"""
    # First get the quest to find the NPC
    quest = await db.custom_quests.find_one({"quest_id": quest_id, "creator_id": auth['player_id']}, {"_id": 0})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    old_npc_id = quest.get("npc_id")
    
    # Clear NPC assignment from quest
    await db.custom_quests.update_one(
        {"quest_id": quest_id, "creator_id": auth['player_id']},
        {"$set": {
            "npc_id": None,
            "npc_name": None,
            "npc_position": None
        }}
    )
    
    # Remove quest_giver status from old NPC
    if old_npc_id:
        await db.world_objects.update_one(
            {"id": old_npc_id},
            {"$set": {
                "quest_giver": False,
                "quest_id": None
            }}
        )
    
    return {"message": "Quest removed from NPC"}

@api_router.get("/quests/custom/by-npc/{npc_id}")
async def get_quest_by_npc(npc_id: str):
    """Get quest assigned to an NPC"""
    quest = await db.custom_quests.find_one({"npc_id": npc_id}, {"_id": 0})
    return {"quest": quest}

# ==================== GLOBAL QUEST DATABASE ====================
# These quests are available to ALL players from any Quest Giver NPC

@api_router.post("/quests/global")
async def create_global_quest(quest: Dict[str, Any], auth: dict = Depends(verify_token)):
    """Create a global quest available to all players"""
    quest["quest_id"] = f"global_{datetime.now(timezone.utc).timestamp()}_{quest.get('name', 'quest').lower().replace(' ', '_')}"
    quest["is_global"] = True
    quest["created_by"] = auth['player_id']
    quest["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # Save to global_quests collection
    result = await db.global_quests.insert_one(quest)
    quest.pop('_id', None)
    return {"message": "Global quest created", "quest": quest}

@api_router.get("/quests/global")
async def list_global_quests(skip: int = 0, limit: int = 50):
    """Get all global quests (available to everyone) with pagination"""
    limit = min(limit, 100)  # Cap at 100 max
    quests = await db.global_quests.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"quests": quests}

@api_router.delete("/quests/global/{quest_id}")
async def delete_global_quest(quest_id: str, auth: dict = Depends(verify_token)):
    """Delete a global quest (only creator can delete)"""
    quest = await db.global_quests.find_one({"quest_id": quest_id})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Only the creator can delete
    if quest.get("created_by") != auth['player_id']:
        raise HTTPException(status_code=403, detail="You can only delete quests you created")
    
    await db.global_quests.delete_one({"quest_id": quest_id})
    return {"message": "Quest deleted"}

@api_router.put("/quests/global/{quest_id}")
async def update_global_quest(quest_id: str, quest_data: Dict[str, Any], auth: dict = Depends(verify_token)):
    """Update a global quest"""
    existing = await db.global_quests.find_one({"quest_id": quest_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Only the creator can update
    if existing.get("created_by") != auth['player_id']:
        raise HTTPException(status_code=403, detail="You can only edit quests you created")
    
    # Update the quest
    await db.global_quests.update_one(
        {"quest_id": quest_id},
        {"$set": quest_data}
    )
    return {"message": "Quest updated"}

@api_router.put("/quests/global/{quest_id}/assign")
async def assign_global_quest_to_npc(quest_id: str, data: Dict[str, Any], auth: dict = Depends(verify_token)):
    """Assign a global quest to an NPC"""
    npc_id = data.get("npc_id")
    npc_name = data.get("npc_name", "Quest Giver")
    
    existing = await db.global_quests.find_one({"quest_id": quest_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Get old NPC assignment to clear it
    old_npc_id = existing.get("assigned_npc_id")
    
    # Clear quest from old NPC if there was one
    if old_npc_id and old_npc_id != npc_id:
        await db.world_objects.update_one(
            {"id": old_npc_id},
            {"$set": {"quest_giver": False, "global_quest_id": None}}
        )
    
    # Update the quest with new NPC assignment
    await db.global_quests.update_one(
        {"quest_id": quest_id},
        {"$set": {
            "assigned_npc_id": npc_id,
            "assigned_npc_name": npc_name
        }}
    )
    
    # Update the new NPC world object to mark it as a quest giver
    if npc_id:
        await db.world_objects.update_one(
            {"id": npc_id},
            {"$set": {
                "quest_giver": True,
                "global_quest_id": quest_id
            }}
        )
    
    return {"message": "Quest assigned to NPC"}

@api_router.put("/quests/global/{quest_id}/unassign")
async def unassign_global_quest(quest_id: str, auth: dict = Depends(verify_token)):
    """Remove NPC assignment from a global quest"""
    existing = await db.global_quests.find_one({"quest_id": quest_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    old_npc_id = existing.get("assigned_npc_id")
    
    # Remove assignment from quest
    await db.global_quests.update_one(
        {"quest_id": quest_id},
        {"$unset": {"assigned_npc_id": "", "assigned_npc_name": ""}}
    )
    
    # Update the world object if it was assigned
    if old_npc_id:
        await db.world_objects.update_one(
            {"id": old_npc_id},
            {"$set": {"quest_giver": False, "global_quest_id": None}}
        )
    
    return {"message": "Quest unassigned"}

# ==================== COMBAT ROUTES ====================

@api_router.post("/combat/attack/{monster_type}")
async def attack_monster(monster_type: str, auth: dict = Depends(verify_token)):
    if monster_type not in MONSTERS:
        raise HTTPException(status_code=404, detail="Monster not found")
    
    monster = MONSTERS[monster_type].copy()
    player = await db.players.find_one({"id": auth['player_id']})
    skills = player.get('skills', DEFAULT_SKILLS)
    stats = player.get('stats', {"hp": 100, "max_hp": 100})
    equipment = player.get('equipment', {})
    
    # Calculate player attack
    attack_level = skills.get('attack', {}).get('level', 1)
    strength_level = skills.get('strength', {}).get('level', 1)
    weapon_bonus = equipment.get('weapon', {}).get('stats', {}).get('attack', 0)
    
    player_attack = attack_level + strength_level + weapon_bonus + random.randint(1, 10)
    monster_defense = monster['defense'] + random.randint(1, 5)
    
    damage_dealt = max(0, player_attack - monster_defense)
    monster['hp'] -= damage_dealt
    
    # Monster attacks back
    defense_level = skills.get('defense', {}).get('level', 1)
    shield_bonus = equipment.get('shield', {}).get('stats', {}).get('defense', 0)
    
    monster_attack = monster['attack'] + random.randint(1, 5)
    player_defense = defense_level + shield_bonus + random.randint(1, 5)
    
    damage_taken = max(0, monster_attack - player_defense)
    stats['hp'] = max(0, stats['hp'] - damage_taken)
    
    result = {
        "damage_dealt": damage_dealt,
        "damage_taken": damage_taken,
        "monster_hp": max(0, monster['hp']),
        "player_hp": stats['hp'],
        "monster_defeated": monster['hp'] <= 0
    }
    
    if monster['hp'] <= 0:
        # Award XP
        xp_gained = monster['xp']
        skills['attack']['xp'] += xp_gained // 2
        skills['defense']['xp'] += xp_gained // 2
        skills['attack']['level'] = calculate_level(skills['attack']['xp'])
        skills['defense']['level'] = calculate_level(skills['defense']['xp'])
        
        # Random drop
        if monster['drops'] and random.random() > 0.5:
            drop = random.choice(monster['drops'])
            result['drop'] = drop
        
        result['xp_gained'] = xp_gained
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {"stats": stats, "skills": skills}}
    )
    
    return result

@api_router.post("/combat/heal")
async def heal(auth: dict = Depends(verify_token)):
    player = await db.players.find_one({"id": auth['player_id']})
    inventory = player.get('inventory', [])
    stats = player.get('stats', {"hp": 100, "max_hp": 100})
    
    # Find food in inventory
    food_item = next((i for i in inventory if i['type'] == 'food' and i['quantity'] > 0), None)
    if not food_item:
        raise HTTPException(status_code=400, detail="No food available")
    
    heal_amount = food_item.get('stats', {}).get('heal', 10)
    stats['hp'] = min(stats['max_hp'], stats['hp'] + heal_amount)
    food_item['quantity'] -= 1
    
    if food_item['quantity'] <= 0:
        inventory = [i for i in inventory if i['item_id'] != food_item['item_id']]
    
    await db.players.update_one(
        {"id": auth['player_id']},
        {"$set": {"stats": stats, "inventory": inventory}}
    )
    
    return {"hp": stats['hp'], "healed": heal_amount}

# ==================== WORLD ROUTES ====================

@api_router.get("/world/zones")
async def get_zones():
    return {"zones": WORLD_ZONES}

@api_router.get("/world/monsters")
async def get_monsters():
    return {"monsters": MONSTERS}

# ==================== WORLD EDITOR ROUTES ====================

class WorldObject(BaseModel):
    id: str
    type: str
    subType: Optional[str] = None
    fullType: Optional[str] = None  # Full type identifier for proper loading (e.g., npc_trainer_warrior)
    name: str
    level: int = 1
    scale: float = 1.0
    position: Dict[str, float]
    rotation: Optional[Any] = 0  # Can be a number (Y rotation in degrees) or dict {"x": 0, "y": 0, "z": 0}
    zone: str = "starter_village"
    category: Optional[str] = None
    quest_id: Optional[str] = None
    quest_giver: Optional[bool] = False
    isVendor: Optional[bool] = False
    hasQuest: Optional[bool] = False

class TerrainData(BaseModel):
    """Terrain heightmap data for persistence"""
    terrain_id: str = "main_terrain"
    world_size: int = 600
    segments: int = 200
    seed: int = 42
    # Store heightmap as list of heights (flattened 2D array)
    heightmap: List[float] = []
    # Store vertex colors as list of RGB values
    colors: List[float] = []
    # Metadata
    created_at: Optional[str] = None
    modified_at: Optional[str] = None
    version: int = 1

class TerrainModification(BaseModel):
    """For future terrain editor - modify specific vertices"""
    terrain_id: str = "main_terrain"
    modifications: List[Dict[str, Any]] = []  # [{index: int, height: float, color: [r,g,b]}]

# ==================== TERRAIN PERSISTENCE ENDPOINTS ====================

@api_router.get("/terrain")
async def get_terrain():
    """Get saved terrain data"""
    terrain = await db.terrain.find_one({"terrain_id": "main_terrain"}, {"_id": 0})
    if terrain:
        return {"terrain": terrain, "exists": True}
    return {"terrain": None, "exists": False}

@api_router.post("/terrain")
async def save_terrain(data: TerrainData, auth: dict = Depends(verify_token)):
    """Save terrain heightmap data"""
    terrain_dict = data.model_dump()
    terrain_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    terrain_dict["modified_at"] = terrain_dict["created_at"]
    terrain_dict["created_by"] = auth['player_id']
    
    # Upsert - update if exists, insert if not
    await db.terrain.update_one(
        {"terrain_id": data.terrain_id},
        {"$set": terrain_dict},
        upsert=True
    )
    
    return {"message": "Terrain saved", "terrain_id": data.terrain_id}

@api_router.patch("/terrain")
async def modify_terrain(data: TerrainModification, auth: dict = Depends(verify_token)):
    """Modify specific terrain vertices (for future editor)"""
    terrain = await db.terrain.find_one({"terrain_id": data.terrain_id})
    if not terrain:
        raise HTTPException(status_code=404, detail="Terrain not found")
    
    heightmap = terrain.get("heightmap", [])
    colors = terrain.get("colors", [])
    
    # Apply modifications
    for mod in data.modifications:
        idx = mod.get("index")
        if idx is not None and idx < len(heightmap):
            if "height" in mod:
                heightmap[idx] = mod["height"]
            if "color" in mod and idx * 3 + 2 < len(colors):
                colors[idx * 3] = mod["color"][0]
                colors[idx * 3 + 1] = mod["color"][1]
                colors[idx * 3 + 2] = mod["color"][2]
    
    await db.terrain.update_one(
        {"terrain_id": data.terrain_id},
        {
            "$set": {
                "heightmap": heightmap,
                "colors": colors,
                "modified_at": datetime.now(timezone.utc).isoformat(),
                "version": terrain.get("version", 1) + 1
            }
        }
    )
    
    return {"message": f"Applied {len(data.modifications)} terrain modifications"}

@api_router.delete("/terrain/{terrain_id}")
async def delete_terrain(terrain_id: str, auth: dict = Depends(verify_token)):
    """Delete terrain data (reset to procedural generation)"""
    result = await db.terrain.delete_one({"terrain_id": terrain_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Terrain not found")
    return {"message": "Terrain deleted - will regenerate on next load"}

@api_router.get("/world/enemies")
async def get_placed_enemies(skip: int = 0, limit: int = 200):
    """Get all placed enemies in the world with pagination"""
    limit = min(limit, 500)  # Cap at 500 max
    enemies = await db.placed_enemies.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"enemies": enemies}

@api_router.post("/world/enemies")
async def save_placed_enemy(enemy: dict):
    """Save a single placed enemy to the world"""
    # Use upsert to update if exists or insert if new
    await db.placed_enemies.update_one(
        {"id": enemy["id"]},
        {"$set": enemy},
        upsert=True
    )
    return {"message": "Enemy saved", "id": enemy["id"]}

@api_router.delete("/world/enemies/{enemy_id}")
async def delete_placed_enemy(enemy_id: str):
    """Delete a placed enemy from the world"""
    result = await db.placed_enemies.delete_one({"id": enemy_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Enemy not found")
    return {"message": "Enemy deleted", "id": enemy_id}

@api_router.get("/world/objects")
async def get_world_objects(zone: Optional[str] = None):
    """Get all placed world objects, optionally filtered by zone"""
    query = {}
    if zone:
        query["zone"] = zone
    
    objects = await db.world_objects.find(query, {"_id": 0}).to_list(1000)
    return {"objects": objects}

@api_router.post("/world/objects")
async def create_world_object(obj: WorldObject, auth: dict = Depends(verify_token)):
    """Place a new object in the world"""
    obj_dict = obj.model_dump()
    obj_dict["created_by"] = auth['player_id']
    obj_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.world_objects.insert_one(obj_dict)
    
    # Remove _id from response
    obj_dict.pop('_id', None)
    return {"message": "Object placed", "object": obj_dict}

@api_router.delete("/world/objects/all")
async def delete_all_world_objects(auth: dict = Depends(verify_token)):
    """Delete ALL world objects (for testing/debugging)"""
    result = await db.world_objects.delete_many({})
    return {"message": f"Deleted {result.deleted_count} world objects"}

@api_router.delete("/world/objects/{object_id}")
async def delete_world_object(object_id: str, auth: dict = Depends(verify_token)):
    """Delete a world object"""
    result = await db.world_objects.delete_one({"id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Object not found")
    return {"message": "Object deleted"}

@api_router.post("/world/objects/bulk")
async def save_world_objects_bulk(data: Dict[str, Any], auth: dict = Depends(verify_token)):
    """Save multiple objects at once (for world imports)"""
    objects = data.get('objects', [])
    zone = data.get('zone', 'starter_village')
    
    # Delete existing objects in this zone (full replace)
    await db.world_objects.delete_many({"zone": zone})
    
    # Insert new objects
    if objects:
        for obj in objects:
            obj['zone'] = zone
            obj['created_by'] = auth['player_id']
            obj['created_at'] = datetime.now(timezone.utc).isoformat()
        await db.world_objects.insert_many(objects)
    
    return {"message": f"Saved {len(objects)} objects to {zone}"}

# ==================== STATUS ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Quest Of Honor API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router and setup
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Export for uvicorn - now just the FastAPI app (no Socket.IO wrapper)
application = app
