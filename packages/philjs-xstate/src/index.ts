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

import { signal, batch, type Signal } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

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

export type Guard<TContext = any, TEvent extends EventObject = EventObject> = (
  context: TContext,
  event: TEvent
) => boolean;

export type Action<TContext = any, TEvent extends EventObject = EventObject> = (
  context: TContext,
  event: TEvent
) => void | Partial<TContext>;

export type Service<TContext = any, TEvent extends EventObject = EventObject> = (
  context: TContext,
  event: TEvent
) => Promise<any> | (() => void);

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

// ============================================================================
// State Machine Implementation
// ============================================================================

export class Machine<TContext = any, TEvent extends EventObject = EventObject> {
  public id: string;
  public config: MachineConfig<TContext, TEvent>;
  private initialContext: TContext;

  constructor(config: MachineConfig<TContext, TEvent>) {
    this.id = config.id || `machine-${Math.random().toString(36).slice(2)}`;
    this.config = config;
    this.initialContext = config.context || ({} as TContext);
  }

  /**
   * Get initial state
   */
  public getInitialState(): State<TContext> {
    return {
      value: this.config.initial,
      context: { ...this.initialContext },
      changed: false,
      done: false,
      matches: (value: StateValue) => value === this.config.initial,
    };
  }

  /**
   * Transition to next state
   */
  public transition(currentState: State<TContext>, event: TEvent): State<TContext> {
    const stateNode = this.config.states[currentState.value];

    if (!stateNode) {
      return { ...currentState, changed: false };
    }

    // Check for transitions
    const transitions = stateNode.on;
    if (!transitions) {
      return { ...currentState, changed: false };
    }

    const transitionConfig = transitions[event.type as keyof typeof transitions];
    if (!transitionConfig) {
      return { ...currentState, changed: false };
    }

    const transition: TransitionConfig<TContext, TEvent> =
      typeof transitionConfig === 'string'
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
      actions.forEach((action: Action<TContext, TEvent>) => {
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
      matches: (value: StateValue) => value === nextValue,
    };
  }

  /**
   * Create an actor (interpreter) for this machine
   */
  public createActor(): ActorRef<TEvent> {
    const stateSignal = signal<State<TContext>>(this.getInitialState());
    const listeners = new Set<(state: State<TContext>) => void>();
    const timers = new Map<number, NodeJS.Timeout>();
    const services = new Map<string, () => void>();

    const send = (event: TEvent | TEvent['type']) => {
      const eventObject: TEvent =
        typeof event === 'string' ? ({ type: event } as TEvent) : event;

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
                const transition =
                  typeof transitionConfig === 'string'
                    ? { target: transitionConfig }
                    : transitionConfig;

                if (transition.target) {
                  send({ type: `after.${delay}` } as TEvent);
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
                      const config =
                        typeof invokeConfig.onDone === 'string'
                          ? { target: invokeConfig.onDone }
                          : invokeConfig.onDone;

                      if (config.target) {
                        send({ type: 'done', data } as unknown as TEvent);
                      }
                    }
                  })
                  .catch((error) => {
                    if (invokeConfig.onError) {
                      const config =
                        typeof invokeConfig.onError === 'string'
                          ? { target: invokeConfig.onError }
                          : invokeConfig.onError;

                      if (config.target) {
                        send({ type: 'error', error } as unknown as TEvent);
                      }
                    }
                  });
              } else if (typeof result === 'function') {
                services.set(serviceId, result);
              }
            });
          }

          // Notify listeners
          listeners.forEach((listener) => {
            try {
              listener(nextState);
            } catch (error) {
              console.error('Error in state listener:', error);
            }
          });
        }
      });
    };

    const subscribe = (listener: (state: State<TContext>) => void) => {
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
export function createMachine<TContext = any, TEvent extends EventObject = EventObject>(
  config: MachineConfig<TContext, TEvent>
): Machine<TContext, TEvent> {
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
export function useMachine<TContext = any, TEvent extends EventObject = EventObject>(
  machine: Machine<TContext, TEvent>
): [Signal<State<TContext>>, (event: TEvent | TEvent['type']) => void] {
  const actor = machine.createActor();
  const stateSignal = signal<State<TContext>>(actor.getSnapshot());

  // Subscribe to state changes
  actor.subscribe((state) => {
    stateSignal.set(state);
  });

  return [stateSignal, actor.send];
}

// ============================================================================
// Visualization
// ============================================================================

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
export function visualize<TContext = any, TEvent extends EventObject = EventObject>(
  machine: Machine<TContext, TEvent>
): VisualizationGraph {
  const nodes: VisualizationNode[] = [];
  const edges: Array<{ from: string; to: string; label: string }> = [];

  Object.entries(machine.config.states).forEach(([stateId, stateNode]) => {
    const node: VisualizationNode = {
      id: stateId,
      label: stateId,
      type: stateNode.type || 'atomic',
      initial: stateNode.initial,
      transitions: [],
    };

    // Process transitions
    if (stateNode.on) {
      (Object.entries(stateNode.on) as Array<[string, string | TransitionConfig<TContext, TEvent>]>).forEach(([event, transitionConfig]) => {
        const transition: TransitionConfig<TContext, TEvent> =
          typeof transitionConfig === 'string'
            ? { target: transitionConfig }
            : transitionConfig;

        if (transition.target) {
          node.transitions.push({
            event,
            target: transition.target,
            guard: transition.cond ? 'has guard' : undefined,
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
export function toMermaid<TContext = any, TEvent extends EventObject = EventObject>(
  machine: Machine<TContext, TEvent>
): string {
  const lines: string[] = ['stateDiagram-v2'];

  // Add initial state
  lines.push(`  [*] --> ${machine.config.initial}`);

  // Process each state
  Object.entries(machine.config.states).forEach(([stateId, stateNode]) => {
    // Add transitions
    if (stateNode.on) {
      (Object.entries(stateNode.on) as Array<[string, string | TransitionConfig<TContext, TEvent>]>).forEach(([event, transitionConfig]) => {
        const transition: TransitionConfig<TContext, TEvent> =
          typeof transitionConfig === 'string'
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
export function assign<TContext = any, TEvent extends EventObject = EventObject>(
  assigner: (context: TContext, event: TEvent) => Partial<TContext>
): Action<TContext, TEvent> {
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
export function guard<TContext = any, TEvent extends EventObject = EventObject>(
  predicate: (context: TContext, event: TEvent) => boolean
): Guard<TContext, TEvent> {
  return predicate;
}
