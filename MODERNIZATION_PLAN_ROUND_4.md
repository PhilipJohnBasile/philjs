# PhilJS Comprehensive Modernization Plan - Round 4

## Overview

**Version**: 0.1.0
**Target**: TypeScript 6 (next) with Node 24+ as floor, Node 25 support
**Status**: Plan created from comprehensive codebase audit

---

## Executive Summary

After thorough analysis of the entire PhilJS codebase (130+ packages, 300+ documentation files), the following areas require attention:

| Category | Issue Count | Priority |
|----------|-------------|----------|
| Documentation incorrect imports | 3 files | P0 - Critical |
| Documentation Node versions | 17 files | P0 - Critical |
| Package.json TypeScript version | 1 file | P0 - Critical |
| Documentation non-existent API | 1 file | P1 - High |
| Type safety (any types) | 142+ occurrences | P1 - High |
| Type casts (as unknown as) | 163 occurrences | P2 - Medium |
| @ts-ignore directives | 7 occurrences | P2 - Medium |
| Package naming inconsistency | Multiple files | P3 - Low |

---

## Phase 1: Critical Fixes (P0)

### 1.1 Fix Incorrect Import Paths in Documentation

These are **CRITICAL** issues that will cause runtime errors for users following the docs.

#### Issue 1: Vite Plugin Import

**Files**: `docs/getting-started/installation.md` (lines 177, 307)

```typescript
// WRONG
import philjs from 'philjs/vite';

// CORRECT
import philjs from '@philjs/compiler/vite';
```

#### Issue 2: Image Component Import

**File**: `docs/getting-started/tutorial-blog-ssg.md` (line 1128)

```typescript
// WRONG
import { Image } from 'philjs/image';

// CORRECT
import { Image } from '@philjs/image';
```

### 1.2 Fix Non-Existent API Usage

**File**: `docs/getting-started/introduction.md` (lines 85, 88)

```typescript
// WRONG - useCosts() hook does NOT exist
import { useCosts } from 'philjs-core';

// CORRECT - Use costTracker from subpath export
import { costTracker } from '@philjs/core/cost-tracking';
const metrics = costTracker.getComponentMetrics('Dashboard');
```

### 1.3 Fix package.json TypeScript Version

**File**: `packages/philjs-css/package.json`
**Current**: `"typescript": ">=4.7.0"`
**Fix to**: `"typescript": "next"`

```bash
# Verification after fix:
grep -r '"typescript":' packages/*/package.json | grep -v '"next"'
# Should return empty
```

### 1.4 Update Documentation Node Versions

All Docker images and runtime configurations must use Node 24+.

#### Files to Update:

| File | Line(s) | Current | Fix to |
|------|---------|---------|--------|
| `docs/deployment/adapters.md` | 342 | `nodejs20.x` | `nodejs24.x` |
| `docs/deployment/docker.md` | 13, 30 | `node:18-alpine` | `node:24-alpine` |
| `docs/deployment/docker.md` | 71, 77, 84 | `node:18-alpine` | `node:24-alpine` |
| `docs/deployment/docker.md` | 617, 636, 673, 676, 678 | `node:18-alpine` | `node:24-alpine` |
| `docs/deployment/docker.md` | 927 | `distroless/nodejs18-debian11` | `distroless/nodejs24-debian12` |
| `docs/best-practices/deployment.md` | 42 | `node:18-alpine` | `node:24-alpine` |
| `docs/best-practices/production.md` | 597 | `node:18-alpine` | `node:24-alpine` |
| `docs/getting-started/tutorial-storefront.md` | 652 | `node:20-alpine` | `node:24-alpine` |
| `docs/packages/adapters/platforms.md` | 255 | `nodejs20.x` | `nodejs24.x` |
| `docs/packages/adapters/platforms.md` | 314 | `node:20-alpine` | `node:24-alpine` |

---

## Phase 2: Type Safety Improvements (P1)

### 2.1 Replace Record<string, any> in Source Files

**Total**: 142+ occurrences across 50+ files

#### High-Priority Source Files (non-.d.ts):

| File | Count | Fix Strategy |
|------|-------|--------------|
| `philjs-adapters/src/vercel/adapter.ts` | 1 | Create `VercelConfig` interface |
| `philjs-ai/src/types.ts` | 1 | Create specific AI message types |
| `philjs-charts/src/index.ts` | 1 | Create `ChartData` interface |
| `philjs-htmx/src/index.ts` | 3 | Create `HTMXConfig` interfaces |
| `philjs-devtools/src/time-travel.ts` | 1 | Create `HistoryState` interface |
| `philjs-ai/src/rag.ts` | 3 | Create `RAGDocument` interface |
| `philjs-cli/src/add.ts` | 3 | Create `CLIOptions` interface |
| `philjs-html/src/minimal.ts` | 1 | Create `HTMLProps` type |
| `philjs-benchmark/scripts/run-all.ts` | 2 | Create `BenchmarkResult` interface |
| `philjs-benchmark/src/comparison/chart-generator.ts` | 6 | Create `ChartOptions` types |

