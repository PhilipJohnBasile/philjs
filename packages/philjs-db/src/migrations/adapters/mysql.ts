/**
 * MySQL Migration Adapter
 */

import type {
  MigrationContext,
  SchemaBuilder,
  TableBuilder,
  ColumnBuilder,
  ForeignKeyBuilder,
  DataMigrationHelpers,
} from '../types';

export class MySQLMigrationAdapter {
  private queries: string[] = [];

  constructor(private db: any) {}

  createContext(): MigrationContext {
    return {
      db: this.db,
      sql: this.sql.bind(this),
      schema: this.createSchemaBuilder(),
      data: this.createDataHelpers(),
      type: 'mysql',
    };
  }

  async sql(query: string, params?: unknown[]): Promise<unknown> {
    return await this.db.query(query, params);
  }

  private createSchemaBuilder(): SchemaBuilder {
    const self = this;

    return {
      createTable(name: string, callback: (table: TableBuilder) => void) {
        const builder = new MySQLTableBuilder(name, 'create');
        callback(builder);
        self.queries.push(builder.toSQL());
      },

      dropTable(name: string) {
        self.queries.push(`DROP TABLE IF EXISTS \`${name}\``);
      },

      alterTable(name: string, callback: (table: TableBuilder) => void) {
        const builder = new MySQLTableBuilder(name, 'alter');
        callback(builder);
        self.queries.push(builder.toSQL());
      },

      renameTable(oldName: string, newName: string) {
        self.queries.push(`RENAME TABLE \`${oldName}\` TO \`${newName}\``);
      },

      async hasTable(name: string): Promise<boolean> {
        const result = await self.sql(
          `SELECT COUNT(*) as count FROM information_schema.tables
           WHERE table_schema = DATABASE() AND table_name = ?`,
          [name]
        );
        return (result as any)[0].count > 0;
      },

      raw(sql: string) {
        self.queries.push(sql);
      },
    };
  }

  private createDataHelpers(): DataMigrationHelpers {
    const self = this;

    return {
      async insert(table: string, data: Record<string, unknown> | Record<string, unknown>[]) {
        const rows = Array.isArray(data) ? data : [data];
        if (rows.length === 0) return;

        const columns = Object.keys(rows[0]);
        const placeholders = rows.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
        const values = rows.flatMap((row) => columns.map((col) => row[col]));

        await self.sql(
          `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES ${placeholders}`,
          values
        );
      },

      async update(table: string, where: Record<string, unknown>, data: Record<string, unknown>) {
        const setClause = Object.keys(data)
          .map((key) => `\`${key}\` = ?`)
          .join(', ');

        const whereClause = Object.keys(where)
          .map((key) => `\`${key}\` = ?`)
          .join(' AND ');

        await self.sql(
          `UPDATE \`${table}\` SET ${setClause} WHERE ${whereClause}`,
          [...Object.values(data), ...Object.values(where)]
        );
      },

      async delete(table: string, where: Record<string, unknown>) {
        const whereClause = Object.keys(where)
          .map((key) => `\`${key}\` = ?`)
          .join(' AND ');

        await self.sql(`DELETE FROM \`${table}\` WHERE ${whereClause}`, Object.values(where));
      },

      async raw(sql: string, params?: unknown[]) {
        return await self.sql(sql, params);
      },

      async batchInsert(
        table: string,
        data: Record<string, unknown>[],
        batchSize: number = 100
      ) {
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          await this.insert(table, batch);
        }
      },
    };
  }

  getQueries(): string[] {
    return this.queries;
  }

  clearQueries(): void {
    this.queries = [];
  }
}

class MySQLTableBuilder implements TableBuilder {
  private columns: string[] = [];
  private constraints: string[] = [];
  private alterations: string[] = [];
  private engine: string = 'InnoDB';
  private charset: string = 'utf8mb4';
  private collate: string = 'utf8mb4_unicode_ci';

  constructor(
    private tableName: string,
    private mode: 'create' | 'alter'
  ) {}

  increments(name: string): ColumnBuilder {
    const builder = new MySQLColumnBuilder(this, name, 'INT UNSIGNED', this.mode);
    return builder.notNullable();
  }

