# @philjs/db - Database Integration

**Type-safe database utilities with multi-provider support, migrations, and Supabase integration.**

@philjs/db provides a unified database layer that works with Prisma, Drizzle, and Supabase. It includes type-safe query builders, schema validation, migrations, transactions, and repository patterns.

## Installation

```bash
npm install @philjs/db

# For specific providers:
npm install @prisma/client    # For Prisma
npm install drizzle-orm       # For Drizzle
npm install @supabase/supabase-js  # For Supabase
```

## Quick Start

```typescript
import {
  createRepository,
  query,
  Operators,
  createSupabaseClient,
} from '@philjs/db';

// Initialize Supabase
const supabase = await createSupabaseClient({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
});

// Create repository
const users = createRepository(supabase, 'users');

// Use CRUD operations
const user = await users.create({ name: 'John', email: 'john@example.com' });
const allUsers = await users.findAll();
const found = await users.findById(user.id);
```

## Provider Detection

@philjs/db automatically detects your database provider:

```typescript
import { detectProvider } from '@philjs/db';

const provider = detectProvider(db);
// Returns: 'prisma' | 'drizzle' | 'supabase' | 'unknown'
```

## Universal CRUD Operations

### `create()`

Create a record with automatic provider handling:

```typescript
import { create } from '@philjs/db';

// Works with Prisma, Drizzle, or Supabase
const user = await create(db, 'users', {
  name: 'John Doe',
  email: 'john@example.com',
}, {
  select: { id: true, name: true },  // Optional field selection
  include: { posts: true },           // Optional relations (Prisma)
  schema: { users: usersSchema },     // Required for Drizzle
});
```

### `update()`

Update records with where clause:

```typescript
import { update, Operators } from '@philjs/db';

// Update single record
const updated = await update(db, 'users',
  { id: '123' },
  { name: 'Jane Doe' }
);

// Update multiple records
const updatedMany = await update(db, 'users',
  { status: Operators.eq('pending') },
  { status: 'active' },
  { many: true }
);
```

### `deleteRecord()`

Delete records with cascade support:

```typescript
import { deleteRecord } from '@philjs/db';

// Delete single record
await deleteRecord(db, 'users', { id: '123' });

// Delete with cascade
await deleteRecord(db, 'users', { id: '123' }, {
  cascade: true,
  cascadeRelations: [
    { table: 'posts', foreignKey: 'userId' },
    { table: 'comments', foreignKey: 'userId' },
  ],
});

// Delete many with return
const deleted = await deleteRecord(db, 'users',
  { status: 'inactive' },
  { many: true, returnDeleted: true }
);
```

## Type-Safe Query Builder

### Basic Queries

```typescript
import { query, TypeSafeQueryBuilder } from '@philjs/db';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
}

// Create typed query builder
const users = query<User>()
  .select('id', 'name', 'email')
  .where({ status: 'active' })
  .orderBy('name', 'asc')
  .limit(10)
  .offset(0)
  .build();
```

### Universal QueryBuilder

The `QueryBuilder` class works across all providers:

```typescript
import { QueryBuilder, queryBuilder } from '@philjs/db';

// Create query builder
const qb = queryBuilder<User>(db, 'users', schema);

// Chainable API
const activeUsers = await qb
  .select('id', 'name', 'email')
  .where({ status: 'active' })
  .andWhere({ age: { gte: 18 } })
  .orderBy('name', 'asc')
  .limit(10)
  .findMany();

// Find first matching
const user = await qb
  .where({ email: 'john@example.com' })
  .findFirst();

// Find unique
const uniqueUser = await qb
  .where({ id: '123' })
  .findUnique();

// Count records
const count = await qb
  .where({ status: 'active' })
  .count();

// Check existence
const exists = await qb
  .where({ email: 'john@example.com' })
  .exists();
```

### Complex Queries

