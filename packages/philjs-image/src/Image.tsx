/**
 * PhilJS Image Component
 *
 * Optimized image component with automatic format conversion,
 * responsive sizing, lazy loading, and blur placeholders.
 */

import { signal, memo, effect } from 'philjs-core';
import type { ImageProps, OptimizedImage } from './types';
import { generateSrcSet, generateBlurDataURL, isExternalUrl } from './utils';

export function Image(props: ImageProps) {
  const {
    src,
    alt,
    width,
    height,
    quality = 85,
    formats = ['webp', 'jpeg'],
    sizes,
    loading = 'lazy',
    priority = false,
    placeholder = 'blur',
    blurDataURL,
    placeholderColor,
    fit = 'cover',
    className = '',
    style = {},
    onLoad,
    onError,
    unoptimized = false,
    crossOrigin,
    referrerPolicy,
    decoding = 'async',
  } = props;

  const isLoaded = signal(false);
  const hasError = signal(false);
  const currentSrc = signal<string | null>(null);

  // Generate optimized sources
  const optimizedSources = memo(() => {
    if (unoptimized) {
      return null;
    }

    const isExternal = isExternalUrl(src);

    if (isExternal && !allowedExternal(src)) {
      console.warn(`[PhilJS Image] External URL not allowed: ${src}`);
      return null;
    }

    return generateSrcSet(src, {
      width,
      height,
      quality,
      formats,
    });
  });

  // Generate blur placeholder
  const placeholderDataURL = memo(() => {
    if (placeholder === 'none') return null;
    if (blurDataURL) return blurDataURL;
    if (placeholder === 'color') {
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width || 1} ${height || 1}'%3E%3Crect fill='${placeholderColor || '#f0f0f0'}' width='${width || 1}' height='${height || 1}'/%3E%3C/svg%3E`;
    }
    if (placeholder === 'blur') {
      return generateBlurDataURL(src, width, height);
    }
    return null;
  });

  // Handle image load
  const handleLoad = () => {
    isLoaded.set(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = (e: Event) => {
    hasError.set(true);
    const error = new Error(`Failed to load image: ${src}`);
    onError?.(error);
    console.error('[PhilJS Image]', error);
  };

  // Preload if priority
  effect(() => {
    if (priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (optimizedSources()?.srcSet) {
        link.setAttribute('imagesrcset', optimizedSources()!.srcSet);
      }
      if (sizes) {
        link.setAttribute('imagesizes', sizes);
      }
      document.head.appendChild(link);
    }
  });

  // Compute final src
  const finalSrc = memo(() => {
    if (unoptimized) return src;
    const optimized = optimizedSources();
    return optimized?.src || src;
  });

  // Compute srcSet
  const finalSrcSet = memo(() => {
    if (unoptimized) return undefined;
    return optimizedSources()?.srcSet;
  });

  // Styles for the container
  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    ...style,
  };

  // Styles for the image
  const imageStyle = {
    objectFit: fit,
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded() ? '1' : '0',
  };

  // Styles for placeholder
  const placeholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: fit,
    opacity: isLoaded() ? '0' : '1',
    transition: 'opacity 0.3s ease-in-out',
    pointerEvents: 'none',
  };

  return (
    <span style={containerStyle} className={className}>
      {/* Placeholder */}
      {placeholder !== 'none' && placeholderDataURL() && (
        <img
          src={placeholderDataURL()!}
          alt=""
          aria-hidden={true}
          style={placeholderStyle}
          decoding="async"
        />
      )}

      {/* Main Image */}
      <picture>
        {/* Modern formats */}
        {!unoptimized && formats.includes('avif') && (
          <source
            type="image/avif"
            srcSet={finalSrcSet()?.replace(/\.(webp|jpg|jpeg|png)/g, '.avif')}
            sizes={sizes}
          />
        )}
        {!unoptimized && formats.includes('webp') && (
          <source
            type="image/webp"
            srcSet={finalSrcSet()}
            sizes={sizes}
          />
        )}

        {/* Fallback */}
        <img
          src={finalSrc()}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : loading === 'auto' ? 'lazy' : loading}
          decoding={decoding}
          crossOrigin={crossOrigin}
          referrerPolicy={referrerPolicy}
          srcSet={finalSrcSet()}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          style={imageStyle}
        />
      </picture>

      {/* Error state */}
      {hasError() && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          color: '#666',
        }}>
          Failed to load image
        </div>
      )}
    </span>
  );
}

// Helper to check if external URLs are allowed
function allowedExternal(url: string): boolean {
  // This would check against config.allowedDomains
  // For now, allow all external URLs
  return true;
}

// Default export
export default Image;
