/**
 * Link Extension
 *
 * Smart link handling with auto-detection, previews, and validation
 */
import Link from '@tiptap/extension-link';
export interface LinkOptions {
    /**
     * Open links in new tab
     */
    openOnClick?: boolean;
    /**
     * Auto-detect and linkify URLs
     */
    autolink?: boolean;
    /**
     * Validate URLs before linking
     */
    validate?: (url: string) => boolean;
    /**
     * Allowed protocols
     */
    protocols?: string[];
    /**
     * Add rel="noopener noreferrer" to external links
     */
    noopener?: boolean;
    /**
     * Custom link class
     */
    linkClass?: string;
    /**
     * Enable link previews
     */
    previews?: boolean;
}
/**
 * Validate URL format
 */
export declare function isValidUrl(url: string, protocols?: string[]): boolean;
/**
 * Normalize URL (add protocol if missing)
 */
export declare function normalizeUrl(url: string): string;
/**
 * Check if URL is external
 */
export declare function isExternalUrl(url: string): boolean;
/**
 * Extract domain from URL
 */
export declare function getDomain(url: string): string | null;
/**
 * Create configured link extension
 */
export declare function createLinkExtension(options?: LinkOptions): any;
export interface LinkPreviewData {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
}
/**
 * Create link preview plugin
 */
export declare function createLinkPreviewPlugin(fetchPreview: (url: string) => Promise<LinkPreviewData | null>): any;
/**
 * Link commands
 */
export declare const linkCommands: {
    setLink: (editor: any, url: string) => void;
    unsetLink: (editor: any) => void;
    updateLink: (editor: any, url: string) => void;
    toggleLink: (editor: any, url: string) => void;
};
/**
 * Get link at current selection
 */
export declare function getLinkAtSelection(editor: any): string | null;
/**
 * Keyboard shortcuts for links
 */
export declare const linkShortcuts: {
    setLink: string;
    unsetLink: string;
};
/**
 * Default link styles
 */
export declare const linkStyles = "\n.philjs-link {\n  color: #2563eb;\n  cursor: pointer;\n  text-decoration: underline;\n  text-decoration-color: #93c5fd;\n  transition: color 0.15s, text-decoration-color 0.15s;\n}\n\n.philjs-link:hover {\n  color: #1d4ed8;\n  text-decoration-color: #2563eb;\n}\n\n.philjs-link-preview {\n  background: white;\n  border: 1px solid #e2e8f0;\n  border-radius: 0.5rem;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\n  max-width: 320px;\n  overflow: hidden;\n  z-index: 50;\n}\n\n.philjs-link-preview-image {\n  height: 160px;\n  object-fit: cover;\n  width: 100%;\n}\n\n.philjs-link-preview-content {\n  padding: 0.75rem;\n}\n\n.philjs-link-preview-favicon {\n  height: 16px;\n  margin-right: 0.5rem;\n  width: 16px;\n}\n\n.philjs-link-preview-title {\n  font-weight: 600;\n  margin-bottom: 0.25rem;\n}\n\n.philjs-link-preview-description {\n  color: #64748b;\n  font-size: 0.875rem;\n  margin-bottom: 0.25rem;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.philjs-link-preview-url {\n  color: #94a3b8;\n  font-size: 0.75rem;\n}\n";
export { Link };
export default createLinkExtension;
//# sourceMappingURL=link.d.ts.map