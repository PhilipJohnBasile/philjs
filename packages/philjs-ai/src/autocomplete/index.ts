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

import type { AIProvider, CompletionOptions } from '../types.js';
import { extractCode, extractJSON } from '../utils/parser.js';

/**
 * Autocomplete context
 */
export interface AutocompleteContext {
  /** Current file content */
  fileContent: string;
  /** Cursor position (line, column) */
  cursor: { line: number; column: number };
  /** Current file path */
  filePath: string;
  /** Language/file type */
  language: 'typescript' | 'tsx' | 'javascript' | 'jsx';
  /** Project context (imports, types, etc.) */
  projectContext?: ProjectContext;
  /** Trigger character (e.g., '.', '<', '/') */
  triggerCharacter?: string;
  /** Prefix before cursor */
  prefix?: string;
}

/**
 * Project context for better suggestions
 */
export interface ProjectContext {
  /** Available imports/modules */
  availableImports?: ModuleInfo[];
  /** Available components */
  components?: ComponentInfo[];
  /** Type definitions */
  types?: TypeInfo[];
  /** Project dependencies */
  dependencies?: string[];
  /** Custom hooks/utilities */
  utilities?: UtilityInfo[];
}

/**
 * Module information
 */
export interface ModuleInfo {
  /** Module name */
  name: string;
  /** Exported members */
  exports: string[];
  /** Module path */
  path: string;
  /** Is default export */
  hasDefault?: boolean;
}

/**
 * Component information
 */
export interface ComponentInfo {
  /** Component name */
  name: string;
  /** Props interface */
  props?: PropInfo[];
  /** Component description */
  description?: string;
  /** Import path */
  importPath: string;
}

/**
 * Prop information
 */
export interface PropInfo {
  /** Prop name */
  name: string;
  /** Prop type */
  type: string;
  /** Is required */
  required: boolean;
  /** Default value */
  defaultValue?: string;
  /** Description */
  description?: string;
}

/**
 * Type information
 */
export interface TypeInfo {
  /** Type name */
  name: string;
  /** Type definition */
  definition: string;
  /** Source file */
  source: string;
}

/**
 * Utility information
 */
export interface UtilityInfo {
  /** Utility name */
  name: string;
  /** Signature */
  signature: string;
  /** Description */
  description?: string;
  /** Import path */
  importPath: string;
}

/**
 * Autocomplete suggestion
 */
export interface AutocompleteSuggestion {
  /** Suggestion text to insert */
  text: string;
  /** Display label */
  label: string;
  /** Suggestion kind */
  kind: SuggestionKind;
  /** Detail information */
  detail?: string;
  /** Documentation */
  documentation?: string;
  /** Insert text with snippets */
  insertText?: string;
  /** Sort order priority */
  sortPriority?: number;
  /** Required imports */
  imports?: ImportSuggestion[];
  /** Additional edits */
  additionalEdits?: TextEdit[];
}

/**
 * Suggestion kinds
 */
export type SuggestionKind =
  | 'component'
  | 'prop'
  | 'function'
  | 'variable'
  | 'type'
  | 'keyword'
  | 'snippet'
  | 'import'
  | 'file'
  | 'fix';

/**
 * Import suggestion
 */
export interface ImportSuggestion {
  /** Module path */
  module: string;
  /** Named imports */
  named?: string[];
  /** Default import name */
  default?: string;
}

/**
 * Text edit for additional changes
 */
export interface TextEdit {
  /** Range to replace */
  range: { start: { line: number; column: number }; end: { line: number; column: number } };
  /** New text */
  newText: string;
}

/**
 * Error information for fix suggestions
 */
export interface ErrorInfo {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Error location */
  location: { line: number; column: number };
  /** Error source */
  source?: string;
}

/**
 * Fix suggestion
 */
export interface FixSuggestion {
  /** Fix description */
  description: string;
  /** Code changes */
  changes: TextEdit[];
  /** Is preferred fix */
  isPreferred?: boolean;
  /** Fix kind */
  kind: 'quickfix' | 'refactor' | 'source';
}

/**
 * Inline completion result (Copilot-style)
 */
export interface InlineCompletionResult {
  /** The completion text to insert */
  text: string;
  /** The range where the completion should be inserted */
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  /** Shortened display text for UI */
  displayText?: string;
}

/**
 * Signature help result
 */
export interface SignatureHelpResult {
  /** Available signatures */
  signatures: SignatureInfo[];
  /** Index of the active signature */
  activeSignature: number;
  /** Index of the active parameter */
  activeParameter: number;
}

/**
 * Signature information
 */
