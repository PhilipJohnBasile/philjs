# PhilJS Netlify Adapter

Deploy your PhilJS application to Netlify with support for Edge Functions, Serverless Functions, Blob storage, and advanced routing.

## Features

- **Edge Functions**: Deploy to Netlify's global edge network
- **Netlify Functions**: Traditional serverless functions
- **Blob Storage**: Object storage for files and data
- **Form Handling**: Built-in form processing
- **Redirects & Rewrites**: Advanced routing configuration
- **Split Testing**: A/B testing support
- **Image CDN**: Automatic image optimization

## Installation

```bash
npm install philjs-adapters
```

## Basic Usage

### Edge Functions

```typescript
import { netlifyAdapter } from 'philjs-adapters/netlify/adapter';

export default netlifyAdapter({
  edge: true,
  edgeFunctions: {
    functions: [
      { path: '/*', function: 'philjs' }
    ]
  }
});
```

### Netlify Functions

```typescript
import { netlifyAdapter } from 'philjs-adapters/netlify/adapter';

export default netlifyAdapter({
  edge: false,
  functions: {
    nodeVersion: '20',
    includedFiles: ['data/**']
  }
});
```

## Configuration

### Redirects

```typescript
netlifyAdapter({
  redirects: [
    {
      from: '/old-page',
      to: '/new-page',
      status: 301,
      force: true
    },
    {
      from: '/admin/*',
      to: '/login',
      status: 302,
      conditions: {
        role: ['admin']
      }
    }
  ]
});
```

### Rewrites

```typescript
netlifyAdapter({
  rewrites: [
    {
      from: '/api/*',
      to: 'https://api.example.com/:splat',
      status: 200
    }
  ]
});
```

### Headers

```typescript
netlifyAdapter({
  headers: [
    {
      for: '/*',
      values: {
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    },
    {
      for: '/api/*',
      values: {
        'Access-Control-Allow-Origin': '*'
      }
    }
  ]
});
```

### Blob Storage

```typescript
netlifyAdapter({
  blob: {
    deployKey: process.env.NETLIFY_BLOB_TOKEN
  }
});

// Usage in your app
import { getStore } from '@netlify/blobs';

const store = getStore('my-store');
await store.set('key', 'value');
const value = await store.get('key');
```

### Split Testing

```typescript
netlifyAdapter({
  splitTesting: [
    {
      path: '/landing',
      branches: [
        { branch: 'main', weight: 50 },
        { branch: 'variant-a', weight: 50 }
      ]
    }
  ]
});
```

## Deployment

### Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Using Git Integration

1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.netlify/publish`
3. Push to deploy automatically

## Environment Variables

Set in Netlify dashboard or `netlify.toml`:

```toml
[context.production.environment]
  API_URL = "https://api.example.com"
  NODE_ENV = "production"

[context.deploy-preview.environment]
  API_URL = "https://preview-api.example.com"
```

## Form Handling

```html
<form name="contact" method="POST" data-netlify="true">
  <input type="text" name="name" />
  <input type="email" name="email" />
  <button type="submit">Submit</button>
</form>
```

## Image Optimization

```typescript
import { netlifyImageCDN } from 'philjs-adapters/netlify/adapter';

const optimizedUrl = netlifyImageCDN('/images/hero.jpg', {
  width: 800,
  height: 600,
  fit: 'cover',
  quality: 80
});
```

## Examples

### Edge Function with Geo-location

```typescript
import { Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context) => {
  const country = context.geo.country?.name || 'Unknown';
  return new Response(`Hello from ${country}!`);
};
```

### Serverless Function with Blob

```typescript
import { getStore } from '@netlify/blobs';

export const handler = async (event, context) => {
  const store = getStore('cache');
  const cached = await store.get('data');

  if (cached) {
    return {
      statusCode: 200,
      body: cached
    };
  }

  // Fetch and cache
  const data = await fetchData();
  await store.set('data', data);

  return {
    statusCode: 200,
    body: data
  };
};
```

## Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Edge Functions](https://docs.netlify.com/edge-functions/overview/)
- [Netlify Blobs](https://docs.netlify.com/blobs/overview/)
- [Redirects & Rewrites](https://docs.netlify.com/routing/redirects/)
