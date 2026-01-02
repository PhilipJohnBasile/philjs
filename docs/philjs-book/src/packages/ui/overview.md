# @philjs/ui - Component Library

The `@philjs/ui` package provides a comprehensive set of accessible, customizable UI components built with PhilJS signals and modern CSS.

## Installation

```bash
npm install @philjs/ui
# or
pnpm add @philjs/ui
# or
bun add @philjs/ui
```

## Features

- **40+ Components** - Buttons, forms, modals, tables, and more
- **Accessible by Default** - WCAG 2.1 AA compliant
- **Themeable** - CSS variables and design tokens
- **Tree-Shakeable** - Import only what you use
- **TypeScript First** - Full type safety
- **Headless Options** - Unstyled variants available

## Quick Start

```tsx
import { Button, Card, Input, Modal, toast } from '@philjs/ui';

function App() {
  const isOpen = signal(false);

  return (
    <div>
      <Card>
        <Card.Header>
          <Card.Title>Welcome</Card.Title>
        </Card.Header>
        <Card.Content>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
          />
          <Button onClick={() => isOpen.set(true)}>
            Open Modal
          </Button>
        </Card.Content>
      </Card>

      <Modal open={isOpen()} onClose={() => isOpen.set(false)}>
        <Modal.Header>Confirmation</Modal.Header>
        <Modal.Body>Are you sure?</Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={() => isOpen.set(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            toast.success('Confirmed!');
            isOpen.set(false);
          }}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
```

## Component Categories

### Layout

```tsx
import {
  Box,
  Container,
  Flex,
  Grid,
  Stack,
  Divider,
  AspectRatio,
  Center
} from '@philjs/ui';

// Flexbox layout
<Flex gap={4} align="center" justify="between">
  <Logo />
  <Nav />
  <UserMenu />
</Flex>

// Grid layout
<Grid cols={3} gap={4}>
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</Grid>

// Stack (vertical)
<Stack gap={2}>
  <Input label="Name" />
  <Input label="Email" />
  <Button>Submit</Button>
</Stack>

// Container with max-width
<Container size="lg" padding={4}>
  <Content />
</Container>
```

### Forms

```tsx
import {
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  Slider,
  DatePicker,
  TimePicker,
  FileUpload,
  FormField,
  FormLabel,
  FormError
} from '@philjs/ui';

// Text input with all states
<Input
  label="Username"
  placeholder="Enter username"
  helperText="Must be 3-20 characters"
  error={errors.username}
  required
  leftIcon={<UserIcon />}
  rightElement={<CheckIcon />}
/>

// Select with search
<Select
  label="Country"
  options={countries}
  searchable
  placeholder="Select a country"
  onChange={setCountry}
/>

// Checkbox group
<Checkbox.Group
  label="Interests"
  options={['Sports', 'Music', 'Art', 'Technology']}
  value={interests()}
  onChange={setInterests}
/>

// File upload with drag & drop
<FileUpload
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  multiple
  onUpload={handleUpload}
  onError={handleError}
>
  <FileUpload.Dropzone>
    <p>Drag files here or click to upload</p>
  </FileUpload.Dropzone>
  <FileUpload.List />
</FileUpload>
```

### Buttons

```tsx
import { Button, IconButton, ButtonGroup } from '@philjs/ui';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="danger">Danger</Button>

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Loading</Button>
<Button disabled>Disabled</Button>

// With icons
<Button leftIcon={<PlusIcon />}>Add Item</Button>
<Button rightIcon={<ArrowIcon />}>Continue</Button>

// Icon button
<IconButton
  icon={<TrashIcon />}
  aria-label="Delete"
  variant="ghost"
/>

// Button group
<ButtonGroup>
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>
```

### Feedback

```tsx
import {
  Alert,
  Toast,
  toast,
  Progress,
  Spinner,
  Skeleton,
  Badge,
  Tag
} from '@philjs/ui';

// Alert
<Alert status="success" title="Success!">
  Your changes have been saved.
</Alert>

<Alert status="error" closable onClose={dismiss}>
  Something went wrong. Please try again.
</Alert>

// Toast notifications
toast.success('Item saved successfully');
toast.error('Failed to save');
toast.info('New message received');
toast.warning('Low disk space');
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save'
});

// Progress
<Progress value={progress()} max={100} />
<Progress indeterminate />

// Spinner
<Spinner size="lg" />
<Spinner label="Loading data..." />

// Skeleton
<Skeleton height={20} />
<Skeleton.Text lines={3} />
<Skeleton.Avatar size="lg" />
<Skeleton.Card />

// Badge
<Badge>New</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning" dot>Pending</Badge>

// Tag
<Tag>React</Tag>
<Tag closable onClose={removeTag}>TypeScript</Tag>
```

### Overlays

