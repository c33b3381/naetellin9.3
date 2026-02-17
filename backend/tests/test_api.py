"""
Quest Of Honor API Tests
Tests for: Auth, Player, Character, Skills, Inventory, Quests, Combat, World
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_USERNAME = f"test_user_{uuid.uuid4().hex[:8]}"
TEST_PASSWORD = "testpass123"
TEST_EMAIL = f"test_{uuid.uuid4().hex[:8]}@example.com"


class TestHealth:
    """Health check tests - run first"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Quest Of Honor API"
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def registered_user(self):
        """Register a test user and return credentials"""
        username = f"test_auth_{uuid.uuid4().hex[:8]}"
        password = "testpass123"
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": password,
            "email": email
        })
        
        if response.status_code == 200:
            data = response.json()
            return {
                "username": username,
                "password": password,
                "email": email,
                "token": data.get("token"),
                "player_id": data.get("player_id")
            }
        pytest.skip("Could not register test user")
    
    def test_register_new_user(self):
        """Test user registration"""
        username = f"test_reg_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "player_id" in data
        assert data["username"] == username
    
    def test_register_duplicate_username(self, registered_user):
        """Test registration with duplicate username fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": registered_user["username"],
            "password": "testpass123",
            "email": f"new_{uuid.uuid4().hex[:8]}@example.com"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data.get("detail", "").lower()
    
    def test_login_success(self, registered_user):
        """Test successful login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": registered_user["username"],
            "password": registered_user["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "player_id" in data
        assert "has_character" in data
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "nonexistent_user_xyz",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401


class TestPlayer:
    """Player management tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_player_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not create test user")
    
    def test_get_player_me(self, auth_headers):
        """Test getting current player data"""
        response = requests.get(f"{BASE_URL}/api/player/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "username" in data
        assert "skills" in data
        assert "inventory" in data
        assert "position" in data
    
    def test_get_player_unauthorized(self):
        """Test getting player without auth fails"""
        response = requests.get(f"{BASE_URL}/api/player/me")
        assert response.status_code in [401, 403]


class TestCharacter:
    """Character creation tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_char_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not create test user")
    
    def test_create_character(self, auth_headers):
        """Test character creation"""
        response = requests.post(f"{BASE_URL}/api/player/character", 
            headers=auth_headers,
            json={
                "name": "TestHero",
                "gender": "male",
                "hair_color": "#8B4513",
                "skin_tone": "#D2B48C",
                "class_type": "warrior"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "character" in data
        assert data["character"]["name"] == "TestHero"
        assert data["character"]["class_type"] == "warrior"
    
    def test_create_duplicate_character(self, auth_headers):
        """Test creating duplicate character fails"""
        response = requests.post(f"{BASE_URL}/api/player/character", 
            headers=auth_headers,
            json={
                "name": "AnotherHero",
                "gender": "female",
                "class_type": "mage"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data.get("detail", "").lower()


class TestPosition:
    """Position saving tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_pos_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}", "token": token}
        pytest.skip("Could not create test user")
    
    def test_update_position(self, auth_headers):
        """Test updating player position"""
        response = requests.put(f"{BASE_URL}/api/player/position",
            headers={"Authorization": auth_headers["Authorization"]},
            json={
                "x": 100.5,
                "y": 10.0,
                "z": 50.25,
                "zone": "starter_village"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Position updated"
    
    def test_position_beacon(self, auth_headers):
        """Test beacon endpoint for position saving"""
        response = requests.post(f"{BASE_URL}/api/player/position-beacon",
            json={
                "token": auth_headers["token"],
                "x": 200.0,
                "y": 15.0,
                "z": 100.0,
                "zone": "goblin_forest"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "saved" in data["message"].lower()


class TestSkills:
    """Skills system tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_skills_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not create test user")
    
    def test_get_skills(self, auth_headers):
        """Test getting player skills"""
        response = requests.get(f"{BASE_URL}/api/skills", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "attack" in data
        assert "defense" in data
        assert "mining" in data
        assert data["attack"]["level"] >= 1
    
    def test_train_skill(self, auth_headers):
        """Test training a skill"""
        response = requests.post(f"{BASE_URL}/api/skills/train",
            headers=auth_headers,
            json={
                "skill_name": "attack",
                "xp_gained": 100
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["skill"] == "attack"
        assert data["xp"] >= 100


class TestInventory:
    """Inventory system tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_inv_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not create test user")
    
    def test_get_inventory(self, auth_headers):
        """Test getting player inventory"""
        response = requests.get(f"{BASE_URL}/api/inventory", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "inventory" in data
        # New players should have starter items
        assert len(data["inventory"]) > 0
    
    def test_add_item(self, auth_headers):
        """Test adding item to inventory"""
        response = requests.post(f"{BASE_URL}/api/inventory/add",
            headers=auth_headers,
            json={
                "item_id": "test_potion",
                "name": "Test Potion",
                "type": "food",
                "quantity": 5,
                "stats": {"heal": 20}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "inventory" in data


class TestQuests:
    """Quest system tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_quest_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not create test user")
    
    def test_get_available_quests(self, auth_headers):
        """Test getting available quests"""
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
        assert "active" in data
        assert "completed" in data
        assert len(data["available"]) > 0
    
    def test_accept_quest(self, auth_headers):
        """Test accepting a quest"""
        response = requests.post(f"{BASE_URL}/api/quests/accept/tutorial_quest",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "quest" in data
        assert data["quest"]["quest_id"] == "tutorial_quest"
    
    def test_update_quest_progress(self, auth_headers):
        """Test updating quest progress"""
        response = requests.post(f"{BASE_URL}/api/quests/progress",
            headers=auth_headers,
            json={
                "quest_id": "tutorial_quest",
                "progress": {"speak_guide": 1}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "complete" in data


class TestCombat:
    """Combat system tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_combat_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not create test user")
    
    def test_attack_monster(self, auth_headers):
        """Test attacking a monster"""
        response = requests.post(f"{BASE_URL}/api/combat/attack/goblin",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "damage_dealt" in data
        assert "damage_taken" in data
        assert "monster_hp" in data
        assert "player_hp" in data
    
    def test_attack_invalid_monster(self, auth_headers):
        """Test attacking non-existent monster"""
        response = requests.post(f"{BASE_URL}/api/combat/attack/invalid_monster",
            headers=auth_headers
        )
        
        assert response.status_code == 404


class TestWorld:
    """World data tests"""
    
    def test_get_zones(self):
        """Test getting world zones"""
        response = requests.get(f"{BASE_URL}/api/world/zones")
        
        assert response.status_code == 200
        data = response.json()
        assert "zones" in data
        assert len(data["zones"]) > 0
    
    def test_get_monsters(self):
        """Test getting monster data"""
        response = requests.get(f"{BASE_URL}/api/world/monsters")
        
        assert response.status_code == 200
        data = response.json()
        assert "monsters" in data
        assert "goblin" in data["monsters"]
    
    def test_get_world_objects(self):
        """Test getting world objects"""
        response = requests.get(f"{BASE_URL}/api/world/objects")
        
        assert response.status_code == 200
        data = response.json()
        assert "objects" in data
    
    def test_get_placed_enemies(self):
        """Test getting placed enemies"""
        response = requests.get(f"{BASE_URL}/api/world/enemies")
        
        assert response.status_code == 200
        data = response.json()
        assert "enemies" in data


class TestWorldEditor:
    """World editor tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_editor_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not create test user")
    
    def test_create_world_object(self, auth_headers):
        """Test placing a world object"""
        obj_id = f"test_obj_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/world/objects",
            headers=auth_headers,
            json={
                "id": obj_id,
                "type": "npc",
                "name": "Test NPC",
                "level": 1,
                "scale": 1.0,
                "position": {"x": 0, "y": 0, "z": 0},
                "zone": "starter_village"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "object" in data
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/world/objects/{obj_id}", headers=auth_headers)
    
    def test_save_placed_enemy(self):
        """Test saving a placed enemy"""
        enemy_id = f"test_enemy_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/world/enemies",
            json={
                "id": enemy_id,
                "type": "goblin",
                "name": "Test Goblin",
                "position": {"x": 50, "y": 0, "z": 50},
                "patrolRadius": 10
            }
        )
        
        assert response.status_code == 200
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/world/enemies/{enemy_id}")


class TestGameState:
    """Game state persistence tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_state_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not create test user")
    
    def test_get_game_state(self, auth_headers):
        """Test getting game state"""
        response = requests.get(f"{BASE_URL}/api/player/game-state", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "learned_spells" in data
        assert "action_bar" in data
        assert "copper" in data
        assert "position" in data
    
    def test_update_copper(self, auth_headers):
        """Test updating copper"""
        response = requests.put(f"{BASE_URL}/api/player/copper",
            headers=auth_headers,
            json={"amount": 100}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "copper" in data
    
    def test_save_all_game_data(self, auth_headers):
        """Test comprehensive save endpoint"""
        response = requests.post(f"{BASE_URL}/api/player/save-all",
            headers=auth_headers,
            json={
                "position": {"x": 100, "y": 5, "z": 100, "zone": "starter_village"},
                "copper": 5000,
                "combat_level": 5,
                "experience": 1000
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "saved" in data["message"].lower()


class TestTerrain:
    """Terrain persistence tests"""
    
    def test_get_terrain(self):
        """Test getting terrain data"""
        response = requests.get(f"{BASE_URL}/api/terrain")
        
        assert response.status_code == 200
        data = response.json()
        assert "exists" in data


class TestCustomQuests:
    """Custom quest creation tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Create a test user and return auth headers"""
        username = f"test_cquest_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not create test user")
    
    def test_create_custom_quest(self, auth_headers):
        """Test creating a custom quest"""
        quest_id = f"custom_quest_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/quests/custom/create",
            headers=auth_headers,
            json={
                "quest_id": quest_id,
                "name": "Test Custom Quest",
                "description": "A test quest",
                "objectives": [
                    {"id": "kill_test", "description": "Kill test enemies", "required": 5}
                ],
                "rewards": {"xp": {"attack": 100}}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "quest" in data
    
    def test_list_custom_quests(self, auth_headers):
        """Test listing custom quests"""
        response = requests.get(f"{BASE_URL}/api/quests/custom/list", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "quests" in data
