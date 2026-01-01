# Component Patterns

Essential patterns for building maintainable, reusable PhilJS components.

## Component Types

### Presentational Components

Pure components that receive data via props and render UI.

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

function Button({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  size = 'medium'
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

**Benefits:**
- Easy to test
- Highly reusable
- No side effects
- Predictable behavior

### Container Components

Components that manage state and logic.

```tsx
function UserDashboard() {
  const user = signal<User | null>(null);
  const loading = signal(true);
  const error = signal<string | null>(null);

  effect(async () => {
    try {
      const data = await fetchCurrentUser();
      user.set(data);
    } catch (err) {
      error.set(err.message);
    } finally {
      loading.set(false);
    }
  });

  if (loading()) return <LoadingSpinner />;
  if (error()) return <ErrorMessage message={error()!} />;
  if (!user()) return <NotFound />;

  return <UserDashboardView user={user()!} />;
}

function UserDashboardView({ user }: { user: User }) {
  return (
    <div>
      <UserHeader user={user} />
      <UserStats user={user} />
      <UserActivity user={user} />
    </div>
  );
}
```

**Benefits:**
- Separation of concerns
- Presentational components stay pure
- Logic centralized and testable

## Composition Patterns

### Children Pattern

Pass components as children.

```tsx
interface CardProps {
  children: JSX.Element;
  title?: string;
  footer?: JSX.Element;
}

function Card({ children, title, footer }: CardProps) {
  return (
    <div className="card">
      {title && <div className="card-header">{title}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// Usage
<Card
  title="User Profile"
  footer={<Button label="Save" onClick={handleSave} />}
>
  <UserForm />
</Card>
```

### Render Props Pattern

Pass functions as props to customize rendering.

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => JSX.Element;
  renderEmpty?: () => JSX.Element;
}

function List<T>({ items, renderItem, renderEmpty }: ListProps<T>) {
  if (items.length === 0 && renderEmpty) {
    return renderEmpty();
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// Usage
<List
  items={users()}
  renderItem={(user) => (
    <UserCard user={user} />
  )}
  renderEmpty={() => <div>No users found</div>}
/>
```

### Compound Components Pattern

Components that work together to form a cohesive API.

```tsx
function Tabs({ children }: { children: JSX.Element }) {
  const activeTab = signal(0);

  return (
    <TabsContext.Provider value={{ activeTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }: { children: JSX.Element }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ index, children }: { index: number; children: JSX.Element }) {
  const { activeTab } = useContext(TabsContext);

  return (
    <button
      className={activeTab() === index ? 'tab active' : 'tab'}
      onClick={() => activeTab.set(index)}
    >
      {children}</button>
  );
}

function TabPanels({ children }: { children: JSX.Element[] }) {
  const { activeTab } = useContext(TabsContext);
  return <div className="tab-panels">{children[activeTab()]}</div>;
}

function TabPanel({ children }: { children: JSX.Element }) {
  return <div className="tab-panel">{children}</div>;
}

// Attach sub-components
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;

// Usage
<Tabs>
  <Tabs.List>
    <Tabs.Tab index={0}>Profile</Tabs.Tab>
    <Tabs.Tab index={1}>Settings</Tabs.Tab>
    <Tabs.Tab index={2}>Activity</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panels>
    <Tabs.Panel><ProfileContent /></Tabs.Panel>
    <Tabs.Panel><SettingsContent /></Tabs.Panel>
    <Tabs.Panel><ActivityContent /></Tabs.Panel>
  </Tabs.Panels>
</Tabs>
```

## Props Patterns

### Optional Props with Defaults

```tsx
interface TooltipProps {
  content: string;
  children: JSX.Element;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200
}: TooltipProps) {
  const visible = signal(false);

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setTimeout(() => visible.set(true), delay)}
      onMouseLeave={() => visible.set(false)}
    >
      {children}
      {visible() && (
        <div className={`tooltip tooltip-${position}`}>
          {content}
        </div>
      )}
    </div>
  );
}
```

### Discriminated Union Props

```tsx
type ButtonProps =
  | {
      variant: 'link';
      href: string;
      onClick?: never;
    }
  | {
      variant: 'button';
      onClick: () => void;
      href?: never;
    };

function SmartButton(props: ButtonProps) {
  if (props.variant === 'link') {
    return <a href={props.href} className="btn-link">{props.children}</a>;
  }

  return (
    <button onClick={props.onClick} className="btn">
      {props.children}
    </button>
  );
}

// Type-safe usage
<SmartButton variant="link" href="/about">About</SmartButton>
<SmartButton variant="button" onClick={() => save()}>Save</SmartButton>
```

### Polymorphic Components

```tsx
type As = keyof JSX.IntrinsicElements;

interface BoxProps<T extends As = 'div'> {
  as?: T;
  children: JSX.Element;
}

function Box<T extends As = 'div'>({
  as,
  children,
  ...props
}: BoxProps<T> & Omit<JSX.IntrinsicElements[T], 'as'>) {
  const Component = as || 'div';
  return <Component {...props}>{children}</Component>;
}

// Usage
<Box>Default div</Box>
<Box as="section">Rendered as section</Box>
<Box as="article">Rendered as article</Box>
```

## State Management Patterns

### Lifting State Up

```tsx
function TemperatureCalculator() {
  const temperature = signal('');
  const scale = signal<'C' | 'F'>('C');

  return (
    <div>
      <TemperatureInput
        scale="C"
        temperature={temperature()}
        onTemperatureChange={temperature.set}
        onScaleChange={() => scale.set('C')}
      />

      <TemperatureInput
        scale="F"
        temperature={temperature()}
        onTemperatureChange={temperature.set}
        onScaleChange={() => scale.set('F')}
      />

      <BoilingVerdict celsius={toCelsius(temperature(), scale())} />
    </div>
  );
}
```

### Local State

```tsx
function Accordion({ title, children }: { title: string; children: JSX.Element }) {
  const isOpen = signal(false);

  return (
    <div className="accordion">
      <button
        className="accordion-header"
        onClick={() => isOpen.set(!isOpen())}
      >
        {title}
        <span>{isOpen() ? '▼' : '▶'}</span>
      </button>

      {isOpen() && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  );
}
```

### Controlled vs Uncontrolled

**Controlled:**
```tsx
interface InputProps {
  value: string;
  onChange: (value: string) => void;
}

function ControlledInput({ value, onChange }: InputProps) {
  return (
    <input
      value={value}
      onInput={(e) => onChange(e.currentTarget.value)}
    />
  );
}

// Usage
function Form() {
  const email = signal('');

  return <ControlledInput value={email()} onChange={email.set} />;
}
```

**Uncontrolled:**
```tsx
function UncontrolledInput({ defaultValue }: { defaultValue?: string }) {
  let inputRef: HTMLInputElement | undefined;

  const getValue = () => inputRef?.value || '';

  return <input ref={inputRef} defaultValue={defaultValue} />;
}
```

## Error Handling Patterns

### Error Boundaries

```tsx
function App() {
  return (
    <ErrorBoundary
      fallback={(error) => <ErrorPage error={error} />}
      onError={(error) => {
        logError(error);
        reportToSentry(error);
      }}
    >
      <Router>
        <Routes />
      </Router>
    </ErrorBoundary>
  );
}

function ErrorPage({ error }: { error: Error }) {
  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <Button label="Go Home" onClick={() => window.location.href = '/'} />
    </div>
  );
}
```

### Try-Catch in Effects

```tsx
function UserProfile({ userId }: { userId: string }) {
  const user = signal<User | null>(null);
  const error = signal<Error | null>(null);
  const loading = signal(true);

  effect(async () => {
    loading.set(true);
    error.set(null);

    try {
      const data = await fetchUser(userId);
      user.set(data);
    } catch (err) {
      error.set(err as Error);
    } finally {
      loading.set(false);
    }
  });

  if (loading()) return <Spinner />;
  if (error()) return <ErrorMessage error={error()!} />;
  if (!user()) return <NotFound />;

  return <UserCard user={user()!} />;
}
```

## Loading States

### Suspense Pattern

```tsx
import { Suspense, lazy } from '@philjs/core';

const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Router>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
      </Router>
    </Suspense>
  );
}

