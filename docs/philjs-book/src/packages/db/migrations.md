# Database Migrations

@philjs/db provides a complete migration system supporting PostgreSQL, MySQL, SQLite, and MongoDB. This guide covers everything from basic usage to advanced features like auto-migration and ORM integration.

## Overview

The migration system provides:

- Version-controlled schema changes
- Up/down migrations with rollback support
- Transaction support for safe migrations
- Multi-database support (PostgreSQL, MySQL, SQLite)
- Integration with Prisma and Drizzle ORMs
- CLI tools for migration management
- Schema diff and auto-migration generation

## Quick Start

### Installation

```bash
npm install @philjs/db
```

### Configuration

Create a configuration file `philjs-db.config.ts`:

```typescript
import type { MigrationConfig } from '@philjs/db';

const config: MigrationConfig = {
  type: 'postgres',  // 'postgres' | 'mysql' | 'sqlite' | 'mongodb'
  connection: process.env.DATABASE_URL,
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: true,
  backup: true,
  seedsDir: './seeds',
  schemaFile: './schema.sql',
};

export default config;
```

### Initialize Migration Manager

```typescript
import { MigrationManager } from '@philjs/db';

const manager = new MigrationManager({
  type: 'postgres',
  connection: process.env.DATABASE_URL,
  migrationsDir: './migrations',
});

// Initialize (creates migrations directory and table)
await manager.initialize();
```

## Migration Manager

### Creating Migrations

```typescript
// Create a new migration file
const filepath = await manager.create('create_users_table');
// Creates: migrations/20240115120000_create_users_table.ts

// With specific template
const filepath = await manager.create('create_posts_table', {
  template: 'table',  // 'table' | 'alter' | 'data'
});
```

### Running Migrations

```typescript
// Run all pending migrations
const result = await manager.migrate();

console.log('Success:', result.success);
console.log('Migrated:', result.migrations);
console.log('Duration:', result.duration, 'ms');

// Run up to specific version
await manager.migrate({ to: '20240115120000' });

// Run next N migrations
await manager.migrate({ step: 3 });
```

### Rolling Back

```typescript
// Rollback last batch
await manager.rollback();

// Rollback specific number of migrations
await manager.rollback({ step: 2 });

// Rollback to specific version
await manager.rollback({ to: '20240101000000' });

// Rollback specific batch
await manager.rollback({ batch: 5 });
```

### Reset and Fresh

```typescript
// Reset: rollback all, then migrate
await manager.reset();

// Fresh: drop all tables, then migrate
await manager.fresh();
```

### Checking Status

```typescript
const status = await manager.getStatus();

console.log('Pending migrations:', status.pending);
console.log('Executed migrations:', status.executed);
console.log('Conflicts:', status.conflicts);

// Detailed status
status.pending.forEach(m => {
  console.log(`  Pending: ${m.version}_${m.name}`);
});

status.executed.forEach(m => {
  console.log(`  Executed: ${m.version}_${m.name} (batch ${m.batch})`);
});
```

## Migration Files

### Basic Structure

```typescript
// migrations/20240115120000_create_users_table.ts
import type { Migration } from '@philjs/db';

export default {
  name: 'create_users_table',

  async up(context) {
    // Forward migration
    context.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email').unique().notNullable();
      table.string('name');
      table.timestamps(true);
    });
  },

  async down(context) {
    // Rollback migration
    context.schema.dropTable('users');
  },
} as Migration;
```

### Migration Context

The migration context provides access to:

```typescript
interface MigrationContext {
  db: unknown;              // Database connection
  sql: SqlExecutor;         // Raw SQL executor
  schema: SchemaBuilder;    // Schema builder
  data: DataMigrationHelpers;  // Data helpers
  type: DatabaseType;       // Current database type
}
```

### Schema Builder

Create tables:

