# AI Code Generation

@philjs/ai provides comprehensive AI-powered code generation that turns natural language descriptions into production-ready PhilJS code. Generate components, pages, APIs, functions, tests, and documentation with a single function call.

## Why AI Code Generation?

- **Speed**: Generate boilerplate in seconds instead of minutes
- **Consistency**: Always follows best practices and patterns
- **Type-safe**: Automatic TypeScript types and interfaces
- **Tested**: Generate tests alongside implementation
- **Documented**: JSDoc and README generation included

## Code Generator

### Basic Setup

```typescript
import { createOpenAIProvider, createCodeGenerator, CodeGenerator } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });

const codegen = createCodeGenerator(provider, {
  temperature: 0.2,      // Lower = more deterministic
  maxTokens: 4096,       // Max tokens for generation
});

// Or instantiate directly
const codegen = new CodeGenerator(provider);
```

### Generate Components

```typescript
const result = await codegen.generateComponent(
  'A user profile card with avatar, name, bio, and social links',
  {
    useSignals: true,      // Use PhilJS signals for state
    includeTypes: true,    // Generate TypeScript interfaces
    includeJSDoc: true,    // Add JSDoc comments
    styleApproach: 'tailwind', // 'tailwind' | 'css-modules' | 'inline' | 'none'
    framework: 'philjs',   // Target framework
  }
);

console.log(result.code);
// export function UserProfileCard({ user }: UserProfileCardProps) {
//   return (
//     <div class="bg-white rounded-lg shadow p-6">
//       <img class="w-20 h-20 rounded-full" src={user.avatar} alt={user.name} />
//       <h2 class="text-xl font-bold">{user.name}</h2>
//       <p class="text-gray-600">{user.bio}</p>
//       ...
//     </div>
//   );
// }

console.log(result.types);
// interface UserProfileCardProps {
//   user: {
//     avatar: string;
//     name: string;
//     bio: string;
//     social: { platform: string; url: string; }[];
//   };
// }
```

### Generate Functions

```typescript
const fn = await codegen.generateFunction(
  'Parse a currency string like "$1,234.56" into cents with validation',
  {
    name: 'parseCurrency',
    async: false,
    includeTypes: true,
  }
);

console.log(fn.code);
// function parseCurrency(value: string): number | null {
//   const cleaned = value.replace(/[$,]/g, '');
//   const parsed = parseFloat(cleaned);
//   if (isNaN(parsed)) return null;
//   return Math.round(parsed * 100);
// }

console.log(fn.signature);
// (value: string) => number | null
```

### Refactor Code

```typescript
const refactor = await codegen.refactorCode(
  existingCode,
  'Convert useState to signals and optimize for fine-grained reactivity'
);

console.log(refactor.refactored);
// Original:
// const [count, setCount] = useState(0);
// <button onClick={() => setCount(count + 1)}>
//
// Refactored:
// const count = signal(0);
// <button onClick={() => count.set(count() + 1)}>

console.log(refactor.changes);
// [{ type: 'state', from: 'useState', to: 'signal', explanation: '...' }]
```

### Explain Code

```typescript
const explanation = await codegen.explainCode(complexCode, {
  detailLevel: 'detailed', // 'brief' | 'detailed' | 'comprehensive'
});

console.log(explanation.summary);
// "This component implements a drag-and-drop list using..."

console.log(explanation.sections);
// [
//   { title: 'State Management', content: 'Uses signals for...' },
//   { title: 'Event Handling', content: 'The drag handlers...' },
//   { title: 'Rendering', content: 'Maps over items to...' },
// ]
```

### Generate Tests

```typescript
const tests = await codegen.generateTests(componentCode, 'unit');

console.log(tests.code);
// import { describe, it, expect } from 'vitest';
// import { render, fireEvent } from '@philjs/testing';
// import { UserProfileCard } from './UserProfileCard';
//
// describe('UserProfileCard', () => {
//   it('renders user name', () => {
//     const { getByText } = render(<UserProfileCard user={mockUser} />);
//     expect(getByText('John Doe')).toBeTruthy();
//   });
//   ...
// });

console.log(tests.coverage);
// ['renders user name', 'displays avatar', 'shows bio', 'lists social links']
```

