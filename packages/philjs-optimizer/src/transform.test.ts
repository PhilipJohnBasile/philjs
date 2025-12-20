import { describe, it, expect } from 'vitest';
import {
  transform,
  extractLazyChunks,
  generateLazyImports,
  injectHandlerRegistrations,
  createSymbolLoader,
  generateManifest,
} from './transform.js';
import type { OptimizerOptions } from './types.js';

describe('Transform', () => {
  const defaultOptions: OptimizerOptions = {
    rootDir: '/test',
    sourcemap: false,
  };

  describe('transform', () => {
    it('should transform $() calls to $$() calls', () => {
      const source = `
        const handler = $(() => {
          console.log('clicked');
        });
      `;

      const result = transform(source, '/test/file.ts', defaultOptions);

      expect(result.code).toContain('$$');
      expect(result.code).toContain('philjs-core/lazy-handlers');
    });

    it('should preserve non-lazy code', () => {
      const source = `
        function regularFunction() {
          return 42;
        }
      `;

      const result = transform(source, '/test/file.ts', defaultOptions);

      expect(result.code).toContain('regularFunction');
      expect(result.code).toContain('return 42');
    });

    it('should extract symbols during transformation', () => {
      const source = `
        function Component() {
          return <div>Hello</div>;
        }
      `;

      const result = transform(source, '/test/file.tsx', defaultOptions);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].name).toBe('Component');
    });

    it('should collect import dependencies', () => {
      const source = `
        import { useState } from 'react';
        import axios from 'axios';

        function Component() {
          return null;
        }
      `;

      const result = transform(source, '/test/file.ts', defaultOptions);

      expect(result.dependencies).toContain('react');
      expect(result.dependencies).toContain('axios');
    });

    it('should add import for $$ only once', () => {
      const source = `
        const handler1 = $(() => {});
        const handler2 = $(() => {});
      `;

      const result = transform(source, '/test/file.ts', defaultOptions);

      const importCount = (result.code.match(/import.*\$\$.*from.*philjs-core\/lazy-handlers/g) || []).length;
      expect(importCount).toBe(1);
    });

    it('should not add import if $$ is not used', () => {
      const source = `
        function regular() {
          return 42;
        }
      `;

      const result = transform(source, '/test/file.ts', defaultOptions);

      expect(result.code).not.toContain('philjs-core/lazy-handlers');
    });

    it('should generate source maps when enabled', () => {
      const source = 'const x = 42;';

      const result = transform(source, '/test/file.ts', {
        ...defaultOptions,
        sourcemap: true,
      });

      expect(result.map).toBeDefined();
    });

    it('should not generate source maps when disabled', () => {
      const source = 'const x = 42;';

      const result = transform(source, '/test/file.ts', {
        ...defaultOptions,
        sourcemap: false,
      });

      expect(result.map).toBeFalsy();
    });

    it('should handle multiple lazy handlers', () => {
      const source = `
        const onClick = $(() => console.log('click'));
        const onHover = $(() => console.log('hover'));
        const onFocus = $(() => console.log('focus'));
      `;

      const result = transform(source, '/test/file.ts', defaultOptions);

      const dollarDollarCount = (result.code.match(/\$\$/g) || []).length;
      expect(dollarDollarCount).toBeGreaterThanOrEqual(3);
    });

    it('should preserve function expressions in $() calls', () => {
      const source = `
        const handler = $(function() {
          return 42;
        });
      `;

      const result = transform(source, '/test/file.ts', defaultOptions);

      expect(result.code).toContain('$$');
      expect(result.code).toContain('function');
    });

    it('should handle TypeScript syntax', () => {
      const source = `
        const handler = $<MouseEvent>((e) => {
          console.log(e.clientX);
        });
      `;

      const result = transform(source, '/test/file.ts', defaultOptions);

      expect(result.code).toBeTruthy();
    });

    it('should handle JSX in lazy handlers', () => {
      const source = `
        const renderHandler = $(() => {
          return <div>Hello</div>;
        });
      `;

      const result = transform(source, '/test/file.tsx', defaultOptions);

      expect(result.code).toContain('$$');
    });
  });

  describe('extractLazyChunks', () => {
    it('should extract chunks from $() calls', () => {
      const source = `
        const handler = $(() => {
          console.log('lazy');
        });
      `;

      const chunks = extractLazyChunks(source, '/test/file.ts');

      expect(chunks.size).toBeGreaterThan(0);
    });

    it('should extract chunks from $$() calls', () => {
      const source = `
        const handler = $$('symbolId', () => {
          console.log('lazy');
        });
      `;

      const chunks = extractLazyChunks(source, '/test/file.ts');

      expect(chunks.size).toBe(1);
      expect(chunks.has('symbolId')).toBe(true);
    });

    it('should generate valid module code for chunks', () => {
      const source = `
        const handler = $$('myHandler', () => 42);
      `;

      const chunks = extractLazyChunks(source, '/test/file.ts');
      const chunkCode = chunks.get('myHandler');

      expect(chunkCode).toContain('export');
      expect(chunkCode).toContain('myHandler');
      expect(chunkCode).toContain('default');
    });

    it('should handle multiple lazy handlers', () => {
      const source = `
        const h1 = $$('handler1', () => 1);
        const h2 = $$('handler2', () => 2);
        const h3 = $$('handler3', () => 3);
      `;

      const chunks = extractLazyChunks(source, '/test/file.ts');

      expect(chunks.size).toBe(3);
      expect(chunks.has('handler1')).toBe(true);
      expect(chunks.has('handler2')).toBe(true);
      expect(chunks.has('handler3')).toBe(true);
    });

    it('should handle complex handler functions', () => {
      const source = `
        const handler = $$('complex', async (data) => {
          const result = await fetch('/api');
          return result.json();
        });
      `;

      const chunks = extractLazyChunks(source, '/test/file.ts');

      expect(chunks.size).toBe(1);
      const chunkCode = chunks.get('complex');
      expect(chunkCode).toContain('async');
      expect(chunkCode).toContain('fetch');
    });

    it('should return empty map for code without lazy handlers', () => {
      const source = `
        function regular() {
          return 42;
        }
      `;

      const chunks = extractLazyChunks(source, '/test/file.ts');

      expect(chunks.size).toBe(0);
    });
  });

  describe('generateLazyImports', () => {
    it('should generate import statements for symbols', () => {
      const symbolIds = ['handler1', 'handler2', 'handler3'];

      const imports = generateLazyImports(symbolIds);

      expect(imports).toContain("import handler1 from '/lazy/handler1.js'");
      expect(imports).toContain("import handler2 from '/lazy/handler2.js'");
      expect(imports).toContain("import handler3 from '/lazy/handler3.js'");
    });

    it('should use custom base URL', () => {
      const symbolIds = ['handler1'];

      const imports = generateLazyImports(symbolIds, '/custom');

      expect(imports).toContain("import handler1 from '/custom/handler1.js'");
    });

    it('should handle empty array', () => {
      const imports = generateLazyImports([]);

      expect(imports).toBe('');
    });

    it('should generate one import per line', () => {
      const symbolIds = ['a', 'b', 'c'];

      const imports = generateLazyImports(symbolIds);
      const lines = imports.split('\n').filter((line) => line.trim());

      expect(lines).toHaveLength(3);
    });
  });

  describe('injectHandlerRegistrations', () => {
    it('should inject handler registrations', () => {
      const source = 'console.log("test");';
      const handlers = new Map([
        ['handler1', '/lazy/handler1.js'],
        ['handler2', '/lazy/handler2.js'],
      ]);

      const result = injectHandlerRegistrations(source, handlers);

      expect(result).toContain('handlerRegistry.register');
      expect(result).toContain('handler1');
      expect(result).toContain('handler2');
    });

    it('should add import for handlerRegistry', () => {
      const source = 'console.log("test");';
      const handlers = new Map([['handler1', '/lazy/handler1.js']]);

      const result = injectHandlerRegistrations(source, handlers);

      expect(result).toContain('import');
      expect(result).toContain('handlerRegistry');
      expect(result).toContain('philjs-core/lazy-handlers');
    });

    it('should not duplicate handlerRegistry import', () => {
      const source = `
        import { handlerRegistry } from 'philjs-core/lazy-handlers';
      `;
      const handlers = new Map([['handler1', '/lazy/handler1.js']]);

      const result = injectHandlerRegistrations(source, handlers);

      const importCount = (result.match(/import.*handlerRegistry/g) || []).length;
      expect(importCount).toBe(1);
    });

    it('should inject registrations after imports', () => {
      const source = `
        import something from 'somewhere';
        console.log("test");
      `;
      const handlers = new Map([['handler1', '/lazy/handler1.js']]);

      const result = injectHandlerRegistrations(source, handlers);

      const importIndex = result.indexOf('import something');
      const registerIndex = result.indexOf('handlerRegistry.register');

      expect(registerIndex).toBeGreaterThan(importIndex);
    });

    it('should handle empty handlers map', () => {
      const source = 'console.log("test");';
      const handlers = new Map();

      const result = injectHandlerRegistrations(source, handlers);

      // Should still add import but no registrations
      expect(result).toContain('handlerRegistry');
    });
  });

  describe('createSymbolLoader', () => {
    it('should create a loader function', () => {
      const loader = createSymbolLoader('mySymbol', '/path/to/module.js');

      expect(loader).toContain('export function');
      expect(loader).toContain('loadmySymbol');
      expect(loader).toContain("import('/path/to/module.js')");
    });

    it('should handle symbol ID in function name', () => {
      const loader = createSymbolLoader('handler_abc123', '/module.js');

      expect(loader).toContain('loadhandler_abc123');
    });

    it('should return the symbol from module', () => {
      const loader = createSymbolLoader('sym', '/mod.js');

      expect(loader).toContain('.then(m => m.sym || m.default)');
    });
  });

  describe('generateManifest', () => {
    it('should generate manifest code', () => {
      const symbols = new Map([
        [
          'symbol1',
          { modulePath: '/lazy/symbol1.js', dependencies: [] },
        ],
        [
          'symbol2',
          { modulePath: '/lazy/symbol2.js', dependencies: ['symbol1'] },
        ],
      ]);

      const manifest = generateManifest(symbols);

      expect(manifest).toContain('export default');
      expect(manifest).toContain('symbols');
      expect(manifest).toContain('chunks');
      expect(manifest).toContain('imports');
    });

    it('should map symbols to module paths', () => {
      const symbols = new Map([
        ['sym1', { modulePath: '/lazy/sym1.js', dependencies: [] }],
      ]);

      const manifest = generateManifest(symbols);

      expect(manifest).toContain('sym1');
      expect(manifest).toContain('/lazy/sym1.js');
    });

    it('should group symbols by chunk', () => {
      const symbols = new Map([
        ['sym1', { modulePath: '/chunk1.js', dependencies: [] }],
        ['sym2', { modulePath: '/chunk1.js', dependencies: [] }],
        ['sym3', { modulePath: '/chunk2.js', dependencies: [] }],
      ]);

      const manifest = generateManifest(symbols);
      const parsed = JSON.parse(
        manifest.replace('export default ', '').replace(/;$/, '')
      );

      expect(parsed.chunks['/chunk1.js']).toHaveLength(2);
      expect(parsed.chunks['/chunk2.js']).toHaveLength(1);
    });

    it('should create import map', () => {
      const symbols = new Map([
        ['sym1', { modulePath: '/lazy/sym1.js', dependencies: [] }],
      ]);

      const manifest = generateManifest(symbols);
      const parsed = JSON.parse(
        manifest.replace('export default ', '').replace(/;$/, '')
      );

      expect(parsed.imports.sym1).toBe('/lazy/sym1.js');
    });

    it('should handle empty symbols map', () => {
      const symbols = new Map();

      const manifest = generateManifest(symbols);
      const parsed = JSON.parse(
        manifest.replace('export default ', '').replace(/;$/, '')
      );

      expect(parsed.symbols).toEqual({});
      expect(parsed.chunks).toEqual({});
      expect(parsed.imports).toEqual({});
    });

    it('should format JSON with indentation', () => {
      const symbols = new Map([
        ['sym', { modulePath: '/mod.js', dependencies: [] }],
      ]);

      const manifest = generateManifest(symbols);

      // Should have line breaks for readability
      expect(manifest.split('\n').length).toBeGreaterThan(3);
    });
  });

  describe('Integration Tests', () => {
    it('should transform and extract chunks in one flow', () => {
      const source = `
        const handler = $(() => {
          console.log('lazy loaded');
        });
      `;

      const transformed = transform(source, '/test/file.ts', defaultOptions);
      const chunks = extractLazyChunks(transformed.code, '/test/file.ts');

      expect(transformed.code).toContain('$$');
      expect(chunks.size).toBeGreaterThan(0);
    });

    it('should handle complex real-world code', () => {
      const source = `
        import { useState } from 'react';

        function Component() {
          const [count, setCount] = useState(0);

          const handleClick = $(() => {
            setCount(count + 1);
          });

          const loadData = async () => {
            return fetch('/api/data');
          };

          return (
            <div>
              <button onClick={handleClick}>
                Count: {count}
              </button>
            </div>
          );
        }
      `;

      const result = transform(source, '/test/Component.tsx', defaultOptions);

      expect(result.code).toBeTruthy();
      expect(result.symbols.length).toBeGreaterThan(0);
      expect(result.dependencies).toContain('react');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid syntax gracefully', () => {
      const source = 'const x = {]';

      expect(() => {
        transform(source, '/test/file.ts', defaultOptions);
      }).toThrow();
    });

    it('should handle empty source code', () => {
      const result = transform('', '/test/file.ts', defaultOptions);

      expect(result.code).toBe('');
      expect(result.symbols).toHaveLength(0);
      expect(result.dependencies).toHaveLength(0);
    });
  });
});
