/**
 * WebSocket-based subscriptions for philjs-rpc.
 * Provides real-time data streaming with automatic reconnection and lifecycle hooks.
 */

import { signal, effect } from '@philjs/core';
import type {
  RPCError,
  ProcedureContext,
  UseSubscriptionOptions,
  UseSubscriptionResult,
  SubscriptionHandler,
  SubscriptionObserver,
  SubscriptionEventMap,
} from './types.js';

// ============================================================================
// WebSocket Connection Manager
// ============================================================================

export interface WebSocketConnectionConfig {
  /** WebSocket URL */
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
  /** Connection timeout in ms */
  connectionTimeout?: number;
  /** Heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Custom WebSocket implementation */
  WebSocketImpl?: typeof WebSocket;
  /** Custom headers (for node environments) */
  headers?: Record<string, string>;
  /** Protocols */
  protocols?: string | string[];
}

interface ResolvedWebSocketConnectionConfig {
  url: string;
  reconnect: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  connectionTimeout: number;
  heartbeatInterval: number;
  WebSocketImpl: typeof WebSocket;
  headers: Record<string, string>;
  protocols: string | string[];
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'data' | 'error' | 'complete' | 'ping' | 'pong';
  id?: string;
  path?: string;
  input?: unknown;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private config: ResolvedWebSocketConnectionConfig;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private subscriptions = new Map<string, SubscriptionState>();
  private connectionState = signal<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  private messageHandlers = new Set<(message: WebSocketMessage) => void>();
  private eventHandlers = new Map<keyof SubscriptionEventMap, Set<Function>>();

  constructor(config: WebSocketConnectionConfig) {
    this.config = {
      url: config.url,
      reconnect: {
        enabled: config.reconnect?.enabled ?? true,
        maxAttempts: config.reconnect?.maxAttempts ?? 10,
        delay: config.reconnect?.delay ?? 1000,
        maxDelay: config.reconnect?.maxDelay ?? 30000,
        backoffMultiplier: config.reconnect?.backoffMultiplier ?? 1.5,
      },
      connectionTimeout: config.connectionTimeout ?? 10000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      WebSocketImpl: config.WebSocketImpl ?? (typeof WebSocket !== 'undefined' ? WebSocket : null as any),
      headers: config.headers ?? {},
      protocols: config.protocols ?? [],
    };
  }

  /**
   * Connect to the WebSocket server.
   */
  async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.connectionState.set('connecting');
      this.emit('connecting', {});

      const timeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          const error = new Error('Connection timeout');
          this.connectionState.set('error');
          this.emit('error', { error });
          reject(error);
        }
      }, this.config.connectionTimeout);

      try {
        this.ws = new this.config.WebSocketImpl(
          this.config.url,
          this.config.protocols
        );

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.connectionState.set('connected');
          this.reconnectAttempts = 0;
          this.emit('connected', {});
          this.startHeartbeat();
          this.resubscribeAll();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (event) => {
          clearTimeout(timeout);
          this.connectionState.set('error');
          this.emit('error', { error: new Error('WebSocket error') });
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          this.connectionState.set('disconnected');
          this.emit('disconnected', {});
          this.stopHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        clearTimeout(timeout);
        this.connectionState.set('error');
        this.emit('error', { error: error as Error });
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection
      this.ws.close();
      this.ws = null;
    }

    this.connectionState.set('disconnected');
  }

  /**
   * Subscribe to a procedure.
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

    // Send subscribe message if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'subscribe',
        id,
        path,
        input,
      });
    }

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

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'unsubscribe',
        id,
      });
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
   * Send a message to the server.
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming message.
   */
  private handleMessage(message: WebSocketMessage): void {
    // Notify message handlers
    for (const handler of this.messageHandlers) {
      handler(message);
    }

    // Handle specific message types
    switch (message.type) {
      case 'data': {
        const subscription = this.subscriptions.get(message.id!);
        if (subscription?.observer.next) {
          subscription.observer.next(message.data);
        }
        break;
      }

      case 'error': {
        const subscription = this.subscriptions.get(message.id!);
        if (subscription?.observer.error) {
          const error = new Error(message.error?.message ?? 'Subscription error');
          (error as any).code = message.error?.code;
          subscription.observer.error(error as RPCError);
        }
        break;
      }

      case 'complete': {
        const subscription = this.subscriptions.get(message.id!);
        if (subscription?.observer.complete) {
          subscription.observer.complete();
        }
        this.subscriptions.delete(message.id!);
        break;
      }

      case 'pong': {
        // Heartbeat response
        break;
      }
    }
  }

  /**
   * Attempt to reconnect.
   */
  private attemptReconnect(): void {
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
      this.connect().catch(() => {
        // Reconnection failed, will retry
      });
    }, delay);
  }

  /**
   * Resubscribe to all active subscriptions.
   */
  private resubscribeAll(): void {
    for (const [id, subscription] of this.subscriptions) {
      this.sendMessage({
        type: 'subscribe',
        id,
        path: subscription.path,
        input: subscription.input,
      });
    }
  }

  /**
   * Start heartbeat to keep connection alive.
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat.
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

interface SubscriptionState {
  id: string;
  path: string;
  input: unknown;
  observer: SubscriptionObserver<unknown>;
}

// ============================================================================
// useSubscription Hook
// ============================================================================

let subscriptionIdCounter = 0;

/**
 * Create a subscription hook for real-time data.
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
export function createUseSubscription<TInput, TOutput>(
  connection: WebSocketConnection,
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

    const subscriptionId = `sub-${subscriptionIdCounter++}`;
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
// Subscription State Persistence
// ============================================================================

export interface SubscriptionStateManager {
  /** Save subscription state */
  save(key: string, state: unknown): void;
  /** Load subscription state */
  load(key: string): unknown | undefined;
  /** Clear subscription state */
  clear(key: string): void;
  /** Clear all subscription states */
  clearAll(): void;
}

/**
 * Create a localStorage-based state manager.
 */
export function createLocalStorageStateManager(prefix = 'philjs-rpc-sub'): SubscriptionStateManager {
  return {
    save(key: string, state: unknown): void {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`${prefix}:${key}`, JSON.stringify(state));
        }
      } catch (error) {
        console.error('Failed to save subscription state:', error);
      }
    },

    load(key: string): unknown | undefined {
      try {
        if (typeof localStorage !== 'undefined') {
          const item = localStorage.getItem(`${prefix}:${key}`);
          return item ? JSON.parse(item) : undefined;
        }
      } catch (error) {
        console.error('Failed to load subscription state:', error);
      }
      return undefined;
    },

    clear(key: string): void {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(`${prefix}:${key}`);
        }
      } catch (error) {
        console.error('Failed to clear subscription state:', error);
      }
    },

    clearAll(): void {
      try {
        if (typeof localStorage !== 'undefined') {
          const keys = Object.keys(localStorage).filter((k) => k.startsWith(`${prefix}:`));
          for (const key of keys) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('Failed to clear all subscription states:', error);
      }
    },
  };
}

/**
 * Create an in-memory state manager.
 */
export function createMemoryStateManager(): SubscriptionStateManager {
  const storage = new Map<string, unknown>();

  return {
    save(key: string, state: unknown): void {
      storage.set(key, state);
    },

    load(key: string): unknown | undefined {
      return storage.get(key);
    },

    clear(key: string): void {
      storage.delete(key);
    },

    clearAll(): void {
      storage.clear();
    },
  };
}
