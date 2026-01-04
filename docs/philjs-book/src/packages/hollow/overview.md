# @philjs/hollow

Framework-agnostic Web Components with multi-framework wrappers. Build once, use everywhere with first-class support for React, Vue, Svelte, and PhilJS.

## Installation

```bash
npm install @philjs/hollow
```

## Introduction

`@philjs/hollow` provides a complete component library built on native Web Components, enabling you to share UI components across any JavaScript framework. Each component is:

- **Framework-agnostic**: Pure Web Components that work in any environment
- **Fully accessible**: Built with ARIA support and keyboard navigation
- **Themeable**: Powered by CSS custom properties design tokens
- **Form-associated**: Native form participation with `ElementInternals`
- **Type-safe**: Full TypeScript support with framework-specific type definitions

```typescript
// Use directly as Web Components
import '@philjs/hollow';

// Or use framework-specific wrappers
import { Button } from '@philjs/hollow/react';
import { HollowButton } from '@philjs/hollow/vue';
import { hollow } from '@philjs/hollow/svelte';
import { Button } from '@philjs/hollow/philjs';
```

---

## Core

### HollowElement Base Class

All Hollow components extend the `HollowElement` base class, which provides reactive properties, Shadow DOM, and lifecycle hooks.

```typescript
import { HollowElement, property, defineElement } from '@philjs/hollow';

class MyComponent extends HollowElement {
  @property({ type: 'string' })
  label = 'Hello';

  @property({ type: 'boolean', reflect: true })
  active = false;

  protected template(): string {
    const label = this.getProp('label', 'Hello');
    const active = this.getProp('active', false);

    return `
      <div class="my-component ${active ? 'active' : ''}">
        ${label}
      </div>
    `;
  }

  protected styles(): string {
    return `
      .my-component {
        padding: var(--hollow-spacing-4);
        color: var(--hollow-color-text);
      }
      .active {
        background: var(--hollow-color-primary);
        color: var(--hollow-color-primary-foreground);
      }
    `;
  }
}

defineElement('my-component', MyComponent);
```

### property() Decorator

The `property()` decorator defines reactive properties that automatically trigger re-renders when changed.

```typescript
interface PropertyOptions {
  // Attribute name (defaults to kebab-case of property name)
  attribute?: string | false;

  // Property type for serialization
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';

  // Reflect property changes to attribute
  reflect?: boolean;

  // Default value
  default?: unknown;
}
```

**Examples:**

```typescript
// Basic string property
@property({ type: 'string' })
variant = 'primary';

// Boolean with reflection
@property({ type: 'boolean', reflect: true })
disabled = false;

// Custom attribute name
@property({ type: 'boolean', attribute: 'close-on-escape' })
closeOnEscape = true;

// Array property (serialized as JSON)
@property({ type: 'array' })
options: SelectOption[] = [];
```

### defineElement()

Register a custom element with the browser.

```typescript
import { defineElement } from '@philjs/hollow';

// Only registers if not already defined
defineElement('hollow-button', HollowButton);
```

### Lifecycle Hooks

```typescript
class MyComponent extends HollowElement {
  // Called when element is connected to DOM
  protected onConnect(): void {
    console.log('Component connected');
  }

  // Called when element is disconnected from DOM
  protected onDisconnect(): void {
    console.log('Component disconnected');
  }

  // Called when a property changes
  protected onPropChange(name: string, newValue: unknown, oldValue: unknown): void {
    console.log(`${name} changed from ${oldValue} to ${newValue}`);
  }

  // Called after each render
  protected onRender(): void {
    console.log('Component rendered');
  }

  // Called when element is moved to a new document
  protected onAdopt(): void {
    console.log('Component adopted');
  }
}
```

### Utility Methods

```typescript
class MyComponent extends HollowElement {
  // Get a property value with optional default
  protected getProp<T>(name: string, defaultValue?: T): T;

  // Set a property value (triggers re-render)
  protected setProp<T>(name: string, value: T): void;

  // Emit a custom event that bubbles through Shadow DOM
  protected emit<T>(name: string, detail?: T): boolean;

  // Query an element in the shadow root
  protected query<E extends Element>(selector: string): E | null;

  // Query all elements in the shadow root
  protected queryAll<E extends Element>(selector: string): NodeListOf<E>;
}
```

