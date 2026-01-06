export interface RequestConfig {
    baseUrl?: string;
    headers?: Record<string, string>;
}

export class Relation<T = any> {
    private conditions: Record<string, any> = {};
    private sorts: Array<{ field: string, dir: 'asc' | 'desc' }> = [];
    private limitValue?: number;
    private resourceName: string;

    constructor(resourceName: string, private config: RequestConfig = {}) {
        this.resourceName = resourceName;
    }

    where(conditions: Record<string, any>) {
        this.conditions = { ...this.conditions, ...conditions };
        return this;
    }

    order(field: string, dir: 'asc' | 'desc' = 'asc') {
        this.sorts.push({ field, dir });
        return this;
    }

    limit(count: number) {
        this.limitValue = count;
        return this;
    }

    async toArray(): Promise<T[]> {
        const queryParams = new URLSearchParams();
        if (Object.keys(this.conditions).length) queryParams.set('q', JSON.stringify(this.conditions));
        if (this.sorts.length) queryParams.set('sort', JSON.stringify(this.sorts));
        if (this.limitValue) queryParams.set('limit', String(this.limitValue));

        const response = await fetch(`${this.config.baseUrl || ''}/api/${this.resourceName}?${queryParams.toString()}`, {
            headers: { 'Accept': 'application/json', ...this.config.headers }
        });

        if (!response.ok) throw new Error(`ActiveRecord Error: ${response.statusText}`);
        return await response.json();
    }

    async first(): Promise<T | null> {
        this.limit(1);
        const results = await this.toArray();
        return results[0] || null;
    }
}

export class ActiveRecordWrapper {
    static config: RequestConfig = {};
    static resource = 'resources';

    static configure(config: RequestConfig) {
        this.config = config;
    }

    static find(id: number | string) {
        return new Relation(this.resource, this.config).where({ id }).first();
    }

    static where(conditions: Record<string, any>) {
        return new Relation(this.resource, this.config).where(conditions);
    }

    /**
     * AI-Power: Ask for data using natural language using PhilJS Nexus AI
     */
    static async ask(naturalLanguageQuery: string) {

        // Call the Nexus AI endpoint if configured, or default convention
        const response = await fetch(`${this.config.baseUrl || ''}/api/ai/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...this.config.headers },
            body: JSON.stringify({ query: naturalLanguageQuery, model: this.resource })
        });

        const sqlOrData = await response.json();

        // If the server returns raw data, wrap it
        if (Array.isArray(sqlOrData)) return sqlOrData;

        // If it returns criteria, use them
        if (sqlOrData.where) return this.where(sqlOrData.where);

        return [];
    }

    save() {
        return Promise.resolve(true); // Placeholder for instance method
    }
}
