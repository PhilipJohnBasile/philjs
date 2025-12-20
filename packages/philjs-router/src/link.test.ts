/**
 * Tests for Enhanced Link Component with Prefetch Modes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedLink, PrefetchLink, usePrefetchLink } from './link.js';
import { initPrefetchManager, getPrefetchManager } from './prefetch.js';
import type { PrefetchMode } from './prefetch.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock document
const mockHead = {
  appendChild: vi.fn(),
};
const mockDocument = {
  head: mockHead,
  createElement: vi.fn(() => ({
    rel: '',
    href: '',
    as: '',
    remove: vi.fn(),
  })),
  querySelector: vi.fn(() => null),
};
global.document = mockDocument as any;

// Mock window
const mockWindow = {
  location: {
    origin: 'http://localhost',
    href: 'http://localhost/',
  },
  history: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
  },
  dispatchEvent: vi.fn(),
  requestIdleCallback: vi.fn((cb) => setTimeout(cb, 0)),
  PopStateEvent: class PopStateEvent extends Event {
    constructor(type: string) {
      super(type);
    }
  },
};
global.window = mockWindow as any;

// Mock performance
global.performance = {
  now: vi.fn(() => Date.now()),
} as any;

// Mock BroadcastChannel
class MockBroadcastChannel {
  onmessage: ((event: any) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();
}
global.BroadcastChannel = MockBroadcastChannel as any;

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();

class MockIntersectionObserver {
  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = vi.fn();
}
global.IntersectionObserver = MockIntersectionObserver as any;

// Mock navigator
global.navigator = {
  connection: {
    saveData: false,
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  },
} as any;

describe('EnhancedLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-length': '1000' }),
    });
    initPrefetchManager();
  });

  afterEach(() => {
    vi.useRealTimers();
    getPrefetchManager()?.destroy();
  });

  describe('basic rendering', () => {
    it('should render a link VNode', () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        children: 'Dashboard',
      });

      expect(vnode.type).toBe('a');
      expect(vnode.props.href).toBe('/dashboard');
      expect(vnode.props.children).toBe('Dashboard');
    });

    it('should include data-router-link attribute', () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        children: 'Dashboard',
      });

      expect(vnode.props['data-router-link']).toBe('');
    });

    it('should include data-prefetch attribute', () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        prefetch: 'hover',
        children: 'Dashboard',
      });

      expect(vnode.props['data-prefetch']).toBe('hover');
    });

    it('should pass through additional props', () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        className: 'nav-link',
        'aria-label': 'Go to dashboard',
        children: 'Dashboard',
      });

      expect(vnode.props.className).toBe('nav-link');
      expect(vnode.props['aria-label']).toBe('Go to dashboard');
    });
  });

  describe('prefetch modes', () => {
    const modes: PrefetchMode[] = ['hover', 'visible', 'intent', 'render', 'none'];

    it.each(modes)('should handle prefetch mode "%s"', (mode) => {
      const vnode = EnhancedLink({
        href: '/test',
        prefetch: mode,
        children: 'Test',
      });

      expect(vnode.props['data-prefetch']).toBe(mode);
    });

    it('should default to "hover" for internal links', () => {
      const vnode = EnhancedLink({
        href: '/internal',
        children: 'Internal',
      });

      expect(vnode.props['data-prefetch']).toBe('hover');
    });

    it('should default to "none" for external links', () => {
      const vnode = EnhancedLink({
        href: 'https://external.com',
        children: 'External',
      });

      expect(vnode.props['data-prefetch']).toBe('none');
    });
  });

  describe('hover prefetch', () => {
    it('should add onMouseEnter handler for hover mode', () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        prefetch: 'hover',
        children: 'Dashboard',
      });

      expect(typeof vnode.props.onMouseEnter).toBe('function');
      expect(typeof vnode.props.onMouseLeave).toBe('function');
    });

    it('should trigger prefetch after hover delay', async () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        prefetch: { mode: 'hover', delay: 100 },
        children: 'Dashboard',
      });

      // Simulate mouse enter
      vnode.props.onMouseEnter();

      // Before delay
      expect(mockFetch).not.toHaveBeenCalled();

      // After delay
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should cancel prefetch on mouse leave', async () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        prefetch: { mode: 'hover', delay: 100 },
        children: 'Dashboard',
      });

      // Simulate mouse enter then leave quickly
      vnode.props.onMouseEnter();
      vi.advanceTimersByTime(50);
      vnode.props.onMouseLeave();
      vi.advanceTimersByTime(100);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('intent prefetch', () => {
    it('should add focus handlers for intent mode', () => {
      const vnode = EnhancedLink({
        href: '/users',
        prefetch: 'intent',
        children: 'Users',
      });

      expect(typeof vnode.props.onFocus).toBe('function');
      expect(typeof vnode.props.onBlur).toBe('function');
      expect(typeof vnode.props.onMouseEnter).toBe('function');
      expect(typeof vnode.props.onMouseLeave).toBe('function');
    });

    it('should trigger prefetch on focus', async () => {
      const vnode = EnhancedLink({
        href: '/users',
        prefetch: { mode: 'intent', delay: 50 },
        children: 'Users',
      });

      vnode.props.onFocus();
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('visible prefetch', () => {
    it('should include ref for visible mode', () => {
      const vnode = EnhancedLink({
        href: '/about',
        prefetch: 'visible',
        children: 'About',
      });

      expect(typeof vnode.props.ref).toBe('function');
    });
  });

  describe('render prefetch', () => {
    it('should include ref for render mode', () => {
      const vnode = EnhancedLink({
        href: '/critical',
        prefetch: 'render',
        children: 'Critical',
      });

      expect(typeof vnode.props.ref).toBe('function');
    });
  });

  describe('navigation', () => {
    it('should handle click events', () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        children: 'Dashboard',
      });

      const mockEvent = {
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
      };

      vnode.props.onClick(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockWindow.history.pushState).toHaveBeenCalled();
      expect(mockWindow.dispatchEvent).toHaveBeenCalled();
    });

    it('should use replaceState when replace prop is true', () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        replace: true,
        children: 'Dashboard',
      });

      const mockEvent = {
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
      };

      vnode.props.onClick(mockEvent);

      expect(mockWindow.history.replaceState).toHaveBeenCalled();
    });

    it('should not prevent default for external links', () => {
      const vnode = EnhancedLink({
        href: 'https://external.com',
        children: 'External',
      });

      const mockEvent = {
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
      };

      vnode.props.onClick(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should not prevent default for modifier key clicks', () => {
      const vnode = EnhancedLink({
        href: '/dashboard',
        children: 'Dashboard',
      });

      const mockEvent = {
        defaultPrevented: false,
        button: 0,
        metaKey: true, // Cmd+click
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
      };

      vnode.props.onClick(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should call original onClick handler', () => {
      const originalOnClick = vi.fn();
      const vnode = EnhancedLink({
        href: '/dashboard',
        onClick: originalOnClick,
        children: 'Dashboard',
      });

      const mockEvent = {
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
      };

      vnode.props.onClick(mockEvent);

      expect(originalOnClick).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('with data prefetch', () => {
    it('should accept withData option', () => {
      const vnode = EnhancedLink({
        href: '/users/123',
        prefetch: { mode: 'hover', withData: true },
        children: 'User 123',
      });

      expect(vnode.props['data-prefetch']).toBe('hover');
    });

    it('should accept params option', () => {
      const vnode = EnhancedLink({
        href: '/users/123',
        prefetch: { mode: 'hover', withData: true, params: { id: '123' } },
        children: 'User 123',
      });

      expect(vnode.props['data-prefetch']).toBe('hover');
    });
  });
});

describe('PrefetchLink alias', () => {
  it('should be an alias for EnhancedLink', () => {
    expect(PrefetchLink).toBe(EnhancedLink);
  });
});

describe('usePrefetchLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-length': '1000' }),
    });
    initPrefetchManager();
  });

  afterEach(() => {
    vi.useRealTimers();
    getPrefetchManager()?.destroy();
  });

  it('should return prefetch function', () => {
    const result = usePrefetchLink('/dashboard');

    expect(typeof result.prefetch).toBe('function');
  });

  it('should return handlers based on mode', () => {
    const result = usePrefetchLink('/dashboard', { mode: 'hover' });

    expect(typeof result.handlers.onMouseEnter).toBe('function');
    expect(typeof result.handlers.onMouseLeave).toBe('function');
  });

  it('should return intent handlers', () => {
    const result = usePrefetchLink('/users', { mode: 'intent' });

    expect(typeof result.handlers.onMouseEnter).toBe('function');
    expect(typeof result.handlers.onMouseLeave).toBe('function');
    expect(typeof result.handlers.onFocus).toBe('function');
    expect(typeof result.handlers.onBlur).toBe('function');
  });

  it('should return isPrefetched status', () => {
    const result = usePrefetchLink('/dashboard');

    expect(typeof result.isPrefetched).toBe('boolean');
  });

  it('should return isLoading status', () => {
    const result = usePrefetchLink('/dashboard');

    expect(typeof result.isLoading).toBe('boolean');
  });

  it('should trigger immediate prefetch', async () => {
    usePrefetchLink('/dashboard', { immediate: true });

    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalled();
  });

  it('should allow manual prefetch trigger', async () => {
    const result = usePrefetchLink('/dashboard');

    await result.prefetch();

    expect(mockFetch).toHaveBeenCalled();
  });
});
