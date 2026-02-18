export interface SearchOptions {
    query?: string;
    filters?: string;
    page?: number;
    hitsPerPage?: number;
    attributesToRetrieve?: string[];
}
export interface AlgoliaHit<T = any> {
    objectID: string;
    _highlightResult?: Record<string, any>;
    [key: string]: any;
}
export declare class AlgoliaAdapter {
    private appId;
    private apiKey;
    constructor(appId: string, apiKey: string);
    index(name: string): {
        search: <T>(query: string, options?: SearchOptions) => Promise<any>;
        saveObjects: (objects: any[]) => Promise<any>;
    };
}
