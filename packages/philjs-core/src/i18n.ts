/**
 * First-class internationalization (i18n) system.
 * Route-based locales, automatic extraction, AI-powered translations.
 */

import { signal } from "./signals.js";
import { createContext, useContext } from "./context.js";

export type Locale = string; // e.g., "en", "es", "fr-CA"

export type TranslationKey = string;

export type Translations = {
  [key: string]: string | Translations;
};

export type PluralRules = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

export type I18nConfig = {
  /** Default locale */
  defaultLocale: Locale;
  /** Supported locales */
  locales: Locale[];
  /** Translation messages */
  messages: Record<Locale, Translations>;
  /** Fallback locale when translation missing */
  fallbackLocale?: Locale;
  /** Auto-detect locale from browser/headers */
  autoDetect?: boolean;
  /** Route-based locale detection pattern */
  routePattern?: string; // e.g., "/[locale]/*"
};

export type FormatOptions = {
  /** Variables to interpolate */
  vars?: Record<string, string | number>;
  /** Plural count for plural forms */
  count?: number;
  /** Date/number formatting options */
  format?: Intl.DateTimeFormatOptions | Intl.NumberFormatOptions;
};

/**
 * i18n context for accessing translations.
 */
const I18nContext = createContext<{
  locale: () => Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, options?: FormatOptions) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency: string) => string;
  getAvailableLocales: () => Locale[];
} | null>(null);

/**
 * I18n provider component.
 */
export function I18nProvider(props: {
  config: I18nConfig;
  children: any;
}) {
  const { config } = props;

  // Detect initial locale
  const initialLocale = detectLocale(config);
  const currentLocale = signal<Locale>(initialLocale);

  const t = (key: TranslationKey, options?: FormatOptions): string => {
    const locale = currentLocale();
    let message = getNestedTranslation(config.messages[locale], key);

    // Fallback to default locale
    if (!message && config.fallbackLocale) {
      message = getNestedTranslation(config.messages[config.fallbackLocale], key);
    }

    // Fallback to key itself
    if (!message) {
      console.warn(`Missing translation for key: ${key} (locale: ${locale})`);
      return key;
    }

    // Handle pluralization
    if (options?.count !== undefined) {
      message = handlePluralization(message, options.count, locale);
    }

    // Interpolate variables
    if (options?.vars) {
      message = interpolate(message, options.vars);
    }

    return message;
  };

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return new Intl.DateTimeFormat(currentLocale(), options).format(date);
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(currentLocale(), options).format(num);
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat(currentLocale(), {
      style: "currency",
      currency,
    }).format(amount);
  };

  const value = {
    locale: () => currentLocale(),
    setLocale: (locale: Locale) => currentLocale.set(locale),
    t,
    formatDate,
    formatNumber,
    formatCurrency,
    getAvailableLocales: () => config.locales,
  };

  return I18nContext.Provider({ value, children: props.children });
}

/**
 * Hook to use i18n in components.
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

/**
 * Hook for simple translation.
 */
export function useTranslation() {
  const { t } = useI18n();
  return t;
}

/**
 * Detect locale from various sources.
 */
function detectLocale(config: I18nConfig): Locale {
  if (!config.autoDetect) {
    return config.defaultLocale;
  }

  // Server-side: check Accept-Language header
  if (typeof window === "undefined") {
    // Would get from request headers
    return config.defaultLocale;
  }

  // Client-side: check URL, localStorage, navigator

  // 1. Check URL path (e.g., /es/about)
  const pathLocale = extractLocaleFromPath(window.location.pathname, config.routePattern);
  if (pathLocale && config.locales.includes(pathLocale)) {
    return pathLocale;
  }

  // 2. Check localStorage
  const storedLocale = localStorage.getItem("philjs_locale");
  if (storedLocale && config.locales.includes(storedLocale)) {
    return storedLocale;
  }

  // 3. Check browser language
  const browserLocale = navigator.language.split("-")[0];
  if (config.locales.includes(browserLocale)) {
    return browserLocale;
  }

  return config.defaultLocale;
}

/**
 * Extract locale from URL path.
 */
function extractLocaleFromPath(path: string, pattern?: string): Locale | null {
  if (!pattern) return null;

  // Simple pattern matching for /[locale]/*
  const match = path.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)\//);
  return match ? match[1] : null;
}

/**
 * Get nested translation by key path.
 */
function getNestedTranslation(obj: Translations, key: string): string | null {
  const keys = key.split(".");
  let current: any = obj;

  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = current[k];
    } else {
      return null;
    }
  }

  return typeof current === "string" ? current : null;
}

/**
 * Handle plural forms based on count.
 */
