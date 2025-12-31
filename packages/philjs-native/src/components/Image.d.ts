/**
 * Image Component
 *
 * A component for displaying images with native optimization.
 * Supports remote URLs, local assets, and various resize modes.
 */
import type { ImageStyle } from '../styles.js';
/**
 * Image source
 */
export type ImageSource = {
    uri: string;
    width?: number;
    height?: number;
    headers?: Record<string, string>;
} | number | string;
/**
 * Resize mode
 */
export type ResizeMode = 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
/**
 * Image loading event
 */
export interface ImageLoadEvent {
    nativeEvent: {
        source: {
            width: number;
            height: number;
            uri: string;
        };
    };
}
/**
 * Image error event
 */
export interface ImageErrorEvent {
    nativeEvent: {
        error: string;
    };
}
/**
 * Image progress event
 */
export interface ImageProgressEvent {
    nativeEvent: {
        loaded: number;
        total: number;
    };
}
/**
 * Image props
 */
export interface ImageProps {
    /**
     * Image source
     */
    source: ImageSource;
    /**
     * Style for the image
     */
    style?: ImageStyle | ImageStyle[];
    /**
     * Resize mode
     */
    resizeMode?: ResizeMode;
    /**
     * Blur radius for the image
     */
    blurRadius?: number;
    /**
     * Default source while loading
     */
    defaultSource?: ImageSource;
    /**
     * Loading indicator source
     */
    loadingIndicatorSource?: ImageSource;
    /**
     * Test ID for testing
     */
    testID?: string;
    /**
     * Accessibility label
     */
    accessibilityLabel?: string;
    /**
     * Whether the image is accessible
     */
    accessible?: boolean;
    /**
     * Callback when image loads
     */
    onLoad?: (event: ImageLoadEvent) => void;
    /**
     * Callback when image starts loading
     */
    onLoadStart?: () => void;
    /**
     * Callback when image finishes loading
     */
    onLoadEnd?: () => void;
    /**
     * Callback on load error
     */
    onError?: (event: ImageErrorEvent) => void;
    /**
     * Callback on load progress
     */
    onProgress?: (event: ImageProgressEvent) => void;
    /**
     * Fade duration on load (ms)
     */
    fadeDuration?: number;
    /**
     * Progressive rendering (Android)
     */
    progressiveRenderingEnabled?: boolean;
    /**
     * Tint color for the image
     */
    tintColor?: string;
    /**
     * Cap insets for resizable images (iOS)
     */
    capInsets?: {
        top?: number;
        left?: number;
        bottom?: number;
        right?: number;
    };
    /**
     * Alt text for web
     */
    alt?: string;
    /**
     * Cross-origin setting for web
     */
    crossOrigin?: 'anonymous' | 'use-credentials';
    /**
     * Referrer policy for web
     */
    referrerPolicy?: string;
}
/**
 * Create an Image component
 */
export declare function Image(props: ImageProps): any;
export declare namespace Image {
    var getSize: (uri: string) => Promise<{
        width: number;
        height: number;
    }>;
    var prefetch: (uri: string) => Promise<boolean>;
    var abortPrefetch: (requestId: number) => Promise<void>;
    var queryCache: (uris: string[]) => Promise<Record<string, "memory" | "disk" | "none">>;
    var resolveAssetSource: (source: ImageSource) => {
        uri: string;
        width: number;
        height: number;
    } | null;
}
export default Image;
//# sourceMappingURL=Image.d.ts.map