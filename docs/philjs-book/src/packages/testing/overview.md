# @philjs/testing - Testing Library

**Official testing utilities for PhilJS applications with signal-aware testing, component testing, and comprehensive mocking.**

@philjs/testing provides everything you need to test PhilJS applications: component rendering, signal testing, route testing, network mocking, accessibility testing, and performance testing.

## Installation

```bash
npm install @philjs/testing
```

## Quick Start

```typescript
import {
  render,
  screen,
  fireEvent,
  waitFor,
  createMockSignal,
} from '@philjs/testing';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments on click', async () => {
    const { getByRole, getByText } = render(<Counter />);

    const button = getByRole('button', { name: 'Increment' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(getByText('1')).toBeInTheDocument();
    });
  });
});
```

## Core Rendering

### `render()`

Render a PhilJS component into a container for testing:

```typescript
import { render, cleanup } from '@philjs/testing';

// Basic render
const { container, getByText, debug } = render(<MyComponent />);

// With options
const result = render(<MyComponent />, {
  container: document.createElement('div'),
  baseElement: document.body,
  wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
  hydrate: false,
});

// Available methods
result.container;        // The rendered container
result.baseElement;      // The base element (default: document.body)
result.debug();          // Print the current DOM
result.rerender(<New />); // Re-render with new JSX
result.unmount();        // Unmount the component
result.asFragment();     // Get a DocumentFragment

// Bound queries
result.getByRole('button');
result.getByText('Hello');
result.getByTestId('my-element');
result.getByLabelText('Email');
// ... all @testing-library/dom queries
```

### `cleanup()`

Clean up all rendered containers. Called automatically after each test in Vitest/Jest:

```typescript
import { cleanup } from '@philjs/testing';

afterEach(() => {
  cleanup();
});
```

## Queries

Built on @testing-library/dom with PhilJS enhancements:

```typescript
import { screen, within, queries } from '@philjs/testing';

// Screen queries (document.body)
screen.getByRole('button');
screen.getByText(/hello/i);
screen.getByTestId('submit-btn');

// Scoped queries
const form = screen.getByRole('form');
const submitBtn = within(form).getByRole('button', { name: 'Submit' });

// Query types
getByRole();      // Throws if not found
getAllByRole();   // Returns array, throws if empty
queryByRole();    // Returns null if not found
queryAllByRole(); // Returns empty array if not found
findByRole();     // Async, waits for element
findAllByRole();  // Async, waits for elements
```

### PhilJS-Specific Queries

```typescript
import { queryBySignalValue, queryAllBySignal } from '@philjs/testing';

// Find elements displaying signal values
const element = queryBySignalValue(container, 'count', 42);

// Find all elements bound to a signal
const elements = queryAllBySignal(container, 'username');
```

## Events

### `fireEvent`

Fire DOM events:

```typescript
import { fireEvent, createEvent } from '@philjs/testing';

// Common events
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'new value' } });
fireEvent.submit(form);
fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

// Create custom event
const event = createEvent.click(button, { clientX: 100 });
fireEvent(button, event);
```

### `userEvent`

Simulate realistic user interactions:

```typescript
import { userEvent, user, setup } from '@philjs/testing';

// Setup user event instance
const userEvt = setup();

// Type text
await userEvt.type(input, 'Hello World');

// Click with delay
await userEvt.click(button);

// Select option
await userEvt.selectOptions(select, ['option1', 'option2']);

// Clear and type
await userEvt.clear(input);
await userEvt.type(input, 'New text');

// Keyboard interactions
await userEvt.keyboard('{Enter}');
await userEvt.tab();

// Simplified API
await user.type(input, 'Hello');
await user.click(button);
```

## Async Utilities

### `waitFor()`

Wait for a condition to be true:

```typescript
import { waitFor, waitForElementToBeRemoved, delay } from '@philjs/testing';

// Wait for assertion
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// With options
await waitFor(() => expect(result).toBe(true), {
  timeout: 5000,    // Max wait time
  interval: 50,     // Check interval
  onTimeout: (err) => new Error('Custom timeout message'),
});

// Wait for element removal
await waitForElementToBeRemoved(() => screen.getByText('Loading...'));
await waitForElementToBeRemoved(screen.getByRole('progressbar'));

// Simple delay
await delay(1000); // Wait 1 second
```

### `waitForLoadingToFinish()`

Wait for common loading indicators to disappear:

```typescript
import { waitForLoadingToFinish, waitForNetworkIdle } from '@philjs/testing';

// Wait for loading states
await waitForLoadingToFinish(container, { timeout: 10000 });

// Wait for network to settle
await waitForNetworkIdle({
  timeout: 5000,
  idleTime: 500, // Time without requests
});
```

## Hook Testing

### `renderHook()`

Test custom hooks in isolation:

```typescript
import { renderHook, act, cleanupHooks } from '@philjs/testing';

// Basic hook test
const { result } = renderHook(() => useCounter(0));
expect(result.current.count).toBe(0);

// Update hook
await act(() => {
  result.current.increment();
});
expect(result.current.count).toBe(1);

// With props
const { result, rerender } = renderHook(
  ({ initialValue }) => useCounter(initialValue),
  { initialProps: { initialValue: 10 } }
);

// Re-render with new props
rerender({ initialValue: 20 });

// With wrapper
const { result } = renderHook(() => useTheme(), {
  wrapper: ({ children }) => (
    <ThemeProvider theme="dark">{children}</ThemeProvider>
  ),
});

// Wait for async updates
const { result, waitForNextUpdate } = renderHook(() => useAsync());
await waitForNextUpdate();
expect(result.current.data).toBeDefined();
```

### `act()`

Wrap state updates:

```typescript
import { act } from '@philjs/testing';

// Sync update
act(() => {
  counter.increment();
});

// Async update
await act(async () => {
  await fetchData();
});
```

## Signal Testing

### `createMockSignal()`

Create mock signals for testing:

```typescript
import {
  createMockSignal,
  createMockComputed,
  signalValue,
  waitForSignal,
  waitForSignalValue,
  assertSignalHistory,
} from '@philjs/testing';

// Create mock signal
const count = createMockSignal(0);

// Use like a real signal
count.get();           // 0
count.set(5);          // Set value
count.update(n => n + 1); // Update with function

// Test utilities
count.getHistory();    // [0, 5, 6] - all values
count.getCallCount();  // Number of reads
count.reset();         // Reset to initial state

// Subscribe to changes
const unsubscribe = count.subscribe((value) => {
  console.log('Value changed:', value);
});
```

### Signal Assertions

```typescript
// Wait for signal condition
const value = await waitForSignal(
  count,
  (value) => value > 10,
  { timeout: 5000 }
);

// Wait for specific value
await waitForSignalValue(count, 42, { timeout: 5000 });

// Assert signal history
assertSignalHistory(count, [0, 1, 2, 3]); // Throws if mismatch

// Get current value
const current = signalValue(count);
```

### Mock Computed

```typescript
const doubled = createMockComputed(() => count.get() * 2);
expect(doubled.get()).toBe(0);

count.set(5);
expect(doubled.get()).toBe(10);
```

## Route Testing

### `createMockRoute()`

Create mock route context:

```typescript
import {
  createMockRoute,
  createMockLoader,
  createMockAction,
  createMockRequest,
  createMockFormData,
} from '@philjs/testing';

// Create route context
const route = createMockRoute({
  path: '/users/123',
  params: { id: '123' },
  searchParams: { tab: 'profile' },
  loaderData: { user: { name: 'John' } },
});

// Access route state (signals)
route.path();         // '/users/123'
route.params();       // { id: '123' }
route.searchParams(); // URLSearchParams
route.loaderData();   // { user: { name: 'John' } }
route.navigation();   // { state: 'idle' }

// Navigate
route.navigate('/users/456');

// Submit form
await route.submit(new FormData(), { method: 'post' });

// Revalidate loader
await route.revalidate();
```

### Loader Testing

