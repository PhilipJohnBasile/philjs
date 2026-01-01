# Desktop: Tauri and Native Shells

Build PhilJS apps for desktop with Tauri (or Electron if required). This chapter covers project setup, file access, native menus, and performance considerations.

## Why Tauri

- Tiny binaries, Rust-backed security, and fast startup.
- Direct filesystem access with scoped permissions.
- Native menus/notifications; system tray support.

## Project setup

1) Create a PhilJS app (Vite).
2) Add Tauri:
```bash
pnpm add -D @tauri-apps/cli
pnpm tauri init
```
3) Point Tauri `distDir` to your PhilJS build output.
4) Configure `tauri.conf.json` for CSP, allowlists, and bundle settings.

## File access

- Use Tauri APIs for filesystem; scope paths in `tauri.conf.json`.
- Avoid bundling secrets; read from env or secure storage.
- For large files, stream reads/writes; keep UI responsive via signals.

## Native shell features

- Menus/shortcuts: map to intents and update UI state via signals/stores.
- Notifications: use sparingly; respect user preferences.
- Auto-update: wire Tauri updater; guard with feature flags.

## Security

- Restrict allowlist; disable the default `open` if not needed.
- Content-Security-Policy: disallow remote code unless required.
- Validate all IPC; never trust unvalidated payloads.

## Performance

- Keep bundle small; desktop doesn’t excuse bloat.
- Use windowing options to defer heavy windows until requested.
- For GPU-heavy tasks, consider WebGPU/WASM modules (see platforms/webgpu + platforms/wasm).

## Testing

- Unit/integration as usual with PhilJS testing.
- E2E: Playwright with Tauri driver or Spectron-equivalent; cover menus and file ops.

## Checklist

- [ ] Tauri config locked down (allowlist, CSP, updater).
- [ ] File access scoped and validated.
- [ ] Menus/shortcuts wired to intents; no UI-only logic.
- [ ] Bundle size audited; heavy deps lazy-loaded.
- [ ] E2E smoke covers launch, file open/save, and updates.