export interface SignatureInfo {
  /** Full signature label */
  label: string;
  /** Signature documentation */
  documentation?: string;
  /** Parameter information */
  parameters: ParameterInfo[];
}

/**
 * Parameter information
 */
export interface ParameterInfo {
  /** Parameter label/name */
  label: string;
  /** Parameter documentation */
  documentation?: string;
}

/**
 * Code context for completions
 */
export interface CodeContext {
  /** File content */
  content: string;
  /** Cursor position */
  position: { line: number; column: number };
  /** File path */
  filePath?: string;
  /** Language */
  language?: 'typescript' | 'tsx' | 'javascript' | 'jsx';
  /** Text before cursor on current line */
  prefix?: string;
  /** Trigger character */
  trigger?: string;
  /** Project context */
  projectContext?: ProjectContext;
}

/**
 * Completion item for LSP compatibility
 */
export interface CompletionItem {
  /** Display label */
  label: string;
  /** Item kind */
  kind: CompletionItemKind;
  /** Detail information */
  detail?: string;
  /** Documentation */
  documentation?: string;
  /** Text to insert */
  insertText: string;
  /** Sort order */
  sortText?: string;
  /** Filter text */
  filterText?: string;
  /** Pre-select this item */
  preselect?: boolean;
  /** Additional text edits */
  additionalTextEdits?: Array<{
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    newText: string;
  }>;
}

/**
 * Completion item kinds (LSP-compatible)
 */
export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

/**
 * Autocomplete Engine
 */
export class AutocompleteEngine {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;
  private cache: Map<string, AutocompleteSuggestion[]>;
  private cacheTimeout: number;

