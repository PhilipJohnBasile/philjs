# Layouts

Create reusable layouts that wrap multiple pages with shared UI like headers, sidebars, and footers.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). The high-level helpers referenced here—such as `<Router>`, `<Route>`, and `useRouter()`—are part of the planned ergonomic API and are shown for conceptual guidance.

## What You'll Learn

- Creating layouts
- Nested layouts
- Route-specific layouts
- Layout composition
- Best practices

## Basic Layout

Create a layout component:

```typescript
// src/layouts/RootLayout.tsx
export default function RootLayout({ children }: { children: any }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
```

Apply to all pages:

```typescript
// src/App.tsx
import RootLayout from './layouts/RootLayout';
import { Router } from 'philjs-router';

export default function App() {
  return (
    <RootLayout>
      <Router />
    </RootLayout>
  );
}
```

## File-Based Layouts

Use `layout.tsx` files:

```
src/pages/
  layout.tsx → Root layout (all pages)
  index.tsx → Home
  about.tsx → About
  dashboard/
    layout.tsx → Dashboard layout (wraps dashboard pages)
    index.tsx → Dashboard home
    settings.tsx → Dashboard settings
```

```typescript
// src/pages/layout.tsx (Root layout)
export default function RootLayout({ children }: { children: any }) {
  return (
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

```typescript
// src/pages/dashboard/layout.tsx (Dashboard layout)
export default function DashboardLayout({ children }: { children: any }) {
  return (
    <div className="dashboard">
      <DashboardSidebar />
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}
```

## Nested Layouts

Layouts nest automatically:

```
Pages:
- / → RootLayout
- /dashboard → RootLayout > DashboardLayout
- /dashboard/settings → RootLayout > DashboardLayout > (page)
```

Example:

```typescript
// Result for /dashboard/settings:
<RootLayout>
  <DashboardLayout>
    <SettingsPage />
  </DashboardLayout>
</RootLayout>
```

## Layout with Navigation

```typescript
export default function DashboardLayout({ children }: { children: any }) {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/analytics">Analytics</Link>
          <Link href="/dashboard/settings">Settings</Link>
          <Link href="/dashboard/profile">Profile</Link>
        </nav>
      </aside>

      <main className="content">
        {children}
      </main>
    </div>
  );
}
```

## Conditional Layouts

Show different layouts based on conditions:

```typescript
import { useUser } from './hooks/useUser';

export default function AppLayout({ children }: { children: any }) {
  const user = useUser();

  if (!user()) {
    // Public layout
    return (
      <div>
        <PublicHeader />
        {children}
        <PublicFooter />
      </div>
    );
  }

  // Authenticated layout
  return (
    <div>
      <AuthenticatedHeader user={user()!} />
      <Sidebar />
      {children}
      <Footer />
    </div>
  );
}
```

## Layout Props

Pass data to layouts:

```typescript
// src/pages/blog/layout.tsx
interface BlogLayoutProps {
  children: any;
  categories?: Category[];
}

