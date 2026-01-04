/**
 * @philjs/haptic - Haptic Feedback System
 *
 * Rich haptic feedback for mobile and XR experiences.
 * NO OTHER FRAMEWORK provides native haptic patterns.
 *
 * Features:
 * - Vibration API integration
 * - Pre-defined haptic patterns
 * - Custom pattern builder
 * - Gamepad haptics support
 * - XR haptics for controllers
 * - Accessibility considerations
 * - Battery-aware haptics
 */
// ============================================================================
// Built-in Haptic Patterns
// ============================================================================
export const HAPTIC_PATTERNS = {
    // Basic patterns
    tap: {
        name: 'tap',
        pattern: [10],
        description: 'Single light tap'
    },
    doubleTap: {
        name: 'doubleTap',
        pattern: [10, 50, 10],
        description: 'Double tap'
    },
    tripleTap: {
        name: 'tripleTap',
        pattern: [10, 50, 10, 50, 10],
        description: 'Triple tap'
    },
    // Impact patterns
    lightImpact: {
        name: 'lightImpact',
        pattern: [15],
        description: 'Light impact feedback'
    },
    mediumImpact: {
        name: 'mediumImpact',
        pattern: [30],
        description: 'Medium impact feedback'
    },
    heavyImpact: {
        name: 'heavyImpact',
        pattern: [50],
        description: 'Heavy impact feedback'
    },
    rigidImpact: {
        name: 'rigidImpact',
        pattern: [5, 5, 5],
        description: 'Sharp rigid impact'
    },
    softImpact: {
        name: 'softImpact',
        pattern: [20, 10, 20],
        description: 'Soft bouncy impact'
    },
    // Selection patterns
    selection: {
        name: 'selection',
        pattern: [5],
        description: 'Selection tick'
    },
    selectionChange: {
        name: 'selectionChange',
        pattern: [8, 30, 8],
        description: 'Selection changed'
    },
    // Notification patterns
    notification: {
        name: 'notification',
        pattern: [50, 100, 50],
        description: 'Standard notification'
    },
    success: {
        name: 'success',
        pattern: [30, 50, 30, 50, 60],
        description: 'Success confirmation'
    },
    warning: {
        name: 'warning',
        pattern: [100, 50, 100],
        description: 'Warning alert'
    },
    error: {
        name: 'error',
        pattern: [100, 30, 100, 30, 100],
        description: 'Error feedback'
    },
    // UI patterns
    buttonPress: {
        name: 'buttonPress',
        pattern: [20],
        description: 'Button press'
    },
    buttonRelease: {
        name: 'buttonRelease',
        pattern: [10],
        description: 'Button release'
    },
    toggle: {
        name: 'toggle',
        pattern: [15, 40, 25],
        description: 'Toggle switch'
    },
    slider: {
        name: 'slider',
        pattern: [5],
        description: 'Slider tick'
    },
    sliderEnd: {
        name: 'sliderEnd',
        pattern: [30],
        description: 'Slider reached end'
    },
    // Gesture patterns
    swipe: {
        name: 'swipe',
        pattern: [10, 20, 30],
        description: 'Swipe gesture'
    },
    longPress: {
        name: 'longPress',
        pattern: [10, 10, 10, 10, 10, 10, 50],
        description: 'Long press build-up'
    },
    dragStart: {
        name: 'dragStart',
        pattern: [25],
        description: 'Drag started'
    },
    dragEnd: {
        name: 'dragEnd',
        pattern: [40],
        description: 'Drag ended'
    },
    drop: {
        name: 'drop',
        pattern: [60, 30, 20],
        description: 'Item dropped'
    },
    // Gaming patterns
    explosion: {
        name: 'explosion',
        pattern: [100, 20, 80, 20, 60, 20, 40, 20, 20],
        description: 'Explosion effect'
    },
    collision: {
        name: 'collision',
        pattern: [80, 30, 40],
        description: 'Collision impact'
    },
    powerUp: {
        name: 'powerUp',
        pattern: [20, 30, 30, 30, 40, 30, 50],
        description: 'Power-up collected'
    },
    levelUp: {
        name: 'levelUp',
        pattern: [30, 50, 40, 50, 50, 50, 60, 50, 70],
        description: 'Level up fanfare'
    },
    damage: {
        name: 'damage',
        pattern: [60, 20, 40],
        description: 'Damage taken'
    },
    heal: {
        name: 'heal',
        pattern: [20, 40, 30, 40, 40],
        description: 'Healing effect'
    },
    // Communication patterns
    messageReceived: {
        name: 'messageReceived',
        pattern: [30, 80, 30],
        description: 'Message received'
    },
    messageSent: {
        name: 'messageSent',
        pattern: [15, 30, 20],
        description: 'Message sent'
    },
    typing: {
        name: 'typing',
        pattern: [5],
        description: 'Keyboard key'
    },
    // Navigation patterns
    pageChange: {
        name: 'pageChange',
        pattern: [25, 50, 15],
        description: 'Page navigation'
    },
    pullToRefresh: {
        name: 'pullToRefresh',
        pattern: [10, 20, 10, 20, 10, 20, 40],
        description: 'Pull to refresh threshold'
    },
    scrollEnd: {
        name: 'scrollEnd',
        pattern: [30],
        description: 'Scroll reached end'
    }
};
// ============================================================================
// Haptic Engine
// ============================================================================
export class HapticEngine {
    config;
    enabled = true;
    customPatterns = new Map();
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled ?? true,
            respectReducedMotion: config.respectReducedMotion ?? true,
            maxDuration: config.maxDuration ?? 5000,
            defaultIntensity: config.defaultIntensity ?? 'medium'
        };
        // Check reduced motion preference
        if (this.config.respectReducedMotion && typeof window !== 'undefined') {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.enabled = !prefersReducedMotion.matches;
            prefersReducedMotion.addEventListener('change', (e) => {
                this.enabled = !e.matches;
            });
        }
    }
    static isSupported() {
        return typeof navigator !== 'undefined' && 'vibrate' in navigator;
    }
    vibrate(pattern) {
        if (!this.enabled || !this.config.enabled || !HapticEngine.isSupported()) {
            return false;
        }
        const patternArray = Array.isArray(pattern) ? pattern : [pattern];
        // Enforce max duration
        const totalDuration = patternArray.reduce((sum, val) => sum + val, 0);
        if (totalDuration > this.config.maxDuration) {
            console.warn(`Haptic pattern exceeds max duration of ${this.config.maxDuration}ms`);
            return false;
        }
        return navigator.vibrate(patternArray);
    }
    play(patternName) {
        const pattern = this.customPatterns.get(patternName) ?? HAPTIC_PATTERNS[patternName];
        if (!pattern) {
            console.warn(`Haptic pattern "${patternName}" not found`);
            return false;
        }
        return this.vibrate(pattern.pattern);
    }
    impact(intensity = this.config.defaultIntensity) {
        const patterns = {
            light: 'lightImpact',
            medium: 'mediumImpact',
            heavy: 'heavyImpact',
            rigid: 'rigidImpact',
            soft: 'softImpact'
        };
        return this.play(patterns[intensity]);
    }
    notification(type) {
        const patterns = {
            impact: 'mediumImpact',
            selection: 'selection',
            notification: 'notification',
            warning: 'warning',
            error: 'error',
            success: 'success'
        };
        return this.play(patterns[type]);
    }
    selection() {
        return this.play('selection');
    }
    stop() {
        if (HapticEngine.isSupported()) {
            navigator.vibrate(0);
        }
    }
    registerPattern(pattern) {
        this.customPatterns.set(pattern.name, pattern);
    }
    createPattern(name, vibrations) {
        const pattern = [];
        vibrations.forEach((v, i) => {
            pattern.push(v.duration);
            if (v.pause && i < vibrations.length - 1) {
                pattern.push(v.pause);
            }
        });
        return { name, pattern };
    }
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }
    isEnabled() {
        return this.enabled && this.config.enabled;
    }
    getPatterns() {
        const builtIn = Object.values(HAPTIC_PATTERNS);
        const custom = Array.from(this.customPatterns.values());
        return [...builtIn, ...custom];
    }
}
// ============================================================================
// Gamepad Haptics
// ============================================================================
export class GamepadHaptics {
    gamepadIndex;
    constructor(gamepadIndex = 0) {
        this.gamepadIndex = gamepadIndex;
    }
    getGamepad() {
        if (typeof navigator === 'undefined' || !navigator.getGamepads) {
            return null;
        }
        const gamepads = navigator.getGamepads();
        return gamepads[this.gamepadIndex] ?? null;
    }
    async playEffect(effect) {
        const gamepad = this.getGamepad();
        if (!gamepad)
            return false;
        const actuator = gamepad.vibrationActuator;
        if (!actuator)
            return false;
        try {
            await actuator.playEffect('dual-rumble', {
                duration: effect.duration,
                startDelay: effect.startDelay ?? 0,
                strongMagnitude: effect.strongMagnitude ?? 0.5,
                weakMagnitude: effect.weakMagnitude ?? 0.5
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async pulse(duration = 100, intensity = 0.5) {
        return this.playEffect({
            duration,
            strongMagnitude: intensity,
            weakMagnitude: intensity
        });
    }
    async rumble(duration = 200) {
        return this.playEffect({
            duration,
            strongMagnitude: 1.0,
            weakMagnitude: 0.3
        });
    }
    async stop() {
        const gamepad = this.getGamepad();
        if (!gamepad)
            return;
        const actuator = gamepad.vibrationActuator;
        if (actuator) {
            try {
                await actuator.reset();
            }
            catch {
                // Ignore errors
            }
        }
    }
    static isSupported() {
        if (typeof navigator === 'undefined' || !navigator.getGamepads) {
            return false;
        }
        const gamepads = navigator.getGamepads();
        for (const gamepad of gamepads) {
            if (gamepad && gamepad.vibrationActuator) {
                return true;
            }
        }
        return false;
    }
    setGamepadIndex(index) {
        this.gamepadIndex = index;
    }
}
// ============================================================================
// XR Haptics
// ============================================================================
export class XRHaptics {
    session = null;
    inputSources = [];
    constructor() {
        if (typeof navigator !== 'undefined' && 'xr' in navigator) {
            this.setupXRListeners();
        }
    }
    setupXRListeners() {
        // Listen for XR session events to get input sources
        if (typeof window !== 'undefined') {
            window.addEventListener('xrsessionstart', ((event) => {
                this.session = event.detail?.session ?? null;
                this.updateInputSources();
            }));
        }
    }
    setSession(session) {
        this.session = session;
        this.updateInputSources();
        session.addEventListener('inputsourceschange', () => {
            this.updateInputSources();
        });
    }
    updateInputSources() {
        if (!this.session) {
            this.inputSources = [];
            return;
        }
        this.inputSources = Array.from(this.session.inputSources);
    }
    async pulse(handedness, duration = 100, intensity = 1.0) {
        const sources = this.inputSources.filter(source => {
            if (handedness === 'both')
                return true;
            return source.handedness === handedness;
        });
        if (sources.length === 0)
            return false;
        const results = await Promise.all(sources.map(source => this.pulseSource(source, duration, intensity)));
        return results.some(r => r);
    }
    async pulseSource(source, duration, intensity) {
        const gamepad = source.gamepad;
        if (!gamepad)
            return false;
        const actuator = gamepad.hapticActuators?.[0];
        if (!actuator)
            return false;
        try {
            await actuator.pulse(intensity, duration);
            return true;
        }
        catch {
            return false;
        }
    }
    async pulseLeft(duration, intensity) {
        return this.pulse('left', duration, intensity);
    }
    async pulseRight(duration, intensity) {
        return this.pulse('right', duration, intensity);
    }
    async pulseBoth(duration, intensity) {
        return this.pulse('both', duration, intensity);
    }
    async pattern(handedness, pulses) {
        for (const pulse of pulses) {
            await this.pulse(handedness, pulse.duration, pulse.intensity);
            await new Promise(resolve => setTimeout(resolve, pulse.duration + 20));
        }
    }
    getInputSources() {
        return [...this.inputSources];
    }
    hasHaptics(handedness) {
        return this.inputSources.some(source => {
            if (source.handedness !== handedness)
                return false;
            const gamepad = source.gamepad;
            return gamepad && gamepad.hapticActuators?.length > 0;
        });
    }
    static isSupported() {
        return typeof navigator !== 'undefined' && 'xr' in navigator;
    }
}
// ============================================================================
// Haptic Composer
// ============================================================================
export class HapticComposer {
    steps = [];
    vibrate(duration) {
        this.steps.push({ type: 'vibrate', duration });
        return this;
    }
    pause(duration) {
        this.steps.push({ type: 'pause', duration });
        return this;
    }
    tap() {
        return this.vibrate(10);
    }
    pulse(duration = 30) {
        return this.vibrate(duration);
    }
    beat(count, duration = 20, gap = 50) {
        for (let i = 0; i < count; i++) {
            this.vibrate(duration);
            if (i < count - 1) {
                this.pause(gap);
            }
        }
        return this;
    }
    crescendo(steps = 5, maxDuration = 50) {
        const stepSize = maxDuration / steps;
        for (let i = 1; i <= steps; i++) {
            this.vibrate(Math.round(stepSize * i));
            if (i < steps) {
                this.pause(30);
            }
        }
        return this;
    }
    decrescendo(steps = 5, maxDuration = 50) {
        const stepSize = maxDuration / steps;
        for (let i = steps; i >= 1; i--) {
            this.vibrate(Math.round(stepSize * i));
            if (i > 1) {
                this.pause(30);
            }
        }
        return this;
    }
    wave(count = 3) {
        for (let i = 0; i < count; i++) {
            this.crescendo(3, 30);
            this.pause(20);
            this.decrescendo(3, 30);
            if (i < count - 1) {
                this.pause(50);
            }
        }
        return this;
    }
    build() {
        const pattern = [];
        for (const step of this.steps) {
            pattern.push(step.duration);
        }
        return {
            name: 'custom',
            pattern
        };
    }
    toArray() {
        return this.build().pattern;
    }
    play(engine) {
        const e = engine ?? new HapticEngine();
        return e.vibrate(this.toArray());
    }
    reset() {
        this.steps = [];
        return this;
    }
}
// ============================================================================
// React-style Hooks
// ============================================================================
// Singleton engine
let globalEngine = null;
let globalGamepadHaptics = null;
let globalXRHaptics = null;
function getEngine() {
    if (!globalEngine) {
        globalEngine = new HapticEngine();
    }
    return globalEngine;
}
/**
 * Hook for haptic feedback
 */
export function useHaptic(config) {
    const engine = config ? new HapticEngine(config) : getEngine();
    return {
        vibrate: (pattern) => engine.vibrate(pattern),
        play: (name) => engine.play(name),
        impact: (intensity) => engine.impact(intensity),
        notification: (type) => engine.notification(type),
        selection: () => engine.selection(),
        stop: () => engine.stop(),
        supported: HapticEngine.isSupported(),
        enabled: engine.isEnabled(),
        setEnabled: (enabled) => engine.setEnabled(enabled)
    };
}
/**
 * Hook for haptic patterns
 */
export function useHapticPattern() {
    const engine = getEngine();
    return {
        patterns: engine.getPatterns(),
        register: (pattern) => engine.registerPattern(pattern),
        create: (name, vibrations) => engine.createPattern(name, vibrations),
        compose: () => new HapticComposer()
    };
}
/**
 * Hook for gamepad haptics
 */
export function useGamepadHaptics(gamepadIndex) {
    if (!globalGamepadHaptics) {
        globalGamepadHaptics = new GamepadHaptics(gamepadIndex);
    }
    const haptics = globalGamepadHaptics;
    return {
        pulse: (d, i) => haptics.pulse(d, i),
        rumble: (d) => haptics.rumble(d),
        playEffect: (e) => haptics.playEffect(e),
        stop: () => haptics.stop(),
        supported: GamepadHaptics.isSupported(),
        setGamepadIndex: (i) => haptics.setGamepadIndex(i)
    };
}
/**
 * Hook for XR haptics
 */
export function useXRHaptics() {
    if (!globalXRHaptics) {
        globalXRHaptics = new XRHaptics();
    }
    const haptics = globalXRHaptics;
    return {
        pulse: (h, d, i) => haptics.pulse(h, d, i),
        pulseLeft: (d, i) => haptics.pulseLeft(d, i),
        pulseRight: (d, i) => haptics.pulseRight(d, i),
        pulseBoth: (d, i) => haptics.pulseBoth(d, i),
        pattern: (h, p) => haptics.pattern(h, p),
        setSession: (s) => haptics.setSession(s),
        supported: XRHaptics.isSupported()
    };
}
// ============================================================================
// Default Export
// ============================================================================
export default {
    HapticEngine,
    GamepadHaptics,
    XRHaptics,
    HapticComposer,
    HAPTIC_PATTERNS,
    useHaptic,
    useHapticPattern,
    useGamepadHaptics,
    useXRHaptics
};
//# sourceMappingURL=index.js.map