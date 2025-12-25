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

import type {
  LiveViewServerOptions,
  LiveViewDefinition,
  LiveComponentDefinition,
  LiveViewState,
  LiveSocket,
  LiveMessage,
  JoinPayload,
  ViewPatch,
} from './types';
import { createLiveSocket, mountLiveView, LiveViewInstance } from './live-view';
import { mountLiveComponent, LiveComponentInstance } from './live-component';
import { createDiffer } from './differ';

// ============================================================================
// Server Instance
// ============================================================================

export class LiveViewServer {
  private options: LiveViewServerOptions;
  private views = new Map<string, LiveViewDefinition>();
  private components = new Map<string, LiveComponentDefinition>();
  private sessions = new Map<string, LiveViewInstance>();
  private subscriptions = new Map<string, Set<string>>(); // topic -> socketIds
  private differ = createDiffer();

  constructor(options: LiveViewServerOptions) {
    this.options = {
      ssr: true,
      ...options,
    };
  }

  /**
   * Register a LiveView at a path
   */
  register(path: string, view: LiveViewDefinition): void {
    this.views.set(path, view);
  }

  /**
   * Register a LiveComponent
   */
  registerComponent(name: string, component: LiveComponentDefinition): void {
    this.components.set(name, component);
  }

  /**
   * Handle HTTP request for initial render
   */
  async handleRequest(request: Request): Promise<Response> {
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
  handleSocket(ws: WebSocket, request: Request): void {
    let sessionId: string | null = null;
    let instance: LiveViewInstance | null = null;

    ws.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(String(event.data)) as any[];
        const [topic, eventType, payload, ref] = message;

        switch (eventType) {
          case 'phx_join':
            sessionId = await this.handleJoin(ws, topic, payload as JoinPayload, ref);
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
              const diff = await instance.handleParams(
                Object.fromEntries(url.searchParams),
                payload.url
              );
              this.sendDiff(ws, topic, diff, ref);
            }
            break;

          case 'heartbeat':
            this.sendReply(ws, 'phoenix', ref, 'ok', {});
            break;
        }
      } catch (error) {
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
  broadcast(topic: string, event: string, payload: any): void {
    const subscribers = this.subscriptions.get(topic);
    if (!subscribers) return;

    // In a real implementation, this would send to actual WebSocket connections
    console.log(`[LiveView] Broadcasting to ${topic}:`, event, payload);
  }

  /**
   * Subscribe a socket to a topic
   */
  subscribe(socketId: string, topic: string): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(socketId);
  }

  /**
   * Unsubscribe a socket from a topic
   */
  unsubscribe(socketId: string, topic: string): void {
    this.subscriptions.get(topic)?.delete(socketId);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private findView(path: string): { name: string; definition: LiveViewDefinition } | null {
    // Exact match first
    if (this.views.has(path)) {
      return { name: path, definition: this.views.get(path)! };
    }

    // Pattern matching (simple implementation)
    for (const [pattern, definition] of this.views) {
      if (this.matchPath(pattern, path)) {
        return { name: pattern, definition };
      }
    }

    return null;
  }

  private matchPath(pattern: string, path: string): boolean {
    // Convert route pattern to regex
    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)') // :param -> capture group
      .replace(/\*/g, '(.*)'); // * -> catch-all

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  private async handleJoin(
    ws: WebSocket,
    topic: string,
    payload: JoinPayload,
    ref: string
  ): Promise<string> {
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
    } else {
      this.sendReply(ws, topic, ref, 'error', {
        reason: 'View not found',
      });
    }

    return sessionId;
  }

  private handleLeave(sessionId: string): void {
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

  private sendReply(
    ws: WebSocket,
    topic: string,
    ref: string,
    status: 'ok' | 'error',
    response: any
  ): void {
    ws.send(JSON.stringify([
      topic,
      'phx_reply',
      { status, response },
      ref,
    ]));
  }

  private sendDiff(ws: WebSocket, topic: string, diff: ViewPatch, ref: string): void {
    ws.send(JSON.stringify([
      topic,
      'diff',
      diff,
      ref,
    ]));
  }

  private generateSessionId(): string {
    return `lv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private encodeSession(data: any): string {
    // In production, use proper signing/encryption
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private decodeSession(token: string): any {
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return {};
    }
  }

  private encodeStatic(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private buildPageHtml(options: {
    content: string;
    sessionToken: string;
    staticToken: string;
    viewName: string;
    title: string;
  }): string {
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

  private generateCsrfToken(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a LiveView server
 */
export function createLiveViewServer(options: LiveViewServerOptions): LiveViewServer {
  return new LiveViewServer(options);
}

// ============================================================================
// Middleware Helpers
// ============================================================================

/**
 * Express/Hono middleware for LiveView
 */
export function liveViewMiddleware(server: LiveViewServer) {
  return async (req: Request): Promise<Response | null> => {
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
export function liveViewWebSocketHandler(server: LiveViewServer) {
  return (ws: WebSocket, request: Request): void => {
    server.handleSocket(ws, request);
  };
}

// ============================================================================
// PubSub
// ============================================================================

export interface PubSub {
  subscribe(topic: string, callback: (event: string, payload: any) => void): () => void;
  broadcast(topic: string, event: string, payload: any): void;
  broadcastFrom(socketId: string, topic: string, event: string, payload: any): void;
}

/**
 * Create an in-memory PubSub for development
 */
export function createMemoryPubSub(): PubSub {
  const subscribers = new Map<string, Set<(event: string, payload: any) => void>>();

  return {
    subscribe(topic: string, callback: (event: string, payload: any) => void) {
      if (!subscribers.has(topic)) {
        subscribers.set(topic, new Set());
      }
      subscribers.get(topic)!.add(callback);

      return () => {
        subscribers.get(topic)?.delete(callback);
      };
    },

    broadcast(topic: string, event: string, payload: any) {
      const subs = subscribers.get(topic);
      if (subs) {
        for (const callback of subs) {
          callback(event, payload);
        }
      }
    },

    broadcastFrom(socketId: string, topic: string, event: string, payload: any) {
      // Same as broadcast for memory implementation
      this.broadcast(topic, event, payload);
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export { createLiveView } from './live-view';
export { createLiveComponent } from './live-component';
