# SuperJSON Quick Start Guide

Get started with SuperJSON in PhilJS in 5 minutes.

## Installation

SuperJSON is built into PhilJS core. No additional installation needed!

```bash
npm install @philjs/core @philjs/rpc @philjs/ssr
```

## Basic Usage

### 1. Simple Serialization

```typescript
import { serialize, deserialize } from '@philjs/core/superjson';

// Serialize complex data
const data = {
  created: new Date(),
  userId: 123456789n, // BigInt
  tags: new Set(['admin', 'editor']),
  metadata: new Map([['key', 'value']]),
};

const serialized = serialize(data);
const json = JSON.stringify(serialized);

// Send over network...

// Deserialize on the other side
const received = JSON.parse(json);
const restored = deserialize(received);

console.log(restored.created instanceof Date); // true
console.log(typeof restored.userId); // 'bigint'
console.log(restored.tags instanceof Set); // true
```

### 2. With RPC

```typescript
// server/api.ts
import { createAPI, procedure } from '@philjs/rpc';

export const api = createAPI({
  users: {
    getUser: procedure.query(async () => ({
      id: 123n,
      name: 'John',
      created: new Date(),
      roles: new Set(['admin']),
    })),
  },
});

// client.ts
import { createClient } from '@philjs/rpc/client';
import {
  createClientRequestTransformer,
  createClientResponseTransformer,
} from '@philjs/rpc';

const client = createClient({
  url: '/api/rpc',
  transformRequest: createClientRequestTransformer(),
  transformResponse: createClientResponseTransformer(),
});

// Use it - complex types work automatically!
const user = await client.users.getUser.fetch();
console.log(user.created instanceof Date); // true
console.log(user.roles instanceof Set); // true
```

### 3. With SSR

```typescript
// routes/user/[id].tsx
import { defineLoader } from '@philjs/ssr';
import { superJSONLoader } from '@philjs/ssr';

export const loader = superJSONLoader(
  defineLoader(async ({ params }) => ({
    user: {
      id: BigInt(params.id),
      created: new Date(),
      settings: new Map([
        ['theme', 'dark'],
        ['notifications', new Set(['email'])],
      ]),
    },
  }))
);

// Component automatically gets properly typed data
export default function UserPage() {
  const data = useLoaderData();

  return (
    <div>
      <h1>User {data.user.id}</h1>
      <p>Joined: {data.user.created.toLocaleDateString()}</p>
      <p>Theme: {data.user.settings.get('theme')}</p>
    </div>
  );
}
```

## Common Patterns

### Dates in API Responses

```typescript
// Before: Dates become strings
const response = { created: new Date() };
JSON.stringify(response); // '{"created":"2024-01-15T..."}'

// After: Dates preserved
import { stringify, parse } from '@philjs/core/superjson';
const json = stringify(response);
const parsed = parse(json);
console.log(parsed.created instanceof Date); // true
```

### BigInt for IDs

```typescript
// Large IDs that exceed Number.MAX_SAFE_INTEGER
const user = {
  id: 9007199254740991n + 1n, // Would lose precision with Number
  name: 'John',
};

const serialized = serialize(user);
const restored = deserialize(serialized);
console.log(typeof restored.id); // 'bigint'
console.log(restored.id === user.id); // true
```

### Collections (Map/Set)

```typescript
// User roles as a Set
const user = {
  roles: new Set(['admin', 'editor', 'viewer']),
  permissions: new Map([
    ['posts', new Set(['read', 'write'])],
    ['users', new Set(['read'])],
  ]),
};

const serialized = serialize(user);
const restored = deserialize(serialized);

// Check if user is admin
if (restored.roles.has('admin')) {
  console.log('Admin access granted');
}

// Check post permissions
const postPerms = restored.permissions.get('posts');
if (postPerms?.has('write')) {
  console.log('Can write posts');
}
```

### undefined Values

```typescript
// API with optional fields
const data = {
  name: 'John',
  middleName: undefined, // Optional field
  email: 'john@example.com',
};

const serialized = serialize(data);
const restored = deserialize(serialized);

console.log('middleName' in restored); // true
console.log(restored.middleName === undefined); // true
```

## Performance Tips

### 1. Compression for Large Data

