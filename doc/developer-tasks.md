# Trading Lab – Developer Task Assignment

This document breaks down the Trading Lab project into **assignable tasks** for developers. Each task has an ID, scope, dependencies, acceptance criteria, and implementation notes. Use it for sprint planning and task assignment.

**Reference:** [requirements.md](requirements.md) (feature descriptions for Level 0–4)

---

## Task ID Convention

- **L0** = Level 0 (Auth)
- **L1** = Level 1 (DCA Backtest MVP)
- **L2** = Level 2 (Portfolio DCA)
- **L3** = Level 3 (Triggers)
- **L4** = Level 4 (AI Advisor)
- **FE** = Frontend · **BE** = Backend

**Scope:** S = Small (≈0.5–1 day) · M = Medium (1–2 days) · L = Large (2+ days)

---
## Level 0: Authentication & User Management

*Foundation; must be done before protected features. All user-facing responses return only the current user’s data (“return only them”). No hard delete; use soft delete only. Audit and log auth actions.*

| ID | Task | Scope | Deps | Assignee |
|----|------|--------|------|----------|
| L0-BE-1 | **User entity & repository** – MongoDB schema for User: `id`, `email`, `firstName`, `lastName`, `passwordHash`, `avatarUrl?`, `deletedAt?` (for soft delete), `createdAt`, `updatedAt`. Repository: create, findByEmail, findById. All read queries exclude soft-deleted users (`deletedAt` null). | M | — | Hoàng |
| L0-BE-2 | **Password hashing** – Use `bcrypt` to hash passwords on register; never store plain text. Expose `comparePassword(plain, hash)` for login. | S | L0-BE-1 | Hoàng |
| L0-BE-3 | **JWT strategy & tokens** – Issue short-lived `accessToken` (e.g. 15m) and long-lived `refreshToken` (e.g. 7d). Store refresh token in DB or signed cookie; send **refresh token in HTTP-only cookie** on login/register/refresh. Return **accessToken** (and user) in response body. Guard validates access token on protected routes; attach user to request. | M | L0-BE-1 | Hoàng |
| L0-BE-4 | **POST /api/v1/auth/register** – Body: `{ firstName, lastName, email, password }`. Validate; 409 if email exists. On success: hash password, create user, return **only** `{ user: { id, email, firstName, lastName }, accessToken }` and set **refreshToken in HTTP-only cookie**. | M | L0-BE-2, L0-BE-3 | Kiệt |
| L0-BE-5 | **POST /api/v1/auth/login** – Body: `{ email, password }`. Validate; 401 if invalid. Return **only** `{ user: { id, email, firstName, lastName }, accessToken }` and set **refreshToken in HTTP-only cookie**. Ignore soft-deleted users. | S | L0-BE-2, L0-BE-3 | Kiệt |
| L0-BE-6 | **POST /api/v1/auth/refresh** – Read refresh token from HTTP-only cookie (or body if no cookie). Validate; issue new accessToken (and optionally new refreshToken in cookie). Return `{ accessToken }` (and user if needed). 401 if token missing/invalid. | M | L0-BE-3 | Quân Huỳnh |
| L0-BE-7 | **GET /api/v1/users/me** – **Protected.** Return **only** current user profile (id, email, firstName, lastName, avatarUrl). 401 if no valid access token. | S | L0-BE-3 | Quân Huỳnh |
| L0-BE-8 | **PATCH /api/v1/users/me** – **Protected.** Update firstName, lastName, password (with current password check), optionally avatar. Return only updated user. | M | L0-BE-7 | Quân Trương |
| L0-BE-9 | **Soft delete (no hard delete)** – Do not expose any endpoint that physically deletes users. Optional: “Delete my account” sets `deletedAt` (soft delete); login and queries exclude soft-deleted users. No DELETE /users/:id or equivalent. | S | L0-BE-1, L0-BE-5 | Quân Trương |
| L0-BE-10 | **Audit & logging** – Log auth events (register, login, logout, refresh, profile update, soft delete) with user id and timestamp. Optionally persist to an audit collection or append to a log store for support and security. | M | L0-BE-4, L0-BE-5, L0-BE-6, L0-BE-8 | Kha |
| L0-BE-11 | **OAuth with Google** – Add Google OAuth flow: redirect to Google (GET /auth/google or link), callback (GET /auth/google/callback) with code, exchange for Google profile, create or link user, issue accessToken + set refreshToken in HTTP-only cookie. Return only user + accessToken like login. Document Google Client ID/Secret in .env. | L | L0-BE-3, L0-BE-1 | Kha |
| L0-FE-1 | **Login page** – Form: email, password. Call `POST /auth/login`; backend sets refresh token in HTTP-only cookie; store accessToken (memory or short-lived storage). Redirect to dashboard on success. Handle validation and API errors. | M | — | Kiệt |
| L0-FE-2 | **Sign-up page** – Form: firstName, lastName, email, password. Client validation (Zod). Call `POST /auth/register`; same token handling as login. | M | — | Kiệt |
| L0-FE-3 | **useAuth hook** – Expose `user`, `isLoading`, `isAuthenticated`, `login`, `logout`, `refetch`. On load or 401, call **POST /auth/refresh** (cookie sent automatically) to get new accessToken; if refresh fails, redirect to login. | M | L0-FE-1 | Kiệt |
| L0-FE-4 | **ProtectedRoute** – If not authenticated, redirect to login (save intended URL for post-login redirect). | S | L0-FE-3 | Quân Huỳnh |
| L0-FE-5 | **Profile / Settings page** – Display and edit firstName, lastName; change password (current + new); optional avatar. Call GET/PATCH `/users/me`. **Protected** route. | M | L0-FE-3, L0-BE-7 | Quân Trương |
| L0-FE-6 | **Login with Google (optional)** – Button “Sign in with Google” that redirects to backend /auth/google; after callback, frontend receives token/redirect and completes session like normal login. | S | L0-BE-11 | Kha |

