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
import { extractCode, extractJSON } from '../utils/parser.js';
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
    provider;
    defaultOptions;
    constructor(provider, options) {
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
    async generateDocs(code, options) {
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
    async documentComponent(componentCode, options) {
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
        const result = extractJSON(response);
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
    async addJSDoc(code, options) {
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
    async generateReadme(files, options) {
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
    async generateAPIDoc(code, options) {
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
    async updateDocs(code, changes) {
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
    async checkDocQuality(code) {
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
        return extractJSON(response) || { score: 50, issues: [], suggestions: [] };
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    buildDocPrompt(code, style, verbosity, options) {
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
Verbosity: ${verbosityGuide[verbosity]}

${options?.includeExamples ? 'Include @example with usage examples for all public functions' : ''}
${options?.includeTypes ? 'Include @type tags where helpful' : ''}
${options?.markDeprecated ? 'Mark deprecated items with @deprecated' : ''}
${options?.customTags?.length ? `Custom tags: ${options.customTags.map(t => `@${t.name} ${t.content}`).join(', ')}` : ''}

Return the complete documented code.`;
    }
    getDocSystemPrompt(style) {
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
    extractDocBlocks(code) {
        const blocks = [];
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
            let type = 'function';
            let name = 'unknown';
            if (funcMatch) {
                type = 'function';
                name = funcMatch[1];
            }
            else if (constMatch) {
                type = afterDoc.includes('=>') || afterDoc.includes('function') ? 'function' : 'constant';
                name = constMatch[1];
            }
            else if (interfaceMatch) {
                type = 'interface';
                name = interfaceMatch[1];
            }
            else if (typeMatch) {
                type = 'type';
                name = typeMatch[1];
            }
            else if (classMatch) {
                type = 'class';
                name = classMatch[1];
            }
            // Extract description from JSDoc
            const descMatch = match[0].match(/\/\*\*\s*\n?\s*\*?\s*([^\n@]*)/);
            const description = descMatch ? descMatch[1].trim() : '';
            // Extract params
            const params = [];
            const paramMatches = match[0].matchAll(/@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s*-?\s*(.*)/g);
            for (const pm of paramMatches) {
                params.push({
                    name: pm[2],
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
            const block = {
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
    calculateCoverage(code, docBlocks) {
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
        const missing = [];
        // Extract names from matches and check
        const allMatches = [
            ...funcMatches.map(m => m.match(/function\s+(\w+)/)?.[1]),
            ...constFuncMatches.map(m => m.match(/const\s+(\w+)/)?.[1]),
            ...interfaceMatches.map(m => m.match(/interface\s+(\w+)/)?.[1]),
            ...typeMatches.map(m => m.match(/type\s+(\w+)/)?.[1]),
            ...classMatches.map(m => m.match(/class\s+(\w+)/)?.[1]),
        ].filter(Boolean);
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
    generateSummary(docBlocks) {
        const types = docBlocks.reduce((acc, b) => {
            acc[b.type] = (acc[b.type] || 0) + 1;
            return acc;
        }, {});
        const parts = [];
        if (types['function'])
            parts.push(`${types['function']} functions`);
        if (types['component'])
            parts.push(`${types['component']} components`);
        if (types['interface'])
            parts.push(`${types['interface']} interfaces`);
        if (types['type'])
            parts.push(`${types['type']} types`);
        if (types['class'])
            parts.push(`${types['class']} classes`);
        return `Documented ${parts.join(', ')}.`;
    }
    async getSuggestions(code, docBlocks) {
        const suggestions = [];
        // Check for missing examples
        const withoutExamples = docBlocks.filter(b => b.type === 'function' && !b.documentation.includes('@example'));
        if (withoutExamples.length > 0) {
            suggestions.push(`Add @example to ${withoutExamples.length} functions: ${withoutExamples.map(b => b.name).join(', ')}`);
        }
        // Check for vague descriptions
        const vagueBlocks = docBlocks.filter(b => b.description.length < 10 || b.description.toLowerCase().includes('todo'));
        if (vagueBlocks.length > 0) {
            suggestions.push(`Improve descriptions for: ${vagueBlocks.map(b => b.name).join(', ')}`);
        }
        // Check for missing param descriptions
        const missingParamDesc = docBlocks.filter(b => b.params?.some(p => !p.description || p.description.length < 5));
        if (missingParamDesc.length > 0) {
            suggestions.push(`Add parameter descriptions for: ${missingParamDesc.map(b => b.name).join(', ')}`);
        }
        return suggestions;
    }
    extractBasicComponentDoc(code) {
        const nameMatch = code.match(/(?:export\s+)?(?:function|const)\s+(\w+)/);
        const name = nameMatch?.[1] || 'Unknown';
        // Extract props interface
        const propsMatch = code.match(/interface\s+(\w+Props)\s*\{([^}]+)\}/);
        const props = [];
        if (propsMatch) {
            const propsContent = propsMatch[2];
            const propLines = propsContent.split('\n');
            for (const line of propLines) {
                const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/);
                if (propMatch) {
                    props.push({
                        name: propMatch[1],
                        type: propMatch[3].trim(),
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
    extractReadmeSections(content) {
        const sections = [];
        const headingMatches = content.matchAll(/^##?\s+(.+)$/gm);
        for (const match of headingMatches) {
            sections.push(match[1]);
        }
        return sections;
    }
    generateTableOfContents(sections) {
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
export function createDocumentationGenerator(provider, options) {
    return new DocumentationGenerator(provider, options);
}
/**
 * Quick documentation generation helper
 */
export async function generateDocumentation(provider, code, options) {
    const generator = new DocumentationGenerator(provider);
    return generator.generateDocs(code, options);
}
/**
 * Quick JSDoc addition helper
 */
export async function addJSDocToCode(provider, code, options) {
    const generator = new DocumentationGenerator(provider);
    return generator.addJSDoc(code, options);
}
/**
 * Quick component documentation helper
 */
export async function documentPhilJSComponent(provider, componentCode) {
    const generator = new DocumentationGenerator(provider);
    return generator.documentComponent(componentCode);
}
//# sourceMappingURL=documentation-generator.js.map