---

## Design Tokens

Hollow uses CSS custom properties for consistent theming across all components.

### Token Categories

```typescript
import {
  tokens,        // Complete token system
  colors,        // Color palette
  typography,    // Font settings
  spacing,       // Spacing scale
  borderRadius,  // Border radius values
  shadows,       // Box shadow definitions
  transitions,   // Animation timings
  zIndex,        // Z-index layers
} from '@philjs/hollow';
```

### Colors

```typescript
const colors = {
  primary: '#3b82f6',
  primaryForeground: '#ffffff',
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',
  success: '#22c55e',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#ffffff',
  error: '#ef4444',
  errorForeground: '#ffffff',
  info: '#3b82f6',
  infoForeground: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textInverse: '#ffffff',
  background: '#ffffff',
  backgroundMuted: '#f8fafc',
  border: '#e2e8f0',
  borderFocus: '#3b82f6',
  ring: '#3b82f680',
  shadow: 'rgba(0, 0, 0, 0.1)',
};
```

### Typography

```typescript
const typography = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};
```

### Spacing

```typescript
const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
};
```

### Border Radius

```typescript
const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};
```

### Shadows

```typescript
const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};
```

### Transitions

```typescript
const transitions = {
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};
```

### designTokensCSS

The complete CSS custom properties string, automatically injected into all Hollow components:

```typescript
import { designTokensCSS } from '@philjs/hollow';

// Inject into document for global theming
const style = document.createElement('style');
style.textContent = designTokensCSS;
document.head.appendChild(style);
```

### createTheme()

Create custom themes by overriding token values:

```typescript
import { createTheme } from '@philjs/hollow';

const darkTheme = createTheme({
  colors: {
    primary: '#818cf8',
    background: '#0f172a',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
  },
});

// Apply to a component or document
document.documentElement.style.cssText = darkTheme;
```

---

## Components

### HollowButton

A versatile button with multiple variants and sizes.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive'` | `'primary'` | Button visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading spinner |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type for forms |

**Events:**
- `hollow-click`: Fired when button is clicked

```html
<hollow-button variant="primary" size="md">
  Click me
</hollow-button>

<hollow-button variant="destructive" loading>
  Deleting...
</hollow-button>
```

### HollowInput

A versatile text input with validation support.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'outline' \| 'filled'` | `'default'` | Input visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `type` | `'text' \| 'email' \| 'password' \| 'number' \| 'tel' \| 'url' \| 'search'` | `'text'` | Input type |
| `value` | `string` | `''` | Input value |
| `placeholder` | `string` | `''` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the input |
| `readonly` | `boolean` | `false` | Make input read-only |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `string` | `''` | Error message to display |

**Events:**
- `hollow-input`: Fired on input
- `hollow-change`: Fired on change (blur)

```html
<hollow-input
  placeholder="Enter your email"
  type="email"
  required
></hollow-input>

<hollow-input
  variant="filled"
  error="This field is required"
></hollow-input>
```

### HollowCard

A flexible card container with header, body, and footer sections.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'outline' \| 'elevated' \| 'ghost'` | `'default'` | Card visual style |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Content padding |
| `interactive` | `boolean` | `false` | Enable click interaction |
| `selected` | `boolean` | `false` | Selection state |

**Events:**
- `hollow-click`: Fired when interactive card is clicked

```html
<hollow-card variant="elevated" padding="md">
  <div slot="header">Card Title</div>
  <p>Card content goes here</p>
  <div slot="footer">
    <hollow-button>Action</hollow-button>
  </div>
</hollow-card>
```

### HollowModal

A dialog/modal with backdrop, animations, and accessibility support.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Show/hide modal |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `animation` | `'fade' \| 'slide' \| 'scale' \| 'none'` | `'scale'` | Animation type |
| `closable` | `boolean` | `true` | Show close button |
| `close-on-backdrop` | `boolean` | `true` | Close when clicking backdrop |
| `close-on-escape` | `boolean` | `true` | Close on Escape key |
| `persistent` | `boolean` | `false` | Shake instead of close on backdrop click |

**Events:**
- `hollow-open`: Fired when modal opens
- `hollow-close`: Fired when modal closes

**Methods:**
- `show()`: Open the modal
- `close()`: Close the modal
- `toggle()`: Toggle open/closed

