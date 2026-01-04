# @philjs/3d

The `@philjs/3d` package provides comprehensive 3D graphics and game engine integration for PhilJS, including WebGL, Three.js, Godot, Unreal Engine, Unity, and Bevy (Rust) support.

## Installation

```bash
npm install @philjs/3d
```

## Features

- **WebGL Integration** - Shaders, buffers, textures, primitives, camera, animation
- **Three.js Integration** - Hooks, components, loaders, animation loop
- **Godot Integration** - HTML5 export embedding, signal bridge
- **Unreal Engine** - Pixel Streaming support
- **Unity Integration** - WebGL build embedding, message passing
- **Bevy Integration** - Rust game engine ECS bridge (PhilJS exclusive!)

## Sub-packages

Import from specific integrations:

```typescript
// WebGL
import { createWebGLContext, createCube, useWebGL } from '@philjs/3d';

// Three.js
import { useThree, useFrame, ThreeCanvas } from '@philjs/3d';

// Godot
import { GodotEmbed, useGodot, callGodot } from '@philjs/3d';

// Unreal
import { UnrealEmbed, useUnreal } from '@philjs/3d';

// Unity
import { UnityEmbed, useUnity, sendMessage } from '@philjs/3d';

// Bevy (PhilJS exclusive!)
import { BevyEmbed, useBevy, spawnEntity } from '@philjs/3d';
```

---

## WebGL Integration

Low-level WebGL access with helper utilities.

### Context Creation

```typescript
import {
  createWebGLContext,
  isWebGLSupported,
  isWebGL2Supported,
  getWebGLCapabilities,
  resizeCanvas,
  clearContext,
  enableDefaultFeatures,
} from '@philjs/3d';
import type { WebGLContextOptions, WebGLContextResult } from '@philjs/3d';

// Check support
if (!isWebGLSupported()) {
  console.log('WebGL not supported');
}

// Create context
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const { gl, extensions } = createWebGLContext(canvas, {
  antialias: true,
  alpha: false,
  depth: true,
  stencil: false,
  preserveDrawingBuffer: false,
});

// Enable common features
enableDefaultFeatures(gl);

// Get capabilities
const caps = getWebGLCapabilities(gl);
console.log('Max texture size:', caps.maxTextureSize);

// Handle resize
window.addEventListener('resize', () => {
  resizeCanvas(canvas, window.innerWidth, window.innerHeight);
});

// Clear context
clearContext(gl, [0.1, 0.1, 0.1, 1.0]);
```

### Shaders

```typescript
import {
  compileShader,
  createProgram,
  useProgram,
  setUniform,
  setUniforms,
  BASIC_VERTEX_SHADER,
  BASIC_FRAGMENT_SHADER,
  TEXTURED_VERTEX_SHADER,
  TEXTURED_FRAGMENT_SHADER,
} from '@philjs/3d';

// Use built-in shaders
const program = createProgram(gl, BASIC_VERTEX_SHADER, BASIC_FRAGMENT_SHADER);
useProgram(gl, program);

// Set uniforms
setUniform(gl, program, 'uModelViewMatrix', modelViewMatrix);
setUniform(gl, program, 'uProjectionMatrix', projectionMatrix);

// Set multiple uniforms
setUniforms(gl, program, {
  uColor: [1.0, 0.0, 0.0, 1.0],
  uTime: performance.now() / 1000,
});

// Custom shaders
const customVertex = `
  attribute vec3 aPosition;
  uniform mat4 uMVP;
  void main() {
    gl_Position = uMVP * vec4(aPosition, 1.0);
  }
`;

const customFragment = `
  precision mediump float;
  uniform vec4 uColor;
  void main() {
    gl_FragColor = uColor;
  }
`;

const customProgram = createProgram(gl, customVertex, customFragment);
```

### Buffers and Vertex Arrays

