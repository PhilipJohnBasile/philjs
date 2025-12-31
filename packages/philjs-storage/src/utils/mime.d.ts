/**
 * MIME Type Detection Utilities
 *
 * Detect MIME types from file extensions and magic bytes.
 */
/**
 * Detect MIME type from filename extension
 *
 * @param filename - File name or path
 * @returns MIME type string or 'application/octet-stream' if unknown
 */
export declare function detectMimeType(filename: string): string;
/**
 * Get MIME type from file extension
 *
 * @param extension - File extension (with or without leading dot)
 * @returns MIME type string or null if unknown
 */
export declare function getMimeTypeFromExtension(extension: string): string | null;
/**
 * Get file extension from MIME type
 *
 * @param mimeType - MIME type string
 * @returns File extension (with leading dot) or null if unknown
 */
export declare function getExtensionFromMimeType(mimeType: string): string | null;
/**
 * Detect MIME type from file content (magic bytes)
 *
 * @param data - File content as Buffer or Uint8Array
 * @returns Detected MIME type or null if unknown
 */
export declare function detectMimeTypeFromBytes(data: Buffer | Uint8Array): string | null;
/**
 * Check if MIME type is an image
 */
export declare function isImageMimeType(mimeType: string): boolean;
/**
 * Check if MIME type is a video
 */
export declare function isVideoMimeType(mimeType: string): boolean;
/**
 * Check if MIME type is audio
 */
export declare function isAudioMimeType(mimeType: string): boolean;
/**
 * Check if MIME type is text-based
 */
export declare function isTextMimeType(mimeType: string): boolean;
/**
 * Get category for a MIME type
 */
export declare function getMimeTypeCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other';
//# sourceMappingURL=mime.d.ts.map