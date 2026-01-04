# @philjs/webgpu - WebGPU Integration

**Next-generation GPU-accelerated rendering and compute for PhilJS applications.**

@philjs/webgpu brings the power of WebGPU to your PhilJS applications, enabling GPU-accelerated UI rendering, compute shaders for complex animations, parallel DOM diffing, and real-time visual effects. No other JavaScript framework provides this level of GPU integration out of the box.

## Installation

```bash
npm install @philjs/webgpu
# or
pnpm add @philjs/webgpu
# or
bun add @philjs/webgpu
```

## Requirements

- Node.js >= 24
- Browser with WebGPU support:
  - Chrome 113+ (enabled by default)
  - Edge 113+ (enabled by default)
  - Firefox Nightly (behind flag)
  - Safari Technology Preview (partial support)
- TypeScript 6.x (for development)

## Features

| Feature | Description |
|---------|-------------|
| **GPU-Accelerated Rendering** | High-performance canvas rendering using WebGPU pipelines |
| **Compute Shaders** | Run parallel computations on the GPU for complex animations |
| **Parallel DOM Diffing** | Experimental GPU-accelerated virtual DOM diffing |
| **Built-in Shaders** | Pre-built WGSL shaders for common operations |
| **Real-time Effects** | GPU-powered blur, filters, and visual effects |
| **Animation System** | GPU-accelerated animation interpolation with easing |
| **Resource Management** | Automatic buffer, texture, and pipeline caching |
| **Hooks API** | PhilJS-style hooks for easy WebGPU integration |

## Quick Start

```typescript
import {
  initWebGPU,
  useWebGPU,
  isWebGPUSupported,
  GPUCanvas,
  BuiltInShaders
} from '@philjs/webgpu';

// Check for WebGPU support
if (await isWebGPUSupported()) {
  // Initialize WebGPU globally
  const ctx = await initWebGPU({
    powerPreference: 'high-performance',
    enableCompute: true
  });

  if (ctx) {
    console.log('WebGPU initialized!');
    const device = ctx.getDevice();
    // Start using WebGPU...
  }
}

// Use in a component
function MyGPUComponent() {
  const { supported, context, device } = useWebGPU();

  if (!supported) {
    return <div>WebGPU is not supported in this browser</div>;
  }

  return <GPURenderer context={context} />;
}
```

## WebGPU Context

The `WebGPUContext` class is the core of the package, managing GPU resources and providing a unified API for WebGPU operations.

### Creating a Context

```typescript
import { WebGPUContext } from '@philjs/webgpu';

const ctx = new WebGPUContext({
  powerPreference: 'high-performance',  // or 'low-power'
  enableCompute: true,
  antialias: true,
  alphaMode: 'premultiplied',
  maxBufferSize: 256 * 1024 * 1024  // 256MB
});

// Initialize (optionally with a canvas)
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const success = await ctx.initialize(canvas);

if (success) {
  const device = ctx.getDevice();
  const gpuContext = ctx.getContext();
  const format = ctx.getFormat();
}
```

### Buffer Management

```typescript
// Create a buffer from typed arrays
const vertexData = new Float32Array([
  // x, y, r, g, b, a
  -0.5, -0.5, 1.0, 0.0, 0.0, 1.0,
   0.5, -0.5, 0.0, 1.0, 0.0, 1.0,
   0.0,  0.5, 0.0, 0.0, 1.0, 1.0,
]);

const vertexBuffer = ctx.createBuffer(
  vertexData,
  GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  'triangle-vertices'  // Optional label for caching
);

// Retrieve cached buffer
const cached = ctx.getBuffer('triangle-vertices');
```

### Texture Management

```typescript
// Create a texture
const texture = ctx.createTexture(
  1920,  // width
  1080,  // height
  'rgba8unorm',  // format
  GPUTextureUsage.TEXTURE_BINDING |
  GPUTextureUsage.COPY_DST |
  GPUTextureUsage.RENDER_ATTACHMENT
);

// Create a view
const view = texture.createView();
```

### Shader Management

