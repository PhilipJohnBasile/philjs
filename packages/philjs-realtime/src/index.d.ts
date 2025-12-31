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
export declare class WebSocketClient {
    private url;
    private protocols;
    private ws;
    private reconnectAttempts;
    private maxAttempts;
    private reconnectDelay;
    private maxReconnectDelay;
    private heartbeatTimer;
    private heartbeatInterval;
    private shouldReconnect;
    private messageHandlers;
    status: any;
    lastMessage: any;
    private callbacks;
    constructor(options: WebSocketClientOptions);
    connect(): void;
    disconnect(): void;
    send(type: string, payload: any, room?: string): void;
    on(type: string, handler: (payload: any) => void): () => void;
    private scheduleReconnect;
    private startHeartbeat;
    private stopHeartbeat;
}
export interface UsePresenceOptions<T = any> {
    client: WebSocketClient;
    room: string;
    user: User;
    initialData?: T;
    syncInterval?: number;
}
export declare function usePresence<T = any>(options: UsePresenceOptions<T>): {
    others: () => unknown[];
    myPresence: () => any;
    updatePresence: (data: Partial<T>) => void;
    isConnected: any;
    count: any;
};
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
export declare function useCursors(options: UseCursorsOptions): {
    cursors: () => unknown[];
    broadcast: (x: number, y: number) => void;
};
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
export declare function useRoom(options: UseRoomOptions): {
    room: () => any;
    users: () => any;
    isJoined: () => any;
    error: () => any;
    join: () => Promise<void>;
    leave: () => void;
    broadcast: (type: string, payload: any) => void;
};
export interface UseBroadcastOptions<T = any> {
    client: WebSocketClient;
    room: string;
    channel: string;
}
export declare function useBroadcast<T = any>(options: UseBroadcastOptions<T>): {
    broadcast: (data: T) => void;
    lastMessage: () => any;
    history: () => any;
    clear: () => any;
};
export interface SharedStateOptions<T> {
    client: WebSocketClient;
    room: string;
    initialState: T;
}
export declare function useSharedState<T extends Record<string, any>>(options: SharedStateOptions<T>): {
    state: () => any;
    get: <K extends keyof T>(key: K) => any;
    set: <K extends keyof T>(key: K, value: T[K]) => void;
    merge: (partial: Partial<T>) => void;
    version: () => any;
};
export declare class RoomManager {
    private rooms;
    private userRooms;
    join(roomId: string, userId: string): void;
    leave(roomId: string, userId: string): void;
    leaveAll(userId: string): string[];
    getUsers(roomId: string): string[];
    getRooms(userId: string): string[];
    isInRoom(roomId: string, userId: string): boolean;
    getRoomCount(): number;
    getUserCount(roomId: string): number;
}
//# sourceMappingURL=index.d.ts.map