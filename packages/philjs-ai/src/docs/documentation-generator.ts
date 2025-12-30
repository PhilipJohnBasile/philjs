/**
 * Documentation Generator
 *
 * Generates JSDoc/TSDoc documentation from code including:
 * - Function documentation
 * - Component documentation
 * - Type documentation
 * - README generation
 * - API documentation
 */

import type { AIProvider, CompletionOptions } from '../types.js';
import { extractCode, extractJSON } from '../utils/parser.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Documentation style
 */
export type DocumentationStyle = 'jsdoc' | 'tsdoc' | 'markdown' | 'inline';

/**
 * Documentation generation options
 */
export interface DocGenerationOptions extends Partial<CompletionOptions> {
  /** Documentation style */
  style?: DocumentationStyle;
  /** Include examples */
  includeExamples?: boolean;
  /** Include type information */
  includeTypes?: boolean;
  /** Include @since tags */
  includeSince?: string;
  /** Include @deprecated tags where applicable */
  markDeprecated?: boolean;
  /** Include @internal for private members */
  markInternal?: boolean;
  /** Verbosity level */
  verbosity?: 'minimal' | 'standard' | 'detailed';
  /** Custom tags to include */
  customTags?: Array<{ name: string; content: string }>;
}

/**
 * Generated documentation result
 */
export interface GeneratedDocumentation {
  /** Original code */
  originalCode: string;
  /** Code with documentation added */
  documentedCode: string;
  /** Extracted documentation blocks */
  docBlocks: DocBlock[];
  /** Summary of the documented code */
  summary: string;
  /** Coverage statistics */
  coverage: DocCoverage;
  /** Suggested improvements */
  suggestions: string[];
}

/**
 * Documentation block
 */
export interface DocBlock {
  /** Block type */
  type: 'function' | 'component' | 'type' | 'interface' | 'class' | 'variable' | 'constant';
  /** Name of documented item */
  name: string;
  /** Generated documentation */
  documentation: string;
  /** Line where to insert */
  insertLine: number;
  /** Brief description */
  description: string;
  /** Parameters if applicable */
  params?: DocParam[];
  /** Return type documentation */
  returns?: DocReturn;
  /** Examples */
  examples?: string[];
  /** Tags */
  tags?: DocTag[];
}

/**
 * Parameter documentation
 */
export interface DocParam {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Description */
  description: string;
  /** Is optional */
  optional: boolean;
  /** Default value */
  defaultValue?: string;
}

/**
 * Return type documentation
 */
export interface DocReturn {
  /** Return type */
  type: string;
  /** Description */
  description: string;
}

/**
 * Documentation tag
 */
export interface DocTag {
  /** Tag name (without @) */
  name: string;
  /** Tag content */
  content: string;
}

/**
 * Documentation coverage statistics
 */
export interface DocCoverage {
  /** Total items that could be documented */
  total: number;
  /** Items with documentation */
  documented: number;
  /** Coverage percentage */
  percentage: number;
  /** Items missing documentation */
  missing: string[];
}

/**
 * Component documentation
 */
export interface ComponentDoc {
  /** Component name */
  name: string;
  /** Description */
  description: string;
  /** Props documentation */
  props: PropDoc[];
  /** State documentation */
  state: StateDoc[];
  /** Events/callbacks */
  events: EventDoc[];
  /** Slots/children */
  slots: SlotDoc[];
  /** Examples */
  examples: ComponentExample[];
  /** Accessibility notes */
  accessibility: string[];
  /** Related components */
  related: string[];
}

/**
 * Prop documentation
 */
export interface PropDoc {
  /** Prop name */
  name: string;
  /** Prop type */
  type: string;
  /** Description */
  description: string;
  /** Is required */
  required: boolean;
  /** Default value */
  default?: string;
  /** Deprecated */
  deprecated?: string;
}

/**
 * State documentation
 */
export interface StateDoc {
  /** State name */
  name: string;
  /** State type */
  type: string;
  /** Description */
  description: string;
  /** Initial value */
  initial: string;
}

/**
 * Event documentation
 */
