import logging
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from app.config.settings import settings

logger = logging.getLogger(__name__)

_client: Optional[MongoClient] = None
_db: Optional[Database] = None


def connect_to_mongo() -> None:
    global _client, _db
    if _client is None:
        logger.info("Connecting to MongoDB at %s", settings.mongo_uri)
        _client = MongoClient(settings.mongo_uri)
        _db = _client[settings.mongo_db_name]
        _create_indexes(_db)


def close_mongo_connection() -> None:
    global _client, _db
    if _client is not None:
        logger.info("Closing MongoDB connection")
        _client.close()
        _client = None
        _db = None


def get_database() -> Database:
    global _db
    if _db is None:
        connect_to_mongo()
    assert _db is not None
    return _db


def _create_indexes(db: Database) -> None:
    db.categories.create_index("slug", unique=True)
    db.products.create_index("slug", unique=True)
    db.inventory.create_index("product_id", unique=True)
    db.carts.create_index("user_id", unique=True)
