/**
 * PhilJS AI - Structured Output with Zod Validation
 *
 * Type-safe AI responses with runtime validation and automatic retries.
 */
import { z, ZodSchema, ZodError } from 'zod';
// ============================================================================
// Schema-to-Prompt Utilities
// ============================================================================
/**
 * Convert a Zod schema to a human-readable description for prompts
 */
export function schemaToDescription(schema) {
    return formatZodType(schema._def);
}
function formatZodType(def) {
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
            return JSON.stringify(def.value);
        case 'ZodEnum':
            return def.values.map((v) => JSON.stringify(v)).join(' | ');
        case 'ZodOptional':
            return `${formatZodType(def.innerType._def)} | undefined`;
        case 'ZodNullable':
            return `${formatZodType(def.innerType._def)} | null`;
        case 'ZodArray':
            return `Array<${formatZodType(def.type._def)}>`;
        case 'ZodObject': {
            const shape = def.shape();
            const fields = Object.entries(shape)
                .map(([key, value]) => `  ${key}: ${formatZodType(value._def)}`)
                .join(',\n');
            return `{\n${fields}\n}`;
        }
        case 'ZodUnion':
            return def.options.map((opt) => formatZodType(opt._def)).join(' | ');
        case 'ZodRecord':
            return `Record<string, ${formatZodType(def.valueType._def)}>`;
        case 'ZodTuple':
            return `[${def.items.map((item) => formatZodType(item._def)).join(', ')}]`;
        default:
            return 'unknown';
    }
}
/**
 * Convert Zod schema to JSON Schema (for OpenAI structured outputs)
 */
export function zodToJsonSchema(schema) {
    return convertToJsonSchema(schema._def);
}
function convertToJsonSchema(def) {
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
            return { const: def.value };
        case 'ZodEnum':
            return { enum: def.values };
        case 'ZodOptional':
            return convertToJsonSchema(def.innerType._def);
        case 'ZodNullable': {
            const inner = convertToJsonSchema(def.innerType._def);
            return { oneOf: [inner, { type: 'null' }] };
        }
        case 'ZodArray':
            return {
                type: 'array',
                items: convertToJsonSchema(def.type._def),
            };
        case 'ZodObject': {
            const shape = def.shape();
            const properties = {};
            const required = [];
            for (const [key, value] of Object.entries(shape)) {
                properties[key] = convertToJsonSchema(value._def);
                if (value._def.typeName !== 'ZodOptional') {
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
                oneOf: def.options.map((opt) => convertToJsonSchema(opt._def)),
            };
        case 'ZodRecord':
            return {
                type: 'object',
                additionalProperties: convertToJsonSchema(def.valueType._def),
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
export async function generateStructured(provider, prompt, schema, options) {
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
    let lastError = null;
    let attempts = 0;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        attempts++;
        let currentPrompt = prompt;
        if (attempt > 0 && lastError && includeErrorInRetry) {
            currentPrompt = `${prompt}\n\nPrevious attempt failed with these validation errors:\n${formatZodError(lastError)}\n\nPlease fix these issues and try again.`;
        }
        try {
            const response = await provider.generateCompletion(currentPrompt, {
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
        }
        catch (error) {
            if (error instanceof ZodError) {
                lastError = error;
                options?.onValidationError?.(error, attempt);
            }
            else if (error instanceof SyntaxError) {
                lastError = new ZodError([{
                        code: 'custom',
                        path: [],
                        message: `Invalid JSON: ${error.message}`,
                    }]);
            }
            else {
                throw error;
            }
        }
    }
    throw new StructuredOutputError(`Failed to generate valid structured output after ${attempts} attempts`, lastError);
}
/**
 * Parse JSON from AI response, handling common formatting issues
 */
function parseJsonResponse(response) {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    }
    else if (cleaned.startsWith('```')) {
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
function formatZodError(error) {
    return error.errors.map(err => {
        const path = err.path.join('.');
        return `- ${path ? `${path}: ` : ''}${err.message}`;
    }).join('\n');
}
// ============================================================================
// Error Class
// ============================================================================
export class StructuredOutputError extends Error {
    validationError;
    constructor(message, validationError) {
        super(message);
        this.validationError = validationError;
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
export async function* streamStructured(provider, prompt, schema, options) {
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
        }
        catch {
            // Not yet valid, yield partial
            yield { raw: accumulated, complete: false };
        }
    }
    // Final attempt
    try {
        const parsed = parseJsonResponse(accumulated);
        const result = schema.parse(parsed);
        yield { data: result, raw: accumulated, complete: true };
    }
    catch (error) {
        if (error instanceof ZodError) {
            throw new StructuredOutputError('Failed to generate valid structured output', error);
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
export function createStructuredGenerator(provider, schema, defaultOptions) {
    return async (prompt, options) => {
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
export async function extractArray(provider, prompt, itemSchema, options) {
    const arraySchema = z.object({
        items: z.array(itemSchema),
    });
    const result = await generateStructured(provider, `${prompt}\n\nReturn as JSON with an "items" array containing the results.`, arraySchema, options);
    return result.data.items;
}
/**
 * Extract with fallback value on failure
 */
export async function extractWithFallback(provider, prompt, schema, fallback, options) {
    try {
        const result = await generateStructured(provider, prompt, schema, options);
        return result.data;
    }
    catch {
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
//# sourceMappingURL=structured.js.map