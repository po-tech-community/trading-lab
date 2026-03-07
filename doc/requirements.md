# Trading Lab Technical Documentation

Welcome to **Trading Lab**. This document is designed to help students and developers understand the core concepts, requirements, and technical roadmap of the project.

---

## 1. Core Concepts

If you are new to finance, here are the two most important terms to understand:

### A. Dollar Cost Averaging (DCA)
**DCA** is an investment strategy where you invest a **fixed amount of money** at **regular intervals** (e.g., $100 every Monday), regardless of the asset's price.

*   **Why use it?** It removes emotion from investing. You buy more when prices are low and less when prices are high.
*   **Alternative:** "Market Timing" or "Lump Sum" (investing all $5,200 at once). DCA is generally safer for beginners as it reduces the risk of buying exactly at the "top."

### B. Backtesting
**Backtesting** is a simulator that uses **historical market data** to see how a strategy would have performed in the past.

*   **Example:** "If I had invested $50 every week into Bitcoin starting from January 2021 until today, how much would I have?"
*   **Result:** Trading Lab calculates the total invested, the current value, and the percentage gain/loss.

---

## 2. Features

All features are described below. For task breakdown, APIs, and acceptance criteria, see **[Developer Tasks](developer-tasks.md)**.

### 2.1 Level 0: Authentication & User Management

*   **Status:** Core Foundation.

Authentication and user management form the foundation of Trading Lab. This feature provides identity and secure access so users can have a private experience and, in later levels, save their backtest strategies.

**What it includes:**

*   **Registration** — New users create an account with name, email, and password. The system ensures passwords meet security rules and that email addresses are unique. Response returns only the current user and tokens (no internal IDs or extra data beyond what the client needs).
*   **Login** — Returning users sign in with email and password. The app issues an **access token** (JWT, short-lived) and a **refresh token** (longer-lived). The refresh token is returned in an **HTTP-only cookie**; the access token is returned in the response body (or cookie, per team decision). All auth endpoints return only the authenticated user’s own data (“return only them”).
*   **Refresh token** — A dedicated endpoint (e.g. POST /auth/refresh) reads the refresh token from the cookie and issues a new access token (and optionally a new refresh token). Used to keep the session alive without re-entering credentials.
*   **Profile** — Users can view and update their own profile (name, password, avatar). All profile endpoints are **protected**; GET/PATCH /users/me return only the current user’s data.
*   **Protected routes** — Any route that returns or modifies user-specific data requires a valid access token (Bearer) and returns only that user’s data.
*   **No hard delete** — User “delete” is **soft delete** only (e.g. `deletedAt` or `isDeleted`). Records are never physically removed; queries filter out soft-deleted users so they cannot log in or appear in the app.
*   **Audit and logging** — Auth-related actions (register, login, logout, refresh, profile update, soft delete) are logged. Optionally store an audit trail (who did what, when) for security and support.

---

### 2.2 Level 1: DCA Backtest (MVP)

*   **Status:** Mandatory.

Level 1 is the core simulator: a single-asset DCA backtest that shows users how a fixed, regular investment would have performed over a chosen period.

**What it includes:**

*   **Strategy setup** — The user picks one asset (e.g. Bitcoin), sets the amount to invest per period (e.g. $100), chooses frequency (daily, weekly, or monthly), and selects start and end dates. The system validates inputs (e.g. amount > 0, end date after start date).
*   **Results** — After running the backtest, the user sees total invested, current value, total return (%), and optionally total holdings. A line chart shows how portfolio value evolved over time (equity curve).

This is the minimum viable product: one asset, simple inputs, and a clear growth chart.

---

### 2.3 Level 2: Portfolio DCA

Level 2 extends the simulator to diversification: instead of a single asset, users define a portfolio of several assets with percentage weights (e.g. 60% BTC, 40% ETH).

**What it includes:**

*   **Portfolio builder** — Users add or remove assets and assign a weight to each. The total weight must equal 100%. A fixed total amount per period is then split across assets according to these weights at each investment date.
*   **Portfolio analysis** — Results show overall portfolio performance (total invested, current value, ROI) plus a per-asset breakdown so users can see which asset contributed most to profit or loss. An allocation pie chart shows the initial weight mix.

