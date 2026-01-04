/**
 * PhilJS Security - XSS Protection
 *
 * HTML sanitization and safe templating utilities.
 */

export {
  sanitize,
  escape,
  unescape,
  html,
  trustedHtml,
  stripTags,
  encodeAttribute,
} from './sanitizer.js';
