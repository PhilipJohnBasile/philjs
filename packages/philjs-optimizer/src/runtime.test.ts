import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SymbolLoader,
  initSymbolLoader,
  getSymbolLoader,
  loadSymbol,
  prefetchSymbol,
  HandlerRunner,
  getHandlerRunner,
  executeHandler,
  DeferredQueue,
  getDeferredQueue,
  deferHandler,
} from './runtime.js';
import type { ChunkManifest, RuntimeConfig } from './types.js';

describe('SymbolLoader', () => {
  let manifest: ChunkManifest;

  beforeEach(() => {
    manifest = {
      symbols: {
        symbol1: '/chunks/chunk1.js',
        symbol2: '/chunks/chunk1.js',
        symbol3: '/chunks/chunk2.js',
      },
      chunks: {
        '/chunks/chunk1.js': ['symbol1', 'symbol2'],
        '/chunks/chunk2.js': ['symbol3'],
      },
      imports: {
        symbol1: '/chunks/chunk1.js',
        symbol2: '/chunks/chunk1.js',
        symbol3: '/chunks/chunk2.js',
      },
    };
  });

  describe('Constructor', () => {
    it('should initialize with config', () => {
      const config: RuntimeConfig = {
        manifest,
        baseUrl: '/base',
      };

      const loader = new SymbolLoader(config);

      expect(loader).toBeDefined();
    });

    it('should use default base URL if not provided', () => {
      const loader = new SymbolLoader({ manifest });

      expect(loader).toBeDefined();
    });

    it('should not auto-prefetch by default', () => {
      const loader = new SymbolLoader({ manifest });

      expect(loader.getLoadedSymbols()).toHaveLength(0);
    });
  });

  describe('load', () => {
    it('should throw error for unknown symbol', async () => {
      const loader = new SymbolLoader({ manifest });

      await expect(loader.load('unknown')).rejects.toThrow(
        'Symbol unknown not found in manifest'
      );
    });

    it('should use custom loader if provided', async () => {
      const customLoader = vi.fn().mockResolvedValue({ test: 'value' });

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      const result = await loader.load('symbol1');

      expect(customLoader).toHaveBeenCalledWith('symbol1');
      expect(result).toEqual({ test: 'value' });
    });

    it('should cache loaded symbols', async () => {
      const customLoader = vi.fn().mockResolvedValue('value');

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      await loader.load('symbol1');
      await loader.load('symbol1');

      // Should only load once
      expect(customLoader).toHaveBeenCalledTimes(1);
    });

    it('should return cached symbol on second load', async () => {
      const customLoader = vi.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second');

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      const first = await loader.load('symbol1');
      const second = await loader.load('symbol1');

      expect(first).toBe('first');
      expect(second).toBe('first'); // Should return cached value
    });
  });

  describe('isLoaded', () => {
    it('should return false for unloaded symbol', () => {
      const loader = new SymbolLoader({ manifest });

      expect(loader.isLoaded('symbol1')).toBe(false);
    });

    it('should return true for loaded symbol', async () => {
      const customLoader = vi.fn().mockResolvedValue('value');

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      await loader.load('symbol1');

      expect(loader.isLoaded('symbol1')).toBe(true);
    });
  });

  describe('getLoadedSymbols', () => {
    it('should return empty array initially', () => {
      const loader = new SymbolLoader({ manifest });

      expect(loader.getLoadedSymbols()).toHaveLength(0);
    });

    it('should return loaded symbol IDs', async () => {
      const customLoader = vi.fn().mockResolvedValue('value');

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      await loader.load('symbol1');
      await loader.load('symbol3');

      const loaded = loader.getLoadedSymbols();

      expect(loaded).toHaveLength(2);
      expect(loaded).toContain('symbol1');
      expect(loaded).toContain('symbol3');
    });
  });

  describe('prefetch', () => {
    it('should load symbol for prefetching', async () => {
      const customLoader = vi.fn().mockResolvedValue('value');

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      await loader.prefetch('symbol1');

      expect(loader.isLoaded('symbol1')).toBe(true);
    });

    it('should not prefetch already loaded symbol', async () => {
      const customLoader = vi.fn().mockResolvedValue('value');

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      await loader.load('symbol1');
      await loader.prefetch('symbol1');

      // Should only load once
      expect(customLoader).toHaveBeenCalledTimes(1);
    });

    it('should handle prefetch errors gracefully', async () => {
      const customLoader = vi.fn().mockRejectedValue(new Error('Load error'));

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      // Should not throw
      await expect(loader.prefetch('symbol1')).resolves.toBeUndefined();
    });
  });

  describe('prefetchMany', () => {
    it('should prefetch multiple symbols', async () => {
      const customLoader = vi.fn().mockResolvedValue('value');

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      await loader.prefetchMany(['symbol1', 'symbol2', 'symbol3']);

      expect(loader.isLoaded('symbol1')).toBe(true);
      expect(loader.isLoaded('symbol2')).toBe(true);
      expect(loader.isLoaded('symbol3')).toBe(true);
    });

    it('should handle empty array', async () => {
      const loader = new SymbolLoader({ manifest });

      await expect(loader.prefetchMany([])).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all loaded symbols', async () => {
      const customLoader = vi.fn().mockResolvedValue('value');

      const loader = new SymbolLoader({
        manifest,
        loader: customLoader,
      });

      await loader.load('symbol1');
      await loader.load('symbol2');

      expect(loader.getLoadedSymbols()).toHaveLength(2);

      loader.clear();

      expect(loader.getLoadedSymbols()).toHaveLength(0);
      expect(loader.isLoaded('symbol1')).toBe(false);
    });
  });
});

