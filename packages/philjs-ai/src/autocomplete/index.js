/**
 * Code Autocomplete Module
 *
 * AI-powered context-aware code suggestions for PhilJS
 *
 * Features:
 * - Context-aware suggestions
 * - Component prop suggestions
 * - Import suggestions
 * - Fix suggestions for errors
 */
import { extractCode, extractJSON } from '../utils/parser.js';
/**
 * Completion item kinds (LSP-compatible)
 */
export var CompletionItemKind;
(function (CompletionItemKind) {
    CompletionItemKind[CompletionItemKind["Text"] = 1] = "Text";
    CompletionItemKind[CompletionItemKind["Method"] = 2] = "Method";
    CompletionItemKind[CompletionItemKind["Function"] = 3] = "Function";
    CompletionItemKind[CompletionItemKind["Constructor"] = 4] = "Constructor";
    CompletionItemKind[CompletionItemKind["Field"] = 5] = "Field";
    CompletionItemKind[CompletionItemKind["Variable"] = 6] = "Variable";
    CompletionItemKind[CompletionItemKind["Class"] = 7] = "Class";
    CompletionItemKind[CompletionItemKind["Interface"] = 8] = "Interface";
    CompletionItemKind[CompletionItemKind["Module"] = 9] = "Module";
    CompletionItemKind[CompletionItemKind["Property"] = 10] = "Property";
    CompletionItemKind[CompletionItemKind["Unit"] = 11] = "Unit";
    CompletionItemKind[CompletionItemKind["Value"] = 12] = "Value";
    CompletionItemKind[CompletionItemKind["Enum"] = 13] = "Enum";
    CompletionItemKind[CompletionItemKind["Keyword"] = 14] = "Keyword";
    CompletionItemKind[CompletionItemKind["Snippet"] = 15] = "Snippet";
    CompletionItemKind[CompletionItemKind["Color"] = 16] = "Color";
    CompletionItemKind[CompletionItemKind["File"] = 17] = "File";
    CompletionItemKind[CompletionItemKind["Reference"] = 18] = "Reference";
    CompletionItemKind[CompletionItemKind["Folder"] = 19] = "Folder";
    CompletionItemKind[CompletionItemKind["EnumMember"] = 20] = "EnumMember";
    CompletionItemKind[CompletionItemKind["Constant"] = 21] = "Constant";
    CompletionItemKind[CompletionItemKind["Struct"] = 22] = "Struct";
    CompletionItemKind[CompletionItemKind["Event"] = 23] = "Event";
    CompletionItemKind[CompletionItemKind["Operator"] = 24] = "Operator";
    CompletionItemKind[CompletionItemKind["TypeParameter"] = 25] = "TypeParameter";
})(CompletionItemKind || (CompletionItemKind = {}));
/**
 * Autocomplete Engine
 */
