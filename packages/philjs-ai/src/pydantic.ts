/**
 * @philjs/ai - Pydantic AI Bridge
 *
 * Provides JSON Schema validation compatible with Python Pydantic models.
 * Useful for validating LLM outputs and ensuring type safety across
 * TypeScript/Python boundaries.
 *
 * @see https://docs.pydantic.dev/latest/concepts/json_schema/
 */

export interface JSONSchemaProperty {
    type?: string | string[];
    title?: string;
    description?: string;
    default?: any;
    enum?: any[];
    const?: any;
    format?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    multipleOf?: number;
    items?: JSONSchemaProperty;
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
    additionalProperties?: boolean | JSONSchemaProperty;
    allOf?: JSONSchemaProperty[];
    anyOf?: JSONSchemaProperty[];
    oneOf?: JSONSchemaProperty[];
    not?: JSONSchemaProperty;
    $ref?: string;
    $defs?: Record<string, JSONSchemaProperty>;
}

export interface JSONSchema extends JSONSchemaProperty {
    $schema?: string;
    $id?: string;
}

export interface ValidationError {
    path: string[];
    message: string;
    value?: any;
    expected?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    data?: any;
}

/**
 * Validates data against a JSON Schema (Pydantic-compatible)
 */
export class PydanticBridge {
    private schema: JSONSchema;
    private definitions: Record<string, JSONSchemaProperty>;

    constructor(schema: JSONSchema) {
        this.schema = schema;
        this.definitions = schema.$defs || {};
    }

    /**
     * Validate data against the schema
     */
    validate(data: unknown): ValidationResult {
        const errors: ValidationError[] = [];
        const valid = this.validateValue(data, this.schema, [], errors);

        return {
            valid,
            errors,
            data: valid ? data : undefined,
        };
    }

    /**
     * Validate and parse data, throwing on error
     */
    parse<T = unknown>(data: unknown): T {
        const result = this.validate(data);
        if (!result.valid) {
            const errorMessages = result.errors
                .map(e => `  - ${e.path.join('.')}: ${e.message}`)
                .join('\n');
            throw new Error(`Validation failed:\n${errorMessages}`);
        }
        return data as T;
    }

    /**
     * Safe parse - returns result without throwing
     */
    safeParse<T = unknown>(data: unknown): { success: true; data: T } | { success: false; errors: ValidationError[] } {
        const result = this.validate(data);
        if (result.valid) {
            return { success: true, data: data as T };
        }
        return { success: false, errors: result.errors };
    }

    /**
     * Get the JSON Schema for use with LLMs
     */
    toJSONSchema(): JSONSchema {
        return { ...this.schema };
    }

