/**
 * PhilJS GraphQL Subscriptions
 *
 * Provides robust WebSocket-based GraphQL subscriptions with:
 * - graphql-ws protocol support
 * - Automatic reconnection with exponential backoff
 * - Signal-based subscription state management
 * - Connection pooling for multiple subscriptions
 * - Heartbeat/keepalive support
 */

import { signal, memo, batch, type Signal, type Memo } from '@philjs/core';
import type { DocumentNode } from 'graphql';

export interface SubscriptionConfig {
  /** WebSocket endpoint URL */
  url: string;
  /** Connection timeout in milliseconds (default: 5000) */
  connectionTimeout?: number;
  /** Maximum reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Base delay for reconnection in ms (default: 1000) */
  reconnectDelay?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Enable keepalive pings (default: true) */
  keepalive?: boolean;
  /** Keepalive interval in ms (default: 30000) */
  keepaliveInterval?: number;
  /** Custom headers for WebSocket connection */
  connectionParams?: () => Record<string, any> | Promise<Record<string, any>>;
  /** Lazy connection - only connect when first subscription is created */
  lazy?: boolean;
}

export interface SubscriptionOptions<TData = any, TVariables = any> {
  /** GraphQL subscription document */
  query: string | DocumentNode;
  /** Subscription variables */
  variables?: TVariables;
  /** Operation name (optional) */
  operationName?: string;
  /** Callback for subscription data */
  onData?: (data: TData) => void;
  /** Callback for subscription errors */
  onError?: (error: Error) => void;
  /** Callback for subscription completion */
  onComplete?: () => void;
}

export interface SubscriptionState<TData = any> {
  /** Current subscription data */
  data: TData | null;
  /** Subscription error if any */
  error: Error | null;
  /** Whether subscription is active */
  active: boolean;
  /** Connection state */
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
}

interface Subscription {
  id: string;
  query: string;
  variables?: any;
  operationName?: string;
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  state: Signal<SubscriptionState>;
}

const MessageType = {
  ConnectionInit: 'connection_init',
  ConnectionAck: 'connection_ack',
  Ping: 'ping',
  Pong: 'pong',
  Subscribe: 'subscribe',
  Next: 'next',
  Error: 'error',
  Complete: 'complete',
} as const;

type MessageType = (typeof MessageType)[keyof typeof MessageType];

interface Message {
  id?: string;
  type: MessageType;
  payload?: any;
}

/**
 * GraphQL WebSocket Subscription Client
 * Implements the graphql-ws protocol
 */
export class SubscriptionClient {
  private config: Required<SubscriptionConfig>;
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Subscription>();
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private keepaliveTimer: NodeJS.Timeout | null = null;
  private connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  private messageQueue: Message[] = [];
  private subscriptionIdCounter = 0;

  constructor(config: SubscriptionConfig) {
    this.config = {
      connectionTimeout: 5000,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      backoffMultiplier: 2,
      keepalive: true,
      keepaliveInterval: 30000,
      connectionParams: () => ({}),
      lazy: false,
      ...config,
    };

    if (!this.config.lazy) {
      this.connect();
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): Signal<'disconnected' | 'connecting' | 'connected' | 'reconnecting'> {
    return this.connectionState;
  }

  /**
   * Create a new subscription
   */
  subscribe<TData = any, TVariables = any>(
    options: SubscriptionOptions<TData, TVariables>
  ): SubscriptionHandle<TData> {
    const id = this.generateSubscriptionId();
    const query = this.documentToString(options.query);

    const state = signal<SubscriptionState<TData>>({
      data: null,
      error: null,
      active: false,
      connectionState: this.connectionState(),
    });

    const subscription: Subscription = {
      id,
      query,
      state: state as Signal<SubscriptionState>,
      ...(options.variables !== undefined && { variables: options.variables }),
      ...(options.operationName !== undefined && { operationName: options.operationName }),
      ...(options.onData !== undefined && { onData: options.onData }),
      ...(options.onError !== undefined && { onError: options.onError }),
      ...(options.onComplete !== undefined && { onComplete: options.onComplete }),
    };

    this.subscriptions.set(id, subscription);

    // Connect if lazy and this is the first subscription
    if (this.config.lazy && !this.ws) {
      this.connect();
    }

    // Send subscription message if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscribe(subscription);
    } else {
      // Queue the subscription to be sent when connected
      this.messageQueue.push({
        id,
        type: MessageType.Subscribe,
        payload: {
          query,
          variables: options.variables,
          operationName: options.operationName,
        },
      });
    }

    return new SubscriptionHandle(this, id, state);
  }

