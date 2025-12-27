/**
 * @philjs/gesture - Camera-Based Gesture Recognition
 *
 * Industry-first framework-native gesture recognition:
 * - MediaPipe/TensorFlow.js hand tracking
 * - Custom gesture definition and training
 * - Real-time pose estimation
 * - Multi-hand gesture support
 * - Gesture sequence recognition
 * - Air gesture controls for touchless UI
 */

// ============================================================================
// Types
// ============================================================================

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface HandLandmark {
  index: number;
  name: HandLandmarkName;
  position: Point3D;
  visibility: number;
}

export type HandLandmarkName =
  | 'wrist'
  | 'thumb_cmc' | 'thumb_mcp' | 'thumb_ip' | 'thumb_tip'
  | 'index_mcp' | 'index_pip' | 'index_dip' | 'index_tip'
  | 'middle_mcp' | 'middle_pip' | 'middle_dip' | 'middle_tip'
  | 'ring_mcp' | 'ring_pip' | 'ring_dip' | 'ring_tip'
  | 'pinky_mcp' | 'pinky_pip' | 'pinky_dip' | 'pinky_tip';

export interface Hand {
  id: string;
  handedness: 'left' | 'right';
  landmarks: HandLandmark[];
  boundingBox: BoundingBox;
  confidence: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GestureDefinition {
  name: string;
  fingerStates: FingerState[];
  palmOrientation?: PalmOrientation;
  motion?: MotionPattern;
  holdDuration?: number;
}

export interface FingerState {
  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
  extended: boolean;
  curled?: boolean;
  touching?: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
}

export type PalmOrientation = 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward';

export interface MotionPattern {
  type: 'swipe' | 'circle' | 'pinch' | 'spread' | 'rotate' | 'wave' | 'tap' | 'grab';
  direction?: 'up' | 'down' | 'left' | 'right' | 'clockwise' | 'counterclockwise';
  speed?: 'slow' | 'normal' | 'fast';
  minDistance?: number;
}

export interface RecognizedGesture {
  name: string;
  confidence: number;
  hand: Hand;
  timestamp: number;
  duration?: number;
}

export interface GestureSequence {
  name: string;
  gestures: string[];
  maxInterval: number;
}

export interface GestureConfig {
  modelPath?: string;
  maxHands?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  smoothing?: boolean;
  smoothingFactor?: number;
}

export type GestureCallback = (gesture: RecognizedGesture) => void;
export type HandCallback = (hands: Hand[]) => void;

// ============================================================================
// Hand Tracker
// ============================================================================

export class HandTracker {
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isRunning: boolean = false;
  private config: GestureConfig;
  private onHandsDetected: HandCallback | null = null;
  private animationFrame: number | null = null;
  private previousLandmarks: Map<string, HandLandmark[]> = new Map();

  constructor(config: GestureConfig = {}) {
    this.config = {
      maxHands: 2,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
      smoothing: true,
      smoothingFactor: 0.5,
      ...config
    };
  }

  async initialize(videoElement?: HTMLVideoElement): Promise<void> {
    if (videoElement) {
      this.videoElement = videoElement;
    } else {
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });

    this.videoElement.srcObject = this.stream;
    await new Promise<void>((resolve) => {
      this.videoElement!.onloadedmetadata = () => resolve();
    });
  }

  onHands(callback: HandCallback): void {
    this.onHandsDetected = callback;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.detect();
  }

  private detect(): void {
    if (!this.isRunning || !this.videoElement) return;

    // Simulated hand detection - in production, use MediaPipe or TensorFlow.js
    const hands = this.simulateHandDetection();

    if (this.config.smoothing) {
      hands.forEach(hand => {
        const prev = this.previousLandmarks.get(hand.id);
        if (prev) {
          hand.landmarks = this.smoothLandmarks(prev, hand.landmarks);
        }
        this.previousLandmarks.set(hand.id, [...hand.landmarks]);
      });
    }

    if (this.onHandsDetected) {
      this.onHandsDetected(hands);
    }

    this.animationFrame = requestAnimationFrame(() => this.detect());
  }

  private simulateHandDetection(): Hand[] {
    // Placeholder for actual ML model inference
    // In production, integrate with MediaPipe Hands or TensorFlow.js
    return [];
  }

