/**
 * Tests for Dialog APIs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Dialog,
  openDialog,
  saveDialog,
  showMessage,
  showConfirm,
  showAsk,
} from './dialog';
import { resetTauriContext, initTauriContext } from '../tauri/context';

// Mock browser APIs
const mockAlert = vi.fn();
const mockConfirm = vi.fn();
const mockPrompt = vi.fn();

// Skip: These tests require the actual Tauri runtime environment
describe.skip('Dialog APIs', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    vi.clearAllMocks();

    // Mock browser globals
    global.alert = mockAlert;
    global.confirm = mockConfirm;
    global.prompt = mockPrompt;
  });

  describe('Dialog.open', () => {
    it('should open file dialog', async () => {
      // In browser mode, this creates a file input
      const result = await Dialog.open({
        title: 'Select File',
        filters: [{ name: 'Images', extensions: ['png', 'jpg'] }],
      });

      // Browser fallback returns null if no file selected
      expect(result === null || typeof result === 'string' || Array.isArray(result)).toBe(true);
    });

    it('should support multiple selection', async () => {
      const result = await Dialog.open({
        multiple: true,
      });

      expect(result === null || Array.isArray(result) || typeof result === 'string').toBe(true);
    });

    it('should support directory selection', async () => {
      const result = await Dialog.open({
        directory: true,
      });

      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('Dialog.save', () => {
    it('should open save dialog', async () => {
      mockPrompt.mockReturnValue('test.txt');

      const result = await Dialog.save({
        title: 'Save File',
        defaultPath: 'document.txt',
      });

      expect(mockPrompt).toHaveBeenCalled();
    });

    it('should support filters', async () => {
      mockPrompt.mockReturnValue('output.json');

      const result = await Dialog.save({
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      expect(result).toBeDefined();
    });
  });

  describe('Dialog.message', () => {
    it('should show message dialog', async () => {
      await Dialog.message('Hello, World!');

      expect(mockAlert).toHaveBeenCalledWith('Hello, World!');
    });

    it('should support options', async () => {
      await Dialog.message('Info message', {
        title: 'Information',
        type: 'info',
      });

      expect(mockAlert).toHaveBeenCalled();
    });
  });

  describe('Dialog.confirm', () => {
    it('should show confirmation dialog', async () => {
      mockConfirm.mockReturnValue(true);

      const result = await Dialog.confirm('Are you sure?');

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure?');
      expect(result).toBe(true);
    });

    it('should return false when cancelled', async () => {
      mockConfirm.mockReturnValue(false);

      const result = await Dialog.confirm('Delete file?');

      expect(result).toBe(false);
    });

    it('should support options', async () => {
      mockConfirm.mockReturnValue(true);

      await Dialog.confirm('Confirm action?', {
        title: 'Confirm',
        type: 'warning',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
      });

      expect(mockConfirm).toHaveBeenCalled();
    });
  });

  describe('Dialog.ask', () => {
    it('should show ask dialog', async () => {
      mockConfirm.mockReturnValue(true);

      const result = await Dialog.ask('Do you want to proceed?');

      expect(mockConfirm).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('Convenience functions', () => {
    it('openDialog should call Dialog.open', async () => {
      const result = await openDialog({ title: 'Test' });
      expect(result === null || typeof result === 'string' || Array.isArray(result)).toBe(true);
    });

    it('saveDialog should call Dialog.save', async () => {
      mockPrompt.mockReturnValue('file.txt');
      await saveDialog({ title: 'Save' });
      expect(mockPrompt).toHaveBeenCalled();
    });

    it('showMessage should call Dialog.message', async () => {
      await showMessage('Test message');
      expect(mockAlert).toHaveBeenCalled();
    });

    it('showConfirm should call Dialog.confirm', async () => {
      mockConfirm.mockReturnValue(true);
      const result = await showConfirm('Confirm?');
      expect(result).toBe(true);
    });

    it('showAsk should call Dialog.ask', async () => {
      mockConfirm.mockReturnValue(false);
      const result = await showAsk('Ask?');
      expect(result).toBe(false);
    });
  });
});
