/**
 * PhilJS Resumable - Zero-JavaScript Resumability and Partial Hydration
 *
 * This package provides Qwik-style resumability for PhilJS applications,
 * enabling zero JavaScript execution until user interaction.
 *
 * Key Features:
 * - **Resumability**: Serialize component state to HTML, lazy-load code on interaction
 * - **QRL (Quick Resource Locator)**: Lazy references for functions and components
 * - **Partial Hydration**: Only hydrate interactive components
 * - **Hydration Strategies**: idle, visible, interaction, media query, custom
 * - **Streaming SSR**: Progressive rendering with out-of-order hydration
 *
 * @example
 * ```typescript
 * import {
 *   resumable$,
 *   useSignal,
 *   $,
 *   Hydrate,
 *   ResumableContainer,
 *   resume
 * } from 'philjs-resumable';
 *
 * // Define a resumable component
 * const Counter = resumable$(() => {
 *   const count = useSignal(0);
 *   return (
 *     <button onClick$={() => count.value++}>
 *       Count: {count.value}
 *     </button>
 *   );
 * });
 *
 * // Use partial hydration
 * function App() {
 *   return (
 *     <Hydrate when="visible">
 *       <Counter />
 *     </Hydrate>
 *   );
 * }
 *
 * // On client, resume the application
 * resume();
 * ```
 *
 * @packageDocumentation
 */

// ============================================================================
// QRL (Quick Resource Locator)
// ============================================================================

export {
  // Core QRL
  type QRL,
  type QRLOptions,
  type QRLEventHandler,
  type QRLComponent,
  createQRL,
  parseQRL,
  isQRL,
  getQRLAttribute,
  prefetchQRL,
  prefetchQRLs,
  qrl,
  inlineQRL,

  // QRL Factory Functions
  $,
  component$,
  event$,

  // Common Event Handlers
  onClick$,
  onInput$,
  onChange$,
  onSubmit$,
  onKeyDown$,
  onKeyUp$,
  onFocus$,
  onBlur$,

  // Signal/State QRLs
  signal$,
  computed$,

  // Task QRLs
  server$,
  browser$,
  useVisibleTask$,
  useTask$,

  // Configuration
  configureQRL,
  registerChunk,
  registerChunks,
  clearQRLRegistry,
} from './qrl.js';

// ============================================================================
// Serialization
// ============================================================================

export {
  // Types
  type SerializedSignal,
  type SerializedValue,
  type SerializedHandler,
  type SerializedElement,
  type SerializationContext,

  // Context Management
  createSerializationContext,
  getSerializationContext,
  withSerializationContext,
  generateId,

  // Value Serialization
  serializeValue,

  // Element/Signal Registration
  registerElement,
  registerSignal,
  addSignalSubscriber,
  registerComponent,

  // HTML Generation
  generateStateScript,
  generateBootstrapScript,
  generateElementAttributes,

  // Streaming
  createStreamingContext,
  addStreamingChunk,

  // Compact Serialization
  serializeToAttribute,
  generateInlineState,
} from './serializer.js';

// ============================================================================
// Loader
// ============================================================================

export {
  // Types
  type ComponentLoader,
  type LazyComponent,
  type LoaderConfig,

  // Configuration
  configureLoader,
  getLoaderConfig,

  // Component Registration
  registerLazyComponent,
  registerLazyComponents,
  getLazyComponent,
  hasLazyComponent,

  // Loading
  loadComponent,
  loadFromQRL,
  loadAndHydrate,
  loadAndInvokeHandler,
  queueLoad,
  prefetchChunk,
  prefetchComponent,
  prefetchVisibleComponents,

  // Initialization
  initLoader,

  // Utilities
  getLoaderStats,
  clearLoaderCache,
  waitForLoads,
} from './loader.js';

// ============================================================================
// Hydration
// ============================================================================

export {
  // Types
  type HydrationStrategy,
  type HydrationOptions,
  type VisibleOptions,
  type InteractionOptions,
  type MediaOptions,
  type IdleOptions,
  type CustomOptions,
  type AnyHydrationOptions,
  type HydrateProps,

  // Core Functions
  setupHydration,
  cancelHydration,
  forceHydration,
  isHydrated,
  queueHydration,

  // Components
  Hydrate,
  useHydration,

  // Discovery
  discoverHydrationBoundaries,
  initHydration,

  // Utilities
  getHydrationStats,
  clearHydrationState,
  waitForHydration,
} from './hydration.js';

