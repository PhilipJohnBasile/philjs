# PhilJS Documentation

**Welcome to the comprehensive PhilJS documentation!**

PhilJS is a modern JavaScript framework featuring fine-grained reactivity, zero hydration, and industry-first intelligence features for building fast, modern web applications.

> Maintainers: see [`CONSOLIDATED_REFERENCE.md`](./CONSOLIDATED_REFERENCE.md) for a source-of-truth mapping between documentation and the current code exports.

## 📚 Documentation Sections

### [Getting Started](/docs/getting-started/)
Perfect for newcomers. Start here to learn PhilJS fundamentals.

- [Introduction](/docs/getting-started/introduction.md) - What is PhilJS?
- [Installation](/docs/getting-started/installation.md) - Get up and running
- [Quick Start](/docs/getting-started/quick-start.md) - Build your first app
- [Your First Component](/docs/getting-started/your-first-component.md) - Component basics
- [Tutorial: Tic-Tac-Toe](/docs/getting-started/tutorial-tic-tac-toe.md) - Complete game
- [Tutorial: Todo App](/docs/getting-started/tutorial-todo-app.md) - Full CRUD app
- [Tutorial: Static Blog](/docs/getting-started/tutorial-blog-ssg.md) - SSG blog
- [Thinking in PhilJS](/docs/getting-started/thinking-in-philjs.md) - Mental models

### [Learn - Core Concepts](/docs/learn/)
Deep dive into PhilJS core concepts and features.

**Fundamentals:**
- [Components](/docs/learn/components.md)
- [Signals (Reactivity)](/docs/learn/signals.md)
- [Memos (Derived State)](/docs/learn/memos.md)
- [Effects (Side Effects)](/docs/learn/effects.md)
- [Context API](/docs/learn/context.md)

**UI Patterns:**
- [Conditional Rendering](/docs/learn/conditional-rendering.md)
- [Lists and Keys](/docs/learn/lists-and-keys.md)
- [Event Handling](/docs/learn/event-handling.md)
- [Refs and DOM](/docs/learn/refs.md)
- [Error Boundaries](/docs/learn/error-boundaries.md)

**Advanced Concepts:**
- [Lifecycle and Cleanup](/docs/learn/lifecycle.md)
- [TypeScript Integration](/docs/learn/typescript.md)
- [Performance Optimization](/docs/learn/performance.md)
- [Testing Components](/docs/learn/testing.md)
- [Styling Components](/docs/learn/styling.md)
- [Forms and Validation](/docs/learn/forms.md)
- [Animations](/docs/learn/animations.md)
- [Code Splitting](/docs/learn/code-splitting.md)
- [Server vs Client Code](/docs/learn/server-vs-client.md)
- [JSX Deep Dive](/docs/learn/jsx.md)

### [Routing](/docs/routing/)
File-based routing system with advanced features.

- [Routing Basics](/docs/routing/basics.md)
- [Dynamic Routes](/docs/routing/dynamic-routes.md)
- [Nested Routes](/docs/routing/nested-routes.md)
- [Navigation and Links](/docs/routing/navigation.md)
- [Route Parameters](/docs/routing/route-parameters.md)
- [Data Loading](/docs/routing/data-loading.md)
- [Route Guards](/docs/routing/route-guards.md)
- [Parallel Routes](/docs/routing/parallel-routes.md)
- [Intercepting Routes](/docs/routing/intercepting-routes.md)
- [View Transitions](/docs/routing/view-transitions.md)

### [Data Fetching](/docs/data-fetching/)
Powerful data layer with queries and mutations.

- [Overview](/docs/data-fetching/overview.md)
- [Queries](/docs/data-fetching/queries.md)
- [Mutations](/docs/data-fetching/mutations.md)
- [Loading States](/docs/data-fetching/loading-states.md)
- [Error Handling](/docs/data-fetching/error-handling.md)
- [Caching](/docs/data-fetching/caching.md)
- [Real-time Data](/docs/data-fetching/real-time.md)
- [Optimistic Updates](/docs/data-fetching/optimistic-updates.md)
- [Pagination](/docs/data-fetching/pagination.md)
- [Prefetching](/docs/data-fetching/prefetching.md)

