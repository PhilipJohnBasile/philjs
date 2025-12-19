# PhilJS State Management Enhancements - Week 9-10 Sprint

## Overview

This sprint adds comprehensive state management integrations to PhilJS, providing developers with multiple approaches to managing application state. All integrations are built on top of PhilJS's signal-based reactivity system for optimal performance.

## New Packages

### 1. philjs-zustand

**Location:** `packages/philjs-zustand`

Zustand-style state management with a minimal, unopinionated API backed by PhilJS signals.

**Features:**
- Simple store creation with `createStore()`
- Signal-based reactivity for fine-grained updates
- Middleware support:
  - `persist` - LocalStorage/SessionStorage persistence
  - `devtools` - Redux DevTools integration
  - `immer` - Mutable-style updates
- Shallow equality utilities
- Store combination utilities
- Slice pattern support

**Example:**
```typescript
import { createStore } from 'philjs-zustand';

const useStore = createStore((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// In components
const count = useStore(state => state.count);
const increment = useStore(state => state.increment);
```

**Files Created:**
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - Full implementation (510 lines)
- `src/index.test.ts` - Comprehensive test suite
- `README.md` - Complete documentation with examples

---

### 2. philjs-xstate

**Location:** `packages/philjs-xstate`

XState-inspired finite state machines with signal-based reactivity.

**Features:**
- Finite state machines with clear transitions
- Context management
- Guards (conditional transitions)
- Actions (entry/exit/transition)
- Delayed transitions (after)
- Invoked services (async operations)
- Actor model support
- State visualization:
  - `visualize()` - Generate graph data
  - `toMermaid()` - Generate Mermaid diagrams

**Example:**
```typescript
import { createMachine, useMachine } from 'philjs-xstate';

const fetchMachine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: { FETCH: 'loading' }
    },
    loading: {
      invoke: {
        src: async () => fetch('/api/data').then(r => r.json()),
        onDone: 'success',
        onError: 'error'
      }
    },
    success: {},
    error: {}
  }
});

const [state, send] = useMachine(fetchMachine);
```

**Files Created:**
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - Full implementation (730 lines)
- `src/index.test.ts` - Comprehensive test suite
- `README.md` - Complete documentation with examples

---

### 3. philjs-atoms

**Location:** `packages/philjs-atoms`

Jotai-style atomic state management with signal-based reactivity.

**Features:**
- Primitive atoms (read/write state)
- Derived atoms (computed values)
- Async atoms (promise-based)
- Loadable pattern (no throw)
- Atom families (parameterized atoms)
- Write-only atoms (actions)
- Utilities:
  - `atomWithReset` - Resettable atoms
  - `atomWithStorage` - Persistent atoms
  - `selectAtom` - Property selection
  - `focusAtom` - Property focus (read/write)
  - `splitAtom` - Separate read/write
  - `batchAtoms` - Batch updates

**Example:**
```typescript
import { atom, useAtom, useAtomValue } from 'philjs-atoms';

// Primitive atom
const countAtom = atom(0);

// Derived atom
const doubledAtom = atom((get) => get(countAtom) * 2);

// Writable derived atom
const fahrenheitAtom = atom(
  (get) => get(celsiusAtom) * 1.8 + 32,
  (get, set, newValue: number) => {
    set(celsiusAtom, (newValue - 32) / 1.8);
  }
);

// In components
const [count, setCount] = useAtom(countAtom);
const doubled = useAtomValue(doubledAtom);
```

**Files Created:**
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - Full implementation (640 lines)
- `src/index.test.ts` - Comprehensive test suite
- `README.md` - Complete documentation with examples

---

### 4. philjs-devtools Enhancement

**Location:** `packages/philjs-devtools`

Enhanced with Redux DevTools integration and state management features.

**New Features:**
- Redux DevTools Extension integration
- Action tracking and replay
- State persistence (localStorage/sessionStorage)
- Time travel debugging integration
- State diffing utilities

**Key Components:**

#### ReduxDevTools Class
- Connect to Redux DevTools Extension
- Send actions and state updates
- Handle time travel events
- State import/export
- Action filtering (whitelist/blacklist)
- State/action sanitization

#### ActionReplayer Class
- Record user actions
- Replay actions with configurable speed
- Stop/resume replay
- Clear recording

#### StatePersistence Class
- Save state to storage
- Load state with version migration
- Clear persisted state

