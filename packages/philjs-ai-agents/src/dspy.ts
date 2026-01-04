/**
 * PhilJS DSPy Patterns
 * 
 * DSPy-style declarative LLM programming.
 */

import { signal } from '@philjs/core';

export interface Signature {
    name: string;
    description: string;
    inputs: string[];
    outputs: string[];
}

export interface Module {
    signature: Signature;
    forward: (inputs: Record<string, any>) => Promise<Record<string, any>>;
}

/** Create a signature (like DSPy's @signature) */
export function signature(template: string): Signature {
    const [inputs, outputs] = template.split('->').map(s => s.trim());
    return {
        name: template,
        description: '',
        inputs: inputs.split(',').map(s => s.trim()),
        outputs: outputs.split(',').map(s => s.trim()),
    };
}

/** ChainOfThought module */
export function chainOfThought(sig: Signature, llm: (prompt: string) => Promise<string>): Module {
    return {
        signature: sig,
        forward: async (inputs) => {
            const prompt = `
Given: ${sig.inputs.map(i => `${i}: ${inputs[i]}`).join(', ')}
Let's think step by step to produce: ${sig.outputs.join(', ')}
`;
            const response = await llm(prompt);
            // Parse response into outputs
            const outputs: Record<string, any> = {};
            sig.outputs.forEach(o => { outputs[o] = response; });
            return outputs;
        }
    };
}

/** Predict module (simple forward pass) */
export function predict(sig: Signature, llm: (prompt: string) => Promise<string>): Module {
    return {
        signature: sig,
        forward: async (inputs) => {
            const prompt = `${sig.inputs.map(i => `${i}: ${inputs[i]}`).join('\n')}\n\nOutput ${sig.outputs.join(', ')}:`;
            const response = await llm(prompt);
            const outputs: Record<string, any> = {};
            sig.outputs.forEach(o => { outputs[o] = response; });
            return outputs;
        }
    };
}

/** Compose modules sequentially */
export function sequential(...modules: Module[]): Module {
    return {
        signature: {
            name: 'sequential',
            description: 'Sequential composition',
            inputs: modules[0].signature.inputs,
            outputs: modules[modules.length - 1].signature.outputs,
        },
        forward: async (inputs) => {
            let current = inputs;
            for (const mod of modules) {
                current = await mod.forward(current);
            }
            return current;
        }
    };
}

/** Hook to use a DSPy module */
export function useDSPy(module: Module) {
    const result = signal<Record<string, any> | null>(null);
    const loading = signal(false);

    const run = async (inputs: Record<string, any>) => {
        loading.set(true);
        const output = await module.forward(inputs);
        result.set(output);
        loading.set(false);
        return output;
    };

    return { result, loading, run };
}
