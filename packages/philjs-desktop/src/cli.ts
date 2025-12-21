#!/usr/bin/env node
/**
 * PhilJS Desktop CLI
 * Commands for creating and building Tauri desktop applications
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// CLI types
interface CLIOptions {
  name?: string;
  template?: string;
  target?: 'windows' | 'macos' | 'linux' | 'all';
  debug?: boolean;
  verbose?: boolean;
  watch?: boolean;
}

interface TauriConfig {
  productName: string;
  version: string;
  identifier: string;
  build: {
    devPath: string;
    distDir: string;
  };
  app: {
    windows: Array<{
      title: string;
      width: number;
      height: number;
    }>;
  };
}

// Default Tauri configuration
const DEFAULT_TAURI_CONFIG: TauriConfig = {
  productName: 'PhilJS App',
  version: '0.1.0',
  identifier: 'com.philjs.app',
  build: {
    devPath: 'http://localhost:5173',
    distDir: '../dist',
  },
  app: {
    windows: [
      {
        title: 'PhilJS App',
        width: 1024,
        height: 768,
      },
    ],
  },
};

// Cargo.toml template
const CARGO_TOML_TEMPLATE = `[package]
name = "{{name}}"
version = "0.1.0"
description = "A PhilJS desktop application"
authors = ["you"]
license = ""
repository = ""
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-notification = "2"
tauri-plugin-clipboard-manager = "2"
tauri-plugin-global-shortcut = "2"
tauri-plugin-autostart = "2"
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
tauri-plugin-os = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`;

// Main Rust file template
const MAIN_RS_TEMPLATE = `// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Custom commands
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`;

// Build.rs template
const BUILD_RS_TEMPLATE = `fn main() {
    tauri_build::build()
}
`;

// Index.html template
const INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{name}}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #app {
        min-height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;

// Main.ts template
const MAIN_TS_TEMPLATE = `import { createDesktopApp, useTauri, invoke } from 'philjs-desktop';

// Create your PhilJS desktop app
createDesktopApp({
  component: App,
  config: {
    appName: '{{name}}',
    version: '0.1.0',
  },
  onReady: () => {
    console.log('App is ready!');
  },
});

function App() {
  const { isTauri } = useTauri();

  async function greet() {
    const message = await invoke<string>('greet', { name: 'World' });
    alert(message);
  }

  return \`
    <div style="padding: 20px; text-align: center;">
      <h1>Welcome to {{name}}</h1>
      <p>Running in \${isTauri ? 'Tauri' : 'Browser'} mode</p>
      <button onclick="greet()">Greet from Rust</button>
    </div>
  \`;
}

(window as any).greet = greet;
`;

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): { command: string; options: CLIOptions } {
  const command = args[0] || 'help';
  const options: CLIOptions = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name' || arg === '-n') {
      options.name = args[++i];
    } else if (arg === '--template' || arg === '-t') {
      options.template = args[++i];
    } else if (arg === '--target') {
      options.target = args[++i] as any;
    } else if (arg === '--debug' || arg === '-d') {
      options.debug = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--watch' || arg === '-w') {
      options.watch = true;
    } else if (!arg.startsWith('-') && !options.name) {
      options.name = arg;
    }
  }

  return { command, options };
}

/**
 * Initialize a new Tauri project
 */