```typescript
import {
  testLoader,
  testLoaderWithParams,
  expectLoaderToReturn,
  expectLoaderToThrow,
} from '@philjs/testing';

// Test loader function
const data = await testLoader(myLoader, {
  url: '/api/users',
  params: { id: '123' },
  context: { db: mockDb },
});

// Test with params only
const data = await testLoaderWithParams(userLoader, { id: '123' });

// Assert return value
await expectLoaderToReturn(
  myLoader,
  { users: [] },
  { params: { page: '1' } }
);

// Assert error
await expectLoaderToThrow(
  myLoader,
  /User not found/,
  { params: { id: 'invalid' } }
);
```

### Action Testing

```typescript
import {
  testAction,
  testPostAction,
  expectActionToReturn,
  expectActionToThrow,
} from '@philjs/testing';

// Test action
const result = await testAction(createUserAction, {
  method: 'POST',
  formData: { name: 'John', email: 'john@example.com' },
  params: {},
});

// Shorthand for POST
const result = await testPostAction(loginAction, {
  username: 'john',
  password: 'secret',
});

// Assert return value
await expectActionToReturn(
  createAction,
  { success: true, id: '123' },
  { formData: { name: 'John' } }
);

// Assert error
await expectActionToThrow(
  deleteAction,
  /Permission denied/,
  { params: { id: '123' } }
);
```

### Mock Loaders and Actions

```typescript
// Create mock loader
const mockLoader = createMockLoader({ users: [] });
mockLoader.mockReturnValue({ users: [{ id: 1, name: 'John' }] });

// Create mock action
const mockAction = createMockAction({ success: true });
mockAction.mockReturnValue({ success: true, id: '123' });
mockAction.mockRejectedValue(new Error('Failed'));

// Track calls
mockLoader.callCount();  // Number of calls
mockLoader.calls();      // Array of call arguments
mockLoader.mockReset();  // Reset mock
```

### Navigation Testing

```typescript
import {
  testNavigation,
  waitForNavigation,
  waitForLoaderData,
  assertRouteParams,
  assertSearchParams,
  assertNavigationState,
} from '@philjs/testing';

// Create navigation helper
const nav = testNavigation();
nav.navigate('/users/123');
nav.getCurrentPath();    // '/users/123'
nav.getHistory();        // ['/users/123']
nav.clearHistory();

// Wait for navigation
await waitForNavigation(route, '/dashboard', 1000);

// Wait for loader data
const data = await waitForLoaderData(route, 1000);

// Assertions
assertRouteParams(route, { id: '123' });
assertSearchParams(route, { tab: 'profile' });
assertNavigationState(route, 'idle');
```

## Network Mocking

### `createNetworkMock()`

Mock HTTP requests:

```typescript
import {
  createNetworkMock,
  json,
  networkError,
  delayed,
  flaky,
  paginated,
} from '@philjs/testing';

// Create mock
const mock = createNetworkMock();

// Mock GET request
mock.get('/api/users', { users: [{ id: 1, name: 'John' }] });

// Mock POST request
mock.post('/api/users', json({ id: 2, name: 'Jane' }, 201));

// Mock with handler
mock.get('/api/users/:id', (request) => {
  const id = request.url.split('/').pop();
  return json({ id, name: `User ${id}` });
});

// Other methods
mock.put('/api/users/:id', { success: true });
mock.patch('/api/users/:id', { success: true });
mock.delete('/api/users/:id', { deleted: true });
mock.any('/api/health', { status: 'ok' }); // Any method
```

### Response Helpers

```typescript
// JSON response
const response = json({ data: 'value' }, 200);

// Error response
const notFound = networkError(404, 'User not found');
const serverError = networkError(500);

// Delayed response
const slow = delayed(json({ data: 'value' }), 2000);

// Flaky response (fails N times before succeeding)
mock.get('/api/flaky', flaky(
  json({ success: true }),
  2, // Fail twice
  networkError(500)
));

// Paginated response
const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
mock.get('/api/items', paginated(items, 10));
// Returns: { items, page, pageSize, total, totalPages, hasNext, hasPrev }
```