```typescript
import {
  createBuffer,
  createBufferInfo,
  updateBuffer,
  createVertexArray,
  createVertexArrayInfo,
  setupVertexAttributes,
  drawVertexArray,
} from '@philjs/3d';

// Create buffer
const positionBuffer = createBuffer(gl, new Float32Array([
  -1, -1, 0,
   1, -1, 0,
   0,  1, 0,
]));

// Create vertex array object
const vao = createVertexArray(gl);
bindVertexArray(gl, vao);
setupVertexAttributes(gl, program, {
  aPosition: { buffer: positionBuffer, size: 3 },
});

// Draw
drawVertexArray(gl, vao, gl.TRIANGLES, 3);
```

### Textures

```typescript
import {
  loadTexture,
  createTextureFromImage,
  createDataTexture,
  createCubemapTexture,
  bindTexture,
} from '@philjs/3d';

// Load texture from URL
const texture = await loadTexture(gl, '/textures/diffuse.jpg');

// Create from image element
const imgTexture = createTextureFromImage(gl, imageElement);

// Create data texture
const dataTexture = createDataTexture(gl, {
  data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]),
  width: 2,
  height: 1,
});

// Create cubemap
const cubemap = await createCubemapTexture(gl, {
  posX: '/textures/sky_px.jpg',
  negX: '/textures/sky_nx.jpg',
  posY: '/textures/sky_py.jpg',
  negY: '/textures/sky_ny.jpg',
  posZ: '/textures/sky_pz.jpg',
  negZ: '/textures/sky_nz.jpg',
});

// Bind texture to unit
bindTexture(gl, texture, 0);
setUniform(gl, program, 'uTexture', 0);
```

### Camera and Math

```typescript
import {
  createCamera,
  updateCameraView,
  updateCameraProjection,
  setCameraPosition,
  setCameraTarget,
  orbitCamera,
  zoomCamera,
  getViewProjectionMatrix,
  mat4Perspective,
  mat4LookAt,
  mat4Multiply,
  mat4Translate,
  mat4RotateY,
} from '@philjs/3d';

// Create camera
const camera = createCamera({
  position: [0, 5, 10],
  target: [0, 0, 0],
  up: [0, 1, 0],
  fov: 60,
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 1000,
});

// Update camera
setCameraPosition(camera, [5, 5, 15]);
setCameraTarget(camera, [0, 0, 0]);
updateCameraView(camera);
updateCameraProjection(camera);

// Orbit controls
canvas.addEventListener('mousemove', (e) => {
  if (e.buttons === 1) {
    orbitCamera(camera, e.movementX * 0.01, e.movementY * 0.01);
  }
});

canvas.addEventListener('wheel', (e) => {
  zoomCamera(camera, e.deltaY * 0.01);
});

// Get matrices
const vp = getViewProjectionMatrix(camera);
setUniform(gl, program, 'uViewProjection', vp);
```

### Primitives

```typescript
import {
  createCube,
  createSphere,
  createPlane,
  createCylinder,
  createCone,
  createTorus,
  createRoundedBox,
  mergeGeometries,
  transformGeometry,
} from '@philjs/3d';

// Create primitives
const cube = createCube(1); // size
const sphere = createSphere(0.5, 32, 32); // radius, segments
const plane = createPlane(10, 10); // width, height
const cylinder = createCylinder(0.5, 2, 16); // radius, height, segments
const cone = createCone(0.5, 1.5, 16);
const torus = createTorus(1, 0.3, 16, 32);
const roundedBox = createRoundedBox(1, 1, 1, 0.1, 4);

// Merge geometries
const combined = mergeGeometries([cube, sphere]);

// Transform geometry
const scaled = transformGeometry(cube, {
  scale: [2, 1, 1],
  rotation: [0, Math.PI / 4, 0],
  translation: [0, 1, 0],
});
```

### Animation Loop

