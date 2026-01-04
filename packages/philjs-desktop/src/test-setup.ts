/**
 * Test setup for philjs-desktop
 * Provides utilities for mocking Tauri APIs in tests
 *
 * Note: Tauri is NOT mocked by default - tests run in browser mode.
 * Use enableTauriMocks() in tests that need Tauri functionality.
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Event listeners for mock event system
const eventListeners = new Map<string, Set<Function>>();

// Mock Tauri internals - only used when enabled
const createMockTauriInternals = () => ({
  invoke: vi.fn(),
  transformCallback: vi.fn((callback: any) => {
    const id = Math.random();
    (globalThis as any).__TAURI_CALLBACKS__ = (globalThis as any).__TAURI_CALLBACKS__ || {};
    (globalThis as any).__TAURI_CALLBACKS__[id] = callback;
    return id;
  }),
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${path}`),
});

// Mock Tauri events - only used when enabled
const createMockTauriEvents = () => ({
  listen: vi.fn((event: string, callback: Function) => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(callback);
    return () => {
      eventListeners.get(event)?.delete(callback);
    };
  }),
  emit: vi.fn((event: string, payload: any) => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback({ payload }));
    }
  }),
  once: vi.fn((event: string, callback: Function) => {
    const unlisten = (globalThis as any).__TAURI_EVENTS__.listen(event, (e: any) => {
      callback(e);
      unlisten();
    });
    return unlisten;
  }),
});

/**
 * Enable Tauri mocks for the current test
 * Call this at the beginning of tests that need Tauri functionality
 */
export function enableTauriMocks() {
  const mockTauriInternals = createMockTauriInternals();
  const mockEvents = createMockTauriEvents();

  (globalThis as any).__TAURI__ = mockTauriInternals;
  (globalThis as any).__TAURI_INTERNALS__ = mockTauriInternals;
  (globalThis as any).__TAURI_EVENTS__ = mockEvents;

  // Also set on window for browser environment
  if (typeof window !== 'undefined') {
    (window as any).__TAURI__ = mockTauriInternals;
    (window as any).__TAURI_INTERNALS__ = mockTauriInternals;
  }

  return { mockTauri: mockTauriInternals, mockEvents };
}

/**
 * Disable Tauri mocks
 */
export function disableTauriMocks() {
  delete (globalThis as any).__TAURI__;
  delete (globalThis as any).__TAURI_INTERNALS__;
  delete (globalThis as any).__TAURI_EVENTS__;
  delete (globalThis as any).__TAURI_CALLBACKS__;

  if (typeof window !== 'undefined') {
    delete (window as any).__TAURI__;
    delete (window as any).__TAURI_INTERNALS__;
  }
}

// Export event listeners for test inspection
export { eventListeners };

// Clean up before/after each test
beforeEach(() => {
  vi.clearAllMocks();
  eventListeners.clear();
});

afterEach(() => {
  // Clean up Tauri mocks if they were enabled
  disableTauriMocks();
});
