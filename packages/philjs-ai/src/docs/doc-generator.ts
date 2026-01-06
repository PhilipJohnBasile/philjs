/**
 * Documentation Generator - AI-powered documentation generation for PhilJS
 *
 * Features:
 * - JSDoc comments generation
 * - README generation
 * - API documentation
 * - Usage examples generation
 */

import type { AIProvider, CompletionOptions } from '../types.js';
import { extractCode, extractJSON } from '../utils/parser.js';

/**
 * Documentation generation configuration
 */
export interface DocGenerationConfig {
  /** Code to document */
  code: string;
  /** File path for context */
  filePath?: string;
  /** Documentation style */
  style?: DocStyle;
  /** Include examples */
  includeExamples?: boolean;
  /** Include type information */
  includeTypes?: boolean;
  /** Documentation depth */
  depth?: 'minimal' | 'standard' | 'comprehensive';
  /** Target audience */
  audience?: 'developer' | 'user' | 'contributor';
}

/**
 * Documentation styles
 */
export type DocStyle = 'jsdoc' | 'tsdoc' | 'markdown' | 'api';

/**
 * Generated documentation result
 */
export interface GeneratedDocumentation {
  /** Documented code */
  code: string;
  /** Summary of the code */
  summary: string;
  /** Usage examples */
  examples?: string[];
  /** API reference */
  apiReference?: APIReference[];
  /** Changelog entries */
  changelog?: string;
}

/**
 * API reference entry
 */
export interface APIReference {
  /** Function/component name */
  name: string;
  /** Description */
  description: string;
  /** Parameters */
  parameters?: ParameterDoc[];
  /** Return type and description */
  returns?: { type: string; description: string };
  /** Examples */
  examples?: string[];
  /** Since version */
  since?: string;
  /** Deprecation notice */
  deprecated?: string;
}

/**
 * Parameter documentation
 */
export interface ParameterDoc {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Description */
  description: string;
  /** Is optional */
  optional?: boolean;
  /** Default value */
  defaultValue?: string;
}

/**
 * README generation configuration
 */
export interface ReadmeConfig {
  /** Project/package name */
  name: string;
  /** Project description */
  description: string;
  /** Source files to analyze */
  sourceFiles?: string[];
  /** Sections to include */
  sections?: ReadmeSection[];
  /** Badges to include */
  badges?: BadgeConfig[];
  /** Include table of contents */
  tableOfContents?: boolean;
}

/**
 * README sections
 */
export type ReadmeSection =
  | 'installation'
  | 'usage'
  | 'api'
  | 'examples'
  | 'configuration'
  | 'contributing'
  | 'license'
  | 'changelog';

/**
 * Badge configuration
 */
export interface BadgeConfig {
  /** Badge type */
  type: 'npm' | 'license' | 'build' | 'coverage' | 'downloads' | 'custom';
  /** Custom URL (for custom badges) */
  url?: string;
  /** Custom label */
  label?: string;
}

/**
 * Generated README
 */
export interface GeneratedReadme {
  /** README content */
  content: string;
  /** Sections included */
  sections: string[];
  /** Suggestions for improvement */
  suggestions?: string[];
}

/**
 * API documentation configuration
 */
export interface APIDocConfig {
  /** Source files to document */
  sourceFiles: { path: string; content: string }[];
  /** Output format */
  format?: 'markdown' | 'html' | 'json';
  /** Group by category */
  groupBy?: 'file' | 'category' | 'type';
  /** Include private members */
  includePrivate?: boolean;
  /** Include examples */
  includeExamples?: boolean;
}

/**
 * Generated API documentation
 */
export interface GeneratedAPIDoc {
  /** Documentation content */
  content: string;
  /** Format */
  format: 'markdown' | 'html' | 'json';
  /** Modules documented */
  modules: ModuleDoc[];
  /** Index/navigation */
  index: string;
}

/**
 * Module documentation
 */
export interface ModuleDoc {
  /** Module name */
  name: string;
  /** Module description */
  description: string;
  /** Exports */
  exports: ExportDoc[];
  /** File path */
  filePath: string;
}

/**
 * Export documentation
 */
export interface ExportDoc {
  /** Export name */
  name: string;
  /** Export type */
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'component';
  /** Description */
  description: string;
  /** Signature */
  signature?: string;
  /** API reference */
  api?: APIReference;
}

/**
 * Documentation Generator class
 */
