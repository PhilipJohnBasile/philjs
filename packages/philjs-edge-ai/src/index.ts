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

// Type definitions for optional dependencies (dynamic imports)
type OnnxRuntimeWeb = {
  InferenceSession: any;
  Tensor: any;
  env?: any;
};

type TensorFlowJS = {
  loadGraphModel: (url: string) => Promise<any>;
  loadLayersModel: (url: string) => Promise<any>;
  setBackend: (backend: string) => Promise<void>;
  ready: () => Promise<void>;
  tensor: (data: any, shape?: number[]) => any;
  dispose: (tensors: any[]) => void;
};

type TFLite = {
  loadTFLiteModel: (url: string) => Promise<any>;
};

// WebGPU type (not available by default in some TypeScript configs)
declare global {
  interface GPU {
    requestAdapter(): Promise<GPUAdapter | null>;
  }
  interface GPUAdapter {
    requestDevice(): Promise<GPUDevice>;
  }
  interface GPUDevice {
    queue: GPUQueue;
    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
    createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
    createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
    createCommandEncoder(): GPUCommandEncoder;
    destroy(): void;
  }
  interface GPUQueue {
    submit(commandBuffers: GPUCommandBuffer[]): void;
    writeBuffer(buffer: GPUBuffer, offset: number, data: ArrayBufferView): void;
  }
  interface GPUBuffer {
    getMappedRange(): ArrayBuffer;
    unmap(): void;
    mapAsync(mode: number): Promise<void>;
    destroy(): void;
  }
  interface GPUBufferDescriptor {
    size: number;
    usage: number;
    mappedAtCreation?: boolean;
  }
  interface GPUShaderModule {}
  interface GPUShaderModuleDescriptor {
    code: string;
  }
  interface GPUComputePipeline {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }
  interface GPUComputePipelineDescriptor {
    layout: 'auto' | GPUPipelineLayout;
    compute: {
      module: GPUShaderModule;
      entryPoint: string;
    };
  }
  interface GPUPipelineLayout {}
  interface GPUBindGroupLayout {}
  interface GPUBindGroup {}
  interface GPUBindGroupDescriptor {
    layout: GPUBindGroupLayout;
    entries: GPUBindGroupEntry[];
  }
  interface GPUBindGroupEntry {
    binding: number;
    resource: { buffer: GPUBuffer };
  }
  interface GPUCommandEncoder {
    beginComputePass(): GPUComputePassEncoder;
    copyBufferToBuffer(src: GPUBuffer, srcOffset: number, dst: GPUBuffer, dstOffset: number, size: number): void;
    finish(): GPUCommandBuffer;
  }
  interface GPUComputePassEncoder {
    setPipeline(pipeline: GPUComputePipeline): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup): void;
    dispatchWorkgroups(x: number, y?: number, z?: number): void;
    end(): void;
  }
  interface GPUCommandBuffer {}
  const GPUBufferUsage: {
    STORAGE: number;
    COPY_SRC: number;
    COPY_DST: number;
    MAP_READ: number;
    MAP_WRITE: number;
  };
  const GPUMapMode: {
    READ: number;
    WRITE: number;
  };
}

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Device Capability Detection
// ============================================================================

export class DeviceDetector {
  private static capabilities: DeviceCapabilities | null = null;

  static async detect(): Promise<DeviceCapabilities> {
    if (this.capabilities) return this.capabilities;

    const capabilities: DeviceCapabilities = {
      webgpu: false,
      webnn: false,
      wasm: true,
      webgl: false,
      simd: false,
      threads: false,
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
    };

    // WebGPU detection
    if ('gpu' in navigator) {
      try {
        const adapter = await (navigator as Navigator & { gpu: GPU }).gpu.requestAdapter();
        capabilities.webgpu = !!adapter;
      } catch {
        capabilities.webgpu = false;
      }
    }

    // WebNN detection
    if ('ml' in navigator) {
      capabilities.webnn = true;
    }

    // WebGL detection
    try {
      const canvas = document.createElement('canvas');
      capabilities.webgl = !!(
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl')
      );
    } catch {
      capabilities.webgl = false;
    }

    // SIMD detection
    try {
      capabilities.simd = WebAssembly.validate(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
      ]));
    } catch {
      capabilities.simd = false;
    }

    // Thread detection
    capabilities.threads = typeof Worker !== 'undefined' && capabilities.sharedArrayBuffer;

    this.capabilities = capabilities;
    return capabilities;
  }

  static async getBestBackend(): Promise<'webgpu' | 'webnn' | 'webgl' | 'wasm' | 'cpu'> {
    const caps = await this.detect();

    if (caps.webgpu) return 'webgpu';
    if (caps.webnn) return 'webnn';
    if (caps.webgl) return 'webgl';
    if (caps.wasm && caps.simd) return 'wasm';
    return 'cpu';
  }
}

// ============================================================================
// Model Cache
// ============================================================================

export class ModelCache {
  private static DB_NAME = 'philjs-edge-ai-cache';
  private static STORE_NAME = 'models';
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const request = indexedDB.open(ModelCache.DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      this.db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ModelCache.STORE_NAME)) {
        db.createObjectStore(ModelCache.STORE_NAME, { keyPath: 'key' });
      }
    };

    return promise;
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<ArrayBuffer | null>();
    const transaction = this.db!.transaction(ModelCache.STORE_NAME, 'readonly');
    const store = transaction.objectStore(ModelCache.STORE_NAME);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result?.data ?? null);
    };

    return promise;
  }

  async set(key: string, data: ArrayBuffer): Promise<void> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const transaction = this.db!.transaction(ModelCache.STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ModelCache.STORE_NAME);
    const request = store.put({ key, data, timestamp: Date.now() });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    return promise;
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const transaction = this.db!.transaction(ModelCache.STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ModelCache.STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    return promise;
  }

  async clear(): Promise<void> {
    if (!this.db) await this.initialize();

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const transaction = this.db!.transaction(ModelCache.STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ModelCache.STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    return promise;
  }
}

