# philjs-templates

Starter templates for PhilJS applications.

## Installation

This package is used automatically by `create-philjs`. No manual installation needed.

```bash
pnpm create philjs my-app
```

## Available Templates

### Basic Template

A minimal PhilJS application with core features:

```bash
pnpm create philjs my-app --template basic
```

**Features:**
- PhilJS Core (signals, memo, effect)
- File-based routing
- Hot Module Replacement
- TypeScript support
- Basic styling

### Full Template (Default)

Complete PhilJS application with all features:

```bash
pnpm create philjs my-app --template full
```

**Features:**
- Everything in Basic template
- Server-Side Rendering (SSR)
- Islands Architecture
- API routes
- Database integration (DrizzleORM)
- Authentication setup
- Testing setup (Vitest)
- E2E tests (Playwright)

### SSR Template

Optimized for server-side rendering:

```bash
pnpm create philjs my-app --template ssr
```

**Features:**
- SSR-first architecture
- Streaming SSR support
- SEO optimization
- Meta tags management
- Sitemap generation
- RSS feed support

### API Template

Backend-focused template:

```bash
pnpm create philjs my-app --template api
```

**Features:**
- API routes only
- Database integration
- Authentication
- Rate limiting
- CORS configuration
- OpenAPI documentation

### SPA Template

Single-Page Application template:

```bash
pnpm create philjs my-app --template spa
```

**Features:**
- Client-side only
- Client-side routing
- No SSR overhead
- Optimized bundle size
- PWA support

### Component Library Template

For building component libraries:

```bash
pnpm create philjs my-app --template library
```

**Features:**
- Component development setup
- Storybook integration
- Documentation generator
- NPM publishing config
- Bundle size optimization

## Template Structure

### Basic Template

```
my-app/
├── src/
│   ├── routes/
│   │   └── index.tsx
│   ├── components/
│   │   └── Counter.tsx
│   ├── styles/
│   │   └── global.css
│   └── entry-client.tsx
├── public/
│   └── favicon.ico
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Full Template

```
my-app/
├── src/
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── about.tsx
│   │   └── api/
│   │       └── users.ts
│   ├── components/
│   │   ├── Counter.tsx
│   │   └── TodoList.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   └── auth.ts
│   ├── styles/
│   │   └── global.css
│   ├── entry-client.tsx
│   └── entry-server.tsx
├── public/
│   └── assets/
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── playwright.config.ts
└── .env.example
```

## Programmatic Usage

Use templates programmatically in your own scaffolding tools:

```typescript
import { getTemplate, scaffoldProject } from 'philjs-templates';

// Get template files
const template = await getTemplate('full');

// Scaffold a new project
await scaffoldProject({
  template: 'full',
  projectName: 'my-app',
  targetDir: './my-app',
  typescript: true,
  git: true
});
```

## Template Features

### TypeScript

All templates support TypeScript by default. Use `--js` flag for JavaScript:

```bash
pnpm create philjs my-app --js
```

### Package Manager

Choose your preferred package manager:

```bash
pnpm create philjs my-app --pm npm
pnpm create philjs my-app --pm yarn
pnpm create philjs my-app --pm pnpm  # default
```

### Git Integration

Initialize Git repository automatically:

```bash
pnpm create philjs my-app --git
```

### Styling Options

Choose a styling solution:

```bash
pnpm create philjs my-app --style tailwind
pnpm create philjs my-app --style css-modules
pnpm create philjs my-app --style styled-components
pnpm create philjs my-app --style vanilla  # default
```

## Customization

### Custom Templates

Create your own templates by adding a directory in `templates/`:

```
templates/
└── my-custom-template/
    ├── template.json
    ├── package.json
    ├── src/
    └── public/
```

**template.json:**
```json
{
  "name": "my-custom-template",
  "description": "My custom PhilJS template",
  "features": ["custom-feature"],
  "prompts": [
    {
      "name": "includeAuth",
      "type": "confirm",
      "message": "Include authentication?"
    }
  ]
}
```

### Template Variables

Use variables in template files:

```typescript
// src/config.ts
export const config = {
  appName: "{{PROJECT_NAME}}",
  version: "{{VERSION}}",
  // Variables are replaced during scaffolding
};
```

## API

### Functions

- `getTemplate(name)` - Get template by name
- `listTemplates()` - List all available templates
- `scaffoldProject(options)` - Create project from template
- `validateTemplate(name)` - Validate template structure

### Options

```typescript
interface ScaffoldOptions {
  template: string;
  projectName: string;
  targetDir: string;
  typescript?: boolean;
  git?: boolean;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  install?: boolean;
}
```

## Examples

### Create Full Stack App

```bash
pnpm create philjs my-app --template full --pm pnpm --git
cd my-app
pnpm dev
```

### Create Component Library

```bash
pnpm create philjs ui-components --template library
cd ui-components
pnpm dev
pnpm build
```

### Create API Server

```bash
pnpm create philjs api-server --template api
cd api-server
pnpm dev
```

## Scripts

All templates include these npm scripts:

```json
{
  "scripts": {
    "dev": "philjs dev",
    "build": "philjs build",
    "preview": "philjs preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit"
  }
}
```

## Documentation

For more information, see the [PhilJS documentation](../../docs) and [Getting Started guide](../../docs/getting-started.md).

## License

MIT
