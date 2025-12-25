/**
 * Natural Language Code Generation Engine
 *
 * Generates PhilJS components, functions, and code from natural language descriptions.
 * Provides intelligent parsing of user intent and context-aware code generation.
 */

import type { AIProvider, CompletionOptions } from '../types.js';
import { extractCode, extractJSON, validateCode } from '../utils/parser.js';
import { SYSTEM_PROMPTS } from '../utils/prompts.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Intent types recognized by the generator
 */
export type GenerationIntent =
  | 'component'
  | 'function'
  | 'hook'
  | 'utility'
  | 'type'
  | 'page'
  | 'layout'
  | 'api-route'
  | 'form'
  | 'list'
  | 'table'
  | 'modal'
  | 'unknown';

/**
 * Parsed intent from natural language
 */
export interface ParsedIntent {
  /** Primary intent type */
  type: GenerationIntent;
  /** Confidence score 0-1 */
  confidence: number;
  /** Extracted entities/features */
  entities: IntentEntity[];
  /** Detected requirements */
  requirements: string[];
  /** Suggested name */
  suggestedName?: string;
  /** Detected props/parameters */
  parameters?: ParameterIntent[];
  /** Detected state variables */
  stateVariables?: StateIntent[];
  /** Detected styling requirements */
  styling?: StylingIntent;
  /** Detected accessibility requirements */
  accessibility?: string[];
}

/**
 * Entity extracted from intent
 */
export interface IntentEntity {
  /** Entity type */
  type: 'component' | 'action' | 'data' | 'style' | 'feature' | 'constraint';
  /** Entity value */
  value: string;
  /** Original text span */
  span?: string;
}

/**
 * Parameter intent
 */
export interface ParameterIntent {
  /** Parameter name */
  name: string;
  /** Inferred type */
  type: string;
  /** Is required */
  required: boolean;
  /** Description */
  description?: string;
}

/**
 * State intent
 */
export interface StateIntent {
  /** State name */
  name: string;
  /** Inferred type */
  type: string;
  /** Initial value */
  initialValue?: string;
  /** Is derived/computed */
  isDerived: boolean;
}

/**
 * Styling intent
 */
export interface StylingIntent {
  /** Preferred approach */
  approach: 'tailwind' | 'css-modules' | 'styled-components' | 'inline' | 'none';
  /** Detected styles */
  styles?: string[];
  /** Color scheme */
  colorScheme?: 'light' | 'dark' | 'both';
  /** Responsive requirements */
  responsive?: boolean;
}

/**
 * Natural language generation options
 */
export interface NLGenerationOptions extends Partial<CompletionOptions> {
  /** Prefer certain patterns */
  preferPatterns?: ('signals' | 'hooks' | 'functional')[];
  /** Include TypeScript types */
  includeTypes?: boolean;
  /** Include JSDoc comments */
  includeJSDoc?: boolean;
  /** Include tests */
  includeTests?: boolean;
  /** Styling approach */
  styleApproach?: 'tailwind' | 'css-modules' | 'styled-components' | 'inline' | 'none';
  /** Existing code context for better generation */
  codeContext?: string;
  /** Project-specific imports available */
  availableImports?: string[];
}

/**
 * Generated code result
 */
export interface NLGeneratedCode {
  /** Generated code */
  code: string;
  /** Parsed intent */
  intent: ParsedIntent;
  /** Explanation of generated code */
  explanation: string;
  /** Required imports */
  imports: string[];
  /** Generated tests if requested */
  tests?: string;
  /** Usage examples */
  examples: string[];
  /** Suggestions for improvements */
  suggestions: string[];
  /** Validation result */
  validation: { valid: boolean; errors: string[] };
}

/**
 * Conversation context for multi-turn generation
 */
export interface ConversationContext {
  /** Previous messages */
  messages: ConversationMessage[];
  /** Generated artifacts */
  artifacts: GeneratedArtifact[];
  /** Current working code */
  workingCode?: string;
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  /** Role */
  role: 'user' | 'assistant';
  /** Content */
  content: string;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Generated artifact
 */
export interface GeneratedArtifact {
  /** Artifact type */
  type: 'component' | 'function' | 'type' | 'test' | 'style';
  /** Artifact name */
  name: string;
  /** Artifact code */
  code: string;
  /** Version number */
  version: number;
}

// ============================================================================
// Natural Language Generator
// ============================================================================

/**
 * Natural Language Code Generator
 *
 * Converts natural language descriptions into PhilJS code.
 *
 * @example
 * ```typescript
 * const generator = new NaturalLanguageGenerator(provider);
 *
 * // Generate a component from description
 * const result = await generator.generate(
 *   'Create a todo list component with add, remove, and toggle functionality'
 * );
 * console.log(result.code);
 *
 * // Parse intent first for more control
 * const intent = await generator.parseIntent(
 *   'A button that shows a loading spinner when clicked'
 * );
 * console.log(intent.type); // 'component'
 * console.log(intent.entities); // [{ type: 'feature', value: 'loading spinner' }]
 * ```
 */
export class NaturalLanguageGenerator {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;
  private conversationContext?: ConversationContext;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
    this.provider = provider;
    this.defaultOptions = {
      temperature: 0.3,
      maxTokens: 4096,
      ...options,
    };
  }

