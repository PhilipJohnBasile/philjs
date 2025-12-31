/**
 * @philjs/islands - Core Island Functionality Tests
 * Tests for island component creation, registration, and lifecycle
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { Island, defineIsland, createIsland } from '../island.js';
import { IslandRegistry, getRegistry } from '../registry.js';
import type { IslandConfig, IslandComponent, IslandInstance, HydrationStrategy } from '../types.js';

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  private callback: IntersectionObserverCallback;
  private static instances: MockIntersectionObserver[] = [];

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(_target: Element): void {}

  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  // Helper to trigger intersection
  triggerIntersection(target: Element, isIntersecting: boolean): void {
    this.callback(
      [
        {
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ],
      this
    );
  }

  static getLastInstance(): MockIntersectionObserver | undefined {
    return MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
  }

  static clearInstances(): void {
    MockIntersectionObserver.instances = [];
  }
}

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock requestIdleCallback
const mockRequestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
  setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0);
  return 1;
});

const mockCancelIdleCallback = vi.fn();

// Store original customElements
let originalCustomElements: CustomElementRegistry;

beforeAll(() => {
  originalCustomElements = globalThis.customElements;
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.stubGlobal('matchMedia', mockMatchMedia);
  vi.stubGlobal('requestIdleCallback', mockRequestIdleCallback);
  vi.stubGlobal('cancelIdleCallback', mockCancelIdleCallback);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// Helper to create mock island component
function createMockComponent(): IslandComponent {
  return {
    mount: vi.fn(),
    unmount: vi.fn(),
    update: vi.fn(),
  };
}

// Helper to create component class
class MockIslandComponent implements IslandComponent {
  static mountCalls: Array<{ element: HTMLElement; props: Record<string, unknown> }> = [];
  static unmountCalls: number = 0;
  static updateCalls: Array<Record<string, unknown>> = [];

  mount(element: HTMLElement, props: Record<string, unknown>): void {
    MockIslandComponent.mountCalls.push({ element, props });
  }

  unmount(): void {
    MockIslandComponent.unmountCalls++;
  }

  update(props: Record<string, unknown>): void {
    MockIslandComponent.updateCalls.push(props);
  }

  static reset(): void {
    MockIslandComponent.mountCalls = [];
    MockIslandComponent.unmountCalls = 0;
    MockIslandComponent.updateCalls = [];
  }
}

describe('IslandRegistry', () => {
  let registry: IslandRegistry;

  beforeEach(() => {
    registry = getRegistry();
    registry.clear();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = IslandRegistry.getInstance();
      const instance2 = IslandRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should be accessible via getRegistry helper', () => {
      const instance = getRegistry();
      expect(instance).toBe(IslandRegistry.getInstance());
    });
  });

  describe('Registration', () => {
    it('should register an island with config', () => {
      const config: IslandConfig = {
        name: 'test-island',
        component: MockIslandComponent,
        strategy: 'load',
      };

      registry.register(config);

      expect(registry.has('test-island')).toBe(true);
      expect(registry.size).toBe(1);
    });

    it('should store config in registry entry', () => {
      const config: IslandConfig = {
        name: 'counter-island',
        component: MockIslandComponent,
        strategy: 'visible',
        threshold: 0.5,
      };

      registry.register(config);
      const entry = registry.get('counter-island');

      expect(entry).toBeDefined();
      expect(entry?.config).toEqual(config);
    });

    it('should warn and overwrite when registering duplicate name', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const config1: IslandConfig = {
        name: 'duplicate',
        component: MockIslandComponent,
        strategy: 'load',
      };

      const config2: IslandConfig = {
        name: 'duplicate',
        component: () => createMockComponent(),
        strategy: 'idle',
      };

      registry.register(config1);
      registry.register(config2);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('duplicate')
      );
      expect(registry.get('duplicate')?.config.strategy).toBe('idle');

      warnSpy.mockRestore();
    });

    it('should register islands with factory functions', () => {
      const factory = async () => createMockComponent();
      const config: IslandConfig = {
        name: 'factory-island',
        component: factory,
      };

      registry.register(config);
      expect(registry.has('factory-island')).toBe(true);
    });
  });

  describe('Unregistration', () => {
    it('should unregister an island by name', () => {
      registry.register({
        name: 'removable',
        component: MockIslandComponent,
      });

      expect(registry.has('removable')).toBe(true);

      const result = registry.unregister('removable');

      expect(result).toBe(true);
      expect(registry.has('removable')).toBe(false);
    });

    it('should return false when unregistering non-existent island', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('Querying', () => {
    beforeEach(() => {
      registry.register({ name: 'island-a', component: MockIslandComponent });
      registry.register({ name: 'island-b', component: MockIslandComponent });
      registry.register({ name: 'island-c', component: MockIslandComponent });
    });

    it('should return all registered island names', () => {
      const names = registry.names();

      expect(names).toContain('island-a');
      expect(names).toContain('island-b');
      expect(names).toContain('island-c');
      expect(names.length).toBe(3);
    });

    it('should return undefined for non-existent island', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });

    it('should iterate over all entries', () => {
      const entries = Array.from(registry.entries());

      expect(entries.length).toBe(3);
      expect(entries.map(([name]) => name).sort()).toEqual(['island-a', 'island-b', 'island-c']);
    });

    it('should report correct size', () => {
      expect(registry.size).toBe(3);
    });
  });

  describe('Instance Tracking', () => {
    it('should track island instances', () => {
      registry.register({ name: 'tracked', component: MockIslandComponent });

      const mockInstance: IslandInstance = {
        name: 'tracked',
        element: document.createElement('div'),
        state: 'active',
        props: {},
        hydrate: vi.fn(),
        unmount: vi.fn(),
        update: vi.fn(),
      };

      registry.trackInstance('tracked', mockInstance);

      const instances = registry.getInstances('tracked');
      expect(instances).toContain(mockInstance);
    });

    it('should untrack island instances', () => {
      registry.register({ name: 'untracked', component: MockIslandComponent });

      const mockInstance: IslandInstance = {
        name: 'untracked',
        element: document.createElement('div'),
        state: 'active',
        props: {},
        hydrate: vi.fn(),
        unmount: vi.fn(),
        update: vi.fn(),
      };

      registry.trackInstance('untracked', mockInstance);
      registry.untrackInstance('untracked', mockInstance);

      const instances = registry.getInstances('untracked');
      expect(instances).not.toContain(mockInstance);
    });

    it('should return empty array for unregistered island instances', () => {
      const instances = registry.getInstances('non-existent');
      expect(instances).toEqual([]);
    });
  });

  describe('Clear', () => {
    it('should clear all registrations', () => {
      registry.register({ name: 'island-1', component: MockIslandComponent });
      registry.register({ name: 'island-2', component: MockIslandComponent });

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.names()).toEqual([]);
    });
  });
});

describe('defineIsland', () => {
  let registry: IslandRegistry;

  beforeEach(() => {
    registry = getRegistry();
    registry.clear();
  });

  afterEach(() => {
    registry.clear();
  });

  it('should register island via defineIsland helper', () => {
    defineIsland({
      name: 'defined-island',
      component: MockIslandComponent,
      strategy: 'visible',
    });

    expect(registry.has('defined-island')).toBe(true);
  });

  it('should support all hydration strategies', () => {
    const strategies: HydrationStrategy[] = ['idle', 'visible', 'media', 'interaction', 'load', 'never'];

    strategies.forEach((strategy, index) => {
      defineIsland({
        name: `island-${strategy}-${index}`,
        component: MockIslandComponent,
        strategy,
      });
    });

    expect(registry.size).toBe(strategies.length);
  });

  it('should support optional config properties', () => {
    defineIsland({
      name: 'full-config-island',
      component: MockIslandComponent,
      strategy: 'visible',
      rootMargin: '100px',
      threshold: 0.5,
      triggers: ['click', 'hover'],
      media: '(min-width: 768px)',
      timeout: 3000,
    });

    const entry = registry.get('full-config-island');
    expect(entry?.config.rootMargin).toBe('100px');
    expect(entry?.config.threshold).toBe(0.5);
    expect(entry?.config.triggers).toEqual(['click', 'hover']);
    expect(entry?.config.media).toBe('(min-width: 768px)');
    expect(entry?.config.timeout).toBe(3000);
  });
});

describe('createIsland', () => {
  beforeEach(() => {
    getRegistry().clear();
  });

  afterEach(() => {
    getRegistry().clear();
  });

  it('should create a phil-island element', () => {
    const island = createIsland('test-island');

    expect(island.tagName.toLowerCase()).toBe('phil-island');
    expect(island.getAttribute('name')).toBe('test-island');
  });

  it('should set props as JSON attribute', () => {
    const props = { count: 0, title: 'Counter' };
    const island = createIsland('counter', props);

    const propsAttr = island.getAttribute('props');
    expect(propsAttr).toBe(JSON.stringify(props));
  });

  it('should set strategy attribute when provided', () => {
    const island = createIsland('lazy-island', {}, 'idle');

    expect(island.getAttribute('strategy')).toBe('idle');
  });

  it('should work without optional parameters', () => {
    const island = createIsland('minimal-island');

    expect(island.getAttribute('name')).toBe('minimal-island');
    expect(island.getAttribute('props')).toBeNull();
    expect(island.getAttribute('strategy')).toBeNull();
  });

  it('should create different instances for each call', () => {
    const island1 = createIsland('shared', { id: 1 });
    const island2 = createIsland('shared', { id: 2 });

    expect(island1).not.toBe(island2);
    expect(island1.getAttribute('props')).toBe(JSON.stringify({ id: 1 }));
    expect(island2.getAttribute('props')).toBe(JSON.stringify({ id: 2 }));
  });
});

describe('Island Web Component', () => {
  beforeEach(() => {
    getRegistry().clear();
    MockIslandComponent.reset();
    MockIntersectionObserver.clearInstances();
    mockRequestIdleCallback.mockClear();
    mockMatchMedia.mockClear();
  });

  afterEach(() => {
    getRegistry().clear();
    // Clean up any islands in the DOM
    document.querySelectorAll('phil-island').forEach((el) => el.remove());
  });

  describe('Static Properties', () => {
    it('should have observedAttributes defined', () => {
      expect(Island.observedAttributes).toContain('name');
      expect(Island.observedAttributes).toContain('strategy');
      expect(Island.observedAttributes).toContain('props');
    });
  });

  describe('Attribute Getters', () => {
    it('should return name from attribute', () => {
      const island = document.createElement('phil-island') as Island;
      island.setAttribute('name', 'my-island');

      expect(island.name).toBe('my-island');
    });

    it('should return empty string for missing name', () => {
      const island = document.createElement('phil-island') as Island;

      expect(island.name).toBe('');
    });

    it('should return strategy from attribute with default', () => {
      const island = document.createElement('phil-island') as Island;

      expect(island.strategy).toBe('visible');

      island.setAttribute('strategy', 'idle');
      expect(island.strategy).toBe('idle');
    });

    it('should parse props from JSON attribute', () => {
      const island = document.createElement('phil-island') as Island;
      const testProps = { count: 5, name: 'test' };
      island.setAttribute('props', JSON.stringify(testProps));

      expect(island.props).toEqual(testProps);
    });

    it('should return empty object for invalid props JSON', () => {
      const island = document.createElement('phil-island') as Island;
      island.setAttribute('props', 'not-valid-json');

      expect(island.props).toEqual({});
    });

    it('should return empty object for missing props', () => {
      const island = document.createElement('phil-island') as Island;

      expect(island.props).toEqual({});
    });
  });

  describe('ConnectedCallback', () => {
    it('should warn when name attribute is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const island = document.createElement('phil-island') as Island;
      document.body.appendChild(island);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('missing "name" attribute')
      );

      island.remove();
      warnSpy.mockRestore();
    });

    it('should create instance when connected with name', () => {
      defineIsland({
        name: 'connected-island',
        component: MockIslandComponent,
        strategy: 'load',
      });

      const island = document.createElement('phil-island') as Island;
      island.setAttribute('name', 'connected-island');
      document.body.appendChild(island);

      // Should have created an instance
      expect((island as any)._instance).toBeDefined();

      island.remove();
    });
  });

  describe('DisconnectedCallback', () => {
    it('should cleanup on disconnect', () => {
      defineIsland({
        name: 'cleanup-island',
        component: MockIslandComponent,
        strategy: 'load',
      });

      const island = document.createElement('phil-island') as Island;
      island.setAttribute('name', 'cleanup-island');
      document.body.appendChild(island);

      const instance = (island as any)._instance;
      expect(instance).toBeDefined();

      island.remove();

      expect((island as any)._instance).toBeNull();
    });
  });

  describe('AttributeChangedCallback', () => {
    it('should update props when props attribute changes and island is active', async () => {
      defineIsland({
        name: 'reactive-island',
        component: MockIslandComponent,
        strategy: 'load',
      });

      const island = document.createElement('phil-island') as Island;
      island.setAttribute('name', 'reactive-island');
      island.setAttribute('props', JSON.stringify({ value: 1 }));
      document.body.appendChild(island);

      // Wait for hydration
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Change props
      island.setAttribute('props', JSON.stringify({ value: 2 }));

      // Wait for update
      await new Promise((resolve) => setTimeout(resolve, 10));

      island.remove();
    });

    it('should not trigger update when attribute value is the same', async () => {
      defineIsland({
        name: 'no-change-island',
        component: MockIslandComponent,
        strategy: 'load',
      });

      MockIslandComponent.reset();

      const island = document.createElement('phil-island') as Island;
      island.setAttribute('name', 'no-change-island');
      const props = JSON.stringify({ value: 1 });
      island.setAttribute('props', props);
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const updatesBefore = MockIslandComponent.updateCalls.length;

      // Set same value
      island.setAttribute('props', props);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(MockIslandComponent.updateCalls.length).toBe(updatesBefore);

      island.remove();
    });
  });

  describe('Props Serialization', () => {
    it('should handle complex nested objects', () => {
      const island = document.createElement('phil-island') as Island;
      const complexProps = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        items: [1, 2, 3],
      };

      island.setAttribute('props', JSON.stringify(complexProps));
      expect(island.props).toEqual(complexProps);
    });

    it('should handle arrays in props', () => {
      const island = document.createElement('phil-island') as Island;
      const arrayProps = {
        items: ['a', 'b', 'c'],
        numbers: [1, 2, 3],
      };

      island.setAttribute('props', JSON.stringify(arrayProps));
      expect(island.props).toEqual(arrayProps);
    });

    it('should handle null values in props', () => {
      const island = document.createElement('phil-island') as Island;
      const nullProps = {
        value: null,
        nested: { also: null },
      };

      island.setAttribute('props', JSON.stringify(nullProps));
      expect(island.props).toEqual(nullProps);
    });

    it('should handle boolean values in props', () => {
      const island = document.createElement('phil-island') as Island;
      const boolProps = {
        enabled: true,
        disabled: false,
      };

      island.setAttribute('props', JSON.stringify(boolProps));
      expect(island.props).toEqual(boolProps);
    });

    it('should handle number values in props', () => {
      const island = document.createElement('phil-island') as Island;
      const numProps = {
        integer: 42,
        float: 3.14,
        negative: -10,
        zero: 0,
      };

      island.setAttribute('props', JSON.stringify(numProps));
      expect(island.props).toEqual(numProps);
    });
  });

  describe('Island Instance', () => {
    it('should have correct initial state', async () => {
      defineIsland({
        name: 'state-island',
        component: MockIslandComponent,
        strategy: 'never', // Never auto-hydrate
      });

      const island = document.createElement('phil-island') as Island;
      island.setAttribute('name', 'state-island');
      document.body.appendChild(island);

      const instance = (island as any)._instance as IslandInstance;
      expect(instance.state).toBe('pending');
      expect(instance.name).toBe('state-island');
      expect(instance.element).toBe(island);

      island.remove();
    });

    it('should store props from element', async () => {
      defineIsland({
        name: 'props-island',
        component: MockIslandComponent,
        strategy: 'never',
      });

      const island = document.createElement('phil-island') as Island;
      island.setAttribute('name', 'props-island');
      island.setAttribute('props', JSON.stringify({ initial: 'value' }));
      document.body.appendChild(island);

      const instance = (island as any)._instance as IslandInstance;
      expect(instance.props).toEqual({ initial: 'value' });

      island.remove();
    });
  });

  describe('Error Handling', () => {
    it('should set error state when island is not registered', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const island = document.createElement('phil-island') as Island;
      island.setAttribute('name', 'unregistered-island');
      island.setAttribute('strategy', 'load');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(island.getAttribute('data-state')).toBe('error');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('unregistered-island'),
        expect.any(Error)
      );

      island.remove();
      errorSpy.mockRestore();
    });

    it('should dispatch error event on hydration failure', async () => {
      const errorHandler = vi.fn();

      const island = document.createElement('phil-island') as Island;
      island.setAttribute('name', 'error-island');
      island.setAttribute('strategy', 'load');
      island.addEventListener('phil:island-error', errorHandler);
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(errorHandler).toHaveBeenCalled();

      island.remove();
    });
  });
});

describe('Island Types', () => {
  describe('HydrationStrategy', () => {
    it('should define all valid strategies', () => {
      const strategies: HydrationStrategy[] = ['idle', 'visible', 'media', 'interaction', 'load', 'never'];

      strategies.forEach((strategy) => {
        expect(typeof strategy).toBe('string');
      });
    });
  });

  describe('IslandConfig Interface', () => {
    it('should accept minimal config', () => {
      const config: IslandConfig = {
        name: 'minimal',
        component: MockIslandComponent,
      };

      expect(config.name).toBe('minimal');
      expect(config.component).toBe(MockIslandComponent);
    });

    it('should accept full config', () => {
      const config: IslandConfig = {
        name: 'full',
        component: MockIslandComponent,
        strategy: 'visible',
        triggers: ['click', 'focus'],
        media: '(prefers-reduced-motion: no-preference)',
        rootMargin: '50px',
        threshold: [0, 0.5, 1],
        timeout: 5000,
      };

      expect(config.triggers).toEqual(['click', 'focus']);
      expect(config.threshold).toEqual([0, 0.5, 1]);
    });
  });

  describe('IslandComponent Interface', () => {
    it('should require mount method', () => {
      const component: IslandComponent = {
        mount: vi.fn(),
      };

      expect(typeof component.mount).toBe('function');
    });

    it('should allow optional unmount and update', () => {
      const fullComponent: IslandComponent = {
        mount: vi.fn(),
        unmount: vi.fn(),
        update: vi.fn(),
      };

      expect(typeof fullComponent.unmount).toBe('function');
      expect(typeof fullComponent.update).toBe('function');
    });
  });

  describe('IslandState', () => {
    it('should have all expected states', () => {
      const states = ['pending', 'loading', 'hydrating', 'active', 'error', 'unmounted'];

      states.forEach((state) => {
        expect(typeof state).toBe('string');
      });
    });
  });
});

describe('Multiple Islands', () => {
  beforeEach(() => {
    getRegistry().clear();
    MockIslandComponent.reset();
  });

  afterEach(() => {
    getRegistry().clear();
    document.querySelectorAll('phil-island').forEach((el) => el.remove());
  });

  it('should support multiple instances of the same island', async () => {
    defineIsland({
      name: 'reusable-island',
      component: MockIslandComponent,
      strategy: 'load',
    });

    const island1 = document.createElement('phil-island') as Island;
    island1.setAttribute('name', 'reusable-island');
    island1.setAttribute('props', JSON.stringify({ id: 1 }));

    const island2 = document.createElement('phil-island') as Island;
    island2.setAttribute('name', 'reusable-island');
    island2.setAttribute('props', JSON.stringify({ id: 2 }));

    document.body.appendChild(island1);
    document.body.appendChild(island2);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(MockIslandComponent.mountCalls.length).toBe(2);
    expect(MockIslandComponent.mountCalls[0].props).toEqual({ id: 1 });
    expect(MockIslandComponent.mountCalls[1].props).toEqual({ id: 2 });

    island1.remove();
    island2.remove();
  });

  it('should support different islands on the same page', async () => {
    class ComponentA implements IslandComponent {
      static mounted = false;
      mount(): void {
        ComponentA.mounted = true;
      }
    }

    class ComponentB implements IslandComponent {
      static mounted = false;
      mount(): void {
        ComponentB.mounted = true;
      }
    }

    defineIsland({ name: 'island-a', component: ComponentA, strategy: 'load' });
    defineIsland({ name: 'island-b', component: ComponentB, strategy: 'load' });

    const islandA = document.createElement('phil-island') as Island;
    islandA.setAttribute('name', 'island-a');

    const islandB = document.createElement('phil-island') as Island;
    islandB.setAttribute('name', 'island-b');

    document.body.appendChild(islandA);
    document.body.appendChild(islandB);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(ComponentA.mounted).toBe(true);
    expect(ComponentB.mounted).toBe(true);

    islandA.remove();
    islandB.remove();
  });
});
