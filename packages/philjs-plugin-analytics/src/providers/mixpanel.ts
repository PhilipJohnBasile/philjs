/**
 * Mixpanel Analytics Provider
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
    mixpanel: any;
  }
}

export class MixpanelProvider implements IAnalyticsProvider {
  name = "mixpanel" as const;
  private config!: AnalyticsPluginConfig;
  private loaded = false;

  init(config: AnalyticsPluginConfig): void {
    this.config = config;

    if (typeof window === "undefined") return;

    // Check if DNT is enabled
    if (config.privacy?.respectDnt && this.isDNTEnabled()) {
      console.log("[Mixpanel] Do Not Track is enabled, analytics disabled");
      return;
    }

    // Load Mixpanel snippet
    this.loadScript();

    // Initialize Mixpanel
    const initConfig: Record<string, any> = {
      debug: config.debug || false,
      track_pageview: config.customEvents?.pageViews ?? false,
      persistence: config.options?.persistence || "cookie",
      ...(config.options || {}),
    };

    if (config.privacy?.cookieDomain) {
      initConfig.cookie_domain = config.privacy.cookieDomain;
    }

    if (config.privacy?.cookieExpires) {
      initConfig.cookie_expiration = config.privacy.cookieExpires;
    }

    if (config.privacy?.anonymizeIp) {
      initConfig.ip = false;
    }

    // Wait for Mixpanel to load, then initialize
    this.waitForLoad().then(() => {
      window.mixpanel.init(config.trackingId, initConfig);
      this.loaded = true;

      if (config.debug) {
        console.log("[Mixpanel] Initialized with config:", initConfig);
      }
    });
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.isLoaded()) return;

    window.mixpanel.track(event.name, event.properties || {});

    if (this.config.debug) {
      console.log("[Mixpanel] Event tracked:", event);
    }
  }

  trackPageView(url?: string, title?: string): void {
    if (!this.isLoaded()) return;

    window.mixpanel.track("Page View", {
      url: url || window.location.href,
      title: title || document.title,
    });

    if (this.config.debug) {
      console.log("[Mixpanel] Page view tracked:", { url, title });
    }
  }

  identifyUser(identification: UserIdentification): void {
    if (!this.isLoaded()) return;

    window.mixpanel.identify(identification.userId);

    if (identification.traits) {
      window.mixpanel.people.set(identification.traits);
    }

    if (this.config.debug) {
      console.log("[Mixpanel] User identified:", identification.userId);
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.isLoaded()) return;

    window.mixpanel.people.set(properties);

    if (this.config.debug) {
      console.log("[Mixpanel] User properties set:", properties);
    }
  }

  trackTransaction(transaction: EcommerceTransaction): void {
    if (!this.isLoaded()) return;

    window.mixpanel.track("Purchase", {
      transaction_id: transaction.transaction_id,
      revenue: transaction.value,
      currency: transaction.currency || "USD",
      tax: transaction.tax,
      shipping: transaction.shipping,
      items: transaction.items,
      coupon: transaction.coupon,
    });

    // Track revenue
    window.mixpanel.people.track_charge(transaction.value, {
      transaction_id: transaction.transaction_id,
    });

    if (this.config.debug) {
      console.log("[Mixpanel] Transaction tracked:", transaction);
    }
  }

  isLoaded(): boolean {
    return (
      this.loaded &&
      typeof window !== "undefined" &&
      window.mixpanel &&
      typeof window.mixpanel.track === "function"
    );
  }

  private loadScript(): void {
    if (typeof document === "undefined") return;

    // Mixpanel snippet (minified)
    (function (c: Document, a: any) {
      if (!a.__SV) {
        let b: any = window;
        try {
          let d: any,
            m: any,
            j: any,
            k = b.location,
            f = k.hash;
          d = function (a: any, b: any) {
            return (m = a.match(RegExp(b + "=([^&]*)"))) ? m[1] : null;
          };
          f &&
            d(f, "state") &&
            ((j = JSON.parse(decodeURIComponent(d(f, "state")))),
            "mpeditor" === j.action &&
              (b.sessionStorage.setItem("_mpcehash", f),
              history.replaceState(j.desiredHash || "", c.title, k.pathname + k.search)));
        } catch (n) {}
        let l: any, h: any;
        window.mixpanel = a;
        a._i = [];
        a.init = function (b: any, d: any, g: any) {
          function c(b: any, i: any) {
            let a = i.split(".");
            2 == a.length && ((b = b[a[0]]), (i = a[1]));
            b[i] = function () {
              b.push([i].concat(Array.prototype.slice.call(arguments, 0)));
            };
          }
          let e = a;
          "undefined" !== typeof g ? (e = a[g] = []) : (g = "mixpanel");
          e.people = e.people || [];
          e.toString = function (b: any) {
            let a = "mixpanel";
            "mixpanel" !== g && (a += "." + g);
            b || (a += " (stub)");
            return a;
          };
          e.people.toString = function () {
            return e.toString(1) + ".people (stub)";
          };
          l =
            "disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(
              " "
            );
          for (h = 0; h < l.length; h++) c(e, l[h]);
          let f =
            "set set_once union unset remove delete".split(" ");
          e.get_group = function () {
            function a(c: any) {
              b[c] = function () {
                let call2_args = arguments;
                let call2 = [c].concat(Array.prototype.slice.call(call2_args, 0));
                e.push([d, call2]);
              };
            }
            for (
              let b: any = {},
                d = ["get_group"].concat(Array.prototype.slice.call(arguments, 0)),
                c = 0;
              c < f.length;
              c++
            )
              a(f[c]);
            return b;
          };
          a._i.push([b, d, g]);
        };
        a.__SV = 1.2;
        let b = c.createElement("script");
        b.type = "text/javascript";
        b.async = !0;
        b.src =
          "undefined" !== typeof (window as any).MIXPANEL_CUSTOM_LIB_URL
            ? (window as any).MIXPANEL_CUSTOM_LIB_URL
            : "file:" === c.location.protocol &&
              "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)
            ? "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"
            : "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
        let d = c.getElementsByTagName("script")[0];
        d.parentNode!.insertBefore(b, d);
      }
    })(document, window.mixpanel || []);

    if (this.config.debug) {
      console.log("[Mixpanel] Script loading...");
    }
  }

  private async waitForLoad(): Promise<void> {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (window.mixpanel && typeof window.mixpanel.init === "function") {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
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
