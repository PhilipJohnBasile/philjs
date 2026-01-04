# @philjs/xstate

The `@philjs/xstate` package provides XState-inspired state machines for PhilJS with signal-based reactivity, guards, actions, services, and visualization support.

## Installation

```bash
npm install @philjs/xstate
```

## Features

- **Finite State Machines** - Explicit state transitions
- **Signal-Based** - Reactive state with PhilJS signals
- **Guards** - Conditional transitions
- **Actions** - Entry, exit, and transition actions
- **Services** - Async operations and invocations
- **Delayed Transitions** - Time-based state changes
- **Visualization** - Mermaid diagram generation

## Quick Start

```typescript
import { createMachine, useMachine } from '@philjs/xstate';

// Define a toggle machine
const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: {
      on: { TOGGLE: 'active' }
    },
    active: {
      on: { TOGGLE: 'inactive' }
    }
  }
});

// Use in component
function ToggleButton() {
  const [state, send] = useMachine(toggleMachine);

  return (
    <button onClick={() => send('TOGGLE')}>
      {state().value === 'active' ? 'ON' : 'OFF'}
    </button>
  );
}
```

---

## Creating Machines

### Basic Machine

```typescript
import { createMachine } from '@philjs/xstate';
import type { MachineConfig, StateNode, EventObject } from '@philjs/xstate';

// Define event types
type ToggleEvent = { type: 'TOGGLE' };

const machine = createMachine<{}, ToggleEvent>({
  id: 'toggle',
  initial: 'off',
  states: {
    off: {
      on: { TOGGLE: 'on' }
    },
    on: {
      on: { TOGGLE: 'off' }
    }
  }
});
```

### With Context

```typescript
interface CounterContext {
  count: number;
  max: number;
}

type CounterEvent =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'RESET' };

const counterMachine = createMachine<CounterContext, CounterEvent>({
  id: 'counter',
  initial: 'active',
  context: {
    count: 0,
    max: 10
  },
  states: {
    active: {
      on: {
        INCREMENT: {
          target: 'active',
          actions: (ctx) => ({ count: ctx.count + 1 })
        },
        DECREMENT: {
          target: 'active',
          actions: (ctx) => ({ count: ctx.count - 1 })
        },
        RESET: {
          target: 'active',
          actions: () => ({ count: 0 })
        }
      }
    }
  }
});
```

---

## Guards

Conditional transitions based on context or event:

```typescript
import { createMachine, guard } from '@philjs/xstate';

interface FormContext {
  email: string;
  password: string;
  errors: string[];
}

type FormEvent =
  | { type: 'SUBMIT' }
  | { type: 'CHANGE'; field: string; value: string };

const formMachine = createMachine<FormContext, FormEvent>({
  id: 'form',
  initial: 'editing',
  context: {
    email: '',
    password: '',
    errors: []
  },
  states: {
    editing: {
      on: {
        CHANGE: {
          target: 'editing',
          actions: (ctx, event) => ({
            [event.field]: event.value
          })
        },
        SUBMIT: [
          {
            target: 'submitting',
            cond: guard((ctx) =>
              ctx.email.includes('@') && ctx.password.length >= 8
            )
          },
          {
            target: 'editing',
            actions: (ctx) => ({
              errors: ['Invalid email or password']
            })
          }
        ]
      }
    },
    submitting: {
      // ...
    },
    success: {
      type: 'final'
    }
  }
});
```

### Multiple Guards

```typescript
const paymentMachine = createMachine({
  states: {
    checkout: {
      on: {
        PAY: [
          {
            target: 'processing',
            cond: guard((ctx, evt) => evt.method === 'credit'),
            actions: processCreditCard
          },
          {
            target: 'processing',
            cond: guard((ctx, evt) => evt.method === 'paypal'),
            actions: processPayPal
          },
          {
            target: 'error',
            // Default fallback (no guard)
          }
        ]
      }
    }
  }
});
```

---

## Actions

### Entry and Exit Actions

```typescript
import { createMachine, assign } from '@philjs/xstate';

const timerMachine = createMachine({
  id: 'timer',
  initial: 'idle',
  context: { elapsed: 0, interval: null },
  states: {
    idle: {
      on: { START: 'running' }
    },
    running: {
      entry: (ctx) => {
        console.log('Timer started');
        return { elapsed: 0 };
      },
      exit: (ctx) => {
        console.log('Timer stopped');
      },
      on: {
        TICK: {
          target: 'running',
          actions: (ctx) => ({ elapsed: ctx.elapsed + 1 })
        },
        STOP: 'idle',
        PAUSE: 'paused'
      }
    },
    paused: {
      on: {
        RESUME: 'running',
        STOP: 'idle'
      }
    }
  }
});
```

