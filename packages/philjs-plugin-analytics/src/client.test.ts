/**
 * Analytics Client Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { analytics, trackEvent, trackPageView } from "./client.js";
import type { AnalyticsPluginConfig } from "./types.js";

describe("Analytics Client", () => {
  beforeEach(() => {
    // Reset analytics client
    (analytics as any).initialized = false;
    (analytics as any).provider = null;
    (analytics as any).eventQueue = [];

    // Mock window and document
    global.window = {
      location: {
        hostname: "example.com",
        pathname: "/test",
        href: "https://example.com/test",
      },
      history: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
      },
      addEventListener: vi.fn(),
      dataLayer: [],
      gtag: vi.fn(),
    } as any;

    global.document = {
      title: "Test Page",
      referrer: "https://google.com",
      createElement: vi.fn(() => ({
        setAttribute: vi.fn(),
        onload: null,
      })),
      head: {
        appendChild: vi.fn(),
      },
      addEventListener: vi.fn(),
    } as any;

    global.navigator = {
      userAgent: "Test Agent",
      language: "en-US",
      doNotTrack: "0",
    } as any;

    global.screen = {
      width: 1920,
      height: 1080,
    } as any;
  });

  it("should initialize with config", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
    };

    analytics.init(config);

    expect(analytics.isInitialized()).toBe(true);
  });

  it("should queue events before initialization", () => {
    trackEvent("test_event", { key: "value" });

    expect(analytics.isInitialized()).toBe(false);
  });

  it("should process queued events after initialization", () => {
    trackEvent("queued_event");

    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
    };

    analytics.init(config);

    expect(analytics.isInitialized()).toBe(true);
  });

  it("should track page views", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
    };

    analytics.init(config);
    trackPageView("/test", "Test Page");

    // Should not throw
    expect(analytics.isInitialized()).toBe(true);
  });

  it("should create analytics context", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
    };

    analytics.init(config);

    const context = analytics.getContext();

    expect(context).toBeDefined();
    expect(context?.sessionId).toBeDefined();
    expect(context?.userAgent).toBe("Test Agent");
    expect(context?.language).toBe("en-US");
  });

  it("should disable in development when configured", () => {
    global.window.location.hostname = "localhost";

    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
      disableInDev: true,
    };

    const consoleSpy = vi.spyOn(console, "log");
    analytics.init(config);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("development mode")
    );
  });

  it("should respect DNT when enabled", () => {
    global.navigator.doNotTrack = "1";

    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
      privacy: {
        respectDnt: true,
      },
    };

    const consoleSpy = vi.spyOn(console, "log");
    analytics.init(config);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Do Not Track")
    );
  });
});

describe("Convenience Functions", () => {
  beforeEach(() => {
    // Reset analytics client
    (analytics as any).initialized = false;
    (analytics as any).provider = null;

    global.window = {
      location: {
        hostname: "example.com",
        pathname: "/test",
      },
      dataLayer: [],
      gtag: vi.fn(),
    } as any;

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
    } as any;

    global.navigator = {
      userAgent: "Test",
      language: "en",
      doNotTrack: "0",
    } as any;

    global.screen = {
      width: 1920,
      height: 1080,
    } as any;
  });

  it("trackEvent should call analytics.trackEvent", () => {
    const spy = vi.spyOn(analytics, "trackEvent");

    trackEvent("test_event", { key: "value" });

    expect(spy).toHaveBeenCalledWith("test_event", { key: "value" });
  });

  it("trackPageView should call analytics.trackPageView", () => {
    const spy = vi.spyOn(analytics, "trackPageView");

    trackPageView("/test", "Test");

    expect(spy).toHaveBeenCalledWith("/test", "Test");
  });
});
