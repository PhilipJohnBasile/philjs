/**
 * PhilJS LiveView - Socket Protocol Implementation
 */

import type {
  LiveMessage,
  JoinPayload,
  ViewPatch,
  LiveViewEvent,
  LiveSocket,
} from './types';

// ============================================================================
// Message Types
// ============================================================================

export const MESSAGE_TYPES = {
  PHX_JOIN: 'phx_join',
  PHX_LEAVE: 'phx_leave',
  PHX_REPLY: 'phx_reply',
  PHX_ERROR: 'phx_error',
  PHX_CLOSE: 'phx_close',
  EVENT: 'event',
  DIFF: 'diff',
  HEARTBEAT: 'heartbeat',
  LIVE_PATCH: 'live_patch',
  LIVE_REDIRECT: 'live_redirect',
  PUSH_PATCH: 'push_patch',
  PUSH_REDIRECT: 'push_redirect',
} as const;

// ============================================================================
// Channel
// ============================================================================

export interface Channel {
  topic: string;
  state: 'closed' | 'joining' | 'joined' | 'leaving' | 'errored';
  joinRef: number;
  onMessage: (message: any) => void;
  onClose: () => void;
  onError: (error: Error) => void;
}

export function createChannel(topic: string): Channel {
  let state: Channel['state'] = 'closed';
  let joinRef = 0;

  return {
    topic,
    get state() {
      return state;
    },
    set state(s: Channel['state']) {
      state = s;
    },
    get joinRef() {
      return joinRef;
    },
    set joinRef(ref: number) {
      joinRef = ref;
    },
    onMessage: () => {},
    onClose: () => {},
    onError: () => {},
  };
}

// ============================================================================
// Socket Connection Manager
// ============================================================================

export interface SocketConnectionOptions {
  url: string;
  params?: Record<string, any>;
  heartbeatIntervalMs?: number;
  reconnectAfterMs?: (tries: number) => number;
  timeout?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export class SocketConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private params: Record<string, any>;
  private heartbeatInterval: number;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private reconnectTries = 0;
  private reconnectAfterMs: (tries: number) => number;
  private timeout: number;
  private messageRef = 0;
  private pendingRefs = new Map<string, { resolve: (data: any) => void; reject: (err: Error) => void }>();
  private channels = new Map<string, Channel>();
  private callbacks: {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
  };

  public isConnected = false;

  constructor(options: SocketConnectionOptions) {
    this.url = options.url;
    this.params = options.params || {};
    this.heartbeatInterval = options.heartbeatIntervalMs || 30000;
    this.timeout = options.timeout || 10000;
    this.reconnectAfterMs = options.reconnectAfterMs || ((tries) => [1000, 2000, 5000, 10000][Math.min(tries, 3)]);
    this.callbacks = {
      onOpen: options.onOpen,
      onClose: options.onClose,
      onError: options.onError,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const urlWithParams = this.buildUrl();
    this.ws = new WebSocket(urlWithParams);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectTries = 0;
      this.startHeartbeat();
      this.callbacks.onOpen?.();

      // Rejoin all channels
      for (const channel of this.channels.values()) {
        if (channel.state === 'joined' || channel.state === 'joining') {
          channel.state = 'joining';
          // Re-join logic handled by channel
        }
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.stopHeartbeat();
      this.callbacks.onClose?.();
      this.scheduleReconnect();
    };

    this.ws.onerror = (event) => {
      this.callbacks.onError?.(event);
    };

    this.ws.onmessage = (event) => {
      const message = this.decode(event.data);
      this.handleMessage(message);
    };
  }

  disconnect(): void {
    this.stopHeartbeat();
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }

  channel(topic: string): Channel {
    if (this.channels.has(topic)) {
      return this.channels.get(topic)!;
    }

    const ch = createChannel(topic);
    this.channels.set(topic, ch);
    return ch;
  }

  async join(topic: string, payload: JoinPayload): Promise<any> {
    const channel = this.channel(topic);
    channel.state = 'joining';

    const ref = this.makeRef();
    channel.joinRef = parseInt(ref, 10);

    return this.pushWithReply(topic, MESSAGE_TYPES.PHX_JOIN, payload, ref);
  }

  leave(topic: string): void {
    const channel = this.channels.get(topic);
    if (channel) {
      channel.state = 'leaving';
      this.push(topic, MESSAGE_TYPES.PHX_LEAVE, {});
      this.channels.delete(topic);
    }
  }

  push(topic: string, event: string, payload: any, ref?: string): void {
    const message = [
      topic,
      event,
      payload,
      ref || this.makeRef(),
    ];

    this.send(message);
  }

  async pushWithReply(topic: string, event: string, payload: any, ref?: string): Promise<any> {
    const messageRef = ref || this.makeRef();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRefs.delete(messageRef);
        reject(new Error('Timeout'));
      }, this.timeout);

