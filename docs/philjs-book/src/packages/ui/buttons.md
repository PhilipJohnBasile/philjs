# Button Components

PhilJS UI provides flexible button components with multiple variants, sizes, colors, and states for all action needs.

## Button

The primary action component with support for variants, sizes, loading states, and icons.

```tsx
import { Button } from '@philjs/ui';

// Basic button
<Button>Click me</Button>

// With color
<Button color="primary">Primary</Button>
<Button color="success">Success</Button>
<Button color="error">Delete</Button>

// With icons
<Button leftIcon={<PlusIcon />}>Add Item</Button>
<Button rightIcon={<ArrowRightIcon />}>Continue</Button>

// Loading state
<Button loading>Saving...</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### Button Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element \| string` | required | Button content |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'link'` | `'solid'` | Visual style |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'primary'` | Color scheme |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading spinner |
| `fullWidth` | `boolean` | `false` | Full width button |
| `leftIcon` | `JSX.Element \| string` | - | Icon before text |
| `rightIcon` | `JSX.Element \| string` | - | Icon after text |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `onClick` | `(e: MouseEvent) => void` | - | Click handler |
| `className` | `string` | - | Additional CSS classes |
| `style` | `Record<string, string>` | - | Inline styles |
| `aria-label` | `string` | - | Accessibility label |

### Button Variants

```tsx
// Solid (default) - filled background
<Button variant="solid" color="primary">Solid</Button>

// Outline - bordered with transparent background
<Button variant="outline" color="primary">Outline</Button>

// Ghost - minimal, transparent until hover
<Button variant="ghost" color="primary">Ghost</Button>

// Link - looks like a text link
<Button variant="link" color="primary">Link</Button>
```

### Button Sizes

```tsx
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
```

### Button Colors

```tsx
// Primary - main actions
<Button color="primary">Primary</Button>

// Secondary - secondary actions
<Button color="secondary">Secondary</Button>

// Success - positive actions
<Button color="success">Success</Button>

// Warning - cautionary actions
<Button color="warning">Warning</Button>

// Error - destructive actions
<Button color="error">Delete</Button>

// Info - informational actions
<Button color="info">Info</Button>
```

### Button States

```tsx
// Disabled
<Button disabled>Disabled</Button>

// Loading with spinner
<Button loading>Saving...</Button>

// Loading replaces left icon
<Button loading leftIcon={<SaveIcon />}>
  Save
</Button>
```

### Button with Icons

```tsx
// Left icon
<Button leftIcon={<PlusIcon />}>
  Add Item
</Button>

// Right icon
<Button rightIcon={<ChevronRightIcon />}>
  Next Step
</Button>

// Both icons
<Button leftIcon={<DownloadIcon />} rightIcon={<ExternalLinkIcon />}>
  Download
</Button>
```

## IconButton

Button with only an icon, requiring an `aria-label` for accessibility.

```tsx
import { IconButton } from '@philjs/ui';

// Basic icon button
<IconButton
  icon={<TrashIcon />}
  aria-label="Delete item"
/>

// With variant and color
<IconButton
  icon={<EditIcon />}
  aria-label="Edit"
  variant="ghost"
  color="primary"
/>

// Different sizes
<IconButton icon={<MenuIcon />} aria-label="Menu" size="sm" />
<IconButton icon={<MenuIcon />} aria-label="Menu" size="md" />
<IconButton icon={<MenuIcon />} aria-label="Menu" size="lg" />

// In a toolbar
<div className="flex gap-2">
  <IconButton icon={<BoldIcon />} aria-label="Bold" variant="ghost" />
  <IconButton icon={<ItalicIcon />} aria-label="Italic" variant="ghost" />
  <IconButton icon={<UnderlineIcon />} aria-label="Underline" variant="ghost" />
</div>
```

### IconButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `JSX.Element \| string` | required | Icon element |
| `aria-label` | `string` | required | Accessibility label (required) |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'link'` | `'solid'` | Visual style |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'primary'` | Color scheme |
| `disabled` | `boolean` | `false` | Disable the button |
| `onClick` | `(e: MouseEvent) => void` | - | Click handler |

## ButtonGroup

Group multiple buttons together with optional attached styling.

