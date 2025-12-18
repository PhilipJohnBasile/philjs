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
          window.addEventListener('resize', handler);
          return () => window.removeEventListener('resize', handler);
        });
      `,
    },
    {
      name: 'effect with onCleanup helper',
      code: `
        effect(() => {
          const id = setTimeout(() => {}, 1000);
          onCleanup(() => clearTimeout(id));
        });
      `,
    },
    {
      name: 'effect without cleanup patterns',
      code: `
        effect(() => {
          console.log('no cleanup needed');
        });
      `,
    },
    {
      name: 'effect with subscribe and cleanup',
      code: `
        effect(() => {
          const subscription = observable.subscribe(value => {});
          return () => subscription.unsubscribe();
        });
      `,
    },
    {
      name: 'effect with WebSocket and cleanup',
      code: `
        effect(() => {
          const ws = new WebSocket('ws://localhost');
          return () => ws.close();
        });
      `,
    },
    {
      name: 'effect with requestAnimationFrame and cleanup',
      code: `
        effect(() => {
          const id = requestAnimationFrame(() => {});
          return () => cancelAnimationFrame(id);
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
          window.addEventListener('resize', () => {});
        });
      `,
      errors: [
        {
          messageId: 'missingCleanup',
          data: { resource: 'addEventListener' },
        },
      ],
    },
    {
      name: 'effect with subscribe but no cleanup',
      code: `
        effect(() => {
          observable.subscribe(value => {});
        });
      `,
      errors: [
        {
          messageId: 'missingCleanup',
          data: { resource: 'subscribe' },
        },
      ],
    },
    {
      name: 'effect with WebSocket but no cleanup',
      code: `
        effect(() => {
          const ws = new WebSocket('ws://localhost');
        });
      `,
      errors: [
        {
          messageId: 'missingCleanup',
          data: { resource: 'WebSocket' },
        },
      ],
    },
    {
      name: 'effect with requestAnimationFrame but no cleanup',
      code: `
        effect(() => {
          requestAnimationFrame(() => {});
        });
      `,
      errors: [
        {
          messageId: 'missingCleanup',
          data: { resource: 'requestAnimationFrame' },
        },
      ],
    },
    {
      name: 'effect with requestIdleCallback but no cleanup',
      code: `
        effect(() => {
          requestIdleCallback(() => {});
        });
      `,
      errors: [
        {
          messageId: 'missingCleanup',
          data: { resource: 'requestIdleCallback' },
        },
      ],
    },
  ],
});
