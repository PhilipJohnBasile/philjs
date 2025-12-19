/**
 * React hooks compatibility layer for PhilJS.
 * Export all hooks with React-compatible APIs.
 */

// State management
export {
  useState,
  useStateAdvanced,
  useControlledInput,
  useBoolean,
  useArray,
  type Setter,
  type UseStateReturn
} from './useState.js';

// Effects
export {
  useEffect,
  useLayoutEffect,
  useEffectOnce,
  useAsyncEffect,
  useInterval,
  useTimeout,
  useDebugValue
} from './useEffect.js';

// Memoization
export {
  useMemo,
  useMemoAdvanced,
  useMemoWithEquality,
  useMemoDeep
} from './useMemo.js';

// Callbacks
export {
  useCallback,
  useEventHandler,
  useLatestCallback,
  useDebouncedCallback,
  useThrottledCallback
} from './useCallback.js';

// Refs
export {
  useRef,
  useLatestRef,
  useCallbackRef,
  useMergedRef,
  usePrevious,
  useMutableRef,
  type RefObject
} from './useRef.js';

// Context
export {
  createContext,
  useContext,
  type Context
} from './useContext.js';

// Reducer
export {
  useReducer,
  useReducerAdvanced,
  useCounterReducer,
  useToggleReducer,
  reducers,
  type Dispatch,
  type Reducer
} from './useReducer.js';
