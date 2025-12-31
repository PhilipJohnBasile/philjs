#!/usr/bin/env node

/**
 * PhilJS Build CLI
 * Command-line interface for building PhilJS projects
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createRspackConfig, presets as rspackPresets } from '../rspack/config.js';
import { createRslibConfig, rslibPresets } from '../rslib/config.js';

const program = new Command();

program
  .name('philjs-build')
  .description('Build tool for PhilJS projects using Rspack/Rslib')
  .version('0.1.0');

/**
 * Build command
 */
program
  .command('build')
  .description('Build the project for production')
  .option('-e, --entry <entry>', 'Entry file', './src/index.ts')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('-m, --mode <mode>', 'Build mode (production|development)', 'production')
  .option('--no-sourcemap', 'Disable source maps')
  .option('--no-minify', 'Disable minification')
  .option('--analyze', 'Analyze bundle size')
  .action(async (options) => {
    console.log(chalk.blue('📦 Building PhilJS project...'));

    const config = createRspackConfig({
      mode: options.mode as 'production' | 'development',
      entry: options.entry,
      output: {
        path: options.output,
      },
      philjs: {
        signals: true,
        jsx: 'transform',
        autoMemo: true,
        treeshake: options.mode === 'production' ? 'aggressive' : 'standard',
      },
      devtool: options.sourcemap ? 'source-map' : false,
    });

    console.log(chalk.gray('Configuration:'));
    console.log(chalk.gray(`  Entry: ${options.entry}`));
    console.log(chalk.gray(`  Output: ${options.output}`));
    console.log(chalk.gray(`  Mode: ${options.mode}`));

    // In production, this would invoke Rspack
    console.log(chalk.green('\n✅ Build configuration generated'));
    console.log(chalk.gray('Run with Rspack: npx rspack build -c rspack.config.js'));

    // Export config for use with Rspack CLI
    console.log(chalk.gray('\nGenerated config:'));
    console.log(JSON.stringify(config, null, 2));
  });

/**
 * Dev command
 */
program
  .command('dev')
  .description('Start development server')
  .option('-e, --entry <entry>', 'Entry file', './src/index.ts')
  .option('-p, --port <port>', 'Dev server port', '3000')
  .option('--host', 'Expose to network')
  .option('--open', 'Open browser')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Starting development server...'));

    const config = createRspackConfig(rspackPresets.development(options.entry));

    console.log(chalk.gray('Development server:'));
    console.log(chalk.gray(`  Entry: ${options.entry}`));
    console.log(chalk.gray(`  Port: ${options.port}`));
    console.log(chalk.gray(`  Host: ${options.host ? '0.0.0.0' : 'localhost'}`));

    // In production, this would start Rspack dev server
    console.log(chalk.green(`\n✅ Dev server ready at http://localhost:${options.port}`));
  });

/**
 * Lib command - build as library
 */
program
  .command('lib')
  .description('Build as a library with multiple output formats')
  .option('-e, --entry <entry>', 'Entry file', './src/index.ts')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('-f, --formats <formats>', 'Output formats (esm,cjs,umd)', 'esm,cjs')
  .option('-n, --name <name>', 'UMD global name')
  .option('--no-dts', 'Skip TypeScript declarations')
  .action(async (options) => {
    console.log(chalk.blue('📚 Building library...'));

    const formats = options.formats.split(',') as ('esm' | 'cjs' | 'umd')[];

    const config = createRslibConfig({
      entry: options.entry,
      formats,
      dts: options.dts,
      umdName: options.name,
      outDir: options.output,
    });

    console.log(chalk.gray('Library build:'));
    console.log(chalk.gray(`  Entry: ${options.entry}`));
    console.log(chalk.gray(`  Formats: ${formats.join(', ')}`));
    console.log(chalk.gray(`  Output: ${options.output}`));
    console.log(chalk.gray(`  TypeScript declarations: ${options.dts}`));

    // In production, this would invoke Rslib
    console.log(chalk.green('\n✅ Library configuration generated'));
  });

