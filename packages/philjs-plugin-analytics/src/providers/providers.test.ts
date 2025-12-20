/**
 * Analytics Providers Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GA4Provider } from "./ga4.js";
import { PlausibleProvider } from "./plausible.js";
import { MixpanelProvider } from "./mixpanel.js";
import { AmplitudeProvider } from "./amplitude.js";
import { SegmentProvider } from "./segment.js";
import { PostHogProvider } from "./posthog.js";
import { getProvider, getAvailableProviders } from "./index.js";
import type { AnalyticsPluginConfig } from "../types.js";

// Mock window and document
const mockWindow = {
  location: {
    hostname: "example.com",
    href: "https://example.com/page",
    pathname: "/page",
  },
  navigator: {
    doNotTrack: null,
    userAgent: "Mozilla/5.0 Test",
    language: "en-US",
  },
  dataLayer: [],
  gtag: vi.fn(),
  plausible: vi.fn(),
  mixpanel: {
    init: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    people: {
      set: vi.fn(),
      track_charge: vi.fn(),
    },
  },
  amplitude: {
    init: vi.fn(),
    track: vi.fn(),
    setUserId: vi.fn(),
    identify: vi.fn(),
    Identify: class {
      set = vi.fn().mockReturnThis();
    },
    revenue: vi.fn(),
    Revenue: class {
      setProductId = vi.fn().mockReturnThis();
      setPrice = vi.fn().mockReturnThis();
      setQuantity = vi.fn().mockReturnThis();
    },
  },
  analytics: {
    invoked: true,
    track: vi.fn(),
    page: vi.fn(),
    identify: vi.fn(),
    group: vi.fn(),
    alias: vi.fn(),
    reset: vi.fn(),
  },
  posthog: {
    capture: vi.fn(),
    identify: vi.fn(),
    people: { set: vi.fn() },
    alias: vi.fn(),
    reset: vi.fn(),
    group: vi.fn(),
    isFeatureEnabled: vi.fn(),
    getFeatureFlag: vi.fn(),
    getFeatureFlagPayload: vi.fn(),
    reloadFeatureFlags: vi.fn(),
    onFeatureFlags: vi.fn(),
    startSessionRecording: vi.fn(),
    stopSessionRecording: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    has_opted_out_capturing: vi.fn(),
  },
};

const mockDocument = {
  title: "Test Page",
  referrer: "https://google.com",
  createElement: vi.fn(() => ({
    type: "",
    async: false,
    defer: false,
    src: "",
    setAttribute: vi.fn(),
    onload: null as (() => void) | null,
  })),
  head: {
    appendChild: vi.fn((script: any) => {
      // Simulate script loading
      if (script.onload) {
        setTimeout(() => script.onload(), 0);
      }
    }),
  },
  getElementsByTagName: vi.fn(() => [
    {
      parentNode: {
        insertBefore: vi.fn(),
      },
    },
  ]),
};

describe("Provider Factory", () => {
  it("should return GA4Provider for ga4", () => {
    const provider = getProvider("ga4");
    expect(provider).toBeInstanceOf(GA4Provider);
  });

  it("should return GA4Provider for google-analytics", () => {
    const provider = getProvider("google-analytics");
    expect(provider).toBeInstanceOf(GA4Provider);
  });

  it("should return PlausibleProvider for plausible", () => {
    const provider = getProvider("plausible");
    expect(provider).toBeInstanceOf(PlausibleProvider);
  });

  it("should return MixpanelProvider for mixpanel", () => {
    const provider = getProvider("mixpanel");
    expect(provider).toBeInstanceOf(MixpanelProvider);
  });

  it("should return AmplitudeProvider for amplitude", () => {
    const provider = getProvider("amplitude");
    expect(provider).toBeInstanceOf(AmplitudeProvider);
  });

  it("should return SegmentProvider for segment", () => {
    const provider = getProvider("segment");
    expect(provider).toBeInstanceOf(SegmentProvider);
  });

  it("should return PostHogProvider for posthog", () => {
    const provider = getProvider("posthog");
    expect(provider).toBeInstanceOf(PostHogProvider);
  });

  it("should throw for unknown provider", () => {
    expect(() => getProvider("unknown" as any)).toThrow("Unknown analytics provider");
  });

  it("should return all available providers", () => {
    const providers = getAvailableProviders();
    expect(providers).toContain("ga4");
    expect(providers).toContain("plausible");
    expect(providers).toContain("mixpanel");
    expect(providers).toContain("amplitude");
    expect(providers).toContain("segment");
    expect(providers).toContain("posthog");
  });
});

describe("GA4Provider", () => {
  let provider: GA4Provider;
  const config: AnalyticsPluginConfig = {
    provider: "ga4",
    trackingId: "G-TEST123",
    debug: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GA4Provider();
  });

  it("should have correct name", () => {
    expect(provider.name).toBe("ga4");
  });

  it("should not be loaded before init", () => {
    expect(provider.isLoaded()).toBe(false);
  });
});

describe("PlausibleProvider", () => {
  let provider: PlausibleProvider;
  const config: AnalyticsPluginConfig = {
    provider: "plausible",
    trackingId: "example.com",
    debug: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new PlausibleProvider();
  });

  it("should have correct name", () => {
    expect(provider.name).toBe("plausible");
  });

  it("should not be loaded before init", () => {
    expect(provider.isLoaded()).toBe(false);
  });
});

describe("MixpanelProvider", () => {
  let provider: MixpanelProvider;
  const config: AnalyticsPluginConfig = {
    provider: "mixpanel",
    trackingId: "test-token",
    debug: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new MixpanelProvider();
  });

  it("should have correct name", () => {
    expect(provider.name).toBe("mixpanel");
  });

  it("should not be loaded before init", () => {
    expect(provider.isLoaded()).toBe(false);
  });
});

describe("AmplitudeProvider", () => {
  let provider: AmplitudeProvider;
  const config: AnalyticsPluginConfig = {
    provider: "amplitude",
    trackingId: "test-api-key",
    debug: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AmplitudeProvider();
  });

  it("should have correct name", () => {
    expect(provider.name).toBe("amplitude");
  });

  it("should not be loaded before init", () => {
    expect(provider.isLoaded()).toBe(false);
  });
});

describe("SegmentProvider", () => {
  let provider: SegmentProvider;
  const config: AnalyticsPluginConfig = {
    provider: "segment",
    trackingId: "test-write-key",
    debug: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new SegmentProvider();
  });

  it("should have correct name", () => {
    expect(provider.name).toBe("segment");
  });

  it("should not be loaded before init", () => {
    expect(provider.isLoaded()).toBe(false);
  });
});

describe("PostHogProvider", () => {
  let provider: PostHogProvider;
  const config: AnalyticsPluginConfig = {
    provider: "posthog",
    trackingId: "test-project-api-key",
    debug: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new PostHogProvider();
  });

  it("should have correct name", () => {
    expect(provider.name).toBe("posthog");
  });

  it("should not be loaded before init", () => {
    expect(provider.isLoaded()).toBe(false);
  });
});

describe("Provider Interface Compliance", () => {
  const providers = [
    { name: "GA4", Provider: GA4Provider },
    { name: "Plausible", Provider: PlausibleProvider },
    { name: "Mixpanel", Provider: MixpanelProvider },
    { name: "Amplitude", Provider: AmplitudeProvider },
    { name: "Segment", Provider: SegmentProvider },
    { name: "PostHog", Provider: PostHogProvider },
  ];

  providers.forEach(({ name, Provider }) => {
    describe(`${name}Provider`, () => {
      let provider: any;

      beforeEach(() => {
        provider = new Provider();
      });

      it("should have name property", () => {
        expect(provider.name).toBeDefined();
        expect(typeof provider.name).toBe("string");
      });

      it("should have init method", () => {
        expect(provider.init).toBeDefined();
        expect(typeof provider.init).toBe("function");
      });

      it("should have trackEvent method", () => {
        expect(provider.trackEvent).toBeDefined();
        expect(typeof provider.trackEvent).toBe("function");
      });

      it("should have trackPageView method", () => {
        expect(provider.trackPageView).toBeDefined();
        expect(typeof provider.trackPageView).toBe("function");
      });

      it("should have identifyUser method", () => {
        expect(provider.identifyUser).toBeDefined();
        expect(typeof provider.identifyUser).toBe("function");
      });

      it("should have setUserProperties method", () => {
        expect(provider.setUserProperties).toBeDefined();
        expect(typeof provider.setUserProperties).toBe("function");
      });

      it("should have isLoaded method", () => {
        expect(provider.isLoaded).toBeDefined();
        expect(typeof provider.isLoaded).toBe("function");
      });
    });
  });
});
