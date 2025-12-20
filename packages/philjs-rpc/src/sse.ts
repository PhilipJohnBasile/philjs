/**
 * Server-Sent Events (SSE) transport for philjs-rpc subscriptions.
 * Provides a fallback when WebSocket is unavailable with the same API.
 */

import { signal, effect } from 'philjs-core';
import type {
  RPCError,
  UseSubscriptionOptions,
  UseSubscriptionResult,
  SubscriptionObserver,
  SubscriptionEventMap,
} from './types.js';

// ============================================================================
// SSE Connection Manager
// ============================================================================

export interface SSEConnectionConfig {
  /** SSE endpoint URL */
  url: string;
  /** Reconnection settings */
  reconnect?: {
    /** Enable automatic reconnection */
    enabled?: boolean;
    /** Maximum number of reconnection attempts */
    maxAttempts?: number;
    /** Delay between reconnection attempts in ms */
    delay?: number;
    /** Maximum delay between reconnection attempts in ms */
    maxDelay?: number;
    /** Backoff multiplier */
    backoffMultiplier?: number;
  };
  /** Custom headers */
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  /** Custom fetch implementation */
  fetch?: typeof fetch;
  /** Heartbeat timeout in ms (close connection if no message received) */
  heartbeatTimeout?: number;
  /** Whether to include credentials in requests */
  withCredentials?: boolean;
}

export interface SSEMessage {
  type: 'data' | 'error' | 'complete' | 'heartbeat';
  id: string;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export class SSEConnection {
  private config: Required<SSEConnectionConfig>;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private subscriptions = new Map<string, SubscriptionState>();
  private eventSources = new Map<string, EventSource>();
  private connectionState = signal<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  private eventHandlers = new Map<keyof SubscriptionEventMap, Set<Function>>();
  private abortControllers = new Map<string, AbortController>();

  constructor(config: SSEConnectionConfig) {
    this.config = {
      url: config.url,
      reconnect: {
        enabled: config.reconnect?.enabled ?? true,
        maxAttempts: config.reconnect?.maxAttempts ?? 10,
        delay: config.reconnect?.delay ?? 1000,
        maxDelay: config.reconnect?.maxDelay ?? 30000,
        backoffMultiplier: config.reconnect?.backoffMultiplier ?? 1.5,
      },
      headers: config.headers ?? {},
      fetch: config.fetch ?? (typeof fetch !== 'undefined' ? fetch : null as any),
      heartbeatTimeout: config.heartbeatTimeout ?? 60000,
      withCredentials: config.withCredentials ?? false,
    };
  }

  /**
   * Connect to the SSE server (no-op for SSE, connection is per-subscription).
   */
  async connect(): Promise<void> {
    this.connectionState.set('connected');
    this.emit('connected', {});
  }

  /**
   * Disconnect from the SSE server.
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    // Close all EventSource connections
    for (const [id, eventSource] of this.eventSources) {
      eventSource.close();
    }
    this.eventSources.clear();

    // Abort all in-flight requests
    for (const [id, controller] of this.abortControllers) {
      controller.abort();
    }
    this.abortControllers.clear();

    this.connectionState.set('disconnected');
  }

  /**
   * Subscribe to a procedure using SSE.
   */
  subscribe<TInput, TOutput>(
    id: string,
    path: string,
    input: TInput,
    observer: SubscriptionObserver<TOutput>
  ): () => void {
    // Store subscription state
    this.subscriptions.set(id, {
      id,
      path,
      input,
      observer: observer as SubscriptionObserver<unknown>,
    });

    // Create SSE connection for this subscription
    this.createEventSource(id, path, input, observer as SubscriptionObserver<unknown>);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(id);
    };
  }

