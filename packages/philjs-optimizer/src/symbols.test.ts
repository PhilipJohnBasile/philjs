import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractSymbols,
  generateSymbolId,
  SymbolRegistry,
} from './symbols.js';
import type { OptimizerOptions, Symbol, SymbolPattern } from './types.js';

describe('Symbol Extraction', () => {
  const defaultOptions: OptimizerOptions = {
    rootDir: '/test',
  };

  describe('extractSymbols', () => {
    it('should extract function declarations', () => {
      const source = `
        function handleClick() {
          console.log('clicked');
        }
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols).toHaveLength(1);
      expect(symbols[0].name).toBe('handleClick');
      expect(symbols[0].type).toBe('action');
      expect(symbols[0].filePath).toBe('/test/file.ts');
    });

    it('should extract arrow function variables', () => {
      const source = `
        const loadUser = async () => {
          return { name: 'John' };
        };
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols).toHaveLength(1);
      expect(symbols[0].name).toBe('loadUser');
      expect(symbols[0].type).toBe('loader');
    });

    it('should extract component declarations', () => {
      const source = `
        function UserProfile() {
          return <div>Profile</div>;
        }
      `;

      const symbols = extractSymbols(source, '/test/file.tsx', defaultOptions);

      expect(symbols).toHaveLength(1);
      expect(symbols[0].name).toBe('UserProfile');
      expect(symbols[0].type).toBe('component');
    });

    it('should extract lazy handlers with $() wrapper', () => {
      const source = `
        const handler = $(() => {
          console.log('lazy');
        });
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols).toHaveLength(1);
      expect(symbols[0].type).toBe('handler');
      expect(symbols[0].isLazy).toBe(true);
    });

    it('should extract multiple symbols from one file', () => {
      const source = `
        function Component1() {
          return <div>1</div>;
        }

        const loadData = async () => ({ data: [] });

        function handleSubmit() {
          console.log('submit');
        }

        const lazyHandler = $(() => {
          console.log('lazy');
        });
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols).toHaveLength(4);
      expect(symbols.map((s) => s.type)).toEqual([
        'component',
        'loader',
        'action',
        'handler',
      ]);
    });

    it('should extract dependencies from function body', () => {
      const source = `
        function handleClick() {
          doSomething(value);
          anotherFunction();
        }
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].dependencies).toContain('doSomething');
      expect(symbols[0].dependencies).toContain('value');
      expect(symbols[0].dependencies).toContain('anotherFunction');
    });

    it('should not include local variables as dependencies', () => {
      const source = `
        function handleClick() {
          const local = 42;
          return local;
        }
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].dependencies).not.toContain('local');
    });

    it('should generate unique hashes for symbols', () => {
      const source = `
        function func1() {}
        function func2() {}
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].hash).toBeTruthy();
      expect(symbols[1].hash).toBeTruthy();
      expect(symbols[0].hash).not.toBe(symbols[1].hash);
    });

    it('should include start and end positions', () => {
      const source = `
        function test() {
          return 42;
        }
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].start).toBeGreaterThan(0);
      expect(symbols[0].end).toBeGreaterThan(symbols[0].start);
    });
  });

  describe('Symbol Type Inference', () => {
    it('should infer component type from capitalized name', () => {
      const source = 'function UserCard() { return null; }';
      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].type).toBe('component');
    });

    it('should infer loader type from Loader suffix', () => {
      const source = 'function userLoader() { return {}; }';
      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].type).toBe('loader');
    });

    it('should infer loader type from load prefix', () => {
      const source = 'const loadUsers = async () => [];';
      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].type).toBe('loader');
    });

    it('should infer action type from Action suffix', () => {
      const source = 'function submitAction() {}';
      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].type).toBe('action');
    });

    it('should infer action type from handle prefix', () => {
      const source = 'function handleSubmit() {}';
      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].type).toBe('action');
    });

    it('should infer store type from Store suffix', () => {
      const source = 'const userStore = () => { return {}; };';
      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].type).toBe('store');
    });

    it('should infer resource type from Resource suffix', () => {
      const source = 'const dataResource = () => { return {}; };';
      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].type).toBe('resource');
    });

    it('should default to function type', () => {
      const source = 'function doSomething() {}';
      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols[0].type).toBe('function');
    });
  });

  describe('Custom Patterns', () => {
    it('should apply custom extraction patterns', () => {
      const customPattern: SymbolPattern = {
        name: 'custom',
        test: (node: any) => {
          return (
            node.type === 'VariableDeclarator' &&
            node.id?.name?.startsWith('custom')
          );
        },
        extract: (node: any, context) => ({
          id: generateSymbolId(context.filePath, node.id.name, node.start),
          name: node.id.name,
          filePath: context.filePath,
          start: node.start,
          end: node.end,
          type: 'function' as const,
          dependencies: [],
          hash: 'custom-hash',
          isLazy: false,
        }),
      };

      const source = 'const customFunction = () => {};';
      const symbols = extractSymbols(source, '/test/file.ts', {
        ...defaultOptions,
        patterns: [customPattern],
      });

      // Should extract both the regular symbol and custom pattern
      expect(symbols.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty source code', () => {
      const symbols = extractSymbols('', '/test/file.ts', defaultOptions);
      expect(symbols).toHaveLength(0);
    });

    it('should handle source with only comments', () => {
      const source = `
        // This is a comment
        /* Multi-line
           comment */
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);
      expect(symbols).toHaveLength(0);
    });

    it('should handle anonymous functions', () => {
      const source = 'export default function() {}';
      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      // Anonymous functions shouldn't be extracted
      expect(symbols).toHaveLength(0);
    });

    it('should handle nested functions', () => {
      const source = `
        function outer() {
          function inner() {}
          return inner;
        }
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols).toHaveLength(2);
      expect(symbols.map((s) => s.name)).toContain('outer');
      expect(symbols.map((s) => s.name)).toContain('inner');
    });

    it('should handle TypeScript syntax', () => {
      const source = `
        function typedFunction(x: number): string {
          return x.toString();
        }
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols).toHaveLength(1);
      expect(symbols[0].name).toBe('typedFunction');
    });

    it('should handle JSX syntax', () => {
      const source = `
        function Component() {
          return <div>Hello</div>;
        }
      `;

      const symbols = extractSymbols(source, '/test/file.tsx', defaultOptions);

      expect(symbols).toHaveLength(1);
      expect(symbols[0].type).toBe('component');
    });

    it('should handle async functions', () => {
      const source = `
        async function fetchData() {
          return await fetch('/api');
        }
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols).toHaveLength(1);
      expect(symbols[0].name).toBe('fetchData');
    });

    it('should handle generator functions', () => {
      const source = `
        function* generateSequence() {
          yield 1;
          yield 2;
        }
      `;

      const symbols = extractSymbols(source, '/test/file.ts', defaultOptions);

      expect(symbols).toHaveLength(1);
      expect(symbols[0].name).toBe('generateSequence');
    });
  });
});

