/**
 * @file Buffer Management
 * @description Create and manage WebGL buffers (VBO, VAO, IBO)
 */

import type { BufferInfo, VertexArrayInfo, WebGLExtensions } from './types';

// WebGL constants (avoid runtime dependency on WebGLRenderingContext)
const GL_ARRAY_BUFFER = 34962;
const GL_STATIC_DRAW = 35044;

/**
 * Create a vertex buffer object (VBO)
 */
export function createBuffer(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  data: ArrayBuffer | ArrayBufferView,
  target: number = GL_ARRAY_BUFFER,
  usage: number = GL_STATIC_DRAW
): WebGLBuffer {
  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error('Failed to create buffer');
  }

  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, usage);
  gl.bindBuffer(target, null);

  return buffer;
}

/**
 * Create a buffer with full info
 */
export function createBufferInfo(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  data: Float32Array | Uint16Array | Uint32Array,
  options: {
    target?: number;
    usage?: number;
    size?: number;
    type?: number;
    stride?: number;
    offset?: number;
    normalize?: boolean;
  } = {}
): BufferInfo {
  const target = options.target ?? gl.ARRAY_BUFFER;
  const usage = options.usage ?? gl.STATIC_DRAW;
  const buffer = createBuffer(gl, data, target, usage);

  // Determine type from data
  let type = options.type ?? gl.FLOAT;
  if (data instanceof Uint16Array) {
    type = gl.UNSIGNED_SHORT;
  } else if (data instanceof Uint32Array) {
    type = gl.UNSIGNED_INT;
  }

  return {
    buffer,
    target,
    usage,
    size: options.size ?? 3,
    type,
    stride: options.stride ?? 0,
    offset: options.offset ?? 0,
    normalize: options.normalize ?? false,
  };
}

/**
 * Update buffer data
 */
export function updateBuffer(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  bufferInfo: BufferInfo,
  data: ArrayBuffer | ArrayBufferView,
  offset: number = 0
): void {
  gl.bindBuffer(bufferInfo.target, bufferInfo.buffer);
  gl.bufferSubData(bufferInfo.target, offset, data);
  gl.bindBuffer(bufferInfo.target, null);
}

/**
 * Delete a buffer
 */
export function deleteBuffer(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  buffer: WebGLBuffer | BufferInfo
): void {
  const buf = 'buffer' in buffer ? buffer.buffer : buffer;
  gl.deleteBuffer(buf);
}

/**
 * Create a Vertex Array Object (VAO)
 */
export function createVertexArray(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  extensions?: WebGLExtensions
): WebGLVertexArrayObject | WebGLVertexArrayObjectOES {
  if (gl instanceof WebGL2RenderingContext) {
    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error('Failed to create VAO');
    }
    return vao;
  }

  // WebGL1 fallback
  const ext = extensions?.vertexArrayObject;
  if (!ext) {
    throw new Error('VAO extension not available');
  }

  const vao = ext.createVertexArrayOES();
  if (!vao) {
    throw new Error('Failed to create VAO');
  }
  return vao;
}

/**
 * Bind a Vertex Array Object
 */
export function bindVertexArray(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vao: WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null,
  extensions?: WebGLExtensions
): void {
  if (gl instanceof WebGL2RenderingContext) {
    gl.bindVertexArray(vao as WebGLVertexArrayObject | null);
  } else {
    const ext = extensions?.vertexArrayObject;
    if (!ext) {
      throw new Error('VAO extension not available');
    }
    ext.bindVertexArrayOES(vao as WebGLVertexArrayObjectOES | null);
  }
}

/**
 * Delete a Vertex Array Object
 */
export function deleteVertexArray(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vao: WebGLVertexArrayObject | WebGLVertexArrayObjectOES,
  extensions?: WebGLExtensions
): void {
  if (gl instanceof WebGL2RenderingContext) {
    gl.deleteVertexArray(vao as WebGLVertexArrayObject);
  } else {
    const ext = extensions?.vertexArrayObject;
    if (!ext) {
      throw new Error('VAO extension not available');
    }
    ext.deleteVertexArrayOES(vao as WebGLVertexArrayObjectOES);
  }
}

