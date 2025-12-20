/**
 * PhilJS OpenAPI - Zod to JSON Schema Converter
 *
 * Converts Zod schemas to JSON Schema for OpenAPI spec generation.
 * Inspired by Elysia's automatic schema inference.
 */

import type { JSONSchema } from './types';

// Zod type detection utilities
type ZodTypeName =
  | 'ZodString'
  | 'ZodNumber'
  | 'ZodBoolean'
  | 'ZodArray'
  | 'ZodObject'
  | 'ZodEnum'
  | 'ZodNativeEnum'
  | 'ZodLiteral'
  | 'ZodUnion'
  | 'ZodIntersection'
  | 'ZodOptional'
  | 'ZodNullable'
  | 'ZodDefault'
  | 'ZodRecord'
  | 'ZodTuple'
  | 'ZodDate'
  | 'ZodAny'
  | 'ZodUnknown'
  | 'ZodVoid'
  | 'ZodNull'
  | 'ZodUndefined'
  | 'ZodBigInt'
  | 'ZodNever'
  | 'ZodEffects'
  | 'ZodLazy'
  | 'ZodPromise'
  | 'ZodBranded'
  | 'ZodPipeline'
  | 'ZodDiscriminatedUnion';

interface ZodDef {
  typeName: ZodTypeName;
  checks?: Array<{ kind: string; value?: unknown; message?: string }>;
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
export function isZodSchema(value: unknown): value is ZodLike {
  return (
    value !== null &&
    typeof value === 'object' &&
    '_def' in value &&
    typeof (value as ZodLike)._def === 'object' &&
    'typeName' in (value as ZodLike)._def
  );
}

/**
 * Convert Zod schema to JSON Schema
 */
export function zodToJsonSchema(
  schema: unknown,
  options: {
    definitions?: Map<string, JSONSchema>;
    path?: string[];
  } = {}
): JSONSchema {
  if (!isZodSchema(schema)) {
    return { type: 'object' };
  }

  const { _def: def, description } = schema;
  const baseSchema: JSONSchema = {};

  // Add description if present
  if (description || def.description) {
    baseSchema.description = description || def.description;
  }

  switch (def.typeName) {
    case 'ZodString':
      return convertZodString(def, baseSchema);

    case 'ZodNumber':
      return convertZodNumber(def, baseSchema);

    case 'ZodBoolean':
      return { ...baseSchema, type: 'boolean' };

    case 'ZodArray':
      return convertZodArray(def, baseSchema, options);

    case 'ZodObject':
      return convertZodObject(def, baseSchema, options);

    case 'ZodEnum':
      return {
        ...baseSchema,
        type: 'string',
        enum: def.values as string[],
      };

    case 'ZodNativeEnum':
      const nativeEnumValues = def.values as unknown as Record<string, unknown>;
      const enumValues = Object.values(nativeEnumValues)
        .filter((v) => typeof v !== 'number' || !Object.values(nativeEnumValues).includes(String(v)));
      return {
        ...baseSchema,
        enum: enumValues,
      };

    case 'ZodLiteral':
      const literalValue = (def as unknown as { value: unknown }).value;
      return {
        ...baseSchema,
        type: typeof literalValue as 'string' | 'number' | 'boolean',
        const: literalValue,
      };

    case 'ZodUnion':
      return {
        ...baseSchema,
        oneOf: (def.options as unknown[]).map((opt) => zodToJsonSchema(opt, options)),
      };

    case 'ZodDiscriminatedUnion':
      return {
        ...baseSchema,
        oneOf: Array.from((def.optionsMap as Map<string, unknown>).values()).map((opt) =>
          zodToJsonSchema(opt, options)
        ),
        discriminator: {
          propertyName: def.discriminator as string,
        },
      };

    case 'ZodIntersection':
      return {
        ...baseSchema,
        allOf: [
          zodToJsonSchema(def.left, options),
          zodToJsonSchema(def.right, options),
        ],
      };

    case 'ZodOptional':
      return zodToJsonSchema(def.innerType, options);

    case 'ZodNullable':
      const innerSchema = zodToJsonSchema(def.innerType, options);
      return {
        ...innerSchema,
        nullable: true,
      };

    case 'ZodDefault':
      const defaultSchema = zodToJsonSchema(def.innerType, options);
      const defaultValue = def.defaultValue?.();
      if (defaultValue !== undefined) {
        defaultSchema.default = defaultValue;
      }
      return defaultSchema;

    case 'ZodRecord':
      return {
        ...baseSchema,
        type: 'object',
        additionalProperties: zodToJsonSchema(def.valueType, options),
      };

    case 'ZodTuple':
      return {
        ...baseSchema,
        type: 'array',
        items: (def.items as unknown[]).map((item) => zodToJsonSchema(item, options)),
        minItems: (def.items as unknown[]).length,
        maxItems: (def.items as unknown[]).length,
      };

    case 'ZodDate':
      return {
        ...baseSchema,
        type: 'string',
        format: 'date-time',
      };

    case 'ZodBigInt':
      return {
        ...baseSchema,
        type: 'integer',
        format: 'int64',
      };

    case 'ZodNull':
      return { ...baseSchema, type: 'null' };

    case 'ZodAny':
    case 'ZodUnknown':
      return { ...baseSchema };

    case 'ZodVoid':
    case 'ZodUndefined':
    case 'ZodNever':
      return { ...baseSchema, not: {} };

    case 'ZodEffects':
    case 'ZodLazy':
    case 'ZodPromise':
    case 'ZodBranded':
    case 'ZodPipeline':
      // Unwrap these types
      return zodToJsonSchema(def.innerType || def.type, options);

    default:
      return { ...baseSchema, type: 'object' };
  }
}

/**
 * Convert Zod string schema
 */
function convertZodString(def: ZodDef, baseSchema: JSONSchema): JSONSchema {
  const schema: JSONSchema = { ...baseSchema, type: 'string' };

  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case 'min':
          schema.minLength = check.value as number;
          break;
        case 'max':
          schema.maxLength = check.value as number;
          break;
        case 'length':
          schema.minLength = check.value as number;
          schema.maxLength = check.value as number;
          break;
        case 'email':
          schema.format = 'email';
          break;
        case 'url':
          schema.format = 'uri';
          break;
        case 'uuid':
          schema.format = 'uuid';
          break;
        case 'cuid':
          schema.pattern = '^c[a-z0-9]{24}$';
          break;
        case 'cuid2':
          schema.pattern = '^[a-z0-9]{24}$';
          break;
        case 'ulid':
          schema.pattern = '^[0-9A-HJKMNP-TV-Z]{26}$';
          break;
        case 'regex':
          schema.pattern = (check.value as RegExp).source;
          break;
        case 'datetime':
          schema.format = 'date-time';
          break;
        case 'date':
          schema.format = 'date';
          break;
        case 'time':
          schema.format = 'time';
          break;
        case 'ip':
          schema.format = (check.value as { version?: 'v4' | 'v6' })?.version === 'v6' ? 'ipv6' : 'ipv4';
          break;
        case 'emoji':
          // No standard format for emoji
          break;
        case 'startsWith':
          schema.pattern = `^${escapeRegex(check.value as string)}`;
          break;
        case 'endsWith':
          schema.pattern = `${escapeRegex(check.value as string)}$`;
          break;
        case 'includes':
          schema.pattern = escapeRegex(check.value as string);
          break;
        case 'toLowerCase':
        case 'toUpperCase':
        case 'trim':
          // These are transforms, not validations
          break;
      }
    }
  }

  return schema;
}

