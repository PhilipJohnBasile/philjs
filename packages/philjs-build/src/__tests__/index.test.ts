/**
 * @philjs/build - Test Suite
 * Tests for Rspack/Rslib build toolchain with Module Federation
 */

import { describe, it, expect } from 'vitest';
import {
  // Rspack
  createRspackConfig,
  createModuleFederationPlugin,
  createPhilJSPlugin,
  presets as rspackPresets,
  // Rslib
  createRslibConfig,
  defineConfig,
  mergeConfigs,
  entriesFromGlob,
  generateExportsField,
  rslibPresets,
  // Vite Compatibility
  philJSVite,
  rspackViteCompat,
  adaptVitePlugin,
  createDevServerConfig,
  toViteServerConfig,
  toRspackDevServerConfig,
} from '../index.js';

describe('@philjs/build', () => {
  describe('Export Verification', () => {
    it('should export Rspack configuration functions', () => {
      expect(createRspackConfig).toBeDefined();
      expect(typeof createRspackConfig).toBe('function');
      expect(createModuleFederationPlugin).toBeDefined();
      expect(typeof createModuleFederationPlugin).toBe('function');
      expect(createPhilJSPlugin).toBeDefined();
      expect(typeof createPhilJSPlugin).toBe('function');
      expect(rspackPresets).toBeDefined();
    });

    it('should export Rslib configuration functions', () => {
      expect(createRslibConfig).toBeDefined();
      expect(typeof createRslibConfig).toBe('function');
      expect(defineConfig).toBeDefined();
      expect(typeof defineConfig).toBe('function');
      expect(mergeConfigs).toBeDefined();
      expect(typeof mergeConfigs).toBe('function');
      expect(entriesFromGlob).toBeDefined();
      expect(generateExportsField).toBeDefined();
      expect(rslibPresets).toBeDefined();
    });

    it('should export Vite compatibility functions', () => {
      expect(philJSVite).toBeDefined();
      expect(rspackViteCompat).toBeDefined();
      expect(adaptVitePlugin).toBeDefined();
      expect(createDevServerConfig).toBeDefined();
      expect(toViteServerConfig).toBeDefined();
      expect(toRspackDevServerConfig).toBeDefined();
    });
  });

  describe('createRspackConfig', () => {
    it('should create development config', () => {
      const config = createRspackConfig({
        mode: 'development',
        entry: './src/index.ts'
      });

      expect(config.mode).toBe('development');
      expect(config.entry).toBe('./src/index.ts');
      expect(config.devtool).toBe('eval-source-map');
    });

    it('should create production config', () => {
      const config = createRspackConfig({
        mode: 'production',
        entry: './src/index.ts'
      });

      expect(config.mode).toBe('production');
      expect(config.devtool).toBe('source-map');
      expect(config.optimization?.minimize).toBe(true);
    });

    it('should configure output correctly', () => {
      const config = createRspackConfig({
        mode: 'production',
        entry: './src/index.ts',
        output: {
          path: './dist',
          filename: 'bundle.js',
          publicPath: '/assets/'
        }
      });

      expect(config.output?.path).toBe('./dist');
      expect(config.output?.publicPath).toBe('/assets/');
      expect(config.output?.clean).toBe(true);
    });

    it('should include TypeScript/JavaScript rule', () => {
      const config = createRspackConfig({
        mode: 'development',
        entry: './src/index.ts'
      });

      const tsRule = config.module?.rules?.find(
        rule => rule.test?.toString().includes('[jt]sx?')
      );

      expect(tsRule).toBeDefined();
      expect(tsRule?.use?.[0]?.loader).toBe('builtin:swc-loader');
    });

    it('should include CSS rule', () => {
      const config = createRspackConfig({
        mode: 'development',
        entry: './src/index.ts'
      });

      const cssRule = config.module?.rules?.find(
        rule => rule.test?.toString().includes('\\.css$')
      );

      expect(cssRule).toBeDefined();
      expect(cssRule?.type).toBe('css');
    });

    it('should include asset rules', () => {
      const config = createRspackConfig({
        mode: 'development',
        entry: './src/index.ts'
      });

      const imageRule = config.module?.rules?.find(
        rule => rule.test?.toString().includes('png')
      );

      expect(imageRule).toBeDefined();
      expect(imageRule?.type).toBe('asset');
    });

    it('should configure resolve extensions', () => {
      const config = createRspackConfig({
        mode: 'development',
        entry: './src/index.ts'
      });

      expect(config.resolve?.extensions).toContain('.tsx');
      expect(config.resolve?.extensions).toContain('.ts');
      expect(config.resolve?.extensions).toContain('.js');
    });

    it('should configure split chunks', () => {
      const config = createRspackConfig({
        mode: 'production',
        entry: './src/index.ts'
      });

      expect(config.optimization?.splitChunks?.chunks).toBe('all');
      expect(config.optimization?.splitChunks?.cacheGroups?.philjs).toBeDefined();
      expect(config.optimization?.splitChunks?.cacheGroups?.vendors).toBeDefined();
    });

    it('should configure dev server in development', () => {
      const config = createRspackConfig({
        mode: 'development',
        entry: './src/index.ts',
        devServer: {
          port: 8080,
          hot: true,
          open: true
        }
      });

      expect(config.devServer?.port).toBe(8080);
      expect(config.devServer?.hot).toBe(true);
      expect(config.devServer?.open).toBe(true);
    });

    it('should add external dependencies', () => {
      const config = createRspackConfig({
        mode: 'production',
        entry: './src/index.ts',
        externals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      });

      expect(config.externals).toEqual({
        react: 'React',
        'react-dom': 'ReactDOM'
      });
    });

    it('should enable experimental CSS', () => {
      const config = createRspackConfig({
        mode: 'development',
        entry: './src/index.ts',
        experimentalCss: true
      });

      expect(config.experiments?.css).toBe(true);
    });

    it('should add PhilJS plugin when configured', () => {
      const config = createRspackConfig({
        mode: 'development',
        entry: './src/index.ts',
        philjs: {
          signals: true,
          jsx: 'transform',
          autoMemo: true,
          treeshake: 'aggressive'
        }
      });

      expect(config.plugins).toBeDefined();
      expect(config.plugins!.length).toBeGreaterThan(0);
    });

    it('should add Module Federation when configured', () => {
      const config = createRspackConfig({
        mode: 'production',
        entry: './src/index.ts',
        moduleFederation: {
          name: 'app',
          exposes: {
            './Button': './src/components/Button.tsx'
          },
          remotes: {
            shared: 'shared@http://localhost:3001/remoteEntry.js'
          }
        }
      });

      expect(config.plugins).toBeDefined();
      const mfPlugin = config.plugins?.find(
        (p: unknown) => (p as { name?: string }).name === 'ModuleFederationPlugin'
      );
      expect(mfPlugin).toBeDefined();
    });
  });

  describe('createModuleFederationPlugin', () => {
    it('should create MF plugin with required options', () => {
      const plugin = createModuleFederationPlugin({
        name: 'my-app'
      });

      expect(plugin).toHaveProperty('name', 'ModuleFederationPlugin');
      expect(plugin).toHaveProperty('options');
    });

    it('should set default filename', () => {
      const plugin = createModuleFederationPlugin({
        name: 'my-app'
      }) as { options: { filename: string } };

      expect(plugin.options.filename).toBe('remoteEntry.js');
    });

    it('should configure exposes', () => {
      const plugin = createModuleFederationPlugin({
        name: 'my-app',
        exposes: {
          './Widget': './src/Widget.tsx',
          './utils': './src/utils/index.ts'
        }
      }) as { options: { exposes: Record<string, string> } };

      expect(plugin.options.exposes).toEqual({
        './Widget': './src/Widget.tsx',
        './utils': './src/utils/index.ts'
      });
    });

    it('should configure remotes', () => {
      const plugin = createModuleFederationPlugin({
        name: 'my-app',
        remotes: {
          host: 'host@http://localhost:3000/remoteEntry.js'
        }
      }) as { options: { remotes: Record<string, string> } };

      expect(plugin.options.remotes).toEqual({
        host: 'host@http://localhost:3000/remoteEntry.js'
      });
    });

    it('should include default shared dependencies', () => {
      const plugin = createModuleFederationPlugin({
        name: 'my-app'
      }) as { options: { shared: Record<string, unknown> } };

      expect(plugin.options.shared['@philjs/core']).toBeDefined();
      expect(plugin.options.shared['@philjs/router']).toBeDefined();
    });

    it('should merge custom shared dependencies', () => {
      const plugin = createModuleFederationPlugin({
        name: 'my-app',
        shared: {
          lodash: { singleton: true },
          'date-fns': true
        }
      }) as { options: { shared: Record<string, unknown> } };

      expect(plugin.options.shared['lodash']).toEqual({ singleton: true });
      expect(plugin.options.shared['date-fns']).toEqual({ singleton: true });
    });
  });

  describe('createPhilJSPlugin', () => {
    it('should create PhilJS plugin', () => {
      const plugin = createPhilJSPlugin({
        signals: true,
        jsx: 'transform',
        autoMemo: true,
        treeshake: 'aggressive'
      });

      expect(plugin).toHaveProperty('name', 'PhilJSPlugin');
      expect(plugin).toHaveProperty('apply');
    });
  });

  describe('Rspack Presets', () => {
    it('should provide development preset', () => {
      const options = rspackPresets.development('./src/index.ts');

      expect(options.mode).toBe('development');
      expect(options.entry).toBe('./src/index.ts');
      expect(options.devServer?.hot).toBe(true);
    });

    it('should provide production preset', () => {
      const options = rspackPresets.production('./src/index.ts');

      expect(options.mode).toBe('production');
      expect(options.philjs?.autoMemo).toBe(true);
      expect(options.philjs?.treeshake).toBe('aggressive');
    });

    it('should provide library preset', () => {
      const options = rspackPresets.library('./src/index.ts', ['@philjs/core', 'react']);

      expect(options.mode).toBe('production');
      expect(options.externals).toHaveProperty('@philjs/core');
      expect(options.externals).toHaveProperty('react');
    });

    it('should provide microfrontend preset', () => {
      const options = rspackPresets.microfrontend(
        'my-mfe',
        './src/index.ts',
        {
          exposes: { './App': './src/App.tsx' },
          remotes: { shell: 'shell@http://localhost:3000/remoteEntry.js' }
        }
      );

      expect(options.mode).toBe('production');
      expect(options.moduleFederation?.name).toBe('my-mfe');
      expect(options.moduleFederation?.exposes).toHaveProperty('./App');
    });

    it('should support multi-entry development', () => {
      const options = rspackPresets.development({
        main: './src/index.ts',
        worker: './src/worker.ts'
      });

      expect(options.entry).toHaveProperty('main');
      expect(options.entry).toHaveProperty('worker');
    });
  });

  describe('Rslib Presets', () => {
    it('should export rslib presets', () => {
      expect(rslibPresets).toBeDefined();
    });
  });

  describe('Vite Compatibility', () => {
    it('should create PhilJS Vite plugin', () => {
      const plugin = philJSVite();
      expect(plugin).toBeDefined();
    });

    it('should create Rspack-Vite compatibility layer', () => {
      const compat = rspackViteCompat();
      expect(compat).toBeDefined();
    });

    it('should adapt Vite plugins', () => {
      const mockVitePlugin = { name: 'test-plugin' };
      const adapted = adaptVitePlugin(mockVitePlugin);
      expect(adapted).toBeDefined();
    });

    it('should create dev server config', () => {
      const config = createDevServerConfig({ port: 3000 });
      expect(config).toBeDefined();
    });

    it('should convert to Vite server config', () => {
      const config = toViteServerConfig({ port: 3000, hot: true });
      expect(config).toBeDefined();
    });

    it('should convert to Rspack dev server config', () => {
      const config = toRspackDevServerConfig({ port: 3000 });
      expect(config).toBeDefined();
    });
  });

  describe('Rslib Configuration', () => {
    it('should create Rslib config', () => {
      const config = createRslibConfig({
        entry: './src/index.ts',
        output: {
          path: './dist'
        }
      });

      expect(config).toBeDefined();
    });

    it('should define config with defineConfig', () => {
      const config = defineConfig({
        entry: { index: './src/index.ts' }
      });

      expect(config).toBeDefined();
    });

    it('should merge configs', () => {
      const base = { entry: './src/index.ts' };
      const override = { output: { path: './dist' } };
      const merged = mergeConfigs(base, override);

      expect(merged).toHaveProperty('entry');
      expect(merged).toHaveProperty('output');
    });

    it('should generate entries from glob', () => {
      const entries = entriesFromGlob('./src/**/*.ts');
      expect(entries).toBeDefined();
    });

    it('should generate exports field', () => {
      const exports = generateExportsField({
        main: './src/index.ts',
        utils: './src/utils/index.ts'
      });

      expect(exports).toBeDefined();
    });
  });
});
