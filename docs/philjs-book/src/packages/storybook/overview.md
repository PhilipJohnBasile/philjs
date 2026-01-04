# @philjs/storybook

The `@philjs/storybook` package provides Storybook integration for PhilJS, with custom renderer, decorators, and mocking utilities.

## Installation

```bash
npm install @philjs/storybook
```

## Features

- **Custom Renderer** - PhilJS-optimized Storybook rendering
- **Decorators** - Router, signals, theme, layout, and mock data
- **Story Helpers** - Type-safe story creation utilities
- **Mocking** - Router and signal mocking for isolated testing
- **Signal Tracking** - Spy on signal access and mutations

## Quick Start

### Configure Storybook

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@philjs/storybook';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
  ],
  framework: {
    name: '@philjs/storybook',
    options: {},
  },
};

export default config;
```

### Create Your First Story

```typescript
// src/components/Button.stories.tsx
import { createStory } from '@philjs/storybook';
import { Button } from './Button';

const meta = createStory({
  component: Button,
  title: 'Components/Button',
  args: {
    label: 'Click me',
    variant: 'primary',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
});

export default meta;

export const Primary = {};
export const Secondary = { args: { variant: 'secondary' } };
export const Danger = { args: { variant: 'danger' } };
```

---

## Story Helpers

### createStory

Create type-safe story configurations:

```typescript
import { createStory, createVariant } from '@philjs/storybook';
import type { StoryConfig, ArgTypeConfig } from '@philjs/storybook';

interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

const meta = createStory<ButtonProps>({
  component: Button,
  title: 'Components/Button',

  // Default args for all stories
  args: {
    label: 'Button',
    variant: 'primary',
    size: 'md',
    disabled: false,
  },

  // Configure Storybook controls
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual style of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
        category: 'Appearance',
      },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    onClick: {
      action: 'clicked',
    },
  },

  // Story parameters
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component.',
      },
    },
  },

  // Tags for Storybook
  tags: ['autodocs'],
});

export default meta;
```

### createVariant

Create story variants with customized args:

```typescript
import { createVariant } from '@philjs/storybook';

export const Primary = {};

export const Secondary = createVariant({
  args: { variant: 'secondary' },
});

export const Large = createVariant({
  args: { size: 'lg' },
  parameters: {
    backgrounds: { default: 'dark' },
  },
});

export const Disabled = createVariant({
  args: { disabled: true },
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
});
```

### ArgType Configuration

```typescript
interface ArgTypeConfig {
  /** Control configuration */
  control?: ControlConfig | string | false;

  /** Description shown in docs */
  description?: string;

  /** Default value */
  defaultValue?: unknown;

  /** Display name */
  name?: string;

  /** Table configuration for docs */
  table?: {
    type?: { summary: string; detail?: string };
    defaultValue?: { summary: string; detail?: string };
    category?: string;
    subcategory?: string;
  };

  /** Options for select/radio controls */
  options?: unknown[];

  /** Mapping for option display */
  mapping?: Record<string, unknown>;

  /** Conditional display */
  if?: { arg?: string; exists?: boolean };
}
```

### Control Types

```typescript
interface ControlConfig {
  type:
    | 'text'
    | 'number'
    | 'boolean'
    | 'object'
    | 'select'
    | 'radio'
    | 'inline-radio'
    | 'check'
    | 'inline-check'
    | 'range'
    | 'color'
    | 'date'
    | 'file';

  // For range controls
  min?: number;
  max?: number;
  step?: number;

  // For color controls
  presetColors?: string[];

  // For select/radio controls
  labels?: Record<string, string>;

  // For file controls
  accept?: string;
}
```

---

## Decorators

### withRouter

Provide router context to stories:

```typescript
import { withRouter } from '@philjs/storybook';
import type { WithRouterOptions } from '@philjs/storybook';

const meta = createStory({
  component: UserProfile,
  decorators: [
    withRouter({
      initialPath: '/users/123',
      params: { userId: '123' },
    }),
  ],
});

export default meta;

// Access router in story
export const Default = {
  play: async ({ parameters }) => {
    const router = parameters.router;
    console.log(router.pathname()); // '/users/123'
    console.log(router.params());   // { userId: '123' }

    // Trigger navigation
    router.navigate('/users/456');
  },
};
```

### withSignals

Provide signal state to stories:

```typescript
import { withSignals } from '@philjs/storybook';
import type { WithSignalsOptions } from '@philjs/storybook';

const meta = createStory({
  component: Counter,
  decorators: [
    withSignals({
      initialState: {
        count: 0,
        name: 'Counter',
      },
    }),
  ],
});

export default meta;

// Access signals in story
export const Default = {
  play: async ({ parameters }) => {
    const { count, name } = parameters.signals;

    console.log(count()); // 0
    count.set(10);
    console.log(count()); // 10
  },
};
```

### withTheme

Provide theme context to stories:

```typescript
import { withTheme } from '@philjs/storybook';
import type { ThemeMode, WithThemeOptions } from '@philjs/storybook';

