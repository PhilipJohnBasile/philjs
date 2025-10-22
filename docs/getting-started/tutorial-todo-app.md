# Tutorial: Build a Todo App

Build a full-featured todo application with persistence, filtering, and routing. This tutorial covers real-world patterns you'll use in every PhilJS app.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). High-level helpers referenced in this tutorial—`useSearchParams()`, `<Router>`, etc.—are part of the planned ergonomic API and are shown for conceptual guidance.

## What You'll Learn

- Managing lists of data
- Form handling and validation
- Local storage persistence
- Filtering and sorting
- URL-based routing for filters
- Component composition
- Performance optimization

## What We're Building

A complete todo app with:
- Add new todos
- Mark todos as complete/incomplete
- Delete todos
- Filter: All, Active, Completed
- Persist to localStorage
- URL routing for filters
- Edit existing todos
- Clear completed todos

## Setup

```bash
pnpm create philjs todo-app
cd todo-app
pnpm install
pnpm dev
```

## Step 1: Define the Data Model

Create `src/types/todo.ts`:

```typescript
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
}

export type Filter = 'all' | 'active' | 'completed';

export function createTodo(text: string): Todo {
  return {
    id: Date.now(),
    text,
    completed: false,
    createdAt: Date.now(),
  };
}
```

## Step 2: Create the TodoItem Component

Create `src/components/TodoItem.tsx`:

```typescript
import { signal } from 'philjs-core';
import type { Todo } from '../types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, text: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const isEditing = signal(false);
  const editText = signal(todo.text);

  const handleEdit = () => {
    isEditing.set(true);
    editText.set(todo.text);
  };

  const handleSave = () => {
    const text = editText().trim();
    if (text) {
      onUpdate(todo.id, text);
      isEditing.set(false);
    }
  };

  const handleCancel = () => {
    editText.set(todo.text);
    isEditing.set(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <li style={styles.item}>
      {isEditing() ? (
        <div style={styles.editing}>
          <input
            type="text"
            value={editText()}
            onInput={(e) => editText.set((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            style={styles.editInput}
            autofocus
          />
        </div>
      ) : (
        <div style={styles.view}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            style={styles.checkbox}
          />

          <label
            onDblClick={handleEdit}
            style={{
              ...styles.label,
              ...(todo.completed ? styles.labelCompleted : {}),
            }}
          >
            {todo.text}
          </label>

          <button
            onClick={() => onDelete(todo.id)}
            style={styles.deleteButton}
            aria-label="Delete todo"
          >
            ×
          </button>
        </div>
      )}
    </li>
  );
}

const styles = {
  item: {
    listStyle: 'none',
    borderBottom: '1px solid #ededed',
    padding: '0',
  },
  view: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    gap: '1rem',
  },
  editing: {
    padding: '1rem',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  label: {
    flex: 1,
    cursor: 'pointer',
    fontSize: '1.1rem',
    userSelect: 'none' as const,
    transition: 'color 0.2s',
  },
  labelCompleted: {
    textDecoration: 'line-through',
    color: '#999',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#cc9a9a',
    fontSize: '2rem',
    cursor: 'pointer',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  editInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1.1rem',
    border: '1px solid #999',
    borderRadius: '4px',
  },
};
```

💡 **Note**: Double-click a todo to edit it. Press Enter to save, Escape to cancel.

## Step 3: Create localStorage Utilities

Create `src/utils/storage.ts`:

```typescript
import type { Todo } from '../types/todo';

const STORAGE_KEY = 'philjs-todos';

export function loadTodos(): Todo[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load todos:', error);
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('Failed to save todos:', error);
  }
}
```

## Step 4: Create the Main TodoApp Component

Create `src/components/TodoApp.tsx`:

