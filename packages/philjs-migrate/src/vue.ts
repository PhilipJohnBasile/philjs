/**
 * Vue 3 → PhilJS Migration Codemod
 * 
 * Transforms Vue 3 Composition API code to PhilJS signals.
 */

import type { API, FileInfo, Options } from 'jscodeshift';

// Mapping of Vue imports to PhilJS
const IMPORT_MAPPINGS: Record<string, string> = {
    'ref': 'signal',
    'reactive': 'signal',
    'computed': 'memo',
    'watch': 'effect',
    'watchEffect': 'effect',
    'onMounted': 'effect',
    'onUnmounted': 'onCleanup',
};

export interface VueMigrationOptions extends Options {
    preserveComments?: boolean;
}

/**
 * Main transformer function for jscodeshift
 */
export default function transformer(
    file: FileInfo,
    api: API,
    options: VueMigrationOptions
): string | null {
    const j = api.jscodeshift;
    const root = j(file.source);
    let hasChanges = false;

    // Transform Vue imports to PhilJS imports
    root.find(j.ImportDeclaration)
        .filter((path) => {
            const source = path.node.source.value;
            return source === 'vue' || source === '@vue/runtime-core';
        })
        .forEach((path) => {
            const newSpecifiers: any[] = [];

            path.node.specifiers?.forEach((spec) => {
                if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
                    const vueName = spec.imported.name;
                    const philjsName = IMPORT_MAPPINGS[vueName];

                    if (philjsName) {
                        newSpecifiers.push(
                            j.importSpecifier(
                                j.identifier(philjsName),
                                spec.local?.name !== vueName ? j.identifier(spec.local!.name) : null
                            )
                        );
                        hasChanges = true;
                    }
                }
            });

            if (newSpecifiers.length > 0) {
                path.replace(
                    j.importDeclaration(newSpecifiers, j.literal('@philjs/core'))
                );
            }
        });

    // Transform ref() calls to signal()
    root.find(j.CallExpression, {
        callee: { type: 'Identifier', name: 'ref' }
    }).forEach((path) => {
        path.node.callee = j.identifier('signal');
        hasChanges = true;
    });

    // Transform reactive() calls to signal()
    root.find(j.CallExpression, {
        callee: { type: 'Identifier', name: 'reactive' }
    }).forEach((path) => {
        path.node.callee = j.identifier('signal');
        hasChanges = true;
    });

    // Transform computed() to memo()
    root.find(j.CallExpression, {
        callee: { type: 'Identifier', name: 'computed' }
    }).forEach((path) => {
        path.node.callee = j.identifier('memo');
        hasChanges = true;
    });

    // Transform .value access to function calls
    // e.g., count.value → count()
    root.find(j.MemberExpression, {
        property: { type: 'Identifier', name: 'value' }
    }).forEach((path) => {
        // Check if this is a read (not an assignment target)
        const parent = path.parent;
        if (parent.node.type !== 'AssignmentExpression' || parent.node.left !== path.node) {
            // This is a read: count.value → count()
            path.replace(
                j.callExpression(path.node.object, [])
            );
            hasChanges = true;
        }
    });

    // Transform .value = x to signal.set(x)
    root.find(j.AssignmentExpression)
        .filter((path) => {
            const left = path.node.left;
            return left.type === 'MemberExpression' &&
                left.property.type === 'Identifier' &&
                left.property.name === 'value';
        })
        .forEach((path) => {
            const left = path.node.left as any;
            path.replace(
                j.callExpression(
                    j.memberExpression(left.object, j.identifier('set')),
                    [path.node.right]
                )
            );
            hasChanges = true;
        });

    // Transform watch() to effect()
    root.find(j.CallExpression, {
        callee: { type: 'Identifier', name: 'watch' }
    }).forEach((path) => {
        // watch(source, callback) → effect(() => { source(); callback(); })
        const [source, callback] = path.node.arguments;

        path.replace(
            j.callExpression(j.identifier('effect'), [
                j.arrowFunctionExpression(
                    [],
                    j.blockStatement([
                        j.expressionStatement(
                            j.callExpression(source as any, [])
                        ),
                        j.expressionStatement(
                            j.callExpression(callback as any, [])
                        )
                    ])
                )
            ])
        );
        hasChanges = true;
    });

    // Transform watchEffect() to effect()
    root.find(j.CallExpression, {
        callee: { type: 'Identifier', name: 'watchEffect' }
    }).forEach((path) => {
        path.node.callee = j.identifier('effect');
        hasChanges = true;
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
 * Migrate a single Vue file
 */
export async function migrateVueFile(source: string): Promise<string> {
    // For SFC files, we need to parse the script section
    const scriptMatch = source.match(/<script[^>]*>([\s\S]*?)<\/script>/);

    if (!scriptMatch) {
        return source; // No script section found
    }

    const scriptContent = scriptMatch[1];

    // Apply the codemod
    const jscodeshift = (await import('jscodeshift')).default;
    const api = {
        jscodeshift: jscodeshift.withParser('tsx'),
        stats: () => { },
        report: () => { },
    };

    const transformed = transformer(
        { source: scriptContent, path: 'component.vue' },
        api as any,
        {}
    );

    if (!transformed) {
        return source;
    }

    // Replace the script content
    return source.replace(scriptMatch[1], transformed);
}

/**
 * Check if a file is a Vue file
 */
export function isVueFile(filename: string): boolean {
    return filename.endsWith('.vue');
}
