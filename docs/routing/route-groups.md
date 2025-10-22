# Route Groups

Organize your routes into logical groups without affecting the URL structure.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). High-level helpers mentioned here (for example `useParams()` or `<Router>`) are part of the planned ergonomic API and appear for conceptual guidance.

## What You'll Learn

- Creating route groups
- Organizing by feature
- Multiple layouts with groups
- Shared components
- Group-specific middleware
- Best practices

## What are Route Groups?

Route groups let you organize files without adding segments to the URL:

```
src/pages/
  (marketing)/
    about.tsx → /about (not /marketing/about)
    pricing.tsx → /pricing
  (app)/
    dashboard.tsx → /dashboard (not /app/dashboard)
```

**Folders in parentheses don't appear in URLs.**

## Creating Route Groups

Use parentheses in folder names:

```
src/pages/
  (auth)/
    login.tsx → /login
    signup.tsx → /signup
    forgot-password.tsx → /forgot-password
  (shop)/
    products.tsx → /products
    cart.tsx → /cart
    checkout.tsx → /checkout
```

## Multiple Layouts

Different route groups can have different layouts:

```
src/pages/
  (marketing)/
    layout.tsx → Marketing layout
    index.tsx → /
    about.tsx → /about
    pricing.tsx → /pricing
  (app)/
    layout.tsx → App layout
    dashboard.tsx → /dashboard
    settings.tsx → /settings
  (docs)/
    layout.tsx → Docs layout
    index.tsx → /docs
    [...slug].tsx → /docs/*
```

### Marketing Layout

```typescript
// src/pages/(marketing)/layout.tsx
export default function MarketingLayout({ children }: { children: any }) {
  return (
    <div className="marketing">
      <header className="marketing-header">
        <Logo />
        <nav>
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Login</Link>
        </nav>
      </header>

      <main className="marketing-content">
        {children}
      </main>

      <footer className="marketing-footer">
        <p>&copy; 2024 My Company</p>
        <SocialLinks />
      </footer>
    </div>
  );
}
```

### App Layout

```typescript
// src/pages/(app)/layout.tsx
export default function AppLayout({ children }: { children: any }) {
  return (
    <div className="app">
      <header className="app-header">
        <Logo />
        <UserMenu />
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <nav>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/analytics">Analytics</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </aside>

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Docs Layout

```typescript
// src/pages/(docs)/layout.tsx
export default function DocsLayout({ children }: { children: any }) {
  return (
    <div className="docs">
      <DocsHeader />

      <div className="docs-container">
        <aside className="docs-nav">
          <DocsSidebar />
        </aside>

        <main className="docs-main">
          {children}
        </main>

        <aside className="docs-toc">
          <TableOfContents />
        </aside>
      </div>
    </div>
  );
}
```

## Organizing by Feature

Group related functionality together:

```
src/pages/
  (auth)/
    login.tsx
    signup.tsx
    reset-password.tsx
    verify-email.tsx
    components/
      AuthForm.tsx
      SocialLogin.tsx
    utils/
      validation.ts
  (blog)/
    index.tsx → /blog
    [slug].tsx → /blog/:slug
    components/
      BlogCard.tsx
      CategoryFilter.tsx
    utils/
      formatDate.ts
  (ecommerce)/
    products.tsx → /products
    [productId].tsx → /products/:id
    cart.tsx → /cart
    checkout.tsx → /checkout
    components/
      ProductCard.tsx
      CartItem.tsx
```

## Nested Route Groups

Route groups can be nested:

```
src/pages/
  (app)/
    (admin)/
      users.tsx → /users
      settings.tsx → /settings
    (user)/
      profile.tsx → /profile
      preferences.tsx → /preferences
```

Both admin and user routes render under `/`, but are organized separately.

## Shared Components

Keep group-specific components together:

```
src/pages/
  (dashboard)/
    layout.tsx
    index.tsx
    analytics.tsx
    components/
      DashboardCard.tsx
      StatWidget.tsx
      Chart.tsx
    hooks/
      useDashboardData.ts
    utils/
      formatMetrics.ts