```html
<hollow-modal open size="md" animation="scale">
  <div slot="header">Confirm Action</div>
  <p>Are you sure you want to continue?</p>
  <div slot="footer">
    <hollow-button variant="ghost">Cancel</hollow-button>
    <hollow-button variant="primary">Confirm</hollow-button>
  </div>
</hollow-modal>
```

### HollowSelect

A dropdown select with searchable options and keyboard navigation.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'outline' \| 'filled'` | `'default'` | Select visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Select size |
| `value` | `string` | `''` | Selected value |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `searchable` | `boolean` | `false` | Enable search filtering |
| `clearable` | `boolean` | `false` | Allow clearing selection |
| `options` | `SelectOption[]` | `[]` | Available options (JSON string) |

**SelectOption Interface:**
```typescript
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}
```

**Events:**
- `hollow-change`: Fired when selection changes
- `hollow-toggle`: Fired when dropdown opens/closes

```html
<hollow-select
  placeholder="Select a country"
  searchable
  clearable
  options='[
    {"value":"us","label":"United States"},
    {"value":"uk","label":"United Kingdom"},
    {"value":"ca","label":"Canada"}
  ]'
></hollow-select>
```

### HollowCheckbox

A checkbox with checked state, indeterminate support, and accessibility.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error'` | `'primary'` | Checkbox color variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Checkbox size |
| `checked` | `boolean` | `false` | Checked state |
| `indeterminate` | `boolean` | `false` | Indeterminate state |
| `disabled` | `boolean` | `false` | Disable the checkbox |

**Events:**
- `hollow-change`: Fired when checked state changes

**Methods:**
- `toggle()`: Toggle checked state
- `setChecked(checked: boolean)`: Set checked state
- `setIndeterminate(indeterminate: boolean)`: Set indeterminate state

```html
<hollow-checkbox checked>
  Accept terms and conditions
</hollow-checkbox>

<hollow-checkbox variant="success" indeterminate>
  Select all
</hollow-checkbox>
```

### HollowSwitch

An iOS-style toggle switch with smooth animations.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error'` | `'primary'` | Switch color variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Switch size |
| `checked` | `boolean` | `false` | On/off state |
| `disabled` | `boolean` | `false` | Disable the switch |
| `label-on` | `string` | `''` | Label shown when on |
| `label-off` | `string` | `''` | Label shown when off |

**Events:**
- `hollow-change`: Fired when switch state changes

**Methods:**
- `toggle()`: Toggle switch state
- `setChecked(checked: boolean)`: Set switch state

```html
<hollow-switch checked variant="success">
  Enable notifications
</hollow-switch>

<hollow-switch label-on="ON" label-off="OFF">
  Dark mode
</hollow-switch>
```

### HollowTabs

A tab container with tab panels and keyboard navigation.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'pills' \| 'underline' \| 'enclosed'` | `'default'` | Tab visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tab size |
| `active` | `string` | `''` | Active tab ID |
| `alignment` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'start'` | Tab alignment |
| `tabs` | `TabDefinition[]` | `[]` | Tab definitions (JSON string) |

**TabDefinition Interface:**
```typescript
interface TabDefinition {
  id: string;
  label: string;
  disabled?: boolean;
  icon?: string;
}
```

**Events:**
- `hollow-change`: Fired when active tab changes

**Methods:**
- `selectTab(tabId: string)`: Select a tab by ID
- `getActiveTab()`: Get the active tab ID

```html
<hollow-tabs
  active="tab1"
  variant="underline"
  tabs='[
    {"id":"tab1","label":"Overview"},
    {"id":"tab2","label":"Features"},
    {"id":"tab3","label":"Pricing"}
  ]'
>
  <div slot="tab1">Overview content</div>
  <div slot="tab2">Features content</div>
  <div slot="tab3">Pricing content</div>
</hollow-tabs>
```

### HollowAccordion

