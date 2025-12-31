/**
 * Share API
 *
 * Native share sheet for sharing content.
 */
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Share API
// ============================================================================
/**
 * Share API singleton
 */
export const Share = {
    /**
     * Check if sharing is available
     */
    isAvailable() {
        const platform = detectPlatform();
        if (platform === 'web') {
            return 'share' in navigator;
        }
        return true;
    },
    /**
     * Share content
     */
    async share(content, options) {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (!navigator.share) {
                throw new Error('Web Share API not supported');
            }
            try {
                const shareData = {};
                if (content.title !== undefined)
                    shareData.title = content.title;
                if (content.message !== undefined)
                    shareData.text = content.message;
                if (content.url !== undefined)
                    shareData.url = content.url;
                await navigator.share(shareData);
                return { success: true };
            }
            catch (error) {
                if (error.name === 'AbortError') {
                    return { success: false, dismissed: true };
                }
                throw error;
            }
        }
        return nativeBridge.call('Share', 'share', content, options);
    },
    /**
     * Share with activity sheet
     */
    async shareWithActivitySheet(content, options) {
        return this.share(content, options);
    },
    /**
     * Share files
     */
    async shareFiles(files, options) {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (!navigator.share || !navigator.canShare) {
                throw new Error('File sharing not supported');
            }
            try {
                const fileObjects = await Promise.all(files.map(async (file) => {
                    const response = await fetch(file.url);
                    const blob = await response.blob();
                    return new File([blob], file.filename || 'file', {
                        type: file.type || blob.type,
                    });
                }));
                const shareData = { files: fileObjects };
                if (options?.dialogTitle !== undefined)
                    shareData.title = options.dialogTitle;
                if (options?.message !== undefined)
                    shareData.text = options.message;
                if (!navigator.canShare(shareData)) {
                    throw new Error('Cannot share these files');
                }
                await navigator.share(shareData);
                return { success: true };
            }
            catch (error) {
                if (error.name === 'AbortError') {
                    return { success: false, dismissed: true };
                }
                throw error;
            }
        }
        return nativeBridge.call('Share', 'shareFiles', files, options);
    },
    /**
     * Share image
     */
    async shareImage(imageUri, options) {
        return this.shareFiles([{ url: imageUri, type: 'image/jpeg', filename: 'image.jpg' }], options);
    },
    /**
     * Share PDF
     */
    async sharePDF(pdfUri, options) {
        return this.shareFiles([{ url: pdfUri, type: 'application/pdf', filename: options?.filename || 'document.pdf' }], options);
    },
    /**
     * Open share sheet for URL
     */
    async shareUrl(url, title) {
        const content = { url };
        if (title !== undefined)
            content.title = title;
        return this.share(content);
    },
    /**
     * Open share sheet for message
     */
    async shareMessage(message, title) {
        const content = { message };
        if (title !== undefined)
            content.title = title;
        return this.share(content);
    },
    /**
     * Share to specific app (when available)
     */
    async shareTo(app, content) {
        const platform = detectPlatform();
        // Build app-specific URLs
        let url;
        const text = encodeURIComponent(content.message || '');
        const shareUrl = encodeURIComponent(content.url || '');
        switch (app) {
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${text}${shareUrl ? `%20${shareUrl}` : ''}`;
                break;
            case 'telegram':
                url = `https://t.me/share/url?url=${shareUrl}&text=${text}`;
                break;
            case 'email':
                const subject = encodeURIComponent(content.subject || content.title || '');
                url = `mailto:?subject=${subject}&body=${text}${shareUrl ? `%0A${shareUrl}` : ''}`;
                break;
            case 'sms':
                url = `sms:?body=${text}${shareUrl ? `%20${shareUrl}` : ''}`;
                break;
            default:
                return this.share(content);
        }
        if (platform === 'web') {
            window.open(url, '_blank', 'noopener,noreferrer');
            return { success: true };
        }
        return nativeBridge.call('Share', 'openUrl', url);
    },
    /**
     * Social share options
     */
    social: {
        twitter(content) {
            return Share.shareTo('twitter', content);
        },
        facebook(content) {
            return Share.shareTo('facebook', content);
        },
        whatsapp(content) {
            return Share.shareTo('whatsapp', content);
        },
        telegram(content) {
            return Share.shareTo('telegram', content);
        },
        email(content) {
            return Share.shareTo('email', content);
        },
        sms(content) {
            return Share.shareTo('sms', content);
        },
    },
};
// ============================================================================
// Export
// ============================================================================
export default Share;
//# sourceMappingURL=Share.js.map