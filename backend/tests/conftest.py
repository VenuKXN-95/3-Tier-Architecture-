"""
Pytest configuration and shared fixtures for the E-Commerce Order System.

TEST STRATEGY
─────────────
Tests use a real MongoDB instance (the same replica set used in development).
This is intentional — MongoDB-specific behaviour (atomic $inc, transactions,
ObjectId) cannot be properly tested against a mock.

The test database is named 'ecommerce_test' to keep test data separate.
All collections are cleared before each test via the `clean_db` fixture.

A separate test client is used to avoid modifying the production database.

HOW TO RUN TESTS
─────────────────
1. Start MongoDB (replica set must be running for transaction tests):
   docker compose up -d mongodb mongo-init

2. Run tests:
   cd backend
   pytest tests/ -v

ENVIRONMENT
───────────
Tests read MONGO_URI from environment or fall back to the local default.
If running tests inside Docker, set MONGO_URI accordingly.
"""

import os
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

from app.main import create_app

# ── Test MongoDB URI ──────────────────────────────────────────────────
TEST_MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/?replicaSet=rs0")
TEST_DB_NAME = "ecommerce_test"


@pytest.fixture(scope="session")
def mongo_client():
    """Single MongoDB client for the entire test session."""
    client = MongoClient(TEST_MONGO_URI)
    client.admin.command("ping")
    yield client
    client.close()


@pytest.fixture(scope="session")
def test_app(mongo_client):
    """
    Create the FastAPI app for testing.
    Override the MongoDB connection to point at the test database.
    """
    import app.database.mongodb as mongo_module

    # Save original functions
    orig_connect = mongo_module.connect_to_mongo
    orig_close = mongo_module.close_mongo_connection

    # Patch functions so app lifespan does not reset test DB
    mongo_module._client = mongo_client
    mongo_module._db = mongo_client[TEST_DB_NAME]
    mongo_module._create_indexes(mongo_module._db)

    mongo_module.connect_to_mongo = lambda: None
    mongo_module.close_mongo_connection = lambda: None

    application = create_app()

    yield application

    mongo_module.connect_to_mongo = orig_connect
    mongo_module.close_mongo_connection = orig_close


@pytest.fixture(scope="session")
def client(test_app):
    """FastAPI TestClient for the entire test session."""
    with TestClient(test_app) as c:
        yield c


@pytest.fixture(autouse=True)
def clean_db(mongo_client):
    """
    Drop all test collections before every test.
    This ensures tests are fully isolated.
    """
    db = mongo_client[TEST_DB_NAME]
    for collection in [
        "users",
        "categories",
        "products",
        "inventory",
        "carts",
        "orders",
    ]:
        db[collection].delete_many({})
    yield
