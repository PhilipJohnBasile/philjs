# Your First Component

Components are the building blocks of PhilJS applications. Let's learn how to create and use them effectively.

## What is a Component?

A component is a reusable piece of UI that combines markup (JSX), logic (TypeScript), and optionally state (signals). Think of components as custom HTML elements that you define.

**Simple example:**
```typescript
export function Welcome() {
  return <h1>Hello, PhilJS!</h1>;
}
```

This is a valid PhilJS component. It's a function that returns JSX - that's it!

## Creating Your First Component

Let's build a user profile card step by step.

### Step 1: Basic Component Structure

Create a new file `src/components/UserCard.tsx`:

```typescript
export function UserCard() {
  return (
    <div>
      <h2>John Doe</h2>
      <p>Software Engineer</p>
    </div>
  );
}
```

**Key points:**
- Components are just functions
- Function names should be PascalCase (`UserCard`, not `userCard`)
- Components must return JSX
- Export your component so others can use it

### Step 2: Adding Props

Props make components reusable by passing data in:

```typescript
interface UserCardProps {
  name: string;
  role: string;
}

export function UserCard({ name, role }: UserCardProps) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{role}</p>
    </div>
  );
}
```

Now you can use it with different data:

```typescript
<UserCard name="John Doe" role="Software Engineer" />
<UserCard name="Jane Smith" role="Product Manager" />
```

💡 **Tip**: Always type your props with TypeScript. It prevents bugs and enables autocomplete.

### Step 3: Adding Styles

Let's make it look good:

```typescript
interface UserCardProps {
  name: string;
  role: string;
  avatar?: string;
}

export function UserCard({ name, role, avatar }: UserCardProps) {
  return (
    <div style={styles.card}>
      {avatar && (
        <img
          src={avatar}
          alt={name}
          style={styles.avatar}
        />
      )}
      <div style={styles.info}>
        <h2 style={styles.name}>{name}</h2>
        <p style={styles.role}>{role}</p>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    padding: '1.5rem',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    gap: '1rem',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  info: {
    flex: 1,
  },
  name: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#333',
  },
  role: {
    margin: '0.25rem 0 0',
    color: '#666',
    fontSize: '0.9rem',
  },
};
```

**Usage:**
```typescript
<UserCard
  name="John Doe"
  role="Software Engineer"
  avatar="/avatars/john.jpg"
/>
```

### Step 4: Adding Interactivity with Signals

Let's add a follow button:

```typescript
import { signal } from '@philjs/core';

interface UserCardProps {
  name: string;
  role: string;
  avatar?: string;
  initialFollowing?: boolean;
}

export function UserCard({
  name,
  role,
  avatar,
  initialFollowing = false
}: UserCardProps) {
  const following = signal(initialFollowing);

  const toggleFollow = () => {
    following.set(!following());
  };

  return (
    <div style={styles.card}>
      {avatar && (
        <img src={avatar} alt={name} style={styles.avatar} />
      )}
      <div style={styles.info}>
        <h2 style={styles.name}>{name}</h2>
        <p style={styles.role}>{role}</p>
      </div>
      <button
        onClick={toggleFollow}
        style={{
          ...styles.button,
          ...(following() ? styles.buttonFollowing : {}),
        }}
      >
        {following() ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}

const styles = {
  // ... previous styles ...
  button: {
    padding: '0.5rem 1.5rem',
    border: '2px solid #667eea',
    background: 'white',
    color: '#667eea',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  buttonFollowing: {
    background: '#667eea',
    color: 'white',
  },
};
```

Now your component has state! The follow button toggles between "Follow" and "Following".

## JSX Syntax Explained

JSX looks like HTML but it's JavaScript. Here's what you need to know:

### Embedding Expressions

Use curly braces `{}` to embed JavaScript:

```typescript
const name = "World";
const element = <h1>Hello, {name}!</h1>;

const value = 42;
const doubled = <p>{value * 2}</p>; // Shows 84
```

### Attributes

JSX attributes use camelCase:

