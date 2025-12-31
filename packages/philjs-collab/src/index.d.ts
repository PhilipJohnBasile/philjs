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
export { WebSocketTransport, BroadcastTransport, createWebSocketTransport, createBroadcastTransport, generateClientId, type MessageType, type CollabMessage, type TransportConfig, type TransportEvents, } from './transport.js';
export { PresenceManager, createPresenceManager, getPresenceColor, PRESENCE_COLORS, type UserPresence, type PresenceConfig, type PresenceUpdate, } from './presence.js';
export { YDoc, YText, YArray, YMap, createYDoc, type ItemId, type Item, type StateVector, type Update, type DeleteSet, type TextDelta, type ArrayEvent, type MapEvent, } from './crdt.js';
export { CursorManager, createCursorManager, injectCursorStyles, CURSOR_STYLES, type CursorPosition, type CursorConfig, type CursorDecoration, } from './cursors.js';
export { Awareness, createAwareness, createTypedAwareness, type AwarenessState, type AwarenessUpdate, type AwarenessConfig, type StandardAwarenessState, } from './awareness.js';
export { OTClient, OTServer, createOTClient, createOTServer, applyOperation, applyOperations, transform, transformOperations, compose, invert, type Operation, type InsertOp, type DeleteOp, type RetainOp, type OperationWithMeta, } from './ot.js';
import { WebSocketTransport } from './transport.js';
import { PresenceManager } from './presence.js';
import { Awareness } from './awareness.js';
import { CursorManager } from './cursors.js';
import { YDoc } from './crdt.js';
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
export declare class CollabRoom {
    readonly clientId: string;
    readonly transport: WebSocketTransport;
    readonly presence: PresenceManager;
    readonly awareness: Awareness;
    readonly cursors: CursorManager;
    readonly doc: YDoc;
    private config;
    constructor(config: CollabRoomConfig);
    /**
     * Connect to the collaboration room
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the room
     */
    disconnect(): void;
    /**
     * Attach cursor tracking to an element
     */
    attachCursors(container: HTMLElement): void;
    /**
     * Update local cursor position
     */
    updateCursor(position: {
        line: number;
        column: number;
    }): void;
    /**
     * Update local selection
     */
    updateSelection(selection: {
        start: {
            line: number;
            column: number;
        };
        end: {
            line: number;
            column: number;
        };
    }): void;
    /**
     * Set typing indicator
     */
    setTyping(typing: boolean): void;
    private setupHandlers;
    private updateRemoteCursor;
    private handleSync;
}
/**
 * Create a collaboration room
 */
export declare function createCollabRoom(config: CollabRoomConfig): CollabRoom;
export { CommentsManager, createCommentsManager, COMMENT_REACTIONS, type Comment, type CommentAuthor, type CommentThread, type ThreadAnchor, type CommentReaction, type CommentsConfig, type CommentEventHandlers, } from './comments.js';
//# sourceMappingURL=index.d.ts.map