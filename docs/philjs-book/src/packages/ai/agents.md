# Building Autonomous Agents

Modern application architectures are evolving from static view-and-respond models to environments that integrate **Autonomous Agents** as core logical components.

PhilJS integrates the `@philjs/ai` package directly into the runtime, providing primitives for building agents capable of perception, reasoning, and tool execution alongside traditional application logic.

## The Agency Loop

At the heart of every agent is the **Agency Loop**. Unlike a traditional request/response cycle, the Agency Loop is continuous:

1.  **Perceive**: The agent ingests context (user messages, system state, DOM changes).
2.  **Reason**: The LLM (Large Language Model) analyzes the context and decides on a course of action.
3.  **Act**: The agent executes a tool (e.g., specific API call, file write, database query).
4.  **Observe**: The agent reads the output of the tool.
5.  **Loop**: The observations are fed back into the context, and the cycle repeats until the goal is achieved.

![Agency Loop](../../assets/agency_loop_schematic_1767820304100.png)
*Figure 4-1: The Autonomous Agency Loop*

## Your First Agent

Let's build a simple "DevOps Agent" that can diagnose system health.

```typescript
import { Agent, Tool } from '@philjs/ai';

// 1. Define Tools
const checkSystemHealth = new Tool({
  name: 'check_health',
  description: 'Checks the current CPU and Memory usage',
  execute: async () => {
    return { cpu: '45%', memory: '2.1GB/16GB', status: 'healthy' };
  }
});

// 2. Initialize Agent
const devBot = new Agent({
  name: 'DevBot',
  model: 'gpt-4o',
  instruction: 'You are a helpful DevOps assistant. Diagnose issues concisley.',
  tools: [checkSystemHealth]
});

// 3. Run
const response = await devBot.run("Is the production server okay?");
console.log(response); 
// Output: "Yes, the system is healthy. CPU is at 45% and Memory is nominal."
```

## Advanced: The "Researcher" Pattern

A single loop is often insufficient for complex tasks. The **Researcher Pattern** involves an agent breaking down a high-level goal into sub-questions, gathering data for each, and synthesizing a final report.

![Researcher Pattern](../../assets/ai_researcher_pattern.png)
*Figure 4-2: The Researcher Agent Workflow*

### Vector Memory

To support long-running research, agents need memory. PhilJS provides a built-in `VectorStore` tailored for standard embeddings.

![Vector Memory](../../assets/ai_vector_memory.png)
*Figure 4-3: Vector Memory Architecture*

```typescript
import { Agent, VectorStore } from '@philjs/ai';

const memory = new VectorStore({
  strategy: 'semantic', 
  persistence: 'edge-lite' // Stores in localized IndexedDB or Edge KV
});

const researcher = new Agent({
  name: 'Marie',
  memory: memory,
  instruction: `
    your goal is to research topics exhaustively.
    1. BREAK DOWN the query into search terms.
    2. USE the 'browser' tool to read pages.
    3. SAVE key facts to memory.
    4. SYNTHESIZE a final report.
  `
});
```

### Safety & Guardrails

Giving an AI access to tools is powerful but risky. PhilJS enforces **Strict Tool Schemas**. Every tool execution is validated against a Zod schema before it runs. Furthermore, you can implement `HumanInTheLoop` middleware:

```typescript
devBot.use(async (ctx, next) => {
  if (ctx.toolCall.name === 'deploy_production') {
    await notifyUser(`Agent wants to deploy. Approve?`);
    await waitForApproval();
  }
  return next();
});
```

## The Future of UI
 
 Agents in PhilJS are designed to drive **Generative UI**. An agent can return not just text, but a JSON description of a UI component, which PhilJS renders on the fly.

> [!TIP]
> **Pro Tip**: Use `Agent.render()` to stream React Server Components or PhilJS Signals directly from the LLM's thought process.

This enables interfaces that adapt to the user's intent—building the dashboard they *need* right at the moment they ask for it.
