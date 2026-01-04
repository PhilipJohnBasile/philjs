# Transactions

This guide covers transaction handling in @philjs/db, including modern TypeScript 6 `using` syntax, callback patterns, and provider-specific behavior.

## Overview

Transactions ensure that multiple database operations are executed atomically - either all succeed or all fail. @philjs/db provides a unified transaction API that works across Prisma, Drizzle, and Supabase.

## TypeScript 6 `using` Syntax

The modern way to handle transactions using `Symbol.asyncDispose`:

```typescript
import { createTransaction, create, update } from '@philjs/db';

async function transferFunds(fromId: string, toId: string, amount: number) {
  // Transaction automatically rolls back if not committed
  await using tx = await createTransaction(db);

  // Debit source account
  await update(tx.client, 'accounts',
    { id: fromId },
    { balance: { decrement: amount } }
  );

  // Credit destination account
  await update(tx.client, 'accounts',
    { id: toId },
    { balance: { increment: amount } }
  );

  // Commit the transaction
  await tx.commit();
  // If commit() is not called, transaction is rolled back on scope exit
}
```

### How It Works

The `Transaction` class implements `Symbol.asyncDispose`:

```typescript
class Transaction {
  async [Symbol.asyncDispose](): Promise<void> {
    if (!this._committed && !this._rolledBack) {
      // Auto-rollback if not explicitly committed
      await this.rollback();
    }
  }
}
```

This ensures that:
- If an exception is thrown, the transaction is rolled back
- If you forget to commit, the transaction is rolled back
- Resources are properly cleaned up

### Error Handling

```typescript
async function createUserWithProfile(userData, profileData) {
  await using tx = await createTransaction(db);

  try {
    const user = await create(tx.client, 'users', userData);
    const profile = await create(tx.client, 'profiles', {
      ...profileData,
      userId: user.id,
    });

    await tx.commit();
    return { user, profile };
  } catch (error) {
    // Transaction automatically rolls back due to using syntax
    console.error('Failed to create user:', error);
    throw error;
  }
}
```

## Callback Pattern

For environments that don't support `using` or for simpler use cases:

### transaction()

```typescript
import { transaction } from '@philjs/db';

const result = await transaction(db, async (tx) => {
  const user = await create(tx.client, 'users', {
    name: 'John',
    email: 'john@example.com',
  });

  const profile = await create(tx.client, 'profiles', {
    userId: user.id,
    bio: 'Hello World',
  });

  return { user, profile };
});

// Transaction is automatically committed if no error
// Automatically rolled back if an error is thrown
```

### withTransaction()

A simpler wrapper for basic transaction needs:

```typescript
import { withTransaction } from '@philjs/db';

await withTransaction(db, async (tx) => {
  await tx.user.update({
    where: { id: '123' },
    data: { status: 'active' },
  });

  await tx.auditLog.create({
    data: {
      action: 'USER_ACTIVATED',
      userId: '123',
    },
  });
});
```

## Transaction Control

### Manual Commit/Rollback

```typescript
import { createTransaction } from '@philjs/db';

async function processOrder(orderId: string) {
  const tx = await createTransaction(db);

  try {
    const order = await getOrder(tx.client, orderId);

    // Validate stock
    const hasStock = await checkStock(tx.client, order.items);
    if (!hasStock) {
      await tx.rollback();
      return { success: false, error: 'Insufficient stock' };
    }

    // Process payment
    const paymentResult = await processPayment(order.total);
    if (!paymentResult.success) {
      await tx.rollback();
      return { success: false, error: 'Payment failed' };
    }

    // Update order status
    await update(tx.client, 'orders', { id: orderId }, { status: 'paid' });

    // Commit only if everything succeeded
    await tx.commit();
    return { success: true };
  } catch (error) {
    // Manual rollback on error
    if (tx.isActive) {
      await tx.rollback();
    }
    throw error;
  }
}
```

### Checking Transaction State

```typescript
const tx = await createTransaction(db);

console.log(tx.isActive);  // true - transaction is open

await tx.commit();
console.log(tx.isActive);  // false - transaction is closed

// Or after rollback
await tx.rollback();
console.log(tx.isActive);  // false - transaction is closed
```

## TransactionRollbackError

When a rollback occurs, a `TransactionRollbackError` is thrown:

