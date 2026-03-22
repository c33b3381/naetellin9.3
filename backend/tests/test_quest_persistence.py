"""
Quest Persistence Tests
Tests for: Quest acceptance persistence, progress persistence, quest loading on login
This tests the bug fix: quests should persist across logout/login
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials - use existing test account
TEST_USERNAME = "perf_test_4907564d"
TEST_PASSWORD = "testpass123"


class TestQuestPersistence:
    """Quest persistence tests - verify quests survive logout/login"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Login with test account and return auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip(f"Could not login with test user: {response.text}")
    
    def test_01_verify_existing_quest_loaded(self, auth_headers):
        """Test that existing quest (goblin_slayer with 3/10 progress) is loaded"""
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check active quests
        active = data.get("active", [])
        print(f"Active quests: {len(active)}")
        for q in active:
            print(f"  - {q.get('quest_id')}: {q.get('name')} - progress: {q.get('progress')}")
        
        # Find goblin_slayer quest
        goblin_quest = next((q for q in active if q.get('quest_id') == 'goblin_slayer'), None)
        
        assert goblin_quest is not None, "goblin_slayer quest should be in active quests"
        assert goblin_quest.get('name') == 'Goblin Menace'
        
        # Check progress
        progress = goblin_quest.get('progress', {})
        kill_progress = progress.get('kill_goblins', 0)
        print(f"Current goblin kill progress: {kill_progress}/10")
        
        # Should have at least 3 kills from previous test
        assert kill_progress >= 3, f"Expected at least 3 kills, got {kill_progress}"
    
    def test_02_update_quest_progress(self, auth_headers):
        """Test updating quest progress and verify it persists"""
        # Get current progress
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=auth_headers)
        assert response.status_code == 200
        
        active = response.json().get("active", [])
        goblin_quest = next((q for q in active if q.get('quest_id') == 'goblin_slayer'), None)
        
        if not goblin_quest:
            pytest.skip("goblin_slayer quest not active")
        
        current_progress = goblin_quest.get('progress', {}).get('kill_goblins', 0)
        new_progress = current_progress + 1
        
        # Update progress
        response = requests.post(f"{BASE_URL}/api/quests/progress",
            headers=auth_headers,
            json={
                "quest_id": "goblin_slayer",
                "progress": {"kill_goblins": new_progress}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        print(f"Progress update response: {data}")
        
        # Verify progress was saved
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=auth_headers)
        assert response.status_code == 200
        
        active = response.json().get("active", [])
        goblin_quest = next((q for q in active if q.get('quest_id') == 'goblin_slayer'), None)
        
        assert goblin_quest is not None
        saved_progress = goblin_quest.get('progress', {}).get('kill_goblins', 0)
        assert saved_progress == new_progress, f"Expected {new_progress}, got {saved_progress}"
        print(f"Progress updated: {current_progress} -> {saved_progress}")
    
    def test_03_quest_persists_after_relogin(self, auth_headers):
        """Test that quest persists after logging out and back in"""
        # Get current progress before "logout"
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=auth_headers)
        assert response.status_code == 200
        
        active = response.json().get("active", [])
        goblin_quest = next((q for q in active if q.get('quest_id') == 'goblin_slayer'), None)
        
        if not goblin_quest:
            pytest.skip("goblin_slayer quest not active")
        
        progress_before = goblin_quest.get('progress', {}).get('kill_goblins', 0)
        print(f"Progress before re-login: {progress_before}")
        
        # Simulate logout/login by getting a new token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        
        assert response.status_code == 200
        new_token = response.json().get("token")
        new_headers = {"Authorization": f"Bearer {new_token}"}
        
        # Fetch quests with new token (simulating fresh login)
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=new_headers)
        assert response.status_code == 200
        
        active = response.json().get("active", [])
        goblin_quest = next((q for q in active if q.get('quest_id') == 'goblin_slayer'), None)
        
        assert goblin_quest is not None, "Quest should persist after re-login"
        progress_after = goblin_quest.get('progress', {}).get('kill_goblins', 0)
        print(f"Progress after re-login: {progress_after}")
        
        assert progress_after == progress_before, f"Progress should persist: expected {progress_before}, got {progress_after}"
        print("✅ Quest persistence verified!")


