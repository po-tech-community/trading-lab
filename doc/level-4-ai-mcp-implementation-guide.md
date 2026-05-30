# Level 4 Knowledge Note: AI Advisor, Chat, and MCP

This document is a conceptual guide for the project team. It is not a task checklist and not a strict implementation spec.

Its purpose is to answer three questions:

1. What is the AI feature supposed to do in this project?
2. How should the chat experience behave for a backtest user?
3. What is MCP, and why would we add it here?

If Level 1-3 are about simulation and trading logic, Level 4 is about turning that data into a useful assistant experience.

## 1. Why Level 4 Exists

By Level 3, the app can already:

- run a DCA backtest,
- simulate portfolio allocation,
- apply take-profit / stop-loss triggers,
- produce trade history and summary metrics.

That is already valuable data.

Level 4 asks a different question: **how can the product help the user understand that data?**

An AI Advisor can:

- explain what happened in a backtest,
- compare strategies at a high level,
- point out risk patterns,
- suggest what to inspect next,
- answer follow-up questions in plain language.

So the AI feature is not replacing the backtest engine. It is a layer above it that helps the user interpret results.

## 2. What the AI Feature Should Feel Like

The product should feel like a trading analysis workspace, not a generic chatbot.

Good AI behavior in this app:

- the assistant knows the current backtest context,
- the assistant can reference summary numbers and trade events,
- answers are grounded in the data from the app,
- the assistant can suggest next actions,
- the interface stays attached to the backtest workflow.

Bad AI behavior:

- generic finance advice with no connection to the user’s run,
- answers that ignore portfolio weights or trigger settings,
- chat responses that are long but not evidence-based,
- tool outputs that are hidden from the user,
- a UI that feels disconnected from the rest of the product.

## 3. What Exists in the Repo Already

The repo already has the right foundations for this feature:

- NestJS backend structure with modules, controllers, services, DTO validation, Swagger.
- Backtest engine that already returns summary, timeline, and trades.
- Portfolio trigger logic with realized and unrealized metrics.
- Auth/session flow using JWT access tokens and refresh cookies.
- Front-end route for AI Advisor and a placeholder chat page.

This matters because Level 4 should not be built as a separate app. It should plug into the existing architecture.

Relevant files to study first:

- [back-end/src/main.ts](../back-end/src/main.ts)
- [back-end/src/app.module.ts](../back-end/src/app.module.ts)
- [back-end/src/backtest/backtest.controller.ts](../back-end/src/backtest/backtest.controller.ts)
- [back-end/src/backtest/dto/run-dca-backtest.dto.ts](../back-end/src/backtest/dto/run-dca-backtest.dto.ts)
- [back-end/src/auth/auth.controller.ts](../back-end/src/auth/auth.controller.ts)
- [back-end/src/common/interceptors/logging.interceptor.ts](../back-end/src/common/interceptors/logging.interceptor.ts)
- [back-end/src/audit/audit.service.ts](../back-end/src/audit/audit.service.ts)
- [front-end/src/pages/AiChatPage.tsx](../front-end/src/pages/AiChatPage.tsx)
- [front-end/src/router/router.tsx](../front-end/src/router/router.tsx)

## 4. The AI Advisor Concept

Think of the AI Advisor as a helper that sits on top of the backtest results.

It should understand the following inputs:

- what strategy the user ran,
- what asset or portfolio was tested,
- how much was invested,
- which frequency was used,
- whether TP/SL triggers were enabled,
- what the final outcome was,
- what trades were executed.

From that context, it should produce outputs like:

- a short explanation of performance,
- a note about risk or volatility,
- a comparison of trigger settings,
- a suggestion for the next experiment,
- a reminder when the user is asking for a conclusion that the data does not support.

The important concept is this: **the AI should reason over project data, not over vague memory.**

## 5. How Chat Should Work

The chat experience should feel like a conversation attached to a specific backtest.

### 5.1 Core chat behavior

1. The user asks a question.
2. The UI shows the user message immediately.
3. The app sends the question plus backtest context to the backend.
4. The backend prepares an answer using the current strategy data.
5. The UI renders the assistant response in markdown.
6. The UI may also show buttons or chips for suggested next actions.

### 5.2 Good chat questions in this app

Examples:

