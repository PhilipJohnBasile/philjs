/**
 * Clipboard API
 *
 * Access to system clipboard for copy/paste.
 */

import { signal, type Signal } from '@philjs/core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Clipboard content types
 */
export type ClipboardContentType = 'text' | 'url' | 'image' | 'html';

/**
 * Clipboard content
 */
export interface ClipboardContent {
  text?: string | undefined;
  html?: string | undefined;
  url?: string | undefined;
  image?: string | undefined; // Base64 or URI
}

// ============================================================================
// Clipboard State
// ============================================================================

/**
 * Last clipboard content
 */
export const clipboardContent: Signal<string> = signal('');

// ============================================================================
// Clipboard API
// ============================================================================

/**
 * Clipboard API singleton
 */
export const Clipboard = {
  /**
   * Get string from clipboard
   */
  async getString(): Promise<string> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const text = await navigator.clipboard.readText();
        clipboardContent.set(text);
        return text;
      } catch (error) {
        console.error('Clipboard read failed:', error);
        return '';
      }
    }

    const text = await nativeBridge.call<string>('Clipboard', 'getString');
    clipboardContent.set(text);
    return text;
  },

  /**
   * Set string to clipboard
   */
  async setString(text: string): Promise<void> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        clipboardContent.set(text);
      } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        clipboardContent.set(text);
      }
      return;
    }

    await nativeBridge.call('Clipboard', 'setString', text);
    clipboardContent.set(text);
  },

  /**
   * Get URL from clipboard
   */
  async getUrl(): Promise<string | null> {
    const platform = detectPlatform();

    if (platform === 'web') {
      const text = await this.getString();
      return URL.parse(text) !== null ? text : null;
    }

    return nativeBridge.call<string | null>('Clipboard', 'getUrl');
  },

  /**
   * Set URL to clipboard
   */
  async setUrl(url: string): Promise<void> {
    return this.setString(url);
  },

  /**
   * Get image from clipboard
   */
  async getImage(): Promise<string | null> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              return URL.createObjectURL(blob);
            }
          }
        }
        return null;
      } catch {
        return null;
      }
    }

    return nativeBridge.call<string | null>('Clipboard', 'getImage');
  },

  /**
   * Set image to clipboard
   */
  async setImage(imageUri: string): Promise<void> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      } catch (error) {
        console.error('Failed to copy image:', error);
      }
      return;
    }

    return nativeBridge.call('Clipboard', 'setImage', imageUri);
  },

  /**
   * Get HTML from clipboard
   */
  async getHtml(): Promise<string | null> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            return await blob.text();
          }
        }
        return null;
      } catch {
        return null;
      }
    }

    return nativeBridge.call<string | null>('Clipboard', 'getHtml');
  },

  /**
   * Set HTML to clipboard
   */
  async setHtml(html: string): Promise<void> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const blob = new Blob([html], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/html': blob }),
        ]);
      } catch (error) {
        // Fallback to plain text
        await this.setString(html);
      }
      return;
    }

    return nativeBridge.call('Clipboard', 'setHtml', html);
  },

  /**
   * Get content with multiple formats
   */
  async getContent(): Promise<ClipboardContent> {
    const content: ClipboardContent = {};

    const text = await this.getString();
    if (text) content.text = text;

    const html = await this.getHtml();
    if (html) content.html = html;

    const url = await this.getUrl();
    if (url) content.url = url;

    const image = await this.getImage();
    if (image) content.image = image;

    return content;
  },

  /**
   * Set content with multiple formats
   */
  async setContent(content: ClipboardContent): Promise<void> {
    const platform = detectPlatform();

    if (platform === 'web') {
      const items: Record<string, Blob> = {};

      if (content.text) {
        items['text/plain'] = new Blob([content.text], { type: 'text/plain' });
      }
      if (content.html) {
        items['text/html'] = new Blob([content.html], { type: 'text/html' });
      }

      if (Object.keys(items).length > 0) {
        try {
          await navigator.clipboard.write([new ClipboardItem(items)]);
        } catch {
          // Fallback
          if (content.text) {
            await this.setString(content.text);
          }
        }
      }
      return;
    }

    return nativeBridge.call('Clipboard', 'setContent', content);
  },

  /**
   * Check if clipboard has content
   */
  async hasContent(): Promise<boolean> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const text = await navigator.clipboard.readText();
        return text.length > 0;
      } catch {
        return false;
      }
    }

    return nativeBridge.call<boolean>('Clipboard', 'hasContent');
  },

  /**
   * Check if clipboard has string
   */
  async hasString(): Promise<boolean> {
    return this.hasContent();
  },

  /**
   * Check if clipboard has URL
   */
  async hasUrl(): Promise<boolean> {
    const url = await this.getUrl();
    return url !== null;
  },

  /**
   * Check if clipboard has image
   */
  async hasImage(): Promise<boolean> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.some(type => type.startsWith('image/'))) {
            return true;
          }
        }
        return false;
      } catch {
        return false;
      }
    }

    return nativeBridge.call<boolean>('Clipboard', 'hasImage');
  },

  /**
   * Add clipboard change listener
   */
  addListener(callback: (content: string) => void): () => void {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Web doesn't have a reliable clipboard change event
      // Poll every second as a workaround
      let lastContent = '';

      const intervalId = setInterval(async () => {
        try {
          const content = await this.getString();
          if (content !== lastContent) {
            lastContent = content;
            callback(content);
          }
        } catch {
          // Ignore permission errors
        }
      }, 1000);

      return () => clearInterval(intervalId);
    }

    return nativeBridge.on('clipboardChange', callback);
  },
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to use clipboard
 */
export function useClipboard(): {
  content: string;
  copy: (text: string) => Promise<void>;
  paste: () => Promise<string>;
} {
  return {
    content: clipboardContent(),
    copy: Clipboard.setString,
    paste: Clipboard.getString,
  };
}

// ============================================================================
// Export
// ============================================================================

export default Clipboard;
