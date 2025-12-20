/**
 * PhilJS Image - Image Service Usage Examples
 */

import { configureImageService, getImageService } from 'philjs-image';
import { Image } from 'philjs-image';

/**
 * Example 1: Configure Cloudinary service
 */
export function setupCloudinary() {
  configureImageService('cloudinary', {
    cloudName: 'your-cloud-name',
    baseUrl: 'https://res.cloudinary.com/your-cloud-name/image/upload',
  });
}

/**
 * Example 2: Configure imgix service
 */
export function setupImgix() {
  configureImageService('imgix', {
    domain: 'your-domain.imgix.net',
    secureUrlToken: 'your-token', // Optional
  });
}

/**
 * Example 3: Configure Sharp (local) service
 */
export function setupSharp() {
  configureImageService('sharp');
}

/**
 * Example 4: Using Cloudinary service
 */
export function CloudinaryImage() {
  // Configure Cloudinary first
  setupCloudinary();

  return (
    <Image
      src="/sample.jpg"
      alt="Cloudinary image"
      width={800}
      height={600}
      formats={['avif', 'webp', 'jpeg']}
      quality={85}
      service="cloudinary"
    />
  );
}

/**
 * Example 5: Using imgix service
 */
export function ImgixImage() {
  // Configure imgix first
  setupImgix();

  return (
    <Image
      src="/sample.jpg"
      alt="imgix image"
      width={800}
      height={600}
      formats={['avif', 'webp', 'jpeg']}
      quality={85}
      service="imgix"
    />
  );
}

/**
 * Example 6: Direct service usage
 */
export function DirectServiceUsage() {
  // Get the active service
  const service = getImageService();

  // Generate URL manually
  const url = service.getUrl('/image.jpg', {
    width: 800,
    height: 600,
    format: 'webp',
    quality: 85,
  });

  return <img src={url} alt="Direct service usage" />;
}

/**
 * Example 7: Multiple images with Cloudinary transformations
 */
export function CloudinaryGallery() {
  setupCloudinary();

  const images = [
    { src: '/gallery/1.jpg', alt: 'Image 1' },
    { src: '/gallery/2.jpg', alt: 'Image 2' },
    { src: '/gallery/3.jpg', alt: 'Image 3' },
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
          formats={['avif', 'webp', 'jpeg']}
          quality={85}
          service="cloudinary"
        />
      ))}
    </div>
  );
}

/**
 * Example 8: imgix with auto format
 */
export function ImgixAutoFormat() {
  setupImgix();

  return (
    <Image
      src="/hero.jpg"
      alt="Hero with auto format"
      width={1920}
      height={1080}
      formats={['avif', 'webp', 'jpeg']}
      priority={true}
      service="imgix"
    />
  );
}

/**
 * Example 9: Cloudinary with blur effect
 */
export function CloudinaryBlur() {
  setupCloudinary();

  return (
    <Image
      src="/background.jpg"
      alt="Blurred background"
      width={1200}
      height={800}
      service="cloudinary"
      style={{ filter: 'blur(10px)' }}
    />
  );
}

/**
 * Example 10: Custom service configuration
 */
export function CustomServiceConfig() {
  // Create a custom service configuration
  configureImageService('cloudinary', {
    cloudName: 'demo',
    // Custom transformations will be applied
  });

  return (
    <div>
      <h2>Cloudinary Demo Images</h2>
      <Image
        src="/sample.jpg"
        alt="Demo image"
        width={600}
        height={400}
        formats={['avif', 'webp', 'jpeg']}
        quality={90}
        service="cloudinary"
      />
    </div>
  );
}

/**
 * Example 11: Server-side image transformation
 */
export async function serverSideTransform() {
  const { optimizeImage, getMetadata } = await import('philjs-image');

  // Read image file
  const imageBuffer = await readFileBuffer('/path/to/image.jpg');

  // Get metadata
  const metadata = await getMetadata(imageBuffer);
  console.log('Image metadata:', metadata);

  // Optimize image
  const optimized = await optimizeImage(imageBuffer, {
    width: 800,
    height: 600,
    format: 'webp',
    quality: 85,
  });

  // Save or serve the optimized image
  return optimized;
}

/**
 * Example 12: Build-time image processing
 */
export async function buildTimeProcessing() {
  const {
    generateBlurPlaceholder,
    extractDominantColor,
    generateResponsiveSet,
  } = await import('philjs-image');

  const imageBuffer = await readFileBuffer('/path/to/image.jpg');

  // Generate blur placeholder
  const blurDataURL = await generateBlurPlaceholder(imageBuffer, {
    type: 'base64',
    width: 10,
    height: 10,
  });

  // Extract dominant color
  const dominantColor = await extractDominantColor(imageBuffer);

  // Generate responsive set
  const responsiveSet = await generateResponsiveSet(imageBuffer, {
    formats: ['avif', 'webp', 'jpeg'],
    breakpoints: [640, 750, 828, 1080, 1200, 1920],
    quality: 85,
  });

  return {
    blurDataURL,
    dominantColor,
    responsiveSet,
  };
}

/**
 * Example 13: BlurHash generation at build time
 */
export async function generateBlurHashAtBuild() {
  const { generateBlurPlaceholder } = await import('philjs-image');

  const imageBuffer = await readFileBuffer('/path/to/image.jpg');

  // Generate BlurHash
  const blurHash = await generateBlurPlaceholder(imageBuffer, {
    type: 'blurhash',
  });

  // Use in component
  return (
    <Image
      src="/image.jpg"
      alt="Image with BlurHash"
      width={800}
      height={600}
      blurHash={blurHash}
    />
  );
}

/**
 * Example 14: LQIP (Low Quality Image Placeholder)
 */
export async function generateLQIP() {
  const { generateBlurPlaceholder } = await import('philjs-image');

  const imageBuffer = await readFileBuffer('/path/to/image.jpg');

  // Generate LQIP
  const lqip = await generateBlurPlaceholder(imageBuffer, {
    type: 'lqip',
    width: 20,
    height: 20,
  });

  return (
    <Image
      src="/image.jpg"
      alt="Image with LQIP"
      width={800}
      height={600}
      blurDataURL={lqip}
    />
  );
}

/**
 * Example 15: Dominant color placeholder
 */
export async function dominantColorPlaceholder() {
  const { generateBlurPlaceholder } = await import('philjs-image');

  const imageBuffer = await readFileBuffer('/path/to/image.jpg');

  // Extract dominant color
  const dominantColor = await generateBlurPlaceholder(imageBuffer, {
    type: 'dominant-color',
  });

  return (
    <Image
      src="/image.jpg"
      alt="Image with dominant color"
      width={800}
      height={600}
      placeholder="color"
      placeholderColor={dominantColor}
    />
  );
}

// Helper function (would be implemented with fs in Node.js)
async function readFileBuffer(path: string): Promise<Buffer> {
  // In a real implementation, this would read the file
  // For example: return fs.promises.readFile(path);
  throw new Error('Not implemented - use fs.promises.readFile in Node.js');
}
