# Progressive Web Apps (PWA)

Turn PhilJS apps into installable, offline-capable PWAs.

## Core setup

- Use `philjs-plugin-pwa` (or Vite PWA plugin) to generate service workers and manifests.
- Add `manifest.webmanifest` with icons/splash screens.
- Configure service worker strategies: app shell precache, network-first for APIs.

## Service worker strategies

- **App shell**: precache static assets and core routes.
- **Data**: network-first with fallback to cache for read-heavy endpoints.
- **Images**: cache-first with expirations.
- **Background sync**: queue mutations and retry when online (where supported).

## Installability

- Serve over HTTPS.
- Provide 192x192 and 512x512 icons; theme color and background color set.
- Prompt install thoughtfully (not on first visit); respect user choice.

## Offline UX

- Show offline banner and cached content.
- Persist drafts (forms/notes) to IndexedDB; replay on reconnect.
- Provide retry and conflict resolution flows.

## Updates

- Notify users when a new service worker is ready; let them refresh when convenient.
- Avoid breaking changes in cached shells; version assets and bust caches correctly.

## Testing PWAs

- Lighthouse PWA audit.
- Playwright offline mode: verify shell loads, cached routes render, drafts persist.
- Test update flow (new SW) to ensure users see refreshed content.

## Security

- Restrict external resource loading; set CSP.
- Validate data stored offline; encrypt sensitive items.

## Checklist

- [ ] Manifest + icons present.
- [ ] Service worker caches shell/assets and handles data sensibly.
- [ ] Offline banner + draft persistence.
- [ ] Install prompt timing controlled.
- [ ] Update flow tested.
