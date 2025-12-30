/**
 * GenUI Hooks
 * PhilJS hooks for AI-driven UI composition
 */

import type { A2UIMessage, A2UILayout, A2UIComponent } from './protocol/a2ui-schema.js';
import type { ComponentRegistry, ComponentManifest } from './registry/component-registry.js';
import type { SandboxConfig } from './sandbox/ast-validator.js';
import { GenUIHydrator, createHydrator, type HydratorOptions } from './runtime/hydrator.js';
import { getDefaultRegistry } from './registry/component-registry.js';

/**
 * GenUI state returned by useGenUI
 */
export interface GenUIState {
  /** Current UI message (reactive) */
  ui: A2UIMessage | null;
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Generate UI from prompt */
  generate: (prompt: string, context?: Record<string, unknown>) => Promise<void>;
  /** Render to a container element */
  render: (container: HTMLElement) => () => void;
  /** Update current UI */
  update: (message: Partial<A2UIMessage>) => void;
  /** Clear current UI */
  clear: () => void;
  /** Get component manifest for LLM */
  getManifest: () => ComponentManifest;
}

/**
 * Options for useGenUI hook
 */
export interface GenUIOptions {
  /** Component registry to use */
  registry?: ComponentRegistry;
  /** Sandbox configuration */
  sandbox?: Partial<SandboxConfig>;
  /** Agent endpoint or function to call for UI generation */
  agent?: GenUIAgent;
  /** Callback when agent action is triggered */
  onAgentAction?: (actionId: string, event: { type: string; data?: unknown }) => void;
  /** Initial UI message */
  initialUI?: A2UIMessage;
}

/**
 * Agent interface for GenUI
 */
export interface GenUIAgent {
  /** Generate UI from a prompt */
  generateUI: (
    prompt: string,
    options: {
      capabilities: ComponentManifest;
      context?: Record<string, unknown>;
    }
  ) => Promise<A2UIMessage>;
  /** Stream UI updates */
  streamUI?: (
    prompt: string,
    options: {
      capabilities: ComponentManifest;
      context?: Record<string, unknown>;
      onUpdate: (partial: Partial<A2UIMessage>) => void;
    }
  ) => Promise<void>;
}

/**
 * Simple state container (can be replaced with @philjs/core signals)
 */
interface StateContainer<T> {
  value: T;
  listeners: Set<() => void>;
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
}

function createState<T>(initial: T): StateContainer<T> {
  const state: StateContainer<T> = {
    value: initial,
    listeners: new Set(),
    get() {
      return this.value;
    },
    set(value: T) {
      this.value = value;
      for (const listener of this.listeners) {
        listener();
      }
    },
    subscribe(listener: () => void) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    },
  };
  return state;
}

/**
 * Hook for AI-generated UI
 *
 * @example
 * ```typescript
 * const genui = useGenUI({
 *   agent: myAgent,
 *   onAgentAction: (actionId, event) => {
 *     console.log('Action:', actionId, event);
 *   },
 * });
 *
 * // Generate UI from prompt
 * await genui.generate('Create a user profile card');
 *
 * // Render to container
 * const cleanup = genui.render(document.getElementById('app')!);
 * ```
 */
export function useGenUI(options: GenUIOptions = {}): GenUIState {
  const registry = options.registry ?? getDefaultRegistry();
  const hydrator = createHydrator(registry, {
    sandbox: options.sandbox,
    onAgentAction: options.onAgentAction,
  });

  const uiState = createState<A2UIMessage | null>(options.initialUI ?? null);
  const loadingState = createState(false);
  const errorState = createState<Error | null>(null);

  return {
    get ui() {
      return uiState.get();
    },

    get loading() {
      return loadingState.get();
    },

    get error() {
      return errorState.get();
    },

    async generate(prompt: string, context?: Record<string, unknown>) {
      if (!options.agent) {
        errorState.set(new Error('No agent configured'));
        return;
      }

      loadingState.set(true);
      errorState.set(null);

      try {
        const manifest = registry.generateManifest();
        const message = await options.agent.generateUI(prompt, {
          capabilities: manifest,
          context,
        });
        uiState.set(message);
      } catch (err) {
        errorState.set(err instanceof Error ? err : new Error(String(err)));
      } finally {
        loadingState.set(false);
      }
    },

    render(container: HTMLElement) {
      const currentUI = uiState.get();
      if (!currentUI) {
        return () => {};
      }

      const result = hydrator.hydrate(currentUI, container);
      if (!result.success) {
        errorState.set(new Error(result.errors?.map((e) => e.message).join(', ')));
        return () => {};
      }

      // Subscribe to UI changes for re-rendering
      const unsubscribe = uiState.subscribe(() => {
        const newUI = uiState.get();
        if (newUI) {
          hydrator.hydrate(newUI, container);
        }
      });

      return () => {
        unsubscribe();
        result.cleanup?.();
      };
    },

    update(partial: Partial<A2UIMessage>) {
      const current = uiState.get();
      if (current) {
        uiState.set({ ...current, ...partial } as A2UIMessage);
      }
    },

    clear() {
      uiState.set(null);
      errorState.set(null);
      hydrator.cleanup();
    },

    getManifest() {
      return registry.generateManifest();
    },
  };
}

