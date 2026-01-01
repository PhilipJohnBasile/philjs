# SEO and Discoverability

Optimize PhilJS apps for search engines and social sharing without sacrificing performance.

## Core practices

- Server-render critical pages; stream for speed.
- Unique, descriptive titles and meta descriptions per route.
- Canonical URLs to avoid duplicate content.
- Structured data (JSON-LD) for rich results when applicable.

## Meta handling

- Set `<title>`, `<meta name="description">`, and canonical links in layouts.
- Add Open Graph/Twitter tags for social cards.
- Avoid duplicate titles; include brand suffix/prefix consistently.

## Routing and links

- Use clean URLs; avoid hash routing.
- Ensure internal links are crawlable; avoid JS-only navigation for critical content.
- Provide sitemaps and robots.txt; update on deploy.

## Performance and crawl budget

- Keep TTFB low with edge SSR; stream content.
- Defer non-critical scripts; minimize JS for landing pages.
- Use lazy loading for below-the-fold media; supply `loading="lazy"` and width/height to avoid CLS.

## Internationalization

- Use `hreflang` for localized pages.
- Ensure language-specific content has distinct URLs.

## Accessibility overlap

- Semantic HTML improves SEO; headings in order, alt text for images.
- Avoid hiding primary content behind interactions for bots.

## Testing

- Run Lighthouse SEO checks.
- Validate structured data with Google’s Rich Results Test.
- Inspect rendered HTML (SSR output) to ensure meta tags are present before hydration.

## Checklist

- [ ] Titles/descriptions set per route.
- [ ] Canonical tags present.
- [ ] OG/Twitter cards configured.
- [ ] Sitemap/robots generated on deploy.
- [ ] Structured data added where relevant.
- [ ] Performance budgets met on landing pages.
