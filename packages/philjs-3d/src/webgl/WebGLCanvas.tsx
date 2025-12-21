/**
 * @file WebGLCanvas Component
 * @description PhilJS component wrapper for WebGL canvas
 */

import type { WebGLCanvasProps, AnimationFrameInfo } from './types';
import { createWebGLContext, resizeCanvas, enableDefaultFeatures, clearContext } from './context';
import { createAnimationLoop } from './animation';

/**
 * Create a WebGL canvas component for PhilJS
 */
export function WebGLCanvas(props: WebGLCanvasProps) {
  const {
    width = 800,
    height = 600,
    options = {},
    onInit,
    onFrame,
    onResize,
    onError,
    style = {},
    className = '',
    autoResize = true,
    pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  } = props;

  let canvasRef: HTMLCanvasElement | null = null;
  let animationLoop: ReturnType<typeof createAnimationLoop> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let glContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;

  const handleCanvasMount = (canvas: HTMLCanvasElement) => {
    canvasRef = canvas;

    try {
      const result = createWebGLContext(canvas, options);
      glContext = result.gl;

      // Enable default features
      enableDefaultFeatures(result.gl);

      // Set initial viewport
      result.gl.viewport(0, 0, canvas.width, canvas.height);

      // Call onInit callback
      onInit?.(result);

      // Start animation loop if onFrame is provided
      if (onFrame) {
        animationLoop = createAnimationLoop((info: AnimationFrameInfo) => {
          if (glContext) {
            onFrame(info, glContext);
          }
        });
        animationLoop.start();
      }

      // Setup resize observer
      if (autoResize && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (canvasRef && glContext) {
            if (resizeCanvas(canvasRef, pixelRatio)) {
              glContext.viewport(0, 0, canvasRef.width, canvasRef.height);
              onResize?.(canvasRef.width, canvasRef.height);
            }
          }
        });
        resizeObserver.observe(canvas);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
    }
  };

  const handleCanvasUnmount = () => {
    animationLoop?.stop();
    resizeObserver?.disconnect();
    canvasRef = null;
    glContext = null;
  };

  // Create the canvas element
  // Note: In actual PhilJS, this would use the JSX runtime
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
 * Simple functional component for PhilJS JSX
 */
export function createWebGLCanvasElement(props: WebGLCanvasProps): HTMLCanvasElement {
  const canvas = document.createElement('canvas');

  const {
    width = 800,
    height = 600,
    options = {},
    onInit,
    onFrame,
    onResize,
    onError,
    style = {},
    className = '',
    autoResize = true,
    pixelRatio = window.devicePixelRatio || 1,
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

  let glContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let animationLoop: ReturnType<typeof createAnimationLoop> | null = null;
  let resizeObserver: ResizeObserver | null = null;

  try {
    const result = createWebGLContext(canvas, options);
    glContext = result.gl;

    enableDefaultFeatures(result.gl);
    result.gl.viewport(0, 0, canvas.width, canvas.height);

    onInit?.(result);

    if (onFrame) {
      animationLoop = createAnimationLoop((info: AnimationFrameInfo) => {
        if (glContext) {
          onFrame(info, glContext);
        }
      });
      animationLoop.start();
    }

    if (autoResize) {
      resizeObserver = new ResizeObserver(() => {
        if (glContext) {
          if (resizeCanvas(canvas, pixelRatio)) {
            glContext.viewport(0, 0, canvas.width, canvas.height);
            onResize?.(canvas.width, canvas.height);
          }
        }
      });
      resizeObserver.observe(canvas);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
  }

  // Cleanup function attached to canvas
  (canvas as HTMLCanvasElement & { cleanup?: () => void }).cleanup = () => {
    animationLoop?.stop();
    resizeObserver?.disconnect();
  };

  return canvas;
}

export default WebGLCanvas;
