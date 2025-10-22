# Loading States

Loaders fetch data before a route renders, but you still may want to show progress for long requests or streaming content. PhilJS exposes loading information through signals and layout patterns.

## Inline Loading Indicators

Because routes receive the navigation state via `useRouter()`, you can react to the current route’s loading status.

```tsx
import { useRouter } from 'philjs-router';

export function GlobalLoader() {
  const { route } = useRouter();

  if (!route || !route.pending) return null;
  return <div className="loading-bar" />;
}
```

The router populates `route.pending` when a loader/action is in flight. You can render this component inside your layout to show a top-level spinner or skeleton.

## Suspense-like Patterns

Use signals to track fetch states for follow-up requests triggered inside a component.

```tsx
export function ProfileRoute({ data }: { data: User }) {
  const details = signal<UserDetails | null>(null);
  const loading = signal(true);

  effect(() => {
    loading.set(true);
    fetch(`/api/users/${data.id}/details`)
      .then((res) => res.json())
      .then((json) => {
        details.set(json);
        loading.set(false);
      });
  });

  return (
    <section>
      <h1>{data.name}</h1>
      {loading() ? <Skeleton /> : <DetailsPanel details={details()} />}
    </section>
  );
}
```

## Partial Hydration & Streaming

Combine loaders with PhilJS’ resumability to stream markup:

1. Return a `ReadableStream` from your loader.
2. In the component, consume the stream and update a signal.
3. During SSR, the markup streams to the client; hydration resumes where it left off.

```ts
loader: async ({ params }) => {
  const stream = fetchBigDataset(params.id).body!;
  return stream;
}
```

```tsx
export function BigListRoute({ data }: { data: ReadableStream<Chunk> }) {
  const items = signal<Chunk[]>([]);

  effect(async () => {
    const reader = data.getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      items.set((prev) => [...prev, value]);
    }
  });

  return <List chunks={items()} />;
}
```

## Optimistic UI with Actions

While actions execute, you can show pending indicators or optimistic updates:

```tsx
export function CommentForm({ params, navigate }: RouteComponentProps) {
  const pending = signal(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    pending.set(true);
    const formData = new FormData(event.target as HTMLFormElement);
    await fetch(`/comments/${params.postId}?_action`, { method: 'POST', body: formData });
    pending.set(false);
    await navigate(`/posts/${params.postId}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="body" required />
      <button type="submit" disabled={pending()}>
        {pending() ? 'Posting…' : 'Post comment'}
      </button>
    </form>
  );
}
```

## Skeleton Components

Use the layout’s knowledge of `route.pending` to render skeletons for specific sections while child routes load:

```tsx
export function DashboardLayout({ children }: { children: any }) {
  const { route } = useRouter();
  const isLoading = route?.pending;

  return (
    <div className="dashboard">
      <Sidebar />
      <main>
        {isLoading ? <DashboardSkeleton /> : children}
      </main>
    </div>
  );
}
```

## Best Practices

- Avoid spinning indicators for fast requests; use skeletons for smoother perceived performance.
- Consider prefetch strategies (`prefetch: true`) to minimise loader latency altogether.
- Stream large datasets and progressively render them to keep navigation snappy.
- Use `route.error` (see the Error Handling guide) to display fallback UI when loaders fail.

Next, review [Error Handling](./error-handling.md) to pair loaders with robust fallback states.
