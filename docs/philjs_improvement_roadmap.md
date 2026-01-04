# PhilJS Improvement Roadmap

**Purpose**: Actionable implementation steps to fill gaps identified in the competitive analysis.

---

## 🔴 P0 - Critical (Q1 2026)

### 1. ✅ DONE - Native shadcn/ui Component Library
**Goal**: Create `@philjs/shadcn` with native primitives (faster than UCP wrapper)

**Completed**: Created `packages/philjs-shadcn/` with Button, Input, Card, Dialog, Label, Textarea, Checkbox, Select components.

---

### 2. ✅ DONE - Drizzle ORM Adapter
**Goal**: Add type-safe SQL via Drizzle (trending alternative to Prisma)

**Completed**: Created `packages/philjs-drizzle/` with useDrizzle hook, useTransaction, and query builder.

---

### 3. ✅ DONE - Supabase as Nexus Remote Adapter
**Goal**: Add Supabase as a sync backend option for `@philjs/nexus`

**Completed**: Created `packages/philjs-nexus/src/adapters/` with supabase.ts, supabase-auth.ts, and supabase-realtime.ts.

---

### 4. ✅ DONE - Real-World Documentation Examples
**Goal**: Add practical tutorials beyond API reference

**Completed**: Created 4 tutorials: notion-clone.md, checkout.md, dashboard.md, ai-chat.md in docs/philjs-book/src/tutorials/.

---

### 5. ✅ DONE - Vue/Svelte Migration Codemods
**Goal**: Automated migration tools (React codemod exists)

**Completed**: Created packages/philjs-migrate/src/vue.ts and svelte.ts codemods, plus docs/philjs-book/src/migration/vue.md guide.

---

## 🟠 P1 - High Priority (Q2 2026)

### 6. ✅ DONE - Web Components First-Class Export
**Goal**: `toWebComponent()` API for framework-agnostic distribution

**Completed**: Created packages/philjs-core/src/web-component.ts with toWebComponent(), createShadowWrapper(), defineComponents() functions.

---

### 7. ✅ DONE - VitePress-like Documentation Template
**Goal**: `create-philjs docs` generates a docs site

**Completed**: Created packages/philjs-docs-template/ with index.ts, theme/Layout.tsx, defineConfig, renderMarkdown.

---

### 8. ✅ DONE - Cypress E2E Testing Plugin
**Goal**: Official `@philjs/cypress` plugin

**Completed**: Created packages/philjs-cypress/ with signal(), mountPhilJS(), waitForHydration() commands.

---

### 9. ✅ DONE - LangGraph-Style Agent Patterns
**Goal**: Graph-based agent orchestration in `@philjs/ai-agents`

**Completed**: Created packages/philjs-ai-agents/src/graph.ts with createGraph(), llmNode(), toolNode(), conditionNode().

---

### 10. ✅ DONE - Multi-Agent Patterns (CrewAI-style)
**Goal**: Crew-based agent collaboration

**Completed**: Created packages/philjs-ai-agents/src/crew.ts with createCrew(), kickoff(), sequential/parallel execution.

---

## 🟡 P2 - Medium Priority (Q3 2026)

### 11. UnoCSS Preset
```bash
packages/philjs-unocss/
├── src/index.ts       # Preset definition
├── src/rules.ts       # PhilJS-specific rules
└── src/shortcuts.ts   # Component shortcuts
```
**Effort**: 8h

---

### 12. Figma Plugin
```bash
packages/philjs-figma/
├── manifest.json      # Figma plugin manifest
├── src/code.ts        # Main plugin code
└── src/ui.tsx         # Plugin UI
```
**Effort**: 16h

---

### 13. Django Adapter
```bash
packages/philjs-python/src/django/
├── middleware.py       # PhilJS middleware
├── templatetags.py     # Template integration
└── views.py            # SSR views
```
**Effort**: 12h

---

### 14. Laravel Adapter
```bash
packages/philjs-php/
├── src/PhilJSServiceProvider.php
├── src/Middleware/PhilJS.php
└── resources/views/philjs.blade.php
```
**Effort**: 12h

---

### 15. Expo Integration
```bash
packages/philjs-mobile/src/expo/
├── adapter.ts          # Expo adapter
├── router.ts           # Expo Router integration
└── native-modules.ts   # Native module bridges
```
**Effort**: 16h

---

## 🟢 P3 - Future (Q4 2026+)

| Item | Description | Effort |
|:-----|:------------|:-------|
| **WebStorm Plugin** | JetBrains IDE support | 24h |
| **Spring Boot Adapter** | Java enterprise integration | 20h |
| **ASP.NET Core Adapter** | .NET integration | 20h |
| **Ruby on Rails Adapter** | Ruby ecosystem | 16h |
| **Kubernetes Templates** | Production deployment | 8h |
| **Valibot Integration** | Smaller validation library | 4h |
| **RxJS Interop** | Observable bridge | 8h |

---

## 📋 Documentation Gaps Checklist

- [x] **Nexus tutorials** - "Build a Notion Clone" walkthrough ✅
- [ ] **Enterprise deployment** - K8s templates, production checklists
- [ ] **Performance tuning** - Optimization deep dive
- [ ] **Contributing guide** - How to add packages to monorepo
- [ ] **API versioning** - Breaking change policy
- [ ] **Security hardening** - Production security guide
- [x] **Rust Core docs** - Merged rust-book into philjs-book ✅

---

## 🎯 Success Metrics

| Metric | Current | Target |
|:-------|:--------|:-------|
| Native component count | 0 | 30+ (shadcn parity) |
| Database adapters | 1 (Prisma) | 3+ |
| IDE plugins | 1 (VSCode) | 2+ |
| Real-world tutorials | ~4 | 10+ |
| Migration codemods | 1 (React) | 3+ |
