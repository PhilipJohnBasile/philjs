/**
 * Page Generator - AI-powered full page generation for PhilJS
 *
 * Features:
 * - Generate complete pages from descriptions
 * - Layout suggestions and templates
 * - Responsive design generation
 * - SEO metadata generation
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Page generation configuration
 */
export interface PageGenerationConfig {
    /** Page name/title */
    name: string;
    /** Page route path */
    path: string;
    /** Natural language description */
    description: string;
    /** Page type/template */
    type?: PageType;
    /** Layout configuration */
    layout?: LayoutConfig;
    /** SEO metadata options */
    seo?: SEOConfig;
    /** Data loading configuration */
    dataLoading?: DataLoadingConfig;
    /** Include page actions */
    includeActions?: boolean;
    /** Responsive design level */
    responsive?: 'basic' | 'full' | 'mobile-first';
    /** Generate page tests */
    includeTests?: boolean;
}
/**
 * Page type templates
 */
export type PageType = 'landing' | 'dashboard' | 'list' | 'detail' | 'form' | 'settings' | 'auth' | 'error' | 'blog' | 'portfolio' | 'ecommerce' | 'custom';
/**
 * Layout configuration
 */
export interface LayoutConfig {
    /** Layout type */
    type: 'sidebar' | 'navbar' | 'full-width' | 'centered' | 'split' | 'grid';
    /** Header configuration */
    header?: {
        sticky?: boolean;
        transparent?: boolean;
        height?: string;
    };
    /** Sidebar configuration */
    sidebar?: {
        position: 'left' | 'right';
        collapsible?: boolean;
        width?: string;
    };
    /** Footer configuration */
    footer?: {
        sticky?: boolean;
        content?: 'minimal' | 'full';
    };
    /** Content area configuration */
    content?: {
        maxWidth?: string;
        padding?: string;
        centered?: boolean;
    };
}
/**
 * SEO configuration
 */
export interface SEOConfig {
    /** Page title template */
    title?: string;
    /** Meta description */
    description?: string;
    /** Keywords */
    keywords?: string[];
    /** Open Graph data */
    openGraph?: {
        type?: string;
        image?: string;
    };
    /** Structured data schema */
    structuredData?: boolean;
    /** Canonical URL handling */
    canonical?: boolean;
}
/**
 * Data loading configuration
 */
export interface DataLoadingConfig {
    /** Data source type */
    source: 'api' | 'database' | 'static' | 'hybrid';
    /** API endpoints to fetch */
    endpoints?: string[];
    /** Include loading states */
    loadingStates?: boolean;
    /** Error handling */
    errorHandling?: boolean;
    /** Caching strategy */
    caching?: 'none' | 'memory' | 'persistent';
    /** Real-time updates */
    realtime?: boolean;
}
/**
 * Layout suggestion result
 */
export interface LayoutSuggestion {
    /** Layout type */
    type: LayoutConfig['type'];
    /** Reasoning for suggestion */
    reasoning: string;
    /** Visual structure description */
    structure: string;
    /** Recommended sections */
    sections: SectionSuggestion[];
    /** Responsive considerations */
    responsiveNotes: string[];
}
/**
 * Section suggestion
 */
export interface SectionSuggestion {
    /** Section name */
    name: string;
    /** Section purpose */
    purpose: string;
    /** Recommended components */
    components: string[];
    /** Position in layout */
    position: string;
}
/**
 * Generated page result
 */
export interface GeneratedPage {
    /** Page component code */
    code: string;
    /** Page route path */
    path: string;
    /** Loader function code */
    loader?: string;
    /** Action function code */
    action?: string;
    /** Layout component code */
    layout?: string;
    /** SEO metadata code */
    metadata?: string;
    /** Child components */
    components: GeneratedPageComponent[];
    /** Required imports */
    imports: string[];
    /** Explanation of the page structure */
    explanation: string;
    /** Responsive design notes */
    responsiveNotes?: string[];
    /** Test code */
    tests?: string;
}
/**
 * Generated page component
 */
export interface GeneratedPageComponent {
    /** Component name */
    name: string;
    /** Component code */
    code: string;
    /** Component purpose */
    purpose: string;
}
/**
 * Page Generator class
 */
export declare class PageGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate a complete page from configuration
     */
    generatePage(config: PageGenerationConfig): Promise<GeneratedPage>;
    /**
     * Get layout suggestions for a page description
     */
    suggestLayout(description: string, pageType?: PageType): Promise<LayoutSuggestion[]>;
    /**
     * Generate responsive variants of a page
     */
    generateResponsiveVariants(code: string, breakpoints: string[]): Promise<Record<string, string>>;
    /**
     * Generate SEO metadata for a page
     */
    generateSEOMetadata(pageDescription: string, config: SEOConfig): Promise<{
        metadata: string;
        structuredData?: string;
        recommendations: string[];
    }>;
    /**
     * Generate a page from a template
     */
    generateFromTemplate(template: PageType, customization: {
        name: string;
        path: string;
        data?: Record<string, unknown>;
        branding?: {
            primaryColor?: string;
            logo?: string;
        };
    }): Promise<GeneratedPage>;
    /**
     * Build the page generation prompt
     */
    private buildPagePrompt;
    /**
     * Get system prompt for page generation
     */
    private getSystemPrompt;
    /**
     * Parse the AI response into a structured page
     */
    private parsePageResponse;
    /**
     * Extract labeled code blocks from response
     */
    private extractCodeBlocks;
    /**
     * Extract components from code blocks
     */
    private extractComponents;
    /**
     * Extract component name from code
     */
    private extractComponentName;
    /**
     * Infer component purpose from code and label
     */
    private inferComponentPurpose;
    /**
     * Extract imports from code
     */
    private extractImports;
    /**
     * Extract explanation from response
     */
    private extractExplanation;
    /**
     * Extract responsive design notes
     */
    private extractResponsiveNotes;
}
/**
 * Create a page generator instance
 */
export declare function createPageGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): PageGenerator;
/**
 * Quick page generation helper
 */
export declare function generatePage(provider: AIProvider, name: string, path: string, description: string, options?: Partial<PageGenerationConfig>): Promise<GeneratedPage>;
//# sourceMappingURL=page-generator.d.ts.map