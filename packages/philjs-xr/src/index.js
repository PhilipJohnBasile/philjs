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
// Vector Math Utilities
// ============================================================================
export const Vec3 = {
    create(x = 0, y = 0, z = 0) {
        return { x, y, z };
    },
    add(a, b) {
        return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    },
    sub(a, b) {
        return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    },
    scale(v, s) {
        return { x: v.x * s, y: v.y * s, z: v.z * s };
    },
    length(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    },
    normalize(v) {
        const len = Vec3.length(v);
        if (len === 0)
            return { x: 0, y: 0, z: 0 };
        return Vec3.scale(v, 1 / len);
    },
    dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    },
    cross(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    },
    distance(a, b) {
        return Vec3.length(Vec3.sub(a, b));
    },
    lerp(a, b, t) {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            z: a.z + (b.z - a.z) * t
        };
    },
    fromArray(arr, offset = 0) {
        if ('x' in arr) {
            return { x: arr.x, y: arr.y, z: arr.z };
        }
        return { x: arr[offset], y: arr[offset + 1], z: arr[offset + 2] };
    },
    toArray(v) {
        return [v.x, v.y, v.z];
    }
};
export const Quat = {
    identity() {
        return { x: 0, y: 0, z: 0, w: 1 };
    },
    fromEuler(x, y, z) {
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
    multiply(a, b) {
        return {
            x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
            y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
            z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
            w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
        };
    },
    slerp(a, b, t) {
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
    fromArray(arr, offset = 0) {
        if ('x' in arr) {
            return { x: arr.x, y: arr.y, z: arr.z, w: arr.w };
        }
        return { x: arr[offset], y: arr[offset + 1], z: arr[offset + 2], w: arr[offset + 3] };
    },
    toArray(q) {
        return [q.x, q.y, q.z, q.w];
    }
};
// ============================================================================
// XR Session Manager
// ============================================================================
export class XRSessionManager {
    config;
    session = null;
    referenceSpace = null;
    controllers = new Map();
    hands = new Map();
    hitTestSource = null;
    anchors = new Map();
    frameCallback = null;
    constructor(config = {}) {
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
    async isSupported(mode) {
        if (typeof navigator === 'undefined' || !('xr' in navigator)) {
            return false;
        }
        return navigator.xr.isSessionSupported(mode ?? this.config.mode);
    }
    async startSession() {
        if (!await this.isSupported()) {
            console.warn('XR not supported');
            return null;
        }
        const features = [...this.config.requiredFeatures];
        const optionalFeatures = [...this.config.optionalFeatures];
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
            const sessionInit = {};
            if (features.length > 0) {
                sessionInit.requiredFeatures = features;
            }
            if (optionalFeatures.length > 0) {
                sessionInit.optionalFeatures = optionalFeatures;
            }
            this.session = await navigator.xr.requestSession(this.config.mode, sessionInit);
            this.referenceSpace = await this.session.requestReferenceSpace(this.config.referenceSpace);
            // Set up input sources
            this.session.addEventListener('inputsourceschange', (event) => {
                this.handleInputSourcesChange(event);
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
        }
        catch (error) {
            console.error('Failed to start XR session:', error);
            return null;
        }
    }
    async endSession() {
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
    setFrameCallback(callback) {
        this.frameCallback = callback;
    }
    handleFrame(time, frame) {
        if (!this.session)
            return;
        // Update controller states
        for (const source of Array.from(this.session.inputSources)) {
            this.updateInputSource(source, frame);
        }
        // Call user callback
        this.frameCallback?.(time, frame);
        // Request next frame
        this.session.requestAnimationFrame((t, f) => this.handleFrame(t, f));
    }
    handleInputSourcesChange(event) {
        for (const source of event.added) {
            const index = Array.from(this.session.inputSources).indexOf(source);
            if (source.hand) {
                this.hands.set(source.handedness, this.createHandState(source.handedness));
            }
            else {
                this.controllers.set(index, this.createControllerState(source.handedness));
            }
        }
        for (const source of event.removed) {
            const index = Array.from(this.session.inputSources).indexOf(source);
            if (source.hand) {
                this.hands.delete(source.handedness);
            }
            else {
                this.controllers.delete(index);
            }
        }
    }
    createControllerState(handedness) {
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
    createHandState(handedness) {
        return {
            connected: true,
            handedness,
            joints: new Map(),
            pinchStrength: 0,
            gripStrength: 0
        };
    }
    updateInputSource(source, frame) {
        if (!this.referenceSpace)
            return;
        if (source.hand) {
            // Update hand tracking
            const handState = this.hands.get(source.handedness);
            if (handState && source.hand) {
                this.updateHandState(handState, source.hand, frame);
            }
        }
        else if (source.gripSpace) {
            // Update controller
            const index = Array.from(this.session.inputSources).indexOf(source);
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
                        ? [...source.gamepad.hapticActuators]
                        : [];
                }
            }
        }
    }
    updateHandState(state, hand, frame) {
        if (!this.referenceSpace)
            return;
        const jointNames = [
            'wrist',
            'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
            'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip',
            'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip',
            'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip',
            'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'
        ];
        for (const jointName of jointNames) {
            const joint = hand.get(jointName);
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
    getSession() {
        return this.session;
    }
    getReferenceSpace() {
        return this.referenceSpace;
    }
    getControllers() {
        return this.controllers;
    }
    getController(index) {
        return this.controllers.get(index);
    }
    getHands() {
        return this.hands;
    }
    getHand(handedness) {
        return this.hands.get(handedness);
    }
    async performHitTest(frame) {
        if (!this.hitTestSource || !this.referenceSpace)
            return [];
        const results = frame.getHitTestResults(this.hitTestSource);
        return results.map(result => {
            const pose = result.getPose(this.referenceSpace);
            return {
                position: pose ? Vec3.fromArray(pose.transform.position) : Vec3.create(),
                rotation: pose ? Quat.fromArray(pose.transform.orientation) : Quat.identity()
            };
        });
    }
    async createAnchor(position, rotation) {
        if (!this.session || !this.referenceSpace)
            return null;
        // WebXR Anchors API (experimental)
        try {
            const id = `anchor-${Date.now()}`;
            const anchor = {
                id,
                position,
                rotation,
                isTracking: true
            };
            this.anchors.set(id, anchor);
            return anchor;
        }
        catch (error) {
            console.error('Failed to create anchor:', error);
            return null;
        }
    }
    getAnchors() {
        return this.anchors;
    }
    triggerHaptic(controllerIndex, intensity = 1, duration = 100) {
        const controller = this.controllers.get(controllerIndex);
        if (controller && controller.hapticActuators.length > 0) {
            controller.hapticActuators[0].pulse(intensity, duration);
        }
    }
}
// Component factory functions (would be used with a 3D renderer)
export function createXRPanel(props) {
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
export function createXRButton(props) {
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
export function createXRSlider(props) {
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
export function createXRText(props) {
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
export function createXRModel(props) {
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
export class GestureRecognizer {
    lastGestures = new Map();
    gestureCallbacks = new Map();
    recognize(handState) {
        const gesture = this.detectGesture(handState);
        if (!gesture)
            return null;
        const lastGesture = this.lastGestures.get(handState.handedness);
        if (gesture !== lastGesture) {
            this.lastGestures.set(handState.handedness, gesture);
            const wrist = handState.joints.get('wrist');
            const event = {
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
    detectGesture(hand) {
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
    calculateConfidence(hand, gesture) {
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
    onGesture(gesture, callback) {
        const callbacks = this.gestureCallbacks.get(gesture) ?? [];
        callbacks.push(callback);
        this.gestureCallbacks.set(gesture, callbacks);
        return () => {
            const cbs = this.gestureCallbacks.get(gesture) ?? [];
            const index = cbs.indexOf(callback);
            if (index > -1)
                cbs.splice(index, 1);
        };
    }
}
// ============================================================================
// React-like Hooks
// ============================================================================
let globalXRManager = null;
let globalGestureRecognizer = null;
export function initXR(config) {
    globalXRManager = new XRSessionManager(config);
    globalGestureRecognizer = new GestureRecognizer();
    return globalXRManager;
}
export function getXRManager() {
    return globalXRManager;
}
export function useXR() {
    const manager = globalXRManager;
    return {
        isSupported: () => manager?.isSupported() ?? Promise.resolve(false),
        startSession: () => manager?.startSession() ?? Promise.resolve(null),
        endSession: () => manager?.endSession() ?? Promise.resolve(),
        session: manager?.getSession() ?? null,
        referenceSpace: manager?.getReferenceSpace() ?? null
    };
}
export function useXRControllers() {
    return globalXRManager?.getControllers() ?? new Map();
}
export function useXRController(index) {
    return globalXRManager?.getController(index) ?? null;
}
export function useXRHands() {
    return globalXRManager?.getHands() ?? new Map();
}
export function useXRHand(handedness) {
    return globalXRManager?.getHand(handedness) ?? null;
}
export function useGesture(gesture, callback) {
    globalGestureRecognizer?.onGesture(gesture, callback);
}
export function useXRFrame(callback) {
    globalXRManager?.setFrameCallback(callback);
}
export function useHitTest() {
    return (frame) => globalXRManager?.performHitTest(frame) ?? Promise.resolve([]);
}
export function useAnchors() {
    return {
        create: (pos, rot) => globalXRManager?.createAnchor(pos, rot) ?? Promise.resolve(null),
        getAll: () => globalXRManager?.getAnchors() ?? new Map()
    };
}
//# sourceMappingURL=index.js.map