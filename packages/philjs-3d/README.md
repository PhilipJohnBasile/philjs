# PhilJS 3D

WebGL and game engine integrations for PhilJS. This package provides comprehensive 3D graphics and game engine support, making PhilJS competitive for game development and 3D web experiences.

## Features

- **WebGL Integration** - Low-level WebGL with shaders, buffers, textures, and primitives
- **Three.js Integration** - Hooks and components for Three.js
- **Godot Integration** - Embed Godot HTML5 exports with bidirectional communication
- **Unreal Engine Integration** - Pixel Streaming support for UE5
- **Unity Integration** - Embed Unity WebGL builds with message passing

## Installation

```bash
npm install philjs-3d
```

## WebGL Integration

Full WebGL support with WebGL2 fallback:

```typescript
import {
  createWebGLContext,
  createProgram,
  createCube,
  createCamera,
  createAnimationLoop,
  WebGLCanvas,
} from 'philjs-3d/webgl';

// Create WebGL context
const { gl, isWebGL2 } = createWebGLContext(canvas, {
  antialias: true,
  preferWebGL2: true,
});

// Create shader program
const program = createProgram(gl, {
  vertex: vertexShaderSource,
  fragment: fragmentShaderSource,
});

// Create geometry
const cube = createCube(1);

// Create camera
const camera = createCamera({
  position: [0, 2, 5],
  target: [0, 0, 0],
  fov: Math.PI / 4,
});

// Animation loop
const loop = createAnimationLoop((info) => {
  // Render frame
});
loop.start();
```

### WebGLCanvas Component

```tsx
<WebGLCanvas
  width={800}
  height={600}
  onInit={(result) => {
    // Initialize scene
  }}
  onFrame={(info, gl) => {
    // Render frame
  }}
/>
```

## Three.js Integration

Seamless Three.js integration with PhilJS hooks:

```typescript
import {
  useThree,
  useFrame,
  loadThree,
  ThreeCanvas,
} from 'philjs-3d/three';

// Load Three.js
const THREE = await loadThree();

// Create scene
const state = await initThree(canvas, {
  antialias: true,
  shadows: true,
  camera: {
    fov: 75,
    position: [0, 2, 5],
  },
});

// Add objects
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
state.scene.add(cube);

// Animation
useFrame(canvas, ({ time, delta }) => {
  cube.rotation.x += delta;
  cube.rotation.y += delta;
});
```

### ThreeCanvas Component

```tsx
<ThreeCanvas
  width={800}
  height={600}
  camera={{ position: [0, 2, 5] }}
  onCreated={(state) => {
    // Setup scene
  }}
  onFrame={(state, delta) => {
    // Animate
  }}
/>
```

## Godot Integration

Embed Godot HTML5 exports with signal communication:

```typescript
import {
  GodotEmbed,
  useGodot,
  callGodot,
  onGodotSignal,
} from 'philjs-3d/godot';

// Use Godot hook
const { godot, isLoading, callGodot, onGodotSignal } = useGodot(canvas);

// Call Godot methods
callGodot('/root/Player', 'take_damage', 10);

// Listen to Godot signals
const cleanup = onGodotSignal('/root/Player', 'health_changed', (health) => {
  console.log('Health:', health);
});
```

### GodotEmbed Component

```tsx
<GodotEmbed
  pckPath="/game/game.pck"
  width={1280}
  height={720}
  onReady={(godot) => {
    // Game ready
  }}
  onProgress={(current, total) => {
    // Loading progress
  }}
/>
```

## Unreal Engine Integration

Pixel Streaming for Unreal Engine 5:

```typescript
import {
  UnrealEmbed,
  useUnreal,
  setupInputForwarding,
} from 'philjs-3d/unreal';

// Use Unreal hook
const { unreal, isConnected, stats, executeCommand } = useUnreal(video);

// Execute console commands
executeCommand('r.ScreenPercentage 100');

// Send custom messages
unreal.sendMessage('CustomEvent', { data: 'value' });

// Listen to events
unreal.on('message', (data) => {
  console.log('From UE:', data);
});
```

### UnrealEmbed Component

```tsx
<UnrealEmbed
  serverUrl="wss://your-signaling-server.com"
  width={1920}
  height={1080}
  enableInput={true}
  showControls={true}
  onConnect={(instance) => {
    // Connected
  }}
  onStats={(stats) => {
    // FPS, latency, etc.
  }}
/>
```

## Unity Integration

Embed Unity WebGL builds:

```typescript
import {
  UnityEmbed,
  useUnity,
  sendMessage,
  registerUnityCallback,
} from 'philjs-3d/unity';

// Use Unity hook
const { unity, isReady, progress, sendMessage } = useUnity(canvas);

// Send messages to Unity
sendMessage('Player', 'TakeDamage', 10);

// Register callbacks for Unity to call
registerUnityCallback('OnScoreUpdate', (score) => {
  console.log('Score:', score);
});

// Signal bridges
createUnitySignalBridge('OnHealthChange', setHealth);
createPhilJSSignalBridge(canvas, 'GameManager', 'SetDifficulty', getDifficulty);
```

### UnityEmbed Component

```tsx
<UnityEmbed
  buildUrl="/unity-build/Build"
  width={960}
  height={600}
  showProgress={true}
  onReady={(unity) => {
    // Unity ready
  }}
  onProgress={(progress) => {
    // Loading progress
  }}
/>
```

## API Reference

### WebGL

- `createWebGLContext(canvas, options)` - Initialize WebGL context
- `createProgram(gl, source)` - Create shader program
- `createCube/Sphere/Plane/Cylinder/Torus(size)` - Create primitives
- `createCamera(options)` - Create camera
- `createAnimationLoop(callback)` - Create animation loop
- `useWebGL(canvas, options)` - Hook for WebGL

### Three.js

- `loadThree()` - Load Three.js dynamically
- `initThree(canvas, options)` - Initialize Three.js
- `useThree(canvas)` - Get Three.js state
- `useFrame(canvas, callback)` - Animation frame hook
- `useLoader(loader, url)` - Asset loading hook

### Godot

- `createGodotInstance(canvas, props)` - Create Godot instance
- `useGodot(canvas)` - Hook for Godot
- `callGodot(canvas, nodePath, method, args)` - Call Godot method
- `onGodotSignal(canvas, nodePath, signal, callback)` - Listen to signal
- `createGodotBridge(canvas, nodePath, options)` - Bidirectional sync

### Unreal

- `createPixelStreamingInstance(video, props)` - Create Pixel Streaming
- `useUnreal(video)` - Hook for Unreal
- `setupInputForwarding(video, instance)` - Forward inputs

### Unity

- `createUnityInstance(canvas, props)` - Create Unity instance
- `useUnity(canvas)` - Hook for Unity
- `sendMessage(canvas, gameObject, method, param)` - Send message
- `registerUnityCallback(name, handler)` - Register callback
- `createUnitySignalBridge(name, setValue)` - Unity to PhilJS
- `createPhilJSSignalBridge(canvas, gameObject, method, getValue)` - PhilJS to Unity

## License

MIT