```typescript
import { createTransaction, TransactionRollbackError } from '@philjs/db';

try {
  await using tx = await createTransaction(db);

  // Explicit rollback
  await tx.rollback();
} catch (error) {
  if (error instanceof TransactionRollbackError) {
    console.log('Transaction was rolled back');
    // Handle rollback gracefully
  } else {
    // Handle other errors
    throw error;
  }
}
```

## Provider-Specific Behavior

### Prisma

Prisma uses interactive transactions:

```typescript
// @philjs/db wraps Prisma's $transaction
await transaction(prismaClient, async (tx) => {
  // tx.client is the Prisma transaction client
  await tx.client.user.create({ data: { name: 'John' } });
  await tx.client.post.create({ data: { title: 'Hello', authorId: 1 } });
});

// Equivalent Prisma code:
await prismaClient.$transaction(async (prisma) => {
  await prisma.user.create({ data: { name: 'John' } });
  await prisma.post.create({ data: { title: 'Hello', authorId: 1 } });
});
```

Prisma transaction options:

```typescript
// With timeout
await prismaClient.$transaction(
  async (prisma) => { /* ... */ },
  {
    maxWait: 5000,     // Max time to acquire a connection
    timeout: 10000,    // Max time for transaction
    isolationLevel: 'Serializable',
  }
);
```

### Drizzle

Drizzle uses callback-based transactions:

```typescript
// @philjs/db wraps Drizzle's transaction
await transaction(drizzleDb, async (tx) => {
  await tx.client.insert(users).values({ name: 'John' });
  await tx.client.insert(posts).values({ title: 'Hello', authorId: 1 });
});

// Equivalent Drizzle code:
await drizzleDb.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'John' });
  await tx.insert(posts).values({ title: 'Hello', authorId: 1 });
});
```

### Supabase

Supabase has limited transaction support:

```typescript
await transaction(supabase, async (tx) => {
  // Note: Supabase uses RPC functions for transactions
  // Operations are executed but not truly transactional
  console.warn('Supabase does not support full transactions');

  await tx.client.from('users').insert({ name: 'John' });
  await tx.client.from('posts').insert({ title: 'Hello' });
});
```

For true transaction support with Supabase, use PostgreSQL functions:

```sql
-- In Supabase SQL editor
CREATE OR REPLACE FUNCTION transfer_funds(
  from_account_id UUID,
  to_account_id UUID,
  amount DECIMAL
) RETURNS VOID AS $$
BEGIN
  -- Debit
  UPDATE accounts
  SET balance = balance - amount
  WHERE id = from_account_id;

  -- Credit
  UPDATE accounts
  SET balance = balance + amount
  WHERE id = to_account_id;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Call the function
const { error } = await supabase.rpc('transfer_funds', {
  from_account_id: fromId,
  to_account_id: toId,
  amount: 100.00,
});
```

## Nested Transactions

### Savepoints

Some databases support savepoints for nested transactions:

```typescript
async function processWithSavepoint(db) {
  await using tx = await createTransaction(db);

  // First operation
  await create(tx.client, 'orders', orderData);

  try {
    // Nested operation that might fail
    await processPayment(tx.client);
  } catch (error) {
    // Only rollback the payment part
    // Order creation is preserved
    console.log('Payment failed, but order is preserved');
  }

  await tx.commit();
}
```

### Prisma Nested Transactions

Prisma supports nested `$transaction` calls:

```typescript
await prismaClient.$transaction(async (tx) => {
  await tx.user.create({ data: { name: 'John' } });

  // Nested transaction (uses savepoint internally)
  await tx.$transaction(async (innerTx) => {
    await innerTx.post.create({ data: { title: 'Hello' } });
  });
});
```

## Best Practices

### 1. Keep Transactions Short

Long transactions hold locks and can cause deadlocks:

```typescript
// Bad - long transaction
await transaction(db, async (tx) => {
  const users = await fetchAllUsers(tx.client);  // Slow query
  await processUsers(users);                      // Slow processing
  await updateUsers(tx.client, users);            // Database locked for too long
});

// Good - minimize transaction time
const users = await fetchAllUsers(db);  // Outside transaction
const processedUsers = await processUsers(users);  // Outside transaction

await transaction(db, async (tx) => {
  await updateUsers(tx.client, processedUsers);  // Quick update only
});
```

