/**
 * Plausible Analytics Provider
 */
export class PlausibleProvider {
    name = "plausible";
    config;
    loaded = false;
    init(config) {
        this.config = config;
        if (typeof window === "undefined")
            return;
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
    trackEvent(event) {
        if (!this.isLoaded())
            return;
        window.plausible(event.name, {
            ...(event.properties !== undefined ? { props: event.properties } : {}),
        });
        if (this.config.debug) {
            console.log("[Plausible] Event tracked:", event);
        }
    }
    trackPageView(url, title) {
        if (!this.isLoaded())
            return;
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
    identifyUser(identification) {
        // Plausible is privacy-focused and doesn't support user identification
        if (this.config.debug) {
            console.log("[Plausible] User identification not supported");
        }
    }
    setUserProperties(properties) {
        // Plausible doesn't support user properties
        if (this.config.debug) {
            console.log("[Plausible] User properties not supported");
        }
    }
    isLoaded() {
        return this.loaded && typeof window !== "undefined" && typeof window.plausible === "function";
    }
    loadScript() {
        if (typeof document === "undefined")
            return;
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
                    (window.plausible.q = window.plausible.q || []).push(arguments);
                };
    }
    isDNTEnabled() {
        if (typeof navigator === "undefined")
            return false;
        return (navigator.doNotTrack === "1" ||
            window.doNotTrack === "1" ||
            navigator.msDoNotTrack === "1");
    }
}
//# sourceMappingURL=plausible.js.map