# @philjs/hollow

Framework-agnostic headless UI components built as Web Components with wrappers for React, Vue, Svelte, and native PhilJS. Inspired by Radix UI and Headless UI, Hollow provides unstyled, accessible components that integrate seamlessly with any styling solution.

## Features

- **Web Components**: Native browser support, works everywhere
- **Framework Wrappers**: First-class support for React, Vue, Svelte, and PhilJS
- **Headless/Unstyled**: Full control over styling with CSS custom properties
- **Accessible**: ARIA compliant with keyboard navigation
- **Form Integration**: Native form association for all form components
- **TypeScript**: Full type safety with comprehensive types
- **Design Tokens**: Customizable via CSS custom properties

## Installation

```bash
npm install @philjs/hollow
# or
pnpm add @philjs/hollow
# or
bun add @philjs/hollow
```

## Quick Start

### Vanilla JavaScript / Web Components

```html
<script type="module">
  import '@philjs/hollow';
</script>

<hollow-button variant="primary" size="md">
  Click me
</hollow-button>

<hollow-input type="email" placeholder="Enter email" />

<hollow-modal open size="md">
  <div slot="header">Modal Title</div>
  <p>Modal content goes here</p>
  <div slot="footer">
    <hollow-button variant="secondary">Cancel</hollow-button>
    <hollow-button variant="primary">Save</hollow-button>
  </div>
</hollow-modal>
```

### React

```tsx
import { Button, Input, Modal, Select } from '@philjs/hollow/react';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setOpen(true)}
      >
        Open Modal
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
      >
        <Input
          type="email"
          placeholder="Enter email"
          onChange={(e) => console.log(e.detail.value)}
        />
      </Modal>
    </>
  );
}
```

### Vue 3

```vue
<script setup>
import { HollowButton, HollowInput, HollowModal } from '@philjs/hollow/vue';
import { ref } from 'vue';

const open = ref(false);
const email = ref('');
</script>

<template>
  <HollowButton
    variant="primary"
    @hollow-click="open = true"
  >
    Open Modal
  </HollowButton>

  <HollowModal
    :open="open"
    @hollow-close="open = false"
    size="md"
  >
    <HollowInput
      type="email"
      :value="email"
      @hollow-input="email = $event.detail.value"
    />
  </HollowModal>
</template>
```

### Vue Plugin

```ts
import { createApp } from 'vue';
import { HollowPlugin } from '@philjs/hollow/vue';

const app = createApp(App);
app.use(HollowPlugin);
app.mount('#app');
```

### Svelte

```svelte
<script>
  import { hollow, hollowButton, hollowModal } from '@philjs/hollow/svelte';

  let open = false;
</script>

<hollow-button
  use:hollowButton={{
    variant: 'primary',
    onClick: () => open = true
  }}
>
  Open Modal
</hollow-button>

<hollow-modal
  use:hollowModal={{
    open,
    onClose: () => open = false
  }}
>
  <hollow-input
    use:hollow={{
      type: 'email',
      placeholder: 'Enter email'
    }}
  />
</hollow-modal>
```

### PhilJS Native

```tsx
import { Button, Input, Modal, Select } from '@philjs/hollow/philjs';
import { signal } from '@philjs/core';

function App() {
  const open = signal(false);
  const email = signal('');

  return (
    <>
      <Button
        variant="primary"
        onClick={() => open.set(true)}
      >
        Open Modal
      </Button>

      <Modal
        open={() => open()}
        onClose={() => open.set(false)}
      >
        <Input
          value={() => email()}
          onInput={(e) => email.set(e.value)}
        />
      </Modal>
    </>
  );
}
```

## Components

### Button

A versatile button component with multiple variants and states.

```html
<hollow-button
  variant="primary|secondary|outline|ghost|link|destructive"
  size="sm|md|lg|xl"
  disabled
  loading
  type="button|submit|reset"
>
  Button Text
</hollow-button>
```

**Events:**
- `hollow-click`: Fired when button is clicked

### Input

A text input with validation and error states.

