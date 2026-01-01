# Signals Cookbook

Practical patterns for PhilJS signals and memos.

## Derived counts and filters

```ts
const filter = signal('');
const todos = signal([{ id: '1', title: 'Docs' }, { id: '2', title: 'Ship' }]);
const filtered = memo(() =>
  todos().filter(t => t.title.toLowerCase().includes(filter().toLowerCase()))
);
```

## Toggle helpers

```ts
function createToggle(initial = false) {
  const state = signal(initial);
  return {
    state,
    toggle: () => state.update(v => !v),
    on: () => state.set(true),
    off: () => state.set(false),
  };
}
```

## Batching updates

```ts
batch(() => {
  count.set(c => c + 1);
  other.set(o => o + 1);
});
```

## Linked signals (writable computed)

```ts
const first = signal('Ada');
const last = signal('Lovelace');
const full = linkedSignal(() => `${first()} ${last()}`);
full.set('Grace Hopper');
full.reset();
```

## Untracked reads

```ts
const user = signal({ id: 'u1', name: 'Ava' });
const logOnce = () => console.log(untrack(() => user().name));
```

## Effects do side effects only

```ts
effect(() => {
  document.title = `Count ${count()}`;
});
```

## Interval with cleanup

```ts
effect(() => {
  const id = setInterval(() => tick.update(n => n + 1), 1000);
  onCleanup(() => clearInterval(id));
});
```

## Patterns to avoid

- Avoid async in effects; use resources for data fetching.
- Avoid storing large objects in a single signal when slices are better.
- Avoid creating signals in render for stable values; hoist them.

## Checklist

- [ ] Derived data in memos, not effects.
- [ ] Batch multiple writes.
- [ ] Clean up side effects with `onCleanup`.
- [ ] Use `untrack` when reading without subscribing.
