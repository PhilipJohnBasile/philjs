/**
 * @file Three.js Hooks
 * @description PhilJS hooks for Three.js integration
 */

import type {
  ThreeModule,
  ThreeState,
  ThreeScene,
  ThreePerspectiveCamera,
  ThreeRenderer,
  ThreeClock,
  ThreeCanvasProps,
  FrameInfo,
  LoaderResult,
  ThreeTexture,
  ThreeGLTF,
  ThreeObject3D,
} from './types.js';

/**
 * Cache for loaded Three.js module
 */
let threeModule: ThreeModule | null = null;
let threeLoadPromise: Promise<ThreeModule> | null = null;

/**
 * Load Three.js dynamically
 */
export async function loadThree(): Promise<ThreeModule> {
  if (threeModule) {
    return threeModule;
  }

  if (threeLoadPromise) {
    return threeLoadPromise;
  }

  threeLoadPromise = import('three').then((module) => {
    threeModule = module as unknown as ThreeModule;
    return threeModule;
  });

  return threeLoadPromise;
}

/**
 * Get Three.js module (must be loaded first)
 */
export function getThree(): ThreeModule | null {
  return threeModule;
}

/**
 * Global state for Three.js contexts
 */
const threeStates = new WeakMap<HTMLCanvasElement, ThreeState>();

/**
 * Frame callbacks registry
 */
const frameCallbacks = new Map<HTMLCanvasElement, Set<(info: FrameInfo) => void>>();

/**
 * Hook to use Three.js context
 */
export function useThree(canvas: HTMLCanvasElement | null): ThreeState | null {
  if (!canvas) return null;
  return threeStates.get(canvas) ?? null;
}

/**
 * Initialize Three.js for a canvas
 */
export async function initThree(
  canvas: HTMLCanvasElement,
  options: ThreeCanvasProps = {}
): Promise<ThreeState> {
  const THREE = await loadThree();

  const {
    width = canvas.clientWidth || 800,
    height = canvas.clientHeight || 600,
    antialias = true,
    alpha = false,
    shadows = false,
    pixelRatio = window.devicePixelRatio || 1,
    clearColor = 0x000000,
    clearAlpha = 1,
    camera: cameraOptions = {},
  } = options;

  // Create scene
  const scene = new THREE.Scene();

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    cameraOptions.fov ?? 75,
    width / height,
    cameraOptions.near ?? 0.1,
    cameraOptions.far ?? 1000
  );

  if (cameraOptions.position) {
    camera.position.set(...cameraOptions.position);
  } else {
    camera.position.z = 5;
  }

  if (cameraOptions.lookAt) {
    camera.lookAt(new THREE.Vector3(...cameraOptions.lookAt));
  }

  // Create renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha,
    powerPreference: 'high-performance',
  });

  renderer.setSize(width, height);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(clearColor, clearAlpha);

  if (shadows) {
    renderer.shadowMap.enabled = true;
  }

  // Create clock
  const clock = new THREE.Clock();

  const state: ThreeState = {
    scene,
    camera,
    renderer,
    clock,
    canvas,
    size: { width, height },
    THREE,
  };

  threeStates.set(canvas, state);

  return state;
}

/**
 * Hook for animation frame in Three.js
 */
export function useFrame(
  canvas: HTMLCanvasElement | null,
  callback: (info: FrameInfo) => void
): void {
  if (!canvas) return;

  let callbacks = frameCallbacks.get(canvas);
  if (!callbacks) {
    callbacks = new Set();
    frameCallbacks.set(canvas, callbacks);
  }

  callbacks.add(callback);
}

/**
 * Remove frame callback
 */
export function removeFrameCallback(
  canvas: HTMLCanvasElement,
  callback: (info: FrameInfo) => void
): void {
  const callbacks = frameCallbacks.get(canvas);
  callbacks?.delete(callback);
}

/**
 * Start the animation loop
 */