```typescript
context.schema.createTable('users', (table) => {
  // Primary key
  table.increments('id').primary();

  // Strings
  table.string('name');              // VARCHAR(255)
  table.string('code', 10);          // VARCHAR(10)
  table.text('bio');                 // TEXT

  // Numbers
  table.integer('age');              // INTEGER
  table.bigInteger('views');         // BIGINT
  table.decimal('price', 10, 2);     // DECIMAL(10, 2)
  table.float('score', 8, 4);        // FLOAT(8)

  // Boolean
  table.boolean('active');           // BOOLEAN

  // Dates
  table.date('birthday');            // DATE
  table.datetime('scheduledAt');     // TIMESTAMP/DATETIME
  table.timestamp('createdAt');      // TIMESTAMP
  table.timestamps(true);            // created_at + updated_at

  // JSON
  table.json('settings');            // JSON
  table.jsonb('metadata');           // JSONB (PostgreSQL)

  // UUID
  table.uuid('uuid');                // UUID

  // Enum
  table.enum('status', ['draft', 'published', 'archived']);
});
```

Column modifiers:

```typescript
table.string('email')
  .notNullable()           // NOT NULL
  .unique()                // UNIQUE
  .defaultTo('example')    // DEFAULT value
  .index()                 // Create index
  .comment('User email');  // Column comment

table.integer('age')
  .nullable()              // Allow NULL
  .unsigned()              // Unsigned (CHECK >= 0 in PostgreSQL)
  .defaultTo(0);           // DEFAULT 0
```

Foreign keys:

```typescript
table.integer('user_id')
  .references('id')
  .inTable('users')
  .onDelete('CASCADE')
  .onUpdate('CASCADE');

// Or using foreign() method
table.foreign('user_id')
  .references('id')
  .inTable('users')
  .onDelete('SET NULL');
```

Indexes and constraints:

```typescript
// Primary key on multiple columns
table.primary(['user_id', 'role_id']);

// Unique constraint
table.unique(['email', 'organization_id']);

// Index
table.index(['created_at', 'status']);
```

Alter tables:

```typescript
context.schema.alterTable('users', (table) => {
  // Add column
  table.string('phone').nullable();

  // Drop column
  table.dropColumn('legacy_field');

  // Rename column
  table.renameColumn('old_name', 'new_name');

  // Add index
  table.index(['status', 'created_at']);

  // Drop constraints
  table.dropPrimary();
  table.dropUnique(['email']);
  table.dropIndex(['status']);
  table.dropForeign('user_id');
});
```

Other schema operations:

```typescript
// Drop table
context.schema.dropTable('users');

// Rename table
context.schema.renameTable('old_table', 'new_table');

// Check if table exists
if (await context.schema.hasTable('users')) {
  // Table exists
}

// Raw SQL
context.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
```

### Data Migration Helpers

Insert data:

```typescript
await context.data.insert('users', {
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
});

// Multiple rows
await context.data.insert('settings', [
  { key: 'app_name', value: 'MyApp' },
  { key: 'app_version', value: '1.0.0' },
]);
```

Update data:

```typescript
await context.data.update('users',
  { email: 'old@example.com' },      // Where
  { email: 'new@example.com' }       // Data
);
```

Delete data:

```typescript
await context.data.delete('users', {
  status: 'inactive',
});
```

Batch insert:

```typescript
const users = generateUsers(10000);

await context.data.batchInsert('users', users, 100);  // Batch size of 100
```

Raw queries:

```typescript
await context.data.raw(
  'UPDATE users SET status = $1 WHERE created_at < $2',
  ['inactive', '2023-01-01']
);
```

### Migration Dependencies

Specify dependencies for ordered execution:

```typescript
export default {
  name: 'create_posts_table',
  dependencies: ['create_users_table'],  // Runs after users table exists

  async up(context) {
    context.schema.createTable('posts', (table) => {
      table.increments('id').primary();
      table.integer('author_id').references('id').inTable('users');
      table.string('title');
      table.text('content');
    });
  },

  async down(context) {
    context.schema.dropTable('posts');
  },
} as Migration;
```

### Transaction Control

