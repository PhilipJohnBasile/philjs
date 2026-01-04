# TypeScript 6.x Deep Dive (Appendix)

A practical, in-depth TypeScript 6.x guide for PhilJS developers. PhilJS is built exclusively for **TypeScript 6.0+** and **Node.js 24+**, leveraging the latest optimizing compilers and runtime features.

## Table of contents

- [TypeScript mental model](#ts6-mental-model)
- [Type operators and assignability](#ts6-assignability)
- [Compiler configuration](#ts6-config)
- [Types, unions, and intersections](#ts6-types)
- [Enums and literal alternatives](#ts6-enums)
- [Control-flow narrowing](#ts6-narrowing)
- [Functions and overloads](#ts6-functions)
- [Generics and inference](#ts6-generics)
- [Object types and safety flags](#ts6-objects)
- [Tuples, arrays, and readonly data](#ts6-tuples)
- [Classes, interfaces, and the type system](#ts6-classes)
- [Modules and the type/value split](#ts6-modules)
- [Declaration merging and module augmentation](#ts6-declarations)
- [Utility, mapped, and conditional types](#ts6-utility)
- [Template literal types](#ts6-template-literals)
- [Async typing and error models](#ts6-async)
- [JSX and PhilJS typing](#ts6-jsx)
- [Interop with JavaScript](#ts6-interop)
- [Migration from JavaScript](#ts6-migration)
- [Testing types](#ts6-testing)
- [Build performance and project references](#ts6-performance)
- [Real-world patterns for PhilJS](#ts6-patterns)
- [TS6 `using` and disposal](#ts6-using)
- [Common pitfalls and fixes](#ts6-pitfalls)
- [Checklists and exercises](#ts6-checklists)

<a id="ts6-mental-model"></a>
## TypeScript mental model

TypeScript is a structural type system layered on top of JavaScript. The compiler checks your code at build time, then emits JavaScript without runtime type metadata.

Key ideas:

- Structural typing: if the shape matches, the types are compatible.
- Inference first: the compiler infers types and you constrain them where needed.
- Type/value split: types exist only at compile time; values exist at runtime.
- Practical safety: TypeScript favors ergonomics over strict soundness.

In PhilJS projects, strictness matters because you ship type-checked loaders, actions, and SSR boundaries. Treat the type system as an API contract.

### Widening vs narrowing

TypeScript widens values unless you tell it not to:

```ts
const mode = 'edge';        // type: string (widened)
const mode2 = 'edge' as const; // type: 'edge'
```

Use `as const` or `satisfies` for config objects to keep literals narrow:

```ts
const env = {
  runtime: 'edge',
  cache: 'stale-while-revalidate'
} satisfies { runtime: 'edge' | 'node'; cache: string };
```

### Type/value split

Types do not exist at runtime. If you need runtime checks, use functions or schemas.

```ts
type User = { id: string };

function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}
```

<a id="ts6-assignability"></a>
## Type operators and assignability

TypeScript is structural. Assignability is based on whether the required fields and signatures exist, not on nominal names.

```ts
type User = { id: string; email: string };
type MinimalUser = { id: string };

const u: User = { id: 'u1', email: 'a@b.com' };
const m: MinimalUser = u; // ok, u has at least the required shape
```

Common type operators:

- `keyof` produces a union of keys.
- `typeof` reads a value's type.
- indexed access (`T[K]`) reads a property type.

```ts
type UserKeys = keyof User;        // 'id' | 'email'
type UserEmail = User['email'];    // string

const config = { cache: 'stale', ttl: 30 };
type Config = typeof config;       // { cache: string; ttl: number }
```

Assignability gotchas:

- Function parameters follow variance rules; keep callback types explicit.
- Optional properties are not the same as `undefined` when `exactOptionalPropertyTypes` is enabled.

When in doubt, use `satisfies` to validate shape without widening:

```ts
const pipeline = [
  { name: 'lint', run: true },
  { name: 'typecheck', run: true }
] satisfies Array<{ name: string; run: boolean }>;
```

<a id="ts6-config"></a>
## Compiler configuration

A good `tsconfig.json` is the foundation for a reliable codebase.

Recommended base for PhilJS apps:

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "useDefineForClassFields": true,
    "isolatedModules": true,
    "isolatedDeclarations": true,
    "skipLibCheck": false,
    "types": ["@philjs/core"],
    "lib": ["ES2024", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

Config notes:

- `moduleResolution: bundler` matches modern toolchains and avoids CJS edge cases.
- `noUncheckedIndexedAccess` forces you to handle missing keys.
- `exactOptionalPropertyTypes` prevents `undefined` from silently slipping in.
- `isolatedModules` keeps you compatible with fast transpilers and Vite.
- `isolatedDeclarations` improves declaration emit for libraries.

For libraries:

- Set `declaration: true` and `declarationMap: true`.
- Emit to `dist` and keep `types` in `package.json` updated.

For apps:

- `noEmit: true` is fine because Vite handles emit.
- Keep `types` narrow to avoid slow editor performance.

Monorepo tips:

- Use a shared `tsconfig.base.json`.
- Add project references for faster incremental builds.
- Keep `paths` aligned with bundler aliases.

### Strictness flags that matter

These flags prevent subtle runtime bugs:

- `strictNullChecks`: forces you to handle `null` and `undefined`.
- `noImplicitOverride`: ensures overrides are intentional.
- `noUncheckedIndexedAccess`: forces safe access for `obj[key]`.
- `exactOptionalPropertyTypes`: optional does not mean `undefined` unless declared.

Together, they prevent the common problems of "missing data" and "wrong shape" that show up most often in loaders, actions, and SSR payloads.

<a id="ts6-types"></a>
## Types, unions, and intersections

TypeScript supports primitives, literals, unions, and intersections.

```ts
type Status = 'idle' | 'loading' | 'success' | 'error';

type ApiError = {
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'RATE_LIMIT';
  message: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: ApiError };
```

Intersections merge shapes:

```ts
type WithMeta = { createdAt: string; updatedAt: string };

type User = { id: string; email: string } & WithMeta;
```

Special types to know:

- `unknown`: safest top type. You must narrow before use.
- `never`: indicates an impossible value; great for exhaustive checks.
- `void`: for functions that return nothing.
- `any`: opt-out; avoid for public APIs.

### Literal unions for state

```ts
type Theme = 'light' | 'dark' | 'system';
```

Literal unions make UI state explicit and easy to exhaustively handle.

<a id="ts6-enums"></a>
## Enums and literal alternatives

TypeScript enums exist at runtime, while literal unions are compile-time only. Prefer literal unions for most PhilJS code because they are tree-shakeable and align with serialized SSR data.

```ts
// Prefer this
type Env = 'edge' | 'node';

// Over this, unless you need runtime enum values
enum EnvEnum {
  Edge = 'edge',
  Node = 'node'
}
```

If you do use enums, avoid `const enum` in libraries unless your build pipeline inlines them consistently.

<a id="ts6-narrowing"></a>
## Control-flow narrowing

TypeScript narrows types based on control flow. This is essential for safe loaders, route params, and SSR payloads.

```ts
function formatUser(user: User | null) {
  if (!user) return 'Guest';
  return user.email.toLowerCase();
}
```

Discriminated unions:

```ts
type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: ApiError };

function render(state: LoadState) {
  switch (state.status) {
    case 'idle':
      return 'Idle';
    case 'loading':
      return 'Loading';
    case 'success':
      return state.data.email;
    case 'error':
      return state.error.message;
  }
}
```

Other narrowing tools:

```ts
if ('id' in value) {
  // value is now narrowed to an object with id
}

if (value instanceof Error) {
  // value is Error
}
```

User-defined type guards:

```ts
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'email' in value;
}
```

Assertion functions (use sparingly):

```ts
function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) throw new Error('Not a user');
}
```

Type assertions should be rare. Prefer narrowing via guards or schema validation.

**Visual:** Type narrowing flow

![Type narrowing flow diagram](../../visuals/ts-narrowing-flow.svg "TypeScript narrowing flow")

<a id="ts6-functions"></a>
## Functions and overloads

Function types include parameters, return type, and optional `this` context.

```ts
type Loader<T> = (params: { request: Request }) => Promise<T>;
```

Overloads should be minimal. Use a single signature with unions when possible.

```ts
function parse(input: string): number;
function parse(input: string, radix: number): number;
function parse(input: string, radix?: number) {
  return Number.parseInt(input, radix ?? 10);
}
```

If you need `this` typing:

```ts
function onClick(this: HTMLButtonElement, ev: MouseEvent) {
  this.disabled = true;
}
```

Avoid `Function` or `any` in public APIs. Keep return types explicit for loaders and actions.

<a id="ts6-generics"></a>
## Generics and inference

Generics allow you to write reusable, type-safe utilities.

```ts
function identity<T>(value: T): T {
  return value;
}

function pick<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

Useful patterns:

- Constraints: `<T extends { id: string }>`
- Defaults: `<T = string>`
- Inference helpers: `ReturnType`, `Parameters`, `Awaited`

Const type parameters (TS6) preserve literal inference:

```ts
function defineRoute<const T extends string>(path: T) {
  return { path } as const;
}
```

Use `satisfies` for configs to validate shape without widening:

```ts
const routes = [
  { path: '/', auth: false },
  { path: '/account', auth: true }
] satisfies Array<{ path: string; auth: boolean }>;
```

### Indexed access and `keyof`

```ts
type UserEmail = User['email'];

function getField<T, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}
```

### Conditional inference patterns

Conditional types with `infer` let you extract parts of a type without duplicating it:
```ts
type LoaderReturn<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;

type ParamsOf<T> = T extends (params: infer P) => any ? P : never;
```

This is useful for keeping component props aligned with loader return types. Use it to reduce duplication, but avoid overusing it when it makes the code harder to read.
<a id="ts6-objects"></a>
## Object types and safety flags

Object types are the backbone of PhilJS state, props, and data contracts.

```ts
type User = {
  id: string;
  email: string;
  name?: string;
};
```

Important flags:

- `noUncheckedIndexedAccess`: `obj[key]` becomes `T | undefined`.
- `exactOptionalPropertyTypes`: optional props do not accept `undefined` unless specified.

Use index signatures sparingly. Prefer explicit property types.

```ts
type HeaderMap = Record<string, string>;
```

Readonly and tuples:

```ts
type Point = readonly [number, number];
const origin: Point = [0, 0];
```

Excess property checks prevent accidental typos:

```ts
const user: User = { id: 'u1', email: 'a@b.com', extra: true }; // error
```

<a id="ts6-tuples"></a>
## Tuples, arrays, and readonly data

Tuples encode fixed-length arrays with typed positions. They are useful for route params, cache keys, and small coordinate pairs.

```ts
type CacheKey = readonly ['user', string];
const key: CacheKey = ['user', 'u1'];
```

Optional tuple elements:

```ts
type Range = [start: number, end?: number];
```

Readonly arrays help prevent accidental mutations in SSR payloads and shared caches:

```ts
type ReadonlyUsers = ReadonlyArray<User>;
```

<a id="ts6-classes"></a>
## Classes, interfaces, and the type system

Classes are optional in PhilJS, but they appear in adapters and external libraries.

```ts
interface Cache {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

class MemoryCache implements Cache {
  private store = new Map<string, string>();
  get(key: string) { return this.store.get(key) ?? null; }
  set(key: string, value: string) { this.store.set(key, value); }
}
```

Prefer `private` fields for simple encapsulation. Use `#private` when you need runtime privacy.

Use `implements` to validate shape and `override` to ensure correct method signatures.

<a id="ts6-modules"></a>
## Modules and the type/value split

TypeScript distinguishes types from values. Use `type` imports for clarity and better tree-shaking.

```ts
import type { User } from './types';
import { fetchUser } from './api';
```

`verbatimModuleSyntax` forces you to be explicit about value vs type imports and aligns with ESM tooling.

Common ESM patterns:

- `export type { User } from './types';`
- `export { fetchUser } from './api';`
- Avoid `export =` or `namespace` in modern projects.

When building libraries, set `"types"` in `package.json` and keep ESM/CJS exports consistent.

### Module resolution and exports

Modern packages should declare `exports` and `types` in `package.json` so TypeScript and bundlers agree:

```json
{
  "name": "@philjs/core",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "types": "./dist/index.d.ts"
}
```

If you ship multiple entry points, keep a `types` file for each entry. Avoid mixed CJS/ESM unless you must support legacy tooling.

<a id="ts6-declarations"></a>
## Declaration merging and module augmentation

TypeScript can merge declarations with the same name. This is useful for extending global types or augmenting third-party modules.

```ts
declare global {
  interface Window {
    __PHILJS_VERSION__: string;
  }
}
```

Module augmentation lets you extend existing packages:

```ts
declare module '@philjs/router' {
  export interface RouteMeta {
    requiresAuth?: boolean;
  }
}
```

Use augmentation sparingly and keep it close to the consuming code so the intent is clear.

<a id="ts6-utility"></a>
## Utility, mapped, and conditional types

Utility types help you reshape existing types safely.

```ts
type PartialUser = Partial<User>;
type RequiredUser = Required<User>;
type UserPreview = Pick<User, 'id' | 'email'>;
type WithoutName = Omit<User, 'name'>;
```

Mapped types:

```ts
type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};
```

Conditional types:

```ts
type ExtractId<T> = T extends { id: infer I } ? I : never;
```

Distribution happens over unions:

```ts
type ToArray<T> = T extends unknown ? T[] : never;
```

### Type-level programming patterns

These patterns show up in real codebases:

```ts
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type XOR<A, B> =
  | (A & { [K in keyof B]?: never })
  | (B & { [K in keyof A]?: never });
```

Use these sparingly. When types become hard to read, prefer runtime validation and simpler static types.

<a id="ts6-template-literals"></a>
## Template literal types

Template literal types are powerful for routes and cache tags.

```ts
type RoutePath = `/users/${string}` | `/teams/${string}`;

type CacheTag = `user:${string}` | `team:${string}`;
```

Use them to encode invariants the compiler can enforce.

<a id="ts6-async"></a>
## Async typing and error models

Prefer explicit result types for async boundaries.

```ts
type ApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiError };

async function fetchUser(id: string): Promise<ApiResult<User>> {
  // ...
}
```

Use `Promise.allSettled` for batch loaders with partial success:

```ts
const results = await Promise.allSettled(tasks);
results.forEach((r) => {
  if (r.status === 'fulfilled') {
    // r.value
  } else {
    // r.reason
  }
});
```

Avoid throwing raw errors across loader/action boundaries. Convert to typed results or normalized error shapes.

### Error modeling patterns

Two common styles work well for PhilJS:

1. **Result unions** (best for predictable UI state)
2. **Thrown errors** at the boundary (best for infrastructure failures)

Example with error codes:

```ts
type ErrorCode = 'UNAUTHORIZED' | 'NOT_FOUND' | 'RATE_LIMIT';

type ApiError = { code: ErrorCode; message: string };
type ApiResult<T> = { ok: true; value: T } | { ok: false; error: ApiError };
```

Use `never` to enforce exhaustive switches:

```ts
function assertNever(x: never): never {
  throw new Error(`Unexpected: ${x}`);
}
```

For loaders that support cancellation, include `AbortSignal` in your types and pass it to `fetch`:

```ts
type LoaderContext = { request: Request; signal: AbortSignal };
```

<a id="ts6-jsx"></a>
## JSX and PhilJS typing

JSX types drive props, children, and event handling.

```ts
import type { ComponentProps } from '@philjs/core';

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost';
};
```

Event typing:

```ts
const onInput = (ev: InputEvent & { target: HTMLInputElement }) => {
  const value = ev.target.value;
};
```

PhilJS loader and action types should be explicit and reusable:

```ts
type UserLoader = () => Promise<{ user: User } | { user: null }>;
```

If you build component libraries, publish `ComponentProps` helpers to keep type inference intact.

### JSX namespace and intrinsic elements

JSX typing relies on the `JSX` namespace. In PhilJS, intrinsic elements map to DOM elements, and custom components are inferred from function signatures.

If you need to extend intrinsic props, use module augmentation:

```ts
declare namespace JSX {
  interface IntrinsicElements {
    'x-chip': { label: string };
  }
}
```

Prefer `ComponentProps<'button'>` for native props and `PropsWithChildren` for components that accept children.

### DOM and event typing

DOM events are generic in TypeScript. Narrow the event target to get safe access to `value`, `checked`, or `files`:

```ts
const onSubmit = (ev: SubmitEvent & { target: HTMLFormElement }) => {
  ev.preventDefault();
  const form = new FormData(ev.target);
  const email = String(form.get('email') ?? '');
};

const onToggle = (ev: Event & { target: HTMLInputElement }) => {
  const enabled = ev.target.checked;
};
```

For keyboard and mouse events, prefer built-in DOM types like `KeyboardEvent` and `MouseEvent` to avoid `any`.

<a id="ts6-interop"></a>
## Interop with JavaScript

Use `unknown` at boundaries and validate with schemas.

```ts
function parseJson<T>(raw: string, validate: (v: unknown) => v is T): T {
  const data: unknown = JSON.parse(raw);
  if (!validate(data)) throw new Error('Invalid payload');
  return data;
}
```

For JS packages without types, add minimal `*.d.ts` files instead of using `any` everywhere.

```ts
declare module 'legacy-lib' {
  export function doThing(input: string): string;
}
```

For globals:

```ts
declare global {
  interface Window {
    __PHILJS_VERSION__: string;
  }
}
```

<a id="ts6-migration"></a>
## Migration from JavaScript

For existing JS projects, migrate incrementally:

- Start with `allowJs: true` and `checkJs: true` to get type checking without converting files.
- Convert leaf modules first (utility and domain logic), then move toward UI and routing.
- Replace `// @ts-ignore` with `// @ts-expect-error` once you understand the error.

You can also annotate JS with JSDoc:

```js
// @ts-check
/** @typedef {{ id: string, email: string }} User */
/** @param {User} user */
function greet(user) {
  return `Hello ${user.email}`;
}
```

Use JSDoc to narrow types before you fully convert files to TS.
<a id="ts6-testing"></a>
## Testing types

Type-level tests prevent API drift.

```ts
import { expectTypeOf } from 'vitest';

expectTypeOf<ReturnType<typeof loader>>().toMatchTypeOf<{ user: User }>();
```

You can also use `tsd` for dedicated `.test-d.ts` files.

Use `// @ts-expect-error` to document intentional errors in tests. Avoid `// @ts-ignore` when possible.

### Debugging type errors

When the compiler reports a complex type error:

- Inline the type with `type X = ...` and hover in the editor.
- Break large unions into smaller named types.
- Use `as const` to avoid literal widening.
- Add intermediate variables to force inference.
If an error mentions a massive inferred type, simplify the function signature with explicit generics or return types.

<a id="ts6-performance"></a>
## Build performance and project references

Large repos need fast builds:

- Enable `incremental` and `composite` for project references.
- Split huge type declarations into smaller modules.
- Avoid massive union types or `any`-like escape hatches.
- Use `skipLibCheck: true` only when performance is critical and libs are trusted.

Project reference example:

```json
{
  "references": [
    { "path": "../packages/core" },
    { "path": "../packages/router" }
  ]
}
```

Use `tsc -b` for multi-project builds and `tsc --watch` for incremental dev feedback.

Editor performance tips:

- Keep `types` lists small to avoid loading unnecessary globals.
- Split large `*.d.ts` files into modules.
- Prefer `skipLibCheck` only when you trust dependencies and need faster CI.

<a id="ts6-patterns"></a>
## Real-world patterns for PhilJS

### Typed route params

```ts
type Params = { id: string };

function parseParams(params: Record<string, string | undefined>): Params {
  if (!params.id) throw new Error('Missing id');
  return { id: params.id };
}
```

### Loader results as discriminated unions

```ts
type LoaderResult =
  | { status: 'ok'; user: User }
  | { status: 'not-found' };
```

### Safe config validation

```ts
type AppConfig = { apiUrl: string; featureFlags: string[] };

function parseConfig(env: Record<string, string | undefined>): AppConfig {
  if (!env.API_URL) throw new Error('Missing API_URL');
  return { apiUrl: env.API_URL, featureFlags: (env.FLAGS ?? '').split(',') };
}
```

### Schema-style validation

If you use a schema library, keep the inferred type close to the schema and export it for reuse:

```ts
// pseudo-code pattern
const UserSchema = {
  id: (v: unknown) => typeof v === 'string',
  email: (v: unknown) => typeof v === 'string'
};

type User = { id: string; email: string };
```

The goal is one source of truth: validate at runtime, type-check at compile time.

### Branded IDs

```ts
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<string, 'UserId'>;
```

### Cache tags with template literals

```ts
type CacheTag = `user:${string}` | `project:${string}`;

function tagUser(id: string): CacheTag {
  return `user:${id}`;
}
```

### Typed loaders and actions

Keep loader and action shapes explicit to avoid inference drift:

```ts
type LoaderData = { user: User | null; lastLogin?: string };

type Loader = (ctx: { request: Request }) => Promise<LoaderData>;
type Action = (ctx: { request: Request }) => Promise<{ ok: true } | { ok: false; error: ApiError }>;
```

If you expose loader data to components, export the type so component props stay aligned.

### Store selectors with `keyof`

```ts
type StoreState = { theme: 'light' | 'dark'; locale: string };

function select<K extends keyof StoreState>(state: StoreState, key: K): StoreState[K] {
  return state[key];
}
```

<a id="ts6-using"></a>
## TS6 `using` and disposal

TypeScript 6 adds `using` to model deterministic cleanup when types implement `Symbol.dispose` or `Symbol.asyncDispose`.

```ts
class TempFile {
  constructor(private path: string) {}
  [Symbol.dispose]() {
    // cleanup
  }
}

using file = new TempFile('/tmp/data');
```

Use `using` for resource cleanup in tooling, tests, or server utilities.

<a id="ts6-pitfalls"></a>
## Common pitfalls and fixes

These issues show up frequently in PhilJS apps:

- **Widened literals**: a config field becomes `string` instead of `'edge'`. Fix with `as const` or `satisfies`.
- **`any` from JSON**: `JSON.parse` returns `any` by default. Wrap it in a parser that returns `unknown` and validates.
- **Optional vs undefined**: with `exactOptionalPropertyTypes`, `name?: string` does not accept `undefined`. Use `name?: string | undefined` if you need it.
- **Unchecked index access**: `obj[key]` becomes `T | undefined` with `noUncheckedIndexedAccess`. Handle missing keys explicitly.
- **Excess property checks**: inline object literals get checked more strictly. Assign to a typed variable first if needed.
- **Accidental `as`**: using assertions to silence the compiler can hide bugs. Prefer guards or schemas.
- **Non-serializable SSR data**: `Date`, `Map`, and `Set` do not serialize cleanly. Convert to strings or arrays.
- **Type/value confusion**: `import type` vs `import` matters with `verbatimModuleSyntax`. Use `import type` when you only need types.

Treat compiler errors as design feedback. If something is hard to type, it might be hard to reason about.
<a id="ts6-checklists"></a>
## Checklists and exercises

### Checklist: safer types

- Use `unknown` at boundaries and narrow early.
- Prefer discriminated unions for state machines.
- Keep loader/action return types explicit.
- Avoid `any` in public surfaces.
- Use `satisfies` for config objects.
- Avoid `as` assertions in shared libraries.

### Exercises

1. Create a union type for loader states and make an exhaustive `switch`.
2. Write a `defineRoute` helper using const type parameters.
3. Add `expectTypeOf` tests for a component that forwards props.
4. Build a branded ID type for `ProjectId` and use it in two functions.
5. Model an API error type and enforce it in a loader.
6. Add a type guard for `CacheTag` values and use it in invalidation helpers.

## Links

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig)
- [PhilJS Installation](../getting-started/installation.md)



