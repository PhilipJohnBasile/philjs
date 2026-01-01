# Advanced Routing Patterns

Go beyond basics with nested layouts, route guards, progressive data, and navigation UX polish.

## Layouts and nested routes

- Use parent layouts to share chrome/navigation and wrap children with `Outlet`.
- Co-locate loaders/actions with child routes; parent loaders can fetch shared data (user/session).
- Provide `errorBoundary` at layout level to catch both parent and child failures.

```tsx
const routes = [
  {
    path: '/dashboard',
    loader: sessionLoader,
    component: DashboardLayout,
    children: [
      { path: '/', component: Overview },
      { path: '/billing', loader: billingLoader, component: Billing },
    ],
  },
];
```

## Route guards

- Add guards in loaders for auth/feature flags/roles.
- Extract guard helpers to avoid duplication:

```tsx
function requireRole(user, role) {
  if (!user || !user.roles.includes(role)) throw redirect('/login');
}
```

- Combine with `prefetch` for authenticated sections to reduce post-login latency.

## Progressive data and partial hydration

- Fetch fast data in the route loader; defer slow panels to resources inside the component.
- Stream SSR HTML so above-the-fold content paints immediately.
- Hydrate heavy panels as islands with `visible` or `on interaction` strategies.

## Search params and filters

- Parse `request.url` in loaders; normalize filters and validate.
- Keep filter state in the URL for shareability; sync signals with search params.
- Debounce filter updates; prefetch list routes when filters change.

## Prefetch and transitions

- Prefetch on hover/visibility for primary nav.
- Show pending UI during navigation; expose progress bars or skeletons.
- Preserve/restore scroll between routes; maintain focus for accessibility.

## Error boundaries

- Use granular boundaries to isolate failures (e.g., chart panel vs entire page).
- Render retry buttons and diagnostic text in dev builds.
- Log errors with route id, params, and request id.

## Testing advanced routes

- Unit-test guard helpers and loader parsing.
- Integration tests with MSW to cover success/error/redirect paths.
- Playwright E2E: verify scroll restoration, focus management, and prefetch reduces latency.

## Checklist

- [ ] Layouts wrap children; shared data fetched once.
- [ ] Guards centralized; redirects early.
- [ ] Search params validated; filter state in URL.
- [ ] Prefetch + pending UI for key transitions.
- [ ] Error boundaries scoped to panels.

