/**
 * @philjs/xr - WebXR Components for VR/AR/MR Experiences
 *
 * Build immersive experiences with:
 * - VR/AR/MR headset support
 * - Hand tracking and gestures
 * - Spatial UI components
 * - 3D reactive primitives
 * - XR-optimized rendering
 * - Cross-platform XR compatibility
 *
 * NO OTHER FRAMEWORK HAS THIS.
 */

// ============================================================================
// WebXR Type Declarations
// ============================================================================
// Note: Most WebXR types come from @types/webxr.
// We only extend/augment types that are not fully covered there.

// Reference XRSessionMode and XRReferenceSpaceType from DOM types
type XRSessionModeType = 'inline' | 'immersive-vr' | 'immersive-ar';
type XRReferenceSpaceTypeType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';

// XRHandJoint type alias for joint names
type XRHandJointName =
  | 'wrist'
  | 'thumb-metacarpal' | 'thumb-phalanx-proximal' | 'thumb-phalanx-distal' | 'thumb-tip'
  | 'index-finger-metacarpal' | 'index-finger-phalanx-proximal' | 'index-finger-phalanx-intermediate' | 'index-finger-phalanx-distal' | 'index-finger-tip'
  | 'middle-finger-metacarpal' | 'middle-finger-phalanx-proximal' | 'middle-finger-phalanx-intermediate' | 'middle-finger-phalanx-distal' | 'middle-finger-tip'
  | 'ring-finger-metacarpal' | 'ring-finger-phalanx-proximal' | 'ring-finger-phalanx-intermediate' | 'ring-finger-phalanx-distal' | 'ring-finger-tip'
  | 'pinky-finger-metacarpal' | 'pinky-finger-phalanx-proximal' | 'pinky-finger-phalanx-intermediate' | 'pinky-finger-phalanx-distal' | 'pinky-finger-tip';

// ============================================================================
// Types
// ============================================================================

export type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';
export type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';

export interface XRConfig {
  /** Preferred session mode */
  mode?: XRSessionMode;
  /** Reference space type */
  referenceSpace?: XRReferenceSpaceType;
  /** Required features */
  requiredFeatures?: string[];
  /** Optional features */
  optionalFeatures?: string[];
  /** Enable hand tracking */
  handTracking?: boolean;
  /** Enable hit testing (AR) */
  hitTest?: boolean;
  /** Enable anchors (AR) */
  anchors?: boolean;
  /** Frame rate target */
  frameRate?: number;
}

export interface XRSessionState {
  isSupported: boolean;
  isActive: boolean;
  mode: XRSessionMode | null;
  session: XRSession | null;
  referenceSpace: XRReferenceSpace | null;
}

export interface XRControllerState {
  connected: boolean;
  handedness: 'left' | 'right' | 'none';
  position: Vector3;
  rotation: Quaternion;
  buttons: XRButtonState[];
  axes: number[];
  hapticActuators: GamepadHapticActuator[];
}

export interface XRButtonState {
  pressed: boolean;
  touched: boolean;
  value: number;
}

export interface XRHandState {
  connected: boolean;
  handedness: 'left' | 'right';
  joints: Map<XRHandJoint, XRJointState>;
  pinchStrength: number;
  gripStrength: number;
}

export interface XRJointState {
  position: Vector3;
  rotation: Quaternion;
  radius: number;
}

export type XRHandJoint =
  | 'wrist'
  | 'thumb-metacarpal' | 'thumb-phalanx-proximal' | 'thumb-phalanx-distal' | 'thumb-tip'
  | 'index-finger-metacarpal' | 'index-finger-phalanx-proximal' | 'index-finger-phalanx-intermediate' | 'index-finger-phalanx-distal' | 'index-finger-tip'
  | 'middle-finger-metacarpal' | 'middle-finger-phalanx-proximal' | 'middle-finger-phalanx-intermediate' | 'middle-finger-phalanx-distal' | 'middle-finger-tip'
  | 'ring-finger-metacarpal' | 'ring-finger-phalanx-proximal' | 'ring-finger-phalanx-intermediate' | 'ring-finger-phalanx-distal' | 'ring-finger-tip'
  | 'pinky-finger-metacarpal' | 'pinky-finger-phalanx-proximal' | 'pinky-finger-phalanx-intermediate' | 'pinky-finger-phalanx-distal' | 'pinky-finger-tip';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface XRHitTestResultData {
  position: Vector3;
  rotation: Quaternion;
  plane?: {
    orientation: 'horizontal' | 'vertical';
    polygon: Vector3[];
  };
}