### [Forms](/docs/forms/)
Complete form handling and validation.

- [Form Basics](/docs/forms/basics.md)
- [Validation](/docs/forms/validation.md)
- [Form Actions](/docs/forms/actions.md)
- [File Uploads](/docs/forms/file-uploads.md)
- [Multi-step Forms](/docs/forms/multi-step-forms.md)
- [Form Libraries](/docs/forms/form-libraries.md)
- [Accessibility](/docs/forms/accessibility.md)
- [Complex Forms](/docs/forms/complex-forms.md)

### [Styling](/docs/styling/)
All styling approaches supported.

- [Overview](/docs/styling/overview.md)
- [CSS Modules](/docs/styling/css-modules.md)
- [Inline Styles](/docs/styling/inline-styles.md)
- [Tailwind CSS](/docs/styling/tailwind.md)
- [CSS-in-JS](/docs/styling/css-in-js.md)
- [Animations](/docs/styling/animations.md)
- [Responsive Design](/docs/styling/responsive.md)
- [Theming](/docs/styling/theming.md)

### [Performance](/docs/performance/)
Optimization techniques and best practices.

- [Overview](/docs/performance/overview.md)
- [Bundle Size](/docs/performance/bundle-size.md)
- [Runtime Performance](/docs/performance/runtime.md)
- [Image Optimization](/docs/performance/images.md)
- [Code Splitting](/docs/performance/code-splitting.md)
- [Lazy Loading](/docs/performance/lazy-loading.md)
- [Memoization](/docs/performance/memoization.md)
- [Server-side](/docs/performance/server-side.md)
- [Performance Budgets](/docs/performance/budgets.md)
- [Web Vitals](/docs/performance/web-vitals.md)

### [Advanced Topics](/docs/advanced/)
Deep dives into advanced features.

- [Server-Side Rendering (SSR)](/docs/advanced/ssr.md)
- [Static Site Generation (SSG)](/docs/advanced/ssg.md)
- [Incremental Static Regeneration (ISR)](/docs/advanced/isr.md)
- [Islands Architecture](/docs/advanced/islands.md)
- [Resumability](/docs/advanced/resumability.md)
- [Middleware](/docs/advanced/middleware.md)
- [Internationalization (i18n)](/docs/advanced/i18n.md)
- [Authentication](/docs/advanced/auth.md)
- [Web Workers](/docs/advanced/web-workers.md)
- [WebAssembly](/docs/advanced/wasm.md)
- [Progressive Web Apps (PWA)](/docs/advanced/pwa.md)
- [SEO Optimization](/docs/advanced/seo.md)

### [API Reference](/docs/api/)
Complete API documentation.

- [Core APIs](/docs/api/core.md) - `philjs-core` package
- [Router APIs](/docs/api/router.md) - `philjs-router` package
- [Data APIs](/docs/api/data.md) - `philjs-core` package
- [CLI Commands](/docs/api/cli.md) - Command-line interface
- [Configuration](/docs/api/config.md) - philjs.config.ts

### [Framework Comparison](/docs/comparison.md)
How PhilJS compares to React, Solid.js, Vue, Svelte, and Qwik.

- Bundle size, performance, and feature comparisons
- When to choose PhilJS
- Migration difficulty from other frameworks

### [Migration Guides](/docs/migration/)
Moving from other frameworks.

- [From React](/docs/migration/from-react.md) - Complete React migration guide
- [From Vue](/docs/migration/from-vue.md) - Complete Vue migration guide
- [From Svelte](/docs/migration/from-svelte.md) - Complete Svelte migration guide

### [Best Practices](/docs/best-practices/)
Production-ready patterns and strategies.