  constructor(
    provider: AIProvider,
    options?: Partial<CompletionOptions> & { cacheTimeout?: number }
  ) {
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
  async getSuggestions(context: AutocompleteContext): Promise<AutocompleteSuggestion[]> {
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
  async getComponentProps(
    componentName: string,
    context: AutocompleteContext
  ): Promise<PropInfo[]> {
    // Check if we have component info in context
    const componentInfo = context.projectContext?.components?.find(
      c => c.name === componentName
    );
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

    return extractJSON<PropInfo[]>(response) || [];
  }

  /**
   * Get import suggestions for an identifier
   */
  async getImportSuggestions(
    identifier: string,
    context: AutocompleteContext
  ): Promise<ImportSuggestion[]> {
    // Check available imports first
    const availableImports = context.projectContext?.availableImports || [];
    const matchingImports = availableImports.filter(
      m => m.exports.includes(identifier) || m.name === identifier
    );

    if (matchingImports.length > 0) {
      return matchingImports.map(m => ({
        module: m.path,
        named: m.exports.includes(identifier) ? [identifier] : undefined,
        default: m.hasDefault && m.name === identifier ? identifier : undefined,
      }));
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

    return extractJSON<ImportSuggestion[]>(response) || [];
  }

  /**
   * Get fix suggestions for an error
   */
  async getFixSuggestions(
    error: ErrorInfo,
    context: AutocompleteContext
  ): Promise<FixSuggestion[]> {
    const surroundingCode = this.extractSurroundingCode(
      context.fileContent,
      error.location.line,
      5
    );

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

    return extractJSON<FixSuggestion[]>(response) || [];
  }

  /**
   * Get inline completion (for ghost text)
   */
  async getInlineCompletion(context: AutocompleteContext): Promise<string | null> {
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
  async getSnippetSuggestions(
    trigger: string,
    context: AutocompleteContext
  ): Promise<AutocompleteSuggestion[]> {
    const philjsSnippets = this.getBuiltInSnippets();
    const matchingSnippets = philjsSnippets.filter(
      s => s.label.toLowerCase().includes(trigger.toLowerCase())
    );

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

    const snippet = extractJSON<AutocompleteSuggestion>(response);
    return snippet ? [{ ...snippet, kind: 'snippet' }] : [];
  }

  /**
   * Build the suggestion prompt
   */
  private buildSuggestionPrompt(context: AutocompleteContext): string {
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
  private getSystemPrompt(context: AutocompleteContext): string {
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
  private parseSuggestions(
    response: string,
    context: AutocompleteContext
  ): AutocompleteSuggestion[] {
    const suggestions = extractJSON<AutocompleteSuggestion[]>(response);
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
  private getTextBeforeCursor(context: AutocompleteContext): string {
    const lines = context.fileContent.split('\n');
    const beforeLines = lines.slice(0, context.cursor.line);
    const currentLine = lines[context.cursor.line] || '';
    const beforeCursor = currentLine.slice(0, context.cursor.column);

    return [...beforeLines, beforeCursor].join('\n');
  }

  /**
   * Get text after cursor
   */
  private getTextAfterCursor(context: AutocompleteContext): string {
    const lines = context.fileContent.split('\n');
    const currentLine = lines[context.cursor.line] || '';
    const afterCursor = currentLine.slice(context.cursor.column);
    const afterLines = lines.slice(context.cursor.line + 1);

    return [afterCursor, ...afterLines].join('\n');
  }

  /**
   * Get current line
   */
  private getCurrentLine(context: AutocompleteContext): string {
    const lines = context.fileContent.split('\n');
    return lines[context.cursor.line] || '';
  }

  /**
   * Extract surrounding code
   */
  private extractSurroundingCode(
    content: string,
    line: number,
    radius: number
  ): string {
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
  private extractImports(content: string): string {
    const importLines = content.split('\n').filter(line =>
      line.trim().startsWith('import ')
    );
    return importLines.join('\n') || 'No imports';
  }

  /**
   * Generate cache key for context
   */
  private getCacheKey(context: AutocompleteContext): string {
    return `${context.filePath}:${context.cursor.line}:${context.cursor.column}:${context.prefix || ''}`;
  }

  /**
   * Get built-in PhilJS snippets
   */
  private getBuiltInSnippets(): AutocompleteSuggestion[] {
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
  clearCache(): void {
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
  async getInlineCompletion(
    prefix: string,
    suffix: string,
    options?: {
      maxLength?: number;
      language?: 'typescript' | 'tsx' | 'javascript' | 'jsx';
      stopSequences?: string[];
    }
  ): Promise<InlineCompletionResult | null> {
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
      const lastLine = prefixLines[prefixLines.length - 1];

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
    } catch (error) {
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
  async getSignatureHelp(
    functionName: string,
    context?: AutocompleteContext
  ): Promise<SignatureHelpResult | null> {
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

      return extractJSON<SignatureHelpResult>(response);
    } catch (error) {
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
  async getCompletions(context: CodeContext): Promise<CompletionItem[]> {
    const autocompleteContext: AutocompleteContext = {
      fileContent: context.content,
      cursor: context.position,
      filePath: context.filePath || 'untitled.ts',
      language: context.language || 'typescript',
      prefix: context.prefix,
      triggerCharacter: context.trigger,
      projectContext: context.projectContext,
    };

    const suggestions = await this.getSuggestions(autocompleteContext);

    return suggestions.map((s, i) => ({
      label: s.label,
      kind: this.mapSuggestionKind(s.kind),
      detail: s.detail,
      documentation: s.documentation,
      insertText: s.insertText || s.text,
      sortText: String(i).padStart(4, '0'),
      filterText: s.label,
      preselect: i === 0,
      additionalTextEdits: s.imports?.map(imp => ({
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        newText: this.formatImport(imp),
      })),
    }));
  }

  /**
   * Get built-in PhilJS signature help
   */
  private getBuiltInSignatureHelp(functionName: string): SignatureHelpResult | null {
    const builtInSignatures: Record<string, SignatureHelpResult> = {
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
  private mapSuggestionKind(kind: SuggestionKind): CompletionItemKind {
    const kindMap: Record<SuggestionKind, CompletionItemKind> = {
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
  private formatImport(imp: ImportSuggestion): string {
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
export function createAutocompleteEngine(
  provider: AIProvider,
  options?: Partial<CompletionOptions> & { cacheTimeout?: number }
): AutocompleteEngine {
  return new AutocompleteEngine(provider, options);
}

/**
 * Quick suggestion helper
 */
export async function getSuggestions(
  provider: AIProvider,
  context: AutocompleteContext
): Promise<AutocompleteSuggestion[]> {
  const engine = new AutocompleteEngine(provider);
  return engine.getSuggestions(context);
}

/**
 * Quick fix suggestion helper
 */
export async function getFixSuggestions(
  provider: AIProvider,
  error: ErrorInfo,
  context: AutocompleteContext
): Promise<FixSuggestion[]> {
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
export async function getInlineCompletion(
  provider: AIProvider,
  prefix: string,
  suffix: string
): Promise<InlineCompletionResult | null> {
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
export async function getSignatureHelp(
  provider: AIProvider,
  functionName: string,
  context?: AutocompleteContext
): Promise<SignatureHelpResult | null> {
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
export async function getCompletions(
  provider: AIProvider,
  context: CodeContext
): Promise<CompletionItem[]> {
  const engine = new AutocompleteEngine(provider);
  return engine.getCompletions(context);
}
