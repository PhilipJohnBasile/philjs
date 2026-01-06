export interface RequestConfig {
    baseUrl?: string;
    headers?: Record<string, string>;
}
export declare class Relation<T = any> {
    private config;
    private conditions;
    private sorts;
    private limitValue?;
    private resourceName;
    constructor(resourceName: string, config?: RequestConfig);
    where(conditions: Record<string, any>): this;
    order(field: string, dir?: 'asc' | 'desc'): this;
    limit(count: number): this;
    toArray(): Promise<T[]>;
    first(): Promise<T | null>;
}
export declare class ActiveRecordWrapper {
    static config: RequestConfig;
    static resource: string;
    static configure(config: RequestConfig): void;
    static find(id: number | string): Promise<any>;
    static where(conditions: Record<string, any>): Relation<any>;
    /**
     * AI-Power: Ask for data using natural language using PhilJS Nexus AI
     */
    static ask(naturalLanguageQuery: string): Promise<any[] | Relation<any>>;
    save(): Promise<boolean>;
}
//# sourceMappingURL=active-record.d.ts.map