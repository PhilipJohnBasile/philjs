/**
 * PhilJS Analytics Plugin
 * Universal analytics integration for multiple providers
 */

import type { Plugin, PluginContext } from "philjs-core/plugin-system";

/**
 * Analytics provider types
 */
export type AnalyticsProvider =
  | "google-analytics"
  | "ga4"
  | "plausible"
  | "mixpanel"
  | "amplitude"
  | "segment"
  | "posthog"
  | "umami"
  | "fathom";

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

/**
 * Analytics plugin configuration
 */
export interface AnalyticsPluginConfig {
  /** Analytics provider */
  provider: AnalyticsProvider;
  /** Tracking ID or API key */
  trackingId: string;
  /** Additional provider-specific options */
  options?: Record<string, any>;
  /** Enable debug mode */
  debug?: boolean;
  /** Disable in development */
  disableInDev?: boolean;
  /** Privacy settings */
  privacy?: {
    /** Anonymize IP addresses */
    anonymizeIp?: boolean;
    /** Respect Do Not Track */
    respectDnt?: boolean;
    /** Cookie consent required */
    cookieConsent?: boolean;
  };
  /** Custom event tracking */
  customEvents?: {
    /** Track page views automatically */
    pageViews?: boolean;
    /** Track clicks automatically */
    clicks?: boolean;
    /** Track form submissions */
    forms?: boolean;
    /** Track errors */
    errors?: boolean;
  };
}

/**
 * Default configuration
 */
const defaultConfig: Partial<AnalyticsPluginConfig> = {
  debug: false,
  disableInDev: true,
  privacy: {
    anonymizeIp: true,
    respectDnt: true,
    cookieConsent: false,
  },
  customEvents: {
    pageViews: true,
    clicks: false,
    forms: false,
    errors: true,
  },
};

/**
 * Generate analytics script injection code
 */
function generateAnalyticsScript(config: AnalyticsPluginConfig): string {
  const { provider, trackingId, options = {} } = config;

  switch (provider) {
    case "google-analytics":
    case "ga4":
      return `
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${trackingId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${trackingId}', ${JSON.stringify(options)});
</script>
      `;

    case "plausible":
      return `
<!-- Plausible Analytics -->
<script defer data-domain="${options.domain || window.location.hostname}" src="https://plausible.io/js/script.js"></script>
      `;

    case "mixpanel":
      return `
<!-- Mixpanel -->
<script>
  (function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
for(h=0;h<l.length;h++)c(e,l[h]);var f="set set_once union unset remove delete".split(" ");e.get_group=function(){function a(c){b[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));e.push([d,call2])}}for(var b={},d=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<f.length;c++)a(f[c]);return b};a._i.push([b,d,g])};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===c.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";d=c.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}})(document,window.mixpanel||[]);
  mixpanel.init("${trackingId}");
</script>
      `;

    case "posthog":
      return `
<!-- PostHog -->
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init('${trackingId}', ${JSON.stringify(options)})
</script>
      `;

    case "umami":
      return `
<!-- Umami Analytics -->
<script async src="${options.scriptUrl || "https://analytics.umami.is/script.js"}" data-website-id="${trackingId}"></script>
      `;

    case "fathom":
      return `
<!-- Fathom Analytics -->
<script src="https://cdn.usefathom.com/script.js" data-site="${trackingId}" defer></script>
      `;

    default:
      return `<!-- Unknown analytics provider: ${provider} -->`;
  }
}

/**
 * Generate client-side analytics initialization
 */
function generateClientInit(config: AnalyticsPluginConfig): string {
  const { provider, customEvents } = config;

  let trackingCode = "";

  // Page view tracking
  if (customEvents?.pageViews) {
    trackingCode += `
// Track page views
if (typeof window !== 'undefined') {
  // Track initial page view
  trackPageView();

  // Track SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    trackPageView();
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    trackPageView();
  };

  window.addEventListener('popstate', trackPageView);
}

function trackPageView() {
  ${getTrackingCall(provider, "page_view", "{ page: window.location.pathname }")}
}
    `;
  }

  // Error tracking
  if (customEvents?.errors) {
    trackingCode += `
// Track errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    ${getTrackingCall(provider, "error", "{ message: event.message, filename: event.filename, lineno: event.lineno }")}
  });

  window.addEventListener('unhandledrejection', (event) => {
    ${getTrackingCall(provider, "error", "{ message: event.reason }")}
  });
}
    `;
  }

  return trackingCode;
}

/**
 * Get tracking call for provider
 */
function getTrackingCall(provider: AnalyticsProvider, eventName: string, properties: string): string {
  switch (provider) {
    case "google-analytics":
    case "ga4":
      return `gtag('event', '${eventName}', ${properties});`;
    case "plausible":
      return `plausible('${eventName}', ${properties});`;
    case "mixpanel":
      return `mixpanel.track('${eventName}', ${properties});`;
    case "posthog":
      return `posthog.capture('${eventName}', ${properties});`;
    case "umami":
      return `umami.track('${eventName}', ${properties});`;
    case "fathom":
      return `fathom.trackEvent('${eventName}', ${properties});`;
    default:
      return `console.log('Track:', '${eventName}', ${properties});`;
  }
}

