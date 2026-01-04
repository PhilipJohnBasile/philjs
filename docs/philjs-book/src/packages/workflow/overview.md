# @philjs/workflow

Visual workflow engine with node-based execution, human-in-the-loop tasks, conditional branching, and parallel processing.

## Installation

```bash
npm install @philjs/workflow
```

## Features

- **Node-Based Workflows** - Visual DAG execution engine
- **Multiple Node Types** - Task, decision, parallel, human, delay, loop
- **Human Tasks** - Human-in-the-loop approvals and inputs
- **Conditional Logic** - Branch workflows based on conditions
- **Parallel Execution** - Run branches concurrently
- **Persistence** - Resume workflows after restart
- **Visual Builder** - Fluent API for workflow definition

## Quick Start

```typescript
import { WorkflowEngine, WorkflowBuilder } from '@philjs/workflow';

// Define workflow
const orderWorkflow = new WorkflowBuilder('order-processing')
  .start()
  .task('validate', async (ctx) => {
    const isValid = await validateOrder(ctx.data.order);
    return { ...ctx.data, isValid };
  })
  .decision('check-valid', {
    condition: (ctx) => ctx.data.isValid,
    onTrue: 'process-payment',
    onFalse: 'reject-order',
  })
  .task('process-payment', async (ctx) => {
    const payment = await chargeCard(ctx.data.order);
    return { ...ctx.data, paymentId: payment.id };
  })
  .task('reject-order', async (ctx) => {
    await notifyRejection(ctx.data.order);
    return ctx.data;
  })
  .human('approval', {
    title: 'Approve Large Order',
    condition: (ctx) => ctx.data.order.total > 10000,
    assignee: 'manager@company.com',
    fields: [
      { name: 'approved', type: 'boolean', required: true },
      { name: 'notes', type: 'text' },
    ],
  })
  .task('fulfill', async (ctx) => {
    await fulfillOrder(ctx.data.order);
    return { ...ctx.data, status: 'fulfilled' };
  })
  .end()
  .build();

// Create engine
const engine = new WorkflowEngine();
await engine.register(orderWorkflow);

// Start workflow instance
const instance = await engine.start('order-processing', {
  order: { id: 'order-123', total: 15000, items: [...] },
});

// Monitor progress
instance.on('nodeCompleted', (node, result) => {
  console.log(`Completed: ${node.id}`, result);
});

instance.on('completed', (result) => {
  console.log('Workflow completed:', result);
});
```

## WorkflowBuilder

### Basic Nodes

```typescript
import { WorkflowBuilder } from '@philjs/workflow';

const workflow = new WorkflowBuilder('my-workflow')
  // Start node (required)
  .start()

  // Task node - execute async function
  .task('fetch-data', async (ctx) => {
    const data = await fetchData(ctx.data.id);
    return { ...ctx.data, fetchedData: data };
  })

  // Transform node - sync data transformation
  .transform('process', (ctx) => ({
    ...ctx.data,
    processed: ctx.data.fetchedData.map(transform),
  }))

  // End node (required)
  .end()

  .build();
```

### Decision Nodes

```typescript
const workflow = new WorkflowBuilder('conditional')
  .start()

  // Binary decision
  .decision('check-amount', {
    condition: (ctx) => ctx.data.amount > 100,
    onTrue: 'large-order',
    onFalse: 'small-order',
  })

  .task('large-order', async (ctx) => ({
    ...ctx.data,
    discount: 0.1,
  }))

  .task('small-order', async (ctx) => ({
    ...ctx.data,
    discount: 0,
  }))

  // Multi-way decision
  .decision('check-status', {
    branches: [
      { condition: (ctx) => ctx.data.status === 'pending', target: 'handle-pending' },
      { condition: (ctx) => ctx.data.status === 'approved', target: 'handle-approved' },
      { condition: (ctx) => ctx.data.status === 'rejected', target: 'handle-rejected' },
    ],
    default: 'handle-unknown',
  })

  .end()
  .build();
```

### Parallel Nodes

```typescript
const workflow = new WorkflowBuilder('parallel-tasks')
  .start()

  // Fork into parallel branches
  .parallel('fetch-all', {
    branches: [
      {
        id: 'fetch-users',
        tasks: [
          { id: 'get-users', handler: async (ctx) => {
            const users = await fetchUsers();
            return { ...ctx.data, users };
          }},
        ],
      },
      {
        id: 'fetch-orders',
        tasks: [
          { id: 'get-orders', handler: async (ctx) => {
            const orders = await fetchOrders();
            return { ...ctx.data, orders };
          }},
        ],
      },
      {
        id: 'fetch-products',
        tasks: [
          { id: 'get-products', handler: async (ctx) => {
            const products = await fetchProducts();
            return { ...ctx.data, products };
          }},
        ],
      },
    ],
  })

  // Join results
  .join('merge-results', {
    merge: (results) => ({
      users: results['fetch-users'].users,
      orders: results['fetch-orders'].orders,
      products: results['fetch-products'].products,
    }),
  })

  .task('process-all', async (ctx) => {
    // All data available here
    return processData(ctx.data);
  })

  .end()
  .build();
```

