# Tailwind CSS

Use Tailwind CSS utility classes with PhilJS for rapid UI development.

## What You'll Learn

- Tailwind setup
- Utility classes with JSX
- Dynamic classes with signals
- Custom configurations
- Component patterns
- Plugin ecosystem
- Best practices

## Setup

### Installation

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d'
      }
    },
  },
  plugins: [],
}
```

### Import Tailwind

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```typescript
// src/main.tsx
import './index.css';
```

## Basic Usage

### Utility Classes

```typescript
export function Card({ title, children }: {
  title: string;
  children: any;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}
```

### Responsive Design

```typescript
export function ResponsiveGrid({ children }: { children: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}
```

### Hover and Focus States

```typescript
export function Button({ children }: { children: any }) {
  return (
    <button className="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 text-white px-4 py-2 rounded transition-colors">
      {children}
    </button>
  );
}
```

## Dynamic Classes with Signals

### Conditional Classes

```typescript
import { signal } from 'philjs-core';

export function Alert({ type = 'info' }: {
  type?: 'info' | 'success' | 'warning' | 'error';
}) {
  const isVisible = signal(true);

  const typeClasses = {
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300'
  };

  if (!isVisible()) return null;

  return (
    <div className={`border-l-4 p-4 ${typeClasses[type]}`}>
      Alert message
      <button
        onClick={() => isVisible.set(false)}
        className="ml-4 text-sm underline"
      >
        Dismiss
      </button>
    </div>
  );
}
```

### Toggle Classes

```typescript
import { signal } from 'philjs-core';

export function ToggleButton() {
  const isActive = signal(false);

  return (
    <button
      onClick={() => isActive.set(!isActive())}
      className={`
        px-4 py-2 rounded transition-colors
        ${isActive()
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-800'
        }
      `}
    >
      {isActive() ? 'Active' : 'Inactive'}
    </button>
  );
}
```

### Class Name Helper

```typescript
import { signal } from 'philjs-core';

function cn(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function Button({ variant, size, disabled }: {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}) {
  return (
    <button
      className={cn(
        'rounded font-medium transition-colors',
        variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
        variant === 'secondary' && 'bg-gray-500 text-white hover:bg-gray-600',
        size === 'sm' && 'px-2 py-1 text-sm',
        size === 'md' && 'px-4 py-2',
        size === 'lg' && 'px-6 py-3 text-lg',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled}
    >
      Click me
    </button>
  );
}
```

## Custom Components

### Base Components

```typescript
// components/ui/button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: any;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  children,
  onClick
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-blue-500 hover:bg-blue-50 focus:ring-blue-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Card Component

```typescript
export function Card({ children, className }: {
  children: any;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-lg shadow-md overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: any }) {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      {children}
    </div>
  );
}

export function CardBody({ children }: { children: any }) {
  return (
    <div className="px-6 py-4">
      {children}
    </div>
  );
}

export function CardFooter({ children }: { children: any }) {
  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
      {children}
    </div>
  );
}
```

## Custom Configuration

### Extend Theme

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  }
}
```

### Custom Utilities

```css
/* src/index.css */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

```typescript
export function BalancedText() {
  return (
    <h1 className="text-4xl text-balance">
      This headline will have balanced line breaks
    </h1>
  );
}
```

## Plugins

### Forms Plugin

```bash
npm install -D @tailwindcss/forms
```

```javascript
// tailwind.config.js
export default {
  plugins: [
    require('@tailwindcss/forms')
  ]
}
```

```typescript
export function LoginForm() {
  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Sign In
      </button>
    </form>
  );
}
```

### Typography Plugin

```bash
npm install -D @tailwindcss/typography
```

```typescript
export function Article({ content }: { content: string }) {
  return (
    <article className="prose lg:prose-xl">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
```

## Dark Mode

### Class-Based Dark Mode

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  // ...
}
```

```typescript
import { signal, effect } from 'philjs-core';

export function DarkModeToggle() {
  const isDark = signal(false);

  effect(() => {
    if (isDark()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  return (
    <button
      onClick={() => isDark.set(!isDark())}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    >
      {isDark() ? '☀️' : '🌙'}
    </button>
  );
}

export function ThemedCard() {
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold">Dark Mode Card</h2>
      <p className="text-gray-600 dark:text-gray-400">
        This card adapts to dark mode
      </p>
    </div>
  );
}
```

## Animation

### Built-in Animations

```typescript
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}

export function PulseCard() {
  return (
    <div className="animate-pulse bg-gray-200 rounded-lg p-6">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-300 rounded w-1/2" />
    </div>
  );
}
```

### Custom Animations

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in'
      }
    }
  }
}
```

```typescript
import { signal } from 'philjs-core';

export function AnimatedNotification() {
  const isVisible = signal(false);

  return (
    <div>
      <button onClick={() => isVisible.set(true)}>
        Show Notification
      </button>

      {isVisible() && (
        <div className="fixed top-4 right-4 animate-slide-in bg-green-500 text-white p-4 rounded-lg shadow-lg">
          Success! Your changes have been saved.
          <button
            onClick={() => isVisible.set(false)}
            className="ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
```

## Best Practices

### Group Related Classes

```typescript
// ✅ Group by category
<button className="
  px-4 py-2
  bg-blue-500 hover:bg-blue-600
  text-white
  rounded-lg
  transition-colors
">
  Click me
</button>

// ❌ Random order
<button className="text-white px-4 hover:bg-blue-600 rounded-lg py-2 bg-blue-500">
  Click me
</button>
```

### Extract Repeated Patterns

```typescript
// ✅ Create reusable components
const buttonClasses = "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600";

export function Button({ children }: { children: any }) {
  return <button className={buttonClasses}>{children}</button>;
}

// ❌ Duplicate classes everywhere
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">A</button>
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">B</button>
```

### Use @apply Sparingly

```css
/* ✅ Only for truly repeated patterns */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600;
  }
}

/* ❌ Don't @apply everything */
.card {
  @apply bg-white rounded-lg shadow-md p-6 flex flex-col gap-4;
  /* Use utilities directly in JSX instead */
}
```

### Avoid Long Class Strings

```typescript
// ✅ Use cn() helper or component extraction
import { cn } from '@/lib/utils';

<button className={cn(
  'px-4 py-2 rounded-lg transition-colors',
  variant === 'primary' && 'bg-blue-500 text-white',
  variant === 'secondary' && 'bg-gray-500 text-white'
)} />

// ❌ Very long inline class strings
<button className={`px-4 py-2 rounded-lg transition-colors ${variant === 'primary' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-500 text-white hover:bg-gray-600'} ${disabled && 'opacity-50 cursor-not-allowed'}`} />
```

## Summary

You've learned:

✅ Tailwind CSS setup with PhilJS
✅ Utility classes in JSX
✅ Dynamic classes with signals
✅ Custom component patterns
✅ Theme customization
✅ Plugin ecosystem
✅ Dark mode implementation
✅ Animation patterns
✅ Best practices

Tailwind CSS enables rapid UI development with PhilJS!

---

**Next:** [Sass/SCSS →](./sass.md) CSS preprocessing with Sass
