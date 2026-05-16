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

The issues below are fixable gaps, not signs of bad fundamentals.

---

## Executive Summary

| Status | Count |
|--------|-------|
| 🔴 Must-fix before showing | 4 |
| 🟠 Should fix soon | 5 |
| 🟡 Minor / tech debt | 8 |

---

## Backend

### Auth Module — `src/auth/`

**Rating: ✅ Strong**

Full email/password + Google OAuth 2.0 implementation. Dual-token pattern: 15-minute JWT access token + 7-day refresh token in an HttpOnly cookie. Token rotation on refresh. Soft-delete aware (deletedAt). Audit log on every auth event.

| Severity | File | Issue |
|----------|------|-------|
| 🔴 Must-fix | `auth.controller.ts:176` | `secure: false` on refreshToken cookie — must be `true` in production; over HTTP the cookie is safe locally, but deploying as-is exposes the refresh token in transit |
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
| 🔴 Must-fix | `backtest.controller.ts:25` | `@Public()` on all backtest endpoints — unauthenticated users can trigger expensive external API calls (CoinGecko / AlphaVantage). Rate limits on those free-tier APIs will be exhausted quickly in class. Add `JwtAuthGuard` or at minimum IP-level throttling |
| 🟠 Should-fix | `price.service.ts:148, 268` | No timeout on `fetch()` calls to CoinGecko and AlphaVantage — a slow API response hangs the request indefinitely. Add `AbortSignal.timeout(10_000)` |
| 🟡 Minor | `price.service.ts:139, 266` | `data: any` for external API responses — type the CoinGecko and AlphaVantage shapes |

---

### AI Module — `src/ai/`

**Rating: ✅ Strong**

Sophisticated AI integration with three MCP servers (market snapshot, backtest context, portfolio diagnostics). Clean separation of concerns: `LlmService` handles OpenAI, `McpRuntimeService` handles tool discovery and execution, `PromptGeneratorService` builds the prompt.

Notable: the inspect → approve → execute pattern is correctly implemented, letting the client control which MCP tools are actually run.

| Severity | File | Issue |
|----------|------|-------|
| 🟠 Should-fix | `ai.service.ts:137–151` | `buildSuggestedActions` returns hardcoded strings regardless of the backtest result — the AI response says smart things but the action chips are static. Either remove them or generate them from the LLM output |
| 🟠 Should-fix | `mcp-runtime.service.ts` | MCP servers are expected at hardcoded provider IDs (`backtest-context`, `market-snapshot`, `portfolio-diagnostics`). If the env doesn't configure them, the runtime logs a warning but continues silently. The MCP setup is not documented in a README |
| 🟡 Minor | `llm.service.ts` | No timeout on OpenAI streaming — a stalled stream will hold the SSE connection open indefinitely |

---

### Users Module — `src/users/`

**Rating: ✅ Good**

MongoDB schema with soft delete (`deletedAt`), Google account linking, and password change with `currentPassword` verification. `PATCH /users/me`, `DELETE /users/me`, `GET /users/me` are all implemented and audited.

No open issues.

---

### Audit Module — `src/audit/`

**Rating: ✅ Good**

Logs auth events (`register`, `login`, `logout`, `refresh`, `profile_update`, `soft_delete`) and AI events (`mcp_discovery`, `mcp_tool_execution`) to MongoDB. Non-blocking — errors are caught and logged rather than bubbling up. Good pattern.

No open issues.

---

### Infrastructure & Configuration

**Rating: 🟠 Fair — one real bug**

- CORS configured with exact origin matching (not `*`) — correct
- `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — correct
- Swagger docs at `/api/docs` with Bearer auth and full response examples
- `LoggingInterceptor` on every request
- Redis cache (optional) with in-memory fallback
- Docker Compose for local dev (MongoDB + Redis)

| Severity | File | Issue |
|----------|------|-------|
| 🔴 Must-fix | `package.json` | `@nestjs/core: "^10.4.22"` while `@nestjs/common` and `@nestjs/platform-express` are at `"^11.0.1"` — mixed NestJS major versions. This is a real bug risk. Run `npm install @nestjs/core@^11` to align |
| 🟠 Should-fix | `.env` / repo root | No `.env.example` committed — new developers have no record of required env vars (`MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `OPENAI_API_KEY`, etc.) |
| 🟡 Minor | `main.ts:82` | `console.log` for startup messages — use NestJS `Logger` for consistency |

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
| 🔴 Must-fix | `src/components/FloatingAiChat.tsx` | File still exists in the source tree even though it was removed from the render tree — dead code that confuses readers and inflates the bundle |
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
| 🟠 Should-fix | No request timeout — fetch can hang indefinitely | `api-client.ts` |
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

## Score Summary

| Category | Score | Notes |
|----------|-------|-------|
| **Backend: Auth** | ✅ 8/10 | Solid dual-token + Google OAuth; fix `secure: false` cookie |
| **Backend: Backtest Engine** | ✅ 9/10 | Best part of the project; BigNumber, triggers, real data |
| **Backend: AI / MCP** | ✅ 8/10 | Cutting-edge; hardcoded suggested actions is the only real gap |
| **Backend: Users / Audit** | ✅ 9/10 | Soft delete, account linking, non-blocking audit — all correct |
| **Backend: Infrastructure** | 🟠 6/10 | Mixed NestJS v10/v11 is a real bug; missing `.env.example` |
| **Backend: Tests** | 🟡 5/10 | Core engine tested; auth/price/history not covered |
| **Frontend: Architecture** | ✅ 9/10 | Clean, modern, correct patterns |
| **Frontend: TypeScript** | 🟡 7/10 | Build passes; pervasive `any` |
| **Frontend: Performance** | 🟡 5/10 | No code splitting |
| **Frontend: Tests** | 🟡 0/10 | None installed |
| **Overall** | **7.3 / 10** | MVP-ready; fix the 4 must-fixes before sharing |

---

## Must-Fix — All Resolved ✅

| # | Where | Fix | Status |
|---|-------|-----|--------|
| 1 | `back-end/package.json` | `@nestjs/core` aligned to `^11.0.1` to match rest of NestJS; `npm install` run | ✅ Fixed |
| 2 | `auth.controller.ts` | `secure: false` → `secure: process.env.NODE_ENV === 'production'` in both `setRefreshTokenCookie` and `clearRefreshTokenCookie` | ✅ Fixed |
| 3 | `backtest.controller.ts` | `@Public()` removed; `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` added at controller level | ✅ Fixed |
| 4 | `src/components/FloatingAiChat.tsx` | File deleted | ✅ Fixed |

**Backend build is clean** — `tsc --noEmit` exits 0 after all changes.

> **Note:** `npm audit` reports 22 vulnerabilities (4 critical, 7 high) in the backend `node_modules`. Run `npm audit` in `back-end/` to review and address before any production deployment.
