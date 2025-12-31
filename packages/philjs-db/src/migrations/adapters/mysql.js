/**
 * MySQL Migration Adapter
 */
export class MySQLMigrationAdapter {
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
            type: 'mysql',
        };
    }
    async sql(query, params) {
        return await this.db.query(query, params);
    }
    createSchemaBuilder() {
        const self = this;
        return {
            createTable(name, callback) {
                const builder = new MySQLTableBuilder(name, 'create');
                callback(builder);
                self.queries.push(builder.toSQL());
            },
            dropTable(name) {
                self.queries.push(`DROP TABLE IF EXISTS \`${name}\``);
            },
            alterTable(name, callback) {
                const builder = new MySQLTableBuilder(name, 'alter');
                callback(builder);
                self.queries.push(builder.toSQL());
            },
            renameTable(oldName, newName) {
                self.queries.push(`RENAME TABLE \`${oldName}\` TO \`${newName}\``);
            },
            async hasTable(name) {
                const result = await self.sql(`SELECT COUNT(*) as count FROM information_schema.tables
           WHERE table_schema = DATABASE() AND table_name = ?`, [name]);
                return result[0].count > 0;
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
                const placeholders = rows.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
                const values = rows.flatMap((row) => columns.map((col) => row[col]));
                await self.sql(`INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES ${placeholders}`, values);
            },
            async update(table, where, data) {
                const setClause = Object.keys(data)
                    .map((key) => `\`${key}\` = ?`)
                    .join(', ');
                const whereClause = Object.keys(where)
                    .map((key) => `\`${key}\` = ?`)
                    .join(' AND ');
                await self.sql(`UPDATE \`${table}\` SET ${setClause} WHERE ${whereClause}`, [...Object.values(data), ...Object.values(where)]);
            },
            async delete(table, where) {
                const whereClause = Object.keys(where)
                    .map((key) => `\`${key}\` = ?`)
                    .join(' AND ');
                await self.sql(`DELETE FROM \`${table}\` WHERE ${whereClause}`, Object.values(where));
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
class MySQLTableBuilder {
    tableName;
    mode;
    columns = [];
    constraints = [];
    alterations = [];
    engine = 'InnoDB';
    charset = 'utf8mb4';
    collate = 'utf8mb4_unicode_ci';
    constructor(tableName, mode) {
        this.tableName = tableName;
        this.mode = mode;
    }
    increments(name) {
        const builder = new MySQLColumnBuilder(this, name, 'INT UNSIGNED', this.mode);
        return builder.notNullable();
    }
    integer(name) {
        return new MySQLColumnBuilder(this, name, 'INT', this.mode);
    }
    bigInteger(name) {
        return new MySQLColumnBuilder(this, name, 'BIGINT', this.mode);
    }
    string(name, length = 255) {
        return new MySQLColumnBuilder(this, name, `VARCHAR(${length})`, this.mode);
    }
    text(name) {
        return new MySQLColumnBuilder(this, name, 'TEXT', this.mode);
    }
    boolean(name) {
        return new MySQLColumnBuilder(this, name, 'TINYINT(1)', this.mode);
    }
    date(name) {
        return new MySQLColumnBuilder(this, name, 'DATE', this.mode);
    }
    datetime(name) {
        return new MySQLColumnBuilder(this, name, 'DATETIME', this.mode);
    }
    timestamp(name) {
        return new MySQLColumnBuilder(this, name, 'TIMESTAMP', this.mode);
    }
    timestamps(useTimestamps = true) {
        if (useTimestamps) {
            this.timestamp('created_at').defaultTo('CURRENT_TIMESTAMP');
            this.timestamp('updated_at').defaultTo('CURRENT_TIMESTAMP');
        }
    }
    json(name) {
        return new MySQLColumnBuilder(this, name, 'JSON', this.mode);
    }
    jsonb(name) {
        // MySQL doesn't have JSONB, use JSON
        return new MySQLColumnBuilder(this, name, 'JSON', this.mode);
    }
    uuid(name) {
        return new MySQLColumnBuilder(this, name, 'CHAR(36)', this.mode);
    }
    decimal(name, precision = 8, scale = 2) {
        return new MySQLColumnBuilder(this, name, `DECIMAL(${precision}, ${scale})`, this.mode);
    }
    float(name, precision = 8, scale = 2) {
        return new MySQLColumnBuilder(this, name, `FLOAT(${precision}, ${scale})`, this.mode);
    }
    enum(name, values) {
        const enumValues = values.map((v) => `'${v}'`).join(', ');
        return new MySQLColumnBuilder(this, name, `ENUM(${enumValues})`, this.mode);
    }
    primary(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        this.constraints.push(`PRIMARY KEY (${cols.map((c) => `\`${c}\``).join(', ')})`);
    }
    unique(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        this.constraints.push(`UNIQUE KEY (${cols.map((c) => `\`${c}\``).join(', ')})`);
    }
    index(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        this.constraints.push(`INDEX (${cols.map((c) => `\`${c}\``).join(', ')})`);
    }
    foreign(column) {
        return new MySQLForeignKeyBuilder(this, column);
    }
    dropColumn(name) {
        this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP COLUMN \`${name}\``);
    }
    renameColumn(oldName, newName) {
        this.alterations.push(`ALTER TABLE \`${this.tableName}\` RENAME COLUMN \`${oldName}\` TO \`${newName}\``);
    }
    dropPrimary() {
        this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP PRIMARY KEY`);
    }
    dropUnique(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        const constraintName = cols.join('_');
        this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP INDEX \`${constraintName}\``);
    }
    dropIndex(columns) {
        const cols = Array.isArray(columns) ? columns : [columns];
        const indexName = cols.join('_');
        this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP INDEX \`${indexName}\``);
    }
    dropForeign(column) {
        const constraintName = `${this.tableName}_${column}_foreign`;
        this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP FOREIGN KEY \`${constraintName}\``);
    }
    addColumn(definition) {
        this.columns.push(definition);
    }
    addConstraint(constraint) {
        this.constraints.push(constraint);
    }
    addAlteration(alteration) {
        this.alterations.push(alteration);
    }
    toSQL() {
        if (this.mode === 'create') {
            const allDefinitions = [...this.columns, ...this.constraints];
            let sql = `CREATE TABLE \`${this.tableName}\` (\n  ${allDefinitions.join(',\n  ')}\n)`;
            sql += ` ENGINE=${this.engine} DEFAULT CHARSET=${this.charset} COLLATE=${this.collate}`;
            if (this.alterations.length > 0) {
                sql += ';\n' + this.alterations.join(';\n');
            }
            return sql;
        }
        else {
            const statements = this.columns.map((col) => `ALTER TABLE \`${this.tableName}\` ADD COLUMN ${col}`);
            return [...statements, ...this.alterations].join(';\n');
        }
    }
}
class MySQLColumnBuilder {
    table;
    name;
    type;
    mode;
    definition;
    autoInc = false;
    constructor(table, name, type, mode) {
        this.table = table;
        this.name = name;
        this.type = type;
        this.mode = mode;
        this.definition = `\`${name}\` ${type}`;
    }
    primary() {
        this.autoInc = true;
        this.definition += ' AUTO_INCREMENT PRIMARY KEY';
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
        // MySQL supports UNSIGNED
        this.definition = this.definition.replace(this.type, `${this.type} UNSIGNED`);
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
        this.table.addConstraint(`INDEX (\`${this.name}\`)`);
        return this;
    }
    comment(text) {
        this.definition += ` COMMENT '${text}'`;
        return this;
    }
    build() {
        this.table.addColumn(this.definition);
    }
}
class MySQLForeignKeyBuilder {
    table;
    column;
    refTable;
    refColumn;
    deleteAction;
    updateAction;
    constructor(table, column) {
        this.table = table;
        this.column = column;
    }
    references(column) {
        this.refColumn = column;
        return this;
    }
    inTable(table) {
        this.refTable = table;
        this.build();
        return this;
    }
    onDelete(action) {
        this.deleteAction = action;
        return this;
    }
    onUpdate(action) {
        this.updateAction = action;
        return this;
    }
    build() {
        if (!this.refTable || !this.refColumn)
            return;
        let constraint = `FOREIGN KEY (\`${this.column}\`) REFERENCES \`${this.refTable}\` (\`${this.refColumn}\`)`;
        if (this.deleteAction) {
            constraint += ` ON DELETE ${this.deleteAction}`;
        }
        if (this.updateAction) {
            constraint += ` ON UPDATE ${this.updateAction}`;
        }
        this.table.addConstraint(constraint);
    }
}
//# sourceMappingURL=mysql.js.map