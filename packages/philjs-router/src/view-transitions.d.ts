/**
 * View Transitions API Integration
 *
 * Provides smooth, built-in page transitions using the View Transitions API
 * with progressive enhancement fallback
 */
export type TransitionConfig = {
    name?: string;
    duration?: number;
    easing?: string;
    skipTransition?: boolean;
};
export type TransitionType = "slide-left" | "slide-right" | "slide-up" | "slide-down" | "fade" | "scale" | "custom";
export type ViewTransitionOptions = {
    type?: TransitionType;
    duration?: number;
    easing?: string;
    customCSS?: string;
};
export declare function supportsViewTransitions(): boolean;
export declare class ViewTransitionManager {
    private styleElement;
    private currentTransition;
    private transitionCallbacks;
    constructor();
    private injectStyles;
    /**
     * Start a view transition
     */
    transition(updateCallback: () => void | Promise<void>, options?: ViewTransitionOptions): Promise<void>;
    /**
     * Navigate with transition
     */
    navigate(url: string, options?: ViewTransitionOptions): Promise<void>;
    /**
     * Add transition name to element for scoped transitions
     */
    setTransitionName(element: HTMLElement, name: string): void;
    /**
     * Subscribe to transition events
     */
    on(event: "start" | "finished" | "error", callback: (transition: ViewTransition | null) => void): void;
    private emit;
    /**
     * Skip current transition
     */
    skipTransition(): void;
    /**
     * Cleanup
     */
    destroy(): void;
}
export declare function initViewTransitions(): ViewTransitionManager;
export declare function getViewTransitionManager(): ViewTransitionManager | null;
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
export declare function animateFallback(element: HTMLElement, type: TransitionType): Promise<void>;
//# sourceMappingURL=view-transitions.d.ts.map