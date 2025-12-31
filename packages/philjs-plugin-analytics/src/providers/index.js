/**
 * Analytics Providers
 * Note: mixpanel, amplitude, and posthog are temporarily disabled due to type issues
 */
export * from "./ga4.js";
export * from "./plausible.js";
export * from "./segment.js";
import { GA4Provider } from "./ga4.js";
import { PlausibleProvider } from "./plausible.js";
import { SegmentProvider } from "./segment.js";
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
        case "amplitude":
        case "posthog":
            throw new Error(`Provider ${name} is temporarily disabled`);
        default:
            throw new Error(`Unknown analytics provider: ${name}`);
    }
}
/**
 * Get all available providers
 */
export function getAvailableProviders() {
    return ["ga4", "plausible", "segment"];
}
//# sourceMappingURL=index.js.map