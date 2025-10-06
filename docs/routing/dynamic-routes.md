# Dynamic Routes

Handle dynamic URL segments like user IDs, product slugs, and category filters with dynamic routes.

## What You'll Learn

- Dynamic route parameters
- Multiple parameters
- Catch-all routes
- Optional parameters
- Type-safe parameters

## Basic Dynamic Routes

Use square brackets `[]` for dynamic segments:

```typescript
// src/pages/users/[id].tsx
import { useParams } from 'philjs-router';

export default function UserProfile() {
  const params = useParams<{ id: string }>();

  return (
    <div>
      <h1>User Profile</h1>
      <p>User ID: {params.id}</p>
    </div>
  );
}
```

**Routes:**
- `/users/1` → `params.id = "1"`
- `/users/john` → `params.id = "john"`
- `/users/abc-123` → `params.id = "abc-123"`

## Fetching Data with Params

```typescript
import { useParams } from 'philjs-router';
import { signal, effect } from 'philjs-core';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function UserProfile() {
  const params = useParams<{ id: string }>();
  const user = signal<User | null>(null);
  const loading = signal(true);

  effect(() => {
    loading.set(true);

    fetch(`/api/users/${params.id}`)
      .then(res => res.json())
      .then(data => {
        user.set(data);
        loading.set(false);
      });
  });

  if (loading()) return <div>Loading...</div>;
  if (!user()) return <div>User not found</div>;

  return (
    <div>
      <h1>{user()!.name}</h1>
      <p>{user()!.email}</p>
    </div>
  );
}
```

## Multiple Parameters

```typescript
// src/pages/[category]/[productId].tsx
import { useParams } from 'philjs-router';

export default function Product() {
  const params = useParams<{ category: string; productId: string }>();

  return (
    <div>
      <p>Category: {params.category}</p>
      <p>Product ID: {params.productId}</p>
    </div>
  );
}
```

**Routes:**
- `/electronics/laptop-123` → `{ category: "electronics", productId: "laptop-123" }`
- `/books/isbn-456` → `{ category: "books", productId: "isbn-456" }`

### Nested Parameters

```typescript
// src/pages/users/[userId]/posts/[postId].tsx
import { useParams } from 'philjs-router';

export default function UserPost() {
  const params = useParams<{ userId: string; postId: string }>();

  return (
    <div>
      <h1>Post {params.postId}</h1>
      <p>By user {params.userId}</p>
    </div>
  );
}
```

**Route:** `/users/123/posts/456`

## Catch-All Routes

Match multiple path segments:

```typescript
// src/pages/docs/[...slug].tsx
import { useParams } from 'philjs-router';

export default function Docs() {
  const params = useParams<{ slug: string[] }>();

  // /docs/getting-started → slug = ["getting-started"]
  // /docs/api/reference → slug = ["api", "reference"]
  // /docs/guides/routing/basics → slug = ["guides", "routing", "basics"]

  const path = params.slug.join('/');

  return (
    <div>
      <h1>Documentation</h1>
      <p>Path: {path}</p>
    </div>
  );
}
```

### Load Content from Catch-All

```typescript
import { useParams } from 'philjs-router';
import { signal, effect } from 'philjs-core';

export default function Docs() {
  const params = useParams<{ slug: string[] }>();
  const content = signal<string>('');

  effect(() => {
    const path = params.slug.join('/');

    fetch(`/api/docs/${path}`)
      .then(res => res.text())
      .then(html => content.set(html));
  });

  return (
    <article dangerouslySetInnerHTML={{ __html: content() }} />
  );
}
```

## Optional Catch-All

Match zero or more segments:

```typescript
// src/pages/shop/[[...slug]].tsx
// Note: double brackets

export default function Shop() {
  const params = useParams<{ slug?: string[] }>();

  // /shop → slug = undefined
  // /shop/electronics → slug = ["electronics"]
  // /shop/electronics/laptops → slug = ["electronics", "laptops"]

  const category = params.slug?.[0];
  const subcategory = params.slug?.[1];

  return (
    <div>
      <h1>Shop</h1>
      {category && <p>Category: {category}</p>}
      {subcategory && <p>Subcategory: {subcategory}</p>}
    </div>
  );
}
```

## Type-Safe Parameters

Define strict types for params:

```typescript
// types/routes.ts
export interface UserParams {
  id: string;
}

export interface ProductParams {
  category: string;
  productId: string;
}

export interface DocsParams {
  slug: string[];
}
```

```typescript
// src/pages/users/[id].tsx
import type { UserParams } from '@/types/routes';
import { useParams } from 'philjs-router';

export default function UserProfile() {
  const params = useParams<UserParams>();

  // params.id is typed as string
  // TypeScript knows what properties exist

  return <div>User {params.id}</div>;
}
```