  /**
   * Unsubscribe from a procedure.
   */
  private unsubscribe(id: string): void {
    this.subscriptions.delete(id);

    const eventSource = this.eventSources.get(id);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(id);
    }

    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(id);
    }
  }

  /**
   * Get connection state.
   */
  getState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.connectionState();
  }

  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.connectionState() === 'connected';
  }

  /**
   * Add event listener.
   */
  on<K extends keyof SubscriptionEventMap>(
    event: K,
    handler: (data: SubscriptionEventMap[K]) => void
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emit event.
   */
  private emit<K extends keyof SubscriptionEventMap>(event: K, data: SubscriptionEventMap[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  }

  /**
   * Create an EventSource for a subscription.
   */
  private async createEventSource<TInput>(
    id: string,
    path: string,
    input: TInput,
    observer: SubscriptionObserver<unknown>
  ): Promise<void> {
    try {
      // Build SSE URL with subscription parameters
      const url = new URL(this.config.url);
      url.searchParams.set('id', id);
      url.searchParams.set('path', path);
      url.searchParams.set('input', JSON.stringify(input));

      // EventSource doesn't support custom headers, so we use a workaround for auth
      // In production, you might want to use query params for auth tokens
      const headers = await this.getHeaders();
      if (Object.keys(headers).length > 0) {
        // Add headers as query params (less secure, use HTTPS)
        for (const [key, value] of Object.entries(headers)) {
          url.searchParams.set(`header_${key}`, value);
        }
      }

      const eventSource = new EventSource(url.toString(), {
        withCredentials: this.config.withCredentials,
      });

      this.eventSources.set(id, eventSource);
      this.resetHeartbeatTimeout();

      eventSource.onopen = () => {
        this.connectionState.set('connected');
        this.emit('connected', {});
      };

      eventSource.addEventListener('message', (event) => {
        this.resetHeartbeatTimeout();

        try {
          const message: SSEMessage = JSON.parse(event.data);
          this.handleMessage(message, observer);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      });

      eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);
        this.connectionState.set('error');
        this.emit('error', { error: new Error('SSE connection error') });

        // Close and remove the event source
        eventSource.close();
        this.eventSources.delete(id);

        // Attempt reconnection
        this.attemptReconnect(id, path, input, observer);
      });

      eventSource.addEventListener('complete', () => {
        if (observer.complete) {
          observer.complete();
        }
        eventSource.close();
        this.eventSources.delete(id);
      });

    } catch (error) {
      this.connectionState.set('error');
      this.emit('error', { error: error as Error });
      if (observer.error) {
        observer.error(error as RPCError);
      }
    }
  }

  /**
   * Handle incoming SSE message.
   */
  private handleMessage(message: SSEMessage, observer: SubscriptionObserver<unknown>): void {
    switch (message.type) {
      case 'data': {
        if (observer.next) {
          observer.next(message.data);
        }
        break;
      }

      case 'error': {
        if (observer.error) {
          const error = new Error(message.error?.message ?? 'Subscription error');
          (error as any).code = message.error?.code;
          observer.error(error as RPCError);
        }
        break;
      }

      case 'complete': {
        if (observer.complete) {
          observer.complete();
        }
        break;
      }

      case 'heartbeat': {
        // Reset heartbeat timeout
        this.resetHeartbeatTimeout();
        break;
      }
    }
  }

  /**
   * Attempt to reconnect a subscription.
   */
  private attemptReconnect<TInput>(
    id: string,
    path: string,
    input: TInput,
    observer: SubscriptionObserver<unknown>
  ): void {
    if (!this.config.reconnect.enabled) return;
    if (this.reconnectAttempts >= this.config.reconnect.maxAttempts) {
      this.emit('reconnectFailed', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnect.delay * Math.pow(this.config.reconnect.backoffMultiplier, this.reconnectAttempts - 1),
      this.config.reconnect.maxDelay
    );

    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimeout = setTimeout(() => {
      // Check if subscription still exists
      if (this.subscriptions.has(id)) {
        this.createEventSource(id, path, input, observer);
      }
    }, delay);
  }

  /**
   * Reset heartbeat timeout.
   */
  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    this.heartbeatTimeout = setTimeout(() => {
      // No heartbeat received, close connections
      this.connectionState.set('error');
      this.emit('error', { error: new Error('Heartbeat timeout') });
      this.disconnect();
    }, this.config.heartbeatTimeout);
  }

  /**
   * Get headers for requests.
   */
  private async getHeaders(): Promise<Record<string, string>> {
    if (typeof this.config.headers === 'function') {
      return this.config.headers();
    }
    return this.config.headers;
  }
}

interface SubscriptionState {
  id: string;
  path: string;
  input: unknown;
  observer: SubscriptionObserver<unknown>;
}

// ============================================================================
// useSubscription Hook for SSE
// ============================================================================

let sseSubscriptionIdCounter = 0;

