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
    apiKey?: string;
}

/** LLM API endpoints */
const LLM_ENDPOINTS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
} as const;

/** Call an LLM provider API */
async function callLLM(config: LLMConfig, messages: Array<{ role: string; content: string }>): Promise<string> {
    const apiKey = config.apiKey || getEnvApiKey(config.provider);
    if (!apiKey) {
        throw new Error(`API key not provided for ${config.provider}. Set ${config.provider.toUpperCase()}_API_KEY or pass apiKey in config.`);
    }

    switch (config.provider) {
        case 'openai':
            return callOpenAI(apiKey, config.model, messages, config.temperature);
        case 'anthropic':
            return callAnthropic(apiKey, config.model, messages, config.temperature);
        case 'gemini':
            return callGemini(apiKey, config.model, messages, config.temperature);
        default:
            throw new Error(`Unsupported provider: ${config.provider}`);
    }
}

/** Get API key from environment */
function getEnvApiKey(provider: string): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
        const envMap: Record<string, string> = {
            openai: 'OPENAI_API_KEY',
            anthropic: 'ANTHROPIC_API_KEY',
            gemini: 'GOOGLE_API_KEY',
        };
        return process.env[envMap[provider]];
    }
    return undefined;
}

/** Call OpenAI API */
async function callOpenAI(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature = 0.7
): Promise<string> {
    const response = await fetch(LLM_ENDPOINTS.openai, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/** Call Anthropic API */
async function callAnthropic(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature = 0.7
): Promise<string> {
    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(LLM_ENDPOINTS.anthropic, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: systemMessage?.content,
            messages: conversationMessages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content,
            })),
            temperature,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
}

/** Call Google Gemini API */
async function callGemini(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature = 0.7
): Promise<string> {
    const url = `${LLM_ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`;

    // Convert messages to Gemini format
    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents,
            generationConfig: { temperature },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
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

        // Build context from previous task results
        const previousResultsContext = task.context?.map((depId) => {
            const depResult = results().find(r => r.taskId === depId);
            return depResult ? `Previous result (${depId}): ${depResult.output}` : '';
        }).filter(Boolean).join('\n\n') || '';

        // Build context from dependencies
        const dependencyContext = (context.previousResults as TaskResult[] || [])
            .filter(r => task.dependencies?.includes(r.taskId))
            .map(r => `[${r.agentName}] ${r.output}`)
            .join('\n\n');

        // Build input context
        const inputContext = context.input
            ? `Input provided: ${JSON.stringify(context.input, null, 2)}`
            : '';

        // Memory context
        const memoryContext = memory && memory_store()
            ? `Shared memory: ${JSON.stringify(memory_store())}`
            : '';

        // Build system message with agent persona
        const systemMessage = [
            `You are ${agent.name}.`,
            agent.goal ? `Your goal: ${agent.goal}` : '',
            agent.backstory ? `Your backstory: ${agent.backstory}` : '',
            agent.tools?.length ? `You have access to these tools: ${agent.tools.join(', ')}` : '',
        ].filter(Boolean).join('\n');

        // Build user message with task
        const userMessage = [
            `Task: ${task.description}`,
            task.expectedOutput ? `Expected output format: ${task.expectedOutput}` : '',
            previousResultsContext ? `\n## Previous Results\n${previousResultsContext}` : '',
            dependencyContext ? `\n## Dependency Results\n${dependencyContext}` : '',
            inputContext ? `\n## Context\n${inputContext}` : '',
            memoryContext ? `\n## Shared Memory\n${memoryContext}` : '',
        ].filter(Boolean).join('\n');

        // Get LLM config (use agent's config or default)
        const llmConfig: LLMConfig = agent.llmConfig || {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
        };

        // Build messages array
        const messages = [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage },
        ];

        // Call the LLM
        let output: string;
        try {
            output = await callLLM(llmConfig, messages);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (verbose) {
                console.error(`[${agent.name}] LLM call failed: ${errorMessage}`);
            }
            throw new Error(`Task execution failed for ${task.id}: ${errorMessage}`);
        }

        // Update memory if enabled
        if (memory) {
            memory_store.set({
                ...memory_store(),
                [`task_${task.id}`]: {
                    agent: agent.name,
                    output: output.slice(0, 500), // Store summary
                    timestamp: Date.now(),
                },
            });
        }

        const duration = performance.now() - startTime;

        if (verbose) {
            console.log(`[${agent.name}] Completed task in ${duration.toFixed(0)}ms`);
        }

        return {
            taskId: task.id,
            agentName: agent.name,
            output,
            metadata: {
                context: previousResultsContext,
                llmConfig,
                tokenEstimate: Math.ceil((systemMessage.length + userMessage.length) / 4),
            },
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