    /**
     * Validate a value against a schema property
     */
    private validateValue(
        value: unknown,
        schema: JSONSchemaProperty,
        path: string[],
        errors: ValidationError[]
    ): boolean {
        // Handle $ref
        if (schema.$ref) {
            const refName = schema.$ref.replace('#/$defs/', '').replace('#/definitions/', '');
            const refSchema = this.definitions[refName];
            if (!refSchema) {
                errors.push({ path, message: `Unknown reference: ${schema.$ref}` });
                return false;
            }
            return this.validateValue(value, refSchema, path, errors);
        }

        // Handle allOf
        if (schema.allOf) {
            return schema.allOf.every(subSchema =>
                this.validateValue(value, subSchema, path, errors)
            );
        }

        // Handle anyOf
        if (schema.anyOf) {
            const tempErrors: ValidationError[] = [];
            const anyValid = schema.anyOf.some(subSchema =>
                this.validateValue(value, subSchema, path, tempErrors)
            );
            if (!anyValid) {
                errors.push({
                    path,
                    message: 'Value does not match any of the allowed schemas',
                    value,
                });
            }
            return anyValid;
        }

        // Handle oneOf
        if (schema.oneOf) {
            const matchCount = schema.oneOf.filter(subSchema => {
                const tempErrors: ValidationError[] = [];
                return this.validateValue(value, subSchema, path, tempErrors);
            }).length;

            if (matchCount !== 1) {
                errors.push({
                    path,
                    message: `Value must match exactly one schema, but matched ${matchCount}`,
                    value,
                });
                return false;
            }
            return true;
        }

        // Handle const
        if (schema.const !== undefined) {
            if (value !== schema.const) {
                errors.push({
                    path,
                    message: `Value must be ${JSON.stringify(schema.const)}`,
                    value,
                    expected: String(schema.const),
                });
                return false;
            }
            return true;
        }

        // Handle enum
        if (schema.enum) {
            if (!schema.enum.includes(value)) {
                errors.push({
                    path,
                    message: `Value must be one of: ${schema.enum.map(v => JSON.stringify(v)).join(', ')}`,
                    value,
                    expected: schema.enum.join(' | '),
                });
                return false;
            }
            return true;
        }

        // Handle null type
        if (value === null) {
            const types = Array.isArray(schema.type) ? schema.type : [schema.type];
            if (types.includes('null')) {
                return true;
            }
            errors.push({ path, message: 'Value cannot be null', value });
            return false;
        }

        // Handle type validation
        if (schema.type) {
            const types = Array.isArray(schema.type) ? schema.type : [schema.type];
            const actualType = this.getType(value);

            if (!types.includes(actualType)) {
                errors.push({
                    path,
                    message: `Expected type ${types.join(' | ')}, got ${actualType}`,
                    value,
                    expected: types.join(' | '),
                });
                return false;
            }

            // Type-specific validation
            switch (actualType) {
                case 'string':
                    return this.validateString(value as string, schema, path, errors);
                case 'number':
                case 'integer':
                    return this.validateNumber(value as number, schema, path, errors);
                case 'array':
                    return this.validateArray(value as unknown[], schema, path, errors);
                case 'object':
                    return this.validateObject(value as Record<string, unknown>, schema, path, errors);
            }
        }

        return true;
    }

