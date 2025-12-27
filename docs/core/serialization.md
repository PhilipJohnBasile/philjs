# SuperJSON for PhilJS

SuperJSON-style serialization for PhilJS with enhanced features for complex data types, performance optimizations, and seamless integration with RPC and SSR.

## Requirements

- **Node.js 24+** - Required for native ESM and ES2024 features
- **TypeScript 6+** - Required for optimal type inference

## Features

- **Complex Type Support**: Serialize Date, Map, Set, RegExp, BigInt, undefined, and binary data
- **Custom Type Registration**: Extend serialization for your own classes
- **Performance Optimizations**: Lazy deserialization, streaming, and compression
- **RPC Integration**: Automatic serialization in philjs-rpc procedures
- **SSR Integration**: Seamless loader data serialization and hydration
- **Type Safety**: Full TypeScript 6 support with enhanced type inference
- **ES2024 Support**: Native support for new Set methods and array operations

## Basic Usage

### Simple Serialization

```typescript
import { serialize, deserialize } from 'philjs-core/superjson';

const data = {
  created: new Date('2024-01-15'),
  tags: new Set(['typescript', 'react']),
  metadata: new Map([['version', '1.0']]),
};

// Serialize
const serialized = serialize(data);

// Deserialize
const deserialized = deserialize(serialized);
console.log(deserialized.created instanceof Date); // true
console.log(deserialized.tags instanceof Set); // true
```

### String Conversion

```typescript
import { stringify, parse } from 'philjs-core/superjson';

const data = { date: new Date(), bigint: 123n };
const json = stringify(data);
const parsed = parse(json);
```

## Supported Types

### Built-in Types

- **Date**: Full ISO 8601 serialization
- **Map**: Preserves key-value pairs with complex keys
- **Set**: Preserves unique values
- **RegExp**: Preserves source and flags
- **BigInt**: Handles arbitrary precision integers
- **undefined**: Correctly serializes undefined values
- **Special Numbers**: NaN, Infinity, -Infinity, -0
- **TypedArrays**: Uint8Array, Int8Array, Float32Array, etc.
- **ArrayBuffer**: Raw binary data
- **DataView**: Binary data views

### Example

```typescript
const data = {
  // Dates
  created: new Date('2024-01-15'),

  // Collections
  userRoles: new Map([
    ['user1', new Set(['admin', 'editor'])],
    ['user2', new Set(['viewer'])],
  ]),

  // Numbers
  userId: 123456789012345n, // BigInt
  score: NaN,
  limit: Infinity,

  // Regular expressions
  emailPattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,

  // Binary data
  buffer: new Uint8Array([1, 2, 3, 4, 5]),

  // Undefined
  optional: undefined,
};

const serialized = serialize(data);
const deserialized = deserialize(serialized);
```

## Custom Types

### Register Custom Types

```typescript
import { registerCustomType } from 'philjs-core/superjson';

class Point {
  constructor(public x: number, public y: number) {}

  distance(other: Point): number {
    return Math.sqrt(
      Math.pow(this.x - other.x, 2) +
      Math.pow(this.y - other.y, 2)
    );
  }
}

registerCustomType({
  name: 'Point',
  isApplicable: (value): value is Point => value instanceof Point,
  serialize: (point) => ({ x: point.x, y: point.y }),
  deserialize: (data) => {
    const { x, y } = data as { x: number; y: number };
    return new Point(x, y);
  },
});

const point = new Point(10, 20);
const serialized = serialize(point);
const deserialized = deserialize<Point>(serialized);
console.log(deserialized instanceof Point); // true
```

### Per-Operation Custom Types

```typescript
import { serialize, deserialize } from 'philjs-core/superjson';

const customTypes = [
  {
    name: 'CustomClass',
    isApplicable: (v) => v instanceof CustomClass,
    serialize: (v) => v.toJSON(),
    deserialize: (v) => CustomClass.fromJSON(v),
  },
];

const serialized = serialize(data, { customTypes });
const deserialized = deserialize(serialized, { customTypes });
```

## RPC Integration

### Automatic Serialization

