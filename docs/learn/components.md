# Components

Components are the building blocks of every PhilJS application. They encapsulate UI, logic, and state into reusable pieces.

## What You'll Learn

- How components work in PhilJS
- Function components and JSX
- Props and prop types
- Component best practices
- Common patterns

## Components Are Just Functions

In PhilJS, every component is a JavaScript function that returns JSX:

```typescript
export function Welcome() {
  return <h1>Hello, PhilJS!</h1>;
}
```

That's it! No classes, no complex APIs—just a function returning markup.

### Why Functions?

Functions are:
- **Simple** - Easy to understand and test
- **Composable** - Combine small functions into larger ones
- **Type-safe** - TypeScript works perfectly
- **Standard JavaScript** - No framework-specific syntax to learn

## Component Rules

### 1. Components Must Start with a Capital Letter

```typescript
// ✅ Correct
function UserProfile() {
  return <div>Profile</div>;
}

// ❌ Wrong - lowercase won't work
function userProfile() {
  return <div>Profile</div>;
}
```

**Why:** PhilJS needs to distinguish between components (`<UserProfile />`) and HTML elements (`<div>`).

### 2. Components Must Return JSX

```typescript
// ✅ Correct
function Greeting() {
  return <h1>Hello!</h1>;
}

// ❌ Wrong - no return statement
function Greeting() {
  <h1>Hello!</h1>;
}
```

### 3. Export Components to Use Them

```typescript
// ✅ Correct - can be imported
export function Button() {
  return <button>Click me</button>;
}

// ❌ Wrong - can't be imported
function Button() {
  return <button>Click me</button>;
}
```

## Props: Passing Data to Components

Props make components reusable by allowing you to pass different data:

```typescript
interface GreetingProps {
  name: string;
}

export function Greeting({ name }: GreetingProps) {
  return <h1>Hello, {name}!</h1>;
}

// Usage:
<Greeting name="Alice" />
<Greeting name="Bob" />
```

### Props Are Read-Only

**Never modify props directly:**

```typescript
// ❌ Wrong
function Counter({ count }: { count: number }) {
  count++; // Don't mutate props!
  return <div>{count}</div>;
}

// ✅ Correct - use a signal for mutable state
function Counter({ initialCount }: { initialCount: number }) {
  const count = signal(initialCount);
  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => count.set(c => c + 1)}>+</button>
    </div>
  );
}
```

### TypeScript Props

Always type your props:

```typescript
// Basic props
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// Optional props
interface UserCardProps {
  name: string;
  email?: string; // Optional
  avatar?: string; // Optional
}

// Props with defaults
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
}

export function Button({
  label,
  variant = 'primary' // Default value
}: ButtonProps) {
  return <button className={variant}>{label}</button>;
}
```

### Children Prop

Components can accept children:

```typescript
interface CardProps {
  children: any;
  title?: string;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

// Usage:
<Card title="Welcome">
  <p>This is the card content</p>
  <button>Action</button>
</Card>
```

### Spread Props

Pass multiple props at once:

```typescript
interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const buttonProps = {
  label: 'Click me',
  variant: 'primary' as const,
  size: 'medium' as const,
};

<Button {...buttonProps} />
```

## Component Composition

Build complex UIs from simple components:

```typescript
// Small, focused components
function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: 48, height: 48, borderRadius: '50%' }}
    />
  );
}

function UserInfo({ name, email }: { name: string; email: string }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}

// Composed component
function UserCard({ user }: { user: User }) {
  return (
    <div className="user-card">
      <Avatar src={user.avatar} alt={user.name} />
      <UserInfo name={user.name} email={user.email} />
    </div>
  );
}
```

### Composition vs Configuration

Prefer composition over configuration props:

```typescript
// ❌ Less flexible - configuration approach
interface ModalProps {
  title: string;
  content: string;
  showFooter: boolean;
  footerContent?: string;
  showCloseButton: boolean;
}

// ✅ More flexible - composition approach
interface ModalProps {
  children: any;
}

function Modal({ children }: ModalProps) {
  return <div className="modal">{children}</div>;
}

function ModalHeader({ children }: { children: any }) {
  return <div className="modal-header">{children}</div>;
}

function ModalBody({ children }: { children: any }) {
  return <div className="modal-body">{children}</div>;
}

function ModalFooter({ children }: { children: any }) {
  return <div className="modal-footer">{children}</div>;
}

// Usage:
<Modal>
  <ModalHeader>
    <h2>Confirm Action</h2>
  </ModalHeader>
  <ModalBody>
    <p>Are you sure you want to delete this item?</p>
  </ModalBody>
  <ModalFooter>
    <button>Cancel</button>
    <button>Delete</button>
  </ModalFooter>
</Modal>
```

## Conditional Rendering

Show different UI based on conditions:

### Using && Operator

```typescript
function Notification({ message, show }: { message: string; show: boolean }) {
  return (
    <div>
      {show && <div className="notification">{message}</div>}
    </div>
  );
}
```

### Using Ternary Operator

```typescript
function StatusBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <span className={isOnline ? 'badge-success' : 'badge-gray'}>
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}
```

### Using if/else

```typescript
function Greeting({ user }: { user: User | null }) {
  if (!user) {
    return <div>Please sign in</div>;
  }

  if (user.isAdmin) {
    return <div>Welcome, Admin {user.name}</div>;
  }

  return <div>Welcome, {user.name}</div>;
}
```

### Switch Statement Pattern

