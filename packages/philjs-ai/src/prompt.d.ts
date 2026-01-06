export declare class PromptTemplate<Variables extends Record<string, any>> {
    private template;
    constructor(template: string);
    format(variables: Variables): string;
    static fromFile(path: string): PromptTemplate<any>;
}
//# sourceMappingURL=prompt.d.ts.map