```typescript
import { createAPI, procedure } from 'philjs-rpc';
import { createSuperJSONMiddleware } from 'philjs-rpc';

// Create API with SuperJSON middleware
const middleware = createSuperJSONMiddleware({
  enabled: true,
});

export const api = createAPI({
  users: {
    getById: procedure
      .input(z.object({ id: z.bigint() }))
      .query(async ({ input }) => {
        return {
          id: input.id,
          name: 'John Doe',
          created: new Date(),
          tags: new Set(['admin', 'editor']),
        };
      }),
  },
});
```

### Client-Side Usage

```typescript
import { createClient } from 'philjs-rpc/client';
import { createClientRequestTransformer, createClientResponseTransformer } from 'philjs-rpc';

const client = createClient({
  url: '/api/rpc',
  transformRequest: createClientRequestTransformer(),
  transformResponse: createClientResponseTransformer(),
});

// Automatically handles Date, Set, BigInt, etc.
const user = await client.users.getById.fetch({ id: 123n });
console.log(user.created instanceof Date); // true
console.log(user.tags instanceof Set); // true
```

### Per-Procedure Control

```typescript
import { withSuperJSON, withoutSuperJSON } from 'philjs-rpc';

const api = createAPI({
  users: {
    // Enable SuperJSON
    getUser: withSuperJSON(
      procedure.query(async () => ({
        created: new Date(),
        metadata: new Map(),
      }))
    ),

    // Disable SuperJSON (plain JSON)
    getPlainData: withoutSuperJSON(
      procedure.query(async () => ({
        value: 'plain string',
      }))
    ),
  },
});
```

## SSR Integration

### Loader Serialization

```typescript
import { defineLoader } from 'philjs-ssr';
import { superJSONLoader } from 'philjs-ssr';

export const loader = superJSONLoader(
  defineLoader(async ({ params }) => {
    return {
      user: {
        id: BigInt(params.userId),
        created: new Date(),
        preferences: new Map([
          ['theme', 'dark'],
          ['notifications', new Set(['email', 'push'])],
        ]),
      },
      posts: await db.posts.findMany({
        where: { userId: params.userId },
      }),
    };
  })
);
```

### Hydration

```typescript
import { createLoaderDataSerializer } from 'philjs-ssr';

// Server-side
const serializer = createLoaderDataSerializer();
serializer.add('user-data', loaderResult);

const html = `
<!DOCTYPE html>
<html>
  <head>
    ${serializer.toHTML()}
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
`;
```

```typescript
// Client-side
import { createLoaderDataAccessor } from 'philjs-ssr';

const accessor = createLoaderDataAccessor();
const userData = accessor.get('user-data');

console.log(userData.user.created instanceof Date); // true
console.log(userData.user.preferences instanceof Map); // true
```

## Performance Optimizations

### Compression

```typescript
import { serializeWithCompression, deserializeWithDecompression, NativeCompression } from 'philjs-core/superjson-perf';

// Serialize with compression
const compressed = await serializeWithCompression(largeData, {
  compression: NativeCompression,
  minCompressSize: 1024, // Only compress if > 1KB
});

// Decompress
const data = await deserializeWithDecompression(compressed, {
  compression: NativeCompression,
});
```

### Lazy Deserialization

```typescript
import { lazy, lazyObject } from 'philjs-core/superjson-perf';

// Create lazy values
const lazyData = lazy(serialized);

console.log(lazyData.isDeserialized()); // false

// Deserialize on first access
const data = lazyData.get();

console.log(lazyData.isDeserialized()); // true
```

### Streaming

```typescript
import { StreamingSerializer, StreamingDeserializer } from 'philjs-core/superjson-perf';

// Server-side: Stream large datasets
const serializer = new StreamingSerializer();
for (const chunk of serializer.serialize(largeData, 100)) {
  sendChunk(chunk);
}

// Client-side: Deserialize as chunks arrive
const deserializer = new StreamingDeserializer();
for await (const chunk of receiveChunks()) {
  deserializer.addChunk(chunk);

  // Get partial data
  const partial = deserializer.getState();
  updateUI(partial);
}
```

### Performance Metrics

```typescript
import { serializeWithMetrics, deserializeWithMetrics } from 'philjs-core/superjson-perf';

const { result, metrics } = await serializeWithMetrics(data, {
  compression: NativeCompression,
});

console.log('Serialize time:', metrics.serializeTime, 'ms');
console.log('Original size:', metrics.originalSize, 'bytes');
console.log('Compressed size:', metrics.compressedSize, 'bytes');
console.log('Compression ratio:', metrics.compressionRatio);
```

