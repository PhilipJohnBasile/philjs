/**
 * @philjs/motion - Spring Physics Animation System
 *
 * Industry-first framework-native physics-based animations:
 * - Spring dynamics with configurable tension/friction
 * - Gesture-driven animations
 * - Layout animations with FLIP technique
 * - Scroll-linked animations
 * - Orchestrated sequences
 * - GPU-accelerated transforms
 */
// ============================================================================
// Spring Presets
// ============================================================================
export const SpringPresets = {
    default: { tension: 170, friction: 26 },
    gentle: { tension: 120, friction: 14 },
    wobbly: { tension: 180, friction: 12 },
    stiff: { tension: 210, friction: 20 },
    slow: { tension: 280, friction: 60 },
    molasses: { tension: 280, friction: 120 },
    bouncy: { tension: 600, friction: 10 },
    snappy: { tension: 400, friction: 30 }
};
// ============================================================================
// Spring Engine
// ============================================================================
export class Spring {
    config;
    value;
    velocity;
    target;
    isAnimating = false;
    animationFrame = null;
    callbacks = [];
    resolvers = [];
    constructor(initialValue = 0, config = {}) {
        this.config = {
            tension: config.tension ?? 170,
            friction: config.friction ?? 26,
            mass: config.mass ?? 1,
            velocity: config.velocity ?? 0,
            precision: config.precision ?? 0.01,
            clamp: config.clamp ?? false
        };
        this.value = initialValue;
        this.velocity = this.config.velocity;
        this.target = initialValue;
    }
    get() {
        return this.value;
    }
    set(newValue, immediate = false) {
        if (immediate) {
            this.value = newValue;
            this.target = newValue;
            this.velocity = 0;
            this.emit();
            return Promise.resolve();
        }
        this.target = newValue;
        if (!this.isAnimating) {
            this.start();
        }
        return new Promise((resolve) => {
            this.resolvers.push(resolve);
        });
    }
    configure(config) {
        Object.assign(this.config, config);
    }
    onUpdate(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1)
                this.callbacks.splice(index, 1);
        };
    }
    start() {
        this.isAnimating = true;
        this.animate();
    }
    animate() {
        if (!this.isAnimating)
            return;
        const { tension, friction, mass, precision, clamp } = this.config;
        // Spring physics calculation
        const springForce = -tension * (this.value - this.target);
        const dampingForce = -friction * this.velocity;
        const acceleration = (springForce + dampingForce) / mass;
        this.velocity += acceleration * (1 / 60); // 60fps
        this.value += this.velocity * (1 / 60);
        // Clamping
        if (clamp) {
            if ((this.velocity > 0 && this.value > this.target) ||
                (this.velocity < 0 && this.value < this.target)) {
                this.value = this.target;
                this.velocity = 0;
            }
        }
        // Check if animation is complete
        const isComplete = Math.abs(this.velocity) < precision &&
            Math.abs(this.value - this.target) < precision;
        if (isComplete) {
            this.value = this.target;
            this.velocity = 0;
            this.isAnimating = false;
            // Resolve all promises
            this.resolvers.forEach(resolve => resolve());
            this.resolvers = [];
        }
        this.emit();
        if (this.isAnimating) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        }
    }
    emit() {
        const state = {
            isAnimating: this.isAnimating,
            progress: this.target !== 0 ? this.value / this.target : 1,
            velocity: this.velocity
        };
        this.callbacks.forEach(cb => cb(state));
    }
    stop() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    dispose() {
        this.stop();
        this.callbacks = [];
        this.resolvers = [];
    }
}
// ============================================================================
// Multi-Dimensional Spring
// ============================================================================
export class SpringVector {
    springs = new Map();
    config;
    constructor(initial = {}, config = {}) {
        this.config = config;
        for (const [key, value] of Object.entries(initial)) {
            this.springs.set(key, new Spring(value, config));
        }
    }
    get(key) {
        if (key) {
            return this.springs.get(key)?.get() ?? 0;
        }
        const values = {};
        for (const [k, spring] of this.springs) {
            values[k] = spring.get();
        }
        return values;
    }
    set(values, immediate = false) {
        const promises = [];
        for (const [key, value] of Object.entries(values)) {
            let spring = this.springs.get(key);
            if (!spring) {
                spring = new Spring(value, this.config);
                this.springs.set(key, spring);
            }
            promises.push(spring.set(value, immediate));
        }
        return Promise.all(promises);
    }
    onUpdate(callback) {
        const unsubscribes = [];
        for (const [, spring] of this.springs) {
            unsubscribes.push(spring.onUpdate(() => {
                callback(this.get());
            }));
        }
        return () => unsubscribes.forEach(fn => fn());
    }
    dispose() {
        for (const spring of this.springs.values()) {
            spring.dispose();
        }
        this.springs.clear();
    }
}
// ============================================================================
// Animated Transform
// ============================================================================
export class AnimatedTransform {
    element;
    springs;
    willChange = [];
    constructor(element, initial, config) {
        this.element = element;
        this.springs = new SpringVector({
            x: initial?.x ?? 0,
            y: initial?.y ?? 0,
            z: initial?.z ?? 0,
            scale: initial?.scale ?? 1,
            scaleX: initial?.scaleX ?? 1,
            scaleY: initial?.scaleY ?? 1,
            rotate: initial?.rotate ?? 0,
            rotateX: initial?.rotateX ?? 0,
            rotateY: initial?.rotateY ?? 0,
            rotateZ: initial?.rotateZ ?? 0,
            skewX: initial?.skewX ?? 0,
            skewY: initial?.skewY ?? 0,
            opacity: initial?.opacity ?? 1
        }, config);
        this.setupWillChange();
        this.springs.onUpdate((values) => this.applyTransform(values));
    }
    setupWillChange() {
        this.element.style.willChange = 'transform, opacity';
    }
    applyTransform(values) {
        const transforms = [];
        if (values['x'] !== 0 || values['y'] !== 0 || values['z'] !== 0) {
            transforms.push(`translate3d(${values['x']}px, ${values['y']}px, ${values['z']}px)`);
        }
        if (values['scale'] !== 1) {
            transforms.push(`scale(${values['scale']})`);
        }
        else {
            if (values['scaleX'] !== 1)
                transforms.push(`scaleX(${values['scaleX']})`);
            if (values['scaleY'] !== 1)
                transforms.push(`scaleY(${values['scaleY']})`);
        }
        if (values['rotate'] !== 0) {
            transforms.push(`rotate(${values['rotate']}deg)`);
        }
        if (values['rotateX'] !== 0)
            transforms.push(`rotateX(${values['rotateX']}deg)`);
        if (values['rotateY'] !== 0)
            transforms.push(`rotateY(${values['rotateY']}deg)`);
        if (values['rotateZ'] !== 0)
            transforms.push(`rotateZ(${values['rotateZ']}deg)`);
        if (values['skewX'] !== 0)
            transforms.push(`skewX(${values['skewX']}deg)`);
        if (values['skewY'] !== 0)
            transforms.push(`skewY(${values['skewY']}deg)`);
        this.element.style.transform = transforms.join(' ');
        this.element.style.opacity = String(values['opacity']);
    }
    animate(values) {
        return this.springs.set(values);
    }
    set(values) {
        this.springs.set(values, true);
    }
    get() {
        return this.springs.get();
    }
    dispose() {
        this.element.style.willChange = '';
        this.springs.dispose();
    }
}
// ============================================================================
// FLIP Layout Animation
// ============================================================================
export class FlipAnimation {
    element;
    firstRect = null;
    config;
    constructor(element, config) {
        this.element = element;
        this.config = config ?? SpringPresets.default;
    }
    first() {
        const rect = this.element.getBoundingClientRect();
        this.firstRect = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }
    last() {
        const rect = this.element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }
    invert() {
        if (!this.firstRect)
            return null;
        const lastRect = this.last();
        return {
            x: this.firstRect.x - lastRect.x,
            y: this.firstRect.y - lastRect.y,
            scaleX: this.firstRect.width / lastRect.width,
            scaleY: this.firstRect.height / lastRect.height
        };
    }
    async play() {
        const invert = this.invert();
        if (!invert)
            return;
        const transform = new AnimatedTransform(this.element, {
            x: invert.x,
            y: invert.y,
            scaleX: invert.scaleX,
            scaleY: invert.scaleY
        }, this.config);
        await transform.animate({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
        transform.dispose();
    }
}
// ============================================================================
// Gesture-Driven Animation
// ============================================================================
export class GestureAnimation {
    element;
    transform;
    state;
    isDragging = false;
    startPoint = { x: 0, y: 0 };
    lastPoint = { x: 0, y: 0 };
    lastTime = 0;
    bounds;
    onDragEndCallback;
    constructor(element, config) {
        this.element = element;
        this.transform = new AnimatedTransform(element, {}, config);
        this.state = this.createInitialState();
        this.setupListeners();
    }
    createInitialState() {
        return {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            vx: 0,
            vy: 0,
            isDragging: false,
            isPinching: false,
            scale: 1,
            rotation: 0
        };
    }
    setupListeners() {
        this.element.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
    }
    onPointerDown = (e) => {
        this.isDragging = true;
        this.startPoint = { x: e.clientX, y: e.clientY };
        this.lastPoint = { x: e.clientX, y: e.clientY };
        this.lastTime = Date.now();
        this.state.isDragging = true;
        this.element.setPointerCapture(e.pointerId);
    };
    onPointerMove = (e) => {
        if (!this.isDragging)
            return;
        const now = Date.now();
        const dt = (now - this.lastTime) / 1000;
        this.state.dx = e.clientX - this.lastPoint.x;
        this.state.dy = e.clientY - this.lastPoint.y;
        this.state.x += this.state.dx;
        this.state.y += this.state.dy;
        if (dt > 0) {
            this.state.vx = this.state.dx / dt;
            this.state.vy = this.state.dy / dt;
        }
        // Apply bounds
        if (this.bounds) {
            this.state.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.state.x));
            this.state.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.state.y));
        }
        this.transform.set({ x: this.state.x, y: this.state.y });
        this.lastPoint = { x: e.clientX, y: e.clientY };
        this.lastTime = now;
    };
    onPointerUp = () => {
        if (!this.isDragging)
            return;
        this.isDragging = false;
        this.state.isDragging = false;
        if (this.onDragEndCallback) {
            this.onDragEndCallback(this.state);
        }
    };
    setBounds(bounds) {
        this.bounds = bounds;
    }
    onDragEnd(callback) {
        this.onDragEndCallback = callback;
    }
    animateTo(x, y) {
        this.state.x = x;
        this.state.y = y;
        return this.transform.animate({ x, y });
    }
    reset() {
        this.state = this.createInitialState();
        return this.transform.animate({ x: 0, y: 0 });
    }
    getState() {
        return { ...this.state };
    }
    dispose() {
        this.element.removeEventListener('pointerdown', this.onPointerDown);
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);
        this.transform.dispose();
    }
}
// ============================================================================
// Scroll-Linked Animation
// ============================================================================
export class ScrollAnimation {
    element;
    container;
    startOffset;
    endOffset;
    callbacks = [];
    lastScrollY = 0;
    lastTime = 0;
    ticking = false;
    constructor(element, options = {}) {
        this.element = element;
        this.container = options.container ?? window;
        this.startOffset = options.startOffset ?? 0;
        this.endOffset = options.endOffset ?? 1;
        this.setupListener();
    }
    setupListener() {
        this.container.addEventListener('scroll', this.onScroll, { passive: true });
    }
    onScroll = () => {
        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.update();
                this.ticking = false;
            });
            this.ticking = true;
        }
    };
    update() {
        const now = Date.now();
        const scrollY = this.getScrollY();
        const dt = (now - this.lastTime) / 1000;
        const rect = this.element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Calculate progress based on element position
        const elementTop = rect.top + scrollY;
        const elementBottom = elementTop + rect.height;
        const scrollTop = scrollY;
        const scrollBottom = scrollY + viewportHeight;
        let progress = 0;
        if (scrollBottom > elementTop && scrollTop < elementBottom) {
            const visibleTop = Math.max(scrollTop, elementTop);
            const visibleBottom = Math.min(scrollBottom, elementBottom);
            progress = (visibleBottom - visibleTop) / rect.height;
        }
        // Apply offset mapping
        progress = (progress - this.startOffset) / (this.endOffset - this.startOffset);
        progress = Math.max(0, Math.min(1, progress));
        const velocity = dt > 0 ? (scrollY - this.lastScrollY) / dt : 0;
        const direction = velocity > 0 ? 'down' : velocity < 0 ? 'up' : null;
        const info = {
            x: this.getScrollX(),
            y: scrollY,
            progress,
            velocity,
            direction
        };
        this.callbacks.forEach(cb => cb(progress, info));
        this.lastScrollY = scrollY;
        this.lastTime = now;
    }
    getScrollY() {
        if (this.container === window) {
            return window.scrollY;
        }
        return this.container.scrollTop;
    }
    getScrollX() {
        if (this.container === window) {
            return window.scrollX;
        }
        return this.container.scrollLeft;
    }
    onProgress(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1)
                this.callbacks.splice(index, 1);
        };
    }
    dispose() {
        this.container.removeEventListener('scroll', this.onScroll);
        this.callbacks = [];
    }
}
// ============================================================================
// Animation Sequence
// ============================================================================
export class AnimationSequence {
    steps = [];
    isPlaying = false;
    to(targets, values, options) {
        const step = {
            targets: Array.isArray(targets) ? targets : [targets],
            values
        };
        if (options?.config !== undefined) {
            step.config = options.config;
        }
        if (options?.stagger !== undefined) {
            step.stagger = options.stagger;
        }
        this.steps.push(step);
        return this;
    }
    async play() {
        if (this.isPlaying)
            return;
        this.isPlaying = true;
        for (const step of this.steps) {
            const promises = [];
            step.targets.forEach((target, index) => {
                const delay = step.stagger ? step.stagger * index : 0;
                const promise = new Promise((resolve) => {
                    setTimeout(async () => {
                        const transform = new AnimatedTransform(target, {}, step.config);
                        await transform.animate(step.values);
                        transform.dispose();
                        resolve([]);
                    }, delay);
                });
                promises.push(promise);
            });
            await Promise.all(promises);
        }
        this.isPlaying = false;
    }
    reset() {
        this.steps = [];
        this.isPlaying = false;
    }
}
// ============================================================================
// Easing Functions
// ============================================================================
export const Easing = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInElastic: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    easeOutElastic: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutBounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1)
            return n1 * t * t;
        if (t < 2 / d1)
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1)
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
};
const effectQueue = [];
function useEffect(effect, _deps) {
    effectQueue.push(effect);
}
function useState(initial) {
    let state = initial;
    const setState = (value) => {
        state = typeof value === 'function' ? value(state) : value;
    };
    return [state, setState];
}
function useRef(initial) {
    return { current: initial };
}
function useCallback(fn, _deps) {
    return fn;
}
export function useSpring(initial = 0, config) {
    const springRef = useRef(null);
    const [value, setValue] = useState(initial);
    useEffect(() => {
        springRef.current = new Spring(initial, config);
        springRef.current.onUpdate((state) => {
            setValue(springRef.current.get());
        });
        return () => springRef.current?.dispose();
    }, []);
    const set = useCallback((newValue) => {
        return springRef.current?.set(newValue);
    }, []);
    const setImmediate = useCallback((newValue) => {
        return springRef.current?.set(newValue, true);
    }, []);
    return { value, set, setImmediate };
}
export function useSpringVector(initial = {}, config) {
    const springRef = useRef(null);
    const [values, setValues] = useState(initial);
    useEffect(() => {
        springRef.current = new SpringVector(initial, config);
        springRef.current.onUpdate(setValues);
        return () => springRef.current?.dispose();
    }, []);
    const set = useCallback((newValues) => {
        return springRef.current?.set(newValues);
    }, []);
    return { values, set };
}
export function useAnimatedTransform(elementRef, initial, config) {
    const transformRef = useRef(null);
    useEffect(() => {
        if (!elementRef.current)
            return;
        transformRef.current = new AnimatedTransform(elementRef.current, initial, config);
        return () => transformRef.current?.dispose();
    }, [elementRef.current]);
    const animate = useCallback((values) => {
        return transformRef.current?.animate(values);
    }, []);
    const set = useCallback((values) => {
        transformRef.current?.set(values);
    }, []);
    return { animate, set };
}
export function useGesture(elementRef, config) {
    const gestureRef = useRef(null);
    const [state, setState] = useState({
        x: 0, y: 0, dx: 0, dy: 0, vx: 0, vy: 0,
        isDragging: false, isPinching: false, scale: 1, rotation: 0
    });
    useEffect(() => {
        if (!elementRef.current)
            return;
        gestureRef.current = new GestureAnimation(elementRef.current, config);
        return () => gestureRef.current?.dispose();
    }, [elementRef.current]);
    const setBounds = useCallback((bounds) => {
        gestureRef.current?.setBounds(bounds);
    }, []);
    const animateTo = useCallback((x, y) => {
        return gestureRef.current?.animateTo(x, y);
    }, []);
    const reset = useCallback(() => {
        return gestureRef.current?.reset();
    }, []);
    return { state, setBounds, animateTo, reset };
}
export function useScrollAnimation(elementRef, options) {
    const animationRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [scrollInfo, setScrollInfo] = useState(null);
    useEffect(() => {
        if (!elementRef.current)
            return;
        animationRef.current = new ScrollAnimation(elementRef.current, options);
        animationRef.current.onProgress((p, info) => {
            setProgress(p);
            setScrollInfo(info);
        });
        return () => animationRef.current?.dispose();
    }, [elementRef.current]);
    return { progress, scrollInfo };
}
export function useFlip(elementRef, config) {
    const flipRef = useRef(null);
    useEffect(() => {
        if (!elementRef.current)
            return;
        flipRef.current = new FlipAnimation(elementRef.current, config);
    }, [elementRef.current]);
    const snapshot = useCallback(() => {
        flipRef.current?.first();
    }, []);
    const animate = useCallback(() => {
        return flipRef.current?.play();
    }, []);
    return { snapshot, animate };
}
// Export everything
export default {
    Spring,
    SpringVector,
    SpringPresets,
    AnimatedTransform,
    FlipAnimation,
    GestureAnimation,
    ScrollAnimation,
    AnimationSequence,
    Easing,
    useSpring,
    useSpringVector,
    useAnimatedTransform,
    useGesture,
    useScrollAnimation,
    useFlip
};
//# sourceMappingURL=index.js.map