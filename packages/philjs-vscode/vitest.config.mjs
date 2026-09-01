import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vitest/config';
import rootConfig from '../../vitest.config.mjs';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

export default mergeConfig(rootConfig, {
  resolve: {
    alias: {
      vscode: `${packageRoot}src/test/vscode-mock.ts`,
    },
  },
  test: {
    // extension.test.ts is an Extension Host suite (Mocha globals + the real
    // vscode module), so Vitest runs the provider unit suite instead.
    include: ['src/**/*.unit.test.ts'],
    exclude: ['src/test/extension.test.ts'],
  },
});
