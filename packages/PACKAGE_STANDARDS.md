# PhilJS Package Standards

## Naming Conventions

### Package Names
- All packages use `@philjs/` scope: `@philjs/core`, `@philjs/router`, etc.
- Exceptions (npm conventions):
  - `create-philjs` - CLI scaffolding tool
  - `eslint-config-philjs` - ESLint config
  - `eslint-plugin-philjs` - ESLint plugin
  - `cargo-philjs` - Cargo CLI tool (Rust)

### Directory Names
- Use `philjs-{name}` format: `philjs-core`, `philjs-router`, etc.
- Match the scope name: `philjs-core` → `@philjs/core`

### File Naming
- Use kebab-case: `jsx-runtime.ts`, `render-to-string.ts`
- Test files: `*.test.ts`
- Benchmark files: `*.bench.ts`
- Type-only files: `types.ts`

## Package.json Standard Structure

```json
{
  "name": "@philjs/{name}",
  "version": "0.1.0",
  "description": "Description here",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist", "src"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "keywords": ["philjs", "{name}"],
  "author": "PhilJS Team",
  "license": "MIT",
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "peerDependencies": {
    "@philjs/core": ">=0.1.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

## Export Order (Important!)

Exports MUST be in this order:
1. `types` - TypeScript declarations first
2. `import` - ESM entry point
3. `require` - CJS entry point (fallback)

## Version Conventions

- `0.x.x` - Pre-release/experimental
- `1.x.x` - Stable release
- Use `workspace:*` for internal dependencies

## Keywords

Every package should include:
- `philjs` (always first)
- Package-specific keywords
- Feature keywords

## Cross-Package References

Always use the scoped name:
```json
{
  "dependencies": {
    "@philjs/core": "workspace:*"
  },
  "peerDependencies": {
    "@philjs/core": ">=0.1.0"
  }
}
```
