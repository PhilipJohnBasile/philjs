/**
 * @philjs/ai
 *
 * AI utilities for PhilJS - code generation, analysis, assistants, and ML integration
 */

// Core types
export * from './types.js';

// AI Providers
export * from './providers/index.js';

// Code generation
export * from './codegen.js';

// Code analysis
export * from './analysis.js';

// AI Assistants (exclude: AccessibilityIssue - from analysis.js)
export {
  AIAssistant, CodeReviewer, CodingAgent,
  createAIAssistant, createAutoAssistant, createCodeReviewer, createCodingAgent, executeTask,
  type AgentResult, type AgentStep, type AgentTask, type AssistantConfig,
  type ChatResponse, type CodeGenRequest, type CodeGenResult, type CodeMetrics,
  type CodingAgentConfig, type ConversationMessage, type CustomRule,
  type FileReview, type LineComment, type PRReviewResult, type PerformanceCategory,
  type PerformanceNote, type ProjectContext, type RefactorRequest, type ReviewConfig,
  type ReviewFocus, type ReviewIssue, type ReviewResult, type ReviewSeverity,
  type ReviewSuggestion, type ReviewSummary, type SecurityCategory,
  type SecurityFinding, type StepResult, type TaskConstraints, type TaskContext,
} from './assistant/index.js';

// Autocomplete (exclude: ProjectContext - from assistant)
export {
  AutocompleteEngine, CompletionItemKind,
  createAutocompleteEngine, getSuggestions, getFixSuggestions,
  getInlineCompletion, getSignatureHelp, getCompletions,
  type AutocompleteContext, type ModuleInfo, type ComponentInfo, type PropInfo,
  type TypeInfo, type UtilityInfo, type AutocompleteSuggestion, type SuggestionKind,
  type ImportSuggestion, type TextEdit, type ErrorInfo, type FixSuggestion,
  type InlineCompletionResult, type SignatureHelpResult, type SignatureInfo,
  type ParameterInfo, type CodeContext, type CompletionItem,
} from './autocomplete/index.js';

// Documentation generation (exclude: GeneratedDocumentation - from types.js)
export {
  DocGenerator, addJSDoc, createDocGenerator, generateDocs, generateReadme,
  type APIDocConfig, type APIReference, type BadgeConfig, type DocGenerationConfig,
  type DocStyle, type ExportDoc, type GeneratedAPIDoc,
  type GeneratedReadme, type ModuleDoc, type ParameterDoc, type ReadmeConfig,
  type ReadmeSection,
} from './docs/index.js';

// Type inference
export * from './inference/index.js';

// LSP integration (exclude: CompletionItem, TextEdit - from autocomplete; CompletionOptions - from types.js)
export {
  CODE_ACTION_KINDS, DiagnosticSeverity, DiagnosticTag, DocumentStore,
  InlineCompletionTriggerKind, LSPHandlers, PhilJSLanguageServer,
  TextDocumentSyncKind, createLSPHandlers, createLanguageServer,
  getDefaultCapabilities, getInitializeResult, hasCapability, startStdioServer,
  type ClientCapabilities, type CodeAction, type CodeActionOptions,
  type CodeActionParams, type CodeLensOptions, type CompletionList,
  type CompletionParams, type Diagnostic, type DiagnosticOptions,
  type ExperimentalCapabilities, type FileOperationFilter, type FileOperationPattern,
  type Hover, type InitializeResult, type InlineCompletionItem,
  type InlineCompletionList, type InlineCompletionOptions, type InlineCompletionParams,
  type LSPMessage, type LSPNotification, type LSPRequest, type LSPResponse,
  type MessageHandler, type NotificationHandler, type Position, type Range,
  type RenameOptions, type SaveOptions, type ServerCapabilities,
  type ServerConfig, type ServerState, type SignatureHelp,
  type SignatureHelpOptions, type SignatureHelpParams,
  type TextDocumentIdentifier, type TextDocumentPositionParams,
  type TextDocumentSyncOptions, type WorkspaceCapabilities, type WorkspaceEdit,
} from './lsp/index.js';

// Refactoring (exclude: AccessibilityIssue - from analysis; RefactorResult, refactorCode - from codegen)
export {
  RefactoringEngine, analyzePerformance,
  auditAccessibility, createRefactoringEngine,
  type AccessibilityAudit, type AccessibilityFix,
  type BestPracticeImprovement, type BestPracticeViolation, type BestPracticesResult,
  type PerformanceAnalysis, type PerformanceIssue, type PerformanceOptimization,
  type RefactorConfig, type RefactorFocusArea,
} from './refactor/index.js';

