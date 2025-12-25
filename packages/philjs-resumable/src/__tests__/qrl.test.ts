/**
 * Tests for QRL (Quick Resource Locator) functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createQRL,
  parseQRL,
  isQRL,
  getQRLAttribute,
  prefetchQRL,
  prefetchQRLs,
  qrl,
  inlineQRL,
  $,
  component$,
  event$,
  onClick$,
  onInput$,
  signal$,
  computed$,
  server$,
  browser$,
  useVisibleTask$,
  useTask$,
  configureQRL,
  registerChunk,
  registerChunks,
  clearQRLRegistry,
} from '../qrl.js';

// Clear registry between tests
beforeEach(() => {
  clearQRLRegistry();
});

afterEach(() => {
  clearQRLRegistry();
});

describe('QRL Creation', () => {
  it('should create a QRL with basic options', () => {
    const qrl = createQRL({
      chunk: 'counter.js',
      symbol: 'increment',
    });

    expect(qrl.$chunk$).toBe('counter.js');
    expect(qrl.$symbol$).toBe('increment');
    expect(qrl.$capture$).toEqual([]);
    expect(qrl.$isResolved$).toBe(false);
  });

  it('should create a QRL with captures', () => {
    const qrl = createQRL({
      chunk: 'handler.js',
      symbol: 'onClick',
      capture: [1, 'test', true],
      captureNames: ['count', 'name', 'enabled'],
    });

    expect(qrl.$capture$).toEqual([1, 'test', true]);
    expect(qrl.$captureNames$).toEqual(['count', 'name', 'enabled']);
  });

  it('should create a QRL with pre-resolved value', () => {
    const fn = () => 'hello';
    const qrl = createQRL({
      chunk: '__inline__',
      symbol: 'greet',
      resolved: fn,
    });

    expect(qrl.$isResolved$).toBe(true);
    expect(qrl.$resolved$).toBe(fn);
  });

  it('should generate unique IDs for each QRL', () => {
    const qrl1 = createQRL({ chunk: 'test.js', symbol: 'fn1' });
    const qrl2 = createQRL({ chunk: 'test.js', symbol: 'fn1' });

    expect(qrl1.$id$).not.toBe(qrl2.$id$);
  });
});

describe('QRL Serialization', () => {
  it('should serialize QRL without captures', () => {
    const qrl = createQRL({
      chunk: 'counter.js',
      symbol: 'increment',
    });

    const serialized = qrl.serialize();
    expect(serialized).toBe('counter.js#increment');
  });

  it('should serialize QRL with captures', () => {
    const qrl = createQRL({
      chunk: 'handler.js',
      symbol: 'onClick',
      capture: [42, 'test'],
    });

    const serialized = qrl.serialize();
    expect(serialized).toMatch(/handler\.js#onClick\[42,"test"\]/);
  });

  it('should serialize QRL with complex captures', () => {
    const qrl = createQRL({
      chunk: 'complex.js',
      symbol: 'handler',
      capture: [null, undefined, true, false, { key: 'value' }],
    });

    const serialized = qrl.serialize();
    expect(serialized).toContain('complex.js#handler');
    expect(serialized).toContain('null');
  });
});

describe('QRL Parsing', () => {
  it('should parse QRL without captures', () => {
    const qrl = parseQRL('counter.js#increment');

    expect(qrl.$chunk$).toBe('counter.js');
    expect(qrl.$symbol$).toBe('increment');
    expect(qrl.$capture$).toEqual([]);
  });

  it('should parse QRL with captures', () => {
    const qrl = parseQRL('handler.js#onClick[42,"test",true]');

    expect(qrl.$chunk$).toBe('handler.js');
    expect(qrl.$symbol$).toBe('onClick');
    expect(qrl.$capture$).toEqual([42, 'test', true]);
  });

  it('should parse QRL with special values', () => {
    const qrl = parseQRL('handler.js#fn[null,undefined,true,false]');

    expect(qrl.$capture$).toEqual([null, undefined, true, false]);
  });

  it('should throw on invalid QRL format', () => {
    expect(() => parseQRL('invalid-qrl')).toThrow('Invalid QRL format');
  });
});

describe('QRL Resolution', () => {
  beforeEach(() => {
    // Reset QRL configuration
    configureQRL({ basePath: '', resolver: undefined });
  });

  it('should resolve inline QRL', async () => {
    const fn = () => 'result';
    const qrl = createQRL({
      chunk: '__inline__',
      symbol: 'fn',
      resolved: fn,
    });

    const resolved = await qrl.resolve();
    expect(resolved).toBe(fn);
    expect(qrl.$isResolved$).toBe(true);
  });

  it('should cache resolved value', async () => {
    const fn = () => 'cached';
    const qrl = createQRL({
      chunk: '__inline__',
      symbol: 'fn',
      resolved: fn,
    });

    const first = await qrl.resolve();
    const second = await qrl.resolve();

    expect(first).toBe(second);
    expect(qrl.$isResolved$).toBe(true);
  });

  it('should resolve with registered chunk', async () => {
    const module = { increment: (n: number) => n + 1 };
    registerChunk('counter.js', async () => module);

    const qrl = createQRL({
      chunk: 'counter.js',
      symbol: 'increment',
    });

    const resolved = await qrl.resolve();
    expect(resolved).toBe(module.increment);
    expect((resolved as Function)(5)).toBe(6);
  });

  it('should resolve with custom resolver', async () => {
    const module = { handler: () => 'custom' };
    configureQRL({
      resolver: async (chunk) => {
        if (chunk === 'custom.js') return module;
        throw new Error('Not found');
      },
    });

    const qrl = createQRL({
      chunk: 'custom.js',
      symbol: 'handler',
    });

    const resolved = await qrl.resolve();
    expect(resolved).toBe(module.handler);
  });

  it('should throw if symbol not found in chunk', async () => {
    registerChunk('empty.js', async () => ({}));

    const qrl = createQRL({
      chunk: 'empty.js',
      symbol: 'missing',
    });

    await expect(qrl.resolve()).rejects.toThrow(
      'QRL symbol "missing" not found in chunk "empty.js"'
    );
  });

  it('should bind captures to function', async () => {
    const module = {
      add: (captures: { a: number; b: number }) => captures.a + captures.b,
    };
    registerChunk('math.js', async () => module);

    const qrl = createQRL({
      chunk: 'math.js',
      symbol: 'add',
      capture: [5, 10],
      captureNames: ['a', 'b'],
    });

    const resolved = (await qrl.resolve()) as Function;
    const result = resolved();

    expect(result).toBe(15);
  });
});

describe('QRL Invocation', () => {
  it('should invoke resolved function', async () => {
    const fn = vi.fn((x: number) => x * 2);
    const qrl = createQRL({
      chunk: '__inline__',
      symbol: 'double',
      resolved: fn,
    });

    const result = await qrl.invoke(5);

    expect(fn).toHaveBeenCalledWith(5);
    expect(result).toBe(10);
  });

  it('should throw if QRL is not a function', async () => {
    const qrl = createQRL({
      chunk: '__inline__',
      symbol: 'value',
      resolved: 42,
    });

    await expect(qrl.invoke()).rejects.toThrow('is not a function');
  });
});

describe('QRL Utilities', () => {
  it('should identify QRL objects', () => {
    const qrl = createQRL({ chunk: 'test.js', symbol: 'fn' });

    expect(isQRL(qrl)).toBe(true);
    expect(isQRL({})).toBe(false);
    expect(isQRL(null)).toBe(false);
    expect(isQRL(() => {})).toBe(false);
  });

  it('should get QRL attribute', () => {
    const qrl = createQRL({
      chunk: 'handler.js',
      symbol: 'onClick',
    });

    const attr = getQRLAttribute(qrl);
    expect(attr).toBe('handler.js#onClick');
  });

  it('should create QRL with qrl helper', () => {
    const result = qrl<() => string>('greet.js', 'hello', ['World']);

    expect(result.$chunk$).toBe('greet.js');
    expect(result.$symbol$).toBe('hello');
    expect(result.$capture$).toEqual(['World']);
  });

  it('should create inline QRL', () => {
    const value = { data: 'test' };
    const result = inlineQRL(value);

    expect(result.$chunk$).toBe('__inline__');
    expect(result.$isResolved$).toBe(true);
    expect(result.$resolved$).toBe(value);
  });
});

describe('QRL Factory Functions', () => {
  it('should create QRL with $ operator', () => {
    const fn = () => console.log('clicked');
    const qrl = $(fn);

    expect(qrl.$chunk$).toBe('__inline__');
    expect(qrl.$resolved$).toBe(fn);
  });

  it('should create QRL with captures using $', () => {
    const fn = () => {};
    const count = 5;
    const qrl = $(fn, [count], ['count']);

    expect(qrl.$capture$).toEqual([count]);
    expect(qrl.$captureNames$).toEqual(['count']);
  });

  it('should create component QRL', () => {
    const Component = (props: { name: string }) => props.name;
    const qrl = component$(Component);

    expect(qrl.$symbol$).toBe('Component');
    expect(qrl.$resolved$).toBe(Component);
  });

  it('should create event handler QRL', () => {
    const handler = (e: MouseEvent) => e.preventDefault();
    const qrl = event$(handler);

    expect(qrl.$resolved$).toBe(handler);
  });
});

describe('Event Handler Helpers', () => {
  it('should create onClick$ handler', () => {
    const handler = (e: MouseEvent) => {};
    const qrl = onClick$(handler);

    expect(qrl.$resolved$).toBe(handler);
  });

  it('should create onInput$ handler', () => {
    const handler = (e: InputEvent) => {};
    const qrl = onInput$(handler);

    expect(qrl.$resolved$).toBe(handler);
  });
});

describe('Signal Integration', () => {
  it('should create signal$ QRL', () => {
    const qrl = signal$(42);

    expect(qrl.$chunk$).toBe('philjs-core');
    expect(qrl.$symbol$).toBe('signal');
    expect(qrl.$capture$).toEqual([42]);
  });

  it('should create computed$ QRL', () => {
    const computation = () => 10 + 20;
    const qrl = computed$(computation);

    expect(qrl.$chunk$).toBe('philjs-core');
    expect(qrl.$symbol$).toBe('memo');
    expect(qrl.$capture$).toContain(computation);
  });
});

describe('Task QRLs', () => {
  it('should create server$ QRL', () => {
    const serverFn = async () => 'server-data';
    const qrl = server$(serverFn);

    expect(qrl.$chunk$).toBe('__server__');
    expect(qrl.$resolved$).toBe(serverFn);
  });

  it('should create browser$ QRL for client', () => {
    const browserFn = () => console.log('client');
    const qrl = browser$(browserFn);

    expect(qrl.$chunk$).toBe('__browser__');
  });

  it('should create useVisibleTask$ QRL', () => {
    const task = async () => {};
    const qrl = useVisibleTask$(task);

    expect(qrl.$chunk$).toBe('__task__');
    expect(qrl.$symbol$).toBe('visibleTask');
  });

  it('should create useTask$ QRL', () => {
    const task = async () => {};
    const qrl = useTask$(task);

    expect(qrl.$chunk$).toBe('__task__');
    expect(qrl.$symbol$).toBe('task');
  });
});

describe('QRL Configuration', () => {
  afterEach(() => {
    configureQRL({ basePath: '', resolver: undefined });
  });

  it('should configure base path', async () => {
    configureQRL({ basePath: '/dist/chunks' });

    const module = { fn: () => 'test' };
    registerChunk('test.js', async () => module);

    const qrl = createQRL({ chunk: 'test.js', symbol: 'fn' });
    const resolved = await qrl.resolve();

    expect(resolved).toBe(module.fn);
  });

  it('should register multiple chunks', async () => {
    const chunks = {
      'chunk1.js': async () => ({ fn1: () => 1 }),
      'chunk2.js': async () => ({ fn2: () => 2 }),
    };

    registerChunks(chunks);

    const qrl1 = createQRL({ chunk: 'chunk1.js', symbol: 'fn1' });
    const qrl2 = createQRL({ chunk: 'chunk2.js', symbol: 'fn2' });

    const result1 = await qrl1.resolve();
    const result2 = await qrl2.resolve();

    expect((result1 as Function)()).toBe(1);
    expect((result2 as Function)()).toBe(2);
  });
});

describe('QRL Prefetching', () => {
  it('should skip prefetch for inline QRL', async () => {
    const qrl = createQRL({
      chunk: '__inline__',
      symbol: 'fn',
      resolved: () => {},
    });

    await expect(prefetchQRL(qrl)).resolves.toBeUndefined();
  });

  it('should skip prefetch for already resolved QRL', async () => {
    const qrl = createQRL({
      chunk: 'test.js',
      symbol: 'fn',
      resolved: () => {},
    });

    await expect(prefetchQRL(qrl)).resolves.toBeUndefined();
  });

  it('should prefetch multiple QRLs', async () => {
    const module = { fn1: () => 1, fn2: () => 2 };
    registerChunk('test.js', async () => module);

    const qrls = [
      createQRL({ chunk: 'test.js', symbol: 'fn1' }),
      createQRL({ chunk: 'test.js', symbol: 'fn2' }),
    ];

    await expect(prefetchQRLs(qrls)).resolves.toBeUndefined();
  });
});

describe('QRL Round-trip', () => {
  it('should serialize and parse QRL correctly', () => {
    const original = createQRL({
      chunk: 'component.js',
      symbol: 'MyComponent',
      capture: [1, 'test', true, null],
    });

    const serialized = original.serialize();
    const parsed = parseQRL(serialized);

    expect(parsed.$chunk$).toBe(original.$chunk$);
    expect(parsed.$symbol$).toBe(original.$symbol$);
    expect(parsed.$capture$).toEqual(original.$capture$);
  });


  it('should handle complex serialization round-trip', async () => {
    // Note: captureNames are not included in serialization, so after parse
    // captures are passed as an array to the function
    const module = {
      handler: (captures: unknown[]) => `${captures[1]}: ${captures[0]}`,
    };
    registerChunk('handler-roundtrip.js', async () => module);

    const qrl = createQRL({
      chunk: 'handler-roundtrip.js',
      symbol: 'handler',
      capture: [42, 'Answer'],
    });

    const serialized = qrl.serialize();
    const parsed = parseQRL(serialized);
    registerChunk('handler-roundtrip.js', async () => module);

    const resolved = (await parsed.resolve()) as Function;
    const result = resolved();

    expect(result).toBe('Answer: 42');
  });
});
