import { describe, it, expect } from 'vitest';
import { validators, validateValue, patterns } from './validation.js';

describe('Validators', () => {
  describe('required', () => {
    it('should validate non-empty values', async () => {
      const rule = validators.required();

      expect(await validateValue('test', rule)).toBeNull();
      expect(await validateValue('', rule)).toBe('This field is required');
      expect(await validateValue(null, rule)).toBe('This field is required');
      expect(await validateValue(undefined, rule)).toBe('This field is required');
    });
  });

  describe('email', () => {
    it('should validate email addresses', async () => {
      const rule = validators.email();

      expect(await validateValue('test@example.com', rule)).toBeNull();
      expect(await validateValue('invalid', rule)).toBe('Invalid email address');
      expect(await validateValue('', rule)).toBeNull(); // Empty is valid (use required separately)
    });
  });

  describe('minLength', () => {
    it('should validate minimum length', async () => {
      const rule = validators.minLength(5);

      expect(await validateValue('hello', rule)).toBeNull();
      expect(await validateValue('hi', rule)).toBe('Must be at least 5 characters');
    });
  });

  describe('maxLength', () => {
    it('should validate maximum length', async () => {
      const rule = validators.maxLength(5);

      expect(await validateValue('hello', rule)).toBeNull();
      expect(await validateValue('hello world', rule)).toBe('Must be at most 5 characters');
    });
  });

  describe('min', () => {
    it('should validate minimum value', async () => {
      const rule = validators.min(10);

      expect(await validateValue(15, rule)).toBeNull();
      expect(await validateValue(5, rule)).toBe('Must be at least 10');
    });
  });

  describe('max', () => {
    it('should validate maximum value', async () => {
      const rule = validators.max(10);

      expect(await validateValue(5, rule)).toBeNull();
      expect(await validateValue(15, rule)).toBe('Must be at most 10');
    });
  });

  describe('pattern', () => {
    it('should validate pattern', async () => {
      const rule = validators.pattern(/^\d+$/, 'Must be numeric');

      expect(await validateValue('123', rule)).toBeNull();
      expect(await validateValue('abc', rule)).toBe('Must be numeric');
    });
  });

  describe('url', () => {
    it('should validate URLs', async () => {
      const rule = validators.url();

      expect(await validateValue('https://example.com', rule)).toBeNull();
      expect(await validateValue('invalid', rule)).toBe('Invalid URL');
    });
  });

  describe('matches', () => {
    it('should validate matching fields', async () => {
      const rule = validators.matches('password');
      const values = { password: 'secret123', confirmPassword: 'secret123' };

      expect(await validateValue('secret123', rule, values)).toBeNull();
      expect(await validateValue('different', rule, values)).toBe('Must match password');
    });
  });

  describe('oneOf', () => {
    it('should validate value is in list', async () => {
      const rule = validators.oneOf(['red', 'green', 'blue']);

      expect(await validateValue('red', rule)).toBeNull();
      expect(await validateValue('yellow', rule)).toBe('Must be one of: red, green, blue');
    });
  });

  describe('custom', () => {
    it('should validate with custom function', async () => {
      const rule = validators.custom(
        (value) => value === 'special',
        'Must be special'
      );

      expect(await validateValue('special', rule)).toBeNull();
      expect(await validateValue('other', rule)).toBe('Must be special');
    });

    it('should work with async validation', async () => {
      const rule = validators.custom(
        async (value) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return value === 'async';
        },
        'Must be async'
      );

      expect(await validateValue('async', rule)).toBeNull();
      expect(await validateValue('other', rule)).toBe('Must be async');
    });
  });
});

describe('Patterns', () => {
  it('should have common patterns', () => {
    expect(patterns.email.test('test@example.com')).toBe(true);
    expect(patterns.url.test('https://example.com')).toBe(true);
    expect(patterns.numeric.test('12345')).toBe(true);
    expect(patterns.username.test('user_name')).toBe(true);
  });
});
