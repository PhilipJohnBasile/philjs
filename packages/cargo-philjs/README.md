# cargo-philjs

**The ultimate CLI for building PhilJS applications** - Best-in-class developer experience for Rust web development.

cargo-philjs is a powerful Cargo subcommand that provides everything you need to create, develop, build, and deploy PhilJS applications with maximum productivity.

## Features

- **Project Scaffolding** - Multiple templates (SPA, SSR, Fullstack, API, Static Site, Component Library)
- **Hot Reload** - Lightning-fast development with incremental compilation
- **Optimized Builds** - Production builds with WASM optimization and tree-shaking
- **Code Generation** - Scaffold components, pages, API routes, and more
- **Type Checking** - Integrated Clippy and rustfmt support
- **Testing** - Run unit and integration tests with coverage
- **Deployment** - One-command deploy to Vercel, Netlify, Cloudflare, and more
- **Beautiful CLI** - Polished terminal output with progress indicators

## Installation

### From crates.io (Recommended)

```bash
cargo install cargo-philjs
```

### From source

```bash
git clone https://github.com/anthropics/philjs
cd philjs/packages/cargo-philjs
cargo install --path .
```

### Verify installation

```bash
cargo philjs --version
```

## Quick Start

Create a new PhilJS application:

```bash
# Create a new SPA
cargo philjs new my-app

# Create with a specific template
cargo philjs new my-api --template=api
```

Start development server:

```bash
cd my-app
cargo philjs dev
```

Build for production:

```bash
cargo philjs build --release
```

## CLI Commands

### `new` - Create a new project

Create a new PhilJS project from a template.

```bash
cargo philjs new <name> [OPTIONS]
```

**Options:**
- `-t, --template <TEMPLATE>` - Project template (default: spa)
  - `spa` - Single-page application (client-only)
  - `ssr` - Server-side rendered application
  - `fullstack` - Full-stack with API routes and SSR
  - `api` - REST API service
  - `static` - Static site generator
  - `component-library` - Reusable component library
  - `liveview` - Phoenix LiveView-style server-driven UI
  - `minimal` - Minimal starter template
- `--no-git` - Skip git initialization
- `--no-install` - Skip installing dependencies
- `--philjs-version <VERSION>` - Use specific PhilJS version

**Examples:**

```bash
# Create SPA with default template
cargo philjs new my-app

# Create fullstack application
cargo philjs new my-app --template=fullstack

# Create API service
cargo philjs new my-api --template=api

# Create without git
cargo philjs new my-app --no-git

# Use specific PhilJS version
cargo philjs new my-app --philjs-version=2.1.0
```

---

### `init` - Initialize in existing project

Add PhilJS to an existing Rust project.

```bash
cargo philjs init [OPTIONS]
```

**Options:**
- `-t, --template <TEMPLATE>` - Template to use (default: spa)

**Example:**

```bash
cd my-existing-project
cargo philjs init --template=spa
```

---

### `dev` - Development server

Start development server with hot reload.

```bash
cargo philjs dev [OPTIONS]
```

**Options:**
- `-p, --port <PORT>` - Port to run on (default: 3000, env: PHILJS_PORT)
- `--host <HOST>` - Host to bind to (default: 127.0.0.1, env: PHILJS_HOST)
- `-o, --open` - Open browser automatically
- `--https` - Enable HTTPS with auto-generated certificate
- `--watch <DIRS>` - Watch additional directories (comma-separated)
- `--no-hot-reload` - Disable hot module replacement

**Examples:**

```bash
# Start dev server on default port 3000
cargo philjs dev

# Custom port and auto-open browser
cargo philjs dev --port=8080 --open

# Enable HTTPS for testing
cargo philjs dev --https

# Watch additional directories
cargo philjs dev --watch=assets,config

# Disable hot reload
cargo philjs dev --no-hot-reload
```

---

### `build` - Production build

Build optimized production bundle.

```bash
cargo philjs build [OPTIONS]
```

**Options:**
- `-r, --release` - Enable release optimizations
- `-o, --out-dir <DIR>` - Output directory (default: dist)
- `--target <TARGET>` - Build target (default: browser)
  - `browser` - WebAssembly for browser
  - `node` - Node.js target
  - `deno` - Deno runtime
  - `cloudflare` - Cloudflare Workers
- `--ssr` - Enable server-side rendering
- `--source-map` - Generate source maps
- `--no-optimize` - Skip WASM optimization (faster builds)
- `--analyze` - Analyze bundle size
- `--minify` - Minify output (default for release)

**Examples:**

```bash
# Production build
cargo philjs build --release

# Build with SSR enabled
cargo philjs build --release --ssr

# Analyze bundle size
cargo philjs build --release --analyze

# Custom output directory
cargo philjs build --release --out-dir=public

# Build for Cloudflare Workers
cargo philjs build --release --target=cloudflare

# Development build with source maps
cargo philjs build --source-map

# Skip optimization for faster builds
cargo philjs build --release --no-optimize

# Build with minification
cargo philjs build --release --minify
```

---

### `check` - Type checking and linting

Type check and lint your project.

```bash
cargo philjs check [OPTIONS]
```

**Options:**
- `--clippy` - Run Clippy lints
- `--fmt` - Check code formatting
- `--fix` - Auto-fix issues where possible

**Examples:**

```bash
# Basic type check
cargo philjs check

# Run with Clippy
cargo philjs check --clippy

# Check formatting
cargo philjs check --fmt

# Auto-fix issues
cargo philjs check --fix
```

---

### `test` - Run tests

Run unit and integration tests.

```bash
cargo philjs test [OPTIONS] [PATTERN]
```

**Options:**
- `--watch` - Run in watch mode
- `--browser` - Run browser/WASM tests
- `--coverage` - Generate coverage report

**Examples:**

```bash
# Run all tests
cargo philjs test

# Run specific tests
cargo philjs test user

# Watch mode
cargo philjs test --watch

# Run browser tests
cargo philjs test --browser

# Generate coverage
cargo philjs test --coverage
```

---

### `generate` - Code generation

Generate boilerplate code for components, pages, and more.

```bash
cargo philjs generate <SUBCOMMAND>
```

**Subcommands:**

#### `component` - Generate a component

```bash
cargo philjs generate component <NAME> [OPTIONS]
```

**Options:**
- `-d, --dir <DIR>` - Directory to create in (default: src/components)
- `--tests` - Include test file (default: true)
- `--props` - Generate with props boilerplate
- `--styled` - Include CSS module

**Examples:**

```bash
# Generate basic component
cargo philjs generate component Button

# Generate in custom directory
cargo philjs generate component Button --dir=src/ui

# Generate with props and styles
cargo philjs generate component Card --props --styled

# Skip tests
cargo philjs generate component Simple --tests=false
```

#### `page` - Generate a page/route

```bash
cargo philjs generate page <NAME> [OPTIONS]
```

**Options:**
- `--loader` - Include data loader function

**Examples:**

```bash
# Generate basic page
cargo philjs generate page About

# Generate with data loader
cargo philjs generate page Dashboard --loader
```

#### `server` - Generate server function

```bash
cargo philjs generate server <NAME>
```

**Example:**

```bash
cargo philjs generate server GetUser
```

#### `api` - Generate API route

```bash
cargo philjs generate api <NAME>
```

**Example:**

```bash
cargo philjs generate api users
```

#### `store` - Generate state store

```bash
cargo philjs generate store <NAME>
```

**Example:**

```bash
cargo philjs generate store UserStore
```

#### `hook` - Generate custom hook

```bash
cargo philjs generate hook <NAME>
```

**Example:**

```bash
cargo philjs generate hook useAuth
```

---

### `add` - Add component or page

Quick command to add components and pages.

```bash
cargo philjs add <SUBCOMMAND> <NAME>
```

**Subcommands:**
- `component <NAME>` - Add a new component
- `page <NAME>` - Add a new page

**Examples:**

```bash
cargo philjs add component Header
cargo philjs add page Profile
```

---

### `deploy` - Deploy to platforms

Deploy your application to various hosting platforms.

```bash
cargo philjs deploy [OPTIONS]
```

**Options:**
- `-p, --platform <PLATFORM>` - Target platform
  - `vercel` - Vercel
  - `netlify` - Netlify
  - `cloudflare` - Cloudflare Pages
  - `railway` - Railway
  - `fly` - Fly.io
  - `aws` - AWS Lambda
  - `docker` - Docker container
- `--preview` - Create preview deployment (not production)
- `--no-build` - Skip build step

**Examples:**

```bash
# Deploy to Vercel
cargo philjs deploy --platform=vercel

# Preview deployment
cargo philjs deploy --platform=netlify --preview

# Deploy without rebuilding
cargo philjs deploy --platform=cloudflare --no-build
```

---

### `update` - Update dependencies

Update PhilJS and dependencies to latest versions.

```bash
cargo philjs update [OPTIONS]
```

**Options:**
- `--all` - Update all dependencies
- `--check` - Check for updates without installing

**Examples:**

```bash
# Update PhilJS
cargo philjs update

# Update all dependencies
cargo philjs update --all

# Check for updates
cargo philjs update --check
```

---

### `info` - Project information

Display project information and diagnostics.

```bash
cargo philjs info [OPTIONS]
```

**Options:**
- `--json` - Output as JSON

**Examples:**

```bash
# Show project info
cargo philjs info

# JSON output
cargo philjs info --json
```

---

### `clean` - Clean build artifacts

Remove build artifacts and caches.

```bash
cargo philjs clean [OPTIONS]
```

**Options:**
- `--all` - Also clean node_modules and .philjs cache

**Examples:**

```bash
# Clean build artifacts
cargo philjs clean

# Deep clean
cargo philjs clean --all
```

## Templates

