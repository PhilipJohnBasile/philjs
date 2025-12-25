/**
 * PhilJS Migrate - Dioxus Transform
 *
 * Migration helpers for converting Dioxus (Rust) code to PhilJS-Rust.
 * Dioxus uses a React-like hooks API while PhilJS uses signals.
 *
 * Key differences:
 * - Hooks: Dioxus use_state/use_ref → PhilJS Signal
 * - View: Dioxus rsx! → PhilJS view!
 * - Components: Similar #[component] attribute
 * - Desktop/Mobile: Dioxus has native renderers
 */

import type { MigrationWarning, ManualReviewItem } from '../migrate';

export interface TransformResult {
  code: string;
  transformed: boolean;
  warnings: Omit<MigrationWarning, 'file'>[];
  manualReview: Omit<ManualReviewItem, 'file'>[];
}

export class DioxusTransform {
  async transform(code: string, filename: string): Promise<TransformResult> {
    const result: TransformResult = {
      code,
      transformed: false,
      warnings: [],
      manualReview: [],
    };

    if (!this.isDioxusFile(code)) {
      return result;
    }

    let transformedCode = code;

    // Transform imports
    transformedCode = this.transformImports(transformedCode, result);

    // Transform hooks to signals
    transformedCode = this.transformHooks(transformedCode, result);

    // Transform rsx! to view!
    transformedCode = this.transformRsx(transformedCode, result);

    // Transform components
    transformedCode = this.transformComponents(transformedCode, result);

    // Transform context
    transformedCode = this.transformContext(transformedCode, result);

    // Handle platform-specific code
    this.handlePlatformSpecific(code, result);

    result.code = transformedCode;
    result.transformed = transformedCode !== code;

    return result;
  }

  private isDioxusFile(code: string): boolean {
    return code.includes('dioxus::') || code.includes('use dioxus') || code.includes('rsx!');
  }

  private transformImports(code: string, result: TransformResult): string {
    let transformed = code;

    // Main dioxus import
    transformed = transformed.replace(
      /use\s+dioxus::prelude::\*;/g,
      'use philjs::prelude::*;'
    );

    transformed = transformed.replace(
      /use\s+dioxus::\{([^}]+)\};/g,
      (match, imports) => {
        const mapping: Record<string, string> = {
          'prelude::*': 'prelude::*',
          'Element': 'Element',
          'Props': '',
          'use_state': 'Signal::new',
          'use_ref': 'Signal::new',
          'use_memo': 'Memo::new',
          'use_effect': 'Effect::new',
          'use_context': 'use_context',
          'use_context_provider': 'provide_context',
          'use_coroutine': 'Resource::new',
          'Scope': '',
          'ScopeState': '',
        };

        const philjsImports: string[] = [];
        const importList = imports.split(',').map((s: string) => s.trim());

        for (const imp of importList) {
          const mapped = mapping[imp];
          if (mapped && !philjsImports.includes(mapped)) {
            philjsImports.push(mapped);
          }
        }

        if (philjsImports.length === 0) {
          return 'use philjs::prelude::*;';
        }

        return `use philjs::{${philjsImports.join(', ')}};`;
      }
    );