```tsx
import {
  Modal,
  Drawer,
  Dialog,
  Popover,
  Tooltip,
  Menu,
  DropdownMenu,
  ContextMenu
} from '@philjs/ui';

// Modal
<Modal
  open={isOpen()}
  onClose={() => isOpen.set(false)}
  size="md"
  closeOnOverlayClick
  closeOnEscape
>
  <Modal.Header>Edit Profile</Modal.Header>
  <Modal.Body>
    <Form />
  </Modal.Body>
  <Modal.Footer>
    <Button variant="ghost" onClick={close}>Cancel</Button>
    <Button onClick={save}>Save</Button>
  </Modal.Footer>
</Modal>

// Drawer
<Drawer
  open={drawerOpen()}
  onClose={() => drawerOpen.set(false)}
  placement="right"
  size="md"
>
  <Drawer.Header>Settings</Drawer.Header>
  <Drawer.Body>
    <SettingsForm />
  </Drawer.Body>
</Drawer>

// Tooltip
<Tooltip content="More information">
  <IconButton icon={<InfoIcon />} />
</Tooltip>

// Popover
<Popover>
  <Popover.Trigger>
    <Button>Open Popover</Button>
  </Popover.Trigger>
  <Popover.Content>
    <p>Popover content here</p>
  </Popover.Content>
</Popover>

// Dropdown menu
<DropdownMenu>
  <DropdownMenu.Trigger>
    <Button>Actions</Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item onSelect={edit}>Edit</DropdownMenu.Item>
    <DropdownMenu.Item onSelect={duplicate}>Duplicate</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onSelect={remove} variant="danger">
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>

// Context menu
<ContextMenu>
  <ContextMenu.Trigger>
    <div class="right-click-area">Right click here</div>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>Copy</ContextMenu.Item>
    <ContextMenu.Item>Paste</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu>
```

### Navigation

```tsx
import {
  Tabs,
  Breadcrumb,
  Pagination,
  Stepper,
  NavMenu,
  Sidebar
} from '@philjs/ui';

// Tabs
<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="analytics">Analytics</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview"><Overview /></Tabs.Panel>
  <Tabs.Panel value="analytics"><Analytics /></Tabs.Panel>
  <Tabs.Panel value="settings"><Settings /></Tabs.Panel>
</Tabs>

// Breadcrumb
<Breadcrumb>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/products">Products</Breadcrumb.Item>
  <Breadcrumb.Item current>Product Details</Breadcrumb.Item>
</Breadcrumb>

// Pagination
<Pagination
  total={100}
  pageSize={10}
  currentPage={page()}
  onChange={setPage}
  showSizeChanger
  showQuickJumper
/>

// Stepper
<Stepper activeStep={step()}>
  <Stepper.Step title="Account" description="Create account" />
  <Stepper.Step title="Profile" description="Set up profile" />
  <Stepper.Step title="Confirm" description="Review & confirm" />
</Stepper>
```

### Data Display

```tsx
import {
  Table,
  DataTable,
  List,
  Tree,
  Timeline,
  Avatar,
  AvatarGroup,
  Stat,
  Code,
  Kbd
} from '@philjs/ui';

// Data table with sorting, filtering, pagination
<DataTable
  data={users()}
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role', filterable: true },
    {
      key: 'actions',
      header: '',
      render: (row) => <ActionMenu user={row} />
    }
  ]}
  selectable
  onSelectionChange={setSelected}
  pagination={{ pageSize: 10 }}
/>

// Avatar
<Avatar src={user.avatar} name={user.name} size="lg" />
<AvatarGroup max={3}>
  {users.map(u => <Avatar key={u.id} src={u.avatar} />)}
</AvatarGroup>

// Stats
<Stat>
  <Stat.Label>Total Revenue</Stat.Label>
  <Stat.Number>$45,231</Stat.Number>
  <Stat.Change type="increase">12%</Stat.Change>
</Stat>

// Timeline
<Timeline>
  <Timeline.Item icon={<CheckIcon />} color="green">
    Order confirmed
  </Timeline.Item>
  <Timeline.Item icon={<TruckIcon />} color="blue">
    Shipped
  </Timeline.Item>
  <Timeline.Item icon={<PackageIcon />} pending>
    Delivered
  </Timeline.Item>
</Timeline>

// Code block
<Code language="tsx" showLineNumbers copyable>
  {codeString}
</Code>

// Keyboard shortcut
<Kbd>⌘</Kbd> + <Kbd>K</Kbd>
```

## Theming

### CSS Variables

```css
:root {
  /* Colors */
  --phil-primary: #3b82f6;
  --phil-secondary: #6b7280;
  --phil-success: #10b981;
  --phil-warning: #f59e0b;
  --phil-error: #ef4444;

  /* Typography */
  --phil-font-sans: 'Inter', sans-serif;
  --phil-font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --phil-space-1: 0.25rem;
  --phil-space-2: 0.5rem;
  --phil-space-4: 1rem;

  /* Radii */
  --phil-radius-sm: 0.25rem;
  --phil-radius-md: 0.375rem;
  --phil-radius-lg: 0.5rem;

  /* Shadows */
  --phil-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --phil-shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}

/* Dark mode */
[data-theme="dark"] {
  --phil-primary: #60a5fa;
  --phil-bg: #1f2937;
  --phil-text: #f9fafb;
}
```

### Theme Provider

```tsx
import { ThemeProvider, useTheme } from '@philjs/ui';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <MyApp />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
```

## Accessibility

All components are accessible by default:

- Proper ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader support
- High contrast mode support

```tsx
// Example: Accessible modal
<Modal>
  {/* Automatically handles:
    - role="dialog"
    - aria-modal="true"
    - aria-labelledby (linked to header)
    - aria-describedby (linked to body)
    - Focus trap
    - Escape to close
    - Return focus on close
  */}
</Modal>
```

## TypeScript

All components are fully typed:

```tsx
import type {
  ButtonProps,
  InputProps,
  ModalProps,
  SelectOption
} from '@philjs/ui';

// Props are fully typed
const buttonProps: ButtonProps = {
  variant: 'primary',
  size: 'md',
  loading: false,
  onClick: () => {}
};
```

## Next Steps

- [Theming Guide](./theming.md)
- [Accessibility](./accessibility.md)
- [Form Components](./forms.md)
- [Data Display](./data-display.md)
