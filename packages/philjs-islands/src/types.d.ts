/**
 * Types for PhilJS Islands Architecture
 */
/** Hydration strategy determines when an island becomes interactive */
export type HydrationStrategy = 'idle' | 'visible' | 'media' | 'interaction' | 'load' | 'never';
/** What triggers hydration for interaction strategy */
export type HydrationTrigger = 'click' | 'hover' | 'focus' | 'pointerenter';
/** Island component interface - vanilla TypeScript class */
export interface IslandComponent {
    /** Called when island is mounted to DOM */
    mount(element: HTMLElement, props: Record<string, unknown>): void;
    /** Called when island is unmounted */
    unmount?(): void;
    /** Called when props update */
    update?(props: Record<string, unknown>): void;
}
/** Island component factory function */
export type IslandFactory = () => IslandComponent | Promise<IslandComponent>;
/** Configuration for defining an island */
export interface IslandConfig {
    /** Unique name for the island */
    name: string;
    /** Component factory or class */
    component: IslandFactory | (new () => IslandComponent);
    /** Hydration strategy */
    strategy?: HydrationStrategy;
    /** Triggers for interaction strategy */
    triggers?: HydrationTrigger[];
    /** Media query for media strategy */
    media?: string;
    /** Root margin for visible strategy (IntersectionObserver) */
    rootMargin?: string;
    /** Threshold for visible strategy */
    threshold?: number | number[];
    /** Timeout for idle strategy */
    timeout?: number;
}
/** Runtime island instance */
export interface IslandInstance {
    /** Island name */
    name: string;
    /** DOM element */
    element: HTMLElement;
    /** Current state */
    state: IslandState;
    /** Component instance */
    component?: IslandComponent;
    /** Current props */
    props: Record<string, unknown>;
    /** Hydrate this island */
    hydrate(): Promise<void>;
    /** Unmount this island */
    unmount(): void;
    /** Update props */
    update(props: Record<string, unknown>): void;
}
/** Island lifecycle state */
export type IslandState = 'pending' | 'loading' | 'hydrating' | 'active' | 'error' | 'unmounted';
/** Island lifecycle callbacks */
export interface IslandLifecycle {
    onBeforeHydrate?(island: IslandInstance): void | Promise<void>;
    onHydrated?(island: IslandInstance): void;
    onError?(island: IslandInstance, error: Error): void;
    onUnmount?(island: IslandInstance): void;
}
/** Configuration for island loader */
export interface LoaderConfig {
    /** Default hydration strategy */
    defaultStrategy?: HydrationStrategy;
    /** Global lifecycle callbacks */
    lifecycle?: IslandLifecycle;
    /** Enable debug logging */
    debug?: boolean;
}
/** Registry entry for an island definition */
export interface RegistryEntry {
    config: IslandConfig;
    instances: Set<IslandInstance>;
}
//# sourceMappingURL=types.d.ts.map