```

Import shared components within the group:

```typescript
// src/pages/(dashboard)/index.tsx
import DashboardCard from './components/DashboardCard';
import StatWidget from './components/StatWidget';
import { useDashboardData } from './hooks/useDashboardData';

export default function Dashboard() {
  const data = useDashboardData();

  return (
    <div className="dashboard-grid">
      <DashboardCard title="Revenue">
        <StatWidget value={data.revenue} />
      </DashboardCard>

      <DashboardCard title="Users">
        <StatWidget value={data.users} />
      </DashboardCard>
    </div>
  );
}
```

## Group-Specific Middleware

Apply middleware to route groups:

```typescript
// src/pages/(admin)/layout.tsx
import { useRouter } from 'philjs-router';
import { useUser } from '@/hooks/useUser';

export default function AdminLayout({ children }: { children: any }) {
  const router = useRouter();
  const user = useUser();

  // Protect all admin routes
  if (!user() || user()!.role !== 'admin') {
    router.replace('/unauthorized');
    return null;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  );
}
```

## Combining Route Groups

Mix route groups with regular routes:

```
src/pages/
  index.tsx → / (no group)
  (marketing)/
    about.tsx → /about
    pricing.tsx → /pricing
  (app)/
    dashboard.tsx → /dashboard
  blog/
    index.tsx → /blog (no group)
    [slug].tsx → /blog/:slug
```

## Multiple Root Layouts

Use route groups for completely different app sections:

```
src/pages/
  (site)/
    layout.tsx → Public site layout
    index.tsx → /
    about.tsx → /about
  (admin)/
    layout.tsx → Admin layout
    dashboard.tsx → /dashboard
    users.tsx → /users
  (docs)/
    layout.tsx → Documentation layout
    index.tsx → /docs
```

Each group gets its own `<html>` and `<body>`:

```typescript
// src/pages/(site)/layout.tsx
export default function SiteLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <head>
        <title>My Site</title>
      </head>
      <body className="site">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
```

```typescript
// src/pages/(admin)/layout.tsx
export default function AdminLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <head>
        <title>Admin Panel</title>
      </head>
      <body className="admin">
        <AdminHeader />
        <AdminSidebar />
        {children}
      </body>
    </html>
  );
}
```

## Route Groups with Dynamic Routes

Combine groups and dynamic routes:

```
src/pages/
  (shop)/
    products/
      index.tsx → /products
      [id].tsx → /products/:id
    categories/
      [category].tsx → /categories/:category
    cart.tsx → /cart
```

```typescript
// src/pages/(shop)/products/[id].tsx
import { useParams } from 'philjs-router';

