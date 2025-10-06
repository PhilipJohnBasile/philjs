# Ecosystem & Integrations

Discover how PhilJS integrates with popular tools, libraries, and services in the JavaScript ecosystem.

## Overview

PhilJS is designed to work seamlessly with the existing JavaScript ecosystem. While it has its own approach to reactivity (signals), most popular libraries and tools can be integrated with minimal effort.

## State Management

### Built-in Signals (Recommended)

PhilJS's native signals provide all you need for most apps:

```typescript
import { signal, memo, effect } from 'philjs-core';

// Global state
export const user = signal(null);
export const cart = signal([]);

// Computed values
export const cartTotal = memo(() =>
  cart().reduce((sum, item) => sum + item.price, 0)
);

// Side effects
effect(() => {
  console.log('Cart updated:', cart());
  localStorage.setItem('cart', JSON.stringify(cart()));
});
```

### Zustand

For more complex state management:

```bash
npm install zustand
```

```typescript
import { create } from 'zustand';

export const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Use in component
export function Counter() {
  const { count, increment } = useStore();

  return <button onClick={increment}>{count}</button>;
}
```

### Jotai

Atomic state management:

```bash
npm install jotai
```

```typescript
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);

export function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

## Styling

### Tailwind CSS (Recommended)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```typescript
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```typescript
// src/App.tsx
import './styles/globals.css';

export function App() {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold">Hello PhilJS!</h1>
    </div>
  );
}
```

### Styled Components

```bash
npm install styled-components
```

```typescript
import styled from 'styled-components';

const Button = styled.button`
  background: var(--color-brand);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;

  &:hover {
    opacity: 0.9;
  }
`;

export function MyButton() {
  return <Button>Click me</Button>;
}
```

### CSS Modules

```typescript
// Button.module.css
.button {
  background: var(--color-brand);
  color: white;
}

// Button.tsx
import styles from './Button.module.css';

export function Button({ children }) {
  return <button className={styles.button}>{children}</button>;
}
```

## UI Component Libraries

### Radix UI (Recommended)

Unstyled, accessible components:

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

```typescript
import * as Dialog from '@radix-ui/react-dialog';

export function Modal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Headless UI

```bash
npm install @headlessui/react
```

```typescript
import { Menu } from '@headlessui/react';

export function Dropdown() {
  return (
    <Menu>
      <Menu.Button>More</Menu.Button>
      <Menu.Items>
        <Menu.Item>{({ active }) => (
          <a className={active ? 'bg-blue-500' : ''} href="/account">
            Account
          </a>
        )}</Menu.Item>
      </Menu.Items>
    </Menu>
  );
}
```

### shadcn/ui

Copy-paste components built with Radix + Tailwind:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
```

```typescript
import { Button } from '@/components/ui/button';

export function App() {
  return <Button>Click me</Button>;
}
```

## Data Fetching

### Built-in createQuery (Recommended)

```typescript
import { createQuery } from 'philjs-core';

export function UserProfile({ userId }) {
  const user = createQuery(() =>
    fetch(`/api/users/${userId()}`).then(r => r.json())
  );

  if (user.loading) return <div>Loading...</div>;
  if (user.error) return <div>Error: {user.error.message}</div>;

  return <div>Hello {user.data.name}!</div>;
}
```

### TanStack Query

```bash
npm install @tanstack/react-query
```

```typescript
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Users />
    </QueryClientProvider>
  );
}

function Users() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  });

  if (isLoading) return <div>Loading...</div>;

  return <ul>{data.map(user => <li key={user.id}>{user.name}</li>)}</ul>;
}
```

### SWR

```bash
npm install swr
```

```typescript
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

export function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <div>Hello {data.name}!</div>;
}
```

## Forms

### Built-in Forms (Recommended)

```typescript
import { signal } from 'philjs-core';

export function ContactForm() {
  const formData = signal({ name: '', email: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(formData()),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData().name}
        onInput={(e) => formData.set({ ...formData(), name: e.target.value })}
      />
      <button>Submit</button>
    </form>
  );
}
```

### React Hook Form

```bash
npm install react-hook-form
```

```typescript
import { useForm } from 'react-hook-form';

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: true })} />
      {errors.email && <span>Email is required</span>}
      <button>Login</button>
    </form>
  );
}
```

### Zod

Schema validation:

```bash
npm install zod
```

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18),
});

export const createUser = serverFn(async (data: unknown) => {
  const validated = userSchema.parse(data);
  return await db.users.create(validated);
});
```

## Testing

### Vitest (Recommended)

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Button } from './Button';

test('renders button', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Playwright

E2E testing:

```bash
npm install -D @playwright/test
```

```typescript
// tests/home.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

## Analytics

### Google Analytics

```bash
npm install @analytics/google-analytics
```

