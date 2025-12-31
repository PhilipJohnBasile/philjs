# Loaders and Actions

Loaders run on the server to fetch data before rendering. Actions handle mutations.

```tsx
import { defineLoader, defineAction } from "@philjs/ssr";

export const loader = defineLoader(async ({ db }) => {
  const posts = await db.post.all();
  return { posts };
});

export const action = defineAction(async ({ request, db }) => {
  const form = await request.formData();
  await db.post.create({ title: String(form.get("title")) });
  return { ok: true };
});
```
