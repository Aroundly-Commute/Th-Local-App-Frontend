import motor.motor_asyncio
import asyncio
import os

async def test_conn():
    try:
        mongo_url = "mongodb://localhost:27017"
        client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        print("MONGODB_OK")
    except Exception as e:
        print(f"MONGODB_ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
