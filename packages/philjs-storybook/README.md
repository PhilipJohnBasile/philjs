# PhilJS Storybook

Official Storybook integration for PhilJS - develop, test, and document your components in isolation.

## Features

- **PhilJS Renderer**: Seamlessly render PhilJS components in Storybook
- **Signal Inspector**: Debug and manipulate signals in real-time
- **Route Tester**: Test route components with mock data
- **Theme Switcher**: Toggle between light/dark themes
- **Viewport Helper**: Test responsive designs
- **Story Helpers**: Type-safe story creation utilities
- **Mocking Utilities**: Mock signals, routers, and APIs
- **CLI Integration**: Generate stories from the command line

## Installation

```bash
# Install PhilJS Storybook
pnpm add -D philjs-storybook storybook

# Initialize Storybook
philjs storybook init
```

## Quick Start

### 1. Initialize Storybook

```bash
philjs storybook init
```

This will create a `.storybook` directory with the necessary configuration files.

### 2. Start Storybook

```bash
philjs storybook dev
```

or use the npm script:

```bash
npm run storybook
```

### 3. Create Your First Story

Generate a story for a component:

```bash
philjs storybook generate Button
```

Or create one manually:

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from 'philjs-storybook';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};
```

## Story Examples

### Component Story

```tsx
import type { Meta, StoryObj } from 'philjs-storybook';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    title: 'Card Title',
    content: 'Card content goes here',
  },
};
```

### Route Story

```tsx
import type { Meta, StoryObj } from 'philjs-storybook';
import { UserProfile } from './UserProfile';
import { withRouter } from 'philjs-storybook/decorators';
import { createMockLoader } from 'philjs-storybook/mocks';

