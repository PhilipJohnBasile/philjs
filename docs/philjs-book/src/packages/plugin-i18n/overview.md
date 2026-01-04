# @philjs/plugin-i18n

Internationalization plugin for PhilJS with Vite integration, automatic locale detection, and type-safe translations.

## Introduction

The `@philjs/plugin-i18n` package provides a complete internationalization (i18n) solution for PhilJS applications. It features:

- **Vite Integration**: Virtual module for translation loading with hot module replacement
- **Type-Safe Translations**: Automatic TypeScript type generation from translation files
- **Browser Locale Detection**: Automatically detect and use the user's preferred language
- **Locale Persistence**: Remember user's language preference across sessions
- **URL Strategies**: Support for path prefixes, subdomains, or query parameters
- **SEO Support**: Automatic `<html lang>` and direction attributes
- **Formatting Utilities**: Built-in number, date, currency, and relative time formatting
- **Pluralization**: Full ICU-style plural rules support
- **RTL Support**: Right-to-left language detection and handling

## Installation

```bash
npm install @philjs/plugin-i18n
# or
pnpm add @philjs/plugin-i18n
```

## Configuration

### I18nPluginConfig

The plugin accepts a configuration object with the following options:

```typescript
import { createI18nPlugin } from '@philjs/plugin-i18n';

const i18nPlugin = createI18nPlugin({
  // Required: Default locale code
  defaultLocale: 'en',

  // Required: List of supported locales
  locales: ['en', 'es', 'fr', 'de', 'ar'],

  // Optional: Fallback when translation is missing (default: 'en')
  fallbackLocale: 'en',

  // Optional: Directory containing translation files (default: './src/locales')
  translationsDir: './src/locales',

  // Optional: Translation file format (default: 'json')
  format: 'json', // 'json' | 'yaml' | 'js' | 'ts'

  // Optional: Auto-detect browser locale (default: true)
  detectBrowserLocale: true,

  // Optional: Persist locale to localStorage (default: true)
  persistLocale: true,

  // Optional: localStorage key (default: 'philjs-locale')
  storageKey: 'philjs-locale',

  // Optional: URL strategy for locales (default: 'none')
  urlStrategy: 'prefix', // 'prefix' | 'subdomain' | 'query' | 'none'

  // Optional: Enable SEO meta tags (default: true)
  seo: true,

  // Optional: Enable debug mode (default: false)
  debug: false,

  // Optional: Missing translation handler (default: 'warn')
  onMissingTranslation: 'warn', // 'warn' | 'error' | 'ignore' | custom function
});
```

### Locale Configuration

You can provide detailed locale configurations instead of simple locale codes:

```typescript
import { createI18nPlugin } from '@philjs/plugin-i18n';
import type { LocaleConfig } from '@philjs/plugin-i18n';

const locales: LocaleConfig[] = [
  {
    code: 'en',
    name: 'English',
    dir: 'ltr',
    currency: 'USD',
  },
  {
    code: 'es',
    name: 'Espanol',
    dir: 'ltr',
    currency: 'EUR',
  },
  {
    code: 'ar',
    name: 'Arabic',
    dir: 'rtl',
    currency: 'SAR',
  },
];

const i18nPlugin = createI18nPlugin({
  defaultLocale: 'en',
  locales,
  fallbackLocale: 'en',
});
```

### LocaleConfig Interface

```typescript
interface LocaleConfig {
  /** Locale code (e.g., 'en', 'en-US') */
  code: string;
  /** Display name */
  name: string;
  /** Text direction */
  dir?: 'ltr' | 'rtl';
  /** Date format */
  dateFormat?: string;
  /** Number format */
  numberFormat?: Intl.NumberFormatOptions;
  /** Currency */
  currency?: string;
}
```

## Vite Plugin

### Virtual Module

The plugin provides a virtual module `virtual:philjs-i18n` that automatically loads all translation files from your translations directory:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createI18nPlugin } from '@philjs/plugin-i18n';

export default defineConfig({
  plugins: [
    createI18nPlugin({
      defaultLocale: 'en',
      locales: ['en', 'es', 'fr'],
      translationsDir: './src/locales',
    }).vitePlugin(),
  ],
});
```

### Using the Virtual Module

```typescript
import { translations, locales, getTranslation } from 'virtual:philjs-i18n';

