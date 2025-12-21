/**
 * @file ThreeCanvas Component
 * @description PhilJS component for Three.js scenes
 */

import type { ThreeCanvasProps, ThreeState, FrameInfo } from './types';
import {
  initThree,
  startAnimationLoop,
  useFrame,
  resizeThree,
  disposeThree,
} from './hooks';

/**
 * Create a Three.js canvas component for PhilJS
 */
export function ThreeCanvas(props: ThreeCanvasProps) {
  const {
    width = 800,
    height = 600,
    antialias = true,
    alpha = false,
    shadows = false,
    pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    clearColor = 0x000000,
    clearAlpha = 1,
    camera,
    onCreated,
    onFrame,
    onResize,
    style = {},
    className = '',
  } = props;

  let canvasRef: HTMLCanvasElement | null = null;
  let stopAnimation: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let state: ThreeState | null = null;

  const handleCanvasMount = async (canvas: HTMLCanvasElement) => {
    canvasRef = canvas;

    try {
      state = await initThree(canvas, {
        width,
        height,
        antialias,
        alpha,
        shadows,
        pixelRatio,
        clearColor,
        clearAlpha,
        camera,
      });

      // Register frame callback
      if (onFrame) {
        useFrame(canvas, (info: FrameInfo) => {
          onFrame(info.state, info.delta);
        });
      }

      // Call onCreated
      onCreated?.(state);

      // Start animation loop
      stopAnimation = startAnimationLoop(canvas);

      // Setup resize observer
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width: newWidth, height: newHeight } = entry.contentRect;
            if (newWidth > 0 && newHeight > 0) {
              resizeThree(canvas, newWidth, newHeight);
              onResize?.(newWidth, newHeight);
            }
          }
        });
        resizeObserver.observe(canvas);
      }
    } catch (error) {
      console.error('Failed to initialize Three.js:', error);
    }
  };

  const handleCanvasUnmount = () => {
    stopAnimation?.();
    resizeObserver?.disconnect();
    if (canvasRef) {
      disposeThree(canvasRef);
    }
    canvasRef = null;
    state = null;
  };

  // Create the canvas element
  const canvasStyle = {
    display: 'block',
    ...style,
  };

  // Return JSX-like structure for PhilJS
  return {
    type: 'canvas',
    props: {
      width: Math.floor(width * pixelRatio),
      height: Math.floor(height * pixelRatio),
      style: {
        ...canvasStyle,
        width: `${width}px`,
        height: `${height}px`,
      },
      class: className,
      ref: (el: HTMLCanvasElement | null) => {
        if (el) {
          handleCanvasMount(el);
        } else {
          handleCanvasUnmount();
        }
      },
    },
  };
}

/**
 * Create a Three.js canvas element imperatively
 */
export async function createThreeCanvasElement(
  props: ThreeCanvasProps
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');

  const {
    width = 800,
    height = 600,
    antialias = true,
    alpha = false,
    shadows = false,
    pixelRatio = window.devicePixelRatio || 1,
    clearColor = 0x000000,
    clearAlpha = 1,
    camera,
    onCreated,
    onFrame,
    onResize,
    style = {},
    className = '',
  } = props;

  // Set canvas dimensions
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.display = 'block';

  // Apply custom styles
  for (const [key, value] of Object.entries(style)) {
    (canvas.style as Record<string, unknown>)[key] = value;
  }

  if (className) {
    canvas.className = className;
  }

  // Initialize Three.js
  const state = await initThree(canvas, {
    width,
    height,
    antialias,
    alpha,
    shadows,
    pixelRatio,
    clearColor,
    clearAlpha,
    camera,
  });

  // Register frame callback
  if (onFrame) {
    useFrame(canvas, (info: FrameInfo) => {
      onFrame(info.state, info.delta);
    });
  }

  // Call onCreated
  onCreated?.(state);

  // Start animation loop
  const stopAnimation = startAnimationLoop(canvas);

  // Setup resize observer
  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          resizeThree(canvas, newWidth, newHeight);
          onResize?.(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(canvas);
  }

  // Attach cleanup function
  (canvas as HTMLCanvasElement & { cleanup?: () => void }).cleanup = () => {
    stopAnimation();
    resizeObserver?.disconnect();
    disposeThree(canvas);
  };

  return canvas;
}

export default ThreeCanvas;
