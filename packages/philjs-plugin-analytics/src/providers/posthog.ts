/**
 * PostHog Analytics Provider
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
    posthog: any;
  }
}

export class PostHogProvider implements IAnalyticsProvider {
  name = "posthog" as const;
  private config!: AnalyticsPluginConfig;
  private loaded = false;

  init(config: AnalyticsPluginConfig): void {
    this.config = config;

    if (typeof window === "undefined") return;

    // Check if DNT is enabled
    if (config.privacy?.respectDnt && this.isDNTEnabled()) {
      console.log("[PostHog] Do Not Track is enabled, analytics disabled");
      return;
    }

    // Load PostHog script
    this.loadScript();

    if (config.debug) {
    }
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.isLoaded()) return;

    window.posthog.capture(event.name, event.properties || {});

    if (this.config.debug) {
    }
  }

  trackPageView(url?: string, title?: string): void {
    if (!this.isLoaded()) return;

    window.posthog.capture("$pageview", {
      $current_url: url || window.location.href,
      $title: title || document.title,
    });

    if (this.config.debug) {
      console.log("[PostHog] Page view tracked:", { url, title });
    }
  }

  identifyUser(identification: UserIdentification): void {
    if (!this.isLoaded()) return;

    window.posthog.identify(identification.userId, identification.traits || {});

    if (this.config.debug) {
      console.log("[PostHog] User identified:", identification.userId);
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.isLoaded()) return;

    window.posthog.people.set(properties);

    if (this.config.debug) {
      console.log("[PostHog] User properties set:", properties);
    }
  }

  trackTransaction(transaction: EcommerceTransaction): void {
    if (!this.isLoaded()) return;

    window.posthog.capture("Purchase", {
      transaction_id: transaction.transaction_id,
      revenue: transaction.value,
      currency: transaction.currency || "USD",
      tax: transaction.tax,
      shipping: transaction.shipping,
      items: transaction.items,
      coupon: transaction.coupon,
    });

    if (this.config.debug) {
      console.log("[PostHog] Transaction tracked:", transaction);
    }
  }

  /**
   * Create an alias for a user
   */
  alias(userId: string): void {
    if (!this.isLoaded()) return;

    window.posthog.alias(userId);

    if (this.config.debug) {
    }
  }

  /**
   * Reset user session
   */
  reset(): void {
    if (!this.isLoaded()) return;

    window.posthog.reset();

    if (this.config.debug) {
    }
  }

  /**
   * Set a group for the user
   */
  group(groupType: string, groupKey: string, properties?: Record<string, any>): void {
    if (!this.isLoaded()) return;

    window.posthog.group(groupType, groupKey, properties);

    if (this.config.debug) {
      console.log("[PostHog] Group set:", { groupType, groupKey, properties });
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  isFeatureEnabled(flagKey: string): boolean {
    if (!this.isLoaded()) return false;

    return window.posthog.isFeatureEnabled(flagKey);
  }

  /**
   * Get feature flag value
   */
  getFeatureFlag(flagKey: string): string | boolean | undefined {
    if (!this.isLoaded()) return undefined;

    return window.posthog.getFeatureFlag(flagKey);
  }

  /**
   * Get feature flag payload
   */
  getFeatureFlagPayload(flagKey: string): any {
    if (!this.isLoaded()) return undefined;

    return window.posthog.getFeatureFlagPayload(flagKey);
  }

  /**
   * Reload feature flags
   */
  reloadFeatureFlags(): void {
    if (!this.isLoaded()) return;

    window.posthog.reloadFeatureFlags();
  }

  /**
   * Register a callback for feature flags
   */
  onFeatureFlags(callback: (flags: string[]) => void): void {
    if (!this.isLoaded()) return;

    window.posthog.onFeatureFlags(callback);
  }

  /**
   * Start a session recording
   */
  startSessionRecording(): void {
    if (!this.isLoaded()) return;

    window.posthog.startSessionRecording();
  }

  /**
   * Stop session recording
   */
  stopSessionRecording(): void {
    if (!this.isLoaded()) return;

    window.posthog.stopSessionRecording();
  }

  /**
   * Opt in/out of tracking
   */
  optIn(): void {
    if (!this.isLoaded()) return;
    window.posthog.opt_in_capturing();
  }

  optOut(): void {
    if (!this.isLoaded()) return;
    window.posthog.opt_out_capturing();
  }

  hasOptedOut(): boolean {
    if (!this.isLoaded()) return false;
    return window.posthog.has_opted_out_capturing();
  }

  isLoaded(): boolean {
    return (
      this.loaded &&
      typeof window !== "undefined" &&
      window.posthog &&
      typeof window.posthog.capture === "function"
    );
  }

  private loadScript(): void {
    if (typeof document === "undefined") return;

    // PostHog snippet
    (function(t: Window, e: Document & { __SV?: number }) {
      let o: any, n: any, p: any, r: any;
      if (e["__SV"]) return;
      (window.posthog = t.posthog = t.posthog || []),
      (t.posthog._i = []),
      (t.posthog.init = function(i: string, s: any, a?: string) {
        function g(t: any, e: any) {
          const o = e.split(".");
          2 == o.length && ((t = t[o[0]]), (e = o[1]));
          t[e] = function (...args: any[]) {
            t.push([e].concat(Array.prototype.slice.call(args, 0)));
          };
        }
        ((p = e.createElement("script")).type = "text/javascript"),
          (p.async = !0),
          (p.src =
            s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") +
            "/static/array.js"),
          (r = e.getElementsByTagName("script")[0]!).parentNode!.insertBefore(p, r);
        let u: any = t.posthog;
        if (void 0 !== a) { u = t.posthog[a] = []; } else { a = "posthog"; }
        u.people = u.people || [];
        u.toString = function (t: any) {
          let e = "posthog";
          return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e;
        };
        u.people.toString = function () {
          return u.toString(1) + ".people (stub)";
        };
        o =
          "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(
            " "
          );
        for (n = 0; n < o.length; n++) {
          g(u, o[n]);
        }
        t.posthog._i.push([i, s, a]);
      }),
      (e["__SV"] = 1);
    })(window, document);

    // Initialize PostHog
    const posthogConfig: Record<string, any> = {
      api_host: this.config.options?.apiHost || "https://us.i.posthog.com",
      capture_pageview: this.config.customEvents?.pageViews ?? true,
      capture_pageleave: true,
      loaded: () => {
        this.loaded = true;
        if (this.config.debug) {
        }
      },
    };

    // Privacy settings
    if (this.config.privacy?.anonymizeIp) {
      posthogConfig["property_blacklist"] = ["$ip"];
    }

    // Session recording settings
    if (this.config.options?.["sessionRecording"] !== false) {
      posthogConfig["disable_session_recording"] = false;
    }

    // Autocapture settings
    if (this.config.options?.["autocapture"] !== undefined) {
      posthogConfig["autocapture"] = this.config.options["autocapture"];
    }

    window.posthog.init(this.config.trackingId, posthogConfig);

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
