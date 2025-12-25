/**
 * PhilJS AI - AI-powered development tools for PhilJS
 *
 * @packageDocumentation
 */

import type { PromptSpec, Provider, AIProvider } from "./types.js";

// Import types for createAIClient
import type { SchemaDefinition } from "./codegen/api-generator.js";
import type { RefactorFocusArea } from "./refactor/index.js";
import type { TestType } from "./testing/test-generator.js";
import type { DocStyle } from "./docs/doc-generator.js";

// Import classes for createAIClient
import { ComponentGenerator } from "./codegen/component-generator.js";
import { PageGenerator } from "./codegen/page-generator.js";
import { APIGenerator } from "./codegen/api-generator.js";
import { AutocompleteEngine } from "./autocomplete/index.js";
import { RefactoringEngine } from "./refactor/index.js";
import { TestGenerator } from "./testing/test-generator.js";
import { DocGenerator } from "./docs/doc-generator.js";

// Import new modules for createAIClient
import { CodeGenerator } from "./codegen.js";
import { CodeAnalyzer } from "./analysis.js";

// Import new enhanced modules
import { NaturalLanguageGenerator } from "./codegen/natural-language-generator.js";
import { ComponentSuggester } from "./suggestions/component-suggester.js";
import { RefactoringEngine as AdvancedRefactoringEngine } from "./refactor/refactoring-engine.js";
import { DocumentationGenerator } from "./docs/documentation-generator.js";
import { AdvancedTestGenerator } from "./testing/advanced-test-generator.js";
import { TypeInferenceHelper } from "./inference/type-inference.js";
import { SchemaToComponentGenerator } from "./schema/schema-to-component.js";

// Core types
export * from "./types.js";

// Utility functions
export * from "./utils/parser.js";
export * from "./utils/prompts.js";

// Provider implementations
export {
  OpenAIProvider,
  createOpenAIProvider,
  type OpenAIConfig,
} from "./providers/openai.js";

export {
  AnthropicProvider,
  createAnthropicProvider,
  type AnthropicConfig,
} from "./providers/anthropic.js";

export {
  LocalProvider,
  createLocalProvider,
  type LocalConfig,
} from "./providers/local.js";

export {
  createProvider,
  autoDetectProvider,
  ProviderRegistry,
  providerRegistry,
  type ProviderConfig,
} from "./providers/index.js";

// Code generation
export {
  ComponentGenerator,
  createComponentGenerator,
  generateComponent,
  type ComponentGenerationConfig,
  type GeneratedComponent,
  type PropDefinition,
  type StyleConfig,
  type AccessibilityConfig,
  type WireframeConfig,
} from "./codegen/component-generator.js";

export {
  PageGenerator,
  createPageGenerator,
  generatePage,
  type PageGenerationConfig,
  type GeneratedPage,
  type PageType,
  type LayoutConfig,
  type SEOConfig,
  type DataLoadingConfig,
  type LayoutSuggestion,
} from "./codegen/page-generator.js";

export {
  APIGenerator,
  createAPIGenerator,
  generateCRUD,
  type APIGenerationConfig,
  type GeneratedAPI,
  type SchemaDefinition,
  type FieldDefinition,
  type CRUDOperation,
  type DatabaseType,
} from "./codegen/api-generator.js";

// Autocomplete
export {
  AutocompleteEngine,
  createAutocompleteEngine,
  getSuggestions,
  getFixSuggestions,
  getInlineCompletion,
  getSignatureHelp,
  getCompletions,
  type AutocompleteContext,
  type AutocompleteSuggestion,
  type FixSuggestion,
  type ErrorInfo,
  type ProjectContext,
  type InlineCompletionResult,
  type SignatureHelpResult,
  type SignatureInfo,
  type ParameterInfo,
  type CodeContext,
  type CompletionItem,
  CompletionItemKind,
} from "./autocomplete/index.js";

// Refactoring
export {
  RefactoringEngine,
  createRefactoringEngine,
  refactorCode,
  analyzePerformance,
  auditAccessibility,
  type RefactorConfig,
  type RefactorResult,
  type RefactorFocusArea,
  type PerformanceAnalysis,
  type AccessibilityAudit,
  type BestPracticesResult,
} from "./refactor/index.js";

