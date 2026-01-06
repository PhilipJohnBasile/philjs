/**
 * SuperJSON Usage Examples
 * Demonstrates various use cases for SuperJSON serialization
 */
import { serialize, deserialize, stringify, parse, registerCustomType, createSuperJSON, } from './superjson.js';
import { serializeWithCompression, deserializeWithDecompression, lazy, lazyObject, StreamingSerializer, StreamingDeserializer, NativeCompression, LZCompression, } from './superjson-perf.js';
// ============================================================================
// Basic Examples
// ============================================================================
/**
 * Example 1: Basic Date serialization
 */
export function exampleBasicDate() {
    const data = {
        created: new Date('2024-01-15T10:30:00Z'),
        updated: new Date('2024-01-16T14:20:00Z'),
    };
    // Serialize
    const serialized = serialize(data);
    console.log('Serialized:', JSON.stringify(serialized, null, 2));
    // Deserialize
    const deserialized = deserialize(serialized);
    console.log('Created:', deserialized.created instanceof Date);
    console.log('Updated:', deserialized.updated instanceof Date);
    return deserialized;
}
/**
 * Example 2: Map and Set serialization
 */
export function exampleMapAndSet() {
    const data = {
        userRoles: new Map([
            ['user1', new Set(['admin', 'editor'])],
            ['user2', new Set(['viewer'])],
        ]),
        settings: new Map([
            ['theme', 'dark'],
            ['language', 'en'],
        ]),
    };
    const serialized = serialize(data);
    const deserialized = deserialize(serialized);
    console.log('UserRoles is Map:', deserialized.userRoles instanceof Map);
    console.log('User1 roles:', deserialized.userRoles.get('user1'));
    return deserialized;
}
/**
 * Example 3: Complex nested structures
 */
export function exampleComplexStructure() {
    const data = {
        user: {
            id: 123n, // BigInt
            name: 'John Doe',
            registered: new Date('2024-01-01'),
            preferences: {
                notifications: new Set(['email', 'push']),
                filters: /^important/i, // RegExp
            },
        },
        posts: new Map([
            [1, { title: 'First Post', views: undefined }], // undefined
            [2, { title: 'Second Post', views: 42 }],
        ]),
        metadata: {
            version: 1.0,
            data: new Uint8Array([1, 2, 3, 4, 5]), // TypedArray
            score: NaN, // Special number
            infinity: Infinity,
        },
    };
    const serialized = serialize(data);
    const deserialized = deserialize(serialized);
    console.log('User ID is BigInt:', typeof deserialized.user.id === 'bigint');
    console.log('Notifications is Set:', deserialized.user.preferences.notifications instanceof Set);
    console.log('Filter is RegExp:', deserialized.user.preferences.filters instanceof RegExp);
    console.log('Posts is Map:', deserialized.posts instanceof Map);
    console.log('Data is Uint8Array:', deserialized.metadata.data instanceof Uint8Array);
    console.log('Score is NaN:', Number.isNaN(deserialized.metadata.score));
    return deserialized;
}
// ============================================================================
// Custom Type Examples
// ============================================================================
/**
 * Example 4: Custom class serialization
 */
export function exampleCustomClass() {
    // Define a custom class
    class Point {
        x;
        y;
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        distance(other) {
            return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
        }
    }
    // Type guard for Point
    function isPoint(value) {
        return value instanceof Point;
    }
    // Create a custom type handler
    const pointHandler = {
        name: 'Point',
        isApplicable: isPoint,
        serialize: (point) => ({ x: point.x, y: point.y }),
        deserialize: (data) => {
            const { x, y } = data;
            return new Point(x, y);
        },
    };
    const data = {
        start: new Point(0, 0),
        end: new Point(10, 10),
    };
    const serialized = serialize(data, { customTypes: [pointHandler] });
    const deserialized = deserialize(serialized, { customTypes: [pointHandler] });
    console.log('Start is Point:', deserialized.start instanceof Point);
    console.log('Distance:', deserialized.start.distance(deserialized.end));
    return deserialized;
}
/**
 * Example 5: Global custom type registration
 */
export function exampleGlobalCustomTypes() {
    class Color {
        hex;
        constructor(hex) {
            this.hex = hex;
        }
        toRGB() {
            const hex = this.hex.replace('#', '');
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16),
            };
        }
    }
    // Type guard for Color
    function isColor(value) {
        return value instanceof Color;
    }
    // Register globally
    registerCustomType({
        name: 'Color',
        isApplicable: isColor,
        serialize: (color) => isColor(color) ? color.hex : String(color),
        deserialize: (hex) => new Color(hex),
    });
    const sj = createSuperJSON();
    const data = {
        primary: new Color('#FF0000'),
        secondary: new Color('#00FF00'),
    };
    const json = sj.stringify(data);
    const parsed = sj.parse(json);
    console.log('Primary is Color:', parsed.primary instanceof Color);
    return parsed;
}
// ============================================================================
// Performance Examples
// ============================================================================
/**
 * Example 6: Compression for large payloads
 */
export async function exampleCompression() {
    // Create a large dataset
    const data = {
        users: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `User ${i}`,
            email: `user${i}@example.com`,
            created: new Date(),
            tags: new Set(['user', 'active']),
        })),
    };
    // Serialize with compression
    const compressed = await serializeWithCompression(data, {
        compression: NativeCompression,
        minCompressSize: 1024,
    });
    console.log('Compressed:', 'compressed' in compressed);
    if ('compressed' in compressed) {
        console.log('Original size:', compressed.originalSize);
        console.log('Compressed size:', compressed.compressed.length);
        console.log('Ratio:', compressed.originalSize / compressed.compressed.length);
    }
    // Decompress
    const decompressed = await deserializeWithDecompression(compressed, {
        compression: NativeCompression,
    });
    console.log('Users count:', decompressed.users.length);
    console.log('First user created:', decompressed.users[0]?.created instanceof Date);
    return decompressed;
}
/**
 * Example 7: Lazy deserialization
 */
