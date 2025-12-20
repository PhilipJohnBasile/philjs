/**
 * Analytics utility functions
 */

/**
 * Check if code is running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  if (!isBrowser()) return false;

  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".local") ||
    window.location.port !== ""
  );
}

/**
 * Check if user has Do Not Track enabled
 */
export function isDNTEnabled(): boolean {
  if (!isBrowser()) return false;

  return (
    navigator.doNotTrack === "1" ||
    (window as any).doNotTrack === "1" ||
    (navigator as any).msDoNotTrack === "1"
  );
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get user agent information
 */
export function getUserAgent() {
  if (!isBrowser()) return {};

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
  if (!isBrowser()) return {};

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
  if (!isBrowser()) return { width: 0, height: 0 };

  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
}

/**
 * Get screen resolution
 */
export function getScreenResolution() {
  if (!isBrowser()) return { width: 0, height: 0 };

  return {
    width: screen.width,
    height: screen.height,
  };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (this: any, ...args: Parameters<T>) {
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
export function parseQueryParams(url?: string): Record<string, string> {
  if (!isBrowser()) return {};

  const urlObj = new URL(url || window.location.href);
  const params: Record<string, string> = {};

  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Get UTM parameters from URL
 */
export function getUTMParams(): Record<string, string> {
  const params = parseQueryParams();
  const utmParams: Record<string, string> = {};

  Object.keys(params).forEach((key) => {
    if (key.startsWith("utm_")) {
      utmParams[key] = params[key];
    }
  });

  return utmParams;
}

/**
 * Store value in localStorage with error handling
 */
export function setLocalStorage(key: string, value: any): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Failed to set localStorage:", error);
  }
}

/**
 * Get value from localStorage with error handling
 */
export function getLocalStorage<T = any>(key: string): T | null {
  if (!isBrowser()) return null;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn("Failed to get localStorage:", error);
    return null;
  }
}

/**
 * Remove value from localStorage
 */
export function removeLocalStorage(key: string): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to remove localStorage:", error);
  }
}

/**
 * Check if cookies are enabled
 */
export function areCookiesEnabled(): boolean {
  if (!isBrowser()) return false;

  try {
    document.cookie = "test=1";
    const enabled = document.cookie.indexOf("test=") !== -1;
    document.cookie = "test=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
    return enabled;
  } catch (error) {
    return false;
  }
}

/**
 * Get cookie value
 */
export function getCookie(name: string): string | null {
  if (!isBrowser()) return null;

  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

/**
 * Set cookie value
 */
export function setCookie(
  name: string,
  value: string,
  days?: number,
  domain?: string
): void {
  if (!isBrowser()) return;

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
export function deleteCookie(name: string, domain?: string): void {
  if (!isBrowser()) return;

  const domainStr = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=; Max-Age=-99999999${domainStr}; path=/`;
}
