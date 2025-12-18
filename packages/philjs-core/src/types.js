/**
 * Core type definitions for PhilJS.
 * Provides strict, type-safe primitives for signals, effects, JSX, and components.
 */
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if a value is a JSX element
 */
export function isJSXElement(value) {
    return (value !== null &&
        typeof value === 'object' &&
        'type' in value &&
        'props' in value);
}
/**
 * Check if a value is a signal
 */
export function isSignal(value) {
    return (typeof value === 'function' &&
        'set' in value &&
        'peek' in value &&
        'subscribe' in value);
}
/**
 * Check if a value is a memo
 */
export function isMemo(value) {
    return (typeof value === 'function' &&
        !('set' in value));
}
/**
 * Check if a value is an accessor (function)
 */
export function isAccessor(value) {
    return typeof value === 'function';
}
/**
 * Resolve a maybe accessor to its value
 */
export function resolveAccessor(value) {
    return typeof value === 'function' ? value() : value;
}
//# sourceMappingURL=types.js.map