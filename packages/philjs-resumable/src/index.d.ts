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
export { type QRL, type QRLOptions, type QRLEventHandler, type QRLComponent, createQRL, parseQRL, isQRL, getQRLAttribute, prefetchQRL, prefetchQRLs, qrl, inlineQRL, $, component$, event$, onClick$, onInput$, onChange$, onSubmit$, onKeyDown$, onKeyUp$, onFocus$, onBlur$, signal$, computed$, server$, browser$, useVisibleTask$, useTask$, configureQRL, registerChunk, registerChunks, clearQRLRegistry, } from './qrl.js';
export { type SerializedSignal, type SerializedValue, type SerializedHandler, type SerializedElement, type SerializationContext, createSerializationContext, getSerializationContext, withSerializationContext, generateId, serializeValue, deserializeValue, registerElement, registerSignal, addSignalSubscriber, registerComponent, generateStateScript, generateBootstrapScript, generateElementAttributes, createStreamingContext, addStreamingChunk, serializeToAttribute, deserializeFromAttribute, generateInlineState, } from './serializer.js';
export { type ComponentLoader, type LazyComponent, type LoaderConfig, configureLoader, getLoaderConfig, registerLazyComponent, registerLazyComponents, getLazyComponent, hasLazyComponent, loadComponent, loadFromQRL, loadAndHydrate, loadAndInvokeHandler, queueLoad, prefetchChunk, prefetchComponent, prefetchVisibleComponents, initLoader, getLoaderStats, clearLoaderCache, waitForLoads, } from './loader.js';
export { type HydrationStrategy, type HydrationOptions, type VisibleOptions, type InteractionOptions, type MediaOptions, type IdleOptions, type CustomOptions, type AnyHydrationOptions, type HydrateProps, setupHydration, cancelHydration, forceHydration, isHydrated, queueHydration, Hydrate, useHydration, discoverHydrationBoundaries, initHydration, getHydrationStats, clearHydrationState, waitForHydration, } from './hydration.js';
export { type ResumableComponent, type ResumableSignal, type ResumableContext, type ResumableConfig, resumable$, useSignal, useComputed, handler$, getResumableContext, withResumableContext, getCurrentComponentId, isServer, isResumable, renderToResumableString, createStreamingRenderer, resume, static$, client$, server$component, } from './resumable.js';
export { type ContainerState, type ContainerConfig, type ContainerProps, type ErrorBoundaryProps, type SuspenseProps, type ContainerContextValue, ResumableContainer, ErrorBoundary, Suspense, getContainer, getAllContainers, resumeContainer, resumeAllContainers, isContainerHydrated, waitForContainer, disposeContainer, disposeAllContainers, useContainerContext, ContainerProvider, prefetchContainer, setupContainerPrefetching, getContainerStats, } from './container.js';
/**
 * Default export with common utilities
 */
declare const PhilResumable: {
    $: typeof import("./qrl.js").$;
    resumable$: typeof import("./resumable.js").resumable$;
    useSignal: typeof import("./resumable.js").useSignal;
    resume: typeof import("./resumable.js").resume;
    Hydrate: (props: import("./hydration.js").HydrateProps) => unknown;
    ResumableContainer: typeof import("./container.js").ResumableContainer;
    renderToResumableString: typeof import("./resumable.js").renderToResumableString;
};
export default PhilResumable;
/**
 * Package version
 */
export declare const VERSION = "2.0.0";
/**
 * Feature flags
 */
export declare const FEATURES: {
    readonly resumability: true;
    readonly partialHydration: true;
    readonly streamingSSR: true;
    readonly qrl: true;
    readonly signalSerialization: true;
};
//# sourceMappingURL=index.d.ts.map