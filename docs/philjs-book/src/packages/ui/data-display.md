# Data Display Components

PhilJS UI provides components for displaying content, data, and user information.

## Card

Versatile container component for grouping related content.

```tsx
import { Card, CardHeader, CardTitle, CardBody, CardFooter, CardImage } from '@philjs/ui';

// Basic card
<Card>
  <CardBody>
    Simple card content
  </CardBody>
</Card>

// Card with all parts
<Card>
  <CardImage src="/image.jpg" alt="Card image" />
  <CardHeader>
    <CardTitle subtitle="Secondary text">Card Title</CardTitle>
  </CardHeader>
  <CardBody>
    Card content goes here. This can include text, images, or other components.
  </CardBody>
  <CardFooter divider>
    <Button variant="ghost">Cancel</Button>
    <Button color="primary">Save</Button>
  </CardFooter>
</Card>

// Hoverable card
<Card hoverable>
  <CardBody>Hover over me for shadow effect</CardBody>
</Card>

// Clickable card
<Card clickable onClick={handleClick}>
  <CardBody>Click me!</CardBody>
</Card>
```

### Card Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element[]` | required | Card content |
| `variant` | `'elevated' \| 'outlined' \| 'filled'` | `'elevated'` | Visual style |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |
| `hoverable` | `boolean` | `false` | Show hover shadow effect |
| `clickable` | `boolean` | `false` | Make entire card clickable |
| `onClick` | `() => void` | - | Click handler (when clickable) |
| `className` | `string` | - | Additional CSS classes |

### Card Variants

```tsx
// Elevated (default) - with shadow
<Card variant="elevated">
  Elevated card with shadow
</Card>

// Outlined - with border
<Card variant="outlined">
  Outlined card with border
</Card>

// Filled - with background
<Card variant="filled">
  Filled card with background
</Card>
```

### CardTitle Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element \| string` | required | Title text |
| `subtitle` | `string` | - | Subtitle text |
| `className` | `string` | - | Additional CSS classes |

### CardHeader with Action

```tsx
<Card>
  <CardHeader action={<IconButton icon={<MoreIcon />} aria-label="Options" />}>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardBody>...</CardBody>
</Card>
```

### CardImage Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | required | Image source |
| `alt` | `string` | required | Alt text |
| `position` | `'top' \| 'bottom'` | `'top'` | Image position |
| `className` | `string` | - | Additional CSS classes |

### CardFooter Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element[]` | required | Footer content |
| `divider` | `boolean` | `false` | Show top border |
| `className` | `string` | - | Additional CSS classes |

## Table

Data table component with sorting, selection, and responsive design.

```tsx
import { Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption, TableEmpty } from '@philjs/ui';

// Basic table
<Table>
  <Thead>
    <Tr>
      <Th>Name</Th>
      <Th>Email</Th>
      <Th>Role</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>John Doe</Td>
      <Td>john@example.com</Td>
      <Td>Admin</Td>
    </Tr>
    <Tr>
      <Td>Jane Smith</Td>
      <Td>jane@example.com</Td>
      <Td>User</Td>
    </Tr>
  </Tbody>
</Table>

// With sorting
<Table>
  <Thead>
    <Tr>
      <Th sortable sortDirection={sortDir()} onSort={() => toggleSort('name')}>
        Name
      </Th>
      <Th sortable sortDirection={null} onSort={() => toggleSort('email')}>
        Email
      </Th>
    </Tr>
  </Thead>
  <Tbody>
    {sortedData().map(row => (
      <Tr key={row.id}>
        <Td>{row.name}</Td>
        <Td>{row.email}</Td>
      </Tr>
    ))}
  </Tbody>
</Table>
```

### Table Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element[]` | required | Table sections |
| `variant` | `'simple' \| 'striped' \| 'unstyled'` | `'simple'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Cell padding |
| `hoverable` | `boolean` | `false` | Highlight rows on hover |
| `className` | `string` | - | Additional CSS classes |

### Table Variants

```tsx
// Simple (default) - basic dividers
<Table variant="simple">...</Table>

// Striped - alternating row colors
<Table variant="striped">...</Table>

// Unstyled - no default styling
<Table variant="unstyled">...</Table>
```

### Th Props (Table Header Cell)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element \| string` | - | Header content |
| `sortable` | `boolean` | `false` | Enable sorting |
| `sortDirection` | `'asc' \| 'desc' \| null` | `null` | Current sort direction |
| `onSort` | `() => void` | - | Sort handler |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment |
| `width` | `string \| number` | - | Column width |
| `className` | `string` | - | Additional CSS classes |

