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
    if _db is None:
        connect_to_mongo()
    assert _db is not None
    return _db


def _create_indexes(db: Database) -> None:
    _safe_create_index(db.categories, "slug")
    _safe_create_index(db.products, "slug")
    _safe_create_index(db.inventory, "product_id")
    _safe_create_index(db.carts, "user_id")


def _safe_create_index(collection, field: str) -> None:
    try:
        collection.delete_many({field: None})
        collection.create_index(field, unique=True)
    except Exception as exc:  # pylint: disable=broad-exception-caught
        logger.warning(
            "Failed to create index on %s.%s: %s", collection.name, field, exc
        )
