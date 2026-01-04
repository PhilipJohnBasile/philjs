/**
 * @philjs/ambient - Environment-Adaptive UI
 *
 * Industry-first framework-native ambient computing:
 * - Light sensor adaptation
 * - Proximity detection
 * - Motion-based interactions
 * - Audio environment awareness
 * - Context-aware UI morphing
 * - Attention-based dimming
 */
// ============================================================================
// Ambient Sensors
// ============================================================================
class LightSensor {
    sensor = null;
    callbacks = [];
    currentConditions = {
        illuminance: 200,
        level: 'normal',
        isNatural: true,
        timestamp: Date.now()
    };
    async start() {
        if ('AmbientLightSensor' in window) {
            try {
                this.sensor = new window.AmbientLightSensor();
                this.sensor.addEventListener('reading', () => {
                    this.updateConditions(this.sensor.illuminance);
                });
                this.sensor.start();
            }
            catch {
                // Fallback to media query
                this.useMediaQueryFallback();
            }
        }
        else {
            this.useMediaQueryFallback();
        }
    }
    useMediaQueryFallback() {
        const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateFromQuery = () => {
            this.updateConditions(darkQuery.matches ? 50 : 200);
        };
        darkQuery.addEventListener('change', updateFromQuery);
        updateFromQuery();
    }
    updateConditions(illuminance) {
        let level;
        if (illuminance < 10)
            level = 'dark';
        else if (illuminance < 50)
            level = 'dim';
        else if (illuminance < 500)
            level = 'normal';
        else if (illuminance < 10000)
            level = 'bright';
        else
            level = 'very-bright';
        this.currentConditions = {
            illuminance,
            level,
            isNatural: illuminance > 1000,
            timestamp: Date.now()
        };
        this.callbacks.forEach(cb => cb(this.currentConditions));
    }
    onUpdate(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1)
                this.callbacks.splice(index, 1);
        };
    }
    getConditions() {
        return { ...this.currentConditions };
    }
    stop() {
        this.sensor?.stop();
    }
}
class MotionSensor {
    callbacks = [];
    currentState = {
        isMoving: false,
        acceleration: { x: 0, y: 0, z: 0 },
        rotation: { alpha: 0, beta: 0, gamma: 0 },
        activity: 'stationary'
    };
    accelerationHistory = [];
    start() {
        if ('DeviceMotionEvent' in window) {
            window.addEventListener('devicemotion', this.handleMotion);
        }
        if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', this.handleOrientation);
        }
    }
    handleMotion = (event) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc)
            return;
        this.currentState.acceleration = {
            x: acc.x ?? 0,
            y: acc.y ?? 0,
            z: acc.z ?? 0
        };
        this.accelerationHistory.push({ ...this.currentState.acceleration });
        if (this.accelerationHistory.length > 50) {
            this.accelerationHistory.shift();
        }
        this.currentState.activity = this.detectActivity();
        this.currentState.isMoving = this.currentState.activity !== 'stationary';
        this.callbacks.forEach(cb => cb(this.currentState));
    };
    handleOrientation = (event) => {
        this.currentState.rotation = {
            alpha: event.alpha ?? 0,
            beta: event.beta ?? 0,
            gamma: event.gamma ?? 0
        };
    };
    detectActivity() {
        if (this.accelerationHistory.length < 20)
            return 'unknown';
        // Calculate variance in acceleration
        const variance = this.calculateVariance();
        if (variance < 0.5)
            return 'stationary';
        if (variance < 3)
            return 'walking';
        if (variance < 10)
            return 'running';
        return 'driving';
    }
    calculateVariance() {
        const { x, y, z } = this.accelerationHistory.reduce((acc, curr) => ({
            x: acc.x + curr.x,
            y: acc.y + curr.y,
            z: acc.z + curr.z
        }), { x: 0, y: 0, z: 0 });
        const mean = {
            x: x / this.accelerationHistory.length,
            y: y / this.accelerationHistory.length,
            z: z / this.accelerationHistory.length
        };
        let variance = 0;
        for (const sample of this.accelerationHistory) {
            variance += Math.pow(sample.x - mean.x, 2);
            variance += Math.pow(sample.y - mean.y, 2);
            variance += Math.pow(sample.z - mean.z, 2);
        }
        return variance / (this.accelerationHistory.length * 3);
    }
    onUpdate(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1)
                this.callbacks.splice(index, 1);
        };
    }
    getState() {
        return { ...this.currentState };
    }
    stop() {
        window.removeEventListener('devicemotion', this.handleMotion);
        window.removeEventListener('deviceorientation', this.handleOrientation);
    }
}
class ProximitySensor {
    callbacks = [];
    currentState = {
        isNear: false,
        distance: null,
        timestamp: Date.now()
    };
    start() {
        // Proximity sensor API (limited support)
        if ('ProximitySensor' in window) {
            try {
                const sensor = new window.ProximitySensor();
                sensor.addEventListener('reading', () => {
                    this.currentState = {
                        isNear: sensor.near,
                        distance: sensor.distance,
                        timestamp: Date.now()
                    };
                    this.callbacks.forEach(cb => cb(this.currentState));
                });
                sensor.start();
            }
            catch {
                // Not supported
            }
        }
    }
    onUpdate(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1)
                this.callbacks.splice(index, 1);
        };
    }
    getState() {
        return { ...this.currentState };
    }
}
class AudioEnvironmentSensor {
    audioContext = null;
    analyser = null;
    callbacks = [];
    currentEnvironment = {
        noiseLevel: 0,
        category: 'quiet',
        isSpeechDetected: false
    };
    animationFrame = null;
    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            this.monitor();
        }
        catch {
            // Microphone access denied
        }
    }
    monitor() {
        if (!this.analyser)
            return;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        // Calculate RMS
        let sum = 0;
        for (const value of dataArray) {
            sum += value * value;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const db = 20 * Math.log10(rms / 255);
        const noiseLevel = Math.max(0, Math.min(100, (db + 60) * 2));
        let category;
        if (noiseLevel < 25)
            category = 'quiet';
        else if (noiseLevel < 50)
            category = 'moderate';
        else if (noiseLevel < 75)
            category = 'noisy';
        else
            category = 'very-noisy';
        // Simple speech detection (check for voice frequencies)
        const voiceRange = dataArray.slice(4, 20);
        const voiceEnergy = voiceRange.reduce((a, b) => a + b, 0) / voiceRange.length;
        const isSpeechDetected = voiceEnergy > 100;
        this.currentEnvironment = {
            noiseLevel,
            category,
            isSpeechDetected
        };
        this.callbacks.forEach(cb => cb(this.currentEnvironment));
        this.animationFrame = requestAnimationFrame(() => this.monitor());
    }
    onUpdate(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1)
                this.callbacks.splice(index, 1);
        };
    }
    getEnvironment() {
        return { ...this.currentEnvironment };
    }
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.audioContext?.close();
    }
}
class AttentionTracker {
    callbacks = [];
    currentState = {
        isActive: true,
        idleTime: 0,
        lastInteraction: Date.now()
    };
    idleTimeout = null;
    events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    start() {
        this.events.forEach(event => {
            document.addEventListener(event, this.handleActivity, { passive: true });
        });
        document.addEventListener('visibilitychange', this.handleVisibility);
        this.startIdleTimer();
    }
    handleActivity = () => {
        this.currentState = {
            isActive: true,
            idleTime: 0,
            lastInteraction: Date.now()
        };
        this.callbacks.forEach(cb => cb(this.currentState));
        this.startIdleTimer();
    };
    handleVisibility = () => {
        this.currentState.isActive = !document.hidden;
        this.callbacks.forEach(cb => cb(this.currentState));
    };
    startIdleTimer() {
        if (this.idleTimeout) {
            clearInterval(this.idleTimeout);
        }
        this.idleTimeout = window.setInterval(() => {
            this.currentState.idleTime = Date.now() - this.currentState.lastInteraction;
            this.callbacks.forEach(cb => cb(this.currentState));
        }, 1000);
    }
    onUpdate(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1)
                this.callbacks.splice(index, 1);
        };
    }
    getState() {
        return { ...this.currentState };
    }
    stop() {
        this.events.forEach(event => {
            document.removeEventListener(event, this.handleActivity);
        });
        document.removeEventListener('visibilitychange', this.handleVisibility);
        if (this.idleTimeout) {
            clearInterval(this.idleTimeout);
        }
    }
}
// ============================================================================
// Ambient Context Manager
// ============================================================================
export class AmbientContextManager {
    lightSensor;
    motionSensor;
    proximitySensor;
    audioSensor;
    attentionTracker;
    callbacks = [];
    constructor() {
        this.lightSensor = new LightSensor();
        this.motionSensor = new MotionSensor();
        this.proximitySensor = new ProximitySensor();
        this.audioSensor = new AudioEnvironmentSensor();
        this.attentionTracker = new AttentionTracker();
    }
    async start() {
        await this.lightSensor.start();
        this.motionSensor.start();
        this.proximitySensor.start();
        await this.audioSensor.start();
        this.attentionTracker.start();
        // Set up combined updates
        const emitUpdate = () => this.emitContext();
        this.lightSensor.onUpdate(emitUpdate);
        this.motionSensor.onUpdate(emitUpdate);
        this.proximitySensor.onUpdate(emitUpdate);
        this.audioSensor.onUpdate(emitUpdate);
        this.attentionTracker.onUpdate(emitUpdate);
    }
    emitContext() {
        const context = this.getContext();
        this.callbacks.forEach(cb => cb(context));
    }
    getContext() {
        const now = new Date();
        const hour = now.getHours();
        let period;
        if (hour >= 5 && hour < 12)
            period = 'morning';
        else if (hour >= 12 && hour < 17)
            period = 'afternoon';
        else if (hour >= 17 && hour < 21)
            period = 'evening';
        else
            period = 'night';
        return {
            light: this.lightSensor.getConditions(),
            motion: this.motionSensor.getState(),
            proximity: this.proximitySensor.getState(),
            audio: this.audioSensor.getEnvironment(),
            attention: this.attentionTracker.getState(),
            time: {
                hour,
                period,
                isWorkHours: hour >= 9 && hour < 17
            },
            device: this.getDevicePosture()
        };
    }
    getDevicePosture() {
        const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        const motion = this.motionSensor.getState();
        const beta = motion.rotation.beta;
        let posture;
        if (Math.abs(beta) < 15)
            posture = 'flat';
        else if (beta > 45 && beta < 135)
            posture = 'held';
        else if (beta > 100)
            posture = 'tent';
        else
            posture = 'laptop';
        return {
            orientation,
            angle: beta,
            posture
        };
    }
    onUpdate(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1)
                this.callbacks.splice(index, 1);
        };
    }
    stop() {
        this.lightSensor.stop();
        this.motionSensor.stop();
        this.audioSensor.stop();
        this.attentionTracker.stop();
    }
}
// ============================================================================
// Adaptive UI Engine
// ============================================================================
export class AdaptiveUI {
    contextManager;
    rules;
    elements = new Map();
    unsubscribe = null;
    constructor(rules = {}) {
        this.contextManager = new AmbientContextManager();
        this.rules = {
            light: {
                darkThreshold: 50,
                brightThreshold: 500,
                autoTheme: true,
                contrastBoost: true
            },
            motion: {
                reduceMotion: true,
                simplifyUI: false,
                largerTargets: true
            },
            attention: {
                dimAfterMs: 60000,
                dimLevel: 0.7,
                pauseAnimations: true
            },
            time: {
                nightModeStart: 22,
                nightModeEnd: 6,
                reduceBlueLight: true
            },
            ...rules
        };
    }
    async start() {
        await this.contextManager.start();
        this.unsubscribe = this.contextManager.onUpdate((context) => {
            this.adapt(context);
        });
        // Initial adaptation
        this.adapt(this.contextManager.getContext());
    }
    adapt(context) {
        this.adaptToLight(context.light);
        this.adaptToMotion(context.motion);
        this.adaptToAttention(context.attention);
        this.adaptToTime(context.time);
        // Apply custom rules
        if (this.rules.custom) {
            for (const rule of this.rules.custom) {
                if (rule.condition(context)) {
                    this.elements.forEach((_, element) => rule.apply(element));
                }
                else {
                    this.elements.forEach((_, element) => rule.revert(element));
                }
            }
        }
    }
    adaptToLight(light) {
        if (!this.rules.light)
            return;
        const root = document.documentElement;
        if (this.rules.light.autoTheme) {
            if (light.illuminance < this.rules.light.darkThreshold) {
                root.setAttribute('data-theme', 'dark');
                root.style.setProperty('--ambient-brightness', '0.9');
            }
            else if (light.illuminance > this.rules.light.brightThreshold) {
                root.setAttribute('data-theme', 'light');
                root.style.setProperty('--ambient-brightness', '1.1');
            }
            else {
                root.removeAttribute('data-theme');
                root.style.setProperty('--ambient-brightness', '1');
            }
        }
        if (this.rules.light.contrastBoost && light.level === 'very-bright') {
            root.style.setProperty('--ambient-contrast', '1.1');
        }
        else {
            root.style.setProperty('--ambient-contrast', '1');
        }
    }
    adaptToMotion(motion) {
        if (!this.rules.motion)
            return;
        const root = document.documentElement;
        if (this.rules.motion.reduceMotion && motion.isMoving) {
            root.style.setProperty('--ambient-motion', 'reduce');
        }
        else {
            root.style.setProperty('--ambient-motion', 'normal');
        }
        if (this.rules.motion.largerTargets && motion.activity !== 'stationary') {
            root.style.setProperty('--ambient-target-scale', '1.2');
        }
        else {
            root.style.setProperty('--ambient-target-scale', '1');
        }
    }
    adaptToAttention(attention) {
        if (!this.rules.attention)
            return;
        const root = document.documentElement;
        if (attention.idleTime > this.rules.attention.dimAfterMs) {
            root.style.setProperty('--ambient-dim', String(this.rules.attention.dimLevel));
            if (this.rules.attention.pauseAnimations) {
                root.style.setProperty('--ambient-animation', 'paused');
            }
        }
        else {
            root.style.setProperty('--ambient-dim', '1');
            root.style.setProperty('--ambient-animation', 'running');
        }
    }
    adaptToTime(time) {
        if (!this.rules.time)
            return;
        const root = document.documentElement;
        const isNightMode = time.hour >= this.rules.time.nightModeStart ||
            time.hour < this.rules.time.nightModeEnd;
        if (isNightMode && this.rules.time.reduceBlueLight) {
            root.style.setProperty('--ambient-blue-filter', 'sepia(20%) saturate(80%)');
        }
        else {
            root.style.setProperty('--ambient-blue-filter', 'none');
        }
    }
    register(element) {
        if (this.elements.has(element))
            return;
        // Store original styles
        this.elements.set(element, {
            original: [element.style.cssText]
        });
    }
    unregister(element) {
        const saved = this.elements.get(element);
        if (saved) {
            element.style.cssText = saved.original[0];
            this.elements.delete(element);
        }
    }
    getContext() {
        return this.contextManager.getContext();
    }
    stop() {
        this.unsubscribe?.();
        this.contextManager.stop();
        // Reset all styles
        const root = document.documentElement;
        root.removeAttribute('data-theme');
        root.style.removeProperty('--ambient-brightness');
        root.style.removeProperty('--ambient-contrast');
        root.style.removeProperty('--ambient-motion');
        root.style.removeProperty('--ambient-target-scale');
        root.style.removeProperty('--ambient-dim');
        root.style.removeProperty('--ambient-animation');
        root.style.removeProperty('--ambient-blue-filter');
    }
}
// ============================================================================
// CSS Custom Properties for Ambient Adaptation
// ============================================================================
export const AmbientCSS = `
:root {
  --ambient-brightness: 1;
  --ambient-contrast: 1;
  --ambient-motion: normal;
  --ambient-target-scale: 1;
  --ambient-dim: 1;
  --ambient-animation: running;
  --ambient-blue-filter: none;
}

body {
  filter: brightness(var(--ambient-brightness)) contrast(var(--ambient-contrast)) var(--ambient-blue-filter);
  opacity: var(--ambient-dim);
  transition: filter 0.5s ease, opacity 0.5s ease;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --ambient-motion: reduce;
  }
}

[data-ambient-motion="reduce"] *,
:root[style*="--ambient-motion: reduce"] * {
  animation-duration: 0.001ms !important;
  transition-duration: 0.001ms !important;
}

button, a, [role="button"] {
  transform: scale(var(--ambient-target-scale));
  transition: transform 0.2s ease;
}

* {
  animation-play-state: var(--ambient-animation);
}
`;
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
export function useAmbientContext() {
    const managerRef = useRef(null);
    const [context, setContext] = useState(null);
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const manager = new AmbientContextManager();
        managerRef.current = manager;
        manager.start().then(() => {
            setContext(manager.getContext());
            setIsReady(true);
            manager.onUpdate(setContext);
        });
        return () => manager.stop();
    }, []);
    return { context, isReady };
}
export function useAdaptiveUI(rules) {
    const adaptiveRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    useEffect(() => {
        const adaptive = new AdaptiveUI(rules);
        adaptiveRef.current = adaptive;
        adaptive.start().then(() => setIsActive(true));
        return () => adaptive.stop();
    }, []);
    const register = useCallback((element) => {
        adaptiveRef.current?.register(element);
    }, []);
    const unregister = useCallback((element) => {
        adaptiveRef.current?.unregister(element);
    }, []);
    return { isActive, register, unregister, getContext: () => adaptiveRef.current?.getContext() };
}
export function useLightConditions() {
    const [conditions, setConditions] = useState(null);
    useEffect(() => {
        const sensor = new LightSensor();
        sensor.start().then(() => {
            setConditions(sensor.getConditions());
            sensor.onUpdate(setConditions);
        });
        return () => sensor.stop();
    }, []);
    return conditions;
}
export function useMotionState() {
    const [state, setState] = useState(null);
    useEffect(() => {
        const sensor = new MotionSensor();
        sensor.start();
        setState(sensor.getState());
        sensor.onUpdate(setState);
        return () => sensor.stop();
    }, []);
    return state;
}
export function useAttentionState() {
    const [state, setState] = useState(null);
    useEffect(() => {
        const tracker = new AttentionTracker();
        tracker.start();
        setState(tracker.getState());
        tracker.onUpdate(setState);
        return () => tracker.stop();
    }, []);
    return state;
}
export function useAudioEnvironment() {
    const [environment, setEnvironment] = useState(null);
    useEffect(() => {
        const sensor = new AudioEnvironmentSensor();
        sensor.start().then(() => {
            setEnvironment(sensor.getEnvironment());
            sensor.onUpdate(setEnvironment);
        });
        return () => sensor.stop();
    }, []);
    return environment;
}
// Export everything
export default {
    AmbientContextManager,
    AdaptiveUI,
    AmbientCSS,
    useAmbientContext,
    useAdaptiveUI,
    useLightConditions,
    useMotionState,
    useAttentionState,
    useAudioEnvironment
};
//# sourceMappingURL=index.js.map