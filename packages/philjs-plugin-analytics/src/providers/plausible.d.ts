/**
 * Plausible Analytics Provider
 */
import type { AnalyticsEvent, AnalyticsPluginConfig, IAnalyticsProvider, UserIdentification } from "../types.js";
declare global {
    interface Window {
        plausible: (event: string, options?: {
            props?: Record<string, any>;
            callback?: () => void;
        }) => void;
    }
}
export declare class PlausibleProvider implements IAnalyticsProvider {
    name: "plausible";
    private config;
    private loaded;
    init(config: AnalyticsPluginConfig): void;
    trackEvent(event: AnalyticsEvent): void;
    trackPageView(url?: string, title?: string): void;
    identifyUser(identification: UserIdentification): void;
    setUserProperties(properties: Record<string, any>): void;
    isLoaded(): boolean;
    private loadScript;
    private isDNTEnabled;
}
//# sourceMappingURL=plausible.d.ts.map