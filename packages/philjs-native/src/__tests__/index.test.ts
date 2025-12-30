/**
 * @philjs/native - Smoke Tests
 * Basic export verification and functionality tests
 */

import { describe, it, expect } from 'vitest';
import * as exports from '../index.js';

describe('@philjs/native', () => {
  describe('Export Verification', () => {
    it('should export runtime functions', () => {
      expect(exports.detectPlatform).toBeDefined();
      expect(exports.getPlatformInfo).toBeDefined();
      expect(exports.platformSelect).toBeDefined();
      expect(exports.createNativeApp).toBeDefined();
      expect(exports.NativeBridge).toBeDefined();
    });

    it('should export core components', () => {
      expect(exports.View).toBeDefined();
      expect(exports.Text).toBeDefined();
      expect(exports.Image).toBeDefined();
      expect(exports.ScrollView).toBeDefined();
      expect(exports.FlatList).toBeDefined();
    });

    it('should export touch components', () => {
      expect(exports.TouchableOpacity).toBeDefined();
      expect(exports.TouchableHighlight).toBeDefined();
      expect(exports.Pressable).toBeDefined();
    });

    it('should export input components', () => {
      expect(exports.TextInput).toBeDefined();
      expect(exports.Button).toBeDefined();
      expect(exports.Switch).toBeDefined();
    });

    it('should export layout components', () => {
      expect(exports.SafeAreaView).toBeDefined();
      expect(exports.SafeAreaProvider).toBeDefined();
      expect(exports.StatusBar).toBeDefined();
      expect(exports.KeyboardAvoidingView).toBeDefined();
    });

    it('should export navigation', () => {
      expect(exports.createNativeRouter).toBeDefined();
      expect(exports.createNativeStack).toBeDefined();
      expect(exports.createNativeTabs).toBeDefined();
      expect(exports.useNativeNavigation).toBeDefined();
      expect(exports.useRoute).toBeDefined();
      expect(exports.Link).toBeDefined();
    });

    it('should export native APIs - Camera', () => {
      expect(exports.Camera).toBeDefined();
    });

    it('should export native APIs - Geolocation', () => {
      expect(exports.Geolocation).toBeDefined();
      expect(exports.useLocation).toBeDefined();
    });

    it('should export native APIs - Storage', () => {
      expect(exports.Storage).toBeDefined();
      expect(exports.SecureStorage).toBeDefined();
      expect(exports.useStorage).toBeDefined();
    });

    it('should export native APIs - Haptics', () => {
      expect(exports.Haptics).toBeDefined();
      expect(exports.impactLight).toBeDefined();
      expect(exports.impactMedium).toBeDefined();
      expect(exports.impactHeavy).toBeDefined();
    });

    it('should export native APIs - Notifications', () => {
      expect(exports.Notifications).toBeDefined();
      expect(exports.useNotificationReceived).toBeDefined();
    });

    it('should export native APIs - Clipboard', () => {
      expect(exports.Clipboard).toBeDefined();
      expect(exports.useClipboard).toBeDefined();
    });

    it('should export native APIs - Share', () => {
      expect(exports.Share).toBeDefined();
    });

    it('should export native APIs - Biometrics', () => {
      expect(exports.Biometrics).toBeDefined();
      expect(exports.useBiometrics).toBeDefined();
    });

    it('should export styles', () => {
      expect(exports.StyleSheet).toBeDefined();
      expect(exports.useColorScheme).toBeDefined();
      expect(exports.lightTheme).toBeDefined();
      expect(exports.darkTheme).toBeDefined();
    });

    it('should export permissions', () => {
      expect(exports.Permissions).toBeDefined();
      expect(exports.checkPermission).toBeDefined();
      expect(exports.requestPermission).toBeDefined();
      expect(exports.usePermission).toBeDefined();
    });

    it('should export gestures', () => {
      expect(exports.createPanGesture).toBeDefined();
      expect(exports.createPinchGesture).toBeDefined();
      expect(exports.createSwipeGesture).toBeDefined();
      expect(exports.usePanGesture).toBeDefined();
    });

    it('should export animations', () => {
      expect(exports.Animated).toBeDefined();
      expect(exports.Easing).toBeDefined();
      expect(exports.timing).toBeDefined();
      expect(exports.spring).toBeDefined();
      expect(exports.sequence).toBeDefined();
      expect(exports.parallel).toBeDefined();
    });

    it('should export platform utilities', () => {
      expect(exports.Platform).toBeDefined();
      expect(exports.usePlatform).toBeDefined();
      expect(exports.isIOS).toBeDefined();
      expect(exports.isAndroid).toBeDefined();
      expect(exports.isWeb).toBeDefined();
      expect(exports.Dimensions).toBeDefined();
    });

    it('should export device hooks', () => {
      expect(exports.useDevice).toBeDefined();
      expect(exports.useOrientation).toBeDefined();
      expect(exports.useNetwork).toBeDefined();
      expect(exports.useBattery).toBeDefined();
      expect(exports.useAppState).toBeDefined();
    });

    it('should export performance tools', () => {
      expect(exports.Performance).toBeDefined();
      expect(exports.mark).toBeDefined();
      expect(exports.measure).toBeDefined();
      expect(exports.memoize).toBeDefined();
      expect(exports.debounce).toBeDefined();
      expect(exports.throttle).toBeDefined();
    });

    it('should export dev tools', () => {
      expect(exports.DevTools).toBeDefined();
      expect(exports.initHMR).toBeDefined();
    });

    it('should export bridge utilities', () => {
      expect(exports.Bridge).toBeDefined();
      expect(exports.registerNativeModule).toBeDefined();
      expect(exports.callNativeMethod).toBeDefined();
    });
  });

  describe('Platform Detection', () => {
    it('should detect platform', () => {
      const platform = exports.detectPlatform();
      expect(['ios', 'android', 'web', 'unknown']).toContain(platform);
    });

    it('should get platform info', () => {
      const info = exports.getPlatformInfo();
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('isNative');
    });
  });

  describe('StyleSheet', () => {
    it('should create styles', () => {
      const styles = exports.StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#fff'
        }
      });
      expect(styles.container).toBeDefined();
    });

    it('should flatten styles', () => {
      const flattened = exports.StyleSheet.flatten([
        { color: 'red' },
        { fontSize: 16 }
      ]);
      expect(flattened).toHaveProperty('color');
      expect(flattened).toHaveProperty('fontSize');
    });
  });

  describe('Export Count', () => {
    it('should have substantial exports', () => {
      const exportCount = Object.keys(exports).length;
      expect(exportCount).toBeGreaterThan(100);
    });
  });
});
