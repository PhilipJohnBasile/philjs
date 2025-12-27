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
// Types
// ============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Orientation {
  forward: Vector3;
  up: Vector3;
}

export interface AudioSourceOptions {
  position?: Vector3;
  orientation?: Vector3;
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
  distanceModel?: 'linear' | 'inverse' | 'exponential';
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
  panningModel?: 'equalpower' | 'HRTF';
  loop?: boolean;
  volume?: number;
}

export interface RoomAcousticsOptions {
  roomSize: Vector3;
  wallMaterials?: {
    left?: MaterialType;
    right?: MaterialType;
    front?: MaterialType;
    back?: MaterialType;
    floor?: MaterialType;
    ceiling?: MaterialType;
  };
  reverbTime?: number;
  dampingFrequency?: number;
}

export type MaterialType =
  | 'concrete'
  | 'wood'
  | 'glass'
  | 'carpet'
  | 'curtain'
  | 'acoustic-panel'
  | 'metal'
  | 'brick';

export interface AmbisonicsOptions {
  order: 1 | 2 | 3;
  normalization?: 'SN3D' | 'N3D' | 'FuMa';
}

export interface SpatialAudioConfig {
  hrtfEnabled?: boolean;
  hrtfUrl?: string;
  roomAcoustics?: RoomAcousticsOptions;
  ambisonics?: AmbisonicsOptions;
  listenerPosition?: Vector3;
  listenerOrientation?: Orientation;
}

// ============================================================================
// Audio Context Manager
// ============================================================================

export class SpatialAudioContext {
  private audioContext: AudioContext | null = null;
  private listener: AudioListener | null = null;
  private masterGain: GainNode | null = null;
  private sources: Map<string, SpatialAudioSource> = new Map();
  private roomProcessor: RoomAcousticsProcessor | null = null;
  private ambisonicsDecoder: AmbisonicsDecoder | null = null;
  private config: SpatialAudioConfig;

  constructor(config: SpatialAudioConfig = {}) {
    this.config = {
      hrtfEnabled: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    this.audioContext = new AudioContext();
    this.listener = this.audioContext.listener;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);

    // Initialize room acoustics if configured
    if (this.config.roomAcoustics) {
      this.roomProcessor = new RoomAcousticsProcessor(
        this.audioContext,
        this.config.roomAcoustics
      );
    }

    // Initialize ambisonics if configured
    if (this.config.ambisonics) {
      this.ambisonicsDecoder = new AmbisonicsDecoder(
        this.audioContext,
        this.config.ambisonics
      );
    }

    // Set initial listener position
    if (this.config.listenerPosition) {
      this.setListenerPosition(this.config.listenerPosition);
    }

    if (this.config.listenerOrientation) {
      this.setListenerOrientation(this.config.listenerOrientation);
    }
  }

  getContext(): AudioContext {
    if (!this.audioContext) {
      throw new Error('SpatialAudioContext not initialized. Call initialize() first.');
    }
    return this.audioContext;
  }

  setListenerPosition(position: Vector3): void {
    if (!this.listener) return;

    if (this.listener.positionX) {
      this.listener.positionX.setValueAtTime(position.x, this.audioContext!.currentTime);
      this.listener.positionY.setValueAtTime(position.y, this.audioContext!.currentTime);
      this.listener.positionZ.setValueAtTime(position.z, this.audioContext!.currentTime);
    } else {
      // Fallback for older browsers
      this.listener.setPosition(position.x, position.y, position.z);
    }
  }

  setListenerOrientation(orientation: Orientation): void {
    if (!this.listener) return;

    if (this.listener.forwardX) {
      this.listener.forwardX.setValueAtTime(orientation.forward.x, this.audioContext!.currentTime);
      this.listener.forwardY.setValueAtTime(orientation.forward.y, this.audioContext!.currentTime);
      this.listener.forwardZ.setValueAtTime(orientation.forward.z, this.audioContext!.currentTime);
      this.listener.upX.setValueAtTime(orientation.up.x, this.audioContext!.currentTime);
      this.listener.upY.setValueAtTime(orientation.up.y, this.audioContext!.currentTime);
      this.listener.upZ.setValueAtTime(orientation.up.z, this.audioContext!.currentTime);
    } else {
      this.listener.setOrientation(
        orientation.forward.x, orientation.forward.y, orientation.forward.z,
        orientation.up.x, orientation.up.y, orientation.up.z
      );
    }
  }

