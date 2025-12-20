/**
 * PhilJS Image Component
 *
 * Advanced image component with:
 * - Automatic format conversion (AVIF, WebP, fallback)
 * - Responsive sizing and automatic srcset generation
 * - Lazy loading with blur placeholders
 * - Aspect ratio locking
 * - Art direction (different images for breakpoints)
 * - Priority hints for LCP images
 * - Loading animations
 * - BlurHash support
 */

import { signal, memo, effect } from 'philjs-core';
import type { ImageProps, OptimizedImage, ArtDirectionSource, LoadingAnimation } from './types';
import { generateSrcSet, generateBlurDataURL, isExternalUrl } from './utils';

export function Image(props: ImageProps) {
  const {
    src,
    alt,
    width,
    height,
    aspectRatio: aspectRatioProp,
    maintainAspectRatio = true,
    quality = 85,
    formats = ['webp', 'jpeg'],
    sizes,
    artDirection,
    loading = 'lazy',
    priority = false,
    fetchPriority,
    placeholder = 'blur',
    blurDataURL,
    placeholderColor,
    blurHash,
    loadingAnimation = 'fade',
    animationDuration = 300,
    fit = 'cover',
    className = '',
    style = {},
    onLoad,
    onError,
    unoptimized = false,
    crossOrigin,
    referrerPolicy,
    decoding = 'async',
    service,
  } = props;

  const isLoaded = signal(false);
  const hasError = signal(false);
  const currentSrc = signal<string | null>(null);

  // Calculate aspect ratio
  const aspectRatio = memo(() => {
    if (aspectRatioProp) {
      if (typeof aspectRatioProp === 'string') {
        const [w, h] = aspectRatioProp.split(':').map(Number);
        return w / h;
      }
      return aspectRatioProp;
    }
    if (width && height) {
      return width / height;
    }
    return undefined;
  });

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

  // Generate art direction sources
  const artDirectionSources = memo(() => {
    if (!artDirection || unoptimized) {
      return null;
    }

    return artDirection.map((source: ArtDirectionSource) => ({
      ...source,
      optimized: generateSrcSet(source.src, {
        width: source.width || width,
        height: source.height || height,
        quality,
        formats,
      }),
    }));
  });

  // Generate blur placeholder
  const placeholderDataURL = memo(() => {
    if (placeholder === 'none') return null;

    // Use provided blurDataURL
    if (blurDataURL) return blurDataURL;

    // Use BlurHash if provided
    if (blurHash) {
      return renderBlurHash(blurHash, width, height);
    }

    // Generate color placeholder
    if (placeholder === 'color') {
      const color = placeholderColor || '#f0f0f0';
      const w = width || 100;
      const h = height || 100;
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'%3E%3Crect fill='${color}' width='${w}' height='${h}'/%3E%3C/svg%3E`;
    }

    // Generate blur placeholder
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
      if (fetchPriority) {
        link.setAttribute('fetchpriority', fetchPriority);
      }

      document.head.appendChild(link);

      // Cleanup
      return () => {
        document.head.removeChild(link);
      };
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

  // Animation styles
  const getAnimationStyle = (animation: LoadingAnimation) => {
    const baseTransition = `opacity ${animationDuration}ms ease-in-out`;

    switch (animation) {
      case 'fade':
        return {
          transition: baseTransition,
          opacity: isLoaded() ? '1' : '0',
        };
      case 'blur':
        return {
          transition: `${baseTransition}, filter ${animationDuration}ms ease-in-out`,
          opacity: isLoaded() ? '1' : '0',
          filter: isLoaded() ? 'blur(0)' : 'blur(10px)',
        };
      case 'scale':
        return {
          transition: `${baseTransition}, transform ${animationDuration}ms ease-in-out`,
          opacity: isLoaded() ? '1' : '0',
          transform: isLoaded() ? 'scale(1)' : 'scale(1.1)',
        };
      case 'none':
      default:
        return { opacity: '1' };
    }
  };

  // Styles for the container
  const containerStyle = {
    position: 'relative' as const,
    display: 'inline-block',
    overflow: 'hidden',
    ...(maintainAspectRatio && aspectRatio() && {
      aspectRatio: aspectRatio()!.toString(),
    }),
    ...style,
  };

  // Styles for the image
  const imageStyle = {
    objectFit: fit,
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    ...getAnimationStyle(loadingAnimation),
  };

  // Styles for placeholder
  const placeholderStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: fit,
    opacity: isLoaded() ? '0' : '1',
    transition: `opacity ${animationDuration}ms ease-in-out`,
    pointerEvents: 'none' as const,
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

      {/* Main Image with Art Direction */}
      <picture>
        {/* Art Direction Sources */}
        {artDirectionSources()?.map((source, index) => (
          <>
            {/* AVIF format for this breakpoint */}
            {formats.includes('avif') && (
              <source
                key={`avif-${index}`}
                media={source.media}
                type="image/avif"
                srcSet={source.optimized?.srcSet?.replace(/\.(webp|jpg|jpeg|png)/g, '.avif')}
                sizes={sizes}
              />
            )}
            {/* WebP format for this breakpoint */}
            {formats.includes('webp') && (
              <source
                key={`webp-${index}`}
                media={source.media}
                type="image/webp"
                srcSet={source.optimized?.srcSet}
                sizes={sizes}
              />
            )}
            {/* Fallback format for this breakpoint */}
            <source
              key={`fallback-${index}`}
              media={source.media}
              srcSet={source.optimized?.srcSet}
              sizes={sizes}
            />
          </>
        ))}

        {/* Modern formats (default image) */}
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

        {/* Fallback img element */}
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
          {...(fetchPriority && { fetchpriority: fetchPriority })}
        />
      </picture>

      {/* Error state */}
      {hasError() && (
        <div
          style={{
            position: 'absolute' as const,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#666',
            fontSize: '14px',
          }}
        >
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

// Helper to render BlurHash
function renderBlurHash(
  blurHash: string,
  width?: number,
  height?: number
): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // Try to use blurhash library if available
    const { decode } = require('blurhash');

    const pixels = decode(blurHash, width || 32, height || 32);
    const canvas = document.createElement('canvas');
    canvas.width = width || 32;
    canvas.height = height || 32;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const imageData = ctx.createImageData(width || 32, height || 32);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
  } catch {
    // BlurHash not available
    return null;
  }
}

// Default export
export default Image;
