/**
 * CrewAI-style Multi-Agent Collaboration
 * 
 * Define crews of agents that work together on complex tasks.
 */

import { signal, type Signal } from '@philjs/core';

export interface AgentRole {
    name: string;
    goal: string;
    backstory?: string;
    tools?: string[];
    llmConfig?: LLMConfig;
}

export interface LLMConfig {
    provider: 'openai' | 'anthropic' | 'gemini';
    model: string;
    temperature?: number;
}

export interface Task {
    id: string;
    description: string;
    expectedOutput?: string;
    assignedAgent: string;
    context?: string[];
    dependencies?: string[];
}

export interface CrewConfig {
    agents: AgentRole[];
    tasks: Task[];
    process?: 'sequential' | 'parallel' | 'hierarchical';
    managerAgent?: string;
    memory?: boolean;
    verbose?: boolean;
}

export interface TaskResult {
    taskId: string;
    agentName: string;
    output: string;
    metadata: Record<string, any>;
    duration: number;
}

/**
 * Create a crew of AI agents
 * 
 * @example
 * ```ts
 * const crew = createCrew({
 *   agents: [
 *     { name: 'researcher', goal: 'Find accurate information' },
 *     { name: 'writer', goal: 'Write compelling content' },
 *     { name: 'editor', goal: 'Polish and improve content' },
 *   ],
 *   tasks: [
 *     { id: 'research', description: 'Research the topic', assignedAgent: 'researcher' },
 *     { id: 'write', description: 'Write the article', assignedAgent: 'writer', dependencies: ['research'] },
 *     { id: 'edit', description: 'Edit the article', assignedAgent: 'editor', dependencies: ['write'] },
 *   ],
 *   process: 'sequential',
 * });
 * 
 * const result = await crew.kickoff({ topic: 'AI in 2025' });
 * ```
 */
export function createCrew(config: CrewConfig) {
    const {
        agents,
        tasks,
        process = 'sequential',
        managerAgent,
        memory = true,
        verbose = false,
    } = config;

    // Build agent lookup
    const agentMap = new Map<string, AgentRole>();
    for (const agent of agents) {
        agentMap.set(agent.name, agent);
    }

    // Build task lookup and dependency graph
    const taskMap = new Map<string, Task>();
    const taskDependencies = new Map<string, string[]>();
    for (const task of tasks) {
        taskMap.set(task.id, task);
        taskDependencies.set(task.id, task.dependencies || []);
    }

    // State
    const isRunning = signal(false);
    const currentTask = signal<string | null>(null);
    const results = signal<TaskResult[]>([]);
    const memory_store = signal<Record<string, any>>({});

    async function executeTask(task: Task, context: Record<string, any>): Promise<TaskResult> {
        const agent = agentMap.get(task.assignedAgent);
        if (!agent) {
            throw new Error(`Agent "${task.assignedAgent}" not found`);
        }

        if (verbose) {
            console.log(`[${agent.name}] Starting task: ${task.description}`);
        }

        const startTime = performance.now();

        // Build prompt with context
        const contextStr = task.context?.map((depId) => {
            const depResult = results().find(r => r.taskId === depId);
            return depResult ? `Previous result (${depId}): ${depResult.output}` : '';
        }).join('\n\n') || '';

        // This would call the actual LLM
        // For now, return a placeholder
        const output = `[Simulated output from ${agent.name} for task: ${task.description}]`;

        const duration = performance.now() - startTime;

        return {
            taskId: task.id,
            agentName: agent.name,
            output,
            metadata: { context: contextStr },
            duration,
        };
    }

    async function runSequential(input: Record<string, any>): Promise<TaskResult[]> {
        const allResults: TaskResult[] = [];

        for (const task of tasks) {
            // Wait for dependencies
            const deps = taskDependencies.get(task.id) || [];
            for (const depId of deps) {
                const depResult = allResults.find(r => r.taskId === depId);
                if (!depResult) {
                    throw new Error(`Dependency "${depId}" not completed for task "${task.id}"`);
                }
            }

            currentTask.set(task.id);
            const result = await executeTask(task, { input, previousResults: allResults });
            allResults.push(result);
            results.set([...allResults]);
        }

        return allResults;
    }

    async function runParallel(input: Record<string, any>): Promise<TaskResult[]> {
        const allResults: TaskResult[] = [];
        const completed = new Set<string>();
        const pending = new Set(tasks.map(t => t.id));

        while (pending.size > 0) {
            // Find tasks with all dependencies met
            const ready = [...pending].filter((taskId) => {
                const deps = taskDependencies.get(taskId) || [];
                return deps.every(d => completed.has(d));
            });

            if (ready.length === 0 && pending.size > 0) {
                throw new Error('Circular dependency detected');
            }

            // Execute ready tasks in parallel
            const taskResults = await Promise.all(
                ready.map(async (taskId) => {
                    const task = taskMap.get(taskId)!;
                    return executeTask(task, { input, previousResults: allResults });
                })
            );

            for (const result of taskResults) {
                allResults.push(result);
                completed.add(result.taskId);
                pending.delete(result.taskId);
            }

            results.set([...allResults]);
        }

        return allResults;
    }

    async function kickoff(input: Record<string, any> = {}): Promise<TaskResult[]> {
        isRunning.set(true);
        results.set([]);

        try {
            let allResults: TaskResult[];

            switch (process) {
                case 'parallel':
                    allResults = await runParallel(input);
                    break;
                case 'sequential':
                default:
                    allResults = await runSequential(input);
                    break;
            }

            return allResults;
        } finally {
            isRunning.set(false);
            currentTask.set(null);
        }
    }

    function reset() {
        results.set([]);
        currentTask.set(null);
        isRunning.set(false);
    }

    return {
        kickoff,
        reset,
        agents,
        tasks,
        results: () => results(),
        currentTask: () => currentTask(),
        isRunning: () => isRunning(),
    };
}

export type Crew = ReturnType<typeof createCrew>;
