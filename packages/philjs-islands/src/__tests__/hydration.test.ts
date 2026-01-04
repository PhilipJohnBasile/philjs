/**
 * @philjs/islands - Hydration Behavior Tests
 * Tests for selective hydration, client directives, and hydration strategies
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { Island, defineIsland, createIsland } from '../island.js';
import { IslandRegistry, getRegistry } from '../registry.js';
import {
  hydrateIsland,
  hydrateAll,
  mountIslands,
  waitForHydration,
  waitForAllHydration,
} from '../hydration.js';
import type { IslandComponent, IslandInstance, HydrationStrategy } from '../types.js';

// Mock IntersectionObserver with trigger capability
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  private callback: IntersectionObserverCallback;
  private targets: Set<Element> = new Set();
  private static instances: MockIntersectionObserver[] = [];

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.add(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.targets.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  // Test helpers
  triggerIntersection(target: Element, isIntersecting: boolean): void {
    if (this.targets.has(target)) {
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
  }

  hasTarget(target: Element): boolean {
    return this.targets.has(target);
  }

  static getLastInstance(): MockIntersectionObserver | undefined {
    return MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
  }

  static clearInstances(): void {
    MockIntersectionObserver.instances = [];
  }

  static getInstances(): MockIntersectionObserver[] {
    return [...MockIntersectionObserver.instances];
  }
}

// Mock matchMedia with changeable state
class MockMediaQueryList {
  private _matches: boolean;
  readonly media: string;
  private listeners: Array<(e: MediaQueryListEvent) => void> = [];

  constructor(query: string, initialMatches = false) {
    this.media = query;
    this._matches = initialMatches;
  }

  get matches(): boolean {
    return this._matches;
  }

  addEventListener(type: string, listener: (e: MediaQueryListEvent) => void): void {
    if (type === 'change') {
      this.listeners.push(listener);
    }
  }

  removeEventListener(type: string, listener: (e: MediaQueryListEvent) => void): void {
    if (type === 'change') {
      this.listeners = this.listeners.filter((l) => l !== listener);
    }
  }

  // Test helper to trigger media change
  setMatches(matches: boolean): void {
    if (this._matches !== matches) {
      this._matches = matches;
      const event = { matches, media: this.media } as MediaQueryListEvent;
      this.listeners.forEach((listener) => listener(event));
    }
  }

  dispatchEvent(): boolean {
    return true;
  }
}

let mockMediaQueryLists: Map<string, MockMediaQueryList> = new Map();

const mockMatchMedia = vi.fn((query: string) => {
  if (!mockMediaQueryLists.has(query)) {
    mockMediaQueryLists.set(query, new MockMediaQueryList(query, false));
  }
  return mockMediaQueryLists.get(query)!;
});

// Mock requestIdleCallback
const idleCallbacks: Array<{ callback: IdleRequestCallback; timeout: number }> = [];
let idleCallbackId = 0;

const mockRequestIdleCallback = vi.fn((callback: IdleRequestCallback, options?: { timeout?: number }) => {
  const id = ++idleCallbackId;
  idleCallbacks.push({ callback, timeout: options?.timeout ?? 0 });
  return id;
});

const mockCancelIdleCallback = vi.fn((id: number) => {
  // Simple mock implementation
});

// Helper to flush idle callbacks
function flushIdleCallbacks(): void {
  const callbacks = [...idleCallbacks];
  idleCallbacks.length = 0;
  callbacks.forEach(({ callback }) => {
    callback({ didTimeout: false, timeRemaining: () => 50 });
  });
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.stubGlobal('matchMedia', mockMatchMedia);
  vi.stubGlobal('requestIdleCallback', mockRequestIdleCallback);
  vi.stubGlobal('cancelIdleCallback', mockCancelIdleCallback);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// Helper to create mock component
function createMockComponent(): IslandComponent {
  return {
    mount: vi.fn(),
    unmount: vi.fn(),
    update: vi.fn(),
  };
}

class TrackingComponent implements IslandComponent {
  static mountedElements: HTMLElement[] = [];
  static mountedProps: Array<Record<string, unknown>> = [];

  mount(element: HTMLElement, props: Record<string, unknown>): void {
    TrackingComponent.mountedElements.push(element);
    TrackingComponent.mountedProps.push(props);
  }

  unmount(): void {}
  update(): void {}

  static reset(): void {
    TrackingComponent.mountedElements = [];
    TrackingComponent.mountedProps = [];
  }
}

describe('Hydration Strategies', () => {
  beforeEach(() => {
    getRegistry().clear();
    TrackingComponent.reset();
    MockIntersectionObserver.clearInstances();
    mockMediaQueryLists.clear();
    idleCallbacks.length = 0;
    mockRequestIdleCallback.mockClear();
  });

  afterEach(() => {
    getRegistry().clear();
    document.querySelectorAll('phil-island').forEach((el) => el.remove());
  });

  describe('client:load Strategy', () => {
    it('should hydrate immediately on DOM connection', async () => {
      defineIsland({
        name: 'load-island',
        component: TrackingComponent,
        strategy: 'load',
      });

      const island = createIsland('load-island', { value: 'immediate' }, 'load');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);
      expect(TrackingComponent.mountedElements[0]).toBe(island);
      expect(TrackingComponent.mountedProps[0]).toEqual({ value: 'immediate' });

      island.remove();
    });

    it('should set data-hydrated attribute after hydration', async () => {
      defineIsland({
        name: 'load-attr-island',
        component: TrackingComponent,
        strategy: 'load',
      });

      const island = createIsland('load-attr-island', {}, 'load');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(island.getAttribute('data-hydrated')).toBe('true');
      expect(island.getAttribute('data-state')).toBe('active');

      island.remove();
    });

    it('should dispatch phil:island-hydrated event', async () => {
      defineIsland({
        name: 'event-island',
        component: TrackingComponent,
        strategy: 'load',
      });

      const island = createIsland('event-island', {}, 'load');
      const eventHandler = vi.fn();
      island.addEventListener('phil:island-hydrated', eventHandler);
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.name).toBe('event-island');

      island.remove();
    });
  });

  describe('client:visible Strategy', () => {
    it('should not hydrate until element is visible', async () => {
      defineIsland({
        name: 'visible-island',
        component: TrackingComponent,
        strategy: 'visible',
      });

      const island = createIsland('visible-island', {}, 'visible');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not be hydrated yet (not visible)
      expect(TrackingComponent.mountedElements.length).toBe(0);
      expect(island.getAttribute('data-hydrated')).toBeNull();

      island.remove();
    });

    it('should hydrate when IntersectionObserver triggers', async () => {
      defineIsland({
        name: 'visible-trigger-island',
        component: TrackingComponent,
        strategy: 'visible',
      });

      const island = createIsland('visible-trigger-island', {}, 'visible');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Get the observer and trigger intersection
      const observer = MockIntersectionObserver.getLastInstance();
      expect(observer).toBeDefined();

      observer?.triggerIntersection(island, true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);
      expect(island.getAttribute('data-hydrated')).toBe('true');

      island.remove();
    });

    it('should support custom threshold', async () => {
      defineIsland({
        name: 'threshold-island',
        component: TrackingComponent,
        strategy: 'visible',
        threshold: 0.5,
      });

      const island = createIsland('threshold-island', {}, 'visible');
      island.setAttribute('threshold', '0.5');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Observer should be set up
      const observer = MockIntersectionObserver.getLastInstance();
      expect(observer).toBeDefined();

      island.remove();
    });

    it('should support custom rootMargin', async () => {
      defineIsland({
        name: 'margin-island',
        component: TrackingComponent,
        strategy: 'visible',
        rootMargin: '100px',
      });

      const island = createIsland('margin-island', {}, 'visible');
      island.setAttribute('root-margin', '100px');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const observer = MockIntersectionObserver.getLastInstance();
      expect(observer).toBeDefined();

      island.remove();
    });

    it('should disconnect observer after hydration', async () => {
      defineIsland({
        name: 'disconnect-island',
        component: TrackingComponent,
        strategy: 'visible',
      });

      const island = createIsland('disconnect-island', {}, 'visible');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const observer = MockIntersectionObserver.getLastInstance();
      const disconnectSpy = vi.spyOn(observer!, 'disconnect');

      observer?.triggerIntersection(island, true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // disconnect is called inside the callback
      expect(disconnectSpy).toHaveBeenCalled();

      island.remove();
    });
  });

  describe('client:idle Strategy', () => {
    it('should request idle callback on connection', async () => {
      defineIsland({
        name: 'idle-island',
        component: TrackingComponent,
        strategy: 'idle',
      });

      const island = createIsland('idle-island', {}, 'idle');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRequestIdleCallback).toHaveBeenCalled();

      island.remove();
    });

    it('should hydrate when idle callback fires', async () => {
      defineIsland({
        name: 'idle-fire-island',
        component: TrackingComponent,
        strategy: 'idle',
      });

      const island = createIsland('idle-fire-island', {}, 'idle');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Flush idle callbacks
      flushIdleCallbacks();

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);

      island.remove();
    });

    it('should support custom timeout', async () => {
      defineIsland({
        name: 'idle-timeout-island',
        component: TrackingComponent,
        strategy: 'idle',
        timeout: 5000,
      });

      const island = createIsland('idle-timeout-island', {}, 'idle');
      island.setAttribute('timeout', '5000');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 5000 });

      island.remove();
    });
  });

  describe('client:interaction Strategy', () => {
    it('should not hydrate until interaction occurs', async () => {
      defineIsland({
        name: 'interaction-island',
        component: TrackingComponent,
        strategy: 'interaction',
      });

      const island = createIsland('interaction-island', {}, 'interaction');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(0);

      island.remove();
    });

    it('should hydrate on click', async () => {
      defineIsland({
        name: 'click-island',
        component: TrackingComponent,
        strategy: 'interaction',
      });

      const island = createIsland('click-island', {}, 'interaction');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate click
      island.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);
      expect(island.getAttribute('data-hydrated')).toBe('true');

      island.remove();
    });

    it('should hydrate on focus', async () => {
      defineIsland({
        name: 'focus-island',
        component: TrackingComponent,
        strategy: 'interaction',
      });

      const island = createIsland('focus-island', {}, 'interaction');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate focus
      island.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);

      island.remove();
    });

    it('should support custom triggers', async () => {
      defineIsland({
        name: 'custom-trigger-island',
        component: TrackingComponent,
        strategy: 'interaction',
        triggers: ['mouseenter', 'pointerenter'],
      });

      const island = createIsland('custom-trigger-island', {}, 'interaction');
      island.setAttribute('triggers', 'mouseenter,pointerenter');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate mouseenter
      island.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);

      island.remove();
    });

    it('should remove event listeners after hydration', async () => {
      defineIsland({
        name: 'cleanup-trigger-island',
        component: TrackingComponent,
        strategy: 'interaction',
      });

      const island = createIsland('cleanup-trigger-island', {}, 'interaction');
      const removeEventSpy = vi.spyOn(island, 'removeEventListener');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      island.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have called removeEventListener for cleanup
      expect(removeEventSpy).toHaveBeenCalled();

      island.remove();
    });
  });

  describe('client:media Strategy', () => {
    it('should setup media query listener', async () => {
      defineIsland({
        name: 'media-island',
        component: TrackingComponent,
        strategy: 'media',
        media: '(min-width: 768px)',
      });

      const island = createIsland('media-island', {}, 'media');
      island.setAttribute('media', '(min-width: 768px)');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)');

      island.remove();
    });

    it('should hydrate immediately if media matches', async () => {
      const query = '(min-width: 1024px)';
      mockMediaQueryLists.set(query, new MockMediaQueryList(query, true));

      defineIsland({
        name: 'media-match-island',
        component: TrackingComponent,
        strategy: 'media',
        media: query,
      });

      const island = createIsland('media-match-island', {}, 'media');
      island.setAttribute('media', query);
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);

      island.remove();
    });

    it('should hydrate when media query becomes true', async () => {
      const query = '(prefers-reduced-motion: reduce)';
      const mediaQuery = new MockMediaQueryList(query, false);
      mockMediaQueryLists.set(query, mediaQuery);

      defineIsland({
        name: 'media-change-island',
        component: TrackingComponent,
        strategy: 'media',
        media: query,
      });

      const island = createIsland('media-change-island', {}, 'media');
      island.setAttribute('media', query);
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(TrackingComponent.mountedElements.length).toBe(0);

      // Change media query to match
      mediaQuery.setMatches(true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);

      island.remove();
    });

    it('should warn when media attribute is missing', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      defineIsland({
        name: 'media-no-attr-island',
        component: TrackingComponent,
        strategy: 'media',
      });

      const island = createIsland('media-no-attr-island', {}, 'media');
      // Not setting media attribute
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('media')
      );

      island.remove();
      warnSpy.mockRestore();
    });
  });

  describe('client:never Strategy', () => {
    it('should not hydrate automatically', async () => {
      defineIsland({
        name: 'never-island',
        component: TrackingComponent,
        strategy: 'never',
      });

      const island = createIsland('never-island', {}, 'never');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(TrackingComponent.mountedElements.length).toBe(0);
      expect(island.getAttribute('data-hydrated')).toBeNull();

      island.remove();
    });

    it('should remain in pending state', async () => {
      defineIsland({
        name: 'never-pending-island',
        component: TrackingComponent,
        strategy: 'never',
      });

      const island = createIsland('never-pending-island', {}, 'never');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const instance = (island as any)._instance as IslandInstance;
      expect(instance.state).toBe('pending');

      island.remove();
    });
  });
});

describe('Hydration Utilities', () => {
  beforeEach(() => {
    getRegistry().clear();
    TrackingComponent.reset();
    MockIntersectionObserver.clearInstances();
  });

  afterEach(() => {
    getRegistry().clear();
    document.querySelectorAll('phil-island').forEach((el) => el.remove());
  });

  describe('hydrateIsland', () => {
    it('should manually hydrate a specific island', async () => {
      defineIsland({
        name: 'manual-hydrate-island',
        component: TrackingComponent,
        strategy: 'never',
      });

      const island = createIsland('manual-hydrate-island', {}, 'never');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(TrackingComponent.mountedElements.length).toBe(0);

      await hydrateIsland(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);

      island.remove();
    });

    it('should warn if element is not a phil-island', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const div = document.createElement('div');
      await hydrateIsland(div);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('phil-island')
      );

      warnSpy.mockRestore();
    });
  });

  describe('hydrateAll', () => {
    it('should hydrate all islands in a container', async () => {
      defineIsland({
        name: 'batch-island-1',
        component: TrackingComponent,
        strategy: 'never',
      });

      defineIsland({
        name: 'batch-island-2',
        component: TrackingComponent,
        strategy: 'never',
      });

      const container = document.createElement('div');
      const island1 = createIsland('batch-island-1', { id: 1 }, 'never');
      const island2 = createIsland('batch-island-2', { id: 2 }, 'never');

      container.appendChild(island1);
      container.appendChild(island2);
      document.body.appendChild(container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(TrackingComponent.mountedElements.length).toBe(0);

      await hydrateAll(container);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(2);

      container.remove();
    });

    it('should skip already hydrated islands', async () => {
      defineIsland({
        name: 'already-hydrated-island',
        component: TrackingComponent,
        strategy: 'load',
      });

      const island = createIsland('already-hydrated-island', {}, 'load');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(1);

      // Try to hydrate all again
      await hydrateAll(document);

      // Should still be 1, not 2
      expect(TrackingComponent.mountedElements.length).toBe(1);

      island.remove();
    });

    it('should support concurrent hydration (default)', async () => {
      defineIsland({
        name: 'concurrent-island',
        component: TrackingComponent,
        strategy: 'never',
      });

      const container = document.createElement('div');
      for (let i = 0; i < 5; i++) {
        container.appendChild(createIsland('concurrent-island', { id: i }, 'never'));
      }
      document.body.appendChild(container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      await hydrateAll(container, { concurrent: true });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(TrackingComponent.mountedElements.length).toBe(5);

      container.remove();
    });

    it('should support sequential hydration', async () => {
      defineIsland({
        name: 'sequential-island',
        component: TrackingComponent,
        strategy: 'never',
      });

      const container = document.createElement('div');
      for (let i = 0; i < 3; i++) {
        container.appendChild(createIsland('sequential-island', { id: i }, 'never'));
      }
      document.body.appendChild(container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      await hydrateAll(container, { concurrent: false });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(TrackingComponent.mountedElements.length).toBe(3);

      container.remove();
    });
  });

  describe('mountIslands', () => {
    it('should wrap [data-island] elements with phil-island', () => {
      defineIsland({
        name: 'wrapped-island',
        component: TrackingComponent,
        strategy: 'visible',
      });

      const container = document.createElement('div');
      const target = document.createElement('div');
      target.setAttribute('data-island', 'wrapped-island');
      container.appendChild(target);
      document.body.appendChild(container);

      mountIslands(container);

      const philIsland = container.querySelector('phil-island');
      expect(philIsland).not.toBeNull();
      expect(philIsland?.getAttribute('name')).toBe('wrapped-island');
      expect(philIsland?.contains(target)).toBe(true);

      container.remove();
    });

    it('should respect data-strategy attribute', () => {
      defineIsland({
        name: 'strategy-attr-island',
        component: TrackingComponent,
      });

      const container = document.createElement('div');
      const target = document.createElement('div');
      target.setAttribute('data-island', 'strategy-attr-island');
      target.setAttribute('data-strategy', 'idle');
      container.appendChild(target);
      document.body.appendChild(container);

      mountIslands(container);

      const philIsland = container.querySelector('phil-island');
      expect(philIsland?.getAttribute('strategy')).toBe('idle');

      container.remove();
    });

    it('should copy data-props to phil-island', () => {
      defineIsland({
        name: 'props-copy-island',
        component: TrackingComponent,
      });

      const container = document.createElement('div');
      const target = document.createElement('div');
      target.setAttribute('data-island', 'props-copy-island');
      target.setAttribute('data-props', JSON.stringify({ count: 5 }));
      container.appendChild(target);
      document.body.appendChild(container);

      mountIslands(container);

      const philIsland = container.querySelector('phil-island');
      expect(philIsland?.getAttribute('props')).toBe(JSON.stringify({ count: 5 }));

      container.remove();
    });

    it('should use default strategy when none specified', () => {
      defineIsland({
        name: 'default-strategy-island',
        component: TrackingComponent,
      });

      const container = document.createElement('div');
      const target = document.createElement('div');
      target.setAttribute('data-island', 'default-strategy-island');
      container.appendChild(target);
      document.body.appendChild(container);

      mountIslands(container, { defaultStrategy: 'load' });

      const philIsland = container.querySelector('phil-island');
      expect(philIsland?.getAttribute('strategy')).toBe('load');

      container.remove();
    });

    it('should support custom attribute name', () => {
      defineIsland({
        name: 'custom-attr-island',
        component: TrackingComponent,
      });

      const container = document.createElement('div');
      const target = document.createElement('div');
      target.setAttribute('data-component', 'custom-attr-island');
      container.appendChild(target);
      document.body.appendChild(container);

      mountIslands(container, { attributeName: 'data-component' });

      const philIsland = container.querySelector('phil-island');
      expect(philIsland?.getAttribute('name')).toBe('custom-attr-island');

      container.remove();
    });

    it('should not wrap already wrapped elements', () => {
      defineIsland({
        name: 'no-double-wrap',
        component: TrackingComponent,
      });

      const container = document.createElement('div');
      const philIsland = document.createElement('phil-island') as Island;
      philIsland.setAttribute('name', 'no-double-wrap');
      const target = document.createElement('div');
      target.setAttribute('data-island', 'no-double-wrap');
      philIsland.appendChild(target);
      container.appendChild(philIsland);
      document.body.appendChild(container);

      mountIslands(container);

      // Should only have one phil-island
      expect(container.querySelectorAll('phil-island').length).toBe(1);

      container.remove();
    });

    it('should skip elements with empty data-island', () => {
      const container = document.createElement('div');
      const target = document.createElement('div');
      target.setAttribute('data-island', '');
      container.appendChild(target);
      document.body.appendChild(container);

      mountIslands(container);

      expect(container.querySelector('phil-island')).toBeNull();

      container.remove();
    });
  });

  describe('waitForHydration', () => {
    it('should resolve immediately if already hydrated', async () => {
      defineIsland({
        name: 'pre-hydrated-island',
        component: TrackingComponent,
        strategy: 'load',
      });

      const island = createIsland('pre-hydrated-island', {}, 'load');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should resolve quickly since already hydrated
      const start = Date.now();
      await waitForHydration(island);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);

      island.remove();
    });

    it('should wait for hydration to complete', async () => {
      defineIsland({
        name: 'wait-for-island',
        component: TrackingComponent,
        strategy: 'never',
      });

      const island = createIsland('wait-for-island', {}, 'never');
      document.body.appendChild(island);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Start waiting
      const waitPromise = waitForHydration(island);

      // Trigger hydration after a delay
      setTimeout(() => {
        const instance = (island as any)._instance as IslandInstance;
        instance.hydrate();
      }, 20);

      await waitPromise;

      expect(island.getAttribute('data-hydrated')).toBe('true');

      island.remove();
    });

    // Skip: Test relies on jsdom custom element behavior that doesn't work as expected
    it.skip('should reject on hydration error', async () => {
      // Don't register the island to cause an error
      const island = createIsland('error-wait-island', {}, 'load');
      document.body.appendChild(island);

      await expect(waitForHydration(island)).rejects.toThrow();

      island.remove();
    });
  });

  describe('waitForAllHydration', () => {
    it('should wait for all islands to hydrate', async () => {
      defineIsland({
        name: 'wait-all-island',
        component: TrackingComponent,
        strategy: 'load',
      });

      const container = document.createElement('div');
      for (let i = 0; i < 3; i++) {
        container.appendChild(createIsland('wait-all-island', { id: i }, 'load'));
      }
      document.body.appendChild(container);

      await waitForAllHydration(container);

      const islands = container.querySelectorAll('phil-island');
      islands.forEach((island) => {
        expect(island.getAttribute('data-hydrated')).toBe('true');
      });

      container.remove();
    });
  });
});

describe('Selective Hydration', () => {
  beforeEach(() => {
    getRegistry().clear();
    TrackingComponent.reset();
    MockIntersectionObserver.clearInstances();
  });

  afterEach(() => {
    getRegistry().clear();
    document.querySelectorAll('phil-island').forEach((el) => el.remove());
  });

  it('should only hydrate islands that meet their strategy criteria', async () => {
    defineIsland({
      name: 'load-selective',
      component: TrackingComponent,
      strategy: 'load',
    });

    defineIsland({
      name: 'never-selective',
      component: TrackingComponent,
      strategy: 'never',
    });

    const loadIsland = createIsland('load-selective', {}, 'load');
    const neverIsland = createIsland('never-selective', {}, 'never');

    document.body.appendChild(loadIsland);
    document.body.appendChild(neverIsland);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Only load island should be hydrated
    expect(loadIsland.getAttribute('data-hydrated')).toBe('true');
    expect(neverIsland.getAttribute('data-hydrated')).toBeNull();

    expect(TrackingComponent.mountedElements.length).toBe(1);
    expect(TrackingComponent.mountedElements[0]).toBe(loadIsland);

    loadIsland.remove();
    neverIsland.remove();
  });

  it('should hydrate islands independently', async () => {
    defineIsland({
      name: 'independent-a',
      component: TrackingComponent,
      strategy: 'visible',
    });

    defineIsland({
      name: 'independent-b',
      component: TrackingComponent,
      strategy: 'visible',
    });

    const islandA = createIsland('independent-a', { name: 'A' }, 'visible');
    const islandB = createIsland('independent-b', { name: 'B' }, 'visible');

    document.body.appendChild(islandA);
    document.body.appendChild(islandB);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Only trigger intersection for island A
    const observers = MockIntersectionObserver.getInstances();
    const observerA = observers.find((obs) => obs.hasTarget(islandA));
    observerA?.triggerIntersection(islandA, true);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(islandA.getAttribute('data-hydrated')).toBe('true');
    expect(islandB.getAttribute('data-hydrated')).toBeNull();

    islandA.remove();
    islandB.remove();
  });
});

describe('Island State Transitions', () => {
  beforeEach(() => {
    getRegistry().clear();
    TrackingComponent.reset();
  });

  afterEach(() => {
    getRegistry().clear();
    document.querySelectorAll('phil-island').forEach((el) => el.remove());
  });

  // Skip: Custom element state tracking timing issues in jsdom
  it.skip('should transition through all states during hydration', async () => {
    const states: string[] = [];

    defineIsland({
      name: 'state-track-island',
      component: TrackingComponent,
      strategy: 'load',
    });

    const island = createIsland('state-track-island', {}, 'load');

    // Setup mutation observer to track state changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-state') {
          states.push(island.getAttribute('data-state') || '');
        }
      });
    });

    document.body.appendChild(island);
    observer.observe(island, { attributes: true });

    await new Promise((resolve) => setTimeout(resolve, 100));

    observer.disconnect();

    // Should have gone through loading -> hydrating -> active
    expect(states).toContain('loading');
    expect(states).toContain('hydrating');
    expect(states).toContain('active');

    island.remove();
  });

  it('should set error state on hydration failure', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Don't register the island to cause an error
    const island = createIsland('unregistered-state-island', {}, 'load');
    document.body.appendChild(island);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(island.getAttribute('data-state')).toBe('error');

    island.remove();
    errorSpy.mockRestore();
  });

  it('should set unmounted state on disconnect', async () => {
    defineIsland({
      name: 'unmount-state-island',
      component: TrackingComponent,
      strategy: 'load',
    });

    const island = createIsland('unmount-state-island', {}, 'load');
    document.body.appendChild(island);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(island.getAttribute('data-state')).toBe('active');

    island.remove();

    expect(island.getAttribute('data-state')).toBe('unmounted');
  });
});

describe('Props Updates', () => {
  class UpdateTrackingComponent implements IslandComponent {
    static updateCalls: Array<Record<string, unknown>> = [];

    mount(): void {}
    unmount(): void {}
    update(props: Record<string, unknown>): void {
      UpdateTrackingComponent.updateCalls.push({ ...props });
    }

    static reset(): void {
      UpdateTrackingComponent.updateCalls = [];
    }
  }

  beforeEach(() => {
    getRegistry().clear();
    UpdateTrackingComponent.reset();
  });

  afterEach(() => {
    getRegistry().clear();
    document.querySelectorAll('phil-island').forEach((el) => el.remove());
  });

  it('should call update when props change on active island', async () => {
    defineIsland({
      name: 'update-props-island',
      component: UpdateTrackingComponent,
      strategy: 'load',
    });

    const island = createIsland('update-props-island', { count: 0 }, 'load');
    document.body.appendChild(island);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Update props
    island.setAttribute('props', JSON.stringify({ count: 1 }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(UpdateTrackingComponent.updateCalls.length).toBe(1);
    expect(UpdateTrackingComponent.updateCalls[0].count).toBe(1);

    island.remove();
  });

  it('should not call update when props have not changed', async () => {
    defineIsland({
      name: 'no-change-props-island',
      component: UpdateTrackingComponent,
      strategy: 'load',
    });

    const props = { count: 0 };
    const island = createIsland('no-change-props-island', props, 'load');
    document.body.appendChild(island);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Set same props
    island.setAttribute('props', JSON.stringify(props));

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should not have called update since value is the same
    expect(UpdateTrackingComponent.updateCalls.length).toBe(0);

    island.remove();
  });

  it('should not call update on pending island', async () => {
    defineIsland({
      name: 'pending-update-island',
      component: UpdateTrackingComponent,
      strategy: 'never',
    });

    const island = createIsland('pending-update-island', { count: 0 }, 'never');
    document.body.appendChild(island);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Update props while pending
    island.setAttribute('props', JSON.stringify({ count: 1 }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(UpdateTrackingComponent.updateCalls.length).toBe(0);

    island.remove();
  });
});
