/**
 * AI Development Assistant
 *
 * A comprehensive AI-powered development assistant that provides:
 * - Natural language code generation
 * - Context-aware completions
 * - Intelligent refactoring
 * - Automated testing
 * - Documentation generation
 * - Multi-provider support
 */

import type { AIProvider, CompletionOptions } from '../types.js';
import { ComponentGenerator, type ComponentGenerationConfig } from '../codegen/component-generator.js';
import { AutocompleteEngine, type AutocompleteContext } from '../autocomplete/index.js';
import { RefactoringEngine, type RefactoringSuggestion, type RefactoringAnalysisResult } from '../refactor/refactoring-engine.js';
import { DocumentationGenerator } from '../docs/documentation-generator.js';
import { AdvancedTestGenerator, type GeneratedTestSuite } from '../testing/advanced-test-generator.js';
import { extractCode, extractJSON } from '../utils/parser.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Project context for AI assistance
 */
export interface ProjectContext {
  /** Project name */
  name: string;
  /** Project root path */
  rootPath: string;
  /** Files in the project (path -> content) */
  files: Map<string, string>;
  /** Dependencies */
  dependencies: string[];
  /** Project type */
  type: 'philjs' | 'react' | 'vue' | 'svelte' | 'generic';
  /** Framework version */
  version?: string;
  /** TypeScript config */
  tsConfig?: Record<string, unknown>;
}

/**
 * Code generation request
 */
export interface CodeGenRequest {
  /** Natural language description */
  description: string;
  /** Type of code to generate */
  type: 'component' | 'hook' | 'function' | 'test' | 'api' | 'page' | 'utility';
  /** Additional context */
  context?: {
    /** Related files content */
    relatedFiles?: Map<string, string>;
    /** Existing types to use */
    existingTypes?: string;
    /** Style preferences */
    style?: 'functional' | 'class-based';
    /** Include tests */
    includeTests?: boolean;
    /** Include documentation */
    includeDocs?: boolean;
  };
}

/**
 * Code generation result
 */
export interface CodeGenResult {
  /** Generated code */
  code: string;
  /** File name suggestion */
  fileName: string;
  /** Related files (e.g., tests, types) */
  relatedFiles?: Map<string, string>;
  /** Explanation of what was generated */
  explanation: string;
  /** Suggestions for improvement */
  suggestions: string[];
  /** Dependencies needed */
  dependencies?: string[];
}

/**
 * Refactoring request
 */
export interface RefactorRequest {
  /** Code to refactor */
  code: string;
  /** File path */
  filePath?: string;
  /** Specific instruction */
  instruction?: string;
  /** Focus areas */
  focus?: ('performance' | 'readability' | 'accessibility' | 'patterns' | 'signals')[];
  /** Maximum suggestions */
  maxSuggestions?: number;
}

/**
 * AI assistant configuration
 */
export interface AssistantConfig {
  /** AI provider */
  provider: AIProvider;
  /** Project context */
  projectContext?: ProjectContext;
  /** Default completion options */
  defaultOptions?: Partial<CompletionOptions>;
  /** Enable caching */
  enableCache?: boolean;
  /** Debug mode */
  debug?: boolean;
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Chat response
 */
export interface ChatResponse {
  /** Response text */
  message: string;
  /** Generated code if any */
  code?: string;
  /** Actions taken */
  actions?: Array<{
    type: 'generate' | 'refactor' | 'test' | 'document' | 'explain';
    description: string;
    result?: unknown;
  }>;
  /** Suggestions */
  suggestions?: string[];
}

// ============================================================================
// AI Development Assistant
// ============================================================================

/**
 * AI Development Assistant
 *
 * Provides a unified interface for AI-powered development assistance.
 *
 * @example
 * ```typescript
 * const assistant = new AIAssistant({
 *   provider: createOpenAIProvider({ apiKey: 'sk-...' }),
 *   projectContext: {
 *     name: 'my-app',
 *     rootPath: '/path/to/project',
 *     files: new Map(),
 *     dependencies: ['philjs-core'],
 *     type: 'philjs',
 *   },
 * });
 *
 * // Generate code from description
 * const result = await assistant.generateCode({
 *   description: 'Create a user profile card with avatar, name, and bio',
 *   type: 'component',
 * });
 *
 * // Chat with the assistant
 * const response = await assistant.chat('How can I optimize this component for performance?');
 *
 * // Get refactoring suggestions
 * const suggestions = await assistant.refactor({
 *   code: myCode,
 *   focus: ['performance', 'signals'],
 * });
 * ```
 */
export class AIAssistant {
  private provider: AIProvider;
  private projectContext?: ProjectContext;
  private defaultOptions: Partial<CompletionOptions>;
  private enableCache: boolean;
  private debug: boolean;

