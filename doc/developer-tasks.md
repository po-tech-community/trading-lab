# Trading Lab – Developer Task Assignment

This document breaks down the Trading Lab project into **assignable tasks** for developers. Each task has an ID, scope, dependencies, acceptance criteria, and implementation notes. Use it for sprint planning and task assignment.

**Reference:** [requirements.md](requirements.md) (feature descriptions for Level 0–4)

---

## Task ID Convention

- **L0** = Level 0 (Auth)
- **L1** = Level 1 (DCA Backtest MVP)
- **L2** = Level 2 (Portfolio DCA)
- **L3** = Level 3 (Triggers)
- **L4** = Level 4 (AI Adapt)
- **FE** = Frontend · **BE** = Backend

**Scope:** S = Small (≈0.5–1 day) · M = Medium (1–2 days) · L = Large (2+ days)

---

## Status Summary (2026-04-18)

| Level                | Backend           | Frontend                                          | Overall  |
| -------------------- | ----------------- | ------------------------------------------------- | -------- |
| **L0 Auth**          | Done (11/11)      | Done (6/6)                                        | Complete |
| **L1 DCA Backtest**  | Done (4/4)        | Done (3/3)                                        | Complete |
| **L2 Portfolio DCA** | Done (3/3)        | In progress 1/3 (L2-FE-1 done; L2-FE-2/3 pending) | ~67%     |
| **L3 Triggers**      | Done (6/6)        | Done (6/6)                                        | Complete |
| **L4 AI Adapt**      | Not started (0/7) | Not started (0/5)                                 | 0%       |
| **INFRA**            | Done (1/4)        | N/A                                               | 25%      |

### Recent Updates (April 18, 2026)

