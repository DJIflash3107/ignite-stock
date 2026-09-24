# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Repository layout

IgniteStock is a two-part app:

- `backend/`: FastAPI + async SQLAlchemy service using MySQL.
- `frontend/`: React 19 + TypeScript + Vite + Tailwind CSS 4 app with Redux Toolkit, Axios, react-router-dom, react-hook-form, Zod, Day.js, and markdown rendering via `react-markdown` + `remark-gfm`.

Backend runtime starts at `backend/app/main.py`. It loads settings, logging, CORS, request middleware, centralized exception handlers, and the `/api` router. Root and `/health` return the standard success response.

Frontend root starts at `frontend/src/main.tsx`, wrapping the app with Redux `<Provider store={store}>` and loading `frontend/src/index.css`. Routes are defined in `frontend/src/App.tsx`: public landing (`/`), guest auth routes (`/login`, `/register`), protected routes inside `AppShell` (`/market`, `/investigations`, `/investigations/:id`, `/investigations/:id/ai`, `/profile`), and catch-all 404 (`*`). Ignore dependency-generated files under `frontend/node_modules/` when exploring or editing source.

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
- `services/agent_chat_service.py`: Conversation thread lifecycle, user ownership verification, context grounding, and chat orchestration. `get_or_create_conversation` reuses the most recent `(user, investigation)` conversation when an `investigation_id` is supplied so a workspace resumes deterministically; `list_user_conversations` supports an optional `investigation_id` filter. `run_chat`/`run_chat_stream` only overwrite the conversation's investigation link when the caller did not already bind one.

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

- `POST /api/agent/chat` — Conversational interface wrapping the LangGraph investigation workflow. Accepts user messages (`AgentChatRequest`), resolves or auto-creates conversations, carries over multi-turn context (e.g., *"Was this sector-wide?"*, *"Compare it with BMRI"*, *"Did the fundamentals change?"*, *"Show me the evidence"*), executes dynamic Sectors tools, persists user and assistant messages, links the investigation, and returns structured responses (`AgentChatResponse`). Supports SSE streaming (`text/event-stream`) when `stream: true`. When `investigation_id` is supplied, the conversation is bound to (and resumed for) that investigation instead of spawning a new one.
- `POST /api/agent/investigate` — Direct investigation trigger running the LangGraph state machine (`AgentInvestigateRequest` -> `AgentInvestigateResponse`).
- `GET /api/agent/conversations` (and `GET /api/conversations`) — Lists paginated conversations owned by the authenticated user, ordered by `updated_at DESC`. Accepts an optional `investigation_id` filter to resolve the conversation bound to a specific investigation.
- `GET /api/agent/conversations/{id}` (and `GET /api/conversations/{id}`) — Gets a single conversation with user ownership verification (returns 404 if unowned/absent).
- `GET /api/agent/conversations/{id}/messages` (and `GET /api/conversations/{id}/messages`) — Lists paginated messages for a conversation with user ownership verification, ordered by `created_at ASC`.

## Frontend architecture

The frontend is structured under `frontend/src/` with clear domain separation:

- `components/`:
  - `ui/`: shadcn/ui primitives (`Button`, `Card`, `Badge`, `Input`, `Label`, `Avatar`, `DropdownMenu`, `Tabs`, `Table`, `Dialog`) using `class-variance-authority` and `cn()`. `Tabs`, `Table`, and `Dialog` are lightweight, dependency-free primitives built on React context (matching the `DropdownMenu` pattern) with ARIA semantics; `Dialog` supports `asChild` on its trigger.
  - `feedback/`: Reusable feedback components (`LoadingSpinner`, `ErrorDisplay`, `EmptyState`, `FormError`, `Skeleton`, `SkeletonCard`, `SkeletonTableRow`, `SkeletonEvidenceRow`).
  - `auth/`: Route protection guards (`ProtectedRoute` gating authenticated routes with loading state and redirect to `/login`, `GuestRoute` redirecting authenticated users to `/market`).
  - `layout/`: Reusable application shell (`AppShell` with collapsible responsive sidebar, topbar with live IDX status badge, user dropdown menu, page container) and `GlobalSearch` (direct IDX ticker search routing to investigations without fake suggestions or mock data).
