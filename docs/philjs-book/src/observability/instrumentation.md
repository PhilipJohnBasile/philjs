# Instrumentation Examples

Practical snippets for logging, metrics, and tracing in PhilJS.

## Logging loader timing

```ts
function log(event: string, data: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ event, ts: Date.now(), ...data }));
}

export const usersLoader = loader(async ({ signal, request, cache }) => {
  const reqId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const start = performance.now();
  try {
    const users = await fetchUsers(signal);
    cache.tag(['users']);
    return { users };
  } finally {
    log('loader.users', { reqId, ms: performance.now() - start, cache: 'miss' });
  }
});
```

## Metrics (edge-friendly)

```ts
import { counter, histogram } from '@philjs/observability'; // if available

const loaderHits = counter('loader_hits', { description: 'Loader calls' });
const loaderLatency = histogram('loader_latency_ms');

export const projectLoader = loader(async ({ params, signal }) => {
  const end = loaderLatency.startTimer();
  loaderHits.add(1, { loader: 'project' });
  const data = await fetchProject(params.id, signal);
  end({ loader: 'project' });
  return { data };
});
```

## Tracing

```ts
import { trace } from '@philjs/observability';

export const action = action(async ({ formData }) => {
  return trace('action.createProject', async (span) => {
    const name = String(formData.get('name') ?? '');
    span.setAttribute('project.name.length', name.length);
    return createProject({ name });
  });
});
```

## Client RUM (lightweight)

```ts
if ('performance' in window) {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  sendRum({ ttfb: nav.responseStart, lcp: /* compute via PerformanceObserver */ });
}
```

## Testing instrumentation

- In Vitest, assert logs/metrics by mocking exporters.
- In Playwright, capture console logs and ensure no PII; verify trace headers exist in network requests.

## Checklist

- [ ] Logs structured with reqId/route/loader info.
- [ ] Metrics for loader/action counts and latency.
- [ ] Traces wrap critical sections; attributes for cache hit/miss.
- [ ] RUM collected with sampling; privacy-respecting.