```typescript
// Create a shader module (automatically cached by label)
const shaderModule = ctx.createShaderModule(`
  @vertex
  fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
    return vec4f(pos, 0.0, 1.0);
  }

  @fragment
  fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1.0, 0.0, 0.0, 1.0);
  }
`, 'red-triangle');

// Use built-in shaders
import { BuiltInShaders } from '@philjs/webgpu';

const basic2DShader = ctx.createShaderModule(BuiltInShaders.basic2D, 'basic2d');
```

### Pipeline Management

```typescript
// Create a render pipeline
const pipeline = ctx.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vertexMain',
    buffers: [{
      arrayStride: 24,  // 6 floats * 4 bytes
      attributes: [
        { shaderLocation: 0, offset: 0, format: 'float32x2' },   // position
        { shaderLocation: 1, offset: 8, format: 'float32x4' },   // color
      ]
    }]
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fragmentMain',
    targets: [{ format: ctx.getFormat() }]
  },
  primitive: {
    topology: 'triangle-list'
  }
}, 'my-pipeline');

// Create a compute pipeline
const computePipeline = ctx.createComputePipeline({
  layout: 'auto',
  compute: {
    module: computeShader,
    entryPoint: 'main'
  }
}, 'my-compute');
```

### Rendering

```typescript
// Begin a render pass
const result = ctx.beginRenderPass();
if (result) {
  const { encoder, pass } = result;

  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.draw(3);  // Draw 3 vertices
  pass.end();

  ctx.submit(encoder);
}

// Custom color attachments
const customResult = ctx.beginRenderPass([{
  view: customTextureView,
  clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
  loadOp: 'clear',
  storeOp: 'store'
}]);
```

### Compute Operations

```typescript
// Begin a compute pass
const computeResult = ctx.beginComputePass();
if (computeResult) {
  const { encoder, pass } = computeResult;

  pass.setPipeline(computePipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(256, 1, 1);
  pass.end();

  ctx.submit(encoder);
}
```

### Cleanup

```typescript
// Clean up all resources
ctx.destroy();
```

## GPU Canvas Component

The `GPUCanvas` class provides a high-level abstraction for GPU-accelerated canvas rendering with a built-in render loop.

```typescript
import { GPUCanvas } from '@philjs/webgpu';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gpuCanvas = new GPUCanvas(canvas, {
  powerPreference: 'high-performance',
  antialias: true
});

// Initialize
await gpuCanvas.initialize();

// Get the underlying context
const ctx = gpuCanvas.getContext();

// Set up frame callback
gpuCanvas.onFrame((deltaTime) => {
  // deltaTime is in seconds
  console.log(`Frame time: ${deltaTime * 1000}ms`);

  const result = ctx.beginRenderPass();
  if (result) {
    const { encoder, pass } = result;
    // Render your content
    pass.end();
    ctx.submit(encoder);
  }
});

// Start the render loop
gpuCanvas.start();

// Later, stop the loop
gpuCanvas.stop();

// Clean up
gpuCanvas.destroy();
```

### Using the Hook

```typescript
import { useGPUCanvas } from '@philjs/webgpu';

function GPUComponent() {
  let canvasRef: HTMLCanvasElement;

  onMount(async () => {
    const { initialize, context, start, stop, onFrame } = useGPUCanvas(
      canvasRef,
      { powerPreference: 'high-performance' }
    );

    const success = await initialize();
    if (success) {
      onFrame((dt) => {
        // Render each frame
      });
      start();
    }
  });

  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

## GPU Effects

The `GPUEffects` class provides GPU-accelerated image processing effects.

```typescript
import { GPUEffects, WebGPUContext } from '@philjs/webgpu';

const ctx = new WebGPUContext();
await ctx.initialize();

const effects = new GPUEffects(ctx);
await effects.initialize();

// Create input and output textures
const inputTexture = ctx.createTexture(1920, 1080, 'rgba8unorm');
const outputTexture = ctx.createTexture(
  1920,
  1080,
  'rgba8unorm',
  GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC
);

