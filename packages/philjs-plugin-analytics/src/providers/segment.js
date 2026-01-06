/**
 * Segment Analytics Provider
 */
export class SegmentProvider {
    name = "segment";
    config;
    loaded = false;
    init(config) {
        this.config = config;
        if (typeof window === "undefined")
            return;
        // Check if DNT is enabled
        if (config.privacy?.respectDnt && this.isDNTEnabled()) {
            console.log("[Segment] Do Not Track is enabled, analytics disabled");
            return;
        }
        // Load Segment Analytics.js
        this.loadScript();
        if (config.debug) {
        }
    }
    trackEvent(event) {
        if (!this.isLoaded())
            return;
        window.analytics.track(event.name, event.properties || {});
        if (this.config.debug) {
        }
    }
    trackPageView(url, title) {
        if (!this.isLoaded())
            return;
        window.analytics.page({
            path: url || window.location.pathname,
            title: title || document.title,
            url: window.location.href,
            referrer: document.referrer,
        });
        if (this.config.debug) {
            console.log("[Segment] Page view tracked:", { url, title });
        }
    }
    identifyUser(identification) {
        if (!this.isLoaded())
            return;
        window.analytics.identify(identification.userId, identification.traits || {});
        if (this.config.debug) {
            console.log("[Segment] User identified:", identification.userId);
        }
    }
    setUserProperties(properties) {
        if (!this.isLoaded())
            return;
        // Segment uses identify for setting user properties
        window.analytics.identify(properties);
        if (this.config.debug) {
            console.log("[Segment] User properties set:", properties);
        }
    }
    trackTransaction(transaction) {
        if (!this.isLoaded())
            return;
        // Segment E-commerce spec: Order Completed event
        window.analytics.track("Order Completed", {
            order_id: transaction.transaction_id,
            total: transaction.value,
            revenue: transaction.value,
            currency: transaction.currency || "USD",
            tax: transaction.tax,
            shipping: transaction.shipping,
            coupon: transaction.coupon,
            products: transaction.items?.map((item) => ({
                product_id: item.item_id,
                name: item.item_name,
                price: item.price,
                quantity: item.quantity || 1,
                category: item.item_category,
            })),
        });
        if (this.config.debug) {
            console.log("[Segment] Transaction tracked:", transaction);
        }
    }
    /**
     * Track group membership (companies, organizations)
     */
    group(groupId, traits) {
        if (!this.isLoaded())
            return;
        window.analytics.group(groupId, traits || {});
        if (this.config.debug) {
            console.log("[Segment] Group tracked:", { groupId, traits });
        }
    }
    /**
     * Create an alias for a user
     */
    alias(userId, previousId) {
        if (!this.isLoaded())
            return;
        window.analytics.alias(userId, previousId);
        if (this.config.debug) {
            console.log("[Segment] Alias created:", { userId, previousId });
        }
    }
    /**
     * Reset anonymous user data
     */
    reset() {
        if (!this.isLoaded())
            return;
        window.analytics.reset();
        if (this.config.debug) {
        }
    }
    isLoaded() {
        return (this.loaded &&
            typeof window !== "undefined" &&
            window.analytics &&
            typeof window.analytics.track === "function");
    }
    loadScript() {
        if (typeof document === "undefined")
            return;
        // Segment Analytics.js snippet
        const analytics = (window.analytics = window.analytics || []);
        if (!analytics.initialize) {
            if (analytics.invoked) {
                window.console &&
                    console.error &&
                    console.error("Segment snippet included twice.");
            }
            else {
                analytics.invoked = true;
                analytics.methods = [
                    "trackSubmit",
                    "trackClick",
                    "trackLink",
                    "trackForm",
                    "pageview",
                    "identify",
                    "reset",
                    "group",
                    "track",
                    "ready",
                    "alias",
                    "debug",
                    "page",
                    "once",
                    "off",
                    "on",
                    "addSourceMiddleware",
                    "addIntegrationMiddleware",
                    "setAnonymousId",
                    "addDestinationMiddleware",
                ];
                analytics.factory = function (e) {
                    return function (...args) {
                        const t = Array.prototype.slice.call(args);
                        t.unshift(e);
                        analytics.push(t);
                        return analytics;
                    };
                };
                for (let e = 0; e < analytics.methods.length; e++) {
                    const key = analytics.methods[e];
                    analytics[key] = analytics.factory(key);
                }
                analytics.load = (key, e) => {
                    const t = document.createElement("script");
                    t.type = "text/javascript";
                    t.async = true;
                    t.src =
                        "https://cdn.segment.com/analytics.js/v1/" +
                            key +
                            "/analytics.min.js";
                    const n = document.getElementsByTagName("script")[0];
                    n?.parentNode?.insertBefore(t, n);
                    analytics._loadOptions = e;
                };
                analytics._writeKey = this.config.trackingId;
                analytics.SNIPPET_VERSION = "4.15.3";
                // Load with write key
                analytics.load(this.config.trackingId);
                // Track initial page view if enabled
                if (this.config.customEvents?.pageViews) {
                    analytics.page();
                }
                this.loaded = true;
                if (this.config.debug) {
                }
            }
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
//# sourceMappingURL=segment.js.map