```typescript
export default {
  name: 'complex_migration',
  transaction: true,  // Run in transaction (default: true)

  async up(context) {
    // All operations are transactional
    await context.data.insert('users', { /* ... */ });
    await context.data.update('settings', { /* ... */ }, { /* ... */ });
  },

  async down(context) {
    // Rollback is also transactional
  },
} as Migration;

// Disable transaction for non-transactional DDL
export default {
  name: 'create_index_concurrently',
  transaction: false,  // PostgreSQL CREATE INDEX CONCURRENTLY requires this

  async up(context) {
    context.schema.raw('CREATE INDEX CONCURRENTLY idx_users_email ON users(email)');
  },

  async down(context) {
    context.schema.raw('DROP INDEX CONCURRENTLY idx_users_email');
  },
} as Migration;
```

## CLI Commands

### Basic Commands

```bash
# Run all pending migrations
philjs db migrate

# Rollback last batch
philjs db rollback

# Check migration status
philjs db status

# Create new migration
philjs db create <name>
philjs db create create_users --template table

# Reset database (rollback all, migrate)
philjs db reset

# Fresh database (drop all, migrate)
philjs db fresh
```

### Command Options

```bash
# Migrate options
philjs db migrate --step 3           # Run next 3 migrations
philjs db migrate --to 20240115120000  # Migrate to specific version
philjs db migrate --dry-run          # Show what would run

# Rollback options
philjs db rollback --step 2          # Rollback 2 migrations
philjs db rollback --to 20240101000000  # Rollback to version
philjs db rollback --batch 5         # Rollback specific batch

# General options
philjs db status --verbose           # Detailed status
philjs db <cmd> --config ./config.js  # Custom config file
philjs db fresh --yes               # Skip confirmation
```

### Schema Diff

```bash
# Show differences between current and target schema
philjs db diff

# Generate migration from schema changes
philjs db auto --name add_phone_column
philjs db auto --dry-run
```

## Database Adapters

### PostgreSQL Adapter

```typescript
import { PostgresMigrationAdapter } from '@philjs/db';

const adapter = new PostgresMigrationAdapter(connection);
const context = adapter.createContext();

// PostgreSQL-specific features
context.schema.createTable('users', (table) => {
  table.uuid('id').primary().defaultTo('gen_random_uuid()');
  table.jsonb('metadata');
  table.text('tsv').index();  // Full-text search vector
});
```

### MySQL Adapter

```typescript
import { MySQLMigrationAdapter } from '@philjs/db';

const adapter = new MySQLMigrationAdapter(connection);
const context = adapter.createContext();

// MySQL-specific features
context.schema.createTable('users', (table) => {
  table.increments('id');  // AUTO_INCREMENT
  table.string('name').collation('utf8mb4_unicode_ci');
});
```

### SQLite Adapter

```typescript
import { SQLiteMigrationAdapter } from '@philjs/db';

const adapter = new SQLiteMigrationAdapter(connection);
const context = adapter.createContext();

// SQLite-specific considerations
context.schema.createTable('users', (table) => {
  table.increments('id');  // INTEGER PRIMARY KEY AUTOINCREMENT
  table.text('data');      // SQLite text type
});
```

## Schema Diff Generator

Compare schemas and generate diffs:

```typescript
import { SchemaDiffGenerator } from '@philjs/db';

const differ = new SchemaDiffGenerator({
  type: 'postgres',
  connection: connectionString,
  schemaFile: './schema.sql',
});

// Generate diff
const diff = await differ.generate();

console.log('New tables:', diff.tables.created);
console.log('Dropped tables:', diff.tables.dropped);
console.log('Modified tables:', diff.tables.modified);

// Column changes
diff.columns.forEach(col => {
  if (col.type === 'added') {
    console.log(`New column: ${col.table}.${col.name}`);
  } else if (col.type === 'removed') {
    console.log(`Dropped column: ${col.table}.${col.name}`);
  } else if (col.type === 'modified') {
    console.log(`Changed column: ${col.table}.${col.name}`);
    console.log(`  From: ${JSON.stringify(col.oldDefinition)}`);
    console.log(`  To: ${JSON.stringify(col.newDefinition)}`);
  }
});

// Generate SQL for the diff
const sql = differ.generateSQL(diff);
console.log('SQL statements:', sql);
```