Collapsible sections with smooth animations and keyboard navigation.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'bordered' \| 'separated' \| 'ghost'` | `'default'` | Accordion visual style |
| `multiple` | `boolean` | `false` | Allow multiple items open |
| `collapsible` | `boolean` | `true` | Allow collapsing all items |
| `expanded` | `string` | `''` | Comma-separated expanded item IDs |
| `items` | `AccordionItem[]` | `[]` | Accordion items (JSON string) |

**AccordionItem Interface:**
```typescript
interface AccordionItem {
  id: string;
  title: string;
  content?: string;
  disabled?: boolean;
  icon?: string;
}
```

**Events:**
- `hollow-change`: Fired when expansion state changes

**Methods:**
- `toggleItem(itemId: string)`: Toggle an item
- `expand(itemId: string)`: Expand an item
- `collapse(itemId: string)`: Collapse an item
- `expandAll()`: Expand all items (multiple mode only)
- `collapseAll()`: Collapse all items
- `getExpandedItems()`: Get array of expanded item IDs

```html
<hollow-accordion
  multiple
  items='[
    {"id":"faq1","title":"What is Hollow?","content":"A component library."},
    {"id":"faq2","title":"How do I install it?","content":"npm install @philjs/hollow"}
  ]'
></hollow-accordion>

<!-- Or use slotted items -->
<hollow-accordion>
  <hollow-accordion-item id="item1" title="Section 1">
    Content for section 1
  </hollow-accordion-item>
  <hollow-accordion-item id="item2" title="Section 2">
    Content for section 2
  </hollow-accordion-item>
</hollow-accordion>
```

---

## Framework Wrappers

### React Integration

Import from `@philjs/hollow/react` for idiomatic React components:

```tsx
import {
  Button,
  Input,
  Card,
  Modal,
  Select,
  Checkbox,
  Switch,
  Tabs,
  Accordion,
} from '@philjs/hollow/react';

function MyForm() {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  return (
    <Card variant="elevated">
      <div slot="header">Sign Up</div>

      <Input
        type="email"
        placeholder="Email address"
        value={email}
        onInput={(e) => setEmail(e.detail.value)}
      />

      <Checkbox
        checked={agreed}
        onChange={(e) => setAgreed(e.detail.checked)}
      >
        I agree to the terms
      </Checkbox>

      <div slot="footer">
        <Button
          variant="primary"
          disabled={!agreed}
          onClick={() => handleSubmit(email)}
        >
          Submit
        </Button>
      </div>
    </Card>
  );
}
```

**useHollowEvent Hook:**

```tsx
import { useHollowEvent } from '@philjs/hollow/react';

function MyComponent() {
  const buttonRef = useRef<HTMLElement>(null);

  useHollowEvent(buttonRef, 'hollow-click', (detail) => {
    console.log('Button clicked!', detail);
  });

  return <hollow-button ref={buttonRef}>Click me</hollow-button>;
}
```

### Vue Integration

Import from `@philjs/hollow/vue` for Vue 3 components:

```vue
<script setup>
import { ref } from 'vue';
import {
  HollowButton,
  HollowInput,
  HollowCard,
  HollowCheckbox,
} from '@philjs/hollow/vue';

const email = ref('');
const agreed = ref(false);

function handleSubmit() {
  console.log('Submitting:', email.value);
}
</script>

<template>
  <HollowCard variant="elevated">
    <template #header>Sign Up</template>

    <HollowInput
      type="email"
      placeholder="Email address"
      :value="email"
      @hollow-input="email = $event.value"
    />

    <HollowCheckbox
      :checked="agreed"
      @hollow-change="agreed = $event.checked"
    >
      I agree to the terms
    </HollowCheckbox>

    <template #footer>
      <HollowButton
        variant="primary"
        :disabled="!agreed"
        @hollow-click="handleSubmit"
      >
        Submit
      </HollowButton>
    </template>
  </HollowCard>
</template>
```

**Vue Plugin:**

```typescript
import { createApp } from 'vue';
import { HollowPlugin } from '@philjs/hollow/vue';

const app = createApp(App);
app.use(HollowPlugin);
app.mount('#app');
```

**v-hollow-props Directive:**

```vue
<template>
  <hollow-button v-hollow-props="buttonProps">
    Click me
  </hollow-button>
</template>

<script setup>
const buttonProps = {
  variant: 'primary',
  size: 'lg',
  onClick: (detail) => console.log('Clicked!', detail),
};
</script>
```

### Svelte Integration

Import from `@philjs/hollow/svelte` for Svelte actions:

```svelte
<script>
  import {
    hollow,
    hollowButton,
    hollowInput,
    hollowCheckbox,
  } from '@philjs/hollow/svelte';

  let email = '';
  let agreed = false;

  function handleSubmit() {
    console.log('Submitting:', email);
  }