#### Pattern: Replace `Record<string, any>` with specific types

```typescript
// BEFORE
interface Options {
  config: Record<string, any>;
}

// AFTER
interface ConfigValue {
  enabled?: boolean;
  value?: string | number;
  nested?: Record<string, ConfigValue>;
}

interface Options {
  config: Record<string, ConfigValue>;
}
```

#### Pattern: Replace `any[]` with typed arrays

```typescript
// BEFORE
function processItems(items: any[]): void

// AFTER
interface ProcessableItem {
  id: string;
  type: string;
  data: unknown;
}
function processItems(items: ProcessableItem[]): void
```

### 2.2 Fix Declaration Files (.d.ts)

Many `.d.ts` files contain `any` types. These should be updated to use proper types:

| Package | Files | Strategy |
|---------|-------|----------|
| philjs-analytics | privacy-first.d.ts | Create AnalyticsEvent types |
| philjs-atoms | index.d.ts | Use AtomValue generics |
| philjs-ai-agents | index.d.ts | Create AgentConfig types |
| philjs-ab-testing | index.d.ts | Create ExperimentConfig types |
| philjs-adapters | *.d.ts (6 files) | Create adapter-specific types |

---

## Phase 3: Type Cast Cleanup (P2)

### 3.1 Reduce "as unknown as" Casts

**Total**: 163 occurrences across 40+ files

These double casts indicate type system issues that should be resolved:

#### High-Priority Files:

| File | Occurrences | Fix Strategy |
|------|-------------|--------------|
| `philjs-api/src/server-functions.ts` | 3 | Create `ServerFunction` interface with symbol properties |
| `philjs-db/src/utils.ts` | 1 | Use generic constraints on QueryBuilder |
| `philjs-core/src/element.ts` | 4+ | Create proper internal element types |
| `philjs-adapters/src/*` | 10+ | Create adapter-specific type guards |
| `philjs-3d/src/*` | 5+ | Create 3D framework integration types |

#### Pattern: Replace double casts with proper typing

```typescript
// BEFORE
(clientFn as unknown as Record<string, unknown>).__serverFunction = true;

// AFTER
interface ServerFunctionMeta {
  __serverFunction: boolean;
  __name: string;
  __module: string;
}

const meta: ServerFunctionMeta = {
  __serverFunction: true,
  __name: metadata.name,
  __module: metadata.module,
};
Object.assign(clientFn, meta);
```

### 3.2 Fix @ts-ignore Directives

**Total**: 7 occurrences (all in test files)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `philjs-core/src/context.test.ts` | 435 | `// @ts-ignore delete global.window` | Use @ts-expect-error with explanation |
| `philjs-router/src/view-transitions.test.ts` | 163 | `// @ts-ignore global.document` | Use @ts-expect-error with explanation |
| `philjs-router/src/view-transitions.test.ts` | 165 | `// @ts-ignore global.window` | Use @ts-expect-error with explanation |
| `philjs-router/src/view-transitions.test.ts` | 182 | `// @ts-ignore global.document` | Use @ts-expect-error with explanation |
| `philjs-router/src/view-transitions.test.ts` | 188 | `// @ts-ignore delete mockDocument` | Use @ts-expect-error with explanation |
| `philjs-router/src/view-transitions.test.ts` | 454 | `// @ts-ignore` | Use @ts-expect-error with explanation |
| `philjs-router/src/view-transitions.test.ts` | 912 | `// @ts-ignore` | Use @ts-expect-error with explanation |

**Pattern**: Convert @ts-ignore to @ts-expect-error with explanation:

```typescript
// BEFORE
// @ts-ignore
delete global.window;

// AFTER
// @ts-expect-error - Resetting global for test isolation
delete (global as { window?: typeof window }).window;
```

---

## Phase 4: Template and Example Updates

### 4.1 Create-philjs-plugin Templates

The following template files use `any` types that should be replaced:

| File | Issues |
|------|--------|
| `templates/database/plugin.template.ts` | 4 any types |
| `templates/auth/plugin.template.ts` | 1 any type |
| `templates/api/plugin.template.ts` | 6 any types |

---

## Phase 5: JavaScript File Assessment

### 5.1 Acceptable JavaScript Files (57 total)

The following categories of .js files are **acceptable** and should NOT be converted:

| Category | Count | Reason |
|----------|-------|--------|
| rollup.config.js | 24 | Build tool config |
| vitest.config.js / jest.config.js | 7 | Test tool config |
| vite.config.js | 3 | Build tool config |
| Browser extension files | 15 | Chrome/Firefox extension runtime |
| CLI bin files | 2 | Executable entry points |
| Build scripts | 6 | Development tooling |

**Status**: NO ACTION REQUIRED - All .js files are legitimate config/tooling files

