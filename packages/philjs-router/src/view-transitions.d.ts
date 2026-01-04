/**
 * View Transitions API Integration
 *
 * Provides smooth, built-in page transitions using the View Transitions API
 * with progressive enhancement fallback.
 *
 * Inspired by Astro's View Transitions implementation with additional features:
 * - React hooks for easy integration
 * - Lifecycle events for customization
 * - Direction-aware transitions (forward/backward)
 * - Persistent elements across navigations
 * - Fallback strategies for unsupported browsers
 */
export type TransitionConfig = {
    name?: string;
    duration?: number;
    easing?: string;
    skipTransition?: boolean;
};
export type TransitionType = "slide-left" | "slide-right" | "slide-up" | "slide-down" | "fade" | "scale" | "morph" | "initial" | "none" | "custom";
export type TransitionDirection = "forward" | "backward" | "same";
export type FallbackBehavior = "animate" | "swap" | "none";
export type ViewTransitionOptions = {
    type?: TransitionType;
    duration?: number;
    easing?: string;
    customCSS?: string;
    direction?: TransitionDirection;
};
/**
 * Configuration for the View Transitions system (Astro-inspired)
 */
export type ViewTransitionConfig = {
    /** Default animation type */
    defaultAnimation?: TransitionType;
    /** Duration in milliseconds */
    duration?: number;
    /** CSS easing function */
    easing?: string;
    /** Fallback behavior for unsupported browsers */
    fallback?: FallbackBehavior;
    /** Whether to respect prefers-reduced-motion */
    respectReducedMotion?: boolean;
    /** Custom CSS for transitions */
    customCSS?: string;
    /** Enable direction-aware transitions */
    directionAware?: boolean;
    /** History behavior: 'push', 'replace', or 'auto' */
    historyBehavior?: "push" | "replace" | "auto";
};
/**
 * Lifecycle event types (similar to Astro's)
 */
export type ViewTransitionEvent = "before-preparation" | "after-preparation" | "before-swap" | "after-swap" | "page-load" | "start" | "finished" | "error";
export type ViewTransitionEventDetail = {
    from: string;
    to: string;
    direction: TransitionDirection;
    transition: ViewTransition | null;
    newDocument?: Document;
};
export type ViewTransitionEventHandler = (detail: ViewTransitionEventDetail) => void | Promise<void>;
/**
 * State returned by useViewTransition hook
 */
export type ViewTransitionState = {
    isTransitioning: boolean;
    direction: TransitionDirection | null;
    from: string | null;
    to: string | null;
};
export declare function supportsViewTransitions(): boolean;
export declare class ViewTransitionManager {
    private styleElement;
    private currentTransition;
    private config;
    private eventHandlers;
    private transitionCallbacks;
    private persistedElements;
    private navigationHistory;
    private historyIndex;
    private transitionState;
    constructor(config?: ViewTransitionConfig);
    private injectStyles;
    private setupNavigationListeners;
    /**
     * Get current transition state
     */
    getState(): ViewTransitionState;
    /**
     * Get configuration
     */
    getConfig(): ViewTransitionConfig;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<ViewTransitionConfig>): void;
    /**
     * Detect navigation direction
     */
    private detectDirection;
    /**
     * Start a view transition with Astro-style lifecycle events
     */
    transition(updateCallback: () => void | Promise<void>, options?: ViewTransitionOptions): Promise<void>;
    /**
     * Handle fallback for browsers without View Transitions API
     */
    private handleFallback;
    /**
     * Navigate with transition
     */
    navigate(url: string, options?: ViewTransitionOptions): Promise<void>;
    /**
     * Subscribe to lifecycle events (Astro-style)
     */
    addEventListener(event: ViewTransitionEvent, handler: ViewTransitionEventHandler): () => void;
    /**
     * Remove event listener
     */
    removeEventListener(event: ViewTransitionEvent, handler: ViewTransitionEventHandler): void;
    /**
     * Emit lifecycle event
     */
    private emitEvent;
    /**
     * Mark element for persistence across navigations (Astro's transition:persist)
     */
    persist(element: HTMLElement, name: string): () => void;
    /**
     * Preserve persisted elements before DOM swap
     */
    private preservePersistedElements;
    /**
     * Restore persisted elements after DOM swap
     */
    private restorePersistedElements;
    /**
     * Add transition name to element for scoped transitions (Astro's transition:name)
     */
    setTransitionName(element: HTMLElement, name: string): () => void;
    /**
     * Set animation type for element (Astro's transition:animate)
     */
    setTransitionAnimation(element: HTMLElement, animation: TransitionType | {
        old: Keyframe[];
        new: Keyframe[];
    }, options?: {
        duration?: number;
        easing?: string;
    }): () => void;
    /**
     * Subscribe to transition events (legacy API)
     */
    on(event: "start" | "finished" | "error", callback: (transition: ViewTransition | null) => void): void;
    /**
     * Unsubscribe from transition events
     */
    off(event: "start" | "finished" | "error", callback: (transition: ViewTransition | null) => void): void;
    private emit;
    /**
     * Skip current transition
     */
    skipTransition(): void;
    /**
     * Check if currently transitioning
     */
    isTransitioning(): boolean;
    /**
     * Get current transition
     */
    getCurrentTransition(): ViewTransition | null;
    /**
     * Cleanup
     */
    destroy(): void;
}
/**
 * Initialize the view transitions system with optional configuration
 */
