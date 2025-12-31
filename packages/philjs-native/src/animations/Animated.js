/**
 * Animated API
 *
 * Animation primitives for native mobile animations.
 */
import { signal } from 'philjs-core';
// ============================================================================
// Easing Functions
// ============================================================================
/**
 * Easing functions
 */
export const Easing = {
    linear: (t) => t,
    quad: (t) => t * t,
    cubic: (t) => t * t * t,
    poly: (n) => (t) => Math.pow(t, n),
    sin: (t) => 1 - Math.cos((t * Math.PI) / 2),
    circle: (t) => 1 - Math.sqrt(1 - t * t),
    exp: (t) => Math.pow(2, 10 * (t - 1)),
    elastic: (bounciness = 1) => (t) => {
        const p = bounciness * Math.PI;
        return 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p);
    },
    back: (s = 1.70158) => (t) => {
        return t * t * ((s + 1) * t - s);
    },
    bounce: (t) => {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        }
        if (t < 2 / 2.75) {
            const t2 = t - 1.5 / 2.75;
            return 7.5625 * t2 * t2 + 0.75;
        }
        if (t < 2.5 / 2.75) {
            const t2 = t - 2.25 / 2.75;
            return 7.5625 * t2 * t2 + 0.9375;
        }
        const t2 = t - 2.625 / 2.75;
        return 7.5625 * t2 * t2 + 0.984375;
    },
    bezier: (x1, y1, x2, y2) => (t) => {
        // Simplified cubic bezier implementation
        const cx = 3 * x1;
        const bx = 3 * (x2 - x1) - cx;
        const ax = 1 - cx - bx;
        const cy = 3 * y1;
        const by = 3 * (y2 - y1) - cy;
        const ay = 1 - cy - by;
        function sampleCurveX(t) {
            return ((ax * t + bx) * t + cx) * t;
        }
        function sampleCurveY(t) {
            return ((ay * t + by) * t + cy) * t;
        }
        function solveCurveX(x) {
            let t = x;
            for (let i = 0; i < 8; i++) {
                const diff = sampleCurveX(t) - x;
                if (Math.abs(diff) < 1e-6)
                    return t;
                const d = (3 * ax * t + 2 * bx) * t + cx;
                if (Math.abs(d) < 1e-6)
                    break;
                t -= diff / d;
            }
            return t;
        }
        return sampleCurveY(solveCurveX(t));
    },
    in: (easing) => easing,
    out: (easing) => (t) => {
        return 1 - easing(1 - t);
    },
    inOut: (easing) => (t) => {
        if (t < 0.5) {
            return easing(t * 2) / 2;
        }
        return 1 - easing((1 - t) * 2) / 2;
    },
};
// ============================================================================
// AnimatedValue
// ============================================================================
/**
 * Animated value class
 */
export class AnimatedValue {
    value;
    offset = 0;
    listeners = new Set();
    animationId = null;
    constructor(initialValue = 0) {
        this.value = signal(initialValue);
    }
    getValue() {
        return this.value() + this.offset;
    }
    setValue(value) {
        this.stopAnimation();
        this.value.set(value - this.offset);
        this.notifyListeners();
    }
    setOffset(offset) {
        this.offset = offset;
    }
    flattenOffset() {
        this.value.set(this.value() + this.offset);
        this.offset = 0;
    }
    extractOffset() {
        this.offset += this.value();
        this.value.set(0);
    }
    addListener(callback) {
        const wrappedCallback = (v) => callback({ value: v });
        this.listeners.add(wrappedCallback);
        return String(this.listeners.size);
    }
    removeListener(id) {
        // Simplified - in real impl would track by ID
    }
    removeAllListeners() {
        this.listeners.clear();
    }
    stopAnimation(callback) {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        callback?.(this.getValue());
    }
    resetAnimation(callback) {
        this.stopAnimation(callback);
        this.value.set(0);
        this.offset = 0;
    }
    interpolate(config) {
        return new AnimatedInterpolation(this, config);
    }
    notifyListeners() {
        const value = this.getValue();
        this.listeners.forEach((listener) => listener(value));
    }
    // Internal method for animations
    _animate(toValue, duration, easing, callback) {
        const startValue = this.value();
        const startTime = performance.now();
        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            this.value.set(startValue + (toValue - startValue) * easedProgress);
            this.notifyListeners();
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            }
            else {
                this.animationId = null;
                callback?.({ finished: true });
            }
        };
        this.animationId = requestAnimationFrame(animate);
    }
    // Internal getters
    _getValue() {
        return this.value();
    }
    _getSignal() {
        return this.value;
    }
}
// ============================================================================
// AnimatedValueXY
// ============================================================================
/**
 * Animated 2D value class
 */
