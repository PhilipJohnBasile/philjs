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
import { extractCode, validateCode, extractJSON } from '../utils/parser.js';

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
export class ComponentGenerator {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
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
  async generateFromDescription(config: ComponentGenerationConfig): Promise<GeneratedComponent> {
    const prompt = this.buildDescriptionPrompt(config);

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: this.getSystemPrompt(config),
    });

    return this.parseComponentResponse(response, config);
  }

  /**
   * Generate a component from a wireframe or screenshot
   */
  async generateFromWireframe(
    wireframe: WireframeConfig,
    config: Omit<ComponentGenerationConfig, 'description'>
  ): Promise<GeneratedComponent> {
    const prompt = this.buildWireframePrompt(wireframe, config);

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: this.getSystemPrompt({ ...config, description: 'From wireframe' }),
    });

    return this.parseComponentResponse(response, { ...config, description: 'Generated from wireframe' });
  }

  /**
   * Enhance an existing component with accessibility features
   */
  async enhanceAccessibility(
    code: string,
    accessibility: AccessibilityConfig
  ): Promise<{ code: string; changes: string[]; notes: string[] }> {
    const prompt = this.buildAccessibilityPrompt(code, accessibility);

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: `You are an accessibility expert for web components.
Enhance components to meet WCAG ${accessibility.wcagLevel} standards.
Return JSON with: code, changes (array of changes made), notes (array of accessibility notes).`,
    });

    const result = extractJSON<{ code: string; changes: string[]; notes: string[] }>(response);

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
  async customizeStyle(
    code: string,
    style: StyleConfig
  ): Promise<{ code: string; styles?: string }> {
    const prompt = this.buildStylePrompt(code, style);

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: `You are a CSS and styling expert.
Apply the requested style configuration to the component.
Use ${style.approach} for styling.
${style.responsive ? 'Include responsive design.' : ''}
${style.darkMode ? 'Include dark mode support.' : ''}`,
    });

    const extractedCode = extractCode(response);

    const result: { code: string; styles?: string } = {
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
  async generateVariants(
    baseComponent: string,
    variants: string[]
  ): Promise<Record<string, string>> {
    const prompt = `Given this base component:

\`\`\`typescript
${baseComponent}
\`\`\`

Generate these variants: ${variants.join(', ')}

Return JSON with variant names as keys and component code as values.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'Generate component variants maintaining consistent API and style.',
    });

    return extractJSON<Record<string, string>>(response) || {};
  }

  /**
   * Build the description prompt
   */
  private buildDescriptionPrompt(config: ComponentGenerationConfig): string {
    const propsSection = config.props?.length
      ? `\nProps:\n${config.props.map(p =>
        `- ${p.name}: ${p.type}${p.required ? ' (required)' : ''}${p.description ? ` - ${p.description}` : ''}`
      ).join('\n')}`
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
  private buildWireframePrompt(
    wireframe: WireframeConfig,
    config: Omit<ComponentGenerationConfig, 'description'>
  ): string {
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
  private buildAccessibilityPrompt(code: string, accessibility: AccessibilityConfig): string {
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
  private buildStylePrompt(code: string, style: StyleConfig): string {
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
  private getSystemPrompt(config: ComponentGenerationConfig): string {
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
  private parseComponentResponse(
    response: string,
    config: ComponentGenerationConfig
  ): GeneratedComponent {
    const code = extractCode(response) || '';
    const validation = validateCode(code);

    if (!validation.valid) {
      console.warn('Generated code has validation issues:', validation.errors);
    }

    // Extract different sections from response
    const imports = this.extractImportsFromCode(code);
    const propsInterface = this.extractPropsInterface(code);

    const result: GeneratedComponent = {
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
  private extractImportsFromCode(code: string): string[] {
    const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]!);
    }

    return imports;
  }

  /**
   * Extract props interface from code
   */
  private extractPropsInterface(code: string): string | undefined {
    const interfaceMatch = code.match(/interface\s+\w+Props\s*\{[\s\S]*?\}/);
    return interfaceMatch?.[0];
  }

  /**
   * Extract explanation from response
   */
  private extractExplanation(response: string): string {
    // Look for explanation sections
    const explanationMatch = response.match(/(?:explanation|description):\s*([^\n]+(?:\n(?![#`])[^\n]*)*)/i);
    if (explanationMatch) {
      return explanationMatch[1]!.trim();
    }

    // Extract text before code blocks as explanation
    const beforeCode = response.split('```')[0]!.trim();
    return beforeCode || 'Component generated successfully';
  }

  /**
   * Extract accessibility notes from response
   */
  private extractAccessibilityNotes(response: string): string[] {
    const notes: string[] = [];
    const a11yMatch = response.match(/accessibility[:\s]*\n?([\s\S]*?)(?=\n\n|```|$)/i);

    if (a11yMatch) {
      const lines = a11yMatch[1]!.split('\n');
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
  private extractExamples(response: string): string[] {
    const examples: string[] = [];
    const exampleMatch = response.match(/(?:example|usage)[s]?[:\s]*\n?([\s\S]*?)(?=\n\n(?![^\n]*```)|$)/i);

    if (exampleMatch) {
      const codeBlocks = exampleMatch[1]!.match(/```[\s\S]*?```/g);
      if (codeBlocks) {
        examples.push(...codeBlocks.map(b => b.replace(/```\w*\n?/g, '').trim()));
      }
    }

    return examples;
  }

  /**
   * Infer dependencies from code
   */
  private inferDependencies(code: string): string[] {
    const deps: string[] = [];

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
  private extractCSSFromResponse(response: string): string | undefined {
    const cssMatch = response.match(/```css\n([\s\S]*?)```/);
    return cssMatch?.[1]?.trim();
  }
}

/**
 * Create a component generator instance
 */
export function createComponentGenerator(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): ComponentGenerator {
  return new ComponentGenerator(provider, options);
}

/**
 * Quick component generation helper
 */
export async function generateComponent(
  provider: AIProvider,
  description: string,
  name: string,
  options?: Partial<ComponentGenerationConfig>
): Promise<GeneratedComponent> {
  const generator = new ComponentGenerator(provider);
  return generator.generateFromDescription({
    name,
    description,
    useSignals: true,
    ...options,
  });
}
