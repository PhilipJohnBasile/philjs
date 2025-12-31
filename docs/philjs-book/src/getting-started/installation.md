# Installation

PhilJS projects are TypeScript-first and require Node 24+.

## Prerequisites

- Node.js 24+ (Node 25 supported)
- pnpm 9.15+
- TypeScript 6.x

## Verify your toolchain

```bash
node --version
pnpm --version
```

## Create a new project

```bash
pnpm create philjs my-app
cd my-app
pnpm install
pnpm dev
```

## Add PhilJS to an existing project

```bash
pnpm add @philjs/core @philjs/router @philjs/ssr
```

## Pin package versions

```json
{
  "dependencies": {
    "@philjs/core": "^0.1.0",
    "@philjs/router": "^0.1.0",
    "@philjs/ssr": "^0.1.0"
  },
  "engines": {
    "node": ">=24"
  }
}
```

## TypeScript configuration

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core",
    "strict": true,
    "types": ["@philjs/core"]
  }
}
```
