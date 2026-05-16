# TradingLab — Full-Stack Production Readiness Review

**Date:** 2026-05-17
**Branch:** `refactor/refactor-for-production`
**Stack:** NestJS 11 · MongoDB · Redis · OpenAI · React 19 · TypeScript 5.9 · Vite 7 · TanStack Query v5 · Tailwind CSS v4

---

## Resume Assessment

**Verdict: Yes — strong internship resume project.**

The scope and technical depth are genuinely above average for student work. Interviewers will notice:

- Real external API integration with proper error handling (CoinGecko, AlphaVantage)
- MCP (Model Context Protocol) — cutting-edge, uses the official SDK correctly
- Dual-token auth (JWT + HttpOnly refresh cookie) instead of a naive single-token approach
- Full Google OAuth 2.0 flow implemented manually (not just a Passport shortcut)
- Precision arithmetic with `BigNumber.js` for financial calculations
- SSE token streaming for AI responses
- Redis-backed rate limiting with cache fallback
- MongoDB audit log (non-blocking, persisted)
- Swagger/OpenAPI docs with real examples
- Unit tests on the core calculation engine
- Docker Compose for local infra

---

## Executive Summary

| Status | Count |
|--------|-------|
| 🔴 Must-fix | 0 — all resolved |
| 🟠 Should fix soon | 0 — all resolved |
| 🟡 Minor / tech debt | 8 |

---

## Backend

### Auth Module — `src/auth/`

**Rating: ✅ Strong**

Full email/password + Google OAuth 2.0 implementation. Dual-token pattern: 15-minute JWT access token + 7-day refresh token in an HttpOnly cookie. Token rotation on refresh. Soft-delete aware (`deletedAt`). Audit log on every auth event.

| Severity | File | Issue |
|----------|------|-------|
| 🟡 Minor | `auth.service.ts:125–138` | Google OAuth state is the callback URL string, not a random CSRF nonce — acceptable for MVP but a proper nonce is best practice |
| 🟡 Minor | `auth.service.ts:279–302` | Refresh tokens are stateless (no server-side store) — valid tokens cannot be revoked if compromised |

---

### Backtest Module — `src/backtest/`

**Rating: ✅ Excellent**

The strongest part of the project. Single-asset and multi-asset DCA simulation with:

- Daily / weekly / monthly schedules with correct UTC midnight alignment and month-end day clamping
- Take-profit and stop-loss triggers
- `BigNumber.js` throughout — no floating-point drift
- Price data from CoinGecko (BTC, ETH) and AlphaVantage (AAPL, TSLA) with rate-limit handling
- Parallel price fetching for multi-asset runs
- Backtest history: save / list (last 20, sorted) / delete, scoped to the authenticated user
- Unit tests covering daily, weekly, monthly schedules, and both trigger types

| Severity | File | Issue |
|----------|------|-------|
| 🟡 Minor | `price.service.ts:139, 266` | `data: any` for external API responses — type the CoinGecko and AlphaVantage shapes |

---

### AI Module — `src/ai/`

**Rating: ✅ Strong**

Sophisticated AI integration with three MCP servers (market snapshot, backtest context, portfolio diagnostics). Clean separation of concerns: `LlmService` handles OpenAI, `McpRuntimeService` handles tool discovery and execution, `PromptGeneratorService` builds the prompt.

Notable: the inspect → approve → execute pattern is correctly implemented, letting the client control which MCP tools are actually run.

| Severity | File | Issue |
|----------|------|-------|
| 🟡 Minor | `llm.service.ts` | No timeout on OpenAI streaming — a stalled stream will hold the SSE connection open indefinitely |

---

### Users Module — `src/users/`

**Rating: ✅ Good**

MongoDB schema with soft delete (`deletedAt`), Google account linking, and password change with `currentPassword` verification. `PATCH /users/me`, `DELETE /users/me`, `GET /users/me` all implemented and audited.

No open issues.

---

### Audit Module — `src/audit/`

**Rating: ✅ Good**

Logs auth events (`register`, `login`, `logout`, `refresh`, `profile_update`, `soft_delete`) and AI events (`mcp_discovery`, `mcp_tool_execution`) to MongoDB. Non-blocking — errors are caught and logged rather than bubbling up.

No open issues.

---

### Infrastructure & Configuration

**Rating: ✅ Good**

