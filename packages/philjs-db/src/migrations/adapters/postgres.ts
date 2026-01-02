/**
 * PostgreSQL Migration Adapter
 */

import type {
  MigrationContext,
  SchemaBuilder,
  TableBuilder,
  ColumnBuilder,
  ForeignKeyBuilder,
  DataMigrationHelpers,
} from '../types.js';

export class PostgresMigrationAdapter {
  private queries: string[] = [];

  constructor(private db: any) {}

  createContext(): MigrationContext {
    return {
      db: this.db,
      sql: this.sql.bind(this),
      schema: this.createSchemaBuilder(),
      data: this.createDataHelpers(),
      type: 'postgres',
    };
  }

  async sql(query: string, params?: unknown[]): Promise<unknown> {
    return await this.db.query(query, params);
  }

  private createSchemaBuilder(): SchemaBuilder {
    const self = this;

    return {
      createTable(name: string, callback: (table: TableBuilder) => void) {
        const builder = new PostgresTableBuilder(name, 'create');
        callback(builder);
        self.queries.push(builder.toSQL());
      },

      dropTable(name: string) {
        self.queries.push(`DROP TABLE IF EXISTS "${name}"`);
      },

      alterTable(name: string, callback: (table: TableBuilder) => void) {
        const builder = new PostgresTableBuilder(name, 'alter');
        callback(builder);
        self.queries.push(builder.toSQL());
      },

      renameTable(oldName: string, newName: string) {
        self.queries.push(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`);
      },

      async hasTable(name: string): Promise<boolean> {
        const result = await self.sql(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          )`,
          [name]
        );
        const rows = (result as any)?.rows;
        return Boolean(rows && rows[0]?.exists);
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

        const firstRow = rows[0]!;
        const columns = Object.keys(firstRow);
        const values = rows.map((row) => columns.map((col) => row[col]));

        const placeholders = values
          .map(
            (_, i) =>
              `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
          )
          .join(', ');

        await self.sql(
          `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES ${placeholders}`,
          values.flat()
        );
      },

      async update(table: string, where: Record<string, unknown>, data: Record<string, unknown>) {
        const setClause = Object.keys(data)
          .map((key, i) => `"${key}" = $${i + 1}`)
          .join(', ');

        const whereClause = Object.keys(where)
          .map((key, i) => `"${key}" = $${Object.keys(data).length + i + 1}`)
          .join(' AND ');

        await self.sql(
          `UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`,
          [...Object.values(data), ...Object.values(where)]
        );
      },

      async delete(table: string, where: Record<string, unknown>) {
        const whereClause = Object.keys(where)
          .map((key, i) => `"${key}" = $${i + 1}`)
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

class PostgresTableBuilder implements TableBuilder {
  private columns: Array<() => string> = [];
  private constraints: Array<() => string> = [];
  private alterations: string[] = [];

  constructor(
    private tableName: string,
    private mode: 'create' | 'alter'
  ) {}

  increments(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'SERIAL', this.mode);
  }

  integer(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'INTEGER', this.mode);
  }

  bigInteger(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'BIGINT', this.mode);
  }

  string(name: string, length: number = 255): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, `VARCHAR(${length})`, this.mode);
  }

  text(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'TEXT', this.mode);
  }

  boolean(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'BOOLEAN', this.mode);
  }

  date(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'DATE', this.mode);
  }

  datetime(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'TIMESTAMP', this.mode);
  }

  timestamp(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'TIMESTAMP', this.mode);
  }

  timestamps(useTimestamps: boolean = true): void {
    if (useTimestamps) {
      this.timestamp('created_at').defaultTo('CURRENT_TIMESTAMP');
      this.timestamp('updated_at').defaultTo('CURRENT_TIMESTAMP');
    }
  }

  json(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'JSON', this.mode);
  }

  jsonb(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'JSONB', this.mode);
  }

  uuid(name: string): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, 'UUID', this.mode);
  }

  decimal(name: string, precision: number = 8, scale: number = 2): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, `DECIMAL(${precision}, ${scale})`, this.mode);
  }

  float(name: string, precision: number = 8, scale: number = 2): ColumnBuilder {
    return new PostgresColumnBuilder(this, name, `FLOAT(${precision})`, this.mode);
  }

  enum(name: string, values: string[]): ColumnBuilder {
    const enumValues = values.map((v) => `'${v}'`).join(', ');
    return new PostgresColumnBuilder(this, name, `VARCHAR(255) CHECK ("${name}" IN (${enumValues}))`, this.mode);
  }

  primary(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.constraints.push(() => `PRIMARY KEY (${cols.map((c) => `"${c}"`).join(', ')})`);
  }

  unique(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.constraints.push(() => `UNIQUE (${cols.map((c) => `"${c}"`).join(', ')})`);
  }

  index(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    const indexName = `${this.tableName}_${cols.join('_')}_index`;
    this.alterations.push(
      `CREATE INDEX "${indexName}" ON "${this.tableName}" (${cols.map((c) => `"${c}"`).join(', ')})`
    );
  }

  foreign(column: string): ForeignKeyBuilder {
    return new PostgresForeignKeyBuilder(this, column);
  }

  dropColumn(name: string): void {
    this.alterations.push(`ALTER TABLE "${this.tableName}" DROP COLUMN "${name}"`);
  }

  renameColumn(oldName: string, newName: string): void {
    this.alterations.push(
      `ALTER TABLE "${this.tableName}" RENAME COLUMN "${oldName}" TO "${newName}"`
    );
  }

  dropPrimary(): void {
    this.alterations.push(`ALTER TABLE "${this.tableName}" DROP CONSTRAINT "${this.tableName}_pkey"`);
  }

  dropUnique(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    const constraintName = `${this.tableName}_${cols.join('_')}_unique`;
    this.alterations.push(`ALTER TABLE "${this.tableName}" DROP CONSTRAINT "${constraintName}"`);
  }

  dropIndex(columns: string | string[]): void {
    const cols = Array.isArray(columns) ? columns : [columns];
    const indexName = `${this.tableName}_${cols.join('_')}_index`;
    this.alterations.push(`DROP INDEX "${indexName}"`);
  }

  dropForeign(column: string): void {
    const constraintName = `${this.tableName}_${column}_foreign`;
    this.alterations.push(`ALTER TABLE "${this.tableName}" DROP CONSTRAINT "${constraintName}"`);
  }

  addColumn(definition: string | (() => string)): void {
    if (typeof definition === 'string') {
      this.columns.push(() => definition);
    } else {
      this.columns.push(definition);
    }
  }

  addConstraint(constraint: string | (() => string)): void {
    if (typeof constraint === 'string') {
      this.constraints.push(() => constraint);
    } else {
      this.constraints.push(constraint);
    }
  }

  addAlteration(alteration: string): void {
    this.alterations.push(alteration);
  }

  toSQL(): string {
    if (this.mode === 'create') {
      const allDefinitions = [...this.columns, ...this.constraints].map((def) => def());
      let sql = `CREATE TABLE "${this.tableName}" (\n  ${allDefinitions.join(',\n  ')}\n)`;

      if (this.alterations.length > 0) {
        sql += ';\n' + this.alterations.join(';\n');
      }

      return sql;
    } else {
      // For ALTER mode, columns are added as ALTER TABLE statements
      const statements = this.columns.map(
        (col) => `ALTER TABLE "${this.tableName}" ADD COLUMN ${col()}`
      );

      return [...statements, ...this.alterations].join(';\n');
    }
  }
}

class PostgresColumnBuilder implements ColumnBuilder {
  private definition: string;
  private registered = false;

  constructor(
    private table: PostgresTableBuilder,
    private name: string,
    private type: string,
    private mode: 'create' | 'alter'
  ) {
    this.definition = `"${name}" ${type}`;
    this.register();
  }

  private register(): void {
    if (this.registered) return;
    this.table.addColumn(() => this.definition);
    this.registered = true;
  }

  primary(): this {
    this.definition += ' PRIMARY KEY';
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
    // PostgreSQL doesn't have UNSIGNED, but we can add CHECK constraint
    this.definition += ` CHECK ("${this.name}" >= 0)`;
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
    // Store for foreign key constraint
    return this;
  }

  inTable(tableName: string): this {
    // Complete foreign key constraint
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
    this.table.addAlteration(
      `CREATE INDEX "${indexName}" ON "${this.name}" ("${this.name}")`
    );
    return this;
  }

  comment(text: string): this {
    // PostgreSQL comments are added separately
    this.table.addAlteration(
      `COMMENT ON COLUMN "${this.name}"."${this.name}" IS '${text}'`
    );
    return this;
  }

  build(): void {
    // Columns are registered on construction for fluent chaining.
  }
}

class PostgresForeignKeyBuilder implements ForeignKeyBuilder {
  private column: string;
  private refTable?: string;
  private refColumn?: string;
  private deleteAction?: string;
  private updateAction?: string;
  private constraintRegistered = false;

  constructor(
    private table: PostgresTableBuilder,
    column: string
  ) {
    this.column = column;
  }

  references(column: string): this {
    this.refColumn = column;
    this.registerConstraint();
    return this;
  }

  inTable(table: string): this {
    this.refTable = table;
    this.registerConstraint();
    return this;
  }

  onDelete(action: string): this {
    this.deleteAction = action;
    this.registerConstraint();
    return this;
  }

  onUpdate(action: string): this {
    this.updateAction = action;
    this.registerConstraint();
    return this;
  }

  private registerConstraint(): void {
    if (this.constraintRegistered || !this.refTable || !this.refColumn) return;

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
