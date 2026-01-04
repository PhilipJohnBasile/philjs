/**
 * PostgreSQL Migration Adapter
 */
export class PostgresMigrationAdapter {
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
            type: 'postgres',
        };
    }
    async sql(query, params) {
        return await this.db.query(query, params);
    }
    createSchemaBuilder() {
        const self = this;
        return {
            createTable(name, callback) {
                const builder = new PostgresTableBuilder(name, 'create');
                callback(builder);
                self.queries.push(builder.toSQL());
            },
            dropTable(name) {
                self.queries.push(`DROP TABLE IF EXISTS "${name}"`);
            },
            alterTable(name, callback) {
                const builder = new PostgresTableBuilder(name, 'alter');
                callback(builder);
                self.queries.push(builder.toSQL());
            },
            renameTable(oldName, newName) {
                self.queries.push(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`);
            },
            async hasTable(name) {
                const result = await self.sql(`SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          )`, [name]);
                const rows = result?.rows;
                return Boolean(rows && rows[0]?.exists);
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
                const values = rows.map((row) => columns.map((col) => row[col]));
                const placeholders = values
                    .map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`)
                    .join(', ');
                await self.sql(`INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES ${placeholders}`, values.flat());
            },
            async update(table, where, data) {
                const setClause = Object.keys(data)
                    .map((key, i) => `"${key}" = $${i + 1}`)
                    .join(', ');
                const whereClause = Object.keys(where)
                    .map((key, i) => `"${key}" = $${Object.keys(data).length + i + 1}`)
                    .join(' AND ');
                await self.sql(`UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`, [...Object.values(data), ...Object.values(where)]);
            },
            async delete(table, where) {
                const whereClause = Object.keys(where)
                    .map((key, i) => `"${key}" = $${i + 1}`)
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
class PostgresTableBuilder {
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
        return new PostgresColumnBuilder(this, name, 'SERIAL', this.mode);
    }
    integer(name) {
        return new PostgresColumnBuilder(this, name, 'INTEGER', this.mode);
    }
    bigInteger(name) {
        return new PostgresColumnBuilder(this, name, 'BIGINT', this.mode);
    }
    string(name, length = 255) {
        return new PostgresColumnBuilder(this, name, `VARCHAR(${length})`, this.mode);
    }
    text(name) {
        return new PostgresColumnBuilder(this, name, 'TEXT', this.mode);
    }
    boolean(name) {
        return new PostgresColumnBuilder(this, name, 'BOOLEAN', this.mode);
    }
    date(name) {
        return new PostgresColumnBuilder(this, name, 'DATE', this.mode);
    }
    datetime(name) {
        return new PostgresColumnBuilder(this, name, 'TIMESTAMP', this.mode);
    }
    timestamp(name) {
        return new PostgresColumnBuilder(this, name, 'TIMESTAMP', this.mode);
    }
    timestamps(useTimestamps = true) {
        if (useTimestamps) {
            this.timestamp('created_at').defaultTo('CURRENT_TIMESTAMP');
            this.timestamp('updated_at').defaultTo('CURRENT_TIMESTAMP');
        }
    }
    json(name) {
        return new PostgresColumnBuilder(this, name, 'JSON', this.mode);
    }
    jsonb(name) {
        return new PostgresColumnBuilder(this, name, 'JSONB', this.mode);
    }
    uuid(name) {
        return new PostgresColumnBuilder(this, name, 'UUID', this.mode);
    }
    decimal(name, precision = 8, scale = 2) {
        return new PostgresColumnBuilder(this, name, `DECIMAL(${precision}, ${scale})`, this.mode);
    }
    float(name, precision = 8, scale = 2) {
        return new PostgresColumnBuilder(this, name, `FLOAT(${precision})`, this.mode);
    }
    enum(name, values) {
        const enumValues = values.map((v) => `'${v}'`).join(', ');
        return new PostgresColumnBuilder(this, name, `VARCHAR(255) CHECK ("${name}" IN (${enumValues}))`, this.mode);
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
        return new PostgresForeignKeyBuilder(this, column);
    }
    dropColumn(name) {
        this.alterations.push(`ALTER TABLE "${this.tableName}" DROP COLUMN "${name}"`);
    }
    renameColumn(oldName, newName) {
        this.alterations.push(`ALTER TABLE "${this.tableName}" RENAME COLUMN "${oldName}" TO "${newName}"`);
    }
    dropPrimary() {
        this.alterations.push(`ALTER TABLE "${this.tableName}" DROP CONSTRAINT "${this.tableName}_pkey"`);
    }
    dropUnique(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        const constraintName = `${this.tableName}_${cols.join('_')}_unique`;
        this.alterations.push(`ALTER TABLE "${this.tableName}" DROP CONSTRAINT "${constraintName}"`);
    }
    dropIndex(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        const indexName = `${this.tableName}_${cols.join('_')}_index`;
        this.alterations.push(`DROP INDEX "${indexName}"`);
    }
    dropForeign(column) {
        const constraintName = `${this.tableName}_${column}_foreign`;
        this.alterations.push(`ALTER TABLE "${this.tableName}" DROP CONSTRAINT "${constraintName}"`);
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
            // For ALTER mode, columns are added as ALTER TABLE statements
            const statements = this.columns.map((col) => `ALTER TABLE "${this.tableName}" ADD COLUMN ${col()}`);
            return [...statements, ...this.alterations].join(';\n');
        }
    }
}
class PostgresColumnBuilder {
    table;
    name;
    type;
    mode;
    definition;
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
        this.table.addColumn(() => this.definition);
        this.registered = true;
    }
    primary() {
        this.definition += ' PRIMARY KEY';
        return this;
    }
    nullable() {
        this.definition += ' NULL';
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
        // PostgreSQL doesn't have UNSIGNED, but we can add CHECK constraint
        this.definition += ` CHECK ("${this.name}" >= 0)`;
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
        // Store for foreign key constraint
        return this;
    }
    inTable(tableName) {
        // Complete foreign key constraint
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
        // PostgreSQL comments are added separately
        this.table.addAlteration(`COMMENT ON COLUMN "${this.name}"."${this.name}" IS '${text}'`);
        return this;
    }
    build() {
        // Columns are registered on construction for fluent chaining.
    }
}
class PostgresForeignKeyBuilder {
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
//# sourceMappingURL=postgres.js.map