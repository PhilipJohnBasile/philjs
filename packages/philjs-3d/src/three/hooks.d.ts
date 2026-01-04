/**
 * @file Three.js Hooks
 * @description PhilJS hooks for Three.js integration
 */
import type { ThreeModule, ThreeState, ThreeScene, ThreeCanvasProps, FrameInfo, LoaderResult, ThreeTexture, ThreeGLTF } from './types.js';
/**
 * Load Three.js dynamically
 */
export declare function loadThree(): Promise<ThreeModule>;
/**
 * Get Three.js module (must be loaded first)
 */
export declare function getThree(): ThreeModule | null;
/**
 * Hook to use Three.js context
 */
export declare function useThree(canvas: HTMLCanvasElement | null): ThreeState | null;
/**
 * Initialize Three.js for a canvas
 */
export declare function initThree(canvas: HTMLCanvasElement, options?: ThreeCanvasProps): Promise<ThreeState>;
/**
 * Hook for animation frame in Three.js
 */
export declare function useFrame(canvas: HTMLCanvasElement | null, callback: (info: FrameInfo) => void): void;
/**
 * Remove frame callback
 */
export declare function removeFrameCallback(canvas: HTMLCanvasElement, callback: (info: FrameInfo) => void): void;
/**
 * Start the animation loop
 */
export declare function startAnimationLoop(canvas: HTMLCanvasElement): () => void;
/**
 * Hook for loading assets
 */
export declare function useLoader<T>(loaderClass: 'TextureLoader' | 'GLTFLoader' | string, url: string): LoaderResult<T>;
/**
 * Load texture asynchronously
 */
export declare function loadTextureAsync(url: string): Promise<ThreeTexture>;
/**
 * Load GLTF model asynchronously
 */
export declare function loadGLTFAsync(url: string): Promise<ThreeGLTF>;
/**
 * Resize Three.js renderer
 */
export declare function resizeThree(canvas: HTMLCanvasElement, width: number, height: number): void;
/**
 * Cleanup Three.js resources
 */
export declare function disposeThree(canvas: HTMLCanvasElement): void;
/**
 * Add object to scene
 */
export declare function addToScene(canvas: HTMLCanvasElement, object: Parameters<ThreeScene['add']>[0]): void;
/**
 * Remove object from scene
 */
export declare function removeFromScene(canvas: HTMLCanvasElement, object: Parameters<ThreeScene['remove']>[0]): void;
/**
 * Set camera position
 */
export declare function setCameraPosition(canvas: HTMLCanvasElement, x: number, y: number, z: number): void;
/**
 * Set camera look-at target
 */
export declare function setCameraLookAt(canvas: HTMLCanvasElement, x: number, y: number, z: number): void;
//# sourceMappingURL=hooks.d.ts.map