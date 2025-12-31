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
export interface AmbientContext {
    light: LightConditions;
    motion: MotionState;
    proximity: ProximityState;
    audio: AudioEnvironment;
    attention: AttentionState;
    time: TimeContext;
    device: DevicePosture;
}
export interface LightConditions {
    illuminance: number;
    level: 'dark' | 'dim' | 'normal' | 'bright' | 'very-bright';
    isNatural: boolean;
    timestamp: number;
}
export interface MotionState {
    isMoving: boolean;
    acceleration: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        alpha: number;
        beta: number;
        gamma: number;
    };
    activity: 'stationary' | 'walking' | 'running' | 'driving' | 'unknown';
}
export interface ProximityState {
    isNear: boolean;
    distance: number | null;
    timestamp: number;
}
export interface AudioEnvironment {
    noiseLevel: number;
    category: 'quiet' | 'moderate' | 'noisy' | 'very-noisy';
    isSpeechDetected: boolean;
}
export interface AttentionState {
    isActive: boolean;
    idleTime: number;
    lastInteraction: number;
}
export interface TimeContext {
    hour: number;
    period: 'morning' | 'afternoon' | 'evening' | 'night';
    isWorkHours: boolean;
}
export interface DevicePosture {
    orientation: 'portrait' | 'landscape';
    angle: number;
    isFolded?: boolean;
    posture?: 'flat' | 'tent' | 'laptop' | 'held';
}
export interface AdaptationRules {
    light?: LightAdaptation;
    motion?: MotionAdaptation;
    attention?: AttentionAdaptation;
    time?: TimeAdaptation;
    custom?: CustomAdaptation[];
}
export interface LightAdaptation {
    darkThreshold: number;
    brightThreshold: number;
    autoTheme: boolean;
    contrastBoost: boolean;
}
export interface MotionAdaptation {
    reduceMotion: boolean;
    simplifyUI: boolean;
    largerTargets: boolean;
}
export interface AttentionAdaptation {
    dimAfterMs: number;
    dimLevel: number;
    pauseAnimations: boolean;
}
export interface TimeAdaptation {
    nightModeStart: number;
    nightModeEnd: number;
    reduceBlueLight: boolean;
}
export interface CustomAdaptation {
    condition: (context: AmbientContext) => boolean;
    apply: (element: HTMLElement) => void;
    revert: (element: HTMLElement) => void;
}
export type AmbientCallback = (context: AmbientContext) => void;
export declare class AmbientContextManager {
    private lightSensor;
    private motionSensor;
    private proximitySensor;
    private audioSensor;
    private attentionTracker;
    private callbacks;
    constructor();
    start(): Promise<void>;
    private emitContext;
    getContext(): AmbientContext;
    private getDevicePosture;
    onUpdate(callback: AmbientCallback): () => void;
    stop(): void;
}
export declare class AdaptiveUI {
    private contextManager;
    private rules;
    private elements;
    private unsubscribe;
    constructor(rules?: AdaptationRules);
    start(): Promise<void>;
    private adapt;
    private adaptToLight;
    private adaptToMotion;
    private adaptToAttention;
    private adaptToTime;
    register(element: HTMLElement): void;
    unregister(element: HTMLElement): void;
    getContext(): AmbientContext;
    stop(): void;
}
export declare const AmbientCSS = "\n:root {\n  --ambient-brightness: 1;\n  --ambient-contrast: 1;\n  --ambient-motion: normal;\n  --ambient-target-scale: 1;\n  --ambient-dim: 1;\n  --ambient-animation: running;\n  --ambient-blue-filter: none;\n}\n\nbody {\n  filter: brightness(var(--ambient-brightness)) contrast(var(--ambient-contrast)) var(--ambient-blue-filter);\n  opacity: var(--ambient-dim);\n  transition: filter 0.5s ease, opacity 0.5s ease;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  :root {\n    --ambient-motion: reduce;\n  }\n}\n\n[data-ambient-motion=\"reduce\"] *,\n:root[style*=\"--ambient-motion: reduce\"] * {\n  animation-duration: 0.001ms !important;\n  transition-duration: 0.001ms !important;\n}\n\nbutton, a, [role=\"button\"] {\n  transform: scale(var(--ambient-target-scale));\n  transition: transform 0.2s ease;\n}\n\n* {\n  animation-play-state: var(--ambient-animation);\n}\n";
export declare function useAmbientContext(): {
    context: AmbientContext | null;
    isReady: boolean;
};
export declare function useAdaptiveUI(rules?: AdaptationRules): {
    isActive: boolean;
    register: (element: HTMLElement) => void;
    unregister: (element: HTMLElement) => void;
    getContext: () => AmbientContext | undefined;
};
export declare function useLightConditions(): LightConditions | null;
export declare function useMotionState(): MotionState | null;
export declare function useAttentionState(): AttentionState | null;
export declare function useAudioEnvironment(): AudioEnvironment | null;
declare const _default: {
    AmbientContextManager: typeof AmbientContextManager;
    AdaptiveUI: typeof AdaptiveUI;
    AmbientCSS: string;
    useAmbientContext: typeof useAmbientContext;
    useAdaptiveUI: typeof useAdaptiveUI;
    useLightConditions: typeof useLightConditions;
    useMotionState: typeof useMotionState;
    useAttentionState: typeof useAttentionState;
    useAudioEnvironment: typeof useAudioEnvironment;
};
export default _default;
//# sourceMappingURL=index.d.ts.map