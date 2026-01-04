#!/usr/bin/env node
/**
 * Rust Book → PhilJS Book Merger Agent
 * 
 * Merges the rust-book documentation into the philjs-book,
 * adding a "Rust Core" section with all the Rust-specific content.
 */

import * as fs from 'fs';
import * as path from 'path';

const RUST_BOOK_SRC = 'docs/rust-book/src';
const PHILJS_BOOK_SRC = 'docs/philjs-book/src';
const TARGET_DIR = 'rust-core';

interface MergeResult {
    copied: string[];
    skipped: string[];
    errors: string[];
}

/**
 * Copy a directory recursively
 */
function copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Update internal links in markdown files
 */
function updateLinks(content: string, prefix: string): string {
    // Update relative links to point to new location
    return content
        // Update internal links like [text](./something.md)
        .replace(/\]\(\.\//g, `](./${prefix}/`)
        // Update links that go up a level
        .replace(/\]\(\.\.\//g, `](./`)
        // Add note about Rust content
        .replace(/^(# .+)$/m, `$1\n\n> **Note:** This documentation covers the Rust/WASM implementation of PhilJS.\n`);
}

/**
 * Process markdown files to update links
 */
function processMarkdownFiles(dir: string, prefix: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            processMarkdownFiles(fullPath, prefix);
        } else if (entry.name.endsWith('.md')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const updated = updateLinks(content, prefix);
            fs.writeFileSync(fullPath, updated);
        }
    }
}

/**
 * Generate SUMMARY.md entries for the Rust section
 */
function generateRustSummarySection(): string {
    return `
# Rust Core

- [Rust Introduction](./rust-core/introduction.md)

## Getting Started (Rust)

- [Installation](./rust-core/getting-started/installation.md)
- [Hello World](./rust-core/getting-started/hello-world.md)
- [Project Structure](./rust-core/getting-started/project-structure.md)

## Core Concepts (Rust)

- [Components](./rust-core/core/components.md)
- [Signals](./rust-core/core/signals.md)
- [Effects](./rust-core/core/effects.md)
- [Memos](./rust-core/core/memos.md)
- [Props](./rust-core/core/props.md)
- [Events](./rust-core/core/events.md)

## Rendering (Rust)

- [JSX/RSX](./rust-core/rendering/jsx-rsx.md)
- [Conditional Rendering](./rust-core/rendering/conditional.md)
- [Lists](./rust-core/rendering/lists.md)
- [Fragments](./rust-core/rendering/fragments.md)

## State Management (Rust)

- [Local State](./rust-core/state/local.md)
- [Context](./rust-core/state/context.md)
- [Stores](./rust-core/state/stores.md)

## Server Side (Rust)

- [SSR with Axum](./rust-core/server/axum.md)
- [SSR with Actix](./rust-core/server/actix.md)
- [Server Functions](./rust-core/server/functions.md)
- [Hydration](./rust-core/server/hydration.md)
- [Streaming](./rust-core/server/streaming.md)

## Advanced Rust

- [TypeScript Interop](./rust-core/advanced/typescript-interop.md)
- [WASM Optimization](./rust-core/advanced/wasm-optimization.md)
- [Testing](./rust-core/advanced/testing.md)
- [Debugging](./rust-core/advanced/debugging.md)

## Deployment (Rust)

- [Building for Production](./rust-core/deployment/building.md)
- [Deploying to Vercel](./rust-core/deployment/vercel.md)
- [Deploying to Cloudflare](./rust-core/deployment/cloudflare.md)

## Reference (Rust)

- [API Reference](./rust-core/reference/api.md)
- [Macros](./rust-core/reference/macros.md)
- [CLI](./rust-core/reference/cli.md)
`;
}

/**
 * Update the main SUMMARY.md to include Rust content
 */
function updateMainSummary(summaryPath: string): void {
    let content = fs.readFileSync(summaryPath, 'utf-8');

    // Check if Rust section already exists
    if (content.includes('# Rust Core')) {
        console.log('Rust Core section already exists in SUMMARY.md');
        return;
    }

    // Add Rust section before the last section or at the end
    const rustSection = generateRustSummarySection();

    // Find a good insertion point (before "Reference" or at end)
    const insertionPoint = content.lastIndexOf('\n# Reference');
    if (insertionPoint !== -1) {
        content = content.slice(0, insertionPoint) + rustSection + '\n' + content.slice(insertionPoint);
    } else {
        content = content + '\n' + rustSection;
    }

    fs.writeFileSync(summaryPath, content);
    console.log('Updated SUMMARY.md with Rust Core section');
}

/**
 * Main merge function
 */
async function mergeRustBook(): Promise<MergeResult> {
    const result: MergeResult = {
        copied: [],
        skipped: [],
        errors: [],
    };

    const targetDir = path.join(PHILJS_BOOK_SRC, TARGET_DIR);

    console.log('🔧 Starting Rust Book → PhilJS Book merge...\n');

    // Check if rust-book exists
    if (!fs.existsSync(RUST_BOOK_SRC)) {
        result.errors.push('Rust book source not found at ' + RUST_BOOK_SRC);
        return result;
    }

    // Check if target already exists
    if (fs.existsSync(targetDir)) {
        console.log(`⚠️  Target directory ${targetDir} already exists.`);
        console.log('   Removing old content and replacing...\n');
        fs.rmSync(targetDir, { recursive: true });
    }

    // Create target directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Copy all content from rust-book to philjs-book/rust-core
    const entries = fs.readdirSync(RUST_BOOK_SRC, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name === 'SUMMARY.md') {
            result.skipped.push(entry.name + ' (using custom section in main SUMMARY.md)');
            continue;
        }

        const srcPath = path.join(RUST_BOOK_SRC, entry.name);
        const destPath = path.join(targetDir, entry.name);

        try {
            if (entry.isDirectory()) {
                copyDirectory(srcPath, destPath);
                result.copied.push(entry.name + '/ (directory)');
            } else {
                fs.copyFileSync(srcPath, destPath);
                result.copied.push(entry.name);
            }
        } catch (error) {
            result.errors.push(`Failed to copy ${entry.name}: ${error}`);
        }
    }

    // Process markdown files to update internal links
    console.log('📝 Updating internal links in markdown files...');
    processMarkdownFiles(targetDir, TARGET_DIR);

    // Update the main SUMMARY.md
    const summaryPath = path.join(PHILJS_BOOK_SRC, 'SUMMARY.md');
    if (fs.existsSync(summaryPath)) {
        updateMainSummary(summaryPath);
    } else {
        result.errors.push('SUMMARY.md not found in philjs-book');
    }

    return result;
}

// Run the merge
mergeRustBook().then((result) => {
    console.log('\n✅ Merge complete!\n');

    console.log('📁 Copied:');
    result.copied.forEach((f) => console.log(`   ✓ ${f}`));

    if (result.skipped.length > 0) {
        console.log('\n⏭️  Skipped:');
        result.skipped.forEach((f) => console.log(`   - ${f}`));
    }

    if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach((e) => console.log(`   ! ${e}`));
    }

    console.log('\n📚 Rust documentation is now available in the PhilJS Book at:');
    console.log('   docs/philjs-book/src/rust-core/\n');
}).catch((error) => {
    console.error('Merge failed:', error);
    process.exit(1);
});
