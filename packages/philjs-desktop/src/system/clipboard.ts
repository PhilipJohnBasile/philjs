/**
 * Clipboard APIs
 *
 * Uses @tauri-apps/plugin-clipboard-manager for Tauri v2
 * with browser fallbacks when running outside Tauri context.
 */

import { isTauri } from '../tauri/context.js';

/**
 * Error thrown when clipboard operations fail
 */
export class ClipboardError extends Error {
  override readonly name: string = 'ClipboardError';
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
  }
}

/**
 * Clipboard API
 */
export const Clipboard = {
  /**
   * Read text from clipboard
   */
  async readText(): Promise<string> {
    if (!isTauri()) {
      // Browser fallback
      try {
        return await navigator.clipboard.readText();
      } catch (error) {
        throw new ClipboardError('Failed to read text from clipboard in browser context', error);
      }
    }

    try {
      const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
      return await readText();
    } catch (error) {
      throw new ClipboardError(
        'Failed to read text from clipboard. Ensure @tauri-apps/plugin-clipboard-manager is installed and configured.',
        error
      );
    }
  },

  /**
   * Write text to clipboard
   */
  async writeText(text: string): Promise<void> {
    if (!isTauri()) {
      // Browser fallback
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        throw new ClipboardError('Failed to write text to clipboard in browser context', error);
      }
    }

    try {
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(text);
    } catch (error) {
      throw new ClipboardError(
        'Failed to write text to clipboard. Ensure @tauri-apps/plugin-clipboard-manager is installed and configured.',
        error
      );
    }
  },

  /**
   * Read HTML from clipboard
   */
  async readHtml(): Promise<string> {
    if (!isTauri()) {
      // Browser fallback - read as text
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            return await blob.text();
          }
        }
        return '';
      } catch (error) {
        throw new ClipboardError('Failed to read HTML from clipboard in browser context', error);
      }
    }

    // Tauri v2 clipboard plugin supports HTML via readText fallback
    try {
      const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
      return await readText();
    } catch (error) {
      throw new ClipboardError(
        'Failed to read HTML from clipboard. Ensure @tauri-apps/plugin-clipboard-manager is installed and configured.',
        error
      );
    }
  },

  /**
   * Write HTML to clipboard
   */
  async writeHtml(html: string): Promise<void> {
    if (!isTauri()) {
      // Browser fallback
      try {
        const blob = new Blob([html], { type: 'text/html' });
        const item = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([item]);
        return;
      } catch (error) {
        throw new ClipboardError('Failed to write HTML to clipboard in browser context', error);
      }
    }

    // Tauri v2 has native writeHtml support
    try {
      const { writeHtml } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeHtml(html);
    } catch (error) {
      throw new ClipboardError(
        'Failed to write HTML to clipboard. Ensure @tauri-apps/plugin-clipboard-manager is installed and configured.',
        error
      );
    }
  },

  /**
   * Read image from clipboard (as base64)
   */
  async readImage(): Promise<string | null> {
    if (!isTauri()) {
      // Browser fallback
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const buffer = await blob.arrayBuffer();
              const base64 = btoa(
                new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
              return `data:${type};base64,${base64}`;
            }
          }
        }
        return null;
      } catch (error) {
        throw new ClipboardError('Failed to read image from clipboard in browser context', error);
      }
    }

    try {
      const { readImage } = await import('@tauri-apps/plugin-clipboard-manager');
      const image = await readImage();
      if (image) {
        // Tauri v2 Image has rgba() method that returns Uint8Array
        const bytes = await image.rgba();
        const base64 = btoa(
          new Uint8Array(bytes).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        return `data:image/png;base64,${base64}`;
      }
      return null;
    } catch (error) {
      throw new ClipboardError(
        'Failed to read image from clipboard. Ensure @tauri-apps/plugin-clipboard-manager is installed and configured.',
        error
      );
    }
  },

  /**
   * Write image to clipboard
   */
  async writeImage(imageData: Uint8Array | string): Promise<void> {
    if (!isTauri()) {
      // Browser fallback
      try {
        let blob: Blob;
        if (typeof imageData === 'string') {
          // Assume base64 data URL
          const response = await fetch(imageData);
          blob = await response.blob();
        } else {
          blob = new Blob([imageData as BlobPart], { type: 'image/png' });
        }
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        return;
      } catch (error) {
        throw new ClipboardError('Failed to write image to clipboard in browser context', error);
      }
    }

    try {
      const { writeImage } = await import('@tauri-apps/plugin-clipboard-manager');

      if (typeof imageData === 'string') {
        // Convert base64 to Uint8Array for Tauri v2
        const base64 = imageData.split(',')[1] || imageData;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        // Tauri v2 writeImage accepts Uint8Array directly
        await writeImage(bytes);
      } else {
        await writeImage(imageData);
      }
    } catch (error) {
      throw new ClipboardError(
        'Failed to write image to clipboard. Ensure @tauri-apps/plugin-clipboard-manager is installed and configured.',
        error
      );
    }
  },

  /**
   * Clear clipboard
   */
  async clear(): Promise<void> {
    if (!isTauri()) {
      // Browser fallback - write empty string
      try {
        await navigator.clipboard.writeText('');
        return;
      } catch (error) {
        throw new ClipboardError('Failed to clear clipboard in browser context', error);
      }
    }

    try {
      const { clear } = await import('@tauri-apps/plugin-clipboard-manager');
      await clear();
    } catch (error) {
      throw new ClipboardError(
        'Failed to clear clipboard. Ensure @tauri-apps/plugin-clipboard-manager is installed and configured.',
        error
      );
    }
  },

  /**
   * Check if clipboard has text
   */
  async hasText(): Promise<boolean> {
    try {
      const text = await this.readText();
      return text.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Check if clipboard has image
   */
  async hasImage(): Promise<boolean> {
    try {
      const image = await this.readImage();
      return image !== null;
    } catch {
      return false;
    }
  },
};

// Convenience exports
export const readClipboard = Clipboard.readText;
export const writeClipboard = Clipboard.writeText;
export const readClipboardImage = Clipboard.readImage;
export const writeClipboardImage = Clipboard.writeImage;
export const clearClipboard = Clipboard.clear;