### Human Task Nodes

```typescript
const workflow = new WorkflowBuilder('approval-flow')
  .start()

  .task('prepare-request', async (ctx) => ({
    ...ctx.data,
    requestId: generateId(),
  }))

  // Human approval task
  .human('manager-approval', {
    title: 'Expense Approval Required',
    description: (ctx) => `Please approve expense of $${ctx.data.amount}`,
    assignee: (ctx) => ctx.data.managerEmail,
    dueDate: (ctx) => addDays(new Date(), 3),
    priority: 'high',
    fields: [
      {
        name: 'decision',
        type: 'select',
        label: 'Decision',
        required: true,
        options: ['approve', 'reject', 'request-info'],
      },
      {
        name: 'comments',
        type: 'textarea',
        label: 'Comments',
      },
      {
        name: 'adjustedAmount',
        type: 'number',
        label: 'Adjusted Amount',
        condition: (ctx) => ctx.data.amount > 5000,
      },
    ],
    // Escalation
    escalation: {
      after: '48h',
      to: 'director@company.com',
    },
  })

  .decision('check-decision', {
    branches: [
      { condition: (ctx) => ctx.data.decision === 'approve', target: 'process-approved' },
      { condition: (ctx) => ctx.data.decision === 'reject', target: 'handle-rejection' },
      { condition: (ctx) => ctx.data.decision === 'request-info', target: 'request-more-info' },
    ],
  })

  .end()
  .build();
```

### Delay Nodes

```typescript
const workflow = new WorkflowBuilder('delayed-tasks')
  .start()

  .task('send-welcome', async (ctx) => {
    await sendWelcomeEmail(ctx.data.email);
    return ctx.data;
  })

  // Wait for duration
  .delay('wait-day', { duration: '24h' })

  .task('send-followup', async (ctx) => {
    await sendFollowupEmail(ctx.data.email);
    return ctx.data;
  })

  // Wait until specific time
  .delay('wait-until', {
    until: (ctx) => ctx.data.scheduledTime,
  })

  .task('execute-scheduled', async (ctx) => {
    return executeScheduledTask(ctx.data);
  })

  .end()
  .build();
```

### Loop Nodes

```typescript
const workflow = new WorkflowBuilder('retry-workflow')
  .start()

  // Retry loop
  .loop('retry-api-call', {
    maxIterations: 3,
    condition: (ctx) => !ctx.data.success,
    tasks: [
      {
        id: 'call-api',
        handler: async (ctx) => {
          try {
            const result = await callApi(ctx.data);
            return { ...ctx.data, success: true, result };
          } catch (error) {
            return { ...ctx.data, success: false, attempts: (ctx.data.attempts || 0) + 1 };
          }
        },
      },
      {
        id: 'wait-before-retry',
        type: 'delay',
        duration: (ctx) => `${Math.pow(2, ctx.data.attempts)}s`, // Exponential backoff
      },
    ],
  })

  // For-each loop
  .loop('process-items', {
    forEach: (ctx) => ctx.data.items,
    itemKey: 'currentItem',
    tasks: [
      {
        id: 'process-item',
        handler: async (ctx) => {
          await processItem(ctx.data.currentItem);
          return ctx.data;
        },
      },
    ],
  })

  .end()
  .build();
```

### Subworkflow Nodes

```typescript
// Define reusable subworkflow
const paymentWorkflow = new WorkflowBuilder('payment-processing')
  .start()
  .task('validate-card', async (ctx) => validateCard(ctx.data))
  .task('charge-card', async (ctx) => chargeCard(ctx.data))
  .task('send-receipt', async (ctx) => sendReceipt(ctx.data))
  .end()
  .build();

// Use in parent workflow
const orderWorkflow = new WorkflowBuilder('order')
  .start()
  .task('create-order', async (ctx) => createOrder(ctx.data))

  // Execute subworkflow
  .subworkflow('process-payment', {
    workflow: paymentWorkflow,
    input: (ctx) => ({
      cardId: ctx.data.cardId,
      amount: ctx.data.total,
    }),
    output: (result, ctx) => ({
      ...ctx.data,
      paymentId: result.paymentId,
    }),
  })

  .task('fulfill-order', async (ctx) => fulfillOrder(ctx.data))
  .end()
  .build();
```

### Webhook Nodes