/**
 * Create a subscription hook for SSE-based real-time data.
 *
 * @example
 * ```ts
 * const messages = client.chat.onMessage.useSubscription(
 *   { roomId: 'general' },
 *   {
 *     onData: (msg) => console.log('New message:', msg),
 *     onError: (err) => console.error('Subscription error:', err),
 *   }
 * );
 * ```
 */
export function createUseSSESubscription<TInput, TOutput>(
  connection: SSEConnection,
  path: string
): (
  input: TInput,
  options?: UseSubscriptionOptions<TOutput>
) => UseSubscriptionResult<TOutput> {
  return (input: TInput, options?: UseSubscriptionOptions<TOutput>) => {
    const {
      enabled = true,
      onData,
      onError,
      onComplete,
      onStart,
      retryOnError = true,
      retryDelay = 1000,
    } = options ?? {};

    const subscriptionId = `sse-sub-${sseSubscriptionIdCounter++}`;
    const data = signal<TOutput[]>([]);
    const lastData = signal<TOutput | undefined>(undefined);
    const error = signal<RPCError | null>(null);
    const status = signal<'idle' | 'connecting' | 'subscribed' | 'error'>('idle');

    let unsubscribe: (() => void) | null = null;

    const subscribe = () => {
      if (!enabled) return;

      status.set('connecting');

      if (onStart) {
        onStart();
      }

      // Ensure connection is established
      if (!connection.isConnected()) {
        connection.connect().then(() => {
          startSubscription();
        }).catch((err) => {
          status.set('error');
          error.set(err as RPCError);
          if (onError) {
            onError(err as RPCError);
          }
        });
      } else {
        startSubscription();
      }
    };

    const startSubscription = () => {
      unsubscribe = connection.subscribe<TInput, TOutput>(
        subscriptionId,
        path,
        input,
        {
          next: (value: TOutput) => {
            status.set('subscribed');
            error.set(null);
            lastData.set(value);
            data.set([...data(), value]);

            if (onData) {
              onData(value);
            }
          },
          error: (err: RPCError) => {
            status.set('error');
            error.set(err);

            if (onError) {
              onError(err);
            }

            // Retry on error if enabled
            if (retryOnError) {
              setTimeout(() => {
                if (enabled) {
                  subscribe();
                }
              }, retryDelay);
            }
          },
          complete: () => {
            status.set('idle');

            if (onComplete) {
              onComplete();
            }
          },
        }
      );
    };

    // Start subscription
    subscribe();

    // Cleanup on unmount
    effect(() => {
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    });

    return {
      get data() {
        return data();
      },
      get lastData() {
        return lastData();
      },
      get error() {
        return error();
      },
      get status() {
        return status();
      },
      get isSubscribed() {
        return status() === 'subscribed';
      },
      get isError() {
        return status() === 'error';
      },
      reset: () => {
        data.set([]);
        lastData.set(undefined);
        error.set(null);
        status.set('idle');
      },
      resubscribe: () => {
        if (unsubscribe) {
          unsubscribe();
        }
        subscribe();
      },
    };
  };
}

// ============================================================================
// SSE Transport Detection
// ============================================================================

/**
 * Check if SSE is supported in the current environment.
 */
export function isSSESupported(): boolean {
  return typeof EventSource !== 'undefined';
}

/**
 * Create a transport that automatically selects between WebSocket and SSE.
 */
export function createAutoTransport(config: {
  wsUrl: string;
  sseUrl: string;
  preferWebSocket?: boolean;
}): {
  connection: any;
  type: 'websocket' | 'sse';
} {
  const { wsUrl, sseUrl, preferWebSocket = true } = config;

  // Check WebSocket support
  const wsSupported = typeof WebSocket !== 'undefined';
  const sseSupported = isSSESupported();

  if (preferWebSocket && wsSupported) {
    const { WebSocketConnection } = require('./subscriptions.js');
    return {
      connection: new WebSocketConnection({ url: wsUrl }),
      type: 'websocket',
    };
  } else if (sseSupported) {
    return {
      connection: new SSEConnection({ url: sseUrl }),
      type: 'sse',
    };
  } else if (wsSupported) {
    const { WebSocketConnection } = require('./subscriptions.js');
    return {
      connection: new WebSocketConnection({ url: wsUrl }),
      type: 'websocket',
    };
  } else {
    throw new Error('Neither WebSocket nor SSE is supported in this environment');
  }
}