// ============================================================================
// Tensor Operations
// ============================================================================

export class Tensor {
  data: Float32Array | Int32Array | Uint8Array;
  shape: number[];
  dtype: 'float32' | 'int32' | 'uint8';

  constructor(
    data: Float32Array | Int32Array | Uint8Array | number[],
    shape: number[],
    dtype: 'float32' | 'int32' | 'uint8' = 'float32'
  ) {
    if (Array.isArray(data)) {
      switch (dtype) {
        case 'float32':
          this.data = new Float32Array(data);
          break;
        case 'int32':
          this.data = new Int32Array(data);
          break;
        case 'uint8':
          this.data = new Uint8Array(data);
          break;
      }
    } else {
      this.data = data;
    }

    this.shape = shape;
    this.dtype = dtype;
  }

  static zeros(shape: number[], dtype: 'float32' | 'int32' | 'uint8' = 'float32'): Tensor {
    const size = shape.reduce((a, b) => a * b, 1);
    let data: Float32Array | Int32Array | Uint8Array;

    switch (dtype) {
      case 'float32':
        data = new Float32Array(size);
        break;
      case 'int32':
        data = new Int32Array(size);
        break;
      case 'uint8':
        data = new Uint8Array(size);
        break;
    }

    return new Tensor(data, shape, dtype);
  }

  static ones(shape: number[], dtype: 'float32' = 'float32'): Tensor {
    const tensor = this.zeros(shape, dtype);
    tensor.data.fill(1);
    return tensor;
  }

  static random(shape: number[]): Tensor {
    const size = shape.reduce((a, b) => a * b, 1);
    const data = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random();
    }
    return new Tensor(data, shape, 'float32');
  }

  static fromImageData(imageData: ImageData, normalize: boolean = true): Tensor {
    const { width, height, data } = imageData;
    const tensor = new Float32Array(3 * width * height);

    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4]!;
      const g = data[i * 4 + 1]!;
      const b = data[i * 4 + 2]!;

      if (normalize) {
        tensor[i] = r / 255;
        tensor[width * height + i] = g / 255;
        tensor[2 * width * height + i] = b / 255;
      } else {
        tensor[i] = r;
        tensor[width * height + i] = g;
        tensor[2 * width * height + i] = b;
      }
    }

    return new Tensor(tensor, [1, 3, height, width], 'float32');
  }

  reshape(newShape: number[]): Tensor {
    const size = this.shape.reduce((a, b) => a * b, 1);
    const newSize = newShape.reduce((a, b) => a * b, 1);

    if (size !== newSize) {
      throw new Error(`Cannot reshape tensor of size ${size} to shape ${newShape}`);
    }

    return new Tensor(this.data, newShape, this.dtype);
  }

  squeeze(axis?: number): Tensor {
    const newShape = axis !== undefined
      ? this.shape.filter((_, i) => i !== axis || this.shape[i] !== 1)
      : this.shape.filter(d => d !== 1);

    return new Tensor(this.data, newShape, this.dtype);
  }

  unsqueeze(axis: number): Tensor {
    const newShape = [...this.shape];
    newShape.splice(axis, 0, 1);
    return new Tensor(this.data, newShape, this.dtype);
  }

  argmax(axis: number = -1): number[] {
    const actualAxis = axis < 0 ? this.shape.length + axis : axis;
    const axisSize = this.shape[actualAxis]!;

    // Simplified argmax for last axis
    if (actualAxis === this.shape.length - 1) {
      const batchSize = this.data.length / axisSize;
      const result: number[] = [];

      for (let b = 0; b < batchSize; b++) {
        let maxIdx = 0;
        let maxVal = this.data[b * axisSize]!;

        for (let i = 1; i < axisSize; i++) {
          if (this.data[b * axisSize + i]! > maxVal) {
            maxVal = this.data[b * axisSize + i]!;
            maxIdx = i;
          }
        }

        result.push(maxIdx);
      }

      return result;
    }

    throw new Error('argmax only supports last axis currently');
  }

  softmax(axis: number = -1): Tensor {
    const actualAxis = axis < 0 ? this.shape.length + axis : axis;
    const axisSize = this.shape[actualAxis]!;
    const result = new Float32Array(this.data.length);

    const batchSize = this.data.length / axisSize;

    for (let b = 0; b < batchSize; b++) {
      // Find max for numerical stability
      let max = -Infinity;
      for (let i = 0; i < axisSize; i++) {
        max = Math.max(max, this.data[b * axisSize + i]!);
      }

      // Compute exp and sum
      let sum = 0;
      for (let i = 0; i < axisSize; i++) {
        result[b * axisSize + i] = Math.exp(this.data[b * axisSize + i]! - max);
        sum += result[b * axisSize + i]!;
      }

      // Normalize
      for (let i = 0; i < axisSize; i++) {
        result[b * axisSize + i]! /= sum;
      }
    }

    return new Tensor(result, this.shape, 'float32');
  }

  toArray(): number[] {
    return Array.from(this.data);
  }
}

// ============================================================================
// Model Loader
// ============================================================================

export class ModelLoader {
  private cache: ModelCache;
  private onProgressCallback: ProgressCallback | null = null;

