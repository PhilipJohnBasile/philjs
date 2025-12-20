/**
 * PhilJS Image - Basic Usage Examples
 */

import { Image } from 'philjs-image';

/**
 * Example 1: Basic image with optimization
 */
export function BasicImage() {
  return (
    <Image
      src="/images/hero.jpg"
      alt="Hero image"
      width={1200}
      height={600}
    />
  );
}

/**
 * Example 2: Image with modern formats
 */
export function ModernFormatsImage() {
  return (
    <Image
      src="/images/product.jpg"
      alt="Product image"
      width={800}
      height={600}
      formats={['avif', 'webp', 'jpeg']}
      quality={90}
    />
  );
}

/**
 * Example 3: Lazy loading with blur placeholder
 */
export function LazyLoadedImage() {
  return (
    <Image
      src="/images/gallery-1.jpg"
      alt="Gallery image"
      width={600}
      height={400}
      loading="lazy"
      placeholder="blur"
      loadingAnimation="fade"
    />
  );
}

/**
 * Example 4: Priority image (LCP optimization)
 */
export function PriorityImage() {
  return (
    <Image
      src="/images/hero-banner.jpg"
      alt="Hero banner"
      width={1920}
      height={1080}
      priority={true}
      fetchPriority="high"
      formats={['avif', 'webp', 'jpeg']}
    />
  );
}

/**
 * Example 5: Responsive image with sizes
 */
export function ResponsiveImage() {
  return (
    <Image
      src="/images/responsive.jpg"
      alt="Responsive image"
      width={1200}
      height={800}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      formats={['avif', 'webp', 'jpeg']}
    />
  );
}

/**
 * Example 6: Image with aspect ratio locking
 */
export function AspectRatioImage() {
  return (
    <Image
      src="/images/product-card.jpg"
      alt="Product card"
      width={400}
      aspectRatio="16:9"
      maintainAspectRatio={true}
      fit="cover"
    />
  );
}

/**
 * Example 7: Image with custom placeholder color
 */
export function ColorPlaceholderImage() {
  return (
    <Image
      src="/images/avatar.jpg"
      alt="User avatar"
      width={200}
      height={200}
      placeholder="color"
      placeholderColor="#e0e0e0"
      loadingAnimation="scale"
    />
  );
}

/**
 * Example 8: Unoptimized image (for external URLs)
 */
export function UnoptimizedImage() {
  return (
    <Image
      src="https://example.com/external-image.jpg"
      alt="External image"
      width={800}
      height={600}
      unoptimized={true}
    />
  );
}

/**
 * Example 9: Image with different fit modes
 */
export function FitModeExamples() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      <div>
        <h3>Cover</h3>
        <Image
          src="/images/landscape.jpg"
          alt="Cover fit"
          width={300}
          height={300}
          fit="cover"
        />
      </div>
      <div>
        <h3>Contain</h3>
        <Image
          src="/images/landscape.jpg"
          alt="Contain fit"
          width={300}
          height={300}
          fit="contain"
        />
      </div>
      <div>
        <h3>Fill</h3>
        <Image
          src="/images/landscape.jpg"
          alt="Fill fit"
          width={300}
          height={300}
          fit="fill"
        />
      </div>
    </div>
  );
}

/**
 * Example 10: Image with loading animations
 */
export function LoadingAnimationExamples() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      <div>
        <h3>Fade</h3>
        <Image
          src="/images/fade.jpg"
          alt="Fade animation"
          width={400}
          height={300}
          loadingAnimation="fade"
          animationDuration={500}
        />
      </div>
      <div>
        <h3>Blur</h3>
        <Image
          src="/images/blur.jpg"
          alt="Blur animation"
          width={400}
          height={300}
          loadingAnimation="blur"
          animationDuration={500}
        />
      </div>
      <div>
        <h3>Scale</h3>
        <Image
          src="/images/scale.jpg"
          alt="Scale animation"
          width={400}
          height={300}
          loadingAnimation="scale"
          animationDuration={500}
        />
      </div>
    </div>
  );
}

/**
 * Example 11: Image with event handlers
 */
export function ImageWithEvents() {
  const handleLoad = () => {
    console.log('Image loaded successfully');
  };

  const handleError = (error: Error) => {
    console.error('Failed to load image:', error);
  };

  return (
    <Image
      src="/images/event-image.jpg"
      alt="Image with events"
      width={800}
      height={600}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

/**
 * Example 12: Gallery of images
 */
export function ImageGallery() {
  const images = [
    { src: '/images/gallery-1.jpg', alt: 'Gallery 1' },
    { src: '/images/gallery-2.jpg', alt: 'Gallery 2' },
    { src: '/images/gallery-3.jpg', alt: 'Gallery 3' },
    { src: '/images/gallery-4.jpg', alt: 'Gallery 4' },
    { src: '/images/gallery-5.jpg', alt: 'Gallery 5' },
    { src: '/images/gallery-6.jpg', alt: 'Gallery 6' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {images.map((image, index) => (
        <Image
          key={index}
          src={image.src}
          alt={image.alt}
          width={400}
          height={300}
          loading="lazy"
          placeholder="blur"
          formats={['avif', 'webp', 'jpeg']}
          quality={85}
        />
      ))}
    </div>
  );
}