// Access all translations
console.log(translations);
// { en: {...}, es: {...}, fr: {...} }

// Get available locales
console.log(locales);
// ['en', 'es', 'fr']

// Get translations for a specific locale
const enTranslations = getTranslation('en');
```

### Type Generation

The plugin automatically generates TypeScript types for your translations at build time. By default, types are written to `./src/i18n.d.ts`:

```typescript
// Auto-generated i18n.d.ts
declare module 'virtual:philjs-i18n' {
  export const translations: Record<string, TranslationMap>;
  export const locales: string[];
  export function getTranslation(locale: string): TranslationMap;
}

interface TranslationKeys {
  'common.loading': string;
  'common.error': string;
  'validation.required': string;
  'validation.email': string;
  // ... all your translation keys
}

export type TranslationKey = keyof TranslationKeys;
```

### Hot Module Replacement

The Vite plugin supports HMR - when you modify translation files, changes are reflected immediately without a full page reload.

## Client API

Import client utilities from `@philjs/plugin-i18n/client` or the main package:

```typescript
import {
  initI18n,
  t,
  setLocale,
  currentLocale,
  formatNumber,
  formatDate,
  formatCurrency,
  formatRelativeTime,
  useTranslation,
  isRTL,
  hasTranslation,
  getAvailableLocales,
  getI18nContext,
} from '@philjs/plugin-i18n';
```

### initI18n()

Initialize the i18n system. This is typically called once at application startup:

```typescript
import { initI18n } from '@philjs/plugin-i18n';
import { translations, locales } from 'virtual:philjs-i18n';

initI18n({
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr'],
  translations,
  detectBrowserLocale: true,
  persistLocale: true,
  storageKey: 'philjs-locale',
});
```

### t() - Translation Function

The primary function for translating keys:

```typescript
import { t } from '@philjs/plugin-i18n';

// Simple translation
const greeting = t('common.greeting');
// "Hello!"

// With interpolation
const welcome = t('common.welcome', { name: 'Alice' });
// "Welcome, Alice!"

// With explicit locale
const spanishGreeting = t('common.greeting', undefined, { locale: 'es' });
// "Hola!"

// With pluralization
const itemCount = t('cart.items', { count: 5 }, { count: 5 });
// "5 items"
```

### setLocale() - Change Locale

Change the current locale at runtime:

```typescript
import { setLocale, currentLocale } from '@philjs/plugin-i18n';

// Get current locale (reactive signal)
console.log(currentLocale());
// "en"

// Change locale
setLocale('es');

// Change without persisting to localStorage
setLocale('fr', { persist: false });

// Use custom storage key
setLocale('de', { storageKey: 'my-app-locale' });
```

When you call `setLocale()`, the plugin automatically:
- Updates the `<html lang>` attribute
- Updates the `<html dir>` attribute for RTL languages
- Persists the choice to localStorage (if enabled)

### formatNumber()

Format numbers according to the current locale:

```typescript
import { formatNumber } from '@philjs/plugin-i18n';

// Basic formatting
formatNumber(1234567.89);
// "1,234,567.89" (en) or "1.234.567,89" (de)

// With options
formatNumber(0.75, { style: 'percent' });
// "75%"

// Explicit locale
formatNumber(1234.56, { minimumFractionDigits: 2 }, 'de');
// "1.234,56"
```

### formatDate()

Format dates according to the current locale:

```typescript
import { formatDate } from '@philjs/plugin-i18n';

const date = new Date('2024-12-25');

// Default formatting
formatDate(date);
// "12/25/2024" (en-US) or "25/12/2024" (en-GB)

