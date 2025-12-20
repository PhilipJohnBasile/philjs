/**
 * Analytics Providers
 */

export * from "./ga4.js";
export * from "./plausible.js";
export * from "./mixpanel.js";
export * from "./amplitude.js";
export * from "./segment.js";
export * from "./posthog.js";

import { GA4Provider } from "./ga4.js";
import { PlausibleProvider } from "./plausible.js";
import { MixpanelProvider } from "./mixpanel.js";
import { AmplitudeProvider } from "./amplitude.js";
import { SegmentProvider } from "./segment.js";
import { PostHogProvider } from "./posthog.js";
import type { AnalyticsProvider, IAnalyticsProvider } from "../types.js";

/**
 * Get provider instance by name
 */
export function getProvider(name: AnalyticsProvider): IAnalyticsProvider {
  switch (name) {
    case "google-analytics":
    case "ga4":
      return new GA4Provider();
    case "plausible":
      return new PlausibleProvider();
    case "mixpanel":
      return new MixpanelProvider();
    case "amplitude":
      return new AmplitudeProvider();
    case "segment":
      return new SegmentProvider();
    case "posthog":
      return new PostHogProvider();
    default:
      throw new Error(`Unknown analytics provider: ${name}`);
  }
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): AnalyticsProvider[] {
  return ["ga4", "plausible", "mixpanel", "amplitude", "segment", "posthog"];
}