```tsx
import { ButtonGroup, Button } from '@philjs/ui';

// Spaced button group
<ButtonGroup>
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>

// Attached button group (no gaps, joined borders)
<ButtonGroup attached>
  <Button>Day</Button>
  <Button>Week</Button>
  <Button>Month</Button>
</ButtonGroup>

// With different variants
<ButtonGroup attached>
  <Button variant="outline">Option 1</Button>
  <Button variant="outline">Option 2</Button>
  <Button variant="outline">Option 3</Button>
</ButtonGroup>

// Segmented control pattern
<ButtonGroup attached>
  <Button variant={view() === 'list' ? 'solid' : 'outline'} onClick={() => view.set('list')}>
    List
  </Button>
  <Button variant={view() === 'grid' ? 'solid' : 'outline'} onClick={() => view.set('grid')}>
    Grid
  </Button>
</ButtonGroup>
```

### ButtonGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element[]` | required | Button children |
| `attached` | `boolean` | `false` | Join buttons without gaps |
| `className` | `string` | - | Additional CSS classes |

## Common Patterns

### Form Submit Button

```tsx
<form onSubmit={handleSubmit}>
  {/* form fields */}
  <Button type="submit" color="primary" loading={isSubmitting()}>
    {isSubmitting() ? 'Submitting...' : 'Submit'}
  </Button>
</form>
```

### Delete Confirmation

```tsx
<Button
  color="error"
  variant="outline"
  onClick={handleDelete}
  disabled={isDeleting()}
  leftIcon={<TrashIcon />}
>
  Delete
</Button>
```

### Navigation Button

```tsx
<Button
  variant="ghost"
  rightIcon={<ChevronRightIcon />}
  onClick={() => router.push('/next')}
>
  Continue
</Button>
```

### Toolbar Actions

```tsx
<div className="flex items-center gap-2">
  <ButtonGroup>
    <IconButton icon={<UndoIcon />} aria-label="Undo" variant="ghost" />
    <IconButton icon={<RedoIcon />} aria-label="Redo" variant="ghost" />
  </ButtonGroup>

  <div className="w-px h-6 bg-gray-300" /> {/* divider */}

  <ButtonGroup attached>
    <Button variant="ghost" size="sm">B</Button>
    <Button variant="ghost" size="sm">I</Button>
    <Button variant="ghost" size="sm">U</Button>
  </ButtonGroup>
</div>
```

### Async Action with Feedback

```tsx
import { signal } from '@philjs/core';
import { Button, toast } from '@philjs/ui';

function SaveButton() {
  const saving = signal(false);

  const handleSave = async () => {
    saving.set(true);
    try {
      await saveData();
      toast.success({ title: 'Saved successfully!' });
    } catch (error) {
      toast.error({ title: 'Failed to save' });
    } finally {
      saving.set(false);
    }
  };

  return (
    <Button
      color="primary"
      loading={saving()}
      onClick={handleSave}
      leftIcon={<SaveIcon />}
    >
      {saving() ? 'Saving...' : 'Save'}
    </Button>
  );
}
```

## Accessibility

### Focus States

All buttons have visible focus indicators:
- Focus ring with offset for keyboard navigation
- High contrast focus styles

### Button Types

```tsx
// Form submission (navigates on Enter in form)
<Button type="submit">Submit</Button>

// Form reset
<Button type="reset" variant="ghost">Reset</Button>

// Regular button (default, no form behavior)
<Button type="button">Click</Button>
```

### Disabled vs Loading

```tsx
// Disabled - completely inactive
<Button disabled>Disabled</Button>

// Loading - shows activity, still technically disabled
<Button loading>Loading</Button>
```

### Aria Attributes

```tsx
// Custom aria-label for icon buttons
<IconButton
  icon={<CloseIcon />}
  aria-label="Close dialog"
/>

// Busy state during loading
<Button loading aria-busy="true">
  Saving...
</Button>

// Disabled state
<Button disabled aria-disabled="true">
  Unavailable
</Button>
```

## Styling

### Custom Colors via className

```tsx
<Button className="bg-purple-600 hover:bg-purple-700">
  Custom Purple
</Button>
```

### Full Width Buttons

```tsx
<div className="flex flex-col gap-2">
  <Button fullWidth color="primary">Sign In</Button>
  <Button fullWidth variant="outline">Create Account</Button>
</div>
```

### Button in Card Footer

```tsx
<Card>
  <CardBody>Content here</CardBody>
  <CardFooter divider>
    <Button variant="ghost">Cancel</Button>
    <Button color="primary">Save</Button>
  </CardFooter>
</Card>
```
