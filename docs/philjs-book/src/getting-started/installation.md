# Installation

PhilJS projects are TypeScript-first and require Node 24+.

## Prerequisites

- Node.js 24+ (Node 25 supported)
- pnpm 9+
- TypeScript 6.x

## Create a New Project

```bash
pnpm create philjs my-app
cd my-app
pnpm install
pnpm dev
```

## Add to an Existing Project

```bash
pnpm add @philjs/core @philjs/router @philjs/ssr
```

Pin packages to the current preview version:

```json
{
  "dependencies": {
    "@philjs/core": "^0.1.0",
    "@philjs/router": "^0.1.0",
    "@philjs/ssr": "^0.1.0"
  }
}
```
