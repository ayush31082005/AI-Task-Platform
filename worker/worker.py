import json
import os
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient
from redis import Redis

load_dotenv()

MONGO_URI = os.getenv(
    "MONGO_URI", "mongodb://127.0.0.1:27017/ai_task_platform"
)
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")

mongo = MongoClient(MONGO_URI)
db = mongo.get_default_database()
tasks = db["tasks"]
redis_client = Redis.from_url(REDIS_URL, decode_responses=True)


def now():
    return datetime.now(timezone.utc)


def process(operation: str, text: str):
    if operation == "uppercase":
        return text.upper()
    if operation == "lowercase":
        return text.lower()
    if operation == "reverse":
        return text[::-1]
    if operation == "word_count":
        return len(text.split())
    raise ValueError(f"Unsupported operation: {operation}")


def add_log(task_id, message):
    from bson import ObjectId

    tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$push": {"logs": {"message": message, "at": now()}}},
    )


def handle_job(payload):
    from bson import ObjectId

    task_id = payload["taskId"]
    object_id = ObjectId(task_id)
    task = tasks.find_one({"_id": object_id})

    if not task:
        print(f"Task not found: {task_id}")
        return

    tasks.update_one(
        {"_id": object_id},
        {
            "$set": {
                "status": "Running",
                "startedAt": now(),
                "error": None,
            },
            "$push": {
                "logs": {
                    "message": "Worker started processing",
                    "at": now(),
                }
            },
        },
    )

    try:
        result = process(task["operation"], task["inputText"])
        time.sleep(1)

        tasks.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "status": "Success",
                    "result": result,
                    "completedAt": now(),
                },
                "$push": {
                    "logs": {
                        "message": "Task completed successfully",
                        "at": now(),
                    }
                },
            },
        )
        print(f"Completed task {task_id}")
    except Exception as exc:
        tasks.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "status": "Failed",
                    "error": str(exc),
                    "completedAt": now(),
                },
                "$push": {
                    "logs": {
                        "message": f"Task failed: {exc}",
                        "at": now(),
                    }
                },
            },
        )
        print(f"Failed task {task_id}: {exc}")


def main():
    print("Python worker started")
    print("Waiting for jobs on Redis list: ai_tasks")

    while True:
        try:
            item = redis_client.brpop("ai_tasks", timeout=5)
            if not item:
                continue
            _, raw_payload = item
            handle_job(json.loads(raw_payload))
        except KeyboardInterrupt:
            print("Worker stopped")
            break
        except Exception as exc:
            print(f"Worker loop error: {exc}")
            time.sleep(3)


if __name__ == "__main__":
    main()