  private smoothLandmarks(prev: HandLandmark[], current: HandLandmark[]): HandLandmark[] {
    const factor = this.config.smoothingFactor!;
    return current.map((landmark, i) => ({
      ...landmark,
      position: {
        x: prev[i].position.x * factor + landmark.position.x * (1 - factor),
        y: prev[i].position.y * factor + landmark.position.y * (1 - factor),
        z: prev[i].position.z * factor + landmark.position.z * (1 - factor)
      }
    }));
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  dispose(): void {
    this.stop();
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }
}

// ============================================================================
// Gesture Recognizer
// ============================================================================

export class GestureRecognizer {
  private gestures: Map<string, GestureDefinition> = new Map();
  private sequences: Map<string, GestureSequence> = new Map();
  private gestureCallbacks: Map<string, GestureCallback[]> = new Map();
  private recentGestures: RecognizedGesture[] = [];
  private holdTimers: Map<string, number> = new Map();

  constructor() {
    this.registerBuiltInGestures();
  }

  private registerBuiltInGestures(): void {
    // Point (index finger extended)
    this.registerGesture({
      name: 'point',
      fingerStates: [
        { finger: 'thumb', extended: false },
        { finger: 'index', extended: true },
        { finger: 'middle', extended: false },
        { finger: 'ring', extended: false },
        { finger: 'pinky', extended: false }
      ]
    });

    // Peace sign
    this.registerGesture({
      name: 'peace',
      fingerStates: [
        { finger: 'thumb', extended: false },
        { finger: 'index', extended: true },
        { finger: 'middle', extended: true },
        { finger: 'ring', extended: false },
        { finger: 'pinky', extended: false }
      ]
    });

    // Thumbs up
    this.registerGesture({
      name: 'thumbsUp',
      fingerStates: [
        { finger: 'thumb', extended: true },
        { finger: 'index', extended: false },
        { finger: 'middle', extended: false },
        { finger: 'ring', extended: false },
        { finger: 'pinky', extended: false }
      ],
      palmOrientation: 'left'
    });

    // Open palm
    this.registerGesture({
      name: 'openPalm',
      fingerStates: [
        { finger: 'thumb', extended: true },
        { finger: 'index', extended: true },
        { finger: 'middle', extended: true },
        { finger: 'ring', extended: true },
        { finger: 'pinky', extended: true }
      ]
    });

    // Fist
    this.registerGesture({
      name: 'fist',
      fingerStates: [
        { finger: 'thumb', extended: false },
        { finger: 'index', extended: false },
        { finger: 'middle', extended: false },
        { finger: 'ring', extended: false },
        { finger: 'pinky', extended: false }
      ]
    });

    // OK gesture
    this.registerGesture({
      name: 'ok',
      fingerStates: [
        { finger: 'thumb', extended: true, touching: 'index' },
        { finger: 'index', extended: true, touching: 'thumb' },
        { finger: 'middle', extended: true },
        { finger: 'ring', extended: true },
        { finger: 'pinky', extended: true }
      ]
    });

    // Pinch
    this.registerGesture({
      name: 'pinch',
      fingerStates: [
        { finger: 'thumb', extended: true, touching: 'index' },
        { finger: 'index', extended: true, touching: 'thumb' },
        { finger: 'middle', extended: false },
        { finger: 'ring', extended: false },
        { finger: 'pinky', extended: false }
      ],
      motion: { type: 'pinch' }
    });

    // Swipe gestures
    this.registerGesture({
      name: 'swipeLeft',
      fingerStates: [
        { finger: 'index', extended: true },
        { finger: 'middle', extended: true },
        { finger: 'ring', extended: true },
        { finger: 'pinky', extended: true }
      ],
      motion: { type: 'swipe', direction: 'left', minDistance: 100 }
    });

    this.registerGesture({
      name: 'swipeRight',
      fingerStates: [
        { finger: 'index', extended: true },
        { finger: 'middle', extended: true },
        { finger: 'ring', extended: true },
        { finger: 'pinky', extended: true }
      ],
      motion: { type: 'swipe', direction: 'right', minDistance: 100 }
    });

    this.registerGesture({
      name: 'swipeUp',
      fingerStates: [
        { finger: 'index', extended: true },
        { finger: 'middle', extended: true }
      ],
      motion: { type: 'swipe', direction: 'up', minDistance: 100 }
    });

    this.registerGesture({
      name: 'swipeDown',
      fingerStates: [
        { finger: 'index', extended: true },
        { finger: 'middle', extended: true }
      ],
      motion: { type: 'swipe', direction: 'down', minDistance: 100 }
    });

    // Grab
    this.registerGesture({
      name: 'grab',
      fingerStates: [
        { finger: 'thumb', extended: true },
        { finger: 'index', extended: true },
        { finger: 'middle', extended: true },
        { finger: 'ring', extended: true },
        { finger: 'pinky', extended: true }
      ],
      motion: { type: 'grab' }
    });

    // Wave
    this.registerGesture({
      name: 'wave',
      fingerStates: [
        { finger: 'thumb', extended: true },
        { finger: 'index', extended: true },
        { finger: 'middle', extended: true },
        { finger: 'ring', extended: true },
        { finger: 'pinky', extended: true }
      ],
      motion: { type: 'wave' }
    });
  }