export class AutocompleteEngine {
    provider;
    defaultOptions;
    cache;
    cacheTimeout;
    constructor(provider, options) {
        this.provider = provider;
        this.defaultOptions = {
            temperature: 0.1,
            maxTokens: 1024,
            ...options,
        };
        this.cache = new Map();
        this.cacheTimeout = options?.cacheTimeout || 5000; // 5 seconds default
    }
    /**
     * Get autocomplete suggestions for current context
     */
    async getSuggestions(context) {
        const cacheKey = this.getCacheKey(context);
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const prompt = this.buildSuggestionPrompt(context);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getSystemPrompt(context),
        });
        const suggestions = this.parseSuggestions(response, context);
        // Cache results
        this.cache.set(cacheKey, suggestions);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
        return suggestions;
    }
    /**
     * Get component prop suggestions
     */
    async getComponentProps(componentName, context) {
        // Check if we have component info in context
        const componentInfo = context.projectContext?.components?.find(c => c.name === componentName);
        if (componentInfo?.props) {
            return componentInfo.props;
        }
        // Otherwise, use AI to infer props
        const prompt = `Infer the props for the PhilJS component "${componentName}".

Context from file:
\`\`\`${context.language}
${context.fileContent.slice(0, 2000)}
\`\`\`

Return JSON array of props with: name, type, required, defaultValue, description.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are an expert at analyzing PhilJS component props.',
        });
        return extractJSON(response) || [];
    }
    /**
     * Get import suggestions for an identifier
     */
    async getImportSuggestions(identifier, context) {
        // Check available imports first
        const availableImports = context.projectContext?.availableImports || [];
        const matchingImports = availableImports.filter(m => m.exports.includes(identifier) || m.name === identifier);
        if (matchingImports.length > 0) {
            return matchingImports.map(m => {
                const suggestion = {
                    module: m.path,
                };
                if (m.exports.includes(identifier)) {
                    suggestion.named = [identifier];
                }
                if (m.hasDefault && m.name === identifier) {
                    suggestion.default = identifier;
                }
                return suggestion;
            });
        }
        // Use AI for unknown imports
        const prompt = `Suggest imports for "${identifier}" in a PhilJS project.

Current imports:
${this.extractImports(context.fileContent)}

Available dependencies: ${context.projectContext?.dependencies?.join(', ') || 'Standard PhilJS stack'}

Return JSON array of import suggestions with: module, named (array), default (string or null).`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are an expert at suggesting correct imports.',
        });
        return extractJSON(response) || [];
    }
    /**
     * Get fix suggestions for an error
     */
    async getFixSuggestions(error, context) {
        const surroundingCode = this.extractSurroundingCode(context.fileContent, error.location.line, 5);
        const prompt = `Suggest fixes for this error:

Error: ${error.message}
${error.code ? `Code: ${error.code}` : ''}
Location: Line ${error.location.line}, Column ${error.location.column}

Surrounding code:
\`\`\`${context.language}
${surroundingCode}
\`\`\`

Provide fix suggestions with:
- description: What the fix does
- changes: Array of text edits (range and newText)
- isPreferred: Boolean if this is the recommended fix
- kind: 'quickfix', 'refactor', or 'source'

Return JSON array of fix suggestions.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are an expert at fixing PhilJS and TypeScript errors.',
        });
        return extractJSON(response) || [];
    }
    /**
     * Get inline completion from context (for ghost text)
     */
    async getInlineCompletionFromContext(context) {
        const beforeCursor = this.getTextBeforeCursor(context);
        const afterCursor = this.getTextAfterCursor(context);
        const prompt = `Complete the code at the cursor position.

Before cursor:
\`\`\`${context.language}
${beforeCursor}
\`\`\`

After cursor:
\`\`\`${context.language}
${afterCursor}
\`\`\`

Provide a natural continuation that:
- Fits the existing code style
- Is syntactically correct
- Follows PhilJS patterns
- Is concise (1-3 lines max)

Return only the completion text, no explanations.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            temperature: 0.2,
            systemPrompt: 'Complete code naturally and concisely. Return only code, no markdown.',
        });
        // Clean up the response
        const completion = response.trim();
        if (completion.startsWith('```')) {
            return extractCode(response);
        }
        return completion || null;
    }
    /**
     * Get snippet suggestions
     */
    async getSnippetSuggestions(trigger, context) {
        const philjsSnippets = this.getBuiltInSnippets();
        const matchingSnippets = philjsSnippets.filter(s => s.label.toLowerCase().includes(trigger.toLowerCase()));
        if (matchingSnippets.length > 0) {
            return matchingSnippets;
        }
        // Generate custom snippet with AI
        const prompt = `Generate a PhilJS code snippet for: "${trigger}"

Requirements:
- Use PhilJS patterns (signal, memo, effect)
- Include proper TypeScript types
- Use $1, $2, etc. for placeholder positions
- Make it reusable and practical

Return JSON with: text, label, detail, insertText (with placeholders).`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'Generate useful PhilJS code snippets.',
        });
        const snippet = extractJSON(response);
        return snippet ? [{ ...snippet, kind: 'snippet' }] : [];
    }
    /**
     * Build the suggestion prompt
     */
    buildSuggestionPrompt(context) {
        const beforeCursor = this.getTextBeforeCursor(context);
        const afterCursor = this.getTextAfterCursor(context);
        const currentLine = this.getCurrentLine(context);
        return `Provide autocomplete suggestions for PhilJS code.

File: ${context.filePath}
Language: ${context.language}
Trigger: ${context.triggerCharacter || 'general'}
Prefix: ${context.prefix || ''}

Current line:
${currentLine}

Before cursor:
\`\`\`${context.language}
${beforeCursor.slice(-500)}
\`\`\`

After cursor:
\`\`\`${context.language}
${afterCursor.slice(0, 200)}
\`\`\`

${context.projectContext?.components?.length ? `Available components: ${context.projectContext.components.map(c => c.name).join(', ')}` : ''}

Provide 5-10 relevant suggestions as JSON array with:
- text: Text to insert
- label: Display label
- kind: component|prop|function|variable|type|keyword|snippet|import
- detail: Short description
- sortPriority: Number (lower = higher priority)
- imports: Required imports (optional)`;
    }
    /**
     * Get system prompt based on context
     */
    getSystemPrompt(context) {
        const isJSX = context.language === 'tsx' || context.language === 'jsx';
        return `You are an intelligent autocomplete engine for PhilJS.

PhilJS patterns:
- signal() for state: const [value, setValue] = signal(initial)
- memo() for computed: const derived = memo(() => value() * 2)
- effect() for side effects: effect(() => console.log(value()))
${isJSX ? '- JSX components with fine-grained reactivity' : ''}

Provide relevant, accurate suggestions that:
1. Match the current context
2. Follow PhilJS best practices
3. Use correct TypeScript types
4. Are properly formatted

Always return valid JSON array of suggestions.`;
    }
    /**
     * Parse suggestions from AI response
     */
    parseSuggestions(response, context) {
        const suggestions = extractJSON(response);
        if (!suggestions || !Array.isArray(suggestions)) {
            return [];
        }
        // Sort by priority and filter invalid
        return suggestions
            .filter(s => s.text && s.label && s.kind)
            .sort((a, b) => (a.sortPriority || 50) - (b.sortPriority || 50));
    }
    /**
     * Get text before cursor
     */
    getTextBeforeCursor(context) {
        const lines = context.fileContent.split('\n');
        const beforeLines = lines.slice(0, context.cursor.line);
        const currentLine = lines[context.cursor.line] || '';
        const beforeCursor = currentLine.slice(0, context.cursor.column);
        return [...beforeLines, beforeCursor].join('\n');
    }
    /**
     * Get text after cursor
     */
    getTextAfterCursor(context) {
        const lines = context.fileContent.split('\n');
        const currentLine = lines[context.cursor.line] || '';
        const afterCursor = currentLine.slice(context.cursor.column);
        const afterLines = lines.slice(context.cursor.line + 1);
        return [afterCursor, ...afterLines].join('\n');
    }
    /**
     * Get current line
     */
    getCurrentLine(context) {
        const lines = context.fileContent.split('\n');
        return lines[context.cursor.line] || '';
    }
    /**
     * Extract surrounding code
     */
    extractSurroundingCode(content, line, radius) {
        const lines = content.split('\n');
        const start = Math.max(0, line - radius);
        const end = Math.min(lines.length, line + radius + 1);
        return lines
            .slice(start, end)
            .map((l, i) => `${start + i + 1}: ${l}`)
            .join('\n');
    }
    /**
     * Extract imports from file content
     */
    extractImports(content) {
        const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
        return importLines.join('\n') || 'No imports';
    }
    /**
     * Generate cache key for context
     */
    getCacheKey(context) {
        return `${context.filePath}:${context.cursor.line}:${context.cursor.column}:${context.prefix || ''}`;
    }
    /**
     * Get built-in PhilJS snippets
     */
    getBuiltInSnippets() {
        return [
            {
                text: 'signal',
                label: 'signal - Create reactive state',
                kind: 'snippet',
                detail: 'const [value, setValue] = signal(initial)',
                insertText: 'const [$1, set${1/(.*)/${1:/capitalize}/}] = signal($2);',
                sortPriority: 1,
            },
            {
                text: 'memo',
                label: 'memo - Create computed value',
                kind: 'snippet',
                detail: 'const derived = memo(() => computation)',
                insertText: 'const $1 = memo(() => $2);',
                sortPriority: 2,
            },
            {
                text: 'effect',
                label: 'effect - Create side effect',
                kind: 'snippet',
                detail: 'effect(() => { ... })',
                insertText: 'effect(() => {\n\t$1\n});',
                sortPriority: 3,
            },
            {
                text: 'component',
                label: 'component - Create PhilJS component',
                kind: 'snippet',
                detail: 'function Component() { ... }',
                insertText: 'export function $1(props: $2Props) {\n\treturn (\n\t\t<div>\n\t\t\t$3\n\t\t</div>\n\t);\n}',
                sortPriority: 4,
            },
            {
                text: 'loader',
                label: 'loader - Create route loader',
                kind: 'snippet',
                detail: 'export async function loader() { ... }',
                insertText: 'export async function loader({ params, request }: LoaderArgs) {\n\tconst data = await $1;\n\treturn { data };\n}',
                sortPriority: 5,
            },
            {
                text: 'action',
                label: 'action - Create route action',
                kind: 'snippet',
                detail: 'export async function action() { ... }',
                insertText: 'export async function action({ request }: ActionArgs) {\n\tconst formData = await request.formData();\n\t$1\n\treturn { success: true };\n}',
                sortPriority: 6,
            },
        ];
    }
    /**
     * Clear the suggestion cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get inline completion (Copilot-style ghost text)
     *
     * @param prefix - Code before the cursor position
     * @param suffix - Code after the cursor position
     * @param options - Completion options
     * @returns Inline completion suggestion or null
     *
     * @example
     * ```typescript
     * const completion = await engine.getInlineCompletion(
     *   'const user = ',
     *   ';\nconsole.log(user);',
     *   { maxLength: 50 }
     * );
     * // Returns something like: "{ name: 'John', age: 30 }"
     * ```
     */
    async getInlineCompletion(prefix, suffix, options) {
        const language = options?.language || 'typescript';
        const maxLength = options?.maxLength || 100;
        const prompt = `Complete the code at the cursor position (marked with |CURSOR|).

\`\`\`${language}
${prefix}|CURSOR|${suffix}
\`\`\`

Requirements:
- Provide a natural, idiomatic completion
- Match the existing code style
- Be syntactically correct
- Keep it concise (max ${maxLength} characters)
- Consider the context from both prefix and suffix
- Follow PhilJS patterns if applicable

Return ONLY the completion text that should be inserted at the cursor position.
Do not include any explanation or markdown.`;
        try {
            const response = await this.provider.generateCompletion(prompt, {
                ...this.defaultOptions,
                temperature: 0.1,
                maxTokens: Math.min(maxLength * 2, 200),
                stopSequences: options?.stopSequences || ['\n\n', '```'],
                systemPrompt: 'You are a code completion engine. Return ONLY the code to insert, nothing else. No markdown, no explanation.',
            });
            // Clean up response
            let text = response.trim();
            // Remove markdown if present
            if (text.startsWith('```')) {
                const match = text.match(/```\w*\n?([\s\S]*?)```/);
                text = match?.[1]?.trim() || text;
            }
            // Remove quotes if the response is just the completion wrapped in quotes
            if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
                text = text.slice(1, -1);
            }
            if (!text || text.length === 0) {
                return null;
            }
            // Calculate insertion range
            const prefixLines = prefix.split('\n');
            const lastLine = prefixLines[prefixLines.length - 1] ?? '';
            return {
                text,
                range: {
                    start: {
                        line: prefixLines.length - 1,
                        character: lastLine.length,
                    },
                    end: {
                        line: prefixLines.length - 1,
                        character: lastLine.length,
                    },
                },
                displayText: text.length > 50 ? text.slice(0, 50) + '...' : text,
            };
        }
        catch (error) {
            console.error('Inline completion error:', error);
            return null;
        }
    }
    /**
     * Get function signature help
     *
     * @param functionName - Name of the function to get help for
     * @param context - Code context for better accuracy
     * @returns Signature help with parameters and documentation
     *
     * @example
     * ```typescript
     * const help = await engine.getSignatureHelp('signal', context);
     * console.log(help.signatures[0].label); // "signal<T>(initialValue: T): [Accessor<T>, Setter<T>]"
     * ```
     */
    async getSignatureHelp(functionName, context) {
        // Check built-in PhilJS functions first
        const builtIn = this.getBuiltInSignatureHelp(functionName);
        if (builtIn) {
            return builtIn;
        }
        // Use AI for custom functions
        const contextCode = context?.fileContent?.slice(0, 2000) || '';
        const prompt = `Provide signature help for the function "${functionName}".

${contextCode ? `Context:\n\`\`\`typescript\n${contextCode}\n\`\`\`` : ''}

