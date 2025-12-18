/**
 * Tests for no-unused-signals ESLint rule
 *
 * SKIPPED: Requires @typescript-eslint/rule-tester dependency
 * TODO: Install dependencies and enable tests
 */

import { describe, it, expect } from 'vitest';

describe.skip('no-unused-signals', () => {
  it('placeholder - requires @typescript-eslint/rule-tester', () => {
    expect(true).toBe(true);
  });
});

// Original tests below - will be enabled when dependencies are installed
/*
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import rule from '../rules/no-unused-signals';

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

ruleTester.run_DISABLED('no-unused-signals', rule, {
  valid: [
    {
      name: 'signal is read via .value',
      code: `
        const count = signal(0);
        console.log(count.value);
      `,
    },
    {
      name: 'signal is read via direct call',
      code: `
        const count = signal(0);
        console.log(count());
      `,
    },
    {
      name: 'signal is used in JSX',
      code: `
        const count = signal(0);
        const view = <div>{count.value}</div>;
      `,
    },
    {
      name: 'signal is written and read',
      code: `
        const count = signal(0);
        count.value = 5;
        console.log(count.value);
      `,
    },
    {
      name: 'linkedSignal is used',
      code: `
        const count = linkedSignal(() => 0);
        return count.value;
      `,
    },
    {
      name: 'signal passed to function',
      code: `
        const count = signal(0);
        useEffect(() => {
          console.log(count());
        });
      `,
    },
  ],
  invalid: [
    {
      name: 'signal is created but never read',
      code: `
        const count = signal(0);
      `,
      errors: [
        {
          messageId: 'unusedSignal',
          data: { name: 'count' },
        },
      ],
    },
    {
      name: 'signal is only written to',
      code: `
        const count = signal(0);
        count.value = 5;
      `,
      errors: [
        {
          messageId: 'unusedSignal',
          data: { name: 'count' },
        },
      ],
    },
    {
      name: 'linkedSignal is created but never read',
      code: `
        const derived = linkedSignal(() => count.value * 2);
      `,
      errors: [
        {
          messageId: 'unusedSignal',
          data: { name: 'derived' },
        },
      ],
    },
    {
      name: 'multiple unused signals',
      code: `
        const count = signal(0);
        const name = signal('John');
        const used = signal(42);
        console.log(used.value);
      `,
      errors: [
        {
          messageId: 'unusedSignal',
          data: { name: 'count' },
        },
        {
          messageId: 'unusedSignal',
          data: { name: 'name' },
        },
      ],
    },
  ],
});
*/
