# Application Architecture

Design scalable, maintainable PhilJS applications.

## Architectural Principles

### Separation of Concerns

Divide your application into distinct layers with clear responsibilities.

```
┌─────────────────────────────────────┐
│         Presentation Layer           │
│  (Components, Pages, Layouts)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Application Layer            │
│  (Stores, Hooks, Business Logic)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Service Layer                │
│  (API Clients, External Services)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Infrastructure Layer         │
│  (HTTP, Storage, Third-party APIs)  │
└─────────────────────────────────────┘
```

## Layered Architecture

### Presentation Layer

Components focused on rendering UI.

```tsx
// pages/Dashboard.tsx
import { userStore } from '@/stores/userStore';
import { statsStore } from '@/stores/statsStore';

export function Dashboard() {
  const { user } = userStore;
  const { stats, loading } = statsStore;

  return (
    <DashboardLayout>
      <UserHeader user={user()} />

      {loading() ? (
        <StatsLoading />
      ) : (
        <StatsView stats={stats()} />
      )}
    </DashboardLayout>
  );
}
```

### Application Layer

Business logic and state management.

```tsx
// stores/statsStore.ts
import { signal, effect } from 'philjs-core';
import { statsService } from '@/services/statsService';
import { userStore } from './userStore';

function createStatsStore() {
  const stats = signal<Stats | null>(null);
  const loading = signal(true);
  const error = signal<string | null>(null);

  // Business logic: fetch stats when user changes
  effect(async () => {
    const user = userStore.user();
    if (!user) return;

    loading.set(true);
    try {
      const data = await statsService.getUserStats(user.id);
      stats.set(data);
    } catch (err) {
      error.set(err.message);
    } finally {
      loading.set(false);
    }
  });

  return { stats, loading, error };
}

export const statsStore = createStatsStore();
```

### Service Layer

Interact with external systems.

```tsx
// services/statsService.ts
import { api } from './api';
import type { Stats } from '@/types/stats';

export const statsService = {
  async getUserStats(userId: string): Promise<Stats> {
    return api.get(`/users/${userId}/stats`);
  },

  async updateStats(userId: string, updates: Partial<Stats>): Promise<Stats> {
    return api.patch(`/users/${userId}/stats`, updates);
  }
};
```

### Infrastructure Layer

Low-level implementation details.

```tsx
// services/api.ts
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request(endpoint);
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // ... other methods
}

export const api = new ApiClient(import.meta.env.VITE_API_URL);
```

## Dependency Injection

### Context-Based DI

```tsx
// services/ServiceContext.tsx
import { createContext, useContext } from 'philjs-core';

interface Services {
  userService: UserService;
  productService: ProductService;
  analyticsService: AnalyticsService;
}

const ServiceContext = createContext<Services | null>(null);

export function ServiceProvider({
  children,
  services
}: {
  children: JSX.Element;
  services: Services;
}) {
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useServices must be used within ServiceProvider');
  }
  return services;
}

// App.tsx
import { createUserService } from './services/userService';
import { createProductService } from './services/productService';

const services = {
  userService: createUserService(api),
  productService: createProductService(api),
  analyticsService: createAnalyticsService()
};

<ServiceProvider services={services}>
  <App />
</ServiceProvider>

// Component usage
function UserProfile() {
  const { userService } = useServices();

  effect(async () => {
    const user = await userService.getUser(userId());
    // ...
  });
}
```

### Factory Pattern

```tsx
// services/userService.ts
export interface UserService {
  getUser(id: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
}

export function createUserService(apiClient: ApiClient): UserService {
  return {
    async getUser(id: string) {
      return apiClient.get(`/users/${id}`);
    },

    async updateUser(id: string, updates: Partial<User>) {
      return apiClient.patch(`/users/${id}`, updates);
    }
  };
}

// Easy to test with mocks
const mockApi = {
  get: vi.fn(),
  patch: vi.fn()
};

const userService = createUserService(mockApi);
```

## Plugin Architecture

