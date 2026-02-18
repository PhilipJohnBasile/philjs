# Route Groups

Route Groups allow you to organize your routes into logical folders without affecting the URL structure. This is particularly useful for applying shared layouts or middleware to a subset of routes.

## Directory Structure

To create a route group, wrap the folder name in parentheses: `(groupName)`.

```
src/routes/
├── (marketing)/      -> Group: marketing
│   ├── about.tsx     -> /about
│   ├── contact.tsx   -> /contact
│   └── layout.tsx    -> Shared marketing layout
├── (app)/            -> Group: app
│   ├── dashboard.tsx -> /dashboard
│   ├── settings.tsx  -> /settings
│   └── layout.tsx    -> Shared dashboard layout
└── index.tsx         -> /
```

## Features

### Shared Layouts

Any `layout.tsx` inside a group folder automatically wraps all routes within that group.

```typescript
// (marketing)/layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <div className="marketing-theme">
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
```

### Shared Middleware

You can attach middleware to a group to run checks (like authentication) for all enclosed routes.

```typescript
// (app)/layout.tsx
import { createAuthMiddleware } from '@philjs/router';

export const middleware = [
  createAuthMiddleware(async (req) => {
    const session = await getSession(req);
    return !!session;
  }, '/login')
];
```

### Nested Groups

Groups can be nested to create complex hierarchies.

```
(admin)/
  (settings)/
    profile.tsx  -> /profile
```

In this case, `profile.tsx` is wrapped by both the `(admin)` layout AND the `(settings)` layout.

## programmatic Usage

You can also define groups manually using the `createRouteGroup` API.

```typescript
import { createRouteGroup } from '@philjs/router';

const marketingGroup = createRouteGroup('marketing', {
  layout: MarketingLayout,
  routes: [
    { path: '/about', component: About },
    { path: '/contact', component: Contact }
  ]
});
```