```typescript
import {
  createAnimationLoop,
  createFixedTimestepLoop,
  createAnimator,
  Easing,
  lerp,
  lerpVec3,
} from '@philjs/3d';

// Basic animation loop
const loop = createAnimationLoop((time, delta) => {
  // Update
  rotation += delta * 0.001;

  // Render
  clearContext(gl);
  setUniform(gl, program, 'uRotation', rotation);
  drawVertexArray(gl, vao, gl.TRIANGLES, 36);
});

loop.start();
// loop.stop();

// Fixed timestep for physics
const physicsLoop = createFixedTimestepLoop({
  timestep: 1000 / 60, // 60 FPS
  update: (dt) => {
    // Physics update
  },
  render: (alpha) => {
    // Interpolated render
  },
});

// Value animation
const animator = createAnimator();
animator.animate({
  from: 0,
  to: 1,
  duration: 1000,
  easing: Easing.easeInOutQuad,
  onUpdate: (value) => {
    object.opacity = value;
  },
});
```

### WebGL Hooks

```typescript
import {
  useWebGL,
  useAnimationFrame,
  useShaderProgram,
  useCamera,
  useAutoResize,
  useRenderPass,
  WebGLCanvas,
} from '@philjs/3d';

// WebGL context hook
function Scene() {
  const { gl, canvas } = useWebGL('canvas-id');

  useAnimationFrame((time, delta) => {
    // Render loop
  });

  return <WebGLCanvas id="canvas-id" width={800} height={600} />;
}
```

---

## Three.js Integration

React-style hooks and components for Three.js.

### Basic Setup

```typescript
import {
  loadThree,
  initThree,
  useThree,
  useFrame,
  ThreeCanvas,
  addToScene,
  removeFromScene,
} from '@philjs/3d';
import type { ThreeState, FrameInfo } from '@philjs/3d';

// Initialize Three.js
await loadThree();
const state = initThree(document.getElementById('container')!);

// Access state
const { scene, camera, renderer, clock } = state;

// Add objects
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
addToScene(cube);

// Animation loop
useFrame((info: FrameInfo) => {
  cube.rotation.x += info.delta * 0.5;
  cube.rotation.y += info.delta * 0.5;
});

// Start loop
startAnimationLoop();
```

### useThree Hook

```typescript
import { useThree } from '@philjs/3d';

function MyComponent() {
  const { scene, camera, renderer, gl, size } = useThree();

  // Access Three.js objects
  console.log('Canvas size:', size.width, size.height);

  return null;
}
```

### useFrame Hook

```typescript
import { useFrame, removeFrameCallback } from '@philjs/3d';

function RotatingCube() {
  const meshRef = useRef();

  useFrame((info) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += info.delta;
    }
  });

  return <mesh ref={meshRef} />;
}
```

### Asset Loading

```typescript
import { useLoader, loadTextureAsync, loadGLTFAsync } from '@philjs/3d';

// Load texture
const texture = await loadTextureAsync('/textures/wood.jpg');

// Load GLTF model
const gltf = await loadGLTFAsync('/models/character.glb');
addToScene(gltf.scene);

// With hook
function Model() {
  const gltf = useLoader('gltf', '/models/character.glb');
  return gltf ? <primitive object={gltf.scene} /> : null;
}
```

### ThreeCanvas Component

```typescript
import { ThreeCanvas, createThreeCanvasElement } from '@philjs/3d';
import type { ThreeCanvasProps } from '@philjs/3d';

// JSX usage
function App() {
  return (
    <ThreeCanvas
      width={800}
      height={600}
      antialias={true}
      alpha={false}
      onCreated={(state) => {
        console.log('Three.js ready:', state);
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </ThreeCanvas>
  );
}
```

---

## Godot Integration

Embed Godot HTML5 exports in PhilJS applications.

### Basic Setup

```typescript
import {
  GodotEmbed,
  createGodotInstance,
  useGodot,
  callGodot,
  onGodotSignal,
  disposeGodot,
} from '@philjs/3d';
import type { GodotConfig, GodotState, UseGodotResult } from '@philjs/3d';

// Create Godot instance
const godot = await createGodotInstance({
  executable: '/godot/game.wasm',
  mainPack: '/godot/game.pck',
  canvas: document.getElementById('game-canvas'),
});

// Call Godot methods
callGodot('MyNode', 'my_method', [arg1, arg2]);

// Listen for signals
onGodotSignal('MyNode', 'my_signal', (data) => {
  console.log('Signal received:', data);
});

// Sync PhilJS state to Godot
syncToGodot('PlayerState', { health: 100, score: 500 });

// Sync from Godot to PhilJS
const state = syncFromGodot('GameState');
```

