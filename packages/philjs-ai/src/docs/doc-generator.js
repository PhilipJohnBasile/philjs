/**
 * Documentation Generator - AI-powered documentation generation for PhilJS
 *
 * Features:
 * - JSDoc comments generation
 * - README generation
 * - API documentation
 * - Usage examples generation
 */
import { extractCode, extractJSON } from '../utils/parser.js';
/**
 * Documentation Generator class
 */
export class DocGenerator {
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
     * Generate documentation for code
     */
    async generateDocs(config) {
        const style = config.style || 'jsdoc';
        const prompt = this.buildDocPrompt(config, style);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getSystemPrompt(style, config.depth || 'standard'),
        });
        return this.parseDocResult(response, config);
    }
    /**
     * Add JSDoc comments to code
     */
    async addJSDoc(code, options) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a documentation expert. Add clear, helpful JSDoc comments.',
        });
        return extractCode(response) || code;
    }
    /**
     * Generate README for a project/package
     */
    async generateReadme(config) {
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
        const response = await this.provider.generateCompletion(prompt, {
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
    async generateAPIDoc(config) {
        const format = config.format || 'markdown';
        const moduleDocs = [];
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
    async generateExamples(code, count = 3) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'Generate clear, practical code examples.',
        });
        return extractJSON(response) || [];
    }
    /**
     * Generate changelog entry
     */
    async generateChangelog(changes) {
        const prompt = `Generate a changelog entry for these changes:

${changes.map(c => `- [${c.type}] ${c.description}${c.files?.length ? ` (${c.files.join(', ')})` : ''}`).join('\n')}

Format:
- Use conventional changelog format
- Group by change type (Added, Changed, Fixed, Removed, etc.)
- Include links to issues/PRs if mentioned
- Write clear, user-friendly descriptions

Return the changelog entry in Markdown format.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'Generate clear, informative changelog entries.',
        });
        return this.extractMarkdown(response);
    }
    /**
     * Generate component documentation
     */
    async documentComponent(componentCode, componentName) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'Document PhilJS components thoroughly and clearly.',
        });
        const result = extractJSON(response);
        return result || {
            documentation: '',
            props: [],
            examples: [],
        };
    }
    /**
     * Generate inline documentation comments
     */
    async addInlineComments(code, density = 'normal') {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'Add helpful inline comments without over-documenting.',
        });
        return extractCode(response) || code;
    }
    /**
     * Document a module
     */
    async documentModule(file, config) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'Extract and document all exports from the module.',
        });
        const result = extractJSON(response);
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
    generateIndex(modules, groupBy) {
        let index = '# API Index\n\n';
        if (groupBy === 'file') {
            for (const module of modules) {
                index += `## ${module.name}\n\n`;
                for (const exp of module.exports) {
                    index += `- [${exp.name}](#${exp.name.toLowerCase()}) - ${exp.description.slice(0, 50)}...\n`;
                }
                index += '\n';
            }
        }
        else if (groupBy === 'type') {
            const byType = {};
            for (const module of modules) {
                for (const exp of module.exports) {
                    if (!byType[exp.type])
                        byType[exp.type] = [];
                    byType[exp.type].push(exp);
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
    formatAPIDocs(modules, format) {
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
    buildDocPrompt(config, style) {
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
    getSystemPrompt(style, depth) {
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
    parseDocResult(response, config) {
        const jsonResult = extractJSON(response);
        if (jsonResult) {
            return jsonResult;
        }
        const code = extractCode(response) || config.code;
        const result = {
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
    extractSummary(response) {
        const beforeCode = response.split('```')[0].trim();
        if (beforeCode.length > 20) {
            return beforeCode;
        }
        const summaryMatch = response.match(/(?:summary|description|overview)[:\s]*\n?([\s\S]*?)(?=\n\n|```|$)/i);
        return summaryMatch?.[1]?.trim() || 'Documentation generated';
    }
    /**
     * Extract examples from response
     */
    extractExamplesFromResponse(response) {
        const examples = [];
        const exampleRegex = /```(?:typescript|ts|javascript|js)\n([\s\S]*?)```/g;
        let match;
        // Skip the first code block (usually the documented code)
        let isFirst = true;
        while ((match = exampleRegex.exec(response)) !== null) {
            if (isFirst) {
                isFirst = false;
                continue;
            }
            examples.push(match[1].trim());
        }
        return examples;
    }
    /**
     * Extract suggestions from response
     */
    extractSuggestions(response) {
        const suggestions = [];
        const suggestionMatch = response.match(/(?:suggestions?|improvements?)[:\s]*\n?([\s\S]*?)(?=\n\n[A-Z]|$)/i);
        if (suggestionMatch) {
            const lines = suggestionMatch[1].split('\n');
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
    extractMarkdown(response) {
        // Remove code block wrappers if present
        return response
            .replace(/^```(?:markdown|md)?\n?/gm, '')
            .replace(/```$/gm, '')
            .trim();
    }
    /**
     * Extract module name from path
     */
    extractModuleName(path) {
        const match = path.match(/([^/\\]+)\.(?:ts|tsx|js|jsx)$/);
        return match?.[1] || path;
    }
    /**
     * Basic Markdown to HTML conversion
     */
    markdownToHTML(markdown) {
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
            if (match.startsWith('<'))
                return match;
            return `<p>${match}</p>`;
        });
    }
}
/**
 * Create a documentation generator instance
 */
export function createDocGenerator(provider, options) {
    return new DocGenerator(provider, options);
}
/**
 * Quick documentation generation helper
 */
export async function generateDocs(provider, code, style) {
    const generator = new DocGenerator(provider);
    const config = { code };
    if (style !== undefined) {
        config.style = style;
    }
    return generator.generateDocs(config);
}
/**
 * Quick JSDoc addition helper
 */
export async function addJSDoc(provider, code) {
    const generator = new DocGenerator(provider);
    return generator.addJSDoc(code, { includeExamples: true, includeTypes: true });
}
/**
 * Quick README generation helper
 */
export async function generateReadme(provider, name, description) {
    const generator = new DocGenerator(provider);
    return generator.generateReadme({ name, description });
}
//# sourceMappingURL=doc-generator.js.map