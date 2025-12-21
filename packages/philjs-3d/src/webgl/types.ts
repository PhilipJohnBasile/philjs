/**
 * @file WebGL Types
 * @description Type definitions for WebGL integration
 */

export interface WebGLContextOptions {
  /** Enable antialiasing */
  antialias?: boolean;
  /** Enable alpha channel */
  alpha?: boolean;
  /** Enable depth buffer */
  depth?: boolean;
  /** Enable stencil buffer */
  stencil?: boolean;
  /** Prefer high-performance GPU */
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  /** Preserve drawing buffer */
  preserveDrawingBuffer?: boolean;
  /** Fail if WebGL2 is not available */
  requireWebGL2?: boolean;
  /** Prefer WebGL2 over WebGL1 */
  preferWebGL2?: boolean;
}

export interface WebGLContextResult {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  isWebGL2: boolean;
  canvas: HTMLCanvasElement;
  extensions: WebGLExtensions;
}

export interface WebGLExtensions {
  /** Instanced rendering */
  instancedArrays?: ANGLE_instanced_arrays | null;
  /** Vertex array objects */
  vertexArrayObject?: OES_vertex_array_object | null;
  /** Anisotropic filtering */
  anisotropicFilter?: EXT_texture_filter_anisotropic | null;
  /** Float textures */
  floatTextures?: OES_texture_float | null;
  /** Half float textures */
  halfFloatTextures?: OES_texture_half_float | null;
  /** Standard derivatives */
  standardDerivatives?: OES_standard_derivatives | null;
  /** Draw buffers */
  drawBuffers?: WEBGL_draw_buffers | null;
  /** Depth texture */
  depthTexture?: WEBGL_depth_texture | null;
}

export interface ShaderProgram {
  program: WebGLProgram;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  uniforms: Map<string, WebGLUniformLocation>;
  attributes: Map<string, number>;
}

export interface ShaderSource {
  vertex: string;
  fragment: string;
}

export interface BufferInfo {
  buffer: WebGLBuffer;
  target: number;
  usage: number;
  size: number;
  type: number;
  stride: number;
  offset: number;
  normalize: boolean;
}

export interface VertexArrayInfo {
  vao: WebGLVertexArrayObject | WebGLVertexArrayObjectOES;
  buffers: Map<string, BufferInfo>;
  indexBuffer?: BufferInfo;
  vertexCount: number;
  indexCount?: number;
}

export interface TextureInfo {
  texture: WebGLTexture;
  width: number;
  height: number;
  format: number;
  type: number;
  minFilter: number;
  magFilter: number;
  wrapS: number;
  wrapT: number;
}

export interface TextureOptions {
  minFilter?: number;
  magFilter?: number;
  wrapS?: number;
  wrapT?: number;
  generateMipmaps?: boolean;
  flipY?: boolean;
  premultiplyAlpha?: boolean;
  anisotropy?: number;
}

export interface Camera {
  position: Float32Array;
  target: Float32Array;
  up: Float32Array;
  fov: number;
  aspect: number;
  near: number;
  far: number;
  viewMatrix: Float32Array;
  projectionMatrix: Float32Array;
}

export interface CameraOptions {
  position?: [number, number, number];
  target?: [number, number, number];
  up?: [number, number, number];
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
}

export interface Transform {
  position: Float32Array;
  rotation: Float32Array;
  scale: Float32Array;
  matrix: Float32Array;
}

export interface PrimitiveGeometry {
  vertices: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array | Uint32Array;
}

export interface AnimationFrameInfo {
  time: number;
  deltaTime: number;
  frameCount: number;
}

export interface AnimationLoop {
  start: () => void;
  stop: () => void;
  isRunning: boolean;
  fps: number;
}

export interface WebGLState {
  gl: WebGLRenderingContext | WebGL2RenderingContext | null;
  isWebGL2: boolean;
  canvas: HTMLCanvasElement | null;
  programs: Map<string, ShaderProgram>;
  textures: Map<string, TextureInfo>;
  buffers: Map<string, BufferInfo>;
  vaos: Map<string, VertexArrayInfo>;
  currentProgram: ShaderProgram | null;
  animationLoop: AnimationLoop | null;
}

export interface WebGLCanvasProps {
  width?: number;
  height?: number;
  options?: WebGLContextOptions;
  onInit?: (result: WebGLContextResult) => void;
  onFrame?: (info: AnimationFrameInfo, gl: WebGLRenderingContext | WebGL2RenderingContext) => void;
  onResize?: (width: number, height: number) => void;
  onError?: (error: Error) => void;
  style?: Record<string, string | number>;
  className?: string;
  autoResize?: boolean;
  pixelRatio?: number;
}
