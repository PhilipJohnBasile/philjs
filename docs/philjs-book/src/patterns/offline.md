# Offline and Resilient UX

Build experiences that keep working without a network and recover gracefully when connectivity returns.

## Core principles

- Local-first: write locally, sync later.
- Predictable caches: explicit lifetimes, no silent staleness.
- Clear status: show offline/online banners and sync state.

## Data strategy

- Use loaders with cache tags and `staleTime`; pair with `@philjs/offline` for IndexedDB storage.
- Queue mutations when offline; replay on reconnect with backoff.
- Detect conflicts and show resolution UI (keep both / pick latest / merge).

## Persistence

- Persist drafts (forms, documents) to IndexedDB.
- Encrypt sensitive payloads; avoid storing secrets.
- Keep history bounded to prevent unbounded growth.

## UI patterns

- Banner/toast when offline; avoid modal blocks.
- Disable actions that truly require network; allow drafts otherwise.
- Show sync progress and errors; let users retry.

## Service workers/PWA

- Use `philjs-plugin-pwa` for caching strategies (app shell, assets, API fallback).
- Precache core routes; use network-first for dynamic data.
- Background sync where supported; otherwise retry on focus/reconnect.

## Testing

- Simulate offline in Playwright; ensure pages render from cache and drafts persist.
- Unit-test mutation queue logic with fake timers and reconnect events.
- Ensure conflict handling paths are covered with fixtures.

## Checklist

- [ ] Offline banner + status.
- [ ] Draft persistence for key flows.
- [ ] Mutation queue with retry/backoff.
- [ ] Conflict resolution path.
- [ ] PWA/service worker configured for core routes and assets.
