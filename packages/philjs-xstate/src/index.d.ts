/**
 * XState-inspired state machines for PhilJS
 *
 * Provides:
 * - Finite state machines with signals
 * - Actor model support
 * - Guards and actions
 * - Entry/exit actions
 * - Context management
 * - State visualization
 */
import { type Signal } from '@philjs/core';
export type StateValue = string;
export interface StateNode<TContext = any, TEvent extends EventObject = EventObject> {
    on?: {
        [K in TEvent['type']]?: string | TransitionConfig<TContext, TEvent>;
    };
    entry?: Action<TContext, TEvent> | Array<Action<TContext, TEvent>>;
    exit?: Action<TContext, TEvent> | Array<Action<TContext, TEvent>>;
    always?: string | TransitionConfig<TContext, TEvent>;
    after?: {
        [delay: number]: string | TransitionConfig<TContext, TEvent>;
    };
    initial?: string;
    states?: {
        [key: string]: StateNode<TContext, TEvent>;
    };
    type?: 'atomic' | 'compound' | 'final';
    invoke?: ServiceConfig<TContext, TEvent> | Array<ServiceConfig<TContext, TEvent>>;
}
export interface TransitionConfig<TContext = any, TEvent extends EventObject = EventObject> {
    target?: string;
    cond?: Guard<TContext, TEvent>;
    actions?: Action<TContext, TEvent> | Array<Action<TContext, TEvent>>;
}
export interface EventObject {
    type: string;
    [key: string]: any;
}
export type Guard<TContext = any, TEvent extends EventObject = EventObject> = (context: TContext, event: TEvent) => boolean;
export type Action<TContext = any, TEvent extends EventObject = EventObject> = (context: TContext, event: TEvent) => void | Partial<TContext>;
export type Service<TContext = any, TEvent extends EventObject = EventObject> = (context: TContext, event: TEvent) => Promise<any> | (() => void);
export interface ServiceConfig<TContext = any, TEvent extends EventObject = EventObject> {
    id?: string;
    src: Service<TContext, TEvent>;
    onDone?: string | TransitionConfig<TContext, TEvent>;
    onError?: string | TransitionConfig<TContext, TEvent>;
}
export interface MachineConfig<TContext = any, TEvent extends EventObject = EventObject> {
    id?: string;
    initial: string;
    context?: TContext;
    states: {
        [key: string]: StateNode<TContext, TEvent>;
    };
}
export interface State<TContext = any> {
    value: StateValue;
    context: TContext;
    changed: boolean;
    done: boolean;
    matches: (value: StateValue) => boolean;
}
export interface ActorRef<TEvent extends EventObject = EventObject> {
    send: (event: TEvent | TEvent['type']) => void;
    subscribe: (listener: (state: State) => void) => () => void;
    getSnapshot: () => State;
    stop: () => void;
}
export declare class Machine<TContext = any, TEvent extends EventObject = EventObject> {
    id: string;
    config: MachineConfig<TContext, TEvent>;
    private initialContext;
    constructor(config: MachineConfig<TContext, TEvent>);
    /**
     * Get initial state
     */
    getInitialState(): State<TContext>;
    /**
     * Transition to next state
     */
    transition(currentState: State<TContext>, event: TEvent): State<TContext>;
    /**
     * Create an actor (interpreter) for this machine
     */
    createActor(): ActorRef<TEvent>;
}
/**
 * Create a state machine
 *
 * @example
 * ```ts
 * const toggleMachine = createMachine({
 *   id: 'toggle',
 *   initial: 'inactive',
 *   states: {
 *     inactive: {
 *       on: { TOGGLE: 'active' }
 *     },
 *     active: {
 *       on: { TOGGLE: 'inactive' }
 *     }
 *   }
 * });
 * ```
 */
export declare function createMachine<TContext = any, TEvent extends EventObject = EventObject>(config: MachineConfig<TContext, TEvent>): Machine<TContext, TEvent>;
/**
 * Create a machine actor with signal-based state
 *
 * @example
 * ```ts
 * const [state, send] = useMachine(toggleMachine);
 *
 * // In component
 * <div>
 *   <p>State: {state().value}</p>
 *   <button onClick={() => send('TOGGLE')}>Toggle</button>
 * </div>
 * ```
 */
export declare function useMachine<TContext = any, TEvent extends EventObject = EventObject>(machine: Machine<TContext, TEvent>): [Signal<State<TContext>>, (event: TEvent | TEvent['type']) => void];
export interface VisualizationNode {
    id: string;
    label: string;
    type: 'atomic' | 'compound' | 'final';
    initial?: string;
    transitions: Array<{
        event: string;
        target: string;
        guard?: string;
    }>;
}
export interface VisualizationGraph {
    nodes: VisualizationNode[];
    edges: Array<{
        from: string;
        to: string;
        label: string;
    }>;
}
/**
 * Generate visualization data for a state machine
 *
 * @example
 * ```ts
 * const graph = visualize(machine);
 * console.log(graph.nodes);
 * console.log(graph.edges);
 *
 * // Use with a visualization library like D3, Cytoscape, etc.
 * ```
 */
export declare function visualize<TContext = any, TEvent extends EventObject = EventObject>(machine: Machine<TContext, TEvent>): VisualizationGraph;
/**
 * Generate Mermaid diagram syntax for visualization
 *
 * @example
 * ```ts
 * const diagram = toMermaid(machine);
 * console.log(diagram);
 *
 * // Output can be used in Mermaid live editor or markdown
 * ```
 */
export declare function toMermaid<TContext = any, TEvent extends EventObject = EventObject>(machine: Machine<TContext, TEvent>): string;
/**
 * Create an action that assigns context values
 *
 * @example
 * ```ts
 * const machine = createMachine({
 *   context: { count: 0 },
 *   states: {
 *     active: {
 *       on: {
 *         INCREMENT: {
 *           actions: assign((ctx) => ({ count: ctx.count + 1 }))
 *         }
 *       }
 *     }
 *   }
 * });
 * ```
 */
export declare function assign<TContext = any, TEvent extends EventObject = EventObject>(assigner: (context: TContext, event: TEvent) => Partial<TContext>): Action<TContext, TEvent>;
/**
 * Create a guard that checks if the event matches a condition
 *
 * @example
 * ```ts
 * const machine = createMachine({
 *   states: {
 *     idle: {
 *       on: {
 *         SUBMIT: {
 *           target: 'loading',
 *           cond: guard((ctx, evt) => evt.data.length > 0)
 *         }
 *       }
 *     }
 *   }
 * });
 * ```
 */
export declare function guard<TContext = any, TEvent extends EventObject = EventObject>(predicate: (context: TContext, event: TEvent) => boolean): Guard<TContext, TEvent>;
//# sourceMappingURL=index.d.ts.map