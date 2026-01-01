# Store Middleware Cookbook

Patterns for PhilJS store middleware (logging, flags, validation, analytics).

## Logging middleware

```ts
store.use((next, patch) => {
  console.info('patch', patch);
  return next();
});
```

## Feature flag guard

```ts
store.use((next, patch) => {
  if (patch.path[0] === 'beta' && !hasFlag('beta')) {
    throw new Error('Feature disabled');
  }
  return next();
});
```

## Schema validation (Zod)

```ts
const todoSchema = z.object({ id: z.string(), title: z.string() });
store.use((next, patch) => {
  if (patch.path[0] === 'todos' && patch.value) {
    const arr = Array.isArray(patch.value) ? patch.value : [patch.value];
    arr.forEach(todoSchema.parse);
  }
  return next();
});
```

## Analytics hook

```ts
store.use((next, patch) => {
  const result = next();
  sendAnalytics({ patch });
  return result;
});
```

## Prevent large payloads

```ts
store.use((next, patch) => {
  const bytes = new TextEncoder().encode(JSON.stringify(patch.value ?? '')).length;
  if (bytes > 50_000) throw new Error('Patch too large');
  return next();
});
```

## Checklist

- [ ] Middleware ordered correctly (guards first, analytics last).
- [ ] Validate inputs before writes.
- [ ] Avoid blocking operations inside middleware.
- [ ] Keep middleware pure; no hidden side-effects besides intended logging/metrics.
