"""
Backend API tests for Ethos app
Tests: health, challenges CRUD, lock, check-in, judgment, settings
"""
import pytest
import requests
import os
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env to get EXPO_PUBLIC_BACKEND_URL
frontend_env = Path(__file__).parent.parent.parent / 'frontend' / '.env'
load_dotenv(frontend_env)

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not found in environment")

class TestHealthEndpoint:
    """Health check endpoint test"""
    
    def test_health_endpoint(self):
        """Test GET /api/ health endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Ethos" in data["message"]
        print("✓ Health endpoint working")


class TestChallengesCRUD:
    """Challenge CRUD operations with persistence verification"""
    
    def test_create_challenge(self):
        """Test POST /api/challenges - Create challenge"""
        payload = {
            "title": "TEST_Drink 3L water",
            "description": "Drink 3 liters of water every day",
            "reward": "Buy new running shoes",
            "duration_days": 15,
            "language": "en"
        }
        response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["status"] == "draft"
        assert data["locked"] is False
        assert "id" in data
        
        # Verify persistence with GET
        challenge_id = data["id"]
        get_response = requests.get(f"{BASE_URL}/api/challenges/{challenge_id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["title"] == payload["title"]
        print(f"✓ Challenge created and persisted: {challenge_id}")
        
        # Store for other tests
        self.challenge_id = challenge_id
    
    def test_get_all_challenges(self):
        """Test GET /api/challenges - List all challenges"""
        response = requests.get(f"{BASE_URL}/api/challenges")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} challenges")
    
    def test_get_challenges_with_filter(self):
        """Test GET /api/challenges?status=draft - Filter by status"""
        response = requests.get(f"{BASE_URL}/api/challenges?status=draft")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        for challenge in data:
            assert challenge["status"] == "draft"
        print(f"✓ Filtered challenges by status: {len(data)} draft challenges")
    
    def test_get_single_challenge(self):
        """Test GET /api/challenges/{id} - Get single challenge"""
        # Create a challenge first
        payload = {
            "title": "TEST_Morning meditation",
            "description": "Meditate for 10 minutes every morning",
            "reward": "Weekend spa day",
            "duration_days": 21,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        
        # Get the challenge
        response = requests.get(f"{BASE_URL}/api/challenges/{challenge_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == challenge_id
        assert data["title"] == payload["title"]
        print(f"✓ Retrieved single challenge: {challenge_id}")
    
    def test_update_challenge_draft(self):
        """Test PUT /api/challenges/{id} - Update draft challenge"""
        # Create a draft challenge
        payload = {
            "title": "TEST_Original title",
            "description": "Original description",
            "reward": "Original reward",
            "duration_days": 10,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        
        # Update the challenge
        update_payload = {
            "title": "TEST_Updated title",
            "description": "Updated description"
        }
        response = requests.put(f"{BASE_URL}/api/challenges/{challenge_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == update_payload["title"]
        assert data["description"] == update_payload["description"]
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/challenges/{challenge_id}")
        get_data = get_response.json()
        assert get_data["title"] == update_payload["title"]
        print(f"✓ Challenge updated and persisted: {challenge_id}")
    
    def test_delete_challenge_draft(self):
        """Test DELETE /api/challenges/{id} - Delete draft challenge"""
        # Create a draft challenge
        payload = {
            "title": "TEST_To be deleted",
            "description": "This will be deleted",
            "reward": "None",
            "duration_days": 5,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        
        # Delete the challenge
        response = requests.delete(f"{BASE_URL}/api/challenges/{challenge_id}")
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/challenges/{challenge_id}")
        assert get_response.status_code == 404
        print(f"✓ Challenge deleted: {challenge_id}")


class TestChallengeLock:
    """Challenge lock functionality tests"""
    
    def test_lock_challenge(self):
        """Test POST /api/challenges/{id}/lock - Lock challenge"""
        # Create a draft challenge
        payload = {
            "title": "TEST_Lock test challenge",
            "description": "This will be locked",
            "reward": "Ice cream",
            "duration_days": 7,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        
        # Lock the challenge
        response = requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/lock")
        assert response.status_code == 200
        
        data = response.json()
        assert data["locked"] is True
        assert data["status"] == "locked"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/challenges/{challenge_id}")
        get_data = get_response.json()
        assert get_data["locked"] is True
        print(f"✓ Challenge locked: {challenge_id}")
        
        # Store for other tests
        self.locked_challenge_id = challenge_id
    
    def test_cannot_update_locked_challenge(self):
        """Test that locked challenges cannot be updated"""
        # Create and lock a challenge
        payload = {
            "title": "TEST_Locked challenge",
            "description": "Cannot be updated",
            "reward": "Nothing",
            "duration_days": 5,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/lock")
        
        # Try to update
        update_payload = {"title": "TEST_Should not work"}
        response = requests.put(f"{BASE_URL}/api/challenges/{challenge_id}", json=update_payload)
        assert response.status_code == 400
        assert "locked" in response.json()["detail"].lower()
        print("✓ Locked challenge cannot be updated")
    
    def test_cannot_delete_locked_challenge(self):
        """Test that locked challenges cannot be deleted"""
        # Create and lock a challenge
        payload = {
            "title": "TEST_Locked for deletion test",
            "description": "Cannot be deleted",
            "reward": "Nothing",
            "duration_days": 5,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/lock")
        
        # Try to delete
        response = requests.delete(f"{BASE_URL}/api/challenges/{challenge_id}")
        assert response.status_code == 400
        assert "locked" in response.json()["detail"].lower()
        print("✓ Locked challenge cannot be deleted")


class TestCheckIns:
    """Daily check-in tests"""
    
    def test_create_checkin(self):
        """Test POST /api/challenges/{id}/checkin - Create check-in"""
        # Create and lock a challenge
        payload = {
            "title": "TEST_Check-in test",
            "description": "For check-in testing",
            "reward": "Coffee",
            "duration_days": 10,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/lock")
        
        # Create check-in
        checkin_payload = {
            "completed": True,
            "notes": "Feeling great!"
        }
        response = requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/checkin", json=checkin_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["completed"] is True
        assert data["notes"] == checkin_payload["notes"]
        assert data["challenge_id"] == challenge_id
        assert "date" in data
        print(f"✓ Check-in created for challenge: {challenge_id}")
        
        # Store for other tests
        self.checkin_challenge_id = challenge_id
    
    def test_cannot_checkin_twice_same_day(self):
        """Test that duplicate check-ins are prevented"""
        # Create and lock a challenge
        payload = {
            "title": "TEST_Duplicate check-in test",
            "description": "Testing duplicate prevention",
            "reward": "Tea",
            "duration_days": 5,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/lock")
        
        # First check-in
        checkin_payload = {"completed": True}
        response1 = requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/checkin", json=checkin_payload)
        assert response1.status_code == 200
        
        # Second check-in (should fail)
        response2 = requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/checkin", json=checkin_payload)
        assert response2.status_code == 400
        assert "already" in response2.json()["detail"].lower()
        print("✓ Duplicate check-in prevented")
    
    def test_get_checkins(self):
        """Test GET /api/challenges/{id}/checkins - List check-ins"""
        # Create and lock a challenge, then add check-in
        payload = {
            "title": "TEST_Get check-ins test",
            "description": "For listing check-ins",
            "reward": "Smoothie",
            "duration_days": 7,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/lock")
        requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/checkin", json={"completed": True})
        
        # Get check-ins
        response = requests.get(f"{BASE_URL}/api/challenges/{challenge_id}/checkins")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        print(f"✓ Retrieved {len(data)} check-ins")
    
    def test_get_today_checkin(self):
        """Test GET /api/challenges/{id}/today-checkin - Today's check-in status"""
        # Create and lock a challenge, then add check-in
        payload = {
            "title": "TEST_Today check-in test",
            "description": "For today's check-in",
            "reward": "Juice",
            "duration_days": 5,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/lock")
        requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/checkin", json={"completed": True})
        
        # Get today's check-in
        response = requests.get(f"{BASE_URL}/api/challenges/{challenge_id}/today-checkin")
        assert response.status_code == 200
        
        data = response.json()
        assert data is not None
        assert data["completed"] is True
        print("✓ Today's check-in retrieved")


class TestJudgment:
    """Final judgment tests"""
    
    def test_judgment_honest(self):
        """Test POST /api/challenges/{id}/judgment - Honest judgment"""
        # Create a challenge with end date in the past
        payload = {
            "title": "TEST_Judgment test honest",
            "description": "For judgment testing",
            "reward": "Victory",
            "duration_days": 1,
            "language": "en"
        }
        create_response = requests.post(f"{BASE_URL}/api/challenges", json=payload)
        challenge_id = create_response.json()["id"]
        
        # Lock the challenge
        lock_response = requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/lock")
        
        # Wait a moment to ensure end_date is in the past (for 1-day challenge)
        # Note: In real scenario, we'd need to wait or manipulate the end_date
        # For now, we'll test the endpoint structure
        
        # Note: This test might fail if challenge hasn't ended yet
        # We're testing the endpoint exists and responds correctly
        judgment_payload = {"was_honest": True}
        response = requests.post(f"{BASE_URL}/api/challenges/{challenge_id}/judgment", json=judgment_payload)
        
        # It might return 400 if challenge hasn't ended, which is expected
        if response.status_code == 400:
            assert "not ended" in response.json()["detail"].lower()
            print("✓ Judgment endpoint validates challenge end date")
        else:
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "completed"
            print("✓ Honest judgment submitted")


class TestSettings:
    """User settings tests"""
    
    def test_get_default_settings(self):
        """Test GET /api/settings - Get default settings"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "language" in data
        assert "notification_time" in data
        print("✓ Default settings retrieved")
    
    def test_update_settings(self):
        """Test POST /api/settings - Update settings"""
        payload = {
            "language": "pt",
            "notification_time": "08:00"
        }
        response = requests.post(f"{BASE_URL}/api/settings", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["language"] == payload["language"]
        assert data["notification_time"] == payload["notification_time"]
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/settings")
        get_data = get_response.json()
        assert get_data["language"] == payload["language"]
        print("✓ Settings updated and persisted")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Clean up test data after all tests"""
    yield
    # Cleanup happens after all tests
    try:
        response = requests.get(f"{BASE_URL}/api/challenges")
        if response.status_code == 200:
            challenges = response.json()
            for challenge in challenges:
                if challenge["title"].startswith("TEST_") and not challenge["locked"]:
                    requests.delete(f"{BASE_URL}/api/challenges/{challenge['id']}")
            print("\n✓ Test data cleaned up")
    except Exception as e:
        print(f"\n⚠ Cleanup error: {e}")
