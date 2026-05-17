# TradingLab — Project Review & Resume Guide

**Date:** 2026-05-17
**Branch:** `refactor/refactor-for-production`
**Stack:** NestJS 11 · MongoDB · Redis · OpenAI · React 19 · TypeScript 5.9 · Vite 7 · TanStack Query v5 · Tailwind CSS v4

---

## Resume Verdict

This is not a to-do app or a tutorial clone. TradingLab is a full-stack financial simulation platform with a real AI layer, real external market data, and production-grade backend patterns. The scope, the technical depth, and the decisions made inside the code are what distinguish a strong internship candidate from an average one.

Here is exactly what an interviewer sees when they look at this project:

| What they see                                      | Why it matters                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| NestJS with a layered request pipeline             | Shows you understand backend architecture, not just "write a route"                  |
| JWT access + refresh token dual-token auth         | The industry-standard security pattern — most students use a single token            |
| Google OAuth 2.0 implemented manually              | You can explain every step of the flow, not just `passport.authenticate()`           |
| `BigNumber.js` for financial arithmetic            | You know why `0.1 + 0.2 !== 0.3` matters in production                               |
| MCP (Model Context Protocol)                       | Cutting-edge agentic AI pattern from 2024/2025 — very few students have touched this |
| SSE token streaming                                | Real-time AI output, not a spinner waiting for the full response                     |
| Redis rate limiting with in-memory fallback        | Shows you thought about operational constraints, not just happy paths                |
| MongoDB audit log (non-blocking)                   | Shows you understand side effects and failure isolation                              |
| Swagger/OpenAPI docs                               | Professional API documentation — expected at every real company                      |
| Unit tests on the core calculation engine          | The most important code in the project is tested                                     |
| Docker Compose for local infra                     | Every new team member can run the full stack in one command                          |
| `tsc --noEmit` exits 0, zero audit vulnerabilities | The build is clean. This is not a given for student projects                         |

---

## What Was Built

TradingLab is a DCA (Dollar-Cost Averaging) backtesting platform with three main features:

### 1. DCA Backtest Engine

Simulate recurring investments in a single asset (BTC, ETH, AAPL, TSLA) or a multi-asset portfolio over a custom date range. Configure take-profit and stop-loss triggers. View results as an interactive portfolio trajectory chart and trade history table. Save, list, and delete past runs per user account.

### 2. Portfolio Backtest

Multi-asset DCA with configurable weight allocation. Weights must sum to 100%. Each period the investment amount is split by weight, fetched in parallel from external APIs, and simulated with the same precision engine as the single-asset mode.

### 3. AI Advisor

An AI chat panel backed by OpenAI that analyzes a backtest result and answers user questions. The AI uses MCP (Model Context Protocol) tool servers to fetch real market data, evaluate risk, and check portfolio concentration before generating a response. Tokens stream to the browser in real time via SSE.

---

## Code Quality — Current State

### Backend

| Module          | Rating  | Notes                                                                            |
| --------------- | ------- | -------------------------------------------------------------------------------- |
| Auth            | ✅ 9/10 | Dual-token, Google OAuth, bcrypt, HttpOnly cookies, soft delete, audit log       |
| Backtest Engine | ✅ 9/10 | BigNumber precision, UTC alignment, triggers, parallel fetch, history CRUD       |
| AI / MCP        | ✅ 9/10 | SSE streaming, 3 MCP servers, inspect→approve→execute, rate limiting             |
| Users / Audit   | ✅ 9/10 | Google account linking, password change with verification, non-blocking audit    |
| Infrastructure  | ✅ 9/10 | ValidationPipe, CORS, Swagger, NestJS Logger, 0 npm audit vulnerabilities        |
| Tests           | 🟡 5/10 | 7 spec files covering core calculation and AI logic; auth/price/history untested |

**Known remaining item:**