```typescript
// HTML: onclick, class, for
// JSX:  onClick, className, htmlFor

<button onClick={handleClick} className="btn">
  Click me
</button>

<label htmlFor="email">Email:</label>
<input id="email" type="email" />
```

⚠️ **Common mistake**: Using `class` instead of `className`:

```typescript
// ❌ Wrong
<div class="container">

// ✅ Correct
<div className="container">
```

### Children

Components can have children:

```typescript
function Card({ children }: { children: any }) {
  return (
    <div className="card">
      {children}
    </div>
  );
}

// Usage:
<Card>
  <h2>Title</h2>
  <p>Content goes here</p>
</Card>
```

### Conditional Rendering

Show elements conditionally:

```typescript
// Using &&
{isLoggedIn && <button>Logout</button>}

// Using ternary
{isLoggedIn ? <Dashboard /> : <Login />}

// Using if/else (outside JSX)
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>;
  }
  return <h1>Please sign in</h1>;
}
```

### Lists

Render arrays of elements:

```typescript
const users = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
  { id: 3, name: 'Bob' },
];

<ul>
  {users.map(user => (
    <li key={user.id}>{user.name}</li>
  ))}
</ul>
```

💡 **Important**: Always include a `key` prop when rendering lists. Keys help PhilJS identify which items have changed.

### Fragments

Group elements without adding extra DOM nodes:

```typescript
import { Fragment } from '@philjs/core';

function UserInfo() {
  return (
    <Fragment>
      <h2>Name</h2>
      <p>Description</p>
    </Fragment>
  );
}

// Shorthand:
function UserInfo() {
  return (
    <>
      <h2>Name</h2>
      <p>Description</p>
    </>
  );
}
```

## Composing Components

The real power of components is composition - building complex UIs from simple pieces.

### Example: User List

```typescript
// UserCard.tsx
export function UserCard({ user }) {
  return (
    <div style={styles.card}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// UserList.tsx
import { UserCard } from './UserCard';

export function UserList({ users }) {
  return (
    <div>
      <h2>Team Members</h2>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

// App.tsx
import { UserList } from './UserList';

const team = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

<UserList users={team} />
```

### Nested Components

Components can contain other components:

```typescript
function Avatar({ src, alt }) {
  return <img src={src} alt={alt} style={{ borderRadius: '50%' }} />;
}

function UserInfo({ name, role }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>{role}</p>
    </div>
  );
}

function UserCard({ user }) {
  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Avatar src={user.avatar} alt={user.name} />
      <UserInfo name={user.name} role={user.role} />
    </div>
  );
}
```

## Component Best Practices

### 1. Keep Components Small

**Bad:**
```typescript
function Dashboard() {
  // 500 lines of code...
  return <div>...</div>;
}
```

**Good:**
```typescript
function Dashboard() {
  return (
    <div>
      <Header />
      <Sidebar />
      <MainContent />
      <Footer />
    </div>
  );
}
```

### 2. Use Descriptive Names

```typescript
// ❌ Bad
function Card() {}
function Comp() {}
function Thing() {}

// ✅ Good
function UserProfileCard() {}
function ShoppingCart() {}
function NavigationMenu() {}
```

### 3. Single Responsibility

Each component should do one thing well:

```typescript
// ❌ Bad - does too much
function UserDashboard() {
  // Fetches data
  // Handles authentication
  // Renders UI
  // Manages global state
}

// ✅ Good - focused responsibility
function UserDashboard() {
  const user = useUser(); // Hook handles auth
  const stats = useStats(); // Hook handles data

  return <DashboardUI user={user} stats={stats} />;
}
```

### 4. Type Your Props

```typescript
// ❌ Bad
function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}

// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {label}
    </button>
  );
}
```

### 5. Extract Reusable Styles

```typescript
// Reusable style object
const buttonStyles = {
  base: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  primary: {
    background: '#667eea',
    color: 'white',
  },
  secondary: {
    background: '#e0e0e0',
    color: '#333',
  },
};

function Button({ variant = 'primary', ...props }) {
  return (
    <button
      style={{
        ...buttonStyles.base,
        ...buttonStyles[variant],
      }}
      {...props}
    />
  );
}
```

