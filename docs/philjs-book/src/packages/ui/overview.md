# @philjs/ui

The official UI component library for PhilJS featuring 20+ production-ready components with dark mode support, comprehensive accessibility, and full theming capabilities.

## Features

- **20+ Production Components**: Buttons, inputs, modals, tables, and more
- **Dark Mode Support**: Built-in light/dark/system theme switching with persistence
- **Full Accessibility**: ARIA compliant with keyboard navigation and focus management
- **Design Tokens**: Customizable colors, spacing, typography, shadows, and more
- **TypeScript First**: Complete type definitions for all components and props
- **Signal Integration**: Built on PhilJS signals for reactive state management

## Installation

```bash
npm install @philjs/ui
# or
pnpm add @philjs/ui
# or
bun add @philjs/ui
```

## Quick Start

```tsx
import { ThemeProvider, Button, Input, Card, CardBody, CardTitle } from '@philjs/ui';
import '@philjs/ui/styles.css';

function App() {
  return (
    <ThemeProvider>
      <Card>
        <CardTitle>Welcome</CardTitle>
        <CardBody>
          <Input label="Email" placeholder="Enter your email" />
          <Button color="primary">Submit</Button>
        </CardBody>
      </Card>
    </ThemeProvider>
  );
}
```

## Component Categories

### Form Components

| Component | Description |
|-----------|-------------|
| [Input](./forms.md#input) | Text input with labels, validation, and icons |
| [Textarea](./forms.md#textarea) | Multi-line text input with resize options |
| [Select](./forms.md#select) | Single-selection dropdown |
| [MultiSelect](./forms.md#multiselect) | Multiple-selection dropdown with tags |
| [Checkbox](./forms.md#checkbox) | Checkbox with indeterminate state support |
| [CheckboxGroup](./forms.md#checkboxgroup) | Group of related checkboxes |
| [Radio](./forms.md#radio) | Radio button for single selection |
| [RadioGroup](./forms.md#radiogroup) | Group of radio buttons |
| [Switch](./forms.md#switch) | Toggle switch for boolean values |

### Button Components

| Component | Description |
|-----------|-------------|
| [Button](./buttons.md#button) | Primary action component with variants and sizes |
| [IconButton](./buttons.md#iconbutton) | Icon-only button with required aria-label |
| [ButtonGroup](./buttons.md#buttongroup) | Grouped buttons with attached styling |

### Feedback Components

| Component | Description |
|-----------|-------------|
| [Alert](./feedback.md#alert) | Contextual feedback with status variants |
| [Toast](./feedback.md#toast) | Temporary notification system |
| [Spinner](./feedback.md#spinner) | Loading indicator |
| [Progress](./feedback.md#progress) | Linear progress bar |
| [CircularProgress](./feedback.md#circularprogress) | Circular progress indicator |
| [Skeleton](./feedback.md#skeleton) | Content loading placeholder |

### Data Display Components

| Component | Description |
|-----------|-------------|
| [Card](./data-display.md#card) | Content container with header, body, footer |
| [Table](./data-display.md#table) | Data table with sorting support |
| [Avatar](./data-display.md#avatar) | User avatar with fallback initials |
| [AvatarGroup](./data-display.md#avatargroup) | Stacked avatars with overflow |
| [Badge](./data-display.md#badge) | Status badge with color variants |
| [StatusIndicator](./data-display.md#statusindicator) | Online/offline status dot |
| [NotificationBadge](./data-display.md#notificationbadge) | Notification count badge |

### Overlay Components

| Component | Description |
|-----------|-------------|
| [Modal](./overlays.md#modal) | Dialog window with focus trapping |
| [ConfirmDialog](./overlays.md#confirmdialog) | Confirmation modal preset |
| [Drawer](./overlays.md#drawer) | Slide-out panel from any edge |
| [Tooltip](./overlays.md#tooltip) | Hover information tooltip |
| [Popover](./overlays.md#popover) | Interactive popover content |
| [Dropdown](./overlays.md#dropdown) | Dropdown menu with items |

### Navigation Components

| Component | Description |
|-----------|-------------|
| [Tabs](./navigation.md#tabs) | Tabbed navigation with panels |
| [Accordion](./navigation.md#accordion) | Collapsible content panels |
| [Breadcrumb](./navigation.md#breadcrumb) | Navigation breadcrumb trail |

## Theming

All components support theming through the `ThemeProvider`:

```tsx
import { ThemeProvider, useColorMode, Button } from '@philjs/ui';

function App() {
  return (
    <ThemeProvider defaultColorMode="system">
      <YourApp />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { isDark, toggleColorMode } = useColorMode();

  return (
    <Button onClick={toggleColorMode}>
      {isDark() ? 'Switch to Light' : 'Switch to Dark'}
    </Button>
  );
}
```

See the [Theming Guide](./theming.md) for complete customization options including design tokens for colors, spacing, typography, shadows, and breakpoints.

## Accessibility

All PhilJS UI components are built with accessibility as a core principle:

- **Keyboard Navigation**: Full keyboard support for all interactive components
- **ARIA Attributes**: Proper roles, states, and properties
- **Focus Management**: Automatic focus trapping in modals and drawers
- **Screen Reader Support**: Live regions for toasts and alerts
- **Color Contrast**: WCAG 2.1 AA compliant color combinations

See the [Accessibility Guide](./accessibility.md) for detailed information on each component's accessibility features.

## TypeScript Support

All components export their prop types for full TypeScript integration:

```tsx
import type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonColor,
  InputProps,
  InputSize,
  InputVariant,
  ModalProps,
  ModalSize,
  SelectOption
} from '@philjs/ui';

// Use types for your own components
interface MyFormProps {
  buttonVariant: ButtonVariant;
  inputSize: InputSize;
  onSubmit: ButtonProps['onClick'];
}

// Type-safe options
const options: SelectOption[] = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2', disabled: true }
];
```

## Package Exports

The package provides multiple entry points:

```tsx
// Main entry - all components
import { Button, Input, Modal, toast } from '@philjs/ui';

// Theme utilities only
import { ThemeProvider, useTheme, useColorMode } from '@philjs/ui/theme';

// Design tokens
import { colors, spacing, fontSize, defaultTheme } from '@philjs/ui';

// Styles
import '@philjs/ui/styles.css';
```

## Browser Support

PhilJS UI supports all modern browsers:

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## Next Steps

- [Theming Guide](./theming.md) - Customize colors, fonts, and design tokens
- [Form Components](./forms.md) - Build accessible forms
- [Button Components](./buttons.md) - Action buttons and groups
- [Feedback Components](./feedback.md) - Alerts, toasts, and loading states
- [Data Display](./data-display.md) - Cards, tables, and avatars
- [Overlay Components](./overlays.md) - Modals, drawers, and tooltips
- [Navigation](./navigation.md) - Tabs, accordions, and breadcrumbs
- [Accessibility Guide](./accessibility.md) - A11y best practices
