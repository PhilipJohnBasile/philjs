# Chapter 4: The URL is Truth

If Signals are the atom of State, then result of that state is typically a View. But how do we determine *which* view to show?

In the early days of Single Page Applications, we treated the URL as an afterthought—a side effect of clicking buttons. We stored application state in global stores (Redux, MobX) and desperately tried to keep the URL in sync.

PhilJS flips this model. **The URL is the single source of truth.**

## The URL as State

Consider a user viewing a product with a specific filter applied:
`https://shop.philjs.dev/products/shoes?color=red&size=10`

In PhilJS, you do not store `selectedColor` or `selectedSize` in a global signal. You store them in the URL. The URL *is* the state store.

```typescript
export default function ProductPage() {
  const route = useRoute();
  
  // These are reactive signals derived strictly from the URL
  const color = memo(() => route.searchParams.get('color')); 
  const size = memo(() => route.searchParams.get('size'));

  return <ProductList color={color()} size={size()} />;
}
```

When the user clicks "Blue", you do not call `setColor('blue')`. You navigate to `?color=blue`. The URL changes, the route signal updates, and the `ProductList` re-renders.

This guarantees that:
1.  **Shareability**: Users can copy/paste the URL and get the exact same state.
2.  **History**: The back button just works.
3.  **Simplicity**: You delete half your state management code.

## Nested Routing: The UI is a Tree

Most UIs are nested boxes. A generic "Settings" page usually implies:
`Root Layout -> Settings Layout -> Profile Page`

PhilJS maps these nested boxes directly to the URL structure.

```
/           -> _layout.tsx
/settings   -> settings/_layout.tsx
/profile    -> settings/profile.tsx
```

When the user navigates from `/settings/profile` to `/settings/account`, the Root Layout and Settings Layout **do not re-render**. They preserve their state. Only the inner `Profile` component is swapped for `Account`.

## Data Loading: Render-As-You-Fetch

Traditional SPAs suffer from "waterfalls":
1.  Load JS bundle
2.  Render component
3.  Component fetches data
4.  Render Spinner
5.  Show Data

PhilJS moves data fetching to the **Edge**. Every route can export a `loader`.

```typescript
// defined in route file, runs on server/edge
export const loader = async ({ params }) => {
  return await db.users.find(params.id);
};

export default function User({ data }) {
  // data is available immediately!
  return <h1>{data.name}</h1>;
}
```

The router fetches the data *in parallel* with loading the component code. By the time the component renders, the data is there.

## Actions: Mutations as Transitions

When you need to change server state, you use an **Action**.

```typescript
export const action = async ({ request }) => {
  const formData = await request.formData();
  await db.todos.create(formData.get('text'));
  return redirect('/todos');
};
```

Actions automatically trigger a "Revalidation". The router knows that data has changed, so it automatically re-runs all active loaders on the page to fetch fresh data. Your UI updates automatically without you needing to manually update a cache.

## Summary

1.  **Don't sync state to the URL**. Derive state *from* the URL.
2.  **UI Nesting matches URL Nesting**.
3.  **Fetch data before you render** using Loaders.
4.  **Mutate via Actions** to get automatic updates.

The URL is the most enduring API of the web. Treat it with respect.
