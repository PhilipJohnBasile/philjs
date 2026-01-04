/**
 * SQLite Migration Adapter
 */
export class SQLiteMigrationAdapter {
    db;
    queries = [];
    constructor(db) {
        this.db = db;
    }
    createContext() {
        return {
            db: this.db,
            sql: this.sql.bind(this),
            schema: this.createSchemaBuilder(),
            data: this.createDataHelpers(),
            type: 'sqlite',
        };
    }
    async sql(query, params) {
        return await this.db.all(query, params);
    }
    createSchemaBuilder() {
        const self = this;
        return {
            createTable(name, callback) {
                const builder = new SQLiteTableBuilder(name, 'create');
                callback(builder);
                self.queries.push(builder.toSQL());
            },
            dropTable(name) {
                self.queries.push(`DROP TABLE IF EXISTS "${name}"`);
            },
            alterTable(name, callback) {
                const builder = new SQLiteTableBuilder(name, 'alter');
                callback(builder);
                self.queries.push(builder.toSQL());
            },
            renameTable(oldName, newName) {
                self.queries.push(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`);
            },
            async hasTable(name) {
                const result = await self.sql(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [name]);
                return result.length > 0;
            },
            raw(sql) {
                self.queries.push(sql);
            },
        };
    }
    createDataHelpers() {
        const self = this;
        return {
            async insert(table, data) {
                const rows = Array.isArray(data) ? data : [data];
                if (rows.length === 0)
                    return;
                const firstRow = rows[0];
                const columns = Object.keys(firstRow);
                const placeholders = rows
                    .map(() => `(${columns.map(() => '?').join(', ')})`)
                    .join(', ');
                const values = rows.flatMap((row) => columns.map((col) => row[col]));
                await self.sql(`INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES ${placeholders}`, values);
            },
            async update(table, where, data) {
                const setClause = Object.keys(data)
                    .map((key) => `"${key}" = ?`)
                    .join(', ');
                const whereClause = Object.keys(where)
                    .map((key) => `"${key}" = ?`)
                    .join(' AND ');
                await self.sql(`UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`, [...Object.values(data), ...Object.values(where)]);
            },
            async delete(table, where) {
                const whereClause = Object.keys(where)
                    .map((key) => `"${key}" = ?`)
                    .join(' AND ');
                await self.sql(`DELETE FROM "${table}" WHERE ${whereClause}`, Object.values(where));
            },
            async raw(sql, params) {
                return await self.sql(sql, params);
            },
            async batchInsert(table, data, batchSize = 100) {
                for (let i = 0; i < data.length; i += batchSize) {
                    const batch = data.slice(i, i + batchSize);
                    await this.insert(table, batch);
                }
            },
        };
    }
    getQueries() {
        return this.queries;
    }
    clearQueries() {
        this.queries = [];
    }
}
class SQLiteTableBuilder {
    tableName;
    mode;
    columns = [];
    constraints = [];
    alterations = [];
    constructor(tableName, mode) {
        this.tableName = tableName;
        this.mode = mode;
    }
    increments(name) {
        const builder = new SQLiteColumnBuilder(this, name, 'INTEGER', this.mode);
        return builder.primary();
    }
    integer(name) {
        return new SQLiteColumnBuilder(this, name, 'INTEGER', this.mode);
    }
    bigInteger(name) {
        return new SQLiteColumnBuilder(this, name, 'INTEGER', this.mode);
    }
    string(name, length) {
        return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
    }
    text(name) {
        return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
    }
    boolean(name) {
        return new SQLiteColumnBuilder(this, name, 'INTEGER', this.mode);
    }
    date(name) {
        return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
    }
    datetime(name) {
        return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
    }
    timestamp(name) {
        return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
    }
    timestamps(useTimestamps = true) {
        if (useTimestamps) {
            this.timestamp('created_at').defaultTo('CURRENT_TIMESTAMP');
            this.timestamp('updated_at').defaultTo('CURRENT_TIMESTAMP');
        }
    }
    json(name) {
        return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
    }
    jsonb(name) {
        return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
    }
    uuid(name) {
        return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
    }
    decimal(name, precision, scale) {
        return new SQLiteColumnBuilder(this, name, 'REAL', this.mode);
    }
    float(name, precision, scale) {
        return new SQLiteColumnBuilder(this, name, 'REAL', this.mode);
    }
    enum(name, values) {
        const enumValues = values.map((v) => `'${v}'`).join(', ');
        const builder = new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
        builder.check(`"${name}" IN (${enumValues})`);
        return builder;
    }
    primary(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        this.constraints.push(() => `PRIMARY KEY (${cols.map((c) => `"${c}"`).join(', ')})`);
    }
    unique(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        this.constraints.push(() => `UNIQUE (${cols.map((c) => `"${c}"`).join(', ')})`);
    }
    index(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        const indexName = `${this.tableName}_${cols.join('_')}_index`;
        this.alterations.push(`CREATE INDEX "${indexName}" ON "${this.tableName}" (${cols.map((c) => `"${c}"`).join(', ')})`);
    }
    foreign(column) {
        return new SQLiteForeignKeyBuilder(this, column);
    }
    dropColumn(name) {
        // SQLite doesn't support DROP COLUMN directly in older versions
        // Would need to recreate the table
        this.alterations.push(`-- Warning: SQLite requires table recreation to drop column "${name}"`);
    }
    renameColumn(oldName, newName) {
        this.alterations.push(`ALTER TABLE "${this.tableName}" RENAME COLUMN "${oldName}" TO "${newName}"`);
    }
    dropPrimary() {
        this.alterations.push(`-- Warning: SQLite doesn't support DROP PRIMARY KEY`);
    }
    dropUnique(columns) {
        this.alterations.push(`-- Warning: SQLite doesn't support DROP UNIQUE`);
    }
    dropIndex(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        const indexName = `${this.tableName}_${cols.join('_')}_index`;
        this.alterations.push(`DROP INDEX IF EXISTS "${indexName}"`);
    }
    dropForeign(column) {
        this.alterations.push(`-- Warning: SQLite doesn't support DROP FOREIGN KEY`);
    }
    addColumn(definition) {
        if (typeof definition === 'string') {
            this.columns.push(() => definition);
        }
        else {
            this.columns.push(definition);
        }
    }
    addConstraint(constraint) {
        if (typeof constraint === 'string') {
            this.constraints.push(() => constraint);
        }
        else {
            this.constraints.push(constraint);
        }
    }
    addAlteration(alteration) {
        this.alterations.push(alteration);
    }
    toSQL() {
        if (this.mode === 'create') {
            const allDefinitions = [...this.columns, ...this.constraints].map((def) => def());
            let sql = `CREATE TABLE "${this.tableName}" (\n  ${allDefinitions.join(',\n  ')}\n)`;
            if (this.alterations.length > 0) {
                sql += ';\n' + this.alterations.join(';\n');
            }
            return sql;
        }
        else {
            const statements = this.columns.map((col) => `ALTER TABLE "${this.tableName}" ADD COLUMN ${col()}`);
            return [...statements, ...this.alterations].join(';\n');
        }
    }
}
class SQLiteColumnBuilder {
    table;
    name;
    type;
    mode;
    definition;
    checkConstraint;
    registered = false;
    constructor(table, name, type, mode) {
        this.table = table;
        this.name = name;
        this.type = type;
        this.mode = mode;
        this.definition = `"${name}" ${type}`;
        this.register();
    }
    register() {
        if (this.registered)
            return;
        this.table.addColumn(() => this.getDefinition());
        this.registered = true;
    }
    getDefinition() {
        if (!this.checkConstraint) {
            return this.definition;
        }
        return `${this.definition} CHECK (${this.checkConstraint})`;
    }
    primary() {
        this.definition += ' PRIMARY KEY AUTOINCREMENT';
        return this;
    }
    nullable() {
        // SQLite columns are nullable by default
        return this;
    }
    notNullable() {
        this.definition += ' NOT NULL';
        return this;
    }
    unique() {
        this.definition += ' UNIQUE';
        return this;
    }
    unsigned() {
        // SQLite doesn't have UNSIGNED, add CHECK constraint
        this.checkConstraint = `"${this.name}" >= 0`;
        return this;
    }
    defaultTo(value) {
        if (typeof value === 'string' && value !== 'CURRENT_TIMESTAMP') {
            this.definition += ` DEFAULT '${value}'`;
        }
        else {
            this.definition += ` DEFAULT ${value}`;
        }
        return this;
    }
    references(column) {
        return this;
    }
    inTable(tableName) {
        return this;
    }
    onDelete(action) {
        return this;
    }
    onUpdate(action) {
        return this;
    }
    index() {
        const indexName = `${this.name}_index`;
        this.table.addAlteration(`CREATE INDEX "${indexName}" ON "${this.name}" ("${this.name}")`);
        return this;
    }
    comment(text) {
        // SQLite doesn't support column comments
        return this;
    }
    check(constraint) {
        this.checkConstraint = constraint;
        return this;
    }
    build() {
        // Columns are registered on construction for fluent chaining.
    }
}
class SQLiteForeignKeyBuilder {
    table;
    column;
    refTable;
    refColumn;
    deleteAction;
    updateAction;
    constraintRegistered = false;
    constructor(table, column) {
        this.table = table;
        this.column = column;
    }
    references(column) {
        this.refColumn = column;
        this.registerConstraint();
        return this;
    }
    inTable(table) {
        this.refTable = table;
        this.registerConstraint();
        return this;
    }
    onDelete(action) {
        this.deleteAction = action;
        this.registerConstraint();
        return this;
    }
    onUpdate(action) {
        this.updateAction = action;
        this.registerConstraint();
        return this;
    }
    registerConstraint() {
        if (this.constraintRegistered || !this.refTable || !this.refColumn)
            return;
        this.table.addConstraint(() => {
            let constraint = `FOREIGN KEY ("${this.column}") REFERENCES "${this.refTable}" ("${this.refColumn}")`;
            if (this.deleteAction) {
                constraint += ` ON DELETE ${this.deleteAction}`;
            }
            if (this.updateAction) {
                constraint += ` ON UPDATE ${this.updateAction}`;
            }
            return constraint;
        });
        this.constraintRegistered = true;
    }
}
//# sourceMappingURL=sqlite.js.map