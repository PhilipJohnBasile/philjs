/**
 * @file WebGL Context Management
 * @description Create and manage WebGL contexts with WebGL2 fallback
 */

import type {
  WebGLContextOptions,
  WebGLContextResult,
  WebGLExtensions,
} from './types';

/**
 * Default WebGL context options
 */
const DEFAULT_OPTIONS: WebGLContextOptions = {
  antialias: true,
  alpha: true,
  depth: true,
  stencil: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false,
  requireWebGL2: false,
  preferWebGL2: true,
};

/**
 * Get WebGL extensions for WebGL1 context
 */
function getWebGL1Extensions(gl: WebGLRenderingContext): WebGLExtensions {
  return {
    instancedArrays: gl.getExtension('ANGLE_instanced_arrays'),
    vertexArrayObject: gl.getExtension('OES_vertex_array_object'),
    anisotropicFilter: gl.getExtension('EXT_texture_filter_anisotropic') ||
      gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
      gl.getExtension('MOZ_EXT_texture_filter_anisotropic'),
    floatTextures: gl.getExtension('OES_texture_float'),
    halfFloatTextures: gl.getExtension('OES_texture_half_float'),
    standardDerivatives: gl.getExtension('OES_standard_derivatives'),
    drawBuffers: gl.getExtension('WEBGL_draw_buffers'),
    depthTexture: gl.getExtension('WEBGL_depth_texture'),
  };
}

/**
 * Get WebGL extensions for WebGL2 context (most are built-in)
 */
function getWebGL2Extensions(gl: WebGL2RenderingContext): WebGLExtensions {
  return {
    instancedArrays: null, // Built into WebGL2
    vertexArrayObject: null, // Built into WebGL2
    anisotropicFilter: gl.getExtension('EXT_texture_filter_anisotropic'),
    floatTextures: null, // Built into WebGL2
    halfFloatTextures: null, // Built into WebGL2
    standardDerivatives: null, // Built into WebGL2
    drawBuffers: null, // Built into WebGL2
    depthTexture: null, // Built into WebGL2
  };
}

/**
 * Create a WebGL context from a canvas element
 */
export function createWebGLContext(
  canvas: HTMLCanvasElement,
  options: WebGLContextOptions = {}
): WebGLContextResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const contextAttributes: WebGLContextAttributes = {
    antialias: opts.antialias,
    alpha: opts.alpha,
    depth: opts.depth,
    stencil: opts.stencil,
    powerPreference: opts.powerPreference,
    preserveDrawingBuffer: opts.preserveDrawingBuffer,
  };

  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let isWebGL2 = false;

  // Try WebGL2 first if preferred
  if (opts.preferWebGL2) {
    gl = canvas.getContext('webgl2', contextAttributes) as WebGL2RenderingContext | null;
    if (gl) {
      isWebGL2 = true;
    }
  }

  // Fallback to WebGL1 if WebGL2 not available or not preferred
  if (!gl && !opts.requireWebGL2) {
    gl = canvas.getContext('webgl', contextAttributes) as WebGLRenderingContext | null;
    if (!gl) {
      gl = canvas.getContext('experimental-webgl', contextAttributes) as WebGLRenderingContext | null;
    }
  }

  if (!gl) {
    if (opts.requireWebGL2) {
      throw new Error('WebGL2 is required but not available in this browser');
    }
    throw new Error('WebGL is not supported in this browser');
  }

  // Get extensions
  const extensions = isWebGL2
    ? getWebGL2Extensions(gl as WebGL2RenderingContext)
    : getWebGL1Extensions(gl as WebGLRenderingContext);

  return {
    gl,
    isWebGL2,
    canvas,
    extensions,
  };
}

/**
 * Check if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

/**
 * Check if WebGL2 is supported
 */
export function isWebGL2Supported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

/**
 * Get WebGL capabilities and limits
 */
export function getWebGLCapabilities(gl: WebGLRenderingContext | WebGL2RenderingContext): Record<string, number | string | boolean> {
  const isWebGL2 = gl instanceof WebGL2RenderingContext;

  return {
    version: isWebGL2 ? 2 : 1,
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),
    glslVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxCubeMapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
    maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    maxVertexTextureUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
    maxCombinedTextureUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
    aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
    aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    redBits: gl.getParameter(gl.RED_BITS),
    greenBits: gl.getParameter(gl.GREEN_BITS),
    blueBits: gl.getParameter(gl.BLUE_BITS),
    alphaBits: gl.getParameter(gl.ALPHA_BITS),
    depthBits: gl.getParameter(gl.DEPTH_BITS),
    stencilBits: gl.getParameter(gl.STENCIL_BITS),
  };
}

/**
 * Resize the canvas to match its display size
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  pixelRatio: number = window.devicePixelRatio || 1
): boolean {
  const displayWidth = Math.floor(canvas.clientWidth * pixelRatio);
  const displayHeight = Math.floor(canvas.clientHeight * pixelRatio);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    return true;
  }

  return false;
}

/**
 * Clear the WebGL context
 */
export function clearContext(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  r: number = 0,
  g: number = 0,
  b: number = 0,
  a: number = 1
): void {
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Enable common WebGL features
 */
export function enableDefaultFeatures(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
  // Enable depth testing
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // Enable backface culling
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  // Enable blending
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}
