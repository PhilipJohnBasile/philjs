/**
 * Built-in animation primitives with spring physics and FLIP.
 * Declarative animations without external libraries.
 */
import { signal, memo } from "./signals.js";
/**
 * Easing functions library.
 */
export const easings = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => 1 + --t * t * t,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 + --t * 4 * t * t,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - --t * t * t * t,
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
    bounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        }
        else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        }
        else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        }
        else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
};
/**
 * Create an animated value with spring physics.
 */
export function createAnimatedValue(initialValue, defaultOptions = {}) {
    const value = signal(initialValue);
    const velocity = signal(0);
    const isAnimating = signal(false);
    let animationFrame = null;
    const animate = (from, to, options = defaultOptions) => {
        // Cancel existing animation
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        isAnimating.set(true);
        const startTime = performance.now();
        // Spring animation
        if (options.easing && typeof options.easing === "object") {
            const spring = options.easing;
            const stiffness = spring.stiffness ?? 0.15;
            const damping = spring.damping ?? 0.8;
            const mass = spring.mass ?? 1;
            const restVelocity = spring.restVelocity ?? 0.001;
            const restDistance = spring.restDistance ?? 0.001;
            let currentValue = from;
            let currentVelocity = velocity();
            const tick = () => {
                const distance = to - currentValue;
                const springForce = distance * stiffness;
                const dampingForce = -currentVelocity * damping;
                const acceleration = (springForce + dampingForce) / mass;
                currentVelocity += acceleration;
                currentValue += currentVelocity;
                value.set(currentValue);
                velocity.set(currentVelocity);
                options.onUpdate?.(currentValue);
                // Check if animation is complete
                if (Math.abs(currentVelocity) < restVelocity &&
                    Math.abs(distance) < restDistance) {
                    value.set(to);
                    velocity.set(0);
                    isAnimating.set(false);
                    options.onComplete?.();
                    return;
                }
                animationFrame = requestAnimationFrame(tick);
            };
            animationFrame = requestAnimationFrame(tick);
        }
        else {
            // Duration-based animation
            const duration = options.duration ?? 300;
            const easing = typeof options.easing === "function"
                ? options.easing
                : easings.easeInOut;
            const tick = () => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easing(progress);
                const currentValue = from + (to - from) * easedProgress;
                value.set(currentValue);
                options.onUpdate?.(currentValue);
                if (progress >= 1) {
                    isAnimating.set(false);
                    options.onComplete?.();
                    return;
                }
                animationFrame = requestAnimationFrame(tick);
            };
            animationFrame = requestAnimationFrame(tick);
        }
    };
    return {
        get value() {
            return value();
        },
        get target() {
            return value();
        },
        get velocity() {
            return velocity();
        },
        get isAnimating() {
            return isAnimating();
        },
        set: (newValue, options) => {
            animate(value(), newValue, options || defaultOptions);
        },
        stop: () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
            isAnimating.set(false);
        },
        subscribe: value.subscribe,
    };
}
/**
 * FLIP (First, Last, Invert, Play) animation helper.
 */
export class FLIPAnimator {
    positions = new Map();
    /**
     * Record positions of elements before a layout change.
     */
    recordPositions(selector = "[data-flip]") {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
            const id = el.dataset['flipId'] || el.id;
            if (id) {
                this.positions.set(id, el.getBoundingClientRect());
            }
        });
    }
    /**
     * Animate elements from recorded positions to new positions.
     */
    animateChanges(options = {}) {
        const elements = document.querySelectorAll("[data-flip]");
        elements.forEach((el) => {
            const element = el;
            const id = element.dataset['flipId'] || element.id;
            if (!id)
                return;
            const firstPos = this.positions.get(id);
            if (!firstPos)
                return;
            const lastPos = element.getBoundingClientRect();
            // Calculate the delta
            const deltaX = firstPos.left - lastPos.left;
            const deltaY = firstPos.top - lastPos.top;
            const deltaW = firstPos.width / lastPos.width;
            const deltaH = firstPos.height / lastPos.height;
            // Invert (apply the delta)
            element.style.transformOrigin = "top left";
            element.style.transform = `
        translate(${deltaX}px, ${deltaY}px)
        scale(${deltaW}, ${deltaH})
      `;
            // Force reflow
            element.getBoundingClientRect();
            // Play (animate to identity)
            element.style.transition = `transform ${options.duration || 300}ms ${options.easing || "ease-in-out"}`;
            element.style.transform = "";
            // Clean up after animation
            element.addEventListener("transitionend", () => {
                element.style.transition = "";
                element.style.transformOrigin = "";
            }, { once: true });
        });
        // Clear positions after animation
        this.positions.clear();
    }
}
/**
 * Attach gesture handlers to an element.
 */
export function attachGestures(element, handlers) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let lastTapTime = 0;
    let longPressTimeout = null;
    const handlePointerDown = (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        handlers.onDragStart?.(e);
        // Long press detection
        longPressTimeout = setTimeout(() => {
            handlers.onLongPress?.();
            longPressTimeout = null;
        }, 500);
    };
    const handlePointerMove = (e) => {
        if (!isDragging)
            return;
        // Cancel long press if moving
        if (longPressTimeout) {
            clearTimeout(longPressTimeout);
            longPressTimeout = null;
        }
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        handlers.onDrag?.(e, { x: deltaX, y: deltaY });
    };
    const handlePointerUp = (e) => {
        if (!isDragging)
            return;
        // Cancel long press
        if (longPressTimeout) {
            clearTimeout(longPressTimeout);
            longPressTimeout = null;
        }
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        // Detect swipe
        const threshold = 50;
        if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                handlers.onSwipe?.(deltaX > 0 ? "right" : "left");
            }
            else {
                handlers.onSwipe?.(deltaY > 0 ? "down" : "up");
            }
        }
        else {
            // Detect tap/double tap
            const now = Date.now();
            if (now - lastTapTime < 300) {
                handlers.onDoubleTap?.();
            }
            else {
                handlers.onTap?.();
            }
            lastTapTime = now;
        }
        isDragging = false;
        handlers.onDragEnd?.(e);
    };
    // Attach listeners
    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerup", handlePointerUp);
    element.addEventListener("pointercancel", handlePointerUp);
    // Cleanup function
    return () => {
        element.removeEventListener("pointerdown", handlePointerDown);
        element.removeEventListener("pointermove", handlePointerMove);
        element.removeEventListener("pointerup", handlePointerUp);
        element.removeEventListener("pointercancel", handlePointerUp);
        if (longPressTimeout) {
            clearTimeout(longPressTimeout);
        }
    };
}
/**
 * Create a parallax effect based on scroll position.
 */
export function createParallax(element, options = {}) {
    const { speed = 0.5, offset = 0, axis = "y" } = options;
    const handleScroll = () => {
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        const translateY = axis !== "x" ? (scrollY - offset) * speed : 0;
        const translateX = axis !== "y" ? (scrollX - offset) * speed : 0;
        element.style.transform = `translate(${translateX}px, ${translateY}px)`;
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial position
    return () => window.removeEventListener("scroll", handleScroll);
}
//# sourceMappingURL=animation.js.map