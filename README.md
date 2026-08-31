<div align="center">

# 📊 Sales Forecasting Dashboard
### Using Machine Learning

[![CI](https://github.com/Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning/actions/workflows/ci.yml/badge.svg)](https://github.com/Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?logo=postgresql)](https://www.postgresql.org/)
[![version](https://img.shields.io/badge/version-0.2.0-brightgreen)](CHANGELOG.md)

A full-stack, production-grade sales forecasting application that ingests historical
sales data, trains an XGBoost model via a Celery background worker, and renders
interactive forecast charts on a Next.js dashboard with confidence intervals.

**Minor Project · Semester 5 · DI05000351**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [Schema](#-database-schema) · [API](#-api-contract) · [Roadmap](#-build-roadmap) · [Contributing](#-contributing) · [License](#-license)

</div>

---

## ✨ Features

- 📈 **Interactive forecasting charts** — historical actuals + 30-day predictions with 95% confidence bands
- 🤖 **XGBoost ML pipeline** — automated feature engineering (lags, rolling stats, temporal features)
- ⚡ **Async FastAPI backend** — fully async SQLAlchemy 2.0, Pydantic v2 validation, auto Swagger docs
- 🔐 **JWT authentication** — role-based access (`admin` / `viewer`)
- 🐳 **Fully containerised** — Docker Compose for one-command local setup
- 📊 **MLflow experiment tracking** — every model run logged with hyperparameters and MAPE metric
- 🔄 **Celery background workers** — retrain & inference jobs run without blocking the API

---

## 🏗️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | Next.js (App Router) + TypeScript | 14 |
| **Styling** | Tailwind CSS + Shadcn/UI | — |
| **State** | Zustand + TanStack Query | — |
| **Visualisation** | Apache ECharts (`echarts-for-react`) | — |
| **Backend** | FastAPI + Uvicorn | 0.111 |
| **ORM** | SQLAlchemy 2.0 | 2.0.30 |
| **Migrations** | Alembic | 1.13 |
| **ML** | XGBoost + Scikit-Learn + Pandas + Polars | — |
| **Experiment Tracking** | MLflow | 2.13 |
| **Task Queue** | Celery + Redis | 5.4 |
| **Database** | PostgreSQL | 16 |
| **Auth** | python-jose + passlib (JWT + bcrypt) | — |
| **Containerisation** | Docker + Docker Compose | — |
| **CI/CD** | GitHub Actions | — |

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Docker Desktop | Latest |
| Python | 3.11+ |
| Node.js | 20+ |

### 1 — Clone & Start Infrastructure

```bash
git clone https://github.com/Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning.git
cd Sales-Forecasting-Dashboard-Using-Machine-Learning

docker compose up -d        # PostgreSQL 16 on :5432, Redis 7 on :6379
```

### 2 — Backend

```bash
cd backend

python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

# Apply database migrations
alembic upgrade head

# Start the API
uvicorn app.main:app --reload
```

> API docs: **http://localhost:8000/docs**

### 3 — Frontend *(Step 6 — coming soon)*

```bash
cd frontend
npm install
npm run dev                     # http://localhost:3000
```

---

## 🗄️ Database Schema

```
┌─────────────────┐        ┌──────────────────────┐        ┌──────────────────────────┐
│     users       │        │      products         │        │      sales_history        │
├─────────────────┤        ├──────────────────────┤        ├──────────────────────────┤
│ id          UUID│        │ id          UUID PK   │◄───┐   │ id          BIGSERIAL PK │
│ email  VARCHAR  │        │ sku         VARCHAR   │    │   │ product_id  UUID FK      │──→ products.id
│ password_hash   │        │ name        VARCHAR   │    └───│ date        DATE         │
│ role   VARCHAR  │        │ category    VARCHAR   │        │ units_sold  INT          │
│ created_at      │        │ created_at  TIMESTAMP │        │ revenue     DECIMAL(10,2)│
└─────────────────┘        └──────────────────────┘        │ INDEX (product_id, date) │ ← critical
                                        │                   └──────────────────────────┘
                                        │
                                        ▼
                           ┌──────────────────────────┐
                           │        forecasts          │
                           ├──────────────────────────┤
                           │ id             BIGSERIAL  │
                           │ product_id     UUID FK    │
                           │ forecast_date  DATE       │
                           │ predicted_units FLOAT     │
                           │ lower_bound    FLOAT NULL │ ← 95% CI
                           │ upper_bound    FLOAT NULL │ ← 95% CI
                           │ model_version  VARCHAR    │
                           └──────────────────────────┘
```

---

## 📡 API Contract

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/login` | ❌ | Returns JWT token |
| `GET`  | `/api/v1/dashboard/summary` | ✅ | Revenue KPIs & MoM growth |
| `GET`  | `/api/v1/dashboard/timeseries` | ✅ | Actuals + forecast for chart |
| `POST` | `/api/v1/ml/train` | 🔑 Admin | Trigger Celery retrain job |
| `POST` | `/api/v1/ml/predict` | 🔑 Admin | Trigger 30-day batch inference |

Interactive docs at `/docs` (Swagger UI) and `/redoc` (ReDoc).

---

## 🗺️ Build Roadmap

| Step | Status | Description |
|------|--------|-------------|
| 1 | ✅ **Done** | DevOps — Docker Compose (PG 16 + Redis), `.gitignore`, `README` |
| 2 | ✅ **Done** | Database models (SQLAlchemy 2.0), Alembic initial migration |
| 3 | 🔜 Next | JWT auth + CRUD APIs for sales data upload & retrieval |
| 4 | ⏳ | Jupyter notebook — feature engineering + XGBoost prototype |
| 5 | ⏳ | Celery ML pipeline — automated train & inference tasks |
| 6 | ⏳ | Next.js frontend — login, route guards, JWT cookie |
| 7 | ⏳ | Dashboard — ECharts time-series with actuals + forecast bands |
| 8 | ⏳ | Dockerfiles + AWS RDS/ECS or Google Cloud Run deployment |

---

## 👤 Author & Contributor

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Aniket-Solanki">
        <img src="https://github.com/Aniket-Solanki.png" width="100px;" alt="Aniket Solanki"/><br />
        <sub><b>Aniket Solanki</b></sub>
      </a><br />
      <sub>💻 Author · 🎨 Design · 🧠 ML</sub>
    </td>
  </tr>
</table>

- 📧 ssaniket.2004@email.com
- 🐙 [@Aniket-Solanki](https://github.com/Aniket-Solanki)

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!
Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before opening any issue or pull request.

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

Copyright © 2024 **Aniket Solanki**

---

<div align="center">
<sub>Built with ❤️ as Minor Project DI05000351 · Semester 5</sub>
</div>
