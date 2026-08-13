"""
FastAPI application factory and router registration.

main.py wires the app together — it does NOT contain business logic,
database access, or route implementations.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Connect to MongoDB on startup; close connection on shutdown."""
    connect_to_mongo()
    yield
    close_mongo_connection()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description="REST API for the E-Commerce Order System",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "ok", "service": settings.app_name}

    from app.routes import categories, products, inventory, users, cart, orders
    from app.routes.orders import user_orders_router

    app.include_router(users.router, prefix="/api/users", tags=["Users"])
    app.include_router(user_orders_router, prefix="/api/users", tags=["Orders"])
    app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
    app.include_router(products.router, prefix="/api/products", tags=["Products"])
    app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
    app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
    app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])

    logger.info("Application ready: %s", settings.app_name)
    return app


app = create_app()

# adding comment for checking purpose123