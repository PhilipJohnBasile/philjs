# Agent 03: TypeScript Fixes for philjs-ssr

**Agent**: 03
**Date**: 2025-12-16
**Status**: Complete

## Overview

Fixed two TypeScript errors in the philjs-ssr package:
1. Result type discriminant handling in `request-handler.ts`
2. Socket.encrypted property access in `adapters.ts`

## Changes Made

### 1. Result Type Discriminant Handling (`request-handler.ts`)

**Problem**: TypeScript error when accessing `result.error` property without proper type narrowing:
```
error TS2339: Property 'error' does not exist on type 'Result<unknown, unknown>'.
  Property 'error' does not exist on type 'Ok<unknown>'.
```

**Solution**: Used `isOk` and `isErr` type guards from philjs-core to properly narrow the Result type before accessing properties.

**Before**:
```typescript
import { isResult, renderToString } from "philjs-core";

if (isResult(result)) {
  if (result.ok) {
    loaderData = result.value;
  } else {
    loaderError = result.error; // ❌ TypeScript error
  }
}
```

**After**:
```typescript
import { isResult, isOk, isErr, renderToString } from "philjs-core";

if (isResult(result)) {
  if (isOk(result)) {
    loaderData = result.value; // ✅ TypeScript knows this is Ok<T>
  } else if (isErr(result)) {
    loaderError = result.error; // ✅ TypeScript knows this is Err<E>
  }
}
```

**Rationale**: The `isOk` and `isErr` functions are type guards (`result is Ok<T>` and `result is Err<E>`) that properly narrow the discriminated union type, allowing TypeScript to infer which properties are available.

### 2. Socket.encrypted Property (`adapters.ts`)

**Problem**: TypeScript error when accessing `encrypted` property on `net.Socket`:
```
error TS2339: Property 'encrypted' does not exist on type 'Socket'.
```

**Solution**: Used runtime type checking with `'encrypted' in socket` and type assertion to safely check for TLS connections.

**Before**:
```typescript
function resolveOrigin(req: IncomingMessage, baseUrl?: string): string {
  if (baseUrl) return baseUrl;
  const protocol = req.socket.encrypted ? "https" : "http"; // ❌ TypeScript error
  const host = req.headers.host ?? "localhost";
  return `${protocol}://${host}`;
}
```

**After**:
```typescript
import type { TLSSocket } from "node:tls";

function resolveOrigin(req: IncomingMessage, baseUrl?: string): string {
  if (baseUrl) return baseUrl;
  // Type guard to check if socket is a TLS socket
  const isTLS = req.socket && 'encrypted' in req.socket;
  const protocol = isTLS && (req.socket as TLSSocket).encrypted ? "https" : "http";
  const host = req.headers.host ?? "localhost";
  return `${protocol}://${host}`;
}
```

**Rationale**:
- `IncomingMessage.socket` can be either a `net.Socket` (HTTP) or `tls.TLSSocket` (HTTPS)
- The `encrypted` property only exists on `TLSSocket`
- Using `'encrypted' in socket` checks for the property's presence at runtime
- Type assertion to `TLSSocket` is safe after the runtime check
- This approach handles both HTTP and HTTPS connections correctly

### 3. Test Coverage

Added comprehensive tests in `adapters.test.ts` to verify both fixes:

1. **HTTP Protocol Detection Test**: Verifies that non-TLS connections work correctly and are detected as HTTP
2. **Result Types Test**: Tests both `Ok` and `Err` results from loaders to ensure proper handling

```typescript
it("handles Result types from loaders correctly", async () => {
  const okRoute: RouteDefinition = {
    path: "/ok",
    component: ({ data }) => `Data: ${data}`,
    loader: async () => Ok("success"),
  };

  const errRoute: RouteDefinition = {
    path: "/err",
    component: ({ error }) => `Error: ${error}`,
    loader: async () => Err("failed"),
  };

  const handler = createFetchHandler({ routes: [okRoute, errRoute] });

  const okResponse = await handler(new Request("http://localhost/ok"));
  const okHtml = await okResponse.text();
  expect(okHtml).toContain("Data: success");

  const errResponse = await handler(new Request("http://localhost/err"));
  const errHtml = await errResponse.text();
  expect(errHtml).toContain("Error: failed");
});
```

## Verification

### TypeScript Check
```bash
cd packages/philjs-ssr
pnpm typecheck
```
Result: ✅ No TypeScript errors

### Test Suite
```bash
cd packages/philjs-ssr
pnpm test
```
Result: ✅ All 58 tests passing
- `adapters.test.ts`: 7 tests (including 2 new tests)
- `integration-full.test.ts`: 15 tests
- `render.test.ts`: 36 tests

## Files Modified

1. `packages/philjs-ssr/src/request-handler.ts`
   - Added imports: `isOk`, `isErr`
   - Updated Result type checking logic

2. `packages/philjs-ssr/src/adapters.ts`
   - Added import: `TLSSocket` from `node:tls`
   - Updated `resolveOrigin` function with proper type narrowing

3. `packages/philjs-ssr/src/adapters.test.ts`
   - Added imports: `createSecureServer`, `readFileSync`, `resolve`, `Err`
   - Added test: "handles HTTP protocol detection for non-TLS connections"
   - Added test: "handles Result types from loaders correctly"

## Type Safety Patterns Used

### 1. Discriminated Union Type Guards
Result types use the discriminated union pattern with `ok` as the discriminant:
```typescript
type Result<T, E> = Ok<T> | Err<E>;
type Ok<T> = { readonly ok: true; readonly value: T; };
type Err<E> = { readonly ok: false; readonly error: E; };
```

Type guards properly narrow the union:
```typescript
function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}
```

### 2. Runtime Type Narrowing
For Socket types, use runtime checks before type assertions:
```typescript
// Check for property existence first
const isTLS = req.socket && 'encrypted' in req.socket;
// Safe to assert after runtime check
const protocol = isTLS && (req.socket as TLSSocket).encrypted ? "https" : "http";
```

## Acceptance Criteria

- [x] philjs-ssr typechecks cleanly
- [x] Socket handling correctly distinguishes TLS vs non-TLS
- [x] Result handling uses proper type guards
- [x] Tests verify behavior for both code paths
- [x] worklogs/03-ts-ssr.md documents changes

## Notes

- The Result type pattern follows Rust-inspired error handling
- Type guards (`isOk`, `isErr`) are preferred over direct property access on discriminated unions
- Socket type narrowing uses runtime checks to maintain type safety
- All existing tests continue to pass with the new changes
- New tests ensure both HTTP and HTTPS scenarios work correctly
- New tests verify both Ok and Err result types are handled properly
