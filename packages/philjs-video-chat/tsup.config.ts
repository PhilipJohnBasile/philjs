import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: [
    '@mediapipe/selfie_segmentation',
    '@philjs/core',
    '@philjs/webrtc',
  ],
});