**Definition of done (Level 0):** User can register, login, refresh session via cookie, access protected profile (GET/PATCH /users/me). Responses return only the current user’s data. No hard delete; soft delete only. Auth actions audited/logged. Optional: OAuth with Google. All auth APIs documented in Swagger.

---

## Level 1: DCA Backtest (MVP)

*Single-asset backtest with chart and summary.*

| ID | Task | Scope | Deps | Assignee |
|----|------|--------|------|----------|
| L1-BE-1 | **Price service** – Service that fetches historical OHLC (or close-only) from a provider (e.g. CoinGecko, CryptoCompare, or Alpha Vantage for stocks). Support at least one crypto (e.g. BTC) and one stock if possible. Input: symbol, startDate, endDate. Output: array of `{ date, close }`. Handle rate limits and missing data (return clear errors). | L | — | Dev 3 |
| L1-BE-2 | **Calculation engine** – Pure function (or service): given price series, `amount`, `frequency` (daily\|weekly\|monthly), compute at each buy date: units bought, cumulative units, cumulative invested, portfolio value. Return `timeline[]` and `summary` (totalInvested, currentValue, totalReturnPercentage, totalHoldings). | L | L1-BE-1 | Dev 3 |
| L1-BE-3 | **POST /api/v1/backtest/run** – Body: `symbol`, `amount`, `frequency`, `startDate`, `endDate`. Validate (amount > 0, endDate > startDate, symbol supported). Call price service + calculation engine. Return `{ summary, timeline }`. Error handling for invalid symbol or insufficient data. | M | L1-BE-2 | Dev 1 |
| L1-BE-4 | **Error handling & validation** – Use DTOs (class-validator) for backtest request. Return 400 with clear messages for invalid input; 502/503 if price provider fails. | S | L1-BE-3 | Dev 2 |
| L1-FE-1 | **Backtest config form** – Fields: asset (dropdown or search), amount (USD), frequency (daily/weekly/monthly), start date, end date. Use `react-hook-form` + Zod. Validate amount > 0, end > start. Submit calls `POST /backtest/run`. | M | L0-FE-3 (optional: require auth later) | Dev 1 |
| L1-FE-2 | **Summary widgets** – After run: display Total Invested, Current Value, Total Return (%), total holdings (optional). Use clear typography and layout (e.g. cards). | S | L1-FE-1 | Dev 3 |
| L1-FE-3 | **Equity / growth chart** – Line chart (e.g. Recharts): X = date, Y = portfolio value (and optionally “invested so far” line). Data from `timeline`. Responsive; show tooltip with date and value. | M | L1-FE-1 | Dev 2 |

**Definition of done (Level 1):** User can run a single-asset DCA backtest and see summary + equity chart. API documented in Swagger.

---

## Level 2: Portfolio DCA

*Multiple assets with weights; allocation and per-asset breakdown.*

