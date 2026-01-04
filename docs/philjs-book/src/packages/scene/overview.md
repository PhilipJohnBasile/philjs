# @philjs/scene - Complete Reference

The `@philjs/scene` package provides a declarative 3D scene graph for PhilJS, featuring a React-three-fiber inspired API, built-in primitives, animations, particle systems, and GLTF loading.

## Installation

```bash
npm install @philjs/scene
# or
pnpm add @philjs/scene
# or
bun add @philjs/scene
```

## Features

- **Declarative Scene Graph** - React-three-fiber inspired API for building 3D scenes
- **Automatic Resource Management** - Built-in disposal and cleanup
- **Parent-Child Transformations** - Hierarchical transform inheritance
- **Built-in Primitives** - Box, Sphere, Plane, Cylinder, Torus geometries
- **Instanced Rendering** - Performance-optimized rendering for many similar objects
- **LOD System** - Level of Detail for automatic quality scaling
- **Post-Processing Effects** - Built-in effects pipeline
- **Shadow Mapping** - Real-time shadows
- **Environment Maps** - HDR environment lighting
- **PBR Materials** - Physically-based rendering with metalness/roughness workflow
- **Animation System** - Keyframe animation with easing functions
- **Particle Systems** - Configurable particle emitters with physics
- **Scene Loading** - GLTF, GLB file support

## Quick Start

```typescript
import {
  Scene,
  Camera,
  Mesh,
  Geometry,
  Material,
  DirectionalLight,
  AmbientLight,
  AnimationMixer,
} from '@philjs/scene';

// Create a scene
const scene = new Scene({ background: '#1a1a2e' });

// Add a camera
const camera = new Camera({
  position: [0, 5, 10],
  fov: 75,
  near: 0.1,
  far: 1000,
});
camera.lookAt([0, 0, 0]);
scene.add(camera);

// Add lights
const ambientLight = new AmbientLight({ intensity: 0.4 });
const directionalLight = new DirectionalLight({
  position: [5, 10, 5],
  intensity: 1,
  castShadow: true,
});
scene.add(ambientLight);
scene.add(directionalLight);

// Create a rotating cube
const cube = new Mesh({
  name: 'cube',
  geometry: Geometry.box(2, 2, 2),
  material: new Material({
    color: '#4a90d9',
    metalness: 0.3,
    roughness: 0.4,
  }),
  castShadow: true,
});
scene.add(cube);

// Animate the cube
function animate(deltaTime: number) {
  cube.rotation[1] += deltaTime * 0.5;
  scene.updateWorldMatrix(true);
}
```

---

## Scene Graph

The scene graph is a hierarchical structure where each node can have children that inherit parent transformations.

### SceneNode

The base class for all objects in the scene graph.

```typescript
import { SceneNode } from '@philjs/scene';
import type { NodeProps, Vector3 } from '@philjs/scene';

// Create a node
const node = new SceneNode({
  name: 'myNode',
  position: [0, 1, 0],
  rotation: [0, Math.PI / 4, 0],
  scale: [1, 1, 1],
  visible: true,
  castShadow: false,
  receiveShadow: false,
  frustumCulled: true,
  renderOrder: 0,
});

// Transform methods
node.setPosition(1, 2, 3);
node.setRotation(0, Math.PI, 0);
node.setScale(2, 2, 2);
node.lookAt([0, 0, 0]);

// Hierarchy
const parent = new SceneNode();
const child = new SceneNode();
parent.add(child);      // Add child
parent.remove(child);   // Remove child

// Traversal
node.traverse((n) => {
  console.log(n.name);
});

// Finding nodes
const found = node.find((n) => n.name === 'target');
const byName = node.findByName('cube');

// Update matrices
node.updateWorldMatrix(true); // Force update all children

// Cleanup
node.dispose();
```

