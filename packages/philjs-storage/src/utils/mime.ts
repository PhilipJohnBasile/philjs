/**
 * MIME Type Detection Utilities
 *
 * Detect MIME types from file extensions and magic bytes.
 */

import mimeTypes from 'mime-types';

/**
 * Common MIME type mappings for quick lookup
 */
const COMMON_MIME_TYPES: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',

  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.m4v': 'video/x-m4v',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.opus': 'audio/opus',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Text
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.xml': 'application/xml',

  // Code
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.ts': 'application/typescript',
  '.json': 'application/json',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',

  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',

  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',

  // WebAssembly
  '.wasm': 'application/wasm',
};

/**
 * Magic bytes for common file types
 */
const MAGIC_BYTES: Array<{ bytes: number[]; mask?: number[]; mime: string }> = [
  // Images
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mime: 'image/png' },
  { bytes: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif' },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp' }, // RIFF header, needs WEBP check
  { bytes: [0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20], mime: 'image/jp2' },
  { bytes: [0x42, 0x4d], mime: 'image/bmp' },

  // Audio/Video
  { bytes: [0x49, 0x44, 0x33], mime: 'audio/mpeg' }, // ID3 tag
  { bytes: [0xff, 0xfb], mime: 'audio/mpeg' }, // MP3 frame sync
  { bytes: [0xff, 0xfa], mime: 'audio/mpeg' },
  { bytes: [0x66, 0x4c, 0x61, 0x43], mime: 'audio/flac' }, // fLaC
  { bytes: [0x4f, 0x67, 0x67, 0x53], mime: 'audio/ogg' }, // OggS
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], mime: 'video/webm' }, // EBML header

  // Documents
  { bytes: [0x25, 0x50, 0x44, 0x46], mime: 'application/pdf' }, // %PDF
  { bytes: [0x50, 0x4b, 0x03, 0x04], mime: 'application/zip' }, // ZIP (also docx, xlsx, etc.)

  // Archives
  { bytes: [0x1f, 0x8b], mime: 'application/gzip' },
  { bytes: [0x52, 0x61, 0x72, 0x21], mime: 'application/vnd.rar' }, // Rar!
  { bytes: [0x37, 0x7a, 0xbc, 0xaf], mime: 'application/x-7z-compressed' },

  // WebAssembly
  { bytes: [0x00, 0x61, 0x73, 0x6d], mime: 'application/wasm' },

  // Fonts
  { bytes: [0x77, 0x4f, 0x46, 0x46], mime: 'font/woff' }, // wOFF
  { bytes: [0x77, 0x4f, 0x46, 0x32], mime: 'font/woff2' }, // wOF2
  { bytes: [0x00, 0x01, 0x00, 0x00], mime: 'font/ttf' },
  { bytes: [0x4f, 0x54, 0x54, 0x4f], mime: 'font/otf' }, // OTTO
];

/**
 * Get file extension from a filename or path
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Detect MIME type from filename extension
 *
 * @param filename - File name or path
 * @returns MIME type string or 'application/octet-stream' if unknown
 */
export function detectMimeType(filename: string): string {
  const ext = getExtension(filename);

  // Try common types first (faster)
  if (ext && COMMON_MIME_TYPES[ext]) {
    return COMMON_MIME_TYPES[ext];
  }

  // Fall back to mime-types library
  const mimeType = mimeTypes.lookup(filename);
  return mimeType || 'application/octet-stream';
}

/**
 * Get MIME type from file extension
 *
 * @param extension - File extension (with or without leading dot)
 * @returns MIME type string or null if unknown
 */
export function getMimeTypeFromExtension(extension: string): string | null {
  const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

  if (COMMON_MIME_TYPES[ext]) {
    return COMMON_MIME_TYPES[ext];
  }

  return mimeTypes.lookup(ext) || null;
}

/**
 * Get file extension from MIME type
 *
 * @param mimeType - MIME type string
 * @returns File extension (with leading dot) or null if unknown
 */
export function getExtensionFromMimeType(mimeType: string): string | null {
  // Check common types first
  for (const [ext, mime] of Object.entries(COMMON_MIME_TYPES)) {
    if (mime === mimeType) {
      return ext;
    }
  }

  const extension = mimeTypes.extension(mimeType);
  return extension ? `.${extension}` : null;
}

