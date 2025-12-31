#!/usr/bin/env node
/**
 * PhilJS Database Migration CLI
 *
 * Commands:
 * - philjs db migrate - Run pending migrations
 * - philjs db migrate:create - Create new migration
 * - philjs db migrate:rollback - Rollback migrations
 * - philjs db migrate:status - Check migration status
 * - philjs db migrate:fresh - Fresh database
 * - philjs db migrate:reset - Reset and re-run
 */
declare class MigrationCLI {
    private manager?;
    private config?;
    run(args: string[]): Promise<void>;
    private loadConfig;
    private migrate;
    private createMigration;
    private rollback;
    private status;
    private fresh;
    private reset;
    private diff;
    private autoMigration;
    private parseOptions;
    private promptMigrationName;
    private confirm;
    private printSchemaDiff;
    private showHelp;
}
export { MigrationCLI };
//# sourceMappingURL=cli.d.ts.map