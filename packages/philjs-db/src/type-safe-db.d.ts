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
export type InferModel<T> = T extends {
    [K in keyof T]: infer U;
} ? U : never;
export type InferSelect<T> = {
    [K in keyof T]: T[K] extends {
        notNull: true;
    } ? NonNullable<T[K]> : T[K] | null;
};
export type InferInsert<T> = {
    [K in keyof T as T[K] extends {
        default: any;
    } | {
        defaultNow: true;
    } ? never : K]: T[K] extends {
        notNull: true;
    } ? NonNullable<T[K]> : T[K] | null;
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
export declare class TypeSafeQueryBuilder<T extends Record<string, any>> {
    private _select?;
    private _where?;
    private _orderBy?;
    private _limit?;
    private _offset?;
    private _include?;
    select<K extends keyof T>(...fields: K[]): TypeSafeQueryBuilder<Pick<T, K>>;
    where(clause: Partial<T> | WhereClause<T>): this;
    orderBy<K extends keyof T>(field: K, direction?: 'asc' | 'desc'): this;
    limit(count: number): this;
    offset(count: number): this;
    include<K extends string>(relations: Record<K, boolean>): this;
    build(): QueryOptions<T>;
}
export interface QueryOptions<T> {
    select?: Partial<Record<keyof T, boolean>>;
    where?: Partial<T> | WhereClause<T>;
    orderBy?: OrderByClause<T>[];
    limit?: number;
    offset?: number;
    include?: Partial<Record<string, boolean>>;
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
export declare const Operators: {
    /**
     * Equals
     */
    readonly eq: <T>(value: T) => {
        equals: T;
    };
    /**
     * Not equals
     */
    readonly neq: <T>(value: T) => {
        not: T;
    };
    /**
     * Greater than
     */
    readonly gt: <T>(value: T) => {
        gt: T;
    };
    /**
     * Greater than or equal
     */
    readonly gte: <T>(value: T) => {
        gte: T;
    };
    /**
     * Less than
     */
    readonly lt: <T>(value: T) => {
        lt: T;
    };
    /**
     * Less than or equal
     */
    readonly lte: <T>(value: T) => {
        lte: T;
    };
    /**
     * In array
     */
    readonly in: <T>(values: T[]) => {
        in: T[];
    };
    /**
     * Not in array
     */
    readonly notIn: <T>(values: T[]) => {
        notIn: T[];
    };
    /**
     * Contains (string)
     */
    readonly contains: (value: string) => {
        contains: string;
    };
    /**
     * Starts with (string)
     */
    readonly startsWith: (value: string) => {
        startsWith: string;
    };
    /**
     * Ends with (string)
     */
    readonly endsWith: (value: string) => {
        endsWith: string;
    };
    /**
     * Is null
     */
    readonly isNull: () => {
        equals: null;
    };
    /**
     * Is not null
     */
    readonly isNotNull: () => {
        not: null;
    };
    /**
     * Between
     */
    readonly between: <T>(min: T, max: T) => {
        gte: T;
        lte: T;
    };
};
export interface SchemaConstraints<T> {
    required?: (keyof T)[];
    unique?: (keyof T)[];
    min?: Partial<Record<keyof T, number>>;
    max?: Partial<Record<keyof T, number>>;
    pattern?: Partial<Record<keyof T, RegExp>>;
    custom?: Partial<Record<keyof T, (value: any) => boolean | string>>;
}
export declare class SchemaValidator<T extends Record<string, any>> {
    private constraints;
    constructor(constraints: SchemaConstraints<T>);
    validate(data: Partial<T>): ValidationResult;
    validateAsync(data: Partial<T>): Promise<ValidationResult>;
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
export declare class RelationshipBuilder<From, To> {
    private config;
    oneToOne(): this;
    oneToMany(): this;
    manyToMany(through: any): this;
    foreignKey(key: string): this;
    references(ref: string): this;
    build(): Relationship<From, To>;
}
export declare function relationship<From, To>(): RelationshipBuilder<From, To>;
export type MigrationOperation = CreateTableOperation | DropTableOperation | AddColumnOperation | DropColumnOperation | AlterColumnOperation | CreateIndexOperation | DropIndexOperation;
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
export declare class MigrationBuilder {
    private operations;
    createTable(name: string, columns: ColumnDefinition[]): this;
    dropTable(name: string): this;
    addColumn(table: string, column: ColumnDefinition): this;
    dropColumn(table: string, column: string): this;
    alterColumn(table: string, column: string, changes: Partial<ColumnDefinition>): this;
    createIndex(table: string, columns: string[], unique?: boolean): this;
    build(): MigrationOperation[];
}
/**
 * Create type-safe query builder
 */
export declare function query<T extends Record<string, any>>(): TypeSafeQueryBuilder<T>;
/**
 * Create schema validator
 */
export declare function validator<T extends Record<string, any>>(constraints: SchemaConstraints<T>): SchemaValidator<T>;
/**
 * Create migration builder
 */
export declare function migration(): MigrationBuilder;
/**
 * Type guard for checking if value matches schema
 */
export declare function is<T extends Record<string, any>>(value: any, validator: SchemaValidator<T>): value is T;
/**
 * Assert that value matches schema (throws on failure)
 */
export declare function assert<T extends Record<string, any>>(value: any, validator: SchemaValidator<T>, message?: string): asserts value is T;
/**
 * Create type-safe pick
 */
export declare function pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;
/**
 * Create type-safe omit
 */
export declare function omit<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K>;
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
export type Exact<T, Shape> = T extends Shape ? Exclude<keyof T, keyof Shape> extends never ? T : never : never;
//# sourceMappingURL=type-safe-db.d.ts.map