/**
 * Agent UI state for real-time collaboration
 */
export interface AgentUIState {
  /** Connection status */
  connected: boolean;
  /** Current session ID */
  sessionId: string | null;
  /** Current UI */
  ui: A2UIMessage | null;
  /** Send message to agent */
  send: (message: string, context?: Record<string, unknown>) => void;
  /** Connect to agent */
  connect: () => Promise<void>;
  /** Disconnect from agent */
  disconnect: () => void;
}

/**
 * Options for useAgentUI hook
 */
export interface AgentUIOptions {
  /** WebSocket endpoint */
  endpoint: string;
  /** Component registry */
  registry?: ComponentRegistry;
  /** Sandbox configuration */
  sandbox?: Partial<SandboxConfig>;
  /** Callback on connection */
  onConnect?: () => void;
  /** Callback on disconnect */
  onDisconnect?: () => void;
  /** Callback on message */
  onMessage?: (message: A2UIMessage) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Auto-reconnect */
  autoReconnect?: boolean;
  /** Reconnect interval in ms */
  reconnectInterval?: number;
}

/**
 * Hook for real-time agent UI collaboration
 *
 * @example
 * ```typescript
 * const agent = useAgentUI({
 *   endpoint: 'wss://api.example.com/agent',
 *   onMessage: (message) => {
 *     console.log('Received UI update:', message);
 *   },
 * });
 *
 * // Connect to agent
 * await agent.connect();
 *
 * // Send message
 * agent.send('Show me the dashboard');
 * ```
 */
export function useAgentUI(options: AgentUIOptions): AgentUIState {
  const registry = options.registry ?? getDefaultRegistry();

  const connectedState = createState(false);
  const sessionIdState = createState<string | null>(null);
  const uiState = createState<A2UIMessage | null>(null);

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        ws = new WebSocket(options.endpoint);

        ws.onopen = () => {
          connectedState.set(true);
          sessionIdState.set(crypto.randomUUID());

          // Send capability manifest
          ws!.send(
            JSON.stringify({
              type: 'init',
              capabilities: registry.generateManifest(),
            })
          );

          options.onConnect?.();
          resolve();
        };

        ws.onclose = () => {
          connectedState.set(false);
          options.onDisconnect?.();

          if (options.autoReconnect) {
            reconnectTimer = setTimeout(() => {
              connect().catch(() => {});
            }, options.reconnectInterval ?? 5000);
          }
        };

        ws.onerror = (event) => {
          const error = new Error('WebSocket error');
          options.onError?.(error);
          reject(error);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as A2UIMessage;
            uiState.set(message);
            options.onMessage?.(message);
          } catch (err) {
            options.onError?.(err instanceof Error ? err : new Error('Failed to parse message'));
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  };

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
    connectedState.set(false);
    sessionIdState.set(null);
  };

  const send = (message: string, context?: Record<string, unknown>) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      options.onError?.(new Error('Not connected'));
      return;
    }

    ws.send(
      JSON.stringify({
        type: 'message',
        sessionId: sessionIdState.get(),
        content: message,
        context,
      })
    );
  };

  return {
    get connected() {
      return connectedState.get();
    },

    get sessionId() {
      return sessionIdState.get();
    },

    get ui() {
      return uiState.get();
    },

    send,
    connect,
    disconnect,
  };
}

/**
 * Create a mock agent for testing
 */
export function createMockAgent(
  responses: Map<string, A2UIMessage> | ((prompt: string) => A2UIMessage)
): GenUIAgent {
  return {
    async generateUI(prompt, options) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (typeof responses === 'function') {
        return responses(prompt);
      }

      const response = responses.get(prompt);
      if (response) {
        return response;
      }

      // Default response
      return {
        version: '1.0',
        type: 'render',
        payload: {
          type: 'render',
          layout: { type: 'stack' },
          components: [
            {
              id: 'text-1',
              type: 'Text',
              props: { children: `Response to: ${prompt}` },
            },
          ],
        },
      };
    },
  };
}

/**
 * Create a simple prompt-based layout generator
 */
export function createLayoutGenerator(): (description: string) => A2UILayout {
  return (description: string): A2UILayout => {
    const lower = description.toLowerCase();

    if (lower.includes('grid') || lower.includes('cards')) {
      const cols = lower.includes('2') ? 2 : lower.includes('3') ? 3 : lower.includes('4') ? 4 : 'repeat(auto-fit, minmax(200px, 1fr))';
      return { type: 'grid', columns: String(cols), gap: '16px' };
    }

    if (lower.includes('horizontal') || lower.includes('row')) {
      return { type: 'flex', direction: 'row', gap: '16px', wrap: true };
    }

    if (lower.includes('center')) {
      return { type: 'flex', direction: 'column', align: 'center', justify: 'center' };
    }

    // Default: vertical stack
    return { type: 'stack', direction: 'column', gap: '16px' };
  };
}