### Transition Actions

```typescript
const authMachine = createMachine({
  states: {
    loggedOut: {
      on: {
        LOGIN: {
          target: 'loggedIn',
          actions: [
            (ctx, event) => ({ user: event.user }),
            (ctx) => { localStorage.setItem('user', JSON.stringify(ctx.user)); }
          ]
        }
      }
    },
    loggedIn: {
      on: {
        LOGOUT: {
          target: 'loggedOut',
          actions: [
            () => ({ user: null }),
            () => { localStorage.removeItem('user'); }
          ]
        }
      }
    }
  }
});
```

### assign Helper

```typescript
import { assign } from '@philjs/xstate';

const machine = createMachine({
  context: { count: 0 },
  states: {
    active: {
      on: {
        INCREMENT: {
          actions: assign((ctx, event) => ({
            count: ctx.count + (event.amount || 1)
          }))
        }
      }
    }
  }
});
```

---

## Services (Invoke)

Handle async operations:

```typescript
interface UserContext {
  userId: string;
  user: User | null;
  error: Error | null;
}

type UserEvent =
  | { type: 'FETCH'; userId: string }
  | { type: 'done'; data: User }
  | { type: 'error'; error: Error };

const userMachine = createMachine<UserContext, UserEvent>({
  id: 'user',
  initial: 'idle',
  context: {
    userId: '',
    user: null,
    error: null
  },
  states: {
    idle: {
      on: {
        FETCH: {
          target: 'loading',
          actions: (ctx, event) => ({ userId: event.userId })
        }
      }
    },
    loading: {
      invoke: {
        id: 'fetchUser',
        src: async (ctx) => {
          const response = await fetch(`/api/users/${ctx.userId}`);
          if (!response.ok) throw new Error('Failed to fetch');
          return response.json();
        },
        onDone: {
          target: 'success',
          actions: (ctx, event) => ({
            user: event.data,
            error: null
          })
        },
        onError: {
          target: 'failure',
          actions: (ctx, event) => ({
            error: event.error,
            user: null
          })
        }
      }
    },
    success: {
      on: {
        FETCH: 'loading'
      }
    },
    failure: {
      on: {
        FETCH: 'loading'
      }
    }
  }
});
```

---

## Delayed Transitions

Time-based state changes:

```typescript
const toastMachine = createMachine({
  id: 'toast',
  initial: 'hidden',
  context: { message: '' },
  states: {
    hidden: {
      on: {
        SHOW: {
          target: 'visible',
          actions: (ctx, event) => ({ message: event.message })
        }
      }
    },
    visible: {
      // Auto-hide after 3 seconds
      after: {
        3000: 'hidden'
      },
      on: {
        HIDE: 'hidden'
      }
    }
  }
});
```

---

## Using Machines

### useMachine Hook

```typescript
import { useMachine } from '@philjs/xstate';

function Counter() {
  const [state, send] = useMachine(counterMachine);

  return (
    <div>
      <p>Count: {state().context.count}</p>
      <p>State: {state().value}</p>

      <button onClick={() => send('INCREMENT')}>+</button>
      <button onClick={() => send('DECREMENT')}>-</button>
      <button onClick={() => send('RESET')}>Reset</button>

      {/* Check current state */}
      {state().matches('active') && <p>Counter is active</p>}
    </div>
  );
}
```

### Actor API

```typescript
const machine = createMachine({ /* ... */ });
const actor = machine.createActor();

// Get current state
const currentState = actor.getSnapshot();
console.log(currentState.value);
console.log(currentState.context);

// Send events
actor.send('START');
actor.send({ type: 'UPDATE', value: 42 });

// Subscribe to changes
const unsubscribe = actor.subscribe((state) => {
  console.log('New state:', state.value);
});

// Stop actor (cleanup)
actor.stop();
```

### State Object

```typescript
interface State<TContext> {
  /** Current state value */
  value: string;

  /** Current context */
  context: TContext;

  /** Whether state changed on last transition */
  changed: boolean;

  /** Whether machine reached final state */
  done: boolean;

  /** Check if in specific state */
  matches: (value: string) => boolean;
}
```

---

## Visualization

### Generate Mermaid Diagram

