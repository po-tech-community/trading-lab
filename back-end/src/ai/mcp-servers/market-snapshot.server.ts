import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  fetchLatestMarketSnapshot,
  fetchVolatilitySummary,
} from './shared/real-market-data';
import { startTradingLabMcpServer } from './shared/http-mcp-server';

function buildServer() {
  const server = new McpServer({
    name: 'trading-lab-market-snapshot',
    version: '1.0.0',
  });

  server.registerTool(
    'get_latest_quote',
    {
      title: 'Latest Quote',
      description: 'Return a starter market snapshot for a symbol.',
      inputSchema: {
        symbol: z.string().min(1).describe('Ticker or asset symbol, for example BTC or ETH.'),
      },
      outputSchema: {
        symbol: z.string(),
        priceUsd: z.number(),
        previousCloseUsd: z.number().nullable(),
        change24hPercent: z.number(),
        asOf: z.string(),
        source: z.enum(['coingecko', 'alphavantage']),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ symbol }) => {
      const snapshot = await fetchLatestMarketSnapshot(symbol);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(snapshot, null, 2),
          },
        ],
        structuredContent: snapshot as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    'get_volatility_summary',
    {
      title: 'Volatility Summary',
      description: 'Return a starter volatility summary for a symbol and lookback window.',
      inputSchema: {
        symbol: z.string().min(1).describe('Ticker or asset symbol, for example BTC or ETH.'),
        windowDays: z.number().int().min(7).max(365).default(30),
      },
      outputSchema: {
        symbol: z.string(),
        windowDays: z.number(),
        annualizedVolatility: z.number(),
        averageTrueRangePercent: z.number(),
        regime: z.enum(['low', 'medium', 'high']),
        asOf: z.string(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ symbol, windowDays }) => {
      const summary = await fetchVolatilitySummary(symbol, windowDays);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2),
          },
        ],
        structuredContent: summary as Record<string, unknown>,
      };
    },
  );

  return server;
}

async function main() {
  const port = Number(process.env.MCP_MARKET_PORT ?? '4100');
  await startTradingLabMcpServer({
    port,
    buildServer,
  });
}

main().catch((error) => {
  console.error('Market snapshot MCP server failed to start:', error);
  process.exit(1);
});
