# Parallel Routes

Parallel routes allow you to simultaneously render multiple pages in the same layout. This is perfect for dashboards, split views, and complex UIs that need to show multiple independent sections.

## Basic Parallel Routes

### Defining Parallel Routes

Create parallel routes using the `@slot` naming convention:

```
routes/
  dashboard/
    @analytics/
      index.tsx      → Analytics slot
    @activity/
      index.tsx      → Activity slot
    @settings/
      index.tsx      → Settings slot
    _layout.tsx      → Dashboard layout
```

### Layout with Slots

```tsx
// routes/dashboard/_layout.tsx
export default function DashboardLayout({ analytics, activity, settings }) {
  return (
    <div class="dashboard">
      <div class="main">
        <section class="analytics">
          {analytics}
        </section>

        <section class="activity">
          {activity}
        </section>
      </div>

      <aside class="settings">
        {settings}
      </aside>
    </div>
  );
}
```

### Slot Components

```tsx
// routes/dashboard/@analytics/index.tsx
export default function Analytics() {
  return (
    <div>
      <h2>Analytics</h2>
      <Chart data={salesData} />
    </div>
  );
}

// routes/dashboard/@activity/index.tsx
export default function Activity() {
  return (
    <div>
      <h2>Recent Activity</h2>
      <ActivityFeed items={activities} />
    </div>
  );
}

// routes/dashboard/@settings/index.tsx
export default function Settings() {
  return (
    <div>
      <h2>Settings</h2>
      <SettingsForm />
    </div>
  );
}
```

## Navigation in Slots

### Independent Navigation

Each slot can navigate independently:

```tsx
// routes/dashboard/@analytics/index.tsx
export default function AnalyticsIndex() {
  return (
    <div>
      <nav>
        <Link href="/dashboard/@analytics/overview">Overview</Link>
        <Link href="/dashboard/@analytics/revenue">Revenue</Link>
        <Link href="/dashboard/@analytics/users">Users</Link>
      </nav>
    </div>
  );
}

// routes/dashboard/@analytics/revenue.tsx
export default function Revenue() {
  return <div>Revenue Analytics</div>;
}
```

### Coordinated Navigation

Slots can coordinate navigation:

```tsx
// routes/dashboard/@analytics/[metric].tsx
import { useParams, useNavigate } from 'philjs-router';

export default function MetricDetail() {
  const params = useParams();
  const navigate = useNavigate();

  const selectMetric = (metric: string) => {
    // Navigate both slots simultaneously
    navigate(`/dashboard/@analytics/${metric}/@details/${metric}`);
  };

  return <div>Viewing: {params.metric}</div>;
}
```

## Loading States

### Per-Slot Loading

Each slot can have its own loading state:

```tsx
// routes/dashboard/@analytics/index.tsx
export const loader = createDataLoader(async () => {
  const data = await fetchAnalytics();
  return { data };
});

export default function Analytics({ data }) {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsChart data={data} />
    </Suspense>
  );
}

// routes/dashboard/@activity/index.tsx
export const loader = createDataLoader(async () => {
  const feed = await fetchActivity();
  return { feed };
});

export default function Activity({ data }) {
  return (
    <Suspense fallback={<ActivitySkeleton />}>
      <ActivityList items={data.feed} />
    </Suspense>
  );
}
```

### Streaming Parallel Data

```tsx
// routes/dashboard/_layout.tsx
export const loader = createDataLoader(async () => {
  return {
    // Load in parallel
    analytics: fetchAnalytics(),
    activity: fetchActivity(),
    settings: fetchSettings()
  };
});

export default function DashboardLayout({ data, ...slots }) {
  return (
    <div class="dashboard">
      <Suspense fallback={<AnalyticsSkeleton />}>
        <Await resolve={data.analytics}>
          {(analytics) => slots.analytics({ data: analytics })}
        </Await>
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <Await resolve={data.activity}>
          {(activity) => slots.activity({ data: activity })}
        </Await>
      </Suspense>
    </div>
  );
}
```

## Conditional Slots

### Show/Hide Slots

```tsx
export default function DashboardLayout({ analytics, activity, settings }) {
  const showSettings = usePermission('settings.view');

  return (
    <div>
      {analytics}
      {activity}
      {showSettings() && settings}
    </div>
  );
}
```

### Dynamic Slot Selection

```tsx
import { useSearchParams } from 'philjs-router';

export default function DashboardLayout(slots) {
  const [params] = useSearchParams();
  const view = params.get('view') || 'default';

  return (
    <div>
      {view === 'analytics' && slots.analytics}
      {view === 'activity' && slots.activity}
      {view === 'split' && (
        <>
          {slots.analytics}
          {slots.activity}
        </>
      )}
    </div>
  );
}
```

## Modal Routes

### Modal as Parallel Route

