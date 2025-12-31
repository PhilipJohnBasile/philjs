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
import { readFileSync, writeFileSync, existsSync, statSync, watch as fsWatch } from 'fs';
import { resolve, dirname, basename, extname, join } from 'path';
import { generateBindings } from './codegen.js';
function parseArgs(args) {
    const parsed = {
        command: 'help',
        typescript: true,
        philjs: true,
        signals: true,
        verbose: false
    };
    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        // Commands
        if (arg === 'generate' || arg === 'gen' || arg === 'g') {
            parsed.command = 'generate';
            if (args[i + 1] && !args[i + 1].startsWith('-')) {
                const value = args[++i];
                if (value !== undefined)
                    parsed.input = value;
            }
        }
        else if (arg === 'watch' || arg === 'w') {
            parsed.command = 'watch';
            if (args[i + 1] && !args[i + 1].startsWith('-')) {
                const value = args[++i];
                if (value !== undefined)
                    parsed.input = value;
            }
        }
        else if (arg === 'help' || arg === '-h' || arg === '--help') {
            parsed.command = 'help';
        }
        else if (arg === 'version' || arg === '-V' || arg === '--version') {
            parsed.command = 'version';
        }
        // Options
        else if (arg === '-o' || arg === '--output') {
            const value = args[++i];
            if (value !== undefined)
                parsed.output = value;
        }
        else if (arg === '-t' || arg === '--typescript') {
            parsed.typescript = true;
        }
        else if (arg === '--no-typescript') {
            parsed.typescript = false;
        }
        else if (arg === '-p' || arg === '--philjs') {
            parsed.philjs = true;
        }
        else if (arg === '--no-philjs') {
            parsed.philjs = false;
        }
        else if (arg === '-s' || arg === '--signals') {
            parsed.signals = true;
        }
        else if (arg === '--no-signals') {
            parsed.signals = false;
        }
        else if (arg === '-v' || arg === '--verbose') {
            parsed.verbose = true;
        }
        // Input file (if not already set)
        else if (!parsed.input && arg && !arg.startsWith('-')) {
            parsed.input = arg;
        }
        i++;
    }
    return parsed;
}
// ============================================================================
// Help and Version
// ============================================================================
const VERSION = '2.0.0';
function showHelp() {
    console.log(`
PhilJS WASM Code Generator v${VERSION}

Generate JavaScript/TypeScript bindings from Rust source files.

USAGE:
  philjs-wasm <command> [options]

COMMANDS:
  generate, gen, g <file>  Generate bindings from a Rust file
  watch, w <dir>           Watch directory and regenerate on changes
  help                     Show this help message
  version                  Show version

OPTIONS:
  -o, --output <file>      Output file path (default: <input>.ts)
  -t, --typescript         Generate TypeScript types (default: true)
      --no-typescript      Disable TypeScript type generation
  -p, --philjs             Generate PhilJS component bindings (default: true)
      --no-philjs          Disable PhilJS component bindings
  -s, --signals            Generate signal bindings (default: true)
      --no-signals         Disable signal bindings
  -v, --verbose            Verbose output
  -h, --help               Show this help message
  -V, --version            Show version

EXAMPLES:
  # Generate bindings from a Rust file
  philjs-wasm generate src/lib.rs

  # Generate bindings with custom output
  philjs-wasm generate src/lib.rs -o src/bindings.ts

  # Watch directory for changes
  philjs-wasm watch src/rust

  # Generate without PhilJS component bindings
  philjs-wasm generate src/lib.rs --no-philjs

  # Verbose output
  philjs-wasm generate src/lib.rs -v
`);
}
function showVersion() {
    console.log(`philjs-wasm v${VERSION}`);
}
// ============================================================================
// File Operations
// ============================================================================
function readRustFile(filePath) {
    try {
        const fullPath = resolve(process.cwd(), filePath);
        if (!existsSync(fullPath)) {
            console.error(`Error: File not found: ${fullPath}`);
            return null;
        }
        return readFileSync(fullPath, 'utf-8');
    }
    catch (err) {
        console.error(`Error reading file: ${err}`);
        return null;
    }
}
function writeOutputFile(filePath, content) {
    try {
        const fullPath = resolve(process.cwd(), filePath);
        writeFileSync(fullPath, content, 'utf-8');
        return true;
    }
    catch (err) {
        console.error(`Error writing file: ${err}`);
        return false;
    }
}
function getOutputPath(inputPath, specifiedOutput) {
    if (specifiedOutput) {
        return specifiedOutput;
    }
    const dir = dirname(inputPath);
    const name = basename(inputPath, extname(inputPath));
    return join(dir, `${name}.ts`);
}
// ============================================================================
// Generate Command
// ============================================================================
function generateCommand(args) {
    if (!args.input) {
        console.error('Error: No input file specified');
        console.log('Usage: philjs-wasm generate <rust-file>');
        return { success: false, error: 'No input file specified' };
    }
    const inputPath = resolve(process.cwd(), args.input);
    if (args.verbose) {
        console.log(`Reading: ${inputPath}`);
    }
    const rustCode = readRustFile(args.input);
    if (!rustCode) {
        return { success: false, error: 'Failed to read input file' };
    }
    if (args.verbose) {
        console.log(`Parsing Rust module...`);
    }
    try {
        const code = generateBindings(rustCode, {
            typescript: args.typescript,
            philjs: args.philjs,
            signals: args.signals,
            jsdoc: true
        });
        const outputPath = getOutputPath(args.input, args.output);
        if (args.verbose) {
            console.log(`Writing: ${outputPath}`);
        }
        if (writeOutputFile(outputPath, code)) {
            console.log(`Generated: ${outputPath}`);
            // Count stats
            const stats = {
                functions: (code.match(/export function/g) || []).length,
                structs: (code.match(/export interface/g) || []).length,
                enums: (code.match(/export type .+ =/g) || []).length,
                typeAliases: 0
            };
            if (args.verbose) {
                console.log(`  Functions: ${stats.functions}`);
                console.log(`  Interfaces: ${stats.structs}`);
                console.log(`  Types: ${stats.enums}`);
            }
            return {
                success: true,
                outputPath,
                code,
                stats
            };
        }
        else {
            return { success: false, error: 'Failed to write output file' };
        }
    }
    catch (err) {
        console.error(`Error generating bindings: ${err}`);
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}
// ============================================================================
// Watch Command
// ============================================================================
async function watchCommand(args) {
    if (!args.input) {
        console.error('Error: No directory specified');
        console.log('Usage: philjs-wasm watch <dir>');
        return;
    }
    const watchDir = resolve(process.cwd(), args.input);
    if (!existsSync(watchDir)) {
        console.error(`Error: Directory not found: ${watchDir}`);
        return;
    }
    const stat = statSync(watchDir);
    if (!stat.isDirectory()) {
        console.error(`Error: Not a directory: ${watchDir}`);
        return;
    }
    console.log(`Watching: ${watchDir}`);
    console.log('Press Ctrl+C to stop\n');
    // Track debounce timers
    const debounceTimers = new Map();
    // Generate bindings for a file
    function generateForFile(filePath) {
        if (!filePath.endsWith('.rs'))
            return;
        const relativePath = filePath.replace(watchDir, '').replace(/^[/\\]/, '');
        console.log(`Changed: ${relativePath}`);
        const result = generateCommand({
            ...args,
            command: 'generate',
            input: filePath
        });
        if (result.success) {
            console.log(`Updated: ${result.outputPath}\n`);
        }
    }
    // Watch for file changes
    try {
        fsWatch(watchDir, { recursive: true }, (eventType, filename) => {
            if (!filename || !filename.endsWith('.rs'))
                return;
            const filePath = join(watchDir, filename);
            // Debounce rapid changes
            const existing = debounceTimers.get(filePath);
            if (existing) {
                clearTimeout(existing);
            }
            debounceTimers.set(filePath, setTimeout(() => {
                debounceTimers.delete(filePath);
                if (existsSync(filePath)) {
                    generateForFile(filePath);
                }
            }, 100));
        });
        // Initial generation for all .rs files
        const fs = await import('fs');
        function scanDir(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                if (entry.isDirectory()) {
                    scanDir(fullPath);
                }
                else if (entry.name.endsWith('.rs')) {
                    generateForFile(fullPath);
                }
            }
        }
        scanDir(watchDir);
    }
    catch (err) {
        console.error(`Error setting up watch: ${err}`);
    }
}
// ============================================================================
// Main Entry Point
// ============================================================================
function main() {
    // Get command line args (skip node and script path)
    const args = process.argv.slice(2);
    if (args.length === 0) {
        showHelp();
        return;
    }
    const parsed = parseArgs(args);
    switch (parsed.command) {
        case 'generate':
            generateCommand(parsed);
            break;
        case 'watch':
            watchCommand(parsed);
            break;
        case 'version':
            showVersion();
            break;
        case 'help':
        default:
            showHelp();
            break;
    }
}
// Run if executed directly
main();
// Export for programmatic use
export { main, generateCommand, watchCommand, parseArgs, showHelp, showVersion };
//# sourceMappingURL=cli.js.map