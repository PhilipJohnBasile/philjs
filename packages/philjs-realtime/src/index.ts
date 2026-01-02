/**
 * PhilJS Realtime - Real-time Collaboration & WebSockets
 *
 * Features:
 * - WebSocket client with auto-reconnect
 * - Presence (who's online)
 * - Cursors & awareness
 * - CRDT support via Y.js
 * - Room management
 * - Multiplayer state
 */

import { signal, effect, batch, memo } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface User {
  id: string;
  name?: string;
  avatar?: string;
  color?: string;
  [key: string]: any;
}

export interface PresenceState<T = any> {
  user: User;
  data: T;
  lastSeen: number;
}

export interface RoomConfig {
  id: string;
  password?: string;
  maxUsers?: number;
  persist?: boolean;
}

export interface RealtimeMessage {
  type: string;
  payload: any;
  room?: string;
  from?: string;
  timestamp?: number;
}

// ============================================================================
// WebSocket Client
// ============================================================================

export interface WebSocketClientOptions {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  reconnectAttempts?: number;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: RealtimeMessage) => void;
}

export class WebSocketClient {
  private url: string;
  private protocols: string[] | undefined;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxAttempts: number;
  private reconnectDelay: number;
  private maxReconnectDelay: number;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  private heartbeatInterval: number;
  private shouldReconnect: boolean;
  private messageHandlers = new Map<string, Set<(payload: any) => void>>();

  public status = signal<ConnectionStatus>('disconnected');
  public lastMessage = signal<RealtimeMessage | null>(null);