/**
 * Create Analytics plugin
 */
export function createAnalyticsPlugin(userConfig: AnalyticsPluginConfig): Plugin {
  const config = { ...defaultConfig, ...userConfig } as AnalyticsPluginConfig;

  return {
    meta: {
      name: "philjs-plugin-analytics",
      version: "2.0.0",
      description: "Analytics integration plugin for PhilJS",
      author: "PhilJS Team",
      homepage: "https://philjs.dev/plugins/analytics",
      repository: "https://github.com/yourusername/philjs",
      license: "MIT",
      keywords: ["analytics", "tracking", "ga4", "plausible", "mixpanel"],
      philjs: "^2.0.0",
    },

    configSchema: {
      type: "object",
      required: ["provider", "trackingId"],
      properties: {
        provider: {
          type: "string",
          enum: [
            "google-analytics",
            "ga4",
            "plausible",
            "mixpanel",
            "amplitude",
            "segment",
            "posthog",
            "umami",
            "fathom",
          ],
          description: "Analytics provider",
        },
        trackingId: {
          type: "string",
          description: "Tracking ID or API key",
        },
        debug: {
          type: "boolean",
          description: "Enable debug mode",
          default: false,
        },
      },
    },

    async setup(pluginConfig: AnalyticsPluginConfig, ctx: PluginContext) {
      const mergedConfig = { ...config, ...pluginConfig };

      ctx.logger.info(`Setting up ${mergedConfig.provider} analytics...`);

      // Generate HTML script injection
      const script = generateAnalyticsScript(mergedConfig);

      // Create analytics initialization file for client-side usage
      const analyticsCode = `
/**
 * Analytics initialization
 * Auto-generated by philjs-plugin-analytics
 */

import { analytics } from "philjs-plugin-analytics/client";

// Initialize analytics
analytics.init(${JSON.stringify(mergedConfig, null, 2)});

// Re-export convenience functions
export { trackEvent, trackPageView, identifyUser, setUserProperties, trackTransaction } from "philjs-plugin-analytics/client";
`;

      // Write analytics initialization file
      try {
        await ctx.fs.mkdir("src/lib", { recursive: true });
        await ctx.fs.writeFile("src/lib/analytics.ts", analyticsCode);
        ctx.logger.success("Created analytics initialization file");
      } catch (error) {
        ctx.logger.warn("Could not create analytics file, you can import directly from the package");
      }

      // Try to update index.html to inject script
      const indexPath = "index.html";
      try {
        const hasIndex = await ctx.fs.exists(indexPath);

        if (hasIndex) {
          const indexContent = await ctx.fs.readFile(indexPath);

          if (!indexContent.includes(mergedConfig.trackingId)) {
            const updatedContent = indexContent.replace(
              "</head>",
              `  ${script}\n  </head>`
            );
            await ctx.fs.writeFile(indexPath, updatedContent);
            ctx.logger.success("Added analytics script to index.html");
          } else {
            ctx.logger.warn("Analytics script already present in index.html");
          }
        }
      } catch (error) {
        ctx.logger.info("No index.html found, script injection skipped");
      }

      ctx.logger.success(`${mergedConfig.provider} analytics setup complete!`);
      ctx.logger.info('\nUsage:\nimport { trackEvent } from "./lib/analytics";\n\ntrackEvent("custom_event", { key: "value" });');
    },

    hooks: {
      async init(ctx) {
        ctx.logger.info("Analytics plugin initialized");
      },

      async buildStart(ctx, buildConfig) {
        // Check privacy settings
        if (config.privacy?.respectDnt) {
          ctx.logger.debug("Do Not Track will be respected");
        }
      },
    },
  };
}

/**
 * Default export
 */
export default createAnalyticsPlugin;

/**
 * Analytics utility functions
 */
export const analyticsUtils = {
  /**
   * Check if user has DNT enabled
   */
  hasDNT(): boolean {
    if (typeof window === "undefined") return false;
    return (
      navigator.doNotTrack === "1" ||
      (window as any).doNotTrack === "1" ||
      (navigator as any).msDoNotTrack === "1"
    );
  },

  /**
   * Generate a unique session ID
   */
  generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get user agent info
   */
  getUserAgent() {
    if (typeof navigator === "undefined") return {};

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
    };
  },

  /**
   * Get page metadata
   */
  getPageMetadata() {
    if (typeof window === "undefined") return {};

    return {
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      title: document.title,
      referrer: document.referrer,
    };
  },
};

/**
 * Export types
 */
export type {
  AnalyticsProvider,
  AnalyticsEvent,
  AnalyticsPluginConfig,
  UserIdentification,
  EcommerceItem,
  EcommerceTransaction,
  PrivacyOptions,
  CustomEventOptions,
  ProviderOptions,
  IAnalyticsProvider,
  AnalyticsContext,
} from "./types.js";
