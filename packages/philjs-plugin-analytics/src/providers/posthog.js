/**
 * PostHog Analytics Provider
 */
export class PostHogProvider {
    name = "posthog";
    config;
    loaded = false;
    init(config) {
        this.config = config;
        if (typeof window === "undefined")
            return;
        // Check if DNT is enabled
        if (config.privacy?.respectDnt && this.isDNTEnabled()) {
            console.log("[PostHog] Do Not Track is enabled, analytics disabled");
            return;
        }
        // Load PostHog script
        this.loadScript();
        if (config.debug) {
            console.log("[PostHog] Initialized");
        }
    }
    trackEvent(event) {
        if (!this.isLoaded())
            return;
        window.posthog.capture(event.name, event.properties || {});
        if (this.config.debug) {
            console.log("[PostHog] Event tracked:", event);
        }
    }
    trackPageView(url, title) {
        if (!this.isLoaded())
            return;
        window.posthog.capture("$pageview", {
            $current_url: url || window.location.href,
            $title: title || document.title,
        });
        if (this.config.debug) {
            console.log("[PostHog] Page view tracked:", { url, title });
        }
    }
    identifyUser(identification) {
        if (!this.isLoaded())
            return;
        window.posthog.identify(identification.userId, identification.traits || {});
        if (this.config.debug) {
            console.log("[PostHog] User identified:", identification.userId);
        }
    }
    setUserProperties(properties) {
        if (!this.isLoaded())
            return;
        window.posthog.people.set(properties);
        if (this.config.debug) {
            console.log("[PostHog] User properties set:", properties);
        }
    }
    trackTransaction(transaction) {
        if (!this.isLoaded())
            return;
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
    alias(userId) {
        if (!this.isLoaded())
            return;
        window.posthog.alias(userId);
        if (this.config.debug) {
            console.log("[PostHog] Alias created:", userId);
        }
    }
    /**
     * Reset user session
     */
    reset() {
        if (!this.isLoaded())
            return;
        window.posthog.reset();
        if (this.config.debug) {
            console.log("[PostHog] Session reset");
        }
    }
    /**
     * Set a group for the user
     */
    group(groupType, groupKey, properties) {
        if (!this.isLoaded())
            return;
        window.posthog.group(groupType, groupKey, properties);
        if (this.config.debug) {
            console.log("[PostHog] Group set:", { groupType, groupKey, properties });
        }
    }
    /**
     * Check if a feature flag is enabled
     */
    isFeatureEnabled(flagKey) {
        if (!this.isLoaded())
            return false;
        return window.posthog.isFeatureEnabled(flagKey);
    }
    /**
     * Get feature flag value
     */
    getFeatureFlag(flagKey) {
        if (!this.isLoaded())
            return undefined;
        return window.posthog.getFeatureFlag(flagKey);
    }
    /**
     * Get feature flag payload
     */
    getFeatureFlagPayload(flagKey) {
        if (!this.isLoaded())
            return undefined;
        return window.posthog.getFeatureFlagPayload(flagKey);
    }
    /**
     * Reload feature flags
     */
    reloadFeatureFlags() {
        if (!this.isLoaded())
            return;
        window.posthog.reloadFeatureFlags();
    }
    /**
     * Register a callback for feature flags
     */
    onFeatureFlags(callback) {
        if (!this.isLoaded())
            return;
        window.posthog.onFeatureFlags(callback);
    }
    /**
     * Start a session recording
     */
    startSessionRecording() {
        if (!this.isLoaded())
            return;
        window.posthog.startSessionRecording();
    }
    /**
     * Stop session recording
     */
    stopSessionRecording() {
        if (!this.isLoaded())
            return;
        window.posthog.stopSessionRecording();
    }
    /**
     * Opt in/out of tracking
     */
    optIn() {
        if (!this.isLoaded())
            return;
        window.posthog.opt_in_capturing();
    }
    optOut() {
        if (!this.isLoaded())
            return;
        window.posthog.opt_out_capturing();
    }
    hasOptedOut() {
        if (!this.isLoaded())
            return false;
        return window.posthog.has_opted_out_capturing();
    }
    isLoaded() {
        return (this.loaded &&
            typeof window !== "undefined" &&
            window.posthog &&
            typeof window.posthog.capture === "function");
    }
    loadScript() {
        if (typeof document === "undefined")
            return;
        // PostHog snippet
        (function (t, e) {
            let o, n, p, r;
            if (e["__SV"])
                return;
            (window.posthog = t.posthog = t.posthog || []),
                (t.posthog._i = []),
                (t.posthog.init = function (i, s, a) {
                    function g(t, e) {
                        const o = e.split(".");
                        2 == o.length && ((t = t[o[0]]), (e = o[1]));
                        t[e] = function (...args) {
                            t.push([e].concat(Array.prototype.slice.call(args, 0)));
                        };
                    }
                    ((p = e.createElement("script")).type = "text/javascript"),
                        (p.async = !0),
                        (p.src =
                            s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") +
                                "/static/array.js"),
                        (r = e.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r);
                    let u = t.posthog;
                    if (void 0 !== a) {
                        u = t.posthog[a] = [];
                    }
                    else {
                        a = "posthog";
                    }
                    u.people = u.people || [];
                    u.toString = function (t) {
                        let e = "posthog";
                        return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e;
                    };
                    u.people.toString = function () {
                        return u.toString(1) + ".people (stub)";
                    };
                    o =
                        "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" ");
                    for (n = 0; n < o.length; n++) {
                        g(u, o[n]);
                    }
                    t.posthog._i.push([i, s, a]);
                }),
                (e["__SV"] = 1);
        })(window, document);
        // Initialize PostHog
        const posthogConfig = {
            api_host: this.config.options?.apiHost || "https://us.i.posthog.com",
            capture_pageview: this.config.customEvents?.pageViews ?? true,
            capture_pageleave: true,
            loaded: () => {
                this.loaded = true;
                if (this.config.debug) {
                    console.log("[PostHog] Script loaded");
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
            console.log("[PostHog] Script loading...");
        }
    }
    isDNTEnabled() {
        if (typeof navigator === "undefined")
            return false;
        return (navigator.doNotTrack === "1" ||
            window.doNotTrack === "1" ||
            navigator.msDoNotTrack === "1");
    }
}
//# sourceMappingURL=posthog.js.map