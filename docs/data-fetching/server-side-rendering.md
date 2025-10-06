# Server-Side Rendering (SSR)

Render pages on the server for each request to handle dynamic, personalized content.

## What You'll Learn

- Server-side rendering basics
- Dynamic data fetching
- Personalization
- SSR vs SSG
- Performance optimization
- Best practices

## What is SSR?

Server-Side Rendering generates HTML on the server for each request:

**Benefits:**
- Always fresh data
- Personalized content
- SEO-friendly
- Security (hide API keys)

**Use for:**
- User dashboards
- Personalized pages
- Real-time data
- Search results
- Dynamic content

## Basic SSR

### Fetch on Server

```typescript
// src/pages/dashboard.tsx
export async function getServerSideProps() {
  // Runs on every request
  const stats = await fetchDashboardStats();

  return {
    props: { stats }
  };
}

export default function Dashboard({ stats }: { stats: Stats }) {
  return (
    <div>
      <h1>Dashboard</h1>
      <StatsWidget stats={stats} />
    </div>
  );
}
```

### With Request Context

```typescript
export async function getServerSideProps({ req, res }: {
  req: Request;
  res: Response;
}) {
  // Access request headers
  const userAgent = req.headers.get('user-agent');

  // Get cookies
  const token = getCookie(req, 'auth_token');

  // Set response headers
  res.headers.set('Cache-Control', 'private, max-age=0');

  const data = await fetchData(token);

  return {
    props: { data }
  };
}
```

## Authentication

### Protected Pages

```typescript
export async function getServerSideProps({ req }: { req: Request }) {
  const session = await getSession(req);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    };
  }

  const userData = await fetchUserData(session.userId);

  return {
    props: { userData }
  };
}

export default function Profile({ userData }: { userData: User }) {
  return (
    <div>
      <h1>Welcome, {userData.name}!</h1>
      <p>{userData.email}</p>
    </div>
  );
}
```

### Role-Based Access

```typescript
export async function getServerSideProps({ req }: { req: Request }) {
  const session = await getSession(req);

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const user = await fetchUser(session.userId);

  if (user.role !== 'admin') {
    return { redirect: { destination: '/unauthorized', permanent: false } };
  }

  const adminData = await fetchAdminData();

  return {
    props: { adminData }
  };
}

export default function AdminPanel({ adminData }: { adminData: any }) {
  return <AdminDashboard data={adminData} />;
}
```

## Personalization

### User-Specific Content

```typescript
export async function getServerSideProps({ req }: { req: Request }) {
  const session = await getSession(req);

  if (!session) {
    // Show generic content for guests
    const genericContent = await fetchGenericContent();
    return { props: { content: genericContent, isGuest: true } };
  }

  // Fetch personalized content
  const user = await fetchUser(session.userId);
  const recommendations = await fetchRecommendations(user.id);
  const recentlyViewed = await fetchRecentlyViewed(user.id);

  return {
    props: {
      user,
      recommendations,
      recentlyViewed,
      isGuest: false
    }
  };
}

export default function HomePage({ user, recommendations, recentlyViewed, isGuest }: {
  user?: User;
  recommendations?: Product[];
  recentlyViewed?: Product[];
  isGuest: boolean;
}) {
  if (isGuest) {
    return <GuestHomePage />;
  }

  return (
    <div>
      <h1>Welcome back, {user!.name}!</h1>
      <RecommendedProducts products={recommendations!} />
      <RecentlyViewed products={recentlyViewed!} />
    </div>
  );
}
```

### Geo-Location

```typescript
export async function getServerSideProps({ req }: { req: Request }) {
  // Get user's location from IP
  const ip = req.headers.get('x-forwarded-for') || req.socket.remoteAddress;
  const location = await getLocationFromIP(ip);

  // Fetch location-specific content
  const nearbyStores = await fetchNearbyStores(location);
  const localDeals = await fetchLocalDeals(location.city);

  return {
    props: {
      location,
      nearbyStores,
      localDeals
    }
  };
}

export default function StoreFinder({ location, nearbyStores, localDeals }: {
  location: Location;
  nearbyStores: Store[];
  localDeals: Deal[];
}) {
  return (
    <div>
      <h1>Stores near {location.city}</h1>
      <StoreList stores={nearbyStores} />
      <LocalDeals deals={localDeals} />
    </div>
  );
}
```

## Dynamic Content

### Search Results

```typescript
export async function getServerSideProps({ query }: { query: Record<string, any> }) {
  const searchQuery = query.q as string;
  const page = parseInt(query.page as string) || 1;

  if (!searchQuery) {
    return {
      props: { results: [], query: '' }
    };
  }

  const results = await searchProducts(searchQuery, page);

  return {
    props: {
      results,
      query: searchQuery,
      page
    }
  };
}

export default function SearchResults({ results, query, page }: {
  results: Product[];
  query: string;
  page: number;
}) {
  return (
    <div>
      <h1>Search results for "{query}"</h1>
      <p>{results.length} results found</p>

      <ProductGrid products={results} />

      <Pagination current={page} />
    </div>
  );
}
```

### Filtered Lists

```typescript
export async function getServerSideProps({ query }: { query: Record<string, any> }) {
  const category = query.category as string || 'all';
  const sort = query.sort as string || 'popular';
  const page = parseInt(query.page as string) || 1;

  const products = await fetchProducts({
    category,
    sort,
    page,
    limit: 20
  });

  const categories = await fetchCategories();

  return {
    props: {
      products,
      categories,
      filters: { category, sort, page }
    }
  };
}

export default function ProductList({ products, categories, filters }: {
  products: Product[];
  categories: Category[];
  filters: any;
}) {
  return (
    <div>
      <Filters categories={categories} current={filters} />
      <ProductGrid products={products} />
    </div>
  );
}
```

