/**
 * PostHog Analytics Provider
 */
import type { AnalyticsEvent, AnalyticsPluginConfig, EcommerceTransaction, IAnalyticsProvider, UserIdentification } from "../types.js";
declare global {
    interface Window {
        posthog: any;
    }
}
export declare class PostHogProvider implements IAnalyticsProvider {
    name: "posthog";
    private config;
    private loaded;
    init(config: AnalyticsPluginConfig): void;
    trackEvent(event: AnalyticsEvent): void;
    trackPageView(url?: string, title?: string): void;
    identifyUser(identification: UserIdentification): void;
    setUserProperties(properties: Record<string, any>): void;
    trackTransaction(transaction: EcommerceTransaction): void;
    /**
     * Create an alias for a user
     */
    alias(userId: string): void;
    /**
     * Reset user session
     */
    reset(): void;
    /**
     * Set a group for the user
     */
    group(groupType: string, groupKey: string, properties?: Record<string, any>): void;
    /**
     * Check if a feature flag is enabled
     */
    isFeatureEnabled(flagKey: string): boolean;
    /**
     * Get feature flag value
     */
    getFeatureFlag(flagKey: string): string | boolean | undefined;
    /**
     * Get feature flag payload
     */
    getFeatureFlagPayload(flagKey: string): any;
    /**
     * Reload feature flags
     */
    reloadFeatureFlags(): void;
    /**
     * Register a callback for feature flags
     */
    onFeatureFlags(callback: (flags: string[]) => void): void;
    /**
     * Start a session recording
     */
    startSessionRecording(): void;
    /**
     * Stop session recording
     */
    stopSessionRecording(): void;
    /**
     * Opt in/out of tracking
     */
    optIn(): void;
    optOut(): void;
    hasOptedOut(): boolean;
    isLoaded(): boolean;
    private loadScript;
    private isDNTEnabled;
}
//# sourceMappingURL=posthog.d.ts.map