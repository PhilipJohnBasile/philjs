/**
 * Type declarations for ESLint plugins without built-in types
 */

declare module 'eslint-plugin-jsx-a11y' {
  import type { ESLint } from 'eslint';
  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-plugin-security' {
  import type { ESLint } from 'eslint';
  const plugin: ESLint.Plugin;
  export default plugin;
}
