/**
 * Tests for effect-cleanup-required ESLint rule
 */

import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import * as parser from '@typescript-eslint/parser';
import rule from '../rules/effect-cleanup-required';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
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
    {
      name: 'effect with setInterval and cleanup return',
      code: `
        effect(() => {
          const id = setInterval(() => {}, 1000);
          return () => clearInterval(id);
        });
      `,
    },
    {
      name: 'effect with addEventListener and cleanup return',
      code: `
        effect(() => {
          const handler = () => {};
          window.addEventListener('click', handler);
          return () => window.removeEventListener('click', handler);
        });
      `,
    },
    {
      name: 'effect without any resources that need cleanup',
      code: `
        effect(() => {
          console.log('Running effect');
        });
      `,
    },
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
    {
      name: 'effect with setInterval but no cleanup',
      code: `
        effect(() => {
          setInterval(() => {}, 1000);
        });
      `,
      errors: [
        {
          messageId: 'missingCleanup',
          data: { resource: 'setInterval' },
        },
      ],
    },
    {
      name: 'effect with addEventListener but no cleanup',
      code: `
        effect(() => {
          window.addEventListener('click', () => {});
        });
      `,
      errors: [
        {
          messageId: 'missingCleanup',
          data: { resource: 'addEventListener' },
        },
      ],
    },
  ],
});
