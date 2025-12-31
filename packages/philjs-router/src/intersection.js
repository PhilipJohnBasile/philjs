/**
 * Intersection Observer Utilities for Visibility-Based Prefetching
 *
 * Provides:
 * - Shared IntersectionObserver instance for efficiency
 * - Visibility detection for prefetch triggering
 * - Viewport proximity detection
 * - Lazy loading support
 */
// Global registry of observed elements
const observedElements = new Map();
// Shared observers by configuration key
const sharedObservers = new Map();
// Callbacks by element
const elementCallbacks = new Map();
/**
 * Generate a key for observer configuration
 */
function getObserverKey(options) {
    return `${options.root || 'viewport'}-${options.rootMargin || '0px'}-${Array.isArray(options.threshold) ? options.threshold.join(',') : options.threshold || 0}`;
}
/**
 * Shared intersection callback
 */
function handleIntersection(entries) {
    for (const entry of entries) {
        const callback = elementCallbacks.get(entry.target);
        if (callback) {
            callback(entry);
        }
        // Handle 'once' option
        const observed = observedElements.get(entry.target);
        if (observed && observed.options.once && entry.isIntersecting) {
            observed.hasIntersected = true;
            unobserveElement(entry.target);
        }
    }
}
/**
 * Get or create a shared IntersectionObserver
 */
function getOrCreateObserver(options) {
    const key = getObserverKey(options);
    let observer = sharedObservers.get(key);
    if (!observer) {
        const observerInit = {};
        if (options.root !== undefined) {
            observerInit.root = options.root;
        }
        if (options.rootMargin !== undefined) {
            observerInit.rootMargin = options.rootMargin;
        }
        if (options.threshold !== undefined) {
            observerInit.threshold = options.threshold;
        }
        observer = new IntersectionObserver(handleIntersection, observerInit);
        sharedObservers.set(key, observer);
    }
    return observer;
}
/**
 * Create an IntersectionObserver with the given options
 *
 * @example
 * ```ts
 * const observer = createIntersectionObserver({
 *   rootMargin: '50px',
 *   onIntersect: (entry) => {
 *     if (entry.isIntersecting) {
 *       prefetchRoute(entry.target.getAttribute('href'));
 *     }
 *   },
 * });
 *
 * observeElement(linkElement, observer);
 * ```
 */
export function createIntersectionObserver(options = {}) {
    return getOrCreateObserver(options);
}
/**
 * Observe an element for intersection
 */
export function observeElement(element, observerOrOptions) {
    if (typeof IntersectionObserver === 'undefined') {
        // Fallback: immediately trigger if no IntersectionObserver support
        if (typeof observerOrOptions === 'object' && 'onIntersect' in observerOrOptions) {
            const options = observerOrOptions;
            if (options.onIntersect) {
                options.onIntersect({
                    isIntersecting: true,
                    target: element,
                    boundingClientRect: element.getBoundingClientRect(),
                    intersectionRatio: 1,
                    intersectionRect: element.getBoundingClientRect(),
                    rootBounds: null,
                    time: performance.now(),
                });
            }
        }
        return;
    }
    // Already observed
    if (observedElements.has(element)) {
        return;
    }
    let observer;
    let options;
    if (observerOrOptions instanceof IntersectionObserver) {
        observer = observerOrOptions;
        options = {};
    }
    else {
        options = observerOrOptions;
        observer = getOrCreateObserver(options);
    }
    // Register callback if provided
    if (options.onIntersect) {
        elementCallbacks.set(element, options.onIntersect);
    }
    // Track observed element
    observedElements.set(element, {
        element,
        observer,
        options,
        hasIntersected: false,
    });
    // Start observing
    observer.observe(element);
}
/**
 * Stop observing an element
 */
export function unobserveElement(element) {
    const observed = observedElements.get(element);
    if (!observed)
        return;
    observed.observer.unobserve(element);
    observedElements.delete(element);
    elementCallbacks.delete(element);
}
/**
 * Check if an element is currently being observed
 */
export function isObserving(element) {
    return observedElements.has(element);
}
/**
 * Check if an element has intersected (for 'once' observers)
 */
export function hasIntersected(element) {
    return observedElements.get(element)?.hasIntersected ?? false;
}
/**
 * Disconnect all observers and clear state
 */
export function disconnectAll() {
    for (const observer of sharedObservers.values()) {
        observer.disconnect();
    }
    sharedObservers.clear();
    observedElements.clear();
    elementCallbacks.clear();
}
/**
 * Get current visibility state of an element
 */
export function getVisibilityState(element) {
    if (typeof window === 'undefined') {
        return {
            isVisible: false,
            isPartiallyVisible: false,
            intersectionRatio: 0,
            boundingRect: null,
        };
    }
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    // Calculate how much of the element is visible
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
    const visibleArea = Math.max(0, visibleHeight) * Math.max(0, visibleWidth);
    const elementArea = rect.width * rect.height;
    const intersectionRatio = elementArea > 0 ? visibleArea / elementArea : 0;
    return {
        isVisible: intersectionRatio >= 1,
        isPartiallyVisible: intersectionRatio > 0,
        intersectionRatio,
        boundingRect: rect,
    };
}
/**
 * Check if an element is approaching the viewport
 *
 * @param element - Element to check
 * @param threshold - Distance in pixels to consider "approaching"
 */
