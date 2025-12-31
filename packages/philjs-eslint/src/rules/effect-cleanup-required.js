import { ESLintUtils } from '@typescript-eslint/utils';
const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/philipdexter/philjs/blob/main/packages/philjs-eslint/docs/rules/${name}.md`);
export default createRule({
    name: 'effect-cleanup-required',
    meta: {
        type: 'problem',
        docs: {
            description: 'Require cleanup functions for effects that use timers, subscriptions, or event listeners',
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
        function hasCleanupReturn(node) {
            if (!node.body)
                return false;
            // Arrow function with implicit return
            if (node.body.type !== 'BlockStatement') {
                return node.body.type === 'FunctionExpression' ||
                    node.body.type === 'ArrowFunctionExpression';
            }
            // Check for explicit return statement with function
            const blockBody = node.body.body;
            return blockBody.some((statement) => {
                if (statement.type === 'ReturnStatement' && statement.argument) {
                    return (statement.argument.type === 'FunctionExpression' ||
                        statement.argument.type === 'ArrowFunctionExpression');
                }
                return false;
            });
        }
        function hasOnCleanupCall(node) {
            if (!node.body || node.body.type !== 'BlockStatement')
                return false;
            const hasCall = (statements) => {
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
        function usesCleanupPattern(node) {
            if (!node.body)
                return null;
            let foundPattern = null;
            // Helper to check if a node matches cleanup patterns
            const checkNode = (n) => {
                if (foundPattern)
                    return;
                if (n.type === 'CallExpression') {
                    if (n.callee.type === 'Identifier') {
                        const calleeName = n.callee.name;
                        if (CLEANUP_REQUIRED_PATTERNS.includes(calleeName)) {
                            foundPattern = calleeName;
                            return;
                        }
                    }
                    else if (n.callee.type === 'MemberExpression' && n.callee.property.type === 'Identifier') {
                        const methodName = n.callee.property.name;
                        if (CLEANUP_REQUIRED_PATTERNS.includes(methodName)) {
                            foundPattern = methodName;
                            return;
                        }
                    }
                }
                else if (n.type === 'NewExpression' && n.callee.type === 'Identifier') {
                    const calleeName = n.callee.name;
                    if (CLEANUP_REQUIRED_PATTERNS.includes(calleeName)) {
                        foundPattern = calleeName;
                        return;
                    }
                }
            };
            // Traverse the function body using a simple queue-based approach
            const queue = [node.body];
            const visited = new WeakSet();
            while (queue.length > 0 && !foundPattern) {
                const current = queue.shift();
                if (visited.has(current))
                    continue;
                visited.add(current);
                checkNode(current);
                // Add child nodes to queue based on their type
                if (current.type === 'BlockStatement') {
                    queue.push(...current.body);
                }
                else if (current.type === 'ExpressionStatement') {
                    queue.push(current.expression);
                }
                else if (current.type === 'VariableDeclaration') {
                    queue.push(...current.declarations);
                }
                else if (current.type === 'VariableDeclarator' && current.init) {
                    queue.push(current.init);
                }
                else if (current.type === 'CallExpression') {
                    if (current.callee)
                        queue.push(current.callee);
                    queue.push(...current.arguments);
                }
                else if (current.type === 'MemberExpression') {
                    queue.push(current.object);
                    if (current.property)
                        queue.push(current.property);
                }
                else if (current.type === 'ReturnStatement' && current.argument) {
                    queue.push(current.argument);
                }
                else if (current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression') {
                    // Don't traverse into nested functions
                    continue;
                }
            }
            return foundPattern;
        }
        return {
            CallExpression(node) {
                // Check if this is an effect() call
                if (node.callee.type === 'Identifier' &&
                    node.callee.name === 'effect' &&
                    node.arguments.length > 0) {
                    const effectFn = node.arguments[0];
                    if (effectFn.type === 'ArrowFunctionExpression' ||
                        effectFn.type === 'FunctionExpression') {
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
//# sourceMappingURL=effect-cleanup-required.js.map