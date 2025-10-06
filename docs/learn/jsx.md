# JSX in PhilJS

JSX is JavaScript XML, a syntax extension that lets you write HTML-like markup inside JavaScript. PhilJS uses JSX as its templating language, providing a familiar and powerful way to describe your UI.

## What is JSX?

JSX transforms this:

```tsx
<div className="card">
  <h1>Hello, {name}!</h1>
</div>
```

Into this:

```tsx
createElement('div', { className: 'card' },
  createElement('h1', null, 'Hello, ', name, '!')
)
```

## Basic Syntax

### Elements

```tsx
// Self-closing elements
<img src="logo.png" alt="Logo" />
<input type="text" />
<br />

// Elements with children
<div>
  <h1>Title</h1>
  <p>Paragraph</p>
</div>

// Nested elements
<section>
  <article>
    <header>
      <h1>Article Title</h1>
    </header>
    <p>Content...</p>
  </article>
</section>
```

### Attributes

```tsx
// String attributes
<img src="photo.jpg" alt="A photo" />

// Number attributes
<input type="number" min={0} max={100} />

// Boolean attributes
<button disabled={true}>Click</button>
<input required />

// Event handlers
<button onClick={handleClick}>Click</button>
<input onInput={handleInput} />
```

### Children

```tsx
// Text children
<h1>Hello World</h1>

// Element children
<div>
  <h1>Title</h1>
  <p>Text</p>
</div>

// Expression children
<p>The count is: {count()}</p>

// Mixed children
<div>
  <h1>Title</h1>
  The count is {count()}
  <button>Click</button>
</div>
```

## Expressions in JSX

### Embedding Expressions

```tsx
import { signal } from 'philjs-core';

function Greeting() {
  const name = signal('Alice');
  const age = signal(25);

  return (
    <div>
      {/* Variables */}
      <p>Name: {name()}</p>

      {/* Calculations */}
      <p>Age next year: {age() + 1}</p>

      {/* Function calls */}
      <p>Uppercase: {name().toUpperCase()}</p>

      {/* Ternary operators */}
      <p>{age() >= 18 ? 'Adult' : 'Minor'}</p>

      {/* Logical operators */}
      <p>{age() >= 21 && 'Can drink alcohol'}</p>
    </div>
  );
}
```

### Complex Expressions

```tsx
function UserCard({ user }) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div class="user-card">
      {/* Function call in JSX */}
      <p>Joined: {formatDate(user.createdAt)}</p>

      {/* Object access */}
      <p>Name: {user.profile.firstName} {user.profile.lastName}</p>

      {/* Array method */}
      <p>Tags: {user.tags.join(', ')}</p>

      {/* Template literal */}
      <p>{`${user.firstName} has ${user.posts.length} posts`}</p>
    </div>
  );
}
```

## Conditional Rendering

### Ternary Operator

```tsx
function LoginButton() {
  const isLoggedIn = signal(false);

  return (
    <div>
      {isLoggedIn() ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}
```

### Logical AND

```tsx
function Notifications() {
  const notifications = signal([]);

  return (
    <div>
      {notifications().length > 0 && (
        <div class="notification-badge">
          {notifications().length}
        </div>
      )}
    </div>
  );
}
```

### Switch Statement

```tsx
function StatusIndicator() {
  const status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  return (
    <div>
      {(() => {
        switch (status()) {
          case 'idle':
            return <div>Ready</div>;
          case 'loading':
            return <div>Loading...</div>;
          case 'success':
            return <div>Success!</div>;
          case 'error':
            return <div>Error occurred</div>;
        }
      })()}
    </div>
  );
}
```

## Lists and Keys

### Rendering Arrays

```tsx
function TodoList() {
  const todos = signal([
    { id: 1, text: 'Learn PhilJS', done: false },
    { id: 2, text: 'Build app', done: false },
    { id: 3, text: 'Deploy', done: false }
  ]);

  return (
    <ul>
      {todos().map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={(e) => updateTodo(todo.id, e.target.checked)}
          />
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

### Keys

Keys help PhilJS identify which items have changed:

```tsx
// ✅ Good - unique ID as key
{items.map(item => (
  <div key={item.id}>{item.text}</div>
))}

