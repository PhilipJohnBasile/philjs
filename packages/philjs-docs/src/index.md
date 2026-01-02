---
layout: home

hero:
  name: PhilJS
  text: The Universal UI Framework
  tagline: JavaScript + Rust, One Codebase. Fine-grained reactivity, resumable SSR, and blazing performance.
  image:
    src: /logo.svg
    alt: PhilJS
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/PhilipJohnBasile/philjs
    - theme: alt
      text: Rust Guide
      link: /rust/introduction

features:
  - icon: ⚡
    title: Blazing Fast
    details: Fine-grained reactivity with signals. No virtual DOM diffing. 2.4B ops/sec signal updates.
  - icon: 🦀
    title: Rust + JavaScript
    details: Write components in TypeScript or Rust. Share reactive primitives across both languages.
  - icon: 🌊
    title: Streaming SSR
    details: Progressive rendering with Suspense boundaries. Partial Prerendering (PPR) support.
  - icon: 📦
    title: Tiny Bundle
    details: Core is only 3KB gzipped. Tree-shakable. No runtime overhead.
  - icon: 🔄
    title: Resumable
    details: Qwik-style resumability. Zero-hydration for instant interactivity.
  - icon: 🏝️
    title: Islands Architecture
    details: Partial hydration. Mix PhilJS with React, Vue, Svelte in one app.
  - icon: 🛠️
    title: Full Stack
    details: Server functions, loaders, actions. Type-safe from database to UI.
  - icon: 🤖
    title: AI-Powered
    details: Built-in code generation, refactoring, and test generation with AI.
---

## Quick Start

```bash
# Create a new project
npm create philjs@latest my-app

# Or add to existing project
npm install @philjs/core
```

```tsx
import { signal, effect } from '@philjs/core';

// Create reactive state
const count = signal(0);

// React to changes
effect(() => console.log('Count:', count()));

// Update state
count.set(count() + 1); // Logs: "Count: 1"
```

## Why PhilJS?

| Feature | PhilJS | React | SolidJS | Leptos |
|---------|--------|-------|---------|--------|
| Fine-grained reactivity | ✅ | ❌ | ✅ | ✅ |
| Rust support | ✅ | ❌ | ❌ | ✅ |
| JavaScript support | ✅ | ✅ | ✅ | ❌ |
| Resumability | ✅ | ❌ | ❌ | ❌ |
| Streaming SSR | ✅ | ✅ | ✅ | ✅ |
| Bundle size | 3KB | 40KB | 7KB | 50KB |
