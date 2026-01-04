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
// Workflow Engine
// ============================================================================
export class WorkflowEngine {
    workflows = new Map();
    instances = new Map();
    handlers = new Map();
    humanTasks = new Map();
    eventCallbacks = new Map();
    constructor() {
        this.registerBuiltInHandlers();
    }
    registerBuiltInHandlers() {
        // Transform handler
        this.registerHandler('transform', async (input, context) => {
            const node = this.getNodeFromContext(context);
            if (!node?.config.transform)
                return input;
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
            if (!node?.config.webhookUrl)
                return input;
            const response = await fetch(node.config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });
            return response.json();
        });
    }
    getNodeFromContext(context) {
        for (const instance of this.instances.values()) {
            if (instance.id === context.instanceId) {
                const workflow = this.workflows.get(instance.workflowId);
                return workflow?.nodes.find(n => n.id === context.nodeId) ?? null;
            }
        }
        return null;
    }
    registerWorkflow(workflow) {
        this.workflows.set(workflow.id, workflow);
    }
    registerHandler(name, handler) {
        this.handlers.set(name, handler);
    }
    async startWorkflow(workflowId, variables = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        // Initialize variables with defaults
        const initialVariables = {};
        for (const varDef of workflow.variables) {
            initialVariables[varDef.name] = variables[varDef.name] ?? varDef.defaultValue;
        }
        const instance = {
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
    async executeNode(instance, node, input) {
        const workflow = this.workflows.get(instance.workflowId);
        // Add to current nodes
        instance.currentNodes.push(node.id);
        // Record start
        const historyEntry = {
            nodeId: node.id,
            nodeName: node.name,
            status: 'started',
            timestamp: Date.now(),
            input
        };
        instance.history.push(historyEntry);
        this.emit('nodeStarted', instance);
        try {
            let output = input;
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
                    const nextEdge = workflow.edges.find(e => e.source === node.id && e.condition === branch);
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
        }
        catch (error) {
            historyEntry.status = 'failed';
            historyEntry.error = error instanceof Error ? error.message : String(error);
            historyEntry.duration = Date.now() - historyEntry.timestamp;
            instance.status = 'failed';
            instance.error = historyEntry.error;
            this.emit('failed', instance);
        }
    }
    async executeTaskNode(node, input, instance) {
        const handlerName = node.config.handler;
        if (!handlerName)
            return input;
        const handler = this.handlers.get(handlerName);
        if (!handler) {
            throw new Error(`Handler not found: ${handlerName}`);
        }
        const context = {
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
    async evaluateDecision(node, input, instance) {
        const condition = node.config.condition;
        if (!condition)
            return 'default';
        // Simple expression evaluation
        const fn = new Function('input', 'variables', `return ${condition}`);
        const result = fn(input, instance.variables);
        return String(result);
    }
    async executeParallel(instance, node, input) {
        const workflow = this.workflows.get(instance.workflowId);
        const outgoingEdges = workflow.edges.filter(e => e.source === node.id);
        const promises = outgoingEdges.map(async (edge) => {
            const nextNode = workflow.nodes.find(n => n.id === edge.target);
            if (nextNode && nextNode.type !== 'join') {
                await this.executeNode(instance, nextNode, input);
            }
        });
        await Promise.all(promises);
        // Find join node
        const joinNode = workflow.nodes.find(n => n.type === 'join' &&
            workflow.edges.some(e => e.source === node.id && e.target === n.id));
        if (joinNode) {
            await this.executeNode(instance, joinNode, input);
        }
    }
    async createHumanTask(instance, node, _input) {
        const task = {
            id: this.generateId(),
            instanceId: instance.id,
            nodeId: node.id,
            title: node.name,
            description: node.config['description'],
            assignee: node.config['assignee'],
            formFields: node.config['formFields'],
            status: 'pending',
            createdAt: Date.now()
        };
        this.humanTasks.set(task.id, task);
    }
    async executeTransform(node, input, instance) {
        const transform = node.config.transform;
        if (!transform)
            return input;
        const fn = new Function('input', 'variables', `return ${transform}`);
        return fn(input, instance.variables);
    }
    async executeLoop(instance, node, input) {
        const workflow = this.workflows.get(instance.workflowId);
        const condition = node.config.loopCondition;
        let iteration = 0;
        const maxIterations = node.config['maxIterations'] ?? 1000;
        while (iteration < maxIterations) {
            if (condition) {
                const fn = new Function('input', 'variables', 'iteration', `return ${condition}`);
                if (!fn(input, instance.variables, iteration))
                    break;
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
    async completeHumanTask(taskId, result) {
        const task = this.humanTasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = result;
        const instance = this.instances.get(task.instanceId);
        if (!instance)
            return;
        instance.status = 'running';
        // Find the human task node and continue
        const workflow = this.workflows.get(instance.workflowId);
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
    pauseWorkflow(instanceId) {
        const instance = this.instances.get(instanceId);
        if (instance && instance.status === 'running') {
            instance.status = 'paused';
            this.emit('paused', instance);
        }
    }
    resumeWorkflow(instanceId) {
        const instance = this.instances.get(instanceId);
        if (instance && instance.status === 'paused') {
            instance.status = 'running';
            this.emit('resumed', instance);
        }
    }
    cancelWorkflow(instanceId) {
        const instance = this.instances.get(instanceId);
        if (instance && instance.status !== 'completed' && instance.status !== 'cancelled') {
            instance.status = 'cancelled';
            instance.completedAt = Date.now();
            this.emit('cancelled', instance);
        }
    }
    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }
    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }
    getPendingHumanTasks(assignee) {
        const tasks = Array.from(this.humanTasks.values()).filter(t => t.status === 'pending');
        if (assignee) {
            return tasks.filter(t => t.assignee === assignee);
        }
        return tasks;
    }
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
        return () => {
            const callbacks = this.eventCallbacks.get(event);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1)
                    callbacks.splice(index, 1);
            }
        };
    }
    emit(event, instance) {
        const callbacks = this.eventCallbacks.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(instance));
        }
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
// ============================================================================
// Workflow Builder
// ============================================================================
export class WorkflowBuilder {
    workflow;
    nodeCounter = 0;
    constructor(id, name) {
        this.workflow = {
            id,
            name,
            version: '1.0.0',
            nodes: [],
            edges: [],
            variables: []
        };
    }
    addVariable(name, type, defaultValue, required) {
        const varDef = { name, type };
        if (defaultValue !== undefined)
            varDef.defaultValue = defaultValue;
        if (required !== undefined)
            varDef.required = required;
        this.workflow.variables.push(varDef);
        return this;
    }
    addStart(name = 'Start') {
        const id = this.addNode('start', name, {});
        return id;
    }
    addEnd(name = 'End') {
        const id = this.addNode('end', name, {});
        return id;
    }
    addTask(name, handler, config) {
        return this.addNode('task', name, { handler, ...config });
    }
    addDecision(name, condition) {
        return this.addNode('decision', name, { condition });
    }
    addParallel(name) {
        return this.addNode('parallel', name, {});
    }
    addJoin(name) {
        return this.addNode('join', name, {});
    }
    addHumanTask(name, config) {
        return this.addNode('human', name, config);
    }
    addDelay(name, delayMs) {
        return this.addNode('delay', name, { delayMs });
    }
    addLoop(name, loopCondition, maxIterations) {
        return this.addNode('loop', name, { loopCondition, maxIterations });
    }
    addTransform(name, transform) {
        return this.addNode('transform', name, { transform });
    }
    addWebhook(name, webhookUrl) {
        return this.addNode('webhook', name, { webhookUrl });
    }
    addNode(type, name, config) {
        const id = `node-${++this.nodeCounter}`;
        const position = { x: this.nodeCounter * 200, y: 100 };
        this.workflow.nodes.push({ id, type, name, position, config });
        return id;
    }
    connect(source, target, condition, label) {
        const id = `edge-${this.workflow.edges.length + 1}`;
        const edge = { id, source, target };
        if (condition !== undefined)
            edge.condition = condition;
        if (label !== undefined)
            edge.label = label;
        this.workflow.edges.push(edge);
        return this;
    }
    build() {
        return { ...this.workflow };
    }
}
const effectQueue = [];
function useEffect(effect, _deps) {
    effectQueue.push(effect);
}
function useState(initial) {
    let state = initial;
    const setState = (value) => {
        state = typeof value === 'function' ? value(state) : value;
    };
    return [state, setState];
}
function useRef(initial) {
    return { current: initial };
}
function useCallback(fn, _deps) {
    return fn;
}
export function useWorkflowEngine() {
    const engineRef = useRef(new WorkflowEngine());
    const registerWorkflow = useCallback((workflow) => {
        engineRef.current.registerWorkflow(workflow);
    }, []);
    const registerHandler = useCallback((name, handler) => {
        engineRef.current.registerHandler(name, handler);
    }, []);
    const startWorkflow = useCallback(async (workflowId, variables) => {
        return engineRef.current.startWorkflow(workflowId, variables);
    }, []);
    return {
        engine: engineRef.current,
        registerWorkflow,
        registerHandler,
        startWorkflow
    };
}
export function useWorkflowInstance(engine, instanceId) {
    const [instance, setInstance] = useState(null);
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
export function useHumanTasks(engine, assignee) {
    const [tasks, setTasks] = useState([]);
    useEffect(() => {
        const updateTasks = () => {
            setTasks(engine.getPendingHumanTasks(assignee));
        };
        updateTasks();
        const unsubscribe = engine.on('waiting', updateTasks);
        return unsubscribe;
    }, [engine, assignee]);
    const completeTask = useCallback(async (taskId, result) => {
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
//# sourceMappingURL=index.js.map