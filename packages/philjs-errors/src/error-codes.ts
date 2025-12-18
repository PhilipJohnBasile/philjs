/**
 * PhilJS Error Codes and Catalog
 *
 * Comprehensive error catalog with codes, messages, and actionable suggestions.
 */

export interface PhilJSError extends Error {
  code: string;
  category: ErrorCategory;
  suggestions: ErrorSuggestion[];
  documentationUrl?: string;
  sourceLocation?: SourceLocation;
  relatedErrors?: string[];
}

export interface ErrorSuggestion {
  description: string;
  codeExample?: {
    before: string;
    after: string;
  };
  autoFixable?: boolean;
  confidence?: number;
  links?: string[];
}

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
  source?: string;
}

export type ErrorCategory =
  | 'signal'
  | 'ssr'
  | 'hydration'
  | 'router'
  | 'compiler'
  | 'component'
  | 'lifecycle'
  | 'type'
  | 'runtime';

export interface ErrorDefinition {
  code: string;
  category: ErrorCategory;
  title: string;
  message: (context?: Record<string, any>) => string;
  suggestions: ErrorSuggestion[];
  severity: 'error' | 'warning' | 'info';
  documentationPath: string;
}

/**
 * Base URL for documentation
 */
const DOCS_BASE = 'https://philjs.dev/docs/troubleshooting/error-codes';

/**
 * Error catalog with all defined PhilJS errors
 */