// Apply blur effect
effects.blur(inputTexture, outputTexture, 1920, 1080);
```

### Using the Hook

```typescript
import { useGPUEffects } from '@philjs/webgpu';

function ImageProcessor() {
  const effects = useGPUEffects();

  if (!effects) {
    return <div>WebGPU not initialized</div>;
  }

  const applyBlur = () => {
    effects.blur(inputTexture, outputTexture, width, height);
  };

  return <button onClick={applyBlur}>Apply Blur</button>;
}
```

## GPU Animator

The `GPUAnimator` class provides GPU-accelerated animation interpolation with support for custom easing functions.

```typescript
import { GPUAnimator, WebGPUContext, GPUAnimation } from '@philjs/webgpu';

const ctx = new WebGPUContext();
await ctx.initialize();

const animator = new GPUAnimator(ctx);
await animator.initialize();

// Define an animation
const fadeIn: GPUAnimation = {
  id: 'fade-in',
  duration: 1000,  // milliseconds
  easing: (t) => t * t,  // ease-in quadratic
  update: (progress) => new Float32Array([progress])  // Returns opacity
};

// Add animation
animator.addAnimation(fadeIn);

// In your render loop
function animate(currentTime: number) {
  const results = animator.update(currentTime);

  const opacity = results.get('fade-in')?.[0] ?? 1;
  // Use opacity in your rendering...

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Remove animation when done
animator.removeAnimation('fade-in');
```

### Using the Hook

```typescript
import { useGPUAnimator } from '@philjs/webgpu';

function AnimatedComponent() {
  const animator = useGPUAnimator();

  if (!animator) {
    return <div>WebGPU not available</div>;
  }

  onMount(async () => {
    await animator.initialize();

    animator.addAnimation({
      id: 'scale',
      duration: 500,
      easing: (t) => t * (2 - t),  // ease-out
      update: (p) => new Float32Array([1 + p * 0.5])  // Scale from 1 to 1.5
    });
  });

  return <div>Animated content</div>;
}
```

## GPU Differ (Experimental)

The `GPUDiffer` class provides experimental GPU-accelerated DOM diffing for high-performance virtual DOM operations.

```typescript
import { GPUDiffer, WebGPUContext } from '@philjs/webgpu';

const ctx = new WebGPUContext({ enableCompute: true });
await ctx.initialize();

const differ = new GPUDiffer(ctx);
await differ.initialize();

// Define old and new virtual DOM trees
const oldTree = [
  { type: 'div', children: ['Hello'] },
  { type: 'span', children: ['World'] }
];

const newTree = [
  { type: 'div', children: ['Hello', 'There'] },
  { type: 'p', children: ['World'] }
];

// Compute the diff
const { patches, computeTime } = differ.diff(oldTree, newTree);

console.log(`Diff computed in ${computeTime.toFixed(2)}ms`);
console.log('Patches:', patches);
// [
//   { type: 'insert', path: [0, 1], value: 'There' },
//   { type: 'update', path: [1], value: { type: 'p', ... }, oldValue: { type: 'span', ... } }
// ]
```

### Patch Types

```typescript
interface DOMPatch {
  type: 'insert' | 'remove' | 'update' | 'move';
  path: number[];      // Path to the node in the tree
  value?: unknown;     // New value (for insert/update)
  oldValue?: unknown;  // Previous value (for remove/update)
}
```

## Built-in Shaders

The package includes several pre-built WGSL shaders for common operations:

```typescript
import { BuiltInShaders } from '@philjs/webgpu';
```

### Basic 2D Shader

Simple 2D rendering with per-vertex colors:

```wgsl
// BuiltInShaders.basic2D
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@vertex
fn vertexMain(@location(0) position: vec2f, @location(1) color: vec4f) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(position, 0.0, 1.0);
  output.color = color;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return input.color;
}
```

### Textured Quad Shader

Renders textured quads with texture sampling:

```wgsl
// BuiltInShaders.texturedQuad
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texCoord: vec2f,
};

@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var texture: texture_2d<f32>;