## Parsing and Validating

### Parse Numeric IDs

```typescript
export default function UserProfile() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id, 10);

  if (isNaN(userId)) {
    return <div>Invalid user ID</div>;
  }

  return <div>User {userId}</div>;
}
```

### Validate Parameters

```typescript
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.string().regex(/^\d+$/), // Only numbers
  slug: z.string().min(1).max(100)
});

export default function Page() {
  const params = useParams();

  const result = ParamsSchema.safeParse(params);

  if (!result.success) {
    return <div>Invalid parameters</div>;
  }

  const { id, slug } = result.data;

  return <div>{id} - {slug}</div>;
}
```

## Route Patterns

### Blog Post

```typescript
// src/pages/blog/[slug].tsx
import { useParams, Link } from 'philjs-router';
import { signal, effect } from 'philjs-core';

interface Post {
  slug: string;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = signal<Post | null>(null);

  effect(() => {
    fetch(`/api/posts/${params.slug}`)
      .then(res => res.json())
      .then(data => post.set(data));
  });

  if (!post()) return <div>Loading...</div>;

  const p = post()!;

  return (
    <article>
      <Link href="/blog">← Back to Blog</Link>

      <h1>{p.title}</h1>
      <p>By {p.author} on {new Date(p.publishedAt).toLocaleDateString()}</p>

      <div dangerouslySetInnerHTML={{ __html: p.content }} />
    </article>
  );
}
```

### E-commerce Product

```typescript
// src/pages/products/[id].tsx
import { useParams } from 'philjs-router';
import { signal, effect } from 'philjs-core';

export default function Product() {
  const params = useParams<{ id: string }>();
  const product = signal(null);

  effect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => product.set(data));
  });

  if (!product()) return <ProductSkeleton />;

  const p = product()!;

  return (
    <div>
      <img src={p.image} alt={p.name} />
      <h1>{p.name}</h1>
      <p>${p.price}</p>
      <button>Add to Cart</button>
    </div>
  );
}
```

### User Dashboard

```typescript
// src/pages/dashboard/[section].tsx
import { useParams } from 'philjs-router';

export default function DashboardSection() {
  const params = useParams<{ section: string }>();

  const renderSection = () => {
    switch (params.section) {
      case 'overview':
        return <Overview />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <NotFound />;
    }
  };

  return (
    <div>
      <DashboardNav currentSection={params.section} />
      {renderSection()}
    </div>
  );
}
```

## Static Generation with Dynamic Routes

Generate pages at build time:

```typescript
// src/pages/blog/[slug].tsx
export async function generateStaticParams() {
  // Fetch all blog post slugs
  const posts = await fetch('https://api.example.com/posts')
    .then(res => res.json());

  // Return array of params
  return posts.map((post: any) => ({
    slug: post.slug
  }));
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();

  // This page will be pre-rendered for each slug
  return <div>Post: {params.slug}</div>;
}
```

## Programmatic Navigation with Params

```typescript
import { useRouter } from 'philjs-router';

function ProductCard({ product }) {
  const router = useRouter();

  const viewProduct = () => {
    router.push(`/products/${product.id}`);
  };

  return (
    <div onClick={viewProduct}>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  );
}
```

## Best Practices

### Use Descriptive Parameter Names

```typescript
// ❌ Generic
src/pages/[id].tsx

// ✅ Descriptive
src/pages/users/[userId].tsx
src/pages/posts/[postSlug].tsx
```

### Validate Parameters

```typescript
export default function Page() {
  const params = useParams<{ id: string }>();

  // Validate before using
  if (!/^\d+$/.test(params.id)) {
    return <InvalidId />;
  }

  // Safe to use
  const id = parseInt(params.id);
}
```

### Handle Missing Data

```typescript
export default function Product() {
  const params = useParams<{ id: string }>();
  const product = signal(null);
  const error = signal(false);

  effect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => product.set(data))
      .catch(() => error.set(true));
  });

  if (error()) return <ProductNotFound />;
  if (!product()) return <Loading />;

  return <ProductView product={product()!} />;
}
```

## Summary

You've learned:

✅ Dynamic route parameters with [param]
✅ Multiple and nested parameters
✅ Catch-all routes with [...slug]
✅ Optional catch-all with [[...slug]]
✅ Type-safe parameter handling
✅ Parsing and validation
✅ Common route patterns
✅ Static generation with dynamic routes
✅ Best practices

Dynamic routes power most real-world applications!

---

**Next:** [Navigation →](./navigation.md) Master client-side navigation and links
