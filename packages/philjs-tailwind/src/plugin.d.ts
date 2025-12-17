/**
 * PhilJS Tailwind Plugin
 *
 * Custom utilities and components for PhilJS applications.
 */
export interface PhilJSPluginOptions {
    /** Add signal-related utilities */
    signals?: boolean;
    /** Add component base styles */
    components?: boolean;
    /** Add animation utilities */
    animations?: boolean;
    /** Add form utilities */
    forms?: boolean;
    /** Add typography utilities */
    typography?: boolean;
}
export declare function philjsTailwindPlugin(options?: PhilJSPluginOptions): {
    handler: import("tailwindcss/types/config").PluginCreator;
    config?: Partial<import("tailwindcss/types/config").Config>;
};
export declare function createPhilJSPlugin(options?: PhilJSPluginOptions): {
    handler: import("tailwindcss/types/config").PluginCreator;
    config?: Partial<import("tailwindcss/types/config").Config>;
};
export default philjsTailwindPlugin;
//# sourceMappingURL=plugin.d.ts.map