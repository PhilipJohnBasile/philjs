/**
 * @philjs/ai-agents - smolagents Integration
 *
 * Integration with HuggingFace's smolagents library for building
 * lightweight, efficient AI agents.
 *
 * @see https://huggingface.co/docs/smolagents
 */

export interface SmolAgentConfig {
    /** Model ID from HuggingFace Hub or local path */
    model: string;
    /** HuggingFace API token (required for private models) */
    apiToken?: string;
    /** Custom endpoint URL */
    endpoint?: string;
    /** Tools available to the agent */
    tools?: SmolTool[];
    /** System prompt for the agent */
    systemPrompt?: string;
    /** Maximum number of steps before stopping */
    maxSteps?: number;
    /** Whether to use code execution for tool calls */
    useCodeExecution?: boolean;
    /** Planning strategy */
    planningStrategy?: 'react' | 'cot' | 'simple';
}

export interface SmolTool {
    /** Unique tool name */
    name: string;
    /** Tool description for the agent */
    description: string;
    /** Input parameters schema */
    inputs: Record<string, SmolToolParam>;
    /** Output type */
    outputType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
    /** Tool implementation */
    execute: (params: Record<string, any>) => Promise<any>;
}

export interface SmolToolParam {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required?: boolean;
    default?: any;
    enum?: any[];
}

export interface SmolAgentResponse {
    /** Final answer from the agent */
    answer: string;
    /** Steps taken by the agent */
    steps: SmolAgentStep[];
    /** Total tokens used */
    usage?: { inputTokens: number; outputTokens: number };
}

export interface SmolAgentStep {
    /** Step type: thought, action, observation */
    type: 'thought' | 'action' | 'observation' | 'code';
    /** Content of the step */
    content: string;
    /** Tool called (if action) */
    tool?: string;
    /** Tool input (if action) */
    input?: any;
    /** Tool output (if observation) */
    output?: any;
}

/**
 * Built-in tools that can be used with smolagents
 */
