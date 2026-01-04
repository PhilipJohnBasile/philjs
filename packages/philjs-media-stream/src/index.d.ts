/**
 * @philjs/media-stream - Advanced media stream processing for PhilJS
 *
 * Features:
 * - Video filters (blur, brightness, contrast, saturation, sepia, etc.)
 * - Face detection and tracking
 * - Video compositing and picture-in-picture
 * - Audio processing (equalizer, compressor, reverb, pitch shift)
 * - Audio visualization (waveform, spectrum, VU meter)
 * - Media recording with multiple formats
 * - Video effects (green screen, face swap placeholders)
 * - Stream mixing and switching
 * - Bitrate adaptation
 * - Quality metrics
 */
interface VideoFilterConfig {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
    blur?: number;
    sharpen?: number;
    grayscale?: boolean;
    sepia?: number;
    invert?: boolean;
    vignette?: number;
    noise?: number;
}
interface AudioProcessorConfig {
    gain?: number;
    equalizer?: number[];
    compressor?: {
        threshold: number;
        ratio: number;
        attack: number;
        release: number;
        knee: number;
    };
    reverb?: {
        wet: number;
        dry: number;
        decay: number;
    };
    pitchShift?: number;
    noiseSuppression?: boolean;
    echoCancellation?: boolean;
}
interface StreamQualityMetrics {
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;
    droppedFrames: number;
    latency: number;
    jitter: number;
}
declare class VideoFilterProcessor {
    private canvas;
    private ctx;
    private config;
    private width;
    private height;
    constructor(width: number, height: number, config?: VideoFilterConfig);
    setConfig(config: Partial<VideoFilterConfig>): void;
    processFrame(inputFrame: VideoFrame): VideoFrame;
    private buildFilterString;
    private needsPixelProcessing;
    private processPixels;
    private applySharpen;
    private applyVignette;
    private applyNoise;
}
interface FaceDetection {
    x: number;
    y: number;
    width: number;
    height: number;
    landmarks?: {
        leftEye: {
            x: number;
            y: number;
        };
        rightEye: {
            x: number;
            y: number;
        };
        nose: {
            x: number;
            y: number;
        };
        mouth: {
            x: number;
            y: number;
        };
    };
    confidence: number;
}
declare class FaceDetector {
    private detector;
    private isReady;
    initialize(): Promise<void>;
    detect(source: VideoFrame | HTMLVideoElement | ImageBitmap): Promise<FaceDetection[]>;
}
interface ChromaKeyConfig {
    keyColor: string;
    similarity: number;
    smoothness: number;
    spillReduction: number;
}
declare class ChromaKeyProcessor {
    private canvas;
    private ctx;
    private config;
    private backgroundImage;
    constructor(width: number, height: number, config: ChromaKeyConfig);
    setBackground(image: ImageBitmap): void;
    setBackgroundUrl(url: string): Promise<void>;
    processFrame(inputFrame: VideoFrame): VideoFrame;
    private applyChromaKey;
    private hexToRgb;
}
declare class AudioStreamProcessor {
    private audioContext;
    private sourceNode;
    private destinationNode;
    private gainNode;
    private compressorNode;
    private eqNodes;
    private convolverNode;
    private analyserNode;
    private config;
    constructor(config?: AudioProcessorConfig);
    initialize(): Promise<void>;
    private loadReverbImpulse;
    processStream(inputStream: MediaStream): MediaStream;
    setGain(value: number): void;
    setEqualizer(bands: number[]): void;
    getFrequencyData(): Uint8Array;
    getTimeDomainData(): Uint8Array;
    getVolume(): number;
    destroy(): void;
}
interface VisualizerConfig {
    type: 'waveform' | 'spectrum' | 'bars' | 'circular';
    width: number;
    height: number;
    color?: string;
    backgroundColor?: string;
    lineWidth?: number;
    barWidth?: number;
    barGap?: number;
    smoothing?: number;
}
declare class AudioVisualizer {
    private canvas;
    private ctx;
    private config;
    private audioProcessor;
    private animationFrame;
    constructor(canvas: HTMLCanvasElement, audioProcessor: AudioStreamProcessor, config: VisualizerConfig);
    start(): void;
    stop(): void;
    private draw;
    private drawWaveform;
    private drawSpectrum;
    private drawBars;
    private drawCircular;
    private adjustBrightness;
}
interface MixerInput {
    id: string;
    stream: MediaStream;
    volume?: number;
    muted?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}
