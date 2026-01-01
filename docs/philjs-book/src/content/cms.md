# CMS and Content Workflows

Integrate PhilJS with headless CMSs while keeping performance and editorial velocity high.

## Choosing a CMS

- Headless options (Contentful, Sanity, Strapi, Ghost) for structured content.
- Consider editorial UX, API performance, preview support, and webhook capabilities.

## Data flow

- Fetch content via loaders; cache by slug and locale.
- Use incremental/static generation for stable pages; revalidate on webhook.
- For previews, bypass cache and hit draft endpoints; protect with auth tokens.

## Modeling content

- Keep content schemas stable; version fields for breaking changes.
- Use references/blocks for rich pages; keep components in PhilJS aligned with CMS blocks.
- Validate CMS data in loaders; handle missing fields gracefully.

## Images and media

- Use CMS image CDN transforms for responsive sizes.
- Cache media URLs; set proper `Cache-Control` headers.
- Lazy-load below-the-fold media.

## Webhooks and revalidation

- On publish/update, trigger cache invalidation for affected routes.
- For ISR-like setups, call revalidate endpoints; ensure authentication on webhooks.

## Localization

- Store locales per entry; use `hreflang` in rendered pages.
- Fallback strategy for missing translations.

## Testing

- Stub CMS API responses with MSW; include draft/published variants.
- E2E preview flows: ensure draft content renders and is not cached.
- Monitor 404s for missing slugs.

## Checklist

- [ ] Loaders fetch and cache content by slug/locale.
- [ ] Preview flow protected; draft content not cached.
- [ ] Webhooks trigger precise invalidation.
- [ ] CMS data validated; fallbacks for missing fields.
- [ ] Responsive images via CMS CDN.