// With options
formatDate(date, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
// "Wednesday, December 25, 2024"

// Short format
formatDate(date, { dateStyle: 'short' });
// "12/25/24"

// From timestamp
formatDate(1703462400000);

// From ISO string
formatDate('2024-12-25T00:00:00Z');
```

### formatCurrency()

Format currency values:

```typescript
import { formatCurrency } from '@philjs/plugin-i18n';

// Uses locale's default currency
formatCurrency(99.99);
// "$99.99" (en-US)

// Explicit currency
formatCurrency(99.99, 'EUR');
// "99.99 EUR" or "99,99 EUR" depending on locale

// With explicit locale
formatCurrency(99.99, 'JPY', 'ja');
// "99 JPY"
```

### formatRelativeTime()

Format relative time expressions:

```typescript
import { formatRelativeTime } from '@philjs/plugin-i18n';

// Days ago
formatRelativeTime(-1, 'day');
// "yesterday"

formatRelativeTime(-3, 'day');
// "3 days ago"

// Future
formatRelativeTime(2, 'hour');
// "in 2 hours"

// Other units
formatRelativeTime(-1, 'week');
// "last week"

formatRelativeTime(1, 'month');
// "next month"
```

### useTranslation() Hook

Create reactive translations that update when the locale changes:

```typescript
import { useTranslation } from '@philjs/plugin-i18n';

// Returns a memo (reactive getter)
const greeting = useTranslation('common.greeting');

// With parameters
const welcome = useTranslation('common.welcome', { name: 'Alice' });

// Usage in components
function WelcomeMessage() {
  const message = useTranslation('common.welcome', { name: 'User' });

  return () => <h1>{message()}</h1>;
}
```

### isRTL() - RTL Language Detection

Check if the current or specified locale is right-to-left:

```typescript
import { isRTL, setLocale } from '@philjs/plugin-i18n';

// Check current locale
console.log(isRTL());
// false (for 'en')

setLocale('ar');
console.log(isRTL());
// true

// Check specific locale
console.log(isRTL('he'));
// true

console.log(isRTL('fr'));
// false
```

### Additional Utilities

```typescript
import {
  hasTranslation,
  getAvailableLocales,
  getI18nContext,
  currentLocale,
  loadTranslations,
} from '@philjs/plugin-i18n';

// Check if a translation exists
if (hasTranslation('custom.key')) {
  console.log(t('custom.key'));
}

// Get all configured locales with their configs
const locales = getAvailableLocales();
// [{ code: 'en', name: 'English', dir: 'ltr' }, ...]

// Get context for use with Context API
const i18nContext = getI18nContext();

// Load translations dynamically
await loadTranslations('ja', async () => {
  const module = await import('./locales/ja.json');
  return module.default;
});

// Access current locale signal
const locale = currentLocale();
```

## Translation File Format

### JSON Format

Create translation files in your `translationsDir` (default: `./src/locales`):

```
src/
  locales/
    en.json
    es.json
    fr.json
    ar.json
```

**en.json:**
```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Retry",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete"
  },
  "auth": {
    "login": "Log In",
    "logout": "Log Out",
    "welcome": "Welcome, {{name}}!"
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be at most {{max}} characters"
  }
}
```

**es.json:**
```json
{
  "common": {
    "loading": "Cargando...",
    "error": "Ocurrio un error",
    "retry": "Reintentar",
    "cancel": "Cancelar",
    "save": "Guardar",
    "delete": "Eliminar"
  },
  "auth": {
    "login": "Iniciar sesion",
    "logout": "Cerrar sesion",
    "welcome": "Bienvenido, {{name}}!"
  },
  "validation": {
    "required": "Este campo es obligatorio",
    "email": "Por favor ingrese un email valido",
    "minLength": "Debe tener al menos {{min}} caracteres",
    "maxLength": "Debe tener como maximo {{max}} caracteres"
  }
}
```

### YAML Format

You can also use YAML for translations (set `format: 'yaml'`):

**en.yaml:**
```yaml
common:
  loading: Loading...
  error: An error occurred
  retry: Retry
  cancel: Cancel

auth:
  login: Log In
  logout: Log Out
  welcome: "Welcome, {{name}}!"

cart:
  items:
    one: "{{count}} item"
    other: "{{count}} items"
```

## Interpolation

Use double curly braces `{{variable}}` for variable interpolation:

```json
{
  "greeting": "Hello, {{name}}!",
  "orderStatus": "Your order #{{orderId}} is {{status}}",
  "temperature": "Current temperature: {{temp}} degrees"
}
```

```typescript
t('greeting', { name: 'Alice' });
// "Hello, Alice!"

t('orderStatus', { orderId: '12345', status: 'shipped' });
// "Your order #12345 is shipped"

