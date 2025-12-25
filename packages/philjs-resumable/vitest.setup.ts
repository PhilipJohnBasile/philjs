/**
 * Vitest setup file for philjs-resumable tests
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Setup DOM environment
beforeEach(() => {
  // Clear document
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  }

  // Mock window properties
  if (typeof window !== 'undefined') {
    // Reset location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/',
        origin: 'http://localhost:3000',
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
      },
      writable: true,
    });

    // Reset scroll position
    window.scrollY = 0;
    window.scrollX = 0;
  }
});

afterEach(() => {
  // Clean up
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// Global test utilities
global.createMockElement = (tag: string = 'div'): Element => {
  return document.createElement(tag);
};
