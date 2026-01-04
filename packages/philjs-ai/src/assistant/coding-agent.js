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
import { extractCode, extractJSON } from '../utils/parser.js';
// ============================================================================
// Coding Agent
// ============================================================================
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
export class CodingAgent {
    provider;
    options;
    config;
    currentPlan = [];
    generatedFiles = new Map();
    stepCounter = 0;
    constructor(config) {
        this.provider = config.provider;
        this.options = {
            temperature: 0.2,
            maxTokens: 8192,
            ...config.completionOptions,
        };
        this.config = config;
    }
    /**
     * Execute a task
     */
    async execute(task) {
        const startTime = Date.now();
        this.generatedFiles = new Map(task.files || []);
        this.currentPlan = [];
        this.stepCounter = 0;
        try {
            // Phase 1: Understand and Plan
            this.log('Phase 1: Understanding and Planning');
            const plan = await this.createPlan(task);
            this.currentPlan = plan;
            // Phase 2: Execute Plan
            this.log('Phase 2: Executing Plan');
            for (const step of plan) {
                await this.executeStep(step, task);
                this.config.onStep?.(step);
            }
            // Phase 3: Self-Reflection (optional)
            if (this.config.selfReflection) {
                this.log('Phase 3: Self-Reflection');
                await this.selfReflect(task);
            }
            // Phase 4: Iterative Improvement (optional)
            if (this.config.iterativeImprovement) {
                this.log('Phase 4: Iterative Improvement');
                await this.iterativelyImprove(task);
            }
            // Generate result
            const executionTime = Date.now() - startTime;
            return this.generateResult(true, executionTime);
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            return this.generateResult(false, executionTime, error);
        }
    }
    /**
     * Create execution plan
     */
    async createPlan(task) {
        const thinkStep = this.createStep('think', 'Analyzing task requirements');
        this.currentPlan.push(thinkStep);
        await this.think(task, thinkStep);
        const planStep = this.createStep('plan', 'Creating execution plan');
        this.currentPlan.push(planStep);
        const prompt = `Create a detailed execution plan for this coding task:

Task: ${task.description}
Type: ${task.type}
${task.context?.framework ? `Framework: ${task.context.framework}` : ''}
${task.context?.dependencies?.length ? `Dependencies: ${task.context.dependencies.join(', ')}` : ''}
${task.constraints ? `Constraints: ${JSON.stringify(task.constraints)}` : ''}

Existing files:
${Array.from(this.generatedFiles.keys()).join('\n')}

Create a step-by-step plan. Each step should be specific and actionable.

Return JSON:
{
  "steps": [
    {
      "type": "write|read|test|verify",
      "description": "What to do",
      "files": ["file1.ts", "file2.ts"],
      "dependencies": ["step-1"]
    }
  ],
  "estimatedFiles": 5,
  "complexity": "low|medium|high"
}`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.options,
            systemPrompt: this.getPlanningSystemPrompt(),
        });
        const parsed = extractJSON(response);
        planStep.status = 'completed';
        planStep.result = { success: true, output: response };
        if (!parsed?.steps) {
            return this.createDefaultPlan(task);
        }
        return parsed.steps.map((s, i) => this.createStep(s.type, s.description, s.files));
    }
    /**
     * Execute a single step
     */
    async executeStep(step, task) {
        step.status = 'running';
        this.log(`Executing: ${step.description}`);
        this.config.onProgress?.((this.stepCounter / this.currentPlan.length) * 100, step.description);
        try {
            switch (step.type) {
                case 'write':
                    await this.executeWriteStep(step, task);
                    break;
                case 'read':
                    await this.executeReadStep(step, task);
                    break;
                case 'test':
                    await this.executeTestStep(step, task);
                    break;
                case 'verify':
                    await this.executeVerifyStep(step, task);
                    break;
                case 'think':
                    await this.think(task, step);
                    break;
                case 'iterate':
                    await this.executeIterateStep(step, task);
                    break;
                default:
                    step.result = { success: true, output: 'Step completed' };
            }
            step.status = 'completed';
        }
        catch (error) {
            step.status = 'failed';
            step.result = {
                success: false,
                output: '',
                errors: [error.message],
            };
            throw error;
        }
        this.stepCounter++;
    }
    /**
     * Write file step
     */
    async executeWriteStep(step, task) {
        const prompt = `Generate code for this step:

Step: ${step.description}
Overall Task: ${task.description}

${task.context?.framework ? `Framework: ${task.context.framework}` : ''}
${task.context?.patterns?.length ? `Follow patterns: ${task.context.patterns.join(', ')}` : ''}

Existing files in project:
${Array.from(this.generatedFiles.entries()).map(([path, content]) => `--- ${path} ---\n${content.slice(0, 500)}...`).join('\n\n')}

Generate complete, production-ready code.

Return JSON:
{
  "files": {
    "path/to/file.ts": "// complete file content"
  },
  "explanation": "What was created and why"
}`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.options,
            systemPrompt: this.getWritingSystemPrompt(task),
        });
        const parsed = extractJSON(response);
        if (parsed?.files) {
            for (const [path, content] of Object.entries(parsed.files)) {
                this.generatedFiles.set(path, content);
            }
            step.result = {
                success: true,
                output: parsed.explanation || 'Files generated',
                files: new Map(Object.entries(parsed.files)),
            };
        }
        else {
            // Try to extract code directly
            const code = extractCode(response);
            if (code) {
                const fileName = this.inferFileName(step.description, task);
                this.generatedFiles.set(fileName, code);
                step.result = {
                    success: true,
                    output: 'Code generated',
                    files: new Map([[fileName, code]]),
                };
            }
        }
    }
    /**
     * Read/analyze step
     */
    async executeReadStep(step, task) {
        const prompt = `Analyze these files for: ${step.description}

Files:
${Array.from(this.generatedFiles.entries()).map(([path, content]) => `--- ${path} ---\n${content}`).join('\n\n')}

Provide analysis:
{
  "findings": ["Finding 1", "Finding 2"],
  "issues": ["Issue 1"],
  "suggestions": ["Suggestion 1"]
}`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.options,
        });
        step.result = { success: true, output: response };
    }
    /**
     * Test generation step
     */
    async executeTestStep(step, task) {
        const prompt = `Generate tests for the code created:

${step.description}

Files to test:
${Array.from(this.generatedFiles.entries())
            .filter(([path]) => !path.includes('.test.') && !path.includes('.spec.'))
            .map(([path, content]) => `--- ${path} ---\n${content}`)
            .join('\n\n')}

Generate comprehensive tests using Vitest.

Return JSON:
{
  "tests": {
    "file.test.ts": "// test code"
  }
}`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.options,
            systemPrompt: 'You are an expert at writing comprehensive tests.',
        });
        const parsed = extractJSON(response);
        if (parsed?.tests) {
            for (const [path, content] of Object.entries(parsed.tests)) {
                this.generatedFiles.set(path, content);
            }
            step.result = {
                success: true,
                output: 'Tests generated',
                files: new Map(Object.entries(parsed.tests)),
            };
        }
    }
    /**
     * Verification step
     */
    async executeVerifyStep(step, task) {
        const prompt = `Verify the generated code meets requirements:

Original Task: ${task.description}

Generated Files:
${Array.from(this.generatedFiles.entries()).map(([path, content]) => `--- ${path} ---\n${content}`).join('\n\n')}

Check for:
1. All requirements met
2. Code quality and best practices
3. Type safety
4. Error handling
5. Edge cases

Return JSON:
{
  "verified": true|false,
  "issues": ["Issue 1"],
  "suggestions": ["Suggestion 1"],
  "score": 0-100
}`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.options,
        });
        const parsed = extractJSON(response);
        step.result = {
            success: parsed?.verified ?? true,
            output: response,
            ...(parsed?.issues !== undefined && { errors: parsed.issues }),
        };
    }
    /**
     * Iterate/improve step
     */
    async executeIterateStep(step, task) {
        // Find previous issues
        const issues = [];
        for (const s of this.currentPlan) {
            if (s.result?.errors) {
                issues.push(...s.result.errors);
            }
        }
        if (issues.length === 0) {
            step.result = { success: true, output: 'No issues to address' };
            return;
        }
        const prompt = `Fix these issues in the code:

Issues:
${issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

Current Files:
${Array.from(this.generatedFiles.entries()).map(([path, content]) => `--- ${path} ---\n${content}`).join('\n\n')}

Return JSON with fixed files:
{
  "files": {
    "path/to/file.ts": "// fixed content"
  },
  "fixedIssues": ["Issue 1 fixed", "Issue 2 fixed"]
}`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.options,
        });
        const parsed = extractJSON(response);
        if (parsed?.files) {
            for (const [path, content] of Object.entries(parsed.files)) {
                this.generatedFiles.set(path, content);
            }
            step.result = {
                success: true,
                output: `Fixed: ${parsed.fixedIssues?.join(', ') || 'issues addressed'}`,
                files: new Map(Object.entries(parsed.files)),
            };
        }
    }
    /**
     * Think/reason step
     */
    async think(task, step) {
        const prompt = `Think carefully about this task:

${task.description}

Consider:
1. What are the key requirements?
2. What components/files are needed?
3. What are potential challenges?
4. What patterns should be followed?
5. How should this be structured?

Think step by step and explain your reasoning.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.options,
            temperature: 0.4,
        });
        step.result = { success: true, output: response };
    }
    /**
     * Self-reflect on the work done
     */
    async selfReflect(task) {
        const reflectStep = this.createStep('think', 'Self-reflecting on generated code');
        this.currentPlan.push(reflectStep);
        const prompt = `Reflect on the code you generated:

Task: ${task.description}

Generated Files:
${Array.from(this.generatedFiles.entries()).map(([path, content]) => `--- ${path} ---\n${content.slice(0, 1000)}`).join('\n\n')}

Self-critique:
1. Does this fully meet the requirements?
2. Is the code clean and maintainable?
3. Are there any bugs or issues?
4. What could be improved?
5. Did I miss anything?

Be honest and thorough.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.options,
            systemPrompt: 'You are reviewing your own work. Be critical and honest.',
        });
        reflectStep.status = 'completed';
        reflectStep.result = { success: true, output: response };
    }
    /**
     * Iteratively improve the code
     */
    async iterativelyImprove(task) {
        const maxIterations = this.config.maxIterations || 3;
        for (let i = 0; i < maxIterations; i++) {
            const verifyStep = this.createStep('verify', `Improvement iteration ${i + 1}`);
            this.currentPlan.push(verifyStep);
            await this.executeVerifyStep(verifyStep, task);
            if (verifyStep.result?.success && !verifyStep.result.errors?.length) {
                break; // Code is good enough
            }
            const iterateStep = this.createStep('iterate', `Addressing issues from iteration ${i + 1}`);
            this.currentPlan.push(iterateStep);
            await this.executeIterateStep(iterateStep, task);
        }
    }
    /**
     * Generate final result
     */
    generateResult(success, executionTimeMs, error) {
        const filesCreated = Array.from(this.generatedFiles.keys()).length;
        let linesAdded = 0;
        for (const content of this.generatedFiles.values()) {
            linesAdded += content.split('\n').length;
        }
        const issues = [];
        const nextSteps = [];
        for (const step of this.currentPlan) {
            if (step.result?.errors) {
                issues.push(...step.result.errors);
            }
        }
        if (error) {
            issues.push(error.message);
        }
        // Generate summary
        const summary = success
            ? `Successfully completed task. Created ${filesCreated} files with ${linesAdded} lines of code.`
            : `Task failed: ${error?.message || 'Unknown error'}`;
        return {
            success,
            files: this.generatedFiles,
            plan: this.currentPlan,
            summary,
            issues,
            nextSteps: [
                'Review generated code',
                'Run tests to verify functionality',
                'Integrate with existing codebase',
            ],
            metrics: {
                totalSteps: this.currentPlan.length,
                completedSteps: this.currentPlan.filter(s => s.status === 'completed').length,
                filesCreated,
                filesModified: 0,
                linesAdded,
                linesRemoved: 0,
                executionTimeMs,
            },
        };
    }
    /**
     * Create a step
     */
    createStep(type, description, files) {
        return {
            id: `step-${++this.stepCounter}`,
            type,
            description,
            status: 'pending',
        };
    }
    /**
     * Create default plan for simple tasks
     */
    createDefaultPlan(task) {
        const steps = [
            this.createStep('think', 'Understanding requirements'),
            this.createStep('write', `Implement ${task.type}: ${task.description}`),
        ];
        if (task.constraints?.testCoverage) {
            steps.push(this.createStep('test', 'Generate tests'));
        }
        steps.push(this.createStep('verify', 'Verify implementation'));
        return steps;
    }
    /**
     * Infer file name from description
     */
    inferFileName(description, task) {
        const words = description.toLowerCase().split(/\s+/);
        const name = words
            .filter(w => w.length > 3)
            .slice(0, 2)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join('');
        const ext = task.context?.framework === 'philjs' ? '.tsx' : '.ts';
        return `src/${name || 'Generated'}${ext}`;
    }
    /**
     * Get planning system prompt
     */
    getPlanningSystemPrompt() {
        return `You are an expert software architect and planner.
Create detailed, actionable execution plans for coding tasks.
Break complex tasks into small, manageable steps.
Consider dependencies between steps.
Be thorough but efficient.`;
    }
    /**
     * Get writing system prompt
     */
    getWritingSystemPrompt(task) {
        const framework = task.context?.framework || 'TypeScript';
        return `You are an expert ${framework} developer.
Generate production-quality, type-safe code.
Follow best practices and established patterns.
Include proper error handling.
Write clean, maintainable code.
${framework === 'philjs' ? `
PhilJS patterns:
- Use signal() for reactive state
- Use memo() for computed values
- Use effect() for side effects
- Components are functions returning JSX
` : ''}`;
    }
    /**
     * Log message if verbose
     */
    log(message) {
        if (this.config.verbose) {
            console.log(`[CodingAgent] ${message}`);
        }
    }
}
// ============================================================================
// Factory Functions
// ============================================================================
/**
 * Create a coding agent
 */
export function createCodingAgent(config) {
    return new CodingAgent(config);
}
/**
 * Execute a quick task
 */
export async function executeTask(provider, description, options) {
    const agent = new CodingAgent({
        provider,
        selfReflection: true,
        iterativeImprovement: true,
    });
    return agent.execute({
        description,
        type: 'feature',
        ...options,
    });
}
//# sourceMappingURL=coding-agent.js.map