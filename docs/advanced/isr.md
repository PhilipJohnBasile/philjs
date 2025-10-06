# Incremental Static Regeneration (ISR)

ISR allows you to update static content after build time without rebuilding the entire site.

## Basic ISR

### Revalidation Period

```tsx
// routes/blog/[slug].tsx
export const config = {
  revalidate: 60 // Revalidate every 60 seconds
};

export const loader = createDataLoader(async ({ params }) => {
  const post = await db.posts.findBySlug(params.slug);
  return { post };
});

export default function BlogPost({ data }) {
  return (
    <article>
      <h1>{data.post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.post.content }} />
    </article>
  );
}
```

## On-Demand Revalidation

### Trigger Revalidation

```tsx
// routes/api/revalidate.ts
export async function POST(request) {
  const { path } = await request.json();

  await revalidatePath(path);

  return new Response('Revalidated', { status: 200 });
}

// Trigger from webhook
async function handleWebhook(data) {
  await fetch('/api/revalidate', {
    method: 'POST',
    body: JSON.stringify({ path: `/blog/${data.slug}` })
  });
}
```

## Best Practices

### ✅ Do: Use for Dynamic Content

```tsx
// ✅ Good - content changes periodically
export const config = { revalidate: 3600 }; // 1 hour
```

## Next Steps

- [SSG](/docs/advanced/ssg.md) - Static generation
- [SSR](/docs/advanced/ssr.md) - Server rendering

---

💡 **Tip**: Use ISR for content that changes occasionally but needs to be fast.

ℹ️ **Note**: ISR provides the best of both SSG and SSR—fast and always fresh.
