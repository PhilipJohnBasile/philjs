# @philjs/i18n

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Internationalization utilities for PhilJS applications. Provides translation management, locale formatting, and pluralization with a simple, type-safe API.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Installation

```bash
pnpm add @philjs/i18n
```

## Basic Usage

```tsx
import { I18nProvider, useTranslation, useLocale } from '@philjs/i18n';

const translations = {
  en: { greeting: 'Hello, {name}!', items: '{count} item|{count} items' },
  es: { greeting: 'Hola, {name}!', items: '{count} artículo|{count} artículos' },
};

function App() {
  return (
    <I18nProvider locale="en" translations={translations}>
      <HomePage />
    </I18nProvider>
  );
}

function HomePage() {
  const { t } = useTranslation();
  const { formatDate, formatNumber } = useLocale();

  return (
    <div>
      <h1>{t('greeting', { name: 'World' })}</h1>
      <p>{t('items', { count: 5 })}</p>
      <p>{formatDate(new Date())}</p>
      <p>{formatNumber(1234.56, { style: 'currency', currency: 'USD' })}</p>
    </div>
  );
}
```

## Features

- **Translation Management** - Simple key-based translations
- **Interpolation** - Variable substitution in strings
- **Pluralization** - Handle singular/plural forms
- **Date Formatting** - Locale-aware date formatting
- **Number Formatting** - Currency, percentages, decimals
- **Relative Time** - "2 days ago", "in 3 hours"
- **RTL Support** - Right-to-left language support
- **Lazy Loading** - Load translations on demand
- **Namespace Support** - Organize translations by feature
- **Type Safety** - Full TypeScript support with autocomplete
- **SSR Compatible** - Works with server-side rendering
- **Fallback Locales** - Graceful fallback for missing translations

## Hooks

| Hook | Description |
|------|-------------|
| `useTranslation` | Access translation function |
| `useLocale` | Formatting utilities |
| `useDirection` | Get text direction (ltr/rtl) |
| `useLanguage` | Current language and switcher |

## Formatting

```tsx
const { formatDate, formatNumber, formatRelative } = useLocale();

formatDate(date, { dateStyle: 'full' });
formatNumber(1000, { style: 'currency', currency: 'EUR' });
formatRelative(pastDate); // "2 days ago"
```

## CLI Tool

```bash
# Extract translation keys from code
npx philjs-i18n extract ./src

# Validate translation files
npx philjs-i18n validate ./locales
```

## License

MIT
