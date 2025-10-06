# Conditional Rendering

Show or hide UI elements based on state, props, or computed values. Learn all the patterns for conditional rendering in PhilJS.

## What You'll Learn

- if/else rendering
- Ternary operator
- Logical AND (&&) operator
- Switch statements
- Conditional styling
- Best practices

## Basic Conditional Rendering

### if/else Statement

```typescript
function Greeting({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>;
  }

  return <h1>Please sign in</h1>;
}
```

### Early Return Pattern

```typescript
function UserProfile({ user }: { user: User | null }) {
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Multiple Conditions

```typescript
function StatusMessage({ status }: { status: 'loading' | 'error' | 'success' | 'idle' }) {
  if (status === 'loading') {
    return <Spinner />;
  }

  if (status === 'error') {
    return <ErrorMessage />;
  }

  if (status === 'success') {
    return <SuccessMessage />;
  }

  return <EmptyState />;
}
```

## Ternary Operator

Perfect for simple either/or conditions:

```typescript
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={isActive ? 'badge-success' : 'badge-gray'}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
```

### Nested Ternaries

Use sparingly - can get hard to read:

```typescript
function UserBadge({ user }: { user: User }) {
  return (
    <div>
      {user.role === 'admin' ? (
        <AdminBadge />
      ) : user.role === 'moderator' ? (
        <ModeratorBadge />
      ) : (
        <UserBadge />
      )}
    </div>
  );
}
```

**Better:** Use if/else or switch for complex conditions.

### Inline JSX

```typescript
function UserCard({ user }: { user: User }) {
  return (
    <div>
      <h2>{user.name}</h2>

      {user.isVerified ? (
        <span className="verified">✓ Verified</span>
      ) : (
        <span className="unverified">Unverified</span>
      )}

      <p>{user.isPremium ? 'Premium Member' : 'Free Account'}</p>
    </div>
  );
}
```

## Logical AND (&&) Operator

Show element only if condition is true:

```typescript
function Notification({ message, show }: { message: string; show: boolean }) {
  return (
    <div>
      {show && (
        <div className="notification">
          {message}
        </div>
      )}
    </div>
  );
}
```

### With Signals

```typescript
function TodoList() {
  const todos = signal<Todo[]>([]);
  const hasCompletedTodos = memo(() =>
    todos().some(t => t.completed)
  );

  return (
    <div>
      <ul>
        {todos().map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>

      {hasCompletedTodos() && (
        <button>Clear Completed</button>
      )}

      {todos().length === 0 && (
        <p>No todos yet!</p>
      )}
    </div>
  );
}
```

### Multiple Conditions

```typescript
function UserProfile({ user }: { user: User | null }) {
  const isAdmin = memo(() => user()?.role === 'admin');
  const hasPermission = memo(() => user()?.permissions.includes('edit'));

  return (
    <div>
      {user() && (
        <div>
          <h1>{user()!.name}</h1>

          {isAdmin() && (
            <AdminPanel />
          )}

          {isAdmin() && hasPermission() && (
            <EditButton />
          )}
        </div>
      )}
    </div>
  );
}
```

### Beware of Falsy Values

```typescript
const count = signal(0);

// ❌ Renders "0" when count is 0
{count() && <div>Count: {count()}</div>}

// ✅ Only renders when count > 0
{count() > 0 && <div>Count: {count()}</div>}

// Or use explicit comparison
{count() !== 0 && <div>Count: {count()}</div>}
```

## Switch Statement

Best for multiple exclusive conditions:

```typescript
function StatusView({ status }: { status: Status }) {
  switch (status) {
    case 'idle':
      return <div>Ready to start</div>;

    case 'loading':
      return <Spinner />;

    case 'success':
      return <SuccessMessage />;

    case 'error':
      return <ErrorMessage />;

    default:
      return <div>Unknown status</div>;
  }
}
```

### With Signals

```typescript
function ViewSwitcher() {
  const view = signal<'grid' | 'list' | 'table'>('grid');

  const renderView = () => {
    switch (view()) {
      case 'grid':
        return <GridView />;
      case 'list':
        return <ListView />;
      case 'table':
        return <TableView />;
    }
  };

  return (
    <div>
      <div>
        <button onClick={() => view.set('grid')}>Grid</button>
        <button onClick={() => view.set('list')}>List</button>
        <button onClick={() => view.set('table')}>Table</button>
      </div>

      {renderView()}
    </div>
  );
}
```

### Inline Switch with Object

```typescript
const viewComponents = {
  grid: GridView,
  list: ListView,
  table: TableView
} as const;

function ViewSwitcher() {
  const view = signal<keyof typeof viewComponents>('grid');
  const Component = () => viewComponents[view()];

  return (
    <div>
      <Component />
    </div>
  );
}
```

## Conditional Styling

### Conditional Classes

```typescript
function Button({ variant, disabled }: { variant: 'primary' | 'secondary'; disabled?: boolean }) {
  return (
    <button
      className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} ${disabled ? 'btn-disabled' : ''}`}
      disabled={disabled}
    >
      Click me
    </button>
  );
}
```

### Conditional Inline Styles

```typescript
function Card({ highlighted }: { highlighted: boolean }) {
  return (
    <div
      style={{
        padding: '1rem',
        background: highlighted ? '#fff3cd' : '#fff',
        border: highlighted ? '2px solid #ffc107' : '1px solid #ddd'
      }}
    >
      Content
    </div>
  );
}
```

### With Signals

```typescript
function ThemedButton() {
  const theme = signal<'light' | 'dark'>('light');

  return (
    <button
      style={{
        background: theme() === 'dark' ? '#333' : '#fff',
        color: theme() === 'dark' ? '#fff' : '#000',
        border: `1px solid ${theme() === 'dark' ? '#555' : '#ddd'}`
      }}
      onClick={() => theme.set(t => t === 'light' ? 'dark' : 'light')}
    >
      Toggle Theme
    </button>
  );
}
```

## Complex Conditional Patterns

### Loading States

```typescript
function DataView() {
  const data = signal<Data | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  if (loading()) {
    return <Spinner />;
  }

  if (error()) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error()!.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!data()) {
    return <EmptyState />;
  }

  return <DataDisplay data={data()!} />;
}
```

### Authentication Flow

```typescript
function ProtectedRoute({ children }: { children: any }) {
  const user = signal<User | null>(null);
  const loading = signal(true);

  effect(() => {
    checkAuth().then(u => {
      user.set(u);
      loading.set(false);
    });
  });

  if (loading()) {
    return <LoadingScreen />;
  }

  if (!user()) {
    return <Redirect to="/login" />;
  }

  if (user()!.role !== 'admin') {
    return <AccessDenied />;
  }

  return children;
}
```

### Multi-step Form

```typescript
function MultiStepForm() {
  const step = signal(1);

  const renderStep = () => {
    switch (step()) {
      case 1:
        return <PersonalInfo onNext={() => step.set(2)} />;
      case 2:
        return <AddressInfo onNext={() => step.set(3)} onBack={() => step.set(1)} />;
      case 3:
        return <ReviewSubmit onBack={() => step.set(2)} />;
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div>
      <div className="steps">
        <span className={step() >= 1 ? 'active' : ''}>Personal</span>
        <span className={step() >= 2 ? 'active' : ''}>Address</span>
        <span className={step() >= 3 ? 'active' : ''}>Review</span>
      </div>

      {renderStep()}
    </div>
  );
}
```

### Feature Flags

```typescript
const features = {
  newDashboard: true,
  betaFeature: false,
  experimentalUI: true
};

function Dashboard() {
  return (
    <div>
      {features.newDashboard ? (
        <NewDashboard />
      ) : (
        <OldDashboard />
      )}

      {features.betaFeature && (
        <BetaPanel />
      )}

      {features.experimentalUI && (
        <ExperimentalFeatures />
      )}
    </div>
  );
}
```

### Permissions

```typescript
function AdminPanel({ user }: { user: User }) {
  const canEdit = memo(() =>
    user.role === 'admin' || user.permissions.includes('edit')
  );

  const canDelete = memo(() =>
    user.role === 'admin'
  );

  const canPublish = memo(() =>
    user.role === 'admin' || user.role === 'editor'
  );

  return (
    <div>
      {canEdit() && <EditButton />}
      {canDelete() && <DeleteButton />}
      {canPublish() && <PublishButton />}

      {!canEdit() && !canDelete() && !canPublish() && (
        <p>You don't have permission to perform any actions</p>
      )}
    </div>
  );
}
```

## Conditional Lists

### Filtered Lists

```typescript
function TodoList() {
  const todos = signal<Todo[]>([...]);
  const filter = signal<'all' | 'active' | 'completed'>('all');

  const filteredTodos = memo(() => {
    switch (filter()) {
      case 'active':
        return todos().filter(t => !t.completed);
      case 'completed':
        return todos().filter(t => t.completed);
      default:
        return todos();
    }
  });

  return (
    <div>
      <div>
        <button onClick={() => filter.set('all')}>All</button>
        <button onClick={() => filter.set('active')}>Active</button>
        <button onClick={() => filter.set('completed')}>Completed</button>
      </div>

      {filteredTodos().length > 0 ? (
        <ul>
          {filteredTodos().map(todo => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      ) : (
        <p>No todos to show</p>
      )}
    </div>
  );
}
```

### Grouped Lists

```typescript
function ContactList({ contacts }: { contacts: Contact[] }) {
  const groupedContacts = memo(() => {
    const groups: Record<string, Contact[]> = {};

    contacts.forEach(contact => {
      const firstLetter = contact.name[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);
    });

    return groups;
  });

  return (
    <div>
      {Object.entries(groupedContacts()).map(([letter, contacts]) => (
        <div key={letter}>
          <h2>{letter}</h2>
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

## Best Practices

### Early Returns for Guard Clauses

```typescript
// ✅ Good - early returns
function UserProfile({ user }: { user: User | null }) {
  if (!user) {
    return <div>Not logged in</div>;
  }

  if (user.banned) {
    return <div>Account banned</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// ❌ Harder to read - nested conditions
function UserProfile({ user }: { user: User | null }) {
  return (
    <div>
      {user ? (
        user.banned ? (
          <div>Account banned</div>
        ) : (
          <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
        )
      ) : (
        <div>Not logged in</div>
      )}
    </div>
  );
}
```

### Extract Complex Conditions

```typescript
// ❌ Inline complex logic
{user()?.role === 'admin' || (user()?.role === 'moderator' && user()?.isActive) && (
  <AdminPanel />
)}

// ✅ Extract to memo
const canAccessAdmin = memo(() => {
  const u = user();
  return u?.role === 'admin' || (u?.role === 'moderator' && u?.isActive);
});

{canAccessAdmin() && <AdminPanel />}
```

### Use Descriptive Variable Names

```typescript
// ❌ Unclear
{x && <Component />}

// ✅ Clear
{hasPermission && <AdminPanel />}
{isAuthenticated && <UserDashboard />}
{hasUnsavedChanges && <SavePrompt />}
```

### Avoid Nested Ternaries

```typescript
// ❌ Hard to read
{status === 'loading' ? <Spinner /> : status === 'error' ? <Error /> : status === 'success' ? <Success /> : <Idle />}

// ✅ Use switch or if/else
function StatusView({ status }) {
  switch (status) {
    case 'loading': return <Spinner />;
    case 'error': return <Error />;
    case 'success': return <Success />;
    default: return <Idle />;
  }
}
```

## Common Mistakes

### Rendering Falsy Numbers

```typescript
const count = signal(0);

// ❌ Renders "0" when count is 0
{count() && <div>Count: {count()}</div>}

// ✅ Explicit boolean check
{count() > 0 && <div>Count: {count()}</div>}
{Boolean(count()) && <div>Count: {count()}</div>}
```

### Forgetting Null Checks

```typescript
const user = signal<User | null>(null);

// ❌ Can crash
<div>{user().name}</div>

// ✅ Null check
{user() && <div>{user()!.name}</div>}

// Or early return
if (!user()) return <div>Loading...</div>;
return <div>{user()!.name}</div>;
```

### Inline Function Creation

```typescript
// ❌ Creates new function every render (minor issue in PhilJS)
{(() => {
  if (condition) return <A />;
  return <B />;
})()}

// ✅ Extract to named function
const renderContent = () => {
  if (condition) return <A />;
  return <B />;
};

{renderContent()}
```

## Summary

You've learned:

✅ if/else for simple conditions
✅ Ternary operator for inline conditions
✅ Logical AND (&&) to show/hide elements
✅ Switch statements for multiple conditions
✅ Conditional styling with classes and inline styles
✅ Complex patterns: loading states, auth flows, multi-step forms
✅ Best practices: early returns, extract complexity, descriptive names

Conditional rendering is fundamental to dynamic UIs!

---

**Next:** [Lists and Keys →](./lists-and-keys.md) Master rendering and managing lists
