/**
 * Test setup file
 */

import { vi } from "vitest";

// Mock window object
global.window = {
  location: {
    hostname: "localhost",
    pathname: "/",
    href: "http://localhost/",
    search: "",
    hash: "",
  },
  history: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
  },
  addEventListener: vi.fn(),
  innerWidth: 1920,
  innerHeight: 1080,
} as any;

// Mock document object
global.document = {
  title: "Test Page",
  referrer: "",
  createElement: vi.fn(() => ({
    setAttribute: vi.fn(),
    onload: null,
  })),
  head: {
    appendChild: vi.fn(),
  },
  addEventListener: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
} as any;

// Mock navigator object
global.navigator = {
  userAgent: "Test User Agent",
  language: "en-US",
  doNotTrack: "0",
  platform: "Test",
  vendor: "Test",
} as any;

// Mock screen object
global.screen = {
  width: 1920,
  height: 1080,
} as any;

// Mock performance API
global.performance = {
  now: () => Date.now(),
  getEntriesByType: vi.fn(() => []),
} as any;
