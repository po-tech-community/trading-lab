# TradingLab — DCA Backtesting Platform with AI Advisor

> A full-stack financial simulation platform where users test Dollar-Cost Averaging (DCA) investment strategies against real historical market data, with an AI advisor powered by OpenAI and Model Context Protocol (MCP).

---

## Table of Contents

- [What Is This Project?](#what-is-this-project)
- [Live Features](#live-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Overview](#api-overview)
- [Key Engineering Decisions](#key-engineering-decisions)
- [For Your CV & Interviews](#for-your-cv--interviews)
- [Documentation](#documentation)

---

## What Is This Project?

**TradingLab** is a web application that simulates investment strategies using historical price data — no real money involved.

### The Core Problem It Solves

Most retail investors invest blind. Before committing real money to a recurring investment strategy, they have no way to answer questions like:

- *"Would weekly buys have outperformed monthly buys over the last year?"*
- *"If I set a take-profit trigger at 20%, what would my realized profit look like?"*
- *"How did BTC perform compared to AAPL at the same weight in a mixed portfolio?"*
- *"What does an AI think about my strategy given the actual numbers?"*

TradingLab answers those questions risk-free, with real historical price data, before you commit a single dollar.

### What Is DCA?

**Dollar-Cost Averaging (DCA)** — invest a fixed amount on a regular schedule (e.g., $100 every week) regardless of price. When prices drop, you buy more. When prices rise, you buy less. Over time, this averages out your cost basis and removes emotional decision-making from investing.

### What Is Backtesting?

**Backtesting** — run a strategy on historical data to see how it would have performed. Like a flight simulator: you learn the outcome without risking the plane.

---

## Live Features

### Level 0 — Authentication & User Management
- Email/password registration and login
- **Dual-token JWT auth** — short-lived access token (15 min) + long-lived refresh token (7 days) in an HttpOnly cookie
- **Google OAuth 2.0** — manually implemented (redirect → code exchange → profile fetch → upsert user)
- Soft delete (users are never physically removed; `deletedAt` timestamp is set)
- Audit logging for all auth events (non-blocking)
- Protected routes with JWT guard and `@CurrentUser` decorator

### Level 1 — DCA Backtest (Single Asset)
- Supported assets: **BTC**, **ETH** (via CoinGecko), **AAPL**, **TSLA** (via AlphaVantage)
- Configure: investment amount, frequency (daily / weekly / monthly), date range
- Results: Total Invested, Current Value, ROI (%), Number of Purchases
- Interactive **portfolio trajectory chart** (Recharts line chart)
- **Take-Profit and Stop-Loss triggers** — configure thresholds and sell percentage
- Trade history table showing each triggered sell
- Save, list, and delete past backtest runs per user

### Level 2 — Portfolio DCA (Multi-Asset)
- Add multiple assets with percentage weight allocation (must sum to 100%)
- Per-period investment is split by weight across all assets, fetched in parallel
- Per-asset breakdown: which asset contributed most to profit/loss
- Allocation pie chart showing initial weight distribution

### Level 3 — Smart Triggers *(integrated into Level 1)*
- Take-Profit: sell when unrealized gain hits threshold
- Stop-Loss: sell when unrealized loss hits threshold
- Configurable sell percentage (e.g., sell 50% or 100% of holdings)
- Chart markers showing when sells occurred
- Comparison between "pure DCA" vs "DCA + Triggers"

### Level 4 — AI Advisor
- AI chat panel powered by **OpenAI**
- **SSE token streaming** — tokens render to the browser in real time (no waiting for full response)
- **MCP (Model Context Protocol)** — 3 tool servers run alongside the backend:
  - `market-snapshot` — fetches live price, 24h change, volatility
  - `portfolio-diagnostics` — evaluates risk, concentration, diversification
  - `backtest-context` — interprets historical backtest metrics
- **Inspect → Approve → Execute** — users see which tools the AI wants to call and approve/deny each one
- **Rate limiting** — Redis-backed per-user request counter; in-memory fallback when Redis is unavailable
- Markdown rendering for AI responses

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI framework |
| **TypeScript** | 5.9 (strict) | Type safety |
| **Vite** | 7 | Build tool & dev server |
| **TailwindCSS** | 4 | Utility-first styling |
| **shadcn/ui** | — | Component library (Radix UI primitives) |
| **TanStack Query** | v5 | Server state management & caching |
| **TanStack Table** | v8 | Trade history data table |
| **React Hook Form** | v7 | Form state management |
| **Zod** | v4 | Schema validation (shared with form types) |
| **Recharts** | v3 | Portfolio trajectory charts & pie charts |
| **React Router** | v7 | Client-side routing |
| **Lucide React** | — | Icon library |
| **Sonner** | — | Toast notifications |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **NestJS** | 11 | Backend framework (modular, DI-based) |
| **TypeScript** | 5.7 (strict) | Type safety |
| **MongoDB** | via Mongoose 8 | Persistent storage (users, backtest history, audit logs) |
| **Redis** | 7 | Caching API responses, AI rate limiting |
| **JWT** | via `@nestjs/jwt` | Stateless authentication |
| **Passport** | JWT strategy | Auth middleware |
| **OpenAI SDK** | v6 | LLM integration with streaming |
| **MCP SDK** | `@modelcontextprotocol/sdk` v1 | AI tool server protocol |
| **BigNumber.js** | v10 | Precision arithmetic for financial calculations |
| **bcrypt** | v6 | Password hashing |
| **Swagger/OpenAPI** | `@nestjs/swagger` v11 | Auto-generated API documentation |
| **class-validator** | v0.14 | DTO validation (pipes) |
| **class-transformer** | v0.5 | DTO transformation |
| **Docker Compose** | — | Local MongoDB + Redis infrastructure |

### External APIs

| API | Provider | Usage |
|---|---|---|
| CoinGecko | Free tier | BTC, ETH historical OHLC price data |
| AlphaVantage | Free tier (~25 req/day) | AAPL, TSLA historical daily price data |
| OpenAI | Paid | GPT-based AI advisor with streaming |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                   │
│                                                          │
│  Pages: Landing · Login · DCA Backtest · Portfolio       │
│         AI Advisor · Market Data · Settings              │
│                                                          │
│  State: TanStack Query (server) + Context (UI)          │
│  Forms: React Hook Form + Zod validation                │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP/REST + SSE (streaming)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  NestJS Backend (port 8000)              │
│                                                          │
│  Pipeline: Middleware → Guard → Interceptor → Pipe → Controller │
│                                                          │
│  Modules:                                                │
│  ┌─────────┐ ┌──────────┐ ┌───────┐ ┌──────────────┐  │
│  │  Auth   │ │ Backtest │ │ Users │ │  AI / MCP    │  │
│  │ JWT+OAuth│ │ Engine   │ │       │ │  Streaming   │  │
│  └─────────┘ └──────────┘ └───────┘ └──────────────┘  │
│                                                          │
│  Cross-cutting: ValidationPipe · LoggingInterceptor      │
│                 JwtAuthGuard · AuditService (non-block)  │
└──────┬─────────────┬───────────────┬────────────────────┘
       │             │               │
       ▼             ▼               ▼
  ┌─────────┐   ┌─────────┐   ┌────────────────────────┐
  │ MongoDB  │   │  Redis  │   │   External Market APIs  │
  │          │   │         │   │                         │
  │ users    │   │ price   │   │ CoinGecko (BTC, ETH)    │
  │ backtest │   │ cache   │   │ AlphaVantage (AAPL,TSLA)│
  │ history  │   │ rate    │   └────────────────────────┘
  │ audit    │   │ limits  │
  └─────────┘   └─────────┘

  MCP Tool Servers (run as sidecar processes):
  ┌─────────────────┐ ┌───────────────────────┐ ┌─────────────────────┐
  │ market-snapshot  │ │  portfolio-diagnostics │ │  backtest-context    │
  │ get_latest_quote │ │  evaluate_risk         │ │  interpret_metrics   │
  │ get_volatility   │ │  check_concentration   │ │  compare_periods     │
  └─────────────────┘ └───────────────────────┘ └─────────────────────┘
```

---

## Project Structure

```
TradingLab/
├── front-end/                    # React SPA
│   └── src/
│       ├── components/           # Reusable UI components
│       │   ├── ai/               # AI advisor panel + markdown renderer
│       │   ├── auth/             # ProtectedRoute wrapper
│       │   ├── common/           # DataTable, ErrorBoundary, loaders, etc.
│       │   ├── mcp/              # MCP tool execution panel
│       │   ├── portfolio/        # Asset list components
│       │   └── ui/               # shadcn/ui primitives
│       ├── hooks/                # Custom hooks (useAuth, useMcpChat, useAiModels)
│       ├── layouts/              # MainLayout with sidebar + header
│       ├── lib/                  # API clients (backtest, AI, auth), env config
│       ├── pages/                # Page components (one per route)
│       │   ├── auth/             # Login, Sign-up, Google callback
│       │   ├── dca-backtest/     # Strategy config, chart, trade table
│       │   ├── portfolio-backtest/# Multi-asset config, pie chart
│       │   ├── ai-advisor/       # AI settings, model config
│       │   └── ai-chat/          # Chat panel + session sidebar
│       ├── providers/            # QueryProvider, ChatProvider
│       └── router/               # React Router v7 config
│
├── back-end/                     # NestJS API
│   └── src/
│       ├── ai/                   # AI module
│       │   ├── ai.controller.ts  # POST /ai/analyze (SSE streaming)
│       │   ├── ai.service.ts     # Orchestrates LLM + MCP
│       │   ├── llm.service.ts    # OpenAI client, streaming logic
│       │   ├── prompt-generator.service.ts  # Structured prompt builder
│       │   ├── mcp/              # MCP config, runtime, permissions, registry
│       │   ├── mcp-servers/      # 3 standalone MCP tool servers
│       │   │   ├── market-snapshot.server.ts
│       │   │   ├── portfolio-diagnostics.server.ts
│       │   │   └── backtest-context.server.ts
│       │   └── guards/           # AiRateLimitGuard (Redis + in-memory)
│       ├── auth/                 # Auth module
│       │   ├── auth.controller.ts# /auth/register, /login, /refresh, /google/*
│       │   ├── auth.service.ts   # JWT issuance, Google OAuth, bcrypt
│       │   └── strategies/       # JWT passport strategy
│       ├── backtest/             # Backtest module
│       │   ├── backtest.controller.ts   # POST /backtest/dca, /backtest/portfolio
│       │   ├── calculation.service.ts   # Core DCA engine (BigNumber.js)
│       │   ├── price.service.ts         # CoinGecko + AlphaVantage fetcher
│       │   ├── backtest-history.service.ts  # Save / list / delete runs
│       │   └── dto/              # RunDcaBacktestDto, RunPortfolioBacktestDto
│       ├── users/                # Users module (profile, update, soft delete)
│       ├── audit/                # Non-blocking audit log to MongoDB
│       └── common/               # Guards, interceptors, decorators, middleware
│
├── doc/                          # Project documentation
│   ├── requirements.md           # Feature spec (Level 0–4)
│   ├── developer-tasks.md        # Sprint tasks with IDs and acceptance criteria
│   ├── back-end-guide.md         # NestJS patterns and module conventions
│   ├── knowledge-tech-stack.md   # Tech rationale and interview prep
│   └── level-4-ai-mcp-implementation-guide.md  # MCP implementation guide
│
└── docker-compose.yml            # Root-level shortcut (see back-end/docker-compose.yml)
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Docker & Docker Compose** (for MongoDB and Redis)
- API keys: `OPENAI_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### 1. Start Infrastructure (MongoDB + Redis)

```bash
cd back-end
docker compose up -d
```

### 2. Start the Backend

```bash
cd back-end
cp .env.example .env        # Fill in your API keys
npm install
npm run start:dev           # Runs on http://localhost:8000
```

The Swagger API docs are available at **http://localhost:8000/api/docs**

### 3. Start the MCP Servers (for AI features)

In a separate terminal:

```bash
cd back-end
npm run build
npm run start:mcp           # Starts all 3 MCP servers concurrently
```

### 4. Start the Frontend

```bash
cd front-end
cp .env .env.local          # Already set to point to localhost:8000
npm install
npm run dev                 # Runs on http://localhost:5173
```

### Environment Variables

See `back-end/.env.example` for the full list. Key variables:

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `REDIS_HOST` / `REDIS_PORT` | Yes | Redis connection |
| `JWT_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `OPENAI_API_KEY` | Yes (for AI) | OpenAI API key |
| `ALPHA_VANTAGE_API_KEY` | Yes (for stocks) | AlphaVantage key (free at alphavantage.co) |
| `GOOGLE_CLIENT_ID` | Yes (for OAuth) | Google Cloud Console credentials |
| `GOOGLE_CLIENT_SECRET` | Yes (for OAuth) | Google Cloud Console credentials |

---

## API Overview

All endpoints are documented in **Swagger** at `http://localhost:8000/api/docs`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create account |
| `POST` | `/auth/login` | Public | Login, get access + refresh token |
| `POST` | `/auth/refresh` | Public (cookie) | Rotate tokens |
| `GET` | `/auth/google` | Public | Redirect to Google OAuth |
| `GET` | `/auth/google/callback` | Public | Handle OAuth callback |
| `POST` | `/auth/logout` | JWT | Clear session |
| `GET` | `/users/me` | JWT | Get own profile |
| `PATCH` | `/users/me` | JWT | Update profile |
| `POST` | `/backtest/dca` | JWT | Run single-asset DCA backtest |
| `POST` | `/backtest/portfolio` | JWT | Run multi-asset portfolio backtest |
| `GET` | `/backtest/history` | JWT | List saved backtests |
| `POST` | `/backtest/history` | JWT | Save a backtest result |
| `DELETE` | `/backtest/history/:id` | JWT | Delete a saved backtest |
| `POST` | `/ai/analyze` | JWT | Stream AI analysis (SSE) |

---

## Key Engineering Decisions

These are the decisions that distinguish this project from a tutorial clone. Understand them before interviews.

### 1. BigNumber.js for Financial Arithmetic

JavaScript floats break for money: `0.1 + 0.2 === 0.30000000000000004`. For a backtest engine that compounds hundreds of trades, rounding errors accumulate. Every financial calculation in `calculation.service.ts` uses `BigNumber.js` for exact decimal arithmetic — the same approach used in production trading systems.

### 2. Dual-Token JWT Authentication

A single JWT is fragile — if stolen, the attacker has unlimited access until expiry. The dual-token pattern uses:
- **Access token** (15 min) — short-lived, kept in memory, sent as `Authorization: Bearer`
- **Refresh token** (7 days) — long-lived, stored in an `HttpOnly` cookie (JavaScript cannot read it, blocking XSS theft)

### 3. MCP (Model Context Protocol) for the AI Layer

Instead of dumping raw data into the system prompt, the AI advisor calls structured **tool servers** that return verified, current data. This prevents hallucination and makes the AI's reasoning auditable. Before executing any tool, the user sees what the AI wants to call — **inspect → approve → execute**. This is the emerging standard for production AI agents.

### 4. SSE Streaming for AI Responses

Rather than waiting for the full OpenAI response (which can take 5–10 seconds), tokens stream to the browser via Server-Sent Events the moment they are generated. The UI renders text word-by-word, which feels instant.

### 5. UTC Date Alignment in the Backtest Engine

Financial data is date-indexed. A timezone offset of even a few hours can silently shift a "buy on January 1" to December 31. Every date in the calculation engine is normalized to `Date.UTC(year, month, day)` midnight. Month-end clamping handles cases like "monthly buys starting January 31" (no February 31 exists — the engine clamps to February 28/29).

### 6. Parallel Fetching for Portfolio Backtests

For a 4-asset portfolio, fetching price data sequentially takes 4× as long. `Promise.all()` fires all API requests concurrently, cutting wall-clock time from ~4 seconds to ~1 second.

### 7. Non-Blocking Audit Logging

Auth events (register, login, token refresh) are written to MongoDB as a fire-and-forget side effect. If the audit write fails, the error is caught and logged — the original request is never affected. This is the correct pattern for observability: monitoring should never impact the critical path.

---

## For Your CV & Interviews

This is not a to-do app or a tutorial clone. Here is what an interviewer sees and how to talk about it.

### On Your CV

```
TradingLab — Full-Stack DCA Backtesting Platform with AI Advisor
React 19 · NestJS 11 · MongoDB · Redis · OpenAI · MCP · TypeScript · Docker

• Built a DCA backtesting engine using BigNumber.js for precision arithmetic,
  supporting single-asset and multi-asset portfolio simulations with take-profit
  and stop-loss triggers against real CoinGecko and AlphaVantage market data.

• Implemented dual-token JWT authentication (15-min access token + 7-day HttpOnly
  refresh token) and Google OAuth 2.0 with manual code exchange flow.

• Integrated an AI advisor powered by OpenAI with real-time SSE token streaming
  and Model Context Protocol (MCP) tool servers for verified, current market context.

• Built Redis-backed rate limiting with in-memory fallback and a non-blocking
  MongoDB audit trail for all auth and AI events.
```

### Interview Questions You Can Now Answer

| Question | What You Built |
|---|---|
| *"Walk me through your JWT auth flow end to end."* | Dual-token, HttpOnly cookies, soft delete, refresh rotation |
| *"Why did you use BigNumber.js?"* | Float arithmetic breaks financial calculations at scale |
| *"What is MCP and why is it more reliable than stuffing data into a prompt?"* | Structured tool calls return verified data; reduces hallucination; inspect→approve→execute |
| *"How does your AI streaming work?"* | SSE keeps HTTP connection open; tokens render as typed |
| *"What is the NestJS request pipeline order?"* | Middleware → Guard → Interceptor → Pipe → Controller |
| *"What does `whitelist: true` on ValidationPipe do?"* | Strips unknown fields, prevents mass-assignment attacks |
| *"What happens if an external API is slow?"* | `AbortSignal.timeout(10_000)` caps every outbound fetch |
| *"How do you separate server state from UI state?"* | TanStack Query for server data, React Context for ephemeral UI |

### Why This Project Scores High

| What interviewers see | Why it matters |
|---|---|
| Layered NestJS request pipeline | Backend architecture knowledge beyond "write a route" |
| Dual-token auth with HttpOnly cookies | Industry-standard security — most students use a single token |
| Google OAuth implemented manually | Can explain every OAuth 2.0 step, not just `passport.authenticate()` |
| BigNumber.js for financial math | Understands why float arithmetic fails in production |
| MCP tool servers | Cutting-edge agentic AI pattern (2024/2025) — very few students have touched this |
| SSE token streaming | Real-time AI output, not a spinner |
| Redis rate limiting with fallback | Thought about operational constraints, not just happy paths |
| Non-blocking audit log | Understands side-effect isolation and failure handling |
| Swagger/OpenAPI docs | Professional API documentation — expected at every real company |
| Unit tests on core calculation engine | The most critical code is tested |
| Docker Compose for local infra | New team member can run full stack in one command |
| Zero npm audit vulnerabilities | Clean, maintained codebase |

---

## Documentation

| Document | Purpose |
|---|---|
| [`doc/requirements.md`](doc/requirements.md) | Full feature specification (Level 0–4) with user stories |
| [`doc/developer-tasks.md`](doc/developer-tasks.md) | Sprint task breakdown with IDs, dependencies, and acceptance criteria |
| [`doc/back-end-guide.md`](doc/back-end-guide.md) | NestJS patterns, module conventions, request pipeline |
| [`doc/knowledge-tech-stack.md`](doc/knowledge-tech-stack.md) | Tech rationale and interview prep guide |
| [`doc/level-4-ai-mcp-implementation-guide.md`](doc/level-4-ai-mcp-implementation-guide.md) | Step-by-step MCP implementation guide |
| [`front-end/PRODUCTION_REVIEW.md`](front-end/PRODUCTION_REVIEW.md) | Code quality review, score breakdown, and detailed interview prep |
| [`front-end/docs/FRONTEND_ARCHITECTURE.md`](front-end/docs/FRONTEND_ARCHITECTURE.md) | Frontend architecture decisions and patterns |
| `http://localhost:8000/api/docs` | Live Swagger API documentation (when backend is running) |

---

## Project Score (Production Review)

| Module | Score | Notes |
|---|---|---|
| Backend: Auth | 9/10 | Dual-token, Google OAuth, bcrypt, HttpOnly cookies, soft delete, audit |
| Backend: Backtest Engine | 9/10 | BigNumber precision, UTC alignment, triggers, parallel fetch, history CRUD |
| Backend: AI / MCP | 9/10 | SSE streaming, 3 MCP servers, inspect→approve→execute, rate limiting |
| Backend: Users / Audit | 9/10 | Account linking, password verification, non-blocking audit trail |
| Backend: Infrastructure | 9/10 | ValidationPipe, CORS, Swagger, Logger, 0 npm audit vulnerabilities |
| Backend: Tests | 5/10 | Core engine covered; auth/price/history gaps remain |
| Frontend: Architecture | 9/10 | Clean hierarchy, Error Boundary, protected routes |
| Frontend: TypeScript | 9/10 | Strict build passes; key `any` violations resolved |
| Frontend: State | 8/10 | Query/Context separation correct |
| Frontend: API Layer | 9/10 | Timeout, streaming, single URL source of truth |
| Frontend: Performance | 6/10 | No code splitting yet — first post-MVP task |
| **Overall** | **8.8 / 10** | MVP-ready · Resume-ready · Internship-appropriate |

---

*Built as a teaching project to demonstrate full-stack engineering patterns at internship level and above.*