// ⚠️ OK - index as key (only if list never reorders)
{items.map((item, index) => (
  <div key={index}>{item.text}</div>
))}

// ❌ Bad - no key
{items.map(item => (
  <div>{item.text}</div>
))}
```

## Components in JSX

### Using Components

```tsx
function App() {
  return (
    <div>
      {/* Self-closing component */}
      <Header />

      {/* Component with props */}
      <UserProfile name="Alice" age={25} />

      {/* Component with children */}
      <Card title="My Card">
        <p>Card content here</p>
      </Card>

      {/* Nested components */}
      <Dashboard>
        <Sidebar>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/about">About</NavLink>
        </Sidebar>
        <MainContent />
      </Dashboard>
    </div>
  );
}
```

### Spreading Props

```tsx
function Button(props) {
  return (
    <button
      {...props}
      class={`btn ${props.class || ''}`}
    >
      {props.children}
    </button>
  );
}

// Usage
<Button class="primary" onClick={handleClick}>
  Click Me
</Button>
```

## Fragments

Group elements without adding extra DOM nodes:

```tsx
import { Fragment } from 'philjs-core';

function ListItems() {
  return (
    <Fragment>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </Fragment>
  );
}

// Short syntax
function ListItems() {
  return (
    <>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </>
  );
}
```

## Special Attributes

### className

Use `class` or `className` for CSS classes:

```tsx
// Both work in PhilJS
<div class="container" />
<div className="container" />

// Dynamic classes
<div class={isActive() ? 'active' : 'inactive'} />

// Multiple classes
<div class={`btn ${isPrimary() ? 'btn-primary' : 'btn-secondary'}`} />
```

### style

```tsx
// Object style
<div style={{
  color: 'blue',
  fontSize: '16px',
  backgroundColor: '#f0f0f0'
}} />

// Dynamic style
<div style={{
  opacity: isVisible() ? 1 : 0,
  transform: `translateX(${offset()}px)`
}} />

// String style (not recommended)
<div style="color: blue; font-size: 16px;" />
```

### dangerouslySetInnerHTML

```tsx
function BlogPost({ html }) {
  return (
    <article
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ⚠️ Warning: Only use with sanitized HTML!
```

### ref

```tsx
function VideoPlayer() {
  let videoRef: HTMLVideoElement | undefined;

  const play = () => {
    videoRef?.play();
  };

  return (
    <div>
      <video ref={videoRef} src="video.mp4" />
      <button onClick={play}>Play</button>
    </div>
  );
}
```

## Event Handlers

### Basic Events

```tsx
function EventExamples() {
  const handleClick = (e: MouseEvent) => {
    console.log('Clicked at:', e.clientX, e.clientY);
  };

  const handleInput = (e: InputEvent) => {
    const value = (e.target as HTMLInputElement).value;
    console.log('Input:', value);
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    console.log('Form submitted');
  };

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <input onInput={handleInput} />
      <form onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
```

### Inline Event Handlers

```tsx
function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
      <button onClick={() => count.set(count() - 1)}>
        Decrement
      </button>
    </div>
  );
}
```

### Event Capturing

```tsx
function EventPropagation() {
  return (
    <div
      onClickCapture={() => console.log('Div clicked (capture)')}
      onClick={() => console.log('Div clicked (bubble)')}
    >
      <button
        onClick={(e) => {
          console.log('Button clicked');
          e.stopPropagation(); // Stop event bubbling
        }}
      >
        Click me
      </button>
    </div>
  );
}
```

## Comments in JSX

```tsx
function Component() {
  return (
    <div>
      {/* Single line comment */}

      {/*
        Multi-line
        comment
      */}

      <p>Text</p>

      {/* Comment between elements */}

      <p>More text</p>
    </div>
  );
}
```

## TypeScript with JSX

### Typed Props

```tsx
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
}