- [Component Patterns](/docs/best-practices/component-patterns.md)
- [State Management](/docs/best-practices/state-management.md)
- [Code Organization](/docs/best-practices/code-organization.md)
- [Error Handling](/docs/best-practices/error-handling.md)
- [Testing Strategies](/docs/best-practices/testing.md)
- [Accessibility](/docs/best-practices/accessibility.md)
- [Security](/docs/best-practices/security.md)
- [Performance](/docs/best-practices/performance.md)
- [TypeScript](/docs/best-practices/typescript.md)
- [Deployment](/docs/best-practices/deployment.md)

### [Troubleshooting](/docs/troubleshooting/)
Common issues and solutions.

- [Common Issues](/docs/troubleshooting/common-issues.md) - 20+ problems and solutions
- [FAQ - General](/docs/troubleshooting/faq-general.md) - 30+ questions
- [FAQ - Performance](/docs/troubleshooting/faq-performance.md) - 15+ questions
- [FAQ - TypeScript](/docs/troubleshooting/faq-typescript.md) - 15+ questions
- [Debugging Guide](/docs/troubleshooting/debugging.md) - Complete debugging guide

---

## 🚀 Quick Links

**New to PhilJS?**
1. [Introduction](/docs/getting-started/introduction.md)
2. [Installation](/docs/getting-started/installation.md)
3. [Quick Start Tutorial](/docs/getting-started/quick-start.md)

**Coming from React?**
- [React Migration Guide](/docs/migration/from-react.md)
- [Thinking in PhilJS](/docs/getting-started/thinking-in-philjs.md)
- [Signals vs useState](/docs/learn/signals.md)

**Building an App?**
- [Tutorial: Todo App](/docs/getting-started/tutorial-todo-app.md)
- [Tutorial: Blog](/docs/getting-started/tutorial-blog-ssg.md)
- [Routing Guide](/docs/routing/basics.md)
- [Data Fetching](/docs/data-fetching/overview.md)

**Need a Reference?**
- [Core API](/docs/api/core.md)
- [Router API](/docs/api/router.md)
- [Data API](/docs/api/data.md)
- [Configuration](/docs/api/config.md)

---

## ⚡ Performance

| Metric | Value | Comparison |
|--------|-------|------------|
| Signal creation | **21.7M ops/sec** | Faster than Solid.js |
| Signal read | **17.0M ops/sec** | Zero overhead |
| Component render | **19.8M ops/sec** | 40x faster than React |
| Bundle size (core) | **3.3KB gzip** | Smaller than Preact |
| Tree-shake efficiency | **82%** | Only ship what you use |

See full [Performance Dashboard](/metrics/PERFORMANCE.md) for benchmarks.

---

## 💡 Key Features

**Fine-Grained Reactivity**
Signals provide automatic dependency tracking with no dependency arrays.

**Zero Hydration**
Qwik-style resumability means no expensive hydration step.

**Islands Architecture**
Ship minimal JavaScript - only interactive components hydrate.

**Usage Analytics** ⭐
Track which components are used in production. Industry-first!

**Cost Tracking** ⭐
See estimated cloud costs per route. Industry-first!

**Smart Preloading** ⭐
ML-based navigation prediction with 60-80% accuracy. Industry-first!

**Performance Budgets**
Hard limits on bundle size. Build fails if budgets exceeded.

**All-in-One**
Routing, SSR, forms, i18n, animations - everything you need.

---

## 📖 Documentation Stats

- **175+ documentation pages**
- **215,000+ words**
- **1000+ code examples**
- **Complete tutorials and guides**
- **Full API reference**
- **Migration guides from major frameworks**

---

## 🤝 Contributing

Found an issue in the docs? Want to improve something?

1. [Open an issue](https://github.com/yourusername/philjs/issues)
2. Submit a pull request
3. Join our [Discord community](https://discord.gg/philjs)

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details

---

**Happy coding with PhilJS!** ⚡
