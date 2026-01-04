# @philjs/edge-ai - On-Device ML Inference

**Industry-first framework-native on-device AI for privacy-preserving machine learning.**

@philjs/edge-ai brings machine learning inference directly to the browser with WebGPU and WebNN hardware acceleration. Run ONNX, TensorFlow.js, and TFLite models locally without sending data to external servers.

## Installation

```bash
npm install @philjs/edge-ai
# or
pnpm add @philjs/edge-ai
# or
bun add @philjs/edge-ai
```

## Why @philjs/edge-ai?

Running ML models in the browser traditionally requires:
- Complex setup for WebGPU/WebNN
- Manual model loading and caching
- Custom tensor operations
- Backend detection and fallbacks
- No streaming support for LLMs

@philjs/edge-ai provides a unified, type-safe API that handles all of this with zero configuration.

## Features

| Feature | Description |
|---------|-------------|
| **WebGPU Acceleration** | Hardware-accelerated inference using the GPU |
| **WebNN Support** | Native Neural Network API for optimal performance |
| **Multi-Format** | ONNX, TensorFlow.js, and TFLite model support |
| **Model Caching** | IndexedDB-based caching with automatic persistence |
| **Streaming Inference** | Token-by-token streaming for LLM-style models |
| **Device Detection** | Automatic capability detection and backend selection |
| **Pre-built Models** | Image classification, object detection, embeddings, speech |
| **Tensor Operations** | Full tensor manipulation API (reshape, softmax, argmax) |
| **Progress Tracking** | Download progress callbacks for large models |
| **Privacy-First** | All processing happens locally in the browser |

## Quick Start

```typescript
import {
  ImageClassifier,
  DeviceDetector,
  useImageClassifier
} from '@philjs/edge-ai';

// Check device capabilities
const capabilities = await DeviceDetector.detect();
console.log('WebGPU:', capabilities.webgpu);
console.log('WebNN:', capabilities.webnn);

// Use the image classifier
const classifier = new ImageClassifier();
await classifier.initialize();

const results = await classifier.classify(imageElement, 5);
console.log(results);
// [{ label: 'golden retriever', confidence: 0.92 }, ...]
```

## Device Capability Detection

The `DeviceDetector` class automatically detects available hardware acceleration:

```typescript
import { DeviceDetector } from '@philjs/edge-ai';

// Detect all capabilities
const caps = await DeviceDetector.detect();

console.log({
  webgpu: caps.webgpu,           // WebGPU API available
  webnn: caps.webnn,             // WebNN API available
  wasm: caps.wasm,               // WebAssembly support
  webgl: caps.webgl,             // WebGL fallback
  simd: caps.simd,               // SIMD instructions
  threads: caps.threads,         // Web Workers + SharedArrayBuffer
  sharedArrayBuffer: caps.sharedArrayBuffer,
  memory: caps.memory            // Device memory in GB
});

// Get the best available backend
const backend = await DeviceDetector.getBestBackend();
// Returns: 'webgpu' | 'webnn' | 'webgl' | 'wasm' | 'cpu'
```

### Backend Selection Priority

1. **WebGPU** - Highest performance, modern GPUs
2. **WebNN** - Native neural network acceleration
3. **WebGL** - GPU compute via graphics API
4. **WASM** - WebAssembly with SIMD if available
5. **CPU** - JavaScript fallback

## Model Configuration

Configure models with the `ModelConfig` interface:

```typescript
import { InferenceEngine, type ModelConfig } from '@philjs/edge-ai';

const config: ModelConfig = {
  url: 'https://models.example.com/model.onnx',
  format: 'onnx',           // 'onnx' | 'tfjs' | 'tflite'
  backend: 'webgpu',        // Optional: override auto-detection
  quantized: true,          // Use quantized model weights
  cacheKey: 'my-model-v1',  // Custom cache key
  warmup: true              // Run warmup inference
};

const engine = new InferenceEngine(config);
await engine.initialize();
```

