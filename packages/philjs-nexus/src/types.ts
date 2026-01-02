/**
 * @philjs/nexus - Type Definitions
 *
 * The Nexus Architecture: Local-first, AI-native, Collaborative
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Main configuration for creating a Nexus application
 */
export interface NexusConfig {
  /**
   * Local storage configuration for offline-first data
   */
  local: LocalConfig;

  /**
   * Remote sync configuration (optional - enables cloud sync)
   */
  remote?: RemoteConfig;

  /**
   * AI/LLM configuration (optional - enables AI features)
   */
  ai?: AIConfig;

  /**
   * Real-time collaboration configuration (optional)
   */
  collab?: CollabConfig;

  /**
   * Debug and development options
   */
  debug?: DebugConfig;
}

/**
 * Local storage adapter configuration
 */
export interface LocalConfig {
  /** Storage adapter type */
  adapter: 'indexeddb' | 'sqlite' | 'memory';
  /** Database name for IndexedDB/SQLite */
  dbName?: string;
  /** Enable encryption at rest */
  encryption?: boolean;
  /** Encryption key (required if encryption is enabled) */
  encryptionKey?: string;
}

/**
 * Remote sync configuration
 */
export interface RemoteConfig {
  /** Remote adapter type */
  adapter: 'supabase' | 'postgres' | 'firebase' | 'custom';
  /** Connection URL */
  url: string;
  /** Authentication configuration */
  auth?: RemoteAuthConfig;
  /** Sync strategy */
  syncStrategy?: 'realtime' | 'polling' | 'manual';
  /** Polling interval in milliseconds (for polling strategy) */
  pollInterval?: number;
  /** Conflict resolution strategy */
  conflictResolution?: 'crdt' | 'last-write-wins' | 'custom';
  /** Custom conflict resolver function */
  conflictResolver?: ConflictResolver;
}

/**
 * Remote authentication configuration
 */
export interface RemoteAuthConfig {
  /** Auth token or API key */
  token?: string;
  /** API key for service authentication */
  apiKey?: string;
  /** Custom headers to include */
  headers?: Record<string, string>;
}

/**
 * AI/LLM configuration
 */
export interface AIConfig {
  /** AI provider */
  provider: 'anthropic' | 'openai' | 'google' | 'local';
  /** API key for the provider */
  apiKey?: string;
  /** Model to use */
  model?: string;
  /** Enable guardrails (schema validation, safety filters) */
  guardrails?: boolean;
  /** Enable prompt/response caching */
  cache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Maximum tokens per request */
  maxTokens?: number;
  /** Enable cost tracking */
  trackCosts?: boolean;
  /** Cost budget per day in USD */
  dailyBudget?: number;
}

/**
 * Collaboration configuration
 */
export interface CollabConfig {
  /** Enable presence indicators */
  presence?: boolean;
  /** Enable cursor synchronization */
  cursors?: boolean;
  /** Enable comment threads */
  comments?: boolean;
  /** WebSocket URL for real-time sync */
  websocketUrl?: string;
  /** User information for presence */
  user?: CollabUser;
}

/**
 * Collaboration user information
 */
export interface CollabUser {
  /** Unique user ID */
  id: string;
  /** Display name */
  name: string;
  /** Avatar URL */
  avatar?: string;
  /** User color for cursors/presence */
  color?: string;
}

/**
 * Debug configuration
 */
export interface DebugConfig {
  /** Enable verbose logging */
  verbose?: boolean;
  /** Enable time-travel debugging */
  timeTravel?: boolean;
  /** Enable performance tracking */
  performance?: boolean;
}

// ============================================================================
// Sync Types
// ============================================================================

/**
 * Sync status for tracking synchronization state
 */
export interface SyncStatus {
  /** Current sync state */
  state: 'idle' | 'syncing' | 'error' | 'offline';
  /** Last successful sync timestamp */
  lastSyncedAt: number | null;
  /** Number of pending local changes */
  pendingChanges: number;
  /** Current error if any */
  error: Error | null;
  /** Whether currently online */
  isOnline: boolean;
}

/**
 * Conflict resolver function type
 */
export type ConflictResolver = (
  local: unknown,
  remote: unknown,
  metadata: ConflictMetadata
) => unknown;

/**
 * Metadata provided during conflict resolution
 */