// Testing
export {
  TestGenerator,
  createTestGenerator,
  generateTests,
  generateUnitTests,
  generateE2ETests,
  type TestGenerationConfig,
  type GeneratedTests,
  type TestType,
  type TestFramework,
  type E2ETestConfig,
  type GeneratedE2ETests,
  type CoverageAnalysis,
} from "./testing/test-generator.js";

// Documentation
export {
  DocGenerator,
  createDocGenerator,
  generateDocs,
  addJSDoc,
  generateReadme,
  type DocGenerationConfig,
  type GeneratedDocumentation,
  type DocStyle,
  type ReadmeConfig,
  type GeneratedReadme,
  type APIDocConfig,
  type GeneratedAPIDoc,
} from "./docs/doc-generator.js";

// VS Code extension
export {
  PhilJSAIExtension,
  activate,
  deactivate,
  getContributionPoints,
} from "./vscode/extension.js";

// Code Generation (unified module)
export {
  CodeGenerator,
  createCodeGenerator,
  generateComponent as generateComponentFromDescription,
  generateFunction,
  refactorCode as refactorCodeWithAI,
  explainCode,
  generateTests as generateTestsFromCode,
  type CodeGenOptions,
  type GeneratedCode,
  type GeneratedComponentResult,
  type GeneratedFunctionResult,
  type RefactorResult as CodeGenRefactorResult,
  type RefactorChange,
  type CodeExplanation,
  type CodeSection,
  type GeneratedTestsResult,
  type TestCase as CodeGenTestCase,
} from "./codegen.js";

// Code Analysis
export {
  CodeAnalyzer,
  createCodeAnalyzer,
  analyzeComponent,
  suggestOptimizations,
  detectAntiPatterns,
  type ComponentAnalysis,
  type PropAnalysis,
  type StateAnalysis,
  type StateVariable,
  type EffectAnalysis,
  type ComputedAnalysis,
  type EventHandlerAnalysis,
  type AccessibilityAnalysis,
  type AccessibilityIssue,
  type ComplexityMetrics,
  type RenderingAnalysis,
  type DependencyAnalysis,
  type OptimizationSuggestion,
  type AntiPatternResult,
  type DetectedAntiPattern,
} from "./analysis.js";

// LSP (Language Server Protocol)
export {
  PhilJSLanguageServer,
  createLanguageServer,
  startStdioServer,
  getDefaultCapabilities,
  getInitializeResult,
  LSPHandlers,
  createLSPHandlers,
  DocumentStore,
  type ServerCapabilities,
  type ServerConfig,
  type LSPMessage,
  type LSPRequest,
  type LSPResponse,
  type InitializeResult,
  type ClientCapabilities,
} from "./lsp/index.js";

// Natural Language Code Generation
export {
  NaturalLanguageGenerator,
  createNaturalLanguageGenerator,
  generateFromNaturalLanguage,
  parseCodeIntent,
  type GenerationIntent,
  type ParsedIntent,
  type IntentEntity,
  type ParameterIntent,
  type StateIntent,
  type StylingIntent,
  type NLGenerationOptions,
  type NLGeneratedCode,
  type ConversationContext,
  type ConversationMessage,
  type GeneratedArtifact,
} from "./codegen/natural-language-generator.js";

// Component Suggestion System
export {
  ComponentSuggester,
  createComponentSuggester,
  suggestComponents,
  detectUIPatterns,
  type ComponentSuggestion,
  type ComponentCategory,
  type SuggestedProp,
  type SuggestionContext,
  type AvailableImport,
  type ProjectComponent,
  type SuggestionPreferences,
  type SuggestionResult,
  type ContextAnalysis,
  type PatternDetection,
} from "./suggestions/component-suggester.js";

// Advanced Refactoring Engine
export {
  RefactoringEngine as AdvancedRefactoringEngine,
  createRefactoringEngine as createAdvancedRefactoringEngine,
  analyzeForRefactoring,
  autoFixCode,
  type RefactoringSuggestion,
  type RefactoringCategory,
  type CodeSnippet,
  type RefactoringAnalysisOptions,
  type RefactoringAnalysisResult,
  type CategorySummary,
  type RefactoringPlan,
  type RefactoringStep,
  type AutoFixResult,
} from "./refactor/refactoring-engine.js";

