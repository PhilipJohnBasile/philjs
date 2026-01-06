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
import { extractCode, extractJSON } from '../utils/parser.js';

// ============================================================================
// Types
// ============================================================================

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
  private provider: AIProvider;
  private options: Partial<CompletionOptions>;
  private config: CodingAgentConfig;
  private currentPlan: AgentStep[] = [];
  private generatedFiles: Map<string, string> = new Map();
  private stepCounter = 0;

  constructor(config: CodingAgentConfig) {
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
  async execute(task: AgentTask): Promise<AgentResult> {
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

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.generateResult(false, executionTime, error as Error);
    }
  }

  /**
   * Create execution plan
   */
  private async createPlan(task: AgentTask): Promise<AgentStep[]> {
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

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.options,
      systemPrompt: this.getPlanningSystemPrompt(),
    });

    const parsed = extractJSON<{
      steps: Array<{
        type: string;
        description: string;
        files?: string[];
        dependencies?: string[];
      }>;
      estimatedFiles?: number;
      complexity?: string;
    }>(response);

    planStep.status = 'completed';
    planStep.result = { success: true, output: response };

    if (!parsed?.steps) {
      return this.createDefaultPlan(task);
    }

    return parsed.steps.map((s, i) => this.createStep(
      s.type as AgentStep['type'],
      s.description,
      s.files
    ));
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: AgentStep, task: AgentTask): Promise<void> {
    step.status = 'running';
    this.log(`Executing: ${step.description}`);
    this.config.onProgress?.(
      (this.stepCounter / this.currentPlan.length) * 100,
      step.description
    );

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
    } catch (error) {
      step.status = 'failed';
      step.result = {
        success: false,
        output: '',
        errors: [(error as Error).message],
      };
      throw error;
    }

    this.stepCounter++;
  }

  /**
   * Write file step
   */
  private async executeWriteStep(step: AgentStep, task: AgentTask): Promise<void> {
    const prompt = `Generate code for this step:

Step: ${step.description}
Overall Task: ${task.description}

${task.context?.framework ? `Framework: ${task.context.framework}` : ''}
${task.context?.patterns?.length ? `Follow patterns: ${task.context.patterns.join(', ')}` : ''}

Existing files in project:
${Array.from(this.generatedFiles.entries()).map(([path, content]) =>
      `--- ${path} ---\n${content.slice(0, 500)}...`
    ).join('\n\n')}

Generate complete, production-ready code.

Return JSON:
{
  "files": {
    "path/to/file.ts": "// complete file content"
  },
  "explanation": "What was created and why"
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.options,
      systemPrompt: this.getWritingSystemPrompt(task),
    });

    const parsed = extractJSON<{
      files: Record<string, string>;
      explanation?: string;
    }>(response);

    if (parsed?.files) {
      for (const [path, content] of Object.entries(parsed.files)) {
        this.generatedFiles.set(path, content);
      }
      step.result = {
        success: true,
        output: parsed.explanation || 'Files generated',
        files: new Map(Object.entries(parsed.files)),
      };
    } else {
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
  private async executeReadStep(step: AgentStep, task: AgentTask): Promise<void> {
    const prompt = `Analyze these files for: ${step.description}

Files:
${Array.from(this.generatedFiles.entries()).map(([path, content]) =>
      `--- ${path} ---\n${content}`
    ).join('\n\n')}

Provide analysis:
{
  "findings": ["Finding 1", "Finding 2"],
  "issues": ["Issue 1"],
  "suggestions": ["Suggestion 1"]
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.options,
    });

    step.result = { success: true, output: response };
  }

  /**
   * Test generation step
   */
  private async executeTestStep(step: AgentStep, task: AgentTask): Promise<void> {
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

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.options,
      systemPrompt: 'You are an expert at writing comprehensive tests.',
    });

    const parsed = extractJSON<{ tests: Record<string, string> }>(response);

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
  private async executeVerifyStep(step: AgentStep, task: AgentTask): Promise<void> {
    const prompt = `Verify the generated code meets requirements:

Original Task: ${task.description}

Generated Files:
${Array.from(this.generatedFiles.entries()).map(([path, content]) =>
      `--- ${path} ---\n${content}`
    ).join('\n\n')}

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

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.options,
    });

    const parsed = extractJSON<{
      verified: boolean;
      issues: string[];
      suggestions: string[];
      score: number;
    }>(response);

    step.result = {
      success: parsed?.verified ?? true,
      output: response,
      ...(parsed?.issues !== undefined && { errors: parsed.issues }),
    };
  }

  /**
   * Iterate/improve step
   */
  private async executeIterateStep(step: AgentStep, task: AgentTask): Promise<void> {
    // Find previous issues
    const issues: string[] = [];
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
${Array.from(this.generatedFiles.entries()).map(([path, content]) =>
      `--- ${path} ---\n${content}`
    ).join('\n\n')}

Return JSON with fixed files:
{
  "files": {
    "path/to/file.ts": "// fixed content"
  },
  "fixedIssues": ["Issue 1 fixed", "Issue 2 fixed"]
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.options,
    });

    const parsed = extractJSON<{
      files: Record<string, string>;
      fixedIssues: string[];
    }>(response);

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
  private async think(task: AgentTask, step: AgentStep): Promise<void> {
    const prompt = `Think carefully about this task:

${task.description}

Consider:
1. What are the key requirements?
2. What components/files are needed?
3. What are potential challenges?
4. What patterns should be followed?
5. How should this be structured?

Think step by step and explain your reasoning.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.options,
      temperature: 0.4,
    });

    step.result = { success: true, output: response };
  }

  /**
   * Self-reflect on the work done
   */
  private async selfReflect(task: AgentTask): Promise<void> {
    const reflectStep = this.createStep('think', 'Self-reflecting on generated code');
    this.currentPlan.push(reflectStep);

    const prompt = `Reflect on the code you generated:

Task: ${task.description}

Generated Files:
${Array.from(this.generatedFiles.entries()).map(([path, content]) =>
      `--- ${path} ---\n${content.slice(0, 1000)}`
    ).join('\n\n')}

Self-critique:
1. Does this fully meet the requirements?
2. Is the code clean and maintainable?
3. Are there any bugs or issues?
4. What could be improved?
5. Did I miss anything?

Be honest and thorough.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.options,
      systemPrompt: 'You are reviewing your own work. Be critical and honest.',
    });

    reflectStep.status = 'completed';
    reflectStep.result = { success: true, output: response };
  }

  /**
   * Iteratively improve the code
   */
  private async iterativelyImprove(task: AgentTask): Promise<void> {
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
  private generateResult(success: boolean, executionTimeMs: number, error?: Error): AgentResult {
    const filesCreated = Array.from(this.generatedFiles.keys()).length;
    let linesAdded = 0;

    for (const content of this.generatedFiles.values()) {
      linesAdded += content.split('\n').length;
    }

    const issues: string[] = [];
    const nextSteps: string[] = [];

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
  private createStep(type: AgentStep['type'], description: string, files?: string[]): AgentStep {
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
  private createDefaultPlan(task: AgentTask): AgentStep[] {
    const steps: AgentStep[] = [
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
  private inferFileName(description: string, task: AgentTask): string {
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
  private getPlanningSystemPrompt(): string {
    return `You are an expert software architect and planner.
Create detailed, actionable execution plans for coding tasks.
Break complex tasks into small, manageable steps.
Consider dependencies between steps.
Be thorough but efficient.`;
  }

  /**
   * Get writing system prompt
   */
  private getWritingSystemPrompt(task: AgentTask): string {
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
  private log(message: string): void {
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
export function createCodingAgent(config: CodingAgentConfig): CodingAgent {
  return new CodingAgent(config);
}

/**
 * Execute a quick task
 */
export async function executeTask(
  provider: AIProvider,
  description: string,
  options?: Partial<AgentTask>
): Promise<AgentResult> {
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
