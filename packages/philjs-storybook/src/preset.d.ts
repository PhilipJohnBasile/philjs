/**
 * PhilJS Storybook Preset
 *
 * Configures Storybook to work seamlessly with PhilJS components
 */
type StorybookConfig = any;
export declare const viteFinal: (config: any) => Promise<any>;
export declare const core: {
    builder: string;
};
export declare const framework: {
    name: string;
    options: {};
};
export declare const addons: string[];
export declare const typescript: {
    check: boolean;
    reactDocgen: boolean;
};
export declare const docs: {
    autodocs: string;
};
/**
 * Main preset configuration
 */
export declare const presetConfig: Partial<StorybookConfig>;
export default presetConfig;
//# sourceMappingURL=preset.d.ts.map