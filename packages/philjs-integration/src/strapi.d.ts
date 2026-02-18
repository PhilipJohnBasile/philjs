export interface StrapiType {
    kind: 'collectionType' | 'singleType';
    info: {
        singularName: string;
        pluralName: string;
        displayName: string;
    };
    attributes: Record<string, any>;
}
export declare class StrapiClient {
    private apiUrl;
    private token?;
    constructor(apiUrl: string, token?: string);
    find(resource: string, fields?: string[]): Promise<any>;
    findOne(resource: string, id: string, fields?: string[]): Promise<any>;
}
export declare function createStrapiSchema(apiUrl: string, types?: StrapiType[]): string;
