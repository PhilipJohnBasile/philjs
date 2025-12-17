# Your First Component

Components are the building blocks of PhilJS applications. They encapsulate UI, logic, and state into reusable pieces.

## Basic Component

A PhilJS component is simply a function that returns JSX:

```tsx
function Greeting() {
  return <h1>Hello, World!</h1>;
}
```

## Components with Props

Pass data to components using props:

```tsx
// Define the props interface
interface GreetingProps {
  name: string;
  emoji?: string;  // Optional prop
}

function Greeting({ name, emoji = "👋" }: GreetingProps) {
  return <h1>{emoji} Hello, {name}!</h1>;
}

// Usage
<Greeting name="Developer" />
<Greeting name="PhilJS" emoji="🚀" />
```

## Components with State

Use signals for component state:

```tsx playground
import { signal } from 'philjs-core';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
      <button onClick={() => count.set(c => c - 1)}>
        Decrement
      </button>
      <button onClick={() => count.set(0)}>
        Reset
      </button>
    </div>
  );
}
```

## Handling Events

PhilJS uses standard DOM event handlers:

```tsx
function Form() {
  const value = signal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log('Submitted:', value());
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={value()}
        onInput={(e) => value.set(e.target.value)}
        placeholder="Enter text..."
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Conditional Rendering

Render content conditionally using JavaScript expressions:

```tsx
function UserStatus({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div>
      {isLoggedIn ? (
        <p>Welcome back!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

Or use the `&&` operator:

```tsx
function Notification({ count }: { count: number }) {
  return (
    <div>
      <h1>Notifications</h1>
      {count > 0 && (
        <span class="badge">{count} new</span>
      )}
    </div>
  );
}
```

## Rendering Lists

Map over arrays to render lists. Always provide a `key`:

```tsx playground
import { signal } from 'philjs-core';

function ItemList() {
  const items = signal(['Apple', 'Banana', 'Cherry']);

  const addItem = () => {
    const newItem = prompt('Enter item:');
    if (newItem) {
      items.set([...items(), newItem]);
    }
  };

  return (
    <div>
      <ul>
        {items().map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <button onClick={addItem}>Add Item</button>
    </div>
  );
}
```

## Composing Components

Build complex UIs by combining smaller components:

```tsx
function Avatar({ src, name }: { src: string; name: string }) {
  return (
    <img
      src={src}
      alt={name}
      style={{ borderRadius: '50%', width: '48px', height: '48px' }}
    />
  );
}

function UserInfo({ name, role }: { name: string; role: string }) {
  return (
    <div>
      <strong>{name}</strong>
      <span style={{ color: 'gray' }}>{role}</span>
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '16px' }}>
      <Avatar src={user.avatar} name={user.name} />
      <UserInfo name={user.name} role={user.role} />
    </div>
  );
}
```

## Children Props

Components can accept child elements:

```tsx
interface CardProps {
  title: string;
  children: any;
}

function Card({ title, children }: CardProps) {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #ddd',
        fontWeight: 'bold'
      }}>
        {title}
      </div>
      <div style={{ padding: '16px' }}>
        {children}
      </div>
    </div>
  );
}

// Usage
<Card title="User Profile">
  <p>Name: John Doe</p>
  <p>Email: john@example.com</p>
</Card>
```

## Component Best Practices

### 1. Keep Components Small
Each component should do one thing well.

### 2. Use TypeScript Interfaces
Define clear prop types for better DX:

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
  children: any;
}
```

### 3. Lift State Up
Share state between components by lifting it to a common ancestor:

```tsx
function Parent() {
  const sharedValue = signal('');

  return (
    <>
      <InputComponent value={sharedValue} />
      <DisplayComponent value={sharedValue} />
    </>
  );
}
```

### 4. Use Memos for Derived State
Don't compute values inline if they're expensive:

```tsx
// Bad - recalculates on every render
function Bad() {
  const items = signal([...]);
  return <p>Total: {items().reduce((a, b) => a + b, 0)}</p>;
}

// Good - cached computation
function Good() {
  const items = signal([...]);
  const total = memo(() => items().reduce((a, b) => a + b, 0));
  return <p>Total: {total()}</p>;
}
```

## Next Steps

- [Thinking in PhilJS](/docs/getting-started/thinking-in-philjs) - The mental model
- [Signals](/docs/learn/signals) - Deep dive into reactivity
- [Context](/docs/learn/context) - Share state across components
