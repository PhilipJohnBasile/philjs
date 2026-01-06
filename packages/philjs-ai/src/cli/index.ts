#!/usr/bin/env node
/**
 * PhilJS AI CLI
 *
 * Command-line interface for AI-assisted development
 *
 * Commands:
 * - philjs-ai generate component "description"
 * - philjs-ai generate page "description" --path /route
 * - philjs-ai generate api "resource" --crud
 * - philjs-ai refactor ./src
 * - philjs-ai test ./src
 * - philjs-ai docs ./src
 * - philjs-ai review ./file.ts
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, extname, basename } from 'path';

import { autoDetectProvider } from '../providers/index.js';
import { ComponentGenerator } from '../codegen/component-generator.js';
import { PageGenerator } from '../codegen/page-generator.js';
import { APIGenerator } from '../codegen/api-generator.js';
import { RefactoringEngine } from '../refactor/index.js';
import { TestGenerator } from '../testing/test-generator.js';
import { DocGenerator } from '../docs/doc-generator.js';
import type { AIProvider } from '../types.js';

/**
 * CLI version
 */
const VERSION = '2.0.0';

/**
 * Create the CLI program
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name('philjs-ai')
    .description('AI-powered development tools for PhilJS')
    .version(VERSION);

  // Generate command group
  const generate = program
    .command('generate')
    .alias('g')
    .description('Generate code with AI');

  // Generate component
  const componentCmd = generate.command('component <description>');
  componentCmd.alias('c');
  componentCmd
    .description('Generate a PhilJS component from description')
    .option('-n, --name <name>', 'Component name')
    .option('-o, --output <path>', 'Output file path')
    .option('-t, --tests', 'Include tests')
    .option('-s, --styles <approach>', 'Styling approach (tailwind, css-modules, inline)')
    .option('--no-signals', 'Do not use signals for state')
    .action(async (description: string, options: {
      name?: string;
      output?: string;
      tests?: boolean;
      styles?: string;
      signals?: boolean;
    }) => {
      await runWithSpinner('Generating component...', async () => {
        const provider = getProvider();
        const generator = new ComponentGenerator(provider);

        const name = options.name || inferComponentName(description);
        const config: Parameters<typeof generator.generateFromDescription>[0] = {
          name,
          description,
          useSignals: options.signals !== false,
        };
        if (options.tests !== undefined) config.includeTests = options.tests;
        if (options.styles) config.style = { approach: options.styles as 'tailwind' | 'css-modules' | 'inline' };
        const result = await generator.generateFromDescription(config);

        if (options.output) {
          writeFileSync(options.output, result.code);
          console.log(`Component written to ${options.output}`);
        } else {
        }

        if (result.tests && options.tests) {
        }

      });
    });

  // Generate page
  const pageCmd = generate.command('page <description>');
  pageCmd.alias('p');
  pageCmd
    .description('Generate a full page from description')
    .option('-n, --name <name>', 'Page name')
    .option('-p, --path <route>', 'Route path', '/')
    .option('-o, --output <path>', 'Output file path')
    .option('-t, --type <type>', 'Page type (landing, dashboard, list, detail, form)')
    .option('--loader', 'Include data loader')
    .option('--action', 'Include form action')
    .action(async (description: string, options: {
      name?: string;
      path?: string;
      output?: string;
      type?: string;
      loader?: boolean;
      action?: boolean;
    }) => {
      await runWithSpinner('Generating page...', async () => {
        const provider = getProvider();
        const generator = new PageGenerator(provider);

        const name = options.name || inferPageName(description);
        const pageConfig: Parameters<typeof generator.generatePage>[0] = {
          name,
          path: options.path || '/',
          description,
        };
        if (options.type) pageConfig.type = options.type as 'landing' | 'dashboard' | 'list' | 'detail' | 'form';
        if (options.loader) pageConfig.dataLoading = { source: 'api', loadingStates: true };
        if (options.action !== undefined) pageConfig.includeActions = options.action;
        const result = await generator.generatePage(pageConfig);

        if (options.output) {
          writeFileSync(options.output, result.code);
          console.log(`Page written to ${options.output}`);
        } else {
        }

        if (result.loader) {
        }

      });
    });

  // Generate API
  const apiCmd = generate.command('api <resource>');
  apiCmd.alias('a');
  apiCmd
    .description('Generate API routes for a resource')
    .option('-o, --output <path>', 'Output file path')
    .option('--crud', 'Generate full CRUD operations')
    .option('-d, --database <type>', 'Database type (postgresql, mysql, prisma)')
    .option('-v, --validation <lib>', 'Validation library (zod, yup)', 'zod')
    .option('--openapi', 'Generate OpenAPI spec')
    .action(async (resource: string, options: {
      output?: string;
      crud?: boolean;
      database?: string;
      validation?: string;
      openapi?: boolean;
    }) => {
      await runWithSpinner('Generating API...', async () => {
        const provider = getProvider();
        const generator = new APIGenerator(provider);

        const apiConfig: Parameters<typeof generator.generateCRUD>[0] = {
          resource,
          operations: options.crud ? ['create', 'read', 'update', 'delete', 'list'] : ['read', 'list'],
          validation: options.validation as 'zod' | 'yup',
        };
        if (options.database) apiConfig.database = options.database as 'postgresql' | 'mysql' | 'prisma';
        if (options.openapi !== undefined) apiConfig.openapi = options.openapi;
        const result = await generator.generateCRUD(apiConfig);

        if (options.output) {
          writeFileSync(options.output, result.routes.map(r => r.code).join('\n\n'));
          console.log(`API written to ${options.output}`);
        } else {
          for (const route of result.routes) {
            console.log(`// ${route.method} ${route.path}`);
          }
        }


      });
    });

  // Refactor command
  const refactorCmd = program.command('refactor <path>');
  refactorCmd.alias('r');
  refactorCmd
    .description('AI-powered code refactoring')
    .option('-f, --focus <areas>', 'Focus areas (signals,performance,accessibility,patterns)', 'performance,patterns')
    .option('-l, --level <level>', 'Refactoring level (conservative, moderate, aggressive)', 'moderate')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show suggestions without applying')
    .action(async (path: string, options: {
      focus?: string;
      level?: string;
      output?: string;
      dryRun?: boolean;
    }) => {
      await runWithSpinner('Analyzing code...', async () => {
        const provider = getProvider();
        const engine = new RefactoringEngine(provider);

        const files = getSourceFiles(path);
        for (const file of files) {
          console.log(`\nRefactoring: ${file}`);
          const code = readFileSync(file, 'utf-8');

          const focusAreas = (options.focus || 'performance,patterns').split(',').map(a => a.trim());
          const result = await engine.refactor({
            code,
            filePath: file,
            focusAreas: focusAreas as ('signals' | 'performance' | 'accessibility' | 'patterns')[],
            level: options.level as 'conservative' | 'moderate' | 'aggressive',
          });

          if (options.dryRun) {
            for (const suggestion of result.suggestions) {
              console.log(`[${suggestion.impact.toUpperCase()}] ${suggestion.type}: ${suggestion.description}`);
              console.log(`  Before: ${suggestion.before.slice(0, 50)}...`);
              console.log(`  After: ${suggestion.after.slice(0, 50)}...`);
            }
          } else {
            const outputPath = options.output || file;
            writeFileSync(outputPath, result.refactored);
            console.log(`Refactored code written to ${outputPath}`);
          }

          console.log(`Summary: ${result.summary}`);
        }
      });
    });

  // Test command
  const testCmd = program.command('test <path>');
  testCmd.alias('t');
  testCmd
    .description('Generate tests for code')
    .option('-t, --type <type>', 'Test type (unit, integration, e2e, component)', 'unit')
    .option('-f, --framework <framework>', 'Test framework (vitest, jest)', 'vitest')
    .option('-o, --output <path>', 'Output directory')
    .option('--coverage', 'Analyze coverage and suggest tests')
    .action(async (path: string, options: {
      type?: string;
      framework?: string;
      output?: string;
      coverage?: boolean;
    }) => {
      await runWithSpinner('Generating tests...', async () => {
        const provider = getProvider();
        const generator = new TestGenerator(provider);

        const files = getSourceFiles(path);
        for (const file of files) {
          console.log(`\nGenerating tests for: ${file}`);
          const code = readFileSync(file, 'utf-8');
          const name = basename(file, extname(file));

          if (options.coverage) {
            const coverage = await generator.analyzeCoverage(code);
            console.log(`\nCoverage Analysis: ${coverage.overallCoverage}%`);
            for (const missing of coverage.missingCoverage) {
              console.log(`  - [${missing.priority}] ${missing.description}`);
            }
            for (const test of coverage.suggestedTests) {
              console.log(`  - [${test.priority}] ${test.name}: ${test.tests}`);
            }
          }

          const result = await generator.generateTests({
            code,
            name,
            type: options.type as 'unit' | 'integration' | 'e2e' | 'component',
            framework: options.framework as 'vitest' | 'jest',
          });

          const outputPath = options.output
            ? join(options.output, `${name}.test.ts`)
            : file.replace(/\.(ts|tsx)$/, '.test.$1');

          writeFileSync(outputPath, result.code);
          console.log(`Tests written to ${outputPath}`);
          console.log(`Test cases: ${result.testCases.length}`);
        }
      });
    });

  // Docs command
  const docsCmd = program.command('docs <path>');
  docsCmd.alias('d');
  docsCmd
    .description('Generate documentation')
    .option('-s, --style <style>', 'Documentation style (jsdoc, tsdoc, markdown)', 'jsdoc')
    .option('-o, --output <path>', 'Output path')
    .option('--readme', 'Generate README')
    .option('--api', 'Generate API documentation')
    .option('--inline', 'Add inline comments')
    .action(async (path: string, options: {
      style?: string;
      output?: string;
      readme?: boolean;
      api?: boolean;
      inline?: boolean;
    }) => {
      await runWithSpinner('Generating documentation...', async () => {
        const provider = getProvider();
        const generator = new DocGenerator(provider);

        if (options.readme) {
          const packageJson = JSON.parse(readFileSync(join(path, 'package.json'), 'utf-8'));
          const readme = await generator.generateReadme({
            name: packageJson.name,
            description: packageJson.description,
            sections: ['installation', 'usage', 'api', 'examples', 'contributing', 'license'],
          });

          const outputPath = options.output || join(path, 'README.md');
          writeFileSync(outputPath, readme.content);
          console.log(`README written to ${outputPath}`);
          return;
        }

        const files = getSourceFiles(path);
        for (const file of files) {
          console.log(`\nDocumenting: ${file}`);
          const code = readFileSync(file, 'utf-8');

          if (options.inline) {
            const documented = await generator.addInlineComments(code, 'normal');
            const outputPath = options.output || file;
            writeFileSync(outputPath, documented);
            console.log(`Inline comments added to ${outputPath}`);
          } else {
            const result = await generator.generateDocs({
              code,
              filePath: file,
              style: options.style as 'jsdoc' | 'tsdoc' | 'markdown',
              includeExamples: true,
            });

            const outputPath = options.output || file;
            writeFileSync(outputPath, result.code);
            console.log(`Documentation added to ${outputPath}`);
          }
        }
      });
    });

  // Review command
  program
    .command('review <path>')
    .description('AI-powered code review')
    .option('-a, --aspects <aspects>', 'Review aspects (bugs,performance,security,style,patterns)', 'bugs,performance,patterns')
    .option('--json', 'Output as JSON')
    .action(async (path: string, options: {
      aspects?: string;
      json?: boolean;
    }) => {
      await runWithSpinner('Reviewing code...', async () => {
        const provider = getProvider();
        const engine = new RefactoringEngine(provider);

        const files = getSourceFiles(path);
        const allResults = [];

        for (const file of files) {
          const code = readFileSync(file, 'utf-8');
          const aspects = (options.aspects || 'bugs,performance,patterns').split(',').map(a => a.trim());

          const result = await engine.reviewCode(
            code,
            file,
            aspects as ('bugs' | 'performance' | 'security' | 'style' | 'patterns')[]
          );

          if (options.json) {
            allResults.push({ file, ...result });
          } else {
            console.log(`\n=== ${file} ===`);
            console.log(`Score: ${result.overallScore}/100`);
            console.log(`\nIssues (${result.issues.length}):`);
            for (const issue of result.issues) {
              const line = issue.line ? `:${issue.line}` : '';
              console.log(`  [${issue.severity.toUpperCase()}] ${issue.type}${line}: ${issue.message}`);
              if (issue.suggestion) {
                console.log(`    Suggestion: ${issue.suggestion}`);
              }
            }
            for (const suggestion of result.suggestions) {
              console.log(`  - ${suggestion}`);
            }
            console.log(`\nSummary: ${result.summary}`);
          }
        }

        if (options.json) {
        }
      });
    });

  // Config command
  program
    .command('config')
    .description('Configure AI provider settings')
    .option('--provider <provider>', 'Set AI provider (openai, anthropic, local)')
    .option('--key <key>', 'Set API key')
    .option('--model <model>', 'Set default model')
    .option('--show', 'Show current configuration')
    .action((options: {
      provider?: string;
      key?: string;
      model?: string;
      show?: boolean;
    }) => {
      if (options.show) {
        const openaiKey = process.env['OPENAI_API_KEY'];
        const anthropicKey = process.env['ANTHROPIC_API_KEY'];
        const ollamaUrl = process.env['OLLAMA_URL'];
        console.log(`  OPENAI_API_KEY: ${openaiKey ? '***' + openaiKey.slice(-4) : 'Not set'}`);
        console.log(`  ANTHROPIC_API_KEY: ${anthropicKey ? '***' + anthropicKey.slice(-4) : 'Not set'}`);
        console.log(`  OLLAMA_URL: ${ollamaUrl || 'Not set (default: http://localhost:11434)'}`);
        return;
      }

      console.log('To configure providers, set environment variables:');
      console.log('  export ANTHROPIC_API_KEY=sk-ant-...');
      console.log('  export OLLAMA_URL=http://localhost:11434');
    });

  return program;
}

/**
 * Get AI provider from environment
 */
function getProvider(): AIProvider {
  try {
    return autoDetectProvider();
  } catch {
    console.error('No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or ensure Ollama is running.');
    process.exit(1);
  }
}

/**
 * Get source files from path
 */
function getSourceFiles(path: string): string[] {
  const resolved = resolve(path);

  if (!existsSync(resolved)) {
    console.error(`Path not found: ${resolved}`);
    process.exit(1);
  }

  const stats = statSync(resolved);

  if (stats.isFile()) {
    return [resolved];
  }

  if (stats.isDirectory()) {
    const files: string[] = [];
    const entries = readdirSync(resolved, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
        files.push(join(resolved, entry.name));
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...getSourceFiles(join(resolved, entry.name)));
      }
    }

    return files;
  }

  return [];
}

/**
 * Infer component name from description
 */
function inferComponentName(description: string): string {
  const words = description.split(/\s+/).slice(0, 3);
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Infer page name from description
 */
function inferPageName(description: string): string {
  const words = description.split(/\s+/).slice(0, 2);
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '') + 'Page';
}

/**
 * Run an async function with a spinner
 */
async function runWithSpinner(message: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();

  try {
    await fn();
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\nCompleted in ${duration}s`);
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}

// Run CLI
main().catch(console.error);

export { createProgram };