// ============================================================================
// Resumable Core
// ============================================================================

export {
  // Types
  type ResumableComponent,
  type ResumableSignal,
  type ResumableContext,
  type ResumableConfig,
  type ResumableOptions,

  // Component Factory
  resumable$,
  resumable,

  // Progressive Hydration Wrappers
  visible,
  interactive,
  idle,
  eager,
  static_,

  // Signals
  useSignal,
  useComputed,

  // Event Handlers
  handler$,

  // Context
  getResumableContext,
  withResumableContext,
  getCurrentComponentId,
  isServer,
  isResumable,

  // SSR
  renderToResumableString,
  createStreamingRenderer,

  // Client Resume
  resume,

  // Component Modifiers
  static$,
  client$,
  server$component,

  // Trigger re-exports
  onVisible,
  onInteraction,
  onIdle,
  onLoad,
  never,
  type Trigger,
  type TriggerType,
} from './resumable.js';

// ============================================================================
// Triggers
// ============================================================================

export {
  // Types
  type HydrationCallback,
  type TriggerCleanup,
  type TriggerFunction,
  type VisibleTriggerOptions,
  type InteractionTriggerOptions,
  type IdleTriggerOptions,
  type MediaTriggerOptions,

  // Trigger Factories
  onMedia,
  onCustom,
  onEvent,
  onFastNetwork,
  afterDelay,

  // Combinators
  anyOf,
  allOf,

  // Utilities
  isTrigger,
  fromString,
  defaultTrigger,
} from './triggers.js';

// ============================================================================
// Deserializer
// ============================================================================

export {
  // Types
  type DeserializedState,
  type DeserializedSignal,
  type DeserializedElement,
  type DeserializedComponent,
  type DeserializationOptions,

  // Core Deserialization
  deserializeValue,
  deserializeState,

  // DOM Resolution
  resolveElements,
  setupSignalBindings,
  resumeFromDOM,

  // Attribute Deserialization
  deserializeFromAttribute,
  getElementState,

  // Signal Resolution
  resolveSignalRef,

  // Utilities
  isSignalRef,
  isQRLRef,
  getUnhydratedElements,
  getUnhydratedComponents,
  markHydrated,
  clearDeserializedState,
} from './deserializer.js';

// ============================================================================
// Container
// ============================================================================

export {
  // Types
  type ContainerState,
  type ContainerConfig,
  type ContainerProps,
  type ErrorBoundaryProps,
  type SuspenseProps,
  type ContainerContextValue,

  // Components
  ResumableContainer,
  ErrorBoundary,
  Suspense,

  // Container Management
  getContainer,
  getAllContainers,
  resumeContainer,
  resumeAllContainers,
  isContainerHydrated,
  waitForContainer,
  disposeContainer,
  disposeAllContainers,

  // Context
  useContainerContext,
  ContainerProvider,

  // Prefetching
  prefetchContainer,
  setupContainerPrefetching,

  // Statistics
  getContainerStats,
} from './container.js';

// ============================================================================
// Convenience Re-exports
// ============================================================================

/**
 * Default export with common utilities
 */
const PhilResumable = {
  // QRL
  $: await import('./qrl.js').then((m) => m.$),

  // Resumable
  resumable$: await import('./resumable.js').then((m) => m.resumable$),
  useSignal: await import('./resumable.js').then((m) => m.useSignal),
  resume: await import('./resumable.js').then((m) => m.resume),

  // Hydration
  Hydrate: await import('./hydration.js').then((m) => m.Hydrate),

  // Container
  ResumableContainer: await import('./container.js').then((m) => m.ResumableContainer),

  // SSR
  renderToResumableString: await import('./resumable.js').then((m) => m.renderToResumableString),
};

export default PhilResumable;

// ============================================================================
// Version
// ============================================================================

/**
 * Package version
 */
export const VERSION = '2.0.0';

/**
 * Feature flags
 */
export const FEATURES = {
  resumability: true,
  partialHydration: true,
  streamingSSR: true,
  qrl: true,
  signalSerialization: true,
} as const;
