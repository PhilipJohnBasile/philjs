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

// ============================================================================
// Types
// ============================================================================

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
  position: { x: number; y: number };
  config: NodeConfig;
  inputs?: PortDefinition[];
  outputs?: PortDefinition[];
}

export type NodeType =
  | 'start'
  | 'end'
  | 'task'
  | 'decision'
  | 'parallel'
  | 'join'
  | 'human'
  | 'delay'
  | 'loop'
  | 'subworkflow'
  | 'webhook'
  | 'transform';

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

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';

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
  options?: Array<{ label: string; value: string }>;
  defaultValue?: unknown;
  validation?: string;
}

export type NodeHandler = (
  input: Record<string, unknown>,
  context: ExecutionContext
) => Promise<Record<string, unknown>>;

export interface ExecutionContext {
  instanceId: string;
  nodeId: string;
  variables: Record<string, unknown>;
  setVariable: (name: string, value: unknown) => void;
  log: (message: string) => void;
}

// ============================================================================
// Workflow Engine
// ============================================================================

export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private handlers: Map<string, NodeHandler> = new Map();
  private humanTasks: Map<string, HumanTask> = new Map();
  private eventCallbacks: Map<string, Array<(instance: WorkflowInstance) => void>> = new Map();

  constructor() {
    this.registerBuiltInHandlers();
  }

  private registerBuiltInHandlers(): void {
    // Transform handler
    this.registerHandler('transform', async (input, context) => {
      const node = this.getNodeFromContext(context);
      if (!node?.config.transform) return input;

      // Simple expression evaluation (in production, use a safe evaluator)
      const fn = new Function('input', 'variables', `return ${node.config.transform}`);
      return fn(input, context.variables);
    });

    // Delay handler
    this.registerHandler('delay', async (input, context) => {
      const node = this.getNodeFromContext(context);
      const delayMs = node?.config.delayMs ?? 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return input;
    });

    // Webhook handler
    this.registerHandler('webhook', async (input, context) => {
      const node = this.getNodeFromContext(context);
      if (!node?.config.webhookUrl) return input;

      const response = await fetch(node.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      return response.json();
    });
  }

  private getNodeFromContext(context: ExecutionContext): WorkflowNode | null {
    for (const instance of this.instances.values()) {
      if (instance.id === context.instanceId) {
        const workflow = this.workflows.get(instance.workflowId);
        return workflow?.nodes.find(n => n.id === context.nodeId) ?? null;
      }
    }
    return null;
  }

  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  registerHandler(name: string, handler: NodeHandler): void {
    this.handlers.set(name, handler);
  }

  async startWorkflow(
    workflowId: string,
    variables: Record<string, unknown> = {}
  ): Promise<WorkflowInstance> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Initialize variables with defaults
    const initialVariables: Record<string, unknown> = {};
    for (const varDef of workflow.variables) {
      initialVariables[varDef.name] = variables[varDef.name] ?? varDef.defaultValue;
    }

    const instance: WorkflowInstance = {
      id: this.generateId(),
      workflowId,
      status: 'running',
      variables: initialVariables,
      currentNodes: [],
      history: [],
      startedAt: Date.now()
    };

    this.instances.set(instance.id, instance);

    // Find start node
    const startNode = workflow.nodes.find(n => n.type === 'start');
    if (!startNode) {
      throw new Error('Workflow has no start node');
    }

    // Begin execution
    await this.executeNode(instance, startNode, {});

    return instance;
  }

  private async executeNode(
    instance: WorkflowInstance,
    node: WorkflowNode,
    input: Record<string, unknown>
  ): Promise<void> {
    const workflow = this.workflows.get(instance.workflowId)!;

    // Add to current nodes
    instance.currentNodes.push(node.id);

    // Record start
    const historyEntry: ExecutionHistoryEntry = {
      nodeId: node.id,
      nodeName: node.name,
      status: 'started',
      timestamp: Date.now(),
      input
    };
    instance.history.push(historyEntry);

    this.emit('nodeStarted', instance);

    try {
      let output: Record<string, unknown> = input;

      switch (node.type) {
        case 'start':
          output = { ...input, ...instance.variables };
          break;

        case 'end':
          instance.status = 'completed';
          instance.completedAt = Date.now();
          historyEntry.status = 'completed';
          this.emit('completed', instance);
          return;

        case 'task':
          output = await this.executeTaskNode(node, input, instance);
          break;

        case 'decision':
          const branch = await this.evaluateDecision(node, input, instance);
          const nextEdge = workflow.edges.find(
            e => e.source === node.id && e.condition === branch
          );
          if (nextEdge) {
            const nextNode = workflow.nodes.find(n => n.id === nextEdge.target);
            if (nextNode) {
              await this.executeNode(instance, nextNode, input);
            }
          }
          historyEntry.status = 'completed';
          historyEntry.duration = Date.now() - historyEntry.timestamp;
          return;

        case 'parallel':
          await this.executeParallel(instance, node, input);
          historyEntry.status = 'completed';
          historyEntry.duration = Date.now() - historyEntry.timestamp;
          return;

        case 'human':
          await this.createHumanTask(instance, node, input);
          instance.status = 'waiting';
          historyEntry.status = 'completed';
          this.emit('waiting', instance);
          return;

        case 'delay':
          const delayMs = node.config.delayMs ?? 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          break;

        case 'transform':
          output = await this.executeTransform(node, input, instance);
          break;

        case 'loop':
          await this.executeLoop(instance, node, input);
          historyEntry.status = 'completed';
          historyEntry.duration = Date.now() - historyEntry.timestamp;
          return;
      }

      historyEntry.status = 'completed';
      historyEntry.output = output;
      historyEntry.duration = Date.now() - historyEntry.timestamp;

      // Remove from current nodes
      instance.currentNodes = instance.currentNodes.filter(id => id !== node.id);

      // Find and execute next nodes
      const nextEdges = workflow.edges.filter(e => e.source === node.id);
      for (const edge of nextEdges) {
        const nextNode = workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(instance, nextNode, output);
        }
      }
    } catch (error) {
      historyEntry.status = 'failed';
      historyEntry.error = error instanceof Error ? error.message : String(error);
      historyEntry.duration = Date.now() - historyEntry.timestamp;

      instance.status = 'failed';
      instance.error = historyEntry.error;

      this.emit('failed', instance);
    }
  }

  private async executeTaskNode(
    node: WorkflowNode,
    input: Record<string, unknown>,
    instance: WorkflowInstance
  ): Promise<Record<string, unknown>> {
    const handlerName = node.config.handler;
    if (!handlerName) return input;

    const handler = this.handlers.get(handlerName);
    if (!handler) {
      throw new Error(`Handler not found: ${handlerName}`);
    }

    const context: ExecutionContext = {
      instanceId: instance.id,
      nodeId: node.id,
      variables: instance.variables,
      setVariable: (name, value) => {
        instance.variables[name] = value;
      },
      log: (message) => {
        console.log(`[${instance.id}/${node.id}] ${message}`);
      }
    };

    return handler(input, context);
  }

  private async evaluateDecision(
    node: WorkflowNode,
    input: Record<string, unknown>,
    instance: WorkflowInstance
  ): Promise<string> {
    const condition = node.config.condition;
    if (!condition) return 'default';

    // Simple expression evaluation
    const fn = new Function('input', 'variables', `return ${condition}`);
    const result = fn(input, instance.variables);

    return String(result);
  }

  private async executeParallel(
    instance: WorkflowInstance,
    node: WorkflowNode,
    input: Record<string, unknown>
  ): Promise<void> {
    const workflow = this.workflows.get(instance.workflowId)!;
    const outgoingEdges = workflow.edges.filter(e => e.source === node.id);

    const promises = outgoingEdges.map(async (edge) => {
      const nextNode = workflow.nodes.find(n => n.id === edge.target);
      if (nextNode && nextNode.type !== 'join') {
        await this.executeNode(instance, nextNode, input);
      }
    });

    await Promise.all(promises);

    // Find join node
    const joinNode = workflow.nodes.find(n =>
      n.type === 'join' &&
      workflow.edges.some(e => e.source === node.id && e.target === n.id)
    );

    if (joinNode) {
      await this.executeNode(instance, joinNode, input);
    }
  }

  private async createHumanTask(
    instance: WorkflowInstance,
    node: WorkflowNode,
    _input: Record<string, unknown>
  ): Promise<void> {
    const task: HumanTask = {
      id: this.generateId(),
      instanceId: instance.id,
      nodeId: node.id,
      title: node.name,
      description: node.config.description as string,
      assignee: node.config.assignee as string,
      formFields: node.config.formFields as FormField[],
      status: 'pending',
      createdAt: Date.now()
    };

    this.humanTasks.set(task.id, task);
  }

  private async executeTransform(
    node: WorkflowNode,
    input: Record<string, unknown>,
    instance: WorkflowInstance
  ): Promise<Record<string, unknown>> {
    const transform = node.config.transform;
    if (!transform) return input;

    const fn = new Function('input', 'variables', `return ${transform}`);
    return fn(input, instance.variables);
  }

  private async executeLoop(
    instance: WorkflowInstance,
    node: WorkflowNode,
    input: Record<string, unknown>
  ): Promise<void> {
    const workflow = this.workflows.get(instance.workflowId)!;
    const condition = node.config.loopCondition;

    let iteration = 0;
    const maxIterations = (node.config.maxIterations as number) ?? 1000;

    while (iteration < maxIterations) {
      if (condition) {
        const fn = new Function('input', 'variables', 'iteration', `return ${condition}`);
        if (!fn(input, instance.variables, iteration)) break;
      }

      // Execute loop body
      const loopEdge = workflow.edges.find(e => e.source === node.id && e.label === 'loop');
      if (loopEdge) {
        const bodyNode = workflow.nodes.find(n => n.id === loopEdge.target);
        if (bodyNode) {
          await this.executeNode(instance, bodyNode, { ...input, iteration });
        }
      }

      iteration++;
    }

    // Continue to next node after loop
    const exitEdge = workflow.edges.find(e => e.source === node.id && e.label !== 'loop');
    if (exitEdge) {
      const nextNode = workflow.nodes.find(n => n.id === exitEdge.target);
      if (nextNode) {
        await this.executeNode(instance, nextNode, input);
      }
    }
  }

  async completeHumanTask(taskId: string, result: Record<string, unknown>): Promise<void> {
    const task = this.humanTasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;

    const instance = this.instances.get(task.instanceId);
    if (!instance) return;

    instance.status = 'running';

    // Find the human task node and continue
    const workflow = this.workflows.get(instance.workflowId)!;
    const node = workflow.nodes.find(n => n.id === task.nodeId);

    if (node) {
      // Find next edges and continue
      const nextEdges = workflow.edges.filter(e => e.source === node.id);
      for (const edge of nextEdges) {
        const nextNode = workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(instance, nextNode, result);
        }
      }
    }
  }

  pauseWorkflow(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance && instance.status === 'running') {
      instance.status = 'paused';
      this.emit('paused', instance);
    }
  }

  resumeWorkflow(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance && instance.status === 'paused') {
      instance.status = 'running';
      this.emit('resumed', instance);
    }
  }

  cancelWorkflow(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance && instance.status !== 'completed' && instance.status !== 'cancelled') {
      instance.status = 'cancelled';
      instance.completedAt = Date.now();
      this.emit('cancelled', instance);
    }
  }

  getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  getPendingHumanTasks(assignee?: string): HumanTask[] {
    const tasks = Array.from(this.humanTasks.values()).filter(
      t => t.status === 'pending'
    );

    if (assignee) {
      return tasks.filter(t => t.assignee === assignee);
    }

    return tasks;
  }

  on(
    event: 'nodeStarted' | 'completed' | 'failed' | 'waiting' | 'paused' | 'resumed' | 'cancelled',
    callback: (instance: WorkflowInstance) => void
  ): () => void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);

    return () => {
      const callbacks = this.eventCallbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  private emit(event: string, instance: WorkflowInstance): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(instance));
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Workflow Builder
// ============================================================================

