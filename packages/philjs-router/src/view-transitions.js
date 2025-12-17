/**
 * View Transitions API Integration
 *
 * Provides smooth, built-in page transitions using the View Transitions API
 * with progressive enhancement fallback
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
};
// ============================================================================
// Transition Manager
// ============================================================================
export class ViewTransitionManager {
    styleElement = null;
    currentTransition = null;
    transitionCallbacks = new Map();
    constructor() {
        this.injectStyles();
    }
    injectStyles() {
        if (typeof document === "undefined" || !supportsViewTransitions())
            return;
        this.styleElement = document.createElement("style");
        this.styleElement.id = "philjs-view-transitions";
        // Inject all default transition styles
        const allStyles = Object.values(TRANSITION_STYLES).join("\n\n");
        this.styleElement.textContent = allStyles;
        document.head.appendChild(this.styleElement);
    }
    /**
     * Start a view transition
     */
    async transition(updateCallback, options = {}) {
        const { type = "fade", customCSS } = options;
        // Progressive enhancement: fallback for browsers without View Transitions API
        if (!supportsViewTransitions()) {
            await updateCallback();
            return;
        }
        // Add custom CSS if provided
        if (customCSS && this.styleElement) {
            const customStyle = document.createElement("style");
            customStyle.textContent = customCSS;
            customStyle.className = "philjs-custom-transition";
            document.head.appendChild(customStyle);
        }
        // Start the transition
        const transition = document.startViewTransition(async () => {
            await updateCallback();
        });
        this.currentTransition = transition;
        // Emit event for subscribers
        this.emit("start", transition);
        try {
            await transition.finished;
            this.emit("finished", transition);
        }
        catch (error) {
            this.emit("error", null);
            console.error("View transition failed:", error);
        }
        finally {
            this.currentTransition = null;
            // Clean up custom styles
            if (customCSS) {
                document
                    .querySelectorAll("style.philjs-custom-transition")
                    .forEach((el) => el.remove());
            }
        }
    }
    /**
     * Navigate with transition
     */
    async navigate(url, options = {}) {
        await this.transition(async () => {
            // Use History API to navigate
            window.history.pushState({}, "", url);
            // Trigger route update (framework-specific)
            window.dispatchEvent(new PopStateEvent("popstate"));
        }, options);
    }
    /**
     * Add transition name to element for scoped transitions
     */
    setTransitionName(element, name) {
        element.style.viewTransitionName = name;
    }
    /**
     * Subscribe to transition events
     */
    on(event, callback) {
        if (!this.transitionCallbacks.has(event)) {
            this.transitionCallbacks.set(event, []);
        }
        this.transitionCallbacks.get(event).push(callback);
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
     * Cleanup
     */
    destroy() {
        this.styleElement?.remove();
        this.transitionCallbacks.clear();
        this.currentTransition = null;
    }
}
// ============================================================================
// Global Instance
// ============================================================================
let globalTransitionManager = null;
export function initViewTransitions() {
    if (!globalTransitionManager) {
        globalTransitionManager = new ViewTransitionManager();
    }
    return globalTransitionManager;
}
export function getViewTransitionManager() {
    return globalTransitionManager;
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
export function animateFallback(element, type) {
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
            custom: [],
        };
        const keyframes = animations[type] || animations.fade;
        const animation = element.animate(keyframes, {
            duration: 300,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "both",
        });
        animation.onfinish = () => resolve();
    });
}
//# sourceMappingURL=view-transitions.js.map