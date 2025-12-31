/**
 * AST transformation for lazy loading
 */
import { parse } from '@babel/parser';
import * as _traverse from '@babel/traverse';
import * as _generate from '@babel/generator';
import * as t from '@babel/types';
// Handle both ESM and CJS exports - babel packages export default as the function
const traverse = _traverse.default;
const generate = _generate.default;
import { extractSymbols, generateSymbolId } from './symbols.js';
/**
 * Transform source code to enable lazy loading
 */
export function transform(source, filePath, options) {
    // Extract symbols first
    const symbols = extractSymbols(source, filePath, options);
    // Parse the source code
    const ast = parse(source, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });
    const dependencies = [];
    const lazyHandlerReplacements = new Map();
    // First pass: collect lazy handlers and generate module paths
    traverse(ast, {
        // Transform $() calls to lazy handler references
        CallExpression(path) {
            if (t.isIdentifier(path.node.callee) &&
                path.node.callee.name === '$' &&
                path.node.arguments.length > 0) {
                const arg = path.node.arguments[0];
                if (t.isArrowFunctionExpression(arg) ||
                    t.isFunctionExpression(arg)) {
                    // Generate symbol ID
                    const symbolId = generateSymbolId(filePath, `$handler`, path.node.start ?? 0);
                    // Generate module path for this handler
                    const modulePath = `${filePath}.lazy/${symbolId}.js`;
                    lazyHandlerReplacements.set(path.node, { symbolId, modulePath });
                }
            }
        },
        // Collect imports as dependencies
        ImportDeclaration(path) {
            dependencies.push(path.node.source.value);
        },
    });
    // Second pass: transform the AST
    traverse(ast, {
        CallExpression(path) {
            const replacement = lazyHandlerReplacements.get(path.node);
            if (replacement) {
                // Replace $(() => ...) with $$('symbolId', () => ...)
                // And add module path metadata
                const arg = path.node.arguments[0];
                path.replaceWith(t.callExpression(t.identifier('$$'), [
                    t.stringLiteral(replacement.symbolId),
                    arg,
                ]));
                // Add import for $$ if not already present
                const program = path.findParent((p) => t.isProgram(p.node));
                if (program && t.isProgram(program.node)) {
                    const hasImport = program.node.body.some((node) => t.isImportDeclaration(node) &&
                        node.source.value === 'philjs-core/lazy-handlers' &&
                        node.specifiers.some((spec) => t.isImportSpecifier(spec) &&
                            t.isIdentifier(spec.imported) &&
                            spec.imported.name === '$$'));
                    if (!hasImport) {
                        program.node.body.unshift(t.importDeclaration([t.importSpecifier(t.identifier('$$'), t.identifier('$$'))], t.stringLiteral('philjs-core/lazy-handlers')));
                    }
                }
            }
        },
    });
    // Generate the transformed code
    const result = generate(ast, {
        sourceMaps: options.sourcemap,
        sourceFileName: filePath,
    });
    return {
        code: result.code,
        map: result.map,
        symbols,
        dependencies,
    };
}
/**
 * Extract lazy handler chunks from source
 */
export function extractLazyChunks(source, filePath) {
    const chunks = new Map();
    const ast = parse(source, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });
    traverse(ast, {
        CallExpression(path) {
            if (t.isIdentifier(path.node.callee) &&
                (path.node.callee.name === '$' || path.node.callee.name === '$$')) {
                const args = path.node.arguments;
                // For $$(), the first arg is the symbol ID
                let symbolId;
                let handlerNode;
                if (path.node.callee.name === '$$' && args.length >= 2) {
                    if (!t.isStringLiteral(args[0]))
                        return;
                    symbolId = args[0].value;
                    handlerNode = args[1];
                }
                else if (path.node.callee.name === '$' && args.length >= 1) {
                    symbolId = generateSymbolId(filePath, '$handler', path.node.start ?? 0);
                    handlerNode = args[0];
                }
                else {
                    return;
                }
                // Generate a module for this handler
                const chunkAst = t.file(t.program([
                    t.exportNamedDeclaration(t.variableDeclaration('const', [
                        t.variableDeclarator(t.identifier(symbolId), handlerNode),
                    ])),
                    t.exportDefaultDeclaration(t.identifier(symbolId)),
                ]));
                const chunkCode = generate(chunkAst).code;
                chunks.set(symbolId, chunkCode);
            }
        },
    });
    return chunks;
}
/**
 * Generate import statements for lazy chunks
 */
export function generateLazyImports(symbolIds, baseUrl = '/lazy') {
    const imports = symbolIds
        .map((id) => `import ${id} from '${baseUrl}/${id}.js';`)
        .join('\n');
    return imports;
}
/**
 * Inject lazy handler registrations
 */
export function injectHandlerRegistrations(source, handlers) {
    const ast = parse(source, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });
    // Create registration calls
    const registrations = [];
    for (const [symbolId, modulePath] of handlers) {
        registrations.push(t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('handlerRegistry'), t.identifier('register')), [
            t.stringLiteral(symbolId),
            t.arrowFunctionExpression([], t.blockStatement([])),
            t.stringLiteral(modulePath),
        ])));
    }
    // Add import for handlerRegistry
    const program = ast.program;
    const hasImport = program.body.some((node) => t.isImportDeclaration(node) &&
        node.source.value === 'philjs-core/lazy-handlers' &&
        node.specifiers.some((spec) => t.isImportSpecifier(spec) &&
            t.isIdentifier(spec.imported) &&
            spec.imported.name === 'handlerRegistry'));
    if (!hasImport) {
        program.body.unshift(t.importDeclaration([
            t.importSpecifier(t.identifier('handlerRegistry'), t.identifier('handlerRegistry')),
        ], t.stringLiteral('philjs-core/lazy-handlers')));
    }
    // Add registrations after imports
    const lastImportIndex = program.body.findIndex((node, idx) => !t.isImportDeclaration(node) &&
        (idx === 0 || t.isImportDeclaration(program.body[idx - 1])));
    if (lastImportIndex >= 0) {
        program.body.splice(lastImportIndex, 0, ...registrations);
    }
    else {
        program.body.push(...registrations);
    }
    const result = generate(ast);
    return result.code;
}
/**
 * Create a loader function for a symbol
 */
export function createSymbolLoader(symbolId, modulePath) {
    return `
export function load${symbolId}() {
  return import('${modulePath}').then(m => m.${symbolId} || m.default);
}
`;
}
/**
 * Generate manifest file
 */
export function generateManifest(symbols) {
    const manifest = {
        symbols: {},
        chunks: {},
        imports: {},
    };
    for (const [symbolId, { modulePath, dependencies }] of symbols) {
        manifest.symbols[symbolId] = modulePath;
        manifest.imports[symbolId] = modulePath;
        // Group by chunk
        if (!manifest.chunks[modulePath]) {
            manifest.chunks[modulePath] = [];
        }
        manifest.chunks[modulePath].push(symbolId);
    }
    return `export default ${JSON.stringify(manifest, null, 2)};`;
}
//# sourceMappingURL=transform.js.map