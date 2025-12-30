/**
 * Share API
 *
 * Native share sheet for sharing content.
 */

import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Share content
 */
export interface ShareContent {
  /**
   * Message to share
   */
  message?: string;

  /**
   * URL to share
   */
  url?: string;

  /**
   * Title for the share sheet
   */
  title?: string;

  /**
   * Subject for email shares
   */
  subject?: string;
}

/**
 * Share options
 */
export interface ShareOptions {
  /**
   * Dialog title (Android)
   */
  dialogTitle?: string;

  /**
   * Exclude activity types (iOS)
   */
  excludedActivityTypes?: string[];

  /**
   * Tint color (iOS)
   */
  tintColor?: string;

  /**
   * Anchor for iPad popover
   */
  anchor?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Share result
 */
export interface ShareResult {
  /**
   * Whether share was successful
   */
  success: boolean;

  /**
   * Activity type that was used (iOS)
   */
  activityType?: string;

  /**
   * Whether share was dismissed
   */
  dismissed?: boolean;
}

/**
 * Share file content
 */
export interface ShareFileContent {
  /**
   * File URI
   */
  url: string;

  /**
   * MIME type
   */
  type?: string;

  /**
   * File name
   */
  filename?: string;
}

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
  isAvailable(): boolean {
    const platform = detectPlatform();

    if (platform === 'web') {
      return 'share' in navigator;
    }

    return true;
  },

  /**
   * Share content
   */
  async share(
    content: ShareContent,
    options?: ShareOptions
  ): Promise<ShareResult> {
    const platform = detectPlatform();

    if (platform === 'web') {
      if (!navigator.share) {
        throw new Error('Web Share API not supported');
      }

      try {
        const shareData: ShareData = {};
        if (content.title !== undefined) shareData.title = content.title;
        if (content.message !== undefined) shareData.text = content.message;
        if (content.url !== undefined) shareData.url = content.url;

        await navigator.share(shareData);

        return { success: true };
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          return { success: false, dismissed: true };
        }
        throw error;
      }
    }

    return nativeBridge.call<ShareResult>('Share', 'share', content, options);
  },

  /**
   * Share with activity sheet
   */
  async shareWithActivitySheet(
    content: ShareContent,
    options?: ShareOptions
  ): Promise<ShareResult> {
    return this.share(content, options);
  },

  /**
   * Share files
   */
  async shareFiles(
    files: ShareFileContent[],
    options?: ShareOptions & { message?: string }
  ): Promise<ShareResult> {
    const platform = detectPlatform();

    if (platform === 'web') {
      if (!navigator.share || !(navigator as any).canShare) {
        throw new Error('File sharing not supported');
      }

      try {
        const fileObjects: File[] = await Promise.all(
          files.map(async (file) => {
            const response = await fetch(file.url);
            const blob = await response.blob();
            return new File([blob], file.filename || 'file', {
              type: file.type || blob.type,
            });
          })
        );

        const shareData: ShareData = { files: fileObjects };
        if (options?.dialogTitle !== undefined) shareData.title = options.dialogTitle;
        if (options?.message !== undefined) shareData.text = options.message;

        if (!(navigator as any).canShare(shareData)) {
          throw new Error('Cannot share these files');
        }

        await navigator.share(shareData);
        return { success: true };
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          return { success: false, dismissed: true };
        }
        throw error;
      }
    }

    return nativeBridge.call<ShareResult>('Share', 'shareFiles', files, options);
  },

  /**
   * Share image
   */
  async shareImage(
    imageUri: string,
    options?: ShareOptions & { message?: string; title?: string }
  ): Promise<ShareResult> {
    return this.shareFiles(
      [{ url: imageUri, type: 'image/jpeg', filename: 'image.jpg' }],
      options
    );
  },

  /**
   * Share PDF
   */
  async sharePDF(
    pdfUri: string,
    options?: ShareOptions & { filename?: string }
  ): Promise<ShareResult> {
    return this.shareFiles(
      [{ url: pdfUri, type: 'application/pdf', filename: options?.filename || 'document.pdf' }],
      options
    );
  },

  /**
   * Open share sheet for URL
   */
  async shareUrl(
    url: string,
    title?: string
  ): Promise<ShareResult> {
    const content: ShareContent = { url };
    if (title !== undefined) content.title = title;
    return this.share(content);
  },

  /**
   * Open share sheet for message
   */
  async shareMessage(
    message: string,
    title?: string
  ): Promise<ShareResult> {
    const content: ShareContent = { message };
    if (title !== undefined) content.title = title;
    return this.share(content);
  },

  /**
   * Share to specific app (when available)
   */
  async shareTo(
    app: 'twitter' | 'facebook' | 'whatsapp' | 'telegram' | 'email' | 'sms',
    content: ShareContent
  ): Promise<ShareResult> {
    const platform = detectPlatform();

    // Build app-specific URLs
    let url: string;
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

    return nativeBridge.call<ShareResult>('Share', 'openUrl', url);
  },

  /**
   * Social share options
   */
  social: {
    twitter(content: ShareContent): Promise<ShareResult> {
      return Share.shareTo('twitter', content);
    },

    facebook(content: ShareContent): Promise<ShareResult> {
      return Share.shareTo('facebook', content);
    },

    whatsapp(content: ShareContent): Promise<ShareResult> {
      return Share.shareTo('whatsapp', content);
    },

    telegram(content: ShareContent): Promise<ShareResult> {
      return Share.shareTo('telegram', content);
    },

    email(content: ShareContent): Promise<ShareResult> {
      return Share.shareTo('email', content);
    },

    sms(content: ShareContent): Promise<ShareResult> {
      return Share.shareTo('sms', content);
    },
  },
};

// ============================================================================
// Export
// ============================================================================

export default Share;
