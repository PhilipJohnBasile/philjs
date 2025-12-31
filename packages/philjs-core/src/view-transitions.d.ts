/**
 * View Transitions API Support for PhilJS
 *
 * The View Transitions API enables smooth animated transitions when
 * updating DOM content. This module provides utilities for working
 * with view transitions in a declarative, framework-agnostic way.
 *
 * @see https://developer.chrome.com/docs/web-platform/view-transitions/
 *
 * @example
 * ```ts
 * import { startViewTransition, crossfade } from '@philjs/core/view-transitions';
 *
 * // Simple transition
 * await startViewTransition(() => {
 *   document.querySelector('.content').innerHTML = newContent;
 * });
 *
 * // With custom transition
 * await crossfade(() => updatePage());
 * ```
 */
export interface ViewTransitionOptions {
    /**
     * Skip transition if user prefers reduced motion.
     * @default true
     */
    respectReducedMotion?: boolean;
    /**
     * Fallback behavior when View Transitions API is not supported.
     * @default 'immediate'
     */
    fallback?: 'immediate' | 'skip';
    /**
     * Custom CSS for the transition.
     */
    css?: string;
    /**
     * Types for the transition (multi-transition support).
     */
    types?: string[];
}
export interface ViewTransitionResult {
    /**
     * Whether a transition was performed.
     */
    transitioned: boolean;
    /**
     * The ViewTransition object (if available).
     */
    transition?: ViewTransition;
    /**
     * Promise that resolves when transition is complete.
     */
    finished: Promise<void>;
    /**
     * Promise that resolves when the DOM update is complete.
     */
    updateCallbackDone: Promise<void>;
    /**
     * Promise that resolves when transition is ready to animate.
     */
    ready: Promise<void>;
}
/**
 * Check if the View Transitions API is supported.
 */
export declare function supportsViewTransitions(): boolean;
/**
 * Check if user prefers reduced motion.
 */
export declare function prefersReducedMotion(): boolean;
/**
 * Start a view transition with DOM updates.
 *
 * @example
 * ```ts
 * await startViewTransition(() => {
 *   // Update the DOM
 *   contentEl.innerHTML = newContent;
 * });
 * ```
 */
export declare function startViewTransition(updateCallback: () => void | Promise<void>, options?: ViewTransitionOptions): Promise<ViewTransitionResult>;
/**
 * Crossfade transition (fade out old, fade in new).
 */
export declare function crossfade(updateCallback: () => void | Promise<void>, duration?: number): Promise<ViewTransitionResult>;
/**
 * Slide transition (slide in from direction).
 */
export declare function slide(updateCallback: () => void | Promise<void>, direction?: 'left' | 'right' | 'up' | 'down', duration?: number): Promise<ViewTransitionResult>;
/**
 * Scale transition (zoom in/out).
 */
export declare function scale(updateCallback: () => void | Promise<void>, type?: 'in' | 'out', duration?: number): Promise<ViewTransitionResult>;
/**
 * Morph transition for specific elements.
 * Assigns view-transition-name to elements for shared element transitions.
 */
export declare function morph(element: Element, name: string): () => void;
/**
 * Attribute-based view transition trigger.
 * Add to elements that should trigger transitions on click.
 *
 * @example
 * ```html
 * <button data-transition="crossfade" data-transition-target="#content">
 *   Switch Content
 * </button>
 * ```
 */
export declare function initDeclarativeTransitions(): void;
interface ViewTransition {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
    skipTransition(): void;
}
export {};
//# sourceMappingURL=view-transitions.d.ts.map