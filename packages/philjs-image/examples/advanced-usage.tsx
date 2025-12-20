/**
 * PhilJS Image - Advanced Usage Examples
 */

import { Image } from 'philjs-image';
import type { ArtDirectionSource } from 'philjs-image';

/**
 * Example 1: Art Direction - Different images for breakpoints
 */
export function ArtDirectionImage() {
  const artDirection: ArtDirectionSource[] = [
    {
      media: '(max-width: 640px)',
      src: '/images/hero-mobile.jpg',
      width: 640,
      height: 800,
    },
    {
      media: '(max-width: 1024px)',
      src: '/images/hero-tablet.jpg',
      width: 1024,
      height: 768,
    },
    {
      media: '(min-width: 1025px)',
      src: '/images/hero-desktop.jpg',
      width: 1920,
      height: 1080,
    },
  ];

  return (
    <Image
      src="/images/hero-desktop.jpg"
      alt="Responsive hero with art direction"
      width={1920}
      height={1080}
      artDirection={artDirection}
      formats={['avif', 'webp', 'jpeg']}
      priority={true}
    />
  );
}

/**
 * Example 2: BlurHash placeholder
 */
export function BlurHashImage() {
  // BlurHash generated at build time
  const blurHash = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

  return (
    <Image
      src="/images/photo.jpg"
      alt="Photo with BlurHash"
      width={800}
      height={600}
      blurHash={blurHash}
      loadingAnimation="fade"
    />
  );
}

/**
 * Example 3: Custom base64 blur placeholder
 */
export function CustomBlurPlaceholder() {
  // LQIP (Low Quality Image Placeholder) generated at build time
  const blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';

  return (
    <Image
      src="/images/landscape.jpg"
      alt="Landscape with LQIP"
      width={1200}
      height={800}
      blurDataURL={blurDataURL}
      loadingAnimation="blur"
      animationDuration={600}
    />
  );
}

/**
 * Example 4: Product image with aspect ratio
 */
export function ProductCard() {
  return (
    <div style={{ maxWidth: '400px' }}>
      <Image
        src="/images/product.jpg"
        alt="Product"
        width={400}
        aspectRatio={1} // Square
        maintainAspectRatio={true}
        fit="cover"
        formats={['avif', 'webp', 'jpeg']}
        quality={90}
        loading="lazy"
        placeholder="color"
        placeholderColor="#f5f5f5"
      />
      <h3>Product Name</h3>
      <p>$99.99</p>
    </div>
  );
}

/**
 * Example 5: Hero banner with priority and fetchPriority
 */
export function HeroBanner() {
  return (
    <section style={{ position: 'relative', height: '600px' }}>
      <Image
        src="/images/hero-banner.jpg"
        alt="Hero banner"
        width={1920}
        height={1080}
        priority={true}
        fetchPriority="high"
        formats={['avif', 'webp', 'jpeg']}
        quality={90}
        fit="cover"
        style={{ width: '100%', height: '100%' }}
      />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <h1>Welcome to our site</h1>
      </div>
    </section>
  );
}

/**
 * Example 6: Responsive image grid
 */
export function ResponsiveGrid() {
  const images = Array.from({ length: 12 }, (_, i) => ({
    src: `/images/grid-${i + 1}.jpg`,
    alt: `Grid image ${i + 1}`,
  }));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
      }}
    >
      {images.map((image, index) => (
        <Image
          key={index}
          src={image.src}
          alt={image.alt}
          width={600}
          aspectRatio="16:9"
          maintainAspectRatio={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          formats={['avif', 'webp', 'jpeg']}
          loading="lazy"
          placeholder="blur"
        />
      ))}
    </div>
  );
}

/**
 * Example 7: Full-bleed background image
 */
export function BackgroundImage() {
  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <Image
        src="/images/background.jpg"
        alt="Background"
        width={1920}
        height={1080}
        priority={true}
        fit="cover"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
        <h1>Content over background</h1>
      </div>
    </div>
  );
}

/**
 * Example 8: Avatar with circular crop
 */
export function Avatar() {
  return (
    <Image
      src="/images/avatar.jpg"
      alt="User avatar"
      width={120}
      height={120}
      aspectRatio={1}
      fit="cover"
      className="avatar"
      style={{
        borderRadius: '50%',
        border: '3px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      placeholder="color"
      placeholderColor="#e0e0e0"
    />
  );
}

/**
 * Example 9: Carousel with preloading
 */
export function ImageCarousel() {
  const slides = [
    { src: '/images/slide-1.jpg', alt: 'Slide 1' },
    { src: '/images/slide-2.jpg', alt: 'Slide 2' },
    { src: '/images/slide-3.jpg', alt: 'Slide 3' },
  ];

  return (
    <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
      {slides.map((slide, index) => (
        <Image
          key={index}
          src={slide.src}
          alt={slide.alt}
          width={1200}
          height={600}
          priority={index === 0} // Only preload first slide
          formats={['avif', 'webp', 'jpeg']}
          quality={90}
          style={{
            display: index === 0 ? 'block' : 'none',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Example 10: Image comparison slider
 */
export function ImageComparison() {
  return (
    <div style={{ position: 'relative', width: '800px', height: '600px' }}>
      <Image
        src="/images/before.jpg"
        alt="Before"
        width={800}
        height={600}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
        <Image
          src="/images/after.jpg"
          alt="After"
          width={800}
          height={600}
        />
      </div>
    </div>
  );
}

/**
 * Example 11: Lazy loading with intersection observer
 */
export function LazyLoadedGallery() {
  const images = Array.from({ length: 20 }, (_, i) => ({
    src: `/images/lazy-${i + 1}.jpg`,
    alt: `Lazy loaded image ${i + 1}`,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {images.map((image, index) => (
        <Image
          key={index}
          src={image.src}
          alt={image.alt}
          width={1200}
          height={800}
          loading="lazy"
          placeholder="blur"
          formats={['avif', 'webp', 'jpeg']}
          quality={85}
          loadingAnimation="fade"
        />
      ))}
    </div>
  );
}

/**
 * Example 12: Complex responsive image with multiple breakpoints
 */
export function ComplexResponsiveImage() {
  const artDirection: ArtDirectionSource[] = [
    {
      media: '(max-width: 480px)',
      src: '/images/product-mobile.jpg',
      width: 480,
      height: 640,
    },
    {
      media: '(max-width: 768px)',
      src: '/images/product-tablet-portrait.jpg',
      width: 768,
      height: 1024,
    },
    {
      media: '(max-width: 1024px)',
      src: '/images/product-tablet-landscape.jpg',
      width: 1024,
      height: 768,
    },
    {
      media: '(max-width: 1440px)',
      src: '/images/product-desktop.jpg',
      width: 1440,
      height: 900,
    },
    {
      media: '(min-width: 1441px)',
      src: '/images/product-4k.jpg',
      width: 3840,
      height: 2160,
    },
  ];

  return (
    <Image
      src="/images/product-desktop.jpg"
      alt="Product showcase"
      width={1440}
      height={900}
      artDirection={artDirection}
      sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1440px) 100vw, 1440px"
      formats={['avif', 'webp', 'jpeg']}
      quality={90}
      priority={true}
      fetchPriority="high"
    />
  );
}