### useGodot Hook

```typescript
import { useGodot } from '@philjs/3d';

function GodotGame() {
  const { instance, isLoading, error, call, onSignal } = useGodot({
    executable: '/godot/game.wasm',
    mainPack: '/godot/game.pck',
  });

  useEffect(() => {
    if (!instance) return;

    // Listen for game events
    const unsub = onSignal('GameManager', 'score_changed', (score) => {
      updateScore(score);
    });

    return unsub;
  }, [instance]);

  if (isLoading) return <div>Loading Godot...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <GodotEmbed instance={instance} />;
}
```

### GodotEmbed Component

```typescript
import { GodotEmbed, GodotLoadingIndicator } from '@philjs/3d';

function Game() {
  return (
    <GodotEmbed
      executable="/godot/game.wasm"
      mainPack="/godot/game.pck"
      width={1280}
      height={720}
      onReady={(instance) => console.log('Godot ready')}
      onError={(error) => console.error('Godot error:', error)}
    >
      <GodotLoadingIndicator />
    </GodotEmbed>
  );
}
```

---

## Unreal Engine Integration

Pixel Streaming support for Unreal Engine.

```typescript
import {
  UnrealEmbed,
  createPixelStreamingInstance,
  useUnreal,
  setupInputForwarding,
  disposeUnreal,
} from '@philjs/3d';
import type { PixelStreamingConfig, UnrealState } from '@philjs/3d';

// Create Pixel Streaming instance
const unreal = await createPixelStreamingInstance({
  signalingUrl: 'ws://localhost:8888',
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  autoConnect: true,
});

// Setup input forwarding
setupInputForwarding(unreal, document.getElementById('stream-container'));

// Send custom events
unreal.sendCustomEvent('UIClick', { buttonId: 'start-game' });
```

### useUnreal Hook

```typescript
import { useUnreal } from '@philjs/3d';

function UnrealGame() {
  const { instance, isConnected, stats, sendEvent } = useUnreal({
    signalingUrl: 'ws://localhost:8888',
  });

  return (
    <div>
      <UnrealEmbed instance={instance} />
      <UnrealStatsOverlay stats={stats} />
      <button onClick={() => sendEvent('Pause', {})}>Pause</button>
    </div>
  );
}
```

---

## Unity Integration

Embed Unity WebGL builds.

```typescript
import {
  UnityEmbed,
  createUnityInstance,
  useUnity,
  sendMessage,
  onUnityEvent,
  registerUnityCallback,
} from '@philjs/3d';
import type { UnityConfig, UnityState } from '@philjs/3d';

// Create Unity instance
const unity = await createUnityInstance({
  loaderUrl: '/unity/Build/game.loader.js',
  dataUrl: '/unity/Build/game.data',
  frameworkUrl: '/unity/Build/game.framework.js',
  codeUrl: '/unity/Build/game.wasm',
  canvas: document.getElementById('unity-canvas'),
});

// Send message to Unity
sendMessage('GameManager', 'StartGame', '');
sendMessage('Player', 'SetHealth', 100);

// Receive events from Unity
onUnityEvent('ScoreUpdate', (score) => {
  console.log('Score:', score);
});

// Register callback for Unity to call
registerUnityCallback('OnPlayerDeath', () => {
  showGameOverScreen();
});
```

### useUnity Hook

