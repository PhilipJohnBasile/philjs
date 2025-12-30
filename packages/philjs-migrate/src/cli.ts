#!/usr/bin/env node
/**
 * PhilJS Migration CLI
 */

import { program } from 'commander';
import prompts from 'prompts';
import ora from 'ora';
import pc from 'picocolors';
import { migrate, analyzeProject, type MigrationError } from './index.js';

interface RunOptions {
  source?: string;
  dryRun?: boolean;
  typescript?: boolean;
}

program
  .name('philjs-migrate')
  .description('Migrate your project to PhilJS from React, Vue, Angular, or Svelte')
  .version('0.0.1');

program
  .command('analyze')
  .description('Analyze your project before migration')
  .argument('[dir]', 'Project directory', '.')
  .action(async (dir: string) => {
    const spinner = ora('Analyzing project...').start();

    try {
      const result = analyzeProject(dir);
      spinner.succeed('Analysis complete');

      console.log('\n' + pc.bold('Project Analysis:'));
      console.log(`  Framework: ${pc.cyan(result.framework)}`);
      console.log(`  Files: ${pc.cyan(String(result.files))}`);
      console.log(`  Complexity: ${pc.cyan(result.complexity)}`);
    } catch (error) {
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
  .action(async (dir: string, options: RunOptions) => {
    let source: 'react' | 'vue' | 'angular' | 'svelte' | 'solid' | undefined = 
      options.source as 'react' | 'vue' | 'angular' | 'svelte' | 'solid' | undefined;

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
      source = response['source'] as 'react' | 'vue' | 'angular' | 'svelte' | 'solid';
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
        console.log('\n' + pc.bold('Summary:'));
        console.log(`  Files processed: ${pc.green(String(result.filesProcessed))}`);
        console.log(`  Files modified: ${pc.green(String(result.filesModified))}`);

        if (result.warnings.length > 0) {
          console.log('\n' + pc.yellow('Warnings:'));
          result.warnings.forEach((w: string) => console.log(`  - ${w}`));
        }
      } else {
        spinner.fail('Migration had errors');
        result.errors.forEach((e: MigrationError) => {
          console.log(pc.red(`  ${e.file}:${e.line ?? 'unknown'}: ${e.message}`));
          if (e.suggestion) {
            console.log(pc.dim(`    Suggestion: ${e.suggestion}`));
          }
        });
      }
    } catch (error) {
      spinner.fail('Migration failed');
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