// Advanced Documentation Generator
export {
  DocumentationGenerator,
  createDocumentationGenerator,
  generateDocumentation,
  addJSDocToCode,
  documentPhilJSComponent,
  type DocumentationStyle,
  type DocGenerationOptions,
  type GeneratedDocumentation as AdvancedGeneratedDocumentation,
  type DocBlock,
  type DocParam,
  type DocReturn,
  type DocTag,
  type DocCoverage,
  type ComponentDoc,
  type PropDoc,
  type StateDoc,
  type EventDoc,
  type SlotDoc,
  type ComponentExample,
  type ReadmeOptions,
  type GeneratedReadme as AdvancedGeneratedReadme,
} from "./docs/documentation-generator.js";

// Advanced Test Generator
export {
  AdvancedTestGenerator,
  createAdvancedTestGenerator,
  generateTestSuite,
  generateUnitTestsForCode,
  generateE2ETestScenarios,
  type TestFramework as AdvancedTestFramework,
  type TestType as AdvancedTestType,
  type AdvancedTestGenOptions,
  type GeneratedTestSuite,
  type TestCaseInfo,
  type TestCategory,
  type MockFile,
  type FixtureFile,
  type CoverageAnalysis as TestCoverageAnalysis,
  type E2EScenario,
  type E2EStep,
  type A11yTest,
} from "./testing/advanced-test-generator.js";

// Type Inference Helper
export {
  TypeInferenceHelper,
  createTypeInferenceHelper,
  inferTypesForCode,
  jsonToTypeScript,
  convertJavaScriptToTypeScript,
  type TypeInferenceResult,
  type InferredType,
  type CodeLocation,
  type InferenceSource,
  type InferredInterface,
  type InterfaceProperty,
  type InferredTypeAlias,
  type InferenceConfidence,
  type TypeSuggestion,
  type TypeInferenceOptions,
  type APITypeInference,
  type JSONToTypeResult,
} from "./inference/type-inference.js";

// Schema to Component Generator
export {
  SchemaToComponentGenerator,
  createSchemaToComponentGenerator,
  generateComponentsFromSchema,
  generateCRUDFromSchema,
  generateFromJSONSchema,
  generateFromGraphQL,
  type SchemaType,
  type GeneratedComponentType,
  type SchemaToComponentOptions,
  type SchemaField,
  type FieldValidation,
  type UIHints,
  type ParsedSchema,
  type SchemaRelation,
  type GeneratedSchemaComponent,
  type SchemaToComponentResult,
  type CRUDGenerationResult,
} from "./schema/schema-to-component.js";

// RAG (Retrieval Augmented Generation)
export {
  RAGPipeline,
  useRAG,
  InMemoryVectorStore,
  PineconeVectorStore,
  ChromaVectorStore,
  QdrantVectorStore,
  TextLoader,
  JSONLoader,
  MarkdownLoader,
  RecursiveCharacterSplitter,
  TokenSplitter,
  euclideanDistance,
  type Document,
  type VectorStore,
  type SearchResult,
  type RAGOptions,
  type PineconeConfig,
  type ChromaConfig,
  type QdrantConfig,
  type DocumentLoader,
  type TextSplitter,
} from "./rag.js";

// Tool Calling System
export {
  tool,
  createTool,
  createAgent,
  ToolExecutor,
  Agent,
  webSearchTool,
  calculatorTool,
  weatherTool,
  codeExecutionTool,
  fileReadTool,
  type ToolBuilder,
  type ParameterDef,
  type AgentConfig,
  type AgentStep,
} from "./tools.js";

/**
 * Create a typed prompt specification.
 * @template TI, TO
 * @param {PromptSpec<TI, TO>} spec - Prompt specification
 * @returns {PromptSpec<TI, TO>}
 */
export function createPrompt<TI = unknown, TO = unknown>(spec: PromptSpec<TI, TO>): PromptSpec<TI, TO> {
  return spec;
}

/**
 * Create an AI client with a provider.
 * @param {Provider} provider - AI provider
 */
export function createAI(provider: Provider) {
  return {
    async generate<TI = unknown, TO = unknown>(spec: PromptSpec<TI, TO>, input: TI, opts?: Record<string, unknown>) {
      // Check PII policy
      if (spec.policy?.pii === "block") {
        // In a real implementation, scan input for PII
        // For now, just proceed
      }

      const prompt = JSON.stringify({ spec, input });
      const text = await provider.generate(prompt, opts);

      return { text };
    }
  };
}

