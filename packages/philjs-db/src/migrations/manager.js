/**
 * PhilJS Database Migration Manager
 * Core migration orchestration and execution
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { pathToFileURL } from 'url';
export class MigrationManager {
    config;
    connection;
    executedMigrations = [];
    constructor(config) {
        this.config = {
            type: config.type,
            connection: config.connection,
            migrationsDir: config.migrationsDir || './migrations',
            tableName: config.tableName || 'migrations',
            transactional: config.transactional ?? true,
            backup: config.backup ?? false,
            seedsDir: config.seedsDir || './seeds',
            schemaFile: config.schemaFile || './schema.sql',
        };
    }
    /**
     * Initialize migration system
     */
    async initialize() {
        // Create migrations directory if it doesn't exist
        await fs.mkdir(this.config.migrationsDir, { recursive: true });
        // Create migrations table
        await this.createMigrationsTable();
    }
    /**
     * Create migrations tracking table
     */
    async createMigrationsTable() {
        const sql = this.generateCreateTableSQL();
        // Execute SQL based on database type
        // Implementation depends on database driver
    }
    /**
     * Get migration status
     */
    async getStatus() {
        const executed = await this.getExecutedMigrations();
        const files = await this.getMigrationFiles();
        const executedVersions = new Set(executed.map((record) => record.version));
        const pending = files.filter((file) => !executedVersions.has(file.version));
        const conflicts = await this.detectConflicts(files, executed);
        return { pending, executed, conflicts };
    }
    /**
     * Run pending migrations
     */
    async migrate(options = {}) {
        const startTime = Date.now();
        const status = await this.getStatus();
        const errors = [];
        const migrated = [];
        if (status.conflicts.length > 0) {
            throw new Error(`Migration conflicts detected:\n${status.conflicts.map((c) => c.message).join('\n')}`);
        }
        let migrationsToRun = status.pending;
        // Filter migrations based on options
        if (options.to) {
            const index = migrationsToRun.findIndex((m) => m.version === options.to);
            if (index === -1) {
                throw new Error(`Migration ${options.to} not found`);
            }
            migrationsToRun = migrationsToRun.slice(0, index + 1);
        }
        else if (options.step) {
            migrationsToRun = migrationsToRun.slice(0, options.step);
        }
        // Backup if configured
        if (this.config.backup) {
            await this.createBackup();
        }
        const batch = await this.getNextBatch();
        for (const file of migrationsToRun) {
            try {
                await this.runMigration(file, batch, 'up');
                migrated.push(file.version);
            }
            catch (error) {
                errors.push({
                    migration: file.version,
                    error: error,
                    timestamp: new Date(),
                });
                break; // Stop on first error
            }
        }
        return {
            success: errors.length === 0,
            migrations: migrated,
            errors,
            duration: Date.now() - startTime,
        };
    }
    /**
     * Rollback migrations
     */
    async rollback(options = {}) {
        const startTime = Date.now();
        const executed = await this.getExecutedMigrations();
        const errors = [];
        const rolledBack = [];
        let migrationsToRollback = executed.reverse();
        if (options.batch !== undefined) {
            migrationsToRollback = migrationsToRollback.filter((m) => m.batch === options.batch);
        }
        else if (options.to) {
            const index = migrationsToRollback.findIndex((m) => m.version === options.to);
            if (index === -1) {
                throw new Error(`Migration ${options.to} not found`);
            }
            migrationsToRollback = migrationsToRollback.slice(0, index);
        }
        else if (options.step) {
            migrationsToRollback = migrationsToRollback.slice(0, options.step);
        }
        else {
            // Rollback last batch by default
            const lastBatch = Math.max(...executed.map((m) => m.batch));
            migrationsToRollback = migrationsToRollback.filter((m) => m.batch === lastBatch);
        }
        // Backup if configured
        if (this.config.backup) {
            await this.createBackup();
        }
        for (const record of migrationsToRollback) {
            try {
                const file = await this.findMigrationFile(record.version);
                if (!file) {
                    throw new Error(`Migration file not found: ${record.version}`);
                }
                await this.runMigration(file, record.batch, 'down');
                rolledBack.push(record.version);
            }
            catch (error) {
                errors.push({
                    migration: record.version,
                    error: error,
                    timestamp: new Date(),
                });
                break;
            }
        }
        return {
            success: errors.length === 0,
            migrations: rolledBack,
            errors,
            duration: Date.now() - startTime,
        };
    }
    /**
     * Reset database (rollback all, then migrate)
     */
    async reset() {
        const rollbackResult = await this.rollback({ step: Infinity });
        if (!rollbackResult.success) {
            return rollbackResult;
        }
        return await this.migrate();
    }
    /**
     * Fresh database (drop all tables, then migrate)
     */
    async fresh() {
        await this.dropAllTables();
        await this.createMigrationsTable();
        return await this.migrate();
    }
    /**
     * Create a new migration file
     */
    async create(name, options = {}) {
        const timestamp = this.generateTimestamp();
        const version = await this.ensureUniqueVersion(timestamp);
        const filename = `${version}_${this.sanitizeName(name)}.ts`;
        const filepath = path.join(this.config.migrationsDir, filename);
        const template = this.getMigrationTemplate(name, options.template);
        await fs.writeFile(filepath, template, 'utf-8');
        return filepath;
    }
    /**
     * Run a single migration
     */
    async runMigration(file, batch, direction) {
        const startTime = Date.now();
        const migration = await this.loadMigration(file.filepath);
        const runMigrationFn = async () => {
            const context = await this.createMigrationContext();
            if (direction === 'up') {
                await migration.up(context);
                await this.recordMigration(file.version, file.name, batch, Date.now() - startTime);
            }
            else {
                await migration.down(context);
                await this.deleteMigrationRecord(file.version);
            }
        };
        if (this.config.transactional && migration.transaction !== false) {
            await this.withTransaction(runMigrationFn);
        }
        else {
            await runMigrationFn();
        }
    }
    /**
     * Load migration from file
     */
    async loadMigration(filepath) {
        // Dynamic import of migration file
        const module = await import(pathToFileURL(filepath).href);
        return module.default || module;
    }
    /**
     * Create migration context
     */
    async createMigrationContext() {
        // Create context with database connection and helpers
        // Implementation depends on database type
        return {};
    }
    /**
     * Get executed migrations
     */
    async getExecutedMigrations() {
        return [...this.executedMigrations];
    }
    /**
     * Get migration files from directory
     */
    async getMigrationFiles() {
        const entries = await fs.readdir(this.config.migrationsDir, { withFileTypes: true });
        const migrationFiles = [];
        for (const entry of entries) {
            const file = typeof entry === 'string' ? entry : entry.name;
            const isFile = typeof entry === 'string' ? true : entry.isFile();
            if (!isFile)
                continue;
            if (!file.endsWith('.ts') && !file.endsWith('.js'))
                continue;
            const match = file.match(/^(\d+)_(.+)\.(ts|js)$/);
            if (!match)
                continue;
            const [, version, name] = match;
            if (version === undefined || name === undefined)
                continue;
            migrationFiles.push({
                version,
                name,
                filename: file,
                filepath: path.join(this.config.migrationsDir, file),
            });
        }
        return migrationFiles.sort((a, b) => a.version.localeCompare(b.version));
    }
    /**
     * Find specific migration file
     */
    async findMigrationFile(version) {
        const files = await this.getMigrationFiles();
        return files.find((f) => f.version === version) || null;
    }
    /**
     * Detect migration conflicts
     */
    async detectConflicts(files, executed) {
        const conflicts = [];
        const fileVersions = new Set(files.map((file) => file.version));
        // Check for missing migration files
        for (const record of executed) {
            if (!fileVersions.has(record.version)) {
                conflicts.push({
                    type: 'missing',
                    migration: record.version,
                    message: `Migration file missing for executed migration: ${record.version}`,
                });
            }
        }
        // Check for duplicate versions
        const seen = new Set();
        const duplicateVersions = new Set();
        for (const file of files) {
            if (seen.has(file.version)) {
                duplicateVersions.add(file.version);
            }
            else {
                seen.add(file.version);
            }
        }
        for (const version of duplicateVersions) {
            conflicts.push({
                type: 'duplicate',
                migration: version,
                message: `Duplicate migration version: ${version}`,
            });
        }
        return conflicts;
    }
    /**
     * Record migration execution
     */
    async recordMigration(version, name, batch, executionTime) {
        this.executedMigrations.push({
            id: this.executedMigrations.length + 1,
            version,
            name,
            executed_at: new Date(),
            execution_time: executionTime,
            batch,
        });
    }
    /**
     * Delete migration record
     */
    async deleteMigrationRecord(version) {
        this.executedMigrations = this.executedMigrations.filter((record) => record.version !== version);
    }
    /**
     * Get next batch number
     */
    async getNextBatch() {
        const executed = await this.getExecutedMigrations();
        if (executed.length === 0)
            return 1;
        return Math.max(...executed.map((m) => m.batch)) + 1;
    }
    /**
     * Create database backup
     */
    async createBackup() {
        // Implementation depends on database type
    }
    /**
     * Drop all tables
     */
    async dropAllTables() {
        // Implementation depends on database type
    }
    /**
     * Execute function in transaction
     */
    async withTransaction(fn) {
        await fn();
    }
    /**
     * Generate timestamp for migration version
     */
    generateTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    async ensureUniqueVersion(baseVersion) {
        let existingVersions = new Set();
        try {
            const entries = await fs.readdir(this.config.migrationsDir, { withFileTypes: true });
            for (const entry of entries) {
                const name = typeof entry === 'string' ? entry : entry.name;
                const isFile = typeof entry === 'string' ? true : entry.isFile();
                if (!isFile)
                    continue;
                const match = name.match(/^(\d+)_/);
                if (match?.[1]) {
                    existingVersions.add(match[1]);
                }
            }
        }
        catch {
            existingVersions = new Set();
        }
        if (!existingVersions.has(baseVersion)) {
            return baseVersion;
        }
        let counter = 1;
        let candidate = `${baseVersion}${String(counter).padStart(2, '0')}`;
        while (existingVersions.has(candidate)) {
            counter += 1;
            candidate = `${baseVersion}${String(counter).padStart(2, '0')}`;
        }
        return candidate;
    }
    /**
     * Sanitize migration name
     */
    sanitizeName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
    }
    /**
     * Generate SQL for creating migrations table
     */
    generateCreateTableSQL() {
        const table = this.config.tableName;
        switch (this.config.type) {
            case 'postgres':
                return `
          CREATE TABLE IF NOT EXISTS "${table}" (
            id SERIAL PRIMARY KEY,
            version VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            execution_time INTEGER NOT NULL,
            batch INTEGER NOT NULL
          )
        `;
            case 'mysql':
                return `
          CREATE TABLE IF NOT EXISTS \`${table}\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            version VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            execution_time INT NOT NULL,
            batch INT NOT NULL
          )
        `;
            case 'sqlite':
                return `
          CREATE TABLE IF NOT EXISTS "${table}" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            execution_time INTEGER NOT NULL,
            batch INTEGER NOT NULL
          )
        `;
            default:
                throw new Error(`Unsupported database type: ${this.config.type}`);
        }
    }
    /**
     * Get migration template
     */
    getMigrationTemplate(name, template) {
        if (template === 'table') {
            return this.getTableMigrationTemplate(name);
        }
        else if (template === 'alter') {
            return this.getAlterMigrationTemplate(name);
        }
        else if (template === 'data') {
            return this.getDataMigrationTemplate(name);
        }
        return this.getDefaultMigrationTemplate(name);
    }
    getDefaultMigrationTemplate(name) {
        return `import type { Migration } from '../types';

export default {
  name: '${name}',

  async up(context) {
    // Write migration here
  },

  async down(context) {
    // Write rollback here
  },
} as Migration;
`;
    }
    getTableMigrationTemplate(name) {
        const tableName = this.sanitizeName(name.replace(/^create_/, ''));
        return `import type { Migration } from '../types';

export default {
  name: '${name}',

  async up(context) {
    context.schema.createTable('${tableName}', (table) => {
      table.increments('id').primary();
      table.timestamps(true);
    });
  },

  async down(context) {
    context.schema.dropTable('${tableName}');
  },
} as Migration;
`;
    }
    getAlterMigrationTemplate(name) {
        return `import type { Migration } from '../types';

export default {
  name: '${name}',

  async up(context) {
    context.schema.alterTable('table_name', (table) => {
      // Add columns, indexes, etc.
    });
  },

  async down(context) {
    context.schema.alterTable('table_name', (table) => {
      // Reverse changes
    });
  },
} as Migration;
`;
    }
    getDataMigrationTemplate(name) {
        return `import type { Migration } from '../types';

export default {
  name: '${name}',
  transaction: true,

  async up(context) {
    await context.data.insert('table_name', [
      // Data here
    ]);
  },

  async down(context) {
    await context.data.delete('table_name', {
      // Conditions here
    });
  },
} as Migration;
`;
    }
}
//# sourceMappingURL=manager.js.map