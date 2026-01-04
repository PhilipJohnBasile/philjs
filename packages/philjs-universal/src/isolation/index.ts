/**
 * Isolation module exports
 */

export {
  getGlobalUpdateBoundary,
  createUpdateBoundary,
  isolate,
  batchUpdates,
  scheduleUpdate,
  flushUpdates,
  isIsolated,
  withIsolation,
  createIsolatedCallback,
  debounceUpdate,
  throttleUpdate,
} from './update-boundary.js';
