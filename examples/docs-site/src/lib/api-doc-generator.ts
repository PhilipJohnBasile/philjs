/**
 * API Documentation Generator
 *
 * Parses TypeScript source files and extracts TSDoc comments
 * to generate API reference documentation.
 */

export interface ApiDocParam {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
  defaultValue?: string;
}

export interface ApiDocReturn {
  type: string;
  description?: string;
}

export interface ApiDocFunction {
  name: string;
  description?: string;
  signature: string;
  params: ApiDocParam[];
  returns?: ApiDocReturn;
  examples?: string[];
  since?: string;
  deprecated?: boolean;
  deprecationMessage?: string;
}

export interface ApiDocInterface {
  name: string;
  description?: string;
  properties: Array<{
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
  }>;
  extends?: string[];
}

export interface ApiDocType {
  name: string;
  description?: string;
  type: string;
}

export interface ApiDocModule {
  name: string;
  description?: string;
  functions: ApiDocFunction[];
  interfaces: ApiDocInterface[];
  types: ApiDocType[];
  constants: Array<{
    name: string;
    type: string;
    value?: string;
    description?: string;
  }>;
}

/**
 * Parse a TypeScript source file and extract API documentation
 *
 * This is a simplified parser that looks for common patterns.
 * A production version would use TypeScript's compiler API.
 */
export function parseApiDocs(source: string, moduleName: string): ApiDocModule {
  const module: ApiDocModule = {
    name: moduleName,
    functions: [],
    interfaces: [],
    types: [],
    constants: [],
  };

  // Extract module-level JSDoc
  const moduleDocMatch = source.match(/\/\*\*\s*\n([^*]|\*(?!\/))*\*\/\s*$/m);
  if (moduleDocMatch) {
    module.description = extractDescription(moduleDocMatch[0]);
  }

  // Extract functions
  const functionRegex = /\/\*\*[\s\S]*?\*\/\s*export\s+function\s+(\w+)\s*(<[^>]+>)?\s*\(([^)]*)\)\s*:\s*([^{;]+)/g;
  let match;

  while ((match = functionRegex.exec(source)) !== null) {
    const [fullMatch, name, generics, params, returnType] = match;
    const docComment = fullMatch.match(/\/\*\*[\s\S]*?\*\//)?.[0] || '';

    module.functions.push({
      name,
      description: extractDescription(docComment),
      signature: `${name}${generics || ''}(${params}): ${returnType.trim()}`,
      params: parseParams(params, docComment),
      returns: {
        type: returnType.trim(),
        description: extractTag(docComment, 'returns'),
      },
      examples: extractExamples(docComment),
      since: extractTag(docComment, 'since'),
      deprecated: docComment.includes('@deprecated'),
      deprecationMessage: extractTag(docComment, 'deprecated'),
    });
  }

  // Extract interfaces
  const interfaceRegex = /\/\*\*[\s\S]*?\*\/\s*export\s+interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*\{([^}]+)\}/g;

  while ((match = interfaceRegex.exec(source)) !== null) {
    const [fullMatch, name, extendsClause, body] = match;
    const docComment = fullMatch.match(/\/\*\*[\s\S]*?\*\//)?.[0] || '';

    module.interfaces.push({
      name,
      description: extractDescription(docComment),
      properties: parseInterfaceProperties(body),
      extends: extendsClause?.split(',').map(e => e.trim()),
    });
  }

  // Extract type aliases
  const typeRegex = /\/\*\*[\s\S]*?\*\/\s*export\s+type\s+(\w+)\s*=\s*([^;]+);/g;

  while ((match = typeRegex.exec(source)) !== null) {
    const [fullMatch, name, type] = match;
    const docComment = fullMatch.match(/\/\*\*[\s\S]*?\*\//)?.[0] || '';

    module.types.push({
      name,
      description: extractDescription(docComment),
      type: type.trim(),
    });
  }

  return module;
}

function extractDescription(docComment: string): string {
  const lines = docComment
    .replace(/\/\*\*|\*\//g, '')
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, '').trim())
    .filter(line => line && !line.startsWith('@'));

  return lines.join(' ').trim();
}

function extractTag(docComment: string, tagName: string): string | undefined {
  const regex = new RegExp(`@${tagName}\\s+(.+?)(?=\\n\\s*\\*\\s*@|\\n\\s*\\*\\/|$)`, 's');
  const match = docComment.match(regex);
  return match ? match[1].replace(/\n\s*\*\s*/g, ' ').trim() : undefined;
}

function extractExamples(docComment: string): string[] {
  const examples: string[] = [];
  const exampleRegex = /@example\s+([\s\S]+?)(?=\n\s*\*\s*@|\\n\s*\*\/|$)/g;
  let match;

  while ((match = exampleRegex.exec(docComment)) !== null) {
    examples.push(match[1].replace(/\n\s*\*\s*/g, '\n').trim());
  }

  return examples;
}

function parseParams(paramsStr: string, docComment: string): ApiDocParam[] {
  const params: ApiDocParam[] = [];

  // Parse parameter definitions
  const paramDefs = paramsStr.split(',').map(p => p.trim()).filter(Boolean);

  for (const paramDef of paramDefs) {
    const match = paramDef.match(/(\w+)(\?)?:\s*(.+?)(?:=\s*(.+))?$/);
    if (match) {
      const [, name, optional, type, defaultValue] = match;
      const paramDoc = extractParamDoc(docComment, name);

      params.push({
        name,
        type: type.trim(),
        description: paramDoc,
        optional: !!optional || !!defaultValue,
        defaultValue: defaultValue?.trim(),
      });
    }
  }

  return params;
}

function extractParamDoc(docComment: string, paramName: string): string | undefined {
  const regex = new RegExp(`@param\\s+(?:\\{[^}]+\\}\\s+)?${paramName}\\s+(.+?)(?=\\n\\s*\\*\\s*@|\\n\\s*\\*\\/|$)`, 's');
  const match = docComment.match(regex);
  return match ? match[1].replace(/\n\s*\*\s*/g, ' ').trim() : undefined;
}

function parseInterfaceProperties(body: string): Array<{
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
}> {
  const properties: Array<{
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
  }> = [];

  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Skip comments
    if (line.startsWith('//') || line.startsWith('/*')) continue;

    const match = line.match(/(\w+)(\?)?:\s*(.+?);?\s*$/);
    if (match) {
      const [, name, optional, type] = match;
      properties.push({
        name,
        type: type.trim().replace(/;$/, ''),
        optional: !!optional,
      });
    }
  }

  return properties;
}

