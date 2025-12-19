# @philjs/adapters Changelog

## [2.0.0] - 2025-12-18

### Added

#### Complete Adapter Suite
- **Vercel Adapter** - Full support for Edge Runtime and Serverless Functions
  - Edge Functions with 0ms cold starts
  - Incremental Static Regeneration (ISR)
  - Image Optimization integration
  - Cron job support
  - Multi-region deployment
  - Response streaming

- **Netlify Adapter** - Edge Functions and Netlify Functions support
  - Deno-powered Edge Functions
  - On-Demand Builders for ISR
  - Forms integration
  - Split testing support
  - Custom headers and redirects
  - Background functions

- **Cloudflare Adapter** - Workers and Pages with full platform integration
  - V8 isolate architecture (0ms cold starts)
  - KV namespace bindings
  - D1 database integration
  - R2 object storage
  - Durable Objects support
  - Global edge network (275+ cities)

- **AWS Adapter** - Lambda, Lambda@Edge, and Amplify support
  - Response streaming
  - ARM64 (Graviton2) support
  - API Gateway integration
  - CloudFront distribution
  - S3 asset management
  - SAM/CloudFormation templates

- **Node.js Adapter** - Standalone server deployment
  - HTTP/HTTPS support
  - Built-in compression
  - Static file serving
  - Clustering support
  - Reverse proxy compatibility
  - Express/Fastify integration

- **Static Adapter** - Static site generation
  - Automatic sitemap.xml generation
  - robots.txt generation
  - Clean URLs support
  - Route pre-rendering
  - SPA fallback support

#### Developer Experience
- **Auto-Detection** - Automatically detect deployment platform from environment
- **Presets** - 11 pre-configured adapter presets for common scenarios
- **Type Safety** - Full TypeScript support with detailed types
- **Platform Utilities** - Helper functions for platform-specific features
  - Vercel: `revalidatePath()`, `revalidateTag()`
  - Netlify: `getNetlifyContext()`, `netlifyImageCDN()`
  - Cloudflare: `getCloudflareEnv()`, `createKVHelper()`, `waitUntil()`
  - AWS: `getAWSContext()`, `getRemainingTimeMs()`, `getS3AssetUrl()`

#### Configuration
- Flexible adapter configuration for all platforms
- Environment variable management
- Custom build outputs
- Static asset handling
- Source map support

#### Documentation
- Comprehensive deployment guides for each platform
- Complete API reference
- Usage examples
- Best practices
- Troubleshooting guides

### Technical Details

#### Architecture
- Unified adapter interface for all platforms
- Platform-specific code generation
- Optimized build outputs
- Zero-config defaults with full customization

#### Performance
- Zero overhead adapter abstraction
- Platform-optimized builds
- Edge-first architecture where available
- Streaming response support

#### Compatibility
- Node.js 18+ required
- Works with Vite 6+
- Compatible with all PhilJS features
- Platform SDKs as optional peer dependencies

### Breaking Changes

This is a major version release with significant changes:

- Renamed package from `philjs-adapters` to `@philjs/adapters` (namespace)
- Updated adapter API to use unified interface
- Changed configuration format for consistency across adapters
- Removed legacy adapter formats

### Migration Guide

#### From v1.x to v2.0

```typescript
// v1.x (Old)
import { createVercelAdapter } from 'philjs-adapters';

const adapter = createVercelAdapter({
  useEdge: true
});

// v2.0 (New)
import { vercelAdapter } from 'philjs-adapters/vercel';

const adapter = vercelAdapter({
  edge: true
});
```

#### Import Paths

```typescript
// v1.x (Old)
import * as adapters from 'philjs-adapters';

// v2.0 (New)
import { vercelAdapter } from 'philjs-adapters/vercel';
import { netlifyAdapter } from 'philjs-adapters/netlify';
import { cloudflareAdapter } from 'philjs-adapters/cloudflare';
```

### Known Issues

- Lambda@Edge has size limitations (1MB compressed)
- Cloudflare Workers have CPU time limits
- Some platforms require additional configuration for WebSocket support

### Contributors

- PhilJS Team

---

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Basic Vercel adapter
- Basic Netlify adapter
- Static site generation

---

For full documentation, visit: https://philjs.dev/docs/deployment/adapters