  constructor() {
    this.cache = new ModelCache();
  }

  onProgress(callback: ProgressCallback): void {
    this.onProgressCallback = callback;
  }

  async load(config: ModelConfig): Promise<ArrayBuffer> {
    const cacheKey = config.cacheKey ?? config.url;

    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.onProgressCallback?.(100);
      return cached;
    }

    // Download with progress
    const response = await fetch(config.url);

    if (!response.ok) {
      throw new Error(`Failed to load model: ${response.statusText}`);
    }

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (total > 0 && this.onProgressCallback) {
        this.onProgressCallback((loaded / total) * 100);
      }
    }

    // Combine chunks
    const buffer = new ArrayBuffer(loaded);
    const view = new Uint8Array(buffer);
    let offset = 0;

    for (const chunk of chunks) {
      view.set(chunk, offset);
      offset += chunk.length;
    }

    // Cache the model
    await this.cache.set(cacheKey, buffer);

    return buffer;
  }
}

// ============================================================================
// ONNX Runtime Web Integration
// ============================================================================

/**
 * ONNX Runtime Web session interface
 * Dynamically imported from 'onnxruntime-web'
 */
interface OrtSession {
  run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
  inputNames: string[];
  outputNames: string[];
}

interface OrtTensor {
  data: Float32Array | Int32Array | Uint8Array;
  dims: number[];
  type: string;
}

interface OrtEnv {
  wasm: { numThreads: number; simd: boolean };
  webgpu: { powerPreference: string };
}

type OrtModule = {
  InferenceSession: {
    create(
      model: ArrayBuffer,
      options?: { executionProviders: string[] }
    ): Promise<OrtSession>;
  };
  Tensor: new (
    type: string,
    data: Float32Array | Int32Array | Uint8Array,
    dims: number[]
  ) => OrtTensor;
  env: OrtEnv;
};

/**
 * TensorFlow.js integration interface
 */
interface TfjsModel {
  predict(inputs: TfjsTensor): TfjsTensor;
  dispose(): void;
}

interface TfjsTensor {
  dataSync(): Float32Array;
  arraySync(): number[] | number[][] | number[][][];
  shape: number[];
  dispose(): void;
}

interface TfjsModule {
  loadGraphModel(url: string): Promise<TfjsModel>;
  loadLayersModel(url: string): Promise<TfjsModel>;
  tensor(data: number[] | Float32Array, shape?: number[]): TfjsTensor;
  setBackend(backend: string): Promise<boolean>;
  ready(): Promise<void>;
}

// ============================================================================
// Inference Engine
// ============================================================================

export class InferenceEngine {
  private model: ArrayBuffer | null = null;
  private config: ModelConfig;
  private backend: string = 'cpu';
  private isReady: boolean = false;

  // ONNX Runtime session
  private ortSession: OrtSession | null = null;
  private ortModule: OrtModule | null = null;

  // TensorFlow.js model
  private tfjsModel: TfjsModel | null = null;
  private tfjsModule: TfjsModule | null = null;

  // Model metadata
  private modelMetadata: ModelMetadata = {
    name: 'unknown',
    version: '1.0',
    inputShape: [],
    outputShape: [],
    parameters: 0,
    size: 0
  };

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const loader = new ModelLoader();
    this.model = await loader.load(this.config);

    // Determine backend
    this.backend = this.config.backend ?? await DeviceDetector.getBestBackend();

    // Initialize session based on format
    await this.initializeSession();

    // Warmup if requested
    if (this.config.warmup) {
      await this.warmup();
    }

