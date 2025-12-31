/**
 * Analytics Providers
 * Note: mixpanel, amplitude, and posthog are temporarily disabled due to type issues
 */
export * from "./ga4.js";
export * from "./plausible.js";
export * from "./segment.js";
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