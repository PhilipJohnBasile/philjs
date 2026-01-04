/**
 * Presence System for PhilJS Collab
 *
 * Real-time user presence tracking with:
 * - Online/offline status
 * - User metadata (name, avatar, color)
 * - Activity tracking
 * - Idle detection
 */
export interface UserPresence {
    clientId: string;
    userId?: string;
    name: string;
    avatar?: string;
    color: string;
    status: 'online' | 'idle' | 'offline';
    lastSeen: number;
    metadata?: Record<string, unknown>;
    cursor?: {
        x: number;
        y: number;
    };
    selection?: {
        start: number;
        end: number;
    };
}
export interface PresenceConfig {
    clientId: string;
    user: {
        userId?: string;
        name: string;
        avatar?: string;
        color?: string;
    };
    idleTimeout?: number;
    heartbeatInterval?: number;
}
export interface PresenceUpdate {
    type: 'join' | 'update' | 'leave' | 'heartbeat';
    presence: UserPresence;
}
/**
 * Presence Manager
 */
export declare class PresenceManager {
    private localPresence;
    private remotePresences;
    private config;
    private listeners;
    private idleTimer;
    private heartbeatTimer;
    private isIdle;
    private onUpdate?;
    constructor(config: PresenceConfig);
    /**
     * Start presence tracking
     */
    start(onUpdate: (update: PresenceUpdate) => void): void;
    /**
     * Stop presence tracking
     */
    stop(): void;
    /**
     * Update local presence
     */
    update(data: Partial<Pick<UserPresence, 'cursor' | 'selection' | 'metadata'>>): void;
    /**
     * Handle remote presence update
     */
    handleRemoteUpdate(update: PresenceUpdate): void;
    /**
     * Get local presence
     */
    getLocal(): UserPresence;
    /**
     * Get all presences (including local)
     */
    getAll(): Map<string, UserPresence>;
    /**
     * Get online users count
     */
    getOnlineCount(): number;
    /**
     * Subscribe to presence changes
     */
    subscribe(listener: (presences: Map<string, UserPresence>) => void): () => void;
    private emitUpdate;
    private notifyListeners;
    private resetIdleTimer;
    private setupActivityListeners;
    private pruneStalePresences;
    private generateColor;
}
/**
 * Create a presence manager
 */
export declare function createPresenceManager(config: PresenceConfig): PresenceManager;
/**
 * Default avatar colors for quick assignment
 */
export declare const PRESENCE_COLORS: readonly ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"];
/**
 * Get a color by index
 */
export declare function getPresenceColor(index: number): string;
//# sourceMappingURL=presence.d.ts.map