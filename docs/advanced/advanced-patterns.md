# Advanced Patterns

Expert techniques and patterns for PhilJS applications.

## What You'll Learn

- Compound components
- Render props
- Custom hooks
- Higher-order components
- Dependency injection
- Plugin systems
- Best practices

## Compound Components

### Flexible Component APIs

```typescript
import { createContext, useContext, signal } from 'philjs-core';

interface TabsContext {
  activeTab: () => string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContext | null>(null);

export function Tabs({ children, defaultTab }: { children: JSX.Element; defaultTab: string }) {
  const activeTab = signal(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: activeTab.set }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children }: { children: JSX.Element }) {
  return <div className="tab-list" role="tablist">{children}</div>;
}

export function Tab({ id, children }: { id: string; children: JSX.Element }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const { activeTab, setActiveTab } = context;
  const isActive = () => activeTab() === id;

  return (
    <button
      className={isActive() ? 'tab active' : 'tab'}
      role="tab"
      aria-selected={isActive()}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
}

export function TabPanels({ children }: { children: JSX.Element }) {
  return <div className="tab-panels">{children}</div>;
}

export function TabPanel({ id, children }: { id: string; children: JSX.Element }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  const { activeTab } = context;

  if (activeTab() !== id) return null;

  return (
    <div className="tab-panel" role="tabpanel">
      {children}
    </div>
  );
}

// Usage
function App() {
  return (
    <Tabs defaultTab="profile">
      <TabList>
        <Tab id="profile">Profile</Tab>
        <Tab id="settings">Settings</Tab>
        <Tab id="billing">Billing</Tab>
      </TabList>

      <TabPanels>
        <TabPanel id="profile">
          <ProfileContent />
        </TabPanel>
        <TabPanel id="settings">
          <SettingsContent />
        </TabPanel>
        <TabPanel id="billing">
          <BillingContent />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
```

## Render Props

### Flexible Rendering

```typescript
interface DataLoaderProps<T> {
  url: string;
  children: (data: {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => JSX.Element;
}

export function DataLoader<T>({ url, children }: DataLoaderProps<T>) {
  const data = signal<T | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  const fetchData = async () => {
    loading.set(true);
    error.set(null);

    try {
      const response = await fetch(url);
      const json = await response.json();
      data.set(json);
    } catch (err) {
      error.set(err as Error);
    } finally {
      loading.set(false);
    }
  };

  effect(() => {
    fetchData();
  });

  return children({
    data: data(),
    loading: loading(),
    error: error(),
    refetch: fetchData
  });
}

// Usage
function UserProfile() {
  return (
    <DataLoader<User> url="/api/user">
      {({ data, loading, error, refetch }) => {
        if (loading) return <div>Loading...</div>;
        if (error) return <div>Error: {error.message}</div>;
        if (!data) return null;

        return (
          <div>
            <h1>{data.name}</h1>
            <p>{data.email}</p>
            <button onClick={refetch}>Refresh</button>
          </div>
        );
      }}
    </DataLoader>
  );
}
```

## Custom Hooks

### Reusable Logic Extraction

```typescript
import { signal, effect, memo } from 'philjs-core';

// Mouse position hook
export function useMousePosition() {
  const position = signal({ x: 0, y: 0 });

  effect(() => {
    const handleMove = (e: MouseEvent) => {
      position.set({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMove);

    return () => window.removeEventListener('mousemove', handleMove);
  });

  return position;
}

// Window size hook
export function useWindowSize() {
  const size = signal({
    width: window.innerWidth,
    height: window.innerHeight
  });

  effect(() => {
    const handleResize = () => {
      size.set({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  });

  return size;
}

// Media query hook
export function useMediaQuery(query: string) {
  const matches = signal(window.matchMedia(query).matches);

  effect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (e: MediaQueryListEvent) => {
      matches.set(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  });

  return matches;
}

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const storedValue = localStorage.getItem(key);
  const state = signal<T>(
    storedValue ? JSON.parse(storedValue) : initialValue
  );

  effect(() => {
    localStorage.setItem(key, JSON.stringify(state()));
  });

  return state;
}

// Debounced value hook
export function useDebounce<T>(value: () => T, delay: number) {
  const debouncedValue = signal(value());

  effect(() => {
    const handler = setTimeout(() => {
      debouncedValue.set(value());
    }, delay);

    return () => clearTimeout(handler);
  });

  return debouncedValue;
}

// Usage
function Component() {
  const mouse = useMousePosition();
  const windowSize = useWindowSize();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const theme = useLocalStorage('theme', 'light');

  return (
    <div>
      <p>Mouse: {mouse().x}, {mouse().y}</p>
      <p>Window: {windowSize().width}x{windowSize().height}</p>
      <p>Mobile: {isMobile() ? 'Yes' : 'No'}</p>
      <p>Theme: {theme()}</p>
    </div>
  );
}
```

