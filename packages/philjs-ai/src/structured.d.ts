/**
 * PhilJS AI - Structured Output with Zod Validation
 *
 * Type-safe AI responses with runtime validation and automatic retries.
 */
import { z, ZodSchema, ZodError } from 'zod';
import type { AIProvider, CompletionOptions } from './types.js';
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
/**
 * Convert a Zod schema to a human-readable description for prompts
 */
export declare function schemaToDescription(schema: ZodSchema): string;
/**
 * Convert Zod schema to JSON Schema (for OpenAI structured outputs)
 */
export declare function zodToJsonSchema(schema: ZodSchema): Record<string, unknown>;
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
export declare function generateStructured<T>(provider: AIProvider, prompt: string, schema: ZodSchema<T>, options?: StructuredOutputOptions<T>): Promise<StructuredResult<T>>;
export declare class StructuredOutputError extends Error {
    validationError: ZodError | null;
    constructor(message: string, validationError: ZodError | null);
}
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
export declare function streamStructured<T>(provider: AIProvider, prompt: string, schema: ZodSchema<T>, options?: StructuredOutputOptions<T>): AsyncIterableIterator<{
    data?: T;
    raw: string;
    complete: boolean;
}>;
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
export declare function createStructuredGenerator<T>(provider: AIProvider, schema: ZodSchema<T>, defaultOptions?: StructuredOutputOptions<T>): (prompt: string, options?: Partial<StructuredOutputOptions<T>>) => Promise<T>;
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
export declare function extractArray<T>(provider: AIProvider, prompt: string, itemSchema: ZodSchema<T>, options?: StructuredOutputOptions<T[]>): Promise<T[]>;
/**
 * Extract with fallback value on failure
 */
export declare function extractWithFallback<T>(provider: AIProvider, prompt: string, schema: ZodSchema<T>, fallback: T, options?: StructuredOutputOptions<T>): Promise<T>;
export declare const commonSchemas: {
    /** Sentiment analysis result */
    sentiment: z.ZodObject<{
        sentiment: z.ZodEnum<{
            positive: "positive";
            negative: "negative";
            neutral: "neutral";
        }>;
        confidence: z.ZodNumber;
        explanation: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    /** Entity extraction result */
    entities: z.ZodObject<{
        entities: z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            type: z.ZodEnum<{
                date: "date";
                location: "location";
                other: "other";
                organization: "organization";
                person: "person";
                money: "money";
            }>;
            start: z.ZodOptional<z.ZodNumber>;
            end: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    /** Summary result */
    summary: z.ZodObject<{
        summary: z.ZodString;
        keyPoints: z.ZodArray<z.ZodString>;
        wordCount: z.ZodNumber;
    }, z.core.$strip>;
    /** Classification result */
    classification: z.ZodObject<{
        category: z.ZodString;
        confidence: z.ZodNumber;
        alternatives: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodString;
            confidence: z.ZodNumber;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    /** Translation result */
    translation: z.ZodObject<{
        translatedText: z.ZodString;
        sourceLanguage: z.ZodOptional<z.ZodString>;
        targetLanguage: z.ZodString;
    }, z.core.$strip>;
};
//# sourceMappingURL=structured.d.ts.map