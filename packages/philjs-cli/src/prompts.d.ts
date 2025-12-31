/**
 * PhilJS CLI - Interactive Prompts
 *
 * RedwoodJS-inspired interactive prompts for code generation
 */
export type GeneratorType = 'component' | 'page' | 'api' | 'model' | 'scaffold' | 'hook' | 'context' | 'route' | 'store';
export interface GeneratorAnswers {
    type: GeneratorType;
    name: string;
    includeTests: boolean;
    includeStyles: boolean;
    typescript: boolean;
    fields?: string[];
}
export interface ModelField {
    name: string;
    type: string;
    modifiers: string[];
    references?: string;
}
/**
 * Interactive prompt for generator type selection
 */
export declare function promptGeneratorType(): Promise<GeneratorType | null>;
/**
 * Interactive prompt for generator name
 */
export declare function promptName(type: GeneratorType): Promise<string | null>;
/**
 * Interactive prompt for model fields
 */
export declare function promptModelFields(): Promise<ModelField[]>;
/**
 * Parse a field definition string
 */
export declare function parseFieldDefinition(definition: string): ModelField | null;
/**
 * Interactive prompt for generator options
 */
export declare function promptOptions(type: GeneratorType): Promise<Partial<GeneratorAnswers>>;
/**
 * Full interactive mode
 */
export declare function runInteractiveMode(): Promise<GeneratorAnswers | null>;
/**
 * Confirm generation before proceeding
 */
export declare function confirmGeneration(files: string[]): Promise<boolean>;
//# sourceMappingURL=prompts.d.ts.map