```tsx
// routes/photos/
//   @modal/
//     [id].tsx       → Photo modal
//   index.tsx        → Photo grid
//   _layout.tsx      → Layout with modal

// routes/photos/_layout.tsx
export default function PhotosLayout({ children, modal }) {
  return (
    <div>
      {children}
      {modal}
    </div>
  );
}

// routes/photos/index.tsx
export default function PhotoGrid() {
  return (
    <div class="grid">
      {photos.map(photo => (
        <Link key={photo.id} href={`/photos/@modal/${photo.id}`}>
          <img src={photo.thumbnail} />
        </Link>
      ))}
    </div>
  );
}

// routes/photos/@modal/[id].tsx
export default function PhotoModal({ params }) {
  const navigate = useNavigate();

  return (
    <div class="modal-overlay" onClick={() => navigate('/photos')}>
      <div class="modal">
        <img src={`/photos/${params.id}.jpg`} />
        <button onClick={() => navigate('/photos')}>Close</button>
      </div>
    </div>
  );
}
```

## Split Views

### Email Client Example

```tsx
// routes/mail/
//   @list/
//     index.tsx      → Email list
//   @detail/
//     [id].tsx       → Email detail
//   _layout.tsx

// routes/mail/_layout.tsx
export default function MailLayout({ list, detail }) {
  return (
    <div class="mail-client">
      <aside class="mail-list">
        {list}
      </aside>

      <main class="mail-detail">
        {detail || <div>Select an email</div>}
      </main>
    </div>
  );
}

// routes/mail/@list/index.tsx
export default function MailList() {
  return (
    <ul>
      {emails.map(email => (
        <li key={email.id}>
          <Link href={`/mail/@detail/${email.id}`}>
            {email.subject}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// routes/mail/@detail/[id].tsx
export default function MailDetail({ params }) {
  const email = fetchEmail(params.id);

  return (
    <article>
      <h2>{email.subject}</h2>
      <p>From: {email.from}</p>
      <div>{email.body}</div>
    </article>
  );
}
```

## Error Boundaries

### Per-Slot Error Handling

```tsx
// routes/dashboard/@analytics/index.tsx
export default function Analytics() {
  return (
    <ErrorBoundary
      fallback={(error) => (
        <div>
          <h3>Failed to load analytics</h3>
          <p>{error.message}</p>
        </div>
      )}
    >
      <AnalyticsContent />
    </ErrorBoundary>
  );
}
```

### Graceful Degradation

```tsx
export default function DashboardLayout({ analytics, activity }) {
  return (
    <div>
      <ErrorBoundary
        fallback={() => <div>Analytics unavailable</div>}
      >
        {analytics}
      </ErrorBoundary>

      <ErrorBoundary
        fallback={() => <div>Activity unavailable</div>}
      >
        {activity}
      </ErrorBoundary>
    </div>
  );
}
```

## State Management

### Shared State Between Slots

```tsx
import { createContext, useContext, signal } from 'philjs-core';

const DashboardContext = createContext();

export default function DashboardLayout({ analytics, activity }) {
  const selectedMetric = signal('revenue');
  const dateRange = signal({ start: new Date(), end: new Date() });

  return (
    <DashboardContext.Provider value={{ selectedMetric, dateRange }}>
      <div>
        {analytics}
        {activity}
      </div>
    </DashboardContext.Provider>
  );
}

// In slot component
function Analytics() {
  const { selectedMetric, dateRange } = useContext(DashboardContext);

  return (
    <div>
      Showing {selectedMetric()} from {dateRange().start} to {dateRange().end}
    </div>
  );
}
```

## Best Practices

### ✅ Do: Use for Independent UI Sections

```tsx
// ✅ Good - parallel routes for independent sections
<div class="dashboard">
  <div class="left">{analytics}</div>
  <div class="right">{activity}</div>
</div>
```

### ✅ Do: Handle Missing Slots

```tsx
// ✅ Good - provide defaults
export default function Layout({ slot1, slot2 }) {
  return (
    <div>
      {slot1 || <DefaultSlot1 />}
      {slot2 || <DefaultSlot2 />}
    </div>
  );
}
```

### ✅ Do: Keep Slots Independent

```tsx
// ✅ Good - independent data loading
// @analytics/index.tsx
export const loader = () => fetchAnalytics();

// @activity/index.tsx
export const loader = () => fetchActivity();
```

### ❌ Don't: Overuse Parallel Routes

```tsx
// ❌ Bad - too many parallel routes
<Layout
  slot1={...}
  slot2={...}
  slot3={...}
  slot4={...}
  slot5={...}
/>

// ✅ Good - simpler structure
<Layout>
  <Component1 />
  <Component2 />
</Layout>
```

## Next Steps

- [Intercepting Routes](/docs/routing/intercepting-routes.md) - Intercept navigation
- [Layouts](/docs/routing/layouts.md) - Advanced layouts
- [View Transitions](/docs/routing/view-transitions.md) - Smooth transitions
- [Data Loading](/docs/routing/data-loading.md) - Load data for parallel routes

---

💡 **Tip**: Parallel routes are perfect for dashboards where multiple sections need to load and navigate independently.

⚠️ **Warning**: Too many parallel routes can make your routing complex. Use them judiciously.

ℹ️ **Note**: Each parallel route can have its own loading state, error boundary, and navigation.
