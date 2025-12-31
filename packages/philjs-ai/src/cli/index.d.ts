#!/usr/bin/env node
/**
 * PhilJS AI CLI
 *
 * Command-line interface for AI-assisted development
 *
 * Commands:
 * - philjs-ai generate component "description"
 * - philjs-ai generate page "description" --path /route
 * - philjs-ai generate api "resource" --crud
 * - philjs-ai refactor ./src
 * - philjs-ai test ./src
 * - philjs-ai docs ./src
 * - philjs-ai review ./file.ts
 */
import { Command } from 'commander';
/**
 * Create the CLI program
 */
declare function createProgram(): Command;
export { createProgram };
//# sourceMappingURL=index.d.ts.map