### Td Props (Table Data Cell)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element \| string` | - | Cell content |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment |
| `colSpan` | `number` | - | Column span |
| `rowSpan` | `number` | - | Row span |
| `className` | `string` | - | Additional CSS classes |

### Tr Props (Table Row)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element[]` | required | Row cells |
| `selected` | `boolean` | `false` | Highlight as selected |
| `onClick` | `(e: MouseEvent) => void` | - | Row click handler |
| `className` | `string` | - | Additional CSS classes |

### TableEmpty (No Data State)

```tsx
<Table>
  <Thead>
    <Tr>
      <Th>Name</Th>
      <Th>Email</Th>
      <Th>Role</Th>
    </Tr>
  </Thead>
  <Tbody>
    {data().length === 0 ? (
      <TableEmpty colSpan={3} message="No users found" />
    ) : (
      data().map(row => <Tr key={row.id}>...</Tr>)
    )}
  </Tbody>
</Table>
```

### TableCaption

```tsx
<Table>
  <TableCaption placement="top">List of team members</TableCaption>
  <Thead>...</Thead>
  <Tbody>...</Tbody>
  <TableCaption placement="bottom">Showing 10 of 100 users</TableCaption>
</Table>
```

## Avatar

User avatar component with image, initials fallback, and status indicator.

```tsx
import { Avatar, AvatarGroup, AvatarBadge } from '@philjs/ui';

// Basic avatar with image
<Avatar src="/user.jpg" alt="John Doe" />

// With name fallback (shows initials if image fails)
<Avatar src="/user.jpg" name="John Doe" />

// Initials only (no image)
<Avatar name="Jane Smith" />

// With status indicator
<Avatar name="John Doe" status="online" />
<Avatar name="Jane Smith" status="busy" />
<Avatar name="Bob Wilson" status="away" />
<Avatar name="Alice Brown" status="offline" />

// Different sizes
<Avatar name="User" size="xs" />
<Avatar name="User" size="sm" />
<Avatar name="User" size="md" />
<Avatar name="User" size="lg" />
<Avatar name="User" size="xl" />
<Avatar name="User" size="2xl" />

// Squared avatar
<Avatar name="Company" rounded={false} />

// With border
<Avatar name="User" showBorder borderColor="border-blue-500" />
```

### Avatar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Image URL |
| `alt` | `string` | - | Alt text for image |
| `name` | `string` | - | Name for initials fallback |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Avatar size |
| `rounded` | `boolean` | `true` | Circular shape |
| `showBorder` | `boolean` | `false` | Show border |
| `borderColor` | `string` | `'border-white'` | Border color class |
| `status` | `'online' \| 'offline' \| 'busy' \| 'away'` | - | Status indicator |
| `className` | `string` | - | Additional CSS classes |

### AvatarGroup

Display multiple avatars in a stacked group:

```tsx
<AvatarGroup max={3}>
  <Avatar name="John Doe" />
  <Avatar name="Jane Smith" />
  <Avatar name="Bob Wilson" />
  <Avatar name="Alice Brown" />
  <Avatar name="Charlie Davis" />
</AvatarGroup>
// Shows 3 avatars + "+2" overflow indicator
```

### AvatarGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element[]` | required | Avatar elements |
| `max` | `number` | - | Maximum visible avatars |
| `size` | `AvatarSize` | `'md'` | Size for all avatars |
| `spacing` | `number` | `-3` | Overlap spacing |
| `className` | `string` | - | Additional CSS classes |

### AvatarBadge

Add a badge to an avatar:

```tsx
<AvatarBadge
  badge={<NotificationBadge count={5} />}
  position="top-right"
>
  <Avatar name="John Doe" />
</AvatarBadge>
```

## Badge

Status indicator badges with various styles.

```tsx
import { Badge, StatusIndicator, NotificationBadge } from '@philjs/ui';

// Basic badge
<Badge>Default</Badge>
<Badge color="green">Active</Badge>
<Badge color="red">Inactive</Badge>
<Badge color="yellow">Pending</Badge>

// Different variants
<Badge variant="solid" color="blue">Solid</Badge>
<Badge variant="subtle" color="blue">Subtle</Badge>
<Badge variant="outline" color="blue">Outline</Badge>

// Rounded badge (pill)
<Badge rounded color="purple">New</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

### Badge Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element \| string` | required | Badge content |
| `variant` | `'solid' \| 'subtle' \| 'outline'` | `'subtle'` | Visual style |
| `color` | `'gray' \| 'red' \| 'orange' \| 'yellow' \| 'green' \| 'teal' \| 'blue' \| 'cyan' \| 'purple' \| 'pink'` | `'gray'` | Color scheme |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `rounded` | `boolean` | `false` | Pill shape |
| `className` | `string` | - | Additional CSS classes |

