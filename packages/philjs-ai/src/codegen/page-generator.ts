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
import { extractCode, extractJSON, validateCode } from '../utils/parser.js';

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
export type PageType =
  | 'landing'
  | 'dashboard'
  | 'list'
  | 'detail'
  | 'form'
  | 'settings'
  | 'auth'
  | 'error'
  | 'blog'
  | 'portfolio'
  | 'ecommerce'
  | 'custom';

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
export class PageGenerator {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
    this.provider = provider;
    this.defaultOptions = {
      temperature: 0.3,
      maxTokens: 8192,
      ...options,
    };
  }

  /**
   * Generate a complete page from configuration
   */
  async generatePage(config: PageGenerationConfig): Promise<GeneratedPage> {
    const prompt = this.buildPagePrompt(config);

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: this.getSystemPrompt(config),
    });

    return this.parsePageResponse(response, config);
  }

  /**
   * Get layout suggestions for a page description
   */
  async suggestLayout(
    description: string,
    pageType?: PageType
  ): Promise<LayoutSuggestion[]> {
    const prompt = `Suggest optimal layouts for this page:

Description: ${description}
${pageType ? `Page type: ${pageType}` : ''}

Analyze the requirements and suggest 3 different layout options.
For each layout, provide:
- Layout type (sidebar, navbar, full-width, centered, split, grid)
- Reasoning for the suggestion
- Visual structure description
- Recommended sections with components
- Responsive design considerations

Return as JSON array of layout suggestions.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a UI/UX expert specializing in page layouts.',
    });

    return extractJSON<LayoutSuggestion[]>(response) || [];
  }

  /**
   * Generate responsive variants of a page
   */
  async generateResponsiveVariants(
    code: string,
    breakpoints: string[]
  ): Promise<Record<string, string>> {
    const prompt = `Adapt this page component for different screen sizes:

\`\`\`typescript
${code}
\`\`\`

Breakpoints: ${breakpoints.join(', ')}

For each breakpoint, provide optimized layout and styling.
Return JSON with breakpoint names as keys and adapted code as values.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a responsive design expert.',
    });

    return extractJSON<Record<string, string>>(response) || {};
  }

  /**
   * Generate SEO metadata for a page
   */
  async generateSEOMetadata(
    pageDescription: string,
    config: SEOConfig
  ): Promise<{
    metadata: string;
    structuredData?: string;
    recommendations: string[];
  }> {
    const prompt = `Generate SEO metadata for this page:

Description: ${pageDescription}
Title template: ${config.title || 'Auto-generate'}
Keywords: ${config.keywords?.join(', ') || 'Auto-detect'}
Open Graph: ${config.openGraph ? 'Yes' : 'No'}
Structured Data: ${config.structuredData ? 'Yes' : 'No'}

Generate:
1. Meta tags and title
2. Open Graph tags (if requested)
3. Structured data schema (if requested)
4. SEO recommendations

Return as JSON with: metadata (code), structuredData (code if requested), recommendations (array).`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are an SEO expert for modern web applications.',
    });

    return extractJSON<{
      metadata: string;
      structuredData?: string;
      recommendations: string[];
    }>(response) || { metadata: '', recommendations: [] };
  }

  /**
   * Generate a page from a template
   */
  async generateFromTemplate(
    template: PageType,
    customization: {
      name: string;
      path: string;
      data?: Record<string, unknown>;
      branding?: {
        primaryColor?: string;
        logo?: string;
      };
    }
  ): Promise<GeneratedPage> {
    const templateDescriptions: Record<PageType, string> = {
      landing: 'A marketing landing page with hero section, features, testimonials, and CTA',
      dashboard: 'An analytics dashboard with metrics cards, charts, and data tables',
      list: 'A paginated list view with filters, search, and sorting capabilities',
      detail: 'A detail view page showing comprehensive information about a single item',
      form: 'A multi-step form page with validation and progress indicator',
      settings: 'A settings page with categorized options and save functionality',
      auth: 'An authentication page with login, signup, and password reset',
      error: 'An error page (404/500) with helpful navigation options',
      blog: 'A blog post page with article content, author info, and related posts',
      portfolio: 'A portfolio showcase page with project gallery and filters',
      ecommerce: 'An e-commerce product page with images, details, and cart actions',
      custom: 'A custom page based on the provided description',
    };

    return this.generatePage({
      name: customization.name,
      path: customization.path,
      description: templateDescriptions[template],
      type: template,
      responsive: 'full',
      seo: {
        title: customization.name,
        structuredData: true,
      },
    });
  }

  /**
   * Build the page generation prompt
   */
  private buildPagePrompt(config: PageGenerationConfig): string {
    const layoutSection = config.layout
      ? `\nLayout:
- Type: ${config.layout.type}
- Header: ${JSON.stringify(config.layout.header || {})}
- Sidebar: ${JSON.stringify(config.layout.sidebar || {})}
- Footer: ${JSON.stringify(config.layout.footer || {})}
- Content: ${JSON.stringify(config.layout.content || {})}`
      : '';

    const seoSection = config.seo
      ? `\nSEO:
- Title: ${config.seo.title || 'Auto-generate'}
- Description: ${config.seo.description || 'Auto-generate'}
- Keywords: ${config.seo.keywords?.join(', ') || 'Auto-detect'}
- Structured data: ${config.seo.structuredData ? 'Yes' : 'No'}`
      : '';

    const dataSection = config.dataLoading
      ? `\nData Loading:
- Source: ${config.dataLoading.source}
- Endpoints: ${config.dataLoading.endpoints?.join(', ') || 'Auto-detect'}
- Loading states: ${config.dataLoading.loadingStates ? 'Yes' : 'No'}
- Error handling: ${config.dataLoading.errorHandling ? 'Yes' : 'No'}
- Caching: ${config.dataLoading.caching || 'none'}`
      : '';

    return `Generate a complete PhilJS page.

Page: ${config.name}
Route: ${config.path}
Type: ${config.type || 'custom'}
Description: ${config.description}
${layoutSection}
${seoSection}
${dataSection}

Requirements:
- Responsive design: ${config.responsive || 'basic'}
- Include actions: ${config.includeActions ? 'Yes' : 'No'}
- Use signals for state management
- Follow PhilJS routing conventions
${config.includeTests ? '- Include comprehensive tests' : ''}

Generate:
1. Main page component
2. Loader function (for data fetching)
${config.includeActions ? '3. Action function (for form submissions)' : ''}
4. Layout component (if needed)
5. Child components
6. SEO metadata

Return all code sections with clear labels.`;
  }

  /**
   * Get system prompt for page generation
   */
  private getSystemPrompt(config: PageGenerationConfig): string {
    return `You are an expert PhilJS developer creating production-quality pages.

PhilJS page conventions:
- Pages are components in the routes directory
- Use loader() for data fetching
- Use action() for form mutations
- Export metadata for SEO
- Use signals for reactive state

Page structure:
\`\`\`typescript
import { signal, memo } from 'philjs-core';

// Loader for data fetching
export async function loader({ params, request }) {
  const data = await fetchData(params.id);
  return { data };
}

// Action for mutations
export async function action({ request }) {
  const formData = await request.formData();
  return processForm(formData);
}

// SEO metadata
export const metadata = {
  title: 'Page Title',
  description: 'Page description',
};

// Page component
export default function PageName() {
  const [state, setState] = signal(initialState);

  return (
    <div>
      {/* Page content */}
    </div>
  );
}
\`\`\`

${config.responsive === 'full' ? 'Create fully responsive designs with mobile-first approach.' : ''}
${config.type ? `Optimize for ${config.type} page patterns.` : ''}`;
  }

  /**
   * Parse the AI response into a structured page
   */
  private parsePageResponse(
    response: string,
    config: PageGenerationConfig
  ): GeneratedPage {
    // Try to parse as JSON first
    const jsonResult = extractJSON<GeneratedPage>(response);
    if (jsonResult) {
      return jsonResult;
    }

    // Parse code blocks from response
    const codeBlocks = this.extractCodeBlocks(response);
    const mainCode = codeBlocks.find(b => b.label?.includes('page') || b.label?.includes('component'))?.code
      || extractCode(response)
      || '';

    const validation = validateCode(mainCode);
    if (!validation.valid) {
      console.warn('Generated page code has validation issues:', validation.errors);
    }

    return {
      code: mainCode,
      path: config.path,
      loader: codeBlocks.find(b => b.label?.includes('loader'))?.code,
      action: codeBlocks.find(b => b.label?.includes('action'))?.code,
      layout: codeBlocks.find(b => b.label?.includes('layout'))?.code,
      metadata: codeBlocks.find(b => b.label?.includes('metadata') || b.label?.includes('seo'))?.code,
      components: this.extractComponents(codeBlocks),
      imports: this.extractImports(mainCode),
      explanation: this.extractExplanation(response),
      responsiveNotes: config.responsive ? this.extractResponsiveNotes(response) : undefined,
      tests: config.includeTests ? codeBlocks.find(b => b.label?.includes('test'))?.code : undefined,
    };
  }

  /**
   * Extract labeled code blocks from response
   */
  private extractCodeBlocks(response: string): Array<{ label?: string; code: string }> {
    const blocks: Array<{ label?: string; code: string }> = [];
    const regex = /(?:^|\n)(?:#+\s*)?(\w[\w\s]*)?(?:\n)?```(?:typescript|tsx|ts|javascript|jsx|js)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      blocks.push({
        label: match[1]?.trim().toLowerCase(),
        code: match[2].trim(),
      });
    }

    return blocks;
  }

  /**
   * Extract components from code blocks
   */
  private extractComponents(
    blocks: Array<{ label?: string; code: string }>
  ): GeneratedPageComponent[] {
    return blocks
      .filter(b => b.label?.includes('component') && !b.label?.includes('page'))
      .map(b => ({
        name: this.extractComponentName(b.code) || b.label || 'Component',
        code: b.code,
        purpose: this.inferComponentPurpose(b.code, b.label),
      }));
  }

  /**
   * Extract component name from code
   */
  private extractComponentName(code: string): string | null {
    const match = code.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+(\w+)/);
    return match?.[1] || null;
  }

  /**
   * Infer component purpose from code and label
   */
  private inferComponentPurpose(code: string, label?: string): string {
    if (label) {
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    // Try to infer from component name or content
    if (code.includes('Header') || code.includes('header')) return 'Page header component';
    if (code.includes('Footer') || code.includes('footer')) return 'Page footer component';
    if (code.includes('Sidebar') || code.includes('sidebar')) return 'Sidebar navigation component';
    if (code.includes('Card') || code.includes('card')) return 'Card display component';
    if (code.includes('Form') || code.includes('form')) return 'Form component';
    if (code.includes('List') || code.includes('list')) return 'List display component';
    return 'Supporting component';
  }

  /**
   * Extract imports from code
   */
  private extractImports(code: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Extract explanation from response
   */
  private extractExplanation(response: string): string {
    const beforeCode = response.split('```')[0].trim();
    if (beforeCode.length > 50) {
      return beforeCode;
    }

    const explanationMatch = response.match(/(?:explanation|overview|description)[:\s]*\n?([\s\S]*?)(?=\n\n|```|$)/i);
    return explanationMatch?.[1].trim() || 'Page generated successfully';
  }

  /**
   * Extract responsive design notes
   */
  private extractResponsiveNotes(response: string): string[] {
    const notes: string[] = [];
    const responsiveMatch = response.match(/(?:responsive|mobile|breakpoint)[s]?[:\s]*\n?([\s\S]*?)(?=\n\n(?![^\n]*```)|$)/i);

    if (responsiveMatch) {
      const lines = responsiveMatch[1].split('\n');
      for (const line of lines) {
        const cleaned = line.replace(/^[-*]\s*/, '').trim();
        if (cleaned && !cleaned.startsWith('```')) {
          notes.push(cleaned);
        }
      }
    }

    return notes;
  }
}

/**
 * Create a page generator instance
 */
export function createPageGenerator(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): PageGenerator {
  return new PageGenerator(provider, options);
}

/**
 * Quick page generation helper
 */
export async function generatePage(
  provider: AIProvider,
  name: string,
  path: string,
  description: string,
  options?: Partial<PageGenerationConfig>
): Promise<GeneratedPage> {
  const generator = new PageGenerator(provider);
  return generator.generatePage({
    name,
    path,
    description,
    responsive: 'full',
    ...options,
  });
}
