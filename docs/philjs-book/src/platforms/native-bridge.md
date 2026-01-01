# Native Bridges (Android/iOS)

Bridge PhilJS apps to native capabilities when a pure web approach isn’t enough.

## When to use a native bridge

- Deep platform integrations: background services, sensors beyond Web APIs.
- Performance-sensitive features that need native modules.
- Integrating with existing native apps via webviews.

## Options

- Capacitor plugins (preferred with PhilJS native template).
- Custom native modules exposed to webviews (Android: JSInterface; iOS: WKScriptMessageHandler).
- React Native/NativeScript bridges if mixing with native stacks (heavier).

## Patterns

- Keep bridge APIs small and typed; version them.
- Validate inputs/outputs at the boundary.
- Avoid chatty bridges; batch requests or stream events.
- Handle permission prompts natively; reflect state in PhilJS UI via signals.

## Security

- Restrict which origins can call the bridge.
- Validate messages; never eval arbitrary JS.
- For Android, disable `addJavascriptInterface` on untrusted content; prefer modern APIs.

## Testing

- Unit-test bridge wrappers in PhilJS with mocks.
- Device/instrumentation tests for native modules.
- E2E: drive webview + native interactions (Appium/Playwright for webview contexts).

## Checklist

- [ ] Bridge surface area minimal and typed.
- [ ] Permissions handled explicitly with clear UX.
- [ ] Inputs/outputs validated; no arbitrary eval.
- [ ] Tests cover bridge calls and failure modes.