// Schema utilities
export * from './schema/index.js';

// Suggestions
export * from './suggestions/index.js';

// Testing utilities (exclude: TestCase, generateTests - from codegen; GeneratedTests - from types)
export {
  TestGenerator, createTestGenerator,
  generateE2ETests, generateUnitTests,
  type CoverageAnalysis, type CoverageTarget, type E2EScenario,
  type E2ETestConfig, type E2ETestScenario,
  type GeneratedE2ETests,
  type MissingCoverage, type RiskArea, type SuggestedTest,
  type TestFramework, type TestGenerationConfig, type TestType,
} from './testing/index.js';

// Predictive navigation
export * from './predictive/navigation-predictor.js';

// RAG (Retrieval Augmented Generation)
export * from './rag.js';

// Structured outputs
export * from './structured.js';

// AI Tools (exclude: AgentStep - from assistant)
export {
  Agent, ToolExecutor,
  calculatorTool, codeExecutionTool, createAgent, createTool,
  fileReadTool, tool, weatherTool, webSearchTool,
  type AgentConfig, type ParameterDef, type ToolBuilder,
} from './tools.js';

// Caching
export * from './cache.js';

// Observability
export * from './observability.js';

// CLI
export * from './cli/index.js';

// Provider integrations
export * from './langfuse.js';
export * from './helicone.js';
export * from './haystack.js';
export * from './mastra.js';
// Workers AI (exclude: ChatResponse - from assistant)
export {
  chat, classifyImage, cosineSimilarity, createWorkersAI,
  embed, findSimilar, formatMessages, generateImage,
  models, runModel, speechToText, textToSpeech, translate, useWorkersAI,
  type Ai, type ChatMessage, type ChatOptions,
  type EmbeddingOptions, type EmbeddingResponse,
  type ImageClassificationOptions, type ImageGenerationOptions,
  type SpeechToTextOptions, type TextToSpeechOptions,
  type TranslationOptions, type WorkersAIConfig,
} from './workers-ai.js';
export * from './copilot.js';

// VSCode extension
export * from './vscode/extension.js';

// ---------------------------------------------------------------------------
// Lightweight AI client, prompt specs, and simple providers
// ---------------------------------------------------------------------------

/**
 * A minimal provider interface used by createAI / providers helpers.
 */
export interface SimpleAIProvider {
  name: string;
  generate(prompt: string, options?: Record<string, unknown>): Promise<string>;
}

/**
 * Prompt specification – a declarative description of an AI prompt.
 */
export interface PromptSpec {
  name: string;
  system?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  policy?: { pii?: 'block' | 'redact' | 'audit' };
}

/**
 * Create a type-safe prompt specification.
 */
export function createPrompt(spec: PromptSpec): PromptSpec {
  return spec;
}

/**
 * Built-in simple providers for quick prototyping and testing.
 */
export const providers = {
  /**
   * Echo provider – returns the input prefixed with "Echo: ".
   * Useful for testing without a real AI backend.
   */
  echo(): SimpleAIProvider {
    return {
      name: 'echo',
      async generate(prompt: string) {
        return `Echo: ${prompt}`;
      },
    };
  },

  /**
   * HTTP provider – sends a POST request to the given URL and returns
   * the `text` field from the JSON response.
   */
  http(url: string): SimpleAIProvider {
    return {
      name: 'http',
      async generate(prompt: string, options?: Record<string, unknown>) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prompt, ...options }),
        });
        const json = await res.json() as { text: string };
        return json.text;
      },
    };
  },
};

/**
 * Result returned by `ai.generate()`.
 */
export interface AIResult {
  text: string;
}

/**
 * Lightweight AI client created by `createAI`.
 */
export interface AIClient {
  generate(spec: PromptSpec, input: unknown, options?: Record<string, unknown>): Promise<AIResult>;
}

/**
 * Create a lightweight AI client bound to a provider.
 */
export function createAI(provider: SimpleAIProvider): AIClient {
  return {
    async generate(spec: PromptSpec, input: unknown, options?: Record<string, unknown>): Promise<AIResult> {
      const systemPrefix = spec.system ? `${spec.system}\n\n` : '';
      const prompt = `${systemPrefix}${String(input)}`;
      const text = await provider.generate(prompt, options);
      return { text };
    },
  };
}
