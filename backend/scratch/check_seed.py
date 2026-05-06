import motor.motor_asyncio
import asyncio

async def check_db():
    try:
        mongo_url = "mongodb://localhost:27017"
        client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
        db = client["ecoride_db"]
        count = await db.users.count_documents({})
        print(f"USER_COUNT: {count}")
        users = await db.users.find({}, {"email": 1, "_id": 0}).to_list(10)
        print(f"USERS: {users}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
