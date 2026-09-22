# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Repository layout

IgniteStock is a two-part app:

- `backend/`: FastAPI + async SQLAlchemy service using MySQL.
- `frontend/`: React 19 + TypeScript + Vite + Tailwind CSS app.

Backend runtime starts at `backend/app/main.py`. It loads settings, logging, CORS, request middleware, centralized exception handlers, and the `/api` router. Root and `/health` return the standard success response.

Frontend currently has one route (`/`) rendered through `frontend/src/App.tsx` and `frontend/src/pages/index.tsx`; `frontend/src/main.tsx` mounts React and `frontend/src/index.css` loads Tailwind. Ignore dependency-generated files under `frontend/node_modules/` when exploring or editing source.

## Backend architecture

Request flow is `routes -> handlers -> services -> models/database`:

- Routes define paths, dependencies, and request schemas. Router-level `Depends(get_current_user)` protects most non-auth endpoints.
- Handlers coordinate service calls, convert ORM objects to Pydantic read schemas, and create standard responses. Keep HTTP/client orchestration out of handlers.
- Services own CRUD queries, transactions, authentication behavior, domain validation, and domain errors. Existing CRUD services are intentionally explicit; do not introduce a generic CRUD abstraction.
- `backend/app/helpers/schemas.py` contains Pydantic v2 request and response models. `helpers/responses.py` owns JSON envelopes; `middlewares/error_handlers.py` maps validation, `AppError`, SQLAlchemy, HTTP, and unexpected failures into the standard error shape.
- `backend/app/models/__init__.py` imports all models so SQLAlchemy metadata includes every table. Alembic uses that metadata for migrations.

Sectors integration lives in `services/sectors_api_client.py` (external HTTP), `services/sectors_service.py` (normalization and process-local TTL cache), and `services/market_intelligence_service.py` (market orchestration, deterministic performance calculations, and comparisons). Market routes must use those layers and must not call Sectors directly. Sectors failures propagate as `AppError` subclasses; never add mock, fabricated, or fallback business data.

The Sectors API uses raw API-key authentication in the `Authorization` header.
- `/v2/index-daily/` accepts only the optional `date` query parameter; it does not accept `start` or `end`.
- `/v2/index-daily/{index_code}/` accepts bounded `start`/`end` ranges for a specific index.
- `/v2/daily/{symbol}/` accepts bounded `start`/`end` ranges for stock daily series.
- `/v2/idx-total/` accepts bounded `start`/`end` ranges.
- Cache only successful responses and keep API-credit-expensive requests bounded.
- Market and company impact metrics (returns, relative performance, estimated weights, contributions) are calculated deterministically in the backend with `Decimal` (never by LLM), and use `"weight_source": "estimated_market_cap_share"` because official constituent index weights are not provided by Sectors.

Authentication uses bearer tokens. `get_current_user` in `backend/app/helpers/dependencies.py` decodes the token and loads the user through `user_service.current_user`.

LangGraph Investigation Agent architecture lives under `backend/app/agent/`:
- `graph.py`: Compiles a 5-node StateGraph (`detect_intent` -> `plan_investigation` -> `execute_tools` -> `process_evidence` -> `generate_response`). Provides `run_agent` (synchronous execution) and `run_agent_stream` (SSE event generator).
- `tools.py`: 7 tools wrapping the Sectors API (`get_stock_movement`, `get_market_context`, `get_sector_context`, `get_peer_movements`, `get_company_news`, `get_company_filings`, `get_company_financials`). Real errors are captured in `AgentToolCall.result`; never return mock or fabricated fallback data.
- `nodes.py`: Node logic for intent parsing, dynamic tool planning, evidence evaluation (alignment & drivers), and reasoning response generation. `_get_llm` uses LangChain ChatOpenAI configured with `OPENAI_API_KEY` and optional `OPENAI_BASE_URL` (e.g. OpenRouter).
- `prompts.py`: System prompts with domain guidance for the Indonesian stock exchange (IDX).
- `state.py`: `InvestigationState` TypedDict tracking question, history, intent, plan, tool outputs, drivers, and evidence.
- `services/agent_chat_service.py`: Conversation thread lifecycle, user ownership verification, context grounding, and chat orchestration.

## API surface added by market intelligence

Authenticated endpoints:

- `GET /api/market/overview`
- `GET /api/market/movers`
- `GET /api/market/impact`
- `GET /api/market/sectors/{sector_code}`
- `GET /api/companies/{ticker}/market-context`
- `GET /api/companies/{ticker}/impact`

## API surface added by investigation analysis workflow

Authenticated endpoints:

