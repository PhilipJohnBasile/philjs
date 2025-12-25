/**
 * Transport Layer for PhilJS Collab
 *
 * Provides WebSocket and WebRTC transport for real-time collaboration
 */

export type MessageType =
  | 'sync'
  | 'awareness'
  | 'presence'
  | 'cursor'
  | 'operation'
  | 'ack'
  | 'error'
  | 'ping'
  | 'pong';

export interface CollabMessage<T = unknown> {
  type: MessageType;
  roomId: string;
  clientId: string;
  payload: T;
  timestamp: number;
  version?: number;
}

export interface TransportConfig {
  url: string;
  roomId: string;
  clientId: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  messageQueueSize?: number;
}

export interface TransportEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  message: (message: CollabMessage) => void;
  error: (error: Error) => void;
  reconnecting: (attempt: number) => void;
}

export type TransportEventHandler<K extends keyof TransportEvents> = TransportEvents[K];

/**
 * WebSocket Transport for collaboration
 */
export class WebSocketTransport {
  private ws: WebSocket | null = null;
  private config: Required<TransportConfig>;
  private handlers: Map<keyof TransportEvents, Set<(...args: unknown[]) => void>> = new Map();
  private messageQueue: CollabMessage[] = [];
  private reconnectAttempts = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;

  constructor(config: TransportConfig) {
    this.config = {
      url: config.url,
      roomId: config.roomId,
      clientId: config.clientId,
      reconnect: config.reconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 1000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      pingInterval: config.pingInterval ?? 30000,
      messageQueueSize: config.messageQueueSize ?? 100,
    };
  }

  /**
   * Connect to the server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.config.url);
        url.searchParams.set('room', this.config.roomId);
        url.searchParams.set('client', this.config.clientId);

        this.ws = new WebSocket(url.toString());

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.startPing();
          this.flushQueue();
          this.emit('connect');
          resolve();
        };

        this.ws.onclose = (event) => {
          this.connected = false;
          this.stopPing();
          this.emit('disconnect', event.reason || 'Connection closed');

          if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = () => {
          const error = new Error('WebSocket error');
          this.emit('error', error);
          if (!this.connected) {
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as CollabMessage;

            if (message.type === 'pong') {
              return;
            }

            this.emit('message', message);
          } catch (error) {
            this.emit('error', new Error(`Invalid message: ${error}`));
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.config.reconnect = false;
    this.stopPing();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Send a message
   */
  send<T>(type: MessageType, payload: T): void {
    const message: CollabMessage<T> = {
      type,
      roomId: this.config.roomId,
      clientId: this.config.clientId,
      payload,
      timestamp: Date.now(),
    };

    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.messageQueue.push(message as CollabMessage);
      if (this.messageQueue.length > this.config.messageQueueSize) {
        this.messageQueue.shift();
      }
    }
  }

  /**
   * Subscribe to events
   */
  on<K extends keyof TransportEvents>(event: K, handler: TransportEventHandler<K>): () => void {
    let handlers = this.handlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(event, handlers);
    }
    handlers.add(handler as (...args: unknown[]) => void);

    return () => {
      handlers!.delete(handler as (...args: unknown[]) => void);
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  private emit<K extends keyof TransportEvents>(event: K, ...args: Parameters<TransportEvents[K]>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send('ping', {});
    }, this.config.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnect failed, will try again if attempts remain
      });
    }, delay);
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()!;
      this.ws!.send(JSON.stringify(message));
    }
  }
}

/**
 * Broadcast Channel Transport for same-origin tabs
 */
export class BroadcastTransport {
  private channel: BroadcastChannel;
  private config: { roomId: string; clientId: string };
  private handlers: Map<keyof TransportEvents, Set<(...args: unknown[]) => void>> = new Map();

  constructor(config: { roomId: string; clientId: string }) {
    this.config = config;
    this.channel = new BroadcastChannel(`philjs-collab:${config.roomId}`);

    this.channel.onmessage = (event) => {
      const message = event.data as CollabMessage;
      if (message.clientId !== this.config.clientId) {
        this.emit('message', message);
      }
    };
  }

  send<T>(type: MessageType, payload: T): void {
    const message: CollabMessage<T> = {
      type,
      roomId: this.config.roomId,
      clientId: this.config.clientId,
      payload,
      timestamp: Date.now(),
    };

    this.channel.postMessage(message);
  }

  on<K extends keyof TransportEvents>(event: K, handler: TransportEventHandler<K>): () => void {
    let handlers = this.handlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(event, handlers);
    }
    handlers.add(handler as (...args: unknown[]) => void);

    return () => {
      handlers!.delete(handler as (...args: unknown[]) => void);
    };
  }

  close(): void {
    this.channel.close();
  }

  private emit<K extends keyof TransportEvents>(event: K, ...args: Parameters<TransportEvents[K]>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }
}

/**
 * Create a WebSocket transport
 */
export function createWebSocketTransport(config: TransportConfig): WebSocketTransport {
  return new WebSocketTransport(config);
}

/**
 * Create a Broadcast Channel transport
 */
export function createBroadcastTransport(config: { roomId: string; clientId: string }): BroadcastTransport {
  return new BroadcastTransport(config);
}

/**
 * Generate a unique client ID
 */
export function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