/**
 * Convert Zod number schema
 */
function convertZodNumber(def: ZodDef, baseSchema: JSONSchema): JSONSchema {
  const schema: JSONSchema = { ...baseSchema, type: 'number' };

  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case 'int':
          schema.type = 'integer';
          break;
        case 'min':
          schema.minimum = check.value as number;
          break;
        case 'max':
          schema.maximum = check.value as number;
          break;
        case 'multipleOf':
          schema.multipleOf = check.value as number;
          break;
        case 'finite':
          // JSON Schema numbers are always finite
          break;
        case 'positive':
          schema.exclusiveMinimum = 0;
          break;
        case 'negative':
          schema.exclusiveMaximum = 0;
          break;
        case 'nonpositive':
          schema.maximum = 0;
          break;
        case 'nonnegative':
          schema.minimum = 0;
          break;
      }
    }
  }

  return schema;
}

/**
 * Convert Zod array schema
 */
function convertZodArray(
  def: ZodDef,
  baseSchema: JSONSchema,
  options: { definitions?: Map<string, JSONSchema>; path?: string[] }
): JSONSchema {
  const schema: JSONSchema = {
    ...baseSchema,
    type: 'array',
    items: zodToJsonSchema(def.type, options),
  };

  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case 'min':
          schema.minItems = check.value as number;
          break;
        case 'max':
          schema.maxItems = check.value as number;
          break;
        case 'length':
          schema.minItems = check.value as number;
          schema.maxItems = check.value as number;
          break;
        case 'nonempty':
          schema.minItems = 1;
          break;
      }
    }
  }

  return schema;
}