```typescript
import { signal, memo, effect } from 'philjs-core';
import { TodoItem } from './TodoItem';
import { createTodo } from '../types/todo';
import type { Todo, Filter } from '../types/todo';
import { loadTodos, saveTodos } from '../utils/storage';

type TodoAppProps = {
  url: URL;
  navigate: (to: string) => Promise<void>;
};

export function TodoApp({ url, navigate }: TodoAppProps) {
  // Load initial todos from localStorage
  const todos = signal<Todo[]>(loadTodos());

  // Get filter from URL (?filter=active)
  const filterParam = (url.searchParams.get('filter') as Filter) || 'all';
  const filter = signal<Filter>(filterParam);

  // New todo input
  const newTodoText = signal('');

  // Persist todos to localStorage whenever they change
  effect(() => {
    saveTodos(todos());
  });

  // Filtered todos based on current filter
  const filteredTodos = memo(() => {
    const currentFilter = filter();
    const allTodos = todos();

    switch (currentFilter) {
      case 'active':
        return allTodos.filter(t => !t.completed);
      case 'completed':
        return allTodos.filter(t => t.completed);
      default:
        return allTodos;
    }
  });

  // Counts
  const activeCount = memo(() =>
    todos().filter(t => !t.completed).length
  );

  const completedCount = memo(() =>
    todos().filter(t => t.completed).length
  );

  const allCompleted = memo(() =>
    todos().length > 0 && activeCount() === 0
  );

  // Actions
  const addTodo = () => {
    const text = newTodoText().trim();
    if (text) {
      todos.set([...todos(), createTodo(text)]);
      newTodoText.set('');
    }
  };

  const toggleTodo = (id: number) => {
    todos.set(
      todos().map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    todos.set(todos().filter(todo => todo.id !== id));
  };

  const updateTodo = (id: number, text: string) => {
    todos.set(
      todos().map(todo =>
        todo.id === id ? { ...todo, text } : todo
      )
    );
  };

  const toggleAll = () => {
    const shouldComplete = !allCompleted();
    todos.set(
      todos().map(todo => ({ ...todo, completed: shouldComplete }))
    );
  };

  const clearCompleted = () => {
    todos.set(todos().filter(todo => !todo.completed));
  };

  const setFilter = async (newFilter: Filter) => {
    filter.set(newFilter);
    const next = new URL(window.location.href);
    if (newFilter === 'all') {
      next.searchParams.delete('filter');
    } else {
      next.searchParams.set('filter', newFilter);
    }
    await navigate(next.pathname + next.search);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>todos</h1>

        <div style={styles.inputContainer}>
          {todos().length > 0 && (
            <button
              onClick={toggleAll}
              style={styles.toggleAll}
              aria-label="Toggle all todos"
            >
              ❯
            </button>
          )}

          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTodoText()}
            onInput={(e) => newTodoText.set((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            style={styles.input}
            autofocus
          />
        </div>
      </header>

      {todos().length > 0 && (
        <>
          <ul style={styles.todoList}>
            {filteredTodos().map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdate={updateTodo}
              />
            ))}
          </ul>

          <footer style={styles.footer}>
            <span style={styles.count}>
              <strong>{activeCount()}</strong>{' '}
              {activeCount() === 1 ? 'item' : 'items'} left
            </span>

            <div style={styles.filters}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  ...styles.filterButton,
                  ...(filter() === 'all' ? styles.filterButtonActive : {}),
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                style={{
                  ...styles.filterButton,
                  ...(filter() === 'active' ? styles.filterButtonActive : {}),
                }}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                style={{
                  ...styles.filterButton,
                  ...(filter() === 'completed' ? styles.filterButtonActive : {}),
                }}
              >
                Completed
              </button>
            </div>

            {completedCount() > 0 && (
              <button
                onClick={clearCompleted}
                style={styles.clearButton}
              >
                Clear completed
              </button>
            )}
          </footer>
        </>
      )}

      {todos().length === 0 && (
        <div style={styles.empty}>
          <p>No todos yet. Add one above to get started!</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '550px',
    margin: '0 auto',
    background: 'white',
    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 25px 50px 0 rgba(0, 0, 0, 0.1)',
  },
  header: {
    padding: '0',
  },
  title: {
    fontSize: '6rem',
    fontWeight: 100,
    textAlign: 'center' as const,
    color: 'rgba(175, 47, 47, 0.15)',
    margin: '40px 0 0',
  },
  inputContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  toggleAll: {
    position: 'absolute' as const,
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'none',
    fontSize: '1.5rem',
    color: '#e6e6e6',
    cursor: 'pointer',
  },
  input: {
    flex: 1,
    padding: '16px 16px 16px 60px',
    fontSize: '24px',
    border: 'none',
    borderBottom: '1px solid #ededed',
    outline: 'none',
  },
  todoList: {
    margin: 0,
    padding: 0,
  },
  footer: {
    padding: '10px 15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #e6e6e6',
    fontSize: '14px',
    color: '#777',
  },
  count: {},
  filters: {
    display: 'flex',
    gap: '0.5rem',
  },
  filterButton: {
    padding: '3px 7px',
    border: '1px solid transparent',
    borderRadius: '3px',
    background: 'none',
    cursor: 'pointer',
    color: '#777',
  },
  filterButtonActive: {
    borderColor: 'rgba(175, 47, 47, 0.2)',
  },
  clearButton: {
    background: 'none',
    border: 'none',
    color: '#777',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  empty: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#999',
  },
};
```