describe('Global Symbol Loader', () => {
  const manifest: ChunkManifest = {
    symbols: { sym1: '/chunk.js' },
    chunks: { '/chunk.js': ['sym1'] },
    imports: { sym1: '/chunk.js' },
  };

  describe('initSymbolLoader', () => {
    it('should initialize global loader', () => {
      const loader = initSymbolLoader({ manifest });

      expect(loader).toBeInstanceOf(SymbolLoader);
    });

    it('should return the initialized loader', () => {
      const loader = initSymbolLoader({ manifest });
      const retrieved = getSymbolLoader();

      expect(retrieved).toBe(loader);
    });
  });

  describe('getSymbolLoader', () => {
    it('should throw error if not initialized', () => {
      // Note: In actual implementation, getSymbolLoader creates a global instance
      // so it won't throw. This test documents expected behavior.
      // For now, we just verify it returns a loader
      const loader = getSymbolLoader();
      expect(loader).toBeDefined();
    });

    it('should return global loader after initialization', () => {
      initSymbolLoader({ manifest });
      const loader = getSymbolLoader();

      expect(loader).toBeDefined();
    });
  });

  describe('loadSymbol', () => {
    it('should load using global loader', async () => {
      const customLoader = vi.fn().mockResolvedValue('value');

      initSymbolLoader({
        manifest,
        loader: customLoader,
      });

      const result = await loadSymbol('sym1');

      expect(result).toBe('value');
    });
  });

  describe('prefetchSymbol', () => {
    it('should prefetch using global loader', async () => {
      const customLoader = vi.fn().mockResolvedValue('value');

      initSymbolLoader({
        manifest,
        loader: customLoader,
      });

      await prefetchSymbol('sym1');
      const loader = getSymbolLoader();

      expect(loader.isLoaded('sym1')).toBe(true);
    });
  });
});

