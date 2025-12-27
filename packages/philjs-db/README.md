# philjs-db

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Complete database solution for PhilJS applications with ORM integration, migrations, and reactive signals.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

### ORM Integration
- **Prisma ORM** - Type-safe database client with auto-completion
- **Drizzle ORM** - Lightweight TypeScript ORM
- **Supabase** - Backend-as-a-Service with auth and storage
- **Reactive Integration** - Database queries with PhilJS signals
- **Connection Pooling** - Efficient database connections
- **Transaction Support** - Safe multi-query operations
- **Pagination Utilities** - Built-in pagination helpers
- **Soft Delete** - Logical deletion support
- **Repository Pattern** - Clean data access layer

### Database Migrations
- **Multi-Database Support** - PostgreSQL, MySQL, SQLite, MongoDB
- **Migration Versioning** - Track and manage migration history
- **Up/Down Migrations** - Full rollback support
- **Transaction Support** - Automatic transaction wrapping
- **Schema Diff** - Automatic schema comparison
- **Auto-Migration** - Generate migrations from model changes
- **CLI Tools** - Full-featured command-line interface
- **ORM Integration** - Seamless Prisma and Drizzle support
- **Backup & Restore** - Automatic database backups

See [MIGRATIONS.md](./MIGRATIONS.md) for complete migration documentation.

## Installation

```bash
# Core package
pnpm add philjs-db

# With Prisma
pnpm add @prisma/client
pnpm add -D prisma

# With Drizzle
pnpm add drizzle-orm
pnpm add -D drizzle-kit

# With Supabase
pnpm add @supabase/supabase-js
```

## Quick Start - Migrations

```bash
# Create migration configuration
cat > philjs-db.config.js << EOF
export default {
  type: 'postgres',
  connection: process.env.DATABASE_URL,
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: true,
};
EOF

# Create your first migration
npx philjs-db migrate:create --name create_users_table --template table

# Run migrations
npx philjs-db migrate

# Check status
npx philjs-db migrate:status

# Rollback if needed
npx philjs-db migrate:rollback
```

See [MIGRATIONS.md](./MIGRATIONS.md) for complete migration documentation.

## Quick Start

### Prisma

#### Setup

```typescript
import { createPrismaClient, PrismaProvider } from 'philjs-db';

// Create client
const prisma = createPrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

// Wrap your app
export default function App() {
  return (
    <PrismaProvider client={prisma}>
      <YourApp />
    </PrismaProvider>
  );
}
```

#### Usage

```typescript
import { usePrisma } from 'philjs-db';
import { signal } from 'philjs-core';

export default function UserList() {
  const prisma = usePrisma();
  const users = signal([]);

  // Load users
  async function loadUsers() {
    const data = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    users.set(data);
  }

  // Create user
  async function createUser(name: string, email: string) {
    const user = await prisma.user.create({
      data: { name, email }
    });
    users.set([...users(), user]);
  }

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users().map(user => (
          <li key={user.id}>{user.name} - {user.email}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### With Loaders

```typescript
import { withPrisma } from 'philjs-db';
import { defineLoader } from 'philjs-ssr';

export const userLoader = defineLoader(
  withPrisma(async ({ prisma, params }) => {
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      throw new Response('Not Found', { status: 404 });
    }

    return user;
  })
);
```

### Drizzle

#### Setup

```typescript
import { createDrizzleClient, DrizzleProvider } from 'philjs-db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = createDrizzleClient(drizzle(pool));

export default function App() {
  return (
    <DrizzleProvider client={db}>
      <YourApp />
    </DrizzleProvider>
  );
}
```

#### Usage

```typescript
import { useDrizzle } from 'philjs-db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

export default function UserProfile({ userId }: { userId: number }) {
  const db = useDrizzle();
  const user = signal(null);

  async function loadUser() {
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    user.set(userData);
  }

  return <div>{user()?.name}</div>;
}
```

### Supabase

#### Setup

```typescript
import { createSupabaseClient, SupabaseProvider } from 'philjs-db';

const supabase = createSupabaseClient({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!
});

export default function App() {
  return (
    <SupabaseProvider client={supabase}>
      <YourApp />
    </SupabaseProvider>
  );
}
```

#### Database Queries

```typescript
import { useSupabase } from 'philjs-db';

export default function Posts() {
  const supabase = useSupabase();
  const posts = signal([]);

  async function loadPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    posts.set(data);
  }

  return <div>...</div>;
}
```

#### Authentication

```typescript
import { useSupabaseAuth } from 'philjs-db';

export default function LoginForm() {
  const { signIn, signUp, signOut, user, session } = useSupabaseAuth();

  async function handleLogin(email: string, password: string) {
    const { error } = await signIn({ email, password });
    if (error) console.error(error);
  }

  if (user()) {
    return <div>Welcome, {user().email}!</div>;
  }

  return <LoginForm onSubmit={handleLogin} />;
}
```

#### Storage

```typescript
import { useSupabaseStorage } from 'philjs-db';

export default function ImageUpload() {
  const { upload, download, remove } = useSupabaseStorage('avatars');

  async function handleUpload(file: File) {
    const { data, error } = await upload(`user-${Date.now()}.jpg`, file);
    if (error) throw error;
    return data.path;
  }

  return <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />;
}
```

## Utilities

### Pagination

```typescript
import { paginate } from 'philjs-db';
import { usePrisma } from 'philjs-db';

