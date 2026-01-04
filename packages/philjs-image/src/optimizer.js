/**
 * PhilJS Image Optimizer
 *
 * Server-side image optimization using Sharp
 */
// Sharp is optional - only used in build/server environments
let sharp;
const sharpPromise = import('sharp').then(m => { sharp = m.default; }).catch(() => {
    // Sharp not available - that's OK for browser builds
});
async function ensureSharp() {
    await sharpPromise;
    if (!sharp) {
        throw new Error('Sharp is not available. Install it with: npm install sharp');
    }
    return sharp;
}
const defaultConfig = {
    formats: ['webp', 'avif', 'jpeg'],
    quality: 85,
    qualityByFormat: {
        jpeg: 85,
        webp: 85,
        avif: 75,
        png: 90,
    },
    breakpoints: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    sharpOptions: {
        progressive: true,
        optimizeScans: true,
        effort: 6,
    },
};
let config = { ...defaultConfig };
/**
 * Configure image optimization
 */
export function configure(options) {
    config = { ...defaultConfig, ...options };
}
/**
 * Get current configuration
 */
export function getConfig() {
    return { ...config };
}
/**
 * Optimize an image
 */
export async function optimizeImage(input, options) {
    const sharpModule = await ensureSharp();
    const { width, height, format = 'webp', quality, fit = 'cover', position = 'center', blur } = options;
    let pipeline = sharpModule(input);
    // Resize
    if (width || height) {
        pipeline = pipeline.resize(width, height, {
            fit,
            position,
            withoutEnlargement: true,
        });
    }
    // Blur
    if (blur) {
        pipeline = pipeline.blur(blur);
    }
    // Convert format
    const formatQuality = quality || config.qualityByFormat?.[format] || config.quality || 85;
    switch (format) {
        case 'webp':
            pipeline = pipeline.webp({
                quality: formatQuality,
                effort: config.sharpOptions?.effort,
            });
            break;
        case 'avif':
            pipeline = pipeline.avif({
                quality: formatQuality,
                effort: config.sharpOptions?.effort,
            });
            break;
        case 'jpeg':
            pipeline = pipeline.jpeg({
                quality: formatQuality,
                progressive: config.sharpOptions?.progressive,
                optimizeScans: config.sharpOptions?.optimizeScans,
            });
            break;
        case 'png':
            pipeline = pipeline.png({
                quality: formatQuality,
                compressionLevel: 9,
            });
            break;
        case 'gif':
            // GIF optimization is limited
            break;
    }
    return pipeline.toBuffer();
}
/**
 * Get image metadata
 */
export async function getMetadata(input) {
    const sharpModule = await ensureSharp();
    const image = sharpModule(input);
    const metadata = await image.metadata();
    const stats = await image.stats();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const dominantColor = stats.dominant ? `rgb(${stats.dominant.r}, ${stats.dominant.g}, ${stats.dominant.b})` : undefined;
    return {
        width,
        height,
        format: metadata.format || 'unknown',
        size: metadata.size || 0,
        aspectRatio: width / height,
        ...(dominantColor !== undefined && { dominantColor }),
    };
}
/**
 * Generate blur placeholder (LQIP - Low Quality Image Placeholder)
 */
export async function generateBlurPlaceholder(input, options = {}) {
    await ensureSharp();
    const { type = 'base64', width = 10, height = 10, quality = 50, blurAmount = 10, } = options;
    switch (type) {
        case 'base64':
            return generateBase64Placeholder(input, width, height, quality, blurAmount);
        case 'blurhash':
            return generateBlurHash(input);
        case 'dominant-color':
            return extractDominantColor(input);
        case 'lqip':
            return generateLQIP(input, width, height);
        default:
            return generateBase64Placeholder(input, width, height, quality, blurAmount);
    }
}
/**
 * Generate base64 inline placeholder
 */
async function generateBase64Placeholder(input, width, height, quality, blurAmount) {
    const sharpModule = await ensureSharp();
    const buffer = await sharpModule(input)
        .resize(width, height, { fit: 'inside' })
        .blur(blurAmount)
        .jpeg({ quality })
        .toBuffer();
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}
/**
 * Generate Low Quality Image Placeholder
 * Higher resolution than blur placeholder but still small
 */
async function generateLQIP(input, width, height) {
    const sharpModule = await ensureSharp();
    const buffer = await sharpModule(input)
        .resize(width * 2, height * 2, { fit: 'inside' })
        .jpeg({ quality: 20 })
        .toBuffer();
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}
/**
 * Generate BlurHash
 * Compact representation of an image for placeholder
 */
async function generateBlurHash(input) {
    const sharpModule = await ensureSharp();
    try {
        // Try to use blurhash library if available
        const { encode } = await import('blurhash');
        const image = sharpModule(input);
        const { data, info } = await image
            .resize(32, 32, { fit: 'inside' })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        const blurhash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
        return blurhash;
    }
    catch {
        // Fallback to dominant color if blurhash not available
        console.warn('BlurHash library not found, falling back to dominant color');
        return extractDominantColor(input);
    }
}
/**
 * Generate responsive image set
 */
export async function generateResponsiveSet(input, options = {}) {
    await ensureSharp();
    const formats = options.formats || config.formats || ['webp', 'jpeg'];
    const breakpoints = options.breakpoints || config.breakpoints || [640, 750, 828, 1080, 1200, 1920];
    const quality = options.quality || config.quality || 85;
    const metadata = await getMetadata(input);
    const relevantBreakpoints = breakpoints.filter(bp => bp <= metadata.width);
    const results = [];
    for (const format of formats) {
        for (const width of relevantBreakpoints) {
            const buffer = await optimizeImage(input, {
                width,
                format,
                quality,
            });
            results.push({ buffer, width, format });
        }
    }
    return results;
}
/**
 * Extract dominant color
 */
export async function extractDominantColor(input) {
    const sharpModule = await ensureSharp();
    const stats = await sharpModule(input).stats();
    if (stats.dominant) {
        const { r, g, b } = stats.dominant;
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return '#f0f0f0';
}
/**
 * Check if Sharp is available
 */
export function isSharpAvailable() {
    return !!sharp;
}
//# sourceMappingURL=optimizer.js.map