```typescript
import { createMachine, toMermaid } from '@philjs/xstate';

const machine = createMachine({
  id: 'trafficLight',
  initial: 'red',
  states: {
    red: { on: { NEXT: 'green' } },
    green: { on: { NEXT: 'yellow' } },
    yellow: { on: { NEXT: 'red' } }
  }
});

const diagram = toMermaid(machine);
console.log(diagram);
// stateDiagram-v2
//   [*] --> red
//   red --> green: NEXT
//   green --> yellow: NEXT
//   yellow --> red: NEXT
```

### Visualization Data

```typescript
import { visualize } from '@philjs/xstate';
import type { VisualizationGraph, VisualizationNode } from '@philjs/xstate';

const graph: VisualizationGraph = visualize(machine);

console.log(graph.nodes);
// [
//   { id: 'red', label: 'red', type: 'atomic', transitions: [...] },
//   { id: 'green', label: 'green', type: 'atomic', transitions: [...] },
//   ...
// ]

console.log(graph.edges);
// [
//   { from: 'red', to: 'green', label: 'NEXT' },
//   { from: 'green', to: 'yellow', label: 'NEXT' },
//   ...
// ]
```

---

## Types Reference

```typescript
// Event object
interface EventObject {
  type: string;
  [key: string]: any;
}

// State node configuration
interface StateNode<TContext, TEvent extends EventObject> {
  on?: {
    [K in TEvent['type']]?: string | TransitionConfig<TContext, TEvent>;
  };
  entry?: Action<TContext, TEvent> | Array<Action<TContext, TEvent>>;
  exit?: Action<TContext, TEvent> | Array<Action<TContext, TEvent>>;
  always?: string | TransitionConfig<TContext, TEvent>;
  after?: { [delay: number]: string | TransitionConfig<TContext, TEvent> };
  initial?: string;
  states?: { [key: string]: StateNode<TContext, TEvent> };
  type?: 'atomic' | 'compound' | 'final';
  invoke?: ServiceConfig<TContext, TEvent> | Array<ServiceConfig<TContext, TEvent>>;
}

// Transition configuration
interface TransitionConfig<TContext, TEvent extends EventObject> {
  target?: string;
  cond?: Guard<TContext, TEvent>;
  actions?: Action<TContext, TEvent> | Array<Action<TContext, TEvent>>;
}

// Guard function
type Guard<TContext, TEvent> = (context: TContext, event: TEvent) => boolean;

// Action function
type Action<TContext, TEvent> = (
  context: TContext,
  event: TEvent
) => void | Partial<TContext>;

// Service configuration
interface ServiceConfig<TContext, TEvent extends EventObject> {
  id?: string;
  src: (context: TContext, event: TEvent) => Promise<any> | (() => void);
  onDone?: string | TransitionConfig<TContext, TEvent>;
  onError?: string | TransitionConfig<TContext, TEvent>;
}

// Machine configuration
interface MachineConfig<TContext, TEvent extends EventObject> {
  id?: string;
  initial: string;
  context?: TContext;
  states: { [key: string]: StateNode<TContext, TEvent> };
}

// Actor reference
interface ActorRef<TEvent extends EventObject> {
  send: (event: TEvent | TEvent['type']) => void;
  subscribe: (listener: (state: State) => void) => () => void;
  getSnapshot: () => State;
  stop: () => void;
}
```

---

## Best Practices

### 1. Define Event Types

```typescript
// Good - explicit event types
type Event =
  | { type: 'FETCH'; id: string }
  | { type: 'SUCCESS'; data: Data }
  | { type: 'ERROR'; error: Error };

const machine = createMachine<Context, Event>({ /* ... */ });
```

### 2. Use Final States

```typescript
const wizardMachine = createMachine({
  initial: 'step1',
  states: {
    step1: { on: { NEXT: 'step2' } },
    step2: { on: { NEXT: 'step3', BACK: 'step1' } },
    step3: { on: { SUBMIT: 'complete', BACK: 'step2' } },
    complete: { type: 'final' }
  }
});
```

### 3. Separate Context Updates

```typescript
// Good - actions return context updates
actions: (ctx, event) => ({
  user: event.user,
  lastLogin: Date.now()
})

// Avoid - mutating context directly
// actions: (ctx, event) => { ctx.user = event.user; }
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `createMachine` | Create a state machine |
| `useMachine` | Hook for using machine in components |
| `Machine` | Machine class |
| `assign` | Create context assignment action |
| `guard` | Create guard predicate |
| `visualize` | Generate visualization data |
| `toMermaid` | Generate Mermaid diagram |

---

## Next Steps

- [@philjs/core Signals](../core/signals.md)
- [@philjs/atoms for Atomic State](../atoms/overview.md)
- [@philjs/zustand for Simple State](../zustand/overview.md)
