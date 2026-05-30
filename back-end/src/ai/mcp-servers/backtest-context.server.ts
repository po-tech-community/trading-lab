import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  buildBacktestSummary,
  evaluateRiskProfile,
  summarizeTradeHistory,
} from './shared/backtest-context-tools';
import { startTradingLabMcpServer } from './shared/http-mcp-server';

const BacktestContextSchema = z.object({
  mode: z.enum(['single', 'portfolio']),
  title: z.string().min(1),
  generatedAt: z.string().min(1),
  summary: z.object({
    totalInvested: z.number(),
    currentValue: z.number(),
    totalReturnPercentage: z.number(),
    realizedProfit: z.number().optional(),
    unrealizedValue: z.number().optional(),
  }),
  trades: z
    .array(
      z.object({
        date: z.string(),
        type: z.string(),
        price: z.number(),
        profit: z.number().optional(),
      }),
    )
    .optional(),
  timelineSample: z
    .array(
      z.object({
        date: z.string(),
        value: z.number(),
      }),
    )
    .optional(),
});

function buildServer() {
  const server = new McpServer({
    name: 'trading-lab-backtest-context',
    version: '1.0.0',
  });

  server.registerTool(
    'get_backtest_summary',
    {
      title: 'Backtest Summary Lookup',
      description: 'Return a compact summary view for an existing backtest context snapshot.',
      inputSchema: {
        backtestContext: BacktestContextSchema,
      },
      outputSchema: {
        mode: z.enum(['single', 'portfolio']),
        title: z.string(),
        generatedAt: z.string(),
        totalInvested: z.number(),
        currentValue: z.number(),
        totalReturnPercentage: z.number(),
        realizedProfit: z.number().nullable(),
        unrealizedValue: z.number().nullable(),
        tradeCount: z.number(),
        profitState: z.enum(['gain', 'loss', 'flat']),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ backtestContext }) => {
      const result = buildBacktestSummary(backtestContext);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    'summarize_trade_history',
    {
      title: 'Trade History Summarizer',
      description: 'Summarize trade outcomes from a backtest context snapshot.',
      inputSchema: {
        backtestContext: BacktestContextSchema,
      },
      outputSchema: {
        tradeCount: z.number(),
        realizedTradeCount: z.number(),
        wins: z.number(),
        losses: z.number(),
        totalRealizedProfit: z.number(),
        largestWin: z.number(),
        largestLoss: z.number(),
        latestTrades: z.array(
          z.object({
            date: z.string(),
            type: z.string(),
            price: z.number(),
            profit: z.number().optional(),
          }),
        ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ backtestContext }) => {
      const result = summarizeTradeHistory(backtestContext);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    'evaluate_risk_profile',
    {
      title: 'Risk Check',
      description: 'Estimate a risk profile from summary metrics and a timeline sample.',
      inputSchema: {
        backtestContext: BacktestContextSchema,
      },
      outputSchema: {
        riskLevel: z.enum(['low', 'medium', 'high']),
        sampledDrawdownPercent: z.number(),
        realizedProfit: z.number().nullable(),
        unrealizedValue: z.number().nullable(),
        signals: z.array(z.string()),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ backtestContext }) => {
      const result = evaluateRiskProfile(backtestContext);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result as Record<string, unknown>,
      };
    },
  );

  return server;
}

async function main() {
  const port = Number(process.env.MCP_BACKTEST_CONTEXT_PORT ?? '4300');
  await startTradingLabMcpServer({
    port,
    buildServer,
  });
}

main().catch((error) => {
  console.error('Backtest context MCP server failed to start:', error);
  process.exit(1);
});