/**
 * Detect MIME type from file content (magic bytes)
 *
 * @param data - File content as Buffer or Uint8Array
 * @returns Detected MIME type or null if unknown
 */
export function detectMimeTypeFromBytes(data: Buffer | Uint8Array): string | null {
  if (data.length < 2) {
    return null;
  }

  for (const magic of MAGIC_BYTES) {
    if (data.length < magic.bytes.length) {
      continue;
    }

    let matches = true;
    for (let i = 0; i < magic.bytes.length; i++) {
      const mask = magic.mask?.[i] ?? 0xff;
      if ((data[i] & mask) !== (magic.bytes[i] & mask)) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // Special case for RIFF container (WebP check)
      if (magic.bytes[0] === 0x52 && magic.bytes[1] === 0x49) {
        if (data.length >= 12) {
          const webpCheck = String.fromCharCode(data[8], data[9], data[10], data[11]);
          if (webpCheck === 'WEBP') {
            return 'image/webp';
          }
          // Could be AVI or other RIFF format
          return 'application/octet-stream';
        }
      }

      // Special case for MP4/MOV detection
      if (magic.bytes[0] === 0x00 && data.length >= 12) {
        const ftyp = String.fromCharCode(data[4], data[5], data[6], data[7]);
        if (ftyp === 'ftyp') {
          const brand = String.fromCharCode(data[8], data[9], data[10], data[11]);
          if (brand.startsWith('mp4') || brand === 'isom' || brand === 'M4V ') {
            return 'video/mp4';
          }
          if (brand === 'qt  ' || brand.startsWith('M4A')) {
            return 'video/quicktime';
          }
          if (brand === 'M4A ') {
            return 'audio/mp4';
          }
          if (brand === 'heic' || brand === 'heix' || brand === 'hevc') {
            return 'image/heic';
          }
          if (brand === 'avif' || brand === 'avis') {
            return 'image/avif';
          }
        }
      }

      return magic.mime;
    }
  }

  // Check for text files
  if (isTextContent(data)) {
    // Check for specific text formats
    const text = Buffer.from(data.slice(0, 1000)).toString('utf-8');

    if (text.startsWith('<?xml') || text.startsWith('<')) {
      if (text.includes('<html') || text.includes('<!DOCTYPE html')) {
        return 'text/html';
      }
      if (text.includes('<svg')) {
        return 'image/svg+xml';
      }
      return 'application/xml';
    }

    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        JSON.parse(Buffer.from(data).toString('utf-8'));
        return 'application/json';
      } catch {
        // Not valid JSON
      }
    }

    return 'text/plain';
  }

  return null;
}

/**
 * Check if content appears to be text
 */
function isTextContent(data: Buffer | Uint8Array): boolean {
  // Check first 512 bytes for binary characters
  const checkLength = Math.min(data.length, 512);
  let nullCount = 0;

  for (let i = 0; i < checkLength; i++) {
    const byte = data[i];

    // Count null bytes
    if (byte === 0) {
      nullCount++;
      if (nullCount > 1) {
        return false; // Multiple nulls suggest binary
      }
    }

    // Check for non-text control characters (except common ones)
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
      return false;
    }
  }

  return true;
}

/**
 * Check if MIME type is an image
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if MIME type is a video
 */
export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Check if MIME type is audio
 */
export function isAudioMimeType(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

/**
 * Check if MIME type is text-based
 */
export function isTextMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'application/xml' ||
    mimeType.endsWith('+xml') ||
    mimeType.endsWith('+json')
  );
}

/**
 * Get category for a MIME type
 */
export function getMimeTypeCategory(
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other' {
  if (isImageMimeType(mimeType)) return 'image';
  if (isVideoMimeType(mimeType)) return 'video';
  if (isAudioMimeType(mimeType)) return 'audio';

  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document';
  }

  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/gzip' ||
    mimeType === 'application/x-tar' ||
    mimeType.includes('compressed') ||
    mimeType.includes('archive')
  ) {
    return 'archive';
  }

  if (
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'text/css' ||
    mimeType === 'text/html' ||
    mimeType === 'application/json'
  ) {
    return 'code';
  }

  return 'other';
}