export class AnimatedValueXY {
    x;
    y;
    constructor(value) {
        this.x = new AnimatedValue(value?.x ?? 0);
        this.y = new AnimatedValue(value?.y ?? 0);
    }
    setValue(value) {
        this.x.setValue(value.x);
        this.y.setValue(value.y);
    }
    setOffset(offset) {
        this.x.setOffset(offset.x);
        this.y.setOffset(offset.y);
    }
    flattenOffset() {
        this.x.flattenOffset();
        this.y.flattenOffset();
    }
    extractOffset() {
        this.x.extractOffset();
        this.y.extractOffset();
    }
    addListener(callback) {
        const xListener = this.x.addListener(() => {
            callback({ x: this.x.getValue(), y: this.y.getValue() });
        });
        const yListener = this.y.addListener(() => {
            callback({ x: this.x.getValue(), y: this.y.getValue() });
        });
        return `${xListener}-${yListener}`;
    }
    removeListener(id) {
        const [xId, yId] = id.split('-');
        this.x.removeListener(xId);
        this.y.removeListener(yId);
    }
    removeAllListeners() {
        this.x.removeAllListeners();
        this.y.removeAllListeners();
    }
    stopAnimation(callback) {
        this.x.stopAnimation();
        this.y.stopAnimation();
        callback?.({ x: this.x.getValue(), y: this.y.getValue() });
    }
    resetAnimation(callback) {
        this.x.resetAnimation();
        this.y.resetAnimation();
        callback?.({ x: this.x.getValue(), y: this.y.getValue() });
    }
    getLayout() {
        return { left: this.x, top: this.y };
    }
    getTranslateTransform() {
        return [{ translateX: this.x }, { translateY: this.y }];
    }
}
// ============================================================================
// AnimatedInterpolation
// ============================================================================
/**
 * Animated interpolation class
 */
export class AnimatedInterpolation {
    parent;
    config;
    constructor(parent, config) {
        this.parent = parent;
        this.config = config;
    }
    getValue() {
        const input = this.parent.getValue();
        return this._interpolateValue(input);
    }
    _interpolateValue(input) {
        const { inputRange, outputRange, extrapolate = 'extend' } = this.config;
        // Find the segment
        let i = 0;
        for (; i < inputRange.length - 1; i++) {
            if (input < inputRange[i + 1])
                break;
        }
        const inputMin = inputRange[i];
        const inputMax = inputRange[i + 1] ?? inputMin;
        const outputMin = outputRange[i];
        const outputMax = outputRange[i + 1] ?? outputMin;
        // Calculate progress
        let progress = inputMax !== inputMin ? (input - inputMin) / (inputMax - inputMin) : 0;
        // Apply extrapolation
        if (progress < 0) {
            if (extrapolate === 'clamp')
                progress = 0;
            else if (extrapolate === 'identity')
                return input;
        }
        else if (progress > 1) {
            if (extrapolate === 'clamp')
                progress = 1;
            else if (extrapolate === 'identity')
                return input;
        }
        // Interpolate
        if (typeof outputMin === 'string' || typeof outputMax === 'string') {
            // Color or string interpolation (simplified)
            return progress < 0.5 ? outputMin : outputMax;
        }
        return outputMin + (outputMax - outputMin) * progress;
    }
    interpolate(config) {
        // Chain interpolations
        return new AnimatedInterpolation(this.parent, {
            ...this.config,
            ...config,
        });
    }
}
// ============================================================================
// Animation Functions
// ============================================================================
/**
 * Timing animation
 */
