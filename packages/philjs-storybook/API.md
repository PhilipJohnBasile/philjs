# PhilJS Storybook API Reference

Complete API documentation for PhilJS Storybook.

## Table of Contents

- [Story Helpers](#story-helpers)
- [Decorators](#decorators)
- [Mocking Utilities](#mocking-utilities)
- [Addons](#addons)
- [Types](#types)

## Story Helpers

### createStory

Create a type-safe story with configuration.

```tsx
function createStory<T>(config: StoryConfig<T>): {
  meta: Meta<T>;
  story: (config?: Partial<Story<T>>) => Story<T>;
}
```

**Parameters:**
- `config.component`: Component to create story for
- `config.title`: Story title (e.g., 'Components/Button')
- `config.tags?`: Story tags (default: `['autodocs']`)
- `config.argTypes?`: Argument type definitions
- `config.args?`: Default arguments
- `config.parameters?`: Story parameters
- `config.decorators?`: Story decorators

**Returns:**
- `meta`: Story metadata for export default
- `story`: Function to create story variants

**Example:**
```tsx
const { meta, story } = createStory({
  component: Button,
  title: 'UI/Button',
  args: { variant: 'primary' },
});

export default meta;
export const Primary = story({ args: { children: 'Click me' } });
```

### createArgs

Create typed arguments for a story.

```tsx
function createArgs<T>(args: T): T
```

**Example:**
```tsx
const args = createArgs({
  name: 'John',
  age: 30,
  isActive: true,
});
```

### createArgTypes

Create typed argument type definitions.

```tsx
function createArgTypes<T>(argTypes: Record<keyof T, any>): typeof argTypes
```

**Example:**
```tsx
const argTypes = createArgTypes({
  variant: {
    control: 'select',
    options: ['primary', 'secondary'],
  },
  disabled: {
    control: 'boolean',
  },
});
```

### createParameters

Create story parameters.

```tsx
function createParameters(params: Record<string, any>): typeof params
```

**Example:**
```tsx
const parameters = createParameters({
  layout: 'centered',
  backgrounds: { default: 'light' },
});
```

## Decorators

### withRouter

Wrap stories with mock router context.

```tsx
function withRouter(story: () => any, context: StoryContext): JSX.Element
```

**Parameters:**
- Configure via `parameters.router`:
  - `pathname`: Current path
  - `params`: Route parameters
  - `searchParams`: URL search parameters

**Hook:**
```tsx
function useRouter(): RouterContext
```

**Example:**
```tsx
export default {
  decorators: [withRouter],
  parameters: {
    router: {
      pathname: '/users/[id]',
      params: { id: '123' },
      searchParams: '?tab=profile',
    },
  },
};

// In component
function MyComponent() {
  const router = useRouter();
  const userId = router.params.id;
  router.navigate('/home');
}
```

### withSignals

Provide signal state management.

```tsx
function withSignals(story: () => any, context: StoryContext): JSX.Element
```

**Parameters:**
- Configure via `parameters.signals`: Initial signal values

**Hook:**
```tsx
function useSignalStore(): SignalStore

interface SignalStore {
  signals: Map<string, any>;
  register: (name: string, sig: any) => void;
  get: (name: string) => any;
}
```

**Example:**
```tsx
export default {
  decorators: [withSignals],
  parameters: {
    signals: {
      count: 0,
      isOpen: false,
    },
  },
};

// In component
function MyComponent() {
  const store = useSignalStore();
  const count = store.get('count');
}
```

### withTheme

Enable theme switching.

```tsx
function withTheme(story: () => any, context: StoryContext): JSX.Element
```

**Parameters:**
- Configure via `parameters.theme`: 'light' | 'dark' | 'custom'

**Hook:**
```tsx
function useTheme(): ThemeContext

interface ThemeContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: Record<string, string>;
}
```

**Example:**
```tsx
export default {
  decorators: [withTheme],
  parameters: {
    theme: 'dark',
  },
};

// In component
function MyComponent() {
  const { theme, setTheme, colors } = useTheme();
}
```

### withLayout

Control story container layout.

```tsx
function withLayout(story: () => any, context: StoryContext): JSX.Element
```

**Parameters:**
- Configure via `parameters.layout`: 'centered' | 'fullscreen' | 'padded' | 'none'
- Configure via `parameters.layoutStyles`: Custom CSS styles

**Example:**
```tsx
export default {
  decorators: [withLayout],
  parameters: {
    layout: 'centered',
    layoutStyles: {
      backgroundColor: '#f0f0f0',
    },
  },
};
```

### withMockData

Provide mock data context.

```tsx
function withMockData(story: () => any, context: StoryContext): JSX.Element
```

**Parameters:**
- Configure via `parameters.mockData`: Initial data

**Hook:**
```tsx
function useMockData(): MockDataContext

interface MockDataContext {
  data: Record<string, any>;
  setData: (key: string, value: any) => void;
  clearData: () => void;
}
```

**Example:**
```tsx
export default {
  decorators: [withMockData],
  parameters: {
    mockData: {
      user: { name: 'John' },
      items: [1, 2, 3],
    },
  },
};
```

## Mocking Utilities

### Signal Mocks

#### createMockSignal

Create a mock signal with call tracking.

```tsx
function createMockSignal<T>(initialValue: T): MockSignal<T>

interface MockSignal<T> {
  (): T;
  set: (value: T) => void;
  getCalls: () => Array<{ type: 'get' | 'set'; value?: T }>;
  getSetCount: () => number;
  getGetCount: () => number;
  reset: () => void;
}
```

**Example:**
```tsx
const count$ = createMockSignal(0);
count$.set(5);
count$();
console.log(count$.getSetCount()); // 1
console.log(count$.getGetCount()); // 1
count$.reset(); // Resets to 0 and clears calls
```

#### createMockComputed

Create a mock computed signal.

```tsx
function createMockComputed<T>(fn: () => T): MockComputed<T>

interface MockComputed<T> {
  (): T;
  getCalls: () => Array<{ type: 'get' }>;
  getCallCount: () => number;
  reset: () => void;
}
```

**Example:**
```tsx
const count = signal(0);
const doubled = createMockComputed(() => count() * 2);
doubled();
console.log(doubled.getCallCount()); // 1
```

#### spyOnSignal

Spy on signal access.

```tsx
function spyOnSignal<T>(sig: Signal<T>): SpySignal<T>

interface SpySignal<T> {
  (): T;
  set: (value: T) => void;
  getCalls: () => Array<{ type: 'get' | 'set'; value?: T; timestamp: number }>;
  clearCalls: () => void;
}
```

### Router Mocks

#### createMockRouter

Create a mock router with navigation tracking.

```tsx
function createMockRouter(initialPath?: string): MockRouter

interface MockRouter {
  pathname: Signal<string>;
  params: Signal<Record<string, string>>;
  searchParams: Signal<URLSearchParams>;
  navigate: (path: string) => void;
  back: () => void;
  forward: () => void;
  push: (path: string) => void;
  replace: (path: string) => void;
  getCalls: () => Array<{ method: string; args: any[]; timestamp: number }>;
}
```

**Example:**
```tsx
const router = createMockRouter('/home');
router.navigate('/about');
router.back();
console.log(router.getCalls());
// [
//   { method: 'navigate', args: ['/about'], timestamp: ... },
//   { method: 'back', args: [], timestamp: ... }
// ]
```

#### createMockParams

Create mock route parameters.

```tsx
function createMockParams(params: Record<string, string>): Signal<Record<string, string>>
```

**Example:**
```tsx
const params$ = createMockParams({ id: '123', slug: 'example' });
```

#### createMockSearchParams

Create mock search parameters.

```tsx
function createMockSearchParams(params?: Record<string, string>): Signal<URLSearchParams>
```

**Example:**
```tsx
const searchParams$ = createMockSearchParams({ page: '1', sort: 'name' });
```

### API Mocks

#### createMockAPI

Create MSW API handlers.

```tsx
function createMockAPI(handlers: MockAPIHandler[]): MSWHandler[]

interface MockAPIHandler {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response: any;
  status?: number;
  delay?: number;
}
```

**Example:**
```tsx
const handlers = createMockAPI([
  {
    method: 'GET',
    path: '/api/users/:id',
    response: { id: 1, name: 'John' },
  },
  {
    method: 'POST',
    path: '/api/users',
    response: { id: 2, name: 'Jane' },
    status: 201,
    delay: 1000,
  },
]);
```

#### createMockError

Create an error response handler.

```tsx
function createMockError(
  path: string,
  message: string,
  status?: number,
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
): MSWHandler
```

**Example:**
```tsx
const errorHandler = createMockError(
  '/api/users/:id',
  'User not found',
  404,
  'GET'
);
```

#### createMockDelayedAPI

Create a delayed API response.

```tsx
function createMockDelayedAPI(
  path: string,
  response: any,
  delay: number,
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
): MSWHandler
```

**Example:**
```tsx
const handler = createMockDelayedAPI(
  '/api/slow-endpoint',
  { data: 'loaded' },
  3000
);
```

#### createMockPaginatedAPI

Create a paginated API endpoint.

```tsx
function createMockPaginatedAPI(
  path: string,
  data: any[],
  pageSize?: number
): MSWHandler
```

**Example:**
```tsx
const users = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
}));

const handler = createMockPaginatedAPI('/api/users', users, 10);
// Returns: { items, page, limit, total, totalPages, hasMore }
```

### Route Mocks

#### createMockLoader

Create a mock route loader.

```tsx
function createMockLoader<T>(
  loadFn: (params?: Record<string, any>) => Promise<T>
): MockLoader<T>

interface MockLoader<T> {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  load: (params?: Record<string, any>) => Promise<void>;
  getCalls: () => Array<{ params?: Record<string, any>; timestamp: number }>;
}
```

**Example:**
```tsx
const loader = createMockLoader(async (params) => {
  const response = await fetch(`/api/users/${params.id}`);
  return response.json();
});

await loader.load({ id: '123' });
console.log(loader.data()); // User data
console.log(loader.getCalls()); // Load history
```

#### createMockAction

Create a mock route action.

```tsx
function createMockAction<T>(
  submitFn: (data: any) => Promise<T>
): MockAction<T>

interface MockAction<T> {
  data: Signal<T | null>;
  submitting: Signal<boolean>;
  error: Signal<Error | null>;
  submit: (data: any) => Promise<void>;
  getCalls: () => Array<{ data: any; timestamp: number }>;
}
```

**Example:**
```tsx
const action = createMockAction(async (data) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
});

await action.submit({ name: 'John' });
console.log(action.data()); // Response data
```

#### createMockLoaderWithData

Quick mock loader with static data.

```tsx
function createMockLoaderWithData<T>(data: T): MockLoader<T>
```

**Example:**
```tsx
const loader = createMockLoaderWithData({ user: { name: 'John' } });
```

#### createMockLoaderWithError

Quick mock loader that throws an error.

```tsx
function createMockLoaderWithError(errorMessage: string): MockLoader<any>
```

**Example:**
```tsx
const loader = createMockLoaderWithError('Failed to load user');
```

## Addons

### Signal Inspector

#### registerSignal

Register a signal for inspection.

```tsx
function registerSignal(name: string, sig: any): void
```

**Example:**
```tsx
const count$ = signal(0);
registerSignal('count', count$);
```

#### getSignals

Get all registered signals.

```tsx
function getSignals(): SignalInfo[]

interface SignalInfo {
  name: string;
  value: any;
  type: 'signal' | 'computed';
  dependencies?: string[];
}
```

### Route Tester

#### setTestRoute

Configure test route.

```tsx
function setTestRoute(route: Partial<RouteTest>): void

interface RouteTest {
  path: string;
  params: Record<string, string>;
  searchParams: Record<string, string>;
  loaderData?: any;
  actionData?: any;
}
```

**Example:**
```tsx
setTestRoute({
  path: '/users/[id]',
  params: { id: '123' },
  searchParams: { tab: 'profile' },
  loaderData: { user: { name: 'John' } },
});
```

#### getTestRoute

Get current test route.

```tsx
function getTestRoute(): RouteTest
```

### Theme Switcher

#### setTheme

Set the current theme.

```tsx
function setTheme(theme: Theme): void

type Theme = 'light' | 'dark' | 'custom'
```

**Example:**
```tsx
setTheme('dark');
```

#### getTheme

Get the current theme.

```tsx
function getTheme(): Theme
```

#### registerTheme

Register a custom theme.

```tsx
function registerTheme(theme: ThemeConfig): void

interface ThemeConfig {
  name: string;
  colors: Record<string, string>;
}
```

**Example:**
```tsx
registerTheme({
  name: 'Ocean',
  colors: {
    '--bg-color': '#0d47a1',
    '--text-color': '#ffffff',
    '--primary-color': '#64b5f6',
  },
});
```

### Viewport Helper

#### setViewport

Set the viewport.

```tsx
function setViewport(viewport: ViewportConfig | null): void

interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  type: 'mobile' | 'tablet' | 'desktop' | 'custom';
}
```

**Example:**
```tsx
setViewport({
  name: 'iPhone 12',
  width: 390,
  height: 844,
  type: 'mobile',
});
```

#### getViewport

Get the current viewport.

```tsx
function getViewport(): ViewportConfig | null
```

#### defaultViewports

Preset viewport configurations.

```tsx
const defaultViewports: ViewportConfig[]
```

## Types

### Meta

Story metadata type.

```tsx
interface Meta<T> {
  title: string;
  component: ComponentType<T>;
  tags?: string[];
  argTypes?: Record<string, any>;
  args?: Partial<T>;
  parameters?: Record<string, any>;
  decorators?: Decorator[];
}
```

### StoryObj

Story object type.

```tsx
interface StoryObj<T> {
  args?: Partial<T>;
  argTypes?: Record<string, any>;
  parameters?: Record<string, any>;
  decorators?: Decorator[];
  play?: (context: StoryContext) => Promise<void>;
  render?: (args: T, context: StoryContext) => any;
}
```

### StoryContext

Story execution context.

```tsx
interface StoryContext {
  id: string;
  kind: string;
  name: string;
  story: string;
  component?: ComponentType<any>;
  args: Record<string, any>;
  argTypes: Record<string, any>;
  globals: Record<string, any>;
  parameters: Record<string, any>;
  viewMode: string;
}
```

### Decorator

Story decorator function.

```tsx
type Decorator = (story: () => any, context: StoryContext) => any
```

## CLI Commands

### init

Initialize Storybook configuration.

```bash
philjs storybook init [--port <port>]
```

### dev

Start development server.

```bash
philjs storybook dev [-p|--port <port>] [--no-open]
```

### build

Build for production.

```bash
philjs storybook build [-o|--output-dir <dir>]
```

### generate

Generate a story.

```bash
philjs storybook generate <component> [options]

Options:
  -d, --directory <dir>  Component directory
  --type <type>          Story type: component, route, form, island
```

## Configuration

### StorybookConfig

Main configuration interface.

```tsx
interface StorybookConfig {
  stories: string[];
  addons: string[];
  framework: {
    name: string;
    options: Record<string, any>;
  };
  core?: {
    builder: string;
  };
  docs?: {
    autodocs: 'tag' | boolean;
  };
  typescript?: {
    check: boolean;
    reactDocgen: boolean;
  };
}
```

### Preview

Preview configuration.

```tsx
interface Preview {
  parameters?: Record<string, any>;
  decorators?: Decorator[];
  loaders?: Loader[];
  globals?: Record<string, any>;
}
```
