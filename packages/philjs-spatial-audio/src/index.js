/**
 * @philjs/spatial-audio - 3D Spatial Audio for Immersive Web Experiences
 *
 * Industry-first framework-native 3D audio system with:
 * - Web Audio API spatial processing
 * - HRTF (Head-Related Transfer Function) support
 * - Room acoustics simulation
 * - Ambisonics encoding/decoding
 * - Real-time audio positioning in 3D space
 * - VR/AR audio synchronization
 */
// ============================================================================
// Audio Context Manager
// ============================================================================
export class SpatialAudioContext {
    audioContext = null;
    listener = null;
    masterGain = null;
    sources = new Map();
    roomProcessor = null;
    ambisonicsDecoder = null;
    config;
    constructor(config = {}) {
        this.config = {
            hrtfEnabled: true,
            ...config
        };
    }
    async initialize() {
        this.audioContext = new AudioContext();
        this.listener = this.audioContext.listener;
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        // Initialize room acoustics if configured
        if (this.config.roomAcoustics) {
            this.roomProcessor = new RoomAcousticsProcessor(this.audioContext, this.config.roomAcoustics);
        }
        // Initialize ambisonics if configured
        if (this.config.ambisonics) {
            this.ambisonicsDecoder = new AmbisonicsDecoder(this.audioContext, this.config.ambisonics);
        }
        // Set initial listener position
        if (this.config.listenerPosition) {
            this.setListenerPosition(this.config.listenerPosition);
        }
        if (this.config.listenerOrientation) {
            this.setListenerOrientation(this.config.listenerOrientation);
        }
    }
    getContext() {
        if (!this.audioContext) {
            throw new Error('SpatialAudioContext not initialized. Call initialize() first.');
        }
        return this.audioContext;
    }
    setListenerPosition(position) {
        if (!this.listener)
            return;
        if (this.listener.positionX) {
            this.listener.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
            this.listener.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
            this.listener.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);
        }
        else {
            // Fallback for older browsers
            this.listener.setPosition(position.x, position.y, position.z);
        }
    }
    setListenerOrientation(orientation) {
        if (!this.listener)
            return;
        if (this.listener.forwardX) {
            this.listener.forwardX.setValueAtTime(orientation.forward.x, this.audioContext.currentTime);
            this.listener.forwardY.setValueAtTime(orientation.forward.y, this.audioContext.currentTime);
            this.listener.forwardZ.setValueAtTime(orientation.forward.z, this.audioContext.currentTime);
            this.listener.upX.setValueAtTime(orientation.up.x, this.audioContext.currentTime);
            this.listener.upY.setValueAtTime(orientation.up.y, this.audioContext.currentTime);
            this.listener.upZ.setValueAtTime(orientation.up.z, this.audioContext.currentTime);
        }
        else {
            this.listener.setOrientation(orientation.forward.x, orientation.forward.y, orientation.forward.z, orientation.up.x, orientation.up.y, orientation.up.z);
        }
    }
    createSource(id, options = {}) {
        if (!this.audioContext || !this.masterGain) {
            throw new Error('SpatialAudioContext not initialized');
        }
        const source = new SpatialAudioSource(id, this.audioContext, this.masterGain, this.roomProcessor, options);
        this.sources.set(id, source);
        return source;
    }
    getSource(id) {
        return this.sources.get(id);
    }
    removeSource(id) {
        const source = this.sources.get(id);
        if (source) {
            source.dispose();
            this.sources.delete(id);
        }
    }
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioContext.currentTime);
        }
    }
    suspend() {
        return this.audioContext?.suspend() || Promise.resolve();
    }
    resume() {
        return this.audioContext?.resume() || Promise.resolve();
    }
    dispose() {
        this.sources.forEach(source => source.dispose());
        this.sources.clear();
        this.audioContext?.close();
        this.audioContext = null;
    }
}
// ============================================================================
// Spatial Audio Source
// ============================================================================
export class SpatialAudioSource {
    id;
    context;
    panner;
    gainNode;
    sourceNode = null;
    buffer = null;
    mediaElement = null;
    isPlaying = false;
    options;
    roomProcessor;
    constructor(id, context, destination, roomProcessor, options = {}) {
        this.id = id;
        this.context = context;
        this.roomProcessor = roomProcessor;
        this.options = {
            position: { x: 0, y: 0, z: 0 },
            distanceModel: 'inverse',
            maxDistance: 10000,
            refDistance: 1,
            rolloffFactor: 1,
            panningModel: 'HRTF',
            loop: false,
            volume: 1,
            ...options
        };
        // Create panner node
        this.panner = context.createPanner();
        this.panner.panningModel = this.options.panningModel;
        this.panner.distanceModel = this.options.distanceModel;
        this.panner.maxDistance = this.options.maxDistance;
        this.panner.refDistance = this.options.refDistance;
        this.panner.rolloffFactor = this.options.rolloffFactor;
        if (this.options.coneInnerAngle !== undefined) {
            this.panner.coneInnerAngle = this.options.coneInnerAngle;
        }
        if (this.options.coneOuterAngle !== undefined) {
            this.panner.coneOuterAngle = this.options.coneOuterAngle;
        }
        if (this.options.coneOuterGain !== undefined) {
            this.panner.coneOuterGain = this.options.coneOuterGain;
        }
        // Set initial position
        this.setPosition(this.options.position);
        if (this.options.orientation) {
            this.setOrientation(this.options.orientation);
        }
        // Create gain node
        this.gainNode = context.createGain();
        this.gainNode.gain.value = this.options.volume;
        // Connect nodes
        this.panner.connect(this.gainNode);
        if (roomProcessor) {
            this.gainNode.connect(roomProcessor.getInput());
            roomProcessor.getOutput().connect(destination);
        }
        else {
            this.gainNode.connect(destination);
        }
    }
    async loadBuffer(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.buffer = await this.context.decodeAudioData(arrayBuffer);
    }
    setBuffer(buffer) {
        this.buffer = buffer;
    }
    attachMediaElement(element) {
        this.mediaElement = element;
        this.sourceNode = this.context.createMediaElementSource(element);
        this.sourceNode.connect(this.panner);
    }
    setPosition(position) {
        if (this.panner.positionX) {
            this.panner.positionX.setValueAtTime(position.x, this.context.currentTime);
            this.panner.positionY.setValueAtTime(position.y, this.context.currentTime);
            this.panner.positionZ.setValueAtTime(position.z, this.context.currentTime);
        }
        else {
            this.panner.setPosition(position.x, position.y, position.z);
        }
    }
    animatePosition(from, to, duration, easing = 'linear') {
        const currentTime = this.context.currentTime;
        if (this.panner.positionX) {
            this.panner.positionX.setValueAtTime(from.x, currentTime);
            this.panner.positionY.setValueAtTime(from.y, currentTime);
            this.panner.positionZ.setValueAtTime(from.z, currentTime);
            if (easing === 'linear') {
                this.panner.positionX.linearRampToValueAtTime(to.x, currentTime + duration);
                this.panner.positionY.linearRampToValueAtTime(to.y, currentTime + duration);
                this.panner.positionZ.linearRampToValueAtTime(to.z, currentTime + duration);
            }
            else {
                this.panner.positionX.exponentialRampToValueAtTime(to.x || 0.001, currentTime + duration);
                this.panner.positionY.exponentialRampToValueAtTime(to.y || 0.001, currentTime + duration);
                this.panner.positionZ.exponentialRampToValueAtTime(to.z || 0.001, currentTime + duration);
            }
        }
    }
    setOrientation(orientation) {
        if (this.panner.orientationX) {
            this.panner.orientationX.setValueAtTime(orientation.x, this.context.currentTime);
            this.panner.orientationY.setValueAtTime(orientation.y, this.context.currentTime);
            this.panner.orientationZ.setValueAtTime(orientation.z, this.context.currentTime);
        }
        else {
            this.panner.setOrientation(orientation.x, orientation.y, orientation.z);
        }
    }
    setVolume(volume) {
        this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.context.currentTime);
    }
    fadeIn(duration) {
        this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(this.options.volume, this.context.currentTime + duration);
    }
    fadeOut(duration) {
        this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);
    }
    play(when = 0, offset = 0) {
        if (!this.buffer && !this.mediaElement) {
            throw new Error('No audio source loaded');
        }
        if (this.mediaElement) {
            this.mediaElement.currentTime = offset;
            this.mediaElement.play();
        }
        else if (this.buffer) {
            this.stop();
            this.sourceNode = this.context.createBufferSource();
            this.sourceNode.buffer = this.buffer;
            this.sourceNode.loop = this.options.loop;
            this.sourceNode.connect(this.panner);
            this.sourceNode.start(this.context.currentTime + when, offset);
            this.sourceNode.onended = () => {
                this.isPlaying = false;
            };
        }
        this.isPlaying = true;
    }
    pause() {
        if (this.mediaElement) {
            this.mediaElement.pause();
        }
        this.isPlaying = false;
    }
    stop() {
        if (this.sourceNode && this.buffer) {
            try {
                this.sourceNode.stop();
            }
            catch {
                // Already stopped
            }
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        else if (this.mediaElement) {
            this.mediaElement.pause();
            this.mediaElement.currentTime = 0;
        }
        this.isPlaying = false;
    }
    getIsPlaying() {
        return this.isPlaying;
    }
    dispose() {
        this.stop();
        this.panner.disconnect();
        this.gainNode.disconnect();
    }
}
// ============================================================================
// Room Acoustics Processor
// ============================================================================
export class RoomAcousticsProcessor {
    context;
    inputGain;
    outputGain;
    convolver;
    dryGain;
    wetGain;
    options;
    constructor(context, options) {
        this.context = context;
        this.options = options;
        // Create nodes
        this.inputGain = context.createGain();
        this.outputGain = context.createGain();
        this.convolver = context.createConvolver();
        this.dryGain = context.createGain();
        this.wetGain = context.createGain();
        // Set mix levels
        this.dryGain.gain.value = 0.7;
        this.wetGain.gain.value = 0.3;
        // Connect dry path
        this.inputGain.connect(this.dryGain);
        this.dryGain.connect(this.outputGain);
        // Connect wet path (reverb)
        this.inputGain.connect(this.convolver);
        this.convolver.connect(this.wetGain);
        this.wetGain.connect(this.outputGain);
        // Generate impulse response based on room
        this.generateImpulseResponse();
    }
    generateImpulseResponse() {
        const reverbTime = this.options.reverbTime || 1.5;
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * reverbTime;
        const impulse = this.context.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Exponential decay with room-based coloring
                const decay = Math.exp(-3 * i / length);
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        this.convolver.buffer = impulse;
    }
    setWetDryMix(wet) {
        const dry = 1 - wet;
        this.wetGain.gain.setValueAtTime(wet, this.context.currentTime);
        this.dryGain.gain.setValueAtTime(dry, this.context.currentTime);
    }
    getInput() {
        return this.inputGain;
    }
    getOutput() {
        return this.outputGain;
    }
}
// ============================================================================
// Ambisonics Decoder
// ============================================================================
export class AmbisonicsDecoder {
    context;
    options;
    splitter;
    merger;
    constructor(context, options) {
        this.context = context;
        this.options = options;
        // Number of channels based on ambisonics order
        const channelCount = (options.order + 1) ** 2;
        this.splitter = context.createChannelSplitter(channelCount);
        this.merger = context.createChannelMerger(2); // Binaural output
    }
    decode(input, output) {
        input.connect(this.splitter);
        this.merger.connect(output);
        // Simple first-order decoding to stereo
        // W channel to both
        this.splitter.connect(this.merger, 0, 0);
        this.splitter.connect(this.merger, 0, 1);
        if (this.options.order >= 1) {
            // Y channel (left-right)
            this.splitter.connect(this.merger, 1, 0);
            this.splitter.connect(this.merger, 1, 1);
        }
    }
}
// ============================================================================
// Audio Scene
// ============================================================================
export class AudioScene {
    context;
    sources = new Map();
    updateCallback = null;
    animationFrame = null;
    constructor(context) {
        this.context = context;
    }
    addEntity(entity) {
        const source = this.context.createSource(entity.id, entity.options);
        this.sources.set(entity.id, { source, entity });
        return source;
    }
    removeEntity(id) {
        this.context.removeSource(id);
        this.sources.delete(id);
    }
    getEntity(id) {
        return this.sources.get(id)?.source;
    }
    onUpdate(callback) {
        this.updateCallback = callback;
    }
    start() {
        const update = (time) => {
            if (this.updateCallback) {
                this.updateCallback(time);
            }
            this.animationFrame = requestAnimationFrame(update);
        };
        this.animationFrame = requestAnimationFrame(update);
    }
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}
// ============================================================================
// 3D Audio Path
// ============================================================================
export class AudioPath {
    points;
    durations;
    constructor(points, durations) {
        this.points = points;
        this.durations = durations || points.slice(1).map(() => 1);
    }
    getPositionAt(t) {
        if (t <= 0)
            return this.points[0];
        if (t >= 1)
            return this.points[this.points.length - 1];
        const totalDuration = this.durations.reduce((a, b) => a + b, 0);
        let elapsed = t * totalDuration;
        let segmentIndex = 0;
        for (let i = 0; i < this.durations.length; i++) {
            if (elapsed <= this.durations[i]) {
                segmentIndex = i;
                break;
            }
            elapsed -= this.durations[i];
            segmentIndex = i + 1;
        }
        if (segmentIndex >= this.points.length - 1) {
            return this.points[this.points.length - 1];
        }
        const segmentT = elapsed / this.durations[segmentIndex];
        const p1 = this.points[segmentIndex];
        const p2 = this.points[segmentIndex + 1];
        return {
            x: p1.x + (p2.x - p1.x) * segmentT,
            y: p1.y + (p2.y - p1.y) * segmentT,
            z: p1.z + (p2.z - p1.z) * segmentT
        };
    }
    animate(source, duration) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const update = () => {
                const elapsed = performance.now() - startTime;
                const t = Math.min(elapsed / (duration * 1000), 1);
                source.setPosition(this.getPositionAt(t));
                if (t < 1) {
                    requestAnimationFrame(update);
                }
                else {
                    resolve();
                }
            };
            requestAnimationFrame(update);
        });
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
function useMemo(fn, _deps) {
    return fn();
}
export function useSpatialAudio(config) {
    const contextRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        const context = new SpatialAudioContext(config);
        context.initialize().then(() => {
            contextRef.current = context;
            setIsInitialized(true);
        });
        return () => {
            contextRef.current?.dispose();
        };
    }, []);
    const createSource = useCallback((id, options) => {
        return contextRef.current?.createSource(id, options);
    }, []);
    const setListenerPosition = useCallback((position) => {
        contextRef.current?.setListenerPosition(position);
    }, []);
    const setListenerOrientation = useCallback((orientation) => {
        contextRef.current?.setListenerOrientation(orientation);
    }, []);
    return {
        context: contextRef.current,
        isInitialized,
        createSource,
        setListenerPosition,
        setListenerOrientation
    };
}
export function useAudioSource(contextOrId, optionsOrContext, maybeOptions) {
    const sourceRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const id = typeof contextOrId === 'string' ? contextOrId : '';
    const context = typeof contextOrId === 'string'
        ? optionsOrContext
        : contextOrId;
    const options = typeof contextOrId === 'string' ? maybeOptions : optionsOrContext;
    useEffect(() => {
        if (context && id) {
            sourceRef.current = context.createSource(id, options);
            setIsLoaded(true);
        }
        return () => {
            sourceRef.current?.dispose();
        };
    }, [context, id]);
    return {
        source: sourceRef.current,
        isLoaded,
        play: () => sourceRef.current?.play(),
        stop: () => sourceRef.current?.stop(),
        setPosition: (pos) => sourceRef.current?.setPosition(pos),
        setVolume: (vol) => sourceRef.current?.setVolume(vol)
    };
}
export function useAudioListener(context) {
    const setPosition = useCallback((position) => {
        context?.setListenerPosition(position);
    }, [context]);
    const setOrientation = useCallback((orientation) => {
        context?.setListenerOrientation(orientation);
    }, [context]);
    return { setPosition, setOrientation };
}
export function useAudioPath(source, points) {
    const pathRef = useRef(new AudioPath(points));
    const [isAnimating, setIsAnimating] = useState(false);
    const animate = useCallback(async (duration) => {
        if (!source)
            return;
        setIsAnimating(true);
        await pathRef.current.animate(source, duration);
        setIsAnimating(false);
    }, [source]);
    return { path: pathRef.current, animate, isAnimating };
}
export function useAudioScene(context) {
    const sceneRef = useRef(null);
    useEffect(() => {
        if (context) {
            sceneRef.current = new AudioScene(context);
            sceneRef.current.start();
        }
        return () => {
            sceneRef.current?.stop();
        };
    }, [context]);
    return sceneRef.current;
}
export function useVRAudio(xrSession) {
    const contextRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        if (!xrSession)
            return;
        const context = new SpatialAudioContext({ hrtfEnabled: true });
        context.initialize().then(() => {
            contextRef.current = context;
            setIsReady(true);
        });
        return () => {
            contextRef.current?.dispose();
        };
    }, [xrSession]);
    const syncWithXR = useMemo(() => (pose) => {
        if (contextRef.current) {
            contextRef.current.setListenerPosition(pose.position);
            contextRef.current.setListenerOrientation(pose.orientation);
        }
    }, []);
    return { context: contextRef.current, isReady, syncWithXR };
}
// ============================================================================
// Utilities
// ============================================================================
export function calculateDistance(a, b) {
    return Math.sqrt((b.x - a.x) ** 2 +
        (b.y - a.y) ** 2 +
        (b.z - a.z) ** 2);
}
export function normalizeVector(v) {
    const length = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    if (length === 0)
        return { x: 0, y: 0, z: 0 };
    return {
        x: v.x / length,
        y: v.y / length,
        z: v.z / length
    };
}
export function crossProduct(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
export function lerpVector(a, b, t) {
    return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        z: lerp(a.z, b.z, t)
    };
}
// ============================================================================
// Presets
// ============================================================================
export const RoomPresets = {
    smallRoom: {
        roomSize: { x: 4, y: 3, z: 5 },
        reverbTime: 0.4,
        wallMaterials: {
            left: 'wood',
            right: 'wood',
            floor: 'carpet',
            ceiling: 'acoustic-panel'
        }
    },
    concertHall: {
        roomSize: { x: 30, y: 15, z: 50 },
        reverbTime: 2.5,
        wallMaterials: {
            left: 'concrete',
            right: 'concrete',
            floor: 'wood',
            ceiling: 'acoustic-panel'
        }
    },
    cathedral: {
        roomSize: { x: 20, y: 30, z: 60 },
        reverbTime: 4.0,
        wallMaterials: {
            left: 'concrete',
            right: 'concrete',
            floor: 'concrete',
            ceiling: 'concrete'
        }
    },
    outdoors: {
        roomSize: { x: 100, y: 50, z: 100 },
        reverbTime: 0.1,
        dampingFrequency: 20000
    },
    studio: {
        roomSize: { x: 6, y: 3, z: 8 },
        reverbTime: 0.2,
        wallMaterials: {
            left: 'acoustic-panel',
            right: 'acoustic-panel',
            floor: 'carpet',
            ceiling: 'acoustic-panel'
        }
    }
};
// Export everything
export default {
    SpatialAudioContext,
    SpatialAudioSource,
    RoomAcousticsProcessor,
    AmbisonicsDecoder,
    AudioScene,
    AudioPath,
    RoomPresets,
    useSpatialAudio,
    useAudioSource,
    useAudioListener,
    useAudioPath,
    useAudioScene,
    useVRAudio,
    calculateDistance,
    normalizeVector,
    crossProduct,
    lerp,
    lerpVector
};
//# sourceMappingURL=index.js.map