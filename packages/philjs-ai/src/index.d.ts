/**
 * PhilJS AI - AI-powered development tools for PhilJS
 *
 * @packageDocumentation
 */
import type { PromptSpec, Provider, AIProvider } from "./types.js";
import { ComponentGenerator } from "./codegen/component-generator.js";
import { PageGenerator } from "./codegen/page-generator.js";
import { APIGenerator } from "./codegen/api-generator.js";
import { AutocompleteEngine } from "./autocomplete/index.js";
import { RefactoringEngine } from "./refactor/index.js";
import { TestGenerator } from "./testing/test-generator.js";
import { DocGenerator } from "./docs/doc-generator.js";
import { CodeGenerator } from "./codegen.js";
import { CodeAnalyzer } from "./analysis.js";
import { NaturalLanguageGenerator } from "./codegen/natural-language-generator.js";
import { ComponentSuggester } from "./suggestions/component-suggester.js";
import { RefactoringEngine as AdvancedRefactoringEngine } from "./refactor/refactoring-engine.js";
import { DocumentationGenerator } from "./docs/documentation-generator.js";
import { AdvancedTestGenerator } from "./testing/advanced-test-generator.js";
import { TypeInferenceHelper } from "./inference/type-inference.js";
import { SchemaToComponentGenerator } from "./schema/schema-to-component.js";
export * from "./types.js";
export type { ToolDefinition, ToolCall } from "./types.js";
export { AIAssistant, createAIAssistant, createAutoAssistant, type AssistantConfig, type ProjectContext as AssistantProjectContext, type CodeGenRequest, type CodeGenResult, type RefactorRequest, type ConversationMessage as AssistantConversationMessage, type ChatResponse, } from "./assistant/index.js";
export { CodeReviewer, createCodeReviewer, type ReviewConfig, type ReviewFocus, type ReviewSeverity, type ReviewResult, type ReviewSummary, type ReviewIssue, type ReviewSuggestion, type CodeMetrics, type SecurityFinding, type SecurityCategory, type PerformanceNote, type PerformanceCategory, type AccessibilityIssue as ReviewAccessibilityIssue, type PRReviewResult, type FileReview, type LineComment, } from "./assistant/code-reviewer.js";
export * from "./utils/parser.js";
export * from "./utils/prompts.js";
export { OpenAIProvider, createOpenAIProvider, type OpenAIConfig, } from "./providers/openai.js";
export { AnthropicProvider, createAnthropicProvider, type AnthropicConfig, } from "./providers/anthropic.js";
export { LocalProvider, createLocalProvider, type LocalConfig, } from "./providers/local.js";
export { GeminiProvider, createGeminiProvider, type GeminiConfig, } from "./providers/gemini.js";
export { CohereProvider, createCohereProvider, type CohereConfig, } from "./providers/cohere.js";
export { LMStudioProvider, createLMStudioProvider, type LMStudioConfig, } from "./providers/lmstudio.js";
export { createProvider, autoDetectProvider, ProviderRegistry, providerRegistry, type ProviderConfig, } from "./providers/index.js";
export { ComponentGenerator, createComponentGenerator, generateComponent, type ComponentGenerationConfig, type GeneratedComponent, type PropDefinition, type StyleConfig, type AccessibilityConfig, type WireframeConfig, } from "./codegen/component-generator.js";
export { PageGenerator, createPageGenerator, generatePage, type PageGenerationConfig, type GeneratedPage, type PageType, type LayoutConfig, type SEOConfig, type DataLoadingConfig, type LayoutSuggestion, } from "./codegen/page-generator.js";
export { APIGenerator, createAPIGenerator, generateCRUD, type APIGenerationConfig, type GeneratedAPI, type SchemaDefinition, type FieldDefinition, type CRUDOperation, type DatabaseType, } from "./codegen/api-generator.js";
export { AutocompleteEngine, createAutocompleteEngine, getSuggestions, getFixSuggestions, getInlineCompletion, getSignatureHelp, getCompletions, type AutocompleteContext, type AutocompleteSuggestion, type FixSuggestion, type ErrorInfo, type ProjectContext, type InlineCompletionResult, type SignatureHelpResult, type SignatureInfo, type ParameterInfo, type CodeContext, type CompletionItem, CompletionItemKind, } from "./autocomplete/index.js";
export { RefactoringEngine, createRefactoringEngine, refactorCode, analyzePerformance, auditAccessibility, type RefactorConfig, type RefactorResult, type RefactorFocusArea, type PerformanceAnalysis, type AccessibilityAudit, type BestPracticesResult, } from "./refactor/index.js";
export { TestGenerator, createTestGenerator, generateTests, generateUnitTests, generateE2ETests, type TestGenerationConfig, type GeneratedTests, type TestType, type TestFramework, type E2ETestConfig, type GeneratedE2ETests, type CoverageAnalysis, } from "./testing/test-generator.js";
export { DocGenerator, createDocGenerator, generateDocs, addJSDoc, generateReadme, type DocGenerationConfig, type GeneratedDocumentation, type DocStyle, type ReadmeConfig, type GeneratedReadme, type APIDocConfig, type GeneratedAPIDoc, } from "./docs/doc-generator.js";
export { PhilJSAIExtension, activate, deactivate, getContributionPoints, } from "./vscode/extension.js";
export { CodeGenerator, createCodeGenerator, generateComponent as generateComponentFromDescription, generateFunction, refactorCode as refactorCodeWithAI, explainCode, generateTests as generateTestsFromCode, type CodeGenOptions, type GeneratedCode, type GeneratedComponentResult, type GeneratedFunctionResult, type RefactorResult as CodeGenRefactorResult, type RefactorChange, type CodeExplanation, type CodeSection, type GeneratedTestsResult, type TestCase as CodeGenTestCase, } from "./codegen.js";
export { CodeAnalyzer, createCodeAnalyzer, analyzeComponent, suggestOptimizations, detectAntiPatterns, type ComponentAnalysis, type PropAnalysis, type StateAnalysis, type StateVariable, type EffectAnalysis, type ComputedAnalysis, type EventHandlerAnalysis, type AccessibilityAnalysis, type AccessibilityIssue, type ComplexityMetrics, type RenderingAnalysis, type DependencyAnalysis, type OptimizationSuggestion, type AntiPatternResult, type DetectedAntiPattern, } from "./analysis.js";
export { PhilJSLanguageServer, createLanguageServer, startStdioServer, getDefaultCapabilities, getInitializeResult, LSPHandlers, createLSPHandlers, DocumentStore, type ServerCapabilities, type ServerConfig, type LSPMessage, type LSPRequest, type LSPResponse, type InitializeResult, type ClientCapabilities, } from "./lsp/index.js";
export { NaturalLanguageGenerator, createNaturalLanguageGenerator, generateFromNaturalLanguage, parseCodeIntent, type GenerationIntent, type ParsedIntent, type IntentEntity, type ParameterIntent, type StateIntent, type StylingIntent, type NLGenerationOptions, type NLGeneratedCode, type ConversationContext, type ConversationMessage, type GeneratedArtifact, } from "./codegen/natural-language-generator.js";
export { ComponentSuggester, createComponentSuggester, suggestComponents, detectUIPatterns, type ComponentSuggestion, type ComponentCategory, type SuggestedProp, type SuggestionContext, type AvailableImport, type ProjectComponent, type SuggestionPreferences, type SuggestionResult, type ContextAnalysis, type PatternDetection, } from "./suggestions/component-suggester.js";
export { RefactoringEngine as AdvancedRefactoringEngine, createRefactoringEngine as createAdvancedRefactoringEngine, analyzeForRefactoring, autoFixCode, type RefactoringSuggestion, type RefactoringCategory, type CodeSnippet, type RefactoringAnalysisOptions, type RefactoringAnalysisResult, type CategorySummary, type RefactoringPlan, type RefactoringStep, type AutoFixResult, } from "./refactor/refactoring-engine.js";
export { DocumentationGenerator, createDocumentationGenerator, generateDocumentation, addJSDocToCode, documentPhilJSComponent, type DocumentationStyle, type DocGenerationOptions, type GeneratedDocumentation as AdvancedGeneratedDocumentation, type DocBlock, type DocParam, type DocReturn, type DocTag, type DocCoverage, type ComponentDoc, type PropDoc, type StateDoc, type EventDoc, type SlotDoc, type ComponentExample, type ReadmeOptions, type GeneratedReadme as AdvancedGeneratedReadme, } from "./docs/documentation-generator.js";
export { AdvancedTestGenerator, createAdvancedTestGenerator, generateTestSuite, generateUnitTestsForCode, generateE2ETestScenarios, type TestFramework as AdvancedTestFramework, type TestType as AdvancedTestType, type AdvancedTestGenOptions, type GeneratedTestSuite, type TestCaseInfo, type TestCategory, type MockFile, type FixtureFile, type CoverageAnalysis as TestCoverageAnalysis, type E2EScenario, type E2EStep, type A11yTest, } from "./testing/advanced-test-generator.js";
export { TypeInferenceHelper, createTypeInferenceHelper, inferTypesForCode, jsonToTypeScript, convertJavaScriptToTypeScript, type TypeInferenceResult, type InferredType, type CodeLocation, type InferenceSource, type InferredInterface, type InterfaceProperty, type InferredTypeAlias, type InferenceConfidence, type TypeSuggestion, type TypeInferenceOptions, type APITypeInference, type JSONToTypeResult, } from "./inference/type-inference.js";
export { SchemaToComponentGenerator, createSchemaToComponentGenerator, generateComponentsFromSchema, generateCRUDFromSchema, generateFromJSONSchema, generateFromGraphQL, type SchemaType, type GeneratedComponentType, type SchemaToComponentOptions, type SchemaField, type FieldValidation, type UIHints, type ParsedSchema, type SchemaRelation, type GeneratedSchemaComponent, type SchemaToComponentResult, type CRUDGenerationResult, } from "./schema/schema-to-component.js";
export { RAGPipeline, useRAG, InMemoryVectorStore, PineconeVectorStore, ChromaVectorStore, QdrantVectorStore, TextLoader, JSONLoader, MarkdownLoader, RecursiveCharacterSplitter, TokenSplitter, euclideanDistance, type Document, type VectorStore, type SearchResult, type RAGOptions, type PineconeConfig, type ChromaConfig, type QdrantConfig, type DocumentLoader, type TextSplitter, } from "./rag.js";
export { tool, createTool, createAgent, ToolExecutor, Agent, webSearchTool, calculatorTool, weatherTool, codeExecutionTool, fileReadTool, type ToolBuilder, type ParameterDef, type AgentConfig, type AgentStep, } from "./tools.js";
export { CachedAIProvider, createCachedProvider, createMemoryCache, createRedisCache, MemoryCacheStorage, RedisCacheStorage, withCache, type CacheConfig, type CacheEntry, type CacheStats, type CacheStorage, type RedisClient, } from "./cache.js";
export { generateStructured, streamStructured, createStructuredGenerator, extractArray, extractWithFallback, schemaToDescription, zodToJsonSchema, commonSchemas, StructuredOutputError, type StructuredOutputOptions, type StructuredResult, } from "./structured.js";
export { ObservableAIProvider, createObservableProvider, calculateCost, MODEL_COSTS, BudgetExceededError, ConsoleExporter, HttpExporter, FileExporter, type AIMetrics, type AIEvent, type AIBudget, type TelemetryExporter, type ObservabilityConfig, } from "./observability.js";
/**
 * Create a typed prompt specification.
 * @template TI, TO
 * @param {PromptSpec<TI, TO>} spec - Prompt specification
 * @returns {PromptSpec<TI, TO>}
 */
