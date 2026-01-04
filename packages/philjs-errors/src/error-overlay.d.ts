/**
 * Development Error Overlay
 *
 * Beautiful, helpful error overlay for development mode.
 * Shows errors with syntax highlighting, suggestions, and docs links.
 */
import type { PhilJSError } from './error-codes.js';
/**
 * Show error overlay
 */
export declare function showErrorOverlay(error: PhilJSError): void;
/**
 * Hide error overlay
 */
export declare function hideErrorOverlay(): void;
/**
 * Initialize error overlay system
 */
export declare function initErrorOverlay(): void;
/**
 * Check if error overlay is currently shown
 */
export declare function isErrorOverlayVisible(): boolean;
/**
 * Get current error shown in overlay
 */
export declare function getCurrentError(): PhilJSError | null;
/**
 * Update error overlay content (useful for live updates)
 */
export declare function updateErrorOverlay(error: PhilJSError): void;
//# sourceMappingURL=error-overlay.d.ts.map