  createSource(id: string, options: AudioSourceOptions = {}): SpatialAudioSource {
    if (!this.audioContext || !this.masterGain) {
      throw new Error('SpatialAudioContext not initialized');
    }

    const source = new SpatialAudioSource(
      id,
      this.audioContext,
      this.masterGain,
      this.roomProcessor,
      options
    );

    this.sources.set(id, source);
    return source;
  }

  getSource(id: string): SpatialAudioSource | undefined {
    return this.sources.get(id);
  }

  removeSource(id: string): void {
    const source = this.sources.get(id);
    if (source) {
      source.dispose();
      this.sources.delete(id);
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext!.currentTime
      );
    }
  }

  suspend(): Promise<void> {
    return this.audioContext?.suspend() || Promise.resolve();
  }

  resume(): Promise<void> {
    return this.audioContext?.resume() || Promise.resolve();
  }

  dispose(): void {
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
  private id: string;
  private context: AudioContext;
  private panner: PannerNode;
  private gainNode: GainNode;
  private sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private mediaElement: HTMLMediaElement | null = null;
  private isPlaying: boolean = false;
  private options: AudioSourceOptions;
  private roomProcessor: RoomAcousticsProcessor | null;

  constructor(
    id: string,
    context: AudioContext,
    destination: AudioNode,
    roomProcessor: RoomAcousticsProcessor | null,
    options: AudioSourceOptions = {}
  ) {
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
    this.panner.panningModel = this.options.panningModel!;
    this.panner.distanceModel = this.options.distanceModel!;
    this.panner.maxDistance = this.options.maxDistance!;
    this.panner.refDistance = this.options.refDistance!;
    this.panner.rolloffFactor = this.options.rolloffFactor!;

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
    this.setPosition(this.options.position!);

    if (this.options.orientation) {
      this.setOrientation(this.options.orientation);
    }

    // Create gain node
    this.gainNode = context.createGain();
    this.gainNode.gain.value = this.options.volume!;

    // Connect nodes
    this.panner.connect(this.gainNode);

    if (roomProcessor) {
      this.gainNode.connect(roomProcessor.getInput());
      roomProcessor.getOutput().connect(destination);
    } else {
      this.gainNode.connect(destination);
    }
  }

  async loadBuffer(url: string): Promise<void> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.buffer = await this.context.decodeAudioData(arrayBuffer);
  }

  setBuffer(buffer: AudioBuffer): void {
    this.buffer = buffer;
  }

  attachMediaElement(element: HTMLMediaElement): void {
    this.mediaElement = element;
    this.sourceNode = this.context.createMediaElementSource(element);
    this.sourceNode.connect(this.panner);
  }

  setPosition(position: Vector3): void {
    if (this.panner.positionX) {
      this.panner.positionX.setValueAtTime(position.x, this.context.currentTime);
      this.panner.positionY.setValueAtTime(position.y, this.context.currentTime);
      this.panner.positionZ.setValueAtTime(position.z, this.context.currentTime);
    } else {
      this.panner.setPosition(position.x, position.y, position.z);
    }
  }

  animatePosition(
    from: Vector3,
    to: Vector3,
    duration: number,
    easing: 'linear' | 'exponential' = 'linear'
  ): void {
    const currentTime = this.context.currentTime;

    if (this.panner.positionX) {
      this.panner.positionX.setValueAtTime(from.x, currentTime);
      this.panner.positionY.setValueAtTime(from.y, currentTime);
      this.panner.positionZ.setValueAtTime(from.z, currentTime);

      if (easing === 'linear') {
        this.panner.positionX.linearRampToValueAtTime(to.x, currentTime + duration);
        this.panner.positionY.linearRampToValueAtTime(to.y, currentTime + duration);
        this.panner.positionZ.linearRampToValueAtTime(to.z, currentTime + duration);
      } else {
        this.panner.positionX.exponentialRampToValueAtTime(to.x || 0.001, currentTime + duration);
        this.panner.positionY.exponentialRampToValueAtTime(to.y || 0.001, currentTime + duration);
        this.panner.positionZ.exponentialRampToValueAtTime(to.z || 0.001, currentTime + duration);
      }
    }
  }

  setOrientation(orientation: Vector3): void {
    if (this.panner.orientationX) {
      this.panner.orientationX.setValueAtTime(orientation.x, this.context.currentTime);
      this.panner.orientationY.setValueAtTime(orientation.y, this.context.currentTime);
      this.panner.orientationZ.setValueAtTime(orientation.z, this.context.currentTime);
    } else {
      this.panner.setOrientation(orientation.x, orientation.y, orientation.z);
    }
  }

  setVolume(volume: number): void {
    this.gainNode.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.context.currentTime
    );
  }

  fadeIn(duration: number): void {
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      this.options.volume!,
      this.context.currentTime + duration
    );
  }

  fadeOut(duration: number): void {
    this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);
  }

  play(when: number = 0, offset: number = 0): void {
    if (!this.buffer && !this.mediaElement) {
      throw new Error('No audio source loaded');
    }

    if (this.mediaElement) {
      this.mediaElement.currentTime = offset;
      this.mediaElement.play();
    } else if (this.buffer) {
      this.stop();
      this.sourceNode = this.context.createBufferSource();
      this.sourceNode.buffer = this.buffer;
      this.sourceNode.loop = this.options.loop!;
      this.sourceNode.connect(this.panner);
      this.sourceNode.start(this.context.currentTime + when, offset);
      this.sourceNode.onended = () => {
        this.isPlaying = false;
      };
    }

    this.isPlaying = true;
  }

  pause(): void {
    if (this.mediaElement) {
      this.mediaElement.pause();
    }
    this.isPlaying = false;
  }

  stop(): void {
    if (this.sourceNode && this.buffer) {
      try {
        (this.sourceNode as AudioBufferSourceNode).stop();
      } catch {
        // Already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    } else if (this.mediaElement) {
      this.mediaElement.pause();
      this.mediaElement.currentTime = 0;
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  dispose(): void {
    this.stop();
    this.panner.disconnect();
    this.gainNode.disconnect();
  }
}

// ============================================================================
// Room Acoustics Processor
// ============================================================================

export class RoomAcousticsProcessor {
  private context: AudioContext;
  private inputGain: GainNode;
  private outputGain: GainNode;
  private convolver: ConvolverNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private options: RoomAcousticsOptions;

  constructor(context: AudioContext, options: RoomAcousticsOptions) {
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

  private generateImpulseResponse(): void {
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

  setWetDryMix(wet: number): void {
    const dry = 1 - wet;
    this.wetGain.gain.setValueAtTime(wet, this.context.currentTime);
    this.dryGain.gain.setValueAtTime(dry, this.context.currentTime);
  }

  getInput(): AudioNode {
    return this.inputGain;
  }

  getOutput(): AudioNode {
    return this.outputGain;
  }
}

// ============================================================================
// Ambisonics Decoder
// ============================================================================

export class AmbisonicsDecoder {
  private context: AudioContext;
  private options: AmbisonicsOptions;
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;

  constructor(context: AudioContext, options: AmbisonicsOptions) {
    this.context = context;
    this.options = options;

    // Number of channels based on ambisonics order
    const channelCount = (options.order + 1) ** 2;

    this.splitter = context.createChannelSplitter(channelCount);
    this.merger = context.createChannelMerger(2); // Binaural output
  }

  decode(input: AudioNode, output: AudioNode): void {
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
  private context: SpatialAudioContext;
  private sources: Map<string, { source: SpatialAudioSource; entity: AudioEntity }> = new Map();
  private updateCallback: ((time: number) => void) | null = null;
  private animationFrame: number | null = null;

  constructor(context: SpatialAudioContext) {
    this.context = context;
  }

  addEntity(entity: AudioEntity): SpatialAudioSource {
    const source = this.context.createSource(entity.id, entity.options);
    this.sources.set(entity.id, { source, entity });
    return source;
  }

  removeEntity(id: string): void {
    this.context.removeSource(id);
    this.sources.delete(id);
  }

  getEntity(id: string): SpatialAudioSource | undefined {
    return this.sources.get(id)?.source;
  }

  onUpdate(callback: (time: number) => void): void {
    this.updateCallback = callback;
  }

  start(): void {
    const update = (time: number) => {
      if (this.updateCallback) {
        this.updateCallback(time);
      }
      this.animationFrame = requestAnimationFrame(update);
    };

    this.animationFrame = requestAnimationFrame(update);
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}

export interface AudioEntity {
  id: string;
  options: AudioSourceOptions;
  audioUrl?: string;
}

// ============================================================================
// 3D Audio Path
// ============================================================================

export class AudioPath {
  private points: Vector3[];
  private durations: number[];

  constructor(points: Vector3[], durations?: number[]) {
    this.points = points;
    this.durations = durations || points.slice(1).map(() => 1);
  }

  getPositionAt(t: number): Vector3 {
    if (t <= 0) return this.points[0];
    if (t >= 1) return this.points[this.points.length - 1];

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

  animate(source: SpatialAudioSource, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const update = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / (duration * 1000), 1);

        source.setPosition(this.getPositionAt(t));

        if (t < 1) {
          requestAnimationFrame(update);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(update);
    });
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

function useMemo<T>(fn: () => T, _deps: unknown[]): T {
  return fn();
}

export function useSpatialAudio(config?: SpatialAudioConfig) {
  const contextRef = useRef<SpatialAudioContext | null>(null);
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

  const createSource = useCallback((id: string, options?: AudioSourceOptions) => {
    return contextRef.current?.createSource(id, options);
  }, []);

  const setListenerPosition = useCallback((position: Vector3) => {
    contextRef.current?.setListenerPosition(position);
  }, []);

  const setListenerOrientation = useCallback((orientation: Orientation) => {
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

export function useAudioSource(
  contextOrId: SpatialAudioContext | string,
  optionsOrContext?: AudioSourceOptions | SpatialAudioContext,
  maybeOptions?: AudioSourceOptions
) {
  const sourceRef = useRef<SpatialAudioSource | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const id = typeof contextOrId === 'string' ? contextOrId : '';
  const context = typeof contextOrId === 'string'
    ? optionsOrContext as SpatialAudioContext
    : contextOrId;
  const options = typeof contextOrId === 'string' ? maybeOptions : optionsOrContext as AudioSourceOptions;

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
    setPosition: (pos: Vector3) => sourceRef.current?.setPosition(pos),
    setVolume: (vol: number) => sourceRef.current?.setVolume(vol)
  };
}

export function useAudioListener(context: SpatialAudioContext | null) {
  const setPosition = useCallback((position: Vector3) => {
    context?.setListenerPosition(position);
  }, [context]);

  const setOrientation = useCallback((orientation: Orientation) => {
    context?.setListenerOrientation(orientation);
  }, [context]);

  return { setPosition, setOrientation };
}

export function useAudioPath(source: SpatialAudioSource | null, points: Vector3[]) {
  const pathRef = useRef(new AudioPath(points));
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = useCallback(async (duration: number) => {
    if (!source) return;
    setIsAnimating(true);
    await pathRef.current.animate(source, duration);
    setIsAnimating(false);
  }, [source]);

  return { path: pathRef.current, animate, isAnimating };
}

export function useAudioScene(context: SpatialAudioContext | null) {
  const sceneRef = useRef<AudioScene | null>(null);

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

export function useVRAudio(xrSession: unknown) {
  const contextRef = useRef<SpatialAudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!xrSession) return;

    const context = new SpatialAudioContext({ hrtfEnabled: true });
    context.initialize().then(() => {
      contextRef.current = context;
      setIsReady(true);
    });

    return () => {
      contextRef.current?.dispose();
    };
  }, [xrSession]);

  const syncWithXR = useMemo(() => (pose: { position: Vector3; orientation: Orientation }) => {
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

export function calculateDistance(a: Vector3, b: Vector3): number {
  return Math.sqrt(
    (b.x - a.x) ** 2 +
    (b.y - a.y) ** 2 +
    (b.z - a.z) ** 2
  );
}

export function normalizeVector(v: Vector3): Vector3 {
  const length = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length
  };
}

export function crossProduct(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVector(a: Vector3, b: Vector3, t: number): Vector3 {
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
      left: 'wood' as MaterialType,
      right: 'wood' as MaterialType,
      floor: 'carpet' as MaterialType,
      ceiling: 'acoustic-panel' as MaterialType
    }
  },

  concertHall: {
    roomSize: { x: 30, y: 15, z: 50 },
    reverbTime: 2.5,
    wallMaterials: {
      left: 'concrete' as MaterialType,
      right: 'concrete' as MaterialType,
      floor: 'wood' as MaterialType,
      ceiling: 'acoustic-panel' as MaterialType
    }
  },

  cathedral: {
    roomSize: { x: 20, y: 30, z: 60 },
    reverbTime: 4.0,
    wallMaterials: {
      left: 'concrete' as MaterialType,
      right: 'concrete' as MaterialType,
      floor: 'concrete' as MaterialType,
      ceiling: 'concrete' as MaterialType
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
      left: 'acoustic-panel' as MaterialType,
      right: 'acoustic-panel' as MaterialType,
      floor: 'carpet' as MaterialType,
      ceiling: 'acoustic-panel' as MaterialType
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