## Auto-Migration Generator

Automatically generate migrations from schema changes:

```typescript
import { AutoMigrationGenerator } from '@philjs/db';

const generator = new AutoMigrationGenerator({
  type: 'postgres',
  connection: connectionString,
  migrationsDir: './migrations',
});

// Generate migration
const result = await generator.generate({
  compare: true,
  name: 'add_user_phone',
  dryRun: false,
});

console.log('SQL:', result.sql);
console.log('Warnings:', result.warnings);
console.log('Estimated duration:', result.estimatedDuration, 'ms');
```

Dry run to preview changes:

```typescript
const preview = await generator.generate({
  compare: true,
  dryRun: true,
});

// Review warnings
if (preview.warnings.length > 0) {
  console.log('Warnings:');
  preview.warnings.forEach(w => console.log(`  - ${w}`));
}

// Review SQL
console.log('Would execute:');
preview.sql.forEach(s => console.log(`  ${s}`));
```

## Backup Manager

Create and restore database backups:

```typescript
import { BackupManager } from '@philjs/db';

const backup = new BackupManager({
  type: 'postgres',
  connection: connectionString,
});

// Create backup
const backupFile = await backup.createBackup();
console.log('Backup created:', backupFile);

// Create named backup
const namedBackup = await backup.createBackup('before_migration_2024');

// Restore from backup
await backup.restoreBackup('./backups/backup_2024-01-15.sql');
```

## Data Migration Helper

Utilities for complex data migrations:

```typescript
import { DataMigrationHelper } from '@philjs/db';

// Transform data during migration
await DataMigrationHelper.transformData(
  'users',
  (row) => ({
    ...row,
    fullName: `${row.firstName} ${row.lastName}`,
  }),
  100  // Batch size
);

// Copy data between tables
await DataMigrationHelper.copyData(
  'old_users',      // Source table
  'users',          // Target table
  ['id', 'email', 'name']  // Columns to copy
);

// Migrate with validation
await DataMigrationHelper.migrateWithValidation(
  'users',
  (row) => row.email && row.email.includes('@'),  // Validator
  (invalidRow) => {
    console.log('Invalid row:', invalidRow);
  }
);
```

## Prisma Integration

Import and sync with Prisma migrations:

```typescript
import { PrismaMigrationIntegration, PrismaSchemaParser } from '@philjs/db';

// Parse Prisma schema
const parser = new PrismaSchemaParser();
const schema = await parser.parse('./prisma/schema.prisma');

console.log('Models:', schema.models);
console.log('Enums:', schema.enums);

// Convert Prisma model to migration
const migration = PrismaSchemaParser.modelToMigration(schema.models[0]);

// Import Prisma migrations
const migrations = await PrismaMigrationIntegration.importPrismaMigrations(
  './prisma/migrations'
);

// Export to Prisma schema
const prismaSchema = await PrismaMigrationIntegration.exportToPrismaSchema(
  migrations
);
```

## Drizzle Integration

Import and sync with Drizzle schemas:

```typescript
import { DrizzleMigrationIntegration, DrizzleSchemaParser } from '@philjs/db';

// Parse Drizzle schema
const parser = new DrizzleSchemaParser();
const schema = await parser.parse('./src/db/schema.ts');

console.log('Tables:', schema.tables);
console.log('Relations:', schema.relations);

// Convert Drizzle table to migration
const migration = DrizzleMigrationIntegration.tableToMigration(schema.tables[0]);

// Import Drizzle migrations
const migrations = await DrizzleMigrationIntegration.importDrizzleMigrations(
  './drizzle/migrations'
);

// Export to Drizzle schema
const drizzleSchema = await DrizzleMigrationIntegration.exportToDrizzleSchema(
  migrations
);
```