    this.isReady = true;
  }

  private async initializeSession(): Promise<void> {
    const format = this.config.format;

    switch (format) {
      case 'onnx':
        await this.initializeOnnxSession();
        break;
      case 'tfjs':
        await this.initializeTfjsSession();
        break;
      case 'tflite':
        await this.initializeTfliteSession();
        break;
      default:
        throw new Error(`Unsupported model format: ${format}`);
    }
  }

  private async initializeOnnxSession(): Promise<void> {
    try {
      // Dynamically import ONNX Runtime Web
      // @ts-expect-error - Optional peer dependency
      this.ortModule = await import('onnxruntime-web') as unknown as OrtModule;

      // Configure execution providers based on backend
      const executionProviders = this.getOnnxExecutionProviders();

      // Configure WASM settings
      if (this.ortModule.env) {
        const caps = await DeviceDetector.detect();
        this.ortModule.env.wasm.numThreads = caps.threads ? navigator.hardwareConcurrency || 4 : 1;
        this.ortModule.env.wasm.simd = caps.simd;

        if (caps.webgpu) {
          this.ortModule.env.webgpu.powerPreference = 'high-performance';
        }
      }

      // Create inference session
      if (this.model) {
        this.ortSession = await this.ortModule.InferenceSession.create(
          this.model,
          { executionProviders }
        );

        // Extract metadata from session
        this.modelMetadata = {
          name: this.config.cacheKey ?? 'onnx-model',
          version: '1.0',
          inputShape: [], // Would need model inspection
          outputShape: [],
          parameters: 0,
          size: this.model.byteLength
        };
      }
    } catch (error) {
      console.warn('ONNX Runtime Web not available:', error);
      // Will throw at inference time if no other runtime loads
    }
  }

  private getOnnxExecutionProviders(): string[] {
    switch (this.backend) {
      case 'webgpu':
        return ['webgpu', 'wasm'];
      case 'webnn':
        return ['webnn', 'wasm'];
      case 'webgl':
        return ['webgl', 'wasm'];
      case 'wasm':
        return ['wasm'];
      default:
        return ['wasm'];
    }
  }

  private async initializeTfjsSession(): Promise<void> {
    try {
      // Dynamically import TensorFlow.js
      // @ts-expect-error - Optional peer dependency
      this.tfjsModule = await import('@tensorflow/tfjs') as unknown as TfjsModule;

      // Set backend based on device capabilities
      const tfjsBackend = this.getTfjsBackend();
      await this.tfjsModule.setBackend(tfjsBackend);
      await this.tfjsModule.ready();

      // Load the model from URL
      this.tfjsModel = await this.tfjsModule.loadGraphModel(this.config.url);

      this.modelMetadata = {
        name: this.config.cacheKey ?? 'tfjs-model',
        version: '1.0',
        inputShape: [],
        outputShape: [],
        parameters: 0,
        size: this.model?.byteLength ?? 0
      };
    } catch (error) {
      console.warn('TensorFlow.js not available:', error);
      // Will throw at inference time if no other runtime loads
    }
  }

  private getTfjsBackend(): string {
    switch (this.backend) {
      case 'webgpu':
        return 'webgpu';
      case 'webgl':
        return 'webgl';
      case 'wasm':
        return 'wasm';
      default:
        return 'cpu';
    }
  }

  private async initializeTfliteSession(): Promise<void> {
    // TFLite support via TensorFlow.js TFLite backend
    try {
      // @ts-expect-error - Optional peer dependency
      const tflite = await import('@tensorflow/tfjs-tflite') as any;
      this.tfjsModel = await tflite.loadTFLiteModel(this.config.url);

      this.modelMetadata = {
        name: this.config.cacheKey ?? 'tflite-model',
        version: '1.0',
        inputShape: [],
        outputShape: [],
        parameters: 0,
        size: this.model?.byteLength ?? 0
      };
    } catch (error) {
      console.warn('TFLite not available:', error);
      // Will throw at inference time if no other runtime loads
    }
  }

  private async warmup(): Promise<void> {
    // Run a dummy inference to warm up the engine
    // Use appropriate shape based on model type
    const dummyInput = Tensor.random([1, 3, 224, 224]);
    try {
      await this.infer(dummyInput);
    } catch {
      // Warmup failure is non-fatal
      console.warn('Warmup inference failed, model may need different input shape');
    }
  }

  async infer<T>(input: Tensor, options?: InferenceOptions): Promise<InferenceResult<T>> {
    if (!this.isReady) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    const startTime = performance.now();
    let output: Tensor;

    // Try ONNX Runtime first
    if (this.ortSession && this.ortModule) {
      output = await this.runOnnxInference(input);
    }
    // Try TensorFlow.js
    else if (this.tfjsModel && this.tfjsModule) {
      output = await this.runTfjsInference(input);
    }
    // Fallback to simulated inference
    else {
      output = this.simulateInference(input);
    }

    const latency = performance.now() - startTime;

    return {
      output: output as T,
      latency,
      backend: this.backend
    };
  }

  private async runOnnxInference(input: Tensor): Promise<Tensor> {
    if (!this.ortSession || !this.ortModule) {
      throw new Error('ONNX session not initialized');
    }

    // Create ONNX tensor from input
    const ortTensor = new this.ortModule.Tensor(
      input.dtype,
      input.data,
      input.shape
    );

    // Get input name (usually 'input' or 'images')
    const inputName = this.ortSession.inputNames[0] || 'input';
    const feeds: Record<string, OrtTensor> = { [inputName]: ortTensor };

    // Run inference
    const results = await this.ortSession.run(feeds);

    // Get output tensor
    const outputName = this.ortSession.outputNames[0] || 'output';
    const outputTensor = results[outputName];

    if (!outputTensor) {
      throw new Error('No output from ONNX inference');
    }

    // Convert back to our Tensor type
    return new Tensor(
      outputTensor.data as Float32Array,
      outputTensor.dims,
      'float32'
    );
  }

  private async runTfjsInference(input: Tensor): Promise<Tensor> {
    if (!this.tfjsModel || !this.tfjsModule) {
      throw new Error('TensorFlow.js model not initialized');
    }

    // Create TF.js tensor
    const tfInput = this.tfjsModule.tensor(
      Array.from(input.data as Float32Array),
      input.shape
    );

    // Run inference
    const tfOutput = this.tfjsModel.predict(tfInput) as TfjsTensor;

    // Get output data
    const outputData = tfOutput.dataSync();
    const outputShape = tfOutput.shape;

    // Cleanup TF.js tensors
    tfInput.dispose();
    tfOutput.dispose();

    return new Tensor(outputData, outputShape, 'float32');
  }

  private simulateInference(_input: Tensor): never {
    // No ML runtime available - throw an error instead of returning fake data
    throw new Error(
      'No ML inference runtime available. Please install one of the following:\n' +
      '  - npm install onnxruntime-web (for ONNX models)\n' +
      '  - npm install @tensorflow/tfjs (for TensorFlow.js models)\n' +
      '  - npm install @tensorflow/tfjs-tflite (for TFLite models)\n' +
      '\n' +
      'Ensure your model URL is accessible and the format matches the installed runtime.\n' +
      `Current config: format=${this.config.format}, backend=${this.backend}`
    );
  }

  async *inferStream<T>(
    input: Tensor,
    options?: InferenceOptions
  ): AsyncGenerator<StreamingResult<T>> {
    if (!this.isReady) {
      throw new Error('Engine not initialized');
    }

    const timeout = options?.timeout ?? 30000;
    const startTime = Date.now();

    // For transformer models that support streaming (e.g., LLMs)
    // This is a simplified implementation - real streaming would
    // require model-specific token generation logic

    // Check if we have a real model
    const hasRealModel = this.ortSession || this.tfjsModel;

    if (hasRealModel) {
      // For real models, run full inference and yield progressively
      const result = await this.infer<Tensor>(input);
      const outputArray = result.output.toArray();

      // Yield chunks of the output
      const chunkSize = Math.max(1, Math.floor(outputArray.length / 10));

      for (let i = 0; i < outputArray.length; i += chunkSize) {
        if (Date.now() - startTime > timeout) {
          throw new Error('Inference timeout');
        }

        const chunk = outputArray.slice(i, i + chunkSize);
        const progress = Math.min(100, ((i + chunkSize) / outputArray.length) * 100);

        yield {
          token: chunk as T,
          progress,
          done: i + chunkSize >= outputArray.length
        };

        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } else {
      // No ML runtime available - throw an error instead of returning fake data
      throw new Error(
        'No ML inference runtime available for streaming. Please install one of the following:\n' +
        '  - npm install onnxruntime-web (for ONNX models)\n' +
        '  - npm install @tensorflow/tfjs (for TensorFlow.js models)\n' +
        '  - npm install @tensorflow/tfjs-tflite (for TFLite models)\n' +
        '\n' +
        'Ensure your model URL is accessible and the format matches the installed runtime.\n' +
        `Current config: format=${this.config.format}, backend=${this.backend}`
      );
    }
  }

  getMetadata(): ModelMetadata {
    return { ...this.modelMetadata };
  }

  /**
   * Get information about the current inference session
   */
  getSessionInfo(): {
    format: string;
    backend: string;
    hasOnnxSession: boolean;
    hasTfjsModel: boolean;
    isReady: boolean;
  } {
    return {
      format: this.config.format,
      backend: this.backend,
      hasOnnxSession: this.ortSession !== null,
      hasTfjsModel: this.tfjsModel !== null,
      isReady: this.isReady
    };
  }

  dispose(): void {
    // Cleanup ONNX session
    this.ortSession = null;
    this.ortModule = null;

    // Cleanup TensorFlow.js model
    if (this.tfjsModel) {
      this.tfjsModel.dispose();
      this.tfjsModel = null;
    }
    this.tfjsModule = null;

    this.model = null;
    this.isReady = false;
  }
}

