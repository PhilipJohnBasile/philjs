# Data loading

PhilJS Router uses Remix-style loaders for data fetching.

## Define a loader

```ts
import { json, redirect } from '@philjs/router';

export async function loader({ params, request }) {
  if (!isAuthorized(request)) {
    throw redirect('/login');
  }

  const data = await fetchData(params.id);
  return json({ data });
}
```

## Use loader data

```tsx
import { useLoaderData } from '@philjs/router';

function Route() {
  const { data } = useLoaderData<{ data: Item }>();
  return <div>{data.name}</div>;
}
```

## Revalidation and cache

```ts
import { revalidate, invalidateLoaderCache } from '@philjs/router';

revalidate(); // re-run active loaders
invalidateLoaderCache(); // clear cached loader data
```

## Nested loaders

`executeNestedLoaders` runs parent and child loaders in parallel to avoid waterfalls.