- `hooks/`: Reusable hooks including:
  - `useFormWithSchema`: React Hook Form + Zod resolver integration.
  - `useAuthInit`: Boot-time session recovery via `/auth/me` and window listener for `auth:unauthorized` 401 events.
  - `useMarketData`: Parallel fetching for market intelligence endpoints (`/market/overview`, `/market/movers`, `/market/impact`) using `Promise.allSettled`, independent loading/error states, period switching, and retry triggers.
  - `useInvestigationDetail`: Loads a single investigation (`GET /investigations/{id}`) first, then the ticker-scoped company endpoints (`market-context`, `impact`) once the real ticker is known. Every section keeps an independent loading/error/refetch state; a failed request never populates another section and never falls back to fabricated data. Uses `AbortController` on ticker/id change.
  - `useInvestigationChat`: Drives the AI workspace conversation — resolves the conversation bound to an `investigation_id` (`GET /agent/conversations?investigation_id=`), loads history, streams turns via `lib/agentStream`, tracks real agent status steps from SSE events, and exposes `send`/`retry`/`cancel`/`clearError`. Retries replay the last failed message; cancellation uses `AbortController`. Falls back to the non-streamed `POST /agent/chat` only when the stream cannot start at all (never to mask an agent error).
- `lib/`:
  - `utils.ts`: `cn()` utility combining `clsx` and `tailwind-merge`.
  - `api-client.ts`: Axios instance with request/response interceptors (token injection, automatic 401 handling) and typed helpers (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`).
  - `api-error.ts`: `ApiError` class and `extractErrorMessage()` adhering to backend error envelope (`code`, `message`, `details`).
  - `dayjs.ts`: Pre-configured Day.js with `relativeTime` and `localizedFormat` plugins, plus formatting helpers.
  - `formatters.ts`: Deterministic formatting utilities for IDR currency (`formatCurrency`), abbreviated market cap (`formatMarketCap`), percentages (`formatPercent`), weight (`formatWeight`), and contribution (`formatContribution`) preserving backend-provided metrics without recalculation.
  - `investigationEvidence.ts`: Maps backend evidence types to the seven report tabs (Market, Sector, Peers, News, Filings, Financials). Because the backend only emits `price | financial | news | filing | market | other`, Sector is derived from `other` items carrying `data.sub_sector` and Peers from `price` items carrying `data.peers`; the standalone price item appears only under All. Provides filter/count helpers.
  - `investigationLabels.ts`: Display mappings (labels + semantic badge variants) for alignment, confidence, impact, driver type, evidence type, and status, plus no-clear-catalyst detection and evidence aggregation helpers. No business logic — purely presentation.
  - `agentStream.ts`: Fetch + `ReadableStream` SSE client for `POST /agent/chat` with `stream: true` (Axios cannot consume a browser streaming body). Parses `event:`/`data:` frames, surfaces real backend errors as `ApiError`/`AgentStreamError`, and honours `AbortSignal`. Never fabricates events.
  - `agentEvents.ts`: Maps real SSE events (`intent_detected`, `plan_created`, `tool_started`/`tool_completed`, `evidence_processed`, `response_generated`) to human-readable status steps with tool labels, merging tool start/complete in place. No synthetic progress is ever produced.
- `models/`: TypeScript interfaces and domain types:
  - `api.ts`: Standard response envelopes (`ApiResponse`, `ApiErrorResponse`, `PaginatedResponse`).
  - `auth.ts`: User, token, request schemas, and `AuthState` (`user`, `token`, `isAuthenticated`, `isLoading`, `isInitialized`, `error`).
  - `market.ts`: Market movers (`MarketMover`, `MoverPeriod`), index points (`IndexClose`), market cap points (`MarketCapPoint`), market overview (`MarketOverview`), contributors (`StockContributor`), market/company impact data (`MarketImpact`, `CompanyImpact`), and API response envelopes.
  - `investigation.ts`: Investigations, ranked drivers, and tri-state evidence items (`supporting`, `contradictory`, `neutral`). Enums mirror `backend/app/models/enums.py` exactly (investigation type/status, confidence, impact level, driver type, evidence type, alignment) — do not add values the backend cannot emit. Also holds the typed response envelopes and the `CompanyMarketContext` model; `CompanyImpact`/`CompanyImpactResponse` live in `market.ts`.
  - `conversation.ts`: Agent chat requests, tool calls, conversation threads, response envelopes, and the typed SSE event union (`AgentStreamEvent`/`AgentStatusStep`) emitted by the backend stream.
- `pages/`: Route page components:
  - `index.tsx`: Public landing page with dynamic auth navigation buttons.
  - `login.tsx`: User sign-in page with Zod schema validation and Redux thunk dispatch.
  - `register.tsx`: User registration page with password confirmation and auto-redirect.
  - `market.tsx`: Market intelligence dashboard with Indonesian market summary, sector & index performance, top gainers, top losers with period switcher, estimated market contributors, quick stock investigation, real-time ticker filter, neutral-pulse loading skeletons, error states with retry, and direct "Investigate" navigation (`/investigations?ticker=XXXX`).
  - `investigations/index.tsx`: Investigations list workspace supporting `?ticker=` query param. Hosts the `NewInvestigationDialog` (validated with `analyzeRequestSchema`) that runs `POST /investigations/analyze` and navigates to the created report; a failed analyze shows the real backend error inline and never creates placeholder results.
  - `investigations/detail.tsx`: Investigation report detail view composing `StockHeaderSection`, `ComparisonSection` (market vs sector), `PeersSection`, `DriversSection`, `ConfidenceImpactSection`, `EvidenceSection` (tabbed), `SummarySection`, and `AskAboutSection`. Section components live in `investigations/components/`. Must clearly distinguish factual evidence (source-attributed, labelled "Fact") from AI interpretation (summary/drivers/verdicts, labelled "Interpretation"), a legitimate "No Clear Catalyst Detected" outcome (warning notice, not an error), and actual system errors (`ErrorDisplay` + retry, never fallback data).
  - `investigations/ai.tsx`: AI investigation workspace (`/investigations/:id/ai`) — a two-pane layout with the conversation on the left and investigation context on the right (stacked below `lg`). The conversation is bound to the investigation via `investigation_id` so it resumes across reloads. Assistant responses render as markdown; agent execution status is shown only from real backend SSE events (no faked tool progress), and failures surface the real error with retry. Assistant sub-components live in `investigations/components/ai/` (`ConversationPanel`, `MessageList`, `MessageBubble`, `AgentStatusTrail`, `SuggestedQuestions`, `Composer`, `InvestigationContextPanel`, `ContextMetricRow`, `MarkdownMessage`).
  - `profile.tsx`: Authenticated user profile and session settings.
  - `not-found.tsx`: 404 fallback page.
- `redux/`:
  - `store.ts`: Redux Toolkit store configured with `auth` and `investigation` slices.
  - `hooks.ts`: Typed `useAppDispatch` and `useAppSelector`.
  - `slices/`: State slices (`authSlice.ts` with `isInitialized` boot flag and extraReducers, `investigationSlice.ts`).
  - `thunks/`: Async thunks (`authThunks.ts`: `loginUser`, `registerUser`, `fetchCurrentUser`, `logoutUser`).
- `schema/`: Zod validation schemas for forms (`auth.ts` for login/registration, `investigation.ts` for queries).

## Frontend design system

The UI follows a strict design system defined as Tailwind CSS 4 `@theme` tokens in `src/index.css`. Treat these rules as binding when adding or editing UI.

Color — strict 60/30/10 distribution:
- 60% base surfaces: `--color-primary` `#282a36` (page content, cards, panels).
- 30% navigation / secondary surfaces: `--color-secondary` `#1f202a` (sidebar, topbar, auth pages, alternating marketing sections).
- 10% accent: `--color-accent` `#ea6947` — reserved for the single primary CTA per screen and brand marks only.
- Black, white, and grayscale are allowed for text, icons, and muted elements (`--color-foreground`, `--color-muted-foreground`, `--color-border`, `--color-surface-hover`).
- Additional hues are allowed only for semantic states: `--color-success`, `--color-warning`, `--color-danger` (error / success / warning / pending / destructive).

Border radius — one value everywhere: `0.25rem`. All `--radius-*` tokens are pinned to `0.25rem`, and components use `rounded-[0.25rem]` explicitly. No large or pill radii; the only exception is intentional 2px status dots (`rounded-full` on `h-2 w-2` markers).

Typography:
- Headings: `Raleway` (`--font-heading`, loaded via Google Fonts in `index.html`).
- Body: `Open Sans` (`--font-body`).
- Weights: only `400` and `700` (use `font-bold`, never `font-semibold`/`font-medium`/`font-extrabold`).
- Sizes: body `16px`; H1 `32–36px`; H2 `24–30px`; H3 `20–24px`; captions `12–14px`. Even font sizes only; reduced letter spacing on large text.

Layout:
- Prefer left alignment over centered content (centered text is reserved for empty states and short callouts).
- Minimize nested containers, borders, and shadows; express hierarchy with spacing, alignment, and typography.
- Keep to an 8px spacing rhythm.

Buttons and interaction:
- One `#ea6947` primary CTA per screen; all other actions use the neutral `secondary`/`outline`/`ghost` variants or the semantic `destructive` variant.
- Minimum 48px target size (default button and input height is `h-12`).

Accessibility:
- Minimum contrast `4.5:1` for small text and `3:1` for large text.
- Never signal state by color alone — pair semantic colors with an icon or text label.

Forbidden effects: no gradients, glassmorphism, glow, neon, backdrop blur, or decorative visual effects. Skeletons use a neutral pulse (no shimmer gradient).

Markdown rendering: backend agent output (chat assistant messages and investigation `summary`) is GitHub-flavoured markdown. Render it with the shared `investigations/components/ai/MarkdownMessage.tsx` component (`react-markdown` + `remark-gfm`) — never dump raw markdown text into a `<p>`. Styling maps onto the tokens above (headings use `font-heading`, tables/code scroll horizontally inside the bubble, links use accent). Raw HTML is intentionally not rendered.

Path alias: `@/*` resolves to `frontend/src/*` via Vite and tsconfig.

## Configuration and migrations

Backend environment loading uses `backend/.env`; `backend/.env.example` documents:
- MySQL & async database URLs (`DATABASE_URL` with `mysql+asyncmy`, `DATABASE_SYNC_URL` with `mysql+pymysql`).
- JWT authentication (`JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`).
- Sectors settings (`SECTORS_API_BASE_URL`, `SECTORS_API_KEY`, `SECTORS_API_TIMEOUT_SECONDS`, `SECTORS_API_CACHE_TTL_SECONDS`).
- AI Agent settings (`OPENAI_API_KEY`, `OPENAI_BASE_URL` supporting OpenRouter via `https://openrouter.ai/api/v1`, `AGENT_LLM_MODEL`, `AGENT_LLM_TEMPERATURE`).

Frontend environment loading uses `frontend/.env`; `frontend/.env.example` documents:
- `VITE_API_BASE_URL`: Base URL for the backend API (defaults to `http://localhost:8000/api`).

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
