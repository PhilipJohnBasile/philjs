# @philjs/drizzle

Drizzle ORM adapter for PhilJS - type-safe SQL with signals.

## Installation

```bash
npm install @philjs/drizzle drizzle-orm
```

## Usage

```typescript
import { useDrizzle, useTransaction } from '@philjs/drizzle';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { usersTable } from './schema';

// Setup database
const sqlite = new Database('db.sqlite');
const db = drizzle(sqlite);

// In your component
function UserList() {
  const { query, mutation, invalidate } = useDrizzle(db);
  
  // Reactive query
  const users = query(
    () => db.select().from(usersTable).all(),
    { cacheKey: 'users' }
  );
  
  // Mutation
  const createUser = mutation(async (name: string) => {
    return db.insert(usersTable).values({ name }).returning();
  });
  
  const handleCreate = async () => {
    await createUser.mutate('New User');
    invalidate('users'); // Refetch users
  };
  
  if (users.loading()) return <div>Loading...</div>;
  if (users.error()) return <div>Error: {users.error()?.message}</div>;
  
  return (
    <div>
      <ul>
        {users()?.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
      <button onClick={handleCreate} disabled={createUser.loading()}>
        Add User
      </button>
    </div>
  );
}
```

## Transactions

```typescript
import { useTransaction } from '@philjs/drizzle';

function TransferFunds() {
  const tx = useTransaction(db);
  
  const handleTransfer = async () => {
    await tx.run(async (transaction) => {
      await transaction.update(accountsTable)
        .set({ balance: sql`balance - 100` })
        .where(eq(accountsTable.id, 1));
      await transaction.update(accountsTable)
        .set({ balance: sql`balance + 100` })
        .where(eq(accountsTable.id, 2));
    });
    
    if (tx.error()) {
      console.error('Transfer failed:', tx.error());
    }
  };
  
  return (
    <button onClick={handleTransfer} disabled={tx.loading()}>
      {tx.loading() ? 'Transferring...' : 'Transfer $100'}
    </button>
  );
}
```

## License

MIT
