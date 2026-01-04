# PhilJS (₱)

**The World's First Self-Healing, Universal Super-Framework.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](.)
[![Status](https://img.shields.io/badge/status-alpha-orange)](.)
[![License](https://img.shields.io/badge/license-MIT-blue)](.)
[![Packages](https://img.shields.io/badge/packages-90+-blue)](./packages)

PhilJS is not just another framework. It is a **unification engine** designed to solve the fragmentation of the JavaScript ecosystem. By combining the raw performance of **Rust/WASM**, the fine-grained reactivity of **Signals**, and a revolutionary **Self-Healing Runtime**, PhilJS allows you to build applications that are resilient, performant, and future-proof.

> **"The framework that thinks ahead."** — Now targeting 2026.

---

## 🚀 The 4 Pillars of PhilJS

We analyzed 140+ frameworks (React, Next.js, Vue, Solid, Qwik, etc.) to build the ultimate development platform. PhilJS introduces **42 Unique Innovations** organized into four pillars:

### 🛡️ 1. Self-Healing Runtime
**"The application that repairs itself."**
PhilJS acts as a supervisor for your application, wrapping components in a resilient membrane.
- **Circuit Breakers**: Automatically isolates crashing components (e.g., a Sidebar) so the rest of the app (the Feed) stays alive.
- **Predictive Failure Analysis**: AI heuristics running in the browser predict crashes *before* they happen (detecting memory leaks, infinite loops, or connection timeouts) and proactively restart components.
- **Hot-Patching**: Push logic fixes to specific component IDs in production without a full page reload.

### 🌐 2. Universal Component Protocol (UCP)
**"Write once, run everything."**
Stop rewriting your legacy code. PhilJS runs React, Vue, and Svelte components natively within the same tree.
- **Zero-Cost Abstraction**: Components from different frameworks communicate via a unified Bridge.
- **Incremental Migration**: slowly replace legacy React components with high-performance PhilJS signals one at a time.
- **Ecosystem Access**: Use a React date picker, a Vue chart, and a Svelte animation library in the same view.

### 🧠 3. Nexus Architecture
**"Local-First, AI-Native, Multiplayer."**
A unified data stack for the next generation of applications.
- **Local-First Sync**: Data lives on-device (IndexedDB/CRDTs) and syncs when online. No "loading spinners" ever.
- **AI-Native Primitives**: Built-in hooks for LLM streaming (`useAI()`), cost tracking, and "GenUI" (generative user interfaces).
- **Collaborative**: Real-time cursors, presence, and awareness out of the box.

### ⚡ 4. Rust-Powered Core
**"Native Performance."**
- **0ms Hydration**: Uses Resumability (inspired by Qwik) for instant interactivity.
- **Fine-Grained Signals**: Updates individual DOM nodes (like Solid), 10x faster than Virtual DOM.
- **WASM Acceleration**: Compute-heavy tasks (diffing, cryptography, image processing) run in WebAssembly via `philjs-rust`.

---

## 📦 The Ecosystem (90+ Packages)

PhilJS is a monorepo containing over 90 specialized packages, grouped by capability.

### **Core Runtime**
| Package | Description |
|:---|:---|
| `@philjs/core` | The reactive heart. Signals, Memos, Effects. |
| `@philjs/runtime` | The **Self-Healing** supervisor and Circuit Breaker logic. |
| `@philjs/compiler` | AOT compiler for auto-memoization and dead code elimination. |
| `@philjs/scheduler` | Priority-based task scheduling (UI vs Background). |

### **Universal Compatibility**
| Package | Description |
|:---|:---|
| `@philjs/universal` | The bridge protocol for alien components. |
| `@philjs/universal-react` | Run React 19+ components natively. |
| `@philjs/universal-vue` | Run Vue 3+ components natively. |
| `@philjs/compat` | Polyfills for legacy browser support. |

### **Data & Nexus**
| Package | Description |
|:---|:---|
| `@philjs/nexus` | The unified client: Local-First + Collab + AI. |
| `@philjs/collab` | CRDTs (Yjs compatible), operational transforms, awareness. |
| `@philjs/offline` | Sync engines, IndexedDB wrappers, offline queues. |
| `@philjs/graphql` | Zero-config GraphQL client with normalized caching. |

### **Artificial Intelligence**
| Package | Description |
|:---|:---|
| `@philjs/ai` | LLM providers (OpenAI, Anthropic), streaming hooks. |
| `@philjs/a11y-ai` | **Auto-fix accessibility** issues using vision models. |
| `@philjs/genui` | Protocol for AI-generated UI components. |
| `@philjs/intent` | Intent-based development ("Create a counter"). |

### **Rendering & Graphics**
| Package | Description |
|:---|:---|
| `@philjs/webgpu` | **GPU-accelerated** UI rendering and Compute Shaders. |
| `@philjs/three` | Reactive bindings for Three.js (3D). |
| `@philjs/islands` | Partial hydration architecture. |
| `@philjs/ssr` | streaming Server-Side Rendering. |

### **Cloud & Edge**
| Package | Description |
|:---|:---|
| `@philjs/edge` | Runtime for Cloudflare Workers / Deno. |
| `@philjs/serverless` | AWS Lambda / Vercel adapters. |
| `@philjs/carbon` | **Carbon-aware** task scheduling (run heavy tasks when grid is green). |
| `@philjs/security` | CSRF, XSS protection, and headers. |

### **Rust / Native**
| Package | Description |
|:---|:---|
| `philjs-rust` | The Rust core (WASM source). |
| `philjs-actix` | High-performance Rust web server integration. |

---

## 💻 Code Examples

### 1. Hello World (Signals)
```tsx
import { signal } from '@philjs/core';

export function Counter() {
  const count = signal(0);

  // Fine-grained: Only the text node updates.
  // The component function does NOT re-run.
  return (
    <button onClick={() => count.update(c => c + 1)}>
      Count is {count()}
    </button>
  );
}
```

### 2. Self-Healing Configuration
```tsx
import { useSelfHealing } from '@philjs/runtime';

export function RiskyWidget() {
  useSelfHealing({
    componentId: 'StockTicker',
    // If it crashes 3 times in 1 minute, show the Fallback UI
    // and stop trying to render it for 30s.
    circuitBreaker: {
      threshold: 3,
      timeout: 30000, 
      fallback: <ErrorBanner />
    }
  });

  return <ComplexChart />;
}
```

### 3. Nexus (Local-First + Collab)
```tsx
import { useNexusDocument, useNexusPresence } from '@philjs/nexus';

export function Editor({ docId }) {
  // Data load is instant (from local DB). Syncs in background.
  const { data, update } = useNexusDocument('notes', docId);
  const { users } = useNexusPresence();

  return (
    <div>
      <div className="avatars">
        {users.map(u => <Avatar user={u} />)}
      </div>
      <textarea 
        value={data.content}
        onChange={e => update({ content: e.target.value })}
      />
    </div>
  );
}
```

---

## 📊 Benchmarks

PhilJS is designed for speed. See full results in [`benchmarks/BENCHMARK_RESULTS.md`](./benchmarks/BENCHMARK_RESULTS.md).

| Metric | PhilJS (Rust Core) | React 19 | SolidJS |
|:---|:---|:---|:---|
| **Signal Updates** | **2.45B ops/sec** | N/A | ~40M ops/sec |
| **Hydration Cost** | **0ms** (Resumable) | ~50ms | ~5ms |
| **Bundle Size** | **3.2KB** (Core) | ~40KB | ~7KB |
| **SSR Throughput** | **46.6M ops/sec** | ~50k ops/sec | ~200k ops/sec |

> *Measured on: December 26, 2025 (Windows, Release build)*

---

## 📚 Documentation

The **PhilJS Book** is your bible for the framework.

*   **[Intro & Philosophy](./docs/philjs-book/src/getting-started/introduction.md)**
*   **Core Concepts**
    *   [Signals](./docs/philjs-book/src/core/signals.md)
    *   [Self-Healing Runtime](./docs/philjs-book/src/core/self-healing.md)
    *   [Universal Components](./docs/philjs-book/src/core/universal.md)
*   **Advanced Features**
    *   [Nexus Architecture](./docs/philjs-book/src/nexus/overview.md)
    *   [Predictive Prefetching AI](./docs/philjs-book/src/packages/ai/predictive.md)
    *   [Quantum Safe Crypto](./docs/philjs-book/src/packages/quantum/overview.md)
*   **[Full Table of Contents](./docs/philjs-book/src/SUMMARY.md)**

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js 24+ (Node 25 Recommended)
*   TypeScript 6.0+

### Installation
```bash
# Create a new project
pnpm create philjs my-super-app

# Select a template:
# > Blank
# > Nexus (Local-First + AI)
# > Universal (React migration)

cd my-super-app
pnpm install
pnpm dev
```

---

## 👥 Community & Status

**Current Status**: Alpha (v0.1.0)
We are actively recruiting for the Core Team.

*   **GitHub**: [github.com/philjs/philjs](https://github.com/philjs/philjs)
*   **Discord**: [discord.gg/philjs](https://discord.gg/philjs)
*   **Twitter**: [@philjs_framework](https://twitter.com/philjs_framework)

---

**PhilJS** — *The Framework That Thinks Ahead.*
© 2026 PhilJS Team. MIT License.
