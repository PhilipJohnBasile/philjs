# @philjs/webgpu

WebGPU Integration for PhilJS - Leverage next-generation GPU APIs for high-performance rendering, compute shaders, parallel DOM diffing, and real-time effects.

## Installation

```bash
npm install @philjs/webgpu
```

## Requirements

- Node.js >= 24
- Browser with WebGPU support (Chrome 113+, Edge 113+, Firefox Nightly)
- TypeScript 6.x (for development)
- `@webgpu/types` for TypeScript type definitions

## Basic Usage

```typescript
import {
  initWebGPU,
  useWebGPU,
  isWebGPUSupported,
  WebGPUContext
} from '@philjs/webgpu';

// Check for WebGPU support
if (await isWebGPUSupported()) {
  // Initialize WebGPU
  const ctx = await initWebGPU({
    powerPreference: 'high-performance',
    enableCompute: true
  });

  if (ctx) {
    const device = ctx.getDevice();
    console.log('WebGPU initialized!');
  }
}

// Use the hook
function MyComponent() {
  const { supported, context, device } = useWebGPU();

  if (!supported) {
    return <div>WebGPU is not supported</div>;
  }

  // Use the GPU device
}
```

## GPU Canvas Rendering

```typescript
import { GPUCanvas, useGPUCanvas, BuiltInShaders } from '@philjs/webgpu';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gpuCanvas = new GPUCanvas(canvas, {
  powerPreference: 'high-performance',
  antialias: true
});

await gpuCanvas.initialize();

// Set up frame callback
gpuCanvas.onFrame((deltaTime) => {
  const ctx = gpuCanvas.getContext();
  const result = ctx.beginRenderPass();
  if (result) {
    const { encoder, pass } = result;
    // Render your content
    pass.end();
    ctx.submit(encoder);
  }
});

gpuCanvas.start();

// Or use the hook
const { initialize, context, start, stop, onFrame } = useGPUCanvas(canvasElement);
await initialize();
onFrame((dt) => { /* render */ });
start();
```

## Compute Shaders

```typescript
import { WebGPUContext, BuiltInShaders } from '@philjs/webgpu';

const ctx = new WebGPUContext({ enableCompute: true });
await ctx.initialize();

// Create a compute pipeline
const shaderModule = ctx.createShaderModule(BuiltInShaders.parallelSum, 'sum');
const pipeline = ctx.createComputePipeline({
  layout: 'auto',
  compute: {
    module: shaderModule,
    entryPoint: 'main'
  }
});

// Create buffers
const inputData = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
const inputBuffer = ctx.createBuffer(inputData, GPUBufferUsage.STORAGE);

// Run compute pass
const result = ctx.beginComputePass();
if (result) {
  const { encoder, pass } = result;
  pass.setPipeline(pipeline);
  // Set bind groups...
  pass.dispatchWorkgroups(inputData.length / 256);
  pass.end();
  ctx.submit(encoder);
}
```

## GPU Effects

```typescript
import { GPUEffects, WebGPUContext } from '@philjs/webgpu';

const ctx = new WebGPUContext();
await ctx.initialize();

const effects = new GPUEffects(ctx);
await effects.initialize();

// Apply blur effect
const inputTexture = ctx.createTexture(1920, 1080, 'rgba8unorm');
const outputTexture = ctx.createTexture(1920, 1080, 'rgba8unorm');

effects.blur(inputTexture, outputTexture, 1920, 1080);
```

## GPU Animations

```typescript
import { GPUAnimator, WebGPUContext } from '@philjs/webgpu';

const ctx = new WebGPUContext();
await ctx.initialize();

const animator = new GPUAnimator(ctx);
await animator.initialize();

// Add animations
animator.addAnimation({
  id: 'fade-in',
  duration: 1000,
  easing: (t) => t * t, // ease-in
  update: (progress) => new Float32Array([progress]) // opacity
});

// Update all animations
const results = animator.update(performance.now());
const opacity = results.get('fade-in')?.[0];
```

## Parallel DOM Diffing

```typescript
import { GPUDiffer, WebGPUContext } from '@philjs/webgpu';

const ctx = new WebGPUContext({ enableCompute: true });
await ctx.initialize();

const differ = new GPUDiffer(ctx);
await differ.initialize();

const oldTree = [
  { type: 'div', children: ['Hello'] },
  { type: 'span', children: ['World'] }
];

const newTree = [
  { type: 'div', children: ['Hello', 'There'] },
  { type: 'p', children: ['World'] }
];

const { patches, computeTime } = differ.diff(oldTree, newTree);
console.log(`Diff computed in ${computeTime}ms`);
console.log('Patches:', patches);
```

## API Reference

### Initialization

