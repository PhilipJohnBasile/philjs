#!/usr/bin/env node
/**
 * @philjs/test-gen CLI
 *
 * Command-line interface for AI-powered test generation.
 *
 * Usage:
 *   philjs-test-gen generate <component>    Generate tests for a component
 *   philjs-test-gen record                  Start recording user interactions
 *   philjs-test-gen flow <file>             Generate tests from a flow file
 *   philjs-test-gen coverage <dir>          Analyze test coverage
 *   philjs-test-gen init                    Initialize test-gen config
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';
import {
  generateTests,
  generateFromFlow,
  analyzeComponent,
  getDefaultConfig,
  type TestGenConfig,
  type UserFlow,
} from './index.js';

interface CliOptions {
  output?: string;
  framework?: 'vitest' | 'jest' | 'playwright';
  style?: 'unit' | 'integration' | 'e2e';
  language?: 'typescript' | 'javascript';
  config?: string;
  verbose?: boolean;
  dryRun?: boolean;
}

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string): void {
  console.log(message);
}

function success(message: string): void {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message: string): void {
  console.error(`${colors.red}✗${colors.reset} ${message}`);
}

function info(message: string): void {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function warn(message: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function printHelp(): void {
  log(`
${colors.bright}@philjs/test-gen${colors.reset} - AI-powered test generation

${colors.cyan}USAGE${colors.reset}
  philjs-test-gen <command> [options]

${colors.cyan}COMMANDS${colors.reset}
  generate <component>    Generate tests for a component file
  flow <file>             Generate tests from a flow definition file
  coverage <dir>          Analyze test coverage for a directory
  init                    Initialize test-gen configuration

${colors.cyan}OPTIONS${colors.reset}
  -o, --output <dir>      Output directory for generated tests
  -f, --framework <name>  Testing framework (vitest, jest, playwright)
  -s, --style <type>      Test style (unit, integration, e2e)
  -l, --language <lang>   Output language (typescript, javascript)
  -c, --config <file>     Path to config file
  -v, --verbose           Verbose output
  --dry-run               Preview without writing files

${colors.cyan}EXAMPLES${colors.reset}
  # Generate tests for a component
  philjs-test-gen generate src/components/Button.tsx

  # Generate tests from a flow file
  philjs-test-gen flow flows/login.flow.json

  # Analyze test coverage
  philjs-test-gen coverage src/components

  # Initialize configuration
  philjs-test-gen init

${colors.cyan}FLOW FILE FORMAT${colors.reset}
  {
    "name": "User Login",
    "steps": [
      { "action": "navigate", "value": "/login" },
      { "action": "type", "target": "#email", "value": "user@example.com" },
      { "action": "click", "target": "button[type=submit]" }
    ],
    "assertions": [
      { "type": "visible", "target": ".dashboard", "expected": true }
    ]
  }
`);
}

function parseArgs(args: string[]): { command: string; target?: string; options: CliOptions } {
  const options: CliOptions = {};
  let command = '';
  let target: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('-')) {
      switch (arg) {
        case '-o':
        case '--output':
          options.output = args[++i];
          break;
        case '-f':
        case '--framework':
          options.framework = args[++i] as CliOptions['framework'];
          break;
        case '-s':
        case '--style':
          options.style = args[++i] as CliOptions['style'];
          break;
        case '-l':
        case '--language':
          options.language = args[++i] as CliOptions['language'];
          break;
        case '-c':
        case '--config':
          options.config = args[++i];
          break;
        case '-v':
        case '--verbose':
          options.verbose = true;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '-h':
        case '--help':
          printHelp();
          process.exit(0);
          break;
        default:
          warn(`Unknown option: ${arg}`);
      }
    } else if (!command) {
      command = arg;
    } else if (!target) {
      target = arg;
    }
  }

  return { command, target, options };
}

function loadConfig(configPath?: string): TestGenConfig {
  const defaultPaths = [
    'test-gen.config.ts',
    'test-gen.config.js',
    'test-gen.config.json',
    '.testgenrc',
    '.testgenrc.json',
  ];

  const paths = configPath ? [configPath] : defaultPaths;

  for (const path of paths) {
    const fullPath = resolve(process.cwd(), path);
    if (existsSync(fullPath)) {
      try {
        if (path.endsWith('.json') || path === '.testgenrc' || path === '.testgenrc.json') {
          const content = readFileSync(fullPath, 'utf-8');
          return JSON.parse(content);
        }
        // For .ts/.js files, we'd need to import them dynamically
        // For now, just use JSON config
        warn(`Config file ${path} found but only JSON configs are supported in CLI`);
      } catch (err) {
        error(`Failed to load config from ${path}: ${err}`);
      }
    }
  }

  return getDefaultConfig();
}

async function generateCommand(target: string, options: CliOptions): Promise<void> {
  const config = loadConfig(options.config);
  const fullPath = resolve(process.cwd(), target);

  if (!existsSync(fullPath)) {
    error(`File not found: ${target}`);
    process.exit(1);
  }

  info(`Analyzing component: ${target}`);

  const sourceCode = readFileSync(fullPath, 'utf-8');

  // Mock component for analysis (in real implementation, would parse the file)
  const mockComponent = (): null => null;
  mockComponent.displayName = basename(target, extname(target));

  const mergedConfig: TestGenConfig = {
    ...config,
    outputDir: options.output || config.outputDir,
    framework: options.framework || config.framework,
    style: options.style || config.style,
    language: options.language || config.language,
  };

  if (options.verbose) {
    info(`Config: ${JSON.stringify(mergedConfig, null, 2)}`);
  }

  try {
    // Analyze the component
    const analysis = await analyzeComponent(mockComponent);

    if (options.verbose) {
      info(`Analysis: ${JSON.stringify(analysis, null, 2)}`);
    }

    // Generate tests
    const tests = await generateTests(mockComponent, mergedConfig);

    if (options.dryRun) {
      log('\n--- Generated Test (dry run) ---\n');
      log(tests.code);
      log('\n--- End ---\n');
      success('Dry run complete. No files written.');
      return;
    }

    // Write test file
    const outputDir = mergedConfig.outputDir || dirname(fullPath);
    const testFileName = basename(target, extname(target)) + '.test' + extname(target);
    const testPath = resolve(outputDir, testFileName);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(testPath, tests.code, 'utf-8');
    success(`Generated test: ${testPath}`);

    // Print coverage info
    log(`\n${colors.cyan}Test Coverage:${colors.reset}`);
    log(`  Statements: ${(tests.coverage.statements * 100).toFixed(1)}%`);
    log(`  Branches:   ${(tests.coverage.branches * 100).toFixed(1)}%`);
    log(`  Functions:  ${(tests.coverage.functions * 100).toFixed(1)}%`);
  } catch (err) {
    error(`Failed to generate tests: ${err}`);
    process.exit(1);
  }
}

async function flowCommand(target: string, options: CliOptions): Promise<void> {
  const config = loadConfig(options.config);
  const fullPath = resolve(process.cwd(), target);

  if (!existsSync(fullPath)) {
    error(`Flow file not found: ${target}`);
    process.exit(1);
  }

  info(`Loading flow: ${target}`);

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const flow: UserFlow = JSON.parse(content);

    if (options.verbose) {
      info(`Flow: ${JSON.stringify(flow, null, 2)}`);
    }

    const mergedConfig: TestGenConfig = {
      ...config,
      outputDir: options.output || config.outputDir,
      framework: options.framework || config.framework,
      style: options.style || config.style,
      language: options.language || config.language,
    };

    const tests = await generateFromFlow(flow, mergedConfig);

    if (options.dryRun) {
      log('\n--- Generated Test (dry run) ---\n');
      log(tests.code);
      log('\n--- End ---\n');
      success('Dry run complete. No files written.');
      return;
    }

    // Write test file
    const outputDir = mergedConfig.outputDir || dirname(fullPath);
    const flowName = flow.name.toLowerCase().replace(/\s+/g, '-');
    const ext = mergedConfig.language === 'typescript' ? '.ts' : '.js';
    const testFileName = `${flowName}.test${ext}`;
    const testPath = resolve(outputDir, testFileName);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(testPath, tests.code, 'utf-8');
    success(`Generated test: ${testPath}`);
  } catch (err) {
    error(`Failed to generate tests from flow: ${err}`);
    process.exit(1);
  }
}

async function coverageCommand(target: string, options: CliOptions): Promise<void> {
  const fullPath = resolve(process.cwd(), target);

  if (!existsSync(fullPath)) {
    error(`Directory not found: ${target}`);
    process.exit(1);
  }

  info(`Analyzing test coverage for: ${target}`);

  // In a real implementation, this would:
  // 1. Scan the directory for component files
  // 2. Check for corresponding test files
  // 3. Analyze test coverage

  log(`\n${colors.cyan}Coverage Summary:${colors.reset}`);
  log('  This feature requires test execution.');
  log('  Run your tests with coverage enabled:');
  log('');
  log(`    ${colors.dim}vitest run --coverage${colors.reset}`);
  log(`    ${colors.dim}jest --coverage${colors.reset}`);
  log('');
  info('Integration with coverage tools coming soon.');
}

function initCommand(options: CliOptions): void {
  const configPath = resolve(process.cwd(), 'test-gen.config.json');

  if (existsSync(configPath) && !options.dryRun) {
    warn('Configuration file already exists: test-gen.config.json');
    return;
  }

  const defaultConfig = {
    outputDir: '__tests__',
    framework: 'vitest',
    style: 'unit',
    language: 'typescript',
    includeSnapshots: false,
    includeA11y: true,
    coverage: {
      statements: 80,
      branches: 70,
      functions: 80,
    },
    patterns: {
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**'],
    },
  };

  if (options.dryRun) {
    log('\n--- Configuration (dry run) ---\n');
    log(JSON.stringify(defaultConfig, null, 2));
    log('\n--- End ---\n');
    success('Dry run complete. No files written.');
    return;
  }

  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  success('Created configuration file: test-gen.config.json');

  log(`\n${colors.cyan}Next steps:${colors.reset}`);
  log('  1. Customize test-gen.config.json for your project');
  log('  2. Run: philjs-test-gen generate src/components/YourComponent.tsx');
  log('  3. Review and refine the generated tests');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const { command, target, options } = parseArgs(args);

  switch (command) {
    case 'generate':
      if (!target) {
        error('Missing target component. Usage: philjs-test-gen generate <component>');
        process.exit(1);
      }
      await generateCommand(target, options);
      break;

    case 'flow':
      if (!target) {
        error('Missing flow file. Usage: philjs-test-gen flow <file>');
        process.exit(1);
      }
      await flowCommand(target, options);
      break;

    case 'coverage':
      if (!target) {
        error('Missing directory. Usage: philjs-test-gen coverage <dir>');
        process.exit(1);
      }
      await coverageCommand(target, options);
      break;

    case 'init':
      initCommand(options);
      break;

    case 'help':
      printHelp();
      break;

    default:
      error(`Unknown command: ${command}`);
      log('Run "philjs-test-gen --help" for usage information.');
      process.exit(1);
  }
}

main().catch((err) => {
  error(`Fatal error: ${err}`);
  process.exit(1);
});
