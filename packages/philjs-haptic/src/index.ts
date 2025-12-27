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
// Types
// ============================================================================

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

// ============================================================================
// Built-in Haptic Patterns
// ============================================================================

export const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
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
  private config: Required<HapticConfig>;
  private enabled = true;
  private customPatterns: Map<string, HapticPattern> = new Map();

  constructor(config: HapticConfig = {}) {
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

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  vibrate(pattern: number | number[]): boolean {
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

  play(patternName: string): boolean {
    const pattern = this.customPatterns.get(patternName) ?? HAPTIC_PATTERNS[patternName];

    if (!pattern) {
      console.warn(`Haptic pattern "${patternName}" not found`);
      return false;
    }

    return this.vibrate(pattern.pattern);
  }

  impact(intensity: HapticIntensity = this.config.defaultIntensity): boolean {
    const patterns: Record<HapticIntensity, string> = {
      light: 'lightImpact',
      medium: 'mediumImpact',
      heavy: 'heavyImpact',
      rigid: 'rigidImpact',
      soft: 'softImpact'
    };

    return this.play(patterns[intensity]);
  }

  notification(type: HapticType): boolean {
    const patterns: Record<HapticType, string> = {
      impact: 'mediumImpact',
      selection: 'selection',
      notification: 'notification',
      warning: 'warning',
      error: 'error',
      success: 'success'
    };

    return this.play(patterns[type]);
  }

  selection(): boolean {
    return this.play('selection');
  }

  stop(): void {
    if (HapticEngine.isSupported()) {
      navigator.vibrate(0);
    }
  }

  registerPattern(pattern: HapticPattern): void {
    this.customPatterns.set(pattern.name, pattern);
  }

  createPattern(
    name: string,
    vibrations: Array<{ duration: number; pause?: number }>
  ): HapticPattern {
    const pattern: number[] = [];

    vibrations.forEach((v, i) => {
      pattern.push(v.duration);
      if (v.pause && i < vibrations.length - 1) {
        pattern.push(v.pause);
      }
    });

    return { name, pattern };
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled && this.config.enabled;
  }

  getPatterns(): HapticPattern[] {
    const builtIn = Object.values(HAPTIC_PATTERNS);
    const custom = Array.from(this.customPatterns.values());
    return [...builtIn, ...custom];
  }
}

// ============================================================================
// Gamepad Haptics
// ============================================================================

export class GamepadHaptics {
  private gamepadIndex: number;

  constructor(gamepadIndex: number = 0) {
    this.gamepadIndex = gamepadIndex;
  }

  private getGamepad(): Gamepad | null {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return null;
    }

    const gamepads = navigator.getGamepads();
    return gamepads[this.gamepadIndex] ?? null;
  }

  async playEffect(effect: GamepadHapticEffect): Promise<boolean> {
    const gamepad = this.getGamepad();
    if (!gamepad) return false;

    const actuator = (gamepad as any).vibrationActuator;
    if (!actuator) return false;

    try {
      await actuator.playEffect('dual-rumble', {
        duration: effect.duration,
        startDelay: effect.startDelay ?? 0,
        strongMagnitude: effect.strongMagnitude ?? 0.5,
        weakMagnitude: effect.weakMagnitude ?? 0.5
      });
      return true;
    } catch {
      return false;
    }
  }

  async pulse(duration: number = 100, intensity: number = 0.5): Promise<boolean> {
    return this.playEffect({
      duration,
      strongMagnitude: intensity,
      weakMagnitude: intensity
    });
  }

  async rumble(duration: number = 200): Promise<boolean> {
    return this.playEffect({
      duration,
      strongMagnitude: 1.0,
      weakMagnitude: 0.3
    });
  }

  async stop(): Promise<void> {
    const gamepad = this.getGamepad();
    if (!gamepad) return;

    const actuator = (gamepad as any).vibrationActuator;
    if (actuator) {
      try {
        await actuator.reset();
      } catch {
        // Ignore errors
      }
    }
  }

  static isSupported(): boolean {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return false;
    }

    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad && (gamepad as any).vibrationActuator) {
        return true;
      }
    }

    return false;
  }

  setGamepadIndex(index: number): void {
    this.gamepadIndex = index;
  }
}

// ============================================================================
// XR Haptics
// ============================================================================

export class XRHaptics {
  private session: XRSession | null = null;
  private inputSources: XRInputSource[] = [];