/**
 * Create a full-featured AI client with an AIProvider.
 * @param {AIProvider} provider - AI provider with extended capabilities
 */
export function createAIClient(provider: AIProvider) {
  const componentGenerator = new ComponentGenerator(provider);
  const pageGenerator = new PageGenerator(provider);
  const apiGenerator = new APIGenerator(provider);
  const autocomplete = new AutocompleteEngine(provider);
  const refactoring = new RefactoringEngine(provider);
  const testGenerator = new TestGenerator(provider);
  const docGenerator = new DocGenerator(provider);
  const codeGenerator = new CodeGenerator(provider);
  const analyzer = new CodeAnalyzer(provider);

  // New enhanced modules
  const naturalLanguageGenerator = new NaturalLanguageGenerator(provider);
  const componentSuggester = new ComponentSuggester(provider);
  const advancedRefactoring = new AdvancedRefactoringEngine(provider);
  const documentationGenerator = new DocumentationGenerator(provider);
  const advancedTestGenerator = new AdvancedTestGenerator(provider);
  const typeInferenceHelper = new TypeInferenceHelper(provider);
  const schemaToComponent = new SchemaToComponentGenerator(provider);

  return {
    provider,
    componentGenerator,
    pageGenerator,
    apiGenerator,
    autocomplete,
    refactoring,
    testGenerator,
    docGenerator,
    codeGenerator,
    analyzer,

    // New enhanced modules
    naturalLanguageGenerator,
    componentSuggester,
    advancedRefactoring,
    documentationGenerator,
    advancedTestGenerator,
    typeInferenceHelper,
    schemaToComponent,

    /**
     * Generate a component from description
     */
    async generateComponent(description: string, name: string, options?: Record<string, unknown>) {
      return componentGenerator.generateFromDescription({
        name,
        description,
        useSignals: true,
        ...options,
      });
    },

    /**
     * Generate a function from description
     */
    async generateFunction(description: string, options?: { name?: string; async?: boolean }) {
      return codeGenerator.generateFunction(description, options);
    },

    /**
     * Generate a page from description
     */
    async generatePage(description: string, name: string, path: string, options?: Record<string, unknown>) {
      return pageGenerator.generatePage({
        name,
        path,
        description,
        ...options,
      });
    },

    /**
     * Generate CRUD API for a resource
     */
    async generateAPI(resource: string, schema?: object, options?: Record<string, unknown>) {
      return apiGenerator.generateCRUD({
        resource,
        schema: schema as SchemaDefinition,
        ...options,
      });
    },

    /**
     * Refactor code with instruction
     */
    async refactorCode(code: string, instruction: string) {
      return codeGenerator.refactorCode(code, instruction);
    },

    /**
     * Refactor code with focus areas
     */
    async refactor(code: string, focusAreas?: string[]) {
      return refactoring.refactor({
        code,
        focusAreas: focusAreas as RefactorFocusArea[],
      });
    },

    /**
     * Explain code
     */
    async explainCode(code: string, options?: { detailLevel?: 'brief' | 'detailed' | 'comprehensive' }) {
      return codeGenerator.explainCode(code, options);
    },

    /**
     * Generate tests for code
     */
    async generateTests(code: string, type: string = 'unit') {
      return testGenerator.generateTests({
        code,
        type: type as TestType,
      });
    },

    /**
     * Analyze component structure
     */
    async analyzeComponent(code: string) {
      return analyzer.analyzeComponent(code);
    },

    /**
     * Suggest optimizations
     */
    async suggestOptimizations(code: string) {
      return analyzer.suggestOptimizations(code);
    },

    /**
     * Detect anti-patterns
     */
    async detectAntiPatterns(code: string) {
      return analyzer.detectAntiPatterns(code);
    },

    /**
     * Get inline completion (Copilot-style)
     */
    async getInlineCompletion(prefix: string, suffix: string, options?: { maxLength?: number }) {
      return autocomplete.getInlineCompletion(prefix, suffix, options);
    },

    /**
     * Get signature help for a function
     */
    async getSignatureHelp(functionName: string) {
      return autocomplete.getSignatureHelp(functionName);
    },

    /**
     * Add documentation to code
     */
    async addDocs(code: string, style: string = 'jsdoc') {
      return docGenerator.generateDocs({
        code,
        style: style as DocStyle,
      });
    },

    // ============ New Enhanced Methods ============

    /**
     * Generate code from natural language description
     */
    async generateFromDescription(description: string, options?: Record<string, unknown>) {
      return naturalLanguageGenerator.generate(description, options);
    },

    /**
     * Parse intent from natural language
     */
    async parseIntent(description: string) {
      return naturalLanguageGenerator.parseIntent(description);
    },

    /**
     * Start a conversational code generation session
     */
    async startCodeConversation(description: string, options?: Record<string, unknown>) {
      return naturalLanguageGenerator.startConversation(description, options);
    },

    /**
     * Get component suggestions for current context
     */
    async suggestComponents(context: { fileContent: string; cursorPosition: { line: number; column: number }; filePath: string }) {
      return componentSuggester.suggest(context);
    },

    /**
     * Detect UI patterns in code
     */
    async detectPatterns(code: string) {
      return componentSuggester.detectPatterns(code);
    },

    /**
     * Analyze code for refactoring opportunities
     */
    async analyzeRefactoring(code: string, options?: Record<string, unknown>) {
      return advancedRefactoring.analyze(code, options);
    },

    /**
     * Auto-fix refactoring suggestions
     */
    async applyRefactoring(code: string, suggestions: unknown[]) {
      return advancedRefactoring.autoFix(code, suggestions as any);
    },

    /**
     * Generate comprehensive documentation
     */
    async generateDocumentation(code: string, options?: Record<string, unknown>) {
      return documentationGenerator.generateDocs(code, options);
    },

    /**
     * Document a component with full props, state, events
     */
    async documentComponent(componentCode: string) {
      return documentationGenerator.documentComponent(componentCode);
    },

    /**
     * Generate README from project files
     */
    async generateReadme(files: Map<string, string>, options: { projectName: string }) {
      return documentationGenerator.generateReadme(files, options);
    },

    /**
     * Generate comprehensive test suite
     */
    async generateTestSuite(code: string, options?: Record<string, unknown>) {
      return advancedTestGenerator.generateTestSuite(code, options);
    },

    /**
     * Generate E2E test scenarios
     */
    async generateE2EScenarios(appDescription: string) {
      return advancedTestGenerator.generateE2EScenarios(appDescription);
    },

    /**
     * Generate accessibility tests
     */
    async generateA11yTests(componentCode: string, options?: { wcagLevel?: 'A' | 'AA' | 'AAA' }) {
      return advancedTestGenerator.generateA11yTests(componentCode, options);
    },

    /**
     * Infer TypeScript types for code
     */
    async inferTypes(code: string, options?: Record<string, unknown>) {
      return typeInferenceHelper.inferTypes(code, options);
    },

    /**
     * Generate types from JSON
     */
    async typesFromJSON(json: unknown, typeName: string) {
      return typeInferenceHelper.inferFromJSON(json, typeName);
    },

    /**
     * Convert JavaScript to TypeScript
     */
    async jsToTs(jsCode: string) {
      return typeInferenceHelper.convertJSToTS(jsCode);
    },

    /**
     * Generate components from schema
     */
    async componentsFromSchema(schema: string, options: { schemaType: string; componentTypes?: string[] }) {
      return schemaToComponent.generate(schema, options as any);
    },

    /**
     * Generate CRUD from schema
     */
    async crudFromSchema(schema: string, options: { schemaType: string }) {
      return schemaToComponent.generateCRUD(schema, options as any);
    },
  };
}

/**
 * Built-in providers.
 */
export const providers = {
  /**
   * HTTP provider that POSTs to an endpoint.
   * @param {string} url - AI endpoint URL
   * @returns {Provider}
   */
  http: (url: string): Provider => ({
    name: "http",
    async generate(prompt: string, opts?: Record<string, unknown>): Promise<string> {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, ...opts })
      });

      const data = await res.json() as { text?: string };
      return data.text ?? "";
    }
  }),

  /**
   * Echo provider for testing (returns the prompt as-is).
   * @returns {Provider}
   */
  echo: (): Provider => ({
    name: "echo",
    async generate(prompt: string): Promise<string> {
      return `Echo: ${prompt}`;
    }
  })
};

/**
 * Default export with all main utilities
 */
export default {
  createPrompt,
  createAI,
  createAIClient,
  providers,
  autoDetectProvider: () => import("./providers/index.js").then(m => m.autoDetectProvider()),
};
