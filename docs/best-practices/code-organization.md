# Code Organization

Best practices for structuring and organizing PhilJS projects.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). References to high-level helpers like `<Router>` or `Link` in this guide are part of the planned ergonomic API and are shared for conceptual planning.

## Project Structure

### Standard Structure

```
my-philjs-app/
├── public/              # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── images/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.css
│   │   ├── Input/
│   │   └── Card/
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   └── Settings.tsx
│   ├── layouts/         # Layout components
│   │   ├── MainLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── hooks/           # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMediaQuery.ts
│   ├── stores/          # Global state stores
│   │   ├── userStore.ts
│   │   ├── cartStore.ts
│   │   └── themeStore.ts
│   ├── services/        # API and external services
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── analytics.ts
│   ├── utils/           # Utility functions
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   ├── types/           # TypeScript types
│   │   ├── user.ts
│   │   ├── product.ts
│   │   └── api.ts
│   ├── styles/          # Global styles
│   │   ├── global.css
│   │   ├── variables.css
│   │   └── reset.css
│   ├── App.tsx          # Root component
│   └── index.tsx        # Entry point
├── tests/               # Test utilities
│   ├── setup.ts
│   └── helpers.ts
├── .env                 # Environment variables
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts       # Build configuration
```

### Feature-Based Structure

```
my-philjs-app/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   ├── stores/
│   │   │   │   └── authStore.ts
│   │   │   ├── types/
│   │   │   │   └── auth.ts
│   │   │   └── index.ts
│   │   ├── products/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   └── cart/
│   ├── shared/          # Shared across features
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── App.tsx
│   └── index.tsx
```

## File Naming Conventions

### Components

```
✅ PascalCase for components
Button.tsx
UserProfile.tsx
ProductCard.tsx

✅ Co-locate styles
Button.tsx
Button.css
Button.test.tsx

✅ Index files for folders
components/Button/index.tsx  // Re-exports Button
```

### Utilities and Hooks

```
✅ camelCase for functions
formatting.ts
validation.ts

✅ "use" prefix for hooks
useAuth.ts
useLocalStorage.ts
useMediaQuery.ts
```

### Types

```
✅ Descriptive names
user.ts        // User-related types
product.ts     // Product-related types
api.ts         // API response types

✅ Type suffixes when needed
userTypes.ts   // If conflicts with userUtils.ts
```

## Component Organization

### Component File Structure

```tsx
// imports - external
import { signal, memo } from 'philjs-core';

// imports - internal
import { Button } from '@/components/Button';
import { formatDate } from '@/utils/formatting';

// types
interface UserCardProps {
  user: User;
  onEdit?: () => void;
}

// component
export function UserCard({ user, onEdit }: UserCardProps) {
  // hooks and state
  const expanded = signal(false);

  // computed values
  const formattedDate = memo(() => formatDate(user.createdAt));

  // handlers
  const handleToggle = () => {
    expanded.set(!expanded());
  };

  // render
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{formattedDate()}</p>

      {onEdit && (
        <Button label="Edit" onClick={onEdit} />
      )}

      {expanded() && (
        <div className="details">
          {/* Additional details */}
        </div>
      )}
    </div>
  );
}

// sub-components (if needed)
function UserCardHeader({ user }: { user: User }) {
  return <div>{user.name}</div>;
}
```

### Component Folder Pattern

```
components/
└── UserCard/
    ├── index.ts           # Exports
    ├── UserCard.tsx       # Main component
    ├── UserCard.css       # Styles
    ├── UserCard.test.tsx  # Tests
    ├── UserCardHeader.tsx # Sub-component
    └── types.ts           # Local types

// index.ts
export { UserCard } from './UserCard';
export type { UserCardProps } from './types';
```

## Store Organization

### Simple Store

```typescript
// stores/themeStore.ts
import { signal } from 'philjs-core';

export type Theme = 'light' | 'dark';

const theme = signal<Theme>('light');

export const themeStore = {
  theme,
  toggle: () => {
    theme.set(theme() === 'light' ? 'dark' : 'light');
  },
  set: (value: Theme) => {
    theme.set(value);
  }
};
```

### Complex Store

```typescript
// stores/userStore/
├── index.ts            # Main store
├── types.ts            # Store types
├── actions.ts          # Store actions
└── selectors.ts        # Derived values

// stores/userStore/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// stores/userStore/index.ts
import { signal, memo } from 'philjs-core';
import { fetchUser, loginUser } from './actions';
import { isAdmin, isAuthenticated } from './selectors';

function createUserStore() {
  const user = signal<User | null>(null);
  const loading = signal(false);
  const error = signal<string | null>(null);

  return {
    // State
    user,
    loading,
    error,

    // Actions
    fetchUser: fetchUser(user, loading, error),
    login: loginUser(user, loading, error),

    // Selectors
    isAdmin: isAdmin(user),
    isAuthenticated: isAuthenticated(user)
  };
}

export const userStore = createUserStore();
```

