/**
 * @philjs/build - Rspack Plugin Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  philJSRspackPlugin,
  createRspackConfig,
  type RspackPluginOptions,
} from '../rspack/index.js';
import { defaultRspackConfig, mergeRspackConfig } from '../rspack/config.js';

describe('philJSRspackPlugin', () => {
  describe('plugin creation', () => {
    it('should create a plugin with default options', () => {
      const plugin = philJSRspackPlugin();

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('philjs-rspack-plugin');
      expect(typeof plugin.apply).toBe('function');
    });

    it('should create a plugin with custom options', () => {
      const options: RspackPluginOptions = {
        mode: 'production',
        minify: true,
        sourcemap: false,
        target: 'es2022',
      };

      const plugin = philJSRspackPlugin(options);

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('philjs-rspack-plugin');
    });

    it('should accept development mode', () => {
      const plugin = philJSRspackPlugin({ mode: 'development' });

      expect(plugin).toBeDefined();
    });

    it('should accept production mode', () => {
      const plugin = philJSRspackPlugin({ mode: 'production' });

      expect(plugin).toBeDefined();
    });
  });

  describe('plugin options', () => {
    it('should merge options with defaults', () => {
      const customOptions: RspackPluginOptions = {
        target: 'es2024',
        sourcemap: 'inline',
      };

      const plugin = philJSRspackPlugin(customOptions);

      expect(plugin).toBeDefined();
    });

    it('should support all target options', () => {
      const targets = ['es2020', 'es2021', 'es2022', 'es2023', 'es2024', 'esnext'] as const;

      for (const target of targets) {
        const plugin = philJSRspackPlugin({ target });
        expect(plugin).toBeDefined();
      }
    });

    it('should support all sourcemap options', () => {
      const sourcemapOptions = [true, false, 'inline', 'hidden', 'nosources'] as const;

      for (const sourcemap of sourcemapOptions) {
        const plugin = philJSRspackPlugin({ sourcemap });
        expect(plugin).toBeDefined();
      }
    });
  });
});

describe('createRspackConfig', () => {
  describe('default configuration', () => {
    it('should create a valid Rspack configuration', () => {
      const config = createRspackConfig();

      expect(config).toBeDefined();
      expect(config.mode).toBeDefined();
      expect(config.entry).toBeDefined();
      expect(config.output).toBeDefined();
    });

    it('should include PhilJS plugin by default', () => {
      const config = createRspackConfig();

      expect(config.plugins).toBeDefined();
      expect(Array.isArray(config.plugins)).toBe(true);
    });

    it('should configure module rules for TypeScript', () => {
      const config = createRspackConfig();

      expect(config.module).toBeDefined();
      expect(config.module?.rules).toBeDefined();
      expect(Array.isArray(config.module?.rules)).toBe(true);
    });
  });

  describe('custom configuration', () => {
    it('should accept custom entry point', () => {
      const config = createRspackConfig({
        entry: './src/custom-entry.ts',
      });

      expect(config.entry).toBe('./src/custom-entry.ts');
    });

    it('should accept custom output path', () => {
      const config = createRspackConfig({
        output: {
          path: '/custom/output',
          filename: 'custom.js',
        },
      });

      expect(config.output?.path).toBe('/custom/output');
      expect(config.output?.filename).toBe('custom.js');
    });

    it('should configure development mode correctly', () => {
      const config = createRspackConfig({ mode: 'development' });

      expect(config.mode).toBe('development');
      expect(config.devtool).toBeTruthy();
    });

    it('should configure production mode correctly', () => {
      const config = createRspackConfig({ mode: 'production' });

      expect(config.mode).toBe('production');
      expect(config.optimization?.minimize).toBe(true);
    });
  });

  describe('resolve configuration', () => {
    it('should configure file extensions', () => {
      const config = createRspackConfig();

      expect(config.resolve?.extensions).toBeDefined();
      expect(config.resolve?.extensions).toContain('.ts');
      expect(config.resolve?.extensions).toContain('.tsx');
      expect(config.resolve?.extensions).toContain('.js');
    });

    it('should configure path aliases', () => {
      const config = createRspackConfig({
        resolve: {
          alias: {
            '@': '/src',
          },
        },
      });

      expect(config.resolve?.alias).toBeDefined();
      expect(config.resolve?.alias?.['@']).toBe('/src');
    });
  });
});

describe('defaultRspackConfig', () => {
  it('should provide sensible defaults', () => {
    const defaults = defaultRspackConfig;

    expect(defaults).toBeDefined();
    expect(defaults.mode).toBeDefined();
    expect(defaults.target).toBeDefined();
  });

  it('should target web by default', () => {
    const defaults = defaultRspackConfig;

    expect(defaults.target).toBe('web');
  });

  it('should include CSS handling', () => {
    const defaults = defaultRspackConfig;

    const cssRule = defaults.module?.rules?.find(
      (rule: { test?: RegExp }) => rule?.test?.toString().includes('css')
    );
    expect(cssRule).toBeDefined();
  });
});

describe('mergeRspackConfig', () => {
  it('should merge two configurations', () => {
    const base = { mode: 'development' as const, entry: './src/index.ts' };
    const override = { mode: 'production' as const };

    const merged = mergeRspackConfig(base, override);

    expect(merged.mode).toBe('production');
    expect(merged.entry).toBe('./src/index.ts');
  });

  it('should deep merge nested objects', () => {
    const base = {
      output: { path: '/dist', filename: 'bundle.js' },
    };
    const override = {
      output: { filename: 'custom.js' },
    };

    const merged = mergeRspackConfig(base, override);

    expect(merged.output?.path).toBe('/dist');
    expect(merged.output?.filename).toBe('custom.js');
  });

  it('should concatenate arrays for plugins', () => {
    const plugin1 = { name: 'plugin1', apply: vi.fn() };
    const plugin2 = { name: 'plugin2', apply: vi.fn() };

    const base = { plugins: [plugin1] };
    const override = { plugins: [plugin2] };

    const merged = mergeRspackConfig(base, override);

    expect(merged.plugins).toHaveLength(2);
    expect(merged.plugins).toContain(plugin1);
    expect(merged.plugins).toContain(plugin2);
  });

  it('should handle undefined values', () => {
    const base = { mode: 'development' as const };
    const override = { entry: undefined };

    const merged = mergeRspackConfig(base, override);

    expect(merged.mode).toBe('development');
  });
});

describe('optimization configuration', () => {
  it('should enable tree shaking in production', () => {
    const config = createRspackConfig({ mode: 'production' });

    expect(config.optimization?.usedExports).toBe(true);
    expect(config.optimization?.sideEffects).toBe(true);
  });

  it('should configure code splitting', () => {
    const config = createRspackConfig({
      optimization: {
        splitChunks: {
          chunks: 'all',
        },
      },
    });

    expect(config.optimization?.splitChunks).toBeDefined();
    expect(config.optimization?.splitChunks?.chunks).toBe('all');
  });

  it('should configure minification options', () => {
    const config = createRspackConfig({
      mode: 'production',
      optimization: {
        minimize: true,
      },
    });

    expect(config.optimization?.minimize).toBe(true);
  });
});

describe('devServer configuration', () => {
  it('should configure hot module replacement', () => {
    const config = createRspackConfig({
      devServer: {
        hot: true,
        port: 3000,
      },
    });

    expect(config.devServer?.hot).toBe(true);
    expect(config.devServer?.port).toBe(3000);
  });

  it('should configure proxy settings', () => {
    const config = createRspackConfig({
      devServer: {
        proxy: {
          '/api': 'http://localhost:8080',
        },
      },
    });

    expect(config.devServer?.proxy).toBeDefined();
    expect(config.devServer?.proxy?.['/api']).toBe('http://localhost:8080');
  });
});
