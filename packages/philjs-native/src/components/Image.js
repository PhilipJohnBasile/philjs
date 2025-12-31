/**
 * Image Component
 *
 * A component for displaying images with native optimization.
 * Supports remote URLs, local assets, and various resize modes.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Image Component
// ============================================================================
/**
 * Create an Image component
 */
export function Image(props) {
    const platform = detectPlatform();
    // Merge styles if array
    const mergedStyle = Array.isArray(props.style)
        ? Object.assign({}, ...props.style.filter(Boolean))
        : props.style || {};
    // Get the image URI
    const uri = getImageUri(props.source);
    // Convert style to platform-specific format
    const platformStyle = convertImageStyle(mergedStyle, props.resizeMode, platform);
    if (platform === 'web') {
        return {
            type: 'img',
            props: {
                src: uri,
                alt: props.alt || props.accessibilityLabel || '',
                style: platformStyle,
                'data-testid': props.testID,
                'aria-label': props.accessibilityLabel,
                crossOrigin: props.crossOrigin,
                referrerPolicy: props.referrerPolicy,
                loading: 'lazy',
                onLoad: (e) => {
                    props.onLoadEnd?.();
                    props.onLoad?.({
                        nativeEvent: {
                            source: {
                                width: e.target.naturalWidth,
                                height: e.target.naturalHeight,
                                uri: uri || '',
                            },
                        },
                    });
                },
                onError: (e) => {
                    props.onLoadEnd?.();
                    props.onError?.({
                        nativeEvent: {
                            error: `Failed to load image: ${uri}`,
                        },
                    });
                },
                onLoadStart: props.onLoadStart,
            },
            children: null,
        };
    }
    // Return native element descriptor
    return {
        type: 'NativeImage',
        props: {
            ...props,
            uri,
            style: platformStyle,
        },
        children: null,
    };
}
// ============================================================================
// Static Methods
// ============================================================================
/**
 * Image static methods
 */
Image.getSize = async function getSize(uri) {
    const platform = detectPlatform();
    if (platform === 'web') {
        return new Promise((resolve, reject) => {
            const img = new globalThis.Image();
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${uri}`));
            };
            img.src = uri;
        });
    }
    return nativeBridge.call('Image', 'getSize', uri);
};
/**
 * Prefetch an image
 */
Image.prefetch = async function prefetch(uri) {
    const platform = detectPlatform();
    if (platform === 'web') {
        return new Promise((resolve) => {
            const img = new globalThis.Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = uri;
        });
    }
    return nativeBridge.call('Image', 'prefetch', uri);
};
/**
 * Abort prefetch requests
 */
Image.abortPrefetch = async function abortPrefetch(requestId) {
    const platform = detectPlatform();
    if (platform !== 'web') {
        await nativeBridge.call('Image', 'abortPrefetch', requestId);
    }
};
/**
 * Query the cache
 */
Image.queryCache = async function queryCache(uris) {
    const platform = detectPlatform();
    if (platform === 'web') {
        // Web doesn't have direct cache access
        const result = {};
        for (const uri of uris) {
            result[uri] = 'none';
        }
        return result;
    }
    return nativeBridge.call('Image', 'queryCache', uris);
};
/**
 * Resolve asset source
 */
Image.resolveAssetSource = function resolveAssetSource(source) {
    if (typeof source === 'string') {
        return { uri: source, width: 0, height: 0 };
    }
    if (typeof source === 'object' && 'uri' in source) {
        return {
            uri: source.uri,
            width: source.width || 0,
            height: source.height || 0,
        };
    }
    // For bundled assets (number), return null or call native
    return null;
};
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Get image URI from source
 */
function getImageUri(source) {
    if (typeof source === 'string') {
        return source;
    }
    if (typeof source === 'object' && 'uri' in source) {
        return source.uri;
    }
    // For bundled assets, would need native resolution
    return undefined;
}
/**
 * Convert image style to platform-specific format
 */
function convertImageStyle(style, resizeMode, platform) {
    const result = {};
    for (const [key, value] of Object.entries(style)) {
        if (value === undefined || value === null)
            continue;
        if (platform === 'web') {
            const cssKey = camelToKebab(key);
            result[cssKey] = convertValue(key, value);
        }
        else {
            result[key] = value;
        }
    }
    // Add resize mode for web
    if (platform === 'web' && resizeMode) {
        const objectFitMap = {
            cover: 'cover',
            contain: 'contain',
            stretch: 'fill',
            repeat: 'none',
            center: 'none',
        };
        result['object-fit'] = objectFitMap[resizeMode];
        if (resizeMode === 'center') {
            result['object-position'] = 'center';
        }
        if (resizeMode === 'repeat') {
            // For repeat, we'd need to use background-image instead
            // This is a simplified implementation
        }
    }
    return result;
}
/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
/**
 * Convert value to CSS-compatible format
 */
function convertValue(key, value) {
    const unitlessProperties = [
        'flex',
        'flexGrow',
        'flexShrink',
        'opacity',
        'zIndex',
        'aspectRatio',
    ];
    if (typeof value === 'number' && !unitlessProperties.includes(key)) {
        return `${value}px`;
    }
    return String(value);
}
// ============================================================================
// Exports
// ============================================================================
export default Image;
//# sourceMappingURL=Image.js.map