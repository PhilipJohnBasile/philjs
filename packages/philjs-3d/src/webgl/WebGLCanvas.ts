/**
 * @file WebGLCanvas Component
 * @description WebGL canvas component for PhilJS
 */

import type { WebGLContextOptions, WebGLContextResult } from './types.js';
import { createWebGLContext, resizeCanvas } from './context.js';

/**
 * WebGL canvas props
 */
export interface WebGLCanvasProps {
  /** Canvas ID */
  id?: string | undefined;
  /** Width */
  width?: number | undefined;
  /** Height */
  height?: number | undefined;
  /** Pixel ratio */
  pixelRatio?: number | undefined;
  /** WebGL context options */
  contextOptions?: WebGLContextOptions | undefined;
  /** Called when context is created */
  onContextCreated?: ((result: WebGLContextResult) => void) | undefined;
  /** Called on resize */
  onResize?: ((width: number, height: number) => void) | undefined;
  /** Called on error */
  onError?: ((error: Error) => void) | undefined;
  /** Auto resize */
  autoResize?: boolean | undefined;
  /** Custom styles */
  style?: Record<string, string | number> | undefined;
  /** CSS class name */
  className?: string | undefined;
}

/**
 * Create a WebGL canvas element
 *
 * @param props - WebGL canvas properties
 * @returns HTMLElement containing the WebGL canvas
 */
export function WebGLCanvas(props: WebGLCanvasProps): HTMLElement {
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
  canvas.id = props.id ?? `webgl-canvas-${Date.now()}`;

  const width = props.width ?? 800;
  const height = props.height ?? 600;
  const pixelRatio = props.pixelRatio ?? window.devicePixelRatio ?? 1;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  container.appendChild(canvas);

  // Create WebGL context
  try {
    const result = createWebGLContext(canvas, props.contextOptions);
    props.onContextCreated?.(result);

    // Handle auto resize
    if (props.autoResize) {
      const handleResize = () => {
        const rect = container.getBoundingClientRect();
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        resizeCanvas(canvas, props.pixelRatio ?? window.devicePixelRatio ?? 1);
        result.gl.viewport(0, 0, canvas.width, canvas.height);
        props.onResize?.(rect.width, rect.height);
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

  return container;
}

/**
 * Create a WebGL canvas element (alias)
 */
export const createWebGLCanvasElement = WebGLCanvas;
