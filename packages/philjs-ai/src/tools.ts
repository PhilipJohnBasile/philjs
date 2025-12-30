/**
 * PhilJS AI - Tool Calling System
 *
 * Define and execute tools that can be called by AI models.
 */

import type { ToolDefinition, ToolCall } from './types.js';

// ============================================================================
// Tool Builder
// ============================================================================

export interface ToolBuilder {
  name: string;
  description: string;
  parameters: Record<string, ParameterDef>;
  handler?: (args: Record<string, any>) => Promise<any>;
}

export interface ParameterDef {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  items?: ParameterDef;
  properties?: Record<string, ParameterDef>;
}

export function tool(builder: ToolBuilder): ToolDefinition {
  const jsonSchema: Record<string, any> = {
    type: 'object',
    properties: {},
    required: [],
  };

  for (const [key, param] of Object.entries(builder.parameters)) {
    jsonSchema['properties'][key] = parameterToSchema(param);
    if (param.required !== false) {
      jsonSchema['required'].push(key);
    }
  }

  return {
    name: builder.name,
    description: builder.description,
    parameters: jsonSchema,
    execute: builder.handler || (async () => ({ error: 'No handler defined' })),
  };
}

function parameterToSchema(param: ParameterDef): Record<string, any> {
  const schema: Record<string, any> = {
    type: param.type,
    description: param.description,
  };

  if (param.enum) {
    schema['enum'] = param.enum;
  }

  if (param.type === 'array' && param.items) {
    schema['items'] = parameterToSchema(param.items);
  }

  if (param.type === 'object' && param.properties) {
    schema['properties'] = {};
    for (const [key, prop] of Object.entries(param.properties)) {
      schema['properties'][key] = parameterToSchema(prop);
    }
  }

  return schema;
}

// ============================================================================
// Built-in Tools
// ============================================================================

/**
 * Web search tool
 */
export const webSearchTool = tool({
  name: 'web_search',
  description: 'Search the web for current information',
  parameters: {
    query: {
      type: 'string',
      description: 'The search query',
      required: true,
    },
    maxResults: {
      type: 'number',
      description: 'Maximum number of results to return',
      required: false,
    },
  },
  handler: async (args) => {
    // Integration point for search providers (Serper, Tavily, etc.)
    return { results: [], message: 'Web search not configured' };
  },
});

/**
 * Safe math expression evaluator
 * Only allows numbers and basic math operations - no Function() or eval()
 */
function safeMathEvaluate(expression: string): number {
  // Remove whitespace
  const expr = expression.replace(/\s+/g, '');

  // Only allow numbers, operators, parentheses, and decimal points
  if (!/^[\d+\-*/%().]+$/.test(expr)) {
    throw new Error('Invalid characters in expression');
  }

  // Prevent empty or malformed expressions
  if (!expr || /[+\-*/%]{2,}/.test(expr) || /^[+*/%]/.test(expr)) {
    throw new Error('Invalid expression format');
  }

  // Parse and evaluate using a recursive descent parser
  let pos = 0;

  function parseNumber(): number {
    let numStr = '';
    while (pos < expr.length && (/\d/.test(expr[pos]!) || expr[pos] === '.')) {
      numStr += expr[pos++];
    }
    if (!numStr || numStr.split('.').length > 2) {
      throw new Error('Invalid number');
    }
    return parseFloat(numStr);
  }

  function parseFactor(): number {
    if (expr[pos] === '(') {
      pos++; // skip '('
      const result = parseExpression();
      if (expr[pos] !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      pos++; // skip ')'
      return result;
    }
    if (expr[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    if (expr[pos] === '+') {
      pos++;
      return parseFactor();
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (pos < expr.length && ('*/%'.includes(expr[pos]!))) {
      const op = expr[pos++];
      const right = parseFactor();
      if (op === '*') result *= right;
      else if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        result /= right;
      }
      else if (op === '%') {
        if (right === 0) throw new Error('Modulo by zero');
        result %= right;
      }
    }
    return result;
  }

  function parseExpression(): number {
    let result = parseTerm();
    while (pos < expr.length && '+-'.includes(expr[pos]!)) {
      const op = expr[pos++];
      const right = parseTerm();
      if (op === '+') result += right;
      else result -= right;
    }
    return result;
  }

  const result = parseExpression();
  if (pos < expr.length) {
    throw new Error('Unexpected character: ' + expr[pos]);
  }
  return result;
}

/**
 * Calculator tool
 */
export const calculatorTool = tool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: {
    expression: {
      type: 'string',
      description: 'The mathematical expression to evaluate (e.g., "2 + 2 * 3")',
      required: true,
    },
  },
  handler: async (args) => {
    try {
      // Safe math evaluation without Function() or eval()
      const result = safeMathEvaluate(args['expression']);
      return { result };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid expression' };
    }
  },
});

/**
 * Weather tool
 */
export const weatherTool = tool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    location: {
      type: 'string',
      description: 'City name or coordinates',
      required: true,
    },
    units: {
      type: 'string',
      description: 'Temperature units',
      enum: ['celsius', 'fahrenheit'],
      required: false,
    },
  },
  handler: async (args) => {
    // Integration point for weather APIs
    return { message: 'Weather API not configured', location: args['location'] };
  },
});

