# Dynamic Routes

Dynamic routes capture URL segments and pass them to your components. PhilJS follows the familiar `/users/:id` pattern via route definitions.

## Basic Parameters

Define a route with `:param` and read it from the component props:

```tsx
// routes/users/[id].tsx
export function UserProfileRoute({ params }: { params: { id: string } }) {
  return (
    <section>
      <h1>User {params.id}</h1>
    </section>
  );
}
```

In your router configuration:

```ts
createAppRouter({
  routes: [
    {
      path: '/',
      component: HomeRoute,
      children: [
        { path: '/users/:id', component: UserProfileRoute },
      ],
    },
  ],
});
```

Now `/users/42` renders `UserProfileRoute` with `params.id === '42'`.

## Data Loading with Params

Combine route params with a loader. Loader results appear in `props.data`.

```ts
{
  path: '/users/:id',
  component: UserProfileRoute,
  loader: async ({ params }) => {
    const res = await fetch(`/api/users/${params.id}`);
    if (!res.ok) throw new Response('Not found', { status: 404 });
    return res.json();
  },
}
```

```tsx
export function UserProfileRoute({ params, data }: { params: { id: string }; data: User }) {
  return (
    <article>
      <h1>{data.name}</h1>
      <p>ID: {params.id}</p>
    </article>
  );
}
```

## Multiple Parameters

Add as many segments as you need:

```tsx
export function UserPostRoute({ params }: { params: { userId: string; postId: string } }) {
  return (
    <section>
      <h1>Post {params.postId}</h1>
      <p>By user {params.userId}</p>
    </section>
  );
}
```

```ts
{
  path: '/users/:userId/posts/:postId',
  component: UserPostRoute,
}
```

`/users/123/posts/456` yields `{ userId: '123', postId: '456' }`.

## Catch-All Routes (`*`)

Use `*` to match the rest of the path. The router stores the matched string under `params['*']`.

```tsx
export function DocsRoute({ params }: { params: { '*': string } }) {
  const segments = params['*']?.split('/') ?? [];
  return (
    <section>
      <h1>Docs</h1>
      <p>Path: {segments.join(' / ')}</p>
    </section>
  );
}
```

```ts
{
  path: '/docs/*',
  component: DocsRoute,
}
```

- `/docs/getting-started` → `params['*'] === 'getting-started'`
- `/docs/guides/routing/basics` → `params['*'] === 'guides/routing/basics'`

## Optional Segments

Represent optional segments with separate routes so each gets the correct priority:

```ts
{
  path: '/products',
  component: ProductsIndex,
},
{
  path: '/products/:id',
  component: ProductDetail,
},
```

## Type Safety

If you use TypeScript, annotate `params` in your component props. When loaders become fully integrated with the PhilJS build pipeline, we’ll generate route type declarations automatically.

## Tips

- Order matters: declare more specific routes first if you share the same prefix.
- Catch-all routes should appear last—they have the lowest priority.
- Combine loaders with PhilJS data primitives (`createQuery`) for caching and mutations.
- Use `useRoute()` if you need access to params outside the component (e.g., analytics overlays).

Continue to [Layouts](./layouts.md) to learn how to share chrome across nested routes, or explore [navigation](./navigation.md) for link best practices.