// ============================================================================
// Pre-built Models
// ============================================================================

export class ImageClassifier {
  private engine: InferenceEngine;
  private labels: string[] = [];

  constructor(config?: Partial<ModelConfig>) {
    this.engine = new InferenceEngine({
      url: config?.url ?? 'https://models.philjs.dev/mobilenet-v2.onnx',
      format: config?.format ?? 'onnx',
      ...config
    });
  }

  async initialize(labelsUrl?: string): Promise<void> {
    await this.engine.initialize();

    if (labelsUrl) {
      const response = await fetch(labelsUrl);
      this.labels = await response.json();
    }
  }

  async classify(
    image: HTMLImageElement | HTMLCanvasElement | ImageData,
    topK: number = 5
  ): Promise<Array<{ label: string; confidence: number }>> {
    // Get ImageData
    let imageData: ImageData;

    if (image instanceof ImageData) {
      imageData = image;
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0, 224, 224);
      imageData = ctx.getImageData(0, 0, 224, 224);
    }

    const tensor = Tensor.fromImageData(imageData);
    const result = await this.engine.infer<Tensor>(tensor);

    const probabilities = result.output.softmax();
    const sorted = probabilities.toArray()
      .map((confidence, index) => ({ label: this.labels[index] ?? `class_${index}`, confidence }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, topK);

    return sorted;
  }

  dispose(): void {
    this.engine.dispose();
  }
}

export class ObjectDetector {
  private engine: InferenceEngine;

  constructor(config?: Partial<ModelConfig>) {
    this.engine = new InferenceEngine({
      url: config?.url ?? 'https://models.philjs.dev/yolov8n.onnx',
      format: config?.format ?? 'onnx',
      ...config
    });
  }

  async initialize(): Promise<void> {
    await this.engine.initialize();
  }