/**
 * Convert Zod object schema
 */
function convertZodObject(
  def: ZodDef,
  baseSchema: JSONSchema,
  options: { definitions?: Map<string, JSONSchema>; path?: string[] }
): JSONSchema {
  const shape = def.shape?.() || {};
  const properties: Record<string, JSONSchema> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    if (!isZodSchema(value)) continue;

    const propSchema = zodToJsonSchema(value, {
      ...options,
      path: [...(options.path || []), key],
    });

    properties[key] = propSchema;

    // Check if required (not optional/nullable with undefined)
    if (!isOptional(value)) {
      required.push(key);
    }
  }

  return {
    ...baseSchema,
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

/**
 * Check if a Zod schema is optional
 */
function isOptional(schema: ZodLike): boolean {
  const typeName = schema._def.typeName;

  if (typeName === 'ZodOptional' || typeName === 'ZodUndefined') {
    return true;
  }

  if (typeName === 'ZodDefault') {
    return true;
  }

  if (typeName === 'ZodNullable' && schema._def.innerType) {
    return isOptional(schema._def.innerType as ZodLike);
  }

  return false;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract example value from Zod schema default
 */
export function extractExample(schema: unknown): unknown {
  if (!isZodSchema(schema)) {
    return undefined;
  }

  const { _def: def } = schema;

  // Check for default value
  if (def.typeName === 'ZodDefault' && def.defaultValue) {
    return def.defaultValue();
  }

  // Check for literal value
  if (def.typeName === 'ZodLiteral') {
    return (def as unknown as { value: unknown }).value;
  }

  // Check for enum - return first value
  if (def.typeName === 'ZodEnum' && def.values && (def.values as unknown[]).length > 0) {
    return (def.values as unknown[])[0];
  }

  // For objects, recursively extract examples
  if (def.typeName === 'ZodObject' && def.shape) {
    const shape = def.shape();
    const example: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(shape)) {
      const fieldExample = extractExample(value);
      if (fieldExample !== undefined) {
        example[key] = fieldExample;
      }
    }
    if (Object.keys(example).length > 0) {
      return example;
    }
  }

  // Unwrap optional/nullable/default
  if (
    (def.typeName === 'ZodOptional' ||
      def.typeName === 'ZodNullable' ||
      def.typeName === 'ZodDefault') &&
    def.innerType
  ) {
    return extractExample(def.innerType);
  }

  return undefined;
}

/**
 * Get Zod schema description
 */
export function getSchemaDescription(schema: unknown): string | undefined {
  if (!isZodSchema(schema)) {
    return undefined;
  }
  return schema.description || schema._def.description;
}
