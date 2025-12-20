import { describe, it, expect } from 'vitest';
import {
  serialize,
  deserialize,
  registerCustomType,
  clearCustomTypes,
} from './superjson.js';

import {
  serializeWithCompression,
  deserializeWithDecompression,
  lazy,
  lazyObject,
  StreamingSerializer,
  StreamingDeserializer,
  LZCompression,
  serializeWithMetrics,
  deserializeWithMetrics,
} from './superjson-perf.js';

describe('SuperJSON Integration Tests', () => {
  describe('Real-world RPC scenario', () => {
    it('should handle typical API response', () => {
      interface User {
        id: bigint;
        name: string;
        email: string;
        created: Date;
        lastLogin: Date | null;
        roles: Set<string>;
        metadata: Map<string, unknown>;
        settings: {
          theme: string;
          notifications: Set<string>;
          preferences: Map<string, string>;
        };
      }

      const serverData: User = {
        id: 123456789012345n,
        name: 'John Doe',
        email: 'john@example.com',
        created: new Date('2024-01-01T00:00:00Z'),
        lastLogin: new Date('2024-01-15T10:30:00Z'),
        roles: new Set(['admin', 'editor']),
        metadata: new Map([
          ['version', '1.0'],
          ['buildDate', new Date('2024-01-10')],
        ]),
        settings: {
          theme: 'dark',
          notifications: new Set(['email', 'push', 'sms']),
          preferences: new Map([
            ['language', 'en'],
            ['timezone', 'UTC'],
          ]),
        },
      };

      // Server serializes
      const serialized = serialize(serverData);

      // Client deserializes
      const clientData = deserialize<User>(serialized);

      // Verify all types are restored correctly
      expect(typeof clientData.id).toBe('bigint');
      expect(clientData.id).toBe(123456789012345n);
      expect(clientData.created).toBeInstanceOf(Date);
      expect(clientData.lastLogin).toBeInstanceOf(Date);
      expect(clientData.roles).toBeInstanceOf(Set);
      expect(clientData.roles.has('admin')).toBe(true);
      expect(clientData.metadata).toBeInstanceOf(Map);
      expect(clientData.metadata.get('buildDate')).toBeInstanceOf(Date);
      expect(clientData.settings.notifications).toBeInstanceOf(Set);
      expect(clientData.settings.preferences).toBeInstanceOf(Map);
    });

    it('should handle array of complex objects', () => {
      interface Post {
        id: bigint;
        title: string;
        published: Date;
        tags: Set<string>;
        metadata: Map<string, unknown>;
      }

      const posts: Post[] = Array.from({ length: 10 }, (_, i) => ({
        id: BigInt(i),
        title: `Post ${i}`,
        published: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        tags: new Set([`tag${i}`, 'general']),
        metadata: new Map([
          ['views', i * 100],
          ['lastModified', new Date()],
        ]),
      }));

      const serialized = serialize(posts);
      const deserialized = deserialize<Post[]>(serialized);

      expect(deserialized).toHaveLength(10);
      deserialized.forEach((post, i) => {
        expect(typeof post.id).toBe('bigint');
        expect(post.published).toBeInstanceOf(Date);
        expect(post.tags).toBeInstanceOf(Set);
        expect(post.metadata).toBeInstanceOf(Map);
      });
    });
  });

  describe('Real-world SSR scenario', () => {
    it('should handle loader data with complex types', () => {
      interface LoaderData {
        user: {
          id: bigint;
          registered: Date;
        };
        posts: Array<{
          id: bigint;
          created: Date;
          tags: Set<string>;
        }>;
        settings: Map<string, unknown>;
      }

      const loaderData: LoaderData = {
        user: {
          id: 123n,
          registered: new Date('2024-01-01'),
        },
        posts: [
          {
            id: 1n,
            created: new Date('2024-01-15'),
            tags: new Set(['javascript', 'typescript']),
          },
          {
            id: 2n,
            created: new Date('2024-01-16'),
            tags: new Set(['react', 'vue']),
          },
        ],
        settings: new Map([
          ['theme', 'dark'],
          ['lastSync', new Date('2024-01-17')],
        ]),
      };

      // SSR: Serialize for injection into HTML
      const serialized = serialize(loaderData);
      const scriptContent = JSON.stringify(serialized);

      // Client: Deserialize from window data
      const parsed = JSON.parse(scriptContent);
      const hydrated = deserialize<LoaderData>(parsed);

      expect(typeof hydrated.user.id).toBe('bigint');
      expect(hydrated.user.registered).toBeInstanceOf(Date);
      expect(hydrated.posts[0].tags).toBeInstanceOf(Set);
      expect(hydrated.settings).toBeInstanceOf(Map);
      expect(hydrated.settings.get('lastSync')).toBeInstanceOf(Date);
    });
  });

  describe('Performance optimizations', () => {
    it('should compress and decompress large datasets', async () => {
      const largeData = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: BigInt(i),
          name: `User ${i}`,
          email: `user${i}@example.com`,
          created: new Date(),
          tags: new Set(['user', 'active']),
        })),
      };

      const compressed = await serializeWithCompression(largeData, {
        compression: LZCompression,
        minCompressSize: 100,
      });

      expect('compressed' in compressed || 'json' in compressed).toBe(true);

      const decompressed = await deserializeWithDecompression<typeof largeData>(
        compressed,
        { compression: LZCompression }
      );

      expect(decompressed.users).toHaveLength(100);
      expect(typeof decompressed.users[0].id).toBe('bigint');
      expect(decompressed.users[0].created).toBeInstanceOf(Date);
      expect(decompressed.users[0].tags).toBeInstanceOf(Set);
    });

    it('should support lazy deserialization', () => {
      const data = {
        quick: { value: 'immediately needed' },
        slow: {
          largeArray: Array.from({ length: 1000 }, (_, i) => ({
            id: BigInt(i),
            date: new Date(),
          })),
        },
      };

      const quickSerialized = serialize(data.quick);
      const slowSerialized = serialize(data.slow);

      const lazyData = {
        quick: lazy(quickSerialized),
        slow: lazy(slowSerialized),
      };

      // Quick data is not deserialized yet
      expect(lazyData.quick.isDeserialized()).toBe(false);

      // Access quick data
      const quick = lazyData.quick.get();
      expect(quick).toEqual(data.quick);
      expect(lazyData.quick.isDeserialized()).toBe(true);

      // Slow data is still not deserialized
      expect(lazyData.slow.isDeserialized()).toBe(false);
    });

    it('should support streaming serialization', () => {
      const data = {
        part1: { value: 'first' },
        part2: { value: 'second' },
        part3: { value: 'third' },
      };

      const serializer = new StreamingSerializer();
      const chunks: any[] = [];

      for (const chunk of serializer.serialize(data, 1)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1].final).toBe(true);
    });

    it('should support streaming deserialization', () => {
      const data = {
        field1: new Date('2024-01-01'),
        field2: new Map([['key', 'value']]),
        field3: new Set([1, 2, 3]),
      };

      const serializer = new StreamingSerializer();
      const deserializer = new StreamingDeserializer<typeof data>();

      for (const chunk of serializer.serialize(data)) {
        deserializer.addChunk(chunk);
      }

      const result = deserializer.getState();

      expect(result.field1).toBeInstanceOf(Date);
      expect(result.field2).toBeInstanceOf(Map);
      expect(result.field3).toBeInstanceOf(Set);
    });

    it('should provide performance metrics', async () => {
      const data = {
        items: Array.from({ length: 50 }, (_, i) => ({
          id: BigInt(i),
          date: new Date(),
          tags: new Set(['tag1', 'tag2']),
        })),
      };

      const { result, metrics } = await serializeWithMetrics(data, {
        compression: LZCompression,
      });

      expect(metrics.serializeTime).toBeGreaterThan(0);
      expect(metrics.serializedSize).toBeGreaterThan(0);

      if ('compressed' in result) {
        expect(metrics.compressedSize).toBeGreaterThan(0);
        expect(metrics.compressionRatio).toBeGreaterThan(0);
      }

      const { data: deserialized, metrics: deserializeMetrics } =
        await deserializeWithMetrics<typeof data>(result, {
          compression: LZCompression,
        });

      expect(deserializeMetrics.deserializeTime).toBeGreaterThan(0);
      expect(deserialized.items).toHaveLength(50);
    });
  });

  describe('Custom type integration', () => {
    it('should work with custom types in real scenarios', () => {
      class Money {
        constructor(public amount: number, public currency: string) {}

        format(): string {
          return `${this.amount.toFixed(2)} ${this.currency}`;
        }
      }

      const moneyHandler = {
        name: 'Money',
        isApplicable: (v: unknown): v is Money => v instanceof Money,
        serialize: (money: Money) => ({
          amount: money.amount,
          currency: money.currency,
        }),
        deserialize: (data: any) => new Money(data.amount, data.currency),
      };

      const invoice = {
        id: 123n,
        created: new Date('2024-01-15'),
        items: [
          { name: 'Item 1', price: new Money(19.99, 'USD') },
          { name: 'Item 2', price: new Money(29.99, 'USD') },
        ],
        total: new Money(49.98, 'USD'),
        payments: new Map([
          [new Date('2024-01-16'), new Money(25.0, 'USD')],
          [new Date('2024-01-17'), new Money(24.98, 'USD')],
        ]),
      };

      const serialized = serialize(invoice, {
        customTypes: [moneyHandler],
      });

      const deserialized = deserialize<typeof invoice>(serialized, {
        customTypes: [moneyHandler],
      });

      expect(typeof deserialized.id).toBe('bigint');
      expect(deserialized.created).toBeInstanceOf(Date);
      expect(deserialized.items[0].price).toBeInstanceOf(Money);
      expect(deserialized.items[0].price.format()).toBe('19.99 USD');
      expect(deserialized.total).toBeInstanceOf(Money);
      expect(deserialized.payments).toBeInstanceOf(Map);

      // Check Map with Date keys
      for (const [date, payment] of deserialized.payments.entries()) {
        expect(date).toBeInstanceOf(Date);
        expect(payment).toBeInstanceOf(Money);
      }
    });
  });

  describe('Edge cases in production', () => {
    it('should handle deeply nested structures', () => {
      const deep = {
        level1: {
          date: new Date(),
          level2: {
            map: new Map([['key', new Set([1, 2, 3])]]),
            level3: {
              bigint: 123n,
              level4: {
                regex: /test/gi,
                level5: {
                  array: new Uint8Array([1, 2, 3]),
                },
              },
            },
          },
        },
      };

      const serialized = serialize(deep);
      const deserialized = deserialize<typeof deep>(serialized);

      expect(deserialized.level1.date).toBeInstanceOf(Date);
      expect(deserialized.level1.level2.map).toBeInstanceOf(Map);
      expect(
        deserialized.level1.level2.map.get('key')
      ).toBeInstanceOf(Set);
      expect(typeof deserialized.level1.level2.level3.bigint).toBe('bigint');
      expect(deserialized.level1.level2.level3.level4.regex).toBeInstanceOf(RegExp);
      expect(
        deserialized.level1.level2.level3.level4.level5.array
      ).toBeInstanceOf(Uint8Array);
    });

    it('should handle mixed types in arrays', () => {
      const mixed = [
        1,
        'string',
        true,
        null,
        undefined,
        new Date(),
        123n,
        new Map([['key', 'value']]),
        new Set([1, 2, 3]),
        /test/,
        NaN,
        Infinity,
        -0,
        new Uint8Array([1, 2, 3]),
      ];

      const serialized = serialize(mixed);
      const deserialized = deserialize<typeof mixed>(serialized);

      expect(deserialized[0]).toBe(1);
      expect(deserialized[1]).toBe('string');
      expect(deserialized[2]).toBe(true);
      expect(deserialized[3]).toBeNull();
      expect(deserialized[4]).toBeUndefined();
      expect(deserialized[5]).toBeInstanceOf(Date);
      expect(typeof deserialized[6]).toBe('bigint');
      expect(deserialized[7]).toBeInstanceOf(Map);
      expect(deserialized[8]).toBeInstanceOf(Set);
      expect(deserialized[9]).toBeInstanceOf(RegExp);
      expect(Number.isNaN(deserialized[10])).toBe(true);
      expect(deserialized[11]).toBe(Infinity);
      expect(Object.is(deserialized[12], -0)).toBe(true);
      expect(deserialized[13]).toBeInstanceOf(Uint8Array);
    });

    it('should handle sparse arrays', () => {
      const sparse = new Array(10);
      sparse[0] = new Date();
      sparse[5] = new Map([['key', 'value']]);
      sparse[9] = new Set([1, 2, 3]);

      const serialized = serialize(sparse);
      const deserialized = deserialize<typeof sparse>(serialized);

      expect(deserialized[0]).toBeInstanceOf(Date);
      expect(deserialized[5]).toBeInstanceOf(Map);
      expect(deserialized[9]).toBeInstanceOf(Set);
      expect(deserialized[3]).toBeUndefined();
    });
  });
});