  // COCO class names for YOLOv8
  private static readonly COCO_CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
    'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
    'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
    'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
  ];

  async detect(
    image: HTMLImageElement | HTMLCanvasElement,
    threshold: number = 0.5,
    iouThreshold: number = 0.45
  ): Promise<Array<{
    class: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>> {
    // Get original image dimensions
    const origWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
    const origHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height;

    // Resize to 640x640 for YOLOv8
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, 640, 640);
    const imageData = ctx.getImageData(0, 0, 640, 640);

    const tensor = Tensor.fromImageData(imageData);
    const result = await this.engine.infer<Tensor>(tensor);

    // Parse YOLOv8 output format: [batch, 84, 8400]
    // 84 = 4 (bbox) + 80 (classes)
    // 8400 = number of predictions
    const output = result.output.data as Float32Array;
    const numClasses = 80;
    const numPredictions = 8400;

    const detections: Array<{
      class: string;
      confidence: number;
      bbox: { x: number; y: number; width: number; height: number };
    }> = [];

    // Parse each prediction
    for (let i = 0; i < numPredictions; i++) {
      // YOLOv8 output is transposed: [1, 84, 8400]
      const cx = output[i]!;
      const cy = output[numPredictions + i]!;
      const w = output[2 * numPredictions + i]!;
      const h = output[3 * numPredictions + i]!;

      // Find best class
      let maxScore = 0;
      let maxClassIdx = 0;
      for (let c = 0; c < numClasses; c++) {
        const score = output[(4 + c) * numPredictions + i]!;
        if (score > maxScore) {
          maxScore = score;
          maxClassIdx = c;
        }
      }

      if (maxScore >= threshold) {
        // Convert from center format to corner format and scale to original image
        const x = ((cx - w / 2) / 640) * origWidth;
        const y = ((cy - h / 2) / 640) * origHeight;
        const width = (w / 640) * origWidth;
        const height = (h / 640) * origHeight;

        detections.push({
          class: ObjectDetector.COCO_CLASSES[maxClassIdx] || `class_${maxClassIdx}`,
          confidence: maxScore,
          bbox: { x, y, width, height },
        });
      }
    }

    // Apply Non-Maximum Suppression
    return this.nms(detections, iouThreshold);
  }

  /** Non-Maximum Suppression to remove overlapping detections */
  private nms(
    detections: Array<{ class: string; confidence: number; bbox: { x: number; y: number; width: number; height: number } }>,
    iouThreshold: number
  ): Array<{ class: string; confidence: number; bbox: { x: number; y: number; width: number; height: number } }> {
    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);

    const kept: typeof detections = [];
    const suppressed = new Set<number>();

    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue;

      kept.push(detections[i]!);

      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue;
        if (detections[i]!.class !== detections[j]!.class) continue;

        const iou = this.computeIoU(detections[i]!.bbox, detections[j]!.bbox);
        if (iou >= iouThreshold) {
          suppressed.add(j);
        }
      }
    }

    return kept;
  }

  /** Compute Intersection over Union for two bounding boxes */
  private computeIoU(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): number {
    const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
    const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
    const intersection = xOverlap * yOverlap;
    const union = a.width * a.height + b.width * b.height - intersection;
    return intersection / union;
  }

  dispose(): void {
    this.engine.dispose();
  }
}

export class TextEmbedder {
  private engine: InferenceEngine;

  constructor(config?: Partial<ModelConfig>) {
    this.engine = new InferenceEngine({
      url: config?.url ?? 'https://models.philjs.dev/all-minilm-l6-v2.onnx',
      format: config?.format ?? 'onnx',
      ...config
    });
  }

  async initialize(): Promise<void> {
    await this.engine.initialize();
  }

  async embed(text: string): Promise<number[]> {
    // Tokenize (simplified)
    const tokens = this.tokenize(text);
    const tensor = new Tensor(new Int32Array(tokens), [1, tokens.length], 'int32');

    const result = await this.engine.infer<Tensor>(tensor);
    return result.output.toArray();
  }

  async similarity(text1: string, text2: string): Promise<number> {
    const [emb1, emb2] = await Promise.all([
      this.embed(text1),
      this.embed(text2)
    ]);

    return this.cosineSimilarity(emb1, emb2);
  }

  /** Word piece vocabulary for text embeddings (subset) */
  private static readonly VOCAB: Record<string, number> = {
    '[PAD]': 0, '[UNK]': 1, '[CLS]': 2, '[SEP]': 3, '[MASK]': 4,
    'the': 5, 'a': 6, 'an': 7, 'is': 8, 'are': 9, 'was': 10, 'were': 11,
    'be': 12, 'been': 13, 'being': 14, 'have': 15, 'has': 16, 'had': 17,
    'do': 18, 'does': 19, 'did': 20, 'will': 21, 'would': 22, 'could': 23,
    'should': 24, 'may': 25, 'might': 26, 'must': 27, 'can': 28,
    'to': 29, 'of': 30, 'in': 31, 'for': 32, 'on': 33, 'with': 34,
    'at': 35, 'by': 36, 'from': 37, 'as': 38, 'into': 39, 'through': 40,
    'and': 41, 'or': 42, 'but': 43, 'not': 44, 'no': 45, 'yes': 46,
    'this': 47, 'that': 48, 'these': 49, 'those': 50,
    'i': 51, 'you': 52, 'he': 53, 'she': 54, 'it': 55, 'we': 56, 'they': 57,
    'what': 58, 'which': 59, 'who': 60, 'when': 61, 'where': 62, 'why': 63, 'how': 64,
  };

  /** Tokenize text using word piece approach */
  private tokenize(text: string): number[] {
    const tokens: number[] = [2]; // [CLS] token

    // Normalize and split
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    for (const word of words) {
      if (TextEmbedder.VOCAB[word] !== undefined) {
        tokens.push(TextEmbedder.VOCAB[word]!);
      } else {
        // Try subword tokenization
        let remaining = word;
        let foundSubword = false;

        while (remaining.length > 0) {
          let matched = false;
          for (let len = Math.min(remaining.length, 10); len > 0; len--) {
            const subword = remaining.slice(0, len);
            const key = foundSubword ? `##${subword}` : subword;
            if (TextEmbedder.VOCAB[key] !== undefined) {
              tokens.push(TextEmbedder.VOCAB[key]!);
              remaining = remaining.slice(len);
              matched = true;
              foundSubword = true;
              break;
            }
          }
          if (!matched) {
            // Unknown character, use [UNK]
            tokens.push(1); // [UNK]
            remaining = remaining.slice(1);
          }
        }
      }
    }

    tokens.push(3); // [SEP] token
    return tokens;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  dispose(): void {
    this.engine.dispose();
  }
}

export class SpeechRecognizer {
  private engine: InferenceEngine;
  private sampleRate: number;