export function exampleLazyDeserialization() {
    const data = {
        metadata: { name: 'Test', version: 1 },
        largeData: Array.from({ length: 10000 }, (_, i) => ({
            id: i,
            data: new Date(),
        })),
    };
    // Serialize parts separately
    const metadataSerialized = serialize(data.metadata);
    const largeDataSerialized = serialize(data.largeData);
    // Create lazy values
    const lazyData = {
        metadata: lazy(metadataSerialized),
        largeData: lazy(largeDataSerialized),
    };
    console.log('Metadata deserialized?', lazyData.metadata.isDeserialized());
    // Access metadata (deserializes on first access)
    const metadata = lazyData.metadata.get();
    console.log('Metadata deserialized?', lazyData.metadata.isDeserialized());
    // Large data is still not deserialized
    console.log('Large data deserialized?', lazyData.largeData.isDeserialized());
    return { metadata, lazyLargeData: lazyData.largeData };
}
/**
 * Example 8: Streaming serialization/deserialization
 */
export async function exampleStreaming() {
    const data = {
        users: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            name: `User ${i}`,
            created: new Date(),
        })),
    };
    // Create streaming serializer
    const serializer = new StreamingSerializer();
    const deserializer = new StreamingDeserializer();
    // Stream chunks
    for (const chunk of serializer.serialize(data, 10)) {
        console.log('Chunk:', chunk.path, 'Final:', chunk.final);
        // Process chunk
        deserializer.addChunk(chunk);
        // Get partial state
        const partial = deserializer.getState();
        console.log('Partial keys:', Object.keys(partial));
    }
    // Get final result
    const result = deserializer.getState();
    return result;
}
/**
 * Example 9: RPC with SuperJSON (would be used with philjs-rpc)
 */
export function exampleRPCIntegration() {
    // This example shows the data structures, actual RPC integration
    // is in philjs-rpc/src/superjson.ts
    // Server response
    const serverData = {
        id: 123456789012345n,
        name: 'John Doe',
        created: new Date(),
        tags: new Set(['admin', 'editor']),
    };
    // Serialize for transport
    const serialized = serialize(serverData);
    const json = JSON.stringify(serialized);
    // Client receives and deserializes
    const received = JSON.parse(json);
    const clientData = deserialize(received);
    console.log('ID is BigInt:', typeof clientData.id === 'bigint');
    console.log('Created is Date:', clientData.created instanceof Date);
    console.log('Tags is Set:', clientData.tags instanceof Set);
    return clientData;
}
/**
 * Example 10: SSR loader data serialization
 */
export function exampleSSRLoader() {
    // This example shows the data structures, actual SSR integration
    // is in philjs-ssr/src/superjson.ts
    // Loader returns complex data
    const loaderData = {
        user: {
            id: 123n,
            name: 'John',
            registered: new Date('2024-01-01'),
        },
        posts: new Map([
            [1, { title: 'First', published: new Date('2024-01-15') }],
            [2, { title: 'Second', published: new Date('2024-01-16') }],
        ]),
        settings: {
            theme: 'dark',
            notifications: new Set(['email', 'push']),
        },
    };
    // Serialize for SSR
    const serialized = serialize(loaderData);
    // In HTML: <script>window.__LOADER_DATA__ = {...}</script>
    const scriptContent = JSON.stringify(serialized);
    // Client-side hydration
    const hydrated = deserialize(serialized);
    console.log('Notifications:', hydrated.settings.notifications);
    return { hydrated, scriptContent };
}
// ============================================================================
// Edge Cases Examples
// ============================================================================
/**
 * Example 11: Handling edge cases
 */
export function exampleEdgeCases() {
    const data = {
        // Special numbers
        nan: NaN,
        infinity: Infinity,
        negInfinity: -Infinity,
        negZero: -0,
        // Undefined
        undef: undefined,
        nullValue: null,
        // Empty collections
        emptyMap: new Map(),
        emptySet: new Set(),
        emptyArray: [],
        emptyObject: {},
        // Nested undefined
        nested: {
            value: undefined,
            array: [1, undefined, 3],
        },
    };
    const serialized = serialize(data);
    const deserialized = deserialize(serialized);
    console.log('NaN:', Number.isNaN(deserialized.nan));
    console.log('Infinity:', deserialized.infinity === Infinity);
    console.log('Neg Zero:', Object.is(deserialized.negZero, -0));
    console.log('Undefined:', deserialized.undef === undefined);
    console.log('Null:', deserialized.nullValue === null);
    console.log('Empty Map:', deserialized.emptyMap instanceof Map);
    console.log('Nested undefined:', deserialized.nested.value === undefined);
    return deserialized;
}
// ============================================================================
// Run All Examples
// ============================================================================
/**
 * Run all examples (for testing/demonstration).
 */
export async function runAllExamples() {
    exampleBasicDate();
    exampleMapAndSet();
    console.log('\n=== Example 3: Complex Structure ===');
    exampleComplexStructure();
    exampleCustomClass();
    console.log('\n=== Example 5: Global Custom Types ===');
    exampleGlobalCustomTypes();
    await exampleCompression();
    console.log('\n=== Example 7: Lazy Deserialization ===');
    exampleLazyDeserialization();
    await exampleStreaming();
    console.log('\n=== Example 9: RPC Integration ===');
    exampleRPCIntegration();
    exampleSSRLoader();
    exampleEdgeCases();
}
//# sourceMappingURL=superjson-examples.js.map