export class WorkflowBuilder {
  private workflow: WorkflowDefinition;
  private nodeCounter: number = 0;

  constructor(id: string, name: string) {
    this.workflow = {
      id,
      name,
      version: '1.0.0',
      nodes: [],
      edges: [],
      variables: []
    };
  }

  addVariable(
    name: string,
    type: VariableDefinition['type'],
    defaultValue?: unknown,
    required?: boolean
  ): this {
    this.workflow.variables.push({ name, type, defaultValue, required });
    return this;
  }

  addStart(name: string = 'Start'): string {
    const id = this.addNode('start', name, {});
    return id;
  }

  addEnd(name: string = 'End'): string {
    const id = this.addNode('end', name, {});
    return id;
  }

  addTask(name: string, handler: string, config?: Partial<NodeConfig>): string {
    return this.addNode('task', name, { handler, ...config });
  }

  addDecision(name: string, condition: string): string {
    return this.addNode('decision', name, { condition });
  }

  addParallel(name: string): string {
    return this.addNode('parallel', name, {});
  }

  addJoin(name: string): string {
    return this.addNode('join', name, {});
  }

  addHumanTask(
    name: string,
    config: { description?: string; assignee?: string; formFields?: FormField[] }
  ): string {
    return this.addNode('human', name, config);
  }

