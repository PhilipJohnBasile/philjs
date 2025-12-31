import { describe, it, expect } from 'vitest';
import {
  Ok,
  Err,
  isOk,
  isErr,
  isResult,
  map,
  mapErr,
  andThen,
  unwrap,
  unwrapOr,
  matchResult,
} from '../result.js';

describe('result', () => {
  describe('Ok', () => {
    it('should create Ok result', () => {
      const result = Ok(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should work with any type', () => {
      const strResult = Ok('hello');
      const objResult = Ok({ name: 'test' });
      const arrResult = Ok([1, 2, 3]);

      expect(strResult.value).toBe('hello');
      expect(objResult.value).toEqual({ name: 'test' });
      expect(arrResult.value).toEqual([1, 2, 3]);
    });
  });

  describe('Err', () => {
    it('should create Err result', () => {
      const result = Err('error message');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('error message');
    });

    it('should work with Error objects', () => {
      const error = new Error('test error');
      const result = Err(error);
      expect(result.error).toBe(error);
    });
  });

  describe('isResult', () => {
    it('should return true for Ok', () => {
      expect(isResult(Ok(42))).toBe(true);
    });

    it('should return true for Err', () => {
      expect(isResult(Err('error'))).toBe(true);
    });

    it('should return false for non-results', () => {
      expect(isResult(null)).toBe(false);
      expect(isResult(undefined)).toBe(false);
      expect(isResult(42)).toBe(false);
      expect(isResult({ ok: 'string' })).toBe(false);
      expect(isResult({})).toBe(false);
    });
  });

  describe('isOk', () => {
    it('should return true for Ok results', () => {
      expect(isOk(Ok(42))).toBe(true);
    });

    it('should return false for Err results', () => {
      expect(isOk(Err('error'))).toBe(false);
    });
  });

  describe('isErr', () => {
    it('should return true for Err results', () => {
      expect(isErr(Err('error'))).toBe(true);
    });

    it('should return false for Ok results', () => {
      expect(isErr(Ok(42))).toBe(false);
    });
  });

  describe('map', () => {
    it('should transform Ok value', () => {
      const result = map(Ok(5), x => x * 2);
      expect(result).toEqual(Ok(10));
    });

    it('should not transform Err', () => {
      const result = map(Err('error'), (x: number) => x * 2);
      expect(result).toEqual(Err('error'));
    });
  });

  describe('mapErr', () => {
    it('should transform Err value', () => {
      const result = mapErr(Err('error'), e => e.toUpperCase());
      expect(result).toEqual(Err('ERROR'));
    });

    it('should not transform Ok', () => {
      const result = mapErr(Ok(42), (e: string) => e.toUpperCase());
      expect(result).toEqual(Ok(42));
    });
  });

  describe('andThen', () => {
    it('should chain Ok results', () => {
      const result = andThen(Ok(5), x => Ok(x * 2));
      expect(result).toEqual(Ok(10));
    });

    it('should propagate Err', () => {
      const result = andThen(Err('error'), (x: number) => Ok(x * 2));
      expect(result).toEqual(Err('error'));
    });

    it('should allow returning Err from function', () => {
      const result = andThen(Ok(5), x => x > 10 ? Ok(x) : Err('too small'));
      expect(result).toEqual(Err('too small'));
    });
  });

  describe('unwrap', () => {
    it('should return value for Ok', () => {
      expect(unwrap(Ok(42))).toBe(42);
    });

    it('should throw for Err with string', () => {
      expect(() => unwrap(Err('error message'))).toThrow('error message');
    });

    it('should throw for Err with Error object', () => {
      expect(() => unwrap(Err(new Error('test error')))).toThrow('test error');
    });
  });

  describe('unwrapOr', () => {
    it('should return value for Ok', () => {
      expect(unwrapOr(Ok(42), 0)).toBe(42);
    });

    it('should return fallback for Err', () => {
      expect(unwrapOr(Err('error'), 0)).toBe(0);
    });
  });

  describe('matchResult', () => {
    it('should call ok handler for Ok', () => {
      const result = matchResult(Ok(42), {
        ok: x => `value: ${x}`,
        err: e => `error: ${e}`,
      });
      expect(result).toBe('value: 42');
    });

    it('should call err handler for Err', () => {
      const result = matchResult(Err('error'), {
        ok: (x: number) => `value: ${x}`,
        err: e => `error: ${e}`,
      });
      expect(result).toBe('error: error');
    });
  });
});
