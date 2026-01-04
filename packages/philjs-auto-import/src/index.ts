
import { type Plugin } from 'vite';

export function autoImport(imports: Record<string, string[]>): Plugin {
    return {
        name: 'philjs-auto-import',
        transform(code, id) {
            if (!/\.[jt]sx?$/.test(id)) return;

            const missingImports = [];
            // Naive regex scan for missing imports
            for (const [mod, names] of Object.entries(imports)) {
                for (const name of names) {
                    if (code.includes(name) && !code.includes(`import { ${name}`)) {
                        missingImports.push(`import { ${name} } from '${mod}';`);
                    }
                }
            }

            if (missingImports.length > 0) {
                return missingImports.join('\n') + '\n' + code;
            }
        }
    };
}
