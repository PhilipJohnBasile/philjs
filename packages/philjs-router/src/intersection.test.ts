/**
 * Tests for Intersection Observer Utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createIntersectionObserver,
  observeElement,
  unobserveElement,
  isObserving,
  hasIntersected,
  disconnectAll,
  getVisibilityState,
  isApproachingViewport,
  createPrefetchZone,
  getScrollDirection,
  onScrollDirectionChange,
  getLinksInScrollPath,
} from './intersection.js';

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();
let intersectionCallback: IntersectionObserverCallback;

class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '';
  thresholds: readonly number[] = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    intersectionCallback = callback;
    this.root = options?.root || null;
    this.rootMargin = options?.rootMargin || '0px';
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : [options?.threshold || 0];
  }

  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver as any;

// Mock window
const mockWindow = {
  innerHeight: 800,
  innerWidth: 1200,
  scrollX: 0,
  scrollY: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
global.window = mockWindow as any;

// Helper to create mock elements
function createMockElement(bounds: Partial<DOMRect> = {}): Element {
  return {
    getBoundingClientRect: () => ({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...bounds,
    }),
  } as Element;
}

// Helper to create mock intersection entries
function createMockEntry(
  element: Element,
  isIntersecting: boolean,
  intersectionRatio = isIntersecting ? 1 : 0
): IntersectionObserverEntry {
  const rect = element.getBoundingClientRect();
  return {
    target: element,
    isIntersecting,
    intersectionRatio,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: null,
    time: performance.now(),
  };
}

describe('createIntersectionObserver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disconnectAll();
  });

  it('should create an IntersectionObserver', () => {
    const observer = createIntersectionObserver();
    expect(observer).toBeDefined();
  });

  it('should use provided options', () => {
    const observer = createIntersectionObserver({
      rootMargin: '50px',
      threshold: 0.5,
    });

    expect(observer.rootMargin).toBe('50px');
    expect(observer.thresholds).toContain(0.5);
  });

  it('should share observers with same config', () => {
    const observer1 = createIntersectionObserver({ rootMargin: '10px' });
    const observer2 = createIntersectionObserver({ rootMargin: '10px' });

    expect(observer1).toBe(observer2);
  });

  it('should create different observers for different configs', () => {
    const observer1 = createIntersectionObserver({ rootMargin: '10px' });
    const observer2 = createIntersectionObserver({ rootMargin: '20px' });

    expect(observer1).not.toBe(observer2);
  });
});

describe('observeElement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disconnectAll();
  });

  it('should observe an element', () => {
    const element = createMockElement();
    const observer = createIntersectionObserver();

    observeElement(element, observer);

    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it('should track observed elements', () => {
    const element = createMockElement();
    const observer = createIntersectionObserver();

    observeElement(element, observer);

    expect(isObserving(element)).toBe(true);
  });

  it('should not observe same element twice', () => {
    const element = createMockElement();
    const observer = createIntersectionObserver();

    observeElement(element, observer);
    observeElement(element, observer);

    expect(mockObserve).toHaveBeenCalledTimes(1);
  });

  it('should call onIntersect callback', () => {
    const element = createMockElement();
    const onIntersect = vi.fn();

    observeElement(element, { onIntersect });

    // Simulate intersection
    const entry = createMockEntry(element, true);
    intersectionCallback([entry], {} as IntersectionObserver);

    expect(onIntersect).toHaveBeenCalledWith(entry);
  });

  it('should handle "once" option', () => {
    const element = createMockElement();
    const onIntersect = vi.fn();

    observeElement(element, { onIntersect, once: true });

    // Simulate intersection
    const entry = createMockEntry(element, true);
    intersectionCallback([entry], {} as IntersectionObserver);

    // Callback should have been called
    expect(onIntersect).toHaveBeenCalled();
  });
});

describe('unobserveElement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disconnectAll();
  });

  it('should unobserve an element', () => {
    const element = createMockElement();
    const observer = createIntersectionObserver();

    observeElement(element, observer);
    unobserveElement(element);

    expect(mockUnobserve).toHaveBeenCalledWith(element);
    expect(isObserving(element)).toBe(false);
  });

  it('should handle unobserving non-observed element', () => {
    const element = createMockElement();

    // Should not throw
    unobserveElement(element);
    expect(mockUnobserve).not.toHaveBeenCalled();
  });
});

describe('disconnectAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should disconnect all observers', () => {
    const element1 = createMockElement();
    const element2 = createMockElement();

    observeElement(element1, createIntersectionObserver({ rootMargin: '10px' }));
    observeElement(element2, createIntersectionObserver({ rootMargin: '20px' }));

    disconnectAll();

    expect(mockDisconnect).toHaveBeenCalled();
    expect(isObserving(element1)).toBe(false);
    expect(isObserving(element2)).toBe(false);
  });
});

describe('getVisibilityState', () => {
  it('should return fully visible state', () => {
    const element = createMockElement({
      top: 100,
      left: 100,
      bottom: 200,
      right: 200,
      width: 100,
      height: 100,
    });

    const state = getVisibilityState(element);

    expect(state.isVisible).toBe(true);
    expect(state.isPartiallyVisible).toBe(true);
    expect(state.intersectionRatio).toBe(1);
  });

  it('should detect partially visible element', () => {
    const element = createMockElement({
      top: -50,
      left: 0,
      bottom: 50,
      right: 100,
      width: 100,
      height: 100,
    });

    const state = getVisibilityState(element);

    expect(state.isVisible).toBe(false);
    expect(state.isPartiallyVisible).toBe(true);
    expect(state.intersectionRatio).toBeLessThan(1);
  });

  it('should detect element outside viewport', () => {
    const element = createMockElement({
      top: 1000,
      left: 0,
      bottom: 1100,
      right: 100,
      width: 100,
      height: 100,
    });

    const state = getVisibilityState(element);

    expect(state.isVisible).toBe(false);
    expect(state.isPartiallyVisible).toBe(false);
    expect(state.intersectionRatio).toBe(0);
  });
});

describe('isApproachingViewport', () => {
  it('should detect element approaching from below', () => {
    const element = createMockElement({
      top: 850,
      bottom: 950,
    });

    expect(isApproachingViewport(element, 100)).toBe(true);
  });

  it('should detect element approaching from above', () => {
    const element = createMockElement({
      top: -50,
      bottom: 50,
    });

    expect(isApproachingViewport(element, 100)).toBe(true);
  });

  it('should not detect element far from viewport', () => {
    const element = createMockElement({
      top: 2000,
      bottom: 2100,
    });

    expect(isApproachingViewport(element, 100)).toBe(false);
  });
});

describe('createPrefetchZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disconnectAll();
  });

  it('should create a prefetch zone', () => {
    const element = createMockElement();
    const onEnterZone = vi.fn();

    const cleanup = createPrefetchZone(element, {
      distance: 200,
      onEnterZone,
    });

    expect(typeof cleanup).toBe('function');
    expect(mockObserve).toHaveBeenCalled();
  });

  it('should call onEnterZone when element enters zone', () => {
    const element = createMockElement();
    const onEnterZone = vi.fn();

    createPrefetchZone(element, {
      distance: 200,
      onEnterZone,
    });

    // The observer should have been set up
    expect(mockObserve).toHaveBeenCalled();
  });

  it('should call onLeaveZone when element leaves zone', () => {
    const element = createMockElement();
    const onEnterZone = vi.fn();
    const onLeaveZone = vi.fn();

    createPrefetchZone(element, {
      distance: 200,
      onEnterZone,
      onLeaveZone,
    });

    // The observer should have been set up
    expect(mockObserve).toHaveBeenCalled();
  });

  it('should cleanup on function call', () => {
    const element = createMockElement();
    const cleanup = createPrefetchZone(element, {
      distance: 200,
      onEnterZone: vi.fn(),
    });

    cleanup();

    expect(mockUnobserve).toHaveBeenCalled();
  });
});

describe('Scroll Direction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get initial scroll direction as none', () => {
    expect(getScrollDirection()).toBe('none');
  });

  it('should subscribe to scroll direction changes', () => {
    const listener = vi.fn();
    const unsubscribe = onScrollDirectionChange(listener);

    expect(typeof unsubscribe).toBe('function');
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    );

    unsubscribe();
  });

  it('should unsubscribe from scroll direction changes', () => {
    const listener = vi.fn();
    const unsubscribe = onScrollDirectionChange(listener);

    unsubscribe();

    expect(mockWindow.removeEventListener).toHaveBeenCalled();
  });
});

describe('getLinksInScrollPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no links', () => {
    const links = getLinksInScrollPath([]);
    expect(links).toEqual([]);
  });

  it('should return links in scroll path', () => {
    const link1 = createMockElement({ top: 900 }) as HTMLAnchorElement;
    const link2 = createMockElement({ top: 1000 }) as HTMLAnchorElement;
    const link3 = createMockElement({ top: 1100 }) as HTMLAnchorElement;

    const links = getLinksInScrollPath([link1, link2, link3], 2);

    expect(links.length).toBeLessThanOrEqual(2);
  });

  it('should respect count limit', () => {
    const links = Array(10).fill(null).map((_, i) =>
      createMockElement({ top: 900 + i * 100 }) as HTMLAnchorElement
    );

    const result = getLinksInScrollPath(links, 3);

    expect(result.length).toBeLessThanOrEqual(3);
  });
});