### Model Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| **ONNX** | `.onnx` | PyTorch, TensorFlow exports |
| **TensorFlow.js** | `.tfjs` | TF.js native models |
| **TFLite** | `.tflite` | Mobile-optimized models |

## Tensor Operations

The `Tensor` class provides NumPy-like operations:

```typescript
import { Tensor } from '@philjs/edge-ai';

// Create tensors
const zeros = Tensor.zeros([1, 3, 224, 224]);
const ones = Tensor.ones([10, 10]);
const random = Tensor.random([1, 512]);

// From array
const tensor = new Tensor([1, 2, 3, 4], [2, 2], 'float32');

// From ImageData
const imageTensor = Tensor.fromImageData(imageData, true); // normalize

// Operations
const reshaped = tensor.reshape([1, 4]);
const squeezed = tensor.squeeze();
const unsqueezed = tensor.unsqueeze(0);

// Math operations
const probs = tensor.softmax(-1);
const indices = tensor.argmax(-1);

// Convert back
const array = tensor.toArray();
```

### Tensor Data Types

```typescript
// Supported dtypes
const float32 = new Tensor(data, shape, 'float32');
const int32 = new Tensor(data, shape, 'int32');
const uint8 = new Tensor(data, shape, 'uint8');
```

## Model Caching

Models are automatically cached in IndexedDB:

```typescript
import { ModelCache } from '@philjs/edge-ai';

const cache = new ModelCache();
await cache.initialize();

// Check if cached
const cached = await cache.get('model-key');
if (cached) {
  console.log('Model loaded from cache');
}

// Manual cache management
await cache.set('model-key', arrayBuffer);
await cache.delete('model-key');
await cache.clear(); // Clear all cached models
```

### Cache with ModelLoader

```typescript
import { ModelLoader } from '@philjs/edge-ai';

const loader = new ModelLoader();

// Track download progress
loader.onProgress((percent) => {
  console.log(`Download: ${percent.toFixed(1)}%`);
});

// Load with automatic caching
const modelBuffer = await loader.load({
  url: 'https://models.example.com/model.onnx',
  format: 'onnx',
  cacheKey: 'mobilenet-v2'
});
```

## Inference Engine

The `InferenceEngine` class handles model loading and inference:

```typescript
import { InferenceEngine, Tensor } from '@philjs/edge-ai';

const engine = new InferenceEngine({
  url: 'https://models.example.com/model.onnx',
  format: 'onnx',
  warmup: true
});

await engine.initialize();

// Run inference
const input = Tensor.fromImageData(imageData);
const result = await engine.infer<Tensor>(input);

console.log(result.output);  // Output tensor
console.log(result.latency); // Inference time in ms
console.log(result.backend); // 'webgpu' | 'webnn' | etc.

// Get model metadata
const metadata = engine.getMetadata();
console.log({
  name: metadata.name,
  inputShape: metadata.inputShape,
  outputShape: metadata.outputShape,
  parameters: metadata.parameters,
  size: metadata.size
});

// Cleanup
engine.dispose();
```

### Streaming Inference

For LLM-style models that generate tokens sequentially:

```typescript
import { InferenceEngine, Tensor } from '@philjs/edge-ai';

const engine = new InferenceEngine({
  url: 'https://models.example.com/llm.onnx',
  format: 'onnx'
});

await engine.initialize();

// Stream tokens
const input = new Tensor(new Int32Array([1, 2, 3]), [1, 3], 'int32');

for await (const result of engine.inferStream<string>(input)) {
  process.stdout.write(result.token);

  if (result.done) {
    console.log(`\nComplete! Progress: ${result.progress}%`);
  }
}
```

## Pre-built Models

### Image Classification

Classify images using MobileNet or similar models:

```typescript
import { ImageClassifier } from '@philjs/edge-ai';

const classifier = new ImageClassifier({
  url: 'https://models.philjs.dev/mobilenet-v2.onnx', // default
  format: 'onnx',
  backend: 'webgpu'
});

// Initialize with optional labels
await classifier.initialize('https://models.philjs.dev/imagenet-labels.json');

// Classify an image
const results = await classifier.classify(
  imageElement,  // HTMLImageElement | HTMLCanvasElement | ImageData
  5              // topK results
);

// Results array
results.forEach(({ label, confidence }) => {
  console.log(`${label}: ${(confidence * 100).toFixed(1)}%`);
});
// golden retriever: 92.3%
// labrador retriever: 5.1%
// ...

classifier.dispose();
```

### Object Detection

Detect objects with bounding boxes:

```typescript
import { ObjectDetector } from '@philjs/edge-ai';

const detector = new ObjectDetector({
  url: 'https://models.philjs.dev/yolov8n.onnx', // default
  format: 'onnx'
});

await detector.initialize();

const detections = await detector.detect(
  imageElement,  // HTMLImageElement | HTMLCanvasElement
  0.5            // confidence threshold
);

detections.forEach((detection) => {
  console.log({
    class: detection.class,      // 'person', 'car', etc.
    confidence: detection.confidence,
    bbox: detection.bbox         // { x, y, width, height }
  });
});

// Draw bounding boxes
detections.forEach(({ bbox, class: label }) => {
  ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
  ctx.fillText(label, bbox.x, bbox.y - 5);
});

detector.dispose();
```

### Text Embeddings

Generate semantic embeddings for text:

```typescript
import { TextEmbedder } from '@philjs/edge-ai';

const embedder = new TextEmbedder({
  url: 'https://models.philjs.dev/all-minilm-l6-v2.onnx', // default
  format: 'onnx'
});

await embedder.initialize();

// Generate embedding
const embedding = await embedder.embed('Hello, world!');
console.log(embedding.length); // 384 dimensions

// Compute similarity between texts
const similarity = await embedder.similarity(
  'The cat sat on the mat',
  'A feline rested on the rug'
);
console.log(`Similarity: ${(similarity * 100).toFixed(1)}%`);
// Similarity: 87.3%

embedder.dispose();
```

### Speech Recognition

Transcribe audio using Whisper:

```typescript
import { SpeechRecognizer } from '@philjs/edge-ai';

const recognizer = new SpeechRecognizer({
  url: 'https://models.philjs.dev/whisper-tiny.onnx', // default
  format: 'onnx'
});

await recognizer.initialize();

// From Float32Array
const transcript = await recognizer.transcribe(audioSamples);
console.log(transcript);

// From AudioBuffer
const audioContext = new AudioContext();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
const text = await recognizer.transcribe(audioBuffer);

recognizer.dispose();
```

## Hooks

PhilJS hooks for declarative ML integration:

### useEdgeAI

General-purpose inference hook:

```typescript
import { useEdgeAI, Tensor } from '@philjs/edge-ai';

function MLComponent() {
  const { isReady, isLoading, loadProgress, infer } = useEdgeAI({
    url: 'https://models.example.com/model.onnx',
    format: 'onnx',
    warmup: true
  });

  const handleInference = async () => {
    const input = Tensor.random([1, 3, 224, 224]);
    const result = await infer<Tensor>(input);
    console.log(result?.output);
  };

  return (
    <div>
      {isLoading && <p>Loading: {loadProgress}%</p>}
      {isReady && <button onClick={handleInference}>Run</button>}
    </div>
  );
}
```

### useImageClassifier

Image classification hook:

```typescript
import { useImageClassifier } from '@philjs/edge-ai';

function ImageClassifierComponent() {
  const { isReady, classify } = useImageClassifier({
    url: 'https://models.philjs.dev/mobilenet-v2.onnx'
  });

  const handleClassify = async (image: HTMLImageElement) => {
    const results = await classify(image, 5);
    results.forEach(({ label, confidence }) => {
      console.log(`${label}: ${(confidence * 100).toFixed(1)}%`);
    });
  };

  return (
    <div>
      {isReady ? (
        <ImageUpload onImage={handleClassify} />
      ) : (
        <p>Loading classifier...</p>
      )}
    </div>
  );
}
```

### useObjectDetector

Object detection hook:

```typescript
import { useObjectDetector } from '@philjs/edge-ai';

function ObjectDetectorComponent() {
  const { isReady, detect } = useObjectDetector();

  const handleDetect = async (canvas: HTMLCanvasElement) => {
    const detections = await detect(canvas, 0.5);

    const ctx = canvas.getContext('2d')!;
    detections.forEach(({ bbox, class: label, confidence }) => {
      ctx.strokeStyle = 'red';
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
      ctx.fillText(`${label} (${(confidence * 100).toFixed(0)}%)`, bbox.x, bbox.y - 5);
    });
  };

  return (
    <div>
      <video onFrame={handleDetect} />
      {!isReady && <p>Loading detector...</p>}
    </div>
  );
}
```

### useTextEmbedder

Text embedding hook:

```typescript
import { useTextEmbedder } from '@philjs/edge-ai';

function SemanticSearchComponent() {
  const { isReady, embed, similarity } = useTextEmbedder();

  const [query, setQuery] = createSignal('');
  const [documents, setDocuments] = createSignal<string[]>([]);
  const [results, setResults] = createSignal<Array<{ doc: string; score: number }>>([]);

  const handleSearch = async () => {
    const queryEmb = await embed(query());

    const scored = await Promise.all(
      documents().map(async (doc) => ({
        doc,
        score: await similarity(query(), doc)
      }))
    );

    setResults(scored.sort((a, b) => b.score - a.score));
  };

  return (
    <div>
      <input value={query()} onInput={(e) => setQuery(e.target.value)} />
      <button onClick={handleSearch} disabled={!isReady}>
        Search
      </button>
      <ul>
        {results().map(({ doc, score }) => (
          <li>{doc} ({(score * 100).toFixed(1)}%)</li>
        ))}
      </ul>
    </div>
  );
}
```

### useDeviceCapabilities

Device capability detection hook:

```typescript
import { useDeviceCapabilities } from '@philjs/edge-ai';

function CapabilitiesDisplay() {
  const capabilities = useDeviceCapabilities();

  if (!capabilities) {
    return <p>Detecting capabilities...</p>;
  }

  return (
    <div>
      <h3>Device Capabilities</h3>
      <ul>
        <li>WebGPU: {capabilities.webgpu ? 'Yes' : 'No'}</li>
        <li>WebNN: {capabilities.webnn ? 'Yes' : 'No'}</li>
        <li>WASM: {capabilities.wasm ? 'Yes' : 'No'}</li>
        <li>WebGL: {capabilities.webgl ? 'Yes' : 'No'}</li>
        <li>SIMD: {capabilities.simd ? 'Yes' : 'No'}</li>
        <li>Threads: {capabilities.threads ? 'Yes' : 'No'}</li>
        <li>Memory: {capabilities.memory} GB</li>
      </ul>
    </div>
  );
}
```

## Types Reference

### ModelConfig

```typescript
interface ModelConfig {
  url: string;                                      // Model URL
  format: 'onnx' | 'tfjs' | 'tflite';              // Model format
  backend?: 'webgpu' | 'webnn' | 'wasm' | 'webgl' | 'cpu';  // Inference backend
  quantized?: boolean;                              // Use quantized weights
  cacheKey?: string;                                // Custom cache key
  warmup?: boolean;                                 // Run warmup inference
}
```

### InferenceOptions

```typescript
interface InferenceOptions {
  streaming?: boolean;   // Enable streaming mode
  batchSize?: number;    // Batch size for inference
  timeout?: number;      // Timeout in milliseconds
}
```

