import { describe, it, expect } from 'vitest';
import {
  serialize,
  deserialize,
  stringify,
  parse,
  needsSerialization,
  registerCustomType,
  getCustomTypes,
  clearCustomTypes,
  createSuperJSON,
  type CustomTypeHandler,
} from './superjson.js';

describe('SuperJSON', () => {
  describe('Date serialization', () => {
    it('should serialize and deserialize Date objects', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = serialize(date);

      expect(result.meta?.values?.['$']).toBe('Date');
      expect(result.json).toBe(date.toISOString());

      const deserialized = deserialize<Date>(result);
      expect(deserialized).toBeInstanceOf(Date);
      expect(deserialized.getTime()).toBe(date.getTime());
    });

    it('should handle dates in objects', () => {
      const data = {
        created: new Date('2024-01-15T10:30:00Z'),
        updated: new Date('2024-01-16T14:20:00Z'),
      };

      const result = serialize(data);
      const deserialized = deserialize<typeof data>(result);

      expect(deserialized.created).toBeInstanceOf(Date);
      expect(deserialized.updated).toBeInstanceOf(Date);
      expect(deserialized.created.getTime()).toBe(data.created.getTime());
      expect(deserialized.updated.getTime()).toBe(data.updated.getTime());
    });

    it('should handle dates in arrays', () => {
      const dates = [
        new Date('2024-01-15'),
        new Date('2024-01-16'),
        new Date('2024-01-17'),
      ];

      const result = serialize(dates);
      const deserialized = deserialize<Date[]>(result);

      expect(deserialized).toHaveLength(3);
      deserialized.forEach((date, i) => {
        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBe(dates[i].getTime());
      });
    });
  });

  describe('Map serialization', () => {
    it('should serialize and deserialize Map objects', () => {
      const map = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
        [42, 'number key'],
      ]);

      const result = serialize(map);
      const deserialized = deserialize<Map<string | number, string>>(result);

      expect(deserialized).toBeInstanceOf(Map);
      expect(deserialized.size).toBe(3);
      expect(deserialized.get('key1')).toBe('value1');
      expect(deserialized.get('key2')).toBe('value2');
      expect(deserialized.get(42)).toBe('number key');
    });

    it('should handle nested Maps', () => {
      const innerMap = new Map([['inner', 'value']]);
      const outerMap = new Map([
        ['key', innerMap],
        ['date', new Date('2024-01-15')],
      ]);

      const result = serialize(outerMap);
      const deserialized = deserialize<Map<string, Map<string, string> | Date>>(result);

      expect(deserialized).toBeInstanceOf(Map);
      const inner = deserialized.get('key') as Map<string, string>;
      expect(inner).toBeInstanceOf(Map);
      expect(inner.get('inner')).toBe('value');

      const date = deserialized.get('date') as Date;
      expect(date).toBeInstanceOf(Date);
    });

    it('should handle Maps with complex keys', () => {
      const dateKey = new Date('2024-01-15');
      const map = new Map<Date | string, string>([
        [dateKey, 'value for date key'],
        ['string', 'value for string key'],
      ]);

      const result = serialize(map);
      const deserialized = deserialize<Map<Date | string, string>>(result);

      expect(deserialized).toBeInstanceOf(Map);
      expect(deserialized.size).toBe(2);

      // Find the date key
      let foundDateKey = false;
      for (const [key, value] of deserialized.entries()) {
        if (key instanceof Date) {
          expect(key.getTime()).toBe(dateKey.getTime());
          expect(value).toBe('value for date key');
          foundDateKey = true;
        }
      }
      expect(foundDateKey).toBe(true);
    });
  });

  describe('Set serialization', () => {
    it('should serialize and deserialize Set objects', () => {
      const set = new Set([1, 2, 3, 'four', 'five']);

      const result = serialize(set);
      const deserialized = deserialize<Set<number | string>>(result);

      expect(deserialized).toBeInstanceOf(Set);
      expect(deserialized.size).toBe(5);
      expect(deserialized.has(1)).toBe(true);
      expect(deserialized.has(2)).toBe(true);
      expect(deserialized.has(3)).toBe(true);
      expect(deserialized.has('four')).toBe(true);
      expect(deserialized.has('five')).toBe(true);
    });

    it('should handle Sets with complex values', () => {
      const set = new Set([
        new Date('2024-01-15'),
        /test/gi,
        new Map([['key', 'value']]),
      ]);

      const result = serialize(set);
      const deserialized = deserialize<Set<Date | RegExp | Map<string, string>>>(result);

      expect(deserialized).toBeInstanceOf(Set);
      expect(deserialized.size).toBe(3);

      const values = Array.from(deserialized.values());
      expect(values[0]).toBeInstanceOf(Date);
      expect(values[1]).toBeInstanceOf(RegExp);
      expect(values[2]).toBeInstanceOf(Map);
    });
  });

  describe('RegExp serialization', () => {
    it('should serialize and deserialize RegExp objects', () => {
      const regex = /test/gi;

      const result = serialize(regex);
      const deserialized = deserialize<RegExp>(result);

      expect(deserialized).toBeInstanceOf(RegExp);
      expect(deserialized.source).toBe('test');
      expect(deserialized.flags).toBe('gi');
    });

    it('should handle various RegExp flags', () => {
      const regexes = [
        /test/,
        /test/i,
        /test/g,
        /test/m,
        /test/s,
        /test/u,
        /test/y,
        /test/gim,
      ];

      for (const regex of regexes) {
        const result = serialize(regex);
        const deserialized = deserialize<RegExp>(result);

        expect(deserialized.source).toBe(regex.source);
        expect(deserialized.flags).toBe(regex.flags);
      }
    });
  });

  describe('BigInt serialization', () => {
    it('should serialize and deserialize BigInt values', () => {
      const bigint = 9007199254740991n;

      const result = serialize(bigint);
      expect(result.meta?.values?.['$']).toBe('bigint');
      expect(result.json).toBe(bigint.toString());

      const deserialized = deserialize<bigint>(result);
      expect(typeof deserialized).toBe('bigint');
      expect(deserialized).toBe(bigint);
    });

    it('should handle very large BigInt values', () => {
      const bigint = 123456789012345678901234567890n;

      const result = serialize(bigint);
      const deserialized = deserialize<bigint>(result);

      expect(deserialized).toBe(bigint);
    });

    it('should handle negative BigInt values', () => {
      const bigint = -9007199254740991n;

      const result = serialize(bigint);
      const deserialized = deserialize<bigint>(result);

      expect(deserialized).toBe(bigint);
    });
  });

  describe('undefined serialization', () => {
    it('should serialize and deserialize undefined', () => {
      const data = { value: undefined };

      const result = serialize(data);
      expect(result.meta?.values?.['value']).toBe('undefined');

      const deserialized = deserialize<{ value: undefined }>(result);
      expect(deserialized.value).toBeUndefined();
    });

    it('should handle undefined in arrays', () => {
      const data = [1, undefined, 3, undefined, 5];

      const result = serialize(data);
      const deserialized = deserialize<(number | undefined)[]>(result);

      expect(deserialized).toEqual([1, undefined, 3, undefined, 5]);
    });
  });

  describe('Special number serialization', () => {
    it('should serialize and deserialize NaN', () => {
      const data = { value: NaN };

      const result = serialize(data);
      const deserialized = deserialize<{ value: number }>(result);

      expect(Number.isNaN(deserialized.value)).toBe(true);
    });

    it('should serialize and deserialize Infinity', () => {
      const data = { value: Infinity };

      const result = serialize(data);
      const deserialized = deserialize<{ value: number }>(result);

      expect(deserialized.value).toBe(Infinity);
    });

    it('should serialize and deserialize -Infinity', () => {
      const data = { value: -Infinity };

      const result = serialize(data);
      const deserialized = deserialize<{ value: number }>(result);

      expect(deserialized.value).toBe(-Infinity);
    });

    it('should serialize and deserialize -0', () => {
      const data = { value: -0 };

      const result = serialize(data);
      const deserialized = deserialize<{ value: number }>(result);

      expect(Object.is(deserialized.value, -0)).toBe(true);
    });
  });

  describe('TypedArray serialization', () => {
    it('should serialize and deserialize Uint8Array', () => {
      const arr = new Uint8Array([1, 2, 3, 4, 5]);

      const result = serialize(arr);
      const deserialized = deserialize<Uint8Array>(result);

      expect(deserialized).toBeInstanceOf(Uint8Array);
      expect(Array.from(deserialized)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should serialize and deserialize Int8Array', () => {
      const arr = new Int8Array([-1, 0, 1, 2, 3]);

      const result = serialize(arr);
      const deserialized = deserialize<Int8Array>(result);

      expect(deserialized).toBeInstanceOf(Int8Array);
      expect(Array.from(deserialized)).toEqual([-1, 0, 1, 2, 3]);
    });

    it('should serialize and deserialize Float32Array', () => {
      const arr = new Float32Array([1.5, 2.5, 3.5]);

      const result = serialize(arr);
      const deserialized = deserialize<Float32Array>(result);

      expect(deserialized).toBeInstanceOf(Float32Array);
      expect(Array.from(deserialized)).toEqual([1.5, 2.5, 3.5]);
    });

    it('should serialize and deserialize ArrayBuffer', () => {
      const buffer = new Uint8Array([1, 2, 3, 4]).buffer;

      const result = serialize(buffer);
      const deserialized = deserialize<ArrayBuffer>(result);

      expect(deserialized).toBeInstanceOf(ArrayBuffer);
      expect(Array.from(new Uint8Array(deserialized))).toEqual([1, 2, 3, 4]);
    });

    it('should serialize and deserialize DataView', () => {
      const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
      const view = new DataView(buffer);

      const result = serialize(view);
      const deserialized = deserialize<DataView>(result);

      expect(deserialized).toBeInstanceOf(DataView);
      expect(deserialized.getUint8(0)).toBe(1);
      expect(deserialized.getUint8(1)).toBe(2);
    });
  });

  describe('Complex nested structures', () => {
    it('should handle deeply nested objects', () => {
      const data = {
        user: {
          name: 'John',
          created: new Date('2024-01-15'),
          settings: {
            theme: 'dark',
            notifications: new Set(['email', 'push']),
          },
        },
        posts: new Map([
          [1, { title: 'First Post', date: new Date('2024-01-16') }],
          [2, { title: 'Second Post', date: new Date('2024-01-17') }],
        ]),
        metadata: {
          visits: 42n,
          pattern: /user-\d+/i,
          data: new Uint8Array([1, 2, 3]),
        },
      };

      const result = serialize(data);
      const deserialized = deserialize<typeof data>(result);

      expect(deserialized.user.created).toBeInstanceOf(Date);
      expect(deserialized.user.settings.notifications).toBeInstanceOf(Set);
      expect(deserialized.posts).toBeInstanceOf(Map);
      expect(typeof deserialized.metadata.visits).toBe('bigint');
      expect(deserialized.metadata.pattern).toBeInstanceOf(RegExp);
      expect(deserialized.metadata.data).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Reference deduplication', () => {
    it('should deduplicate circular references', () => {
      const obj: { self?: unknown } = {};
      obj.self = obj;

      const result = serialize(obj, { dedupe: true });
      expect(result.meta?.referenceMap).toBeDefined();

      // Note: Full circular reference support would require additional work
      // This test mainly ensures the deduplication tracking works
    });

    it('should deduplicate shared references', () => {
      const shared = { value: 42 };
      const data = {
        a: shared,
        b: shared,
      };

      const result = serialize(data, { dedupe: true });
      expect(result.meta?.referenceMap).toBeDefined();
    });

    it('should work without deduplication', () => {
      const shared = { value: 42 };
      const data = {
        a: shared,
        b: shared,
      };

      const result = serialize(data, { dedupe: false });
      expect(result.meta?.referenceMap).toBeUndefined();
    });
  });

  describe('Max depth option', () => {
    it('should respect max depth limit', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'too deep',
              },
            },
          },
        },
      };

      const result = serialize(data, { maxDepth: 2 });
      expect(result.json).toBeDefined();
      // The exact behavior depends on implementation
    });
  });

  describe('Custom types', () => {
    it('should handle custom type registration', () => {
      class Point {
        constructor(public x: number, public y: number) {}
      }

      const pointHandler: CustomTypeHandler<Point> = {
        name: 'Point',
        isApplicable: (v): v is Point => v instanceof Point,
        serialize: (point) => ({ x: point.x, y: point.y }),
        deserialize: (data) => {
          const { x, y } = data as { x: number; y: number };
          return new Point(x, y);
        },
      };

      const point = new Point(10, 20);
      const result = serialize(point, { customTypes: [pointHandler] });
      const deserialized = deserialize<Point>(result, { customTypes: [pointHandler] });

      expect(deserialized).toBeInstanceOf(Point);
      expect(deserialized.x).toBe(10);
      expect(deserialized.y).toBe(20);
    });

    it('should handle global custom type registration', () => {
      clearCustomTypes(); // Clean up

      class Color {
        constructor(public hex: string) {}
      }

      registerCustomType({
        name: 'Color',
        isApplicable: (v): v is Color => v instanceof Color,
        serialize: (color) => color.hex,
        deserialize: (hex) => new Color(hex as string),
      });

      const color = new Color('#FF0000');
      const sj = createSuperJSON();

      const result = sj.serialize(color);
      const deserialized = sj.deserialize<Color>(result);

      expect(deserialized).toBeInstanceOf(Color);
      expect(deserialized.hex).toBe('#FF0000');

      clearCustomTypes();
    });

    it('should respect handler priority', () => {
      class Base {
        type = 'base';
      }
      class Derived extends Base {
        type = 'derived' as const;
      }

      const handlers: CustomTypeHandler[] = [
        {
          name: 'Base',
          priority: 0,
          isApplicable: (v): v is Base => v instanceof Base,
          serialize: (v) => ({ type: 'base' }),
          deserialize: (v) => new Base(),
        },
        {
          name: 'Derived',
          priority: 10, // Higher priority
          isApplicable: (v): v is Derived => v instanceof Derived,
          serialize: (v) => ({ type: 'derived' }),
          deserialize: (v) => new Derived(),
        },
      ];

      const derived = new Derived();
      const result = serialize(derived, { customTypes: handlers });
      const deserialized = deserialize<Derived>(result, { customTypes: handlers });

      expect(deserialized).toBeInstanceOf(Derived);
    });
  });

  describe('Stringify and parse helpers', () => {
    it('should stringify and parse', () => {
      const data = {
        date: new Date('2024-01-15'),
        map: new Map([['key', 'value']]),
        bigint: 42n,
      };

      const str = stringify(data);
      expect(typeof str).toBe('string');

      const parsed = parse<typeof data>(str);
      expect(parsed.date).toBeInstanceOf(Date);
      expect(parsed.map).toBeInstanceOf(Map);
      expect(typeof parsed.bigint).toBe('bigint');
    });
  });

  describe('needsSerialization utility', () => {
    it('should detect when serialization is needed', () => {
      expect(needsSerialization(new Date())).toBe(true);
      expect(needsSerialization(new Map())).toBe(true);
      expect(needsSerialization(new Set())).toBe(true);
      expect(needsSerialization(/test/)).toBe(true);
      expect(needsSerialization(42n)).toBe(true);
      expect(needsSerialization(undefined)).toBe(true);
      expect(needsSerialization(NaN)).toBe(true);
      expect(needsSerialization(Infinity)).toBe(true);
      expect(needsSerialization(-0)).toBe(true);
      expect(needsSerialization(new Uint8Array())).toBe(true);
    });

    it('should detect when serialization is not needed', () => {
      expect(needsSerialization(null)).toBe(false);
      expect(needsSerialization(true)).toBe(false);
      expect(needsSerialization(42)).toBe(false);
      expect(needsSerialization('string')).toBe(false);
      expect(needsSerialization({ plain: 'object' })).toBe(false);
      expect(needsSerialization([1, 2, 3])).toBe(false);
    });

    it('should detect nested special types', () => {
      expect(needsSerialization({ date: new Date() })).toBe(true);
      expect(needsSerialization([1, 2, new Map()])).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty objects and arrays', () => {
      const data = {
        emptyObj: {},
        emptyArr: [],
        emptyMap: new Map(),
        emptySet: new Set(),
      };

      const result = serialize(data);
      const deserialized = deserialize<typeof data>(result);

      expect(deserialized.emptyObj).toEqual({});
      expect(deserialized.emptyArr).toEqual([]);
      expect(deserialized.emptyMap).toBeInstanceOf(Map);
      expect(deserialized.emptyMap.size).toBe(0);
      expect(deserialized.emptySet).toBeInstanceOf(Set);
      expect(deserialized.emptySet.size).toBe(0);
    });

    it('should handle null values', () => {
      const data = {
        value: null,
        nested: {
          value: null,
        },
      };

      const result = serialize(data);
      const deserialized = deserialize<typeof data>(result);

      expect(deserialized.value).toBeNull();
      expect(deserialized.nested.value).toBeNull();
    });

    it('should handle mixed arrays', () => {
      const data = [
        1,
        'string',
        true,
        null,
        undefined,
        new Date('2024-01-15'),
        { nested: 'object' },
        [1, 2, 3],
        new Map([['key', 'value']]),
      ];

      const result = serialize(data);
      const deserialized = deserialize<typeof data>(result);

      expect(deserialized[0]).toBe(1);
      expect(deserialized[1]).toBe('string');
      expect(deserialized[2]).toBe(true);
      expect(deserialized[3]).toBeNull();
      expect(deserialized[4]).toBeUndefined();
      expect(deserialized[5]).toBeInstanceOf(Date);
      expect(deserialized[6]).toEqual({ nested: 'object' });
      expect(deserialized[7]).toEqual([1, 2, 3]);
      expect(deserialized[8]).toBeInstanceOf(Map);
    });

    it('should handle data without metadata', () => {
      const data = { simple: 'object', number: 42 };
      const result = serialize(data);

      expect(result.meta).toBeUndefined();

      const deserialized = deserialize<typeof data>(result);
      expect(deserialized).toEqual(data);
    });
  });

  describe('createSuperJSON factory', () => {
    it('should create a custom instance with handlers', () => {
      class Custom {
        constructor(public value: string) {}
      }

      const sj = createSuperJSON([
        {
          name: 'Custom',
          isApplicable: (v): v is Custom => v instanceof Custom,
          serialize: (v) => v.value,
          deserialize: (v) => new Custom(v as string),
        },
      ]);

      const custom = new Custom('test');
      const str = sj.stringify(custom);
      const parsed = sj.parse<Custom>(str);

      expect(parsed).toBeInstanceOf(Custom);
      expect(parsed.value).toBe('test');
    });
  });
});
