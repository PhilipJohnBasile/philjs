# PhilJS SaaS Starter

A production-ready SaaS application template with authentication, billing, and dashboards.

## Features

- User authentication (signup, login, OAuth)
- Subscription billing integration
- Admin dashboard
- Team management
- API rate limiting

## Prerequisites

- Node.js 24+ (Node 25 supported)
- pnpm

## Running the App

```bash
# From repository root
pnpm install
pnpm build

# From examples/saas-starter
cd examples/saas-starter
pnpm dev
```

The development server starts at `http://localhost:5173`.

## Build for Production

```bash
pnpm build
pnpm preview
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=...
STRIPE_SECRET_KEY=...
OAUTH_CLIENT_ID=...
```

## PhilJS Features Used

- `@philjs/auth` - Authentication utilities
- `@philjs/db` - Database integration
- `@philjs/router` - Type-safe routing
- `@philjs/forms` - Form handling with validation
