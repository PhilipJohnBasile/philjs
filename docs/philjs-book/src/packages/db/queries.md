# Database Queries

This guide covers all query capabilities in @philjs/db, including the universal QueryBuilder, type-safe operators, and provider-specific features.

## Universal QueryBuilder

The `QueryBuilder` class provides a unified query interface that works seamlessly across Prisma, Drizzle, and Supabase.

### Creating a Query Builder

```typescript
import { QueryBuilder, queryBuilder } from '@philjs/db';

// Using the factory function (recommended)
const qb = queryBuilder<User>(db, 'users', schema);

// Using the class directly
const qb = new QueryBuilder<User>(db, 'users', schema);
```

The third parameter (`schema`) is required for Drizzle but optional for Prisma and Supabase.

### Select Operations

Select specific fields to return:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Select specific fields (type-safe)
const publicUsers = await queryBuilder<User>(db, 'users')
  .select('id', 'name', 'email')  // Returns Pick<User, 'id' | 'name' | 'email'>
  .findMany();

// Result type is automatically narrowed
publicUsers.forEach(user => {
  console.log(user.id);      // OK
  console.log(user.name);    // OK
  console.log(user.password); // TypeScript error: property doesn't exist
});
```

### Where Clauses

Basic equality filtering:

```typescript
// Simple equality
const activeUsers = await queryBuilder<User>(db, 'users')
  .where({ status: 'active' })
  .findMany();

// Multiple conditions (AND)
const results = await queryBuilder<User>(db, 'users')
  .where({ status: 'active', role: 'admin' })
  .findMany();
```

Using operators for complex conditions:

```typescript
import { Operators } from '@philjs/db';

// Greater than / less than
const adults = await queryBuilder<User>(db, 'users')
  .where({ age: Operators.gte(18) })
  .findMany();

// IN operator
const specificRoles = await queryBuilder<User>(db, 'users')
  .where({ role: Operators.in(['admin', 'moderator']) })
  .findMany();

// String matching
const johns = await queryBuilder<User>(db, 'users')
  .where({ name: Operators.startsWith('John') })
  .findMany();

// Null checks
const verifiedUsers = await queryBuilder<User>(db, 'users')
  .where({ verifiedAt: Operators.isNotNull() })
  .findMany();
```

### Combining Conditions

AND conditions:

```typescript
const results = await queryBuilder<User>(db, 'users')
  .where({ status: 'active' })
  .andWhere({ age: Operators.gte(18) })
  .andWhere({ country: 'US' })
  .findMany();
```

OR conditions:

```typescript
const results = await queryBuilder<User>(db, 'users')
  .where({ role: 'admin' })
  .orWhere({ role: 'superadmin' })
  .findMany();
```

Complex nested conditions:

```typescript
// (status = 'active' AND age >= 18) OR (role = 'admin')
const results = await queryBuilder<User>(db, 'users')
  .where({
    AND: [
      { status: 'active' },
      { age: Operators.gte(18) }
    ]
  })
  .orWhere({ role: 'admin' })
  .findMany();
```

### Ordering Results

```typescript
// Single field
const users = await queryBuilder<User>(db, 'users')
  .orderBy('name', 'asc')
  .findMany();

// Multiple fields
const users = await queryBuilder<User>(db, 'users')
  .orderBy('lastName', 'asc')
  .orderBy('firstName', 'asc')
  .orderBy('createdAt', 'desc')
  .findMany();
```

### Pagination

Limit and offset:

```typescript
// First page (10 items)
const page1 = await queryBuilder<User>(db, 'users')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .offset(0)
  .findMany();

// Second page
const page2 = await queryBuilder<User>(db, 'users')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .offset(10)
  .findMany();
```

### Including Relations

For ORMs that support eager loading:

```typescript
// Include related data
const usersWithPosts = await queryBuilder<User>(db, 'users')
  .include({ posts: true, profile: true })
  .findMany();

// Nested includes (provider-dependent)
const usersWithAll = await queryBuilder<User>(db, 'users')
  .include({
    posts: { comments: true },
    profile: true
  })
  .findMany();
```

### Joins

For SQL-based queries:

```typescript
// Inner join
const results = await queryBuilder<User>(db, 'users')
  .join('posts', { leftField: 'id', rightField: 'userId' })
  .findMany();