export interface ConflictMetadata {
  /** Document/collection path */
  path: string;
  /** Local change timestamp */
  localTimestamp: number;
  /** Remote change timestamp */
  remoteTimestamp: number;
  /** User who made local change */
  localUser?: string;
  /** User who made remote change */
  remoteUser?: string;
}

/**
 * Sync event types
 */
export type SyncEvent =
  | { type: 'sync-start' }
  | { type: 'sync-complete'; changes: number }
  | { type: 'sync-error'; error: Error }
  | { type: 'conflict'; path: string; resolved: boolean }
  | { type: 'online' }
  | { type: 'offline' };

/**
 * Sync event listener
 */
export type SyncEventListener = (event: SyncEvent) => void;

// ============================================================================
// Document Types
// ============================================================================

/**
 * Nexus document - a CRDT-backed reactive document
 */
export interface NexusDocument<T = unknown> {
  /** Get the current value */
  get(): T;
  /** Set the entire document value */
  set(value: T): void;
  /** Update a specific path */
  update(path: string, value: unknown): void;
  /** Subscribe to changes */
  subscribe(listener: (value: T) => void): () => void;
  /** Get document ID */
  readonly id: string;
  /** Get last modified timestamp */
  readonly lastModified: number;
}

/**
 * Nexus collection - a reactive collection of documents
 */
export interface NexusCollection<T = unknown> {
  /** Get all documents */
  getAll(): T[];
  /** Get document by ID */
  get(id: string): T | undefined;
  /** Add a new document */
  add(doc: T): string;
  /** Update a document */
  update(id: string, updates: Partial<T>): void;
  /** Delete a document */
  delete(id: string): void;
  /** Query documents */
  query(filter: (doc: T) => boolean): T[];
  /** Subscribe to collection changes */
  subscribe(listener: (docs: T[]) => void): () => void;
  /** Get collection size */
  readonly size: number;
}

// ============================================================================
// AI Types
// ============================================================================

/**
 * AI generation options
 */
export interface AIGenerateOptions {
  /** Custom system prompt */
  systemPrompt?: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Temperature (0-1) */
  temperature?: number;
  /** Maximum tokens */
  maxTokens?: number;
  /** Output schema for structured output */
  schema?: unknown;
}

/**
 * AI generation result
 */
export interface AIGenerateResult<T = string> {
  /** Generated content */
  content: T;
  /** Token usage */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Estimated cost in USD */
  cost: number;
  /** Whether result came from cache */
  cached: boolean;
  /** Model used */
  model: string;
}

/**
 * AI streaming chunk
 */
export interface AIStreamChunk {
  /** Chunk content */
  content: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Accumulated content so far */
  accumulated: string;
}

// ============================================================================
// Collaboration Types
// ============================================================================

/**
 * Presence state for a user
 */
export interface PresenceState {
  /** User ID */
  id: string;
  /** User display name */
  name: string;
  /** User color */
  color: string;
  /** User avatar URL */
  avatar?: string;
  /** Current cursor position */
  cursor?: CursorPosition;
  /** Current selection */
  selection?: SelectionRange;
  /** Whether user is typing */
  typing?: boolean;
  /** Last activity timestamp */
  lastActive: number;
  /** Whether user is online */
  online: boolean;
}

/**
 * Cursor position
 */
export interface CursorPosition {
  /** Document ID or path */
  documentId: string;
  /** Line number (for text) or Y position */
  line?: number;
  /** Column number (for text) or X position */
  column?: number;
  /** X coordinate (for canvas-like) */
  x?: number;
  /** Y coordinate (for canvas-like) */
  y?: number;
}

/**
 * Selection range
 */
export interface SelectionRange {
  /** Start position */
  start: { line: number; column: number };
  /** End position */
  end: { line: number; column: number };
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Nexus application events
 */
export type NexusEvent =
  | SyncEvent
  | { type: 'ai-request'; prompt: string }
  | { type: 'ai-response'; tokens: number; cost: number }
  | { type: 'ai-error'; error: Error }
  | { type: 'presence-update'; users: PresenceState[] }
  | { type: 'cursor-update'; userId: string; position: CursorPosition }
  | { type: 'document-change'; documentId: string }
  | { type: 'connected' }
  | { type: 'disconnected' };

/**
 * Nexus event listener
 */
export type NexusEventListener = (event: NexusEvent) => void;
