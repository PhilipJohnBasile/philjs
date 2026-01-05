
export interface KernelFunction {
    name: string;
    description: string;
    invoke: (context: any) => Promise<string>;
}

export class SemanticKernelBridge {
    private functions: Map<string, KernelFunction> = new Map();
    private plugins: Map<string, any> = new Map();

    constructor(private kernelConfig?: any) { }

    registerFunction(pluginName: string, func: KernelFunction) {
        const key = `${pluginName}.${func.name}`;
        this.functions.set(key, func);
    }

    async invoke(pluginName: string, functionName: string, context: any = {}): Promise<string> {
        const key = `${pluginName}.${functionName}`;
        const func = this.functions.get(key);
        if (!func) {
            throw new Error(`Function ${key} not found in Semantic Kernel.`);
        }
        return func.invoke(context);
    }

    importPlugin(name: string, plugin: any) {
        this.plugins.set(name, plugin);

        // Reflect on plugin methods to auto-register functions
        const prototype = Object.getPrototypeOf(plugin);
        const methods = Object.getOwnPropertyNames(prototype)
            .filter(method => method !== 'constructor' && typeof plugin[method] === 'function');

        for (const methodName of methods) {
            const method = plugin[methodName].bind(plugin);
            const description = method.description || `Function ${methodName} from plugin ${name}`;

            this.registerFunction(name, {
                name: methodName,
                description,
                invoke: async (context: any) => {
                    const result = await method(context);
                    return typeof result === 'string' ? result : JSON.stringify(result);
                },
            });
        }
    }
}