// Left join
const results = await queryBuilder<User>(db, 'users')
  .join('posts', { leftField: 'id', rightField: 'userId' }, 'left')
  .findMany();

// Right join
const results = await queryBuilder<User>(db, 'users')
  .join('posts', { leftField: 'id', rightField: 'userId' }, 'right')
  .findMany();
```

### Aggregations

Group by with having:

```typescript
// Count users by status
const countByStatus = await queryBuilder<User>(db, 'users')
  .groupBy('status')
  .findMany();

// With having clause
const activeStatuses = await queryBuilder<User>(db, 'users')
  .groupBy('status')
  .having({ count: Operators.gte(10) })
  .findMany();
```

### Distinct Results

```typescript
const uniqueCountries = await queryBuilder<User>(db, 'users')
  .select('country')
  .distinct()
  .findMany();
```

## Query Execution Methods

### findMany()

Returns all matching records as an array:

```typescript
const users = await queryBuilder<User>(db, 'users')
  .where({ status: 'active' })
  .findMany();
// Returns: User[]
```

### findFirst()

Returns the first matching record or null:

```typescript
const user = await queryBuilder<User>(db, 'users')
  .where({ email: 'john@example.com' })
  .findFirst();
// Returns: User | null
```

### findUnique()

Returns exactly one record or null, throws if multiple found:

```typescript
const user = await queryBuilder<User>(db, 'users')
  .where({ id: '123' })
  .findUnique();
// Returns: User | null
// Throws: Error if more than one result
```

### count()

Returns the count of matching records:

```typescript
const activeCount = await queryBuilder<User>(db, 'users')
  .where({ status: 'active' })
  .count();
// Returns: number
```

### exists()

Returns whether any matching records exist:

```typescript
const emailExists = await queryBuilder<User>(db, 'users')
  .where({ email: 'john@example.com' })
  .exists();
// Returns: boolean
```

## Type-Safe Operators

The `Operators` object provides type-safe query operators:

### Comparison Operators

```typescript
import { Operators } from '@philjs/db';

// Equals
Operators.eq('value')        // { equals: 'value' }

// Not equals
Operators.neq('value')       // { not: 'value' }

// Greater than
Operators.gt(10)             // { gt: 10 }

// Greater than or equal
Operators.gte(10)            // { gte: 10 }

// Less than
Operators.lt(10)             // { lt: 10 }

// Less than or equal
Operators.lte(10)            // { lte: 10 }

// Between (inclusive)
Operators.between(1, 100)    // { gte: 1, lte: 100 }
```

### Array Operators

```typescript
// In array
Operators.in(['a', 'b', 'c'])      // { in: ['a', 'b', 'c'] }

// Not in array
Operators.notIn(['a', 'b'])        // { notIn: ['a', 'b'] }
```

### String Operators

```typescript
// Contains substring
Operators.contains('search')       // { contains: 'search' }

// Starts with
Operators.startsWith('prefix')     // { startsWith: 'prefix' }

// Ends with
Operators.endsWith('suffix')       // { endsWith: 'suffix' }
```

### Null Operators

```typescript
// Is null
Operators.isNull()                 // { equals: null }

// Is not null
Operators.isNotNull()              // { not: null }
```

## TypeSafeQueryBuilder

For building queries without executing:

```typescript
import { query, TypeSafeQueryBuilder } from '@philjs/db';

// Create query builder
const queryConfig = query<User>()
  .select('id', 'name', 'email')
  .where({ status: 'active' })
  .orderBy('createdAt', 'desc')
  .limit(10)
  .offset(0)
  .include({ posts: true })
  .build();

// queryConfig contains:
// {
//   select: { id: true, name: true, email: true },
//   where: { status: 'active' },
//   orderBy: [{ field: 'createdAt', direction: 'desc' }],
//   limit: 10,
//   offset: 0,
//   include: { posts: true }
// }

// Use with your ORM
const results = await prisma.user.findMany(queryConfig);
```

## CRUD Operations

### Create

```typescript
import { create } from '@philjs/db';

// Create a single record
const user = await create<User>(db, 'users', {
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active',
});

// With options
const user = await create<User>(db, 'users', userData, {
  select: { id: true, name: true },     // Return specific fields
  include: { profile: true },            // Include relations (Prisma)
  schema: { users: usersSchema },        // Required for Drizzle
});
```

### Update

```typescript
import { update } from '@philjs/db';

