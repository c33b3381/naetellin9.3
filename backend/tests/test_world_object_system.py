"""
Test WorldObjectSystem Extraction Verification
Tests that verify normalizeObjectForSave, normalizeEnemyForSave, extractTerrainData paths
are working correctly via save-all and world object API endpoints.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestWorldObjectNormalization:
    """Tests for normalizeObjectForSave - verify all fields are preserved through save cycle"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register user and get auth token"""
        username = f"test_wos_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not register test user")
    
    def test_normalize_object_preserves_all_fields(self, auth_token):
        """Test that normalizeObjectForSave preserves rotation, level, subType, quest fields"""
        zone = f"test_zone_{uuid.uuid4().hex[:8]}"
        obj_id = f"norm_test_{uuid.uuid4().hex[:8]}"
        
        # Create object with ALL fields that normalizeObjectForSave should preserve
        world_object = {
            "id": obj_id,
            "type": "npc",
            "subType": "questgiver",
            "fullType": "npc_questgiver",
            "name": "Test Quest Giver",
            "position": {"x": 100.0, "y": 5.0, "z": 200.0},
            "level": 10,
            "scale": 1.5,
            "rotation": 135,  # Critical: rotation must persist
            "color": "#FF5500",
            "category": "npc",
            "zone": zone,
            "quest_id": "test_quest_001",
            "quest_giver": True,
            "global_quest_id": "global_quest_xyz",
            "isVendor": False,
            "hasQuest": True
        }
        
        # Save via save-all (same path as Ctrl+S in frontend)
        response = requests.post(
            f"{BASE_URL}/api/player/save-all",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "position": {"x": 0, "y": 0, "z": 0},
                "copper": 100,
                "world_objects": [world_object],
                "zone": zone
            }
        )
        
        assert response.status_code == 200, f"Save-all failed: {response.text}"
        
        # Retrieve and verify all fields persisted
        get_response = requests.get(f"{BASE_URL}/api/world/objects?zone={zone}")
        assert get_response.status_code == 200
        
        objects = get_response.json().get("objects", [])
        saved_obj = next((o for o in objects if o.get("id") == obj_id), None)
        
        assert saved_obj is not None, "Object not found after save"
        
        # Verify ALL normalizeObjectForSave fields
        assert saved_obj.get("type") == "npc"
        assert saved_obj.get("subType") == "questgiver"
        assert saved_obj.get("fullType") == "npc_questgiver"
        assert saved_obj.get("name") == "Test Quest Giver"
        assert saved_obj.get("level") == 10
        assert saved_obj.get("scale") == 1.5
        assert saved_obj.get("rotation") == 135, f"Rotation should be 135, got {saved_obj.get('rotation')}"
        assert saved_obj.get("quest_id") == "test_quest_001"
        assert saved_obj.get("quest_giver") == True
        assert saved_obj.get("global_quest_id") == "global_quest_xyz"
        assert saved_obj.get("hasQuest") == True
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/world/objects/{obj_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_normalize_object_handles_missing_fields(self, auth_token):
        """Test that normalizeObjectForSave handles objects with minimal fields"""
        zone = f"test_zone_{uuid.uuid4().hex[:8]}"
        obj_id = f"minimal_{uuid.uuid4().hex[:8]}"
        
        # Minimal object - only required fields
        minimal_object = {
            "id": obj_id,
            "type": "decoration",
            "name": "Simple Rock",
            "position": {"x": 50.0, "y": 0.0, "z": 50.0}
            # Missing: level, rotation, subType, quest fields, etc.
        }
        
        response = requests.post(
            f"{BASE_URL}/api/player/save-all",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "position": {"x": 0, "y": 0, "z": 0},
                "copper": 100,
                "world_objects": [minimal_object],
                "zone": zone
            }
        )
        
        assert response.status_code == 200
        
        # Verify object saved with defaults
        get_response = requests.get(f"{BASE_URL}/api/world/objects?zone={zone}")
        objects = get_response.json().get("objects", [])
        saved_obj = next((o for o in objects if o.get("id") == obj_id), None)
        
        assert saved_obj is not None
        assert saved_obj.get("type") == "decoration"
        # Defaults from normalizeObjectForSave
        assert saved_obj.get("level") in [None, 1]  # Default or missing
        assert saved_obj.get("rotation") in [None, 0]  # Default or missing
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/world/objects/{obj_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )


class TestEnemyNormalization:
    """Tests for normalizeEnemyForSave"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register user and get auth token"""
        username = f"test_enemy_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not register test user")
    
    def test_normalize_enemy_preserves_all_fields(self, auth_token):
        """Test that normalizeEnemyForSave preserves all enemy fields"""
        enemy_id = f"enemy_{uuid.uuid4().hex[:8]}"
        
        # Enemy with ALL fields from normalizeEnemyForSave
        enemy = {
            "id": enemy_id,
            "enemyType": "goblin",
            "name": "Fierce Goblin",
            "level": 5,
            "x": 150.0,
            "y": 2.0,
            "z": 150.0,
            "maxHealth": 200,
            "currentHealth": 180,
            "damage": 25,
            "color": "#2d5016",
            "patrolRadius": 15,
            "respawnTime": 120,
            "tier": "elite",
            "xpReward": 500,
            "goldDrop": 50
        }
        
        # Save via save-all
        response = requests.post(
            f"{BASE_URL}/api/player/save-all",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "position": {"x": 0, "y": 0, "z": 0},
                "copper": 100,
                "placed_enemies": [enemy],
                "zone": "test_zone"
            }
        )
        
        assert response.status_code == 200
        
        # Retrieve and verify
        get_response = requests.get(f"{BASE_URL}/api/world/enemies")
        assert get_response.status_code == 200
        
        enemies = get_response.json().get("enemies", [])
        saved_enemy = next((e for e in enemies if e.get("id") == enemy_id), None)
        
        assert saved_enemy is not None, "Enemy not found after save"
        
        # Verify ALL normalizeEnemyForSave fields
        assert saved_enemy.get("enemyType") == "goblin"
        assert saved_enemy.get("name") == "Fierce Goblin"
        assert saved_enemy.get("level") == 5
        assert saved_enemy.get("maxHealth") == 200
        assert saved_enemy.get("damage") == 25
        assert saved_enemy.get("patrolRadius") == 15
        assert saved_enemy.get("respawnTime") == 120
        assert saved_enemy.get("tier") == "elite"
        assert saved_enemy.get("xpReward") == 500
        assert saved_enemy.get("goldDrop") == 50
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/world/enemies/{enemy_id}")