## Higher-Order Components

### Component Composition

```typescript
// With loading state
export function withLoading<P extends object>(
  Component: (props: P) => JSX.Element,
  url: string
) {
  return (props: P) => {
    const data = signal(null);
    const loading = signal(true);

    effect(async () => {
      const response = await fetch(url);
      data.set(await response.json());
      loading.set(false);
    });

    if (loading()) {
      return <div>Loading...</div>;
    }

    return <Component {...props} data={data()} />;
  };
}

// With error boundary
export function withErrorBoundary<P extends object>(
  Component: (props: P) => JSX.Element
) {
  return (props: P) => {
    const error = signal<Error | null>(null);

    try {
      return <Component {...props} />;
    } catch (err) {
      error.set(err as Error);
      return <div>Error: {error()?.message}</div>;
    }
  };
}

// With analytics
export function withAnalytics<P extends object>(
  Component: (props: P) => JSX.Element,
  eventName: string
) {
  return (props: P) => {
    effect(() => {
      analytics.track(eventName, props);
    });

    return <Component {...props} />;
  };
}

// Compose HOCs
const EnhancedComponent = withErrorBoundary(
  withLoading(
    withAnalytics(MyComponent, 'component-viewed'),
    '/api/data'
  )
);
```

## Dependency Injection

### Injectable Services

```typescript
import { createContext, useContext } from 'philjs-core';

// Define service interface
interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
}

// Implementations
class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(message);
  }

  error(message: string) {
    console.error(message);
  }
}

class RemoteLogger implements Logger {
  log(message: string) {
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify({ level: 'info', message })
    });
  }

  error(message: string) {
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify({ level: 'error', message })
    });
  }
}

// Create context
const LoggerContext = createContext<Logger | null>(null);

export function useLogger() {
  const logger = useContext(LoggerContext);
  if (!logger) {
    throw new Error('Logger not provided');
  }
  return logger;
}

// Provider
export function LoggerProvider({
  logger,
  children
}: {
  logger: Logger;
  children: JSX.Element;
}) {
  return (
    <LoggerContext.Provider value={logger}>
      {children}
    </LoggerContext.Provider>
  );
}

// Usage
function App() {
  const logger = import.meta.env.PROD
    ? new RemoteLogger()
    : new ConsoleLogger();

  return (
    <LoggerProvider logger={logger}>
      <Dashboard />
    </LoggerProvider>
  );
}

function Dashboard() {
  const logger = useLogger();

  effect(() => {
    logger.log('Dashboard mounted');
  });

  return <div>Dashboard</div>;
}
```

## Plugin System

### Extensible Architecture

```typescript
interface Plugin {
  name: string;
  install: (app: App) => void;
}

class App {
  private plugins: Plugin[] = [];

  use(plugin: Plugin) {
    this.plugins.push(plugin);
    plugin.install(this);
    return this;
  }

  getPlugins() {
    return this.plugins;
  }
}

// Example plugins
const RouterPlugin: Plugin = {
  name: 'router',
  install(app) {
    // Install router functionality
    console.log('Router plugin installed');
  }
};

const I18nPlugin: Plugin = {
  name: 'i18n',
  install(app) {
    // Install i18n functionality
    console.log('i18n plugin installed');
  }
};

// Usage
const app = new App();

app
  .use(RouterPlugin)
  .use(I18nPlugin);
```

### Hook-Based Plugins

```typescript
type Hook = 'beforeRender' | 'afterRender' | 'onError';

interface HookCallback {
  (context: any): void;
}

class PluginSystem {
  private hooks: Map<Hook, HookCallback[]> = new Map();

  on(hook: Hook, callback: HookCallback) {
    if (!this.hooks.has(hook)) {
      this.hooks.set(hook, []);
    }

    this.hooks.get(hook)!.push(callback);
  }

  trigger(hook: Hook, context: any) {
    const callbacks = this.hooks.get(hook) || [];
    callbacks.forEach(callback => callback(context));
  }
}

// Usage
const plugins = new PluginSystem();

// Register plugin
plugins.on('beforeRender', (context) => {
  console.log('Before render:', context);
});

plugins.on('afterRender', (context) => {
  console.log('After render:', context);
});

// Trigger hooks
plugins.trigger('beforeRender', { component: 'App' });
```

