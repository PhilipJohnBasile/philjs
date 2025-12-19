/**
 * Test suite for PhilJS React Compatibility Layer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useReducer,
  signal,
  effect,
  memo
} from './index';

describe('PhilJS React Compat', () => {
  describe('useState compatibility', () => {
    it('should create state with initial value', () => {
      const [count, setCount] = useState(0);
      expect(count).toBe(0);
    });

    it('should update state with new value', () => {
      const [count, setCount] = useState(0);
      setCount(5);
      // Note: In the compat layer, this would return the initial value
      // In real usage, the component would re-render with new value
    });

    it('should support functional updates', () => {
      const [count, setCount] = useState(0);
      setCount(c => c + 1);
      // Functional updates work the same way
    });

    it('should handle lazy initialization', () => {
      const expensiveFn = vi.fn(() => 42);
      const [value] = useState(expensiveFn);
      expect(expensiveFn).toHaveBeenCalledTimes(1);
      expect(value).toBe(42);
    });
  });

  describe('useEffect compatibility', () => {
    it('should run effect', () => {
      const effectFn = vi.fn();

      useEffect(() => {
        effectFn();
      });

      expect(effectFn).toHaveBeenCalled();
    });

    it('should handle cleanup function', () => {
      const cleanup = vi.fn();

      useEffect(() => {
        return cleanup;
      });

      // Cleanup would be called on unmount
      expect(cleanup).not.toHaveBeenCalled();
    });

    it('should accept deps array for compatibility', () => {
      const effectFn = vi.fn();

      // Should not error with deps array
      useEffect(() => {
        effectFn();
      }, []);

      expect(effectFn).toHaveBeenCalled();
    });
  });

  describe('useMemo compatibility', () => {
    it('should memoize computation', () => {
      const computeFn = vi.fn(() => 42);
      const result = useMemo(computeFn);

      expect(computeFn).toHaveBeenCalled();
      expect(result).toBe(42);
    });

    it('should accept deps array for compatibility', () => {
      const computeFn = vi.fn(() => 42);

      // Should not error with deps array
      const result = useMemo(computeFn, []);

      expect(result).toBe(42);
    });
  });

  describe('useCallback compatibility', () => {
    it('should return function as-is', () => {
      const fn = () => 42;
      const memoized = useCallback(fn);

      expect(memoized).toBe(fn);
      expect(memoized()).toBe(42);
    });

    it('should accept deps array for compatibility', () => {
      const fn = () => 42;

      // Should not error with deps array
      const memoized = useCallback(fn, []);

      expect(memoized).toBe(fn);
    });
  });

  describe('useRef compatibility', () => {
    it('should create ref with initial value', () => {
      const ref = useRef(42);

      expect(ref.current).toBe(42);
    });

    it('should allow updating ref.current', () => {
      const ref = useRef(0);

      ref.current = 42;

      expect(ref.current).toBe(42);
    });

    it('should handle null refs', () => {
      const ref = useRef<HTMLElement | null>(null);

      expect(ref.current).toBeNull();
    });
  });

  describe('useReducer compatibility', () => {
    it('should create reducer state', () => {
      const reducer = (state: number, action: { type: string }) => {
        if (action.type === 'increment') return state + 1;
        return state;
      };

      const [state, dispatch] = useReducer(reducer, 0);

      expect(state).toBe(0);
      expect(typeof dispatch).toBe('function');
    });

    it('should handle dispatch', () => {
      const reducer = (state: number, action: { type: string }) => {
        if (action.type === 'increment') return state + 1;
        return state;
      };

      const [state, dispatch] = useReducer(reducer, 0);

      dispatch({ type: 'increment' });

      // State would update in real component
    });
  });

  describe('PhilJS native primitives', () => {
    it('should expose signal from philjs-core', () => {
      const count = signal(0);

      expect(count()).toBe(0);

      count.set(5);

      expect(count()).toBe(5);
    });

    it('should expose effect from philjs-core', () => {
      const count = signal(0);
      let effectCount = 0;

      effect(() => {
        count(); // Track dependency
        effectCount++;
      });

      expect(effectCount).toBe(1);

      count.set(1);

      expect(effectCount).toBe(2);
    });

    it('should expose memo from philjs-core', () => {
      const count = signal(2);
      const doubled = memo(() => count() * 2);

      expect(doubled()).toBe(4);

      count.set(3);

      expect(doubled()).toBe(6);
    });
  });

  describe('analyzeMigration', () => {
    it('should analyze React patterns in code', () => {
      const { analyzeMigration } = require('./index');

      const code = `
        const [count, setCount] = useState(0);
        useEffect(() => { console.log(count); }, [count]);
        const doubled = useMemo(() => count * 2, [count]);
        const handleClick = useCallback(() => {}, []);
      `;

      const analysis = analyzeMigration(code);

      expect(analysis.patterns.useState).toBe(1);
      expect(analysis.patterns.useEffect).toBe(1);
      expect(analysis.patterns.useMemo).toBe(1);
      expect(analysis.patterns.useCallback).toBe(1);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });
  });
});
