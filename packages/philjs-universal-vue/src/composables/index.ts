/**
 * Vue Composables for PhilJS Integration
 *
 * This module exports all composables for bridging PhilJS features
 * with Vue's Composition API.
 *
 * @example
 * ```ts
 * import {
 *   useSignal,
 *   useWritableSignal,
 *   useUniversalContext,
 * } from '@philjs/universal-vue/composables';
 * ```
 */

// Signal composables
export {
  useSignal,
  useWritableSignal,
  useTransformedSignal,
  useDebouncedSignal,
  useThrottledSignal,
  type ReadonlyRef,
} from './use-signal.js';

// Context composables
export {
  useUniversalContext,
  useUniversalContextWithDefault,
  useProvideUniversalContext,
  useWatchUniversalContext,
  useHasUniversalContext,
  useUniversalContexts,
  UNIVERSAL_CONTEXT_KEY,
} from './use-universal-context.js';
