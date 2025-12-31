/**
 * Web App Manifest generation and utilities
 */
import type { WebAppManifest } from './types.js';
/**
 * Generate web app manifest JSON
 */
export declare function generateManifest(config: Partial<WebAppManifest>): WebAppManifest;
/**
 * Create manifest JSON string
 */
export declare function createManifestJSON(config: Partial<WebAppManifest>): string;
/**
 * Inject manifest link into HTML
 */
export declare function injectManifestLink(manifestPath?: string): string;
/**
 * Generate meta tags for PWA
 */
export declare function generatePWAMetaTags(config: Partial<WebAppManifest>): string;
//# sourceMappingURL=manifest.d.ts.map