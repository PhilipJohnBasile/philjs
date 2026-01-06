export class PromptTemplate {
    template;
    constructor(template) {
        this.template = template;
    }
    format(variables) {
        return this.template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            if (key in variables) {
                return String(variables[key]);
            }
            console.warn(`PromptTemplate: Missing variable "${key}"`);
            return `{{${key}}}`;
        });
    }
    static fromFile(path) {
        console.log(`PromptTemplate: Loading from ${path}`);
        return new PromptTemplate('Mock template loaded from file');
    }
}
//# sourceMappingURL=prompt.js.map