- **L3-BE-4**: API `/backtest/run` wired end-to-end with `triggers` DTO validation and controller pass-through.
- **L3-BE-5**: Portfolio trigger engine implemented (TP/SL sell logic in portfolio simulation).
- **L3-BE-6**: Portfolio API parity completed: supports `triggers`, returns `trades[]`, `summary.realizedProfit`, `summary.unrealizedValue`.
- **L3-FE-2**: Sell markers with TP/SL details rendered on trajectory chart tooltip.
- **L3-FE-4**: Portfolio trigger settings UI integrated and submits `triggers` to portfolio endpoint.
- **L3-FE-5**: Portfolio sell markers implemented on portfolio trajectory chart.
- **L3-FE-6**: Portfolio trade history table integrated under portfolio trajectory chart (Merged #43).

- **Reference timeline:** latest `develop` commits include #38, #39, #40, #41, #42 for Level 3 backend/frontend progression.

---

## Level 0: Authentication & User Management

_Foundation; must be done before protected features. All user-facing responses return only the current user’s data (“return only them”). No hard delete; use soft delete only. Audit and log auth actions._

**Done Legend (verified on develop - 2026-04-05):** `Done` = completed, `-` = not done yet.

| ID       | Task                                                                                                                                                                                                                                                                                                                                                            | Scope | Deps                               | Assignee    | Done | Note                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------- | ----------- | ---- | --------------------------------------------------------------------------------------------------------- |
| L0-BE-1  | **User entity & repository** – MongoDB schema for User: `id`, `email`, `firstName`, `lastName`, `passwordHash`, `avatarUrl?`, `deletedAt?` (for soft delete), `createdAt`, `updatedAt`. Repository: create, findByEmail, findById. All read queries exclude soft-deleted users (`deletedAt` null).                                                              | M     | —                                  | Hoàng       | Done | Implemented as required in schema/service.                                                                |
| L0-BE-2  | **Password hashing** – Use `bcrypt` to hash passwords on register; never store plain text. Expose `comparePassword(plain, hash)` for login.                                                                                                                                                                                                                     | S     | L0-BE-1                            | Hoàng       | Done | Hash and compare logic is in AuthService.                                                                 |
| L0-BE-3  | **JWT strategy & tokens** – Issue short-lived `accessToken` (e.g. 15m) and long-lived `refreshToken` (e.g. 7d). Store refresh token in DB or signed cookie; send **refresh token in HTTP-only cookie** on login/register/refresh. Return **accessToken** (and user) in response body. Guard validates access token on protected routes; attach user to request. | M     | L0-BE-1                            | Hoàng       | Done | End-to-end flow works with JwtStrategy and cookie refresh.                                                |
| L0-BE-4  | **POST /api/v1/auth/register** – Body: `{ firstName, lastName, email, password }`. Validate; 409 if email exists. On success: hash password, create user, return **only** `{ user: { id, email, firstName, lastName }, accessToken }` and set **refreshToken in HTTP-only cookie**.                                                                             | M     | L0-BE-2, L0-BE-3                   | Kiệt        | Done | Behavior matches API contract for current release.                                                        |
| L0-BE-5  | **POST /api/v1/auth/login** – Body: `{ email, password }`. Validate; 401 if invalid. Return **only** `{ user: { id, email, firstName, lastName }, accessToken }` and set **refreshToken in HTTP-only cookie**. Ignore soft-deleted users.                                                                                                                       | S     | L0-BE-2, L0-BE-3                   | Kiệt        | Done | Login flow and soft-delete filter are active.                                                             |
| L0-BE-6  | **POST /api/v1/auth/refresh** – Read refresh token from HTTP-only cookie (or body if no cookie). Validate; issue new accessToken (and optionally new refreshToken in cookie). Return `{ accessToken }` (and user if needed). 401 if token missing/invalid.                                                                                                      | M     | L0-BE-3                            | Quân Huỳnh  | Done | Cookie-based refresh is implemented and guarded.                                                          |
| L0-BE-7  | **GET /api/v1/users/me** – **Protected.** Return **only** current user profile (id, email, firstName, lastName, avatarUrl). 401 if no valid access token.                                                                                                                                                                                                       | S     | L0-BE-3                            | Quân Huỳnh  | Done | Accepted: endpoint works; `avatarUrl` is currently omitted in response payload.                           |
| L0-BE-8  | **PATCH /api/v1/users/me** – **Protected.** Update firstName, lastName, password (with current password check), optionally avatar. Return only updated user.                                                                                                                                                                                                    | M     | L0-BE-7                            | Quân Trương | Done | Accepted with deviation: `/users/me` updates names; password/avatar handled in alternate protected route. |
| L0-BE-9  | **Soft delete (no hard delete)** – Do not expose any endpoint that physically deletes users. Optional: “Delete my account” sets `deletedAt` (soft delete); login and queries exclude soft-deleted users. No DELETE /users/:id or equivalent.                                                                                                                    | S     | L0-BE-1, L0-BE-5                   | Quân Trương | Done | Implemented via soft delete (`deletedAt`) only.                                                           |
| L0-BE-10 | **Audit & logging** – Log auth events (register, login, logout, refresh, profile update, soft delete) with user id and timestamp. Optionally persist to an audit collection or append to a log store for support and security.                                                                                                                                  | M     | L0-BE-4, L0-BE-5, L0-BE-6, L0-BE-8 | Kha         | Done | Implemented with dedicated audit service + audit_logs persistence (includes userId and timestamp).        |
| L0-BE-11 | **OAuth with Google** – Add Google OAuth flow: redirect to Google (GET /auth/google or link), callback (GET /auth/google/callback) with code, exchange for Google profile, create or link user, issue accessToken + set refreshToken in HTTP-only cookie. Return only user + accessToken like login. Document Google Client ID/Secret in .env.                  | L     | L0-BE-3, L0-BE-1                   | Kha         | Done | Implemented end-to-end in auth controller/service; requires Google env variables to be configured.        |
| L0-FE-1  | **Login page** – Form: email, password. Call `POST /auth/login`; backend sets refresh token in HTTP-only cookie; store accessToken (memory or short-lived storage). Redirect to dashboard on success. Handle validation and API errors.                                                                                                                         | M     | —                                  | Kiệt        | Done | Integrated with API and validation, redirect works.                                                       |
| L0-FE-2  | **Sign-up page** – Form: firstName, lastName, email, password. Client validation (Zod). Call `POST /auth/register`; same token handling as login.                                                                                                                                                                                                               | M     | —                                  | Kiệt        | Done | Integrated with API and Zod validation.                                                                   |
| L0-FE-3  | **useAuth hook** – Expose `user`, `isLoading`, `isAuthenticated`, `login`, `logout`, `refetch`. On load or 401, call **POST /auth/refresh** (cookie sent automatically) to get new accessToken; if refresh fails, redirect to login.                                                                                                                            | M     | L0-FE-1                            | Kiệt        | Done | Session restore and refresh flow are active.                                                              |
| L0-FE-4  | **ProtectedRoute** – If not authenticated, redirect to login (save intended URL for post-login redirect).                                                                                                                                                                                                                                                       | S     | L0-FE-3                            | Quân Huỳnh  | Done | Redirect with intended location is implemented.                                                           |
| L0-FE-5  | **Profile / Settings page** – Display and edit firstName, lastName; change password (current + new); optional avatar. Call GET/PATCH `/users/me`. **Protected** route.                                                                                                                                                                                          | M     | L0-FE-3, L0-BE-7                   | Quân Trương | Done | Accepted with deviation: first/last name edit works; password/avatar UI is pending.                       |
| L0-FE-6  | **Login with Google (optional)** – Button “Sign in with Google” that redirects to backend /auth/google; after callback, frontend receives token/redirect and completes session like normal login.                                                                                                                                                               | S     | L0-BE-11                           | Kha         | Done | Implemented: Google button redirects to backend and callback page restores session via refresh flow.      |

**Definition of done (Level 0):** User can register, login, refresh session via cookie, access protected profile (GET/PATCH /users/me). Responses return only the current user’s data. No hard delete; soft delete only. Auth actions audited/logged. Optional: OAuth with Google. All auth APIs documented in Swagger.

---

## Level 1: DCA Backtest (MVP)

_Single-asset backtest with chart and summary._

| ID      | Task                                                                                                                                                                                                                                                                                                                                                       | Scope | Deps                                   | Assignee    | Done | Note                                                                                                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------- | ----------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1-BE-1 | **Price service** – Service that fetches historical OHLC (or close-only) from a provider (e.g. CoinGecko, CryptoCompare, or Alpha Vantage for stocks). Support at least one crypto (e.g. BTC) and one stock if possible. Input: symbol, startDate, endDate. Output: array of `{ date, close }`. Handle rate limits and missing data (return clear errors). | L     | —                                      | Quân Huỳnh  | Done | API adapters for crypto and stock are implemented.                                                                                                                                                 |
| L1-BE-2 | **Calculation engine** – Pure function (or service): given price series, `amount`, `frequency` (daily\|weekly\|monthly), compute at each buy date: units bought, cumulative units, cumulative invested, portfolio value. Return `timeline[]` and `summary` (totalInvested, currentValue, totalReturnPercentage, totalHoldings).                            | L     | L1-BE-1                                | Kiệt        | Done | Core DCA math and unit tests exist.                                                                                                                                                                |
| L1-BE-3 | **POST /api/v1/backtest/run** – Body: `symbol`, `amount`, `frequency`, `startDate`, `endDate`. Validate (amount > 0, endDate > startDate, symbol supported). Call price service + calculation engine. Return `{ summary, timeline }`. Error handling for invalid symbol or insufficient data.                                                              | M     | L1-BE-2                                | Hoàng       | Done | Implemented in `BacktestController` (`@Post('run')`) with DTO + service wiring.                                                                                                                    |
| L1-BE-4 | **Error handling & validation** – Use DTOs (class-validator) for backtest request. Return 400 with clear messages for invalid input; 502/503 if price provider fails.                                                                                                                                                                                      | S     | L1-BE-3                                | ----        | Done | Bypassed as a standalone task: error handling is already covered by current global exception setup and accepted for this phase.                                                                    |
| L1-FE-1 | **Backtest config form** – Fields: asset (dropdown or search), amount (USD), frequency (daily/weekly/monthly), start date, end date. Use `react-hook-form` + Zod. Validate amount > 0, end > start. Submit calls `POST /backtest/run`.                                                                                                                     | M     | L0-FE-3 (optional: require auth later) | Hoàng       | Done | Implemented with `react-hook-form` + Zod and submits via `runBacktest` API client.                                                                                                                 |
| L1-FE-2 | **Summary widgets** – After run: display Total Invested, Current Value, Total Return (%), total holdings (optional). Use clear typography and layout (e.g. cards).                                                                                                                                                                                         | S     | L1-FE-1                                | Quân Trương | Done | Summary cards are bound to API response (`summary`) after each run.                                                                                                                                |
| L1-FE-3 | **Equity / growth chart** – Line chart (e.g. Recharts): X = date, Y = portfolio value (and optionally "invested so far" line). Data from `timeline`. Responsive; show tooltip with date and value.                                                                                                                                                         | M     | L1-FE-1                                | Mai Kha     | Done | Merged #28: LineChart with portfolio value + invested basis lines. Tooltip shows date, Portfolio value, Total invested, Coin price, Unrealized profit. Legend and comments refactored for clarity. |

**Definition of done (Level 1):** User can run a single-asset DCA backtest and see summary + equity chart. API documented in Swagger.

---

## Level 2: Portfolio DCA

_Multiple assets with weights; allocation and per-asset breakdown._

| ID      | Task                                                                                                                                                                                                                                                                  | Scope | Deps             | Assignee   | Done | Note                                                                                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------- | ---------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L2-BE-1 | **Multi-symbol price service** – Extend (or wrap) price service to accept multiple symbols; batch requests where the API allows. Return a map or array of price series keyed by symbol.                                                                               | M     | L1-BE-1          | Kiệt       | Done | `PriceService.fetchPricesForSymbols` – parallel per symbol; keyed by uppercase symbol.                                                                                        |
| L2-BE-2 | **Portfolio calculation engine** – For each period: split `totalAmount` by weights across assets, compute units per asset; aggregate portfolio value over time. Output: same `timeline` (portfolio value) plus per-asset breakdown (holdings, value, ROI per symbol). | L     | L2-BE-1, L1-BE-2 | Kiệt       | Done | `runPortfolioDcaBacktest` + `CalculationService.runPortfolioDcaBacktest`; weights must sum to 100%.                                                                           |
| L2-BE-3 | **POST /api/v1/backtest/portfolio** – Body: `assets: [{ symbol, weight }]`, `totalAmount`, `frequency`, `startDate`, `endDate`. Validate weights sum to 100. Return `{ summary, assetBreakdown, timeline }`.                                                          | M     | L2-BE-2          | Quân Huỳnh | Done | Implemented in `BacktestController` (`@Post('portfolio')`); response includes `summary`, `timeline`, `assetBreakdown`.                                                        |
| L2-FE-1 | **Asset list component** – Dynamic list: add/remove rows; each row = symbol selector + weight (%). Sum of weights must equal 100%; show validation error and block submit until valid.                                                                                | M     | L1-FE-1          | Quân Huỳnh | Done | Merged #26: `AssetList.tsx` (283 lines) with add/remove, weight validation, visual feedback bar; integrated in `PortfolioConfigCard.tsx` (298 lines) and `PortfolioPage.tsx`. |
| L2-FE-2 | **Composition pie chart** – Pie chart of initial allocation (weights). Use same chart library as project (e.g. Recharts).                                                                                                                                             | S     | L2-FE-1          | Hoàng      | -    | Not started. Awaiting L2-FE-3 for full portfolio page integration.                                                                                                            |
| L2-FE-3 | **Portfolio results view** – Reuse/adapt summary + timeline chart for portfolio. Add per-asset breakdown: table or small bars for each symbol's ROI/contribution.                                                                                                     | M     | L2-BE-3, L2-FE-1 | Hoàng      | -    | Not started. Form integration (L2-FE-1) complete; results display placeholder exists but needs chart rendering and per-asset breakdown table.                                 |

**Definition of done (Level 2):** User can run a multi-asset DCA backtest with weights summing to 100%, see allocation pie chart and per-asset performance.

---

## Level 3: Smart Triggers (Take Profit / Stop Loss)

_Sell logic and trade history._

### Level 3 Explained (Simple Flow)

Level 3 adds **auto-sell behavior** on top of normal DCA buys.

1. System keeps buying periodically as before (daily/weekly/monthly).
2. At each timeline point, system checks unrealized PnL (%).
3. If PnL reaches trigger conditions, system executes a sell action:
   - **Take Profit (TP):** sell when gain reaches threshold.
   - **Stop Loss (SL):** sell when loss reaches threshold.
4. Every sell is stored as a trade event (date, type, price, units, realized profit/loss).
5. API returns both:
   - Updated portfolio timeline (for chart)
   - Trade history + realized/unrealized summary (for table/cards)

In short: **Level 1/2 only simulates buy-and-hold DCA**, while **Level 3 simulates active risk management with automatic sells**.

| ID      | Task                                                                                                                                                                                                                                                                                     | Scope | Deps                               | Assignee                            | Done |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------- | ----------------------------------- | ---- |
| L3-BE-1 | **Cost basis & threshold tracking** – In the simulation loop, track cost basis per unit (or total) and current value. Compute unrealized P&amp;L % at each step.                                                                                                                         | M     | L1-BE-2 (and L2-BE-2 if portfolio) | Kha                                 | Done |
| L3-BE-2 | **Sell logic** – When unrealized profit % ≥ takeProfit threshold (or loss % ≥ stopLoss), execute sell: convert `sellAction` % of holdings to USD; record trade (date, type, price, units, profit). Update cash balance and holdings. Support both TP and SL; optional: sell 100% or 50%. | L     | L3-BE-1                            | Kha                                 | Done |
| L3-BE-3 | **Extended backtest response** – Add to response: `summary.realizedProfit`, `summary.unrealizedValue`, `trades[]` (date, type, price, profit, etc.). Keep existing `timeline` for chart.                                                                                                 | M     | L3-BE-2                            | Quân Trương (implemented by Evelyn) | Done |
| L3-BE-4 | **API extension** – Extend `POST /api/v1/backtest/run` (and optionally portfolio) body with `triggers: { takeProfit: { threshold, sellAction }, stopLoss: { threshold, sellAction } }`. Validate thresholds and sellAction in range.                                                     | S     | L3-BE-3                            | Quân Trương                         | Done |
| L3-BE-5 | **Portfolio trigger engine** – Apply TP/SL sell logic to portfolio simulation (`POST /backtest/portfolio`): evaluate unrealized PnL at each step, execute configured sellAction, and keep timeline consistent after sells.                                                               | L     | L2-BE-2, L3-BE-2                   | Kha                                 | Done |
| L3-BE-6 | **Portfolio trigger response/API parity** – Extend portfolio request/response with `triggers`, `trades[]`, `summary.realizedProfit`, `summary.unrealizedValue`; validate trigger ranges and keep single-asset contracts unchanged.                                                       | M     | L3-BE-5, L3-BE-4                   | Quân Trương                         | Done |
| L3-FE-1 | **Trigger settings UI** – Toggle or section: enable Take Profit (threshold %, sell %), enable Stop Loss (threshold %, sell %). Include in same form as backtest config.                                                                                                                  | S     | L1-FE-1                            | Kiệt                                | Done |
| L3-FE-2 | **Sell markers on chart** – On the equity chart, add markers (dots or vertical lines) at each sell date; tooltip shows trade details.                                                                                                                                                    | M     | L1-FE-3, L3-BE-3                   | Quân Huỳnh                          | Done |
| L3-FE-3 | **Trade history table** – Table below chart: columns e.g. Date, Type (TP/SL), Price, Amount, Realized Profit. Data from `trades`.                                                                                                                                                        | S     | L3-BE-3                            | Hoàng                               | Done |
| L3-FE-4 | **Portfolio trigger settings UI** – Add TP/SL controls to portfolio config form and submit `triggers` to `POST /backtest/portfolio` with same validation UX as single-asset.                                                                                                             | S     | L2-FE-1, L3-FE-1, L3-BE-6          | Kiệt                                | Done |
| L3-FE-5 | **Portfolio sell markers** – Render TP/SL sell markers on portfolio trajectory chart with tooltip details from `trades[]`.                                                                                                                                                               | M     | L2-FE-3, L3-BE-6, L3-FE-2          | Quân Huỳnh                          | Done |
| L3-FE-6 | **Portfolio trade history table** – Show portfolio trade history (Date, TP/SL, Price, Amount, Realized Profit) under the portfolio chart.                                                                                                                                                | S     | L2-FE-3, L3-BE-6, L3-FE-3          | Kiệt                                | Done |

**Definition of done (Level 3):** User can set TP/SL for single-asset (and portfolio where enabled), run backtest, see realized vs unrealized in summary, sell markers on chart, and trade history table.

---

## Level 4: AI Adapt

_OpenAI integration and chat with backtest context._

Level 4 concept and implementation note: [level-4-ai-mcp-implementation-guide.md](level-4-ai-mcp-implementation-guide.md)

### Level 4 Delivery Flow (What to build first)

Use this order to deliver product value early:

1. **Step 1: Basic AI answer from current backtest context**
   - Implement one-shot AI response first (`/ai/analyze`) with summary + trades context.
   - Goal: user can ask “why result is good/bad” and get grounded explanation.
2. **Step 2: Chat continuity with memory**
   - Add chat session/history so follow-up questions work.
   - Goal: user can ask compare/follow-up questions without retyping context.
3. **Step 3: MCP setup (registry + policy + trace)**
   - Add tool discovery, permission policy, and execution logs.
   - Goal: answers become inspectable and safer.
4. **Step 4: MCP feature tools + UI evidence cards**
   - Add concrete tools (market/risk/diagnostics) and show results in chat UI.
   - Goal: assistant provides evidence-backed recommendations instead of generic text.

### Level 4 User Question Examples

- “Why did this run underperform?”
- “Which asset contributed most to drawdown?”
- “Is my stop-loss too aggressive?”
- “What changed after I adjusted threshold?”
- “What should I test next: weekly frequency or lower sellAction?”

| ID      | Task                                                                                                                                                                                                                                                        | Scope | Deps             | Assignee    | Done |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------- | ----------- | ---- |
| L4-BE-1 | **OpenAI (or Anthropic) integration** – Install SDK; create a service that accepts messages and returns assistant reply. Use env var for API key. Handle rate limits and errors.                                                                            | M     | —                | Kiệt       | Done   |
| L4-BE-2 | **Prompt generator** – Convert backtest result (summary, timeline snippet, trades if any) into a short text context for the LLM. Include: strategy params, key metrics, optional recent timeline points.                                                    | M     | L1-BE-2, L4-BE-1 | Kiệt        | Done    |
| L4-BE-3 | **POST /api/v1/ai/analyze** – Body: `backtestId` (or raw backtest result) and `userQuery`. Build context with prompt generator; call LLM with system prompt (e.g. “You are a DCA strategy advisor”) + user message. Return `{ advice, suggestedActions? }`. | M     | L4-BE-2          | Kiệt  | Done    |
| L4-BE-4 | **Chat session / history** – Store and retrieve conversation per backtest/session so user can ask follow-ups with same context.                                                                                                                             | M     | L4-BE-3          | Quân Trương | -    |
| L4-BE-7 | **Backtest context persistence for AI** – Persist a compact backtest snapshot (config + summary + key trades, optional sampled timeline) or a backtest result reference id so AI chat can bind to a stable run instead of fire-and-forget payload only.     | M     | L3-BE-6, L4-BE-3 | Quân Trương | -    |
| L4-BE-5 | **MCP setup & registry** – Set up MCP client runtime, provider registry, tool discovery, environment configuration, and permission policy (allow/deny list + audit metadata). Include timeout/retry defaults and fallback strategy.                         | M     | L4-BE-3          | Kha         | -    |
| L4-BE-6 | **MCP domain tools integration** – Add concrete MCP-powered tools for AI Advisor (market snapshot, portfolio diagnostics, risk checks), map tool outputs into model context, and return tool-backed evidence in final advice payload.                       | L     | L4-BE-5          | Kha         | -    |
| L4-FE-1 | **AI Advisor panel** – Slide-over or modal: “Consult AI Advisor” opens panel. Show current backtest summary in panel header or first message.                                                                                                               | S     | L1-FE-2, L1-FE-3 | Quân H        | -    |
| L4-FE-2 | **Chat UI** – Input for user message; display assistant reply with markdown rendering. Loading state while request in flight. Optional: stream response for better UX.                                                                                      | M     | L4-BE-3          | Quân Huỳnh  | -    |
| L4-FE-3 | **Suggested actions** – If API returns `suggestedActions`, show as chips or buttons (e.g. “Increase frequency to Weekly”) that can prefill the form or scroll to config.                                                                                    | S     | L4-FE-2          | Quân H        | -    |
| L4-FE-4 | **MCP setup UX (approval + trace)** – Add MCP execution panel in chat to show tool name/purpose/input preview, approve/deny sensitive actions, and display tool execution status/errors.                                                                    | M     | L4-BE-5, L4-FE-2 | Hoàng       | -    |
| L4-FE-5 | **MCP feature UX (result cards)** – Render structured MCP outputs as reusable cards/widgets (market snapshot, risk check, allocation diagnostics) and connect them with suggested actions in chat flow.                                                     | M     | L4-BE-6, L4-FE-4 | Hoàng       | -    |

**Definition of done (Level 4):** User can open AI Advisor from results, ask a question, get markdown advice and optional suggested actions. MCP is delivered in two phases: setup (registry/policy/approval trace) and feature (domain tool outputs rendered as cards), producing grounded tool-backed analysis in UI.

---

## Cross-Cutting & Infrastructure

| ID      | Task                                                                                                                                       | Scope | Deps                              | Assignee | Done |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----- | --------------------------------- | -------- | ---- |
| INFRA-1 | **Swagger** – Document all API endpoints (auth, backtest, portfolio, AI). Include request/response examples and auth requirement (Bearer). | M     | L0-BE, L1-BE, L2-BE, L3-BE, L4-BE | Dev 5    | -    |
| INFRA-2 | **Docker** – Dockerfile(s) for back-end (and frontend if needed). docker-compose for back-end + MongoDB + Redis.                           | M     | —                                 | Dev 5    | -    |
| INFRA-3 | **Redis** (optional) – Use Redis for caching price data or session if specified in tech stack.                                             | S     | INFRA-2                           | Dev 4    | Done |
| INFRA-4 | **Error format** – Consistent API error shape (e.g. `{ statusCode, message, error }`). Use filters/exception layer in NestJS.              | S     | —                                 | Dev 2    | -    |

---

## Suggested Sprint Order

1. **Sprint 0 (Foundation):** L0-BE-1 → L0-BE-2 → L0-BE-3 → L0-BE-4, L0-BE-5, L0-BE-6 (refresh), L0-BE-7, L0-BE-8, L0-BE-9 (soft delete), L0-BE-10 (audit) · L0-FE-1, L0-FE-2, L0-FE-3, L0-FE-4, L0-FE-5. Optional: L0-BE-11 (OAuth Google), L0-FE-6.
2. **Sprint 1 (MVP):** L1-BE-1 → L1-BE-2 → L1-BE-3 · L1-FE-1, L1-FE-2, L1-FE-3.
3. **Sprint 2 (Portfolio):** L2-BE-1 → L2-BE-2 → L2-BE-3 · L2-FE-1, L2-FE-2, L2-FE-3.
4. **Sprint 3 (Triggers):** L3-BE-1 → L3-BE-2 → L3-BE-3, L3-BE-4 → L3-BE-5, L3-BE-6 · L3-FE-1, L3-FE-2, L3-FE-3 → L3-FE-4, L3-FE-5, L3-FE-6.
5. **Sprint 4 (AI Adapt):** L4-BE-1 → L4-BE-2 → L4-BE-3 → L4-BE-4 → L4-BE-7 → L4-BE-5 (MCP setup) → L4-BE-6 (MCP features) · L4-FE-1, L4-FE-2, L4-FE-3, L4-FE-4 (MCP setup UX), L4-FE-5 (MCP feature UX).

INFRA tasks can be scheduled in parallel or in Sprint 0/1.

**5 developers, each with backend + frontend:** Assignees in the tables above (Dev 1–5) are set so that **every developer has both BE and FE tasks** across the project. Schedule work by sprint so that **each week every developer has at least one task** (no one idle). Example per sprint: **Sprint 0** — Dev 1–5 each have L0 BE + FE. **Sprint 1** — Dev 1–3: L1 BE/FE; Dev 4: L1-FE-3; Dev 5: INFRA-2. **Sprint 2** — Dev 1–3: L2 BE/FE; Dev 4: INFRA-3; Dev 5: INFRA-1 (docs). **Sprint 3** — Dev 1–4: L3 BE/FE; Dev 5: INFRA-1. **Sprint 4** — Dev 1: L4-BE-2 + L4-FE-1, Dev 2: L4-FE-2 + L4-FE-4 + L4-FE-5 (MCP setup/feature UX), Dev 3: L4-BE-4 + L4-FE-3, Dev 4: L4-BE-1 + L4-BE-5 + L4-BE-6 (MCP setup/feature BE), Dev 5: L4-BE-3 + INFRA-1 updates for AI/MCP API docs. Replace _Dev 1_ … _Dev 5_ with real names when assigning.

**Optional (Phase 2):** Strategy CRUD — save/load/edit/delete strategies (entity, endpoints, "My strategies" UI). Not required for first release.

---

## API Quick Reference (for implementers)

- **Auth:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` (cookie), `GET /api/v1/users/me` (protected), `PATCH /api/v1/users/me` (protected). Optional: `GET /api/v1/auth/google`, `GET /api/v1/auth/google/callback` (OAuth). Refresh token in HTTP-only cookie; responses return only current user.
- **Backtest:** `POST /api/v1/backtest/run` (single), `POST /api/v1/backtest/portfolio` (multi-asset); extend run with `triggers` in Level 3.
- **AI:** `POST /api/v1/ai/analyze`.

Feature descriptions: [requirements.md](requirements.md). Request/response shapes are in the task tables above and in the API specs referenced there.
