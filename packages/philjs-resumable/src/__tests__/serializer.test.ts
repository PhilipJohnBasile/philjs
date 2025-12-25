/**
 * Tests for State Serialization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createSerializationContext,
  getSerializationContext,
  withSerializationContext,
  generateId,
  serializeValue,
  deserializeValue,
  registerElement,
  registerSignal,
  addSignalSubscriber,
  registerComponent,
  generateStateScript,
  generateBootstrapScript,
  generateElementAttributes,
  createStreamingContext,
  addStreamingChunk,
  serializeToAttribute,
  deserializeFromAttribute,
  generateInlineState,
  type SerializationContext,
  type SerializedValue,
  type SerializedHandler,
  type SerializedElement,
} from '../serializer.js';
import { createQRL, isQRL } from '../qrl.js';

describe('Serialization Context', () => {
  it('should create a serialization context', () => {
    const ctx = createSerializationContext();

    expect(ctx).toBeTruthy();
    expect(ctx.nextId).toBe(0);
    expect(ctx.signals).toBeInstanceOf(Map);
    expect(ctx.elements).toBeInstanceOf(Map);
    expect(ctx.qrls).toBeInstanceOf(Map);
    expect(ctx.isDev).toBe(false);
  });

  it('should create context with dev mode', () => {
    const ctx = createSerializationContext({ isDev: true });

    expect(ctx.isDev).toBe(true);
  });

  it('should get current context', () => {
    const ctx = createSerializationContext();

    withSerializationContext(ctx, () => {
      const current = getSerializationContext();
      expect(current).toBe(ctx);
    });
  });

  it('should restore previous context after execution', () => {
    const ctx1 = createSerializationContext();
    const ctx2 = createSerializationContext();

    withSerializationContext(ctx1, () => {
      expect(getSerializationContext()).toBe(ctx1);

      withSerializationContext(ctx2, () => {
        expect(getSerializationContext()).toBe(ctx2);
      });

      expect(getSerializationContext()).toBe(ctx1);
    });
  });

  it('should generate unique IDs', () => {
    const ctx = createSerializationContext();

    const id1 = generateId(ctx);
    const id2 = generateId(ctx);
    const id3 = generateId(ctx);

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).toMatch(/^q\d+$/);
  });

  it('should generate IDs from current context', () => {
    const ctx = createSerializationContext();

    withSerializationContext(ctx, () => {
      const id = generateId();
      expect(id).toMatch(/^q\d+$/);
    });
  });

  it('should throw if no context available', () => {
    expect(() => generateId()).toThrow('No serialization context available');
  });
});

describe('Value Serialization - Primitives', () => {
  it('should serialize null', () => {
    const result = serializeValue(null);

    expect(result.type).toBe('primitive');
    expect(result.data).toBe(null);
  });

  it('should serialize undefined', () => {
    const result = serializeValue(undefined);

    expect(result.type).toBe('undefined');
    expect(result.data).toBe(null);
  });

  it('should serialize string', () => {
    const result = serializeValue('hello');

    expect(result.type).toBe('primitive');
    expect(result.data).toBe('hello');
  });

  it('should serialize number', () => {
    const result = serializeValue(42);

    expect(result.type).toBe('primitive');
    expect(result.data).toBe(42);
  });

  it('should serialize boolean', () => {
    const result = serializeValue(true);

    expect(result.type).toBe('primitive');
    expect(result.data).toBe(true);
  });

  it('should serialize bigint', () => {
    const result = serializeValue(BigInt(9007199254740991));

    expect(result.type).toBe('bigint');
    expect(result.data).toBe('9007199254740991');
  });
});

describe('Value Serialization - Objects', () => {
  it('should serialize Date', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const result = serializeValue(date);

    expect(result.type).toBe('date');
    expect(result.data).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should serialize RegExp', () => {
    const regex = /test/gi;
    const result = serializeValue(regex);

    expect(result.type).toBe('regexp');
    expect(result.data).toEqual({ source: 'test', flags: 'gi' });
  });

  it('should serialize Error', () => {
    const error = new Error('Test error');
    const result = serializeValue(error);

    expect(result.type).toBe('error');
    expect(result.data).toHaveProperty('name', 'Error');
    expect(result.data).toHaveProperty('message', 'Test error');
    expect(result.data).toHaveProperty('stack');
  });

  it('should serialize Map', () => {
    const map = new Map([
      ['key1', 'value1'],
      ['key2', 42],
    ]);
    const result = serializeValue(map);

    expect(result.type).toBe('map');
    expect(result.data).toBeInstanceOf(Array);
  });

  it('should serialize Set', () => {
    const set = new Set([1, 2, 3]);
    const result = serializeValue(set);

    expect(result.type).toBe('set');
    expect(result.data).toBeInstanceOf(Array);
  });

  it('should serialize Array', () => {
    const arr = [1, 'two', true];
    const result = serializeValue(arr);

    expect(result.type).toBe('array');
    expect(result.data).toBeInstanceOf(Array);
    expect((result.data as SerializedValue[]).length).toBe(3);
  });

  it('should serialize plain object', () => {
    const obj = { name: 'test', count: 42, active: true };
    const result = serializeValue(obj);

    expect(result.type).toBe('object');
    expect(result.data).toHaveProperty('name');
    expect(result.data).toHaveProperty('count');
    expect(result.data).toHaveProperty('active');
  });

  it('should skip functions in object serialization', () => {
    const obj = {
      name: 'test',
      fn: () => {},
      value: 42,
    };
    const result = serializeValue(obj);

    expect(result.type).toBe('object');
    const data = result.data as Record<string, SerializedValue>;
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('value');
    expect(data).not.toHaveProperty('fn');
  });
});

describe('Value Serialization - Special Types', () => {
  it('should serialize QRL', () => {
    const qrl = createQRL({ chunk: 'test.js', symbol: 'fn' });
    const result = serializeValue(qrl);

    expect(result.type).toBe('qrl');
    expect(typeof result.data).toBe('string');
  });

  it('should serialize signal-like object', () => {
    const signal = {
      peek: () => 42,
      $id$: 's1',
    };
    const result = serializeValue(signal);

    expect(result.type).toBe('signal');
    expect(result.data).toHaveProperty('id', 's1');
    expect(result.data).toHaveProperty('value');
  });
});

describe('Value Deserialization', () => {
  it('should deserialize primitive', () => {
    const serialized: SerializedValue = { type: 'primitive', data: 'hello' };
    const result = deserializeValue(serialized);

    expect(result).toBe('hello');
  });

  it('should deserialize undefined', () => {
    const serialized: SerializedValue = { type: 'undefined', data: null };
    const result = deserializeValue(serialized);

    expect(result).toBeUndefined();
  });

  it('should deserialize bigint', () => {
    const serialized: SerializedValue = { type: 'bigint', data: '123456789' };
    const result = deserializeValue(serialized);

    expect(result).toBe(BigInt(123456789));
  });

  it('should deserialize Date', () => {
    const serialized: SerializedValue = {
      type: 'date',
      data: '2024-01-01T00:00:00.000Z',
    };
    const result = deserializeValue(serialized);

    expect(result).toBeInstanceOf(Date);
    expect((result as Date).toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should deserialize RegExp', () => {
    const serialized: SerializedValue = {
      type: 'regexp',
      data: { source: 'test', flags: 'gi' },
    };
    const result = deserializeValue(serialized);

    expect(result).toBeInstanceOf(RegExp);
    expect((result as RegExp).source).toBe('test');
    expect((result as RegExp).flags).toBe('gi');
  });

  it('should deserialize Error', () => {
    const serialized: SerializedValue = {
      type: 'error',
      data: { name: 'Error', message: 'Test error', stack: 'stack trace' },
    };
    const result = deserializeValue(serialized);

    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe('Test error');
  });

  it('should deserialize Map', () => {
    const serialized: SerializedValue = {
      type: 'map',
      data: [
        [
          { type: 'primitive', data: 'key' },
          { type: 'primitive', data: 'value' },
        ],
      ],
    };
    const result = deserializeValue(serialized);

    expect(result).toBeInstanceOf(Map);
    expect((result as Map<string, string>).get('key')).toBe('value');
  });

  it('should deserialize Set', () => {
    const serialized: SerializedValue = {
      type: 'set',
      data: [
        { type: 'primitive', data: 1 },
        { type: 'primitive', data: 2 },
      ],
    };
    const result = deserializeValue(serialized);

    expect(result).toBeInstanceOf(Set);
    expect((result as Set<number>).has(1)).toBe(true);
    expect((result as Set<number>).has(2)).toBe(true);
  });

  it('should deserialize Array', () => {
    const serialized: SerializedValue = {
      type: 'array',
      data: [
        { type: 'primitive', data: 1 },
        { type: 'primitive', data: 'two' },
      ],
    };
    const result = deserializeValue(serialized);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([1, 'two']);
  });

  it('should deserialize object', () => {
    const serialized: SerializedValue = {
      type: 'object',
      data: {
        name: { type: 'primitive', data: 'test' },
        count: { type: 'primitive', data: 42 },
      },
    };
    const result = deserializeValue(serialized);

    expect(result).toEqual({ name: 'test', count: 42 });
  });

  it('should deserialize QRL reference', () => {
    const serialized: SerializedValue = {
      type: 'qrl',
      data: 'test.js#fn',
    };
    const result = deserializeValue(serialized);

    expect(result).toHaveProperty('$qrlRef$');
  });

  it('should deserialize signal reference', () => {
    const serialized: SerializedValue = {
      type: 'signal',
      data: { id: 's1', value: { type: 'primitive', data: 42 } },
    };
    const result = deserializeValue(serialized);

    expect(result).toHaveProperty('$signalRef$');
  });
});

describe('Serialization Round-trip', () => {
  it('should round-trip primitives', () => {
    const values = [null, 'string', 42, true, false];

    values.forEach((value) => {
      const serialized = serializeValue(value);
      const deserialized = deserializeValue(serialized);
      expect(deserialized).toEqual(value);
    });
  });

  it('should round-trip complex objects', () => {
    const obj = {
      name: 'test',
      count: 42,
      nested: {
        active: true,
        tags: ['a', 'b', 'c'],
      },
    };

    const serialized = serializeValue(obj);
    const deserialized = deserializeValue(serialized);

    expect(deserialized).toEqual(obj);
  });

  it('should round-trip Date', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const serialized = serializeValue(date);
    const deserialized = deserializeValue(serialized);

    expect(deserialized).toBeInstanceOf(Date);
    expect((deserialized as Date).getTime()).toBe(date.getTime());
  });

  it('should round-trip Map', () => {
    const map = new Map([
      ['key1', 'value1'],
      ['key2', { nested: true }],
    ]);

    const serialized = serializeValue(map);
    const deserialized = deserializeValue(serialized) as Map<string, unknown>;

    expect(deserialized).toBeInstanceOf(Map);
    expect(deserialized.get('key1')).toBe('value1');
  });

  it('should round-trip Set', () => {
    const set = new Set([1, 2, 3, 4, 5]);

    const serialized = serializeValue(set);
    const deserialized = deserializeValue(serialized) as Set<number>;

    expect(deserialized).toBeInstanceOf(Set);
    expect(deserialized.size).toBe(5);
    expect(deserialized.has(3)).toBe(true);
  });
});

describe('Element Registration', () => {
  let ctx: SerializationContext;

  beforeEach(() => {
    ctx = createSerializationContext();
  });

  it('should register element with handlers', () => {
    const handlers: SerializedHandler[] = [
      { qrl: 'handler.js#onClick', event: 'click' },
    ];

    registerElement('el1', { handlers }, ctx);

    const element = ctx.elements.get('el1');
    expect(element).toBeTruthy();
    expect(element?.handlers).toEqual(handlers);
  });

  it('should register element with bindings', () => {
    const bindings = { s1: 'value', s2: 'className' };

    registerElement('el2', { bindings }, ctx);

    const element = ctx.elements.get('el2');
    expect(element?.bindings).toEqual(bindings);
  });

  it('should register element with state', () => {
    const state = { count: 42, name: 'test' };

    registerElement('el3', { state }, ctx);

    const element = ctx.elements.get('el3');
    expect(element?.state).toBeTruthy();
  });
});

describe('Signal Registration', () => {
  let ctx: SerializationContext;

  beforeEach(() => {
    ctx = createSerializationContext();
  });

  it('should register signal', () => {
    registerSignal('s1', 42, ctx);

    const signal = ctx.signals.get('s1');
    expect(signal).toBeTruthy();
    expect(signal?.id).toBe('s1');
    expect(signal?.subscribers).toEqual([]);
  });

  it('should add signal subscriber', () => {
    registerSignal('s1', 'value', ctx);
    addSignalSubscriber('s1', 'el1', ctx);
    addSignalSubscriber('s1', 'el2', ctx);

    const signal = ctx.signals.get('s1');
    expect(signal?.subscribers).toEqual(['el1', 'el2']);
  });

  it('should handle missing signal gracefully', () => {
    addSignalSubscriber('missing', 'el1', ctx);

    const signal = ctx.signals.get('missing');
    expect(signal).toBeUndefined();
  });
});

describe('Component Registration', () => {
  let ctx: SerializationContext;

  beforeEach(() => {
    ctx = createSerializationContext();
  });

  it('should register component with QRL string', () => {
    const props = { name: 'test', count: 42 };

    registerComponent('c1', 'component.js#MyComponent', props, ctx);

    const component = ctx.components.get('c1');
    expect(component?.qrl).toBe('component.js#MyComponent');
  });

  it('should register component with QRL object', () => {
    const qrl = createQRL({ chunk: 'component.js', symbol: 'MyComponent' });
    const props = { active: true };

    registerComponent('c2', qrl, props, ctx);

    const component = ctx.components.get('c2');
    expect(component?.qrl).toBeTruthy();
  });

  it('should serialize component props', () => {
    const props = {
      name: 'test',
      items: [1, 2, 3],
      config: { enabled: true },
    };

    registerComponent('c3', 'comp.js#Comp', props, ctx);

    const component = ctx.components.get('c3');
    expect(component?.props).toBeTruthy();
    expect(Object.keys(component!.props)).toEqual(['name', 'items', 'config']);
  });
});

describe('State Script Generation', () => {
  it('should generate state script', () => {
    const ctx = createSerializationContext();

    registerSignal('s1', 42, ctx);
    registerElement('el1', { handlers: [] }, ctx);

    const script = generateStateScript(ctx);

    expect(script).toContain('<script');
    expect(script).toContain('__PHIL_STATE__');
    expect(script).toContain('application/json');
  });

  it('should escape HTML in state', () => {
    const ctx = createSerializationContext();

    registerSignal('s1', '<script>alert("xss")</script>', ctx);

    const script = generateStateScript(ctx);

    expect(script).not.toContain('<script>alert');
    expect(script).toContain('\\u003c');
  });

  it('should include all context data', () => {
    const ctx = createSerializationContext();

    registerSignal('s1', 'value', ctx);
    registerElement('el1', { handlers: [] }, ctx);
    registerComponent('c1', 'comp.js#C', {}, ctx);

    const script = generateStateScript(ctx);

    expect(script).toContain('signals');
    expect(script).toContain('elements');
    expect(script).toContain('components');
  });
});

describe('Bootstrap Script Generation', () => {
  it('should generate bootstrap script', () => {
    const script = generateBootstrapScript();

    expect(script).toContain('<script>');
    expect(script).toContain('__PHIL_Q__');
    expect(script).toContain('addEventListener');
  });

  it('should include base path', () => {
    const script = generateBootstrapScript({ basePath: '/dist' });

    expect(script).toContain('/dist');
  });

  it('should set up event delegation', () => {
    const script = generateBootstrapScript();

    expect(script).toContain('click');
    expect(script).toContain('input');
    expect(script).toContain('submit');
  });

  it('should include QRL loader', () => {
    const script = generateBootstrapScript();

    expect(script).toContain('Q.load');
    expect(script).toContain('Q.invoke');
  });
});

describe('Element Attributes Generation', () => {
  it('should generate basic attributes', () => {
    const ctx = createSerializationContext();
    registerElement('el1', {}, ctx);

    const attrs = generateElementAttributes('el1', ctx);

    expect(attrs['data-qid']).toBe('el1');
  });

  it('should include handler events', () => {
    const ctx = createSerializationContext();
    registerElement(
      'el1',
      {
        handlers: [
          { qrl: 'h1.js#fn', event: 'click' },
          { qrl: 'h2.js#fn', event: 'input' },
        ],
      },
      ctx
    );

    const attrs = generateElementAttributes('el1', ctx);

    expect(attrs['data-qevents']).toContain('click');
    expect(attrs['data-qevents']).toContain('input');
  });

  it('should include bindings', () => {
    const ctx = createSerializationContext();
    registerElement('el1', { bindings: { s1: 'value', s2: 'className' } }, ctx);

    const attrs = generateElementAttributes('el1', ctx);

    expect(attrs['data-qbind']).toContain('s1:value');
    expect(attrs['data-qbind']).toContain('s2:className');
  });
});

describe('Streaming Context', () => {
  it('should create streaming context', () => {
    const ctx = createStreamingContext();

    expect(ctx).toBeTruthy();
    expect(typeof ctx.flush).toBe('function');
    expect(typeof ctx.finalize).toBe('function');
  });

  it('should add streaming chunks', () => {
    const ctx = createStreamingContext();

    addStreamingChunk('<div>chunk1</div>', ctx);
    addStreamingChunk('<div>chunk2</div>', ctx);

    const flushed = ctx.flush();

    expect(flushed).toContain('chunk1');
    expect(flushed).toContain('chunk2');
  });

  it('should clear chunks after flush', () => {
    const ctx = createStreamingContext();

    addStreamingChunk('<div>chunk</div>', ctx);
    ctx.flush();

    const secondFlush = ctx.flush();
    expect(secondFlush).toBe('');
  });

  it('should finalize with state script', () => {
    const ctx = createStreamingContext();

    registerSignal('s1', 'value', ctx);

    const final = ctx.finalize();

    expect(final).toContain('__PHIL_STATE__');
  });
});

describe('Attribute Serialization', () => {
  it('should serialize to attribute', () => {
    const value = { count: 42, name: 'test' };
    const attr = serializeToAttribute(value);

    expect(typeof attr).toBe('string');
    expect(attr.length).toBeGreaterThan(0);
  });

  it('should deserialize from attribute', () => {
    const value = { count: 42, items: [1, 2, 3] };
    const attr = serializeToAttribute(value);
    const deserialized = deserializeFromAttribute(attr);

    expect(deserialized).toEqual(value);
  });

  it('should handle invalid attribute gracefully', () => {
    const result = deserializeFromAttribute('invalid-base64!!!');

    expect(result).toBeUndefined();
  });

  it('should round-trip complex values', () => {
    const value = {
      user: { id: 1, name: 'Alice' },
      settings: { theme: 'dark', notifications: true },
      items: ['a', 'b', 'c'],
    };

    const attr = serializeToAttribute(value);
    const deserialized = deserializeFromAttribute(attr);

    expect(deserialized).toEqual(value);
  });
});

describe('Inline State Generation', () => {
  it('should generate inline state attribute', () => {
    const state = { count: 42, name: 'test' };
    const attr = generateInlineState(state);

    expect(attr).toContain('data-qstate=');
    expect(attr).toContain('"');
  });

  it('should serialize state values', () => {
    const state = {
      simple: 'value',
      complex: { nested: true },
      array: [1, 2, 3],
    };

    const attr = generateInlineState(state);
    expect(typeof attr).toBe('string');
  });
});