**Example:**
```typescript
import { initReduxDevTools } from 'philjs-devtools';

const devTools = initReduxDevTools(
  { count: 0, user: null },
  {
    name: 'MyApp',
    maxAge: 50,
    trace: true,
    actionsBlacklist: ['PING'],
  }
);

// Track state changes
devTools.send({ type: 'INCREMENT' }, { count: 1 });

// Handle time travel
devTools.onStateChange = (state) => {
  // Update your app state
};
```

**Files Created/Updated:**
- `src/redux-devtools.ts` - Redux DevTools implementation (700 lines)
- `src/redux-devtools.test.ts` - Test suite
- `src/index.ts` - Updated exports
- `README.md` - Updated with Redux DevTools documentation

---

## Integration Points

All state management solutions integrate seamlessly with PhilJS signals:

1. **philjs-zustand** - Uses signals internally for store state
2. **philjs-xstate** - State machines backed by signals
3. **philjs-atoms** - Atoms built on top of signals
4. **philjs-devtools** - Tracks signal changes for debugging

## Testing

Each package includes comprehensive test suites:

- **philjs-zustand**: 10+ test cases covering stores, middleware, utilities
- **philjs-xstate**: 15+ test cases covering machines, actors, visualization
- **philjs-atoms**: 20+ test cases covering atoms, families, utilities
- **philjs-devtools**: 10+ test cases for Redux DevTools integration

Run tests with:
```bash
npm test
# or
pnpm test
```

## Documentation

Each package includes:
- Complete README.md with:
  - Feature overview
  - Installation instructions
  - Basic and advanced examples
  - API reference
  - TypeScript usage
  - Performance tips
  - Best practices

## Build Configuration

All packages use the shared rollup.config.js with:
- ES module output
- TypeScript compilation
- Source maps
- Tree-shaking optimizations
- External dependencies (philjs-core, etc.)

## Usage Examples

### Zustand for Simple State
```typescript
const useCounterStore = createStore((set) => ({
  count: 0,
  increment: () => set(s => ({ count: s.count + 1 })),
}));
```

### XState for Complex Flows
```typescript
const authMachine = createMachine({
  initial: 'idle',
  states: {
    idle: { on: { LOGIN: 'authenticating' } },
    authenticating: {
      invoke: {
        src: loginUser,
        onDone: 'authenticated',
        onError: 'error'
      }
    },
    authenticated: {},
    error: {}
  }
});
```

### Atoms for Granular State
```typescript
const userIdAtom = atom(1);
const userAtom = asyncAtom(async (get) => {
  const id = get(userIdAtom);
  return fetchUser(id);
});
```

### DevTools for Debugging
```typescript
const devTools = initReduxDevTools(initialState);
signal.subscribe(value => {
  devTools.send({ type: 'UPDATE' }, { value });
});
```

## Performance Considerations

All implementations leverage PhilJS signals for:
- Fine-grained reactivity
- Minimal re-renders
- Efficient updates
- Optimal memory usage

## Compatibility

- Works with all PhilJS features (SSR, Islands, Router, etc.)
- Compatible with existing PhilJS applications
- TypeScript support with full type inference
- Works in browser and Node.js environments

## Future Enhancements

Potential additions:
- Recoil-style atoms
- MobX-style observables
- Valtio-style proxies
- Query/mutation integrations (React Query style)
- More DevTools visualizations

## Migration Guide

Existing PhilJS apps can adopt these gradually:

1. **Start with philjs-zustand** for simple global state
2. **Add philjs-xstate** for complex flows (auth, forms)
3. **Use philjs-atoms** for fine-grained component state
4. **Enable philjs-devtools** in development

## Package Sizes

Estimated bundle sizes (minified + gzipped):
- **philjs-zustand**: ~2-3KB
- **philjs-xstate**: ~3-4KB
- **philjs-atoms**: ~2-3KB
- **philjs-devtools** (Redux): ~5-6KB (dev only)

## Summary

This sprint delivers:
- **3 new state management packages** (Zustand, XState, Atoms)
- **1 enhanced package** (DevTools with Redux integration)
- **4 complete implementations** with full TypeScript support
- **Comprehensive test coverage** across all packages
- **Detailed documentation** with examples and best practices
- **Multiple state management patterns** for different use cases

All packages are production-ready and follow PhilJS conventions for reactivity, testing, and documentation.
