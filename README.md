# ShopFlow — E-Commerce Order System (3-Tier MongoDB Stack)

[![CI/CD Pipeline](https://github.com/VenuKXN-95/3-Tier-Architecture-/actions/workflows/ci.yml/badge.svg)](https://github.com/VenuKXN-95/3-Tier-Architecture-/actions/workflows/ci.yml)

A modern, production-grade 3-Tier E-Commerce Order System built with **React (TypeScript + Tailwind CSS + Framer Motion)**, **FastAPI (PyMongo + Pydantic v2)**, **MongoDB (Replica Set `rs0`)**, and **Docker Compose**.

---

## Table of Contents

1. [Task Requirements &amp; Architectural Scope](#-task-requirements--architectural-scope)
2. [Technology Stack &amp; System Architecture](#-technology-stack--system-architecture)
3. [Running with Docker Compose (Recommended)](#-running-with-docker-compose-recommended)
4. [Running Manually (Local Development)](#-running-manually-local-development)
5. [Database Seeding](#-database-seeding)
6. [API Testing Guide (cURL &amp; Postman)](#-api-testing-guide-curl--postman)
7. [Running Automated Tests](#-running-automated-tests)
8. [Database Design &amp; Transaction Strategy](#-database-design--transaction-strategy)

---

## Task Requirements & Architectural Scope

### Current Scope

Implement a complete 3-Tier web application:

1. **Frontend**: Modern SaaS UI built with React, TypeScript, Tailwind CSS, and Framer Motion.
2. **Backend**: High-performance REST API built with FastAPI, PyMongo, and Pydantic v2.
3. **Database**: MongoDB single-node replica set (`rs0`) for multi-document ACID transaction support.
4. **Containerization**: Full multi-container orchestration via Docker Compose.

### Core Business Features

- **Product Catalogue**: Browse products, search, view detail pages, and filter by categories.
- **Image Support**: High-resolution product images with hover zoom transitions and lazy loading.
- **Cart Management**: Add items, update quantities, remove items, calculate subtotals.
- **Atomic Inventory**: Race-condition-free stock checks using MongoDB `$inc` with `$gte` floor conditions.
- **ACID Order Checkout**: Multi-document transactions across `orders`, `inventory`, and `carts` collections.
- **Historical Price Snapshotting**: Orders lock unit prices at purchase time so future product price updates do not retroactively alter order history.
- **User Profile Management**: Demo user session tracking and order history with cancellation support.

---

## Technology Stack & System Architecture

```
                                Browser (Port 80)
                                       │
                                  HTTP / REST
                                       │
                                       ▼
                  +-----------------------------------------+
                  |               Frontend                  |
                  |     React + Vite + TypeScript + Nginx   |
                  |    Tailwind CSS + shadcn/ui + Motion    |
                  +--------------------+--------------------+
                                       │
                                REST API (Port 8000)
                                       │
                                       ▼
                  +-----------------------------------------+
                  |                Backend                  |
                  |                FastAPI                  |
                  |  Routes ──► Schemas ──► Services        |
                  |                  │                      |
                  |                  ▼                      |
                  |             Repositories                |
                  +--------------------+--------------------+
                                       │
                                 PyMongo (Port 27017)
                                       │
                                       ▼
                  +-----------------------------------------+
                  |                MongoDB                  |
                  |        Single-Node Replica Set (rs0)    |
                  |   ACID Transactions Enabled for Orders  |
                  +-----------------------------------------+
```

| Layer                     | Technology                        | Key Details                                                                          |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| **Frontend**        | React 18, Vite, TypeScript        | Lucide Icons, Framer Motion animations, custom design token system                   |
| **Styling**         | Tailwind CSS, PostCSS             | Glassmorphic cards, slate dark palette, cyan & violet primary accents                |
| **Backend**         | Python 3.12, FastAPI, Pydantic v2 | Layered architecture: Routes → Schemas → Services → Repositories                  |
| **Database Access** | PyMongo 4.x                       | Direct PyMongo without ORM overhead; custom`serialize_doc()` for ObjectId boundary |
| **Database**        | MongoDB 7.0 (Replica Set`rs0`)  | Multi-document transactions enabled for order placement                              |
| **Web Server**      | Nginx Alpine                      | Serves static Vite build and proxies`/api/*` requests to backend container         |

---

## Running with Docker Compose (Recommended)

Running with Docker Compose spins up the full 3-tier stack with all dependencies wired automatically.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Build and Start All Containers

From the project root directory (`3-Tier Architecture with Mongo DB`):

```bash
docker compose up -d --build
```

This launches 4 containers:

1. `ecommerce-mongodb`: MongoDB 7 database running as replica set `rs0` on port `27017`.
2. `ecommerce-mongo-init`: One-shot initializer that executes `rs.initiate()` on MongoDB.
3. `ecommerce-backend`: FastAPI REST API on port `8000`.
4. `ecommerce-frontend`: Nginx web server serving the React app on port `80`.

### 2. Access the Application

- **Frontend SaaS Dashboard**: [http://localhost](http://localhost)
- **Backend API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive OpenAPI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Monitoring & Management Commands

```bash
# View live logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb

# Check status of containers
docker compose ps

# Stop containers (preserves database data volume)
docker compose down

# Stop containers and DELETE database data volume (clean reset)
docker compose down -v
```

---

## Running Manually (Local Development)

If you wish to run the backend and frontend separately outside Docker during local development, follow these steps.

### Prerequisites

- Python 3.10+
- Node.js 18+ and `npm`
- Running MongoDB instance with replica set `rs0` enabled on `localhost:27017`.

---

### Step 1: Start MongoDB with Replica Set

MongoDB **must** be started as a replica set for transactions to function:

```bash
mongod --replSet rs0 --dbpath ./data/db
```

In a separate terminal, initiate the replica set once:

```bash
mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
```

---

### Step 2: Set Up and Run Backend

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI development server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will now be listening at `http://localhost:8000`.

---

### Step 3: Set Up and Run Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

The React frontend will start at `http://localhost:5173`. Vite will automatically proxy `/api/*` requests to `http://localhost:8000`.

---

## Database Seeding

To populate the database with **5 Categories**, **50 Realistic Products with Unsplash Images**, **50 Inventory Stock Records**, and a **Demo User**, run the seed script:

### Method A: Local execution

```bash
python seed_data.py
```

### Method B: Docker execution

```bash
docker compose exec backend python seed_data.py
```

---

## API Testing Guide (cURL & Postman)

### API Endpoints Summary Table

| Category             | Method     | Endpoint                                   | Description                               |
| -------------------- | ---------- | ------------------------------------------ | ----------------------------------------- |
| **Health**     | `GET`    | `/health`                                | Application status                        |
| **Categories** | `POST`   | `/api/categories`                        | Create a category                         |
|                      | `GET`    | `/api/categories`                        | List all categories                       |
|                      | `GET`    | `/api/categories/{id}`                   | Get category by ID                        |
|                      | `PUT`    | `/api/categories/{id}`                   | Update category                           |
|                      | `DELETE` | `/api/categories/{id}`                   | Delete category                           |
| **Products**   | `POST`   | `/api/products`                          | Create a product                          |
|                      | `GET`    | `/api/products`                          | List products (optional`?category_id=`) |
|                      | `GET`    | `/api/products/{id}`                     | Get product details                       |
|                      | `PUT`    | `/api/products/{id}`                     | Update product                            |
|                      | `DELETE` | `/api/products/{id}`                     | Delete product                            |
| **Inventory**  | `POST`   | `/api/inventory`                         | Create inventory record                   |
|                      | `GET`    | `/api/inventory/{product_id}`            | Get inventory stock                       |
|                      | `PUT`    | `/api/inventory/{product_id}`            | Update inventory stock                    |
| **Users**      | `POST`   | `/api/users`                             | Register a new user                       |
|                      | `GET`    | `/api/users/{id}`                        | Get user profile                          |
| **Cart**       | `GET`    | `/api/cart/{user_id}`                    | Get user cart                             |
|                      | `POST`   | `/api/cart/{user_id}/items`              | Add item to cart                          |
|                      | `PUT`    | `/api/cart/{user_id}/items/{product_id}` | Update item quantity                      |
|                      | `DELETE` | `/api/cart/{user_id}/items/{product_id}` | Remove item from cart                     |
| **Orders**     | `POST`   | `/api/orders/{user_id}`                  | Place order (ACID Transaction)            |
|                      | `GET`    | `/api/orders/{order_id}`                 | Get order details                         |
|                      | `GET`    | `/api/users/{user_id}/orders`            | List user order history                   |
|                      | `POST`   | `/api/orders/{order_id}/cancel`          | Cancel an order                           |

---

### Ready-to-Run cURL Commands

#### 1. Health Check

```bash
curl -X GET http://localhost:8000/health
```

**Expected Response (200 OK)**:

```json
{
  "status": "ok",
  "service": "E-Commerce Order System"
}
```

---

#### 2. Categories

##### Create Category

```bash
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smart Home",
    "description": "Smart bulbs, plugs, and hubs"
  }'
```

##### List All Categories

```bash
curl -X GET http://localhost:8000/api/categories
```

---

#### 3. Products

##### Create Product

```bash
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smart LED Bulb E27",
    "description": "RGB ambient lighting bulb",
    "price": 1299.00,
    "image_url": "https://images.unsplash.com/photo-1550985616-10810253b84d?w=500",
    "category_id": "<INSERT_CATEGORY_ID_HERE>"
  }'
```

##### List All Products (or filter by Category)

```bash
# All products
curl -X GET http://localhost:8000/api/products

# Filter by Category ID
curl -X GET "http://localhost:8000/api/products?category_id=<INSERT_CATEGORY_ID_HERE>"
```

---

#### 4. Inventory

##### Set Initial Inventory

```bash
curl -X POST http://localhost:8000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "<INSERT_PRODUCT_ID_HERE>",
    "quantity": 50
  }'
```

##### Get Product Stock

```bash
curl -X GET http://localhost:8000/api/inventory/<INSERT_PRODUCT_ID_HERE>
```

---

#### 5. Users

##### Register User

```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Venu",
    "email": "venu@example.com",
    "password": "SecurePassword123"
  }'
```

---

#### 6. Cart

##### Add Product to Cart

```bash
curl -X POST http://localhost:8000/api/cart/<INSERT_USER_ID_HERE>/items \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "<INSERT_PRODUCT_ID_HERE>",
    "quantity": 2
  }'
```

##### View User Cart

```bash
curl -X GET http://localhost:8000/api/cart/<INSERT_USER_ID_HERE>
```

---

#### 7. Orders (ACID Transaction)

##### Place Order

```bash
curl -X POST http://localhost:8000/api/orders/<INSERT_USER_ID_HERE>
```

*Note: This automatically verifies inventory, creates the order document, decrements inventory stock, and clears the cart inside a single MongoDB transaction.*

##### Get User Order History

```bash
curl -X GET http://localhost:8000/api/users/<INSERT_USER_ID_HERE>/orders
```

##### Cancel Order

```bash
curl -X POST http://localhost:8000/api/orders/<INSERT_ORDER_ID_HERE>/cancel
```

---

### Testing via Postman

1. Open Postman and create a **New Collection** named `ShopFlow API`.
2. Set variable `baseUrl` = `http://localhost:8000`.
3. Add requests using the endpoints and payloads listed above.
4. Alternatively, open **[http://localhost:8000/docs](http://localhost:8000/docs)** directly in your browser to use FastAPI's built-in interactive OpenAPI UI.

---

## Running Automated Tests

The repository contains a full pytest test suite covering all CRUD operations, inventory race conditions, and transaction rollbacks.

### Running Tests inside Docker (Recommended)

```bash
docker compose exec backend python -m pytest tests/ -v
```

### Running Tests Locally

```bash
cd backend
python -m pytest tests/ -v
```

---

## CI/CD & Code Quality Automation

This repository includes an enterprise-grade **GitHub Actions CI/CD Pipeline** ([.github/workflows/ci.yml](file:///.github/workflows/ci.yml)) enforcing continuous testing, linting, type checking, security auditing, and container scanning.

### Pipeline Stages & Tools

| Stage                       | Tool          | Description                                                           |
| :-------------------------- | :------------ | :-------------------------------------------------------------------- |
| **Code Formatting**   | `black`     | Enforces PEP 8 compliance and consistent code style.                  |
| **Fast Linting**      | `flake8`    | Catches syntax issues, unused imports, and style violations.          |
| **Deep Analysis**     | `pylint`    | Comprehensive code quality checks configured in`pyproject.toml`.    |
| **Static Type Check** | `mypy`      | Verifies type hints across FastAPI routes, models, and services.      |
| **Code Security**     | `bandit`    | Scans Python code for security vulnerabilities and injection risks.   |
| **Backend Audit**     | `pip-audit` | Audits Python dependencies for known CVE vulnerabilities.             |
| **Frontend Linting**  | `eslint`    | Enforces TypeScript and React component coding standards.             |
| **Frontend Typing**   | `tsc`       | Strictly verifies React TypeScript type definitions.                  |
| **Secret Scanning**   | `gitleaks`  | Detects committed credentials, API tokens, and secrets.               |
| **Dockerfile Lint**   | `hadolint`  | Ensures Dockerfiles adhere to best practices and security guidelines. |
| **Repo Scan**         | `trivy`     | Scans filesystem and dependencies for security flaws.                 |

### Running Checks Locally

Developers can run all CI checks locally prior to opening a pull request:

#### Backend Quality Checks

```bash
cd backend
pip install -r requirements-dev.txt

# 1. Formatting
black --check app tests

# 2. Linting
flake8 app tests --max-line-length=88 --extend-ignore=E203,W503,E402
pylint --rcfile=pyproject.toml app

# 3. Type Checking
PYTHONPATH=. mypy --config-file pyproject.toml app

# 4. Security Scan
bandit -r app -c pyproject.toml
pip-audit -r requirements.txt

# 5. Unit & Integration Tests
pytest tests/ --cov=app --cov-report=term-missing
```

#### Frontend Quality Checks

```bash
cd frontend
npm install

# 1. ESLint & TypeScript Type Checks
npm run lint
npx tsc --noEmit

# 2. Production Build Check
npm run build
```

---

## Database Design & Transaction Strategy

### 1. Embedded Array for Cart

The `carts` collection uses embedded documents (`items: [{product_id, quantity, unit_price}]`). Because a cart and its items are read/written together, embedding avoids join queries and matches MongoDB document patterns.

### 2. Multi-Document ACID Transactions

Order placement modifies three collections inside a single session transaction:

```python
with self._client.start_session() as session:
    with session.start_transaction():
        # 1. Insert order into 'orders'
        # 2. Decrement quantity in 'inventory' (atomic $inc with $gte check)
        # 3. Clear items array in 'carts'
```

If any step fails (e.g. out of stock), the transaction automatically aborts and rolls back all modifications.
