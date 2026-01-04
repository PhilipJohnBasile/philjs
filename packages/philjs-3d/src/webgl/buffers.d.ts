/**
 * @file Buffer Management
 * @description Create and manage WebGL buffers (VBO, VAO, IBO)
 */
import type { BufferInfo, VertexArrayInfo, WebGLExtensions } from './types.js';
/**
 * Create a vertex buffer object (VBO)
 */
export declare function createBuffer(gl: WebGLRenderingContext | WebGL2RenderingContext, data: ArrayBuffer | ArrayBufferView, target?: number, usage?: number): WebGLBuffer;
/**
 * Create a buffer with full info
 */
export declare function createBufferInfo(gl: WebGLRenderingContext | WebGL2RenderingContext, data: Float32Array | Uint16Array | Uint32Array, options?: {
    target?: number;
    usage?: number;
    size?: number;
    type?: number;
    stride?: number;
    offset?: number;
    normalize?: boolean;
}): BufferInfo;
/**
 * Update buffer data
 */
export declare function updateBuffer(gl: WebGLRenderingContext | WebGL2RenderingContext, bufferInfo: BufferInfo, data: ArrayBuffer | ArrayBufferView, offset?: number): void;
/**
 * Delete a buffer
 */
export declare function deleteBuffer(gl: WebGLRenderingContext | WebGL2RenderingContext, buffer: WebGLBuffer | BufferInfo): void;
/**
 * Create a Vertex Array Object (VAO)
 */
export declare function createVertexArray(gl: WebGLRenderingContext | WebGL2RenderingContext, extensions?: WebGLExtensions): WebGLVertexArrayObject | WebGLVertexArrayObjectOES;
/**
 * Bind a Vertex Array Object
 */
export declare function bindVertexArray(gl: WebGLRenderingContext | WebGL2RenderingContext, vao: WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null, extensions?: WebGLExtensions): void;
/**
 * Delete a Vertex Array Object
 */
export declare function deleteVertexArray(gl: WebGLRenderingContext | WebGL2RenderingContext, vao: WebGLVertexArrayObject | WebGLVertexArrayObjectOES, extensions?: WebGLExtensions): void;
/**
 * Create a complete vertex array with buffers
 */
export declare function createVertexArrayInfo(gl: WebGLRenderingContext | WebGL2RenderingContext, attributes: {
    name: string;
    data: Float32Array;
    size?: number;
    normalized?: boolean;
    stride?: number;
    offset?: number;
}[], indices?: Uint16Array | Uint32Array, extensions?: WebGLExtensions): VertexArrayInfo;
/**
 * Setup vertex attributes for a VAO
 */
export declare function setupVertexAttributes(gl: WebGLRenderingContext | WebGL2RenderingContext, vaoInfo: VertexArrayInfo, attributeLocations: Map<string, number>, extensions?: WebGLExtensions): void;
/**
 * Draw with a VAO
 */
export declare function drawVertexArray(gl: WebGLRenderingContext | WebGL2RenderingContext, vaoInfo: VertexArrayInfo, mode?: number, extensions?: WebGLExtensions): void;
/**
 * Delete vertex array and all its buffers
 */
export declare function deleteVertexArrayInfo(gl: WebGLRenderingContext | WebGL2RenderingContext, vaoInfo: VertexArrayInfo, extensions?: WebGLExtensions): void;
//# sourceMappingURL=buffers.d.ts.map