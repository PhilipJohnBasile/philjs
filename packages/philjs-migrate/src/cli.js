#!/usr/bin/env node
/**
 * PhilJS Migration CLI
 */
import { program } from 'commander';
import prompts from 'prompts';
import ora from 'ora';
import pc from 'picocolors';
import { migrate, analyzeProject } from './index.js';
program
    .name('philjs-migrate')
    .description('Migrate your project to PhilJS from React, Vue, Angular, or Svelte')
    .version('0.1.0');
program
    .command('analyze')
    .description('Analyze your project before migration')
    .argument('[dir]', 'Project directory', '.')
    .action(async (dir) => {
    const spinner = ora('Analyzing project...').start();
    try {
        const result = analyzeProject(dir);
        spinner.succeed('Analysis complete');
        console.log(`  Framework: ${pc.cyan(result.framework)}`);
        console.log(`  Files: ${pc.cyan(String(result.files))}`);
        console.log(`  Complexity: ${pc.cyan(result.complexity)}`);
    }
    catch (error) {
        spinner.fail('Analysis failed');
        console.error(error);
    }
});
program
    .command('run')
    .description('Run the migration')
    .argument('[dir]', 'Project directory', '.')
    .option('-s, --source <framework>', 'Source framework (react, vue, angular, svelte)')
    .option('-d, --dry-run', 'Show changes without applying them')
    .option('--no-typescript', 'Convert to JavaScript instead of TypeScript')
    .action(async (dir, options) => {
    let source = options.source;
    if (!source) {
        const response = await prompts({
            type: 'select',
            name: 'source',
            message: 'What framework are you migrating from?',
            choices: [
                { title: 'React', value: 'react' },
                { title: 'Vue', value: 'vue' },
                { title: 'Angular', value: 'angular' },
                { title: 'Svelte', value: 'svelte' },
                { title: 'SolidJS', value: 'solid' },
            ],
        });
        source = response['source'];
    }
    const spinner = ora('Migrating project...').start();
    try {
        const result = await migrate({
            source,
            targetDir: dir,
            dryRun: options.dryRun ?? false,
            typescript: options.typescript !== false,
        });
        if (result.success) {
            spinner.succeed('Migration complete!');
            console.log(`  Files processed: ${pc.green(String(result.filesProcessed))}`);
            console.log(`  Files modified: ${pc.green(String(result.filesModified))}`);
            if (result.warnings.length > 0) {
                result.warnings.forEach((w) => console.log(`  - ${w}`));
            }
        }
        else {
            spinner.fail('Migration had errors');
            result.errors.forEach((e) => {
                console.log(pc.red(`  ${e.file}:${e.line ?? 'unknown'}: ${e.message}`));
                if (e.suggestion) {
                    console.log(pc.dim(`    Suggestion: ${e.suggestion}`));
                }
            });
        }
    }
    catch (error) {
        spinner.fail('Migration failed');
        console.error(error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map