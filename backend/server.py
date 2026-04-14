from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Pydantic Models
class ChallengeCreate(BaseModel):
    title: str
    description: str
    reward: str
    duration_days: int
    language: str = "en"

class Challenge(BaseModel):
    id: str
    title: str
    description: str
    reward: str
    duration_days: int
    start_date: datetime
    end_date: datetime
    status: str  # "draft", "locked", "completed", "failed"
    locked: bool = False
    created_at: datetime
    language: str = "en"
    total_checkins: int = 0
    completed_checkins: int = 0

class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reward: Optional[str] = None
    duration_days: Optional[int] = None

class DailyCheckIn(BaseModel):
    id: str
    challenge_id: str
    date: str  # YYYY-MM-DD format
    completed: bool
    notes: Optional[str] = None
    created_at: datetime

class DailyCheckInCreate(BaseModel):
    completed: bool
    notes: Optional[str] = None

class JudgmentRequest(BaseModel):
    was_honest: bool

class UserSettings(BaseModel):
    language: str = "en"
    notification_time: str = "09:00"  # HH:MM format


# Helper function to convert ObjectId to string
def challenge_helper(challenge) -> dict:
    return {
        "id": str(challenge["_id"]),
        "title": challenge["title"],
        "description": challenge["description"],
        "reward": challenge["reward"],
        "duration_days": challenge["duration_days"],
        "start_date": challenge["start_date"],
        "end_date": challenge["end_date"],
        "status": challenge["status"],
        "locked": challenge["locked"],
        "created_at": challenge["created_at"],
        "language": challenge.get("language", "en"),
        "total_checkins": challenge.get("total_checkins", 0),
        "completed_checkins": challenge.get("completed_checkins", 0),
    }

def checkin_helper(checkin) -> dict:
    return {
        "id": str(checkin["_id"]),
        "challenge_id": checkin["challenge_id"],
        "date": checkin["date"],
        "completed": checkin["completed"],
        "notes": checkin.get("notes"),
        "created_at": checkin["created_at"],
    }


# Routes
@api_router.get("/")
async def root():
    return {"message": "Ethos API - Build Integrity, One Challenge at a Time"}

@api_router.post("/challenges", response_model=Challenge)
async def create_challenge(challenge: ChallengeCreate):
    """Create a new challenge (starts in draft state)"""
    now = datetime.utcnow()
    end_date = now + timedelta(days=challenge.duration_days)
    
    challenge_dict = {
        "title": challenge.title,
        "description": challenge.description,
        "reward": challenge.reward,
        "duration_days": challenge.duration_days,
        "start_date": now,
        "end_date": end_date,
        "status": "draft",
        "locked": False,
        "created_at": now,
        "language": challenge.language,
        "total_checkins": 0,
        "completed_checkins": 0,
    }
    
    result = await db.challenges.insert_one(challenge_dict)
    challenge_dict["_id"] = result.inserted_id
    
    return challenge_helper(challenge_dict)

@api_router.get("/challenges", response_model=List[Challenge])
async def get_challenges(status: Optional[str] = None):
    """Get all challenges, optionally filtered by status"""
    query = {}
    if status:
        query["status"] = status
    
    challenges = await db.challenges.find(query).sort("created_at", -1).to_list(1000)
    return [challenge_helper(challenge) for challenge in challenges]

@api_router.get("/challenges/{challenge_id}", response_model=Challenge)
async def get_challenge(challenge_id: str):
    """Get a specific challenge"""
    try:
        challenge = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        return challenge_helper(challenge)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/challenges/{challenge_id}/lock")
async def lock_challenge(challenge_id: str):
    """Lock a challenge (irreversible - commitment begins)"""
    try:
        challenge = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        if challenge["locked"]:
            raise HTTPException(status_code=400, detail="Challenge already locked")
        
        # Update to locked state
        now = datetime.utcnow()
        end_date = now + timedelta(days=challenge["duration_days"])
        
        await db.challenges.update_one(
            {"_id": ObjectId(challenge_id)},
            {
                "$set": {
                    "locked": True,
                    "status": "locked",
                    "start_date": now,
                    "end_date": end_date,
                }
            }
        )
        
        updated_challenge = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
        return challenge_helper(updated_challenge)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/challenges/{challenge_id}")
