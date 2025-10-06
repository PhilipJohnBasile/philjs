# Infinite Scroll

**Outcome**: Load more items automatically as user scrolls to bottom.

## Solution

```typescript
import { signal, effect } from 'philjs-core';

function InfiniteList() {
  const items = signal<any[]>([]);
  const page = signal(1);
  const loading = signal(false);
  const hasMore = signal(true);

  // Load items for current page
  effect(() => {
    if (!hasMore()) return;

    loading.set(true);
    fetch(`/api/items?page=${page()}`)
      .then(res => res.json())
      .then(data => {
        if (data.length === 0) {
          hasMore.set(false);
        } else {
          items.set([...items(), ...data]);
        }
        loading.set(false);
      });
  });

  // Intersection observer for scroll detection
  let sentinelRef: HTMLDivElement;

  effect(() => {
    if (!sentinelRef || !hasMore()) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading()) {
        page.set(page() + 1);
      }
    });

    observer.observe(sentinelRef);
    return () => observer.disconnect();
  });

  return (
    <div>
      <div>
        {items().map(item => (
          <div key={item.id}>{item.title}</div>
        ))}
      </div>

      {hasMore() && (
        <div ref={(el) => sentinelRef = el}>
          {loading() ? 'Loading...' : 'Scroll for more'}
        </div>
      )}

      {!hasMore() && <div>No more items</div>}
    </div>
  );
}
```

## How it Works

1. `page` signal tracks current page number
2. Effect fetches data whenever `page` changes
3. Intersection Observer watches sentinel div at bottom
4. When sentinel becomes visible, increment page

## Pitfalls

- **Multiple concurrent fetches**: Add loading guard to prevent duplicate requests
- **Memory leaks**: Observer cleanup is crucial
- **No error handling**: Add error state and retry logic

## Production Tips

- Use `react-intersection-observer` or similar library
- Add virtualization for long lists (e.g., `react-window`)
- Implement "Load more" button as fallback
- Debounce rapid scroll events
