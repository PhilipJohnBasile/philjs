# Accessibility in @philjs/ui

PhilJS UI components ship with keyboard navigation, focus management, and sensible ARIA defaults.

## Focus and keyboard patterns

- Modals and drawers trap focus while open.
- Tabs, menus, and dropdowns expose consistent keyboard handling.
- Buttons and inputs follow native semantics.

## Example: Modal accessibility

```tsx
import { Modal, ModalHeader, ModalBody } from '@philjs/ui';

<Modal isOpen={open()} onClose={() => open.set(false)}>
  <ModalHeader>Delete item</ModalHeader>
  <ModalBody>Are you sure?</ModalBody>
</Modal>
```

## Example: Tooltip with labels

```tsx
import { Tooltip } from '@philjs/ui';

<Tooltip content="Billing details">
  <button aria-label="Billing">Billing</button>
</Tooltip>
```

## Tips

- Prefer visible focus styles in your theme.
- Validate color contrast using `@philjs/core/accessibility` audits.
