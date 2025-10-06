# Contributing to PhilJS

Thank you for your interest in contributing to PhilJS! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make PhilJS better.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/philjs.git
cd philjs
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/philjs/philjs.git
```

## Development Setup

### Install Dependencies

```bash
pnpm install
```

### Build All Packages

```bash
pnpm build
```

### Build Specific Package

```bash
pnpm --filter philjs-core build
```

### Development Mode

```bash
# Watch mode for a specific package
pnpm --filter philjs-core build --watch

# Run dev server (for examples)
pnpm dev
```

## Project Structure

```
philjs/
├── packages/
│   ├── philjs-core/          # Core reactivity system
│   ├── philjs-router/        # Routing
│   ├── philjs-ssr/           # Server-side rendering
│   ├── philjs-devtools/      # Development tools
│   ├── philjs-islands/       # Islands architecture
│   ├── philjs-ai/            # AI integration
│   ├── create-philjs/        # Project scaffolding
│   └── eslint-config-philjs/ # ESLint configuration
├── examples/                 # Example applications
│   ├── storefront/           # E-commerce demo
│   └── docs-site/            # Documentation site
├── docs/                     # Documentation
├── scripts/                  # Build and utility scripts
└── .changeset/               # Changesets for versioning
```

### Package Structure

Each package follows this structure:

```
packages/philjs-core/
├── src/
│   ├── index.ts              # Main entry point
│   ├── signals.ts            # Signal implementation
│   ├── signals.test.ts       # Tests
│   └── ...
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript config
├── rollup.config.js          # Build configuration
└── README.md                 # Package documentation
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Build, CI, or tooling changes

### 2. Make Changes

- Write code following our [Coding Standards](#coding-standards)
- Add tests for new features
- Update documentation
- Run tests locally

### 3. Commit Changes

Follow our [Commit Guidelines](#commit-guidelines):

```bash
git add .
git commit -m "feat(core): add new feature"
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Specific Package Tests

```bash
pnpm --filter philjs-core test
```

### Watch Mode

```bash
pnpm --filter philjs-core test --watch
```

### Coverage

```bash
pnpm test --coverage
```

### Writing Tests

Place tests next to source files with `.test.ts` extension:

```typescript
// signals.test.ts
import { describe, it, expect } from 'vitest';
import { signal } from './signals';

describe('signal()', () => {
  it('creates reactive state', () => {
    const count = signal(0);
    expect(count()).toBe(0);
  });

  it('updates value', () => {
    const count = signal(0);
    count.set(5);
    expect(count()).toBe(5);
  });
});
```

## Documentation

### Documentation Structure

Documentation is in the `docs/` directory:

```
docs/
├── getting-started/
├── core-concepts/
├── api-reference/
├── best-practices/
└── troubleshooting/
```

### Writing Documentation

- Use clear, concise language
- Include code examples
- Add TypeScript types
- Cross-reference related topics
- Test all code examples

### Example Documentation

````markdown
# Feature Name

Brief description of the feature.

## Usage

```tsx
import { feature } from 'philjs-core';

// Example code
const example = feature();
```

## API

### `feature(options)`

Description of the function.

**Parameters:**
- `options` (object) - Configuration options
  - `option1` (string) - Description
  - `option2` (number) - Description

**Returns:** Description of return value

**Example:**

```tsx
const result = feature({
  option1: 'value',
  option2: 42
});
```
````

## Pull Request Process

### Before Submitting

- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Documentation updated
- [ ] Changeset added (if needed)

### Creating a Changeset

For version bumps:

```bash
pnpm changeset
```

Follow the prompts to describe your changes.

### PR Description

Include:

1. **What** - What does this PR do?
2. **Why** - Why is this change needed?
3. **How** - How does it work?
4. **Testing** - How was it tested?

Example:

```markdown
## What

Adds support for async memos.

## Why

Users requested the ability to use async functions in memos for data fetching.

## How

- Modified memo() to detect async functions
- Added Promise unwrapping
- Updated type definitions

## Testing

- Added unit tests for async memos
- Tested with real async operations
- Updated documentation examples
```

### Review Process

1. Automated checks run (tests, linting, TypeScript)
2. Maintainers review code
3. Address feedback
4. Once approved, PR is merged

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type annotations
- Avoid `any` type
- Use generics where appropriate

```typescript
// ✅ Good
function signal<T>(initialValue: T): Signal<T> {
  // ...
}

// ❌ Bad
function signal(initialValue: any): any {
  // ...
}
```

### Naming Conventions

- **Variables/Functions**: camelCase
- **Classes/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case or camelCase

```typescript
// Variables and functions
const userName = 'Alice';
function getUserData() {}

// Classes and interfaces
class UserService {}
interface UserData {}

// Constants
const MAX_RETRIES = 3;

// Files
user-service.ts
getUserData.ts
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas
- Max line length: 100 characters
- Use semicolons

```typescript
// ✅ Good
const items = [
  'item1',
  'item2',
  'item3',
];

// ❌ Bad
const items = [
  "item1",
  "item2",
  "item3"
]
```

### Comments

- Write clear, concise comments
- Explain "why", not "what"
- Use JSDoc for public APIs

```typescript
/**
 * Creates a reactive signal
 *
 * @param initialValue - The initial value
 * @returns A signal object with get/set methods
 *
 * @example
 * ```ts
 * const count = signal(0);
 * count(); // 0
 * count.set(5); // 5
 * ```
 */
export function signal<T>(initialValue: T): Signal<T> {
  // Implementation
}
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build, CI, or tooling changes
- `perf`: Performance improvements

### Scopes

- `core`: philjs-core
- `router`: philjs-router
- `ssr`: philjs-ssr
- `devtools`: philjs-devtools
- `islands`: philjs-islands
- `ai`: philjs-ai
- `docs`: Documentation
- `examples`: Examples

### Examples

```
feat(core): add async memo support

Allows memo() to accept async functions and automatically
unwrap promises.

Closes #123
```

```
fix(router): prevent memory leak in route matching

Route patterns were not being cleaned up properly.

Fixes #456
```

```
docs(getting-started): improve quickstart guide

- Add more examples
- Clarify installation steps
- Fix code samples
```

## Issue Guidelines

### Before Creating an Issue

1. Search existing issues
2. Check documentation
3. Try latest version

### Bug Reports

Include:

- **Description**: Clear description of the bug
- **Reproduction**: Minimal code to reproduce
- **Expected**: What should happen
- **Actual**: What actually happens
- **Environment**: Browser, Node version, PhilJS version

Example:

```markdown
**Bug Description**
Signal updates don't trigger effects in certain cases.

**Reproduction**
```ts
const count = signal(0);

effect(() => {
  if (count() > 5) {
    console.log('High');
  }
});

count.set(10); // Effect doesn't run!
```

**Expected**
Effect should run and log "High"

**Actual**
Effect doesn't run

**Environment**
- PhilJS: 1.0.0
- Node: 18.0.0
- Browser: Chrome 120
```

### Feature Requests

Include:

- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Other approaches considered
- **Examples**: Code examples of proposed API

## Recognition

Contributors are recognized in:

- Release notes
- Contributors page
- Package README files

## Questions?

- 💬 [GitHub Discussions](https://github.com/philjs/philjs/discussions)
- 💬 [Discord](https://discord.gg/philjs)
- 📧 Email: team@philjs.dev

## License

By contributing to PhilJS, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to PhilJS!** 🎉
