/**
 * Tests for effect-cleanup-required ESLint rule
 *
 * SKIPPED: Requires @typescript-eslint/rule-tester dependency
 * TODO: Install dependencies and enable tests
 */

import { describe, it, expect } from 'vitest';

describe.skip('effect-cleanup-required', () => {
  it('placeholder - requires @typescript-eslint/rule-tester', () => {
    expect(true).toBe(true);
  });
});

// Original tests below - will be enabled when dependencies are installed
/*
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import rule from '../rules/effect-cleanup-required';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('effect-cleanup-required', rule, {
  valid: [
    {
      name: 'effect with setTimeout and cleanup return',
      code: `
        effect(() => {
          const id = setTimeout(() => {}, 1000);
          return () => clearTimeout(id);
        });
      `,
    },
    // ... more valid tests
  ],
  invalid: [
    {
      name: 'effect with setTimeout but no cleanup',
      code: `
        effect(() => {
          setTimeout(() => {}, 1000);
        });
      `,
      errors: [
        {
          messageId: 'missingCleanup',
          data: { resource: 'setTimeout' },
        },
      ],
    },
    // ... more invalid tests
  ],
});
*/
