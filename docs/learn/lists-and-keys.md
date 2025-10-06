# Lists and Keys

Rendering lists of data is fundamental to most applications. Learn how to render lists efficiently and why keys matter.

## What You'll Learn

- Rendering arrays with .map()
- The importance of keys
- Choosing the right key
- Dynamic lists with signals
- Common patterns and pitfalls

## Basic List Rendering

Use `.map()` to transform arrays into JSX:

```typescript
function FruitList() {
  const fruits = ['Apple', 'Banana', 'Orange'];

  return (
    <ul>
      {fruits.map(fruit => (
        <li key={fruit}>{fruit}</li>
      ))}
    </ul>
  );
}
```

### With Objects

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </li>
      ))}
    </ul>
  );
}
```

### Inline Mapping

```typescript
function NumberList() {
  return (
    <ul>
      {[1, 2, 3, 4, 5].map(n => (
        <li key={n}>Number {n}</li>
      ))}
    </ul>
  );
}
```

## Understanding Keys

Keys help PhilJS identify which items changed, were added, or were removed.

### Why Keys Matter

```typescript
// ❌ Without keys - PhilJS doesn't know which item is which
{users.map(user => (
  <UserCard user={user} />
))}

// ✅ With keys - PhilJS tracks each item
{users.map(user => (
  <UserCard key={user.id} user={user} />
))}
```

**What happens without keys:**
- PhilJS may re-render items unnecessarily
- Component state may get mixed up
- List updates can be inefficient
- Animations may break

**With proper keys:**
- PhilJS knows exactly which item changed
- Only changed items update
- Component state stays with the correct item
- Smooth animations and transitions

### Visual Example

```typescript
// Without proper keys:
// Initial: [A, B, C] → renders [<Item>A</Item>, <Item>B</Item>, <Item>C</Item>]
// After adding D at start: [D, A, B, C]
// PhilJS updates ALL items:
//   - First item: A → D (unnecessary!)
//   - Second item: B → A (unnecessary!)
//   - Third item: C → B (unnecessary!)
//   - Fourth item: adds C

// With proper keys:
// Initial: [A, B, C] → renders [<Item key="A">A</Item>, <Item key="B">B</Item>, <Item key="C">C</Item>]
// After adding D at start: [D, A, B, C]
// PhilJS knows:
//   - A, B, C didn't change (keys match)
//   - D is new (insert it)
// Only 1 item added, others unchanged!
```

## Choosing Keys

### Use Unique, Stable IDs

```typescript
// ✅ Best - database ID
{users.map(user => (
  <UserCard key={user.id} user={user} />
))}

// ✅ Good - UUID
{items.map(item => (
  <Item key={item.uuid} item={item} />
))}

// ✅ Acceptable - unique field combination
{contacts.map(contact => (
  <Contact key={`${contact.firstName}-${contact.lastName}-${contact.email}`} contact={contact} />
))}
```

### Don't Use Index as Key (Usually)

```typescript
// ❌ Problematic - index as key
{items.map((item, index) => (
  <Item key={index} item={item} />
))}
```

**Why it's problematic:**

```typescript
// Initial list: ['Apple', 'Banana', 'Orange']
// Keys: [0, 1, 2]

// Delete 'Banana':
// New list: ['Apple', 'Orange']
// Keys: [0, 1]

// PhilJS thinks:
// - Index 0: Apple → Apple (no change)
// - Index 1: Banana → Orange (update!)
// - Index 2: Orange → removed

// But Orange didn't change! Only Banana was removed.
```

### When Index is OK

Index is acceptable if:
1. List never reorders
2. List never filters
3. List is static
4. Items don't have stable IDs

```typescript
// ✅ OK - static menu
const menuItems = ['Home', 'About', 'Contact'];

{menuItems.map((item, index) => (
  <MenuItem key={index} label={item} />
))}

// ✅ OK - pagination (stable per page)
{currentPageItems.map((item, index) => (
  <Item key={index} item={item} />
))}
```

### Generating Keys

If items don't have IDs, generate them:

```typescript
// Option 1: Add ID when creating items
const newItem = {
  id: crypto.randomUUID(), // or Date.now(), or custom ID generator
  text: 'New item'
};

// Option 2: Use a library like nanoid
import { nanoid } from 'nanoid';

const newItem = {
  id: nanoid(),
  text: 'New item'
};

// Option 3: Hash the content
import { hash } from 'some-hash-library';

