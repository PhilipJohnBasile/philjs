/**
 * Tests for Plugin SDK utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PluginBuilder,
  createBuilder,
  PluginTester,
  createTester,
  pluginValidator,
} from '../index.js';
import type { Plugin } from 'philjs-core/plugin-system';

describe('Plugin SDK', () => {
  describe('PluginBuilder', () => {
    it('should build a basic plugin', () => {
      const plugin = createBuilder()
        .meta({
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
        })
        .build();

      expect(plugin.meta.name).toBe('test-plugin');
      expect(plugin.meta.version).toBe('1.0.0');
      expect(plugin.meta.description).toBe('Test plugin');
      expect(plugin.meta.philjs).toBe('^2.0.0');
    });

    it('should add setup function', () => {
      const setupMock = () => Promise.resolve();

      const plugin = createBuilder()
        .meta({ name: 'test-plugin' })
        .setup(setupMock)
        .build();

      expect(plugin.setup).toBe(setupMock);
    });

    it('should add lifecycle hooks', () => {
      const initMock = async () => {};
      const buildStartMock = async () => {};

      const plugin = createBuilder()
        .meta({ name: 'test-plugin' })
        .hook('init', initMock)
        .hook('buildStart', buildStartMock)
        .build();

      expect(plugin.hooks?.init).toBe(initMock);
      expect(plugin.hooks?.buildStart).toBe(buildStartMock);
    });

    it('should add vitePlugin', () => {
      const vitePluginMock = () => ({ name: 'vite' });

      const plugin = createBuilder()
        .meta({ name: 'test-plugin' })
        .vitePlugin(vitePluginMock)
        .build();

      expect(plugin.vitePlugin).toBe(vitePluginMock);
    });

    it('should add config schema', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          enabled: { type: 'boolean' as const },
        },
      };

      const plugin = createBuilder()
        .meta({ name: 'test-plugin' })
        .configSchema(schema)
        .build();

      expect(plugin.configSchema).toEqual(schema);
    });

    it('should throw error if name is missing', () => {
      expect(() => {
        createBuilder().build();
      }).toThrow('Plugin name is required');
    });

    it('should chain methods', () => {
      const plugin = createBuilder()
        .meta({ name: 'test-plugin' })
        .setup(async () => {})
        .hook('init', async () => {})
        .build();

      expect(plugin.meta.name).toBe('test-plugin');
      expect(plugin.setup).toBeDefined();
      expect(plugin.hooks?.init).toBeDefined();
    });
  });

  describe('PluginTester', () => {
    let testPlugin: Plugin;
    let tester: PluginTester;

    beforeEach(() => {
      testPlugin = {
        meta: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
          philjs: '^2.0.0',
        },
        async setup(config, ctx) {
          ctx.logger.info('Setup called');
        },
        hooks: {
          async init(ctx) {
            ctx.logger.info('Init called');
          },
          async buildStart(ctx, buildConfig) {
            ctx.logger.debug('Build starting');
          },
          async buildEnd(ctx, result) {
            if (result.success) {
              ctx.logger.success('Build complete');
            }
          },
        },
      };

      tester = createTester(testPlugin);
    });

    it('should create tester instance', () => {
      expect(tester).toBeInstanceOf(PluginTester);
      expect(tester.getContext()).toBeDefined();
    });

    it('should test setup', async () => {
      await expect(tester.testSetup({})).resolves.toBeUndefined();
    });

    it('should test hooks', async () => {
      await expect(tester.testHook('init')).resolves.toBeUndefined();
    });

    it('should test buildStart hook', async () => {
      const buildConfig = {
        entry: 'src/index.ts',
        outDir: 'dist',
        minify: true,
        sourcemap: true,
        target: 'es2020' as const,
        format: 'esm' as const,
        splitting: false,
      };

      await expect(
        tester.testHook('buildStart', {}, buildConfig)
      ).resolves.toBeUndefined();
    });

    it('should test buildEnd hook', async () => {
      const result = {
        success: true,
        files: [],
        duration: 100,
      };

      await expect(
        tester.testHook('buildEnd', {}, result)
      ).resolves.toBeUndefined();
    });

    it('should throw error for missing hook', async () => {
      const pluginWithoutHooks: Plugin = {
        meta: {
          name: 'test',
          version: '1.0.0',
          philjs: '^2.0.0',
        },
        hooks: {},
      };

      const noHookTester = createTester(pluginWithoutHooks);

      await expect(
        noHookTester.testHook('init')
      ).rejects.toThrow('Hook "init" not found');
    });

    it('should provide mock context', () => {
      const ctx = tester.getContext();

      expect(ctx.version).toBe('2.0.0');
      expect(ctx.mode).toBe('development');
      expect(ctx.logger).toBeDefined();
      expect(ctx.fs).toBeDefined();
      expect(ctx.utils).toBeDefined();
    });

    it('should allow setting and getting files', async () => {
      tester.setFile('/test/file.txt', 'content');
      const content = await tester.getFile('/test/file.txt');

      expect(content).toBe('content');
    });
  });

  describe('Plugin Validator', () => {
    it('should validate correct plugin', () => {
      const plugin: Plugin = {
        meta: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test',
          philjs: '^2.0.0',
        },
        async setup() {},
      };

      const result = pluginValidator.validate(plugin);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing name', () => {
      const plugin: any = {
        meta: {
          version: '1.0.0',
        },
      };

      const result = pluginValidator.validate(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must have a name');
    });

    it('should detect missing version', () => {
      const plugin: any = {
        meta: {
          name: 'test',
        },
      };

      const result = pluginValidator.validate(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin must have a version');
    });

    it('should detect invalid version format', () => {
      const plugin: Plugin = {
        meta: {
          name: 'test',
          version: 'invalid',
          philjs: '^2.0.0',
        },
        hooks: {},
      };

      const result = pluginValidator.validate(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Version must be valid semver');
    });

    it('should require setup or hooks', () => {
      const plugin: any = {
        meta: {
          name: 'test',
          version: '1.0.0',
        },
      };

      const result = pluginValidator.validate(plugin);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Plugin must have at least a setup function or lifecycle hooks'
      );
    });

    it('should validate plugin with hooks', () => {
      const plugin: Plugin = {
        meta: {
          name: 'test',
          version: '1.0.0',
          philjs: '^2.0.0',
        },
        hooks: {
          async init() {},
        },
      };

      const result = pluginValidator.validate(plugin);

      expect(result.valid).toBe(true);
    });
  });

  describe('Config Validator', () => {
    it('should validate config against schema', () => {
      const schema = {
        type: 'object' as const,
        required: ['apiKey'],
        properties: {
          apiKey: { type: 'string' as const },
          enabled: { type: 'boolean' as const },
        },
      };

      const config = {
        apiKey: 'test-key',
        enabled: true,
      };

      const result = pluginValidator.validateConfig(config, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const schema = {
        type: 'object' as const,
        required: ['apiKey'],
        properties: {
          apiKey: { type: 'string' as const },
        },
      };

      const config = {};

      const result = pluginValidator.validateConfig(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Required field "apiKey" is missing');
    });

    it('should detect type mismatches', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          enabled: { type: 'boolean' as const },
        },
      };

      const config = {
        enabled: 'yes', // Should be boolean
      };

      const result = pluginValidator.validateConfig(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('should be boolean');
    });

    it('should validate enum values', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          mode: {
            type: 'string' as const,
            enum: ['dev', 'prod'],
          },
        },
      };

      const config = {
        mode: 'invalid',
      };

      const result = pluginValidator.validateConfig(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must be one of');
    });
  });
});
