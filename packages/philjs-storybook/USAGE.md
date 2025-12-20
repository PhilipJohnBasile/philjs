# PhilJS Storybook Usage Guide

Complete guide to using Storybook with PhilJS for component development and testing.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Writing Stories](#writing-stories)
- [Using Decorators](#using-decorators)
- [Mocking](#mocking)
- [Custom Addons](#custom-addons)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Installation

### Using the CLI

The easiest way to set up Storybook is using the PhilJS CLI:

```bash
philjs storybook init
```

This will:
1. Create `.storybook` directory with configuration
2. Install required dependencies
3. Add npm scripts to package.json

### Manual Installation

If you prefer manual setup:

```bash
pnpm add -D storybook philjs-storybook @storybook/addon-essentials @storybook/addon-interactions
```

Create `.storybook/main.ts`:

```ts
import type { StorybookConfig } from 'philjs-storybook';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    'philjs-storybook/addons/signal-inspector',
    'philjs-storybook/addons/route-tester',
    'philjs-storybook/addons/theme-switcher',
  ],
  framework: {
    name: 'philjs-storybook',
    options: {},
  },
};

export default config;
```

## Getting Started

### Starting Storybook

```bash
# Using CLI
philjs storybook dev

# Or using npm script
npm run storybook
```

### Generating Stories

```bash
# Generate a component story
philjs storybook generate Button

# Generate a route story
philjs storybook generate UserProfile --type route

# Generate a form story
philjs storybook generate ContactForm --type form

# Generate an island story
philjs storybook generate Counter --type island
```

## Writing Stories

### Basic Component Story

```tsx
import type { Meta, StoryObj } from 'philjs-storybook';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual style variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Default story
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};

// Additional variants
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};
```

### Using createStory Helper

```tsx
import { createStory } from 'philjs-storybook';
import { Button } from './Button';

const { meta, story } = createStory({
  component: Button,
  title: 'UI/Button',
  args: {
    variant: 'primary',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
});

export default meta;

export const Primary = story({
  args: { children: 'Primary Button' },
});

export const Secondary = story({
  args: { variant: 'secondary', children: 'Secondary Button' },
});
```

## Using Decorators

### Router Decorator

For components that use routing:

```tsx
import { withRouter, useRouter } from 'philjs-storybook/decorators';

const meta: Meta<typeof ProductPage> = {
  title: 'Pages/ProductPage',
  component: ProductPage,
  decorators: [withRouter],
  parameters: {
    router: {
      pathname: '/products/[id]',
      params: { id: '123' },
      searchParams: '?tab=reviews',
    },
  },
};

// In your component, access router:
function ProductPage() {
  const router = useRouter();
  const productId = router.params.id;
  // ...
}
```

### Signals Decorator

For components using signals:

```tsx
import { withSignals, useSignalStore } from 'philjs-storybook/decorators';

const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  decorators: [withSignals],
  parameters: {
    signals: {
      user: { name: 'John Doe', role: 'admin' },
      isLoading: false,
    },
  },
};

// In your component:
function Dashboard() {
  const store = useSignalStore();
  const user = store.get('user');
  // ...
}
```

### Theme Decorator

For components with theme support:

```tsx
import { withTheme, useTheme } from 'philjs-storybook/decorators';

const meta: Meta<typeof ThemedCard> = {
  title: 'UI/ThemedCard',
  component: ThemedCard,
  decorators: [withTheme],
  parameters: {
    theme: 'dark', // or 'light'
  },
};

// In your component:
function ThemedCard() {
  const theme = useTheme();
  const bgColor = theme.colors['--bg-color'];
  // ...
}
```

### Layout Decorator

Control story container layout:

```tsx
import { withLayout } from 'philjs-storybook/decorators';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  decorators: [withLayout],
  parameters: {
    layout: 'centered', // 'centered' | 'fullscreen' | 'padded' | 'none'
  },
};
```

### Combining Decorators

```tsx
const meta: Meta<typeof ComplexComponent> = {
  decorators: [withRouter, withSignals, withTheme, withLayout],
  parameters: {
    router: { pathname: '/' },
    signals: { count: 0 },
    theme: 'light',
    layout: 'padded',
  },
};
```

## Mocking

### Mocking Signals

```tsx
import { createMockSignal } from 'philjs-storybook/mocks';

export const WithMockSignal: Story = {
  render: () => {
    const count$ = createMockSignal(0);

    return (
      <div>
        <p>Count: {count$()}</p>
        <button onClick={() => count$.set(count$() + 1)}>
          Increment
        </button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    // Test signal behavior
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await userEvent.click(button);
    await userEvent.click(button);

    // Verify signal was set twice
    expect(count$.getSetCount()).toBe(2);
  },
};
```

### Mocking Router

```tsx
import { createMockRouter } from 'philjs-storybook/mocks';

export const WithNavigation: Story = {
  render: () => {
    const router = createMockRouter('/home');

    return (
      <div>
        <p>Current: {router.pathname()}</p>
        <button onClick={() => router.navigate('/about')}>
          Go to About
        </button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await userEvent.click(button);

    // Check navigation was called
    const calls = router.getCalls();
    expect(calls[0].method).toBe('navigate');
    expect(calls[0].args).toEqual(['/about']);
  },
};
```

### Mocking API with MSW

```tsx
import { createMockAPI } from 'philjs-storybook/mocks';

const handlers = createMockAPI([
  {
    method: 'GET',
    path: '/api/users/:id',
    response: { id: 1, name: 'John Doe', email: 'john@example.com' },
  },
  {
    method: 'POST',
    path: '/api/users',
    response: { id: 2, name: 'Jane Doe' },
    status: 201,
  },
]);

export const WithAPIData: Story = {
  parameters: {
    msw: { handlers },
  },
};
```

### Mocking Loaders and Actions

```tsx
import { createMockLoader, createMockAction } from 'philjs-storybook/mocks';

export const WithLoader: Story = {
  render: () => {
    const loader = createMockLoader(async (params) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { user: { id: params.id, name: 'John' } };
    });

    useEffect(() => {
      loader.load({ id: '123' });
    }, []);

    return (
      <div>
        {loader.loading$() && <div>Loading...</div>}
        {loader.error$() && <div>Error: {loader.error$().message}</div>}
        {loader.data$() && <div>User: {loader.data$().user.name}</div>}
      </div>
    );
  },
};

export const WithAction: Story = {
  render: () => {
    const action = createMockAction(async (data) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, message: 'Saved!' };
    });

    const handleSubmit = () => {
      action.submit({ name: 'John' });
    };

    return (
      <div>
        <button onClick={handleSubmit} disabled={action.submitting$()}>
          {action.submitting$() ? 'Saving...' : 'Save'}
        </button>
        {action.data$() && <div>{action.data$().message}</div>}
      </div>
    );
  },
};
```

## Custom Addons

### Signal Inspector

The Signal Inspector addon lets you view and manipulate signals in real-time:

```tsx
import { registerSignal } from 'philjs-storybook/addons/signal-inspector';

export const WithSignalInspector: Story = {
  render: () => {
    const count$ = signal(0);
    const doubled$ = computed(() => count$() * 2);

    // Register signals for inspection
    registerSignal('count', count$);
    registerSignal('doubled', doubled$);

    return (
      <div>
        <p>Count: {count$()}</p>
        <p>Doubled: {doubled$()}</p>
        <button onClick={() => count$.set(count$() + 1)}>+</button>
      </div>
    );
  },
};
```

### Route Tester

Test route components with different configurations:

```tsx
import { setTestRoute } from 'philjs-storybook/addons/route-tester';

export const TestRoute: Story = {
  render: () => {
    // Set up test route
    setTestRoute({
      path: '/users/[id]',
      params: { id: '123' },
      searchParams: { tab: 'profile' },
      loaderData: { user: { name: 'John' } },
    });

    return <UserProfile />;
  },
};
```

### Theme Switcher

Switch themes dynamically:

```tsx
import { setTheme, registerTheme } from 'philjs-storybook/addons/theme-switcher';

// Register custom theme
registerTheme({
  name: 'Ocean',
  colors: {
    '--bg-color': '#0d47a1',
    '--text-color': '#ffffff',
    '--primary-color': '#64b5f6',
  },
});

export const CustomTheme: Story = {
  render: () => {
    setTheme('Ocean');
    return <ThemedComponent />;
  },
};
```

## Testing

### Testing with Play Functions

```tsx
import { within, userEvent, expect } from '@storybook/test';

export const TestUserInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find elements
    const input = canvas.getByRole('textbox');
    const button = canvas.getByRole('button');

    // Simulate user actions
    await userEvent.type(input, 'Hello World');
    await userEvent.click(button);

    // Assert results
    await expect(canvas.getByText(/success/i)).toBeInTheDocument();
  },
};
```

### Testing Form Validation

```tsx
export const TestFormValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Try to submit empty form
    const submitButton = canvas.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    // Check for validation errors
    await expect(canvas.getByText(/email is required/i)).toBeInTheDocument();
    await expect(canvas.getByText(/password is required/i)).toBeInTheDocument();

    // Fill form correctly
    await userEvent.type(canvas.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(canvas.getByLabelText(/password/i), 'password123');
    await userEvent.click(submitButton);

    // Errors should be gone
    await expect(canvas.queryByText(/email is required/i)).not.toBeInTheDocument();
  },
};
```

## Best Practices

### 1. Organize Stories by Feature

```
src/
  components/
    Button/
      Button.tsx
      Button.stories.tsx
      Button.test.ts
    Card/
      Card.tsx
      Card.stories.tsx
```

### 2. Use Descriptive Story Names

```tsx
// Good
export const PrimaryButton: Story = { ... };
export const DisabledState: Story = { ... };
export const WithLongText: Story = { ... };

// Avoid
export const Story1: Story = { ... };
export const Test: Story = { ... };
```

### 3. Document ArgTypes

```tsx
argTypes: {
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'danger'],
    description: 'Visual style of the button',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'primary' },
    },
  },
}
```

### 4. Use Play Functions for Interactive Tests

```tsx
export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Name'), 'John Doe');
    await userEvent.click(canvas.getByRole('button'));
  },
};
```

### 5. Provide Multiple Variants

```tsx
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};
```

### 6. Mock External Dependencies

```tsx
// Mock API calls
const handlers = createMockAPI([...]);

export const Default: Story = {
  parameters: {
    msw: { handlers },
  },
};
```

### 7. Test Edge Cases

```tsx
export const EmptyState: Story = { args: { items: [] } };
export const LoadingState: Story = { args: { isLoading: true } };
export const ErrorState: Story = { args: { error: 'Failed to load' } };
export const MaxItems: Story = { args: { items: Array(100).fill({}) } };
```

### 8. Use Responsive Viewports

```tsx
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
```

### 9. Document Accessibility

```tsx
export const Default: Story = {
  args: {
    'aria-label': 'Close dialog',
    role: 'button',
  },
};
```

### 10. Keep Stories Simple

Each story should demonstrate one thing clearly:

```tsx
// Good - focused on one variant
export const PrimaryButton: Story = {
  args: { variant: 'primary' },
};

// Avoid - too many things at once
export const ComplexStory: Story = {
  args: { variant: 'primary', size: 'large', disabled: true, loading: true },
};
```

## Troubleshooting

### Stories not loading

Check that your `main.ts` has the correct stories pattern:

```ts
stories: ['../src/**/*.stories.@(ts|tsx)']
```

### Signals not updating

Make sure you're using the signals decorator:

```tsx
decorators: [withSignals]
```

### Router context missing

Add the router decorator:

```tsx
decorators: [withRouter]
```

### TypeScript errors

Ensure `jsxImportSource` is set in tsconfig.json:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core"
  }
}
```

## Advanced Topics

### Custom Decorators

Create your own decorators:

```tsx
export function withCustomWrapper(story: () => any) {
  return (
    <div style={{ padding: '20px', border: '1px solid red' }}>
      {story()}
    </div>
  );
}

// Use in stories
export default {
  decorators: [withCustomWrapper],
};
```

### Global Decorators

Add decorators to all stories in `.storybook/preview.ts`:

```ts
import { withRouter, withTheme } from 'philjs-storybook/decorators';

const preview: Preview = {
  decorators: [withRouter, withTheme],
};
```

### Custom Addon Development

See the addon source code in `src/addons/` for examples of creating custom addons.

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [PhilJS Documentation](https://philjs.dev/docs)
- [Example Stories](./examples/)
- [GitHub Issues](https://github.com/yourusername/philjs/issues)

## Support

For questions and support:
- GitHub Issues: https://github.com/yourusername/philjs/issues
- Discord: https://discord.gg/philjs
- Twitter: @philjs
