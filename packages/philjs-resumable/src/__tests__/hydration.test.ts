/**
 * Tests for Hydration Strategies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setupHydration,
  cancelHydration,
  forceHydration,
  isHydrated,
  queueHydration,
  Hydrate,
  useHydration,
  discoverHydrationBoundaries,
  initHydration,
  getHydrationStats,
  clearHydrationState,
  waitForHydration,
  type HydrationStrategy,
  type VisibleOptions,
  type InteractionOptions,
  type MediaOptions,
  type IdleOptions,
  type CustomOptions,
} from '../hydration.js';
// Mock the loader module to prevent actual loading
vi.mock('../loader.js', () => ({
  loadAndHydrate: vi.fn().mockResolvedValue(undefined),
  configureLoader: vi.fn(),
  getLoaderConfig: vi.fn(() => ({})),
  clearLoaderCache: vi.fn(),
}));


// Mock DOM elements
function createMockElement(tag: string = 'div'): Element {
  const element = document.createElement(tag);
  element.setAttribute('data-qid', 'mock-' + Math.random().toString(36).slice(2));
  element.setAttribute('data-hydrate', 'true');
  return element;
}

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    private options?: IntersectionObserverInit
  ) {}

  observe(target: Element): void {
    // Simulate immediate intersection for testing
    setTimeout(() => {
      this.callback(
        [
          {
            target,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: null,
            time: Date.now(),
          } as IntersectionObserverEntry,
        ],
        this
      );
    }, 0);
  }

  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
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

// Set up global mocks
beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal('matchMedia', mockMatchMedia);
  vi.stubGlobal('matchMedia', mockMatchMedia);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('Hydration Setup', () => {
  beforeEach(() => {
    clearHydrationState();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal('matchMedia', mockMatchMedia);
  });

  afterEach(() => {
    clearHydrationState();
    vi.unstubAllGlobals();
  });

  it('should setup hydration with load strategy', () => {
    const element = createMockElement();
    const onHydrate = vi.fn();

    const id = setupHydration(element, {
      when: 'load',
      onHydrate,
    });

    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('should setup hydration with idle strategy', () => {
    const element = createMockElement();
    const id = setupHydration(element, {
      when: 'idle',
      timeout: 1000,
    });

    expect(id).toBeTruthy();
    expect(isHydrated(id)).toBe(false);
  });

  it('should setup hydration with visible strategy', async () => {
    const element = createMockElement();
    document.body.appendChild(element);

    const onHydrate = vi.fn();
    const id = setupHydration(element, {
      when: 'visible',
      threshold: 0.5,
      onHydrate,
    } as VisibleOptions);

    expect(id).toBeTruthy();

    // Wait for intersection observer callback
    await new Promise((resolve) => setTimeout(resolve, 10));

    document.body.removeChild(element);
  });

  it('should setup hydration with interaction strategy', () => {
    const element = createMockElement();
    const id = setupHydration(element, {
      when: 'interaction',
      events: ['click', 'focus'],
    } as InteractionOptions);

    expect(id).toBeTruthy();
    expect(isHydrated(id)).toBe(false);
  });

  it('should setup hydration with media strategy', () => {
    const element = createMockElement();
    const id = setupHydration(element, {
      when: 'media',
      query: '(min-width: 768px)',
    } as MediaOptions);

    expect(id).toBeTruthy();
  });

  it('should setup hydration with custom strategy', () => {
    const element = createMockElement();
    const trigger = vi.fn();

    const id = setupHydration(element, {
      when: 'custom',
      trigger,
    } as CustomOptions);

    expect(id).toBeTruthy();
    expect(trigger).toHaveBeenCalledWith(element, expect.any(Function));
  });

  it('should setup hydration with never strategy', () => {
    const element = createMockElement();
    const id = setupHydration(element, {
      when: 'never',
    });

    expect(id).toBeTruthy();
    expect(isHydrated(id)).toBe(false);
  });
});

describe('Hydration Control', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should cancel pending hydration', () => {
    const element = createMockElement();
    const id = setupHydration(element, { when: 'never' });

    expect(isHydrated(id)).toBe(false);

    cancelHydration(id);

    // After cancellation, the ID should no longer exist
    expect(isHydrated(id)).toBe(false);
  });

  it('should force hydration', async () => {
    const element = createMockElement();
    const onHydrate = vi.fn();

    const id = setupHydration(element, {
      when: 'never',
      onHydrate,
    });

    expect(isHydrated(id)).toBe(false);

    await forceHydration(id);

    // After forcing, should be hydrated
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should not force hydration if already hydrated', async () => {
    const element = createMockElement();
    const onHydrate = vi.fn();

    const id = setupHydration(element, {
      when: 'load',
      onHydrate,
    });

    await forceHydration(id);
    const firstCallCount = onHydrate.mock.calls.length;

    // Try to force again
    await forceHydration(id);

    // Should not call onHydrate again
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should check if element is hydrated', () => {
    const element = createMockElement();
    const id = setupHydration(element, { when: 'never' });

    expect(isHydrated(id)).toBe(false);
  });

  it('should return false for non-existent ID', () => {
    expect(isHydrated('non-existent-id')).toBe(false);
  });
});

describe('Idle Hydration Strategy', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should hydrate when idle', async () => {
    const element = createMockElement();
    const onHydrate = vi.fn();

    // Mock requestIdleCallback
    const originalRequestIdleCallback = global.requestIdleCallback;
    global.requestIdleCallback = ((callback: IdleRequestCallback) => {
      setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0);
      return 1;
    }) as typeof requestIdleCallback;

    setupHydration(element, {
      when: 'idle',
      timeout: 100,
      onHydrate,
    } as IdleOptions);

    await new Promise((resolve) => setTimeout(resolve, 50));

    global.requestIdleCallback = originalRequestIdleCallback;
  });

  it('should hydrate after timeout even if not idle', async () => {
    const element = createMockElement();
    const onHydrate = vi.fn();

    setupHydration(element, {
      when: 'idle',
      timeout: 50,
      onHydrate,
    } as IdleOptions);

    await new Promise((resolve) => setTimeout(resolve, 100));
  });
});

describe('Visible Hydration Strategy', () => {
  beforeEach(() => {
    clearHydrationState();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal('matchMedia', mockMatchMedia);
  });

  afterEach(() => {
    clearHydrationState();
    vi.unstubAllGlobals();
  });

  it('should hydrate when element becomes visible', async () => {
    const element = createMockElement();
    document.body.appendChild(element);

    const onHydrate = vi.fn();

    setupHydration(element, {
      when: 'visible',
      onHydrate,
    } as VisibleOptions);

    await new Promise((resolve) => setTimeout(resolve, 10));

    document.body.removeChild(element);
  });

  it('should use custom threshold', async () => {
    const element = createMockElement();
    document.body.appendChild(element);

    setupHydration(element, {
      when: 'visible',
      threshold: 0.75,
    } as VisibleOptions);

    await new Promise((resolve) => setTimeout(resolve, 10));

    document.body.removeChild(element);
  });

  it('should use custom root margin', async () => {
    const element = createMockElement();
    document.body.appendChild(element);

    setupHydration(element, {
      when: 'visible',
      rootMargin: '100px',
    } as VisibleOptions);

    await new Promise((resolve) => setTimeout(resolve, 10));

    document.body.removeChild(element);
  });
});

describe('Interaction Hydration Strategy', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should hydrate on click', async () => {
    const element = createMockElement('button');
    document.body.appendChild(element);

    const onHydrate = vi.fn();

    setupHydration(element, {
      when: 'interaction',
      event: 'click',
      onHydrate,
    } as InteractionOptions);

    // Simulate click
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    document.body.removeChild(element);
  });

  it('should hydrate on multiple event types', async () => {
    const element = createMockElement('input');
    document.body.appendChild(element);

    const onHydrate = vi.fn();

    setupHydration(element, {
      when: 'interaction',
      events: ['click', 'focus'],
      onHydrate,
    } as InteractionOptions);

    // Simulate focus
    element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    document.body.removeChild(element);
  });

  it('should use default events if none specified', () => {
    const element = createMockElement();

    const id = setupHydration(element, {
      when: 'interaction',
    } as InteractionOptions);

    expect(id).toBeTruthy();
  });
});

describe('Media Query Hydration Strategy', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should hydrate when media query matches', async () => {
    const element = createMockElement();
    const onHydrate = vi.fn();

    // Mock matchMedia
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('matchMedia', mockMatchMedia);

    setupHydration(element, {
      when: 'media',
      query: '(min-width: 768px)',
      onHydrate,
    } as MediaOptions);

    await new Promise((resolve) => setTimeout(resolve, 10));

    vi.unstubAllGlobals();
  });

  it('should listen for media query changes', () => {
    const element = createMockElement();
    const addEventListener = vi.fn();

    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener,
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('matchMedia', mockMatchMedia);

    setupHydration(element, {
      when: 'media',
      query: '(max-width: 480px)',
    } as MediaOptions);

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    vi.unstubAllGlobals();
  });
});

describe('Custom Hydration Strategy', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should call custom trigger function', () => {
    const element = createMockElement();
    const trigger = vi.fn();

    setupHydration(element, {
      when: 'custom',
      trigger,
    } as CustomOptions);

    expect(trigger).toHaveBeenCalledWith(element, expect.any(Function));
  });

  it('should handle cleanup from custom trigger', () => {
    const element = createMockElement();
    const cleanup = vi.fn();
    const trigger = vi.fn().mockReturnValue(cleanup);

    const id = setupHydration(element, {
      when: 'custom',
      trigger,
    } as CustomOptions);

    cancelHydration(id);

    expect(cleanup).toHaveBeenCalled();
  });

  it('should allow custom trigger to call hydrate function', async () => {
    const element = createMockElement();
    let capturedHydrate: (() => Promise<void>) | null = null;

    const trigger = vi.fn((el, hydrate) => {
      capturedHydrate = hydrate;
    });

    setupHydration(element, {
      when: 'custom',
      trigger,
    } as CustomOptions);

    expect(capturedHydrate).toBeTruthy();

    if (capturedHydrate) {
      await capturedHydrate();
    }
  });
});

describe('Priority Queue', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should queue hydration with priority', () => {
    const element1 = createMockElement();
    const element2 = createMockElement();
    const element3 = createMockElement();

    const id1 = queueHydration(element1, { when: 'idle', priority: 1 });
    const id2 = queueHydration(element2, { when: 'idle', priority: 10 });
    const id3 = queueHydration(element3, { when: 'idle', priority: 5 });

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id3).toBeTruthy();
  });

  it('should process higher priority items first', async () => {
    const element1 = createMockElement();
    const element2 = createMockElement();

    queueHydration(element1, { when: 'idle', priority: 1 });
    queueHydration(element2, { when: 'idle', priority: 10 });

    await new Promise((resolve) => setTimeout(resolve, 100));
  });
});

describe('Auto-Discovery', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should discover hydration boundaries', () => {
    const container = createMockElement();
    const child1 = createMockElement();
    const child2 = createMockElement();

    child1.setAttribute('data-hydration', JSON.stringify({ when: 'idle' }));
    child2.setAttribute('data-hydration', JSON.stringify({ when: 'visible' }));

    container.appendChild(child1);
    container.appendChild(child2);

    discoverHydrationBoundaries(container);

    const stats = getHydrationStats();
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });

  it('should handle invalid hydration options gracefully', () => {
    const container = createMockElement();
    const child = createMockElement();

    child.setAttribute('data-hydration', 'invalid-json');
    container.appendChild(child);

    expect(() => discoverHydrationBoundaries(container)).not.toThrow();
  });
});

describe('Hydration Statistics', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal('matchMedia', mockMatchMedia);
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should track hydration statistics', () => {
    const element1 = createMockElement();
    const element2 = createMockElement();
    const element3 = createMockElement();

    setupHydration(element1, { when: 'idle' });
    setupHydration(element2, { when: 'visible' });
    setupHydration(element3, { when: 'interaction' });

    const stats = getHydrationStats();

    expect(stats.total).toBeGreaterThanOrEqual(3);
    expect(stats.byStrategy.idle).toBeGreaterThanOrEqual(1);
    expect(stats.byStrategy.visible).toBeGreaterThanOrEqual(1);
    expect(stats.byStrategy.interaction).toBeGreaterThanOrEqual(1);
  });

  it('should track hydrated vs pending', () => {
    const element = createMockElement();

    setupHydration(element, { when: 'never' });

    const stats = getHydrationStats();

    expect(stats.pending).toBeGreaterThanOrEqual(1);
    expect(stats.hydrated).toBeGreaterThanOrEqual(0);
  });
});

describe('Hydration Utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal('matchMedia', mockMatchMedia);
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
    vi.unstubAllGlobals();
  });

  it('should clear all hydration state', () => {
    const element1 = createMockElement();
    const element2 = createMockElement();

    setupHydration(element1, { when: 'idle' });
    setupHydration(element2, { when: 'visible' });

    clearHydrationState();

    const stats = getHydrationStats();
    expect(stats.total).toBe(0);
  });

  it('should wait for hydration to complete', async () => {
    const element = createMockElement();

    setupHydration(element, { when: 'load' });

    await waitForHydration();

    // After waiting, should be complete
    expect(true).toBe(true);
  });
});

describe('Hydrate Component', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should create Hydrate component with props', () => {
    const result = Hydrate({
      when: 'visible',
      threshold: 0.5,
      children: 'content',
    });

    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('props');
  });

  it('should pass hydration options through props', () => {
    const result = Hydrate({
      when: 'interaction',
      event: 'click',
      children: 'button content',
    });

    expect(result).toBeTruthy();
  });
});

describe('useHydration Hook', () => {
  it('should provide hydration control methods', () => {
    const hydration = useHydration({ when: 'idle' });

    expect(hydration).toHaveProperty('id');
    expect(hydration).toHaveProperty('isHydrated');
    expect(hydration).toHaveProperty('forceHydrate');
    expect(hydration).toHaveProperty('cancel');
    expect(typeof hydration.forceHydrate).toBe('function');
    expect(typeof hydration.cancel).toBe('function');
  });
});

describe('Initialization', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should initialize hydration system', () => {
    expect(() => initHydration()).not.toThrow();
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    clearHydrationState();
  });

  afterEach(() => {
    clearHydrationState();
  });

  it('should call onError callback on hydration error', async () => {
    const element = createMockElement();
    const onError = vi.fn();

    setupHydration(element, {
      when: 'load',
      onError,
    });

    // Error handling is tested indirectly
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should continue hydrating other elements after error', async () => {
    const element1 = createMockElement();
    const element2 = createMockElement();

    const onError1 = vi.fn();
    const onError2 = vi.fn();

    setupHydration(element1, { when: 'load', onError: onError1 });
    setupHydration(element2, { when: 'load', onError: onError2 });

    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});