export default function BlogLayout({ children, categories }: BlogLayoutProps) {
  return (
    <div className="blog">
      <BlogHeader />

      <div className="blog-container">
        <aside>
          <CategoryList categories={categories || []} />
        </aside>

        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Layout Composition

Combine multiple layout components:

```typescript
// Composable layout pieces
function PageHeader({ title }: { title: string }) {
  return (
    <header>
      <h1>{title}</h1>
      <Navigation />
    </header>
  );
}

function PageSidebar({ children }: { children: any }) {
  return (
    <aside className="sidebar">
      {children}
    </aside>
  );
}

function PageContent({ children }: { children: any }) {
  return (
    <main className="content">
      {children}
    </main>
  );
}

// Compose into layout
export default function DashboardLayout({ children }: { children: any }) {
  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="layout-with-sidebar">
        <PageSidebar>
          <DashboardNav />
        </PageSidebar>

        <PageContent>
          {children}
        </PageContent>
      </div>
    </div>
  );
}
```

## Persistent Layouts

Layouts persist across route changes:

```typescript
// Layout state persists
export default function DashboardLayout({ children }: { children: any }) {
  const sidebarOpen = signal(true);

  // This state persists when navigating between dashboard pages!

  return (
    <div>
      <Sidebar isOpen={sidebarOpen()} />
      <button onClick={() => sidebarOpen.set(!sidebarOpen())}>
        Toggle Sidebar
      </button>

      <main>{children}</main>
    </div>
  );
}
```

## Layout Metadata

Set metadata in layouts:

```typescript
export const metadata = {
  title: {
    template: '%s | Dashboard',
    default: 'Dashboard'
  }
};

export default function DashboardLayout({ children }: { children: any }) {
  return (
    <div>
      <DashboardNav />
      {children}
    </div>
  );
}
```

## Route Groups with Layouts

Use route groups for different layouts:

```
src/pages/
  (marketing)/
    layout.tsx → Marketing layout
    index.tsx → Home
    about.tsx → About
    pricing.tsx → Pricing

  (app)/
    layout.tsx → App layout
    dashboard.tsx → Dashboard
    settings.tsx → Settings
```

```typescript
// src/pages/(marketing)/layout.tsx
export default function MarketingLayout({ children }: { children: any }) {
  return (
    <div>
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}

// src/pages/(app)/layout.tsx
export default function AppLayout({ children }: { children: any }) {
  return (
    <div>
      <AppHeader />
      <AppSidebar />
      {children}
    </div>
  );
}
```

## Loading States in Layouts

Show loading for nested content:

```typescript
import { Suspense } from 'philjs-core';

export default function DashboardLayout({ children }: { children: any }) {
  return (
    <div>
      <DashboardHeader />

      <Suspense fallback={<DashboardSkeleton />}>
        {children}
      </Suspense>
    </div>
  );
}
```

## Best Practices

### Keep Layouts Simple

```typescript
// ✅ Good - focused layout
export default function Layout({ children }) {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
}

// ❌ Too complex - extract components
export default function Layout({ children }) {
  // 200 lines of complex logic...
  return <div>{/* complex UI */}</div>;
}
```

### Extract Reusable Parts

```typescript
// ✅ Reusable pieces
<Header />
<Sidebar />
<Content>{children}</Content>
<Footer />
```

### Use Layout for Shared State

```typescript
// ✅ Sidebar state shared across pages
export default function Layout({ children }) {
  const sidebarOpen = signal(true);

  return (
    <div>
      <Sidebar isOpen={sidebarOpen()} />
      <main>{children}</main>
    </div>
  );
}
```

### Don't Fetch in Layouts

```typescript
// ❌ Don't fetch in layout (runs on every navigation)
export default function Layout({ children }) {
  effect(() => {
    fetch('/api/data'); // Runs repeatedly!
  });

  return <div>{children}</div>;
}

// ✅ Fetch in pages or use persistent cache
```

## Complete Examples

### Blog Layout

```typescript
export default function BlogLayout({ children }: { children: any }) {
  return (
    <div className="blog">
      <header className="blog-header">
        <h1>My Blog</h1>
        <nav>
          <Link href="/blog">All Posts</Link>
          <Link href="/blog/categories">Categories</Link>
          <Link href="/blog/about">About</Link>
        </nav>
      </header>

      <div className="blog-container">
        <aside className="blog-sidebar">
          <RecentPosts />
          <Categories />
          <Newsletter />
        </aside>

        <main className="blog-content">
          {children}
        </main>
      </div>

      <footer className="blog-footer">
        <p>&copy; 2024 My Blog</p>
      </footer>
    </div>
  );
}
```

### Dashboard Layout

```typescript
export default function DashboardLayout({ children }: { children: any }) {
  const sidebarCollapsed = signal(false);

  return (
    <div className="dashboard">
      <DashboardHeader
        onToggleSidebar={() => sidebarCollapsed.set(!sidebarCollapsed())}
      />

      <div className="dashboard-body">
        <DashboardSidebar collapsed={sidebarCollapsed()} />

        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Docs Layout

```typescript
export default function DocsLayout({ children }: { children: any }) {
  return (
    <div className="docs">
      <DocsHeader />

      <div className="docs-container">
        <aside className="docs-sidebar">
          <DocsSidebar />
        </aside>

        <main className="docs-content">
          {children}

          <PrevNextLinks />
        </main>

        <aside className="docs-toc">
          <TableOfContents />
        </aside>
      </div>
    </div>
  );
}
```

## Summary

You've learned:

✅ Creating basic layouts
✅ File-based layout system
✅ Nested layouts
✅ Conditional layouts
✅ Layout composition
✅ Persistent layout state
✅ Route groups for different layouts
✅ Best practices

Layouts keep your app organized and DRY!

---

**Next:** [Route Groups →](./route-groups.md) Organize routes without affecting URLs
