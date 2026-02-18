# Error Handling

PhilJS Router implements a "Route Error Boundary" pattern, inspired by Remix and React Router. Errors bubble up to the nearest error boundary, allowing granular error handling without crashing the entire app.

## Error Boundaries

Any route module can export an `ErrorBoundary` component. If an error occurs during loading, action execution, or rendering of that route (or its children), this component is rendered instead of the route component.

```typescript
// src/routes/dashboard.tsx

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="error-container">
      <h1>Dashboard Error</h1>
      <p>{error.message}</p>
    </div>
  );
}
```

## `useRouteError`

The `useRouteError` hook provides access to the error that was caught.

```typescript
import { useRouteError, isRouteErrorResponse } from '@philjs/router';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    // Handle specific HTTP errors (404, 401, 503)
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  // Handle unexpected code errors
  return <h1>Something went wrong: {error.message}</h1>;
}
```

## Throwing Errors

You can throw `Response` objects (or `RouteErrorResponse` objects) from loaders and actions to trigger error boundaries with specific status codes.

```typescript
import { throwNotFound, throwForbidden } from '@philjs/router';

export async function loader({ params }) {
  const project = await db.getProject(params.id);

  if (!project) {
    throwNotFound("Project not found");
  }

  if (!project.canView(currentUser)) {
    throwForbidden("You don't have access to this project");
  }

  return project;
}
```

## Nested Error Boundaries

Error boundaries nest just like routes.

1.  If `/users/123/edit` throws an error...
2.  It looks for an `ErrorBoundary` in `edit.tsx`.
3.  If not found, it looks in `users.tsx` (or parent layout).
4.  If not found, it bubbles to the root `root.tsx`.

This ensures that a failure in a specific widget (like a "Recent Comments" sidebar) doesn't break the main page content if the sidebar has its own error boundary.

## Recovery

For enhanced error handling with retry logic:

```typescript
import { createNestedErrorBoundary, withErrorRecovery } from '@philjs/router';

// Auto-retry fetch operations
export async function loader() {
  return await withErrorRecovery(() => fetch('/api/unreliable'), {
    maxRetries: 3,
    retryDelay: 500
  });
}
```
