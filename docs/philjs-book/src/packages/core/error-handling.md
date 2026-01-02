# Error handling

PhilJS combines error boundaries, Result types, and optional error tracking.

## Error boundaries

```tsx
import { ErrorBoundary } from '@philjs/core/error-boundary';

function App() {
  return (
    <ErrorBoundary
      name="AppShell"
      fallback={(info, retry) => (
        <div>
          <p>{info.error.message}</p>
          <button onClick={retry}>Try again</button>
        </div>
      )}
      autoRecover
      maxRetries={2}
    >
      <Main />
    </ErrorBoundary>
  );
}
```

## Result type

```ts
import { Ok, Err, matchResult } from '@philjs/core/result';

const result = Math.random() > 0.5
  ? Ok('success')
  : Err(new Error('failed'));

const message = matchResult(result, {
  ok: value => value,
  err: error => error.message
});
```

## Error tracking

```ts
import { initErrorTracking, captureException } from '@philjs/core/error-tracking';

initErrorTracking({ service: 'sentry', dsn: process.env.SENTRY_DSN });

try {
  doWork();
} catch (error) {
  captureException(error as Error);
}
```

## Tips

- Use ErrorBoundary around route layouts or feature areas.
- Use Result for explicit error flows in data loaders and services.