- `POST /api/investigations/analyze` — deterministic investigation pipeline orchestrating stock movement, market context, sector context, peer movement, news, filings, corporate actions, financial fundamentals, evidence aggregation with alignment classification (supporting, contradictory, neutral), potential drivers with impact and confidence levels, and database persistence.
- `GET /api/investigations/{id}` — returns enriched investigation with nested drivers and evidence items.
- `GET /api/investigations/{id}/drivers` — returns paginated list of drivers for an investigation.
- `GET /api/investigations/{id}/evidence` — returns paginated list of evidence items for an investigation.

Market-data routes use source identifiers and Sectors V2 on demand. No local market-data CRUD routes or synchronization endpoint exists.

The company routes (`market-context`, `impact`) remain ticker-based and authenticated. Preserve users and investigation/conversation CRUD paths and authentication.

## API surface added by AI Investigation Agent and Chat

Authenticated endpoints:

- `POST /api/agent/chat` — Conversational interface wrapping the LangGraph investigation workflow. Accepts user messages (`AgentChatRequest`), resolves or auto-creates conversations, carries over multi-turn context (e.g., *"Was this sector-wide?"*, *"Compare it with BMRI"*, *"Did the fundamentals change?"*, *"Show me the evidence"*), executes dynamic Sectors tools, persists user and assistant messages, links the investigation, and returns structured responses (`AgentChatResponse`). Supports SSE streaming (`text/event-stream`) when `stream: true`.
- `POST /api/agent/investigate` — Direct investigation trigger running the LangGraph state machine (`AgentInvestigateRequest` -> `AgentInvestigateResponse`).
- `GET /api/agent/conversations` (and `GET /api/conversations`) — Lists paginated conversations owned by the authenticated user, ordered by `updated_at DESC`.
- `GET /api/agent/conversations/{id}` (and `GET /api/conversations/{id}`) — Gets a single conversation with user ownership verification (returns 404 if unowned/absent).
- `GET /api/agent/conversations/{id}/messages` (and `GET /api/conversations/{id}/messages`) — Lists paginated messages for a conversation with user ownership verification, ordered by `created_at ASC`.

## Configuration and migrations

Backend environment loading uses `backend/.env`; `backend/.env.example` documents:
- MySQL & async database URLs (`DATABASE_URL` with `mysql+asyncmy`, `DATABASE_SYNC_URL` with `mysql+pymysql`).
- JWT authentication (`JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`).
- Sectors settings (`SECTORS_API_BASE_URL`, `SECTORS_API_KEY`, `SECTORS_API_TIMEOUT_SECONDS`, `SECTORS_API_CACHE_TTL_SECONDS`).
- AI Agent settings (`OPENAI_API_KEY`, `OPENAI_BASE_URL` supporting OpenRouter via `https://openrouter.ai/api/v1`, `AGENT_LLM_MODEL`, `AGENT_LLM_TEMPERATURE`).

Frontend `.env.example` is currently empty; do not assume a frontend API URL exists until one is added.

Alembic lives under `backend/alembic/`. `backend/alembic/env.py` loads `Settings.sync_database_url` and uses `Base.metadata` for autogenerate. Keep migration revisions in `backend/alembic/versions/`; inspect autogenerated files before applying them. Empty template revisions do not create tables.

## Tests and verification

Backend tests are under `backend/tests/` (including `test_agent_chat.py`) and test schemas, mathematical precision, service calculations, route registration, and API endpoint integration. Mock transport data is test-only and must never become runtime fallback data.

Run from repository root:

```powershell
python -m compileall -q backend/app backend/tests
$env:PYTHONPATH="backend"; python -m unittest discover backend/tests
```

Run from `backend/`:

```powershell
$env:PYTHONPATH="."; python -m unittest discover tests
```

Run backend API from `backend/`:

```powershell
cd C:\Important\ignite-stock\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uv run fastapi dev  # or: uvicorn app.main:app --reload
```

There is no separate backend formatter or linter configured. Use `python -m compileall` plus test runner for backend checks. For a single test file, use `python -m unittest backend/tests/test_impact.py`.

Run frontend commands from `frontend/`:

```powershell
cd C:\Important\ignite-stock\frontend
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

Alembic commands run from `backend/`:

```powershell
alembic current
alembic heads
alembic history
alembic revision --autogenerate -m "describe schema change"
alembic upgrade head
```

Review autogenerated `upgrade()` and `downgrade()` before applying. `alembic revision -m` without `--autogenerate` creates an empty template. If Alembic reports `Target database is not up to date`, inspect `alembic current` and apply pending revisions before creating another revision. Use `alembic stamp head` only when the database schema exactly matches migration metadata.