## Common Mistakes to Avoid

### 1. Forgetting to Return JSX

```typescript
// ❌ Wrong
function Greeting() {
  <h1>Hello!</h1>
}

// ✅ Correct
function Greeting() {
  return <h1>Hello!</h1>;
}
```

### 2. Not Exporting Components

```typescript
// ❌ Wrong - can't import
function MyComponent() {
  return <div>Hello</div>;
}

// ✅ Correct
export function MyComponent() {
  return <div>Hello</div>;
}
```

### 3. Using Signals Without Calling Them

```typescript
const count = signal(0);

// ❌ Wrong
<p>Count: {count}</p>

// ✅ Correct
<p>Count: {count()}</p>
```

### 4. Mutating Props

```typescript
// ❌ Wrong
function Counter({ initialCount }) {
  initialCount++; // Don't mutate props!
  return <div>{initialCount}</div>;
}

// ✅ Correct
function Counter({ initialCount }) {
  const count = signal(initialCount);
  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => count.set(c => c + 1)}>+</button>
    </div>
  );
}
```

### 5. Missing Keys in Lists

```typescript
// ❌ Wrong
{items.map(item => <div>{item.name}</div>)}

// ✅ Correct
{items.map(item => <div key={item.id}>{item.name}</div>)}
```

## Complete Example: Product Card

Here's a complete, real-world component:

```typescript
import { signal } from '@philjs/core';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const quantity = signal(1);
  const isHovered = signal(false);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id);
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        transform: isHovered() ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => isHovered.set(true)}
      onMouseLeave={() => isHovered.set(false)}
    >
      <img
        src={product.image}
        alt={product.name}
        style={styles.image}
      />

      <div style={styles.content}>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.description}>{product.description}</p>

        <div style={styles.footer}>
          <span style={styles.price}>${product.price.toFixed(2)}</span>

          {product.inStock ? (
            <div style={styles.actions}>
              <select
                value={quantity()}
                onChange={(e) => quantity.set(Number(e.target.value))}
                style={styles.select}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <button
                onClick={handleAddToCart}
                style={styles.button}
              >
                Add to Cart
              </button>
            </div>
          ) : (
            <span style={styles.outOfStock}>Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
  },
  content: {
    padding: '1rem',
  },
  name: {
    margin: '0 0 0.5rem',
    fontSize: '1.25rem',
    color: '#333',
  },
  description: {
    margin: '0 0 1rem',
    color: '#666',
    fontSize: '0.9rem',
    lineHeight: 1.5,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    color: '#667eea',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  select: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  button: {
    padding: '0.5rem 1rem',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  outOfStock: {
    color: '#999',
    fontStyle: 'italic' as const,
  },
};
```

**Usage:**
```typescript
const product = {
  id: 1,
  name: 'Wireless Headphones',
  price: 79.99,
  image: '/products/headphones.jpg',
  description: 'Premium sound quality with active noise cancellation',
  inStock: true,
};

<ProductCard
  product={product}
  onAddToCart={(id) => console.log('Added product', id)}
/>
```

## Next Steps

Now that you understand components, you're ready to:

1. **[Learn Signals](../learn/signals.md)** - Master reactive state management
2. **[Build Tic-Tac-Toe](./tutorial-tic-tac-toe.md)** - Practice with a complete game
3. **[Explore Component Patterns](../best-practices/component-patterns.md)** - Advanced composition techniques

## Summary

You've learned:

✅ What components are and why they matter
✅ How to create function components
✅ Using props to make components reusable
✅ JSX syntax and rules
✅ Adding state with signals
✅ Composing components together
✅ Best practices and common mistakes
✅ Building complete, real-world components

Components are the foundation of PhilJS. Master them and you're well on your way to building amazing applications!

---

**Next:** [Tutorial: Tic-Tac-Toe →](./tutorial-tic-tac-toe.md)
