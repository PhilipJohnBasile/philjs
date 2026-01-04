# Overlay Components

PhilJS UI provides overlay components for dialogs, side panels, tooltips, and dropdown menus.

## Modal

Dialog window component with focus trapping and accessibility support.

```tsx
import { signal } from '@philjs/core';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@philjs/ui';

function ModalExample() {
  const isOpen = signal(false);

  return (
    <>
      <Button onClick={() => isOpen.set(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen()}
        onClose={() => isOpen.set(false)}
        title="Modal Title"
      >
        <p>Modal content goes here.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => isOpen.set(false)}>
            Cancel
          </Button>
          <Button color="primary">Confirm</Button>
        </div>
      </Modal>
    </>
  );
}
```

### Modal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Control visibility |
| `onClose` | `() => void` | required | Close callback |
| `children` | `JSX.Element[]` | required | Modal content |
| `title` | `string` | - | Header title |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal width |
| `closeOnOverlay` | `boolean` | `true` | Close on overlay click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `showCloseButton` | `boolean` | `true` | Show X button |
| `initialFocus` | `HTMLElement` | - | Element to focus on open |
| `className` | `string` | - | Modal content classes |
| `overlayClassName` | `string` | - | Overlay classes |
| `aria-label` | `string` | - | Accessible label |
| `aria-describedby` | `string` | - | Description element ID |

### Modal Sizes

```tsx
<Modal size="sm" isOpen={isOpen()} onClose={close}>
  Small modal (max-width: 24rem)
</Modal>

<Modal size="md" isOpen={isOpen()} onClose={close}>
  Medium modal (max-width: 28rem)
</Modal>

<Modal size="lg" isOpen={isOpen()} onClose={close}>
  Large modal (max-width: 32rem)
</Modal>

<Modal size="xl" isOpen={isOpen()} onClose={close}>
  Extra large modal (max-width: 36rem)
</Modal>

<Modal size="full" isOpen={isOpen()} onClose={close}>
  Full width modal
</Modal>
```

### Modal with Compound Components

```tsx
<Modal isOpen={isOpen()} onClose={close}>
  <ModalHeader>
    <h2 className="text-lg font-semibold">Edit Profile</h2>
  </ModalHeader>
  <ModalBody>
    <Input label="Name" value={name()} onInput={setName} />
    <Input label="Email" value={email()} onInput={setEmail} />
  </ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={close}>Cancel</Button>
    <Button color="primary" onClick={save}>Save Changes</Button>
  </ModalFooter>
</Modal>
```

## ConfirmDialog

Pre-built confirmation dialog for common use cases.

```tsx
import { ConfirmDialog } from '@philjs/ui';

function DeleteButton() {
  const showConfirm = signal(false);

  const handleDelete = () => {
    deleteItem();
    showConfirm.set(false);
  };

  return (
    <>
      <Button color="error" onClick={() => showConfirm.set(true)}>
        Delete
      </Button>

      <ConfirmDialog
        isOpen={showConfirm()}
        onClose={() => showConfirm.set(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
```

### ConfirmDialog Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Control visibility |
| `onClose` | `() => void` | required | Close/cancel callback |
| `onConfirm` | `() => void` | required | Confirm callback |
| `title` | `string` | required | Dialog title |
| `message` | `string` | required | Confirmation message |
| `confirmText` | `string` | `'Confirm'` | Confirm button text |
| `cancelText` | `string` | `'Cancel'` | Cancel button text |
| `variant` | `'info' \| 'warning' \| 'danger'` | `'info'` | Button color variant |

## Drawer

Slide-out panel from any edge of the screen.

```tsx
import { signal } from '@philjs/core';
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter, Button } from '@philjs/ui';

function DrawerExample() {
  const isOpen = signal(false);

  return (
    <>
      <Button onClick={() => isOpen.set(true)}>Open Drawer</Button>

      <Drawer
        isOpen={isOpen()}
        onClose={() => isOpen.set(false)}
        placement="right"
        title="Settings"
      >
        <DrawerBody>
          <p>Drawer content here</p>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" onClick={() => isOpen.set(false)}>
            Cancel
          </Button>
          <Button color="primary">Save</Button>
        </DrawerFooter>
      </Drawer>
    </>
  );
}
```

### Drawer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Control visibility |
| `onClose` | `() => void` | required | Close callback |
| `children` | `JSX.Element[]` | required | Drawer content |
| `placement` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | Slide direction |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Drawer size |
| `title` | `string` | - | Header title |
| `showCloseButton` | `boolean` | `true` | Show X button |
| `closeOnOverlay` | `boolean` | `true` | Close on overlay click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `className` | `string` | - | Drawer panel classes |
| `overlayClassName` | `string` | - | Overlay classes |

### Drawer Placements

