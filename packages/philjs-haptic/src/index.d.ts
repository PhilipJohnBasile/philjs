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
export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticType = 'impact' | 'selection' | 'notification' | 'warning' | 'error' | 'success';
export interface HapticPattern {
    name: string;
    pattern: number[];
    description?: string;
}
export interface HapticConfig {
    enabled?: boolean;
    respectReducedMotion?: boolean;
    maxDuration?: number;
    defaultIntensity?: HapticIntensity;
}
export interface GamepadHapticEffect {
    duration: number;
    startDelay?: number;
    strongMagnitude?: number;
    weakMagnitude?: number;
}
export interface XRHapticPulse {
    duration: number;
    intensity: number;
}
export declare const HAPTIC_PATTERNS: Record<string, HapticPattern>;
export declare class HapticEngine {
    private config;
    private enabled;
    private customPatterns;
    constructor(config?: HapticConfig);
    static isSupported(): boolean;
    vibrate(pattern: number | number[]): boolean;
    play(patternName: string): boolean;
    impact(intensity?: HapticIntensity): boolean;
    notification(type: HapticType): boolean;
    selection(): boolean;
    stop(): void;
    registerPattern(pattern: HapticPattern): void;
    createPattern(name: string, vibrations: Array<{
        duration: number;
        pause?: number;
    }>): HapticPattern;
    setEnabled(enabled: boolean): void;
    isEnabled(): boolean;
    getPatterns(): HapticPattern[];
}
export declare class GamepadHaptics {
    private gamepadIndex;
    constructor(gamepadIndex?: number);
    private getGamepad;
    playEffect(effect: GamepadHapticEffect): Promise<boolean>;
    pulse(duration?: number, intensity?: number): Promise<boolean>;
    rumble(duration?: number): Promise<boolean>;
    stop(): Promise<void>;
    static isSupported(): boolean;
    setGamepadIndex(index: number): void;
}
export declare class XRHaptics {
    private session;
    private inputSources;
    constructor();
    private setupXRListeners;
    setSession(session: XRSession): void;
    private updateInputSources;
    pulse(handedness: 'left' | 'right' | 'both', duration?: number, intensity?: number): Promise<boolean>;
    private pulseSource;
    pulseLeft(duration?: number, intensity?: number): Promise<boolean>;
    pulseRight(duration?: number, intensity?: number): Promise<boolean>;
    pulseBoth(duration?: number, intensity?: number): Promise<boolean>;
    pattern(handedness: 'left' | 'right' | 'both', pulses: XRHapticPulse[]): Promise<void>;
    getInputSources(): XRInputSource[];
    hasHaptics(handedness: 'left' | 'right'): boolean;
    static isSupported(): boolean;
}
export declare class HapticComposer {
    private steps;
    vibrate(duration: number): this;
    pause(duration: number): this;
    tap(): this;
    pulse(duration?: number): this;
    beat(count: number, duration?: number, gap?: number): this;
    crescendo(steps?: number, maxDuration?: number): this;
    decrescendo(steps?: number, maxDuration?: number): this;
    wave(count?: number): this;
    build(): HapticPattern;
    toArray(): number[];
    play(engine?: HapticEngine): boolean;
    reset(): this;
}
/**
 * Hook for haptic feedback
 */
export declare function useHaptic(config?: HapticConfig): {
    vibrate: (pattern: number | number[]) => boolean;
    play: (patternName: string) => boolean;
    impact: (intensity?: HapticIntensity) => boolean;
    notification: (type: HapticType) => boolean;
    selection: () => boolean;
    stop: () => void;
    supported: boolean;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
};
/**
 * Hook for haptic patterns
 */
export declare function useHapticPattern(): {
    patterns: HapticPattern[];
    register: (pattern: HapticPattern) => void;
    create: (name: string, vibrations: Array<{
        duration: number;
        pause?: number;
    }>) => HapticPattern;
    compose: () => HapticComposer;
};
/**
 * Hook for gamepad haptics
 */
export declare function useGamepadHaptics(gamepadIndex?: number): {
    pulse: (duration?: number, intensity?: number) => Promise<boolean>;
    rumble: (duration?: number) => Promise<boolean>;
    playEffect: (effect: GamepadHapticEffect) => Promise<boolean>;
    stop: () => Promise<void>;
    supported: boolean;
    setGamepadIndex: (index: number) => void;
};
/**
 * Hook for XR haptics
 */
export declare function useXRHaptics(): {
    pulse: (handedness: 'left' | 'right' | 'both', duration?: number, intensity?: number) => Promise<boolean>;
    pulseLeft: (duration?: number, intensity?: number) => Promise<boolean>;
    pulseRight: (duration?: number, intensity?: number) => Promise<boolean>;
    pulseBoth: (duration?: number, intensity?: number) => Promise<boolean>;
    pattern: (handedness: 'left' | 'right' | 'both', pulses: XRHapticPulse[]) => Promise<void>;
    setSession: (session: XRSession) => void;
    supported: boolean;
};
declare const _default: {
    HapticEngine: typeof HapticEngine;
    GamepadHaptics: typeof GamepadHaptics;
    XRHaptics: typeof XRHaptics;
    HapticComposer: typeof HapticComposer;
    HAPTIC_PATTERNS: Record<string, HapticPattern>;
    useHaptic: typeof useHaptic;
    useHapticPattern: typeof useHapticPattern;
    useGamepadHaptics: typeof useGamepadHaptics;
    useXRHaptics: typeof useXRHaptics;
};
export default _default;
//# sourceMappingURL=index.d.ts.map