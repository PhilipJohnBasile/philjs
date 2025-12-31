/**
 * PhilJS Native - Tauri Type Definitions
 *
 * Complete type definitions for Tauri APIs to enable proper TypeScript
 * checking without @ts-nocheck directives.
 */
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if value is TauriInternals
 */
export function isTauriInternals(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'invoke' in value &&
        typeof value.invoke === 'function');
}
/**
 * Check if value is TauriWebviewWindow
 */
export function isTauriWebviewWindow(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'label' in value &&
        'close' in value &&
        typeof value.close === 'function');
}
export {};
//# sourceMappingURL=types.js.map