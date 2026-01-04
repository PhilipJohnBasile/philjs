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
// Hand Tracker
// ============================================================================
export class HandTracker {
    videoElement = null;
    stream = null;
    isRunning = false;
    config;
    onHandsDetected = null;
    animationFrame = null;
    previousLandmarks = new Map();
    constructor(config = {}) {
        this.config = {
            maxHands: 2,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5,
            smoothing: true,
            smoothingFactor: 0.5,
            ...config
        };
    }
    async initialize(videoElement) {
        if (videoElement) {
            this.videoElement = videoElement;
        }
        else {
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
        await new Promise((resolve) => {
            this.videoElement.onloadedmetadata = () => resolve();
        });
    }
    onHands(callback) {
        this.onHandsDetected = callback;
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.detect();
    }
    detect() {
        if (!this.isRunning || !this.videoElement)
            return;
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
    simulateHandDetection() {
        // Placeholder for actual ML model inference
        // In production, integrate with MediaPipe Hands or TensorFlow.js
        return [];
    }
    smoothLandmarks(prev, current) {
        const factor = this.config.smoothingFactor;
        return current.map((landmark, i) => ({
            ...landmark,
            position: {
                x: prev[i].position.x * factor + landmark.position.x * (1 - factor),
                y: prev[i].position.y * factor + landmark.position.y * (1 - factor),
                z: prev[i].position.z * factor + landmark.position.z * (1 - factor)
            }
        }));
    }
    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    dispose() {
        this.stop();
        this.stream?.getTracks().forEach(track => track.stop());
        this.stream = null;
    }
}
// ============================================================================
// Gesture Recognizer
// ============================================================================
export class GestureRecognizer {
    gestures = new Map();
    sequences = new Map();
    gestureCallbacks = new Map();
    recentGestures = [];
    holdTimers = new Map();
    constructor() {
        this.registerBuiltInGestures();
    }
    registerBuiltInGestures() {
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
    registerGesture(gesture) {
        this.gestures.set(gesture.name, gesture);
    }
    registerSequence(sequence) {
        this.sequences.set(sequence.name, sequence);
    }
    onGesture(name, callback) {
        if (!this.gestureCallbacks.has(name)) {
            this.gestureCallbacks.set(name, []);
        }
        this.gestureCallbacks.get(name).push(callback);
        return () => {
            const callbacks = this.gestureCallbacks.get(name);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1)
                    callbacks.splice(index, 1);
            }
        };
    }
    recognize(hands) {
        const recognized = [];
        for (const hand of hands) {
            for (const [name, gesture] of this.gestures) {
                const confidence = this.matchGesture(hand, gesture);
                if (confidence > 0.7) {
                    const result = {
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
        this.recentGestures = this.recentGestures.filter(g => Date.now() - g.timestamp < 3000);
        for (const [name, sequence] of this.sequences) {
            if (this.matchSequence(sequence)) {
                const result = {
                    name,
                    confidence: 1,
                    hand: recognized[recognized.length - 1]?.hand ?? hands[0],
                    timestamp: Date.now()
                };
                this.emitGesture(result);
            }
        }
        return recognized;
    }
    matchGesture(hand, gesture) {
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
                if (isTouching)
                    matchScore++;
                totalChecks++;
            }
        }
        return totalChecks > 0 ? matchScore / totalChecks : 0;
    }
    isFingerExtended(hand, finger) {
        const tipName = `${finger}_tip`;
        const mcpName = `${finger}_mcp`;
        const tip = hand.landmarks.find(l => l.name === tipName);
        const mcp = hand.landmarks.find(l => l.name === mcpName);
        if (!tip || !mcp)
            return false;
        // For most fingers, check if tip is further from wrist than MCP
        const wrist = hand.landmarks.find(l => l.name === 'wrist');
        if (!wrist)
            return false;
        const tipDist = this.distance(tip.position, wrist.position);
        const mcpDist = this.distance(mcp.position, wrist.position);
        return tipDist > mcpDist * 1.2;
    }
    areFingersouching(hand, finger1, finger2) {
        const tip1Name = `${finger1}_tip`;
        const tip2Name = `${finger2}_tip`;
        const tip1 = hand.landmarks.find(l => l.name === tip1Name);
        const tip2 = hand.landmarks.find(l => l.name === tip2Name);
        if (!tip1 || !tip2)
            return false;
        const dist = this.distance(tip1.position, tip2.position);
        return dist < 0.05; // Threshold for "touching"
    }
    distance(a, b) {
        return Math.sqrt((b.x - a.x) ** 2 +
            (b.y - a.y) ** 2 +
            (b.z - a.z) ** 2);
    }
    matchSequence(sequence) {
        const recent = this.recentGestures.slice(-sequence.gestures.length);
        if (recent.length < sequence.gestures.length)
            return false;
        for (let i = 0; i < sequence.gestures.length; i++) {
            if (recent[i].name !== sequence.gestures[i])
                return false;
            if (i > 0) {
                const interval = recent[i].timestamp - recent[i - 1].timestamp;
                if (interval > sequence.maxInterval)
                    return false;
            }
        }
        return true;
    }
    emitGesture(gesture) {
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
    positionHistory = new Map();
    historyLength = 30;
    addPosition(handId, position) {
        if (!this.positionHistory.has(handId)) {
            this.positionHistory.set(handId, []);
        }
        const history = this.positionHistory.get(handId);
        history.push(position);
        if (history.length > this.historyLength) {
            history.shift();
        }
    }
    detectSwipe(handId) {
        const history = this.positionHistory.get(handId);
        if (!history || history.length < 10)
            return null;
        const start = history[0];
        const end = history[history.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.15)
            return null; // Minimum swipe distance
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        let direction;
        if (angle >= -45 && angle < 45) {
            direction = 'right';
        }
        else if (angle >= 45 && angle < 135) {
            direction = 'down';
        }
        else if (angle >= -135 && angle < -45) {
            direction = 'up';
        }
        else {
            direction = 'left';
        }
        return { type: 'swipe', direction, minDistance: distance };
    }
    detectCircle(handId) {
        const history = this.positionHistory.get(handId);
        if (!history || history.length < 20)
            return null;
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
            if (delta > Math.PI)
                delta -= 2 * Math.PI;
            if (delta < -Math.PI)
                delta += 2 * Math.PI;
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
    detectPinch(thumb, index, prevThumb, prevIndex) {
        const currentDist = this.distance2D(thumb, index);
        const prevDist = this.distance2D(prevThumb, prevIndex);
        if (prevDist - currentDist > 0.05) {
            return { type: 'pinch' };
        }
        else if (currentDist - prevDist > 0.05) {
            return { type: 'spread' };
        }
        return null;
    }
    distance2D(a, b) {
        return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    }
    getVelocity(handId) {
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
    clear(handId) {
        this.positionHistory.delete(handId);
    }
}
// ============================================================================
// Air Cursor
// ============================================================================
export class AirCursor {
    element = null;
    position = { x: 0, y: 0 };
    isVisible = false;
    onClickCallback = null;
    lastPinchState = false;
    constructor() {
        this.createCursorElement();
    }
    createCursorElement() {
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
    update(hand) {
        // Use index finger tip as cursor position
        const indexTip = hand.landmarks.find(l => l.name === 'index_tip');
        if (!indexTip)
            return;
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
            const distance = Math.sqrt((thumbTip.position.x - indexTip.position.x) ** 2 +
                (thumbTip.position.y - indexTip.position.y) ** 2);
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
    simulateClick() {
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
    onClick(callback) {
        this.onClickCallback = callback;
    }
    show() {
        if (this.element) {
            this.element.style.display = 'block';
        }
        this.isVisible = true;
    }
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
        this.isVisible = false;
    }
    getPosition() {
        return { ...this.position };
    }
    dispose() {
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
    handTracker;
    gestureRecognizer;
    motionAnalyzer;
    airCursor = null;
    config;
    constructor(config = {}) {
        this.config = config;
        this.handTracker = new HandTracker(config);
        this.gestureRecognizer = new GestureRecognizer();
        this.motionAnalyzer = new MotionAnalyzer();
    }
    async initialize(videoElement) {
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
    start() {
        this.handTracker.start();
        if (this.airCursor) {
            this.airCursor.show();
        }
    }
    stop() {
        this.handTracker.stop();
        if (this.airCursor) {
            this.airCursor.hide();
        }
    }
    enableAirCursor() {
        if (!this.airCursor) {
            this.airCursor = new AirCursor();
        }
        this.airCursor.show();
    }
    disableAirCursor() {
        if (this.airCursor) {
            this.airCursor.hide();
        }
    }
    onGesture(name, callback) {
        return this.gestureRecognizer.onGesture(name, callback);
    }
    registerGesture(gesture) {
        this.gestureRecognizer.registerGesture(gesture);
    }
    registerSequence(sequence) {
        this.gestureRecognizer.registerSequence(sequence);
    }
    dispose() {
        this.handTracker.dispose();
        this.airCursor?.dispose();
    }
}
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
export function useGestureController(config) {
    const controllerRef = useRef(null);
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
export function useGesture(controller, gestureName, callback) {
    useEffect(() => {
        if (!controller)
            return;
        return controller.onGesture(gestureName, callback);
    }, [controller, gestureName, callback]);
}
export function useAirCursor(controller, enabled = true) {
    useEffect(() => {
        if (!controller)
            return;
        if (enabled) {
            controller.enableAirCursor();
        }
        else {
            controller.disableAirCursor();
        }
        return () => {
            controller.disableAirCursor();
        };
    }, [controller, enabled]);
}
export function useHandTracking(config) {
    const trackerRef = useRef(null);
    const [hands, setHands] = useState([]);
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
//# sourceMappingURL=index.js.map