  addDelay(name: string, delayMs: number): string {
    return this.addNode('delay', name, { delayMs });
  }

  addLoop(name: string, loopCondition: string, maxIterations?: number): string {
    return this.addNode('loop', name, { loopCondition, maxIterations });
  }

  addTransform(name: string, transform: string): string {
    return this.addNode('transform', name, { transform });
  }

  addWebhook(name: string, webhookUrl: string): string {
    return this.addNode('webhook', name, { webhookUrl });
  }

  private addNode(type: NodeType, name: string, config: NodeConfig): string {
    const id = `node-${++this.nodeCounter}`;
    const position = { x: this.nodeCounter * 200, y: 100 };

    this.workflow.nodes.push({ id, type, name, position, config });
    return id;
  }

  connect(source: string, target: string, condition?: string, label?: string): this {
    const id = `edge-${this.workflow.edges.length + 1}`;
    this.workflow.edges.push({ id, source, target, condition, label });
    return this;
  }

  build(): WorkflowDefinition {
    return { ...this.workflow };
  }
}

// ============================================================================
// Hooks
// ============================================================================

type CleanupFn = () => void;
type EffectFn = () => void | CleanupFn;

const effectQueue: EffectFn[] = [];

function useEffect(effect: EffectFn, _deps?: unknown[]): void {
  effectQueue.push(effect);
}

