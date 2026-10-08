# IgniteStock

**IgniteStock is an evidence-based market investigation platform for the Indonesian stock market.** It helps users investigate *what moved*, understand the *potential factors* behind the movement, identify *who drove it*, and examine the *evidence* behind those findings.

Rather than handing out black-box predictions, IgniteStock keeps a strict separation between **facts** (source-attributed market data, news, and filings) and **interpretation** (AI-generated summaries, drivers, and verdicts) — and it never fabricates data to fill a gap. If the evidence is thin, it says so.

---

## Table of contents

- [What it does](#what-it-does)
- [Core capabilities](#core-capabilities)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API surface](#api-surface)
- [Investigation agent](#investigation-agent)
- [Design principles](#design-principles)
- [Tests and verification](#tests-and-verification)
- [Migrations](#migrations)

---

## What it does

The platform answers a recurring question for the Indonesian market (IDX): *"Why did this stock move?"* — and shows its work.

An investigation answers four questions in sequence:

1. **What moved?** — the price/index movement, its magnitude, and the period over which it happened.
2. **What factors may explain it?** — market context, sector context, peer movements, news, filings, corporate actions, and financial fundamentals.
3. **Who drove it?** — estimated market-cap-weighted contributors and relative performance against the market and sector.
4. **What is the evidence?** — each claim is traceable to an evidence item, classified as **supporting**, **contradictory**, or **neutral**, with a confidence level and impact rating.

A legitimate outcome is **"No Clear Catalyst Detected."** That is a valid finding — surfaced as a warning notice, not an error.

---

## Core capabilities

- **Market intelligence dashboard** — Indonesian market summary, sector and index performance, top gainers/losers with period switching, and estimated market contributors.
- **Deterministic investigation pipeline** — orchestrates stock movement, market/sector context, peers, news, filings, corporate actions, and financials into an evidence-aggregated report with ranked drivers.
- **AI investigation agent & chat** — a LangGraph workflow that plans and executes market tools, then reasons over the evidence. Supports multi-turn conversation and SSE streaming of real execution status.
- **Evidence transparency** — every report distinguishes factual evidence from AI interpretation, attributes sources, and aggregates evidence by alignment.
- **Investigation workspace** — a per-investigation AI chat bound to that investigation, so context resumes deterministically across reloads.
- **Authentication & profiles** — bearer-token auth with per-user, scoped investigations and conversations.

---

## Architecture

IgniteStock is a two-part application:

- **`backend/`** — a FastAPI + async SQLAlchemy service backed by MySQL.
- **`frontend/`** — a React 19 + TypeScript single-page app built with Vite and Tailwind CSS 4.

```
┌──────────────────────────┐        HTTPS / JSON + SSE        ┌───────────────────────────┐
│        Frontend          │  ───────────────────────────────▶ │          Backend          │
│  React 19 · Redux · Vite │                                   │  FastAPI · SQLAlchemy     │
│  Tailwind CSS 4          │ ◀───────────────────────────────  │  LangGraph agent          │
└──────────────────────────┘                                   └─────────────┬─────────────┘
                                                                             │
                                                    ┌────────────────────────┼────────────────────────┐
                                                    ▼                        ▼                        ▼
                                             ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
                                             │   MySQL     │          │  Sectors    │          │  OpenAI /   │
                                             │ (users,     │          │  API (IDX   │          │  OpenRouter │
                                             │investigations)          │  market data)          │  (LLM)      │
                                             └─────────────┘          └─────────────┘          └─────────────┘
```

**Backend request flow:** `routes → handlers → services → models/database`. Routes declare paths and dependencies, handlers orchestrate services and shape responses, and services own queries, transactions, validation, and domain errors.

**Market data** flows through a dedicated integration layer: an external HTTP client for the Sectors API, a normalization/caching service, and a market intelligence service that computes performance metrics deterministically. Routes never call Sectors directly. All quantitative metrics (returns, relative performance, estimated weights, contributions) are calculated in the backend with `Decimal` — **never by an LLM** — and are labelled `weight_source: "estimated_market_cap_share"` because official index constituent weights are not available from Sectors.

**Frontend** is organized by domain under `src/` (`components/`, `hooks/`, `lib/`, `models/`, `pages/`, `redux/`, `schema/`) with a binding design system defined as Tailwind CSS 4 `@theme` tokens.

---

## Tech stack

**Backend**

| Area | Technology |
| --- | --- |
| Framework | FastAPI (`fastapi[standard]`), Uvicorn |
| Data / ORM | SQLAlchemy 2 (async) with `asyncmy` (runtime) and `pymysql` (migrations) |
| Database | MySQL |
| Migrations | Alembic |
| Validation / config | Pydantic v2, `pydantic-settings` |
| Auth | JWT (`PyJWT`), Argon2 password hashing (`pwdlib[argon2]`) |
| AI agent | LangGraph, LangChain Core, `langchain-openai` (OpenAI / OpenRouter) |
| HTTP client | HTTPX |

**Frontend**

| Area | Technology |
| --- | --- |
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| State | Redux Toolkit + React Redux |
| Routing | react-router-dom 7 |
| Forms / validation | react-hook-form + Zod |
| HTTP | Axios |
| Charts | Recharts |
| Dates | Day.js |
| Markdown | react-markdown + remark-gfm |
| Icons / primitives | lucide-react, Radix UI primitives, `class-variance-authority` |

---

## Project layout

```
ignite-stock/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entrypoint: settings, CORS, middleware, /api router
│   │   ├── agent/                  # LangGraph investigation agent
│   │   │   ├── graph.py            # 5-node StateGraph + sync/stream runners
│   │   │   ├── tools.py            # 7 Sectors-backed tools
│   │   │   ├── nodes.py            # intent, planning, evidence, response nodes
│   │   │   ├── prompts.py          # IDX domain prompts
│   │   │   └── state.py            # InvestigationState
│   │   ├── routes/                 # HTTP routes
│   │   ├── handlers/               # Request orchestration
│   │   ├── services/               # Domain logic, CRUD, Sectors integration, agent chat
│   │   ├── models/                 # SQLAlchemy models + enums
│   │   ├── helpers/                # Schemas, responses, dependencies
│   │   └── middlewares/            # Centralized error handling
│   ├── alembic/                    # Migrations
│   ├── tests/                      # unittest suite
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/             # ui/, feedback/, auth/, layout/
    │   ├── hooks/                  # useMarketData, useInvestigationChat, ...
    │   ├── lib/                    # api-client, formatters, agentStream, ...
    │   ├── models/                 # TypeScript domain types
    │   ├── pages/                  # Route pages (market, investigations, profile, ...)
    │   ├── redux/                  # Store, slices, thunks
    │   └── schema/                 # Zod schemas
    ├── package.json
    └── vite.config.ts
```

Frontend routes: public landing (`/`), guest auth (`/login`, `/register`), protected routes under the app shell (`/market`, `/investigations`, `/investigations/:id`, `/investigations/:id/ai`, `/profile`), and a catch-all 404.

---

## Getting started

### Prerequisites

- Python 3.11+
- Node.js + pnpm
- MySQL
- A Sectors API key (IDX market data)
- An OpenAI-compatible API key (direct OpenAI or OpenRouter)

### Backend

Run from `backend/`:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# configure environment (see Configuration below)
Copy-Item .env.example .env

# apply database migrations
alembic upgrade head

# start the API (either command works)
uv run fastapi dev
# or: uvicorn app.main:app --reload
```

The API serves from `http://localhost:8000`, with `/health` for health checks.

### Frontend

Run from `frontend/`:

```powershell
cd frontend
pnpm install
pnpm dev      # dev server with HMR
pnpm build    # type-check + production build
pnpm preview  # preview the production build
pnpm lint     # ESLint
```

---

## Configuration

### Backend — `backend/.env`

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Async MySQL URL (`mysql+asyncmy`) |
| `DATABASE_SYNC_URL` | Sync MySQL URL (`mysql+pymysql`), used by Alembic |
| `JWT_SECRET_KEY` / `JWT_ALGORITHM` / `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | JWT authentication |
| `SECTORS_API_BASE_URL` / `SECTORS_API_KEY` | Sectors market-data API (raw API key in the `Authorization` header) |
| `SECTORS_API_TIMEOUT_SECONDS` / `SECTORS_API_CACHE_TTL_SECONDS` | Sectors HTTP timeout and process-local TTL cache |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | LLM provider (OpenRouter supported via `https://openrouter.ai/api/v1`) |
| `AGENT_LLM_MODEL` / `AGENT_LLM_TEMPERATURE` | Agent model and temperature |

### Frontend — `frontend/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL (default `http://localhost:8000/api`) |

See `backend/.env.example` and `frontend/.env.example` for documented templates.

---

## API surface

All endpoints below are under `/api`. Except for auth and health routes, they require a bearer token.

**Authentication & users**

- `POST /auth/...` — register / login / current user
- `PATCH /users/{user_id}` — update profile (`name`, `email`, `password`, all optional)

**Market intelligence**

- `GET /market/overview`
- `GET /market/movers`
- `GET /market/impact`
- `GET /market/sectors/{sector_code}`
- `GET /companies/{ticker}/market-context`
- `GET /companies/{ticker}/impact`

**Investigations**

- `GET /investigations` — paginated, user-scoped list (search + `investigation_type` filter)
- `POST /investigations/analyze` — run the deterministic investigation pipeline and persist the report
- `GET /investigations/{id}` — enriched investigation with nested drivers and evidence
- `GET /investigations/{id}/drivers` — paginated drivers
- `GET /investigations/{id}/evidence` — paginated evidence items

**AI agent & chat**

- `POST /agent/chat` — conversational interface (supports SSE streaming via `stream: true`)
- `POST /agent/investigate` — direct investigation trigger
- `GET /agent/conversations` (alias `GET /conversations`) — user's conversations, optional `investigation_id` filter
- `GET /agent/conversations/{id}` (alias `GET /conversations/{id}`) — single conversation (ownership-verified)
- `GET /agent/conversations/{id}/messages` (alias `GET /conversations/{id}/messages`) — paginated messages

---

## Investigation agent

The AI layer is a compiled **LangGraph** state machine:

```
detect_intent → plan_investigation → execute_tools → process_evidence → generate_response
```

- **Tools** wrap the Sectors API: `get_stock_movement`, `get_market_context`, `get_sector_context`, `get_peer_movements`, `get_company_news`, `get_company_filings`, `get_company_financials`.
- **Real errors are captured, never hidden.** Tool failures are recorded on the call result — the agent never returns mock or fabricated fallback data.
- **Streaming** (`run_agent_stream`) emits real SSE events (`intent_detected`, `plan_created`, `tool_started`/`tool_completed`, `evidence_processed`, `response_generated`) which the frontend maps to human-readable status steps. No synthetic progress is ever produced.
- **Conversations** are per-user and can be bound to an investigation (`investigation_id`) so a workspace resumes deterministically.

---

## Design principles

These are binding constraints, not preferences:

1. **Evidence over assertion.** Distinguish facts (source-attributed, labelled *Fact*) from interpretation (AI summary/drivers/verdicts, labelled *Interpretation*).
2. **No fabricated data — ever.** No mock, placeholder, or fallback business data at runtime. If a source fails, surface the real error.
3. **Deterministic math.** All market metrics are computed in the backend with `Decimal`, never by an LLM.
4. **Honest failure modes.** "No Clear Catalyst Detected" is a legitimate result; system errors are shown as errors with retry — never masked by fallback data.
5. **Strict design system.** A 60/30/10 color split (base / secondary surfaces / single accent `#ea6947`), a single `0.25rem` border radius, `Raleway` headings + `Open Sans` body at weights 400/700, a 48px minimum target size, and no gradients, glassmorphism, glow, or decorative effects. Accessibility minimums: 4.5:1 small-text contrast and never signalling state by color alone.

---

## Tests and verification

Backend tests live in `backend/tests/` and cover schemas, mathematical precision, service calculations, route registration, and API integration. Mock transport data is **test-only** and must never become runtime fallback data.

Run from the repository root:

```powershell
python -m compileall -q backend/app backend/tests
$env:PYTHONPATH="backend"; python -m unittest discover backend/tests
```

Run from `backend/`:

```powershell
$env:PYTHONPATH="."; python -m unittest discover tests
```

There is no separate backend formatter/linter configured — use `python -m compileall` plus the test runner. For a single file: `python -m unittest backend/tests/test_impact.py`.

Frontend checks run from `frontend/`: `pnpm build` (type-check + build) and `pnpm lint`.

---

## Migrations

Alembic lives under `backend/alembic/`. Run from `backend/`:

```powershell
alembic current
alembic heads
alembic history
alembic revision --autogenerate -m "describe schema change"
alembic upgrade head
```

Always review autogenerated `upgrade()`/`downgrade()` before applying. If Alembic reports *"Target database is not up to date"*, inspect `alembic current` and apply pending revisions before creating a new one. Use `alembic stamp head` only when the database schema exactly matches migration metadata.

---

*IgniteStock — investigate what moved, why it moved, who drove it, and the evidence behind it.*