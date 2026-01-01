# philjs-plugin-i18n

Internationalization plugin for PhilJS with Vite integration, automatic locale detection, and type-safe translations.

## Installation

```bash
pnpm add philjs-plugin-i18n
```

## Quick Start

### 1. Add the Plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createI18nPlugin } from 'philjs-plugin-i18n';

export default defineConfig({
  plugins: [
    createI18nPlugin({
      defaultLocale: 'en',
      locales: ['en', 'es', 'fr', 'de'],
      translationsDir: './src/locales',
      detectBrowserLocale: true,
      persistLocale: true,
    }).vitePlugin(),
  ],
});
```

### 2. Create Translation Files

```
src/
  locales/
    en.json
    es.json
    fr.json
```

```json
// src/locales/en.json
{
  "common": {
    "greeting": "Hello, {{name}}!",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit"
  }
}
```

### 3. Use Translations

```tsx
import { t, setLocale, formatDate } from './lib/i18n';

function Greeting({ name }) {
  return (
    <div>
      <h1>{t('common.greeting', { name })}</h1>
      <p>{formatDate(new Date())}</p>

      <button onClick={() => setLocale('es')}>
        Switch to Spanish
      </button>
    </div>
  );
}
```

## Features

### Automatic Locale Detection

The plugin automatically detects the user's browser locale and matches it against your configured locales:

```typescript
createI18nPlugin({
  defaultLocale: 'en',
  locales: ['en', 'en-US', 'es', 'es-MX', 'fr'],
  detectBrowserLocale: true, // Enabled by default
});
```

### Locale Persistence

User's locale preference is saved to localStorage:

```typescript
createI18nPlugin({
  persistLocale: true, // Enabled by default
  storageKey: 'my-app-locale', // Custom key
});
```

### Interpolation

Use `{{variable}}` syntax for dynamic values:

```json
{
  "welcome": "Welcome, {{name}}!",
  "items": "You have {{count}} items in your cart"
}
```

```typescript
t('welcome', { name: 'John' }); // "Welcome, John!"
t('items', { count: 5 }); // "You have 5 items in your cart"
```

### Pluralization

Define plural forms based on count:

```json
{
  "items": {
    "one": "{{count}} item",
    "other": "{{count}} items"
  }
}
```

```typescript
t('items', { count: 1 }); // "1 item"
t('items', { count: 5 }); // "5 items"
```

### Number Formatting

Format numbers according to locale:

```typescript
import { formatNumber, formatCurrency } from './lib/i18n';

formatNumber(1234.56); // "1,234.56" (en) or "1.234,56" (de)
formatCurrency(99.99, 'USD'); // "$99.99" (en) or "99,99 $" (fr)
```

### Date Formatting

Format dates according to locale:

```typescript
import { formatDate, formatRelativeTime } from './lib/i18n';

formatDate(new Date()); // "12/20/2024" (en) or "20/12/2024" (fr)
formatRelativeTime(-1, 'day'); // "yesterday" (en) or "hier" (fr)
```

### RTL Support

Configure RTL languages:

```typescript
createI18nPlugin({
  defaultLocale: 'en',
  locales: [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'ar', name: '', dir: 'rtl' },
    { code: 'he', name: '', dir: 'rtl' },
  ],
});
```

```typescript
import { isRTL, currentLocale } from 'philjs-plugin-i18n/client';

if (isRTL()) {
  // Apply RTL styles
}
```

### Type-Safe Translations

The plugin generates TypeScript types for your translation keys:

```typescript
// Auto-generated in src/i18n.d.ts
interface TranslationKeys {
  'common.greeting': string;
  'common.loading': string;
  'buttons.save': string;
  // ...
}

// Now t() is type-safe
t('common.greeting'); // OK
t('invalid.key'); // TypeScript error
```

## API Reference

### Client Functions

| Function | Description |
|----------|-------------|
| `t(key, params?)` | Translate a key with optional interpolation |
| `setLocale(locale)` | Change the current locale |
| `hasTranslation(key)` | Check if a translation exists |
| `formatNumber(value, options?)` | Format a number |
| `formatDate(date, options?)` | Format a date |
| `formatCurrency(value, currency?)` | Format currency |
| `formatRelativeTime(value, unit)` | Format relative time |
| `getAvailableLocales()` | Get all configured locales |
| `isRTL()` | Check if current locale is RTL |

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultLocale` | `string` | Required | Default locale code |
| `locales` | `string[] \| LocaleConfig[]` | Required | Supported locales |
| `fallbackLocale` | `string` | `defaultLocale` | Fallback when translation missing |
| `translationsDir` | `string` | `./src/locales` | Directory for translation files |
| `format` | `'json' \| 'yaml' \| 'js'` | `'json'` | Translation file format |
| `detectBrowserLocale` | `boolean` | `true` | Auto-detect browser locale |
| `persistLocale` | `boolean` | `true` | Save to localStorage |
| `storageKey` | `string` | `'philjs-locale'` | localStorage key |
| `debug` | `boolean` | `false` | Enable debug logging |

## Virtual Module

Import translations via the virtual module:

```typescript
import { translations, locales, getTranslation } from 'virtual:philjs-i18n';

// All translations
console.log(translations);

// Available locales
console.log(locales); // ['en', 'es', 'fr']

// Get specific locale
const esTranslations = getTranslation('es');
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./client
- Source files: packages/philjs-plugin-i18n/src/index.ts, packages/philjs-plugin-i18n/src/client.ts

### Public API
- Direct exports: TranslationKey, createI18nPlugin, currentLocale, formatCurrency, formatDate, formatNumber, formatRelativeTime, getAvailableLocales, getI18nContext, getTranslation, hasTranslation, initI18n, isRTL, loadTranslations, locales, setLocale, t, translations, useTranslation
- Re-exported names: I18nContextValue, I18nPluginConfig, LocaleConfig, PluralRules, TranslationMap, TranslationValue, ViteI18nPluginOptions, currentLocale, formatCurrency, formatDate, formatNumber, formatRelativeTime, getAvailableLocales, getI18nContext, hasTranslation, initI18n, isRTL, loadTranslations, setLocale, t, useTranslation
- Re-exported modules: ./client.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT
