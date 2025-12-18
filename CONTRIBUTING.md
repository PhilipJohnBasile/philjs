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

We use Prettier for code formatting. Configuration is in `.prettierrc`:

- Use 2 spaces for indentation
- Use double quotes for strings (per Prettier config)
- No trailing commas (per Prettier config)
- Max line length: 100 characters
- Use semicolons

**Format your code before committing:**

```bash
pnpm exec prettier --write .
```

```typescript
// ✅ Good
const items = [
  "item1",
  "item2",
  "item3"
];

// ❌ Bad - will be auto-formatted
const items = [
  'item1',
  'item2',
  'item3',
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

## Release Process

PhilJS uses [Changesets](https://github.com/changesets/changesets) for version management and publishing. This process is primarily handled by maintainers, but understanding it can help contributors.

### For Contributors

When your PR introduces changes that should be reflected in a version bump, you need to add a changeset:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages are affected
2. Choose the bump type (major, minor, patch)
3. Write a summary of the changes

**When to add a changeset:**
- New features (minor bump)
- Bug fixes (patch bump)
- Breaking changes (major bump)
- API changes

**When NOT to add a changeset:**
- Documentation updates
- Test improvements
- Internal refactoring with no API changes
- CI/build configuration changes

### For Maintainers

#### 1. Version Packages

When ready to release, create a PR with version bumps:

```bash
pnpm changeset version
```

This will:
- Update package versions based on changesets
- Update CHANGELOGs
- Remove consumed changeset files

#### 2. Review and Merge

Review the version bump PR:
- Check that all versions are correct
- Verify CHANGELOG entries
- Ensure no unintended changes

Merge the PR to the main branch.

#### 3. Publish to npm

After merging the version bump PR:

```bash
# Ensure you're on main and up to date
git checkout main
git pull

# Build all packages
pnpm build

# Publish to npm (requires npm authentication)
pnpm release
```

This will publish all changed packages to npm.

#### 4. Create GitHub Release

After publishing:
1. Go to [GitHub Releases](https://github.com/philjs/philjs/releases)
2. Click "Draft a new release"
3. Use the version as the tag (e.g., `v1.0.0`)
4. Copy the CHANGELOG entries as the release notes
5. Publish the release

### Release Schedule

- **Patch releases**: As needed for critical bug fixes
- **Minor releases**: Bi-weekly for new features
- **Major releases**: Quarterly or when breaking changes are necessary

### Pre-release Versions

For testing before official releases:

```bash
# Create a pre-release version
pnpm changeset version --snapshot canary

# Publish pre-release
pnpm changeset publish --tag canary
```

Users can install pre-releases with:

```bash
pnpm add philjs-core@canary
```

## Recognition

Contributors are recognized in:

- Release notes
- Contributors page
- Package README files
- GitHub contributor graph

## Questions?

- 💬 [GitHub Discussions](https://github.com/philjs/philjs/discussions)
- 💬 [Discord](https://discord.gg/philjs)
- 📧 Email: team@philjs.dev

## License

By contributing to PhilJS, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to PhilJS!** 🎉
