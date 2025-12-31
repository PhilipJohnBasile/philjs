/**
 * PhilJS OpenAPI - Zod to JSON Schema Converter
 *
 * Converts Zod schemas to JSON Schema for OpenAPI spec generation.
 * Inspired by Elysia's automatic schema inference.
 */
import type { JSONSchema } from './types.js';
type ZodTypeName = 'ZodString' | 'ZodNumber' | 'ZodBoolean' | 'ZodArray' | 'ZodObject' | 'ZodEnum' | 'ZodNativeEnum' | 'ZodLiteral' | 'ZodUnion' | 'ZodIntersection' | 'ZodOptional' | 'ZodNullable' | 'ZodDefault' | 'ZodRecord' | 'ZodTuple' | 'ZodDate' | 'ZodAny' | 'ZodUnknown' | 'ZodVoid' | 'ZodNull' | 'ZodUndefined' | 'ZodBigInt' | 'ZodNever' | 'ZodEffects' | 'ZodLazy' | 'ZodPromise' | 'ZodBranded' | 'ZodPipeline' | 'ZodDiscriminatedUnion';
interface ZodDef {
    typeName: ZodTypeName;
    checks?: Array<{
        kind: string;
        value?: unknown;
        message?: string;
    }>;
    type?: unknown;
    shape?: () => Record<string, unknown>;
    values?: readonly unknown[];
    innerType?: unknown;
    options?: unknown[];
    left?: unknown;
    right?: unknown;
    valueType?: unknown;
    items?: unknown[];
    defaultValue?: () => unknown;
    description?: string;
    discriminator?: string;
    optionsMap?: Map<string, unknown>;
}
interface ZodLike {
    _def: ZodDef;
    description?: string;
}
/**
 * Check if value is a Zod schema
 */
export declare function isZodSchema(value: unknown): value is ZodLike;
/**
 * Convert Zod schema to JSON Schema
 */
export declare function zodToJsonSchema(schema: unknown, options?: {
    definitions?: Map<string, JSONSchema>;
    path?: string[];
}): JSONSchema;
/**
 * Extract example value from Zod schema default
 */
export declare function extractExample(schema: unknown): unknown;
/**
 * Get Zod schema description
 */
export declare function getSchemaDescription(schema: unknown): string | undefined;
export {};
//# sourceMappingURL=zod-to-schema.d.ts.map