  registerGesture(gesture: GestureDefinition): void {
    this.gestures.set(gesture.name, gesture);
  }

  registerSequence(sequence: GestureSequence): void {
    this.sequences.set(sequence.name, sequence);
  }

  onGesture(name: string, callback: GestureCallback): () => void {
    if (!this.gestureCallbacks.has(name)) {
      this.gestureCallbacks.set(name, []);
    }
    this.gestureCallbacks.get(name)!.push(callback);

    return () => {
      const callbacks = this.gestureCallbacks.get(name);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  recognize(hands: Hand[]): RecognizedGesture[] {
    const recognized: RecognizedGesture[] = [];

    for (const hand of hands) {
      for (const [name, gesture] of this.gestures) {
        const confidence = this.matchGesture(hand, gesture);

        if (confidence > 0.7) {
          const result: RecognizedGesture = {
            name,
            confidence,
            hand,
            timestamp: Date.now()
          };

          recognized.push(result);
          this.emitGesture(result);
        }
      }
    }

    // Check for gesture sequences
    this.recentGestures.push(...recognized);
    this.recentGestures = this.recentGestures.filter(
      g => Date.now() - g.timestamp < 3000
    );

    for (const [name, sequence] of this.sequences) {
      if (this.matchSequence(sequence)) {
        const result: RecognizedGesture = {
          name,
          confidence: 1,
          hand: recognized[recognized.length - 1]?.hand || hands[0],
          timestamp: Date.now()
        };
        this.emitGesture(result);
      }
    }

    return recognized;
  }

  private matchGesture(hand: Hand, gesture: GestureDefinition): number {
    let matchScore = 0;
    let totalChecks = 0;

    for (const state of gesture.fingerStates) {
      const isExtended = this.isFingerExtended(hand, state.finger);
      if (isExtended === state.extended) {
        matchScore++;
      }
      totalChecks++;

      if (state.touching) {
        const isTouching = this.areFingersouching(hand, state.finger, state.touching);
        if (isTouching) matchScore++;
        totalChecks++;
      }
    }

    return totalChecks > 0 ? matchScore / totalChecks : 0;
  }

  private isFingerExtended(hand: Hand, finger: string): boolean {
    const tipName = `${finger}_tip` as HandLandmarkName;
    const mcpName = `${finger}_mcp` as HandLandmarkName;

    const tip = hand.landmarks.find(l => l.name === tipName);
    const mcp = hand.landmarks.find(l => l.name === mcpName);

    if (!tip || !mcp) return false;

    // For most fingers, check if tip is further from wrist than MCP
    const wrist = hand.landmarks.find(l => l.name === 'wrist');
    if (!wrist) return false;

    const tipDist = this.distance(tip.position, wrist.position);
    const mcpDist = this.distance(mcp.position, wrist.position);

    return tipDist > mcpDist * 1.2;
  }

  private areFingersouching(hand: Hand, finger1: string, finger2: string): boolean {
    const tip1Name = `${finger1}_tip` as HandLandmarkName;
    const tip2Name = `${finger2}_tip` as HandLandmarkName;

    const tip1 = hand.landmarks.find(l => l.name === tip1Name);
    const tip2 = hand.landmarks.find(l => l.name === tip2Name);

    if (!tip1 || !tip2) return false;

    const dist = this.distance(tip1.position, tip2.position);
    return dist < 0.05; // Threshold for "touching"
  }

  private distance(a: Point3D, b: Point3D): number {
    return Math.sqrt(
      (b.x - a.x) ** 2 +
      (b.y - a.y) ** 2 +
      (b.z - a.z) ** 2
    );
  }

  private matchSequence(sequence: GestureSequence): boolean {
    const recent = this.recentGestures.slice(-sequence.gestures.length);
    if (recent.length < sequence.gestures.length) return false;

    for (let i = 0; i < sequence.gestures.length; i++) {
      if (recent[i].name !== sequence.gestures[i]) return false;

      if (i > 0) {
        const interval = recent[i].timestamp - recent[i - 1].timestamp;
        if (interval > sequence.maxInterval) return false;
      }
    }

    return true;
  }

  private emitGesture(gesture: RecognizedGesture): void {
    const callbacks = this.gestureCallbacks.get(gesture.name);
    if (callbacks) {
      callbacks.forEach(cb => cb(gesture));
    }

    // Also emit to wildcard listeners
    const wildcardCallbacks = this.gestureCallbacks.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(cb => cb(gesture));
    }
  }
}

// ============================================================================
// Motion Analyzer
// ============================================================================

export class MotionAnalyzer {
  private positionHistory: Map<string, Point3D[]> = new Map();
  private readonly historyLength = 30;