async def update_challenge(challenge_id: str, update: ChallengeUpdate):
    """Update a challenge (only if not locked)"""
    try:
        challenge = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        if challenge["locked"]:
            raise HTTPException(status_code=400, detail="Cannot edit locked challenge")
        
        update_dict = {k: v for k, v in update.dict().items() if v is not None}
        
        if update_dict:
            await db.challenges.update_one(
                {"_id": ObjectId(challenge_id)},
                {"$set": update_dict}
            )
        
        updated_challenge = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
        return challenge_helper(updated_challenge)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/challenges/{challenge_id}")
async def delete_challenge(challenge_id: str):
    """Delete a challenge (only if not locked)"""
    try:
        challenge = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        if challenge["locked"]:
            raise HTTPException(status_code=400, detail="Cannot delete locked challenge")
        
        await db.challenges.delete_one({"_id": ObjectId(challenge_id)})
        return {"message": "Challenge deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/challenges/{challenge_id}/checkin", response_model=DailyCheckIn)
async def create_checkin(challenge_id: str, checkin: DailyCheckInCreate):
    """Create a daily check-in for a challenge"""
    try:
        challenge = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        if not challenge["locked"]:
            raise HTTPException(status_code=400, detail="Challenge must be locked to check in")
        
        # Get today's date in YYYY-MM-DD format
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Check if already checked in today
        existing = await db.checkins.find_one({
            "challenge_id": challenge_id,
            "date": today
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Already checked in today")
        
        checkin_dict = {
            "challenge_id": challenge_id,
            "date": today,
            "completed": checkin.completed,
            "notes": checkin.notes,
            "created_at": datetime.utcnow(),
        }
        
        result = await db.checkins.insert_one(checkin_dict)
        checkin_dict["_id"] = result.inserted_id
        
        # Update challenge stats
        if checkin.completed:
            await db.challenges.update_one(
                {"_id": ObjectId(challenge_id)},
                {"$inc": {"completed_checkins": 1, "total_checkins": 1}}
            )
        else:
            await db.challenges.update_one(
                {"_id": ObjectId(challenge_id)},
                {"$inc": {"total_checkins": 1}}
            )
        
        return checkin_helper(checkin_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/challenges/{challenge_id}/checkins", response_model=List[DailyCheckIn])
async def get_checkins(challenge_id: str):
    """Get all check-ins for a challenge"""
    checkins = await db.checkins.find({"challenge_id": challenge_id}).sort("date", -1).to_list(1000)
    return [checkin_helper(checkin) for checkin in checkins]

@api_router.get("/challenges/{challenge_id}/today-checkin")
async def get_today_checkin(challenge_id: str):
    """Check if there's a check-in for today"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    checkin = await db.checkins.find_one({
        "challenge_id": challenge_id,
        "date": today
    })
    
    if checkin:
        return checkin_helper(checkin)
    return None

@api_router.post("/challenges/{challenge_id}/judgment")
async def final_judgment(challenge_id: str, judgment: JudgmentRequest):
    """Final judgment - was the user honest?"""
    try:
        challenge = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        if not challenge["locked"]:
            raise HTTPException(status_code=400, detail="Challenge must be locked")
        
        # Check if challenge period has ended
        now = datetime.utcnow()
        if now < challenge["end_date"]:
            raise HTTPException(status_code=400, detail="Challenge period has not ended yet")
        
        new_status = "completed" if judgment.was_honest else "failed"
        
        await db.challenges.update_one(
            {"_id": ObjectId(challenge_id)},
            {"$set": {"status": new_status}}
        )
        
        updated_challenge = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
        return challenge_helper(updated_challenge)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/settings")
async def get_settings():
    """Get user settings"""
    settings = await db.settings.find_one({"user_id": "default"})
    if not settings:
        # Return default settings
        return {"language": "en", "notification_time": "09:00"}
    return {
        "language": settings.get("language", "en"),
        "notification_time": settings.get("notification_time", "09:00"),
    }

@api_router.post("/settings")
async def update_settings(settings: UserSettings):
    """Update user settings"""
    await db.settings.update_one(
        {"user_id": "default"},
        {"$set": {
            "language": settings.language,
            "notification_time": settings.notification_time,
        }},
        upsert=True
    )
    return settings


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
