/**
 * @file WebGL Integration Tests
 * @description Comprehensive tests for WebGL integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock WebGL context
const createMockWebGLContext = () => ({
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  ARRAY_BUFFER: 34962,
  ELEMENT_ARRAY_BUFFER: 34963,
  STATIC_DRAW: 35044,
  TRIANGLES: 4,
  FLOAT: 5126,
  UNSIGNED_SHORT: 5123,
  TEXTURE_2D: 3553,
  TEXTURE0: 33984,
  RGBA: 6408,
  UNSIGNED_BYTE: 5121,
  LINEAR: 9729,
  CLAMP_TO_EDGE: 33071,
  TEXTURE_MIN_FILTER: 10241,
  TEXTURE_MAG_FILTER: 10240,
  TEXTURE_WRAP_S: 10242,
  TEXTURE_WRAP_T: 10243,
  COLOR_BUFFER_BIT: 16384,
  DEPTH_BUFFER_BIT: 256,
  DEPTH_TEST: 2929,
  CULL_FACE: 2884,
  BLEND: 3042,
  BACK: 1029,
  LEQUAL: 515,
  SRC_ALPHA: 770,
  ONE_MINUS_SRC_ALPHA: 771,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  ACTIVE_UNIFORMS: 35718,
  ACTIVE_ATTRIBUTES: 35721,
  MAX_TEXTURE_SIZE: 3379,
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  deleteShader: vi.fn(),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ''),
  deleteProgram: vi.fn(),
  useProgram: vi.fn(),
  getActiveUniform: vi.fn((_, i) => i === 0 ? { name: 'uColor' } : null),
  getActiveAttrib: vi.fn((_, i) => i === 0 ? { name: 'aPosition' } : null),
  getUniformLocation: vi.fn(() => ({})),
  getAttribLocation: vi.fn(() => 0),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  bufferSubData: vi.fn(),
  deleteBuffer: vi.fn(),
  createTexture: vi.fn(() => ({})),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  texParameterf: vi.fn(),
  generateMipmap: vi.fn(),
  activeTexture: vi.fn(),
  deleteTexture: vi.fn(),
  pixelStorei: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  depthFunc: vi.fn(),
  cullFace: vi.fn(),
  blendFunc: vi.fn(),
  viewport: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  uniform1f: vi.fn(),
  uniform1i: vi.fn(),
  uniform1fv: vi.fn(),
  uniform2fv: vi.fn(),
  uniform3fv: vi.fn(),
  uniform4fv: vi.fn(),
  uniform1iv: vi.fn(),
  uniform2iv: vi.fn(),
  uniform3iv: vi.fn(),
  uniform4iv: vi.fn(),
  uniformMatrix3fv: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  getParameter: vi.fn((param) => {
    if (param === 3379) return 4096; // MAX_TEXTURE_SIZE
    return 'test';
  }),
  getExtension: vi.fn(() => null),
});

const createMockCanvas = () => {
  const gl = createMockWebGLContext();
  return {
    getContext: vi.fn((type) => {
      if (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl') {
        return gl;
      }
      return null;
    }),
    width: 800,
    height: 600,
    clientWidth: 800,
    clientHeight: 600,
    style: {},
  };
};

// Import after mocks are set up
import {
  createWebGLContext,
  isWebGLSupported,
  isWebGL2Supported,
  resizeCanvas,
  clearContext,
  enableDefaultFeatures,
} from './context';
import { compileShader, createProgram, setUniform } from './shaders';
import { createBuffer, createBufferInfo, createVertexArrayInfo } from './buffers';
import { createPlaceholderTexture, createDataTexture } from './textures';
import {
  mat4Identity,
  mat4Multiply,
  mat4Perspective,
  mat4LookAt,
  mat4Translate,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  mat4Scale,
  createCamera,
} from './camera';
import {
  createCube,
  createSphere,
  createPlane,
  createCylinder,
  createTorus,
  mergeGeometries,
} from './primitives';
import {
  createAnimationLoop,
  createFixedTimestepLoop,
  Easing,
  lerp,
  lerpVec3,
} from './animation';

describe('WebGL Context', () => {
  it('should create WebGL context from canvas', () => {
    const canvas = createMockCanvas() as unknown as HTMLCanvasElement;
    const result = createWebGLContext(canvas);
    expect(result.gl).toBeDefined();
    expect(result.canvas).toBe(canvas);
  });

  it('should prefer WebGL2 by default', () => {
    const canvas = createMockCanvas() as unknown as HTMLCanvasElement;
    createWebGLContext(canvas, { preferWebGL2: true });
    expect(canvas.getContext).toHaveBeenCalledWith('webgl2', expect.any(Object));
  });

  it('should fall back to WebGL1 if WebGL2 not available', () => {
    const canvas = createMockCanvas() as unknown as HTMLCanvasElement;
    canvas.getContext = vi.fn((type) => {
      if (type === 'webgl') return createMockWebGLContext();
      return null;
    });
    const result = createWebGLContext(canvas);
    expect(result.gl).toBeDefined();
    expect(result.isWebGL2).toBe(false);
  });

  it('should throw if WebGL2 required but not available', () => {
    const canvas = createMockCanvas() as unknown as HTMLCanvasElement;
    canvas.getContext = vi.fn(() => null);
    expect(() => createWebGLContext(canvas, { requireWebGL2: true }))
      .toThrow('WebGL2 is required');
  });

  it('should resize canvas correctly', () => {
    const canvas = {
      width: 800,
      height: 600,
      clientWidth: 1600,
      clientHeight: 1200,
    } as HTMLCanvasElement;
    const resized = resizeCanvas(canvas, 1);
    expect(resized).toBe(true);
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
  });

  it('should not resize if dimensions match', () => {
    const canvas = {
      width: 800,
      height: 600,
      clientWidth: 800,
      clientHeight: 600,
    } as HTMLCanvasElement;
    const resized = resizeCanvas(canvas, 1);
    expect(resized).toBe(false);
  });
});

describe('Shader Management', () => {
  it('should compile vertex shader', () => {
    const gl = createMockWebGLContext() as unknown as WebGLRenderingContext;
    const shader = compileShader(gl, 'void main() {}', gl.VERTEX_SHADER);
    expect(shader).toBeDefined();
    expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
  });

  it('should compile fragment shader', () => {
    const gl = createMockWebGLContext() as unknown as WebGLRenderingContext;
    const shader = compileShader(gl, 'void main() {}', gl.FRAGMENT_SHADER);
    expect(shader).toBeDefined();
    expect(gl.createShader).toHaveBeenCalledWith(gl.FRAGMENT_SHADER);
  });

  it('should throw on compile error', () => {
    const gl = createMockWebGLContext() as unknown as WebGLRenderingContext;
    gl.getShaderParameter = vi.fn(() => false);
    gl.getShaderInfoLog = vi.fn(() => 'Syntax error');
    expect(() => compileShader(gl, 'invalid', gl.VERTEX_SHADER))
      .toThrow('Failed to compile shader');
  });

  it('should create and link program', () => {
    const gl = createMockWebGLContext() as unknown as WebGLRenderingContext;
    const program = createProgram(gl, {
      vertex: 'void main() {}',
      fragment: 'void main() {}',
    });
    expect(program.program).toBeDefined();
    expect(program.uniforms).toBeInstanceOf(Map);
    expect(program.attributes).toBeInstanceOf(Map);
  });
});

describe('Buffer Management', () => {
  it('should create buffer', () => {
    const gl = createMockWebGLContext() as unknown as WebGLRenderingContext;
    const data = new Float32Array([1, 2, 3]);
    const buffer = createBuffer(gl, data);
    expect(buffer).toBeDefined();
    expect(gl.createBuffer).toHaveBeenCalled();
    expect(gl.bufferData).toHaveBeenCalled();
  });

  it('should create buffer info with options', () => {
    const gl = createMockWebGLContext() as unknown as WebGLRenderingContext;
    const data = new Float32Array([1, 2, 3, 4, 5, 6]);
    const bufferInfo = createBufferInfo(gl, data, { size: 3 });
    expect(bufferInfo.buffer).toBeDefined();
    expect(bufferInfo.size).toBe(3);
  });

  it('should detect type from Uint16Array', () => {
    const gl = createMockWebGLContext() as unknown as WebGLRenderingContext;
    const data = new Uint16Array([0, 1, 2]);
    const bufferInfo = createBufferInfo(gl, data);
    expect(bufferInfo.type).toBe(gl.UNSIGNED_SHORT);
  });
});

describe('Texture Management', () => {
  it('should create placeholder texture', () => {
    const gl = createMockWebGLContext() as unknown as WebGLRenderingContext;
    const texture = createPlaceholderTexture(gl, [255, 0, 0, 255]);
    expect(texture.texture).toBeDefined();
    expect(texture.width).toBe(1);
    expect(texture.height).toBe(1);
  });

  it('should create data texture', () => {
    const gl = createMockWebGLContext() as unknown as WebGLRenderingContext;
    const data = new Uint8Array(16);
    const texture = createDataTexture(gl, data, 2, 2);
    expect(texture.texture).toBeDefined();
    expect(texture.width).toBe(2);
    expect(texture.height).toBe(2);
  });
});

describe('Camera and Math', () => {
  it('should create identity matrix', () => {
    const identity = mat4Identity();
    expect(identity).toBeInstanceOf(Float32Array);
    expect(identity[0]).toBe(1);
    expect(identity[5]).toBe(1);
    expect(identity[10]).toBe(1);
    expect(identity[15]).toBe(1);
  });

  it('should multiply matrices', () => {
    const a = mat4Identity();
    const b = mat4Identity();
    const result = mat4Multiply(a, b);
    expect(result).toBeInstanceOf(Float32Array);
    expect(result[0]).toBe(1);
  });

  it('should create perspective matrix', () => {
    const perspective = mat4Perspective(Math.PI / 4, 16 / 9, 0.1, 100);
    expect(perspective).toBeInstanceOf(Float32Array);
    expect(perspective[15]).toBe(0); // Perspective divide
  });

  it('should create look-at matrix', () => {
    const view = mat4LookAt([0, 0, 5], [0, 0, 0], [0, 1, 0]);
    expect(view).toBeInstanceOf(Float32Array);
  });

  it('should create translation matrix', () => {
    const translate = mat4Translate(1, 2, 3);
    expect(translate[12]).toBe(1);
    expect(translate[13]).toBe(2);
    expect(translate[14]).toBe(3);
  });

  it('should create rotation matrices', () => {
    const rotX = mat4RotateX(Math.PI / 2);
    const rotY = mat4RotateY(Math.PI / 2);
    const rotZ = mat4RotateZ(Math.PI / 2);
    expect(rotX).toBeInstanceOf(Float32Array);
    expect(rotY).toBeInstanceOf(Float32Array);
    expect(rotZ).toBeInstanceOf(Float32Array);
  });

  it('should create scale matrix', () => {
    const scale = mat4Scale(2, 3, 4);
    expect(scale[0]).toBe(2);
    expect(scale[5]).toBe(3);
    expect(scale[10]).toBe(4);
  });

  it('should create camera with defaults', () => {
    const camera = createCamera();
    expect(camera.position).toBeInstanceOf(Float32Array);
    expect(camera.target).toBeInstanceOf(Float32Array);
    expect(camera.viewMatrix).toBeInstanceOf(Float32Array);
    expect(camera.projectionMatrix).toBeInstanceOf(Float32Array);
  });

  it('should create camera with options', () => {
    const camera = createCamera({
      position: [1, 2, 3],
      target: [0, 0, 0],
      fov: Math.PI / 3,
    });
    expect(camera.position[0]).toBe(1);
    expect(camera.position[1]).toBe(2);
    expect(camera.position[2]).toBe(3);
  });
});

describe('Primitives', () => {
  it('should create cube geometry', () => {
    const cube = createCube(2);
    expect(cube.vertices).toBeInstanceOf(Float32Array);
    expect(cube.normals).toBeInstanceOf(Float32Array);
    expect(cube.uvs).toBeInstanceOf(Float32Array);
    expect(cube.indices).toBeInstanceOf(Uint16Array);
    expect(cube.indices.length).toBe(36); // 6 faces * 2 triangles * 3 vertices
  });

  it('should create sphere geometry', () => {
    const sphere = createSphere(1, 16, 8);
    expect(sphere.vertices).toBeInstanceOf(Float32Array);
    expect(sphere.normals).toBeInstanceOf(Float32Array);
    expect(sphere.uvs).toBeInstanceOf(Float32Array);
    expect(sphere.indices.length).toBeGreaterThan(0);
  });

  it('should create plane geometry', () => {
    const plane = createPlane(2, 2, 2, 2);
    expect(plane.vertices).toBeInstanceOf(Float32Array);
    expect(plane.normals).toBeInstanceOf(Float32Array);
  });

  it('should create cylinder geometry', () => {
    const cylinder = createCylinder(0.5, 0.5, 2, 16, 1);
    expect(cylinder.vertices).toBeInstanceOf(Float32Array);
    expect(cylinder.indices.length).toBeGreaterThan(0);
  });

  it('should create torus geometry', () => {
    const torus = createTorus(1, 0.3, 16, 12);
    expect(torus.vertices).toBeInstanceOf(Float32Array);
    expect(torus.indices.length).toBeGreaterThan(0);
  });

  it('should merge geometries', () => {
    const cube1 = createCube(1);
    const cube2 = createCube(1);
    const merged = mergeGeometries([cube1, cube2]);
    expect(merged.vertices.length).toBe(cube1.vertices.length * 2);
    expect(merged.indices.length).toBe(cube1.indices.length * 2);
  });
});

describe('Animation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should create animation loop', () => {
    const callback = vi.fn();
    const loop = createAnimationLoop(callback);
    expect(loop.isRunning).toBe(false);
    expect(typeof loop.start).toBe('function');
    expect(typeof loop.stop).toBe('function');
  });

  it('should create fixed timestep loop', () => {
    const callback = vi.fn();
    const loop = createFixedTimestepLoop(callback, 1 / 60);
    expect(loop.isRunning).toBe(false);
    expect(typeof loop.update).toBe('function');
  });

  it('should have easing functions', () => {
    expect(Easing.linear(0.5)).toBe(0.5);
    expect(Easing.easeInQuad(0)).toBe(0);
    expect(Easing.easeOutQuad(1)).toBe(1);
    expect(Easing.easeInOutQuad(0.5)).toBeCloseTo(0.5, 5);
  });

  it('should interpolate values', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
  });

  it('should interpolate vectors', () => {
    const result = lerpVec3([0, 0, 0], [10, 20, 30], 0.5);
    expect(result[0]).toBe(5);
    expect(result[1]).toBe(10);
    expect(result[2]).toBe(15);
  });
});
