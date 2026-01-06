/**
 * PhilJS Migration Command
 * Migrate from React, Vue, or Svelte to PhilJS
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import prompts from 'prompts';
const FRAMEWORKS = {
    react: {
        name: 'React',
        description: 'Migrate from React to PhilJS',
    },
    vue: {
        name: 'Vue',
        description: 'Migrate from Vue to PhilJS',
    },
    svelte: {
        name: 'Svelte',
        description: 'Migrate from Svelte to PhilJS',
    },
};
export async function migrateProject(frameworkName) {
    let framework;
    if (frameworkName && frameworkName in FRAMEWORKS) {
        framework = frameworkName;
    }
    else {
        // Detect framework if not specified
        const detected = await detectFramework();
        if (detected) {
            console.log(pc.dim(`Detected ${FRAMEWORKS[detected].name} project\n`));
            const response = await prompts({
                type: 'confirm',
                name: 'confirm',
                message: `Migrate from ${FRAMEWORKS[detected].name} to PhilJS?`,
                initial: true,
            });
            if (!response['confirm']) {
                return;
            }
            framework = detected;
        }
        else {
            const promptOptions = {
                type: 'select',
                name: 'framework',
                message: 'Select the framework to migrate from:',
                choices: Object.entries(FRAMEWORKS).map(([key, { name, description }]) => ({
                    title: `${name} - ${description}`,
                    value: key,
                })),
                onState: (state) => {
                    if (state.aborted) {
                        process.exit(1);
                    }
                }
            };
            const response = await prompts(promptOptions);
            framework = response['framework'];
        }
    }
    console.log(pc.cyan(`\n📦 Migrating from ${FRAMEWORKS[framework].name}...\n`));
    try {
        switch (framework) {
            case 'react':
                await migrateFromReact();
                break;
            case 'vue':
                await migrateFromVue();
                break;
            case 'svelte':
                await migrateFromSvelte();
                break;
        }
        console.log(pc.green(`\n✓ Migration from ${FRAMEWORKS[framework].name} complete!\n`));
        console.log(pc.dim('  1. Review the migrated files for any manual adjustments'));
    }
    catch (error) {
        console.error(pc.red('\n✖ Migration failed:'), error);
        process.exit(1);
    }
}
async function detectFramework() {
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkgContent = await fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgContent);
        const deps = { ...pkg['dependencies'], ...pkg['devDependencies'] };
        if ('react' in deps || 'react-dom' in deps) {
            return 'react';
        }
        if ('vue' in deps) {
            return 'vue';
        }
        if ('svelte' in deps) {
            return 'svelte';
        }
    }
    catch {
        // Ignore errors
    }
    return null;
}
async function migrateFromReact() {
    const pkg = await readPackageJson();
    // Update dependencies
    console.log(pc.dim('  Updating dependencies...'));
    // Remove React-specific dependencies
    const reactDeps = ['react', 'react-dom', '@types/react', '@types/react-dom'];
    for (const dep of reactDeps) {
        if (pkg['dependencies']?.[dep] !== undefined) {
            delete pkg['dependencies'][dep];
        }
        if (pkg['devDependencies']?.[dep] !== undefined) {
            delete pkg['devDependencies'][dep];
        }
    }
    // Add PhilJS dependencies
    if (!pkg['dependencies']) {
        pkg['dependencies'] = {};
    }
    pkg['dependencies']['@philjs/core'] = '^2.0.0';
    pkg['dependencies']['philjs-router'] = '^2.0.0';
    await writePackageJson(pkg);
    console.log(pc.green('  ✓ Updated package.json'));
    // Find and migrate components
    const srcDir = path.join(process.cwd(), 'src');
    await migrateReactComponents(srcDir);
    // Update imports
    await updateReactImports(srcDir);
}
async function migrateFromVue() {
    const pkg = await readPackageJson();
    // Update dependencies
    console.log(pc.dim('  Updating dependencies...'));
    // Remove Vue-specific dependencies
    const vueDeps = ['vue', '@vue/compiler-sfc', 'vue-router', 'pinia'];
    for (const dep of vueDeps) {
        if (pkg['dependencies']?.[dep] !== undefined) {
            delete pkg['dependencies'][dep];
        }
        if (pkg['devDependencies']?.[dep] !== undefined) {
            delete pkg['devDependencies'][dep];
        }
    }
    // Add PhilJS dependencies
    if (!pkg['dependencies']) {
        pkg['dependencies'] = {};
    }
    pkg['dependencies']['@philjs/core'] = '^2.0.0';
    pkg['dependencies']['philjs-router'] = '^2.0.0';
    await writePackageJson(pkg);
    console.log(pc.green('  ✓ Updated package.json'));
    // Note: Vue SFC migration would require more complex transformations
    console.log(pc.yellow('  ⚠ Vue SFC files require manual migration'));
    console.log(pc.dim('    Convert .vue files to .tsx components'));
}
async function migrateFromSvelte() {
    const pkg = await readPackageJson();
    // Update dependencies
    console.log(pc.dim('  Updating dependencies...'));
    // Remove Svelte-specific dependencies
    const svelteDeps = ['svelte', '@sveltejs/kit', 'svelte-preprocess'];
    for (const dep of svelteDeps) {
        if (pkg['dependencies']?.[dep] !== undefined) {
            delete pkg['dependencies'][dep];
        }
        if (pkg['devDependencies']?.[dep] !== undefined) {
            delete pkg['devDependencies'][dep];
        }
    }
    // Add PhilJS dependencies
    if (!pkg['dependencies']) {
        pkg['dependencies'] = {};
    }
    pkg['dependencies']['@philjs/core'] = '^2.0.0';
    pkg['dependencies']['philjs-router'] = '^2.0.0';
    await writePackageJson(pkg);
    console.log(pc.green('  ✓ Updated package.json'));
    // Note: Svelte migration would require complex transformations
    console.log(pc.yellow('  ⚠ Svelte files require manual migration'));
    console.log(pc.dim('    Convert .svelte files to .tsx components'));
}
async function migrateReactComponents(dir) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await migrateReactComponents(fullPath);
            }
            else if (entry.isFile() && /\.(jsx|tsx)$/.test(entry.name)) {
                await migrateReactFile(fullPath);
            }
        }
    }
    catch {
        // Directory might not exist
    }
}
async function migrateReactFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf-8');
        // Convert useState to signal
        content = content.replace(/const \[(\w+), set(\w+)\] = useState(?:<[^>]+>)?\(([^)]*)\)/g, 'const $1 = signal($3)');
        // Convert useEffect to effect
        content = content.replace(/useEffect\(/g, 'effect(');
        // Convert useMemo to memo
        content = content.replace(/useMemo\(/g, 'memo(');
        // Convert useCallback to memo (PhilJS uses memo for both)
        content = content.replace(/useCallback\(/g, 'memo(');
        await fs.writeFile(filePath, content);
    }
    catch {
        console.log(pc.yellow(`  ⚠ Could not migrate: ${filePath}`));
    }
}
async function updateReactImports(dir) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await updateReactImports(fullPath);
            }
            else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
                await updateImportsInFile(fullPath);
            }
        }
    }
    catch {
        // Directory might not exist
    }
}
async function updateImportsInFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf-8');
        // Replace React imports with PhilJS imports
        content = content.replace(/import\s+(?:React,?\s*)?{\s*([^}]+)\s*}\s*from\s*['"]react['"]/g, (_, imports) => {
            const philjsHooks = ['signal', 'effect', 'memo', 'computed'];
            const importList = imports.split(',').map((i) => i.trim());
            const mappedImports = importList
                .map((i) => {
                if (i === 'useState')
                    return 'signal';
                if (i === 'useEffect')
                    return 'effect';
                if (i === 'useMemo' || i === 'useCallback')
                    return 'memo';
                if (i === 'useRef')
                    return 'ref';
                return null;
            })
                .filter((i) => i !== null && philjsHooks.includes(i));
            if (mappedImports.length > 0) {
                return `import { ${[...new Set(mappedImports)].join(', ')} } from '@philjs/core'`;
            }
            return '';
        });
        // Remove standalone React imports
        content = content.replace(/import\s+React\s+from\s+['"]react['"];?\n?/g, '');
        await fs.writeFile(filePath, content);
    }
    catch {
        // Ignore errors for individual files
    }
}
// Utility functions
async function readPackageJson() {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const content = await fs.readFile(pkgPath, 'utf-8');
    return JSON.parse(content);
}
async function writePackageJson(pkg) {
    const pkgPath = path.join(process.cwd(), 'package.json');
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}
//# sourceMappingURL=migrate.js.map