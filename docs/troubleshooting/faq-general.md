# FAQ - General

Frequently asked questions about PhilJS.

## Installation

**Q: How do I create a new PhilJS project?**

```bash
npm create philjs@latest my-app
cd my-app
npm install
npm run dev
```

**Q: Which package manager should I use?**

A: PhilJS works with npm, pnpm, and yarn. We recommend pnpm for faster installs.

## Development

**Q: How do I add routing?**

A: Create files in `routes/` directory:

```
routes/
  index.tsx  → /
  about.tsx  → /about
  blog/
    [slug].tsx → /blog/:slug
```

**Q: How do I fetch data?**

A: Use data loaders:

```tsx
export const loader = createDataLoader(async () => {
  const data = await fetch('/api/data');
  return data;
});
```

## Deployment

**Q: How do I deploy to production?**

A: Build and deploy:

```bash
npm run build
# Deploy dist/ to your hosting platform
```

**Q: Does PhilJS support SSR?**

A: Yes! PhilJS has excellent SSR support with streaming and resumability.

## Next Steps

- [FAQ Performance](/docs/troubleshooting/faq-performance.md) - Performance FAQs
- [FAQ TypeScript](/docs/troubleshooting/faq-typescript.md) - TypeScript FAQs

---

ℹ️ **Note**: Check our Discord for community support.
