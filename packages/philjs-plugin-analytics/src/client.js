/**
 * Client-side analytics runtime
 * This is the code that runs in the browser
 */
import { getProvider } from "./providers/index.js";
/**
 * Analytics client singleton
 */
class AnalyticsClient {
    provider = null;
    config = null;
    context = null;
    initialized = false;
    eventQueue = [];
    /**
     * Initialize analytics
     */
    init(config) {
        if (this.initialized) {
            console.warn("[Analytics] Already initialized");
            return;
        }
        this.config = config;
        // Check if we should disable in development
        if (config.disableInDev && this.isDevelopment()) {
            console.log("[Analytics] Disabled in development mode");
            return;
        }
        // Check DNT
        if (config.privacy?.respectDnt && this.isDNTEnabled()) {
            console.log("[Analytics] Do Not Track is enabled, analytics disabled");
            return;
        }
        // Initialize provider
        try {
            this.provider = getProvider(config.provider);
            this.provider.init(config);
            this.initialized = true;
            // Create analytics context
            this.context = this.createContext();
            // Process queued events
            this.processEventQueue();
            // Setup auto-tracking
            this.setupAutoTracking();
            if (config.debug) {
                console.log("[Analytics] Initialized with provider:", config.provider);
            }
        }
        catch (error) {
            console.error("[Analytics] Initialization error:", error);
        }
    }
    /**
     * Track custom event
     */
    trackEvent(name, properties) {
        const event = {
            name,
            properties: {
                ...properties,
                ...this.getContextProperties(),
            },
            timestamp: Date.now(),
        };
        if (!this.initialized || !this.provider) {
            this.eventQueue.push(event);
            return;
        }
        this.provider.trackEvent(event);
    }
    /**
     * Track page view
     */
    trackPageView(url, title) {
        if (!this.initialized || !this.provider) {
            return;
        }
        this.provider.trackPageView(url || window.location.pathname, title || document.title);
    }
    /**
     * Identify user
     */
    identifyUser(userId, traits) {
        if (!this.initialized || !this.provider) {
            return;
        }
        const identification = {
            userId,
            ...(traits !== undefined && { traits }),
        };
        this.provider.identifyUser(identification);
    }
    /**
     * Set user properties
     */
    setUserProperties(properties) {
        if (!this.initialized || !this.provider) {
            return;
        }
        this.provider.setUserProperties(properties);
    }
    /**
     * Track e-commerce transaction
     */
    trackTransaction(transaction) {
        if (!this.initialized || !this.provider?.trackTransaction) {
            return;
        }
        this.provider.trackTransaction(transaction);
    }
    /**
     * Get analytics context
     */
    getContext() {
        return this.context;
    }
    /**
     * Check if analytics is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Setup automatic tracking
     */
    setupAutoTracking() {
        if (!this.config)
            return;
        // Page view tracking
        if (this.config.customEvents?.pageViews) {
            this.setupPageViewTracking();
        }
        // Error tracking
        if (this.config.customEvents?.errors) {
            this.setupErrorTracking();
        }
        // Click tracking
        if (this.config.customEvents?.clicks) {
            this.setupClickTracking();
        }
        // Form tracking
        if (this.config.customEvents?.forms) {
            this.setupFormTracking();
        }
        // Performance tracking
        if (this.config.customEvents?.performance) {
            this.setupPerformanceTracking();
        }
    }
    /**
     * Setup page view tracking for SPAs
     */
    setupPageViewTracking() {
        // Track initial page view
        this.trackPageView();
        // Track SPA navigation
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = (...args) => {
            originalPushState.apply(history, args);
            this.trackPageView();
        };
        history.replaceState = (...args) => {
            originalReplaceState.apply(history, args);
            this.trackPageView();
        };
        window.addEventListener("popstate", () => {
            this.trackPageView();
        });
    }
    /**
     * Setup error tracking
     */
    setupErrorTracking() {
        window.addEventListener("error", (event) => {
            this.trackEvent("error", {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
            });
        });
        window.addEventListener("unhandledrejection", (event) => {
            this.trackEvent("unhandled_rejection", {
                reason: event.reason,
                promise: String(event.promise),
            });
        });
    }
    /**
     * Setup click tracking
     */
    setupClickTracking() {
        document.addEventListener("click", (event) => {
            const target = event.target;
            if (!target)
                return;
            const trackableElement = target.closest("[data-track-click]");
            if (trackableElement) {
                const eventName = trackableElement.getAttribute("data-track-click") || "click";
                const properties = {
                    element: trackableElement.tagName.toLowerCase(),
                    text: trackableElement.textContent?.trim(),
                };
                // Get data attributes
                Array.from(trackableElement.attributes).forEach((attr) => {
                    if (attr.name.startsWith("data-track-")) {
                        const key = attr.name.replace("data-track-", "");
                        properties[key] = attr.value;
                    }
                });
                this.trackEvent(eventName, properties);
            }
        });
    }
    /**
     * Setup form tracking
     */
    setupFormTracking() {
        document.addEventListener("submit", (event) => {
            const form = event.target;
            if (!form || form.tagName !== "FORM")
                return;
            const formName = form.getAttribute("name") || form.id || "unnamed_form";
            this.trackEvent("form_submit", {
                form_name: formName,
                form_action: form.action,
                form_method: form.method,
            });
        });
    }
    /**
     * Setup performance tracking
     */
    setupPerformanceTracking() {
        if (typeof window.PerformanceObserver === "undefined")
            return;
        // Track Web Vitals
        if ("web-vital" in PerformanceObserver.supportedEntryTypes) {
            // This would integrate with web-vitals library
            // For now, just track basic metrics
        }
        // Track navigation timing
        window.addEventListener("load", () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType("navigation")[0];
                if (perfData) {
                    this.trackEvent("performance", {
                        dns_time: perfData.domainLookupEnd - perfData.domainLookupStart,
                        tcp_time: perfData.connectEnd - perfData.connectStart,
                        request_time: perfData.responseEnd - perfData.requestStart,
                        response_time: perfData.responseEnd - perfData.responseStart,
                        dom_processing_time: perfData.domComplete - perfData.domLoading,
                        load_time: perfData.loadEventEnd - perfData.loadEventStart,
                    });
                }
            }, 0);
        });
    }
    /**
     * Process queued events
     */
    processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (event && this.provider) {
                this.provider.trackEvent(event);
            }
        }
    }
    /**
     * Create analytics context
     */
    createContext() {
        return {
            sessionId: this.generateSessionId(),
            pageLoadTime: Date.now(),
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
        };
    }
    /**
     * Get context properties to add to events
     */
    getContextProperties() {
        if (!this.context)
            return {};
        return {
            session_id: this.context.sessionId,
            referrer: this.context.referrer,
            language: this.context.language,
        };
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Check if in development mode
     */
    isDevelopment() {
        return (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.hostname.endsWith(".local"));
    }
    /**
     * Check if DNT is enabled
     */
    isDNTEnabled() {
        return (navigator.doNotTrack === "1" ||
            window.doNotTrack === "1" ||
            navigator.msDoNotTrack === "1");
    }
}
// Create singleton instance
export const analytics = new AnalyticsClient();
// Export convenience functions
export const trackEvent = (name, properties) => analytics.trackEvent(name, properties);
export const trackPageView = (url, title) => analytics.trackPageView(url, title);
export const identifyUser = (userId, traits) => analytics.identifyUser(userId, traits);
export const setUserProperties = (properties) => analytics.setUserProperties(properties);
export const trackTransaction = (transaction) => analytics.trackTransaction(transaction);
//# sourceMappingURL=client.js.map