export interface EventDoc {
  /** Event name (e.g., onChange) */
  name: string;
  /** Event type */
  type: string;
  /** Description */
  description: string;
  /** Example usage */
  example?: string;
}

/**
 * Slot documentation
 */
export interface SlotDoc {
  /** Slot name (default for children) */
  name: string;
  /** Description */
  description: string;
  /** Expected content */
  expectedContent?: string;
}

/**
 * Component example
 */
export interface ComponentExample {
  /** Example title */
  title: string;
  /** Example code */
  code: string;
  /** Description */
  description?: string;
}

/**
 * README generation options
 */
export interface ReadmeOptions {
  /** Project name */
  projectName: string;
  /** Include installation */
  includeInstallation?: boolean;
  /** Include usage examples */
  includeUsage?: boolean;
  /** Include API reference */
  includeAPI?: boolean;
  /** Include contributing guide */
  includeContributing?: boolean;
  /** Include license */
  license?: string;
  /** Badge configurations */
  badges?: Array<{ name: string; url: string }>;
}

/**
 * Generated README
 */
export interface GeneratedReadme {
  /** README content */
  content: string;
  /** Sections included */
  sections: string[];
  /** Table of contents */
  toc: string;
}

// ============================================================================
// Documentation Generator
// ============================================================================

/**
 * Documentation Generator Engine
 *
 * Generates comprehensive documentation for code.
 *
 * @example
 * ```typescript
 * const generator = new DocumentationGenerator(provider);
 *
 * // Generate JSDoc for code
 * const result = await generator.generateDocs(code, {
 *   style: 'jsdoc',
 *   includeExamples: true,
 * });
 * console.log(result.documentedCode);
 *
 * // Generate component documentation
 * const compDoc = await generator.documentComponent(componentCode);
 * console.log(compDoc.props);
 *
 * // Generate README
 * const readme = await generator.generateReadme(projectFiles, {
 *   projectName: 'My Project',
 * });
 * console.log(readme.content);
 * ```
 */