function handlePluralization(message: string, count: number, locale: Locale): string {
  // Check if message is a plural object
  try {
    const pluralObj = JSON.parse(message) as PluralRules;
    const pluralRule = new Intl.PluralRules(locale);
    const category = pluralRule.select(count);

    return pluralObj[category as keyof PluralRules] || pluralObj.other;
  } catch {
    // Not a plural object, return as-is
    return message;
  }
}

/**
 * Interpolate variables into message.
 */
function interpolate(message: string, vars: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (_, key) => {
    return key in vars ? String(vars[key]) : `{${key}}`;
  });
}

/**
 * Automatic translation extraction tool.
 */
export class TranslationExtractor {
  private keys = new Set<string>();
  private usage = new Map<string, { file: string; line: number }[]>();

  /**
   * Extract translation keys from source code.
   */
  extractFromCode(code: string, filePath: string): void {
    // Match t('key'), t("key"), t(`key`)
    const regex = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    let lineNumber = 1;
    for (let i = 0; i < code.length; i++) {
      if (code[i] === "\n") lineNumber++;

      const remaining = code.slice(i);
      match = regex.exec(remaining);
      if (match) {
        const key = match[1];
        this.keys.add(key);

        const usages = this.usage.get(key) || [];
        usages.push({ file: filePath, line: lineNumber });
        this.usage.set(key, usages);

        i += match[0].length - 1;
      }
    }
  }

  /**
   * Generate translation file template.
   */
  generateTemplate(locale: Locale): Translations {
    const translations: Translations = {};

    for (const key of this.keys) {
      setNestedKey(translations, key, `[Missing translation: "${key}" (${locale})]`);
    }

    return translations;
  }

  /**
   * Get all extracted keys.
   */
  getKeys(): string[] {
    return Array.from(this.keys).sort();
  }

  /**
   * Get usage information for a key.
   */
  getUsage(key: string): { file: string; line: number }[] {
    return this.usage.get(key) || [];
  }

  /**
   * Find missing translations.
   */
  findMissing(translations: Translations): string[] {
    const missing: string[] = [];

    for (const key of this.keys) {
      if (!getNestedTranslation(translations, key)) {
        missing.push(key);
      }
    }

    return missing;
  }

  /**
   * Find unused translations.
   */
  findUnused(translations: Translations): string[] {
    const unused: string[] = [];
    const flatKeys = flattenKeys(translations);

    for (const key of flatKeys) {
      if (!this.keys.has(key)) {
        unused.push(key);
      }
    }

    return unused;
  }
}

/**
 * Set nested key in object.
 */
function setNestedKey(obj: Translations, key: string, value: string): void {
  const keys = key.split(".");
  let current: any = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current)) {
      current[k] = {};
    }
    current = current[k];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Flatten nested translation object to key paths.
 */
function flattenKeys(obj: Translations, prefix = ""): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      keys.push(fullKey);
    } else {
      keys.push(...flattenKeys(value, fullKey));
    }
  }

  return keys;
}

/**
 * AI-powered translation service.
 */
export class AITranslationService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Translate text using AI.
   */
  async translate(
    text: string,
    sourceLocale: Locale,
    targetLocale: Locale
  ): Promise<string> {
    // Integration with translation APIs (OpenAI, Google Translate, DeepL, etc.)
    console.log(`Translating "${text}" from ${sourceLocale} to ${targetLocale}`);

    // Placeholder - would integrate with actual API
    return `[AI Translation: ${text} -> ${targetLocale}]`;
  }

  /**
   * Batch translate all missing keys.
   */
  async translateBatch(
    keys: string[],
    sourceTranslations: Translations,
    sourceLocale: Locale,
    targetLocale: Locale
  ): Promise<Translations> {
    const result: Translations = {};

    for (const key of keys) {
      const source = getNestedTranslation(sourceTranslations, key);
      if (source) {
        const translated = await this.translate(source, sourceLocale, targetLocale);
        setNestedKey(result, key, translated);
      }
    }

    return result;
  }

  /**
   * Suggest improvements for existing translations.
   */
  async suggestImprovements(
    translation: string,
    context: string,
    locale: Locale
  ): Promise<string[]> {
    // Use AI to suggest better translations based on context
    return [
      `Alternative 1: [Improved version]`,
      `Alternative 2: [Contextual version]`,
    ];
  }
}

/**
 * Route-based locale detection middleware.
 */
export function createLocaleMiddleware(config: I18nConfig) {
  return (request: Request): Locale => {
    const url = new URL(request.url);
    const pathLocale = extractLocaleFromPath(url.pathname, config.routePattern);

    if (pathLocale && config.locales.includes(pathLocale)) {
      return pathLocale;
    }

    // Check Accept-Language header
    const acceptLanguage = request.headers.get("Accept-Language");
    if (acceptLanguage) {
      const preferred = acceptLanguage
        .split(",")[0]
        .split("-")[0]
        .toLowerCase();

      if (config.locales.includes(preferred)) {
        return preferred;
      }
    }

    return config.defaultLocale;
  };
}