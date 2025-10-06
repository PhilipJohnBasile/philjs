# Islands Architecture

Islands architecture delivers minimal JavaScript by only hydrating interactive components.

## Creating Islands

### Island Directive

```tsx
// routes/blog/[slug].tsx
export default function BlogPost({ post }) {
  return (
    <article>
      {/* Static HTML - no JS */}
      <h1>{post.title}</h1>
      <p>By {post.author}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* Interactive island - includes JS */}
      <LikeButton postId={post.id} client:load />

      {/* Lazy island - loads when visible */}
      <Comments postId={post.id} client:visible />
    </article>
  );
}
```

### Island Directives

```tsx
// Load immediately on page load
<Counter client:load />

// Load when browser is idle
<Analytics client:idle />

// Load when element is visible
<HeavyComponent client:visible />

// Only run on client (no SSR)
<BrowserWidget client:only />
```

## Best Practices

### ✅ Do: Use Islands for Interactivity

```tsx
// ✅ Good - minimal JS for interactivity
<StaticContent />
<InteractiveWidget client:visible />
```

## Next Steps

- [Resumability](/docs/advanced/resumability.md) - Zero hydration
- [SSR](/docs/advanced/ssr.md) - Server rendering

---

💡 **Tip**: Use islands to ship 90% less JavaScript.

ℹ️ **Note**: Islands only load JavaScript for interactive parts of the page.
