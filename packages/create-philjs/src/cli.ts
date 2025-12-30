#!/usr/bin/env node
/**
 * create-philjs CLI
 * Create PhilJS apps with one command
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'node:path';
import { execSync } from 'node:child_process';

const VERSION = '1.0.0';

const TEMPLATES = {
  default: { name: 'TypeScript + Signals', features: ['signals', 'router', 'ssr'] },
  rust: { name: 'Rust + WASM', features: ['signals', 'router', 'ssr', 'wasm'] },
  fullstack: { name: 'Full-Stack', features: ['signals', 'router', 'ssr', 'server-functions'] },
  minimal: { name: 'Minimal', features: ['signals'] },
  htmx: { name: 'HTMX Mode', features: ['htmx', 'ssr'] },
  liveview: { name: 'LiveView', features: ['liveview', 'ssr'] },
  static: { name: 'Static Site', features: ['signals', 'islands', 'ssg'] },
};

async function main() {
  console.log(chalk.cyan.bold('\n  PhilJS - The Universal UI Framework\n'));
  
  const program = new Command();
  
  program
    .name('create-philjs')
    .description('Create a new PhilJS project')
    .version(VERSION)
    .argument('[name]', 'Project name', 'my-philjs-app')
    .option('-t, --template <name>', 'Template', 'default')
    .option('--no-git', 'Skip git init')
    .option('--no-install', 'Skip install')
    .action(async (name: string, opts: Record<string, unknown>) => {
      await createProject(name, opts);
    });
    
  program.parse();
}

async function createProject(name: string, opts: Record<string, unknown>) {
  const projectPath = path.resolve(process.cwd(), name);
  const template = (opts['template'] as string) || 'default';
  const templateConfig = TEMPLATES[template as keyof typeof TEMPLATES];
  const features = templateConfig?.features ?? ['signals'];
  
  const spinner = ora('Creating project...').start();
  
  try {
    fs.ensureDirSync(projectPath);
    fs.ensureDirSync(path.join(projectPath, 'src'));
    fs.ensureDirSync(path.join(projectPath, 'src/components'));
    fs.ensureDirSync(path.join(projectPath, 'src/routes'));
    fs.ensureDirSync(path.join(projectPath, 'public'));
    
    // package.json
    const dependencies: Record<string, string> = {
      '@philjs/core': '^1.0.0',
      '@philjs/signals': '^1.0.0',
    };

    if (features.includes('router')) dependencies['@philjs/router'] = '^1.0.0';
    if (features.includes('ssr')) dependencies['@philjs/ssr'] = '^1.0.0';
    if (features.includes('htmx')) dependencies['@philjs/htmx'] = '^1.0.0';

    const pkg = {
      name,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'philjs dev',
        build: 'philjs build',
        preview: 'philjs preview',
      },
      dependencies,
      devDependencies: {
        '@philjs/cli': '^1.0.0',
        typescript: '^5.3.0',
      },
    };
    
    fs.writeJsonSync(path.join(projectPath, 'package.json'), pkg, { spaces: 2 });
    
    // tsconfig.json
    fs.writeJsonSync(path.join(projectPath, 'tsconfig.json'), {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        jsx: 'preserve',
        jsxImportSource: '@philjs/core',
      },
      include: ['src/**/*'],
    }, { spaces: 2 });
    
    // Source files
    fs.writeFileSync(path.join(projectPath, 'src/main.ts'), 
      `import { mount } from '@philjs/core';\nimport { App } from './App';\nmount(App, document.getElementById('app')!);`
    );
    
    fs.writeFileSync(path.join(projectPath, 'src/App.tsx'),
      `import { signal } from '@philjs/signals';\n\nexport function App() {\n  const count = signal(0);\n  return (\n    <div>\n      <h1>PhilJS App</h1>\n      <button onClick={() => count.set(count.get() + 1)}>\n        Count: {count}\n      </button>\n    </div>\n  );\n}`
    );
    
    fs.writeFileSync(path.join(projectPath, 'index.html'),
      `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>PhilJS App</title>\n</head>\n<body>\n  <div id="app"></div>\n  <script type="module" src="/src/main.ts"></script>\n</body>\n</html>`
    );
    
    spinner.succeed('Project created!');
    
    if (opts['git'] !== false) {
      try {
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        fs.writeFileSync(path.join(projectPath, '.gitignore'), 'node_modules/\ndist/\n.cache/\n');
        console.log(chalk.dim('  Git initialized'));
      } catch (_error: unknown) {
        // Git init failed silently - user may not have git installed
      }
    }
    
    console.log(chalk.green.bold('\nSuccess!') + ' Created ' + chalk.cyan(name));
    console.log('\nNext steps:');
    console.log(chalk.cyan(`  cd ${name}`));
    console.log(chalk.cyan('  npm install'));
    console.log(chalk.cyan('  npm run dev'));
    
  } catch (err: unknown) {
    spinner.fail('Failed');
    console.error(err);
    process.exit(1);
  }
}

main();