</script>

<hollow-card use:hollow={{ variant: 'elevated' }}>
  <div slot="header">Sign Up</div>

  <hollow-input
    use:hollowInput={{
      type: 'email',
      placeholder: 'Email address',
      value: email,
      onInput: (detail) => email = detail.value,
    }}
  />

  <hollow-checkbox
    use:hollowCheckbox={{
      checked: agreed,
      onChange: (detail) => agreed = detail.checked,
    }}
  >
    I agree to the terms
  </hollow-checkbox>

  <div slot="footer">
    <hollow-button
      use:hollowButton={{
        variant: 'primary',
        disabled: !agreed,
        onClick: handleSubmit,
      }}
    >
      Submit
    </hollow-button>
  </div>
</hollow-card>
```

**Reactive Store:**

```svelte
<script>
  import { createHollowStore } from '@philjs/hollow/svelte';

  const formState = createHollowStore({
    email: '',
    agreed: false,
  });

  $: buttonDisabled = !$formState.agreed;
</script>
```

### PhilJS Integration

Import from `@philjs/hollow/philjs` for native PhilJS reactive bindings:

```tsx
import { signal, effect } from '@philjs/core';
import {
  Button,
  Input,
  Card,
  Checkbox,
  useHollowRef,
} from '@philjs/hollow/philjs';

function SignUpForm() {
  const email = signal('');
  const agreed = signal(false);

  return (
    <Card
      variant="elevated"
      header={<h2>Sign Up</h2>}
      footer={
        <Button
          variant="primary"
          disabled={() => !agreed()}
          onClick={() => handleSubmit(email())}
        >
          Submit
        </Button>
      }
    >
      <Input
        type="email"
        placeholder="Email address"
        value={email}
        onInput={(detail) => email.set(detail.value)}
      />

      <Checkbox
        checked={agreed}
        onChange={(detail) => agreed.set(detail.checked)}
      >
        I agree to the terms
      </Checkbox>
    </Card>
  );
}
```

**useHollowRef Hook:**

```tsx
import { useHollowRef } from '@philjs/hollow/philjs';

function MyComponent() {
  const buttonRef = useHollowRef<HTMLElement>();

  // Subscribe to events
  const cleanup = buttonRef.on('hollow-click', (detail) => {
    console.log('Clicked!', detail);
  });

  return (
    <hollow-button ref={buttonRef.set}>
      Click me
    </hollow-button>
  );
}
```

**hollowProps Directive:**

```tsx
import { hollowProps } from '@philjs/hollow/philjs';

function MyComponent() {
  const variant = signal<ButtonVariant>('primary');
  const disabled = signal(false);

  return (
    <hollow-button
      use:hollowProps={{
        variant,
        disabled,
      }}
    >
      Click me
    </hollow-button>
  );
}
```

---

## Usage Examples

### Direct Web Component Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@philjs/hollow';
  </script>
</head>
<body>
  <hollow-card variant="elevated" padding="lg">
    <h2 slot="header">Contact Form</h2>

    <hollow-input
      id="name"
      placeholder="Your name"
      required
    ></hollow-input>

    <hollow-input
      id="email"
      type="email"
      placeholder="Email address"
      required
    ></hollow-input>

    <hollow-select
      id="subject"
      placeholder="Select subject"
      options='[
        {"value":"general","label":"General Inquiry"},
        {"value":"support","label":"Technical Support"},
        {"value":"sales","label":"Sales"}
      ]'
    ></hollow-select>

    <div slot="footer">
      <hollow-button variant="ghost">Cancel</hollow-button>
      <hollow-button variant="primary" id="submit">Send</hollow-button>
    </div>
  </hollow-card>

  <script>
    document.getElementById('submit').addEventListener('hollow-click', () => {
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      console.log('Form submitted:', { name, email });
    });
  </script>
</body>
</html>
```

### Complete React Example

