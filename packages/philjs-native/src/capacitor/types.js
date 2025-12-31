/**
 * PhilJS Native - Capacitor Type Definitions
 *
 * Complete type definitions for Capacitor APIs to enable proper TypeScript
 * checking without @ts-nocheck directives.
 */
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if value is CapacitorGlobal
 */
export function isCapacitorGlobal(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'getPlatform' in value &&
        typeof value.getPlatform === 'function');
}
/**
 * Check if Capacitor is available in window
 */
export function hasCapacitor() {
    return typeof window !== 'undefined' && isCapacitorGlobal(window.Capacitor);
}
export {};
//# sourceMappingURL=types.js.map