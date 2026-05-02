from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# DB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI(title="EcoRide API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ========== Models ==========
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "passenger"  # 'driver' or 'passenger'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Vehicle(BaseModel):
    make: str = ""
    model: str = ""
    color: str = ""
    license_plate: str = ""
    year: int = 0

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar_url: str = ""
    rating: float = 5.0
    rides_count: int = 0
    is_verified: bool = False
    vehicle: Optional[Vehicle] = None
    bio: str = ""
    money_saved: float = 0.0
    co2_saved_kg: float = 0.0

class TokenResp(BaseModel):
    access_token: str
    user: UserOut

class RideCreate(BaseModel):
    origin: str
    destination: str
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    departure_time: str  # ISO
    seats_available: int = 3
    price_per_seat: float = 5.0
    notes: str = ""

class RideOut(BaseModel):
    id: str
    driver_id: str
    driver_name: str
    driver_avatar: str
    driver_rating: float
    driver_verified: bool
    driver_vehicle: Optional[Vehicle] = None
    origin: str
    destination: str
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    departure_time: str
    seats_available: int
    price_per_seat: float
    notes: str
    distance_km: float = 0.0
    co2_saved_kg: float = 0.0

class MessageCreate(BaseModel):
    text: str

class MessageOut(BaseModel):
    id: str
    chat_id: str
    sender_id: str
    sender_name: str
    text: str
    created_at: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = None
    vehicle: Optional[Vehicle] = None