## Step 5: Wire up the router

Create `src/router.ts` so the current low-level APIs can mount and navigate your routes:

```typescript
import { createRouter } from 'philjs-router';
import { render } from 'philjs-core';

type RouteEntry = {
  pattern: string;
  load: () => Promise<{ default: (props: any) => any }>;
};

const routes: RouteEntry[] = [
  { pattern: '/', load: () => import('./routes/index.tsx') },
];

const router = createRouter(
  Object.fromEntries(routes.map((route) => [route.pattern, route.load]))
);

let outlet: HTMLElement | null = null;

async function renderRoute(url: URL) {
  if (!outlet) throw new Error('Router not started');

  const entry =
    routes.find((route) => route.pattern === url.pathname) ?? routes[0];
  const loader = router.manifest[entry.pattern];
  const mod = await loader();
  const Component = mod.default;
  render(() => Component({ url, navigate: navigateInternal }), outlet);
}

async function navigateInternal(to: string) {
  const url = new URL(to, window.location.origin);
  window.history.pushState({}, '', url.toString());
  await renderRoute(url);
}

export const navigate = navigateInternal;

export function startRouter(target: HTMLElement) {
  outlet = target;

  document.addEventListener('click', (event) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-router-link]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    void navigateInternal(url.pathname + url.search + url.hash);
  });

  window.addEventListener('popstate', () => {
    renderRoute(new URL(window.location.href));
  });

  renderRoute(new URL(window.location.href));
}
```

Update `src/main.tsx` to bootstrap the router:

```typescript
import { startRouter } from './router.ts';

startRouter(document.getElementById('app')!);
```

Now your routes render through the shared router, and every component receives the `url` and `navigate` props shown above.

## Step 6: Create the Main App

Update `src/routes/index.tsx`:

```typescript
import { TodoApp } from '../components/TodoApp';

type HomeProps = {
  url: URL;
  navigate: (to: string) => Promise<void>;
};

export default function Home({ url, navigate }: HomeProps) {
  return (
    <div style={styles.app}>
      <TodoApp url={url} navigate={navigate} />

      <footer style={styles.info}>
        <p>Double-click to edit a todo</p>
        <p>Created with PhilJS</p>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '40px 20px',
  },
  info: {
    textAlign: 'center' as const,
    marginTop: '40px',
    color: '#bfbfbf',
    fontSize: '12px',
  },
};
```

## Understanding the Code

### State Persistence with Effects

```typescript
effect(() => {
  saveTodos(todos());
});
```

This effect runs whenever `todos` changes, automatically saving to localStorage. No manual save calls needed!

### Derived State with Memos

```typescript
const filteredTodos = memo(() => {
  const currentFilter = filter();
  const allTodos = todos();

  switch (currentFilter) {
    case 'active':
      return allTodos.filter(t => !t.completed);
    case 'completed':
      return allTodos.filter(t => t.completed);
    default:
      return allTodos;
  }
});
```

`filteredTodos` automatically recalculates when `filter` or `todos` changes. The component always renders the correct filtered list.

### URL-Based Filtering

```typescript
const filterParam = (url.searchParams.get('filter') as Filter) || 'all';
const filter = signal<Filter>(filterParam);

const setFilter = async (newFilter: Filter) => {
  filter.set(newFilter);
  const next = new URL(window.location.href);
  if (newFilter === 'all') {
    next.searchParams.delete('filter');
  } else {
    next.searchParams.set('filter', newFilter);
  }
  await navigate(next.pathname + next.search);
};
```

The current filter lives in the URL (`?filter=active`). Updating it keeps the UI in sync with the browser history and makes filtered views shareable.

### Immutable Updates

```typescript
const toggleTodo = (id: number) => {
  todos.set(
    todos().map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    )
  );
};
```

We create a new array instead of mutating. This is crucial for:
- Proper reactivity
- Time travel debugging
- Avoiding bugs

## Step 7: Add Features

### Bulk Actions

```typescript
const selectAll = () => {
  todos.set(todos().map(todo => ({ ...todo, completed: true })));
};

const deselectAll = () => {
  todos.set(todos().map(todo => ({ ...todo, completed: false })));
};

const deleteSelected = () => {
  todos.set(todos().filter(todo => !todo.completed));
};
```

### Sorting