## Import Organization

### Import Order

```tsx
// 1. External dependencies
import { signal, memo, effect } from 'philjs-core';
import { Router, Route } from 'philjs-router';

// 2. Internal absolute imports
import { Button } from '@/components/Button';
import { userStore } from '@/stores/userStore';
import { formatDate } from '@/utils/formatting';

// 3. Relative imports
import { UserCard } from './UserCard';
import { config } from './config';

// 4. Types
import type { User } from '@/types/user';

// 5. Styles
import './App.css';
```

### Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@stores/*": ["src/stores/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

Usage:
```tsx
// ✅ Clean imports with aliases
import { Button } from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { userStore } from '@stores/userStore';

// ❌ Messy relative imports
import { Button } from '../../../components/Button';
import { useAuth } from '../../hooks/useAuth';
```

## Type Organization

### Shared Types

```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export type UserRole = User['role'];
```

### API Types

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}
```

### Component Types

```typescript
// components/Button/types.ts
export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export type ButtonVariant = ButtonProps['variant'];
export type ButtonSize = ButtonProps['size'];
```

## Service Organization

### API Service

```typescript
// services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  }

  // patch, delete, etc.
}

export const api = new ApiClient(API_BASE_URL);
```

### Domain Services

```typescript
// services/userService.ts
import { api } from './api';
import type { User, UserCredentials } from '@/types/user';

export const userService = {
  async getUser(id: string): Promise<User> {
    return api.get(`/users/${id}`);
  },

  async login(credentials: UserCredentials): Promise<User> {
    return api.post('/auth/login', credentials);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return api.patch(`/users/${id}`, updates);
  }
};
```

## Utility Organization

### Single-Purpose Files

```typescript
// utils/formatting.ts
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US').format(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// utils/validation.ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
```

### Grouped Utilities

```typescript
// utils/string.ts
export const stringUtils = {
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  truncate(str: string, length: number): string {
    return str.length > length ? `${str.slice(0, length)}...` : str;
  },

  slugify(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '-');
  }
};
```

## Constants Organization

```typescript
// utils/constants.ts
export const API_ENDPOINTS = {
  USERS: '/users',
  PRODUCTS: '/products',
  ORDERS: '/orders'
} as const;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  LOGIN: '/login'
} as const;

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ITEMS_PER_PAGE = 20;
```

## Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=PhilJS App
VITE_ENABLE_ANALYTICS=true

# .env.example
VITE_API_URL=
VITE_APP_NAME=
VITE_ENABLE_ANALYTICS=
```

```typescript
// utils/env.ts
interface Env {
  apiUrl: string;
  appName: string;
  enableAnalytics: boolean;
}

function getEnv(): Env {
  return {
    apiUrl: import.meta.env.VITE_API_URL,
    appName: import.meta.env.VITE_APP_NAME,
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  };
}

export const env = getEnv();
```

## Barrel Exports

### Component Barrel

```typescript
// components/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Modal } from './Modal';

// Usage
import { Button, Input, Card } from '@/components';
```

### Avoid Deep Barrels

```typescript
// ❌ Don't re-export everything
export * from './Button';
export * from './Input';
// Type pollution, unclear exports

// ✅ Be explicit
export { Button } from './Button';
export { Input } from './Input';
export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
```

## Documentation

### Component Documentation

```tsx
/**
 * Button component for user actions
 *
 * @example
 * ```tsx
 * <Button
 *   label="Click me"
 *   onClick={() => console.log('Clicked')}
 *   variant="primary"
 * />
 * ```
 */
export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  // ...
}
```

### Store Documentation

```typescript
/**
 * User authentication store
 *
 * Manages user session, login, and logout
 *
 * @example
 * ```tsx
 * const { user, login, logout } = userStore;
 *
 * if (user()) {
 *   return <Dashboard user={user()} />;
 * }
 * ```
 */
export const userStore = createUserStore();
```

## Summary

**Organization Best Practices:**

✅ Use consistent project structure
✅ Follow naming conventions
✅ Co-locate related files
✅ Use path aliases for clean imports
✅ Organize types separately
✅ Group utilities logically
✅ Document components and stores
✅ Use barrel exports wisely
✅ Keep files focused and small
✅ Structure for scalability

**Next:** [Architecture →](./architecture.md)
