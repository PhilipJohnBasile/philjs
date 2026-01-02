# philjs-ai

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

AI adapter with typed prompts and safety hooks for PhilJS.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- **Type-safe AI prompts** - Typed prompt templates with validation
- **Multiple AI providers** - OpenAI, Anthropic, Google, local models
- **Streaming support** - Real-time streaming responses
- **Safety hooks** - Content moderation and rate limiting
- **Cost tracking** - Monitor API usage and costs
- **Caching** - Intelligent response caching
- **Error handling** - Automatic retries and fallbacks

## Installation

```bash
pnpm add philjs-ai
```

## Quick Start

### Basic Usage

```typescript
import { createAIClient, prompt } from 'philjs-ai';

const ai = createAIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});

// Simple completion
const response = await ai.complete('What is PhilJS?');
console.log(response.text);

// Typed prompts
const userGreeting = prompt<{ name: string }>`
  Greet the user named {{name}} in a friendly way.
`;

const greeting = await ai.complete(userGreeting({ name: 'Alice' }));
console.log(greeting.text);
```

### Streaming Responses

```typescript
import { createAIClient } from 'philjs-ai';
import { signal } from '@philjs/core';

const ai = createAIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});

const response = signal('');

await ai.stream('Write a short story about PhilJS', {
  onChunk: (chunk) => {
    response.set(response() + chunk);
  }
});
```

### With Safety Hooks

```typescript
import { createAIClient, moderateContent } from 'philjs-ai';

const ai = createAIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  hooks: {
    beforeRequest: async (prompt) => {
      // Content moderation
      const safe = await moderateContent(prompt);
      if (!safe) {
        throw new Error('Inappropriate content detected');
      }
      return prompt;
    },
    afterResponse: async (response) => {
      // Log for monitoring
      console.log('Tokens used:', response.usage.totalTokens);
      return response;
    }
  }
});
```

## Supported Providers

- **OpenAI** - GPT-4, GPT-3.5, etc.
- **Anthropic** - Claude 3 Opus, Sonnet, Haiku
- **Google** - Gemini Pro
- **Local** - Ollama, LM Studio

## API Reference

### `createAIClient(config)`

Create an AI client instance.

### `ai.complete(prompt, options?)`

Generate a text completion.

### `ai.stream(prompt, options?)`

Stream a response in real-time.

### `prompt<T>`

Create a typed prompt template.

## Documentation

For more information, see the [PhilJS documentation](../../docs).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./providers, ./codegen, ./autocomplete, ./refactor, ./testing, ./docs, ./cli, ./vscode
- Source files: packages/philjs-ai/src/index.ts, packages/philjs-ai/src/providers/index.ts, packages/philjs-ai/src/codegen.ts, packages/philjs-ai/src/autocomplete/index.ts, packages/philjs-ai/src/refactor/index.ts, packages/philjs-ai/src/testing/index.ts, packages/philjs-ai/src/docs/index.ts, packages/philjs-ai/src/cli/index.ts