    /**
     * Get the JSON Schema type of a value
     */
    private getType(value: unknown): string {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'integer' : 'number';
        }
        return typeof value;
    }

    /**
     * Validate string constraints
     */
    private validateString(
        value: string,
        schema: JSONSchemaProperty,
        path: string[],
        errors: ValidationError[]
    ): boolean {
        let valid = true;

        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push({
                path,
                message: `String must be at least ${schema.minLength} characters`,
                value,
            });
            valid = false;
        }

        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push({
                path,
                message: `String must be at most ${schema.maxLength} characters`,
                value,
            });
            valid = false;
        }

        if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
                errors.push({
                    path,
                    message: `String must match pattern: ${schema.pattern}`,
                    value,
                });
                valid = false;
            }
        }

        if (schema.format) {
            if (!this.validateFormat(value, schema.format)) {
                errors.push({
                    path,
                    message: `String must be a valid ${schema.format}`,
                    value,
                });
                valid = false;
            }
        }

        return valid;
    }

    /**
     * Validate number constraints
     */
    private validateNumber(
        value: number,
        schema: JSONSchemaProperty,
        path: string[],
        errors: ValidationError[]
    ): boolean {
        let valid = true;

        if (schema.minimum !== undefined && value < schema.minimum) {
            errors.push({
                path,
                message: `Number must be >= ${schema.minimum}`,
                value,
            });
            valid = false;
        }

        if (schema.maximum !== undefined && value > schema.maximum) {
            errors.push({
                path,
                message: `Number must be <= ${schema.maximum}`,
                value,
            });
            valid = false;
        }

        if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
            errors.push({
                path,
                message: `Number must be > ${schema.exclusiveMinimum}`,
                value,
            });
            valid = false;
        }

        if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
            errors.push({
                path,
                message: `Number must be < ${schema.exclusiveMaximum}`,
                value,
            });
            valid = false;
        }

        if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
            errors.push({
                path,
                message: `Number must be a multiple of ${schema.multipleOf}`,
                value,
            });
            valid = false;
        }

        return valid;
    }

    /**
     * Validate array constraints
     */
    private validateArray(
        value: unknown[],
        schema: JSONSchemaProperty,
        path: string[],
        errors: ValidationError[]
    ): boolean {
        let valid = true;

        if (schema.minItems !== undefined && value.length < schema.minItems) {
            errors.push({
                path,
                message: `Array must have at least ${schema.minItems} items`,
                value,
            });
            valid = false;
        }

        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            errors.push({
                path,
                message: `Array must have at most ${schema.maxItems} items`,
                value,
            });
            valid = false;
        }

        if (schema.uniqueItems && new Set(value.map(v => JSON.stringify(v))).size !== value.length) {
            errors.push({
                path,
                message: 'Array items must be unique',
                value,
            });
            valid = false;
        }

        if (schema.items) {
            for (let i = 0; i < value.length; i++) {
                if (!this.validateValue(value[i], schema.items, [...path, String(i)], errors)) {
                    valid = false;
                }
            }
        }

        return valid;
    }

    /**
     * Validate object constraints
     */
    private validateObject(
        value: Record<string, unknown>,
        schema: JSONSchemaProperty,
        path: string[],
        errors: ValidationError[]
    ): boolean {
        let valid = true;

        // Check required properties
        if (schema.required) {
            for (const prop of schema.required) {
                if (!(prop in value)) {
                    errors.push({
                        path: [...path, prop],
                        message: 'Required property is missing',
                    });
                    valid = false;
                }
            }
        }

        // Validate each property
        if (schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                if (propName in value) {
                    if (!this.validateValue(value[propName], propSchema, [...path, propName], errors)) {
                        valid = false;
                    }
                }
            }
        }

        // Check additional properties
        if (schema.additionalProperties === false) {
            const allowedProps = new Set(Object.keys(schema.properties || {}));
            for (const prop of Object.keys(value)) {
                if (!allowedProps.has(prop)) {
                    errors.push({
                        path: [...path, prop],
                        message: 'Additional property not allowed',
                        value: value[prop],
                    });
                    valid = false;
                }
            }
        } else if (typeof schema.additionalProperties === 'object') {
            const definedProps = new Set(Object.keys(schema.properties || {}));
            for (const [prop, propValue] of Object.entries(value)) {
                if (!definedProps.has(prop)) {
                    if (!this.validateValue(propValue, schema.additionalProperties, [...path, prop], errors)) {
                        valid = false;
                    }
                }
            }
        }

        return valid;
    }

    /**
     * Validate string format
     */
    private validateFormat(value: string, format: string): boolean {
        const formats: Record<string, RegExp> = {
            'email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'uri': /^https?:\/\/.+/,
            'uuid': /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            'date': /^\d{4}-\d{2}-\d{2}$/,
            'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/,
            'time': /^\d{2}:\d{2}:\d{2}(?:\.\d+)?$/,
            'ipv4': /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
            'ipv6': /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
        };

        const regex = formats[format];
        if (regex) {
            return regex.test(value);
        }

        // Unknown format - pass validation
        return true;
    }

    /**
     * Create a bridge from a Pydantic model JSON schema
     * (exported from Python using model.model_json_schema())
     */
    static fromPydanticSchema(schema: JSONSchema): PydanticBridge {
        return new PydanticBridge(schema);
    }

    /**
     * Load schema from a JSON file
     */
    static async fromFile(path: string): Promise<PydanticBridge> {
        const { readFile } = await import('node:fs/promises');
        const content = await readFile(path, 'utf-8');
        const schema = JSON.parse(content);
        return new PydanticBridge(schema);
    }
}

/**
 * Create a validation bridge from a JSON Schema
 */
export function createPydanticBridge(schema: JSONSchema): PydanticBridge {
    return new PydanticBridge(schema);
}

/**
 * Helper to convert TypeScript types to JSON Schema
 * (simplified - for full support use libraries like zod or typebox)
 */
export function inferSchema<T>(example: T): JSONSchema {
    const schema: JSONSchema = {};

    if (example === null) {
        schema.type = 'null';
    } else if (Array.isArray(example)) {
        schema.type = 'array';
        if (example.length > 0) {
            schema.items = inferSchema(example[0]);
        }
    } else if (typeof example === 'object') {
        schema.type = 'object';
        schema.properties = {};
        for (const [key, value] of Object.entries(example)) {
            schema.properties[key] = inferSchema(value);
        }
        schema.required = Object.keys(example);
    } else if (typeof example === 'string') {
        schema.type = 'string';
    } else if (typeof example === 'number') {
        schema.type = Number.isInteger(example) ? 'integer' : 'number';
    } else if (typeof example === 'boolean') {
        schema.type = 'boolean';
    }

    return schema;
}