function Button({ label, variant = 'primary', onClick, disabled }: ButtonProps) {
  return (
    <button
      class={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

### Typed Children

```tsx
import { JSX } from 'philjs-core';

interface CardProps {
  title: string;
  children: JSX.Element;
}

function Card({ title, children }: CardProps) {
  return (
    <div class="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Generic Components

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => JSX.Element;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

## Advanced Patterns

### Render Props

```tsx
interface MouseTrackerProps {
  children: (position: { x: number; y: number }) => JSX.Element;
}

function MouseTracker({ children }: MouseTrackerProps) {
  const position = signal({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent) => {
    position.set({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onMouseMove={handleMouseMove}>
      {children(position())}
    </div>
  );
}

// Usage
<MouseTracker>
  {(pos) => (
    <p>Mouse at: {pos.x}, {pos.y}</p>
  )}
</MouseTracker>
```

### Higher-Order Components

```tsx
function withLoading<P extends object>(
  Component: (props: P) => JSX.Element
) {
  return (props: P & { loading: boolean }) => {
    if (props.loading) {
      return <div>Loading...</div>;
    }
    return <Component {...props} />;
  };
}

// Usage
const UserProfileWithLoading = withLoading(UserProfile);

<UserProfileWithLoading loading={isLoading()} user={user()} />
```

### Slot Pattern

```tsx
interface LayoutProps {
  header: JSX.Element;
  sidebar: JSX.Element;
  content: JSX.Element;
  footer: JSX.Element;
}

function Layout({ header, sidebar, content, footer }: LayoutProps) {
  return (
    <div class="layout">
      <header>{header}</header>
      <div class="main">
        <aside>{sidebar}</aside>
        <main>{content}</main>
      </div>
      <footer>{footer}</footer>
    </div>
  );
}

// Usage
<Layout
  header={<AppHeader />}
  sidebar={<Sidebar />}
  content={<MainContent />}
  footer={<AppFooter />}
/>
```

## JSX Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "philjs-core"
  }
}
```

### Custom JSX Factory

```tsx
/** @jsxImportSource philjs-core */

function Component() {
  return <div>Hello</div>;
}
```

## Best Practices

### ✅ Do: Keep JSX Readable

```tsx
// ✅ Good - formatted and readable
<UserCard
  name={user.name}
  email={user.email}
  avatar={user.avatar}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

// ❌ Bad - hard to read
<UserCard name={user.name} email={user.email} avatar={user.avatar} onEdit={handleEdit} onDelete={handleDelete} />
```

### ✅ Do: Extract Complex JSX

```tsx
// ✅ Good - extracted to variable
function UserProfile() {
  const userActions = (
    <div class="actions">
      <button onClick={handleEdit}>Edit</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );

  return (
    <div>
      <h1>Profile</h1>
      {userActions}
    </div>
  );
}
```

### ✅ Do: Use Semantic HTML

```tsx
// ✅ Good - semantic HTML
<article>
  <header>
    <h1>Title</h1>
  </header>
  <section>
    <p>Content</p>
  </section>
</article>

// ❌ Bad - divs everywhere
<div>
  <div>
    <div>Title</div>
  </div>
  <div>
    <div>Content</div>
  </div>
</div>
```

### ❌ Don't: Mutate Props

```tsx
// ❌ Bad - mutating props
function Component(props) {
  props.value = 'new value'; // Don't do this!
  return <div>{props.value}</div>;
}

// ✅ Good - use signals for state
function Component(props) {
  const value = signal(props.value);
  value.set('new value');
  return <div>{value()}</div>;
}
```

## Next Steps

- [Components](/docs/learn/components.md) - Master component patterns
- [TypeScript](/docs/learn/typescript.md) - Type-safe JSX
- [Styling](/docs/learn/styling.md) - Style your JSX
- [Conditional Rendering](/docs/learn/conditional-rendering.md) - Advanced conditionals

---

💡 **Tip**: Use the JSX spread operator `{...props}` to pass all props to a child component.

⚠️ **Warning**: Always provide a unique `key` when rendering lists to help PhilJS track changes.

ℹ️ **Note**: PhilJS JSX is similar to React's JSX, making it easy to migrate existing React knowledge.
