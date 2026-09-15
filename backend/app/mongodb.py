"""MongoDB Atlas database connection manager and helper utilities."""
import os
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

load_dotenv()
logger = logging.getLogger("hr_dashboard.mongodb")

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "hr_intelligence")

_client = None
_db = None

def get_mongo_client():
    global _client
    if _client is not None:
        return _client
    uri = os.getenv("MONGODB_URI")
    if not uri:
        return None
    try:
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # Verify connection
        _client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas!")
        return _client
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as err:
        logger.warning(f"Could not connect to MongoDB Atlas: {err}")
        _client = None
        return None

def get_mongo_db():
    global _db
    client = get_mongo_client()
    if client is None:
        return None
    if _db is None:
        _db = client[MONGODB_DB_NAME]
        init_mongo_indexes(_db)
    return _db

def is_mongo_available():
    return get_mongo_db() is not None

def init_mongo_indexes(db):
    try:
        db.employees.create_index("employee_id", unique=True)
        db.employees.create_index("department")
        db.employees.create_index("location")

        db.attendance.create_index("attendance_id", unique=True)
        db.attendance.create_index("employee_id")
        db.attendance.create_index("date")

        db.performance.create_index("performance_id", unique=True)
        db.performance.create_index("employee_id")

        db.candidates.create_index("candidate_id", unique=True)
        db.candidates.create_index("department")
        db.candidates.create_index("status")
    except Exception as err:
        logger.warning(f"Error initializing MongoDB indexes: {err}")
