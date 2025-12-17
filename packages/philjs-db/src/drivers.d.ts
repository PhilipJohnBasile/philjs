/**
 * Type declarations for optional database drivers
 * These are declared as `any` since they're optional dependencies
 */

declare module 'postgres' {
  const postgres: any;
  export default postgres;
}

declare module 'mysql2/promise' {
  export function createPool(connectionString: string): any;
}

declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string);
  }
  export default Database;
}
