# Data display components

Use @philjs/ui display primitives to present lists, tables, cards, and status indicators.

## Tables

```tsx
import { Table, Thead, Tbody, Tr, Th, Td } from '@philjs/ui';

<Table>
  <Thead>
    <Tr>
      <Th>Name</Th>
      <Th>Status</Th>
    </Tr>
  </Thead>
  <Tbody>
    {rows.map(row => (
      <Tr>
        <Td>{row.name}</Td>
        <Td>{row.status}</Td>
      </Tr>
    ))}
  </Tbody>
</Table>
```

## Cards and badges

```tsx
import { Card, CardHeader, CardBody, Badge } from '@philjs/ui';

<Card>
  <CardHeader>Usage</CardHeader>
  <CardBody>
    <Badge color="success">Healthy</Badge>
  </CardBody>
</Card>
```

## Other display helpers

- `Avatar` and `AvatarGroup` for users
- `Breadcrumb` for navigation hints
- `Tooltip` and `Toast` for contextual feedback
