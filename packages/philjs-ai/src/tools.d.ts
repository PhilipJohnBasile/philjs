/**
 * PhilJS AI - Tool Calling System
 *
 * Define and execute tools that can be called by AI models.
 */
import type { ToolDefinition, ToolCall } from './types.js';
export interface ToolBuilder {
    name: string;
    description: string;
    parameters: Record<string, ParameterDef>;
    handler?: (args: Record<string, any>) => Promise<any>;
}
export interface ParameterDef {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required?: boolean;
    enum?: string[];
    items?: ParameterDef;
    properties?: Record<string, ParameterDef>;
}
export declare function tool(builder: ToolBuilder): ToolDefinition;
/**
 * Web search tool
 */
export declare const webSearchTool: ToolDefinition;
/**
 * Calculator tool
 */
export declare const calculatorTool: ToolDefinition;
/**
 * Weather tool
 */
export declare const weatherTool: ToolDefinition;
/**
 * Code execution tool (sandboxed)
 */
export declare const codeExecutionTool: ToolDefinition;
/**
 * File read tool
 */
export declare const fileReadTool: ToolDefinition;
export declare class ToolExecutor {
    private tools;
    register(tool: ToolDefinition): void;
    registerAll(tools: ToolDefinition[]): void;
    execute(toolCall: ToolCall): Promise<any>;
    executeAll(toolCalls: ToolCall[]): Promise<Map<string, any>>;
    getToolDefinitions(): ToolDefinition[];
    toOpenAIFormat(): any[];
    toAnthropicFormat(): any[];
}
export interface AgentConfig {
    name: string;
    description: string;
    systemPrompt: string;
    tools: ToolDefinition[];
    maxIterations?: number;
}
export interface AgentStep {
    type: 'thought' | 'action' | 'observation' | 'final_answer';
    content: string;
    toolCall?: ToolCall;
    toolResult?: any;
}
export declare class Agent {
    private config;
    private executor;
    constructor(config: AgentConfig);
    run(input: string, onStep?: (step: AgentStep) => void): Promise<string>;
}
export declare function createTool(name: string, description: string, parameters: Record<string, ParameterDef>, handler: (args: Record<string, any>) => Promise<any>): ToolDefinition;
export declare function createAgent(config: AgentConfig): Agent;
//# sourceMappingURL=tools.d.ts.map