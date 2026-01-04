/**
 * Link Extension
 *
 * Smart link handling with auto-detection, previews, and validation
 */
import Link from '@tiptap/extension-link';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
/**
 * URL validation patterns
 */
const urlPatterns = {
    http: /^https?:\/\//i,
    mailto: /^mailto:/i,
    tel: /^tel:/i,
    internal: /^\/(?!\/)/,
};
/**
 * Validate URL format
 */
export function isValidUrl(url, protocols = ['http', 'https', 'mailto', 'tel']) {
    if (!url)
        return false;
    // Check for allowed protocols
    const hasValidProtocol = protocols.some((protocol) => {
        if (protocol === 'http' || protocol === 'https') {
            return urlPatterns.http.test(url);
        }
        return url.toLowerCase().startsWith(`${protocol}:`);
    });
    if (hasValidProtocol) {
        return URL.parse(url) !== null;
    }
    // Allow relative URLs
    if (urlPatterns.internal.test(url)) {
        return true;
    }
    // Try adding https:// and validating
    return URL.parse(`https://${url}`) !== null;
}
/**
 * Normalize URL (add protocol if missing)
 */
export function normalizeUrl(url) {
    if (!url)
        return url;
    // Already has protocol
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
        return url;
    }
    // Internal link
    if (url.startsWith('/')) {
        return url;
    }
    // Add https://
    return `https://${url}`;
}
/**
 * Check if URL is external
 */
export function isExternalUrl(url) {
    if (!url)
        return false;
    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.origin !== window.location.origin;
    }
    catch {
        return false;
    }
}
/**
 * Extract domain from URL
 */
export function getDomain(url) {
    try {
        const parsed = new URL(normalizeUrl(url));
        return parsed.hostname;
    }
    catch {
        return null;
    }
}
/**
 * Create configured link extension
 */
export function createLinkExtension(options = {}) {
    const { openOnClick = true, autolink = true, validate = isValidUrl, protocols = ['http', 'https', 'mailto', 'tel'], noopener = true, linkClass = 'philjs-link', } = options;
    return Link.configure({
        openOnClick,
        autolink,
        validate: (url) => validate(url, protocols),
        protocols,
        HTMLAttributes: {
            class: linkClass,
            rel: noopener ? 'noopener noreferrer' : undefined,
        },
    });
}
/**
 * Link preview plugin key
 */
const linkPreviewPluginKey = new PluginKey('linkPreview');
/**
 * Create link preview plugin
 */
export function createLinkPreviewPlugin(fetchPreview) {
    const previewCache = new Map();
    return new Plugin({
        key: linkPreviewPluginKey,
        props: {
            handleDOMEvents: {
                mouseover: (view, event) => {
                    const target = event.target;
                    const link = target.closest('a[href]');
                    if (!link)
                        return false;
                    const url = link.href;
                    // Check cache
                    if (previewCache.has(url)) {
                        showPreview(link, previewCache.get(url));
                        return false;
                    }
                    // Fetch preview asynchronously (fire-and-forget)
                    void (async () => {
                        try {
                            const preview = await fetchPreview(url);
                            if (preview) {
                                previewCache.set(url, preview);
                                showPreview(link, preview);
                            }
                        }
                        catch (error) {
                            console.error('Failed to fetch link preview:', error);
                        }
                    })();
                    return false;
                },
            },
        },
    });
}
/**
 * Show link preview tooltip
 */
function showPreview(element, preview) {
    // Remove existing preview
    const existing = document.querySelector('.philjs-link-preview');
    if (existing) {
        existing.remove();
    }
    // Create preview element
    const previewEl = document.createElement('div');
    previewEl.className = 'philjs-link-preview';
    previewEl.innerHTML = `
    ${preview.image ? `<img src="${preview.image}" alt="" class="philjs-link-preview-image" />` : ''}
    <div class="philjs-link-preview-content">
      ${preview.favicon ? `<img src="${preview.favicon}" alt="" class="philjs-link-preview-favicon" />` : ''}
      <div class="philjs-link-preview-title">${preview.title || preview.url}</div>
      ${preview.description ? `<div class="philjs-link-preview-description">${preview.description}</div>` : ''}
      <div class="philjs-link-preview-url">${getDomain(preview.url)}</div>
    </div>
  `;
    // Position preview
    const rect = element.getBoundingClientRect();
    previewEl.style.position = 'fixed';
    previewEl.style.left = `${rect.left}px`;
    previewEl.style.top = `${rect.bottom + 8}px`;
    document.body.appendChild(previewEl);
    // Remove on mouseout
    const removePreview = () => {
        previewEl.remove();
        element.removeEventListener('mouseout', removePreview);
    };
    element.addEventListener('mouseout', removePreview);
}
/**
 * Link commands
 */
export const linkCommands = {
    setLink: (editor, url) => {
        const normalizedUrl = normalizeUrl(url);
        editor.chain().focus().extendMarkRange('link').setLink({ href: normalizedUrl }).run();
    },
    unsetLink: (editor) => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
    },
    updateLink: (editor, url) => {
        const normalizedUrl = normalizeUrl(url);
        editor.chain().focus().extendMarkRange('link').updateAttributes('link', { href: normalizedUrl }).run();
    },
    toggleLink: (editor, url) => {
        if (editor.isActive('link')) {
            linkCommands.unsetLink(editor);
        }
        else {
            linkCommands.setLink(editor, url);
        }
    },
};
/**
 * Get link at current selection
 */
export function getLinkAtSelection(editor) {
    const { href } = editor.getAttributes('link');
    return href || null;
}
/**
 * Keyboard shortcuts for links
 */
export const linkShortcuts = {
    setLink: 'Mod-k',
    unsetLink: 'Mod-Shift-k',
};
/**
 * Default link styles
 */
export const linkStyles = `
.philjs-link {
  color: #2563eb;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: #93c5fd;
  transition: color 0.15s, text-decoration-color 0.15s;
}

.philjs-link:hover {
  color: #1d4ed8;
  text-decoration-color: #2563eb;
}

.philjs-link-preview {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-width: 320px;
  overflow: hidden;
  z-index: 50;
}

.philjs-link-preview-image {
  height: 160px;
  object-fit: cover;
  width: 100%;
}

.philjs-link-preview-content {
  padding: 0.75rem;
}

.philjs-link-preview-favicon {
  height: 16px;
  margin-right: 0.5rem;
  width: 16px;
}

.philjs-link-preview-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.philjs-link-preview-description {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.philjs-link-preview-url {
  color: #94a3b8;
  font-size: 0.75rem;
}
`;
export { Link };
export default createLinkExtension;
//# sourceMappingURL=link.js.map