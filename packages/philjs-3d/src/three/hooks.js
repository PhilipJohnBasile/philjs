/**
 * @file Three.js Hooks
 * @description PhilJS hooks for Three.js integration
 */
/**
 * Cache for loaded Three.js module
 */
let threeModule = null;
let threeLoadPromise = null;
/**
 * Load Three.js dynamically
 */
export async function loadThree() {
    if (threeModule) {
        return threeModule;
    }
    if (threeLoadPromise) {
        return threeLoadPromise;
    }
    threeLoadPromise = import('three').then((module) => {
        threeModule = module;
        return threeModule;
    });
    return threeLoadPromise;
}
/**
 * Get Three.js module (must be loaded first)
 */
export function getThree() {
    return threeModule;
}
/**
 * Global state for Three.js contexts
 */
const threeStates = new WeakMap();
/**
 * Frame callbacks registry
 */
const frameCallbacks = new Map();
/**
 * Hook to use Three.js context
 */
export function useThree(canvas) {
    if (!canvas)
        return null;
    return threeStates.get(canvas) ?? null;
}
/**
 * Initialize Three.js for a canvas
 */
export async function initThree(canvas, options = {}) {
    const THREE = await loadThree();
    const { width = canvas.clientWidth || 800, height = canvas.clientHeight || 600, antialias = true, alpha = false, shadows = false, pixelRatio = window.devicePixelRatio || 1, clearColor = 0x000000, clearAlpha = 1, camera: cameraOptions = {}, } = options;
    // Create scene
    const scene = new THREE.Scene();
    // Create camera
    const camera = new THREE.PerspectiveCamera(cameraOptions.fov ?? 75, width / height, cameraOptions.near ?? 0.1, cameraOptions.far ?? 1000);
    if (cameraOptions.position) {
        camera.position.set(...cameraOptions.position);
    }
    else {
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
    const state = {
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
export function useFrame(canvas, callback) {
    if (!canvas)
        return;
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
export function removeFrameCallback(canvas, callback) {
    const callbacks = frameCallbacks.get(canvas);
    callbacks?.delete(callback);
}
/**
 * Start the animation loop
 */
export function startAnimationLoop(canvas) {
    const state = threeStates.get(canvas);
    if (!state) {
        console.warn('Three.js state not found for canvas');
        return () => { };
    }
    let animationId = null;
    let isRunning = true;
    const { scene, camera, renderer, clock } = state;
    clock.start();
    const loop = () => {
        if (!isRunning)
            return;
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        // Call all frame callbacks
        const callbacks = frameCallbacks.get(canvas);
        if (callbacks) {
            const info = { time, delta, state };
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
export function useLoader(loaderClass, url) {
    // This would use PhilJS signals in a real implementation
    const result = {
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
    const LoaderClass = THREE[loaderClass];
    if (!LoaderClass) {
        result.loading = false;
        result.error = new Error(`Loader "${loaderClass}" not found`);
        return result;
    }
    const loader = new LoaderClass();
    loader.load(url, (data) => {
        result.data = data;
        result.loading = false;
        result.progress = 100;
    }, (event) => {
        if (event.lengthComputable) {
            result.progress = (event.loaded / event.total) * 100;
        }
    }, (error) => {
        result.error = error;
        result.loading = false;
    });
    return result;
}
/**
 * Load texture asynchronously
 */
export async function loadTextureAsync(url) {
    const THREE = await loadThree();
    const loader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => {
        loader.load(url, (texture) => resolve(texture), undefined, (error) => reject(error));
    });
}
/**
 * Load GLTF model asynchronously
 */
export async function loadGLTFAsync(url) {
    const THREE = await loadThree();
    if (!THREE.GLTFLoader) {
        throw new Error('GLTFLoader not available. Please import it from three/examples/jsm/loaders/GLTFLoader');
    }
    const loader = new THREE.GLTFLoader();
    return new Promise((resolve, reject) => {
        loader.load(url, (gltf) => resolve(gltf), undefined, (error) => reject(error));
    });
}
/**
 * Resize Three.js renderer
 */
export function resizeThree(canvas, width, height) {
    const state = threeStates.get(canvas);
    if (!state)
        return;
    const { camera, renderer } = state;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    state.size = { width, height };
}
/**
 * Cleanup Three.js resources
 */
export function disposeThree(canvas) {
    const state = threeStates.get(canvas);
    if (!state)
        return;
    const { scene, renderer } = state;
    // Dispose of scene objects
    scene.traverse((object) => {
        const mesh = object;
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
            }
            else {
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
export function addToScene(canvas, object) {
    const state = threeStates.get(canvas);
    state?.scene.add(object);
}
/**
 * Remove object from scene
 */
export function removeFromScene(canvas, object) {
    const state = threeStates.get(canvas);
    state?.scene.remove(object);
}
/**
 * Set camera position
 */
export function setCameraPosition(canvas, x, y, z) {
    const state = threeStates.get(canvas);
    state?.camera.position.set(x, y, z);
}
/**
 * Set camera look-at target
 */
export function setCameraLookAt(canvas, x, y, z) {
    const state = threeStates.get(canvas);
    if (state) {
        const target = new state.THREE.Vector3(x, y, z);
        state.camera.lookAt(target);
    }
}
//# sourceMappingURL=hooks.js.map