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
// ============================================================================
// View Transitions Support Detection
// ============================================================================
export function supportsViewTransitions() {
    if (typeof document === "undefined")
        return false;
    return "startViewTransition" in document;
}
// ============================================================================
// Transition Styles
// ============================================================================
const TRANSITION_STYLES = {
    "slide-left": `
    @keyframes slide-from-right {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes slide-to-left {
      from { transform: translateX(0); }
      to { transform: translateX(-100%); }
    }
    ::view-transition-old(root) {
      animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
    }
    ::view-transition-new(root) {
      animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
    }
  `,
    "slide-right": `
    @keyframes slide-from-left {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    @keyframes slide-to-right {
      from { transform: translateX(0); }
      to { transform: translateX(100%); }
    }
    ::view-transition-old(root) {
      animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-right;
    }
    ::view-transition-new(root) {
      animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-left;
    }
  `,
    "slide-up": `
    @keyframes slide-from-bottom {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes slide-to-top {
      from { transform: translateY(0); }
      to { transform: translateY(-100%); }
    }
    ::view-transition-old(root) {
      animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-top;
    }
    ::view-transition-new(root) {
      animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-bottom;
    }
  `,
    "slide-down": `
    @keyframes slide-from-top {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
    @keyframes slide-to-bottom {
      from { transform: translateY(0); }
      to { transform: translateY(100%); }
    }
    ::view-transition-old(root) {
      animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-bottom;
    }
    ::view-transition-new(root) {
      animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-top;
    }
  `,
    fade: `
    ::view-transition-old(root) {
      animation: 200ms ease-out both fade-out;
    }
    ::view-transition-new(root) {
      animation: 200ms ease-in both fade-in;
    }
    @keyframes fade-out {
      to { opacity: 0; }
    }
    @keyframes fade-in {
      from { opacity: 0; }
    }
  `,
    scale: `
    @keyframes scale-down {
      to { transform: scale(0.9); opacity: 0; }
    }
    @keyframes scale-up {
      from { transform: scale(1.1); opacity: 0; }
    }
    ::view-transition-old(root) {
      animation: 250ms cubic-bezier(0.4, 0, 1, 1) both scale-down;
    }
    ::view-transition-new(root) {
      animation: 250ms cubic-bezier(0, 0, 0.2, 1) both scale-up;
    }
  `,
    morph: `
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation-duration: 300ms;
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    ::view-transition-old(root) {
      animation-name: fade-out;
    }
    ::view-transition-new(root) {
      animation-name: fade-in;
    }
  `,
    initial: `
    /* Use browser default view transition animation */
  `,
    none: `
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
    }
  `,
};
// Direction-aware transition styles
const DIRECTION_STYLES = {
    forward: {
        slide: `
      ::view-transition-old(root) {
        animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
      }
      ::view-transition-new(root) {
        animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
      }
    `,
    },
    backward: {
        slide: `
      ::view-transition-old(root) {
        animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-right;
      }
      ::view-transition-new(root) {
        animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-left;
      }
    `,
    },
};
// Reduced motion styles
const REDUCED_MOTION_STYLES = `
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation-duration: 0.01ms !important;
    }
  }
`;
// ============================================================================
// Transition Manager (Enhanced with Astro-inspired features)
// ============================================================================
export class ViewTransitionManager {
    styleElement = null;
    currentTransition = null;
    config;
    eventHandlers = new Map();
    transitionCallbacks = new Map();
    persistedElements = new Map();
    navigationHistory = [];
    historyIndex = 0;
    transitionState = {
        isTransitioning: false,
        direction: null,
        from: null,
        to: null,
    };
    constructor(config = {}) {
        const cfg = {
            defaultAnimation: config.defaultAnimation ?? "fade",
            duration: config.duration ?? 300,
            easing: config.easing ?? "cubic-bezier(0.4, 0, 0.2, 1)",
            fallback: config.fallback ?? "animate",
            respectReducedMotion: config.respectReducedMotion ?? true,
            directionAware: config.directionAware ?? true,
            historyBehavior: config.historyBehavior ?? "push",
        };
        if (config.customCSS !== undefined) {
            cfg.customCSS = config.customCSS;
        }
        this.config = cfg;
        this.injectStyles();
        this.setupNavigationListeners();
    }
    injectStyles() {
        if (typeof document === "undefined")
            return;
        this.styleElement = document.createElement("style");
        this.styleElement.id = "philjs-view-transitions";
        // Inject all default transition styles
        const allStyles = Object.values(TRANSITION_STYLES).join("\n\n");
        let styles = allStyles;
        // Add reduced motion styles if configured
        if (this.config.respectReducedMotion) {
            styles += "\n\n" + REDUCED_MOTION_STYLES;
        }
        // Add custom CSS if configured
        if (this.config.customCSS) {
            styles += "\n\n" + this.config.customCSS;
        }
        this.styleElement.textContent = styles;
        document.head.appendChild(this.styleElement);
    }
    setupNavigationListeners() {
        if (typeof window === "undefined")
            return;
        // Track navigation history for direction detection
        this.navigationHistory.push(window.location.pathname);
        window.addEventListener("popstate", () => {
            const currentPath = window.location.pathname;
            const previousIndex = this.navigationHistory.indexOf(currentPath);
            if (previousIndex !== -1 && previousIndex < this.historyIndex) {
                this.transitionState.direction = "backward";
            }
            else {
                this.transitionState.direction = "forward";
            }
            this.historyIndex = Math.max(0, previousIndex);
        });
    }
    /**
     * Get current transition state
     */
    getState() {
        return { ...this.transitionState };
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Detect navigation direction
     */
    detectDirection(targetUrl) {
        const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
        const targetPath = new URL(targetUrl, window.location.origin).pathname;
        if (targetPath === currentPath)
            return "same";
        const currentIndex = this.navigationHistory.indexOf(currentPath);
        const targetIndex = this.navigationHistory.indexOf(targetPath);
        if (targetIndex !== -1 && targetIndex < currentIndex) {
            return "backward";
        }
        return "forward";
    }
    /**
     * Start a view transition with Astro-style lifecycle events
     */
    async transition(updateCallback, options = {}) {
        const { type = this.config.defaultAnimation, customCSS, direction } = options;
        const from = typeof window !== "undefined" ? window.location.href : "";
        const to = from; // Will be updated in navigate()
        // Update state
        this.transitionState = {
            isTransitioning: true,
            direction: direction ?? "forward",
            from,
            to,
        };
        const eventDetail = {
            from,
            to,
            direction: this.transitionState.direction,
            transition: null,
        };
        // Emit before-preparation event
        await this.emitEvent("before-preparation", eventDetail);
        // Check for reduced motion preference
        if (this.config.respectReducedMotion &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            await updateCallback();
            this.transitionState.isTransitioning = false;
            await this.emitEvent("page-load", eventDetail);
            return;
        }
        // Handle browsers without View Transitions API
        if (!supportsViewTransitions()) {
            await this.handleFallback(updateCallback, type, eventDetail);
            return;
        }
        // Emit after-preparation event
        await this.emitEvent("after-preparation", eventDetail);
        // Add custom CSS if provided
        let customStyleEl = null;
        if (customCSS) {
            customStyleEl = document.createElement("style");
            customStyleEl.textContent = customCSS;
            customStyleEl.className = "philjs-custom-transition";
            document.head.appendChild(customStyleEl);
        }
        // Add direction-aware styles if enabled
        let directionStyleEl = null;
        if (this.config.directionAware && type === "slide-left" || type === "slide-right") {
            const dir = direction ?? this.transitionState.direction ?? "forward";
            const dirStyles = DIRECTION_STYLES[dir];
            if (dirStyles?.slide) {
                directionStyleEl = document.createElement("style");
                directionStyleEl.textContent = dirStyles.slide;
                directionStyleEl.className = "philjs-direction-transition";
                document.head.appendChild(directionStyleEl);
            }
        }
        // Emit before-swap event
        await this.emitEvent("before-swap", eventDetail);
        // Start the transition
        const transition = document.startViewTransition(async () => {
            await updateCallback();
        });
        this.currentTransition = transition;
        eventDetail.transition = transition;
        // Emit legacy start event for backward compatibility
        this.emit("start", transition);
        try {
            await transition.updateCallbackDone;
            // Emit after-swap event
            await this.emitEvent("after-swap", eventDetail);
            await transition.finished;
            // Emit finished and page-load events
            this.emit("finished", transition);
            await this.emitEvent("page-load", eventDetail);
        }
        catch (error) {
            this.emit("error", null);
            await this.emitEvent("error", eventDetail);
            console.error("View transition failed:", error);
        }
        finally {
            this.currentTransition = null;
            this.transitionState.isTransitioning = false;
            // Clean up custom styles
            customStyleEl?.remove();
            directionStyleEl?.remove();
        }
    }
    /**
     * Handle fallback for browsers without View Transitions API
     */
    async handleFallback(updateCallback, type, eventDetail) {
        switch (this.config.fallback) {
            case "animate":
                // Use Web Animations API fallback
                const container = document.querySelector("main") || document.body;
                const oldContent = container.cloneNode(true);
                await updateCallback();
                // Animate the transition
                await animateFallback(container, type);
                break;
            case "swap":
                // Immediate swap without animation
                await updateCallback();
                break;
            case "none":
                // Full page navigation - do nothing, let browser handle it
                break;
            default:
                await updateCallback();
        }
        this.transitionState.isTransitioning = false;
        await this.emitEvent("page-load", eventDetail);
    }
    /**
     * Navigate with transition
     */
    async navigate(url, options = {}) {
        const from = typeof window !== "undefined" ? window.location.href : "";
        const direction = options.direction ?? this.detectDirection(url);
        // Update navigation history
        if (this.config.historyBehavior !== "replace") {
            this.navigationHistory.push(new URL(url, window.location.origin).pathname);
            this.historyIndex = this.navigationHistory.length - 1;
        }
        await this.transition(async () => {
            // Preserve persisted elements before navigation
            this.preservePersistedElements();
            // Use History API to navigate
            if (this.config.historyBehavior === "replace") {
                window.history.replaceState({}, "", url);
            }
            else {
                window.history.pushState({}, "", url);
            }
            // Trigger route update (framework-specific)
            window.dispatchEvent(new PopStateEvent("popstate"));
            // Restore persisted elements after navigation
            await this.restorePersistedElements();
        }, { ...options, direction });
    }
    /**
     * Subscribe to lifecycle events (Astro-style)
     */
    addEventListener(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
        // Return cleanup function
        return () => {
            const handlers = this.eventHandlers.get(event);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    }
    /**
     * Remove event listener
     */
    removeEventListener(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }
    /**
     * Emit lifecycle event
     */
    async emitEvent(event, detail) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            for (const handler of handlers) {
                await handler(detail);
            }
        }
        // Also dispatch DOM event for global listeners
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(`philjs:${event}`, { detail }));
        }
    }
    /**
     * Mark element for persistence across navigations (Astro's transition:persist)
     */
    persist(element, name) {
        element.setAttribute("data-philjs-transition-persist", name);
        element.style.viewTransitionName = name;
        this.persistedElements.set(name, element);
        return () => {
            element.removeAttribute("data-philjs-transition-persist");
            element.style.viewTransitionName = "";
            this.persistedElements.delete(name);
        };
    }
    /**
     * Preserve persisted elements before DOM swap
     */
    preservePersistedElements() {
        const persistedEls = document.querySelectorAll("[data-philjs-transition-persist]");
        persistedEls.forEach((el) => {
            const name = el.getAttribute("data-philjs-transition-persist");
            if (name) {
                this.persistedElements.set(name, el.cloneNode(true));
            }
        });
    }
    /**
     * Restore persisted elements after DOM swap
     */
    async restorePersistedElements() {
        await new Promise(resolve => requestAnimationFrame(resolve));
        this.persistedElements.forEach((oldEl, name) => {
            const newPlaceholder = document.querySelector(`[data-philjs-transition-persist="${name}"]`);
            if (newPlaceholder && oldEl) {
                // Copy over relevant state from old element
                const oldData = oldEl.getAttribute("data-philjs-persist-state");
                if (oldData) {
                    newPlaceholder.setAttribute("data-philjs-persist-state", oldData);
                }
            }
        });
    }
    /**
     * Add transition name to element for scoped transitions (Astro's transition:name)
     */
    setTransitionName(element, name) {
        element.style.viewTransitionName = name;
        return () => {
            element.style.viewTransitionName = "";
        };
    }
    /**
     * Set animation type for element (Astro's transition:animate)
     */
    setTransitionAnimation(element, animation, options) {
        const name = `transition-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        element.style.viewTransitionName = name;
        const styleEl = document.createElement("style");
        styleEl.className = "philjs-element-transition";
        if (typeof animation === "string") {
            // Use built-in animation
            const duration = options?.duration ?? this.config.duration;
            const easing = options?.easing ?? this.config.easing;
            styleEl.textContent = `
        ::view-transition-old(${name}),
        ::view-transition-new(${name}) {
          animation-duration: ${duration}ms;
          animation-timing-function: ${easing};
        }
      `;
        }
        else {
            // Custom keyframe animation
            const oldKeyframes = animation.old
                .map((kf, i) => `${(i / (animation.old.length - 1)) * 100}% { ${Object.entries(kf).map(([k, v]) => `${k}: ${v}`).join("; ")} }`)
                .join("\n");
            const newKeyframes = animation.new
                .map((kf, i) => `${(i / (animation.new.length - 1)) * 100}% { ${Object.entries(kf).map(([k, v]) => `${k}: ${v}`).join("; ")} }`)
                .join("\n");
            styleEl.textContent = `
        @keyframes ${name}-old { ${oldKeyframes} }
        @keyframes ${name}-new { ${newKeyframes} }
        ::view-transition-old(${name}) {
          animation: ${options?.duration ?? this.config.duration}ms ${options?.easing ?? this.config.easing} ${name}-old;
        }
        ::view-transition-new(${name}) {
          animation: ${options?.duration ?? this.config.duration}ms ${options?.easing ?? this.config.easing} ${name}-new;
        }
      `;
        }
        document.head.appendChild(styleEl);
        return () => {
            element.style.viewTransitionName = "";
            styleEl.remove();
        };
    }
    /**
     * Subscribe to transition events (legacy API)
     */
    on(event, callback) {
        if (!this.transitionCallbacks.has(event)) {
            this.transitionCallbacks.set(event, []);
        }
        this.transitionCallbacks.get(event).push(callback);
    }
    /**
     * Unsubscribe from transition events
     */
    off(event, callback) {
        const callbacks = this.transitionCallbacks.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    emit(event, transition) {
        const callbacks = this.transitionCallbacks.get(event);
        if (callbacks) {
            callbacks.forEach((cb) => cb(transition));
        }
    }
    /**
     * Skip current transition
     */
    skipTransition() {
        if (this.currentTransition) {
            this.currentTransition.skipTransition?.();
        }
    }
    /**
     * Check if currently transitioning
     */
    isTransitioning() {
        return this.transitionState.isTransitioning;
    }
    /**
     * Get current transition
     */
    getCurrentTransition() {
        return this.currentTransition;
    }
    /**
     * Cleanup
     */
    destroy() {
        this.styleElement?.remove();
        this.transitionCallbacks.clear();
        this.eventHandlers.clear();
        this.persistedElements.clear();
        this.currentTransition = null;
        this.transitionState = {
            isTransitioning: false,
            direction: null,
            from: null,
            to: null,
        };
    }
}
// ============================================================================
// Global Instance
// ============================================================================
let globalTransitionManager = null;
/**
 * Initialize the view transitions system with optional configuration
 */
export function initViewTransitions(config) {
    if (!globalTransitionManager) {
        globalTransitionManager = new ViewTransitionManager(config);
    }
    else if (config) {
        globalTransitionManager.updateConfig(config);
    }
    return globalTransitionManager;
}
/**
 * Get the global view transition manager instance
 */
export function getViewTransitionManager() {
    return globalTransitionManager;
}
/**
 * Reset the global view transition manager (useful for testing)
 */
export function resetViewTransitions() {
    if (globalTransitionManager) {
        globalTransitionManager.destroy();
        globalTransitionManager = null;
    }
}
// ============================================================================
// Navigation with Transitions
// ============================================================================
export async function navigateWithTransition(url, options = {}) {
    const manager = getViewTransitionManager() || initViewTransitions();
    await manager.navigate(url, options);
}
/**
 * Mark element for shared element transition
 */
export function markSharedElement(element, options) {
    element.style.viewTransitionName = options.name;
    if (options.duration || options.easing) {
        const style = document.createElement("style");
        style.textContent = `
      ::view-transition-old(${options.name}),
      ::view-transition-new(${options.name}) {
        ${options.duration ? `animation-duration: ${options.duration}ms;` : ""}
        ${options.easing ? `animation-timing-function: ${options.easing};` : ""}
      }
    `;
        document.head.appendChild(style);
        return () => {
            style.remove();
            element.style.viewTransitionName = "";
        };
    }
    return () => {
        element.style.viewTransitionName = "";
    };
}
// ============================================================================
// Link Directive for Automatic Transitions
// ============================================================================
export function transitionLink(element, options = {}) {
    const handleClick = async (e) => {
        // Only handle same-origin links
        if (element.origin !== window.location.origin ||
            element.target === "_blank" ||
            e.metaKey ||
            e.ctrlKey) {
            return;
        }
        e.preventDefault();
        const manager = getViewTransitionManager() || initViewTransitions();
        await manager.navigate(element.href, options);
    };
    element.addEventListener("click", handleClick);
    return () => {
        element.removeEventListener("click", handleClick);
    };
}
// ============================================================================
// Fallback Animation for Non-Supporting Browsers
// ============================================================================
export function animateFallback(element, type, options) {
    return new Promise((resolve) => {
        const animations = {
            "slide-left": [
                { transform: "translateX(100%)" },
                { transform: "translateX(0)" },
            ],
            "slide-right": [
                { transform: "translateX(-100%)" },
                { transform: "translateX(0)" },
            ],
            "slide-up": [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }],
            "slide-down": [
                { transform: "translateY(-100%)" },
                { transform: "translateY(0)" },
            ],
            fade: [{ opacity: 0 }, { opacity: 1 }],
            scale: [
                { transform: "scale(0.9)", opacity: 0 },
                { transform: "scale(1)", opacity: 1 },
            ],
            morph: [{ opacity: 0 }, { opacity: 1 }],
            initial: [], // No animation
            none: [], // No animation
            custom: [],
        };
        const keyframes = animations[type] || animations.fade;
        if (keyframes.length === 0) {
            resolve();
            return;
        }
        const animation = element.animate(keyframes, {
            duration: options?.duration ?? 300,
            easing: options?.easing ?? "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "both",
        });
        animation.onfinish = () => resolve();
    });
}
// ============================================================================
// startViewTransition Wrapper
// ============================================================================
/**
 * A wrapper around document.startViewTransition with fallback support.
 * Similar to Astro's navigate() function.
 */
export async function startViewTransition(callback, options = {}) {
    // Check reduced motion preference
    if (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await callback();
        return null;
    }
    // Use View Transitions API if supported
    if (supportsViewTransitions()) {
        const transition = document.startViewTransition(callback);
        return transition;
    }
    // Fallback: just execute callback
    await callback();
    return null;
}
class SimpleState {
    state;
    subscribers = new Set();
    constructor(initial) {
        this.state = initial;
    }
    get() {
        return this.state;
    }
    set(newState) {
        this.state = newState;
        this.subscribers.forEach((sub) => sub(newState));
    }
    subscribe(subscriber) {
        this.subscribers.add(subscriber);
        return () => this.subscribers.delete(subscriber);
    }
}
const transitionStateStore = new SimpleState({
    isTransitioning: false,
    direction: null,
    from: null,
    to: null,
});
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
export function useViewTransition() {
    const manager = getViewTransitionManager() || initViewTransitions();
    const state = manager.getState();
    return {
        isTransitioning: state.isTransitioning,
        direction: state.direction,
        from: state.from,
        to: state.to,
        navigate: (url, options) => manager.navigate(url, options),
        startTransition: (callback, options) => manager.transition(callback, options),
        skipTransition: () => manager.skipTransition(),
    };
}
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
export function useViewTransitionEvent(event, handler) {
    const manager = getViewTransitionManager();
    if (manager) {
        // Note: In a real React app, this would use useEffect for cleanup
        manager.addEventListener(event, handler);
    }
}
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
export function useTransitionPersist(name) {
    let cleanup = null;
    return (element) => {
        // Clean up previous
        if (cleanup) {
            cleanup();
            cleanup = null;
        }
        if (element) {
            const manager = getViewTransitionManager() || initViewTransitions();
            cleanup = manager.persist(element, name);
        }
    };
}
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
export function useTransitionName(name) {
    let cleanup = null;
    return (element) => {
        if (cleanup) {
            cleanup();
            cleanup = null;
        }
        if (element) {
            const manager = getViewTransitionManager() || initViewTransitions();
            cleanup = manager.setTransitionName(element, name);
        }
    };
}
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
export function ViewTransitionLink(props) {
    const { href, children, className, style, transition = "fade", duration, easing, replace = false, prefetch = false, reload = false, onClick, ...rest } = props;
    // Create anchor element (for framework-agnostic usage)
    const element = document.createElement("a");
    element.href = href;
    if (className)
        element.className = className;
    if (style) {
        Object.entries(style).forEach(([key, value]) => {
            element.style[key] = value;
        });
    }
    // Apply additional attributes
    Object.entries(rest).forEach(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
            element.setAttribute(key, String(value));
        }
    });
    // Handle click with view transition
    const handleClick = async (e) => {
        // Call custom onClick if provided
        if (onClick) {
            onClick(e);
            if (e.defaultPrevented)
                return;
        }
        // Skip if should reload or modifier keys
        if (reload || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return;
        }
        // Skip if different origin or target blank
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin || element.target === "_blank") {
            return;
        }
        e.preventDefault();
        const manager = getViewTransitionManager() || initViewTransitions();
        // Update config for this navigation if replace is set
        if (replace) {
            manager.updateConfig({ historyBehavior: "replace" });
        }
        const navOptions = {
            type: transition,
        };
        if (duration !== undefined) {
            navOptions.duration = duration;
        }
        if (easing !== undefined) {
            navOptions.easing = easing;
        }
        await manager.navigate(href, navOptions);
        // Reset config
        if (replace) {
            manager.updateConfig({ historyBehavior: "push" });
        }
    };
    element.addEventListener("click", handleClick);
    // Handle prefetch
    if (prefetch) {
        if (prefetch === "hover") {
            element.addEventListener("mouseenter", () => {
                // Trigger prefetch (would integrate with prefetch system)
                const link = document.createElement("link");
                link.rel = "prefetch";
                link.href = href;
                document.head.appendChild(link);
            }, { once: true });
        }
        else if (prefetch === "viewport") {
            // Use intersection observer for viewport prefetch
            if (typeof IntersectionObserver !== "undefined") {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const link = document.createElement("link");
                            link.rel = "prefetch";
                            link.href = href;
                            document.head.appendChild(link);
                            observer.disconnect();
                        }
                    });
                }, { rootMargin: "100px" });
                observer.observe(element);
            }
        }
        else {
            // Immediate prefetch
            const link = document.createElement("link");
            link.rel = "prefetch";
            link.href = href;
            document.head.appendChild(link);
        }
    }
    return element;
}
/**
 * React-compatible ViewTransitionLink component props
 * Use this with React's createElement or JSX
 */
export function createViewTransitionLink(props) {
    const { href, transition = "fade", duration, easing, replace = false, reload = false, onClick: customOnClick, ...rest } = props;
    const onClick = async (e) => {
        if (customOnClick) {
            customOnClick(e);
            if (e.defaultPrevented)
                return;
        }
        if (reload || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return;
        }
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) {
            return;
        }
        e.preventDefault();
        const manager = getViewTransitionManager() || initViewTransitions();
        if (replace) {
            manager.updateConfig({ historyBehavior: "replace" });
        }
        const navOptions = {
            type: transition,
        };
        if (duration !== undefined) {
            navOptions.duration = duration;
        }
        if (easing !== undefined) {
            navOptions.easing = easing;
        }
        await manager.navigate(href, navOptions);
        if (replace) {
            manager.updateConfig({ historyBehavior: "push" });
        }
    };
    return {
        element: "a",
        props: { href, ...rest },
        onClick,
    };
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion() {
    if (typeof window === "undefined")
        return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/**
 * Get the current navigation direction
 */
export function getNavigationDirection() {
    const manager = getViewTransitionManager();
    if (manager) {
        return manager.getState().direction ?? "forward";
    }
    return "forward";
}
/**
 * Programmatically trigger navigation with a view transition
 */
export async function navigate(url, options = {}) {
    const manager = getViewTransitionManager() || initViewTransitions();
    if (options.replace) {
        manager.updateConfig({ historyBehavior: "replace" });
    }
    await manager.navigate(url, options);
    if (options.replace) {
        manager.updateConfig({ historyBehavior: "push" });
    }
}
//# sourceMappingURL=view-transitions.js.map