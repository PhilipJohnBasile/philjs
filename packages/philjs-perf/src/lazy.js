/**
 * Lazy evaluation utilities
 */
const NOT_COMPUTED = Symbol('NOT_COMPUTED');
/**
 * Lazy value container
 */
export class LazyValue {
    value = NOT_COMPUTED;
    factory;
    shouldCache;
    constructor(factory, options = {}) {
        this.factory = factory;
        this.shouldCache = options.cache !== false;
    }
    /**
     * Get the value (computing if necessary)
     */
    get() {
        if (this.value === NOT_COMPUTED) {
            const result = this.factory();
            if (this.shouldCache) {
                this.value = result;
            }
            return result;
        }
        return this.value;
    }
    /**
     * Check if value has been computed
     */
    isComputed() {
        return this.value !== NOT_COMPUTED;
    }
    /**
     * Reset to uncomputed state
     */
    reset() {
        this.value = NOT_COMPUTED;
    }
    /**
     * Map over the lazy value
     */
    map(fn) {
        return new LazyValue(() => fn(this.get()), { cache: this.shouldCache });
    }
    /**
     * FlatMap over the lazy value
     */
    flatMap(fn) {
        return new LazyValue(() => fn(this.get()).get(), { cache: this.shouldCache });
    }
}
/**
 * Create a lazy value
 */
export function lazy(factory, options) {
    return new LazyValue(factory, options);
}
/**
 * Create a lazy async value
 */
export function lazyAsync(factory, options) {
    let promise = null;
    let result = NOT_COMPUTED;
    const shouldCache = options?.cache !== false;
    return async () => {
        if (result !== NOT_COMPUTED) {
            return result;
        }
        if (promise !== null) {
            return promise;
        }
        promise = factory();
        try {
            const value = await promise;
            if (shouldCache) {
                result = value;
            }
            return value;
        }
        finally {
            if (!shouldCache) {
                promise = null;
            }
        }
    };
}
/**
 * Lazy property decorator pattern
 */
export function lazyProp(target, key, factory) {
    let value = NOT_COMPUTED;
    Object.defineProperty(target, key, {
        get() {
            if (value === NOT_COMPUTED) {
                value = factory();
            }
            return value;
        },
        configurable: true,
        enumerable: true,
    });
}
/**
 * Lazy initialization for expensive operations
 */
export function lazyInit(factory) {
    let computed = false;
    let value;
    return {
        get value() {
            if (!computed) {
                value = factory();
                computed = true;
            }
            return value;
        },
        reset() {
            computed = false;
            value = undefined;
        },
    };
}
//# sourceMappingURL=lazy.js.map