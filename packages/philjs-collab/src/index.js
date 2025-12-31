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
export { WebSocketTransport, BroadcastTransport, createWebSocketTransport, createBroadcastTransport, generateClientId, } from './transport.js';
// Presence
export { PresenceManager, createPresenceManager, getPresenceColor, PRESENCE_COLORS, } from './presence.js';
// CRDTs
export { YDoc, YText, YArray, YMap, createYDoc, } from './crdt.js';
// Cursors
export { CursorManager, createCursorManager, injectCursorStyles, CURSOR_STYLES, } from './cursors.js';
// Awareness
export { Awareness, createAwareness, createTypedAwareness, } from './awareness.js';
// Operational Transforms
export { OTClient, OTServer, createOTClient, createOTServer, applyOperation, applyOperations, transform, transformOperations, compose, invert, } from './ot.js';
// Convenience functions
import { WebSocketTransport, createWebSocketTransport, generateClientId } from './transport.js';
import { PresenceManager, createPresenceManager } from './presence.js';
import { Awareness, createAwareness } from './awareness.js';
import { CursorManager, createCursorManager, injectCursorStyles } from './cursors.js';
import { YDoc, createYDoc } from './crdt.js';
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
    clientId;
    transport;
    presence;
    awareness;
    cursors;
    doc;
    config;
    constructor(config) {
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
    async connect() {
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
    disconnect() {
        this.presence.stop();
        this.awareness.stop();
        this.transport.disconnect();
    }
    /**
     * Attach cursor tracking to an element
     */
    attachCursors(container) {
        injectCursorStyles();
        this.cursors.attach(container);
    }
    /**
     * Update local cursor position
     */
    updateCursor(position) {
        this.awareness.updateLocalState({
            cursor: position,
        });
    }
    /**
     * Update local selection
     */
    updateSelection(selection) {
        this.awareness.updateLocalState({
            selection,
        });
    }
    /**
     * Set typing indicator
     */
    setTyping(typing) {
        this.awareness.updateLocalState({ typing });
    }
    setupHandlers() {
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
                    this.presence.handleRemoteUpdate(message.payload);
                    break;
                case 'awareness':
                    this.awareness.handleRemoteUpdate(message.payload);
                    this.updateRemoteCursor(message.clientId);
                    break;
                case 'cursor':
                    this.cursors.updateCursor(message.payload);
                    break;
                case 'sync':
                    this.handleSync(message.payload);
                    break;
                case 'operation':
                    this.doc.applyUpdate(message.payload);
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
    updateRemoteCursor(clientId) {
        const state = this.awareness.getRemoteState(clientId);
        if (!state?.cursor)
            return;
        const presence = Array.from(this.presence.getAll().values()).find((p) => p.clientId === clientId);
        const cursorUpdate = {
            clientId,
            name: presence?.name || 'Anonymous',
            color: presence?.color || '#888',
            position: state.cursor,
            timestamp: Date.now(),
        };
        if (state.selection) {
            cursorUpdate.selection = {
                start: state.selection.anchor || state.selection.start,
                end: state.selection.head || state.selection.end,
            };
        }
        this.cursors.updateCursor(cursorUpdate);
    }
    handleSync(data) {
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
export function createCollabRoom(config) {
    return new CollabRoom(config);
}
// Comments system
export { CommentsManager, createCommentsManager, COMMENT_REACTIONS, } from './comments.js';
//# sourceMappingURL=index.js.map