### SceneNode Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | auto | Unique identifier (UUID) |
| `name` | `string` | `'node'` | Human-readable name |
| `parent` | `SceneNode \| null` | `null` | Parent node reference |
| `children` | `SceneNode[]` | `[]` | Child nodes |
| `visible` | `boolean` | `true` | Visibility flag |
| `castShadow` | `boolean` | `false` | Cast shadows |
| `receiveShadow` | `boolean` | `false` | Receive shadows |
| `frustumCulled` | `boolean` | `true` | Enable frustum culling |
| `renderOrder` | `number` | `0` | Render order (higher = later) |
| `position` | `Vector3` | `[0,0,0]` | Local position |
| `rotation` | `Vector3` | `[0,0,0]` | Euler rotation (radians) |
| `quaternion` | `Quaternion` | `[0,0,0,1]` | Quaternion rotation |
| `scale` | `Vector3` | `[1,1,1]` | Local scale |
| `localMatrix` | `Matrix4` | identity | Local transform matrix |
| `worldMatrix` | `Matrix4` | identity | World transform matrix |

### Scene

The root container for all 3D objects.

```typescript
import { Scene } from '@philjs/scene';
import type { SceneProps, Color } from '@philjs/scene';

const scene = new Scene({
  background: '#000000',       // Background color
  fog: {                       // Optional fog
    color: '#cccccc',
    near: 10,
    far: 100,
  },
  environment: 'studio.hdr',   // HDR environment map
});

// Access scene properties
scene.background = '#1a1a2e';
scene.fog = { color: '#ffffff', near: 5, far: 50 };
```

---

## Geometry

Built-in geometry primitives for common shapes.

```typescript
import { Geometry } from '@philjs/scene';

// Box geometry
const box = Geometry.box(
  1,    // width
  1,    // height
  1     // depth
);

// Sphere geometry
const sphere = Geometry.sphere(
  0.5,  // radius
  32,   // widthSegments
  16    // heightSegments
);

// Plane geometry
const plane = Geometry.plane(
  10,   // width
  10,   // height
  1,    // widthSegments (optional)
  1     // heightSegments (optional)
);

// Cylinder geometry
const cylinder = Geometry.cylinder(
  0.5,  // radiusTop
  0.5,  // radiusBottom
  2,    // height
  32    // radialSegments
);

// Torus geometry
const torus = Geometry.torus(
  1,    // radius
  0.3,  // tube radius
  16,   // radialSegments
  32    // tubularSegments
);
```

### Custom Geometry

Create geometry from raw vertex data:

```typescript
import { Geometry } from '@philjs/scene';

const customGeometry = new Geometry(
  new Float32Array([...]),  // vertices (x, y, z)
  new Float32Array([...]),  // normals (nx, ny, nz)
  new Float32Array([...]),  // uvs (u, v)
  new Uint16Array([...])    // indices
);

// Access geometry data
console.log(customGeometry.vertexCount);
console.log(customGeometry.indexCount);
console.log(customGeometry.vertices);
console.log(customGeometry.normals);
console.log(customGeometry.uvs);
console.log(customGeometry.indices);
```

---

## Materials

PBR materials with metalness/roughness workflow.

```typescript
import { Material } from '@philjs/scene';
import type { MaterialProps, Color } from '@philjs/scene';

const material = new Material({
  // Base color
  color: '#ff6600',            // Hex, number, or RGB array
  opacity: 1,
  transparent: false,

  // Rendering
  side: 'front',               // 'front', 'back', 'double'
  wireframe: false,
  flatShading: false,

  // PBR properties
  metalness: 0.5,              // 0 = dielectric, 1 = metal
  roughness: 0.5,              // 0 = smooth, 1 = rough
  emissive: '#000000',         // Emissive color
  emissiveIntensity: 1,

  // Texture maps
  map: '/textures/diffuse.jpg',
  normalMap: '/textures/normal.jpg',
  roughnessMap: '/textures/roughness.jpg',
  metalnessMap: '/textures/metalness.jpg',
  envMap: '/textures/environment.hdr',
  envMapIntensity: 1,
});

// Update material properties
material.color = '#00ff00';
material.metalness = 0.8;
material.roughness = 0.2;
```