      this.pendingRefs.set(messageRef, {
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });

      this.push(topic, event, payload, messageRef);
    });
  }

  private buildUrl(): string {
    const url = new URL(this.url, window.location.origin);
    for (const [key, value] of Object.entries(this.params)) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private handleMessage(message: any): void {
    // Message format: [topic, event, payload, ref]
    const [topic, event, payload, ref] = message;

    // Handle replies
    if (event === MESSAGE_TYPES.PHX_REPLY && ref) {
      const pending = this.pendingRefs.get(ref);
      if (pending) {
        this.pendingRefs.delete(ref);
        if (payload.status === 'ok') {
          pending.resolve(payload.response);
        } else {
          pending.reject(new Error(payload.response?.reason || 'Error'));
        }
      }
    }

    // Handle channel-specific messages
    const channel = this.channels.get(topic);
    if (channel) {
      if (event === MESSAGE_TYPES.PHX_REPLY && ref === String(channel.joinRef)) {
        if (payload.status === 'ok') {
          channel.state = 'joined';
        } else {
          channel.state = 'errored';
          channel.onError(new Error(payload.response?.reason || 'Join error'));
        }
      }

      if (event === MESSAGE_TYPES.PHX_CLOSE) {
        channel.state = 'closed';
        channel.onClose();
      }

      // Forward to channel handler
      channel.onMessage({ topic, event, payload, ref });
    }
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(this.encode(message));
    }
  }

  private encode(data: any): string {
    return JSON.stringify(data);
  }

  private decode(data: string): any {
    return JSON.parse(data);
  }

  private makeRef(): string {
    this.messageRef++;
    return String(this.messageRef);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.push('phoenix', MESSAGE_TYPES.HEARTBEAT, {});
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private scheduleReconnect(): void {
    const delay = this.reconnectAfterMs(this.reconnectTries);
    this.reconnectTries++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// ============================================================================
// Event Serialization
// ============================================================================

export function serializeEvent(
  eventType: string,
  target: HTMLElement,
  value?: any
): LiveViewEvent {
  const event: LiveViewEvent = {
    type: eventType,
    value,
    target: target.getAttribute('id') || undefined,
  };

  // Add form data if applicable
  if (target instanceof HTMLFormElement) {
    const formData = new FormData(target);
    event.value = Object.fromEntries(formData.entries());
  }

  // Add input value
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    event.value = target.value;
  }

  // Add checkbox value
  if (target instanceof HTMLInputElement && target.type === 'checkbox') {
    event.value = target.checked;
  }

  return event;
}

export function serializeKeyEvent(
  eventType: string,
  event: KeyboardEvent,
  target: HTMLElement
): LiveViewEvent {
  return {
    type: eventType,
    target: target.getAttribute('id') || undefined,
    key: event.key,
    keyCode: event.keyCode,
    meta: {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    },
  };
}

// ============================================================================
// Topic Generation
// ============================================================================

export function generateViewTopic(viewName: string, sessionId: string): string {
  return `lv:${viewName}:${sessionId}`;
}

export function generateComponentTopic(componentId: string, viewTopic: string): string {
  return `${viewTopic}:component:${componentId}`;
}