```typescript
type SortBy = 'created' | 'alphabetical';

const sortBy = signal<SortBy>('created');

const sortedTodos = memo(() => {
  const filtered = filteredTodos();

  if (sortBy() === 'alphabetical') {
    return [...filtered].sort((a, b) => a.text.localeCompare(b.text));
  }

  return filtered; // Already sorted by creation time
});

// In render:
<select
  value={sortBy()}
  onChange={(e) => sortBy.set(e.target.value as SortBy)}
>
  <option value="created">Sort by Date</option>
  <option value="alphabetical">Sort A-Z</option>
</select>
```

### Statistics

```typescript
const stats = memo(() => {
  const all = todos();
  return {
    total: all.length,
    active: all.filter(t => !t.completed).length,
    completed: all.filter(t => t.completed).length,
    completionRate: all.length > 0
      ? (all.filter(t => t.completed).length / all.length * 100).toFixed(0)
      : 0,
  };
});

// In render:
<div style={styles.stats}>
  <p>Total: {stats().total}</p>
  <p>Completion: {stats().completionRate}%</p>
</div>
```

### Due Dates

```typescript
// Update Todo type
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: number; // Add this
}

// In component:
const isOverdue = (todo: Todo) => {
  return todo.dueDate && !todo.completed && Date.now() > todo.dueDate;
};

// Render with warning:
<label
  style={{
    ...styles.label,
    ...(todo.completed ? styles.labelCompleted : {}),
    ...(isOverdue(todo) ? styles.labelOverdue : {}),
  }}
>
  {todo.text}
  {isOverdue(todo) && ' ⚠️'}
</label>
```

## Performance Optimization

### Virtualized Lists

For large lists (1000+ items), use virtual scrolling:

```typescript
import { createVirtualizer } from '@tanstack/virtual-core';

const virtualized = createVirtualizer({
  count: filteredTodos().length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 60,
});

// Render only visible items
{virtualized.getVirtualItems().map(virtualItem => {
  const todo = filteredTodos()[virtualItem.index];
  return <TodoItem key={todo.id} todo={todo} ... />;
})}
```

### Debounced Search

```typescript
import { debounce } from 'lodash-es';

const searchQuery = signal('');
const debouncedSearch = debounce((value: string) => {
  searchQuery.set(value);
}, 300);

const searchedTodos = memo(() => {
  const query = searchQuery().toLowerCase();
  if (!query) return filteredTodos();

  return filteredTodos().filter(todo =>
    todo.text.toLowerCase().includes(query)
  );
});

// In render:
<input
  type="search"
  placeholder="Search todos..."
  onInput={(e) => debouncedSearch(e.target.value)}
/>
```

## Testing

Create `src/components/TodoApp.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoApp } from './TodoApp';

const mockNavigate = async () => {};

describe('TodoApp', () => {
  it('adds a new todo', async () => {
    render(<TodoApp url={new URL('http://localhost/')} navigate={mockNavigate} />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('toggles a todo', () => {
    render(<TodoApp url={new URL('http://localhost/')} navigate={mockNavigate} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('filters todos', () => {
    render(<TodoApp url={new URL('http://localhost/?filter=completed')} navigate={mockNavigate} />);

    // Add todos
    // ...

    fireEvent.click(screen.getByText('Active'));

    // Should only show active todos
  });
});
```

## What You Learned

✅ **List management** - Adding, updating, deleting items
✅ **Forms** - Handling user input and validation
✅ **Persistence** - Saving to localStorage
✅ **Effects** - Running side effects when state changes
✅ **Filtering** - Showing subsets of data
✅ **URL state** - Storing filter in URL params
✅ **Composition** - Breaking UI into components
✅ **Performance** - Optimizing with memos and virtual scrolling

## Challenges

Extend the todo app:

1. **Tags**: Add tags to todos and filter by tag
2. **Categories**: Organize todos into projects
3. **Cloud sync**: Save to a backend API
4. **Collaboration**: Share todo lists with others
5. **Recurring todos**: Daily/weekly repeating tasks
6. **Subtasks**: Nested checklist items
7. **Drag and drop**: Reorder by dragging
8. **Dark mode**: Theme switching
9. **Offline support**: Service worker for PWA
10. **Mobile app**: Build with Capacitor

## Next Steps

- **[Build a Blog with SSG](./tutorial-blog-ssg.md)** - Learn static generation
- **[Learn about Routing](../routing/basics.md)** - Multi-page apps
- **[Data Fetching](../data-fetching/overview.md)** - API integration

---

**Next:** [Tutorial: Blog with SSG →](./tutorial-blog-ssg.md)
