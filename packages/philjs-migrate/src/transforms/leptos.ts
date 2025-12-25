/**
 * PhilJS Migrate - Leptos Transform
 *
 * Migration helpers for converting Leptos (Rust) code to PhilJS-Rust.
 * Both are Rust-based reactive frameworks with similar APIs.
 *
 * Key differences:
 * - Signal API: Leptos uses RwSignal, PhilJS uses Signal
 * - View macro: Leptos uses view!, PhilJS uses view!
 * - Server functions: Leptos uses #[server], PhilJS uses #[server]
 * - Components: Leptos uses #[component], PhilJS uses #[component]
 */

import type { MigrationWarning, ManualReviewItem } from '../migrate';

export interface TransformResult {
  code: string;
  transformed: boolean;
  warnings: Omit<MigrationWarning, 'file'>[];
  manualReview: Omit<ManualReviewItem, 'file'>[];
}

export interface LeptosPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
  description: string;
  needsReview: boolean;
}

export class LeptosTransform {
  private patterns: LeptosPattern[] = [
    // Signal patterns
    {
      name: 'create_signal',
      pattern: /let\s+\((\w+),\s*set_(\w+)\)\s*=\s*create_signal\(([^)]+)\)/g,
      replacement: 'let $1 = Signal::new($3)',
      description: 'Leptos create_signal returns (get, set) tuple. PhilJS Signal has both .get() and .set() on one type.',
      needsReview: false,
    },
    {
      name: 'create_rw_signal',
      pattern: /let\s+(\w+)\s*=\s*create_rw_signal\(([^)]+)\)/g,
      replacement: 'let $1 = Signal::new($2)',
      description: 'Leptos RwSignal maps directly to PhilJS Signal.',
      needsReview: false,
    },
    {
      name: 'create_memo',
      pattern: /let\s+(\w+)\s*=\s*create_memo\(\s*move\s*\|\s*_\s*\|\s*([^)]+)\)/g,
      replacement: 'let $1 = Memo::new(move || $2)',
      description: 'Leptos create_memo maps to PhilJS Memo::new.',
      needsReview: false,
    },
    {
      name: 'create_effect',
      pattern: /create_effect\(\s*move\s*\|/g,
      replacement: 'Effect::new(move |',
      description: 'Leptos create_effect maps to PhilJS Effect::new.',
      needsReview: false,
    },
    {
      name: 'create_resource',
      pattern: /create_resource\(\s*move\s*\|\|/g,
      replacement: 'Resource::new(move ||',
      description: 'Leptos create_resource maps to PhilJS Resource::new.',
      needsReview: true,
    },
    // View macro
    {
      name: 'view_macro',
      pattern: /view!\s*\{\s*cx,/g,
      replacement: 'view! {',
      description: 'PhilJS view! macro does not require cx parameter.',
      needsReview: false,
    },
    // Component attribute
    {
      name: 'component_attr',
      pattern: /#\[component\]\s*pub\s+fn\s+(\w+)\(\s*cx:\s*Scope/g,
      replacement: '#[component]\npub fn $1(',
      description: 'PhilJS components do not take cx: Scope parameter.',
      needsReview: true,
    },
    // Server functions
    {
      name: 'server_fn',
      pattern: /#\[server\((\w+),\s*["']([^"']+)["']\)\]/g,
      replacement: '#[server]',
      description: 'PhilJS #[server] does not require explicit path - it is derived from function name.',
      needsReview: false,
    },
    // Router
    {
      name: 'leptos_router',
      pattern: /use\s+leptos_router::\*/g,
      replacement: 'use philjs::router::*',
      description: 'PhilJS router has similar API to Leptos router.',
      needsReview: true,
    },
  ];

  async transform(code: string, filename: string): Promise<TransformResult> {
    const result: TransformResult = {
      code,
      transformed: false,
      warnings: [],
      manualReview: [],
    };

    if (!this.isLeptosFile(code)) {
      return result;
    }

    let transformedCode = code;

    // Transform use statements
    transformedCode = this.transformImports(transformedCode, result);

    // Apply patterns
    for (const pattern of this.patterns) {
      const matches = transformedCode.match(pattern.pattern);
      if (matches) {
        transformedCode = transformedCode.replace(pattern.pattern, pattern.replacement);

        if (pattern.needsReview) {
          result.manualReview.push({
            line: 0,
            type: pattern.name,
            description: pattern.description,
            originalCode: matches[0],
          });
        } else {
          result.warnings.push({
            message: pattern.description,
          });
        }
      }
    }

    // Transform signal access patterns
    transformedCode = this.transformSignalAccess(transformedCode, result);

    // Transform provide/use context
    transformedCode = this.transformContext(transformedCode, result);

    result.code = transformedCode;
    result.transformed = transformedCode !== code;

    return result;
  }

  private isLeptosFile(code: string): boolean {
    return code.includes('leptos::') || code.includes('use leptos');
  }

  private transformImports(code: string, result: TransformResult): string {
    let transformed = code;

    // Main leptos import
    transformed = transformed.replace(
      /use\s+leptos::\*;/g,
      'use philjs::prelude::*;'
    );

    transformed = transformed.replace(
      /use\s+leptos::\{([^}]+)\};/g,
      (match, imports) => {
        const importList = imports.split(',').map((s: string) => s.trim());
        const mapping: Record<string, string> = {
          component: 'component',
          view: 'view',
          Signal: 'Signal',
          RwSignal: 'Signal',
          ReadSignal: 'ReadSignal',
          WriteSignal: 'WriteSignal',
          create_signal: 'Signal::new',
          create_rw_signal: 'Signal::new',
          create_memo: 'Memo::new',
          create_effect: 'Effect::new',
          create_resource: 'Resource::new',
          Scope: '',
          IntoView: 'IntoView',
          Children: 'Children',
          provide_context: 'provide_context',
          use_context: 'use_context',
        };

        const philjsImports: string[] = [];
        for (const imp of importList) {
          const mapped = mapping[imp];
          if (mapped && !philjsImports.includes(mapped)) {
            philjsImports.push(mapped);
          }
        }

        if (philjsImports.length === 0) {
          return 'use philjs::prelude::*;';
        }

        return `use philjs::prelude::{${philjsImports.join(', ')}};`;
      }
    );

    // Leptos router
    transformed = transformed.replace(
      /use\s+leptos_router::\{([^}]+)\};/g,
      (match, imports) => {
        result.warnings.push({
          message: 'Leptos router imports converted to PhilJS router.',
        });
        return `use philjs::router::{${imports}};`;
      }
    );

    return transformed;
  }

  private transformSignalAccess(code: string, result: TransformResult): string {
    let transformed = code;

    // Leptos uses .get() and .set() which is the same as PhilJS
    // But Leptos also has () shorthand which needs to become .get()

    // Pattern: signal() → signal.get() when used in expressions (tricky to detect)
    // We'll add a warning instead of trying to auto-transform

    if (code.includes('.get()') || code.includes('.set(')) {
      result.warnings.push({
        message: 'Signal access patterns (.get()/.set()) are similar between Leptos and PhilJS.',
      });
    }

    // Transform .update() pattern (same in both)
    // No transformation needed

    return transformed;
  }

  private transformContext(code: string, result: TransformResult): string {
    let transformed = code;

    // Leptos provide_context/use_context are similar to PhilJS
    // Just need to remove cx parameter
    transformed = transformed.replace(
      /provide_context\(\s*cx,\s*/g,
      'provide_context('
    );

    transformed = transformed.replace(
      /use_context::<([^>]+)>\(\s*cx\s*\)/g,
      'use_context::<$1>()'
    );

    return transformed;
  }

  /**
   * Get migration guide content for Leptos to PhilJS-Rust
   */
  static getMigrationGuide(): string {
    return `
# Leptos to PhilJS-Rust Migration Guide

## Overview

Both Leptos and PhilJS-Rust are Rust-based reactive UI frameworks with similar
signal-based reactivity. The migration is relatively straightforward.

## Key Differences

### 1. Signal API

\`\`\`rust
// Leptos
let (count, set_count) = create_signal(0);
let count_rw = create_rw_signal(0);

// PhilJS
let count = Signal::new(0);
// Or using macro
let count = signal!(0);
\`\`\`

### 2. View Macro

\`\`\`rust
// Leptos (requires cx)
view! { cx,
    <div>"Hello"</div>
}

// PhilJS (no cx needed)
view! {
    <div>"Hello"</div>
}
\`\`\`

### 3. Components

\`\`\`rust
// Leptos
#[component]
pub fn Counter(cx: Scope, initial: i32) -> impl IntoView {
    // ...
}

// PhilJS
#[component]
pub fn Counter(initial: i32) -> impl IntoView {
    // ...
}
\`\`\`

### 4. Server Functions

\`\`\`rust
// Leptos
#[server(GetUser, "/api")]
pub async fn get_user(id: u64) -> Result<User, ServerFnError> {
    // ...
}

// PhilJS
#[server]
pub async fn get_user(id: u64) -> ServerResult<User> {
    // ...
}
\`\`\`

## Step-by-Step Migration

1. Update Cargo.toml dependencies
2. Change use statements from leptos to philjs
3. Remove cx: Scope parameters
4. Update signal creation patterns
5. Review server function syntax
6. Test component rendering

## Common Patterns

| Leptos | PhilJS |
|--------|--------|
| create_signal(x) | Signal::new(x) |
| create_rw_signal(x) | Signal::new(x) |
| create_memo(\\|_\\| x) | Memo::new(\\|\\| x) |
| create_effect(\\|_\\| {}) | Effect::new(\\|\\| {}) |
| create_resource(\\|\\| async {}) | Resource::new(\\|\\| async {}) |
| provide_context(cx, x) | provide_context(x) |
| use_context::<T>(cx) | use_context::<T>() |
`;
  }
}

export { LeptosTransform as default };
