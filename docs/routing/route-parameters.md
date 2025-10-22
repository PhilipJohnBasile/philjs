# Route Parameters

Route parameters allow you to create dynamic routes that match patterns in URLs. PhilJS makes it easy to extract and use these parameters in your components.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). High-level helpers such as `useParams()` referenced in this guide belong to the planned ergonomic API and are shown for conceptual guidance.

## Dynamic Segments

### Basic Parameters

Create dynamic routes using brackets `[param]`:

```tsx
// routes/users/[id].tsx
import { useParams } from 'philjs-router';

export default function UserProfile() {
  const params = useParams<{ id: string }>();

  return (
    <div>
      <h1>User Profile</h1>
      <p>Viewing user: {params.id}</p>
    </div>
  );
}

// Matches:
// /users/1 → params.id = "1"
// /users/alice → params.id = "alice"
// /users/123abc → params.id = "123abc"
```

### Type-Safe Parameters

```tsx
import { useParams } from 'philjs-router';

interface UserParams {
  id: string;
}

export default function UserProfile() {
  const params = useParams<UserParams>();

  // TypeScript knows params.id exists and is a string
  const userId = parseInt(params.id, 10);

  return <div>User ID: {userId}</div>;
}
```

### Multiple Parameters

```tsx
// routes/blog/[category]/[slug].tsx
import { useParams } from 'philjs-router';

interface PostParams {
  category: string;
  slug: string;
}

export default function BlogPost() {
  const params = useParams<PostParams>();

  return (
    <div>
      <h1>Blog Post</h1>
      <p>Category: {params.category}</p>
      <p>Slug: {params.slug}</p>
    </div>
  );
}

// Matches:
// /blog/tech/react-hooks → { category: "tech", slug: "react-hooks" }
// /blog/design/ui-patterns → { category: "design", slug: "ui-patterns" }
```

## Catch-All Routes

### Basic Catch-All

Use `[...param]` to match multiple segments:

```tsx
// routes/docs/[...path].tsx
import { useParams } from 'philjs-router';

export default function Docs() {
  const params = useParams<{ path: string }>();

  // path is a string with segments joined by /
  const segments = params.path.split('/');

  return (
    <div>
      <h1>Documentation</h1>
      <p>Full path: {params.path}</p>
      <ul>
        {segments.map((segment, i) => (
          <li key={i}>{segment}</li>
        ))}
      </ul>
    </div>
  );
}

// Matches:
// /docs/getting-started → path = "getting-started"
// /docs/api/core/signals → path = "api/core/signals"
// /docs/guides/tutorials/first-app → path = "guides/tutorials/first-app"
```

### Optional Catch-All

Use `[[...param]]` for optional catch-all:

```tsx
// routes/shop/[[...categories]].tsx
import { useParams } from 'philjs-router';

export default function Shop() {
  const params = useParams<{ categories?: string }>();

  const categories = params.categories
    ? params.categories.split('/')
    : [];

  return (
    <div>
      <h1>Shop</h1>
      {categories.length === 0 ? (
        <p>All Products</p>
      ) : (
        <p>Categories: {categories.join(' > ')}</p>
      )}
    </div>
  );
}

// Matches:
// /shop → categories = undefined (all products)
// /shop/electronics → categories = "electronics"
// /shop/electronics/phones → categories = "electronics/phones"
```

## Loading Data with Parameters

### Server-Side Data Loading

```tsx
// routes/products/[id].tsx
import { createDataLoader } from 'philjs-router';

export const loader = createDataLoader(async ({ params }) => {
  const product = await db.products.findById(params.id);

  if (!product) {
    throw new Response('Not Found', { status: 404 });
  }

  return { product };
});

export default function Product({ data }) {
  return (
    <div>
      <h1>{data.product.name}</h1>
      <p>{data.product.description}</p>
      <p>${data.product.price}</p>
    </div>
  );
}
```

### Client-Side Data Loading