## Component Generator

Dedicated generator for components with more options:

```typescript
import { ComponentGenerator, createComponentGenerator } from '@philjs/ai';

const generator = createComponentGenerator(provider);

// Generate from description
const component = await generator.generateFromDescription({
  name: 'TodoList',
  description: 'A todo list with add, complete, and delete functionality',
  useSignals: true,
  includeTests: true,
  styleConfig: {
    approach: 'tailwind',
    theme: 'light',
  },
  accessibility: {
    ariaLabels: true,
    keyboardNavigation: true,
  },
});

console.log(component.component);     // Component code
console.log(component.tests);         // Test file
console.log(component.types);         // Type definitions
console.log(component.styles);        // CSS (if applicable)
```

## Page Generator

Generate full pages with routing, data loading, and layout:

```typescript
import { PageGenerator, createPageGenerator } from '@philjs/ai';

const pageGen = createPageGenerator(provider);

const page = await pageGen.generatePage({
  name: 'Dashboard',
  path: '/dashboard',
  description: 'Admin dashboard with stats cards, charts, and recent activity',
  layout: 'sidebar',
  dataLoading: {
    loader: true,
    suspense: true,
  },
  seo: {
    title: 'Dashboard | MyApp',
    description: 'View your dashboard',
  },
});

console.log(page.component);  // Page component
console.log(page.route);      // Route definition
console.log(page.loader);     // Data loader function
console.log(page.meta);       // Meta component
```

## API Generator

Generate CRUD APIs and endpoints:

```typescript
import { APIGenerator, createAPIGenerator, generateCRUD } from '@philjs/ai';

const apiGen = createAPIGenerator(provider);

// Generate full CRUD
const api = await apiGen.generateCRUD({
  resource: 'products',
  schema: {
    id: { type: 'string', primary: true },
    name: { type: 'string', required: true },
    price: { type: 'number', required: true },
    category: { type: 'string', enum: ['electronics', 'clothing', 'food'] },
    inStock: { type: 'boolean', default: true },
  },
  database: 'prisma',      // 'prisma' | 'drizzle' | 'raw-sql'
  authentication: 'jwt',    // 'jwt' | 'session' | 'none'
  validation: 'zod',        // 'zod' | 'yup' | 'none'
});

console.log(api.endpoints);
// [
//   { method: 'GET', path: '/products', code: '...' },
//   { method: 'GET', path: '/products/:id', code: '...' },
//   { method: 'POST', path: '/products', code: '...' },
//   { method: 'PUT', path: '/products/:id', code: '...' },
//   { method: 'DELETE', path: '/products/:id', code: '...' },
// ]

console.log(api.schema);     // Prisma/Drizzle schema
console.log(api.validation); // Zod schemas
console.log(api.types);      // TypeScript types
```

## Natural Language Generator

Generate code from conversational descriptions:

```typescript
import { NaturalLanguageGenerator, createNaturalLanguageGenerator } from '@philjs/ai';

const nlGen = createNaturalLanguageGenerator(provider);

// Parse intent from description
const intent = await nlGen.parseIntent(
  'Make a button that shows a loading spinner when clicked and fetches user data'
);

console.log(intent);
// {
//   type: 'component',
//   entities: ['button', 'spinner', 'user data'],
//   state: ['loading', 'userData'],
//   events: ['click', 'fetch'],
// }

// Generate code from description
const generated = await nlGen.generate(
  'Create a form with email and password fields that validates on submit'
);

// Conversational generation
const conversation = await nlGen.startConversation('I need a data table');
let response = await conversation.send('Add sorting by column');
response = await conversation.send('Also add pagination');
console.log(response.code); // Complete table with sorting and pagination
```

## Test Generator

Advanced test generation with coverage analysis:

```typescript
import { AdvancedTestGenerator, createAdvancedTestGenerator } from '@philjs/ai';

const testGen = createAdvancedTestGenerator(provider);

// Generate comprehensive test suite
const suite = await testGen.generateTestSuite(componentCode, {
  framework: 'vitest',   // 'vitest' | 'jest'
  types: ['unit', 'integration'],
  coverage: {
    statements: 80,
    branches: 75,
  },
});

console.log(suite.tests);      // Test code
console.log(suite.mocks);      // Mock files
console.log(suite.fixtures);   // Test fixtures
console.log(suite.coverage);   // Coverage analysis

// Generate E2E scenarios
const e2e = await testGen.generateE2EScenarios(
  'User can sign up, log in, and update their profile'
);

console.log(e2e.scenarios);
// [
//   { name: 'User signup flow', steps: [...] },
//   { name: 'User login flow', steps: [...] },
//   { name: 'Profile update flow', steps: [...] },
// ]

// Generate accessibility tests
const a11y = await testGen.generateA11yTests(componentCode, {
  wcagLevel: 'AA',
});
```

## Documentation Generator

Generate docs and JSDoc:

```typescript
import { DocumentationGenerator, createDocumentationGenerator } from '@philjs/ai';

const docGen = createDocumentationGenerator(provider);

// Add JSDoc to code
const documented = await docGen.addJSDoc(undocumentedCode);

// Generate component documentation
const componentDoc = await docGen.documentComponent(componentCode);

console.log(componentDoc.description);
console.log(componentDoc.props);      // Prop documentation
console.log(componentDoc.events);     // Event handlers
console.log(componentDoc.examples);   // Usage examples

// Generate README
const readme = await docGen.generateReadme(projectFiles, {
  projectName: 'My Project',
  includeInstallation: true,
  includeUsage: true,
  includeAPI: true,
});
```

## Type Inference Helper

Infer and generate types:

```typescript
import { TypeInferenceHelper, createTypeInferenceHelper } from '@philjs/ai';

const typeHelper = createTypeInferenceHelper(provider);

// Infer types from JavaScript code
const types = await typeHelper.inferTypes(jsCode);

console.log(types.interfaces);  // Generated interfaces
console.log(types.suggestions); // Type suggestions

// Convert JSON to TypeScript
const tsTypes = await typeHelper.inferFromJSON(jsonData, 'ApiResponse');
// interface ApiResponse {
//   id: string;
//   data: { ... };
// }

// Convert JS to TS
const tsCode = await typeHelper.convertJSToTS(jsCode);
```

## Schema to Component

Generate components from schemas:

```typescript
import { SchemaToComponentGenerator, createSchemaToComponentGenerator } from '@philjs/ai';

const schemaGen = createSchemaToComponentGenerator(provider);

// From JSON Schema
const components = await schemaGen.generate(jsonSchema, {
  schemaType: 'json-schema',
  componentTypes: ['form', 'table', 'detail'],
});

// From GraphQL
const graphqlComponents = await schemaGen.generateFromGraphQL(
  graphqlSchema,
  {
    operations: ['query', 'mutation'],
  }
);

// Generate full CRUD from schema
const crud = await schemaGen.generateCRUD(schema, {
  schemaType: 'prisma',
});

console.log(crud.list);    // List component
console.log(crud.create);  // Create form
console.log(crud.edit);    // Edit form
console.log(crud.detail);  // Detail view
console.log(crud.delete);  // Delete confirmation
```

## Code Generation Options

```typescript
interface CodeGenOptions {
  // Output options
  includeTypes?: boolean;     // Generate TypeScript types
  includeJSDoc?: boolean;     // Add JSDoc comments
  useSignals?: boolean;       // Use PhilJS signals

  // Framework
  framework?: 'philjs' | 'react-compat';

  // Styling
  styleApproach?: 'tailwind' | 'css-modules' | 'inline' | 'none';

  // Model options
  temperature?: number;       // 0-1, lower = more deterministic
  maxTokens?: number;         // Max tokens for response
}
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

1. **Be specific**: Detailed descriptions produce better results
2. **Include examples**: Reference existing code patterns
3. **Review output**: AI-generated code should be reviewed
4. **Test thoroughly**: Always test generated code
5. **Iterate**: Use conversational generation for complex requirements
6. **Low temperature**: Use 0.1-0.3 for deterministic code generation

## Next Steps

- [Streaming](./streaming.md) - Handle streaming completions
- [RAG Pipeline](./rag.md) - Retrieval augmented generation
- [Tools & Agents](./tools.md) - Build AI agents