export class DocGenerator {
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
   * Generate documentation for code
   */
  async generateDocs(config: DocGenerationConfig): Promise<GeneratedDocumentation> {
    const style = config.style || 'jsdoc';
    const prompt = this.buildDocPrompt(config, style);

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: this.getSystemPrompt(style, config.depth || 'standard'),
    });

    return this.parseDocResult(response, config);
  }

  /**
   * Add JSDoc comments to code
   */
  async addJSDoc(code: string, options?: {
    includeExamples?: boolean;
    includeTypes?: boolean;
  }): Promise<string> {
    const prompt = `Add comprehensive JSDoc comments to this code:

\`\`\`typescript
${code}
\`\`\`

Requirements:
- Add @description for all functions/classes
- Add @param for all parameters with types
- Add @returns for return values
- Add @throws for potential errors
${options?.includeExamples ? '- Add @example for each function' : ''}
${options?.includeTypes ? '- Include @typedef for complex types' : ''}
- Use proper JSDoc tags (@async, @deprecated, etc.)

Return the fully documented code.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a documentation expert. Add clear, helpful JSDoc comments.',
    });

    return extractCode(response) || code;
  }

  /**
   * Generate README for a project/package
   */
  async generateReadme(config: ReadmeConfig): Promise<GeneratedReadme> {
    const sections = config.sections || [
      'installation',
      'usage',
      'api',
      'examples',
      'contributing',
      'license',
    ];

    const prompt = `Generate a comprehensive README for:

Name: ${config.name}
Description: ${config.description}
${config.sourceFiles?.length ? `Source files analyzed: ${config.sourceFiles.length}` : ''}

Sections to include: ${sections.join(', ')}
${config.badges?.length ? `Badges: ${config.badges.map(b => b.type).join(', ')}` : ''}
Table of contents: ${config.tableOfContents ? 'Yes' : 'No'}

Generate a professional, well-structured README with:
- Clear installation instructions
- Usage examples
- API documentation summary
- Contributing guidelines

Return the complete README in Markdown format.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a technical writer creating excellent documentation.',
    });

    return {
      content: this.extractMarkdown(response),
      sections,
      suggestions: this.extractSuggestions(response),
    };
  }

  /**
   * Generate API documentation
   */
  async generateAPIDoc(config: APIDocConfig): Promise<GeneratedAPIDoc> {
    const format = config.format || 'markdown';
    const moduleDocs: ModuleDoc[] = [];

    for (const file of config.sourceFiles) {
      const moduleDoc = await this.documentModule(file, config);
      moduleDocs.push(moduleDoc);
    }

    const index = this.generateIndex(moduleDocs, config.groupBy || 'file');
    const content = this.formatAPIDocs(moduleDocs, format);

    return {
      content,
      format,
      modules: moduleDocs,
      index,
    };
  }

  /**
   * Generate usage examples
   */
  async generateExamples(
    code: string,
    count: number = 3
  ): Promise<string[]> {
    const prompt = `Generate ${count} usage examples for this code:

\`\`\`typescript
${code}
\`\`\`

Generate:
- ${count} practical, real-world examples
- Varying complexity (basic to advanced)
- Include comments explaining each example
- Show different use cases

Return examples as JSON array of code strings.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'Generate clear, practical code examples.',
    });

    return extractJSON<string[]>(response) || [];
  }

  /**
   * Generate changelog entry
   */
  async generateChangelog(
    changes: { type: string; description: string; files?: string[] }[]
  ): Promise<string> {
    const prompt = `Generate a changelog entry for these changes:

${changes.map(c => `- [${c.type}] ${c.description}${c.files?.length ? ` (${c.files.join(', ')})` : ''}`).join('\n')}

Format:
- Use conventional changelog format
- Group by change type (Added, Changed, Fixed, Removed, etc.)
- Include links to issues/PRs if mentioned
- Write clear, user-friendly descriptions

Return the changelog entry in Markdown format.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'Generate clear, informative changelog entries.',
    });

    return this.extractMarkdown(response);
  }

  /**
   * Generate component documentation
   */
  async documentComponent(
    componentCode: string,
    componentName: string
  ): Promise<{
    documentation: string;
    props: ParameterDoc[];
    examples: string[];
  }> {
    const prompt = `Document this PhilJS component:

\`\`\`typescript
${componentCode}
\`\`\`

Component: ${componentName}

Generate:
1. Component description
2. Props documentation with types and descriptions
3. Usage examples (basic, advanced, with styling)
4. Accessibility notes
5. Related components

Return JSON with:
- documentation: Markdown documentation
- props: Array of { name, type, description, optional, defaultValue }
- examples: Array of code examples`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'Document PhilJS components thoroughly and clearly.',
    });

    const result = extractJSON<{
      documentation: string;
      props: ParameterDoc[];
      examples: string[];
    }>(response);

    return result || {
      documentation: '',
      props: [],
      examples: [],
    };
  }

  /**
   * Generate inline documentation comments
   */
  async addInlineComments(
    code: string,
    density: 'sparse' | 'normal' | 'dense' = 'normal'
  ): Promise<string> {
    const densityGuide = {
      sparse: 'Add comments only for complex or non-obvious code',
      normal: 'Add comments for functions, classes, and key logic',
      dense: 'Add comprehensive comments explaining all code sections',
    };

    const prompt = `Add inline comments to this code:

\`\`\`typescript
${code}
\`\`\`

Comment density: ${density}
Guide: ${densityGuide[density]}

Requirements:
- Explain the "why", not just the "what"
- Use clear, concise language
- Add TODO comments for potential improvements
- Mark complex algorithms
- Note edge cases

Return the commented code.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'Add helpful inline comments without over-documenting.',
    });

    return extractCode(response) || code;
  }

  /**
   * Document a module
   */
  private async documentModule(
    file: { path: string; content: string },
    config: APIDocConfig
  ): Promise<ModuleDoc> {
    const prompt = `Document this module:

File: ${file.path}
\`\`\`typescript
${file.content}
\`\`\`

Extract:
- Module description
- All exports (functions, classes, types, components)
- For each export: name, type, description, signature, parameters, returns

${config.includePrivate ? 'Include private members' : 'Only document public exports'}
${config.includeExamples ? 'Include usage examples' : ''}

Return JSON with module documentation structure.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'Extract and document all exports from the module.',
    });

    const result = extractJSON<ModuleDoc>(response);

    return result || {
      name: this.extractModuleName(file.path),
      description: '',
      exports: [],
      filePath: file.path,
    };
  }

  /**
   * Generate documentation index
   */
  private generateIndex(modules: ModuleDoc[], groupBy: 'file' | 'category' | 'type'): string {
    let index = '# API Index\n\n';

    if (groupBy === 'file') {
      for (const module of modules) {
        index += `## ${module.name}\n\n`;
        for (const exp of module.exports) {
          index += `- [${exp.name}](#${exp.name.toLowerCase()}) - ${exp.description.slice(0, 50)}...\n`;
        }
        index += '\n';
      }
    } else if (groupBy === 'type') {
      const byType: Record<string, ExportDoc[]> = {};
      for (const module of modules) {
        for (const exp of module.exports) {
          if (!byType[exp.type]) byType[exp.type] = [];
          byType[exp.type]!.push(exp);
        }
      }

      for (const [type, exports] of Object.entries(byType)) {
        index += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
        for (const exp of exports) {
          index += `- [${exp.name}](#${exp.name.toLowerCase()})\n`;
        }
        index += '\n';
      }
    }

    return index;
  }

  /**
   * Format API docs for output
   */
  private formatAPIDocs(modules: ModuleDoc[], format: 'markdown' | 'html' | 'json'): string {
    if (format === 'json') {
      return JSON.stringify(modules, null, 2);
    }

    let content = '';

    for (const module of modules) {
      content += `# ${module.name}\n\n`;
      content += `${module.description}\n\n`;

      for (const exp of module.exports) {
        content += `## ${exp.name}\n\n`;
        content += `**Type:** ${exp.type}\n\n`;
        content += `${exp.description}\n\n`;

        if (exp.signature) {
          content += `### Signature\n\n\`\`\`typescript\n${exp.signature}\n\`\`\`\n\n`;
        }

        if (exp.api?.parameters?.length) {
          content += `### Parameters\n\n`;
          for (const param of exp.api.parameters) {
            content += `- \`${param.name}\` (${param.type})${param.optional ? ' - optional' : ''}: ${param.description}\n`;
          }
          content += '\n';
        }

        if (exp.api?.returns) {
          content += `### Returns\n\n\`${exp.api.returns.type}\`: ${exp.api.returns.description}\n\n`;
        }

        if (exp.api?.examples?.length) {
          content += `### Examples\n\n`;
          for (const example of exp.api.examples) {
            content += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
          }
        }
      }
    }

    if (format === 'html') {
      // Basic markdown to HTML conversion
      return this.markdownToHTML(content);
    }

    return content;
  }

  /**
   * Build documentation prompt
   */
  private buildDocPrompt(config: DocGenerationConfig, style: DocStyle): string {
    return `Document this code using ${style} style:

${config.filePath ? `File: ${config.filePath}` : ''}

\`\`\`typescript
${config.code}
\`\`\`

Documentation depth: ${config.depth || 'standard'}
Audience: ${config.audience || 'developer'}
${config.includeExamples ? 'Include usage examples' : ''}
${config.includeTypes ? 'Include type information' : ''}

Generate:
1. Summary of the code
2. Documentation comments for all public APIs
3. Parameter and return type descriptions
${config.includeExamples ? '4. Usage examples for each function/component' : ''}`;
  }

  /**
   * Get system prompt for documentation
   */
  private getSystemPrompt(style: DocStyle, depth: string): string {
    const styleGuide = {
      jsdoc: 'Use JSDoc format with @param, @returns, @example, etc.',
      tsdoc: 'Use TSDoc format with @remarks, @typeParam, etc.',
      markdown: 'Use Markdown format with headers, code blocks, etc.',
      api: 'Generate structured API reference documentation.',
    };

    return `You are a technical documentation expert.

Style: ${styleGuide[style]}
Depth: ${depth}

Best practices:
- Write clear, concise descriptions
- Explain the "why" not just the "what"
- Include practical examples
- Document all parameters and return values
- Note edge cases and limitations
- Keep terminology consistent`;
  }

  /**
   * Parse documentation result
   */
  private parseDocResult(
    response: string,
    config: DocGenerationConfig
  ): GeneratedDocumentation {
    const jsonResult = extractJSON<GeneratedDocumentation>(response);
    if (jsonResult) {
      return jsonResult;
    }

    const code = extractCode(response) || config.code;

    const result: GeneratedDocumentation = {
      code,
      summary: this.extractSummary(response),
    };
    if (config.includeExamples) {
      result.examples = this.extractExamplesFromResponse(response);
    }
    return result;
  }

  /**
   * Extract summary from response
   */
  private extractSummary(response: string): string {
    const beforeCode = response.split('```')[0]!.trim();
    if (beforeCode.length > 20) {
      return beforeCode;
    }

    const summaryMatch = response.match(/(?:summary|description|overview)[:\s]*\n?([\s\S]*?)(?=\n\n|```|$)/i);
    return summaryMatch?.[1]?.trim() || 'Documentation generated';
  }

  /**
   * Extract examples from response
   */
  private extractExamplesFromResponse(response: string): string[] {
    const examples: string[] = [];
    const exampleRegex = /```(?:typescript|ts|javascript|js)\n([\s\S]*?)```/g;
    let match;

    // Skip the first code block (usually the documented code)
    let isFirst = true;
    while ((match = exampleRegex.exec(response)) !== null) {
      if (isFirst) {
        isFirst = false;
        continue;
      }
      examples.push(match[1]!.trim());
    }

    return examples;
  }

  /**
   * Extract suggestions from response
   */
  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    const suggestionMatch = response.match(/(?:suggestions?|improvements?)[:\s]*\n?([\s\S]*?)(?=\n\n[A-Z]|$)/i);

    if (suggestionMatch) {
      const lines = suggestionMatch[1]!.split('\n');
      for (const line of lines) {
        const cleaned = line.replace(/^[-*\d.]\s*/, '').trim();
        if (cleaned) {
          suggestions.push(cleaned);
        }
      }
    }

    return suggestions;
  }

  /**
   * Extract Markdown from response
   */
  private extractMarkdown(response: string): string {
    // Remove code block wrappers if present
    return response
      .replace(/^```(?:markdown|md)?\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();
  }

  /**
   * Extract module name from path
   */
  private extractModuleName(path: string): string {
    const match = path.match(/([^/\\]+)\.(?:ts|tsx|js|jsx)$/);
    return match?.[1] || path;
  }

  /**
   * Basic Markdown to HTML conversion
   */
  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.*)$/gm, (match) => {
        if (match.startsWith('<')) return match;
        return `<p>${match}</p>`;
      });
  }
}

/**
 * Create a documentation generator instance
 */
export function createDocGenerator(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): DocGenerator {
  return new DocGenerator(provider, options);
}

/**
 * Quick documentation generation helper
 */
export async function generateDocs(
  provider: AIProvider,
  code: string,
  style?: DocStyle
): Promise<GeneratedDocumentation> {
  const generator = new DocGenerator(provider);
  const config: DocGenerationConfig = { code };
  if (style !== undefined) {
    config.style = style;
  }
  return generator.generateDocs(config);
}

/**
 * Quick JSDoc addition helper
 */
export async function addJSDoc(
  provider: AIProvider,
  code: string
): Promise<string> {
  const generator = new DocGenerator(provider);
  return generator.addJSDoc(code, { includeExamples: true, includeTypes: true });
}

/**
 * Quick README generation helper
 */
export async function generateReadme(
  provider: AIProvider,
  name: string,
  description: string
): Promise<GeneratedReadme> {
  const generator = new DocGenerator(provider);
  return generator.generateReadme({ name, description });
}
