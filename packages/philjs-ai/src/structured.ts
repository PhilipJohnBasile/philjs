/**
 * PhilJS AI - Structured Output with Zod Validation
 *
 * Type-safe AI responses with runtime validation and automatic retries.
 */

import { z, ZodError } from 'zod';
type ZodSchema<T = any> = z.ZodType<T>;
import type { AIProvider, CompletionOptions } from './types.js';

// ============================================================================
// Types
// ============================================================================

export interface StructuredOutputOptions<T> extends CompletionOptions {
  /** Maximum number of retry attempts on validation failure */
  maxRetries?: number;
  /** Whether to include the validation error in retry prompts */
  includeErrorInRetry?: boolean;
  /** Custom error handler */
  onValidationError?: (error: ZodError, attempt: number) => void;
}

export interface StructuredResult<T> {
  data: T;
  raw: string;
  attempts: number;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

// ============================================================================
// Schema-to-Prompt Utilities
// ============================================================================

/**
 * Convert a Zod schema to a human-readable description for prompts
 */
export function schemaToDescription(schema: ZodSchema): string {
  return formatZodType(schema._def);
}

function formatZodType(def: any): string {
  const typeName = def.typeName;

  switch (typeName) {
    case 'ZodString':
      return 'string';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodNull':
      return 'null';
    case 'ZodUndefined':
      return 'undefined';
    case 'ZodLiteral':
      return `Literal<${JSON.stringify((def as any).value)}>`;
    case 'ZodEnum':
      return `Enum<${(def as any).values.map((v: string) => `"${v}"`).join(' | ')}>`;
    case 'ZodOptional':
      return `${formatZodType((def as { innerType: ZodSchema }).innerType._def)} | undefined`;
    case 'ZodNullable':
      return `${formatZodType((def as { innerType: ZodSchema }).innerType._def)} | null`;
    case 'ZodArray':
      return `Array<${formatZodType((def as { type: ZodSchema }).type._def)}>`;
    case 'ZodObject': {
      const shape = (def as any).shape();
      const fields = Object.entries(shape)
        .map(([key, value]) => `  ${key}: ${formatZodType((value as any)._def)}`)
        .join(',\n');
      return `{\n${fields}\n}`;
    }
    case 'ZodUnion':
      return (def as any).options.map((opt: ZodSchema) => formatZodType(opt._def)).join(' | ');
    case 'ZodRecord':
      return `Record<string, ${formatZodType((def as any).valueType._def)}>`;
    case 'ZodTuple':
      return `[${(def as any).items.map((item: any) => formatZodType(item._def)).join(', ')}]`;
    default:
      return 'unknown';
  }
}

/**
 * Convert Zod schema to JSON Schema (for OpenAI structured outputs)
 */
export function zodToJsonSchema(schema: ZodSchema): Record<string, unknown> {
  return convertToJsonSchema(schema._def);
}

function convertToJsonSchema(def: any): Record<string, unknown> {
  const typeName = def.typeName;

  switch (typeName) {
    case 'ZodString':
      return { type: 'string' };
    case 'ZodNumber':
      return { type: 'number' };
    case 'ZodBoolean':
      return { type: 'boolean' };
    case 'ZodNull':
      return { type: 'null' };
    case 'ZodLiteral':
      return { const: (def as any).value };
    case 'ZodEnum':
      return { enum: (def as any).values };
    case 'ZodOptional':
      return convertToJsonSchema((def as { innerType: ZodSchema }).innerType._def);
    case 'ZodNullable': {
      const inner = convertToJsonSchema((def as { innerType: ZodSchema }).innerType._def);
      return { oneOf: [inner, { type: 'null' }] };
    }
    case 'ZodArray':
      return {
        type: 'array',
        items: convertToJsonSchema((def as any).type._def),
      };
    case 'ZodObject': {
      const shape = (def as any).shape();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        properties[key] = convertToJsonSchema((value as any)._def);
        if ((value as any)._def.typeName !== 'ZodOptional') {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }
    case 'ZodUnion':
      return {
        oneOf: (def as any).options.map((opt: ZodSchema) => convertToJsonSchema(opt._def)),
      };
    case 'ZodRecord':
      return {
        type: 'object',
        additionalProperties: convertToJsonSchema((def as any).valueType._def),
      };
    default:
      return {};
  }
}

// ============================================================================
// Structured Output Generator
// ============================================================================

/**
 * Generate structured output with Zod validation
 *
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   email: z.string().email(),
 * });
 *
 * const result = await generateStructured(
 *   provider,
 *   'Extract user info from: John Doe, 30 years old, john@example.com',
 *   userSchema
 * );
 *
 * console.log(result.data); // { name: 'John Doe', age: 30, email: 'john@example.com' }
 * ```
 */
export async function generateStructured<T>(
  provider: AIProvider,
  prompt: string,
  schema: ZodSchema<T>,
  options?: StructuredOutputOptions<T>
): Promise<StructuredResult<T>> {
  const maxRetries = options?.maxRetries ?? 3;
  const includeErrorInRetry = options?.includeErrorInRetry ?? true;

  const schemaDescription = schemaToDescription(schema);
  const systemPrompt = `You are a data extraction assistant. Extract the requested information and return it as valid JSON matching this TypeScript type:

${schemaDescription}

Important:
- Return ONLY valid JSON, no additional text, markdown, or explanations
- Ensure all required fields are present
- Use null for optional fields that cannot be determined
- Numbers should be actual numbers, not strings`;

  let lastError: ZodError | null = null;
  let attempts = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    attempts++;

    let currentPrompt = prompt;
    if (attempt > 0 && lastError && includeErrorInRetry) {
      currentPrompt = `${prompt}\n\nPrevious attempt failed with these validation errors:\n${formatZodError(lastError)}\n\nPlease fix these issues and try again.`;
    }

    try {
      const { content: response } = await provider.generateCompletion(currentPrompt, {
        ...options,
        systemPrompt,
        temperature: options?.temperature ?? 0.1,
      });

      // Try to parse as JSON
      const parsed = parseJsonResponse(response);

      // Validate against schema
      const result = schema.parse(parsed);

      return {
        data: result,
        raw: response,
        attempts,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        lastError = error;
        options?.onValidationError?.(error, attempt);
      } else if (error instanceof SyntaxError) {
        lastError = new ZodError([{
          code: 'custom',
          path: [],
          message: `Invalid JSON: ${error.message}`,
        }]);
      } else {
        throw error;
      }
    }
  }

  throw new StructuredOutputError(
    `Failed to generate valid structured output after ${attempts} attempts`,
    lastError
  );
}

/**
 * Parse JSON from AI response, handling common formatting issues
 */
function parseJsonResponse(response: string): unknown {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}

/**
 * Format Zod error for retry prompt
 */
function formatZodError(error: ZodError): string {
  return (error as any).errors.map((err: { path: (string | number)[]; message: string }) => {
    const path = err.path.join('.');
    return `- ${path ? `${path}: ` : ''}${err.message}`;
  }).join('\n');
}

// ============================================================================
// Error Class
// ============================================================================

export class StructuredOutputError extends Error {
  constructor(message: string, public validationError: ZodError | null) {
    super(message);
    this.name = 'StructuredOutputError';
  }
}

// ============================================================================
// Streaming Structured Output
// ============================================================================

/**
 * Stream structured output with incremental validation
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   items: z.array(z.object({
 *     name: z.string(),
 *     price: z.number(),
 *   })),
 * });
 *
 * for await (const partial of streamStructured(provider, prompt, schema)) {
 *   if (partial.complete) {
 *     console.log('Final:', partial.data);
 *   } else {
 *     console.log('Partial:', partial.raw);
 *   }
 * }
 * ```
 */
export async function* streamStructured<T>(
  provider: AIProvider,
  prompt: string,
  schema: ZodSchema<T>,
  options?: StructuredOutputOptions<T>
): AsyncIterableIterator<{ data?: T; raw: string; complete: boolean }> {
  if (!provider.generateStreamCompletion) {
    throw new Error('Provider does not support streaming');
  }

  const schemaDescription = schemaToDescription(schema);
  const systemPrompt = `You are a data extraction assistant. Extract the requested information and return it as valid JSON matching this TypeScript type:

${schemaDescription}

Return ONLY valid JSON, no additional text or markdown.`;

  let accumulated = '';

  for await (const chunk of provider.generateStreamCompletion(prompt, {
    ...options,
    systemPrompt,
    temperature: options?.temperature ?? 0.1,
  })) {
    accumulated += chunk;

    // Try to parse and validate incrementally
    try {
      const parsed = parseJsonResponse(accumulated);
      const result = schema.parse(parsed);
      yield { data: result, raw: accumulated, complete: true };
      return;
    } catch {
      // Not yet valid, yield partial
      yield { raw: accumulated, complete: false };
    }
  }

  // Final attempt
  try {
    const parsed = parseJsonResponse(accumulated);
    const result = schema.parse(parsed);
    yield { data: result, raw: accumulated, complete: true };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new StructuredOutputError(
        'Failed to generate valid structured output',
        error
      );
    }
    throw error;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a typed structured output generator
 *
 * @example
 * ```typescript
 * const extractUser = createStructuredGenerator(provider, z.object({
 *   name: z.string(),
 *   age: z.number(),
 * }));
 *
 * const user = await extractUser('John is 30 years old');
 * console.log(user.name, user.age);
 * ```
 */
export function createStructuredGenerator<T>(
  provider: AIProvider,
  schema: ZodSchema<T>,
  defaultOptions?: StructuredOutputOptions<T>
) {
  return async (
    prompt: string,
    options?: Partial<StructuredOutputOptions<T>>
  ): Promise<T> => {
    const result = await generateStructured(provider, prompt, schema, {
      ...defaultOptions,
      ...options,
    });
    return result.data;
  };
}

/**
 * Extract an array of items with validation
 *
 * @example
 * ```typescript
 * const products = await extractArray(
 *   provider,
 *   'List 3 popular smartphones',
 *   z.object({ name: z.string(), price: z.number() })
 * );
 * ```
 */
export async function extractArray<T>(
  provider: AIProvider,
  prompt: string,
  itemSchema: ZodSchema<T>,
  options?: StructuredOutputOptions<T[]>
): Promise<T[]> {
  const arraySchema = z.object({
    items: z.array(itemSchema),
  });

  const result = await generateStructured(
    provider,
    `${prompt}\n\nReturn as JSON with an "items" array containing the results.`,
    arraySchema,
    options as StructuredOutputOptions<{ items: T[] }>
  );

  return result.data.items;
}

/**
 * Extract with fallback value on failure
 */
export async function extractWithFallback<T>(
  provider: AIProvider,
  prompt: string,
  schema: ZodSchema<T>,
  fallback: T,
  options?: StructuredOutputOptions<T>
): Promise<T> {
  try {
    const result = await generateStructured(provider, prompt, schema, options);
    return result.data;
  } catch {
    return fallback;
  }
}

// ============================================================================
// Common Schemas
// ============================================================================

export const commonSchemas = {
  /** Sentiment analysis result */
  sentiment: z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number().min(0).max(1),
    explanation: z.string().optional(),
  }),

  /** Entity extraction result */
  entities: z.object({
    entities: z.array(z.object({
      text: z.string(),
      type: z.enum(['person', 'organization', 'location', 'date', 'money', 'other']),
      start: z.number().optional(),
      end: z.number().optional(),
    })),
  }),

  /** Summary result */
  summary: z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
    wordCount: z.number(),
  }),

  /** Classification result */
  classification: z.object({
    category: z.string(),
    confidence: z.number().min(0).max(1),
    alternatives: z.array(z.object({
      category: z.string(),
      confidence: z.number().min(0).max(1),
    })).optional(),
  }),

  /** Translation result */
  translation: z.object({
    translatedText: z.string(),
    sourceLanguage: z.string().optional(),
    targetLanguage: z.string(),
  }),
};