declare class StreamMixer {
    private canvas;
    private ctx;
    private audioContext;
    private audioDestination;
    private inputs;
    private outputStream;
    private animationFrame;
    private width;
    private height;
    constructor(width: number, height: number);
    addInput(config: MixerInput): void;
    removeInput(id: string): void;
    updateInput(id: string, updates: Partial<MixerInput>): void;
    setLayout(layout: 'grid' | 'pip' | 'side-by-side' | 'custom'): void;
    start(): void;
    stop(): void;
    getOutputStream(): MediaStream;
    destroy(): void;
}
interface RecorderConfig {
    mimeType?: string;
    videoBitsPerSecond?: number;
    audioBitsPerSecond?: number;
    timeslice?: number;
}
declare class MediaStreamRecorder {
    private mediaRecorder;
    private chunks;
    private stream;
    private config;
    private listeners;
    constructor(stream: MediaStream, config?: RecorderConfig);
    private getSupportedMimeType;
    start(): void;
    pause(): void;
    resume(): void;
    stop(): Blob;
    getBlob(): Blob;
    getState(): RecordingState | null;
    on(event: string, callback: Function): () => void;
    private emit;
}
declare class StreamQualityMonitor {
    private stream;
    private intervalId;
    private metrics;
    private prevStats;
    private listeners;
    constructor(stream: MediaStream);
    start(interval?: number): void;
    stop(): void;
    private updateMetrics;
    getMetrics(): StreamQualityMetrics;
    on(event: string, callback: Function): () => void;
    private emit;
}
interface MediaProcessorConfig {
    video?: VideoFilterConfig;
    audio?: AudioProcessorConfig;
    chromaKey?: ChromaKeyConfig;
    faceDetection?: boolean;
}
declare class MediaStreamProcessor {
    private inputStream;
    private outputStream;
    private videoFilter;
    private chromaKey;
    private audioProcessor;
    private faceDetector;
    private config;
    private running;
    constructor(inputStream: MediaStream, config?: MediaProcessorConfig);
    start(): Promise<MediaStream>;
    private processVideo;
    private processAudio;
    setVideoFilter(config: Partial<VideoFilterConfig>): void;
    detectFaces(): Promise<FaceDetection[]>;
    getAudioProcessor(): AudioStreamProcessor | null;
    stop(): void;
}
declare function useMediaProcessor(stream: MediaStream | null, config: MediaProcessorConfig): {
    outputStream: MediaStream | null;
    isProcessing: boolean;
    setVideoFilter: (filter: Partial<VideoFilterConfig>) => void;
};
declare function useAudioVisualizer(stream: MediaStream | null, canvasRef: HTMLCanvasElement | null, type?: VisualizerConfig['type']): {
    volume: number;
    frequencyData: Uint8Array | null;
};
declare function useStreamRecorder(stream: MediaStream | null): {
    isRecording: boolean;
    start: () => void;
    stop: () => Blob;
    pause: () => void;
    resume: () => void;
};
declare function useStreamMixer(inputs: MixerInput[]): {
    outputStream: MediaStream | null;
    addInput: (input: MixerInput) => void;
    removeInput: (id: string) => void;
    setLayout: (layout: 'grid' | 'pip' | 'side-by-side') => void;
};
export { MediaStreamProcessor, VideoFilterProcessor, AudioStreamProcessor, ChromaKeyProcessor, FaceDetector, AudioVisualizer, StreamMixer, MediaStreamRecorder, StreamQualityMonitor, useMediaProcessor, useAudioVisualizer, useStreamRecorder, useStreamMixer, type VideoFilterConfig, type AudioProcessorConfig, type ChromaKeyConfig, type MediaProcessorConfig, type FaceDetection, type MixerInput, type RecorderConfig, type StreamQualityMetrics, type VisualizerConfig };
//# sourceMappingURL=index.d.ts.map