### Material Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | `Color` | `'#ffffff'` | Base color |
| `opacity` | `number` | `1` | Opacity (0-1) |
| `transparent` | `boolean` | `false` | Enable transparency |
| `side` | `string` | `'front'` | Which side to render |
| `wireframe` | `boolean` | `false` | Wireframe mode |
| `flatShading` | `boolean` | `false` | Flat shading |
| `metalness` | `number` | `0` | Metalness factor |
| `roughness` | `number` | `0.5` | Roughness factor |
| `emissive` | `Color` | `'#000000'` | Emissive color |
| `emissiveIntensity` | `number` | `1` | Emissive strength |
| `map` | `string \| null` | `null` | Diffuse texture |
| `normalMap` | `string \| null` | `null` | Normal map |
| `roughnessMap` | `string \| null` | `null` | Roughness map |
| `metalnessMap` | `string \| null` | `null` | Metalness map |
| `envMap` | `string \| null` | `null` | Environment map |
| `envMapIntensity` | `number` | `1` | Environment intensity |

---

## Mesh

Combines geometry and material into a renderable object.

```typescript
import { Mesh, Geometry, Material } from '@philjs/scene';
import type { MeshProps } from '@philjs/scene';

// Create a mesh
const mesh = new Mesh({
  name: 'myMesh',
  geometry: Geometry.sphere(1, 32, 32),
  material: new Material({
    color: '#4a90d9',
    metalness: 0.5,
    roughness: 0.3,
  }),
  position: [0, 1, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  castShadow: true,
  receiveShadow: true,
});

// Or use material props directly
const simpleMesh = new Mesh({
  geometry: Geometry.box(1, 1, 1),
  material: {
    color: '#ff0000',
    metalness: 0,
    roughness: 1,
  },
});

// Access mesh components
console.log(mesh.geometry.vertexCount);
console.log(mesh.material.color);
```

---

## Lights

Various light types for illuminating scenes.

### AmbientLight

Uniform light that illuminates all objects equally.

```typescript
import { AmbientLight } from '@philjs/scene';

const ambient = new AmbientLight({
  color: '#ffffff',
  intensity: 0.4,
});
scene.add(ambient);
```

### DirectionalLight

Parallel rays from a distant source (like the sun).

```typescript
import { DirectionalLight } from '@philjs/scene';

const sun = new DirectionalLight({
  color: '#ffffff',
  intensity: 1,
  position: [5, 10, 5],
  target: [0, 0, 0],
  castShadow: true,
  shadow: {
    mapSize: [2048, 2048],
    bias: 0.0001,
    radius: 1,
  },
});
scene.add(sun);
```

### PointLight

Omnidirectional light from a single point.

```typescript
import { PointLight } from '@philjs/scene';

const bulb = new PointLight({
  color: '#ffaa00',
  intensity: 2,
  position: [0, 3, 0],
  distance: 10,     // Maximum range (0 = infinite)
  decay: 2,         // Light decay factor
  castShadow: true,
});
scene.add(bulb);
```

### SpotLight

Cone-shaped light from a single point.

```typescript
import { SpotLight } from '@philjs/scene';

const spotlight = new SpotLight({
  color: '#ffffff',
  intensity: 2,
  position: [0, 5, 0],
  target: [0, 0, 0],
  angle: Math.PI / 6,   // Cone angle
  penumbra: 0.1,        // Soft edge (0-1)
  distance: 20,
  decay: 2,
  castShadow: true,
});
scene.add(spotlight);
```

### HemisphereLight

Two-color ambient light (sky + ground).

```typescript
import { HemisphereLight } from '@philjs/scene';

const hemisphere = new HemisphereLight({
  color: '#87ceeb',         // Sky color
  groundColor: '#8b4513',   // Ground color
  intensity: 0.6,
});
scene.add(hemisphere);
```

