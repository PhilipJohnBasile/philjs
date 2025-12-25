/**
 * PhilJS Collab - Real-time Collaborative State Sync
 *
 * Comprehensive collaboration toolkit providing:
 * - Real-time presence tracking
 * - CRDTs for conflict-free editing
 * - Cursor and selection synchronization
 * - Awareness protocol for ephemeral state
 * - Operational transformations
 * - WebSocket/BroadcastChannel transport
 */

// Transport layer
export {
  WebSocketTransport,
  BroadcastTransport,
  createWebSocketTransport,
  createBroadcastTransport,
  generateClientId,
  type MessageType,
  type CollabMessage,
  type TransportConfig,
  type TransportEvents,
} from './transport';

// Presence
export {
  PresenceManager,
  createPresenceManager,
  getPresenceColor,
  PRESENCE_COLORS,
  type UserPresence,
  type PresenceConfig,
  type PresenceUpdate,
} from './presence';

// CRDTs
export {
  YDoc,
  YText,
  YArray,
  YMap,
  createYDoc,
  type ItemId,
  type Item,
  type StateVector,
  type Update,
  type DeleteSet,
  type TextDelta,
  type ArrayEvent,
  type MapEvent,
} from './crdt';

// Cursors
export {
  CursorManager,
  createCursorManager,
  injectCursorStyles,
  CURSOR_STYLES,
  type CursorPosition,
  type CursorConfig,
  type CursorDecoration,
} from './cursors';

// Awareness
export {
  Awareness,
  createAwareness,
  createTypedAwareness,
  type AwarenessState,
  type AwarenessUpdate,
  type AwarenessConfig,
  type StandardAwarenessState,
} from './awareness';

// Operational Transforms
export {
  OTClient,
  OTServer,
  createOTClient,
  createOTServer,
  applyOperation,
  applyOperations,
  transform,
  transformOperations,
  compose,
  invert,
  type Operation,
  type InsertOp,
  type DeleteOp,
  type RetainOp,
  type OperationWithMeta,
} from './ot';

// Convenience functions

import { WebSocketTransport, createWebSocketTransport, generateClientId } from './transport';
import { PresenceManager, createPresenceManager } from './presence';
import { Awareness, createAwareness } from './awareness';
import { CursorManager, createCursorManager, injectCursorStyles } from './cursors';
import { YDoc, createYDoc } from './crdt';

/**
 * Full collaboration room configuration
 */
export interface CollabRoomConfig {
  url: string;
  roomId: string;
  clientId?: string;
  user: {
    name: string;
    color?: string;
    avatar?: string;
  };
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Collaboration Room
 *
 * All-in-one collaboration solution combining:
 * - Transport
 * - Presence
 * - Awareness
 * - Cursors
 * - CRDT document
 */
export class CollabRoom {
  readonly clientId: string;
  readonly transport: WebSocketTransport;
  readonly presence: PresenceManager;
  readonly awareness: Awareness;
  readonly cursors: CursorManager;
  readonly doc: YDoc;

  private config: CollabRoomConfig;

  constructor(config: CollabRoomConfig) {
    this.config = config;
    this.clientId = config.clientId || generateClientId();

    // Initialize transport
    this.transport = createWebSocketTransport({
      url: config.url,
      roomId: config.roomId,
      clientId: this.clientId,
    });

    // Initialize presence
    this.presence = createPresenceManager({
      clientId: this.clientId,
      user: config.user,
    });

    // Initialize awareness
    this.awareness = createAwareness({
      clientId: this.clientId,
    });

    // Initialize cursors
    this.cursors = createCursorManager(this.clientId);

    // Initialize CRDT document
    this.doc = createYDoc(this.clientId);

    // Setup event handlers
    this.setupHandlers();
  }

  /**
   * Connect to the collaboration room
   */
  async connect(): Promise<void> {
    await this.transport.connect();

    // Start presence
    this.presence.start((update) => {
      this.transport.send('presence', update);
    });

    // Start awareness
    this.awareness.start((state) => {
      this.transport.send('awareness', state);
    });

    // Send initial sync request
    this.transport.send('sync', { type: 'request' });
  }

  /**
   * Disconnect from the room
   */
  disconnect(): void {
    this.presence.stop();
    this.awareness.stop();
    this.transport.disconnect();
  }

  /**
   * Attach cursor tracking to an element
   */
  attachCursors(container: HTMLElement): void {
    injectCursorStyles();
    this.cursors.attach(container);
  }

  /**
   * Update local cursor position
   */
  updateCursor(position: { line: number; column: number }): void {
    this.awareness.updateLocalState({
      cursor: position,
    });
  }

  /**
   * Update local selection
   */
  updateSelection(selection: { start: { line: number; column: number }; end: { line: number; column: number } }): void {
    this.awareness.updateLocalState({
      selection,
    });
  }

  /**
   * Set typing indicator
   */
  setTyping(typing: boolean): void {
    this.awareness.updateLocalState({ typing });
  }

  private setupHandlers(): void {
    // Transport events
    this.transport.on('connect', () => {
      this.config.onConnect?.();
    });

    this.transport.on('disconnect', (reason) => {
      this.config.onDisconnect?.(reason);
    });

    this.transport.on('error', (error) => {
      this.config.onError?.(error);
    });

    // Message handling
    this.transport.on('message', (message) => {
      switch (message.type) {
        case 'presence':
          this.presence.handleRemoteUpdate(message.payload as any);
          break;

        case 'awareness':
          this.awareness.handleRemoteUpdate(message.payload as any);
          this.updateRemoteCursor(message.clientId);
          break;

        case 'cursor':
          this.cursors.updateCursor(message.payload as any);
          break;

        case 'sync':
          this.handleSync(message.payload as any);
          break;

        case 'operation':
          this.doc.applyUpdate(message.payload as any);
          break;
      }
    });

    // Document updates
    this.doc.onUpdate((update) => {
      this.transport.send('operation', update);
    });

    // Awareness changes -> cursor updates
    this.awareness.subscribe((update) => {
      for (const clientId of [...update.added, ...update.updated]) {
        this.updateRemoteCursor(clientId);
      }
      for (const clientId of update.removed) {
        this.cursors.removeCursor(clientId);
      }
    });
  }

  private updateRemoteCursor(clientId: string): void {
    const state = this.awareness.getRemoteState(clientId) as any;
    if (!state?.cursor) return;

    const presence = Array.from(this.presence.getAll().values()).find(p => p.clientId === clientId);

    this.cursors.updateCursor({
      clientId,
      name: presence?.name || 'Anonymous',
      color: presence?.color || '#888',
      position: state.cursor,
      selection: state.selection ? {
        start: state.selection.anchor || state.selection.start,
        end: state.selection.head || state.selection.end,
      } : undefined,
      timestamp: Date.now(),
    });
  }

  private handleSync(data: any): void {
    if (data.type === 'state') {
      // Apply full state sync
      if (data.doc) {
        this.doc.applyUpdate(data.doc);
      }
      if (data.awareness) {
        this.awareness.applyStates(data.awareness);
      }
    }
  }
}

/**
 * Create a collaboration room
 */
export function createCollabRoom(config: CollabRoomConfig): CollabRoom {
  return new CollabRoom(config);
}

// Comments system
export {
  CommentsManager,
  createCommentsManager,
  COMMENT_REACTIONS,
  type Comment,
  type CommentAuthor,
  type CommentThread,
  type ThreadAnchor,
  type CommentReaction,
  type CommentsConfig,
  type CommentEventHandlers,
} from './comments';