### Request Matchers

```typescript
import { withHeaders, withBody, withQuery } from '@philjs/testing';

// Match by headers
mock.intercept({
  match: (req) =>
    req.method === 'GET' &&
    req.url.includes('/api') &&
    withHeaders({ 'Authorization': 'Bearer token' })(req),
  respond: () => json({ authenticated: true }),
});

// Match by body
mock.intercept({
  match: (req) =>
    req.method === 'POST' &&
    withBody({ action: 'create' })(req),
  respond: () => json({ created: true }),
});

// Match by query params
mock.intercept({
  match: (req) =>
    withQuery({ status: 'active' })(req),
  respond: () => json({ filtered: true }),
});
```

### Network Assertions

```typescript
import {
  expectRequest,
  expectRequestCount,
  expectNoRequests,
  getNetworkStats,
} from '@philjs/testing';

// Assert request was made
expectRequest(mock, 'GET', '/api/users');
expectRequest(mock, 'POST', /\/api\/users/);

// Assert request count
expectRequestCount(mock, 'GET', '/api/users', 3);

// Assert no requests
expectNoRequests(mock);

// Get statistics
const stats = getNetworkStats(mock);
// { totalRequests, successfulRequests, failedRequests, averageLatency, pendingRequests }
```

### Mock Controls

```typescript
// Request history
mock.history();         // Array of all requests

// Pending requests
mock.pending();         // Number of pending requests
await mock.waitForAll(); // Wait for all to complete

// Network conditions
mock.setNetworkDelay(100); // Add latency to all requests
mock.setOffline(true);     // Simulate offline

// Cleanup
mock.reset();    // Clear handlers and history
mock.restore();  // Restore original fetch
```

### GraphQL Mocking

```typescript
import { createGraphQLMock } from '@philjs/testing';

const gql = createGraphQLMock('/graphql');

// Mock query
gql.query('GetUsers', {
  users: [{ id: 1, name: 'John' }],
});

// Mock mutation
gql.mutation('CreateUser', (variables) => ({
  createUser: { id: 2, ...variables },
}));

// Mock subscription
gql.subscription('OnUserCreated', {
  onUserCreated: { id: 3, name: 'Jane' },
});
```

### WebSocket Mocking

```typescript
import { createWebSocketMock } from '@philjs/testing';

const ws = createWebSocketMock('ws://localhost:3000');

// Send message
ws.send({ type: 'ping' });

// Handle messages
ws.onMessage((data) => {
  console.log('Received:', data);
});

// Simulate server messages
ws.simulateMessage({ type: 'pong' });
ws.simulateError(new Error('Connection lost'));
ws.simulateClose(1000, 'Normal closure');

// Close connection
ws.close();
```

## Component Testing

### `testComponent()`

Full component testing with lifecycle tracking:

```typescript
import {
  testComponent,
  expectNoA11yViolations,
  measureRenderPerformance,
  expectRenderWithinBudget,
} from '@philjs/testing';

const result = await testComponent({
  component: MyComponent,
  props: { title: 'Hello' },
  a11y: true,
  performance: true,
  viewport: { width: 1280, height: 720 },
});

// Use component
result.element;          // Rendered element
result.unmount();        // Cleanup
result.rerender({ title: 'New' }); // Re-render

// Act for updates
await result.act(() => {
  result.queries.getByRole('button').click();
});

// Queries
result.queries.getByRole('button');
result.queries.getByText('Hello');
```

### Accessibility Testing

```typescript
// Get accessibility report
const report = await result.getA11yReport();
console.log(report.violations); // A11y violations
console.log(report.passes);     // Passing rules
console.log(report.score);      // 0-100 score

// Assert no violations
await expectNoA11yViolations({
  component: MyComponent,
  props: { accessible: true },
}, {
  impact: 'serious', // Only serious and critical
});
```

### Performance Testing

