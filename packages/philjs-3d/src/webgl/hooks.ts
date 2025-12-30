/**
 * @file WebGL Hooks
 * @description PhilJS hooks for WebGL integration
 */

import type {
  WebGLContextOptions,
  WebGLContextResult,
  WebGLState,
  AnimationFrameInfo,
  ShaderProgram,
  TextureInfo,
  Camera,
} from './types.js';
import { createWebGLContext, resizeCanvas } from './context.js';
import { createProgram, useProgram, setUniforms } from './shaders.js';
import { createAnimationLoop, type FrameCallback } from './animation.js';
import { createCamera, updateCameraView, updateCameraProjection } from './camera.js';

/**
 * Global WebGL state (singleton per context)
 */
const webglStates = new WeakMap<HTMLCanvasElement, WebGLState>();

/**
 * Get or create WebGL state for a canvas
 */
function getWebGLState(canvas: HTMLCanvasElement): WebGLState {
  let state = webglStates.get(canvas);
  if (!state) {
    state = {
      gl: null,
      isWebGL2: false,
      canvas: null,
      programs: new Map(),
      textures: new Map(),
      buffers: new Map(),
      vaos: new Map(),
      currentProgram: null,
      animationLoop: null,
    };
    webglStates.set(canvas, state);
  }
  return state;
}

/**
 * Hook context for WebGL
 */
export interface WebGLHookContext {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  isWebGL2: boolean;
  canvas: HTMLCanvasElement;
  state: WebGLState;
  result: WebGLContextResult;
}

/**
 * Initialize WebGL for a canvas element
 * Returns a context object for use with other hooks
 */
export function useWebGL(
  canvas: HTMLCanvasElement | null,
  options: WebGLContextOptions = {}
): WebGLHookContext | null {
  if (!canvas) return null;

  const state = getWebGLState(canvas);

  // Initialize if not already done
  if (!state.gl) {
    try {
      const result = createWebGLContext(canvas, options);
      state.gl = result.gl;
      state.isWebGL2 = result.isWebGL2;
      state.canvas = result.canvas;

      return {
        gl: result.gl,
        isWebGL2: result.isWebGL2,
        canvas: result.canvas,
        state,
        result,
      };
    } catch (error) {
      console.error('Failed to initialize WebGL:', error);
      return null;
    }
  }

  return {
    gl: state.gl,
    isWebGL2: state.isWebGL2,
    canvas: state.canvas!,
    state,
    result: {
      gl: state.gl,
      isWebGL2: state.isWebGL2,
      canvas: state.canvas!,
      extensions: {},
    },
  };
}

/**
 * Hook for animation frame loop
 */
export function useAnimationFrame(
  context: WebGLHookContext | null,
  callback: FrameCallback,
  autoStart: boolean = true
): {
  start: () => void;
  stop: () => void;
  isRunning: boolean;
} {
  if (!context) {
    return {
      start: () => {},
      stop: () => {},
      isRunning: false,
    };
  }

  const { state } = context;

  if (!state.animationLoop) {
    state.animationLoop = createAnimationLoop(callback);
  }

  if (autoStart && !state.animationLoop.isRunning) {
    state.animationLoop.start();
  }

  return {
    start: () => state.animationLoop?.start(),
    stop: () => state.animationLoop?.stop(),
    get isRunning() {
      return state.animationLoop?.isRunning ?? false;
    },
  };
}

/**
 * Hook for shader program management
 */
export function useShaderProgram(
  context: WebGLHookContext | null,
  name: string,
  vertexSource: string,
  fragmentSource: string
): ShaderProgram | null {
  if (!context) return null;

  const { gl, state } = context;

  // Check if program already exists
  let program = state.programs.get(name);
  if (program) {
    return program;
  }

  // Create new program
  try {
    program = createProgram(gl, { vertex: vertexSource, fragment: fragmentSource });
    state.programs.set(name, program);
    return program;
  } catch (error) {
    console.error(`Failed to create shader program "${name}":`, error);
    return null;
  }
}

/**
 * Hook for using a shader program
 */
export function useActiveProgram(
  context: WebGLHookContext | null,
  program: ShaderProgram | null
): void {
  if (!context || !program) return;

  const { gl, state } = context;

  if (state.currentProgram !== program) {
    useProgram(gl, program);
    state.currentProgram = program;
  }
}

/**
 * Hook for setting shader uniforms
 */
export function useUniforms(
  context: WebGLHookContext | null,
  program: ShaderProgram | null,
  uniforms: Record<string, number | number[] | Float32Array | Int32Array | boolean>
): void {
  if (!context || !program) return;

  const { gl } = context;
  useActiveProgram(context, program);
  setUniforms(gl, program, uniforms);
}

/**
 * Hook for camera management
 */
export function useCamera(
  context: WebGLHookContext | null,
  options: {
    position?: [number, number, number];
    target?: [number, number, number];
    up?: [number, number, number];
    fov?: number;
    near?: number;
    far?: number;
  } = {}
): Camera | null {
  if (!context) return null;

  const { canvas } = context;
  const aspect = canvas.clientWidth / canvas.clientHeight;

  return createCamera({
    ...options,
    aspect,
  });
}

/**
 * Hook for auto-resize handling
 */
export function useAutoResize(
  context: WebGLHookContext | null,
  callback?: (width: number, height: number) => void,
  pixelRatio: number = window.devicePixelRatio || 1
): void {
  if (!context) return;

  const { gl, canvas } = context;

  const handleResize = () => {
    if (resizeCanvas(canvas, pixelRatio)) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      callback?.(canvas.width, canvas.height);
    }
  };

  // Initial resize
  handleResize();

  // Note: In a real PhilJS implementation, this would use signals/effects
  // For now, we'll use ResizeObserver
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas);
  }
}

/**
 * Hook for render pass
 */
export function useRenderPass(
  context: WebGLHookContext | null,
  clearColor: [number, number, number, number] = [0, 0, 0, 1]
): {
  begin: () => void;
  end: () => void;
} {
  if (!context) {
    return {
      begin: () => {},
      end: () => {},
    };
  }

  const { gl } = context;

  return {
    begin: () => {
      gl.clearColor(...clearColor);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },
    end: () => {
      // Placeholder for any cleanup
    },
  };
}

/**
 * Cleanup WebGL resources
 */
export function cleanupWebGL(canvas: HTMLCanvasElement): void {
  const state = webglStates.get(canvas);
  if (!state) return;

  // Stop animation loop
  state.animationLoop?.stop();

  // Delete programs
  if (state.gl) {
    for (const program of state.programs.values()) {
      state.gl.deleteShader(program.vertexShader);
      state.gl.deleteShader(program.fragmentShader);
      state.gl.deleteProgram(program.program);
    }

    // Delete textures
    for (const texture of state.textures.values()) {
      state.gl.deleteTexture(texture.texture);
    }

    // Delete buffers
    for (const buffer of state.buffers.values()) {
      state.gl.deleteBuffer(buffer.buffer);
    }
  }

  // Clear state
  state.programs.clear();
  state.textures.clear();
  state.buffers.clear();
  state.vaos.clear();

  webglStates.delete(canvas);
}
