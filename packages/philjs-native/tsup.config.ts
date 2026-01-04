import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disabled due to complex re-export issues with Platform type/value
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  external: ['@philjs/core', '@capacitor/core', '@capacitor/device', '@capacitor/app', '@capacitor/storage', '@capacitor/haptics', '@capacitor/local-notifications', '@capacitor/push-notifications', '@capacitor/camera', '@capacitor/geolocation', '@capacitor/share', '@capacitor/browser', '@capacitor/filesystem', '@capacitor/network', '@capacitor/preferences', '@capacitor/splash-screen', '@capacitor/status-bar', '@capacitor/keyboard', '@capacitor/clipboard', '@capacitor/toast', '@capacitor/motion', '@capacitor/screen-reader', '@capacitor/screen-orientation'],
});
