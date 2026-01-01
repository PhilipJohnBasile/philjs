# @philjs/scene

Declarative 3D scene graph for PhilJS - React-three-fiber inspired API, animations, particles, GLTF loading

<!-- PACKAGE_GUIDE_START -->
## Overview

Declarative 3D scene graph for PhilJS - React-three-fiber inspired API, animations, particles, GLTF loading

## Focus Areas

- philjs, 3d, scene-graph, webgl, declarative, animation, particles, gltf

## Entry Points

- packages/philjs-scene/src/index.ts

## Quick Start

```ts
import { // Core classes
  SceneNode, // Declarative API
  createElement, // Hooks
  useScene } from '@philjs/scene';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- // Core classes
  SceneNode
- // Declarative API
  createElement
- // Hooks
  useScene
- // Lights
  Light
- // Types
  type Vector3
- AmbientLight
- AnimationClip
- AnimationMixer
- AnimationTrack
- Camera
- CameraProps
- Color
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/scene
```
## Usage

```ts
import { // Core classes
  SceneNode, // Declarative API
  createElement, // Hooks
  useScene } from '@philjs/scene';
```

## Scripts

- pnpm run build
- pnpm run test

## Compatibility

- Node >=24
- TypeScript 6

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-scene/src/index.ts

### Public API
- Direct exports: // Core classes
  SceneNode, // Declarative API
  createElement, // Hooks
  useScene, // Lights
  Light, // Types
  type Vector3, AmbientLight, AnimationClip, AnimationMixer, AnimationTrack, Camera, CameraProps, Color, DirectionalLight, GLTFLoader, GLTFResult, Geometry, GeometryProps, HemisphereLight, InstancedMesh, Keyframe, LOD, LightProps, Material, MaterialProps, Matrix4, Mesh, NodeProps, ParticleSystem, ParticleSystemConfig, PointLight, Quaternion, Scene, SceneProps, SpotLight, Transform, buildScene, useAnimation, useCamera, useGLTF, useMesh, useParticles
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