export function startAnimationLoop(canvas: HTMLCanvasElement): () => void {
  const state = threeStates.get(canvas);
  if (!state) {
    console.warn('Three.js state not found for canvas');
    return () => {};
  }

  let animationId: number | null = null;
  let isRunning = true;

  const { scene, camera, renderer, clock } = state;
  clock.start();

  const loop = () => {
    if (!isRunning) return;

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Call all frame callbacks
    const callbacks = frameCallbacks.get(canvas);
    if (callbacks) {
      const info: FrameInfo = { time, delta, state };
      for (const callback of callbacks) {
        callback(info);
      }
    }

    // Render
    renderer.render(scene, camera);

    animationId = requestAnimationFrame(loop);
  };

  animationId = requestAnimationFrame(loop);

  // Return cleanup function
  return () => {
    isRunning = false;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };
}

/**
 * Hook for loading assets
 */
export function useLoader<T>(
  loaderClass: 'TextureLoader' | 'GLTFLoader' | string,
  url: string
): LoaderResult<T> {
  // This would use PhilJS signals in a real implementation
  const result: LoaderResult<T> = {
    data: null,
    loading: true,
    error: null,
    progress: 0,
  };

  const THREE = getThree();
  if (!THREE) {
    result.loading = false;
    result.error = new Error('Three.js not loaded');
    return result;
  }

  const LoaderClass = (THREE as Record<string, unknown>)[loaderClass] as {
    new (): {
      load: (
        url: string,
        onLoad: (data: T) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (error: Error) => void
      ) => void;
    };
  };

  if (!LoaderClass) {
    result.loading = false;
    result.error = new Error(`Loader "${loaderClass}" not found`);
    return result;
  }

  const loader = new LoaderClass();

  loader.load(
    url,
    (data) => {
      result.data = data;
      result.loading = false;
      result.progress = 100;
    },
    (event) => {
      if (event.lengthComputable) {
        result.progress = (event.loaded / event.total) * 100;
      }
    },
    (error) => {
      result.error = error;
      result.loading = false;
    }
  );

  return result;
}

/**
 * Load texture asynchronously
 */
export async function loadTextureAsync(url: string): Promise<ThreeTexture> {
  const THREE = await loadThree();
  const loader = new THREE.TextureLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture: ThreeTexture) => resolve(texture),
      undefined,
      (error: Error) => reject(error)
    );
  });
}

/**
 * Load GLTF model asynchronously
 */
export async function loadGLTFAsync(url: string): Promise<ThreeGLTF> {
  const THREE = await loadThree();

  if (!THREE.GLTFLoader) {
    throw new Error('GLTFLoader not available. Please import it from three/examples/jsm/loaders/GLTFLoader');
  }

  const loader = new THREE.GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf: ThreeGLTF) => resolve(gltf),
      undefined,
      (error: Error) => reject(error)
    );
  });
}

/**
 * Resize Three.js renderer
 */
export function resizeThree(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): void {
  const state = threeStates.get(canvas);
  if (!state) return;

  const { camera, renderer } = state;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);

  state.size = { width, height };
}

/**
 * Cleanup Three.js resources
 */
export function disposeThree(canvas: HTMLCanvasElement): void {
  const state = threeStates.get(canvas);
  if (!state) return;

  const { scene, renderer } = state;

  // Dispose of scene objects
  scene.traverse((object: ThreeObject3D) => {
    const mesh = object as ThreeObject3D & {
      geometry?: { dispose: () => void };
      material?: { dispose: () => void } | Array<{ dispose: () => void }>;
    };

    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  });

  // Dispose renderer
  renderer.dispose();

  // Clear callbacks
  frameCallbacks.delete(canvas);

  // Remove state
  threeStates.delete(canvas);
}

/**
 * Add object to scene
 */
export function addToScene(
  canvas: HTMLCanvasElement,
  object: Parameters<ThreeScene['add']>[0]
): void {
  const state = threeStates.get(canvas);
  state?.scene.add(object);
}

/**
 * Remove object from scene
 */
export function removeFromScene(
  canvas: HTMLCanvasElement,
  object: Parameters<ThreeScene['remove']>[0]
): void {
  const state = threeStates.get(canvas);
  state?.scene.remove(object);
}

/**
 * Set camera position
 */
export function setCameraPosition(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  z: number
): void {
  const state = threeStates.get(canvas);
  state?.camera.position.set(x, y, z);
}

/**
 * Set camera look-at target
 */
export function setCameraLookAt(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  z: number
): void {
  const state = threeStates.get(canvas);
  if (state) {
    const target = new state.THREE.Vector3(x, y, z);
    state.camera.lookAt(target);
  }
}
