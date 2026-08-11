# 3-Tier Architecture E-Commerce Order System — Comprehensive Documentation

> **Project**: ShopFlow – E-Commerce Order System
> **Stack**: React (TypeScript) · FastAPI (Python 3.12) · MongoDB 7 (Replica Set)
> **Deployment**: Docker Compose (4 containers) · Nginx reverse proxy
> **CI/CD**: GitHub Actions (4-stage pipeline)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Tier 1 — Presentation Layer (Frontend)](#3-tier-1--presentation-layer-frontend)
4. [Tier 2 — Application Layer (Backend)](#4-tier-2--application-layer-backend)
5. [Tier 3 — Data Layer (MongoDB)](#5-tier-3--data-layer-mongodb)
6. [Security — Authentication & Password Hashing](#6-security--authentication--password-hashing)
7. [Docker & Infrastructure](#7-docker--infrastructure)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [API Reference](#9-api-reference)
10. [Database Schema](#10-database-schema)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Configuration & Environment Variables](#12-configuration--environment-variables)
13. [Testing Strategy](#13-testing-strategy)
14. [Common Interview Questions & Answers](#14-common-interview-questions--answers)

---

## 1. Architecture Overview

This project implements a **classic 3-Tier Architecture** fully containerised with Docker Compose:

```
TIER 1 — PRESENTATION
  React 18 + TypeScript + Vite → served by Nginx (port 80)
  Nginx also acts as reverse proxy for /api/* requests
        |
        | HTTP /api/*
        v
TIER 2 — APPLICATION
  FastAPI (Python 3.12) + Uvicorn (port 8000)
  Repository → Service → Route pattern
        |
        | PyMongo
        v
TIER 3 — DATA
  MongoDB 7 — single-node Replica Set (rs0)
  Collections: users, products, categories, inventory, carts, orders
```

### Why These Three Tiers?

| Tier | Technology | Responsibility |
|------|-----------|----------------|
| Presentation | React + Nginx | Render UI, handle user interaction, forward API calls |
| Application | FastAPI + Uvicorn | Business logic, data validation, authentication, routing |
| Data | MongoDB 7 | Persistent storage, indexing, atomic operations |

**Key Design Decisions:**
- **MongoDB Replica Set (rs0)** is mandatory because multi-document ACID transactions require a replica set. A standalone `mongod` would fail during order creation which modifies 3 collections atomically.
- **Nginx as reverse proxy** means the browser talks only to port 80. `/api/*` requests are forwarded by Nginx to the FastAPI container. The backend is never directly exposed to the internet.
- **Repository Pattern** in the backend decouples database operations from business logic, making the code unit-testable and swappable.

---

## 2. Project Structure

```
3-Tier Architecture with Mongo DB/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions (4 jobs)
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   └── settings.py        # Pydantic settings (reads .env / env vars)
│   │   ├── core/
│   │   │   └── security.py        # bcrypt hashing + JWT token creation/decoding
│   │   ├── database/
│   │   │   └── mongodb.py         # MongoDB connection + index creation
│   │   ├── repositories/          # DB query layer (Repository pattern)
│   │   │   ├── cart_repository.py
│   │   │   ├── inventory_repository.py
│   │   │   ├── order_repository.py
│   │   │   ├── product_repository.py
│   │   │   └── user_repository.py
│   │   ├── routes/                # HTTP endpoint handlers (thin controllers)
│   │   │   ├── cart.py
│   │   │   ├── categories.py
│   │   │   ├── inventory.py
│   │   │   ├── orders.py
│   │   │   ├── products.py
│   │   │   └── users.py
│   │   ├── schemas/               # Pydantic request/response models
│   │   │   ├── object_id.py       # PyObjectId — custom BSON ObjectId type
│   │   │   └── user.py
│   │   ├── services/              # Business logic layer
│   │   │   ├── cart_service.py
│   │   │   ├── order_service.py
│   │   │   ├── product_service.py
│   │   │   └── user_service.py
│   │   ├── dependencies.py        # FastAPI Depends() helpers
│   │   └── main.py                # App factory, lifespan, router registration
│   ├── tests/
│   │   ├── conftest.py            # Shared fixtures (TestClient, clean_db)
│   │   ├── test_cart.py
│   │   ├── test_categories.py
│   │   ├── test_inventory.py
│   │   ├── test_orders.py
│   │   └── test_products.py
│   ├── Dockerfile                 # python:3.12-slim → uvicorn
│   ├── pyproject.toml             # Black, Mypy, Pylint, Bandit, Pytest config
│   ├── requirements.txt           # Production dependencies
│   └── requirements-dev.txt       # Dev/test dependencies
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── hooks/                 # Custom React hooks (useData)
│   │   ├── lib/                   # Utilities (formatDate, cn)
│   │   ├── pages/                 # Route-level components
│   │   │   ├── CartPage.tsx
│   │   │   ├── InventoryPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   └── UserPage.tsx       # Login (JWT) + Register tabs
│   │   ├── services/
│   │   │   └── api.ts             # Axios-based API client
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript interfaces
│   │   ├── App.tsx                # React Router setup
│   │   └── index.css              # Design tokens (dark mode, CSS variables)
│   ├── Dockerfile                 # Multi-stage: node:20-alpine → nginx:alpine
│   ├── nginx.conf                 # SPA routing + /api proxy + gzip + cache
│   └── package.json
├── docker-compose.yml             # 4 services: mongodb, mongo-init, backend, frontend
├── seed_data.py                   # Seeds 5 categories, 50 products, 50 inventory
└── .env.example                   # Template for environment variables
```

---

## 3. Tier 1 — Presentation Layer (Frontend)

### Technology Stack

| Library | Version | Role |
|---------|---------|------|
| React | 18.3.1 | UI component framework |
| TypeScript | 5.6.3 | Static typing |
| Vite | 5.4.10 | Build tool + dev server |
| React Router DOM | 6.28.2 | Client-side routing |
| Axios | 1.7.7 | HTTP client to call backend API |
| Framer Motion | 11.x | Animations |
| Radix UI | various | Headless accessible components |
| Lucide React | 0.453 | SVG icon library |
| TailwindCSS | 3.4.14 | Utility-first CSS |
| Nginx | alpine | Static file server + reverse proxy |

### Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect | Redirect to `/products` |
| `/products` | `ProductsPage` | Browse all products, filter by category |
| `/products/:id` | `ProductDetailPage` | Product detail, add to cart |
| `/cart` | `CartPage` | View cart, place order |
| `/orders` | `OrdersPage` | View orders, cancel orders |
| `/inventory` | `InventoryPage` | View and update stock levels |
| `/profile` | `UserPage` | Sign In (JWT) or Create Account |

### Frontend Architecture

**`api.ts`** — Single Axios instance. All API domains are namespaced:
```typescript
productsApi.list()          // GET /api/products
usersApi.login(payload)     // POST /api/users/login → { access_token, user }
ordersApi.cancel(orderId)   // POST /api/orders/{id}/cancel
inventoryApi.update(...)    // PUT /api/inventory/{product_id}
```

**`useData` hook** — Generic fetcher that handles loading, error, and refetch:
```typescript
const { data, loading, error, refetch } = useData<Product[]>(
  () => productsApi.list(),
  [categoryId]   // dependency array triggers refetch
)
```

**Authentication Flow (UserPage.tsx):**
1. **Create Account tab**: Name + Email + Password → `POST /api/users` → auto-login → `POST /api/users/login` → JWT stored in `localStorage('access_token')`.
2. **Sign In (JWT) tab**: Email + Password → `POST /api/users/login` → JWT stored in `localStorage('access_token')`.
3. **Sign Out**: Clears both `localStorage('access_token')` and `localStorage('demo_user_id')`.

**Nginx in Production (nginx.conf):**
```nginx
location / {
    try_files $uri $uri/ /index.html;   # SPA fallback routing
}
location /api/ {
    proxy_pass http://backend:8000;     # Forward API calls to FastAPI
}
```

Static assets are served with `Cache-Control: public, immutable` for 1 year. Gzip compression enabled for HTML/CSS/JSON/JS.

---

## 4. Tier 2 — Application Layer (Backend)

### Technology Stack

| Library | Version | Role |
|---------|---------|------|
| FastAPI | 0.111–0.120 | Web framework (ASGI) |
| Uvicorn | 0.30–0.35 | ASGI server |
| PyMongo | 4.8–5.0 | MongoDB driver |
| Pydantic | 2.7+ | Data validation and serialisation |
| pydantic-settings | 2.3+ | Environment variable management |
| pyjwt | 2.8+ | JWT token encoding/decoding |
| bcrypt | (direct) | Password hashing |

### Layered Architecture

```
HTTP Request
     |
     v
[routes/*.py]           <- thin controller: parse input, call service, return response
     |
     v
[services/*.py]         <- business logic: orchestrate repositories, enforce rules
     |
     v
[repositories/*.py]     <- data access: MongoDB CRUD operations only
     |
     v
[database/mongodb.py]   <- connection management, index creation
     |
     v
MongoDB (ecommerce database)
```

### Application Factory Pattern (main.py)

```python
def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=["*"])
    app.include_router(users.router, prefix="/api/users")
    app.include_router(orders.router, prefix="/api/orders")
    # ... all other routers
    return app

app = create_app()
```

The `lifespan` context manager runs `connect_to_mongo()` on startup and `close_mongo_connection()` on shutdown.

### Settings Management (config/settings.py)

Uses `pydantic-settings` `BaseSettings` — reads environment variables first, then `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017/?replicaSet=rs0` | MongoDB connection string |
| `MONGO_DB_NAME` | `ecommerce` | Database name |
| `DEBUG` | `false` | Enable debug logging |
| `SECRET_KEY` | `super-secret-jwt-key-...` | JWT signing secret |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT token lifetime |

### MongoDB Connection (database/mongodb.py)

- **Singleton pattern**: `_client` and `_db` are module-level variables.
- `connect_to_mongo()` is idempotent (checks `if _client is None`), called once at startup.
- `get_database()` is a lazy accessor — calls `connect_to_mongo()` if not yet connected.
- `_safe_create_index()` creates unique indexes safely by first deleting null-value documents.

### Repository Pattern

Each entity has a dedicated repository. All use `@property db` calling `get_database()` to avoid stale references.

**Example — InventoryRepository:**
```python
def decrement_stock(self, product_id: str, amount: int) -> bool:
    res = self.db.inventory.update_one(
        {"product_id": product_id, "quantity": {"$gte": amount}},
        {"$inc": {"quantity": -amount}},
    )
    return res.modified_count > 0  # atomic check-and-decrement
```

The `$gte` filter ensures stock only decrements when sufficient quantity exists — atomically, race-condition safe.

### Service Layer

**`OrderService.create_order()`** — orchestrates 4 operations:
1. Read cart items from `CartRepository`
2. Insert order via `OrderRepository`
3. Decrement inventory per line item via `InventoryRepository`
4. Clear cart via `CartRepository`

**`OrderService.cancel_order()`** — reverses: calls `increment_stock()` for each item, marks order `CANCELLED`.

### Pydantic Schemas

**`PyObjectId`** (`schemas/object_id.py`) — bridges BSON `ObjectId` and JSON strings.

**User schemas:**
- `UserCreate` — `name/username` (either required) + `email` + `password` (6–72 chars)
- `UserLogin` — `email` + `password`
- `UserResponse` — `id`, `name`, `username`, `email`, `created_at` (never includes `password_hash`)
- `TokenResponse` — `access_token` + `token_type` + nested `UserResponse`

---

## 5. Tier 3 — Data Layer (MongoDB)

### Why MongoDB?

- **Embedded documents**: Cart items, order line items, shipping addresses embed naturally instead of JOIN tables.
- **Schema flexibility**: Products across Electronics/Fashion/Books can have different attributes.
- **Atomic `$inc`**: Inventory decrement is one atomic operation that checks and updates in a single query.
- **Replica set transactions**: Order creation modifies 3 collections — replica set enables ACID guarantees.

### Why a Replica Set for Single Node?

MongoDB multi-document ACID transactions **require** a replica set even with one member. The order creation flow:

| Step | Collection | Operation |
|------|-----------|-----------|
| 1 | `orders` | INSERT new order document |
| 2 | `inventory` | DECREMENT quantity for each item |
| 3 | `carts` | CLEAR user's cart |

A standalone `mongod` explicitly rejects transaction commands. If Step 2 fails after Step 1 on a standalone node, the data is left inconsistent.

### Collections & Indexes

| Collection | Unique Index | Purpose |
|-----------|-------------|---------|
| `users` | `email` | User accounts |
| `categories` | `slug` | Product categories |
| `products` | `slug` | Product catalog |
| `inventory` | `product_id` | Stock quantities per product |
| `carts` | `user_id` | Shopping cart per user |
| `orders` | — | Customer orders |

### Port Configuration

| Context | Connection String |
|---------|------------------|
| Inside Docker network | `mongodb://mongodb:27017/?replicaSet=rs0` |
| Host machine (Compass) | `mongodb://localhost:27018/?directConnection=true` |

Port `27018` on the host maps to `27017` in the container to avoid conflict with Windows native `mongod` on `27017`.

---

## 6. Security — Authentication & Password Hashing

### Password Hashing (app/core/security.py)

Uses `bcrypt` library directly (not passlib, which has Python 3.14 compatibility issues):

```python
def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt."""
    pwd_bytes = password.encode("utf-8")[:72]   # bcrypt limit is 72 bytes
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify against bcrypt hash with legacy plain-text fallback."""
    if not hashed_password.startswith("$2b$") and not hashed_password.startswith("$2a$"):
        return plain_password == hashed_password   # legacy fallback
    pwd_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
```

**Why 72-byte truncation?** The bcrypt algorithm truncates at 72 bytes and raises `ValueError` for longer inputs. We truncate explicitly.

**Why plain-text fallback?** Users created before bcrypt was added had plain-text passwords. The fallback lets them log in without forced migration.

### JWT Authentication

- **Algorithm**: `HS256` (HMAC-SHA256 symmetric signing)
- **Token payload**: `{ "sub": user_id, "email": email, "exp": expiry, "iat": issued_at }`
- **Token lifetime**: 60 minutes (configurable)

### Login Flow

```
POST /api/users/login  { email, password }
        |
        v
UserService.authenticate_user(email, password)
        |
        v
UserRepository.get_by_email(email)   -- returns user WITH password_hash
        |
        v
verify_password(plain_password, stored_hash)   -- True / False
        |
        v  (if True)
create_access_token({ sub: user_id, email })
        |
        v
Return: { access_token, token_type: "bearer", user: UserResponse }
```

### Registration Flow

```
POST /api/users  { name, email, password }
        |
        v
UserService.create_user() --> check email uniqueness
        |
        v
UserRepository.create() --> hash_password(raw) --> store password_hash in MongoDB
        |
        v
Return: UserResponse  (NO password or password_hash field ever exposed)
```

---

## 7. Docker & Infrastructure

### Container Map

```
Host Machine
|
|-- Port 80   --> [frontend: nginx:alpine]
|                   Serves React SPA static files
|                   /api/*  --> proxy to backend:8000
|                   /health --> proxy to backend:8000
|
|-- Port 8000 --> [backend: python:3.12-slim]
|                   uvicorn app.main:app --host 0.0.0.0 --port 8000
|
|-- Port 27018 --> [mongodb: mongo:7]  (host:27018 -> container:27017)
|                   mongod --replSet rs0 --bind_ip_all
|
+-- (internal) [mongo-init: mongo:7]  -- runs once, then exits
                   rs.initiate({_id:'rs0', members:[...]})
```

### Service Startup Order

```
mongodb (healthcheck: rs.status().ok every 10s)
    |
    |-> mongo-init  (waits for mongodb healthy, runs rs.initiate(), exits)
    |
    +-> backend     (waits for mongodb healthy)
             |
             +-> frontend  (waits for backend healthy via GET /health)
```

### Multi-Stage Frontend Dockerfile

```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                     # Reproducible install from package-lock.json
COPY . .
RUN npm run build              # tsc -b && vite build --> dist/

# Stage 2: Production Nginx image (~25MB, no node_modules)
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Volume & Network

```yaml
volumes:
  mongodb_data: { driver: local }   # Persists data across restarts

networks:
  ecommerce-network: { driver: bridge }  # Internal DNS: mongodb, backend, frontend
```

- `docker compose down` — stops containers, **preserves** data volume.
- `docker compose down -v` — stops containers **AND deletes** data volume (clean reset).

---

## 8. CI/CD Pipeline

Triggers: every push to `main`/`master`/`develop`, and on pull requests.

### 4 Jobs Overview

| Job | Runs | Steps |
|-----|------|-------|
| `backend-ci` | ubuntu-latest | MongoDB RS + Black + Flake8 + Pylint + Mypy + Bandit + pip-audit + Pytest |
| `frontend-ci` | ubuntu-latest | npm ci + ESLint + tsc --noEmit + npm run build + npm audit |
| `security-and-docker` | ubuntu-latest | Gitleaks + Hadolint (backend/frontend Dockerfiles) + Trivy FS scan |
| `docker-build` | ubuntu-latest | Build backend image + Build frontend image (no push, verification only) |

> `docker-build` only runs after both `backend-ci` AND `frontend-ci` pass (uses `needs:`).

### Code Quality Standards

| Tool | Threshold | Current |
|------|-----------|---------|
| Pylint | >= 9.0/10 | **10.00/10** |
| Black | must pass | ✅ |
| Flake8 | must pass | ✅ |
| Mypy | must pass | ✅ |
| Bandit | must pass | ✅ |

---

## 9. API Reference

Base URL: `http://localhost/api` (via Nginx proxy)
Interactive docs: `http://localhost/docs` (Swagger UI)

### Users

| Method | Endpoint | Body | Response | Notes |
|--------|----------|------|----------|-------|
| POST | `/api/users` | `{name, email, password}` | `201 UserResponse` | Register |
| POST | `/api/users/login` | `{email, password}` | `200 TokenResponse` | Get JWT |
| GET | `/api/users` | — | `200 UserResponse[]` | List all |
| GET | `/api/users/{id}` | — | `200 UserResponse` | Get by ID |
| GET | `/api/users/{id}/orders` | — | `200 OrderResponse[]` | User's orders |

### Products

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/products` | Optional `?category_id=` filter |
| GET | `/api/products/{id}` | — |
| POST | `/api/products` | Create |
| PUT | `/api/products/{id}` | Partial update |
| DELETE | `/api/products/{id}` | 204 No Content |

### Categories

| Method | Endpoint |
|--------|----------|
| GET | `/api/categories` |
| POST | `/api/categories` |
| PUT | `/api/categories/{id}` |
| DELETE | `/api/categories/{id}` |

### Cart

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/api/cart/{user_id}` | — | Get user's cart |
| POST | `/api/cart/{user_id}/items` | `{product_id, quantity}` | Add/update item |
| DELETE | `/api/cart/{user_id}` | — | Clear cart |

### Orders

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| POST | `/api/orders` | `{user_id, shipping_address}` | Create from cart |
| GET | `/api/orders` | — | Optional `?user_id=` filter |
| GET | `/api/orders/{id}` | — | Get by ID |
| POST | `/api/orders/{id}/cancel` | — | Cancel + restock |

### Inventory

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/inventory/{product_id}` | — |
| PUT | `/api/inventory/{product_id}` | `{quantity}` |

### Health

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/health` | `{status: "ok", service: "..."}` |

### Error Codes

| Code | Scenario |
|------|----------|
| 400 | Email already registered, validation failure |
| 401 | Incorrect email or password |
| 404 | Entity not found |
| 422 | Pydantic schema validation error |

---

## 10. Database Schema

### users collection

```json
{
  "_id": "ObjectId",
  "username": "Venu",
  "name": "Venu",
  "email": "venu@gmail.com",
  "password_hash": "$2b$12$...",
  "created_at": "2026-08-12T01:18:00+00:00"
}
```

> `password_hash` is **NEVER** returned in API responses.

### categories collection

```json
{
  "_id": "ObjectId",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Gadgets and devices"
}
```

### products collection

```json
{
  "_id": "ObjectId",
  "name": "ProBook Ultra 15",
  "slug": "probook-ultra-15",
  "description": "...",
  "price": 1299.99,
  "category_id": "...",
  "image_url": "https://..."
}
```

### inventory collection

```json
{
  "_id": "ObjectId",
  "product_id": "...",
  "quantity": 25
}
```

> Unique index on `product_id`. Uses `$inc` for atomic decrement/increment.

### carts collection

```json
{
  "_id": "ObjectId",
  "user_id": "...",
  "items": [
    {
      "product_id": "...",
      "product_name": "ProBook Ultra 15",
      "quantity": 2,
      "unit_price": 1299.99,
      "subtotal": 2599.98
    }
  ]
}
```

> Unique index on `user_id`. One cart per user (upsert pattern).

### orders collection

```json
{
  "_id": "ObjectId",
  "user_id": "...",
  "items": [/* same as cart items */],
  "total_amount": 2599.98,
  "shipping_address": {
    "street": "123 Main St",
    "city": "Tech City",
    "state": "CA",
    "postal_code": "90001",
    "country": "USA"
  },
  "status": "pending",
  "created_at": "2026-08-12T01:18:00+00:00"
}
```

> Status values: `pending`, `CANCELLED`

---

## 11. Data Flow Diagrams

### Order Creation Flow

```
User clicks "Place Order"
    |
    v  POST /api/orders  { user_id, shipping_address }
    |
    v  CartRepository.get_by_user_id(user_id)
    |    returns { items: [{ product_id, quantity, unit_price, subtotal }] }
    |
    v  OrderRepository.create_order(user_id, address, cart_items)
    |    INSERT into orders collection
    |    total_amount = sum(item.subtotal)
    |
    v  For each cart_item:
    |    InventoryRepository.decrement_stock(product_id, quantity)
    |    UPDATE WHERE quantity >= requested  +  $inc by -N (atomic)
    |
    v  CartRepository.clear_cart(user_id)
    |    $set items: []
    |
    v  Return OrderResponse
```

### Order Cancellation Flow

```
User clicks "Cancel Order"
    |
    v  POST /api/orders/{order_id}/cancel
    |
    v  OrderRepository.get_by_id(order_id)
    |    verify order exists and not already CANCELLED
    |
    v  For each item in order:
    |    InventoryRepository.increment_stock(product_id, quantity)
    |    $inc by +N (restores inventory)
    |
    v  OrderRepository.cancel_order(order_id)
    |    $set status: "CANCELLED", updated_at: now
    |
    v  Return updated OrderResponse
```

---

## 12. Configuration & Environment Variables

### Backend .env

```ini
MONGO_URI=mongodb://mongodb:27017/?replicaSet=rs0
MONGO_DB_NAME=ecommerce
APP_NAME=E-Commerce Order System
DEBUG=false
SECRET_KEY=change-this-to-a-strong-random-secret-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

> [!CAUTION]
> Change `SECRET_KEY` before deploying to production. Use `openssl rand -hex 32` to generate a strong secret.

### MongoDB Compass Connection

```
mongodb://localhost:27018/?directConnection=true
```

Or with replica set:
```
mongodb://localhost:27018/?replicaSet=rs0
```

Port `27018` is used because Windows may have a native `mongod` running on `27017`.

---

## 13. Testing Strategy

### Test Database Isolation

Tests use the `ecommerce_test` database. The `clean_db` autouse fixture calls `delete_many({})` on all collections before each test.

### Why Real MongoDB (Not Mocked)?

MongoDB-specific behaviour (atomic `$inc`, ObjectId validation, index constraints, replica set transactions) cannot be reliably tested against a mock object. Integration tests against real MongoDB catch real bugs.

### Running Tests

```bash
# 1. Start MongoDB replica set
docker compose up -d mongodb mongo-init

# 2. Run all tests
cd backend
pytest tests/ -v

# 3. Run with coverage report
pytest tests/ --cov=app --cov-report=term-missing
```

### Test Coverage Areas

| File | Coverage |
|------|----------|
| `test_categories.py` | CRUD operations, slug uniqueness constraint |
| `test_products.py` | CRUD, category filtering |
| `test_inventory.py` | Stock retrieval and update |
| `test_cart.py` | Add to cart, quantity accumulation |
| `test_orders.py` | Order creation from cart, status flow |

---

## 14. Common Interview Questions & Answers

### Q: What is 3-tier architecture?

**A:** 3-tier architecture separates an application into three logical layers:
1. **Presentation Tier** — the user interface (React SPA served by Nginx)
2. **Application/Logic Tier** — business logic and API (FastAPI backend)
3. **Data Tier** — persistent storage (MongoDB)

Each tier communicates only with the adjacent tier. The frontend never directly queries the database — it must go through the API. This separation provides security, scalability, and maintainability.

---

### Q: Why use MongoDB over PostgreSQL for this project?

**A:** MongoDB was chosen because:
- **Embedded documents**: Cart items and order line items embed naturally inside parent documents, avoiding JOIN tables.
- **Flexible schema**: Products across categories (Electronics, Fashion, Books) can have different attributes without ALTER TABLE migrations.
- **Atomic `$inc`**: Inventory decrement is one atomic MongoDB operation checking and decrementing in a single query, preventing race conditions.
- **Replica set transactions**: Order creation updates 3 collections atomically — MongoDB transactions provide ACID guarantees.

---

### Q: Why does MongoDB need a Replica Set even for a single node?

**A:** MongoDB multi-document ACID transactions **require** a replica set, even with just one member. A standalone `mongod` explicitly rejects transaction commands. In the order flow, we modify `orders`, `inventory`, and `carts` collections in sequence — the replica set ensures transactional safety and prevents inconsistent state if any step fails.

---

### Q: How does Nginx know to forward /api requests to FastAPI?

**A:** The `nginx.conf` has a `location /api/` block with `proxy_pass http://backend:8000`. Docker Compose creates a shared bridge network where each service is reachable by its service name. Nginx resolves `backend` through Docker's internal DNS to the FastAPI container's IP. The browser never needs to know the backend's internal address.

---

### Q: How are passwords stored securely?

**A:** Passwords are hashed using **bcrypt** before storage:
1. Raw password is extracted from the request before reaching MongoDB.
2. `hash_password()` truncates to 72 bytes (bcrypt limit), generates a random salt, returns `$2b$12$...` hash string.
3. Only `password_hash` is stored in MongoDB — plain text is immediately discarded.
4. During login, `verify_password()` calls `bcrypt.checkpw()` to compare submitted password against stored hash.
5. `password_hash` is **never** included in any API response — it is popped from the dict before returning.

---

### Q: What is the Repository Pattern and why use it?

**A:** The Repository Pattern creates an abstraction layer between business logic and the database. Each entity has a dedicated repository class encapsulating all its database operations.

**Benefits:**
- **Testability**: Repositories can be mocked in unit tests.
- **Single responsibility**: Services have no MongoDB queries; repositories have no business rules.
- **Maintainability**: Switching from PyMongo to Motor (async) only requires changes in the repository layer.

---

### Q: What is the difference between Service and Repository layers?

**A:**
- **Repository** (`repositories/`): Only speaks to MongoDB. Methods like `order_repo.create_order()`, `cart_repo.clear_cart()`. Zero business rules.
- **Service** (`services/`): Orchestrates business logic. `OrderService.create_order()` fetches cart, creates order, decrements inventory, clears cart — all via repositories. Zero direct MongoDB calls.

---

### Q: How does the Docker container startup order work?

**A:** `depends_on` with `condition: service_healthy` enforces the order:
1. `mongodb` starts. Its healthcheck runs `rs.status().ok` every 10 seconds.
2. `mongo-init` starts after `mongodb` is healthy, runs `rs.initiate()` once, then exits.
3. `backend` starts after `mongodb` is healthy. Its healthcheck hits `GET /health` every 10 seconds.
4. `frontend` (Nginx) starts after `backend` is healthy.

---

### Q: What is the purpose of seed_data.py?

**A:** `seed_data.py` populates MongoDB with realistic demo data:
- 5 product categories (Electronics, Fashion & Apparel, Home & Kitchen, Books & Media, Sports & Gaming)
- 50 products with names, prices, slugs, and image URLs distributed across categories
- 50 inventory records (one per product with initial stock quantities)

Run it once after `docker compose up` to make the application immediately usable for demos. The script calls the REST API (not MongoDB directly) using Python's `requests` library.

---

### Q: How is the JWT token used after login?

**A:** After `POST /api/users/login`:
1. Frontend stores `access_token` in `localStorage('access_token')`.
2. User's MongoDB ID is stored in `localStorage('demo_user_id')`.
3. These are used by Cart/Orders pages to identify the current user.
4. In production, the token would be sent as `Authorization: Bearer <token>` header for protected endpoints, and the backend would decode it via `decode_access_token()` to identify the user.

---

### Q: What happens if inventory runs out during order placement?

**A:** `decrement_stock()` uses a MongoDB filter `{"quantity": {"$gte": amount}}` combined with `{"$inc": {"quantity": -amount}}` in a **single atomic update**. If stock is insufficient, `modified_count` is 0 and the method returns `False`. This prevents overselling without a separate read operation and is completely race-condition safe — two simultaneous orders cannot both succeed if only one unit remains.

---

### Q: How does the CI pipeline ensure code quality?

**A:** The GitHub Actions pipeline enforces 4 quality gates:
1. **Formatting** (Black): Code must conform to 88-character line width format.
2. **Linting** (Flake8 + Pylint): No style violations; Pylint must score >= 9.0/10 (currently 10.00/10).
3. **Type checking** (Mypy for Python + `tsc --noEmit` for TypeScript): Both must pass without errors.
4. **Security** (Bandit, pip-audit, Trivy, Gitleaks): No known CVEs, no secrets committed to git.
5. **Tests** (Pytest): All integration tests must pass against a real MongoDB replica set.
6. **Docker build**: Both images must build successfully (verification only, no push).

---

### Q: What ports does this application use and why?

| Port | Service | Reason |
|------|---------|--------|
| `80` | Frontend (Nginx) | Standard HTTP — entry point for all users |
| `8000` | Backend (FastAPI) | Internal only — only accessible via Nginx proxy |
| `27017` | MongoDB (internal Docker) | Container-to-container communication |
| `27018` | MongoDB (host-mapped) | Mapped from 27017 to avoid conflict with Windows native mongod |

---

*Document generated: August 2026 | Project: ShopFlow E-Commerce Order System*
