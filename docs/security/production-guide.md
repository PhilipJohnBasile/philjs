# Production Security Guide

## Hardening Checklist

### 1. Content Security Policy (CSP)
PhilJS automatically generates nonces for scripts. Ensure your CSP header includes:
`script-src 'self' 'nonce-{generated_nonce}';`

### 2. CORS
Configure `@philjs/server` to restrict origins:
```typescript
app.use(cors({ origin: ['https://myapp.com'] }));
```

### 3. Sanitization
All inputs in `createAction` are automatically validated if you use Zod schemas. Manual HTML injection should be sanitized using `DOMPurify`.

### 4. Dependencies
Run `npm audit` in your CI pipeline.
