/**
 * PhilJS LiveView - Server
 *
 * Server-side runtime for LiveView. Handles:
 * - Initial HTTP rendering
 * - WebSocket connections
 * - View state management
 * - PubSub broadcasting
 * - Session management
 */
import { createLiveSocket, mountLiveView } from './live-view.js';
import { mountLiveComponent } from './live-component.js';
import { createDiffer } from './differ.js';
// ============================================================================
// Server Instance
// ============================================================================
export class LiveViewServer {
    options;
    views = new Map();
    components = new Map();
    sessions = new Map();
    subscriptions = new Map(); // topic -> socketIds
    differ = createDiffer();
    constructor(options) {
        this.options = {
            ssr: true,
            ...options,
        };
    }
    /**
     * Register a LiveView at a path
     */
    register(path, view) {
        this.views.set(path, view);
    }
    /**
     * Register a LiveComponent
     */
    registerComponent(name, component) {
        this.components.set(name, component);
    }
    /**
     * Handle HTTP request for initial render
     */
    async handleRequest(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        // Find matching view
        const view = this.findView(path);
        if (!view) {
            return new Response('Not Found', { status: 404 });
        }
        // Generate session tokens
        const sessionId = this.generateSessionId();
        const sessionToken = this.encodeSession({ id: sessionId, path });
        const staticToken = this.encodeStatic({ path });
        // Create socket for rendering
        const socket = createLiveSocket(sessionId, {}, {
            params: Object.fromEntries(url.searchParams),
            clientId: sessionId,
        });
        // Mount and render the view
        const instance = await mountLiveView(view.definition, socket);
        this.sessions.set(sessionId, instance);
        // Render initial HTML
        const html = instance.render();
        // Build full page HTML
        const fullHtml = this.buildPageHtml({
            content: html,
            sessionToken,
            staticToken,
            viewName: view.name,
            title: 'LiveView App',
        });
        return new Response(fullHtml, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
        });
    }
    /**
     * Handle WebSocket connection
     */
    handleSocket(ws, request) {
        let sessionId = null;
        let instance = null;
        ws.addEventListener('message', async (event) => {
            try {
                const message = JSON.parse(String(event.data));
                const [topic, eventType, payload, ref] = message;
                switch (eventType) {
                    case 'phx_join':
                        sessionId = await this.handleJoin(ws, topic, payload, ref);
                        instance = this.sessions.get(sessionId) || null;
                        break;
                    case 'phx_leave':
                        if (sessionId) {
                            this.handleLeave(sessionId);
                        }
                        break;
                    case 'event':
                        if (instance) {
                            const diff = await instance.handleEvent(payload);
                            this.sendDiff(ws, topic, diff, ref);
                        }
                        break;
                    case 'live_patch':
                        if (instance) {
                            const url = new URL(payload.url, 'http://localhost');
                            const diff = await instance.handleParams(Object.fromEntries(url.searchParams), payload.url);
                            this.sendDiff(ws, topic, diff, ref);
                        }
                        break;
                    case 'heartbeat':
                        this.sendReply(ws, 'phoenix', ref, 'ok', {});
                        break;
                }
            }
            catch (error) {
                console.error('[LiveView Server] Error:', error);
            }
        });
        ws.addEventListener('close', () => {
            if (sessionId) {
                this.handleLeave(sessionId);
            }
        });
    }
    /**
     * Broadcast to a topic
     */
    broadcast(topic, event, payload) {
        const subscribers = this.subscriptions.get(topic);
        if (!subscribers)
            return;
        // In a real implementation, this would send to actual WebSocket connections
        console.log(`[LiveView] Broadcasting to ${topic}:`, event, payload);
    }
    /**
     * Subscribe a socket to a topic
     */
    subscribe(socketId, topic) {
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Set());
        }
        this.subscriptions.get(topic).add(socketId);
    }
    /**
     * Unsubscribe a socket from a topic
     */
    unsubscribe(socketId, topic) {
        this.subscriptions.get(topic)?.delete(socketId);
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    findView(path) {
        // Exact match first
        if (this.views.has(path)) {
            return { name: path, definition: this.views.get(path) };
        }
        // Pattern matching (simple implementation)
        for (const [pattern, definition] of this.views) {
            if (this.matchPath(pattern, path)) {
                return { name: pattern, definition };
            }
        }
        return null;
    }
    matchPath(pattern, path) {
        // Convert route pattern to regex
        const regexPattern = pattern
            .replace(/:[^/]+/g, '([^/]+)') // :param -> capture group
            .replace(/\*/g, '(.*)'); // * -> catch-all
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
    }
    async handleJoin(ws, topic, payload, ref) {
        const session = this.decodeSession(payload.session);
        const sessionId = session.id;
        let instance = this.sessions.get(sessionId);
        if (!instance) {
            // Create new instance
            const view = this.findView(session.path);
            if (view) {
                const socket = createLiveSocket(sessionId, {}, {
                    params: payload.params,
                    clientId: sessionId,
                });
                instance = await mountLiveView(view.definition, socket);
                this.sessions.set(sessionId, instance);
            }
        }
        if (instance) {
            this.sendReply(ws, topic, ref, 'ok', {
                rendered: instance.render(),
            });
        }
        else {
            this.sendReply(ws, topic, ref, 'error', {
                reason: 'View not found',
            });
        }
        return sessionId;
    }
    handleLeave(sessionId) {
        const instance = this.sessions.get(sessionId);
        if (instance) {
            instance.terminate('leave');
            this.sessions.delete(sessionId);
        }
        // Clean up subscriptions
        for (const [topic, sockets] of this.subscriptions) {
            sockets.delete(sessionId);
        }
    }
    sendReply(ws, topic, ref, status, response) {
        ws.send(JSON.stringify([
            topic,
            'phx_reply',
            { status, response },
            ref,
        ]));
    }
    sendDiff(ws, topic, diff, ref) {
        ws.send(JSON.stringify([
            topic,
            'diff',
            diff,
            ref,
        ]));
    }
    generateSessionId() {
        return `lv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    encodeSession(data) {
        // In production, use proper signing/encryption
        return Buffer.from(JSON.stringify(data)).toString('base64');
    }
    decodeSession(token) {
        try {
            return JSON.parse(Buffer.from(token, 'base64').toString());
        }
        catch {
            return {};
        }
    }
    encodeStatic(data) {
        return Buffer.from(JSON.stringify(data)).toString('base64');
    }
    buildPageHtml(options) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="${this.generateCsrfToken()}">
  <title>${options.title}</title>
  <style>
    .phx-loading { opacity: 0.5; pointer-events: none; }
    [phx-click] { cursor: pointer; }
  </style>
</head>
<body>
  <div
    data-phx-main
    data-phx-view="${options.viewName}"
    data-phx-session="${options.sessionToken}"
    data-phx-static="${options.staticToken}"
  >
    ${options.content}
  </div>
  <script type="module">
    import { initLiveView } from '/live/client.js';
    initLiveView({ debug: true });
  </script>
</body>
</html>`;
    }
    generateCsrfToken() {
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
}
// ============================================================================
// Factory Functions
// ============================================================================
/**
 * Create a LiveView server
 */
export function createLiveViewServer(options) {
    return new LiveViewServer(options);
}
// ============================================================================
// Middleware Helpers
// ============================================================================
/**
 * Express/Hono middleware for LiveView
 */
export function liveViewMiddleware(server) {
    return async (req) => {
        // Check if this is a LiveView request
        const accept = req.headers.get('accept') || '';
        if (req.headers.get('upgrade') === 'websocket') {
            // WebSocket upgrade handled separately
            return null;
        }
        // HTML request
        if (accept.includes('text/html')) {
            return server.handleRequest(req);
        }
        return null;
    };
}
/**
 * WebSocket handler for LiveView
 */
export function liveViewWebSocketHandler(server) {
    return (ws, request) => {
        server.handleSocket(ws, request);
    };
}
/**
 * Create an in-memory PubSub for development
 */
export function createMemoryPubSub() {
    const subscribers = new Map();
    return {
        subscribe(topic, callback) {
            if (!subscribers.has(topic)) {
                subscribers.set(topic, new Set());
            }
            subscribers.get(topic).add(callback);
            return () => {
                subscribers.get(topic)?.delete(callback);
            };
        },
        broadcast(topic, event, payload) {
            const subs = subscribers.get(topic);
            if (subs) {
                for (const callback of subs) {
                    callback(event, payload);
                }
            }
        },
        broadcastFrom(socketId, topic, event, payload) {
            // Same as broadcast for memory implementation
            this.broadcast(topic, event, payload);
        },
    };
}
// ============================================================================
// Exports
// ============================================================================
export { createLiveView } from './live-view.js';
export { createLiveComponent } from './live-component.js';
//# sourceMappingURL=server.js.map