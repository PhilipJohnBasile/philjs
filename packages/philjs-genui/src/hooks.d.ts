/**
 * GenUI Hooks
 * PhilJS hooks for AI-driven UI composition
 */
import type { A2UIMessage, A2UILayout } from './protocol/a2ui-schema.js';
import type { ComponentRegistry, ComponentManifest } from './registry/component-registry.js';
import type { SandboxConfig } from './sandbox/ast-validator.js';
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
    onAgentAction?: (actionId: string, event: {
        type: string;
        data?: unknown;
    }) => void;
    /** Initial UI message */
    initialUI?: A2UIMessage;
}
/**
 * Agent interface for GenUI
 */
export interface GenUIAgent {
    /** Generate UI from a prompt */
    generateUI: (prompt: string, options: {
        capabilities: ComponentManifest;
        context?: Record<string, unknown>;
    }) => Promise<A2UIMessage>;
    /** Stream UI updates */
    streamUI?: (prompt: string, options: {
        capabilities: ComponentManifest;
        context?: Record<string, unknown>;
        onUpdate: (partial: Partial<A2UIMessage>) => void;
    }) => Promise<void>;
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
export declare function useGenUI(options?: GenUIOptions): GenUIState;
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
export declare function useAgentUI(options: AgentUIOptions): AgentUIState;
/**
 * Create a mock agent for testing
 */
export declare function createMockAgent(responses: Map<string, A2UIMessage> | ((prompt: string) => A2UIMessage)): GenUIAgent;
/**
 * Create a simple prompt-based layout generator
 */
export declare function createLayoutGenerator(): (description: string) => A2UILayout;
//# sourceMappingURL=hooks.d.ts.map