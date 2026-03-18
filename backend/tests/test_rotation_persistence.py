"""
Test rotation persistence in world objects
This tests the bug fix for handleSaveWorld now including rotation field
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRotationPersistence:
    """Tests for world object rotation persistence - Bug fix verification"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register user and get auth token"""
        username = f"test_rotation_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not register test user")
    
    def test_world_object_rotation_number(self, auth_token):
        """Test saving world object with rotation as a number (Y rotation in degrees)"""
        object_id = f"test_obj_{uuid.uuid4().hex[:8]}"
        
        # Create world object with rotation as number
        response = requests.post(
            f"{BASE_URL}/api/world/objects",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "id": object_id,
                "type": "npc",
                "subType": "trainer",
                "name": "Test Trainer",
                "position": {"x": 10.0, "y": 0.0, "z": 20.0},
                "rotation": 45,  # Rotation in degrees
                "zone": "starter_village"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "object" in data
        assert data["object"]["rotation"] == 45
        
        # Verify the object was saved with rotation
        get_response = requests.get(f"{BASE_URL}/api/world/objects?zone=starter_village")
        assert get_response.status_code == 200
        
        objects = get_response.json().get("objects", [])
        saved_obj = next((o for o in objects if o.get("id") == object_id), None)
        assert saved_obj is not None, "Object should be found after save"
        assert saved_obj.get("rotation") == 45, "Rotation should be persisted"
        
        # Clean up
        requests.delete(
            f"{BASE_URL}/api/world/objects/{object_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_world_object_default_rotation(self, auth_token):
        """Test that rotation defaults to 0 when not provided"""
        object_id = f"test_obj_{uuid.uuid4().hex[:8]}"
        
        # Create world object without rotation
        response = requests.post(
            f"{BASE_URL}/api/world/objects",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "id": object_id,
                "type": "building",
                "name": "Test Building",
                "position": {"x": 15.0, "y": 0.0, "z": 25.0},
                "zone": "starter_village"
                # No rotation field
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        # Rotation should default to 0 in the model
        
        # Verify via GET
        get_response = requests.get(f"{BASE_URL}/api/world/objects?zone=starter_village")
        objects = get_response.json().get("objects", [])
        saved_obj = next((o for o in objects if o.get("id") == object_id), None)
        assert saved_obj is not None
        assert saved_obj.get("rotation") == 0 or saved_obj.get("rotation") is None
        
        # Clean up
        requests.delete(
            f"{BASE_URL}/api/world/objects/{object_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_bulk_save_with_rotation(self, auth_token):
        """Test bulk save preserves rotation for multiple objects"""
        zone = f"test_zone_{uuid.uuid4().hex[:8]}"
        
        objects = [
            {
                "id": f"obj1_{uuid.uuid4().hex[:8]}",
                "type": "npc",
                "name": "NPC 1",
                "position": {"x": 0.0, "y": 0.0, "z": 0.0},
                "rotation": 90,
                "level": 1
            },
            {
                "id": f"obj2_{uuid.uuid4().hex[:8]}",
                "type": "building",
                "name": "Building 1",
                "position": {"x": 10.0, "y": 0.0, "z": 10.0},
                "rotation": 180,
                "level": 1
            },
            {
                "id": f"obj3_{uuid.uuid4().hex[:8]}",
                "type": "decoration",
                "name": "Tree",
                "position": {"x": 5.0, "y": 0.0, "z": 5.0},
                "rotation": 270,
                "level": 1
            }
        ]
        
        # Bulk save
        response = requests.post(
            f"{BASE_URL}/api/world/objects/bulk",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "objects": objects,
                "zone": zone
            }
        )
        
        assert response.status_code == 200
        
        # Verify all rotations are preserved
        get_response = requests.get(f"{BASE_URL}/api/world/objects?zone={zone}")
        assert get_response.status_code == 200
        
        saved_objects = get_response.json().get("objects", [])
        assert len(saved_objects) == 3, "All 3 objects should be saved"
        
        # Check each rotation
        for orig_obj in objects:
            saved = next((o for o in saved_objects if o.get("id") == orig_obj["id"]), None)
            assert saved is not None, f"Object {orig_obj['id']} should be found"
            assert saved.get("rotation") == orig_obj["rotation"], \
                f"Rotation for {orig_obj['id']} should be {orig_obj['rotation']}, got {saved.get('rotation')}"
        
        # Clean up - delete all objects in zone
        for obj in objects:
            requests.delete(
                f"{BASE_URL}/api/world/objects/{obj['id']}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
    
    def test_save_all_preserves_rotation(self, auth_token):
        """Test save-all endpoint preserves rotation in world_objects"""
        # This tests the actual bug fix in handleSaveWorld
        zone = f"test_save_{uuid.uuid4().hex[:8]}"
        
        objects = [
            {
                "id": f"savetest_{uuid.uuid4().hex[:8]}",
                "type": "npc",
                "subType": "questgiver",
                "name": "Quest Giver",
                "position": {"x": 100.0, "y": 0.0, "z": 100.0},
                "rotation": 135,  # Should be preserved
                "level": 5,
                "quest_id": None,
                "quest_giver": True
            }
        ]
        
        # Save via save-all endpoint (what Ctrl+S calls)
        response = requests.post(
            f"{BASE_URL}/api/player/save-all",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "position": {"x": 0, "y": 0, "z": 0},
                "copper": 1000,
                "world_objects": objects,
                "zone": zone
            }
        )
        
        assert response.status_code == 200
        
        # Verify rotation is in the saved data
        get_response = requests.get(f"{BASE_URL}/api/world/objects?zone={zone}")
        assert get_response.status_code == 200
        
        saved_objects = get_response.json().get("objects", [])
        assert len(saved_objects) >= 1
        
        saved_obj = saved_objects[0]
        assert saved_obj.get("rotation") == 135, \
            f"Rotation should be 135, got {saved_obj.get('rotation')}"
        assert saved_obj.get("level") == 5, "Level should be preserved"
        assert saved_obj.get("subType") == "questgiver", "subType should be preserved"
        
        # Clean up
        for obj in saved_objects:
            requests.delete(
                f"{BASE_URL}/api/world/objects/{obj['id']}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )


class TestQuestNPCFiltering:
    """Tests for quest dialog NPC filtering fix"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register user and get auth token"""
        username = f"test_quest_filter_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not register test user")
    
    def test_global_quest_npc_assignment(self, auth_token):
        """Test that global quests can be assigned to specific NPCs"""
        quest_name = f"Test Quest {uuid.uuid4().hex[:8]}"
        npc_id = f"npc_{uuid.uuid4().hex[:8]}"
        
        # Create a global quest
        create_response = requests.post(
            f"{BASE_URL}/api/quests/global",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": quest_name,
                "description": "Test quest for NPC filtering",
                "objectives": [{"id": "test", "type": "kill", "target": "goblin", "required": 1, "description": "Kill a goblin"}],
                "rewards": {"xp": 100, "gold": 10},
                "difficulty": "easy"
            }
        )
        
        assert create_response.status_code == 200
        quest_data = create_response.json().get("quest", {})
        quest_id = quest_data.get("quest_id")
        assert quest_id is not None
        
        # Assign to NPC
        assign_response = requests.put(
            f"{BASE_URL}/api/quests/global/{quest_id}/assign",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "npc_id": npc_id,
                "npc_name": "Test NPC"
            }
        )
        
        assert assign_response.status_code == 200
        
        # Verify quest has assigned_npc_id
        list_response = requests.get(f"{BASE_URL}/api/quests/global")
        assert list_response.status_code == 200
        
        quests = list_response.json().get("quests", [])
        our_quest = next((q for q in quests if q.get("quest_id") == quest_id), None)
        
        assert our_quest is not None, "Quest should be in list"
        assert our_quest.get("assigned_npc_id") == npc_id, \
            f"Quest should be assigned to {npc_id}, got {our_quest.get('assigned_npc_id')}"
        
        # Clean up
        requests.delete(
            f"{BASE_URL}/api/quests/global/{quest_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_get_quest_by_npc(self, auth_token):
        """Test fetching quests by NPC ID"""
        npc_id = f"npc_filter_test_{uuid.uuid4().hex[:8]}"
        
        # Create and assign a quest
        create_response = requests.post(
            f"{BASE_URL}/api/quests/global",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": f"NPC Specific Quest {uuid.uuid4().hex[:8]}",
                "description": "Quest only for this NPC",
                "objectives": [{"id": "test", "type": "talk", "target": "npc", "required": 1, "description": "Talk to NPC"}],
                "rewards": {"xp": 50},
                "difficulty": "easy"
            }
        )
        
        quest_id = create_response.json().get("quest", {}).get("quest_id")
        
        # Assign to specific NPC
        requests.put(
            f"{BASE_URL}/api/quests/global/{quest_id}/assign",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"npc_id": npc_id, "npc_name": "Specific NPC"}
        )
        
        # Get all global quests and filter client-side (simulating frontend behavior)
        all_quests_response = requests.get(f"{BASE_URL}/api/quests/global")
        all_quests = all_quests_response.json().get("quests", [])
        
        # Filter quests for this specific NPC
        npc_quests = [q for q in all_quests if q.get("assigned_npc_id") == npc_id]
        assert len(npc_quests) == 1, "Should have exactly 1 quest for this NPC"
        assert npc_quests[0].get("quest_id") == quest_id
        
        # Filter for different NPC - should be empty
        other_npc_quests = [q for q in all_quests if q.get("assigned_npc_id") == "nonexistent_npc"]
        assert len(other_npc_quests) == 0, "Should have no quests for nonexistent NPC"
        
        # Clean up
        requests.delete(
            f"{BASE_URL}/api/quests/global/{quest_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
