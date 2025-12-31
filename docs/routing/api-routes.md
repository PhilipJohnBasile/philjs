# API Routes

PhilJS pairs route loaders/actions with server handlers so you can colocate UI and API logic.

## Server Handler Basics

Use `@philjs/ssr` to map route modules to server endpoints. Each route module exported via `createAppRouter` appears in the manifest. For API-only endpoints, create files that export a default handler.

```ts
// routes/api/subscribe.ts
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = formData.get('email');
  await subscribeUser(email);
  return new Response(null, { status: 204 });
}
```

In your server entry (e.g., Vite middleware or Cloudflare worker) reuse the manifest:

```ts
import { createFetchHandler } from '@philjs/ssr';
import { routes } from './routes';

const handleRequest = createFetchHandler({ routes });
export default { fetch: handleRequest };
```

Now POST requests to `/api/subscribe` call the route action without duplicating wiring.

## UI Integration

On the client, use a form and let the action handle the submission. Afterwards, navigate programmatically or show a success message.

```tsx
import { useRouter } from '@philjs/router';

export function SubscribeForm({ navigate }: RouteComponentProps) {
  const { route } = useRouter();

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    await fetch('/api/subscribe?_action', {
      method: 'POST',
      body: formData,
    });
    await navigate('/thanks');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

> The `_action` query hint is optional but keeps semantics clear when you also have a loader.

## Response Helpers

Return any `Response` from a loader/action. Common patterns:

```ts
// Redirect
throw new Response('', { status: 302, headers: { Location: '/login' } });

// JSON helper
return Response.json({ message: 'ok' });

// Stream
const stream = new ReadableStream({ start(controller) { /* … */ } });
return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
```

## Error Handling

Errors thrown from actions bubble to the router. Catch them in error boundaries or return structured responses:

```ts
action: async ({ formData }) => {
  const title = formData.get('title');
  if (!title) {
    return Response.json({ error: 'Title is required' }, { status: 400 });
  }
  return createPost(title);
}
```

On the client, inspect `response.ok` to display validation errors without reloading.

## Deployment Targets

PhilJS ships adapters for Node, Edge, and workers. The same action/loader code runs in each environment—no need to maintain separate API routes.

Next, learn how to surface loader states in [Loading States](./loading-states.md) or defend routes with [Route Guards](./route-guards.md).
