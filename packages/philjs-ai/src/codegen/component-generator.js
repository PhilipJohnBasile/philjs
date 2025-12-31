/**
 * Component Generator - AI-powered component generation for PhilJS
 *
 * Generates components from:
 * - Natural language descriptions
 * - Wireframes/screenshots (via vision models)
 * - Style customization options
 * - Accessibility compliance requirements
 */
import { extractCode, validateCode, extractJSON } from '../utils/parser.js';
/**
 * Component Generator class
 */
export class ComponentGenerator {
    provider;
    defaultOptions;
    constructor(provider, options) {
        this.provider = provider;
        this.defaultOptions = {
            temperature: 0.3,
            maxTokens: 4096,
            ...options,
        };
    }
    /**
     * Generate a component from natural language description
     */
    async generateFromDescription(config) {
        const prompt = this.buildDescriptionPrompt(config);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getSystemPrompt(config),
        });
        return this.parseComponentResponse(response, config);
    }
    /**
     * Generate a component from a wireframe or screenshot
     */
    async generateFromWireframe(wireframe, config) {
        const prompt = this.buildWireframePrompt(wireframe, config);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getSystemPrompt({ ...config, description: 'From wireframe' }),
        });
        return this.parseComponentResponse(response, { ...config, description: 'Generated from wireframe' });
    }
    /**
     * Enhance an existing component with accessibility features
     */
    async enhanceAccessibility(code, accessibility) {
        const prompt = this.buildAccessibilityPrompt(code, accessibility);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are an accessibility expert for web components.
Enhance components to meet WCAG ${accessibility.wcagLevel} standards.
Return JSON with: code, changes (array of changes made), notes (array of accessibility notes).`,
        });
        const result = extractJSON(response);
        if (!result) {
            const extractedCode = extractCode(response);
            return {
                code: extractedCode || code,
                changes: ['Unable to parse changes'],
                notes: ['Component was processed but details could not be extracted'],
            };
        }
        return result;
    }
    /**
     * Customize component styling
     */
    async customizeStyle(code, style) {
        const prompt = this.buildStylePrompt(code, style);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are a CSS and styling expert.
Apply the requested style configuration to the component.
Use ${style.approach} for styling.
${style.responsive ? 'Include responsive design.' : ''}
${style.darkMode ? 'Include dark mode support.' : ''}`,
        });
        const extractedCode = extractCode(response);
        const result = {
            code: extractedCode || code,
        };
        if (style.approach === 'css-modules') {
            const extractedStyles = this.extractCSSFromResponse(response);
            if (extractedStyles !== undefined) {
                result.styles = extractedStyles;
            }
        }
        return result;
    }
    /**
     * Generate component variants
     */
    async generateVariants(baseComponent, variants) {
        const prompt = `Given this base component:

\`\`\`typescript
${baseComponent}
\`\`\`

Generate these variants: ${variants.join(', ')}

Return JSON with variant names as keys and component code as values.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'Generate component variants maintaining consistent API and style.',
        });
        return extractJSON(response) || {};
    }
    /**
     * Build the description prompt
     */
    buildDescriptionPrompt(config) {
        const propsSection = config.props?.length
            ? `\nProps:\n${config.props.map(p => `- ${p.name}: ${p.type}${p.required ? ' (required)' : ''}${p.description ? ` - ${p.description}` : ''}`).join('\n')}`
            : '';
        const styleSection = config.style
            ? `\nStyling: Use ${config.style.approach}${config.style.responsive ? ', responsive design' : ''}${config.style.darkMode ? ', dark mode support' : ''}`
            : '';
        const a11ySection = config.accessibility
            ? `\nAccessibility: WCAG ${config.accessibility.wcagLevel}${config.accessibility.ariaLabels ? ', ARIA labels' : ''}${config.accessibility.keyboardNav ? ', keyboard navigation' : ''}`
            : '';
        return `Generate a PhilJS component named "${config.name}".

Description: ${config.description}
${propsSection}
${styleSection}
${a11ySection}

Requirements:
- ${config.useSignals !== false ? 'Use signals for reactive state' : 'Use standard state management'}
- Export the component as a named export
- Include TypeScript types
- Follow PhilJS best practices
${config.includeTests ? '- Generate comprehensive tests' : ''}
${config.includeStories ? '- Generate Storybook stories' : ''}

Return the complete component code in a TypeScript code block.`;
    }
    /**
     * Build wireframe analysis prompt
     */
    buildWireframePrompt(wireframe, config) {
        return `Analyze this wireframe/screenshot and generate a PhilJS component.

[Image data provided in ${wireframe.format} format]
${wireframe.context ? `Context: ${wireframe.context}` : ''}

Component name: ${config.name}

Requirements:
- Recreate the visual structure shown in the wireframe
- ${wireframe.identifyInteractive ? 'Identify and implement interactive elements' : 'Focus on static structure'}
- ${wireframe.extractColors ? 'Extract and apply the color scheme' : 'Use placeholder colors'}
- ${config.useSignals !== false ? 'Use signals for reactive state' : ''}
- Include proper TypeScript types
- Follow accessibility best practices

Return the component code with explanation of the structure identified.`;
    }
    /**
     * Build accessibility enhancement prompt
     */
    buildAccessibilityPrompt(code, accessibility) {
        const requirements = [
            `WCAG ${accessibility.wcagLevel} compliance`,
            accessibility.ariaLabels && 'Add appropriate ARIA labels',
            accessibility.keyboardNav && 'Implement keyboard navigation',
            accessibility.screenReader && 'Optimize for screen readers',
            accessibility.focusManagement && 'Implement focus management',
            accessibility.colorContrast && 'Ensure color contrast requirements',
        ].filter(Boolean);
        return `Enhance this component for accessibility:

\`\`\`typescript
${code}
\`\`\`

Requirements:
${requirements.map(r => `- ${r}`).join('\n')}

Return JSON with:
- code: The enhanced component code
- changes: Array of accessibility improvements made
- notes: Array of accessibility notes and recommendations`;
    }
    /**
     * Build style customization prompt
     */
    buildStylePrompt(code, style) {
        const themeSection = style.theme
            ? `\nTheme tokens:
Colors: ${JSON.stringify(style.theme.colors || {})}
Spacing: ${JSON.stringify(style.theme.spacing || {})}
Typography: ${JSON.stringify(style.theme.typography || {})}`
            : '';
        return `Apply styling to this component:

\`\`\`typescript
${code}
\`\`\`

Style configuration:
- Approach: ${style.approach}
- Responsive: ${style.responsive ? 'Yes' : 'No'}
- Dark mode: ${style.darkMode ? 'Yes' : 'No'}
${themeSection}

Return the styled component code.`;
    }
    /**
     * Get system prompt based on configuration
     */
    getSystemPrompt(config) {
        return `You are an expert PhilJS developer generating production-quality components.

PhilJS key concepts:
- signal() for reactive state: const [value, setValue] = signal(initial)
- memo() for computed values: const derived = memo(() => value() * 2)
- effect() for side effects: effect(() => console.log(value()))
- Components are functions returning JSX
- Fine-grained reactivity - no virtual DOM

${config.framework === 'react-compat' ? 'Generate React-compatible code using PhilJS primitives.' : ''}

Always:
- Use TypeScript with proper types
- Follow accessibility best practices
- Write clean, maintainable code
- Include error handling
- Add JSDoc comments for public APIs`;
    }
    /**
     * Parse the AI response into a structured component
     */
    parseComponentResponse(response, config) {
        const code = extractCode(response) || '';
        const validation = validateCode(code);
        if (!validation.valid) {
            console.warn('Generated code has validation issues:', validation.errors);
        }
        // Extract different sections from response
        const imports = this.extractImportsFromCode(code);
        const propsInterface = this.extractPropsInterface(code);
        const result = {
            code,
            name: config.name,
            explanation: this.extractExplanation(response),
            examples: this.extractExamples(response),
            imports,
            dependencies: this.inferDependencies(code),
        };
        if (propsInterface !== undefined) {
            result.propsInterface = propsInterface;
        }
        if (config.accessibility) {
            result.accessibilityNotes = this.extractAccessibilityNotes(response);
        }
        return result;
    }
    /**
     * Extract imports from code
     */
    extractImportsFromCode(code) {
        const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
        const imports = [];
        let match;
        while ((match = importRegex.exec(code)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }
    /**
     * Extract props interface from code
     */
    extractPropsInterface(code) {
        const interfaceMatch = code.match(/interface\s+\w+Props\s*\{[\s\S]*?\}/);
        return interfaceMatch?.[0];
    }
    /**
     * Extract explanation from response
     */
    extractExplanation(response) {
        // Look for explanation sections
        const explanationMatch = response.match(/(?:explanation|description):\s*([^\n]+(?:\n(?![#`])[^\n]*)*)/i);
        if (explanationMatch) {
            return explanationMatch[1].trim();
        }
        // Extract text before code blocks as explanation
        const beforeCode = response.split('```')[0].trim();
        return beforeCode || 'Component generated successfully';
    }
    /**
     * Extract accessibility notes from response
     */
    extractAccessibilityNotes(response) {
        const notes = [];
        const a11yMatch = response.match(/accessibility[:\s]*\n?([\s\S]*?)(?=\n\n|```|$)/i);
        if (a11yMatch) {
            const lines = a11yMatch[1].split('\n');
            for (const line of lines) {
                const cleaned = line.replace(/^[-*]\s*/, '').trim();
                if (cleaned) {
                    notes.push(cleaned);
                }
            }
        }
        return notes;
    }
    /**
     * Extract usage examples from response
     */
    extractExamples(response) {
        const examples = [];
        const exampleMatch = response.match(/(?:example|usage)[s]?[:\s]*\n?([\s\S]*?)(?=\n\n(?![^\n]*```)|$)/i);
        if (exampleMatch) {
            const codeBlocks = exampleMatch[1].match(/```[\s\S]*?```/g);
            if (codeBlocks) {
                examples.push(...codeBlocks.map(b => b.replace(/```\w*\n?/g, '').trim()));
            }
        }
        return examples;
    }
    /**
     * Infer dependencies from code
     */
    inferDependencies(code) {
        const deps = [];
        if (code.includes('clsx') || code.includes('classnames')) {
            deps.push('clsx');
        }
        if (code.includes('framer-motion')) {
            deps.push('framer-motion');
        }
        if (code.includes('@headlessui')) {
            deps.push('@headlessui/react');
        }
        if (code.includes('lucide-react')) {
            deps.push('lucide-react');
        }
        return deps;
    }
    /**
     * Extract CSS from response for CSS modules
     */
    extractCSSFromResponse(response) {
        const cssMatch = response.match(/```css\n([\s\S]*?)```/);
        return cssMatch?.[1]?.trim();
    }
}
/**
 * Create a component generator instance
 */
export function createComponentGenerator(provider, options) {
    return new ComponentGenerator(provider, options);
}
/**
 * Quick component generation helper
 */
export async function generateComponent(provider, description, name, options) {
    const generator = new ComponentGenerator(provider);
    return generator.generateFromDescription({
        name,
        description,
        useSignals: true,
        ...options,
    });
}
//# sourceMappingURL=component-generator.js.map