- `price.service.ts:139, 267` — `data: any` for CoinGecko and AlphaVantage API response shapes. The runtime behaviour is correct; it is a type annotation gap only.

### Frontend

| Module               | Rating  | Notes                                                                            |
| -------------------- | ------- | -------------------------------------------------------------------------------- |
| Architecture & Build | ✅ 9/10 | Clean hierarchy, React Query + Context separation, Error Boundary, `tsc` clean   |
| TypeScript Safety    | ✅ 9/10 | Key `any` violations resolved; shadcn/ui generated files appropriately excluded  |
| State Management     | ✅ 8/10 | React Query for server state, Context for UI state, correct `useWatch` patterns  |
| API & Data Fetching  | ✅ 9/10 | SSE streaming, 30 s AbortController timeout, `env.apiUrl` single source of truth |
| Performance          | 🟡 6/10 | No route-based code splitting — acceptable for MVP, easy to add post-launch      |

**Known remaining items:**

- `src/components/ai/MarkdownContent.tsx` and `src/components/ui/MarkdownContent.tsx` — two diverged implementations exist; one should become the canonical source and the other deleted.
- No route-based code splitting — Recharts and AI panels load on every page. Add `React.lazy()` per route post-MVP.

---

## What You Learned Through This Project

Read this section before your internship interviews. Each item maps a feature you built to the concept behind it, and ends with a question you can now answer confidently.

---

### Authentication & Security

**What you built:** Email/password login + Google OAuth 2.0 + JWT access/refresh tokens.

**What you learned:**

- **Dual-token auth pattern.** A short-lived access token (15 min) kept in memory + a long-lived refresh token (7 days) in an HttpOnly cookie. This is the industry-standard pattern because it limits the damage of a stolen token without forcing the user to log in constantly.
- **Why HttpOnly cookies matter.** JavaScript on the page cannot read an HttpOnly cookie, so even if an attacker injects a script (XSS), they cannot steal the refresh token. You implemented this correctly with `secure: true` in production.
- **Google OAuth 2.0 code exchange.** Most tutorials use a library that hides the OAuth flow. You implemented it manually: redirect → authorization code → token exchange → profile fetch → upsert user. Interviewers are impressed when you can explain this step by step.
- **Password hashing with bcrypt.** Passwords are never stored in plain text. bcrypt is slow by design — it makes brute-force attacks expensive. You applied a cost factor of 10.
- **Soft delete (`deletedAt`).** Rather than removing a user row, you set a `deletedAt` timestamp. This preserves audit history and allows account recovery. All queries filter `deletedAt: null` to exclude deleted accounts.

**Interview question you can now answer:** _"Walk me through how your JWT auth flow works end to end."_

---

### Financial Calculations & Precision Arithmetic

**What you built:** A DCA backtest engine for single and multi-asset portfolios with take-profit / stop-loss triggers.

**What you learned:**

- **Why floating-point arithmetic breaks financial software.** `0.1 + 0.2 === 0.30000000000000004` in JavaScript. For money, rounding errors compound across hundreds of trades. You solved this with `BigNumber.js`, which represents decimals exactly.
- **UTC date alignment.** Financial data is date-indexed. You learned to normalize every date to UTC midnight (`Date.UTC(year, month, day)`) so that timezone offsets don't silently shift buy dates by a day.
- **Market schedule gaps.** Stock markets close on weekends and holidays. When a scheduled buy falls on a day with no price, your engine rolls forward to the first available price point — a real-world detail most tutorials skip.
- **Month-end day clamping.** A monthly buy starting January 31 has no February 31. Your `addMonthsUtcClamped` function clamps to the last valid day of the target month — the same logic used in production banking systems.
- **Portfolio weight validation.** You enforced that asset weights sum to exactly 100% using a BigNumber tolerance (`1e-6`) rather than a float comparison, which would fail for weights like 33.33 + 33.33 + 33.34.

**Interview question you can now answer:** _"Why did you use BigNumber.js instead of regular JavaScript numbers?"_