```typescript
import { useUnity } from '@philjs/3d';

function UnityGame() {
  const {
    instance,
    isLoading,
    loadingProgress,
    error,
    sendMessage,
    onEvent,
  } = useUnity({
    loaderUrl: '/unity/Build/game.loader.js',
    dataUrl: '/unity/Build/game.data',
    frameworkUrl: '/unity/Build/game.framework.js',
    codeUrl: '/unity/Build/game.wasm',
  });

  if (isLoading) {
    return <UnityProgressBar progress={loadingProgress} />;
  }

  return (
    <div>
      <UnityEmbed instance={instance} />
      <button onClick={() => sendMessage('UI', 'TogglePause', '')}>
        Pause
      </button>
    </div>
  );
}
```

---

## Bevy Integration (PhilJS Exclusive!)

First-class integration with the Bevy game engine (Rust).

### Basic Setup

```typescript
import {
  BevyEmbed,
  createBevyInstance,
  useBevy,
  spawnEntity,
  despawnEntity,
  insertComponent,
  queryEntities,
} from '@philjs/3d';
import type { BevyConfig, BevyState, EntityId } from '@philjs/3d';

// Create Bevy instance
const bevy = await createBevyInstance({
  wasmUrl: '/bevy/game.wasm',
  canvas: document.getElementById('bevy-canvas'),
});

// Spawn entity with components
const entityId = spawnEntity(bevy, [
  createTransformComponent({ x: 0, y: 1, z: 0 }),
  createNameComponent('Player'),
  createVisibilityComponent(true),
]);

// Insert component
insertComponent(bevy, entityId, {
  type: 'Health',
  data: { current: 100, max: 100 },
});

// Query entities
const players = queryEntities(bevy, {
  with: ['Player', 'Health'],
  without: ['Dead'],
});
```

### ECS Bridge

Sync PhilJS signals with Bevy ECS:

```typescript
import {
  createEntityBridge,
  createComponentBridge,
  trackEntity,
  trackEntities,
  setSignalCreator,
} from '@philjs/3d';
import { createSignal } from '@philjs/core';

// Set signal creator for bridge
setSignalCreator(createSignal);

// Bridge an entity to signals
const playerBridge = createEntityBridge(bevy, playerId, {
  components: ['Transform', 'Health', 'Inventory'],
});

// Access synced data
const position = playerBridge.transform.position(); // Signal
const health = playerBridge.health.current(); // Signal

// Bridge specific component
const healthBridge = createComponentBridge(bevy, playerId, 'Health');
healthBridge.onChange((health) => {
  console.log('Health changed:', health.current);
});

// Track multiple entities
const enemies = trackEntities(bevy, {
  query: { with: ['Enemy'] },
  components: ['Transform', 'Health'],
});
```

### Bevy Events

```typescript
import { onBevyEvent, sendBevyEvent } from '@philjs/3d';
import type { BevyEvent, BevyEventData } from '@philjs/3d';

// Listen for Bevy events
onBevyEvent(bevy, 'PlayerDamaged', (event: BevyEventData) => {
  console.log('Player took damage:', event.damage);
  showDamageNumber(event.damage);
});

// Send event to Bevy
sendBevyEvent(bevy, 'UIAction', {
  action: 'OpenInventory',
  playerId: 1,
});
```

### Asset Management

```typescript
import {
  loadBevyAsset,
  preloadAssets,
  defineAssetBundle,
  loadAssetBundle,
  getCacheSize,
} from '@philjs/3d';

// Load single asset
const handle = await loadBevyAsset(bevy, {
  path: 'models/character.gltf',
  type: 'Scene',
});

// Preload multiple assets
await preloadAssets(bevy, [
  { path: 'textures/diffuse.png', type: 'Image' },
  { path: 'audio/music.ogg', type: 'AudioSource' },
  { path: 'fonts/main.ttf', type: 'Font' },
]);

// Define asset bundle
defineAssetBundle('level-1', [
  { path: 'levels/level1.scene', type: 'Scene', priority: 0 },
  { path: 'textures/level1/*.png', type: 'Image', priority: 1 },
  { path: 'audio/level1/*.ogg', type: 'AudioSource', priority: 2 },
]);

// Load bundle
await loadAssetBundle(bevy, 'level-1', (progress) => {
  console.log('Loading:', progress.percent + '%');
});
```