- Why did this portfolio trigger stop loss so early?
- Is the sell action too aggressive?
- Which asset contributed most to the drawdown?
- Should I use weekly instead of daily for this setup?
- What changed after I adjusted the trigger threshold?

These are good because they relate directly to the app’s backtest data.

### 5.3 What the assistant should avoid

The assistant should avoid pretending to know facts that are not present in the backtest.

If the user asks something outside the current context, the assistant should say so clearly and either:

- ask for more data,
- explain the limitation,
- suggest what to run next.

That is better than hallucinating a confident but wrong answer.

## 6. What MCP Means in This Project

MCP stands for **Model Context Protocol**.

In practical terms:

- the model should not do everything by itself,
- it should be able to call tools,
- tools provide structured facts,
- the model uses those facts to answer better.

In this project, MCP is useful because the AI Advisor may need to ask questions such as:

- what is the latest market snapshot for the symbol,
- what is the current portfolio risk profile,
- which assets look overexposed,
- what is the drawdown distribution,
- is the user asking for a safe or risky adjustment.

So MCP is the bridge between the language model and structured project data.

## 7. The Right Mental Model for MCP

Think of MCP as three things:

### 7.1 Tool registry

This is a list of available tools.

Each tool has:

- a name,
- a purpose,
- an input schema,
- a risk level,
- and a way to execute it.

### 7.2 Policy layer

This decides whether a tool can run automatically.

For example:

- read-only analysis tools can usually run automatically,
- sensitive tools may require approval,
- unknown tools should be blocked.

This matters because the AI feature should be transparent and safe.

### 7.3 Tool results

The output of a tool should be normalized into a predictable format.

That output can then be:

- shown to the user,
- passed back into the model,
- stored for audit or debugging.

## 8. What MCP Could Be Used For Here

In this project, MCP does not need to be huge.

It only needs to be useful.

Possible tools:

- market snapshot tool,
- portfolio diagnostics tool,
- risk check tool,
- backtest summary lookup tool,
- trade history summarizer tool.

These tools would let the AI answer with evidence instead of guessing.

Example:

- user asks: “Why was this portfolio unstable?”
- model requests a risk check tool,
- tool returns concentration or drawdown info,
- final answer explains the issue and recommends what to inspect.

That is the practical value of MCP in this app.

## 9. A Good Backend Shape for This Feature

The backend should stay consistent with the rest of the repo.

That means the AI feature would likely become a new module, something like `ai/`.

Conceptually, that module would include:

- a controller for API endpoints,
- a service that orchestrates the AI response,
- DTOs for validation,
- a prompt builder or context compressor,
- an LLM provider abstraction,
- optional MCP tooling and policy logic,
- optional chat-session storage.

The important idea is not the exact folder name. The important idea is separation of concerns:

- controller = HTTP handling,
- service = orchestration,
- provider = model call,
- tools = external structured facts,
- chat store = history.

That fits the existing NestJS style already used in the project.

## 10. A Good Front-End Shape for This Feature

The front-end should not feel like a separate AI demo page.

It should feel like part of the backtest workflow.

The user experience should ideally include:

- a chat panel on the AI Advisor page,
- the current backtest summary shown near the conversation,
- assistant responses rendered in markdown,
- loading states while the backend thinks,
- suggested action chips when the model recommends something useful,
- tool evidence cards when MCP is used.

The current placeholder page in [front-end/src/pages/AiChatPage.tsx](../front-end/src/pages/AiChatPage.tsx) is already the right entry point for that experience.

## 11. What Data the AI Should Read

This is a key point.

The model should be grounded in app data, especially:

- summary metrics,
- timeline points,
- trigger settings,
- trade history,
- portfolio breakdown,
- realized vs unrealized performance.

The data should be compressed before sending to the model.

Why?

- full timelines can be too large,
- repeated raw data wastes tokens,
- summary + sampled points are usually enough for analysis.

This is the difference between “dumping data into a prompt” and “building a useful context.”

## 12. How To Think About Prompting

For this project, prompt design should teach the model three things:

1. What role it plays.
2. What data it can trust.
3. What kind of answer the user expects.

A strong prompt in this app should encourage:

- short reasoning,
- direct answers,
- mention of assumptions,
- caution where the data is incomplete,
- concrete next-step suggestions.

The prompt should not ask the model to be overly fancy.
It should ask the model to be useful.

## 13. How the Result Should Look to Users

