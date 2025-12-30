/**
 * SQLite test setup - mock browser APIs for Node.js environment
 */
import { vi } from 'vitest';

// Mock indexedDB if not available
if (typeof globalThis.indexedDB === 'undefined') {
  const mockIDBRequest = {
    result: null,
    error: null,
    onsuccess: null as ((event: unknown) => void) | null,
    onerror: null as ((event: unknown) => void) | null,
    onupgradeneeded: null as ((event: unknown) => void) | null,
  };

  const mockIDBDatabase = {
    objectStoreNames: { contains: () => false },
    createObjectStore: vi.fn(() => ({
      createIndex: vi.fn(),
    })),
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        put: vi.fn(() => mockIDBRequest),
        get: vi.fn(() => mockIDBRequest),
        delete: vi.fn(() => mockIDBRequest),
        getAll: vi.fn(() => mockIDBRequest),
      })),
      oncomplete: null,
      onerror: null,
    })),
    close: vi.fn(),
  };

  globalThis.indexedDB = {
    open: vi.fn(() => {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        request.result = mockIDBDatabase as unknown as IDBDatabase;
        request.onsuccess?.({} as Event);
      }, 0);
      return request as unknown as IDBOpenDBRequest;
    }),
    deleteDatabase: vi.fn(() => mockIDBRequest as unknown as IDBOpenDBRequest),
  } as unknown as IDBFactory;
}

// Mock navigator.storage.getDirectory for OPFS
if (typeof globalThis.navigator === 'undefined') {
  (globalThis as unknown as { navigator: unknown }).navigator = {};
}

if (!globalThis.navigator.storage) {
  (globalThis.navigator as unknown as { storage: unknown }).storage = {
    getDirectory: vi.fn(() => Promise.reject(new Error('OPFS not available in tests'))),
    estimate: vi.fn(() => Promise.resolve({ quota: 0, usage: 0 })),
  };
}
