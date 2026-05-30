import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

export interface TradingLabMcpServerOptions {
  port: number;
  host?: string;
  buildServer: () => McpServer;
}

export async function startTradingLabMcpServer(
  options: TradingLabMcpServerOptions,
): Promise<void> {
  const host = options.host ?? '127.0.0.1';
  const app = createMcpExpressApp({ host });
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  const postHandler = async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'];

    try {
      let transport: StreamableHTTPServerTransport | undefined;

      if (typeof sessionId === 'string' && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (initializedSessionId) => {
            transports[initializedSessionId] = transport!;
          },
        });

        transport.onclose = () => {
          const activeSessionId = transport?.sessionId;
          if (activeSessionId && transports[activeSessionId]) {
            delete transports[activeSessionId];
          }
        };

        const server = options.buildServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message:
              error instanceof Error ? error.message : 'Internal server error',
          },
          id: null,
        });
      }
    }
  };

  const getHandler = async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'];
    if (typeof sessionId !== 'string' || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    await transports[sessionId].handleRequest(req, res);
  };

  const deleteHandler = async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'];
    if (typeof sessionId !== 'string' || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    await transports[sessionId].handleRequest(req, res);
  };

  app.post('/mcp', postHandler);
  app.get('/mcp', getHandler);
  app.delete('/mcp', deleteHandler);

  await new Promise<void>((resolve) => {
    const server = createServer(app);
    server.listen(options.port, host, () => {
      console.log(`MCP server listening at http://${host}:${options.port}/mcp`);
      resolve();
    });
  });
}

