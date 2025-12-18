import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/philipdexter/philjs/blob/main/packages/philjs-eslint/docs/rules/${name}.md`
);

type MessageIds = 'missingCleanup' | 'cleanupNotReturned';
type Options = [];

export default createRule<Options, MessageIds>({
  name: 'effect-cleanup-required',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require cleanup functions for effects that use timers, subscriptions, or event listeners',
      recommended: 'recommended',
    },
    messages: {
      missingCleanup: 'Effect uses {{resource}} but does not return a cleanup function. This can cause memory leaks.',
      cleanupNotReturned: 'Effect calls onCleanup() but does not return a cleanup function. Use return statement or onCleanup() for proper cleanup.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Patterns that require cleanup
    const CLEANUP_REQUIRED_PATTERNS = [
      'setTimeout',
      'setInterval',
      'addEventListener',
      'requestAnimationFrame',
      'requestIdleCallback',
      'subscribe',
      'on', // event emitter pattern
      'WebSocket',
      'EventSource',
    ];

    function hasCleanupReturn(node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression): boolean {
      if (!node.body) return false;

      // Arrow function with implicit return
      if (node.body.type !== 'BlockStatement') {
        return node.body.type === 'FunctionExpression' ||
               node.body.type === 'ArrowFunctionExpression';
      }

      // Check for explicit return statement with function
      const blockBody = node.body.body;
      return blockBody.some((statement) => {
        if (statement.type === 'ReturnStatement' && statement.argument) {
          return (
            statement.argument.type === 'FunctionExpression' ||
            statement.argument.type === 'ArrowFunctionExpression'
          );
        }
        return false;
      });
    }

    function hasOnCleanupCall(node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression): boolean {
      if (!node.body || node.body.type !== 'BlockStatement') return false;

      const hasCall = (statements: TSESTree.Statement[]): boolean => {
        return statements.some((statement) => {
          if (statement.type === 'ExpressionStatement' &&
              statement.expression.type === 'CallExpression' &&
              statement.expression.callee.type === 'Identifier' &&
              statement.expression.callee.name === 'onCleanup') {
            return true;
          }
          return false;
        });
      };

      return hasCall(node.body.body);
    }

    function usesCleanupPattern(node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression): string | null {
      if (!node.body) return null;

      const checkNode = (n: TSESTree.Node): string | null => {
        if (n.type === 'CallExpression' && n.callee.type === 'Identifier') {
          const calleeName = n.callee.name;
          if (CLEANUP_REQUIRED_PATTERNS.includes(calleeName)) {
            return calleeName;
          }
        }
        if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression') {
          if (n.callee.property.type === 'Identifier') {
            const methodName = n.callee.property.name;
            if (CLEANUP_REQUIRED_PATTERNS.includes(methodName)) {
              return methodName;
            }
          }
        }
        if (n.type === 'NewExpression' && n.callee.type === 'Identifier') {
          const calleeName = n.callee.name;
          if (CLEANUP_REQUIRED_PATTERNS.includes(calleeName)) {
            return calleeName;
          }
        }
        return null;
      };

      const walk = (n: TSESTree.Node): string | null => {
        const result = checkNode(n);
        if (result) return result;

        for (const key in n) {
          const value = (n as any)[key];
          if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
              for (const item of value) {
                if (item && typeof item === 'object' && item.type) {
                  const found = walk(item);
                  if (found) return found;
                }
              }
            } else if (value.type) {
              const found = walk(value);
              if (found) return found;
            }
          }
        }
        return null;
      };

      return walk(node.body);
    }

    return {
      CallExpression(node) {
        // Check if this is an effect() call
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'effect' &&
          node.arguments.length > 0
        ) {
          const effectFn = node.arguments[0];
          if (
            effectFn.type === 'ArrowFunctionExpression' ||
            effectFn.type === 'FunctionExpression'
          ) {
            const cleanupPattern = usesCleanupPattern(effectFn);

            if (cleanupPattern) {
              const hasCleanup = hasCleanupReturn(effectFn);
              const hasOnCleanup = hasOnCleanupCall(effectFn);

              if (!hasCleanup && !hasOnCleanup) {
                context.report({
                  node: effectFn,
                  messageId: 'missingCleanup',
                  data: { resource: cleanupPattern },
                });
              }
            }
          }
        }
      },
    };
  },
});