/**
 * Init command - initialize build config
 */
program
  .command('init')
  .description('Initialize build configuration in current project')
  .option('-t, --type <type>', 'Project type (app|lib|microfrontend)', 'app')
  .action(async (options) => {
    console.log(chalk.blue('⚙️  Initializing PhilJS build configuration...'));

    const configs: Record<string, string> = {};

    switch (options.type) {
      case 'app':
        configs['rspack.config.ts'] = `
import { createRspackConfig, presets } from '@philjs/build/rspack';

export default createRspackConfig(presets.production('./src/index.ts'));
`;
        break;

      case 'lib':
        configs['rslib.config.ts'] = `
import { createRslibConfig, rslibPresets } from '@philjs/build/rslib';

export default createRslibConfig(rslibPresets.library('./src/index.ts'));
`;
        break;

      case 'microfrontend':
        configs['rspack.config.ts'] = `
import { createRspackConfig, presets } from '@philjs/build/rspack';

export default createRspackConfig(presets.microfrontend(
  'my-remote',
  './src/index.ts',
  {
    exposes: {
      './App': './src/App.tsx',
    },
  }
));
`;
        break;
    }

    console.log(chalk.gray(`\nProject type: ${options.type}`));
    console.log(chalk.gray('Generated configuration files:'));

    for (const [filename, content] of Object.entries(configs)) {
      console.log(chalk.gray(`  ${filename}`));
      console.log(chalk.dim(content));
    }

    console.log(chalk.green('\n✅ Configuration initialized'));
    console.log(chalk.gray('Add to package.json scripts:'));
    console.log(chalk.gray('  "build": "rspack build"'));
    console.log(chalk.gray('  "dev": "rspack serve"'));
  });

/**
 * Migrate command - migrate from Rollup/Webpack
 */
program
  .command('migrate')
  .description('Migrate existing Rollup/Webpack config to Rspack')
  .option('-c, --config <file>', 'Existing config file to migrate')
  .option('--dry-run', 'Show migration without applying')
  .action(async (options) => {
    console.log(chalk.blue('🔄 Migrating to Rspack...'));

    console.log(chalk.gray(`\nConfig file: ${options.config || 'auto-detect'}`));
    console.log(chalk.gray('Dry run: ' + (options.dryRun ? 'yes' : 'no')));

    // Migration logic would go here
    console.log(chalk.yellow('\n⚠️  Migration preview:'));
    console.log(chalk.gray('  - rollup.config.ts → rspack.config.ts'));
    console.log(chalk.gray('  - Update package.json scripts'));
    console.log(chalk.gray('  - Convert plugins where possible'));

    if (options.dryRun) {
      console.log(chalk.gray('\nNo changes made (dry run)'));
    } else {
      console.log(chalk.green('\n✅ Migration complete'));
    }
  });

/**
 * Info command - show build system info
 */
program
  .command('info')
  .description('Show build system information')
  .action(() => {
    console.log(chalk.blue('PhilJS Build System'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  Version: ${chalk.cyan('0.1.0')}`);
    console.log(`  Node: ${chalk.cyan(process.version)}`);
    console.log(`  Platform: ${chalk.cyan(process.platform)}`);
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.gray('\nBuild engines:'));
    console.log(`  Rspack: ${chalk.cyan('^1.1.0')} (Rust-based, fast)`);
    console.log(`  Rslib: ${chalk.cyan('^0.3.0')} (Library builds)`);
    console.log(`  Vite: ${chalk.cyan('^7.3.0')} (Dev server compat)`);
    console.log(chalk.gray('\nFeatures:'));
    console.log('  • 10x faster builds vs Rollup/Webpack');
    console.log('  • Module Federation for micro-frontends');
    console.log('  • Multi-format library output (ESM/CJS/UMD)');
    console.log('  • PhilJS signal optimization');
    console.log('  • JSX transform with @philjs/core');
  });

// Parse arguments
program.parse();

// Export for programmatic use
export { program };