### Light Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | `Color` | `'#ffffff'` | Light color |
| `intensity` | `number` | `1` | Light intensity |
| `castShadow` | `boolean` | `false` | Enable shadows |
| `shadow.mapSize` | `[number, number]` | `[1024, 1024]` | Shadow map resolution |
| `shadow.bias` | `number` | `0.0001` | Shadow bias |
| `shadow.radius` | `number` | `1` | Shadow blur radius |

---

## Camera

Perspective and orthographic cameras for viewing scenes.

```typescript
import { Camera } from '@philjs/scene';
import type { CameraProps } from '@philjs/scene';

// Perspective camera
const perspectiveCamera = new Camera({
  position: [0, 5, 10],
  fov: 75,              // Field of view (degrees)
  aspect: 16 / 9,       // Aspect ratio
  near: 0.1,            // Near clipping plane
  far: 1000,            // Far clipping plane
  zoom: 1,
  orthographic: false,
});

// Orthographic camera
const orthoCamera = new Camera({
  position: [0, 10, 0],
  orthographic: true,
  near: 0.1,
  far: 100,
  zoom: 5,
});

// Point camera at target
perspectiveCamera.lookAt([0, 0, 0]);

// Update projection after changing properties
perspectiveCamera.fov = 60;
perspectiveCamera.updateProjectionMatrix();

// Update view matrix after moving
perspectiveCamera.setPosition(5, 5, 5);
perspectiveCamera.updateViewMatrix();

// Access matrices for shader uniforms
const viewMatrix = perspectiveCamera.viewMatrix;
const projectionMatrix = perspectiveCamera.projectionMatrix;
```

---

## Instanced Mesh

Efficiently render many instances of the same mesh.

```typescript
import { InstancedMesh, Geometry, Material } from '@philjs/scene';
import type { Matrix4 } from '@philjs/scene';

// Create instanced mesh
const instancedMesh = new InstancedMesh({
  count: 1000,
  geometry: Geometry.box(0.5, 0.5, 0.5),
  material: new Material({ color: '#4a90d9' }),
});

// Set transform for each instance
for (let i = 0; i < 1000; i++) {
  const matrix = new Float32Array(16);
  // ... set matrix values for position/rotation/scale
  instancedMesh.setMatrixAt(i, matrix as Matrix4);
}

// Get instance matrix
const matrix = instancedMesh.getMatrixAt(0);

// Access instance data
console.log(instancedMesh.count);
console.log(instancedMesh.instanceMatrices);

scene.add(instancedMesh);
```

---

## LOD (Level of Detail)

Automatically switch between detail levels based on camera distance.

```typescript
import { LOD, Mesh, Geometry, Material, Camera } from '@philjs/scene';

const lod = new LOD();

// High detail (close)
const highDetail = new Mesh({
  geometry: Geometry.sphere(1, 64, 64),
  material: new Material({ color: '#4a90d9' }),
});
lod.addLevel(highDetail, 0);    // Distance 0+

// Medium detail
const mediumDetail = new Mesh({
  geometry: Geometry.sphere(1, 32, 32),
  material: new Material({ color: '#4a90d9' }),
});
lod.addLevel(mediumDetail, 10); // Distance 10+

// Low detail (far)
const lowDetail = new Mesh({
  geometry: Geometry.sphere(1, 16, 16),
  material: new Material({ color: '#4a90d9' }),
});
lod.addLevel(lowDetail, 50);    // Distance 50+

scene.add(lod);

// Update LOD based on camera position
function animate() {
  lod.update(camera);
}

// Configure auto-update
lod.autoUpdate = true;
```

---

## Animation System

Keyframe animation with tracks and easing.

### AnimationMixer

```typescript
import { AnimationMixer, Scene } from '@philjs/scene';
import type { AnimationClip, AnimationTrack, Keyframe } from '@philjs/scene';

const scene = new Scene();
const mixer = new AnimationMixer(scene);

// Define animation clip
const rotateClip: AnimationClip = {
  name: 'rotate',
  duration: 2,
  tracks: [
    {
      target: 'cube',
      property: 'rotation',
      keyframes: [
        { time: 0, value: [0, 0, 0], easing: 'linear' },
        { time: 1, value: [0, Math.PI, 0], easing: 'ease-in-out' },
        { time: 2, value: [0, Math.PI * 2, 0], easing: 'linear' },
      ],
    },
  ],
};

// Add clip to mixer
mixer.addClip(rotateClip);

// Play animation
mixer.play('rotate', {
  loop: true,
  timeScale: 1,
});

// Animation loop
function animate(deltaTime: number) {
  mixer.update(deltaTime);
}

// Control playback
mixer.pause();
mixer.stop();
```