  private callbacks: {
    onOpen: (() => void) | undefined;
    onClose: ((event: CloseEvent) => void) | undefined;
    onError: ((error: Event) => void) | undefined;
    onMessage: ((message: RealtimeMessage) => void) | undefined;
  };

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.protocols = options.protocols;
    this.shouldReconnect = options.reconnect !== false;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.maxReconnectDelay = options.maxReconnectDelay || 30000;
    this.maxAttempts = options.reconnectAttempts || Infinity;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.callbacks = {
      onOpen: options.onOpen,
      onClose: options.onClose,
      onError: options.onError,
      onMessage: options.onMessage,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.status.set('connecting');

    try {
      this.ws = new WebSocket(this.url, this.protocols);

      this.ws.onopen = () => {
        this.status.set('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.callbacks.onOpen?.();
      };

      this.ws.onclose = (event) => {
        this.status.set('disconnected');
        this.stopHeartbeat();
        this.callbacks.onClose?.(event);

        if (this.shouldReconnect && this.reconnectAttempts < this.maxAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.callbacks.onError?.(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          this.lastMessage.set(message);
          this.callbacks.onMessage?.(message);

          // Dispatch to type-specific handlers
          const handlers = this.messageHandlers.get(message.type);
          handlers?.forEach(handler => handler(message.payload));
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };
    } catch (error) {
      this.status.set('disconnected');
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.status.set('disconnected');
  }

  send(type: string, payload: any, room?: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    const message: RealtimeMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    if (room !== undefined) {
      message.room = room;
    }

    this.ws.send(JSON.stringify(message));
  }

  on(type: string, handler: (payload: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  private scheduleReconnect(): void {
    this.status.set('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {});
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

// ============================================================================
// Presence
// ============================================================================

export interface UsePresenceOptions<T = any> {
  client: WebSocketClient;
  room: string;
  user: User;
  initialData?: T;
  syncInterval?: number;
}

export function usePresence<T = any>(options: UsePresenceOptions<T>) {
  const { client, room, user, initialData, syncInterval = 1000 } = options;

  const others = signal<Map<string, PresenceState<T>>>(new Map());
  const myPresence = signal<T | undefined>(initialData);
  const isConnected = memo(() => client.status() === 'connected');

  // Broadcast presence
  const broadcastPresence = () => {
    if (!isConnected()) return;

    client.send('presence:update', {
      user,
      data: myPresence(),
      lastSeen: Date.now(),
    }, room);
  };

  // Update my presence
  const updatePresence = (data: Partial<T>) => {
    myPresence.set({ ...myPresence(), ...data } as T);
    broadcastPresence();
  };

  // Set up listeners
  effect(() => {
    const unsubUpdate = client.on('presence:update', (state: PresenceState<T>) => {
      if (state.user.id !== user.id) {
        const current = new Map(others());
        current.set(state.user.id, state);
        others.set(current);
      }
    });

    const unsubLeave = client.on('presence:leave', (userId: string) => {
      const current = new Map(others());
      current.delete(userId);
      others.set(current);
    });

    // Periodic sync
    const interval = setInterval(broadcastPresence, syncInterval);

    // Announce arrival
    if (isConnected()) {
      client.send('presence:join', { user, room }, room);
      broadcastPresence();
    }

    return () => {
      unsubUpdate();
      unsubLeave();
      clearInterval(interval);
      client.send('presence:leave', user.id, room);
    };
  });

  return {
    others: () => Array.from(others().values()),
    myPresence: () => myPresence(),
    updatePresence,
    isConnected,
    count: memo(() => others().size + 1),
  };
}

// ============================================================================
// Cursors
// ============================================================================

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface CursorState extends CursorPosition {
  user: User;
}

export interface UseCursorsOptions {
  client: WebSocketClient;
  room: string;
  user: User;
  throttle?: number;
}

export function useCursors(options: UseCursorsOptions) {
  const { client, room, user, throttle = 50 } = options;

  const cursors = signal<Map<string, CursorState>>(new Map());
  let lastBroadcast = 0;

  // Broadcast cursor position
  const broadcast = (x: number, y: number) => {
    const now = Date.now();
    if (now - lastBroadcast < throttle) return;
    lastBroadcast = now;

    client.send('cursor:move', {
      user,
      x,
      y,
      timestamp: now,
    }, room);
  };

  // Listen for cursor updates
  effect(() => {
    const unsub = client.on('cursor:move', (state: CursorState) => {
      if (state.user.id !== user.id) {
        const current = new Map(cursors());
        current.set(state.user.id, state);
        cursors.set(current);
      }
    });

    const unsubLeave = client.on('presence:leave', (userId: string) => {
      const current = new Map(cursors());
      current.delete(userId);
      cursors.set(current);
    });

    return () => {
      unsub();
      unsubLeave();
    };
  });

  return {
    cursors: () => Array.from(cursors().values()),
    broadcast,
  };
}

// ============================================================================
// Rooms
// ============================================================================

export interface Room {
  id: string;
  users: User[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface UseRoomOptions {
  client: WebSocketClient;
  roomId: string;
  user: User;
  password?: string;
}

export function useRoom(options: UseRoomOptions) {
  const { client, roomId, user, password } = options;

  const room = signal<Room | null>(null);
  const users = signal<User[]>([]);
  const isJoined = signal(false);
  const error = signal<Error | null>(null);

  const join = async () => {
    try {
      client.send('room:join', { roomId, user, password });
      isJoined.set(true);
    } catch (e) {
      error.set(e instanceof Error ? e : new Error(String(e)));
    }
  };

  const leave = () => {
    client.send('room:leave', { roomId, user });
    isJoined.set(false);
  };

  const broadcast = (type: string, payload: any) => {
    client.send(type, payload, roomId);
  };

  effect(() => {
    const unsubJoin = client.on('room:joined', (data: Room) => {
      room.set(data);
      users.set(data.users);
    });

    const unsubUserJoin = client.on('room:user:joined', (newUser: User) => {
      users.set([...users(), newUser]);
    });

    const unsubUserLeave = client.on('room:user:left', (userId: string) => {
      users.set(users().filter(u => u.id !== userId));
    });

    const unsubError = client.on('room:error', (err: { message: string }) => {
      error.set(new Error(err.message));
    });

    return () => {
      unsubJoin();
      unsubUserJoin();
      unsubUserLeave();
      unsubError();
      if (isJoined()) leave();
    };
  });

  return {
    room: () => room(),
    users: () => users(),
    isJoined: () => isJoined(),
    error: () => error(),
    join,
    leave,
    broadcast,
  };
}

// ============================================================================
// Broadcast Channel
// ============================================================================

export interface UseBroadcastOptions<T = any> {
  client: WebSocketClient;
  room: string;
  channel: string;
}

export function useBroadcast<T = any>(options: UseBroadcastOptions<T>) {
  const { client, room, channel } = options;

  const lastMessage = signal<T | null>(null);
  const messageHistory = signal<T[]>([]);

  const broadcast = (data: T) => {
    client.send(`broadcast:${channel}`, data, room);
  };

  effect(() => {
    const unsub = client.on(`broadcast:${channel}`, (data: T) => {
      lastMessage.set(data);
      messageHistory.set([...messageHistory(), data]);
    });

    return unsub;
  });

  return {
    broadcast,
    lastMessage: () => lastMessage(),
    history: () => messageHistory(),
    clear: () => messageHistory.set([]),
  };
}

// ============================================================================
// Multiplayer State (CRDT-like)
// ============================================================================

export interface SharedStateOptions<T> {
  client: WebSocketClient;
  room: string;
  initialState: T;
}

export function useSharedState<T extends Record<string, any>>(options: SharedStateOptions<T>) {
  const { client, room, initialState } = options;

  const state = signal<T>(initialState);
  const version = signal(0);

  const set = <K extends keyof T>(key: K, value: T[K]) => {
    const newState = { ...state(), [key]: value };
    state.set(newState);
    version.set(version() + 1);

    client.send('state:update', {
      key,
      value,
      version: version(),
    }, room);
  };

  const merge = (partial: Partial<T>) => {
    const newState = { ...state(), ...partial };
    state.set(newState);
    version.set(version() + 1);

    client.send('state:merge', {
      data: partial,
      version: version(),
    }, room);
  };

  effect(() => {
    const unsubUpdate = client.on('state:update', (update: { key: keyof T; value: any; version: number }) => {
      if (update.version > version()) {
        state.set({ ...state(), [update.key]: update.value });
        version.set(update.version);
      }
    });

    const unsubMerge = client.on('state:merge', (update: { data: Partial<T>; version: number }) => {
      if (update.version > version()) {
        state.set({ ...state(), ...update.data });
        version.set(update.version);
      }
    });

    const unsubSync = client.on('state:sync', (fullState: { data: T; version: number }) => {
      state.set(fullState.data);
      version.set(fullState.version);
    });

    // Request sync on connect
    if (client.status() === 'connected') {
      client.send('state:sync:request', {}, room);
    }

    return () => {
      unsubUpdate();
      unsubMerge();
      unsubSync();
    };
  });

  return {
    state: () => state(),
    get: <K extends keyof T>(key: K) => state()[key],
    set,
    merge,
    version: () => version(),
  };
}

// ============================================================================
// Server-Side Room Manager
// ============================================================================

export class RoomManager {
  private rooms = new Map<string, Set<string>>();
  private userRooms = new Map<string, Set<string>>();

  join(roomId: string, userId: string): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(userId);

    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);
  }

  leave(roomId: string, userId: string): void {
    this.rooms.get(roomId)?.delete(userId);
    this.userRooms.get(userId)?.delete(roomId);

    // Clean up empty rooms
    if (this.rooms.get(roomId)?.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  leaveAll(userId: string): string[] {
    const rooms = Array.from(this.userRooms.get(userId) || []);
    rooms.forEach(roomId => this.leave(roomId, userId));
    this.userRooms.delete(userId);
    return rooms;
  }

  getUsers(roomId: string): string[] {
    return Array.from(this.rooms.get(roomId) || []);
  }

  getRooms(userId: string): string[] {
    return Array.from(this.userRooms.get(userId) || []);
  }

  isInRoom(roomId: string, userId: string): boolean {
    return this.rooms.get(roomId)?.has(userId) || false;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getUserCount(roomId: string): number {
    return this.rooms.get(roomId)?.size || 0;
  }
}

// ============================================================================
// All types and classes are already exported inline above
// ============================================================================
