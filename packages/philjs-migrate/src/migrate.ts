/**
 * PhilJS Migrate - Main Migration Engine
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import * as pc from 'picocolors';
import { ReactTransform } from './transforms/react';
import { VueTransform } from './transforms/vue';
import { SvelteTransform } from './transforms/svelte';
import { analyzeProject } from './analyze';
import { generateReport } from './report';

export interface MigrationOptions {
  source: string;
  target?: string;
  framework: 'react' | 'vue' | 'svelte' | 'auto';
  dryRun?: boolean;
  verbose?: boolean;
  include?: string[];
  exclude?: string[];
  generateReport?: boolean;
}

export interface MigrationResult {
  success: boolean;
  filesProcessed: number;
  filesTransformed: number;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  manualReviewNeeded: ManualReviewItem[];
}

export interface MigrationError {
  file: string;
  line?: number;
  message: string;
  code: string;
}

export interface MigrationWarning {
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

export interface ManualReviewItem {
  file: string;
  line: number;
  type: string;
  description: string;
  originalCode: string;
  suggestedCode?: string;
}

export async function migrate(options: MigrationOptions): Promise<MigrationResult> {
  const {
    source,
    target = source,
    framework,
    dryRun = false,
    verbose = false,
    include = ['**/*.{js,jsx,ts,tsx,vue,svelte}'],
    exclude = ['**/node_modules/**', '**/dist/**', '**/build/**'],
    generateReport: shouldGenerateReport = true,
  } = options;

  console.log(pc.cyan('\n🚀 PhilJS Migration Tool\n'));

  // Analyze project to detect framework if auto
  const analysis = await analyzeProject(source);
  const detectedFramework = framework === 'auto' ? analysis.framework : framework;

  console.log(pc.white(`Framework: ${pc.bold(detectedFramework)}`));
  console.log(pc.white(`Source: ${pc.bold(source)}`));
  console.log(pc.white(`Target: ${pc.bold(target)}`));
  console.log(pc.white(`Dry run: ${pc.bold(String(dryRun))}\n`));

  // Get transform based on framework
  const transform = getTransform(detectedFramework);

  // Find files to process
  const files = await findFiles(source, include, exclude);
  console.log(pc.white(`Found ${pc.bold(String(files.length))} files to process\n`));

  const result: MigrationResult = {
    success: true,
    filesProcessed: 0,
    filesTransformed: 0,
    errors: [],
    warnings: [],
    manualReviewNeeded: [],
  };

  // Process each file
  for (const file of files) {
    if (verbose) {
      console.log(pc.gray(`Processing: ${file}`));
    }

    try {
      const content = await fs.readFile(file, 'utf-8');
      const transformResult = await transform.transform(content, file);

      result.filesProcessed++;

      if (transformResult.transformed) {
        result.filesTransformed++;

        if (!dryRun) {
          const targetPath = file.replace(source, target);
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.writeFile(targetPath, transformResult.code);
        }

        if (verbose) {
          console.log(pc.green(`  ✓ Transformed`));
        }
      }

      // Collect warnings and manual review items
      result.warnings.push(...transformResult.warnings.map(w => ({ ...w, file })));
      result.manualReviewNeeded.push(...transformResult.manualReview.map(m => ({ ...m, file })));

    } catch (error) {
      result.errors.push({
        file,
        message: String(error),
        code: 'TRANSFORM_ERROR',
      });

      if (verbose) {
        console.log(pc.red(`  ✗ Error: ${error}`));
      }
    }
  }

  // Generate report
  if (shouldGenerateReport) {
    const reportPath = path.join(target, 'migration-report.md');
    await generateReport(result, analysis, reportPath);
    console.log(pc.white(`\nReport generated: ${pc.bold(reportPath)}`));
  }

  // Summary
  console.log(pc.cyan('\n📊 Migration Summary\n'));
  console.log(pc.white(`Files processed: ${pc.bold(String(result.filesProcessed))}`));
  console.log(pc.white(`Files transformed: ${pc.bold(String(result.filesTransformed))}`));
  console.log(pc.yellow(`Warnings: ${pc.bold(String(result.warnings.length))}`));
  console.log(pc.red(`Errors: ${pc.bold(String(result.errors.length))}`));
  console.log(pc.blue(`Manual review needed: ${pc.bold(String(result.manualReviewNeeded.length))}`));

  result.success = result.errors.length === 0;

  return result;
}

function getTransform(framework: string) {
  switch (framework) {
    case 'react':
      return new ReactTransform();
    case 'vue':
      return new VueTransform();
    case 'svelte':
      return new SvelteTransform();
    default:
      throw new Error(`Unknown framework: ${framework}`);
  }
}

async function findFiles(
  source: string,
  include: string[],
  exclude: string[]
): Promise<string[]> {
  const files: string[] = [];

  for (const pattern of include) {
    const matches = await glob(pattern, {
      cwd: source,
      absolute: true,
      ignore: exclude,
    });
    files.push(...matches);
  }

  return [...new Set(files)];
}