  /**
   * Generate code from natural language description
   *
   * @param description - Natural language description
   * @param options - Generation options
   * @returns Generated code with metadata
   */
  async generate(
    description: string,
    options?: NLGenerationOptions
  ): Promise<NLGeneratedCode> {
    // First, parse the intent
    const intent = await this.parseIntent(description);

    // Build the generation prompt based on intent
    const prompt = this.buildGenerationPrompt(description, intent, options);

    // Generate the code
    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      systemPrompt: this.getSystemPrompt(intent, options),
    });

    // Parse the response
    const code = extractCode(response) || '';
    const validation = validateCode(code);

    // Extract additional information
    const imports = this.extractImports(code);
    const examples = this.extractExamples(response);
    const explanation = this.extractExplanation(response, description);

    // Generate tests if requested
    let tests: string | undefined;
    if (options?.includeTests) {
      tests = await this.generateTests(code, intent);
    }

    // Generate suggestions
    const suggestions = await this.generateSuggestions(code, intent);

    // Update conversation context if exists
    if (this.conversationContext) {
      this.updateConversationContext(description, code, intent);
    }

    return {
      code,
      intent,
      explanation,
      imports,
      tests,
      examples,
      suggestions,
      validation,
    };
  }

  /**
   * Parse natural language to extract intent and entities
   *
   * @param description - Natural language description
   * @returns Parsed intent
   */
  async parseIntent(description: string): Promise<ParsedIntent> {
    const prompt = `Analyze this code generation request and extract the intent:

"${description}"

Identify:
1. Primary intent type: component, function, hook, utility, type, page, layout, api-route, form, list, table, modal, or unknown
2. Confidence score (0-1)
3. Entities mentioned (components, actions, data, styles, features, constraints)
4. Requirements and features
5. Suggested name (PascalCase for components, camelCase for functions)
6. Props/parameters needed (with types)
7. State variables needed (with types and if derived)
8. Styling requirements
9. Accessibility requirements

Return JSON:
{
  "type": "component",
  "confidence": 0.95,
  "entities": [
    { "type": "feature", "value": "loading state", "span": "loading spinner" }
  ],
  "requirements": ["clickable", "shows spinner when loading"],
  "suggestedName": "LoadingButton",
  "parameters": [
    { "name": "onClick", "type": "() => Promise<void>", "required": true, "description": "Click handler" }
  ],
  "stateVariables": [
    { "name": "isLoading", "type": "boolean", "initialValue": "false", "isDerived": false }
  ],
  "styling": {
    "approach": "tailwind",
    "styles": ["button", "spinner"],
    "responsive": false
  },
  "accessibility": ["aria-busy when loading", "disabled state"]
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      temperature: 0.1,
      systemPrompt: 'You are an expert at understanding code generation requests. Extract intent accurately.',
    });

    const result = extractJSON<ParsedIntent>(response);

    if (result) {
      return result;
    }

    // Fallback: basic intent detection
    return this.fallbackIntentParsing(description);
  }

  /**
   * Refine generation with additional instructions
   *
   * @param previousResult - Previous generation result
   * @param refinement - Refinement instructions
   * @param options - Generation options
   * @returns Refined code
   */
  async refine(
    previousResult: NLGeneratedCode,
    refinement: string,
    options?: NLGenerationOptions
  ): Promise<NLGeneratedCode> {
    const prompt = `Refine the following code based on the instruction:

Original code:
\`\`\`typescript
${previousResult.code}
\`\`\`

Refinement: ${refinement}

Apply the refinement while maintaining:
- Existing functionality
- Code style and patterns
- Type safety
- PhilJS best practices

Return the refined code.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      systemPrompt: this.getSystemPrompt(previousResult.intent, options),
    });

    const code = extractCode(response) || previousResult.code;
    const validation = validateCode(code);

    return {
      ...previousResult,
      code,
      explanation: `Refined: ${refinement}`,
      validation,
    };
  }

  /**
   * Start a conversation for iterative generation
   *
   * @param initialDescription - Initial description
   * @param options - Generation options
   * @returns Initial result with conversation context
   */
  async startConversation(
    initialDescription: string,
    options?: NLGenerationOptions
  ): Promise<{ result: NLGeneratedCode; contextId: string }> {
    // Initialize conversation context
    this.conversationContext = {
      messages: [],
      artifacts: [],
    };

    const result = await this.generate(initialDescription, options);

    return {
      result,
      contextId: this.generateContextId(),
    };
  }

  /**
   * Continue conversation with follow-up
   *
   * @param followUp - Follow-up message
   * @param options - Generation options
   * @returns Updated result
   */
  async continueConversation(
    followUp: string,
    options?: NLGenerationOptions
  ): Promise<NLGeneratedCode> {
    if (!this.conversationContext) {
      throw new Error('No active conversation. Call startConversation first.');
    }

    const contextPrompt = this.buildConversationPrompt(followUp);

    const response = await this.provider.generateCompletion(contextPrompt, {
      ...this.defaultOptions,
      ...options,
      systemPrompt: this.getConversationSystemPrompt(),
    });

    const code = extractCode(response) || this.conversationContext.workingCode || '';
    const intent = await this.parseIntent(followUp);
    const validation = validateCode(code);

    this.updateConversationContext(followUp, code, intent);

    return {
      code,
      intent,
      explanation: this.extractExplanation(response, followUp),
      imports: this.extractImports(code),
      examples: [],
      suggestions: [],
      validation,
    };
  }

  /**
   * End the conversation and return all artifacts
   */
  endConversation(): GeneratedArtifact[] {
    const artifacts = this.conversationContext?.artifacts || [];
    this.conversationContext = undefined;
    return artifacts;
  }

  /**
   * Generate component variants
   *
   * @param description - Base component description
   * @param variants - Variant names/descriptions
   * @param options - Generation options
   * @returns Map of variant name to generated code
   */
  async generateVariants(
    description: string,
    variants: string[],
    options?: NLGenerationOptions
  ): Promise<Map<string, NLGeneratedCode>> {
    const results = new Map<string, NLGeneratedCode>();

    // Generate base component
    const baseResult = await this.generate(description, options);
    results.set('base', baseResult);

    // Generate each variant
    for (const variant of variants) {
      const variantPrompt = `${description}. Variant: ${variant}`;
      const variantResult = await this.generate(variantPrompt, {
        ...options,
        codeContext: baseResult.code,
      });
      results.set(variant, variantResult);
    }

    return results;
  }

  /**
   * Generate from example
   *
   * @param example - Example code to learn from
   * @param description - What to generate based on the example
   * @param options - Generation options
   * @returns Generated code following the example pattern
   */
  async generateFromExample(
    example: string,
    description: string,
    options?: NLGenerationOptions
  ): Promise<NLGeneratedCode> {
    const prompt = `Learn from this example code pattern:

Example:
\`\`\`typescript
${example}
\`\`\`

Now generate similar code for: ${description}

Follow the same:
- Code structure and patterns
- Naming conventions
- TypeScript patterns
- Component structure
- Signal usage patterns

Return the new code that follows the example pattern.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      systemPrompt: this.getSystemPrompt(await this.parseIntent(description), options),
    });

    const code = extractCode(response) || '';
    const intent = await this.parseIntent(description);
    const validation = validateCode(code);

    return {
      code,
      intent,
      explanation: 'Generated following example pattern',
      imports: this.extractImports(code),
      examples: [],
      suggestions: [],
      validation,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildGenerationPrompt(
    description: string,
    intent: ParsedIntent,
    options?: NLGenerationOptions
  ): string {
    const typeInstructions = this.getTypeInstructions(intent.type);
    const propsSection = intent.parameters?.length
      ? `\nProps/Parameters:\n${intent.parameters.map(p => `- ${p.name}: ${p.type}${p.required ? ' (required)' : ''}`).join('\n')}`
      : '';
    const stateSection = intent.stateVariables?.length
      ? `\nState variables:\n${intent.stateVariables.map(s => `- ${s.name}: ${s.type}${s.isDerived ? ' (derived)' : ''}`).join('\n')}`
      : '';

    return `Generate ${intent.type} based on this description:

"${description}"
${propsSection}
${stateSection}

${typeInstructions}

Requirements:
${intent.requirements.map(r => `- ${r}`).join('\n') || '- Follow the description'}

${intent.accessibility?.length ? `Accessibility:\n${intent.accessibility.map(a => `- ${a}`).join('\n')}` : ''}

Options:
- Include types: ${options?.includeTypes !== false}
- Include JSDoc: ${options?.includeJSDoc !== false}
- Styling: ${options?.styleApproach || intent.styling?.approach || 'none'}

${options?.codeContext ? `\nExisting code context:\n\`\`\`typescript\n${options.codeContext.slice(0, 1000)}\n\`\`\`` : ''}

Suggested name: ${intent.suggestedName || 'Generated' + intent.type}

Return the complete code in a TypeScript code block, followed by:
1. Brief explanation
2. Usage example`;
  }

  private getTypeInstructions(type: GenerationIntent): string {
    const instructions: Record<GenerationIntent, string> = {
      component: `Generate a PhilJS functional component:
- Use signal() for reactive state
- Use memo() for computed values
- Use effect() for side effects
- Export as named export
- Include proper prop types`,

      function: `Generate a TypeScript function:
- Include proper types
- Handle errors gracefully
- Export the function
- Add JSDoc documentation`,

      hook: `Generate a custom hook:
- Start with "use" prefix
- Return reactive values using signals
- Handle cleanup in effects
- Type the return value`,

      utility: `Generate a utility function:
- Make it pure when possible
- Handle edge cases
- Include type guards if needed
- Add comprehensive JSDoc`,

      type: `Generate TypeScript type definitions:
- Use interfaces for object shapes
- Use type aliases for unions/intersections
- Export all types
- Add documentation comments`,

      page: `Generate a PhilJS page component:
- Include loader function if data is needed
- Include meta function for SEO
- Handle loading/error states
- Export as default`,

      layout: `Generate a PhilJS layout component:
- Accept children prop
- Include navigation if appropriate
- Handle responsive design
- Export as default`,

      'api-route': `Generate an API route handler:
- Handle different HTTP methods
- Validate input
- Return proper responses
- Handle errors`,

      form: `Generate a form component:
- Use signals for form state
- Include validation
- Handle submission
- Show loading/error states
- Ensure accessibility`,

      list: `Generate a list component:
- Accept items array prop
- Handle empty state
- Include key prop for items
- Support filtering/sorting if mentioned`,

      table: `Generate a table component:
- Accept data array prop
- Include column definitions
- Handle sorting if mentioned
- Ensure accessibility`,

      modal: `Generate a modal component:
- Accept open/onClose props
- Handle keyboard events (Escape)
- Trap focus when open
- Include backdrop
- Ensure accessibility`,

      unknown: `Generate code based on the description:
- Follow PhilJS patterns
- Include proper types
- Make it reusable`,
    };

    return instructions[type] || instructions.unknown;
  }

  private getSystemPrompt(intent: ParsedIntent, options?: NLGenerationOptions): string {
    return `${SYSTEM_PROMPTS.philjs}
${SYSTEM_PROMPTS.typescript}

You are generating a ${intent.type}.
${options?.preferPatterns?.includes('signals') ? 'Always use PhilJS signals for reactive state.' : ''}
${options?.styleApproach === 'tailwind' ? 'Use Tailwind CSS classes for styling.' : ''}

Generate clean, production-ready code.
Follow accessibility best practices.
Include proper error handling.`;
  }

  private getConversationSystemPrompt(): string {
    return `${SYSTEM_PROMPTS.philjs}

You are in a conversation about code generation.
Consider the full conversation history.
Build upon previously generated code.
Apply requested changes incrementally.`;
  }

  private buildConversationPrompt(followUp: string): string {
    if (!this.conversationContext) {
      return followUp;
    }

    const history = this.conversationContext.messages
      .slice(-6) // Last 6 messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    const currentCode = this.conversationContext.workingCode || '';

    return `Conversation history:
${history}

Current code:
\`\`\`typescript
${currentCode}
\`\`\`

New request: ${followUp}

Apply the request to the current code and return the updated version.`;
  }

  private updateConversationContext(
    message: string,
    code: string,
    intent: ParsedIntent
  ): void {
    if (!this.conversationContext) return;

    // Add user message
    this.conversationContext.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Add assistant response
    this.conversationContext.messages.push({
      role: 'assistant',
      content: `Generated ${intent.type}: ${intent.suggestedName || 'Code'}`,
      timestamp: new Date(),
    });

    // Update working code
    this.conversationContext.workingCode = code;

    // Add artifact
    const existingArtifact = this.conversationContext.artifacts.find(
      a => a.name === intent.suggestedName
    );

    if (existingArtifact) {
      existingArtifact.code = code;
      existingArtifact.version++;
    } else {
      this.conversationContext.artifacts.push({
        type: intent.type === 'function' || intent.type === 'utility' ? 'function' :
              intent.type === 'type' ? 'type' : 'component',
        name: intent.suggestedName || 'Generated',
        code,
        version: 1,
      });
    }
  }

  private fallbackIntentParsing(description: string): ParsedIntent {
    const lower = description.toLowerCase();

    // Detect type
    let type: GenerationIntent = 'unknown';
    let confidence = 0.5;

    if (lower.includes('component') || lower.includes('button') ||
        lower.includes('form') || lower.includes('card')) {
      type = 'component';
      confidence = 0.8;
    } else if (lower.includes('function') || lower.includes('calculate') ||
               lower.includes('convert')) {
      type = 'function';
      confidence = 0.7;
    } else if (lower.includes('hook') || lower.includes('use')) {
      type = 'hook';
      confidence = 0.7;
    } else if (lower.includes('page') || lower.includes('route')) {
      type = 'page';
      confidence = 0.7;
    } else if (lower.includes('type') || lower.includes('interface')) {
      type = 'type';
      confidence = 0.7;
    } else if (lower.includes('form')) {
      type = 'form';
      confidence = 0.8;
    } else if (lower.includes('list')) {
      type = 'list';
      confidence = 0.7;
    } else if (lower.includes('table')) {
      type = 'table';
      confidence = 0.7;
    } else if (lower.includes('modal') || lower.includes('dialog')) {
      type = 'modal';
      confidence = 0.8;
    }

    // Extract suggested name
    const words = description.split(/\s+/).filter(w => w.length > 2);
    const nameWords = words
      .filter(w => !['the', 'a', 'an', 'with', 'that', 'for', 'and', 'or', 'create', 'make', 'build'].includes(w.toLowerCase()))
      .slice(0, 2);
    const suggestedName = nameWords
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');

    return {
      type,
      confidence,
      entities: [],
      requirements: [description],
      suggestedName: suggestedName || undefined,
    };
  }

  private extractImports(code: string): string[] {
    const imports: string[] = [];
    const regex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = regex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractExamples(response: string): string[] {
    const examples: string[] = [];
    const parts = response.split(/(?:example|usage)[s]?[:\s]*/i);

    if (parts.length > 1) {
      const exampleSection = parts[1];
      const codeBlocks = exampleSection.match(/```[\s\S]*?```/g);
      if (codeBlocks) {
        examples.push(...codeBlocks.map(b =>
          b.replace(/```\w*\n?/g, '').replace(/```$/g, '').trim()
        ));
      }
    }

    return examples;
  }

  private extractExplanation(response: string, description: string): string {
    // Try to find explanation section
    const parts = response.split('```');
    const textParts = parts.filter((_, i) => i % 2 === 0);

    for (const part of textParts) {
      const trimmed = part.trim();
      if (trimmed.length > 20 && !trimmed.startsWith('{')) {
        return trimmed.split('\n')[0];
      }
    }

    return `Generated code for: ${description.slice(0, 100)}`;
  }

  private async generateTests(code: string, intent: ParsedIntent): Promise<string> {
    const prompt = `Generate vitest tests for this ${intent.type}:

\`\`\`typescript
${code}
\`\`\`

Include:
- Basic functionality tests
- Edge case tests
- Error handling tests

Return only the test code.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: SYSTEM_PROMPTS.testing,
    });

    return extractCode(response) || '';
  }

  private async generateSuggestions(code: string, intent: ParsedIntent): Promise<string[]> {
    const prompt = `Briefly suggest 2-3 improvements for this ${intent.type}:

\`\`\`typescript
${code}
\`\`\`

Return only a JSON array of short suggestion strings.`;

    const response = await this.provider.generateCompletion(prompt, {
      temperature: 0.3,
      maxTokens: 256,
    });

    return extractJSON<string[]>(response) || [];
  }

  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a natural language generator instance
 */
export function createNaturalLanguageGenerator(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): NaturalLanguageGenerator {
  return new NaturalLanguageGenerator(provider, options);
}

/**
 * Quick generation helper
 */
export async function generateFromNaturalLanguage(
  provider: AIProvider,
  description: string,
  options?: NLGenerationOptions
): Promise<NLGeneratedCode> {
  const generator = new NaturalLanguageGenerator(provider);
  return generator.generate(description, options);
}

/**
 * Quick intent parsing helper
 */
export async function parseCodeIntent(
  provider: AIProvider,
  description: string
): Promise<ParsedIntent> {
  const generator = new NaturalLanguageGenerator(provider);
  return generator.parseIntent(description);
}