t('temperature', { temp: 72 });
// "Current temperature: 72 degrees"
```

## Pluralization

The plugin uses ICU plural rules via `Intl.PluralRules`. Define plural forms as objects:

```json
{
  "cart": {
    "items": {
      "zero": "Your cart is empty",
      "one": "{{count}} item in your cart",
      "other": "{{count}} items in your cart"
    }
  },
  "notifications": {
    "unread": {
      "one": "You have {{count}} unread message",
      "other": "You have {{count}} unread messages"
    }
  }
}
```

```typescript
t('cart.items', { count: 0 }, { count: 0 });
// "Your cart is empty"

t('cart.items', { count: 1 }, { count: 1 });
// "1 item in your cart"

t('cart.items', { count: 5 }, { count: 5 });
// "5 items in your cart"
```

### Plural Categories

The following plural categories are supported (availability depends on locale):

| Category | Description | Example Languages |
|----------|-------------|-------------------|
| `zero` | Zero quantity | Arabic, Latvian |
| `one` | Singular | English, Spanish, French |
| `two` | Dual | Arabic, Hebrew, Slovenian |
| `few` | Few (paucal) | Russian, Polish, Czech |
| `many` | Many | Arabic, Russian, Polish |
| `other` | Default/plural | All languages (required) |

## Type-Safe Translations

### Automatic Type Generation

The Vite plugin automatically generates TypeScript types from your translation files:

```typescript
// Auto-generated at ./src/i18n.d.ts
interface TranslationKeys {
  'common.loading': string;
  'common.error': string;
  'auth.login': string;
  'auth.welcome': string;
  'validation.required': string;
  'validation.minLength': string;
}

export type TranslationKey = keyof TranslationKeys;
```

### Type-Safe Translation Function

Create a typed wrapper for the `t` function:

```typescript
// src/lib/i18n.ts
import { t as baseT } from '@philjs/plugin-i18n';
import type { TranslationKey } from './i18n.d';

export function t(
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  return baseT(key, params);
}
```

Now TypeScript will provide autocomplete and catch typos:

```typescript
import { t } from './lib/i18n';

// TypeScript autocomplete works!
t('common.loading');

// Error: Argument of type '"common.typo"' is not assignable
t('common.typo');
```

### Manual Type Definitions

You can also define types manually for more control:

```typescript
// src/types/i18n.ts
export interface Translations {
  common: {
    loading: string;
    error: string;
    actions: {
      save: string;
      cancel: string;
    };
  };
  auth: {
    login: string;
    welcome: string; // expects {{name}} param
  };
}

// Helper type for dot-notation keys
type DotNotation<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? DotNotation<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never;
    }[keyof T]
  : never;

export type TranslationKey = DotNotation<Translations>;
// "common.loading" | "common.error" | "common.actions.save" | ...
```

## Complete Example

### Project Setup

```
my-app/
  src/
    locales/
      en.json
      es.json
      ar.json
    lib/
      i18n.ts
    components/
      LanguageSwitcher.tsx
    App.tsx
  vite.config.ts
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { createI18nPlugin } from '@philjs/plugin-i18n';

const i18nPlugin = createI18nPlugin({
  defaultLocale: 'en',
  locales: [
    { code: 'en', name: 'English', dir: 'ltr', currency: 'USD' },
    { code: 'es', name: 'Espanol', dir: 'ltr', currency: 'EUR' },
    { code: 'ar', name: 'Arabic', dir: 'rtl', currency: 'SAR' },
  ],
  translationsDir: './src/locales',
  detectBrowserLocale: true,
  persistLocale: true,
});

export default defineConfig({
  plugins: [i18nPlugin.vitePlugin()],
});
```

### src/lib/i18n.ts

```typescript
import {
  initI18n,
  t,
  setLocale,
  currentLocale,
  formatNumber,
  formatDate,
  formatCurrency
} from '@philjs/plugin-i18n';
import { translations, locales } from 'virtual:philjs-i18n';

// Initialize i18n
initI18n({
  defaultLocale: 'en',
  locales: [
    { code: 'en', name: 'English', dir: 'ltr', currency: 'USD' },
    { code: 'es', name: 'Espanol', dir: 'ltr', currency: 'EUR' },
    { code: 'ar', name: 'Arabic', dir: 'rtl', currency: 'SAR' },
  ],
  translations,
  detectBrowserLocale: true,
  persistLocale: true,
});