@vertex
fn vertexMain(@location(0) position: vec2f, @location(1) texCoord: vec2f) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(position, 0.0, 1.0);
  output.texCoord = texCoord;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return textureSample(texture, textureSampler, input.texCoord);
}
```

### Blur Compute Shader

5x5 box blur using compute shaders:

```wgsl
// BuiltInShaders.blur
@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let dimensions = textureDimensions(inputTexture);
  if (id.x >= dimensions.x || id.y >= dimensions.y) {
    return;
  }

  var color = vec4f(0.0);
  let kernelSize = 5;
  let halfKernel = kernelSize / 2;

  for (var dy = -halfKernel; dy <= halfKernel; dy++) {
    for (var dx = -halfKernel; dx <= halfKernel; dx++) {
      let sampleX = clamp(i32(id.x) + dx, 0, i32(dimensions.x) - 1);
      let sampleY = clamp(i32(id.y) + dy, 0, i32(dimensions.y) - 1);
      color += textureLoad(inputTexture, vec2i(sampleX, sampleY), 0);
    }
  }

  color /= f32(kernelSize * kernelSize);
  textureStore(outputTexture, vec2i(id.xy), color);
}
```

### Parallel Sum Shader

Parallel reduction for GPU-accelerated computations:

```wgsl
// BuiltInShaders.parallelSum
@group(0) @binding(0) var<storage, read> input: array<u32>;
@group(0) @binding(1) var<storage, read_write> output: array<u32>;

var<workgroup> sharedData: array<u32, 256>;

@compute @workgroup_size(256)
fn main(
  @builtin(local_invocation_id) localId: vec3u,
  @builtin(workgroup_id) groupId: vec3u
) {
  let globalId = groupId.x * 256u + localId.x;
  sharedData[localId.x] = input[globalId];
  workgroupBarrier();

  for (var stride = 128u; stride > 0u; stride /= 2u) {
    if (localId.x < stride) {
      sharedData[localId.x] += sharedData[localId.x + stride];
    }
    workgroupBarrier();
  }

  if (localId.x == 0u) {
    output[groupId.x] = sharedData[0];
  }
}
```

### Animation Shader

GPU-accelerated animation interpolation with multiple easing functions:

```wgsl
// BuiltInShaders.animate
struct AnimationData {
  startValue: vec4f,
  endValue: vec4f,
  progress: f32,
  easing: u32, // 0: linear, 1: easeIn, 2: easeOut, 3: easeInOut
};

@group(0) @binding(0) var<storage, read> animations: array<AnimationData>;
@group(0) @binding(1) var<storage, read_write> results: array<vec4f>;

