/**
 * PhilJS CLI - Component Generator
 *
 * Generate component files with tests and styles
 */
export interface ComponentOptions {
    name: string;
    directory?: string;
    typescript?: boolean;
    withTest?: boolean;
    withStyles?: boolean;
    styleType?: 'css-modules' | 'tailwind' | 'styled' | 'none' | undefined;
}
/**
 * Generate a component
 */
export declare function generateComponent(options: ComponentOptions): Promise<string[]>;
//# sourceMappingURL=component.d.ts.map