export class DocumentationGenerator {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
    this.provider = provider;
    this.defaultOptions = {
      temperature: 0.2,
      maxTokens: 4096,
      ...options,
    };
  }

  /**
   * Generate documentation for code
   *
   * @param code - Code to document
   * @param options - Generation options
   * @returns Generated documentation
   */
  async generateDocs(
    code: string,
    options?: DocGenerationOptions
  ): Promise<GeneratedDocumentation> {
    const style = options?.style || 'jsdoc';
    const verbosity = options?.verbosity || 'standard';

    const prompt = this.buildDocPrompt(code, style, verbosity, options);

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      maxTokens: 8192,
      systemPrompt: this.getDocSystemPrompt(style),
    });

    // Parse the response
    const documentedCode = extractCode(response) || code;
    const docBlocks = this.extractDocBlocks(documentedCode);
    const coverage = this.calculateCoverage(code, docBlocks);

    // Generate summary
    const summary = this.generateSummary(docBlocks);

    // Get suggestions
    const suggestions = await this.getSuggestions(code, docBlocks);

    return {
      originalCode: code,
      documentedCode,
      docBlocks,
      summary,
      coverage,
      suggestions,
    };
  }

  /**
   * Document a component specifically
   *
   * @param componentCode - Component code
   * @param options - Generation options
   * @returns Component documentation
   */
  async documentComponent(
    componentCode: string,
    options?: DocGenerationOptions
  ): Promise<ComponentDoc> {
    const prompt = `Analyze and document this PhilJS component:

\`\`\`typescript
${componentCode}
\`\`\`

Extract and document:
1. Component name and description
2. All props with types, descriptions, required/optional, defaults
3. State variables (signals) with types and descriptions
4. Events/callbacks with signatures
5. Slots/children requirements
6. Usage examples (2-3 different use cases)
7. Accessibility considerations
8. Related components (if any)

Return JSON matching ComponentDoc interface:
{
  "name": "ComponentName",
  "description": "Component description",
  "props": [{ "name": "prop", "type": "string", "description": "...", "required": true }],
  "state": [{ "name": "state", "type": "boolean", "description": "...", "initial": "false" }],
  "events": [{ "name": "onChange", "type": "(value: string) => void", "description": "..." }],
  "slots": [{ "name": "default", "description": "Main content" }],
  "examples": [{ "title": "Basic", "code": "<Component />" }],
  "accessibility": ["Screen reader support", "Keyboard navigation"],
  "related": ["RelatedComponent"]
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      systemPrompt: 'You are a documentation expert for PhilJS components. Generate comprehensive, accurate documentation.',
    });

    const result = extractJSON<ComponentDoc>(response);

    if (result) {
      return result;
    }

    // Fallback: extract basic info
    return this.extractBasicComponentDoc(componentCode);
  }

  /**
   * Add JSDoc to undocumented functions
   *
   * @param code - Code with functions
   * @param options - Options
   * @returns Code with JSDoc added
   */
  async addJSDoc(
    code: string,
    options?: DocGenerationOptions
  ): Promise<string> {
    const prompt = `Add JSDoc comments to all functions, classes, and types in this code that don't have them:

\`\`\`typescript
${code}
\`\`\`

Requirements:
- Add JSDoc for every function, class, interface, and type
- Include @param for all parameters with types and descriptions
- Include @returns with type and description
- Include @example with usage example for public functions
${options?.includeExamples ? '- Include detailed examples' : ''}
${options?.includeSince ? `- Add @since ${options.includeSince} to new items` : ''}
${options?.markInternal ? '- Add @internal to private/internal items' : ''}
- Preserve existing documentation
- Follow ${options?.style || 'JSDoc'} conventions

Return the complete code with documentation added.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      maxTokens: 8192,
      systemPrompt: 'You are a documentation expert. Add comprehensive JSDoc to code.',
    });

    return extractCode(response) || code;
  }

  /**
   * Generate README from project files
   *
   * @param files - Map of file paths to contents
   * @param options - README options
   * @returns Generated README
   */
  async generateReadme(
    files: Map<string, string>,
    options: ReadmeOptions
  ): Promise<GeneratedReadme> {
    // Extract key information from files
    const packageJson = files.get('package.json');
    const mainFile = files.get('src/index.ts') || files.get('index.ts');

    const fileList = Array.from(files.keys()).join('\n');
    const codeExamples = mainFile?.slice(0, 2000) || '';

    const prompt = `Generate a README.md for "${options.projectName}":

Files in project:
${fileList}

${packageJson ? `package.json:\n${packageJson}\n` : ''}

${codeExamples ? `Main code:\n\`\`\`typescript\n${codeExamples}\n\`\`\`` : ''}

Include sections:
${options.includeInstallation !== false ? '- Installation' : ''}
${options.includeUsage !== false ? '- Usage with examples' : ''}
${options.includeAPI !== false ? '- API reference' : ''}
${options.includeContributing ? '- Contributing guide' : ''}
${options.license ? `- License (${options.license})` : ''}

${options.badges?.length ? `Badges:\n${options.badges.map(b => `- ${b.name}: ${b.url}`).join('\n')}` : ''}

Generate a professional README in Markdown format.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      maxTokens: 4096,
      systemPrompt: 'You are a technical writer creating README documentation.',
    });

    // Extract sections
    const sections = this.extractReadmeSections(response);
    const toc = this.generateTableOfContents(sections);

    return {
      content: response,
      sections,
      toc,
    };
  }

  /**
   * Generate API documentation
   *
   * @param code - Code to document
   * @param options - Options
   * @returns API documentation in Markdown
   */
  async generateAPIDoc(
    code: string,
    options?: { format?: 'markdown' | 'html'; includePrivate?: boolean }
  ): Promise<string> {
    const prompt = `Generate API documentation for this code:

\`\`\`typescript
${code}
\`\`\`

Include:
- All exported functions with signatures
- All exported types/interfaces
- All exported classes with methods
${options?.includePrivate ? '- Include private/internal items marked with @internal' : ''}

Format: ${options?.format || 'markdown'}

For each item:
- Full signature
- Description
- Parameters with types and descriptions
- Return type and description
- Examples
- Related items

Generate comprehensive API documentation.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      maxTokens: 8192,
      systemPrompt: 'You are a technical writer generating API documentation.',
    });

    return response;
  }

  /**
   * Update existing documentation
   *
   * @param code - Code with outdated docs
   * @param changes - Description of changes made
   * @returns Code with updated documentation
   */
  async updateDocs(
    code: string,
    changes: string
  ): Promise<GeneratedDocumentation> {
    const prompt = `Update the documentation in this code based on these changes:

Changes made:
${changes}

Code:
\`\`\`typescript
${code}
\`\`\`

Update the JSDoc/TSDoc to reflect the changes:
- Update affected descriptions
- Update parameter documentation
- Update return types
- Update examples if needed
- Mark deprecated items if applicable

Return the code with updated documentation.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      maxTokens: 8192,
      systemPrompt: 'You are updating documentation to reflect code changes.',
    });

    const documentedCode = extractCode(response) || code;
    const docBlocks = this.extractDocBlocks(documentedCode);
    const coverage = this.calculateCoverage(code, docBlocks);

    return {
      originalCode: code,
      documentedCode,
      docBlocks,
      summary: 'Documentation updated',
      coverage,
      suggestions: [],
    };
  }

  /**
   * Check documentation quality
   *
   * @param code - Code to check
   * @returns Quality report
   */
  async checkDocQuality(code: string): Promise<{
    score: number;
    issues: Array<{ type: string; message: string; line?: number }>;
    suggestions: string[];
  }> {
    const prompt = `Analyze the documentation quality in this code:

\`\`\`typescript
${code}
\`\`\`

Check for:
1. Missing documentation
2. Incomplete documentation (missing params, returns)
3. Outdated documentation (doesn't match code)
4. Poor descriptions (too vague, incorrect)
5. Missing examples
6. Incorrect types in documentation

Return JSON:
{
  "score": 0-100,
  "issues": [
    { "type": "missing", "message": "Function X lacks documentation", "line": 10 }
  ],
  "suggestions": ["Add examples to public functions"]
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a documentation quality checker.',
    });

    return extractJSON<{
      score: number;
      issues: Array<{ type: string; message: string; line?: number }>;
      suggestions: string[];
    }>(response) || { score: 50, issues: [], suggestions: [] };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private buildDocPrompt(
    code: string,
    style: DocumentationStyle,
    verbosity: string,
    options?: DocGenerationOptions
  ): string {
    const styleGuide = {
      jsdoc: 'Use JSDoc style with @param, @returns, @example tags',
      tsdoc: 'Use TSDoc style with @param, @returns, @example, @remarks tags',
      markdown: 'Add inline Markdown documentation comments',
      inline: 'Add brief inline comments explaining the code',
    };

    const verbosityGuide = {
      minimal: 'Brief, one-line descriptions only',
      standard: 'Standard descriptions with parameters and returns',
      detailed: 'Comprehensive descriptions with examples and remarks',
    };

    return `Add ${style} documentation to this code:

\`\`\`typescript
${code}
\`\`\`

Style: ${styleGuide[style]}
Verbosity: ${verbosityGuide[verbosity as keyof typeof verbosityGuide]}

${options?.includeExamples ? 'Include @example with usage examples for all public functions' : ''}
${options?.includeTypes ? 'Include @type tags where helpful' : ''}
${options?.markDeprecated ? 'Mark deprecated items with @deprecated' : ''}
${options?.customTags?.length ? `Custom tags: ${options.customTags.map(t => `@${t.name} ${t.content}`).join(', ')}` : ''}

Return the complete documented code.`;
  }

  private getDocSystemPrompt(style: DocumentationStyle): string {
    return `You are a documentation expert for TypeScript and PhilJS.
Generate ${style.toUpperCase()} style documentation.

Guidelines:
- Write clear, concise descriptions
- Document all public APIs
- Include parameter and return documentation
- Add practical examples
- Use proper TypeScript types
- Follow ${style} conventions precisely`;
  }

  private extractDocBlocks(code: string): DocBlock[] {
    const blocks: DocBlock[] = [];
    const lines = code.split('\n');

    // Find JSDoc blocks followed by declarations
    const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;
    let match;

    while ((match = jsdocPattern.exec(code)) !== null) {
      const docEnd = match.index + match[0].length;
      const afterDoc = code.slice(docEnd, docEnd + 500);

      // Find what the doc is for
      const funcMatch = afterDoc.match(/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      const constMatch = afterDoc.match(/^\s*(?:export\s+)?const\s+(\w+)/);
      const interfaceMatch = afterDoc.match(/^\s*(?:export\s+)?interface\s+(\w+)/);
      const typeMatch = afterDoc.match(/^\s*(?:export\s+)?type\s+(\w+)/);
      const classMatch = afterDoc.match(/^\s*(?:export\s+)?class\s+(\w+)/);

      let type: DocBlock['type'] = 'function';
      let name = 'unknown';

      if (funcMatch) {
        type = 'function';
        name = funcMatch[1]!;
      } else if (constMatch) {
        type = afterDoc.includes('=>') || afterDoc.includes('function') ? 'function' : 'constant';
        name = constMatch[1]!;
      } else if (interfaceMatch) {
        type = 'interface';
        name = interfaceMatch[1]!;
      } else if (typeMatch) {
        type = 'type';
        name = typeMatch[1]!;
      } else if (classMatch) {
        type = 'class';
        name = classMatch[1]!;
      }

      // Extract description from JSDoc
      const descMatch = match[0].match(/\/\*\*\s*\n?\s*\*?\s*([^\n@]*)/);
      const description = descMatch ? descMatch[1]!.trim() : '';

      // Extract params
      const params: DocParam[] = [];
      const paramMatches = match[0].matchAll(/@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s*-?\s*(.*)/g);
      for (const pm of paramMatches) {
        params.push({
          name: pm[2]!,
          type: pm[1] || 'unknown',
          description: pm[3] || '',
          optional: pm[0].includes('?') || pm[0].includes('['),
        });
      }

      // Extract returns
      const returnMatch = match[0].match(/@returns?\s+(?:\{([^}]+)\}\s+)?(.*)/);
      const returns = returnMatch ? {
        type: returnMatch[1] || 'unknown',
        description: returnMatch[2] || '',
      } : undefined;

      // Calculate insert line
      const insertLine = code.slice(0, match.index).split('\n').length;

      const block: DocBlock = {
        type,
        name,
        documentation: match[0],
        insertLine,
        description,
      };
      if (params.length > 0) {
        block.params = params;
      }
      if (returns) {
        block.returns = returns;
      }
      blocks.push(block);
    }

    return blocks;
  }

  private calculateCoverage(code: string, docBlocks: DocBlock[]): DocCoverage {
    // Count documentable items
    const funcMatches = code.match(/(?:export\s+)?(?:async\s+)?function\s+\w+/g) || [];
    const constFuncMatches = code.match(/(?:export\s+)?const\s+\w+\s*=\s*(?:async\s+)?\(/g) || [];
    const interfaceMatches = code.match(/(?:export\s+)?interface\s+\w+/g) || [];
    const typeMatches = code.match(/(?:export\s+)?type\s+\w+/g) || [];
    const classMatches = code.match(/(?:export\s+)?class\s+\w+/g) || [];

    const total = funcMatches.length + constFuncMatches.length +
                  interfaceMatches.length + typeMatches.length + classMatches.length;

    const documented = docBlocks.length;
    const percentage = total > 0 ? Math.round((documented / total) * 100) : 100;

    // Find missing items
    const documentedNames = new Set(docBlocks.map(b => b.name));
    const missing: string[] = [];

    // Extract names from matches and check
    const allMatches = [
      ...funcMatches.map(m => m.match(/function\s+(\w+)/)?.[1]),
      ...constFuncMatches.map(m => m.match(/const\s+(\w+)/)?.[1]),
      ...interfaceMatches.map(m => m.match(/interface\s+(\w+)/)?.[1]),
      ...typeMatches.map(m => m.match(/type\s+(\w+)/)?.[1]),
      ...classMatches.map(m => m.match(/class\s+(\w+)/)?.[1]),
    ].filter(Boolean) as string[];

    for (const name of allMatches) {
      if (!documentedNames.has(name)) {
        missing.push(name);
      }
    }

    return {
      total,
      documented,
      percentage,
      missing,
    };
  }

  private generateSummary(docBlocks: DocBlock[]): string {
    const types = docBlocks.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parts: string[] = [];
    if (types['function']) parts.push(`${types['function']} functions`);
    if (types['component']) parts.push(`${types['component']} components`);
    if (types['interface']) parts.push(`${types['interface']} interfaces`);
    if (types['type']) parts.push(`${types['type']} types`);
    if (types['class']) parts.push(`${types['class']} classes`);

    return `Documented ${parts.join(', ')}.`;
  }

  private async getSuggestions(
    code: string,
    docBlocks: DocBlock[]
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Check for missing examples
    const withoutExamples = docBlocks.filter(b =>
      b.type === 'function' && !b.documentation.includes('@example')
    );
    if (withoutExamples.length > 0) {
      suggestions.push(`Add @example to ${withoutExamples.length} functions: ${withoutExamples.map(b => b.name).join(', ')}`);
    }

    // Check for vague descriptions
    const vagueBlocks = docBlocks.filter(b =>
      b.description.length < 10 || b.description.toLowerCase().includes('todo')
    );
    if (vagueBlocks.length > 0) {
      suggestions.push(`Improve descriptions for: ${vagueBlocks.map(b => b.name).join(', ')}`);
    }

    // Check for missing param descriptions
    const missingParamDesc = docBlocks.filter(b =>
      b.params?.some(p => !p.description || p.description.length < 5)
    );
    if (missingParamDesc.length > 0) {
      suggestions.push(`Add parameter descriptions for: ${missingParamDesc.map(b => b.name).join(', ')}`);
    }

    return suggestions;
  }

  private extractBasicComponentDoc(code: string): ComponentDoc {
    const nameMatch = code.match(/(?:export\s+)?(?:function|const)\s+(\w+)/);
    const name = nameMatch?.[1] || 'Unknown';

    // Extract props interface
    const propsMatch = code.match(/interface\s+(\w+Props)\s*\{([^}]+)\}/);
    const props: PropDoc[] = [];

    if (propsMatch) {
      const propsContent = propsMatch[2]!;
      const propLines = propsContent.split('\n');
      for (const line of propLines) {
        const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/);
        if (propMatch) {
          props.push({
            name: propMatch[1]!,
            type: propMatch[3]!.trim(),
            description: '',
            required: !propMatch[2],
          });
        }
      }
    }

    return {
      name,
      description: `PhilJS component: ${name}`,
      props,
      state: [],
      events: [],
      slots: [{ name: 'default', description: 'Component content' }],
      examples: [{ title: 'Basic', code: `<${name} />` }],
      accessibility: [],
      related: [],
    };
  }

  private extractReadmeSections(content: string): string[] {
    const sections: string[] = [];
    const headingMatches = content.matchAll(/^##?\s+(.+)$/gm);

    for (const match of headingMatches) {
      sections.push(match[1]!);
    }

    return sections;
  }

  private generateTableOfContents(sections: string[]): string {
    return sections
      .map(s => `- [${s}](#${s.toLowerCase().replace(/\s+/g, '-')})`)
      .join('\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a documentation generator instance
 */
export function createDocumentationGenerator(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): DocumentationGenerator {
  return new DocumentationGenerator(provider, options);
}

/**
 * Quick documentation generation helper
 */
export async function generateDocumentation(
  provider: AIProvider,
  code: string,
  options?: DocGenerationOptions
): Promise<GeneratedDocumentation> {
  const generator = new DocumentationGenerator(provider);
  return generator.generateDocs(code, options);
}

/**
 * Quick JSDoc addition helper
 */
export async function addJSDocToCode(
  provider: AIProvider,
  code: string,
  options?: DocGenerationOptions
): Promise<string> {
  const generator = new DocumentationGenerator(provider);
  return generator.addJSDoc(code, options);
}

/**
 * Quick component documentation helper
 */
export async function documentPhilJSComponent(
  provider: AIProvider,
  componentCode: string
): Promise<ComponentDoc> {
  const generator = new DocumentationGenerator(provider);
  return generator.documentComponent(componentCode);
}