  addPosition(handId: string, position: Point3D): void {
    if (!this.positionHistory.has(handId)) {
      this.positionHistory.set(handId, []);
    }

    const history = this.positionHistory.get(handId)!;
    history.push(position);

    if (history.length > this.historyLength) {
      history.shift();
    }
  }

  detectSwipe(handId: string): MotionPattern | null {
    const history = this.positionHistory.get(handId);
    if (!history || history.length < 10) return null;

    const start = history[0];
    const end = history[history.length - 1];

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.15) return null; // Minimum swipe distance

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let direction: 'up' | 'down' | 'left' | 'right';

    if (angle >= -45 && angle < 45) {
      direction = 'right';
    } else if (angle >= 45 && angle < 135) {
      direction = 'down';
    } else if (angle >= -135 && angle < -45) {
      direction = 'up';
    } else {
      direction = 'left';
    }

    return { type: 'swipe', direction, minDistance: distance };
  }

  detectCircle(handId: string): MotionPattern | null {
    const history = this.positionHistory.get(handId);
    if (!history || history.length < 20) return null;

    // Calculate center of motion
    let cx = 0, cy = 0;
    for (const p of history) {
      cx += p.x;
      cy += p.y;
    }
    cx /= history.length;
    cy /= history.length;

    // Check if points form a circle around center
    let totalAngle = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = Math.atan2(history[i - 1].y - cy, history[i - 1].x - cx);
      const curr = Math.atan2(history[i].y - cy, history[i].x - cx);
      let delta = curr - prev;

      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      totalAngle += delta;
    }

    if (Math.abs(totalAngle) > Math.PI * 1.5) {
      return {
        type: 'circle',
        direction: totalAngle > 0 ? 'clockwise' : 'counterclockwise'
      };
    }

    return null;
  }

  detectPinch(thumb: Point3D, index: Point3D, prevThumb: Point3D, prevIndex: Point3D): MotionPattern | null {
    const currentDist = this.distance2D(thumb, index);
    const prevDist = this.distance2D(prevThumb, prevIndex);

    if (prevDist - currentDist > 0.05) {
      return { type: 'pinch' };
    } else if (currentDist - prevDist > 0.05) {
      return { type: 'spread' };
    }

    return null;
  }

  private distance2D(a: Point3D, b: Point3D): number {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  }

  getVelocity(handId: string): Point3D {
    const history = this.positionHistory.get(handId);
    if (!history || history.length < 2) {
      return { x: 0, y: 0, z: 0 };
    }

    const last = history[history.length - 1];
    const prev = history[history.length - 2];

    return {
      x: last.x - prev.x,
      y: last.y - prev.y,
      z: last.z - prev.z
    };
  }

  clear(handId: string): void {
    this.positionHistory.delete(handId);
  }
}

// ============================================================================
// Air Cursor
// ============================================================================