The assistant response should likely contain:

- a short answer first,
- a few supporting bullets,
- a risk note if needed,
- a recommended next experiment,
- optional actions the user can click.

Example response style:

- “Your stop-loss is likely too aggressive for this portfolio.”
- “Most of the drawdown comes from one high-volatility asset.”
- “Try a lower sellAction or a wider threshold and compare the trade history.”

This style is more educational than a long abstract explanation.

## 14. Why Logging and Audit Still Matter

This repo already logs requests and auth events.

That same thinking should apply to AI features.

An AI feature is not just a UI panel.
It also needs observability:

- what question was asked,
- which tools were used,
- whether a tool was approved or denied,
- how long the response took,
- whether the provider failed.

This is especially important because it helps explain and debug system behavior.

## 15. The Big Picture

If we summarize Level 4 in one sentence:

**Level 4 turns backtest data into a guided conversation.**

The user should be able to:

- run a backtest,
- ask what happened,
- understand the result,
- inspect evidence,
- and decide what to try next.

MCP makes the assistant smarter by giving it tools.
Chat makes the assistant usable.
Backtest data makes the assistant grounded.

That is the product idea behind Level 4.

## 16. Suggested Reading Order

Start with these files:

1. [doc/developer-tasks.md](developer-tasks.md)
2. [back-end/src/main.ts](../back-end/src/main.ts)
3. [back-end/src/backtest/backtest.controller.ts](../back-end/src/backtest/backtest.controller.ts)
4. [back-end/src/backtest/dto/run-dca-backtest.dto.ts](../back-end/src/backtest/dto/run-dca-backtest.dto.ts)
5. [front-end/src/pages/AiChatPage.tsx](../front-end/src/pages/AiChatPage.tsx)
6. [front-end/src/router/router.tsx](../front-end/src/router/router.tsx)

## 17. If You Want to Build This Later

When the team starts implementing Level 4, the order should usually be:

1. define the AI response shape,
2. wire a simple chat request/response,
3. compress backtest context,
4. add conversation memory,
5. add MCP tools one by one,
6. show tool evidence in the UI.

That sequence keeps the feature understandable and reduces complexity.

## 18. Do We Need to Save Every Backtest Run?

Short answer: not always.

The right design is:

- **Backtest engine can stay stateless** (fire-and-forget) for users who only run and inspect result once.
- **AI chat should be stateful** when we want follow-up questions and continuity.

### 18.1 Minimal persistence strategy (recommended first)

Persist only what AI needs for context continuity:

- chat session metadata,
- chat messages,
- a compact backtest snapshot (or a stable backtest result reference id).

Do not persist huge raw timeline blobs for every run in phase 1.

### 18.2 What to store in a compact backtest snapshot

- mode (single or portfolio),
- run config (symbols, frequency, date range, trigger settings),
- summary metrics,
- key trade events,
- optional sampled timeline points.

This is enough for most “why did this happen?” and “what changed?” conversations.

## 19. Capability Ladder: What Users Get After Each Step

### Step A: Basic AI analyze endpoint

User can ask:

- “Why is this return low?”
- “Did stop-loss trigger too early?”

AI can do:

- explain current run using summary and trade data,
- suggest one next experiment.

### Step B: Chat history and run binding

User can ask:

- “Compare this with my previous run.”
- “What changed after I raised TP threshold?”

AI can do:

- answer follow-up questions without losing context,
- keep conversation tied to one stable run snapshot.

### Step C: MCP-enabled evidence

User can ask:

- “Is my risk concentration too high?”
- “Which asset is driving volatility now?”

AI can do:

- call tools for evidence,
- return transparent, tool-backed recommendations.

## 20. Prompt Library (What to Ask the Bot)

Use these question templates:

### 20.1 Performance understanding

- “Explain this backtest result in simple terms.”
- “What are the top 3 reasons this run underperformed?”

### 20.2 Trigger tuning

- “Is my stop-loss threshold too tight for this asset mix?”
- “What sellAction range should I test next?”

### 20.3 Portfolio diagnostics

- “Which asset contributes most to drawdown?”
- “Is my portfolio overexposed to one symbol?”

### 20.4 Experiment planning

- “Give me 2 next test scenarios with expected trade-offs.”
- “Should I test weekly vs monthly frequency first, and why?”

This document is meant to clarify the direction before implementation starts.
