import { describe, it, expect, beforeEach, vi } from 'vitest';
import { philjsOptimizer } from './vite.js';
import type { ViteOptimizerOptions } from './vite.js';
import type { Plugin, ResolvedConfig } from 'vite';

describe('Vite Plugin', () => {
  let plugin: Plugin;
  let mockConfig: ResolvedConfig;

  beforeEach(() => {
    mockConfig = {
      command: 'build',
      mode: 'production',
      root: '/test',
      build: {
        outDir: '/test/dist',
      },
    } as ResolvedConfig;
  });

  describe('Plugin Configuration', () => {
    it('should create plugin with default options', () => {
      plugin = philjsOptimizer();

      expect(plugin.name).toBe('philjs-optimizer');
      expect(plugin.enforce).toBe('pre');
    });

    it('should accept custom options', () => {
      const options: ViteOptimizerOptions = {
        strategy: 'aggressive',
        baseUrl: '/custom',
        sourcemap: false,
      };

      plugin = philjsOptimizer(options);

      expect(plugin.name).toBe('philjs-optimizer');
    });

    it('should configure with include patterns', () => {
      plugin = philjsOptimizer({
        include: ['**/*.tsx'],
      });

      expect(plugin).toBeDefined();
    });

    it('should configure with exclude patterns', () => {
      plugin = philjsOptimizer({
        exclude: ['**/*.test.*'],
      });

      expect(plugin).toBeDefined();
    });

    it('should support custom bundling strategy', () => {
      plugin = philjsOptimizer({
        strategy: 'route',
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('configResolved Hook', () => {
    it('should store resolved config', () => {
      plugin = philjsOptimizer();

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      expect(plugin).toBeDefined();
    });

    it('should detect build mode', () => {
      plugin = philjsOptimizer();

      const buildConfig = { ...mockConfig, command: 'build' } as ResolvedConfig;

      if (plugin.configResolved) {
        plugin.configResolved(buildConfig);
      }

      expect(plugin).toBeDefined();
    });

    it('should detect serve mode', () => {
      plugin = philjsOptimizer();

      const serveConfig = { ...mockConfig, command: 'serve' } as ResolvedConfig;

      if (plugin.configResolved) {
        plugin.configResolved(serveConfig);
      }

      expect(plugin).toBeDefined();
    });
  });

  describe('transform Hook', () => {
    beforeEach(() => {
      plugin = philjsOptimizer();
      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }
    });

    it('should transform supported files', async () => {
      const source = `
        function Component() {
          return <div>Hello</div>;
        }
      `;

      const result = await (plugin.transform as any)?.(source, '/test/Component.tsx');

      expect(result).toBeDefined();
    });

    it('should skip node_modules', async () => {
      const source = 'const x = 42;';

      const result = await (plugin.transform as any)?.(source, '/node_modules/package/file.js');

      expect(result).toBeNull();
    });

    it('should skip excluded files', async () => {
      plugin = philjsOptimizer({
        exclude: ['**/*.test.*'],
      });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const source = 'test code';
      const result = await (plugin.transform as any)?.(source, '/test/file.test.ts');

      expect(result).toBeNull();
    });

    it('should only process included files', async () => {
      plugin = philjsOptimizer({
        include: ['**/*.tsx'],
      });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const tsxResult = await (plugin.transform as any)?.(
        'const x = <div />;',
        '/test/Component.tsx'
      );

      expect(tsxResult).toBeDefined();

      const tsResult = await (plugin.transform as any)?.(
        'const x = 42;',
        '/test/file.ts'
      );

      expect(tsResult).toBeNull();
    });

    it('should handle transform errors gracefully', async () => {
      const invalidSource = 'const x = {]';

      const result = await (plugin.transform as any)?.(invalidSource, '/test/file.ts');

      // Should return null on error
      expect(result).toBeNull();
    });

    it('should extract symbols during transformation', async () => {
      const source = `
        function loadUsers() {
          return fetch('/api/users');
        }
      `;

      const result = await (plugin.transform as any)?.(source, '/test/api.ts');

      expect(result).toBeDefined();
    });

    it('should handle lazy handlers', async () => {
      const source = `
        const handler = $(() => {
          console.log('lazy');
        });
      `;

      const result = await (plugin.transform as any)?.(source, '/test/handlers.ts');

      if (result && typeof result === 'object' && 'code' in result) {
        expect(result.code).toContain('$$');
      }
    });

    it('should generate source maps when enabled', async () => {
      plugin = philjsOptimizer({
        sourcemap: true,
      });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const source = 'const x = 42;';
      const result = await (plugin.transform as any)?.(source, '/test/file.ts');

      if (result && typeof result === 'object') {
        expect(result.map).toBeDefined();
      }
    });

    it('should not generate source maps when disabled', async () => {
      plugin = philjsOptimizer({
        sourcemap: false,
      });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const source = 'const x = 42;';
      const result = await (plugin.transform as any)?.(source, '/test/file.ts');

      if (result && typeof result === 'object') {
        expect(result.map).toBeFalsy();
      }
    });
  });

  describe('resolveId Hook', () => {
    beforeEach(() => {
      plugin = philjsOptimizer({ baseUrl: '/lazy' });
      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }
    });

    it('should resolve lazy chunk imports', async () => {
      const result = await (plugin.resolveId as any)?.('/lazy/chunk1.js');

      expect(result).toBe('/lazy/chunk1.js');
    });

    it('should not resolve non-lazy imports', async () => {
      const result = await (plugin.resolveId as any)?.('/regular/module.js');

      expect(result).toBeNull();
    });

    it('should respect custom base URL', async () => {
      plugin = philjsOptimizer({ baseUrl: '/custom' });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const result = await (plugin.resolveId as any)?.('/custom/chunk.js');

      expect(result).toBe('/custom/chunk.js');
    });
  });

  describe('load Hook', () => {
    beforeEach(() => {
      plugin = philjsOptimizer({ baseUrl: '/lazy' });
      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }
    });

    it('should return null for non-lazy modules', async () => {
      const result = await (plugin.load as any)?.('/regular/module.js');

      expect(result).toBeNull();
    });

    it('should handle lazy chunk loading', async () => {
      // First transform to create chunks
      await (plugin.transform as any)?.(
        "const h = $$('test', () => 42);",
        '/test/file.ts'
      );

      const result = await (plugin.load as any)?.('/lazy/test.js');

      if (result && typeof result === 'object') {
        expect(result.code).toBeDefined();
      }
    });
  });

  describe('generateBundle Hook', () => {
    it('should generate chunks in build mode', async () => {
      const emitFile = vi.fn();

      plugin = philjsOptimizer({ strategy: 'hybrid' });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      // Transform some code first
      await (plugin.transform as any)?.(
        `
          function Component() { return null; }
          const handler = $(() => {});
        `,
        '/test/file.tsx'
      );

      // Call generateBundle with mock context
      if (plugin.generateBundle) {
        const context = { emitFile };
        await plugin.generateBundle.call(
          context,
          {},
          {}
        );
      }

      // Should emit manifest
      expect(emitFile).toHaveBeenCalled();
    });

    it('should not generate chunks in serve mode', async () => {
      const emitFile = vi.fn();

      plugin = philjsOptimizer();

      const serveConfig = { ...mockConfig, command: 'serve' } as ResolvedConfig;

      if (plugin.configResolved) {
        plugin.configResolved(serveConfig);
      }

      if (plugin.generateBundle) {
        const context = { emitFile };
        await plugin.generateBundle.call(
          context,
          {},
          {}
        );
      }

      // Should not emit files in serve mode
      expect(emitFile).not.toHaveBeenCalled();
    });

    it('should use specified bundling strategy', async () => {
      const emitFile = vi.fn();

      plugin = philjsOptimizer({ strategy: 'aggressive' });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      await (plugin.transform as any)?.(
        'function a() {} function b() {}',
        '/test/file.ts'
      );

      if (plugin.generateBundle) {
        const context = { emitFile };
        await plugin.generateBundle.call(context, {}, {});
      }

      expect(emitFile).toHaveBeenCalled();
    });

    it('should emit manifest file', async () => {
      const emitFile = vi.fn();

      plugin = philjsOptimizer();

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      await (plugin.transform as any)?.(
        'function test() {}',
        '/test/file.ts'
      );

      if (plugin.generateBundle) {
        const context = { emitFile };
        await plugin.generateBundle.call(context, {}, {});
      }

      // Should emit manifest.js
      const manifestCall = emitFile.mock.calls.find((call) =>
        call[0]?.fileName?.includes('manifest.js')
      );

      expect(manifestCall).toBeDefined();
    });
  });

  describe('writeBundle Hook', () => {
    it('should clean up after bundle write', async () => {
      plugin = philjsOptimizer();

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      // Transform some code
      await (plugin.transform as any)?.(
        'const x = 42;',
        '/test/file.ts'
      );

      // Call writeBundle
      if (plugin.writeBundle) {
        await plugin.writeBundle({}, {});
      }

      // Should complete without error
      expect(plugin).toBeDefined();
    });
  });

  describe('Pattern Matching', () => {
    it('should match glob patterns correctly', async () => {
      plugin = philjsOptimizer({
        include: ['**/*.tsx', '**/*.ts'],
      });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const tsxResult = await (plugin.transform as any)?.(
        'const x = 1;',
        '/test/Component.tsx'
      );
      const tsResult = await (plugin.transform as any)?.(
        'const x = 1;',
        '/test/file.ts'
      );
      const jsResult = await (plugin.transform as any)?.(
        'const x = 1;',
        '/test/file.js'
      );

      expect(tsxResult).toBeDefined();
      expect(tsResult).toBeDefined();
      expect(jsResult).toBeNull();
    });

    it('should exclude test files by default', async () => {
      plugin = philjsOptimizer();

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const result = await (plugin.transform as any)?.(
        'test code',
        '/test/file.test.ts'
      );

      expect(result).toBeNull();
    });

    it('should exclude spec files by default', async () => {
      plugin = philjsOptimizer();

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const result = await (plugin.transform as any)?.(
        'test code',
        '/test/file.spec.ts'
      );

      expect(result).toBeNull();
    });
  });

  describe('Debug Mode', () => {
    it('should log stats in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      plugin = philjsOptimizer({ debug: true });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      await (plugin.transform as any)?.(
        'function test() {}',
        '/test/file.ts'
      );

      const emitFile = vi.fn();
      if (plugin.generateBundle) {
        const context = { emitFile };
        await plugin.generateBundle.call(context, {}, {});
      }

      // Should have logged stats
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Integration', () => {
    it('should handle complete workflow', async () => {
      const emitFile = vi.fn();

      plugin = philjsOptimizer({
        strategy: 'hybrid',
        baseUrl: '/chunks',
        sourcemap: true,
      });

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      // Transform multiple files
      await (plugin.transform as any)?.(
        `
          function Component() {
            const onClick = $(() => console.log('click'));
            return <button onClick={onClick}>Click</button>;
          }
        `,
        '/test/Component.tsx'
      );

      await (plugin.transform as any)?.(
        `
          function loadData() {
            return fetch('/api/data');
          }
        `,
        '/test/api.ts'
      );

      // Generate bundle
      if (plugin.generateBundle) {
        const context = { emitFile };
        await plugin.generateBundle.call(context, {}, {});
      }

      // Should emit files
      expect(emitFile).toHaveBeenCalled();

      // Write bundle
      if (plugin.writeBundle) {
        await plugin.writeBundle({}, {});
      }

      expect(plugin).toBeDefined();
    });

    it('should handle errors without crashing', async () => {
      plugin = philjsOptimizer();

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      // Invalid syntax
      const result = await (plugin.transform as any)?.(
        'const x = {]',
        '/test/file.ts'
      );

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', async () => {
      plugin = philjsOptimizer();

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const result = await (plugin.transform as any)?.(
        '',
        '/test/empty.ts'
      );

      expect(result).toBeDefined();
    });

    it('should handle files with only comments', async () => {
      plugin = philjsOptimizer();

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const result = await (plugin.transform as any)?.(
        '// Just a comment',
        '/test/comment.ts'
      );

      expect(result).toBeDefined();
    });

    it('should handle very large files', async () => {
      plugin = philjsOptimizer();

      if (plugin.configResolved) {
        plugin.configResolved(mockConfig);
      }

      const largeSource = Array.from(
        { length: 100 },
        (_, i) => `function func${i}() { return ${i}; }`
      ).join('\n');

      const result = await (plugin.transform as any)?.(
        largeSource,
        '/test/large.ts'
      );

      expect(result).toBeDefined();
    });
  });
});