export {
  t,
  setLocale,
  currentLocale,
  formatNumber,
  formatDate,
  formatCurrency
};
export { locales, translations };
```

### src/components/LanguageSwitcher.tsx

```typescript
import { getAvailableLocales, setLocale, currentLocale } from '../lib/i18n';

export function LanguageSwitcher() {
  const locales = getAvailableLocales();

  return () => (
    <select
      value={currentLocale()}
      onChange={(e) => setLocale(e.target.value)}
    >
      {locales.map(locale => (
        <option key={locale.code} value={locale.code}>
          {locale.name}
        </option>
      ))}
    </select>
  );
}
```

### src/App.tsx

```typescript
import { t, formatCurrency, formatDate } from './lib/i18n';
import { LanguageSwitcher } from './components/LanguageSwitcher';

export function App() {
  const price = 99.99;
  const orderDate = new Date();

  return () => (
    <div>
      <header>
        <LanguageSwitcher />
      </header>

      <main>
        <h1>{t('common.welcome', { name: 'User' })}</h1>

        <p>{t('common.loading')}</p>

        <div class="order-info">
          <p>
            {t('order.total')}: {formatCurrency(price)}
          </p>
          <p>
            {t('order.date')}: {formatDate(orderDate, { dateStyle: 'long' })}
          </p>
        </div>
      </main>
    </div>
  );
}
```

## API Reference

### Types

```typescript
// Translation value types
type TranslationValue = string | TranslationMap;

interface TranslationMap {
  [key: string]: TranslationValue;
}

// Plural rules
interface PluralRules {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

// Locale configuration
interface LocaleConfig {
  code: string;
  name: string;
  dir?: 'ltr' | 'rtl';
  dateFormat?: string;
  numberFormat?: Intl.NumberFormatOptions;
  currency?: string;
}

// Plugin configuration
interface I18nPluginConfig {
  defaultLocale: string;
  locales: string[] | LocaleConfig[];
  fallbackLocale?: string;
  translationsDir?: string;
  format?: 'json' | 'yaml' | 'js' | 'ts';
  detectBrowserLocale?: boolean;
  persistLocale?: boolean;
  storageKey?: string;
  debug?: boolean;
  onMissingTranslation?: 'warn' | 'error' | 'ignore' | ((key: string, locale: string) => string);
  urlStrategy?: 'prefix' | 'subdomain' | 'query' | 'none';
  routePrefix?: string;
  seo?: boolean;
}

// Vite plugin options
interface ViteI18nPluginOptions {
  translationsDir: string;
  virtualModuleId?: string;
  watch?: boolean;
  generateTypes?: boolean;
  typesOutputPath?: string;
}

// Context value
interface I18nContextValue {
  locale: string;
  locales: string[];
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  hasTranslation: (key: string) => boolean;
  getLocaleConfig: (locale?: string) => LocaleConfig | undefined;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => string;
}
```

### Functions

| Function | Description |
|----------|-------------|
| `createI18nPlugin(config)` | Create the i18n plugin |
| `initI18n(config)` | Initialize i18n on the client |
| `t(key, params?, options?)` | Translate a key |
| `setLocale(locale, options?)` | Change the current locale |
| `currentLocale()` | Get the current locale (signal) |
| `useTranslation(key, params?)` | Create a reactive translation |
| `hasTranslation(key, locale?)` | Check if a translation exists |
| `formatNumber(value, options?, locale?)` | Format a number |
| `formatDate(date, options?, locale?)` | Format a date |
| `formatCurrency(value, currency?, locale?)` | Format currency |
| `formatRelativeTime(value, unit, locale?)` | Format relative time |
| `isRTL(locale?)` | Check if locale is RTL |
| `getAvailableLocales()` | Get all configured locales |
| `getI18nContext()` | Get context for Context API |
| `loadTranslations(locale, loader)` | Load translations dynamically |

## See Also

- [@philjs/i18n](../i18n/overview.md) - Core i18n utilities
- [@philjs/router](../router/overview.md) - For locale-aware routing
- [@philjs/core](../core/overview.md) - Core PhilJS framework