### useBevy Hook

```typescript
import { useBevy, useBevyEntity, useBevyQuery, useBevyResource } from '@philjs/3d';

function BevyGame() {
  const { instance, isLoading, error } = useBevy({
    wasmUrl: '/bevy/game.wasm',
  });

  if (isLoading) return <BevyFPSCounter />;

  return (
    <div>
      <BevyEmbed instance={instance} />
      <PlayerHUD />
    </div>
  );
}

function PlayerHUD() {
  const { entity, components } = useBevyEntity('player', {
    components: ['Health', 'Stamina', 'Inventory'],
  });

  if (!entity) return null;

  return (
    <div className="hud">
      <HealthBar value={components.health.current} max={components.health.max} />
      <StaminaBar value={components.stamina.current} />
      <InventorySlots items={components.inventory.items} />
    </div>
  );
}

function EnemyList() {
  const { entities } = useBevyQuery({
    with: ['Enemy', 'Transform', 'Health'],
    without: ['Dead'],
  });

  return (
    <ul>
      {entities.map((enemy) => (
        <li key={enemy.id}>
          Enemy at ({enemy.transform.x}, {enemy.transform.y})
          HP: {enemy.health.current}
        </li>
      ))}
    </ul>
  );
}
```

---

## Types Reference

Key types for the 3D package:

```typescript
// WebGL types
interface WebGLContextResult {
  gl: WebGL2RenderingContext;
  extensions: WebGLExtensions;
}

interface Camera {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fov: number;
  aspect: number;
  near: number;
  far: number;
  viewMatrix: Mat4;
  projectionMatrix: Mat4;
}

// Three.js types
interface ThreeState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  gl: WebGLRenderingContext;
  clock: THREE.Clock;
  size: { width: number; height: number };
}

// Bevy types
type EntityId = number;

interface BevyEntity {
  id: EntityId;
  generation: number;
}

interface TransformComponent {
  translation: Vec3;
  rotation: Quat;
  scale: Vec3;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}
```

---

## API Reference

### WebGL

| Export | Description |
|--------|-------------|
| `createWebGLContext` | Create WebGL context |
| `createProgram` | Create shader program |
| `createBuffer` | Create vertex buffer |
| `createTexture` | Create texture |
| `createCamera` | Create camera |
| `createCube/Sphere/Plane` | Create primitives |
| `useWebGL` | WebGL hook |
| `WebGLCanvas` | Canvas component |

### Three.js

| Export | Description |
|--------|-------------|
| `loadThree` | Load Three.js |
| `useThree` | Access Three.js state |
| `useFrame` | Animation frame hook |
| `useLoader` | Asset loader hook |
| `ThreeCanvas` | Canvas component |

### Godot

| Export | Description |
|--------|-------------|
| `createGodotInstance` | Create Godot instance |
| `useGodot` | Godot hook |
| `callGodot` | Call Godot method |
| `onGodotSignal` | Listen for signals |
| `GodotEmbed` | Embed component |

### Unity

| Export | Description |
|--------|-------------|
| `createUnityInstance` | Create Unity instance |
| `useUnity` | Unity hook |
| `sendMessage` | Send to Unity |
| `onUnityEvent` | Listen for events |
| `UnityEmbed` | Embed component |

### Bevy

| Export | Description |
|--------|-------------|
| `createBevyInstance` | Create Bevy instance |
| `useBevy` | Bevy hook |
| `spawnEntity` | Spawn ECS entity |
| `insertComponent` | Add component |
| `queryEntities` | Query ECS |
| `createEntityBridge` | Signal bridge |
| `loadBevyAsset` | Load asset |
| `BevyEmbed` | Embed component |

---

## Next Steps

- [WebGPU Platform](../../platforms/webgpu.md)
- [WASM Platform](../../platforms/wasm.md)
- [Game Development Patterns](../../patterns/game-dev.md)
