/**
 * @file WebGLCanvas Component
 * @description WebGL canvas component for PhilJS
 */
import type { WebGLContextOptions, WebGLContextResult } from './types.js';
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
export declare function WebGLCanvas(props: WebGLCanvasProps): HTMLElement;
/**
 * Create a WebGL canvas element (alias)
 */
export declare const createWebGLCanvasElement: typeof WebGLCanvas;
//# sourceMappingURL=WebGLCanvas.d.ts.map