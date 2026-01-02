/**
 * Real-time Communication - WebSocket & SSE Support
 *
 * Provides tRPC-style real-time subscriptions with WebSocket and SSE fallback
 */

import { signal, memo, effect, type Signal, type Memo } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export type RealtimeTransport = 'websocket' | 'sse' | 'polling';

export interface RealtimeMessage<T = any> {
  id: string;
  type: 'data' | 'error' | 'complete' | 'ping' | 'pong' | 'subscribe' | 'unsubscribe';
  channel: string;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface SubscriptionOptions<T = any> {
  /**
   * Preferred transport (will fallback if unavailable)
   */
  transport?: RealtimeTransport;

  /**
   * Reconnect on disconnect
   */
  reconnect?: boolean;

  /**
   * Reconnect delay in ms
   */
  reconnectDelay?: number;

  /**
   * Max reconnect attempts
   */
  maxReconnectAttempts?: number;

  /**
   * Callback for new data
   */
  onData?: (data: T) => void;

  /**
   * Callback for errors
   */
  onError?: (error: Error) => void;

  /**
   * Callback for completion
   */
  onComplete?: () => void;

  /**
   * Callback for connection state changes
   */
  onStateChange?: (state: ConnectionState) => void;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

export interface Subscription<T = any> {
  /**
   * Current connection state
   */
  state: Signal<ConnectionState>;

  /**
   * Latest data
   */
  data: Signal<T | null>;

  /**
   * Latest error
   */
  error: Signal<Error | null>;

  /**
   * Is connected
   */
  isConnected: Memo<boolean>;

  /**
   * Unsubscribe
   */
  unsubscribe: () => void;

  /**
   * Send data to server (for WebSocket only)
   */
  send: (data: any) => void;
}

// ============================================================================
// WebSocket Client
// ============================================================================

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions = new Map<string, Set<(message: RealtimeMessage) => void>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private shouldReconnect: boolean;
  private pingInterval: number | null = null;

  constructor(url: string, options: {
    reconnect?: boolean;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
  } = {}) {
    this.url = url;
    this.shouldReconnect = options.reconnect ?? true;
    this.reconnectDelay = options.reconnectDelay ?? 1000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: RealtimeMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.stopPing();

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private reconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnect failed:', error);
      });
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', channel: '__system__', id: Date.now().toString(), timestamp: Date.now() });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  subscribe(channel: string, callback: (message: RealtimeMessage) => void): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());

