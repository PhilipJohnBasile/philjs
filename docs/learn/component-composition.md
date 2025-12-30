# Component Composition

Composition is how you build complex UIs from simple components. Master composition patterns to write maintainable, reusable code.

## What You'll Learn

- Component composition basics
- Children and slots
- Compound components
- Render props pattern
- Higher-order components
- Composition vs inheritance

## Why Composition?

Composition means building complex components from simpler ones, like Lego blocks.

```typescript
// ❌ Large, monolithic component
function Dashboard() {
  return (
    <div>
      {/* 500 lines of code... */}
    </div>
  );
}

// ✅ Composed from smaller components
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

**Benefits:**
- **Reusability** - Use components in multiple places
- **Maintainability** - Easier to understand and modify
- **Testability** - Test small pieces independently
- **Collaboration** - Team members can work on different components

## Children Pattern

The simplest composition pattern - components that wrap other content:

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

### Layout Components

```typescript
function Container({ children }: { children: any }) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      {children}
    </div>
  );
}

function Page({ children }: { children: any }) {
  return (
    <Container>
      <Header />
      <main>{children}</main>
      <Footer />
    </Container>
  );
}

// Usage:
<Page>
  <h1>Welcome</h1>
  <p>Page content</p>
</Page>
```

### Conditional Wrappers

```typescript
function Authenticated({ children }: { children: any }) {
  const user = useContext(UserContext);

  if (!user()) {
    return <Redirect to="/login" />;
  }

  return children;
}

// Usage:
<Authenticated>
  <Dashboard />
</Authenticated>
```

## Slots Pattern

Named "slots" for multiple children areas:

```typescript
interface ModalProps {
  header?: any;
  body: any;
  footer?: any;
}

function Modal({ header, body, footer }: ModalProps) {
  return (
    <div className="modal">
      {header && (
        <div className="modal-header">
          {header}
        </div>
      )}

      <div className="modal-body">
        {body}
      </div>

      {footer && (
        <div className="modal-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

// Usage:
<Modal
  header={<h2>Confirm Action</h2>}
  body={<p>Are you sure?</p>}
  footer={
    <>
      <button>Cancel</button>
      <button>Confirm</button>
    </>
  }
/>
```

## Compound Components

Components designed to work together:

```typescript
// Tab context
const TabContext = createContext<{
  activeTab: Signal<number>;
  setActiveTab: (index: number) => void;
}>();

function Tabs({ children }: { children: any }) {
  const activeTab = signal(0);
  const setActiveTab = (index: number) => activeTab.set(index);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabContext.Provider>
  );
}

function TabList({ children }: { children: any }) {
  return <div className="tab-list" role="tablist">{children}</div>;
}

function Tab({ index, children }: { index: number; children: any }) {
  const { activeTab, setActiveTab } = useContext(TabContext);
  const isActive = memo(() => activeTab() === index);

  return (
    <button
      role="tab"
      aria-selected={isActive()}
      onClick={() => setActiveTab(index)}
      className={isActive() ? 'tab active' : 'tab'}
    >
      {children}
    </button>
  );
}

function TabPanel({ index, children }: { index: number; children: any }) {
  const { activeTab } = useContext(TabContext);
  const isActive = memo(() => activeTab() === index);

  if (!isActive()) return null;

  return (
    <div role="tabpanel" className="tab-panel">
      {children}
    </div>
  );
}

// Usage:
<Tabs>
  <TabList>
    <Tab index={0}>Profile</Tab>
    <Tab index={1}>Settings</Tab>
    <Tab index={2}>Billing</Tab>
  </TabList>

  <TabPanel index={0}>
    <Profile />
  </TabPanel>

  <TabPanel index={1}>
    <Settings />
  </TabPanel>

  <TabPanel index={2}>
    <Billing />
  </TabPanel>
</Tabs>
```

### Accordion Example

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
    <div className={`accordion-item ${isOpen() ? 'open' : ''}`}>
      {children}
    </div>
  );
}

function AccordionHeader({ id, children }: { id: string; children: any }) {
  const { openItem } = useContext(AccordionContext);

  const toggle = () => {
    openItem.set(openItem() === id ? null : id);
  };

  return (
    <button className="accordion-header" onClick={toggle}>
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

## Render Props Pattern

Pass a function as a child to share logic:

```typescript
function DataFetcher({ url, children }: {
  url: string;
  children: (data: { data: any; loading: boolean; error: Error | null }) => any;
}) {
  const data = signal<any>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  effect(() => {
    fetch(url)
      .then(res => res.json())
      .then(d => {
        data.set(d);
        loading.set(false);
      })
      .catch(e => {
        error.set(e);
        loading.set(false);
      });
  });

  return children({
    data: data(),
    loading: loading(),
    error: error()
  });
}

// Usage:
<DataFetcher url="/api/users">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error error={error} />;
    return <UserList users={data} />;
  }}
</DataFetcher>
```

### Mouse Tracker Example

```typescript
function MouseTracker({ children }: {
  children: (pos: { x: number; y: number }) => any;
}) {
  const position = signal({ x: 0, y: 0 });

  return (
    <div
      onMouseMove={(e) => position.set({ x: e.clientX, y: e.clientY })}
      style={{ height: '100vh' }}
    >
      {children(position())}
    </div>
  );
}

// Usage:
<MouseTracker>
  {({ x, y }) => (
    <div>
      <p>Mouse position: {x}, {y}</p>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 10,
          height: 10,
          background: 'red',
          borderRadius: '50%'
        }}
      />
    </div>
  )}