// Update single record
const updated = await update<User>(db, 'users',
  { id: '123' },                          // Where clause
  { name: 'Jane Doe' }                    // Data to update
);

// Update multiple records
const updatedMany = await update<User>(db, 'users',
  { status: 'pending' },                  // Where clause
  { status: 'active' },                   // Data to update
  { many: true }                          // Options
);

// With operators
const updated = await update<User>(db, 'users',
  { age: Operators.lt(18) },
  { status: 'minor' },
  { many: true }
);
```

### Delete

```typescript
import { deleteRecord } from '@philjs/db';

// Delete single record
await deleteRecord<User>(db, 'users', { id: '123' });

// Delete multiple records
const result = await deleteRecord<User>(db, 'users',
  { status: 'inactive' },
  { many: true }
);

// Return deleted records
const deleted = await deleteRecord<User>(db, 'users',
  { status: 'inactive' },
  { many: true, returnDeleted: true }
);

// Cascade delete
await deleteRecord<User>(db, 'users', { id: '123' }, {
  cascade: true,
  cascadeRelations: [
    { table: 'posts', foreignKey: 'authorId' },
    {
      table: 'comments',
      foreignKey: 'authorId',
      cascade: true,
      cascadeRelations: [
        { table: 'reactions', foreignKey: 'commentId' }
      ]
    }
  ]
});
```

## Provider-Specific Behavior

### Prisma

```typescript
// Prisma uses model-based access
const users = await queryBuilder<User>(db, 'user')  // Model name (singular)
  .where({ status: 'active' })
  .include({ posts: true })
  .findMany();

// Maps to:
// db.user.findMany({
//   where: { status: 'active' },
//   include: { posts: true }
// })
```

### Drizzle

```typescript
// Drizzle requires schema
import { users } from './schema';

const results = await queryBuilder<User>(db, 'users', { users })
  .where({ status: 'active' })
  .findMany();

// Maps to:
// db.select().from(users).where(eq(users.status, 'active'))
```

### Supabase

```typescript
// Supabase uses table names
const users = await queryBuilder<User>(db, 'users')
  .where({ status: 'active' })
  .include({ posts: true })  // Becomes: select('*, posts(*)')
  .findMany();

// Maps to:
// db.from('users').select('*, posts(*)').eq('status', 'active')
```

## Performance Tips

### Use Select to Limit Fields

```typescript
// Bad: fetches all columns
const users = await queryBuilder<User>(db, 'users').findMany();

// Good: fetches only needed columns
const users = await queryBuilder<User>(db, 'users')
  .select('id', 'name')
  .findMany();
```

### Use Pagination for Large Datasets

```typescript
// Bad: loads entire table
const allUsers = await queryBuilder<User>(db, 'users').findMany();

// Good: paginated loading
async function* getAllUsers() {
  let offset = 0;
  const limit = 100;

  while (true) {
    const users = await queryBuilder<User>(db, 'users')
      .limit(limit)
      .offset(offset)
      .findMany();

    if (users.length === 0) break;
    yield* users;
    offset += limit;
  }
}
```

### Use Count Before Heavy Operations

```typescript
// Check count before processing
const count = await queryBuilder<User>(db, 'users')
  .where({ status: 'pending' })
  .count();

if (count > 10000) {
  console.warn('Large dataset - consider batching');
}
```

### Use Indexes

Ensure your where clauses use indexed columns:

```typescript
// Good: uses indexed column (assuming email is indexed)
await queryBuilder<User>(db, 'users')
  .where({ email: 'john@example.com' })
  .findFirst();

// Can be slow: scanning unindexed column
await queryBuilder<User>(db, 'users')
  .where({ bio: Operators.contains('developer') })
  .findMany();
```

## Error Handling

```typescript
import { QueryBuilder } from '@philjs/db';

try {
  const users = await queryBuilder<User>(db, 'users')
    .where({ status: 'active' })
    .findMany();
} catch (error) {
  if (error instanceof Error) {
    // Check for specific errors
    if (error.message.includes('connection')) {
      console.error('Database connection failed');
    } else if (error.message.includes('not found')) {
      console.error('Table or model not found');
    } else {
      console.error('Query failed:', error.message);
    }
  }
}
```

## Next Steps

- [Migrations](./migrations.md) - Database schema management
- [Schema Management](./schema.md) - Schema definition and validation
- [Supabase Integration](./supabase.md) - Full Supabase guide