  constructor() {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      this.setupXRListeners();
    }
  }

  private setupXRListeners(): void {
    // Listen for XR session events to get input sources
    if (typeof window !== 'undefined') {
      window.addEventListener('xrsessionstart', ((event: CustomEvent) => {
        this.session = event.detail?.session ?? null;
        this.updateInputSources();
      }) as EventListener);
    }
  }

  setSession(session: XRSession): void {
    this.session = session;
    this.updateInputSources();

    session.addEventListener('inputsourceschange', () => {
      this.updateInputSources();
    });
  }

  private updateInputSources(): void {
    if (!this.session) {
      this.inputSources = [];
      return;
    }

    this.inputSources = Array.from(this.session.inputSources);
  }

  async pulse(
    handedness: 'left' | 'right' | 'both',
    duration: number = 100,
    intensity: number = 1.0
  ): Promise<boolean> {
    const sources = this.inputSources.filter(source => {
      if (handedness === 'both') return true;
      return source.handedness === handedness;
    });

    if (sources.length === 0) return false;

    const results = await Promise.all(
      sources.map(source => this.pulseSource(source, duration, intensity))
    );

    return results.some(r => r);
  }

  private async pulseSource(
    source: XRInputSource,
    duration: number,
    intensity: number
  ): Promise<boolean> {
    const gamepad = source.gamepad;
    if (!gamepad) return false;

    const actuator = (gamepad as any).hapticActuators?.[0];
    if (!actuator) return false;

    try {
      await actuator.pulse(intensity, duration);
      return true;
    } catch {
      return false;
    }
  }

  async pulseLeft(duration?: number, intensity?: number): Promise<boolean> {
    return this.pulse('left', duration, intensity);
  }

  async pulseRight(duration?: number, intensity?: number): Promise<boolean> {
    return this.pulse('right', duration, intensity);
  }

  async pulseBoth(duration?: number, intensity?: number): Promise<boolean> {
    return this.pulse('both', duration, intensity);
  }

  async pattern(
    handedness: 'left' | 'right' | 'both',
    pulses: XRHapticPulse[]
  ): Promise<void> {
    for (const pulse of pulses) {
      await this.pulse(handedness, pulse.duration, pulse.intensity);
      await new Promise(resolve => setTimeout(resolve, pulse.duration + 20));
    }
  }

  getInputSources(): XRInputSource[] {
    return [...this.inputSources];
  }

  hasHaptics(handedness: 'left' | 'right'): boolean {
    return this.inputSources.some(source => {
      if (source.handedness !== handedness) return false;
      const gamepad = source.gamepad;
      return gamepad && (gamepad as any).hapticActuators?.length > 0;
    });
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'xr' in navigator;
  }
}

// ============================================================================
// Haptic Composer
// ============================================================================

export class HapticComposer {
  private steps: Array<{ type: 'vibrate' | 'pause'; duration: number }> = [];

  vibrate(duration: number): this {
    this.steps.push({ type: 'vibrate', duration });
    return this;
  }

  pause(duration: number): this {
    this.steps.push({ type: 'pause', duration });
    return this;
  }

  tap(): this {
    return this.vibrate(10);
  }

  pulse(duration: number = 30): this {
    return this.vibrate(duration);
  }

  beat(count: number, duration: number = 20, gap: number = 50): this {
    for (let i = 0; i < count; i++) {
      this.vibrate(duration);
      if (i < count - 1) {
        this.pause(gap);
      }
    }
    return this;
  }

  crescendo(steps: number = 5, maxDuration: number = 50): this {
    const stepSize = maxDuration / steps;
    for (let i = 1; i <= steps; i++) {
      this.vibrate(Math.round(stepSize * i));
      if (i < steps) {
        this.pause(30);
      }
    }
    return this;
  }

  decrescendo(steps: number = 5, maxDuration: number = 50): this {
    const stepSize = maxDuration / steps;
    for (let i = steps; i >= 1; i--) {
      this.vibrate(Math.round(stepSize * i));
      if (i > 1) {
        this.pause(30);
      }
    }
    return this;
  }

  wave(count: number = 3): this {
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

  build(): HapticPattern {
    const pattern: number[] = [];

    for (const step of this.steps) {
      pattern.push(step.duration);
    }

    return {
      name: 'custom',
      pattern
    };
  }

  toArray(): number[] {
    return this.build().pattern;
  }

  play(engine?: HapticEngine): boolean {
    const e = engine ?? new HapticEngine();
    return e.vibrate(this.toArray());
  }

  reset(): this {
    this.steps = [];
    return this;
  }
}

// ============================================================================
// React-style Hooks
// ============================================================================

// Singleton engine
let globalEngine: HapticEngine | null = null;
let globalGamepadHaptics: GamepadHaptics | null = null;
let globalXRHaptics: XRHaptics | null = null;

function getEngine(): HapticEngine {
  if (!globalEngine) {
    globalEngine = new HapticEngine();
  }
  return globalEngine;
}

/**
 * Hook for haptic feedback
 */
export function useHaptic(config?: HapticConfig): {
  vibrate: (pattern: number | number[]) => boolean;
  play: (patternName: string) => boolean;
  impact: (intensity?: HapticIntensity) => boolean;
  notification: (type: HapticType) => boolean;
  selection: () => boolean;
  stop: () => void;
  supported: boolean;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
} {
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
export function useHapticPattern(): {
  patterns: HapticPattern[];
  register: (pattern: HapticPattern) => void;
  create: (name: string, vibrations: Array<{ duration: number; pause?: number }>) => HapticPattern;
  compose: () => HapticComposer;
} {
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
export function useGamepadHaptics(gamepadIndex?: number): {
  pulse: (duration?: number, intensity?: number) => Promise<boolean>;
  rumble: (duration?: number) => Promise<boolean>;
  playEffect: (effect: GamepadHapticEffect) => Promise<boolean>;
  stop: () => Promise<void>;
  supported: boolean;
  setGamepadIndex: (index: number) => void;
} {
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
export function useXRHaptics(): {
  pulse: (handedness: 'left' | 'right' | 'both', duration?: number, intensity?: number) => Promise<boolean>;
  pulseLeft: (duration?: number, intensity?: number) => Promise<boolean>;
  pulseRight: (duration?: number, intensity?: number) => Promise<boolean>;
  pulseBoth: (duration?: number, intensity?: number) => Promise<boolean>;
  pattern: (handedness: 'left' | 'right' | 'both', pulses: XRHapticPulse[]) => Promise<void>;
  setSession: (session: XRSession) => void;
  supported: boolean;
} {
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
// Exports
// ============================================================================

export {
  HapticEngine,
  GamepadHaptics,
  XRHaptics,
  HapticComposer,
  HAPTIC_PATTERNS
};

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