/**
 * Generate markdown documentation from API docs
 */
export function generateApiMarkdown(module: ApiDocModule): string {
  let markdown = `# ${module.name}\n\n`;

  if (module.description) {
    markdown += `${module.description}\n\n`;
  }

  // Table of contents
  markdown += `## Table of Contents\n\n`;

  if (module.functions.length > 0) {
    markdown += `### Functions\n\n`;
    module.functions.forEach(fn => {
      markdown += `- [${fn.name}](#${fn.name.toLowerCase()})\n`;
    });
    markdown += '\n';
  }

  if (module.interfaces.length > 0) {
    markdown += `### Interfaces\n\n`;
    module.interfaces.forEach(iface => {
      markdown += `- [${iface.name}](#${iface.name.toLowerCase()})\n`;
    });
    markdown += '\n';
  }

  if (module.types.length > 0) {
    markdown += `### Types\n\n`;
    module.types.forEach(type => {
      markdown += `- [${type.name}](#${type.name.toLowerCase()})\n`;
    });
    markdown += '\n';
  }

  // Functions
  if (module.functions.length > 0) {
    markdown += `## Functions\n\n`;

    module.functions.forEach(fn => {
      markdown += `### ${fn.name}\n\n`;

      if (fn.deprecated) {
        markdown += `> **⚠️ Deprecated**${fn.deprecationMessage ? `: ${fn.deprecationMessage}` : ''}\n\n`;
      }

      if (fn.description) {
        markdown += `${fn.description}\n\n`;
      }

      markdown += `**Signature:**\n\n`;
      markdown += `\`\`\`typescript\n${fn.signature}\n\`\`\`\n\n`;

      if (fn.params.length > 0) {
        markdown += `**Parameters:**\n\n`;
        fn.params.forEach(param => {
          const optional = param.optional ? ' (optional)' : '';
          const defaultVal = param.defaultValue ? ` = ${param.defaultValue}` : '';
          markdown += `- \`${param.name}\`${optional}: \`${param.type}\`${defaultVal}`;
          if (param.description) {
            markdown += ` - ${param.description}`;
          }
          markdown += '\n';
        });
        markdown += '\n';
      }

      if (fn.returns) {
        markdown += `**Returns:**\n\n`;
        markdown += `\`${fn.returns.type}\``;
        if (fn.returns.description) {
          markdown += ` - ${fn.returns.description}`;
        }
        markdown += '\n\n';
      }

      if (fn.examples && fn.examples.length > 0) {
        markdown += `**Examples:**\n\n`;
        fn.examples.forEach(example => {
          markdown += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
        });
      }

      if (fn.since) {
        markdown += `*Since: ${fn.since}*\n\n`;
      }

      markdown += '---\n\n';
    });
  }

  // Interfaces
  if (module.interfaces.length > 0) {
    markdown += `## Interfaces\n\n`;

    module.interfaces.forEach(iface => {
      markdown += `### ${iface.name}\n\n`;

      if (iface.description) {
        markdown += `${iface.description}\n\n`;
      }

      if (iface.extends && iface.extends.length > 0) {
        markdown += `**Extends:** ${iface.extends.map(e => `\`${e}\``).join(', ')}\n\n`;
      }

      markdown += `**Properties:**\n\n`;
      markdown += `| Name | Type | Optional | Description |\n`;
      markdown += `| ---- | ---- | -------- | ----------- |\n`;

      iface.properties.forEach(prop => {
        const optional = prop.optional ? 'Yes' : 'No';
        const description = prop.description || '';
        markdown += `| \`${prop.name}\` | \`${prop.type}\` | ${optional} | ${description} |\n`;
      });

      markdown += '\n---\n\n';
    });
  }

  // Types
  if (module.types.length > 0) {
    markdown += `## Types\n\n`;

    module.types.forEach(type => {
      markdown += `### ${type.name}\n\n`;

      if (type.description) {
        markdown += `${type.description}\n\n`;
      }

      markdown += `\`\`\`typescript\ntype ${type.name} = ${type.type}\n\`\`\`\n\n`;

      markdown += '---\n\n';
    });
  }

  return markdown;
}