  integer(name: string): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, 'INT', this.mode);
  }

  bigInteger(name: string): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, 'BIGINT', this.mode);
  }

  string(name: string, length: number = 255): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, `VARCHAR(${length})`, this.mode);
  }

  text(name: string): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, 'TEXT', this.mode);
  }

  boolean(name: string): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, 'TINYINT(1)', this.mode);
  }

  date(name: string): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, 'DATE', this.mode);
  }

  datetime(name: string): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, 'DATETIME', this.mode);
  }

  timestamp(name: string): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, 'TIMESTAMP', this.mode);
  }

  timestamps(useTimestamps: boolean = true): void {
    if (useTimestamps) {
      this.timestamp('created_at').defaultTo('CURRENT_TIMESTAMP');
      this.timestamp('updated_at').defaultTo('CURRENT_TIMESTAMP');
    }
  }

  json(name: string): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, 'JSON', this.mode);
  }

  jsonb(name: string): ColumnBuilder {
    // MySQL doesn't have JSONB, use JSON
    return new MySQLColumnBuilder(this, name, 'JSON', this.mode);
  }

  uuid(name: string): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, 'CHAR(36)', this.mode);
  }

  decimal(name: string, precision: number = 8, scale: number = 2): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, `DECIMAL(${precision}, ${scale})`, this.mode);
  }

  float(name: string, precision: number = 8, scale: number = 2): ColumnBuilder {
    return new MySQLColumnBuilder(this, name, `FLOAT(${precision}, ${scale})`, this.mode);
  }

  enum(name: string, values: string[]): ColumnBuilder {
    const enumValues = values.map((v) => `'${v}'`).join(', ');
    return new MySQLColumnBuilder(this, name, `ENUM(${enumValues})`, this.mode);
  }

  primary(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.constraints.push(`PRIMARY KEY (${cols.map((c) => `\`${c}\``).join(', ')})`);
  }

  unique(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.constraints.push(`UNIQUE KEY (${cols.map((c) => `\`${c}\``).join(', ')})`);
  }

  index(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.constraints.push(`INDEX (${cols.map((c) => `\`${c}\``).join(', ')})`);
  }

  foreign(column: string): ForeignKeyBuilder {
    return new MySQLForeignKeyBuilder(this, column);
  }

  dropColumn(name: string): void {
    this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP COLUMN \`${name}\``);
  }

  renameColumn(oldName: string, newName: string): void {
    this.alterations.push(
      `ALTER TABLE \`${this.tableName}\` RENAME COLUMN \`${oldName}\` TO \`${newName}\``
    );
  }

  dropPrimary(): void {
    this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP PRIMARY KEY`);
  }

  dropUnique(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    const constraintName = cols.join('_');
    this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP INDEX \`${constraintName}\``);
  }

  dropIndex(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    const indexName = cols.join('_');
    this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP INDEX \`${indexName}\``);
  }

  dropForeign(column: string): void {
    const constraintName = `${this.tableName}_${column}_foreign`;
    this.alterations.push(`ALTER TABLE \`${this.tableName}\` DROP FOREIGN KEY \`${constraintName}\``);
  }

  addColumn(definition: string): void {
    this.columns.push(definition);
  }

  addConstraint(constraint: string): void {
    this.constraints.push(constraint);
  }

  addAlteration(alteration: string): void {
    this.alterations.push(alteration);
  }

  toSQL(): string {
    if (this.mode === 'create') {
      const allDefinitions = [...this.columns, ...this.constraints];
      let sql = `CREATE TABLE \`${this.tableName}\` (\n  ${allDefinitions.join(',\n  ')}\n)`;
      sql += ` ENGINE=${this.engine} DEFAULT CHARSET=${this.charset} COLLATE=${this.collate}`;

      if (this.alterations.length > 0) {
        sql += ';\n' + this.alterations.join(';\n');
      }

      return sql;
    } else {
      const statements = this.columns.map(
        (col) => `ALTER TABLE \`${this.tableName}\` ADD COLUMN ${col}`
      );

      return [...statements, ...this.alterations].join(';\n');
    }
  }
}

class MySQLColumnBuilder implements ColumnBuilder {
  private definition: string;
  private autoInc: boolean = false;

  constructor(
    private table: MySQLTableBuilder,
    private name: string,
    private type: string,
    private mode: 'create' | 'alter'
  ) {
    this.definition = `\`${name}\` ${type}`;
  }

  primary(): this {
    this.autoInc = true;
    this.definition += ' AUTO_INCREMENT PRIMARY KEY';
    return this;
  }

  nullable(): this {
    this.definition += ' NULL';
    return this;
  }

  notNullable(): this {
    this.definition += ' NOT NULL';
    return this;
  }

  unique(): this {
    this.definition += ' UNIQUE';
    return this;
  }

  unsigned(): this {
    // MySQL supports UNSIGNED
    this.definition = this.definition.replace(this.type, `${this.type} UNSIGNED`);
    return this;
  }

  defaultTo(value: unknown): this {
    if (typeof value === 'string' && value !== 'CURRENT_TIMESTAMP') {
      this.definition += ` DEFAULT '${value}'`;
    } else {
      this.definition += ` DEFAULT ${value}`;
    }
    return this;
  }

  references(column: string): this {
    return this;
  }

  inTable(tableName: string): this {
    return this;
  }

  onDelete(action: string): this {
    return this;
  }

  onUpdate(action: string): this {
    return this;
  }

  index(): this {
    this.table.addConstraint(`INDEX (\`${this.name}\`)`);
    return this;
  }

  comment(text: string): this {
    this.definition += ` COMMENT '${text}'`;
    return this;
  }

  build(): void {
    this.table.addColumn(this.definition);
  }
}

class MySQLForeignKeyBuilder implements ForeignKeyBuilder {
  private column: string;
  private refTable?: string;
  private refColumn?: string;
  private deleteAction?: string;
  private updateAction?: string;

  constructor(
    private table: MySQLTableBuilder,
    column: string
  ) {
    this.column = column;
  }

  references(column: string): this {
    this.refColumn = column;
    return this;
  }

  inTable(table: string): this {
    this.refTable = table;
    this.build();
    return this;
  }

  onDelete(action: string): this {
    this.deleteAction = action;
    return this;
  }

  onUpdate(action: string): this {
    this.updateAction = action;
    return this;
  }

  private build(): void {
    if (!this.refTable || !this.refColumn) return;

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
