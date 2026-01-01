# Pagination

Load large datasets efficiently with pagination, infinite scroll, and cursor-based navigation.

## What You'll Learn

- Offset pagination
- Cursor-based pagination
- Infinite scroll
- Load more buttons
- Page numbers
- Best practices

## Offset Pagination

### Basic Offset Pagination

```typescript
import { signal } from '@philjs/core';

function usePagination<T>(
  fetcher: (page: number, limit: number) => Promise<T[]>,
  limit = 10
) {
  const page = signal(1);
  const data = signal<T[]>([]);
  const loading = signal(false);
  const hasMore = signal(true);

  const fetchPage = async (pageNum: number) => {
    loading.set(true);

    try {
      const results = await fetcher(pageNum, limit);

      data.set(results);
      hasMore.set(results.length === limit);
    } finally {
      loading.set(false);
    }
  };

  effect(() => {
    fetchPage(page());
  });

  const nextPage = () => page.set(p => p + 1);
  const prevPage = () => page.set(p => Math.max(1, p - 1));
  const goToPage = (p: number) => page.set(p);

  return {
    data,
    loading,
    page,
    hasMore,
    nextPage,
    prevPage,
    goToPage
  };
}
```

### Using Offset Pagination

```typescript
function ProductList() {
  const {
    data,
    loading,
    page,
    hasMore,
    nextPage,
    prevPage
  } = usePagination(
    async (page, limit) => {
      const offset = (page - 1) * limit;
      const res = await fetch(`/api/products?offset=${offset}&limit=${limit}`);
      return res.json();
    },
    20
  );

  return (
    <div>
      {loading() ? (
        <Spinner />
      ) : (
        <div className="product-grid">
          {data().map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="pagination">
        <button
          onClick={prevPage}
          disabled={page() === 1 || loading()}
        >
          Previous
        </button>

        <span>Page {page()}</span>

        <button
          onClick={nextPage}
          disabled={!hasMore() || loading()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### With Query

```typescript
import { createQuery } from '@philjs/core';

const productsQuery = createQuery({
  key: (page: number) => ['products', page],
  fetcher: async (page: number) => {
    const offset = (page - 1) * 20;
    const res = await fetch(`/api/products?offset=${offset}&limit=20`);
    return res.json();
  },
  keepPreviousData: true // Show old data while loading new page
});

