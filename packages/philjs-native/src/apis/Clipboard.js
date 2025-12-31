/**
 * Clipboard API
 *
 * Access to system clipboard for copy/paste.
 */
import { signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Clipboard State
// ============================================================================
/**
 * Last clipboard content
 */
export const clipboardContent = signal('');
// ============================================================================
// Clipboard API
// ============================================================================
/**
 * Clipboard API singleton
 */
export const Clipboard = {
    /**
     * Get string from clipboard
     */
    async getString() {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const text = await navigator.clipboard.readText();
                clipboardContent.set(text);
                return text;
            }
            catch (error) {
                console.error('Clipboard read failed:', error);
                return '';
            }
        }
        const text = await nativeBridge.call('Clipboard', 'getString');
        clipboardContent.set(text);
        return text;
    },
    /**
     * Set string to clipboard
     */
    async setString(text) {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                await navigator.clipboard.writeText(text);
                clipboardContent.set(text);
            }
            catch (error) {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                clipboardContent.set(text);
            }
            return;
        }
        await nativeBridge.call('Clipboard', 'setString', text);
        clipboardContent.set(text);
    },
    /**
     * Get URL from clipboard
     */
    async getUrl() {
        const platform = detectPlatform();
        if (platform === 'web') {
            const text = await this.getString();
            return URL.parse(text) !== null ? text : null;
        }
        return nativeBridge.call('Clipboard', 'getUrl');
    },
    /**
     * Set URL to clipboard
     */
    async setUrl(url) {
        return this.setString(url);
    },
    /**
     * Get image from clipboard
     */
    async getImage() {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const items = await navigator.clipboard.read();
                for (const item of items) {
                    for (const type of item.types) {
                        if (type.startsWith('image/')) {
                            const blob = await item.getType(type);
                            return URL.createObjectURL(blob);
                        }
                    }
                }
                return null;
            }
            catch {
                return null;
            }
        }
        return nativeBridge.call('Clipboard', 'getImage');
    },
    /**
     * Set image to clipboard
     */
    async setImage(imageUri) {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob }),
                ]);
            }
            catch (error) {
                console.error('Failed to copy image:', error);
            }
            return;
        }
        return nativeBridge.call('Clipboard', 'setImage', imageUri);
    },
    /**
     * Get HTML from clipboard
     */
    async getHtml() {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const items = await navigator.clipboard.read();
                for (const item of items) {
                    if (item.types.includes('text/html')) {
                        const blob = await item.getType('text/html');
                        return await blob.text();
                    }
                }
                return null;
            }
            catch {
                return null;
            }
        }
        return nativeBridge.call('Clipboard', 'getHtml');
    },
    /**
     * Set HTML to clipboard
     */
    async setHtml(html) {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const blob = new Blob([html], { type: 'text/html' });
                await navigator.clipboard.write([
                    new ClipboardItem({ 'text/html': blob }),
                ]);
            }
            catch (error) {
                // Fallback to plain text
                await this.setString(html);
            }
            return;
        }
        return nativeBridge.call('Clipboard', 'setHtml', html);
    },
    /**
     * Get content with multiple formats
     */
    async getContent() {
        const content = {};
        const text = await this.getString();
        if (text)
            content.text = text;
        const html = await this.getHtml();
        if (html)
            content.html = html;
        const url = await this.getUrl();
        if (url)
            content.url = url;
        const image = await this.getImage();
        if (image)
            content.image = image;
        return content;
    },
    /**
     * Set content with multiple formats
     */
    async setContent(content) {
        const platform = detectPlatform();
        if (platform === 'web') {
            const items = {};
            if (content.text) {
                items['text/plain'] = new Blob([content.text], { type: 'text/plain' });
            }
            if (content.html) {
                items['text/html'] = new Blob([content.html], { type: 'text/html' });
            }
            if (Object.keys(items).length > 0) {
                try {
                    await navigator.clipboard.write([new ClipboardItem(items)]);
                }
                catch {
                    // Fallback
                    if (content.text) {
                        await this.setString(content.text);
                    }
                }
            }
            return;
        }
        return nativeBridge.call('Clipboard', 'setContent', content);
    },
    /**
     * Check if clipboard has content
     */
    async hasContent() {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const text = await navigator.clipboard.readText();
                return text.length > 0;
            }
            catch {
                return false;
            }
        }
        return nativeBridge.call('Clipboard', 'hasContent');
    },
    /**
     * Check if clipboard has string
     */
    async hasString() {
        return this.hasContent();
    },
    /**
     * Check if clipboard has URL
     */
    async hasUrl() {
        const url = await this.getUrl();
        return url !== null;
    },
    /**
     * Check if clipboard has image
     */
    async hasImage() {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const items = await navigator.clipboard.read();
                for (const item of items) {
                    if (item.types.some(type => type.startsWith('image/'))) {
                        return true;
                    }
                }
                return false;
            }
            catch {
                return false;
            }
        }
        return nativeBridge.call('Clipboard', 'hasImage');
    },
    /**
     * Add clipboard change listener
     */
    addListener(callback) {
        const platform = detectPlatform();
        if (platform === 'web') {
            // Web doesn't have a reliable clipboard change event
            // Poll every second as a workaround
            let lastContent = '';
            const intervalId = setInterval(async () => {
                try {
                    const content = await this.getString();
                    if (content !== lastContent) {
                        lastContent = content;
                        callback(content);
                    }
                }
                catch {
                    // Ignore permission errors
                }
            }, 1000);
            return () => clearInterval(intervalId);
        }
        return nativeBridge.on('clipboardChange', callback);
    },
};
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to use clipboard
 */
export function useClipboard() {
    return {
        content: clipboardContent(),
        copy: Clipboard.setString,
        paste: Clipboard.getString,
    };
}
// ============================================================================
// Export
// ============================================================================
export default Clipboard;
//# sourceMappingURL=Clipboard.js.map