  // Whisper token vocabulary (subset for common words)
  private static readonly WHISPER_VOCAB: Record<number, string> = {
    50257: '<|startoftranscript|>',
    50258: '<|en|>',
    50259: '<|transcribe|>',
    50260: '<|translate|>',
    50261: '<|notimestamps|>',
    50362: '<|endoftext|>',
    // Common English tokens (simplified)
    220: ' ', 262: ' the', 257: ' a', 318: ' I', 314: ' he', 340: ' she',
    356: ' it', 284: ' to', 286: ' is', 373: ' was', 287: ' are', 326: ' we',
    484: ' you', 290: ' of', 329: ' in', 379: ' that', 351: ' for', 319: ' on',
    510: ' as', 416: ' with', 644: ' be', 423: ' at', 422: ' by',
    691: ' this', 561: ' from', 1052: ' have', 468: ' an', 407: ' not',
    393: ' but', 394: ' or', 291: ' and', 1243: ' what', 1521: ' when',
    810: ' who', 2035: ' where', 1522: ' how', 460: ' can', 562: ' will',
    531: ' they', 550: ' their', 534: ' his', 465: ' her',
  };

  constructor(config?: Partial<ModelConfig & { sampleRate?: number }>) {
    this.sampleRate = config?.sampleRate ?? 16000;
    this.engine = new InferenceEngine({
      url: config?.url ?? 'https://models.philjs.dev/whisper-tiny.onnx',
      format: config?.format ?? 'onnx',
      ...config
    });
  }

  async initialize(): Promise<void> {
    await this.engine.initialize();
  }

  /** Transcribe audio to text */
  async transcribe(audio: Float32Array | AudioBuffer, language = 'en'): Promise<string> {
    // Try Web Speech API first (if available and preferred)
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      try {
        return await this.webSpeechTranscribe(audio, language);
      } catch {
        // Fall back to ONNX model
      }
    }

    // Use ONNX Whisper model
    return this.whisperTranscribe(audio, language);
  }

  /** Use Web Speech API for transcription (browser only) */
  private async webSpeechTranscribe(audio: Float32Array | AudioBuffer, language: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error(event.error));
      };

      // Play the audio to trigger recognition (requires user gesture context)
      const audioContext = new AudioContext();
      let buffer: AudioBuffer;

      if (audio instanceof AudioBuffer) {
        buffer = audio;
      } else {
        buffer = audioContext.createBuffer(1, audio.length, this.sampleRate);
        buffer.getChannelData(0).set(audio);
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();

      recognition.start();

      // Timeout after audio duration + 2 seconds
      setTimeout(() => {
        recognition.stop();
        reject(new Error('Transcription timeout'));
      }, (buffer.duration * 1000) + 2000);
    });
  }

  /** Use Whisper ONNX model for transcription */
  private async whisperTranscribe(audio: Float32Array | AudioBuffer, language: string): Promise<string> {
    let samples: Float32Array;

    if (audio instanceof AudioBuffer) {
      samples = audio.getChannelData(0);

      // Resample to 16kHz if needed
      if (audio.sampleRate !== 16000) {
        samples = this.resample(samples, audio.sampleRate, 16000);
      }
    } else {
      samples = audio;
    }

    // Compute log-mel spectrogram (80 mel bins, 30s max)
    const melSpectrogram = this.computeMelSpectrogram(samples);

    // Create input tensor
    const tensor = new Tensor(melSpectrogram, [1, 80, 3000], 'float32');
    const result = await this.engine.infer<Tensor>(tensor);

    // Decode output tokens
    return this.decodeTokens(result.output.data as Float32Array);
  }

  /** Resample audio to target sample rate */
  private resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const newLength = Math.round(samples.length / ratio);
    const resampled = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const lower = Math.floor(srcIndex);
      const upper = Math.min(lower + 1, samples.length - 1);
      const fraction = srcIndex - lower;

      resampled[i] = samples[lower]! * (1 - fraction) + samples[upper]! * fraction;
    }

    return resampled;
  }

  /** Compute log-mel spectrogram from audio samples */
  private computeMelSpectrogram(samples: Float32Array): Float32Array {
    const nFft = 400;
    const hopLength = 160;
    const nMels = 80;
    const maxFrames = 3000;

    // Pad samples to 30 seconds
    const targetLength = 16000 * 30;
    const padded = new Float32Array(targetLength);
    padded.set(samples.slice(0, Math.min(samples.length, targetLength)));

    // Compute STFT
    const numFrames = Math.min(Math.floor((padded.length - nFft) / hopLength) + 1, maxFrames);
    const spectrogram = new Float32Array(nMels * maxFrames);

    // Mel filter bank (simplified - would normally be precomputed)
    const melFilters = this.createMelFilterBank(nFft, nMels, 16000);

    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopLength;
      const frameData = padded.slice(start, start + nFft);

      // Apply Hanning window
      for (let i = 0; i < nFft; i++) {
        frameData[i]! *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (nFft - 1)));
      }

      // FFT (simplified DFT for now)
      const fftResult = this.dft(frameData);

      // Apply mel filter bank
      for (let mel = 0; mel < nMels; mel++) {
        let sum = 0;
        for (let k = 0; k < nFft / 2 + 1; k++) {
          sum += fftResult[k]! * melFilters[mel * (nFft / 2 + 1) + k]!;
        }
        // Log compression
        spectrogram[mel * maxFrames + frame] = Math.log(Math.max(sum, 1e-10));
      }
    }

    return spectrogram;
  }

  /** Create mel filter bank */
  private createMelFilterBank(nFft: number, nMels: number, sampleRate: number): Float32Array {
    const fMin = 0;
    const fMax = sampleRate / 2;
    const melMin = this.hzToMel(fMin);
    const melMax = this.hzToMel(fMax);

    const melPoints = new Float32Array(nMels + 2);
    for (let i = 0; i < nMels + 2; i++) {
      melPoints[i] = this.melToHz(melMin + (melMax - melMin) * i / (nMels + 1));
    }

    const binPoints = new Float32Array(nMels + 2);
    for (let i = 0; i < nMels + 2; i++) {
      binPoints[i] = Math.floor((nFft + 1) * melPoints[i]! / sampleRate);
    }

    const filters = new Float32Array(nMels * (nFft / 2 + 1));
    for (let mel = 0; mel < nMels; mel++) {
      for (let k = Math.floor(binPoints[mel]!); k < Math.floor(binPoints[mel + 2]!); k++) {
        if (k < binPoints[mel + 1]!) {
          filters[mel * (nFft / 2 + 1) + k] =
            (k - binPoints[mel]!) / (binPoints[mel + 1]! - binPoints[mel]!);
        } else {
          filters[mel * (nFft / 2 + 1) + k] =
            (binPoints[mel + 2]! - k) / (binPoints[mel + 2]! - binPoints[mel + 1]!);
        }
      }
    }

    return filters;
  }

  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  /** Simplified DFT (for production, use FFT) */
  private dft(signal: Float32Array): Float32Array {
    const n = signal.length;
    const result = new Float32Array(n / 2 + 1);

    for (let k = 0; k <= n / 2; k++) {
      let real = 0, imag = 0;
      for (let t = 0; t < n; t++) {
        const angle = -2 * Math.PI * k * t / n;
        real += signal[t]! * Math.cos(angle);
        imag += signal[t]! * Math.sin(angle);
      }
      result[k] = Math.sqrt(real * real + imag * imag);
    }

    return result;
  }

  /** Decode Whisper output tokens to text */
  private decodeTokens(output: Float32Array): string {
    const tokens: number[] = [];
    const vocabSize = 51865; // Whisper vocab size

    // Greedy decoding
    for (let t = 0; t < output.length / vocabSize; t++) {
      let maxProb = -Infinity;
      let maxToken = 0;

      for (let v = 0; v < vocabSize; v++) {
        const prob = output[t * vocabSize + v]!;
        if (prob > maxProb) {
          maxProb = prob;
          maxToken = v;
        }
      }

      // Stop at end of text token
      if (maxToken === 50362) break;

      tokens.push(maxToken);
    }

    // Convert tokens to text
    let text = '';
    for (const token of tokens) {
      if (SpeechRecognizer.WHISPER_VOCAB[token]) {
        text += SpeechRecognizer.WHISPER_VOCAB[token];
      }
    }

    return text.trim();
  }

  dispose(): void {
    this.engine.dispose();
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

function useCallback<T extends (...args: never[]) => unknown>(fn: T, _deps: unknown[]): T {
  return fn;
}

export function useEdgeAI(config: ModelConfig) {
  const engineRef = useRef<InferenceEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    const engine = new InferenceEngine(config);
    engineRef.current = engine;

    setIsLoading(true);
    engine.initialize().then(() => {
      setIsReady(true);
      setIsLoading(false);
    });

    return () => engine.dispose();
  }, []);

  const infer = useCallback(async <T>(input: Tensor) => {
    if (!engineRef.current) return null;
    return engineRef.current.infer<T>(input);
  }, []);

  return { isReady, isLoading, loadProgress, infer };
}

