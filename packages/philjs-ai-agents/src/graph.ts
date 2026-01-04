/**
 * LangGraph-style Agent Graph System
 * 
 * Define agent workflows as directed graphs with nodes and edges.
 */

import { signal, effect, type Signal } from '@philjs/core';

export type NodeType = 'llm' | 'tool' | 'condition' | 'human' | 'end';

export interface GraphNode<TState = any> {
    id: string;
    type: NodeType;
    name: string;
    /** Node execution function */
    execute: (state: TState, context: GraphContext) => Promise<TState>;
    /** Optional metadata */
    metadata?: Record<string, any>;
}

export interface GraphEdge {
    from: string;
    to: string;
    /** Condition for conditional edges */
    condition?: (state: any) => boolean;
}

export interface GraphContext {
    /** Current node ID */
    currentNode: string;
    /** Execution history */
    history: ExecutionStep[];
    /** Graph-level metadata */
    metadata: Record<string, any>;
    /** Stop the execution */
    stop: () => void;
    /** Go to a specific node */
    goto: (nodeId: string) => void;
}

export interface ExecutionStep {
    nodeId: string;
    nodeName: string;
    input: any;
    output: any;
    timestamp: number;
    duration: number;
}

export interface GraphConfig<TState = any> {
    nodes: GraphNode<TState>[];
    edges: GraphEdge[];
    entryPoint: string;
    initialState: TState;
}

/**
 * Create an agent graph
 * 
 * @example
 * ```ts
 * const graph = createGraph({
 *   nodes: [
 *     llmNode('chat', async (state, ctx) => {
 *       const response = await ai.chat(state.messages);
 *       return { ...state, lastResponse: response };
 *     }),
 *     toolNode('search', async (state, ctx) => {
 *       const results = await search(state.query);
 *       return { ...state, searchResults: results };
 *     }),
 *     conditionNode('shouldSearch', (state) => state.needsSearch),
 *   ],
 *   edges: [
 *     { from: 'chat', to: 'shouldSearch' },
 *     { from: 'shouldSearch', to: 'search', condition: (s) => s.needsSearch },
 *     { from: 'shouldSearch', to: 'end', condition: (s) => !s.needsSearch },
 *     { from: 'search', to: 'chat' },
 *   ],
 *   entryPoint: 'chat',
 *   initialState: { messages: [], needsSearch: false },
 * });
 * 
 * const result = await graph.execute();
 * ```
 */
export function createGraph<TState>(config: GraphConfig<TState>) {
    const { nodes, edges, entryPoint, initialState } = config;

    // Build lookup maps
    const nodeMap = new Map<string, GraphNode<TState>>();
    for (const node of nodes) {
        nodeMap.set(node.id, node);
    }

    const edgeMap = new Map<string, GraphEdge[]>();
    for (const edge of edges) {
        if (!edgeMap.has(edge.from)) {
            edgeMap.set(edge.from, []);
        }
        edgeMap.get(edge.from)!.push(edge);
    }

    // Execution state
    const currentState = signal<TState>(initialState);
    const isRunning = signal(false);
    const history = signal<ExecutionStep[]>([]);
    const error = signal<Error | null>(null);

    let shouldStop = false;
    let overrideNextNode: string | null = null;

    async function execute(): Promise<TState> {
        shouldStop = false;
        overrideNextNode = null;
        isRunning.set(true);
        error.set(null);
        history.set([]);

        let state = { ...initialState };
        let currentNodeId = entryPoint;

        try {
            while (!shouldStop) {
                const node = nodeMap.get(currentNodeId);
                if (!node) {
                    throw new Error(`Node "${currentNodeId}" not found`);
                }

                if (node.type === 'end') {
                    break;
                }

                const context: GraphContext = {
                    currentNode: currentNodeId,
                    history: history(),
                    metadata: {},
                    stop: () => { shouldStop = true; },
                    goto: (nodeId: string) => { overrideNextNode = nodeId; },
                };

                const startTime = performance.now();
                const inputState = { ...state };

                // Execute node
                state = await node.execute(state, context);

                const duration = performance.now() - startTime;

                // Record history
                history.update((h) => [...h, {
                    nodeId: currentNodeId,
                    nodeName: node.name,
                    input: inputState,
                    output: state,
                    timestamp: Date.now(),
                    duration,
                }]);

                currentState.set(state);

                // Determine next node
                if (overrideNextNode) {
                    currentNodeId = overrideNextNode;
                    overrideNextNode = null;
                    continue;
                }

                const outEdges = edgeMap.get(currentNodeId) || [];
                if (outEdges.length === 0) {
                    break; // No more edges, end execution
                }

                // Find the next node based on conditions
                let nextNodeId: string | null = null;
                for (const edge of outEdges) {
                    if (!edge.condition || edge.condition(state)) {
                        nextNodeId = edge.to;
                        break;
                    }
                }

                if (!nextNodeId) {
                    break; // No matching edge
                }

                currentNodeId = nextNodeId;
            }
        } catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
            throw e;
        } finally {
            isRunning.set(false);
        }

        return state;
    }

    function reset() {
        currentState.set(initialState);
        history.set([]);
        error.set(null);
        isRunning.set(false);
        shouldStop = false;
        overrideNextNode = null;
    }

    return {
        execute,
        reset,
        state: () => currentState(),
        history: () => history(),
        isRunning: () => isRunning(),
        error: () => error(),
        nodes,
        edges,
    };
}

// Helper functions to create nodes
export function llmNode<TState>(
    id: string,
    execute: GraphNode<TState>['execute']
): GraphNode<TState> {
    return { id, type: 'llm', name: id, execute };
}

export function toolNode<TState>(
    id: string,
    execute: GraphNode<TState>['execute']
): GraphNode<TState> {
    return { id, type: 'tool', name: id, execute };
}

export function conditionNode<TState>(
    id: string,
    condition: (state: TState) => boolean
): GraphNode<TState> {
    return {
        id,
        type: 'condition',
        name: id,
        execute: async (state) => state, // Pass-through
    };
}

export function humanNode<TState>(
    id: string,
    prompt: (state: TState) => string
): GraphNode<TState> {
    return {
        id,
        type: 'human',
        name: id,
        execute: async (state, ctx) => {
            // This would integrate with a human-in-the-loop interface
            return state;
        },
    };
}

export function endNode<TState>(): GraphNode<TState> {
    return {
        id: 'end',
        type: 'end',
        name: 'End',
        execute: async (state) => state,
    };
}

export type AgentGraph<TState> = ReturnType<typeof createGraph<TState>>;
