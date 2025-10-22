# Data Loading

PhilJS routes can fetch data before rendering by providing a `loader` function. Loaders run on navigation (and during SSR/SSG integration) and their return value becomes `props.data` in the route component.

## Basic Loader

```ts
createAppRouter({
  routes: [
    {
      path: '/posts',
      component: PostsRoute,
      loader: async () => {
        const res = await fetch('/api/posts');
        if (!res.ok) throw new Error('Failed to load posts');
        return res.json();
      },
    },
  ],
});
```

```tsx
export function PostsRoute({ data }: { data: Post[] }) {
  return (
    <section>
      <h1>Latest Posts</h1>
      <ul>
        {data.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </section>
  );
}
```

## Accessing Params

Loaders receive the same context object as actions. Use params to tailor fetches:

```ts
{
  path: '/posts/:slug',
  component: BlogPostRoute,
  loader: async ({ params }) => {
    const res = await fetch(`/api/posts/${params.slug}`);
    if (!res.ok) throw new Response('Not found', { status: 404 });
    return res.json();
  },
}
```

```tsx
export function BlogPostRoute({ params, data }: { params: { slug: string }; data: Post }) {
  return (
    <article>
      <h1>{data.title}</h1>
      <p>Slug: {params.slug}</p>
      <div>{data.body}</div>
    </article>
  );
}
```

## Error Handling

Throw a `Response` or `Error` from a loader to signal failures. Catch these in error boundaries or allow the router to display fallback messages.

```ts
loader: async ({ params }) => {
  const res = await fetch(`/api/products/${params.id}`);
  if (res.status === 404) {
    throw new Response('Not found', { status: 404 });
  }
  if (!res.ok) {
    throw new Error('Unexpected error');
  }
  return res.json();
}
```

## Combining with Signals

Loaders run once per navigation. For live updates, pair loader data with PhilJS signals or `createQuery`:

```tsx
export function DashboardRoute({ data }: { data: DashboardData }) {
  const stats = signal(data.stats);

  effect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/dashboard/stats');
      stats.set(await res.json());
    }, 10_000);
    return () => clearInterval(interval);
  });

  return <StatsPanel stats={stats()} />;
}
```

## Actions (Mutations)

Actions handle POST/PUT/DELETE requests. They receive `{ params, request, formData }`.

```ts
{
  path: '/posts/:slug',
  component: EditPostRoute,
  loader: async ({ params }) => fetchPost(params.slug),
  action: async ({ params, formData }) => {
    const res = await fetch(`/api/posts/${params.slug}`, {
      method: 'PUT',
      body: formData,
    });
    if (!res.ok) throw res;
    return res.json();
  },
}
```

In your form handler, prevent default and call `navigate()` after the action succeeds.

```tsx
export function EditPostRoute({ data, params, navigate }: RouteComponentProps) {
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    await fetch(`/posts/${params.slug}?_action`, { method: 'POST', body: formData });
    await navigate(`/posts/${params.slug}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

> **Note:** Action plumbing is available in the router today; upcoming releases will tie it into PhilJS SSR/SSG for fully resumable mutations.

## Caching & Prefetching

- Use `prefetch` on routes or links to warm caches before navigation happens.
- Combine loaders with `createMutation` / `createQuery` for optimistic UI and deduped fetches.
- For large datasets, stream responses from loaders (e.g., via `ReadableStream`) to keep navigation snappy.

Next: read about [loading states](./loading-states.md) to show skeletons or progress indicators while loaders run.