```typescript
const workflow = new WorkflowBuilder('webhook-workflow')
  .start()

  .task('initiate-external', async (ctx) => {
    const response = await initiateExternalProcess(ctx.data);
    return { ...ctx.data, externalId: response.id };
  })

  // Wait for webhook callback
  .webhook('wait-for-callback', {
    path: (ctx) => `/webhooks/workflow/${ctx.instanceId}`,
    timeout: '1h',
    validation: (payload) => payload.status !== undefined,
    transform: (payload, ctx) => ({
      ...ctx.data,
      externalResult: payload,
    }),
  })

  .task('process-result', async (ctx) => {
    return processExternalResult(ctx.data);
  })

  .end()
  .build();
```

## WorkflowEngine

### Configuration

```typescript
import { WorkflowEngine } from '@philjs/workflow';

const engine = new WorkflowEngine({
  persistence: {
    type: 'indexeddb',        // 'memory' | 'indexeddb' | 'custom'
    key: 'workflows',
  },
  concurrency: {
    maxInstances: 100,        // Max concurrent instances
    maxNodesPerInstance: 10,  // Max concurrent nodes per instance
  },
  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
  },
  timeout: {
    default: '5m',            // Default node timeout
    human: '7d',              // Human task timeout
  },
});
```

### Registering Workflows

```typescript
// Register single workflow
await engine.register(orderWorkflow);

// Register multiple
await engine.registerMany([
  orderWorkflow,
  paymentWorkflow,
  approvalWorkflow,
]);

// Unregister
await engine.unregister('order-processing');
```

### Starting Instances

```typescript
// Start instance
const instance = await engine.start('order-processing', {
  order: { id: 'order-123', total: 500 },
});

// Start with options
const instance = await engine.start('order-processing', inputData, {
  id: 'custom-instance-id',          // Custom instance ID
  correlationId: 'request-456',      // For tracking
  priority: 'high',                  // Execution priority
  timeout: '30m',                    // Instance timeout
  metadata: { userId: 'user-1' },    // Custom metadata
});

// Get instance ID
console.log(instance.id);
```

### Managing Instances

```typescript
// Get instance
const instance = await engine.getInstance('instance-123');

// Get instance status
console.log(instance.status);  // 'running' | 'completed' | 'failed' | 'paused' | 'waiting'

// Pause instance
await engine.pause('instance-123');

// Resume instance
await engine.resume('instance-123');

// Cancel instance
await engine.cancel('instance-123', 'User requested cancellation');

// Retry failed instance
await engine.retry('instance-123');

// List instances
const instances = await engine.listInstances({
  workflowId: 'order-processing',
  status: 'running',
  limit: 50,
});
```

### Events

```typescript
// Instance events
instance.on('nodeStarted', (node) => {
  console.log(`Starting: ${node.id}`);
});

instance.on('nodeCompleted', (node, result) => {
  console.log(`Completed: ${node.id}`, result);
});

instance.on('nodeFailed', (node, error) => {
  console.error(`Failed: ${node.id}`, error);
});

instance.on('humanTaskCreated', (task) => {
  notifyAssignee(task);
});

instance.on('completed', (result) => {
  console.log('Workflow completed:', result);
});

instance.on('failed', (error) => {
  console.error('Workflow failed:', error);
});

// Engine-level events
engine.on('instanceStarted', (instance) => {
  console.log(`Instance started: ${instance.id}`);
});

engine.on('instanceCompleted', (instance, result) => {
  console.log(`Instance completed: ${instance.id}`);
});
```

## Human Tasks

### Task Management

```typescript
import { HumanTaskManager } from '@philjs/workflow';

const taskManager = engine.getTaskManager();

// Get pending tasks
const myTasks = await taskManager.getAssignedTasks('user@company.com');

// Get task by ID
const task = await taskManager.getTask('task-123');

// Complete task
await taskManager.completeTask('task-123', {
  decision: 'approve',
  comments: 'Looks good!',
});

// Reassign task
await taskManager.reassignTask('task-123', 'other@company.com');

// Add comment
await taskManager.addComment('task-123', 'Need more information');

// Escalate task
await taskManager.escalate('task-123', 'director@company.com');
```

### Task Queries

```typescript
// Get all pending tasks
const pending = await taskManager.query({
  status: 'pending',
});

// Get overdue tasks
const overdue = await taskManager.query({
  status: 'pending',
  dueBefore: new Date(),
});

// Get tasks by workflow
const orderTasks = await taskManager.query({
  workflowId: 'order-processing',
});

// Get tasks by priority
const urgent = await taskManager.query({
  priority: 'high',
  status: 'pending',
});
```

## React-style Hooks

### useWorkflowEngine