  // Sub-engines
  private componentGenerator: ComponentGenerator;
  private autocompleteEngine: AutocompleteEngine;
  private refactoringEngine: RefactoringEngine;
  private documentationGenerator: DocumentationGenerator;
  private testGenerator: AdvancedTestGenerator;

  // Conversation history
  private conversationHistory: ConversationMessage[] = [];

  // Cache
  private cache: Map<string, { result: unknown; timestamp: number }> = new Map();
  private cacheMaxAge = 5 * 60 * 1000; // 5 minutes

  constructor(config: AssistantConfig) {
    this.provider = config.provider;
    this.projectContext = config.projectContext;
    this.defaultOptions = {
      temperature: 0.3,
      maxTokens: 4096,
      ...config.defaultOptions,
    };
    this.enableCache = config.enableCache ?? true;
    this.debug = config.debug ?? false;

    // Initialize sub-engines
    this.componentGenerator = new ComponentGenerator(this.provider, this.defaultOptions);
    this.autocompleteEngine = new AutocompleteEngine(this.provider, this.defaultOptions);
    this.refactoringEngine = new RefactoringEngine(this.provider, this.defaultOptions);
    this.documentationGenerator = new DocumentationGenerator(this.provider, this.defaultOptions);
    this.testGenerator = new AdvancedTestGenerator(this.provider, this.defaultOptions);
  }

  // ============================================================================
  // Code Generation
  // ============================================================================

  /**
   * Generate code from natural language description
   */
  async generateCode(request: CodeGenRequest): Promise<CodeGenResult> {
    const cacheKey = `generate:${JSON.stringify(request)}`;

    if (this.enableCache) {
      const cached = this.getFromCache<CodeGenResult>(cacheKey);
      if (cached) return cached;
    }

    const prompt = this.buildCodeGenPrompt(request);

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      maxTokens: 8192,
      systemPrompt: this.getCodeGenSystemPrompt(request.type),
    });

    const result = this.parseCodeGenResponse(response, request);

