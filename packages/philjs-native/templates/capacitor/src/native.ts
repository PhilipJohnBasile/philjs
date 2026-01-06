/**
 * Native Plugin Initialization
 */

import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { isCapacitor, isNativePlatform, isIOS, isAndroid } from 'philjs-native';

/**
 * Initialize native plugins
 */
export async function initializeNative(): Promise<void> {
  // Only run on native platforms
  if (!isNativePlatform()) {
    return;
  }

  console.log(`Running on ${isIOS() ? 'iOS' : isAndroid() ? 'Android' : 'native'}`);

  try {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark });

    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    }

    // Set up keyboard listeners
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
    });

    // Set up app lifecycle listeners
    App.addListener('appStateChange', ({ isActive }) => {
      console.log(`App is ${isActive ? 'active' : 'background'}`);
    });

    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    // Hide splash screen after initialization
    await SplashScreen.hide();
  } catch (error) {
    console.error('Failed to initialize native plugins:', error);
  }
}

/**
 * Request permissions
 */
export async function requestPermissions(): Promise<{
  camera: boolean;
  location: boolean;
  notifications: boolean;
}> {
  const results = {
    camera: false,
    location: false,
    notifications: false,
  };

  try {
    const { Camera } = await import('@capacitor/camera');
    const cameraPermission = await Camera.requestPermissions();
    results.camera = cameraPermission.camera === 'granted';
  } catch (e) {
    console.warn('Camera permission failed:', e);
  }

  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const locationPermission = await Geolocation.requestPermissions();
    results.location = locationPermission.location === 'granted';
  } catch (e) {
    console.warn('Location permission failed:', e);
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const notificationPermission = await PushNotifications.requestPermissions();
    results.notifications = notificationPermission.receive === 'granted';
  } catch (e) {
    console.warn('Notification permission failed:', e);
  }

  return results;
}