async function initProject(options: CLIOptions): Promise<void> {
  const projectName = options.name || 'philjs-desktop-app';
  const projectDir = path.join(process.cwd(), projectName);

  console.log(`\nInitializing PhilJS Desktop project: ${projectName}\n`);

  // Check if directory exists
  if (fs.existsSync(projectDir)) {
    console.error(`Error: Directory '${projectName}' already exists`);
    process.exit(1);
  }

  // Create project structure
  const dirs = [
    projectDir,
    path.join(projectDir, 'src'),
    path.join(projectDir, 'src-tauri'),
    path.join(projectDir, 'src-tauri', 'src'),
    path.join(projectDir, 'src-tauri', 'icons'),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  Created: ${path.relative(process.cwd(), dir)}/`);
  }

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      'tauri:dev': 'tauri dev',
      'tauri:build': 'tauri build',
    },
    dependencies: {
      'philjs-core': 'workspace:*',
      'philjs-desktop': 'workspace:*',
    },
    devDependencies: {
      '@tauri-apps/cli': '^2.0.0',
      typescript: '^5.0.0',
      vite: '^5.0.0',
    },
  };

  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  console.log(`  Created: package.json`);

  // Create tauri.conf.json
  const tauriConf = {
    ...DEFAULT_TAURI_CONFIG,
    productName: projectName,
    identifier: `com.philjs.${projectName.replace(/-/g, '')}`,
    app: {
      windows: [
        {
          title: projectName,
          width: 1024,
          height: 768,
        },
      ],
    },
  };

  fs.writeFileSync(
    path.join(projectDir, 'src-tauri', 'tauri.conf.json'),
    JSON.stringify(tauriConf, null, 2)
  );
  console.log(`  Created: src-tauri/tauri.conf.json`);

  // Create Cargo.toml
  fs.writeFileSync(
    path.join(projectDir, 'src-tauri', 'Cargo.toml'),
    CARGO_TOML_TEMPLATE.replace(/{{name}}/g, projectName.replace(/-/g, '_'))
  );
  console.log(`  Created: src-tauri/Cargo.toml`);

  // Create main.rs
  fs.writeFileSync(
    path.join(projectDir, 'src-tauri', 'src', 'main.rs'),
    MAIN_RS_TEMPLATE
  );
  console.log(`  Created: src-tauri/src/main.rs`);

  // Create build.rs
  fs.writeFileSync(path.join(projectDir, 'src-tauri', 'build.rs'), BUILD_RS_TEMPLATE);
  console.log(`  Created: src-tauri/build.rs`);

  // Create index.html
  fs.writeFileSync(
    path.join(projectDir, 'index.html'),
    INDEX_HTML_TEMPLATE.replace(/{{name}}/g, projectName)
  );
  console.log(`  Created: index.html`);

  // Create main.ts
  fs.writeFileSync(
    path.join(projectDir, 'src', 'main.ts'),
    MAIN_TS_TEMPLATE.replace(/{{name}}/g, projectName)
  );
  console.log(`  Created: src/main.ts`);

  // Create vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: {
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
`;
  fs.writeFileSync(path.join(projectDir, 'vite.config.ts'), viteConfig);
  console.log(`  Created: vite.config.ts`);

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      module: 'ESNext',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ['src'],
  };

  fs.writeFileSync(
    path.join(projectDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
  console.log(`  Created: tsconfig.json`);

  console.log(`
Project initialized successfully!

Next steps:
  cd ${projectName}
  npm install
  npm run tauri:dev

For production build:
  npm run tauri:build
`);
}

/**
 * Start development mode
 */
async function startDev(options: CLIOptions): Promise<void> {
  console.log('\nStarting PhilJS Desktop development server...\n');

  // Check if we're in a Tauri project
  if (!fs.existsSync('src-tauri/tauri.conf.json')) {
    console.error('Error: Not a Tauri project. Run `philjs-desktop init` first.');
    process.exit(1);
  }

  const args = ['tauri', 'dev'];
  if (options.verbose) args.push('--verbose');

  const child = spawn('npx', args, {
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

/**
 * Build for production
 */
async function buildApp(options: CLIOptions): Promise<void> {
  console.log('\nBuilding PhilJS Desktop application...\n');

  // Check if we're in a Tauri project
  if (!fs.existsSync('src-tauri/tauri.conf.json')) {
    console.error('Error: Not a Tauri project. Run `philjs-desktop init` first.');
    process.exit(1);
  }

  const args = ['tauri', 'build'];

  // Add target if specified
  if (options.target && options.target !== 'all') {
    const targetMap: Record<string, string> = {
      windows: 'x86_64-pc-windows-msvc',
      macos: 'x86_64-apple-darwin',
      linux: 'x86_64-unknown-linux-gnu',
    };
    args.push('--target', targetMap[options.target] || options.target);
  }

  if (options.debug) args.push('--debug');
  if (options.verbose) args.push('--verbose');

  const child = spawn('npx', args, {
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    console.error('Failed to build:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log('\nBuild complete! Check src-tauri/target/release/bundle/');
    }
    process.exit(code || 0);
  });
}

/**
 * Show help
 */
function showHelp(): void {
  console.log(`
PhilJS Desktop CLI

Usage:
  philjs-desktop <command> [options]

Commands:
  init [name]       Initialize a new PhilJS Desktop project
  dev               Start development mode with hot reload
  build             Build for production

Options:
  --name, -n        Project name (for init)
  --target          Build target: windows, macos, linux, all
  --debug, -d       Build in debug mode
  --verbose, -v     Verbose output
  --help, -h        Show this help message

Examples:
  philjs-desktop init my-app
  philjs-desktop dev
  philjs-desktop build --target windows
  philjs-desktop build --target all
`);
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { command, options } = parseArgs(args);

  switch (command) {
    case 'init':
      await initProject(options);
      break;
    case 'dev':
      await startDev(options);
      break;
    case 'build':
      await buildApp(options);
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Run if called directly
main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Export for programmatic use
export { initProject, startDev, buildApp, parseArgs };
export type { CLIOptions, TauriConfig };
