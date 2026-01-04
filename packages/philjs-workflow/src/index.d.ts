/**
 * @philjs/workflow - Visual Workflow Engine
 *
 * Industry-first framework-native workflow system:
 * - Visual workflow builder
 * - Node-based execution graph
 * - Conditional branching
 * - Parallel execution
 * - Human-in-the-loop tasks
 * - Workflow persistence and resumption
 */
export interface WorkflowDefinition {
    id: string;
    name: string;
    version: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables: VariableDefinition[];
    triggers?: TriggerDefinition[];
}
export interface WorkflowNode {
    id: string;
    type: NodeType;
    name: string;
    position: {
        x: number;
        y: number;
    };
    config: NodeConfig;
    inputs?: PortDefinition[];
    outputs?: PortDefinition[];
}
export type NodeType = 'start' | 'end' | 'task' | 'decision' | 'parallel' | 'join' | 'human' | 'delay' | 'loop' | 'subworkflow' | 'webhook' | 'transform';
export interface NodeConfig {
    handler?: string;
    condition?: string;
    timeout?: number;
    retries?: number;
    delayMs?: number;
    loopCondition?: string;
    subworkflowId?: string;
    webhookUrl?: string;
    transform?: string;
    [key: string]: unknown;
}
export interface PortDefinition {
    id: string;
    name: string;
    type: 'data' | 'control';
    dataType?: string;
}
export interface WorkflowEdge {
    id: string;
    source: string;
    sourcePort?: string;
    target: string;
    targetPort?: string;
    condition?: string;
    label?: string;
}
export interface VariableDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    defaultValue?: unknown;
    required?: boolean;
}
export interface TriggerDefinition {
    type: 'manual' | 'schedule' | 'webhook' | 'event';
    config: TriggerConfig;
}
export interface TriggerConfig {
    cron?: string;
    webhookPath?: string;
    eventType?: string;
}
export interface WorkflowInstance {
    id: string;
    workflowId: string;
    status: WorkflowStatus;
    variables: Record<string, unknown>;
    currentNodes: string[];
    history: ExecutionHistoryEntry[];
    startedAt: number;
    completedAt?: number;
    error?: string;
}
export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'waiting' | 'completed' | 'failed' | 'cancelled';
export interface ExecutionHistoryEntry {
    nodeId: string;
    nodeName: string;
    status: 'started' | 'completed' | 'failed' | 'skipped';
    timestamp: number;
    duration?: number;
    input?: unknown;
    output?: unknown;
    error?: string;
}
export interface HumanTask {
    id: string;
    instanceId: string;
    nodeId: string;
    title: string;
    description?: string;
    assignee?: string;
    formFields?: FormField[];
    status: 'pending' | 'completed' | 'cancelled';
    createdAt: number;
    completedAt?: number;
    result?: Record<string, unknown>;
}
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'date';
    required?: boolean;
    options?: Array<{
        label: string;
        value: string;
    }>;
    defaultValue?: unknown;
    validation?: string;
}
export type NodeHandler = (input: Record<string, unknown>, context: ExecutionContext) => Promise<Record<string, unknown>>;
export interface ExecutionContext {
    instanceId: string;
    nodeId: string;
    variables: Record<string, unknown>;
    setVariable: (name: string, value: unknown) => void;
    log: (message: string) => void;
}
export declare class WorkflowEngine {
    private workflows;
    private instances;
    private handlers;
    private humanTasks;
    private eventCallbacks;
    constructor();
    private registerBuiltInHandlers;
    private getNodeFromContext;
    registerWorkflow(workflow: WorkflowDefinition): void;
    registerHandler(name: string, handler: NodeHandler): void;
    startWorkflow(workflowId: string, variables?: Record<string, unknown>): Promise<WorkflowInstance>;
    private executeNode;
    private executeTaskNode;
    private evaluateDecision;
    private executeParallel;
    private createHumanTask;
    private executeTransform;
    private executeLoop;
    completeHumanTask(taskId: string, result: Record<string, unknown>): Promise<void>;
    pauseWorkflow(instanceId: string): void;
    resumeWorkflow(instanceId: string): void;
    cancelWorkflow(instanceId: string): void;
    getInstance(instanceId: string): WorkflowInstance | undefined;
    getWorkflow(workflowId: string): WorkflowDefinition | undefined;
    getPendingHumanTasks(assignee?: string): HumanTask[];
    on(event: 'nodeStarted' | 'completed' | 'failed' | 'waiting' | 'paused' | 'resumed' | 'cancelled', callback: (instance: WorkflowInstance) => void): () => void;
    private emit;
    private generateId;
}
export declare class WorkflowBuilder {
    private workflow;
    private nodeCounter;
    constructor(id: string, name: string);
    addVariable(name: string, type: VariableDefinition['type'], defaultValue?: unknown, required?: boolean): this;
    addStart(name?: string): string;
    addEnd(name?: string): string;
    addTask(name: string, handler: string, config?: Partial<NodeConfig>): string;
    addDecision(name: string, condition: string): string;
    addParallel(name: string): string;
    addJoin(name: string): string;
    addHumanTask(name: string, config: {
        description?: string;
        assignee?: string;
        formFields?: FormField[];
    }): string;
    addDelay(name: string, delayMs: number): string;
    addLoop(name: string, loopCondition: string, maxIterations?: number): string;
    addTransform(name: string, transform: string): string;
    addWebhook(name: string, webhookUrl: string): string;
    private addNode;
    connect(source: string, target: string, condition?: string, label?: string): this;
    build(): WorkflowDefinition;
}
export declare function useWorkflowEngine(): {
    engine: WorkflowEngine;
    registerWorkflow: (workflow: WorkflowDefinition) => void;
    registerHandler: (name: string, handler: NodeHandler) => void;
    startWorkflow: (workflowId: string, variables?: Record<string, unknown>) => Promise<WorkflowInstance>;
};
export declare function useWorkflowInstance(engine: WorkflowEngine, instanceId: string): {
    instance: WorkflowInstance | null;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
};
export declare function useHumanTasks(engine: WorkflowEngine, assignee?: string): {
    tasks: HumanTask[];
    completeTask: (taskId: string, result: Record<string, unknown>) => Promise<void>;
};
declare const _default: {
    WorkflowEngine: typeof WorkflowEngine;
    WorkflowBuilder: typeof WorkflowBuilder;
    useWorkflowEngine: typeof useWorkflowEngine;
    useWorkflowInstance: typeof useWorkflowInstance;
    useHumanTasks: typeof useHumanTasks;
};
export default _default;
//# sourceMappingURL=index.d.ts.map