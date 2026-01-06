export class Relation {
    config;
    conditions = {};
    sorts = [];
    limitValue;
    resourceName;
    constructor(resourceName, config = {}) {
        this.config = config;
        this.resourceName = resourceName;
    }
    where(conditions) {
        this.conditions = { ...this.conditions, ...conditions };
        return this;
    }
    order(field, dir = 'asc') {
        this.sorts.push({ field, dir });
        return this;
    }
    limit(count) {
        this.limitValue = count;
        return this;
    }
    async toArray() {
        const queryParams = new URLSearchParams();
        if (Object.keys(this.conditions).length)
            queryParams.set('q', JSON.stringify(this.conditions));
        if (this.sorts.length)
            queryParams.set('sort', JSON.stringify(this.sorts));
        if (this.limitValue)
            queryParams.set('limit', String(this.limitValue));
        const response = await fetch(`${this.config.baseUrl || ''}/api/${this.resourceName}?${queryParams.toString()}`, {
            headers: { 'Accept': 'application/json', ...this.config.headers }
        });
        if (!response.ok)
            throw new Error(`ActiveRecord Error: ${response.statusText}`);
        return await response.json();
    }
    async first() {
        this.limit(1);
        const results = await this.toArray();
        return results[0] || null;
    }
}
export class ActiveRecordWrapper {
    static config = {};
    static resource = 'resources';
    static configure(config) {
        this.config = config;
    }
    static find(id) {
        return new Relation(this.resource, this.config).where({ id }).first();
    }
    static where(conditions) {
        return new Relation(this.resource, this.config).where(conditions);
    }
    /**
     * AI-Power: Ask for data using natural language using PhilJS Nexus AI
     */
    static async ask(naturalLanguageQuery) {
        // Call the Nexus AI endpoint if configured, or default convention
        const response = await fetch(`${this.config.baseUrl || ''}/api/ai/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...this.config.headers },
            body: JSON.stringify({ query: naturalLanguageQuery, model: this.resource })
        });
        const sqlOrData = await response.json();
        // If the server returns raw data, wrap it
        if (Array.isArray(sqlOrData))
            return sqlOrData;
        // If it returns criteria, use them
        if (sqlOrData.where)
            return this.where(sqlOrData.where);
        return [];
    }
    save() {
        return Promise.resolve(true); // Placeholder for instance method
    }
}
//# sourceMappingURL=active-record.js.map