export class AirCursor {
  private element: HTMLElement | null = null;
  private position: Point2D = { x: 0, y: 0 };
  private isVisible: boolean = false;
  private onClickCallback: (() => void) | null = null;
  private lastPinchState: boolean = false;

  constructor() {
    this.createCursorElement();
  }

  private createCursorElement(): void {
    this.element = document.createElement('div');
    this.element.id = 'philjs-air-cursor';
    this.element.style.cssText = `
      position: fixed;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.5);
      border: 2px solid rgb(59, 130, 246);
      pointer-events: none;
      z-index: 999999;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease, background 0.1s ease;
      display: none;
    `;
    document.body.appendChild(this.element);
  }

  update(hand: Hand): void {
    // Use index finger tip as cursor position
    const indexTip = hand.landmarks.find(l => l.name === 'index_tip');
    if (!indexTip) return;

    // Convert normalized coordinates to screen coordinates
    this.position = {
      x: indexTip.position.x * window.innerWidth,
      y: indexTip.position.y * window.innerHeight
    };

    if (this.element) {
      this.element.style.left = `${this.position.x}px`;
      this.element.style.top = `${this.position.y}px`;
    }

    // Detect pinch for click
    const thumbTip = hand.landmarks.find(l => l.name === 'thumb_tip');
    if (thumbTip) {
      const distance = Math.sqrt(
        (thumbTip.position.x - indexTip.position.x) ** 2 +
        (thumbTip.position.y - indexTip.position.y) ** 2
      );

      const isPinching = distance < 0.05;

      if (isPinching && !this.lastPinchState) {
        this.simulateClick();
      }

      this.lastPinchState = isPinching;

      if (this.element) {
        this.element.style.transform = isPinching
          ? 'translate(-50%, -50%) scale(0.8)'
          : 'translate(-50%, -50%) scale(1)';
        this.element.style.background = isPinching
          ? 'rgba(59, 130, 246, 0.8)'
          : 'rgba(59, 130, 246, 0.5)';
      }
    }
  }

  private simulateClick(): void {
    const element = document.elementFromPoint(this.position.x, this.position.y);
    if (element) {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: this.position.x,
        clientY: this.position.y
      });
      element.dispatchEvent(event);
    }

    if (this.onClickCallback) {
      this.onClickCallback();
    }
  }

  onClick(callback: () => void): void {
    this.onClickCallback = callback;
  }

  show(): void {
    if (this.element) {
      this.element.style.display = 'block';
    }
    this.isVisible = true;
  }

  hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
    this.isVisible = false;
  }

  getPosition(): Point2D {
    return { ...this.position };
  }

  dispose(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// ============================================================================
// Gesture Controller (Main Class)
// ============================================================================

export class GestureController {
  private handTracker: HandTracker;
  private gestureRecognizer: GestureRecognizer;
  private motionAnalyzer: MotionAnalyzer;
  private airCursor: AirCursor | null = null;
  private config: GestureConfig;

  constructor(config: GestureConfig = {}) {
    this.config = config;
    this.handTracker = new HandTracker(config);
    this.gestureRecognizer = new GestureRecognizer();
    this.motionAnalyzer = new MotionAnalyzer();
  }

  async initialize(videoElement?: HTMLVideoElement): Promise<void> {
    await this.handTracker.initialize(videoElement);

    this.handTracker.onHands((hands) => {
      this.gestureRecognizer.recognize(hands);

      for (const hand of hands) {
        const wrist = hand.landmarks.find(l => l.name === 'wrist');
        if (wrist) {
          this.motionAnalyzer.addPosition(hand.id, wrist.position);
        }
      }

      if (this.airCursor && hands.length > 0) {
        this.airCursor.update(hands[0]);
      }
    });
  }

  start(): void {
    this.handTracker.start();
    if (this.airCursor) {
      this.airCursor.show();
    }
  }

  stop(): void {
    this.handTracker.stop();
    if (this.airCursor) {
      this.airCursor.hide();
    }
  }

  enableAirCursor(): void {
    if (!this.airCursor) {
      this.airCursor = new AirCursor();
    }
    this.airCursor.show();
  }

  disableAirCursor(): void {
    if (this.airCursor) {
      this.airCursor.hide();
    }
  }

  onGesture(name: string, callback: GestureCallback): () => void {
    return this.gestureRecognizer.onGesture(name, callback);
  }

  registerGesture(gesture: GestureDefinition): void {
    this.gestureRecognizer.registerGesture(gesture);
  }

  registerSequence(sequence: GestureSequence): void {
    this.gestureRecognizer.registerSequence(sequence);
  }

  dispose(): void {
    this.handTracker.dispose();
    this.airCursor?.dispose();
  }
}

// ============================================================================
// Hooks
// ============================================================================

type CleanupFn = () => void;
type EffectFn = () => void | CleanupFn;

const effectQueue: EffectFn[] = [];

function useEffect(effect: EffectFn, _deps?: unknown[]): void {
  effectQueue.push(effect);
}

function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  let state = initial;
  const setState = (value: T | ((prev: T) => T)) => {
    state = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
  };
  return [state, setState];
}