### StatusIndicator

Small colored dot for status:

```tsx
<StatusIndicator status="online" label="Online" />
<StatusIndicator status="busy" label="Do not disturb" />
<StatusIndicator status="away" label="Away" />
<StatusIndicator status="offline" label="Offline" />
<StatusIndicator status="idle" />
```

### StatusIndicator Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `'online' \| 'offline' \| 'busy' \| 'away' \| 'idle'` | required | Status type |
| `label` | `string` | - | Optional label text |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Dot size |
| `className` | `string` | - | Additional CSS classes |

### NotificationBadge

Numeric notification indicator:

```tsx
// Basic notification badge
<NotificationBadge count={5} />

// With max value
<NotificationBadge count={150} max={99} />
// Shows "99+"

// Show zero
<NotificationBadge count={0} showZero />

// Different colors
<NotificationBadge count={3} color="red" />
<NotificationBadge count={3} color="blue" />
<NotificationBadge count={3} color="green" />
```

### NotificationBadge Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number` | required | Notification count |
| `max` | `number` | `99` | Maximum displayed value |
| `showZero` | `boolean` | `false` | Show when count is 0 |
| `color` | `'red' \| 'blue' \| 'green' \| 'gray'` | `'red'` | Badge color |
| `className` | `string` | - | Additional CSS classes |

## Common Patterns

### User List Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Team Members</CardTitle>
  </CardHeader>
  <CardBody padding="none">
    <div className="divide-y">
      {users.map(user => (
        <div key={user.id} className="flex items-center gap-3 p-4">
          <Avatar name={user.name} src={user.avatar} status={user.status} />
          <div className="flex-1">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.role}</p>
          </div>
          <Badge color={user.active ? 'green' : 'gray'}>
            {user.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      ))}
    </div>
  </CardBody>
</Card>
```

### Data Table with Actions

```tsx
<Card variant="outlined" padding="none">
  <Table hoverable>
    <Thead>
      <Tr>
        <Th sortable sortDirection={sortDir()} onSort={handleSort}>Name</Th>
        <Th>Status</Th>
        <Th align="right">Actions</Th>
      </Tr>
    </Thead>
    <Tbody>
      {data().map(row => (
        <Tr key={row.id} selected={selected().includes(row.id)}>
          <Td>
            <div className="flex items-center gap-2">
              <Avatar name={row.name} size="sm" />
              {row.name}
            </div>
          </Td>
          <Td>
            <Badge color={row.active ? 'green' : 'gray'} size="sm">
              {row.active ? 'Active' : 'Inactive'}
            </Badge>
          </Td>
          <Td align="right">
            <ButtonGroup>
              <IconButton icon={<EditIcon />} aria-label="Edit" size="sm" variant="ghost" />
              <IconButton icon={<TrashIcon />} aria-label="Delete" size="sm" variant="ghost" color="error" />
            </ButtonGroup>
          </Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
</Card>
```

### Product Card

```tsx
<Card hoverable>
  <CardImage src={product.image} alt={product.name} />
  <CardBody>
    <div className="flex items-start justify-between">
      <CardTitle subtitle={product.category}>{product.name}</CardTitle>
      <Badge color="green" rounded>{product.discount}% off</Badge>
    </div>
    <p className="text-2xl font-bold mt-2">${product.price}</p>
  </CardBody>
  <CardFooter>
    <Button fullWidth color="primary">Add to Cart</Button>
  </CardFooter>
</Card>
```

### Comment with Avatar

```tsx
<div className="flex gap-4">
  <Avatar name={comment.author} src={comment.authorAvatar} />
  <div className="flex-1">
    <div className="flex items-center gap-2">
      <span className="font-medium">{comment.author}</span>
      <span className="text-sm text-gray-500">{comment.timestamp}</span>
    </div>
    <p className="mt-1">{comment.text}</p>
  </div>
</div>
```

## Accessibility

### Table Accessibility

- Proper `<table>`, `<thead>`, `<tbody>` structure
- `scope="col"` on header cells
- Sortable columns have visual indicators
- Empty state uses colspan for proper structure

### Avatar Accessibility

- Images have alt text (from `alt` or `name` prop)
- Status indicators have `aria-label`
- Decorative elements are hidden from screen readers

### Badge Accessibility

- Uses semantic HTML (`<span>`)
- Color is not the only indicator of meaning
- Text content is readable by screen readers