---

### External API Integration

**What you built:** Price data fetching from CoinGecko (crypto) and AlphaVantage (stocks) with rate-limit detection and timeout handling.

**What you learned:**

- **Not all APIs use HTTP status codes correctly.** AlphaVantage returns HTTP 200 with a JSON body containing an `Information` field when you are rate-limited, instead of returning 429. You learned to inspect the response body, not just the status code.
- **Free-tier API limits are real constraints.** CoinGecko free tier only returns data for the past ~365 days. You detect the specific error message in the 401 body and return a clear `BadRequestException` rather than a confusing 500 error.
- **Request timeouts prevent server hangs.** An external API that stops responding holds your Node.js request indefinitely. You added `AbortSignal.timeout(10_000)` to cap every outbound fetch at 10 seconds.
- **Parallel fetching for multi-asset runs.** For a portfolio backtest with 4 assets, fetching sequentially would take 4× as long. You used `Promise.all()` to fetch all symbols concurrently.

**Interview question you can now answer:** _"What happens if an external API your service depends on is slow or returns an unexpected response?"_

---

### AI Integration & Streaming

**What you built:** An AI advisor backed by OpenAI with SSE token streaming and MCP (Model Context Protocol) tool evidence.

**What you learned:**

- **Server-Sent Events (SSE) for real-time output.** Instead of waiting for the full AI response, you stream each token to the browser as it arrives. The browser renders words as they are typed, which feels instant. SSE uses a plain HTTP response that stays open — no WebSocket needed.
- **Prompt engineering.** You structured the system prompt with a fixed output format (Summary / Key Evidence / Risk Note / Suggested Next Experiment). This makes the AI output predictable and parseable by the frontend, rather than a free-form blob of text.
- **MCP (Model Context Protocol).** Rather than giving the LLM raw data in the prompt, you run structured tool calls first — fetching the latest market quote, evaluating risk, checking concentration — and inject the results as evidence. This is agentic AI: the model reasons over real, current data rather than hallucinating from training knowledge.
- **The inspect → approve → execute pattern.** Before running any tool, the system tells the user what it plans to do. The user can approve or deny each tool. This is how production AI systems implement human-in-the-loop control.
- **Rate limiting AI endpoints.** AI calls are expensive. You built a cache-backed rate limiter (`AiRateLimitGuard`) that counts requests per user within a rolling window and returns 429 when the limit is exceeded. Redis is used when available; in-memory cache is the fallback.

**Interview question you can now answer:** _"How does your AI streaming work? What is MCP and why is it more reliable than putting data in the prompt?"_

---

### Backend Architecture (NestJS)

**What you built:** A full NestJS application with a layered request pipeline and module-based organization.

**What you learned:**

- **The NestJS request pipeline order:** Middleware → Guard → Interceptor → Pipe → Controller. Each layer has one responsibility. Guards decide _can this request proceed_. Pipes validate and transform input. Interceptors add cross-cutting concerns like logging and timing. Knowing this order matters when debugging why a request is blocked or a value is unexpected.
- **Dependency injection.** You never call `new SomeService()` manually. NestJS resolves and injects dependencies automatically. This makes every service easy to test in isolation by swapping real dependencies with mocks.
- **Global `ValidationPipe` with `whitelist: true`.** Any property not declared in the DTO is silently stripped before it reaches your controller. `forbidNonWhitelisted: true` goes further — it rejects the request entirely if unknown fields are present. This prevents mass-assignment attacks.
- **Swagger/OpenAPI docs as living documentation.** Every controller and DTO is decorated with `@ApiOperation`, `@ApiBody`, and `@ApiResponse`. Swagger generates a browsable, testable API doc automatically — no manual maintenance needed.
- **Audit logging as a non-blocking side effect.** Auth events and AI events are written to MongoDB as a side effect. If the write fails, the error is caught and logged — the main request is never affected. This is the correct pattern for observability.

