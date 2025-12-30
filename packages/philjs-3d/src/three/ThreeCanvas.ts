/**
 * @file ThreeCanvas Component
 * @description Three.js canvas component for PhilJS
 */

import type { ThreeCanvasProps, ThreeState, FrameInfo } from './types.js';
import { initThree, disposeThree, resizeThree, useThree } from './hooks.js';

/** Frame callback registry */
const frameCallbacks = new Map<HTMLCanvasElement, { id: number | null; callback: (info: FrameInfo) => void }>();

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
export function ThreeCanvas(props: ThreeCanvasProps): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  if (props.className) {
    container.className = props.className;
  }

  if (props.style) {
    Object.entries(props.style).forEach(([key, value]) => {
      container.style.setProperty(key, String(value));
    });
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = props.id ?? `three-canvas-${Date.now()}`;

  const width = props.width ?? 800;
  const height = props.height ?? 600;
  const pixelRatio = props.pixelRatio ?? window.devicePixelRatio ?? 1;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  container.appendChild(canvas);

  // Initialize Three.js asynchronously
  (async () => {
    try {
      const state = await initThree(canvas, {
        antialias: props.antialias ?? true,
        alpha: props.alpha ?? false,
        pixelRatio,
        ...(props.clearColor !== undefined ? { clearColor: props.clearColor } : {}),
        ...(props.clearAlpha !== undefined ? { clearAlpha: props.clearAlpha } : {}),
        ...(props.shadows !== undefined ? { shadows: props.shadows } : {}),
        ...(props.camera !== undefined ? { camera: props.camera } : {}),
      });

      // Call onInit callback
      props.onInit?.(state);
      props.onCreated?.(state);

      // Start animation loop if onFrame is provided
      if (props.onFrame) {
        let lastTime = 0;
        const animate = (currentTime: number) => {
          const time = currentTime / 1000;
          const delta = lastTime ? time - lastTime : 0;
          lastTime = time;

          const info: FrameInfo = {
            time,
            delta,
            state,
          };

          props.onFrame?.(info, state);
          state.renderer.render(state.scene, state.camera);

          frameCallbacks.get(canvas)!.id = requestAnimationFrame(animate);
        };

        frameCallbacks.set(canvas, { id: null, callback: (info) => props.onFrame?.(info, info.state) });
        frameCallbacks.get(canvas)!.id = requestAnimationFrame(animate);
      }

      // Handle auto resize
      if (props.autoResize) {
        const handleResize = () => {
          const rect = container.getBoundingClientRect();
          const currentState = useThree(canvas);
          if (currentState) {
            const newPixelRatio = props.pixelRatio ?? window.devicePixelRatio ?? 1;
            canvas.width = rect.width * newPixelRatio;
            canvas.height = rect.height * newPixelRatio;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            currentState.camera.aspect = rect.width / rect.height;
            currentState.camera.updateProjectionMatrix();
            currentState.renderer.setSize(rect.width, rect.height);
            currentState.size.width = rect.width;
            currentState.size.height = rect.height;
            props.onResize?.(rect.width, rect.height);
          }
        };

        window.addEventListener('resize', handleResize);

        // Use ResizeObserver if available
        if (typeof ResizeObserver !== 'undefined') {
          const observer = new ResizeObserver(handleResize);
          observer.observe(container);
        }
      }
    } catch (error) {
      props.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  return container;
}

/**
 * Create a Three.js canvas element (alias)
 */
export const createThreeCanvasElement = ThreeCanvas;
