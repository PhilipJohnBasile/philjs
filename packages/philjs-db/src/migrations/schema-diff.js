/**
 * Schema Diff Generator
 * Compares current database schema with target schema
 */
export class SchemaDiffGenerator {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Generate schema diff between current and target
     */
    async generate() {
        const currentSchema = await this.getCurrentSchema();
        const targetSchema = await this.getTargetSchema();
        return this.compareSchemas(currentSchema, targetSchema);
    }
    /**
     * Get current database schema
     */
    async getCurrentSchema() {
        switch (this.config.type) {
            case 'postgres':
                return await this.getPostgresSchema();
            case 'mysql':
                return await this.getMySQLSchema();
            case 'sqlite':
                return await this.getSQLiteSchema();
            default:
                throw new Error(`Unsupported database type: ${this.config.type}`);
        }
    }
    /**
     * Get target schema from schema file or models
     */
    async getTargetSchema() {
        // Load from schema file if specified
        if (this.config.schemaFile) {
            return await this.loadSchemaFile(this.config.schemaFile);
        }
        // Otherwise, parse from models/entities
        return await this.parseModelsSchema();
    }
    /**
     * Compare two schemas and generate diff
     */
    compareSchemas(current, target) {
        const diff = {
            tables: {
                created: [],
                dropped: [],
                modified: [],
            },
            columns: [],
            indexes: [],
            foreignKeys: [],
        };
        // Find created and dropped tables
        const currentTables = new Set(current.tables.map((t) => t.name));
        const targetTables = new Set(target.tables.map((t) => t.name));
        for (const table of target.tables) {
            if (!currentTables.has(table.name)) {
                diff.tables.created.push(table);
            }
        }
        for (const table of current.tables) {
            if (!targetTables.has(table.name)) {
                diff.tables.dropped.push(table.name);
            }
        }
        // Find modified tables
        for (const targetTable of target.tables) {
            const currentTable = current.tables.find((t) => t.name === targetTable.name);
            if (!currentTable)
                continue;
            const modification = this.compareTable(currentTable, targetTable);
            if (this.hasChanges(modification)) {
                diff.tables.modified.push(modification);
                diff.columns.push(...modification.changes.columns);
                diff.indexes.push(...modification.changes.indexes);
                diff.foreignKeys.push(...modification.changes.foreignKeys);
            }
        }
        return diff;
    }
    /**
     * Compare two tables
     */
    compareTable(current, target) {
        const modification = {
            name: target.name,
            changes: {
                columns: [],
                indexes: [],
                foreignKeys: [],
            },
        };
        // Compare columns
        const currentColumns = new Map(current.columns.map((c) => [c.name, c]));
        const targetColumns = new Map(target.columns.map((c) => [c.name, c]));
        for (const [name, column] of targetColumns) {
            if (!currentColumns.has(name)) {
                modification.changes.columns.push({
                    table: target.name,
                    type: 'added',
                    name,
                    newDefinition: column,
                });
            }
            else {
                const currentColumn = currentColumns.get(name);
                if (!this.columnsEqual(currentColumn, column)) {
                    modification.changes.columns.push({
                        table: target.name,
                        type: 'modified',
                        name,
                        oldDefinition: currentColumn,
                        newDefinition: column,
                    });
                }
            }
        }
        for (const [name, column] of currentColumns) {
            if (!targetColumns.has(name)) {
                modification.changes.columns.push({
                    table: target.name,
                    type: 'removed',
                    name,
                    oldDefinition: column,
                });
            }
        }
        // Compare indexes
        const currentIndexes = new Map(current.indexes.map((i) => [i.name, i]));
        const targetIndexes = new Map(target.indexes.map((i) => [i.name, i]));
        for (const [name, index] of targetIndexes) {
            if (!currentIndexes.has(name)) {
                modification.changes.indexes.push({
                    table: target.name,
                    type: 'added',
                    name,
                    columns: index.columns,
                    unique: index.unique,
                });
            }
        }
        for (const [name, index] of currentIndexes) {
            if (!targetIndexes.has(name)) {
                modification.changes.indexes.push({
                    table: target.name,
                    type: 'removed',
                    name,
                    columns: index.columns,
                    unique: index.unique,
                });
            }
        }
        // Compare foreign keys
        const currentForeignKeys = new Map(current.foreignKeys.map((fk) => [fk.name, fk]));
        const targetForeignKeys = new Map(target.foreignKeys.map((fk) => [fk.name, fk]));
        for (const [name, fk] of targetForeignKeys) {
            if (!currentForeignKeys.has(name)) {
                modification.changes.foreignKeys.push({
                    table: target.name,
                    type: 'added',
                    name,
                    column: fk.column,
                    references: fk.references,
                    ...(fk.onDelete !== undefined ? { onDelete: fk.onDelete } : {}),
                    ...(fk.onUpdate !== undefined ? { onUpdate: fk.onUpdate } : {}),
                });
            }
        }
        for (const [name, fk] of currentForeignKeys) {
            if (!targetForeignKeys.has(name)) {
                modification.changes.foreignKeys.push({
                    table: target.name,
                    type: 'removed',
                    name,
                    column: fk.column,
                    references: fk.references,
                    ...(fk.onDelete !== undefined ? { onDelete: fk.onDelete } : {}),
                    ...(fk.onUpdate !== undefined ? { onUpdate: fk.onUpdate } : {}),
                });
            }
        }
        return modification;
    }
    /**
     * Check if two columns are equal
     */
    columnsEqual(a, b) {
        return (a.type === b.type &&
            a.nullable === b.nullable &&
            a.default === b.default &&
            a.length === b.length &&
            a.precision === b.precision &&
            a.scale === b.scale &&
            a.unsigned === b.unsigned &&
            a.autoIncrement === b.autoIncrement);
    }
    /**
     * Check if modification has any changes
     */
    hasChanges(modification) {
        return (modification.changes.columns.length > 0 ||
            modification.changes.indexes.length > 0 ||
            modification.changes.foreignKeys.length > 0);
    }
    /**
     * Get PostgreSQL schema
     */
    async getPostgresSchema() {
        // Query information_schema to get current schema
        const tables = [];
        // This would query the actual database
        // Implementation depends on database driver
        return { tables };
    }
    /**
     * Get MySQL schema
     */
    async getMySQLSchema() {
        const tables = [];
        return { tables };
    }
    /**
     * Get SQLite schema
     */
    async getSQLiteSchema() {
        const tables = [];
        return { tables };
    }
    /**
     * Load schema from file
     */
    async loadSchemaFile(filepath) {
        // Load and parse schema file
        const tables = [];
        return { tables };
    }
    /**
     * Parse schema from models/entities
     */
    async parseModelsSchema() {
        // Parse TypeScript models or ORM entities
        const tables = [];
        return { tables };
    }
    /**
     * Generate SQL for schema diff
     */
    generateSQL(diff) {
        const sql = [];
        // Drop tables
        for (const table of diff.tables.dropped) {
            sql.push(this.generateDropTableSQL(table));
        }
        // Create tables
        for (const table of diff.tables.created) {
            sql.push(this.generateCreateTableSQL(table));
        }
        // Modify tables
        for (const modification of diff.tables.modified) {
            sql.push(...this.generateAlterTableSQL(modification));
        }
        return sql;
    }
    generateDropTableSQL(table) {
        switch (this.config.type) {
            case 'postgres':
                return `DROP TABLE IF EXISTS "${table}"`;
            case 'mysql':
                return `DROP TABLE IF EXISTS \`${table}\``;
            case 'sqlite':
                return `DROP TABLE IF EXISTS "${table}"`;
            default:
                throw new Error(`Unsupported database type`);
        }
    }
    generateCreateTableSQL(table) {
        // Generate CREATE TABLE statement
        return `-- CREATE TABLE ${table.name}`;
    }
    generateAlterTableSQL(modification) {
        const sql = [];
        // Add columns
        for (const column of modification.changes.columns.filter((c) => c.type === 'added')) {
            sql.push(this.generateAddColumnSQL(modification.name, column));
        }
        // Drop columns
        for (const column of modification.changes.columns.filter((c) => c.type === 'removed')) {
            sql.push(this.generateDropColumnSQL(modification.name, column.name));
        }
        // Modify columns
        for (const column of modification.changes.columns.filter((c) => c.type === 'modified')) {
            sql.push(this.generateModifyColumnSQL(modification.name, column));
        }
        return sql;
    }
    generateAddColumnSQL(table, column) {
        return `-- ALTER TABLE ${table} ADD COLUMN ${column.name}`;
    }
    generateDropColumnSQL(table, column) {
        return `-- ALTER TABLE ${table} DROP COLUMN ${column}`;
    }
    generateModifyColumnSQL(table, column) {
        return `-- ALTER TABLE ${table} MODIFY COLUMN ${column.name}`;
    }
}
//# sourceMappingURL=schema-diff.js.map