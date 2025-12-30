/**
 * @philjs/build - Rslib Presets Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createRslibConfig,
  rslibPresets,
  type RslibPreset,
  type RslibConfigOptions,
} from '../rslib/index.js';
import {
  libraryPreset,
  applicationPreset,
  componentPreset,
  nodePreset,
} from '../rslib/config.js';

describe('createRslibConfig', () => {
  describe('default configuration', () => {
    it('should create a valid Rslib configuration', () => {
      const config = createRslibConfig();

      expect(config).toBeDefined();
      expect(config.source).toBeDefined();
      expect(config.output).toBeDefined();
    });

    it('should use ESM output format by default', () => {
      const config = createRslibConfig();

      expect(config.output?.format).toBe('esm');
    });

    it('should generate declaration files', () => {
      const config = createRslibConfig();

      expect(config.output?.dts).toBe(true);
    });
  });

  describe('library preset', () => {
    it('should configure for library output', () => {
      const config = createRslibConfig({ preset: 'library' });

      expect(config).toBeDefined();
      expect(config.output?.format).toBe('esm');
      expect(config.output?.clean).toBe(true);
    });

    it('should support dual ESM/CJS output', () => {
      const config = createRslibConfig({
        preset: 'library',
        output: {
          formats: ['esm', 'cjs'],
        },
      });

      expect(config.output?.formats).toContain('esm');
      expect(config.output?.formats).toContain('cjs');
    });

    it('should configure external dependencies', () => {
      const config = createRslibConfig({
        preset: 'library',
        external: ['react', 'react-dom'],
      });

      expect(config.external).toBeDefined();
      expect(config.external).toContain('react');
      expect(config.external).toContain('react-dom');
    });

    it('should mark peer dependencies as external', () => {
      const config = createRslibConfig({
        preset: 'library',
        autoExternalPeers: true,
      });

      expect(config.autoExternal?.peerDependencies).toBe(true);
    });
  });

  describe('application preset', () => {
    it('should configure for application output', () => {
      const config = createRslibConfig({ preset: 'application' });

      expect(config).toBeDefined();
      expect(config.output?.minify).toBe(true);
    });

    it('should enable code splitting', () => {
      const config = createRslibConfig({ preset: 'application' });

      expect(config.output?.splitting).toBe(true);
    });

    it('should configure entry points', () => {
      const config = createRslibConfig({
        preset: 'application',
        source: {
          entry: {
            main: './src/main.ts',
            worker: './src/worker.ts',
          },
        },
      });

      expect(config.source?.entry?.main).toBe('./src/main.ts');
      expect(config.source?.entry?.worker).toBe('./src/worker.ts');
    });
  });

  describe('component preset', () => {
    it('should configure for component library', () => {
      const config = createRslibConfig({ preset: 'component' });

      expect(config).toBeDefined();
      expect(config.output?.dts).toBe(true);
    });

    it('should handle CSS extraction', () => {
      const config = createRslibConfig({
        preset: 'component',
        output: {
          extractCSS: true,
        },
      });

      expect(config.output?.extractCSS).toBe(true);
    });

    it('should preserve component structure', () => {
      const config = createRslibConfig({
        preset: 'component',
        output: {
          preserveModules: true,
        },
      });

      expect(config.output?.preserveModules).toBe(true);
    });
  });

  describe('node preset', () => {
    it('should configure for Node.js output', () => {
      const config = createRslibConfig({ preset: 'node' });

      expect(config).toBeDefined();
      expect(config.output?.target).toBe('node');
    });

    it('should use CJS format for Node.js', () => {
      const config = createRslibConfig({
        preset: 'node',
        output: {
          format: 'cjs',
        },
      });

      expect(config.output?.format).toBe('cjs');
    });

    it('should configure Node.js built-ins as external', () => {
      const config = createRslibConfig({
        preset: 'node',
        autoExternalNode: true,
      });

      expect(config.autoExternal?.builtins).toBe(true);
    });
  });
});

describe('rslibPresets', () => {
  it('should export all presets', () => {
    expect(rslibPresets.library).toBeDefined();
    expect(rslibPresets.application).toBeDefined();
    expect(rslibPresets.component).toBeDefined();
    expect(rslibPresets.node).toBeDefined();
  });

  it('should be valid preset configurations', () => {
    for (const preset of Object.values(rslibPresets)) {
      expect(preset).toBeDefined();
      expect(typeof preset).toBe('object');
    }
  });
});

describe('libraryPreset', () => {
  it('should provide library defaults', () => {
    const preset = libraryPreset;

    expect(preset).toBeDefined();
    expect(preset.output?.format).toBe('esm');
    expect(preset.output?.dts).toBe(true);
  });

  it('should configure tree shaking', () => {
    const preset = libraryPreset;

    expect(preset.output?.minify).toBe(false);
    expect(preset.output?.sourceMap).toBe(true);
  });
});

describe('applicationPreset', () => {
  it('should provide application defaults', () => {
    const preset = applicationPreset;

    expect(preset).toBeDefined();
    expect(preset.output?.minify).toBe(true);
  });

  it('should configure production optimizations', () => {
    const preset = applicationPreset;

    expect(preset.output?.splitting).toBe(true);
    expect(preset.output?.clean).toBe(true);
  });
});

describe('componentPreset', () => {
  it('should provide component defaults', () => {
    const preset = componentPreset;

    expect(preset).toBeDefined();
    expect(preset.output?.dts).toBe(true);
  });

  it('should configure CSS handling', () => {
    const preset = componentPreset;

    expect(preset.output?.extractCSS).toBeDefined();
  });
});

describe('nodePreset', () => {
  it('should provide Node.js defaults', () => {
    const preset = nodePreset;

    expect(preset).toBeDefined();
    expect(preset.output?.target).toBe('node');
  });

  it('should configure Node.js externals', () => {
    const preset = nodePreset;

    expect(preset.autoExternal?.builtins).toBe(true);
  });
});

describe('configuration merging', () => {
  it('should merge custom options with preset', () => {
    const config = createRslibConfig({
      preset: 'library',
      output: {
        dir: './custom-dist',
      },
    });

    expect(config.output?.dir).toBe('./custom-dist');
    expect(config.output?.format).toBe('esm'); // From preset
  });

  it('should allow overriding preset values', () => {
    const config = createRslibConfig({
      preset: 'library',
      output: {
        format: 'cjs',
      },
    });

    expect(config.output?.format).toBe('cjs');
  });

  it('should merge plugins arrays', () => {
    const customPlugin = { name: 'custom' };
    const config = createRslibConfig({
      preset: 'library',
      plugins: [customPlugin],
    });

    expect(config.plugins).toContainEqual(customPlugin);
  });
});

describe('source configuration', () => {
  it('should configure entry points', () => {
    const config = createRslibConfig({
      source: {
        entry: './src/index.ts',
      },
    });

    expect(config.source?.entry).toBe('./src/index.ts');
  });

  it('should configure multiple entries', () => {
    const config = createRslibConfig({
      source: {
        entry: {
          index: './src/index.ts',
          utils: './src/utils.ts',
        },
      },
    });

    expect(config.source?.entry?.index).toBe('./src/index.ts');
    expect(config.source?.entry?.utils).toBe('./src/utils.ts');
  });

  it('should configure alias', () => {
    const config = createRslibConfig({
      source: {
        alias: {
          '@': './src',
        },
      },
    });

    expect(config.source?.alias?.['@']).toBe('./src');
  });
});

describe('output configuration', () => {
  it('should configure output directory', () => {
    const config = createRslibConfig({
      output: {
        dir: './lib',
      },
    });

    expect(config.output?.dir).toBe('./lib');
  });

  it('should configure filename patterns', () => {
    const config = createRslibConfig({
      output: {
        filename: '[name].[contenthash].js',
      },
    });

    expect(config.output?.filename).toBe('[name].[contenthash].js');
  });

  it('should configure source maps', () => {
    const config = createRslibConfig({
      output: {
        sourceMap: true,
      },
    });

    expect(config.output?.sourceMap).toBe(true);
  });
});
