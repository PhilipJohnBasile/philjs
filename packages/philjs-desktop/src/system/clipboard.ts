/**
 * Clipboard APIs
 */

import { isTauri } from '../tauri/context';

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
      return navigator.clipboard.readText();
    }

    const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
    return readText();
  },

  /**
   * Write text to clipboard
   */
  async writeText(text: string): Promise<void> {
    if (!isTauri()) {
      // Browser fallback
      await navigator.clipboard.writeText(text);
      return;
    }

    const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
    await writeText(text);
  },

  /**
   * Read HTML from clipboard
   */
  async readHtml(): Promise<string> {
    if (!isTauri()) {
      // Browser fallback - read as text
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html');
          return blob.text();
        }
      }
      return '';
    }

    // Note: Tauri 2.0 clipboard plugin may not support HTML directly
    // Fallback to text
    const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
    return readText();
  },

  /**
   * Write HTML to clipboard
   */
  async writeHtml(html: string): Promise<void> {
    if (!isTauri()) {
      // Browser fallback
      const blob = new Blob([html], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([item]);
      return;
    }

    // Note: Tauri 2.0 clipboard plugin may not support HTML directly
    // Fallback to text
    const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
    await writeText(html);
  },

  /**
   * Read image from clipboard (as base64)
   */
  async readImage(): Promise<string | null> {
    if (!isTauri()) {
      // Browser fallback
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
    }

    const { readImage } = await import('@tauri-apps/plugin-clipboard-manager');
    const image = await readImage();
    if (image) {
      // Convert to base64
      const bytes = await image.rgba();
      const base64 = btoa(
        new Uint8Array(bytes).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return `data:image/png;base64,${base64}`;
    }
    return null;
  },

  /**
   * Write image to clipboard
   */
  async writeImage(imageData: Uint8Array | string): Promise<void> {
    if (!isTauri()) {
      // Browser fallback
      let blob: Blob;
      if (typeof imageData === 'string') {
        // Assume base64 data URL
        const response = await fetch(imageData);
        blob = await response.blob();
      } else {
        blob = new Blob([imageData], { type: 'image/png' });
      }
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return;
    }

    const { writeImage } = await import('@tauri-apps/plugin-clipboard-manager');
    if (typeof imageData === 'string') {
      // Convert base64 to Uint8Array
      const base64 = imageData.split(',')[1] || imageData;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      await writeImage(bytes);
    } else {
      await writeImage(imageData);
    }
  },

  /**
   * Clear clipboard
   */
  async clear(): Promise<void> {
    await this.writeText('');
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
