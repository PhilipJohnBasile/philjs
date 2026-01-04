/**
 * @file WebGL Hooks
 * @description PhilJS hooks for WebGL integration
 */
import type { WebGLContextOptions, WebGLContextResult, WebGLState, ShaderProgram, Camera } from './types.js';
import { type FrameCallback } from './animation.js';
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
export declare function useWebGL(canvas: HTMLCanvasElement | null, options?: WebGLContextOptions): WebGLHookContext | null;
/**
 * Hook for animation frame loop
 */
export declare function useAnimationFrame(context: WebGLHookContext | null, callback: FrameCallback, autoStart?: boolean): {
    start: () => void;
    stop: () => void;
    isRunning: boolean;
};
/**
 * Hook for shader program management
 */
export declare function useShaderProgram(context: WebGLHookContext | null, name: string, vertexSource: string, fragmentSource: string): ShaderProgram | null;
/**
 * Hook for using a shader program
 */
export declare function useActiveProgram(context: WebGLHookContext | null, program: ShaderProgram | null): void;
/**
 * Hook for setting shader uniforms
 */
export declare function useUniforms(context: WebGLHookContext | null, program: ShaderProgram | null, uniforms: Record<string, number | number[] | Float32Array | Int32Array | boolean>): void;
/**
 * Hook for camera management
 */
export declare function useCamera(context: WebGLHookContext | null, options?: {
    position?: [number, number, number];
    target?: [number, number, number];
    up?: [number, number, number];
    fov?: number;
    near?: number;
    far?: number;
}): Camera | null;
/**
 * Hook for auto-resize handling
 */
export declare function useAutoResize(context: WebGLHookContext | null, callback?: (width: number, height: number) => void, pixelRatio?: number): void;
/**
 * Hook for render pass
 */
export declare function useRenderPass(context: WebGLHookContext | null, clearColor?: [number, number, number, number]): {
    begin: () => void;
    end: () => void;
};
/**
 * Cleanup WebGL resources
 */
export declare function cleanupWebGL(canvas: HTMLCanvasElement): void;
//# sourceMappingURL=hooks.d.ts.map