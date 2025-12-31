/**
 * PDF Templates
 *
 * Built-in templates for common document types.
 */
export * from './invoice.js';
export * from './report.js';
export * from './certificate.js';
export declare const templates: {
    readonly invoice: "invoice";
    readonly report: "report";
    readonly certificate: "certificate";
};
export type TemplateName = keyof typeof templates;
//# sourceMappingURL=index.d.ts.map