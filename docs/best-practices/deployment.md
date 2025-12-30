# Deployment Best Practices

Deploy PhilJS applications to production.

## Build for Production

```bash
# Build optimized bundle
npm run build

# Preview build
npm run preview
```

## Environment Variables

```bash
# .env.production
PUBLIC_API_URL=https://api.example.com
SECRET_KEY=xxx # Never expose to client
```

## Deployment Platforms

### Vercel

```bash
npm install -g vercel
vercel deploy
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Docker

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Best Practices

### ✅ Do: Use Environment Variables

```tsx
// ✅ Good - use env vars
const apiUrl = import.meta.env.PUBLIC_API_URL;
```

### ✅ Do: Enable Compression

```js
// vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
};
```

## Next Steps

- [Security](/docs/best-practices/security.md) - Security practices
- [Performance](/docs/performance/overview.md) - Performance

---

💡 **Tip**: Always test your production build locally before deploying.

⚠️ **Warning**: Never commit .env files with secrets to version control.

ℹ️ **Note**: PhilJS works on all major platforms: Vercel, Netlify, Cloudflare.
