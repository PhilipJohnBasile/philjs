/**
 * Reactive Queries
 * Auto-updating SQL queries that react to database changes
 */
/**
 * Reactive query instance
 */
export class ReactiveQuery {
    db;
    sql;
    params;
    dependencies;
    transform;
    debounceMs;
    state = {
        data: [],
        loading: true,
        error: null,
        updatedAt: 0,
    };
    listeners = new Set();
    unsubscribes = [];
    debounceTimer = null;
    constructor(db, options) {
        this.db = db;
        this.sql = options.sql;
        this.params = options.params ?? [];
        this.dependencies = new Set(options.dependencies ?? this.extractTables(options.sql));
        this.transform = options.transform;
        this.debounceMs = options.debounce ?? 0;
        // Initial query
        this.execute();
        // Subscribe to table changes
        this.subscribeToChanges();
    }
    /**
     * Get current data
     */
    get data() {
        return this.state.data;
    }
    /**
     * Get loading state
     */
    get loading() {
        return this.state.loading;
    }
    /**
     * Get error
     */
    get error() {
        return this.state.error;
    }
    /**
     * Get last update timestamp
     */
    get updatedAt() {
        return this.state.updatedAt;
    }
    /**
     * Execute query and update state
     */
    execute() {
        this.state.loading = true;
        this.state.error = null;
        try {
            const rows = this.db.query(this.sql, this.params);
            const transformed = this.transform ? this.transform(rows) : rows;
            this.state.data = transformed;
            this.state.updatedAt = Date.now();
        }
        catch (err) {
            this.state.error = err instanceof Error ? err : new Error(String(err));
        }
        finally {
            this.state.loading = false;
            this.notifyListeners();
        }
    }
    /**
     * Manually refresh the query
     */
    refresh() {
        this.execute();
    }
    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Update query parameters
     */
    setParams(params) {
        this.params = params;
        this.execute();
    }
    /**
     * Cleanup subscriptions
     */
    dispose() {
        for (const unsubscribe of this.unsubscribes) {
            unsubscribe();
        }
        this.unsubscribes = [];
        this.listeners.clear();
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }
    /**
     * Subscribe to database changes
     */
    subscribeToChanges() {
        for (const table of this.dependencies) {
            const unsubscribe = this.db.onTableChange(table, this.handleChange.bind(this));
            this.unsubscribes.push(unsubscribe);
        }
    }
    /**
     * Handle table change event
     */
    handleChange(event) {
        if (this.debounceMs > 0) {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
                this.execute();
                this.debounceTimer = null;
            }, this.debounceMs);
        }
        else {
            this.execute();
        }
    }
    /**
     * Notify all listeners of state change
     */
    notifyListeners() {
        for (const listener of this.listeners) {
            listener();
        }
    }
    /**
     * Extract table names from SQL
     */
    extractTables(sql) {
        const tables = [];
        const regex = /(?:FROM|JOIN|INTO|UPDATE)\s+[`"']?(\w+)[`"']?/gi;
        let match;
        while ((match = regex.exec(sql)) !== null) {
            if (match[1] && !tables.includes(match[1])) {
                tables.push(match[1]);
            }
        }
        return tables;
    }
}
/**
 * Create a reactive query
 */
export function createReactiveQuery(db, options) {
    return new ReactiveQuery(db, options);
}
/**
 * Reactive query builder for type-safe queries
 */
export class QueryBuilder {
    db;
    _select = '*';
    _from = '';
    _where = [];
    _orderBy = [];
    _limit;
    _offset;
    _params = [];
    constructor(db) {
        this.db = db;
    }
    select(columns) {
        this._select = Array.isArray(columns) ? columns.join(', ') : columns;
        return this;
    }
    from(table) {
        this._from = table;
        return this;
    }
    where(condition, ...params) {
        this._where.push(condition);
        this._params.push(...params);
        return this;
    }
    orderBy(column, direction = 'ASC') {
        this._orderBy.push(`${column} ${direction}`);
        return this;
    }
    limit(count) {
        this._limit = count;
        return this;
    }
    offset(count) {
        this._offset = count;
        return this;
    }
    /**
     * Build the SQL query
     */
    toSQL() {
        let sql = `SELECT ${this._select} FROM ${this._from}`;
        if (this._where.length > 0) {
            sql += ` WHERE ${this._where.join(' AND ')}`;
        }
        if (this._orderBy.length > 0) {
            sql += ` ORDER BY ${this._orderBy.join(', ')}`;
        }
        if (this._limit !== undefined) {
            sql += ` LIMIT ${this._limit}`;
        }
        if (this._offset !== undefined) {
            sql += ` OFFSET ${this._offset}`;
        }
        return { sql, params: this._params };
    }
    /**
     * Execute as a one-time query
     */
    execute() {
        const { sql, params } = this.toSQL();
        return this.db.query(sql, params);
    }
    /**
     * Create a reactive version of this query
     */
    reactive(options) {
        const { sql, params } = this.toSQL();
        return createReactiveQuery(this.db, {
            sql,
            params,
            dependencies: [this._from],
            debounce: options?.debounce,
        });
    }
}
/**
 * Create a query builder
 */
export function query(db) {
    return new QueryBuilder(db);
}
//# sourceMappingURL=reactive-query.js.map