### Easing Functions

Available easing options for keyframes:

- `'linear'` - Constant speed
- `'ease-in'` - Start slow, end fast
- `'ease-out'` - Start fast, end slow
- `'ease-in-out'` - Smooth acceleration and deceleration

### Animating Different Properties

```typescript
const complexAnimation: AnimationClip = {
  name: 'complex',
  duration: 3,
  tracks: [
    // Position animation
    {
      target: 'ball',
      property: 'position',
      keyframes: [
        { time: 0, value: [0, 0, 0] },
        { time: 1.5, value: [0, 5, 0], easing: 'ease-out' },
        { time: 3, value: [0, 0, 0], easing: 'ease-in' },
      ],
    },
    // Scale animation
    {
      target: 'ball',
      property: 'scale',
      keyframes: [
        { time: 0, value: [1, 1, 1] },
        { time: 1.5, value: [1.5, 0.5, 1.5] },
        { time: 3, value: [1, 1, 1] },
      ],
    },
    // Single value animation
    {
      target: 'light',
      property: 'intensity',
      keyframes: [
        { time: 0, value: 1 },
        { time: 1.5, value: 2, easing: 'ease-in-out' },
        { time: 3, value: 1 },
      ],
    },
  ],
};
```

---

## Particle System

Configurable particle emitters with physics.

```typescript
import { ParticleSystem } from '@philjs/scene';
import type { ParticleSystemConfig, Particle } from '@philjs/scene';

const particles = new ParticleSystem({
  maxParticles: 1000,
  emissionRate: 50,        // Particles per second
  lifetime: 2,             // Seconds
  lifetimeVariation: 0.5,  // +/- variation
  speed: 5,
  speedVariation: 2,
  size: 0.1,
  sizeVariation: 0.02,
  color: '#ff6600',
  gravity: [0, -9.8, 0],   // Apply gravity
  worldSpace: true,        // Emit in world space
});

// Size over lifetime (array of sizes)
particles.config.sizeOverLifetime = [0.1, 0.2, 0.15, 0.05, 0];

// Color over lifetime (array of colors)
particles.config.colorOverLifetime = [
  '#ffffff',
  '#ffff00',
  '#ff6600',
  '#ff0000',
  '#000000',
];

scene.add(particles);

// Manual emission
particles.emit(10); // Emit 10 particles immediately

// Update particles each frame
function animate(deltaTime: number) {
  particles.update(deltaTime);
}

// Access particle data for rendering
particles.particles.forEach((p: Particle) => {
  console.log(p.position, p.velocity, p.life, p.size, p.color);
});
```

### Particle System Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxParticles` | `number` | required | Maximum particle count |
| `emissionRate` | `number` | required | Particles per second |
| `lifetime` | `number` | required | Particle lifetime (seconds) |
| `lifetimeVariation` | `number` | `0` | Lifetime randomness |
| `speed` | `number` | required | Initial speed |
| `speedVariation` | `number` | `0` | Speed randomness |
| `size` | `number` | required | Particle size |
| `sizeVariation` | `number` | `0` | Size randomness |
| `sizeOverLifetime` | `number[]` | - | Size curve |
| `color` | `Color` | required | Particle color |
| `colorOverLifetime` | `Color[]` | - | Color gradient |
| `gravity` | `Vector3` | `[0,0,0]` | Gravity vector |
| `worldSpace` | `boolean` | `false` | World space emission |

---

## GLTF Loader

Load 3D models in GLTF/GLB format.

