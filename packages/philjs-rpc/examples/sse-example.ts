/**
 * Server-Sent Events (SSE) subscription example.
 * Demonstrates SSE transport as a WebSocket fallback.
 */

import { createAPI, procedure } from 'philjs-rpc';
import { z } from 'zod';
import {
  SSEConnection,
  createUseSSESubscription,
  isSSESupported,
} from 'philjs-rpc';

// ============================================================================
// Server-side API with SSE Support
// ============================================================================

// Simulated stock price updates
const stockPrices = new Map<string, number>([
  ['AAPL', 150.0],
  ['GOOGL', 2800.0],
  ['MSFT', 300.0],
]);

// Update prices periodically
setInterval(() => {
  for (const [symbol, price] of stockPrices) {
    const change = (Math.random() - 0.5) * 5;
    stockPrices.set(symbol, Math.max(0, price + change));
  }
}, 1000);

export const stockAPI = createAPI({
  // Query: Get current price
  getPrice: procedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      return {
        symbol: input.symbol,
        price: stockPrices.get(input.symbol) ?? 0,
        timestamp: new Date(),
      };
    }),

  // Subscription: Watch price updates
  onPriceUpdate: procedure
    .input(z.object({ symbol: z.string() }))
    .subscription(async function* ({ input }) {
      let lastPrice = stockPrices.get(input.symbol) ?? 0;

      while (true) {
        const currentPrice = stockPrices.get(input.symbol) ?? 0;

        if (currentPrice !== lastPrice) {
          yield {
            symbol: input.symbol,
            price: currentPrice,
            change: currentPrice - lastPrice,
            timestamp: new Date(),
          };
          lastPrice = currentPrice;
        }

        // Wait 100ms before checking again
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }),

  // Subscription: Market status updates
  onMarketStatus: procedure
    .subscription(async function* () {
      while (true) {
        const hour = new Date().getHours();
        const isOpen = hour >= 9 && hour < 16;

        yield {
          status: isOpen ? 'open' : 'closed',
          timestamp: new Date(),
        };

        // Update every minute
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    }),
});

export type StockAPI = typeof stockAPI;

// ============================================================================
// SSE Server Handler
// ============================================================================

/**
 * Express.js SSE endpoint handler.
 */
import type { Request, Response } from 'express';