### InferenceResult

```typescript
interface InferenceResult<T = unknown> {
  output: T;        // Inference output
  latency: number;  // Inference time in ms
  backend: string;  // Backend used
}
```

### StreamingResult

```typescript
interface StreamingResult<T = unknown> {
  token: T;          // Current token/output
  progress: number;  // Progress percentage (0-100)
  done: boolean;     // Whether inference is complete
}
```

### ModelMetadata

```typescript
interface ModelMetadata {
  name: string;         // Model name
  version: string;      // Model version
  inputShape: number[]; // Expected input shape
  outputShape: number[]; // Expected output shape
  parameters: number;   // Number of parameters
  size: number;         // Model size in bytes
}
```

### DeviceCapabilities

```typescript
interface DeviceCapabilities {
  webgpu: boolean;            // WebGPU support
  webnn: boolean;             // WebNN support
  wasm: boolean;              // WebAssembly support
  webgl: boolean;             // WebGL support
  simd: boolean;              // SIMD instructions
  threads: boolean;           // Worker threads
  sharedArrayBuffer: boolean; // SharedArrayBuffer
  memory: number;             // Device memory (GB)
}
```

### Callback Types

```typescript
type InferenceCallback<T> = (result: StreamingResult<T>) => void;
type ProgressCallback = (progress: number) => void;
```

## API Reference

| Export | Type | Description |
|--------|------|-------------|
| `DeviceDetector` | Class | Hardware capability detection |
| `ModelCache` | Class | IndexedDB model caching |
| `ModelLoader` | Class | Model download with progress |
| `Tensor` | Class | Tensor creation and operations |
| `InferenceEngine` | Class | Core inference engine |
| `ImageClassifier` | Class | Image classification model |
| `ObjectDetector` | Class | Object detection model |
| `TextEmbedder` | Class | Text embedding model |
| `SpeechRecognizer` | Class | Speech-to-text model |
| `useEdgeAI` | Hook | General inference hook |
| `useImageClassifier` | Hook | Image classification hook |
| `useObjectDetector` | Hook | Object detection hook |
| `useTextEmbedder` | Hook | Text embedding hook |
| `useDeviceCapabilities` | Hook | Device detection hook |

## Best Practices

1. **Check Device Capabilities** - Not all browsers support WebGPU/WebNN
2. **Use Model Caching** - Large models benefit from IndexedDB caching
3. **Enable Warmup** - First inference is slower due to JIT compilation
4. **Quantize Models** - Smaller models load faster and use less memory
5. **Handle Loading States** - Show progress for large model downloads
6. **Dispose When Done** - Call `dispose()` to free GPU memory
7. **Use Streaming for LLMs** - Better UX with token-by-token output

## Browser Support

| Browser | WebGPU | WebNN | WASM |
|---------|--------|-------|------|
| Chrome 113+ | Yes | Experimental | Yes |
| Edge 113+ | Yes | Experimental | Yes |
| Firefox | Flag | No | Yes |
| Safari 17+ | Yes | No | Yes |

## Performance Tips

```typescript
// 1. Use the best available backend
const backend = await DeviceDetector.getBestBackend();

// 2. Warm up the model
const engine = new InferenceEngine({
  url: modelUrl,
  format: 'onnx',
  warmup: true  // Runs dummy inference
});

// 3. Batch multiple inputs
const batchInput = Tensor.zeros([8, 3, 224, 224]); // Batch of 8

// 4. Reuse tensor memory
const inputTensor = Tensor.zeros([1, 3, 224, 224]);
// Update data in place instead of creating new tensors

// 5. Dispose resources
engine.dispose();
```

## Next Steps

- [AI Overview](../ai/overview.md) - Cloud AI providers
- [RAG Pipeline](../ai/rag.md) - Retrieval-augmented generation
- [Streaming](../ai/streaming.md) - Real-time AI responses