</MouseTracker>
```

## Container/Presenter Pattern

Separate logic from presentation:

```typescript
// Container - handles logic and data
function UserProfileContainer({ userId }: { userId: number }) {
  const user = signal<User | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  effect(() => {
    fetchUser(userId)
      .then(u => {
        user.set(u);
        loading.set(false);
      })
      .catch(e => {
        error.set(e);
        loading.set(false);
      });
  });

  if (loading()) return <Spinner />;
  if (error()) return <ErrorMessage error={error()!} />;
  if (!user()) return <NotFound />;

  return <UserProfileView user={user()!} />;
}

// Presenter - pure rendering, no logic
function UserProfileView({ user }: { user: User }) {
  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>{user.bio}</p>
    </div>
  );
}
```

## Specialized Components

Build specialized versions of generic components:

```typescript
// Generic Button
function Button({ children, onClick, variant = 'default' }: {
  children: any;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
}) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// Specialized buttons
function PrimaryButton(props: Omit<Parameters<typeof Button>[0], 'variant'>) {
  return <Button {...props} variant="primary" />;
}

function DangerButton(props: Omit<Parameters<typeof Button>[0], 'variant'>) {
  return <Button {...props} variant="danger" />;
}

// Usage:
<PrimaryButton onClick={save}>Save</PrimaryButton>
<DangerButton onClick={deleteItem}>Delete</DangerButton>
```

## Composition Strategies

### Prop Spreading

```typescript
interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary';
  size: 'small' | 'large';
}

function IconButton({ icon, ...buttonProps }: { icon: string } & ButtonProps) {
  return (
    <Button {...buttonProps}>
      <Icon name={icon} />
      {buttonProps.label}
    </Button>
  );
}
```

### Component as Prop

```typescript
function Page({ header, content, sidebar }: {
  header: any;
  content: any;
  sidebar?: any;
}) {
  return (
    <div className="page">
      <header>{header}</header>
      <div className="page-body">
        <main>{content}</main>
        {sidebar && <aside>{sidebar}</aside>}
      </div>
    </div>
  );
}

// Usage:
<Page
  header={<PageHeader title="Dashboard" />}
  content={<DashboardContent />}
  sidebar={<DashboardSidebar />}
/>
```

### Composition with Defaults

```typescript
function List({
  items,
  renderItem,
  emptyState = <p>No items</p>,
  loading = false
}: {
  items: any[];
  renderItem: (item: any) => any;
  emptyState?: any;
  loading?: boolean;
}) {
  if (loading) return <Spinner />;

  if (items.length === 0) {
    return emptyState;
  }

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Usage with custom empty state:
<List
  items={items()}
  renderItem={item => <ItemView item={item} />}
  emptyState={<CustomEmptyState />}
/>
```

## Best Practices

### Prefer Composition Over Configuration

```typescript
// ❌ Configuration - too many props
<Modal
  title="Confirm"
  showHeader={true}
  showFooter={true}
  footerAlign="right"
  confirmText="Yes"
  cancelText="No"
/>

// ✅ Composition - flexible
<Modal>
  <ModalHeader>
    <h2>Confirm</h2>
  </ModalHeader>
  <ModalBody>
    <p>Are you sure?</p>
  </ModalBody>
  <ModalFooter align="right">
    <button>No</button>
    <button>Yes</button>
  </ModalFooter>
</Modal>
```

### Single Responsibility

```typescript
// ✅ Each component does one thing
function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <Avatar src={user.avatar} alt={user.name} />
      <UserInfo name={user.name} email={user.email} />
      <UserActions userId={user.id} />
    </Card>
  );
}
```

### Extract Reusable Pieces

```typescript
// If you're copying code, extract it:

// Before:
function ProductA() {
  return <div className="card">{/* ... */}</div>;
}

function ProductB() {
  return <div className="card">{/* ... */}</div>;
}

// After:
function Card({ children }: { children: any }) {
  return <div className="card">{children}</div>;
}
```

## Composition vs Inheritance

**PhilJS favors composition over inheritance:**

```typescript
// ✅ Composition (recommended) - Functional components with signals
function Button({ children, variant }: ButtonProps) {
  return <button className={`btn btn-${variant}`}>{children}</button>;
}

function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />;
}

function DangerButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="danger" />;
}
```

**Why composition?**
- More flexible
- Easier to understand
- No class hierarchy complexity
- Works with functional components

## Summary

You've learned:

✅ Children pattern for wrapping content
✅ Slots for multiple content areas
✅ Compound components that work together
✅ Render props for sharing logic
✅ Container/Presenter separation
✅ Specialized components from generic ones
✅ Composition over configuration
✅ Composition over inheritance

Master composition and you'll build maintainable, scalable applications!

---

**Next:** [TypeScript Integration →](./typescript-integration.md) Get the most out of TypeScript with PhilJS
