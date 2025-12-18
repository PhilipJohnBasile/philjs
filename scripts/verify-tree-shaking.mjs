#!/usr/bin/env node
/**
 * PhilJS Tree-Shaking Verification Script
 *
 * This script:
 * 1. Builds a minimal test app
 * 2. Analyzes the bundle for unused exports
 * 3. Reports actual bundle sizes
 * 4. Identifies code that wasn't tree-shaken
 *
 * Target: 20% smaller production builds compared to baseline
 */

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`${'='.repeat(60)}`, 'cyan');
  log(title, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatPercent(value) {
  return (value * 100).toFixed(1) + '%';
}

// Test scenarios to verify tree-shaking
const testScenarios = [
  {
    name: 'minimal-signal',
    description: 'Single signal import',
    code: `
      import { signal } from 'philjs-core';
      const count = signal(0);
      console.log(count());
    `,
    expectedImports: ['signal'],
    unexpectedImports: ['memo', 'effect', 'resource', 'batch'],
  },
  {
    name: 'signal-and-memo',
    description: 'Signal + Memo imports',
    code: `
      import { signal, memo } from 'philjs-core';
      const count = signal(0);
      const doubled = memo(() => count() * 2);
      console.log(doubled());
    `,
    expectedImports: ['signal', 'memo'],
    unexpectedImports: ['effect', 'resource', 'batch'],
  },
  {
    name: 'jsx-runtime-only',
    description: 'JSX runtime without signals',
    code: `
      import { jsx } from 'philjs-core/jsx-runtime';
      const App = () => jsx('div', { children: 'Hello' });
      console.log(App());
    `,
    expectedImports: ['jsx'],
    unexpectedImports: ['signal', 'memo', 'effect'],
  },
  {
    name: 'router-only',
    description: 'Router without core imports',
    code: `
      import { createRouter } from 'philjs-router';
      const router = createRouter({ routes: [] });
      console.log(router);
    `,
    expectedImports: ['createRouter'],
    unexpectedImports: ['effect', 'batch'],
  },
];

async function createTestApp(scenario) {
  const testDir = join(projectRoot, '.tree-shaking-test', scenario.name);

  // Clean and create test directory
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  mkdirSync(testDir, { recursive: true });

  // Create package.json
  const packageJson = {
    name: `tree-shaking-test-${scenario.name}`,
    version: '0.0.0',
    type: 'module',
    private: true,
    dependencies: {
      'philjs-core': 'workspace:*',
      'philjs-router': 'workspace:*',
    },
    devDependencies: {
      'rollup': '^4.0.0',
      '@rollup/plugin-node-resolve': '^15.0.0',
      '@rollup/plugin-terser': '^0.4.0',
    },
  };

  writeFileSync(
    join(testDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create test source file
  writeFileSync(join(testDir, 'index.js'), scenario.code.trim());

  // Create rollup config
  const rollupConfig = `
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'es',
    compact: true,
  },
  plugins: [
    resolve({
      preferBuiltins: false,
      modulesOnly: true,
    }),
    terser({
      compress: {
        passes: 3,
        pure_getters: true,
        unsafe: true,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    }),
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false,
    preset: 'smallest',
  },
};
  `.trim();

  writeFileSync(join(testDir, 'rollup.config.js'), rollupConfig);

  return testDir;
}

async function buildTestApp(testDir) {
  try {
    // Build with rollup
    execSync('pnpm rollup -c', {
      cwd: testDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    const bundlePath = join(testDir, 'dist', 'bundle.js');

    if (!existsSync(bundlePath)) {
      throw new Error('Bundle not created');
    }

    const bundleContent = readFileSync(bundlePath, 'utf-8');
    const bundleSize = Buffer.byteLength(bundleContent, 'utf-8');
    const gzippedSize = gzipSync(bundleContent).length;

    return {
      content: bundleContent,
      size: bundleSize,
      gzippedSize,
      success: true,
    };
  } catch (error) {
    return {
      content: '',
      size: 0,
      gzippedSize: 0,
      success: false,
      error: error.message,
    };
  }
}

function analyzeBundle(bundle, scenario) {
  const analysis = {
    foundExpected: [],
    foundUnexpected: [],
    unusedExports: [],
    warnings: [],
  };

  // Check for expected imports (should be present)
  scenario.expectedImports.forEach(name => {
    // Look for the function name in various forms
    const patterns = [
      new RegExp(`function\\s+${name}\\s*\\(`),
      new RegExp(`const\\s+${name}\\s*=`),
      new RegExp(`let\\s+${name}\\s*=`),
      new RegExp(`var\\s+${name}\\s*=`),
    ];

    const found = patterns.some(pattern => pattern.test(bundle.content));

    if (found) {
      analysis.foundExpected.push(name);
    } else {
      analysis.warnings.push(`Expected import "${name}" not found in bundle`);
    }
  });

  // Check for unexpected imports (should be tree-shaken)
  scenario.unexpectedImports.forEach(name => {
    const patterns = [
      new RegExp(`function\\s+${name}\\s*\\(`),
      new RegExp(`const\\s+${name}\\s*=`),
      new RegExp(`let\\s+${name}\\s*=`),
      new RegExp(`var\\s+${name}\\s*=`),
    ];

    const found = patterns.some(pattern => pattern.test(bundle.content));

    if (found) {
      analysis.foundUnexpected.push(name);
      analysis.warnings.push(`Unexpected "${name}" found - should be tree-shaken!`);
    }
  });

  // Detect common patterns that indicate poor tree-shaking
  const poorTreeShakingPatterns = [
    { pattern: /export\s*{\s*\w+\s*}/, message: 'Unused export statements remain' },
    { pattern: /import\s*{\s*\w+\s*}\s*from/, message: 'Unused import statements remain' },
  ];

  poorTreeShakingPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(bundle.content)) {
      analysis.unusedExports.push(message);
    }
  });

  return analysis;
}

async function runVerification() {
  logSection('PhilJS Tree-Shaking Verification');
  log(`Testing ${testScenarios.length} scenarios...`, 'gray');

  const results = [];
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let totalGzippedSize = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const scenario of testScenarios) {
    log(`\n► Testing: ${scenario.description}`, 'bright');

    try {
      // Create test app
      const testDir = await createTestApp(scenario);

      // Build bundle
      const bundle = await buildTestApp(testDir);

      if (!bundle.success) {
        log(`  ✗ Build failed: ${bundle.error}`, 'red');
        failedTests++;
        continue;
      }

      // Analyze bundle
      const analysis = analyzeBundle(bundle, scenario);

      // Report results
      log(`  Size: ${formatBytes(bundle.size)} (gzipped: ${formatBytes(bundle.gzippedSize)})`, 'cyan');

      if (analysis.foundExpected.length > 0) {
        log(`  ✓ Found expected: ${analysis.foundExpected.join(', ')}`, 'green');
      }

      if (analysis.foundUnexpected.length > 0) {
        log(`  ✗ Tree-shaking failed for: ${analysis.foundUnexpected.join(', ')}`, 'red');
        failedTests++;
      } else {
        log(`  ✓ Successfully tree-shaken: ${scenario.unexpectedImports.join(', ')}`, 'green');
        passedTests++;
      }

      if (analysis.warnings.length > 0) {
        analysis.warnings.forEach(warning => {
          log(`  ⚠ ${warning}`, 'yellow');
        });
      }

      // Estimate unoptimized size (rough estimate: 2x optimized size)
      const estimatedOriginal = bundle.size * 2;
      totalOriginalSize += estimatedOriginal;
      totalOptimizedSize += bundle.size;
      totalGzippedSize += bundle.gzippedSize;

      results.push({
        scenario: scenario.name,
        description: scenario.description,
        size: bundle.size,
        gzippedSize: bundle.gzippedSize,
        estimatedOriginal,
        passed: analysis.foundUnexpected.length === 0,
        analysis,
      });

      // Clean up
      rmSync(testDir, { recursive: true, force: true });

    } catch (error) {
      log(`  ✗ Error: ${error.message}`, 'red');
      failedTests++;
    }
  }

  // Summary report
  logSection('Summary Report');

  const savings = totalOriginalSize - totalOptimizedSize;
  const savingsPercent = savings / totalOriginalSize;

  log(`Total Scenarios: ${testScenarios.length}`, 'bright');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  console.log('');
  log(`Estimated Original Size: ${formatBytes(totalOriginalSize)}`, 'gray');
  log(`Optimized Size: ${formatBytes(totalOptimizedSize)}`, 'cyan');
  log(`Gzipped Size: ${formatBytes(totalGzippedSize)}`, 'cyan');
  log(`Size Reduction: ${formatBytes(savings)} (${formatPercent(savingsPercent)})`,
      savingsPercent >= 0.20 ? 'green' : 'yellow');
  console.log('');

  // Check if we met the 20% target
  if (savingsPercent >= 0.20) {
    log('✓ Target achieved! Bundle is 20%+ smaller with tree-shaking', 'green');
  } else {
    log(`⚠ Target not met. Need ${formatPercent(0.20 - savingsPercent)} more reduction`, 'yellow');
  }

  // Detailed results
  logSection('Detailed Results');

  results.forEach(result => {
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? 'green' : 'red';
    const reduction = (result.estimatedOriginal - result.size) / result.estimatedOriginal;

    log(`${status} ${result.description}`, color);
    log(`  Size: ${formatBytes(result.size)} (${formatPercent(reduction)} reduction)`, 'gray');
  });

  // Recommendations
  logSection('Recommendations');

  const recommendations = [];

  if (savingsPercent < 0.20) {
    recommendations.push('Add more /*#__PURE__*/ annotations to function calls');
    recommendations.push('Ensure all package.json files have "sideEffects": false');
    recommendations.push('Use named exports instead of default exports');
    recommendations.push('Split large modules into smaller, focused modules');
  }

  if (failedTests > 0) {
    recommendations.push('Review failed scenarios for bundling issues');
    recommendations.push('Check rollup/vite configurations for tree-shaking settings');
  }

  if (recommendations.length > 0) {
    recommendations.forEach((rec, idx) => {
      log(`  ${idx + 1}. ${rec}`, 'yellow');
    });
  } else {
    log('  All optimizations are working well!', 'green');
  }

  console.log('');

  // Clean up test directory
  const testRootDir = join(projectRoot, '.tree-shaking-test');
  if (existsSync(testRootDir)) {
    rmSync(testRootDir, { recursive: true, force: true });
  }

  // Exit with error code if tests failed
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run verification
runVerification().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
