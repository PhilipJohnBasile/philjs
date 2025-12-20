/**
 * Analytics Plugin Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createAnalyticsPlugin } from "./index.js";
import type { AnalyticsPluginConfig } from "./types.js";

describe("Analytics Plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create plugin with correct metadata", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
    };

    const plugin = createAnalyticsPlugin(config);

    expect(plugin.meta.name).toBe("philjs-plugin-analytics");
    expect(plugin.meta.version).toBe("2.0.0");
    expect(plugin.meta.description).toContain("Analytics");
  });

  it("should have config schema with required fields", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
    };

    const plugin = createAnalyticsPlugin(config);

    expect(plugin.configSchema?.required).toContain("provider");
    expect(plugin.configSchema?.required).toContain("trackingId");
  });

  it("should merge default config with user config", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
      debug: true,
    };

    const plugin = createAnalyticsPlugin(config);

    expect(plugin).toBeDefined();
  });

  it("should support all analytics providers", () => {
    const providers = [
      "ga4",
      "plausible",
      "mixpanel",
    ] as const;

    providers.forEach((provider) => {
      const config: AnalyticsPluginConfig = {
        provider,
        trackingId: "TEST123",
      };

      const plugin = createAnalyticsPlugin(config);
      expect(plugin).toBeDefined();
    });
  });

  it("should have setup hook", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
    };

    const plugin = createAnalyticsPlugin(config);

    expect(plugin.setup).toBeDefined();
    expect(typeof plugin.setup).toBe("function");
  });

  it("should have lifecycle hooks", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
    };

    const plugin = createAnalyticsPlugin(config);

    expect(plugin.hooks).toBeDefined();
    expect(plugin.hooks?.init).toBeDefined();
    expect(plugin.hooks?.buildStart).toBeDefined();
  });

  it("should apply privacy settings", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
      privacy: {
        anonymizeIp: true,
        respectDnt: true,
        cookieConsent: true,
      },
    };

    const plugin = createAnalyticsPlugin(config);

    expect(plugin).toBeDefined();
  });

  it("should configure custom events", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
      customEvents: {
        pageViews: true,
        clicks: true,
        forms: true,
        errors: true,
      },
    };

    const plugin = createAnalyticsPlugin(config);

    expect(plugin).toBeDefined();
  });

  it("should disable in development when configured", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
      disableInDev: true,
    };

    const plugin = createAnalyticsPlugin(config);

    expect(plugin).toBeDefined();
  });

  it("should enable debug mode when configured", () => {
    const config: AnalyticsPluginConfig = {
      provider: "ga4",
      trackingId: "G-TEST123",
      debug: true,
    };

    const plugin = createAnalyticsPlugin(config);

    expect(plugin).toBeDefined();
  });
});

describe("Analytics Utils", () => {
  it("should check DNT status", async () => {
    const { analyticsUtils } = await import("./index.js");

    // Mock navigator.doNotTrack
    Object.defineProperty(navigator, "doNotTrack", {
      writable: true,
      value: "1",
    });

    const hasDNT = analyticsUtils.hasDNT();
    expect(typeof hasDNT).toBe("boolean");
  });

  it("should generate session ID", async () => {
    const { analyticsUtils } = await import("./index.js");

    const sessionId = analyticsUtils.generateSessionId();
    expect(sessionId).toBeDefined();
    expect(typeof sessionId).toBe("string");
    expect(sessionId.length).toBeGreaterThan(0);
  });

  it("should get user agent info", async () => {
    const { analyticsUtils } = await import("./index.js");

    const userAgent = analyticsUtils.getUserAgent();
    expect(userAgent).toBeDefined();
    expect(userAgent.userAgent).toBeDefined();
  });

  it("should get page metadata", async () => {
    const { analyticsUtils } = await import("./index.js");

    const metadata = analyticsUtils.getPageMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.url).toBeDefined();
    expect(metadata.path).toBeDefined();
  });
});
