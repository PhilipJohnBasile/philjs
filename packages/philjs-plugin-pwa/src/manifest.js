/**
 * Web App Manifest generation and utilities
 */
/**
 * Generate web app manifest JSON
 */
export function generateManifest(config) {
    return {
        name: config.name || 'PhilJS App',
        short_name: config.short_name || config.name || 'PhilJS',
        description: config.description || 'A PhilJS Progressive Web App',
        start_url: config.start_url || '/',
        display: config.display || 'standalone',
        orientation: config.orientation || 'any',
        theme_color: config.theme_color || '#667eea',
        background_color: config.background_color || '#ffffff',
        scope: config.scope || '/',
        icons: config.icons || [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
        ...(config.screenshots !== undefined && { screenshots: config.screenshots }),
        ...(config.categories !== undefined && { categories: config.categories }),
        ...(config.share_target !== undefined && { share_target: config.share_target }),
        ...(config.shortcuts !== undefined && { shortcuts: config.shortcuts }),
        ...(config.prefer_related_applications !== undefined && { prefer_related_applications: config.prefer_related_applications }),
        ...(config.related_applications !== undefined && { related_applications: config.related_applications }),
    };
}
/**
 * Create manifest JSON string
 */
export function createManifestJSON(config) {
    const manifest = generateManifest(config);
    return JSON.stringify(manifest, null, 2);
}
/**
 * Inject manifest link into HTML
 */
export function injectManifestLink(manifestPath = '/manifest.json') {
    return `<link rel="manifest" href="${manifestPath}">`;
}
/**
 * Generate meta tags for PWA
 */
export function generatePWAMetaTags(config) {
    const manifest = generateManifest(config);
    return `
<!-- PWA Meta Tags -->
<meta name="application-name" content="${manifest.name}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${manifest.short_name}">
<meta name="description" content="${manifest.description}">
<meta name="format-detection" content="telephone=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="${manifest.theme_color}">
${manifest.icons?.map(icon => `<link rel="apple-touch-icon" sizes="${icon.sizes}" href="${icon.src}">`).join('\n')}
`.trim();
}
//# sourceMappingURL=manifest.js.map