describe('generateSymbolId', () => {
  it('should generate unique IDs for different symbols', () => {
    const id1 = generateSymbolId('/file.ts', 'func1', 0);
    const id2 = generateSymbolId('/file.ts', 'func2', 0);

    expect(id1).not.toBe(id2);
  });

  it('should generate unique IDs for same name in different files', () => {
    const id1 = generateSymbolId('/file1.ts', 'func', 0);
    const id2 = generateSymbolId('/file2.ts', 'func', 0);

    expect(id1).not.toBe(id2);
  });

  it('should generate unique IDs for same name at different positions', () => {
    const id1 = generateSymbolId('/file.ts', 'func', 0);
    const id2 = generateSymbolId('/file.ts', 'func', 100);

    expect(id1).not.toBe(id2);
  });

  it('should include the symbol name in the ID', () => {
    const id = generateSymbolId('/file.ts', 'myFunction', 0);

    expect(id).toContain('myFunction');
  });

  it('should generate consistent IDs for same inputs', () => {
    const id1 = generateSymbolId('/file.ts', 'func', 42);
    const id2 = generateSymbolId('/file.ts', 'func', 42);

    expect(id1).toBe(id2);
  });

  it('should generate short hash suffix', () => {
    const id = generateSymbolId('/file.ts', 'func', 0);

    // Should have format: name_hash where hash is 8 chars
    const parts = id.split('_');
    expect(parts.length).toBe(2);
    expect(parts[1].length).toBe(8);
  });
});