## Advanced Features

### Reference Deduplication

```typescript
const shared = { value: 'shared' };
const data = {
  a: shared,
  b: shared,
};

const serialized = serialize(data, { dedupe: true });
// Shared references are tracked and restored
```

### Max Depth Limit

```typescript
const deepData = {
  level1: {
    level2: {
      level3: {
        level4: 'too deep',
      },
    },
  },
};

const serialized = serialize(deepData, { maxDepth: 2 });
// Only serializes up to level 2
```

### Custom SuperJSON Instance

```typescript
import { createSuperJSON } from 'philjs-core/superjson';

const sj = createSuperJSON([
  {
    name: 'MyClass',
    isApplicable: (v) => v instanceof MyClass,
    serialize: (v) => v.toJSON(),
    deserialize: (v) => MyClass.fromJSON(v),
  },
]);

const serialized = sj.serialize(data);
const deserialized = sj.deserialize(serialized);
```

## API Reference

### Core Functions

#### `serialize(data, options?)`
Serialize data with complex type support.

**Options:**
- `dedupe?: boolean` - Enable reference deduplication (default: true)
- `maxDepth?: number` - Maximum serialization depth (default: Infinity)
- `customTypes?: CustomTypeHandler[]` - Custom type handlers

#### `deserialize<T>(result, options?)`
Deserialize data with type restoration.

**Options:**
- `customTypes?: CustomTypeHandler[]` - Custom type handlers

#### `stringify(data, options?)`
Serialize and convert to JSON string.

#### `parse<T>(json, options?)`
Parse JSON string and deserialize.

### Custom Types

#### `registerCustomType(handler)`
Register a custom type handler globally.

#### `getCustomTypes()`
Get all registered custom type handlers.

#### `clearCustomTypes()`
Clear all registered custom type handlers.

### Performance

#### `serializeWithCompression(data, options?)`
Serialize with compression support.

#### `deserializeWithDecompression<T>(result, options?)`
Deserialize with decompression support.

#### `lazy<T>(serialized, options?)`
Create a lazy-deserialized value.

#### `StreamingSerializer`
Stream large datasets for progressive serialization.

#### `StreamingDeserializer<T>`
Deserialize streaming data progressively.

## Best Practices

1. **Use compression for large payloads** (> 1KB)
2. **Enable lazy deserialization** for data that may not be immediately needed
3. **Stream large datasets** instead of serializing all at once
4. **Register custom types globally** if used throughout your app
5. **Use per-procedure options** for fine-grained control in RPC
6. **Monitor performance metrics** in production
7. **Set appropriate maxDepth** to prevent circular reference issues

## ES2024 Serialization Support

PhilJS SuperJSON supports ES2024 features:

```typescript
import { serialize, deserialize } from 'philjs-core/superjson';

// Set operations are preserved
const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4]);

const data = {
  union: setA.union(setB),           // Set {1, 2, 3, 4}
  intersection: setA.intersection(setB),  // Set {2, 3}
  difference: setA.difference(setB),      // Set {1}
};

const serialized = serialize(data);
const restored = deserialize(serialized);
// All Set operations are correctly restored
```

### Using with Object.groupBy()

```typescript
const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
];

const grouped = Object.groupBy(users, user => user.role);
const serialized = serialize(grouped);
// Groups are preserved through serialization
```

## Comparison with tRPC's SuperJSON

PhilJS SuperJSON is inspired by tRPC's SuperJSON but includes additional features:

- **Streaming support** for large datasets
- **Compression** for optimized network transfer
- **Lazy deserialization** for better performance
- **Deep SSR integration** with automatic hydration
- **Performance metrics** for monitoring
- **More TypedArray support** for binary data
- **Built-in examples** and comprehensive documentation

## Browser Compatibility

- **Chrome 120+**: Full ES2024 support including compression
- **Firefox 121+**: Full support
- **Safari 17.4+**: Full support
- **Node.js 24+**: Full support with native APIs

PhilJS SuperJSON requires ES2024-compatible environments. No polyfills are needed for supported browsers.

## License

MIT
