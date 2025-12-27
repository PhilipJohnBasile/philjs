#!/usr/bin/env node
/**
 * PhilJS Go CLI
 *
 * Commands:
 *   init     - Initialize a new Go project
 *   build    - Build the Go server
 *   dev      - Start development server
 *   generate - Generate Go code from server functions
 */

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import {
  initGoProject,
  buildGoServer,
  createGoServer,
  checkGoInstalled,
} from './server.js';
import { generateGoCode, watchAndGenerate } from './codegen.js';

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      port: { type: 'string', short: 'p', default: '3000' },
      host: { type: 'string', default: '0.0.0.0' },
      watch: { type: 'boolean', short: 'w' },
      output: { type: 'string', short: 'o', default: './dist/go' },
      module: { type: 'string', short: 'm' },
      docker: { type: 'boolean' },
    },
  });

  const command = positionals[0];

  if (values.help || !command) {
    printHelp();
    process.exit(0);
  }

  // Check Go installation
  const goCheck = await checkGoInstalled();
  if (!goCheck.installed) {
    console.error('Error: Go is not installed. Please install Go from https://go.dev');
    process.exit(1);
  }
  console.log(`Using Go ${goCheck.version}`);

  switch (command) {
    case 'init':
      await handleInit(values, positionals);
      break;
    case 'build':
      await handleBuild(values);
      break;
    case 'dev':
      await handleDev(values);
      break;
    case 'generate':
      await handleGenerate(values);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

async function handleInit(
  values: Record<string, unknown>,
  positionals: string[]
): Promise<void> {
  const dir = positionals[1] || '.';
  const module = (values.module as string) || `github.com/user/${resolve(dir).split(/[/\\]/).pop()}`;

  console.log(`Initializing PhilJS Go project in ${dir}...`);

  await initGoProject(dir, {
    module,
    goVersion: '1.22',
    server: {
      port: parseInt(values.port as string, 10),
      ssr: true,
    },
  });

  console.log(`
PhilJS Go project initialized!

Next steps:
  cd ${dir}
  philjs-go dev
`);
}

async function handleBuild(values: Record<string, unknown>): Promise<void> {
  console.log('Building Go server...');

  const outputPath = await buildGoServer({
    outDir: values.output as string,
    mode: 'release',
    docker: values.docker as boolean,
  });

  console.log(`Build complete: ${outputPath}`);

  if (values.docker) {
    console.log('Docker image built: philjs-server');
  }
}

async function handleDev(values: Record<string, unknown>): Promise<void> {
  const port = parseInt(values.port as string, 10);
  const host = values.host as string;

  console.log(`Starting development server on ${host}:${port}...`);

  // First build
  await buildGoServer({
    outDir: values.output as string,
    mode: 'debug',
  });

  // Start server
  const server = await createGoServer({
    port,
    host,
    ssr: true,
  });

  console.log(`
PhilJS Go server running at http://${host}:${port}

Press Ctrl+C to stop
`);

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nStopping server...');
    await server.stop();
    process.exit(0);
  });
}

async function handleGenerate(values: Record<string, unknown>): Promise<void> {
  const srcDir = './src/server';
  const outDir = values.output as string;
  const module = (values.module as string) || 'github.com/user/app';

  if (values.watch) {
    console.log('Watching for changes...');
    await watchAndGenerate({ srcDir, outDir, module });
  } else {
    console.log('Generating Go code...');
    await generateGoCode({ srcDir, outDir, module });
    console.log(`Generated Go code in ${outDir}`);
  }
}

function printHelp(): void {
  console.log(`
PhilJS Go - High-performance Go server for PhilJS

Usage:
  philjs-go <command> [options]

Commands:
  init [dir]     Initialize a new Go project
  build          Build the Go server binary
  dev            Start development server with hot reload
  generate       Generate Go code from server functions

Options:
  -h, --help     Show this help message
  -p, --port     Server port (default: 3000)
  --host         Server host (default: 0.0.0.0)
  -o, --output   Output directory (default: ./dist/go)
  -m, --module   Go module name
  -w, --watch    Watch for changes
  --docker       Build Docker image

Examples:
  philjs-go init my-app
  philjs-go dev --port 8080
  philjs-go build --docker
  philjs-go generate --watch
`);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
