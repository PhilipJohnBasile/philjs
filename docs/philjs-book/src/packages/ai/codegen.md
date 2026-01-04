# Code Generation

@philjs/ai provides powerful AI-driven code generation capabilities for components, pages, APIs, functions, and more. The code generation system is designed to produce production-quality PhilJS code with proper TypeScript types, accessibility support, and best practices.

## Why AI Code Generation?

- **Speed**: Generate boilerplate in seconds instead of minutes
- **Consistency**: Always follows best practices and patterns
- **Type-safe**: Automatic TypeScript types and interfaces
- **Tested**: Generate tests alongside implementation
- **Documented**: JSDoc and README generation included

## Code Generator

The `CodeGenerator` class provides a unified interface for all code generation tasks.

### Creating a Code Generator

```typescript
import { CodeGenerator, createCodeGenerator, createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY! });

// Using factory function
const generator = createCodeGenerator(provider, {
  temperature: 0.2,
  maxTokens: 4096,
});

// Or instantiate directly
const generator = new CodeGenerator(provider, {
  temperature: 0.2,
  maxTokens: 4096,
});
```

### Generation Options

```typescript
interface CodeGenOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;

  // Code-specific options
  includeTypes?: boolean;     // Include TypeScript types
  includeJSDoc?: boolean;     // Include JSDoc comments
  useSignals?: boolean;       // Use PhilJS signals for state
  framework?: 'philjs' | 'react-compat';
  styleApproach?: 'tailwind' | 'css-modules' | 'styled-components' | 'inline' | 'none';
}
```

## Component Generation

Generate PhilJS components from natural language descriptions.

### Basic Component Generation

```typescript
import { generateComponent, createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: '...' });

const result = await generateComponent(
  provider,
  'A button with primary, secondary, and danger variants, loading state, and click handler',
  'Button'
);

console.log(result.code);
console.log(result.explanation);
console.log(result.imports);
```

### Component Generator Class

For more control, use the `ComponentGenerator` class:

```typescript
import { ComponentGenerator, createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: '...' });
const generator = new ComponentGenerator(provider);

const result = await generator.generateFromDescription({
  name: 'UserCard',
  description: 'A card displaying user avatar, name, email, and role with edit button',
  props: [
    { name: 'user', type: 'User', required: true, description: 'User data' },
    { name: 'onEdit', type: '() => void', required: false, description: 'Edit callback' },
  ],
  style: {
    approach: 'tailwind',
    responsive: true,
    darkMode: true,
  },
  accessibility: {
    wcagLevel: 'AA',
    ariaLabels: true,
    keyboardNav: true,
  },
  includeTests: true,
  includeStories: false,
  useSignals: true,
});

console.log(result.code);
console.log(result.propsInterface);
console.log(result.tests);
console.log(result.accessibilityNotes);
```

### Component Configuration

```typescript
interface ComponentGenerationConfig {
  name: string;                           // Component name
  description: string;                    // Natural language description
  props?: PropDefinition[];               // Component props
  style?: StyleConfig;                    // Styling preferences
  accessibility?: AccessibilityConfig;   // A11y requirements
  includeTests?: boolean;                // Generate tests
  includeStories?: boolean;              // Generate Storybook stories
  useSignals?: boolean;                  // Use PhilJS signals
  framework?: 'philjs' | 'react-compat';
}

interface PropDefinition {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  description?: string;
}

interface StyleConfig {
  approach: 'tailwind' | 'css-modules' | 'styled-components' | 'inline' | 'none';
  theme?: {
    colors?: Record<string, string>;
    spacing?: Record<string, string>;
    typography?: Record<string, string>;
  };
  responsive?: boolean;
  darkMode?: boolean;
}

interface AccessibilityConfig {
  wcagLevel: 'A' | 'AA' | 'AAA';
  ariaLabels?: boolean;
  keyboardNav?: boolean;
  screenReader?: boolean;
  focusManagement?: boolean;
  colorContrast?: boolean;
}
```

### Generated Component Result

```typescript
interface GeneratedComponent {
  code: string;                      // Component source code
  name: string;                      // Component name
  propsInterface?: string;           // Generated props interface
  styles?: string;                   // Generated styles
  tests?: string;                    // Generated tests
  stories?: string;                  // Storybook stories
  explanation: string;               // Explanation of the code
  accessibilityNotes?: string[];     // A11y notes
  examples?: string[];               // Usage examples
  imports: string[];                 // Required imports
  dependencies?: string[];           // NPM dependencies
}
```

### Enhance Accessibility

Add accessibility features to existing components:

```typescript
const enhanced = await generator.enhanceAccessibility(
  existingComponentCode,
  {
    wcagLevel: 'AAA',
    ariaLabels: true,
    keyboardNav: true,
    screenReader: true,
    focusManagement: true,
    colorContrast: true,
  }
);

console.log(enhanced.code);     // Enhanced component
console.log(enhanced.changes);  // List of changes made
console.log(enhanced.notes);    // Accessibility notes
```