```tsx
import { useParams } from 'philjs-router';
import { signal, effect } from 'philjs-core';

export default function Product() {
  const params = useParams<{ id: string }>();
  const product = signal(null);
  const loading = signal(true);

  effect(() => {
    const productId = params.id;

    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        product.set(data);
        loading.set(false);
      });
  });

  if (loading()) return <div>Loading...</div>;

  return (
    <div>
      <h1>{product().name}</h1>
      <p>{product().description}</p>
    </div>
  );
}
```

## Parameter Validation

### Type Validation

```tsx
import { useParams, redirect } from 'philjs-router';

export default function UserProfile() {
  const params = useParams<{ id: string }>();

  // Validate parameter format
  const userId = parseInt(params.id, 10);

  if (isNaN(userId)) {
    redirect('/404');
    return null;
  }

  return <div>Valid User ID: {userId}</div>;
}
```

### Schema Validation

```tsx
import { useParams } from 'philjs-router';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
  slug: z.string().min(1).max(100)
});

export default function Post() {
  const params = useParams();

  // Validate with Zod
  const result = ParamsSchema.safeParse(params);

  if (!result.success) {
    return <div>Invalid parameters</div>;
  }

  const { id, slug } = result.data;

  return (
    <div>
      <p>ID: {id}</p>
      <p>Slug: {slug}</p>
    </div>
  );
}
```

## Parameter Encoding

### URL Encoding

```tsx
import { useParams } from 'philjs-router';

export default function Search() {
  const params = useParams<{ query: string }>();

  // Decode URL-encoded parameter
  const decodedQuery = decodeURIComponent(params.query);

  return (
    <div>
      <h1>Search Results</h1>
      <p>Query: {decodedQuery}</p>
    </div>
  );
}

// URL: /search/hello%20world → query = "hello world"
// URL: /search/%E4%BD%A0%E5%A5%BD → query = "你好"
```

### Special Characters

```tsx
import { Link } from 'philjs-router';

function SearchForm() {
  const query = signal('');

  const handleSearch = () => {
    const encoded = encodeURIComponent(query());
    navigate(`/search/${encoded}`);
  };

  return (
    <div>
      <input
        value={query()}
        onInput={(e) => query.set(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
}
```

## Nested Parameters

### Parent-Child Parameters

```tsx
// routes/organizations/[orgId]/projects/[projectId].tsx
import { useParams } from 'philjs-router';

interface Params {
  orgId: string;
  projectId: string;
}

export default function Project() {
  const params = useParams<Params>();

  return (
    <div>
      <h1>Project Details</h1>
      <p>Organization: {params.orgId}</p>
      <p>Project: {params.projectId}</p>
    </div>
  );
}

// URL: /organizations/acme/projects/website
// params = { orgId: "acme", projectId: "website" }
```

### Accessing Parent Parameters

```tsx
// routes/organizations/[orgId]/_layout.tsx
import { useParams } from 'philjs-router';

export default function OrgLayout({ children }) {
  const params = useParams<{ orgId: string }>();

  return (
    <div>
      <nav>
        <Link href={`/organizations/${params.orgId}`}>Overview</Link>
        <Link href={`/organizations/${params.orgId}/projects`}>Projects</Link>
        <Link href={`/organizations/${params.orgId}/settings`}>Settings</Link>
      </nav>

      {children}
    </div>
  );
}
```

## Query String Parameters

### Combining Route and Query Params

```tsx
import { useParams, useSearchParams } from 'philjs-router';

export default function ProductList() {
  const params = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();

  const category = params.category;
  const page = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || 'name';

  return (
    <div>
      <h1>{category} Products</h1>
      <p>Page: {page}</p>
      <p>Sort: {sort}</p>
    </div>
  );
}

// URL: /products/electronics?page=2&sort=price
// params.category = "electronics"
// searchParams.page = "2"
// searchParams.sort = "price"
```

### Building URLs with Parameters

