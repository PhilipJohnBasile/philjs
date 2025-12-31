# PhilJS Database Migrations

A comprehensive, type-safe database migration system for PhilJS applications with support for multiple databases and ORMs.

## Features

- **Multi-Database Support**: PostgreSQL, MySQL, SQLite, MongoDB
- **Migration Versioning**: Track and manage migration history
- **Up/Down Migrations**: Full rollback support
- **Transaction Support**: Automatic transaction wrapping
- **Schema Diff**: Automatic schema comparison
- **Auto-Migration**: Generate migrations from model changes
- **CLI Tools**: Full-featured command-line interface
- **ORM Integration**: Prisma and Drizzle support
- **Backup & Restore**: Automatic database backups
- **Conflict Detection**: Detect migration conflicts
- **Dry-Run Mode**: Preview changes before applying

## Installation

```bash
npm install @philjs/db
```

## Quick Start

### 1. Configuration

Create `@philjs/db.config.ts` in your project root:

```javascript
export default {
  type: 'postgres',
  connection: process.env.DATABASE_URL,
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: true,
  backup: true,
};
```

### 2. Initialize

```bash
npx philjs db migrate:create --name create_users_table --template table
```

### 3. Write Migration

Edit the generated migration file:

```typescript
import type { Migration } from '@philjs/db/migrations';

export default {
  name: 'create_users_table',

  async up(context) {
    context.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email').unique().notNullable();
      table.string('name').notNullable();
      table.timestamps(true);
    });
  },

  async down(context) {
    context.schema.dropTable('users');
  },
} as Migration;
```

### 4. Run Migrations

```bash
npx philjs db migrate
```

## CLI Commands

### Run Migrations

```bash
# Run all pending migrations
npx philjs db migrate

# Run specific number of migrations
npx philjs db migrate --step 1

# Run migrations up to specific version
npx philjs db migrate --to 20240101000000

# Dry run (preview without executing)
npx philjs db migrate --dry-run
```

### Create Migration

```bash
# Create blank migration
npx philjs db migrate:create --name my_migration

# Create table migration
npx philjs db migrate:create --name create_posts --template table

# Create alter migration
npx philjs db migrate:create --name add_column --template alter

# Create data migration
npx philjs db migrate:create --name seed_data --template data
```

### Rollback Migrations

```bash
# Rollback last batch
npx philjs db migrate:rollback

# Rollback specific number of migrations
npx philjs db migrate:rollback --step 1

# Rollback to specific version
npx philjs db migrate:rollback --to 20240101000000

# Rollback specific batch
npx philjs db migrate:rollback --batch 1
```

### Migration Status

```bash
# Check migration status
npx philjs db migrate:status

# Verbose status
npx philjs db migrate:status --verbose
```

### Reset & Fresh

```bash
# Reset (rollback all and re-run)
npx philjs db migrate:reset

# Fresh (drop all tables and re-run)
npx philjs db migrate:fresh --yes
```

### Schema Diff

```bash
# Generate schema diff
npx philjs db migrate:diff

# Auto-generate migration from changes
npx philjs db migrate:auto --name auto_migration
```

## Migration API

### Schema Builder

#### Table Operations

```typescript
// Create table
context.schema.createTable('users', (table) => {
  // columns here
});

// Drop table
context.schema.dropTable('users');

// Alter table
context.schema.alterTable('users', (table) => {
  // changes here
});

// Rename table
context.schema.renameTable('users', 'accounts');

// Check if table exists
const exists = await context.schema.hasTable('users');

// Raw SQL
context.schema.raw('CREATE INDEX...');
```

#### Column Types

```typescript
table.increments('id')           // Auto-incrementing ID
table.integer('count')           // Integer
table.bigInteger('large_num')    // Big integer
table.string('name', 255)        // VARCHAR
table.text('description')        // TEXT
table.boolean('is_active')       // Boolean
table.date('birth_date')         // Date
table.datetime('created_at')     // Datetime
table.timestamp('updated_at')    // Timestamp
table.json('data')              // JSON
table.jsonb('metadata')         // JSONB (PostgreSQL)
table.uuid('id')                // UUID
table.decimal('price', 10, 2)   // Decimal
table.float('rating', 3, 2)     // Float
table.enum('status', ['active', 'inactive'])  // Enum
```

#### Column Modifiers

```typescript
column.primary()                 // Primary key
column.nullable()                // Allow NULL
column.notNullable()            // NOT NULL
column.unique()                 // UNIQUE constraint
column.unsigned()               // Unsigned (MySQL)
column.defaultTo(value)         // Default value
column.index()                  // Create index
column.comment('...')           // Column comment
```

#### Constraints

```typescript
// Primary key
table.primary('id');
table.primary(['user_id', 'post_id']);  // Composite

// Unique
table.unique('email');
table.unique(['first_name', 'last_name']);

// Index
table.index('email');
table.index(['status', 'created_at']);

// Foreign key
table.foreign('user_id')
  .references('id')
  .inTable('users')
  .onDelete('CASCADE')
  .onUpdate('CASCADE');
```

#### Timestamps

```typescript
// Add created_at and updated_at
table.timestamps(true);
```

### Data Helpers

