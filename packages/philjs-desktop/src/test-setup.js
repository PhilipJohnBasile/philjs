/**
 * Test setup for philjs-desktop
 * Mocks Tauri APIs for testing in Node.js environment
 */
import { vi, beforeEach } from 'vitest';
// Mock window.__TAURI__ global
const mockTauriInternals = {
    invoke: vi.fn(),
    transformCallback: vi.fn((callback) => {
        const id = Math.random();
        globalThis.__TAURI_CALLBACKS__ = globalThis.__TAURI_CALLBACKS__ || {};
        globalThis.__TAURI_CALLBACKS__[id] = callback;
        return id;
    }),
    convertFileSrc: vi.fn((path) => `asset://localhost/${path}`),
};
// Set up Tauri mocks on globalThis
globalThis.__TAURI__ = mockTauriInternals;
globalThis.__TAURI_INTERNALS__ = mockTauriInternals;
// Mock Tauri event system
const eventListeners = new Map();
globalThis.__TAURI_EVENTS__ = {
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
};
// Export for use in tests
export const mockTauri = mockTauriInternals;
export const mockEvents = globalThis.__TAURI_EVENTS__;
export { eventListeners };
// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    eventListeners.clear();
});
//# sourceMappingURL=test-setup.js.map