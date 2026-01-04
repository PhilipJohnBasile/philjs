/**
 * Test setup for philjs-desktop
 * Provides utilities for mocking Tauri APIs in tests
 *
 * Note: Tauri is NOT mocked by default - tests run in browser mode.
 * Use enableTauriMocks() in tests that need Tauri functionality.
 */
import { vi, beforeEach, afterEach } from 'vitest';
// Event listeners for mock event system
const eventListeners = new Map();
// Mock Tauri internals - only used when enabled
const createMockTauriInternals = () => ({
    invoke: vi.fn(),
    transformCallback: vi.fn((callback) => {
        const id = Math.random();
        globalThis.__TAURI_CALLBACKS__ = globalThis.__TAURI_CALLBACKS__ || {};
        globalThis.__TAURI_CALLBACKS__[id] = callback;
        return id;
    }),
    convertFileSrc: vi.fn((path) => `asset://localhost/${path}`),
});
// Mock Tauri events - only used when enabled
const createMockTauriEvents = () => ({
    listen: vi.fn((event, callback) => {
        if (!eventListeners.has(event)) {
            eventListeners.set(event, new Set());
        }
        eventListeners.get(event).add(callback);
        return () => {
            eventListeners.get(event)?.delete(callback);
        };
    }),
    emit: vi.fn((event, payload) => {
        const listeners = eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback({ payload }));
        }
    }),
    once: vi.fn((event, callback) => {
        const unlisten = globalThis.__TAURI_EVENTS__.listen(event, (e) => {
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
    globalThis.__TAURI__ = mockTauriInternals;
    globalThis.__TAURI_INTERNALS__ = mockTauriInternals;
    globalThis.__TAURI_EVENTS__ = mockEvents;
    // Also set on window for browser environment
    if (typeof window !== 'undefined') {
        window.__TAURI__ = mockTauriInternals;
        window.__TAURI_INTERNALS__ = mockTauriInternals;
    }
    return { mockTauri: mockTauriInternals, mockEvents };
}
/**
 * Disable Tauri mocks
 */
export function disableTauriMocks() {
    delete globalThis.__TAURI__;
    delete globalThis.__TAURI_INTERNALS__;
    delete globalThis.__TAURI_EVENTS__;
    delete globalThis.__TAURI_CALLBACKS__;
    if (typeof window !== 'undefined') {
        delete window.__TAURI__;
        delete window.__TAURI_INTERNALS__;
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
//# sourceMappingURL=test-setup.js.map