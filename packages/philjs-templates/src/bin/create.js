#!/usr/bin/env node
/**
 * Create PhilJS App CLI
 *
 * Usage: npx create-philjs [project-name] [--template <name>]
 */
import prompts from 'prompts';
import kleur from 'kleur';
import degit from 'degit';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getTemplates, getTemplate } from '../index.js';
const args = process.argv.slice(2);
async function main() {
    console.log();
    console.log(kleur.bold().cyan('  Create PhilJS App'));
    console.log(kleur.dim('  Build fast, reactive web applications'));
    console.log();
    // Parse arguments
    let projectName = args[0];
    let templateName = null;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--template' || args[i] === '-t') {
            templateName = args[i + 1];
            i++;
        }
        else if (!args[i].startsWith('-') && !projectName) {
            projectName = args[i];
        }
    }
    // Get project name
    if (!projectName) {
        const response = await prompts({
            type: 'text',
            name: 'projectName',
            message: 'Project name:',
            initial: 'my-philjs-app',
            validate: (value) => {
                if (!value)
                    return 'Project name is required';
                if (existsSync(value))
                    return 'Directory already exists';
                return true;
            },
        });
        if (!response.projectName) {
            console.log(kleur.red('  Cancelled'));
            process.exit(1);
        }
        projectName = response.projectName;
    }
    // Check if directory exists
    const projectPath = resolve(projectName);
    if (existsSync(projectPath)) {
        console.log(kleur.red(`  Directory "${projectName}" already exists`));
        process.exit(1);
    }
    // Get template
    const templates = getTemplates();
    if (!templateName) {
        const response = await prompts({
            type: 'select',
            name: 'template',
            message: 'Select a template:',
            choices: templates.map(t => ({
                title: `${t.name} ${kleur.dim(`- ${t.description}`)}`,
                value: t.name,
            })),
            initial: 0,
        });
        if (!response.template) {
            console.log(kleur.red('  Cancelled'));
            process.exit(1);
        }
        templateName = response.template;
    }
    const template = getTemplate(templateName);
    if (!template) {
        console.log(kleur.red(`  Template "${templateName}" not found`));
        console.log(kleur.dim(`  Available templates: ${templates.map(t => t.name).join(', ')}`));
        process.exit(1);
    }
    // Clone template
    console.log();
    console.log(kleur.cyan(`  Creating ${projectName}...`));
    try {
        const emitter = degit(template.repo, { cache: false, force: true });
        emitter.on('info', (info) => {
            console.log(kleur.dim(`  ${info.message}`));
        });
        await emitter.clone(projectPath);
        // Update package.json
        const packageJsonPath = join(projectPath, 'package.json');
        if (existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            packageJson.name = projectName;
            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
        console.log();
        console.log(kleur.green('  ✓ Project created successfully!'));
        console.log();
        console.log(kleur.bold('  Next steps:'));
        console.log();
        console.log(kleur.cyan(`    cd ${projectName}`));
        console.log(kleur.cyan('    npm install'));
        console.log(kleur.cyan('    npm run dev'));
        console.log();
        // Show template features
        if (template.features.length > 0) {
            console.log(kleur.dim(`  This template includes: ${template.features.join(', ')}`));
            console.log();
        }
    }
    catch (error) {
        const err = error;
        console.log(kleur.red(`  Error: ${err.message || String(error)}`));
        process.exit(1);
    }
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
//# sourceMappingURL=create.js.map