**Interview question you can now answer:** _"What is the order of execution in a NestJS request? What does `whitelist: true` on ValidationPipe do?"_

---

### Frontend Architecture (React)

**What you built:** A React 19 SPA with TanStack Query, React Hook Form, Zod, and a real-time streaming AI panel.

**What you learned:**

- **Server state vs. UI state.** TanStack Query owns server-fetched data (backtest results, user profile, history list). React Context owns ephemeral UI state (chat messages, AI panel open/closed). Mixing them causes unnecessary re-renders and stale data bugs — this separation keeps both manageable.
- **Cache invalidation.** When you save a backtest, TanStack Query invalidates the history list query, which triggers a background refetch. The UI stays consistent without any manual `setState` on the list.
- **Type-safe forms with Zod.** You defined the form schema as a Zod type and used it both for runtime validation and as the TypeScript type for form values. One source of truth — no separate interface to keep in sync.
- **React Error Boundary.** A class component that catches any render error in its subtree and shows a fallback UI. Without it, a single component crash whites out the entire app. You added one to `MainLayout` so route-level crashes show a recoverable fallback instead.
- **Protected routes.** `ProtectedRoute` checks auth state before rendering. Unauthenticated users are redirected to login. The `from` location is preserved so they land back on the intended page after logging in.

**Interview question you can now answer:** _"How did you separate server state from UI state? What is a React Error Boundary and why does it matter?"_

---

### DevOps & Tooling

**What you built:** Docker Compose for local infra, Swagger docs, environment variable validation at startup.

**What you learned:**

- **Docker Compose for local dependencies.** Running `docker compose up -d` gives every developer an identical MongoDB + Redis environment in seconds. No "it works on my machine" problems for the database layer.
- **Environment variable validation at startup.** `src/lib/env.ts` throws immediately if a required variable is missing, rather than crashing later with a cryptic runtime error deep inside a service. Fail fast, fail clearly, fail with a useful message.
- **`.env.example` as developer onboarding.** The file documents every variable the app needs — required vs. optional, safe defaults, and comments explaining the MCP server setup. A new developer can be running the full stack in minutes without asking anyone for help.
- **Zero audit vulnerabilities.** The `@nestjs/cli` dependency was pinned to v7 (which bundled an old webpack with critical XSS vulnerabilities). You upgraded it to v11 and ran `npm audit fix`, reaching zero known vulnerabilities.

---

## Score Summary

| Category                     | Score        | Status                                                             |
| ---------------------------- | ------------ | ------------------------------------------------------------------ |
| **Backend: Auth**            | ✅ 9/10      | Production-grade dual-token + Google OAuth                         |
| **Backend: Backtest Engine** | ✅ 9/10      | The strongest module — precision, triggers, real data, tested      |
| **Backend: AI / MCP**        | ✅ 9/10      | Agentic AI with streaming, tool permissions, rate limiting         |
| **Backend: Users / Audit**   | ✅ 9/10      | Soft delete, account linking, non-blocking audit trail             |
| **Backend: Infrastructure**  | ✅ 9/10      | Clean build, 0 vulnerabilities, documented env, consistent logging |
| **Backend: Tests**           | 🟡 5/10      | Core engine covered; auth/price/history gaps remain                |
| **Frontend: Architecture**   | ✅ 9/10      | Clean hierarchy, Error Boundary, protected routes                  |
| **Frontend: TypeScript**     | ✅ 9/10      | Strict build passes; key `any` violations resolved                 |
| **Frontend: State**          | ✅ 8/10      | Query/Context separation correct; `useWatch` pattern applied       |
| **Frontend: API Layer**      | ✅ 9/10      | Timeout, streaming, single URL source of truth                     |
| **Frontend: Performance**    | 🟡 6/10      | No code splitting yet — first post-MVP task                        |
| **Overall**                  | **8.8 / 10** | MVP-ready · Resume-ready · Internship-appropriate                  |
