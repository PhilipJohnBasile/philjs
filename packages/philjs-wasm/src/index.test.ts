/**
 * Tests for philjs-wasm
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadWasm,
  unloadWasm,
  isWasmLoaded,
  getWasmModule,
  createWasmComponent,
  useWasm,
  bindRustFunctions,
  createRustSignal,
  createI32Signal,
  createI64Signal,
  createF32Signal,
  createF64Signal,
  createBoolSignal,
  initWasmProvider,
  getWasmContext,
  Ok,
  Err,
  Some,
  None,
  unwrapResult,
  unwrapOption,
  type WasmModule,
  type WasmExports
} from './index.js';

// Mock WebAssembly APIs
const mockMemory = {
  buffer: new ArrayBuffer(65536)
};

const mockExports: WasmExports = {
  memory: mockMemory as WebAssembly.Memory,
  __wbindgen_malloc: vi.fn((size: number) => 0),
  __wbindgen_free: vi.fn(),
  add: vi.fn((a: number, b: number) => a + b),
  multiply: vi.fn((a: number, b: number) => a * b),
  calculate_sum: vi.fn((...args: number[]) => args.reduce((a, b) => a + b, 0)),
  render: vi.fn(() => 8), // Returns pointer
  dispose: vi.fn()
};

const mockInstance: WebAssembly.Instance = {
  exports: mockExports
};

const mockModule = {} as WebAssembly.Module;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock WebAssembly.instantiateStreaming
const mockInstantiateStreaming = vi.fn();
(global as any).WebAssembly = {
  instantiateStreaming: mockInstantiateStreaming,
  compile: vi.fn(),
  instantiate: vi.fn(),
  Instance: class {},
  Module: class {},
  Memory: class {
    buffer = new ArrayBuffer(65536);
  }
};

describe('philjs-wasm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
    });

    mockInstantiateStreaming.mockResolvedValue({
      module: mockModule,
      instance: mockInstance
    });

    // Reset module cache
    unloadWasm('/test.wasm');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadWasm', () => {
    it('should load a WASM module', async () => {
      const module = await loadWasm('/test.wasm');

      expect(module).toBeDefined();
      expect(module.instance).toBeDefined();
      expect(module.module).toBeDefined();
      expect(module.memory).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('should cache loaded modules', async () => {
      const module1 = await loadWasm('/test.wasm');
      const module2 = await loadWasm('/test.wasm');

      expect(module1).toBe(module2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not cache when cache option is false', async () => {
      await loadWasm('/test1.wasm', { cache: false });
      await loadWasm('/test1.wasm', { cache: false });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loadWasm('/notfound.wasm')).rejects.toThrow('Failed to fetch WASM module');
    });

    it('should call init function if specified', async () => {
      const initFn = vi.fn();
      mockExports.myInit = initFn;

      await loadWasm('/test-init.wasm', { initFn: 'myInit' });

      expect(initFn).toHaveBeenCalled();
    });
  });

  describe('unloadWasm', () => {
    it('should remove module from cache', async () => {
      await loadWasm('/test.wasm');
      expect(isWasmLoaded('/test.wasm')).toBe(true);

      unloadWasm('/test.wasm');
      expect(isWasmLoaded('/test.wasm')).toBe(false);
    });
  });

  describe('isWasmLoaded', () => {
    it('should return true for loaded modules', async () => {
      await loadWasm('/test.wasm');
      expect(isWasmLoaded('/test.wasm')).toBe(true);
    });

    it('should return false for unloaded modules', () => {
      expect(isWasmLoaded('/not-loaded.wasm')).toBe(false);
    });
  });

  describe('getWasmModule', () => {
    it('should return loaded module', async () => {
      const loaded = await loadWasm('/test.wasm');
      const retrieved = getWasmModule('/test.wasm');

      expect(retrieved).toBe(loaded);
    });

    it('should return undefined for unloaded modules', () => {
      expect(getWasmModule('/not-loaded.wasm')).toBeUndefined();
    });
  });

  describe('createWasmComponent', () => {
    it('should create a component from WASM module', async () => {
      // Mock render function to return proper format
      const mockRender = vi.fn((ptr: number, len: number) => {
        // Return pointer to result
        const html = '<div>Hello</div>';
        const resultBuffer = new ArrayBuffer(4 + html.length);
        const lenView = new Uint32Array(resultBuffer, 0, 1);
        lenView[0] = html.length;
        const strView = new Uint8Array(resultBuffer, 4);
        for (let i = 0; i < html.length; i++) {
          strView[i] = html.charCodeAt(i);
        }
        // Copy to mock memory
        const offset = 100;
        const memView = new Uint8Array(mockMemory.buffer, offset, resultBuffer.byteLength);
        memView.set(new Uint8Array(resultBuffer));
        return offset;
      });

      mockExports.render = mockRender;

      const component = await createWasmComponent('/test.wasm', {
        renderFn: 'render',
        props: { count: 0 }
      });

      expect(component).toBeDefined();
      expect(component.module).toBeDefined();
      expect(typeof component.render).toBe('function');
      expect(typeof component.update).toBe('function');
      expect(typeof component.dispose).toBe('function');
    });

    it('should call dispose on WASM module', async () => {
      const disposeFn = vi.fn();
      mockExports.dispose = disposeFn;

      const component = await createWasmComponent('/test.wasm');
      component.dispose();

      expect(disposeFn).toHaveBeenCalled();
    });
  });

  describe('useWasm', () => {
    it('should return loading state initially', () => {
      const result = useWasm('/test.wasm');

      expect(result.loading).toBe(true);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it('should provide reload function', () => {
      const result = useWasm('/test.wasm');

      expect(typeof result.reload).toBe('function');
    });
  });

  describe('bindRustFunctions', () => {
    it('should bind exported functions', async () => {
      const module = await loadWasm('/test.wasm');
      const bound = bindRustFunctions(module);

      expect(bound.add).toBeDefined();
      expect(bound.multiply).toBeDefined();
    });

    it('should transform snake_case to camelCase by default', async () => {
      const module = await loadWasm('/test.wasm');
      const bound = bindRustFunctions(module);

      expect(bound.calculateSum).toBeDefined();
    });

    it('should filter functions with include option', async () => {
      const module = await loadWasm('/test.wasm');
      const bound = bindRustFunctions(module, { include: ['add'] });

      expect(bound.add).toBeDefined();
      expect(bound.multiply).toBeUndefined();
    });

    it('should filter functions with exclude option', async () => {
      const module = await loadWasm('/test.wasm');
      const bound = bindRustFunctions(module, { exclude: ['add'] });

      expect(bound.add).toBeUndefined();
      expect(bound.multiply).toBeDefined();
    });

    it('should skip internal wasm-bindgen functions', async () => {
      const module = await loadWasm('/test.wasm');
      const bound = bindRustFunctions(module);

      expect(bound.__wbindgenMalloc).toBeUndefined();
      expect(bound.__wbindgenFree).toBeUndefined();
    });

    it('should call bound functions correctly', async () => {
      const module = await loadWasm('/test.wasm');
      const bound = bindRustFunctions(module);

      const result = bound.add(2, 3);

      expect(mockExports.add).toHaveBeenCalledWith(2, 3);
      expect(result).toBe(5);
    });
  });

  describe('createRustSignal', () => {
    it('should create a signal with initial value', async () => {
      const module = await loadWasm('/test.wasm');

      // Mock malloc to return a valid pointer
      (mockExports.__wbindgen_malloc as any).mockReturnValue(100);

      const signal = createRustSignal({
        module,
        initialValue: 42,
        byteSize: 8
      });

      expect(signal()).toBe(42);
    });

    it('should allow setting new values', async () => {
      const module = await loadWasm('/test.wasm');
      (mockExports.__wbindgen_malloc as any).mockReturnValue(100);

      const signal = createRustSignal({
        module,
        initialValue: 0,
        byteSize: 8
      });

      signal.set(100);
      expect(signal()).toBe(100);
    });

    it('should support updater functions', async () => {
      const module = await loadWasm('/test.wasm');
      (mockExports.__wbindgen_malloc as any).mockReturnValue(100);

      const signal = createRustSignal({
        module,
        initialValue: 10,
        byteSize: 8
      });

      signal.set((prev) => prev + 5);
      expect(signal()).toBe(15);
    });

    it('should support subscriptions', async () => {
      const module = await loadWasm('/test.wasm');
      (mockExports.__wbindgen_malloc as any).mockReturnValue(100);

      const signal = createRustSignal({
        module,
        initialValue: 0,
        byteSize: 8
      });

      const callback = vi.fn();
      signal.subscribe(callback);

      signal.set(42);

      expect(callback).toHaveBeenCalledWith(42);
    });

    it('should provide memory pointer', async () => {
      const module = await loadWasm('/test.wasm');
      (mockExports.__wbindgen_malloc as any).mockReturnValue(100);

      const signal = createRustSignal({
        module,
        initialValue: 0,
        byteSize: 8
      });

      expect(signal.ptr()).toBe(100);
    });
  });

  describe('specialized signal creators', () => {
    beforeEach(() => {
      (mockExports.__wbindgen_malloc as any).mockReturnValue(100);
    });

    it('should create i32 signal', async () => {
      const module = await loadWasm('/test.wasm');
      const signal = createI32Signal(module, 42);

      expect(signal()).toBe(42);
    });

    it('should create i64 signal', async () => {
      const module = await loadWasm('/test.wasm');
      const signal = createI64Signal(module, 42n);

      expect(signal()).toBe(42n);
    });

    it('should create f32 signal', async () => {
      const module = await loadWasm('/test.wasm');
      const signal = createF32Signal(module, 3.14);

      // f32 has limited precision
      expect(signal()).toBeCloseTo(3.14, 5);
    });

    it('should create f64 signal', async () => {
      const module = await loadWasm('/test.wasm');
      const signal = createF64Signal(module, 3.14159265359);

      expect(signal()).toBeCloseTo(3.14159265359, 10);
    });

    it('should create bool signal', async () => {
      const module = await loadWasm('/test.wasm');
      const signal = createBoolSignal(module, true);

      expect(signal()).toBe(true);
    });
  });

  describe('WasmProvider and context', () => {
    it('should initialize provider context', () => {
      const ctx = initWasmProvider();

      expect(ctx).toBeDefined();
      expect(ctx.modules).toBeDefined();
      expect(typeof ctx.loadModule).toBe('function');
      expect(typeof ctx.unloadModule).toBe('function');
      expect(typeof ctx.getModule).toBe('function');
      expect(typeof ctx.isLoaded).toBe('function');
    });

    it('should get the same context after init', () => {
      initWasmProvider();
      const ctx1 = getWasmContext();
      const ctx2 = getWasmContext();

      expect(ctx1).toBe(ctx2);
    });

    it('should load modules through context', async () => {
      const ctx = initWasmProvider();
      const module = await ctx.loadModule('/test.wasm');

      expect(module).toBeDefined();
      expect(ctx.isLoaded('/test.wasm')).toBe(true);
    });

    it('should unload modules through context', async () => {
      const ctx = initWasmProvider();
      await ctx.loadModule('/test.wasm');

      ctx.unloadModule('/test.wasm');

      expect(ctx.isLoaded('/test.wasm')).toBe(false);
    });
  });

  describe('Rust type utilities', () => {
    describe('Result', () => {
      it('should create Ok result', () => {
        const result = Ok(42);

        expect(result.ok).toBe(true);
        expect((result as any).value).toBe(42);
      });

      it('should create Err result', () => {
        const result = Err('error message');

        expect(result.ok).toBe(false);
        expect((result as any).error).toBe('error message');
      });

      it('should unwrap Ok result', () => {
        const result = Ok(42);
        const value = unwrapResult(result);

        expect(value).toBe(42);
      });

      it('should throw on unwrap Err result', () => {
        const result = Err('error');

        expect(() => unwrapResult(result)).toThrow('Unwrap failed: error');
      });
    });

    describe('Option', () => {
      it('should create Some option', () => {
        const option = Some('hello');

        expect(option.some).toBe(true);
        expect((option as any).value).toBe('hello');
      });

      it('should create None option', () => {
        const option = None();

        expect(option.some).toBe(false);
      });

      it('should unwrap Some option', () => {
        const option = Some('hello');
        const value = unwrapOption(option);

        expect(value).toBe('hello');
      });

      it('should throw on unwrap None option', () => {
        const option = None();

        expect(() => unwrapOption(option)).toThrow('Unwrap failed: None');
      });
    });
  });

  describe('memory manager', () => {
    it('should be accessible through context', () => {
      const ctx = initWasmProvider();

      expect(ctx.memory).toBeDefined();
      expect(typeof ctx.memory.alloc).toBe('function');
      expect(typeof ctx.memory.free).toBe('function');
      expect(typeof ctx.memory.copyString).toBe('function');
      expect(typeof ctx.memory.readString).toBe('function');
      expect(typeof ctx.memory.copyTypedArray).toBe('function');
      expect(typeof ctx.memory.readTypedArray).toBe('function');
    });
  });
});

describe('vite-plugin', () => {
  it('should export vite plugin', async () => {
    // Dynamically import to test export
    const { viteWasmPlugin } = await import('./vite-plugin.js');

    expect(viteWasmPlugin).toBeDefined();
    expect(typeof viteWasmPlugin).toBe('function');
  });

  it('should create plugin with default options', async () => {
    const { viteWasmPlugin } = await import('./vite-plugin.js');
    const plugin = viteWasmPlugin();

    expect(plugin.name).toBe('vite-philjs-wasm');
    expect(plugin.enforce).toBe('pre');
  });

  it('should accept custom options', async () => {
    const { viteWasmPlugin } = await import('./vite-plugin.js');
    const plugin = viteWasmPlugin({
      wasmDir: 'custom/wasm',
      debug: true,
      streaming: false
    });

    expect(plugin).toBeDefined();
  });
});