```tsx
import { useState, useCallback } from 'react';
import {
  Button,
  Input,
  Card,
  Modal,
  Select,
  Checkbox,
  Switch,
  Tabs,
  Accordion,
} from '@philjs/hollow/react';

interface FormData {
  name: string;
  email: string;
  country: string;
  newsletter: boolean;
  notifications: boolean;
}

export function SettingsPage() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    country: '',
    newsletter: false,
    notifications: true,
  });

  const handleSave = useCallback(() => {
    console.log('Saving:', formData);
    setShowModal(true);
  }, [formData]);

  return (
    <>
      <Tabs
        variant="underline"
        active={activeTab}
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'preferences', label: 'Preferences' },
          { id: 'security', label: 'Security' },
        ]}
        onChange={(e) => setActiveTab(e.detail.tab)}
      >
        <div slot="profile">
          <Card>
            <Input
              placeholder="Full name"
              value={formData.name}
              onInput={(e) => setFormData(d => ({ ...d, name: e.detail.value }))}
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onInput={(e) => setFormData(d => ({ ...d, email: e.detail.value }))}
            />
            <Select
              placeholder="Country"
              value={formData.country}
              options={[
                { value: 'us', label: 'United States' },
                { value: 'uk', label: 'United Kingdom' },
                { value: 'ca', label: 'Canada' },
              ]}
              onChange={(e) => setFormData(d => ({ ...d, country: e.detail.value }))}
            />
          </Card>
        </div>

        <div slot="preferences">
          <Card>
            <Checkbox
              checked={formData.newsletter}
              onChange={(e) => setFormData(d => ({ ...d, newsletter: e.detail.checked }))}
            >
              Subscribe to newsletter
            </Checkbox>
            <Switch
              variant="success"
              checked={formData.notifications}
              onChange={(e) => setFormData(d => ({ ...d, notifications: e.detail.checked }))}
            >
              Push notifications
            </Switch>
          </Card>
        </div>

        <div slot="security">
          <Accordion
            items={[
              { id: 'password', title: 'Change Password' },
              { id: '2fa', title: 'Two-Factor Authentication' },
              { id: 'sessions', title: 'Active Sessions' },
            ]}
          >
            <div slot="password">
              <Input type="password" placeholder="Current password" />
              <Input type="password" placeholder="New password" />
            </div>
            <div slot="2fa">
              <Switch>Enable 2FA</Switch>
            </div>
            <div slot="sessions">
              <p>2 active sessions</p>
            </div>
          </Accordion>
        </div>
      </Tabs>

      <Button variant="primary" onClick={handleSave}>
        Save Changes
      </Button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
      >
        <div slot="header">Settings Saved</div>
        <p>Your settings have been saved successfully.</p>
        <div slot="footer">
          <Button variant="primary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
```

### Complete Vue Example

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  HollowButton,
  HollowInput,
  HollowCard,
  HollowModal,
  HollowSelect,
  HollowCheckbox,
  HollowSwitch,
  HollowTabs,
} from '@philjs/hollow/vue';

interface FormData {
  name: string;
  email: string;
  country: string;
  newsletter: boolean;
  notifications: boolean;
}

const showModal = ref(false);
const activeTab = ref('profile');
const formData = reactive<FormData>({
  name: '',
  email: '',
  country: '',
  newsletter: false,
  notifications: true,
});

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'preferences', label: 'Preferences' },
];

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
];

function handleSave() {
  console.log('Saving:', formData);
  showModal.value = true;
}
</script>

<template>
  <HollowTabs
    variant="underline"
    :active="activeTab"
    :tabs="tabs"
    @hollow-change="activeTab = $event.tab"
  >
    <template #profile>
      <HollowCard>
        <HollowInput
          placeholder="Full name"
          :value="formData.name"
          @hollow-input="formData.name = $event.value"
        />
        <HollowInput
          type="email"
          placeholder="Email"
          :value="formData.email"
          @hollow-input="formData.email = $event.value"
        />
        <HollowSelect
          placeholder="Country"
          :value="formData.country"
          :options="countries"
          @hollow-change="formData.country = $event.value"
        />
      </HollowCard>
    </template>

    <template #preferences>
      <HollowCard>
        <HollowCheckbox
          :checked="formData.newsletter"
          @hollow-change="formData.newsletter = $event.checked"
        >
          Subscribe to newsletter
        </HollowCheckbox>
        <HollowSwitch
          variant="success"
          :checked="formData.notifications"
          @hollow-change="formData.notifications = $event.checked"
        >
          Push notifications
        </HollowSwitch>
      </HollowCard>
    </template>
  </HollowTabs>

  <HollowButton variant="primary" @hollow-click="handleSave">
    Save Changes
  </HollowButton>

  <HollowModal :open="showModal" @hollow-close="showModal = false">
    <template #header>Settings Saved</template>
    <p>Your settings have been saved successfully.</p>
    <template #footer>
      <HollowButton variant="primary" @hollow-click="showModal = false">
        Close
      </HollowButton>
    </template>
  </HollowModal>