### Single-Page Application (SPA)

Client-side rendered application.

**Features:**
- Client-side routing
- Component-based architecture
- Hot reload development
- Optimized production builds

```bash
cargo philjs new my-spa --template=spa
```

### Server-Side Rendering (SSR)

Server-rendered application with client hydration.

**Features:**
- SEO-friendly pre-rendering
- Fast initial page loads
- Progressive enhancement
- Streaming SSR support

```bash
cargo philjs new my-ssr-app --template=ssr
```

### Fullstack

Complete fullstack application with API routes and SSR.

**Features:**
- Server functions with `#[server]` macro
- API routes with Axum
- Database integration ready
- Type-safe client-server communication

```bash
cargo philjs new my-fullstack --template=fullstack
```

### REST API

Backend API service with Axum.

**Features:**
- RESTful API endpoints
- PostgreSQL integration with SQLx
- JWT authentication
- Input validation
- Health checks

```bash
cargo philjs new my-api --template=api
```

### Static Site Generator

Build-time rendered static sites.

**Features:**
- Markdown content with frontmatter
- Blog support out of the box
- Zero runtime JavaScript (optional)
- Deploy anywhere (Netlify, Vercel, GitHub Pages)

```bash
cargo philjs new my-blog --template=static
```

### Component Library

Shareable UI component library.

**Features:**
- Reusable components
- Built-in theming system
- Storybook-style showcase
- Tree-shakeable exports
- Documentation ready

```bash
cargo philjs new my-components --template=component-library
```

### LiveView

Phoenix LiveView-style server-driven UI.

**Features:**
- Real-time updates over WebSocket
- No client-side JavaScript needed
- Server-side state management
- Live form validation

```bash
cargo philjs new my-liveview --template=liveview
```

### Minimal

Bare-bones starter template.

**Features:**
- Minimal dependencies
- Maximum flexibility
- Perfect starting point

```bash
cargo philjs new my-minimal --template=minimal
```

## Configuration

### Environment Variables

- `PHILJS_PORT` - Development server port (default: 3000)
- `PHILJS_HOST` - Development server host (default: 127.0.0.1)
- `RUST_LOG` - Logging level (e.g., debug, info, warn, error)

### Project Configuration

Create a `philjs.toml` in your project root:

```toml
[dev]
port = 3000
host = "127.0.0.1"
open_browser = true
watch_dirs = ["assets", "config"]

[build]
target = "browser"
out_dir = "dist"
minify = true
source_maps = false

[deploy]
platform = "vercel"
build_command = "cargo philjs build --release"
```

## Best Practices

### Project Structure

```
my-app/
 src/
    lib.rs              # Entry point
    components/         # Reusable components
       mod.rs
       button.rs
       card.rs
    pages/             # Route pages
       mod.rs
       home.rs
       about.rs
    hooks/             # Custom hooks
    stores/            # State management
    utils/             # Utilities
 static/                # Static assets
    styles.css
    images/
 tests/                 # Integration tests
 Cargo.toml
 philjs.toml           # PhilJS configuration
```

### Development Workflow

1. **Start dev server**: `cargo philjs dev`
2. **Make changes**: Edit source files
3. **Hot reload**: Changes appear instantly
4. **Check types**: `cargo philjs check --clippy`
5. **Run tests**: `cargo philjs test`
6. **Build**: `cargo philjs build --release`
7. **Deploy**: `cargo philjs deploy --platform=vercel`

### Performance Tips

- Use `--release` for production builds
- Enable `--minify` for smaller bundles
- Run `--analyze` to identify large dependencies
- Use code splitting for large applications
- Enable compression on your hosting platform

## Troubleshooting

### Common Issues

**Issue**: `wasm-pack not found`

**Solution**: Install wasm-pack:
```bash
cargo install wasm-pack
```

**Issue**: `wasm32-unknown-unknown target not installed`

**Solution**: Add the target:
```bash
rustup target add wasm32-unknown-unknown
```

**Issue**: Hot reload not working

**Solution**: Check that watch directories exist and try:
```bash
cargo philjs dev --watch=src,static
```

**Issue**: Build fails with optimization errors

**Solution**: Skip optimization during development:
```bash
cargo philjs build --no-optimize
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Source files: packages/cargo-philjs/src/main.rs

### Public API
- Public modules: (none detected)
- Public items: BuildTarget, DeployPlatform, ProjectTemplate
- Re-exports: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Links

- [PhilJS Website](https://philjs.dev)
- [Documentation](https://philjs.dev/docs)
- [GitHub Repository](https://github.com/anthropics/philjs)
- [Discord Community](https://discord.gg/philjs)
- [Examples](https://github.com/anthropics/philjs/tree/main/examples)

## Support

- [GitHub Issues](https://github.com/anthropics/philjs/issues)
- [Discord](https://discord.gg/philjs)
- [Twitter](https://twitter.com/philjs_dev)

---

**Built with love by the PhilJS community** 
