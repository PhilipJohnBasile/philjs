/**
 * @file ThreeCanvas Component
 * @description Three.js canvas component for PhilJS
 */
import type { ThreeCanvasProps } from './types.js';
/**
 * Create a Three.js canvas element
 *
 * @param props - Three.js canvas properties
 * @returns HTMLElement containing the Three.js canvas
 *
 * @example
 * ```ts
 * const canvas = ThreeCanvas({
 *   width: 800,
 *   height: 600,
 *   onInit: (state) => {
 *     // Add objects to scene
 *     const geometry = new state.THREE.BoxGeometry();
 *     const material = new state.THREE.MeshBasicMaterial({ color: 0x00ff00 });
 *     const cube = new state.THREE.Mesh(geometry, material);
 *     state.scene.add(cube);
 *   },
 *   onFrame: (info, state) => {
 *     // Animation loop
 *   },
 * });
 * document.body.appendChild(canvas);
 * ```
 */
export declare function ThreeCanvas(props: ThreeCanvasProps): HTMLElement;
/**
 * Create a Three.js canvas element (alias)
 */
export declare const createThreeCanvasElement: typeof ThreeCanvas;
//# sourceMappingURL=ThreeCanvas.d.ts.map