```typescript
// src/lib/analytics.ts
import { effect } from 'philjs-core';

export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: url,
    });
  }
}

// Track route changes
effect(() => {
  const path = window.location.pathname;
  trackPageView(path);
});
```

### Plausible

```typescript
// Add to <head>
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>

// Track custom events
export function trackEvent(name: string) {
  if (window.plausible) {
    window.plausible(name);
  }
}
```

### Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
import { inject } from '@vercel/analytics';

inject();
```

## Error Tracking

### Sentry

```bash
npm install @sentry/browser
```

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});

// Error boundary
export function ErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

## Authentication

### Clerk

```bash
npm install @clerk/clerk-react
```

```typescript
import { ClerkProvider, SignIn, SignUp, UserButton } from '@clerk/clerk-react';

export function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.PUBLIC_CLERK_KEY}>
      <UserButton />
    </ClerkProvider>
  );
}
```

### Auth0

```bash
npm install @auth0/auth0-react
```

```typescript
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

export function App() {
  return (
    <Auth0Provider
      domain="your-domain.auth0.com"
      clientId="your-client-id"
      redirectUri={window.location.origin}
    >
      <LoginButton />
    </Auth0Provider>
  );
}

function LoginButton() {
  const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();

  if (isAuthenticated) {
    return <button onClick={() => logout()}>Logout</button>;
  }

  return <button onClick={() => loginWithRedirect()}>Login</button>;
}
```

## CMS

### Contentful

```bash
npm install contentful
```

```typescript
import { createClient } from 'contentful';

const client = createClient({
  space: import.meta.env.PUBLIC_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.PUBLIC_CONTENTFUL_ACCESS_TOKEN,
});

export const getBlogPosts = serverFn(async () => {
  const entries = await client.getEntries({ content_type: 'blogPost' });
  return entries.items;
});
```

### Sanity

```bash
npm install @sanity/client
```

```typescript
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'your-project-id',
  dataset: 'production',
  useCdn: true,
});

export async function getBlogPosts() {
  return await client.fetch('*[_type == "post"]');
}
```

## Databases

### Prisma

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

```typescript
// server.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUsers = serverFn(async () => {
  return await prisma.user.findMany();
});
```

### Drizzle ORM

```bash
npm install drizzle-orm
```

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
});

const db = drizzle(process.env.DATABASE_URL);

export const getUsers = serverFn(async () => {
  return await db.select().from(users);
});
```

## Icon Libraries

### Lucide Icons

```bash
npm install lucide-react
```

```typescript
import { ChevronRight, User, Settings } from 'lucide-react';

export function Navigation() {
  return (
    <nav>
      <button><User size={20} /> Profile</button>
      <button><Settings size={20} /> Settings</button>
    </nav>
  );
}
```

### React Icons

```bash
npm install react-icons
```

```typescript
import { FaGithub, FaTwitter } from 'react-icons/fa';

export function SocialLinks() {
  return (
    <div>
      <a href="https://github.com"><FaGithub /></a>
      <a href="https://twitter.com"><FaTwitter /></a>
    </div>
  );
}
```

## Build Tools

### Vite (Default)

PhilJS uses Vite by default:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from '@philjs/vite-plugin';

export default defineConfig({
  plugins: [philjs()],
});
```

### Turbopack

For Next.js-style builds:

```bash
npm install turbopack
```

## Deployment Platforms

PhilJS works with all major platforms:

- **Vercel** - Zero-config, recommended
- **Netlify** - Great for static sites
- **Cloudflare Pages** - Edge network
- **AWS** - Full control
- **Docker** - Containerized deployments

See [Deployment Guide](/docs/deployment/overview) for details.

## Compatibility Notes

### React Compatibility

PhilJS uses JSX and has a similar API to React, but:

- ✅ Most React libraries work out of the box
- ✅ React hooks can be adapted to PhilJS signals
- ❌ Some React-specific features (Context API, useEffect) need adaptation
- ⚠️ Use `philjs-react-compat` for better compatibility

### Performance

PhilJS's fine-grained reactivity means:
- No virtual DOM diffing
- Direct DOM updates
- Smaller bundle sizes
- Faster updates

## Contributing

Want to add a library integration?

1. Fork [philjs/integrations](https://github.com/philjs/integrations)
2. Add your integration guide
3. Submit a pull request

## Resources

- [Example Integrations](https://github.com/philjs/examples)
- [Community Packages](https://www.npmjs.com/search?q=philjs)
- [Discord Community](https://discord.gg/philjs)

---

💡 **Tip**: Start with PhilJS's built-in features (signals, server functions) before adding external libraries.

⚠️ **Warning**: Some React-specific libraries may need adaptation for PhilJS's reactivity model.

ℹ️ **Note**: PhilJS plays well with the JavaScript ecosystem - most libraries work out of the box!