- **`initWebGPU(config?: WebGPUConfig): Promise<WebGPUContext | null>`** - Initialize WebGPU globally
- **`getWebGPUContext(): WebGPUContext | null`** - Get the global context
- **`isWebGPUSupported(): Promise<boolean>`** - Async check for WebGPU support
- **`isWebGPUSupportedSync(): boolean`** - Sync check (less accurate)

### Hooks

- **`useWebGPU()`** - Get WebGPU support status and context
- **`useGPUCanvas(canvas, config?)`** - Create a GPU-accelerated canvas
- **`useGPUEffects()`** - Access GPU effects (blur, etc.)
- **`useGPUAnimator()`** - Create a GPU animator instance

### Classes

#### `WebGPUContext`

Core WebGPU context manager.

**Methods:**
- `initialize(canvas?): Promise<boolean>` - Initialize WebGPU
- `getDevice(): GPUDevice | null` - Get the GPU device
- `getContext(): GPUCanvasContext | null` - Get canvas context
- `getFormat(): GPUTextureFormat` - Get preferred texture format
- `createBuffer(data, usage, label?)` - Create a GPU buffer
- `getBuffer(label)` - Get cached buffer by label
- `createTexture(width, height, format?, usage?)` - Create a texture
- `createShaderModule(code, label?)` - Create shader module
- `createRenderPipeline(descriptor, label?)` - Create render pipeline
- `createComputePipeline(descriptor, label?)` - Create compute pipeline
- `beginRenderPass(colorAttachments?)` - Start render pass
- `beginComputePass()` - Start compute pass
- `submit(encoder)` - Submit command buffer
- `destroy()` - Clean up resources

#### `GPUCanvas`

GPU-accelerated canvas component.

**Methods:**
- `initialize(): Promise<boolean>`
- `getContext(): WebGPUContext`
- `onFrame(callback: (dt: number) => void)`
- `start() / stop()`
- `destroy()`

#### `GPUEffects`

GPU-powered image effects.

**Methods:**
- `initialize(): Promise<void>`
- `blur(input, output, width, height)`

#### `GPUAnimator`

GPU-accelerated animation system.

**Methods:**
- `initialize(): Promise<void>`
- `addAnimation(animation: GPUAnimation)`
- `removeAnimation(id: string)`
- `update(currentTime): Map<string, Float32Array>`

#### `GPUDiffer`

Parallel DOM diffing using compute shaders.

**Methods:**
- `initialize(): Promise<void>`
- `diff(oldTree, newTree): ParallelDiffResult`

### Built-in Shaders

```typescript
import { BuiltInShaders } from '@philjs/webgpu';

BuiltInShaders.basic2D      // Simple 2D colored vertices
BuiltInShaders.texturedQuad // Textured quad rendering
BuiltInShaders.blur         // Gaussian blur compute shader
BuiltInShaders.parallelSum  // Parallel reduction
BuiltInShaders.animate      // Animation interpolation
```

### Configuration

```typescript
interface WebGPUConfig {
  canvas?: HTMLCanvasElement | string;
  powerPreference?: 'low-power' | 'high-performance';
  enableCompute?: boolean;
  antialias?: boolean;
  alphaMode?: 'opaque' | 'premultiplied';
  maxBufferSize?: number;  // bytes, default 256MB
}
```

### Types

- `GPURenderContext` - Render pass context with helper methods
- `GPUComputeContext` - Compute pass context with dispatch helper
- `ShaderModule` - Vertex/fragment/compute shader code
- `GPUAnimation` - Animation definition with easing
- `ParallelDiffResult` - Diff result with patches and timing
- `DOMPatch` - Single DOM operation (insert/remove/update/move)

## WGSL Shader Example

```wgsl
// Custom vertex shader
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@vertex
fn vertexMain(@location(0) pos: vec2f) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(pos, 0.0, 1.0);
  output.color = vec4f(1.0, 0.0, 0.0, 1.0);
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return input.color;
}
```

## Browser Support

WebGPU is currently supported in:
- Chrome 113+ (enabled by default)
- Edge 113+ (enabled by default)
- Firefox Nightly (behind flag)
- Safari Technology Preview (partial)

Use `isWebGPUSupported()` to check availability and provide fallbacks.

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-webgpu/src/index.ts

### Public API
- Direct exports: BuiltInShaders, DOMPatch, GPUAnimation, GPUAnimator, GPUCanvas, GPUComponentProps, GPUComputeContext, GPUDiffer, GPUEffects, GPURenderContext, ParallelDiffResult, ShaderModule, WebGPUConfig, WebGPUContext, getWebGPUContext, initWebGPU, isWebGPUSupported, isWebGPUSupportedSync, useGPUAnimator, useGPUCanvas, useGPUEffects, useWebGPU
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