fn easeInQuad(t: f32) -> f32 { return t * t; }
fn easeOutQuad(t: f32) -> f32 { return t * (2.0 - t); }
fn easeInOutQuad(t: f32) -> f32 {
  if (t < 0.5) { return 2.0 * t * t; }
  return -1.0 + (4.0 - 2.0 * t) * t;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let anim = animations[id.x];
  var t = anim.progress;

  switch (anim.easing) {
    case 1u: { t = easeInQuad(t); }
    case 2u: { t = easeOutQuad(t); }
    case 3u: { t = easeInOutQuad(t); }
    default: {}
  }

  results[id.x] = mix(anim.startValue, anim.endValue, t);
}
```

## Hooks Reference

### useWebGPU

Returns the current WebGPU state:

```typescript
function useWebGPU(): {
  supported: boolean;
  context: WebGPUContext | null;
  device: GPUDevice | null;
}
```

### useGPUCanvas

Creates a GPU-accelerated canvas:

```typescript
function useGPUCanvas(
  canvas: HTMLCanvasElement,
  config?: WebGPUConfig
): {
  initialize: () => Promise<boolean>;
  context: WebGPUContext | null;
  start: () => void;
  stop: () => void;
  onFrame: (callback: (dt: number) => void) => void;
}
```

### useGPUEffects

Returns GPU effects utilities:

```typescript
function useGPUEffects(): {
  blur: (input: GPUTexture, output: GPUTexture, w: number, h: number) => void;
} | null
```

### useGPUAnimator

Creates a GPU animator instance:

```typescript
function useGPUAnimator(): GPUAnimator | null
```

### initWebGPU

Initializes WebGPU globally:

```typescript
async function initWebGPU(config?: WebGPUConfig): Promise<WebGPUContext | null>
```

### getWebGPUContext

Returns the global WebGPU context:

```typescript
function getWebGPUContext(): WebGPUContext | null
```

### isWebGPUSupported

Async check for WebGPU support (attempts adapter request):

```typescript
async function isWebGPUSupported(): Promise<boolean>
```

### isWebGPUSupportedSync

Sync check for WebGPU support (checks navigator.gpu existence):

```typescript
function isWebGPUSupportedSync(): boolean
```

## Types Reference

### WebGPUConfig

```typescript
interface WebGPUConfig {
  /** Canvas element or CSS selector */
  canvas?: HTMLCanvasElement | string;
  /** Preferred GPU power mode */
  powerPreference?: 'low-power' | 'high-performance';
  /** Enable compute shader support */
  enableCompute?: boolean;
  /** Enable antialiasing */
  antialias?: boolean;
  /** Alpha compositing mode */
  alphaMode?: 'opaque' | 'premultiplied';
  /** Maximum buffer size in bytes (default: 256MB) */
  maxBufferSize?: number;
}
```

### GPUComponentProps

```typescript
interface GPUComponentProps {
  width: number;
  height: number;
  render: (ctx: GPURenderContext) => void;
  compute?: (ctx: GPUComputeContext) => void;
  onFrame?: (deltaTime: number) => void;
}
```

### GPURenderContext

```typescript
interface GPURenderContext {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  encoder: GPUCommandEncoder;
  pass: GPURenderPassEncoder;
  createBuffer: (data: Float32Array | Uint32Array, usage: GPUBufferUsageFlags) => GPUBuffer;
  createTexture: (width: number, height: number, format?: GPUTextureFormat) => GPUTexture;
  createPipeline: (descriptor: GPURenderPipelineDescriptor) => GPURenderPipeline;
}
```

### GPUComputeContext

```typescript
interface GPUComputeContext {
  device: GPUDevice;
  encoder: GPUCommandEncoder;
  pass: GPUComputePassEncoder;
  createBuffer: (data: Float32Array | Uint32Array, usage: GPUBufferUsageFlags) => GPUBuffer;
  createPipeline: (descriptor: GPUComputePipelineDescriptor) => GPUComputePipeline;
  dispatch: (pipeline: GPUComputePipeline, x: number, y?: number, z?: number) => void;
}
```

### ShaderModule

```typescript
interface ShaderModule {
  vertex?: string;
  fragment?: string;
  compute?: string;
}
```

### GPUAnimation

```typescript
interface GPUAnimation {
  id: string;
  duration: number;  // milliseconds
  easing: (t: number) => number;
  update: (progress: number) => Float32Array;
}
```

### ParallelDiffResult

```typescript
interface ParallelDiffResult {
  patches: DOMPatch[];
  computeTime: number;  // milliseconds
}
```

### DOMPatch

```typescript
interface DOMPatch {
  type: 'insert' | 'remove' | 'update' | 'move';
  path: number[];
  value?: unknown;
  oldValue?: unknown;
}
```

## API Reference

| Export | Type | Description |
|--------|------|-------------|
| `WebGPUContext` | Class | Core WebGPU context manager with resource caching |
| `GPUCanvas` | Class | High-level GPU canvas with render loop |
| `GPUEffects` | Class | GPU-accelerated image effects (blur, etc.) |
| `GPUAnimator` | Class | GPU-accelerated animation system |
| `GPUDiffer` | Class | Experimental GPU DOM diffing |
| `BuiltInShaders` | Object | Pre-built WGSL shaders |
| `initWebGPU` | Function | Initialize global WebGPU context |
| `getWebGPUContext` | Function | Get global context |
| `isWebGPUSupported` | Function | Async support check |
| `isWebGPUSupportedSync` | Function | Sync support check |
| `useWebGPU` | Hook | Get WebGPU state |
| `useGPUCanvas` | Hook | Create GPU canvas |
| `useGPUEffects` | Hook | Get GPU effects |
| `useGPUAnimator` | Hook | Get GPU animator |

## Browser Support

WebGPU is a modern API with growing browser support:

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 113+ | Enabled by default |
| Edge | 113+ | Enabled by default |
| Firefox | Nightly | Behind flag |
| Safari | Technology Preview | Partial support |

Always use `isWebGPUSupported()` to check availability and provide graceful fallbacks:

```typescript
import { isWebGPUSupported } from '@philjs/webgpu';

