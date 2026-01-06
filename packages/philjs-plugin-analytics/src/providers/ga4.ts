/**
 * Google Analytics 4 Provider
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
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export class GA4Provider implements IAnalyticsProvider {
  name = "ga4" as const;
  private config!: AnalyticsPluginConfig;
  private loaded = false;

  init(config: AnalyticsPluginConfig): void {
    this.config = config;

    if (typeof window === "undefined") return;

    // Check if DNT is enabled
    if (config.privacy?.respectDnt && this.isDNTEnabled()) {
      console.log("[GA4] Do Not Track is enabled, analytics disabled");
      this.loaded = false;
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }

    // Set timestamp
    window.gtag("js", new Date());

    // Configure GA4
    const gtagConfig: Record<string, any> = {
      send_page_view: config.customEvents?.pageViews ?? true,
      ...(config.options || {}),
    };

    if (config.privacy?.anonymizeIp) {
      gtagConfig['anonymize_ip'] = true;
    }

    if (config.privacy?.cookieDomain) {
      gtagConfig['cookie_domain'] = config.privacy.cookieDomain;
    }

    if (config.privacy?.cookieExpires) {
      gtagConfig['cookie_expires'] = config.privacy.cookieExpires * 24 * 60 * 60;
    }

    window.gtag("config", config.trackingId, gtagConfig);

    // Allow event tracking immediately; gtag queues until script loads.
    this.loaded = true;

    // Load GA4 script
    this.loadScript();

    if (config.debug) {
      console.log("[GA4] Initialized with config:", gtagConfig);
    }
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.isLoaded()) return;

    window.gtag("event", event.name, event.properties || {});

    if (this.config.debug) {
    }
  }

  trackPageView(url?: string, title?: string): void {
    if (!this.isLoaded()) return;

    const properties: Record<string, any> = {};

    if (url) properties['page_path'] = url;
    if (title) properties['page_title'] = title;

    window.gtag("event", "page_view", properties);

    if (this.config.debug) {
      console.log("[GA4] Page view tracked:", properties);
    }
  }

  identifyUser(identification: UserIdentification): void {
    if (!this.isLoaded()) return;

    window.gtag("config", this.config.trackingId, {
      user_id: identification.userId,
    });

    if (identification.traits) {
      this.setUserProperties(identification.traits);
    }

    if (this.config.debug) {
      console.log("[GA4] User identified:", identification.userId);
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.isLoaded()) return;

    window.gtag("set", "user_properties", properties);

    if (this.config.debug) {
      console.log("[GA4] User properties set:", properties);
    }
  }

  trackTransaction(transaction: EcommerceTransaction): void {
    if (!this.isLoaded()) return;

    window.gtag("event", "purchase", {
      transaction_id: transaction.transaction_id,
      value: transaction.value,
      currency: transaction.currency || "USD",
      tax: transaction.tax,
      shipping: transaction.shipping,
      items: transaction.items,
      coupon: transaction.coupon,
    });

    if (this.config.debug) {
      console.log("[GA4] Transaction tracked:", transaction);
    }
  }

  isLoaded(): boolean {
    return this.loaded && typeof window !== "undefined" && typeof window.gtag === "function";
  }

  private loadScript(): void {
    if (typeof document === "undefined") return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.trackingId}`;
    script.onload = () => {
      this.loaded = true;
      if (this.config.debug) {
      }
    };

    document.head.appendChild(script);
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
