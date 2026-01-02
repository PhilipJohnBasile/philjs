/**
 * Image Component
 *
 * A component for displaying images with native optimization.
 * Supports remote URLs, local assets, and various resize modes.
 */

import { signal, effect, type Signal } from '@philjs/core';
import { detectPlatform, nativeBridge } from '../runtime.js';
import type { ImageStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Image source
 */
export type ImageSource =
  | { uri: string; width?: number; height?: number; headers?: Record<string, string> }
  | number  // For bundled assets
  | string; // URI string

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

// ============================================================================
// Image Component
// ============================================================================

/**
 * Create an Image component
 */
export function Image(props: ImageProps): any {
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
        onLoad: (e: any) => {
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
        onError: (e: any) => {
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
Image.getSize = async function getSize(
  uri: string
): Promise<{ width: number; height: number }> {
  const platform = detectPlatform();

  if (platform === 'web') {
    return new Promise((resolve, reject) => {
      const img = new (globalThis as any).Image();
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
Image.prefetch = async function prefetch(uri: string): Promise<boolean> {
  const platform = detectPlatform();

  if (platform === 'web') {
    return new Promise((resolve) => {
      const img = new (globalThis as any).Image();
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
Image.abortPrefetch = async function abortPrefetch(requestId: number): Promise<void> {
  const platform = detectPlatform();

  if (platform !== 'web') {
    await nativeBridge.call('Image', 'abortPrefetch', requestId);
  }
};

/**
 * Query the cache
 */
Image.queryCache = async function queryCache(
  uris: string[]
): Promise<Record<string, 'memory' | 'disk' | 'none'>> {
  const platform = detectPlatform();

  if (platform === 'web') {
    // Web doesn't have direct cache access
    const result: Record<string, 'memory' | 'disk' | 'none'> = {};
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
Image.resolveAssetSource = function resolveAssetSource(
  source: ImageSource
): { uri: string; width: number; height: number } | null {
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
function getImageUri(source: ImageSource): string | undefined {
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
function convertImageStyle(
  style: ImageStyle,
  resizeMode?: ResizeMode,
  platform?: string
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    if (platform === 'web') {
      const cssKey = camelToKebab(key);
      result[cssKey] = convertValue(key, value);
    } else {
      result[key] = value;
    }
  }

  // Add resize mode for web
  if (platform === 'web' && resizeMode) {
    const objectFitMap: Record<ResizeMode, string> = {
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
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Convert value to CSS-compatible format
 */
function convertValue(key: string, value: any): string {
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
