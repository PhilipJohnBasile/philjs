/**
 * @file Texture Management
 * @description Load and manage WebGL textures
 */
import type { TextureInfo, TextureOptions, WebGLExtensions } from './types.js';
/**
 * Create a texture from an image element
 */
export declare function createTextureFromImage(gl: WebGLRenderingContext | WebGL2RenderingContext, image: HTMLImageElement | ImageBitmap | HTMLCanvasElement | HTMLVideoElement, options?: TextureOptions, extensions?: WebGLExtensions): TextureInfo;
/**
 * Load a texture from a URL
 */
export declare function loadTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, url: string, options?: TextureOptions, extensions?: WebGLExtensions): Promise<TextureInfo>;
/**
 * Create a placeholder texture (1x1 pixel)
 */
export declare function createPlaceholderTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, color?: [number, number, number, number]): TextureInfo;
/**
 * Create a data texture from raw pixel data
 */
export declare function createDataTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, data: Uint8Array | Float32Array, width: number, height: number, options?: {
    format?: number;
    internalFormat?: number;
    type?: number;
} & TextureOptions): TextureInfo;
/**
 * Create a cubemap texture
 */
export declare function createCubemapTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, images: {
    posX: HTMLImageElement;
    negX: HTMLImageElement;
    posY: HTMLImageElement;
    negY: HTMLImageElement;
    posZ: HTMLImageElement;
    negZ: HTMLImageElement;
}, options?: TextureOptions): WebGLTexture;
/**
 * Update texture with new image data
 */
export declare function updateTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, textureInfo: TextureInfo, image: HTMLImageElement | ImageBitmap | HTMLCanvasElement | HTMLVideoElement): void;
/**
 * Bind a texture to a texture unit
 */
export declare function bindTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, textureInfo: TextureInfo, unit?: number): void;
/**
 * Unbind texture from a texture unit
 */
export declare function unbindTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, unit?: number): void;
/**
 * Delete a texture
 */
export declare function deleteTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, textureInfo: TextureInfo): void;
//# sourceMappingURL=textures.d.ts.map