```tsx
import { Link } from 'philjs-router';

function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <Link
        href={`/products/${product.category}/${product.id}?ref=listing`}
      >
        View Details
      </Link>
    </div>
  );
}
```

## Parameter Patterns

### Optional Parameters

```tsx
// routes/blog/[[year]]/[[month]]/[[day]].tsx
import { useParams } from 'philjs-router';

export default function BlogArchive() {
  const params = useParams();

  const { year, month, day } = params;

  if (day && month && year) {
    return <div>Posts on {year}-{month}-{day}</div>;
  }

  if (month && year) {
    return <div>Posts in {year}-{month}</div>;
  }

  if (year) {
    return <div>Posts in {year}</div>;
  }

  return <div>All Posts</div>;
}

// Matches:
// /blog → all posts
// /blog/2024 → posts in 2024
// /blog/2024/03 → posts in March 2024
// /blog/2024/03/15 → posts on March 15, 2024
```

### Constrained Parameters

```tsx
// routes/users/[id]/[action].tsx
import { useParams, redirect } from 'philjs-router';

const VALID_ACTIONS = ['edit', 'delete', 'settings'];

export default function UserAction() {
  const params = useParams<{ id: string; action: string }>();

  if (!VALID_ACTIONS.includes(params.action)) {
    redirect(`/users/${params.id}`);
    return null;
  }

  return (
    <div>
      <h1>User {params.id}</h1>
      <p>Action: {params.action}</p>
    </div>
  );
}

// Valid:
// /users/123/edit
// /users/123/delete
// /users/123/settings

// Invalid (redirects):
// /users/123/invalid
// /users/123/foo
```

## Static Generation with Parameters

### Generate Static Paths

```tsx
// routes/blog/[slug].tsx
export async function generateStaticParams() {
  const posts = await db.posts.findAll();

  return posts.map(post => ({
    slug: post.slug
  }));
}

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

### Multiple Parameter Generation

```tsx
// routes/products/[category]/[id].tsx
export async function generateStaticParams() {
  const products = await db.products.findAll();

  return products.map(product => ({
    category: product.category,
    id: product.id.toString()
  }));
}
```

## Best Practices

### ✅ Do: Use Type-Safe Parameters

```tsx
// ✅ Good - typed parameters
const params = useParams<{ id: string; slug: string }>();

// ❌ Bad - untyped
const params = useParams();
```

### ✅ Do: Validate Parameters

```tsx
// ✅ Good - validate before use
const userId = parseInt(params.id, 10);
if (isNaN(userId)) {
  return <div>Invalid user ID</div>;
}

// ❌ Bad - assume valid
const userId = parseInt(params.id, 10);
fetchUser(userId); // Could be NaN!
```

### ✅ Do: Handle Missing Parameters

```tsx
// ✅ Good - handle undefined
const params = useParams();
const query = params.query || 'default';

// ❌ Bad - assume exists
const query = params.query.toLowerCase(); // Could crash!
```

### ❌ Don't: Expose Sensitive IDs

```tsx
// ❌ Bad - database IDs in URL
/users/12345/delete

// ✅ Good - use UUIDs or slugs
/users/550e8400-e29b-41d4-a716-446655440000/delete
/users/john-doe/delete
```

## Next Steps

- [Data Loading](/docs/routing/data-loading.md) - Load data based on parameters
- [Route Guards](/docs/routing/route-guards.md) - Protect routes with validation
- [Dynamic Routes](/docs/routing/dynamic-routes.md) - Advanced routing patterns
- [SEO](/docs/advanced/seo.md) - SEO with dynamic routes

---

💡 **Tip**: Use `generateStaticParams()` to pre-render dynamic routes at build time for better performance.

⚠️ **Warning**: Always validate and sanitize route parameters before using them in database queries or API calls.

ℹ️ **Note**: PhilJS automatically decodes URL parameters, so you don't need to call `decodeURIComponent()` manually.