const meta: Meta<typeof UserProfile> = {
  title: 'Routes/UserProfile',
  component: UserProfile,
  decorators: [withRouter],
  parameters: {
    router: {
      pathname: '/users/[id]',
      params: { id: '123' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserProfile>;

export const Default: Story = {};

export const Loading: Story = {
  render: () => {
    const loader = createMockLoader(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { name: 'John Doe', email: 'john@example.com' };
    });

    return <UserProfile loader={loader} />;
  },
};
```

### Form Story with Interactions

```tsx
import type { Meta, StoryObj } from 'philjs-storybook';
import { LoginForm } from './LoginForm';
import { within, userEvent, expect } from '@storybook/test';

const meta: Meta<typeof LoginForm> = {
  title: 'Forms/LoginForm',
  component: LoginForm,
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'password123');
    await userEvent.click(canvas.getByRole('button', { name: /login/i }));
  },
};
```

### Island Story with Signals

```tsx
import type { Meta, StoryObj } from 'philjs-storybook';
import { Counter } from './Counter';
import { withSignals } from 'philjs-storybook/decorators';

const meta: Meta<typeof Counter> = {
  title: 'Islands/Counter',
  component: Counter,
  decorators: [withSignals],
  parameters: {
    signals: {
      count: 0,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Counter>;

export const Default: Story = {};

export const StartingAtTen: Story = {
  parameters: {
    signals: {
      count: 10,
    },
  },
};
```

## Decorators

### withRouter

Wraps stories with a mock router context.

```tsx
import { withRouter } from 'philjs-storybook/decorators';

export default {
  decorators: [withRouter],
  parameters: {
    router: {
      pathname: '/products/[id]',
      params: { id: '123' },
      searchParams: '?tab=reviews',
    },
  },
};
```

### withSignals

Provides signal state management for stories.

```tsx
import { withSignals } from 'philjs-storybook/decorators';

export default {
  decorators: [withSignals],
  parameters: {
    signals: {
      isOpen: false,
      selectedItem: null,
    },
  },
};
```

### withTheme

Enables theme switching for stories.

```tsx
import { withTheme } from 'philjs-storybook/decorators';

export default {
  decorators: [withTheme],
  parameters: {
    theme: 'dark',
  },
};
```

### withLayout

Controls story layout.

```tsx
import { withLayout } from 'philjs-storybook/decorators';

export default {
  decorators: [withLayout],
  parameters: {
    layout: 'centered', // 'centered' | 'fullscreen' | 'padded' | 'none'
  },
};
```

## Mocking Utilities

### Signal Mocks

```tsx
import { createMockSignal, createMockComputed } from 'philjs-storybook/mocks';

// Create a mock signal
const count$ = createMockSignal(0);
count$.set(5);

// Check how many times it was accessed
console.log(count$.getSetCount()); // 1
console.log(count$.getGetCount()); // 0

// Reset the signal
count$.reset();
```

### Router Mocks

```tsx
import { createMockRouter } from 'philjs-storybook/mocks';

const router = createMockRouter('/home');

router.navigate('/about');
router.back();
router.push('/contact');

// Check navigation history
console.log(router.getCalls());
// [
//   { method: 'navigate', args: ['/about'], timestamp: ... },
//   { method: 'back', args: [], timestamp: ... },
//   { method: 'push', args: ['/contact'], timestamp: ... }
// ]
```

### API Mocks

```tsx
import { createMockAPI } from 'philjs-storybook/mocks';

export const handlers = createMockAPI([
  {
    method: 'GET',
    path: '/api/users/:id',
    response: { id: 1, name: 'John Doe' },
  },
  {
    method: 'POST',
    path: '/api/users',
    response: { id: 2, name: 'Jane Doe' },
    status: 201,
  },
]);

// Use in story parameters
export default {
  parameters: {
    msw: {
      handlers,
    },
  },
};
```

### Route Mocks

```tsx
import { createMockLoader, createMockAction } from 'philjs-storybook/mocks';

// Mock loader
const loader = createMockLoader(async (params) => {
  return { user: { id: params.id, name: 'John' } };
});

await loader.load({ id: '123' });
console.log(loader.data()); // { user: { id: '123', name: 'John' } }

// Mock action
const action = createMockAction(async (data) => {
  return { success: true };
});

await action.submit({ name: 'John' });
console.log(action.data()); // { success: true }
```

## Addons

### Signal Inspector

View and manipulate signals in real-time:

1. Open the "Signal Inspector" panel in Storybook
2. See all registered signals and their values
3. Click a signal to edit its value
4. Changes are reflected immediately in your component

### Route Tester

Test route components with different parameters:

1. Open the "Route Tester" panel
2. Configure path, params, and search params
3. Set loader/action data
4. View navigation history

### Theme Switcher

Switch between themes:

1. Use the theme dropdown in the toolbar
2. Or open the "Theme Switcher" panel
3. Create custom themes with CSS variables

### Viewport Helper

Test responsive designs:

1. Use the viewport dropdown in the toolbar
2. Or open the "Viewport" panel
3. Select preset devices or create custom viewports

## CLI Commands

### Initialize Storybook

```bash
philjs storybook init
```

### Start Dev Server

```bash
philjs storybook dev
# or
philjs storybook dev -p 6007
```

### Build Storybook

```bash
philjs storybook build
# or
philjs storybook build -o dist/storybook
```

### Generate Story

```bash
# Generate component story
philjs storybook generate Button

# Generate route story
philjs storybook generate UserProfile --type route

# Generate form story
philjs storybook generate ContactForm --type form

# Generate island story
philjs storybook generate Counter --type island
```

## Configuration

### .storybook/main.ts

```ts
import type { StorybookConfig } from 'philjs-storybook';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'philjs-storybook/addons/signal-inspector',
    'philjs-storybook/addons/route-tester',
    'philjs-storybook/addons/theme-switcher',
    'philjs-storybook/addons/viewport',
  ],
  framework: {
    name: 'philjs-storybook',
    options: {},
  },
};

export default config;
```

### .storybook/preview.ts

```ts
import type { Preview } from 'philjs-storybook';
import { withRouter, withTheme, withLayout } from 'philjs-storybook/decorators';

const preview: Preview = {
  decorators: [withRouter, withTheme, withLayout],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#000000' },
      ],
    },
  },
};

export default preview;
```

## TypeScript Support

PhilJS Storybook is fully typed. All helpers, decorators, and mocks include comprehensive TypeScript definitions.

```tsx
import type { Meta, StoryObj } from 'philjs-storybook';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const meta: Meta<ButtonProps> = {
  // Fully typed
};

type Story = StoryObj<ButtonProps>;
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./preset, ./addons/signal-inspector, ./addons/route-tester, ./addons/theme-switcher, ./addons/viewport, ./decorators, ./mocks
- Source files: packages/philjs-storybook/src/index.ts, packages/philjs-storybook/src/preset.ts, packages/philjs-storybook/src/decorators/index.ts, packages/philjs-storybook/src/mocks/index.ts

### Public API
- Direct exports: addons, core, docs, framework, presetConfig, typescript, viteFinal
- Re-exported names: MockAPIHandler, MockRouter, RenderContext, StoryConfig, StoryContext, createMockAPI, createMockAction, createMockComputed, createMockLoader, createMockRouter, createMockSignal, createStory, presetConfig, renderer, withLayout, withMockData, withRouter, withSignals, withTheme
- Re-exported modules: ./api-mocks.js, ./decorators/index.js, ./mocks/index.js, ./preset.js, ./renderer.js, ./route-mocks.js, ./router-mocks.js, ./signal-mocks.js, ./story-helpers.js, ./with-layout.js, ./with-mock-data.js, ./with-router.js, ./with-signals.js, ./with-theme.js
<!-- API_SNAPSHOT_END -->

## License

MIT  PhilJS Team
