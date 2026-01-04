# @philjs/i18n

The `@philjs/i18n` package provides type-safe internationalization for PhilJS applications with reactive locale switching, interpolation, and pluralization support.

## Installation

```bash
npm install @philjs/i18n
```

## Features

- **Reactive Locale** - Signal-based locale switching
- **Nested Keys** - Dot notation for nested translations
- **Interpolation** - Dynamic values in translations
- **Pluralization** - Language-specific plural rules
- **Type Safety** - Full TypeScript inference
- **Fallback** - Fallback locale support

## Quick Start

```typescript
import { createI18n } from '@philjs/i18n';

// Define translations
const translations = {
  en: {
    greeting: 'Hello, {name}!',
    nav: {
      home: 'Home',
      about: 'About',
      contact: 'Contact'
    },
    items: '{count} item(s)'
  },
  es: {
    greeting: '¡Hola, {name}!',
    nav: {
      home: 'Inicio',
      about: 'Acerca de',
      contact: 'Contacto'
    },
    items: '{count} artículo(s)'
  }
};

// Create i18n instance
const i18n = createI18n({
  defaultLocale: 'en',
  translations,
  fallbackLocale: 'en'
});

// Use translations
i18n.t('greeting', { name: 'World' }); // "Hello, World!"
i18n.t('nav.home'); // "Home"

// Switch locale
i18n.setLocale('es');
i18n.t('greeting', { name: 'Mundo' }); // "¡Hola, Mundo!"
```

---

## Creating an I18n Instance

### Basic Setup

```typescript
import { createI18n } from '@philjs/i18n';
import type { TranslationMap, I18nOptions, I18n } from '@philjs/i18n';

// Type-safe translations
interface AppTranslations extends TranslationMap {
  common: {
    loading: string;
    error: string;
    success: string;
  };
  auth: {
    login: string;
    logout: string;
    register: string;
  };
  errors: {
    notFound: string;
    unauthorized: string;
    serverError: string;
  };
}

const translations: Record<string, AppTranslations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Operation successful'
    },
    auth: {
      login: 'Sign In',
      logout: 'Sign Out',
      register: 'Create Account'
    },
    errors: {
      notFound: 'Page not found',
      unauthorized: 'Please sign in to continue',
      serverError: 'Something went wrong'
    }
  },
  de: {
    common: {
      loading: 'Laden...',
      error: 'Ein Fehler ist aufgetreten',
      success: 'Vorgang erfolgreich'
    },
    auth: {
      login: 'Anmelden',
      logout: 'Abmelden',
      register: 'Konto erstellen'
    },
    errors: {
      notFound: 'Seite nicht gefunden',
      unauthorized: 'Bitte melden Sie sich an',
      serverError: 'Etwas ist schief gelaufen'
    }
  }
};

const i18n = createI18n<AppTranslations>({
  defaultLocale: 'en',
  translations,
  fallbackLocale: 'en'
});
```

### Options

```typescript
interface I18nOptions<T extends TranslationMap> {
  /** Default locale on initialization */
  defaultLocale: string;

  /** Translation dictionaries by locale */
  translations: Record<string, T>;

  /** Fallback locale when key is missing */
  fallbackLocale?: string;
}
```

---

## Translation Function

### Basic Usage

```typescript
// Simple key
i18n.t('common.loading'); // "Loading..."

// Nested keys with dot notation
i18n.t('auth.login'); // "Sign In"
i18n.t('errors.notFound'); // "Page not found"
```

### Interpolation

Insert dynamic values into translations:

```typescript
const translations = {
  en: {
    welcome: 'Welcome back, {name}!',
    items: 'You have {count} items in your cart',
    price: 'Total: ${amount}',
    date: 'Posted on {date} by {author}'
  }
};

const i18n = createI18n({ defaultLocale: 'en', translations });

// Single parameter
i18n.t('welcome', { name: 'John' });
// "Welcome back, John!"

// Multiple parameters
i18n.t('date', { date: '2024-01-15', author: 'Jane' });
// "Posted on 2024-01-15 by Jane"

// Numeric values
i18n.t('items', { count: 5 });
// "You have 5 items in your cart"

i18n.t('price', { amount: 99.99 });
// "Total: $99.99"
```

### Missing Keys

When a key is missing:

```typescript
// Warns in console and returns the key
i18n.t('nonexistent.key');
// Console: "Missing translation for key: nonexistent.key"
// Returns: "nonexistent.key"

// Falls back to fallback locale
i18n.setLocale('fr'); // No French translations
i18n.t('common.loading');
// Uses fallbackLocale ('en'): "Loading..."
```

---

## Locale Management

### Reactive Locale Signal