```typescript
import { GLTFLoader } from '@philjs/scene';
import type { GLTFResult } from '@philjs/scene';

const loader = new GLTFLoader();

// Load GLTF file
const result: GLTFResult = await loader.load('/models/character.glb');

// Access loaded scene
const model = result.scene;
scene.add(model);

// Access animations
result.animations.forEach((clip) => {
  console.log('Animation:', clip.name, 'Duration:', clip.duration);
  mixer.addClip(clip);
});

// Models are cached - subsequent loads return cached version
const cachedResult = await loader.load('/models/character.glb');
```

---

## Declarative API

React-style declarative scene building.

### createElement

Build scene elements declaratively:

```typescript
import { createElement, buildScene } from '@philjs/scene';
import type { SceneElement } from '@philjs/scene';

// Create scene elements
const sceneElement = createElement('scene', { background: '#1a1a2e' },
  createElement('ambientLight', { intensity: 0.4 }),
  createElement('directionalLight', {
    position: [5, 10, 5],
    intensity: 1,
    castShadow: true,
  }),
  createElement('group', { position: [0, 0, 0] },
    createElement('box', {
      args: [1, 1, 1],
      material: { color: '#4a90d9', metalness: 0.5 },
      position: [-2, 0.5, 0],
    }),
    createElement('sphere', {
      args: [0.5, 32, 32],
      material: { color: '#d94a4a', metalness: 0.8 },
      position: [0, 0.5, 0],
    }),
    createElement('cylinder', {
      args: [0.3, 0.3, 1],
      material: { color: '#4ad94a' },
      position: [2, 0.5, 0],
    }),
  ),
  createElement('camera', {
    position: [0, 5, 10],
    fov: 75,
  }),
);

// Build actual scene from declaration
const scene = buildScene(sceneElement);
```

### Available Element Types

| Type | Description |
|------|-------------|
| `scene` | Scene container |
| `group` | Empty group node |
| `mesh` | Generic mesh |
| `box` | Box geometry mesh |
| `sphere` | Sphere geometry mesh |
| `plane` | Plane geometry mesh |
| `cylinder` | Cylinder geometry mesh |
| `torus` | Torus geometry mesh |
| `directionalLight` | Directional light |
| `pointLight` | Point light |
| `spotLight` | Spot light |
| `ambientLight` | Ambient light |
| `hemisphereLight` | Hemisphere light |
| `camera` | Camera |
| `instancedMesh` | Instanced mesh |
| `lod` | LOD group |
| `particles` | Particle system |

---

## Hooks

Factory functions for creating scene objects.

```typescript
import {
  useScene,
  useCamera,
  useMesh,
  useAnimation,
  useGLTF,
  useParticles,
} from '@philjs/scene';

// Create scene
const scene = useScene({ background: '#000000' });

// Create camera
const camera = useCamera({
  position: [0, 5, 10],
  fov: 75,
});

// Create mesh with geometry and material
const cube = useMesh(
  Geometry.box(1, 1, 1),
  { color: '#4a90d9', metalness: 0.5 },
  { position: [0, 0.5, 0] }
);

// Create animation mixer
const mixer = useAnimation(scene);

// Load GLTF model
const { scene: model, animations, isLoading } = useGLTF('/models/robot.glb');

// Create particle system
const particles = useParticles({
  maxParticles: 500,
  emissionRate: 20,
  lifetime: 3,
  speed: 2,
  size: 0.05,
  color: '#ffaa00',
});
```

---

## Types Reference

### Basic Types

```typescript
// 3D vector as tuple
type Vector3 = [number, number, number];

// Quaternion rotation
type Quaternion = [number, number, number, number];

// Color (hex string, number, or RGB array)
type Color = string | number | [number, number, number];

// 4x4 transformation matrix
type Matrix4 = Float32Array;
```

### Transform

```typescript
interface Transform {
  position?: Vector3;
  rotation?: Vector3 | Quaternion;
  scale?: Vector3 | number;
}
```

### NodeProps

