/**
 * Video Extension with Embed Support
 *
 * Supports YouTube, Vimeo, and custom video embeds
 */
import Youtube from '@tiptap/extension-youtube';
export interface VideoOptions {
    /**
     * Enable YouTube embeds
     */
    youtube?: boolean;
    /**
     * Enable Vimeo embeds
     */
    vimeo?: boolean;
    /**
     * Enable custom video embeds
     */
    customVideo?: boolean;
    /**
     * Default video width
     */
    width?: number;
    /**
     * Default video height
     */
    height?: number;
    /**
     * Allow fullscreen
     */
    allowFullscreen?: boolean;
    /**
     * Autoplay videos (muted)
     */
    autoplay?: boolean;
}
/**
 * Vimeo Extension
 */
export declare const Vimeo: any;
/**
 * Custom Video Node for self-hosted videos
 */
export declare const CustomVideo: any;
/**
 * Create configured video extensions
 */
export declare function createVideoExtensions(options?: VideoOptions): any[];
/**
 * Detect video platform from URL
 */
export declare function detectVideoPlatform(url: string): 'youtube' | 'vimeo' | 'custom' | null;
/**
 * Insert video by URL (auto-detects platform)
 */
export declare function insertVideo(editor: any, url: string): void;
export { Youtube };
export default createVideoExtensions;
//# sourceMappingURL=video.d.ts.map