## Mixin Pattern

### Compose Functionality

```typescript
type Constructor<T = {}> = new (...args: any[]) => T;

// Mixin function
function WithTimestamp<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    timestamp = Date.now();

    getTimestamp() {
      return this.timestamp;
    }
  };
}

function WithId<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    id = Math.random().toString(36);

    getId() {
      return this.id;
    }
  };
}

// Base class
class Entity {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

// Compose mixins
const EnhancedEntity = WithTimestamp(WithId(Entity));

// Usage
const entity = new EnhancedEntity('User');
console.log(entity.name); // 'User'
console.log(entity.getId()); // Random ID
console.log(entity.getTimestamp()); // Timestamp
```

## Factory Pattern

### Object Creation

```typescript
interface Button {
  render: () => JSX.Element;
}

class PrimaryButton implements Button {
  constructor(private text: string) {}

  render() {
    return <button className="btn-primary">{this.text}</button>;
  }
}

class SecondaryButton implements Button {
  constructor(private text: string) {}

  render() {
    return <button className="btn-secondary">{this.text}</button>;
  }
}

class DangerButton implements Button {
  constructor(private text: string) {}

  render() {
    return <button className="btn-danger">{this.text}</button>;
  }
}

// Factory
class ButtonFactory {
  static create(
    variant: 'primary' | 'secondary' | 'danger',
    text: string
  ): Button {
    switch (variant) {
      case 'primary':
        return new PrimaryButton(text);
      case 'secondary':
        return new SecondaryButton(text);
      case 'danger':
        return new DangerButton(text);
    }
  }
}

// Usage
const saveButton = ButtonFactory.create('primary', 'Save');
const cancelButton = ButtonFactory.create('secondary', 'Cancel');
const deleteButton = ButtonFactory.create('danger', 'Delete');
```

## Observer Pattern

### Event System

```typescript
type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event) || [];
    callbacks.forEach(callback => callback(...args));
  }

  once(event: string, callback: EventCallback) {
    const onceCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, onceCallback);
    };

    this.on(event, onceCallback);
  }
}

// Usage
const emitter = new EventEmitter();

const unsubscribe = emitter.on('user:login', (user) => {
  console.log('User logged in:', user);
});

emitter.emit('user:login', { id: '1', name: 'Alice' });

// Clean up
unsubscribe();
```

## Best Practices

### Prefer Composition Over Inheritance

```typescript
// ❌ Deep inheritance hierarchy
class Animal {
  eat() {}
}

class Mammal extends Animal {
  walk() {}
}

class Dog extends Mammal {
  bark() {}
}

// ✅ Composition
interface Eatable {
  eat: () => void;
}

interface Walkable {
  walk: () => void;
}

interface Barkable {
  bark: () => void;
}

class Dog implements Eatable, Walkable, Barkable {
  eat() {}
  walk() {}
  bark() {}
}
```

### Keep Components Small and Focused

```typescript
// ❌ Large component with multiple responsibilities
function UserDashboard() {
  // User data
  // Analytics
  // Notifications
  // Settings
  // ... hundreds of lines
}

// ✅ Smaller, focused components
function UserDashboard() {
  return (
    <div>
      <UserProfile />
      <Analytics />
      <Notifications />
      <Settings />
    </div>
  );
}
```

### Use TypeScript for Safety

```typescript
// ✅ Type-safe patterns
interface Props {
  user: User;
  onSave: (user: User) => void;
}

function UserForm({ user, onSave }: Props) {
  // Type checking ensures safety
}
```

## Summary

You've learned:

✅ Compound component pattern
✅ Render props for flexibility
✅ Custom hooks for reusable logic
✅ Higher-order components
✅ Dependency injection
✅ Plugin systems
✅ Mixin pattern
✅ Factory pattern
✅ Observer pattern
✅ Best practices for patterns

Advanced patterns enable scalable, maintainable applications!

---

**Congratulations!** You've completed the Advanced Topics section. You now have the knowledge to build production-ready PhilJS applications with advanced patterns and techniques.
