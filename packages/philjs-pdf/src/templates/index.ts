/**
 * PDF Templates
 *
 * Built-in templates for common document types.
 */

export * from './invoice.js';
export * from './report.js';
export * from './certificate.js';

// Template registry for dynamic lookup
export const templates = {
  invoice: 'invoice',
  report: 'report',
  certificate: 'certificate',
} as const;

export type TemplateName = keyof typeof templates;
