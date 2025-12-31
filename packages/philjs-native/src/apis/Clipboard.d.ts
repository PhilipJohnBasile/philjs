/**
 * Clipboard API
 *
 * Access to system clipboard for copy/paste.
 */
import { type Signal } from 'philjs-core';
/**
 * Clipboard content types
 */
export type ClipboardContentType = 'text' | 'url' | 'image' | 'html';
/**
 * Clipboard content
 */
export interface ClipboardContent {
    text?: string | undefined;
    html?: string | undefined;
    url?: string | undefined;
    image?: string | undefined;
}
/**
 * Last clipboard content
 */
export declare const clipboardContent: Signal<string>;
/**
 * Clipboard API singleton
 */
export declare const Clipboard: {
    /**
     * Get string from clipboard
     */
    getString(): Promise<string>;
    /**
     * Set string to clipboard
     */
    setString(text: string): Promise<void>;
    /**
     * Get URL from clipboard
     */
    getUrl(): Promise<string | null>;
    /**
     * Set URL to clipboard
     */
    setUrl(url: string): Promise<void>;
    /**
     * Get image from clipboard
     */
    getImage(): Promise<string | null>;
    /**
     * Set image to clipboard
     */
    setImage(imageUri: string): Promise<void>;
    /**
     * Get HTML from clipboard
     */
    getHtml(): Promise<string | null>;
    /**
     * Set HTML to clipboard
     */
    setHtml(html: string): Promise<void>;
    /**
     * Get content with multiple formats
     */
    getContent(): Promise<ClipboardContent>;
    /**
     * Set content with multiple formats
     */
    setContent(content: ClipboardContent): Promise<void>;
    /**
     * Check if clipboard has content
     */
    hasContent(): Promise<boolean>;
    /**
     * Check if clipboard has string
     */
    hasString(): Promise<boolean>;
    /**
     * Check if clipboard has URL
     */
    hasUrl(): Promise<boolean>;
    /**
     * Check if clipboard has image
     */
    hasImage(): Promise<boolean>;
    /**
     * Add clipboard change listener
     */
    addListener(callback: (content: string) => void): () => void;
};
/**
 * Hook to use clipboard
 */
export declare function useClipboard(): {
    content: string;
    copy: (text: string) => Promise<void>;
    paste: () => Promise<string>;
};
export default Clipboard;
//# sourceMappingURL=Clipboard.d.ts.map