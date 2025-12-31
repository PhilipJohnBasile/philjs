/**
 * PhilJS i18n Plugin
 *
 * Internationalization plugin for PhilJS with Vite integration,
 * automatic locale detection, and type-safe translations.
 */
import type { Plugin } from 'philjs-core/plugin-system';
import type { I18nPluginConfig } from './types.js';
/**
 * Create i18n plugin
 */
export declare function createI18nPlugin(userConfig: I18nPluginConfig): Plugin;
/**
 * Default export
 */
export default createI18nPlugin;
/**
 * Re-export types
 */
export type { I18nPluginConfig, LocaleConfig, TranslationMap, TranslationValue, I18nContextValue, PluralRules, ViteI18nPluginOptions, } from './types.js';
/**
 * Re-export client utilities
 */
export { currentLocale, initI18n, setLocale, loadTranslations, t, hasTranslation, useTranslation, formatNumber, formatDate, formatCurrency, formatRelativeTime, getI18nContext, getAvailableLocales, isRTL, } from './client.js';
//# sourceMappingURL=index.d.ts.map