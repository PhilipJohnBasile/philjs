# Asset Optimization

Keep assets light to reduce load times and bandwidth.

## Images

- Prefer AVIF/WebP with fallbacks.
- Use responsive images (`srcset`/`sizes`) and explicit width/height to prevent CLS.
- Lazy-load below-the-fold images; preload critical hero images.
- Compress aggressively; strip EXIF unless needed.

## Fonts

- Use variable fonts when possible; subset to required glyphs.
- Preload critical fonts; use `font-display: swap` or `optional` to avoid FOIT.
- Avoid too many weights/styles; stick to a tight set.

## Icons

- Prefer SVG sprites or icon fonts; avoid large icon packs when only a few icons are used.
- Inline critical icons; lazy-load secondary sets.

## Video/Audio

- Stream via modern formats (H.265/VP9/AV1) with fallbacks.
- Provide multiple resolutions; default to adaptive streaming for long videos.
- Avoid autoplay with sound; respect user preferences/data saver.

## Bundles and third-party

- Tree-shake and code-split; remove unused imports.
- Defer or lazy-load third-party scripts; audit their cost regularly.
- For analytics/ads, load after first interaction where possible.

## Testing

- Run `pnpm size` and inspect bundle composition.
- Use Lighthouse/Playwright traces to measure asset impact.
- Check cache headers and compression (brotli/gzip) via `curl -I`.

## Checklist

- [ ] Images optimized, responsive, and lazy-loaded.
- [ ] Fonts subsetted/preloaded with swap/optional.
- [ ] Icon strategy efficient (SVG sprite or minimal set).
- [ ] Third-party scripts minimized/deferred.
- [ ] Compression and cache headers verified.

