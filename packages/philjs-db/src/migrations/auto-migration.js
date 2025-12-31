/**
 * Auto Migration Generator
 * Generates migrations from model changes
 */
import { SchemaDiffGenerator } from './schema-diff.js';
export class AutoMigrationGenerator {
    config;
    diffGenerator;
    constructor(config) {
        this.config = config;
        this.diffGenerator = new SchemaDiffGenerator(config);
    }
    /**
     * Generate migration from schema changes
     */
    async generate(options = { compare: true }) {
        const diff = await this.diffGenerator.generate();
        const sql = this.diffGenerator.generateSQL(diff);
        const warnings = this.analyzeChanges(diff);
        return {
            sql,
            warnings,
            estimatedDuration: this.estimateDuration(sql),
        };
    }
    /**
     * Analyze changes and generate warnings
     */
    analyzeChanges(diff) {
        const warnings = [];
        // Warn about dropped tables
        if (diff.tables.dropped.length > 0) {
            warnings.push(`⚠ ${diff.tables.dropped.length} table(s) will be dropped. This will result in data loss.`);
            diff.tables.dropped.forEach((table) => {
                warnings.push(`  - ${table}`);
            });
        }
        // Warn about dropped columns
        const droppedColumns = diff.columns.filter((c) => c.type === 'removed');
        if (droppedColumns.length > 0) {
            warnings.push(`⚠ ${droppedColumns.length} column(s) will be dropped. This will result in data loss.`);
            droppedColumns.forEach((col) => {
                warnings.push(`  - ${col.table}.${col.name}`);
            });
        }
        // Warn about nullable changes
        const nullabilityChanges = diff.columns.filter((c) => c.type === 'modified' &&
            c.oldDefinition &&
            c.newDefinition &&
            c.oldDefinition.nullable !== c.newDefinition.nullable);
        if (nullabilityChanges.length > 0) {
            warnings.push(`⚠ ${nullabilityChanges.length} column(s) will change nullability.`);
            nullabilityChanges.forEach((col) => {
                const change = col.newDefinition.nullable === false
                    ? 'NULL → NOT NULL'
                    : 'NOT NULL → NULL';
                warnings.push(`  - ${col.table}.${col.name}: ${change}`);
            });
        }
        // Warn about type changes
        const typeChanges = diff.columns.filter((c) => c.type === 'modified' &&
            c.oldDefinition &&
            c.newDefinition &&
            c.oldDefinition.type !== c.newDefinition.type);
        if (typeChanges.length > 0) {
            warnings.push(`⚠ ${typeChanges.length} column(s) will change type.`);
            typeChanges.forEach((col) => {
                warnings.push(`  - ${col.table}.${col.name}: ${col.oldDefinition.type} → ${col.newDefinition.type}`);
            });
        }
        // Warn about dropped indexes
        const droppedIndexes = diff.indexes.filter((i) => i.type === 'removed');
        if (droppedIndexes.length > 0) {
            warnings.push(`⚠ ${droppedIndexes.length} index(es) will be dropped. This may affect query performance.`);
        }
        // Warn about dropped foreign keys
        const droppedForeignKeys = diff.foreignKeys.filter((fk) => fk.type === 'removed');
        if (droppedForeignKeys.length > 0) {
            warnings.push(`⚠ ${droppedForeignKeys.length} foreign key(s) will be dropped. This may affect data integrity.`);
        }
        return warnings;
    }
    /**
     * Estimate migration duration
     */
    estimateDuration(sql) {
        // Very rough estimation based on number and type of operations
        let duration = 0;
        for (const query of sql) {
            const lower = query.toLowerCase();
            if (lower.includes('create table')) {
                duration += 100;
            }
            else if (lower.includes('drop table')) {
                duration += 50;
            }
            else if (lower.includes('alter table')) {
                duration += 200;
            }
            else if (lower.includes('create index')) {
                duration += 500; // Indexes can be slow on large tables
            }
            else {
                duration += 50;
            }
        }
        return duration;
    }
    /**
     * Generate migration code
     */
    generateMigrationCode(diff) {
        const upStatements = [];
        const downStatements = [];
        // Generate up migration
        for (const table of diff.tables.created) {
            upStatements.push(this.generateCreateTableCode(table));
            downStatements.unshift(this.generateDropTableCode(table.name));
        }
        for (const table of diff.tables.dropped) {
            upStatements.push(this.generateDropTableCode(table));
            // Note: Can't reverse drop without schema backup - manual recreation required
            downStatements.unshift(`// Recreate ${table} table (requires manual schema definition)`);
        }
        for (const modification of diff.tables.modified) {
            const { up, down } = this.generateAlterTableCode(modification);
            upStatements.push(up);
            downStatements.unshift(down);
        }
        return this.generateMigrationTemplate(upStatements, downStatements);
    }
    generateCreateTableCode(table) {
        return `context.schema.createTable('${table.name}', (table) => {
  // Add columns here
});`;
    }
    generateDropTableCode(table) {
        return `context.schema.dropTable('${table}');`;
    }
    generateAlterTableCode(modification) {
        const upLines = [];
        const downLines = [];
        // Add columns
        for (const col of modification.changes.columns.filter((c) => c.type === 'added')) {
            upLines.push(`  table.${this.getColumnMethodCall(col.newDefinition)};`);
            downLines.push(`  table.dropColumn('${col.name}');`);
        }
        // Drop columns
        for (const col of modification.changes.columns.filter((c) => c.type === 'removed')) {
            upLines.push(`  table.dropColumn('${col.name}');`);
            downLines.push(`  table.${this.getColumnMethodCall(col.oldDefinition)};`);
        }
        const up = `context.schema.alterTable('${modification.name}', (table) => {
${upLines.join('\n')}
});`;
        const down = `context.schema.alterTable('${modification.name}', (table) => {
${downLines.join('\n')}
});`;
        return { up, down };
    }
    getColumnMethodCall(column) {
        let call = `${column.type}('${column.name}')`;
        if (!column.nullable) {
            call += '.notNullable()';
        }
        if (column.default !== undefined) {
            call += `.defaultTo(${JSON.stringify(column.default)})`;
        }
        return call;
    }
    generateMigrationTemplate(upStatements, downStatements) {
        return `import type { Migration } from '../types';

export default {
  name: 'auto_migration_${Date.now()}',

  async up(context) {
    ${upStatements.join('\n\n    ')}
  },

  async down(context) {
    ${downStatements.join('\n\n    ')}
  },
} as Migration;
`;
    }
}
/**
 * Backup utilities
 */