### Plugin System

```tsx
// plugins/types.ts
export interface Plugin {
  name: string;
  install: (app: App) => void;
}

export interface App {
  use(plugin: Plugin): App;
  config: Map<string, any>;
  services: Map<string, any>;
}

// plugins/App.ts
export function createApp(): App {
  const config = new Map<string, any>();
  const services = new Map<string, any>();
  const plugins: Plugin[] = [];

  return {
    use(plugin: Plugin) {
      plugin.install(this);
      plugins.push(plugin);
      return this;
    },
    config,
    services
  };
}

// plugins/analyticsPlugin.ts
export const analyticsPlugin: Plugin = {
  name: 'analytics',
  install(app) {
    const analytics = createAnalytics();

    app.services.set('analytics', analytics);

    // Track route changes
    effect(() => {
      const route = router.currentRoute();
      analytics.trackPageView(route.path);
    });
  }
};

// Usage
const app = createApp()
  .use(analyticsPlugin)
  .use(authPlugin)
  .use(i18nPlugin);
```

## Module Federation

### Micro-Frontend Architecture

```tsx
// Shell Application
import { lazy, Suspense } from 'philjs-core';

const ProductsApp = lazy(() => import('products/App'));
const CartApp = lazy(() => import('cart/App'));
const CheckoutApp = lazy(() => import('checkout/App'));

function ShellApp() {
  return (
    <MainLayout>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Route path="/products/*" component={ProductsApp} />
          <Route path="/cart" component={CartApp} />
          <Route path="/checkout" component={CheckoutApp} />
        </Suspense>
      </Router>
    </MainLayout>
  );
}

// Shared state between micro-frontends
export const globalStore = {
  user: userStore,
  cart: cartStore,
  theme: themeStore
};
```

## Event-Driven Architecture

### Event Bus

```tsx
// events/eventBus.ts
type EventHandler<T = any> = (data: T) => void;

class EventBus {
  private events = new Map<string, Set<EventHandler>>();

  on<T>(event: string, handler: EventHandler<T>) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.events.get(event)?.delete(handler);
    };
  }

  emit<T>(event: string, data: T) {
    this.events.get(event)?.forEach(handler => handler(data));
  }

  off(event: string, handler: EventHandler) {
    this.events.get(event)?.delete(handler);
  }
}

export const eventBus = new EventBus();

// Usage
// Emit events
eventBus.emit('user:login', { userId: '123' });
eventBus.emit('cart:updated', { items: 5 });

// Listen to events
const unsubscribe = eventBus.on('user:login', (data) => {
  console.log('User logged in:', data.userId);
});

// Clean up
effect(() => {
  const unsub = eventBus.on('cart:updated', handleCartUpdate);
  return unsub;
});
```

### Domain Events

```tsx
// events/domainEvents.ts
export class UserLoggedInEvent {
  constructor(public userId: string, public timestamp: Date) {}
}

export class CartUpdatedEvent {
  constructor(public items: CartItem[], public total: number) {}
}

// Event handlers
eventBus.on<UserLoggedInEvent>('user:logged-in', (event) => {
  analyticsService.trackLogin(event.userId);
  fetchUserData(event.userId);
});

eventBus.on<CartUpdatedEvent>('cart:updated', (event) => {
  localStorage.setItem('cart', JSON.stringify(event.items));
  updateCartBadge(event.items.length);
});
```

## CQRS Pattern

### Command Query Responsibility Segregation