export function createSSEHandler(api: typeof stockAPI) {
  return async (req: Request, res: Response) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Parse subscription parameters
    const id = req.query.id as string;
    const path = req.query.path as string;
    const input = JSON.parse(req.query.input as string);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Get procedure
    const procedure = getProcedureFromPath(api, path);
    if (!procedure) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        id,
        error: { code: 'NOT_FOUND', message: `Procedure not found: ${path}` },
      })}\n\n`);
      res.end();
      return;
    }

    try {
      // Execute subscription
      const iterator = procedure._def.handler({ input, ctx: {} });

      // Stream results
      for await (const data of iterator) {
        res.write(`data: ${JSON.stringify({
          type: 'data',
          id,
          data,
        })}\n\n`);

        // Flush immediately
        res.flush?.();
      }

      // Send completion
      res.write(`data: ${JSON.stringify({ type: 'complete', id })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        id,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      })}\n\n`);
    } finally {
      res.end();
    }
  };
}

// Helper to get procedure from path
function getProcedureFromPath(api: any, path: string): any {
  const parts = path.split('.');
  let current = api._def.router;

  for (const part of parts) {
    current = current[part];
    if (!current) return null;
  }

  return current;
}

// ============================================================================
// Client Setup with SSE
// ============================================================================

/**
 * Create SSE connection.
 */
const sseConnection = new SSEConnection({
  url: '/api/rpc/sse',
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    delay: 2000,
  },
  headers: () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }),
});

// Check SSE support
if (isSSESupported()) {
  console.log('SSE is supported');
} else {
  console.warn('SSE is not supported in this environment');
}

// ============================================================================
// React Component with SSE
// ============================================================================

/**
 * Stock price ticker component using SSE.
 */
function StockTicker({ symbol }: { symbol: string }) {
  // Subscribe to price updates via SSE
  const priceUpdates = createUseSSESubscription(
    sseConnection,
    'onPriceUpdate'
  )(
    { symbol },
    {
      onData: (update) => {
        console.log('Price update:', update);
      },
      onError: (error) => {
        console.error('SSE error:', error);
      },
      retryOnError: true,
      retryDelay: 3000,
    }
  );

  const latestPrice = priceUpdates.lastData;

  return (
    <div className="stock-ticker">
      <h3>{symbol}</h3>
      {priceUpdates.status === 'subscribed' ? (
        <div>
          <div className="price">${latestPrice?.price.toFixed(2)}</div>
          <div className={`change ${latestPrice && latestPrice.change >= 0 ? 'positive' : 'negative'}`}>
            {latestPrice && latestPrice.change >= 0 ? '+' : ''}
            {latestPrice?.change.toFixed(2)}
          </div>
          <div className="timestamp">
            {latestPrice?.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div className="status">{priceUpdates.status}</div>
      )}

      {priceUpdates.isError && (
        <div className="error">Error: {priceUpdates.error?.message}</div>
      )}
    </div>
  );
}

/**
 * Market status component.
 */
function MarketStatus() {
  const statusUpdates = createUseSSESubscription(
    sseConnection,
    'onMarketStatus'
  )(
    undefined as any,
    {
      onData: (status) => {
        console.log('Market status:', status);
      },
    }
  );

  const status = statusUpdates.lastData;

  return (
    <div className="market-status">
      <span className={`indicator ${status?.status}`}></span>
      Market is {status?.status}
    </div>
  );
}

// ============================================================================
// Advanced SSE Features
// ============================================================================

/**
 * Example: Multiple concurrent SSE subscriptions.
 */
function StockPortfolio({ symbols }: { symbols: string[] }) {
  const subscriptions = symbols.map((symbol) =>
    createUseSSESubscription(sseConnection, 'onPriceUpdate')({ symbol })
  );

  return (
    <div className="portfolio">
      {symbols.map((symbol, index) => {
        const sub = subscriptions[index];
        return (
          <div key={symbol} className="portfolio-item">
            <span>{symbol}</span>
            <span>${sub.lastData?.price.toFixed(2) ?? '...'}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Example: SSE with heartbeat monitoring.
 */
const sseWithHeartbeat = new SSEConnection({
  url: '/api/rpc/sse',
  heartbeatTimeout: 30000, // Close if no message in 30 seconds
  reconnect: {
    enabled: true,
    maxAttempts: 10,
  },
});

// Listen to heartbeat events
sseWithHeartbeat.on('error', ({ error }) => {
  if (error.message.includes('Heartbeat timeout')) {
    console.warn('SSE connection timed out, reconnecting...');
  }
});

/**
 * Example: Graceful degradation from WebSocket to SSE.
 */
import { createAutoTransport } from 'philjs-rpc';

function createStockConnection() {
  try {
    const { connection, type } = createAutoTransport({
      wsUrl: 'ws://localhost:3000/api/rpc',
      sseUrl: '/api/rpc/sse',
      preferWebSocket: true,
    });

    console.log(`Connected using ${type}`);

    return connection;
  } catch (error) {
    console.error('Failed to establish connection:', error);
    throw error;
  }
}

const connection = createStockConnection();

/**
 * Example: SSE connection lifecycle.
 */
async function demonstrateSSELifecycle() {
  const sse = new SSEConnection({
    url: '/api/rpc/sse',
  });

  // Connect
  console.log('Connecting to SSE...');
  await sse.connect();
  console.log('Connected!');

  // Subscribe
  const unsubscribe = sse.subscribe(
    'sub-1',
    'onPriceUpdate',
    { symbol: 'AAPL' },
    {
      next: (data) => console.log('Data:', data),
      error: (err) => console.error('Error:', err),
      complete: () => console.log('Completed'),
    }
  );

  // Wait 10 seconds
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Unsubscribe
  unsubscribe();

  // Disconnect
  sse.disconnect();
  console.log('Disconnected');
}

// ============================================================================
// Server-side heartbeat implementation
// ============================================================================

/**
 * Enhanced SSE handler with heartbeat.
 */
export function createSSEHandlerWithHeartbeat(api: typeof stockAPI) {
  return async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const id = req.query.id as string;
    const path = req.query.path as string;
    const input = JSON.parse(req.query.input as string);

    // Send heartbeat every 15 seconds
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
      res.flush?.();
    }, 15000);

    try {
      const procedure = getProcedureFromPath(api, path);
      if (!procedure) {
        throw new Error(`Procedure not found: ${path}`);
      }

      const iterator = procedure._def.handler({ input, ctx: {} });

      for await (const data of iterator) {
        res.write(`data: ${JSON.stringify({ type: 'data', id, data })}\n\n`);
        res.flush?.();
      }

      res.write(`data: ${JSON.stringify({ type: 'complete', id })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        id,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      })}\n\n`);
    } finally {
      clearInterval(heartbeat);
      res.end();
    }
  };
}

export { StockTicker, MarketStatus, StockPortfolio };
