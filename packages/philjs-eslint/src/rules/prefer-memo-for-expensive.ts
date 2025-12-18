import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/philipdexter/philjs/blob/main/packages/philjs-eslint/docs/rules/${name}.md`
);

type MessageIds = 'preferMemo';
type Options = [{ threshold?: number }];

export default createRule<Options, MessageIds>({
  name: 'prefer-memo-for-expensive',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggest using memo() for expensive computed values that depend on signals',
      recommended: 'recommended',
    },
    messages: {
      preferMemo: 'This computed value depends on signals and contains {{reason}}. Consider wrapping it in memo() for better performance.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          threshold: {
            type: 'number',
            default: 3,
            description: 'Minimum complexity threshold to suggest memo()',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ threshold: 3 }],
  create(context) {
    const options = context.options[0] || {};
    const threshold = options.threshold ?? 3;

    // Patterns that indicate expensive operations
    const EXPENSIVE_OPERATIONS = [
      'map',
      'filter',
      'reduce',
      'sort',
      'find',
      'findIndex',
      'forEach',
      'some',
      'every',
      'slice',
      'splice',
      'concat',
      'join',
      'split',
    ];

    function countComplexity(node: TSESTree.Node): number {
      let complexity = 0;

      const walk = (n: TSESTree.Node): void => {
        // Count loops
        if (
          n.type === 'ForStatement' ||
          n.type === 'ForInStatement' ||
          n.type === 'ForOfStatement' ||
          n.type === 'WhileStatement' ||
          n.type === 'DoWhileStatement'
        ) {
          complexity += 2;
        }

        // Count array methods
        if (
          n.type === 'CallExpression' &&
          n.callee.type === 'MemberExpression' &&
          n.callee.property.type === 'Identifier' &&
          EXPENSIVE_OPERATIONS.includes(n.callee.property.name)
        ) {
          complexity += 1;
        }

        // Count nested function calls
        if (n.type === 'CallExpression') {
          complexity += 0.5;
        }

        // Recursively walk children
        for (const key in n) {
          const value = (n as any)[key];
          if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
              value.forEach((item) => {
                if (item && typeof item === 'object' && item.type) {
                  walk(item);
                }
              });
            } else if (value.type) {
              walk(value);
            }
          }
        }
      };

      walk(node);
      return complexity;
    }

    function usesSignals(node: TSESTree.Node): boolean {
      let hasSignalAccess = false;

      const walk = (n: TSESTree.Node): void => {
        // Check for signal.value access
        if (
          n.type === 'MemberExpression' &&
          n.property.type === 'Identifier' &&
          n.property.name === 'value'
        ) {
          hasSignalAccess = true;
          return;
        }

        // Check for signal() calls
        if (
          n.type === 'CallExpression' &&
          n.callee.type === 'Identifier' &&
          !['memo', 'effect', 'signal', 'linkedSignal'].includes(n.callee.name)
        ) {
          // Might be a signal call, but we need more context
          // For now, check if the callee name starts with lowercase (likely a signal)
          if (n.callee.name[0] === n.callee.name[0].toLowerCase()) {
            hasSignalAccess = true;
            return;
          }
        }

        // Recursively walk children
        for (const key in n) {
          const value = (n as any)[key];
          if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
              value.forEach((item) => {
                if (item && typeof item === 'object' && item.type) {
                  walk(item);
                }
              });
            } else if (value.type) {
              walk(value);
            }
          }
        }
      };

      walk(node);
      return hasSignalAccess;
    }

    function getExpensiveReason(node: TSESTree.Node): string | null {
      const complexity = countComplexity(node);

      if (complexity >= threshold) {
        let reasons: string[] = [];

        // Check for specific patterns
        const walk = (n: TSESTree.Node): void => {
          if (
            n.type === 'ForStatement' ||
            n.type === 'ForInStatement' ||
            n.type === 'ForOfStatement' ||
            n.type === 'WhileStatement' ||
            n.type === 'DoWhileStatement'
          ) {
            reasons.push('loops');
          }

          if (
            n.type === 'CallExpression' &&
            n.callee.type === 'MemberExpression' &&
            n.callee.property.type === 'Identifier' &&
            EXPENSIVE_OPERATIONS.includes(n.callee.property.name)
          ) {
            if (!reasons.includes('array operations')) {
              reasons.push('array operations');
            }
          }

          for (const key in n) {
            const value = (n as any)[key];
            if (value && typeof value === 'object') {
              if (Array.isArray(value)) {
                value.forEach((item) => {
                  if (item && typeof item === 'object' && item.type) {
                    walk(item);
                  }
                });
              } else if (value.type) {
                walk(value);
              }
            }
          }
        };

        walk(node);

        if (reasons.length > 0) {
          return reasons.join(' and ');
        }
        return 'complex computations';
      }

      return null;
    }

    function isAlreadyMemoized(node: TSESTree.Node): boolean {
      let current = node.parent;
      while (current) {
        if (
          current.type === 'CallExpression' &&
          current.callee.type === 'Identifier' &&
          current.callee.name === 'memo'
        ) {
          return true;
        }
        current = current.parent;
      }
      return false;
    }

    return {
      VariableDeclarator(node) {
        // Check if this is a computed value (not a signal/memo declaration)
        if (
          node.init &&
          node.init.type !== 'CallExpression'
        ) {
          return;
        }

        if (
          node.init &&
          node.init.type === 'CallExpression' &&
          node.init.callee.type === 'Identifier'
        ) {
          // Skip if already using memo, signal, linkedSignal, or resource
          if (['memo', 'signal', 'linkedSignal', 'resource'].includes(node.init.callee.name)) {
            return;
          }
        }

        if (!node.init) return;

        // Check if the initialization uses signals
        if (usesSignals(node.init) && !isAlreadyMemoized(node)) {
          const reason = getExpensiveReason(node.init);
          if (reason) {
            context.report({
              node: node.init,
              messageId: 'preferMemo',
              data: { reason },
            });
          }
        }
      },

      // Also check arrow functions and function expressions
      ArrowFunctionExpression(node) {
        if (!node.body || node.body.type === 'BlockStatement') return;

        // Skip if this is already inside a memo call
        if (isAlreadyMemoized(node)) return;

        // Check if the body uses signals
        if (usesSignals(node.body)) {
          const reason = getExpensiveReason(node.body);
          if (reason) {
            context.report({
              node: node.body,
              messageId: 'preferMemo',
              data: { reason },
            });
          }
        }
      },
    };
  },
});
