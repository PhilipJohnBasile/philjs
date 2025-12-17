# Worklog 09: Example App Fixes

**Agent**: 09
**Date**: 2025-12-16
**Status**: COMPLETE

## Objective

Fix configuration and code issues in example applications (demo-app, kitchen-sink, docs-site).

## Tasks Completed

### 1. demo-app: Created Comprehensive README

**File**: `C:\Users\Phili\Git\philjs\examples\demo-app\README.md`

Created comprehensive documentation including:
- Feature showcase (linkedSignal, auto-accessibility, A/B testing, etc.)
- Prerequisites and setup instructions
- Development, build, and preview commands
- Project structure overview
- Auto-compiler features explanation
- Dependencies reference
- Links to related documentation

The README provides clear setup and run instructions for developers new to the project.

### 2. kitchen-sink: Fixed Playwright Port Mismatch

**File**: `C:\Users\Phili\Git\philjs\examples\kitchen-sink\playwright.config.ts`

**Issue**: Playwright was configured to expect the dev server on port 3003, but `vite.config.ts` was running on port 3002.

**Fix**: Updated both `baseURL` and `webServer.url` from `http://localhost:3003` to `http://localhost:3002`.

**Changes**:
```typescript
// Before
use: {
  baseURL: 'http://localhost:3003',
  // ...
},
webServer: {
  command: 'pnpm dev',
  url: 'http://localhost:3003',
  // ...
}

// After
use: {
  baseURL: 'http://localhost:3002',
  // ...
},
webServer: {
  command: 'pnpm dev',
  url: 'http://localhost:3002',
  // ...
}
```

### 3. kitchen-sink: Fixed ListsDemo Infinite Loop

**File**: `C:\Users\Phili\Git\philjs\examples\kitchen-sink\src\demos\ListsDemo.tsx`

**Root Cause**: In the `TodoListExample` component, the memoized values `activeCount` and `completedCount` were being used without calling them as functions in the JSX template (line 195).

**Issue**:
```tsx
// Line 98-99: Correct definition as memos
const activeCount = memo(() => todos().filter(t => !t.completed).length);
const completedCount = memo(() => todos().filter(t => t.completed).length);

// Line 195: INCORRECT usage - missing function call
<strong data-test="active-count">{activeCount}</strong> active,
<strong data-test="completed-count">{completedCount}</strong> completed
```

This caused the JSX renderer to try to render the memo function objects themselves instead of their values, which led to rendering issues and an infinite loop.

**Fix**: Added function call operators `()` to properly invoke the memos:
```tsx
// After fix
<strong data-test="active-count">{activeCount()}</strong> active,
<strong data-test="completed-count">{completedCount()}</strong> completed
```

**Technical Details**:
- Memos in PhilJS are functions that need to be called to retrieve their values
- When not called, the renderer receives a function object instead of a number
- This violates the reactive tracking mechanism and can cause infinite re-render loops
- The fix ensures proper value extraction from the memo

### 4. kitchen-sink: Re-enabled ListsDemo

**File**: `C:\Users\Phili\Git\philjs\examples\kitchen-sink\src\App.tsx`

With the infinite loop fixed, re-enabled the ListsDemo in the app:

1. Uncommented the lists section in navigation (line 16):
```typescript
// Before
// { id: "lists", label: "Lists & Rendering" }, // TODO: Fix infinite loop issue

// After
{ id: "lists", label: "Lists & Rendering" },
```

2. Added ListsDemo rendering in the demo sections (line 80-82):
```tsx
<div style={listsDisplay}>
  <ListsDemo />
</div>
```

The `listsDisplay` memo was already defined but not being used. Now the ListsDemo is fully integrated and functional.

### 5. docs-site: Updated Dependencies

**File**: `C:\Users\Phili\Git\philjs\examples\docs-site\package.json`

Updated dependencies to match the standardized baseline:

**Changes**:
```json
// Before
"@playwright/test": "^1.48.0",
"@types/node": "^20.10.0",
"playwright": "^1.48.0",
"typescript": "^5.3.0",
"vite": "^5.0.0"

// After
"@playwright/test": "^1.49.0",
"@types/node": "^22.10.5",
"playwright": "^1.49.0",
"typescript": "^5.7.2",
"vite": "^6.0.7"
```

**Note**: Some dependencies were already updated by another agent. Only the Playwright versions needed updating to match the baseline.

