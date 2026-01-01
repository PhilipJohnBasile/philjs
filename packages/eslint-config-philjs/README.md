# eslint-config-philjs

ESLint configuration with accessibility and security plugins for PhilJS projects.

<!-- PACKAGE_GUIDE_START -->
## Overview

ESLint config with a11y and security plugins for PhilJS

## Entry Points

- packages/eslint-config-philjs/src/index.ts

## Quick Start

```ts
import * as eslint_config_philjs from 'eslint-config-philjs';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- (none detected)
<!-- PACKAGE_GUIDE_END -->

## Features

- **Accessibility Rules** - JSX a11y plugin for WCAG compliance
- **Security Rules** - Security plugin to catch vulnerabilities
- **PhilJS Best Practices** - Framework-specific linting rules
- **TypeScript Support** - Works with TypeScript projects

## Installation

```bash
pnpm add -D eslint-config-philjs eslint
```

## Usage

Create `.eslintrc.js`:

```javascript
export default {
  extends: ['eslint-config-philjs']
};
```

Or in `package.json`:

```json
{
  "eslintConfig": {
    "extends": ["eslint-config-philjs"]
  }
}
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/eslint-config-philjs/src/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
