/**
 * React Hooks for PhilJS Universal Component Protocol.
 *
 * @example
 * ```tsx
 * import { useSignal, useSignalState, useUniversalContext } from '@philjs/universal-react/hooks';
 *
 * const count = signal(0);
 *
 * function Counter() {
 *   const [value, setValue] = useSignalState(count);
 *   const theme = useUniversalContext<Theme>('theme');
 *
 *   return (
 *     <div style={{ color: theme?.primary }}>
 *       <span>Count: {value}</span>
 *       <button onClick={() => setValue(v => v + 1)}>+</button>
 *     </div>
 *   );
 * }
 * ```
 */

// Signal hooks
export {
  useSignal,
  useSignalState,
  useSignals,
  useComputed,
  useSignalWhen,
} from './use-signal.js';

// Universal context hooks
export {
  useUniversalContext,
  useUniversalContextState,
  useProvideUniversalContext,
  useHasUniversalContext,
  useAwaitUniversalContext,
} from './use-universal-context.js';
