import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: [
    'src/index.ts',
    'src/preset.ts',
    'src/renderer.ts',
    'src/addons/signal-inspector.tsx',
    'src/addons/route-tester.tsx',
    'src/addons/theme-switcher.tsx',
    'src/addons/viewport.tsx',
    'src/decorators/index.ts',
    'src/mocks/index.ts',
  ],
  output: {
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  external: [
    'philjs-core',
    'philjs-router',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/blocks',
    '@storybook/test',
    '@storybook/core',
    'msw',
    'msw-storybook-addon',
  ],
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
    }),
  ],
};