```typescript
import {
  serializeWithCompression,
  deserializeWithDecompression,
  NativeCompression,
} from '@philjs/core/superjson-perf';

const largeData = { /* lots of data */ };

// Automatically compresses if beneficial
const compressed = await serializeWithCompression(largeData, {
  compression: NativeCompression,
  minCompressSize: 1024, // Only compress if > 1KB
});

const restored = await deserializeWithDecompression(compressed, {
  compression: NativeCompression,
});
```

### 2. Lazy Deserialization

```typescript
import { lazy } from '@philjs/core/superjson-perf';

// Don't deserialize until needed
const lazyData = lazy(serialized);

console.log(lazyData.isDeserialized()); // false

// Deserialize on first access
const data = lazyData.get();

console.log(lazyData.isDeserialized()); // true
```

### 3. Streaming for Large Datasets

```typescript
import {
  StreamingSerializer,
  StreamingDeserializer,
} from '@philjs/core/superjson-perf';

const serializer = new StreamingSerializer();
const deserializer = new StreamingDeserializer();

// Send chunks progressively
for (const chunk of serializer.serialize(largeData, 100)) {
  // Send chunk over network
  sendChunk(chunk);

  // Receive and process
  deserializer.addChunk(chunk);

  // Get partial results
  const partial = deserializer.getState();
  updateUI(partial);
}
```

## Custom Types

```typescript
import { registerCustomType } from '@philjs/core/superjson';

// Define your class
class Money {
  constructor(public amount: number, public currency: string) {}
}

// Register serialization
registerCustomType({
  name: 'Money',
  isApplicable: (v): v is Money => v instanceof Money,
  serialize: (m) => ({ amount: m.amount, currency: m.currency }),
  deserialize: (d: any) => new Money(d.amount, d.currency),
});

// Now it works automatically
const invoice = {
  total: new Money(99.99, 'USD'),
  created: new Date(),
};

const serialized = serialize(invoice);
const restored = deserialize(serialized);

console.log(restored.total instanceof Money); // true
console.log(restored.total.amount); // 99.99
```

## What Types Are Supported?

✅ Date
✅ Map
✅ Set
✅ RegExp
✅ BigInt
✅ undefined
✅ NaN, Infinity, -Infinity, -0
✅ Uint8Array, Int8Array, Float32Array (all TypedArrays)
✅ ArrayBuffer
✅ DataView
✅ Custom types (with registration)

## Migration from JSON.stringify/parse

```typescript
// Before
const json = JSON.stringify(data);
const parsed = JSON.parse(json);

// After
import { stringify, parse } from '@philjs/core/superjson';

const json = stringify(data);
const parsed = parse(json);

// That's it! Complex types now work.
```

## Debug Tips

### Check if serialization is needed

```typescript
import { needsSerialization } from '@philjs/core/superjson';

const data1 = { simple: 'string', number: 42 };
console.log(needsSerialization(data1)); // false

const data2 = { date: new Date(), map: new Map() };
console.log(needsSerialization(data2)); // true
```

### Inspect metadata

```typescript
const data = { date: new Date() };
const serialized = serialize(data);

console.log(serialized.meta);
// { values: { 'date': 'Date' } }
```

## Common Pitfalls

### ❌ Don't forget to deserialize

```typescript
// Wrong - using serialized data directly
const serialized = serialize(data);
console.log(serialized.json.date instanceof Date); // false

// Right - deserialize first
const deserialized = deserialize(serialized);
console.log(deserialized.date instanceof Date); // true
```

### ❌ Don't JSON.parse SuperJSON results

```typescript
// Wrong
const serialized = serialize(data);
const wrong = JSON.parse(JSON.stringify(serialized));
// You'll lose the metadata!

// Right
const json = JSON.stringify(serialized);
const parsed = JSON.parse(json);
const correct = deserialize(parsed);
```

### ✅ Use stringify/parse helpers

```typescript
// Better
import { stringify, parse } from '@philjs/core/superjson';

const json = stringify(data);
const parsed = parse(json);
```

## Next Steps

- Read the [full documentation](./SUPERJSON.md)
- Check out the [examples](./src/superjson-examples.ts)
- Explore [performance optimizations](./src/superjson-perf.ts)
- See [RPC integration](../@philjs/rpc/src/superjson.ts)
- Learn [SSR patterns](../@philjs/ssr/src/superjson.ts)

## Questions?

SuperJSON is designed to be a drop-in replacement for JSON.stringify/parse that "just works" with complex types. If you can stringify it with regular JSON, SuperJSON will handle it better.

Happy serializing! 🚀