### 2. Handle Errors Explicitly

```typescript
async function safeTransaction() {
  try {
    await using tx = await createTransaction(db);

    await performOperations(tx.client);
    await tx.commit();

    return { success: true };
  } catch (error) {
    if (error instanceof TransactionRollbackError) {
      return { success: false, reason: 'Transaction was rolled back' };
    }
    throw error;
  }
}
```

### 3. Use Appropriate Isolation Levels

```typescript
// Prisma with isolation level
await prismaClient.$transaction(
  async (tx) => { /* ... */ },
  { isolationLevel: 'ReadCommitted' }  // Or: Serializable, RepeatableRead
);
```

Isolation levels:
- `ReadUncommitted` - Fastest, allows dirty reads
- `ReadCommitted` - Default, prevents dirty reads
- `RepeatableRead` - Prevents non-repeatable reads
- `Serializable` - Strictest, prevents phantom reads

### 4. Avoid Side Effects

Don't perform irreversible operations inside transactions:

```typescript
// Bad - email sent even if transaction rolls back
await transaction(db, async (tx) => {
  await createOrder(tx.client, orderData);
  await sendConfirmationEmail(user.email);  // Can't undo this!
  await processPayment(tx.client);  // Might fail
});

// Good - side effects after transaction
const order = await transaction(db, async (tx) => {
  const order = await createOrder(tx.client, orderData);
  await processPayment(tx.client);
  return order;
});

// Only send email after successful commit
await sendConfirmationEmail(user.email);
```

### 5. Use Transactions for Related Operations

```typescript
// Bad - not atomic
const user = await create(db, 'users', userData);
const profile = await create(db, 'profiles', { userId: user.id });  // Orphaned if fails

// Good - atomic
const { user, profile } = await transaction(db, async (tx) => {
  const user = await create(tx.client, 'users', userData);
  const profile = await create(tx.client, 'profiles', { userId: user.id });
  return { user, profile };
});
```

## Retry Logic

Implement retry for transient failures:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 100
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Only retry on transient errors
      if (isTransientError(error)) {
        await sleep(delay * Math.pow(2, i));  // Exponential backoff
        continue;
      }
      throw error;
    }
  }

  throw lastError!;
}

function isTransientError(error: any): boolean {
  const transientCodes = ['40001', '40P01', 'P0001'];  // Serialization/deadlock
  return transientCodes.includes(error?.code);
}

// Usage
const result = await withRetry(() =>
  transaction(db, async (tx) => {
    // Operations that might have contention
  })
);
```

## Monitoring Transactions

```typescript
import { createTransaction } from '@philjs/db';

async function monitoredTransaction<T>(
  db: any,
  name: string,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await transaction(db, fn);

    console.log(`Transaction '${name}' completed in ${Date.now() - startTime}ms`);
    return result;
  } catch (error) {
    console.error(`Transaction '${name}' failed after ${Date.now() - startTime}ms:`, error);
    throw error;
  }
}

// Usage
await monitoredTransaction(db, 'create-user', async (tx) => {
  // ...
});
```

## Type Definitions

```typescript
/**
 * Transaction context that implements Symbol.asyncDispose
 */
class Transaction {
  /** Get the transaction client for operations */
  get client(): any;

  /** Commit the transaction */
  async commit(): Promise<void>;

  /** Rollback the transaction */
  async rollback(): Promise<void>;

  /** Check if transaction is active */
  get isActive(): boolean;

  /** Symbol.asyncDispose implementation */
  async [Symbol.asyncDispose](): Promise<void>;
}

/**
 * Transaction rollback error
 */
class TransactionRollbackError extends Error {
  name: 'TransactionRollbackError';
}

/**
 * Create a disposable transaction
 */
function createTransaction(db: any): Promise<Transaction>;

/**
 * Execute operations within a transaction (callback style)
 */
function transaction<T>(
  db: any,
  fn: (tx: Transaction) => Promise<T>
): Promise<T>;

/**
 * Simple transaction wrapper
 */
function withTransaction<T>(
  db: any,
  fn: (tx: any) => Promise<T>
): Promise<T>;
```

## Next Steps

- [Queries](./queries.md) - Query building
- [Migrations](./migrations.md) - Database migrations
- [Schema](./schema.md) - Schema validation
