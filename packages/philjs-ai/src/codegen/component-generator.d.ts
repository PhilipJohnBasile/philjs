/**
 * Component Generator - AI-powered component generation for PhilJS
 *
 * Generates components from:
 * - Natural language descriptions
 * - Wireframes/screenshots (via vision models)
 * - Style customization options
 * - Accessibility compliance requirements
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Component generation configuration
 */
export interface ComponentGenerationConfig {
    /** Component name */
    name: string;
    /** Natural language description of the component */
    description: string;
    /** Component props interface */
    props?: PropDefinition[];
    /** Style preferences */
    style?: StyleConfig;
    /** Accessibility requirements */
    accessibility?: AccessibilityConfig;
    /** Generate tests alongside component */
    includeTests?: boolean;
    /** Generate Storybook stories */
    includeStories?: boolean;
    /** Use PhilJS signals for state */
    useSignals?: boolean;
    /** Framework variant */
    framework?: 'philjs' | 'react-compat';
}
/**
 * Prop definition for component
 */
export interface PropDefinition {
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: string;
    description?: string;
}
/**
 * Style configuration
 */
export interface StyleConfig {
    /** Styling approach */
    approach: 'tailwind' | 'css-modules' | 'styled-components' | 'inline' | 'none';
    /** Theme tokens to use */
    theme?: {
        colors?: Record<string, string>;
        spacing?: Record<string, string>;
        typography?: Record<string, string>;
    };
    /** Responsive breakpoints */
    responsive?: boolean;
    /** Dark mode support */
    darkMode?: boolean;
}
/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
    /** WCAG compliance level */
    wcagLevel: 'A' | 'AA' | 'AAA';
    /** Include ARIA labels */
    ariaLabels?: boolean;
    /** Keyboard navigation support */
    keyboardNav?: boolean;
    /** Screen reader optimizations */
    screenReader?: boolean;
    /** Focus management */
    focusManagement?: boolean;
    /** Color contrast requirements */
    colorContrast?: boolean;
}
/**
 * Wireframe/screenshot analysis configuration
 */
export interface WireframeConfig {
    /** Base64 encoded image data */
    imageData: string;
    /** Image format */
    format: 'png' | 'jpg' | 'webp';
    /** Additional context about the wireframe */
    context?: string;
    /** Identify interactive elements */
    identifyInteractive?: boolean;
    /** Extract color scheme */
    extractColors?: boolean;
}
/**
 * Generated component result
 */
export interface GeneratedComponent {
    /** Component source code */
    code: string;
    /** Component name */
    name: string;
    /** Generated props interface */
    propsInterface?: string;
    /** Generated styles */
    styles?: string;
    /** Generated tests */
    tests?: string;
    /** Generated Storybook stories */
    stories?: string;
    /** Explanation of the generated code */
    explanation: string;
    /** Accessibility notes */
    accessibilityNotes?: string[];
    /** Usage examples */
    examples?: string[];
    /** Required imports */
    imports: string[];
    /** Dependencies needed */
    dependencies?: string[];
}
/**
 * Component Generator class
 */
export declare class ComponentGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate a component from natural language description
     */
    generateFromDescription(config: ComponentGenerationConfig): Promise<GeneratedComponent>;
    /**
     * Generate a component from a wireframe or screenshot
     */
    generateFromWireframe(wireframe: WireframeConfig, config: Omit<ComponentGenerationConfig, 'description'>): Promise<GeneratedComponent>;
    /**
     * Enhance an existing component with accessibility features
     */
    enhanceAccessibility(code: string, accessibility: AccessibilityConfig): Promise<{
        code: string;
        changes: string[];
        notes: string[];
    }>;
    /**
     * Customize component styling
     */
    customizeStyle(code: string, style: StyleConfig): Promise<{
        code: string;
        styles?: string;
    }>;
    /**
     * Generate component variants
     */
    generateVariants(baseComponent: string, variants: string[]): Promise<Record<string, string>>;
    /**
     * Build the description prompt
     */
    private buildDescriptionPrompt;
    /**
     * Build wireframe analysis prompt
     */
    private buildWireframePrompt;
    /**
     * Build accessibility enhancement prompt
     */
    private buildAccessibilityPrompt;
    /**
     * Build style customization prompt
     */
    private buildStylePrompt;
    /**
     * Get system prompt based on configuration
     */
    private getSystemPrompt;
    /**
     * Parse the AI response into a structured component
     */
    private parseComponentResponse;
    /**
     * Extract imports from code
     */
    private extractImportsFromCode;
    /**
     * Extract props interface from code
     */
    private extractPropsInterface;
    /**
     * Extract explanation from response
     */
    private extractExplanation;
    /**
     * Extract accessibility notes from response
     */
    private extractAccessibilityNotes;
    /**
     * Extract usage examples from response
     */
    private extractExamples;
    /**
     * Infer dependencies from code
     */
    private inferDependencies;
    /**
     * Extract CSS from response for CSS modules
     */
    private extractCSSFromResponse;
}
/**
 * Create a component generator instance
 */
export declare function createComponentGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): ComponentGenerator;
/**
 * Quick component generation helper
 */
export declare function generateComponent(provider: AIProvider, description: string, name: string, options?: Partial<ComponentGenerationConfig>): Promise<GeneratedComponent>;
//# sourceMappingURL=component-generator.d.ts.map