/**
 * SQLite Migration Adapter
 */

import type {
  MigrationContext,
  SchemaBuilder,
  TableBuilder,
  ColumnBuilder,
  ForeignKeyBuilder,
  DataMigrationHelpers,
} from '../types';

export class SQLiteMigrationAdapter {
  private queries: string[] = [];

  constructor(private db: any) {}

  createContext(): MigrationContext {
    return {
      db: this.db,
      sql: this.sql.bind(this),
      schema: this.createSchemaBuilder(),
      data: this.createDataHelpers(),
      type: 'sqlite',
    };
  }

  async sql(query: string, params?: unknown[]): Promise<unknown> {
    return await this.db.all(query, params);
  }

  private createSchemaBuilder(): SchemaBuilder {
    const self = this;

    return {
      createTable(name: string, callback: (table: TableBuilder) => void) {
        const builder = new SQLiteTableBuilder(name, 'create');
        callback(builder);
        self.queries.push(builder.toSQL());
      },

      dropTable(name: string) {
        self.queries.push(`DROP TABLE IF EXISTS "${name}"`);
      },

      alterTable(name: string, callback: (table: TableBuilder) => void) {
        const builder = new SQLiteTableBuilder(name, 'alter');
        callback(builder);
        self.queries.push(builder.toSQL());
      },

      renameTable(oldName: string, newName: string) {
        self.queries.push(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`);
      },

      async hasTable(name: string): Promise<boolean> {
        const result = await self.sql(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [name]
        );
        return (result as any).length > 0;
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
        const placeholders = rows
          .map(() => `(${columns.map(() => '?').join(', ')})`)
          .join(', ');
        const values = rows.flatMap((row) => columns.map((col) => row[col]));

        await self.sql(
          `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES ${placeholders}`,
          values
        );
      },

      async update(table: string, where: Record<string, unknown>, data: Record<string, unknown>) {
        const setClause = Object.keys(data)
          .map((key) => `"${key}" = ?`)
          .join(', ');

        const whereClause = Object.keys(where)
          .map((key) => `"${key}" = ?`)
          .join(' AND ');

        await self.sql(
          `UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`,
          [...Object.values(data), ...Object.values(where)]
        );
      },

      async delete(table: string, where: Record<string, unknown>) {
        const whereClause = Object.keys(where)
          .map((key) => `"${key}" = ?`)
          .join(' AND ');

        await self.sql(`DELETE FROM "${table}" WHERE ${whereClause}`, Object.values(where));
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

class SQLiteTableBuilder implements TableBuilder {
  private columns: string[] = [];
  private constraints: string[] = [];
  private alterations: string[] = [];

  constructor(
    private tableName: string,
    private mode: 'create' | 'alter'
  ) {}

  increments(name: string): ColumnBuilder {
    const builder = new SQLiteColumnBuilder(this, name, 'INTEGER', this.mode);
    return builder.primary();
  }

  integer(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'INTEGER', this.mode);
  }

  bigInteger(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'INTEGER', this.mode);
  }

  string(name: string, length?: number): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
  }

  text(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
  }

  boolean(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'INTEGER', this.mode);
  }

  date(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
  }

  datetime(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
  }

  timestamp(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
  }

  timestamps(useTimestamps: boolean = true): void {
    if (useTimestamps) {
      this.timestamp('created_at').defaultTo('CURRENT_TIMESTAMP');
      this.timestamp('updated_at').defaultTo('CURRENT_TIMESTAMP');
    }
  }

  json(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
  }

  jsonb(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
  }

  uuid(name: string): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
  }

  decimal(name: string, precision?: number, scale?: number): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'REAL', this.mode);
  }

  float(name: string, precision?: number, scale?: number): ColumnBuilder {
    return new SQLiteColumnBuilder(this, name, 'REAL', this.mode);
  }

  enum(name: string, values: string[]): ColumnBuilder {
    const enumValues = values.map((v) => `'${v}'`).join(', ');
    const builder = new SQLiteColumnBuilder(this, name, 'TEXT', this.mode);
    builder.check(`"${name}" IN (${enumValues})`);
    return builder;
  }

  primary(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.constraints.push(`PRIMARY KEY (${cols.map((c) => `"${c}"`).join(', ')})`);
  }

  unique(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.constraints.push(`UNIQUE (${cols.map((c) => `"${c}"`).join(', ')})`);
  }

  index(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    const indexName = `${this.tableName}_${cols.join('_')}_index`;
    this.alterations.push(
      `CREATE INDEX "${indexName}" ON "${this.tableName}" (${cols.map((c) => `"${c}"`).join(', ')})`
    );
  }

  foreign(column: string): ForeignKeyBuilder {
    return new SQLiteForeignKeyBuilder(this, column);
  }

  dropColumn(name: string): void {
    // SQLite doesn't support DROP COLUMN directly in older versions
    // Would need to recreate the table
    this.alterations.push(`-- Warning: SQLite requires table recreation to drop column "${name}"`);
  }

  renameColumn(oldName: string, newName: string): void {
    this.alterations.push(`ALTER TABLE "${this.tableName}" RENAME COLUMN "${oldName}" TO "${newName}"`);
  }

  dropPrimary(): void {
    this.alterations.push(`-- Warning: SQLite doesn't support DROP PRIMARY KEY`);
  }

  dropUnique(columns: string | string[]): void {
    this.alterations.push(`-- Warning: SQLite doesn't support DROP UNIQUE`);
  }

  dropIndex(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    const indexName = `${this.tableName}_${cols.join('_')}_index`;
    this.alterations.push(`DROP INDEX IF EXISTS "${indexName}"`);
  }

  dropForeign(column: string): void {
    this.alterations.push(`-- Warning: SQLite doesn't support DROP FOREIGN KEY`);
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
      let sql = `CREATE TABLE "${this.tableName}" (\n  ${allDefinitions.join(',\n  ')}\n)`;

      if (this.alterations.length > 0) {
        sql += ';\n' + this.alterations.join(';\n');
      }

      return sql;
    } else {
      const statements = this.columns.map(
        (col) => `ALTER TABLE "${this.tableName}" ADD COLUMN ${col}`
      );

      return [...statements, ...this.alterations].join(';\n');
    }
  }
}

class SQLiteColumnBuilder implements ColumnBuilder {
  private definition: string;
  private checkConstraint?: string;

  constructor(
    private table: SQLiteTableBuilder,
    private name: string,
    private type: string,
    private mode: 'create' | 'alter'
  ) {
    this.definition = `"${name}" ${type}`;
  }

  primary(): this {
    this.definition += ' PRIMARY KEY AUTOINCREMENT';
    return this;
  }

  nullable(): this {
    // SQLite columns are nullable by default
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
    // SQLite doesn't have UNSIGNED, add CHECK constraint
    this.checkConstraint = `"${this.name}" >= 0`;
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
    const indexName = `${this.name}_index`;
    this.table.addAlteration(`CREATE INDEX "${indexName}" ON "${this.name}" ("${this.name}")`);
    return this;
  }

  comment(text: string): this {
    // SQLite doesn't support column comments
    return this;
  }

  check(constraint: string): this {
    this.checkConstraint = constraint;
    return this;
  }

  build(): void {
    if (this.checkConstraint) {
      this.definition += ` CHECK (${this.checkConstraint})`;
    }
    this.table.addColumn(this.definition);
  }
}

class SQLiteForeignKeyBuilder implements ForeignKeyBuilder {
  private column: string;
  private refTable?: string;
  private refColumn?: string;
  private deleteAction?: string;
  private updateAction?: string;

  constructor(
    private table: SQLiteTableBuilder,
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

    let constraint = `FOREIGN KEY ("${this.column}") REFERENCES "${this.refTable}" ("${this.refColumn}")`;

    if (this.deleteAction) {
      constraint += ` ON DELETE ${this.deleteAction}`;
    }

    if (this.updateAction) {
      constraint += ` ON UPDATE ${this.updateAction}`;
    }

    this.table.addConstraint(constraint);
  }
}
