# Contributing to PhilJS

Thank you for your interest in contributing to PhilJS! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Rust 1.70+ (for Rust packages)
- wasm-pack (for WASM builds)

### Setup

\`\`\`bash
# Clone the repo
git clone https://github.com/PhilipJohnBasile/philjs.git
cd philjs

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
\`\`\`

## Project Structure

\`\`\`
philjs/
├── packages/           # NPM packages
│   ├── philjs-core/    # Core reactivity
│   ├── philjs-router/  # Routing
│   ├── philjs-ssr/     # Server rendering
│   └── ...
├── crates/             # Rust crates
│   ├── philjs-rust/    # Rust framework
│   └── philjs-macros/  # Proc macros
├── docs/               # Documentation
└── benchmarks/         # Performance tests
\`\`\`

## Development Workflow

### 1. Create a Branch

\`\`\`bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-bugfix
\`\`\`

### 2. Make Changes

- Write clear, concise code
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

\`\`\`bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter philjs-core test

# Run Rust tests
cargo test
\`\`\`

### 4. Submit a Pull Request

- Write a clear PR description
- Reference any related issues
- Ensure CI passes

## Commit Messages

We use conventional commits:

\`\`\`
feat: add new feature
fix: fix a bug
docs: update documentation
test: add tests
refactor: code refactoring
perf: performance improvement
chore: maintenance
\`\`\`

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer functional patterns
- Document public APIs with JSDoc

### Rust

- Follow Rust idioms
- Use \`cargo fmt\` and \`cargo clippy\`
- Document with rustdoc comments

## Testing

- Write unit tests for utilities
- Write integration tests for components
- Aim for >80% coverage on core packages

## Documentation

- Update README for user-facing changes
- Add JSDoc/rustdoc for public APIs
- Include examples in documentation

## Community

- [Discord](https://discord.gg/philjs)
- [GitHub Discussions](https://github.com/PhilipJohnBasile/philjs/discussions)
- [Twitter](https://twitter.com/philjs_dev)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