const meta = createStory({
  component: Card,
  decorators: [
    withTheme({
      defaultTheme: 'light',
      themes: {
        light: {
          'bg-color': '#ffffff',
          'text-color': '#1a1a1a',
          'border-color': '#e5e5e5',
        },
        dark: {
          'bg-color': '#1a1a1a',
          'text-color': '#ffffff',
          'border-color': '#333333',
        },
      },
    }),
  ],
});

export default meta;

// Access theme in story
export const Default = {
  play: async ({ parameters }) => {
    const { current, setTheme } = parameters.theme;

    console.log(current()); // 'light'
    setTheme('dark');
    console.log(current()); // 'dark'
  },
};
```

### withLayout

Wrap stories with layout components:

```typescript
import { withLayout } from '@philjs/storybook';

const meta = createStory({
  component: PageContent,
  decorators: [
    withLayout({
      layout: 'centered', // or 'fullscreen', 'padded'
      padding: 20,
    }),
  ],
});
```

### withMockData

Provide mock data to stories:

```typescript
import { withMockData } from '@philjs/storybook';

const meta = createStory({
  component: UserList,
  decorators: [
    withMockData({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
      loading: false,
      error: null,
    }),
  ],
});
```

### Combining Decorators

```typescript
const meta = createStory({
  component: Dashboard,
  decorators: [
    withRouter({ initialPath: '/dashboard' }),
    withSignals({
      initialState: { sidebarOpen: true },
    }),
    withTheme({ defaultTheme: 'dark' }),
    withMockData({
      user: { name: 'John' },
      stats: { views: 1000 },
    }),
  ],
});
```

---

## Mocking Utilities

### createMockRouter

Create a mock router for testing:

```typescript
import { createMockRouter } from '@philjs/storybook';
import type { MockRouter } from '@philjs/storybook';

const router = createMockRouter('/users');

// Reactive pathname
console.log(router.pathname()); // '/users'

// Navigate
router.navigate('/settings');
console.log(router.pathname()); // '/settings'

// Track navigation calls
router.push('/home');
router.replace('/login');
console.log(router.getCalls());
// [
//   { method: 'navigate', args: ['/settings'] },
//   { method: 'push', args: ['/home'] },
//   { method: 'replace', args: ['/login'] },
// ]
```

### MockRouter Interface

```typescript
interface MockRouter {
  /** Reactive pathname signal */
  pathname: Signal<string>;

  /** Route parameters signal */
  params: Signal<Record<string, string>>;

  /** Search parameters signal */
  searchParams: Signal<URLSearchParams>;

  /** Navigate to path */
  navigate: (path: string) => void;

  /** Go back in history */
  back: () => void;

  /** Go forward in history */
  forward: () => void;

  /** Push to history */
  push: (path: string) => void;

  /** Replace current entry */
  replace: (path: string) => void;

  /** Get all navigation calls */
  getCalls: () => Array<{ method: string; args: any[] }>;
}
```

### createMockParams / createMockSearchParams

```typescript
import {
  createMockParams,
  createMockSearchParams,
} from '@philjs/storybook';

// Mock route params
const params = createMockParams({
  userId: '123',
  postId: '456',
});

console.log(params().userId); // '123'

// Mock search params
const searchParams = createMockSearchParams({
  q: 'hello',
  page: '1',
});

console.log(searchParams().get('q')); // 'hello'
```

---

## Signal Mocking

### createMockSignal

Create a tracked signal for testing:

```typescript
import { createMockSignal } from '@philjs/storybook';

const count = createMockSignal(0);

// Use like a normal signal
console.log(count()); // 0
count.set(5);
console.log(count()); // 5

// Track access
count();
count();
count.set(10);

console.log(count.getGetCount()); // 3
console.log(count.getSetCount()); // 2

// Get all calls
console.log(count.getCalls());
// [
//   { type: 'get' },
//   { type: 'get' },
//   { type: 'get' },
//   { type: 'set', value: 5 },
//   { type: 'set', value: 10 },
// ]

// Reset to initial state
count.reset();
console.log(count()); // 0
```

### createMockComputed

Create a tracked computed signal:

```typescript
import { createMockSignal, createMockComputed } from '@philjs/storybook';

const count = createMockSignal(5);
const doubled = createMockComputed(() => count() * 2);

console.log(doubled()); // 10
console.log(doubled.getCallCount()); // 1

count.set(10);
console.log(doubled()); // 20
console.log(doubled.getCallCount()); // 2
```

### spyOnSignal

Spy on an existing signal:

```typescript
import { signal } from '@philjs/core';
import { spyOnSignal } from '@philjs/storybook';

const originalSignal = signal(0);
const spy = spyOnSignal(originalSignal);

// Use the spy like the original signal
spy();
spy.set(10);
spy();

// Check calls with timestamps
const calls = spy.getCalls();
console.log(calls);
// [
//   { type: 'get', timestamp: 1234567890 },
//   { type: 'set', value: 10, timestamp: 1234567891 },
//   { type: 'get', timestamp: 1234567892 },
// ]

// Clear call history
spy.clearCalls();
```

---

## Renderer

The PhilJS Storybook renderer integrates PhilJS components with Storybook's rendering pipeline.

### Custom Renderer

```typescript
import { renderer } from '@philjs/storybook';