```html
<hollow-input
  variant="default|filled|flushed|unstyled"
  size="sm|md|lg"
  type="text|email|password|number|tel|url|search|date|time"
  value="initial value"
  placeholder="Enter text..."
  disabled
  readonly
  required
  minlength="3"
  maxlength="100"
  pattern="[A-Za-z]+"
  name="fieldName"
  error="Validation error message"
/>
```

**Events:**
- `hollow-input`: Fired on each input change
- `hollow-change`: Fired when input loses focus

### Card

A container component for grouping content.

```html
<hollow-card
  variant="default|elevated|outlined|filled"
  padding="none|sm|md|lg|xl"
  interactive
  selected
>
  <div slot="header">Card Header</div>
  Card content
  <div slot="footer">Card Footer</div>
</hollow-card>
```

**Events:**
- `hollow-click`: Fired when interactive card is clicked

### Modal

A dialog component with backdrop and animations.

```html
<hollow-modal
  open
  size="sm|md|lg|xl|full"
  animation="scale|fade|slide|none"
  closable
  close-on-backdrop
  close-on-escape
  persistent
>
  <div slot="header">Modal Title</div>
  Modal content
  <div slot="footer">Modal Actions</div>
</hollow-modal>
```

**Events:**
- `hollow-open`: Fired when modal opens
- `hollow-close`: Fired when modal closes

**Methods:**
- `open()`: Open the modal
- `close()`: Close the modal

### Select

A dropdown select component with search and multi-select support.

```html
<hollow-select
  variant="default|filled|flushed"
  size="sm|md|lg"
  value="selected-value"
  placeholder="Select an option..."
  disabled
  required
  searchable
  clearable
  multiple
  options='[{"value":"a","label":"Option A"},{"value":"b","label":"Option B"}]'
  name="fieldName"
  error="Error message"
/>
```

**Events:**
- `hollow-change`: Fired when selection changes
- `hollow-toggle`: Fired when dropdown opens/closes

**Methods:**
- `open()`: Open the dropdown
- `close()`: Close the dropdown
- `clear()`: Clear the selection

### Checkbox

A checkbox with indeterminate state support.

```html
<hollow-checkbox
  variant="default|primary|success|warning|error"
  size="sm|md|lg"
  checked
  indeterminate
  disabled
  required
  name="fieldName"
  value="checkbox-value"
>
  Label text
</hollow-checkbox>
```

**Events:**
- `hollow-change`: Fired when checked state changes

**Methods:**
- `toggle()`: Toggle the checkbox
- `setChecked(boolean)`: Set checked state
- `setIndeterminate(boolean)`: Set indeterminate state

### Switch

An iOS-style toggle switch.

```html
<hollow-switch
  variant="default|primary|success|warning|error"
  size="sm|md|lg"
  checked
  disabled
  required
  name="fieldName"
  value="switch-value"
  label-on="ON"
  label-off="OFF"
>
  Enable feature
</hollow-switch>
```

**Events:**
- `hollow-change`: Fired when switch state changes

**Methods:**
- `toggle()`: Toggle the switch
- `setChecked(boolean)`: Set checked state

### Tabs

A tabbed navigation component.

```html
<hollow-tabs
  variant="default|pills|underline|enclosed"
  size="sm|md|lg"
  active="tab1"
  alignment="start|center|end|stretch"
  tabs='[{"id":"tab1","label":"Tab 1"},{"id":"tab2","label":"Tab 2"}]'
>
  <div slot="tab1">Tab 1 content</div>
  <div slot="tab2">Tab 2 content</div>
</hollow-tabs>
```

**Events:**
- `hollow-change`: Fired when active tab changes

**Methods:**
- `selectTab(id)`: Select a tab by ID
- `getActiveTab()`: Get the active tab ID
- `setTabs(tabs)`: Set tabs programmatically

### Accordion

Collapsible sections with smooth animations.

```html
<hollow-accordion
  variant="default|bordered|separated|ghost"
  multiple
  collapsible
  expanded="item1,item2"
  items='[{"id":"item1","title":"Section 1"},{"id":"item2","title":"Section 2"}]'
>
  <div slot="item1">Content 1</div>
  <div slot="item2">Content 2</div>
</hollow-accordion>
```

**Events:**
- `hollow-change`: Fired when expansion state changes

