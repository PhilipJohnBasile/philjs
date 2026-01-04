# @philjs/templates

Project templates and scaffolding for PhilJS applications.

## Installation

```bash
npm install @philjs/templates --save-dev
```

Or use directly with create-philjs:

```bash
npx create-philjs my-app --template saas
```

## Available Templates

### Basic

Minimal PhilJS application:

```bash
npx create-philjs my-app --template basic
```

Features:
- Single page app
- Basic routing
- Signal state management

### SaaS Starter

Full-featured SaaS application:

```bash
npx create-philjs my-app --template saas
```

Features:
- Authentication
- Subscription billing
- Dashboard layout
- User management
- API routes

### E-commerce

Online storefront template:

```bash
npx create-philjs my-app --template storefront
```

Features:
- Product catalog
- Shopping cart
- Checkout flow
- Payment integration
- Order management

### Blog SSG

Static site generation for blogs:

```bash
npx create-philjs my-app --template blog
```

Features:
- Markdown content
- Static generation
- RSS feed
- SEO optimization

### Dashboard

Admin dashboard template:

```bash
npx create-philjs my-app --template dashboard
```

Features:
- Data tables
- Charts
- Real-time updates
- User roles

## Custom Templates

Create your own template:

```typescript
import { defineTemplate } from '@philjs/templates';

export default defineTemplate({
  name: 'my-template',
  description: 'Custom project template',

  files: {
    'src/index.tsx': /* template content */,
    'package.json': /* template content */,
  },

  prompts: [
    {
      name: 'projectName',
      message: 'Project name?',
      default: 'my-app',
    },
  ],

  async setup(context) {
    await context.installDependencies();
    await context.runCommand('npm run build');
  },
});
```

## See Also

- [@philjs/cli](../cli/overview.md) - CLI tools
- [@philjs/builder](../builder/overview.md) - Build configuration
