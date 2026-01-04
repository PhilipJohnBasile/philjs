/**
 * Bridge module exports
 */

// Signal Bridge
export {
  createSignalBridge,
  bridgeSignal,
  bridgeMemo,
  bridgeExternal,
  batchBridgeUpdates,
  resolveValue,
  resolveProps,
  type ExternalReactiveSource,
} from './signal-bridge.js';

// Context Bridge
export {
  createUniversalContext,
  ContextBridge,
  getGlobalContextBridge,
  createScopedContextBridge,
  createContextProvider,
  type ContextProvider,
} from './context-bridge.js';

// Event Bridge
export {
  EventTunnelImpl,
  getGlobalEventTunnel,
  createScopedEventTunnel,
  bridgeDOMEvents,
  createDOMEvent,
  dispatchAsDOMEvent,
} from './event-bridge.js';