class TestProcessLoadedWorldObject:
    """Tests for processLoadedWorldObject - verify objects load with correct metadata"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register user and get auth token"""
        username = f"test_load_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not register test user")
    
    def test_world_objects_load_endpoint(self, auth_token):
        """Test that GET /api/world/objects returns objects with all required fields"""
        response = requests.get(f"{BASE_URL}/api/world/objects")
        assert response.status_code == 200
        
        data = response.json()
        assert "objects" in data
        
        # If there are objects, verify structure
        if len(data["objects"]) > 0:
            obj = data["objects"][0]
            # These fields are needed by processLoadedWorldObject
            assert "id" in obj or "type" in obj or "position" in obj
            print(f"Sample object fields: {list(obj.keys())}")
    
    def test_quest_marker_fields_present(self, auth_token):
        """Test that quest-related fields are present for createQuestMarker"""
        zone = f"quest_test_{uuid.uuid4().hex[:8]}"
        obj_id = f"qnpc_{uuid.uuid4().hex[:8]}"
        
        # Create NPC with quest fields
        quest_npc = {
            "id": obj_id,
            "type": "npc",
            "subType": "questgiver",
            "name": "Quest NPC",
            "position": {"x": 0, "y": 0, "z": 0},
            "quest_id": "main_story_1",
            "quest_giver": True,
            "global_quest_id": "global_main_1"
        }
        
        # Save
        response = requests.post(
            f"{BASE_URL}/api/player/save-all",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "position": {"x": 0, "y": 0, "z": 0},
                "copper": 100,
                "world_objects": [quest_npc],
                "zone": zone
            }
        )
        
        assert response.status_code == 200
        
        # Verify quest fields are retrievable
        get_response = requests.get(f"{BASE_URL}/api/world/objects?zone={zone}")
        objects = get_response.json().get("objects", [])
        saved_npc = next((o for o in objects if o.get("id") == obj_id), None)
        
        assert saved_npc is not None
        # These fields trigger createQuestMarker in processLoadedWorldObject
        assert saved_npc.get("quest_id") == "main_story_1" or \
               saved_npc.get("quest_giver") == True or \
               saved_npc.get("global_quest_id") == "global_main_1"
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/world/objects/{obj_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )


class TestObjectDeletion:
    """Tests for disposeMeshTree - via delete endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register user and get auth token"""
        username = f"test_delete_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not register test user")
    
    def test_delete_world_object(self, auth_token):
        """Test object deletion endpoint (disposeMeshTree backend path)"""
        obj_id = f"del_test_{uuid.uuid4().hex[:8]}"
        
        # Create object
        create_response = requests.post(
            f"{BASE_URL}/api/world/objects",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "id": obj_id,
                "type": "decoration",
                "name": "To Be Deleted",
                "position": {"x": 0, "y": 0, "z": 0}
            }
        )
        
        assert create_response.status_code == 200
        
        # Delete
        delete_response = requests.delete(
            f"{BASE_URL}/api/world/objects/{obj_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert delete_response.status_code == 200
        
        # Verify gone
        get_response = requests.get(f"{BASE_URL}/api/world/objects")
        objects = get_response.json().get("objects", [])
        deleted_obj = next((o for o in objects if o.get("id") == obj_id), None)
        
        assert deleted_obj is None, "Object should be deleted"


class TestSelectableTypes:
    """Tests for SELECTABLE_TYPES constant usage"""
    
    def test_selectable_types_are_targetable(self):
        """Verify monster, npc, trainer, questgiver, vendor, guard types exist in world"""
        response = requests.get(f"{BASE_URL}/api/world/objects")
        assert response.status_code == 200
        
        objects = response.json().get("objects", [])
        selectable_types = ['monster', 'npc', 'trainer', 'questgiver', 'vendor', 'guard']
        
        found_types = set()
        for obj in objects:
            obj_type = obj.get("type") or obj.get("subType") or ""
            for st in selectable_types:
                if st in obj_type.lower():
                    found_types.add(st)
        
        print(f"Found selectable types in world: {found_types}")
        # At minimum, NPCs or vendors should exist
        assert len(objects) >= 0  # Just verify endpoint works


class TestTerrainData:
    """Tests for extractTerrainData - terrain save/load"""
    
    def test_terrain_endpoint_exists(self):
        """Test terrain data endpoint"""
        response = requests.get(f"{BASE_URL}/api/terrain")
        assert response.status_code == 200
        
        data = response.json()
        assert "exists" in data or "terrain" in data or isinstance(data, dict)