export interface XRAnchor {
  id: string;
  position: Vector3;
  rotation: Quaternion;
  isTracking: boolean;
}

export interface SpatialUIProps {
  position: Vector3;
  rotation?: Quaternion;
  scale?: Vector3;
  billboard?: boolean;
  followGaze?: boolean;
  interactionDistance?: number;
}

// ============================================================================
// Vector Math Utilities
// ============================================================================

export const Vec3 = {
  create(x = 0, y = 0, z = 0): Vector3 {
    return { x, y, z };
  },

  add(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  },

  sub(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  },

  scale(v: Vector3, s: number): Vector3 {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  },

  length(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  },

  normalize(v: Vector3): Vector3 {
    const len = Vec3.length(v);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return Vec3.scale(v, 1 / len);
  },

  dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  },

  cross(a: Vector3, b: Vector3): Vector3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  },

  distance(a: Vector3, b: Vector3): number {
    return Vec3.length(Vec3.sub(a, b));
  },

  lerp(a: Vector3, b: Vector3, t: number): Vector3 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t
    };
  },

  fromArray(arr: Float32Array | number[] | DOMPointReadOnly, offset = 0): Vector3 {
    if ('x' in arr) {
      return { x: arr.x, y: arr.y, z: arr.z };
    }
    return { x: arr[offset]!, y: arr[offset + 1]!, z: arr[offset + 2]! };
  },

  toArray(v: Vector3): number[] {
    return [v.x, v.y, v.z];
  }
};

export const Quat = {
  identity(): Quaternion {
    return { x: 0, y: 0, z: 0, w: 1 };
  },

  fromEuler(x: number, y: number, z: number): Quaternion {
    const c1 = Math.cos(x / 2), s1 = Math.sin(x / 2);
    const c2 = Math.cos(y / 2), s2 = Math.sin(y / 2);
    const c3 = Math.cos(z / 2), s3 = Math.sin(z / 2);

    return {
      x: s1 * c2 * c3 + c1 * s2 * s3,
      y: c1 * s2 * c3 - s1 * c2 * s3,
      z: c1 * c2 * s3 + s1 * s2 * c3,
      w: c1 * c2 * c3 - s1 * s2 * s3
    };
  },

  multiply(a: Quaternion, b: Quaternion): Quaternion {
    return {
      x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
    };
  },

  slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    let cosHalfTheta = a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z;

    if (cosHalfTheta < 0) {
      b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
      cosHalfTheta = -cosHalfTheta;
    }

    if (cosHalfTheta >= 1.0) {
      return { ...a };
    }

    const halfTheta = Math.acos(cosHalfTheta);
    const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    if (Math.abs(sinHalfTheta) < 0.001) {
      return {
        x: a.x * 0.5 + b.x * 0.5,
        y: a.y * 0.5 + b.y * 0.5,
        z: a.z * 0.5 + b.z * 0.5,
        w: a.w * 0.5 + b.w * 0.5
      };
    }

    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    return {
      x: a.x * ratioA + b.x * ratioB,
      y: a.y * ratioA + b.y * ratioB,
      z: a.z * ratioA + b.z * ratioB,
      w: a.w * ratioA + b.w * ratioB
    };
  },

  fromArray(arr: Float32Array | number[] | DOMPointReadOnly, offset = 0): Quaternion {
    if ('x' in arr) {
      return { x: arr.x, y: arr.y, z: arr.z, w: arr.w };
    }
    return { x: arr[offset]!, y: arr[offset + 1]!, z: arr[offset + 2]!, w: arr[offset + 3]! };
  },

  toArray(q: Quaternion): number[] {
    return [q.x, q.y, q.z, q.w];
  }
};

// ============================================================================
// XR Session Manager
// ============================================================================

export class XRSessionManager {
  private config: Required<XRConfig>;
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private controllers: Map<number, XRControllerState> = new Map();
  private hands: Map<string, XRHandState> = new Map();
  private hitTestSource: XRHitTestSource | null = null;
  private anchors: Map<string, XRAnchor> = new Map();
  private frameCallback: ((time: number, frame: XRFrame) => void) | null = null;

