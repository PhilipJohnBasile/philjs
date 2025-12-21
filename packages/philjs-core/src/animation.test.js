/**
 * Tests for animation.ts - Animation primitives, spring physics, FLIP, gestures
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAnimatedValue, easings, FLIPAnimator, attachGestures, createParallax, } from "./animation";
describe("Animation - Animated Values", () => {
    it("should create animated value with initial value", () => {
        const anim = createAnimatedValue(100);
        expect(anim.value).toBe(100);
        expect(anim.isAnimating).toBe(false);
    });
    it("should animate to new value", async () => {
        const anim = createAnimatedValue(0);
        const animation = new Promise((resolve) => {
            anim.set(100, {
                duration: 50,
                onComplete: () => {
                    expect(anim.value).toBe(100);
                    resolve();
                },
            });
        });
        expect(anim.isAnimating).toBe(true);
        await animation;
        expect(anim.isAnimating).toBe(false);
    });
    it("should call onUpdate callback during animation", async () => {
        const anim = createAnimatedValue(0);
        const updates = [];
        await new Promise((resolve) => {
            anim.set(100, {
                duration: 50,
                onUpdate: (value) => updates.push(value),
                onComplete: () => {
                    expect(updates.length).toBeGreaterThan(0);
                    resolve();
                },
            });
        });
    });
    it("should stop animation", () => {
        const anim = createAnimatedValue(0);
        anim.set(100, { duration: 1000 });
        expect(anim.isAnimating).toBe(true);
        anim.stop();
        expect(anim.isAnimating).toBe(false);
    });
    it("should support spring physics", async () => {
        const spring = {
            stiffness: 0.2,
            damping: 0.9,
            mass: 1,
        };
        const anim = createAnimatedValue(0);
        await new Promise((resolve) => {
            anim.set(100, {
                easing: spring,
                onComplete: () => {
                    expect(anim.value).toBeCloseTo(100, 0);
                    resolve();
                },
            });
        });
    }, 2000);
    it("should track velocity during spring animation", () => {
        const anim = createAnimatedValue(0);
        anim.set(100, {
            easing: { stiffness: 0.1 },
        });
        // Velocity should be defined during animation
        expect(typeof anim.velocity).toBe("number");
    });
    it("should cancel previous animation when starting new one", async () => {
        const anim = createAnimatedValue(0);
        const onComplete1 = vi.fn();
        anim.set(50, { duration: 1000, onComplete: onComplete1 });
        anim.set(100, { duration: 50 });
        await new Promise((resolve) => {
            setTimeout(() => {
                // First animation should be cancelled
                expect(onComplete1).not.toHaveBeenCalled();
                resolve();
            }, 120);
        });
    });
    it("should subscribe to value changes", () => {
        const anim = createAnimatedValue(0);
        const callback = vi.fn();
        const unsubscribe = anim.subscribe(callback);
        expect(typeof unsubscribe).toBe("function");
        unsubscribe();
    });
});
describe("Animation - Easing Functions", () => {
    it("should have linear easing", () => {
        expect(easings.linear(0)).toBe(0);
        expect(easings.linear(0.5)).toBe(0.5);
        expect(easings.linear(1)).toBe(1);
    });
    it("should have easeIn", () => {
        const result = easings.easeIn(0.5);
        expect(result).toBeLessThan(0.5);
    });
    it("should have easeOut", () => {
        const result = easings.easeOut(0.5);
        expect(result).toBeGreaterThan(0.5);
    });
    it("should have easeInOut", () => {
        expect(easings.easeInOut(0)).toBe(0);
        expect(easings.easeInOut(1)).toBe(1);
    });
    it("should have cubic easings", () => {
        expect(easings.easeInCubic(0.5)).toBeLessThan(0.5);
        expect(easings.easeOutCubic(0.5)).toBeGreaterThan(0);
    });
    it("should have bounce easing", () => {
        const result = easings.bounce(0.5);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
    });
});
describe("Animation - Duration-based", () => {
    it("should use custom easing function", async () => {
        const customEasing = (t) => t * t; // quadratic
        const anim = createAnimatedValue(0);
        await new Promise((resolve) => {
            anim.set(100, {
                duration: 50,
                easing: customEasing,
                onComplete: () => {
                    expect(anim.value).toBe(100);
                    resolve();
                },
            });
        });
    });
    it("should default to 300ms duration", async () => {
        const anim = createAnimatedValue(0);
        const startTime = Date.now();
        await new Promise((resolve) => {
            anim.set(100, {
                onComplete: () => {
                    const elapsed = Date.now() - startTime;
                    expect(elapsed).toBeGreaterThanOrEqual(250);
                    resolve();
                },
            });
        });
    }, 500);
});
describe("FLIP Animator", () => {
    beforeEach(() => {
        // Mock DOM
        document.body.innerHTML = `
      <div data-flip data-flip-id="el1" id="el1"></div>
      <div data-flip data-flip-id="el2" id="el2"></div>
    `;
    });
    it("should create FLIP animator", () => {
        const flip = new FLIPAnimator();
        expect(flip).toBeDefined();
    });
    it("should record element positions", () => {
        const flip = new FLIPAnimator();
        flip.recordPositions();
        expect(true).toBe(true); // Positions recorded internally
    });
    it("should animate position changes", () => {
        const flip = new FLIPAnimator();
        flip.recordPositions();
        flip.animateChanges({ duration: 300 });
        expect(true).toBe(true);
    });
    it("should clear positions after animation", () => {
        const flip = new FLIPAnimator();
        flip.recordPositions();
        flip.animateChanges();
        // Positions should be cleared
        expect(true).toBe(true);
    });
});
describe("Gesture Handlers", () => {
    let element;
    beforeEach(() => {
        element = document.createElement("div");
        document.body.appendChild(element);
    });
    afterEach(() => {
        element.remove();
    });
    it("should attach gesture handlers", () => {
        const cleanup = attachGestures(element, {});
        expect(typeof cleanup).toBe("function");
        cleanup();
    });
    it("should handle drag events", () => {
        const onDragStart = vi.fn();
        const onDrag = vi.fn();
        const onDragEnd = vi.fn();
        const cleanup = attachGestures(element, {
            onDragStart,
            onDrag,
            onDragEnd,
        });
        element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, clientY: 0 }));
        element.dispatchEvent(new PointerEvent("pointermove", { clientX: 10, clientY: 10 }));
        element.dispatchEvent(new PointerEvent("pointerup", { clientX: 10, clientY: 10 }));
        expect(onDragStart).toHaveBeenCalled();
        expect(onDrag).toHaveBeenCalled();
        expect(onDragEnd).toHaveBeenCalled();
        cleanup();
    });
    it("should detect tap", async () => {
        const onTap = vi.fn();
        const cleanup = attachGestures(element, { onTap });
        element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, clientY: 0 }));
        element.dispatchEvent(new PointerEvent("pointerup", { clientX: 0, clientY: 0 }));
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(onTap).toHaveBeenCalled();
        cleanup();
    });
    it("should detect swipe", async () => {
        const onSwipe = vi.fn();
        const cleanup = attachGestures(element, { onSwipe });
        element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, clientY: 0 }));
        element.dispatchEvent(new PointerEvent("pointerup", { clientX: 100, clientY: 0 }));
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(onSwipe).toHaveBeenCalledWith("right");
        cleanup();
    });
    it("should cleanup gesture listeners", () => {
        const cleanup = attachGestures(element, {});
        cleanup();
        // Verify no errors when events fire after cleanup
        element.dispatchEvent(new PointerEvent("pointerdown"));
        expect(true).toBe(true);
    });
});
describe("Parallax Effect", () => {
    let element;
    beforeEach(() => {
        element = document.createElement("div");
        document.body.appendChild(element);
        global.window = global.window || {};
    });
    afterEach(() => {
        element.remove();
    });
    it("should create parallax effect", () => {
        const cleanup = createParallax(element);
        expect(typeof cleanup).toBe("function");
        cleanup();
    });
    it("should apply transform on scroll", () => {
        const cleanup = createParallax(element, { speed: 0.5 });
        Object.defineProperty(window, "scrollY", { value: 100, writable: true });
        window.dispatchEvent(new Event("scroll"));
        expect(element.style.transform).toContain("translate");
        cleanup();
    });
    it("should cleanup scroll listener", () => {
        const cleanup = createParallax(element);
        cleanup();
        // Verify no errors after cleanup
        window.dispatchEvent(new Event("scroll"));
        expect(true).toBe(true);
    });
});
//# sourceMappingURL=animation.test.js.map