export class BackupManager {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Create database backup
     */
    async createBackup(filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = filename || `backup_${timestamp}.sql`;
        switch (this.config.type) {
            case 'postgres':
                return await this.backupPostgres(backupFile);
            case 'mysql':
                return await this.backupMySQL(backupFile);
            case 'sqlite':
                return await this.backupSQLite(backupFile);
            default:
                throw new Error(`Backup not supported for ${this.config.type}`);
        }
    }
    /**
     * Restore database from backup
     */
    async restoreBackup(filepath) {
        switch (this.config.type) {
            case 'postgres':
                return await this.restorePostgres(filepath);
            case 'mysql':
                return await this.restoreMySQL(filepath);
            case 'sqlite':
                return await this.restoreSQLite(filepath);
            default:
                throw new Error(`Restore not supported for ${this.config.type}`);
        }
    }
    async backupPostgres(filename) {
        // Use pg_dump
        return filename;
    }
    async backupMySQL(filename) {
        // Use mysqldump
        return filename;
    }
    async backupSQLite(filename) {
        // Copy .db file
        return filename;
    }
    async restorePostgres(filepath) {
        // Use psql
    }
    async restoreMySQL(filepath) {
        // Use mysql
    }
    async restoreSQLite(filepath) {
        // Copy .db file
    }
}
/**
 * Data migration helpers
 */
export class DataMigrationHelper {
    /**
     * Transform data during migration
     */
    static async transformData(table, transformer, batchSize = 100) {
        // Batch process and transform data
    }
    /**
     * Copy data between tables
     */
    static async copyData(source, target, columns) {
        // Copy data from source to target
    }
    /**
     * Migrate data with validation
     */
    static async migrateWithValidation(table, validator, onInvalid) {
        // Validate and migrate data
    }
}
//# sourceMappingURL=auto-migration.js.map