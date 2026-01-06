/**
 * @philjs/ai - Azure Promptflow Integration
 *
 * Provides integration with Azure Machine Learning Promptflow for building
 * production-grade LLM applications with prompt orchestration.
 *
 * @see https://microsoft.github.io/promptflow/
 */

export interface PromptflowConfig {
    /** Azure subscription ID */
    subscriptionId: string;
    /** Azure resource group name */
    resourceGroup: string;
    /** Azure ML workspace name */
    workspaceName: string;
    /** Azure authentication credential (optional, uses DefaultAzureCredential if not provided) */
    credential?: AzureCredential;
    /** API version (default: '2024-04-01-preview') */
    apiVersion?: string;
}

export interface AzureCredential {
    getToken(scopes: string | string[]): Promise<{ token: string; expiresOnTimestamp: number }>;
}

export interface FlowInput {
    [key: string]: any;
}

export interface FlowOutput {
    [key: string]: any;
}

export interface FlowRunResult {
    /** Run ID */
    id: string;
    /** Run status */
    status: 'Running' | 'Completed' | 'Failed' | 'Canceled';
    /** Flow outputs */
    output?: FlowOutput;
    /** Error message if failed */
    error?: string;
    /** Run duration in milliseconds */
    duration?: number;
    /** Token usage statistics */
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface FlowDefinition {
    /** Flow name */
    name: string;
    /** Flow description */
    description?: string;
    /** Flow type */
    type: 'standard' | 'chat' | 'evaluation';
    /** Input schema */
    inputs: Record<string, { type: string; default?: any }>;
    /** Output schema */
    outputs: Record<string, { type: string }>;
    /** Flow nodes */
    nodes: FlowNode[];
}

export interface FlowNode {
    /** Node name */
    name: string;
    /** Node type: llm, python, prompt */
    type: 'llm' | 'python' | 'prompt';
    /** Node inputs */
    inputs: Record<string, any>;
    /** Connection name for LLM nodes */
    connection?: string;
    /** Model deployment for LLM nodes */
    deployment?: string;
    /** Prompt template for LLM/prompt nodes */
    prompt?: string;
    /** Python function for python nodes */
    function?: string;
}

/**
 * Azure Promptflow client for running and managing flows
 */
export class PromptflowClient {
    private config: PromptflowConfig;
    private baseUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor(config: PromptflowConfig) {
        this.config = config;
        const apiVersion = config.apiVersion || '2024-04-01-preview';
        this.baseUrl = `https://${config.workspaceName}.api.azureml.ms/flow/api/subscriptions/${config.subscriptionId}/resourceGroups/${config.resourceGroup}/providers/Microsoft.MachineLearningServices/workspaces/${config.workspaceName}`;
    }

    /**
     * Get access token for Azure ML
     */
    private async getToken(): Promise<string> {
        // Check if we have a valid cached token
        if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
            return this.accessToken;
        }

        if (!this.config.credential) {
            throw new Error(
                'PromptflowClient requires Azure credentials.\n' +
                'Please provide a credential implementing getToken():\n\n' +
                '  import { DefaultAzureCredential } from "@azure/identity";\n' +
                '  const client = new PromptflowClient({\n' +
                '    subscriptionId: "...",\n' +
                '    resourceGroup: "...",\n' +
                '    workspaceName: "...",\n' +
                '    credential: new DefaultAzureCredential()\n' +
                '  });'
            );
        }

        const tokenResponse = await this.config.credential.getToken(
            'https://ml.azure.com/.default'
        );

        this.accessToken = tokenResponse.token;
        this.tokenExpiry = tokenResponse.expiresOnTimestamp;

        return this.accessToken;
    }