```typescript
import { useWorkflowEngine } from '@philjs/workflow';

function WorkflowDashboard() {
  const {
    engine,
    isReady,
    instances,
    start,
    pause,
    resume,
    cancel,
  } = useWorkflowEngine();

  const handleStart = async () => {
    await start('order-processing', { order: newOrder });
  };

  return (
    <div>
      <button onClick={handleStart}>Start Workflow</button>

      <h2>Running Instances</h2>
      {instances
        .filter(i => i.status === 'running')
        .map(instance => (
          <InstanceCard
            key={instance.id}
            instance={instance}
            onPause={() => pause(instance.id)}
            onCancel={() => cancel(instance.id)}
          />
        ))}
    </div>
  );
}
```

### useWorkflowInstance

```typescript
import { useWorkflowInstance } from '@philjs/workflow';

function InstanceViewer({ instanceId }: { instanceId: string }) {
  const {
    instance,
    status,
    currentNode,
    data,
    history,
    isLoading,
    error,
    pause,
    resume,
    cancel,
  } = useWorkflowInstance(instanceId);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <h1>Instance: {instance.id}</h1>
      <p>Status: {status}</p>
      <p>Current Node: {currentNode?.id}</p>

      <WorkflowGraph
        workflow={instance.workflow}
        currentNode={currentNode}
        history={history}
      />

      <div className="controls">
        {status === 'running' && (
          <button onClick={pause}>Pause</button>
        )}
        {status === 'paused' && (
          <button onClick={resume}>Resume</button>
        )}
        <button onClick={cancel}>Cancel</button>
      </div>

      <DataViewer data={data} />
      <HistoryTimeline history={history} />
    </div>
  );
}
```

### useHumanTasks

```typescript
import { useHumanTasks } from '@philjs/workflow';

function TaskInbox({ userId }: { userId: string }) {
  const {
    tasks,
    isLoading,
    completeTask,
    reassignTask,
    refresh,
  } = useHumanTasks({ assignee: userId });

  const handleComplete = async (taskId: string, data: any) => {
    await completeTask(taskId, data);
  };

  return (
    <div>
      <h1>My Tasks ({tasks.length})</h1>

      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={(data) => handleComplete(task.id, data)}
          onReassign={(to) => reassignTask(task.id, to)}
        />
      ))}

      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## Types Reference

```typescript
// Workflow definition
interface WorkflowDefinition {
  id: string;
  name: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// Node types
type WorkflowNode =
  | StartNode
  | EndNode
  | TaskNode
  | DecisionNode
  | ParallelNode
  | JoinNode
  | HumanNode
  | DelayNode
  | LoopNode
  | SubworkflowNode
  | WebhookNode
  | TransformNode;

interface TaskNode {
  id: string;
  type: 'task';
  handler: (ctx: WorkflowContext) => Promise<any>;
  timeout?: string;
  retries?: number;
}

interface HumanNode {
  id: string;
  type: 'human';
  title: string;
  description?: string | ((ctx: WorkflowContext) => string);
  assignee: string | ((ctx: WorkflowContext) => string);
  fields: TaskField[];
  dueDate?: Date | ((ctx: WorkflowContext) => Date);
  priority?: 'low' | 'medium' | 'high';
  escalation?: EscalationConfig;
}

interface DecisionNode {
  id: string;
  type: 'decision';
  condition?: (ctx: WorkflowContext) => boolean;
  branches?: DecisionBranch[];
  onTrue?: string;
  onFalse?: string;
  default?: string;
}

// Workflow context
interface WorkflowContext {
  instanceId: string;
  workflowId: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
  currentNode: string;
  history: ExecutionHistory[];
}

// Instance status
type InstanceStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Human task
interface HumanTask {
  id: string;
  instanceId: string;
  workflowId: string;
  nodeId: string;
  title: string;
  description: string;
  assignee: string;
  fields: TaskField[];
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  completedBy?: string;
  result?: Record<string, any>;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `WorkflowEngine` | Workflow execution engine |
| `WorkflowBuilder` | Fluent workflow definition |
| `WorkflowInstance` | Running workflow instance |
| `HumanTaskManager` | Human task management |

### Builder Methods

| Method | Description |
|--------|-------------|
| `start()` | Add start node |
| `end()` | Add end node |
| `task(id, handler)` | Add task node |
| `transform(id, fn)` | Add transform node |
| `decision(id, config)` | Add decision node |
| `parallel(id, config)` | Add parallel fork |
| `join(id, config)` | Add parallel join |
| `human(id, config)` | Add human task |
| `delay(id, config)` | Add delay node |
| `loop(id, config)` | Add loop node |
| `subworkflow(id, config)` | Add subworkflow |
| `webhook(id, config)` | Add webhook wait |
| `build()` | Build workflow |

### Hooks

| Hook | Description |
|------|-------------|
| `useWorkflowEngine()` | Engine management |
| `useWorkflowInstance(id)` | Instance monitoring |
| `useHumanTasks(options)` | Task inbox |
