/**
 * Page Generator - AI-powered full page generation for PhilJS
 *
 * Features:
 * - Generate complete pages from descriptions
 * - Layout suggestions and templates
 * - Responsive design generation
 * - SEO metadata generation
 */
import { extractCode, extractJSON, validateCode } from '../utils/parser.js';
/**
 * Page Generator class
 */
export class PageGenerator {
    provider;
    defaultOptions;
    constructor(provider, options) {
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
    async generatePage(config) {
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
    async suggestLayout(description, pageType) {
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
        return extractJSON(response) || [];
    }
    /**
     * Generate responsive variants of a page
     */
    async generateResponsiveVariants(code, breakpoints) {
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
        return extractJSON(response) || {};
    }
    /**
     * Generate SEO metadata for a page
     */
    async generateSEOMetadata(pageDescription, config) {
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
        return extractJSON(response) || { metadata: '', recommendations: [] };
    }
    /**
     * Generate a page from a template
     */
    async generateFromTemplate(template, customization) {
        const templateDescriptions = {
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
    buildPagePrompt(config) {
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
    getSystemPrompt(config) {
        return `You are an expert PhilJS developer creating production-quality pages.

PhilJS page conventions:
- Pages are components in the routes directory
- Use loader() for data fetching
- Use action() for form mutations
- Export metadata for SEO
- Use signals for reactive state

Page structure:
\`\`\`typescript
import { signal, memo } from '@philjs/core';

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
    parsePageResponse(response, config) {
        // Try to parse as JSON first
        const jsonResult = extractJSON(response);
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
        const result = {
            code: mainCode,
            path: config.path,
            components: this.extractComponents(codeBlocks),
            imports: this.extractImports(mainCode),
            explanation: this.extractExplanation(response),
        };
        const loaderCode = codeBlocks.find(b => b.label?.includes('loader'))?.code;
        if (loaderCode)
            result.loader = loaderCode;
        const actionCode = codeBlocks.find(b => b.label?.includes('action'))?.code;
        if (actionCode)
            result.action = actionCode;
        const layoutCode = codeBlocks.find(b => b.label?.includes('layout'))?.code;
        if (layoutCode)
            result.layout = layoutCode;
        const metadataCode = codeBlocks.find(b => b.label?.includes('metadata') || b.label?.includes('seo'))?.code;
        if (metadataCode)
            result.metadata = metadataCode;
        if (config.responsive)
            result.responsiveNotes = this.extractResponsiveNotes(response);
        if (config.includeTests) {
            const testCode = codeBlocks.find(b => b.label?.includes('test'))?.code;
            if (testCode)
                result.tests = testCode;
        }
        return result;
    }
    /**
     * Extract labeled code blocks from response
     */
    extractCodeBlocks(response) {
        const blocks = [];
        const regex = /(?:^|\n)(?:#+\s*)?(\w[\w\s]*)?(?:\n)?```(?:typescript|tsx|ts|javascript|jsx|js)?\n([\s\S]*?)```/g;
        let match;
        while ((match = regex.exec(response)) !== null) {
            const block = {
                code: match[2].trim(),
            };
            const labelText = match[1]?.trim().toLowerCase();
            if (labelText)
                block.label = labelText;
            blocks.push(block);
        }
        return blocks;
    }
    /**
     * Extract components from code blocks
     */
    extractComponents(blocks) {
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
    extractComponentName(code) {
        const match = code.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+(\w+)/);
        return match?.[1] || null;
    }
    /**
     * Infer component purpose from code and label
     */
    inferComponentPurpose(code, label) {
        if (label) {
            return label.charAt(0).toUpperCase() + label.slice(1);
        }
        // Try to infer from component name or content
        if (code.includes('Header') || code.includes('header'))
            return 'Page header component';
        if (code.includes('Footer') || code.includes('footer'))
            return 'Page footer component';
        if (code.includes('Sidebar') || code.includes('sidebar'))
            return 'Sidebar navigation component';
        if (code.includes('Card') || code.includes('card'))
            return 'Card display component';
        if (code.includes('Form') || code.includes('form'))
            return 'Form component';
        if (code.includes('List') || code.includes('list'))
            return 'List display component';
        return 'Supporting component';
    }
    /**
     * Extract imports from code
     */
    extractImports(code) {
        const imports = [];
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
    extractExplanation(response) {
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
    extractResponsiveNotes(response) {
        const notes = [];
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
export function createPageGenerator(provider, options) {
    return new PageGenerator(provider, options);
}
/**
 * Quick page generation helper
 */
export async function generatePage(provider, name, path, description, options) {
    const generator = new PageGenerator(provider);
    return generator.generatePage({
        name,
        path,
        description,
        responsive: 'full',
        ...options,
    });
}
//# sourceMappingURL=page-generator.js.map