export function isApproachingViewport(element, threshold = 100) {
    if (typeof window === 'undefined')
        return false;
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    // Check if element is within threshold of viewport edges
    const isNearVertically = rect.bottom >= -threshold && rect.top <= viewportHeight + threshold;
    const isNearHorizontally = rect.right >= -threshold && rect.left <= viewportWidth + threshold;
    return isNearVertically && isNearHorizontally;
}
const prefetchZones = new Map();
/**
 * Create a prefetch zone around the viewport
 *
 * Elements entering this zone will trigger prefetching before they become visible.
 *
 * @example
 * ```ts
 * const cleanup = createPrefetchZone(linkElement, {
 *   distance: 200, // Start prefetch 200px before visible
 *   onEnterZone: (el) => {
 *     prefetchRoute(el.getAttribute('href'));
 *   },
 * });
 *
 * // Later: cleanup();
 * ```
 */
export function createPrefetchZone(element, zone) {
    // Clean up existing zone for this element
    const existing = prefetchZones.get(element);
    if (existing) {
        existing.cleanup();
    }
    const observer = createIntersectionObserver({
        rootMargin: `${zone.distance}px`,
        threshold: 0,
        onIntersect: (entry) => {
            const zoneState = prefetchZones.get(entry.target);
            if (!zoneState)
                return;
            if (entry.isIntersecting && !zoneState.inZone) {
                zoneState.inZone = true;
                zone.onEnterZone(entry.target);
            }
            else if (!entry.isIntersecting && zoneState.inZone) {
                zoneState.inZone = false;
                zone.onLeaveZone?.(entry.target);
            }
        },
    });
    observeElement(element, observer);
    const cleanup = () => {
        unobserveElement(element);
        prefetchZones.delete(element);
    };
    prefetchZones.set(element, {
        zone,
        inZone: false,
        cleanup,
    });
    return cleanup;
}
let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
let lastScrollX = typeof window !== 'undefined' ? window.scrollX : 0;
let scrollDirection = 'none';
let scrollListenerAttached = false;
const scrollDirectionListeners = new Set();
function updateScrollDirection() {
    const currentY = window.scrollY;
    const currentX = window.scrollX;
    const deltaY = currentY - lastScrollY;
    const deltaX = currentX - lastScrollX;
    // Determine dominant scroll direction
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
        scrollDirection = deltaY > 0 ? 'down' : deltaY < 0 ? 'up' : 'none';
    }
    else {
        scrollDirection = deltaX > 0 ? 'right' : deltaX < 0 ? 'left' : 'none';
    }
    lastScrollY = currentY;
    lastScrollX = currentX;
    // Notify listeners
    for (const listener of scrollDirectionListeners) {
        listener(scrollDirection);
    }
}
/**
 * Get current scroll direction
 */
export function getScrollDirection() {
    return scrollDirection;
}
/**
 * Subscribe to scroll direction changes
 */
export function onScrollDirectionChange(listener) {
    scrollDirectionListeners.add(listener);
    // Attach scroll listener if needed
    if (!scrollListenerAttached && typeof window !== 'undefined') {
        window.addEventListener('scroll', updateScrollDirection, { passive: true });
        scrollListenerAttached = true;
    }
    return () => {
        scrollDirectionListeners.delete(listener);
        // Remove scroll listener if no more listeners
        if (scrollDirectionListeners.size === 0 && scrollListenerAttached) {
            window.removeEventListener('scroll', updateScrollDirection);
            scrollListenerAttached = false;
        }
    };
}
// ============================================================================
// Predictive Prefetching Based on Scroll
// ============================================================================
/**
 * Get elements that are likely to be scrolled into view
 *
 * @param links - Array of link elements to check
 * @param count - Maximum number of links to return
 */
export function getLinksInScrollPath(links, count = 3) {
    if (typeof window === 'undefined')
        return [];
    const direction = getScrollDirection();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    // ES2023+: toSorted() for non-mutating sort
    // Sort links by their position relative to scroll direction
    const sortedLinks = links.toSorted((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        switch (direction) {
            case 'down':
                // Links below viewport, sorted by proximity
                if (rectA.top >= viewportHeight && rectB.top >= viewportHeight) {
                    return rectA.top - rectB.top;
                }
                return rectA.top >= viewportHeight ? -1 : 1;
            case 'up':
                // Links above viewport, sorted by proximity
                if (rectA.bottom <= 0 && rectB.bottom <= 0) {
                    return rectB.bottom - rectA.bottom;
                }
                return rectA.bottom <= 0 ? -1 : 1;
            case 'right':
                // Links to the right of viewport
                if (rectA.left >= viewportWidth && rectB.left >= viewportWidth) {
                    return rectA.left - rectB.left;
                }
                return rectA.left >= viewportWidth ? -1 : 1;
            case 'left':
                // Links to the left of viewport
                if (rectA.right <= 0 && rectB.right <= 0) {
                    return rectB.right - rectA.right;
                }
                return rectA.right <= 0 ? -1 : 1;
            default:
                return 0;
        }
    });
    // Filter to only include links in the scroll direction
    const inPath = sortedLinks.filter((link) => {
        const rect = link.getBoundingClientRect();
        switch (direction) {
            case 'down':
                return rect.top >= 0;
            case 'up':
                return rect.bottom <= viewportHeight;
            case 'right':
                return rect.left >= 0;
            case 'left':
                return rect.right <= viewportWidth;
            default:
                return isApproachingViewport(link, 200);
        }
    });
    return inPath.slice(0, count);
}
//# sourceMappingURL=intersection.js.map