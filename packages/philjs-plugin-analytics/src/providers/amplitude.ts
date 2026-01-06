/**
 * Amplitude Analytics Provider
 */

import type {
  AnalyticsEvent,
  AnalyticsPluginConfig,
  EcommerceTransaction,
  IAnalyticsProvider,
  UserIdentification,
} from "../types.js";

declare global {
  interface Window {
    amplitude: any;
  }
}

export class AmplitudeProvider implements IAnalyticsProvider {
  name = "amplitude" as const;
  private config!: AnalyticsPluginConfig;
  private loaded = false;

  init(config: AnalyticsPluginConfig): void {
    this.config = config;

    if (typeof window === "undefined") return;

    // Check if DNT is enabled
    if (config.privacy?.respectDnt && this.isDNTEnabled()) {
      console.log("[Amplitude] Do Not Track is enabled, analytics disabled");
      return;
    }

    // Load Amplitude SDK
    this.loadScript();

    if (config.debug) {
    }
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.isLoaded()) return;

    window.amplitude.track(event.name, event.properties || {});

    if (this.config.debug) {
    }
  }

  trackPageView(url?: string, title?: string): void {
    if (!this.isLoaded()) return;

    window.amplitude.track("Page View", {
      page_path: url || window.location.pathname,
      page_title: title || document.title,
      page_url: window.location.href,
    });

    if (this.config.debug) {
      console.log("[Amplitude] Page view tracked:", { url, title });
    }
  }

  identifyUser(identification: UserIdentification): void {
    if (!this.isLoaded()) return;

    window.amplitude.setUserId(identification.userId);

    if (identification.traits) {
      const identify = new window.amplitude.Identify();
      Object.entries(identification.traits).forEach(([key, value]) => {
        identify.set(key, value);
      });
      window.amplitude.identify(identify);
    }

    if (this.config.debug) {
      console.log("[Amplitude] User identified:", identification.userId);
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.isLoaded()) return;

    const identify = new window.amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value);
    });
    window.amplitude.identify(identify);

    if (this.config.debug) {
      console.log("[Amplitude] User properties set:", properties);
    }
  }

  trackTransaction(transaction: EcommerceTransaction): void {
    if (!this.isLoaded()) return;

    const revenue = new window.amplitude.Revenue()
      .setProductId(transaction.transaction_id)
      .setPrice(transaction.value)
      .setQuantity(1);

    window.amplitude.revenue(revenue);

    // Also track as event for funnel analysis
    window.amplitude.track("Purchase", {
      transaction_id: transaction.transaction_id,
      revenue: transaction.value,
      currency: transaction.currency || "USD",
      tax: transaction.tax,
      shipping: transaction.shipping,
      items: transaction.items,
      coupon: transaction.coupon,
    });

    if (this.config.debug) {
      console.log("[Amplitude] Transaction tracked:", transaction);
    }
  }

  isLoaded(): boolean {
    return (
      this.loaded &&
      typeof window !== "undefined" &&
      window.amplitude &&
      typeof window.amplitude.track === "function"
    );
  }

  private loadScript(): void {
    if (typeof document === "undefined") return;

    // Capture class instance for use in IIFE
    const self = this;

    // Amplitude SDK snippet
    (function(e: Window, t: Document) {
      const n = e.amplitude || { _q: [], _iq: {} };
      if (n.invoked)
        typeof console !== "undefined" &&
          console.error &&
          console.error("Amplitude snippet has been loaded.");
      else {
        n.invoked = true;
        const s = t.createElement("script");
        s.type = "text/javascript";
        s.integrity =
          "sha384-girahbTbYZ9tT03PWWj0mEVgyxtZoyDF9KVZdL+R53PP5wCY0PiVUKq0jeRlMx9M";
        s.crossOrigin = "anonymous";
        s.async = true;
        s.src = "https://cdn.amplitude.com/libs/analytics-browser-2.0.0-min.js.gz";
        s.onload = () => {
          if (!e.amplitude.runQueuedFunctions) {
          }
          e.amplitude.init(self.config.trackingId, undefined, {
            defaultTracking: {
              sessions: true,
              pageViews: self.config.customEvents?.pageViews ?? true,
              formInteractions: self.config.customEvents?.forms ?? false,
              fileDownloads: true,
            },
          });
          self.loaded = true;
        };
        const r = t.getElementsByTagName("script")[0];
        r!.parentNode!.insertBefore(s, r!);
        const i = (e: string) => {
          return function (...args: any[]) {
            n._q.push({ name: e, args: Array.prototype.slice.call(args, 0) });
          };
        };
        const o = [
          "init",
          "logEvent",
          "logRevenue",
          "setUserId",
          "setUserProperties",
          "setOptOut",
          "setVersionName",
          "setDomain",
          "setDeviceId",
          "enableTracking",
          "setGlobalUserProperties",
          "identify",
          "clearUserProperties",
          "setGroup",
          "logRevenueV2",
          "regenerateDeviceId",
          "groupIdentify",
          "onInit",
          "logEventWithTimestamp",
          "logEventWithGroups",
          "setSessionId",
          "resetSessionId",
          "getDeviceId",
          "getUserId",
          "setMinTimeBetweenSessionsMillis",
          "setEventUploadThreshold",
          "setUseDynamicConfig",
          "setServerZone",
          "setServerUrl",
          "sendEvents",
          "setLibrary",
          "setTransport",
          "track",
          "revenue",
        ];
        for (let a = 0; a < o.length; a++) {
          const methodName = o[a];
          if (methodName !== undefined) {
            n[methodName] = i(methodName);
          }
        }
        e.amplitude = n;
      }
    })(window, document);

    if (this.config.debug) {
    }
  }

  private isDNTEnabled(): boolean {
    if (typeof navigator === "undefined") return false;
    return (
      navigator.doNotTrack === "1" ||
      (window as any).doNotTrack === "1" ||
      (navigator as any).msDoNotTrack === "1"
    );
  }
}