export default function Product() {
  const params = useParams<{ id: string }>();

  // Still renders at /products/:id
  // But organized in (shop) group

  return <div>Product {params.id}</div>;
}
```

## Conditional Layouts by Group

```typescript
// src/pages/(public)/layout.tsx
export default function PublicLayout({ children }: { children: any }) {
  return (
    <div>
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}

// src/pages/(authenticated)/layout.tsx
import { useRouter } from 'philjs-router';
import { useUser } from '@/hooks/useUser';

export default function AuthenticatedLayout({ children }: { children: any }) {
  const router = useRouter();
  const user = useUser();

  if (!user()) {
    router.replace('/login');
    return null;
  }

  return (
    <div>
      <AuthHeader user={user()!} />
      <Sidebar />
      {children}
    </div>
  );
}
```

## Complete Example

E-commerce site with multiple sections:

```
src/pages/
  (storefront)/
    layout.tsx
    index.tsx → /
    about.tsx → /about
    contact.tsx → /contact

  (shop)/
    layout.tsx
    products/
      index.tsx → /products
      [id].tsx → /products/:id
    categories/
      [category].tsx → /categories/:category
    cart.tsx → /cart
    checkout.tsx → /checkout

  (account)/
    layout.tsx
    dashboard.tsx → /dashboard
    orders.tsx → /orders
    settings.tsx → /settings
    profile.tsx → /profile

  (admin)/
    layout.tsx
    dashboard.tsx → /admin/dashboard
    products.tsx → /admin/products
    orders.tsx → /admin/orders
    users.tsx → /admin/users
```

### Storefront Layout

```typescript
// src/pages/(storefront)/layout.tsx
export default function StorefrontLayout({ children }: { children: any }) {
  return (
    <div className="storefront">
      <header>
        <Logo />
        <nav>
          <Link href="/">Home</Link>
          <Link href="/products">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/cart">Cart</Link>
        </nav>
      </header>

      <main>{children}</main>

      <footer>
        <Newsletter />
        <FooterLinks />
      </footer>
    </div>
  );
}
```

### Shop Layout

```typescript
// src/pages/(shop)/layout.tsx
export default function ShopLayout({ children }: { children: any }) {
  return (
    <div className="shop">
      <ShopHeader />

      <div className="shop-container">
        <aside className="shop-filters">
          <CategoryFilter />
          <PriceFilter />
          <BrandFilter />
        </aside>

        <main className="shop-content">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Account Layout

```typescript
// src/pages/(account)/layout.tsx
import { useRouter } from 'philjs-router';
import { useUser } from '@/hooks/useUser';

export default function AccountLayout({ children }: { children: any }) {
  const router = useRouter();
  const user = useUser();

  if (!user()) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="account">
      <AccountHeader user={user()!} />

      <div className="account-container">
        <aside className="account-nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/profile">Profile</Link>
        </aside>

        <main className="account-content">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Best Practices

### Use Groups for Organization

```typescript
// ✅ Good - organized by feature
src/pages/
  (auth)/
    login.tsx
    signup.tsx
  (blog)/
    index.tsx
    [slug].tsx

// ❌ Cluttered - all files together
src/pages/
  login.tsx
  signup.tsx
  blog.tsx
  blog-post.tsx
```

### Group Related Components

```typescript
// ✅ Keep components with their routes
src/pages/
  (dashboard)/
    index.tsx
    components/
      DashboardCard.tsx

// ❌ Don't separate too much
src/
  pages/
    (dashboard)/
      index.tsx
  components/
    dashboard/
      DashboardCard.tsx
```

### Use Descriptive Group Names

```typescript
// ✅ Clear purpose
(marketing)
(authenticated)
(admin)
(docs)

// ❌ Vague or generic
(pages)
(routes)
(app1)
```

### Don't Over-Group

```typescript
// ❌ Too many nested groups
src/pages/
  (site)/
    (public)/
      (marketing)/
        (home)/
          index.tsx

// ✅ Simpler structure
src/pages/
  (marketing)/
    index.tsx
```

### Combine with Regular Folders

```typescript
// ✅ Mix groups and regular folders when needed
src/pages/
  (app)/
    dashboard/
      index.tsx
      analytics.tsx
  api/
    users.ts
```

## Common Patterns

### Auth vs Public

```
src/pages/
  (public)/
    index.tsx
    about.tsx
    pricing.tsx
  (auth)/
    dashboard.tsx
    settings.tsx
```

### Marketing vs App

```
src/pages/
  (marketing)/
    index.tsx
    features.tsx
    pricing.tsx
  (app)/
    dashboard.tsx
    workspace.tsx
```

### User Roles

```
src/pages/
  (user)/
    dashboard.tsx
    profile.tsx
  (admin)/
    users.tsx
    settings.tsx
  (superadmin)/
    system.tsx
    logs.tsx
```

## Summary

You've learned:

✅ Creating route groups with parentheses
✅ Organizing routes by feature
✅ Multiple layouts with groups
✅ Shared components within groups
✅ Group-specific middleware
✅ Combining groups with dynamic routes
✅ Best practices for organization

Route groups keep your codebase organized without affecting URLs!

---

**Next:** [Middleware →](./middleware.md) Protect routes and handle authentication
