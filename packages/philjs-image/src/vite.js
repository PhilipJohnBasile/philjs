/**
 * PhilJS Image - Vite Plugin
 *
 * Optimizes images during build and serves them in development
 */
import { createHash } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { optimizeImage, generateBlurPlaceholder, isSharpAvailable } from './optimizer';
export default function philjsImage(options = {}) {
    const config = {
        formats: ['webp', 'avif', 'jpeg'],
        quality: 85,
        outputDir: 'public/_images',
        cacheDir: 'node_modules/.cache/philjs-image',
        ...options,
    };
    let isDev = false;
    let root = '';
    return {
        name: 'philjs-image',
        configResolved(resolvedConfig) {
            isDev = resolvedConfig.command === 'serve';
            root = resolvedConfig.root;
        },
        configureServer(server) {
            // Handle image optimization requests in dev
            server.middlewares.use(async (req, res, next) => {
                if (!req.url?.startsWith('/_image')) {
                    return next();
                }
                if (!isSharpAvailable()) {
                    console.warn('[PhilJS Image] Sharp is not available. Images will not be optimized.');
                    return next();
                }
                try {
                    const url = new URL(req.url, `http://${req.headers.host}`);
                    const imagePath = url.searchParams.get('url');
                    const width = url.searchParams.get('w');
                    const height = url.searchParams.get('h');
                    const quality = url.searchParams.get('q');
                    const format = url.searchParams.get('f');
                    if (!imagePath) {
                        res.statusCode = 400;
                        res.end('Missing url parameter');
                        return;
                    }
                    // Read source image
                    const fullPath = join(root, 'public', imagePath);
                    if (!existsSync(fullPath)) {
                        res.statusCode = 404;
                        res.end('Image not found');
                        return;
                    }
                    const buffer = await readFile(fullPath);
                    // Optimize
                    const optimized = await optimizeImage(buffer, {
                        width: width ? parseInt(width) : undefined,
                        height: height ? parseInt(height) : undefined,
                        quality: quality ? parseInt(quality) : config.quality,
                        format: format || 'webp',
                    });
                    // Set cache headers
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    res.setHeader('Content-Type', `image/${format || 'webp'}`);
                    res.end(optimized);
                }
                catch (error) {
                    console.error('[PhilJS Image] Error optimizing image:', error);
                    res.statusCode = 500;
                    res.end('Error optimizing image');
                }
            });
        },
        async transform(code, id) {
            // Transform import of images to optimized versions
            if (/\.(jpe?g|png|webp|avif|gif)(\?.*)?$/.test(id)) {
                if (!isSharpAvailable()) {
                    return null; // Let Vite handle it
                }
                // Generate optimized versions during build
                if (!isDev) {
                    try {
                        const buffer = await readFile(id);
                        // Generate cache key
                        const hash = createHash('md5').update(buffer).digest('hex').slice(0, 8);
                        const outputDir = join(root, config.outputDir || 'public/_images');
                        await mkdir(outputDir, { recursive: true });
                        // Generate blur placeholder
                        const blurDataURL = await generateBlurPlaceholder(buffer);
                        // Optimize in different formats
                        const formats = config.formats || ['webp', 'jpeg'];
                        const optimized = {};
                        for (const format of formats) {
                            const optimizedBuffer = await optimizeImage(buffer, {
                                format: format,
                                quality: config.quality,
                            });
                            const filename = `${hash}.${format}`;
                            const outputPath = join(outputDir, filename);
                            await writeFile(outputPath, optimizedBuffer);
                            optimized[format] = `/_images/${filename}`;
                        }
                        // Return metadata
                        return {
                            code: `export default ${JSON.stringify({
                                src: optimized[formats[0]],
                                sources: optimized,
                                blurDataURL,
                            })}`,
                            map: null,
                        };
                    }
                    catch (error) {
                        console.error('[PhilJS Image] Error processing image:', error);
                    }
                }
            }
            return null;
        },
    };
}
//# sourceMappingURL=vite.js.map