/**
 * Partial Hydration Strategies
 *
 * This module provides various strategies for hydrating components:
 * - idle: Hydrate when the browser is idle
 * - visible: Hydrate when the component becomes visible
 * - interaction: Hydrate on first user interaction
 * - media: Hydrate based on media query
 * - never: Never hydrate (static only)
 *
 * @example
 * ```typescript
 * // Hydrate when visible
 * <Hydrate when="visible">
 *   <HeavyComponent />
 * </Hydrate>
 *
 * // Hydrate on click
 * <Hydrate when="interaction" event="click">
 *   <Modal />
 * </Hydrate>
 *
 * // Hydrate only on desktop
 * <Hydrate when="media" query="(min-width: 768px)">
 *   <DesktopNav />
 * </Hydrate>
 * ```
 */
/**
 * Hydration strategy types
 */
export type HydrationStrategy = 'idle' | 'visible' | 'interaction' | 'media' | 'never' | 'load' | 'custom';
/**
 * Common hydration options
 */
export interface HydrationOptions {
    /** The hydration strategy */
    when: HydrationStrategy;
    /** Priority for scheduling (higher = sooner) */
    priority?: number;
    /** Component ID for prefetching */
    componentId?: string;
    /** Whether to prefetch the component */
    prefetch?: boolean;
    /** Callback when hydration completes */
    onHydrate?: () => void;
    /** Callback on hydration error */
    onError?: (error: Error) => void;
}
/**
 * Visible strategy options
 */
export interface VisibleOptions extends HydrationOptions {
    when: 'visible';
    /** Root element for intersection observer */
    root?: Element | null;
    /** Root margin */
    rootMargin?: string;
    /** Visibility threshold (0-1) */
    threshold?: number | number[];
}
/**
 * Interaction strategy options
 */
export interface InteractionOptions extends HydrationOptions {
    when: 'interaction';
    /** Events that trigger hydration */
    events?: string[];
    /** Single event shorthand */
    event?: string;
    /** Only hydrate once per event type */
    once?: boolean;
}
/**
 * Media query strategy options
 */
export interface MediaOptions extends HydrationOptions {
    when: 'media';
    /** Media query string */
    query: string;
}
/**
 * Idle strategy options
 */
export interface IdleOptions extends HydrationOptions {
    when: 'idle';
    /** Timeout before forcing hydration */
    timeout?: number;
}
/**
 * Custom strategy options
 */
export interface CustomOptions extends HydrationOptions {
    when: 'custom';
    /** Custom hydration trigger */
    trigger: (element: Element, hydrate: () => Promise<void>) => void | (() => void);
}
/**
 * All hydration option types
 */
export type AnyHydrationOptions = VisibleOptions | InteractionOptions | MediaOptions | IdleOptions | CustomOptions | (HydrationOptions & {
    when: 'load' | 'never';
});
/**
 * Setup hydration for an element based on strategy.
 *
 * This function configures when and how an element should hydrate based on the
 * specified strategy. It returns a unique ID that can be used to control
 * hydration programmatically.
 *
 * @param element - The DOM element to set up hydration for
 * @param options - Hydration strategy and configuration
 * @returns A unique hydration ID for controlling this hydration
 *
 * @throws {Error} If element is invalid
 *
 * @example
 * ```typescript
 * const element = document.querySelector('[data-hydrate]');
 * const id = setupHydration(element, {
 *   when: 'visible',
 *   threshold: 0.5,
 *   onHydrate: () => console.log('Hydrated!'),
 *   onError: (err) => console.error('Hydration failed:', err)
 * });
 * ```
 */
export declare function setupHydration(element: Element, options: AnyHydrationOptions): string;
/**
 * Cancel pending hydration for an element
 */
export declare function cancelHydration(id: string): void;
/**
 * Force hydration for an element
 */
export declare function forceHydration(id: string): Promise<void>;
/**
 * Check if an element is hydrated
 */
export declare function isHydrated(id: string): boolean;
/**
 * Props for the Hydrate component
 */
export interface HydrateProps {
    /** Hydration strategy */
    when: HydrationStrategy;
    /** Children to hydrate */
    children: unknown;
    /** Visible strategy options */
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
    /** Interaction strategy options */
    events?: string[];
    event?: string;
    /** Media strategy options */
    query?: string;
    /** Idle strategy options */
    timeout?: number;
    /** Custom strategy */
    trigger?: (element: Element, hydrate: () => Promise<void>) => void | (() => void);
    /** Priority */
    priority?: number;
    /** Component ID for prefetching */
    componentId?: string;
    /** Whether to prefetch */
    prefetch?: boolean;
    /** Fallback while loading */
    fallback?: unknown;
    /** Callbacks */
    onHydrate?: () => void;
    onError?: (error: Error) => void;
}
/**
 * Create a Hydrate component wrapper
 *
 * This is used by the JSX transform to create hydration boundaries.
 */
export declare function createHydrateComponent(): {
    Hydrate: (props: HydrateProps) => unknown;
    useHydration: (options: AnyHydrationOptions) => {
        id: string;
        isHydrated: boolean;
        forceHydrate: () => Promise<void>;
        cancel: () => void;
    };
};
/**
 * Add to priority queue
 */
export declare function queueHydration(element: Element, options: AnyHydrationOptions & {
    priority?: number;
}): string;
/**
 * Automatically discover and set up hydration for marked elements
 */
export declare function discoverHydrationBoundaries(root?: Element): void;
/**
 * Initialize hydration on page load
 */
export declare function initHydration(): void;
/**
 * Get hydration statistics
 */
export declare function getHydrationStats(): {
    total: number;
    hydrated: number;
    pending: number;
    queued: number;
    byStrategy: Record<HydrationStrategy, number>;
};
/**
 * Clear all hydration state (for testing/HMR)
 */
export declare function clearHydrationState(): void;
/**
 * Wait for all hydration to complete
 */
export declare function waitForHydration(): Promise<void>;
declare const Hydrate: (props: HydrateProps) => unknown, useHydration: (options: AnyHydrationOptions) => {
    id: string;
    isHydrated: boolean;
    forceHydrate: () => Promise<void>;
    cancel: () => void;
};
export { Hydrate, useHydration };
//# sourceMappingURL=hydration.d.ts.map