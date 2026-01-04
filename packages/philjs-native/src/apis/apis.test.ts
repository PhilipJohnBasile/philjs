/**
 * Native APIs Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Camera } from './Camera';
import { Geolocation, currentLocation, locationPermission } from './Geolocation';
import { Storage, SecureStorage, getJSON, setJSON, MMKVStorage } from './Storage';
import { Haptics, impactLight, impactMedium, notifySuccess } from './Haptics';
import { Notifications, notificationPermission } from './Notifications';
import { Clipboard, clipboardContent } from './Clipboard';
import { Share } from './Share';
import { Biometrics, biometricSupport } from './Biometrics';

describe('Native APIs', () => {
  describe('Camera', () => {
    it('should have requestPermission method', () => {
      expect(typeof Camera.requestPermission).toBe('function');
    });

    it('should have getPermissionStatus method', () => {
      expect(typeof Camera.getPermissionStatus).toBe('function');
    });

    it('should have takePicture method', () => {
      expect(typeof Camera.takePicture).toBe('function');
    });

    it('should have recordVideo method', () => {
      expect(typeof Camera.recordVideo).toBe('function');
    });

    it('should have stopRecording method', () => {
      expect(typeof Camera.stopRecording).toBe('function');
    });

    it('should have getAvailableCameras method', () => {
      expect(typeof Camera.getAvailableCameras).toBe('function');
    });

    it('should have pickImage method', () => {
      expect(typeof Camera.pickImage).toBe('function');
    });

    it('should have Component for rendering camera', () => {
      expect(typeof Camera.Component).toBe('function');
    });
  });

  describe('Geolocation', () => {
    it('should have requestPermission method', () => {
      expect(typeof Geolocation.requestPermission).toBe('function');
    });

    it('should have getPermissionStatus method', () => {
      expect(typeof Geolocation.getPermissionStatus).toBe('function');
    });

    it('should have getCurrentPosition method', () => {
      expect(typeof Geolocation.getCurrentPosition).toBe('function');
    });

    it('should have watchPosition method', () => {
      expect(typeof Geolocation.watchPosition).toBe('function');
    });

    it('should have stopWatching method', () => {
      expect(typeof Geolocation.stopWatching).toBe('function');
    });

    it('should have reverseGeocode method', () => {
      expect(typeof Geolocation.reverseGeocode).toBe('function');
    });

    it('should have geocode method', () => {
      expect(typeof Geolocation.geocode).toBe('function');
    });

    it('should calculate distance between points', () => {
      // Distance from NYC to LA is approximately 3,944 km
      const distance = Geolocation.getDistance(
        40.7128, -74.0060, // NYC
        34.0522, -118.2437 // LA
      );

      expect(distance).toBeGreaterThan(3900000); // > 3900 km
      expect(distance).toBeLessThan(4100000); // < 4100 km
    });

    it('should export currentLocation signal', () => {
      expect(currentLocation).toBeDefined();
      expect(typeof currentLocation).toBe('function');
    });

    it('should export locationPermission signal', () => {
      expect(locationPermission).toBeDefined();
    });
  });

  // Skip: Storage tests require localStorage to be properly available
  describe.skip('Storage', () => {
    beforeEach(() => {
      // Clear localStorage if available
      if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
        localStorage.clear();
      }
    });

    it('should set and get item', async () => {
      await Storage.setItem('test-key', 'test-value');
      const value = await Storage.getItem('test-key');

      expect(value).toBe('test-value');
    });

    it('should remove item', async () => {
      await Storage.setItem('to-remove', 'value');
      await Storage.removeItem('to-remove');
      const value = await Storage.getItem('to-remove');

      expect(value).toBeNull();
    });

    it('should get all keys', async () => {
      await Storage.setItem('key1', 'value1');
      await Storage.setItem('key2', 'value2');

      const keys = await Storage.getAllKeys();

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should clear all storage', async () => {
      await Storage.setItem('key1', 'value1');
      await Storage.setItem('key2', 'value2');
      await Storage.clear();

      const keys = await Storage.getAllKeys();
      expect(keys.length).toBe(0);
    });

    it('should handle multi get', async () => {
      await Storage.setItem('a', '1');
      await Storage.setItem('b', '2');

      const results = await Storage.multiGet(['a', 'b']);

      expect(results).toContainEqual(['a', '1']);
      expect(results).toContainEqual(['b', '2']);
    });

    it('should handle multi set', async () => {
      await Storage.multiSet([['x', '10'], ['y', '20']]);

      const x = await Storage.getItem('x');
      const y = await Storage.getItem('y');

      expect(x).toBe('10');
      expect(y).toBe('20');
    });

    it('should merge items', async () => {
      await Storage.setItem('obj', JSON.stringify({ a: 1, b: 2 }));
      await Storage.mergeItem('obj', JSON.stringify({ b: 3, c: 4 }));

      const value = await Storage.getItem('obj');
      const parsed = JSON.parse(value!);

      expect(parsed).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should work with JSON helpers', async () => {
      await setJSON('json-test', { name: 'Test', value: 42 });
      const result = await getJSON<{ name: string; value: number }>('json-test');

      expect(result).toEqual({ name: 'Test', value: 42 });
    });

    it('should have configure method', () => {
      expect(typeof Storage.configure).toBe('function');
    });
  });

  // Skip: SecureStorage tests require localStorage to be properly available
  describe.skip('SecureStorage', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('should set and get secure item', async () => {
      await SecureStorage.setItem('secure-key', 'secure-value');
      const value = await SecureStorage.getItem('secure-key');

      expect(value).toBe('secure-value');
    });

    it('should remove secure item', async () => {
      await SecureStorage.setItem('to-remove', 'value');
      await SecureStorage.removeItem('to-remove');
      const value = await SecureStorage.getItem('to-remove');

      expect(value).toBeNull();
    });
  });

  // Skip: MMKVStorage tests require proper native environment
  describe.skip('MMKVStorage', () => {
    it('should create instance', () => {
      const storage = MMKVStorage.create('test-instance');

      expect(storage).toHaveProperty('getString');
      expect(storage).toHaveProperty('setString');
      expect(storage).toHaveProperty('getNumber');
      expect(storage).toHaveProperty('setNumber');
      expect(storage).toHaveProperty('getBoolean');
      expect(storage).toHaveProperty('setBoolean');
    });

    it('should store and retrieve strings', () => {
      const storage = MMKVStorage.create('test-strings');

      storage.setString('key', 'value');
      expect(storage.getString('key')).toBe('value');
    });

    it('should store and retrieve numbers', () => {
      const storage = MMKVStorage.create('test-numbers');

      storage.setNumber('num', 42);
      expect(storage.getNumber('num')).toBe(42);
    });

    it('should store and retrieve booleans', () => {
      const storage = MMKVStorage.create('test-bools');

      storage.setBoolean('flag', true);
      expect(storage.getBoolean('flag')).toBe(true);
    });
  });

  describe('Haptics', () => {
    it('should have isSupported method', () => {
      expect(typeof Haptics.isSupported).toBe('function');
    });

    it('should have impact method', () => {
      expect(typeof Haptics.impact).toBe('function');
    });

    it('should have notification method', () => {
      expect(typeof Haptics.notification).toBe('function');
    });

    it('should have selection method', () => {
      expect(typeof Haptics.selection).toBe('function');
    });

    it('should have vibrate method', () => {
      expect(typeof Haptics.vibrate).toBe('function');
    });

    it('should have cancel method', () => {
      expect(typeof Haptics.cancel).toBe('function');
    });

    it('should export convenience functions', () => {
      expect(typeof impactLight).toBe('function');
      expect(typeof impactMedium).toBe('function');
      expect(typeof notifySuccess).toBe('function');
    });
  });

  describe('Notifications', () => {
    it('should have requestPermission method', () => {
      expect(typeof Notifications.requestPermission).toBe('function');
    });

    it('should have scheduleNotification method', () => {
      expect(typeof Notifications.scheduleNotification).toBe('function');
    });

    it('should have cancelNotification method', () => {
      expect(typeof Notifications.cancelNotification).toBe('function');
    });

    it('should have cancelAllNotifications method', () => {
      expect(typeof Notifications.cancelAllNotifications).toBe('function');
    });

    it('should have setBadgeCount method', () => {
      expect(typeof Notifications.setBadgeCount).toBe('function');
    });

    it('should have registerForPushNotifications method', () => {
      expect(typeof Notifications.registerForPushNotifications).toBe('function');
    });

    it('should have addNotificationReceivedListener method', () => {
      expect(typeof Notifications.addNotificationReceivedListener).toBe('function');
    });

    it('should export notificationPermission signal', () => {
      expect(notificationPermission).toBeDefined();
    });
  });

  describe('Clipboard', () => {
    it('should have getString method', () => {
      expect(typeof Clipboard.getString).toBe('function');
    });

    it('should have setString method', () => {
      expect(typeof Clipboard.setString).toBe('function');
    });

    it('should have getUrl method', () => {
      expect(typeof Clipboard.getUrl).toBe('function');
    });

    it('should have getImage method', () => {
      expect(typeof Clipboard.getImage).toBe('function');
    });

    it('should have hasContent method', () => {
      expect(typeof Clipboard.hasContent).toBe('function');
    });

    it('should have addListener method', () => {
      expect(typeof Clipboard.addListener).toBe('function');
    });

    it('should export clipboardContent signal', () => {
      expect(clipboardContent).toBeDefined();
    });
  });

  describe('Share', () => {
    it('should have isAvailable method', () => {
      expect(typeof Share.isAvailable).toBe('function');
    });

    it('should have share method', () => {
      expect(typeof Share.share).toBe('function');
    });

    it('should have shareFiles method', () => {
      expect(typeof Share.shareFiles).toBe('function');
    });

    it('should have shareImage method', () => {
      expect(typeof Share.shareImage).toBe('function');
    });

    it('should have sharePDF method', () => {
      expect(typeof Share.sharePDF).toBe('function');
    });

    it('should have shareUrl method', () => {
      expect(typeof Share.shareUrl).toBe('function');
    });

    it('should have social sharing methods', () => {
      expect(typeof Share.social.twitter).toBe('function');
      expect(typeof Share.social.facebook).toBe('function');
      expect(typeof Share.social.whatsapp).toBe('function');
      expect(typeof Share.social.email).toBe('function');
    });
  });

  describe('Biometrics', () => {
    it('should have isAvailable method', () => {
      expect(typeof Biometrics.isAvailable).toBe('function');
    });

    it('should have getBiometryType method', () => {
      expect(typeof Biometrics.getBiometryType).toBe('function');
    });

    it('should have authenticate method', () => {
      expect(typeof Biometrics.authenticate).toBe('function');
    });

    it('should have hasEnrolledBiometrics method', () => {
      expect(typeof Biometrics.hasEnrolledBiometrics).toBe('function');
    });

    it('should have secureStore method', () => {
      expect(typeof Biometrics.secureStore).toBe('function');
    });

    it('should have secureRetrieve method', () => {
      expect(typeof Biometrics.secureRetrieve).toBe('function');
    });

    it('should have secureDelete method', () => {
      expect(typeof Biometrics.secureDelete).toBe('function');
    });

    it('should have createSignature method', () => {
      expect(typeof Biometrics.createSignature).toBe('function');
    });

    it('should export biometricSupport signal', () => {
      expect(biometricSupport).toBeDefined();
    });
  });
});
