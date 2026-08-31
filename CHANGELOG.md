# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- JWT authentication & core CRUD APIs (Step 3)
- Jupyter ML prototyping notebook (Step 4)
- Celery ML pipeline automation (Step 5)
- Next.js frontend scaffolding & auth (Step 6)
- Dashboard UI with ECharts (Step 7)
- Dockerfiles & cloud deployment (Step 8)

---

## [0.2.0] — 2026-08-31

### Added
- SQLAlchemy 2.0 ORM models: `User`, `Product`, `SalesHistory`, `Forecast`
- Correct `Annotated` type-alias pattern for `uuid_pk` and `created_at_col`
- Initial Alembic migration (`0001`) with all tables, indexes, and constraints
- Critical composite index `(product_id, date)` on `sales_history` per spec
- `95%` confidence interval columns (`lower_bound`, `upper_bound`) as nullable
- Python virtual environment setup (`backend/.venv`)
- All ML, API, and infrastructure dependencies installed (`requirements.txt`)

### Fixed
- `UserRole` promoted from bare `str` class to proper `str, enum.Enum`
- Removed duplicate `ix_products_category` index definition
- Added required `sqlalchemy.url` placeholder to `alembic.ini`

---

## [0.1.0] — 2026-08-31

### Added
- Monorepo directory structure: `backend/`, `frontend/`, `worker/`
- `docker-compose.yml` — PostgreSQL 16 + Redis 7 with healthchecks
- FastAPI application skeleton (`app/main.py`, `app/core/config.py`)
- Async + sync SQLAlchemy session factory (`app/db/session.py`)
- Pydantic v2 `Settings` with environment variable loading
- `requirements.txt` with pinned versions for all dependencies
- `.env` template with all required environment variables
- `.gitignore` for Python, Node.js, Docker, IDE, and OS artefacts
- `README.md` with tech stack, schema diagram, and quick-start guide
- GitHub remote configured: `Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning`

---

[Unreleased]: https://github.com/Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning/releases/tag/v0.1.0