    // Dioxus router
    transformed = transformed.replace(
      /use\s+dioxus_router::\{([^}]+)\};/g,
      (match, imports) => {
        result.warnings.push({
          message: 'Dioxus router imports converted to PhilJS router.',
        });
        return `use philjs::router::{${imports}};`;
      }
    );

    // Platform-specific
    if (code.includes('dioxus_desktop') || code.includes('dioxus_mobile')) {
      result.manualReview.push({
        line: 1,
        type: 'platform',
        description: 'Dioxus desktop/mobile imports detected. PhilJS-Rust focuses on WASM/SSR. Consider using philjs-axum for server-side or WASM for browser.',
        originalCode: 'dioxus_desktop/mobile',
      });
    }

    return transformed;
  }

  private transformHooks(code: string, result: TransformResult): string {
    let transformed = code;

    // use_state → Signal
    transformed = transformed.replace(
      /let\s+(\w+)\s*=\s*use_state\(\s*(?:cx,\s*)?\|\|\s*([^)]+)\)/g,
      (match, name, initialValue) => {
        result.warnings.push({
          message: `use_state '${name}' converted to Signal. Use .get() and .set() instead of get()/set().`,
        });
        return `let ${name} = Signal::new(${initialValue})`;
      }
    );

    // use_state with explicit cx
    transformed = transformed.replace(
      /let\s+(\w+)\s*=\s*use_state\(&cx,\s*\|\|\s*([^)]+)\)/g,
      (match, name, initialValue) => {
        return `let ${name} = Signal::new(${initialValue})`;
      }
    );

    // use_ref → Signal (for mutable references)
    transformed = transformed.replace(
      /let\s+(\w+)\s*=\s*use_ref\(\s*(?:cx,\s*)?\|\|\s*([^)]+)\)/g,
      (match, name, initialValue) => {
        result.warnings.push({
          message: `use_ref '${name}' converted to Signal. PhilJS signals work for both reactive values and refs.`,
        });
        return `let ${name} = Signal::new(${initialValue})`;
      }
    );

    // use_memo → Memo
    transformed = transformed.replace(
      /let\s+(\w+)\s*=\s*use_memo\(\s*(?:cx,\s*)?\|[^|]*\|\s*([^)]+)\)/g,
      (match, name, expression) => {
        return `let ${name} = Memo::new(|| ${expression})`;
      }
    );

    // use_effect → Effect
    transformed = transformed.replace(
      /use_effect\(\s*(?:cx,\s*)?\|[^|]*\|\s*\{/g,
      (match) => {
        result.warnings.push({
          message: 'use_effect converted to Effect::new. PhilJS effects auto-track dependencies.',
        });
        return 'Effect::new(|| {';
      }
    );

    // use_coroutine → Resource (for async)
    transformed = transformed.replace(
      /let\s+(\w+)\s*=\s*use_coroutine\(/g,
      (match, name) => {
        result.manualReview.push({
          line: this.getLineNumber(code, match),
          type: 'coroutine',
          description: 'use_coroutine converted to Resource. Review async patterns.',
          originalCode: match,
        });
        return `let ${name} = Resource::new(`;
      }
    );

    // use_future → Resource
    transformed = transformed.replace(
      /let\s+(\w+)\s*=\s*use_future\(\s*(?:cx,\s*)?\|\|/g,
      (match, name) => {
        result.warnings.push({
          message: 'use_future converted to Resource::new.',
        });
        return `let ${name} = Resource::new(||`;
      }
    );

    return transformed;
  }

  private transformRsx(code: string, result: TransformResult): string {
    let transformed = code;

    // rsx! → view!
    // The syntax is similar but has some differences
    transformed = transformed.replace(
      /rsx!\s*\{/g,
      (match) => {
        result.warnings.push({
          message: 'rsx! macro converted to view!. Syntax is similar but review attribute binding.',
        });
        return 'view! {';
      }
    );

    // Dioxus uses lowercase event handlers, PhilJS uses on:event
    // onclick → on:click
    if (code.includes('onclick=') || code.includes('oninput=')) {
      result.manualReview.push({
        line: 1,
        type: 'events',
        description: 'Dioxus uses onclick, oninput etc. PhilJS uses on:click, on:input. Review event handlers.',
        originalCode: 'onclick/oninput/etc.',
        suggestedCode: 'on:click, on:input, etc.',
      });
    }

    // Dioxus attribute syntax: attr: "value" → attr="value"
    // This is hard to auto-transform in the general case
    if (code.includes(': "') || code.includes(": '")) {
      result.warnings.push({
        message: 'Dioxus uses attr: "value" syntax. PhilJS uses attr="value". Review attribute syntax.',
      });
    }

    return transformed;
  }

  private transformComponents(code: string, result: TransformResult): string {
    let transformed = code;

    // Dioxus component with Scope
    transformed = transformed.replace(
      /pub\s+fn\s+(\w+)\(\s*cx:\s*Scope(?:<[^>]*>)?\s*\)\s*->\s*Element/g,
      (match, name) => {
        result.warnings.push({
          message: `Component '${name}' Scope parameter removed. PhilJS uses implicit context.`,
        });
        return `pub fn ${name}() -> impl IntoView`;
      }
    );

    // Component with props
    transformed = transformed.replace(
      /pub\s+fn\s+(\w+)\(\s*cx:\s*Scope(?:<[^>]*>)?,\s*([^)]+)\)\s*->\s*Element/g,
      (match, name, props) => {
        return `pub fn ${name}(${props}) -> impl IntoView`;
      }
    );

    // #[inline_props] → Props struct
    if (code.includes('#[inline_props]')) {
      result.warnings.push({
        message: '#[inline_props] pattern works similarly in PhilJS. Props are passed directly.',
      });
    }

    return transformed;
  }

  private transformContext(code: string, result: TransformResult): string {
    let transformed = code;

    // use_context_provider → provide_context
    transformed = transformed.replace(
      /use_context_provider\(\s*(?:cx,\s*)?\|\|\s*([^)]+)\)/g,
      'provide_context($1)'
    );

    // use_context → use_context (same in PhilJS, just remove cx)
    transformed = transformed.replace(
      /use_context::<([^>]+)>\(\s*cx\s*\)/g,
      'use_context::<$1>()'
    );

    return transformed;
  }

  private handlePlatformSpecific(code: string, result: TransformResult): void {
    // Desktop-specific
    if (code.includes('dioxus_desktop::')) {
      result.manualReview.push({
        line: 1,
        type: 'desktop',
        description: 'Dioxus desktop code detected. PhilJS-Rust is primarily for WASM/SSR. For desktop, consider:\n' +
          '1. Using WASM with a webview wrapper (Tauri)\n' +
          '2. Using philjs-liveview for server-driven UI\n' +
          '3. Keeping Dioxus for desktop-specific features',
        originalCode: 'dioxus_desktop',
      });
    }

    // Mobile-specific
    if (code.includes('dioxus_mobile::')) {
      result.manualReview.push({
        line: 1,
        type: 'mobile',
        description: 'Dioxus mobile code detected. PhilJS-Rust focuses on web. For mobile, consider:\n' +
          '1. Using WASM with Capacitor/Ionic\n' +
          '2. Using philjs-liveview for server-driven mobile UI\n' +
          '3. Keeping Dioxus for native mobile features',
        originalCode: 'dioxus_mobile',
      });
    }

    // LiveView
    if (code.includes('dioxus_liveview::')) {
      result.warnings.push({
        message: 'Dioxus LiveView detected. PhilJS has philjs-liveview with similar patterns.',
      });
    }
  }

  private getLineNumber(code: string, match: string): number {
    const index = code.indexOf(match);
    if (index === -1) return 0;
    return code.substring(0, index).split('\n').length;
  }

  /**
   * Get migration guide content for Dioxus to PhilJS-Rust
   */
  static getMigrationGuide(): string {
    return `
# Dioxus to PhilJS-Rust Migration Guide

## Overview

Dioxus uses a React-like hooks API while PhilJS uses SolidJS-style signals.
The migration requires understanding these different mental models.

## Key Differences

### 1. State Management

\`\`\`rust
// Dioxus
let count = use_state(cx, || 0);
// Read: *count.get() or count.current()
// Write: count.set(5) or count.modify(|n| n + 1)

// PhilJS
let count = Signal::new(0);
// Or with macro: let count = signal!(0);
// Read: count.get()
// Write: count.set(5) or count.update(|n| *n += 1)
\`\`\`

### 2. View Macro

\`\`\`rust
// Dioxus (rsx!)
rsx! {
    div {
        class: "container",
        onclick: move |_| count.set(count + 1),
        "Count: {count}"
    }
}

// PhilJS (view!)
view! {
    <div class="container" on:click=move |_| count.set(count.get() + 1)>
        "Count: " {count}
    </div>
}
\`\`\`

### 3. Components

\`\`\`rust
// Dioxus
pub fn Counter(cx: Scope, initial: i32) -> Element {
    let count = use_state(cx, || initial);
    rsx! { /* ... */ }
}

// PhilJS
#[component]
pub fn Counter(initial: i32) -> impl IntoView {
    let count = signal!(initial);
    view! { /* ... */ }
}
\`\`\`

### 4. Effects

\`\`\`rust
// Dioxus
use_effect(cx, (count,), |(count,)| {
    println!("Count changed: {count}");
});

// PhilJS (auto-tracks dependencies)
Effect::new(|| {
    println!("Count changed: {}", count.get());
});
\`\`\`

### 5. Async Data

\`\`\`rust
// Dioxus
let user = use_future(cx, (), |_| async move {
    fetch_user(id).await
});

// PhilJS
let user = Resource::new(|| async move {
    fetch_user(id).await
});
\`\`\`

## Platform Considerations

### Desktop/Mobile

Dioxus has native desktop and mobile renderers. PhilJS focuses on:
- **WASM** - Browser deployment with optimized bundle size
- **SSR** - Server-side rendering with hydration
- **LiveView** - Server-driven UI over WebSocket

For desktop apps, consider:
1. **Tauri + PhilJS WASM** - Native wrapper with web UI
2. **PhilJS LiveView** - Server-driven desktop UI
3. **Keep Dioxus** - For truly native desktop features

### LiveView

Both frameworks support LiveView patterns:

\`\`\`rust
// PhilJS LiveView
impl LiveView for Counter {
    fn mount(&mut self, socket: &mut LiveSocket) {
        // Initialize
    }

    fn handle_event(&mut self, event: &LiveEvent, socket: &mut LiveSocket) {
        // Handle events
    }

    fn render(&self) -> String {
        // Return HTML
    }
}
\`\`\`

## Step-by-Step Migration

1. **Update Cargo.toml**
   - Replace dioxus with philjs
   - Update feature flags

2. **Change imports**
   - dioxus::prelude::* → philjs::prelude::*

3. **Convert hooks to signals**
   - use_state → Signal::new
   - use_memo → Memo::new
   - use_effect → Effect::new
   - use_future → Resource::new

4. **Update component signatures**
   - Remove cx: Scope parameter
   - Change Element return to impl IntoView

5. **Convert rsx! to view!**
   - Update attribute syntax
   - Update event handlers (on:click)

6. **Handle platform-specific code**
   - Decide on strategy for desktop/mobile

## Common Patterns

| Dioxus | PhilJS |
|--------|--------|
| use_state(cx, \\|\\| x) | Signal::new(x) |
| use_ref(cx, \\|\\| x) | Signal::new(x) |
| use_memo(cx, (deps,), \\|_\\| x) | Memo::new(\\|\\| x) |
| use_effect(cx, (deps,), \\|_\\| {}) | Effect::new(\\|\\| {}) |
| use_future(cx, \\|\\| async {}) | Resource::new(\\|\\| async {}) |
| use_context_provider(cx, \\|\\| x) | provide_context(x) |
| use_context::<T>(cx) | use_context::<T>() |
| rsx! { } | view! { } |
`;
  }
}

export { DioxusTransform as default };
