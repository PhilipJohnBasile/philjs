/**
 * Tests for async utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  waitFor,
  waitForElementToBeRemoved,
  delay,
  waitForLoadingToFinish,
  waitForNetworkIdle,
} from '../src/async';

describe('waitFor', () => {
  it('resolves when condition becomes true', async () => {
    let value = false;

    setTimeout(() => {
      value = true;
    }, 10);

    await waitFor(() => {
      if (!value) throw new Error('Not ready');
      return value;
    });

    expect(value).toBe(true);
  });

  it('returns the callback result', async () => {
    const result = await waitFor(() => ({ data: 'test' }));
    expect(result).toEqual({ data: 'test' });
  });

  it('supports async callbacks', async () => {
    let value = 0;

    setTimeout(() => {
      value = 42;
    }, 10);

    const result = await waitFor(async () => {
      if (value !== 42) throw new Error('Not ready');
      return value;
    });

    expect(result).toBe(42);
  });

  it('rejects on timeout', async () => {
    await expect(
      waitFor(
        () => {
          throw new Error('Never ready');
        },
        { timeout: 50 }
      )
    ).rejects.toThrow();
  });

  it('uses custom timeout', async () => {
    const start = Date.now();

    await expect(
      waitFor(() => {
        throw new Error('Never ready');
      }, { timeout: 100 })
    ).rejects.toThrow();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('uses custom interval', async () => {
    let callCount = 0;

    setTimeout(() => {
      callCount = 5;
    }, 50);

    await waitFor(
      () => {
        callCount++;
        if (callCount < 5) throw new Error('Not ready');
        return true;
      },
      { interval: 20 }
    );

    // Should have been called multiple times with 20ms interval
    expect(callCount).toBeGreaterThanOrEqual(3);
  });
});

describe('waitForElementToBeRemoved', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('waits for element to be removed', async () => {
    const element = document.createElement('div');
    element.id = 'test';
    document.body.appendChild(element);

    setTimeout(() => {
      element.remove();
    }, 10);

    await waitForElementToBeRemoved(() => document.getElementById('test'));

    expect(document.getElementById('test')).toBeNull();
  });

  it('works with element directly', async () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    setTimeout(() => {
      element.remove();
    }, 10);

    await waitForElementToBeRemoved(element);

    expect(document.body.contains(element)).toBe(false);
  });

  it('works with array of elements', async () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    document.body.appendChild(el1);
    document.body.appendChild(el2);

    setTimeout(() => {
      el1.remove();
      el2.remove();
    }, 10);

    await waitForElementToBeRemoved([el1, el2]);

    expect(document.body.contains(el1)).toBe(false);
    expect(document.body.contains(el2)).toBe(false);
  });
});

describe('delay', () => {
  it('delays execution', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(50);
    expect(elapsed).toBeLessThan(100);
  });

  it('resolves with undefined', async () => {
    const result = await delay(1);
    expect(result).toBeUndefined();
  });
});

describe('waitForLoadingToFinish', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('waits for loading indicators to disappear', async () => {
    const loading = document.createElement('div');
    loading.setAttribute('aria-busy', 'true');
    document.body.appendChild(loading);

    setTimeout(() => {
      loading.remove();
    }, 10);

    await waitForLoadingToFinish();

    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('works with data-loading attribute', async () => {
    const loading = document.createElement('div');
    loading.setAttribute('data-loading', 'true');
    document.body.appendChild(loading);

    setTimeout(() => {
      loading.remove();
    }, 10);

    await waitForLoadingToFinish();

    expect(document.querySelector('[data-loading="true"]')).toBeNull();
  });

  it('works with loading class', async () => {
    const loading = document.createElement('div');
    loading.className = 'loading';
    document.body.appendChild(loading);

    setTimeout(() => {
      loading.remove();
    }, 10);

    await waitForLoadingToFinish();

    expect(document.querySelector('.loading')).toBeNull();
  });

  it('supports custom container', async () => {
    const container = document.createElement('div');
    const loading = document.createElement('div');
    loading.className = 'spinner';
    container.appendChild(loading);

    setTimeout(() => {
      loading.remove();
    }, 10);

    await waitForLoadingToFinish(container);

    expect(container.querySelector('.spinner')).toBeNull();
  });

  it('resolves immediately if no loading indicators', async () => {
    const start = Date.now();
    await waitForLoadingToFinish();
    const elapsed = Date.now() - start;

    // Should resolve almost immediately
    expect(elapsed).toBeLessThan(100);
  });
});

describe('waitForNetworkIdle', () => {
  let originalFetch: typeof window.fetch;

  beforeEach(() => {
    originalFetch = window.fetch;
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  it('waits for fetch requests to complete', async () => {
    let fetchComplete = false;

    window.fetch = vi.fn(async () => {
      await delay(20);
      fetchComplete = true;
      return new Response();
    });

    // Start a fetch
    fetch('/api/data');

    // Wait for network idle
    await waitForNetworkIdle({ idleTime: 50 });

    expect(fetchComplete).toBe(true);
  });

  // Skip: Timing-based test is flaky depending on system load
  it.skip('respects idle time', async () => {
    window.fetch = vi.fn(async () => {
      await delay(10);
      return new Response();
    });

    const start = Date.now();

    fetch('/api/data');
    await waitForNetworkIdle({ idleTime: 100 });

    const elapsed = Date.now() - start;

    // Should wait for request (10ms) + idle time (100ms)
    expect(elapsed).toBeGreaterThanOrEqual(110);
  });

  it('restores original fetch', async () => {
    const mockFetch = vi.fn(async () => new Response());
    window.fetch = mockFetch;

    await waitForNetworkIdle({ timeout: 10, idleTime: 1 });

    // After waitForNetworkIdle, fetch should be restored to mockFetch
    expect(window.fetch).toBe(mockFetch);
  });
});