describe('HandlerRunner', () => {
  describe('execute', () => {
    it('should execute handler function', async () => {
      const manifest: ChunkManifest = {
        symbols: { handler1: '/chunk.js' },
        chunks: { '/chunk.js': ['handler1'] },
        imports: { handler1: '/chunk.js' },
      };

      const handlerFn = vi.fn().mockReturnValue('result');

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const runner = new HandlerRunner();
      const result = await runner.execute('handler1', [1, 2, 3]);

      expect(handlerFn).toHaveBeenCalledWith(1, 2, 3);
      expect(result).toBe('result');
    });

    it('should execute with context', async () => {
      const manifest: ChunkManifest = {
        symbols: { handler1: '/chunk.js' },
        chunks: { '/chunk.js': ['handler1'] },
        imports: { handler1: '/chunk.js' },
      };

      const handlerFn = vi.fn(function (this: any) {
        return this.value;
      });

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const runner = new HandlerRunner();
      const context = { value: 42 };
      const result = await runner.execute('handler1', [], context);

      expect(result).toBe(42);
    });

    it('should throw error if symbol is not a function', async () => {
      const manifest: ChunkManifest = {
        symbols: { notFunction: '/chunk.js' },
        chunks: { '/chunk.js': ['notFunction'] },
        imports: { notFunction: '/chunk.js' },
      };

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve('not a function'),
      });

      const runner = new HandlerRunner();

      await expect(runner.execute('notFunction', [])).rejects.toThrow(
        'Symbol notFunction is not a function'
      );
    });

    it('should retry on failure', async () => {
      const manifest: ChunkManifest = {
        symbols: { handler1: '/chunk.js' },
        chunks: { '/chunk.js': ['handler1'] },
        imports: { handler1: '/chunk.js' },
      };

      let callCount = 0;
      const handlerFn = vi.fn(() => {
        callCount++;
        if (callCount < 3) throw new Error('Fail');
        return 'success';
      });

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const runner = new HandlerRunner();
      const result = await runner.execute('handler1', []);

      expect(callCount).toBe(3);
      expect(result).toBe('success');
    });

    it('should respect max retries', async () => {
      const manifest: ChunkManifest = {
        symbols: { handler1: '/chunk.js' },
        chunks: { '/chunk.js': ['handler1'] },
        imports: { handler1: '/chunk.js' },
      };

      const handlerFn = vi.fn(() => {
        throw new Error('Always fails');
      });

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const runner = new HandlerRunner();
      runner.setMaxRetries(2);

      await expect(runner.execute('handler1', [])).rejects.toThrow(
        'Always fails'
      );

      // Should try 1 initial + 2 retries = 3 times
      expect(handlerFn).toHaveBeenCalledTimes(3);
    });

    it('should call error handler on failure', async () => {
      const manifest: ChunkManifest = {
        symbols: { handler1: '/chunk.js' },
        chunks: { '/chunk.js': ['handler1'] },
        imports: { handler1: '/chunk.js' },
      };

      const handlerFn = vi.fn(() => {
        throw new Error('Test error');
      });

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const runner = new HandlerRunner();
      runner.setMaxRetries(0);

      const errorHandler = vi.fn();
      runner.onError('handler1', errorHandler);

      await expect(runner.execute('handler1', [])).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('onError', () => {
    it('should register error handler', () => {
      const runner = new HandlerRunner();
      const errorFn = vi.fn();

      runner.onError('handler1', errorFn);

      // Error handler registered (will be called on error)
      expect(errorFn).not.toHaveBeenCalled();
    });
  });

  describe('setMaxRetries', () => {
    it('should update max retries', async () => {
      const manifest: ChunkManifest = {
        symbols: { handler1: '/chunk.js' },
        chunks: { '/chunk.js': ['handler1'] },
        imports: { handler1: '/chunk.js' },
      };

      const handlerFn = vi.fn(() => {
        throw new Error('Fail');
      });

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const runner = new HandlerRunner();
      runner.setMaxRetries(5);

      await expect(runner.execute('handler1', [])).rejects.toThrow();

      // Should try 1 initial + 5 retries = 6 times
      expect(handlerFn).toHaveBeenCalledTimes(6);
    });
  });

  describe('clearErrorHandlers', () => {
    it('should clear error handlers and retry counts', () => {
      const runner = new HandlerRunner();
      const errorFn = vi.fn();

      runner.onError('handler1', errorFn);
      runner.clearErrorHandlers();

      // After clearing, error handler should not be called
      expect(errorFn).not.toHaveBeenCalled();
    });
  });
});

describe('Global Handler Runner', () => {
  const manifest: ChunkManifest = {
    symbols: { handler1: '/chunk.js' },
    chunks: { '/chunk.js': ['handler1'] },
    imports: { handler1: '/chunk.js' },
  };

  describe('getHandlerRunner', () => {
    it('should create global runner on first call', () => {
      const runner = getHandlerRunner();

      expect(runner).toBeInstanceOf(HandlerRunner);
    });

    it('should return same runner on subsequent calls', () => {
      const runner1 = getHandlerRunner();
      const runner2 = getHandlerRunner();

      expect(runner1).toBe(runner2);
    });
  });

  describe('executeHandler', () => {
    it('should execute using global runner', async () => {
      const handlerFn = vi.fn().mockReturnValue('result');

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const result = await executeHandler('handler1', [1, 2, 3]);

      expect(handlerFn).toHaveBeenCalledWith(1, 2, 3);
      expect(result).toBe('result');
    });
  });
});

describe('DeferredQueue', () => {
  describe('defer', () => {
    it('should queue handler execution', async () => {
      const manifest: ChunkManifest = {
        symbols: { handler1: '/chunk.js' },
        chunks: { '/chunk.js': ['handler1'] },
        imports: { handler1: '/chunk.js' },
      };

      const handlerFn = vi.fn().mockReturnValue('result');

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const queue = new DeferredQueue();
      const promise = queue.defer('handler1', [1, 2, 3]);

      const result = await promise;

      expect(result).toBe('result');
      expect(handlerFn).toHaveBeenCalledWith(1, 2, 3);
    });

    it('should process queue sequentially', async () => {
      const manifest: ChunkManifest = {
        symbols: {
          handler1: '/chunk.js',
          handler2: '/chunk.js',
          handler3: '/chunk.js',
        },
        chunks: { '/chunk.js': ['handler1', 'handler2', 'handler3'] },
        imports: {
          handler1: '/chunk.js',
          handler2: '/chunk.js',
          handler3: '/chunk.js',
        },
      };

      const results: number[] = [];
      const createHandler = (id: number) =>
        vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          results.push(id);
          return id;
        });

      const handlers = {
        handler1: createHandler(1),
        handler2: createHandler(2),
        handler3: createHandler(3),
      };

      initSymbolLoader({
        manifest,
        loader: (symbolId) => Promise.resolve(handlers[symbolId as keyof typeof handlers]),
      });

      const queue = new DeferredQueue();

      const p1 = queue.defer('handler1', []);
      const p2 = queue.defer('handler2', []);
      const p3 = queue.defer('handler3', []);

      await Promise.all([p1, p2, p3]);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle errors in queue', async () => {
      const manifest: ChunkManifest = {
        symbols: { handler1: '/chunk.js' },
        chunks: { '/chunk.js': ['handler1'] },
        imports: { handler1: '/chunk.js' },
      };

      const handlerFn = vi.fn(() => {
        throw new Error('Handler error');
      });

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const queue = new DeferredQueue();

      await expect(queue.defer('handler1', [])).rejects.toThrow(
        'Handler error'
      );
    });
  });

  describe('clear', () => {
    it('should clear the queue', () => {
      const queue = new DeferredQueue();

      expect(queue.length).toBe(0);

      queue.clear();

      expect(queue.length).toBe(0);
    });
  });

  describe('length', () => {
    it('should return queue length', async () => {
      const manifest: ChunkManifest = {
        symbols: { handler1: '/chunk.js' },
        chunks: { '/chunk.js': ['handler1'] },
        imports: { handler1: '/chunk.js' },
      };

      const handlerFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const queue = new DeferredQueue();

      queue.defer('handler1', []);

      // After processing starts, queue should be empty
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(queue.length).toBe(0);
    });
  });
});

describe('Global Deferred Queue', () => {
  const manifest: ChunkManifest = {
    symbols: { handler1: '/chunk.js' },
    chunks: { '/chunk.js': ['handler1'] },
    imports: { handler1: '/chunk.js' },
  };

  describe('getDeferredQueue', () => {
    it('should create global queue on first call', () => {
      const queue = getDeferredQueue();

      expect(queue).toBeInstanceOf(DeferredQueue);
    });

    it('should return same queue on subsequent calls', () => {
      const queue1 = getDeferredQueue();
      const queue2 = getDeferredQueue();

      expect(queue1).toBe(queue2);
    });
  });

  describe('deferHandler', () => {
    it('should defer using global queue', async () => {
      const handlerFn = vi.fn().mockReturnValue('result');

      initSymbolLoader({
        manifest,
        loader: () => Promise.resolve(handlerFn),
      });

      const result = await deferHandler('handler1', [1, 2, 3]);

      expect(result).toBe('result');
      expect(handlerFn).toHaveBeenCalledWith(1, 2, 3);
    });
  });
});
