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
// ============================================================================
// Feature Detection
// ============================================================================
/**
 * Check if the View Transitions API is supported.
 */
export function supportsViewTransitions() {
    return (typeof document !== 'undefined' &&
        'startViewTransition' in document);
}
/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion() {
    if (typeof window === 'undefined')
        return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
// ============================================================================
// Core Transition Function
// ============================================================================
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
export async function startViewTransition(updateCallback, options = {}) {
    const { respectReducedMotion = true, fallback = 'immediate', css, types, } = options;
    // Skip transition if reduced motion is preferred
    if (respectReducedMotion && prefersReducedMotion()) {
        await updateCallback();
        return {
            transitioned: false,
            finished: Promise.resolve(),
            updateCallbackDone: Promise.resolve(),
            ready: Promise.resolve(),
        };
    }
    // Check for API support
    if (!supportsViewTransitions()) {
        if (fallback === 'skip') {
            return {
                transitioned: false,
                finished: Promise.resolve(),
                updateCallbackDone: Promise.resolve(),
                ready: Promise.resolve(),
            };
        }
        await updateCallback();
        return {
            transitioned: false,
            finished: Promise.resolve(),
            updateCallbackDone: Promise.resolve(),
            ready: Promise.resolve(),
        };
    }
    // Inject custom CSS if provided
    let styleEl = null;
    if (css) {
        styleEl = document.createElement('style');
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    }
    // Start the transition
    const transition = document.startViewTransition(types ? { update: updateCallback, types } : updateCallback);
    // Cleanup custom CSS after transition
    if (styleEl) {
        transition.finished.finally(() => {
            styleEl?.remove();
        });
    }
    return {
        transitioned: true,
        transition,
        finished: transition.finished,
        updateCallbackDone: transition.updateCallbackDone,
        ready: transition.ready,
    };
}
// ============================================================================
// Preset Transitions
// ============================================================================
/**
 * Crossfade transition (fade out old, fade in new).
 */
export async function crossfade(updateCallback, duration = 300) {
    return startViewTransition(updateCallback, {
        css: `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation-duration: ${duration}ms;
        animation-timing-function: ease-in-out;
      }
      ::view-transition-old(root) {
        animation-name: fade-out;
      }
      ::view-transition-new(root) {
        animation-name: fade-in;
      }
      @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
    });
}
/**
 * Slide transition (slide in from direction).
 */
export async function slide(updateCallback, direction = 'left', duration = 300) {
    const transforms = {
        left: 'translateX(-100%)',
        right: 'translateX(100%)',
        up: 'translateY(-100%)',
        down: 'translateY(100%)',
    };
    const exitTransform = transforms[direction];
    const enterTransform = transforms[direction === 'left' ? 'right' :
        direction === 'right' ? 'left' :
            direction === 'up' ? 'down' : 'up'];
    return startViewTransition(updateCallback, {
        css: `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation-duration: ${duration}ms;
        animation-timing-function: ease-in-out;
      }
      ::view-transition-old(root) {
        animation-name: slide-out;
      }
      ::view-transition-new(root) {
        animation-name: slide-in;
      }
      @keyframes slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: ${exitTransform}; opacity: 0; }
      }
      @keyframes slide-in {
        from { transform: ${enterTransform}; opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `,
    });
}
/**
 * Scale transition (zoom in/out).
 */
export async function scale(updateCallback, type = 'in', duration = 300) {
    const fromScale = type === 'in' ? 0.8 : 1.2;
    return startViewTransition(updateCallback, {
        css: `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation-duration: ${duration}ms;
        animation-timing-function: ease-out;
      }
      ::view-transition-old(root) {
        animation-name: scale-out;
      }
      ::view-transition-new(root) {
        animation-name: scale-in;
      }
      @keyframes scale-out {
        from { transform: scale(1); opacity: 1; }
        to { transform: scale(${fromScale}); opacity: 0; }
      }
      @keyframes scale-in {
        from { transform: scale(${fromScale}); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `,
    });
}
/**
 * Morph transition for specific elements.
 * Assigns view-transition-name to elements for shared element transitions.
 */
export function morph(element, name) {
    const htmlElement = element;
    const previousName = htmlElement.style.viewTransitionName;
    htmlElement.style.viewTransitionName = name;
    return () => {
        htmlElement.style.viewTransitionName = previousName || '';
    };
}
// ============================================================================
// Declarative API
// ============================================================================
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
export function initDeclarativeTransitions() {
    if (typeof document === 'undefined')
        return;
    document.addEventListener('click', async (e) => {
        const trigger = e.target.closest('[data-transition]');
        if (!trigger)
            return;
        const type = trigger.getAttribute('data-transition');
        const targetSelector = trigger.getAttribute('data-transition-target');
        const href = trigger.getAttribute('href');
        if (!type)
            return;
        // Handle navigation
        if (href && !targetSelector) {
            e.preventDefault();
            await navigateWithTransition(href, type);
            return;
        }
        // Handle element update (custom logic needed)
        if (targetSelector) {
            // Emit event for custom handling
            trigger.dispatchEvent(new CustomEvent('transition', {
                bubbles: true,
                detail: { type, target: targetSelector },
            }));
        }
    });
}
/**
 * Navigate to a URL with a view transition.
 */
async function navigateWithTransition(url, type) {
    const transitionFn = {
        crossfade,
        'slide-left': (cb) => slide(cb, 'left'),
        'slide-right': (cb) => slide(cb, 'right'),
        'scale-in': (cb) => scale(cb, 'in'),
        'scale-out': (cb) => scale(cb, 'out'),
    }[type] || crossfade;
    await transitionFn(() => {
        window.location.href = url;
    });
}
//# sourceMappingURL=view-transitions.js.map