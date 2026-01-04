/**
 * PhilJS AI - AI-powered development tools for PhilJS
 *
 * @packageDocumentation
 */
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
// AI Assistant
export { AIAssistant, createAIAssistant, createAutoAssistant, } from "./assistant/index.js";
// Code Reviewer
export { CodeReviewer, createCodeReviewer, } from "./assistant/code-reviewer.js";
// Utility functions
export * from "./utils/parser.js";
export * from "./utils/prompts.js";
// Provider implementations
export { OpenAIProvider, createOpenAIProvider, } from "./providers/openai.js";
export { AnthropicProvider, createAnthropicProvider, } from "./providers/anthropic.js";
export { LocalProvider, createLocalProvider, } from "./providers/local.js";
export { GeminiProvider, createGeminiProvider, } from "./providers/gemini.js";
export { CohereProvider, createCohereProvider, } from "./providers/cohere.js";
export { LMStudioProvider, createLMStudioProvider, } from "./providers/lmstudio.js";
export { createProvider, autoDetectProvider, ProviderRegistry, providerRegistry, } from "./providers/index.js";
// Code generation
export { ComponentGenerator, createComponentGenerator, generateComponent, } from "./codegen/component-generator.js";
export { PageGenerator, createPageGenerator, generatePage, } from "./codegen/page-generator.js";
export { APIGenerator, createAPIGenerator, generateCRUD, } from "./codegen/api-generator.js";
// Autocomplete
export { AutocompleteEngine, createAutocompleteEngine, getSuggestions, getFixSuggestions, getInlineCompletion, getSignatureHelp, getCompletions, CompletionItemKind, } from "./autocomplete/index.js";
// Refactoring
export { RefactoringEngine, createRefactoringEngine, refactorCode, analyzePerformance, auditAccessibility, } from "./refactor/index.js";
// Testing
export { TestGenerator, createTestGenerator, generateTests, generateUnitTests, generateE2ETests, } from "./testing/test-generator.js";
// Documentation
export { DocGenerator, createDocGenerator, generateDocs, addJSDoc, generateReadme, } from "./docs/doc-generator.js";
// VS Code extension
export { PhilJSAIExtension, activate, deactivate, getContributionPoints, } from "./vscode/extension.js";
// Code Generation (unified module)
export { CodeGenerator, createCodeGenerator, generateComponent as generateComponentFromDescription, generateFunction, refactorCode as refactorCodeWithAI, explainCode, generateTests as generateTestsFromCode, } from "./codegen.js";
// Code Analysis
export { CodeAnalyzer, createCodeAnalyzer, analyzeComponent, suggestOptimizations, detectAntiPatterns, } from "./analysis.js";
// LSP (Language Server Protocol)
export { PhilJSLanguageServer, createLanguageServer, startStdioServer, getDefaultCapabilities, getInitializeResult, LSPHandlers, createLSPHandlers, DocumentStore, } from "./lsp/index.js";
// Natural Language Code Generation
export { NaturalLanguageGenerator, createNaturalLanguageGenerator, generateFromNaturalLanguage, parseCodeIntent, } from "./codegen/natural-language-generator.js";
// Component Suggestion System
export { ComponentSuggester, createComponentSuggester, suggestComponents, detectUIPatterns, } from "./suggestions/component-suggester.js";
// Advanced Refactoring Engine
export { RefactoringEngine as AdvancedRefactoringEngine, createRefactoringEngine as createAdvancedRefactoringEngine, analyzeForRefactoring, autoFixCode, } from "./refactor/refactoring-engine.js";
// Advanced Documentation Generator
export { DocumentationGenerator, createDocumentationGenerator, generateDocumentation, addJSDocToCode, documentPhilJSComponent, } from "./docs/documentation-generator.js";
// Advanced Test Generator
export { AdvancedTestGenerator, createAdvancedTestGenerator, generateTestSuite, generateUnitTestsForCode, generateE2ETestScenarios, } from "./testing/advanced-test-generator.js";
// Type Inference Helper
export { TypeInferenceHelper, createTypeInferenceHelper, inferTypesForCode, jsonToTypeScript, convertJavaScriptToTypeScript, } from "./inference/type-inference.js";
// Schema to Component Generator
export { SchemaToComponentGenerator, createSchemaToComponentGenerator, generateComponentsFromSchema, generateCRUDFromSchema, generateFromJSONSchema, generateFromGraphQL, } from "./schema/schema-to-component.js";
// RAG (Retrieval Augmented Generation)
export { RAGPipeline, useRAG, InMemoryVectorStore, PineconeVectorStore, ChromaVectorStore, QdrantVectorStore, TextLoader, JSONLoader, MarkdownLoader, RecursiveCharacterSplitter, TokenSplitter, euclideanDistance, } from "./rag.js";
// Tool Calling System
export { tool, createTool, createAgent, ToolExecutor, Agent, webSearchTool, calculatorTool, weatherTool, codeExecutionTool, fileReadTool, } from "./tools.js";
// Prompt Caching
export { CachedAIProvider, createCachedProvider, createMemoryCache, createRedisCache, MemoryCacheStorage, RedisCacheStorage, withCache, } from "./cache.js";
// Structured Output with Zod
export { generateStructured, streamStructured, createStructuredGenerator, extractArray, extractWithFallback, schemaToDescription, zodToJsonSchema, commonSchemas, StructuredOutputError, } from "./structured.js";
// Observability and Telemetry
export { ObservableAIProvider, createObservableProvider, calculateCost, MODEL_COSTS, BudgetExceededError, ConsoleExporter, HttpExporter, FileExporter, } from "./observability.js";
/**
 * Create a typed prompt specification.
 * @template TI, TO
 * @param {PromptSpec<TI, TO>} spec - Prompt specification
 * @returns {PromptSpec<TI, TO>}
 */
