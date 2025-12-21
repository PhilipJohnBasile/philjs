/**
 * @file Bevy Integration Tests
 * @description Comprehensive tests for Bevy WASM integration with PhilJS
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  BevyConfig,
  BevyInstance,
  BevyEntity,
  BevyComponent,
  BevyState,
  EntityId,
  Vec3,
  Quat,
  TransformComponent,
  VisibilityComponent,
  NameComponent,
} from './types';
import {
  createBevyInstance,
  useBevy,
  useBevyEntity,
  useBevyResource,
  useBevyQuery,
  onBevyEvent,
  sendBevyEvent,
  getBevy,
  disposeBevy,
  disposeAllBevy,
  isBevySupported,
  getAllBevyInstances,
} from './hooks';
import {
  createEntityBridge,
  createComponentBridge,
  spawnEntity,
  despawnEntity,
  insertComponent,
  removeComponent,
  queryEntities,
  findEntitiesWith,
  findEntityWith,
  createTransformComponent,
  createVisibilityComponent,
  createNameComponent,
  createCustomComponent,
  trackEntities,
  trackEntity,
  disposeAllBridges,
  setSignalCreator,
} from './ecs-bridge';
import {
  loadBevyAsset,
  preloadAssets,
  preloadAssetsWithPriority,
  getCachedAsset,
  isAssetCached,
  isAssetLoaded,
  getAssetMetadata,
  clearAsset,
  clearAssetCache,
  getCacheSize,
  getCacheCount,
  getCachedAssetPaths,
  watchAsset,
  defineAssetBundle,
  loadAssetBundle,
  unloadAssetBundle,
  getAssetBundle,
  isBundleLoaded,
  streamAsset,
} from './assets';
import {
  BevyEmbed,
  createBevyEmbedElement,
  BevyFullscreenButton,
  BevyPauseButton,
  BevyFPSCounter,
} from './BevyEmbed';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock WebAssembly
const mockWasmInstance = {
  exports: {
    bevy_init: vi.fn(),
    bevy_update: vi.fn(),
    bevy_render: vi.fn(),
    bevy_shutdown: vi.fn(),
    memory: new WebAssembly.Memory({ initial: 1 }),
  },
};

const mockWasmModule = {} as WebAssembly.Module;

vi.stubGlobal('WebAssembly', {
  compile: vi.fn().mockResolvedValue(mockWasmModule),
  instantiate: vi.fn().mockResolvedValue(mockWasmInstance),
  Module: vi.fn(),
  Instance: vi.fn(),
  Memory: class {
    buffer = new ArrayBuffer(1024);
    constructor(options: WebAssembly.MemoryDescriptor) {}
  },
});

// Mock fetch
const mockFetchResponses = new Map<string, Response>();

vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options?: RequestInit) => {
  const mockResponse = mockFetchResponses.get(url);
  if (mockResponse) {
    return Promise.resolve(mockResponse);
  }

  // Default WASM response
  if (url.endsWith('.wasm')) {
    return Promise.resolve(new Response(new ArrayBuffer(100), {
      status: 200,
      headers: { 'content-type': 'application/wasm' },
    }));
  }

  // Default image response
  if (url.match(/\.(png|jpg|jpeg|webp)$/)) {
    const blob = new Blob([new Uint8Array(100)], { type: 'image/png' });
    return Promise.resolve(new Response(blob, {
      status: 200,
      headers: { 'content-type': 'image/png', 'content-length': '100' },
    }));
  }

  return Promise.resolve(new Response('Not found', { status: 404 }));
}));

// Mock canvas
function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.id = `test-canvas-${Date.now()}`;
  canvas.width = 800;
  canvas.height = 600;
  canvas.getContext = vi.fn().mockReturnValue({
    canvas,
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
  });
  return canvas;
}

// Mock requestAnimationFrame
let rafCallbacks: FrameRequestCallback[] = [];
vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
  rafCallbacks.push(callback);
  return rafCallbacks.length;
}));
vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
  rafCallbacks = rafCallbacks.filter((_, i) => i !== id - 1);
}));

// Helper to flush animation frames
function flushAnimationFrames(count = 1) {
  for (let i = 0; i < count; i++) {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(cb => cb(performance.now()));
  }
}

// Mock createImageBitmap
vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
  width: 100,
  height: 100,
  close: vi.fn(),
}));

// Mock AudioContext
vi.stubGlobal('AudioContext', class {
  decodeAudioData = vi.fn().mockResolvedValue({
    duration: 1,
    numberOfChannels: 2,
    sampleRate: 44100,
  });
});

// Mock FontFace
vi.stubGlobal('FontFace', class {
  family: string;
  constructor(family: string, source: ArrayBuffer) {
    this.family = family;
  }
  load = vi.fn().mockResolvedValue(this);
});

// Mock document.fonts
Object.defineProperty(document, 'fonts', {
  value: { add: vi.fn() },
});

// ============================================================================
// Test Suite: Types
// ============================================================================

describe('Bevy Types', () => {
  it('should define BevyConfig type correctly', () => {
    const config: BevyConfig = {
      wasmPath: '/game.wasm',
      canvas: createMockCanvas(),
      width: 1280,
      height: 720,
    };
    expect(config.wasmPath).toBe('/game.wasm');
    expect(config.width).toBe(1280);
  });

  it('should define Vec3 type correctly', () => {
    const vec: Vec3 = { x: 1, y: 2, z: 3 };
    expect(vec.x).toBe(1);
    expect(vec.y).toBe(2);
    expect(vec.z).toBe(3);
  });

  it('should define Quat type correctly', () => {
    const quat: Quat = { x: 0, y: 0, z: 0, w: 1 };
    expect(quat.w).toBe(1);
  });

  it('should define BevyState as union type', () => {
    const states: BevyState[] = [
      'idle', 'loading', 'compiling', 'instantiating',
      'initializing', 'running', 'paused', 'error', 'disposed'
    ];
    expect(states.length).toBe(9);
  });
});

// ============================================================================
// Test Suite: Hooks
// ============================================================================

describe('Bevy Hooks', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = createMockCanvas();
    document.body.appendChild(canvas);
    vi.clearAllMocks();
    rafCallbacks = [];
  });

  afterEach(async () => {
    await disposeAllBevy();
    document.body.innerHTML = '';
    clearAssetCache();
    disposeAllBridges();
  });

  describe('createBevyInstance', () => {
    it('should create a Bevy instance', async () => {
      const instance = await createBevyInstance({
        wasmPath: '/game.wasm',
        canvas,
      });
      expect(instance).toBeDefined();
      expect(instance.state).toBe('running');
      expect(instance.app).toBeDefined();
    });

    it('should reuse existing instance for same canvas', async () => {
      const instance1 = await createBevyInstance({
        wasmPath: '/game.wasm',
        canvas,
      });
      const instance2 = await createBevyInstance({
        wasmPath: '/game.wasm',
        canvas,
      });
      expect(instance1).toBe(instance2);
    });

    it('should accept canvas selector string', async () => {
      const instance = await createBevyInstance({
        wasmPath: '/game.wasm',
        canvas: `#${canvas.id}`,
      });
      expect(instance).toBeDefined();
    });

    it('should throw error for missing canvas', async () => {
      await expect(createBevyInstance({
        wasmPath: '/game.wasm',
        canvas: '#nonexistent',
      })).rejects.toThrow('Canvas not found');
    });

    it('should handle config options', async () => {
      const instance = await createBevyInstance({
        wasmPath: '/game.wasm',
        canvas,
        width: 1920,
        height: 1080,
        pixelRatio: 2,
        targetFps: 60,
        debug: true,
      });
      expect(instance.config.width).toBe(1920);
      expect(instance.config.height).toBe(1080);
      expect(instance.config.targetFps).toBe(60);
    });
  });

  describe('useBevy', () => {
    it('should return bevy state', async () => {
      await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const result = useBevy(canvas);
      expect(result.instance).toBeDefined();
      expect(result.isReady).toBe(true);
      expect(result.isLoading).toBe(false);
    });

    it('should return idle state when no instance', () => {
      const result = useBevy();
      expect(result.instance).toBeNull();
      expect(result.state).toBe('idle');
      expect(result.isReady).toBe(false);
    });

    it('should provide pause and resume functions', async () => {
      await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const result = useBevy(canvas);
      expect(typeof result.pause).toBe('function');
      expect(typeof result.resume).toBe('function');
    });
  });

  describe('useBevyEntity', () => {
    it('should return entity state', async () => {
      const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const entity = instance.app.getWorld().spawn();
      const result = useBevyEntity(entity.id, canvas);
      expect(result.entity).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('should provide component access methods', async () => {
      const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const entity = instance.app.getWorld().spawn();
      const result = useBevyEntity(entity.id, canvas);
      expect(typeof result.getComponent).toBe('function');
      expect(typeof result.hasComponent).toBe('function');
      expect(typeof result.insertComponent).toBe('function');
      expect(typeof result.removeComponent).toBe('function');
    });
  });

  describe('useBevyResource', () => {
    it('should return resource state', async () => {
      await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const result = useBevyResource({ resourceName: 'Time' } as any, canvas);
      expect(typeof result.update).toBe('function');
      expect(typeof result.remove).toBe('function');
    });
  });

  describe('useBevyQuery', () => {
    it('should return query results', async () => {
      const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const world = instance.app.getWorld();
      world.spawnBundle(createTransformComponent());

      const result = useBevyQuery({ components: ['Transform'] }, canvas);
      expect(result.count).toBe(1);
      expect(result.isEmpty).toBe(false);
    });

    it('should return empty for non-matching query', async () => {
      await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const result = useBevyQuery({ components: ['NonExistent'] }, canvas);
      expect(result.count).toBe(0);
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('Event handling', () => {
    it('should subscribe to bevy events', async () => {
      const callback = vi.fn();
      const unsubscribe = onBevyEvent('ready', callback);
      await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it('should send custom events', async () => {
      const callback = vi.fn();
      onBevyEvent('custom', callback);
      await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      sendBevyEvent('custom', { action: 'test' }, canvas);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Utility functions', () => {
    it('should check bevy support', () => {
      const supported = isBevySupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should get all instances', async () => {
      await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const instances = getAllBevyInstances();
      expect(instances.length).toBeGreaterThan(0);
    });

    it('should dispose bevy instance', async () => {
      await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      await disposeBevy(canvas);
      const result = getBevy(canvas);
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Test Suite: ECS Bridge
// ============================================================================

describe('Bevy ECS Bridge', () => {
  let canvas: HTMLCanvasElement;
  let instance: BevyInstance;

  beforeEach(async () => {
    canvas = createMockCanvas();
    document.body.appendChild(canvas);
    vi.clearAllMocks();
    rafCallbacks = [];
    instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
  });

  afterEach(async () => {
    await disposeAllBevy();
    document.body.innerHTML = '';
    clearAssetCache();
    disposeAllBridges();
  });

  describe('Component factories', () => {
    it('should create transform component', () => {
      const transform = createTransformComponent(
        { x: 1, y: 2, z: 3 },
        { x: 0, y: 0, z: 0, w: 1 },
        { x: 1, y: 1, z: 1 }
      );
      expect(transform.componentName).toBe('Transform');
      expect(transform.translation.x).toBe(1);
      expect(transform.rotation.w).toBe(1);
      expect(transform.scale.y).toBe(1);
    });

    it('should serialize transform to bytes', () => {
      const transform = createTransformComponent();
      const bytes = transform.toBytes();
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(40); // 10 floats * 4 bytes
    });

    it('should clone transform component', () => {
      const transform = createTransformComponent({ x: 5, y: 10, z: 15 });
      const cloned = transform.clone() as TransformComponent;
      expect(cloned.translation.x).toBe(5);
      expect(cloned).not.toBe(transform);
    });

    it('should create visibility component', () => {
      const visible = createVisibilityComponent(true);
      expect(visible.componentName).toBe('Visibility');
      expect(visible.isVisible).toBe(true);
    });

    it('should create name component', () => {
      const name = createNameComponent('Player');
      expect(name.componentName).toBe('Name');
      expect(name.name).toBe('Player');
    });

    it('should create custom component', () => {
      const health = createCustomComponent('Health', {
        current: 100,
        max: 100,
      });
      expect(health.componentName).toBe('Health');
      expect((health as any).current).toBe(100);
    });
  });

  describe('Entity operations', () => {
    it('should spawn entity with components', () => {
      const entity = spawnEntity([
        createTransformComponent(),
        createNameComponent('Test'),
      ], canvas);
      expect(entity).toBeDefined();
      expect(entity?.hasComponent({ componentName: 'Transform' } as any)).toBe(true);
    });

    it('should despawn entity', () => {
      const entity = spawnEntity([createTransformComponent()], canvas);
      expect(entity).toBeDefined();
      despawnEntity(entity!.id, canvas);
      const found = instance.app.getWorld().getEntity(entity!.id);
      expect(found).toBeUndefined();
    });

    it('should insert component into entity', () => {
      const entity = spawnEntity([], canvas);
      insertComponent(entity!.id, createTransformComponent(), canvas);
      expect(entity?.hasComponent({ componentName: 'Transform' } as any)).toBe(true);
    });

    it('should remove component from entity', () => {
      const entity = spawnEntity([createTransformComponent()], canvas);
      removeComponent(entity!.id, { componentName: 'Transform' } as any, canvas);
      expect(entity?.hasComponent({ componentName: 'Transform' } as any)).toBe(false);
    });
  });

  describe('Entity queries', () => {
    it('should query entities', () => {
      spawnEntity([createTransformComponent(), createNameComponent('A')], canvas);
      spawnEntity([createTransformComponent(), createNameComponent('B')], canvas);
      spawnEntity([createNameComponent('C')], canvas);

      const results = queryEntities({ components: ['Transform'] }, canvas);
      expect(results?.count()).toBe(2);
    });

    it('should find entities with components', () => {
      spawnEntity([createTransformComponent()], canvas);
      spawnEntity([createTransformComponent(), createVisibilityComponent()], canvas);

      const found = findEntitiesWith(['Transform', 'Visibility'], canvas);
      expect(found.length).toBe(1);
    });

    it('should find single entity with components', () => {
      spawnEntity([createNameComponent('Player')], canvas);
      const found = findEntityWith(['Name'], canvas);
      expect(found).toBeDefined();
    });

    it('should filter with query filters', () => {
      spawnEntity([createTransformComponent(), createVisibilityComponent()], canvas);
      spawnEntity([createTransformComponent()], canvas);

      const results = queryEntities({
        components: ['Transform'],
        filters: [{ type: 'with', component: 'Visibility' }],
      }, canvas);
      expect(results?.count()).toBe(1);
    });
  });

  describe('Entity bridges', () => {
    it('should create entity bridge', () => {
      const entity = spawnEntity([createTransformComponent()], canvas)!;
      const bridge = createEntityBridge(entity);
      expect(bridge.entity).toBe(entity);
    });

    it('should subscribe to entity changes', () => {
      const entity = spawnEntity([createTransformComponent()], canvas)!;
      const bridge = createEntityBridge(entity);
      const callback = vi.fn();
      bridge.subscribe(callback);
      bridge.update(createVisibilityComponent());
      expect(callback).toHaveBeenCalled();
    });

    it('should dispose bridge', () => {
      const entity = spawnEntity([createTransformComponent()], canvas)!;
      const bridge = createEntityBridge(entity);
      bridge.dispose();
      // Should not throw after dispose
      expect(() => bridge.subscribe(() => {})).not.toThrow();
    });
  });

  describe('Component bridges', () => {
    it('should create component bridge', () => {
      const entity = spawnEntity([createTransformComponent()], canvas)!;
      const bridge = createComponentBridge(
        { componentName: 'Transform' } as any,
        entity.id
      );
      expect(bridge.componentType.componentName).toBe('Transform');
    });

    it('should subscribe to component changes', () => {
      const entity = spawnEntity([createTransformComponent()], canvas)!;
      const bridge = createComponentBridge(
        { componentName: 'Transform' } as any,
        entity.id
      );
      const callback = vi.fn();
      bridge.subscribe(callback);
      expect(callback).toHaveBeenCalled(); // Called immediately with current value
    });
  });

  describe('Reactive tracking', () => {
    it('should track entities matching query', () => {
      const callback = vi.fn();
      trackEntities({ components: ['Transform'] }, callback, canvas);
      expect(callback).toHaveBeenCalledWith([]);

      spawnEntity([createTransformComponent()], canvas);
      expect(callback).toHaveBeenCalled();
    });

    it('should track specific entity', () => {
      const entity = spawnEntity([createTransformComponent()], canvas)!;
      const callback = vi.fn();
      trackEntity(entity.id, callback, canvas);
      expect(callback).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Test Suite: Assets
// ============================================================================

describe('Bevy Assets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAssetCache();
    mockFetchResponses.clear();
  });

  afterEach(() => {
    clearAssetCache();
  });

  describe('loadBevyAsset', () => {
    it('should load texture asset', async () => {
      const handle = loadBevyAsset('/assets/test.png');
      expect(handle.path).toBe('/assets/test.png');
      expect(handle.type).toBe('texture');
      // State transitions to 'loading' immediately when loadAsset is called
      expect(handle.state).toBe('loading');
    });

    it('should detect asset type from extension', () => {
      expect(loadBevyAsset('/test.png').type).toBe('texture');
      expect(loadBevyAsset('/test.mp3').type).toBe('audio');
      expect(loadBevyAsset('/test.gltf').type).toBe('mesh');
      expect(loadBevyAsset('/test.ttf').type).toBe('font');
      expect(loadBevyAsset('/test.wgsl').type).toBe('shader');
    });

    it('should cache loaded assets', async () => {
      const handle1 = loadBevyAsset('/assets/test.png');
      const handle2 = loadBevyAsset('/assets/test.png');
      expect(handle1).toBe(handle2);
    });

    it('should skip cache when option is false', () => {
      const handle1 = loadBevyAsset('/assets/test.png', { cache: false });
      const handle2 = loadBevyAsset('/assets/test.png', { cache: false });
      expect(handle1).not.toBe(handle2);
    });
  });

  describe('Asset caching', () => {
    it('should check if asset is cached', () => {
      loadBevyAsset('/test.png');
      expect(isAssetCached('/test.png')).toBe(true);
      expect(isAssetCached('/other.png')).toBe(false);
    });

    it('should get cached asset', () => {
      loadBevyAsset('/test.png');
      const cached = getCachedAsset('/test.png');
      expect(cached).toBeDefined();
    });

    it('should clear specific asset', () => {
      loadBevyAsset('/test.png');
      clearAsset('/test.png');
      expect(isAssetCached('/test.png')).toBe(false);
    });

    it('should clear all assets', () => {
      loadBevyAsset('/test1.png');
      loadBevyAsset('/test2.png');
      clearAssetCache();
      expect(getCacheCount()).toBe(0);
    });

    it('should get cache size', () => {
      loadBevyAsset('/test.png');
      const size = getCacheSize();
      expect(typeof size).toBe('number');
    });

    it('should get cached asset paths', () => {
      loadBevyAsset('/test1.png');
      loadBevyAsset('/test2.png');
      const paths = getCachedAssetPaths();
      expect(paths).toContain('/test1.png');
      expect(paths).toContain('/test2.png');
    });
  });

  describe('Preloading', () => {
    it('should preload multiple assets', async () => {
      const results = await preloadAssets(['/test1.png', '/test2.png']);
      expect(results.size).toBe(2);
    });

    it('should report progress during preload', async () => {
      const onProgress = vi.fn();
      await preloadAssets(['/test1.png', '/test2.png'], { onProgress });
      expect(onProgress).toHaveBeenCalled();
    });

    it('should handle errors during preload', async () => {
      mockFetchResponses.set('/error.png', new Response('Not found', { status: 404 }));
      const onError = vi.fn();
      await preloadAssets(['/error.png'], { onError, continueOnError: true });
      expect(onError).toHaveBeenCalled();
    });

    it('should preload with priority', async () => {
      await preloadAssetsWithPriority([
        { path: '/high.png', priority: 'high' },
        { path: '/low.png', priority: 'low' },
      ]);
      expect(isAssetCached('/high.png')).toBe(true);
      expect(isAssetCached('/low.png')).toBe(true);
    });
  });

  describe('Asset bundles', () => {
    it('should define asset bundle', () => {
      const bundle = defineAssetBundle('level1', ['/a.png', '/b.png']);
      expect(bundle.name).toBe('level1');
      expect(bundle.assets.length).toBe(2);
    });

    it('should get bundle by name', () => {
      defineAssetBundle('test', ['/a.png']);
      const bundle = getAssetBundle('test');
      expect(bundle).toBeDefined();
    });

    it('should check if bundle is loaded', () => {
      defineAssetBundle('test', ['/a.png']);
      expect(isBundleLoaded('test')).toBe(false);
    });

    it('should load asset bundle', async () => {
      defineAssetBundle('test', ['/a.png', '/b.png']);
      const bundle = await loadAssetBundle('test');
      expect(bundle.loaded).toBe(true);
    });

    it('should unload asset bundle', async () => {
      defineAssetBundle('test', ['/a.png']);
      await loadAssetBundle('test');
      unloadAssetBundle('test');
      expect(isBundleLoaded('test')).toBe(false);
    });
  });

  describe('Asset watching', () => {
    it('should watch asset for changes', () => {
      const callback = vi.fn();
      const unwatch = watchAsset('/test.png', callback);
      expect(typeof unwatch).toBe('function');
      unwatch();
    });
  });
});

// ============================================================================
// Test Suite: BevyEmbed Component
// ============================================================================

describe('BevyEmbed Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rafCallbacks = [];
  });

  afterEach(async () => {
    await disposeAllBevy();
    document.body.innerHTML = '';
  });

  it('should create embed container', () => {
    const embed = BevyEmbed({
      wasmPath: '/game.wasm',
      width: 800,
      height: 600,
    });
    expect(embed).toBeInstanceOf(HTMLElement);
  });

  it('should create with createBevyEmbedElement', () => {
    const embed = createBevyEmbedElement({
      wasmPath: '/game.wasm',
    });
    expect(embed).toBeInstanceOf(HTMLElement);
  });

  it('should contain canvas element', () => {
    const embed = BevyEmbed({ wasmPath: '/game.wasm' });
    const canvas = embed.querySelector('canvas');
    expect(canvas).toBeDefined();
  });

  it('should apply className', () => {
    const embed = BevyEmbed({
      wasmPath: '/game.wasm',
      className: 'game-container',
    });
    expect(embed.className).toBe('game-container');
  });

  it('should apply style', () => {
    const embed = BevyEmbed({
      wasmPath: '/game.wasm',
      style: { background: 'black' },
    });
    expect(embed.style.background).toBe('black');
  });

  it('should have dispose method', () => {
    const embed = BevyEmbed({ wasmPath: '/game.wasm' });
    expect(typeof (embed as any).dispose).toBe('function');
  });

  describe('Utility components', () => {
    it('should create fullscreen button', async () => {
      const canvas = createMockCanvas();
      document.body.appendChild(canvas);
      const button = BevyFullscreenButton(canvas);
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(button.textContent).toBe('Fullscreen');
    });

    it('should create pause button', async () => {
      const canvas = createMockCanvas();
      document.body.appendChild(canvas);
      const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const button = BevyPauseButton(instance);
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(button.textContent).toBe('Pause');
    });

    it('should create FPS counter', async () => {
      const canvas = createMockCanvas();
      document.body.appendChild(canvas);
      const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
      const counter = BevyFPSCounter(instance);
      expect(counter).toBeInstanceOf(HTMLDivElement);
      expect(counter.textContent).toContain('FPS');
    });
  });
});

// ============================================================================
// Test Suite: App Lifecycle
// ============================================================================

describe('Bevy App Lifecycle', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = createMockCanvas();
    document.body.appendChild(canvas);
    vi.clearAllMocks();
    rafCallbacks = [];
  });

  afterEach(async () => {
    await disposeAllBevy();
    document.body.innerHTML = '';
  });

  it('should run app', async () => {
    const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
    await instance.app.run();
    expect(instance.app.isRunning()).toBe(true);
  });

  it('should pause and resume app', async () => {
    const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
    await instance.app.run();

    instance.app.pause();
    expect(instance.app.isRunning()).toBe(false);

    instance.app.resume();
    expect(instance.app.isRunning()).toBe(true);
  });

  it('should get FPS', async () => {
    const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
    const fps = instance.app.getFps();
    expect(typeof fps).toBe('number');
  });

  it('should get delta time', async () => {
    const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
    const delta = instance.app.getDeltaTime();
    expect(typeof delta).toBe('number');
  });

  it('should get elapsed time', async () => {
    const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
    const elapsed = instance.app.getElapsedTime();
    expect(typeof elapsed).toBe('number');
  });

  it('should resize canvas', async () => {
    const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
    instance.app.resize(1920, 1080);
    const c = instance.app.getCanvas();
    expect(c.style.width).toBe('1920px');
    expect(c.style.height).toBe('1080px');
  });

  it('should set target FPS', async () => {
    const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
    instance.app.setTargetFps(30);
    expect(instance.config.targetFps).toBe(30);
  });

  it('should dispose app', async () => {
    const instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
    await instance.app.dispose();
    expect(instance.state).toBe('disposed');
  });
});

// ============================================================================
// Test Suite: World and ECS
// ============================================================================

describe('Bevy World and ECS', () => {
  let canvas: HTMLCanvasElement;
  let instance: BevyInstance;

  beforeEach(async () => {
    canvas = createMockCanvas();
    document.body.appendChild(canvas);
    vi.clearAllMocks();
    rafCallbacks = [];
    instance = await createBevyInstance({ wasmPath: '/game.wasm', canvas });
  });

  afterEach(async () => {
    await disposeAllBevy();
    document.body.innerHTML = '';
    disposeAllBridges();
  });

  it('should get world from app', () => {
    const world = instance.app.getWorld();
    expect(world).toBeDefined();
    expect(typeof world.spawn).toBe('function');
  });

  it('should spawn entity in world', () => {
    const world = instance.app.getWorld();
    const entity = world.spawn();
    expect(entity).toBeDefined();
    expect(entity.isValid()).toBe(true);
  });

  it('should spawn entity with bundle', () => {
    const world = instance.app.getWorld();
    const entity = world.spawnBundle(
      createTransformComponent(),
      createNameComponent('Test')
    );
    expect(entity.getComponents().length).toBe(2);
  });

  it('should get entity by id', () => {
    const world = instance.app.getWorld();
    const entity = world.spawn();
    const found = world.getEntity(entity.id);
    expect(found).toBe(entity);
  });

  it('should despawn entity', () => {
    const world = instance.app.getWorld();
    const entity = world.spawn();
    world.despawn(entity);
    expect(world.getEntity(entity.id)).toBeUndefined();
  });

  it('should query entities', () => {
    const world = instance.app.getWorld();
    world.spawnBundle(createTransformComponent());
    world.spawnBundle(createTransformComponent());

    const results = world.query({ components: ['Transform'] });
    expect(results.count()).toBe(2);
  });

  it('should get entity count', () => {
    const world = instance.app.getWorld();
    world.spawn();
    world.spawn();
    expect(world.entityCount()).toBe(2);
  });

  it('should clear all entities', () => {
    const world = instance.app.getWorld();
    world.spawn();
    world.spawn();
    world.clear();
    expect(world.entityCount()).toBe(0);
  });

  it('should manage resources', () => {
    const world = instance.app.getWorld();
    const resource = {
      resourceName: 'TestResource',
      value: 42,
      toBytes: () => new Uint8Array([42]),
    };

    world.insertResource(resource);
    expect(world.hasResource({ resourceName: 'TestResource' } as any)).toBe(true);

    const retrieved = world.getResource({ resourceName: 'TestResource' } as any);
    expect(retrieved?.value).toBe(42);

    world.removeResource({ resourceName: 'TestResource' } as any);
    expect(world.hasResource({ resourceName: 'TestResource' } as any)).toBe(false);
  });
});