describe('SymbolRegistry', () => {
  let registry: SymbolRegistry;

  const defaultOptions: OptimizerOptions = {
    rootDir: '/test',
  };

  beforeEach(() => {
    registry = new SymbolRegistry();
  });

  const createSymbol = (
    id: string,
    name: string,
    type: 'function' | 'component' = 'function'
  ): Symbol => ({
    id,
    name,
    filePath: '/test/file.ts',
    start: 0,
    end: 100,
    type,
    dependencies: [],
    hash: 'test-hash',
    isLazy: false,
  });

  describe('add', () => {
    it('should add a symbol to the registry', () => {
      const symbol = createSymbol('test-id', 'testFunc');
      registry.add(symbol);

      expect(registry.has('test-id')).toBe(true);
      expect(registry.get('test-id')).toBe(symbol);
    });

    it('should overwrite existing symbol with same ID', () => {
      const symbol1 = createSymbol('test-id', 'func1');
      const symbol2 = createSymbol('test-id', 'func2');

      registry.add(symbol1);
      registry.add(symbol2);

      expect(registry.get('test-id')).toBe(symbol2);
    });
  });

  describe('get', () => {
    it('should return symbol by ID', () => {
      const symbol = createSymbol('test-id', 'testFunc');
      registry.add(symbol);

      expect(registry.get('test-id')).toBe(symbol);
    });

    it('should return undefined for non-existent ID', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for existing symbol', () => {
      const symbol = createSymbol('test-id', 'testFunc');
      registry.add(symbol);

      expect(registry.has('test-id')).toBe(true);
    });

    it('should return false for non-existent symbol', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all symbols', () => {
      const symbol1 = createSymbol('id1', 'func1');
      const symbol2 = createSymbol('id2', 'func2');

      registry.add(symbol1);
      registry.add(symbol2);

      const all = registry.getAll();

      expect(all).toHaveLength(2);
      expect(all).toContain(symbol1);
      expect(all).toContain(symbol2);
    });

    it('should return empty array when registry is empty', () => {
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('getByType', () => {
    it('should return symbols of specified type', () => {
      const func = createSymbol('id1', 'func', 'function');
      const comp = createSymbol('id2', 'Comp', 'component');

      registry.add(func);
      registry.add(comp);

      const components = registry.getByType('component');

      expect(components).toHaveLength(1);
      expect(components[0]).toBe(comp);
    });

    it('should return empty array when no symbols of type exist', () => {
      const func = createSymbol('id1', 'func', 'function');
      registry.add(func);

      const components = registry.getByType('component');

      expect(components).toHaveLength(0);
    });
  });

  describe('getByFile', () => {
    it('should return symbols from specified file', () => {
      const symbol1: Symbol = {
        ...createSymbol('id1', 'func1'),
        filePath: '/file1.ts',
      };
      const symbol2: Symbol = {
        ...createSymbol('id2', 'func2'),
        filePath: '/file2.ts',
      };
      const symbol3: Symbol = {
        ...createSymbol('id3', 'func3'),
        filePath: '/file1.ts',
      };

      registry.add(symbol1);
      registry.add(symbol2);
      registry.add(symbol3);

      const file1Symbols = registry.getByFile('/file1.ts');

      expect(file1Symbols).toHaveLength(2);
      expect(file1Symbols).toContain(symbol1);
      expect(file1Symbols).toContain(symbol3);
    });

    it('should return empty array for file with no symbols', () => {
      const symbols = registry.getByFile('/non-existent.ts');
      expect(symbols).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should remove all symbols', () => {
      registry.add(createSymbol('id1', 'func1'));
      registry.add(createSymbol('id2', 'func2'));

      expect(registry.getAll()).toHaveLength(2);

      registry.clear();

      expect(registry.getAll()).toHaveLength(0);
      expect(registry.has('id1')).toBe(false);
      expect(registry.has('id2')).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should work with extracted symbols', () => {
      const source = `
        function Component1() { return null; }
        const loadData = async () => ({});
        function handleSubmit() {}
      `;

      const symbols = extractSymbols(source, '/test.ts', defaultOptions);

      symbols.forEach((symbol) => registry.add(symbol));

      expect(registry.getAll()).toHaveLength(3);
      expect(registry.getByType('component')).toHaveLength(1);
      expect(registry.getByType('loader')).toHaveLength(1);
      expect(registry.getByType('action')).toHaveLength(1);
    });
  });
});