### Customize Styling

Apply styling to components:

```typescript
const styled = await generator.customizeStyle(
  existingComponentCode,
  {
    approach: 'tailwind',
    responsive: true,
    darkMode: true,
    theme: {
      colors: { primary: 'blue-500', secondary: 'gray-600' },
      spacing: { sm: '0.5rem', md: '1rem' },
    },
  }
);

console.log(styled.code);
console.log(styled.styles); // For css-modules approach
```

### Generate Variants

Create component variants from a base component:

```typescript
const variants = await generator.generateVariants(
  baseButtonCode,
  ['primary', 'secondary', 'danger', 'ghost', 'link']
);

console.log(variants.primary);
console.log(variants.secondary);
// ... etc
```

## Function Generation

Generate TypeScript functions from descriptions.

```typescript
import { generateFunction, CodeGenerator } from '@philjs/ai';

// Quick helper
const result = await generateFunction(
  provider,
  'A function that debounces another function with configurable delay'
);

// Or with more options
const generator = new CodeGenerator(provider);
const func = await generator.generateFunction(
  'Calculate compound interest with principal, rate, time, and frequency',
  {
    name: 'calculateCompoundInterest',
    async: false,
    includeTypes: true,
    includeJSDoc: true,
  }
);

console.log(func.code);
console.log(func.signature);     // 'function calculateCompoundInterest(...)'
console.log(func.parameters);    // [{ name, type, description }, ...]
console.log(func.returnType);    // 'number'
console.log(func.examples);
```

### Generated Function Result

```typescript
interface GeneratedFunctionResult {
  code: string;
  name: string;
  signature: string;
  parameters: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  returnType: string;
  explanation: string;
  imports: string[];
  examples?: string[];
  validation: { valid: boolean; errors: string[] };
}
```

## Code Refactoring

Refactor existing code with AI assistance.

```typescript
import { refactorCode, CodeGenerator } from '@philjs/ai';

// Quick helper
const result = await refactorCode(
  provider,
  existingCode,
  'Convert to use PhilJS signals and improve performance'
);

// With options
const generator = new CodeGenerator(provider);
const refactored = await generator.refactorCode(
  existingCode,
  'Add error handling and improve type safety',
  {
    preserveBehavior: true,
    level: 'moderate', // 'conservative' | 'moderate' | 'aggressive'
  }
);

console.log(refactored.original);
console.log(refactored.refactored);
console.log(refactored.changes);
console.log(refactored.explanation);
console.log(refactored.breakingChanges);
```

### Refactor Result

```typescript
interface RefactorResult {
  original: string;
  refactored: string;
  changes: RefactorChange[];
  explanation: string;
  breakingChanges?: string[];
}

interface RefactorChange {
  type: 'performance' | 'readability' | 'patterns' | 'signals' | 'types' | 'security' | 'style';
  description: string;
  before: string;
  after: string;
  lines?: { start: number; end: number };
}
```

## Code Explanation

Get detailed explanations of code functionality.

```typescript
import { explainCode, CodeGenerator } from '@philjs/ai';

// Quick helper
const explanation = await explainCode(provider, complexCode);

// With options
const generator = new CodeGenerator(provider);
const detailed = await generator.explainCode(
  complexCode,
  {
    detailLevel: 'comprehensive', // 'brief' | 'detailed' | 'comprehensive'
    audience: 'intermediate',     // 'beginner' | 'intermediate' | 'expert'
  }
);

console.log(detailed.summary);     // High-level summary
console.log(detailed.detailed);    // Detailed explanation
console.log(detailed.sections);    // Code sections with explanations
console.log(detailed.concepts);    // Key concepts used
console.log(detailed.complexity);  // Complexity assessment
```

### Code Explanation Result

```typescript
interface CodeExplanation {
  summary: string;
  detailed: string;
  sections: CodeSection[];
  concepts: string[];
  complexity: {
    level: 'simple' | 'moderate' | 'complex';
    score: number;  // 1-10
    factors: string[];
  };
}

interface CodeSection {
  name: string;
  code: string;
  explanation: string;
  lines: { start: number; end: number };
}
```

## Test Generation

Generate comprehensive tests for your code.

```typescript
import { generateTests, CodeGenerator } from '@philjs/ai';

// Quick helper
const tests = await generateTests(provider, functionCode);

// With options
const generator = new CodeGenerator(provider);
const testSuite = await generator.generateTests(
  componentCode,
  {
    framework: 'vitest',  // 'vitest' | 'jest'
    name: 'UserCard',
    coverage: ['happy-path', 'edge-cases', 'error-handling', 'async'],
    includeMocks: true,
  }
);

console.log(testSuite.code);
console.log(testSuite.testCount);
console.log(testSuite.testCases);
console.log(testSuite.coverage);
console.log(testSuite.setup);
console.log(testSuite.mocks);
```