/**
 * Code execution tool (sandboxed)
 */
export const codeExecutionTool = tool({
  name: 'execute_code',
  description: 'Execute JavaScript code in a sandboxed environment',
  parameters: {
    code: {
      type: 'string',
      description: 'The JavaScript code to execute',
      required: true,
    },
    language: {
      type: 'string',
      description: 'Programming language',
      enum: ['javascript', 'typescript', 'python'],
      required: false,
    },
  },
  handler: async (args) => {
    // Would integrate with sandboxed execution (e.g., Web Workers, isolated-vm)
    return { error: 'Code execution not configured for security' };
  },
});

/**
 * File read tool
 */
export const fileReadTool = tool({
  name: 'read_file',
  description: 'Read contents of a file',
  parameters: {
    path: {
      type: 'string',
      description: 'Path to the file',
      required: true,
    },
  },
  handler: async (args) => {
    // Server-side only - would use fs
    return { error: 'File reading not available in browser' };
  },
});

// ============================================================================
// Tool Executor
// ============================================================================

export class ToolExecutor {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  registerAll(tools: ToolDefinition[]): void {
    tools.forEach(t => this.register(t));
  }

  async execute(toolCall: ToolCall): Promise<any> {
    const tool = this.tools.get(toolCall.name);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolCall.name}`);
    }
    return tool.execute(toolCall.arguments);
  }

  async executeAll(toolCalls: ToolCall[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    await Promise.all(
      toolCalls.map(async (call) => {
        try {
          const result = await this.execute(call);
          results.set(call.id, result);
        } catch (error) {
          results.set(call.id, { error: String(error) });
        }
      })
    );

    return results;
  }

  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  toOpenAIFormat(): any[] {
    return this.getToolDefinitions().map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  toAnthropicFormat(): any[] {
    return this.getToolDefinitions().map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }
}

// ============================================================================
// Agent System
// ============================================================================

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  maxIterations?: number;
}

export interface AgentStep {
  type: 'thought' | 'action' | 'observation' | 'final_answer';
  content: string;
  toolCall?: ToolCall;
  toolResult?: any;
}

export class Agent {
  private config: AgentConfig;
  private executor: ToolExecutor;

  constructor(config: AgentConfig) {
    this.config = config;
    this.executor = new ToolExecutor();
    this.executor.registerAll(config.tools);
  }

  async run(input: string, onStep?: (step: AgentStep) => void): Promise<string> {
    const maxIterations = this.config.maxIterations || 10;
    let iterations = 0;

    // This would integrate with the AI provider for ReAct-style reasoning
    // Simplified implementation here

    onStep?.({
      type: 'thought',
      content: `Analyzing request: ${input}`,
    });

    // In a full implementation, this would:
    // 1. Send prompt to LLM with tools
    // 2. Parse response for tool calls
    // 3. Execute tools
    // 4. Send results back to LLM
    // 5. Repeat until final answer

    return `Agent response to: ${input}`;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function createTool(
  name: string,
  description: string,
  parameters: Record<string, ParameterDef>,
  handler: (args: Record<string, any>) => Promise<any>
): ToolDefinition {
  return tool({ name, description, parameters, handler });
}

export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
