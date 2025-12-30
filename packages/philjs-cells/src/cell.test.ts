/**
 * PhilJS Cells - Core Cell Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCell, createTypedCell, createCellWithRetry } from './cell';
import { cellCache } from './cache';
import type { CellDefinition, VNode } from './types';

// Test helper: null VNode for test components
const nullVNode = null as unknown as VNode;

// Mock philjs-core
vi.mock('philjs-core', () => ({
  signal: (initial: unknown) => {
    let value = initial;
    const read = () => value;
    read.set = (newValue: unknown) => {
      value = typeof newValue === 'function' ? newValue(value) : newValue;
    };
    read.subscribe = () => () => {};
    read.peek = () => value;
    return read;
  },
  memo: (fn: () => unknown) => {
    const read = () => fn();
    return read;
  },
  effect: (fn: () => void | (() => void)) => {
    const cleanup = fn();
    return cleanup || (() => {});
  },
  batch: (fn: () => void) => fn(),
  createElement: (type: unknown, props: unknown, ...children: unknown[]) => ({
    type,
    props: { ...props, children },
  }),
  createContext: () => ({
    id: Symbol('context'),
    defaultValue: null,
    Provider: () => null,
    Consumer: () => null,
  }),
  useContext: () => ({
    executeQuery: vi.fn(),
    executeFetch: vi.fn(),
    getCached: () => null,
    setCached: vi.fn(),
    invalidate: vi.fn(),
    onError: vi.fn(),
    onSuccess: vi.fn(),
  }),
}));

describe('createCell', () => {
  beforeEach(() => {
    cellCache.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validation', () => {
    it('throws if neither QUERY nor fetch is provided', () => {
      expect(() =>
        createCell({
          Success: () => nullVNode,
        } as CellDefinition<unknown>)
      ).toThrow('must have either QUERY or fetch defined');
    });

    it('throws if both QUERY and fetch are provided', () => {
      expect(() =>
        createCell({
          QUERY: 'query { test }',
          fetch: async () => ({}),
          Success: () => nullVNode,
        } as CellDefinition<unknown>)
      ).toThrow('cannot have both QUERY and fetch defined');
    });

    it('throws if Success component is not provided', () => {
      expect(() =>
        createCell({
          QUERY: 'query { test }',
        } as CellDefinition<unknown>)
      ).toThrow('must have a Success component defined');
    });
  });

  describe('with QUERY', () => {
    it('creates a cell component with GraphQL query', () => {
      const cell = createCell({
        QUERY: `query Users { users { id name } }`,
        Success: ({ users }) => ({ users }),
      });

      expect(cell).toBeDefined();
      expect(cell.displayName).toBe('Cell');
      expect(cell.__cellDefinition).toBeDefined();
      expect(cell.__cellDefinition.QUERY).toContain('Users');
    });

    it('accepts custom displayName', () => {
      const cell = createCell({
        QUERY: `query { users }`,
        Success: () => nullVNode,
        displayName: 'UsersCell',
      });

      expect(cell.displayName).toBe('UsersCell');
    });
  });

  describe('with fetch', () => {
    it('creates a cell component with fetch function', () => {
      const mockFetch = vi.fn().mockResolvedValue({ users: [] });

      const cell = createCell({
        fetch: mockFetch,
        Success: ({ users }) => ({ users }),
      });

      expect(cell).toBeDefined();
      expect(cell.__cellDefinition.fetch).toBe(mockFetch);
    });
  });

  describe('state components', () => {
    it('uses default Loading component if not provided', () => {
      const cell = createCell({
        fetch: async () => ({ data: 'test' }),
        Success: () => nullVNode,
      });

      expect(cell.__cellDefinition.Loading).toBeUndefined();
    });

    it('uses custom Loading component if provided', () => {
      const CustomLoading = () => ({ type: 'custom-loading' });

      const cell = createCell({
        fetch: async () => ({ data: 'test' }),
        Loading: CustomLoading,
        Success: () => nullVNode,
      });

      expect(cell.__cellDefinition.Loading).toBe(CustomLoading);
    });

    it('uses default Empty component if not provided', () => {
      const cell = createCell({
        fetch: async () => ({ data: 'test' }),
        Success: () => nullVNode,
      });

      expect(cell.__cellDefinition.Empty).toBeUndefined();
    });

    it('uses custom Empty component if provided', () => {
      const CustomEmpty = () => ({ type: 'custom-empty' });

      const cell = createCell({
        fetch: async () => ({ data: 'test' }),
        Empty: CustomEmpty,
        Success: () => nullVNode,
      });

      expect(cell.__cellDefinition.Empty).toBe(CustomEmpty);
    });

    it('uses default Failure component if not provided', () => {
      const cell = createCell({
        fetch: async () => ({ data: 'test' }),
        Success: () => nullVNode,
      });

      expect(cell.__cellDefinition.Failure).toBeUndefined();
    });

    it('uses custom Failure component if provided', () => {
      const CustomFailure = () => ({ type: 'custom-failure' });

      const cell = createCell({
        fetch: async () => ({ data: 'test' }),
        Failure: CustomFailure,
        Success: () => nullVNode,
      });

      expect(cell.__cellDefinition.Failure).toBe(CustomFailure);
    });
  });

  describe('isEmpty', () => {
    it('uses default isEmpty function', () => {
      const cell = createCell({
        fetch: async () => ({ users: [] }),
        Success: () => nullVNode,
      });

      expect(cell.__cellDefinition.isEmpty).toBeUndefined();
    });

    it('uses custom isEmpty function if provided', () => {
      const customIsEmpty = (data: { users: unknown[] }) => data.users.length === 0;

      const cell = createCell({
        fetch: async () => ({ users: [] }),
        isEmpty: customIsEmpty,
        Success: () => nullVNode,
      });

      expect(cell.__cellDefinition.isEmpty).toBe(customIsEmpty);
    });
  });

  describe('afterQuery', () => {
    it('applies afterQuery transformation', () => {
      const afterQuery = (data: { users: unknown[] }) => ({
        ...data,
        transformed: true,
      });

      const cell = createCell({
        fetch: async () => ({ users: [] }),
        afterQuery,
        Success: () => nullVNode,
      });

      expect(cell.__cellDefinition.afterQuery).toBe(afterQuery);
    });
  });
});

describe('createTypedCell', () => {
  it('creates a typed cell factory', () => {
    interface UserData {
      users: Array<{ id: string; name: string }>;
    }

    const createUserCell = createTypedCell<UserData>();

    const cell = createUserCell({
      fetch: async () => ({ users: [] }),
      Success: ({ users }) => ({ users }),
    });

    expect(cell).toBeDefined();
    expect(cell.__cellDefinition.fetch).toBeDefined();
  });
});

describe('createCellWithRetry', () => {
  it('wraps fetch with retry logic', () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });

    const cell = createCellWithRetry(
      {
        fetch: mockFetch,
        Success: () => nullVNode,
      },
      { maxRetries: 3 }
    );

    expect(cell).toBeDefined();
    expect(cell.__cellDefinition.fetch).toBeDefined();
  });

  it('returns original cell if no fetch function', () => {
    const cell = createCellWithRetry(
      {
        QUERY: 'query { test }',
        Success: () => nullVNode,
      },
      { maxRetries: 3 }
    );

    expect(cell.__cellDefinition.QUERY).toBe('query { test }');
  });
});
