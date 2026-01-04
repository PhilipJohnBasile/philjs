/**
 * GenUI Hooks
 * PhilJS hooks for AI-driven UI composition
 */
import { GenUIHydrator, createHydrator } from './runtime/hydrator.js';
import { getDefaultRegistry } from './registry/component-registry.js';
function createState(initial) {
    const state = {
        value: initial,
        listeners: new Set(),
        get() {
            return this.value;
        },
        set(value) {
            this.value = value;
            for (const listener of this.listeners) {
                listener();
            }
        },
        subscribe(listener) {
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
export function useGenUI(options = {}) {
    const registry = options.registry ?? getDefaultRegistry();
    const hydrator = createHydrator(registry, {
        sandbox: options.sandbox,
        onAgentAction: options.onAgentAction,
    });
    const uiState = createState(options.initialUI ?? null);
    const loadingState = createState(false);
    const errorState = createState(null);
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
        async generate(prompt, context) {
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
            }
            catch (err) {
                errorState.set(err instanceof Error ? err : new Error(String(err)));
            }
            finally {
                loadingState.set(false);
            }
        },
        render(container) {
            const currentUI = uiState.get();
            if (!currentUI) {
                return () => { };
            }
            const result = hydrator.hydrate(currentUI, container);
            if (!result.success) {
                errorState.set(new Error(result.errors?.map((e) => e.message).join(', ')));
                return () => { };
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
        update(partial) {
            const current = uiState.get();
            if (current) {
                uiState.set({ ...current, ...partial });
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
export function useAgentUI(options) {
    const registry = options.registry ?? getDefaultRegistry();
    const connectedState = createState(false);
    const sessionIdState = createState(null);
    const uiState = createState(null);
    let ws = null;
    let reconnectTimer = null;
    const connect = async () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            return;
        }
        return new Promise((resolve, reject) => {
            try {
                ws = new WebSocket(options.endpoint);
                ws.onopen = () => {
                    connectedState.set(true);
                    sessionIdState.set(crypto.randomUUID());
                    // Send capability manifest
                    ws.send(JSON.stringify({
                        type: 'init',
                        capabilities: registry.generateManifest(),
                    }));
                    options.onConnect?.();
                    resolve();
                };
                ws.onclose = () => {
                    connectedState.set(false);
                    options.onDisconnect?.();
                    if (options.autoReconnect) {
                        reconnectTimer = setTimeout(() => {
                            connect().catch(() => { });
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
                        const message = JSON.parse(event.data);
                        uiState.set(message);
                        options.onMessage?.(message);
                    }
                    catch (err) {
                        options.onError?.(err instanceof Error ? err : new Error('Failed to parse message'));
                    }
                };
            }
            catch (err) {
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
    const send = (message, context) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            options.onError?.(new Error('Not connected'));
            return;
        }
        ws.send(JSON.stringify({
            type: 'message',
            sessionId: sessionIdState.get(),
            content: message,
            context,
        }));
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
export function createMockAgent(responses) {
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
export function createLayoutGenerator() {
    return (description) => {
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
//# sourceMappingURL=hooks.js.map