- CORS configured with exact origin matching (not `*`) — correct
- `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — correct
- Swagger docs at `/api/docs` with Bearer auth and full response examples
- `LoggingInterceptor` on every request
- Redis cache (optional) with in-memory fallback
- Docker Compose for local dev (MongoDB + Redis)

| Severity | File | Issue |
|----------|------|-------|
| 🟡 Minor | `main.ts:82` | `console.log` for startup messages — use NestJS `Logger` for consistency |

> **Note:** `npm audit` reports 22 vulnerabilities (4 critical, 7 high) in `node_modules`. Run `npm audit` in `back-end/` to review before any production deployment.

---

### Testing — Backend

**Rating: 🟡 Partial**

7 spec files exist, covering the most important logic:

| File | Coverage |
|------|----------|
| `calculation.service.spec.ts` | Daily / weekly / monthly DCA, take-profit, stop-loss triggers |
| `run-dca-backtest.dto.spec.ts` | DTO validation edge cases |
| `prompt-generator.service.spec.ts` | Prompt structure |
| `llm.service.spec.ts` | LLM error handling |
| `mcp-config.service.spec.ts` | MCP config |
| `mcp-permission.service.spec.ts` | Tool permission decisions |
| `app.controller.spec.ts` | Health check stub |

**Gaps:** No tests for `AuthService`, `UsersService`, `PriceService`, `BacktestHistoryService`, or any controller. No e2e tests.

---

## Frontend

### Architecture & Build

**Rating: ✅ Excellent**

Clean component hierarchy, proper use of React Query for server state, Context for UI/chat state. Protected route pattern is correct. Build is clean — `tsc --noEmit` exits 0.

| Severity | File | Issue |
|----------|------|-------|
| 🟡 Minor | `src/components/ai/MarkdownContent.tsx` | Duplicate of `src/components/ui/MarkdownContent.tsx` — one should be deleted |

---

### TypeScript & Type Safety

**Rating: 🟡 7/10 — build passes, pervasive `any` remains**

`tsc --noEmit` exits 0. ~28 ESLint `no-explicit-any` violations remain.

| File | Lines | Notes |
|------|-------|-------|
| `src/lib/api-client.ts` | 6, 8 | `data: any` in `ApiError` |
| `src/components/mcp/McpExecutionPanel.tsx` | 12, 15, 81 | Input and result types |
| `src/pages/dca-backtest/timeline-to-chart.ts` | 10–13 | Chart data transformation |
| `src/pages/SettingsPage.tsx` | 51, 89 | Form handlers |
| `src/hooks/use-auth.ts` | 129 | `as any` cast |

---

### State Management

**Rating: ✅ 8/10**

React Query well-configured (1-minute staleTime, smart retry). Context API scoped correctly.

**`setState` inside `useEffect` — cascading renders:**

| File | Lines |
|------|-------|
| `src/pages/dca-backtest/PortfolioTrajectoryChart.tsx` | 79 |
| `src/pages/dca-backtest/TradeHistoryTable.tsx` | 78, 83 |

---

### API & Data Fetching

**Rating: 🟡 7/10**

SSE streaming correctly implemented. Bearer token auto-injected.

| Severity | Issue | Location |
|----------|-------|----------|
| 🟡 Minor | `ApiError.data` typed as `any` | `api-client.ts:6` |
| 🟢 Low | `VITE_API_URL` fallback hardcoded in two files | `api-client.ts:44`, `ai-api.ts:185` |

---

### Performance

**Rating: 🟡 5/10**

No route-based code splitting. Recharts + AI panels load on every page.

React Compiler warnings (library limitations, not actionable):

| File | Note |
|------|------|
| `src/components/common/DataTable.tsx:61` | TanStack Table returns functions — not memoizable |
| `src/pages/dca-backtest/StrategyConfigCard.tsx:112` | `watch()` incompatible with compiler |

---

### Testing — Frontend

**Rating: 🟡 0/10 — no tests**

No test framework installed. Acceptable for MVP; needed before any real user traffic.

---

### Minor / Polish

| Severity | File | Issue |
|----------|------|-------|
| 🟡 | `src/components/common/PageContainer.tsx:4` | Empty interface — use parent type directly |
| 🟡 | `src/pages/dca-backtest/TradeHistoryTable.tsx:62` | `_portfolioSymbols` declared but unused |
| 🟢 | `src/App.css` | Unused logo-animation styles |
| 🟢 | React Fast Refresh (10 ESLint warnings) | `badgeVariants`, `buttonVariants` exported alongside components in `src/components/ui/` |

---

## What You Learned Through This Project

This section maps the features you built to the concepts behind them — read it before an interview.

---

### Authentication & Security

**What you built:** Email/password login + Google OAuth 2.0 + JWT access/refresh tokens.

**What you learned:**

- **Dual-token auth pattern.** A short-lived access token (15 min) kept in memory + a long-lived refresh token (7 days) in an HttpOnly cookie. This is the industry-standard pattern because it limits the damage of a stolen token without forcing the user to log in constantly.
- **Why HttpOnly cookies matter.** JavaScript on the page cannot read an HttpOnly cookie, so even if an attacker injects a script (XSS), they can't steal the refresh token. You implemented this correctly.
- **Google OAuth 2.0 code exchange.** Most tutorials use a library that hides the OAuth flow. You implemented it manually: redirect → authorization code → token exchange → profile fetch → upsert user. Interviewers are impressed when you can explain this step by step.
- **Password hashing with bcrypt.** Passwords are never stored in plain text. bcrypt is slow by design — it makes brute-force attacks expensive. You applied a salt round of 10.
- **Soft delete (`deletedAt`).** Rather than removing a user row, you set a `deletedAt` timestamp. This preserves audit history and allows account recovery. Queries filter `deletedAt: null` to exclude deleted accounts.

**Interview question you can now answer:** *"Walk me through how your JWT auth flow works."*

---

### Financial Calculations & Precision Arithmetic

**What you built:** A DCA backtest engine for single and multi-asset portfolios with take-profit / stop-loss triggers.

**What you learned:**

- **Why floating-point arithmetic breaks financial software.** `0.1 + 0.2 === 0.30000000000000004` in JavaScript. For money, rounding errors compound across hundreds of trades. You solved this with `BigNumber.js`, which represents decimals exactly.
- **UTC date alignment.** Financial data is date-indexed. You learned to normalize every date to UTC midnight (`Date.UTC(year, month, day)`) so that timezone offsets don't silently shift buy dates by a day.
- **Market schedule gaps.** Stock markets close on weekends and holidays. When a scheduled buy falls on a day with no price, your engine rolls forward to the first available price point — a real-world detail most tutorials skip.
- **Month-end day clamping.** A monthly buy starting January 31 has no February 31. Your `addMonthsUtcClamped` function clamps to the last valid day of the target month — the same logic used in production banking systems.
- **Portfolio weight validation.** You enforced that asset weights sum to exactly 100% using a BigNumber tolerance (`1e-6`) rather than a float comparison, which would fail for weights like 33.33 + 33.33 + 33.34.

**Interview question you can now answer:** *"Why did you use BigNumber.js instead of regular numbers?"*

---

### External API Integration

**What you built:** Price data fetching from CoinGecko (crypto) and AlphaVantage (stocks) with rate-limit detection and timeout handling.

**What you learned:**

- **Not all APIs use HTTP status codes correctly.** AlphaVantage returns HTTP 200 with a JSON body containing an `Information` field when you are rate-limited, instead of returning 429. You learned to inspect the body, not just the status code.
- **Free-tier API limits are real constraints.** CoinGecko free tier only returns data for the past ~365 days. You detect the specific error message in the 401 body and return a user-friendly `BadRequestException` rather than a confusing server error.
- **Request timeouts prevent server hangs.** An external API that stops responding will hold your Node.js thread on that request indefinitely. You added `AbortSignal.timeout(10_000)` to cap every outbound fetch at 10 seconds.
- **Parallel fetching for multi-asset runs.** For a portfolio backtest with 4 assets, fetching them sequentially would take 4× as long. You used `Promise.all()` to fetch all symbols concurrently.

**Interview question you can now answer:** *"What happens if an external API you depend on is slow or down?"*

---

### AI Integration & Streaming

**What you built:** An AI advisor backed by OpenAI with SSE token streaming and MCP (Model Context Protocol) tool evidence.

**What you learned:**

- **Server-Sent Events (SSE) for real-time output.** Instead of waiting for the full AI response, you stream each token to the browser as it arrives. The browser renders words as they are typed, which feels instant. SSE uses a plain HTTP response that stays open — no WebSocket needed.
- **Prompt engineering.** You structured the system prompt with a fixed output format (Summary / Key Evidence / Risk Note / Suggested Next Experiment). This makes the AI output predictable and parseable by the frontend.
- **MCP (Model Context Protocol).** Rather than giving the LLM raw data in the prompt, you run structured tool calls first — fetching the latest market quote, evaluating risk, checking concentration — and inject the results as evidence. This is agentic AI: the model reasons over real, fresh data rather than hallucinating from training knowledge.
- **The inspect → approve → execute pattern.** Before running any tool, the system tells the user what it plans to do. The user can approve or deny each tool. This is how production AI systems implement human-in-the-loop control.
- **Rate limiting AI endpoints.** AI calls are expensive. You built a cache-backed rate limiter (`AiRateLimitGuard`) that counts requests per user within a rolling window and returns 429 when the limit is exceeded.

**Interview question you can now answer:** *"How did you implement the AI streaming? What is MCP and why did you use it?"*

---

### Backend Architecture (NestJS)

**What you built:** A full NestJS application with a layered request pipeline.

**What you learned:**

- **The NestJS request pipeline:** Middleware → Guard → Interceptor → Pipe → Controller. Each layer has a single responsibility. Guards decide *can this request proceed*. Pipes validate and transform input. Interceptors add cross-cutting concerns (logging, timing). Understanding this order matters when debugging why a request is blocked or transformed unexpectedly.
- **Dependency injection.** You never call `new SomeService()` manually. NestJS resolves and injects dependencies automatically. This makes services easy to test in isolation by swapping real dependencies with mocks.
- **Global `ValidationPipe` with `whitelist: true`.** Any property not declared in the DTO is silently stripped. `forbidNonWhitelisted: true` goes further — it rejects the request if unknown fields are present. This prevents mass-assignment attacks.
- **Swagger/OpenAPI docs as living documentation.** Every controller and DTO is decorated with `@ApiOperation`, `@ApiBody`, and `@ApiResponse`. Swagger generates a browsable, testable API doc automatically — no manual maintenance needed.
- **Audit logging as a side effect.** Auth events (login, logout, register, token refresh) and AI events (MCP tool execution) are written to MongoDB as a non-blocking side effect. If the write fails, the error is caught and logged — the main request is not affected.

**Interview question you can now answer:** *"What is the order of execution in a NestJS request? What does ValidationPipe do?"*

---

### Frontend Architecture (React)

**What you built:** A React 19 SPA with TanStack Query, React Hook Form, Zod, and a streaming AI chat panel.

**What you learned:**

- **Server state vs. UI state.** TanStack Query owns server-fetched data (backtest results, user profile, history list). React Context owns ephemeral UI state (chat messages, AI panel open/closed). Mixing them causes bugs — this separation keeps both manageable.
- **Optimistic UI and cache invalidation.** When you save a backtest, TanStack Query invalidates the history list query, which triggers a background refetch. The UI stays consistent without manual state updates.
- **Type-safe forms with Zod.** You defined the form schema as a Zod type and used it both for runtime validation and as the TypeScript type for the form values. One source of truth — no separate interface needed.
- **React Error Boundary.** A class component that catches any render error in its subtree and shows a fallback UI. Without it, a single component crash whites out the entire app. You added it to `MainLayout` so route-level crashes are contained.
- **Protected routes.** `ProtectedRoute` checks auth state before rendering. Unauthenticated users are redirected to login. The `from` location is preserved so they land back on the page they wanted after logging in.

**Interview question you can now answer:** *"How did you manage server state vs. local state in your app? What is an Error Boundary?"*

---

### DevOps & Tooling

**What you built:** Docker Compose for local infra, Swagger docs, environment variable validation.

**What you learned:**

- **Docker Compose for local dependencies.** Running `docker compose up -d` gives every developer an identical MongoDB + Redis environment in seconds. No "works on my machine" problems for the database layer.
- **Environment variable validation at startup.** `src/lib/env.ts` throws immediately if a required variable is missing, rather than crashing later with a cryptic runtime error. Fail fast, fail clearly.
- **`.env.example` as developer onboarding.** The file documents every variable the app needs, with safe defaults and comments explaining each one. A new developer can be running the app in minutes.

---

## Score Summary

| Category | Score | Notes |
|----------|-------|-------|
| **Backend: Auth** | ✅ 9/10 | Solid dual-token + Google OAuth; cookie security fixed |
| **Backend: Backtest Engine** | ✅ 9/10 | Best part of the project; BigNumber, triggers, real data |
| **Backend: AI / MCP** | ✅ 8/10 | Cutting-edge; hardcoded suggested actions is the only real gap |
| **Backend: Users / Audit** | ✅ 9/10 | Soft delete, account linking, non-blocking audit — all correct |
| **Backend: Infrastructure** | ✅ 8/10 | NestJS version aligned; `.env.example` documented with MCP setup |
| **Backend: Tests** | 🟡 5/10 | Core engine tested; auth/price/history not covered |
| **Frontend: Architecture** | ✅ 9/10 | Clean, modern, correct patterns |
| **Frontend: TypeScript** | 🟡 7/10 | Build passes; pervasive `any` |
| **Frontend: Performance** | 🟡 5/10 | No code splitting |
| **Frontend: Tests** | 🟡 0/10 | None installed |
| **Overall** | **7.8 / 10** | MVP-ready and resume-ready |
