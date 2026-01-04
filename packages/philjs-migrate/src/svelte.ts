/**
 * Svelte → PhilJS Migration Codemod
 * 
 * Transforms Svelte reactive syntax to PhilJS signals.
 */

import type { API, FileInfo, Options } from 'jscodeshift';

export interface SvelteMigrationOptions extends Options {
    preserveComments?: boolean;
}

/**
 * Parse Svelte script content
 */
function parseSvelteScript(source: string): { script: string; rest: string } {
    const scriptMatch = source.match(/<script[^>]*>([\s\S]*?)<\/script>/);

    if (!scriptMatch) {
        return { script: '', rest: source };
    }

    return {
        script: scriptMatch[1],
        rest: source.replace(scriptMatch[0], '{{SCRIPT_PLACEHOLDER}}'),
    };
}

/**
 * Main transformer for Svelte to PhilJS
 */
export default function transformer(
    file: FileInfo,
    api: API,
    options: SvelteMigrationOptions
): string | null {
    const j = api.jscodeshift;
    const root = j(file.source);
    let hasChanges = false;

    // Add PhilJS import if not present
    const hasPhilJSImport = root.find(j.ImportDeclaration)
        .filter((path) => path.node.source.value === '@philjs/core')
        .size() > 0;

    if (!hasPhilJSImport) {
        const firstImport = root.find(j.ImportDeclaration).at(0);
        if (firstImport.size() > 0) {
            firstImport.insertBefore(
                j.importDeclaration(
                    [
                        j.importSpecifier(j.identifier('signal')),
                        j.importSpecifier(j.identifier('memo')),
                        j.importSpecifier(j.identifier('effect')),
                    ],
                    j.literal('@philjs/core')
                )
            );
            hasChanges = true;
        }
    }

    // Transform $: reactive statements to effect()
    // Svelte: $: doubled = count * 2
    // PhilJS: const doubled = memo(() => count() * 2)
    root.find(j.LabeledStatement, {
        label: { name: '$' }
    }).forEach((path) => {
        const body = path.node.body;

        if (body.type === 'ExpressionStatement') {
            const expr = body.expression;

            if (expr.type === 'AssignmentExpression') {
                // $: variable = expression → const variable = memo(() => expression)
                const left = expr.left;
                const right = expr.right;

                if (left.type === 'Identifier') {
                    // Convert to memo
                    path.replace(
                        j.variableDeclaration('const', [
                            j.variableDeclarator(
                                left,
                                j.callExpression(j.identifier('memo'), [
                                    j.arrowFunctionExpression([], right)
                                ])
                            )
                        ])
                    );
                    hasChanges = true;
                }
            } else {
                // $: statement → effect(() => { statement })
                path.replace(
                    j.expressionStatement(
                        j.callExpression(j.identifier('effect'), [
                            j.arrowFunctionExpression(
                                [],
                                j.blockStatement([body])
                            )
                        ])
                    )
                );
                hasChanges = true;
            }
        }
    });

    // Transform let declarations that look reactive to signals
    // This is a heuristic - we look for variables used in $: statements
    const reactiveVars = new Set<string>();

    root.find(j.LabeledStatement, {
        label: { name: '$' }
    }).forEach((path) => {
        // Find all identifiers in the reactive statement
        j(path).find(j.Identifier).forEach((idPath) => {
            reactiveVars.add(idPath.node.name);
        });
    });

    // Convert let declarations of reactive variables to signals
    root.find(j.VariableDeclaration, { kind: 'let' }).forEach((path) => {
        path.node.declarations.forEach((decl) => {
            if (decl.id.type === 'Identifier' && reactiveVars.has(decl.id.name)) {
                // let count = 0 → const count = signal(0)
                decl.init = j.callExpression(j.identifier('signal'), [
                    decl.init || j.identifier('undefined')
                ]);
                hasChanges = true;
            }
        });

        // Change let to const for signal declarations
        if (hasChanges) {
            path.node.kind = 'const';
        }
    });

    if (!hasChanges) {
        return null;
    }

    return root.toSource({
        quote: 'single',
        trailingComma: true,
    });
}

/**
 * Migrate a Svelte file to PhilJS
 */
export async function migrateSvelteFile(source: string): Promise<string> {
    const { script, rest } = parseSvelteScript(source);

    if (!script) {
        return source;
    }

    const jscodeshift = (await import('jscodeshift')).default;
    const api = {
        jscodeshift: jscodeshift.withParser('tsx'),
        stats: () => { },
        report: () => { },
    };

    const transformed = transformer(
        { source: script, path: 'component.svelte' },
        api as any,
        {}
    );

    if (!transformed) {
        return source;
    }

    // Replace script content and add PhilJS component wrapper
    const newScript = `
import { signal, memo, effect } from '@philjs/core';

${transformed}

// Export as PhilJS component
export function Component(props) {
  // Migrated from Svelte - review for signal usage
  return null; // TODO: Migrate template to JSX
}
`;

    return rest.replace('{{SCRIPT_PLACEHOLDER}}', `<script>${newScript}</script>`);
}

/**
 * Convert Svelte template syntax to PhilJS JSX
 */
export function migrateSvelteTemplate(template: string): string {
    let result = template;

    // {#if condition} → {condition && (...)}
    result = result.replace(
        /\{#if\s+([^}]+)\}([\s\S]*?)\{\/if\}/g,
        (_, condition, content) => {
            return `{${condition.trim()} && (<>${content}</>)}`;
        }
    );

    // {#each items as item} → {items.map(item => ...)}
    result = result.replace(
        /\{#each\s+(\S+)\s+as\s+(\S+)\}([\s\S]*?)\{\/each\}/g,
        (_, array, item, content) => {
            return `{${array}().map((${item}) => (<>${content}</>))}`;
        }
    );

    // {variable} → {variable()}
    result = result.replace(
        /\{(\w+)\}/g,
        (match, varName) => {
            // Don't transform if it's an event handler or already a function call
            if (varName === 'true' || varName === 'false' || varName === 'null') {
                return match;
            }
            return `{${varName}()}`;
        }
    );

    // on:click → onClick
    result = result.replace(/on:(\w+)/g, (_, event) => {
        return `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
    });

    // bind:value → value={signal} onInput={(e) => signal.set(e.target.value)}
    result = result.replace(
        /bind:value=\{(\w+)\}/g,
        (_, varName) => {
            return `value={${varName}()} onInput={(e) => ${varName}.set(e.target.value)}`;
        }
    );

    // class:active → class={active() ? 'active' : ''}
    result = result.replace(
        /class:(\w+)=\{([^}]+)\}/g,
        (_, className, condition) => {
            return `class={${condition} ? '${className}' : ''}`;
        }
    );

    return result;
}

/**
 * Check if a file is a Svelte file
 */
export function isSvelteFile(filename: string): boolean {
    return filename.endsWith('.svelte');
}
