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
// Core Types
// ============================================================================

export type InferModel<T> = T extends { [K in keyof T]: infer U } ? U : never;

export type InferSelect<T> = {
  [K in keyof T]: T[K] extends { notNull: true }
    ? NonNullable<T[K]>
    : T[K] | null;
};

export type InferInsert<T> = {
  [K in keyof T as T[K] extends { default: any } | { defaultNow: true }
    ? never
    : K]: T[K] extends { notNull: true }
    ? NonNullable<T[K]>
    : T[K] | null;
};

export type InferUpdate<T> = Partial<InferInsert<T>>;

export type RelationshipType = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface Relationship<From, To, Type extends RelationshipType = 'one-to-many'> {
  from: From;
  to: To;
  type: Type;
  foreignKey?: string;
  references?: string;
  through?: any;
}

// ============================================================================
// Type-Safe Query Builder
// ============================================================================

export class TypeSafeQueryBuilder<T extends Record<string, any>> {
  private _select?: Partial<Record<keyof T, boolean>>;
  private _where?: Partial<T> | WhereClause<T>;
  private _orderBy?: OrderByClause<T>[];
  private _limit?: number;
  private _offset?: number;
  private _include?: Partial<Record<string, boolean>>;

  select<K extends keyof T>(...fields: K[]): TypeSafeQueryBuilder<Pick<T, K>> {
    this._select = fields.reduce((acc, field) => {
      acc[field as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    return this as any;
  }

  where(clause: Partial<T> | WhereClause<T>): this {
    this._where = clause;
    return this;
  }

  orderBy<K extends keyof T>(
    field: K,
    direction: 'asc' | 'desc' = 'asc'
  ): this {
    if (!this._orderBy) this._orderBy = [];
    this._orderBy.push({ field: field as string, direction });
    return this;
  }

  limit(count: number): this {
    this._limit = count;
    return this;
  }

  offset(count: number): this {
    this._offset = count;
    return this;
  }

  include<K extends string>(relations: Record<K, boolean>): this {
    this._include = relations;
    return this;
  }

  build(): QueryOptions<T> {
    return {
      select: this._select,
      where: this._where,
      orderBy: this._orderBy,
      limit: this._limit,
      offset: this._offset,
      include: this._include,
    };
  }
}

export interface QueryOptions<T> {
  select?: Partial<Record<keyof T, boolean>>;
  where?: Partial<T> | WhereClause<T>;
  orderBy?: OrderByClause<T>[];
  limit?: number;
  offset?: number;
  include?: Record<string, boolean>;
}

export interface WhereClause<T> {
  AND?: WhereClause<T>[];
  OR?: WhereClause<T>[];
  NOT?: WhereClause<T>;
  [key: string]: any;
}

export interface OrderByClause<T> {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// Type-Safe Operators
// ============================================================================

export const Operators = {
  /**
   * Equals
   */
  eq<T>(value: T): { equals: T } {
    return { equals: value };
  },

  /**
   * Not equals
   */
  neq<T>(value: T): { not: T } {
    return { not: value };
  },

  /**
   * Greater than
   */
  gt<T>(value: T): { gt: T } {
    return { gt: value };
  },

  /**
   * Greater than or equal
   */
  gte<T>(value: T): { gte: T } {
    return { gte: value };
  },

  /**
   * Less than
   */
  lt<T>(value: T): { lt: T } {
    return { lt: value };
  },

  /**
   * Less than or equal
   */
  lte<T>(value: T): { lte: T } {
    return { lte: value };
  },

  /**
   * In array
   */
  in<T>(values: T[]): { in: T[] } {
    return { in: values };
  },

  /**
   * Not in array
   */
  notIn<T>(values: T[]): { notIn: T[] } {
    return { notIn: values };
  },

  /**
   * Contains (string)
   */
  contains(value: string): { contains: string } {
    return { contains: value };
  },

  /**
   * Starts with (string)
   */
  startsWith(value: string): { startsWith: string } {
    return { startsWith: value };
  },

  /**
   * Ends with (string)
   */
  endsWith(value: string): { endsWith: string } {
    return { endsWith: value };
  },

  /**
   * Is null
   */
  isNull(): { equals: null } {
    return { equals: null };
  },

  /**
   * Is not null
   */
  isNotNull(): { not: null } {
    return { not: null };
  },

  /**
   * Between
   */
  between<T>(min: T, max: T): { gte: T; lte: T } {
    return { gte: min, lte: max };
  },
} as const;

// ============================================================================
// Schema Validation
// ============================================================================

export interface SchemaConstraints<T> {
  required?: (keyof T)[];
  unique?: (keyof T)[];
  min?: Partial<Record<keyof T, number>>;
  max?: Partial<Record<keyof T, number>>;
  pattern?: Partial<Record<keyof T, RegExp>>;
  custom?: Partial<Record<keyof T, (value: any) => boolean | string>>;
}

export class SchemaValidator<T extends Record<string, any>> {
  constructor(private constraints: SchemaConstraints<T>) {}

  validate(data: Partial<T>): ValidationResult {
    const errors: ValidationError[] = [];

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
      for (const [field, min] of Object.entries(this.constraints.min)) {
        const value = data[field as keyof T];
        if (value !== undefined && value !== null) {
          if (typeof value === 'number' && value < min) {
            errors.push({
              field,
              message: `${field} must be at least ${min}`,
              type: 'min',
            });
          } else if (typeof value === 'string' && value.length < min) {
            errors.push({
              field,
              message: `${field} must be at least ${min} characters`,
              type: 'minLength',
            });
          }
        }
      }
    }

    if (this.constraints.max) {
      for (const [field, max] of Object.entries(this.constraints.max)) {
        const value = data[field as keyof T];
        if (value !== undefined && value !== null) {
          if (typeof value === 'number' && value > max) {
            errors.push({
              field,
              message: `${field} must be at most ${max}`,
              type: 'max',
            });
          } else if (typeof value === 'string' && value.length > max) {
            errors.push({
              field,
              message: `${field} must be at most ${max} characters`,
              type: 'maxLength',
            });
          }
        }
      }
    }

    // Pattern constraints
    if (this.constraints.pattern) {
      for (const [field, pattern] of Object.entries(this.constraints.pattern)) {
        const value = data[field as keyof T];
        if (value !== undefined && value !== null && typeof value === 'string') {
          if (!pattern.test(value)) {
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
      for (const [field, validator] of Object.entries(this.constraints.custom)) {
        const value = data[field as keyof T];
        if (value !== undefined && value !== null) {
          const result = validator(value);
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

  async validateAsync(data: Partial<T>): Promise<ValidationResult> {
    // For async validators
    return this.validate(data);
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  type: string;
}

// ============================================================================
// Type-Safe Relationships
// ============================================================================

export class RelationshipBuilder<From, To> {
  private config: {
    type?: RelationshipType;
    foreignKey?: string;
    references?: string;
    through?: any;
  } = {};

  oneToOne(): this {
    this.config.type = 'one-to-one';
    return this;
  }

  oneToMany(): this {
    this.config.type = 'one-to-many';
    return this;
  }

  manyToMany(through: any): this {
    this.config.type = 'many-to-many';
    this.config.through = through;
    return this;
  }

  foreignKey(key: string): this {
    this.config.foreignKey = key;
    return this;
  }

  references(ref: string): this {
    this.config.references = ref;
    return this;
  }

  build(): Relationship<From, To> {
    return {
      from: null as any,
      to: null as any,
      type: this.config.type || 'one-to-many',
      foreignKey: this.config.foreignKey,
      references: this.config.references,
      through: this.config.through,
    };
  }
}

export function relationship<From, To>(): RelationshipBuilder<From, To> {
  return new RelationshipBuilder<From, To>();
}

// ============================================================================
// Migration Type Safety
// ============================================================================

export type MigrationOperation =
  | CreateTableOperation
  | DropTableOperation
  | AddColumnOperation
  | DropColumnOperation
  | AlterColumnOperation
  | CreateIndexOperation
  | DropIndexOperation;

export interface CreateTableOperation {
  type: 'createTable';
  table: string;
  columns: ColumnDefinition[];
}

export interface DropTableOperation {
  type: 'dropTable';
  table: string;
}

export interface AddColumnOperation {
  type: 'addColumn';
  table: string;
  column: ColumnDefinition;
}

export interface DropColumnOperation {
  type: 'dropColumn';
  table: string;
  column: string;
}

export interface AlterColumnOperation {
  type: 'alterColumn';
  table: string;
  column: string;
  changes: Partial<ColumnDefinition>;
}

export interface CreateIndexOperation {
  type: 'createIndex';
  table: string;
  columns: string[];
  unique?: boolean;
}

export interface DropIndexOperation {
  type: 'dropIndex';
  table: string;
  name: string;
}

export interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  nullable?: boolean;
  default?: any;
  unique?: boolean;
  primaryKey?: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export class MigrationBuilder {
  private operations: MigrationOperation[] = [];

  createTable(name: string, columns: ColumnDefinition[]): this {
    this.operations.push({
      type: 'createTable',
      table: name,
      columns,
    });
    return this;
  }

  dropTable(name: string): this {
    this.operations.push({
      type: 'dropTable',
      table: name,
    });
    return this;
  }

  addColumn(table: string, column: ColumnDefinition): this {
    this.operations.push({
      type: 'addColumn',
      table,
      column,
    });
    return this;
  }

  dropColumn(table: string, column: string): this {
    this.operations.push({
      type: 'dropColumn',
      table,
      column,
    });
    return this;
  }

  alterColumn(table: string, column: string, changes: Partial<ColumnDefinition>): this {
    this.operations.push({
      type: 'alterColumn',
      table,
      column,
      changes,
    });
    return this;
  }

  createIndex(table: string, columns: string[], unique = false): this {
    this.operations.push({
      type: 'createIndex',
      table,
      columns,
      unique,
    });
    return this;
  }

  build(): MigrationOperation[] {
    return this.operations;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create type-safe query builder
 */
export function query<T extends Record<string, any>>(): TypeSafeQueryBuilder<T> {
  return new TypeSafeQueryBuilder<T>();
}

/**
 * Create schema validator
 */
export function validator<T extends Record<string, any>>(
  constraints: SchemaConstraints<T>
): SchemaValidator<T> {
  return new SchemaValidator<T>(constraints);
}

/**
 * Create migration builder
 */
export function migration(): MigrationBuilder {
  return new MigrationBuilder();
}

/**
 * Type guard for checking if value matches schema
 */
export function is<T>(value: any, validator: SchemaValidator<T>): value is T {
  const result = validator.validate(value);
  return result.valid;
}

/**
 * Assert that value matches schema (throws on failure)
 */
export function assert<T>(
  value: any,
  validator: SchemaValidator<T>,
  message?: string
): asserts value is T {
  const result = validator.validate(value);
  if (!result.valid) {
    const errors = result.errors.map(e => `${e.field}: ${e.message}`).join(', ');
    throw new Error(message || `Validation failed: ${errors}`);
  }
}

/**
 * Create type-safe pick
 */
export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
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
export function omit<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const result = { ...obj } as any;
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Deep partial type helper
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Deep required type helper
 */
export type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};

/**
 * Exact type helper (no extra properties)
 */
export type Exact<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;