# ========== Helpers ==========
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def user_doc_to_out(u: dict) -> UserOut:
    return UserOut(
        id=u["id"],
        email=u["email"],
        name=u["name"],
        role=u.get("role", "passenger"),
        avatar_url=u.get("avatar_url", ""),
        rating=u.get("rating", 5.0),
        rides_count=u.get("rides_count", 0),
        is_verified=u.get("is_verified", False),
        vehicle=Vehicle(**u["vehicle"]) if u.get("vehicle") else None,
        bio=u.get("bio", ""),
        money_saved=u.get("money_saved", 0.0),
        co2_saved_kg=u.get("co2_saved_kg", 0.0),
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def haversine_km(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, atan2
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


# ========== Auth ==========
@api_router.post("/auth/register", response_model=TokenResp)
async def register(body: UserRegister):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "avatar_url": "",
        "rating": 5.0,
        "rides_count": 0,
        "is_verified": False,
        "bio": "",
        "money_saved": 0.0,
        "co2_saved_kg": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    doc.pop("password_hash", None)
    return TokenResp(access_token=token, user=user_doc_to_out(doc))


@api_router.post("/auth/login", response_model=TokenResp)
async def login(body: UserLogin):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return TokenResp(access_token=token, user=user_doc_to_out(user))


@api_router.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return user_doc_to_out(user)


@api_router.post("/auth/logout")
async def logout(user=Depends(get_current_user)):
    return {"ok": True}


# ========== Profile ==========
@api_router.put("/users/me", response_model=UserOut)
async def update_me(body: ProfileUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in body.dict(exclude_unset=True).items() if v is not None}
    if "vehicle" in update and update["vehicle"]:
        update["vehicle"] = update["vehicle"] if isinstance(update["vehicle"], dict) else update["vehicle"].dict()
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return user_doc_to_out(fresh)


# ========== Rides ==========
@api_router.post("/rides", response_model=RideOut)
async def create_ride(body: RideCreate, user=Depends(get_current_user)):
    if user.get("role") != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can create rides")
    rid = str(uuid.uuid4())
    distance = haversine_km(body.origin_lat, body.origin_lng, body.dest_lat, body.dest_lng)
    co2 = round(distance * 0.12, 2)  # ~120g/km saved per shared seat
    doc = {
        "id": rid,
        "driver_id": user["id"],
        **body.dict(),
        "distance_km": round(distance, 2),
        "co2_saved_kg": co2,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "open",
    }
    await db.rides.insert_one(doc)
    return await _ride_to_out(doc)


async def _ride_to_out(ride: dict) -> RideOut:
    driver = await db.users.find_one({"id": ride["driver_id"]}, {"_id": 0, "password_hash": 0}) or {}
    return RideOut(
        id=ride["id"],
        driver_id=ride["driver_id"],
        driver_name=driver.get("name", "Unknown"),
        driver_avatar=driver.get("avatar_url", ""),
        driver_rating=driver.get("rating", 5.0),
        driver_verified=driver.get("is_verified", False),
        driver_vehicle=Vehicle(**driver["vehicle"]) if driver.get("vehicle") else None,
        origin=ride["origin"],
        destination=ride["destination"],
        origin_lat=ride["origin_lat"],
        origin_lng=ride["origin_lng"],
        dest_lat=ride["dest_lat"],
        dest_lng=ride["dest_lng"],
        departure_time=ride["departure_time"],
        seats_available=ride["seats_available"],
        price_per_seat=ride["price_per_seat"],
        notes=ride.get("notes", ""),
        distance_km=ride.get("distance_km", 0),
        co2_saved_kg=ride.get("co2_saved_kg", 0),
    )


@api_router.get("/rides", response_model=List[RideOut])
async def list_rides(q: Optional[str] = None):
    query = {"status": "open"}
    if q:
        query["$or"] = [
            {"origin": {"$regex": q, "$options": "i"}},
            {"destination": {"$regex": q, "$options": "i"}},
        ]
    rides = await db.rides.find(query, {"_id": 0}).sort("departure_time", 1).to_list(100)
    return [await _ride_to_out(r) for r in rides]


@api_router.get("/rides/my")
async def my_rides(user=Depends(get_current_user)):
    """Returns upcoming + past rides for the current user (as driver or passenger)."""
    now_iso = datetime.now(timezone.utc).isoformat()
    driver_rides = await db.rides.find({"driver_id": user["id"]}, {"_id": 0}).to_list(200)
    bookings = await db.bookings.find({"passenger_id": user["id"]}, {"_id": 0}).to_list(200)
    passenger_rides = []
    for b in bookings:
        r = await db.rides.find_one({"id": b["ride_id"]}, {"_id": 0})
        if r:
            r["_booking"] = b
            passenger_rides.append(r)

    upcoming, past = [], []
    for r in driver_rides + passenger_rides:
        out = await _ride_to_out(r)
        role = "driver" if r.get("driver_id") == user["id"] else "passenger"
        status = r.get("status", "open")
        chat_id = None
        if role == "driver":
            b = await db.bookings.find_one({"ride_id": r["id"]}, {"_id": 0})
            chat_id = b.get("chat_id") if b else None
        else:
            chat_id = r.get("_booking", {}).get("chat_id")
        item = {**out.dict(), "role": role, "status": status, "chat_id": chat_id}
        if r["departure_time"] >= now_iso and status != "cancelled":
            upcoming.append(item)
        else:
            past.append(item)
    upcoming.sort(key=lambda x: x["departure_time"])
    past.sort(key=lambda x: x["departure_time"], reverse=True)
    return {"upcoming": upcoming, "past": past}


@api_router.get("/rides/{ride_id}", response_model=RideOut)
async def get_ride(ride_id: str):
    ride = await db.rides.find_one({"id": ride_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    return await _ride_to_out(ride)


class BookRequest(BaseModel):
    seats: int = 1

@api_router.post("/rides/{ride_id}/book")
async def book_ride(ride_id: str, body: BookRequest, user=Depends(get_current_user)):
    ride = await db.rides.find_one({"id": ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    if ride["seats_available"] < body.seats:
        raise HTTPException(status_code=400, detail="Not enough seats")
    chat_id = f"{ride_id}:{user['id']}"
    await db.bookings.update_one(
        {"ride_id": ride_id, "passenger_id": user["id"]},
        {"$set": {
            "ride_id": ride_id,
            "passenger_id": user["id"],
            "driver_id": ride["driver_id"],
            "seats": body.seats,
            "chat_id": chat_id,
            "status": "confirmed",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    await db.rides.update_one({"id": ride_id}, {"$inc": {"seats_available": -body.seats}})
    # Stat updates
    saved_money = ride["price_per_seat"] * body.seats * 0.5
    co2 = ride.get("co2_saved_kg", 0) * body.seats
    await db.users.update_one({"id": user["id"]}, {
        "$inc": {"money_saved": saved_money, "co2_saved_kg": co2, "rides_count": 1}
    })
    await db.users.update_one({"id": ride["driver_id"]}, {
        "$inc": {"money_saved": saved_money, "co2_saved_kg": co2, "rides_count": 1}
    })
    return {"ok": True, "chat_id": chat_id}


# ========== Sustainability ==========
@api_router.get("/sustainability/me")
async def my_sustainability(user=Depends(get_current_user)):
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    rides_count = fresh.get("rides_count", 0)
    return {
        "money_saved": round(fresh.get("money_saved", 0.0), 2),
        "co2_saved_kg": round(fresh.get("co2_saved_kg", 0.0), 2),
        "rides_count": rides_count,
        "trees_equivalent": round(fresh.get("co2_saved_kg", 0.0) / 21.0, 2),  # ~21kg CO2 per tree/year
    }


# ========== Chats ==========
@api_router.get("/chats")
async def list_chats(user=Depends(get_current_user)):
    bookings = await db.bookings.find({
        "$or": [{"passenger_id": user["id"]}, {"driver_id": user["id"]}]
    }, {"_id": 0}).to_list(200)
    out = []
    for b in bookings:
        ride = await db.rides.find_one({"id": b["ride_id"]}, {"_id": 0}) or {}
        other_id = b["driver_id"] if b["passenger_id"] == user["id"] else b["passenger_id"]
        other = await db.users.find_one({"id": other_id}, {"_id": 0, "password_hash": 0}) or {}
        last = await db.messages.find_one({"chat_id": b["chat_id"]}, {"_id": 0}, sort=[("created_at", -1)])
        out.append({
            "chat_id": b["chat_id"],
            "ride_id": b["ride_id"],
            "other_user": {
                "id": other.get("id"),
                "name": other.get("name", "Unknown"),
                "avatar_url": other.get("avatar_url", ""),
                "is_verified": other.get("is_verified", False),
            },
            "ride_route": f"{ride.get('origin', '')} → {ride.get('destination', '')}",
            "last_message": last["text"] if last else "Say hi! 👋",
            "last_time": last["created_at"] if last else b.get("created_at", ""),
        })
    out.sort(key=lambda x: x["last_time"], reverse=True)
    return out


@api_router.get("/chats/{chat_id}/messages", response_model=List[MessageOut])
async def get_messages(chat_id: str, user=Depends(get_current_user)):
    msgs = await db.messages.find({"chat_id": chat_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [MessageOut(**m) for m in msgs]


@api_router.post("/chats/{chat_id}/messages", response_model=MessageOut)
async def post_message(chat_id: str, body: MessageCreate, user=Depends(get_current_user)):
    msg = {
        "id": str(uuid.uuid4()),
        "chat_id": chat_id,
        "sender_id": user["id"],
        "sender_name": user["name"],
        "text": body.text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    out = MessageOut(**msg)
    # broadcast
    await ws_manager.broadcast(chat_id, out.dict())
    return out


# ========== WebSocket ==========
class WSManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, chat_id: str, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.rooms.setdefault(chat_id, []).append(ws)

    async def disconnect(self, chat_id: str, ws: WebSocket):
        async with self.lock:
            if chat_id in self.rooms and ws in self.rooms[chat_id]:
                self.rooms[chat_id].remove(ws)

    async def broadcast(self, chat_id: str, data: dict):
        conns = list(self.rooms.get(chat_id, []))
        for ws in conns:
            try:
                await ws.send_json(data)
            except Exception:
                pass

ws_manager = WSManager()


@app.websocket("/api/ws/chat/{chat_id}")
async def chat_ws(websocket: WebSocket, chat_id: str):
    await ws_manager.connect(chat_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # keepalive; clients post via REST
    except WebSocketDisconnect:
        await ws_manager.disconnect(chat_id, websocket)


# ========== Health ==========
@api_router.get("/")
async def root():
    return {"service": "EcoRide API", "status": "ok"}


# ========== Seeding ==========
SEED_USERS = [
    {
        "email": "sarah.driver@ecoride.app",
        "password": "password123",
        "name": "Sarah Chen",
        "role": "driver",
        "avatar_url": "https://images.unsplash.com/photo-1688619101875-0528b48b68e7?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
        "rating": 4.9,
        "rides_count": 124,
        "is_verified": True,
        "vehicle": {"make": "Tesla", "model": "Model 3", "color": "Pearl White", "license_plate": "ECO-318", "year": 2023},
        "bio": "Eco-conscious commuter. Love sharing rides on the SF↔︎Palo Alto route!",
        "money_saved": 1240.50,
        "co2_saved_kg": 320.4,
    },
    {
        "email": "mike.rider@ecoride.app",
        "password": "password123",
        "name": "Mike Johnson",
        "role": "passenger",
        "avatar_url": "https://images.unsplash.com/photo-1629490026996-f3307ca4ba6d?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
        "rating": 4.8,
        "rides_count": 47,
        "is_verified": True,
        "bio": "Daily commuter, coffee enthusiast.",
        "money_saved": 380.00,
        "co2_saved_kg": 92.3,
    },
    {
        "email": "alex.driver@ecoride.app",
        "password": "password123",
        "name": "Alex Rivera",
        "role": "driver",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
        "rating": 4.95,
        "rides_count": 210,
        "is_verified": True,
        "vehicle": {"make": "Toyota", "model": "Prius Prime", "color": "Sea Glass", "license_plate": "GRN-022", "year": 2022},
        "bio": "Hybrid driver. Coffee and good music guaranteed.",
        "money_saved": 2100.00,
        "co2_saved_kg": 540.8,
    },
    {
        "email": "priya.driver@ecoride.app",
        "password": "password123",
        "name": "Priya Patel",
        "role": "driver",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
        "rating": 4.85,
        "rides_count": 89,
        "is_verified": True,
        "vehicle": {"make": "Hyundai", "model": "Ioniq 5", "color": "Cyber Green", "license_plate": "ECO-507", "year": 2024},
        "bio": "EV enthusiast. Quiet rides, good vibes.",
        "money_saved": 880.00,
        "co2_saved_kg": 210.5,
    },
]

SEED_RIDES = [
    {
        "driver_email": "sarah.driver@ecoride.app",
        "origin": "San Francisco, CA",
        "destination": "Palo Alto, CA",
        "origin_lat": 37.7749, "origin_lng": -122.4194,
        "dest_lat": 37.4419, "dest_lng": -122.1430,
        "seats_available": 3, "price_per_seat": 12.0,
        "notes": "Daily morning commute. Leaving sharp at 8am."
    },
    {
        "driver_email": "alex.driver@ecoride.app",
        "origin": "Oakland, CA",
        "destination": "San Jose, CA",
        "origin_lat": 37.8044, "origin_lng": -122.2712,
        "dest_lat": 37.3382, "dest_lng": -121.8863,
        "seats_available": 2, "price_per_seat": 15.0,
        "notes": "Express route via 880. No stops."
    },
    {
        "driver_email": "priya.driver@ecoride.app",
        "origin": "Berkeley, CA",
        "destination": "San Francisco, CA",
        "origin_lat": 37.8715, "origin_lng": -122.2730,
        "dest_lat": 37.7749, "dest_lng": -122.4194,
        "seats_available": 4, "price_per_seat": 8.0,
        "notes": "Bay Bridge crossing. Charge port available."
    },
    {
        "driver_email": "sarah.driver@ecoride.app",
        "origin": "Mountain View, CA",
        "destination": "San Francisco, CA",
        "origin_lat": 37.3861, "origin_lng": -122.0839,
        "dest_lat": 37.7749, "dest_lng": -122.4194,
        "seats_available": 3, "price_per_seat": 14.0,
        "notes": "Evening return trip. Music friendly."
    },
]


async def seed():
    await db.users.create_index("email", unique=True)
    await db.rides.create_index("status")

    # Admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@ecoride.app")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    if not await db.users.find_one({"email": admin_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "avatar_url": "",
            "rating": 5.0,
            "rides_count": 0,
            "is_verified": True,
            "bio": "",
            "money_saved": 0.0,
            "co2_saved_kg": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    for u in SEED_USERS:
        if not await db.users.find_one({"email": u["email"]}):
            doc = {**u, "id": str(uuid.uuid4()), "password_hash": hash_password(u["password"]),
                   "created_at": datetime.now(timezone.utc).isoformat()}
            doc.pop("password", None)
            await db.users.insert_one(doc)

    # Rides — only seed if none exist
    if await db.rides.count_documents({}) == 0:
        base_time = datetime.now(timezone.utc) + timedelta(hours=2)
        for i, r in enumerate(SEED_RIDES):
            driver = await db.users.find_one({"email": r["driver_email"]})
            if not driver:
                continue
            distance = haversine_km(r["origin_lat"], r["origin_lng"], r["dest_lat"], r["dest_lng"])
            ride_doc = {
                "id": str(uuid.uuid4()),
                "driver_id": driver["id"],
                "origin": r["origin"],
                "destination": r["destination"],
                "origin_lat": r["origin_lat"], "origin_lng": r["origin_lng"],
                "dest_lat": r["dest_lat"], "dest_lng": r["dest_lng"],
                "departure_time": (base_time + timedelta(hours=i * 3)).isoformat(),
                "seats_available": r["seats_available"],
                "price_per_seat": r["price_per_seat"],
                "notes": r["notes"],
                "distance_km": round(distance, 2),
                "co2_saved_kg": round(distance * 0.12, 2),
                "status": "open",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.rides.insert_one(ride_doc)

    logger.info("Seeding complete")


# Mount
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_start():
    await seed()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
