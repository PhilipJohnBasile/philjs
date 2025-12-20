/**
 * GA4 Provider Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GA4Provider } from "./ga4.js";
import type { AnalyticsPluginConfig } from "../types.js";

describe("GA4Provider", () => {
  let provider: GA4Provider;
  let config: AnalyticsPluginConfig;

  beforeEach(() => {
    provider = new GA4Provider();
    config = {
      provider: "ga4",
      trackingId: "G-TEST123",
      debug: true,
    };

    // Mock window and document
    global.window = {
      dataLayer: [],
      gtag: vi.fn(),
    } as any;

    global.document = {
      createElement: vi.fn(() => ({
        setAttribute: vi.fn(),
        onload: null,
      })),
      head: {
        appendChild: vi.fn(),
      },
    } as any;

    global.navigator = {
      doNotTrack: "0",
    } as any;
  });

  it("should have correct name", () => {
    expect(provider.name).toBe("ga4");
  });

  it("should initialize with config", () => {
    provider.init(config);

    expect(window.dataLayer).toBeDefined();
    expect(window.gtag).toBeDefined();
  });

  it("should track events", () => {
    provider.init(config);
    window.gtag = vi.fn();

    provider.trackEvent({
      name: "test_event",
      properties: { key: "value" },
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "test_event", {
      key: "value",
    });
  });

  it("should track page views", () => {
    provider.init(config);
    window.gtag = vi.fn();

    provider.trackPageView("/test", "Test Page");

    expect(window.gtag).toHaveBeenCalledWith("event", "page_view", {
      page_path: "/test",
      page_title: "Test Page",
    });
  });

  it("should identify users", () => {
    provider.init(config);
    window.gtag = vi.fn();

    provider.identifyUser({
      userId: "user123",
      traits: { email: "test@example.com" },
    });

    expect(window.gtag).toHaveBeenCalled();
  });

  it("should set user properties", () => {
    provider.init(config);
    window.gtag = vi.fn();

    provider.setUserProperties({ plan: "premium" });

    expect(window.gtag).toHaveBeenCalledWith("set", "user_properties", {
      plan: "premium",
    });
  });

  it("should track transactions", () => {
    provider.init(config);
    window.gtag = vi.fn();

    provider.trackTransaction({
      transaction_id: "T123",
      value: 99.99,
      currency: "USD",
      items: [
        {
          item_id: "SKU123",
          item_name: "Product",
          price: 99.99,
        },
      ],
    });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "purchase",
      expect.objectContaining({
        transaction_id: "T123",
        value: 99.99,
        currency: "USD",
      })
    );
  });

  it("should respect DNT when enabled", () => {
    global.navigator = {
      doNotTrack: "1",
    } as any;

    const consoleSpy = vi.spyOn(console, "log");

    provider.init({
      ...config,
      privacy: { respectDnt: true },
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Do Not Track")
    );
  });

  it("should anonymize IP when configured", () => {
    provider.init({
      ...config,
      privacy: { anonymizeIp: true },
    });

    expect(window.gtag).toHaveBeenCalled();
  });
});