function ProductList() {
  const page = signal(1);
  const { data, loading } = productsQuery(page());

  return (
    <div>
      {data() && (
        <>
          <div className="product-grid">
            {data()!.items.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Pagination
            current={page()}
            total={data()!.totalPages}
            onChange={(p) => page.set(p)}
          />
        </>
      )}
    </div>
  );
}
```

## Cursor-Based Pagination

### Basic Cursor Pagination

```typescript
function useCursorPagination<T>(
  fetcher: (cursor?: string) => Promise<{
    items: T[];
    nextCursor?: string;
  }>
) {
  const items = signal<T[]>([]);
  const cursor = signal<string | undefined>(undefined);
  const loading = signal(false);
  const hasMore = signal(true);

  const loadMore = async () => {
    if (loading() || !hasMore()) return;

    loading.set(true);

    try {
      const result = await fetcher(cursor());

      items.set([...items(), ...result.items]);
      cursor.set(result.nextCursor);
      hasMore.set(!!result.nextCursor);
    } finally {
      loading.set(false);
    }
  };

  // Load initial page
  effect(() => {
    if (items().length === 0) {
      loadMore();
    }
  });

  return { items, loading, hasMore, loadMore };
}
```

### Using Cursor Pagination

```typescript
interface Post {
  id: string;
  title: string;
  createdAt: number;
}

function PostsList() {
  const { items, loading, hasMore, loadMore } = useCursorPagination<Post>(
    async (cursor) => {
      const url = cursor
        ? `/api/posts?cursor=${cursor}`
        : '/api/posts';

      const res = await fetch(url);
      return res.json();
    }
  );

  return (
    <div>
      {items().map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasMore() && (
        <button onClick={loadMore} disabled={loading()}>
          {loading() ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Infinite Scroll

### Basic Infinite Scroll

```typescript
import { signal, effect } from '@philjs/core';

function useInfiniteScroll<T>(
  fetcher: (offset: number) => Promise<T[]>,
  limit = 20
) {
  const items = signal<T[]>([]);
  const offset = signal(0);
  const loading = signal(false);
  const hasMore = signal(true);

  const loadMore = async () => {
    if (loading() || !hasMore()) return;

    loading.set(true);

    try {
      const newItems = await fetcher(offset());

      items.set([...items(), ...newItems]);
      offset.set(o => o + newItems.length);
      hasMore.set(newItems.length === limit);
    } finally {
      loading.set(false);
    }
  };

  // Scroll listener
  effect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Load more when near bottom (500px threshold)
      if (scrollTop + clientHeight >= scrollHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  });

  // Load initial data
  effect(() => {
    if (items().length === 0) {
      loadMore();
    }
  });

  return { items, loading, hasMore };
}
```

### Using Infinite Scroll

```typescript
function FeedPage() {
  const { items, loading, hasMore } = useInfiniteScroll<Post>(
    async (offset) => {
      const res = await fetch(`/api/feed?offset=${offset}&limit=20`);
      return res.json();
    },
    20
  );

  return (
    <div className="feed">
      {items().map((post, index) => (
        <PostCard key={`${post.id}-${index}`} post={post} />
      ))}

      {loading() && (
        <div className="loading">
          <Spinner />
          <p>Loading more posts...</p>
        </div>
      )}

      {!hasMore() && (
        <div className="end-message">
          You've reached the end!
        </div>
      )}
    </div>
  );
}
```

### Intersection Observer

More efficient than scroll listener:

```typescript
function useInfiniteScroll<T>(fetcher: (offset: number) => Promise<T[]>) {
  const items = signal<T[]>([]);
  const loading = signal(false);
  const hasMore = signal(true);
  const observerTarget = signal<HTMLElement | null>(null);

  const loadMore = async () => {
    // ... same as before
  };

  effect(() => {
    const target = observerTarget();
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore() && !loading()) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  });

  return { items, loading, hasMore, observerTarget };
}

// Usage
function Feed() {
  const { items, loading, observerTarget } = useInfiniteScroll(fetchItems);

  return (
    <div>
      {items().map(item => (
        <Item key={item.id} item={item} />
      ))}

      {/* Observer target */}
      <div ref={observerTarget.set} style={{ height: '20px' }} />

      {loading() && <Spinner />}
    </div>
  );
}
```

## Page Numbers

### Numbered Pagination

```typescript
function Pagination({
  current,
  total,
  onChange
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);

  // Show max 7 page numbers
  const getVisiblePages = () => {
    if (total <= 7) return pages;

    if (current <= 4) {
      return [...pages.slice(0, 5), '...', total];
    }

    if (current >= total - 3) {
      return [1, '...', ...pages.slice(total - 5)];
    }

    return [
      1,
      '...',
      current - 1,
      current,
      current + 1,
      '...',
      total
    ];
  };

  return (
    <div className="pagination">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
      >
        Previous
      </button>

      {getVisiblePages().map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="ellipsis">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page as number)}
            className={current === page ? 'active' : ''}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
      >
        Next
      </button>
    </div>
  );
}
```

## Server-Side Pagination

### API Response Format

```typescript
// Good pagination response
interface PaginationResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Or with cursor
interface CursorResponse<T> {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
}
```

### API Implementation

```typescript
// src/pages/api/posts.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.posts.findMany({ skip: offset, take: limit }),
    db.posts.count()
  ]);

  return new Response(JSON.stringify({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + items.length < total
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Search with Pagination

### Paginated Search

```typescript
function SearchResults() {
  const query = signal('');
  const page = signal(1);

  const searchQuery = createQuery({
    key: () => ['search', query(), page()],
    fetcher: async () => {
      if (!query()) return { items: [], total: 0 };

      const res = await fetch(
        `/api/search?q=${query()}&page=${page()}&limit=20`
      );
      return res.json();
    },
    enabled: () => query().length > 0
  });

  const { data, loading } = searchQuery();

  return (
    <div>
      <input
        value={query()}
        onInput={(e) => {
          query.set(e.target.value);
          page.set(1); // Reset to page 1 on new search
        }}
        placeholder="Search..."
      />

      {loading() && <Spinner />}

      {data() && (
        <>
          <div className="results">
            {data()!.items.map(item => (
              <SearchResult key={item.id} item={item} />
            ))}
          </div>

          {data()!.total > 20 && (
            <Pagination
              current={page()}
              total={Math.ceil(data()!.total / 20)}
              onChange={(p) => page.set(p)}
            />
          )}
        </>
      )}
    </div>
  );
}
```

## Virtual Scrolling

For extremely large lists:

```typescript
function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem
}: {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T) => any;
}) {
  const scrollTop = signal(0);

  const visibleCount = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop() / itemHeight);
  const endIndex = startIndex + visibleCount;

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: `${height}px`, overflow: 'auto' }}
      onScroll={(e) => scrollTop.set(e.target.scrollTop)}
    >
      <div style={{ height: `${items.length * itemHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: `${itemHeight}px` }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Best Practices

### Choose the Right Strategy

```typescript
// ✅ Offset pagination for pages with page numbers
const query = createQuery({
  key: (page) => ['items', page],
  fetcher: (page) => fetchPage(page)
});

// ✅ Cursor for infinite feeds
const { items, loadMore } = useCursorPagination(fetchWithCursor);

// ✅ Infinite scroll for social feeds
const { items } = useInfiniteScroll(fetchItems);
```

### Keep Previous Data

```typescript
// ✅ Show old data while loading new page
const query = createQuery({
  key: (page) => ['items', page],
  fetcher: (page) => fetchPage(page),
  keepPreviousData: true
});

// ❌ Blank screen while loading
const query = createQuery({
  key: (page) => ['items', page],
  fetcher: (page) => fetchPage(page)
});
```

### Provide Loading States

```typescript
// ✅ Show loading indicator
{loading() && <Spinner />}
{!hasMore() && <div>End of list</div>}

// ❌ No feedback
{items().map(item => <Item item={item} />)}
```

### Handle Empty States

```typescript
// ✅ Show message when no results
{items().length === 0 && !loading() && (
  <div className="empty">No results found</div>
)}

// ❌ Just empty space
```

### Debounce Search

```typescript
// ✅ Debounce search input
const debouncedQuery = useDebouncedValue(query(), 300);

const searchQuery = createQuery({
  key: () => ['search', debouncedQuery],
  fetcher: () => search(debouncedQuery)
});

// ❌ Search on every keystroke
```

## Summary

You've learned:

✅ Offset pagination with page numbers
✅ Cursor-based pagination
✅ Infinite scroll patterns
✅ Load more buttons
✅ Intersection Observer for efficiency
✅ Page number UI
✅ Server-side pagination
✅ Search with pagination
✅ Virtual scrolling for large lists
✅ Best practices

Pagination makes large datasets manageable and performant!

---

**Next:** [Error Handling →](./error-handling-data.md) Handle data fetching errors gracefully