{items.map(item => (
  <Item key={hash(JSON.stringify(item))} item={item} />
))}
```

## Lists with Signals

### Dynamic Lists

```typescript
function TodoList() {
  const todos = signal<Todo[]>([]);

  const addTodo = (text: string) => {
    todos.set([
      ...todos(),
      {
        id: Date.now(),
        text,
        completed: false
      }
    ]);
  };

  const removeTodo = (id: number) => {
    todos.set(todos().filter(t => t.id !== id));
  };

  return (
    <div>
      <ul>
        {todos().map(todo => (
          <li key={todo.id}>
            <span>{todo.text}</span>
            <button onClick={() => removeTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Filtered Lists

```typescript
function FilteredList() {
  const items = signal([
    { id: 1, text: 'Apple', category: 'fruit' },
    { id: 2, text: 'Carrot', category: 'vegetable' },
    { id: 3, text: 'Banana', category: 'fruit' }
  ]);

  const filter = signal<'all' | 'fruit' | 'vegetable'>('all');

  const filteredItems = memo(() => {
    if (filter() === 'all') return items();
    return items().filter(item => item.category === filter());
  });

  return (
    <div>
      <button onClick={() => filter.set('all')}>All</button>
      <button onClick={() => filter.set('fruit')}>Fruits</button>
      <button onClick={() => filter.set('vegetable')}>Vegetables</button>

      <ul>
        {filteredItems().map(item => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Sorted Lists

```typescript
function SortedList() {
  const items = signal([
    { id: 1, name: 'Zebra', price: 100 },
    { id: 2, name: 'Apple', price: 50 },
    { id: 3, name: 'Mango', price: 75 }
  ]);

  const sortBy = signal<'name' | 'price'>('name');
  const sortOrder = signal<'asc' | 'desc'>('asc');

  const sortedItems = memo(() => {
    const sorted = [...items()].sort((a, b) => {
      if (sortBy() === 'name') {
        return a.name.localeCompare(b.name);
      }
      return a.price - b.price;
    });

    return sortOrder() === 'asc' ? sorted : sorted.reverse();
  });

  return (
    <div>
      <button onClick={() => sortBy.set('name')}>Sort by Name</button>
      <button onClick={() => sortBy.set('price')}>Sort by Price</button>
      <button onClick={() => sortOrder.set(o => o === 'asc' ? 'desc' : 'asc')}>
        Toggle Order
      </button>

      <ul>
        {sortedItems().map(item => (
          <li key={item.id}>
            {item.name} - ${item.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## List Patterns

### Empty States

```typescript
function ItemList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No items yet</p>
        <button>Add your first item</button>
      </div>
    );
  }

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Loading States

```typescript
function DataList() {
  const items = signal<Item[]>([]);
  const loading = signal(true);

  if (loading()) {
    return (
      <ul>
        {[1, 2, 3].map(i => (
          <li key={i} className="skeleton">Loading...</li>
        ))}
      </ul>
    );
  }

  return (
    <ul>
      {items().map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Grouped Lists

```typescript
interface Contact {
  id: number;
  name: string;
  group: string;
}

function GroupedContactList({ contacts }: { contacts: Contact[] }) {
  const grouped = memo(() => {
    const groups: Record<string, Contact[]> = {};

    contacts.forEach(contact => {
      if (!groups[contact.group]) {
        groups[contact.group] = [];
      }
      groups[contact.group].push(contact);
    });

    return Object.entries(groups);
  });

  return (
    <div>
      {grouped().map(([group, contacts]) => (
        <div key={group}>
          <h2>{group}</h2>
          <ul>
            {contacts.map(contact => (
              <li key={contact.id}>{contact.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Nested Lists

```typescript
interface Category {
  id: number;
  name: string;
  items: Item[];
}

function NestedList({ categories }: { categories: Category[] }) {
  return (
    <div>
      {categories.map(category => (
        <div key={category.id}>
          <h3>{category.name}</h3>
          <ul>
            {category.items.map(item => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Virtualized Lists (Large Lists)

For thousands of items, render only visible ones:

```typescript
function VirtualizedList({ items }: { items: Item[] }) {
  const scrollTop = signal(0);
  const itemHeight = 50;
  const visibleCount = 20;

  const visibleItems = memo(() => {
    const startIndex = Math.floor(scrollTop() / itemHeight);
    const endIndex = startIndex + visibleCount;
    return items.slice(startIndex, endIndex);
  });

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.floor(scrollTop() / itemHeight) * itemHeight;

  return (
    <div
      style={{ height: '500px', overflow: 'auto' }}
      onScroll={(e) => scrollTop.set(e.currentTarget.scrollTop)}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems().map(item => (
            <div key={item.id} style={{ height: `${itemHeight}px` }}>
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## List Operations

### Adding Items

```typescript
const items = signal<Item[]>([]);

// Add to end
items.set([...items(), newItem]);

// Add to start
items.set([newItem, ...items()]);

// Add at position
const insertAt = (index: number, item: Item) => {
  items.set([
    ...items().slice(0, index),
    item,
    ...items().slice(index)
  ]);
};
```

### Removing Items

```typescript
// Remove by ID
items.set(items().filter(item => item.id !== idToRemove));

// Remove by index
items.set(items().filter((_, i) => i !== indexToRemove));

// Remove first/last
items.set(items().slice(1)); // Remove first
items.set(items().slice(0, -1)); // Remove last
```

### Updating Items

```typescript
// Update single item
items.set(
  items().map(item =>
    item.id === targetId
      ? { ...item, name: 'Updated' }
      : item
  )
);

// Update multiple items
items.set(
  items().map(item =>
    item.category === 'fruit'
      ? { ...item, inStock: true }
      : item
  )
);
```

### Reordering Items

```typescript
// Move item up
const moveUp = (index: number) => {
  if (index === 0) return;
  const newItems = [...items()];
  [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
  items.set(newItems);
};

// Move item down
const moveDown = (index: number) => {
  if (index === items().length - 1) return;
  const newItems = [...items()];
  [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
  items.set(newItems);
};

// Drag and drop reorder
const moveItem = (fromIndex: number, toIndex: number) => {
  const newItems = [...items()];
  const [removed] = newItems.splice(fromIndex, 1);
  newItems.splice(toIndex, 0, removed);
  items.set(newItems);
};
```

## Best Practices

### Always Use Keys

```typescript
// ❌ Bad
{items.map(item => <Item item={item} />)}

// ✅ Good
{items.map(item => <Item key={item.id} item={item} />)}
```

### Use Stable IDs

```typescript
// ❌ Bad - random key on every render
{items.map(item => <Item key={Math.random()} item={item} />)}

// ✅ Good - stable ID
{items.map(item => <Item key={item.id} item={item} />)}
```

### Extract List Items

```typescript
// ❌ Complex logic inline
{items.map(item => (
  <li key={item.id}>
    <div>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <button onClick={() => handleEdit(item)}>Edit</button>
      <button onClick={() => handleDelete(item.id)}>Delete</button>
    </div>
  </li>
))}

// ✅ Extract to component
function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  return (
    <li>
      <div>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <button onClick={() => onEdit(item)}>Edit</button>
        <button onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </li>
  );
}

{items.map(item => (
  <ItemCard
    key={item.id}
    item={item}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
))}
```

### Use Memos for Expensive Operations

```typescript
// ✅ Memo prevents re-sorting on every access
const sortedItems = memo(() =>
  [...items()].sort((a, b) => a.name.localeCompare(b.name))
);

{sortedItems().map(item => (
  <Item key={item.id} item={item} />
))}
```

## Common Mistakes

### Forgetting Keys

```typescript
// ❌ No key
{items.map(item => <div>{item.name}</div>)}

// ✅ With key
{items.map(item => <div key={item.id}>{item.name}</div>)}
```

### Using Non-Unique Keys

```typescript
// ❌ Category is not unique
{items.map(item => <Item key={item.category} item={item} />)}

// ✅ ID is unique
{items.map(item => <Item key={item.id} item={item} />)}
```

### Index as Key with Dynamic Lists

```typescript
// ❌ Bad for dynamic lists
{items.map((item, i) => <Item key={i} item={item} />)}

// ✅ Use stable ID
{items.map(item => <Item key={item.id} item={item} />)}
```

### Mutating Arrays

```typescript
// ❌ Mutates original array
items().push(newItem); // Doesn't trigger updates!

// ✅ Create new array
items.set([...items(), newItem]);
```

## Performance Tips

### Memoize Filtered/Sorted Lists

```typescript
// ✅ Only recalculates when dependencies change
const filtered = memo(() =>
  items().filter(item => item.active)
);
```

### Extract Components for Large Lists

```typescript
// Each item is its own component, only updates when item changes
function TodoItem({ todo }: { todo: Todo }) {
  return (
    <li>
      <input type="checkbox" checked={todo.done} />
      <span>{todo.text}</span>
    </li>
  );
}

{todos().map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}
```

## Summary

You've learned:

✅ Render lists with `.map()`
✅ Always use unique, stable keys
✅ Prefer IDs over index for dynamic lists
✅ Use signals for reactive lists
✅ Common patterns: filtering, sorting, grouping
✅ List operations: add, remove, update, reorder
✅ Performance optimization with memos

Keys are critical for efficient list rendering!

---

**Next:** [Forms and Inputs →](./forms.md) Master form handling and validation