Return JSON with:
{
  "signatures": [
    {
      "label": "full function signature",
      "documentation": "description of what the function does",
      "parameters": [
        {
          "label": "paramName",
          "documentation": "description of the parameter"
        }
      ]
    }
  ],
  "activeSignature": 0,
  "activeParameter": 0
}`;
        try {
            const response = await this.provider.generateCompletion(prompt, {
                ...this.defaultOptions,
                systemPrompt: 'You are a TypeScript documentation expert. Provide accurate function signatures.',
            });
            return extractJSON(response);
        }
        catch (error) {
            console.error('Signature help error:', error);
            return null;
        }
    }
    /**
     * Get completions for the current code context
     *
     * @param context - The code context including file content, cursor position, etc.
     * @returns Array of completion suggestions
     */
    async getCompletions(context) {
        const autocompleteContext = {
            fileContent: context.content,
            cursor: context.position,
            filePath: context.filePath || 'untitled.ts',
            language: context.language || 'typescript',
            ...(context.prefix && { prefix: context.prefix }),
            ...(context.trigger && { triggerCharacter: context.trigger }),
            ...(context.projectContext && { projectContext: context.projectContext }),
        };
        const suggestions = await this.getSuggestions(autocompleteContext);
        return suggestions.map((s, i) => {
            const item = {
                label: s.label,
                kind: this.mapSuggestionKind(s.kind),
                insertText: s.insertText || s.text,
                sortText: String(i).padStart(4, '0'),
                filterText: s.label,
                preselect: i === 0,
            };
            if (s.detail)
                item.detail = s.detail;
            if (s.documentation)
                item.documentation = s.documentation;
            if (s.imports && s.imports.length > 0) {
                item.additionalTextEdits = s.imports.map(imp => ({
                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                    newText: this.formatImport(imp),
                }));
            }
            return item;
        });
    }
    /**
     * Get built-in PhilJS signature help
     */
    getBuiltInSignatureHelp(functionName) {
        const builtInSignatures = {
            signal: {
                signatures: [
                    {
                        label: 'signal<T>(initialValue: T): [Accessor<T>, Setter<T>]',
                        documentation: 'Creates a reactive signal with the given initial value. Returns a tuple of [getter, setter].',
                        parameters: [
                            {
                                label: 'initialValue',
                                documentation: 'The initial value for the signal',
                            },
                        ],
                    },
                ],
                activeSignature: 0,
                activeParameter: 0,
            },
            memo: {
                signatures: [
                    {
                        label: 'memo<T>(computation: () => T): Accessor<T>',
                        documentation: 'Creates a computed/derived value that automatically tracks its dependencies.',
                        parameters: [
                            {
                                label: 'computation',
                                documentation: 'A function that computes the derived value',
                            },
                        ],
                    },
                ],
                activeSignature: 0,
                activeParameter: 0,
            },
            effect: {
                signatures: [
                    {
                        label: 'effect(fn: () => void | (() => void)): void',
                        documentation: 'Creates a side effect that runs when its dependencies change. Returns a cleanup function if provided.',
                        parameters: [
                            {
                                label: 'fn',
                                documentation: 'The effect function. Can optionally return a cleanup function.',
                            },
                        ],
                    },
                ],
                activeSignature: 0,
                activeParameter: 0,
            },
            createContext: {
                signatures: [
                    {
                        label: 'createContext<T>(defaultValue?: T): Context<T>',
                        documentation: 'Creates a new context that can be provided and consumed in the component tree.',
                        parameters: [
                            {
                                label: 'defaultValue',
                                documentation: 'Optional default value when no provider is found',
                            },
                        ],
                    },
                ],
                activeSignature: 0,
                activeParameter: 0,
            },
            useContext: {
                signatures: [
                    {
                        label: 'useContext<T>(context: Context<T>): T',
                        documentation: 'Consumes a context value from the nearest provider.',
                        parameters: [
                            {
                                label: 'context',
                                documentation: 'The context to consume',
                            },
                        ],
                    },
                ],
                activeSignature: 0,
                activeParameter: 0,
            },
        };
        return builtInSignatures[functionName] || null;
    }
    /**
     * Map suggestion kind to completion item kind
     */
    mapSuggestionKind(kind) {
        const kindMap = {
            component: CompletionItemKind.Class,
            prop: CompletionItemKind.Property,
            function: CompletionItemKind.Function,
            variable: CompletionItemKind.Variable,
            type: CompletionItemKind.Interface,
            keyword: CompletionItemKind.Keyword,
            snippet: CompletionItemKind.Snippet,
            import: CompletionItemKind.Module,
            file: CompletionItemKind.File,
            fix: CompletionItemKind.Text,
        };
        return kindMap[kind] || CompletionItemKind.Text;
    }
    /**
     * Format an import suggestion as import statement
     */
    formatImport(imp) {
        if (imp.default && imp.named?.length) {
            return `import ${imp.default}, { ${imp.named.join(', ')} } from '${imp.module}';\n`;
        }
        if (imp.default) {
            return `import ${imp.default} from '${imp.module}';\n`;
        }
        if (imp.named?.length) {
            return `import { ${imp.named.join(', ')} } from '${imp.module}';\n`;
        }
        return `import '${imp.module}';\n`;
    }
}
/**
 * Create an autocomplete engine instance
 */
export function createAutocompleteEngine(provider, options) {
    return new AutocompleteEngine(provider, options);
}
/**
 * Quick suggestion helper
 */
export async function getSuggestions(provider, context) {
    const engine = new AutocompleteEngine(provider);
    return engine.getSuggestions(context);
}
/**
 * Quick fix suggestion helper
 */
export async function getFixSuggestions(provider, error, context) {
    const engine = new AutocompleteEngine(provider);
    return engine.getFixSuggestions(error, context);
}
/**
 * Quick inline completion helper
 *
 * @param provider - AI provider
 * @param prefix - Code before cursor
 * @param suffix - Code after cursor
 * @returns Inline completion result or null
 */
export async function getInlineCompletion(provider, prefix, suffix) {
    const engine = new AutocompleteEngine(provider);
    return engine.getInlineCompletion(prefix, suffix);
}
/**
 * Quick signature help helper
 *
 * @param provider - AI provider
 * @param functionName - Function name to get help for
 * @param context - Optional code context
 * @returns Signature help result or null
 */
export async function getSignatureHelp(provider, functionName, context) {
    const engine = new AutocompleteEngine(provider);
    return engine.getSignatureHelp(functionName, context);
}
/**
 * Quick completions helper
 *
 * @param provider - AI provider
 * @param context - Code context
 * @returns Array of completion items
 */
export async function getCompletions(provider, context) {
    const engine = new AutocompleteEngine(provider);
    return engine.getCompletions(context);
}
//# sourceMappingURL=index.js.map