  /**
   * Unsubscribe from a subscription
   */
  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return;

    // Send complete message if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        id,
        type: MessageType.Complete,
      });
    }

    // Update state
    batch(() => {
      subscription.state.set({
        ...subscription.state(),
        active: false,
      });
    });

    this.subscriptions.delete(id);

    // Disconnect if lazy and no more subscriptions
    if (this.config.lazy && this.subscriptions.size === 0) {
      this.disconnect();
    }
  }

  /**
   * Connect to WebSocket
   */
  private connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionState.set('connecting');

    try {
      this.ws = new WebSocket(this.config.url, 'graphql-transport-ws');

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = (event) => this.handleClose(event);

      // Set connection timeout
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          this.handleConnectionTimeout();
        }
      }, this.config.connectionTimeout);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  private disconnect(): void {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connectionState.set('disconnected');
  }

  /**
   * Handle WebSocket open
   */
  private async handleOpen(): Promise<void> {
    // Send connection_init message
    const payload = this.config.connectionParams
      ? await this.config.connectionParams()
      : {};

    this.send({
      type: MessageType.ConnectionInit,
      payload,
    });
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    const message: Message = JSON.parse(event.data);

    switch (message.type) {
      case MessageType.ConnectionAck:
        this.handleConnectionAck();
        break;

      case MessageType.Ping:
        this.send({ type: MessageType.Pong });
        break;

      case MessageType.Next:
        this.handleNext(message);
        break;

      case MessageType.Error:
        this.handleSubscriptionError(message);
        break;

      case MessageType.Complete:
        this.handleComplete(message);
        break;
    }
  }

  /**
   * Handle connection acknowledgment
   */
  private handleConnectionAck(): void {
    this.connectionState.set('connected');
    this.reconnectAttempt = 0;

    // Update all subscription states
    batch(() => {
      this.subscriptions.forEach((sub) => {
        sub.state.set({
          ...sub.state(),
          connectionState: 'connected',
          active: true,
        });
      });
    });

    // Send queued messages
    this.messageQueue.forEach((msg) => this.send(msg));
    this.messageQueue = [];

    // Resubscribe to all active subscriptions
    this.subscriptions.forEach((sub) => {
      this.sendSubscribe(sub);
    });

    // Start keepalive
    if (this.config.keepalive) {
      this.startKeepalive();
    }
  }

  /**
   * Handle subscription data
   */
  private handleNext(message: Message): void {
    if (!message.id) return;

    const subscription = this.subscriptions.get(message.id);
    if (!subscription) return;

    const data = message.payload?.data;

    batch(() => {
      subscription.state.set({
        ...subscription.state(),
        data,
        error: null,
      });
    });

    if (subscription.onData) {
      subscription.onData(data);
    }
  }

  /**
   * Handle subscription error
   */
  private handleSubscriptionError(message: Message): void {
    if (!message.id) return;

    const subscription = this.subscriptions.get(message.id);
    if (!subscription) return;

    const error = new Error(
      message.payload?.message || 'Subscription error'
    );

    batch(() => {
      subscription.state.set({
        ...subscription.state(),
        error,
      });
    });

    if (subscription.onError) {
      subscription.onError(error);
    }
  }

  /**
   * Handle subscription completion
   */
  private handleComplete(message: Message): void {
    if (!message.id) return;

    const subscription = this.subscriptions.get(message.id);
    if (!subscription) return;

    batch(() => {
      subscription.state.set({
        ...subscription.state(),
        active: false,
      });
    });

    if (subscription.onComplete) {
      subscription.onComplete();
    }

    this.subscriptions.delete(message.id);
  }

  /**
   * Handle WebSocket error
   */
  private handleError(error: Event | Error): void {
    console.error('WebSocket error:', error);

    // Notify all subscriptions
    batch(() => {
      this.subscriptions.forEach((sub) => {
        const err = error instanceof Error ? error : new Error('WebSocket error');
        sub.state.set({
          ...sub.state(),
          error: err,
        });

        if (sub.onError) {
          sub.onError(err);
        }
      });
    });
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(event: CloseEvent): void {
    this.connectionState.set('disconnected');

    // Clear keepalive
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }

    // Update subscription states
    batch(() => {
      this.subscriptions.forEach((sub) => {
        sub.state.set({
          ...sub.state(),
          connectionState: 'disconnected',
          active: false,
        });
      });
    });

    // Attempt reconnection if not a clean close
    if (!event.wasClean && this.subscriptions.size > 0) {
      this.reconnect();
    }
  }

  /**
   * Handle connection timeout
   */
  private handleConnectionTimeout(): void {
    console.error('WebSocket connection timeout');
    this.reconnect();
  }

  /**
   * Reconnect with exponential backoff
   */
  private reconnect(): void {
    if (this.reconnectAttempt >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');

      const error = new Error('Failed to reconnect after maximum attempts');
      batch(() => {
        this.subscriptions.forEach((sub) => {
          sub.state.set({
            ...sub.state(),
            error,
          });

          if (sub.onError) {
            sub.onError(error);
          }
        });
      });

      return;
    }

    this.connectionState.set('reconnecting');

    const delay =
      this.config.reconnectDelay *
      Math.pow(this.config.backoffMultiplier, this.reconnectAttempt);

    this.reconnectAttempt++;

    console.log(
      `Reconnecting attempt ${this.reconnectAttempt} in ${delay}ms...`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start keepalive pings
   */
  private startKeepalive(): void {
    this.keepaliveTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: MessageType.Ping });
      }
    }, this.config.keepaliveInterval);
  }

  /**
   * Send a message to the WebSocket
   */
  private send(message: Message): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send subscribe message
   */
  private sendSubscribe(subscription: Subscription): void {
    this.send({
      id: subscription.id,
      type: MessageType.Subscribe,
      payload: {
        query: subscription.query,
        variables: subscription.variables,
        operationName: subscription.operationName,
      },
    });
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${++this.subscriptionIdCounter}_${Date.now()}`;
  }

  /**
   * Convert DocumentNode to string if needed
   */
  private documentToString(doc: string | DocumentNode): string {
    if (typeof doc === 'string') {
      return doc;
    }
    return (doc as any).loc?.source?.body || String(doc);
  }

  /**
   * Close all subscriptions and disconnect
   */
  close(): void {
    this.subscriptions.forEach((_, id) => {
      this.unsubscribe(id);
    });
    this.disconnect();
  }
}

/**
 * Subscription handle returned to consumers
 */
export class SubscriptionHandle<TData = any> {
  constructor(
    private client: SubscriptionClient,
    private id: string,
    public state: Signal<SubscriptionState<TData>>
  ) {}

  /**
   * Get current subscription data
   */
  get data(): Memo<TData | null> {
    return memo(() => this.state().data);
  }

  /**
   * Get current subscription error
   */
  get error(): Memo<Error | null> {
    return memo(() => this.state().error);
  }

  /**
   * Check if subscription is active
   */
  get active(): Memo<boolean> {
    return memo(() => this.state().active);
  }

  /**
   * Get connection state
   */
  get connectionState(): Memo<'disconnected' | 'connecting' | 'connected' | 'reconnecting'> {
    return memo(() => this.state().connectionState);
  }

  /**
   * Unsubscribe and clean up
   */
  unsubscribe(): void {
    this.client.unsubscribe(this.id);
  }
}

/**
 * Create a subscription client
 */
export function createSubscriptionClient(config: SubscriptionConfig): SubscriptionClient {
  return new SubscriptionClient(config);
}

/**
 * Hook for using subscriptions with reactive state
 */
export function useSubscription<TData = any, TVariables = any>(
  client: SubscriptionClient,
  options: SubscriptionOptions<TData, TVariables>
): {
  data: Memo<TData | null>;
  error: Memo<Error | null>;
  active: Memo<boolean>;
  connectionState: Memo<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>;
  unsubscribe: () => void;
} {
  const handle = client.subscribe(options);

  return {
    data: handle.data,
    error: handle.error,
    active: handle.active,
    connectionState: handle.connectionState,
    unsubscribe: () => handle.unsubscribe(),
  };
}