// Render a story to the canvas
renderer.renderToCanvas(
  {
    storyFn: () => <Button label="Click me" />,
    showMain: () => { /* show main panel */ },
    showError: (error) => { /* show error */ },
    showException: (err) => { /* show exception */ },
  },
  {
    id: 'button--primary',
    kind: 'Components/Button',
    name: 'Primary',
    story: 'Primary',
    args: { label: 'Click me' },
    argTypes: {},
    globals: {},
    hooks: {},
    parameters: {},
    viewMode: 'story',
  }
);

// Cleanup
renderer.cleanUpPreviousStory();
```

### RenderContext

```typescript
interface RenderContext {
  args: Record<string, any>;
  argTypes: Record<string, any>;
  globals: Record<string, any>;
  hooks: any;
  parameters: Record<string, any>;
  viewMode: string;
}

interface StoryContext extends RenderContext {
  id: string;
  kind: string;
  name: string;
  story: string;
  component?: ComponentType<any>;
}
```

---

## Complete Example

```typescript
// Button.stories.tsx
import { createStory, createVariant, withTheme, withSignals } from '@philjs/storybook';
import { Button } from './Button';

interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const meta = createStory<ButtonProps>({
  component: Button,
  title: 'Components/Button',
  tags: ['autodocs'],

  args: {
    label: 'Button',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
  },

  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'The visual style of the button',
      table: {
        category: 'Appearance',
      },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      table: {
        category: 'Appearance',
      },
    },
    loading: {
      control: 'boolean',
      table: {
        category: 'State',
      },
    },
    disabled: {
      control: 'boolean',
      table: {
        category: 'State',
      },
    },
    onClick: {
      action: 'clicked',
      table: {
        category: 'Events',
      },
    },
  },

  decorators: [
    withTheme({
      defaultTheme: 'light',
      themes: {
        light: {
          'button-bg': '#3b82f6',
          'button-text': '#ffffff',
        },
        dark: {
          'button-bg': '#1d4ed8',
          'button-text': '#ffffff',
        },
      },
    }),
  ],

  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes.',
      },
    },
  },
});

export default meta;

// Basic variants
export const Primary = {};
export const Secondary = { args: { variant: 'secondary' } };
export const Danger = { args: { variant: 'danger' } };

// Size variants
export const Small = { args: { size: 'sm' } };
export const Large = { args: { size: 'lg' } };

// State variants
export const Loading = { args: { loading: true } };
export const Disabled = { args: { disabled: true } };

// Interactive story
export const Interactive = {
  play: async ({ args, canvasElement }) => {
    const button = canvasElement.querySelector('button');
    button?.click();
    // Verify onClick was called
  },
};
```

---

## Types Reference

```typescript
// Story configuration
interface StoryConfig<P = Record<string, unknown>> {
  component: ComponentType<P>;
  title?: string;
  args?: Partial<P>;
  argTypes?: Record<string, ArgTypeConfig>;
  parameters?: Record<string, unknown>;
  decorators?: Array<(story: () => unknown) => unknown>;
  tags?: string[];
}

// Story meta (Storybook format)
interface StoryMeta<P = Record<string, unknown>> {
  component: ComponentType<P>;
  title?: string;
  args?: Partial<P>;
  argTypes?: Record<string, ArgTypeConfig>;
  parameters?: Record<string, unknown>;
  decorators?: Array<(story: () => unknown) => unknown>;
  tags?: string[];
}

// Story variant
interface StoryVariant<P = Record<string, unknown>> {
  args?: Partial<P>;
  argTypes?: Record<string, ArgTypeConfig>;
  parameters?: Record<string, unknown>;
  decorators?: Array<(story: () => unknown) => unknown>;
}

// Theme mode
type ThemeMode = 'light' | 'dark' | 'system';

// Router options
interface WithRouterOptions {
  initialPath?: string;
  params?: Record<string, string>;
}

// Signal options
interface WithSignalsOptions {
  initialState?: Record<string, any>;
}

// Theme options
interface WithThemeOptions {
  defaultTheme?: ThemeMode;
  themes?: Record<string, Record<string, string>>;
}
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `createStory` | Create story configuration |
| `createVariant` | Create story variant |
| `withRouter` | Router context decorator |
| `withSignals` | Signals context decorator |
| `withTheme` | Theme context decorator |
| `withLayout` | Layout wrapper decorator |
| `withMockData` | Mock data decorator |
| `createMockRouter` | Create mock router |
| `createMockParams` | Create mock route params |
| `createMockSearchParams` | Create mock search params |
| `createMockSignal` | Create tracked signal |
| `createMockComputed` | Create tracked computed |
| `spyOnSignal` | Spy on signal access |
| `renderer` | PhilJS Storybook renderer |
| `presetConfig` | Storybook preset configuration |

---

## Next Steps

- [@philjs/testing for Unit Tests](../testing/overview.md)
- [@philjs/devtools for Debugging](../devtools/overview.md)
- [@philjs/ui Component Library](../ui/overview.md)
