/**
 * PhilJS LiveView - Navigation
 *
 * Handles client-side navigation without full page reloads.
 * Supports live_patch (partial updates) and live_redirect (full navigation).
 */
let navigationState = {
    currentPath: typeof window !== 'undefined' ? window.location.pathname : '/',
    currentParams: typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams(),
    history: [],
    listeners: new Set(),
};
// ============================================================================
// Navigation Functions
// ============================================================================
/**
 * Navigate with a live patch (preserves socket connection, updates URL)
 */
export function livePatch(to, options) {
    const event = {
        type: 'patch',
        to,
        replace: options?.replace ?? false,
    };
    // Update browser history
    if (typeof window !== 'undefined') {
        if (options?.replace) {
            window.history.replaceState({}, '', to);
        }
        else {
            window.history.pushState({}, '', to);
        }
    }
    // Update state
    const url = new URL(to, window.location.origin);
    navigationState.currentPath = url.pathname;
    navigationState.currentParams = url.searchParams;
    navigationState.history.push(to);
    // Notify listeners
    notifyListeners(event);
}
/**
 * Navigate with a live redirect (closes socket, opens new one)
 */
export function liveRedirect(to, options) {
    const event = {
        type: 'redirect',
        to,
        replace: options?.replace ?? false,
    };
    // For redirects, we let the browser handle it
    notifyListeners(event);
    if (typeof window !== 'undefined') {
        if (options?.replace) {
            window.location.replace(to);
        }
        else {
            window.location.href = to;
        }
    }
}
/**
 * Handle link clicks for live navigation
 */
export function handleLinkClick(event) {
    const target = event.target;
    const link = target.closest('a[href]');
    if (!link)
        return;
    // Skip if modifier keys pressed
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
    // Skip if not left click
    if (event.button !== 0)
        return;
    // Skip external links
    const href = link.getAttribute('href') || '';
    if (href.startsWith('http') && !href.startsWith(window.location.origin))
        return;
    // Skip download links
    if (link.hasAttribute('download'))
        return;
    // Skip target="_blank"
    if (link.target === '_blank')
        return;
    // Check for phx-link attribute
    const phxLink = link.getAttribute('phx-link');
    if (phxLink === 'patch') {
        event.preventDefault();
        livePatch(href, { replace: link.hasAttribute('phx-link-replace') });
    }
    else if (phxLink === 'redirect') {
        event.preventDefault();
        liveRedirect(href, { replace: link.hasAttribute('phx-link-replace') });
    }
    // If no phx-link, check data-phx-link for backwards compat
    else if (link.hasAttribute('data-phx-link')) {
        const dataLink = link.getAttribute('data-phx-link');
        event.preventDefault();
        if (dataLink === 'patch') {
            livePatch(href);
        }
        else {
            liveRedirect(href);
        }
    }
}
/**
 * Handle browser back/forward
 */
export function handlePopState(event) {
    const navEvent = {
        type: 'popstate',
        to: window.location.pathname + window.location.search,
    };
    navigationState.currentPath = window.location.pathname;
    navigationState.currentParams = new URLSearchParams(window.location.search);
    notifyListeners(navEvent);
}
// ============================================================================
// Navigation Listeners
// ============================================================================
/**
 * Add navigation listener
 */
export function onNavigate(callback) {
    navigationState.listeners.add(callback);
    return () => {
        navigationState.listeners.delete(callback);
    };
}
function notifyListeners(event) {
    for (const listener of navigationState.listeners) {
        listener(event);
    }
}
// ============================================================================
// Navigation Initialization
// ============================================================================
/**
 * Initialize navigation handling
 */
export function initNavigation() {
    if (typeof window === 'undefined')
        return () => { };
    // Handle link clicks
    document.addEventListener('click', handleLinkClick);
    // Handle browser navigation
    window.addEventListener('popstate', handlePopState);
    // Cleanup function
    return () => {
        document.removeEventListener('click', handleLinkClick);
        window.removeEventListener('popstate', handlePopState);
    };
}
// ============================================================================
// URL Helpers
// ============================================================================
/**
 * Get current navigation state
 */
export function getNavigation() {
    return {
        path: navigationState.currentPath,
        params: navigationState.currentParams,
        mode: 'push',
    };
}
/**
 * Parse URL path and extract params
 */
export function parseUrl(url) {
    const parsed = new URL(url, 'http://localhost');
    return {
        path: parsed.pathname,
        params: parsed.searchParams,
        hash: parsed.hash,
    };
}
/**
 * Build URL from path and params
 */
export function buildUrl(path, params) {
    const url = new URL(path, 'http://localhost');
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined)
                continue;
            if (Array.isArray(value)) {
                value.forEach(v => url.searchParams.append(key, v));
            }
            else {
                url.searchParams.set(key, value);
            }
        }
    }
    return url.pathname + url.search;
}
/**
 * Update URL params while preserving others
 */
export function updateParams(params) {
    const current = new URLSearchParams(navigationState.currentParams);
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined) {
            current.delete(key);
        }
        else {
            current.set(key, value);
        }
    }
    const search = current.toString();
    return navigationState.currentPath + (search ? '?' + search : '');
}
const scrollPositions = new Map();
/**
 * Save current scroll position
 */
export function saveScrollPosition(key = navigationState.currentPath) {
    if (typeof window === 'undefined')
        return;
    scrollPositions.set(key, {
        x: window.scrollX,
        y: window.scrollY,
    });
}
/**
 * Restore scroll position
 */
export function restoreScrollPosition(key = navigationState.currentPath) {
    if (typeof window === 'undefined')
        return;
    const position = scrollPositions.get(key);
    if (position) {
        window.scrollTo(position.x, position.y);
    }
}
/**
 * Scroll to element by ID or to top
 */
export function scrollToTarget(hash) {
    if (typeof window === 'undefined')
        return;
    if (hash) {
        const id = hash.startsWith('#') ? hash.slice(1) : hash;
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// ============================================================================
// Page Title
// ============================================================================
/**
 * Update page title
 */
export function setPageTitle(title, prefix, suffix) {
    if (typeof document === 'undefined')
        return;
    const parts = [prefix, title, suffix].filter(Boolean);
    document.title = parts.join(' | ');
}
const loadingState = {
    isLoading: false,
    target: undefined,
    listeners: new Set(),
};
/**
 * Set loading state
 */
export function setLoading(loading, target) {
    loadingState.isLoading = loading;
    loadingState.target = target;
    for (const listener of loadingState.listeners) {
        listener(loading);
    }
    // Add/remove loading class to body
    if (typeof document !== 'undefined') {
        if (loading) {
            document.body.classList.add('phx-loading');
        }
        else {
            document.body.classList.remove('phx-loading');
        }
    }
}
/**
 * Subscribe to loading state changes
 */
export function onLoading(callback) {
    loadingState.listeners.add(callback);
    return () => loadingState.listeners.delete(callback);
}
/**
 * Check if currently loading
 */
export function isLoading() {
    return loadingState.isLoading;
}
//# sourceMappingURL=navigation.js.map