/**
 * Create a complete vertex array with buffers
 */
export function createVertexArrayInfo(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  attributes: {
    name: string;
    data: Float32Array;
    size?: number;
    normalized?: boolean;
    stride?: number;
    offset?: number;
  }[],
  indices?: Uint16Array | Uint32Array,
  extensions?: WebGLExtensions
): VertexArrayInfo {
  const vao = createVertexArray(gl, extensions);
  bindVertexArray(gl, vao, extensions);

  const buffers = new Map<string, BufferInfo>();
  let vertexCount = 0;

  // Create attribute buffers
  for (const attr of attributes) {
    const bufferInfo = createBufferInfo(gl, attr.data, {
      target: gl.ARRAY_BUFFER,
      usage: gl.STATIC_DRAW,
      size: attr.size ?? 3,
      normalize: attr.normalized ?? false,
      stride: attr.stride ?? 0,
      offset: attr.offset ?? 0,
    });
    buffers.set(attr.name, bufferInfo);

    // Calculate vertex count from first attribute
    if (vertexCount === 0) {
      const size = attr.size ?? 3;
      vertexCount = attr.data.length / size;
    }
  }

  // Create index buffer if provided
  let indexBuffer: BufferInfo | undefined;
  let indexCount: number | undefined;

  if (indices) {
    indexBuffer = createBufferInfo(gl, indices, {
      target: gl.ELEMENT_ARRAY_BUFFER,
      usage: gl.STATIC_DRAW,
      type: indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
    });
    indexCount = indices.length;
  }

  bindVertexArray(gl, null, extensions);

  return {
    vao,
    buffers,
    indexBuffer,
    vertexCount,
    indexCount,
  };
}

/**
 * Setup vertex attributes for a VAO
 */
export function setupVertexAttributes(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vaoInfo: VertexArrayInfo,
  attributeLocations: Map<string, number>,
  extensions?: WebGLExtensions
): void {
  bindVertexArray(gl, vaoInfo.vao, extensions);

  for (const [name, location] of attributeLocations) {
    const bufferInfo = vaoInfo.buffers.get(name);
    if (!bufferInfo) {
      console.warn(`Buffer for attribute "${name}" not found`);
      continue;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(
      location,
      bufferInfo.size,
      bufferInfo.type,
      bufferInfo.normalize,
      bufferInfo.stride,
      bufferInfo.offset
    );
  }

  // Bind index buffer if present
  if (vaoInfo.indexBuffer) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vaoInfo.indexBuffer.buffer);
  }

  bindVertexArray(gl, null, extensions);
}

/**
 * Draw with a VAO
 */
export function drawVertexArray(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vaoInfo: VertexArrayInfo,
  mode: number = WebGLRenderingContext.TRIANGLES,
  extensions?: WebGLExtensions
): void {
  bindVertexArray(gl, vaoInfo.vao, extensions);

  if (vaoInfo.indexBuffer && vaoInfo.indexCount !== undefined) {
    gl.drawElements(mode, vaoInfo.indexCount, vaoInfo.indexBuffer.type, 0);
  } else {
    gl.drawArrays(mode, 0, vaoInfo.vertexCount);
  }

  bindVertexArray(gl, null, extensions);
}

/**
 * Delete vertex array and all its buffers
 */
export function deleteVertexArrayInfo(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vaoInfo: VertexArrayInfo,
  extensions?: WebGLExtensions
): void {
  for (const bufferInfo of vaoInfo.buffers.values()) {
    deleteBuffer(gl, bufferInfo);
  }
  if (vaoInfo.indexBuffer) {
    deleteBuffer(gl, vaoInfo.indexBuffer);
  }
  deleteVertexArray(gl, vaoInfo.vao, extensions);
}
