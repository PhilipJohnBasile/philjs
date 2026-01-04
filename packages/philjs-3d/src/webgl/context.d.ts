/**
 * @file WebGL Context Management
 * @description Create and manage WebGL contexts with WebGL2 fallback
 */
import type { WebGLContextOptions, WebGLContextResult } from './types.js';
/**
 * Create a WebGL context from a canvas element
 */
export declare function createWebGLContext(canvas: HTMLCanvasElement, options?: WebGLContextOptions): WebGLContextResult;
/**
 * Check if WebGL is supported
 */
export declare function isWebGLSupported(): boolean;
/**
 * Check if WebGL2 is supported
 */
export declare function isWebGL2Supported(): boolean;
/**
 * Get WebGL capabilities and limits
 */
export declare function getWebGLCapabilities(gl: WebGLRenderingContext | WebGL2RenderingContext): Record<string, number | string | boolean>;
/**
 * Resize the canvas to match its display size
 */
export declare function resizeCanvas(canvas: HTMLCanvasElement, pixelRatio?: number): boolean;
/**
 * Clear the WebGL context
 */
export declare function clearContext(gl: WebGLRenderingContext | WebGL2RenderingContext, r?: number, g?: number, b?: number, a?: number): void;
/**
 * Enable common WebGL features
 */
export declare function enableDefaultFeatures(gl: WebGLRenderingContext | WebGL2RenderingContext): void;
//# sourceMappingURL=context.d.ts.map