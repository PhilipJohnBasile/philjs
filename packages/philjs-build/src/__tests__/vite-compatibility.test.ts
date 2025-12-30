/**
 * @philjs/build - Vite Compatibility Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  viteAdapter,
  createViteCompatibleConfig,
  convertRspackToVite,
  type ViteAdapterOptions,
} from '../vite/index.js';
import {
  mapRspackPluginToVite,
  mapRspackLoaderToVite,
  mapRspackOptionsToVite,
} from '../vite/compatibility.js';

describe('viteAdapter', () => {
  describe('adapter creation', () => {
    it('should create a Vite-compatible configuration', () => {
      const adapter = viteAdapter();

      expect(adapter).toBeDefined();
      expect(typeof adapter).toBe('object');
    });

    it('should accept custom options', () => {
      const options: ViteAdapterOptions = {
        mode: 'production',
        minify: true,
        sourcemap: true,
      };

      const adapter = viteAdapter(options);

      expect(adapter).toBeDefined();
    });

    it('should configure build options', () => {
      const adapter = viteAdapter({
        build: {
          outDir: 'custom-dist',
          minify: 'esbuild',
        },
      });

      expect(adapter.build?.outDir).toBe('custom-dist');
      expect(adapter.build?.minify).toBe('esbuild');
    });
  });

  describe('development mode', () => {
    it('should configure dev server', () => {
      const adapter = viteAdapter({
        mode: 'development',
        server: {
          port: 5173,
          hot: true,
        },
      });

      expect(adapter.server?.port).toBe(5173);
    });

    it('should enable HMR in development', () => {
      const adapter = viteAdapter({
        mode: 'development',
      });

      expect(adapter.server?.hmr).not.toBe(false);
    });
  });

  describe('production mode', () => {
    it('should enable minification', () => {
      const adapter = viteAdapter({
        mode: 'production',
      });

      expect(adapter.build?.minify).toBeTruthy();
    });

    it('should configure asset handling', () => {
      const adapter = viteAdapter({
        mode: 'production',
        build: {
          assetsInlineLimit: 4096,
        },
      });

      expect(adapter.build?.assetsInlineLimit).toBe(4096);
    });
  });
});

describe('createViteCompatibleConfig', () => {
  it('should create a valid Vite configuration', () => {
    const config = createViteCompatibleConfig({});

    expect(config).toBeDefined();
    expect(config.build).toBeDefined();
    expect(config.plugins).toBeDefined();
  });

  it('should configure resolve options', () => {
    const config = createViteCompatibleConfig({
      resolve: {
        alias: {
          '@': '/src',
        },
      },
    });

    expect(config.resolve?.alias).toBeDefined();
    expect(config.resolve?.alias?.['@']).toBe('/src');
  });

  it('should configure CSS options', () => {
    const config = createViteCompatibleConfig({
      css: {
        modules: {
          localsConvention: 'camelCase',
        },
      },
    });

    expect(config.css?.modules?.localsConvention).toBe('camelCase');
  });

  it('should configure esbuild options', () => {
    const config = createViteCompatibleConfig({
      esbuild: {
        target: 'es2022',
        jsx: 'automatic',
      },
    });

    expect(config.esbuild?.target).toBe('es2022');
    expect(config.esbuild?.jsx).toBe('automatic');
  });
});

describe('convertRspackToVite', () => {
  it('should convert Rspack config to Vite format', () => {
    const rspackConfig = {
      mode: 'production' as const,
      entry: './src/index.ts',
      output: {
        path: '/dist',
        filename: 'bundle.js',
      },
    };

    const viteConfig = convertRspackToVite(rspackConfig);

    expect(viteConfig).toBeDefined();
    expect(viteConfig.build?.outDir).toBe('/dist');
  });

  it('should convert module rules to Vite plugins', () => {
    const rspackConfig = {
      module: {
        rules: [
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
          },
        ],
      },
    };

    const viteConfig = convertRspackToVite(rspackConfig);

    expect(viteConfig).toBeDefined();
    // Vite handles CSS natively, so no conversion needed
  });

  it('should convert resolve aliases', () => {
    const rspackConfig = {
      resolve: {
        alias: {
          '@components': '/src/components',
        },
      },
    };

    const viteConfig = convertRspackToVite(rspackConfig);

    expect(viteConfig.resolve?.alias?.['@components']).toBe('/src/components');
  });

  it('should convert devServer options', () => {
    const rspackConfig = {
      devServer: {
        port: 8080,
        proxy: {
          '/api': 'http://localhost:3000',
        },
      },
    };

    const viteConfig = convertRspackToVite(rspackConfig);

    expect(viteConfig.server?.port).toBe(8080);
    expect(viteConfig.server?.proxy?.['/api']).toBe('http://localhost:3000');
  });

  it('should handle optimization settings', () => {
    const rspackConfig = {
      optimization: {
        minimize: true,
        splitChunks: {
          chunks: 'all',
        },
      },
    };

    const viteConfig = convertRspackToVite(rspackConfig);

    expect(viteConfig.build?.minify).toBeTruthy();
  });
});

describe('mapRspackPluginToVite', () => {
  it('should map HtmlWebpackPlugin to Vite equivalent', () => {
    const rspackPlugin = {
      constructor: { name: 'HtmlRspackPlugin' },
      options: { template: './index.html' },
    };

    const vitePlugin = mapRspackPluginToVite(rspackPlugin);

    expect(vitePlugin).toBeDefined();
  });

  it('should skip unsupported plugins gracefully', () => {
    const unsupportedPlugin = {
      constructor: { name: 'UnknownPlugin' },
    };

    const vitePlugin = mapRspackPluginToVite(unsupportedPlugin);

    expect(vitePlugin).toBeNull();
  });

  it('should map DefinePlugin to Vite define', () => {
    const rspackPlugin = {
      constructor: { name: 'DefinePlugin' },
      definitions: {
        'process.env.NODE_ENV': '"production"',
      },
    };

    const vitePlugin = mapRspackPluginToVite(rspackPlugin);

    expect(vitePlugin).toBeDefined();
  });
});

describe('mapRspackLoaderToVite', () => {
  it('should identify loaders that need plugins', () => {
    const loader = {
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    };

    const result = mapRspackLoaderToVite(loader);

    expect(result.needsPlugin).toBe(true);
    expect(result.pluginName).toBe('vite-plugin-svgr');
  });

  it('should identify native Vite support', () => {
    const loader = {
      test: /\.css$/,
      use: ['css-loader'],
    };

    const result = mapRspackLoaderToVite(loader);

    expect(result.needsPlugin).toBe(false);
    expect(result.nativeSupport).toBe(true);
  });

  it('should handle TypeScript loaders', () => {
    const loader = {
      test: /\.tsx?$/,
      use: ['ts-loader'],
    };

    const result = mapRspackLoaderToVite(loader);

    expect(result.nativeSupport).toBe(true); // Vite handles TS natively via esbuild
  });

  it('should handle asset loaders', () => {
    const loader = {
      test: /\.(png|jpg|gif)$/,
      type: 'asset/resource',
    };

    const result = mapRspackLoaderToVite(loader);

    expect(result.nativeSupport).toBe(true);
  });
});

describe('mapRspackOptionsToVite', () => {
  it('should map target option', () => {
    const rspackOptions = { target: 'es2022' };

    const viteOptions = mapRspackOptionsToVite(rspackOptions);

    expect(viteOptions.build?.target).toBe('es2022');
  });

  it('should map devtool to sourcemap', () => {
    const rspackOptions = { devtool: 'source-map' };

    const viteOptions = mapRspackOptionsToVite(rspackOptions);

    expect(viteOptions.build?.sourcemap).toBe(true);
  });

  it('should map inline-source-map', () => {
    const rspackOptions = { devtool: 'inline-source-map' };

    const viteOptions = mapRspackOptionsToVite(rspackOptions);

    expect(viteOptions.build?.sourcemap).toBe('inline');
  });

  it('should map hidden-source-map', () => {
    const rspackOptions = { devtool: 'hidden-source-map' };

    const viteOptions = mapRspackOptionsToVite(rspackOptions);

    expect(viteOptions.build?.sourcemap).toBe('hidden');
  });

  it('should map externals', () => {
    const rspackOptions = {
      externals: ['react', 'react-dom'],
    };

    const viteOptions = mapRspackOptionsToVite(rspackOptions);

    expect(viteOptions.build?.rollupOptions?.external).toEqual(['react', 'react-dom']);
  });
});

describe('plugin compatibility', () => {
  it('should provide Vite plugin from Rspack config', () => {
    const rspackConfig = {
      plugins: [
        {
          name: 'philjs-rspack-plugin',
          apply: vi.fn(),
        },
      ],
    };

    const viteConfig = convertRspackToVite(rspackConfig);

    expect(viteConfig.plugins).toBeDefined();
    expect(Array.isArray(viteConfig.plugins)).toBe(true);
  });

  it('should include PhilJS Vite plugin equivalent', () => {
    const viteConfig = createViteCompatibleConfig({
      philjs: true,
    });

    const hasPhilJSPlugin = viteConfig.plugins?.some(
      (p) => typeof p === 'object' && 'name' in p && p.name?.includes('philjs')
    );

    expect(hasPhilJSPlugin).toBe(true);
  });
});

describe('build output compatibility', () => {
  it('should configure consistent output paths', () => {
    const rspackConfig = {
      output: {
        path: '/dist',
        publicPath: '/assets/',
      },
    };

    const viteConfig = convertRspackToVite(rspackConfig);

    expect(viteConfig.build?.outDir).toBe('/dist');
    expect(viteConfig.base).toBe('/assets/');
  });

  it('should configure library mode', () => {
    const viteConfig = createViteCompatibleConfig({
      build: {
        lib: {
          entry: './src/index.ts',
          name: 'MyLib',
          formats: ['es', 'cjs'],
        },
      },
    });

    expect(viteConfig.build?.lib?.entry).toBe('./src/index.ts');
    expect(viteConfig.build?.lib?.name).toBe('MyLib');
  });

  it('should configure rollup options', () => {
    const viteConfig = createViteCompatibleConfig({
      build: {
        rollupOptions: {
          external: ['react'],
          output: {
            globals: {
              react: 'React',
            },
          },
        },
      },
    });

    expect(viteConfig.build?.rollupOptions?.external).toContain('react');
  });
});