  constructor(config: XRConfig = {}) {
    this.config = {
      mode: config.mode ?? 'immersive-vr',
      referenceSpace: config.referenceSpace ?? 'local-floor',
      requiredFeatures: config.requiredFeatures ?? [],
      optionalFeatures: config.optionalFeatures ?? [],
      handTracking: config.handTracking ?? true,
      hitTest: config.hitTest ?? false,
      anchors: config.anchors ?? false,
      frameRate: config.frameRate ?? 72
    };
  }

  async isSupported(mode?: XRSessionMode): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('xr' in navigator)) {
      return false;
    }
    return navigator.xr!.isSessionSupported(mode ?? this.config.mode);
  }

  async startSession(): Promise<XRSession | null> {
    if (!await this.isSupported()) {
      console.warn('XR not supported');
      return null;
    }

    const features: string[] = [...this.config.requiredFeatures];
    const optionalFeatures: string[] = [...this.config.optionalFeatures];

    if (this.config.handTracking) {
      optionalFeatures.push('hand-tracking');
    }
    if (this.config.hitTest) {
      optionalFeatures.push('hit-test');
    }
    if (this.config.anchors) {
      optionalFeatures.push('anchors');
    }

    try {
      const sessionInit: XRSessionInit = {};
      if (features.length > 0) {
        sessionInit.requiredFeatures = features;
      }
      if (optionalFeatures.length > 0) {
        sessionInit.optionalFeatures = optionalFeatures;
      }

      this.session = await navigator.xr!.requestSession(this.config.mode, sessionInit);

      this.referenceSpace = await this.session.requestReferenceSpace(
        this.config.referenceSpace
      );

      // Set up input sources
      this.session.addEventListener('inputsourceschange', (event) => {
        this.handleInputSourcesChange(event as XRInputSourcesChangeEvent);
      });

      // Set up hit test if enabled
      if (this.config.hitTest && this.session.requestHitTestSource) {
        const viewerSpace = await this.session.requestReferenceSpace('viewer');
        this.hitTestSource = await this.session.requestHitTestSource({
          space: viewerSpace
        }) ?? null;
      }

      // Start render loop
      this.session.requestAnimationFrame((time, frame) => this.handleFrame(time, frame));

      return this.session;
    } catch (error) {
      console.error('Failed to start XR session:', error);
      return null;
    }
  }

  async endSession(): Promise<void> {
    if (this.session) {
      await this.session.end();
      this.session = null;
      this.referenceSpace = null;
      this.hitTestSource = null;
      this.controllers.clear();
      this.hands.clear();
      this.anchors.clear();
    }
  }

  setFrameCallback(callback: (time: number, frame: XRFrame) => void): void {
    this.frameCallback = callback;
  }

  private handleFrame(time: number, frame: XRFrame): void {
    if (!this.session) return;

    // Update controller states
    for (const source of Array.from(this.session.inputSources)) {
      this.updateInputSource(source, frame);
    }

    // Call user callback
    this.frameCallback?.(time, frame);

    // Request next frame
    this.session.requestAnimationFrame((t, f) => this.handleFrame(t, f));
  }

  private handleInputSourcesChange(event: XRInputSourcesChangeEvent): void {
    for (const source of event.added) {
      const index = Array.from(this.session!.inputSources).indexOf(source);
      if (source.hand) {
        this.hands.set(source.handedness, this.createHandState(source.handedness as 'left' | 'right'));
      } else {
        this.controllers.set(index, this.createControllerState(source.handedness as 'left' | 'right' | 'none'));
      }
    }

    for (const source of event.removed) {
      const index = Array.from(this.session!.inputSources).indexOf(source);
      if (source.hand) {
        this.hands.delete(source.handedness);
      } else {
        this.controllers.delete(index);
      }
    }
  }

  private createControllerState(handedness: 'left' | 'right' | 'none'): XRControllerState {
    return {
      connected: true,
      handedness,
      position: Vec3.create(),
      rotation: Quat.identity(),
      buttons: [],
      axes: [],
      hapticActuators: []
    };
  }

  private createHandState(handedness: 'left' | 'right'): XRHandState {
    return {
      connected: true,
      handedness,
      joints: new Map(),
      pinchStrength: 0,
      gripStrength: 0
    };
  }

  private updateInputSource(source: XRInputSource, frame: XRFrame): void {
    if (!this.referenceSpace) return;

    if (source.hand) {
      // Update hand tracking
      const handState = this.hands.get(source.handedness);
      if (handState && source.hand) {
        this.updateHandState(handState, source.hand, frame);
      }
    } else if (source.gripSpace) {
      // Update controller
      const index = Array.from(this.session!.inputSources).indexOf(source);
      const controllerState = this.controllers.get(index);
      if (controllerState) {
        const pose = frame.getPose(source.gripSpace, this.referenceSpace);
        if (pose) {
          controllerState.position = Vec3.fromArray(pose.transform.position);
          controllerState.rotation = Quat.fromArray(pose.transform.orientation);
        }

        if (source.gamepad) {
          controllerState.buttons = source.gamepad.buttons.map(b => ({
            pressed: b.pressed,
            touched: b.touched,
            value: b.value
          }));
          controllerState.axes = [...source.gamepad.axes];
          controllerState.hapticActuators = source.gamepad.hapticActuators
            ? [...(source.gamepad.hapticActuators as unknown as GamepadHapticActuator[])]
            : [];
        }
      }
    }
  }

  private updateHandState(state: XRHandState, hand: XRHand, frame: XRFrame): void {
    if (!this.referenceSpace) return;

    const jointNames: XRHandJoint[] = [
      'wrist',
      'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
      'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip',
      'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip',
      'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip',
      'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'
    ];

    for (const jointName of jointNames) {
      const joint = hand.get(jointName as XRHandJointName);
      if (joint) {
        const pose = frame.getJointPose?.(joint, this.referenceSpace);
        if (pose) {
          state.joints.set(jointName, {
            position: Vec3.fromArray(pose.transform.position),
            rotation: Quat.fromArray(pose.transform.orientation),
            radius: pose.radius ?? 0.01
          });
        }
      }
    }

    // Calculate pinch and grip strength
    const thumbTip = state.joints.get('thumb-tip');
    const indexTip = state.joints.get('index-finger-tip');
    if (thumbTip && indexTip) {
      const pinchDistance = Vec3.distance(thumbTip.position, indexTip.position);
      state.pinchStrength = Math.max(0, 1 - pinchDistance / 0.05);
    }
  }

  // Public API

  getSession(): XRSession | null {
    return this.session;
  }

  getReferenceSpace(): XRReferenceSpace | null {
    return this.referenceSpace;
  }

  getControllers(): Map<number, XRControllerState> {
    return this.controllers;
  }

  getController(index: number): XRControllerState | undefined {
    return this.controllers.get(index);
  }

  getHands(): Map<string, XRHandState> {
    return this.hands;
  }

  getHand(handedness: 'left' | 'right'): XRHandState | undefined {
    return this.hands.get(handedness);
  }

  async performHitTest(frame: XRFrame): Promise<XRHitTestResultData[]> {
    if (!this.hitTestSource || !this.referenceSpace) return [];

    const results = frame.getHitTestResults(this.hitTestSource);
    return results.map(result => {
      const pose = result.getPose(this.referenceSpace!);
      return {
        position: pose ? Vec3.fromArray(pose.transform.position) : Vec3.create(),
        rotation: pose ? Quat.fromArray(pose.transform.orientation) : Quat.identity()
      };
    });
  }

  async createAnchor(position: Vector3, rotation: Quaternion): Promise<XRAnchor | null> {
    if (!this.session || !this.referenceSpace) return null;

    // WebXR Anchors API (experimental)
    try {
      const id = `anchor-${Date.now()}`;
      const anchor: XRAnchor = {
        id,
        position,
        rotation,
        isTracking: true
      };
      this.anchors.set(id, anchor);
      return anchor;
    } catch (error) {
      console.error('Failed to create anchor:', error);
      return null;
    }
  }

  getAnchors(): Map<string, XRAnchor> {
    return this.anchors;
  }

  triggerHaptic(
    controllerIndex: number,
    intensity: number = 1,
    duration: number = 100
  ): void {
    const controller = this.controllers.get(controllerIndex);
    if (controller && controller.hapticActuators.length > 0) {
      controller.hapticActuators[0]!.pulse(intensity, duration);
    }
  }
}