    if (this.enableCache) {
      this.setInCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Generate a component from description
   */
  async generateComponent(
    description: string,
    options?: ComponentGenerationConfig
  ): Promise<CodeGenResult> {
    return this.generateCode({
      description,
      type: 'component',
      context: {
        includeTests: options?.includeTests,
        includeDocs: true,
      },
    });
  }

  /**
   * Generate a hook/utility from description
   */
  async generateHook(description: string): Promise<CodeGenResult> {
    return this.generateCode({
      description,
      type: 'hook',
    });
  }

  /**
   * Generate tests for code
   */
  async generateTests(
    code: string,
    options?: { framework?: 'vitest' | 'jest'; types?: ('unit' | 'integration' | 'e2e')[] }
  ): Promise<GeneratedTestSuite> {
    return this.testGenerator.generateTestSuite(code, {
      framework: options?.framework || 'vitest',
      types: options?.types || ['unit'],
    });
  }

  // ============================================================================
  // Code Completion
  // ============================================================================

  /**
   * Get context-aware code completions
   */
  async getCompletions(context: AutocompleteContext): Promise<string[]> {
    const suggestions = await this.autocompleteEngine.getSuggestions(context);
    return suggestions.map(s => s.text);
  }

  /**
   * Get inline completion (ghost text)
   */
  async getInlineCompletion(
    prefix: string,
    suffix: string,
    options?: { language?: string }
  ): Promise<string | null> {
    const result = await this.autocompleteEngine.getInlineCompletion(
      prefix,
      suffix,
      { language: options?.language as 'typescript' | 'tsx' | 'javascript' | 'jsx' }
    );
    return result?.text || null;
  }

  // ============================================================================
  // Refactoring
  // ============================================================================

  /**
   * Get refactoring suggestions for code
   */
  async refactor(request: RefactorRequest): Promise<RefactoringSuggestion[]> {
    const result = await this.refactoringEngine.analyze(request.code, {
      projectContext: request.filePath,
    });

    let suggestions = result.suggestions;

    // Filter by focus areas if specified
    if (request.focus && request.focus.length > 0) {
      suggestions = suggestions.filter(s =>
        request.focus!.some(f => s.category.toLowerCase().includes(f))
      );
    }

    // Limit suggestions
    if (request.maxSuggestions) {
      suggestions = suggestions.slice(0, request.maxSuggestions);
    }

    return suggestions;
  }

  /**
   * Apply a refactoring suggestion
   */
  async applyRefactoring(
    code: string,
    suggestion: RefactoringSuggestion
  ): Promise<string> {
    // Apply the refactoring by replacing the before code with after code
    if (suggestion.before && suggestion.after) {
      return code.replace(suggestion.before.code, suggestion.after.code);
    }
    return code;
  }

  /**
   * Auto-refactor code with AI-selected improvements
   */
  async autoRefactor(
    code: string,
    options?: { maxChanges?: number }
  ): Promise<{ code: string; changes: RefactoringSuggestion[] }> {
    const suggestions = await this.refactor({ code, maxSuggestions: options?.maxChanges || 5 });

    let refactoredCode = code;
    const appliedChanges: RefactoringSuggestion[] = [];

    for (const suggestion of suggestions) {
      if (suggestion.impact === 'high' || suggestion.impact === 'medium') {
        try {
          refactoredCode = await this.applyRefactoring(refactoredCode, suggestion);
          appliedChanges.push(suggestion);
        } catch {
          // Skip if refactoring fails
        }
      }
    }

    return { code: refactoredCode, changes: appliedChanges };
  }

  // ============================================================================
  // Documentation
  // ============================================================================

  /**
   * Generate documentation for code
   */
  async generateDocs(
    code: string,
    options?: { style?: 'jsdoc' | 'tsdoc'; includeExamples?: boolean }
  ): Promise<string> {
    const result = await this.documentationGenerator.generateDocs(code, {
      style: options?.style || 'jsdoc',
      includeExamples: options?.includeExamples ?? true,
    });

    return result.documentedCode;
  }

  /**
   * Add JSDoc to undocumented code
   */
  async addJSDoc(code: string): Promise<string> {
    return this.documentationGenerator.addJSDoc(code);
  }

  // ============================================================================
  // Chat Interface
  // ============================================================================

  /**
   * Chat with the AI assistant
   */
  async chat(message: string): Promise<ChatResponse> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Build context from history
    const context = this.buildChatContext();

    const prompt = `${context}

User: ${message}

Respond helpfully. If the user asks for code generation, refactoring, testing, or documentation, provide specific assistance.

If you generate code, wrap it in \`\`\`typescript blocks.
If you take actions, list them in a JSON block like:
\`\`\`json
{
  "actions": [
    { "type": "generate", "description": "Created UserCard component" }
  ],
  "suggestions": ["Consider adding error handling", "Add loading states"]
}
\`\`\`

Respond naturally:`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      maxTokens: 4096,
      systemPrompt: this.getChatSystemPrompt(),
    });

    // Parse response
    const code = extractCode(response);
    const metadata = extractJSON<{ actions?: ChatResponse['actions']; suggestions?: string[] }>(response);

    // Add assistant message to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: { code, ...metadata },
    });

    return {
      message: response.replace(/```[\s\S]*?```/g, '').trim(),
      code: code || undefined,
      actions: metadata?.actions,
      suggestions: metadata?.suggestions,
    };
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  // ============================================================================
  // Code Explanation
  // ============================================================================

  /**
   * Explain code in natural language
   */
  async explainCode(code: string): Promise<string> {
    const prompt = `Explain what this code does in clear, simple terms:

\`\`\`typescript
${code}
\`\`\`

Provide:
1. A high-level summary
2. Key concepts used
3. How data flows through the code
4. Any potential issues or improvements

Be concise but thorough.`;

    return this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are an expert code explainer. Be clear, concise, and accurate.',
    });
  }

  /**
   * Explain an error and suggest fixes
   */
  async explainError(error: string, code?: string): Promise<{
    explanation: string;
    causes: string[];
    solutions: string[];
    fixedCode?: string;
  }> {
    const prompt = `Explain this error and provide solutions:

Error:
\`\`\`
${error}
\`\`\`

${code ? `Code:\n\`\`\`typescript\n${code}\n\`\`\`` : ''}

