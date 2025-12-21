/**
 * Tests for Notification APIs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Notification,
  requestNotificationPermission,
  showNotification,
  notify,
  scheduleNotification,
  cancelNotification,
} from './notification';
import { resetTauriContext, initTauriContext } from '../tauri/context';

// Mock browser Notification API
const MockNotification = vi.fn().mockImplementation((title, options) => ({
  title,
  body: options?.body,
  close: vi.fn(),
}));

describe('Notification APIs', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    vi.clearAllMocks();

    // Mock Notification
    (global as any).Notification = Object.assign(MockNotification, {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    });
  });

  describe('Notification.requestPermission', () => {
    it('should request permission', async () => {
      const result = await Notification.requestPermission();

      expect(result).toBe('granted');
      expect((global as any).Notification.requestPermission).toHaveBeenCalled();
    });

    it('should return denied when rejected', async () => {
      (global as any).Notification.requestPermission.mockResolvedValue('denied');

      const result = await Notification.requestPermission();

      expect(result).toBe('denied');
    });
  });

  describe('Notification.isPermissionGranted', () => {
    it('should return true when granted', async () => {
      (global as any).Notification.permission = 'granted';

      const result = await Notification.isPermissionGranted();

      expect(result).toBe(true);
    });

    it('should return false when denied', async () => {
      (global as any).Notification.permission = 'denied';

      const result = await Notification.isPermissionGranted();

      expect(result).toBe(false);
    });

    it('should return false when default', async () => {
      (global as any).Notification.permission = 'default';

      const result = await Notification.isPermissionGranted();

      expect(result).toBe(false);
    });
  });

  describe('Notification.show', () => {
    it('should show notification with title', async () => {
      (global as any).Notification.permission = 'granted';

      await Notification.show({ title: 'Test Notification' });

      expect(MockNotification).toHaveBeenCalledWith('Test Notification', expect.any(Object));
    });

    it('should show notification with body', async () => {
      await Notification.show({
        title: 'Title',
        body: 'Notification body',
      });

      expect(MockNotification).toHaveBeenCalledWith('Title', {
        body: 'Notification body',
        icon: undefined,
        silent: undefined,
      });
    });

    it('should show notification with icon', async () => {
      await Notification.show({
        title: 'Title',
        icon: '/path/to/icon.png',
      });

      expect(MockNotification).toHaveBeenCalledWith('Title', expect.objectContaining({
        icon: '/path/to/icon.png',
      }));
    });

    it('should show silent notification', async () => {
      await Notification.show({
        title: 'Silent',
        silent: true,
      });

      expect(MockNotification).toHaveBeenCalledWith('Silent', expect.objectContaining({
        silent: true,
      }));
    });
  });

  describe('Notification.notify', () => {
    it('should show simple notification', async () => {
      await Notification.notify('Quick Notification');

      expect(MockNotification).toHaveBeenCalledWith('Quick Notification', expect.any(Object));
    });

    it('should show notification with body', async () => {
      await Notification.notify('Title', 'Body text');

      expect(MockNotification).toHaveBeenCalledWith('Title', expect.objectContaining({
        body: 'Body text',
      }));
    });
  });

  describe('Notification.schedule', () => {
    it('should schedule future notification', async () => {
      vi.useFakeTimers();

      const future = new Date(Date.now() + 60000);
      const id = await Notification.schedule({
        title: 'Scheduled',
        at: future,
      });

      expect(typeof id).toBe('number');

      vi.useRealTimers();
    });

    it('should throw for past date', async () => {
      const past = new Date(Date.now() - 60000);

      await expect(
        Notification.schedule({ title: 'Past', at: past })
      ).rejects.toThrow('Scheduled time must be in the future');
    });
  });

  describe('Notification.cancel', () => {
    it('should cancel scheduled notification', async () => {
      vi.useFakeTimers();

      const future = new Date(Date.now() + 60000);
      const id = await Notification.schedule({ title: 'Cancel Me', at: future });

      await expect(Notification.cancel(id)).resolves.not.toThrow();

      vi.useRealTimers();
    });
  });

  describe('Notification.cancelAll', () => {
    it('should cancel all notifications', async () => {
      await expect(Notification.cancelAll()).resolves.not.toThrow();
    });
  });

  describe('Notification.getPending', () => {
    it('should return empty array in browser', async () => {
      const pending = await Notification.getPending();

      expect(pending).toEqual([]);
    });
  });

  describe('Notification.registerActionTypes', () => {
    it('should not throw in browser', async () => {
      await expect(
        Notification.registerActionTypes([
          { id: 'reply', title: 'Reply' },
          { id: 'dismiss', title: 'Dismiss' },
        ])
      ).resolves.not.toThrow();
    });
  });

  describe('Notification.onAction', () => {
    it('should return cleanup function', async () => {
      const callback = vi.fn();

      const cleanup = await Notification.onAction(callback);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('Convenience functions', () => {
    it('requestNotificationPermission should work', async () => {
      const result = await requestNotificationPermission();
      expect(['granted', 'denied', 'default']).toContain(result);
    });

    it('showNotification should work', async () => {
      await expect(showNotification({ title: 'Test' })).resolves.not.toThrow();
    });

    it('notify should work', async () => {
      await expect(notify('Test')).resolves.not.toThrow();
    });
  });
});