    /**
     * Make an authenticated request to the Promptflow API
     */
    private async request<T>(
        method: string,
        path: string,
        body?: any
    ): Promise<T> {
        const token = await this.getToken();

        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Promptflow API error (${response.status}): ${error}`);
        }

        return response.json();
    }

    /**
     * Run a flow with the given inputs
     *
     * @param flowName - Name of the flow to run
     * @param inputs - Input values for the flow
     * @returns Flow run result
     */
    async runFlow(flowName: string, inputs: FlowInput): Promise<FlowRunResult> {
        const startTime = Date.now();

        const result = await this.request<{
            run_id: string;
            status: string;
            output?: FlowOutput;
            error?: { message: string };
        }>('POST', `/flows/${flowName}/runs`, {
            inputs,
            run_mode: 'sync',
        });

        return {
            id: result.run_id,
            status: result.status as FlowRunResult['status'],
            output: result.output,
            error: result.error?.message,
            duration: Date.now() - startTime,
        };
    }

    /**
     * Run a flow asynchronously (for long-running flows)
     * Returns immediately with a run ID that can be polled
     */
    async runFlowAsync(flowName: string, inputs: FlowInput): Promise<string> {
        const result = await this.request<{ run_id: string }>(
            'POST',
            `/flows/${flowName}/runs`,
            {
                inputs,
                run_mode: 'async',
            }
        );

        return result.run_id;
    }

    /**
     * Get the status and result of a flow run
     */
    async getRunStatus(flowName: string, runId: string): Promise<FlowRunResult> {
        const result = await this.request<{
            run_id: string;
            status: string;
            output?: FlowOutput;
            error?: { message: string };
            metrics?: { duration_ms: number; tokens: any };
        }>('GET', `/flows/${flowName}/runs/${runId}`);

        return {
            id: result.run_id,
            status: result.status as FlowRunResult['status'],
            output: result.output,
            error: result.error?.message,
            duration: result.metrics?.duration_ms,
            usage: result.metrics?.tokens,
        };
    }

    /**
     * Wait for a flow run to complete
     */
    async waitForRun(
        flowName: string,
        runId: string,
        options: { timeout?: number; pollInterval?: number } = {}
    ): Promise<FlowRunResult> {
        const timeout = options.timeout || 300000; // 5 minutes default
        const pollInterval = options.pollInterval || 1000; // 1 second default
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const result = await this.getRunStatus(flowName, runId);

            if (result.status === 'Completed' || result.status === 'Failed' || result.status === 'Canceled') {
                return result;
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error(`Flow run ${runId} timed out after ${timeout}ms`);
    }

    /**
     * List available flows in the workspace
     */
    async listFlows(): Promise<Array<{ name: string; type: string; description?: string }>> {
        const result = await this.request<{
            value: Array<{ name: string; flow_type: string; description?: string }>;
        }>('GET', '/flows');

        return result.value.map(flow => ({
            name: flow.name,
            type: flow.flow_type,
            description: flow.description,
        }));
    }

    /**
     * Get flow definition
     */
    async getFlow(flowName: string): Promise<FlowDefinition> {
        const result = await this.request<{
            name: string;
            description?: string;
            flow_type: string;
            inputs: Record<string, any>;
            outputs: Record<string, any>;
            nodes: any[];
        }>('GET', `/flows/${flowName}`);

        return {
            name: result.name,
            description: result.description,
            type: result.flow_type as FlowDefinition['type'],
            inputs: result.inputs,
            outputs: result.outputs,
            nodes: result.nodes,
        };
    }

    /**
     * Test a flow with sample inputs
     */
    async testFlow(flowName: string, testInputs: FlowInput[]): Promise<FlowRunResult[]> {
        const results: FlowRunResult[] = [];

        for (const inputs of testInputs) {
            const result = await this.runFlow(flowName, inputs);
            results.push(result);
        }

        return results;
    }
}

/**
 * Run a Promptflow flow from a local YAML definition
 * For development/testing without Azure deployment
 */
export async function runLocalFlow(
    flowPath: string,
    inputs: FlowInput
): Promise<FlowOutput> {
    // Dynamic import for Node.js fs
    const { readFile } = await import('node:fs/promises');
    const { parse } = await import('yaml');

    // Read and parse flow YAML
    const flowYaml = await readFile(flowPath, 'utf-8');
    const flowDef = parse(flowYaml);

    if (!flowDef || !flowDef.nodes) {
        throw new Error(`Invalid flow definition at ${flowPath}`);
    }

    // Execute nodes in order (simplified - real implementation would handle DAG)
    const context: Record<string, any> = { ...inputs };

    for (const node of flowDef.nodes) {
        if (node.type === 'prompt') {
            // Render prompt template
            let prompt = node.prompt || '';
            for (const [key, value] of Object.entries(context)) {
                prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
            }
            context[node.name] = prompt;
        } else if (node.type === 'llm') {
            throw new Error(
                'Local flow execution does not support LLM nodes. ' +
                'Please deploy the flow to Azure ML or mock the LLM responses.'
            );
        } else if (node.type === 'python') {
            throw new Error(
                'Local flow execution does not support Python nodes. ' +
                'Please deploy the flow to Azure ML or implement the logic in TypeScript.'
            );
        }
    }

    // Return outputs
    const outputs: FlowOutput = {};
    if (flowDef.outputs) {
        for (const [key, def] of Object.entries(flowDef.outputs as Record<string, { reference: string }>)) {
            const ref = def.reference?.replace('${', '').replace('}', '');
            if (ref && context[ref] !== undefined) {
                outputs[key] = context[ref];
            }
        }
    }

    return outputs;
}

/**
 * Create a Promptflow client
 */
export function createPromptflowClient(config: PromptflowConfig): PromptflowClient {
    return new PromptflowClient(config);
}

// Legacy export for backwards compatibility
export const runFlow = async (flowPath: string, inputs: FlowInput = {}): Promise<FlowOutput> => {
    console.warn('runFlow() is deprecated. Use runLocalFlow() or PromptflowClient for production.');
    return runLocalFlow(flowPath, inputs);
};
