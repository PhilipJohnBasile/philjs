# philjs-ui

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Official UI component library for PhilJS with dark mode, accessibility, and theming.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- **Pre-built Components** - 40+ accessible, production-ready components
- **Dark Mode** - Built-in theme switching with system preference detection
- **Fully Accessible** - WCAG 2.1 compliant with ARIA support
- **Customizable** - CSS variables and theme tokens
- **TypeScript** - Fully typed component props
- **Responsive** - Mobile-first design
- **Zero Dependencies** - Built with PhilJS signals
- **Tree-shakeable** - Import only what you need

## Installation

```bash
pnpm add philjs-ui
```

## Quick Start

### Setup Theme Provider

```typescript
import { ThemeProvider } from 'philjs-ui';
import 'philjs-ui/styles.css';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <YourApp />
    </ThemeProvider>
  );
}
```

### Use Components

```typescript
import { Button, Input, Card } from 'philjs-ui';

export default function LoginForm() {
  return (
    <Card>
      <h2>Sign In</h2>
      <Input
        type="email"
        placeholder="Email"
        label="Email Address"
      />
      <Input
        type="password"
        placeholder="Password"
        label="Password"
      />
      <Button variant="primary" size="lg">
        Sign In
      </Button>
    </Card>
  );
}
```

### Dark Mode

```typescript
import { useTheme, Button } from 'philjs-ui';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      onClick={() => setTheme(theme() === 'dark' ? 'light' : 'dark')}
    >
      Toggle Theme
    </Button>
  );
}
```

## Available Components

### Layout
- `Container`, `Grid`, `Flex`, `Stack`, `Spacer`

### Forms
- `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Label`

### Buttons
- `Button`, `IconButton`, `ButtonGroup`

### Display
- `Card`, `Badge`, `Avatar`, `Tooltip`, `Modal`, `Drawer`

### Feedback
- `Alert`, `Toast`, `Spinner`, `Progress`, `Skeleton`

### Navigation
- `Tabs`, `Breadcrumbs`, `Pagination`, `Menu`, `Dropdown`

### Data Display
- `Table`, `List`, `Accordion`, `Divider`

## Theming

Customize the theme with CSS variables:

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;

  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
}
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

## License

MIT
