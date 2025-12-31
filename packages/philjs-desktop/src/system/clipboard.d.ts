/**
 * Clipboard APIs
 *
 * Uses @tauri-apps/plugin-clipboard-manager for Tauri v2
 * with browser fallbacks when running outside Tauri context.
 */
/**
 * Error thrown when clipboard operations fail
 */
export declare class ClipboardError extends Error {
    readonly cause?: unknown | undefined;
    readonly name: string;
    constructor(message: string, cause?: unknown | undefined);
}
/**
 * Clipboard API
 */
export declare const Clipboard: {
    /**
     * Read text from clipboard
     */
    readText(): Promise<string>;
    /**
     * Write text to clipboard
     */
    writeText(text: string): Promise<void>;
    /**
     * Read HTML from clipboard
     */
    readHtml(): Promise<string>;
    /**
     * Write HTML to clipboard
     */
    writeHtml(html: string): Promise<void>;
    /**
     * Read image from clipboard (as base64)
     */
    readImage(): Promise<string | null>;
    /**
     * Write image to clipboard
     */
    writeImage(imageData: Uint8Array | string): Promise<void>;
    /**
     * Clear clipboard
     */
    clear(): Promise<void>;
    /**
     * Check if clipboard has text
     */
    hasText(): Promise<boolean>;
    /**
     * Check if clipboard has image
     */
    hasImage(): Promise<boolean>;
};
export declare const readClipboard: () => Promise<string>;
export declare const writeClipboard: (text: string) => Promise<void>;
export declare const readClipboardImage: () => Promise<string | null>;
export declare const writeClipboardImage: (imageData: Uint8Array | string) => Promise<void>;
export declare const clearClipboard: () => Promise<void>;
//# sourceMappingURL=clipboard.d.ts.map