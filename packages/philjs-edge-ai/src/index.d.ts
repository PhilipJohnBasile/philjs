/**
 * @philjs/edge-ai - On-Device ML Inference
 *
 * Industry-first framework-native on-device AI:
 * - WebGPU/WebNN accelerated inference
 * - ONNX/TensorFlow.js model support
 * - Streaming inference with progress
 * - Model caching and preloading
 * - Privacy-first local processing
 * - Quantization and optimization
 */
export interface ModelConfig {
    url: string;
    format: 'onnx' | 'tfjs' | 'tflite';
    backend?: 'webgpu' | 'webnn' | 'wasm' | 'webgl' | 'cpu';
    quantized?: boolean;
    cacheKey?: string;
    warmup?: boolean;
}
export interface InferenceOptions {
    streaming?: boolean;
    batchSize?: number;
    timeout?: number;
}
export interface InferenceResult<T = unknown> {
    output: T;
    latency: number;
    backend: string;
}
export interface StreamingResult<T = unknown> {
    token: T;
    progress: number;
    done: boolean;
}
export interface ModelMetadata {
    name: string;
    version: string;
    inputShape: number[];
    outputShape: number[];
    parameters: number;
    size: number;
}
export interface DeviceCapabilities {
    webgpu: boolean;
    webnn: boolean;
    wasm: boolean;
    webgl: boolean;
    simd: boolean;
    threads: boolean;
    sharedArrayBuffer: boolean;
    memory: number;
}
export type InferenceCallback<T> = (result: StreamingResult<T>) => void;
export type ProgressCallback = (progress: number) => void;
export declare class DeviceDetector {
    private static capabilities;
    static detect(): Promise<DeviceCapabilities>;
    static getBestBackend(): Promise<'webgpu' | 'webnn' | 'webgl' | 'wasm' | 'cpu'>;
}
export declare class ModelCache {
    private static DB_NAME;
    private static STORE_NAME;
    private db;
    initialize(): Promise<void>;
    get(key: string): Promise<ArrayBuffer | null>;
    set(key: string, data: ArrayBuffer): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
export declare class Tensor {
    data: Float32Array | Int32Array | Uint8Array;
    shape: number[];
    dtype: 'float32' | 'int32' | 'uint8';
    constructor(data: Float32Array | Int32Array | Uint8Array | number[], shape: number[], dtype?: 'float32' | 'int32' | 'uint8');
    static zeros(shape: number[], dtype?: 'float32' | 'int32' | 'uint8'): Tensor;
    static ones(shape: number[], dtype?: 'float32'): Tensor;
    static random(shape: number[]): Tensor;
    static fromImageData(imageData: ImageData, normalize?: boolean): Tensor;
    reshape(newShape: number[]): Tensor;
    squeeze(axis?: number): Tensor;
    unsqueeze(axis: number): Tensor;
    argmax(axis?: number): number[];
    softmax(axis?: number): Tensor;
    toArray(): number[];
}
export declare class ModelLoader {
    private cache;
    private onProgressCallback;
    constructor();
    onProgress(callback: ProgressCallback): void;
    load(config: ModelConfig): Promise<ArrayBuffer>;
}
export declare class InferenceEngine {
    private model;
    private config;
    private backend;
    private isReady;
    private ortSession;
    private ortModule;
    private tfjsModel;
    private tfjsModule;
    private modelMetadata;
    constructor(config: ModelConfig);
    initialize(): Promise<void>;
    private initializeSession;
    private initializeOnnxSession;
    private getOnnxExecutionProviders;
    private initializeTfjsSession;
    private getTfjsBackend;
    private initializeTfliteSession;
    private warmup;
    infer<T>(input: Tensor, options?: InferenceOptions): Promise<InferenceResult<T>>;
    private runOnnxInference;
    private runTfjsInference;
    private simulateInference;
    inferStream<T>(input: Tensor, options?: InferenceOptions): AsyncGenerator<StreamingResult<T>>;
    getMetadata(): ModelMetadata;
    /**
     * Get information about the current inference session
     */
    getSessionInfo(): {
        format: string;
        backend: string;
        hasOnnxSession: boolean;
        hasTfjsModel: boolean;
        isReady: boolean;
    };
    dispose(): void;
}
export declare class ImageClassifier {
    private engine;
    private labels;
    constructor(config?: Partial<ModelConfig>);
    initialize(labelsUrl?: string): Promise<void>;
    classify(image: HTMLImageElement | HTMLCanvasElement | ImageData, topK?: number): Promise<Array<{
        label: string;
        confidence: number;
    }>>;
    dispose(): void;
}
export declare class ObjectDetector {
    private engine;
    constructor(config?: Partial<ModelConfig>);
    initialize(): Promise<void>;
    detect(image: HTMLImageElement | HTMLCanvasElement, threshold?: number): Promise<Array<{
        class: string;
        confidence: number;
        bbox: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }>>;
    dispose(): void;
}
export declare class TextEmbedder {
    private engine;
    constructor(config?: Partial<ModelConfig>);
    initialize(): Promise<void>;
    embed(text: string): Promise<number[]>;
    similarity(text1: string, text2: string): Promise<number>;
    private tokenize;
    private cosineSimilarity;
    dispose(): void;
}
export declare class SpeechRecognizer {
    private engine;
    constructor(config?: Partial<ModelConfig>);
    initialize(): Promise<void>;
    transcribe(audio: Float32Array | AudioBuffer): Promise<string>;
    dispose(): void;
}
export declare function useEdgeAI(config: ModelConfig): {
    isReady: boolean;
    isLoading: boolean;
    loadProgress: number;
    infer: <T>(input: Tensor) => Promise<InferenceResult<T> | null>;
};
export declare function useImageClassifier(config?: Partial<ModelConfig>): {
    isReady: boolean;
    classify: (image: HTMLImageElement | HTMLCanvasElement | ImageData, topK?: number) => Promise<{
        label: string;
        confidence: number;
    }[]>;
};
export declare function useObjectDetector(config?: Partial<ModelConfig>): {
    isReady: boolean;
    detect: (image: HTMLImageElement | HTMLCanvasElement, threshold?: number) => Promise<{
        class: string;
        confidence: number;
        bbox: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }[]>;
};
export declare function useTextEmbedder(config?: Partial<ModelConfig>): {
    isReady: boolean;
    embed: (text: string) => Promise<number[]>;
    similarity: (text1: string, text2: string) => Promise<number>;
};
export declare function useDeviceCapabilities(): DeviceCapabilities | null;
declare const _default: {
    DeviceDetector: typeof DeviceDetector;
    ModelCache: typeof ModelCache;
    ModelLoader: typeof ModelLoader;
    Tensor: typeof Tensor;
    InferenceEngine: typeof InferenceEngine;
    ImageClassifier: typeof ImageClassifier;
    ObjectDetector: typeof ObjectDetector;
    TextEmbedder: typeof TextEmbedder;
    SpeechRecognizer: typeof SpeechRecognizer;
    useEdgeAI: typeof useEdgeAI;
    useImageClassifier: typeof useImageClassifier;
    useObjectDetector: typeof useObjectDetector;
    useTextEmbedder: typeof useTextEmbedder;
    useDeviceCapabilities: typeof useDeviceCapabilities;
};
export default _default;
//# sourceMappingURL=index.d.ts.map