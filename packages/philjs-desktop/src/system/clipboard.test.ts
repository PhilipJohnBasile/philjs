/**
 * Tests for Clipboard APIs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Clipboard,
  readClipboard,
  writeClipboard,
  readClipboardImage,
  writeClipboardImage,
  clearClipboard,
} from './clipboard';
import { resetTauriContext, initTauriContext } from '../tauri/context';

// Mock navigator.clipboard
const mockClipboard = {
  readText: vi.fn(),
  writeText: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
};

describe('Clipboard APIs', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    vi.clearAllMocks();

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });
  });

  describe('Clipboard.readText', () => {
    it('should read text from clipboard', async () => {
      mockClipboard.readText.mockResolvedValue('Hello, Clipboard!');

      const text = await Clipboard.readText();

      expect(mockClipboard.readText).toHaveBeenCalled();
      expect(text).toBe('Hello, Clipboard!');
    });

    it('should handle empty clipboard', async () => {
      mockClipboard.readText.mockResolvedValue('');

      const text = await Clipboard.readText();

      expect(text).toBe('');
    });
  });

  describe('Clipboard.writeText', () => {
    it('should write text to clipboard', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      await Clipboard.writeText('New content');

      expect(mockClipboard.writeText).toHaveBeenCalledWith('New content');
    });

    it('should handle special characters', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      await Clipboard.writeText('Special: <script>alert(1)</script>');

      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('Clipboard.readHtml', () => {
    it('should read HTML from clipboard', async () => {
      const htmlBlob = new Blob(['<p>HTML</p>'], { type: 'text/html' });
      mockClipboard.read.mockResolvedValue([
        {
          types: ['text/html'],
          getType: vi.fn().mockResolvedValue(htmlBlob),
        },
      ]);

      const html = await Clipboard.readHtml();

      expect(html).toBe('<p>HTML</p>');
    });

    it('should return empty string if no HTML', async () => {
      mockClipboard.read.mockResolvedValue([]);

      const html = await Clipboard.readHtml();

      expect(html).toBe('');
    });
  });

  describe('Clipboard.writeHtml', () => {
    it('should write HTML to clipboard', async () => {
      mockClipboard.write.mockResolvedValue(undefined);

      await Clipboard.writeHtml('<div>Content</div>');

      expect(mockClipboard.write).toHaveBeenCalled();
    });
  });

  describe('Clipboard.readImage', () => {
    it('should read image from clipboard', async () => {
      const imageBlob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
      mockClipboard.read.mockResolvedValue([
        {
          types: ['image/png'],
          getType: vi.fn().mockResolvedValue(imageBlob),
        },
      ]);

      const image = await Clipboard.readImage();

      expect(image).toMatch(/^data:image\/png;base64,/);
    });

    it('should return null if no image', async () => {
      mockClipboard.read.mockResolvedValue([]);

      const image = await Clipboard.readImage();

      expect(image).toBeNull();
    });
  });

  describe('Clipboard.writeImage', () => {
    it('should write image data to clipboard', async () => {
      mockClipboard.write.mockResolvedValue(undefined);

      await Clipboard.writeImage(new Uint8Array([1, 2, 3, 4]));

      expect(mockClipboard.write).toHaveBeenCalled();
    });

    it('should handle base64 data URL', async () => {
      mockClipboard.write.mockResolvedValue(undefined);
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob([new Uint8Array([1, 2])])),
      });

      await Clipboard.writeImage('data:image/png;base64,AQID');

      expect(mockClipboard.write).toHaveBeenCalled();
    });
  });

  describe('Clipboard.clear', () => {
    it('should clear clipboard', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      await Clipboard.clear();

      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });
  });

  describe('Clipboard.hasText', () => {
    it('should return true when clipboard has text', async () => {
      mockClipboard.readText.mockResolvedValue('Some text');

      const hasText = await Clipboard.hasText();

      expect(hasText).toBe(true);
    });

    it('should return false when clipboard is empty', async () => {
      mockClipboard.readText.mockResolvedValue('');

      const hasText = await Clipboard.hasText();

      expect(hasText).toBe(false);
    });
  });

  describe('Clipboard.hasImage', () => {
    it('should return true when clipboard has image', async () => {
      mockClipboard.read.mockResolvedValue([
        {
          types: ['image/png'],
          getType: vi.fn().mockResolvedValue(new Blob([new Uint8Array([1])])),
        },
      ]);

      const hasImage = await Clipboard.hasImage();

      expect(hasImage).toBe(true);
    });

    it('should return false when clipboard has no image', async () => {
      mockClipboard.read.mockResolvedValue([]);

      const hasImage = await Clipboard.hasImage();

      expect(hasImage).toBe(false);
    });
  });

  describe('Convenience functions', () => {
    it('readClipboard should read text', async () => {
      mockClipboard.readText.mockResolvedValue('test');
      const text = await readClipboard();
      expect(text).toBe('test');
    });

    it('writeClipboard should write text', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);
      await writeClipboard('written');
      expect(mockClipboard.writeText).toHaveBeenCalledWith('written');
    });

    it('clearClipboard should clear', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);
      await clearClipboard();
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });
  });
});