Return JSON:
{
  "explanation": "Clear explanation of the error",
  "causes": ["Possible cause 1", "Possible cause 2"],
  "solutions": ["Solution 1", "Solution 2"],
  "fixedCode": "// corrected code if applicable"
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a debugging expert. Provide clear explanations and working solutions.',
    });

    return extractJSON<{
      explanation: string;
      causes: string[];
      solutions: string[];
      fixedCode?: string;
    }>(response) || {
      explanation: response,
      causes: [],
      solutions: [],
    };
  }

  // ============================================================================
  // Code Review
  // ============================================================================

  /**
   * Review code and provide feedback
   */
  async reviewCode(code: string, options?: {
    focus?: ('bugs' | 'performance' | 'security' | 'style' | 'accessibility')[];
  }): Promise<{
    score: number;
    issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      line?: number;
      suggestion?: string;
    }>;
    summary: string;
  }> {
    const focusAreas = options?.focus || ['bugs', 'performance', 'style'];

    const prompt = `Review this code focusing on: ${focusAreas.join(', ')}

\`\`\`typescript
${code}
\`\`\`

Return JSON:
{
  "score": 0-100,
  "issues": [
    {
      "type": "bug|performance|security|style|accessibility",
      "severity": "error|warning|info",
      "message": "Issue description",
      "line": 10,
      "suggestion": "How to fix"
    }
  ],
  "summary": "Overall assessment"
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a senior code reviewer. Be thorough but constructive.',
    });

    return extractJSON<{
      score: number;
      issues: Array<{
        type: string;
        severity: 'error' | 'warning' | 'info';
        message: string;
        line?: number;
        suggestion?: string;
      }>;
      summary: string;
    }>(response) || { score: 50, issues: [], summary: 'Could not parse review results' };
  }

  // ============================================================================
  // Project Analysis
  // ============================================================================

  /**
   * Analyze project and suggest improvements
   */
  async analyzeProject(): Promise<{
    health: number;
    suggestions: string[];
    issues: string[];
    architecture: string;
  }> {
    if (!this.projectContext) {
      throw new Error('Project context not set');
    }

    const fileList = Array.from(this.projectContext.files.keys()).slice(0, 50);
    const sampleCode = Array.from(this.projectContext.files.values()).slice(0, 5).join('\n---\n');

    const prompt = `Analyze this ${this.projectContext.type} project:

Project: ${this.projectContext.name}
Files: ${fileList.join(', ')}
Dependencies: ${this.projectContext.dependencies.join(', ')}

Sample code:
${sampleCode.slice(0, 3000)}

Provide:
{
  "health": 0-100,
  "suggestions": ["Improvement 1", "Improvement 2"],
  "issues": ["Issue 1", "Issue 2"],
  "architecture": "Brief architecture description"
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      maxTokens: 2048,
      systemPrompt: 'You are a project architect. Provide actionable analysis.',
    });

    return extractJSON<{
      health: number;
      suggestions: string[];
      issues: string[];
      architecture: string;
    }>(response) || {
      health: 50,
      suggestions: [],
      issues: [],
      architecture: 'Could not analyze project',
    };
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Set project context
   */
  setProjectContext(context: ProjectContext): void {
    this.projectContext = context;
  }

  /**
   * Get project context
   */
  getProjectContext(): ProjectContext | undefined {
    return this.projectContext;
  }

  /**
   * Switch AI provider
   */
  setProvider(provider: AIProvider): void {
    this.provider = provider;
    // Re-initialize sub-engines
    this.componentGenerator = new ComponentGenerator(this.provider, this.defaultOptions);
    this.autocompleteEngine = new AutocompleteEngine(this.provider, this.defaultOptions);
    this.refactoringEngine = new RefactoringEngine(this.provider, this.defaultOptions);
    this.documentationGenerator = new DocumentationGenerator(this.provider, this.defaultOptions);
    this.testGenerator = new AdvancedTestGenerator(this.provider, this.defaultOptions);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private buildCodeGenPrompt(request: CodeGenRequest): string {
    let prompt = `Generate ${request.type} based on this description:\n\n${request.description}\n\n`;

    if (request.context?.relatedFiles) {
      prompt += 'Related files:\n';
      for (const [path, content] of request.context.relatedFiles) {
        prompt += `\n--- ${path} ---\n${content.slice(0, 1000)}\n`;
      }
    }

    if (request.context?.existingTypes) {
      prompt += `\nExisting types:\n${request.context.existingTypes}\n`;
    }

    if (this.projectContext) {
      prompt += `\nProject type: ${this.projectContext.type}`;
      prompt += `\nDependencies: ${this.projectContext.dependencies.slice(0, 10).join(', ')}`;
    }

    prompt += `\n\nReturn:
1. Complete, working code
2. Suggested file name
3. Brief explanation
4. Any additional files needed (tests, types)

Format:
\`\`\`json
{
  "code": "// code here",
  "fileName": "ComponentName.tsx",
  "explanation": "What was created",
  "relatedFiles": { "ComponentName.test.ts": "// test code" },
  "suggestions": ["Add error handling"],
  "dependencies": ["zod"]
}
\`\`\``;

    return prompt;
  }

  private getCodeGenSystemPrompt(type: string): string {
    const basePrompt = `You are an expert ${this.projectContext?.type || 'TypeScript'} developer.
Generate production-quality ${type} code.
Use modern patterns and best practices.
Include proper TypeScript types.`;

    if (this.projectContext?.type === 'philjs') {
      return `${basePrompt}

PhilJS-specific guidelines:
- Use signal() for reactive state
- Use memo() for computed values
- Use effect() for side effects
- Components are functions returning JSX
- Prefer fine-grained reactivity
- Avoid unnecessary re-renders`;
    }

    return basePrompt;
  }

  private parseCodeGenResponse(response: string, request: CodeGenRequest): CodeGenResult {
    const parsed = extractJSON<{
      code: string;
      fileName: string;
      explanation: string;
      relatedFiles?: Record<string, string>;
      suggestions?: string[];
      dependencies?: string[];
    }>(response);

    if (parsed) {
      return {
        code: parsed.code,
        fileName: parsed.fileName,
        explanation: parsed.explanation,
        relatedFiles: parsed.relatedFiles ? new Map(Object.entries(parsed.relatedFiles)) : undefined,
        suggestions: parsed.suggestions || [],
        dependencies: parsed.dependencies,
      };
    }

    // Fallback: extract code from response
    const code = extractCode(response) || '';
    const typeSuffix: Record<string, string> = {
      component: '.tsx',
      hook: '.ts',
      function: '.ts',
      test: '.test.ts',
      api: '.ts',
      page: '.tsx',
      utility: '.ts',
    };

    return {
      code,
      fileName: `Generated${typeSuffix[request.type] || '.ts'}`,
      explanation: 'Generated code based on description',
      suggestions: [],
    };
  }

  private buildChatContext(): string {
    const recentHistory = this.conversationHistory.slice(-10);
    let context = '';

    for (const msg of recentHistory) {
      context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
    }

    if (this.projectContext) {
      context = `Project: ${this.projectContext.name} (${this.projectContext.type})\n\n${context}`;
    }

    return context;
  }

  private getChatSystemPrompt(): string {
    return `You are PhilJS AI Assistant, an expert developer companion.

You help with:
- Code generation and completion
- Refactoring and optimization
- Testing and documentation
- Debugging and error explanation
- Architecture and best practices

Be helpful, concise, and accurate. When generating code, ensure it's production-ready.
${this.projectContext?.type === 'philjs' ? 'Focus on PhilJS patterns: signals, memo, effect.' : ''}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.result as T;
  }

  private setInCache(key: string, value: unknown): void {
    this.cache.set(key, { result: value, timestamp: Date.now() });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an AI assistant instance
 */
export function createAIAssistant(config: AssistantConfig): AIAssistant {
  return new AIAssistant(config);
}

/**
 * Create an AI assistant with auto-detected provider
 */
export function createAutoAssistant(
  projectContext?: ProjectContext
): AIAssistant {
  const { autoDetectProvider } = require('../providers/index.js');
  return new AIAssistant({
    provider: autoDetectProvider(),
    projectContext,
  });
}
