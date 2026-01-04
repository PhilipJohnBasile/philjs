/**
 * Analytics utility functions
 */
/**
 * Check if code is running in browser
 */
export function isBrowser() {
    return typeof window !== "undefined" && typeof document !== "undefined";
}
/**
 * Check if running in development mode
 */
export function isDevelopment() {
    if (!isBrowser())
        return false;
    return (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local") ||
        window.location.port !== "");
}
/**
 * Check if user has Do Not Track enabled
 */
export function isDNTEnabled() {
    if (!isBrowser())
        return false;
    return (navigator.doNotTrack === "1" ||
        window.doNotTrack === "1" ||
        navigator.msDoNotTrack === "1");
}
/**
 * Generate unique session ID
 */
export function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Get user agent information
 */
export function getUserAgent() {
    if (!isBrowser())
        return {};
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor,
    };
}
/**
 * Get page metadata
 */
export function getPageMetadata() {
    if (!isBrowser())
        return {};
    return {
        url: window.location.href,
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        title: document.title,
        referrer: document.referrer,
    };
}
/**
 * Get viewport size
 */
export function getViewportSize() {
    if (!isBrowser())
        return { width: 0, height: 0 };
    return {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight,
    };
}
/**
 * Get screen resolution
 */
export function getScreenResolution() {
    if (!isBrowser())
        return { width: 0, height: 0 };
    return {
        width: screen.width,
        height: screen.height,
    };
}
/**
 * Debounce function
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}
/**
 * Throttle function
 */
export function throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
/**
 * Parse URL query parameters
 */
export function parseQueryParams(url) {
    if (!isBrowser())
        return {};
    const urlObj = new URL(url || window.location.href);
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
/**
 * Get UTM parameters from URL
 */
export function getUTMParams() {
    const params = parseQueryParams();
    const utmParams = {};
    Object.keys(params).forEach((key) => {
        if (key.startsWith("utm_")) {
            const value = params[key];
            if (value !== undefined) {
                utmParams[key] = value;
            }
        }
    });
    return utmParams;
}
/**
 * Store value in localStorage with error handling
 */
export function setLocalStorage(key, value) {
    if (!isBrowser())
        return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch (error) {
        console.warn("Failed to set localStorage:", error);
    }
}
/**
 * Get value from localStorage with error handling
 */
export function getLocalStorage(key) {
    if (!isBrowser())
        return null;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }
    catch (error) {
        console.warn("Failed to get localStorage:", error);
        return null;
    }
}
/**
 * Remove value from localStorage
 */
export function removeLocalStorage(key) {
    if (!isBrowser())
        return;
    try {
        localStorage.removeItem(key);
    }
    catch (error) {
        console.warn("Failed to remove localStorage:", error);
    }
}
/**
 * Check if cookies are enabled
 */
export function areCookiesEnabled() {
    if (!isBrowser())
        return false;
    try {
        document.cookie = "test=1";
        const enabled = document.cookie.indexOf("test=") !== -1;
        document.cookie = "test=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
        return enabled;
    }
    catch (error) {
        return false;
    }
}
/**
 * Get cookie value
 */
export function getCookie(name) {
    if (!isBrowser())
        return null;
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match?.[2] ?? null;
}
/**
 * Set cookie value
 */
export function setCookie(name, value, days, domain) {
    if (!isBrowser())
        return;
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    const domainStr = domain ? `; domain=${domain}` : "";
    document.cookie = `${name}=${value || ""}${expires}${domainStr}; path=/`;
}
/**
 * Delete cookie
 */
export function deleteCookie(name, domain) {
    if (!isBrowser())
        return;
    const domainStr = domain ? `; domain=${domain}` : "";
    document.cookie = `${name}=; Max-Age=-99999999${domainStr}; path=/`;
}
//# sourceMappingURL=utils.js.map