// ============================================================================
// Spatial UI Components
// ============================================================================

export interface XRPanelProps extends SpatialUIProps {
  width: number;
  height: number;
  backgroundColor?: string;
  borderRadius?: number;
  children?: unknown;
}

export interface XRButtonProps extends SpatialUIProps {
  label: string;
  onClick?: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  hapticFeedback?: boolean;
}

export interface XRSliderProps extends SpatialUIProps {
  min: number;
  max: number;
  value: number;
  onChange?: (value: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export interface XRTextProps extends SpatialUIProps {
  text: string;
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface XRModelProps extends SpatialUIProps {
  src: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  animations?: string[];
  currentAnimation?: string;
}

// Component factory functions (would be used with a 3D renderer)
export function createXRPanel(props: XRPanelProps): object {
  return {
    type: 'xr-panel',
    props: {
      position: props.position,
      rotation: props.rotation ?? Quat.identity(),
      scale: props.scale ?? Vec3.create(1, 1, 1),
      width: props.width,
      height: props.height,
      backgroundColor: props.backgroundColor ?? '#ffffff',
      borderRadius: props.borderRadius ?? 0,
      billboard: props.billboard ?? false,
      followGaze: props.followGaze ?? false,
      interactionDistance: props.interactionDistance ?? 2
    }
  };
}

export function createXRButton(props: XRButtonProps): object {
  return {
    type: 'xr-button',
    props: {
      position: props.position,
      rotation: props.rotation ?? Quat.identity(),
      scale: props.scale ?? Vec3.create(1, 1, 1),
      label: props.label,
      onClick: props.onClick,
      onHover: props.onHover,
      onHoverEnd: props.onHoverEnd,
      hapticFeedback: props.hapticFeedback ?? true
    }
  };
}

export function createXRSlider(props: XRSliderProps): object {
  return {
    type: 'xr-slider',
    props: {
      position: props.position,
      rotation: props.rotation ?? Quat.identity(),
      min: props.min,
      max: props.max,
      value: props.value,
      onChange: props.onChange,
      orientation: props.orientation ?? 'horizontal'
    }
  };
}

export function createXRText(props: XRTextProps): object {
  return {
    type: 'xr-text',
    props: {
      position: props.position,
      rotation: props.rotation ?? Quat.identity(),
      text: props.text,
      fontSize: props.fontSize ?? 0.05,
      color: props.color ?? '#000000',
      align: props.align ?? 'center',
      billboard: props.billboard ?? false
    }
  };
}

export function createXRModel(props: XRModelProps): object {
  return {
    type: 'xr-model',
    props: {
      position: props.position,
      rotation: props.rotation ?? Quat.identity(),
      scale: props.scale ?? Vec3.create(1, 1, 1),
      src: props.src,
      onLoad: props.onLoad,
      onError: props.onError,
      animations: props.animations ?? [],
      currentAnimation: props.currentAnimation
    }
  };
}

// ============================================================================
// Gesture Recognition
// ============================================================================

export type GestureType = 'pinch' | 'grab' | 'point' | 'thumbs-up' | 'peace' | 'fist' | 'open-palm';

export interface GestureEvent {
  gesture: GestureType;
  hand: 'left' | 'right';
  confidence: number;
  position: Vector3;
}

export class GestureRecognizer {
  private lastGestures: Map<string, GestureType> = new Map();
  private gestureCallbacks: Map<GestureType, ((event: GestureEvent) => void)[]> = new Map();

  recognize(handState: XRHandState): GestureEvent | null {
    const gesture = this.detectGesture(handState);
    if (!gesture) return null;

    const lastGesture = this.lastGestures.get(handState.handedness);
    if (gesture !== lastGesture) {
      this.lastGestures.set(handState.handedness, gesture);

      const wrist = handState.joints.get('wrist');
      const event: GestureEvent = {
        gesture,
        hand: handState.handedness,
        confidence: this.calculateConfidence(handState, gesture),
        position: wrist?.position ?? Vec3.create()
      };

      // Trigger callbacks
      const callbacks = this.gestureCallbacks.get(gesture) ?? [];
      for (const cb of callbacks) {
        cb(event);
      }

      return event;
    }

    return null;
  }

  private detectGesture(hand: XRHandState): GestureType | null {
    if (hand.pinchStrength > 0.8) {
      return 'pinch';
    }

    if (hand.gripStrength > 0.8) {
      return 'grab';
    }

    // Check for pointing (index extended, others curled)
    const indexTip = hand.joints.get('index-finger-tip');
    const indexBase = hand.joints.get('index-finger-metacarpal');
    const middleTip = hand.joints.get('middle-finger-tip');
    const middleBase = hand.joints.get('middle-finger-metacarpal');

    if (indexTip && indexBase && middleTip && middleBase) {
      const indexExtended = Vec3.distance(indexTip.position, indexBase.position) > 0.08;
      const middleCurled = Vec3.distance(middleTip.position, middleBase.position) < 0.05;

      if (indexExtended && middleCurled) {
        return 'point';
      }
    }

    // Check for thumbs up
    const thumbTip = hand.joints.get('thumb-tip');
    const thumbBase = hand.joints.get('thumb-metacarpal');
    if (thumbTip && thumbBase) {
      const thumbUp = thumbTip.position.y > thumbBase.position.y + 0.05;
      if (thumbUp && hand.gripStrength > 0.5) {
        return 'thumbs-up';
      }
    }

    // Check for peace sign
    const ringTip = hand.joints.get('ring-finger-tip');
    const ringBase = hand.joints.get('ring-finger-metacarpal');
    if (indexTip && indexBase && middleTip && middleBase && ringTip && ringBase) {
      const indexExt = Vec3.distance(indexTip.position, indexBase.position) > 0.08;
      const middleExt = Vec3.distance(middleTip.position, middleBase.position) > 0.08;
      const ringCurled = Vec3.distance(ringTip.position, ringBase.position) < 0.05;

      if (indexExt && middleExt && ringCurled) {
        return 'peace';
      }
    }

    // Check for open palm
    if (hand.gripStrength < 0.2 && hand.pinchStrength < 0.2) {
      return 'open-palm';
    }

    // Check for fist
    if (hand.gripStrength > 0.9) {
      return 'fist';
    }

    return null;
  }

  private calculateConfidence(hand: XRHandState, gesture: GestureType): number {
    switch (gesture) {
      case 'pinch':
        return hand.pinchStrength;
      case 'grab':
      case 'fist':
        return hand.gripStrength;
      default:
        return 0.8;
    }
  }

  onGesture(gesture: GestureType, callback: (event: GestureEvent) => void): () => void {
    const callbacks = this.gestureCallbacks.get(gesture) ?? [];
    callbacks.push(callback);
    this.gestureCallbacks.set(gesture, callbacks);

    return () => {
      const cbs = this.gestureCallbacks.get(gesture) ?? [];
      const index = cbs.indexOf(callback);
      if (index > -1) cbs.splice(index, 1);
    };
  }
}

// ============================================================================
// React-like Hooks
// ============================================================================

let globalXRManager: XRSessionManager | null = null;
let globalGestureRecognizer: GestureRecognizer | null = null;

export function initXR(config?: XRConfig): XRSessionManager {
  globalXRManager = new XRSessionManager(config);
  globalGestureRecognizer = new GestureRecognizer();
  return globalXRManager;
}

export function getXRManager(): XRSessionManager | null {
  return globalXRManager;
}

export function useXR(): {
  isSupported: () => Promise<boolean>;
  startSession: () => Promise<XRSession | null>;
  endSession: () => Promise<void>;
  session: XRSession | null;
  referenceSpace: XRReferenceSpace | null;
} {
  const manager = globalXRManager;

  return {
    isSupported: () => manager?.isSupported() ?? Promise.resolve(false),
    startSession: () => manager?.startSession() ?? Promise.resolve(null),
    endSession: () => manager?.endSession() ?? Promise.resolve(),
    session: manager?.getSession() ?? null,
    referenceSpace: manager?.getReferenceSpace() ?? null
  };
}

export function useXRControllers(): Map<number, XRControllerState> {
  return globalXRManager?.getControllers() ?? new Map();
}

export function useXRController(index: number): XRControllerState | null {
  return globalXRManager?.getController(index) ?? null;
}

export function useXRHands(): Map<string, XRHandState> {
  return globalXRManager?.getHands() ?? new Map();
}

export function useXRHand(handedness: 'left' | 'right'): XRHandState | null {
  return globalXRManager?.getHand(handedness) ?? null;
}

export function useGesture(
  gesture: GestureType,
  callback: (event: GestureEvent) => void
): void {
  globalGestureRecognizer?.onGesture(gesture, callback);
}

export function useXRFrame(callback: (time: number, frame: XRFrame) => void): void {
  globalXRManager?.setFrameCallback(callback);
}

export function useHitTest(): (frame: XRFrame) => Promise<XRHitTestResultData[]> {
  return (frame) => globalXRManager?.performHitTest(frame) ?? Promise.resolve([]);
}

export function useAnchors(): {
  create: (position: Vector3, rotation: Quaternion) => Promise<XRAnchor | null>;
  getAll: () => Map<string, XRAnchor>;
} {
  return {
    create: (pos, rot) => globalXRManager?.createAnchor(pos, rot) ?? Promise.resolve(null),
    getAll: () => globalXRManager?.getAnchors() ?? new Map()
  };
}
