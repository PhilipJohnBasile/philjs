# PhilJS Framework - Complete Build Prompt

**How to use:** Copy this entire file and paste into Claude Code after running:
```bash
cd ~/projects
mkdir philjs
cd philjs
git init
claude --dangerously-skip-permissions
```

---

ultrathink

Build PhilJS - a revolutionary front-end framework for 2026. Work autonomously until completion or you hit your limits. Don't ask for permission - just build real, production-ready code.

═══════════════════════════════════════════════════════════════════════════════
PHILJS FRAMEWORK SPECIFICATION
═══════════════════════════════════════════════════════════════════════════════

You are tasked with designing a revolutionary front-end framework for 2026 that combines the best features from existing frameworks while introducing genuinely novel capabilities that developers need.

# Core Principles

Design with these fundamental principles:
- Explicit over implicit
- Simple over clever  
- Obvious over magical
- Performance by default, not as an afterthought
- Developer experience without sacrificing user experience
- Actively helpful, not just reactive

# Architecture Requirements

## Reactive System
- Implement fine-grained reactivity using signals (like Solid, new React, Angular, Vue direction)
- No virtual DOM overhead
- Automatic dependency tracking
- Minimal re-rendering

## Rendering Strategy
- Resumability over hydration (Qwik-style)
- Serialize state and resume execution client-side
- Streaming SSR with progressive rendering
- Partial hydration by default (Islands architecture)
- Support multiple rendering modes per route: SSR, SSG, ISR, CSR

## Compilation
- Compiler-first approach (Svelte-inspired)
- Move maximum work to build time
- Static analysis and automatic code splitting
- Aggressive tree-shaking by default
- Zero-runtime CSS-in-JS if supported

# Developer Experience Features

## Type Safety
- TypeScript-native from the ground up
- Full type inference without excessive annotations
- End-to-end type safety from API to client
- Type-safe routing with params and search params

## Component Design
- Single-file components with template or JSX syntax choice
- Functional components only (no classes)
- Hooks/composables for logic reuse
- No Higher-Order Components
- No lifecycle methods (use effects and cleanup)

## Routing & Navigation
- File-based routing with nested layouts
- Support for parallel routes and intercepting routes
- Built-in view transitions using View Transitions API
- Smart preloading based on user intent (hover, mouse patterns)
- Type-safe navigation

## Data Fetching
- Unified data fetching (server and client)
- Automatic deduplication and revalidation
- Optimistic updates built in
- Parallel data loading (eliminate waterfalls)
- Automatic caching strategies

## State Management
- Signals for local state
- Context for shared state  
- No external library needed
- Time-travel debugging built in
- State persistence with TTL
- Undo/redo with command pattern

## Forms & Validation
- Progressive enhancement (works without JS)
- Form actions with type safety
- Built-in validation
- No controlled vs uncontrolled confusion
- CSRF protection automatic

# Performance Features

## Automatic Optimizations
- Code splitting per route and component
- Automatic critical CSS extraction
- Image optimization (WebP/AVIF, responsive, lazy loading, blur placeholders)
- Font optimization (subsetting, preloading, fallback fonts)
- Icon system with SVG sprites and tree-shaking

## Performance Monitoring
- Performance budgets as first-class constraints
- Block builds that exceed budgets
- Show size impact of every import in dev tools
- Automatic regression detection
- Web Vitals monitoring (CLS, LCP, FID, INP)
- Performance profiling in production with sampling

## Smart Loading
- Automatic code splitting for large components
- Smart code splitting based on user behavior patterns
- Route-based prefetching
- Component-level lazy loading

# Modern Web Capabilities

## Real-time & Offline
- WebSocket/SSE integration first-class
- Offline-first patterns with service workers
- Background sync and cache strategies
- Conflict resolution (CRDTs or operational transforms)