export const ERROR_CATALOG: Record<string, ErrorDefinition> = {
  // ============================================================================
  // Signal Errors (PHIL-001 to PHIL-099)
  // ============================================================================

  'PHIL-001': {
    code: 'PHIL-001',
    category: 'signal',
    title: 'Signal Read During Update',
    message: (ctx) =>
      `Cannot read signal '${ctx?.signalName || 'unknown'}' during its own update. This creates an infinite loop.`,
    suggestions: [
      {
        description: 'Use signal.peek() to read the current value without tracking dependencies',
        codeExample: {
          before: `const count = signal(0);\ncount.set(count() + 1); // Error!`,
          after: `const count = signal(0);\ncount.set(count.peek() + 1); // OK`,
        },
        autoFixable: true,
        confidence: 0.95,
      },
      {
        description: 'Use an updater function to access the previous value',
        codeExample: {
          before: `count.set(count() + 1);`,
          after: `count.set(prev => prev + 1);`,
        },
        autoFixable: true,
        confidence: 0.9,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-001-signal-read-during-update',
  },

  'PHIL-002': {
    code: 'PHIL-002',
    category: 'signal',
    title: 'Circular Signal Dependency',
    message: (ctx) =>
      `Circular dependency detected in signal graph: ${ctx?.cycle?.join(' -> ') || 'unknown cycle'}`,
    suggestions: [
      {
        description: 'Break the circular dependency by using untrack() for one of the reads',
        codeExample: {
          before: `const a = memo(() => b());\nconst b = memo(() => a()); // Circular!`,
          after: `const a = memo(() => b());\nconst b = memo(() => untrack(() => a())); // OK`,
        },
        autoFixable: false,
        confidence: 0.8,
        links: [`${DOCS_BASE}#breaking-circular-dependencies`],
      },
      {
        description: 'Restructure your reactive graph to avoid the circular dependency',
        confidence: 0.7,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-002-circular-signal-dependency',
  },

  'PHIL-003': {
    code: 'PHIL-003',
    category: 'signal',
    title: 'Signal Updated Outside Batch',
    message: (ctx) =>
      `${ctx?.count || 'Multiple'} signals updated consecutively without batching. This may cause unnecessary re-renders.`,
    suggestions: [
      {
        description: 'Wrap multiple signal updates in batch() to prevent unnecessary re-computations',
        codeExample: {
          before: `firstName.set('John');\nlastName.set('Doe');\nage.set(30); // 3 separate updates!`,
          after: `batch(() => {\n  firstName.set('John');\n  lastName.set('Doe');\n  age.set(30);\n}); // Single update`,
        },
        autoFixable: true,
        confidence: 0.9,
      },
    ],
    severity: 'warning',
    documentationPath: '#phil-003-signal-updated-outside-batch',
  },

  'PHIL-004': {
    code: 'PHIL-004',
    category: 'signal',
    title: 'Effect Missing Cleanup',
    message: (ctx) =>
      `Effect at ${ctx?.location || 'unknown location'} does not return a cleanup function. This may cause memory leaks.`,
    suggestions: [
      {
        description: 'Return a cleanup function from your effect to prevent memory leaks',
        codeExample: {
          before: `effect(() => {\n  const timer = setInterval(() => {}, 1000);\n  // Missing cleanup!\n});`,
          after: `effect(() => {\n  const timer = setInterval(() => {}, 1000);\n  return () => clearInterval(timer);\n});`,
        },
        autoFixable: false,
        confidence: 0.85,
      },
      {
        description: 'Use onCleanup() for more complex cleanup scenarios',
        codeExample: {
          before: `effect(() => {\n  const sub = observable.subscribe();\n});`,
          after: `effect(() => {\n  const sub = observable.subscribe();\n  onCleanup(() => sub.unsubscribe());\n});`,
        },
        confidence: 0.8,
      },
    ],
    severity: 'warning',
    documentationPath: '#phil-004-effect-missing-cleanup',
  },

  'PHIL-005': {
    code: 'PHIL-005',
    category: 'signal',
    title: 'Memo Returning Undefined',
    message: (ctx) =>
      `Memo computation at ${ctx?.location || 'unknown location'} returns undefined. Ensure your memo function returns a value.`,
    suggestions: [
      {
        description: 'Make sure your memo function explicitly returns a value',
        codeExample: {
          before: `const total = memo(() => {\n  items().forEach(item => sum += item.price);\n  // Missing return!\n});`,
          after: `const total = memo(() => {\n  return items().reduce((sum, item) => sum + item.price, 0);\n});`,
        },
        autoFixable: false,
        confidence: 0.9,
      },
    ],
    severity: 'warning',
    documentationPath: '#phil-005-memo-returning-undefined',
  },

  // ============================================================================
  // SSR Errors (PHIL-100 to PHIL-199)
  // ============================================================================

  'PHIL-100': {
    code: 'PHIL-100',
    category: 'hydration',
    title: 'Hydration Mismatch',
    message: (ctx) =>
      `Hydration mismatch detected at ${ctx?.path || 'unknown'}. Server HTML does not match client render.`,
    suggestions: [
      {
        description: 'Ensure the initial state matches between server and client',
        codeExample: {
          before: `// Server renders with default, client with random\nconst value = signal(Math.random());`,
          after: `// Pass initial value from server\nconst value = signal(window.__INITIAL_STATE__.value);`,
        },
        confidence: 0.85,
        links: [`${DOCS_BASE}#hydration-best-practices`],
      },
      {
        description: 'Avoid using browser-only APIs during SSR',
        codeExample: {
          before: `const width = signal(window.innerWidth); // Fails on server!`,
          after: `const width = signal(typeof window !== 'undefined' ? window.innerWidth : 0);`,
        },
        confidence: 0.8,
      },
      {
        description: 'Check for date/time rendering differences between server and client',
        confidence: 0.7,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-100-hydration-mismatch',
  },

  'PHIL-101': {
    code: 'PHIL-101',
    category: 'ssr',
    title: 'Browser API Called During SSR',
    message: (ctx) =>
      `Browser API '${ctx?.api || 'unknown'}' called during server-side rendering. This API is not available on the server.`,
    suggestions: [
      {
        description: 'Guard browser API usage with environment checks',
        codeExample: {
          before: `const data = localStorage.getItem('key'); // Fails on server!`,
          after: `const data = typeof window !== 'undefined' \n  ? localStorage.getItem('key')\n  : null;`,
        },
        autoFixable: true,
        confidence: 0.95,
      },
      {
        description: 'Use effects to run code only on the client',
        codeExample: {
          before: `document.title = 'My App'; // Top-level SSR error`,
          after: `effect(() => {\n  if (typeof document !== 'undefined') {\n    document.title = 'My App';\n  }\n});`,
        },
        confidence: 0.9,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-101-browser-api-during-ssr',
  },

  'PHIL-102': {
    code: 'PHIL-102',
    category: 'ssr',
    title: 'Missing SSR Data',
    message: (ctx) =>
      `Required data for SSR not available. Expected '${ctx?.dataKey || 'data'}' to be present.`,
    suggestions: [
      {
        description: 'Ensure data is fetched before rendering on the server',
        codeExample: {
          before: `// Data not loaded\nexport function render() {\n  return <App user={user()} />;\n}`,
          after: `export async function getServerData() {\n  const user = await fetchUser();\n  return { user };\n}\n\nexport function render({ user }) {\n  return <App user={user} />;\n}`,
        },
        confidence: 0.85,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-102-missing-ssr-data',
  },

  // ============================================================================
  // Router Errors (PHIL-200 to PHIL-299)
  // ============================================================================

  'PHIL-200': {
    code: 'PHIL-200',
    category: 'router',
    title: 'Invalid Route Pattern',
    message: (ctx) =>
      `Invalid route pattern: '${ctx?.pattern || 'unknown'}'. ${ctx?.reason || 'Check syntax'}.`,
    suggestions: [
      {
        description: 'Use valid route pattern syntax',
        codeExample: {
          before: `<Route path="users/:id*extra" /> // Invalid`,
          after: `<Route path="users/:id" />\n// or for wildcard:\n<Route path="users/*" />`,
        },
        confidence: 0.9,
        links: [`${DOCS_BASE}#route-pattern-syntax`],
      },
      {
        description: 'Ensure parameter names are valid identifiers',
        codeExample: {
          before: `<Route path="/:user-name" /> // Hyphen not allowed`,
          after: `<Route path="/:userName" /> // Use camelCase`,
        },
        confidence: 0.85,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-200-invalid-route-pattern',
  },

  'PHIL-201': {
    code: 'PHIL-201',
    category: 'router',
    title: 'Missing Route Parameter',
    message: (ctx) =>
      `Route parameter '${ctx?.paramName || 'unknown'}' is required but not provided in navigation.`,
    suggestions: [
      {
        description: 'Provide all required route parameters when navigating',
        codeExample: {
          before: `navigate('/users'); // Missing :id parameter`,
          after: `navigate('/users/123'); // Provide the id`,
        },
        confidence: 0.95,
      },
      {
        description: 'Make the parameter optional in the route pattern',
        codeExample: {
          before: `<Route path="/users/:id" />`,
          after: `<Route path="/users/:id?" /> // Optional parameter`,
        },
        confidence: 0.8,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-201-missing-route-parameter',
  },

  'PHIL-202': {
    code: 'PHIL-202',
    category: 'router',
    title: 'Route Not Found',
    message: (ctx) =>
      `No route matches path '${ctx?.path || 'unknown'}'. Did you forget to add a catch-all route?`,
    suggestions: [
      {
        description: 'Add a catch-all route to handle unmatched paths',
        codeExample: {
          before: `<Routes>\n  <Route path="/" component={Home} />\n  <Route path="/about" component={About} />\n</Routes>`,
          after: `<Routes>\n  <Route path="/" component={Home} />\n  <Route path="/about" component={About} />\n  <Route path="*" component={NotFound} />\n</Routes>`,
        },
        confidence: 0.9,
      },
    ],
    severity: 'warning',
    documentationPath: '#phil-202-route-not-found',
  },

  // ============================================================================
  // Compiler Errors (PHIL-300 to PHIL-399)
  // ============================================================================

  'PHIL-300': {
    code: 'PHIL-300',
    category: 'compiler',
    title: 'Invalid JSX Syntax',
    message: (ctx) =>
      `Invalid JSX syntax at ${ctx?.location || 'unknown location'}: ${ctx?.details || 'syntax error'}`,
    suggestions: [
      {
        description: 'Ensure all JSX tags are properly closed',
        codeExample: {
          before: `<div>\n  <p>Hello\n</div> // Missing </p>`,
          after: `<div>\n  <p>Hello</p>\n</div>`,
        },
        confidence: 0.9,
      },
      {
        description: 'Check for invalid attribute names or values',
        codeExample: {
          before: `<div class="container"> // Should be className`,
          after: `<div className="container">`,
        },
        confidence: 0.85,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-300-invalid-jsx-syntax',
  },

  'PHIL-301': {
    code: 'PHIL-301',
    category: 'compiler',
    title: 'Unsupported Feature',
    message: (ctx) =>
      `Unsupported feature: ${ctx?.feature || 'unknown'}. ${ctx?.reason || 'This feature is not yet supported by PhilJS'}.`,
    suggestions: [
      {
        description: 'Use an alternative supported pattern',
        confidence: 0.7,
        links: [`${DOCS_BASE}#supported-features`],
      },
    ],
    severity: 'error',
    documentationPath: '#phil-301-unsupported-feature',
  },

  'PHIL-302': {
    code: 'PHIL-302',
    category: 'compiler',
    title: 'Optimization Warning',
    message: (ctx) =>
      `Potential optimization issue detected: ${ctx?.issue || 'unknown'}`,
    suggestions: [
      {
        description: 'Consider the suggested optimization for better performance',
        confidence: 0.75,
      },
    ],
    severity: 'warning',
    documentationPath: '#phil-302-optimization-warning',
  },

  // ============================================================================
  // Component Errors (PHIL-400 to PHIL-499)
  // ============================================================================

  'PHIL-400': {
    code: 'PHIL-400',
    category: 'component',
    title: 'Component Render Error',
    message: (ctx) =>
      `Error rendering component '${ctx?.componentName || 'Unknown'}': ${ctx?.error || 'unknown error'}`,
    suggestions: [
      {
        description: 'Check component props and ensure all required props are provided',
        confidence: 0.8,
      },
      {
        description: 'Verify component return value is valid JSX',
        codeExample: {
          before: `function MyComponent() {\n  return undefined; // Invalid!\n}`,
          after: `function MyComponent() {\n  return <div>Content</div>;\n}`,
        },
        confidence: 0.85,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-400-component-render-error',
  },

  'PHIL-401': {
    code: 'PHIL-401',
    category: 'component',
    title: 'Invalid Props',
    message: (ctx) =>
      `Invalid props passed to component '${ctx?.componentName || 'Unknown'}': ${ctx?.invalidProps?.join(', ') || 'unknown'}`,
    suggestions: [
      {
        description: 'Check the component\'s prop types and ensure you\'re passing the correct values',
        confidence: 0.8,
      },
      {
        description: 'Use TypeScript for compile-time prop validation',
        confidence: 0.75,
        links: ['https://philjs.dev/docs/learn/typescript'],
      },
    ],
    severity: 'error',
    documentationPath: '#phil-401-invalid-props',
  },

  // ============================================================================
  // Runtime Errors (PHIL-500 to PHIL-599)
  // ============================================================================

  'PHIL-500': {
    code: 'PHIL-500',
    category: 'runtime',
    title: 'Null Reference Error',
    message: (ctx) =>
      `Cannot read property '${ctx?.property || 'unknown'}' of ${ctx?.valueType || 'null/undefined'}`,
    suggestions: [
      {
        description: 'Use optional chaining to safely access properties',
        codeExample: {
          before: `const name = user.profile.name; // Error if user or profile is null`,
          after: `const name = user?.profile?.name; // Safe`,
        },
        autoFixable: true,
        confidence: 0.9,
      },
      {
        description: 'Add null checks before accessing properties',
        codeExample: {
          before: `return <div>{user.name}</div>;`,
          after: `return <div>{user ? user.name : 'Guest'}</div>;`,
        },
        confidence: 0.85,
      },
    ],
    severity: 'error',
    documentationPath: '#phil-500-null-reference-error',
  },

  'PHIL-501': {
    code: 'PHIL-501',
    category: 'runtime',
    title: 'Async Operation Error',
    message: (ctx) =>
      `Async operation failed: ${ctx?.operation || 'unknown'}. ${ctx?.error || 'Check error details'}`,
    suggestions: [
      {
        description: 'Add proper error handling for async operations',
        codeExample: {
          before: `const data = await fetch(url).then(r => r.json());`,
          after: `try {\n  const data = await fetch(url).then(r => r.json());\n} catch (error) {\n  console.error('Fetch failed:', error);\n  // Handle error\n}`,
        },
        confidence: 0.9,
      },
      {
        description: 'Use resource() for automatic loading and error states',
        codeExample: {
          before: `// Manual async handling`,
          after: `const data = resource(async () => {\n  const res = await fetch(url);\n  return res.json();\n});\n\nif (data.loading()) return <div>Loading...</div>;\nif (data.error()) return <div>Error: {data.error().message}</div>;`,
        },
        confidence: 0.85,
        links: ['https://philjs.dev/docs/api-reference/core#resource'],
      },
    ],
    severity: 'error',
    documentationPath: '#phil-501-async-operation-error',
  },
};

/**
 * Get error definition by code
 */
export function getErrorDefinition(code: string): ErrorDefinition | undefined {
  return ERROR_CATALOG[code];
}

/**
 * Get all errors in a category
 */
export function getErrorsByCategory(category: ErrorCategory): ErrorDefinition[] {
  return Object.values(ERROR_CATALOG).filter(err => err.category === category);
}

/**
 * Create a PhilJS error with code
 */
export function createPhilJSError(
  code: string,
  context?: Record<string, any>,
  originalError?: Error
): PhilJSError {
  const definition = getErrorDefinition(code);

  if (!definition) {
    const error = new Error(`Unknown PhilJS error code: ${code}`) as PhilJSError;
    error.code = code;
    error.category = 'runtime';
    error.suggestions = [];
    return error;
  }

  const message = definition.message(context);
  const error = (originalError ? Object.create(originalError) : new Error(message)) as PhilJSError;

  error.name = `PhilJSError [${code}]`;
  error.message = message;
  error.code = code;
  error.category = definition.category;
  error.suggestions = definition.suggestions;
  error.documentationUrl = `${DOCS_BASE}${definition.documentationPath}`;

  if (context?.sourceLocation) {
    error.sourceLocation = context.sourceLocation;
  }

  return error;
}

/**
 * Format error for display
 */
export function formatError(error: PhilJSError, options: {
  includeStack?: boolean;
  includeSuggestions?: boolean;
  includeDocLink?: boolean;
} = {}): string {
  const {
    includeStack = true,
    includeSuggestions = true,
    includeDocLink = true,
  } = options;

  let output = `[${error.code}] ${error.message}\n`;

  if (error.sourceLocation) {
    output += `  at ${error.sourceLocation.file}:${error.sourceLocation.line}:${error.sourceLocation.column}\n`;
  }

  if (includeSuggestions && error.suggestions.length > 0) {
    output += '\nSuggestions:\n';
    error.suggestions.forEach((suggestion, idx) => {
      output += `  ${idx + 1}. ${suggestion.description}\n`;
      if (suggestion.codeExample) {
        output += `     Before: ${suggestion.codeExample.before}\n`;
        output += `     After:  ${suggestion.codeExample.after}\n`;
      }
    });
  }

  if (includeDocLink && error.documentationUrl) {
    output += `\nLearn more: ${error.documentationUrl}\n`;
  }

  if (includeStack && error.stack) {
    output += `\nStack trace:\n${error.stack}\n`;
  }

  return output;
}