## Best Practices

### 1. Always Write Down Migrations

Every up migration should have a corresponding down migration:

```typescript
// Good
async up(context) {
  context.schema.createTable('users', /* ... */);
}

async down(context) {
  context.schema.dropTable('users');
}

// Bad - no way to rollback
async up(context) {
  context.schema.createTable('users', /* ... */);
}

async down(context) {
  // Empty - can't rollback!
}
```

### 2. Make Migrations Idempotent

Use `IF EXISTS` and `IF NOT EXISTS`:

```typescript
async up(context) {
  // Check before creating
  if (!(await context.schema.hasTable('users'))) {
    context.schema.createTable('users', /* ... */);
  }
}
```

### 3. Use Transactions for Data Migrations

```typescript
export default {
  name: 'migrate_user_data',
  transaction: true,  // Ensure atomicity

  async up(context) {
    // All these operations are atomic
    await context.data.update('users', { role: 'user' }, { role: 'member' });
    await context.data.delete('users', { status: 'deleted' });
  },
} as Migration;
```

### 4. Test Migrations Before Production

```bash
# Always run with --dry-run first
philjs db migrate --dry-run

# Test rollback
philjs db rollback --step 1
philjs db migrate
```

### 5. Back Up Before Major Changes

```typescript
const manager = new MigrationManager({
  // ...
  backup: true,  // Auto backup before migrations
});
```

### 6. Use Meaningful Migration Names

```bash
# Good
philjs db create add_phone_to_users
philjs db create create_posts_table
philjs db create add_index_on_users_email

# Bad
philjs db create migration1
philjs db create fix
philjs db create update
```

## Troubleshooting

### Migration Conflicts

```typescript
const status = await manager.getStatus();

if (status.conflicts.length > 0) {
  status.conflicts.forEach(conflict => {
    console.log(`Conflict: ${conflict.type} - ${conflict.message}`);
  });

  // Handle conflicts manually
  if (conflict.type === 'missing') {
    // Migration file deleted after execution
    // Either restore the file or manually remove from migrations table
  } else if (conflict.type === 'duplicate') {
    // Two migrations with same version
    // Rename one of the migration files
  }
}
```

### Failed Migrations

```typescript
const result = await manager.migrate();

if (!result.success) {
  result.errors.forEach(error => {
    console.log(`Failed: ${error.migration}`);
    console.log(`Error: ${error.error.message}`);
    console.log(`Time: ${error.timestamp}`);
  });

  // Migrations stop on first error
  // Fix the issue and re-run
}
```

### Connection Issues

```typescript
try {
  await manager.initialize();
} catch (error) {
  if (error.message.includes('ECONNREFUSED')) {
    console.log('Database is not running');
  } else if (error.message.includes('authentication')) {
    console.log('Invalid database credentials');
  }
}
```

## Type Definitions

```typescript
interface MigrationConfig {
  type: 'postgres' | 'mysql' | 'sqlite' | 'mongodb';
  connection: string | Record<string, unknown>;
  migrationsDir?: string;   // Default: './migrations'
  tableName?: string;       // Default: 'migrations'
  transactional?: boolean;  // Default: true
  backup?: boolean;         // Default: false
  seedsDir?: string;        // Default: './seeds'
  schemaFile?: string;      // Default: './schema.sql'
}

interface Migration {
  version: string;
  name: string;
  up: (context: MigrationContext) => Promise<void>;
  down: (context: MigrationContext) => Promise<void>;
  dependencies?: string[];
  transaction?: boolean;
}

interface MigrationResult {
  success: boolean;
  migrations: string[];
  errors: MigrationError[];
  duration: number;
}

interface MigrationStatus {
  pending: MigrationFile[];
  executed: MigrationRecord[];
  conflicts: MigrationConflict[];
}
```

## Next Steps

- [Schema Management](./schema.md) - Validation and type safety
- [Queries](./queries.md) - Query builder guide
- [Supabase](./supabase.md) - Supabase integration
