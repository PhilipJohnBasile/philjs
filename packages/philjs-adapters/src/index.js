/**
 * PhilJS Adapters
 *
 * Deploy PhilJS applications anywhere:
 * - Vercel (Edge & Serverless)
 * - Netlify (Edge Functions & Serverless)
 * - Cloudflare (Workers & Pages)
 * - AWS (Lambda, Lambda@Edge, Amplify)
 * - Node.js (standalone server)
 * - Static (SSG)
 */
// Vercel
export { vercelAdapter, revalidatePath, revalidateTag, createVercelEdgeConfig } from './vercel';
// Netlify
export { netlifyAdapter, getNetlifyContext, netlifyImageCDN } from './netlify';
// Cloudflare
export { cloudflareAdapter, getCloudflareEnv, getExecutionContext, waitUntil, createKVHelper } from './cloudflare';
// AWS
export { awsAdapter, getAWSContext, getRemainingTimeMs, getRequestId, getS3AssetUrl } from './aws';
// Node.js
export { nodeAdapter, startServer } from './node';
// Static
export { staticAdapter, prerender, getStaticPaths } from './static';
// Auto-detect adapter based on environment
export function autoAdapter(config = {}) {
    // Check for platform-specific environment variables
    if (process.env.VERCEL) {
        const { vercelAdapter } = require('./vercel');
        return vercelAdapter(config);
    }
    if (process.env.NETLIFY) {
        const { netlifyAdapter } = require('./netlify');
        return netlifyAdapter(config);
    }
    if (process.env.CF_PAGES || process.env.CLOUDFLARE_WORKERS) {
        const { cloudflareAdapter } = require('./cloudflare');
        return cloudflareAdapter(config);
    }
    if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV) {
        const { awsAdapter } = require('./aws');
        return awsAdapter(config);
    }
    // Default to Node.js adapter
    const { nodeAdapter } = require('./node');
    return nodeAdapter(config);
}
// Adapter presets
export const presets = {
    /** Vercel with Edge Runtime */
    'vercel-edge': (config = {}) => require('./vercel').vercelAdapter({ ...config, edge: true }),
    /** Vercel with Serverless */
    'vercel-serverless': (config = {}) => require('./vercel').vercelAdapter({ ...config, edge: false }),
    /** Netlify Edge Functions */
    'netlify-edge': (config = {}) => require('./netlify').netlifyAdapter({ ...config, edge: true }),
    /** Netlify Serverless Functions */
    'netlify-functions': (config = {}) => require('./netlify').netlifyAdapter({ ...config, edge: false }),
    /** Cloudflare Pages */
    'cloudflare-pages': (config = {}) => require('./cloudflare').cloudflareAdapter({ ...config, mode: 'pages' }),
    /** Cloudflare Workers */
    'cloudflare-workers': (config = {}) => require('./cloudflare').cloudflareAdapter({ ...config, mode: 'workers' }),
    /** AWS Lambda */
    'aws-lambda': (config = {}) => require('./aws').awsAdapter({ ...config, mode: 'lambda' }),
    /** AWS Lambda@Edge */
    'aws-edge': (config = {}) => require('./aws').awsAdapter({ ...config, mode: 'lambda-edge' }),
    /** AWS Amplify */
    'aws-amplify': (config = {}) => require('./aws').awsAdapter({ ...config, mode: 'amplify' }),
    /** Node.js standalone */
    'node': (config = {}) => require('./node').nodeAdapter(config),
    /** Static site generation */
    'static': (config = {}) => require('./static').staticAdapter(config),
};
// Helper to create adapter from preset
export function createAdapter(preset, config = {}) {
    const factory = presets[preset];
    if (!factory) {
        throw new Error(`Unknown adapter preset: ${preset}`);
    }
    return factory(config);
}
//# sourceMappingURL=index.js.map