### Public API
- Direct exports: AccessibilityAudit, AccessibilityFix, AccessibilityIssue, AutocompleteContext, AutocompleteEngine, AutocompleteSuggestion, BestPracticeImprovement, BestPracticeViolation, BestPracticesResult, CodeContext, CodeExplanation, CodeGenOptions, CodeGenerator, CodeSection, CompletionItem, CompletionItemKind, ComponentInfo, ErrorInfo, FixSuggestion, GeneratedCode, GeneratedComponentResult, GeneratedFunctionResult, GeneratedTestsResult, ImportSuggestion, InlineCompletionResult, ModuleInfo, ParameterInfo, PerformanceAnalysis, PerformanceIssue, PerformanceOptimization, ProjectContext, PropInfo, ProviderConfig, ProviderRegistry, RefactorChange, RefactorConfig, RefactorFocusArea, RefactorResult, RefactoringEngine, SignatureHelpResult, SignatureInfo, SuggestionKind, TestCase, TextEdit, TypeInfo, UtilityInfo, analyzePerformance, auditAccessibility, autoDetectProvider, createAI, createAIClient, createAutocompleteEngine, createCodeGenerator, createProgram, createPrompt, createProvider, createRefactoringEngine, explainCode, generateComponent, generateFunction, generateTests, getCompletions, getFixSuggestions, getInlineCompletion, getSignatureHelp, getSuggestions, providerRegistry, providers, refactorCode
- Re-exported names: A11yTest, AIAssistant, APIDocConfig, APIGenerationConfig, APIGenerator, APITypeInference, AccessibilityAnalysis, AccessibilityAudit, AccessibilityConfig, AccessibilityIssue, AdvancedGeneratedDocumentation, AdvancedGeneratedReadme, AdvancedRefactoringEngine, AdvancedTestFramework, AdvancedTestGenOptions, AdvancedTestGenerator, AdvancedTestType, Agent, AgentConfig, AgentStep, AnthropicConfig, AnthropicProvider, AntiPatternResult, AssistantConfig, AssistantConversationMessage, AssistantProjectContext, AutoFixResult, AutocompleteContext, AutocompleteEngine, AutocompleteSuggestion, AvailableImport, BestPracticesResult, CRUDGenerationResult, CRUDOperation, CategorySummary, ChatResponse, ChromaConfig, ChromaVectorStore, ClientCapabilities, CodeAnalyzer, CodeContext, CodeExplanation, CodeGenOptions, CodeGenRefactorResult, CodeGenRequest, CodeGenResult, CodeGenTestCase, CodeGenerator, CodeLocation, CodeMetrics, CodeReviewer, CodeSection, CodeSnippet, CohereConfig, CohereProvider, CompletionItem, CompletionItemKind, ComplexityMetrics, ComponentAnalysis, ComponentCategory, ComponentDoc, ComponentExample, ComponentGenerationConfig, ComponentGenerator, ComponentSuggester, ComponentSuggestion, ComputedAnalysis, ContextAnalysis, ConversationContext, ConversationMessage, CoverageAnalysis, DataLoadingConfig, DatabaseType, DependencyAnalysis, DetectedAntiPattern, DocBlock, DocCoverage, DocGenerationConfig, DocGenerationOptions, DocGenerator, DocParam, DocReturn, DocStyle, DocTag, Document, DocumentLoader, DocumentStore, DocumentationGenerator, DocumentationStyle, E2EScenario, E2EStep, E2ETestConfig, EffectAnalysis, ErrorInfo, EventDoc, EventHandlerAnalysis, FieldDefinition, FieldValidation, FileReview, FixSuggestion, FixtureFile, GeminiConfig, GeminiProvider, GeneratedAPI, GeneratedAPIDoc, GeneratedArtifact, GeneratedCode, GeneratedComponent, GeneratedComponentResult, GeneratedComponentType, GeneratedDocumentation, GeneratedE2ETests, GeneratedFunctionResult, GeneratedPage, GeneratedReadme, GeneratedSchemaComponent, GeneratedTestSuite, GeneratedTests, GeneratedTestsResult, GenerationIntent, InMemoryVectorStore, InferenceConfidence, InferenceSource, InferredInterface, InferredType, InferredTypeAlias, InitializeResult, InlineCompletionResult, IntentEntity, InterfaceProperty, JSONLoader, JSONToTypeResult, LMStudioConfig, LMStudioProvider, LSPHandlers, LSPMessage, LSPRequest, LSPResponse, LayoutConfig, LayoutSuggestion, LineComment, LocalConfig, LocalProvider, MarkdownLoader, MockFile, NLGeneratedCode, NLGenerationOptions, NaturalLanguageGenerator, OpenAIConfig, OpenAIProvider, OptimizationSuggestion, PRReviewResult, PageGenerationConfig, PageGenerator, PageType, ParameterDef, ParameterInfo, ParameterIntent, ParsedIntent, ParsedSchema, PatternDetection, PerformanceAnalysis, PerformanceCategory, PerformanceNote, PhilJSAIExtension, PhilJSLanguageServer, PineconeConfig, PineconeVectorStore, ProjectComponent, ProjectContext, PropAnalysis, PropDefinition, PropDoc, ProviderConfig, ProviderRegistry, QdrantConfig, QdrantVectorStore, RAGOptions, RAGPipeline, ReadmeConfig, ReadmeOptions, RecursiveCharacterSplitter, RefactorChange, RefactorConfig, RefactorFocusArea, RefactorRequest, RefactorResult, RefactoringAnalysisOptions, RefactoringAnalysisResult, RefactoringCategory, RefactoringEngine, RefactoringPlan, RefactoringStep, RefactoringSuggestion, RenderingAnalysis, ReviewAccessibilityIssue, ReviewConfig, ReviewFocus, ReviewIssue, ReviewResult, ReviewSeverity, ReviewSuggestion, ReviewSummary, SEOConfig, SchemaDefinition, SchemaField, SchemaRelation, SchemaToComponentGenerator, SchemaToComponentOptions, SchemaToComponentResult, SchemaType, SearchResult, SecurityCategory, SecurityFinding, ServerCapabilities, ServerConfig, SignatureHelpResult, SignatureInfo, SlotDoc, StateAnalysis, StateDoc, StateIntent, StateVariable, StyleConfig, StylingIntent, SuggestedProp, SuggestionContext, SuggestionPreferences, SuggestionResult, TestCaseInfo, TestCategory, TestCoverageAnalysis, TestFramework, TestGenerationConfig, TestGenerator, TestType, TextLoader, TextSplitter, TokenSplitter, ToolBuilder, ToolCall, ToolDefinition, ToolExecutor, TypeInferenceHelper, TypeInferenceOptions, TypeInferenceResult, TypeSuggestion, UIHints, VectorStore, WireframeConfig, activate, addJSDoc, addJSDocToCode, analyzeComponent, analyzeForRefactoring, analyzePerformance, auditAccessibility, autoDetectProvider, autoFixCode, calculatorTool, codeExecutionTool, convertJavaScriptToTypeScript, createAIAssistant, createAPIGenerator, createAdvancedRefactoringEngine, createAdvancedTestGenerator, createAgent, createAnthropicProvider, createAutoAssistant, createAutocompleteEngine, createCodeAnalyzer, createCodeGenerator, createCodeReviewer, createCohereProvider, createComponentGenerator, createComponentSuggester, createDocGenerator, createDocumentationGenerator, createGeminiProvider, createLMStudioProvider, createLSPHandlers, createLanguageServer, createLocalProvider, createNaturalLanguageGenerator, createOpenAIProvider, createPageGenerator, createProvider, createRefactoringEngine, createSchemaToComponentGenerator, createTestGenerator, createTool, createTypeInferenceHelper, deactivate, detectAntiPatterns, detectUIPatterns, documentPhilJSComponent, euclideanDistance, explainCode, fileReadTool, generateCRUD, generateCRUDFromSchema, generateComponent, generateComponentFromDescription, generateComponentsFromSchema, generateDocs, generateDocumentation, generateE2ETestScenarios, generateE2ETests, generateFromGraphQL, generateFromJSONSchema, generateFromNaturalLanguage, generateFunction, generatePage, generateReadme, generateTestSuite, generateTests, generateTestsFromCode, generateUnitTests, generateUnitTestsForCode, getCompletions, getContributionPoints, getDefaultCapabilities, getFixSuggestions, getInitializeResult, getInlineCompletion, getSignatureHelp, getSuggestions, inferTypesForCode, jsonToTypeScript, parseCodeIntent, providerRegistry, refactorCode, refactorCodeWithAI, startStdioServer, suggestComponents, suggestOptimizations, tool, useRAG, weatherTool, webSearchTool
- Re-exported modules: ./analysis.js, ./anthropic.js, ./assistant/code-reviewer.js, ./assistant/index.js, ./autocomplete/index.js, ./codegen.js, ./codegen/api-generator.js, ./codegen/component-generator.js, ./codegen/natural-language-generator.js, ./codegen/page-generator.js, ./cohere.js, ./doc-generator.js, ./docs/doc-generator.js, ./docs/documentation-generator.js, ./gemini.js, ./inference/type-inference.js, ./lmstudio.js, ./local.js, ./lsp/index.js, ./openai.js, ./providers/anthropic.js, ./providers/cohere.js, ./providers/gemini.js, ./providers/index.js, ./providers/lmstudio.js, ./providers/local.js, ./providers/openai.js, ./rag.js, ./refactor/index.js, ./refactor/refactoring-engine.js, ./schema/schema-to-component.js, ./suggestions/component-suggester.js, ./test-generator.js, ./testing/advanced-test-generator.js, ./testing/test-generator.js, ./tools.js, ./types.js, ./utils/parser.js, ./utils/prompts.js, ./vscode/extension.js
<!-- API_SNAPSHOT_END -->

## License

MIT
