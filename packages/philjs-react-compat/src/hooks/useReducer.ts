/**
 * React useReducer compatibility wrapper for PhilJS signals.
 * Provides a familiar API for React developers while using PhilJS signals under the hood.
 */

import { signal, type Signal } from 'philjs-core';

/**
 * Dispatch function type for reducer actions.
 */
export type Dispatch<Action> = (action: Action) => void;

/**
 * Reducer function type.
 */
export type Reducer<State, Action> = (state: State, action: Action) => State;

/**
 * React-compatible useReducer hook that wraps PhilJS signals.
 * Returns [state, dispatch] tuple similar to React's useReducer.
 *
 * @example
 * ```tsx
 * type State = { count: number };
 * type Action = { type: 'increment' } | { type: 'decrement' } | { type: 'reset' };
 *
 * function Counter() {
 *   const [state, dispatch] = useReducer(
 *     (state: State, action: Action) => {
 *       switch (action.type) {
 *         case 'increment':
 *           return { count: state.count + 1 };
 *         case 'decrement':
 *           return { count: state.count - 1 };
 *         case 'reset':
 *           return { count: 0 };
 *         default:
 *           return state;
 *       }
 *     },
 *     { count: 0 }
 *   );
 *
 *   return (
 *     <div>
 *       <p>Count: {state.count}</p>
 *       <button onClick={() => dispatch({ type: 'increment' })}>+</button>
 *       <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
 *       <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * Note: While this works, consider using signals directly for simpler state management:
 * ```tsx
 * const count = signal(0);
 * count.set(count() + 1); // Instead of dispatch({ type: 'increment' })
 * ```
 */
export function useReducer<State, Action>(
  reducer: Reducer<State, Action>,
  initialState: State
): [State, Dispatch<Action>];

export function useReducer<State, Action, Init>(
  reducer: Reducer<State, Action>,
  initialArg: Init,
  init: (arg: Init) => State
): [State, Dispatch<Action>];

export function useReducer<State, Action, Init = State>(
  reducer: Reducer<State, Action>,
  initialArg: State | Init,
  init?: (arg: Init) => State
): [State, Dispatch<Action>] {
  // Initialize state
  const initialState = init !== undefined
    ? init(initialArg as Init)
    : (initialArg as State);

  const stateSignal = signal<State>(initialState);

  // Create dispatch function
  const dispatch: Dispatch<Action> = (action: Action) => {
    const currentState = stateSignal();
    const newState = reducer(currentState, action);
    stateSignal.set(newState);
  };

  return [stateSignal(), dispatch];
}

/**
 * Advanced version that returns both the signal and React-style tuple.
 * Useful when you want to gradually migrate to PhilJS patterns.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const { signal: stateSignal, tuple: [state, dispatch] } = useReducerAdvanced(
 *     reducer,
 *     initialState
 *   );
 *
 *   // Use React style
 *   dispatch({ type: 'increment' });
 *
 *   // Or use PhilJS style
 *   stateSignal.set({ count: stateSignal().count + 1 });
 * }
 * ```
 */
export function useReducerAdvanced<State, Action>(
  reducer: Reducer<State, Action>,
  initialState: State
): {
  signal: Signal<State>;
  tuple: [State, Dispatch<Action>];
} {
  const stateSignal = signal<State>(initialState);

  const dispatch: Dispatch<Action> = (action: Action) => {
    const currentState = stateSignal();
    const newState = reducer(currentState, action);
    stateSignal.set(newState);
  };

  return {
    signal: stateSignal,
    tuple: [stateSignal(), dispatch]
  };
}

/**
 * Common reducer patterns for convenience.
 */
export const reducers = {
  /**
   * Counter reducer with increment/decrement/reset actions.
   */
  counter: (state: number, action: { type: 'increment' | 'decrement' | 'reset'; payload?: number }) => {
    switch (action.type) {
      case 'increment':
        return state + (action.payload ?? 1);
      case 'decrement':
        return state - (action.payload ?? 1);
      case 'reset':
        return action.payload ?? 0;
      default:
        return state;
    }
  },

  /**
   * Toggle reducer for boolean state.
   */
  toggle: (state: boolean, action: { type: 'toggle' | 'set'; payload?: boolean }) => {
    switch (action.type) {
      case 'toggle':
        return !state;
      case 'set':
        return action.payload ?? state;
      default:
        return state;
    }
  },

  /**
   * Array reducer with add/remove/clear actions.
   */
  array: <T>(state: T[], action: { type: 'add' | 'remove' | 'clear' | 'set'; payload?: any }) => {
    switch (action.type) {
      case 'add':
        return [...state, action.payload];
      case 'remove':
        return state.filter((_, i) => i !== action.payload);
      case 'clear':
        return [];
      case 'set':
        return action.payload;
      default:
        return state;
    }
  },

  /**
   * Object reducer with update/reset actions.
   */
  object: <T extends Record<string, any>>(
    state: T,
    action: { type: 'update' | 'reset'; payload?: any }
  ) => {
    switch (action.type) {
      case 'update':
        return { ...state, ...action.payload };
      case 'reset':
        return action.payload ?? state;
      default:
        return state;
    }
  }
};

/**
 * Hook for simple counter state with reducer pattern.
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, { increment, decrement, reset }] = useCounterReducer(0);
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => increment()}>+</button>
 *       <button onClick={() => increment(5)}>+5</button>
 *       <button onClick={() => decrement()}>-</button>
 *       <button onClick={() => reset()}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCounterReducer(initialValue: number = 0): [
  number,
  {
    increment: (amount?: number) => void;
    decrement: (amount?: number) => void;
    reset: (value?: number) => void;
  }
] {
  const [count, dispatch] = useReducer(reducers.counter, initialValue);

  return [
    count,
    {
      increment: (amount?: number) => dispatch({ type: 'increment', payload: amount }),
      decrement: (amount?: number) => dispatch({ type: 'decrement', payload: amount }),
      reset: (value?: number) => dispatch({ type: 'reset', payload: value })
    }
  ];
}

/**
 * Hook for toggle state with reducer pattern.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const [isOpen, { toggle, setTrue, setFalse }] = useToggleReducer(false);
 *
 *   return (
 *     <div>
 *       <button onClick={toggle}>Toggle</button>
 *       <button onClick={setTrue}>Open</button>
 *       <button onClick={setFalse}>Close</button>
 *       {isOpen && <div>Content</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useToggleReducer(initialValue: boolean = false): [
  boolean,
  {
    toggle: () => void;
    setTrue: () => void;
    setFalse: () => void;
  }
] {
  const [value, dispatch] = useReducer(reducers.toggle, initialValue);

  return [
    value,
    {
      toggle: () => dispatch({ type: 'toggle' }),
      setTrue: () => dispatch({ type: 'set', payload: true }),
      setFalse: () => dispatch({ type: 'set', payload: false })
    }
  ];
}