export function timing(value, config) {
    const { toValue, duration = 300, easing = Easing.inOut(Easing.quad), delay = 0 } = config;
    return {
        start(callback) {
            if (delay > 0) {
                setTimeout(() => {
                    value._animate(toValue, duration, easing, callback);
                }, delay);
            }
            else {
                value._animate(toValue, duration, easing, callback);
            }
        },
        stop() {
            value.stopAnimation();
        },
        reset() {
            value.resetAnimation();
        },
    };
}
/**
 * Spring animation
 */
export function spring(value, config) {
    const { toValue, stiffness = 100, damping = 10, mass = 1, velocity: initialVelocity = 0, } = config;
    let animationId = null;
    let position = value._getValue();
    let velocity = initialVelocity;
    let lastTime = null;
    const precision = 0.01;
    function isAtRest() {
        return Math.abs(velocity) < precision && Math.abs(position - toValue) < precision;
    }
    return {
        start(callback) {
            position = value._getValue();
            function animate(time) {
                if (lastTime === null) {
                    lastTime = time;
                    animationId = requestAnimationFrame(animate);
                    return;
                }
                const deltaTime = Math.min((time - lastTime) / 1000, 0.064);
                lastTime = time;
                const displacement = position - toValue;
                const springForce = -stiffness * displacement;
                const dampingForce = -damping * velocity;
                const force = springForce + dampingForce;
                const acceleration = force / mass;
                velocity += acceleration * deltaTime;
                position += velocity * deltaTime;
                value.setValue(position);
                if (!isAtRest()) {
                    animationId = requestAnimationFrame(animate);
                }
                else {
                    value.setValue(toValue);
                    animationId = null;
                    callback?.({ finished: true });
                }
            }
            animationId = requestAnimationFrame(animate);
        },
        stop() {
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        },
        reset() {
            this.stop();
            position = value._getValue();
            velocity = 0;
        },
    };
}
/**
 * Decay animation
 */
export function decay(value, config) {
    const { velocity: initialVelocity, deceleration = 0.998 } = config;
    let animationId = null;
    let velocity = initialVelocity;
    let lastTime = null;
    return {
        start(callback) {
            velocity = initialVelocity;
            function animate(time) {
                if (lastTime === null) {
                    lastTime = time;
                    animationId = requestAnimationFrame(animate);
                    return;
                }
                const deltaTime = (time - lastTime) / 1000;
                lastTime = time;
                const position = value._getValue() + velocity * deltaTime;
                velocity *= Math.pow(deceleration, deltaTime * 1000);
                value.setValue(position);
                if (Math.abs(velocity) > 0.1) {
                    animationId = requestAnimationFrame(animate);
                }
                else {
                    animationId = null;
                    callback?.({ finished: true });
                }
            }
            animationId = requestAnimationFrame(animate);
        },
        stop() {
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        },
        reset() {
            this.stop();
            velocity = 0;
        },
    };
}
// ============================================================================
// Composite Animations
// ============================================================================
/**
 * Run animations in sequence
 */
export function sequence(animations) {
    let current = 0;
    return {
        start(callback) {
            const runNext = () => {
                if (current >= animations.length) {
                    callback?.({ finished: true });
                    return;
                }
                animations[current].start((result) => {
                    if (result.finished) {
                        current++;
                        runNext();
                    }
                    else {
                        callback?.({ finished: false });
                    }
                });
            };
            runNext();
        },
        stop() {
            if (current < animations.length) {
                animations[current].stop();
            }
        },
        reset() {
            current = 0;
            animations.forEach((anim) => anim.reset());
        },
    };
}
/**
 * Run animations in parallel
 */
export function parallel(animations, config) {
    const { stopTogether = true } = config || {};
    return {
        start(callback) {
            let completed = 0;
            let stopped = false;
            animations.forEach((anim) => {
                anim.start((result) => {
                    completed++;
                    if (!result.finished && stopTogether && !stopped) {
                        stopped = true;
                        animations.forEach((a) => a.stop());
                        callback?.({ finished: false });
                    }
                    else if (completed === animations.length && !stopped) {
                        callback?.({ finished: true });
                    }
                });
            });
        },
        stop() {
            animations.forEach((anim) => anim.stop());
        },
        reset() {
            animations.forEach((anim) => anim.reset());
        },
    };
}
/**
 * Run animations with staggered start times
 */
