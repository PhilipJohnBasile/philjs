# WebGPU and High-Performance Rendering

Use WebGPU for advanced graphics and compute workloads. PhilJS can orchestrate UI + control flows while WebGPU handles heavy rendering.

## When to use WebGPU

- 3D scenes, data viz beyond Canvas2D/WebGL.
- GPGPU compute (image processing, ML inference) when WASM alone isn’t enough.
- Offloading CPU-heavy work to the GPU.

## Setup

- Ensure browser support; feature-detect and provide fallbacks.
- Use `@philjs/webgpu` helpers (if available) or raw WebGPU API.
- Keep shaders in dedicated `.wgsl` files and load asynchronously.

## Basic pipeline (sketch)

```typescript
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const context = canvas.getContext('webgpu');
context.configure({ device, format: navigator.gpu.getPreferredCanvasFormat() });
```

Use PhilJS signals to manage UI state (camera params, toggles) and pass them into uniform buffers.

## Performance tips

- Reuse pipelines; avoid recreating per frame.
- Double-buffer uniforms; batch updates.
- Avoid large JS<->GPU copies; keep data on GPU as long as possible.
- Throttle renders when hidden; use `requestAnimationFrame` wisely.

## SSR/Islands with WebGPU

- Render UI server-side; hydrate a small island that owns the canvas.
- Lazy-load WebGPU code on interaction/visibility.
- Provide a “fallback image” or WebGL/Canvas2D version for unsupported devices.

## Testing

- Feature-detect in tests; mock WebGPU interfaces where needed.
- Visual diff key frames with Playwright screenshots for critical scenes.
- Benchmark compute shaders with small, deterministic inputs.

## Safety and compatibility

- Guard for unsupported browsers; show a friendly message and fallbacks.
- Keep shaders deterministic; validate inputs before sending to GPU.
- For privacy/security, avoid exposing precise timing data unnecessarily.
