/**
 * Prompt templates for AI code generation
 */

export const SYSTEM_PROMPTS = {
  philjs: `You are an expert PhilJS developer. PhilJS is a fine-grained reactive framework using signals.
Key concepts:
- Use signal() for reactive state
- Use memo() for derived/computed values
- Use effect() for side effects
- Components are functions that return JSX
- No virtual DOM, direct DOM updates via signals
- Efficient by default, minimal rerenders
`,

  typescript: `Generate TypeScript code with proper types.
- Use explicit types for function parameters and returns
- Prefer interfaces over types for object shapes
- Use strict null checks
- Export all public APIs
`,

  testing: `Generate comprehensive tests.
- Test all functionality and edge cases
- Use descriptive test names
- Mock external dependencies
- Include positive and negative test cases
`,
};

export function buildComponentPrompt(description: string, options: {
  includeTests?: boolean;
  includeStyles?: boolean;
  useSignals?: boolean;
}): string {
  const useSignalsText = options.useSignals ? 'Use signals for all reactive state.' : 'Use standard JavaScript state management.';
  const stylesText = options.includeStyles ? 'Include inline styles or CSS-in-JS.' : 'Do not include styles.';

  return `${SYSTEM_PROMPTS.philjs}

Generate a PhilJS component with the following requirements:
${description}

${useSignalsText}
${stylesText}

Return ONLY the component code in a TypeScript code block.
Do not include imports for philjs-core - assume they are available.

Example format:
\`\`\`typescript
export function MyComponent() {
  const [count, setCount] = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`
`;
}

export function buildRoutePrompt(description: string, path: string, options: {
  includeLoader?: boolean;
  includeAction?: boolean;
  includeMetadata?: boolean;
}): string {
  const loaderText = options.includeLoader ? 'Include a loader function for data fetching.' : '';
  const actionText = options.includeAction ? 'Include an action function for form submissions.' : '';
  const metadataText = options.includeMetadata ? 'Include meta tags for SEO.' : '';

  const componentName = toPascalCase(path);
  const loaderExample = options.includeLoader ? `export async function loader() {
  const data = await fetchData();
  return { data };
}

` : '';

  return `${SYSTEM_PROMPTS.philjs}

Generate a PhilJS route for path "${path}" with the following requirements:
${description}

${loaderText}
${actionText}
${metadataText}

Return the route component code in a TypeScript code block.

Example format:
\`\`\`typescript
${loaderExample}export default function ${componentName}() {
  return (
    <div>
      {/* Route content */}
    </div>
  );
}
\`\`\`
`;
}

export function buildTestPrompt(code: string, options: {
  componentName?: string;
  testFramework?: string;
  includeE2E?: boolean;
}): string {
  const framework = options.testFramework || 'vitest';
  const nameText = options.componentName ? `component "${options.componentName}"` : 'code';
  const e2eText = options.includeE2E ? '- End-to-end scenarios' : '';

  return `${SYSTEM_PROMPTS.testing}${SYSTEM_PROMPTS.typescript}

Generate ${framework} tests for the following ${nameText}:

\`\`\`typescript
${code}
\`\`\`

Include tests for:
- Component rendering
- User interactions
- Edge cases
- Error handling
${e2eText}

Return ONLY the test code in a TypeScript code block.
`;
}

export function buildRefactorPrompt(code: string, focusAreas: string[]): string {
  const areas = focusAreas.join(', ');
  return `${SYSTEM_PROMPTS.philjs}

Analyze the following code and suggest refactoring improvements focused on: ${areas}

\`\`\`typescript
${code}
\`\`\`

For each suggestion, provide:
1. Type (signals/performance/accessibility/patterns)
2. Description of the issue
3. Before code (specific section)
4. After code (refactored version)
5. Explanation of the improvement
6. Impact level (high/medium/low)

Return suggestions in JSON format:
\`\`\`json
[
  {
    "type": "signals",
    "description": "...",
    "before": "...",
    "after": "...",
    "explanation": "...",
    "impact": "high"
  }
]
\`\`\`
`;
}

export function buildReviewPrompt(code: string, filePath: string | undefined, aspects: string[]): string {
  const reviewAspects = aspects.join(', ');
  const filePathText = filePath ? `File: ${filePath}` : '';

  return `${SYSTEM_PROMPTS.philjs}

Perform a code review focusing on: ${reviewAspects}

${filePathText}

\`\`\`typescript
${code}
\`\`\`

Provide a detailed review with:
- Issues found (bugs, performance, security, style, patterns)
- Suggestions for improvement
- Overall quality score (0-100)
- Summary of findings

Return in JSON format:
\`\`\`json
{
  "issues": [
    {
      "type": "bug",
      "severity": "error",
      "message": "...",
      "line": 10,
      "suggestion": "..."
    }
  ],
  "suggestions": ["..."],
  "overallScore": 85,
  "summary": "..."
}
\`\`\`
`;
}

export function buildMigrationPrompt(code: string, sourceFramework: string): string {
  const conversionMap = sourceFramework === 'react'
    ? 'useState → signal(), useEffect → effect(), useMemo → memo()'
    : 'Reactive state to signals';

  return `You are an expert in ${sourceFramework} and PhilJS.

Migrate the following ${sourceFramework} code to PhilJS:

\`\`\`typescript
${code}
\`\`\`

Convert:
- ${conversionMap}
- Component syntax to PhilJS functions
- Event handlers to PhilJS conventions
- Imports to philjs-core

Return:
1. Converted PhilJS code
2. List of changes made
3. Any warnings or manual steps needed

Format:
\`\`\`json
{
  "code": "...",
  "changes": [
    {
      "type": "hook",
      "from": "useState",
      "to": "signal()",
      "explanation": "..."
    }
  ],
  "warnings": ["..."],
  "manualSteps": ["..."]
}
\`\`\`
`;
}

export function buildErrorExplanationPrompt(error: string): string {
  return `${SYSTEM_PROMPTS.philjs}

Explain the following PhilJS error and provide solutions:

\`\`\`
${error}
\`\`\`

Provide:
1. Clear explanation of what the error means
2. Possible causes
3. Step-by-step solutions
4. Links to relevant documentation

Return in JSON format:
\`\`\`json
{
  "explanation": "...",
  "possibleCauses": ["..."],
  "solutions": ["..."],
  "relatedDocs": ["..."]
}
\`\`\`
`;
}

export function buildDocumentationPrompt(code: string, options: {
  includeExamples?: boolean;
  includeTypes?: boolean;
  style?: string;
}): string {
  const style = options.style || 'JSDoc';
  const typesText = options.includeTypes ? '- Type information' : '';
  const examplesText = options.includeExamples ? '- Usage examples' : '';

  return `${SYSTEM_PROMPTS.typescript}

Generate ${style} documentation for the following code:

\`\`\`typescript
${code}
\`\`\`

Include:
- Function/component description
- Parameter descriptions
${typesText}
${examplesText}
- Return value description

Return the documented code.
`;
}

// Helper function
function toPascalCase(str: string): string {
  return str
    .split(/[-_/]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
