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
export type MaterialType = 'concrete' | 'wood' | 'glass' | 'carpet' | 'curtain' | 'acoustic-panel' | 'metal' | 'brick';
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
export declare class SpatialAudioContext {
    private audioContext;
    private listener;
    private masterGain;
    private sources;
    private roomProcessor;
    private ambisonicsDecoder;
    private config;
    constructor(config?: SpatialAudioConfig);
    initialize(): Promise<void>;
    getContext(): AudioContext;
    setListenerPosition(position: Vector3): void;
    setListenerOrientation(orientation: Orientation): void;
    createSource(id: string, options?: AudioSourceOptions): SpatialAudioSource;
    getSource(id: string): SpatialAudioSource | undefined;
    removeSource(id: string): void;
    setMasterVolume(volume: number): void;
    suspend(): Promise<void>;
    resume(): Promise<void>;
    dispose(): void;
}
export declare class SpatialAudioSource {
    private id;
    private context;
    private panner;
    private gainNode;
    private sourceNode;
    private buffer;
    private mediaElement;
    private isPlaying;
    private options;
    private roomProcessor;
    constructor(id: string, context: AudioContext, destination: AudioNode, roomProcessor: RoomAcousticsProcessor | null, options?: AudioSourceOptions);
    loadBuffer(url: string): Promise<void>;
    setBuffer(buffer: AudioBuffer): void;
    attachMediaElement(element: HTMLMediaElement): void;
    setPosition(position: Vector3): void;
    animatePosition(from: Vector3, to: Vector3, duration: number, easing?: 'linear' | 'exponential'): void;
    setOrientation(orientation: Vector3): void;
    setVolume(volume: number): void;
    fadeIn(duration: number): void;
    fadeOut(duration: number): void;
    play(when?: number, offset?: number): void;
    pause(): void;
    stop(): void;
    getIsPlaying(): boolean;
    dispose(): void;
}
export declare class RoomAcousticsProcessor {
    private context;
    private inputGain;
    private outputGain;
    private convolver;
    private dryGain;
    private wetGain;
    private options;
    constructor(context: AudioContext, options: RoomAcousticsOptions);
    private generateImpulseResponse;
    setWetDryMix(wet: number): void;
    getInput(): AudioNode;
    getOutput(): AudioNode;
}
export declare class AmbisonicsDecoder {
    private context;
    private options;
    private splitter;
    private merger;
    constructor(context: AudioContext, options: AmbisonicsOptions);
    decode(input: AudioNode, output: AudioNode): void;
}
export declare class AudioScene {
    private context;
    private sources;
    private updateCallback;
    private animationFrame;
    constructor(context: SpatialAudioContext);
    addEntity(entity: AudioEntity): SpatialAudioSource;
    removeEntity(id: string): void;
    getEntity(id: string): SpatialAudioSource | undefined;
    onUpdate(callback: (time: number) => void): void;
    start(): void;
    stop(): void;
}
export interface AudioEntity {
    id: string;
    options: AudioSourceOptions;
    audioUrl?: string;
}
export declare class AudioPath {
    private points;
    private durations;
    constructor(points: Vector3[], durations?: number[]);
    getPositionAt(t: number): Vector3;
    animate(source: SpatialAudioSource, duration: number): Promise<void>;
}
export declare function useSpatialAudio(config?: SpatialAudioConfig): {
    context: SpatialAudioContext | null;
    isInitialized: boolean;
    createSource: (id: string, options?: AudioSourceOptions) => SpatialAudioSource | undefined;
    setListenerPosition: (position: Vector3) => void;
    setListenerOrientation: (orientation: Orientation) => void;
};
export declare function useAudioSource(contextOrId: SpatialAudioContext | string, optionsOrContext?: AudioSourceOptions | SpatialAudioContext, maybeOptions?: AudioSourceOptions): {
    source: SpatialAudioSource | null;
    isLoaded: boolean;
    play: () => void | undefined;
    stop: () => void | undefined;
    setPosition: (pos: Vector3) => void | undefined;
    setVolume: (vol: number) => void | undefined;
};
export declare function useAudioListener(context: SpatialAudioContext | null): {
    setPosition: (position: Vector3) => void;
    setOrientation: (orientation: Orientation) => void;
};
export declare function useAudioPath(source: SpatialAudioSource | null, points: Vector3[]): {
    path: AudioPath;
    animate: (duration: number) => Promise<void>;
    isAnimating: boolean;
};
export declare function useAudioScene(context: SpatialAudioContext | null): AudioScene | null;
export declare function useVRAudio(xrSession: unknown): {
    context: SpatialAudioContext | null;
    isReady: boolean;
    syncWithXR: (pose: {
        position: Vector3;
        orientation: Orientation;
    }) => void;
};
export declare function calculateDistance(a: Vector3, b: Vector3): number;
export declare function normalizeVector(v: Vector3): Vector3;
export declare function crossProduct(a: Vector3, b: Vector3): Vector3;
export declare function lerp(a: number, b: number, t: number): number;
export declare function lerpVector(a: Vector3, b: Vector3, t: number): Vector3;
export declare const RoomPresets: {
    smallRoom: {
        roomSize: {
            x: number;
            y: number;
            z: number;
        };
        reverbTime: number;
        wallMaterials: {
            left: MaterialType;
            right: MaterialType;
            floor: MaterialType;
            ceiling: MaterialType;
        };
    };
    concertHall: {
        roomSize: {
            x: number;
            y: number;
            z: number;
        };
        reverbTime: number;
        wallMaterials: {
            left: MaterialType;
            right: MaterialType;
            floor: MaterialType;
            ceiling: MaterialType;
        };
    };
    cathedral: {
        roomSize: {
            x: number;
            y: number;
            z: number;
        };
        reverbTime: number;
        wallMaterials: {
            left: MaterialType;
            right: MaterialType;
            floor: MaterialType;
            ceiling: MaterialType;
        };
    };
    outdoors: {
        roomSize: {
            x: number;
            y: number;
            z: number;
        };
        reverbTime: number;
        dampingFrequency: number;
    };
    studio: {
        roomSize: {
            x: number;
            y: number;
            z: number;
        };
        reverbTime: number;
        wallMaterials: {
            left: MaterialType;
            right: MaterialType;
            floor: MaterialType;
            ceiling: MaterialType;
        };
    };
};
declare const _default: {
    SpatialAudioContext: typeof SpatialAudioContext;
    SpatialAudioSource: typeof SpatialAudioSource;
    RoomAcousticsProcessor: typeof RoomAcousticsProcessor;
    AmbisonicsDecoder: typeof AmbisonicsDecoder;
    AudioScene: typeof AudioScene;
    AudioPath: typeof AudioPath;
    RoomPresets: {
        smallRoom: {
            roomSize: {
                x: number;
                y: number;
                z: number;
            };
            reverbTime: number;
            wallMaterials: {
                left: MaterialType;
                right: MaterialType;
                floor: MaterialType;
                ceiling: MaterialType;
            };
        };
        concertHall: {
            roomSize: {
                x: number;
                y: number;
                z: number;
            };
            reverbTime: number;
            wallMaterials: {
                left: MaterialType;
                right: MaterialType;
                floor: MaterialType;
                ceiling: MaterialType;
            };
        };
        cathedral: {
            roomSize: {
                x: number;
                y: number;
                z: number;
            };
            reverbTime: number;
            wallMaterials: {
                left: MaterialType;
                right: MaterialType;
                floor: MaterialType;
                ceiling: MaterialType;
            };
        };
        outdoors: {
            roomSize: {
                x: number;
                y: number;
                z: number;
            };
            reverbTime: number;
            dampingFrequency: number;
        };
        studio: {
            roomSize: {
                x: number;
                y: number;
                z: number;
            };
            reverbTime: number;
            wallMaterials: {
                left: MaterialType;
                right: MaterialType;
                floor: MaterialType;
                ceiling: MaterialType;
            };
        };
    };
    useSpatialAudio: typeof useSpatialAudio;
    useAudioSource: typeof useAudioSource;
    useAudioListener: typeof useAudioListener;
    useAudioPath: typeof useAudioPath;
    useAudioScene: typeof useAudioScene;
    useVRAudio: typeof useVRAudio;
    calculateDistance: typeof calculateDistance;
    normalizeVector: typeof normalizeVector;
    crossProduct: typeof crossProduct;
    lerp: typeof lerp;
    lerpVector: typeof lerpVector;
};
export default _default;
//# sourceMappingURL=index.d.ts.map