```typescript
import { effect } from '@philjs/core';

// Current locale as a signal
const currentLocale = i18n.locale();
console.log(currentLocale); // "en"

// React to locale changes
effect(() => {
  console.log('Locale changed to:', i18n.locale());
  document.documentElement.lang = i18n.locale();
});

// Change locale
i18n.setLocale('es');
// Effect runs: "Locale changed to: es"
```

### Available Locales

```typescript
// Get all available locales
const locales = i18n.getAvailableLocales();
console.log(locales); // ["en", "es", "de", "fr"]

// Build locale selector
function LocaleSelector() {
  const locales = i18n.getAvailableLocales();
  const current = i18n.locale();

  return (
    <select
      value={current}
      onChange={(e) => i18n.setLocale(e.target.value)}
    >
      {locales.map(locale => (
        <option key={locale} value={locale}>
          {getLocaleName(locale)}
        </option>
      ))}
    </select>
  );
}
```

### Persisting Locale

```typescript
// Load from localStorage
const savedLocale = localStorage.getItem('locale');
const browserLocale = navigator.language.split('-')[0];

const i18n = createI18n({
  defaultLocale: savedLocale || browserLocale || 'en',
  translations,
  fallbackLocale: 'en'
});

// Save on change
effect(() => {
  localStorage.setItem('locale', i18n.locale());
});
```

---

## Pluralization

Handle language-specific plural forms:

```typescript
import { createPlural, pluralRules } from '@philjs/i18n';

// Create plural function
const plural = createPlural(pluralRules);

// Define plural forms
const translations = {
  en: {
    items: ['item', 'items'],           // one, other
    people: ['person', 'people'],
    days: ['day', 'days']
  },
  ru: {
    items: ['товар', 'товара', 'товаров'], // one, few, many
    days: ['день', 'дня', 'дней']
  }
};

// Use pluralization
function formatItems(count: number, locale: string): string {
  const forms = translations[locale]?.items || translations.en.items;
  return `${count} ${plural(locale, count, forms)}`;
}

// English
formatItems(1, 'en');  // "1 item"
formatItems(5, 'en');  // "5 items"

// Russian (complex plurals)
formatItems(1, 'ru');  // "1 товар"
formatItems(2, 'ru');  // "2 товара"
formatItems(5, 'ru');  // "5 товаров"
formatItems(21, 'ru'); // "21 товар"
```

### Built-in Plural Rules

```typescript
import { pluralRules } from '@philjs/i18n';

// English - simple one/other
pluralRules.en(1);  // "one"
pluralRules.en(2);  // "other"

// French - 0 and 1 are singular
pluralRules.fr(0);  // "one"
pluralRules.fr(1);  // "one"
pluralRules.fr(2);  // "other"

// Russian - complex rules
pluralRules.ru(1);  // "one"
pluralRules.ru(2);  // "few"
pluralRules.ru(5);  // "many"
pluralRules.ru(21); // "one"
pluralRules.ru(22); // "few"
```

### Custom Plural Rules

```typescript
import { createPlural } from '@philjs/i18n';

const customRules: Record<string, (n: number) => string> = {
  // Arabic has 6 plural forms
  ar: (n) => {
    if (n === 0) return 'zero';
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    const mod100 = n % 100;
    if (mod100 >= 3 && mod100 <= 10) return 'few';
    if (mod100 >= 11 && mod100 <= 99) return 'many';
    return 'other';
  },

  // Polish
  pl: (n) => {
    if (n === 1) return 'one';
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'few';
    return 'many';
  }
};

const plural = createPlural(customRules);
```

---

## Component Integration

### Using in Components

```typescript
import { createI18n } from '@philjs/i18n';

// Create singleton
export const i18n = createI18n({
  defaultLocale: 'en',
  translations,
  fallbackLocale: 'en'
});

// Export t function for convenience
export const t = i18n.t;

// Use in components
function WelcomeBanner({ userName }: { userName: string }) {
  return (
    <div class="banner">
      <h1>{t('greeting', { name: userName })}</h1>
      <p>{t('common.welcomeMessage')}</p>
    </div>
  );
}

function Navigation() {
  return (
    <nav>
      <a href="/">{t('nav.home')}</a>
      <a href="/about">{t('nav.about')}</a>
      <a href="/contact">{t('nav.contact')}</a>
    </nav>
  );
}
```

### Reactive Updates

