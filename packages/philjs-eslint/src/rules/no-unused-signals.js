import { ESLintUtils } from '@typescript-eslint/utils';
const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/philipdexter/philjs/blob/main/packages/philjs-eslint/docs/rules/${name}.md`);
export default createRule({
    name: 'no-unused-signals',
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow creating signals that are never read',
        },
        messages: {
            unusedSignal: 'Signal "{{name}}" is created but never read. Consider removing it or using it in your component.',
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        const signalReferences = new Map();
        return {
            // Track signal declarations
            VariableDeclarator(node) {
                if (node.init &&
                    node.init.type === 'CallExpression' &&
                    node.init.callee.type === 'Identifier' &&
                    (node.init.callee.name === 'signal' || node.init.callee.name === 'linkedSignal')) {
                    if (node.id.type === 'Identifier') {
                        const scope = context.sourceCode.getScope(node);
                        signalReferences.set(node.id.name, {
                            node,
                            scope,
                            reads: 0,
                        });
                    }
                }
            },
            // Track signal reads
            MemberExpression(node) {
                if (node.object.type === 'Identifier' &&
                    node.property.type === 'Identifier' &&
                    node.property.name === 'value') {
                    const signalName = node.object.name;
                    const ref = signalReferences.get(signalName);
                    if (ref) {
                        // Check if it's a read (not a write)
                        const parent = node.parent;
                        const isWrite = parent?.type === 'AssignmentExpression' && parent.left === node;
                        if (!isWrite) {
                            ref.reads++;
                        }
                    }
                }
            },
            // Track direct signal calls (getting value via signal())
            CallExpression(node) {
                if (node.callee.type === 'Identifier') {
                    const signalName = node.callee.name;
                    const ref = signalReferences.get(signalName);
                    if (ref) {
                        ref.reads++;
                    }
                }
            },
            // Check at the end of the program
            'Program:exit'() {
                signalReferences.forEach((ref, name) => {
                    if (ref.reads === 0) {
                        context.report({
                            node: ref.node.id,
                            messageId: 'unusedSignal',
                            data: { name },
                        });
                    }
                });
            },
        };
    },
});
//# sourceMappingURL=no-unused-signals.js.map