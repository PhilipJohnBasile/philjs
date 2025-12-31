/**
 * PhilJS LiveView - LiveComponent Implementation
 *
 * LiveComponents are stateful components that live within a LiveView.
 * They have their own state and can handle events independently.
 */
import type { LiveComponentDefinition, LiveViewState, LiveViewEvent, LiveSocket, ViewPatch } from './types.js';
/**
 * Create a LiveComponent
 *
 * @example
 * ```typescript
 * const Modal = createLiveComponent({
 *   id: 'modal',
 *
 *   mount: () => ({ open: false }),
 *
 *   handleEvent: (event, state) => {
 *     if (event.type === 'toggle') {
 *       return { open: !state.open };
 *     }
 *     return state;
 *   },
 *
 *   render: (state, props) => `
 *     <div class="modal ${state.open ? 'open' : ''}">
 *       <div class="modal-content">
 *         ${props.children}
 *       </div>
 *       <button phx-click="toggle" phx-target="#modal">
 *         ${state.open ? 'Close' : 'Open'}
 *       </button>
 *     </div>
 *   `,
 * });
 * ```
 */
export declare function createLiveComponent<S extends LiveViewState = LiveViewState, P = any>(definition: LiveComponentDefinition<S, P>): LiveComponentDefinition<S, P>;
/**
 * Register a global LiveComponent
 */
export declare function registerComponent(name: string, component: LiveComponentDefinition): void;
/**
 * Get a registered component
 */
export declare function getComponent(name: string): LiveComponentDefinition | undefined;
export interface LiveComponentInstance<S extends LiveViewState = LiveViewState, P = any> {
    /** Component ID */
    id: string;
    /** Component name */
    name: string;
    /** Current state */
    state: S;
    /** Current props */
    props: P;
    /** Rendered HTML */
    html: string;
    /** Handle an event */
    handleEvent(event: LiveViewEvent): Promise<ViewPatch>;
    /** Update props */
    updateProps(props: P): Promise<ViewPatch>;
    /** Re-render */
    render(): string;
    /** Get diff from previous render */
    getDiff(): ViewPatch;
}
/**
 * Mount a LiveComponent instance
 */
export declare function mountLiveComponent<S extends LiveViewState, P>(definition: LiveComponentDefinition<S, P>, props: P, socket: LiveSocket, parentId: string): Promise<LiveComponentInstance<S, P>>;
/**
 * Render a LiveComponent within a LiveView template
 *
 * @example
 * ```typescript
 * render: (state) => `
 *   <div>
 *     ${liveComponent(Modal, { children: '<p>Content</p>' })}
 *   </div>
 * `,
 * ```
 */
export declare function liveComponent<P>(component: LiveComponentDefinition<any, P>, props: P, options?: {
    id?: string;
}): string;
/**
 * Render a named LiveComponent
 */
export declare function liveComponentByName(name: string, props: any, options?: {
    id?: string;
}): string;
export interface Slot {
    name: string;
    content: string;
    attributes?: Record<string, string>;
}
/**
 * Define a slot in a component
 */
export declare function slot(name?: string): string;
/**
 * Render slot content
 */
export declare function renderSlot(slots: Slot[], name?: string): string;
/**
 * Check if a slot has content
 */
export declare function hasSlot(slots: Slot[], name?: string): boolean;
/**
 * Preload data for multiple components at once
 * This is useful when rendering a list of the same component type
 */
export declare function preloadComponents<P>(component: LiveComponentDefinition<any, P>, propsList: P[]): Promise<P[]>;
/**
 * Create a simple stateless component (function component)
 * These are rendered purely from props without state or events.
 */
export declare function createFunctionComponent<P>(render: (props: P) => string): (props: P) => string;
/**
 * Helper to create async data-fetching components
 */
export declare function createAsyncComponent<P, D>(fetchData: (props: P) => Promise<D>, render: (data: D, props: P) => string, fallback?: (props: P) => string): LiveComponentDefinition<{
    data: D | null;
    loading: boolean;
    error: string | null;
}, P>;
//# sourceMappingURL=live-component.d.ts.map