```typescript
import { computed } from '@philjs/core';

function Header() {
  // Re-renders when locale changes
  const title = computed(() => i18n.t('app.title'));
  const subtitle = computed(() => i18n.t('app.subtitle'));

  return (
    <header>
      <h1>{title()}</h1>
      <p>{subtitle()}</p>
      <LocaleSelector />
    </header>
  );
}

function LocaleSelector() {
  return (
    <div class="locale-selector">
      <button
        class={i18n.locale() === 'en' ? 'active' : ''}
        onClick={() => i18n.setLocale('en')}
      >
        English
      </button>
      <button
        class={i18n.locale() === 'es' ? 'active' : ''}
        onClick={() => i18n.setLocale('es')}
      >
        Español
      </button>
    </div>
  );
}
```

---

## Organizing Translations

### By Feature

```typescript
// translations/en/auth.ts
export const auth = {
  login: {
    title: 'Sign In',
    email: 'Email Address',
    password: 'Password',
    submit: 'Sign In',
    forgotPassword: 'Forgot your password?',
    noAccount: "Don't have an account?",
    signUp: 'Sign up'
  },
  register: {
    title: 'Create Account',
    name: 'Full Name',
    email: 'Email Address',
    password: 'Password',
    confirm: 'Confirm Password',
    submit: 'Create Account',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in'
  }
};

// translations/en/index.ts
import { auth } from './auth';
import { common } from './common';
import { errors } from './errors';

export const en = {
  auth,
  common,
  errors
};
```

### By Locale

```typescript
// translations/index.ts
import { en } from './en';
import { es } from './es';
import { de } from './de';
import { fr } from './fr';

export const translations = {
  en,
  es,
  de,
  fr
};
```

### Lazy Loading

```typescript
const translations: Record<string, TranslationMap> = {
  en: enTranslations // Always bundled
};

async function loadLocale(locale: string): Promise<void> {
  if (translations[locale]) return;

  try {
    const module = await import(`./translations/${locale}.js`);
    translations[locale] = module.default;
    i18n.setLocale(locale);
  } catch (error) {
    console.error(`Failed to load locale: ${locale}`);
  }
}

// Load on demand
<button onClick={() => loadLocale('es')}>Español</button>
```

---

## Types Reference

```typescript
// Translation map structure
interface TranslationMap {
  [key: string]: string | TranslationMap;
}

// I18n options
interface I18nOptions<T extends TranslationMap = TranslationMap> {
  defaultLocale: string;
  translations: Record<string, T>;
  fallbackLocale?: string;
}

// I18n instance
interface I18n<T extends TranslationMap = TranslationMap> {
  /** Current locale as a signal */
  locale: Signal<string>;

  /** Translation function */
  t: (key: string, params?: Record<string, string | number>) => string;

  /** Change current locale */
  setLocale: (locale: string) => void;

  /** Get all available locales */
  getAvailableLocales: () => string[];
}

// Plural function
type PluralFn = (locale: string, n: number, forms: string[]) => string;
type PluralRule = (n: number) => string;
```

---

## Best Practices

### 1. Use Namespaced Keys

```typescript
// Good - organized by feature
i18n.t('auth.login.title');
i18n.t('dashboard.widgets.chart.title');

// Avoid - flat keys
// i18n.t('loginTitle');
// i18n.t('chartTitle');
```

### 2. Keep Translation Keys Semantic

```typescript
// Good - describes purpose
i18n.t('form.validation.emailRequired');
i18n.t('button.submit');
i18n.t('error.network');

// Avoid - describes appearance
// i18n.t('redErrorText');
// i18n.t('bigButton');
```

### 3. Provide Context in Keys

```typescript
// Good - clear context
i18n.t('user.profile.edit'); // Edit profile button
i18n.t('post.edit');         // Edit post button

// Avoid - ambiguous
// i18n.t('edit'); // Edit what?
```

### 4. Use Interpolation for Dynamic Content

```typescript
// Good - flexible
i18n.t('greeting', { name: userName });
// "Hello, {name}!"

// Avoid - concatenation
// i18n.t('hello') + ' ' + userName + '!'
```

### 5. Always Provide Fallback Locale

```typescript
const i18n = createI18n({
  defaultLocale: 'en',
  translations,
  fallbackLocale: 'en' // Ensures keys always resolve
});
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `createI18n` | Create i18n instance |
| `createPlural` | Create pluralization function |
| `pluralRules` | Built-in plural rules (en, fr, de, es, ru) |

### I18n Methods

| Method | Description |
|--------|-------------|
| `t(key, params?)` | Translate key with optional interpolation |
| `setLocale(locale)` | Change current locale |
| `getAvailableLocales()` | Get all configured locales |
| `locale` | Signal containing current locale |

---

## Next Steps

- [@philjs/plugin-i18n Vite Plugin](../plugins/i18n.md)
- [SSR with I18n](../ssr/i18n.md)
- [Locale Detection](./locale-detection.md)
