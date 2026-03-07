# Trading Lab – DCA Simulator & AI Advisor

## Introduction

### What is DCA?

**DCA (Dollar Cost Averaging)** is the simplest investment strategy in the world: Instead of putting a large sum of money in at once, you **divide it** and **buy regularly** according to a schedule (every week, every month).

> **Real-world example:** You have $1,200. Instead of buying $1,200 worth of Bitcoin at once, you buy $100 every month for 12 months. When the price goes down, your $100 buys more. When the price goes up, you buy less. On average, you avoid the risk of "buying at the peak".

### What is Backtesting?

**Backtest** = running an investment strategy on **historical data** to see "if I had done this since last year, how much profit or loss would I have now?"

It's like a **simulator** — no real money used, just using old price data to check if the strategy is effective.

### Reference

Check out [dcabtc.com](https://dcabtc.com/) to understand how a DCA calculator works. Our Trading Lab will build a more complete version, with multiple assets, portfolios, and an AI advisor.

---

## 1. What is this project?

**Trading Lab** is a web app that allows users to:

1. Select one (or more) financial assets (Bitcoin, Ethereum, Apple stock, Tesla...)
2. Set up a DCA strategy (how much money, how often, from which date to which date)
3. Click **"Run Backtest"**
4. View results: how much profit, how much loss, growth chart

> **Simple understanding:** "If I put $100/month into Bitcoin from 2020, how much money would I have now?" — Trading Lab answers that question.

---

## 2. Features — from simple to advanced

The project is divided into **4 levels**.

### Level 1: DCA Calculator (MVP — Mandatory)

- **User input:** Asset, amount per purchase, frequency, time period.
- **System returns:** Total Invested, Current Value, Total Return (%), Equity Chart.

### Level 2: Portfolio DCA (Advanced)

- Multi-asset allocation (e.g., 50% BTC, 30% ETH, 20% AAPL).
- Performance comparison and allocation pie charts.

### Level 3: Sell Triggers (Challenge)

- Take Profit and Stop Loss settings.
- List of sell orders and comparison with non-trigger strategy.

### Level 4: AI Chatbot Advisor

- Chatbot for strategy analysis and suggestions (using OpenAI API).

---

## 3. Tech Stack

| Component | Technology |
| --- | --- |
| Frontend | React + Vite + TailwindCSS |
| Backend | NestJS (Node.js) |
| Database | MongoDB |
| Cache | Redis |
| Auth | JWT (JSON Web Token) |
| API Docs | Swagger |
| AI | OpenAI API |
| Deploy | Vercel |
| Container | Docker |

---

## 4. Getting Started

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- MongoDB & Redis (or use Docker)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd TradingLab
   ```

2. Setup Back-end:
   ```bash
   cd back-end
   cp .env.example .env   # set MONGODB_URI, REDIS_HOST, REDIS_PORT (or use existing .env)
   npm install
   npm run start:dev
   ```
   Back-end runs on port **8000** (front-end uses 3000). Ensure MongoDB and Redis are running (e.g. `docker compose up -d` in `back-end/`).

3. Setup Frontend:
   ```bash
   cd front-end
   npm install
   npm run dev
   ```

---

## 5. Documentation

| Document | Purpose |
|----------|---------|
| [doc/requirements.md](doc/requirements.md) | Core concepts, Level 0–4 feature descriptions, tech overview |
| [doc/developer-tasks.md](doc/developer-tasks.md) | **Task breakdown for developers** – assignable tasks with IDs, dependencies, and acceptance criteria |
| [doc/back-end-guide.md](doc/back-end-guide.md) | **Back-end (NestJS)** – project structure, how to create modules, key files, ports (8000) |
