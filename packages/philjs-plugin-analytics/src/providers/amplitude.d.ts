/**
 * Amplitude Analytics Provider
 */
import type { AnalyticsEvent, AnalyticsPluginConfig, EcommerceTransaction, IAnalyticsProvider, UserIdentification } from "../types.js";
declare global {
    interface Window {
        amplitude: any;
    }
}
export declare class AmplitudeProvider implements IAnalyticsProvider {
    name: "amplitude";
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
    private isDNTEnabled;
}
//# sourceMappingURL=amplitude.d.ts.map