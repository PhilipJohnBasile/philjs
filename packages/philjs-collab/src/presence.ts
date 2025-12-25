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
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
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
export class PresenceManager {
  private localPresence: UserPresence;
  private remotePresences: Map<string, UserPresence> = new Map();
  private config: Required<Omit<PresenceConfig, 'user'>> & { user: PresenceConfig['user'] };
  private listeners: Set<(presences: Map<string, UserPresence>) => void> = new Set();
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isIdle = false;
  private onUpdate?: (update: PresenceUpdate) => void;

  constructor(config: PresenceConfig) {
    this.config = {
      clientId: config.clientId,
      user: config.user,
      idleTimeout: config.idleTimeout ?? 60000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
    };

    this.localPresence = {
      clientId: config.clientId,
      userId: config.user.userId,
      name: config.user.name,
      avatar: config.user.avatar,
      color: config.user.color || this.generateColor(config.clientId),
      status: 'online',
      lastSeen: Date.now(),
    };
  }

  /**
   * Start presence tracking
   */
  start(onUpdate: (update: PresenceUpdate) => void): void {
    this.onUpdate = onUpdate;

    // Send join
    this.emitUpdate('join');

    // Start heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.localPresence.lastSeen = Date.now();
      this.emitUpdate('heartbeat');
      this.pruneStalePresences();
    }, this.config.heartbeatInterval);

    // Setup idle detection
    this.resetIdleTimer();
    this.setupActivityListeners();
  }

  /**
   * Stop presence tracking
   */
  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    this.localPresence.status = 'offline';
    this.emitUpdate('leave');
  }

  /**
   * Update local presence
   */
  update(data: Partial<Pick<UserPresence, 'cursor' | 'selection' | 'metadata'>>): void {
    Object.assign(this.localPresence, data);
    this.localPresence.lastSeen = Date.now();
    this.emitUpdate('update');
  }

  /**
   * Handle remote presence update
   */
  handleRemoteUpdate(update: PresenceUpdate): void {
    const { presence } = update;

    if (presence.clientId === this.config.clientId) return;

    switch (update.type) {
      case 'join':
      case 'update':
      case 'heartbeat':
        this.remotePresences.set(presence.clientId, presence);
        break;
      case 'leave':
        this.remotePresences.delete(presence.clientId);
        break;
    }

    this.notifyListeners();
  }

  /**
   * Get local presence
   */
  getLocal(): UserPresence {
    return { ...this.localPresence };
  }

  /**
   * Get all presences (including local)
   */
  getAll(): Map<string, UserPresence> {
    const all = new Map(this.remotePresences);
    all.set(this.config.clientId, this.localPresence);
    return all;
  }

  /**
   * Get online users count
   */
  getOnlineCount(): number {
    return Array.from(this.remotePresences.values()).filter(p => p.status !== 'offline').length + 1;
  }

  /**
   * Subscribe to presence changes
   */
  subscribe(listener: (presences: Map<string, UserPresence>) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAll());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitUpdate(type: PresenceUpdate['type']): void {
    if (this.onUpdate) {
      this.onUpdate({
        type,
        presence: { ...this.localPresence },
      });
    }
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const presences = this.getAll();
    for (const listener of this.listeners) {
      listener(presences);
    }
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    if (this.isIdle) {
      this.isIdle = false;
      this.localPresence.status = 'online';
      this.emitUpdate('update');
    }

    this.idleTimer = setTimeout(() => {
      this.isIdle = true;
      this.localPresence.status = 'idle';
      this.emitUpdate('update');
    }, this.config.idleTimeout);
  }

  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    const resetIdle = () => this.resetIdleTimer();

    for (const event of events) {
      window.addEventListener(event, resetIdle, { passive: true });
    }

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.localPresence.status = 'idle';
        this.emitUpdate('update');
      } else {
        this.resetIdleTimer();
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
  }

  private pruneStalePresences(): void {
    const staleThreshold = Date.now() - this.config.heartbeatInterval * 3;
    let changed = false;

    for (const [clientId, presence] of this.remotePresences) {
      if (presence.lastSeen < staleThreshold) {
        this.remotePresences.delete(clientId);
        changed = true;
      }
    }

    if (changed) {
      this.notifyListeners();
    }
  }

  private generateColor(seed: string): string {
    // Generate consistent color from client ID
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }
}

/**
 * Create a presence manager
 */
export function createPresenceManager(config: PresenceConfig): PresenceManager {
  return new PresenceManager(config);
}

/**
 * Default avatar colors for quick assignment
 */
export const PRESENCE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Sky
] as const;

/**
 * Get a color by index
 */
export function getPresenceColor(index: number): string {
  return PRESENCE_COLORS[index % PRESENCE_COLORS.length];
}
