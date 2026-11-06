# Sales Forecasting Dashboard — Frontend

Next.js 16 (App Router) + React 19 + TypeScript frontend for the Sales Forecasting Dashboard.

## Features

- **Authentication** — JWT-based login/register with role support (admin/viewer)
- **Dashboard** — Interactive forecasting charts with ECharts (recharts)
- **Real-time data** — TanStack Query for server state management
- **Theme support** — Dark/light mode via next-themes
- **Toast notifications** — Sonner for user feedback
- **UI components** — Shadcn/UI + Tailwind CSS v4

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| State | Zustand + TanStack Query |
| Auth | JWT (httpOnly cookies) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Animations | Framer Motion |

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── auth/           # Login & Register pages
│   │   ├── (dashboard)/    # Protected dashboard routes
│   │   ├── globals.css     # Global styles + Tailwind
│   │   └── layout.tsx      # Root layout with providers
│   ├── components/
│   │   ├── ui/             # Shadcn/UI components
│   │   └── charts/         # Chart components (ECharts)
│   ├── context/
│   │   └── AuthContext.tsx # JWT auth state management
│   └── lib/
│       ├── api.ts          # Axios instance with interceptors
│       └── utils.ts        # Helper functions
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Environment Variables

Create `.env.local` in `frontend/`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint check
```

## Authentication Flow

1. User submits credentials → `/auth/login`
2. Backend returns JWT access token
3. Frontend stores token in httpOnly cookie (via api interceptor)
4. `AuthContext` fetches `/auth/me` for user profile
5. Protected routes check auth state

## Dashboard Pages (Planned)

- `/` — Overview with KPIs & forecast chart
- `/forecasts` — Detailed forecast views
- `/products` — Product management
- `/settings` — User & admin settings

---

Part of [Sales Forecasting Dashboard](https://github.com/Aniket-Solanki/Sales-Forecasting-Dashboard-Using-Machine-Learning) — Minor Project DI05000351