      // Send subscribe message
      this.send({
        type: 'subscribe',
        channel,
        id: Date.now().toString(),
        timestamp: Date.now(),
      });
    }

    this.subscriptions.get(channel)!.add(callback);

    return () => {
      const subscribers = this.subscriptions.get(channel);
      if (subscribers) {
        subscribers.delete(callback);

        if (subscribers.size === 0) {
          this.subscriptions.delete(channel);

          // Send unsubscribe message
          this.send({
            type: 'unsubscribe',
            channel,
            id: Date.now().toString(),
            timestamp: Date.now(),
          });
        }
      }
    };
  }

  send(message: Partial<RealtimeMessage>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: RealtimeMessage): void {
    const subscribers = this.subscriptions.get(message.channel);
    if (subscribers) {
      subscribers.forEach(callback => callback(message));
    }
  }

  close(): void {
    this.shouldReconnect = false;
    this.stopPing();
    this.ws?.close();
    this.ws = null;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// ============================================================================
// SSE Client
// ============================================================================

export class SSEClient {
  private eventSources = new Map<string, EventSource>();
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  subscribe(channel: string, callback: (message: RealtimeMessage) => void): () => void {
    if (this.eventSources.has(channel)) {
      console.warn(`[SSE] Already subscribed to channel: ${channel}`);
      return () => {};
    }

    const url = `${this.baseUrl}/${channel}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        callback(message);
      } catch (error) {
        console.error('[SSE] Failed to parse message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Error:', error);
      callback({
        id: Date.now().toString(),
        type: 'error',
        channel,
        error: 'SSE connection error',
        timestamp: Date.now(),
      });
    };

    this.eventSources.set(channel, eventSource);

    return () => {
      eventSource.close();
      this.eventSources.delete(channel);
    };
  }

  close(): void {
    this.eventSources.forEach(es => es.close());
    this.eventSources.clear();
  }
}

// ============================================================================
// Realtime Manager
// ============================================================================

export class RealtimeManager {
  private wsClient: WebSocketClient | null = null;
  private sseClient: SSEClient | null = null;
  private preferredTransport: RealtimeTransport;
  private wsUrl: string;
  private sseUrl: string;

  constructor(options: {
    wsUrl: string;
    sseUrl: string;
    transport?: RealtimeTransport;
  }) {
    this.wsUrl = options.wsUrl;
    this.sseUrl = options.sseUrl;
    this.preferredTransport = options.transport || 'websocket';
  }

  async connect(): Promise<void> {
    if (this.preferredTransport === 'websocket' && typeof WebSocket !== 'undefined') {
      this.wsClient = new WebSocketClient(this.wsUrl);
      await this.wsClient.connect();
    } else if (typeof EventSource !== 'undefined') {
      this.sseClient = new SSEClient(this.sseUrl);
    }
  }

  subscribe<T = any>(channel: string, options: SubscriptionOptions<T> = {}): Subscription<T> {
    const state = signal<ConnectionState>('connecting');
    const data = signal<T | null>(null);
    const error = signal<Error | null>(null);
    const isConnected = memo(() => state() === 'connected');

    let unsubscribeFn: (() => void) | null = null;

    const handleMessage = (message: RealtimeMessage<T>) => {
      switch (message.type) {
        case 'data':
          data.set(message.data || null);
          options.onData?.(message.data!);
          break;

        case 'error':
          const err = new Error(message.error || 'Unknown error');
          error.set(err);
          options.onError?.(err);
          break;

        case 'complete':
          state.set('disconnected');
          options.onComplete?.();
          break;
      }
    };

    // Try WebSocket first, fallback to SSE
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      state.set('connected');
      unsubscribeFn = this.wsClient.subscribe(channel, handleMessage);
    } else if (this.sseClient) {
      state.set('connected');
      unsubscribeFn = this.sseClient.subscribe(channel, handleMessage);
    } else {
      state.set('failed');
      error.set(new Error('No realtime transport available'));
    }

    return {
      state,
      data,
      error,
      isConnected,
      unsubscribe: () => {
        unsubscribeFn?.();
        state.set('disconnected');
      },
      send: (sendData: any) => {
        if (this.wsClient) {
          this.wsClient.send({
            type: 'data',
            channel,
            data: sendData,
            id: Date.now().toString(),
            timestamp: Date.now(),
          });
        }
      },
    };
  }

  close(): void {
    this.wsClient?.close();
    this.sseClient?.close();
  }
}

// ============================================================================
// High-Level Hooks
// ============================================================================

let globalManager: RealtimeManager | null = null;

export function initRealtime(options: {
  wsUrl: string;
  sseUrl: string;
  transport?: RealtimeTransport;
}): RealtimeManager {
  if (!globalManager) {
    globalManager = new RealtimeManager(options);
    globalManager.connect();
  }
  return globalManager;
}

/**
 * Subscribe to a realtime channel
 *
 * @example
 * ```tsx
 * const messages = useSubscription<Message>('chat/room-123', {
 *   onData: (message) => {
 *     console.log('New message:', message);
 *   }
 * });
 *
 * return (
 *   <div>
 *     {messages.data() && <Message data={messages.data()} />}
 *     {messages.error() && <Error error={messages.error()} />}
 *   </div>
 * );
 * ```
 */
export function useSubscription<T = any>(
  channel: string,
  options: SubscriptionOptions<T> = {}
): Subscription<T> {
  if (!globalManager) {
    throw new Error('Realtime not initialized. Call initRealtime() first.');
  }

  return globalManager.subscribe<T>(channel, options);
}

// ============================================================================
// Server-Side Helpers
// ============================================================================

/**
 * Create SSE response
 */
export function createSSEResponse(options: {
  onSubscribe: (send: (data: any) => void) => () => void;
}): Response {
  const { onSubscribe } = options;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        const message: RealtimeMessage = {
          id: Date.now().toString(),
          type: 'data',
          channel: '__sse__',
          data,
          timestamp: Date.now(),
        };

        const text = `data: ${JSON.stringify(message)}\n\n`;
        controller.enqueue(encoder.encode(text));
      };

      // Send initial connection message
      send({ type: 'connected' });

      // Set up subscription
      const unsubscribe = onSubscribe(send);

      // Cleanup on close
      return () => {
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * WebSocket upgrade helper
 */
export interface WebSocketHandler {
  onConnect?: (socket: WebSocket) => void;
  onMessage?: (socket: WebSocket, message: any) => void;
  onClose?: (socket: WebSocket) => void;
  onError?: (socket: WebSocket, error: Error) => void;
}

export function handleWebSocketUpgrade(
  request: Request,
  handler: WebSocketHandler
): Response {
  const upgrade = request.headers.get('upgrade');

  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // This would be platform-specific (Cloudflare, Deno, Bun, etc.)
  // For now, return a basic response
  return new Response(null, { status: 101 });
}