class TestNewQuestAcceptance:
    """Test accepting a new quest and verifying persistence"""
    
    @pytest.fixture(scope="class")
    def new_user_headers(self):
        """Create a new test user for clean quest testing"""
        username = f"TEST_quest_persist_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "password": "testpass123",
            "email": f"{username}@example.com"
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}", "username": username}
        pytest.skip(f"Could not create test user: {response.text}")
    
    def test_01_accept_quest_and_verify(self, new_user_headers):
        """Test accepting a quest saves it to database"""
        # Accept tutorial_quest
        response = requests.post(f"{BASE_URL}/api/quests/accept/tutorial_quest",
            headers=new_user_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("quest", {}).get("quest_id") == "tutorial_quest"
        print(f"Quest accepted: {data.get('quest', {}).get('name')}")
        
        # Verify quest is in active quests
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=new_user_headers)
        assert response.status_code == 200
        
        active = response.json().get("active", [])
        tutorial_quest = next((q for q in active if q.get('quest_id') == 'tutorial_quest'), None)
        
        assert tutorial_quest is not None, "Accepted quest should be in active quests"
        print(f"Quest in active list: {tutorial_quest.get('name')}")
    
    def test_02_quest_persists_new_session(self, new_user_headers):
        """Test quest persists in new session"""
        # Get username from headers fixture
        username = new_user_headers.get("username")
        
        # Login again (new session)
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": username,
            "password": "testpass123"
        })
        
        assert response.status_code == 200
        new_token = response.json().get("token")
        new_headers = {"Authorization": f"Bearer {new_token}"}
        
        # Fetch quests
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=new_headers)
        assert response.status_code == 200
        
        active = response.json().get("active", [])
        tutorial_quest = next((q for q in active if q.get('quest_id') == 'tutorial_quest'), None)
        
        assert tutorial_quest is not None, "Quest should persist after new login"
        print(f"✅ Quest persisted: {tutorial_quest.get('name')}")
    
    def test_03_progress_update_persists(self, new_user_headers):
        """Test progress updates persist"""
        # Update progress
        response = requests.post(f"{BASE_URL}/api/quests/progress",
            headers=new_user_headers,
            json={
                "quest_id": "tutorial_quest",
                "progress": {"speak_guide": 1}
            }
        )
        
        assert response.status_code == 200
        print(f"Progress update response: {response.json()}")
        
        # Login again and verify
        username = new_user_headers.get("username")
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": username,
            "password": "testpass123"
        })
        
        assert response.status_code == 200
        new_token = response.json().get("token")
        new_headers = {"Authorization": f"Bearer {new_token}"}
        
        # Fetch quests
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=new_headers)
        assert response.status_code == 200
        
        active = response.json().get("active", [])
        tutorial_quest = next((q for q in active if q.get('quest_id') == 'tutorial_quest'), None)
        
        assert tutorial_quest is not None
        progress = tutorial_quest.get('progress', {})
        assert progress.get('speak_guide') == 1, f"Progress should be 1, got {progress.get('speak_guide')}"
        print(f"✅ Progress persisted: speak_guide = {progress.get('speak_guide')}")


class TestQuestDataStructure:
    """Test quest data structure matches frontend expectations"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Login with test account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not login")
    
    def test_quest_structure_for_frontend(self, auth_headers):
        """Verify quest structure has all fields needed by frontend"""
        response = requests.get(f"{BASE_URL}/api/quests/available", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check response structure
        assert "available" in data
        assert "active" in data
        assert "completed" in data
        
        # Check active quest structure
        active = data.get("active", [])
        if active:
            quest = active[0]
            print(f"Quest structure: {list(quest.keys())}")
            
            # Required fields for frontend
            assert "quest_id" in quest, "quest_id required"
            assert "name" in quest, "name required"
            assert "objectives" in quest, "objectives required"
            assert "progress" in quest, "progress required"
            
            # Check objectives structure
            objectives = quest.get("objectives", [])
            if objectives:
                obj = objectives[0]
                print(f"Objective structure: {list(obj.keys())}")
                assert "id" in obj, "objective id required"
                assert "required" in obj, "objective required count needed"
            
            # Check progress structure
            progress = quest.get("progress", {})
            print(f"Progress structure: {progress}")
            assert isinstance(progress, dict), "progress should be a dict"
            
            print("✅ Quest structure valid for frontend")