```typescript
type Status = 'loading' | 'error' | 'success' | 'idle';

function StatusView({ status, data, error }: {
  status: Status;
  data?: any;
  error?: Error;
}) {
  switch (status) {
    case 'loading':
      return <Spinner />;
    case 'error':
      return <ErrorMessage error={error} />;
    case 'success':
      return <DataView data={data} />;
    case 'idle':
    default:
      return <EmptyState />;
  }
}
```

## Rendering Lists

Use `.map()` to render arrays:

```typescript
interface User {
  id: number;
  name: string;
}

function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Always Include Keys

Keys help PhilJS identify which items changed:

```typescript
// ✅ Correct - unique key
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// ❌ Wrong - using index as key (avoid if list can change)
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// ❌ Wrong - no key
{items.map(item => (
  <div>{item.name}</div>
))}
```

**When to use index as key:**
- List never reorders
- List never filters
- Items don't have stable IDs

**Otherwise, use stable, unique IDs.**

## Component Patterns

### Container/Presenter Pattern

Separate data fetching from presentation:

```typescript
// Container - handles data
function UserProfileContainer({ userId }: { userId: number }) {
  const user = signal<User | null>(null);
  const loading = signal(true);

  effect(() => {
    fetchUser(userId).then(data => {
      user.set(data);
      loading.set(false);
    });
  });

  if (loading()) return <Spinner />;
  if (!user()) return <Error />;

  return <UserProfileView user={user()!} />;
}

// Presenter - pure rendering
function UserProfileView({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Compound Components

Components that work together:

```typescript
const AccordionContext = createContext<{
  openItem: Signal<string | null>;
}>();

function Accordion({ children }: { children: any }) {
  const openItem = signal<string | null>(null);

  return (
    <AccordionContext.Provider value={{ openItem }}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ id, children }: { id: string; children: any }) {
  const { openItem } = useContext(AccordionContext);
  const isOpen = memo(() => openItem() === id);

  return (
    <div className={isOpen() ? 'accordion-item open' : 'accordion-item'}>
      {children}
    </div>
  );
}

function AccordionHeader({ id, children }: { id: string; children: any }) {
  const { openItem } = useContext(AccordionContext);

  return (
    <button
      className="accordion-header"
      onClick={() => openItem.set(openItem() === id ? null : id)}
    >
      {children}
    </button>
  );
}

function AccordionContent({ children }: { children: any }) {
  return <div className="accordion-content">{children}</div>;
}

// Usage:
<Accordion>
  <AccordionItem id="item1">
    <AccordionHeader id="item1">Section 1</AccordionHeader>
    <AccordionContent>Content for section 1</AccordionContent>
  </AccordionItem>
  <AccordionItem id="item2">
    <AccordionHeader id="item2">Section 2</AccordionHeader>
    <AccordionContent>Content for section 2</AccordionContent>
  </AccordionItem>
</Accordion>
```

## Best Practices

### Keep Components Small

```typescript
// ❌ Too large
function Dashboard() {
  // 300 lines of code...
  return <div>...</div>;
}

// ✅ Broken into smaller pieces
function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardStats />
      <DashboardCharts />
      <DashboardActivity />
    </div>
  );
}
```

### Single Responsibility

Each component should do one thing:

```typescript
// ❌ Doing too much
function UserPage({ userId }) {
  // Fetches user data
  // Fetches posts
  // Handles authentication
  // Renders entire page
}

// ✅ Focused responsibilities
function UserPage({ userId }) {
  return (
    <AuthGuard>
      <UserDataProvider userId={userId}>
        <UserProfile />
        <UserPosts />
      </UserDataProvider>
    </AuthGuard>
  );
}
```

### Descriptive Names

```typescript
// ❌ Vague
function Card() {}
function Item() {}
function Component1() {}

// ✅ Descriptive
function ProductCard() {}
function ShoppingCartItem() {}
function UserProfileHeader() {}
```

### Extract Reusable Components

If you copy-paste, extract a component:

```typescript
// ❌ Repeated code
function ProductA() {
  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd' }}>
      <h3>Product A</h3>
    </div>
  );
}

function ProductB() {
  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd' }}>
      <h3>Product B</h3>
    </div>
  );
}

// ✅ Extracted component
function Card({ children }: { children: any }) {
  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd' }}>
      {children}
    </div>
  );
}

function ProductA() {
  return <Card><h3>Product A</h3></Card>;
}

function ProductB() {
  return <Card><h3>Product B</h3></Card>;
}
```

## Common Mistakes

### Not Calling Signals

```typescript
const count = signal(0);

// ❌ Wrong
<div>{count}</div> // Shows [object Object]

// ✅ Correct
<div>{count()}</div> // Shows 0
```

### Mutating Props

```typescript
// ❌ Wrong
function TodoItem({ todo }) {
  todo.completed = true; // Don't mutate!
  return <div>...</div>;
}

// ✅ Correct
function TodoItem({ todo, onToggle }) {
  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
    </div>
  );
}
```

### Missing Keys in Lists

```typescript
// ❌ Wrong
{users.map(user => <div>{user.name}</div>)}

// ✅ Correct
{users.map(user => <div key={user.id}>{user.name}</div>)}
```

## Summary

You've learned:

✅ Components are functions that return JSX
✅ Props make components reusable
✅ Always type your props with TypeScript
✅ Compose small components into larger ones
✅ Use conditional rendering and lists
✅ Follow best practices for maintainable code

Components are the foundation. Master them and you're ready to build anything!

---

**Next:** [Signals →](./signals.md) Learn PhilJS's reactive state management
