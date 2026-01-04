/**
 * Analytics Providers
 * Analytics provider entrypoints
 */
export * from "./ga4.js";
export * from "./plausible.js";
export * from "./segment.js";
export * from "./mixpanel.js";
export * from "./amplitude.js";
export * from "./posthog.js";
import { GA4Provider } from "./ga4.js";
import { PlausibleProvider } from "./plausible.js";
import { SegmentProvider } from "./segment.js";
import { MixpanelProvider } from "./mixpanel.js";
import { AmplitudeProvider } from "./amplitude.js";
import { PostHogProvider } from "./posthog.js";
/**
 * Get provider instance by name
 */
export function getProvider(name) {
    switch (name) {
        case "google-analytics":
        case "ga4":
            return new GA4Provider();
        case "plausible":
            return new PlausibleProvider();
        case "segment":
            return new SegmentProvider();
        case "mixpanel":
            return new MixpanelProvider();
        case "amplitude":
            return new AmplitudeProvider();
        case "posthog":
            return new PostHogProvider();
        default:
            throw new Error(`Unknown analytics provider: ${name}`);
    }
}
/**
 * Get all available providers
 */
export function getAvailableProviders() {
    return ["ga4", "plausible", "mixpanel", "amplitude", "segment", "posthog"];
}
//# sourceMappingURL=index.js.map