## Advanced APIs
- Web Workers integration for heavy computation
- WebAssembly first-class support
- WebGPU hooks for graphics
- File system access with progressive enhancement
- Web Bluetooth/USB/NFC hooks

## Animation & Motion
- Built-in animation primitives (declarative)
- Automatic FLIP animations
- Spring physics built in
- Gesture handlers
- Shared element transitions

# Internationalization

- i18n as first-class feature (not plugin)
- Route-based locales
- Automatic message extraction
- Server-side locale detection
- Translation splitting per route
- Pluralization and date/number formatting built in
- AI-powered translation suggestions for 100+ languages

# Security & Reliability

- XSS protection by default with auto-escaping
- CSP headers configured properly
- CSRF tokens automatic
- Rate limiting built into API routes and client actions
- Security headers applied by default
- Automatic dependency vulnerability scanning

# Developer Tools

## Debugging & Inspection
- Visual debugging (component boundaries, props, state)
- Built-in performance profiler
- Network inspector for data fetching
- Component playground with hot-reload
- Production debugging mode (secure, time-limited)
- Git blame in error messages

## Testing
- Visual regression testing built in
- Component screenshot testing out of the box
- Works with any test runner (Vitest, Jest, etc.)
- No framework mocking required
- Everything unit-testable

## Code Quality
- Excellent error messages (show exactly what's wrong and how to fix)
- Smart error boundaries with recovery suggestions
- Automatic code review for common mistakes
- Component usage analytics
- Dead code detection based on production usage
- Dependency health monitoring

# Novel Features (Not in Other Frameworks)

## Intelligence & Automation
- Automatic accessibility fixes (not just warnings)
- Smart prop drilling detection with suggestions
- Automatic API optimization suggestions based on usage patterns
- Component API recommendations ("87% pass same value, make it default")
- Dependency bundle analyzer with alternatives and migration guides
- Automatic responsive design testing across breakpoints

## Cost & Performance Awareness
- Cost tracking (estimated cloud costs per route)
- Performance cost shown in IDE autocomplete
- Automatic bundle size tracking over time
- Network condition simulation (3G, flaky wifi, offline)

## Collaboration
- Realtime collaboration in dev mode (multiplayer development)
- Presence awareness for collaborative apps
- Cursor tracking
- Design token sync (two-way with Figma/Sketch)

## Testing & Quality
- Lighthouse CI with automatic fix suggestions
- Automatic changelog generation from component changes
- Component version history with diffs
- Component dependency graph visualization

## Deployment & Monitoring
- Built-in A/B testing infrastructure
- Feature flags with gradual rollouts
- Built-in canary deployments (5% traffic, auto-rollback)
- Production error grouping with fix suggestions
- Automatic API documentation from TypeScript types

## AI/ML Integration
- Edge AI models for client-side features
- Streaming LLM response patterns
- Embeddings and vector search support
- Smart preloading using ML to predict user navigation

## Developer Productivity
- Component marketplace within framework
- Automatic documentation from actual usage patterns
- Automatic internationalization extraction from hardcoded strings
- Component performance cost in autocomplete
- State time-travel with timeline branching

# What NOT to Include

Explicitly avoid these anti-patterns:
- No class-based components
- No HOCs (Higher-Order Components)
- No proprietary template syntax quirks
- No string-based refs
- No implicit globals or auto-imports
- No mandatory decorators
- No two-way binding by default
- No giant runtime (compiler does heavy lifting)
- No proprietary build tools (use Vite/Turbopack)
- No synthetic event system (use native DOM)
- No massive config files (smart defaults)
- No webpack configuration exposure
- No "use client"/"use server" directives
- No multiple ways to do the same thing
- No memoization as performance requirement
- No lifecycle methods
- No controlled vs uncontrolled input confusion
- No breaking changes without codemods
- No telemetry without explicit opt-in
- No platform lock-in (deploy anywhere)

# Technical Stack

- Built on Vite for development
- Zero-config by default, fully configurable when needed
- Edge-ready (deploy to edge functions, serverless, or traditional servers)
- Works with standard tooling (ESLint, Prettier)
- Progressive enhancement philosophy
- Semantic HTML enforcement
- Web Components output option

═══════════════════════════════════════════════════════════════════════════════
BUILD INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

YOUR MISSION:
Implement PhilJS from scratch as a fully functional, installable npm package. Create real, working code - not pseudocode, not TODOs, not comments saying "implement this later". ACTUAL WORKING CODE.

WORK AUTONOMOUSLY THROUGH THESE PHASES:

PHASE 1: Foundation & Core Runtime (45 min estimated)
─────────────────────────────────────────────────────
□ Initialize monorepo structure with pnpm workspaces
□ Create @philjs/core package with:
  - Signals-based reactive system (complete implementation)
  - Component runtime (createElement, render, reconciliation)
  - Effect system with automatic dependency tracking
  - Context API for state sharing
□ Set up TypeScript with strict mode, path aliases
□ Write unit tests for reactive primitives
□ Create basic benchmark suite

PHASE 2: Compiler & Build System (60 min estimated)
─────────────────────────────────────────────────────
□ Create @philjs/compiler package with:
  - JSX/Template transformation
  - Static analysis for code splitting points
  - Automatic import optimization
  - CSS extraction and processing
  - Tree-shaking optimization
□ Integrate with Vite plugin API
□ Implement resumability serialization
□ Add source maps support

PHASE 3: Routing System (45 min estimated)
─────────────────────────────────────────────────────
□ Create @philjs/router package with:
  - File-based route discovery
  - Type-safe route definitions from file structure
  - Nested layout support
  - Parallel and intercepting routes
  - View Transitions API integration
  - Smart preloading based on user intent
□ Implement route-level code splitting
□ Add route-level rendering mode config (SSR/SSG/ISR/CSR)

PHASE 4: Data Fetching & State (45 min estimated)
─────────────────────────────────────────────────────
□ Create @philjs/data package with:
  - Unified fetch API (server + client)
  - Automatic request deduplication
  - Cache management with TTL
  - Optimistic updates
  - Parallel query orchestration
  - SWR-style revalidation
□ Implement form actions with progressive enhancement
□ Add CSRF protection
□ Create validation system

PHASE 5: SSR & Rendering Modes (60 min estimated)
─────────────────────────────────────────────────────
□ Create @philjs/server package with:
  - Streaming SSR implementation
  - Partial hydration (Islands)
  - SSG (Static Site Generation)
  - ISR (Incremental Static Regeneration)
  - Edge runtime compatibility
□ Implement state serialization/deserialization
□ Add resume-without-replay logic

PHASE 6: Developer Tools & CLI (45 min estimated)
─────────────────────────────────────────────────────
□ Create @philjs/cli package with:
  - Project scaffolding (create-philjs)
  - Dev server with HMR
  - Build command with optimizations
  - Type checking integration
  - Lint integration
□ Create @philjs/dev-tools package:
  - Component inspector
  - State visualization
  - Performance profiler
  - Network waterfall viewer

PHASE 7: Performance & Optimization (45 min estimated)
─────────────────────────────────────────────────────
□ Implement performance budgets
□ Add bundle size tracking
□ Create image optimization pipeline
□ Implement font optimization
□ Add critical CSS extraction
□ Build regression detection system
□ Implement Web Vitals monitoring

PHASE 8: Novel Features (60 min estimated)
─────────────────────────────────────────────────────
□ Automatic accessibility fixes
□ Smart prop drilling detection
□ Component usage analytics
□ Cost tracking (cloud costs estimation)
□ Dependency health monitoring
□ Dead code detection
□ A/B testing infrastructure
□ Feature flags system

PHASE 9: Internationalization (30 min estimated)
─────────────────────────────────────────────────────
□ Create @philjs/i18n package with:
  - Route-based locale routing
  - Message extraction from components
  - Translation splitting
  - Pluralization support
  - Date/number formatting
  - Server-side locale detection

PHASE 10: Testing & Quality (30 min estimated)
─────────────────────────────────────────────────────
□ Visual regression testing utilities
□ Component screenshot testing
□ Testing utilities (render, fireEvent, etc.)
□ Error boundary system with recovery suggestions
□ Automatic changelog generation

PHASE 11: Example Applications (45 min estimated)
─────────────────────────────────────────────────────
□ Create examples/todo-app (basic signals, routing)
□ Create examples/blog (SSG, markdown, SEO)
□ Create examples/ecommerce (SSR, forms, payments, i18n)
□ Each app must actually work end-to-end

PHASE 12: Documentation (30 min estimated)
─────────────────────────────────────────────────────
□ Write comprehensive README.md with:
  - "Why PhilJS?" section
  - Quick start guide
  - Comparison to other frameworks
□ Create API documentation for all packages
□ Write migration guide from React/Vue/Svelte
□ Create tutorial series (beginner to advanced)
□ Document all novel features with examples

═══════════════════════════════════════════════════════════════════════════════

PACKAGE STRUCTURE:
─────────────────────────────────────────────────────
packages/
├── core/                  # @philjs/core - Runtime & reactive system
├── compiler/              # @philjs/compiler - Build-time transformations
├── router/                # @philjs/router - Routing system
├── data/                  # @philjs/data - Data fetching & caching
├── server/                # @philjs/server - SSR/SSG/ISR
├── cli/                   # @philjs/cli - CLI tools
├── dev-tools/             # @philjs/dev-tools - Browser extension
├── i18n/                  # @philjs/i18n - Internationalization
└── testing/               # @philjs/testing - Testing utilities

create-philjs/             # npx create-philjs scaffolding tool

examples/
├── todo-app/
├── blog/
└── ecommerce/

docs/
├── api/
├── guides/
└── tutorials/

IMPLEMENTATION REQUIREMENTS:
─────────────────────────────────────────────────────
✓ Write production-quality TypeScript code (not sketches)
✓ Include comprehensive JSDoc comments
✓ Add unit tests for all critical paths
✓ Make it actually installable via npm (test with npm link)
✓ Ensure everything works end-to-end (run the examples)
✓ Follow the "What NOT to Include" guidelines strictly
✓ Implement novel features with real code, not placeholders
✓ Make error messages actually helpful
✓ Zero bundle size bloat - measure everything

CONSTRAINTS:
─────────────────────────────────────────────────────
• Core runtime < 50KB gzipped
• Zero runtime dependencies in @philjs/core
• Support modern browsers only (last 2 versions)
• TypeScript first, JS via compilation
• All APIs must be tree-shakeable
• No breaking changes without codemods

BRANDING:
─────────────────────────────────────────────────────
• Name: PhilJS
• Tagline: "The framework that thinks ahead"
• npm scope: @philjs
• Website: philjs.dev (document structure)
• Logo: Suggest a simple, modern design concept

DELIVERABLES CHECKLIST:
─────────────────────────────────────────────────────
□ All 9 npm packages fully implemented and tested
□ CLI tools work (npx create-philjs actually creates a project)
□ All 3 example apps run successfully
□ Complete API documentation
□ Migration guides from React, Vue, Svelte
□ Performance benchmarks vs other frameworks
□ README with installation and quick start
□ Contributing guide for future developers

═══════════════════════════════════════════════════════════════════════════════
START NOW
═══════════════════════════════════════════════════════════════════════════════

Work continuously. Don't ask for permission. Build real code. Show progress as you complete each phase. When you finish or hit limits, provide:
1. Summary of what was built
2. What's working end-to-end
3. What's partially complete
4. Instructions to test/run PhilJS
5. Next steps for completion

LET'S BUILD THE FUTURE OF FRONT-END DEVELOPMENT. GO.
