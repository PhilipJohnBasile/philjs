#!/usr/bin/env node
/**
 * PhilJS WASM CLI
 *
 * Command-line interface for Rust-to-JS code generation.
 *
 * Usage:
 *   philjs-wasm generate <rust-file> [options]
 *   philjs-wasm watch <dir> [options]
 *
 * Options:
 *   -o, --output <file>     Output file path (default: <input>.ts)
 *   -t, --typescript        Generate TypeScript types (default: true)
 *   -p, --philjs            Generate PhilJS component bindings (default: true)
 *   -s, --signals           Generate signal bindings (default: true)
 *   -v, --verbose           Verbose output
 *   -h, --help              Show help
 *   --version               Show version
 */
import { type CodegenResult } from './codegen.js';
interface ParsedArgs {
    command: 'generate' | 'watch' | 'help' | 'version';
    input?: string;
    output?: string;
    typescript: boolean;
    philjs: boolean;
    signals: boolean;
    verbose: boolean;
}
declare function parseArgs(args: string[]): ParsedArgs;
declare function showHelp(): void;
declare function showVersion(): void;
declare function generateCommand(args: ParsedArgs): CodegenResult;
declare function watchCommand(args: ParsedArgs): Promise<void>;
declare function main(): void;
export { main, generateCommand, watchCommand, parseArgs, showHelp, showVersion };
//# sourceMappingURL=cli.d.ts.map