```typescript
// OR conditions
const results = await qb
  .where({ status: 'active' })
  .orWhere({ role: 'admin' })
  .findMany();

// Include relations
const usersWithPosts = await qb
  .include({ posts: true, profile: true })
  .findMany();

// Joins (provider-dependent)
const results = await qb
  .join('posts', { leftField: 'id', rightField: 'userId' }, 'left')
  .findMany();

// Group by and having
const grouped = await qb
  .groupBy('status')
  .having({ count: { gte: 5 } })
  .findMany();

// Distinct
const uniqueEmails = await qb
  .select('email')
  .distinct()
  .findMany();
```

## Operators

Type-safe query operators:

```typescript
import { Operators } from '@philjs/db';

// Comparison
Operators.eq(value);       // equals
Operators.neq(value);      // not equals
Operators.gt(value);       // greater than
Operators.gte(value);      // greater than or equal
Operators.lt(value);       // less than
Operators.lte(value);      // less than or equal

// Arrays
Operators.in([1, 2, 3]);   // in array
Operators.notIn([1, 2]);   // not in array

// Strings
Operators.contains('term');    // contains substring
Operators.startsWith('pre');   // starts with
Operators.endsWith('suf');     // ends with

// Null checks
Operators.isNull();        // is null
Operators.isNotNull();     // is not null

// Range
Operators.between(min, max); // between values

// Usage
const users = await query<User>()
  .where({
    age: Operators.gte(18),
    status: Operators.in(['active', 'pending']),
    name: Operators.contains('John'),
    deletedAt: Operators.isNull(),
  })
  .build();
```

## Schema Validation

Validate data before database operations:

```typescript
import { validator, SchemaValidator, is, assert } from '@philjs/db';

// Define constraints
const userValidator = validator<User>({
  required: ['name', 'email'],
  unique: ['email'],
  min: { name: 2, age: 0 },
  max: { name: 100, age: 150 },
  pattern: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  custom: {
    name: (value) => value.trim().length > 0 || 'Name cannot be empty',
  },
});

// Validate data
const result = userValidator.validate({
  name: 'John',
  email: 'invalid-email',
});

if (!result.valid) {
  console.log(result.errors);
  // [{ field: 'email', message: 'email does not match required pattern', type: 'pattern' }]
}

// Type guard
if (is(data, userValidator)) {
  // data is typed as User
}

// Assert (throws on failure)
assert(data, userValidator, 'Invalid user data');
```

## Repository Pattern

Create repositories for common CRUD operations:

```typescript
import { createRepository, Repository } from '@philjs/db';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

// Create repository
const posts = createRepository<Post>(db, 'posts', {
  schema: { posts: postsSchema },  // For Drizzle
  primaryKey: 'id',                 // Default: 'id'
});

// Available methods
await posts.findAll({ page: 1, perPage: 10 });
await posts.findById('123');
await posts.findOne({ authorId: 'user-1' });
await posts.findMany({ status: 'published' });
await posts.create({ title: 'Hello', content: '...', authorId: 'user-1' });
await posts.update('123', { title: 'Updated' });
await posts.delete('123');
await posts.count({ status: 'draft' });
```

## Pagination

Built-in pagination helper:

```typescript
import { paginate } from '@philjs/db';

const result = await paginate(db, 'posts', {
  page: 1,
  perPage: 20,
  where: { status: 'published' },
  orderBy: { createdAt: 'desc' },
});

// Result structure
{
  data: [...],
  meta: {
    total: 100,
    page: 1,
    perPage: 20,
    totalPages: 5,
    hasNextPage: true,
    hasPrevPage: false,
  }
}
```

## Transactions

### TypeScript 6 `using` Syntax

Modern transaction handling with automatic cleanup:

```typescript
import { createTransaction, Transaction } from '@philjs/db';

// Using Symbol.asyncDispose (TypeScript 6)
async function transferFunds(fromId: string, toId: string, amount: number) {
  await using tx = await createTransaction(db);

  await update(tx.client, 'accounts',
    { id: fromId },
    { balance: { decrement: amount } }
  );

  await update(tx.client, 'accounts',
    { id: toId },
    { balance: { increment: amount } }
  );

  await tx.commit();
  // Auto-rollback if commit not called
}
```

### Callback Style

Traditional callback-based transactions:

```typescript
import { transaction, withTransaction } from '@philjs/db';

// Callback style
const result = await transaction(db, async (tx) => {
  const user = await create(tx.client, 'users', userData);
  const profile = await create(tx.client, 'profiles', { userId: user.id });
  return { user, profile };
});

// Simple wrapper
await withTransaction(db, async (tx) => {
  // Operations here
});
```

### Transaction Control

```typescript
const tx = await createTransaction(db);

try {
  await someOperation(tx.client);

  if (shouldRollback) {
    await tx.rollback();  // Explicit rollback
    return;
  }

  await tx.commit();      // Explicit commit
} finally {
  // tx.isActive shows if transaction is still open
  console.log('Transaction active:', tx.isActive);
}
```

## Soft Delete

Built-in soft delete support:

```typescript
import { softDelete, restore } from '@philjs/db';

// Soft delete (sets deletedAt timestamp)
await softDelete(db, 'posts', '123');

// Restore soft deleted record
await restore(db, 'posts', '123');
```

## Health Check

Monitor database connectivity:

```typescript
import { healthCheck } from '@philjs/db';

const status = await healthCheck(db);
// { healthy: true, latency: 5 }

if (!status.healthy) {
  console.error('Database connection failed');
}
```

## Supabase Integration

### Setup

```typescript
import { createSupabaseClient, useSupabase } from '@philjs/db';

// Initialize
const supabase = await createSupabaseClient({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Get client instance
const client = useSupabase();
```

### Authentication

```typescript
import { useSupabaseAuth } from '@philjs/db';

const auth = useSupabaseAuth();

// Sign up
await auth.signUp('email@example.com', 'password', { name: 'John' });

// Sign in
await auth.signIn('email@example.com', 'password');

// OAuth
await auth.signInWithOAuth('google');  // or 'github', 'discord', etc.

// Magic link
await auth.signInWithMagicLink('email@example.com');

// Sign out
await auth.signOut();

// Get current user
const user = await auth.getUser();

// Get session
const session = await auth.getSession();

// Listen to auth changes
auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
});

// Password reset
await auth.resetPassword('email@example.com');
await auth.updatePassword('new-password');

// Update user
await auth.updateUser({ email: 'new@example.com', data: { name: 'Jane' } });
```

### Storage

```typescript
import { useSupabaseStorage } from '@philjs/db';

const storage = useSupabaseStorage('avatars');

// Upload file
const { data, error } = await storage.upload('user-123/avatar.png', file, {
  cacheControl: '3600',
  upsert: true,
});

// Download file
const { data: blob } = await storage.download('user-123/avatar.png');

// Get public URL
const { data: { publicUrl } } = storage.getPublicUrl('user-123/avatar.png');

// Create signed URL
const { data: { signedUrl } } = await storage.createSignedUrl('private/doc.pdf', 3600);

// List files
const { data: files } = await storage.list('user-123/', {
  limit: 100,
  offset: 0,
  sortBy: { column: 'created_at', order: 'desc' },
});

// Remove files
await storage.remove(['user-123/old-avatar.png']);

// Move/rename
await storage.move('old-path.png', 'new-path.png');

// Copy
await storage.copy('source.png', 'destination.png');
```

### Realtime

```typescript
import { useSupabaseRealtime } from '@philjs/db';

// Subscribe to table changes
const unsubscribe = useSupabaseRealtime('posts', (payload) => {
  console.log('Change:', payload.eventType, payload.new, payload.old);
});

// Cleanup
unsubscribe();
```

