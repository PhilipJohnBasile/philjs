/**
 * Timing utilities - debounce, throttle, RAF
 */
/**
 * Debounce a function
 */
export function debounce(fn, wait) {
    let timeoutId = null;
    let lastArgs = null;
    let lastThis = null;
    const debounced = function (...args) {
        lastArgs = args;
        lastThis = this;
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = null;
            fn.apply(lastThis, lastArgs);
            lastArgs = null;
            lastThis = null;
        }, wait);
    };
    debounced.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
        lastThis = null;
    };
    debounced.flush = () => {
        if (timeoutId !== null && lastArgs !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
            fn.apply(lastThis, lastArgs);
            lastArgs = null;
            lastThis = null;
        }
    };
    return debounced;
}
/**
 * Throttle a function
 */
export function throttle(fn, wait, options = {}) {
    const { leading = true, trailing = true } = options;
    let timeoutId = null;
    let lastArgs = null;
    let lastThis = null;
    let lastCallTime = 0;
    const throttled = function (...args) {
        const now = Date.now();
        const remaining = wait - (now - lastCallTime);
        lastArgs = args;
        lastThis = this;
        if (remaining <= 0 || remaining > wait) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            lastCallTime = now;
            fn.apply(lastThis, lastArgs);
            lastArgs = null;
            lastThis = null;
        }
        else if (timeoutId === null && trailing) {
            timeoutId = setTimeout(() => {
                lastCallTime = leading ? Date.now() : 0;
                timeoutId = null;
                if (lastArgs !== null) {
                    fn.apply(lastThis, lastArgs);
                    lastArgs = null;
                    lastThis = null;
                }
            }, remaining);
        }
    };
    throttled.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastCallTime = 0;
        lastArgs = null;
        lastThis = null;
    };
    return throttled;
}
/**
 * Throttle using requestAnimationFrame (ideal for visual updates)
 */
export function rafThrottle(fn) {
    let rafId = null;
    let lastArgs = null;
    let lastThis = null;
    const throttled = function (...args) {
        lastArgs = args;
        lastThis = this;
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                rafId = null;
                fn.apply(lastThis, lastArgs);
                lastArgs = null;
                lastThis = null;
            });
        }
    };
    throttled.cancel = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        lastArgs = null;
        lastThis = null;
    };
    return throttled;
}
/**
 * Schedule work during idle time
 */
export function scheduleIdle(fn, options) {
    const { promise, resolve, reject } = Promise.withResolvers();
    if ('requestIdleCallback' in globalThis) {
        requestIdleCallback(() => {
            try {
                resolve(fn());
            }
            catch (error) {
                reject(error);
            }
        }, options);
    }
    else {
        // Fallback to setTimeout
        setTimeout(() => {
            try {
                resolve(fn());
            }
            catch (error) {
                reject(error);
            }
        }, 1);
    }
    return promise;
}
//# sourceMappingURL=timing.js.map