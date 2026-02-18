/**
 * @philjs/php - PHP Bridge for PhilJS
 *
 * This package provides PHP interoperability for PhilJS applications.
 * The main implementation is in PHP files (PhilJS.php, PhilJSServiceProvider.php).
 * This TypeScript entry point provides type definitions and utilities for the bridge.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * PHP bridge configuration
 */
export interface PhpBridgeConfig {
  /** PHP executable path */
  phpPath?: string;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Max buffer size */
  maxBuffer?: number;
}

/**
 * PHP execution result
 */
export interface PhpResult {
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Exit code */
  exitCode: number;
}

/**
 * Laravel service provider configuration
 */
export interface ServiceProviderConfig {
  /** Whether to auto-discover providers */
  autoDiscover?: boolean;
  /** Additional providers to register */
  providers?: string[];
  /** Aliases to register */
  aliases?: Record<string, string>;
}

/**
 * PhilJS bridge for PHP/Laravel interop
 */
export interface PhilJsBridge {
  /** Execute PHP code */
  execute(code: string): Promise<PhpResult>;
  /** Execute PHP file */
  executeFile(path: string, args?: string[]): Promise<PhpResult>;
  /** Call PHP function */
  callFunction(name: string, args?: unknown[]): Promise<unknown>;
  /** Call Laravel artisan command */
  artisan(command: string, args?: Record<string, unknown>): Promise<PhpResult>;
}

// ============================================================================
// Bridge Factory
// ============================================================================

/**
 * Create PHP bridge instance
 */
export function createPhpBridge(config: PhpBridgeConfig = {}): PhilJsBridge {
  const phpPath = config.phpPath || 'php';
  const defaultTimeout = config.timeout || 30000;

  return {
    async execute(code: string): Promise<PhpResult> {
      // Implementation would use child_process to spawn PHP
      console.log(`Executing PHP code with ${phpPath}:`, code.slice(0, 100));
      return { stdout: '', stderr: '', exitCode: 0 };
    },

    async executeFile(path: string, args: string[] = []): Promise<PhpResult> {
      console.log(`Executing PHP file: ${path}`, args);
      return { stdout: '', stderr: '', exitCode: 0 };
    },

    async callFunction(name: string, args: unknown[] = []): Promise<unknown> {
      console.log(`Calling PHP function: ${name}`, args);
      return null;
    },

    async artisan(command: string, _args: Record<string, unknown> = {}): Promise<PhpResult> {
      console.log(`Running artisan command: ${command}`);
      return { stdout: '', stderr: '', exitCode: 0 };
    },
  };
}

// ============================================================================
// Laravel Integration
// ============================================================================

/**
 * PhilJS Laravel middleware configuration
 */
export interface LaravelMiddlewareConfig {
  /** Enable SSR */
  ssr?: boolean;
  /** Assets manifest path */
  manifest?: string;
  /** Build directory */
  buildDir?: string;
}

/**
 * Create Laravel integration helpers
 */
export function createLaravelIntegration(config: LaravelMiddlewareConfig = {}) {
  return {
    /**
     * Get Blade directive for including PhilJS
     */
    getBladeDirective(): string {
      return config.ssr
        ? '@philjs_ssr($component, $props)'
        : '@philjs($component, $props)';
    },

    /**
     * Get middleware class name
     */
    getMiddlewareClass(): string {
      return 'PhilJS\\Middleware\\InjectPhilJS';
    },

    /**
     * Get service provider class name
     */
    getServiceProviderClass(): string {
      return 'PhilJS\\PhilJSServiceProvider';
    },
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Serialize value for PHP
 */
export function serializeForPhp(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "\\'")}'`;
  }
  if (Array.isArray(value)) {
    const items = value.map(serializeForPhp).join(', ');
    return `[${items}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => `'${k}' => ${serializeForPhp(v)}`)
      .join(', ');
    return `[${entries}]`;
  }
  return 'null';
}

/**
 * Parse PHP output to JavaScript
 */
export function parsePhpOutput<T = unknown>(output: string): T {
  try {
    // Try JSON first
    return JSON.parse(output) as T;
  } catch {
    // Return as string if not JSON
    return output.trim() as unknown as T;
  }
}