---

## Phase 6: Documentation Cross-References

### 6.1 Verify Internal Links

Check all internal documentation links point to existing files:

```bash
# Find broken internal links
grep -r '\]\(\.\./' docs/ --include="*.md" | grep -v 'node_modules'
```

### 6.2 Update API Examples

Ensure all code examples in documentation use:
- TypeScript (not JavaScript)
- Modern ES2024+ syntax
- Correct import paths from `@philjs/*` packages

---

## Phase 7: Package Naming Standardization (P3)

### 7.1 Standardize to Scoped Package Names

Documentation inconsistently uses both scoped and unscoped package names:

| Current (Wrong) | Correct |
|-----------------|---------|
| `philjs-core` | `@philjs/core` |
| `philjs-ssr` | `@philjs/ssr` |
| `philjs-router` | `@philjs/router` |
| `philjs-image` | `@philjs/image` |

**Note**: All package.json files use scoped names (`@philjs/*`). Documentation should match.

Search pattern to find inconsistencies:
```bash
grep -rE "from ['\"]philjs-" docs/ --include="*.md"
```

---

## Validation Checklist

After completing all phases, run these verification commands:

```bash
# 1. No outdated TypeScript versions
grep -r '"typescript":' packages/*/package.json | grep -v '"next"'
# Expected: empty

# 2. No old Node versions in docs
grep -rE 'node:(18|20|22)|nodejs(18|20|22)' docs/
# Expected: empty

# 3. TypeScript strict mode passes
cd packages/philjs-core && npx tsc --noEmit --strict
# Expected: 0 errors

# 4. All tests pass
npm run test
# Expected: all pass

# 5. Build succeeds
npm run build
# Expected: success
```

---

## Execution Order

1. **Phase 1.1** - Fix incorrect import paths in docs (3 files, 10 min) - **CRITICAL**
2. **Phase 1.2** - Fix non-existent API usage (1 file, 10 min) - **CRITICAL**
3. **Phase 1.3** - Fix philjs-css package.json (1 file, 5 min)
4. **Phase 1.4** - Update documentation Node versions (10 files, 30 min)
5. **Phase 3.2** - Convert @ts-ignore to @ts-expect-error (7 occurrences, 15 min)
6. **Phase 2.1** - Fix high-priority Record<string, any> (10 files, 2 hours)
7. **Phase 3.1** - Reduce as unknown as casts (40+ files, 4 hours)
8. **Phase 2.2** - Fix declaration files (20+ files, 2 hours)
9. **Phase 4** - Update templates (3 files, 30 min)
10. **Phase 7** - Standardize package naming in docs (Multiple files, 1 hour)
11. **Validation** - Run all checks (30 min)

---

## Summary Statistics

| Metric | Current | Target |
|--------|---------|--------|
| TypeScript "next" compliance | 129/130 packages | 130/130 |
| Node 24+ in docs | 0/17 files | 17/17 |
| Correct import paths in docs | 0/3 issues | 3/3 |
| Non-existent API usage | 1 occurrence | 0 |
| Record<string, any> in source | 50+ files | 0 |
| @ts-ignore directives | 7 | 0 |
| as unknown as casts | 163 | <20 (unavoidable edge cases) |
| Package naming consistency | Inconsistent | All @philjs/* |

---

## Notes

### Already Completed (Previous Rounds)
- All 130 packages have `"type": "module"`
- All 130 packages have version `0.1.0`
- All 130 packages have `"node": ">=24"` in engines
- All `@ts-nocheck` directives removed
- All build artifacts cleaned from git
- README.md updated to v0.1.0

### Deferred Items
- Rust book content completion (separate documentation effort)
- E2E test coverage expansion (separate testing effort)
- Performance baseline updates (separate benchmarking effort)

---

**Plan Created**: 2025-12-28
**Target Completion**: Next execution round

---

## Completed This Session

### P0 Critical Fixes - DONE
- [x] Fixed incorrect import paths (`philjs/vite` → `@philjs/compiler/vite`, `philjs/image` → `@philjs/image`)
- [x] Fixed non-existent `useCosts()` API → `costTracker` from `@philjs/core/cost-tracking`
- [x] Fixed `philjs-css/package.json` TypeScript peer dependency (`>=4.7.0` → `>=5.7.0 || next`)
- [x] Updated all Node versions in docs (`node:18`, `node:20` → `node:24`, `nodejs20.x` → `nodejs24.x`)

### P2 Medium Fixes - DONE
- [x] Converted all 7 `@ts-ignore` to `@ts-expect-error` with explanations

### P3 Package Naming - PARTIAL
- [x] Fixed getting-started docs (4 files) - `philjs-core` → `@philjs/core`
- [ ] Remaining: 1400+ occurrences in 192 files (recommend batch script)

### Remaining for Future
- 142+ `Record<string, any>` in source files
- 163 `as unknown as` casts
- Package naming in remaining 192 doc files
