# Debounce Search Input

**Outcome**: Delay API calls while user types to reduce requests.

## Solution

```typescript
import { signal, effect } from 'philjs-core';

function SearchBar() {
  const searchTerm = signal('');
  const results = signal([]);
  const debouncedTerm = signal('');

  // Debounce logic
  effect(() => {
    const term = searchTerm();
    const timeout = setTimeout(() => {
      debouncedTerm.set(term);
    }, 300);

    return () => clearTimeout(timeout);
  });

  // Fetch when debounced term changes
  effect(() => {
    const term = debouncedTerm();
    if (!term) {
      results.set([]);
      return;
    }

    fetch(`/api/search?q=${encodeURIComponent(term)}`)
      .then(res => res.json())
      .then(data => results.set(data));
  });

  return (
    <div>
      <input
        type="search"
        value={searchTerm()}
        onInput={(e) => searchTerm.set(e.target.value)}
        placeholder="Search..."
      />
      <ul>
        {results().map(item => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## How it Works

1. `searchTerm` updates immediately on every keystroke
2. Effect delays 300ms before updating `debouncedTerm`
3. Second effect fetches only when `debouncedTerm` changes
4. Cleanup function cancels pending timeouts

## Pitfalls

- **No cleanup on unmount**: Effects auto-cleanup, but add abort controller for fetch
- **Empty searches**: Check for empty string to avoid unnecessary API calls
- **Debounce too short**: 300ms is common; adjust for your use case

## Production Tips

- Use a dedicated debounce utility or library
- Add loading state during debounce
- Show "No results" vs "Type to search" states
- Consider minimum character length (e.g., 3 chars)