```tsx
// Right (default)
<Drawer placement="right" isOpen={isOpen()} onClose={close}>
  Slides in from right
</Drawer>

// Left
<Drawer placement="left" isOpen={isOpen()} onClose={close}>
  Slides in from left
</Drawer>

// Top
<Drawer placement="top" isOpen={isOpen()} onClose={close}>
  Slides down from top
</Drawer>

// Bottom
<Drawer placement="bottom" isOpen={isOpen()} onClose={close}>
  Slides up from bottom
</Drawer>
```

### Drawer Sizes

```tsx
// Width sizes (for left/right placement)
<Drawer placement="right" size="xs">256px width</Drawer>
<Drawer placement="right" size="sm">320px width</Drawer>
<Drawer placement="right" size="md">384px width</Drawer>
<Drawer placement="right" size="lg">512px width</Drawer>
<Drawer placement="right" size="xl">640px width</Drawer>
<Drawer placement="right" size="full">Full width</Drawer>

// Height sizes (for top/bottom placement)
<Drawer placement="bottom" size="xs">128px height</Drawer>
<Drawer placement="bottom" size="sm">192px height</Drawer>
<Drawer placement="bottom" size="md">256px height</Drawer>
<Drawer placement="bottom" size="lg">384px height</Drawer>
```

## Tooltip

Hover information tooltip with various placements.

```tsx
import { Tooltip } from '@philjs/ui';

// Basic tooltip
<Tooltip content="This is helpful information">
  <Button>Hover me</Button>
</Tooltip>

// Different placements
<Tooltip content="Top tooltip" placement="top">
  <Button>Top</Button>
</Tooltip>

<Tooltip content="Bottom tooltip" placement="bottom">
  <Button>Bottom</Button>
</Tooltip>

<Tooltip content="Left tooltip" placement="left">
  <Button>Left</Button>
</Tooltip>

<Tooltip content="Right tooltip" placement="right">
  <Button>Right</Button>
</Tooltip>

// With delay
<Tooltip content="Appears after 500ms" delay={500}>
  <Button>Delayed</Button>
</Tooltip>

// Without arrow
<Tooltip content="No arrow" arrow={false}>
  <Button>Hover</Button>
</Tooltip>

// Disabled
<Tooltip content="Won't show" disabled>
  <Button>Disabled tooltip</Button>
</Tooltip>
```

### Tooltip Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string \| JSX.Element` | required | Tooltip content |
| `children` | `JSX.Element` | required | Trigger element |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Position |
| `delay` | `number` | `0` | Show delay in ms |
| `disabled` | `boolean` | `false` | Disable tooltip |
| `arrow` | `boolean` | `true` | Show arrow |
| `className` | `string` | - | Tooltip classes |

## Popover

Interactive popover with click trigger and custom content.

```tsx
import { Popover, Button } from '@philjs/ui';

// Basic popover
<Popover
  trigger={<Button>Open Popover</Button>}
  placement="bottom"
>
  <h3 className="font-semibold mb-2">Popover Title</h3>
  <p className="text-sm text-gray-600">
    This is the popover content. It can contain any elements.
  </p>
</Popover>

// Controlled popover
function ControlledPopover() {
  const isOpen = signal(false);

  return (
    <Popover
      trigger={<Button>Controlled</Button>}
      isOpen={isOpen()}
      onOpenChange={isOpen.set}
    >
      <p>Controlled content</p>
      <Button size="sm" onClick={() => isOpen.set(false)}>
        Close
      </Button>
    </Popover>
  );
}
```

### Popover Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `trigger` | `JSX.Element` | required | Trigger element |
| `children` | `JSX.Element` | required | Popover content |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Position |
| `isOpen` | `boolean` | - | Controlled open state |
| `onOpenChange` | `(isOpen: boolean) => void` | - | Open change callback |
| `closeOnClickOutside` | `boolean` | `true` | Close on outside click |
| `className` | `string` | - | Popover classes |

## Dropdown

Dropdown menu with items, dividers, and labels.

```tsx
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel, Button } from '@philjs/ui';

<Dropdown
  trigger={<Button>Actions</Button>}
>
  <DropdownLabel>Actions</DropdownLabel>
  <DropdownItem onClick={handleEdit} icon={<EditIcon />}>
    Edit
  </DropdownItem>
  <DropdownItem onClick={handleDuplicate} icon={<CopyIcon />}>
    Duplicate
  </DropdownItem>
  <DropdownDivider />
  <DropdownItem onClick={handleDelete} danger icon={<TrashIcon />}>
    Delete
  </DropdownItem>
</Dropdown>
```

### Dropdown Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `trigger` | `JSX.Element` | required | Trigger element |
| `children` | `JSX.Element[]` | required | Dropdown items |
| `placement` | `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end'` | `'bottom-start'` | Position |
| `isOpen` | `boolean` | - | Controlled open state |
| `onOpenChange` | `(isOpen: boolean) => void` | - | Open change callback |
| `closeOnSelect` | `boolean` | `true` | Close on item click |
| `className` | `string` | - | Menu classes |

