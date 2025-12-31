/**
 * Share API
 *
 * Native share sheet for sharing content.
 */
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
/**
 * Share API singleton
 */
export declare const Share: {
    /**
     * Check if sharing is available
     */
    isAvailable(): boolean;
    /**
     * Share content
     */
    share(content: ShareContent, options?: ShareOptions): Promise<ShareResult>;
    /**
     * Share with activity sheet
     */
    shareWithActivitySheet(content: ShareContent, options?: ShareOptions): Promise<ShareResult>;
    /**
     * Share files
     */
    shareFiles(files: ShareFileContent[], options?: ShareOptions & {
        message?: string;
    }): Promise<ShareResult>;
    /**
     * Share image
     */
    shareImage(imageUri: string, options?: ShareOptions & {
        message?: string;
        title?: string;
    }): Promise<ShareResult>;
    /**
     * Share PDF
     */
    sharePDF(pdfUri: string, options?: ShareOptions & {
        filename?: string;
    }): Promise<ShareResult>;
    /**
     * Open share sheet for URL
     */
    shareUrl(url: string, title?: string): Promise<ShareResult>;
    /**
     * Open share sheet for message
     */
    shareMessage(message: string, title?: string): Promise<ShareResult>;
    /**
     * Share to specific app (when available)
     */
    shareTo(app: "twitter" | "facebook" | "whatsapp" | "telegram" | "email" | "sms", content: ShareContent): Promise<ShareResult>;
    /**
     * Social share options
     */
    social: {
        twitter(content: ShareContent): Promise<ShareResult>;
        facebook(content: ShareContent): Promise<ShareResult>;
        whatsapp(content: ShareContent): Promise<ShareResult>;
        telegram(content: ShareContent): Promise<ShareResult>;
        email(content: ShareContent): Promise<ShareResult>;
        sms(content: ShareContent): Promise<ShareResult>;
    };
};
export default Share;
//# sourceMappingURL=Share.d.ts.map