```typescript
// Get metrics
const metrics = result.getPerformance();
console.log(metrics.renderTime);    // Initial render time
console.log(metrics.rerenderTime);  // Re-render time
console.log(metrics.memoryUsage);   // Memory used
console.log(metrics.domNodes);      // DOM node count
console.log(metrics.eventListeners); // Event listener count

// Measure across iterations
const stats = await measureRenderPerformance(
  { component: MyComponent, props: {} },
  100 // iterations
);
console.log(stats.mean);   // Average render time
console.log(stats.median); // Median render time
console.log(stats.p95);    // 95th percentile
console.log(stats.p99);    // 99th percentile

// Assert render budget
await expectRenderWithinBudget(
  { component: MyComponent, props: {} },
  16 // ms budget (60fps)
);
```

### Visual Testing

```typescript
import {
  visualTest,
  createVisualSnapshot,
  updateVisualSnapshot,
} from '@philjs/testing';

// Compare with baseline
const diff = await visualTest(
  { component: Button, props: { label: 'Click' } },
  'button-baseline.png',
  { threshold: 0.1 }
);

if (!diff.match) {
  console.log(`Diff: ${diff.diffPercentage}%`);
  console.log(`Diff pixels: ${diff.diffPixels}`);
}

// Create snapshot
await createVisualSnapshot(
  { component: Card, props: { title: 'Test' } },
  'card-snapshot'
);

// Update snapshot
await updateVisualSnapshot(
  { component: Card, props: { title: 'Test' } },
  'card-snapshot'
);
```

### Interactive Testing

```typescript
import { interactionTest } from '@philjs/testing';

const result = await interactionTest(
  { component: LoginForm },
  [
    { action: 'type', target: '[name="email"]', value: 'test@example.com' },
    { action: 'type', target: '[name="password"]', value: 'secret' },
    { action: 'click', target: '[type="submit"]' },
  ]
);

if (!result.success) {
  console.log('Errors:', result.errors);
}
```

### Test Fixtures

```typescript
import { createFixture, componentFixture } from '@philjs/testing';

// Create reusable fixture
const dbFixture = createFixture({
  setup: async () => {
    const db = await createTestDatabase();
    await db.seed();
    return db;
  },
  teardown: async (db) => {
    await db.close();
  },
});

// Use in tests
const { data: db, cleanup } = await dbFixture();
// ... use db
await cleanup();

// Component fixture
const buttonTest = componentFixture(Button, { variant: 'primary' });

const result = await buttonTest({ label: 'Click me' });
expect(result.queries.getByText('Click me')).toBeInTheDocument();
result.unmount();
```

## Debug Utilities

```typescript
import {
  debug,
  logDOM,
  prettyDOM,
  debugSignals,
  debugA11y,
  debugForm,
  snapshot,
  compareSnapshots,
} from '@philjs/testing';

// Print DOM
debug(container);
logDOM(element);
const html = prettyDOM(element, { maxLength: 1000 });

// Debug signals
debugSignals(container);

// Debug accessibility
debugA11y(container);

// Debug form state
debugForm(formElement);

// Snapshots
const snap1 = snapshot(container);
const snap2 = snapshot(container);
const diff = compareSnapshots(snap1, snap2);
```

## Custom Matchers

PhilJS extends Jest/Vitest matchers:

```typescript
import {
  toBeInTheDocument,
  toHaveTextContent,
  toBeVisible,
  toBeDisabled,
  toBeEnabled,
  toHaveAttribute,
  toHaveClass,
  toHaveStyle,
  toHaveFocus,
  toHaveValue,
  toBeChecked,
  toBeEmptyDOMElement,
} from '@philjs/testing';

// In test
expect(element).toBeInTheDocument();
expect(element).toHaveTextContent('Hello');
expect(element).toBeVisible();
expect(button).toBeDisabled();
expect(button).toBeEnabled();
expect(element).toHaveAttribute('data-testid', 'my-id');
expect(element).toHaveClass('active');
expect(element).toHaveStyle({ color: 'red' });
expect(input).toHaveFocus();
expect(input).toHaveValue('test');
expect(checkbox).toBeChecked();
expect(container).toBeEmptyDOMElement();
```

