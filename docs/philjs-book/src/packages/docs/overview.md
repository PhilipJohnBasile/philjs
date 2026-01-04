# @philjs/docs

Documentation generation and API reference tools for PhilJS projects.

## Installation

```bash
npm install @philjs/docs --save-dev
```

## Overview

`@philjs/docs` provides documentation tools for PhilJS:

- **API Documentation**: Auto-generate from TypeScript
- **Component Docs**: Extract from JSDoc and props
- **Markdown Processing**: MDX support
- **Code Examples**: Live code playground
- **Search**: Full-text documentation search
- **Versioning**: Multi-version docs support

## Quick Start

```typescript
import { generateDocs, DocConfig } from '@philjs/docs';

const config: DocConfig = {
  input: './src',
  output: './docs',
  title: 'My PhilJS App',
  logo: './logo.svg',
};

await generateDocs(config);
```

## Configuration

```typescript
interface DocConfig {
  // Source directory
  input: string;

  // Output directory
  output: string;

  // Project title
  title: string;

  // Logo path
  logo?: string;

  // Include patterns
  include?: string[];

  // Exclude patterns
  exclude?: string[];

  // Theme
  theme?: 'light' | 'dark' | 'auto';

  // Enable search
  search?: boolean;

  // Custom pages
  pages?: PageConfig[];
}
```

## Component Documentation

```typescript
/**
 * A button component with various styles.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export function Button(props: ButtonProps) {
  // ...
}
```

## CLI Usage

```bash
# Generate docs
npx philjs-docs generate

# Serve docs locally
npx philjs-docs serve

# Build for production
npx philjs-docs build
```

## See Also

- [@philjs/storybook](../storybook/overview.md) - Component stories
- [@philjs/cli](../cli/overview.md) - CLI tools
