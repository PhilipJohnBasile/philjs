/**
 * Comprehensive tests for Advanced Validation
 * Testing async validators, conditional rules, cross-field validation, schema validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  advancedValidators,
  SchemaValidator,
  createSchemaValidator,
  when,
  crossField,
  dependsOn,
  messageWithField,
  combineResults,
  formatErrors,
  hasErrors,
  getFirstError,
  type ValidationSchema,
  type ValidationResult,
} from './advanced-validation';

describe('advancedValidators', () => {
  describe('emailWithDomainCheck', () => {
    it('should validate email format', async () => {
      const rule = advancedValidators.emailWithDomainCheck();

      expect(await rule.validate('test@example.com')).toBe(true);
      expect(await rule.validate('invalid')).toBe(false);
      expect(await rule.validate('')).toBe(true); // Empty is valid
    });

    it('should validate allowed domains', async () => {
      const rule = advancedValidators.emailWithDomainCheck(['company.com', 'org.com']);

      expect(await rule.validate('user@company.com')).toBe(true);
      expect(await rule.validate('user@org.com')).toBe(true);
      expect(await rule.validate('user@other.com')).toBe(false);
    });

    it('should be case insensitive for domains', async () => {
      const rule = advancedValidators.emailWithDomainCheck(['Company.com']);

      expect(await rule.validate('user@company.com')).toBe(true);
      expect(await rule.validate('user@COMPANY.COM')).toBe(true);
    });
  });

  describe('usernameAvailable', () => {
    it('should call check function for valid usernames', async () => {
      const checkFn = vi.fn().mockResolvedValue(true);
      const rule = advancedValidators.usernameAvailable(checkFn);

      const result = await rule.validate('validuser');

      expect(checkFn).toHaveBeenCalledWith('validuser');
      expect(result).toBe(true);
    });

    it('should skip check for short usernames', async () => {
      const checkFn = vi.fn();
      const rule = advancedValidators.usernameAvailable(checkFn);

      expect(await rule.validate('ab')).toBe(true);
      expect(checkFn).not.toHaveBeenCalled();
    });

    it('should return false when username is taken', async () => {
      const checkFn = vi.fn().mockResolvedValue(false);
      const rule = advancedValidators.usernameAvailable(checkFn);

      expect(await rule.validate('takenuser')).toBe(false);
    });
  });

  describe('passwordStrength', () => {
    it('should validate weak passwords', () => {
      const rule = advancedValidators.passwordStrength('weak');

      expect(rule.validate('password')).toBe(true);
      expect(rule.validate('short')).toBe(false);
    });

    it('should validate medium passwords', () => {
      const rule = advancedValidators.passwordStrength('medium');

      expect(rule.validate('Password1')).toBe(true);
      expect(rule.validate('password')).toBe(false);
    });

    it('should validate strong passwords', () => {
      const rule = advancedValidators.passwordStrength('strong');

      expect(rule.validate('Password1!')).toBe(true);
      expect(rule.validate('Password1')).toBe(false);
    });

    it('should validate very strong passwords', () => {
      const rule = advancedValidators.passwordStrength('very-strong');

      expect(rule.validate('LongPassword123!')).toBe(true);
      expect(rule.validate('Password1!')).toBe(false);
    });
  });

  describe('file', () => {
    const createMockFile = (name: string, size: number, type: string): File => {
      return new File([''.padStart(size, 'a')], name, { type });
    };

    it('should validate file size', () => {
      const rule = advancedValidators.file({ maxSize: 1000 });

      expect(rule.validate(createMockFile('test.txt', 500, 'text/plain'))).toBe(true);
      expect(rule.validate(createMockFile('test.txt', 1500, 'text/plain'))).toBe(false);
    });

    it('should validate file types', () => {
      const rule = advancedValidators.file({ allowedTypes: ['image/png', 'image/jpeg'] });

      expect(rule.validate(createMockFile('test.png', 100, 'image/png'))).toBe(true);
      expect(rule.validate(createMockFile('test.pdf', 100, 'application/pdf'))).toBe(false);
    });

    it('should validate max files', () => {
      const rule = advancedValidators.file({ maxFiles: 3 });
      const files = [
        createMockFile('a.txt', 10, 'text/plain'),
        createMockFile('b.txt', 10, 'text/plain'),
        createMockFile('c.txt', 10, 'text/plain'),
      ];

      expect(rule.validate(files)).toBe(true);
      expect(rule.validate([...files, createMockFile('d.txt', 10, 'text/plain')])).toBe(false);
    });
  });

  describe('date', () => {
    it('should validate date range', () => {
      const min = new Date('2024-01-01');
      const max = new Date('2024-12-31');
      const rule = advancedValidators.date({ min, max });

      expect(rule.validate(new Date('2024-06-15'))).toBe(true);
      expect(rule.validate(new Date('2023-12-31'))).toBe(false);
      expect(rule.validate(new Date('2025-01-01'))).toBe(false);
    });

    it('should exclude weekends', () => {
      const rule = advancedValidators.date({ excludeWeekends: true });

      // Wednesday
      expect(rule.validate(new Date('2024-01-03'))).toBe(true);
      // Saturday
      expect(rule.validate(new Date('2024-01-06'))).toBe(false);
      // Sunday
      expect(rule.validate(new Date('2024-01-07'))).toBe(false);
    });

    it('should exclude specific dates', () => {
      const rule = advancedValidators.date({
        excludeDates: [new Date('2024-01-01'), new Date('2024-12-25')],
      });

      expect(rule.validate(new Date('2024-01-02'))).toBe(true);
      expect(rule.validate(new Date('2024-01-01'))).toBe(false);
    });

    it('should handle string dates', () => {
      const rule = advancedValidators.date({});

      expect(rule.validate('2024-06-15')).toBe(true);
      expect(rule.validate('invalid-date')).toBe(false);
    });
  });

  describe('array', () => {
    it('should validate min length', () => {
      const rule = advancedValidators.array({ min: 2 });

      expect(rule.validate([1, 2, 3])).toBe(true);
      expect(rule.validate([1])).toBe(false);
    });

    it('should validate max length', () => {
      const rule = advancedValidators.array({ max: 3 });

      expect(rule.validate([1, 2, 3])).toBe(true);
      expect(rule.validate([1, 2, 3, 4])).toBe(false);
    });

    it('should validate uniqueness', () => {
      const rule = advancedValidators.array({ unique: true });

      expect(rule.validate([1, 2, 3])).toBe(true);
      expect(rule.validate([1, 2, 2])).toBe(false);
    });

    it('should validate items', () => {
      const itemRule = { validate: (v: any) => v > 0, message: 'Must be positive' };
      const rule = advancedValidators.array({ itemValidator: itemRule });

      expect(rule.validate([1, 2, 3])).toBe(true);
      expect(rule.validate([1, -1, 3])).toBe(false);
    });

    it('should reject non-arrays', () => {
      const rule = advancedValidators.array({});

      expect(rule.validate('not an array' as any)).toBe(false);
    });
  });

  describe('creditCard', () => {
    it('should validate valid credit cards using Luhn algorithm', () => {
      const rule = advancedValidators.creditCard();

      // Valid test card numbers
      expect(rule.validate('4111111111111111')).toBe(true); // Visa
      expect(rule.validate('5500000000000004')).toBe(true); // Mastercard
      expect(rule.validate('340000000000009')).toBe(true); // Amex
    });

    it('should reject invalid credit cards', () => {
      const rule = advancedValidators.creditCard();

      expect(rule.validate('4111111111111112')).toBe(false); // Invalid Luhn
      expect(rule.validate('123')).toBe(false); // Too short
    });

    it('should handle formatted numbers', () => {
      const rule = advancedValidators.creditCard();

      expect(rule.validate('4111 1111 1111 1111')).toBe(true);
      expect(rule.validate('4111-1111-1111-1111')).toBe(true);
    });
  });

  describe('iban', () => {
    it('should validate valid IBANs', () => {
      const rule = advancedValidators.iban();

      // Test IBANs (these may not be real accounts)
      expect(rule.validate('GB82 WEST 1234 5698 7654 32')).toBe(true);
      expect(rule.validate('DE89 3704 0044 0532 0130 00')).toBe(true);
    });

    it('should reject invalid IBANs', () => {
      const rule = advancedValidators.iban();

      expect(rule.validate('INVALID')).toBe(false);
      expect(rule.validate('GB82 WEST 1234')).toBe(false);
    });
  });

  describe('json', () => {
    it('should validate valid JSON', () => {
      const rule = advancedValidators.json();

      expect(rule.validate('{"key": "value"}')).toBe(true);
      expect(rule.validate('[1, 2, 3]')).toBe(true);
      expect(rule.validate('"string"')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const rule = advancedValidators.json();

      expect(rule.validate('{invalid}')).toBe(false);
      expect(rule.validate('not json')).toBe(false);
    });
  });

  describe('slug', () => {
    it('should validate valid slugs', () => {
      const rule = advancedValidators.slug();

      expect(rule.validate('my-slug')).toBe(true);
      expect(rule.validate('slug123')).toBe(true);
      expect(rule.validate('simple')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      const rule = advancedValidators.slug();

      expect(rule.validate('My Slug')).toBe(false);
      expect(rule.validate('slug_with_underscores')).toBe(false);
      expect(rule.validate('UPPERCASE')).toBe(false);
    });
  });

  describe('uuid', () => {
    it('should validate any UUID', () => {
      const rule = advancedValidators.uuid();

      expect(rule.validate('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(rule.validate('not-a-uuid')).toBe(false);
    });

    it('should validate UUID v4', () => {
      const rule = advancedValidators.uuid(4);

      expect(rule.validate('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      // v1 UUID should fail v4 validation
      expect(rule.validate('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    });
  });
});

describe('SchemaValidator', () => {
  describe('validate', () => {
    it('should validate all fields', async () => {
      const schema: ValidationSchema<{ name: string; email: string }> = {
        rules: {
          name: { validate: (v) => !!v && v.length >= 2, message: 'Name too short' },
          email: { validate: (v) => !!v && v.includes('@'), message: 'Invalid email' },
        },
      };

      const validator = createSchemaValidator(schema);
      const result = await validator.validate({ name: 'Jo', email: 'test@example.com' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return errors for invalid fields', async () => {
      const schema: ValidationSchema<{ name: string }> = {
        rules: {
          name: { validate: (v) => !!v && v.length >= 3, message: 'Name too short' },
        },
      };

      const validator = createSchemaValidator(schema);
      const result = await validator.validate({ name: 'AB' });

      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe('Name too short');
    });

    it('should validate multiple rules per field', async () => {
      const schema: ValidationSchema<{ password: string }> = {
        rules: {
          password: [
            { validate: (v) => !!v && v.length >= 8, message: 'Too short' },
            { validate: (v) => !!v && /[A-Z]/.test(v), message: 'Needs uppercase' },
          ],
        },
      };

      const validator = createSchemaValidator(schema);

      const shortResult = await validator.validate({ password: 'short' });
      expect(shortResult.errors.password).toBe('Too short');

      const noUpperResult = await validator.validate({ password: 'longenough' });
      expect(noUpperResult.errors.password).toBe('Needs uppercase');

      const validResult = await validator.validate({ password: 'LongEnough' });
      expect(validResult.valid).toBe(true);
    });
  });

  describe('validateField', () => {
    it('should validate single field', async () => {
      const schema: ValidationSchema<{ name: string; email: string }> = {
        rules: {
          name: { validate: (v) => !!v, message: 'Required' },
          email: { validate: (v) => !!v, message: 'Required' },
        },
      };

      const validator = createSchemaValidator(schema);
      const result = await validator.validateField('name', '', { name: '', email: '' });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Required');
    });
  });

  describe('async validation', () => {
    it('should validate async rules', async () => {
      const schema: ValidationSchema<{ username: string }> = {
        rules: {},
        asyncRules: {
          username: {
            validate: async (value) => {
              await new Promise((r) => setTimeout(r, 10));
              return value !== 'taken';
            },
            message: 'Username is taken',
          },
        },
      };

      const validator = createSchemaValidator(schema);

      const available = await validator.validate({ username: 'available' });
      expect(available.valid).toBe(true);

      const taken = await validator.validate({ username: 'taken' });
      expect(taken.valid).toBe(false);
      expect(taken.errors.username).toBe('Username is taken');
    });
  });

  describe('conditional validation', () => {
    it('should apply conditional rules', async () => {
      const schema: ValidationSchema<{ type: string; businessName: string }> = {
        rules: {},
        conditionalRules: {
          businessName: [
            {
              when: (values) => values.type === 'business',
              rule: { validate: (v) => !!v, message: 'Business name required' },
            },
          ],
        },
      };

      const validator = createSchemaValidator(schema);

      const personal = await validator.validate({ type: 'personal', businessName: '' });
      expect(personal.valid).toBe(true);

      const business = await validator.validate({ type: 'business', businessName: '' });
      expect(business.valid).toBe(false);
      expect(business.errors.businessName).toBe('Business name required');
    });
  });

  describe('cross-field validation', () => {
    it('should validate across fields', async () => {
      const schema: ValidationSchema<{ password: string; confirmPassword: string }> = {
        rules: {},
        crossFieldRules: [
          {
            fields: ['password', 'confirmPassword'],
            validate: (values) => values.password === values.confirmPassword,
            message: 'Passwords must match',
            target: 'confirmPassword',
          },
        ],
      };

      const validator = createSchemaValidator(schema);

      const matching = await validator.validate({
        password: 'secret123',
        confirmPassword: 'secret123',
      });
      expect(matching.valid).toBe(true);

      const notMatching = await validator.validate({
        password: 'secret123',
        confirmPassword: 'different',
      });
      expect(notMatching.valid).toBe(false);
      expect(notMatching.errors.confirmPassword).toBe('Passwords must match');
    });
  });

  describe('validateGroup', () => {
    it('should validate only fields in group', async () => {
      const schema: ValidationSchema<{ name: string; email: string; phone: string }> = {
        rules: {
          name: { validate: (v) => !!v, message: 'Required' },
          email: { validate: (v) => !!v, message: 'Required' },
          phone: { validate: (v) => !!v, message: 'Required' },
        },
        groups: [{ name: 'contact', fields: ['email', 'phone'] }],
      };

      const validator = createSchemaValidator(schema);
      const errors = await validator.validateGroup('contact', {
        name: '', // invalid but not in group
        email: 'test@example.com',
        phone: '',
      });

      expect(errors.name).toBeUndefined();
      expect(errors.email).toBeUndefined();
      expect(errors.phone).toBe('Required');
    });
  });

  describe('cancelPending', () => {
    it('should cancel pending async validations', async () => {
      let validationCompleted = false;
      const schema: ValidationSchema<{ username: string }> = {
        asyncRules: {
          username: {
            validate: async () => {
              await new Promise((r) => setTimeout(r, 100));
              validationCompleted = true;
              return true;
            },
            message: 'Error',
          },
        },
      };

      const validator = createSchemaValidator(schema);

      // Start validation
      const validationPromise = validator.validate({ username: 'test' });

      // Cancel immediately
      validator.cancelPending();

      // Wait for some time
      await new Promise((r) => setTimeout(r, 150));

      // Validation should not have completed
      expect(validationCompleted).toBe(false);
    });
  });
});

describe('Validation Utilities', () => {
  describe('when', () => {
    it('should create conditional rule', () => {
      const rule = when(
        (values) => values.type === 'premium',
        { validate: (v) => !!v, message: 'Required for premium' }
      );

      expect(rule.when({ type: 'premium' })).toBe(true);
      expect(rule.when({ type: 'free' })).toBe(false);
    });
  });

  describe('crossField', () => {
    it('should create cross-field rule', () => {
      const rule = crossField(
        ['start', 'end'],
        (values) => (values.start as number) < (values.end as number),
        'Start must be before end',
        'end'
      );

      expect(rule.fields).toEqual(['start', 'end']);
      expect(rule.validate({ start: 1, end: 2 })).toBe(true);
      expect(rule.validate({ start: 2, end: 1 })).toBe(false);
      expect(rule.target).toBe('end');
    });
  });

  describe('dependsOn', () => {
    it('should create dependency-based conditional rule', () => {
      const rule = dependsOn(
        'hasEmail',
        (value) => value === true,
        { validate: (v) => !!v, message: 'Email required' }
      );

      expect(rule.when({ hasEmail: true })).toBe(true);
      expect(rule.when({ hasEmail: false })).toBe(false);
    });
  });

  describe('messageWithField', () => {
    it('should create message template', () => {
      const template = messageWithField('{field} is required');

      expect(template('Email')).toBe('Email is required');
      expect(template('Name')).toBe('Name is required');
    });
  });

  describe('combineResults', () => {
    it('should combine multiple validation results', () => {
      const result1: ValidationResult = {
        valid: true,
        errors: {},
        warnings: {},
        fieldResults: new Map(),
      };

      const result2: ValidationResult = {
        valid: false,
        errors: { name: 'Required' },
        warnings: {},
        fieldResults: new Map(),
      };

      const combined = combineResults([result1, result2]);

      expect(combined.valid).toBe(false);
      expect(combined.errors.name).toBe('Required');
    });
  });

  describe('formatErrors', () => {
    it('should format errors for display', () => {
      const errors = { name: 'Required', email: 'Invalid' };
      const formatted = formatErrors(errors);

      expect(formatted).toEqual(['name: Required', 'email: Invalid']);
    });

    it('should use labels when provided', () => {
      const errors = { name: 'Required' };
      const labels = { name: 'Full Name' };
      const formatted = formatErrors(errors, labels);

      expect(formatted).toEqual(['Full Name: Required']);
    });

    it('should skip null/undefined errors', () => {
      const errors = { name: 'Required', email: null, phone: undefined };
      const formatted = formatErrors(errors as any);

      expect(formatted).toEqual(['name: Required']);
    });
  });

  describe('hasErrors', () => {
    it('should return true if there are errors', () => {
      expect(hasErrors({ name: 'Required' })).toBe(true);
      expect(hasErrors({ name: null })).toBe(false);
      expect(hasErrors({})).toBe(false);
    });
  });

  describe('getFirstError', () => {
    it('should return first error', () => {
      const errors = { name: 'Name required', email: 'Email required' };
      const first = getFirstError(errors);

      expect(first?.[0]).toBe('name');
      expect(first?.[1]).toBe('Name required');
    });

    it('should return null if no errors', () => {
      expect(getFirstError({})).toBeNull();
      expect(getFirstError({ name: null } as any)).toBeNull();
    });
  });
});