export declare function initViewTransitions(config?: ViewTransitionConfig): ViewTransitionManager;
/**
 * Get the global view transition manager instance
 */
export declare function getViewTransitionManager(): ViewTransitionManager | null;
/**
 * Reset the global view transition manager (useful for testing)
 */
export declare function resetViewTransitions(): void;
export declare function navigateWithTransition(url: string, options?: ViewTransitionOptions): Promise<void>;
export type SharedElementOptions = {
    name: string;
    duration?: number;
    easing?: string;
};
/**
 * Mark element for shared element transition
 */
export declare function markSharedElement(element: HTMLElement, options: SharedElementOptions): () => void;
export declare function transitionLink(element: HTMLAnchorElement, options?: ViewTransitionOptions): () => void;
export declare function animateFallback(element: HTMLElement, type: TransitionType, options?: {
    duration?: number;
    easing?: string;
}): Promise<void>;
/**
 * A wrapper around document.startViewTransition with fallback support.
 * Similar to Astro's navigate() function.
 */
export declare function startViewTransition(callback: () => void | Promise<void>, options?: ViewTransitionOptions): Promise<ViewTransition | null>;
/**
 * Hook to access and trigger view transitions.
 * Returns state and control functions for view transitions.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isTransitioning, navigate, startTransition } = useViewTransition();
 *
 *   return (
 *     <button
 *       onClick={() => navigate('/about', { type: 'slide-left' })}
 *       disabled={isTransitioning}
 *     >
 *       Go to About
 *     </button>
 *   );
 * }
 * ```
 */
export declare function useViewTransition(): {
    isTransitioning: boolean;
    direction: TransitionDirection | null;
    from: string | null;
    to: string | null;
    navigate: (url: string, options?: ViewTransitionOptions) => Promise<void>;
    startTransition: (callback: () => void | Promise<void>, options?: ViewTransitionOptions) => Promise<void>;
    skipTransition: () => void;
};
/**
 * Hook to subscribe to view transition lifecycle events.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useViewTransitionEvent('before-swap', (detail) => {
 *     console.log('Navigating from', detail.from, 'to', detail.to);
 *   });
 *
 *   return <div>My Component</div>;
 * }
 * ```
 */
export declare function useViewTransitionEvent(event: ViewTransitionEvent, handler: ViewTransitionEventHandler): void;
/**
 * Hook to persist an element across view transitions.
 * Returns a ref callback to attach to the element.
 *
 * @example
 * ```tsx
 * function Header() {
 *   const persistRef = useTransitionPersist('header');
 *
 *   return <header ref={persistRef}>My Header</header>;
 * }
 * ```
 */
export declare function useTransitionPersist(name: string): (element: HTMLElement | null) => void;
/**
 * Hook to set a transition name on an element.
 * Returns a ref callback to attach to the element.
 *
 * @example
 * ```tsx
 * function ProductCard({ id }) {
 *   const transitionRef = useTransitionName(`product-${id}`);
 *
 *   return <div ref={transitionRef}>Product {id}</div>;
 * }
 * ```
 */
export declare function useTransitionName(name: string): (element: HTMLElement | null) => void;
export type ViewTransitionLinkProps = {
    href: string;
    children?: any;
    className?: string;
    style?: Record<string, string | number>;
    transition?: TransitionType;
    duration?: number;
    easing?: string;
    replace?: boolean;
    prefetch?: boolean | "hover" | "viewport";
    /** Force full page reload instead of client-side navigation */
    reload?: boolean;
    onClick?: (e: MouseEvent) => void;
    [key: string]: any;
};
/**
 * A link component that automatically uses view transitions for navigation.
 * Inspired by Astro's `<a>` behavior with View Transitions.
 *
 * @example
 * ```tsx
 * <ViewTransitionLink href="/about" transition="slide-left">
 *   About Us
 * </ViewTransitionLink>
 *
 * <ViewTransitionLink
 *   href="/products/123"
 *   transition="fade"
 *   duration={200}
 * >
 *   View Product
 * </ViewTransitionLink>
 * ```
 */
export declare function ViewTransitionLink(props: ViewTransitionLinkProps): HTMLAnchorElement;
/**
 * React-compatible ViewTransitionLink component props
 * Use this with React's createElement or JSX
 */
export declare function createViewTransitionLink(props: ViewTransitionLinkProps): {
    element: "a";
    props: Record<string, any>;
    onClick: (e: MouseEvent) => Promise<void>;
};
/**
 * Check if reduced motion is preferred
 */
export declare function prefersReducedMotion(): boolean;
/**
 * Get the current navigation direction
 */
export declare function getNavigationDirection(): TransitionDirection;
/**
 * Programmatically trigger navigation with a view transition
 */
export declare function navigate(url: string, options?: ViewTransitionOptions & {
    replace?: boolean;
}): Promise<void>;
//# sourceMappingURL=view-transitions.d.ts.map