export default function PaginatedUsers() {
  const prisma = usePrisma();

  async function getUsers(page = 1) {
    return paginate(
      prisma.user,
      {
        page,
        perPage: 20,
        orderBy: { createdAt: 'desc' }
      }
    );
  }

  const result = await getUsers(1);
  // {
  //   data: [...],
  //   meta: {
  //     page: 1,
  //     perPage: 20,
  //     total: 150,
  //     totalPages: 8
  //   }
  // }
}
```

### Transactions

```typescript
import { withTransaction } from 'philjs-db';
import { usePrisma } from 'philjs-db';

export default function TransferFunds() {
  const prisma = usePrisma();

  async function transfer(fromId: string, toId: string, amount: number) {
    await withTransaction(prisma, async (tx) => {
      // Deduct from sender
      await tx.account.update({
        where: { id: fromId },
        data: { balance: { decrement: amount } }
      });

      // Add to receiver
      await tx.account.update({
        where: { id: toId },
        data: { balance: { increment: amount } }
      });

      // If any operation fails, entire transaction rolls back
    });
  }
}
```

### Using ES2024 Features

#### Promise.withResolvers() for Async Control

```typescript
import { usePrisma } from 'philjs-db';

export async function batchInsertWithProgress(items: Item[]) {
  const prisma = usePrisma();
  const { promise, resolve, reject } = Promise.withResolvers<void>();

  let completed = 0;
  const total = items.length;

  for (const item of items) {
    try {
      await prisma.item.create({ data: item });
      completed++;
      console.log(`Progress: ${completed}/${total}`);
    } catch (error) {
      reject(error);
      return promise;
    }
  }

  resolve();
  return promise;
}
```

#### Object.groupBy() for Query Results

```typescript
import { usePrisma } from 'philjs-db';

export async function getUsersByRole() {
  const prisma = usePrisma();
  const users = await prisma.user.findMany();

  // Group users by role using ES2024 Object.groupBy()
  const grouped = Object.groupBy(users, user => user.role);

  return {
    admins: grouped.admin ?? [],
    users: grouped.user ?? [],
    guests: grouped.guest ?? [],
  };
}
```

#### Resource Management with `using`

```typescript
import { createDatabaseConnection } from 'philjs-db';

// Database connection with automatic cleanup using TypeScript 6 `using`
async function performDatabaseOperation() {
  await using connection = await createDatabaseConnection({
    url: process.env.DATABASE_URL,
    [Symbol.asyncDispose]: async () => {
      await connection.disconnect();
      console.log('Connection closed');
    }
  });

  // Connection automatically closed when scope exits
  return connection.query('SELECT * FROM users');
}
```

### Repository Pattern

```typescript
import { createRepository } from 'philjs-db';

const userRepository = createRepository({
  findById: (db, id: string) => {
    return db.user.findUnique({ where: { id } });
  },

  findByEmail: (db, email: string) => {
    return db.user.findUnique({ where: { email } });
  },

  create: (db, data: { name: string; email: string }) => {
    return db.user.create({ data });
  },

  update: (db, id: string, data: Partial<{ name: string; email: string }>) => {
    return db.user.update({ where: { id }, data });
  },

  delete: (db, id: string) => {
    return db.user.delete({ where: { id } });
  }
});

// Usage
const user = await userRepository.findById(prisma, '123');
```

### Soft Delete

```typescript
import { softDelete } from 'philjs-db';

// Mark as deleted instead of removing
await softDelete(prisma.user, { id: '123' });

// User is still in database with deletedAt timestamp
const user = await prisma.user.findUnique({ where: { id: '123' } });
console.log(user.deletedAt); // 2024-01-15T12:00:00.000Z

// Exclude soft-deleted records
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});
```

## API Reference

### Prisma

- `createPrismaClient(config)` - Create Prisma client instance
- `PrismaProvider` - Context provider for Prisma client
- `usePrisma()` - Access Prisma client in components
- `withPrisma(handler)` - Use Prisma in loaders/actions

### Drizzle

- `createDrizzleClient(client)` - Create Drizzle client wrapper
- `DrizzleProvider` - Context provider for Drizzle client
- `useDrizzle()` - Access Drizzle client in components
- `withDrizzle(handler)` - Use Drizzle in loaders/actions

### Supabase

- `createSupabaseClient(config)` - Create Supabase client
- `SupabaseProvider` - Context provider for Supabase client
- `useSupabase()` - Access Supabase client in components
- `useSupabaseAuth()` - Authentication helpers
- `useSupabaseStorage(bucket)` - Storage helpers
- `withSupabase(handler)` - Use Supabase in loaders/actions

### Utilities

- `paginate(model, options)` - Paginate database queries
- `withTransaction(client, callback)` - Execute transaction
- `createRepository(methods)` - Create data repository
- `softDelete(model, where)` - Soft delete record
- `createDatabaseConnection(config)` - Generic DB connection

## Examples

See the [examples](../../examples) directory for full working examples:
- [SaaS Starter](../../examples/saas-starter) - Prisma with auth
- [E-commerce](../../examples/storefront) - Product catalog
- [Dashboard](../../examples/dashboard) - Drizzle ORM

## Documentation

For more information, see the [PhilJS documentation](../../docs).

## License

MIT