**Methods:**
- `toggleItem(id)`: Toggle an item
- `expand(id)`: Expand an item
- `collapse(id)`: Collapse an item
- `expandAll()`: Expand all items (multiple mode only)
- `collapseAll()`: Collapse all items
- `getExpandedItems()`: Get expanded item IDs
- `isExpanded(id)`: Check if item is expanded

## Styling

### CSS Custom Properties

All components use CSS custom properties for theming:

```css
:root {
  /* Colors */
  --hollow-color-primary: #3b82f6;
  --hollow-color-primary-foreground: #ffffff;
  --hollow-color-secondary: #f1f5f9;
  --hollow-color-secondary-foreground: #0f172a;
  --hollow-color-success: #22c55e;
  --hollow-color-warning: #f59e0b;
  --hollow-color-error: #ef4444;
  --hollow-color-text: #0f172a;
  --hollow-color-text-muted: #64748b;
  --hollow-color-background: #ffffff;
  --hollow-color-border: #e2e8f0;
  --hollow-color-ring: #3b82f680;

  /* Typography */
  --hollow-font-family: system-ui, sans-serif;
  --hollow-font-size-sm: 0.875rem;
  --hollow-font-size-md: 1rem;
  --hollow-font-size-lg: 1.125rem;
  --hollow-font-weight-medium: 500;
  --hollow-font-weight-semibold: 600;

  /* Spacing */
  --hollow-spacing-1: 0.25rem;
  --hollow-spacing-2: 0.5rem;
  --hollow-spacing-3: 0.75rem;
  --hollow-spacing-4: 1rem;

  /* Border Radius */
  --hollow-radius-sm: 0.25rem;
  --hollow-radius-md: 0.375rem;
  --hollow-radius-lg: 0.5rem;

  /* Shadows */
  --hollow-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --hollow-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);

  /* Transitions */
  --hollow-transition-fast: 100ms;
  --hollow-transition-normal: 200ms;
  --hollow-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### CSS Parts

Style component internals using `::part()`:

```css
hollow-button::part(button) {
  text-transform: uppercase;
}

hollow-input::part(input) {
  border-width: 2px;
}

hollow-modal::part(backdrop) {
  background: rgba(0, 0, 0, 0.8);
}

hollow-modal::part(container) {
  border-radius: 16px;
}
```

### Dark Mode

Override CSS custom properties for dark mode:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --hollow-color-text: #f8fafc;
    --hollow-color-text-muted: #94a3b8;
    --hollow-color-background: #0f172a;
    --hollow-color-background-muted: #1e293b;
    --hollow-color-border: #334155;
  }
}
```

### Tailwind CSS Integration

Use with Tailwind by targeting the parts:

```html
<hollow-button class="[&::part(button)]:rounded-full [&::part(button)]:uppercase">
  Styled Button
</hollow-button>
```

## Framework Integration

### React - useRef Access

```tsx
import { useRef, useEffect } from 'react';

function App() {
  const modalRef = useRef<HTMLElement>(null);

  const openModal = () => {
    (modalRef.current as any)?.open();
  };

  return (
    <>
      <Button onClick={openModal}>Open</Button>
      <Modal ref={modalRef}>Content</Modal>
    </>
  );
}
```

### Vue - Template Refs

```vue
<script setup>
import { ref } from 'vue';

const modalRef = ref(null);

const openModal = () => {
  modalRef.value?.open();
};
</script>

<template>
  <HollowButton @hollow-click="openModal">Open</HollowButton>
  <HollowModal ref="modalRef">Content</HollowModal>
</template>
```

### Svelte - bind:this

```svelte
<script>
  let modalElement;

  const openModal = () => {
    modalElement?.open();
  };
</script>

<hollow-button on:hollow-click={openModal}>Open</hollow-button>
<hollow-modal bind:this={modalElement}>Content</hollow-modal>
```

### PhilJS - useHollowRef

```tsx
import { useHollowRef } from '@philjs/hollow/philjs';

function App() {
  const modalRef = useHollowRef();

  return (
    <>
      <Button onClick={() => modalRef.current?.open()}>
        Open
      </Button>
      <Modal ref={modalRef.set}>Content</Modal>
    </>
  );
}
```

## Form Integration

All form components support native form association:

```html
<form id="myForm">
  <hollow-input name="email" required />
  <hollow-checkbox name="agree" value="yes" required>
    I agree to terms
  </hollow-checkbox>
  <hollow-select name="country" options='[...]' required />
  <hollow-button type="submit">Submit</hollow-button>
</form>

<script>
  document.getElementById('myForm').addEventListener('submit', (e) => {
    const formData = new FormData(e.target);
    console.log(Object.fromEntries(formData));
  });
</script>
```

## Accessibility

All components follow WAI-ARIA guidelines:

- Proper ARIA roles and attributes
- Keyboard navigation support
- Focus management
- Screen reader announcements

### Keyboard Shortcuts

| Component | Key | Action |
|-----------|-----|--------|
| Button | Enter, Space | Activate |
| Modal | Escape | Close |
| Select | Arrow Up/Down | Navigate options |
| Select | Enter | Select option |
| Select | Escape | Close dropdown |
| Tabs | Arrow Left/Right | Navigate tabs |
| Tabs | Home/End | First/last tab |
| Accordion | Arrow Up/Down | Navigate items |
| Checkbox | Space | Toggle |
| Switch | Space, Enter | Toggle |

## API Reference

### React Wrappers

```ts
import {
  Button, Input, Card, Modal,
  Select, Checkbox, Switch, Tabs,
  Accordion, AccordionItem,
  useHollowEvent
} from '@philjs/hollow/react';
```

### Vue Wrappers

```ts
import {
  HollowButton, HollowInput, HollowCard, HollowModal,
  HollowSelect, HollowCheckbox, HollowSwitch, HollowTabs,
  HollowAccordion, HollowAccordionItem,
  vHollowProps, HollowPlugin
} from '@philjs/hollow/vue';
```

### Svelte Actions

```ts
import {
  hollow, hollowButton, hollowInput, hollowCard,
  hollowModal, hollowSelect, hollowCheckbox, hollowSwitch,
  hollowTabs, hollowAccordion, hollowAccordionItem,
  createHollowStore, onHollowEvent
} from '@philjs/hollow/svelte';
```

### PhilJS Bindings

```ts
import {
  Button, Input, Card, Modal,
  Select, Checkbox, Switch, Tabs,
  Accordion, AccordionItem,
  bindProp, useHollowRef, hollowProps
} from '@philjs/hollow/philjs';
```

### Design Tokens

```ts
import {
  tokens, colors, typography, spacing,
  borderRadius, shadows, transitions, zIndex,
  designTokensCSS, createTheme
} from '@philjs/hollow/tokens';
```

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Requires native Custom Elements and Shadow DOM support.

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./react, ./vue, ./svelte, ./components, ./styles, ./philjs, ./core
- Source files: packages/philjs-hollow/src/index.ts, packages/philjs-hollow/src/components/index.ts, packages/philjs-hollow/src/styles/index.ts, packages/philjs-hollow/src/core/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: AccordionItem, AccordionVariant, ButtonSize, ButtonVariant, CardPadding, CardVariant, CheckboxSize, CheckboxVariant, HollowAccordion, HollowAccordionItem, HollowButton, HollowCard, HollowCheckbox, HollowElement, HollowInput, HollowModal, HollowSelect, HollowSwitch, HollowTab, HollowTabList, HollowTabPanel, HollowTabs, InputSize, InputType, InputVariant, ModalAnimation, ModalSize, PropertyOptions, SelectOption, SelectSize, SelectVariant, SwitchSize, SwitchVariant, TabDefinition, TabsAlignment, TabsSize, TabsVariant, borderRadius, colors, createTheme, defineElement, designTokensCSS, philjs, property, react, shadows, spacing, svelte, tokens, transitions, typography, vue, zIndex
- Re-exported modules: ./accordion.js, ./base-element.js, ./button.js, ./card.js, ./checkbox.js, ./components/button.js, ./components/card.js, ./components/input.js, ./core/base-element.js, ./input.js, ./modal.js, ./select.js, ./styles/tokens.js, ./switch.js, ./tabs.js, ./tokens.js, ./wrappers/philjs.js, ./wrappers/react.js, ./wrappers/svelte.js, ./wrappers/vue.js
<!-- API_SNAPSHOT_END -->

## License

MIT
