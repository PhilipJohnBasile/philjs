# Loaders and Actions

Loaders fetch data before a route renders. Actions handle mutations and form submissions.

```tsx
import { createAppRouter, Form } from "@philjs/router";
import type { RouteComponentProps } from "@philjs/router";
import { Err, Ok } from "@philjs/core";

type Project = { id: string; name: string };

type ProjectsProps = RouteComponentProps & { data?: Project[] };

export function ProjectsRoute({ data = [] }: ProjectsProps) {
  return (
    <main>
      <h1>Projects</h1>
      <ul>
        {data.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
      <Form method="post">
        <input name="name" placeholder="New project" />
        <button type="submit">Create</button>
      </Form>
    </main>
  );
}

const routes = [
  {
    path: "/projects",
    loader: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) return Err(new Error("Failed to load projects"));
      return Ok(await res.json());
    },
    action: async ({ formData }) => {
      const name = String(formData.get("name") ?? "");
      if (!name.trim()) return;
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    },
    component: ProjectsRoute,
  },
];

createAppRouter({ target: "#app", routes });
```

## Loader data access

Route components receive `data` as a prop. Use the `RouteComponentProps` type for strong typing and consistent signatures.

## Caching and revalidation

- Set `staleTime` to avoid refetching on every navigation.
- Tag caches and invalidate precisely after mutations:

```tsx
const loader = loader(async ({ params, cache }) => {
  const projects = await listProjects(params.orgId);
  cache.tag(['projects', params.orgId]);
  cache.revalidate(30); // seconds
  return { projects };
});

const action = action(async ({ formData, cache }) => {
  await createProject(formData);
  cache.invalidate(['projects']); // or ['projects', orgId]
});
```

## Error handling and redirects

- Throw `redirect("/login")` for auth failures.
- Throw errors to hit route or layout error boundaries.
- Return typed error results with `Err` to show inline validation issues.

```tsx
if (!user) throw redirect('/login');
if (!name) return Err(new Error('Name is required'));
```

## Forms and progressive enhancement

`<Form method="post">` works with or without JavaScript enabled. Pair with actions for server-trustable mutations.

- Use `formData` for simple payloads; parse with Zod/Valibot.
- Return `Err` for validation and show inline messages in the component.
- For file uploads, stream to storage in the action; return progress via SSE/WebSockets if needed.

## Optimistic UI

Enable `optimistic: true` and update client state instantly, then reconcile on success/failure. Roll back on errors and show a toast or inline error.

## Testing loaders/actions

- Unit-test loaders with mock fetchers and fake `cache`/`signal`.
- Use MSW for integration tests to match server responses.
- In Playwright, submit forms and assert SSR + hydration produce consistent results.

## Performance tips

- Dedupe in-flight loader requests when multiple components share the same data.
- Paginate aggressively; avoid loading large lists at once.
- Coalesce invalidations to avoid cache stampedes.
- Use `signal` to cancel stale requests on rapid navigation.
- For long polls or SSE, keep them outside loader unless you need SSR data; hydrate client-only streams after first paint.

## Advanced patterns

- **Parallel loaders**: use `Promise.all` inside loader to fetch multiple resources concurrently.
- **Dependent loaders**: fetch metadata first, then secondary calls based on results; keep fallback UI for the slower part.
- **Partial errors**: return partial data + error object to render degraded UI instead of blank screens.
- **Mutation side-effects**: after action success, invalidate caches and emit analytics/log events with context.

## Offline and retries

- Pair loaders with `@philjs/offline` to read from IndexedDB when offline.
- Add retry/backoff logic for flaky endpoints; show retry UI in the component.

## Security reminders

- Do not trust `formData`; validate and sanitize on the server.
- Strip dangerous keys (`__proto__`, `constructor`) from JSON payloads.
- Enforce auth/permission checks at the loader/action boundary, not just in the UI.

## Checklist

- [ ] Validate inputs in actions; never trust the client.
- [ ] Tag caches and invalidate surgically.
- [ ] Use `staleTime` + `revalidate` for predictable freshness.
- [ ] Redirect early for auth/permissions.
- [ ] Cover loader/action happy/error paths with tests (Vitest + MSW/Playwright).