function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size="large" />
      <p>Loading...</p>
    </div>
  );
}
```

### Skeleton Screens

```tsx
function UserCard({ user }: { user: User | null }) {
  if (!user) {
    return <UserCardSkeleton />;
  }

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.bio}</p>
    </div>
  );
}

function UserCardSkeleton() {
  return (
    <div className="user-card skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-text" />
      <div className="skeleton-text short" />
    </div>
  );
}
```

## Conditional Rendering

### Multiple Conditions

```tsx
function UserStatus({ user }: { user: User }) {
  if (!user.emailVerified) {
    return <VerifyEmailBanner email={user.email} />;
  }

  if (user.subscription === 'trial' && user.trialEndsIn < 3) {
    return <TrialExpiringBanner daysLeft={user.trialEndsIn} />;
  }

  if (!user.hasCompletedOnboarding) {
    return <OnboardingBanner />;
  }

  return null;
}
```

### Render Functions

```tsx
function Panel({ status }: { status: 'loading' | 'error' | 'success' | 'empty' }) {
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <Spinner />;
      case 'error':
        return <ErrorMessage />;
      case 'empty':
        return <EmptyState />;
      case 'success':
        return <DataView />;
    }
  };

  return (
    <div className="panel">
      {renderContent()}
    </div>
  );
}
```

## Form Patterns

### Controlled Form

```tsx
function LoginForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal<Record<string, string>>({});
  const submitting = signal(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email())) {
      newErrors.email = 'Invalid email format';
    }

    if (!password()) {
      newErrors.password = 'Password is required';
    } else if (password().length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validate()) return;

    submitting.set(true);

    try {
      await login(email(), password());
    } catch (err) {
      errors.set({ form: 'Login failed. Please try again.' });
    } finally {
      submitting.set(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        value={email()}
        onChange={email.set}
        error={errors().email}
      />

      <Input
        label="Password"
        type="password"
        value={password()}
        onChange={password.set}
        error={errors().password}
      />

      {errors().form && <FormError message={errors().form} />}

      <Button
        type="submit"
        label="Log In"
        disabled={submitting()}
        loading={submitting()}
      />
    </form>
  );
}
```

## List Rendering

### With Keys

```tsx
function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <UserCard user={user} />
        </li>
      ))}
    </ul>
  );
}
```

### With Index (When Appropriate)

```tsx
function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="steps">
      {steps.map((step, index) => (
        <div
          key={index} // OK here - list is static
          className={index === current ? 'step active' : 'step'}
        >
          {step}
        </div>
      ))}
    </div>
  );
}
```

### Empty States

```tsx
function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBagIcon />}
        title="No products found"
        description="Try adjusting your filters"
        action={<Button label="Clear Filters" onClick={clearFilters} />}
      />
    );
  }

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Summary

**Key Takeaways:**

✅ Separate presentational and container components
✅ Use composition over complex inheritance
✅ Design clear, type-safe prop interfaces
✅ Handle errors gracefully with boundaries
✅ Provide loading states and skeletons
✅ Use controlled components for forms
✅ Always provide keys for lists
✅ Handle empty states explicitly

**Next:** [State Management →](./state-management.md)

