# Tutorial: Creating a Blog Platform

This guide shows how to build a markdown-based blog with SEO and RSS support.

## 1. Static Content
We'll use standard markdown files in `content/posts`.

## 2. Reading Files
```typescript
import { readFileSync, readdirSync } from 'node:fs';
import { parseMarkdown } from '@philjs/common';

export function getPosts() {
  const files = readdirSync('./content/posts');
  return files.map(file => {
    const content = readFileSync(`./content/posts/${file}`, 'utf-8');
    return parseMarkdown(content);
  });
}
```

## 3. Blog Index Page
Use `getPosts` to render the list.

```tsx
export default function BlogIndex() {
  const posts = useLoader(getPosts);
  
  return (
    <div class="grid gap-4">
      {posts.map(post => (
        <PostCard key={post.slug} {...post} />
      ))}
    </div>
  );
}
```
