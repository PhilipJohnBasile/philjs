# create-philjs

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Scaffolding tool for PhilJS apps - The framework that thinks ahead.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- **Interactive CLI** - Guided project setup
- **Multiple Templates** - Starter templates for different use cases
- **TypeScript or JavaScript** - Choose your preferred language
- **Package Manager Detection** - Automatically detects pnpm, npm, or yarn
- **Git Integration** - Initialize git repository
- **Dependencies Installation** - Automatic dependency installation
- **Ready to Code** - Fully configured project out of the box

## Usage

### Create a new project

```bash
pnpm create philjs my-app
```

Or use npm/yarn:

```bash
npm create philjs@latest my-app
npx create-philjs my-app
yarn create philjs my-app
```

### Interactive Mode

Run without a project name for interactive mode:

```bash
pnpm create philjs
```

You'll be prompted to:
1. Enter a project name
2. Select a template
3. Choose TypeScript or JavaScript
4. Select features (routing, SSR, testing, etc.)
5. Choose a package manager

## Templates

### Basic

A minimal PhilJS app with routing and basic styling.

```bash
pnpm create philjs my-app --template basic
```

**Includes:**
- File-based routing
- Basic components
- CSS support
- Development server

### Full-Stack

Complete full-stack application with database and authentication.

```bash
pnpm create philjs my-app --template full-stack
```

**Includes:**
- SSR and SSG support
- Database integration (Prisma)
- Authentication
- API routes
- Testing setup

### SaaS Starter

Production-ready SaaS application template.

```bash
pnpm create philjs my-app --template saas
```

**Includes:**
- User authentication
- Subscription billing
- Admin dashboard
- Email integration
- Multi-tenancy support
- Complete UI components

### E-commerce

Online store template with cart and checkout.

```bash
pnpm create philjs my-app --template ecommerce
```

**Includes:**
- Product catalog
- Shopping cart
- Checkout flow
- Payment integration
- Order management

### Blog

Content-focused blog template.

```bash
pnpm create philjs my-app --template blog
```

**Includes:**
- Markdown support
- Blog post listing
- Categories and tags
- RSS feed
- SEO optimization

### Dashboard

Admin dashboard template with charts and tables.

```bash
pnpm create philjs my-app --template dashboard
```

**Includes:**
- Analytics charts
- Data tables
- User management
- Settings pages
- Dark mode

## CLI Options

```bash
pnpm create philjs [project-name] [options]
```

**Options:**
- `--template <name>` - Template to use (basic, full-stack, saas, ecommerce, blog, dashboard)
- `--typescript` - Use TypeScript (default)
- `--javascript` - Use JavaScript
- `--git` - Initialize git repository (default: true)
- `--install` - Install dependencies (default: true)
- `--package-manager <pm>` - Package manager (pnpm, npm, yarn)

## Examples

### Create with specific options

```bash
# TypeScript with full-stack template
pnpm create philjs my-app --template full-stack --typescript

# JavaScript with basic template, skip install
pnpm create philjs my-app --template basic --javascript --no-install

# SaaS template with specific package manager
pnpm create philjs my-saas --template saas --package-manager npm
```

### After Creation

```bash
cd my-app
pnpm install  # if --no-install was used
pnpm dev      # start development server
```

## Project Structure

All templates create a similar structure:

```
my-app/
├── src/
│   ├── components/      # Reusable components
│   ├── routes/          # Route components
│   ├── styles/          # Global styles
│   ├── entry-client.ts  # Client entry point
│   └── entry-server.ts  # Server entry point (SSR templates)
├── public/              # Static assets
├── tests/               # Test files (full-stack+)
├── package.json
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript config (TS templates)
└── README.md
```

## What's Included

Every template includes:

- **Development Server** - Fast HMR with Vite
- **Production Build** - Optimized builds
- **Routing** - File-based or config routing
- **Styling** - CSS, CSS Modules, or Tailwind
- **TypeScript** - Full TypeScript support (optional)
- **ESLint & Prettier** - Code quality tools (optional)

Full-stack templates also include:

- **SSR/SSG** - Server-side rendering and static generation
- **API Routes** - Backend API endpoints
- **Database** - Database integration
- **Testing** - Vitest and PhilJS Testing Library
- **Deployment** - Deploy configs for Vercel, Netlify, etc.

## Next Steps

After creating your project:

1. **Read the README** - Each template has specific instructions
2. **Explore the code** - Understand the project structure
3. **Start developing** - Run `pnpm dev` and start coding
4. **Check the docs** - Visit [PhilJS documentation](https://philjs.dev/docs)

## Troubleshooting

### Command not found

Make sure you're using a recent version of Node.js (24+):

```bash
node --version  # Should be 24 or higher
```

### Permission errors

On macOS/Linux, you may need to use `sudo`:

```bash
sudo pnpm create philjs my-app
```

Or fix npm permissions: [npm docs](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)

### Port already in use

Change the port in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3001  // Change to available port
  }
});
```

## Documentation

For more information, see the [PhilJS documentation](https://philjs.dev/docs).

## License

MIT