| ID | Task | Scope | Deps | Assignee |
|----|------|--------|------|----------|
| L2-BE-1 | **Multi-symbol price service** – Extend (or wrap) price service to accept multiple symbols; batch requests where the API allows. Return a map or array of price series keyed by symbol. | M | L1-BE-1 | Dev 3 |
| L2-BE-2 | **Portfolio calculation engine** – For each period: split `totalAmount` by weights across assets, compute units per asset; aggregate portfolio value over time. Output: same `timeline` (portfolio value) plus per-asset breakdown (holdings, value, ROI per symbol). | L | L2-BE-1, L1-BE-2 | Dev 1 |
| L2-BE-3 | **POST /api/v1/backtest/portfolio** – Body: `assets: [{ symbol, weight }]`, `totalAmount`, `frequency`, `startDate`, `endDate`. Validate weights sum to 100. Return `{ summary, assetBreakdown, timeline }`. | M | L2-BE-2 | Dev 2 |
| L2-FE-1 | **Asset list component** – Dynamic list: add/remove rows; each row = symbol selector + weight (%). Sum of weights must equal 100%; show validation error and block submit until valid. | M | L1-FE-1 | Dev 1 |
| L2-FE-2 | **Composition pie chart** – Pie chart of initial allocation (weights). Use same chart library as project (e.g. Recharts). | S | L2-FE-1 | Dev 2 |
| L2-FE-3 | **Portfolio results view** – Reuse/adapt summary + timeline chart for portfolio. Add per-asset breakdown: table or small bars for each symbol’s ROI/contribution. | M | L2-BE-3, L2-FE-1 | Dev 3 |

**Definition of done (Level 2):** User can run a multi-asset DCA backtest with weights summing to 100%, see allocation pie chart and per-asset performance.

---

## Level 3: Smart Triggers (Take Profit / Stop Loss)

*Sell logic and trade history.*

| ID | Task | Scope | Deps | Assignee |
|----|------|--------|------|----------|
| L3-BE-1 | **Cost basis & threshold tracking** – In the simulation loop, track cost basis per unit (or total) and current value. Compute unrealized P&amp;L % at each step. | M | L1-BE-2 (and L2-BE-2 if portfolio) | Dev 1 |
| L3-BE-2 | **Sell logic** – When unrealized profit % ≥ takeProfit threshold (or loss % ≥ stopLoss), execute sell: convert `sellAction` % of holdings to USD; record trade (date, type, price, units, profit). Update cash balance and holdings. Support both TP and SL; optional: sell 100% or 50%. | L | L3-BE-1 | Dev 2 |
| L3-BE-3 | **Extended backtest response** – Add to response: `summary.realizedProfit`, `summary.unrealizedValue`, `trades[]` (date, type, price, profit, etc.). Keep existing `timeline` for chart. | M | L3-BE-2 | Dev 3 |
| L3-BE-4 | **API extension** – Extend `POST /api/v1/backtest/run` (and optionally portfolio) body with `triggers: { takeProfit: { threshold, sellAction }, stopLoss: { threshold, sellAction } }`. Validate thresholds and sellAction in range. | S | L3-BE-3 | Dev 4 |
| L3-FE-1 | **Trigger settings UI** – Toggle or section: enable Take Profit (threshold %, sell %), enable Stop Loss (threshold %, sell %). Include in same form as backtest config. | S | L1-FE-1 | Dev 1 |
| L3-FE-2 | **Sell markers on chart** – On the equity chart, add markers (dots or vertical lines) at each sell date; tooltip shows trade details. | M | L1-FE-3, L3-BE-3 | Dev 2 |
| L3-FE-3 | **Trade history table** – Table below chart: columns e.g. Date, Type (TP/SL), Price, Amount, Realized Profit. Data from `trades`. | S | L3-BE-3 | Dev 3 |

**Definition of done (Level 3):** User can set TP/SL, run backtest, see realized vs unrealized in summary, sell markers on chart, and trade history table.

---

## Level 4: AI Advisor

*OpenAI integration and chat with backtest context.*

| ID | Task | Scope | Deps | Assignee |
|----|------|--------|------|----------|
| L4-BE-1 | **OpenAI (or Anthropic) integration** – Install SDK; create a service that accepts messages and returns assistant reply. Use env var for API key. Handle rate limits and errors. | M | — | Dev 4 |
| L4-BE-2 | **Prompt generator** – Convert backtest result (summary, timeline snippet, trades if any) into a short text context for the LLM. Include: strategy params, key metrics, optional recent timeline points. | M | L1-BE-2, L4-BE-1 | Dev 1 |
| L4-BE-3 | **POST /api/v1/ai/analyze** – Body: `backtestId` (or raw backtest result) and `userQuery`. Build context with prompt generator; call LLM with system prompt (e.g. “You are a DCA strategy advisor”) + user message. Return `{ advice, suggestedActions? }`. | M | L4-BE-2 | Dev 5 |
| L4-BE-4 | **Chat session / history** (optional) – Store or manage conversation per backtest/session so user can ask follow-ups with same context. | M | L4-BE-3 | Dev 3 |
| L4-FE-1 | **AI Advisor panel** – Slide-over or modal: “Consult AI Advisor” opens panel. Show current backtest summary in panel header or first message. | S | L1-FE-2, L1-FE-3 | Dev 1 |
| L4-FE-2 | **Chat UI** – Input for user message; display assistant reply with markdown rendering. Loading state while request in flight. Optional: stream response for better UX. | M | L4-BE-3 | Dev 2 |
| L4-FE-3 | **Suggested actions** – If API returns `suggestedActions`, show as chips or buttons (e.g. “Increase frequency to Weekly”) that can prefill the form or scroll to config. | S | L4-FE-2 | Dev 5 |