---

### 2.4 Level 3: Smart Triggers (Take Profit / Stop Loss)

Level 3 adds active management on top of DCA: the simulator can “sell” part or all of the position when profit or loss reaches a threshold (Take Profit and Stop Loss).

**What it includes:**

*   **Trigger settings** — Users configure Take Profit (e.g. sell when unrealized profit reaches 50%) and Stop Loss (e.g. sell when unrealized loss reaches 15%), and what fraction of holdings to sell (e.g. 100% or 50%) when the trigger fires.
*   **Execution visibility** — The backtest result separates realized profit (from sells) from unrealized value (remaining holdings). The chart shows where sells happened (markers), and a trade history table lists each sell with date, type (TP/SL), and profit.

This lets users compare “pure DCA” with “DCA + TP/SL” in the same tool.

---

### 2.5 Level 4: AI Advisor

Level 4 adds an AI advisor that interprets backtest results and answers questions in plain language, so users can get strategy feedback and suggestions without reading raw numbers alone.

**What it includes:**

*   **Strategy analysis** — From the backtest results screen, the user can open an “AI Advisor” panel. The AI receives a summary of the strategy and results (and optionally timeline/trades) and can respond with pros, cons, and suggestions (e.g. risk level, frequency, or allocation).
*   **Interactive chat** — The user can ask follow-up questions (e.g. “What happened in late 2022?”). The advisor uses the current backtest as context and can return formatted text (e.g. markdown) and optional suggested actions (e.g. “Increase frequency to Weekly”) that the product can surface as buttons or chips.

---

### 2.6 Developer Task Assignment

For sprint planning and assigning work to developers, use **[Developer Tasks](developer-tasks.md)**. It breaks each level into concrete tasks with IDs, dependencies, scope (S/M/L), acceptance criteria, and suggested sprint order.

---

## 3. User Flow

1. Register / Log in
2. Create a new DCA strategy (select asset(s), amount, frequency, date range)
3. (Level 2) Add more assets and set weights (total 100%)
4. (Level 3) Optionally configure Take Profit / Stop Loss
5. Run Backtest
6. View results: summary, equity chart, (Level 2) allocation pie chart, (Level 3) trade table and sell markers
7. (Level 4) Optionally open AI Advisor to ask questions about the results

---

## 4. Results Dashboard (after backtest)

**Summary cards:** Total Invested, Current Value, Total Return (%), Number of Purchases.

**Charts:** Equity chart (portfolio value over time); (Level 2) allocation pie chart; (Level 3) buy/sell markers on the equity chart.

**Trade table (Level 3):** Date, asset, amount, price at time of trade, profit/loss.

---

## 5. Technical Implementation Overview

### Frontend (React)
*   **State Management**: React Query (TanStack Query) for handling asynchronous data.
*   **Styling**: Tailwind CSS with a clean, professional "Fintech" aesthetic.
*   **Charts**: Using libraries like Recharts or Chart.js for data visualization.

### Backend (NestJS)
*   **Price Engine**: A module that fetches historical OHLC (Open, High, Low, Close) data from financial APIs (like CoinGecko or CryptoCompare).
*   **Calculation Engine**: A pure logic layer that iterates through the historical data to simulate the buys at specific timestamps.

### Supported assets (initial)

*   **Crypto (CoinGecko):** Bitcoin (BTC), Ethereum (ETH).
*   **US stocks (AlphaVantage, free tier ~25 requests/day):** Apple (AAPL), Tesla (TSLA).

### System architecture

```
Frontend (React + Vite + TailwindCSS)
            |
            v  API calls
Backend (NestJS)
            |
    +-------+-------+-------+
    v       v       v
 MongoDB  Redis   Market Data API
 (users)  (cache  (CoinGecko / AlphaVantage)
           prices)
```

---

## 6. Why help users "Feel" the app?

Trading Lab isn't just a calculator; it's a **behavioral tool**. It helps users realize that:
*   Consistency often beats luck.
*   Market crashes are actually "buy opportunities" in a DCA strategy.
*   Emotions are the biggest enemy of profit.
