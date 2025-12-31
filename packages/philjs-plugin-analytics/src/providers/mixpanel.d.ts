/**
 * Mixpanel Analytics Provider
 */
import type { AnalyticsEvent, AnalyticsPluginConfig, EcommerceTransaction, IAnalyticsProvider, UserIdentification } from "../types.js";
declare global {
    interface Window {
        mixpanel: any;
    }
}
export declare class MixpanelProvider implements IAnalyticsProvider {
    name: "mixpanel";
    private config;
    private loaded;
    init(config: AnalyticsPluginConfig): void;
    trackEvent(event: AnalyticsEvent): void;
    trackPageView(url?: string, title?: string): void;
    identifyUser(identification: UserIdentification): void;
    setUserProperties(properties: Record<string, any>): void;
    trackTransaction(transaction: EcommerceTransaction): void;
    isLoaded(): boolean;
    private loadScript;
    private waitForLoad;
    private isDNTEnabled;
}
//# sourceMappingURL=mixpanel.d.ts.map