async function initApp() {
  if (await isWebGPUSupported()) {
    // Use WebGPU
    await initWebGPU();
  } else {
    // Fall back to Canvas 2D or WebGL
    initFallbackRenderer();
  }
}
```

## Best Practices

1. **Always check for support** - WebGPU is not available everywhere
2. **Use caching** - Label your buffers, textures, and pipelines for automatic caching
3. **Batch operations** - Minimize command encoder submissions
4. **Handle device loss** - WebGPU devices can be lost; implement recovery
5. **Clean up resources** - Call `destroy()` when done with contexts
6. **Use compute for parallel work** - Move heavy computations to the GPU
7. **Profile your shaders** - Avoid divergent branching in WGSL

## Complete Example

```typescript
import {
  initWebGPU,
  GPUCanvas,
  BuiltInShaders,
  isWebGPUSupported
} from '@philjs/webgpu';

async function main() {
  // Check support
  if (!await isWebGPUSupported()) {
    console.error('WebGPU not supported');
    return;
  }

  // Get canvas
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  // Create GPU canvas
  const gpuCanvas = new GPUCanvas(canvas, {
    powerPreference: 'high-performance',
    antialias: true
  });

  // Initialize
  if (!await gpuCanvas.initialize()) {
    console.error('Failed to initialize WebGPU');
    return;
  }

  const ctx = gpuCanvas.getContext();
  const device = ctx.getDevice()!;

  // Create shader module
  const shader = ctx.createShaderModule(BuiltInShaders.basic2D, 'basic');

  // Create pipeline
  const pipeline = ctx.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shader,
      entryPoint: 'vertexMain',
      buffers: [{
        arrayStride: 24,
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' },
          { shaderLocation: 1, offset: 8, format: 'float32x4' }
        ]
      }]
    },
    fragment: {
      module: shader,
      entryPoint: 'fragmentMain',
      targets: [{ format: ctx.getFormat() }]
    }
  }, 'triangle-pipeline');

  // Create vertex buffer
  const vertices = new Float32Array([
    // x, y, r, g, b, a
    -0.5, -0.5, 1.0, 0.0, 0.0, 1.0,
     0.5, -0.5, 0.0, 1.0, 0.0, 1.0,
     0.0,  0.5, 0.0, 0.0, 1.0, 1.0,
  ]);

  const vertexBuffer = ctx.createBuffer(
    vertices,
    GPUBufferUsage.VERTEX,
    'triangle-verts'
  );

  // Animation state
  let rotation = 0;

  // Render loop
  gpuCanvas.onFrame((dt) => {
    rotation += dt;

    const result = ctx.beginRenderPass();
    if (result) {
      const { encoder, pass } = result;

      pass.setPipeline(pipeline);
      pass.setVertexBuffer(0, vertexBuffer);
      pass.draw(3);
      pass.end();

      ctx.submit(encoder);
    }
  });

  // Start rendering
  gpuCanvas.start();
}

main();
```

## Next Steps

- Learn about [WebGPU fundamentals](https://gpuweb.github.io/gpuweb/)
- Explore [WGSL shader language](https://www.w3.org/TR/WGSL/)
- See [PhilJS Motion](../motion/overview.md) for high-level animations
- Check [PhilJS 3D](../3d/overview.md) for 3D rendering