</template>
```

### Complete Svelte Example

```svelte
<script lang="ts">
  import {
    hollow,
    hollowButton,
    hollowInput,
    hollowSelect,
    hollowCheckbox,
    hollowSwitch,
    hollowTabs,
    hollowModal,
  } from '@philjs/hollow/svelte';

  let showModal = false;
  let activeTab = 'profile';
  let formData = {
    name: '',
    email: '',
    country: '',
    newsletter: false,
    notifications: true,
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
  ];

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
  ];

  function handleSave() {
    console.log('Saving:', formData);
    showModal = true;
  }
</script>

<hollow-tabs
  use:hollowTabs={{
    variant: 'underline',
    active: activeTab,
    tabs,
    onChange: (detail) => activeTab = detail.tab,
  }}
>
  <div slot="profile">
    <hollow-card use:hollow={{ variant: 'default' }}>
      <hollow-input
        use:hollowInput={{
          placeholder: 'Full name',
          value: formData.name,
          onInput: (detail) => formData.name = detail.value,
        }}
      />
      <hollow-input
        use:hollowInput={{
          type: 'email',
          placeholder: 'Email',
          value: formData.email,
          onInput: (detail) => formData.email = detail.value,
        }}
      />
      <hollow-select
        use:hollowSelect={{
          placeholder: 'Country',
          value: formData.country,
          options: countries,
          onChange: (detail) => formData.country = detail.value,
        }}
      />
    </hollow-card>
  </div>

  <div slot="preferences">
    <hollow-card use:hollow={{}}>
      <hollow-checkbox
        use:hollowCheckbox={{
          checked: formData.newsletter,
          onChange: (detail) => formData.newsletter = detail.checked,
        }}
      >
        Subscribe to newsletter
      </hollow-checkbox>
      <hollow-switch
        use:hollowSwitch={{
          variant: 'success',
          checked: formData.notifications,
          onChange: (detail) => formData.notifications = detail.checked,
        }}
      >
        Push notifications
      </hollow-switch>
    </hollow-card>
  </div>
</hollow-tabs>

<hollow-button
  use:hollowButton={{
    variant: 'primary',
    onClick: handleSave,
  }}
>
  Save Changes
</hollow-button>

<hollow-modal
  use:hollowModal={{
    open: showModal,
    onClose: () => showModal = false,
  }}
>
  <div slot="header">Settings Saved</div>
  <p>Your settings have been saved successfully.</p>
  <div slot="footer">
    <hollow-button
      use:hollowButton={{
        variant: 'primary',
        onClick: () => showModal = false,
      }}
    >
      Close
    </hollow-button>
  </div>
</hollow-modal>
```

### Complete PhilJS Example

```tsx
import { signal, effect, computed } from '@philjs/core';
import {
  Button,
  Input,
  Card,
  Modal,
  Select,
  Checkbox,
  Switch,
  Tabs,
} from '@philjs/hollow/philjs';

