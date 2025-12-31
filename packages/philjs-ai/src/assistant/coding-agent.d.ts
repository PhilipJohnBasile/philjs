/**
 * Agentic Coding Agent
 *
 * A sophisticated AI agent that can autonomously:
 * - Plan and execute multi-step coding tasks
 * - Create entire features from descriptions
 * - Refactor codebases across multiple files
 * - Generate tests and documentation
 * - Self-correct and iterate on solutions
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Task definition for the agent
 */
export interface AgentTask {
    /** Task description */
    description: string;
    /** Task type */
    type: 'feature' | 'refactor' | 'fix' | 'test' | 'document' | 'optimize' | 'migrate';
    /** Files to work with */
    files?: Map<string, string>;
    /** Constraints */
    constraints?: TaskConstraints;
    /** Context */
    context?: TaskContext;
}
export interface TaskConstraints {
    /** Maximum files to create/modify */
    maxFiles?: number;
    /** Maximum steps */
    maxSteps?: number;
    /** Time limit in ms */
    timeLimit?: number;
    /** Preserve existing patterns */
    preservePatterns?: boolean;
    /** Required test coverage */
    testCoverage?: number;
}
export interface TaskContext {
    /** Project structure */
    projectStructure?: string[];
    /** Existing patterns to follow */
    patterns?: string[];
    /** Dependencies available */
    dependencies?: string[];
    /** Framework */
    framework?: string;
    /** Additional instructions */
    instructions?: string;
}
/**
 * Step in the agent's execution plan
 */
export interface AgentStep {
    id: string;
    type: 'think' | 'plan' | 'write' | 'read' | 'test' | 'verify' | 'iterate';
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: StepResult;
    children?: AgentStep[];
}
export interface StepResult {
    success: boolean;
    output: string;
    files?: Map<string, string>;
    errors?: string[];
    metrics?: Record<string, number>;
}
/**
 * Agent execution result
 */
export interface AgentResult {
    success: boolean;
    /** Generated/modified files */
    files: Map<string, string>;
    /** Execution plan */
    plan: AgentStep[];
    /** Summary of what was done */
    summary: string;
    /** Any issues encountered */
    issues: string[];
    /** Suggestions for next steps */
    nextSteps: string[];
    /** Metrics */
    metrics: {
        totalSteps: number;
        completedSteps: number;
        filesCreated: number;
        filesModified: number;
        linesAdded: number;
        linesRemoved: number;
        executionTimeMs: number;
    };
}
/**
 * Agent configuration
 */
export interface CodingAgentConfig {
    provider: AIProvider;
    completionOptions?: Partial<CompletionOptions>;
    /** Enable self-reflection */
    selfReflection?: boolean;
    /** Enable iterative improvement */
    iterativeImprovement?: boolean;
    /** Maximum iterations for improvement */
    maxIterations?: number;
    /** Verbose logging */
    verbose?: boolean;
    /** On step callback */
    onStep?: (step: AgentStep) => void;
    /** On progress callback */
    onProgress?: (progress: number, message: string) => void;
}
/**
 * Agentic Coding Agent
 *
 * Autonomously plans and executes complex coding tasks.
 *
 * @example
 * ```typescript
 * const agent = new CodingAgent({
 *   provider: createAnthropicProvider({ apiKey: 'sk-...' }),
 *   selfReflection: true,
 *   verbose: true,
 * });
 *
 * const result = await agent.execute({
 *   description: 'Create a complete user authentication system with login, register, and password reset',
 *   type: 'feature',
 *   context: {
 *     framework: 'philjs',
 *     dependencies: ['zod', 'bcrypt', 'jsonwebtoken'],
 *   },
 * });
 *
 * // result.files contains all generated files
 * // result.plan shows the execution steps
 * ```
 */
export declare class CodingAgent {
    private provider;
    private options;
    private config;
    private currentPlan;
    private generatedFiles;
    private stepCounter;
    constructor(config: CodingAgentConfig);
    /**
     * Execute a task
     */
    execute(task: AgentTask): Promise<AgentResult>;
    /**
     * Create execution plan
     */
    private createPlan;
    /**
     * Execute a single step
     */
    private executeStep;
    /**
     * Write file step
     */
    private executeWriteStep;
    /**
     * Read/analyze step
     */
    private executeReadStep;
    /**
     * Test generation step
     */
    private executeTestStep;
    /**
     * Verification step
     */
    private executeVerifyStep;
    /**
     * Iterate/improve step
     */
    private executeIterateStep;
    /**
     * Think/reason step
     */
    private think;
    /**
     * Self-reflect on the work done
     */
    private selfReflect;
    /**
     * Iteratively improve the code
     */
    private iterativelyImprove;
    /**
     * Generate final result
     */
    private generateResult;
    /**
     * Create a step
     */
    private createStep;
    /**
     * Create default plan for simple tasks
     */
    private createDefaultPlan;
    /**
     * Infer file name from description
     */
    private inferFileName;
    /**
     * Get planning system prompt
     */
    private getPlanningSystemPrompt;
    /**
     * Get writing system prompt
     */
    private getWritingSystemPrompt;
    /**
     * Log message if verbose
     */
    private log;
}
/**
 * Create a coding agent
 */
export declare function createCodingAgent(config: CodingAgentConfig): CodingAgent;
/**
 * Execute a quick task
 */
export declare function executeTask(provider: AIProvider, description: string, options?: Partial<AgentTask>): Promise<AgentResult>;
//# sourceMappingURL=coding-agent.d.ts.map