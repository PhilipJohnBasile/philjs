# eslint-config-philjs

ESLint configuration with accessibility and security plugins for PhilJS projects.

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

## License

MIT