### Generated Tests Result

```typescript
interface GeneratedTestsResult {
  code: string;
  framework: 'vitest' | 'jest';
  testCount: number;
  testCases: TestCase[];
  coverage: string[];
  setup?: string;
  mocks?: string;
}

interface TestCase {
  name: string;
  description: string;
  category: 'happy-path' | 'edge-case' | 'error-handling' | 'integration' | 'performance';
}
```

## Code Completion

Get AI-powered code completions (Copilot-style).

```typescript
const generator = new CodeGenerator(provider);

const completion = await generator.getCompletion(
  'function calculateTotal(items: CartItem[])',  // prefix
  '}\n\n// Usage example',                         // suffix
  {
    maxLength: 200,
    language: 'typescript',
  }
);

console.log(completion);
// ': number {\n  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);\n'
```

## Natural Language Code Generation

Generate code from natural language descriptions with intent parsing.

```typescript
import {
  NaturalLanguageGenerator,
  createNaturalLanguageGenerator,
  generateFromNaturalLanguage,
  parseCodeIntent,
} from '@philjs/ai';

const nlGenerator = createNaturalLanguageGenerator(provider);

// Generate from description
const result = await nlGenerator.generate(
  'Create a login form with email and password validation that shows errors and has a submit button'
);

// Parse intent first
const intent = await nlGenerator.parseIntent(
  'Make a dropdown menu with options for sorting by date, name, and price'
);

console.log(intent.type);      // 'component'
console.log(intent.entities);  // Detected entities
console.log(intent.params);    // Inferred parameters

// Conversational code generation
const conversation = await nlGenerator.startConversation(
  'I need a data table component'
);

const refined = await nlGenerator.continueConversation(
  conversation.id,
  'Add sorting and pagination'
);

const final = await nlGenerator.continueConversation(
  conversation.id,
  'Make it use server-side data fetching'
);
```

## Page Generation

Generate complete pages with routing integration.

```typescript
import { PageGenerator, createPageGenerator } from '@philjs/ai';

const pageGenerator = createPageGenerator(provider);

const page = await pageGenerator.generatePage({
  name: 'Dashboard',
  path: '/dashboard',
  description: 'Admin dashboard with stats cards, recent activity, and charts',
  pageType: 'dashboard',
  layout: {
    type: 'sidebar',
    sections: ['header', 'sidebar', 'main', 'footer'],
  },
  seo: {
    title: 'Dashboard - MyApp',
    description: 'View your dashboard and analytics',
  },
  dataLoading: {
    strategy: 'ssr',
    loader: true,
  },
});

console.log(page.code);
console.log(page.layout);
console.log(page.loaderCode);
console.log(page.metaCode);
```

## API Generation

Generate CRUD APIs for resources.

```typescript
import { APIGenerator, createAPIGenerator, generateCRUD } from '@philjs/ai';

const apiGenerator = createAPIGenerator(provider);

// Generate CRUD endpoints
const api = await apiGenerator.generateCRUD({
  resource: 'products',
  schema: {
    name: 'Product',
    fields: [
      { name: 'id', type: 'string', primary: true },
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string' },
      { name: 'price', type: 'number', required: true },
      { name: 'stock', type: 'number', default: '0' },
      { name: 'categoryId', type: 'string', reference: 'categories' },
    ],
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  database: 'prisma',
  validation: true,
  authentication: true,
});

console.log(api.routes);
console.log(api.handlers);
console.log(api.types);
console.log(api.validationSchemas);
```

## Schema to Component

Generate components from schemas (JSON Schema, GraphQL, Prisma).

```typescript
import { SchemaToComponentGenerator, generateFromJSONSchema, generateFromGraphQL } from '@philjs/ai';

const schemaGenerator = new SchemaToComponentGenerator(provider);

// From JSON Schema
const formComponents = await schemaGenerator.generate(
  jsonSchemaString,
  {
    schemaType: 'json-schema',
    componentTypes: ['form', 'table', 'detail'],
  }
);

// From GraphQL
const graphqlComponents = await schemaGenerator.generate(
  graphqlSchemaString,
  {
    schemaType: 'graphql',
    componentTypes: ['form', 'list'],
  }
);

// Generate full CRUD
const crud = await schemaGenerator.generateCRUD(
  schemaString,
  { schemaType: 'prisma' }
);

console.log(crud.listComponent);
console.log(crud.formComponent);
console.log(crud.detailComponent);
console.log(crud.deleteConfirmation);
```

## Type Inference

Infer TypeScript types from code and data.

