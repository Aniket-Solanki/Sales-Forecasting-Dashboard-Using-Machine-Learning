# Contributing to Sales Forecasting Dashboard

Thank you for your interest in contributing! This project is primarily developed
as a Minor Project (DI05000351) by **Aniket Solanki**, but feedback, bug reports,
and suggestions are always welcome.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Suggest a Feature](#how-to-suggest-a-feature)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

This project follows a standard [Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you agree to uphold a respectful and inclusive environment.

---

## How to Report a Bug

1. Search [existing issues](https://github.com/Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning/issues) first.
2. Open a new issue using the **Bug Report** template.
3. Include: steps to reproduce, expected vs. actual behaviour, OS & Python version.

---

## How to Suggest a Feature

Open an issue using the **Feature Request** template and describe:
- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered

---

## Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning.git
cd Sales-Forecasting-Dashboard-Using-Machine-Learning

# 2. Start infrastructure
docker compose up -d

# 3. Backend setup
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt

# 4. Apply migrations
alembic upgrade head

# 5. Run the API
uvicorn app.main:app --reload
```

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Stable, production-ready code |
| `feature/<name>` | New features (`feature/jwt-auth`) |
| `fix/<name>` | Bug fixes (`fix/sales-index`) |
| `chore/<name>` | Maintenance (`chore/update-deps`) |

---

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(scope): <short description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Examples:**
```
feat(auth): implement JWT login endpoint
fix(models): correct nullable constraint on forecast bounds
docs(readme): update quick-start guide
```

---

## Pull Request Process

1. Fork the repository and create a feature branch.
2. Ensure all tests pass: `pytest backend/`
3. Update `CHANGELOG.md` under `[Unreleased]`.
4. Open a PR against `master` with a clear description.
5. PRs require review by [@Aniket-Solanki](https://github.com/Aniket-Solanki).
