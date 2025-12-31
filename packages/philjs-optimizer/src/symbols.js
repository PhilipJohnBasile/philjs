/**
 * Symbol extraction and management
 */
import { parse } from '@babel/parser';
import * as _traverse from '@babel/traverse';
import * as t from '@babel/types';
import { createHash } from 'crypto';
// Handle both ESM and CJS exports - babel packages export default as the function
const traverse = _traverse.default;
/**
 * Extract symbols from source code
 */
export function extractSymbols(source, filePath, options) {
    const symbols = [];
    // Parse the source code
    const ast = parse(source, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });
    const context = {
        filePath,
        source,
        ast,
        options,
    };
    // Traverse the AST and extract symbols
    traverse(ast, {
        // Extract function declarations
        FunctionDeclaration(path) {
            const symbol = extractFunctionSymbol(path.node, context);
            if (symbol) {
                symbols.push(symbol);
            }
        },
        // Extract arrow functions and function expressions assigned to variables
        VariableDeclarator(path) {
            if (t.isArrowFunctionExpression(path.node.init) ||
                t.isFunctionExpression(path.node.init)) {
                const symbol = extractVariableFunctionSymbol(path.node, context);
                if (symbol) {
                    symbols.push(symbol);
                }
            }
        },
        // Extract component declarations (capitalized functions)
        CallExpression(path) {
            // Look for $() wrapped functions (lazy handlers)
            if (t.isIdentifier(path.node.callee) &&
                path.node.callee.name === '$' &&
                path.node.arguments.length > 0) {
                const symbol = extractLazyHandlerSymbol(path.node, context);
                if (symbol) {
                    symbols.push(symbol);
                }
            }
        },
    });
    // Apply custom patterns
    if (options.patterns) {
        for (const pattern of options.patterns) {
            traverse(ast, {
                enter(path) {
                    if (pattern.test(path.node)) {
                        const symbol = pattern.extract(path.node, context);
                        if (symbol) {
                            symbols.push(symbol);
                        }
                    }
                },
            });
        }
    }
    return symbols;
}
/**
 * Extract symbol from function declaration
 */
function extractFunctionSymbol(node, context) {
    if (!node.id)
        return null;
    const name = node.id.name;
    const type = inferSymbolType(name, node);
    const dependencies = extractDependencies(node);
    return {
        id: generateSymbolId(context.filePath, name, node.start ?? 0),
        name,
        filePath: context.filePath,
        start: node.start ?? 0,
        end: node.end ?? 0,
        type,
        dependencies,
        hash: hashNode(node, context.source),
        isLazy: false,
    };
}
/**
 * Extract symbol from variable function declaration
 */
function extractVariableFunctionSymbol(node, context) {
    if (!t.isIdentifier(node.id))
        return null;
    const name = node.id.name;
    const type = inferSymbolType(name, node.init);
    const dependencies = extractDependencies(node.init);
    return {
        id: generateSymbolId(context.filePath, name, node.start ?? 0),
        name,
        filePath: context.filePath,
        start: node.start ?? 0,
        end: node.end ?? 0,
        type,
        dependencies,
        hash: hashNode(node, context.source),
        isLazy: false,
    };
}
/**
 * Extract symbol from lazy handler call
 */
function extractLazyHandlerSymbol(node, context) {
    const arg = node.arguments[0];
    if (!t.isArrowFunctionExpression(arg) && !t.isFunctionExpression(arg)) {
        return null;
    }
    // Generate a unique name for the lazy handler
    const name = `$handler_${node.start ?? 0}`;
    const dependencies = extractDependencies(arg);
    return {
        id: generateSymbolId(context.filePath, name, node.start ?? 0),
        name,
        filePath: context.filePath,
        start: node.start ?? 0,
        end: node.end ?? 0,
        type: 'handler',
        dependencies,
        hash: hashNode(node, context.source),
        isLazy: true,
    };
}
/**
 * Infer symbol type from name and node
 */
function inferSymbolType(name, node) {
    // Component: starts with uppercase
    if (/^[A-Z]/.test(name)) {
        return 'component';
    }
    // Loader: ends with Loader or starts with load
    if (/Loader$/.test(name) || /^load/.test(name)) {
        return 'loader';
    }
    // Action: ends with Action or starts with handle
    if (/Action$/.test(name) || /^handle/.test(name)) {
        return 'action';
    }
    // Store: ends with Store or contains 'store'
    if (/Store$/.test(name) || /store/i.test(name)) {
        return 'store';
    }
    // Resource: ends with Resource
    if (/Resource$/.test(name)) {
        return 'resource';
    }
    return 'function';
}
/**
 * Extract dependencies from a node
 */
function extractDependencies(node) {
    const identifiers = new Set();
    // Create appropriate AST wrapper based on node type
    let programBody;
    const nodeAny = node;
    if (t.isFunctionDeclaration(nodeAny) || t.isStatement(nodeAny)) {
        // Function declarations and statements can be used directly
        programBody = [nodeAny];
    }
    else if (t.isExpression(nodeAny)) {
        // Expressions need to be wrapped in an expression statement
        programBody = [t.expressionStatement(nodeAny)];
    }
    else {
        // Fallback: return empty dependencies for unknown node types
        return [];
    }
    try {
        traverse(t.file(t.program(programBody)), {
            Identifier(path) {
                // Skip if it's a binding (local variable)
                if (path.scope.hasBinding(path.node.name)) {
                    return;
                }
                identifiers.add(path.node.name);
            },
        });
    }
    catch {
        // Return empty array if traversal fails
        return [];
    }
    return Array.from(identifiers);
}
/**
 * Generate a unique symbol ID
 */
export function generateSymbolId(filePath, name, position) {
    const hash = createHash('sha256')
        .update(`${filePath}:${name}:${position}`)
        .digest('hex')
        .slice(0, 8);
    return `${name}_${hash}`;
}
/**
 * Hash a node's content
 */
function hashNode(node, source) {
    const nodeAny = node;
    const content = source.slice(nodeAny.start ?? 0, nodeAny.end ?? 0);
    return createHash('sha256').update(content).digest('hex').slice(0, 8);
}
/**
 * Create a symbol registry
 */
export class SymbolRegistry {
    symbols = new Map();
    add(symbol) {
        this.symbols.set(symbol.id, symbol);
    }
    get(id) {
        return this.symbols.get(id);
    }
    has(id) {
        return this.symbols.has(id);
    }
    getAll() {
        return Array.from(this.symbols.values());
    }
    getByType(type) {
        return this.getAll().filter((s) => s.type === type);
    }
    getByFile(filePath) {
        return this.getAll().filter((s) => s.filePath === filePath);
    }
    clear() {
        this.symbols.clear();
    }
}
//# sourceMappingURL=symbols.js.map