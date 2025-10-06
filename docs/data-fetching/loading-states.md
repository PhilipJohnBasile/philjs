# Loading States

Properly managing loading states creates a better user experience. PhilJS provides multiple patterns for handling loading, from simple spinners to sophisticated skeleton screens.

## Basic Loading States

### Component-Level Loading

```tsx
import { signal, effect } from 'philjs-core';

export default function UserProfile({ userId }: { userId: number }) {
  const user = signal(null);
  const loading = signal(true);
  const error = signal(null);

  effect(() => {
    loading.set(true);
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        user.set(data);
        loading.set(false);
      })
      .catch(err => {
        error.set(err);
        loading.set(false);
      });
  });

  if (loading()) return <div>Loading...</div>;
  if (error()) return <div>Error: {error().message}</div>;

  return (
    <div>
      <h1>{user().name}</h1>
      <p>{user().email}</p>
    </div>
  );
}
```

### Skeleton Screens

```tsx
function UserSkeleton() {
  return (
    <div class="skeleton">
      <div class="skeleton-avatar" />
      <div class="skeleton-text" />
      <div class="skeleton-text short" />
    </div>
  );
}

export default function UserProfile() {
  const { data, loading } = useQuery('/api/user');

  if (loading) return <UserSkeleton />;

  return (
    <div>
      <img src={data.avatar} />
      <h1>{data.name}</h1>
      <p>{data.bio}</p>
    </div>
  );
}
```

## Suspense Boundaries

### Basic Suspense

```tsx
import { Suspense } from 'philjs-core';

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### Nested Suspense

```tsx
export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
      </Suspense>

      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </div>
  );
}
```

## Progressive Loading

### Critical First, Then Rest

```tsx
export const loader = createDataLoader(async () => {
  return {
    // Critical data - load immediately
    user: await fetchUser(),

    // Non-critical - stream later
    recommendations: fetchRecommendations(),
    activity: fetchActivity()
  };
});

export default function Dashboard({ data }) {
  return (
    <div>
      {/* Shows immediately */}
      <h1>Welcome {data.user.name}</h1>

      {/* Streams when ready */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Await resolve={data.recommendations}>
          {(items) => <Recommendations items={items} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

## Global Loading Indicators

### Top Loading Bar

```tsx
import { useNavigation } from 'philjs-router';

export default function LoadingBar() {
  const navigation = useNavigation();

  return (
    <div class={`loading-bar ${navigation.state === 'loading' ? 'active' : ''}`} />
  );
}
```

## Best Practices

### ✅ Do: Show Content Structure

```tsx
// ✅ Good - skeleton matches content
<div class="card">
  <div class="skeleton-image" />
  <div class="skeleton-title" />
  <div class="skeleton-text" />
</div>
```

### ✅ Do: Use Optimistic UI

```tsx
const toggleLike = () => {
  // Update UI immediately
  liked.set(!liked());

  // Then sync with server
  fetch('/api/like', { method: 'POST' })
    .catch(() => liked.set(!liked())); // Revert on error
};
```

## Next Steps

- [Error Handling](/docs/data-fetching/error-handling.md) - Handle errors
- [Caching](/docs/data-fetching/caching.md) - Cache strategies
- [Optimistic Updates](/docs/data-fetching/optimistic-updates.md) - Instant UI

---

💡 **Tip**: Use skeleton screens instead of spinners for a perceived faster load time.

⚠️ **Warning**: Always handle both loading and error states for robust UX.

ℹ️ **Note**: Suspense boundaries allow you to show content progressively as it loads.