### DropdownItem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element \| string` | required | Item content |
| `onClick` | `() => void` | - | Click handler |
| `disabled` | `boolean` | `false` | Disable item |
| `icon` | `JSX.Element` | - | Item icon |
| `danger` | `boolean` | `false` | Danger/destructive style |
| `className` | `string` | - | Item classes |

### Dropdown Placements

```tsx
// Bottom left (default)
<Dropdown placement="bottom-start">...</Dropdown>

// Bottom right
<Dropdown placement="bottom-end">...</Dropdown>

// Top left
<Dropdown placement="top-start">...</Dropdown>

// Top right
<Dropdown placement="top-end">...</Dropdown>
```

## Common Patterns

### Edit Form Modal

```tsx
function EditUserModal({ user, isOpen, onClose }) {
  const name = signal(user.name);
  const email = signal(user.email);
  const saving = signal(false);

  const handleSave = async () => {
    saving.set(true);
    try {
      await updateUser({ name: name(), email: email() });
      toast.success({ title: 'User updated!' });
      onClose();
    } catch (error) {
      toast.error({ title: 'Failed to update user' });
    } finally {
      saving.set(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <Input label="Name" value={name()} onInput={e => name.set(e.target.value)} />
      <Input label="Email" value={email()} onInput={e => email.set(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button color="primary" onClick={handleSave} loading={saving()}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
```

### Settings Drawer

```tsx
function SettingsDrawer({ isOpen, onClose }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Settings" size="md">
      <DrawerBody>
        <div className="space-y-4">
          <Switch label="Notifications" />
          <Switch label="Dark Mode" />
          <Select
            label="Language"
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' }
            ]}
          />
        </div>
      </DrawerBody>
      <DrawerFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button color="primary">Save Settings</Button>
      </DrawerFooter>
    </Drawer>
  );
}
```

### Action Menu

```tsx
function ActionMenu({ item }) {
  return (
    <Dropdown
      trigger={
        <IconButton icon={<MoreVerticalIcon />} aria-label="Actions" variant="ghost" />
      }
      placement="bottom-end"
    >
      <DropdownItem onClick={() => handleView(item)} icon={<EyeIcon />}>
        View
      </DropdownItem>
      <DropdownItem onClick={() => handleEdit(item)} icon={<EditIcon />}>
        Edit
      </DropdownItem>
      <DropdownItem onClick={() => handleShare(item)} icon={<ShareIcon />}>
        Share
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem onClick={() => handleDelete(item)} danger icon={<TrashIcon />}>
        Delete
      </DropdownItem>
    </Dropdown>
  );
}
```

### Info Tooltip

```tsx
<div className="flex items-center gap-2">
  <label>API Key</label>
  <Tooltip content="Your API key is used to authenticate requests. Keep it secret!">
    <span className="text-gray-400 cursor-help">
      <InfoIcon className="w-4 h-4" />
    </span>
  </Tooltip>
</div>
```

### Confirmation Popover

```tsx
function DeletePopover({ onDelete }) {
  const isOpen = signal(false);

  return (
    <Popover
      trigger={
        <Button variant="ghost" color="error" size="sm">
          Delete
        </Button>
      }
      isOpen={isOpen()}
      onOpenChange={isOpen.set}
    >
      <p className="text-sm mb-3">Are you sure you want to delete?</p>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => isOpen.set(false)}>
          Cancel
        </Button>
        <Button size="sm" color="error" onClick={() => { onDelete(); isOpen.set(false); }}>
          Delete
        </Button>
      </div>
    </Popover>
  );
}
```

## Accessibility

### Modal Accessibility

- Uses `role="dialog"` and `aria-modal="true"`
- Title linked via `aria-labelledby`
- Focus trapped within modal
- Escape key closes modal
- Focus returns to trigger on close
- Body scroll is locked when open

### Drawer Accessibility

- Uses `role="dialog"` and `aria-modal="true"`
- Escape key closes drawer
- Focus management similar to Modal
- Smooth slide animation

### Tooltip Accessibility

- Uses `role="tooltip"`
- Appears on focus as well as hover
- Not interactive (use Popover for interactive content)
- Content announced to screen readers

### Dropdown Accessibility

- Uses `role="menu"` and `role="menuitem"`
- Keyboard navigation with arrow keys
- Enter/Space activates items
- Escape closes menu
- Focus returns to trigger on close

## Keyboard Navigation

| Component | Key | Action |
|-----------|-----|--------|
| Modal/Drawer | `Escape` | Close |
| Modal/Drawer | `Tab` | Navigate focusable elements |
| Modal/Drawer | `Shift+Tab` | Navigate backwards |
| Dropdown | `Enter/Space` | Open/select item |
| Dropdown | `Arrow Down` | Next item |
| Dropdown | `Arrow Up` | Previous item |
| Dropdown | `Escape` | Close |
| Popover | `Enter/Space` | Toggle |
| Popover | `Escape` | Close |
