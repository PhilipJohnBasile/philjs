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
import { signal, batch } from 'philjs-core';
// ============================================================================
// State Machine Implementation
// ============================================================================
export class Machine {
    id;
    config;
    initialContext;
    constructor(config) {
        this.id = config.id || `machine-${Math.random().toString(36).slice(2)}`;
        this.config = config;
        this.initialContext = config.context || {};
    }
    /**
     * Get initial state
     */
    getInitialState() {
        return {
            value: this.config.initial,
            context: { ...this.initialContext },
            changed: false,
            done: false,
            matches: (value) => value === this.config.initial,
        };
    }
    /**
     * Transition to next state
     */
    transition(currentState, event) {
        const stateNode = this.config.states[currentState.value];
        if (!stateNode) {
            return { ...currentState, changed: false };
        }
        // Check for transitions
        const transitions = stateNode.on;
        if (!transitions) {
            return { ...currentState, changed: false };
        }
        const transitionConfig = transitions[event.type];
        if (!transitionConfig) {
            return { ...currentState, changed: false };
        }
        const transition = typeof transitionConfig === 'string'
            ? { target: transitionConfig }
            : transitionConfig;
        // Check guard
        if (transition.cond && !transition.cond(currentState.context, event)) {
            return { ...currentState, changed: false };
        }
        // Execute exit actions
        if (stateNode.exit) {
            const exitActions = Array.isArray(stateNode.exit) ? stateNode.exit : [stateNode.exit];
            exitActions.forEach((action) => {
                const result = action(currentState.context, event);
                if (result) {
                    currentState.context = { ...currentState.context, ...result };
                }
            });
        }
        // Execute transition actions
        if (transition.actions) {
            const actions = Array.isArray(transition.actions)
                ? transition.actions
                : [transition.actions];
            actions.forEach((action) => {
                const result = action(currentState.context, event);
                if (result) {
                    currentState.context = { ...currentState.context, ...result };
                }
            });
        }
        const nextValue = transition.target || currentState.value;
        const nextStateNode = this.config.states[nextValue];
        // Execute entry actions
        if (nextStateNode?.entry) {
            const entryActions = Array.isArray(nextStateNode.entry)
                ? nextStateNode.entry
                : [nextStateNode.entry];
            entryActions.forEach((action) => {
                const result = action(currentState.context, event);
                if (result) {
                    currentState.context = { ...currentState.context, ...result };
                }
            });
        }
        const done = nextStateNode?.type === 'final';
        return {
            value: nextValue,
            context: currentState.context,
            changed: nextValue !== currentState.value,
            done,
            matches: (value) => value === nextValue,
        };
    }
    /**
     * Create an actor (interpreter) for this machine
     */
    createActor() {
        const stateSignal = signal(this.getInitialState());
        const listeners = new Set();
        const timers = new Map();
        const services = new Map();
        const send = (event) => {
            const eventObject = typeof event === 'string' ? { type: event } : event;
            batch(() => {
                const currentState = stateSignal();
                const nextState = this.transition(currentState, eventObject);
                if (nextState.changed) {
                    stateSignal.set(nextState);
                    // Handle delayed transitions (after)
                    const stateNode = this.config.states[nextState.value];
                    if (stateNode?.after) {
                        Object.entries(stateNode.after).forEach(([delay, transitionConfig]) => {
                            const timeout = setTimeout(() => {
                                const transition = typeof transitionConfig === 'string'
                                    ? { target: transitionConfig }
                                    : transitionConfig;
                                if (transition.target) {
                                    send({ type: `after.${delay}` });
                                }
                                timers.delete(Number(delay));
                            }, Number(delay));
                            timers.set(Number(delay), timeout);
                        });
                    }
                    // Handle services (invoke)
                    if (stateNode?.invoke) {
                        const invokes = Array.isArray(stateNode.invoke)
                            ? stateNode.invoke
                            : [stateNode.invoke];
                        invokes.forEach((invokeConfig) => {
                            const serviceId = invokeConfig.id || `service-${Math.random()}`;
                            const result = invokeConfig.src(nextState.context, eventObject);
                            if (result instanceof Promise) {
                                result
                                    .then((data) => {
                                    if (invokeConfig.onDone) {
                                        const config = typeof invokeConfig.onDone === 'string'
                                            ? { target: invokeConfig.onDone }
                                            : invokeConfig.onDone;
                                        if (config.target) {
                                            send({ type: 'done', data });
                                        }
                                    }
                                })
                                    .catch((error) => {
                                    if (invokeConfig.onError) {
                                        const config = typeof invokeConfig.onError === 'string'
                                            ? { target: invokeConfig.onError }
                                            : invokeConfig.onError;
                                        if (config.target) {
                                            send({ type: 'error', error });
                                        }
                                    }
                                });
                            }
                            else if (typeof result === 'function') {
                                services.set(serviceId, result);
                            }
                        });
                    }
                    // Notify listeners
                    listeners.forEach((listener) => {
                        try {
                            listener(nextState);
                        }
                        catch (error) {
                            console.error('Error in state listener:', error);
                        }
                    });
                }
            });
        };
        const subscribe = (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        };
        const getSnapshot = () => stateSignal();
        const stop = () => {
            // Clear timers
            timers.forEach((timeout) => clearTimeout(timeout));
            timers.clear();
            // Stop services
            services.forEach((cleanup) => cleanup());
            services.clear();
            // Clear listeners
            listeners.clear();
        };
        return { send, subscribe, getSnapshot, stop };
    }
}
// ============================================================================
// Factory Functions
// ============================================================================
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
export function createMachine(config) {
    return new Machine(config);
}
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
export function useMachine(machine) {
    const actor = machine.createActor();
    const stateSignal = signal(actor.getSnapshot());
    // Subscribe to state changes
    actor.subscribe((state) => {
        stateSignal.set(state);
    });
    return [stateSignal, actor.send];
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
export function visualize(machine) {
    const nodes = [];
    const edges = [];
    Object.entries(machine.config.states).forEach(([stateId, stateNode]) => {
        const node = {
            id: stateId,
            label: stateId,
            type: stateNode.type || 'atomic',
            transitions: [],
            ...(stateNode.initial !== undefined && { initial: stateNode.initial }),
        };
        // Process transitions
        if (stateNode.on) {
            Object.entries(stateNode.on).forEach(([event, transitionConfig]) => {
                const transition = typeof transitionConfig === 'string'
                    ? { target: transitionConfig }
                    : transitionConfig;
                if (transition.target) {
                    node.transitions.push({
                        event,
                        target: transition.target,
                        ...(transition.cond ? { guard: 'has guard' } : {}),
                    });
                    edges.push({
                        from: stateId,
                        to: transition.target,
                        label: event,
                    });
                }
            });
        }
        nodes.push(node);
    });
    return { nodes, edges };
}
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
export function toMermaid(machine) {
    const lines = ['stateDiagram-v2'];
    // Add initial state
    lines.push(`  [*] --> ${machine.config.initial}`);
    // Process each state
    Object.entries(machine.config.states).forEach(([stateId, stateNode]) => {
        // Add transitions
        if (stateNode.on) {
            Object.entries(stateNode.on).forEach(([event, transitionConfig]) => {
                const transition = typeof transitionConfig === 'string'
                    ? { target: transitionConfig }
                    : transitionConfig;
                if (transition.target) {
                    const guard = transition.cond ? ' [guard]' : '';
                    lines.push(`  ${stateId} --> ${transition.target}: ${event}${guard}`);
                }
            });
        }
        // Add final state marker
        if (stateNode.type === 'final') {
            lines.push(`  ${stateId} --> [*]`);
        }
    });
    return lines.join('\n');
}
// ============================================================================
// Utilities
// ============================================================================
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
export function assign(assigner) {
    return (context, event) => assigner(context, event);
}
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
export function guard(predicate) {
    return predicate;
}
//# sourceMappingURL=index.js.map