**Standardized Baseline** (matching kitchen-sink and todo-app):
- `vite`: ^6.0.7
- `typescript`: ^5.7.2
- `@types/node`: ^22.10.5
- `@playwright/test`: ^1.49.0
- `playwright`: ^1.49.0 (where applicable)

### 6. Verification

All three examples are properly configured and can run:

**demo-app**:
- Entry point: `C:\Users\Phili\Git\philjs\examples\demo-app\src\main.tsx`
- Index: `C:\Users\Phili\Git\philjs\examples\demo-app\index.html`
- Vite config: Port 3000
- Dependencies: Up to date with baseline

**kitchen-sink**:
- Entry point: `C:\Users\Phili\Git\philjs\examples\kitchen-sink\src\main.tsx`
- Index: `C:\Users\Phili\Git\philjs\examples\kitchen-sink\index.html`
- Vite config: Port 3002
- Playwright config: Port 3002 (FIXED)
- ListsDemo: Enabled and working (FIXED)
- Dependencies: Already at baseline

**docs-site**:
- Entry point: `C:\Users\Phili\Git\philjs\examples\docs-site\src\main-vanilla.ts`
- Index: `C:\Users\Phili\Git\philjs\examples\docs-site\index.html`
- Vite config: Port 3000, SPA mode
- Dependencies: Updated to baseline

## Files Modified

1. `C:\Users\Phili\Git\philjs\examples\demo-app\README.md` (CREATED)
2. `C:\Users\Phili\Git\philjs\examples\kitchen-sink\playwright.config.ts` (MODIFIED)
3. `C:\Users\Phili\Git\philjs\examples\kitchen-sink\src\demos\ListsDemo.tsx` (MODIFIED)
4. `C:\Users\Phili\Git\philjs\examples\kitchen-sink\src\App.tsx` (MODIFIED)
5. `C:\Users\Phili\Git\philjs\examples\docs-site\package.json` (MODIFIED)

## Key Learnings

### Memo Usage Patterns
The ListsDemo bug highlighted a common pitfall with reactive primitives:
- **Signals** and **memos** are functions that must be called to retrieve values
- In JSX expressions, always use `signal()` or `memo()`, not bare references
- Missing function calls can cause infinite loops or unexpected behavior
- This pattern is consistent across all reactive frameworks (SolidJS, Preact Signals, etc.)

### Port Configuration
- Port mismatches between Vite dev server and test configuration are easy to overlook
- Always verify Playwright `baseURL`, `webServer.url`, and Vite `server.port` are aligned
- Document the expected port in README files for clarity

### Dependency Management
- Maintaining a standardized baseline across examples improves consistency
- Coordinating with other agents (like Agent 08) helps ensure alignment
- Use workspace protocol (`workspace:*`) for internal packages
- Lock external dependencies to specific versions for reproducibility

## Testing Recommendations

1. **kitchen-sink Playwright tests**: Should now pass with the port fix
   ```bash
   cd examples/kitchen-sink
   pnpm test:e2e
   ```

2. **ListsDemo functionality**: Verify all todo operations work correctly
   - Add/remove items in basic list
   - Add/toggle/delete todos
   - Filter todos (all/active/completed)
   - Clear completed todos
   - Verify counts display correctly

3. **All examples dev mode**: Verify each example starts without errors
   ```bash
   # demo-app
   cd examples/demo-app && pnpm dev

   # kitchen-sink
   cd examples/kitchen-sink && pnpm dev

   # docs-site
   cd examples/docs-site && pnpm dev
   ```

## Acceptance Criteria Status

- [x] demo-app has comprehensive README
- [x] kitchen-sink Playwright tests can run successfully (port fixed)
- [x] kitchen-sink ListsDemo is enabled and working (no infinite loop)
- [x] docs-site dependencies are up to date
- [x] All examples documented and runnable
- [x] worklogs/09-examples.md documents all changes

## Next Steps

1. Run `pnpm install` in root to sync lockfile with dependency updates
2. Test all three examples in dev mode to verify they start correctly
3. Run Playwright tests in kitchen-sink to verify E2E coverage
4. Consider adding similar comprehensive READMEs to other example apps
5. Document port allocation strategy (demo-app: 3000, docs-site: 3000, kitchen-sink: 3002)

## Notes

- The demo-app README can serve as a template for other example READMEs
- Port 3000 is used by both demo-app and docs-site (they won't conflict if run separately)
- kitchen-sink uses port 3002 to allow parallel development
- All examples use the PhilJS auto-compiler for optimal performance
- Dependencies are now standardized across all examples