## Migrations

### Migration Manager

```typescript
import { MigrationManager } from '@philjs/db';

const manager = new MigrationManager({
  type: 'postgres',  // or 'mysql', 'sqlite'
  connection: connectionString,
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: true,
  backup: true,
});

// Initialize
await manager.initialize();

// Check status
const status = await manager.getStatus();
console.log('Pending:', status.pending);
console.log('Executed:', status.executed);
console.log('Conflicts:', status.conflicts);

// Run migrations
const result = await manager.migrate();
console.log('Migrated:', result.migrations);
console.log('Duration:', result.duration);

// Run specific migrations
await manager.migrate({ to: '20240101120000' });  // Up to version
await manager.migrate({ step: 3 });                // Next 3 migrations

// Rollback
await manager.rollback();                          // Last batch
await manager.rollback({ step: 2 });               // Last 2 migrations
await manager.rollback({ to: '20240101120000' });  // Down to version
await manager.rollback({ batch: 5 });              // Specific batch

// Reset (rollback all, then migrate)
await manager.reset();

// Fresh (drop all tables, then migrate)
await manager.fresh();

// Create new migration
const filepath = await manager.create('create_users_table', {
  template: 'table',  // or 'alter', 'data'
});
```

### Migration File

```typescript
// migrations/20240101120000_create_users.ts
import type { Migration } from '@philjs/db';

export default {
  name: 'create_users',

  async up(context) {
    context.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.timestamp('created_at').defaultNow();
      table.timestamp('updated_at').defaultNow();
    });
  },

  async down(context) {
    context.schema.dropTable('users');
  },
} as Migration;
```

### Database Adapters

```typescript
import {
  PostgresMigrationAdapter,
  MySQLMigrationAdapter,
  SQLiteMigrationAdapter,
} from '@philjs/db';

// PostgreSQL
const pgAdapter = new PostgresMigrationAdapter(connection);

// MySQL
const mysqlAdapter = new MySQLMigrationAdapter(connection);

// SQLite
const sqliteAdapter = new SQLiteMigrationAdapter(connection);
```

### Schema Diff

Generate migrations from schema changes:

```typescript
import { SchemaDiffGenerator } from '@philjs/db';

const differ = new SchemaDiffGenerator();
const diff = differ.diff(oldSchema, newSchema);

console.log(diff.tables.added);     // New tables
console.log(diff.tables.removed);   // Dropped tables
console.log(diff.columns.added);    // New columns
console.log(diff.columns.removed);  // Dropped columns
console.log(diff.indexes.added);    // New indexes
```

### Auto-Migration

```typescript
import { AutoMigrationGenerator } from '@philjs/db';

const generator = new AutoMigrationGenerator({
  connection,
  migrationsDir: './migrations',
});

// Generate migration from schema changes
await generator.generate('add_posts_table');

// Dry run
const dryRun = await generator.dryRun();
console.log('Would create:', dryRun.operations);
```

### CLI

```bash
# Run migrations
philjs db migrate

# Rollback
philjs db rollback
philjs db rollback --step 2

# Create migration
philjs db create add_users_table
philjs db create create_posts --template table

# Status
philjs db status

# Reset
philjs db reset

# Fresh
philjs db fresh
```

### Prisma Integration

```typescript
import { PrismaMigrationIntegration, PrismaSchemaParser } from '@philjs/db';

const prismaIntegration = new PrismaMigrationIntegration({
  schemaPath: './prisma/schema.prisma',
});

// Parse Prisma schema
const parser = new PrismaSchemaParser();
const schema = parser.parse(prismaSchemaContent);
```

### Drizzle Integration

```typescript
import { DrizzleMigrationIntegration, DrizzleSchemaParser } from '@philjs/db';

const drizzleIntegration = new DrizzleMigrationIntegration({
  schemaPath: './src/db/schema.ts',
});

// Parse Drizzle schema
const parser = new DrizzleSchemaParser();
const schema = parser.parse(drizzleSchemaContent);
```