## Error Handling

### Not Found

```typescript
export async function getServerSideProps({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);

  if (!product) {
    return {
      notFound: true
    };
  }

  return {
    props: { product }
  };
}

// Renders 404 page if product not found
```

### Custom Error

```typescript
export async function getServerSideProps() {
  try {
    const data = await fetchData();

    return {
      props: { data }
    };
  } catch (error) {
    console.error('SSR error:', error);

    return {
      props: {
        error: {
          message: 'Failed to load data',
          statusCode: 500
        }
      }
    };
  }
}

export default function Page({ data, error }: {
  data?: any;
  error?: { message: string; statusCode: number };
}) {
  if (error) {
    return (
      <div className="error">
        <h1>Error {error.statusCode}</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return <Content data={data!} />;
}
```

## Caching

### HTTP Caching

```typescript
export async function getServerSideProps({ req, res }: {
  req: Request;
  res: Response;
}) {
  // Cache for 60 seconds
  res.headers.set(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  );

  const data = await fetchData();

  return {
    props: { data }
  };
}
```

### Conditional Caching

```typescript
export async function getServerSideProps({ req, res }: {
  req: Request;
  res: Response;
}) {
  const session = await getSession(req);

  if (!session) {
    // Cache for guests
    res.headers.set('Cache-Control', 'public, max-age=300');
  } else {
    // Don't cache for logged-in users
    res.headers.set('Cache-Control', 'private, no-cache');
  }

  const data = await fetchData(session?.userId);

  return {
    props: { data }
  };
}
```

## Performance

### Parallel Data Fetching

```typescript
export async function getServerSideProps() {
  // Fetch in parallel
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ]);

  return {
    props: { user, posts, comments }
  };
}
```

### Minimal Data

```typescript
export async function getServerSideProps() {
  // Fetch only what's needed
  const products = await fetchProducts({
    fields: ['id', 'name', 'price', 'image'], // Only these fields
    limit: 20
  });

  return {
    props: { products }
  };
}
```

### Database Connection Pooling

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

export async function query(sql: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

## SSR vs SSG

### When to Use Each

```typescript
// ✅ SSR for dynamic, personalized content
export async function getServerSideProps({ req }: { req: Request }) {
  const user = await getUser(req);
  return { props: { user } };
}

// ✅ SSG for static content
export async function getStaticProps() {
  const posts = await fetchPosts();
  return { props: { posts }, revalidate: 3600 };
}
```

### Hybrid Approach

```typescript
// Static shell with dynamic data
export async function getStaticProps() {
  // Static parts
  const layout = await fetchLayout();

  return {
    props: { layout },
    revalidate: 86400 // Daily
  };
}

export default function Page({ layout }: { layout: any }) {
  // Client-side fetch for dynamic data
  const { data } = useQuery(fetchUserData);

  return (
    <Layout config={layout}>
      <DynamicContent data={data()} />
    </Layout>
  );
}
```

## Best Practices

### Minimize Server Time

```typescript
// ✅ Quick server-side work
export async function getServerSideProps() {
  const data = await fetchData(); // Fast query
  return { props: { data } };
}

// ❌ Slow server-side processing
export async function getServerSideProps() {
  const data = await complexProcessing(); // 5 seconds
  return { props: { data } };
}
```

### Use Appropriate Caching

```typescript
// ✅ Cache public pages
res.headers.set('Cache-Control', 'public, s-maxage=60');

// ✅ Don't cache private data
res.headers.set('Cache-Control', 'private, no-cache');

// ❌ Cache user-specific data publicly
res.headers.set('Cache-Control', 'public, max-age=3600');
```

### Handle Errors Gracefully

```typescript
// ✅ Provide fallback
export async function getServerSideProps() {
  try {
    const data = await fetchData();
    return { props: { data } };
  } catch (error) {
    return { props: { data: null, error: true } };
  }
}

// ❌ Let errors crash
export async function getServerSideProps() {
  const data = await fetchData(); // Throws
  return { props: { data } };
}
```

### Redirect Early

```typescript
// ✅ Redirect before fetching data
export async function getServerSideProps({ req }: { req: Request }) {
  const session = await getSession(req);

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const data = await fetchData(session.userId);
  return { props: { data } };
}

// ❌ Fetch then redirect
export async function getServerSideProps({ req }: { req: Request }) {
  const data = await fetchData(); // Wasted work
  const session = await getSession(req);

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  return { props: { data } };
}
```

### Log Performance

```typescript
export async function getServerSideProps() {
  const start = Date.now();

  const data = await fetchData();

  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`Slow SSR: ${duration}ms`);
  }

  return {
    props: { data }
  };
}
```

## Summary

You've learned:

✅ Server-side rendering basics
✅ Dynamic data fetching per request
✅ Authentication and authorization
✅ Personalization strategies
✅ Dynamic content (search, filters)
✅ Error handling (not found, custom errors)
✅ HTTP caching for SSR
✅ Performance optimization
✅ SSR vs SSG comparison
✅ Best practices

SSR provides fresh, personalized content for every user!

---

**Congratulations!** You've completed the Data Fetching section. You now know how to fetch, cache, and manage data in PhilJS applications using every available pattern.
