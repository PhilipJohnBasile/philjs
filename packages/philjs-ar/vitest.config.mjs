import { mergeConfig } from 'vitest/config';
import rootConfig from '../../vitest.config.mjs';

export default mergeConfig(rootConfig, {
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
