# 📊 Sales Forecasting Dashboard Using Machine Learning

A full-stack sales forecasting application that ingests historical sales data, trains an XGBoost model via a background Celery worker, and renders interactive forecast charts on a Next.js dashboard.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/UI, ECharts |
| **State / Data Fetching** | Zustand, TanStack Query |
| **Backend** | FastAPI, Uvicorn, Pydantic v2 |
| **ORM / Migrations** | SQLAlchemy 2.0, Alembic |
| **ML / Data** | XGBoost, Scikit-Learn, Pandas, Polars, MLflow |
| **Background Tasks** | Celery + Redis |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (python-jose + passlib) |
| **Containerisation** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions (Pytest + ESLint) |

---

## 🗂️ Project Structure

```
.
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # Route handlers (auth, dashboard, ml)
│   │   ├── core/             # Settings, security helpers
│   │   ├── db/               # SQLAlchemy Base, session factory
│   │   ├── models/           # ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic
│   │   ├── worker/           # Celery tasks
│   │   └── main.py           # FastAPI app entry point
│   ├── alembic/              # Database migrations
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env                  # Local environment (not committed)
├── frontend/                 # Next.js application
├── worker/                   # Standalone Celery worker (future)
├── docker-compose.yml        # PostgreSQL 16 + Redis
└── PROJECT_SPEC.md           # Full project specification
```

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Python 3.11+
- Node.js 20+

### 1. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432`
- **Redis 7** on `localhost:6379`

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

### 3. Run Migrations

```bash
cd backend
alembic upgrade head
```

### 4. Start the API

```bash
uvicorn app.main:app --reload
```

API docs available at: **http://localhost:8000/docs**

---

## 🗄️ Database Schema

```
users           products        sales_history         forecasts
─────────────   ────────────    ─────────────────     ──────────────────
id (UUID PK)    id (UUID PK)    id (BIGSERIAL PK)     id (BIGSERIAL PK)
email           sku (unique)    product_id (FK)  ──→  product_id (FK)
password_hash   name            date                  forecast_date
role            category        units_sold            predicted_units
created_at      created_at      revenue               lower_bound (95% CI)
                                                      upper_bound (95% CI)
                                INDEX: (product_id, date)  model_version
```

---

## 📈 Build Progress

| Step | Status | Description |
|------|--------|-------------|
| 1 | ✅ Done | DevOps — Docker Compose (PG16 + Redis), .gitignore |
| 2 | ✅ Done | Database Models & Alembic migrations |
| 3 | 🔜 Next | JWT Auth & Core CRUD APIs |
| 4 | 🔜 | Jupyter ML Prototyping |
| 5 | 🔜 | Celery ML Pipeline Automation |
| 6 | 🔜 | Next.js Frontend Scaffolding & Auth |
| 7 | 🔜 | Dashboard UI with ECharts |
| 8 | 🔜 | Final Integration & Deployment |

---

## 🔑 Environment Variables

Copy `.env.example` → `.env` and update as needed:

```env
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=sales_user
POSTGRES_PASSWORD=sales_password
POSTGRES_DB=sales_forecasting

REDIS_HOST=localhost
REDIS_PORT=6379

SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

MLFLOW_TRACKING_URI=http://localhost:5000
```
