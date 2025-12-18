# PhilJS CLI - Quick Start Guide

## Installation

```bash
# Install globally
npm install -g philjs-cli

# Or use with npx (no install needed)
npx philjs [command]
```

## Create a New Project

```bash
# Interactive setup
philjs create my-app

# Follow prompts to select:
# - Template (basic/ssr/spa/fullstack/library)
# - TypeScript or JavaScript
# - CSS framework (Tailwind/CSS Modules/Styled/None)
# - Testing (Vitest/Jest)
# - Linting (ESLint + Prettier)
# - Git initialization
# - Package manager
```

## Add Features to Existing Project

```bash
# Interactive feature selection
philjs add

# Or add specific feature
philjs add ssr          # Add server-side rendering
philjs add tailwind     # Add Tailwind CSS
philjs add testing      # Add Vitest testing
philjs add graphql      # Add GraphQL
philjs add pwa          # Add PWA support
philjs add i18n         # Add internationalization
philjs add analytics    # Add analytics
philjs add auth         # Add authentication
```

## Migrate from Other Frameworks

```bash
# Analyze and generate migration guide
philjs migrate react    # From React
philjs migrate vue      # From Vue
philjs migrate svelte   # From Svelte

# Creates MIGRATION_REPORT.md with:
# - Component analysis
# - Conversion patterns
# - Code examples
# - Step-by-step guide
```

## Development Commands

```bash
# Start dev server
philjs dev              # http://localhost:3000
philjs dev -p 8080      # Custom port
philjs dev --open       # Open browser

# Build for production
philjs build            # Standard build
philjs build --ssg      # Static site generation
philjs build --analyze  # With bundle analysis

# Preview production build
philjs preview

# Run tests
philjs test             # Run once
philjs test --watch     # Watch mode
philjs test --coverage  # With coverage
```

## Code Generation

```bash
# Generate component
philjs g component Button
philjs g c Avatar --with-styles

# Generate route
philjs g route products
philjs g r user/:id

# Generate page
philjs g page About
philjs g p Contact --js

# Generate hook
philjs g hook useWindowSize
philjs g h useFetch

# Generate store
philjs g store cart
philjs g s userStore
```

## Project Templates

### Basic
Simple starter with signals and routing
```bash
philjs create my-app
# Select: basic template
```

### SSR
Server-side rendering with islands
```bash
philjs create my-ssr-app
# Select: ssr template
```

### SPA
Single page application
```bash
philjs create my-spa
# Select: spa template
```

### Fullstack
SSR + API + Database
```bash
philjs create my-fullstack
# Select: fullstack template
```

### Library
Component library
```bash
philjs create my-lib
# Select: library template
```

## Common Workflows

### Start New Project
```bash
philjs create awesome-app
cd awesome-app
npm install
npm run dev
```

### Add SSR to Existing App
```bash
cd my-app
philjs add ssr
npm install
npm run dev:ssr
```

### Migrate React App
```bash
cd my-react-app
philjs migrate react
# Read MIGRATION_REPORT.md
# Follow migration steps
```

### Generate Components
```bash
philjs g c Header --with-styles
philjs g c Footer
philjs g c ProductCard
```

## Help & Documentation

```bash
# General help
philjs --help

# Command-specific help
philjs create --help
philjs add --help
philjs migrate --help
philjs generate --help
```

## Tips

- Use **Tab** to autocomplete in prompts
- Press **Ctrl+C** to cancel operations
- Use `--js` flag for JavaScript instead of TypeScript
- Use `--no-test` to skip test file generation
- Check `CLI_DOCUMENTATION.md` for detailed docs

## Next Steps

1. Create your first project: `philjs create my-app`
2. Start development: `npm run dev`
3. Generate components: `philjs g component MyComponent`
4. Build for production: `npm run build`
5. Read full docs: `CLI_DOCUMENTATION.md`

## Resources

- [PhilJS Documentation](https://philjs.dev)
- [CLI Documentation](./CLI_DOCUMENTATION.md)
- [API Reference](https://philjs.dev/docs/api)
- [Examples](https://philjs.dev/examples)
- [GitHub](https://github.com/yourusername/philjs)

## Support

- GitHub Issues: Report bugs and request features
- Discord: Join the community
- Documentation: Comprehensive guides and examples

---

**Happy coding with PhilJS!** The framework that thinks ahead.
