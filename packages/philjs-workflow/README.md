# @philjs/workflow

Visual workflow engine for PhilJS - node-based execution, human tasks, parallel/conditional flows

<!-- PACKAGE_GUIDE_START -->
## Overview

Visual workflow engine for PhilJS - node-based execution, human tasks, parallel/conditional flows

## Focus Areas

- philjs, workflow, bpmn, orchestration, human-task, state-machine

## Entry Points

- packages/philjs-workflow/src/index.ts

## Quick Start

```ts
import { ExecutionContext, ExecutionHistoryEntry, FormField } from '@philjs/workflow';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- ExecutionContext
- ExecutionHistoryEntry
- FormField
- HumanTask
- NodeConfig
- NodeHandler
- NodeType
- PortDefinition
- TriggerConfig
- TriggerDefinition
- VariableDefinition
- WorkflowBuilder
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/workflow
```
## Usage

```ts
import { ExecutionContext, ExecutionHistoryEntry, FormField } from '@philjs/workflow';
```

## Scripts

- pnpm run build
- pnpm run test

## Compatibility

- Node >=24
- TypeScript 6

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-workflow/src/index.ts

### Public API
- Direct exports: ExecutionContext, ExecutionHistoryEntry, FormField, HumanTask, NodeConfig, NodeHandler, NodeType, PortDefinition, TriggerConfig, TriggerDefinition, VariableDefinition, WorkflowBuilder, WorkflowDefinition, WorkflowEdge, WorkflowEngine, WorkflowInstance, WorkflowNode, WorkflowStatus, useHumanTasks, useWorkflowEngine, useWorkflowInstance
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
