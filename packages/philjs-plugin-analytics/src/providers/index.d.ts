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
import type { AnalyticsProvider, IAnalyticsProvider } from "../types.js";
/**
 * Get provider instance by name
 */
export declare function getProvider(name: AnalyticsProvider): IAnalyticsProvider;
/**
 * Get all available providers
 */
export declare function getAvailableProviders(): AnalyticsProvider[];
//# sourceMappingURL=index.d.ts.map