/**
 * Sample API documentation for PhilJS Core
 */
export const philjsCoreApiDocs: ApiDocModule = {
  name: '@philjs/core',
  description: 'Core reactivity primitives for PhilJS',
  functions: [
    {
      name: 'signal',
      description: 'Creates a reactive signal that holds a value and notifies subscribers when the value changes.',
      signature: 'signal<T>(initialValue: T): Signal<T>',
      params: [
        {
          name: 'initialValue',
          type: 'T',
          description: 'The initial value of the signal',
        },
      ],
      returns: {
        type: 'Signal<T>',
        description: 'A signal object with get/set methods',
      },
      examples: [
        `const count = signal(0);
console.log(count()); // 0
count.set(1);
console.log(count()); // 1`,
      ],
    },
    {
      name: 'effect',
      description: 'Creates a side effect that automatically re-runs when any signals it reads change.',
      signature: 'effect(fn: () => void | (() => void)): () => void',
      params: [
        {
          name: 'fn',
          type: '() => void | (() => void)',
          description: 'The effect function. Can optionally return a cleanup function.',
        },
      ],
      returns: {
        type: '() => void',
        description: 'A function to dispose of the effect',
      },
      examples: [
        `const count = signal(0);
effect(() => {
  console.log('Count:', count());
});
count.set(1); // Logs: "Count: 1"`,
      ],
    },
    {
      name: 'memo',
      description: 'Creates a computed value that only recalculates when its dependencies change.',
      signature: 'memo<T>(fn: () => T): () => T',
      params: [
        {
          name: 'fn',
          type: '() => T',
          description: 'The computation function',
        },
      ],
      returns: {
        type: '() => T',
        description: 'A memoized getter function',
      },
      examples: [
        `const count = signal(5);
const doubled = memo(() => count() * 2);
console.log(doubled()); // 10
count.set(10);
console.log(doubled()); // 20`,
      ],
    },
    {
      name: 'render',
      description: 'Renders a component tree to a DOM element.',
      signature: 'render(vnode: VNode, container: HTMLElement): void',
      params: [
        {
          name: 'vnode',
          type: 'VNode',
          description: 'The virtual DOM node to render',
        },
        {
          name: 'container',
          type: 'HTMLElement',
          description: 'The DOM element to render into',
        },
      ],
      examples: [
        `const App = () => <div>Hello World</div>;
render(<App />, document.getElementById('root')!);`,
      ],
    },
  ],
  interfaces: [
    {
      name: 'Signal',
      description: 'A reactive signal interface',
      properties: [
        {
          name: 'value',
          type: 'T',
          description: 'The current value (getter/setter)',
        },
        {
          name: 'get',
          type: '() => T',
          description: 'Get the current value',
        },
        {
          name: 'set',
          type: '(newValue: T) => void',
          description: 'Set a new value',
        },
        {
          name: 'update',
          type: '(fn: (prev: T) => T) => void',
          description: 'Update the value using a function',
        },
      ],
    },
  ],
  types: [
    {
      name: 'VNode',
      description: 'A virtual DOM node',
      type: 'string | number | boolean | null | undefined | VNodeElement | VNodeElement[]',
    },
  ],
  constants: [],
};