export function createPrompt(spec) {
    return spec;
}
/**
 * Create an AI client with a provider.
 * @param {Provider} provider - AI provider
 */
export function createAI(provider) {
    return {
        async generate(spec, input, opts) {
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
export function createAIClient(provider) {
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
        async generateComponent(description, name, options) {
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
        async generateFunction(description, options) {
            return codeGenerator.generateFunction(description, options);
        },
        /**
         * Generate a page from description
         */
        async generatePage(description, name, path, options) {
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
        async generateAPI(resource, schema, options) {
            return apiGenerator.generateCRUD({
                resource,
                schema: schema,
                ...options,
            });
        },
        /**
         * Refactor code with instruction
         */
        async refactorCode(code, instruction) {
            return codeGenerator.refactorCode(code, instruction);
        },
        /**
         * Refactor code with focus areas
         */
        async refactor(code, focusAreas) {
            return refactoring.refactor({
                code,
                focusAreas: focusAreas,
            });
        },
        /**
         * Explain code
         */
        async explainCode(code, options) {
            return codeGenerator.explainCode(code, options);
        },
        /**
         * Generate tests for code
         */
        async generateTests(code, type = 'unit') {
            return testGenerator.generateTests({
                code,
                type: type,
            });
        },
        /**
         * Analyze component structure
         */
        async analyzeComponent(code) {
            return analyzer.analyzeComponent(code);
        },
        /**
         * Suggest optimizations
         */
        async suggestOptimizations(code) {
            return analyzer.suggestOptimizations(code);
        },
        /**
         * Detect anti-patterns
         */
        async detectAntiPatterns(code) {
            return analyzer.detectAntiPatterns(code);
        },
        /**
         * Get inline completion (Copilot-style)
         */
        async getInlineCompletion(prefix, suffix, options) {
            return autocomplete.getInlineCompletion(prefix, suffix, options);
        },
        /**
         * Get signature help for a function
         */
        async getSignatureHelp(functionName) {
            return autocomplete.getSignatureHelp(functionName);
        },
        /**
         * Add documentation to code
         */
        async addDocs(code, style = 'jsdoc') {
            return docGenerator.generateDocs({
                code,
                style: style,
            });
        },
        // ============ New Enhanced Methods ============
        /**
         * Generate code from natural language description
         */
        async generateFromDescription(description, options) {
            return naturalLanguageGenerator.generate(description, options);
        },
        /**
         * Parse intent from natural language
         */
        async parseIntent(description) {
            return naturalLanguageGenerator.parseIntent(description);
        },
        /**
         * Start a conversational code generation session
         */
        async startCodeConversation(description, options) {
            return naturalLanguageGenerator.startConversation(description, options);
        },
        /**
         * Get component suggestions for current context
         */
        async suggestComponents(context) {
            return componentSuggester.suggest(context);
        },
        /**
         * Detect UI patterns in code
         */
        async detectPatterns(code) {
            return componentSuggester.detectPatterns(code);
        },
        /**
         * Analyze code for refactoring opportunities
         */
        async analyzeRefactoring(code, options) {
            return advancedRefactoring.analyze(code, options);
        },
        /**
         * Auto-fix refactoring suggestions
         */
        async applyRefactoring(code, suggestions) {
            return advancedRefactoring.autoFix(code, suggestions);
        },
        /**
         * Generate comprehensive documentation
         */
        async generateDocumentation(code, options) {
            return documentationGenerator.generateDocs(code, options);
        },
        /**
         * Document a component with full props, state, events
         */
        async documentComponent(componentCode) {
            return documentationGenerator.documentComponent(componentCode);
        },
        /**
         * Generate README from project files
         */
        async generateReadme(files, options) {
            return documentationGenerator.generateReadme(files, options);
        },
        /**
         * Generate comprehensive test suite
         */
        async generateTestSuite(code, options) {
            return advancedTestGenerator.generateTestSuite(code, options);
        },
        /**
         * Generate E2E test scenarios
         */
        async generateE2EScenarios(appDescription) {
            return advancedTestGenerator.generateE2EScenarios(appDescription);
        },
        /**
         * Generate accessibility tests
         */
        async generateA11yTests(componentCode, options) {
            return advancedTestGenerator.generateA11yTests(componentCode, options);
        },
        /**
         * Infer TypeScript types for code
         */
        async inferTypes(code, options) {
            return typeInferenceHelper.inferTypes(code, options);
        },
        /**
         * Generate types from JSON
         */
        async typesFromJSON(json, typeName) {
            return typeInferenceHelper.inferFromJSON(json, typeName);
        },
        /**
         * Convert JavaScript to TypeScript
         */
        async jsToTs(jsCode) {
            return typeInferenceHelper.convertJSToTS(jsCode);
        },
        /**
         * Generate components from schema
         */
        async componentsFromSchema(schema, options) {
            return schemaToComponent.generate(schema, options);
        },
        /**
         * Generate CRUD from schema
         */
        async crudFromSchema(schema, options) {
            return schemaToComponent.generateCRUD(schema, options);
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
    http: (url) => ({
        name: "http",
        async generate(prompt, opts) {
            const res = await fetch(url, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ prompt, ...opts })
            });
            const data = await res.json();
            return data.text ?? "";
        }
    }),
    /**
     * Echo provider for testing (returns the prompt as-is).
     * @returns {Provider}
     */
    echo: () => ({
        name: "echo",
        async generate(prompt) {
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
//# sourceMappingURL=index.js.map