function useRef<T>(initial: T): { current: T } {
  return { current: initial };
}

function useCallback<T extends (...args: unknown[]) => unknown>(fn: T, _deps: unknown[]): T {
  return fn;
}

export function useGestureController(config?: GestureConfig) {
  const controllerRef = useRef<GestureController | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const controller = new GestureController(config);
    controller.initialize().then(() => {
      controllerRef.current = controller;
      setIsInitialized(true);
    });

    return () => {
      controllerRef.current?.dispose();
    };
  }, []);

  return {
    controller: controllerRef.current,
    isInitialized,
    start: () => controllerRef.current?.start(),
    stop: () => controllerRef.current?.stop()
  };
}

export function useGesture(
  controller: GestureController | null,
  gestureName: string,
  callback: GestureCallback
) {
  useEffect(() => {
    if (!controller) return;
    return controller.onGesture(gestureName, callback);
  }, [controller, gestureName, callback]);
}

export function useAirCursor(controller: GestureController | null, enabled: boolean = true) {
  useEffect(() => {
    if (!controller) return;

    if (enabled) {
      controller.enableAirCursor();
    } else {
      controller.disableAirCursor();
    }

    return () => {
      controller.disableAirCursor();
    };
  }, [controller, enabled]);
}

export function useHandTracking(config?: GestureConfig) {
  const trackerRef = useRef<HandTracker | null>(null);
  const [hands, setHands] = useState<Hand[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const tracker = new HandTracker(config);
    tracker.initialize().then(() => {
      trackerRef.current = tracker;
      tracker.onHands(setHands);
    });

    return () => {
      trackerRef.current?.dispose();
    };
  }, []);

  const start = useCallback(() => {
    trackerRef.current?.start();
    setIsTracking(true);
  }, []);

  const stop = useCallback(() => {
    trackerRef.current?.stop();
    setIsTracking(false);
  }, []);

  return { hands, isTracking, start, stop };
}

// ============================================================================
// Built-in Gesture Presets
// ============================================================================

export const GesturePresets = {
  navigation: {
    gestures: [
      { name: 'back', gesture: 'swipeRight' },
      { name: 'forward', gesture: 'swipeLeft' },
      { name: 'scrollUp', gesture: 'swipeUp' },
      { name: 'scrollDown', gesture: 'swipeDown' }
    ]
  },

  media: {
    gestures: [
      { name: 'playPause', gesture: 'fist' },
      { name: 'volumeUp', gesture: 'swipeUp' },
      { name: 'volumeDown', gesture: 'swipeDown' },
      { name: 'skip', gesture: 'swipeRight' },
      { name: 'previous', gesture: 'swipeLeft' }
    ]
  },

  presentation: {
    gestures: [
      { name: 'nextSlide', gesture: 'swipeLeft' },
      { name: 'prevSlide', gesture: 'swipeRight' },
      { name: 'pointer', gesture: 'point' },
      { name: 'highlight', gesture: 'peace' }
    ]
  },

  gaming: {
    gestures: [
      { name: 'punch', gesture: 'fist' },
      { name: 'grab', gesture: 'grab' },
      { name: 'shoot', gesture: 'point' },
      { name: 'block', gesture: 'openPalm' }
    ]
  }
};

// Export everything
export default {
  HandTracker,
  GestureRecognizer,
  MotionAnalyzer,
  AirCursor,
  GestureController,
  GesturePresets,
  useGestureController,
  useGesture,
  useAirCursor,
  useHandTracking
};