```tsx
// stores/productStore/commands.ts
export interface CreateProductCommand {
  name: string;
  price: number;
  description: string;
}

export interface UpdateProductCommand {
  id: string;
  updates: Partial<Product>;
}

export interface DeleteProductCommand {
  id: string;
}

// stores/productStore/queries.ts
export interface GetProductQuery {
  id: string;
}

export interface SearchProductsQuery {
  term: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

// stores/productStore/index.ts
function createProductStore() {
  const products = signal<Product[]>([]);

  // Commands (write operations)
  const commands = {
    async create(command: CreateProductCommand) {
      const product = await productService.create(command);
      products.set([...products(), product]);
      eventBus.emit('product:created', product);
    },

    async update(command: UpdateProductCommand) {
      const updated = await productService.update(command.id, command.updates);
      products.set(
        products().map(p => p.id === command.id ? updated : p)
      );
      eventBus.emit('product:updated', updated);
    },

    async delete(command: DeleteProductCommand) {
      await productService.delete(command.id);
      products.set(products().filter(p => p.id !== command.id));
      eventBus.emit('product:deleted', command.id);
    }
  };

  // Queries (read operations)
  const queries = {
    getById(query: GetProductQuery): Product | undefined {
      return products().find(p => p.id === query.id);
    },

    search(query: SearchProductsQuery): Product[] {
      return products().filter(p => {
        if (query.term && !p.name.includes(query.term)) return false;
        if (query.category && p.category !== query.category) return false;
        if (query.minPrice && p.price < query.minPrice) return false;
        if (query.maxPrice && p.price > query.maxPrice) return false;
        return true;
      });
    }
  };

  return { products, commands, queries };
}

// Usage
const { commands, queries } = productStore;

// Execute command
await commands.create({
  name: 'New Product',
  price: 99.99,
  description: 'Description'
});

// Execute query
const product = queries.getById({ id: '123' });
const results = queries.search({ term: 'laptop', maxPrice: 1000 });
```

## Hexagonal Architecture (Ports & Adapters)

### Core Domain

```tsx
// domain/user.ts
export class User {
  constructor(
    public id: string,
    public name: string,
    public email: string
  ) {}

  updateName(newName: string) {
    if (!newName.trim()) {
      throw new Error('Name cannot be empty');
    }
    this.name = newName;
  }

  isAdmin(): boolean {
    return this.email.endsWith('@admin.com');
  }
}

// domain/ports/userRepository.ts (Port)
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// infrastructure/adapters/apiUserRepository.ts (Adapter)
export class ApiUserRepository implements UserRepository {
  constructor(private api: ApiClient) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.api.get<UserDTO>(`/users/${id}`);
    return data ? this.toDomain(data) : null;
  }

  async save(user: User): Promise<void> {
    await this.api.post('/users', this.toDTO(user));
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  private toDomain(dto: UserDTO): User {
    return new User(dto.id, dto.name, dto.email);
  }

  private toDTO(user: User): UserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }
}

// Application uses port, not adapter
function createUserService(repository: UserRepository) {
  return {
    async getUser(id: string) {
      return repository.findById(id);
    },

    async updateUser(id: string, name: string) {
      const user = await repository.findById(id);
      if (!user) throw new Error('User not found');

      user.updateName(name);
      await repository.save(user);

      return user;
    }
  };
}
```

## Scalability Patterns

### Lazy Module Loading

```tsx
// Large application broken into modules
const routes = [
  {
    path: '/admin/*',
    component: lazy(() => import('./modules/admin'))
  },
  {
    path: '/analytics/*',
    component: lazy(() => import('./modules/analytics'))
  },
  {
    path: '/reports/*',
    component: lazy(() => import('./modules/reports'))
  }
];
```

### Code Splitting by Route

```tsx
function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Route path="/" component={lazy(() => import('./pages/Home'))} />
        <Route path="/dashboard" component={lazy(() => import('./pages/Dashboard'))} />
        <Route path="/settings" component={lazy(() => import('./pages/Settings'))} />
      </Suspense>
    </Router>
  );
}
```

## Summary

**Architecture Best Practices:**

✅ Separate concerns into layers
✅ Use dependency injection
✅ Design with interfaces (ports)
✅ Implement plugin architecture for extensibility
✅ Use event-driven patterns for decoupling
✅ Consider CQRS for complex domains
✅ Apply hexagonal architecture for testability
✅ Lazy load modules and routes
✅ Keep domain logic pure
✅ Make infrastructure replaceable

**Next:** [Security →](./security.md)