## Integration Testing

```typescript
import {
  createIntegrationTest,
  createAPITestHelper,
  createDatabaseTestHelper,
  createAuthTestHelper,
} from '@philjs/testing';

// Create integration test context
const test = createIntegrationTest({
  baseUrl: 'http://localhost:3000',
});

// API helper
const api = createAPITestHelper(test);
const response = await api.get('/users');
await api.post('/users', { name: 'John' });

// Database helper
const db = createDatabaseTestHelper(test);
await db.seed('users', [{ id: 1, name: 'John' }]);
await db.cleanup();

// Auth helper
const auth = createAuthTestHelper(test);
await auth.login({ email: 'test@example.com', password: 'secret' });
await auth.logout();
```

## Test Setup

### Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
});

// test/setup.ts
import '@philjs/testing/matchers';
import { cleanup } from '@philjs/testing';

afterEach(() => {
  cleanup();
});
```

### Jest

```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./test/setup.ts'],
};

// test/setup.ts
import '@philjs/testing/jest';
import { cleanup } from '@philjs/testing';

afterEach(() => {
  cleanup();
});
```

## Best Practices

1. **Query by role/text first** - More accessible, tests what users see
2. **Use userEvent for interactions** - More realistic than fireEvent
3. **Test signals with mocks** - Isolate reactive behavior
4. **Mock network requests** - Fast, reliable tests
5. **Test accessibility** - Catch a11y issues early
6. **Use fixtures** - Reusable test setup
7. **Assert on user-visible changes** - Not implementation details

## API Reference

### Rendering

| Function | Description |
|----------|-------------|
| `render(ui, options)` | Render component for testing |
| `cleanup()` | Clean up rendered components |

### Queries

| Function | Description |
|----------|-------------|
| `screen` | Query document.body |
| `within(element)` | Scoped queries |
| `queryBySignalValue()` | PhilJS signal query |

### Events

| Function | Description |
|----------|-------------|
| `fireEvent` | Fire DOM events |
| `userEvent` | Simulate user interactions |
| `setup()` | Create userEvent instance |

### Hooks

| Function | Description |
|----------|-------------|
| `renderHook(callback, options)` | Test hooks in isolation |
| `act(callback)` | Wrap state updates |
| `cleanupHooks()` | Clean up hook tests |

### Async

| Function | Description |
|----------|-------------|
| `waitFor(callback, options)` | Wait for condition |
| `waitForElementToBeRemoved()` | Wait for element removal |
| `waitForLoadingToFinish()` | Wait for loading states |
| `waitForNetworkIdle()` | Wait for network settle |
| `delay(ms)` | Simple delay |

### Signals

| Function | Description |
|----------|-------------|
| `createMockSignal(initial)` | Create mock signal |
| `createMockComputed(fn)` | Create mock computed |
| `waitForSignal()` | Wait for signal condition |
| `assertSignalHistory()` | Assert signal values |

### Network

| Function | Description |
|----------|-------------|
| `createNetworkMock()` | Mock HTTP requests |
| `createGraphQLMock()` | Mock GraphQL |
| `createWebSocketMock()` | Mock WebSocket |
| `json()`, `error()`, `delayed()` | Response helpers |

### Routes

| Function | Description |
|----------|-------------|
| `createMockRoute()` | Create route context |
| `createMockLoader()` | Create mock loader |
| `createMockAction()` | Create mock action |
| `testLoader()`, `testAction()` | Test loaders/actions |

### Components

| Function | Description |
|----------|-------------|
| `testComponent(config)` | Full component testing |
| `visualTest()` | Visual regression |
| `expectNoA11yViolations()` | A11y assertions |
| `measureRenderPerformance()` | Performance metrics |

## Next Steps

- [Testing Playbook](../../testing/playbook.md) - Testing patterns and recipes
- [E2E Testing](../../testing/e2e.md) - End-to-end testing guide
- [Accessibility Testing](../../testing/accessibility.md) - A11y testing guide
