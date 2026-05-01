import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getAssetContribution,
  getConcentrationRisk,
  getDrawdownBreakdown,
} from './shared/portfolio-context-tools';
import { startTradingLabMcpServer } from './shared/http-mcp-server';

const WeightItemSchema = z.object({
  symbol: z.string().min(1),
  weight: z.number().min(0).max(1),
});

const PortfolioContextSchema = z.object({
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
  assets: z.array(WeightItemSchema).optional(),
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
    name: 'trading-lab-portfolio-diagnostics',
    version: '1.0.0',
  });

  server.registerTool(
    'get_concentration_risk',
    {
      title: 'Concentration Risk',
      description: 'Return a concentration-risk summary from portfolio weights in the backtest context.',
      inputSchema: {
        backtestContext: PortfolioContextSchema,
      },
      outputSchema: {
        totalWeight: z.number(),
        largestPosition: z.object({
          symbol: z.string(),
          weight: z.number(),
        }),
        concentrationScore: z.number(),
        riskLevel: z.enum(['low', 'medium', 'high']),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ backtestContext }) => {
      const weights = backtestContext.assets ?? [];
      const result = getConcentrationRisk(weights);

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
    'get_drawdown_breakdown',
    {
      title: 'Drawdown Breakdown',
      description: 'Return a drawdown breakdown from the portfolio backtest timeline sample.',
      inputSchema: {
        backtestContext: PortfolioContextSchema,
      },
      outputSchema: {
        assets: z.array(
          z.object({
            symbol: z.string(),
            maxDrawdownPercent: z.number(),
            recoveryDaysEstimate: z.number(),
          }),
        ),
        portfolioMaxDrawdownPercent: z.number(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ backtestContext }) => {
      const weights = backtestContext.assets ?? [];
      const result = getDrawdownBreakdown(backtestContext, weights);

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
    'get_asset_contribution',
    {
      title: 'Asset Contribution',
      description: 'Return an asset contribution estimate grounded in portfolio weights and realized run performance.',
      inputSchema: {
        backtestContext: PortfolioContextSchema,
      },
      outputSchema: {
        rows: z.array(
          z.object({
            symbol: z.string(),
            weight: z.number(),
            contributionPercent: z.number(),
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
      const weights = backtestContext.assets ?? [];
      const rows = getAssetContribution(backtestContext, weights);
      const result = { rows };

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
  const port = Number(process.env.MCP_PORTFOLIO_PORT ?? '4200');
  await startTradingLabMcpServer({
    port,
    buildServer,
  });
}

main().catch((error) => {
  console.error('Portfolio diagnostics MCP server failed to start:', error);
  process.exit(1);
});
