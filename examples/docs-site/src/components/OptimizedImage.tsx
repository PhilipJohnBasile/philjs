import { signal, effect } from 'philjs-core';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  /** Placeholder image (base64 or low-res URL) */
  placeholder?: string;
  /** Enable lazy loading (default: true) */
  lazy?: boolean;
  /** Image quality (1-100, default: 85) */
  quality?: number;
  /** Object-fit CSS property */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Additional CSS class */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Loading priority */
  priority?: 'high' | 'low' | 'auto';
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes,
  placeholder,
  lazy = true,
  quality = 85,
  objectFit = 'cover',
  className = '',
  onClick,
  priority = 'auto',
}: OptimizedImageProps) {
  const isLoaded = signal(false);
  const hasError = signal(false);
  const imgRef = signal<HTMLImageElement | null>(null);

  // Intersection Observer for lazy loading
  effect(() => {
    const img = imgRef();
    if (!img || !lazy) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start loading the image
            const imgElement = entry.target as HTMLImageElement;
            const dataSrc = imgElement.getAttribute('data-src');
            if (dataSrc) {
              imgElement.src = dataSrc;
              imgElement.removeAttribute('data-src');
            }
            observer.unobserve(imgElement);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  });

  const handleLoad = () => {
    isLoaded.set(true);
  };

  const handleError = () => {
    hasError.set(true);
    console.error(`Failed to load image: ${src}`);
  };

  const imgStyle: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded() ? 1 : 0,
    cursor: onClick ? 'pointer' : 'default',
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    overflow: 'hidden',
    background: 'var(--color-bg-alt)',
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit,
    filter: 'blur(10px)',
    transform: 'scale(1.1)', // Prevent blur edges
    opacity: isLoaded() ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out',
  };

  if (hasError()) {
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            style={{ marginBottom: '0.5rem', opacity: 0.5 }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <polyline points="21 15 16 10 5 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: '0.875rem' }}>Failed to load image</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className}>
      {/* Placeholder blur-up effect */}
      {placeholder && !isLoaded() && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          style={placeholderStyle}
        />
      )}

      {/* Main image */}
      <img
        ref={(el) => imgRef.set(el)}
        src={lazy ? undefined : src}
        data-src={lazy ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={lazy ? 'lazy' : priority === 'high' ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        style={imgStyle}
      />

      {/* Loading spinner */}
      {!isLoaded() && !hasError() && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--color-border)',
              borderTop: '3px solid var(--color-brand)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Responsive image with automatic srcset generation
 */
export interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'src'> {
  /**
   * Base image path (without size suffix)
   * e.g., "/images/hero" will generate /images/hero-400.jpg, /images/hero-800.jpg, etc.
   */
  baseSrc: string;
  /**
   * Available image widths
   * Default: [400, 800, 1200, 1600, 2000]
   */
  widths?: number[];
  /**
   * Image format (jpg, png, webp, avif)
   * Default: 'jpg'
   */
  format?: 'jpg' | 'png' | 'webp' | 'avif';
}

export function ResponsiveImage({
  baseSrc,
  widths = [400, 800, 1200, 1600, 2000],
  format = 'jpg',
  sizes = '100vw',
  ...props
}: ResponsiveImageProps) {
  // Generate srcset string
  const srcset = widths
    .map((w) => `${baseSrc}-${w}.${format} ${w}w`)
    .join(', ');

  // Use the middle size as the default src
  const defaultSrc = `${baseSrc}-${widths[Math.floor(widths.length / 2)]}.${format}`;

  return (
    <picture>
      {/* Modern formats for browsers that support them */}
      {format !== 'avif' && (
        <source
          type="image/avif"
          srcSet={widths.map((w) => `${baseSrc}-${w}.avif ${w}w`).join(', ')}
          sizes={sizes}
        />
      )}
      {format !== 'webp' && format !== 'avif' && (
        <source
          type="image/webp"
          srcSet={widths.map((w) => `${baseSrc}-${w}.webp ${w}w`).join(', ')}
          sizes={sizes}
        />
      )}

      {/* Fallback */}
      <OptimizedImage
        src={defaultSrc}
        sizes={sizes}
        {...props}
      />
    </picture>
  );
}

/**
 * Image optimization utilities
 */
export const ImageUtils = {
  /**
   * Generate a low-quality placeholder (LQIP) data URL
   * This would typically be done at build time
   */
  generatePlaceholder(width: number = 20, height: number = 20): string {
    // This is a simple gray placeholder
    // In production, you'd generate this from the actual image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#e5e5e5';
      ctx.fillRect(0, 0, width, height);
    }
    return canvas.toDataURL('image/jpeg', 0.1);
  },

  /**
   * Preload critical images
   */
  preloadImage(src: string, priority: 'high' | 'low' = 'high'): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    if (priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    }
    document.head.appendChild(link);
  },

  /**
   * Calculate responsive sizes attribute
   */
  generateSizes(breakpoints: { [key: string]: string }): string {
    return Object.entries(breakpoints)
      .map(([bp, size]) => {
        if (bp === 'default') return size;
        return `(min-width: ${bp}) ${size}`;
      })
      .reverse()
      .join(', ');
  },
};

/**
 * Example usage:
 *
 * ```tsx
 * // Basic optimized image with lazy loading
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 *   placeholder="/images/hero-placeholder.jpg"
 * />
 *
 * // Responsive image with multiple formats
 * <ResponsiveImage
 *   baseSrc="/images/hero"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 *   sizes="(min-width: 1280px) 1200px, 100vw"
 *   format="jpg"
 * />
 *
 * // Preload critical above-the-fold image
 * ImageUtils.preloadImage('/images/hero.jpg', 'high');
 * ```
 */