export function stagger(delay, animations) {
    return parallel(animations.map((anim, i) => ({
        start(callback) {
            setTimeout(() => anim.start(callback), delay * i);
        },
        stop: anim.stop.bind(anim),
        reset: anim.reset.bind(anim),
    })));
}
/**
 * Loop an animation
 */
export function loop(animation, config) {
    const { iterations = -1, resetBeforeIteration = true } = config || {};
    let current = 0;
    let stopped = false;
    return {
        start(callback) {
            stopped = false;
            const runIteration = () => {
                if (stopped) {
                    callback?.({ finished: false });
                    return;
                }
                if (iterations !== -1 && current >= iterations) {
                    callback?.({ finished: true });
                    return;
                }
                if (resetBeforeIteration && current > 0) {
                    animation.reset();
                }
                current++;
                animation.start((result) => {
                    if (result.finished) {
                        runIteration();
                    }
                    else {
                        callback?.({ finished: false });
                    }
                });
            };
            runIteration();
        },
        stop() {
            stopped = true;
            animation.stop();
        },
        reset() {
            current = 0;
            animation.reset();
        },
    };
}
// ============================================================================
// Math Operations
// ============================================================================
/**
 * Add animated values
 */
export function add(a, b) {
    const result = new AnimatedValue(0);
    const bValue = typeof b === 'number' ? b : b._getValue();
    result.setValue(a._getValue() + bValue);
    return result;
}
/**
 * Subtract animated values
 */
export function subtract(a, b) {
    const result = new AnimatedValue(0);
    const bValue = typeof b === 'number' ? b : b._getValue();
    result.setValue(a._getValue() - bValue);
    return result;
}
/**
 * Multiply animated values
 */
export function multiply(a, b) {
    const result = new AnimatedValue(0);
    const bValue = typeof b === 'number' ? b : b._getValue();
    result.setValue(a._getValue() * bValue);
    return result;
}
/**
 * Divide animated values
 */
export function divide(a, b) {
    const result = new AnimatedValue(0);
    const bValue = typeof b === 'number' ? b : b._getValue();
    result.setValue(a._getValue() / bValue);
    return result;
}
/**
 * Modulo animated values
 */
export function modulo(a, modulus) {
    const result = new AnimatedValue(0);
    result.setValue(((a._getValue() % modulus) + modulus) % modulus);
    return result;
}
/**
 * Clamp between min and max
 */
export function diffClamp(a, min, max) {
    const result = new AnimatedValue(Math.min(Math.max(a._getValue(), min), max));
    return result;
}
// ============================================================================
// Event Handler
// ============================================================================
/**
 * Create an event handler for animated values
 */
export function event(argMapping, config) {
    return (e) => {
        const nativeEvent = e.nativeEvent;
        argMapping.forEach((mapping) => {
            if (!mapping)
                return;
            Object.entries(mapping.nativeEvent).forEach(([key, animatedValue]) => {
                if (animatedValue && key in nativeEvent) {
                    animatedValue.setValue(nativeEvent[key]);
                }
            });
        });
        config?.listener?.(e);
    };
}
// ============================================================================
// Animated Components
// ============================================================================
/**
 * Create an animated component wrapper
 */
export function createAnimatedComponent(Component) {
    return (props) => {
        // In a real implementation, this would wrap the component
        // and handle animated style props
        return Component(props);
    };
}
// ============================================================================
// Animated Namespace
// ============================================================================
export const Animated = {
    Value: AnimatedValue,
    ValueXY: AnimatedValueXY,
    Interpolation: AnimatedInterpolation,
    timing,
    spring,
    decay,
    sequence,
    parallel,
    stagger,
    loop,
    add,
    subtract,
    multiply,
    divide,
    modulo,
    diffClamp,
    event,
    createAnimatedComponent,
    Easing,
};
export default Animated;
//# sourceMappingURL=Animated.js.map