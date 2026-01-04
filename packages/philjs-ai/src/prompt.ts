
export class PromptTemplate<Variables extends Record<string, any>> {
    constructor(private template: string) { }

    format(variables: Variables): string {
        return this.template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            if (key in variables) {
                return String(variables[key]);
            }
            console.warn(`PromptTemplate: Missing variable "${key}"`);
            return `{{${key}}}`;
        });
    }

    static fromFile(path: string): PromptTemplate<any> {
        console.log(`PromptTemplate: Loading from ${path}`);
        return new PromptTemplate('Mock template loaded from file');
    }
}