**Definition of done (Level 4):** User can open AI Advisor from results, ask a question, get markdown advice and optional suggested actions.

---

## Cross-Cutting & Infrastructure

| ID | Task | Scope | Deps | Assignee |
|----|------|--------|------|----------|
| INFRA-1 | **Swagger** – Document all API endpoints (auth, backtest, portfolio, AI). Include request/response examples and auth requirement (Bearer). | M | L0-BE, L1-BE, L2-BE, L3-BE, L4-BE | Dev 5 |
| INFRA-2 | **Docker** – Dockerfile(s) for back-end (and frontend if needed). docker-compose for back-end + MongoDB + Redis. | M | — | Dev 5 |
| INFRA-3 | **Redis** (optional) – Use Redis for caching price data or session if specified in tech stack. | S | INFRA-2 | Dev 4 |
| INFRA-4 | **Error format** – Consistent API error shape (e.g. `{ statusCode, message, error }`). Use filters/exception layer in NestJS. | S | — | Dev 2 |

---

## Suggested Sprint Order

1. **Sprint 0 (Foundation):** L0-BE-1 → L0-BE-2 → L0-BE-3 → L0-BE-4, L0-BE-5, L0-BE-6 (refresh), L0-BE-7, L0-BE-8, L0-BE-9 (soft delete), L0-BE-10 (audit) · L0-FE-1, L0-FE-2, L0-FE-3, L0-FE-4, L0-FE-5. Optional: L0-BE-11 (OAuth Google), L0-FE-6.
2. **Sprint 1 (MVP):** L1-BE-1 → L1-BE-2 → L1-BE-3 · L1-FE-1, L1-FE-2, L1-FE-3.
3. **Sprint 2 (Portfolio):** L2-BE-1 → L2-BE-2 → L2-BE-3 · L2-FE-1, L2-FE-2, L2-FE-3.
4. **Sprint 3 (Triggers):** L3-BE-1 → L3-BE-2 → L3-BE-3, L3-BE-4 · L3-FE-1, L3-FE-2, L3-FE-3.
5. **Sprint 4 (AI):** L4-BE-1 → L4-BE-2 → L4-BE-3 · L4-FE-1, L4-FE-2, L4-FE-3.

INFRA tasks can be scheduled in parallel or in Sprint 0/1.

**5 developers, each with backend + frontend:** Assignees in the tables above (Dev 1–5) are set so that **every developer has both BE and FE tasks** across the project. Schedule work by sprint so that **each week every developer has at least one task** (no one idle). Example per sprint: **Sprint 0** — Dev 1–5 each have L0 BE + FE. **Sprint 1** — Dev 1–3: L1 BE/FE; Dev 4: L1-FE-3; Dev 5: INFRA-2. **Sprint 2** — Dev 1–3: L2 BE/FE; Dev 4: INFRA-3; Dev 5: INFRA-1 (docs). **Sprint 3** — Dev 1–4: L3 BE/FE; Dev 5: INFRA-1. **Sprint 4** — Dev 1–5: L4 BE/FE. Replace *Dev 1* … *Dev 5* with real names when assigning.

**Optional (Phase 2):** Strategy CRUD — save/load/edit/delete strategies (entity, endpoints, "My strategies" UI). Not required for first release.

---

## API Quick Reference (for implementers)

- **Auth:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` (cookie), `GET /api/v1/users/me` (protected), `PATCH /api/v1/users/me` (protected). Optional: `GET /api/v1/auth/google`, `GET /api/v1/auth/google/callback` (OAuth). Refresh token in HTTP-only cookie; responses return only current user.
- **Backtest:** `POST /api/v1/backtest/run` (single), `POST /api/v1/backtest/portfolio` (multi-asset); extend run with `triggers` in Level 3.
- **AI:** `POST /api/v1/ai/analyze`.

Feature descriptions: [requirements.md](requirements.md). Request/response shapes are in the task tables above and in the API specs referenced there.
