export interface BackboneModel {
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    attributes: Record<string, any>;
    set(key: string, val: any): void;
    cid: string;
    toJSON(): any;
}
export interface BackboneCollection {
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    models: BackboneModel[];
    toJSON(): any[];
}
export declare function useBackboneModel<T>(model: BackboneModel): any;
export declare function useBackboneCollection<T>(collection: BackboneCollection): any;
//# sourceMappingURL=backbone.d.ts.map