# Mobile: Capacitor and Native

PhilJS can target mobile with Capacitor while reusing your web stack. This chapter covers project setup, plugins, performance tips, and a few mobile-only considerations. Use it alongside `packages/philjs-native/templates/capacitor/README.md` and `docs/platforms` for deeper platform notes.

## Project setup (template)

The repo includes `packages/philjs-native/templates/capacitor`:

- Node 24, TypeScript 6, PhilJS 0.1.0
- Vite for web build, Capacitor CLI for native shells
- Prewired scripts for `cap:init`, `cap:add:ios`, `cap:add:android`, `cap:sync`

Flow:

1) `pnpm install`
2) `pnpm dev` (web preview)
3) `pnpm cap:init` (set app id/name)
4) `pnpm cap:add:ios` or `cap:add:android`
5) `pnpm cap:sync` then `pnpm cap:open:ios`
- For CI, run `pnpm build` then `cap sync` to prepare artifacts; prefer building native shells on the target OS (macOS for iOS).

## Using plugins

Import Capacitor plugins in PhilJS components:

```typescript
import { Camera } from '@capacitor/camera';

const takePhoto = async () => {
  const photo = await Camera.getPhoto({ resultType: 'uri' });
  return photo.webPath;
};
```

- Keep plugin calls inside effects triggered by user intent.
- Guard for platform support (web vs native).
- Handle permissions up front and provide graceful fallbacks if declined.

## Performance tips

- Keep bundle size lean; mobile networks magnify payload cost.
- Use edge rendering + caching for APIs to reduce round trips.
- Prefer signals/memos over heavy stores to cut allocations.
- Avoid layout thrash: precompute styles, use CSS animations where possible.
- Use `prefetch()` for navigation targets to reduce perceived latency.
- Defer non-critical plugin initialization until after first paint.

## Offline and sync

- Combine `@philjs/offline` with persistent stores (IndexedDB) for drafts.
- Use background sync (where supported) and conflict resolution on reconnect.
- Show optimistic UI with rollback for mutations.
- Persist drafts carefully; encrypt sensitive data and avoid secrets in storage.
- Consider “airplane mode” banners and queue mutations for replay.

## Native UX polish

- Match platform patterns (pull-to-refresh, gestures) via `@philjs/gesture` and native status bar controls.
- Use haptics sparingly (`@capacitor/haptics`).
- Handle permissions explicitly with clear error states.
- Tune splash screen and status bar for dark/light modes.
- Use gestures (`@philjs/gesture`) for swipe navigation; respect platform norms.

## Debugging

- Use browser devtools for web preview; for device debugging attach Safari/Chrome devtools to webviews.
- Log storage usage; clear caches between test runs when profiling.
- For crashes, collect native logs (Xcode/adb) and correlate with PhilJS routes.
- Verify native splash/icon assets per platform; keep adaptive icons for Android.
- Watch bundle size; run `pnpm build` and inspect output before syncing to devices.

## Try it now: camera + offline draft

```typescript
import { Camera } from '@capacitor/camera';
import { createStore } from '@philjs/core';

const [state, setState, store] = createStore({ draftPhoto: null });
store.persist({ driver: 'localStorage', paths: ['draftPhoto'] });

async function capture() {
  const photo = await Camera.getPhoto({ resultType: 'uri', quality: 70 });
  setState('draftPhoto', photo.webPath);
}
```

Add a preview component that renders `state.draftPhoto`, and confirm it persists across reloads/offline.