export const SmolTools = {
    /**
     * Web search tool using DuckDuckGo
     */
    webSearch: {
        name: 'web_search',
        description: 'Search the web for information using DuckDuckGo. Returns a list of search results.',
        inputs: {
            query: { type: 'string', description: 'Search query', required: true },
        },
        outputType: 'array',
        execute: async ({ query }: { query: string }) => {
            const response = await fetch(
                `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
            );
            const data = await response.json();
            return data.RelatedTopics?.slice(0, 5).map((topic: any) => ({
                title: topic.Text?.split(' - ')[0] || '',
                snippet: topic.Text || '',
                url: topic.FirstURL || '',
            })) || [];
        },
    } as SmolTool,

    /**
     * HTTP request tool
     */
    httpRequest: {
        name: 'http_request',
        description: 'Make an HTTP request to fetch data from a URL.',
        inputs: {
            url: { type: 'string', description: 'URL to fetch', required: true },
            method: { type: 'string', description: 'HTTP method', default: 'GET' },
        },
        outputType: 'string',
        execute: async ({ url, method = 'GET' }: { url: string; method?: string }) => {
            const response = await fetch(url, { method });
            return response.text();
        },
    } as SmolTool,

    /**
     * Calculator tool
     */
    calculator: {
        name: 'calculator',
        description: 'Evaluate a mathematical expression. Supports basic arithmetic and Math functions.',
        inputs: {
            expression: { type: 'string', description: 'Math expression to evaluate', required: true },
        },
        outputType: 'number',
        execute: async ({ expression }: { expression: string }) => {
            // Safe math evaluation (no eval)
            const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
            // eslint-disable-next-line no-new-func
            return Function(`"use strict"; return (${sanitized})`)();
        },
    } as SmolTool,

    /**
     * JSON parser tool
     */
    jsonParser: {
        name: 'json_parser',
        description: 'Parse a JSON string and optionally extract a value using a JSONPath-like key.',
        inputs: {
            json: { type: 'string', description: 'JSON string to parse', required: true },
            path: { type: 'string', description: 'Dot-notation path to extract (e.g., "data.items[0].name")' },
        },
        outputType: 'any',
        execute: async ({ json, path }: { json: string; path?: string }) => {
            const data = JSON.parse(json);
            if (!path) return data;

            const parts = path.split(/\.|\[|\]/).filter(Boolean);
            let current = data;
            for (const part of parts) {
                current = current[part];
                if (current === undefined) return null;
            }
            return current;
        },
    } as SmolTool,
};

/**
 * HuggingFace smolagents-compatible agent implementation
 */
export class SmolAgent {
    private config: SmolAgentConfig;
    private tools: Map<string, SmolTool>;

    constructor(config: SmolAgentConfig) {
        this.config = {
            maxSteps: 10,
            planningStrategy: 'react',
            useCodeExecution: false,
            ...config,
        };

        this.tools = new Map();
        for (const tool of config.tools || []) {
            this.tools.set(tool.name, tool);
        }
    }

    /**
     * Run the agent with a task
     */
    async run(task: string): Promise<SmolAgentResponse> {
        const steps: SmolAgentStep[] = [];
        let currentTask = task;

        for (let i = 0; i < (this.config.maxSteps || 10); i++) {
            // Generate next action
            const response = await this.generateStep(currentTask, steps);

            if (response.type === 'thought') {
                steps.push(response);
                continue;
            }

            if (response.type === 'action' && response.tool) {
                steps.push(response);

                // Execute tool
                const tool = this.tools.get(response.tool);
                if (tool) {
                    try {
                        const output = await tool.execute(response.input || {});
                        const observation: SmolAgentStep = {
                            type: 'observation',
                            content: typeof output === 'string' ? output : JSON.stringify(output),
                            output,
                        };
                        steps.push(observation);
                    } catch (error) {
                        steps.push({
                            type: 'observation',
                            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        });
                    }
                } else {
                    steps.push({
                        type: 'observation',
                        content: `Tool not found: ${response.tool}`,
                    });
                }
            }

            if (response.type === 'code' && this.config.useCodeExecution) {
                steps.push(response);
                // Code execution would require a sandbox
                steps.push({
                    type: 'observation',
                    content: 'Code execution not available in browser environment',
                });
            }

            // Check if we have a final answer
            if (response.content.includes('Final Answer:')) {
                const answer = response.content.split('Final Answer:')[1]?.trim() || response.content;
                return { answer, steps };
            }
        }

        // Max steps reached
        return {
            answer: 'Max steps reached without finding an answer.',
            steps,
        };
    }

    /**
     * Generate the next step using the LLM
     */
    private async generateStep(task: string, previousSteps: SmolAgentStep[]): Promise<SmolAgentStep> {
        const prompt = this.buildPrompt(task, previousSteps);

        // Call HuggingFace Inference API
        const response = await this.callModel(prompt);

        // Parse the response
        return this.parseResponse(response);
    }

    /**
     * Build the prompt for the LLM
     */
    private buildPrompt(task: string, steps: SmolAgentStep[]): string {
        const toolDescriptions = Array.from(this.tools.values())
            .map(t => `- ${t.name}: ${t.description}\n  Inputs: ${JSON.stringify(t.inputs)}`)
            .join('\n');

        let prompt = this.config.systemPrompt || `You are a helpful AI assistant that can use tools to accomplish tasks.

Available tools:
${toolDescriptions}

When you need to use a tool, respond with:
Action: tool_name
Input: {"param": "value"}

When you have the final answer, respond with:
Final Answer: your answer here

`;

        prompt += `\nTask: ${task}\n\n`;

        // Add previous steps
        for (const step of steps) {
            if (step.type === 'thought') {
                prompt += `Thought: ${step.content}\n`;
            } else if (step.type === 'action') {
                prompt += `Action: ${step.tool}\nInput: ${JSON.stringify(step.input)}\n`;
            } else if (step.type === 'observation') {
                prompt += `Observation: ${step.content}\n`;
            }
        }

        return prompt;
    }

    /**
     * Call the HuggingFace model
     */
    private async callModel(prompt: string): Promise<string> {
        const endpoint = this.config.endpoint ||
            `https://api-inference.huggingface.co/models/${this.config.model}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.config.apiToken) {
            headers['Authorization'] = `Bearer ${this.config.apiToken}`;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 500,
                    temperature: 0.7,
                    do_sample: true,
                    return_full_text: false,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HuggingFace API error: ${error}`);
        }

        const result = await response.json();

        // Handle different response formats
        if (Array.isArray(result)) {
            return result[0]?.generated_text || '';
        }
        return result.generated_text || result.text || '';
    }

    /**
     * Parse the model response into a step
     */
    private parseResponse(response: string): SmolAgentStep {
        const text = response.trim();

        // Check for Final Answer
        if (text.includes('Final Answer:')) {
            return {
                type: 'thought',
                content: text,
            };
        }

        // Check for Action
        const actionMatch = text.match(/Action:\s*(\w+)/);
        const inputMatch = text.match(/Input:\s*(\{[\s\S]*?\})/);

        if (actionMatch) {
            let input: any = {};
            if (inputMatch) {
                try {
                    input = JSON.parse(inputMatch[1]);
                } catch {
                    // Try to extract key-value pairs
                    const pairs = inputMatch[1].match(/["']?(\w+)["']?\s*:\s*["']?([^"',}]+)["']?/g);
                    if (pairs) {
                        for (const pair of pairs) {
                            const [key, value] = pair.split(':').map(s => s.trim().replace(/["']/g, ''));
                            if (key && value) input[key] = value;
                        }
                    }
                }
            }

            return {
                type: 'action',
                content: text,
                tool: actionMatch[1],
                input,
            };
        }

        // Check for code block
        const codeMatch = text.match(/```(?:python|javascript)?\n([\s\S]*?)```/);
        if (codeMatch) {
            return {
                type: 'code',
                content: codeMatch[1],
            };
        }

        // Default to thought
        return {
            type: 'thought',
            content: text,
        };
    }

    /**
     * Add a tool to the agent
     */
    addTool(tool: SmolTool): void {
        this.tools.set(tool.name, tool);
    }

    /**
     * Remove a tool from the agent
     */
    removeTool(name: string): void {
        this.tools.delete(name);
    }

    /**
     * Get all registered tools
     */
    getTools(): SmolTool[] {
        return Array.from(this.tools.values());
    }
}

/**
 * Create a smolagents-compatible agent
 */
export function createSmolAgent(config: SmolAgentConfig): SmolAgent {
    return new SmolAgent(config);
}

/**
 * Create a tool from a function
 */
export function createSmolTool(
    name: string,
    description: string,
    inputs: Record<string, SmolToolParam>,
    execute: (params: Record<string, any>) => Promise<any>,
    outputType: SmolTool['outputType'] = 'any'
): SmolTool {
    return { name, description, inputs, outputType, execute };
}