## Type Utilities

### Type Inference

```typescript
import type {
  InferModel,
  InferSelect,
  InferInsert,
  InferUpdate,
} from '@philjs/db';

// Infer types from schema
type User = InferModel<typeof userSchema>;
type UserSelect = InferSelect<typeof userSchema>;
type UserInsert = InferInsert<typeof userSchema>;
type UserUpdate = InferUpdate<typeof userSchema>;
```

### Utility Types

```typescript
import type { DeepPartial, DeepRequired, Exact } from '@philjs/db';

// Deep partial (all nested properties optional)
type PartialUser = DeepPartial<User>;

// Deep required (all nested properties required)
type RequiredUser = DeepRequired<User>;

// Exact type (no extra properties)
function createUser<T extends Exact<T, UserInsert>>(data: T): User {
  // ...
}
```

### Object Utilities

```typescript
import { pick, omit } from '@philjs/db';

// Pick specific fields
const publicUser = pick(user, 'id', 'name', 'email');

// Omit fields
const safeUser = omit(user, 'password', 'salt');
```

## Relationship Builder

Define type-safe relationships:

```typescript
import { relationship, RelationshipBuilder } from '@philjs/db';

// One-to-many
const userPosts = relationship<User, Post>()
  .oneToMany()
  .foreignKey('authorId')
  .references('id')
  .build();

// Many-to-many
const userRoles = relationship<User, Role>()
  .manyToMany(UserRoleJoin)
  .build();

// One-to-one
const userProfile = relationship<User, Profile>()
  .oneToOne()
  .foreignKey('userId')
  .build();
```

## Migration Builder

Programmatic migration building:

```typescript
import { migration, MigrationBuilder } from '@philjs/db';

const operations = migration()
  .createTable('users', [
    { name: 'id', type: 'number', primaryKey: true },
    { name: 'email', type: 'string', unique: true },
    { name: 'name', type: 'string', nullable: false },
    { name: 'age', type: 'number', nullable: true },
    { name: 'createdAt', type: 'date', default: 'NOW()' },
  ])
  .createIndex('users', ['email'], true)
  .addColumn('users', {
    name: 'status',
    type: 'string',
    default: 'active',
  })
  .build();
```

## Best Practices

1. **Use repositories** for consistent data access patterns
2. **Validate before insert** with SchemaValidator
3. **Use transactions** for multi-step operations
4. **Enable backups** before running migrations
5. **Use type inference** for compile-time safety
6. **Paginate large queries** to avoid memory issues
7. **Health check** on application startup

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `detectProvider(db)` | Detect database provider |
| `create(db, table, data, options)` | Create record |
| `update(db, table, where, data, options)` | Update records |
| `deleteRecord(db, table, where, options)` | Delete records |
| `queryBuilder(db, table, schema)` | Create query builder |
| `createRepository(db, table, options)` | Create repository |
| `paginate(db, table, options)` | Paginated query |
| `transaction(db, fn)` | Execute in transaction |
| `createTransaction(db)` | Create disposable transaction |
| `softDelete(db, table, id)` | Soft delete record |
| `restore(db, table, id)` | Restore soft deleted |
| `healthCheck(db)` | Check database health |

### Classes

| Class | Description |
|-------|-------------|
| `QueryBuilder` | Universal query builder |
| `Transaction` | Transaction context |
| `SchemaValidator` | Data validation |
| `MigrationManager` | Migration orchestration |
| `MigrationBuilder` | Programmatic migrations |
| `RelationshipBuilder` | Define relationships |

## Next Steps

- [Database Migrations](../database/migrations.md) - Detailed migration guide
- [@philjs/graphql](../graphql/overview.md) - GraphQL integration
- [Data Layer](../core/data-layer.md) - Core data patterns
