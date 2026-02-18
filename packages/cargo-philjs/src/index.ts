/**
 * PhilJS Cargo CLI
 *
 * TypeScript utilities for the cargo-philjs Rust CLI.
 * The main functionality is provided by the Rust binary.
 *
 * @example
 * ```typescript
 * import { runCargoPhiljs, CargoPhiljsConfig } from '@philjs/cargo-philjs';
 *
 * // Run cargo-philjs programmatically
 * await runCargoPhiljs(['build', '--release']);
 * ```
 */

import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ============================================================================
// Types
// ============================================================================

export interface CargoPhiljsConfig {
  /** Working directory for the command */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Inherit stdio from parent process */
  inheritStdio?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface CargoPhiljsResult {
  /** Exit code */
  code: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Whether the command succeeded */
  success: boolean;
}

export interface PhiljsProjectConfig {
  /** Project name */
  name: string;
  /** Target platforms */
  targets?: ('wasm' | 'node' | 'browser' | 'native')[];
  /** Features to enable */
  features?: string[];
  /** Build profile */
  profile?: 'dev' | 'release';
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Run cargo-philjs with the given arguments
 */
export async function runCargoPhiljs(
  args: string[],
  config: CargoPhiljsConfig = {}
): Promise<CargoPhiljsResult> {
  const { cwd = process.cwd(), env = {}, inheritStdio = false, timeout } = config;

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const spawnOptions: SpawnOptions = {
      cwd,
      env: { ...process.env, ...env },
      stdio: inheritStdio ? 'inherit' : 'pipe',
    };

    const child = spawn('cargo-philjs', args, spawnOptions);

    if (!inheritStdio) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeout) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, timeout);
    }

    child.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);

      if (timedOut) {
        reject(new Error(`cargo-philjs timed out after ${timeout}ms`));
        return;
      }

      resolve({
        code: code ?? 1,
        stdout,
        stderr,
        success: code === 0,
      });
    });

    child.on('error', (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(err);
    });
  });
}

/**
 * Initialize a new PhilJS project
 */
export async function initProject(
  projectName: string,
  template: string = 'default',
  config: CargoPhiljsConfig = {}
): Promise<CargoPhiljsResult> {
  return runCargoPhiljs(['init', projectName, '--template', template], config);
}

/**
 * Build a PhilJS project
 */
export async function buildProject(
  options: {
    release?: boolean;
    target?: string;
    features?: string[];
  } = {},
  config: CargoPhiljsConfig = {}
): Promise<CargoPhiljsResult> {
  const args = ['build'];

  if (options.release) {
    args.push('--release');
  }

  if (options.target) {
    args.push('--target', options.target);
  }

  if (options.features && options.features.length > 0) {
    args.push('--features', options.features.join(','));
  }

  return runCargoPhiljs(args, config);
}

/**
 * Run tests for a PhilJS project
 */
export async function runTests(
  options: {
    filter?: string;
    nocapture?: boolean;
  } = {},
  config: CargoPhiljsConfig = {}
): Promise<CargoPhiljsResult> {
  const args = ['test'];

  if (options.filter) {
    args.push('--filter', options.filter);
  }

  if (options.nocapture) {
    args.push('--', '--nocapture');
  }

  return runCargoPhiljs(args, config);
}

/**
 * Watch for changes and rebuild
 */
export function watchProject(
  options: {
    onChange?: (result: CargoPhiljsResult) => void;
    onError?: (error: Error) => void;
  } = {},
  config: CargoPhiljsConfig = {}
): ChildProcess {
  const spawnOptions: SpawnOptions = {
    cwd: config.cwd ?? process.cwd(),
    env: { ...process.env, ...config.env },
    stdio: 'pipe',
  };

  const child = spawn('cargo-philjs', ['watch'], spawnOptions);

  child.stdout?.on('data', (data) => {
    const output = data.toString();
    if (options.onChange) {
      options.onChange({
        code: 0,
        stdout: output,
        stderr: '',
        success: true,
      });
    }
  });

  child.stderr?.on('data', (data) => {
    const output = data.toString();
    if (options.onError) {
      options.onError(new Error(output));
    }
  });

  return child;
}

/**
 * Check if cargo-philjs is installed
 */
export async function isInstalled(): Promise<boolean> {
  try {
    const result = await runCargoPhiljs(['--version'], { timeout: 5000 });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Get cargo-philjs version
 */
export async function getVersion(): Promise<string | null> {
  try {
    const result = await runCargoPhiljs(['--version'], { timeout: 5000 });
    if (result.success) {
      return result.stdout.trim();
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Project Templates
// ============================================================================

export const TEMPLATES = {
  /** Default PhilJS project template */
  default: 'default',
  /** Minimal template with just essentials */
  minimal: 'minimal',
  /** Full-featured template with all integrations */
  full: 'full',
  /** Library template for creating packages */
  library: 'library',
  /** CLI application template */
  cli: 'cli',
  /** Web application template */
  web: 'web',
  /** Native application template */
  native: 'native',
  /** WASM module template */
  wasm: 'wasm',
} as const;

export type TemplateName = (typeof TEMPLATES)[keyof typeof TEMPLATES];

// ============================================================================
// Target Platforms
// ============================================================================

export const TARGETS = {
  /** WebAssembly target */
  wasm32: 'wasm32-unknown-unknown',
  /** WebAssembly with WASI */
  wasi: 'wasm32-wasi',
  /** Linux x86_64 */
  linuxX64: 'x86_64-unknown-linux-gnu',
  /** macOS x86_64 */
  macosX64: 'x86_64-apple-darwin',
  /** macOS ARM64 */
  macosArm64: 'aarch64-apple-darwin',
  /** Windows x86_64 */
  windowsX64: 'x86_64-pc-windows-msvc',
} as const;

export type TargetTriple = (typeof TARGETS)[keyof typeof TARGETS];