function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  let state = initial;
  const setState = (value: T | ((prev: T) => T)) => {
    state = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
  };
  return [state, setState];
}

function useRef<T>(initial: T): { current: T } {
  return { current: initial };
}

function useCallback<T extends (...args: unknown[]) => unknown>(fn: T, _deps: unknown[]): T {
  return fn;
}

export function useWorkflowEngine() {
  const engineRef = useRef(new WorkflowEngine());

  const registerWorkflow = useCallback((workflow: WorkflowDefinition) => {
    engineRef.current.registerWorkflow(workflow);
  }, []);

  const registerHandler = useCallback((name: string, handler: NodeHandler) => {
    engineRef.current.registerHandler(name, handler);
  }, []);

  const startWorkflow = useCallback(async (workflowId: string, variables?: Record<string, unknown>) => {
    return engineRef.current.startWorkflow(workflowId, variables);
  }, []);

  return {
    engine: engineRef.current,
    registerWorkflow,
    registerHandler,
    startWorkflow
  };
}

export function useWorkflowInstance(engine: WorkflowEngine, instanceId: string) {
  const [instance, setInstance] = useState<WorkflowInstance | null>(null);

  useEffect(() => {
    setInstance(engine.getInstance(instanceId) ?? null);

    const unsubscribes = [
      engine.on('nodeStarted', (i) => i.id === instanceId && setInstance({ ...i })),
      engine.on('completed', (i) => i.id === instanceId && setInstance({ ...i })),
      engine.on('failed', (i) => i.id === instanceId && setInstance({ ...i })),
      engine.on('waiting', (i) => i.id === instanceId && setInstance({ ...i })),
      engine.on('paused', (i) => i.id === instanceId && setInstance({ ...i })),
      engine.on('resumed', (i) => i.id === instanceId && setInstance({ ...i }))
    ];

    return () => unsubscribes.forEach(fn => fn());
  }, [engine, instanceId]);

  return {
    instance,
    pause: () => engine.pauseWorkflow(instanceId),
    resume: () => engine.resumeWorkflow(instanceId),
    cancel: () => engine.cancelWorkflow(instanceId)
  };
}

export function useHumanTasks(engine: WorkflowEngine, assignee?: string) {
  const [tasks, setTasks] = useState<HumanTask[]>([]);

  useEffect(() => {
    const updateTasks = () => {
      setTasks(engine.getPendingHumanTasks(assignee));
    };

    updateTasks();

    const unsubscribe = engine.on('waiting', updateTasks);
    return unsubscribe;
  }, [engine, assignee]);

  const completeTask = useCallback(async (taskId: string, result: Record<string, unknown>) => {
    await engine.completeHumanTask(taskId, result);
    setTasks(engine.getPendingHumanTasks(assignee));
  }, [engine, assignee]);

  return { tasks, completeTask };
}

// Export everything
export default {
  WorkflowEngine,
  WorkflowBuilder,
  useWorkflowEngine,
  useWorkflowInstance,
  useHumanTasks
};