function SettingsPage() {
  const showModal = signal(false);
  const activeTab = signal('profile');

  const name = signal('');
  const email = signal('');
  const country = signal('');
  const newsletter = signal(false);
  const notifications = signal(true);

  const isValid = computed(() =>
    name().length > 0 && email().includes('@')
  );

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
  ];

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
  ];

  function handleSave() {
    console.log('Saving:', {
      name: name(),
      email: email(),
      country: country(),
      newsletter: newsletter(),
      notifications: notifications(),
    });
    showModal.set(true);
  }

  return (
    <>
      <Tabs
        variant="underline"
        active={activeTab}
        tabs={tabs}
        onChange={(detail) => activeTab.set(detail.tab)}
      >
        <div slot="profile">
          <Card>
            <Input
              placeholder="Full name"
              value={name}
              onInput={(detail) => name.set(detail.value)}
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onInput={(detail) => email.set(detail.value)}
            />
            <Select
              placeholder="Country"
              value={country}
              options={countries}
              onChange={(detail) => country.set(detail.value)}
            />
          </Card>
        </div>

        <div slot="preferences">
          <Card>
            <Checkbox
              checked={newsletter}
              onChange={(detail) => newsletter.set(detail.checked)}
            >
              Subscribe to newsletter
            </Checkbox>
            <Switch
              variant="success"
              checked={notifications}
              onChange={(detail) => notifications.set(detail.checked)}
            >
              Push notifications
            </Switch>
          </Card>
        </div>
      </Tabs>

      <Button
        variant="primary"
        disabled={() => !isValid()}
        onClick={handleSave}
      >
        Save Changes
      </Button>

      <Modal
        open={showModal}
        onClose={() => showModal.set(false)}
        header={<span>Settings Saved</span>}
        footer={
          <Button variant="primary" onClick={() => showModal.set(false)}>
            Close
          </Button>
        }
      >
        <p>Your settings have been saved successfully.</p>
      </Modal>
    </>
  );
}
```

---

## Theming

### Custom Theme Example

```typescript
import { createTheme, designTokensCSS } from '@philjs/hollow';

// Create a dark theme
const darkTheme = createTheme({
  colors: {
    primary: '#818cf8',
    primaryForeground: '#ffffff',
    secondary: '#334155',
    secondaryForeground: '#f8fafc',
    background: '#0f172a',
    backgroundMuted: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    borderFocus: '#818cf8',
  },
});

// Apply theme to document
function setTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.style.cssText = darkTheme;
  } else {
    document.documentElement.style.cssText = '';
  }
}
```

### CSS Custom Properties

Override individual tokens in your CSS:

```css
:root {
  --hollow-color-primary: #7c3aed;
  --hollow-color-primary-foreground: #ffffff;
  --hollow-radius-md: 0.5rem;
  --hollow-font-family: 'Inter', sans-serif;
}

/* Scoped theme */
.my-theme {
  --hollow-color-primary: #059669;
  --hollow-color-success: #10b981;
}
```

---

## API Reference

### Exports from `@philjs/hollow`

```typescript
// Core
export { HollowElement, property, defineElement, PropertyOptions };

// Design Tokens
export { tokens, colors, typography, spacing, borderRadius, shadows, transitions, zIndex };
export { designTokensCSS, createTheme };

// Components
export { HollowButton, ButtonVariant, ButtonSize };
export { HollowInput, InputVariant, InputSize, InputType };
export { HollowCard, CardVariant, CardPadding };

// Namespaced wrappers
export * as react from './wrappers/react';
export * as vue from './wrappers/vue';
export * as svelte from './wrappers/svelte';
export * as philjs from './wrappers/philjs';
```

### Exports from `@philjs/hollow/react`

```typescript
export { Button, Input, Card, Modal, Select, Checkbox, Switch, Tabs, Accordion, AccordionItem };
export { useHollowEvent, createReactWrapper };
export type { ButtonProps, InputProps, CardProps, ModalProps, SelectProps };
export type { CheckboxProps, SwitchProps, TabsProps, AccordionProps };
```

### Exports from `@philjs/hollow/vue`

```typescript
export { HollowButton, HollowInput, HollowCard, HollowModal, HollowSelect };
export { HollowCheckbox, HollowSwitch, HollowTabs, HollowAccordion, HollowAccordionItem };
export { HollowPlugin, vHollowProps, createVueWrapper };
```

### Exports from `@philjs/hollow/svelte`

```typescript
export { hollow, hollowButton, hollowInput, hollowCard, hollowModal, hollowSelect };
export { hollowCheckbox, hollowSwitch, hollowTabs, hollowAccordion, hollowAccordionItem };
export { createHollowStore, onHollowEvent };
export type { HollowButtonProps, HollowInputProps, HollowCardProps, HollowModalProps };
```

### Exports from `@philjs/hollow/philjs`

```typescript
export { Button, Input, Card, Modal, Select, Checkbox, Switch, Tabs, Accordion, AccordionItem };
export { useHollowRef, hollowProps, bindProp };
export type { HollowButtonProps, HollowInputProps, HollowCardProps, HollowModalProps };
export type { Accessor, ReactiveProps };
```
