/**
 * PhilJS Cells - Context Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCacheKey, hydrateCells, getCellHydrationScript } from './context';
import { cellCache } from './cache';

// Mock @philjs/core
vi.mock('@philjs/core', () => ({
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
  createContext: (defaultValue: unknown) => ({
    id: Symbol('context'),
    defaultValue,
    Provider: () => null,
    Consumer: () => null,
  }),
  useContext: (context: { defaultValue: unknown }) => context.defaultValue,
}));

describe('generateCacheKey', () => {
  it('generates key from identifier only', () => {
    const key = generateCacheKey('query { users }', {});
    expect(key).toMatch(/^cell:\w+$/);
  });

  it('generates key with variables', () => {
    const key = generateCacheKey('query { user($id: ID!) }', { id: '123' });
    expect(key).toContain(':');
    expect(key).toContain('123');
  });

  it('generates consistent keys for same inputs', () => {
    const key1 = generateCacheKey('query { users }', { limit: 10, offset: 0 });
    const key2 = generateCacheKey('query { users }', { limit: 10, offset: 0 });
    expect(key1).toBe(key2);
  });

  it('generates same key regardless of variable order', () => {
    const key1 = generateCacheKey('query', { a: 1, b: 2 });
    const key2 = generateCacheKey('query', { b: 2, a: 1 });
    expect(key1).toBe(key2);
  });

  it('generates different keys for different variables', () => {
    const key1 = generateCacheKey('query { user }', { id: '1' });
    const key2 = generateCacheKey('query { user }', { id: '2' });
    expect(key1).not.toBe(key2);
  });
});

describe('hydrateCells', () => {
  beforeEach(() => {
    cellCache.clear();
  });

  it('populates cache from serialized data', () => {
    const data = JSON.stringify({
      'cell:users': { users: [{ id: 1, name: 'Test' }] },
      'cell:config': { theme: 'dark' },
    });

    hydrateCells(data);

    expect(cellCache.get('cell:users')?.data).toEqual({ users: [{ id: 1, name: 'Test' }] });
    expect(cellCache.get('cell:config')?.data).toEqual({ theme: 'dark' });
  });

  it('handles invalid JSON gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    hydrateCells('invalid json');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to hydrate'));
    consoleSpy.mockRestore();
  });

  it('handles empty data', () => {
    hydrateCells('{}');
    expect(cellCache.size()).toBe(0);
  });
});

describe('getCellHydrationScript', () => {
  it('returns script tag with serialized data', () => {
    const mockSSRContext = {
      cellData: new Map([
        ['cell:users', { users: [] }],
      ]),
      pendingCells: new Map(),
      markHydrated: vi.fn(),
      isHydrated: vi.fn(),
      serialize: () => JSON.stringify({ 'cell:users': { users: [] } }),
      deserialize: vi.fn(),
    };

    const script = getCellHydrationScript(mockSSRContext);

    expect(script).toContain('<script>');
    expect(script).toContain('window.__PHILJS_CELL_DATA__');
    expect(script).toContain('</script>');
  });
});