```typescript
interface NodeProps extends Transform {
  name?: string;
  visible?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  frustumCulled?: boolean;
  renderOrder?: number;
}
```

### MaterialProps

```typescript
interface MaterialProps {
  color?: Color;
  opacity?: number;
  transparent?: boolean;
  side?: 'front' | 'back' | 'double';
  wireframe?: boolean;
  flatShading?: boolean;
  metalness?: number;
  roughness?: number;
  emissive?: Color;
  emissiveIntensity?: number;
  map?: string | HTMLImageElement;
  normalMap?: string | HTMLImageElement;
  roughnessMap?: string | HTMLImageElement;
  metalnessMap?: string | HTMLImageElement;
  envMap?: string;
  envMapIntensity?: number;
}
```

### GeometryProps

```typescript
interface GeometryProps {
  args?: number[];
}
```

### LightProps

```typescript
interface LightProps extends NodeProps {
  intensity?: number;
  color?: Color;
  castShadow?: boolean;
  shadow?: {
    mapSize?: [number, number];
    bias?: number;
    radius?: number;
  };
}
```

### CameraProps

```typescript
interface CameraProps extends NodeProps {
  fov?: number;
  near?: number;
  far?: number;
  aspect?: number;
  zoom?: number;
  orthographic?: boolean;
}
```

### SceneProps

```typescript
interface SceneProps {
  background?: Color;
  fog?: {
    color: Color;
    near: number;
    far: number;
  };
  environment?: string;
}
```

### Animation Types

```typescript
interface Keyframe<T> {
  time: number;
  value: T;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface AnimationTrack<T> {
  target: string;
  property: string;
  keyframes: Keyframe<T>[];
}

interface AnimationClip {
  name: string;
  duration: number;
  tracks: AnimationTrack<any>[];
}
```

### Particle Types

```typescript
interface ParticleSystemConfig {
  maxParticles: number;
  emissionRate: number;
  lifetime: number;
  lifetimeVariation?: number;
  speed: number;
  speedVariation?: number;
  size: number;
  sizeVariation?: number;
  sizeOverLifetime?: number[];
  color: Color;
  colorOverLifetime?: Color[];
  gravity?: Vector3;
  worldSpace?: boolean;
}

interface Particle {
  position: Vector3;
  velocity: Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: Color;
}
```

### GLTF Types

```typescript
interface GLTFResult {
  scene: SceneNode;
  animations: AnimationClip[];
}
```

---

## API Reference

### Core Classes

| Export | Description |
|--------|-------------|
| `SceneNode` | Base class for scene graph nodes |
| `Scene` | Root scene container |
| `Mesh` | Renderable geometry + material |
| `Geometry` | Vertex data container |
| `Material` | Surface appearance |
| `Camera` | View projection |
| `InstancedMesh` | Instanced rendering |
| `LOD` | Level of detail |
| `AnimationMixer` | Animation playback |
| `ParticleSystem` | Particle emitter |
| `GLTFLoader` | GLTF model loader |

### Light Classes

| Export | Description |
|--------|-------------|
| `Light` | Base light class |
| `DirectionalLight` | Parallel rays (sun) |
| `PointLight` | Omnidirectional point |
| `SpotLight` | Cone-shaped beam |
| `AmbientLight` | Uniform ambient |
| `HemisphereLight` | Sky + ground ambient |

### Declarative API

| Export | Description |
|--------|-------------|
| `createElement` | Create scene element descriptor |
| `buildScene` | Build scene from element tree |

### Hooks

| Export | Description |
|--------|-------------|
| `useScene` | Create Scene instance |
| `useCamera` | Create Camera instance |
| `useMesh` | Create Mesh instance |
| `useAnimation` | Create AnimationMixer |
| `useGLTF` | Load GLTF model |
| `useParticles` | Create ParticleSystem |

---

## Next Steps

- [@philjs/3d](../3d/overview.md) - WebGL, Three.js, and game engine integrations
- [@philjs/motion](../motion/overview.md) - Animation utilities
- [@philjs/xr](../xr/overview.md) - VR/AR support