export declare function createPrompt<TI = unknown, TO = unknown>(spec: PromptSpec<TI, TO>): PromptSpec<TI, TO>;
/**
 * Create an AI client with a provider.
 * @param {Provider} provider - AI provider
 */
export declare function createAI(provider: Provider): {
    generate<TI = unknown, TO = unknown>(spec: PromptSpec<TI, TO>, input: TI, opts?: Record<string, unknown>): Promise<{
        text: string;
    }>;
};
/**
 * Create a full-featured AI client with an AIProvider.
 * @param {AIProvider} provider - AI provider with extended capabilities
 */
export declare function createAIClient(provider: AIProvider): {
    provider: AIProvider;
    componentGenerator: ComponentGenerator;
    pageGenerator: PageGenerator;
    apiGenerator: APIGenerator;
    autocomplete: AutocompleteEngine;
    refactoring: RefactoringEngine;
    testGenerator: TestGenerator;
    docGenerator: DocGenerator;
    codeGenerator: CodeGenerator;
    analyzer: CodeAnalyzer;
    naturalLanguageGenerator: NaturalLanguageGenerator;
    componentSuggester: ComponentSuggester;
    advancedRefactoring: AdvancedRefactoringEngine;
    documentationGenerator: DocumentationGenerator;
    advancedTestGenerator: AdvancedTestGenerator;
    typeInferenceHelper: TypeInferenceHelper;
    schemaToComponent: SchemaToComponentGenerator;
    /**
     * Generate a component from description
     */
    generateComponent(description: string, name: string, options?: Record<string, unknown>): Promise<import("./codegen/component-generator.js").GeneratedComponent>;
    /**
     * Generate a function from description
     */
    generateFunction(description: string, options?: {
        name?: string;
        async?: boolean;
    }): Promise<import("./codegen.js").GeneratedFunctionResult>;
    /**
     * Generate a page from description
     */
    generatePage(description: string, name: string, path: string, options?: Record<string, unknown>): Promise<import("./codegen/page-generator.js").GeneratedPage>;
    /**
     * Generate CRUD API for a resource
     */
    generateAPI(resource: string, schema?: object, options?: Record<string, unknown>): Promise<import("./codegen/api-generator.js").GeneratedAPI>;
    /**
     * Refactor code with instruction
     */
    refactorCode(code: string, instruction: string): Promise<import("./codegen.js").RefactorResult>;
    /**
     * Refactor code with focus areas
     */
    refactor(code: string, focusAreas?: string[]): Promise<import("./refactor/index.js").RefactorResult>;
    /**
     * Explain code
     */
    explainCode(code: string, options?: {
        detailLevel?: "brief" | "detailed" | "comprehensive";
    }): Promise<import("./codegen.js").CodeExplanation>;
    /**
     * Generate tests for code
     */
    generateTests(code: string, type?: string): Promise<import("./testing/test-generator.js").GeneratedTests>;
    /**
     * Analyze component structure
     */
    analyzeComponent(code: string): Promise<import("./analysis.js").ComponentAnalysis>;
    /**
     * Suggest optimizations
     */
    suggestOptimizations(code: string): Promise<import("./analysis.js").OptimizationSuggestion[]>;
    /**
     * Detect anti-patterns
     */
    detectAntiPatterns(code: string): Promise<import("./analysis.js").AntiPatternResult>;
    /**
     * Get inline completion (Copilot-style)
     */
    getInlineCompletion(prefix: string, suffix: string, options?: {
        maxLength?: number;
    }): Promise<import("./autocomplete/index.js").InlineCompletionResult | null>;
    /**
     * Get signature help for a function
     */
    getSignatureHelp(functionName: string): Promise<import("./autocomplete/index.js").SignatureHelpResult | null>;
    /**
     * Add documentation to code
     */
    addDocs(code: string, style?: string): Promise<import("./docs/doc-generator.js").GeneratedDocumentation>;
    /**
     * Generate code from natural language description
     */
    generateFromDescription(description: string, options?: Record<string, unknown>): Promise<import("./codegen/natural-language-generator.js").NLGeneratedCode>;
    /**
     * Parse intent from natural language
     */
    parseIntent(description: string): Promise<import("./codegen/natural-language-generator.js").ParsedIntent>;
    /**
     * Start a conversational code generation session
     */
    startCodeConversation(description: string, options?: Record<string, unknown>): Promise<{
        result: import("./codegen/natural-language-generator.js").NLGeneratedCode;
        contextId: string;
    }>;
    /**
     * Get component suggestions for current context
     */
    suggestComponents(context: {
        fileContent: string;
        cursorPosition: {
            line: number;
            column: number;
        };
        filePath: string;
    }): Promise<import("./suggestions/component-suggester.js").SuggestionResult>;
    /**
     * Detect UI patterns in code
     */
    detectPatterns(code: string): Promise<import("./suggestions/component-suggester.js").PatternDetection[]>;
    /**
     * Analyze code for refactoring opportunities
     */
    analyzeRefactoring(code: string, options?: Record<string, unknown>): Promise<import("./refactor/refactoring-engine.js").RefactoringAnalysisResult>;
    /**
     * Auto-fix refactoring suggestions
     */
    applyRefactoring(code: string, suggestions: unknown[]): Promise<import("./refactor/refactoring-engine.js").AutoFixResult>;
    /**
     * Generate comprehensive documentation
     */
    generateDocumentation(code: string, options?: Record<string, unknown>): Promise<import("./docs/documentation-generator.js").GeneratedDocumentation>;
    /**
     * Document a component with full props, state, events
     */
    documentComponent(componentCode: string): Promise<import("./docs/documentation-generator.js").ComponentDoc>;
    /**
     * Generate README from project files
     */
    generateReadme(files: Map<string, string>, options: {
        projectName: string;
    }): Promise<import("./docs/documentation-generator.js").GeneratedReadme>;
    /**
     * Generate comprehensive test suite
     */
    generateTestSuite(code: string, options?: Record<string, unknown>): Promise<import("./testing/advanced-test-generator.js").GeneratedTestSuite>;
    /**
     * Generate E2E test scenarios
     */
    generateE2EScenarios(appDescription: string): Promise<import("./testing/advanced-test-generator.js").E2EScenario[]>;
    /**
     * Generate accessibility tests
     */
    generateA11yTests(componentCode: string, options?: {
        wcagLevel?: "A" | "AA" | "AAA";
    }): Promise<import("./testing/advanced-test-generator.js").A11yTest[]>;
    /**
     * Infer TypeScript types for code
     */
    inferTypes(code: string, options?: Record<string, unknown>): Promise<import("./inference/type-inference.js").TypeInferenceResult>;
    /**
     * Generate types from JSON
     */
    typesFromJSON(json: unknown, typeName: string): Promise<import("./inference/type-inference.js").JSONToTypeResult>;
    /**
     * Convert JavaScript to TypeScript
     */
    jsToTs(jsCode: string): Promise<{
        tsCode: string;
        types: import("./inference/type-inference.js").InferredInterface[];
        changes: Array<{
            before: string;
            after: string;
            reason: string;
        }>;
    }>;
    /**
     * Generate components from schema
     */
    componentsFromSchema(schema: string, options: {
        schemaType: string;
        componentTypes?: string[];
    }): Promise<import("./schema/schema-to-component.js").SchemaToComponentResult>;
    /**
     * Generate CRUD from schema
     */
    crudFromSchema(schema: string, options: {
        schemaType: string;
    }): Promise<import("./schema/schema-to-component.js").CRUDGenerationResult>;
};
/**
 * Built-in providers.
 */
export declare const providers: {
    /**
     * HTTP provider that POSTs to an endpoint.
     * @param {string} url - AI endpoint URL
     * @returns {Provider}
     */
    http: (url: string) => Provider;
    /**
     * Echo provider for testing (returns the prompt as-is).
     * @returns {Provider}
     */
    echo: () => Provider;
};
/**
 * Default export with all main utilities
 */
declare const _default: {
    createPrompt: typeof createPrompt;
    createAI: typeof createAI;
    createAIClient: typeof createAIClient;
    providers: {
        /**
         * HTTP provider that POSTs to an endpoint.
         * @param {string} url - AI endpoint URL
         * @returns {Provider}
         */
        http: (url: string) => Provider;
        /**
         * Echo provider for testing (returns the prompt as-is).
         * @returns {Provider}
         */
        echo: () => Provider;
    };
    autoDetectProvider: () => Promise<AIProvider>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map