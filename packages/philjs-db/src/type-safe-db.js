/**
 * Type-Safe Database Utilities
 *
 * Universal type-safe utilities that work with both Prisma and Drizzle:
 * - Type inference from schemas
 * - Type-safe query builders
 * - Relationship type helpers
 * - Validation and constraints
 * - Migration type safety
 */
// ============================================================================
// Type-Safe Query Builder
// ============================================================================
export class TypeSafeQueryBuilder {
    _select;
    _where;
    _orderBy;
    _limit;
    _offset;
    _include;
    select(...fields) {
        this._select = fields.reduce((acc, field) => {
            acc[field] = true;
            return acc;
        }, {});
        return this;
    }
    where(clause) {
        this._where = clause;
        return this;
    }
    orderBy(field, direction = 'asc') {
        if (!this._orderBy)
            this._orderBy = [];
        this._orderBy.push({ field: field, direction });
        return this;
    }
    limit(count) {
        this._limit = count;
        return this;
    }
    offset(count) {
        this._offset = count;
        return this;
    }
    include(relations) {
        this._include = relations;
        return this;
    }
    build() {
        return {
            ...(this._select !== undefined && { select: this._select }),
            ...(this._where !== undefined && { where: this._where }),
            ...(this._orderBy !== undefined && { orderBy: this._orderBy }),
            ...(this._limit !== undefined && { limit: this._limit }),
            ...(this._offset !== undefined && { offset: this._offset }),
            ...(this._include !== undefined && { include: this._include }),
        };
    }
}
// ============================================================================
// Type-Safe Operators
// ============================================================================
export const Operators = {
    /**
     * Equals
     */
    eq(value) {
        return { equals: value };
    },
    /**
     * Not equals
     */
    neq(value) {
        return { not: value };
    },
    /**
     * Greater than
     */
    gt(value) {
        return { gt: value };
    },
    /**
     * Greater than or equal
     */
    gte(value) {
        return { gte: value };
    },
    /**
     * Less than
     */
    lt(value) {
        return { lt: value };
    },
    /**
     * Less than or equal
     */
    lte(value) {
        return { lte: value };
    },
    /**
     * In array
     */
    in(values) {
        return { in: values };
    },
    /**
     * Not in array
     */
    notIn(values) {
        return { notIn: values };
    },
    /**
     * Contains (string)
     */
    contains(value) {
        return { contains: value };
    },
    /**
     * Starts with (string)
     */
    startsWith(value) {
        return { startsWith: value };
    },
    /**
     * Ends with (string)
     */
    endsWith(value) {
        return { endsWith: value };
    },
    /**
     * Is null
     */
    isNull() {
        return { equals: null };
    },
    /**
     * Is not null
     */
    isNotNull() {
        return { not: null };
    },
    /**
     * Between
     */
    between(min, max) {
        return { gte: min, lte: max };
    },
};
export class SchemaValidator {
    constraints;
    constructor(constraints) {
        this.constraints = constraints;
    }
    validate(data) {
        const errors = [];
        // Required fields
        if (this.constraints.required) {
            for (const field of this.constraints.required) {
                if (data[field] === undefined || data[field] === null) {
                    errors.push({
                        field: String(field),
                        message: `${String(field)} is required`,
                        type: 'required',
                    });
                }
            }
        }
        // Min/Max constraints
        if (this.constraints.min) {
            for (const [field, minVal] of Object.entries(this.constraints.min)) {
                const value = data[field];
                if (value !== undefined && value !== null && minVal !== undefined) {
                    if (typeof value === 'number' && value < minVal) {
                        errors.push({
                            field,
                            message: `${field} must be at least ${minVal}`,
                            type: 'min',
                        });
                    }
                    else if (typeof value === 'string' && value.length < minVal) {
                        errors.push({
                            field,
                            message: `${field} must be at least ${minVal} characters`,
                            type: 'minLength',
                        });
                    }
                }
            }
        }
        if (this.constraints.max) {
            for (const [field, maxVal] of Object.entries(this.constraints.max)) {
                const value = data[field];
                if (value !== undefined && value !== null && maxVal !== undefined) {
                    if (typeof value === 'number' && value > maxVal) {
                        errors.push({
                            field,
                            message: `${field} must be at most ${maxVal}`,
                            type: 'max',
                        });
                    }
                    else if (typeof value === 'string' && value.length > maxVal) {
                        errors.push({
                            field,
                            message: `${field} must be at most ${maxVal} characters`,
                            type: 'maxLength',
                        });
                    }
                }
            }
        }
        // Pattern constraints
        if (this.constraints.pattern) {
            for (const [field, patternVal] of Object.entries(this.constraints.pattern)) {
                const value = data[field];
                if (value !== undefined && value !== null && typeof value === 'string' && patternVal) {
                    if (!patternVal.test(value)) {
                        errors.push({
                            field,
                            message: `${field} does not match required pattern`,
                            type: 'pattern',
                        });
                    }
                }
            }
        }
        // Custom validators
        if (this.constraints.custom) {
            for (const [field, validatorFn] of Object.entries(this.constraints.custom)) {
                const value = data[field];
                if (value !== undefined && value !== null && validatorFn) {
                    const result = validatorFn(value);
                    if (result !== true) {
                        errors.push({
                            field,
                            message: typeof result === 'string' ? result : `${field} validation failed`,
                            type: 'custom',
                        });
                    }
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    async validateAsync(data) {
        // For async validators
        return this.validate(data);
    }
}
// ============================================================================
// Type-Safe Relationships
// ============================================================================
export class RelationshipBuilder {
    config = {};
    oneToOne() {
        this.config.type = 'one-to-one';
        return this;
    }
    oneToMany() {
        this.config.type = 'one-to-many';
        return this;
    }
    manyToMany(through) {
        this.config.type = 'many-to-many';
        this.config.through = through;
        return this;
    }
    foreignKey(key) {
        this.config.foreignKey = key;
        return this;
    }
    references(ref) {
        this.config.references = ref;
        return this;
    }
    build() {
        return {
            from: null,
            to: null,
            type: (this.config.type || 'one-to-many'),
            foreignKey: this.config.foreignKey,
            references: this.config.references,
            through: this.config.through,
        };
    }
}
export function relationship() {
    return new RelationshipBuilder();
}
export class MigrationBuilder {
    operations = [];
    createTable(name, columns) {
        this.operations.push({
            type: 'createTable',
            table: name,
            columns,
        });
        return this;
    }
    dropTable(name) {
        this.operations.push({
            type: 'dropTable',
            table: name,
        });
        return this;
    }
    addColumn(table, column) {
        this.operations.push({
            type: 'addColumn',
            table,
            column,
        });
        return this;
    }
    dropColumn(table, column) {
        this.operations.push({
            type: 'dropColumn',
            table,
            column,
        });
        return this;
    }
    alterColumn(table, column, changes) {
        this.operations.push({
            type: 'alterColumn',
            table,
            column,
            changes,
        });
        return this;
    }
    createIndex(table, columns, unique = false) {
        this.operations.push({
            type: 'createIndex',
            table,
            columns,
            unique,
        });
        return this;
    }
    build() {
        return this.operations;
    }
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Create type-safe query builder
 */
export function query() {
    return new TypeSafeQueryBuilder();
}
/**
 * Create schema validator
 */
export function validator(constraints) {
    return new SchemaValidator(constraints);
}
/**
 * Create migration builder
 */
export function migration() {
    return new MigrationBuilder();
}
/**
 * Type guard for checking if value matches schema
 */
export function is(value, validator) {
    const result = validator.validate(value);
    return result.valid;
}
/**
 * Assert that value matches schema (throws on failure)
 */
export function assert(value, validator, message) {
    const result = validator.validate(value);
    if (!result.valid) {
        const errors = result.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new Error(message || `Validation failed: ${errors}`);
    }
}
/**
 * Create type-safe pick
 */
export function pick(obj, ...keys) {
    const result = {};
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}
/**
 * Create type-safe omit
 */
export function omit(obj, ...keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
//# sourceMappingURL=type-safe-db.js.map