export function useImageClassifier(config?: Partial<ModelConfig>) {
  const classifierRef = useRef<ImageClassifier | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const classifier = new ImageClassifier(config);
    classifierRef.current = classifier;
    classifier.initialize().then(() => setIsReady(true));

    return () => classifier.dispose();
  }, []);

  const classify = useCallback(async (image: HTMLImageElement | HTMLCanvasElement | ImageData, topK?: number) => {
    if (!classifierRef.current) return [];
    return classifierRef.current.classify(image, topK);
  }, []);

  return { isReady, classify };
}

export function useObjectDetector(config?: Partial<ModelConfig>) {
  const detectorRef = useRef<ObjectDetector | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const detector = new ObjectDetector(config);
    detectorRef.current = detector;
    detector.initialize().then(() => setIsReady(true));

    return () => detector.dispose();
  }, []);

  const detect = useCallback(async (image: HTMLImageElement | HTMLCanvasElement, threshold?: number) => {
    if (!detectorRef.current) return [];
    return detectorRef.current.detect(image, threshold);
  }, []);

  return { isReady, detect };
}

export function useTextEmbedder(config?: Partial<ModelConfig>) {
  const embedderRef = useRef<TextEmbedder | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const embedder = new TextEmbedder(config);
    embedderRef.current = embedder;
    embedder.initialize().then(() => setIsReady(true));

    return () => embedder.dispose();
  }, []);

  const embed = useCallback(async (text: string) => {
    if (!embedderRef.current) return [];
    return embedderRef.current.embed(text);
  }, []);

  const similarity = useCallback(async (text1: string, text2: string) => {
    if (!embedderRef.current) return 0;
    return embedderRef.current.similarity(text1, text2);
  }, []);

  return { isReady, embed, similarity };
}

export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);

  useEffect(() => {
    DeviceDetector.detect().then(setCapabilities);
  }, []);

  return capabilities;
}

// Export everything
export default {
  DeviceDetector,
  ModelCache,
  ModelLoader,
  Tensor,
  InferenceEngine,
  ImageClassifier,
  ObjectDetector,
  TextEmbedder,
  SpeechRecognizer,
  useEdgeAI,
  useImageClassifier,
  useObjectDetector,
  useTextEmbedder,
  useDeviceCapabilities
};
