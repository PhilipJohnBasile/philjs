/**
 * @file Texture Management
 * @description Load and manage WebGL textures
 */

import type { TextureInfo, TextureOptions, WebGLExtensions } from './types.js';

/**
 * Get default texture options (lazy to avoid SSR issues)
 */
function getDefaultTextureOptions(): TextureOptions {
  return {
    minFilter: typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext.LINEAR_MIPMAP_LINEAR : 9987,
    magFilter: typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext.LINEAR : 9729,
    wrapS: typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext.CLAMP_TO_EDGE : 33071,
    wrapT: typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext.CLAMP_TO_EDGE : 33071,
    generateMipmaps: true,
    flipY: true,
    premultiplyAlpha: false,
    anisotropy: 1,
  };
}

/**
 * Check if a number is a power of 2
 */
function isPowerOf2(value: number): boolean {
  return (value & (value - 1)) === 0;
}

/**
 * Create a texture from an image element
 */
export function createTextureFromImage(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  image: HTMLImageElement | ImageBitmap | HTMLCanvasElement | HTMLVideoElement,
  options: TextureOptions = {},
  extensions?: WebGLExtensions
): TextureInfo {
  const opts = { ...getDefaultTextureOptions(), ...options };
  const texture = gl.createTexture();

  if (!texture) {
    throw new Error('Failed to create texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set pixel store parameters
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, opts.flipY ? 1 : 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, opts.premultiplyAlpha ? 1 : 0);

  // Upload image data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image as TexImageSource
  );

  const width = 'width' in image ? image.width : (image as HTMLVideoElement).videoWidth;
  const height = 'height' in image ? image.height : (image as HTMLVideoElement).videoHeight;

  // Set texture parameters
  let minFilter = opts.minFilter!;
  let magFilter = opts.magFilter!;
  let wrapS = opts.wrapS!;
  let wrapT = opts.wrapT!;

  // Handle non-power-of-2 textures
  const isPOT = isPowerOf2(width) && isPowerOf2(height);
  if (!isPOT && !(gl instanceof WebGL2RenderingContext)) {
    // WebGL1 requires POT for mipmaps and repeat wrap
    if (opts.generateMipmaps) {
      minFilter = gl.LINEAR;
    }
    wrapS = gl.CLAMP_TO_EDGE;
    wrapT = gl.CLAMP_TO_EDGE;
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

  // Generate mipmaps
  if (opts.generateMipmaps && (isPOT || gl instanceof WebGL2RenderingContext)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  // Apply anisotropic filtering
  if (opts.anisotropy && opts.anisotropy > 1 && extensions?.anisotropicFilter) {
    const maxAnisotropy = gl.getParameter(
      extensions.anisotropicFilter.MAX_TEXTURE_MAX_ANISOTROPY_EXT
    );
    gl.texParameterf(
      gl.TEXTURE_2D,
      extensions.anisotropicFilter.TEXTURE_MAX_ANISOTROPY_EXT,
      Math.min(opts.anisotropy, maxAnisotropy)
    );
  }

  gl.bindTexture(gl.TEXTURE_2D, null);

  return {
    texture,
    width,
    height,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
    minFilter,
    magFilter,
    wrapS,
    wrapT,
  };
}

/**
 * Load a texture from a URL
 */
export function loadTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  url: string,
  options: TextureOptions = {},
  extensions?: WebGLExtensions
): Promise<TextureInfo> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const textureInfo = createTextureFromImage(gl, image, options, extensions);
        resolve(textureInfo);
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error(`Failed to load texture: ${url}`));
    };

    image.src = url;
  });
}

/**
 * Create a placeholder texture (1x1 pixel)
 */
export function createPlaceholderTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  color: [number, number, number, number] = [255, 255, 255, 255]
): TextureInfo {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Failed to create texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(color)
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return {
    texture,
    width: 1,
    height: 1,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
    minFilter: gl.NEAREST,
    magFilter: gl.NEAREST,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
  };
}

/**
 * Create a data texture from raw pixel data
 */
export function createDataTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  data: Uint8Array | Float32Array,
  width: number,
  height: number,
  options: {
    format?: number;
    internalFormat?: number;
    type?: number;
  } & TextureOptions = {}
): TextureInfo {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Failed to create texture');
  }

  const format = options.format ?? gl.RGBA;
  const internalFormat = options.internalFormat ?? format;
  const type = options.type ?? (data instanceof Float32Array ? gl.FLOAT : gl.UNSIGNED_BYTE);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    internalFormat,
    width,
    height,
    0,
    format,
    type,
    data
  );

  const minFilter = options.minFilter ?? gl.NEAREST;
  const magFilter = options.magFilter ?? gl.NEAREST;
  const wrapS = options.wrapS ?? gl.CLAMP_TO_EDGE;
  const wrapT = options.wrapT ?? gl.CLAMP_TO_EDGE;

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return {
    texture,
    width,
    height,
    format,
    type,
    minFilter,
    magFilter,
    wrapS,
    wrapT,
  };
}

/**
 * Create a cubemap texture
 */
export function createCubemapTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  images: {
    posX: HTMLImageElement;
    negX: HTMLImageElement;
    posY: HTMLImageElement;
    negY: HTMLImageElement;
    posZ: HTMLImageElement;
    negZ: HTMLImageElement;
  },
  options: TextureOptions = {}
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Failed to create cubemap texture');
  }

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faces = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, image: images.posX },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, image: images.negX },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, image: images.posY },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, image: images.negY },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, image: images.posZ },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, image: images.negZ },
  ];

  for (const face of faces) {
    gl.texImage2D(
      face.target,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      face.image
    );
  }

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, options.minFilter ?? gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, options.magFilter ?? gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  if (options.generateMipmaps) {
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  }

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  return texture;
}

/**
 * Update texture with new image data
 */
export function updateTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  textureInfo: TextureInfo,
  image: HTMLImageElement | ImageBitmap | HTMLCanvasElement | HTMLVideoElement
): void {
  gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    textureInfo.format,
    textureInfo.format,
    textureInfo.type,
    image as TexImageSource
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Bind a texture to a texture unit
 */
export function bindTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  textureInfo: TextureInfo,
  unit: number = 0
): void {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
}

/**
 * Unbind texture from a texture unit
 */
export function unbindTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  unit: number = 0
): void {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Delete a texture
 */
export function deleteTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  textureInfo: TextureInfo
): void {
  gl.deleteTexture(textureInfo.texture);
}
