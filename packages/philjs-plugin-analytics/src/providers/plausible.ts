/**
 * Plausible Analytics Provider
 */

import type {
  AnalyticsEvent,
  AnalyticsPluginConfig,
  IAnalyticsProvider,
  UserIdentification,
} from "../types.js";

declare global {
  interface Window {
    plausible: (
      event: string,
      options?: { props?: Record<string, any>; callback?: () => void }
    ) => void;
  }
}

export class PlausibleProvider implements IAnalyticsProvider {
  name = "plausible" as const;
  private config!: AnalyticsPluginConfig;
  private loaded = false;

  init(config: AnalyticsPluginConfig): void {
    this.config = config;

    if (typeof window === "undefined") return;

    // Check if DNT is enabled
    if (config.privacy?.respectDnt && this.isDNTEnabled()) {
      console.log("[Plausible] Do Not Track is enabled, analytics disabled");
      return;
    }

    // Load Plausible script
    this.loadScript();

    if (config.debug) {
      console.log("[Plausible] Initialized");
    }
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.isLoaded()) return;

    window.plausible(event.name, {
      props: event.properties,
    });

    if (this.config.debug) {
      console.log("[Plausible] Event tracked:", event);
    }
  }

  trackPageView(url?: string, title?: string): void {
    if (!this.isLoaded()) return;

    // Plausible automatically tracks page views
    // Manual tracking only needed for SPAs with custom behavior
    if (url) {
      window.plausible("pageview", {
        props: {
          url,
          title,
        },
      });

      if (this.config.debug) {
        console.log("[Plausible] Page view tracked:", { url, title });
      }
    }
  }

  identifyUser(identification: UserIdentification): void {
    // Plausible is privacy-focused and doesn't support user identification
    if (this.config.debug) {
      console.log("[Plausible] User identification not supported");
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    // Plausible doesn't support user properties
    if (this.config.debug) {
      console.log("[Plausible] User properties not supported");
    }
  }

  isLoaded(): boolean {
    return this.loaded && typeof window !== "undefined" && typeof window.plausible === "function";
  }

  private loadScript(): void {
    if (typeof document === "undefined") return;

    const script = document.createElement("script");
    script.defer = true;

    const domain = this.config.options?.domain || window.location.hostname;
    const apiHost = this.config.options?.apiHost || "https://plausible.io";
    const hashMode = this.config.options?.hashMode || false;

    script.setAttribute("data-domain", domain);
    script.src = hashMode
      ? `${apiHost}/js/script.hash.js`
      : `${apiHost}/js/script.js`;

    script.onload = () => {
      this.loaded = true;
      if (this.config.debug) {
        console.log("[Plausible] Script loaded");
      }
    };

    document.head.appendChild(script);

    // Add plausible function immediately
    window.plausible =
      window.plausible ||
      function () {
        ((window.plausible as any).q = (window.plausible as any).q || []).push(arguments);
      };
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