```typescript
// Insert single row
await context.data.insert('users', {
  name: 'John',
  email: 'john@example.com',
});

// Insert multiple rows
await context.data.insert('users', [
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' },
]);

// Update data
await context.data.update(
  'users',
  { id: 1 },
  { name: 'Updated Name' }
);

// Delete data
await context.data.delete('users', { id: 1 });

// Batch insert
await context.data.batchInsert('users', largeArray, 100);

// Raw query
const result = await context.data.raw('SELECT * FROM users');
```

### SQL Execution

```typescript
// Execute raw SQL
await context.sql('CREATE INDEX...');

// With parameters
await context.sql(
  'SELECT * FROM users WHERE email = $1',
  ['john@example.com']
);
```

## Configuration Options

```typescript
interface MigrationConfig {
  // Database type
  type: 'postgres' | 'mysql' | 'sqlite' | 'mongodb';

  // Connection string
  connection: string | object;

  // Migrations directory (default: ./migrations)
  migrationsDir?: string;

  // Migration table name (default: migrations)
  tableName?: string;

  // Enable transactions (default: true)
  transactional?: boolean;

  // Backup before migrate (default: false)
  backup?: boolean;

  // Seeds directory (default: ./seeds)
  seedsDir?: string;

  // Schema file path
  schemaFile?: string;
}
```

## Database-Specific Features

### PostgreSQL

```typescript
// JSONB
table.jsonb('metadata');

// Array
table.raw('tags TEXT[]');

// Full-text search
context.sql(`
  ALTER TABLE posts
  ADD COLUMN search_vector tsvector
`);

// Triggers and functions
context.sql(`
  CREATE FUNCTION update_timestamp()...
`);
```

### MySQL

```typescript
// Engine and charset
// Automatically added to CREATE TABLE statements

// Unsigned integers
table.integer('count').unsigned();

// Enum
table.enum('status', ['active', 'inactive']);
```

### SQLite

```typescript
// Limited ALTER TABLE support
// Automatically handles with table recreation

// Check constraints
table.integer('age').check('age >= 18');
```

## ORM Integration

### Prisma

```typescript
import { PrismaMigrationIntegration } from '@philjs/db/migrations';

// Import Prisma migrations
const migrations = await PrismaMigrationIntegration.importPrismaMigrations('./prisma/migrations');

// Export to Prisma schema
const schema = await PrismaMigrationIntegration.exportToPrismaSchema(migrations);
```

### Drizzle

```typescript
import { DrizzleMigrationIntegration } from '@philjs/db/migrations';

// Import Drizzle migrations
const migrations = await DrizzleMigrationIntegration.importDrizzleMigrations('./drizzle');

// Export to Drizzle schema
const schema = await DrizzleMigrationIntegration.exportToDrizzleSchema(migrations);
```

## Advanced Features

### Auto-Migration

Generate migrations automatically from schema changes:

```typescript
import { AutoMigrationGenerator } from '@philjs/db/migrations';

const generator = new AutoMigrationGenerator(config);
const result = await generator.generate({
  compare: true,
  name: 'auto_migration',
  dryRun: true,
});

console.log('SQL:', result.sql);
console.log('Warnings:', result.warnings);
```

### Schema Diff

Compare schemas and generate diff:

```typescript
import { SchemaDiffGenerator } from '@philjs/db/migrations';

const generator = new SchemaDiffGenerator(config);
const diff = await generator.generate();

console.log('Created tables:', diff.tables.created);
console.log('Dropped tables:', diff.tables.dropped);
console.log('Modified tables:', diff.tables.modified);
```

### Backup & Restore

```typescript
import { BackupManager } from '@philjs/db/migrations';

const backup = new BackupManager(config);

// Create backup
const filename = await backup.createBackup();

// Restore backup
await backup.restoreBackup(filename);
```

### Data Migration Helpers

```typescript
import { DataMigrationHelper } from '@philjs/db/migrations';

// Transform data
await DataMigrationHelper.transformData(
  'users',
  (row) => ({
    ...row,
    email: row.email.toLowerCase(),
  })
);

// Copy data
await DataMigrationHelper.copyData('old_table', 'new_table', ['id', 'name']);

// Validate data
await DataMigrationHelper.migrateWithValidation(
  'users',
  (row) => row.email.includes('@'),
  (row) => console.error('Invalid:', row)
);
```

## Best Practices

1. **Always test migrations**: Use dry-run mode first
2. **Use transactions**: Enable for data integrity
3. **Backup production**: Always backup before migrating
4. **Version control**: Commit migration files
5. **Down migrations**: Always implement rollback
6. **Batch data**: Use batch operations for large datasets
7. **Index carefully**: Add indexes for frequently queried columns
8. **Foreign keys**: Use CASCADE appropriately
9. **Test rollback**: Verify down migrations work
10. **Document changes**: Add comments to complex migrations

## Examples

See `examples/migration-examples.ts` for comprehensive examples including:

- Table creation with foreign keys
- Column alterations
- Data migrations
- Batch operations
- Full-text search
- Soft deletes
- Junction tables
- Raw SQL migrations
- And more...

## Troubleshooting

### Migration conflicts

```bash
# Check status for conflicts
npx philjs db migrate:status

# Resolution: Ensure all executed migrations have corresponding files
```

### Transaction errors

```bash
# Disable transactions for specific migration
export default {
  transaction: false,
  async up(context) { ... }
}
```

### Rollback failures

```bash
# Use step-by-step rollback
npx philjs db migrate:rollback --step 1

# Check migration code for errors
```

## License

MIT