```typescript
import { TypeInferenceHelper, jsonToTypeScript, convertJavaScriptToTypeScript } from '@philjs/ai';

const typeHelper = new TypeInferenceHelper(provider);

// Infer types for code
const result = await typeHelper.inferTypes(
  jsCode,
  { strictMode: true }
);

console.log(result.interfaces);
console.log(result.typeAliases);
console.log(result.suggestions);

// From JSON data
const types = await typeHelper.inferFromJSON(
  { name: 'John', age: 30, tags: ['dev', 'js'] },
  'User'
);

console.log(types.code);
// interface User {
//   name: string;
//   age: number;
//   tags: string[];
// }

// Convert JS to TS
const tsCode = await typeHelper.convertJSToTS(jsCode);
```

## Advanced Test Generator

Enhanced test generation with more features.

```typescript
import { AdvancedTestGenerator, generateTestSuite, generateE2ETestScenarios } from '@philjs/ai';

const testGenerator = new AdvancedTestGenerator(provider);

// Comprehensive test suite
const suite = await testGenerator.generateTestSuite(
  componentCode,
  {
    framework: 'vitest',
    types: ['unit', 'integration', 'snapshot'],
    coverage: {
      statements: 80,
      branches: 75,
      functions: 80,
    },
  }
);

// E2E test scenarios
const e2e = await testGenerator.generateE2EScenarios(
  'An e-commerce checkout flow with cart, shipping, payment, and confirmation'
);

console.log(e2e.scenarios);
console.log(e2e.steps);

// Accessibility tests
const a11yTests = await testGenerator.generateA11yTests(
  componentCode,
  { wcagLevel: 'AA' }
);
```

## Documentation Generator

Generate comprehensive documentation for code.

```typescript
import { DocumentationGenerator, generateDocumentation, addJSDocToCode } from '@philjs/ai';

const docGenerator = new DocumentationGenerator(provider);

// Generate documentation
const docs = await docGenerator.generateDocs(
  componentCode,
  {
    style: 'jsdoc',
    includeExamples: true,
    includeTypes: true,
  }
);

// Document a component
const componentDoc = await docGenerator.documentComponent(componentCode);

console.log(componentDoc.props);
console.log(componentDoc.state);
console.log(componentDoc.events);
console.log(componentDoc.examples);

// Generate README
const readme = await docGenerator.generateReadme(
  projectFiles,
  { projectName: 'MyApp' }
);
```

## AI Client Convenience Methods

All code generation is also available through the AI client:

```typescript
import { createAIClient, createOpenAIProvider } from '@philjs/ai';

const ai = createAIClient(createOpenAIProvider({ apiKey: '...' }));

// Component generation
const component = await ai.generateComponent('A modal dialog', 'Modal');

// Function generation
const func = await ai.generateFunction('Sort array by multiple keys');

// Page generation
const page = await ai.generatePage('User profile page', 'Profile', '/profile');

// API generation
const api = await ai.generateAPI('users', userSchema);

// Refactoring
const refactored = await ai.refactorCode(code, 'use signals');

// Explanation
const explanation = await ai.explainCode(code);

// Test generation
const tests = await ai.generateTests(code, 'unit');

// Documentation
const docs = await ai.addDocs(code, 'jsdoc');

// Natural language generation
const generated = await ai.generateFromDescription('Create a search input');

// Type inference
const types = await ai.inferTypes(jsCode);

// JS to TS conversion
const tsCode = await ai.jsToTs(jsCode);

// Schema to components
const components = await ai.componentsFromSchema(schema, {
  schemaType: 'json-schema',
  componentTypes: ['form', 'table'],
});
```

## Parsing Utilities

Validate and extract code from AI responses:

```typescript
import { extractCode, extractJSON, validateCode } from '@philjs/ai';

// Extract code blocks from markdown
const code = extractCode(aiResponse);
// Extracts content from ```typescript ... ``` blocks

// Extract JSON from response
const json = extractJSON<{ name: string }>(aiResponse);

// Validate generated code
const validation = validateCode(code);

if (!validation.valid) {
  console.warn('Validation errors:', validation.errors);
}
```

## Best Practices

1. **Be Specific** - Detailed descriptions yield better results
2. **Include Requirements** - Specify accessibility, styling, and other requirements upfront
3. **Use Types** - Enable TypeScript types for better code quality
4. **Validate Output** - Always review and test generated code
5. **Iterate** - Use refactoring to improve generated code
6. **Provide Context** - Include existing code patterns for consistency
7. **Low Temperature** - Use 0.1-0.3 for deterministic code generation

## Next Steps

- [RAG Pipeline](./rag.md) - Context-aware generation
- [Structured Output](./structured-output.md) - Type-safe responses
- [Tool Calling](./tools.md) - AI agents for complex tasks
- [Streaming](./streaming.md) - Handle streaming completions
- [API Reference](./api-reference.md) - Complete API documentation
